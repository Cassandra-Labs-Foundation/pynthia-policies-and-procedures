// Lending underwriting, pricing and fair lending — LP-02..LP-14.
//
// The negatives: an unconfigured product, a prohibited practice, a stale credit
// report, a DTI breach that must open an exception rather than decline, an
// appraiser deciding the reconsideration of their own value, a self-approved
// exception, an unpublished rate sheet pricing a loan, a prequalification that
// withholds an eligible product, an HMDA LAR submitted before QC, and an
// insider loan on preferential terms.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { makeDrillDb } from "../drill/fake_db.ts";
import { OPS_CTX, req } from "./test_helpers.ts";
import {
  HPML_SPREAD_BP,
  creditConfigInForce,
  postAppraisalComplete,
  postAppraisalOrder,
  postAtrQm,
  postCreditApplicationRecord,
  postCreditConfig,
  postCreditDecisionRecord,
  postCreditReport,
  postFairLendingAnalysis,
  postFairLendingRemediationClose,
  postHmdaLar,
  postInsiderLoanReview,
  postLoanBooking,
  postLoanException,
  postLoanExceptionDecision,
  postLoanPricing,
  postPrequalification,
  postProductScreen,
  postRateSheet,
  putInsider,
} from "./lending_underwriting.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
const CTX = OPS_CTX;
const codes = (rows: Record<string, Any[]>) =>
  (rows["core.event"] ?? []).map((e) => String(e.code));

const APP = "app_1";
async function seedLending() {
  const dbx = makeDrillDb();
  dbx.rows["core.loan_application"] = [{
    id: APP, status: "completed", completed_at: "2026-06-01T00:00:00.000Z",
    funding_block_state: "open", provenance: "production",
  }];
  await postCreditConfig(
    req({
      product_code: "mortgage_30", approved_by: "clo_1", min_credit_score: 640,
      max_dti_bp: 4300, max_ltv_bp: 8000,
      prohibited_practices: ["prepayment_penalty"],
      effective_at: "2026-01-01T00:00:00.000Z",
    }),
    dbx.client, "t", CTX,
  );
  return { dbx, db: dbx.client };
}

// ------------------------------------------------------- LP-02 eligibility

Deno.test("LP-02: an unapproved config change is refused", async () => {
  const dbx = makeDrillDb();
  const res = await postCreditConfig(
    req({ product_code: "x", min_credit_score: 600 }), dbx.client, "t", CTX,
  );
  assertEquals(res.status, 400);
  assertEquals((dbx.rows["core.credit_config"] ?? []).length, 0);
});

Deno.test("LP-02: an UNCONFIGURED product cannot be screened — unknown is not permitted", async () => {
  const { dbx, db } = await seedLending();
  const res = await postProductScreen(req({ product_code: "nothing" }), APP, db, "t", CTX);
  assertEquals(res.status, 409);
  assert(!codes(dbx.rows).includes("loan_application.product.screened"));
});

Deno.test("LP-02: a prohibited practice fails the screen, and the screen is still recorded", async () => {
  const { dbx, db } = await seedLending();
  const res = await postProductScreen(
    req({ product_code: "mortgage_30", requested_practices: ["prepayment_penalty"] }),
    APP, db, "t", CTX,
  );
  assertEquals(res.status, 409);
  const ev = (dbx.rows["core.event"] ?? []).find((e) =>
    e.code === "loan_application.product.screened"
  );
  assertEquals((ev!.payload as Any).passed, false);
});

Deno.test("LP-02: config is effective-dated, not newest-wins", async () => {
  const { db } = await seedLending();
  await postCreditConfig(
    req({
      product_code: "mortgage_30", approved_by: "clo_1", min_credit_score: 700,
      effective_at: "2027-01-01T00:00:00.000Z",
    }),
    db, "t", CTX,
  );
  const now = await creditConfigInForce(db, "core", "mortgage_30", new Date("2026-07-19T00:00:00Z"));
  assertEquals(now!.min_credit_score, 640);
});

// ------------------------------------------------------------ LP-04 credit

Deno.test("LP-04: a stale credit report is flagged as an exception", async () => {
  const { dbx, db } = await seedLending();
  await postCreditReport(
    req({ bureau: "equifax", score: 700, pulled_at: "2025-01-01T00:00:00.000Z" }),
    APP, db, "t", CTX,
  );
  assertEquals(dbx.rows["core.credit_report"][0].fresh_at_decision, false);
  assert(codes(dbx.rows).includes("loan_exception.detected"));
});

Deno.test("LP-04: a score under the minimum breaches tolerance; one over does not", async () => {
  const { dbx, db } = await seedLending();
  await postCreditReport(
    req({ bureau: "equifax", score: 610, min_credit_score: 640 }), APP, db, "t", CTX,
  );
  assert(codes(dbx.rows).includes("credit_score.tolerance.breached"));

  const s2 = await seedLending();
  await postCreditReport(
    req({ bureau: "equifax", score: 700, min_credit_score: 640 }), APP, s2.db, "t", CTX,
  );
  assert(!codes(s2.dbx.rows).includes("credit_score.tolerance.breached"));
});

Deno.test("LP-04: a THIN FILE is a determination, not an absence", async () => {
  const { dbx, db } = await seedLending();
  await postCreditReport(req({ bureau: "equifax" }), APP, db, "t", CTX);
  assert(codes(dbx.rows).includes("loan_application.thin_file.flagged"));
  assertEquals(dbx.rows["core.loan_application"][0].thin_file, true);
});

// --------------------------------------------------------------- LP-05 ATR

Deno.test("LP-05: DTI cannot be computed without verified income", async () => {
  const { db } = await seedLending();
  const res = await postAtrQm(
    req({ monthly_debt_cents: 500_000, monthly_income_cents: 0 }), APP, db, "t", CTX,
  );
  assertEquals(res.status, 400);
});

Deno.test("LP-05: a DTI breach OPENS AN EXCEPTION rather than declining outright", async () => {
  const { dbx, db } = await seedLending();
  await postAtrQm(
    req({ monthly_debt_cents: 500_000, monthly_income_cents: 1_000_000, max_dti_bp: 4300 }),
    APP, db, "t", CTX,
  );
  assert(codes(dbx.rows).includes("loan_application.dti.breached"));
  assert(codes(dbx.rows).includes("loan_exception.case.opened"));
  assertEquals(dbx.rows["core.loan_exception"][0].closing_block_state, "blocked");
});

Deno.test("LP-05: a DTI within policy opens NO exception", async () => {
  const { dbx, db } = await seedLending();
  await postAtrQm(
    req({ monthly_debt_cents: 300_000, monthly_income_cents: 1_000_000, max_dti_bp: 4300 }),
    APP, db, "t", CTX,
  );
  assert(!codes(dbx.rows).includes("loan_application.dti.breached"));
  assertEquals((dbx.rows["core.loan_exception"] ?? []).length, 0);
});

// ------------------------------------------------------- LP-06 appraisal

Deno.test("LP-06: the appraiser cannot decide the reconsideration of their own value", async () => {
  const { dbx, db } = await seedLending();
  await postAppraisalOrder(req({ appraiser_ref: "appr_1" }), APP, db, "t", CTX);
  const res = await postAppraisalComplete(
    req({ value_cents: 40_000_000, rov: { decision: "revised", decided_by: "appr_1" } }),
    `apr_${APP}`, db, "t", CTX,
  );
  assertEquals(res.status, 409);
  assertEquals(dbx.rows["core.appraisal_order"][0].completed_at, null);
});

Deno.test("LP-06: a completed valuation must carry a value", async () => {
  const { db } = await seedLending();
  await postAppraisalOrder(req({ appraiser_ref: "appr_1" }), APP, db, "t", CTX);
  assertEquals(
    (await postAppraisalComplete(req({}), `apr_${APP}`, db, "t", CTX)).status, 400,
  );
});

Deno.test("LP-06: LTV over policy raises an exception; an UNSET max yields no verdict", async () => {
  const { dbx, db } = await seedLending();
  await postAppraisalOrder(req({ appraiser_ref: "appr_1" }), APP, db, "t", CTX);
  await postAppraisalComplete(
    req({ value_cents: 40_000_000, loan_amount_cents: 36_000_000, max_ltv_bp: 8000 }),
    `apr_${APP}`, db, "t", CTX,
  );
  const ev = (dbx.rows["core.event"] ?? []).find((e) => e.code === "collateral.ltv.checked");
  assertEquals((ev!.payload as Any).ltv_bp, 9000);
  assert(codes(dbx.rows).includes("loan_exception.detected"));

  const s2 = await seedLending();
  await postAppraisalOrder(req({ appraiser_ref: "a" }), APP, s2.db, "t", CTX);
  await postAppraisalComplete(
    req({ value_cents: 40_000_000, loan_amount_cents: 36_000_000 }), `apr_${APP}`, s2.db, "t", CTX,
  );
  const ev2 = (s2.dbx.rows["core.event"] ?? []).find((e) => e.code === "collateral.ltv.checked");
  assertEquals((ev2!.payload as Any).within_policy, null, "no max means no verdict");
});

// ------------------------------------------------------- LP-08 exceptions

Deno.test("LP-08: an exception with no mitigating factors is refused", async () => {
  const { db } = await seedLending();
  const res = await postLoanException(
    req({ loan_application_id: APP, kind: "ltv", detail: {}, submitted_by: "uw_1" }),
    db, "t", CTX,
  );
  assertEquals(res.status, 400);
});

Deno.test("LP-08: the submitter cannot decide their own exception", async () => {
  const { dbx, db } = await seedLending();
  await postLoanException(
    req({
      loan_application_id: APP, kind: "ltv", detail: {},
      mitigating_factors: "reserves", submitted_by: "uw_1",
    }),
    db, "t", CTX,
  );
  const id = String(dbx.rows["core.loan_exception"][0].id);
  assertEquals(
    (await postLoanExceptionDecision(
      req({ decision: "approved", decided_by: "uw_1" }), id, db, "t", CTX,
    )).status,
    409,
  );
  assertEquals(dbx.rows["core.loan_exception"][0].closing_block_state, "blocked");
});

Deno.test("LP-08: a DENIED exception leaves closing blocked; only approval releases it", async () => {
  const { dbx, db } = await seedLending();
  await postLoanException(
    req({
      loan_application_id: APP, kind: "ltv", detail: {},
      mitigating_factors: "reserves", submitted_by: "uw_1",
    }),
    db, "t", CTX,
  );
  const id = String(dbx.rows["core.loan_exception"][0].id);
  await postLoanExceptionDecision(req({ decision: "denied", decided_by: "cco" }), id, db, "t", CTX);
  assertEquals(dbx.rows["core.loan_exception"][0].closing_block_state, "blocked");
  await postLoanExceptionDecision(req({ decision: "approved", decided_by: "cco" }), id, db, "t", CTX);
  assertEquals(dbx.rows["core.loan_exception"][0].closing_block_state, "released");
});

// ------------------------------------------------------- LP-09 booking

Deno.test("LP-09: an undecided exception BLOCKS booking — the block has teeth", async () => {
  const { dbx, db } = await seedLending();
  await postLoanException(
    req({
      loan_application_id: APP, kind: "ltv", detail: {},
      mitigating_factors: "reserves", submitted_by: "uw_1",
    }),
    db, "t", CTX,
  );
  const res = await postLoanBooking(
    req({ booked_by: "closer", principal_cents: 36_000_000, value_cents: 40_000_000 }),
    APP, db, "t", CTX,
  );
  assertEquals(res.status, 409);
  assertEquals((dbx.rows["core.loan"] ?? []).length, 0);

  const id = String(dbx.rows["core.loan_exception"][0].id);
  await postLoanExceptionDecision(req({ decision: "approved", decided_by: "cco" }), id, db, "t", CTX);
  const ok = await postLoanBooking(
    req({ booked_by: "closer", principal_cents: 36_000_000, value_cents: 40_000_000 }),
    APP, db, "t", CTX,
  );
  assertEquals(ok.status, 201);
  assertEquals(dbx.rows["core.loan"][0].ltv, 9000);
});

Deno.test("LP-03/LP-09: a SEALED credit file cannot be amended", async () => {
  const { dbx, db } = await seedLending();
  await postCreditApplicationRecord(req({ documents: ["w2"] }), APP, db, "t", CTX);
  assertEquals(
    (await postCreditDecisionRecord(req({ decision: "denied", sealed_by: "uw_1" }), APP, db, "t", CTX)).status,
    200,
  );
  assertEquals(
    (await postCreditDecisionRecord(req({ decision: "approved", sealed_by: "uw_2" }), APP, db, "t", CTX)).status,
    409,
  );
  assertEquals(dbx.rows["core.credit_application_record"][0].sealed_by, "uw_1");
  // the Reg B clock starts at the DECISION and has an end
  assert(dbx.rows["core.credit_application_record"][0].retention_expires_at);
});

// --------------------------------------------------------------- LP-10 HPML

Deno.test("LP-10: an UNPUBLISHED rate sheet cannot price a loan", async () => {
  const { dbx, db } = await seedLending();
  await postRateSheet(
    req({
      product_code: "mortgage_30", base_rate_bp: 650, apor_bp: 600,
      effective_at: "2026-02-01T00:00:00.000Z",
    }),
    db, "t", CTX,
  );
  const id = String(dbx.rows["core.rate_sheet"][0].id);
  const res = await postLoanPricing(req({ rate_sheet_id: id, quoted_apr_bp: 800 }), APP, db, "t", CTX);
  assertEquals(res.status, 409);
});

Deno.test("LP-10: HPML is the spread against APOR, at the published threshold", async () => {
  const { dbx, db } = await seedLending();
  await postRateSheet(
    req({ product_code: "m", base_rate_bp: 650, apor_bp: 600, published_by: "t1" }), db, "t", CTX,
  );
  const id = String(dbx.rows["core.rate_sheet"][0].id);
  await postLoanPricing(req({ rate_sheet_id: id, quoted_apr_bp: 749 }), APP, db, "t", CTX);
  assertEquals(dbx.rows["core.loan_pricing"][0].hpml, false);

  const s2 = await seedLending();
  await postRateSheet(
    req({ product_code: "m", base_rate_bp: 650, apor_bp: 600, published_by: "t1" }), s2.db, "t", CTX,
  );
  const id2 = String(s2.dbx.rows["core.rate_sheet"][0].id);
  await postLoanPricing(req({ rate_sheet_id: id2, quoted_apr_bp: 750 }), APP, s2.db, "t", CTX);
  assertEquals(s2.dbx.rows["core.loan_pricing"][0].hpml, true);
  assertEquals(HPML_SPREAD_BP, 150);
});

Deno.test("LP-10: a pricing exception cannot be self-approved", async () => {
  const { dbx, db } = await seedLending();
  await postRateSheet(
    req({ product_code: "m", base_rate_bp: 650, apor_bp: 600, published_by: "t1" }), db, "t", CTX,
  );
  const id = String(dbx.rows["core.rate_sheet"][0].id);
  const res = await postLoanPricing(
    req({
      rate_sheet_id: id, quoted_apr_bp: 800,
      exception: { requested_by: "lo_1", decision: "approved", decided_by: "lo_1" },
    }),
    APP, db, "t", CTX,
  );
  assertEquals(res.status, 409);
});

// ------------------------------------------------------ LP-12 steering

Deno.test("LP-12: steering is offered-versus-ELIGIBLE, which needs both sides", async () => {
  const dbx = makeDrillDb();
  await postPrequalification(
    req({
      subject_ref: "m1", decision: "prequalified",
      products_offered: ["a"], products_eligible: ["a", "b"],
    }),
    dbx.client, "t", CTX,
  );
  assertEquals(dbx.rows["core.prequalification"][0].steering_flag, true);
  const ev = (dbx.rows["core.event"] ?? []).find((e) => e.code === "steering_review.completed");
  assertEquals((ev!.payload as Any).withheld_products, ["b"]);
});

Deno.test("LP-12: offering everything eligible is NOT steering", async () => {
  const dbx = makeDrillDb();
  await postPrequalification(
    req({
      subject_ref: "m1", decision: "prequalified",
      products_offered: ["a", "b"], products_eligible: ["a", "b"],
    }),
    dbx.client, "t", CTX,
  );
  assertEquals(dbx.rows["core.prequalification"][0].steering_flag, false);
  assert(!codes(dbx.rows).includes("fair_lending.discouragement.reported"));
});

Deno.test("LP-12: declining an ELIGIBLE applicant at prequal is discouragement", async () => {
  const dbx = makeDrillDb();
  await postPrequalification(
    req({
      subject_ref: "m1", decision: "declined",
      products_offered: [], products_eligible: ["a"],
    }),
    dbx.client, "t", CTX,
  );
  assert(codes(dbx.rows).includes("fair_lending.discouragement.reported"));
  assert(codes(dbx.rows).includes("fair_lending.remediation.opened"));
});

// -------------------------------------------------- LP-13 fair lending

Deno.test("LP-13: the disparity is COMPUTED from cohort rates, not supplied", async () => {
  const dbx = makeDrillDb();
  await postFairLendingAnalysis(
    req({
      period: "2026", kind: "disparity", threshold_bp: 500, disparity_bp: 0,
      cohorts: {
        control: { applications: 1000, approvals: 800 },
        protected: { applications: 400, approvals: 240 },
      },
    }),
    dbx.client, "t", CTX,
  );
  // 8000bp vs 6000bp
  assertEquals(dbx.rows["core.fair_lending_analysis"][0].disparity_bp, 2000);
  assertEquals(dbx.rows["core.fair_lending_analysis"][0].breached, true);
  assert(codes(dbx.rows).includes("analytics.threshold.breached"));
});

Deno.test("LP-13: an unset threshold yields NO verdict", async () => {
  const dbx = makeDrillDb();
  await postFairLendingAnalysis(
    req({
      period: "2026", kind: "disparity",
      cohorts: {
        control: { applications: 100, approvals: 90 },
        protected: { applications: 100, approvals: 10 },
      },
    }),
    dbx.client, "t", CTX,
  );
  assertEquals(dbx.rows["core.fair_lending_analysis"][0].breached, null);
  assert(!codes(dbx.rows).includes("analytics.threshold.breached"));
});

Deno.test("LP-13: remediation cannot be closed without evidence, nor if none opened", async () => {
  const dbx = makeDrillDb();
  await postFairLendingAnalysis(
    req({
      period: "2026", kind: "disparity", threshold_bp: 500,
      cohorts: {
        control: { applications: 100, approvals: 90 },
        protected: { applications: 100, approvals: 10 },
      },
    }),
    dbx.client, "t", CTX,
  );
  assertEquals(
    (await postFairLendingRemediationClose(req({}), "flan_2026_disparity", dbx.client, "t", CTX)).status,
    400,
  );
  assertEquals(
    (await postFairLendingRemediationClose(
      req({ evidence: "retraining" }), "flan_2026_disparity", dbx.client, "t", CTX,
    )).status,
    200,
  );
});

Deno.test("LP-13: the HMDA LAR is QC'd BEFORE submission", async () => {
  const dbx = makeDrillDb();
  // submitted with no QC at all
  assertEquals(
    (await postHmdaLar(
      req({ reporting_year: 2026, record_count: 10, submitted_by: "c1" }), dbx.client, "t", CTX,
    )).status,
    409,
  );
  // QC'd but with unresolved errors
  assertEquals(
    (await postHmdaLar(
      req({ reporting_year: 2026, record_count: 10, qc_error_count: 3, submitted_by: "c1" }),
      dbx.client, "t", CTX,
    )).status,
    409,
  );
  assertEquals((dbx.rows["core.hmda_lar"] ?? []).length, 0);
  assertEquals(
    (await postHmdaLar(
      req({ reporting_year: 2026, record_count: 10, qc_error_count: 0, submitted_by: "c1" }),
      dbx.client, "t", CTX,
    )).status,
    201,
  );
  assert(codes(dbx.rows).includes("hmda.lar.submitted"));
  assert(dbx.rows["core.hmda_lar"][0].submitted_at, "the LAR row must record the submission");
});

// ---------------------------------------------------------- LP-14 insider

Deno.test("LP-14: NOT an insider is a recorded answer, not silence", async () => {
  const { dbx, db } = await seedLending();
  const res = await postInsiderLoanReview(req({ subject_ref: "nobody" }), APP, db, "t", CTX);
  assertEquals(res.status, 200);
  const ev = (dbx.rows["core.event"] ?? []).find((e) =>
    e.code === "loan_application.insider.flagged"
  );
  assertEquals((ev!.payload as Any).is_insider, false);
});

Deno.test("LP-14: preferential terms are refused and cannot carry a board approval", async () => {
  const { dbx, db } = await seedLending();
  await putInsider(req({ subject_ref: "dir_1", role: "director" }), "ins_1", db, "t", CTX);
  const res = await postInsiderLoanReview(
    req({ subject_ref: "dir_1", terms_comparable: false, board_resolution_id: "b1" }),
    APP, db, "t", CTX,
  );
  assertEquals(res.status, 409);
  assertEquals(dbx.rows["core.insider_loan_review"][0].board_approved_at, null);
  assert(!codes(dbx.rows).includes("insider.board_approval.recorded"));
  assertEquals(dbx.violations, []);
});

Deno.test("LP-14: comparable terms still need a recorded Board resolution", async () => {
  const { dbx, db } = await seedLending();
  await putInsider(req({ subject_ref: "dir_1", role: "director" }), "ins_1", db, "t", CTX);
  assertEquals(
    (await postInsiderLoanReview(
      req({ subject_ref: "dir_1", terms_comparable: true }), APP, db, "t", CTX,
    )).status,
    409,
  );
  assertEquals(
    (await postInsiderLoanReview(
      req({ subject_ref: "dir_1", terms_comparable: true, board_resolution_id: "b1" }),
      APP, db, "t", CTX,
    )).status,
    200,
  );
  assert(codes(dbx.rows).includes("insider.board_approval.recorded"));
  assert(
    dbx.rows["core.insider_loan_review"][0].board_approved_at,
    "the review row must record the approval, not only announce it",
  );
});

Deno.test("LP-14: an EXPIRED insider registration no longer flags", async () => {
  const { dbx, db } = await seedLending();
  await putInsider(
    req({
      subject_ref: "dir_1", role: "director",
      effective_from: "2020-01-01T00:00:00.000Z", effective_to: "2021-01-01T00:00:00.000Z",
    }),
    "ins_1", db, "t", CTX,
  );
  await postInsiderLoanReview(req({ subject_ref: "dir_1" }), APP, db, "t", CTX);
  const ev = (dbx.rows["core.event"] ?? []).find((e) =>
    e.code === "loan_application.insider.flagged"
  );
  assertEquals((ev!.payload as Any).is_insider, false);
});
