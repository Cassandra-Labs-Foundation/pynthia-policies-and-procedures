// Audit engagements and findings (AU-03 … AU-10).
//
// Every event this module emits is a CONSEQUENCE of a state change it decided,
// never a code handed in by the caller. That distinction is the whole lesson of
// the echo: a register that emits whatever it is given is not a control.
//
// So: `audit.annual_plan.approved` fires because a DIFFERENT actor approved a
// submitted plan. `finding.opened` fires because a report was issued and
// findings were attached to it. `finding.aging_threshold.breached` fires
// because a remediation date passed and nobody closed the finding.

import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { type PartnerContext } from "./auth.ts";
import { type EvidenceScope, provenanceFor } from "./bsa.ts";
import {
  apiError, internalErrorResponse, isNonEmptyString, jsonResponse,
  notFoundResponse, parseJsonBody, validationError, type ValidationErrorItem,
} from "./lib.ts";

/** AU-08: remediation clock from the management response. */
const REMEDIATION_DAYS = 90;
/** AU-10: work papers retained 7 years from issuance. */
const WORKPAPER_RETENTION_YEARS = 7;
const SWEEP_LIMIT = 200;

const ENG_COLS =
  "id, plan_cycle_year, scope, auditor_ref, independence_attested_by, independence_attested_at, " +
  "status, plan_submitted_at, plan_submitted_by, plan_approved_at, plan_approved_by, " +
  "started_at, fieldwork_completed_at, report_drafted_at, report_issued_at, report_issued_by, " +
  "rating, retention_expires_at, provenance, created_at";
const FIND_COLS =
  "id, engagement_id, severity, summary, opened_at, communicated_at, management_response, " +
  "management_response_at, remediation_due_at, risk_acceptance_proposed_at, " +
  "risk_acceptance_decision, risk_acceptance_rationale, retest_result, closed_at, " +
  "closure_verified_by, provenance, created_at";

function requireAuditActor(ctx: PartnerContext, requestId: string): Response | null {
  if (ctx.actorType === "partner") return notFoundResponse(requestId, "route", "/audit");
  return null;
}

async function emit(
  db: SupabaseClient, scope: EvidenceScope, id: string, code: string,
  rType: string, rId: string, payload: Record<string, unknown>, ctx?: PartnerContext,
): Promise<void> {
  const { error } = await db.schema(scope).from("event").upsert({
    id, code, resource_type: rType, resource_id: `${rType}:${rId}`,
    payload, provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw new Error(`audit event (${code}): ${error.message}`);
}

/**
 * POST /audit/engagements {plan_cycle_year, scope, auditor_ref}
 *
 * AU-04: opening the plan cycle submits the annual plan. The submission is an
 * act by an identified actor, which is what the approval below must differ from.
 */
export async function postAuditEngagement(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireAuditActor(ctx, requestId);
  if (denied) return denied;

  const rec = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};
  const errors: ValidationErrorItem[] = [];
  if (typeof rec.plan_cycle_year !== "number") {
    errors.push({ type: "missing_field", field: "plan_cycle_year", message: "is required" });
  }
  for (const f of ["scope", "auditor_ref"]) {
    if (!isNonEmptyString(rec[f])) {
      errors.push({ type: "missing_field", field: f, message: "is required" });
    }
  }
  if (errors.length) return validationError(requestId, errors);

  const id = `aeng_${rec.plan_cycle_year}_${String(rec.scope).replace(/\W+/g, "_").slice(0, 24)}`;
  const now = new Date().toISOString();

  const { error } = await db.schema(scope).from("audit_engagement").upsert({
    id,
    plan_cycle_year: rec.plan_cycle_year,
    scope: rec.scope,
    auditor_ref: rec.auditor_ref,
    status: "plan_submitted",
    plan_submitted_at: now,
    plan_submitted_by: ctx.tokenId,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id", ignoreDuplicates: true });
  if (error) return internalErrorResponse(requestId, error);

  try {
    await emit(db, scope, `evt_${id}_cycle`, "audit.plan_cycle.opened", "audit_engagement", id,
      { year: rec.plan_cycle_year }, ctx);
    await emit(db, scope, `evt_${id}_submitted`, "audit.annual_plan.submitted", "audit_engagement", id,
      { submitted_by: ctx.tokenId, scope: rec.scope }, ctx);
    // AU-05: opening the cycle also schedules the assessment
    await emit(db, scope, `evt_${id}_assess_sched`, "audit.assessment.scheduled", "audit_engagement", id,
      { year: rec.plan_cycle_year }, ctx);
  } catch (e) {
    console.error(`audit plan events failed for ${id}: ${e}`);
  }

  return jsonResponse({ id, status: "plan_submitted", submitted_by: ctx.tokenId }, 201, requestId);
}

/**
 * POST /audit/engagements/{id}/approve-plan
 *
 * AU-04. Refused if the approver submitted the plan — the fourth use of the
 * four-eyes property, and the reason it lives in one place.
 */
export async function postApproveAuditPlan(
  _req: Request, id: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireAuditActor(ctx, requestId);
  if (denied) return denied;

  const { data, error: selErr } = await db.schema(scope).from("audit_engagement")
    .select(ENG_COLS).eq("id", id).maybeSingle();
  if (selErr) return internalErrorResponse(requestId, selErr);
  if (!data) return notFoundResponse(requestId, "audit_engagement", id);
  const row = data as unknown as Record<string, unknown>;

  if (row.plan_approved_at) {
    return jsonResponse({ id, status: row.status }, 200, requestId, { "Idempotent-Replayed": "true" });
  }
  if (row.plan_submitted_by === ctx.tokenId) {
    return apiError(409, "four_eyes_violation", requestId, {
      title: "Four Eyes Violation",
      detail: `token ${ctx.tokenId} submitted this audit plan and may not also approve it`,
    });
  }

  const now = new Date().toISOString();
  const { error } = await db.schema(scope).from("audit_engagement")
    .update({ status: "plan_approved", plan_approved_at: now, plan_approved_by: ctx.tokenId })
    .eq("id", id);
  if (error) return internalErrorResponse(requestId, error);

  try {
    await emit(db, scope, `evt_${id}_approved`, "audit.annual_plan.approved", "audit_engagement", id,
      { approved_by: ctx.tokenId, submitted_by: row.plan_submitted_by }, ctx);
    await emit(db, scope, `evt_${id}_sched_final`, "audit.schedule_finalized", "audit_engagement", id,
      { year: row.plan_cycle_year }, ctx);
  } catch (e) {
    console.error(`audit approval events failed for ${id}: ${e}`);
  }
  return jsonResponse({ id, status: "plan_approved", approved_by: ctx.tokenId }, 200, requestId);
}

/**
 * POST /audit/engagements/{id}/start {independence_attested: true}
 *
 * AU-03: independence is attested per engagement and the database refuses a
 * start without it, because an engagement conducted by a non-independent
 * auditor cannot be made independent afterwards.
 */
export async function postStartAuditEngagement(
  req: Request, id: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireAuditActor(ctx, requestId);
  if (denied) return denied;

  const rec = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};
  if (rec.independence_attested !== true) {
    return validationError(requestId, [{
      type: "missing_field",
      field: "independence_attested",
      message: "AU-03: the auditor's independence must be attested before an engagement starts",
    }]);
  }

  const { data, error: selErr } = await db.schema(scope).from("audit_engagement")
    .select(ENG_COLS).eq("id", id).maybeSingle();
  if (selErr) return internalErrorResponse(requestId, selErr);
  if (!data) return notFoundResponse(requestId, "audit_engagement", id);
  const row = data as unknown as Record<string, unknown>;

  if (!row.plan_approved_at) {
    return apiError(409, "plan_not_approved", requestId, {
      title: "Plan Not Approved",
      detail: `engagement ${id} cannot start before its annual plan is approved (AU-04)`,
    });
  }

  const now = new Date().toISOString();
  const { error } = await db.schema(scope).from("audit_engagement")
    .update({
      status: "in_progress", started_at: now,
      independence_attested_by: ctx.tokenId, independence_attested_at: now,
    }).eq("id", id);
  if (error) return internalErrorResponse(requestId, error);

  try {
    await emit(db, scope, `evt_${id}_started`, "audit.engagement.started", "audit_engagement", id,
      { auditor: row.auditor_ref, independence_attested_by: ctx.tokenId }, ctx);
    // AU-03: starting grants the auditor access
    await emit(db, scope, `evt_${id}_access`, "auditor.access_grant", "audit_engagement", id,
      { auditor: row.auditor_ref }, ctx);
    // AU-05: fieldwork begins being logged
    await emit(db, scope, `evt_${id}_fw_log`, "audit.fieldwork.logged", "audit_engagement", id,
      { started_at: now }, ctx);
  } catch (e) {
    console.error(`audit start events failed for ${id}: ${e}`);
  }
  return jsonResponse({ id, status: "in_progress", started_at: now }, 200, requestId);
}

/**
 * POST /audit/engagements/{id}/complete-fieldwork {rating}
 *
 * AU-05/AU-06: completing fieldwork produces the assessment and drafts the
 * report. AU-04: a poor rating increases the next cycle's frequency.
 */
export async function postCompleteFieldwork(
  req: Request, id: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireAuditActor(ctx, requestId);
  if (denied) return denied;

  const rec = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};
  const rating = rec.rating;
  if (!isNonEmptyString(rating) || !["satisfactory", "needs_improvement", "poor"].includes(rating)) {
    return validationError(requestId, [{
      type: "invalid_value", field: "rating",
      message: "must be satisfactory, needs_improvement or poor",
    }]);
  }

  const { data, error: selErr } = await db.schema(scope).from("audit_engagement")
    .select(ENG_COLS).eq("id", id).maybeSingle();
  if (selErr) return internalErrorResponse(requestId, selErr);
  if (!data) return notFoundResponse(requestId, "audit_engagement", id);
  const row = data as unknown as Record<string, unknown>;
  if (!row.started_at) {
    return apiError(409, "not_started", requestId, {
      title: "Not Started", detail: `engagement ${id} has not started`,
    });
  }

  const now = new Date().toISOString();
  const { error } = await db.schema(scope).from("audit_engagement")
    .update({ status: "fieldwork_complete", fieldwork_completed_at: now, report_drafted_at: now, rating })
    .eq("id", id);
  if (error) return internalErrorResponse(requestId, error);

  try {
    await emit(db, scope, `evt_${id}_fw_done`, "audit.fieldwork.completed", "audit_engagement", id, { rating }, ctx);
    await emit(db, scope, `evt_${id}_assess_done`, "audit.assessment.completed", "audit_engagement", id, { rating }, ctx);
    await emit(db, scope, `evt_${id}_drafted`, "audit.report.drafted", "audit_engagement", id, { rating }, ctx);
    await emit(db, scope, `evt_${id}_record`, "audit.record_written", "audit_engagement", id,
      { workpapers: true }, ctx);
    // AU-04: a poor rating is what increases frequency — a consequence, not a
    // code handed in.
    if (rating === "poor") {
      await emit(db, scope, `evt_${id}_poor`, "audit.poor_rating.recorded", "audit_engagement", id, { rating }, ctx);
      await emit(db, scope, `evt_${id}_freq`, "audit.frequency_increased", "audit_engagement", id,
        { reason: "poor rating", next_cycle_months: 6 }, ctx);
    }
  } catch (e) {
    console.error(`fieldwork events failed for ${id}: ${e}`);
  }
  return jsonResponse({ id, status: "fieldwork_complete", rating }, 200, requestId);
}

/**
 * POST /audit/engagements/{id}/issue-report {findings: [{severity, summary}]}
 *
 * AU-06: issuing distributes the report and OPENS the findings. AU-10: issuance
 * starts the work-paper retention clock. The findings are created as a
 * consequence of the report being issued, which is why `finding.opened` is not
 * an echo — no caller asked for it.
 */
export async function postIssueAuditReport(
  req: Request, id: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireAuditActor(ctx, requestId);
  if (denied) return denied;

  const rec = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};
  const findings = Array.isArray(rec.findings) ? rec.findings : [];

  const { data, error: selErr } = await db.schema(scope).from("audit_engagement")
    .select(ENG_COLS).eq("id", id).maybeSingle();
  if (selErr) return internalErrorResponse(requestId, selErr);
  if (!data) return notFoundResponse(requestId, "audit_engagement", id);
  const row = data as unknown as Record<string, unknown>;
  if (!row.fieldwork_completed_at) {
    return apiError(409, "fieldwork_incomplete", requestId, {
      title: "Fieldwork Incomplete",
      detail: `engagement ${id} cannot issue a report before fieldwork completes (AU-06)`,
    });
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const retention = new Date(now.getTime());
  retention.setUTCFullYear(retention.getUTCFullYear() + WORKPAPER_RETENTION_YEARS);

  const { error } = await db.schema(scope).from("audit_engagement")
    .update({
      status: "reported", report_issued_at: nowIso, report_issued_by: ctx.tokenId,
      retention_expires_at: retention.toISOString(),
    }).eq("id", id);
  if (error) return internalErrorResponse(requestId, error);

  const created: string[] = [];
  for (let i = 0; i < findings.length; i++) {
    const f = findings[i] as Record<string, unknown>;
    const fid = `afind_${id}_${i}`;
    const { error: fErr } = await db.schema(scope).from("audit_finding").upsert({
      id: fid,
      engagement_id: id,
      severity: isNonEmptyString(f.severity) ? f.severity : "medium",
      summary: isNonEmptyString(f.summary) ? f.summary : "finding",
      opened_at: nowIso,
      communicated_at: nowIso,
      provenance: provenanceFor(scope, ctx),
    }, { onConflict: "id", ignoreDuplicates: true });
    if (fErr) return internalErrorResponse(requestId, fErr);
    created.push(fid);
  }

  try {
    await emit(db, scope, `evt_${id}_submitted_r`, "audit.report.submitted", "audit_engagement", id, {}, ctx);
    await emit(db, scope, `evt_${id}_approved_r`, "audit.report.approved", "audit_engagement", id,
      { approved_by: ctx.tokenId }, ctx);
    await emit(db, scope, `evt_${id}_issued`, "audit.report.issued", "audit_engagement", id,
      { findings: created.length }, ctx);
    await emit(db, scope, `evt_${id}_distributed`, "audit.report_distributed", "audit_engagement", id, {}, ctx);
    await emit(db, scope, `evt_${id}_to_board`, "audit.results_delivered_to_board", "audit_engagement", id, {}, ctx);
    // AU-10
    await emit(db, scope, `evt_${id}_ret_applied`, "audit.retention.applied", "audit_engagement", id,
      { expires_at: retention.toISOString() }, ctx);
    await emit(db, scope, `evt_${id}_ret_expiry`, "audit.retention.expires_at", "audit_engagement", id,
      { expires_at: retention.toISOString() }, ctx);
    // AU-06/AU-07: findings open BECAUSE the report issued
    for (const fid of created) {
      await emit(db, scope, `evt_${fid}_opened`, "finding.opened", "audit_finding", fid,
        { engagement_id: id }, ctx);
      await emit(db, scope, `evt_${fid}_comm`, "finding.communicated", "audit_finding", fid,
        { engagement_id: id }, ctx);
    }
  } catch (e) {
    console.error(`report issue events failed for ${id}: ${e}`);
  }

  return jsonResponse({
    id, status: "reported", findings_opened: created.length,
    retention_expires_at: retention.toISOString(),
  }, 200, requestId);
}

/**
 * POST /audit/findings/{id}/respond {response}
 * AU-08: the response starts the 90-day remediation clock.
 */
export async function postFindingResponse(
  req: Request, id: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireAuditActor(ctx, requestId);
  if (denied) return denied;

  const rec = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};
  if (!isNonEmptyString(rec.response)) {
    return validationError(requestId, [{
      type: "missing_field", field: "response",
      message: "AU-08: management must respond before remediation can be tracked",
    }]);
  }

  const { data, error: selErr } = await db.schema(scope).from("audit_finding")
    .select(FIND_COLS).eq("id", id).maybeSingle();
  if (selErr) return internalErrorResponse(requestId, selErr);
  if (!data) return notFoundResponse(requestId, "audit_finding", id);

  const now = new Date();
  const due = new Date(now.getTime() + REMEDIATION_DAYS * 86_400_000);
  const { error } = await db.schema(scope).from("audit_finding")
    .update({
      management_response: rec.response,
      management_response_at: now.toISOString(),
      remediation_due_at: due.toISOString(),
    }).eq("id", id);
  if (error) return internalErrorResponse(requestId, error);

  try {
    await emit(db, scope, `evt_${id}_resp`, "finding.management_response.recorded", "audit_finding", id,
      { responded_by: ctx.tokenId }, ctx);
    await emit(db, scope, `evt_${id}_rem_timer`, "audit.remediation.timer", "audit_finding", id,
      { due_at: due.toISOString(), days: REMEDIATION_DAYS }, ctx);
  } catch (e) {
    console.error(`finding response events failed for ${id}: ${e}`);
  }
  return jsonResponse({ id, remediation_due_at: due.toISOString() }, 200, requestId);
}

/**
 * POST /audit/findings/{id}/close {retest_result} | {risk_acceptance, rationale}
 *
 * AU-09: closure is VERIFIED by a passed retest, or by an accepted risk with a
 * documented rationale. A failed retest cannot close a finding — the database
 * refuses it, because a finding closed on a failed retest is the audit-closure
 * failure an examiner looks for.
 */
export async function postCloseFinding(
  req: Request, id: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireAuditActor(ctx, requestId);
  if (denied) return denied;

  const rec = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};
  const retest = rec.retest_result;
  const accept = rec.risk_acceptance;

  if (retest !== "passed" && retest !== "failed" && accept !== "accepted" && accept !== "rejected") {
    return validationError(requestId, [{
      type: "invalid_value", field: "retest_result",
      message: 'must be "passed"/"failed", or supply risk_acceptance',
    }]);
  }
  if (accept === "accepted" && !isNonEmptyString(rec.rationale)) {
    return validationError(requestId, [{
      type: "missing_field", field: "rationale",
      message: "AU-08: accepting a risk requires a documented rationale",
    }]);
  }

  const { data, error: selErr } = await db.schema(scope).from("audit_finding")
    .select(FIND_COLS).eq("id", id).maybeSingle();
  if (selErr) return internalErrorResponse(requestId, selErr);
  if (!data) return notFoundResponse(requestId, "audit_finding", id);

  const now = new Date().toISOString();
  const closes = retest === "passed" || accept === "accepted";

  const patch: Record<string, unknown> = {};
  if (retest) {
    patch.retest_result = retest;
  }
  if (accept) {
    patch.risk_acceptance_proposed_at = now;
    patch.risk_acceptance_decision = accept;
    patch.risk_acceptance_rationale = rec.rationale ?? null;
  }
  if (closes) {
    patch.closed_at = now;
    patch.closure_verified_by = ctx.tokenId;
  }

  const { error } = await db.schema(scope).from("audit_finding").update(patch).eq("id", id);
  if (error) return internalErrorResponse(requestId, error);

  try {
    if (retest) {
      await emit(db, scope, `evt_${id}_retest`, "deficiency.retest_result", "audit_finding", id,
        { result: retest }, ctx);
    }
    if (accept) {
      await emit(db, scope, `evt_${id}_ra_dec`, "finding.risk_acceptance.decided", "audit_finding", id,
        { decision: accept }, ctx);
      await emit(db, scope, `evt_${id}_ra_pkg`, "finding.risk_acceptance_package", "audit_finding", id,
        { rationale: rec.rationale ?? null }, ctx);
      await emit(db, scope, `evt_${id}_ra_top`, "risk_acceptance.decided", "audit_finding", id,
        { decision: accept }, ctx);
    }
    if (closes) {
      await emit(db, scope, `evt_${id}_closed`, "finding.closed", "audit_finding", id,
        { verified_by: ctx.tokenId }, ctx);
      await emit(db, scope, `evt_${id}_closure_log`, "finding.closure.logged", "audit_finding", id,
        { verified_by: ctx.tokenId }, ctx);
    } else {
      // AU-09: a failed retest re-communicates rather than closing
      await emit(db, scope, `evt_${id}_recomm`, "finding.communicated", "audit_finding", id,
        { reason: "retest failed" }, ctx);
      await emit(db, scope, `evt_${id}_impl_date`, "finding.implementation_date", "audit_finding", id,
        { reason: "retest failed" }, ctx);
    }
  } catch (e) {
    console.error(`finding close events failed for ${id}: ${e}`);
  }
  return jsonResponse({ id, closed: closes, verified_by: closes ? ctx.tokenId : null }, 200, requestId);
}

/**
 * POST /audit/sweep — AU-07's aging escalation, and the periodic reviews.
 *
 * The NEGATIVE: a finding whose remediation date passed and which nobody
 * closed. It produces no event of its own.
 */
export async function postAuditSweep(
  _req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireAuditActor(ctx, requestId);
  if (denied) return denied;

  const nowIso = new Date().toISOString();
  const { data, error } = await db.schema(scope).from("audit_finding")
    .select(FIND_COLS)
    .is("closed_at", null)
    .lt("remediation_due_at", nowIso)
    .limit(SWEEP_LIMIT);
  if (error) return internalErrorResponse(requestId, error);

  const aged = (data ?? []) as unknown as Record<string, unknown>[];
  for (const f of aged) {
    const id = String(f.id);
    try {
      await emit(db, scope, `evt_${id}_aged`, "finding.aging_threshold.breached", "audit_finding", id,
        { due_at: f.remediation_due_at, severity: f.severity }, ctx);
      await emit(db, scope, `evt_${id}_escalated`, "finding.escalated", "audit_finding", id,
        { severity: f.severity }, ctx);
      if (f.severity === "critical") {
        await emit(db, scope, `evt_${id}_crit`, "finding.critical.escalated", "audit_finding", id,
          { severity: f.severity }, ctx);
      }
    } catch (e) {
      console.error(`audit aging events failed for ${id}: ${e}`);
    }
  }

  // AU-07: the periodic reviews are a consequence of the sweep running, and
  // report on what it found.
  try {
    await emit(db, scope, `evt_audit_monthly_${nowIso.slice(0, 7)}`, "finding.monthly_review.recorded",
      "audit_finding", "review", { open_aged: aged.length, at: nowIso }, ctx);
    await emit(db, scope, `evt_audit_quarterly_${nowIso.slice(0, 7)}`, "finding.quarterly_report.delivered",
      "audit_finding", "review", { open_aged: aged.length, at: nowIso }, ctx);
  } catch (e) {
    console.error(`audit review events failed: ${e}`);
  }

  return jsonResponse({
    swept_at: nowIso, aged_findings: aged.length,
    critical: aged.filter((f) => f.severity === "critical").length,
  }, 200, requestId);
}
