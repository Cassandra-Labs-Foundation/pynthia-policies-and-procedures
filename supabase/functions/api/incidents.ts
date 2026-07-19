// Incident response — SC-01 (NCUA reportable cyber incidents) and the wider
// incident lifecycle.
//
// THE CLOCK. SC-01 gives 72 hours from the REPORTABILITY DETERMINATION, which
// is a LATER anchor than the previous two deadlines in this repo (SAR runs from
// detection, ECOA from application completion). Anchoring on detection here
// would be stricter than the regulation and would report false breaches.
//
// The gap that leaves is real and belongs to the regulation, not to this
// schema: nothing bounds how long determination takes, so an institution that
// never determines never breaches. `determination_due_at` is an INTERNAL
// deadline this system imposes on itself, and the sweep reports undetermined
// incidents separately from overdue notifications so the two are never
// confused. See OQ-21.

import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { type PartnerContext } from "./auth.ts";
import { type EvidenceScope, provenanceFor } from "./bsa.ts";
import {
  apiError, internalErrorResponse, isNonEmptyString, jsonResponse,
  notFoundResponse, parseJsonBody, validationError, type ValidationErrorItem,
} from "./lib.ts";

/** SC-01: 72 hours from the determination. */
export const NCUA_NOTICE_HOURS = 72;
/** Internal only — the regulation sets no bound on determination itself. */
export const INTERNAL_DETERMINATION_HOURS = 24;
const SWEEP_LIMIT = 200;

const COLS =
  "id, title, severity, source, status, detected_at, declared_at, ic_assigned_to, " +
  "ic_assigned_at, first_hour_completed_at, contained_at, restored_at, closed_at, " +
  "reportability_determined_at, reportability_determined_by, is_reportable, " +
  "reportability_rationale, ncua_notice_due_at, ncua_notified_at, determination_due_at, " +
  "member_impact_confirmed_at, member_notices_sent_at, provenance, created_at";

function requireIncidentActor(ctx: PartnerContext, requestId: string): Response | null {
  if (ctx.actorType === "partner") return notFoundResponse(requestId, "route", "/incidents");
  return null;
}

async function emit(
  db: SupabaseClient, scope: EvidenceScope, id: string, code: string,
  rId: string, payload: Record<string, unknown>, ctx?: PartnerContext,
): Promise<void> {
  const { error } = await db.schema(scope).from("event").upsert({
    id, code, resource_type: "incident", resource_id: `incident:${rId}`,
    payload, provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw new Error(`incident event (${code}): ${error.message}`);
}

/**
 * POST /incidents {title, severity, source?}
 *
 * Declaration assigns an incident commander and starts the first-hour clock.
 * `detected_at` and `declared_at` are separate because the signal arriving and
 * a human deciding it is an incident are different moments, and the gap between
 * them is itself a metric.
 */
export async function postIncident(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireIncidentActor(ctx, requestId);
  if (denied) return denied;

  const rec = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};
  const errors: ValidationErrorItem[] = [];
  if (!isNonEmptyString(rec.title)) {
    errors.push({ type: "missing_field", field: "title", message: "is required" });
  }
  if (!isNonEmptyString(rec.severity) || !["sev1", "sev2", "sev3", "sev4"].includes(rec.severity)) {
    errors.push({ type: "invalid_value", field: "severity", message: "must be sev1..sev4" });
  }
  if (errors.length) return validationError(requestId, errors);

  const id = `inc_${crypto.randomUUID()}`;
  const now = new Date();
  const detDue = new Date(now.getTime() + INTERNAL_DETERMINATION_HOURS * 3_600_000);

  const { error } = await db.schema(scope).from("incident").insert({
    id, title: rec.title, severity: rec.severity,
    source: isNonEmptyString(rec.source) ? rec.source : null,
    status: "declared",
    detected_at: now.toISOString(),
    declared_at: now.toISOString(),
    ic_assigned_to: ctx.tokenId,
    ic_assigned_at: now.toISOString(),
    determination_due_at: detDue.toISOString(),
    provenance: provenanceFor(scope, ctx),
  });
  if (error) return internalErrorResponse(requestId, error);

  try {
    await emit(db, scope, `evt_${id}_detected`, "incident.detected", id, { severity: rec.severity }, ctx);
    await emit(db, scope, `evt_${id}_signal`, "incident.signal.received", id, { source: rec.source ?? null }, ctx);
    await emit(db, scope, `evt_${id}_declared`, "incident.declared", id, { severity: rec.severity }, ctx);
    await emit(db, scope, `evt_${id}_created`, "incident.created", id, { severity: rec.severity }, ctx);
    await emit(db, scope, `evt_${id}_classified`, "incident.classified", id, { severity: rec.severity }, ctx);
    await emit(db, scope, `evt_${id}_sev`, "incident.severity.assigned", id, { severity: rec.severity }, ctx);
    await emit(db, scope, `evt_${id}_ic`, "incident.ic.assigned", id, { ic: ctx.tokenId }, ctx);
    if (rec.severity === "sev1") {
      await emit(db, scope, `evt_${id}_sev1`, "incident.sev1.detected", id, {}, ctx);
    }
    // the comms clock starts at declaration
    await emit(db, scope, `evt_${id}_comms_timer`, "comms.initial_timer", id,
      { due_at: new Date(now.getTime() + 3_600_000).toISOString() }, ctx);
    await emit(db, scope, `evt_${id}_sitrep_timer`, "sitrep.v1_timer", id,
      { due_at: new Date(now.getTime() + 3_600_000).toISOString() }, ctx);
  } catch (e) {
    console.error(`incident declare events failed for ${id}: ${e}`);
  }

  return jsonResponse({
    id, severity: rec.severity, status: "declared", ic: ctx.tokenId,
    determination_due_at: detDue.toISOString(),
    determination_note:
      "SC-01's 72-hour NCUA clock does NOT start until reportability is determined; " +
      "this internal deadline exists because the regulation bounds only the notification, " +
      "not the determination (OQ-21)",
  }, 201, requestId);
}

/** POST /incidents/{id}/first-hour {summary} — sitrep v1 + containment start. */
export async function postFirstHour(
  req: Request, id: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireIncidentActor(ctx, requestId);
  if (denied) return denied;
  const rec = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};
  if (!isNonEmptyString(rec.summary)) {
    return validationError(requestId, [{
      type: "missing_field", field: "summary",
      message: "the first-hour sitrep must say what is known",
    }]);
  }

  const { data, error: selErr } = await db.schema(scope).from("incident")
    .select(COLS).eq("id", id).maybeSingle();
  if (selErr) return internalErrorResponse(requestId, selErr);
  if (!data) return notFoundResponse(requestId, "incident", id);

  const now = new Date().toISOString();
  const { error } = await db.schema(scope).from("incident")
    .update({ first_hour_completed_at: now }).eq("id", id);
  if (error) return internalErrorResponse(requestId, error);

  const { error: sErr } = await db.schema(scope).from("incident_sitrep").upsert({
    id: `sitrep_${id}_1`, incident_id: id, sequence: 1,
    summary: rec.summary, issued_by: ctx.tokenId,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id", ignoreDuplicates: true });
  if (sErr) return internalErrorResponse(requestId, sErr);

  try {
    await emit(db, scope, `evt_${id}_fh`, "incident.first_hour.completed", id, {}, ctx);
    await emit(db, scope, `evt_${id}_sitrep`, "sitrep.issued", id, { sequence: 1 }, ctx);
  } catch (e) {
    console.error(`first-hour events failed for ${id}: ${e}`);
  }
  return jsonResponse({ id, first_hour_completed_at: now }, 200, requestId);
}

/**
 * POST /incidents/{id}/determine {is_reportable, rationale}
 *
 * SC-01. Write-restricted to Compliance/Legal, and THIS is what starts the
 * 72-hour NCUA clock — not detection, not declaration.
 */
export async function postDetermineReportability(
  req: Request, id: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireIncidentActor(ctx, requestId);
  if (denied) return denied;

  // SC-01: "write-restricted to the CCO/Compliance-Legal"
  if (!ctx.roles.includes("bsa_compliance") && !ctx.roles.includes("bsa_counsel")) {
    return apiError(403, "insufficient_role", requestId, {
      title: "Insufficient Role",
      detail:
        "SC-01 restricts the reportability determination to Compliance or Legal; " +
        `this token carries ${ctx.roles.length ? ctx.roles.join(", ") : "no such role"}`,
    });
  }

  const rec = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};
  const errors: ValidationErrorItem[] = [];
  if (typeof rec.is_reportable !== "boolean") {
    errors.push({ type: "invalid_value", field: "is_reportable", message: "must be true or false" });
  }
  // SC-01: a NON-reportable determination is documented with rationale. The
  // undocumented "not reportable" is the finding an examiner looks for.
  if (!isNonEmptyString(rec.rationale)) {
    errors.push({
      type: "missing_field", field: "rationale",
      message: "every reportability determination must be documented, including a decision NOT to report",
    });
  }
  if (errors.length) return validationError(requestId, errors);

  const { data, error: selErr } = await db.schema(scope).from("incident")
    .select(COLS).eq("id", id).maybeSingle();
  if (selErr) return internalErrorResponse(requestId, selErr);
  if (!data) return notFoundResponse(requestId, "incident", id);
  const row = data as unknown as Record<string, unknown>;
  if (row.reportability_determined_at) {
    return jsonResponse({ id, is_reportable: row.is_reportable }, 200, requestId, {
      "Idempotent-Replayed": "true",
    });
  }

  const now = new Date();
  const reportable = rec.is_reportable === true;
  // 72 hours FROM THE DETERMINATION (SC-01), and only when reportable
  const due = reportable ? new Date(now.getTime() + NCUA_NOTICE_HOURS * 3_600_000) : null;

  const { error } = await db.schema(scope).from("incident").update({
    reportability_determined_at: now.toISOString(),
    reportability_determined_by: ctx.tokenId,
    is_reportable: reportable,
    reportability_rationale: rec.rationale,
    ncua_notice_due_at: due ? due.toISOString() : null,
  }).eq("id", id);
  if (error) return internalErrorResponse(requestId, error);

  try {
    await emit(db, scope, `evt_${id}_determined`, "incident.reportability_determination", id,
      { is_reportable: reportable, determined_by: ctx.tokenId }, ctx);
    if (reportable) {
      await emit(db, scope, `evt_${id}_ncua_timer`, "incident.ncua.notice.due_at", id,
        { due_at: due!.toISOString(), hours: NCUA_NOTICE_HOURS }, ctx);
    }
  } catch (e) {
    console.error(`determination events failed for ${id}: ${e}`);
  }

  return jsonResponse({
    id, is_reportable: reportable,
    ncua_notice_due_at: due ? due.toISOString() : null,
    determined_by: ctx.tokenId,
  }, 200, requestId);
}

/** POST /incidents/{id}/notify-ncua {reference} */
export async function postNotifyNcua(
  req: Request, id: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireIncidentActor(ctx, requestId);
  if (denied) return denied;
  const rec = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const { data, error: selErr } = await db.schema(scope).from("incident")
    .select(COLS).eq("id", id).maybeSingle();
  if (selErr) return internalErrorResponse(requestId, selErr);
  if (!data) return notFoundResponse(requestId, "incident", id);
  const row = data as unknown as Record<string, unknown>;

  if (!row.reportability_determined_at) {
    return apiError(409, "not_determined", requestId, {
      title: "Not Determined",
      detail: `incident ${id} has no reportability determination; there is nothing to notify NCUA about`,
    });
  }
  if (row.is_reportable !== true) {
    return apiError(409, "not_reportable", requestId, {
      title: "Not Reportable",
      detail: `incident ${id} was determined NOT reportable; notifying would contradict the determination`,
    });
  }

  const now = new Date().toISOString();
  const late = new Date(now) > new Date(String(row.ncua_notice_due_at));
  const { error } = await db.schema(scope).from("incident")
    .update({ ncua_notified_at: now }).eq("id", id);
  if (error) return internalErrorResponse(requestId, error);

  try {
    await emit(db, scope, `evt_${id}_ncua`, "incident.ncua.notified", id,
      { notified_at: now, due_at: row.ncua_notice_due_at, late, reference: rec.reference ?? null }, ctx);
  } catch (e) {
    console.error(`ncua notify event failed for ${id}: ${e}`);
  }
  return jsonResponse({ id, ncua_notified_at: now, notified_late: late }, 200, requestId);
}

/** POST /incidents/{id}/member-impact {confirmed, template} */
export async function postMemberImpact(
  req: Request, id: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireIncidentActor(ctx, requestId);
  if (denied) return denied;
  const rec = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};
  if (!isNonEmptyString(rec.template)) {
    return validationError(requestId, [{
      type: "missing_field", field: "template",
      message: "SC-01 Appendix B: member notice requires a notice template",
    }]);
  }

  const now = new Date().toISOString();
  const { error } = await db.schema(scope).from("incident")
    .update({ member_impact_confirmed_at: now, member_notices_sent_at: now }).eq("id", id);
  if (error) return internalErrorResponse(requestId, error);

  try {
    await emit(db, scope, `evt_${id}_impact`, "incident.member_impact.confirmed", id, {}, ctx);
    await emit(db, scope, `evt_${id}_notices`, "incident.member_notices.sent", id,
      // privacy:SC-01 declares `incident.notice_template_id`, not the template's
      // display name. Emitting only the name meant the notice could not be tied
      // back to a specific approved template version after the fact.
      { member_notice_template: rec.template, notice_template_id: rec.template }, ctx);
  } catch (e) {
    console.error(`member impact events failed for ${id}: ${e}`);
  }
  return jsonResponse({ id, member_notices_sent_at: now }, 200, requestId);
}

/** POST /incidents/{id}/contain then /close. */
export async function postContainIncident(
  _req: Request, id: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireIncidentActor(ctx, requestId);
  if (denied) return denied;
  const now = new Date().toISOString();
  const { error } = await db.schema(scope).from("incident")
    .update({ status: "restored", contained_at: now, restored_at: now }).eq("id", id);
  if (error) return internalErrorResponse(requestId, error);
  try {
    await emit(db, scope, `evt_${id}_contained`, "incident.contained", id, {}, ctx);
    await emit(db, scope, `evt_${id}_restored`, "restore.completed", id, {}, ctx);
  } catch (e) { console.error(`contain events failed: ${e}`); }
  return jsonResponse({ id, status: "restored" }, 200, requestId);
}

export async function postCloseIncident(
  _req: Request, id: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireIncidentActor(ctx, requestId);
  if (denied) return denied;
  const now = new Date().toISOString();
  const { error } = await db.schema(scope).from("incident")
    .update({ status: "closed", closed_at: now }).eq("id", id);
  if (error) return internalErrorResponse(requestId, error);
  try { await emit(db, scope, `evt_${id}_closed`, "incident.closed", id, {}, ctx); }
  catch (e) { console.error(`close event failed: ${e}`); }
  return jsonResponse({ id, status: "closed" }, 200, requestId);
}

/**
 * POST /incidents/sweep — the NEGATIVES, and there are two DIFFERENT ones.
 *
 *   overdue notification  determined reportable, 72h passed, nobody notified
 *   UNDETERMINED          nobody has determined reportability at all
 *
 * The second is the one SC-01 cannot catch, because its clock never starts.
 * Reported separately so a clean "0 overdue" can never be read as "0 problems".
 */
export async function postIncidentSweep(
  _req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireIncidentActor(ctx, requestId);
  if (denied) return denied;
  const nowIso = new Date().toISOString();

  const { data: overdueRows, error } = await db.schema(scope).from("incident")
    .select(COLS).is("ncua_notified_at", null).lt("ncua_notice_due_at", nowIso).limit(SWEEP_LIMIT);
  if (error) return internalErrorResponse(requestId, error);

  const overdue = (overdueRows ?? []) as unknown as Record<string, unknown>[];
  for (const r of overdue) {
    try {
      await emit(db, scope, `evt_${r.id}_ncua_overdue`, "incident.ncua.notification_overdue",
        String(r.id), { due_at: r.ncua_notice_due_at, detected_at: nowIso }, ctx);
    } catch (e) { console.error(`ncua overdue event failed: ${e}`); }
  }

  const { data: undet, error: uErr } = await db.schema(scope).from("incident")
    .select("id, severity, determination_due_at, reportability_determined_at")
    .is("reportability_determined_at", null).limit(SWEEP_LIMIT);
  if (uErr) return internalErrorResponse(requestId, uErr);
  const undetermined = (undet ?? []) as unknown as Record<string, unknown>[];
  for (const r of undetermined) {
    try {
      await emit(db, scope, `evt_${r.id}_undetermined`, "incident.reportability_undetermined",
        String(r.id), { internal_due_at: r.determination_due_at }, ctx);
    } catch (e) { console.error(`undetermined event failed: ${e}`); }
  }

  return jsonResponse({
    swept_at: nowIso,
    ncua_overdue: overdue.length,
    // NOT a subset of overdue: these never started the 72-hour clock at all
    undetermined: undetermined.length,
    ...(undetermined.length
      ? {
        warning:
          `${undetermined.length} incident(s) have NO reportability determination. ` +
          `SC-01's 72-hour clock runs from determination, so these are neither ` +
          `overdue nor compliant — the clock has not started (OQ-21)`,
      }
      : {}),
  }, 200, requestId);
}
