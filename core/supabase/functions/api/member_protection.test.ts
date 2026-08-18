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

// The mirrors are seeded DELIBERATELY WRONG. A payout is sized from the
// ledger, so these numbers must not reach the total — if a future change
// re-reads core.account.balance, every payout assertion below moves and the
// test says so instead of the estate finding out.
const LEDGER = { bln_a1: 100_000, bln_a2: 50_000 };

function seedMember(dbx: Any, o: Record<string, unknown> = {}) {
  dbx.rows["core.entity"] = [{ id: "e1", email: "m@example.test", provenance: "production", ...o }];
  dbx.rows["core.account"] = [
    {
      id: "a1", entity_id: "e1", blnk_balance_id: "bln_a1", balance: 999_999,
      lock_type: null, provenance: "production",
    },
    {
      id: "a2", entity_id: "e1", blnk_balance_id: "bln_a2", balance: 1,
      lock_type: null, provenance: "production",
    },
  ];
}

/** A Blnk that answers from LEDGER; `broken` makes every balance read fail. */
function blnk(broken = false): Any {
  return {
    apiUrl: "https://blnk.test",
    apiKey: "k",
    fetchFn: (input: RequestInfo | URL) => {
      if (broken) return Promise.reject(new Error("ledger unreachable"));
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const id = url.split("/balances/")[1] ?? "";
      return Promise.resolve(
        new Response(JSON.stringify({ balance: LEDGER[id as keyof typeof LEDGER] ?? 0 }), {
          headers: { "content-type": "application/json" },
        }),
      );
    },
  };
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

  const res = await postEstatePayout(req({}), id, dbx.client, blnk(), "t", CTX);
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

  const res = await postEstatePayout(req({ amounts_owed_cents: 30_000 }), id, dbx.client, blnk(), "t", CTX);
  // 150,000 of LEDGER balances (not the 1,000,000 of stale mirror) net of 30,000 owed
  assertEquals((await res.json()).data.payout_cents, 120_000);
  assertEquals(dbx.rows["core.estate_claim"][0].status, "paid");
  assert(codes(dbx.rows).includes("estate.payout.sent"));

  const again = await postEstatePayout(req({}), id, dbx.client, blnk(), "t", CTX);
  assertEquals(again.status, 409, "an estate is not paid twice");
});

Deno.test("MP-07: a payout FAILS CLOSED when the ledger cannot be read", async () => {
  const dbx = makeDrillDb();
  seedMember(dbx);
  const claim = await postEstateClaim(
    req({ claimant: "A. Heir", date_of_death: "2026-07-01", death_certificate_ref: "doc_dc_1" }),
    "e1", dbx.client, "t", CTX,
  );
  const { id } = (await claim.json()).data;
  dbx.rows["core.verification"][0].status = "approved";

  // The mirror would happily answer 1,000,000 here. Paying the wrong amount to
  // an estate is not undone by a retry; not paying today is.
  const res = await postEstatePayout(req({}), id, dbx.client, blnk(true), "t", CTX);
  assertEquals(res.status, 502);
  assertEquals(dbx.rows["core.estate_claim"][0].status, "documented");
  assert(!codes(dbx.rows).includes("estate.payout.sent"));
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

  const closed = await postExpulsionClose(req({}), id, dbx.client, blnk(), "t", CTX);
  assertEquals((await closed.json()).data.payout_cents, 110_000);
  assert(dbx.rows["core.account"].every((a) => a.lock_type === "expelled"));
  assertEquals(dbx.rows["core.expulsion"][0].status, "final");
  const c2 = codes(dbx.rows);
  assert(c2.includes("expulsion.board_report.filed"));
  assert(c2.includes("member.expulsion_payout.sent"));

  const again = await postExpulsionClose(req({}), id, dbx.client, blnk(), "t", CTX);
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
