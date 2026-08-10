// Truth in Savings, member lifecycle, fair-lending gaps.
//
// The negatives are the point of this file. A disclosure subsystem that only
// proves "we sent it" is a mailing list; what makes it a control is that it
// refuses the deliveries that would be invalid, and says why.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { makeDrillDb } from "../drill/fake_db.ts";
import { OPS_CTX, req } from "./test_helpers.ts";
import {
  apyBp, postApplicationIntake, postApplicationOptions, postBalanceInquiry,
  postDisclosureDelivery, postDisclosureTemplate, postInterestAccrualRun, postInterestConfig,
  postGmiCollection, postMemberRecordExport, postMemberRestriction, postMembership,
  postStatement,
} from "./deposits_member.ts";
import { postCardReissue } from "./cards.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
const CTX = OPS_CTX;
const codes = (rows: Record<string, Any[]>) =>
  (rows["core.event"] ?? []).map((e) => String(e.code));

// ------------------------------------------------------------------ TIS-06 APY

Deno.test("APY is DERIVED from the rate and the compounding", () => {
  // 2% compounded daily is not 2%. A stored APY that disagrees with its own
  // inputs is exactly the disclosure error TIS-06 exists to catch, which is why
  // this is computed rather than accepted from the caller.
  assertEquals(apyBp(200, "daily"), 202);
  assertEquals(apyBp(200, "annual"), 200);
  assert(apyBp(500, "daily") > apyBp(500, "quarterly"));
});

// ------------------------------------------------------- TIS-01/02 deliveries

Deno.test("E-SIGN: electronic delivery with no captured consent is REFUSED", async () => {
  const dbx = makeDrillDb();
  const res = await postDisclosureDelivery(
    req({ kind: "account_opening", member_ref: "m1", channel: "esign", trigger_event: "t" }),
    dbx.client, "t", CTX,
  );
  assertEquals(res.status, 409);
  assertEquals(
    (dbx.rows["core.disclosure_delivery"] ?? []).length, 0,
    "a row saying 'we emailed it' would read as a discharged obligation",
  );
});

Deno.test("a delivery SNAPSHOTS the terms it disclosed, not a pointer to them", async () => {
  const dbx = makeDrillDb();
  await postDisclosureDelivery(
    req({
      kind: "account_opening", member_ref: "m1", account_ref: "a1", trigger_event: "t",
      rate_bp: 200, compounding: "daily", account_type: "share_certificate",
    }),
    dbx.client, "t", CTX,
  );
  const d = dbx.rows["core.disclosure_delivery"][0];
  // the APY the member SAW, frozen. If the configuration moves tomorrow, this
  // row still shows what was disclosed today.
  assertEquals(d.product_interest_rate_bp, 200);
  assertEquals(d.product_apy_bp, 202);
  assertEquals(d.account_account_type, "share_certificate");
});

Deno.test("a detected disclosure error opens its own finding", async () => {
  const dbx = makeDrillDb();
  await postDisclosureDelivery(
    req({
      kind: "account_opening", member_ref: "m1", trigger_event: "t",
      error_detected: true, error_detail: "wrong APY printed",
    }),
    dbx.client, "t", CTX,
  );
  assert(codes(dbx.rows).includes("disclosure.error.detected"));
});

// ------------------------------------------------------------- TIS-06 interest

Deno.test("accruing interest with no configuration is refused", async () => {
  const dbx = makeDrillDb();
  const res = await postInterestAccrualRun(
    req({ period: "2026-07", config_id: "does_not_exist" }), dbx.client, "t", CTX,
  );
  assert(res.status >= 400, "an accrual with no rate on file is not a rounding question");
});

Deno.test("the accrual run carries the config it ran against", async () => {
  const dbx = makeDrillDb();
  await postInterestConfig(
    req({
      product_code: "share_savings", rate_bp: 200, compounding: "daily",
      balance_method: "daily_balance",
    }),
    dbx.client, "t", CTX,
  );
  const cfg = dbx.rows["core.product_interest_config"][0];
  await postInterestAccrualRun(
    req({ period: "2026-07", config_id: String(cfg.id), accounts: [{ balance_cents: 1_000_000 }] }),
    dbx.client, "t", CTX,
  );
  assertEquals(dbx.rows["core.interest_accrual_run"].length, 1);
  assert(codes(dbx.rows).includes("interest.accrual_run.completed"));
});

// ------------------------------------------------------------ TIS-08 balances

Deno.test("TIS-08: the balance disclosed separates ledger from available", async () => {
  const dbx = makeDrillDb();
  await postBalanceInquiry(
    req({ balance_cents: 100_000, held_cents: 30_000, reg_e_opt_in: true }),
    "acct_1", dbx.client, "t", CTX,
  );
  const ev = (dbx.rows["core.event"] ?? []).find((e) => e.code === "balance.disclosed");
  // Telling a member their ledger balance while a hold is on is telling them a
  // number they cannot spend — and then charging them for believing it.
  assertEquals((ev!.payload as Any).available_balance_cents, 70_000);
  assertEquals((ev!.payload as Any).ledger_balance_cents, 100_000);
});

Deno.test("the statement carries year-to-date fees, not just the period's", async () => {
  const dbx = makeDrillDb();
  await postStatement(
    req({
      account_ref: "a1", period: "2026-07", opening_balance_cents: 1,
      closing_balance_cents: 2, fees_ytd_cents: 4_500, overdraft_fees_ytd_cents: 3_000,
    }),
    dbx.client, "t", CTX,
  );
  const ev = (dbx.rows["core.event"] ?? []).find((e) => e.code === "fee.ytd_total");
  assert(ev, "1030.6(a)(4): the YTD total is the disclosure, not the monthly line");
});

// --------------------------------------------------------------- MP membership

Deno.test("an eligibility denial with no basis is refused", async () => {
  const dbx = makeDrillDb();
  const res = await postMembership(req({ entity_ref: "e1", eligible: false }), dbx.client, "t", CTX);
  assertEquals(res.status, 400);
  assertEquals((dbx.rows["core.membership"] ?? []).length, 0);
});

Deno.test("MP-01: determination and activation are separate events", async () => {
  const dbx = makeDrillDb();
  await postMembership(
    req({ entity_ref: "e1", eligible: true, eligibility_basis: "employer group" }),
    dbx.client, "t", CTX,
  );
  const c = codes(dbx.rows);
  // Collapsing these would make "verified but never activated" invisible.
  assert(c.includes("member.eligibility.determined"));
  assert(c.includes("member.activated"));
});

Deno.test("MP-05: a restriction lands on the ACCOUNT, not only the membership", async () => {
  const dbx = makeDrillDb();
  dbx.rows["core.account"] = [{
    id: "a1", entity_id: "e1", status: "open", account_type: "share",
    balance: 0, partner_id: "p1", provenance: "production",
  }];
  await postMembership(
    req({ entity_ref: "e1", eligible: true, eligibility_basis: "b" }), dbx.client, "t", CTX,
  );
  await postMemberRestriction(
    req({
      restriction: "frozen", reason: "suspected takeover", account_ref: "a1",
      contact: { email: "m@example.test" }, amounts_owed_cents: 100,
    }),
    "mbr_e1", dbx.client, "t", CTX,
  );
  // If the restriction lives only on the membership row, the notice is true and
  // the money still moves.
  assertEquals(dbx.rows["core.account"][0].restriction, "frozen");
  // "admin" is the schema's lock vocabulary (account_lock_type_check) — the
  // old "full" was an invented value the live schema refused
  assertEquals(dbx.rows["core.account"][0].lock_type, "admin");
});

Deno.test("MP-08: a bulk member-record export with no stated purpose is refused", async () => {
  const dbx = makeDrillDb();
  const res = await postMemberRecordExport(
    req({ record_count: 5000 }), "mbr_e1", dbx.client, "t", CTX,
  );
  assertEquals(res.status, 400, "an unexplained bulk export is the shape of an exfiltration");
  assert(!codes(dbx.rows).includes("record.bulk_export.completed"));
});

// ------------------------------------------------------------- MP-02 takeover

Deno.test("MP-02: a card reissue inside the address hold is recorded AND blocked", async () => {
  const dbx = makeDrillDb();
  dbx.rows["core.member_address_change"] = [{
    id: "mac_1", member_ref: "mbr_e1", new_address: { line1: "2 New Ave" },
    changed_at: "2026-07-19T12:00:00.000Z", hold_expires_at: "2026-08-18T12:00:00.000Z",
    provenance: "production",
  }];
  await postCardReissue(req({ ship_to_address_id: "addr_1" }), "mbr_e1", dbx.client, "t", CTX);
  const card = dbx.rows["core.card"][0];
  assertEquals(card.address_hold_blocked, true);
  assertEquals(card.status, "blocked");
  // Blocked and INVISIBLE would be the worse outcome: the red-flags review has
  // nothing to review.
  assert(codes(dbx.rows).includes("card.request_during_address_hold"));
});

Deno.test("MP-02: the same reissue with no open hold proceeds", async () => {
  const dbx = makeDrillDb();
  dbx.rows["core.member_address_change"] = [{
    id: "mac_1", member_ref: "mbr_e1", new_address: {},
    changed_at: "2026-01-01T00:00:00.000Z", hold_expires_at: "2026-01-31T00:00:00.000Z",
    provenance: "production",
  }];
  await postCardReissue(req({}), "mbr_e1", dbx.client, "t", CTX);
  assertEquals(dbx.rows["core.card"][0].address_hold_blocked, false);
  assertEquals(dbx.rows["core.card"][0].status, "active");
});

// ------------------------------------------------------------ FL-02 / FL-08

Deno.test("FL-02: intake records the channel and product the rules turn on", async () => {
  const dbx = makeDrillDb();
  dbx.rows["core.loan_application"] = [{
    id: "app_1", status: "completed", funding_block_state: "open", provenance: "production",
  }];
  await postApplicationIntake(
    req({ channel: "online", product_type: "refinance", applicant_state: "NC",
          geography: "37063000101" }),
    "app_1", dbx.client, "t", CTX,
  );
  const a = dbx.rows["core.loan_application"][0];
  assertEquals(a.channel, "online");
  // no geography means no redlining test; the column is the whole point
  assertEquals(a.geography, "37063000101");
});

Deno.test("FL-08: fewer than three options must say WHY", async () => {
  const dbx = makeDrillDb();
  dbx.rows["core.loan_application"] = [{
    id: "app_1", status: "completed", funding_block_state: "open", provenance: "production",
  }];
  await postApplicationOptions(
    req({ options_presented: ["lowest_rate"], final_action: "denied" }),
    "app_1", dbx.client, "t", CTX,
  );
  const ev = (dbx.rows["core.event"] ?? []).find((e) => e.code === "application.options.presented");
  assertEquals((ev!.payload as Any).safe_harbour_met, false);
  assertEquals(
    dbx.rows["core.loan_application"][0].option_shortfall_reason, "unexplained",
    "a shortfall that records no reason is named as unexplained rather than left blank",
  );
});

Deno.test("FL-08: three options meet the safe harbour and record no shortfall", async () => {
  const dbx = makeDrillDb();
  dbx.rows["core.loan_application"] = [{
    id: "app_1", status: "completed", funding_block_state: "open", provenance: "production",
  }];
  await postApplicationOptions(
    req({
      options_presented: ["lowest_rate", "lowest_rate_no_risky", "lowest_total_cost"],
      final_action: "approved",
    }),
    "app_1", dbx.client, "t", CTX,
  );
  assertEquals(dbx.rows["core.loan_application"][0].option_shortfall_reason, null);
});

Deno.test("a partner token cannot reach the deposits routes at all", async () => {
  const dbx = makeDrillDb();
  const res = await postDisclosureTemplate(
    req({ kind: "account_opening", version: "v1", content_ref: "r", approved_by: "c" }),
    dbx.client, "t", { ...CTX, actorType: "partner" } as Any,
  );
  assertEquals(res.status, 404);
});

Deno.test("GMI: a partial answer is INCOMPLETE and opens a finding", async () => {
  // Caught by the mutation sweep: `every` → `some` survived, because nothing
  // asserted the partial case. Reg B wants ethnicity, race AND sex, and a
  // record with one of the three reads as collected when it was not.
  const dbx = makeDrillDb();
  await postGmiCollection(
    req({ gmi: { ethnicity: "not_provided" }, hmda_reportable: true }),
    "app_1", dbx.client, "t", CTX,
  );
  const ev = (dbx.rows["core.event"] ?? []).find((e) => e.code === "applicant.gmi_responses");
  assertEquals((ev!.payload as Any).complete, false);
  assert(codes(dbx.rows).includes("finding.opened"));
});

Deno.test("GMI: all three answers are complete and open no finding", async () => {
  const dbx = makeDrillDb();
  await postGmiCollection(
    req({
      gmi: { ethnicity: "not_provided", race: "not_provided", sex: "not_provided" },
      hmda_reportable: true,
    }),
    "app_2", dbx.client, "t", CTX,
  );
  const ev = (dbx.rows["core.event"] ?? []).find((e) => e.code === "applicant.gmi_responses");
  assertEquals((ev!.payload as Any).complete, true);
  assert(!codes(dbx.rows).includes("finding.opened"));
});
