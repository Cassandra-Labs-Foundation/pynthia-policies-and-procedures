// Charitable Donation Accounts — CDA-01..CDA-14.
//
// The interesting cases here are all ABSENCES, which is why so many of these
// tests assert on a refusal or on an event that must NOT have been emitted:
// an account nobody labelled, a clause nobody validated, a trustee whose
// registration lapsed, a net worth nobody recorded, an overlay nobody set. In
// every one of those the happy path is untouched, so a suite that only drives
// the positive direction would pass against a gate that does nothing.
//
// These run against the drill's in-memory Postgres stand-in rather than a
// bespoke per-file fake, so the CHECK constraints in the migration are actually
// exercised. `fake_db` re-implements the load-bearing ones and names the rest
// as unenforced.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { makeDrillDb } from "../drill/fake_db.ts";
import { OPS_CTX, req } from "./test_helpers.ts";
import {
  AFFILIATE_PAYEES,
  CAP_LIMIT_BP,
  DUAL_APPROVAL_THRESHOLD_CENTS,
  MIN_DISTRIBUTION_COVERAGE_BP,
  deriveVendorQualification,
  evaluateFundingGate,
  postCda,
  postCdaAgreement,
  postCdaAuditCycle,
  postCdaCapCure,
  postCdaCapTest,
  postCdaCommunication,
  postCdaCommunicationApproval,
  postCdaCommunicationPublish,
  postCdaDistribution,
  postCdaDistributionWindow,
  postCdaFeePayment,
  postCdaFindingClose,
  postCdaFunding,
  postCdaGlossaryChange,
  postCdaInkindTransfer,
  postCdaPolicyAdoption,
  postCdaPolicySweep,
  postCdaTrade,
  postCdaVendor,
  postCdaVendorReview,
  putCdaOverlay,
} from "./cda.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

const CTX = OPS_CTX;

function codes(rows: Record<string, Any[]>): string[] {
  return (rows["core.event"] ?? []).map((e) => String(e.code));
}

/**
 * A funded, fully compliant programme: adopted policy, qualified trustee,
 * labelled segregated account, all four clauses, a capital position, and $250k
 * funded against $7.5m of net worth (3.33%, under both the 5% cap and the 4%
 * buffer).
 */
async function seedProgramme(opts: { netWorthCents?: number } = {}) {
  const dbx = makeDrillDb();
  const db = dbx.client;
  const netWorth = opts.netWorthCents ?? 750_000_000;

  await postCdaPolicyAdoption(
    req({ policy_version: "v1.0", board_resolution_id: "board-1", adopted_at: "2026-06-16T00:00:00.000Z" }),
    db, "t", CTX,
  );
  dbx.rows["core.capital_position"] ??= [];
  dbx.rows["core.capital_position"].push({
    id: "cap_20260331", as_of_date: "2026-03-31", net_worth_cents: netWorth,
    total_assets_cents: 5_000_000_000, net_worth_ratio_bp: 1500,
    pca_category: "well_capitalized", provenance: "production",
  });
  await postCdaVendor(
    req({
      name: "Northgate Trust", role: "trustee", regulator: "occ",
      registration_status: "active", registration_evidence_ref: "occ-cert",
    }),
    db, "t", CTX,
  );
  await postCda(
    req({
      id: "cda_main", vendor_id: "cdaven_northgatetrust",
      structure_type: "segregated_custodial",
      account_label: "Pynthia Charitable Donation Account",
      custodian_statement_ref: "cust-1",
    }),
    db, "t", CTX,
  );
  await postCdaAgreement(
    req({
      clauses: {
        agreement_named_charities_clause: true, agreement_strategy_clause: true,
        agreement_gaap_clause: true, agreement_distribution_clause: true,
      },
    }),
    "cda_main", db, "t", CTX,
  );
  return { dbx, db };
}

// ------------------------------------------------------ CDA-01 the programme

Deno.test("CDA-01: an expired adoption blocks funding — the policy is a gate, not a report", async () => {
  const { dbx, db } = await seedProgramme();
  await postCdaFunding(req({ amount_cents: 25_000_000 }), "cda_main", db, "t", CTX);

  // expire it, then try again
  const pol = dbx.rows["core.cda_policy"][0];
  pol.policy_expiry_at = "2026-01-01T00:00:00.000Z";

  const res = await postCdaFunding(req({ amount_cents: 1_000_00 }), "cda_main", db, "t", CTX);
  assertEquals(res.status, 409);
  const blocked = dbx.rows["core.cda_funding_request"].filter((f) => f.decision === "blocked");
  assertEquals(blocked.length, 1);
  assert((blocked[0].blocked_reasons as string[]).includes("policy_expired"));
});

Deno.test("CDA-01: the expiry is anchored on ADOPTION, not on when the row was written", async () => {
  const { dbx } = await seedProgramme();
  // The whole of CDA-01 is "if the policy lapses, CDA actions are blocked". If
  // the expiry re-anchors to `now`, a policy adopted eleven months ago records
  // an expiry twelve months from TODAY and can never lapse — the control fails
  // open and every duration-based assertion still passes.
  const pol = dbx.rows["core.cda_policy"][0];
  assertEquals(String(pol.adopted_at), "2026-06-16T00:00:00.000Z");
  assertEquals(String(pol.policy_expiry_at), "2027-06-16T00:00:00.000Z");
});

Deno.test("CDA-01: an adoption BACKDATED past its own term is already expired", async () => {
  const dbx = makeDrillDb();
  await postCdaPolicyAdoption(
    req({
      policy_version: "v0.9", board_resolution_id: "board-old",
      adopted_at: "2024-01-01T00:00:00.000Z",
    }),
    dbx.client, "t", CTX,
  );
  assertEquals(String(dbx.rows["core.cda_policy"][0].policy_expiry_at), "2025-01-01T00:00:00.000Z");
  const v = await evaluateFundingGate(dbx.client, "core", "nope", 1, null, new Date());
  assert(v.reasons.includes("policy_expired"), "a stale adoption must read as expired");
});

Deno.test("CDA-01: NO adoption at all blocks too — absence is not permission", async () => {
  const dbx = makeDrillDb();
  await postCda(
    req({
      id: "cda_x", structure_type: "spe_trust",
      account_label: "Charitable Donation Account", custodian_statement_ref: "c",
    }),
    dbx.client, "t", CTX,
  );
  const v = await evaluateFundingGate(dbx.client, "core", "cda_x", 1, null, new Date());
  assert(v.reasons.includes("policy_not_adopted"));
});

Deno.test("CDA-01: the sweep escalates a lapse without waiting for a transaction", async () => {
  const { dbx, db } = await seedProgramme();
  dbx.rows["core.cda_policy"][0].policy_expiry_at = "2026-01-01T00:00:00.000Z";

  const res = await postCdaPolicySweep(req({}), db, "t", CTX);
  assertEquals(res.status, 200);
  assert(codes(dbx.rows).includes("cda.board_escalation.issued"));
  assert(codes(dbx.rows).includes("cda.actions.blocked"));
});

Deno.test("CDA-01: a live adoption produces NO escalation — the sweep is not an echo", async () => {
  const { dbx, db } = await seedProgramme();
  await postCdaPolicySweep(req({}), db, "t", CTX);
  assert(!codes(dbx.rows).includes("cda.board_escalation.issued"));
});

// -------------------------------------------------------------- CDA-04 vendor

Deno.test("CDA-04: qualification is derived from the evidence, not asserted", () => {
  assertEquals(deriveVendorQualification("occ", "active", "cert").qualified, true);
  assertEquals(deriveVendorQualification("occ", "lapsed", "cert").qualified, false);
  // registration evidence is required even when the regulator and status are right
  assertEquals(deriveVendorQualification("sec", "active", null).qualified, false);
  assertEquals(deriveVendorQualification(null, "active", "cert").qualified, false);
  assertEquals(deriveVendorQualification("some_trade_body", "active", "cert").qualified, false);
});

Deno.test("CDA-04: a caller cannot qualify a vendor by claiming it", async () => {
  const dbx = makeDrillDb();
  await postCdaVendor(
    // `qualified: true` is supplied and must be ignored
    req({ name: "Sketchy LLC", role: "trustee", qualified: true, registration_status: "active" }),
    dbx.client, "t", CTX,
  );
  assertEquals(dbx.rows["core.cda_vendor"][0].qualified, false);
  assert(codes(dbx.rows).includes("cda.vendor_issue.flagged"));
  assert(!codes(dbx.rows).includes("cda.vendor_qualified"));
});

Deno.test("CDA-04: a lapse found on review escalates to the Board with its 2-day clock", async () => {
  const { dbx, db } = await seedProgramme();
  await postCdaVendorReview(
    req({ registration_status: "lapsed" }), "cdaven_northgatetrust", db, "t", CTX,
  );
  const esc = (dbx.rows["core.event"] ?? []).find((e) =>
    e.code === "cda.board_escalation.issued"
  );
  assert(esc, "a detected lapse must escalate");
  assertEquals((esc!.payload as Any).reason, "vendor_registration_lapsed");
  assert((esc!.payload as Any).escalation_due_at);
});

Deno.test("CDA-04: a review that changes nothing does NOT escalate", async () => {
  const { dbx, db } = await seedProgramme();
  await postCdaVendorReview(
    req({ registration_status: "active", registration_evidence_ref: "occ-cert" }),
    "cdaven_northgatetrust", db, "t", CTX,
  );
  assert(codes(dbx.rows).includes("cda.vendor_review.completed"));
  assert(!codes(dbx.rows).includes("cda.board_escalation.issued"));
});

Deno.test("CDA-04: an unqualified trustee blocks funding — §721.3(b)(2)(ii) is in the conjunction", async () => {
  const { dbx, db } = await seedProgramme();
  await postCdaVendorReview(
    req({ registration_status: "lapsed" }), "cdaven_northgatetrust", db, "t", CTX,
  );
  const v = await evaluateFundingGate(db, "core", "cda_main", 1_000_00, null, new Date());
  assert(v.reasons.includes("vendor_not_qualified"));
  assertEquals(v.permitted, false);
  assert(dbx.rows["core.cda_vendor"].length > 0);
});

// ------------------------------------------------- CDA-03 structure/segregation

Deno.test("CDA-03: a label that does not DESIGNATE the account does not file the packet", async () => {
  const dbx = makeDrillDb();
  await postCda(
    req({
      id: "cda_bad", structure_type: "spe_trust",
      account_label: "Investment Sub-Account", custodian_statement_ref: "c",
    }),
    dbx.client, "t", CTX,
  );
  assertEquals(dbx.rows["core.cda"][0].evidence_packet_filed_at, null);
  assert(codes(dbx.rows).includes("cda.evidence_packet.incomplete"));
  assert(!codes(dbx.rows).includes("cda.evidence_packet.filed"));
});

Deno.test("CDA-03: a designated label with no custodial statement is still incomplete", async () => {
  const dbx = makeDrillDb();
  await postCda(
    req({
      id: "cda_nc", structure_type: "segregated_custodial",
      account_label: "Charitable Donation Account",
    }),
    dbx.client, "t", CTX,
  );
  assertEquals(dbx.rows["core.cda"][0].evidence_packet_filed_at, null);
});

// --------------------------------------------------------- CDA-05 the agreement

Deno.test("CDA-05: a missing clause names ITSELF — the refusal is per-clause", async () => {
  const { dbx, db } = await seedProgramme();
  const res = await postCdaAgreement(
    req({
      clauses: {
        agreement_named_charities_clause: true, agreement_strategy_clause: true,
        agreement_distribution_clause: true,
      },
    }),
    "cda_main", db, "t", CTX,
  );
  const body = await res.json();
  assertEquals(body.data.agreement_validated, false);
  assertEquals(body.data.missing_clauses, ["C_gaap_accounting"]);
  assertEquals(dbx.rows["core.cda"][0].agreement_validated_at, null);
});

Deno.test("CDA-05: an unvalidated agreement blocks funding", async () => {
  const { db } = await seedProgramme();
  await postCdaAgreement(
    req({ clauses: { agreement_named_charities_clause: true } }), "cda_main", db, "t", CTX,
  );
  const v = await evaluateFundingGate(db, "core", "cda_main", 1_000_00, null, new Date());
  assert(v.reasons.includes("agreement_clauses_unvalidated"));
});

Deno.test("CDA-05: an amendment with no Board resolution is refused", async () => {
  const { db } = await seedProgramme();
  const res = await postCdaAgreement(
    req({
      clauses: {
        agreement_named_charities_clause: true, agreement_strategy_clause: true,
        agreement_gaap_clause: true, agreement_distribution_clause: true,
      },
      amendment: { redline_ref: "r1" },
    }),
    "cda_main", db, "t", CTX,
  );
  assertEquals(res.status, 400);
});

// ------------------------------------------------------------ CDA-06 the cap

Deno.test("CDA-06: the cap test is PROJECTED — the requested amount is inside the number tested", async () => {
  // $7.5m net worth -> 5% is $375k. Current book value $0.
  const { db } = await seedProgramme();
  // $400k would take utilisation to 5.33%, above the cap. Testing the CURRENT
  // aggregate ($0) would permit it; testing the projected aggregate refuses.
  const v = await evaluateFundingGate(db, "core", "cda_main", 40_000_000, null, new Date());
  assertEquals(v.projected_aggregate_cents, 40_000_000);
  assert(v.utilization_bp !== null && v.utilization_bp > CAP_LIMIT_BP);
  assert(v.reasons.includes("cap_exceeded"));
});

Deno.test("CDA-06: no capital position means the cap CANNOT be tested — not that it passed", async () => {
  const { dbx, db } = await seedProgramme();
  dbx.rows["core.capital_position"].length = 0;
  const v = await evaluateFundingGate(db, "core", "cda_main", 1_000_00, null, new Date());
  assert(v.reasons.includes("net_worth_unknown"));
  assertEquals(v.permitted, false);
});

Deno.test("CDA-06: the internal buffer refuses before the statutory cap does", async () => {
  const { db } = await seedProgramme();
  // 4.5% of $7.5m = $337.5k — under the 5% cap, over the 4% buffer
  const v = await evaluateFundingGate(db, "core", "cda_main", 33_750_000, null, new Date());
  assert(v.reasons.includes("internal_buffer_exceeded"));
  assert(!v.reasons.includes("cap_exceeded"));
});

Deno.test("CDA-06: a blocked funding is RECORDED — a gate that logs only what it permitted is unauditable", async () => {
  const { dbx, db } = await seedProgramme();
  await postCdaFunding(req({ amount_cents: 40_000_000 }), "cda_main", db, "t", CTX);
  assertEquals(dbx.rows["core.cda_funding_request"].length, 1);
  assertEquals(dbx.rows["core.cda_funding_request"][0].decision, "blocked");
  // and no money moved
  assertEquals(dbx.rows["core.cda"][0].book_value_cents, 0);
});

Deno.test("CDA-06: a breach is only CURED when the aggregate actually falls", async () => {
  const { dbx, db } = await seedProgramme();
  await postCdaFunding(req({ amount_cents: 25_000_000 }), "cda_main", db, "t", CTX);

  // net worth falls to $4m: the same $250k is now 6.25%
  dbx.rows["core.capital_position"].push({
    id: "cap_20260930", as_of_date: "2026-09-30", net_worth_cents: 400_000_000,
    total_assets_cents: 5_000_000_000, net_worth_ratio_bp: 800,
    pca_category: "well_capitalized", provenance: "production",
  });
  await postCdaCapTest(req({ as_of_date: "2026-09-30" }), db, "t", CTX);
  const test = dbx.rows["core.cda_cap_test"][0];
  assertEquals(test.cap_breached, true);
  assertEquals(test.excess_cents, 5_000_000);
  assert(test.cure_due_at);

  // a cure PLAN alone does not clear it
  const early = await postCdaCapCure(
    req({ cure_plan: "we will reduce it" }), "cdacap_20260930", db, "t", CTX,
  );
  assertEquals(early.status, 409);
  assertEquals(dbx.rows["core.cda_cap_test"][0].cured_at, null);
  assert(codes(dbx.rows).includes("cda.cap_cure.insufficient"));
  assert(!codes(dbx.rows).includes("cda.cap_breach_cured"));

  // distributing genuinely reduces book value, and now the cure lands
  await postCdaDistribution(
    req({
      donee_name: "Riverside Food Bank", donee_ein: "12-3456789", donee_irs_status: "501c3",
      amount_cents: 6_000_000, proposed_by: "ops_1", approved_by: "ops_2",
    }),
    "cda_main", db, "t", CTX,
  );
  const late = await postCdaCapCure(
    req({ cure_plan: "distributed $60k" }), "cdacap_20260930", db, "t", CTX,
  );
  assertEquals(late.status, 200);
  assert(codes(dbx.rows).includes("cda.cap_breach_cured"));
});

Deno.test("CDA-06: a cap test with no capital position is refused rather than reported clean", async () => {
  const dbx = makeDrillDb();
  const res = await postCdaCapTest(req({ as_of_date: "2026-06-30" }), dbx.client, "t", CTX);
  assertEquals(res.status, 409);
  assertEquals((dbx.rows["core.cda_cap_test"] ?? []).length, 0);
});

// ------------------------------------------------------------ CDA-07 trading

Deno.test("CDA-07: with NO overlay configured a trade is unassessed and blocked, not permitted", async () => {
  const { dbx, db } = await seedProgramme();
  await postCdaFunding(req({ amount_cents: 25_000_000 }), "cda_main", db, "t", CTX);
  const res = await postCdaTrade(
    req({ issuer: "Anything", amount_cents: 1_000_00 }), "cda_main", db, "t", CTX,
  );
  assertEquals(res.status, 409);
  assertEquals(dbx.rows["core.cda_trade"][0].pretrade_verdict, "unassessed");
  assertEquals(dbx.rows["core.cda_trade"][0].executed, false);
  // the check still COMPLETED — the control ran and reported "cannot clear"
  assert(codes(dbx.rows).includes("cda.pretrade_check.completed"));
});

Deno.test("CDA-07: concentration is measured AFTER the trade, so the first breach is refused", async () => {
  const { dbx, db } = await seedProgramme();
  await postCdaFunding(req({ amount_cents: 25_000_000 }), "cda_main", db, "t", CTX);
  await putCdaOverlay(
    req({ limit_bp: 2500, approved_by: "board-1" }), "cda_main", "single_issuer", db, "t", CTX,
  );
  const ok = await postCdaTrade(
    req({ issuer: "US Treasury", amount_cents: 2_000_000 }), "cda_main", db, "t", CTX,
  );
  assertEquals(ok.status, 201);
  const bad = await postCdaTrade(
    req({ issuer: "Single Corp", amount_cents: 20_000_000 }), "cda_main", db, "t", CTX,
  );
  assertEquals(bad.status, 409);
  const breached = dbx.rows["core.cda_trade"].find((t) => t.pretrade_verdict === "breach");
  assert(breached);
  assertEquals(breached!.executed, false);
});

Deno.test("CDA-07: an unapproved overlay limit is refused — the limits are Board-set", async () => {
  const { db } = await seedProgramme();
  const res = await putCdaOverlay(
    req({ limit_bp: 9999 }), "cda_main", "single_issuer", db, "t", CTX,
  );
  assertEquals(res.status, 400);
});

// -------------------------------------------------------------- CDA-08 giving

Deno.test("CDA-08: a donee with no EIN or IRS status is not a Qualified Charity", async () => {
  const { dbx, db } = await seedProgramme();
  const res = await postCdaDistribution(
    req({ donee_name: "Unknown Foundation", amount_cents: 1_000_00, proposed_by: "ops_1" }),
    "cda_main", db, "t", CTX,
  );
  assertEquals(res.status, 409);
  assertEquals(dbx.rows["core.cda_distribution"][0].decision, "blocked");
  assert(!codes(dbx.rows).includes("cda.distribution.executed"));
});

Deno.test("CDA-08: an EIN with no IRS determination is still unvalidated", async () => {
  const { dbx, db } = await seedProgramme();
  await postCdaDistribution(
    req({
      donee_name: "Maybe Charity", donee_ein: "12-3456789", donee_irs_status: "none",
      amount_cents: 1_000_00, proposed_by: "ops_1",
    }),
    "cda_main", db, "t", CTX,
  );
  assertEquals(dbx.rows["core.cda_distribution"][0].donee_validated, false);
  assertEquals(dbx.rows["core.cda_distribution"][0].decision, "blocked");
});

Deno.test("CDA-08: a window with no Total Return has NO coverage — 0/0 is not 100%", async () => {
  const { dbx, db } = await seedProgramme();
  await postCdaDistributionWindow(
    req({
      opened_at: "2026-01-01T00:00:00.000Z", closes_at: "2031-01-01T00:00:00.000Z",
      total_return_cents: 0,
    }),
    "cda_main", db, "t", CTX,
  );
  assertEquals(dbx.rows["core.cda_distribution_window"][0].coverage_bp, 0);
});

Deno.test("CDA-08: a window short of 51% raises its shortfall alert with the amount", async () => {
  const { dbx, db } = await seedProgramme();
  await postCdaFunding(req({ amount_cents: 25_000_000 }), "cda_main", db, "t", CTX);
  await postCdaDistributionWindow(
    req({
      opened_at: "2026-01-01T00:00:00.000Z", closes_at: "2031-01-01T00:00:00.000Z",
      total_return_cents: 20_000_000,
    }),
    "cda_main", db, "t", CTX,
  );
  const winId = String(dbx.rows["core.cda_distribution_window"][0].id);
  await postCdaDistribution(
    req({
      donee_name: "Riverside Food Bank", donee_ein: "12-3456789", donee_irs_status: "501c3",
      amount_cents: 6_000_000, proposed_by: "ops_1", approved_by: "ops_2", window_id: winId,
    }),
    "cda_main", db, "t", CTX,
  );
  const alert = (dbx.rows["core.event"] ?? []).find((e) =>
    e.code === "cda.distribution_window.alert"
  );
  assert(alert, "30% coverage must alert");
  assertEquals((alert!.payload as Any).coverage_bp, 3000);
  // 51% of $200k is $102k; $60k distributed leaves a $42k shortfall
  assertEquals((alert!.payload as Any).distribution_shortfall, 4_200_000);
});

Deno.test("CDA-08: a window ABOVE 51% raises no alert", async () => {
  const { dbx, db } = await seedProgramme();
  await postCdaFunding(req({ amount_cents: 25_000_000 }), "cda_main", db, "t", CTX);
  await postCdaDistributionWindow(
    req({
      opened_at: "2026-01-01T00:00:00.000Z", closes_at: "2031-01-01T00:00:00.000Z",
      total_return_cents: 10_000_000,
    }),
    "cda_main", db, "t", CTX,
  );
  const winId = String(dbx.rows["core.cda_distribution_window"][0].id);
  await postCdaDistribution(
    req({
      donee_name: "Riverside Food Bank", donee_ein: "12-3456789", donee_irs_status: "501c3",
      amount_cents: 6_000_000, proposed_by: "ops_1", approved_by: "ops_2", window_id: winId,
    }),
    "cda_main", db, "t", CTX,
  );
  assertEquals(dbx.rows["core.cda_distribution_window"][0].coverage_bp, 6000);
  assert(!codes(dbx.rows).includes("cda.distribution_window.alert"));
  assert(MIN_DISTRIBUTION_COVERAGE_BP === 5100);
});

// ------------------------------------------------------- CDA-11 dual control

Deno.test("CDA-11: a $5,000+ distribution self-approved by its proposer is refused", async () => {
  const { dbx, db } = await seedProgramme();
  const res = await postCdaDistribution(
    req({
      donee_name: "Riverside Food Bank", donee_ein: "12-3456789", donee_irs_status: "501c3",
      amount_cents: DUAL_APPROVAL_THRESHOLD_CENTS, proposed_by: "ops_1", approved_by: "ops_1",
    }),
    "cda_main", db, "t", CTX,
  );
  assertEquals(res.status, 409);
  assertEquals(dbx.rows["core.cda_distribution"][0].blocked_reason, "dual_approval_self_approved");
  assert(!codes(dbx.rows).includes("cda.dual_approval.recorded"));
});

Deno.test("CDA-11: a sub-threshold distribution needs one approver and is still logged", async () => {
  const { dbx, db } = await seedProgramme();
  const res = await postCdaDistribution(
    req({
      donee_name: "Riverside Food Bank", donee_ein: "12-3456789", donee_irs_status: "501c3",
      amount_cents: DUAL_APPROVAL_THRESHOLD_CENTS - 1, proposed_by: "ops_1",
    }),
    "cda_main", db, "t", CTX,
  );
  assertEquals(res.status, 201);
  // "no dual approval" must not be ambiguous between below-threshold and skipped
  assert(codes(dbx.rows).includes("cda.single_approval.recorded"));
  assert(!codes(dbx.rows).includes("cda.dual_approval.recorded"));
});

Deno.test("CDA-11: a finding cannot be closed without evidence, and lateness is recorded", async () => {
  const { dbx, db } = await seedProgramme();
  await postCdaAuditCycle(
    req({
      cycle_year: 2026,
      findings: [{ summary: "cap evidence not retained", remediation_owner: "controller_01", due_days: 60 }],
    }),
    db, "t", CTX,
  );
  const bare = await postCdaFindingClose(req({}), "cdafind_2026_0", db, "t", CTX);
  assertEquals(bare.status, 400);

  dbx.rows["core.cda_audit_finding"][0].remediation_due_at = "2020-01-01T00:00:00.000Z";
  await postCdaFindingClose(req({ closure_evidence_ref: "pack-1" }), "cdafind_2026_0", db, "t", CTX);
  const ev = (dbx.rows["core.event"] ?? []).find((e) => e.code === "cda.remediation.closed");
  assertEquals((ev!.payload as Any).closed_late, true);
});

Deno.test("CDA-11: a finding with no named owner is refused, not stored blank", async () => {
  const { db } = await seedProgramme();
  const res = await postCdaAuditCycle(
    req({ cycle_year: 2026, findings: [{ summary: "something" }] }), db, "t", CTX,
  );
  assertEquals(res.status, 400);
});

// ---------------------------------------------------------------- CDA-13 fees

Deno.test("CDA-13: a fee to the credit union is blocked and escalated as a conflict", async () => {
  const { dbx, db } = await seedProgramme();
  const res = await postCdaFeePayment(
    req({ payee: "Pynthia Credit Union", amount_cents: 40_000 }), "cda_main", db, "t", CTX,
  );
  assertEquals(res.status, 409);
  assertEquals(dbx.rows["core.cda_fee_payment"][0].decision, "blocked");
  assert(codes(dbx.rows).includes("cda.conflict.escalated"));
  assert(codes(dbx.rows).includes("cda.fee_screen.completed"));
});

Deno.test("CDA-13: the affiliate test is case- and whitespace-insensitive", async () => {
  const { dbx, db } = await seedProgramme();
  await postCdaFeePayment(
    req({ payee: "  PYNTHIA CUSO ", amount_cents: 100 }), "cda_main", db, "t", CTX,
  );
  assertEquals(dbx.rows["core.cda_fee_payment"][0].payee_is_affiliate, true);
  assert(AFFILIATE_PAYEES.has("pynthia cuso"));
});

Deno.test("CDA-13: a third-party fee is permitted and raises NO conflict", async () => {
  const { dbx, db } = await seedProgramme();
  const res = await postCdaFeePayment(
    req({ payee: "Northgate Trust", amount_cents: 12_500 }), "cda_main", db, "t", CTX,
  );
  assertEquals(res.status, 201);
  assert(codes(dbx.rows).includes("cda.fee_screen.completed"));
  assert(!codes(dbx.rows).includes("cda.conflict.escalated"));
});

// --------------------------------------------------------- CDA-12 termination

Deno.test("CDA-12: an in-kind asset with no documented determination is liquidated, not received", async () => {
  const { dbx, db } = await seedProgramme();
  dbx.rows["core.cda_termination"] ??= [];
  dbx.rows["core.cda_termination"].push({
    id: "cdaterm_cda_main", cda_id: "cda_main", approved_by: "board",
    approved_at: "2026-07-01T00:00:00.000Z", provenance: "production",
  });
  // a PERMISSIBLE class, but nobody documented the determination
  const res = await postCdaInkindTransfer(
    req({ asset_class: "us_treasury", amount_cents: 1_000_000 }), "cda_main", db, "t", CTX,
  );
  assertEquals(res.status, 409);
  assertEquals(dbx.rows["core.cda_inkind_asset"][0].decision, "blocked_liquidate");
});

Deno.test("CDA-12: a non-Part-703 asset class is blocked even with a determination", async () => {
  const { dbx, db } = await seedProgramme();
  dbx.rows["core.cda_termination"] ??= [];
  dbx.rows["core.cda_termination"].push({
    id: "cdaterm_cda_main", cda_id: "cda_main", approved_by: "board",
    approved_at: "2026-07-01T00:00:00.000Z", provenance: "production",
  });
  const res = await postCdaInkindTransfer(
    req({ asset_class: "private_equity_fund", amount_cents: 500_000, determination_ref: "d-1" }),
    "cda_main", db, "t", CTX,
  );
  assertEquals(res.status, 409);
  // the proposal is still recorded — the refusal is the evidence
  assert(codes(dbx.rows).includes("cda.inkind_transfer.proposed"));
});

// ------------------------------------------------------ CDA-14 communications

Deno.test("CDA-14: publication is blocked without BOTH approvals and the checklist", async () => {
  const { dbx, db } = await seedProgramme();
  await postCdaCommunication(req({ title: "CDA Program", draft_ref: "d1" }), db, "t", CTX);
  const partial = await postCdaCommunicationApproval(
    req({ wcag_checklist_passed: true, marketing_approved_by: "mktg_01" }),
    "cdacom_cdaprogram", db, "t", CTX,
  );
  assertEquals(partial.status, 409);
  const pub = await postCdaCommunicationPublish(
    req({ archived_ref: "a1" }), "cdacom_cdaprogram", db, "t", CTX,
  );
  assertEquals(pub.status, 409);
  assert(!codes(dbx.rows).includes("cda.communication.published"));
});

Deno.test("CDA-14: a failing WCAG checklist blocks even with both approvals", async () => {
  const { db } = await seedProgramme();
  await postCdaCommunication(req({ title: "CDA Program", draft_ref: "d1" }), db, "t", CTX);
  const res = await postCdaCommunicationApproval(
    req({
      wcag_checklist_passed: false, marketing_approved_by: "mktg_01",
      compliance_approved_by: "cmp_01",
    }),
    "cdacom_cdaprogram", db, "t", CTX,
  );
  assertEquals(res.status, 409);
});

Deno.test("CDA-14: publishing requires the artifact to be archived at publication", async () => {
  const { dbx, db } = await seedProgramme();
  await postCdaCommunication(req({ title: "CDA Program", draft_ref: "d1" }), db, "t", CTX);
  await postCdaCommunicationApproval(
    req({
      wcag_checklist_passed: true, marketing_approved_by: "mktg_01",
      compliance_approved_by: "cmp_01",
    }),
    "cdacom_cdaprogram", db, "t", CTX,
  );
  const noArchive = await postCdaCommunicationPublish(req({}), "cdacom_cdaprogram", db, "t", CTX);
  assertEquals(noArchive.status, 400);
  const ok = await postCdaCommunicationPublish(
    req({ archived_ref: "a1" }), "cdacom_cdaprogram", db, "t", CTX,
  );
  assertEquals(ok.status, 200);
  assert(codes(dbx.rows).includes("cda.communication.published"));
  assert(dbx.rows["core.cda_communication"][0].published_at, "the row must record publication");
  assertEquals(dbx.rows["core.cda_communication"][0].archived_ref, "a1");
});

// ------------------------------------------------------------ CDA-02 glossary

Deno.test("CDA-02: the version is derived from the prior active term, never supplied", async () => {
  const { dbx, db } = await seedProgramme();
  await postCdaGlossaryChange(
    req({
      term: "Total Return", definition: "d1", citation: "12 CFR 721.3(b)(2)",
      attested_by: "cmp_01", version: 99,
    }),
    db, "t", CTX,
  );
  await postCdaGlossaryChange(
    req({
      term: "Total Return", definition: "d2", citation: "12 CFR 721.3(b)(2)",
      attested_by: "cmp_01", version: 99,
    }),
    db, "t", CTX,
  );
  const versions = dbx.rows["core.cda_glossary_term"].map((t) => t.version).sort();
  assertEquals(versions, [1, 2]);
  const active = dbx.rows["core.cda_glossary_term"].filter((t) => t.active === true);
  assertEquals(active.length, 1);
  assertEquals(active[0].version, 2);
});

Deno.test("CDA-02: a definition with no citation is refused", async () => {
  const { db } = await seedProgramme();
  const res = await postCdaGlossaryChange(
    req({ term: "Affiliate", definition: "d", attested_by: "cmp_01" }), db, "t", CTX,
  );
  assertEquals(res.status, 400);
});

// ------------------------------------------------------------- the whole gate

Deno.test("the gate reports EVERY failed condition, not just the first", async () => {
  const dbx = makeDrillDb();
  await postCda(
    req({ id: "cda_empty", structure_type: "spe_trust", account_label: "x" }),
    dbx.client, "t", CTX,
  );
  const v = await evaluateFundingGate(dbx.client, "core", "cda_empty", 1_000_00, null, new Date());
  for (
    const r of [
      "policy_not_adopted", "evidence_packet_not_filed",
      "agreement_clauses_unvalidated", "no_vendor_assigned", "net_worth_unknown",
    ]
  ) {
    assert(v.reasons.includes(r), `expected ${r} in ${JSON.stringify(v.reasons)}`);
  }
});

Deno.test("a fully compliant funding is permitted and books the money", async () => {
  const { dbx, db } = await seedProgramme();
  const res = await postCdaFunding(req({ amount_cents: 25_000_000 }), "cda_main", db, "t", CTX);
  assertEquals(res.status, 201);
  assertEquals(dbx.rows["core.cda"][0].book_value_cents, 25_000_000);
  assertEquals(dbx.rows["core.cda_funding_request"][0].decision, "permitted");
});

Deno.test("no constraint violations across the whole exercised surface", async () => {
  const { dbx, db } = await seedProgramme();
  await postCdaFunding(req({ amount_cents: 25_000_000 }), "cda_main", db, "t", CTX);
  await postCdaCapTest(req({ as_of_date: "2026-06-30" }), db, "t", CTX);
  await postCdaFeePayment(
    req({ payee: "Pynthia Credit Union", amount_cents: 1 }), "cda_main", db, "t", CTX,
  );
  await postCdaDistribution(
    req({
      donee_name: "R", donee_ein: "12-3456789", donee_irs_status: "501c3",
      amount_cents: 6_000_000, proposed_by: "a", approved_by: "b",
    }),
    "cda_main", db, "t", CTX,
  );
  assertEquals(dbx.violations, []);
});
