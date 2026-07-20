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
  "record.retention.expired": async (env, uid) => {
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
  "loan.booking.requested": (env) => runLendingUwLifecycle(env),
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
