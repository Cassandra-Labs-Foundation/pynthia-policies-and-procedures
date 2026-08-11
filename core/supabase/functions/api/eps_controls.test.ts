// EPS authentication and fraud controls — EPS-05 lockout, EPS-07 card
// controls and positive pay.
//
// The negatives: a lockout applied in a LATER sweep leaves the window an
// attacker uses, a "change" reported on a first application is a modification
// that never happened, and an undecided positive-pay exception past its cutoff
// pays by default — which is the whole risk, so it is reported by name.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { makeDrillDb } from "../drill/fake_db.ts";
import { OPS_CTX, req } from "./test_helpers.ts";
import {
  AUTH_LOCKOUT_THRESHOLD, postAuthEvent, postCardControl, postFraudTrendReview,
  postPospayDecision, postPospayException,
} from "./eps_controls.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
const CTX = OPS_CTX;
const codes = (rows: Record<string, Any[]>) =>
  (rows["core.event"] ?? []).map((e) => String(e.code));

const fail = (o: Record<string, unknown> = {}) =>
  req({ subject_ref: "m1", channel: "online", outcome: "failure", ...o });

// ------------------------------------------------------------------ EPS-05

Deno.test("EPS-05: the third consecutive failure locks out IN THE SAME WRITE", async () => {
  const dbx = makeDrillDb();
  for (let i = 0; i < AUTH_LOCKOUT_THRESHOLD; i++) {
    await postAuthEvent(fail(), dbx.client, "t", CTX);
  }
  const rows = dbx.rows["core.eps_auth_event"];
  assertEquals(rows.map((r) => r.decision), ["denied", "denied", "locked_out"]);
  // ck_eps_auth_lockout_stamped: a lockout decision and its timestamp must
  // agree — the fake enforces the real constraint
  assert(rows[2].locked_out_at !== null);
  assertEquals(dbx.violations, []);
  const c = codes(dbx.rows);
  assert(c.includes("eps.auth_lockout.applied"));
  assert(c.includes("eps.auth.failure_count"));
});

Deno.test("EPS-05: a challenged failure records HOW the member was challenged", async () => {
  const dbx = makeDrillDb();
  await postAuthEvent(fail({ challenge_method: "otp_sms" }), dbx.client, "t", CTX);
  assertEquals(dbx.rows["core.eps_auth_event"][0].decision, "challenged");
  assertEquals(dbx.rows["core.eps_auth_event"][0].challenge_method, "otp_sms");
  const ev = (dbx.rows["core.event"] ?? []).find((e) => e.code === "eps.auth.challenged");
  assertEquals((ev!.payload as Any).challenge_method, "otp_sms");
  assertEquals(dbx.violations, []);
});

Deno.test("EPS-05: a success is allowed and carries a zero failure count", async () => {
  const dbx = makeDrillDb();
  await postAuthEvent(fail({ outcome: "success" }), dbx.client, "t", CTX);
  assertEquals(dbx.rows["core.eps_auth_event"][0].decision, "allowed");
  assertEquals(dbx.rows["core.eps_auth_event"][0].failure_count, 0);
  assert(!codes(dbx.rows).includes("eps.auth_lockout.applied"));
});

Deno.test("an auth event with no usable outcome is refused", async () => {
  const dbx = makeDrillDb();
  const res = await postAuthEvent(
    req({ subject_ref: "m1", channel: "online", outcome: "maybe" }), dbx.client, "t", CTX,
  );
  assertEquals(res.status, 400);
  assertEquals((dbx.rows["core.eps_auth_event"] ?? []).length, 0);
});

// ------------------------------------------------------------------ EPS-07

Deno.test("EPS-07: the FIRST application of a card control is not a 'change'", async () => {
  const dbx = makeDrillDb();
  await postCardControl(
    req({ card_ref: "c1", control_type: "travel", new_value: "on", applied_by: "ops_1" }),
    dbx.client, "t", CTX,
  );
  assertEquals(dbx.rows["core.eps_card_control"][0].previous_value, null);
  const c = codes(dbx.rows);
  assert(c.includes("eps.card_control.applied"));
  // emitting `changed` here would report a modification that never happened
  assert(!c.includes("eps.card_control.changed"));
});

Deno.test("EPS-07: a changed control carries the value it replaced", async () => {
  const dbx = makeDrillDb();
  await postCardControl(
    req({ card_ref: "c1", control_type: "travel", new_value: "on", applied_by: "ops_1" }),
    dbx.client, "t", CTX,
  );
  await postCardControl(
    req({ card_ref: "c1", control_type: "travel", new_value: "off", applied_by: "ops_1" }),
    dbx.client, "t", CTX,
  );
  const ev = (dbx.rows["core.event"] ?? []).find((e) => e.code === "eps.card_control.changed");
  assertEquals((ev!.payload as Any).previous_value, "on");
  assertEquals((ev!.payload as Any).new_value, "off");
});

Deno.test("EPS-07: a pospay decision lands complete — decision, decider, timestamp", async () => {
  const dbx = makeDrillDb();
  await postPospayException(
    req({
      account_ref: "a1", item_ref: "chk_9", amount_cents: 125_000,
      reason: "payee mismatch", cutoff_at: "2099-01-01T00:00:00.000Z",
    }),
    dbx.client, "t", CTX,
  );
  assert(codes(dbx.rows).includes("eps.pospay_exception.presented"));
  const res = await postPospayDecision(
    req({ decision: "return", decided_by: "ops_1" }), "epspp_chk_9", dbx.client, "t", CTX,
  );
  assertEquals(res.status, 200);
  const row = dbx.rows["core.eps_pospay_exception"][0];
  assertEquals(row.decision, "return");
  assertEquals(row.decided_by, "ops_1");
  // ck_eps_pospay_decision_complete would flag a partial decision
  assertEquals(dbx.violations, []);
  assert(codes(dbx.rows).includes("eps.pospay_exception.decided"));
});

Deno.test("an undecided exception past its cutoff PAYS BY DEFAULT, and the review says so", async () => {
  const dbx = makeDrillDb();
  // past cutoff, undecided — the risk
  await postPospayException(
    req({
      account_ref: "a1", item_ref: "chk_old", amount_cents: 1,
      reason: "r", cutoff_at: "2026-01-01T00:00:00.000Z",
    }),
    dbx.client, "t", CTX,
  );
  // future cutoff, undecided — still in the window
  await postPospayException(
    req({
      account_ref: "a1", item_ref: "chk_new", amount_cents: 1,
      reason: "r", cutoff_at: "2099-01-01T00:00:00.000Z",
    }),
    dbx.client, "t", CTX,
  );
  // past cutoff but DECIDED in time
  await postPospayException(
    req({
      account_ref: "a1", item_ref: "chk_done", amount_cents: 1,
      reason: "r", cutoff_at: "2026-01-01T00:00:00.000Z",
    }),
    dbx.client, "t", CTX,
  );
  await postPospayDecision(
    req({ decision: "pay", decided_by: "ops_1" }), "epspp_chk_done", dbx.client, "t", CTX,
  );

  const res = await postFraudTrendReview(req({}), dbx.client, "t", CTX);
  const body = (await res.json()).data;
  assertEquals(body.examined, 3);
  assertEquals(body.undecided_past_cutoff, 1);
  assertEquals(body.undecided_past_cutoff_ids, ["epspp_chk_old"]);
  assert(body.note, "paid-by-default is reported by name, never folded into a total");
  assert(codes(dbx.rows).includes("eps.fraud_trend_review.completed"));
});
