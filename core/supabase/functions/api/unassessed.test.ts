// EVERY PLACE A NULL IS LOAD-BEARING.
//
// WHY THIS FILE EXISTS. Across this system there are two kinds of "no value":
//
//   NOT BREACHED  — the check ran and the answer was no.
//   UNASSESSED    — nobody configured the thing the check needs, so there IS
//                   no answer.
//
// Collapsing the second into the first is the most flattering possible error:
// an institution that never set a limit reads as an institution that never
// exceeded one. Every site below deliberately reports NO VERDICT rather than a
// passing one, and the NULL is the record of that.
//
// **These tests fire when someone POPULATES the gap, not when the code breaks.**
// That is the point. The failure mode they guard is not a bug — it is somebody
// making a control look green by supplying a plausible default: a fabricated
// OFAC list version, a threshold nobody approved, a `false` where the honest
// answer is `null`. Ordinary tests cannot see that, because the fabricated
// value makes everything downstream work.
//
// Generalised from the BSA artifact, where a mutation that set
// `ofac_screen.list_version` to "OFAC-2026-07" was caught by exactly this kind
// of assertion. Anywhere a NULL carries meaning, the same guard applies.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { makeDrillDb } from "../drill/fake_db.ts";
import { OPS_CTX, req } from "./test_helpers.ts";
import { postOfacScreen, postPepScreen } from "./bsa_program.ts";
import { postCapitalPosition } from "./capital.ts";
import { postCashEnterprisePosition, postCashOverShort, putCashAsset } from "./cash_ops.ts";
import { postCdaTrade } from "./cda.ts";
import { postAlmSimulation, postLiquidityReport, postTrade } from "./investment.ts";
import { postAppraisalComplete, postAppraisalOrder, postFairLendingAnalysis } from "./lending_underwriting.ts";
import { postComplaintTrend } from "./complaints.ts";
import { postLoanParty } from "./lending.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
const CTX = OPS_CTX;
const codes = (rows: Record<string, Any[]>) =>
  (rows["core.event"] ?? []).map((e) => String(e.code));

// ---------------------------------------------- 1. the screens have no list

Deno.test("NULL: the OFAC screen cannot name its list, and every row says so", async () => {
  const dbx = makeDrillDb();
  await postOfacScreen(
    req({ subject_kind: "entity", subject_ref: "e1", name: "Clean" }), dbx.client, "t", CTX,
  );
  assertEquals(
    dbx.rows["core.ofac_screen"][0].list_version, null,
    "a populated list_version would assert a comparison set that does not exist",
  );
  const ev = (dbx.rows["core.event"] ?? []).find((e) => e.code === "ofac.cleared");
  assertEquals((ev!.payload as Any)["ofac.list_version"], null);
});

Deno.test("NULL: the PEP screen has no list either", async () => {
  const dbx = makeDrillDb();
  await postPepScreen(req({ entity_ref: "e1", name: "Ordinary" }), dbx.client, "t", CTX);
  assertEquals(dbx.rows["core.pep_screen"][0].list_version, null);
});

Deno.test("NULL: the lending OFAC gate has no list version (OQ-02, same stub)", async () => {
  const dbx = makeDrillDb();
  dbx.rows["core.loan_application"] = [{
    id: "app_1", status: "completed", funding_block_state: "open", provenance: "production",
  }];
  await postLoanParty(
    req({ role: "borrower", party_name: "Clean Borrower" }), "app_1", dbx.client, "t", CTX,
  );
  assertEquals(dbx.rows["core.loan_party"][0].ofac_list_version, null);
});

// -------------------------------------------- 2. thresholds nobody approved

Deno.test("NULL: an unset capital internal trigger yields NO verdict, not 'not breached'", async () => {
  const dbx = makeDrillDb();
  await postCapitalPosition(
    req({
      as_of_date: "2026-03-31", net_worth_cents: 10_000_000_00,
      total_assets_cents: 100_000_000_00,
    }),
    dbx.client, "d", CTX,
  );
  const p = dbx.rows["core.capital_position"][0];
  assertEquals(p.internal_trigger_bp, null);
  assertEquals(
    p.internal_trigger_breached, null,
    "`false` here would read as 'the Board's trigger was not breached' when no trigger exists",
  );
});

Deno.test("NULL: an unset enterprise cash limit reports 'unassessed'", async () => {
  const dbx = makeDrillDb();
  await postCashEnterprisePosition(
    req({
      as_of_date: "2026-07-31", cash_cents: 9_000_000_00,
      gl_total_assets_cents: 50_000_000_00,
    }),
    dbx.client, "t", CTX,
  );
  const p = dbx.rows["core.cash_enterprise_position"][0];
  assertEquals(p.limit_bp, null);
  assertEquals(p.verdict, "unassessed");
  assert(!codes(dbx.rows).includes("cash.enterprise_limit.breached"));
});

Deno.test("NULL: an unset over/short threshold reports 'unassessed'", async () => {
  const dbx = makeDrillDb();
  await putCashAsset(
    req({ asset_type: "vault", location_id: "b1", balance_cents: 1 }), "v1", dbx.client, "t", CTX,
  );
  await postCashOverShort(
    req({ custodian_user_id: "t1", business_date: "2026-07-10", amount_cents: -99_999_00 }),
    "v1", dbx.client, "t", CTX,
  );
  const ev = (dbx.rows["core.event"] ?? []).find((e) => e.code === "cash.overshort.thresholds");
  assertEquals((ev!.payload as Any).verdict, "unassessed");
  assert(!codes(dbx.rows).includes("cash.overshort.threshold_crossed"));
});

Deno.test("NULL: an unset fair-lending threshold yields no breach verdict", async () => {
  const dbx = makeDrillDb();
  await postFairLendingAnalysis(
    req({
      period: "2026", kind: "disparity",
      cohorts: { a: { applications: 100, approvals: 90 }, b: { applications: 100, approvals: 10 } },
    }),
    dbx.client, "t", CTX,
  );
  const a = dbx.rows["core.fair_lending_analysis"][0];
  assertEquals(a.threshold_bp, null);
  assertEquals(a.breached, null, "a 8000bp disparity with no threshold is still no verdict");
  assert(!codes(dbx.rows).includes("analytics.threshold.breached"));
});

Deno.test("NULL: an unset complaint-trend threshold yields no verdict", async () => {
  const dbx = makeDrillDb();
  await postComplaintTrend(
    req({ period: "q", lens: "fair_lending", cohorts: { a: 200, b: 900 } }),
    dbx.client, "t", CTX,
  );
  assertEquals(dbx.rows["core.complaint_trend"][0].breached, null);
});

Deno.test("NULL: an unset ALM minimum yields no breach verdict", async () => {
  const dbx = makeDrillDb();
  await postAlmSimulation(
    req({ kind: "irr", period: "q", scenario: "+300bp", result_bp: -9999 }),
    dbx.client, "t", CTX,
  );
  assertEquals(dbx.rows["core.alm_simulation"][0].breached, null);
  assert(!codes(dbx.rows).includes("stress_test.minimum.breached"));
});

Deno.test("NULL: an unset liquidity minimum yields no breach verdict", async () => {
  const dbx = makeDrillDb();
  await postLiquidityReport(req({ period: "q" }), dbx.client, "t", CTX);
  assertEquals(dbx.rows["core.liquidity_report"][0].breached, null);
});

Deno.test("NULL: an unset LTV maximum yields no within-policy verdict", async () => {
  const dbx = makeDrillDb();
  dbx.rows["core.loan_application"] = [{
    id: "app_1", status: "completed", funding_block_state: "open", provenance: "production",
  }];
  await postAppraisalOrder(req({ appraiser_ref: "a1" }), "app_1", dbx.client, "t", CTX);
  await postAppraisalComplete(
    req({ value_cents: 40_000_000, loan_amount_cents: 39_000_000 }),
    "apr_app_1", dbx.client, "t", CTX,
  );
  const ev = (dbx.rows["core.event"] ?? []).find((e) => e.code === "collateral.ltv.checked");
  assertEquals(
    (ev!.payload as Any).within_policy, null,
    "a 9750bp LTV with no configured maximum is still no verdict",
  );
});

// ------------------------------------- 3. unknown is not permission (gates)

Deno.test("NULL: a CDA trade with NO overlay configured is 'unassessed' and BLOCKED", async () => {
  const dbx = makeDrillDb();
  dbx.rows["core.cda"] = [{
    id: "cda_1", book_value_cents: 1_000_000, status: "funded",
    strategy_limits: {}, provenance: "production",
  }];
  dbx.rows["core.cda_policy"] = [{
    id: "p1", policy_version: "v1", adopted_at: "2026-01-01T00:00:00.000Z",
    policy_expiry_at: "2099-01-01T00:00:00.000Z", board_resolution_id: "b",
    superseded_at: null, provenance: "production",
  }];
  const res = await postCdaTrade(
    req({ issuer: "Anything", amount_cents: 1000 }), "cda_1", dbx.client, "t", CTX,
  );
  assertEquals(res.status, 409, "unknown is not permission");
  assertEquals(dbx.rows["core.cda_trade"][0].pretrade_verdict, "unassessed");
  assertEquals(dbx.rows["core.cda_trade"][0].executed, false);
});

Deno.test("NULL: an investment trade with no issuer limit is 'unassessed' and BLOCKED", async () => {
  const dbx = makeDrillDb();
  dbx.rows["core.capital_position"] = [{
    id: "c1", as_of_date: "2026-03-31", net_worth_cents: 750_000_000,
    total_assets_cents: 5_000_000_000, net_worth_ratio_bp: 1500,
    pca_category: "well_capitalized", provenance: "production",
  }];
  dbx.rows["core.security"] = [{
    id: "s1", issuer_ref: "unlimited", instrument_class: "us_treasury", provenance: "production",
  }];
  dbx.rows["core.instrument_list"] = [{
    id: "i1", instrument_class: "us_treasury", permissible: true, citation: "c",
    version: 1, effective_at: "2026-01-01T00:00:00.000Z", superseded_at: null,
    provenance: "production",
  }];
  dbx.rows["core.intermediary"] = [{
    id: "im1", name: "N", kind: "both", approved: true, provenance: "production",
  }];
  const res = await postTrade(
    req({
      security_id: "s1", instrument_class: "us_treasury", issuer_ref: "unlimited",
      intermediary_id: "im1", side: "buy", par_cents: 1000, executed_by: "t1",
      checklist_completed: true,
    }),
    dbx.client, "t", CTX,
  );
  assertEquals(res.status, 409);
  assertEquals(dbx.rows["core.trade"][0].limit_verdict, "unassessed");
  assert(
    (dbx.rows["core.trade"][0].blocked_reasons as string[]).includes("no_issuer_limit_set"),
  );
});

// --------------------------------------------------- 4. the standing caveats

Deno.test("NULL: the CTR aggregation cannot attribute an unlinked account (OQ-12)", async () => {
  // `account.entity_id` is nullable because nothing in the data says which
  // member owns a legacy account, and inventing the link would fabricate a
  // member relationship. This asserts the column CAN be null — if someone makes
  // it NOT NULL with a backfilled default, that is the fabrication OQ-12 warns
  // about and this test is where it surfaces.
  const dbx = makeDrillDb();
  dbx.rows["core.account"] = [{
    id: "acct_legacy", entity_id: null, status: "open", account_type: "checking",
    balance: 0, partner_id: "p1", provenance: "production",
  }];
  assertEquals(dbx.rows["core.account"][0].entity_id, null);
  assertEquals(dbx.violations, [], "an unlinked account must remain representable");
});
