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
  postCloseIncident, postContainIncident, postDetermineReportability, postExternalComms,
  postFirstHour, postIncidentAssessment,
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
        agreement_named_charities_clause: true, agreement_strategy_clause: true,
        agreement_gaap_clause: true, agreement_distribution_clause: true,
      },
      strategy_limits: { max_duration_years: 5, min_rating: "investment_grade" },
      amendment: { agreement_redline: "redline-3", board_resolution_id: "board-2026-021" },
    }),
    "cda_main", env.db, "d", compliance,
  );
  // NEGATIVE: missing the GAAP clause.
  await postCdaAgreement(
    R({
      clauses: {
        agreement_named_charities_clause: true, agreement_strategy_clause: true,
        agreement_distribution_clause: true,
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
  if (pol) pol.policy_expiry_at = "2026-01-01T00:00:00.000Z";
  await postCdaPolicySweep(R({}), env.db, "d", compliance);
  // and a funding attempt against an expired policy, which must be refused
  await postCdaFunding(R({ amount_cents: 1_000_00 }), "cda_main", env.db, "d", ops);
}

/**
 * The whole cash-OPERATIONS programme, driven end to end.
 *
 * Board policy -> vault and ATM registered -> effective-dated limits -> a
 * permitted load and a refused one -> enterprise position through warning and
 * breach and a real remediation -> reconciliation with a variance that parks
 * in GL suspense and ages -> over/short with a cumulative pattern that raises
 * a BSA alert -> shipments with a matched seal and a mismatched one that
 * declares an incident -> CMIR on a border crossing -> surprise count ->
 * seasonal deviation -> KRI pack -> Board summary -> examiner export.
 *
 * WHAT IS ABSENT ON PURPOSE: no employee is created and no HR record is
 * written. CP-05 and CP-07 stay red naming those entities. See the standing
 * rule in BLUEPRINT.
 */
async function runCashOpsLifecycle(env: FireEnv): Promise<void> {
  if ((env.rows["core.cash_asset"] ?? []).length > 0) return;

  const ops = env.actors.ops;
  const compliance = { ...ops, tokenId: "tok_cash_compliance", roles: ["bsa_compliance"] };

  await postCashPolicyAdoption(
    R({
      policy_document_version: "cash-v2.1", board_resolution_id: "board-2026-007",
      adopted_at: "2026-04-01T00:00:00.000Z",
    }),
    env.db, "d", compliance,
  );

  await putCashAsset(
    R({ asset_type: "vault", location_id: "branch_01", balance_cents: 500_000_00,
        custodian_user_id: "cust_1" }),
    "casset_vault1", env.db, "d", ops,
  );
  await putCashAsset(
    R({ asset_type: "atm", location_id: "branch_01", balance_cents: 40_000_00,
        custodian_user_id: "cust_2" }),
    "casset_atm1", env.db, "d", ops,
  );
  // an asset with NO limits schedule at all, so a load against it must be
  // refused for "unknown", not permitted for "no limit"
  await putCashAsset(
    R({ asset_type: "teller_drawer", location_id: "branch_02", balance_cents: 5_000_00 }),
    "casset_drawer_unlimited", env.db, "d", ops,
  );

  await postCashLimitsSchedule(
    R({ asset_id: "casset_vault1", limit_cents: 750_000_00,
        effective_at: "2026-01-01T00:00:00.000Z", board_resolution_id: "board-2026-007" }),
    env.db, "d", compliance,
  );
  await postCashLimitsSchedule(
    R({ asset_id: "casset_atm1", limit_cents: 60_000_00,
        effective_at: "2026-01-01T00:00:00.000Z", board_resolution_id: "board-2026-007" }),
    env.db, "d", compliance,
  );
  // NEGATIVE for the ordering assumption: a FUTURE-dated schedule that must
  // not govern today's loads. If `limitInForce` took the newest row this
  // would raise the vault limit six months early.
  await postCashLimitsSchedule(
    R({ asset_id: "casset_vault1", limit_cents: 2_000_000_00,
        effective_at: "2027-01-01T00:00:00.000Z", board_resolution_id: "board-2027-001" }),
    env.db, "d", compliance,
  );

  // permitted: 500k + 100k = 600k, under the 750k limit, two people
  await postCashLoad(
    R({ amount_cents: 100_000_00, counter_user_id: "teller_1", custodian_user_id: "cust_1" }),
    "casset_vault1", env.db, "d", ops,
  );
  // NEGATIVE: would breach the limit in force
  await postCashLoad(
    R({ amount_cents: 300_000_00, counter_user_id: "teller_1", custodian_user_id: "cust_1" }),
    "casset_vault1", env.db, "d", ops,
  );
  // NEGATIVE: one person doing both halves of dual control
  await postCashLoad(
    R({ amount_cents: 1_000_00, counter_user_id: "teller_1", custodian_user_id: "teller_1" }),
    "casset_atm1", env.db, "d", ops,
  );
  // NEGATIVE: no limit in force — unknown is not permission
  await postCashLoad(
    R({ amount_cents: 1_000_00, counter_user_id: "teller_1", custodian_user_id: "cust_2" }),
    "casset_drawer_unlimited", env.db, "d", ops,
  );

  // CP-03: warning band, then a breach, then a remediation that actually works
  await postCashEnterprisePosition(
    R({ as_of_date: "2026-05-31", cash_cents: 1_200_000_00,
        gl_total_assets_cents: 50_000_000_00, limit_bp: 300, warning_bp: 200 }),
    env.db, "d", compliance,
  );
  await postCashEnterprisePosition(
    R({ as_of_date: "2026-06-30", cash_cents: 2_000_000_00,
        gl_total_assets_cents: 50_000_000_00, limit_bp: 300, warning_bp: 200 }),
    env.db, "d", compliance,
  );
  // NEGATIVE: a remediation claimed while the position is still over the limit
  await postCashEnterpriseRemediation(
    R({ action: "swept to correspondent", cash_cents: 1_900_000_00 }),
    "cashent_20260630", env.db, "d", compliance,
  );
  await postCashEnterpriseRemediation(
    R({ action: "swept to correspondent", cash_cents: 1_400_000_00 }),
    "cashent_20260630", env.db, "d", compliance,
  );
  // NEGATIVE: a position with NO Board limit set. It must report `unassessed`
  // rather than "within limit", which is the flattering reading of a decision
  // nobody made.
  await postCashEnterprisePosition(
    R({ as_of_date: "2026-07-31", cash_cents: 3_000_000_00,
        gl_total_assets_cents: 50_000_000_00 }),
    env.db, "d", compliance,
  );

  // CP-06: a clean day and a day that does not balance
  await postCashReconciliation(
    R({ business_date: "2026-07-15", counted_cents: 600_000_00, gl_balance_cents: 600_000_00 }),
    "casset_vault1", env.db, "d", ops,
  );
  await postCashReconciliation(
    R({ business_date: "2026-07-16", counted_cents: 599_950_00,
        gl_balance_cents: 600_000_00, research_notes: "strap miscount under review" }),
    "casset_vault1", env.db, "d", ops,
  );
  // age the suspense item so the sweep has a real escalation
  const sus = (env.rows["core.gl_cash_suspense"] ?? [])[0];
  if (sus) sus.escalate_at = "2020-01-01T00:00:00.000Z";
  await postCashSuspenseSweep(R({}), env.db, "d", ops);
  await postCashSuspenseClear(
    R({ correction_txn_id: "gl_txn_9911" }), String(sus?.id ?? "none"), env.db, "d", ops,
  );

  // CP-07: three shorts by the same custodian. Individually noise; cumulative
  // they cross the threshold and raise a BSA alert.
  for (const [i, amt] of [-2_000, -1_800, -9_000].entries()) {
    await postCashOverShort(
      R({
        custodian_user_id: "teller_9", business_date: `2026-07-1${i}`,
        amount_cents: amt, threshold_cents: 10_000,
        research_notes: i === 2 ? "no explanation found" : undefined,
      }),
      "casset_atm1", env.db, "d", ops,
    );
  }
  const osRow = (env.rows["core.cash_overshort"] ?? [])[0];
  await postCashOverShortResolve(
    R({ research_notes: "recount located the difference" }),
    String(osRow?.id ?? "none"), env.db, "d", ops,
  );

  // CP-08: a good shipment, a seal mismatch, and a border crossing over $10k
  await postCashShipment(
    R({ id: "cship_ok", asset_id: "casset_vault1", direction: "inbound",
        amount_cents: 250_000_00, seal_expected: "SEAL-A1", courier_receipt_id: "crt-1" }),
    env.db, "d", ops,
  );
  await postCashShipmentVerify(
    R({ seal_found: "SEAL-A1", counter_user_id: "teller_1", custodian_user_id: "cust_1" }),
    "cship_ok", env.db, "d", ops,
  );
  await postCashShipment(
    R({ id: "cship_bad", asset_id: "casset_vault1", direction: "inbound",
        amount_cents: 100_000_00, seal_expected: "SEAL-B2", courier_receipt_id: "crt-2" }),
    env.db, "d", ops,
  );
  // NEGATIVE: the seal does not match. This is an incident, not a note.
  await postCashShipmentVerify(
    R({ seal_found: "SEAL-B7", counter_user_id: "teller_1", custodian_user_id: "cust_1" }),
    "cship_bad", env.db, "d", ops,
  );
  await postCashShipment(
    R({ id: "cship_intl", direction: "outbound", amount_cents: 45_000_00,
        seal_expected: "SEAL-C3", crosses_border: true, courier_receipt_id: "crt-3" }),
    env.db, "d", ops,
  );
  await postCashNightDropRetrieval(
    R({ counter_user_id: "teller_2", custodian_user_id: "cust_1", bag_count: 4 }),
    "casset_vault1", env.db, "d", ops,
  );

  // CP-09
  await postCashSurpriseCountSchedule(
    R({ asset_id: "casset_atm1", scheduled_for: "2026-07-18" }), env.db, "d", compliance,
  );
  await postCashSurpriseCountComplete(
    R({ counted_cents: 39_900_00, counted_by: "auditor_1" }),
    "cashsc_casset_atm1_20260718", env.db, "d", compliance,
  );

  // CP-10: a seasonal deviation, refused without a bond adjustment and then
  // approved with one
  await postCashDeviationRequest(
    R({ asset_id: "casset_atm1", requested_limit_cents: 120_000_00,
        period_reason: "holiday season", sunset_at: "2027-01-15T00:00:00.000Z" }),
    env.db, "d", compliance,
  );
  const dev = (env.rows["core.cash_deviation"] ?? [])[0];
  await postCashDeviationDecision(
    R({ decision: "approved", board_resolution_id: "board-2026-044" }),
    String(dev?.id ?? "none"), env.db, "d", compliance,
  );
  await postCashDeviationDecision(
    R({ decision: "approved", board_resolution_id: "board-2026-044",
        insurance_bond_adjustment: "bond rider +$60k" }),
    String(dev?.id ?? "none"), env.db, "d", compliance,
  );

  await postCashException(
    R({ kind: "limit_override", rationale: "armoured car delayed 48h",
        risk_acceptance: "accepted by CFO for the period",
        accepted_by: "cfo_01", asset_id: "casset_vault1" }),
    env.db, "d", compliance,
  );

  await postCashKriPublish(R({ period: "2026-07" }), env.db, "d", compliance);
  await postCashBoardSummary(R({ quarter: "2026Q3" }), env.db, "d", compliance);

  // CP-09 / CP-12: the examiner export, with a declared scope
  await postCashRecordsPackage(
    R({
      purpose: "exam_export",
      scope: { period: "2026Q3", assets: ["casset_vault1", "casset_atm1"] },
      delivered_to: "NCUA examiner team",
    }),
    env.db, "d", compliance,
  );

  // CP-12 also declares the retention lifecycle. Those writers already exist,
  // so the cash evidence is clocked through them rather than duplicated.
  env.rows["core.record"] ??= [];
  env.rows["core.record"].push({
    id: `rec_cash_${env.n()}`, record_class: "cash_operations", subject_ref: "casset_vault1",
    retention_anchor: "2014-01-01T00:00:00.000Z",
    retention_expires_at: "2019-01-01T00:00:00.000Z",
    legal_hold_flag: false, disposed_at: null, provenance: "production",
  });
  await setRetentionClocks(env.db, "casset_vault1", new Date());
  await postDisposalSweep(R({}), env.db, "d", env.actors.ops);
}

/**
 * Records administration, driven end to end.
 *
 * Schedule A registered and then AMENDED -> a class with no schedule entry
 * (which must refuse, not default) -> a permanent class that never becomes
 * disposal eligible -> integrity tests that pass and fail -> archive
 * confirmations -> storage boxes reconciled against actual disposals ->
 * risk-based CDD refresh -> anonymization rather than destruction for BSA
 * records -> annual policy review -> a records contact assigned and vacated.
 */
async function runRecordsAdminLifecycle(env: FireEnv): Promise<void> {
  if ((env.rows["core.retention_schedule_entry"] ?? []).length > 0) return;
  const ops = env.actors.ops;

  // RR-01: Schedule A as data, with a citation.
  await postRetentionScheduleEntry(
    R({ record_class: "cip_identity", retention_years: 5, anchor_kind: "account_closed",
        citation: "31 CFR 1020.220", effective_at: "2026-01-01T00:00:00.000Z" }),
    env.db, "d", ops,
  );
  // and an AMENDMENT, which supersedes and inherits
  await postRetentionScheduleEntry(
    R({ record_class: "cip_identity", retention_years: 7, anchor_kind: "account_closed",
        citation: "31 CFR 1020.220", effective_at: "2026-06-01T00:00:00.000Z",
        amended_by: "records_officer" }),
    env.db, "d", ops,
  );
  await postRetentionScheduleEntry(
    R({ record_class: "bsa_sar", retention_years: 5, anchor_kind: "filed",
        citation: "31 CFR 1020.320", effective_at: "2026-01-01T00:00:00.000Z" }),
    env.db, "d", ops,
  );
  // RR-11: a PERMANENT class
  await postRetentionScheduleEntry(
    R({ record_class: "charter", permanent: true, anchor_kind: "created",
        citation: "12 CFR 701", effective_at: "2026-01-01T00:00:00.000Z" }),
    env.db, "d", ops,
  );
  // NEGATIVE: a schedule entry with no citation
  await postRetentionScheduleEntry(
    R({ record_class: "misc", retention_years: 3, anchor_kind: "created" }), env.db, "d", ops,
  );

  await postRecordClassify(
    R({ record_class: "cip_identity", record_id: "rec_ra_1", subject_ref: "acct_ra" }),
    env.db, "d", ops,
  );
  await postRecordClassify(
    R({ record_class: "charter", record_id: "rec_ra_perm", subject_ref: "org" }),
    env.db, "d", ops,
  );
  // NEGATIVE: a class with no Schedule A entry must REFUSE, not default
  await postRecordClassify(
    R({ record_class: "mystery_class", record_id: "rec_ra_unk" }), env.db, "d", ops,
  );

  // RR-02 / RR-06: integrity tests, one passing and one failing
  await postIntegrityTestSchedule(
    R({ subject_kind: "record", subject_ref: "rec_ra_1", test_kind: "conversion" }),
    env.db, "d", ops,
  );
  await postIntegrityTestComplete(
    R({ passed: true, sample_size: 25, certified_by: "records_officer" }),
    "rint_record_rec_ra_1_conversion", env.db, "d", ops,
  );
  await postIntegrityTestSchedule(
    R({ subject_kind: "email_archive", subject_ref: "exchange", test_kind: "readability" }),
    env.db, "d", ops,
  );
  // NEGATIVE: a failing test must open a finding
  await postIntegrityTestComplete(
    R({ passed: false, sample_size: 40, certified_by: "records_officer" }),
    "rint_email_archive_exchange_readability", env.db, "d", ops,
  );
  await postIntegrityTestSchedule(
    R({ subject_kind: "core_archive", subject_ref: "core_vendor", test_kind: "completeness" }),
    env.db, "d", ops,
  );
  await postIntegrityTestComplete(
    R({ passed: true, sample_size: 10, certified_by: "records_officer",
        retention_years_confirmed: 7 }),
    "rint_core_archive_core_vendor_completeness", env.db, "d", ops,
  );
  await postArchiveConfirmation(
    R({ archive_kind: "core_archive", period: "2026", vendor_ref: "core_vendor",
        retention_years_confirmed: 7, confirmed_by: "records_officer" }),
    env.db, "d", ops,
  );

  // RR-04: a box marked destroyed whose records are still live
  await postStorageBox(
    R({ id: "sbox_1", label: "BOX-2019-A", location: "offsite",
        record_ids: ["rec_ra_1", "rec_ra_perm"] }),
    env.db, "d", ops,
  );
  const box = (env.rows["core.storage_box"] ?? []).find((b: Any) => b.id === "sbox_1");
  if (box) box.destroyed_at = "2026-07-01T00:00:00.000Z";
  await postDestructionLogReconcile(R({}), env.db, "d", ops);
  await postDestructionLogResolve(
    R({ resolution: "records recalled from offsite; box re-opened" }),
    "dlmm_sbox_1", env.db, "d", ops,
  );

  // RR-08: risk-based CDD
  await postCddProfile(
    R({ id: "cdd_high", entity_id: "ent_1", risk_rating: "high",
        last_refreshed_at: "2024-01-01T00:00:00.000Z" }),
    env.db, "d", ops,
  );
  await postCddRefresh(R({ refreshed_by: "bsa_analyst" }), "cdd_high", env.db, "d", ops);

  // RR-07: a BSA record ANONYMIZED rather than destroyed
  env.rows["core.record"] ??= [];
  env.rows["core.record"].push({
    id: "rec_ra_bsa", record_class: "bsa_sar", subject_ref: "case_1",
    retention_anchor: "2014-01-01T00:00:00.000Z",
    retention_expires_at: "2019-01-01T00:00:00.000Z",
    legal_hold_flag: false, disposed_at: null, provenance: "production",
  });
  await postRecordDisposition(
    R({ method: "anonymized", approved_by: "bsa_officer",
        retained_fields: ["amount_band", "typology"] }),
    "rec_ra_bsa", env.db, "d", ops,
  );
  // NEGATIVE: a permanent record can never be disposed, whatever the method
  await postRecordDisposition(
    R({ method: "destroyed", approved_by: "records_officer" }),
    "rec_ra_perm", env.db, "d", ops,
  );

  // RR-09 / RR-12
  await postRecordsPolicyReview(
    R({ cycle_year: 2026, reviewed_by: "records_officer",
        policy_document_version: "rr-v3.0",
        regulation_changes: ["31 CFR 1020.220 amended"] }),
    env.db, "d", ops,
  );
  await putRecordsContact(
    R({ assigned_ref: "records_officer" }), "records_officer", env.db, "d", ops,
  );
  // a VACANCY, which is the state that must not look like "role never existed"
  await putRecordsContact(R({ vacate: true }), "records_liaison", env.db, "d", ops);

  // RR-03's disposal.scheduled comes from the EXISTING sweep, which is what
  // evaluates the three eligibility conditions.
  await postDisposalSweep(R({}), env.db, "d", ops);
}

/**
 * Lending underwriting, driven end to end.
 *
 * Product config -> eligibility screen (and a prohibited-practice refusal) ->
 * credit file assembled, decisioned and SEALED -> credit report freshness and
 * score tolerance -> ATR/QM with a DTI breach that opens an exception ->
 * appraisal ordered, delivered, and a reconsideration of value by someone
 * other than the appraiser -> exception decided by a second person ->
 * published rate sheet, HPML test, pricing exception -> prequalification with
 * and without steering -> fair lending disparity and HMDA LAR -> Regulation O
 * insider review.
 */
async function runLendingUwLifecycle(env: FireEnv): Promise<void> {
  if ((env.rows["core.credit_config"] ?? []).length > 0) return;
  const ops = env.actors.ops;
  const APP = "app_uw_1";
  // The applications these controls act on have to EXIST — every writer below
  // updates the application row, and an update against a missing row is a
  // silent no-op that reads as "the datum was never supplied".
  env.rows["core.loan_application"] ??= [];
  for (const id of [APP, "app_uw_2", "app_uw_3", "app_uw_blocked"]) {
    env.rows["core.loan_application"].push({
      id, status: "completed", completed_at: "2026-06-01T00:00:00.000Z",
      decisioned_at: null, final_action: null, funding_block_state: "open",
      provenance: "production",
    });
  }

  await postCreditConfig(
    R({ product_code: "mortgage_30", approved_by: "clo_1", min_credit_score: 640,
        max_dti_bp: 4300, max_ltv_bp: 8000,
        prohibited_practices: ["negative_amortization", "prepayment_penalty"],
        effective_at: "2026-01-01T00:00:00.000Z" }),
    env.db, "d", ops,
  );
  await postProductScreen(R({ product_code: "mortgage_30" }), APP, env.db, "d", ops);
  // NEGATIVE: a prohibited practice
  await postProductScreen(
    R({ product_code: "mortgage_30", requested_practices: ["prepayment_penalty"] }),
    APP, env.db, "d", ops,
  );
  // NEGATIVE: a product with no approved config at all
  await postProductScreen(R({ product_code: "unconfigured" }), APP, env.db, "d", ops);

  // LP-03 reads the party screen status off the application, so the
  // application needs a real party on it rather than an assumed one.
  await postLoanParty(
    R({
      role: "borrower", party_name: "A Applicant",
      identity: { tin_last4: "1234", dob: "1980-01-01" },
      contact: { email: "a@example.test" },
    }),
    APP, env.db, "d", ops,
  );
  await postCreditApplicationRecord(
    R({
      documents: ["paystub", "w2"], alternative_data_used: true,
      applicant: { ref: "mbr_a", name: "A Applicant" },
      data: { purpose: "purchase", occupancy: "primary" },
      income_assets: { monthly_income_cents: 1_000_000, assets_cents: 8_000_000 },
      gmi: { ethnicity: "not_provided", sex: "not_provided" },
      channel: "retail",
    }),
    APP, env.db, "d", ops,
  );
  await postCreditReport(
    R({ bureau: "equifax", score: 610, score_model: "FICO9", min_credit_score: 640 }),
    APP, env.db, "d", ops,
  );
  // NEGATIVE: a stale report cannot support a decision
  await postCreditReport(
    R({ bureau: "experian", score: 700, pulled_at: "2025-01-01T00:00:00.000Z" }),
    APP, env.db, "d", ops,
  );
  await postAtrQm(
    R({ monthly_debt_cents: 500_000, monthly_income_cents: 1_000_000, max_dti_bp: 4300 }),
    APP, env.db, "d", ops,
  );

  await postAppraisalOrder(R({ appraiser_ref: "appr_1" }), APP, env.db, "d", ops);
  // NEGATIVE: the appraiser cannot decide the reconsideration of their own value
  await postAppraisalComplete(
    R({ value_cents: 40_000_000, loan_amount_cents: 36_000_000, max_ltv_bp: 8000,
        rov: { decision: "revised", decided_by: "appr_1" } }),
    "apr_app_uw_1", env.db, "d", ops,
  );
  await postAppraisalComplete(
    R({ value_cents: 40_000_000, loan_amount_cents: 36_000_000, max_ltv_bp: 8000,
        rov: { decision: "upheld", decided_by: "review_appraiser" } }),
    "apr_app_uw_1", env.db, "d", ops,
  );

  await postLoanException(
    R({ loan_application_id: APP, kind: "ltv_over_policy", detail: { ltv_bp: 9000 },
        mitigating_factors: "12 months reserves", submitted_by: "uw_1" }),
    env.db, "d", ops,
  );
  const exc = (env.rows["core.loan_exception"] ?? []).find((e: Any) => e.submitted_by === "uw_1");
  // NEGATIVE: self-approval
  await postLoanExceptionDecision(
    R({ decision: "approved", decided_by: "uw_1" }), String(exc?.id ?? "x"), env.db, "d", ops,
  );
  await postLoanExceptionDecision(
    R({ decision: "approved", decided_by: "cco_1" }), String(exc?.id ?? "x"), env.db, "d", ops,
  );
  // the ATR/QM DTI breach opened its own exception; it has to be DECIDED or
  // closing stays blocked — which is the control working, and the lifecycle
  // has to honour it rather than route around it
  await postLoanExceptionDecision(
    R({ decision: "approved", decided_by: "cco_1" }), `lexc_${APP}_dti`, env.db, "d", ops,
  );
  await postLoanExceptionAnalytics(R({ period: "2026Q3" }), env.db, "d", ops);

  // NEGATIVE: an unpublished rate sheet cannot price a loan
  await postRateSheet(
    R({ product_code: "mortgage_30", base_rate_bp: 650, apor_bp: 600,
        effective_at: "2026-02-01T00:00:00.000Z" }),
    env.db, "d", ops,
  );
  await postLoanPricing(
    R({ rate_sheet_id: "rsheet_mortgage_30_1769904000000", quoted_apr_bp: 800 }),
    APP, env.db, "d", ops,
  );
  await postRateSheet(
    R({ product_code: "mortgage_30", base_rate_bp: 650, apor_bp: 600, published_by: "treasury_1",
        effective_at: "2026-03-01T00:00:00.000Z" }),
    env.db, "d", ops,
  );
  const sheet = (env.rows["core.rate_sheet"] ?? []).find((r: Any) => r.published_at);
  await postLoanPricing(
    R({ rate_sheet_id: String(sheet?.id ?? "x"), quoted_apr_bp: 800,
        exception: { requested_by: "lo_1", rationale: "relationship pricing",
                     decision: "approved", decided_by: "cco_1" } }),
    APP, env.db, "d", ops,
  );
  await postPricingExceptionReview(R({ period: "2026Q3" }), env.db, "d", ops);

  await postCreditDecisionRecord(
    R({
      decision: "denied", sealed_by: "uw_1", incomplete: true,
      counteroffer_status: "extended",
      counteroffer_terms: { rate_bp: 700, term_months: 240 },
      oral_adverse_decision: true,
      oral_statement: "declined by phone on 2026-07-18, written notice to follow",
    }),
    APP, env.db, "d", ops,
  );
  // NEGATIVE: a sealed file cannot be amended
  await postCreditDecisionRecord(
    R({ decision: "approved", sealed_by: "uw_2" }), APP, env.db, "d", ops,
  );

  // LP-12: a clean prequal and one that withholds an eligible product
  await postPrequalification(
    R({ subject_ref: "mbr_a", decision: "prequalified",
        products_offered: ["mortgage_30", "heloc"], products_eligible: ["mortgage_30", "heloc"] }),
    env.db, "d", ops,
  );
  await postPrequalification(
    R({ subject_ref: "mbr_b", decision: "declined",
        products_offered: [], products_eligible: ["mortgage_30"] }),
    env.db, "d", ops,
  );

  // LP-13
  await postFairLendingAnalysis(
    R({ period: "2026", kind: "disparity", threshold_bp: 500,
        cohorts: { control: { applications: 1000, approvals: 800 },
                   protected: { applications: 400, approvals: 240 } } }),
    env.db, "d", ops,
  );
  await postFairLendingRemediationClose(
    R({ evidence: "underwriter retraining + file re-review" }),
    "flan_2026_disparity", env.db, "d", ops,
  );
  await postFairLendingAnalysis(
    R({ period: "2026", kind: "redlining", threshold_bp: 500,
        cohorts: { inside: { applications: 500, approvals: 400 },
                   outside: { applications: 500, approvals: 390 } } }),
    env.db, "d", ops,
  );
  // NEGATIVE: submitting the LAR before QC
  await postHmdaLar(R({ reporting_year: 2026, record_count: 1240, submitted_by: "compliance_1" }),
    env.db, "d", ops);
  await postHmdaLar(R({ reporting_year: 2026, record_count: 1240, qc_error_count: 0,
    submitted_by: "compliance_1" }), env.db, "d", ops);

  // LP-14
  await putInsider(
    R({ subject_ref: "dir_1", role: "director", effective_from: "2026-01-01T00:00:00.000Z" }),
    "ins_dir1", env.db, "d", ops,
  );
  // NOT an insider — a real answer that gets recorded
  await postInsiderLoanReview(R({ subject_ref: "mbr_zz" }), APP, env.db, "d", ops);
  // NEGATIVE: preferential terms
  await postInsiderLoanReview(
    R({ subject_ref: "dir_1", terms_comparable: false, board_resolution_id: "board-9" }),
    "app_uw_2", env.db, "d", ops,
  );
  await postInsiderLoanReview(
    R({ subject_ref: "dir_1", terms_comparable: true, board_resolution_id: "board-9",
        amount_cents: 25_000_000, aggregate_credit_amount: 42_000_000,
        proposed_terms: { rate_bp: 650, term_months: 360 } }),
    "app_uw_3", env.db, "d", ops,
  );

  // LP-04 / LP-07: the adverse action, through the EXISTING notice table
  await postLendingAdverseAction(
    R({ reasons: ["credit score below minimum"], reviewed_by: "cco_1", oral: true }),
    APP, env.db, "d", ops,
  );

  // LP-09 / LP-03 / LP-06: booking, which writes core.loan and its LTV.
  // NEGATIVE first: an undecided exception must block closing.
  await postLoanException(
    R({ loan_application_id: "app_uw_blocked", kind: "doc_waiver", detail: {},
        mitigating_factors: "verbal confirmation", submitted_by: "uw_1" }),
    env.db, "d", ops,
  );
  await postLoanBooking(
    R({ booked_by: "closer_1", principal_cents: 36_000_000, value_cents: 40_000_000 }),
    "app_uw_blocked", env.db, "d", ops,
  );
  await postLoanBooking(
    R({ booked_by: "closer_1", principal_cents: 36_000_000, value_cents: 40_000_000 }),
    APP, env.db, "d", ops,
  );
}

/**
 * The investment portfolio, driven end to end.
 *
 * Permissible-instrument list -> approved and unapproved intermediaries ->
 * issuer credit files -> concentration limits -> trades that clear the gate and
 * trades blocked on each of its four conditions -> three-role segregation with
 * a confirmation mismatch -> repo with a margin shortfall that issues a call ->
 * fair value with and without impairment -> liquidity classification and the
 * contingency plan -> IRR and stress simulations -> reports and performance.
 */
async function runInvestmentLifecycle(env: FireEnv): Promise<void> {
  if ((env.rows["core.instrument_list"] ?? []).length > 0) return;
  const ops = env.actors.ops;

  // capital position: the concentration limits are a share of net worth
  await postCapitalPosition(
    R({ as_of_date: "2026-03-31", net_worth_cents: 750_000_000, total_assets_cents: 5_000_000_000 }),
    env.db, "d", ops,
  );

  await postInstrumentListEntry(
    R({ instrument_class: "us_treasury", permissible: true, citation: "12 CFR 703.14(a)",
        max_maturity_months: 120, effective_at: "2026-01-01T00:00:00.000Z",
        reviewed_by: "alco_1" }),
    env.db, "d", ops,
  );
  await postInstrumentListEntry(
    R({ instrument_class: "collateralized_mortgage_obligation", permissible: false,
        citation: "12 CFR 703.16", effective_at: "2026-01-01T00:00:00.000Z" }),
    env.db, "d", ops,
  );
  // NEGATIVE: an entry with no citation
  await postInstrumentListEntry(
    R({ instrument_class: "misc", permissible: true }), env.db, "d", ops,
  );

  await postIntermediary(
    R({ name: "Northgate Securities", kind: "both", regulator: "finra",
        registration_status: "active" }),
    env.db, "d", ops,
  );
  // NEGATIVE: an unregulated counterparty must not be approved
  await postIntermediary(
    R({ name: "Backstreet Brokers", kind: "broker_dealer", regulator: "none",
        registration_status: "active" }),
    env.db, "d", ops,
  );

  await postCreditFile(
    R({ issuer_ref: "us_gov", internal_rating: "AAA", analysis_ref: "an-1",
        approved_by: "cio_1", external_rating: "AAA" }),
    env.db, "d", ops,
  );
  // NEGATIVE: reliance on an external rating with no internal analysis
  await postCreditFile(R({ issuer_ref: "acme", external_rating: "A" }), env.db, "d", ops);
  await postCreditFileReanalysis(
    R({ internal_rating: "AA", analysis_ref: "an-2" }), "cfile_us_gov", env.db, "d", ops,
  );

  await putLimitSet(
    R({ scope_kind: "issuer", scope_ref: "us_gov", limit_bp_of_capital: 5000,
        warning_bp_of_capital: 4000, approved_by: "board-2026-01",
        effective_at: "2026-01-01T00:00:00.000Z" }),
    env.db, "d", ops,
  );
  // NEGATIVE: a warning at or above the limit never fires first
  await putLimitSet(
    R({ scope_kind: "issuer", scope_ref: "acme", limit_bp_of_capital: 1000,
        warning_bp_of_capital: 1000, approved_by: "board-2026-01" }),
    env.db, "d", ops,
  );

  env.rows["core.security"] ??= [];
  for (const [id, iss, cls] of [
    ["sec_ust1", "us_gov", "us_treasury"],
    ["sec_cmo1", "acme", "collateralized_mortgage_obligation"],
  ]) {
    env.rows["core.security"].push({
      id, issuer_ref: iss, instrument_class: cls, external_rating: "AAA",
      provenance: "production",
    });
  }

  // clean trade
  await postTrade(
    R({ security_id: "sec_ust1", instrument_class: "us_treasury", issuer_ref: "us_gov",
        intermediary_id: "interm_northgatesecurities", side: "buy", par_cents: 30_000_000,
        price_bp: 9950, executed_by: "trader_1", maturity_months: 60,
        checklist_completed: true, instrument_type: "bill",
        settlement_amount_cents: 29_850_000, valuation_support: "bloomberg_quote" }),
    env.db, "d", ops,
  );
  // NEGATIVE: a prohibited instrument class
  await postTrade(
    R({ security_id: "sec_cmo1", instrument_class: "collateralized_mortgage_obligation",
        issuer_ref: "acme", intermediary_id: "interm_northgatesecurities", side: "buy",
        par_cents: 1_000_000, executed_by: "trader_1", checklist_completed: true }),
    env.db, "d", ops,
  );
  // NEGATIVE: an unapproved counterparty
  await postTrade(
    R({ security_id: "sec_ust1", instrument_class: "us_treasury", issuer_ref: "us_gov",
        intermediary_id: "interm_backstreetbrokers", side: "buy", par_cents: 1_000_000,
        executed_by: "trader_1", checklist_completed: true }),
    env.db, "d", ops,
  );
  // NEGATIVE: no pre-purchase checklist
  await postTrade(
    R({ security_id: "sec_ust1", instrument_class: "us_treasury", issuer_ref: "us_gov",
        intermediary_id: "interm_northgatesecurities", side: "buy", par_cents: 1_000_000,
        executed_by: "trader_1" }),
    env.db, "d", ops,
  );
  // lands in the WARNING band: 30m held + 300m = 330m against 750m of net
  // worth is 4400bp, over the 4000bp warning and under the 5000bp limit. The
  // warning has to fire on a trade that still EXECUTES, or it is just a
  // second name for the block.
  await postTrade(
    R({ security_id: "sec_ust1", instrument_class: "us_treasury", issuer_ref: "us_gov",
        intermediary_id: "interm_northgatesecurities", side: "buy", par_cents: 300_000_000,
        price_bp: 9950, executed_by: "trader_2", maturity_months: 60,
        checklist_completed: true, instrument_type: "note",
        settlement_amount_cents: 298_500_000, valuation_support: "bloomberg_quote" }),
    env.db, "d", ops,
  );
  // NEGATIVE: this one BREACHES on the projected position — 330m held plus
  // 100m more is 5733bp against a 5000bp limit
  await postTrade(
    R({ security_id: "sec_ust1", instrument_class: "us_treasury", issuer_ref: "us_gov",
        intermediary_id: "interm_northgatesecurities", side: "buy", par_cents: 100_000_000,
        executed_by: "trader_1", checklist_completed: true }),
    env.db, "d", ops,
  );

  // IP-14: the segregation matrix needs to know what role each actor holds.
  for (const [u, role] of [
    ["trader_1", "execution"], ["trader_2", "execution"],
    ["ops_confirm", "confirmation"], ["ops_settle", "settlement"], ["cio_1", "oversight"],
  ]) {
    await putUserRole(R({ role }), u, env.db, "d", ops);
  }

  const tr = (env.rows["core.trade"] ?? []).find((t: Any) => t.decision === "executed");
  const tid = String(tr?.id ?? "x");
  // NEGATIVE: the executing trader cannot confirm their own trade
  await postTradeConfirmation(
    R({ confirmed_by: "trader_1", confirmation_ref: "c1", counterparty_par_cents: 30_000_000 }),
    tid, env.db, "d", ops,
  );
  // a real confirmation, with a MISMATCH against the counterparty's figures
  await postTradeConfirmation(
    R({ confirmed_by: "ops_confirm", confirmation_ref: "c1", counterparty_par_cents: 29_000_000 }),
    tid, env.db, "d", ops,
  );
  // and one that MATCHES, so "matched" is not simply an event nobody can reach
  const tr2 = (env.rows["core.trade"] ?? [])
    .filter((t: Any) => t.decision === "executed").slice(-1)[0];
  if (tr2 && tr2.id !== tid) {
    await postTradeConfirmation(
      R({
        confirmed_by: "ops_confirm", confirmation_ref: "c2",
        counterparty_par_cents: Number(tr2.par_cents),
      }),
      String(tr2.id), env.db, "d", ops,
    );
  }
  // NEGATIVE: the executing trader cannot settle either
  await postTradeReconciliation(R({ settled_by: "trader_1" }), tid, env.db, "d", ops);
  await postTradeReconciliation(R({ settled_by: "ops_settle" }), tid, env.db, "d", ops);

  await postTradeException(
    R({ trade_id: tid, kind: "limit_waiver", detail: { bp: 100 }, raised_by: "trader_1",
        approved_by: "cio_1" }),
    env.db, "d", ops,
  );
  // NEGATIVE: self-approved exception
  await postTradeException(
    R({ kind: "late_confirmation", detail: {}, raised_by: "trader_1", approved_by: "trader_1" }),
    env.db, "d", ops,
  );

  await postSafekeepingReconciliation(
    R({ intermediary_id: "interm_northgatesecurities",
        holdings: { sec_ust1: 29_000_000 } }),
    env.db, "d", ops,
  );

  // repo with a margin shortfall, and one blocked on the counterparty
  await postRepoAgreement(
    R({ intermediary_id: "interm_northgatesecurities", direction: "reverse_repo",
        principal_cents: 10_000_000, collateral_value_cents: 10_100_000,
        required_margin_bp: 200 }),
    env.db, "d", ops,
  );
  await postRepoAgreement(
    R({ intermediary_id: "interm_backstreetbrokers", direction: "repo",
        principal_cents: 5_000_000, collateral_value_cents: 5_500_000,
        required_margin_bp: 200 }),
    env.db, "d", ops,
  );

  // fair value: one impaired, one not
  await postFairValue(
    R({ fair_value_cents: 28_000_000, source: "bloomberg_level_1",
        amortized_cost_cents: 30_000_000 }),
    "sec_ust1", env.db, "d", ops,
  );
  await postFairValue(
    R({ fair_value_cents: 1_100_000, source: "broker_quote_level_2",
        amortized_cost_cents: 1_000_000 }),
    "sec_cmo1", env.db, "d", ops,
  );
  // NEGATIVE: a fair value with no source
  await postFairValue(R({ fair_value_cents: 1 }), "sec_ust1", env.db, "d", ops);

  await postSecurityDowngrade(
    R({ new_rating: "BB", reviewed_by: "cio_1", disposition: "hold" }),
    "sec_cmo1", env.db, "d", ops,
  );

  await postLiquidityClassification(
    R({ security_id: "sec_ust1", liquidity_class: "level_1" }), env.db, "d", ops,
  );
  await postLiquidityClassification(
    R({ security_id: "sec_cmo1", liquidity_class: "level_3" }), env.db, "d", ops,
  );
  await postLiquidityReport(R({ period: "2026Q3", min_marketable_bp: 5000 }), env.db, "d", ops);

  // NEGATIVE: activating a contingency level with no execution plan
  await postCfpLevelChange(R({ level: "stress", changed_by: "alco_1" }), env.db, "d", ops);
  await postCfpLevelChange(
    R({ level: "stress", changed_by: "alco_1", execution_plan_ref: "cfp-plan-3",
        trigger_detail: { marketable_bp: 4200 }, investment_test_completed: true }),
    env.db, "d", ops,
  );

  await postAlmSimulation(
    R({ kind: "irr", period: "2026Q3", scenario: "+300bp", result_bp: 850, minimum_bp: 600 }),
    env.db, "d", ops,
  );
  await postAlmSimulation(
    R({ kind: "stress", period: "2026Q3", scenario: "severe", result_bp: 400, minimum_bp: 600 }),
    env.db, "d", ops,
  );
  await postAlmSimulation(
    R({ kind: "portfolio_stress", period: "2026Q3", scenario: "rate_shock",
        result_bp: 700, minimum_bp: 600 }),
    env.db, "d", ops,
  );

  await postPortfolioReport(R({ period: "2026Q3", audience: "board" }), env.db, "d", ops);
  await postPortfolioReport(R({ period: "2026Q3", audience: "management" }), env.db, "d", ops);
  await postPerformanceMeasurement(
    R({ period: "2026Q3", portfolio_return_bp: 420, benchmark_ref: "ICE BofA 1-3Y",
        benchmark_return_bp: 390, attribution: { duration: 20, selection: 10 } }),
    env.db, "d", ops,
  );
}

/**
 * Complaints and Reg E disputes, driven end to end.
 *
 * Intake through four channels -> acknowledgement (one late) -> initial and
 * final responses -> resolution with a root cause -> a Reg E dispute with its
 * separate provisional-credit and investigation clocks -> trend analysis under
 * three lenses -> board reporting, quarterly and ad hoc.
 */
async function runComplaintsLifecycle(env: FireEnv): Promise<void> {
  if ((env.rows["core.complaint"] ?? []).length > 0) return;
  const ops = env.actors.ops;

  // a direct complaint, handled properly
  await postComplaint(
    R({ channel: "direct", category: "fees", member_id: "mbr_1",
        narrative: "charged an NSF fee twice for the same item",
        entity_contact: { email: "m1@example.test", phone: "+15550111" },
        received_at: "2026-07-01T00:00:00.000Z" }),
    env.db, "d", ops,
  );
  const c1 = String((env.rows["core.complaint"] ?? [])[0]?.id ?? "x");
  await postComplaintAcknowledge(R({ acknowledged_by: "svc_1" }), c1, env.db, "d", ops);
  await postComplaintResponse(
    R({ stage: "initial", body_ref: "resp-1" }), c1, env.db, "d", ops,
  );
  await postComplaintResponse(R({ stage: "final", body_ref: "resp-2" }), c1, env.db, "d", ops);
  // NEGATIVE: resolving with no root cause must be refused
  await postComplaintResolve(R({ investigation_notes: "n" }), c1, env.db, "d", ops);
  await postComplaintResolve(
    R({ root_cause_tag: "duplicate_fee_posting", investigation_notes: "system defect" }),
    c1, env.db, "d", ops,
  );

  // a regulator-channel complaint, which carries the longer clock
  await postComplaint(
    R({ channel: "regulator", category: "fair_lending", member_id: "mbr_2",
        regulator: "CFPB", regulator_case_id: "CFPB-2026-1",
        narrative: "denied a loan on grounds the member believes discriminatory",
        udaap_flag: true, received_at: "2026-07-05T00:00:00.000Z" }),
    env.db, "d", ops,
  );
  // NEGATIVE: a regulator complaint with no regulator named
  await postComplaint(
    R({ channel: "regulator", category: "other", narrative: "x" }), env.db, "d", ops,
  );
  // a privacy complaint, which PR-10 reads
  await postComplaint(
    R({ channel: "portal", category: "privacy", member_id: "mbr_3",
        narrative: "opt-out was not honoured", received_at: "2026-07-10T00:00:00.000Z",
        entity_contact: { email: "m3@example.test" } }),
    env.db, "d", ops,
  );
  // NEGATIVE: no narrative
  await postComplaint(R({ channel: "phone", category: "service" }), env.db, "d", ops);

  // NEGATIVE: resolving before the member has been answered
  const c2 = (env.rows["core.complaint"] ?? []).find((c: Any) => c.category === "privacy");
  await postComplaintResolve(
    R({ root_cause_tag: "process_gap" }), String(c2?.id ?? "x"), env.db, "d", ops,
  );

  // a Reg E dispute, with its own clocks
  await postDispute(
    R({ complaint_id: c1, member_id: "mbr_1", account_id: "acct_1",
        basis: "unauthorised card transaction", amount_cents: 45_000,
        account_balance_cents: 250_000, notified_at: "2026-07-02T00:00:00.000Z" }),
    env.db, "d", ops,
  );
  const d1 = String((env.rows["core.dispute"] ?? [])[0]?.id ?? "x");
  await postProvisionalCredit(R({}), d1, env.db, "d", ops);
  // NEGATIVE: resolving with no findings
  await postDisputeResolve(R({}), d1, env.db, "d", ops);
  await postDisputeResolve(
    R({ findings: "merchant confirmed the charge was not authorised",
        correction_amount_cents: 45_000 }),
    d1, env.db, "d", ops,
  );

  // trend analysis under each lens, one of which breaches
  await postComplaintTrend(R({ period: "2026Q3", lens: "collections" }), env.db, "d", ops);
  await postComplaintTrend(R({ period: "2026Q3", lens: "privacy" }), env.db, "d", ops);
  await postComplaintTrend(
    R({ period: "2026Q3", lens: "fair_lending", threshold_bp: 500,
        cohorts: { control: 200, protected: 900 } }),
    env.db, "d", ops,
  );
  await postComplaintBoardReport(R({ period: "2026Q3", audience: "compliance" }), env.db, "d", ops);
  await postComplaintBoardReport(
    R({ period: "2026Q3", audience: "privacy", adhoc: true,
        material_incident_id: "inc_1" }),
    env.db, "d", ops,
  );
}

/**
 * Risk breaches, acceptances and control overrides, driven end to end.
 *
 * Appetite set -> an observation INSIDE appetite (which still records that the
 * check ran) -> one outside, opening a breach with its clocks -> committee
 * presentation with a plan -> a risk acceptance that must not be self-granted
 * and must expire -> the sweep that warns and then expires it, re-opening the
 * breach -> control overrides and a registered exception that reverts.
 */
async function runRiskExceptionsLifecycle(env: FireEnv): Promise<void> {
  if ((env.rows["core.risk_appetite"] ?? []).length > 0) return;
  const ops = env.actors.ops;

  // the REGISTER first — a breach is an excursion on a registered risk
  await putRisk(
    R({ title: "Consumer credit deterioration", taxonomy_category_code: "credit",
        owner_id: "cro_1", inherent_rating: "high", residual_rating: "moderate",
        remediation_evidence: "underwriting-tightening-2026" }),
    "risk_credit_1", env.db, "d", ops,
  );
  // NEGATIVE: a risk with no owner is a risk nobody is accountable for
  await putRisk(R({ title: "Unowned", taxonomy_category_code: "ops" }), "risk_x", env.db, "d", ops);

  await putRiskAppetite(
    R({ risk_id: "risk_credit_1", taxonomy_category_code: "credit", kri_name: "delinquency_pct",
        tolerance_value: 300, direction: "above", owner_id: "cro_1",
        document_ref: "appetite-2026", approved_by: "board-2026-02" }),
    "rapp_credit", env.db, "d", ops,
  );

  // INSIDE appetite — must record that the check ran and open nothing
  await postRiskObservation(
    R({ appetite_id: "rapp_credit", kri_value: 180 }), env.db, "d", ops,
  );
  // OUTSIDE, and far enough outside to be critical
  await postRiskObservation(
    R({ appetite_id: "rapp_credit", kri_value: 700, residual_rating: "high",
        impact_summary: "consumer book deteriorating" }),
    env.db, "d", ops,
  );
  const br = (env.rows["core.risk_breach"] ?? [])[0];
  // NEGATIVE: presenting with no remediation plan
  await postRiskBreachPresentation(R({}), String(br?.id ?? "x"), env.db, "d", ops);
  await postRiskBreachPresentation(
    R({ remediation_plan: "tighten underwriting on the affected segment",
        remediation_status: "in_progress" }),
    String(br?.id ?? "x"), env.db, "d", ops,
  );

  // NEGATIVE: an acceptance with no expiry
  await postRiskAcceptance(
    R({ risk_id: "risk_credit_1", owner_id: "cro_1", rationale: "seasonal" }),
    env.db, "d", ops,
  );
  // NEGATIVE: an expiry so soon it can never be revisited in time
  await postRiskAcceptance(
    R({ risk_id: "risk_credit_1", owner_id: "cro_1", rationale: "seasonal",
        expiry_date: "2026-07-25T00:00:00.000Z" }),
    env.db, "d", ops,
  );
  await postRiskAcceptance(
    R({ risk_id: "risk_credit_1", breach_id: String(br?.id ?? ""), owner_id: "cro_1",
        rationale: "remediation lands next quarter; carrying the excursion until then",
        remediation_evidence: "plan-9", expiry_date: "2026-12-31T00:00:00.000Z" }),
    env.db, "d", ops,
  );
  const acc = (env.rows["core.risk_acceptance"] ?? [])[0];
  // NEGATIVE: the owner cannot grant their own acceptance
  await postRiskAcceptanceDecision(
    R({ decision: "accepted", decided_by: "cro_1" }), String(acc?.id ?? "x"), env.db, "d", ops,
  );
  await postRiskAcceptanceDecision(
    R({ decision: "accepted", decided_by: "board_chair" }), String(acc?.id ?? "x"),
    env.db, "d", ops,
  );

  // the sweep: first a warning, then expiry re-opening the breach
  if (acc) acc.expiry_alert_at = "2020-01-01T00:00:00.000Z";
  await postRiskAcceptanceSweep(R({}), env.db, "d", ops);
  if (acc) acc.expiry_date = "2020-01-02T00:00:00.000Z";
  await postRiskAcceptanceSweep(R({}), env.db, "d", ops);

  // IC-06
  // NEGATIVE: an override with no rationale
  await postControlOverride(
    R({ control_id: "CG-VEL-01", subject_ref: "txn_1", actor_ref: "ops_1" }),
    env.db, "d", ops,
  );
  for (const n of [1, 2, 3]) {
    await postControlOverride(
      R({ control_id: "CG-VEL-01", subject_kind: "transfer", subject_ref: `txn_${n}`,
          actor_ref: "ops_1", rationale: "member instruction verified by phone" }),
      env.db, "d", ops,
    );
  }
  // NEGATIVE: self-approved exception
  await postControlException(
    R({ control_id: "CG-NSF-01", scope: "commercial members", rationale: "sweep arrangement",
        approver_id: "ops_1", registered_by: "ops_1",
        expires_at: "2026-12-31T00:00:00.000Z" }),
    env.db, "d", ops,
  );
  await postControlException(
    R({ control_id: "CG-NSF-01", scope: "commercial members", rationale: "sweep arrangement",
        approver_id: "cco_1", registered_by: "ops_1",
        expires_at: "2026-08-01T00:00:00.000Z" }),
    env.db, "d", ops,
  );
  const exc = (env.rows["core.control_exception"] ?? [])[0];
  await postControlExceptionSweep(R({}), env.db, "d", ops);
  if (exc) exc.expires_at = "2020-01-01T00:00:00.000Z";
  await postControlExceptionSweep(R({}), env.db, "d", ops);
  await postOverrideAnalytics(R({ period: "2026Q3" }), env.db, "d", ops);
}

/**
 * The BSA/AML programme, driven end to end.
 *
 * CIP with all four elements and one missing them -> OFAC screens clean and
 * matched, hold placed and released -> EDD by category with senior sign-off ->
 * PEP hit opening its own EDD -> monetary instruments across all three bands ->
 * Travel Rule records present and absent -> CMIR filing -> FBAR aggregate ->
 * 314(a) request and response -> a GTO assessed -> escalations routed and
 * acknowledged -> SAR timer, continuing filing and a disclosure refusal.
 */
async function runBsaProgramLifecycle(env: FireEnv): Promise<void> {
  if ((env.rows["core.ofac_screen"] ?? []).length > 0) return;
  const ops = env.actors.ops;
  const officer = env.actors.officer;

  // CIP: complete, then one missing an element, then one that hits OFAC
  await postCipVerification(
    R({ entity_ref: "ent_cip1", name: "Alice Member", dob: "1980-01-01",
        address: "1 Main St", id_number: "DL-1234", tin: "***-**-1234",
        entity_type: "person", risk_rating: "low" }),
    env.db, "d", ops,
  );
  await postCipVerification(
    R({ entity_ref: "ent_cip2", name: "Bob Partial", dob: "1975-05-05" }),
    env.db, "d", ops,
  );
  await postCipVerification(
    R({ entity_ref: "ent_cip3", name: "SDN Holdings", dob: "1990-01-01",
        address: "2 Side St", id_number: "P-9" }),
    env.db, "d", ops,
  );

  // standalone screens, and a release
  await postOfacScreen(
    R({ subject_kind: "wire_beneficiary", subject_ref: "wb_1", name: "Clean Beneficiary" }),
    env.db, "d", ops,
  );
  await postOfacScreen(
    R({ subject_kind: "ach_counterparty", subject_ref: "cp_1", name: "SDN Trading" }),
    env.db, "d", ops,
  );
  // NEGATIVE: releasing with no determination
  await postOfacRelease(R({ released_by: "bsa_officer" }), "ofacs_ach_counterparty_cp_1",
    env.db, "d", officer);
  await postOfacRelease(
    R({ released_by: "bsa_officer", determination: "false positive; DOB and address differ" }),
    "ofacs_ach_counterparty_cp_1", env.db, "d", officer,
  );
  await postOfacAnnualReport(
    R({ reporting_year: 2026, filed_by: "bsa_officer" }), env.db, "d", officer,
  );

  // PEP: a clean screen and a hit that must open its own EDD
  await postPepScreen(R({ entity_ref: "ent_cip1", name: "Alice Member" }), env.db, "d", ops);
  await postPepScreen(
    R({ entity_ref: "ent_pep1", name: "Foreign Minister", pep_category: "foreign_official" }),
    env.db, "d", ops,
  );

  // EDD: an ordinary category, then one needing senior sign-off
  await postEddProfile(
    R({ entity_ref: "ent_msb1", category: "msb", trigger_reason: "money services business" }),
    env.db, "d", ops,
  );
  await postEddCompletion(
    R({ findings: "licensed MSB, registration verified" }), "edd_ent_msb1_msb",
    env.db, "d", officer,
  );
  await postEddProfile(
    R({ entity_ref: "ent_corr1", category: "correspondent",
        trigger_reason: "foreign correspondent relationship" }),
    env.db, "d", ops,
  );
  // NEGATIVE: completing a senior-approval category without sign-off
  await postEddCompletion(
    R({ findings: "reviewed" }), "edd_ent_corr1_correspondent", env.db, "d", ops,
  );
  await postEddCompletion(
    R({ findings: "reviewed; Wolfsberg questionnaire on file", approved_by: "bsa_officer" }),
    "edd_ent_corr1_correspondent", env.db, "d", officer,
  );
  // and the PEP EDD the screen opened, completed with senior sign-off
  await postEddCompletion(
    R({ findings: "source of wealth documented", approved_by: "bsa_officer" }),
    "edd_ent_pep1_pep", env.db, "d", officer,
  );

  // monetary instruments: below the band, in the band, above it
  await postMonetaryInstrument(
    R({ instrument_type: "money_order", amount_cents: 50_000, purchaser_name: "Small Buyer" }),
    env.db, "d", ops,
  );
  // NEGATIVE: in the log band with no identification
  await postMonetaryInstrument(
    R({ instrument_type: "cashiers_check", amount_cents: 500_000,
        purchaser_name: "Anonymous Buyer" }),
    env.db, "d", ops,
  );
  await postMonetaryInstrument(
    R({ instrument_type: "cashiers_check", amount_cents: 500_000,
        purchaser_name: "Known Buyer", purchaser_ref: "ent_cip1",
        purchaser_id_type: "drivers_license", purchaser_id_number: "DL-1234",
        purchaser_dob: "1980-01-01" }),
    env.db, "d", ops,
  );
  await postMonetaryInstrument(
    R({ instrument_type: "bank_draft", amount_cents: 1_500_000, purchaser_name: "Large Buyer",
        purchaser_id_type: "passport", purchaser_id_number: "P-1" }),
    env.db, "d", ops,
  );

  // Travel Rule: a compliant wire and one missing its originator record
  await postTravelRuleRecord(
    R({ wire_ref: "wire_tr1", amount_cents: 500_000,
        originator: { name: "Alice Member", address: "1 Main St", account: "acct_1",
                      routing_number: "021000021", reference: "ref-1" },
        beneficiary: { name: "Bob Payee", account: "ext_9" } }),
    env.db, "d", ops,
  );
  await postTravelRuleRecord(
    R({ wire_ref: "wire_tr2", amount_cents: 900_000, beneficiary: { name: "Bob Payee" } }),
    env.db, "d", ops,
  );
  // below the threshold nothing attaches
  await postTravelRuleRecord(
    R({ wire_ref: "wire_tr3", amount_cents: 100_000 }), env.db, "d", ops,
  );

  // CMIR — the shipment register is built by cash operations
  env.rows["core.cmir_filing"] ??= [];
  env.rows["core.cmir_filing"].push({
    id: "cmir_ship1", shipment_id: "cship_intl", amount_cents: 4_500_000,
    identified_at: "2026-07-01T00:00:00.000Z", provenance: "production",
  });
  await postCmirFiling(
    R({ filed_by: "bsa_officer", fincen_ref: "F105-2026-1" }), "cmir_ship1",
    env.db, "d", officer,
  );

  // a NIL year: no foreign accounts, and the determination is still recorded
  await postFbarFiling(R({ reporting_year: 2025 }), env.db, "d", officer);

  // FBAR: two accounts that individually are under the threshold and together
  // are over it
  for (const [ref, val] of [["fa_1", 600_000], ["fa_2", 700_000]]) {
    await postFbarAccount(
      R({ account_ref: ref, country: "CH", institution_name: "Alpine Bank",
          max_value_cents: val, reporting_year: 2026 }),
      env.db, "d", ops,
    );
  }
  await postFbarFiling(
    R({ reporting_year: 2026, filed_by: "bsa_officer", bsa_efiling_ref: "FBAR-2026-1" }),
    env.db, "d", officer,
  );

  // 314(a)
  await post314aRequest(
    R({ reference: "314A-2026-07", received_at: "2026-07-10T00:00:00.000Z" }), env.db, "d", ops,
  );
  // NEGATIVE: responding with no match count
  await post314aResponse(
    R({ responded_by: "bsa_officer" }), "filing_314a_314A-2026-07", env.db, "d", officer,
  );
  await post314aResponse(
    R({ match_count: 0, responded_by: "bsa_officer" }), "filing_314a_314A-2026-07",
    env.db, "d", officer,
  );

  // a GTO, assessed for applicability
  await postRegulatoryChange(
    R({ kind: "gto", reference: "GTO-2026-REALESTATE", issued_by: "FinCEN",
        effective_at: "2026-08-01T00:00:00.000Z",
        applicability: "not applicable — no title insurance business",
        assessed_by: "bsa_officer", controls_updated: [] }),
    env.db, "d", officer,
  );

  // escalations
  await postEscalation(
    R({ source_kind: "bsa_alert", source_ref: "alert_1", severity: "urgent",
        routed_to: "bsa_officer" }),
    env.db, "d", ops,
  );
  const esc = (env.rows["core.escalation"] ?? [])[0];
  await postEscalationAck(
    R({ acknowledged_by: "bsa_officer", disposition: "escalated to SAR committee",
        action_plan: "file SAR within 30 days; review related accounts" }),
    String(esc?.id ?? "x"), env.db, "d", officer,
  );

  // SAR lifecycle: the timer, a continuing filing, and a disclosure refusal
  await postSarLifecycle(R({ stage: "timer" }), "case_bsa1", env.db, "d", officer);
  await postSarLifecycle(
    R({ stage: "continuing", filed_by: "bsa_officer", fincen_ref: "SAR-2026-2" }),
    "case_bsa1", env.db, "d", officer,
  );
  await postSarLifecycle(
    R({ stage: "disclosure_request", requester: "subject's attorney" }),
    "case_bsa1", env.db, "d", officer,
  );

  // BSA-08: a CTR aggregation that reaches the threshold is FILED. The
  // aggregation writer exists; nothing was calling the filing step.
  await postCashTransaction(
    R({ direction: "cash_in", amount_cents: 1_200_000, business_date: "2026-07-11",
        account_id: "acct_1" }),
    env.db, "d", ops,
  );
  const ctr = (env.rows["core.ctr_filing"] ?? [])[0];
  if (ctr) {
    await postCtrFile(
      R({ filed_by: "bsa_officer", fincen_ref: "CTR-2026-1" }), String(ctr.id),
      env.db, "d", officer,
    );
  }

  // BSA-06: a case decided NOT to file is a decision with its own evidence.
  // "no SAR filed" and "nobody decided" must not look alike.
  await raiseAlert(env.db, {
    ctx: ops, alertType: "structuring", entityHash: "h_nofile",
    causeType: "transfer", causeId: "t_nofile", details: "bsa program drill",
  });
  const tri = await postAlertTriage(
    R({ outcome: "escalated" }), "alert_t_nofile_structuring", env.db, "d",
    env.actors.investigator,
  );
  const tb = await tri.clone().json().catch(() => ({}));
  if (tb?.case?.id) {
    await postCaseDecision(
      R({ decision: "no_file", rationale: "activity explained by verified payroll" }),
      tb.case.id, env.db, "d", officer,
    );
  }

  await postCtrExemptionReview(
    R({ entity_ref: "ent_msb1", decision: "retained", reviewed_by: "bsa_officer",
        eligibility_reverified: true }),
    env.db, "d", officer,
  );
}

/**
 * The privacy programme, driven end to end.
 *
 * Notice published and delivered (including an E-SIGN delivery refused for
 * want of demonstrated consent) -> opt-outs set, cleared and PROPAGATED ->
 * state privacy requests with verification refused first -> web consent with a
 * GPC signal overriding the banner -> tag review -> an analytics dataset over
 * the re-identification threshold -> biometrics without consent, then with ->
 * age gate -> a furnishing dispute corrected and propagated.
 *
 * PR-03, PR-04 and PR-15 are absent on purpose: vendor attestations, outside
 * counsel and third-party connection telemetry are not facts this core holds.
 */
async function runPrivacyLifecycle(env: FireEnv): Promise<void> {
  if ((env.rows["core.privacy_notice"] ?? []).length > 0) return;
  const ops = env.actors.ops;

  await postPrivacyNotice(
    R({ version: "v3", template_ref: "tpl-3", material_change: true,
        effective_at: "2026-01-01T00:00:00.000Z" }),
    env.db, "d", ops,
  );
  await postNoticeDelivery(
    R({ entity_ref: "ent_p1", reason: "annual", channel: "mail" }),
    "pnotice_v3", env.db, "d", ops,
  );
  // NEGATIVE: electronic delivery with no E-SIGN consent
  await postNoticeDelivery(
    R({ entity_ref: "ent_p2", reason: "annual", channel: "esign" }),
    "pnotice_v3", env.db, "d", ops,
  );
  // NEGATIVE: consent that did not demonstrate access
  await postEsignConsent(
    R({ entity_ref: "ent_p2", demonstrated_access: false }), env.db, "d", ops,
  );
  await postEsignConsent(
    R({ entity_ref: "ent_p3", demonstrated_access: true }), env.db, "d", ops,
  );
  await postNoticeDelivery(
    R({ entity_ref: "ent_p3", reason: "member_request", channel: "esign",
        esign_consent_id: "esign_ent_p3" }),
    "pnotice_v3", env.db, "d", ops,
  );

  // opt-outs: set, Nevada, and one cleared
  await postPrivacyPreference(
    R({ entity_ref: "ent_p1", channel: "nonaffiliate_sharing", opted_out: true,
        source: "member_request", entity_jurisdiction: "CA" }),
    env.db, "d", ops,
  );
  await postPrivacyPreference(
    R({ entity_ref: "ent_p1", channel: "nevada_sale", opted_out: true,
        source: "member_request" }),
    env.db, "d", ops,
  );
  await postPrivacyPreference(
    R({ entity_ref: "ent_p3", channel: "marketing", opted_out: false,
        source: "member_request" }),
    env.db, "d", ops,
  );
  // NEGATIVE: propagation naming no systems
  await postPreferencePropagation(R({ systems: [] }), env.db, "d", ops);
  await postPreferencePropagation(
    R({ systems: ["core", "marketing_platform", "data_warehouse"] }), env.db, "d", ops,
  );

  // state rights
  await postStateRequest(
    R({ entity_ref: "ent_p1", state: "CA", right_requested: "access",
        received_at: "2026-07-01T00:00:00.000Z" }),
    env.db, "d", ops,
  );
  // NEGATIVE: fulfilling before the requester is verified
  await postStateRequestFulfilment(
    R({ verified: false, outcome: "fulfilled" }), "psreq_ent_p1_access", env.db, "d", ops,
  );
  await postStateRequestFulfilment(
    R({ verified: true, outcome: "fulfilled" }), "psreq_ent_p1_access", env.db, "d", ops,
  );
  // an opt-out right sets the standing state, not just a ticket
  await postStateRequest(
    R({ entity_ref: "ent_p4", state: "NV", right_requested: "opt_out" }), env.db, "d", ops,
  );

  // web: a tag reviewed, then consent with GPC overriding the banner
  await postWebTagReview(
    R({ vendor: "Analytics Co", category: "analytics", decision: "approved",
        reviewed_by: "privacy_officer" }),
    env.db, "d", ops,
  );
  await postWebTagReview(
    R({ vendor: "Ad Network", category: "advertising", decision: "rejected",
        reviewed_by: "privacy_officer" }),
    env.db, "d", ops,
  );
  await postWebConsent(
    R({ session_ref: "sess_1", categories: { analytics: true, advertising: true } }),
    env.db, "d", ops,
  );
  await postWebConsent(
    R({ session_ref: "sess_2", gpc_signal: true,
        categories: { analytics: true, advertising: true } }),
    env.db, "d", ops,
  );

  // analytics: one released, one over the re-identification threshold
  await postAnalyticsDataset(
    R({ purpose: "branch demand model", requested_by: "analytics_1",
        method: "k_anonymity", k_value: 20, reid_risk_bp: 100, risk_threshold_bp: 500 }),
    env.db, "d", ops,
  );
  await postAnalyticsDataset(
    R({ purpose: "member churn raw", requested_by: "analytics_1",
        method: "aggregation", reid_risk_bp: 900, risk_threshold_bp: 500 }),
    env.db, "d", ops,
  );
  // NEGATIVE: k-anonymity with no k
  await postAnalyticsDataset(
    R({ purpose: "no k", requested_by: "analytics_1", method: "k_anonymity" }),
    env.db, "d", ops,
  );

  // biometrics: refused without consent, then captured and purged
  await postBiometricVerification(R({ entity_ref: "ent_p5" }), env.db, "d", ops);
  await postBiometricVerification(
    R({ entity_ref: "ent_p5", consent_id: "bioconsent_1", outcome: "verified" }),
    env.db, "d", ops,
  );
  await postBiometricVerification(
    R({ entity_ref: "ent_p6", consent_id: "bioconsent_2", outcome: "declined" }),
    env.db, "d", ops,
  );
  const bio = (env.rows["core.biometric_verification"] ?? [])[0];
  if (bio) bio.purge_due_at = "2020-01-01T00:00:00.000Z";
  await postBiometricPurge(R({}), env.db, "d", ops);

  // children's data
  await postMinorDataEvent(
    R({ kind: "age_gate_blocked", subject_ref: "sub_1", age_asserted: 11 }), env.db, "d", ops,
  );
  await postMinorDataEvent(
    R({ kind: "minor_data_detected", subject_ref: "sub_2", age_asserted: 10 }), env.db, "d", ops,
  );
  await postMinorDataEvent(
    R({ kind: "deleted", subject_ref: "sub_2" }), env.db, "d", ops,
  );

  // corrections
  await postFurnishingDispute(
    R({ entity_ref: "ent_p1", field: "address", disputed_value: "old address",
        redflag: true, ncoa_candidate: "1 New St", ncoa_mismatch: true,
        dispute_basis: "data_accuracy",
        received_at: "2026-07-01T00:00:00.000Z" }),
    env.db, "d", ops,
  );
  await postFurnishingCorrection(
    R({ corrected_value: "1 New St", systems: ["core", "bureau_feed"] }),
    "fdisp_ent_p1_address", env.db, "d", ops,
  );

  // disposal and the incident notification decision
  await postDisposalCertificate(
    R({ record_ref: "rec_p1", method: "shredded", certificate_ref: "cert-p1",
        approved_by: "records_officer" }),
    env.db, "d", ops,
  );
  await postNotificationDecision(
    R({ decision: "notify", rationale: "member NPPI exposed", sar_referred: true,
        description: "unencrypted export of member records",
        detection_source: "dlp_alert", data_scope: ["name", "account_number"],
        scope_initial: ["name", "account_number"], material: true }),
    "inc_p1", env.db, "d", ops,
  );
}

/** Collections, driven end to end. Delinquency derived at four thresholds,
 * classification and nonaccrual, a workout refused for self-approval and a
 * re-age refused for exceeding its limit, the FDCPA contact gate blocking on
 * each protection, furnishing, and an overdraft charged off at 45 days. */
async function runCollectionsLifecycle(env: FireEnv): Promise<void> {
  if ((env.rows["core.delinquency_evaluation"] ?? []).length > 0) return;
  const ops = env.actors.ops;

  await postCollectionsPolicy(
    R({ version: "col-v2", approved_by: "board-2026-03", scope: "all consumer loans",
        agencies: ["Northgate Recovery"] }),
    env.db, "d", ops,
  );

  env.rows["core.account"] ??= [];
  env.rows["core.account"].push({
    id: "acct_estate", entity_id: "ent_dec", status: "open", account_type: "checking",
    balance: 0, partner_id: "ptnr_drill", death_flag: true, provenance: "production",
  });
  env.rows["core.loan"] ??= [];
  for (const [id, due] of [
    ["loan_c1", "2026-07-05"],   // ~14 days past due
    ["loan_c2", "2026-04-01"],   // ~109 days
    ["loan_c3", "2026-01-01"],   // ~199 days
    ["loan_current", "2026-08-01"],
  ]) {
    env.rows["core.loan"].push({
      id, member_ref: `mbr_${id}`, product: "consumer", principal_cents: 500_000,
      next_due_date: due, attorney_represented: false, bankruptcy_flag: false,
      scra_flag: false, product_type: "closed_end_consumer", grace_period_days: 10,
      last_payment_date: "2026-06-01", collateral_value: 800_000, ltv: 6250,
      accrued_interest: 12_000, provenance: "production",
    });
  }
  // NEGATIVE: a loan with no due date cannot be evaluated
  env.rows["core.loan"].push({
    id: "loan_nodue", member_ref: "mbr_x", product: "consumer",
    principal_cents: 1000, provenance: "production",
  });

  for (const id of ["loan_c1", "loan_c2", "loan_c3", "loan_current", "loan_nodue"]) {
    await postDelinquencyEvaluation(
      R({ well_secured_documented: true, collectibility_assessment: "full recovery expected",
          repayment_evidence: "three payments since workout",
          entity_contact: { phone: "+15550123" },
          past_due_amount: 45_000,
          workout_alternatives: ["forbearance", "extension"],
          bankruptcy_case_id: "BK-2026-77", estate_claim_status: "no claim filed",
          estimated_recovery: 300_000 }),
      id, env.db, "d", ops,
    );
  }
  // a nonaccrual loan brought CURRENT comes back on accrual
  const cured = (env.rows["core.loan"] ?? []).find((l: Any) => l.id === "loan_c2");
  if (cured) cured.next_due_date = "2026-09-01";
  await postDelinquencyEvaluation(R({}), "loan_c2", env.db, "d", ops);
  await postChargeOff(
    R({ approved_by: "cco_1", amount_cents: 500_000,
        foreclosure_impact_eval: "collateral covers 80% of balance" }),
    "loan_c3", env.db, "d", ops,
  );

  // workouts
  await postLoanModification(
    R({ kind: "forbearance", borrower_hardship: true, concession_granted: true,
        requested_by: "collector_1", approved_by: "manager_1",
        payments_received_after_mod: true,
        proposed_modification: { new_rate_bp: 500, term_months: 60 }, io_term_months: 12 }),
    "loan_c2", env.db, "d", ops,
  );
  // NEGATIVE: self-approved
  await postLoanModification(
    R({ kind: "extension", borrower_hardship: false, concession_granted: false,
        requested_by: "collector_1", approved_by: "collector_1" }),
    "loan_c1", env.db, "d", ops,
  );
  await postLoanModification(
    R({ kind: "reage", borrower_hardship: true, concession_granted: false,
        requested_by: "collector_1", approved_by: "manager_1" }),
    "loan_c1", env.db, "d", ops,
  );
  // NEGATIVE: a second re-age within twelve months
  await postLoanModification(
    R({ kind: "reage", borrower_hardship: true, concession_granted: false,
        requested_by: "collector_1", approved_by: "manager_1" }),
    "loan_c1", env.db, "d", ops,
  );

  // FDCPA gate: permitted, then blocked on each protection in turn
  await postCollectionContact(
    R({ channel: "phone", local_hour: 14, member_ref: "mbr_loan_c1" }),
    "loan_c1", env.db, "d", ops,
  );
  await postCollectionContact(
    R({ channel: "phone", local_hour: 6, member_ref: "mbr_loan_c1" }),
    "loan_c1", env.db, "d", ops,
  );
  await postCollectionProtection(
    R({ attorney_represented: true, attorney_ref: "Smith LLP",
        template_ref: "tpl-dunning-1", template_approved_by: "compliance_1" }),
    "loan_c2", env.db, "d", ops,
  );
  await postCollectionContact(
    R({ channel: "phone", local_hour: 14, member_ref: "mbr_loan_c2" }),
    "loan_c2", env.db, "d", ops,
  );
  await postCollectionProtection(R({ cease: true }), "loan_c3", env.db, "d", ops);
  await postCollectionContact(
    R({ channel: "sms", local_hour: 12, member_ref: "mbr_loan_c3" }),
    "loan_c3", env.db, "d", ops,
  );

  await postFurnishingCycle(
    R({ period: "2026-07", attested_by: "collections_manager", disputes_investigated: 2,
        corrections: 1, disputes_resolved: 2, idtheft_disputes: 1,
        dispute_category: "identity_theft", idtheft_report: "FTC-2026-114" }),
    env.db, "d", ops,
  );

  // CO-11: a collections-data incident goes through the SAME incident
  // machinery, with its own scope fields.
  await postIncident(
    R({ title: "collections vendor file exposure", severity: "sev2",
        source: "vendor_report", description: "agency emailed an unencrypted file",
        detection_source: "vendor_report", data_scope: ["name", "balance"],
        collections: true }),
    env.db, "d", ops,
  );
  const cinc = (env.rows["core.incident"] ?? []).slice(-1)[0];
  if (cinc) {
    await postDetermineReportability(
      R({ is_reportable: false, rationale: "no member NPPI beyond name and balance",
          assessment: "reviewed against 12 CFR 748 App B; no sensitive identifiers exposed" }),
      String(cinc.id), env.db, "d",
      { ...ops, tokenId: "tok_comp", roles: ["bsa_compliance"] },
    );
  }

  await postOverdraftReferral(
    R({ account_ref: "acct_od1", balance_cents: -25_000, days_negative: 20,
        fees_assessed_cents: 3_000 }),
    env.db, "d", ops,
  );
  // NEGATIVE: a waiver with no approver
  await postOverdraftReferral(
    R({ account_ref: "acct_od2", balance_cents: -12_000, days_negative: 10,
        fees_assessed_cents: 3_000, fees_waived_cents: 3_000 }),
    env.db, "d", ops,
  );
  await postOverdraftReferral(
    R({ account_ref: "acct_od3", balance_cents: -40_000, days_negative: 50,
        fees_assessed_cents: 6_000, fees_waived_cents: 3_000,
        waiver_approved_by: "branch_manager" }),
    env.db, "d", ops,
  );
}

/** Truth in Savings, member lifecycle and the fair-lending gaps. */
async function runDepositsMemberLifecycle(env: FireEnv): Promise<void> {
  if ((env.rows["core.disclosure_template"] ?? []).length > 0) return;
  const ops = env.actors.ops;

  for (const kind of [
    "account_opening", "change_in_terms", "maturity", "periodic_statement",
    "overdraft_service", "valuation_rights", "appraisal_copy",
  ]) {
    await postDisclosureTemplate(
      R({ kind, version: "v1", content_ref: `ref-${kind}`, approved_by: "compliance_1",
          product_scope: "share_savings", advertising_medium: "branch_poster",
          advertising_approval_id: "adv_1" }),
      env.db, "d", ops,
    );
  }
  // a deliverable address is a precondition of a mailed disclosure
  await env.db.schema("core").from("address").upsert({
    id: "addr_d1", entity_ref: "ent_m1", line1: "1 Main St", city: "Durham",
    region: "NC", postal_code: "27701", provenance: "production",
  }, { onConflict: "id" });
  await env.db.schema("core").from("esign_consent").upsert({
    id: "esign_d1", entity_ref: "ent_m1", started_at: "2026-07-19T12:00:00.000Z",
    captured_at: "2026-07-19T12:00:00.000Z", demonstrated_access: true, provenance: "production",
  }, { onConflict: "id" });
  await env.db.schema("core").from("account").upsert({
    id: "acct_d1", entity_id: "ent_m1", status: "open", account_type: "share_certificate",
    balance: 0, partner_id: "p1", opening_channel: "branch",
    maturity_date: "2027-07-19", maturity_window: "10_day_grace",
    maturity_disposition: "auto_renew", provenance: "production",
  }, { onConflict: "id" });
  const terms = {
    account_type: "share_certificate", opening_channel: "branch",
    account_restriction: "none", address_id: "addr_d1", esign_consent_id: "esign_d1",
    interest_config_id: "picfg_share_savings", rate_bp: 200, compounding: "daily",
    maturity_date: "2027-07-19", maturity_window: "10_day_grace",
    maturity_disposition: "auto_renew", failure_reason: null,
  };
  for (const [kind, extra] of [
    ["account_opening", {}], ["change_in_terms", { adverse: true }],
    ["maturity", {}], ["valuation_rights", {}], ["appraisal_copy", {}],
  ] as Any[]) {
    await postDisclosureDelivery(
      R({ kind, member_ref: "mbr_d1", account_ref: "acct_d1", channel: "esign",
          trigger_event: "drill", template_id: `dtpl_${kind}_v1`, ...terms, ...extra }),
      env.db, "d", ops,
    );
  }
  // NEGATIVE: electronic delivery with no captured E-SIGN consent is refused
  await postDisclosureDelivery(
    R({ kind: "account_opening", member_ref: "mbr_d9", channel: "esign",
        trigger_event: "drill" }),
    env.db, "d", ops,
  );
  await postBalanceInquiry(
    R({ balance_cents: 1_050_000, held_cents: 20_000, channel: "atm" }),
    "acct_d1", env.db, "d", ops,
  );
  // NEGATIVE: a delivery with a detected error must say what was wrong
  await postDisclosureDelivery(
    R({ kind: "account_opening", member_ref: "mbr_d2", trigger_event: "drill",
        error_detected: true }),
    env.db, "d", ops,
  );
  await postDisclosureDelivery(
    R({ kind: "account_opening", member_ref: "mbr_d2", trigger_event: "drill",
        error_detected: true, error_detail: "wrong APY printed" }),
    env.db, "d", ops,
  );

  await postInterestConfig(
    R({ product_code: "share_savings", rate_bp: 200, compounding: "daily",
        balance_method: "daily_balance" }),
    env.db, "d", ops,
  );
  const cfg = (env.rows["core.product_interest_config"] ?? [])[0];
  // NEGATIVE: accruing with no configuration
  await postInterestAccrualRun(R({ period: "2026-07", config_id: "nope" }), env.db, "d", ops);
  await postInterestAccrualRun(
    R({ period: "2026-07", config_id: String(cfg?.id ?? ""),
        accounts: [{ balance_cents: 1_000_000 }, { balance_cents: 500_000 }] }),
    env.db, "d", ops,
  );
  await postStatement(
    R({ account_ref: "acct_d1", period: "2026-07", opening_balance_cents: 1_000_000,
        closing_balance_cents: 1_050_000, interest_paid_cents: 1_600,
        fees_ytd_cents: 4_500, overdraft_fees_ytd_cents: 3_000 }),
    env.db, "d", ops,
  );

  await postMembership(
    R({ entity_ref: "ent_m1", eligibility_basis: "employer group", eligible: true,
        account_type: "share" }),
    env.db, "d", ops,
  );
  // NEGATIVE: a denial with no basis
  await postMembership(R({ entity_ref: "ent_m2", eligible: false }), env.db, "d", ops);
  await postMembership(
    R({ entity_ref: "ent_m2", eligible: false, denial_reason: "outside the field of membership" }),
    env.db, "d", ops,
  );
  await postAddressChange(
    R({ old_address: { line1: "1 Old St" }, new_address: { line1: "2 New Ave" },
        card_requested: true }),
    "mbr_ent_m1", env.db, "d", ops,
  );
  // MP-02: the reissue arrives while the address hold is still open
  await postCardReissue(
    R({ ship_to_address_id: "addr_d1" }), "mbr_ent_m1", env.db, "d", ops,
  );
  await postMemberPreferences(
    R({ channels: { email: true, sms: false }, reverted: true,
        revert_reason: "email bounced" }),
    "mbr_ent_m1", env.db, "d", ops,
  );
  await postMemberRestriction(
    R({ restriction: "deposit_only", reason: "repeated NSF activity",
        account_ref: "acct_d1", balance_cents: 1_050_000,
        contact: { email: "m1@example.test", phone: "555-0100" },
        amounts_owed_cents: 3_500 }),
    "mbr_ent_m1", env.db, "d", ops,
  );
  await postMemberRestriction(
    R({ restriction: "frozen", reason: "account closure", close: true, payout_cents: 25_000 }),
    "mbr_ent_m2", env.db, "d", ops,
  );
  // NEGATIVE: a bulk export with no stated purpose
  await postMemberRecordExport(R({ record_count: 5000 }), "mbr_ent_m1", env.db, "d", ops);
  await postMemberRecordExport(
    R({ purpose: "examiner request 2026-3", record_count: 5000, requested_by: "compliance_1" }),
    "mbr_ent_m1", env.db, "d", ops,
  );
  await postServiceRequest(
    R({ channel: "phone", received_at: "2026-07-01T00:00:00.000Z", resolved: true }),
    "mbr_ent_m1", env.db, "d", ops,
  );

  // fair lending gaps
  await postLoCompPlan(
    R({ originator_ref: "lo_1", basis: "flat per loan", varies_with_terms: false,
        decided_by: "cco_1" }),
    env.db, "d", ops,
  );
  // NEGATIVE: compensation that varies with the terms cannot be approved
  await postLoCompPlan(
    R({ originator_ref: "lo_2", basis: "share of rate spread", varies_with_terms: true,
        decided_by: "cco_1" }),
    env.db, "d", ops,
  );
  for (const a of ["app_fl1", "app_fl2"]) {
    await env.db.schema("core").from("loan_application").upsert({
      id: a, status: "completed", funding_block_state: "open", provenance: "production",
    }, { onConflict: "id" });
  }
  await postApplicationIntake(
    R({ channel: "branch", product_type: "purchase_first_lien", applicant_state: "NC",
        geography: "37063000101" }),
    "app_fl1", env.db, "d", ops,
  );
  await postApplicationOptions(
    R({ options_presented: ["lowest_rate", "lowest_rate_no_risky", "lowest_total_cost"],
        waiver_decision: "not_waived", disclosures: ["loan_estimate"],
        final_action: "approved" }),
    "app_fl1", env.db, "d", ops,
  );
  await postGmiCollection(
    R({ gmi: { ethnicity: "not_provided", race: "not_provided", sex: "not_provided" },
        hmda_reportable: true }),
    "app_fl1", env.db, "d", ops,
  );
  // NEGATIVE: incomplete GMI on a reportable application opens a finding
  await postGmiCollection(
    R({ gmi: { ethnicity: "not_provided" }, hmda_reportable: true }), "app_fl2", env.db, "d", ops,
  );
  await postNoticeQueue(R({ kind: "incompleteness", oral: true }), "app_fl2", env.db, "d", ops);
  await postLendingAdverseAction(
    R({ reasons: ["insufficient deposit history"], reviewed_by: "compliance_1",
        subject_kind: "account", account_ref: "acct_d1", applicant_state: "NC",
        business_revenue_tier: "under_1m", score_block: { model: "v3", score: 610 },
        party_identity: "verified_documentary", incompleteness_notice: true,
        counteroffer_terms: { rate_bp: 850 }, oral_statement: "reasons given by phone",
        oral: true }),
    "app_fl2", env.db, "d", ops,
  );
  // NEGATIVE: fewer than three options must say why, rather than passing quietly
  await postApplicationOptions(
    R({ options_presented: ["lowest_rate"], final_action: "denied" }),
    "app_fl2", env.db, "d", ops,
  );
}

/** E-commerce: policy, enrollment, credentials, transaction audit trail. */
async function runEcommerceLifecycle(env: FireEnv): Promise<void> {
  if ((env.rows["core.member_credential"] ?? []).length > 0) return;
  const ops = env.actors.ops;

  await postEcommerceRiskAssessment(
    R({ document_version: "v3", finding_description: "two medium findings on session timeout",
        control_register: ["EC-03", "EC-04", "EC-07"],
        regulatory_change_analysis: "no material change since v2",
        board_approved_by: "board_chair" }),
    env.db, "d", ops,
  );
  // NEGATIVE: board approval ahead of the assessment it approves against
  await postEcommerceRiskAssessment(
    R({ document_version: "v4", completed: false, board_approved_by: "board_chair" }),
    env.db, "d", ops,
  );

  // NEGATIVE: an enrollment whose member-number comparison has no answer
  await postEnrollment(
    R({ member_ref: "mbr_e9", channel: "web", applicant_identity: "A. Nonymous",
        verified: true }),
    env.db, "d", ops,
  );
  // NEGATIVE: a verification denial
  await postEnrollment(
    R({ member_ref: "mbr_e8", channel: "phone", applicant_identity: "Wrong Person",
        member_number_match: false, verified: false,
        denial_reason: "member number does not match the name on file" }),
    env.db, "d", ops,
  );
  await postEnrollment(
    R({ member_ref: "mbr_e1", channel: "web", applicant_identity: "Real Member",
        identity_evidence: { doc: "drivers_licence", provider: "sim" },
        member_number_match: true, entity_email: "m1@example.test", verified: true }),
    env.db, "d", ops,
  );

  await postCredentialIssue(
    R({ member_ref: "mbr_e1", login_id: "member1", security_questions: ["q1", "q2"] }),
    env.db, "d", ops,
  );
  await postPasswordChange(R({ new_password: "correct-horse" }), "cred_mbr_e1", env.db, "d", ops);
  for (let i = 0; i < 5; i++) {
    await postLoginFailure(R({}), "cred_mbr_e1", env.db, "d", ops);
  }

  await postEcommerceTransaction(
    R({ member_ref: "mbr_e1", transaction_type: "transfer", amount_cents: 250_000,
        initiated_by: "mbr_e1", source_ip: "203.0.113.7", device: "ios",
        session_ref: "sess_1" }),
    env.db, "d", ops,
  );
  // NEGATIVE: a transaction with no recorded initiator cannot answer a claim
  await postEcommerceTransaction(
    R({ member_ref: "mbr_e1", transaction_type: "transfer", amount_cents: 100 }),
    env.db, "d", ops,
  );
  const tx = (env.rows["core.ecommerce_transaction"] ?? [])[0];
  if (tx) {
    // NEGATIVE: an outcome with no rationale discards the member's word silently
    await postRepudiationReview(R({ outcome: "rejected" }), String(tx.id), env.db, "d", ops);
    await postRepudiationReview(
      R({ outcome: "rejected", rationale: "audit trail shows the member's own device and session" }),
      String(tx.id), env.db, "d", ops,
    );
  }
}

/** Liquidity: bands, positions, mismatch, stress, collateral, packs. */
async function runLiquidityLifecycle(env: FireEnv): Promise<void> {
  if ((env.rows["core.liquidity_position"] ?? []).length > 0) return;
  const ops = env.actors.ops;

  // NEGATIVE: a position with NO configured bands reports unassessed
  await postLiquidityPosition(
    R({ as_of_date: "2026-07-16", liquid_assets_cents: 40_000_000_00,
        total_assets_cents: 400_000_000_00, haircut_table: { treasury: 0, agency: 200 },
        gl_balances: { cash: 1 } }),
    env.db, "d", ops,
  );
  // NEGATIVE: bands that cross are not bands
  await postLarBandConfig(
    R({ critical_bp: 900, warning_bp: 500, target_bp: 1200, approved_by: "alco_chair" }),
    env.db, "d", ops,
  );
  await postLarBandConfig(
    R({ critical_bp: 500, warning_bp: 800, target_bp: 1200, approved_by: "alco_chair" }),
    env.db, "d", ops,
  );
  await postLiquidityPosition(
    R({ as_of_date: "2026-07-17", liquid_assets_cents: 40_000_000_00,
        total_assets_cents: 400_000_000_00, haircut_table: { treasury: 0, agency: 200 },
        gl_balances: { cash: 1 },
        behavioral_assumptions: { core_deposit_runoff_bp: 500 } }),
    env.db, "d", ops,
  );
  // a band CHANGE, and a critical breach
  await postLiquidityPosition(
    R({ as_of_date: "2026-07-18", liquid_assets_cents: 12_000_000_00,
        total_assets_cents: 400_000_000_00, haircut_table: { treasury: 0 },
        gl_balances: { cash: 1 } }),
    env.db, "d", ops,
  );

  // NEGATIVE: gaps with no limit configured -> unassessed, no breach
  await postMaturityMismatch(
    R({ gaps: { "0_30d": -90_000_000_00 }, gl_balances: { cash: 1 } }),
    "liqpos_2026-07-17", env.db, "d", ops,
  );
  await postMaturityMismatch(
    R({ gaps: { "0_30d": -90_000_000_00, "31_90d": -10_000_000_00 },
        limit: { "0_30d": -50_000_000_00, "31_90d": -50_000_000_00 },
        intraday: true, draw_amount_cents: 20_000_000_00,
        shortfall_estimate_cents: 40_000_000_00,
        gl_balances: { cash: 1 },
        behavioral_assumptions: { runoff_bp: 500 },
        disposition: "drew on the FHLB line and re-laddered", dispositioned_by: "treasurer_1" }),
    "liqpos_2026-07-18", env.db, "d", ops,
  );

  await postStressAssumptions(
    R({ set: "baseline", behavioral_assumptions: { runoff_bp: 500 },
        baas_shock_params: { partner_exit: true }, intraday_profile: { peak_hour: 14 },
        assumption_value: { runoff_bp: 500 } }),
    env.db, "d", ops,
  );
  // NEGATIVE: a changed assumption with no rationale or approver
  await postStressAssumptions(
    R({ set: "severe", behavioral_assumptions: { runoff_bp: 1500 } }), env.db, "d", ops,
  );
  await postStressAssumptions(
    R({ set: "severe", behavioral_assumptions: { runoff_bp: 1500 },
        assumption_value: { runoff_bp: 1500 },
        rationale: "March BaaS partner exit showed 15% runoff, not 5%",
        approver_id: "alco_chair" }),
    env.db, "d", ops,
  );
  await postStressRun(
    R({ period: "2026Q3", kind: "scheduled", survival_days: 45, threshold_days: 60,
        ewi_value: { deposit_outflow_bp: 300 }, haircut_table: { treasury: 0 },
        behavioral_assumptions: { runoff_bp: 1500 }, assumption_value: { runoff_bp: 1500 } }),
    env.db, "d", ops,
  );
  // NEGATIVE: an ad-hoc rerun that will not say what triggered it
  await postStressRun(R({ period: "2026Q3", kind: "adhoc", survival_days: 80 }), env.db, "d", ops);
  await postStressRun(
    R({ period: "2026Q3", kind: "adhoc", survival_days: 80, threshold_days: 60,
        trigger_reason: "EWI spike: 3% single-day deposit outflow",
        ewi_value: { deposit_outflow_bp: 300 } }),
    env.db, "d", ops,
  );

  // NEGATIVE: a tested facility with no script cannot be repeated
  await postFacility(R({ name: "FHLB Atlanta", kind: "fhlb", tested: true }), env.db, "d", ops);
  await postFacility(
    R({ name: "FHLB Atlanta", kind: "fhlb", tested: true,
        test_script: "draw $1m, confirm settlement, repay same day",
        contacts: { desk: "555-0199" }, collateral_schedule: { mortgages: "blanket lien" } }),
    env.db, "d", ops,
  );
  // NEGATIVE: headroom with no eligibility rules
  await postCollateralPosition(
    R({ unencumbered_cents: 30_000_000_00, pledged_cents: 10_000_000_00 }),
    "fac_fhlb", env.db, "d", ops,
  );
  await postCollateralPosition(
    R({ as_of_date: "2026-07-18", unencumbered_cents: 30_000_000_00,
        pledged_cents: 28_000_000_00, floor_cents: 5_000_000_00,
        eligibility_rules: { mortgages: "1-4 family, current" },
        pledge_schedule: { mortgages: 28_000_000_00 },
        move_detail: { out: "sold 2m of pledged paper" }, recompute: true }),
    "fac_fhlb", env.db, "d", ops,
  );

  for (const cadence of ["daily", "weekly", "board"]) {
    await postLiquidityPack(
      R({ cadence, period: "2026-07", concentration_top10: [{ name: "P1", bp: 400 }],
          ceo_summary: "LAR fell through the warning band on the 18th",
          weekly_deltas: { lar_bp: -700 }, limit_registry: ["LAR", "mismatch"] }),
      env.db, "d", ops,
    );
  }
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
  // EC-13: the assessment PRECEDES the determination and is a different act
  await postIncidentAssessment(
    R({ data_scope: { members: 1400, fields: ["name", "account_number"] },
        member_impact: "1,400 members' account numbers exposed",
        facts: { vector: "credential stuffing", contained: true },
        scope_initial: "online banking session store", detection_source: "siem" }),
    id, env.db, "d", env.actors.ops,
  );
  // NEGATIVE: external comms before legal review is refused
  await postExternalComms(R({ holding_statement: "we are investigating" }), id, env.db, "d", env.actors.ops);
  await postExternalComms(
    R({ holding_statement: "we are investigating an incident affecting online banking",
        legal_reviewed_by: "counsel_1", comms_plan: { channels: ["website", "email"] } }),
    id, env.db, "d", env.actors.ops,
  );
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
import { postCardReissue, postIssueCard } from "../api/cards.ts";
import {
  postCollateralPosition, postFacility, postLarBandConfig, postLiquidityPack,
  postLiquidityPosition, postMaturityMismatch, postStressAssumptions, postStressRun,
} from "../api/liquidity.ts";
import {
  postCredentialIssue, postEcommerceRiskAssessment, postEcommerceTransaction, postEnrollment,
  postLoginFailure, postPasswordChange, postRepudiationReview,
} from "../api/ecommerce.ts";
import {
  postAddressChange, postApplicationOptions, postDisclosureDelivery, postDisclosureTemplate,
  postGmiCollection, postInterestAccrualRun, postInterestConfig, postLoCompPlan,
  postMemberPreferences, postMemberRecordExport, postMemberRestriction, postMembership,
  postApplicationIntake, postBalanceInquiry, postNoticeQueue, postServiceRequest, postStatement,
} from "../api/deposits_member.ts";
import {
  postChargeOff, postCollectionContact, postCollectionProtection, postCollectionsPolicy,
  postDelinquencyEvaluation, postFurnishingCycle, postLoanModification,
  postOverdraftReferral,
} from "../api/collections.ts";
import {
  postAnalyticsDataset, postBiometricPurge, postBiometricVerification,
  postDisposalCertificate, postEsignConsent, postFurnishingCorrection,
  postFurnishingDispute, postMinorDataEvent, postNoticeDelivery, postNotificationDecision,
  postPreferencePropagation, postPrivacyNotice, postPrivacyPreference,
  postStateRequest, postStateRequestFulfilment, postWebConsent, postWebTagReview,
} from "../api/privacy.ts";
import {
  post314aRequest, post314aResponse, postCipVerification, postCmirFiling,
  postCtrExemptionReview, postEddCompletion, postEddProfile, postEscalation,
  postEscalationAck, postFbarAccount, postFbarFiling, postMonetaryInstrument,
  postOfacAnnualReport, postOfacRelease, postOfacScreen, postPepScreen,
  postRegulatoryChange, postSarLifecycle, postTravelRuleRecord,
} from "../api/bsa_program.ts";
import {
  postControlException, postControlExceptionSweep, postControlOverride,
  postOverrideAnalytics, postRiskAcceptance, postRiskAcceptanceDecision,
  postRiskAcceptanceSweep, postRiskBreachPresentation, postRiskObservation,
  putRisk, putRiskAppetite,
} from "../api/risk_exceptions.ts";
import {
  postComplaint, postComplaintAcknowledge, postComplaintBoardReport, postComplaintResolve,
  postComplaintResponse, postComplaintTrend, postDispute, postDisputeResolve,
  postProvisionalCredit,
} from "../api/complaints.ts";
import {
  postAlmSimulation, postCfpLevelChange, postCreditFile, postCreditFileReanalysis,
  postFairValue, postInstrumentListEntry, postIntermediary, postLiquidityClassification,
  postLiquidityReport, postPerformanceMeasurement, postPortfolioReport, postRepoAgreement,
  postSafekeepingReconciliation, postSecurityDowngrade, postTrade, postTradeConfirmation,
  postTradeException, postTradeReconciliation, putLimitSet, putUserRole,
} from "../api/investment.ts";
import {
  postAppraisalComplete, postAppraisalOrder, postAtrQm, postCreditApplicationRecord,
  postCreditConfig, postCreditDecisionRecord, postCreditReport, postFairLendingAnalysis,
  postFairLendingRemediationClose, postHmdaLar, postInsiderLoanReview, postLoanException,
  postLoanExceptionAnalytics, postLoanExceptionDecision, postLoanPricing,
  postLendingAdverseAction, postLoanBooking,
  postPrequalification, postPricingExceptionReview, postProductScreen, postRateSheet,
  putInsider,
} from "../api/lending_underwriting.ts";
import {
  postArchiveConfirmation, postCddProfile, postCddRefresh, postDestructionLogReconcile,
  postDestructionLogResolve, postIntegrityTestComplete, postIntegrityTestSchedule,
  postRecordClassify, postRecordDisposition, postRecordsPolicyReview,
  postRetentionScheduleEntry, postStorageBox, putRecordsContact,
} from "../api/records_admin.ts";
import {
  postCashBoardSummary, postCashDeviationDecision, postCashDeviationRequest,
  postCashEnterprisePosition, postCashEnterpriseRemediation, postCashException,
  postCashKriPublish, postCashLimitsSchedule, postCashLoad, postCashNightDropRetrieval,
  postCashOverShort, postCashOverShortResolve, postCashPolicyAdoption,
  postCashRecordsPackage, postCashReconciliation, postCashShipment,
  postCashShipmentVerify, postCashSurpriseCountComplete, postCashSurpriseCountSchedule,
  postCashSuspenseClear, postCashSuspenseSweep, putCashAsset,
} from "../api/cash_ops.ts";
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
    await runBsaProgramLifecycle(env);
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
    await runBsaProgramLifecycle(env);
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
    await runBsaProgramLifecycle(env);
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
    // RR-03 declares `disposal.scheduled`, which is emitted by the SWEEP — the
    // step that evaluates the three eligibility conditions. Disposing directly
    // skipped it, so RR-03 read red for a missing event that the system does
    // in fact produce, just not on this path.
    env.rows["core.record"] ??= [];
    env.rows["core.record"].push({
      id, record_class: "cip_identity", subject_ref: "acct_9",
      retention_anchor: "2014-01-01T00:00:00.000Z", retention_expires_at: "2019-01-01T00:00:00.000Z",
      legal_hold_flag: false, disposed_at: null, provenance: "production",
    });
    await postDisposalSweep(R({}), env.db, "d", env.actors.ops);
    await postDisposeRecord(R({ approved_by: "rm", certificate: "c" }), id, env.db, "d", env.actors.ops);
  },
  "record.disposal_eligible": async (env) => { await FIRERS["disposal.executed"](env, ""); },
  "record.hold.applied": (env, uid) => FIRERS["legal_hold.created"](env, uid),
  "record.hold.placed": (env, uid) => FIRERS["legal_hold.created"](env, uid),
  "record.hold.released": (env, uid) => FIRERS["legal_hold.clear.confirmed"](env, uid),
  // RR-07 (BSA anonymization) and SC-02 (the shared lifecycle) BOTH declare
  // this trigger and need different halves of the system: SC-02 needs the
  // disposal path, RR-07 needs the disposition METHOD. Firing only one graded
  // the other against machinery it does not use.
  "record.retention.expires_at": (env) => runPrivacyLifecycle(env),
  "record.retention.expired": async (env, uid) => {
    await runPrivacyLifecycle(env);
    await FIRERS["disposal.executed"](env, uid);
    await runRecordsAdminLifecycle(env);
  },
  // RR-01 and RR-11 hang off record.created and need the SCHEDULE, not just a
  // disposal. Routing this to the disposal firer graded them against machinery
  // that never consults Schedule A.
  "record.created": (env) => runRecordsAdminLifecycle(env),
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
    await runBsaProgramLifecycle(env);
    await postWirePrepare(
      R({ source_account_id: "acct_3", amount_cents: 5_000, beneficiary: { name: "B", country: "US" } }),
      env.db, env.cfg, "d", env.actors.ops,
    );
  },
  "loan_party.added": async (env) => {
    await postLoanParty(
      R({
        role: "borrower", party_name: `P${env.n()}`,
        identity: { tin_last4: "1234", dob: "1980-01-01" },
        contact: { email: "p@example.test", phone: "+15550100" },
      }),
      "app_1", env.db, "d", env.actors.ops,
    );
    // LP-11 declares the SCREEN OUTCOMES as separate facts — screened, cleared,
    // potential match, escalated. The gate emitted only the escalation, so a
    // CLEAN screen left no evidence it had run: "not escalated" and "never
    // screened" produced the same event log. Same defect the OFAC floor was
    // built to avoid on the payment rails.
    await postLoanParty(
      R({ role: "guarantor", party_name: "SDN Suspect" }), "app_1", env.db, "d", env.actors.ops,
    );
  },
  "loan_party.ofac.cleared": (env, uid) => FIRERS["loan_party.added"](env, uid),
  "loan_party.ofac.escalated": (env, uid) => FIRERS["loan_party.added"](env, uid),
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
  // Both capital (BA-*) and investment (IP-02/IP-12) declare these. The capital
  // report and the portfolio report are different documents that happen to
  // share a code, so both lifecycles run rather than one being picked.
  "portfolio.board_report.issued": async (env) => {
    await runCapitalLifecycle(env);
    await runInvestmentLifecycle(env);
  },
  "portfolio.management_report.issued": async (env) => {
    await runCapitalLifecycle(env);
    await runInvestmentLifecycle(env);
  },
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
  "policy.board_review.started": (env) => runCashOpsLifecycle(env),
  "cash.governance_quarter.closed": (env) => runCashOpsLifecycle(env),
  "cash.kri_month.closed": (env) => runCashOpsLifecycle(env),
  "cash.exception.logged": (env) => runCashOpsLifecycle(env),
  "cash.enterprise_position.posted": (env) => runCashOpsLifecycle(env),
  "cash.enterprise_limit.warning": (env) => runCashOpsLifecycle(env),
  "cash.enterprise_limit.breached": (env) => runCashOpsLifecycle(env),
  "cash.limits_schedule.updated": (env) => runCashOpsLifecycle(env),
  "cash.load.requested": (env) => runCashOpsLifecycle(env),
  "cash.dual_control.initiated": (env) => runCashOpsLifecycle(env),
  "cash.recon_day.closed": (env) => runCashOpsLifecycle(env),
  "cash.recon.variance_found": (env) => runCashOpsLifecycle(env),
  "gl.cash_suspense.aged": (env) => runCashOpsLifecycle(env),
  "gl.cash_suspense.cleared": (env) => runCashOpsLifecycle(env),
  "cash.overshort.recorded": (env) => runCashOpsLifecycle(env),
  "cash.overshort.resolved": (env) => runCashOpsLifecycle(env),
  "cash.overshort.threshold_crossed": (env) => runCashOpsLifecycle(env),
  "cash.overshort_anomaly.detected": (env) => runCashOpsLifecycle(env),
  "cash.nightdrop.retrieved": (env) => runCashOpsLifecycle(env),
  "cash.shipment.received": (env) => runCashOpsLifecycle(env),
  "cash.shipment.verified": (env) => runCashOpsLifecycle(env),
  "cash.seal.mismatch": (env) => runCashOpsLifecycle(env),
  "cash.surprise_count.due": (env) => runCashOpsLifecycle(env),
  "cash.surprise_count.completed": (env) => runCashOpsLifecycle(env),
  "supervisory.count_results.delivered": (env) => runCashOpsLifecycle(env),
  "exam.export.requested": (env) => runCashOpsLifecycle(env),
  "cash.deviation.requested": (env) => runCashOpsLifecycle(env),
  "cash.deviation.approved": (env) => runCashOpsLifecycle(env),
  "cash.deviation.expired": (env) => runCashOpsLifecycle(env),
  "cash.evidence.created": (env) => runCashOpsLifecycle(env),
  // CP-05 (`employee.separated`, `cash.custody.*`, `cash.keybox.*`) and the
  // `hr.*` half of CP-07 are deliberately NOT registered. Those need an
  // employee, and inventing one to turn a control green is the error the
  // standing rule in BLUEPRINT forbids.
  "record_class.unmatched": (env) => runRecordsAdminLifecycle(env),
  "schedule_a.entry.amended": (env) => runRecordsAdminLifecycle(env),
  "record.media_converted": (env) => runRecordsAdminLifecycle(env),
  "record.integrity.test.due": (env) => runRecordsAdminLifecycle(env),
  "record.integrity_test.completed": (env) => runRecordsAdminLifecycle(env),
  "storage_box.created": (env) => runRecordsAdminLifecycle(env),
  "destruction_log.mismatch.detected": (env) => runRecordsAdminLifecycle(env),
  "destruction_log.mismatch.resolved": (env) => runRecordsAdminLifecycle(env),
  "records.annual.review.due_at": (env) => runRecordsAdminLifecycle(env),
  "core_archive.confirmation_due": (env) => runRecordsAdminLifecycle(env),
  "email_archive.test.due": (env) => runRecordsAdminLifecycle(env),
  "email_archive.test.completed": (env) => runRecordsAdminLifecycle(env),
  "cdd.refresh.due": (env) => runRecordsAdminLifecycle(env),
  "cdd.profile.refreshed": (env) => runRecordsAdminLifecycle(env),
  "regulation.retention_change.detected": (env) => runRecordsAdminLifecycle(env),
  "records.policy_review.completed": (env) => runRecordsAdminLifecycle(env),
  "records.contacts.assigned": (env) => runRecordsAdminLifecycle(env),
  "records.contact_vacated": (env) => runRecordsAdminLifecycle(env),
  "records.board_report.filed": (env) => runRecordsAdminLifecycle(env),
  // Lending underwriting. `loan.booking.requested` IS registered now: it needs
  // core.loan, one of the 22 abandoned tables, and building the booking writer
  // was the whole point of the abandoned-table finding.
  "loan.booking.requested": async (env) => {
    await runLendingUwLifecycle(env);
    await runCollectionsLifecycle(env);
  },
  "aan.issued": (env) => runLendingUwLifecycle(env),
  "analytics.disparity_report.completed": (env) => runLendingUwLifecycle(env),
  "analytics.redlining_review.completed": (env) => runLendingUwLifecycle(env),
  "appraisal.completed": (env) => runLendingUwLifecycle(env),
  "appraisal.ordered": (env) => runLendingUwLifecycle(env),
  "collateral.ltv.checked": (env) => runLendingUwLifecycle(env),
  "credit_config.changed": (env) => runLendingUwLifecycle(env),
  "credit_package.retention.started": (env) => runLendingUwLifecycle(env),
  "credit_report.received": (env) => runLendingUwLifecycle(env),
  "credit_score.tolerance.breached": (env) => runLendingUwLifecycle(env),
  "fair_lending.discouragement.reported": (env) => runLendingUwLifecycle(env),
  "fair_lending.remediation.opened": (env) => runLendingUwLifecycle(env),
  "hmda.lar_qc.completed": (env) => runLendingUwLifecycle(env),
  "insider.board_approval.recorded": (env) => runLendingUwLifecycle(env),
  "insider.board_report.issued": (env) => runLendingUwLifecycle(env),
  "loan_account.adverse_action.decided": (env) => runLendingUwLifecycle(env),
  "loan_application.adverse_action.decided": (env) => runLendingUwLifecycle(env),
  "loan_application.counteroffer.expired": (env) => runLendingUwLifecycle(env),
  "loan_application.created": (env) => runLendingUwLifecycle(env),
  "loan_application.decisioned": (env) => runLendingUwLifecycle(env),
  "loan_application.dti.breached": (env) => runLendingUwLifecycle(env),
  "loan_application.incomplete.detected": (env) => runLendingUwLifecycle(env),
  "loan_application.insider.flagged": (env) => runLendingUwLifecycle(env),
  "loan_application.insider.screened": (env) => runLendingUwLifecycle(env),
  "loan_application.oral_adverse_decision": (env) => runLendingUwLifecycle(env),
  "loan_application.thin_file.flagged": (env) => runLendingUwLifecycle(env),
  "loan_exception.analytics.published": (env) => runLendingUwLifecycle(env),
  "loan_exception.decided": (env) => runLendingUwLifecycle(env),
  "loan_exception.detected": (env) => runLendingUwLifecycle(env),
  "loan_exception.submitted": (env) => runLendingUwLifecycle(env),
  "loan_pricing.exception.decided": (env) => runLendingUwLifecycle(env),
  "loan_pricing.exception.requested": (env) => runLendingUwLifecycle(env),
  "loan_pricing.locked": (env) => runLendingUwLifecycle(env),
  "prequal.requested": (env) => runLendingUwLifecycle(env),
  "pricing.exception_period.closed": (env) => runLendingUwLifecycle(env),
  "product_menu.change.requested": (env) => runLendingUwLifecycle(env),
  "product_menu.deployed": (env) => runLendingUwLifecycle(env),
  "rate_sheet.refresh.due_at": (env) => runLendingUwLifecycle(env),
  "steering_review.completed": (env) => runLendingUwLifecycle(env),
  "valuation.rov.requested": (env) => runLendingUwLifecycle(env),
  "trade.limit.blocked": (env) => runInvestmentLifecycle(env),
  "trade.exception.logged": (env) => runInvestmentLifecycle(env),
  "intermediary.review.completed": (env) => runInvestmentLifecycle(env),
  "trade.permissibility.checked": (env) => runInvestmentLifecycle(env),
  "trade.limit_warning.issued": (env) => runInvestmentLifecycle(env),
  "instrument_list.review.completed": (env) => runInvestmentLifecycle(env),
  "regulatory.change_analysis.logged": (env) => runInvestmentLifecycle(env),
  "position.booked": (env) => runInvestmentLifecycle(env),
  "alm.irr_simulation.completed": (env) => runInvestmentLifecycle(env),
  "stress_test.minimum.breached": (env) => runInvestmentLifecycle(env),
  "credit_file.approved": (env) => runInvestmentLifecycle(env),
  "credit_file.reanalysis.completed": (env) => runInvestmentLifecycle(env),
  "security.downgraded": (env) => runInvestmentLifecycle(env),
  "security.downgrade.reviewed": (env) => runInvestmentLifecycle(env),
  "liquidity.report.published": (env) => runInvestmentLifecycle(env),
  "liquidity.stress.declared": (env) => runInvestmentLifecycle(env),
  "position.liquidity.classified": (env) => runInvestmentLifecycle(env),
  "limit_set.review.completed": (env) => runInvestmentLifecycle(env),
  "concentration.limit_exceeded": (env) => runInvestmentLifecycle(env),
  "trade.intermediary.blocked": (env) => runInvestmentLifecycle(env),
  "safekeeping.reconciliation.completed": (env) => runInvestmentLifecycle(env),
  "repo.booked": (env) => runInvestmentLifecycle(env),
  "repo.collateral_marked": (env) => runInvestmentLifecycle(env),
  "repo.margin_shortfall.detected": (env) => runInvestmentLifecycle(env),
  "security.fair_value.updated": (env) => runInvestmentLifecycle(env),
  "security.otti_analysis.completed": (env) => runInvestmentLifecycle(env),
  "trade.checklist.completed": (env) => runInvestmentLifecycle(env),
  "trade.checklist_exception_raised": (env) => runInvestmentLifecycle(env),
  "portfolio.stress_test.completed": (env) => runInvestmentLifecycle(env),
  "performance.attribution.completed": (env) => runInvestmentLifecycle(env),
  "performance.target_change.proposed": (env) => runInvestmentLifecycle(env),
  "trade.sod.blocked": (env) => runInvestmentLifecycle(env),
  "trade.confirmation.received": (env) => runInvestmentLifecycle(env),
  "trade.confirmation_discrepancy.flagged": (env) => runInvestmentLifecycle(env),
  "trade.reconciliation.completed": (env) => runInvestmentLifecycle(env),
  "trade.step.recorded": (env) => runInvestmentLifecycle(env),
  "document.required_set": (env) => runInvestmentLifecycle(env),
  "document.attachment_due_at": (env) => runInvestmentLifecycle(env),
  "cfp.investment_test.completed": (env) => runInvestmentLifecycle(env),
  "complaint.direct.received": (env) => runComplaintsLifecycle(env),
  "complaint.investigation.completed": (env) => runComplaintsLifecycle(env),
  "complaint.regulator.received": (env) => runComplaintsLifecycle(env),
  "complaint.trend.reported": (env) => runComplaintsLifecycle(env),
  "complaint.received": (env) => runComplaintsLifecycle(env),
  "complaint.logged": (env) => runComplaintsLifecycle(env),
  "complaint.acknowledged": (env) => runComplaintsLifecycle(env),
  "dispute.opened": (env) => runComplaintsLifecycle(env),
  "dispute.provisional_credit_due_at": (env) => runComplaintsLifecycle(env),
  "dispute.investigation.completed": (env) => runComplaintsLifecycle(env),
  "complaint.privacy.received": (env) => runComplaintsLifecycle(env),
  "complaint.trend.review.due": (env) => runComplaintsLifecycle(env),
  "compliance.board.report.due_at": (env) => runComplaintsLifecycle(env),
  "privacy.board.report.due_at": (env) => runComplaintsLifecycle(env),
  "incident.material": (env) => runComplaintsLifecycle(env),
  "risk_breach.detected": (env) => runRiskExceptionsLifecycle(env),
  "risk_breach.triage.due_at": (env) => runRiskExceptionsLifecycle(env),
  "risk_breach.committee_due_at": (env) => runRiskExceptionsLifecycle(env),
  "risk_breach.review.due_at": (env) => runRiskExceptionsLifecycle(env),
  "risk_acceptance.requested": (env) => runRiskExceptionsLifecycle(env),
  "risk_acceptance.decision.due_at": (env) => runRiskExceptionsLifecycle(env),
  "risk_acceptance.expiry_alert_at": (env) => runRiskExceptionsLifecycle(env),
  "risk_acceptance.expiry_warning": (env) => runRiskExceptionsLifecycle(env),
  "risk_acceptance.expired": (env) => runRiskExceptionsLifecycle(env),
  "control.override.invoked": (env) => runRiskExceptionsLifecycle(env),
  "exception.registered": (env) => runRiskExceptionsLifecycle(env),
  "exception.expiring": (env) => runRiskExceptionsLifecycle(env),
  "override.analytics_due": (env) => runRiskExceptionsLifecycle(env),
  "risk.trigger_edd": (env) => runBsaProgramLifecycle(env),
  "monetary_instrument.purchased": (env) => runBsaProgramLifecycle(env),
  "pep.hit": (env) => runBsaProgramLifecycle(env),
  "regulatory.change_required": (env) => runBsaProgramLifecycle(env),
  "regulator.request.received": (env) => runBsaProgramLifecycle(env),
  "pep.designated": (env) => runBsaProgramLifecycle(env),
  "cdd.profile.created": (env) => runBsaProgramLifecycle(env),
  "ofac.annual.report.due": (env) => runBsaProgramLifecycle(env),
  "sar.continuing_timer": (env) => runBsaProgramLifecycle(env),
  "sar.disclosure_request.received": (env) => runBsaProgramLifecycle(env),
  "ctr.exemption.review.due": (env) => runBsaProgramLifecycle(env),
  "application.submitted": (env) => runBsaProgramLifecycle(env),
  "verification.completed": (env) => runBsaProgramLifecycle(env),
  "cmir.reportable.identified": (env) => runBsaProgramLifecycle(env),
  "fbar.account.added": (env) => runBsaProgramLifecycle(env),
  "fbar.filing.timer": (env) => runBsaProgramLifecycle(env),
  "escalation.routed": (env) => runBsaProgramLifecycle(env),
  "escalation.acknowledged": (env) => runBsaProgramLifecycle(env),
  "edd.completed": (env) => runBsaProgramLifecycle(env),
  "filing.fincen_314a": (env) => runBsaProgramLifecycle(env),
  "privacy.annual.notice.due_at": (env) => runPrivacyLifecycle(env),
  "privacy.notice.revised": (env) => runPrivacyLifecycle(env),
  "privacy.notice_copy.requested": (env) => runPrivacyLifecycle(env),
  "privacy.optout.received": (env) => runPrivacyLifecycle(env),
  "privacy.optout.propagation.due_at": (env) => runPrivacyLifecycle(env),
  "privacy.optout.cleared": (env) => runPrivacyLifecycle(env),
  "privacy.nv_optout.received": (env) => runPrivacyLifecycle(env),
  "privacy.state_request.received": (env) => runPrivacyLifecycle(env),
  "web.gpc_signal": (env) => runPrivacyLifecycle(env),
  "privacy.state_request_fulfilled": (env) => runPrivacyLifecycle(env),
  "analytics.dataset.requested": (env) => runPrivacyLifecycle(env),
  "analytics.method.review.due_at": (env) => runPrivacyLifecycle(env),
  "analytics.reid_risk_assessment": (env) => runPrivacyLifecycle(env),
  "web.session.started": (env) => runPrivacyLifecycle(env),
  "web.consent.updated": (env) => runPrivacyLifecycle(env),
  "web.tag_review": (env) => runPrivacyLifecycle(env),
  "web.tag_review.requested": (env) => runPrivacyLifecycle(env),
  "verification.biometric.started": (env) => runPrivacyLifecycle(env),
  "verification.biometric.completed": (env) => runPrivacyLifecycle(env),
  "verification.biometric.purge.due_at": (env) => runPrivacyLifecycle(env),
  "privacy.age_gate.blocked": (env) => runPrivacyLifecycle(env),
  "privacy.minor_data.detected": (env) => runPrivacyLifecycle(env),
  "privacy.minor_data_deleted": (env) => runPrivacyLifecycle(env),
  "furnishing.correction.applied": (env) => runPrivacyLifecycle(env),
  "address.ncoa_mismatch.detected": (env) => runPrivacyLifecycle(env),
  "furnishing.dispute.received": (env) => runPrivacyLifecycle(env),
  "correction.propagated": (env) => runPrivacyLifecycle(env),
  "privacy.notice_template.published": (env) => runPrivacyLifecycle(env),
  "privacy.esign_consent.started": (env) => runPrivacyLifecycle(env),
  "loan.delinquency_day_10": (env) => runCollectionsLifecycle(env),
  "loan.delinquency_day_30": (env) => runCollectionsLifecycle(env),
  "loan.delinquency_day_90": (env) => runCollectionsLifecycle(env),
  "loan.nonaccrual.triggered": (env) => runCollectionsLifecycle(env),
  "loan.charged_off": (env) => runCollectionsLifecycle(env),
  "loan.modification.requested": (env) => runCollectionsLifecycle(env),
  "loan.modification.decided": (env) => runCollectionsLifecycle(env),
  "member.attorney_flag_set": (env) => runCollectionsLifecycle(env),
  "collections.contact.attempted": (env) => runCollectionsLifecycle(env),
  "furnishing.cycle_due_at": (env) => runCollectionsLifecycle(env),
  "overdraft.referral.issued": (env) => runCollectionsLifecycle(env),
  "overdraft.charged_off": (env) => runCollectionsLifecycle(env),
  "collections.policy_version.activated": (env) => runCollectionsLifecycle(env),
  "tdr.determination.recorded": (env) => runCollectionsLifecycle(env),
  "loan.classification.assigned": (env) => runCollectionsLifecycle(env),
  "loan.delinquency_day_60": (env) => runCollectionsLifecycle(env),
  "loan.chargeoff_due_closed_end": (env) => runCollectionsLifecycle(env),
  "loan.chargeoff_due_open_end": (env) => runCollectionsLifecycle(env),
  "loan.bankruptcy_notice.received": (env) => runCollectionsLifecycle(env),
  "loan.fraud.confirmed": (env) => runCollectionsLifecycle(env),
  "loan.death_loss_estimable": (env) => runCollectionsLifecycle(env),
  "loan.re_writedown": (env) => runCollectionsLifecycle(env),
  "loan.accrual.restored": (env) => runCollectionsLifecycle(env),
  "loan.rating_review.completed": (env) => runCollectionsLifecycle(env),
  "loan.foreclosure.proposed": (env) => runCollectionsLifecycle(env),
  "loan.workout.requested": (env) => runCollectionsLifecycle(env),
  "loan.io_capitalization.proposed": (env) => runCollectionsLifecycle(env),
  "loan.modified_payment_3.received": (env) => runCollectionsLifecycle(env),
  "tdr.quarterly_review.completed": (env) => runCollectionsLifecycle(env),
  "collections.cease_request.received": (env) => runCollectionsLifecycle(env),
  "collections.template.submitted": (env) => runCollectionsLifecycle(env),
  "overdraft.report.reviewed": (env) => runCollectionsLifecycle(env),
  "overdraft.fee.logged": (env) => runCollectionsLifecycle(env),
  "overdraft.waiver.requested": (env) => runCollectionsLifecycle(env),
  "overdraft.recurring_pattern.detected": (env) => runCollectionsLifecycle(env),
  "collections.board_report.issued": (env) => runCollectionsLifecycle(env),
  "collections.policy_review.completed": (env) => runCollectionsLifecycle(env),
  "collections.policy_breach.logged": (env) => runCollectionsLifecycle(env),
  "loan.dpd.updated": (env) => runCollectionsLifecycle(env),
  "collections.courtesy_notice.sent": (env) => runCollectionsLifecycle(env),
  "incident.collections.logged": (env) => runCollectionsLifecycle(env),
  "furnishing.idtheft_dispute.received": (env) => runCollectionsLifecycle(env),
  "disclosure.template.published": (env) => runDepositsMemberLifecycle(env),
  "disclosure.account_opening.delivered": (env) => runDepositsMemberLifecycle(env),
  "disclosure.change_in_terms.sent": (env) => runDepositsMemberLifecycle(env),
  "disclosure.maturity_notice.sent": (env) => runDepositsMemberLifecycle(env),
  "statement.issued": (env) => runDepositsMemberLifecycle(env),
  "interest.accrual_run.completed": (env) => runDepositsMemberLifecycle(env),
  "product.interest_config.updated": (env) => runDepositsMemberLifecycle(env),
  "fee.ytd_total": (env) => runDepositsMemberLifecycle(env),
  "member.eligibility.determined": (env) => runDepositsMemberLifecycle(env),
  "member.eligibility.denied": (env) => runDepositsMemberLifecycle(env),
  "entity.address.changed": (env) => runDepositsMemberLifecycle(env),
  "member.preferences.updated": (env) => runDepositsMemberLifecycle(env),
  "member.restriction_notice.sent": (env) => runDepositsMemberLifecycle(env),
  "record.bulk_export.completed": (env) => runDepositsMemberLifecycle(env),
  "service.first.response.due_at": (env) => runDepositsMemberLifecycle(env),
  "service.first_response.sent": (env) => runDepositsMemberLifecycle(env),
  "service.resolved": (env) => runDepositsMemberLifecycle(env),
  "lo_comp.plan.decided": (env) => runDepositsMemberLifecycle(env),
  "application.options.presented": (env) => runDepositsMemberLifecycle(env),
  "applicant.gmi_responses": (env) => runDepositsMemberLifecycle(env),
  "hmda.gmi.recorded": (env) => runDepositsMemberLifecycle(env),
  "notice.incompleteness.sent": (env) => runDepositsMemberLifecycle(env),
  "aan.queued": (env) => runDepositsMemberLifecycle(env),
  "valuation.rights_disclosure.sent": (env) => runDepositsMemberLifecycle(env),
  "valuation.copy.sent": (env) => runDepositsMemberLifecycle(env),
  "disclosure.error.detected": (env) => runDepositsMemberLifecycle(env),
  "account.maturity.notice.due_at": (env) => runDepositsMemberLifecycle(env),
  "disclosure.change_in_terms_due_at": (env) => runDepositsMemberLifecycle(env),
  "disclosure.classification.logged": (env) => runDepositsMemberLifecycle(env),
  "balance.disclosed": (env) => runDepositsMemberLifecycle(env),
  "member.address_notice": (env) => runDepositsMemberLifecycle(env),
  "member.closure_payout.sent": (env) => runDepositsMemberLifecycle(env),
  "application.option_waiver.decided": (env) => runDepositsMemberLifecycle(env),
  "application.disclosures.presented": (env) => runDepositsMemberLifecycle(env),
  "hmda.lar_row.recorded": (env) => runDepositsMemberLifecycle(env),
  "interest.accrued_balance": (env) => runDepositsMemberLifecycle(env),
  "account.adverse_action.decided": (env) => runDepositsMemberLifecycle(env),
  "account.closure.approved": (env) => runDepositsMemberLifecycle(env),
  "account.created": (env) => runDepositsMemberLifecycle(env),
  "account.lock.applied": (env) => runDepositsMemberLifecycle(env),
  "account.maturity_window.opened": (env) => runDepositsMemberLifecycle(env),
  "analytics.quarter.closed": (env) => runLendingUwLifecycle(env),
  "analytics.threshold.breached": (env) => runDepositsMemberLifecycle(env),
  "application.first_lien.created": (env) => runDepositsMemberLifecycle(env),
  "application.form.rendered": (env) => runDepositsMemberLifecycle(env),
  "application.hmda_covered.created": (env) => runLendingUwLifecycle(env),
  "application.option_selection.started": (env) => runDepositsMemberLifecycle(env),
  "application.option_shortfall.detected": (env) => runDepositsMemberLifecycle(env),
  "balance.inquiry.received": (env) => runDepositsMemberLifecycle(env),
  "card.request_during_address_hold": (env) => runDepositsMemberLifecycle(env),
  "estate.claim.submitted": (env) => runDepositsMemberLifecycle(env),
  "expulsion.board_report.filed": (env) => runDepositsMemberLifecycle(env),
  "fee.overdraft.posted": (env) => runDepositsMemberLifecycle(env),
  "hmda.submission_window_open": (env) => runLendingUwLifecycle(env),
  "interest.credited": (env) => runDepositsMemberLifecycle(env),
  "lo_comp.plan.submitted": (env) => runDepositsMemberLifecycle(env),
  "member.address_notice.sent": (env) => runDepositsMemberLifecycle(env),
  "member.application.submitted": (env) => runDepositsMemberLifecycle(env),
  "member.death.reported": (env) => runDepositsMemberLifecycle(env),
  "member.delivery.failed": (env) => runDepositsMemberLifecycle(env),
  "member.eligibility_rule.failed": (env) => runDepositsMemberLifecycle(env),
  "member.expulsion.decided": (env) => runDepositsMemberLifecycle(env),
  "member.expulsion_hearing.held": (env) => runDepositsMemberLifecycle(env),
  "member.expulsion_hearing.requested": (env) => runDepositsMemberLifecycle(env),
  "member.expulsion_notice.sent": (env) => runDepositsMemberLifecycle(env),
  "member.expulsion_payout.sent": (env) => runDepositsMemberLifecycle(env),
  "pricing.exception.requested": (env) => runDepositsMemberLifecycle(env),
  "privacy.esign_consent.recorded": (env) => runDepositsMemberLifecycle(env),
  "record.bulk_export.requested": (env) => runDepositsMemberLifecycle(env),
  "redflag.detected": (env) => runDepositsMemberLifecycle(env),
  "service.inquiry.received": (env) => runDepositsMemberLifecycle(env),
  "service.reclassified_as_dispute": (env) => runDepositsMemberLifecycle(env),
  "statement.cycle.closed": (env) => runDepositsMemberLifecycle(env),
  "verification.denied": (env) => runDepositsMemberLifecycle(env),
  "ecommerce.credentials.issued": (env) => runEcommerceLifecycle(env),
  "ecommerce.enrollment.received": (env) => runEcommerceLifecycle(env),
  "ecommerce.enrollment.verified": (env) => runEcommerceLifecycle(env),
  "ecommerce.login.failed": (env) => runEcommerceLifecycle(env),
  "ecommerce.repudiation_claim.received": (env) => runEcommerceLifecycle(env),
  "ecommerce.risk.assessment.due": (env) => runEcommerceLifecycle(env),
  "ecommerce.transaction.initiated": (env) => runEcommerceLifecycle(env),
  "member_credential.expiry.due": (env) => runEcommerceLifecycle(env),
  "member_credential.temp_password.issued": (env) => runEcommerceLifecycle(env),
  "collateral.file.posted": (env) => runLiquidityLifecycle(env),
  "collateral.large_move.detected": (env) => runLiquidityLifecycle(env),
  "ewi.major_event.flagged": (env) => runLiquidityLifecycle(env),
  "ewi.spike.flagged": (env) => runLiquidityLifecycle(env),
  "facility.test.due_at": (env) => runLiquidityLifecycle(env),
  "lar.band.changed": (env) => runLiquidityLifecycle(env),
  "liquidity.eod.posted": (env) => runLiquidityLifecycle(env),
  "liquidity.large_flow.detected": (env) => runLiquidityLifecycle(env),
  "mismatch.breach.dispositioned": (env) => runLiquidityLifecycle(env),
  "report.board_due_at": (env) => runLiquidityLifecycle(env),
  "report.weekly_digest.published": (env) => runLiquidityLifecycle(env),
  "stress.assumption.changed": (env) => runLiquidityLifecycle(env),
  "incident.declared": (env) => runIncidentLifecycle(env),
  "incident.detected": (env) => runIncidentLifecycle(env),
  "incident.sev1.detected": (env) => runIncidentLifecycle(env),
  // PR-18 and the incident policy both hang off classification; both run.
  "incident.classified": async (env) => {
    await runIncidentLifecycle(env);
    await runPrivacyLifecycle(env);
  },
  "incident.criminal_suspected": async (env) => {
    await runIncidentLifecycle(env);
    await runPrivacyLifecycle(env);
  },
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
