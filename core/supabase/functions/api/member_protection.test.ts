// Member protection and resolution safe mode — MP-06, MP-07, RS-03.
//
// The negatives: a death flagged from a rumor, a payout to an unverified
// claimant, an expulsion noticed to a member who cannot be told, and a
// safe-mode exit on one person's judgment — each refuses rather than records.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { makeDrillDb } from "../drill/fake_db.ts";
import { OPS_CTX, req } from "./test_helpers.ts";
import {
  postDeathReport, postEstateClaim, postEstatePayout, postExpulsion,
  postExpulsionClose, postSafeModeActivate, postSafeModeDeactivate, safeModeGate,
} from "./member_protection.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
const CTX = OPS_CTX;
const codes = (rows: Record<string, Any[]>) =>
  (rows["core.event"] ?? []).map((e) => String(e.code));

function seedMember(dbx: Any, o: Record<string, unknown> = {}) {
  dbx.rows["core.entity"] = [{ id: "e1", email: "m@example.test", provenance: "production", ...o }];
  dbx.rows["core.account"] = [
    { id: "a1", entity_id: "e1", balance: 100_000, lock_type: null, provenance: "production" },
    { id: "a2", entity_id: "e1", balance: 50_000, lock_type: null, provenance: "production" },
  ];
}

// ------------------------------------------------------------------ MP-07

Deno.test("MP-07: a death is flagged from a DOCUMENT, not a rumor", async () => {
  const dbx = makeDrillDb();
  seedMember(dbx);
  const res = await postDeathReport(
    req({ date_of_death: "2026-07-01" }), "e1", dbx.client, "t", CTX,
  );
  assertEquals(res.status, 400, "no death certificate, no flag");
  assertEquals(dbx.rows["core.account"][0].lock_type, null);
});

Deno.test("MP-07: a death report locks EVERY account, one event per account", async () => {
  const dbx = makeDrillDb();
  seedMember(dbx);
  const res = await postDeathReport(
    req({ date_of_death: "2026-07-01", death_certificate_ref: "doc_dc_1" }),
    "e1", dbx.client, "t", CTX,
  );
  assertEquals((await res.json()).data.accounts_flagged, 2);
  // "the member's accounts were flagged" is only true account by account
  assert(dbx.rows["core.account"].every((a) => a.lock_type === "deceased"));
  const c = codes(dbx.rows);
  assertEquals(c.filter((x) => x === "account.death_flag.applied").length, 2);
  assert(c.includes("member.death.reported"));
});

Deno.test("MP-07: a payout to an UNVERIFIED claimant is refused", async () => {
  const dbx = makeDrillDb();
  seedMember(dbx);
  const claim = await postEstateClaim(
    req({
      claimant: "A. Heir", date_of_death: "2026-07-01",
      death_certificate_ref: "doc_dc_1", authority_document_ref: "doc_letters_1",
    }),
    "e1", dbx.client, "t", CTX,
  );
  const { id } = (await claim.json()).data;
  // the claimant's verification is a real core.verification row, born pending
  assertEquals(dbx.rows["core.verification"][0].status, "pending");

  const res = await postEstatePayout(req({}), id, dbx.client, "t", CTX);
  assertEquals(res.status, 409);
  // still only documented — the schema's default status, not paid
  assertEquals(dbx.rows["core.estate_claim"][0].status, "documented");
  assert(!codes(dbx.rows).includes("estate.payout.sent"));
});

Deno.test("MP-07: an approved claimant is paid the balance net of amounts owed — once", async () => {
  const dbx = makeDrillDb();
  seedMember(dbx);
  const claim = await postEstateClaim(
    req({ claimant: "A. Heir", date_of_death: "2026-07-01", death_certificate_ref: "doc_dc_1" }),
    "e1", dbx.client, "t", CTX,
  );
  const { id } = (await claim.json()).data;
  dbx.rows["core.verification"][0].status = "approved";

  const res = await postEstatePayout(req({ amounts_owed_cents: 30_000 }), id, dbx.client, "t", CTX);
  // 150,000 of balances net of 30,000 owed
  assertEquals((await res.json()).data.payout_cents, 120_000);
  assertEquals(dbx.rows["core.estate_claim"][0].status, "paid");
  assert(codes(dbx.rows).includes("estate.payout.sent"));

  const again = await postEstatePayout(req({}), id, dbx.client, "t", CTX);
  assertEquals(again.status, 409, "an estate is not paid twice");
});

// ------------------------------------------------------------------ MP-06

Deno.test("MP-06: an expulsion cannot be NOTICED to a member with no deliverable contact", async () => {
  const dbx = makeDrillDb();
  seedMember(dbx, { email: null, address: null });
  const res = await postExpulsion(
    req({ grounds: "abuse of services", decided_by: "board_1", meeting_date: "2026-08-01" }),
    "e1", dbx.client, "t", CTX,
  );
  // a notice that cannot be delivered denies the hearing right attached to it
  assertEquals(res.status, 422);
  assertEquals((dbx.rows["core.expulsion"] ?? []).length, 0);
});

Deno.test("MP-06: closing nets amounts owed and locks the accounts 'expelled'", async () => {
  const dbx = makeDrillDb();
  seedMember(dbx);
  const exp = await postExpulsion(
    req({
      grounds: "abuse of services", decided_by: "board_1",
      meeting_date: "2026-08-01", amounts_owed_cents: 40_000,
    }),
    "e1", dbx.client, "t", CTX,
  );
  assertEquals(exp.status, 201);
  const { id } = (await exp.json()).data;
  const c1 = codes(dbx.rows);
  assert(c1.includes("member.expulsion.decided"));
  assert(c1.includes("member.expulsion_notice.sent"));

  const closed = await postExpulsionClose(req({}), id, dbx.client, "t", CTX);
  assertEquals((await closed.json()).data.payout_cents, 110_000);
  assert(dbx.rows["core.account"].every((a) => a.lock_type === "expelled"));
  assertEquals(dbx.rows["core.expulsion"][0].status, "final");
  const c2 = codes(dbx.rows);
  assert(c2.includes("expulsion.board_report.filed"));
  assert(c2.includes("member.expulsion_payout.sent"));

  const again = await postExpulsionClose(req({}), id, dbx.client, "t", CTX);
  assertEquals(again.status, 409);
});

// ------------------------------------------------------------------ RS-03

Deno.test("RS-03: safe mode decides every transaction and leaves evidence EITHER WAY", async () => {
  const dbx = makeDrillDb();
  await postSafeModeActivate(
    req({
      trigger_basis: "liquidity stress", per_txn_cap_cents: 100_000,
      restricted_types: ["wire"], activated_by: "ceo_1",
    }),
    dbx.client, "t", CTX,
  );
  assert(codes(dbx.rows).includes("safe_mode.activated"));

  const under = await safeModeGate(dbx.client, 50_000, "ach", "txn_1", CTX);
  assertEquals(under.restricted, false);
  const over = await safeModeGate(dbx.client, 150_000, "ach", "txn_2", CTX);
  assertEquals(over.restricted, true);
  const wire = await safeModeGate(dbx.client, 1_000, "wire", "txn_3", CTX);
  assertEquals(wire.restricted, true, "a restricted TYPE refuses regardless of amount");

  // an examiner asking "what did safe mode actually do" reads decisions
  const decisions = (dbx.rows["core.event"] ?? [])
    .filter((e) => e.code === "safe_mode.transaction.decided")
    .map((e) => (e.payload as Any).decision);
  assertEquals(decisions, ["allowed", "refused", "refused"]);
});

Deno.test("RS-03: deactivation takes TWO different authorizers", async () => {
  const dbx = makeDrillDb();
  const act = await postSafeModeActivate(
    req({ trigger_basis: "stress", per_txn_cap_cents: 100_000, activated_by: "ceo_1" }),
    dbx.client, "t", CTX,
  );
  const { id } = (await act.json()).data;

  const solo = await postSafeModeDeactivate(
    req({ authorized_by: "ceo_1", second_authorizer: "ceo_1" }), id, dbx.client, "t", CTX,
  );
  // one person's judgment was the failure mode that got the institution here
  assertEquals(solo.status, 422);
  assertEquals(dbx.rows["core.safe_mode"][0].status, "active");

  const dual = await postSafeModeDeactivate(
    req({ authorized_by: "ceo_1", second_authorizer: "cro_1" }), id, dbx.client, "t", CTX,
  );
  assertEquals(dual.status, 200);
  assertEquals(dbx.rows["core.safe_mode"][0].status, "deactivated");
  assert(codes(dbx.rows).includes("safe_mode.deactivated"));

  // a gate consulted after deactivation restricts nothing
  const after = await safeModeGate(dbx.client, 999_999_999, "wire", "txn_9", CTX);
  assertEquals(after.restricted, false);
});
