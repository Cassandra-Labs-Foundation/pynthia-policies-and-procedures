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
