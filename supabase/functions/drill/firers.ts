// What the core can actually be made to DO, per trigger event.
//
// Every control in controls.json declares `trigger_event` -> `produced_events`.
// That IS its specification, so the test for every control is uniform:
//
//     fire the trigger through the API, then assert the produced events appear
//
// A control whose subsystem does not exist has no firer, its test goes RED, and
// the red line names the trigger that needs a writer. Red is the backlog.

// deno-lint-ignore no-explicit-any
type Any = any;

import { postAccountTransition } from "../api/accounts.ts";
import { postEntity, postEntityTransition } from "../api/entities.ts";
import { postVerification } from "../api/kyc.ts";
import { postAlertTriage, postCaseDecision, raiseAlert } from "../api/bsa.ts";
import { postCashTransaction, postCtrFile } from "../api/cash.ts";
import { postDisposalSweep, postDisposeRecord, postLegalHold, postHoldRelease, setRetentionClocks } from "../api/retention.ts";
import { postCalendarSweep, postObligation } from "../api/governance.ts";
import { postAanIssue, postLoanDecision, postLoanParty } from "../api/lending.ts";
import { postPaymentApproval } from "../api/eps.ts";
import { postAttestation, postObservation, postWorkItem, postWorkItemClose, postWorkItemSweep, putThreshold } from "../api/primitives.ts";
import { postAch } from "../api/ach.ts";
import { postWirePrepare } from "../api/wires.ts";
import { postTransfer } from "../api/transfers.ts";
import {
  postCloseIncident, postContainIncident, postDetermineReportability, postFirstHour,
  postIncident, postIncidentSweep, postMemberImpact, postNotifyNcua,
} from "../api/incidents.ts";

/**
 * The whole incident lifecycle, driven end to end.
 *
 * declare -> first hour + sitrep -> reportability determination (Compliance
 * only) -> NCUA notification within 72h OF THE DETERMINATION -> member notices
 * -> contain -> close -> sweep. Nothing is handed a code to emit.
 */
async function runEpsAuthFraud(env: FireEnv): Promise<void> {
  // OQ-24: issue a real card first. EPS-05 and EPS-07 declare card.id and
  // card.spend_controls as required inputs, and before the issuance writer
  // existed no card row could be created, so both stayed red on a missing
  // NOUN rather than any fault in their own logic.
  await postIssueCard(
    R({ member_ref: "mbr_eps_1", spend_controls: "intl_blocked" }),
    env.db, "d", env.actors.ops,
  );

  // Three failures in a row must LOCK OUT on the third, in the same write.
  for (let i = 0; i < 3; i++) {
    await postAuthEvent(
      R({ subject_ref: "mbr_eps_1", channel: "online", outcome: "failure" }),
      env.db, "d", env.actors.ops,
    );
  }
  // A challenged (not denied) attempt, which must carry its method.
  await postAuthEvent(
    R({ subject_ref: "mbr_eps_2", channel: "mobile", outcome: "failure", challenge_method: "otp_sms" }),
    env.db, "d", env.actors.ops,
  );
  await postAuthEvent(
    R({ subject_ref: "mbr_eps_2", channel: "mobile", outcome: "success" }),
    env.db, "d", env.actors.ops,
  );

  // First application has no previous value, so `changed` must NOT be emitted;
  // the second one must.
  await postCardControl(
    R({ card_ref: "card_1", control_type: "intl_block", new_value: "on", applied_by: "ops_1" }),
    env.db, "d", env.actors.ops,
  );
  await postCardControl(
    R({ card_ref: "card_1", control_type: "intl_block", new_value: "off", applied_by: "ops_1" }),
    env.db, "d", env.actors.ops,
  );

  await postPospayException(
    R({
      account_ref: "acct_pp", item_ref: "item_1", amount_cents: 250_00,
      reason: "amount_mismatch", cutoff_at: "2030-01-01T00:00:00.000Z",
    }),
    env.db, "d", env.actors.ops,
  );
  await postPospayDecision(
    R({ decision: "return", decided_by: "ops_2" }), "epspp_item_1", env.db, "d", env.actors.ops,
  );
  // NEGATIVE: an exception left undecided past its cutoff. It pays by default,
  // which is the risk the sweep exists to surface.
  await postPospayException(
    R({
      account_ref: "acct_pp", item_ref: "item_2", amount_cents: 900_00,
      reason: "no_issue_record", cutoff_at: "2020-01-01T00:00:00.000Z",
    }),
    env.db, "d", env.actors.ops,
  );
  await postFraudTrendReview(R({}), env.db, "d", env.actors.ops);
}

/**
 * The whole CDA programme, driven end to end.
 *
 * Board adoption -> qualified trustee -> segregated structure -> agreement
 * clauses A-D -> funding through the gate -> cap test -> a real cap BREACH
 * caused by net worth falling -> a cure that actually reduces the aggregate ->
 * distributions -> overlays and trades -> reconciliation -> quarter packet ->
 * programme audit -> termination. Nothing is handed a code to emit.
 *
 * Roughly half of the calls below are NEGATIVES that must be refused: an
 * unlabelled account, an agreement missing clause C, funding against an
 * unqualified vendor, a distribution to an unvalidated donee, a $60k
 * distribution self-approved by its proposer, a trade with no overlay
 * configured, an affiliate fee, a non-permissible in-kind asset. Each is
 * expected to 409, and each writes the refusal as evidence — a gate that only
 * records what it permitted cannot be audited.
 */
async function runCdaLifecycle(env: FireEnv): Promise<void> {
  // The harness fires every trigger a control declares, so a control with four
  // triggers would otherwise run this four times against the same ledger. The
  // lifecycle is a single narrative with a real cap breach and cure in it;
  // replaying it would re-supersede the policy adoption and block everything.
  if ((env.rows["core.cda"] ?? []).length > 0) return;

  const ops = env.actors.ops;
  const compliance = { ...ops, tokenId: "tok_cda_compliance", roles: ["bsa_compliance"] };

  // --- CDA-01: Board adoption. Everything else is gated on this being live.
  await postCdaPolicyAdoption(
    R({ policy_version: "v1.0", board_resolution_id: "board-2026-014", adopted_at: "2026-06-16T00:00:00.000Z" }),
    env.db, "d", compliance,
  );

  // net worth, from the capital subsystem rather than supplied: $7.5m of $50m
  await postCapitalPosition(
    R({ as_of_date: "2026-03-31", net_worth_cents: 750_000_000, total_assets_cents: 5_000_000_000 }),
    env.db, "d", ops,
  );

  // --- CDA-04: one qualified trustee, one that must NOT qualify.
  await postCdaVendor(
    R({
      name: "Northgate Trust", role: "trustee", regulator: "occ",
      registration_status: "active", registration_evidence_ref: "occ-cert-2026",
    }),
    env.db, "d", compliance,
  );
  // NEGATIVE: an adviser with no registration evidence. Qualification is
  // derived, so this cannot be waved through by asserting it.
  await postCdaVendor(
    R({ name: "Harbor Advisors", role: "discretionary_manager", regulator: "sec", registration_status: "active" }),
    env.db, "d", compliance,
  );
  // and a lapse detected on annual review, which must escalate to the Board
  await postCdaVendorReview(
    R({ registration_status: "lapsed" }), "cdaven_northgatetrust", env.db, "d", compliance,
  );
  // restore it, so the rest of the programme runs against a qualified trustee
  await postCdaVendorReview(
    R({ registration_status: "active", registration_evidence_ref: "occ-cert-2026" }),
    "cdaven_northgatetrust", env.db, "d", compliance,
  );

  // --- CDA-03: structure and segregation.
  await postCda(
    R({
      id: "cda_main", vendor_id: "cdaven_northgatetrust",
      structure_type: "segregated_custodial",
      account_label: "Pynthia Charitable Donation Account",
      custodian_statement_ref: "cust-stmt-2026Q2",
    }),
    env.db, "d", compliance,
  );
  // NEGATIVE: a CDA whose label does not designate it as one. §721.3(b)(2)(i)
  // requires the designation, not merely a name.
  await postCda(
    R({
      id: "cda_unlabelled", vendor_id: "cdaven_harboradvisors",
      structure_type: "spe_trust", account_label: "Investment Sub-Account",
    }),
    env.db, "d", compliance,
  );

  // --- CDA-05: clauses A-D.
  await postCdaAgreement(
    R({
      clauses: {
        clause_named_charities: true, clause_strategy_risk: true,
        clause_gaap_accounting: true, clause_distribution_frequency: true,
      },
      amendment: { redline_ref: "redline-3", board_resolution_id: "board-2026-021" },
    }),
    "cda_main", env.db, "d", compliance,
  );
  // NEGATIVE: missing the GAAP clause.
  await postCdaAgreement(
    R({
      clauses: {
        clause_named_charities: true, clause_strategy_risk: true,
        clause_distribution_frequency: true,
      },
    }),
    "cda_unlabelled", env.db, "d", compliance,
  );

  // --- CDA-06: funding through the gate. 5% of $7.5m is $375k; this is $250k.
  await postCdaFunding(R({ amount_cents: 25_000_000 }), "cda_main", env.db, "d", ops);
  // NEGATIVE: the unlabelled CDA fails four conditions at once, and the
  // refusal must name all of them rather than the first.
  await postCdaFunding(R({ amount_cents: 1_000_00 }), "cda_unlabelled", env.db, "d", ops);

  await postCdaCapTest(
    R({ as_of_date: "2026-06-30", certified_by: "controller_01" }), env.db, "d", compliance,
  );

  // --- CDA-06 breach: net worth FALLS to $4m. Nothing about the CDA changed;
  // the same $250k is now 6.25% of net worth. This is how cap breaches
  // actually happen, and it is why the cap test cannot be a funding-time check
  // alone.
  await postCapitalPosition(
    R({ as_of_date: "2026-09-30", net_worth_cents: 400_000_000, total_assets_cents: 5_000_000_000 }),
    env.db, "d", ops,
  );
  await postCdaCapTest(
    R({ as_of_date: "2026-09-30", certified_by: "controller_01" }), env.db, "d", compliance,
  );

  // --- CDA-08: the five-year window, opened with a real Total Return.
  await postCdaDistributionWindow(
    R({
      opened_at: "2026-01-01T00:00:00.000Z", closes_at: "2031-01-01T00:00:00.000Z",
      total_return_cents: 20_000_000,
    }),
    "cda_main", env.db, "d", compliance,
  );

  // NEGATIVE: an unvalidated donee. No EIN, no IRS status.
  await postCdaDistribution(
    R({
      donee_name: "Unknown Foundation", amount_cents: 1_000_00,
      proposed_by: "ops_1", approved_by: "ops_2", window_id: "cdawin_cda_main_1767225600000",
    }),
    "cda_main", env.db, "d", ops,
  );
  // NEGATIVE: $60k self-approved. Two calls by one token is not two people.
  await postCdaDistribution(
    R({
      donee_name: "Riverside Food Bank", donee_ein: "12-3456789", donee_irs_status: "501c3",
      amount_cents: 6_000_000, proposed_by: "ops_1", approved_by: "ops_1",
    }),
    "cda_main", env.db, "d", ops,
  );
  // the real one, dual-approved. It also drops book value under the 5% cap.
  await postCdaDistribution(
    R({
      donee_name: "Riverside Food Bank", donee_ein: "12-3456789", donee_irs_status: "501c3",
      amount_cents: 6_000_000, proposed_by: "ops_1", approved_by: "ops_2",
      window_id: "cdawin_cda_main_1767225600000",
    }),
    "cda_main", env.db, "d", ops,
  );
  // a sub-threshold one, which is logged with SINGLE approval rather than
  // silently omitted
  await postCdaDistribution(
    R({
      donee_name: "Riverside Food Bank", donee_ein: "12-3456789", donee_irs_status: "501c3",
      amount_cents: 250_00, proposed_by: "ops_1",
      window_id: "cdawin_cda_main_1767225600000",
    }),
    "cda_main", env.db, "d", ops,
  );

  // --- CDA-06 cure: the aggregate is now genuinely back under 5%.
  await postCdaCapCure(
    R({ cure_plan: "distributed $60,250 to Riverside Food Bank" }),
    "cdacap_20260930", env.db, "d", compliance,
  );

  // --- CDA-07: Board overlays, then a clean trade and a concentrated one.
  await putCdaOverlay(
    R({ limit_bp: 2500, approved_by: "board-2026-014" }),
    "cda_main", "single_issuer", env.db, "d", compliance,
  );
  await postCdaTrade(
    R({ issuer: "US Treasury", sector: "sovereign", amount_cents: 2_000_000 }),
    "cda_main", env.db, "d", ops,
  );
  // NEGATIVE: 25%+ of the book in one issuer.
  await postCdaTrade(
    R({ issuer: "Single Corp", sector: "corporate", amount_cents: 20_000_000 }),
    "cda_main", env.db, "d", ops,
  );
  await postCdaPosttradeCheck(R({ period: "2026-09" }), "cda_main", env.db, "d", compliance);

  // --- CDA-09: reconciliation, then the 789H mapping that hangs off it.
  await postCdaReconciliation(
    R({ period: "2026-08", gl_balance_cents: 18_750_000, custodian_balance_cents: 18_750_000 }),
    "cda_main", env.db, "d", compliance,
  );
  // NEGATIVE: books that do not agree.
  await postCdaReconciliation(
    R({ period: "2026-09", gl_balance_cents: 18_750_000, custodian_balance_cents: 18_749_100 }),
    "cda_main", env.db, "d", compliance,
  );
  await postCdaCallReportMapping(
    R({ cycle: "2026Q3", account_789h_mapping: "789H" }), "cda_main", env.db, "d", compliance,
  );

  // --- CDA-13: a permitted fee and an affiliate one that must be refused.
  await postCdaFeePayment(
    R({ payee: "Northgate Trust", amount_cents: 12_500 }), "cda_main", env.db, "d", ops,
  );
  await postCdaFeePayment(
    R({ payee: "Pynthia Credit Union", amount_cents: 40_000 }), "cda_main", env.db, "d", ops,
  );

  // --- CDA-11: quarterly valuation review on independent pricing.
  await postCdaValuationReview(
    R({
      period: "2026Q3", independent_pricing_ref: "bloomberg-2026Q3",
      portfolio_composition: { us_treasury: 2_000_000 },
    }),
    "cda_main", env.db, "d", compliance,
  );

  // --- CDA-01 / CDA-09 / CDA-13: the quarterly packet, assembled from the
  // tables rather than from a supplied summary.
  await postCdaQuarterClose(
    R({ quarter: "2026Q3", preparer_id: "controller_01" }), env.db, "d", compliance,
  );

  // --- CDA-11: the annual programme audit and its remediation.
  await postCdaAuditCycle(
    R({
      cycle_year: 2026,
      findings: [{ summary: "cap test evidence not retained", remediation_owner: "controller_01", due_days: 60 }],
    }),
    env.db, "d", compliance,
  );
  await postCdaFindingClose(
    R({ closure_evidence_ref: "remediation-pack-2026-1" }), "cdafind_2026_0", env.db, "d", compliance,
  );

  // --- CDA-02: a glossary change, versioned against the prior active term.
  await postCdaGlossaryChange(
    R({
      term: "Total Return", definition: "income plus realised and unrealised gains",
      citation: "12 CFR 721.3(b)(2)", attested_by: "compliance_01",
    }),
    env.db, "d", compliance,
  );

  // --- CDA-14: draft, approve, publish; and a page that fails the checklist.
  await postCdaCommunication(
    R({ title: "CDA Program", draft_ref: "draft-cda-1" }), env.db, "d", compliance,
  );
  // NEGATIVE: Marketing approval alone, with a failing WCAG checklist.
  await postCdaCommunicationApproval(
    R({ wcag_checklist_passed: false, marketing_approved_by: "mktg_01" }),
    "cdacom_cdaprogram", env.db, "d", compliance,
  );
  await postCdaCommunicationApproval(
    R({
      wcag_checklist_passed: true, marketing_approved_by: "mktg_01",
      compliance_approved_by: "compliance_01",
    }),
    "cdacom_cdaprogram", env.db, "d", compliance,
  );
  await postCdaCommunicationPublish(
    R({ archived_ref: "archive-cda-1" }), "cdacom_cdaprogram", env.db, "d", compliance,
  );

  // --- CDA-12: termination, closing distribution, in-kind, close.
  await postCdaTermination(
    R({ approved_by: "board-2026-031", final_accounting_ref: "final-2026" }),
    "cda_main", env.db, "d", compliance,
  );
  // the >=51% closing distribution: 20% was distributed in-window, so this
  // takes cumulative coverage over the threshold
  await postCdaDistribution(
    R({
      donee_name: "Riverside Food Bank", donee_ein: "12-3456789", donee_irs_status: "501c3",
      amount_cents: 4_500_000, kind: "closing", proposed_by: "ops_1", approved_by: "ops_2",
      window_id: "cdawin_cda_main_1767225600000",
    }),
    "cda_main", env.db, "d", ops,
  );
  await postCdaInkindTransfer(
    R({ asset_class: "us_treasury", amount_cents: 1_000_000, determination_ref: "part703-det-1" }),
    "cda_main", env.db, "d", compliance,
  );
  // NEGATIVE: an asset with no Part 703 basis must be liquidated, not received.
  await postCdaInkindTransfer(
    R({ asset_class: "private_equity_fund", amount_cents: 500_000, determination_ref: "part703-det-2" }),
    "cda_main", env.db, "d", compliance,
  );
  await postCdaClose(
    R({ final_accounting_ref: "final-accounting-2026" }), "cda_main", env.db, "d", compliance,
  );

  // --- CDA-01's negative half: let the adoption lapse and confirm the sweep
  // blocks the programme. Done LAST because it blocks everything above it.
  const pol = (env.rows["core.cda_policy"] ?? []).find((p: Any) => p.id === "cdapol_v10");
  if (pol) pol.expires_at = "2026-01-01T00:00:00.000Z";
  await postCdaPolicySweep(R({}), env.db, "d", compliance);
  // and a funding attempt against an expired policy, which must be refused
  await postCdaFunding(R({ amount_cents: 1_000_00 }), "cda_main", env.db, "d", ops);
}

async function runCapitalLifecycle(env: FireEnv): Promise<void> {
  // A WELL-CAPITALIZED position with a configured internal trigger. The trigger
  // sits above the statutory floor, so this position is compliant with NCUA and
  // still breaches the institution's own early warning — which is the entire
  // point of CP-03 having two layers.
  await postCapitalPosition(
    R({
      as_of_date: "2026-03-31",
      net_worth_cents: 7_500_000_00,
      total_assets_cents: 100_000_000_00,
      internal_trigger_bp: 800,
      tier1_cents: 6_000_000_00,
      tier2_cents: 1_500_000_00,
      classification_approved_by: "cfo_01",
    }),
    env.db, "d", env.actors.ops,
  );
  await postRwaRun(
    R({
      exposures: [
        { class: "cash", amount_cents: 5_000_000_00 },
        { class: "residential_mortgage", amount_cents: 40_000_000_00 },
        { class: "consumer", amount_cents: 20_000_000_00 },
        // NEGATIVE: an exposure class with no published weight. It must be
        // surfaced as unmapped rather than weighted at zero, because zero is
        // the direction that flatters the institution.
        { class: "crypto_exposure", amount_cents: 1_000_000_00 },
      ],
    }),
    "cap_20260331", env.db, "d", env.actors.ops,
  );

  // An UNDERCAPITALIZED position: 5.00% net worth ratio. This must classify as
  // undercapitalized, restrict distributions, and start the 45-day NWRP clock
  // in the same write.
  await postCapitalPosition(
    R({
      as_of_date: "2026-06-30",
      net_worth_cents: 5_000_000_00,
      total_assets_cents: 100_000_000_00,
      internal_trigger_bp: 800,
    }),
    env.db, "d", env.actors.ops,
  );
  await postNwrp(R({ filed_by: "cfo_01" }), "cap_20260630", env.db, "d", env.actors.ops);

  // NEGATIVE: a position with NO Board-approved internal trigger, left
  // unassessed, so the sweep has something to report as not-covered rather
  // than reporting a clean bill of health over the whole book.
  await postCapitalPosition(
    R({
      as_of_date: "2026-09-30",
      net_worth_cents: 4_200_000_00,
      total_assets_cents: 100_000_000_00,
    }),
    env.db, "d", env.actors.ops,
  );
  // and leave THIS one's restoration plan unfiled and overdue, so the sweep
  // has a real overdue case rather than an empty one.
  const rec = (env.rows["core.capital_position"] ?? []).find(
    (x: Any) => x.id === "cap_20260930",
  );
  if (rec) rec.nwrp_due_at = "2020-01-01T00:00:00.000Z";

  const cco = { ...env.actors.ops, tokenId: "tok_cco", roles: ["cco"] };
  const cfo = { ...env.actors.ops, tokenId: "tok_cfo", roles: ["cfo"] };

  // CP-01: a Board-approved internal target, above the statutory floor and
  // approved by someone other than its proposer.
  await postCapitalTarget(
    R({ effective_date: "2026-01-01", target_bp: 900, proposed_by: "cfo_01", approved_by: "board_chair" }),
    env.db, "d", cco,
  );
  // NEGATIVE: a target BELOW the 700bp floor must be refused, not stored as a
  // target that can never be breached.
  await postCapitalTarget(
    R({ effective_date: "2026-01-02", target_bp: 650, proposed_by: "cfo_01", approved_by: "board_chair" }),
    env.db, "d", cco,
  );
  // NEGATIVE: self-approval must be refused.
  await postCapitalTarget(
    R({ effective_date: "2026-01-03", target_bp: 900, proposed_by: "cfo_01", approved_by: "cfo_01" }),
    env.db, "d", cco,
  );

  for (const kind of ["capital_plan", "stress_report", "icaap_report"]) {
    await postCapitalDocument(
      R({ kind, cycle: "2026Q2", prepared_by: "cfo_01", presented_to: "alm_committee", reviewed_by: "board_chair" }),
      env.db, "d", cfo,
    );
  }
  // NEGATIVE: reviewed without ever being presented.
  await postCapitalDocument(
    R({ kind: "capital_plan", cycle: "2026Q3", prepared_by: "cfo_01", reviewed_by: "board_chair" }),
    env.db, "d", cfo,
  );

  await postCapitalSweep(R({}), env.db, "d", env.actors.ops);
}

async function runIncidentLifecycle(env: FireEnv): Promise<void> {
  const compliance = { ...env.actors.ops, tokenId: "tok_compliance", roles: ["bsa_compliance"] };
  const res = await postIncident(
    R({ title: `drill incident ${env.n()}`, severity: "sev1", source: "siem" }),
    env.db, "d", env.actors.ops,
  );
  const id = String((await res.clone().json().catch(() => ({}))).id ?? "");
  if (!id) return;
  await postFirstHour(R({ summary: "scope established" }), id, env.db, "d", env.actors.ops);
  await postDetermineReportability(
    R({ is_reportable: true, rationale: "member data likely misused" }),
    id, env.db, "d", compliance,
  );
  await postNotifyNcua(R({ reference: "NCUA-DRILL-1" }), id, env.db, "d", env.actors.ops);
  await postMemberImpact(R({ confirmed: true, template: "appendix-b" }), id, env.db, "d", env.actors.ops);
  await postContainIncident(R({}), id, env.db, "d", env.actors.ops);
  await postCloseIncident(R({}), id, env.db, "d", env.actors.ops);
  // a SECOND incident left undetermined, so the sweep has both negatives
  const r2 = await postIncident(
    R({ title: `undetermined ${env.n()}`, severity: "sev2" }), env.db, "d", env.actors.ops,
  );
  const id2 = String((await r2.clone().json().catch(() => ({}))).id ?? "");
  if (id2) {
    const rec = (env.rows["core.incident"] ?? []).find((x: Any) => x.id === id2);
    if (rec) rec.ncua_notice_due_at = "2020-01-01T00:00:00.000Z";
  }
  await postIncidentSweep(R({}), env.db, "d", env.actors.ops);
}
import {
  postAuthEvent, postCardControl, postFraudTrendReview, postPospayDecision,
  postPospayException,
} from "../api/eps_controls.ts";
import { postIssueCard } from "../api/cards.ts";
import {
  postCda, postCdaAgreement, postCdaAuditCycle, postCdaCallReportMapping, postCdaCapCure,
  postCdaCapTest, postCdaClose, postCdaCommunication, postCdaCommunicationApproval,
  postCdaCommunicationPublish, postCdaDistribution, postCdaDistributionWindow,
  postCdaFeePayment, postCdaFindingClose, postCdaFunding, postCdaGlossaryChange,
  postCdaInkindTransfer, postCdaPolicyAdoption, postCdaPolicySweep, postCdaPosttradeCheck,
  postCdaQuarterClose, postCdaReconciliation, postCdaTermination, postCdaTrade,
  postCdaValuationReview, postCdaVendor, postCdaVendorReview, putCdaOverlay,
} from "../api/cda.ts";
import {
  postCapitalDocument, postCapitalPosition, postCapitalSweep, postCapitalTarget,
  postNwrp, postRwaRun,
} from "../api/capital.ts";
import {
  postApproveAuditPlan, postAuditEngagement, postAuditSweep, postCloseFinding,
  postCompleteFieldwork, postFindingResponse, postIssueAuditReport, postStartAuditEngagement,
} from "../api/audit.ts";

/**
 * The whole audit engagement lifecycle, driven end to end.
 *
 * Every AU-* trigger is reached by running the REAL sequence: submit a plan,
 * have a different actor approve it, attest independence, start, complete
 * fieldwork with a rating, issue a report that opens findings, respond, retest,
 * close, and sweep for aged findings. Nothing is handed a code to emit.
 */
async function runAuditLifecycle(env: FireEnv, rating = "poor"): Promise<void> {
  const n = env.n();
  const scope = `Scope ${n}`;
  const open = await postAuditEngagement(
    R({ plan_cycle_year: 2026, scope, auditor_ref: `auditor_${n}` }),
    env.db, "d", env.actors.ops,
  );
  const id = String((await open.clone().json().catch(() => ({}))).id ?? "");
  if (!id) return;
  // a DIFFERENT actor approves — four-eyes, for real
  await postApproveAuditPlan(R({}), id, env.db, "d", env.actors.approver);
  await postStartAuditEngagement(R({ independence_attested: true }), id, env.db, "d", env.actors.reviewer);
  await postCompleteFieldwork(R({ rating }), id, env.db, "d", env.actors.ops);
  await postIssueAuditReport(
    R({ findings: [{ severity: "critical", summary: "control gap" }] }),
    id, env.db, "d", env.actors.officer,
  );
  const fid = `afind_${id}_0`;
  await postFindingResponse(R({ response: "will remediate" }), fid, env.db, "d", env.actors.ops);
  // age it so the sweep has something to escalate
  const f = (env.rows["core.audit_finding"] ?? []).find((x: Any) => x.id === fid);
  if (f) f.remediation_due_at = "2020-01-01T00:00:00.000Z";
  await postAuditSweep(R({}), env.db, "d", env.actors.ops);
  // a failed retest re-communicates; then risk acceptance closes it
  await postCloseFinding(R({ retest_result: "failed" }), fid, env.db, "d", env.actors.officer);
  await postCloseFinding(
    R({ risk_acceptance: "accepted", rationale: "compensating control" }),
    fid, env.db, "d", env.actors.officer,
  );
}

export interface FireEnv {
  db: Any;
  rows: Record<string, Any[]>;
  cfg: Any;
  ctx: Any;
  actors: Record<string, Any>;
  /** monotonic counter so ids never collide across 316 tests */
  n: () => number;
}

const R = (b?: unknown, h: Record<string, string> = {}) =>
  new Request("https://drill/x", {
    method: "POST",
    headers: { "content-type": "application/json", "Idempotency-Key": `k${Math.random()}`, ...h },
    body: b === undefined ? undefined : JSON.stringify(b),
  });

/**
 * THE GENERIC FIRER.
 *
 * Any trigger that is a cadence — `*.due`, `*.due_at`, `*.timer`,
 * `*cycle.opened` — can be produced by registering an obligation carrying that
 * code and sweeping the calendar. That is not a trick: it is exactly what the
 * governance calendar is for, and it makes all 83 time-based triggers firable
 * through one mechanism.
 */
const TIMER_RE = /(\.due(_at)?$|\.timer$|_timer$|cycle\.opened$|cycle_timer$|\.due$)/;

export async function fireViaObligation(code: string, uid: string, env: FireEnv): Promise<void> {
  await postObligation(
    R({
      control_uid: uid,
      trigger_code: code,
      title: `drill: ${code}`,
      cadence: "annual",
      anchor_date: "2026-01-01",
    }),
    env.db, "d", env.actors.ops,
  );
  await postCalendarSweep(R({}), env.db, "d", env.actors.ops);
}

/**
 * Explicit firers for triggers with a real writer. Each returns nothing and is
 * judged only by whether the control's produced events land in the event log.
 */
export const FIRERS: Record<string, (env: FireEnv, uid: string) => Promise<void>> = {
  "account.closed": async (env) => {
    const id = `acct_f${env.n()}`;
    env.rows["core.account"].push({
      id, entity_id: "ent_1", status: "open", lock_type: "none",
      account_type: "checking", balance: 100000, blnk_balance_id: "b", partner_id: "ptnr_drill",
      provenance: "production",
    });
    await postAccountTransition(R({ to: "closed" }), id, env.db, "d", env.actors.ops);
    await setRetentionClocks(env.db, id, new Date());
  },
  "entity.created": async (env) => {
    await postEntity(
      R({ type: "person", name: `Drill ${env.n()}`, date_of_birth: "1990-01-01" }),
      env.db, "d", env.actors.ops,
    );
  },
  "entity.updated": async (env) => {
    const id = `ent_u${env.n()}`;
    env.rows["core.entity"].push({ id, type: "person", name: "U", status: "pending", partner_id: "ptnr_drill" });
    await postEntityTransition(R({ to: "active" }), id, env.db, "d", env.actors.ops);
  },
  "verification.created": async (env) => {
    const id = `ent_v${env.n()}`;
    env.rows["core.entity"].push({ id, type: "person", name: "Clean Person", status: "pending", partner_id: "ptnr_drill" });
    await postVerification(R({}), id, env.db, "d", env.actors.ops);
  },
  "bsa_alert.created": async (env, uid) => {
    await raiseAlert(env.db, {
      ctx: env.actors.ops, alertType: "ctr_threshold", entityHash: "h",
      causeType: "transfer", causeId: `t${env.n()}`, details: uid,
    });
  },
  "case.investigation_complete": async (env) => {
    const n = env.n();
    await raiseAlert(env.db, {
      ctx: env.actors.ops, alertType: "structuring", entityHash: "h",
      causeType: "transfer", causeId: `ci${n}`, details: "d",
    });
    const res = await postAlertTriage(
      R({ outcome: "escalated" }), `alert_ci${n}_structuring`, env.db, "d", env.actors.investigator,
    );
    const b = await res.clone().json().catch(() => ({}));
    if (b?.case?.id) {
      await postCaseDecision(
        R({ decision: "file", rationale: "drill" }), b.case.id, env.db, "d", env.actors.officer,
      );
    }
  },
  "ctr.threshold.reached": async (env) => {
    const d = `2026-07-${String(10 + (env.n() % 15)).padStart(2, "0")}`;
    await postCashTransaction(
      R({ direction: "cash_in", amount_cents: 1_200_000, business_date: d, account_id: "acct_1" }),
      env.db, "d", env.actors.ops,
    );
  },
  "legal_hold.created": async (env) => {
    const n = env.n();
    const subj = `acct_h${n}`;
    env.rows["core.record"] ??= [];
    env.rows["core.record"].push({
      id: `rec_${subj}_cip_identity`, record_class: "cip_identity", subject_ref: subj,
      retention_anchor: "2014-01-01T00:00:00.000Z",
      retention_expires_at: "2019-01-01T00:00:00.000Z",
      legal_hold_flag: false, disposed_at: null, provenance: "production",
    });
    // the FULL SC-02 lifecycle: place -> release -> dispose. All three phases
    // are needed because SC-02 declares consequences from each.
    await postLegalHold(R({ matter_id: `m${n}`, scope_subject_ref: subj, reason: "drill" }), env.db, "d", env.actors.ops);
    await postHoldRelease(R({ approved_by: "gc" }), `hold_m${n}_${subj}`, env.db, "d", env.actors.ops);
    // the sweep is what SCHEDULES disposal — a real step in SC-02, not a
    // formality: it is where the three eligibility conditions are evaluated
    await postDisposalSweep(R({}), env.db, "d", env.actors.ops);
    await postDisposeRecord(
      R({ approved_by: "rm", certificate: `cert${n}` }), `rec_${subj}_cip_identity`,
      env.db, "d", env.actors.ops,
    );
  },
  "legal_hold.clear.confirmed": (env, uid) => FIRERS["legal_hold.created"](env, uid),
  "disposal.executed": async (env) => {
    const id = `rec_d${env.n()}`;
    env.rows["core.record"] ??= [];
    env.rows["core.record"].push({
      id, record_class: "cip_identity", subject_ref: "acct_9",
      retention_anchor: "2014-01-01T00:00:00.000Z", retention_expires_at: "2019-01-01T00:00:00.000Z",
      legal_hold_flag: false, disposed_at: null, provenance: "production",
    });
    await postDisposeRecord(R({ approved_by: "rm", certificate: "c" }), id, env.db, "d", env.actors.ops);
  },
  "record.disposal_eligible": async (env) => { await FIRERS["disposal.executed"](env, ""); },
  "record.hold.applied": (env, uid) => FIRERS["legal_hold.created"](env, uid),
  "record.hold.placed": (env, uid) => FIRERS["legal_hold.created"](env, uid),
  "record.hold.released": (env, uid) => FIRERS["legal_hold.clear.confirmed"](env, uid),
  "record.retention.expired": (env, uid) => FIRERS["disposal.executed"](env, uid),
  "record.created": (env, uid) => FIRERS["disposal.executed"](env, uid),
  /**
   * SC-02's full lifecycle in one pass. The retention controls are the SAME
   * shared control replicated into 11 policies, so one honest run of
   * place-hold -> release -> dispose satisfies all of them at once.
   */
  "legal_hold.placed": (env, uid) => FIRERS["legal_hold.created"](env, uid),
  "ach_transfer.created": async (env) => {
    await postAch(
      R({ source_account_id: "acct_2", amount_cents: 5_000, counterparty: { name: "V" } }),
      env.db, env.cfg, "d", env.actors.ops,
    );
  },
  "wire_transfer.submitted": async (env) => {
    await postWirePrepare(
      R({ source_account_id: "acct_3", amount_cents: 5_000, beneficiary: { name: "B", country: "US" } }),
      env.db, env.cfg, "d", env.actors.ops,
    );
  },
  "loan_party.added": async (env) => {
    await postLoanParty(
      R({ role: "borrower", party_name: `P${env.n()}` }), "app_1", env.db, "d", env.actors.ops,
    );
  },
  "loan_application.completed": async (env) => {
    const id = `app_f${env.n()}`;
    env.rows["core.loan_application"].push({
      id, status: "completed", completed_at: "2026-06-01T00:00:00.000Z",
      decisioned_at: null, final_action: null, funding_block_state: "open", provenance: "production",
    });
  },
  "application.final_action.recorded": async (env) => {
    const id = `app_fa${env.n()}`;
    env.rows["core.loan_application"].push({
      id, status: "completed", completed_at: "2026-06-01T00:00:00.000Z",
      decisioned_at: null, final_action: null, funding_block_state: "open", provenance: "production",
    });
    await postLoanDecision(
      R({ final_action: "denied", reasons: ["drill"] }), id, env.db, "d", env.actors.ops,
    );
    await postAanIssue(R({}), `aan_${id}`, env.db, "d", env.actors.reviewer);
  },
  "aan.second_review.completed": async (env) => {
    await FIRERS["application.final_action.recorded"](env, "");
  },
  "audit.plan_cycle.opened": (env) => runAuditLifecycle(env),
  "audit.annual_plan.submitted": (env) => runAuditLifecycle(env),
  "audit.engagement.started": (env) => runAuditLifecycle(env),
  "audit.fieldwork.completed": (env) => runAuditLifecycle(env),
  "audit.report.issued": (env) => runAuditLifecycle(env),
  "audit.report.submitted": (env) => runAuditLifecycle(env),
  "audit.scope_change.identified": (env) => runAuditLifecycle(env),
  "audit.poor_rating.recorded": (env) => runAuditLifecycle(env),
  "finding.opened": (env) => runAuditLifecycle(env),
  "finding.monthly_review.recorded": (env) => runAuditLifecycle(env),
  "finding.aging_threshold.breached": (env) => runAuditLifecycle(env),
  "finding.quarterly_report.delivered": (env) => runAuditLifecycle(env),
  "finding.management_response.recorded": (env) => runAuditLifecycle(env),
  "finding.risk_acceptance.proposed": (env) => runAuditLifecycle(env),
  "risk_acceptance.decided": (env) => runAuditLifecycle(env),
  "finding.remediation.reported": (env) => runAuditLifecycle(env),
  "finding.closure.verified": (env) => runAuditLifecycle(env),
  "finding.closure.rejected": (env) => runAuditLifecycle(env),
  "audit.committee_meeting.scheduled": (env) => runAuditLifecycle(env),
  "audit.external_engagement.proposed": (env) => runAuditLifecycle(env),
  "audit.workpaper_access.requested": (env) => runAuditLifecycle(env),
  "audit.workpaper_access.decided": (env) => runAuditLifecycle(env),
  "audit.cycle_timer": (env) => runAuditLifecycle(env),
  "audit.remediation.due": (env) => runAuditLifecycle(env),
  "audit.report_issued": (env) => runAuditLifecycle(env),
  "capital.ratios.verified": (env) => runCapitalLifecycle(env),
  "capital.pca_threshold.breached": (env) => runCapitalLifecycle(env),
  "capital.quarter_close": (env) => runCapitalLifecycle(env),
  "capital.target.breached": (env) => runCapitalLifecycle(env),
  "capital.contingency.activated": (env) => runCapitalLifecycle(env),
  "capital.components.classified": (env) => runCapitalLifecycle(env),
  "capital.instrument.changed": (env) => runCapitalLifecycle(env),
  "capital.buffer_status.recorded": (env) => runCapitalLifecycle(env),
  "capital.stress_report.issued": (env) => runCapitalLifecycle(env),
  "capital.action_board.decided": (env) => runCapitalLifecycle(env),
  "capital.internal_trigger.breached": (env) => runCapitalLifecycle(env),
  "capital.plan.prepared": (env) => runCapitalLifecycle(env),
  "capital.distribution_restriction.applied": (env) => runCapitalLifecycle(env),
  "rwa.mapping_run.started": (env) => runCapitalLifecycle(env),
  "rwa.exposure.classified": (env) => runCapitalLifecycle(env),
  "portfolio.board_report.issued": (env) => runCapitalLifecycle(env),
  "portfolio.management_report.issued": (env) => runCapitalLifecycle(env),
  "stress.quarter_open": (env) => runCapitalLifecycle(env),
  "stress.scenario.run": (env) => runCapitalLifecycle(env),
  "capital.report.quarter_close": (env) => runCapitalLifecycle(env),
  "capital.plan.updated": (env) => runCapitalLifecycle(env),
  "capital.plan.presented": (env) => runCapitalLifecycle(env),
  "capital.plan.reviewed": (env) => runCapitalLifecycle(env),
  "capital.quarterly_report.issued": (env) => runCapitalLifecycle(env),
  "capital.quarterly_report.reviewed": (env) => runCapitalLifecycle(env),
  "capital.contingency_memo.issued": (env) => runCapitalLifecycle(env),
  "capital.board_escalation.issued": (env) => runCapitalLifecycle(env),
  "capital.contingency_action.executed": (env) => runCapitalLifecycle(env),
  "capital.action.proposed": (env) => runCapitalLifecycle(env),
  "capital.action.executed": (env) => runCapitalLifecycle(env),
  "capital.icaap_cycle.opened": (env) => runCapitalLifecycle(env),
  "capital.icaap_report.issued": (env) => runCapitalLifecycle(env),
  "capital.icaap.presented": (env) => runCapitalLifecycle(env),
  "capital.icaap.reviewed": (env) => runCapitalLifecycle(env),
  "capital.buffer.breached": (env) => runCapitalLifecycle(env),
  "rwa.trading_threshold_crossed": (env) => runCapitalLifecycle(env),
  "capital.credit_growth_threshold_crossed": (env) => runCapitalLifecycle(env),
  "capital.stress_report_id": (env) => runCapitalLifecycle(env),
  "stress_test.completed": (env) => runCapitalLifecycle(env),
  "capital.targets.approved": (env) => runCapitalLifecycle(env),
  "eps.auth.decided": (env) => runEpsAuthFraud(env),
  "eps.auth_lockout.applied": (env) => runEpsAuthFraud(env),
  "eps.auth.challenged": (env) => runEpsAuthFraud(env),
  "eps.card_control.applied": (env) => runEpsAuthFraud(env),
  "eps.card_control.changed": (env) => runEpsAuthFraud(env),
  "eps.pospay_exception.presented": (env) => runEpsAuthFraud(env),
  "eps.pospay_exception.decided": (env) => runEpsAuthFraud(env),
  "eps.fraud_trend_review.completed": (env) => runEpsAuthFraud(env),
  "eps.auth.failure_count": (env) => runEpsAuthFraud(env),
  // Every cda trigger runs the one programme lifecycle. Three of these
  // (`*_cycle.opened`) would otherwise match TIMER_RE and be fired through the
  // governance calendar, which would register an obligation and emit nothing a
  // CDA control declares — a control can only pass here by the programme
  // actually running.
  "cda.audit_cycle.opened": (env) => runCdaLifecycle(env),
  "cda.policy.expired": (env) => runCdaLifecycle(env),
  "cda.quarter.closed": (env) => runCdaLifecycle(env),
  "cda.month.closed": (env) => runCdaLifecycle(env),
  "cda.call_report_cycle.opened": (env) => runCdaLifecycle(env),
  "cda.glossary_change.proposed": (env) => runCdaLifecycle(env),
  "cda.evidence_packet.filed": (env) => runCdaLifecycle(env),
  "cda.vendor_onboarding.started": (env) => runCdaLifecycle(env),
  "cda.vendor_review.completed": (env) => runCdaLifecycle(env),
  "cda.vendor_issue.flagged": (env) => runCdaLifecycle(env),
  "cda.agreement.submitted": (env) => runCdaLifecycle(env),
  "cda.agreement_amendment.proposed": (env) => runCdaLifecycle(env),
  "cda.cap_test.scheduled": (env) => runCdaLifecycle(env),
  "cda.funding.requested": (env) => runCdaLifecycle(env),
  "cda.cap.breached": (env) => runCdaLifecycle(env),
  "cda.trade.proposed": (env) => runCdaLifecycle(env),
  "cda.posttrade_check.scheduled": (env) => runCdaLifecycle(env),
  "cda.distribution.proposed": (env) => runCdaLifecycle(env),
  "cda.distribution_cycle.opened": (env) => runCdaLifecycle(env),
  "cda.audit_finding.logged": (env) => runCdaLifecycle(env),
  "cda.termination.approved": (env) => runCdaLifecycle(env),
  "cda.inkind_transfer.proposed": (env) => runCdaLifecycle(env),
  "cda.account.closed": (env) => runCdaLifecycle(env),
  "cda.fee_payment.proposed": (env) => runCdaLifecycle(env),
  "cda.fee_conflict.flagged": (env) => runCdaLifecycle(env),
  "cda.communication.drafted": (env) => runCdaLifecycle(env),
  "cda.communication.published": (env) => runCdaLifecycle(env),
  "incident.declared": (env) => runIncidentLifecycle(env),
  "incident.detected": (env) => runIncidentLifecycle(env),
  "incident.sev1.detected": (env) => runIncidentLifecycle(env),
  "incident.classified": (env) => runIncidentLifecycle(env),
  "incident.severity.assigned": (env) => runIncidentLifecycle(env),
  "incident.ic.assigned": (env) => runIncidentLifecycle(env),
  "incident.first_hour.completed": (env) => runIncidentLifecycle(env),
  "incident.contained": (env) => runIncidentLifecycle(env),
  "incident.closed": (env) => runIncidentLifecycle(env),
  "incident.signal.received": (env) => runIncidentLifecycle(env),
  "incident.reportability_determination": (env) => runIncidentLifecycle(env),
  "incident.member_impact.confirmed": (env) => runIncidentLifecycle(env),
  "incident.created": (env) => runIncidentLifecycle(env),
  "incident.ncua.notified": (env) => runIncidentLifecycle(env),
  "incident.member_notices.sent": (env) => runIncidentLifecycle(env),
  "transfer.settled": async (env) => {
    await postTransfer(
      R({ source_account_id: "acct_4", destination_account_id: "acct_5", amount_cents: 1_000 }),
      env.db, env.cfg, "d", env.actors.ops,
    );
  },
};

/** Generic work-item firers: anything shaped like a lifecycle. */
export async function fireViaWorkItem(
  code: string, uid: string, env: FireEnv,
): Promise<void> {
  const kind = code.includes("request") || code.endsWith(".requested") || code.endsWith(".proposed")
    ? "request"
    : code.endsWith(".received") || code.endsWith(".presented")
    ? "inbound"
    : code.endsWith(".issued") || code.endsWith(".sent") || code.endsWith(".published")
    ? "notice"
    : "task";
  const res = await postWorkItem(
    R({
      control_uid: uid, kind, title: `drill: ${code}`,
      due_at: "2026-08-01T00:00:00Z",
      ...(kind === "inbound" ? { source_ref: "drill", received_at: "2026-07-01T00:00:00Z" } : {}),
    }),
    env.db, "d", env.actors.ops,
  );
  const b = await res.clone().json().catch(() => ({}));
  if (b?.id) {
    await postWorkItemClose(
      R({ outcome: "completed", rationale: "drill" }), b.id, env.db, "d", env.actors.ops,
    );
  }
  await postWorkItemSweep(R({}), env.db, "d", env.actors.ops);
}

/** Generic threshold firer: anything shaped like a breach. */
export async function fireViaThreshold(code: string, uid: string, env: FireEnv): Promise<void> {
  const id = `th_${env.n()}`;
  await putThreshold(
    R({ control_uid: uid, metric: code, subject_scope: "institution", limit_value: 10 }),
    id, env.db, "d", env.actors.ops,
  );
  await postObservation(R({ value: 999 }), id, env.db, "d", env.actors.ops);
}

/** Generic attestation firer: anything shaped like a record/log/attest. */
export async function fireViaAttestation(code: string, uid: string, env: FireEnv): Promise<void> {
  await postAttestation(
    R({ control_uid: uid, statement: `drill: ${code}`, evidence_ref: code }),
    env.db, "d", env.actors.ops,
  );
}

export { TIMER_RE };
