// The recurring control primitives (BLUEPRINT §5e).
//
// Set-cover over all 298 unreachable controls found seven structural shapes
// that recur regardless of which policy a control belongs to. Two were already
// built (core.obligation for cadence, core.payment_approval for four-eyes).
// This is the rest:
//
//   C  work item lifecycle + deadline   task    — review, remediation, engagement
//   D  request -> decision register     request — exception, limit change, waiver
//   F  notice issuance + deadline       notice  — adverse action, member notice, filing
//   E  inbound correspondence           inbound — regulator request, SOC report, subpoena
//   G  threshold with an owner          core.threshold + observations
//   J  attestation / register update    core.attestation (append-only)
//
// C/D/F/E share one table because they share one skeleton — something opens,
// has a deadline, and closes with an outcome. The differences that matter are
// CHECK constraints per kind, not separate schemas. Four tables would mean four
// overdue sweeps that drift apart.
//
// THESE MOVE NO COVERAGE NUMBER ON THEIR OWN. A primitive is a capability, and
// per §5c a capability nobody has exercised is not an emission. They count when
// a domain puts real rows in them.

import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { type PartnerContext } from "./auth.ts";
import { type EvidenceScope, provenanceFor } from "./bsa.ts";
import {
  internalErrorResponse,
  isNonEmptyString,
  jsonResponse,
  notFoundResponse,
  parseJsonBody,
  validationError,
  type ValidationErrorItem,
} from "./lib.ts";

export const WORK_KINDS = ["task", "request", "notice", "inbound"] as const;
export type WorkKind = typeof WORK_KINDS[number];

/** Outcomes that require a documented reason wherever they appear. */
const ADVERSE_OUTCOMES = new Set(["denied", "rejected", "no_action"]);

const SWEEP_LIMIT = 200;

const WORK_COLS =
  "id, control_uid, kind, subject_ref, title, assigned_to, status, opened_at, " +
  "opened_by, due_at, closed_at, closed_by, outcome, outcome_rationale, " +
  "source_ref, received_at, provenance, created_at";

function requireStaff(ctx: PartnerContext, requestId: string, area: string): Response | null {
  if (ctx.actorType === "partner") return notFoundResponse(requestId, "route", `/${area}`);
  return null;
}

/** Control uids are policy-qualified; a bare id is ambiguous (OQ-11). */
function uidError(uid: unknown): ValidationErrorItem | null {
  if (!isNonEmptyString(uid)) {
    return { type: "missing_field", field: "control_uid", message: "is required" };
  }
  if (!uid.includes(":")) {
    return {
      type: "invalid_value",
      field: "control_uid",
      message:
        "must be the policy-qualified uid (e.g. 'audit:AU-03'); a bare control_id " +
        "is ambiguous because ids are not unique across policies",
    };
  }
  return null;
}

async function emitPrimitiveEvent(
  db: SupabaseClient,
  scope: EvidenceScope,
  id: string,
  code: string,
  resourceType: string,
  resourceId: string,
  payload: Record<string, unknown>,
  ctx?: PartnerContext,
): Promise<void> {
  const { error } = await db.schema(scope).from("event").upsert({
    id,
    code,
    resource_type: resourceType,
    resource_id: `${resourceType}:${resourceId}`,
    payload,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw new Error(`primitive event (${code}): ${error.message}`);
}

// ------------------------------------------------------------ C / D / F / E

/**
 * POST /primitives/work-items
 * {control_uid, kind, title, due_at?, subject_ref?, source_ref?, received_at?}
 *
 * `due_at` is optional because not every work item carries a regulatory
 * deadline — but an item without one can never be overdue, so the sweep counts
 * those separately rather than letting them read as current.
 */
export async function postWorkItem(
  req: Request,
  db: SupabaseClient,
  requestId: string,
  ctx: PartnerContext,
  scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireStaff(ctx, requestId, "primitives");
  if (denied) return denied;

  const body = await parseJsonBody(req).catch(() => null);
  const rec = body && typeof body === "object" ? body as Record<string, unknown> : {};

  const errors: ValidationErrorItem[] = [];
  const ue = uidError(rec.control_uid);
  if (ue) errors.push(ue);
  if (!WORK_KINDS.includes(rec.kind as WorkKind)) {
    errors.push({
      type: "invalid_value",
      field: "kind",
      message: `must be one of: ${WORK_KINDS.join(", ")}`,
    });
  }
  if (!isNonEmptyString(rec.title)) {
    errors.push({ type: "missing_field", field: "title", message: "is required" });
  }
  // E: correspondence that does not say where it came from cannot be responded
  // to, and cannot be evidenced later.
  if (rec.kind === "inbound") {
    if (!isNonEmptyString(rec.source_ref)) {
      errors.push({
        type: "missing_field",
        field: "source_ref",
        message: "inbound correspondence must record who it came from",
      });
    }
    if (!isNonEmptyString(rec.received_at)) {
      errors.push({
        type: "missing_field",
        field: "received_at",
        // the response clock runs from RECEIPT, and correspondence is often
        // logged days later
        message: "inbound correspondence must record when it ARRIVED, not when it was logged",
      });
    }
  }
  if (errors.length) return validationError(requestId, errors);

  const id = `wi_${crypto.randomUUID()}`;
  const { error } = await db.schema(scope).from("work_item").insert({
    id,
    control_uid: rec.control_uid,
    kind: rec.kind,
    subject_ref: isNonEmptyString(rec.subject_ref) ? rec.subject_ref : null,
    title: rec.title,
    assigned_to: isNonEmptyString(rec.assigned_to) ? rec.assigned_to : null,
    status: "open",
    opened_by: ctx.tokenId,
    due_at: isNonEmptyString(rec.due_at) ? rec.due_at : null,
    source_ref: isNonEmptyString(rec.source_ref) ? rec.source_ref : null,
    received_at: isNonEmptyString(rec.received_at) ? rec.received_at : null,
    provenance: provenanceFor(scope, ctx),
  });
  if (error) return internalErrorResponse(requestId, error);

  try {
    await emitPrimitiveEvent(
      db, scope, `evt_${id}_opened`, `${rec.kind}.opened`, "work_item", id,
      { control_uid: rec.control_uid, kind: rec.kind, due_at: rec.due_at ?? null },
      ctx,
    );
  } catch (e) {
    console.error(`work_item.opened event failed for ${id}: ${e}`);
  }

  return jsonResponse({
    id,
    control_uid: rec.control_uid,
    kind: rec.kind,
    status: "open",
    due_at: rec.due_at ?? null,
    // stated rather than left to a null
    deadlined: isNonEmptyString(rec.due_at),
    ...(isNonEmptyString(rec.due_at) ? {} : {
      warning:
        "opened with NO deadline: this item can never become overdue and will " +
        "not appear in the overdue sweep",
    }),
  }, 201, requestId);
}

/**
 * POST /primitives/work-items/{id}/close {outcome, rationale?}
 *
 * One close path for all four kinds. A `request` must say what was decided, and
 * an adverse outcome must say why — the same rule as a SAR no-file decision and
 * an ACH return code, enforced here so the next kind inherits it.
 */
export async function postWorkItemClose(
  req: Request,
  itemId: string,
  db: SupabaseClient,
  requestId: string,
  ctx: PartnerContext,
  scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireStaff(ctx, requestId, "primitives");
  if (denied) return denied;

  const body = await parseJsonBody(req).catch(() => null);
  const rec = body && typeof body === "object" ? body as Record<string, unknown> : {};

  const { data, error: selErr } = await db.schema(scope).from("work_item")
    .select(WORK_COLS).eq("id", itemId).maybeSingle();
  if (selErr) return internalErrorResponse(requestId, selErr);
  if (!data) return notFoundResponse(requestId, "work_item", itemId);

  const row = data as unknown as Record<string, unknown>;
  if (row.closed_at) {
    return jsonResponse({ id: itemId, status: row.status, outcome: row.outcome }, 200, requestId, {
      "Idempotent-Replayed": "true",
    });
  }

  const errors: ValidationErrorItem[] = [];
  if (row.kind === "request" && !isNonEmptyString(rec.outcome)) {
    errors.push({
      type: "missing_field",
      field: "outcome",
      message: "a request must record what was decided; a closed request with no outcome is the decision nobody wrote down",
    });
  }
  if (isNonEmptyString(rec.outcome) && ADVERSE_OUTCOMES.has(rec.outcome) && !isNonEmptyString(rec.rationale)) {
    errors.push({
      type: "missing_field",
      field: "rationale",
      message: `an outcome of '${rec.outcome}' requires a documented reason`,
    });
  }
  if (errors.length) return validationError(requestId, errors);

  const nowIso = new Date().toISOString();
  const late = row.due_at ? new Date(nowIso) > new Date(String(row.due_at)) : false;
  const status = rec.cancelled === true ? "cancelled" : "completed";

  const { error: updErr } = await db.schema(scope).from("work_item")
    .update({
      status,
      closed_at: nowIso,
      closed_by: ctx.tokenId,
      outcome: isNonEmptyString(rec.outcome) ? rec.outcome : null,
      outcome_rationale: isNonEmptyString(rec.rationale) ? rec.rationale : null,
    })
    .eq("id", itemId);
  if (updErr) return internalErrorResponse(requestId, updErr);

  try {
    await emitPrimitiveEvent(
      db, scope, `evt_${itemId}_closed`, `${row.kind}.completed`, "work_item", itemId,
      {
        control_uid: row.control_uid,
        outcome: rec.outcome ?? null,
        closed_by: ctx.tokenId,
        due_at: row.due_at ?? null,
        // lateness recorded, never suppressed
        late,
      },
      ctx,
    );
  } catch (e) {
    console.error(`work_item close event failed for ${itemId}: ${e}`);
  }

  return jsonResponse({
    id: itemId,
    status,
    outcome: rec.outcome ?? null,
    closed_at: nowIso,
    closed_by: ctx.tokenId,
    closed_late: late,
  }, 200, requestId);
}

/**
 * POST /primitives/work-items/sweep — one sweep for all four kinds.
 *
 * Reports two absences separately:
 *   OVERDUE      had a deadline, passed it, still open
 *   UNDEADLINED  never had a deadline, so can never be overdue
 *
 * The second is the quieter failure: an item with no due date sits in the queue
 * looking exactly like one that is not yet due.
 */
export async function postWorkItemSweep(
  _req: Request,
  db: SupabaseClient,
  requestId: string,
  ctx: PartnerContext,
  scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireStaff(ctx, requestId, "primitives");
  if (denied) return denied;

  const nowIso = new Date().toISOString();
  const overdue: { id: string; kind: string; due_at: string }[] = [];

  const { data, error } = await db.schema(scope).from("work_item")
    .select(WORK_COLS)
    .in("status", ["open", "in_progress"])
    .lt("due_at", nowIso)
    .order("due_at", { ascending: true })
    .limit(SWEEP_LIMIT);
  if (error) return internalErrorResponse(requestId, error);

  for (const r of (data ?? []) as unknown as Record<string, unknown>[]) {
    const id = String(r.id);
    try {
      await emitPrimitiveEvent(
        db, scope, `evt_${id}_overdue`, `${r.kind}.overdue`, "work_item", id,
        { control_uid: r.control_uid, due_at: r.due_at, detected_at: nowIso },
        ctx,
      );
      overdue.push({ id, kind: String(r.kind), due_at: String(r.due_at) });
    } catch (e) {
      console.error(`work item overdue event failed for ${id}: ${e}`);
    }
  }

  const { data: undead, error: uErr } = await db.schema(scope).from("work_item")
    .select("id, kind, control_uid")
    .in("status", ["open", "in_progress"])
    .is("due_at", null)
    .limit(SWEEP_LIMIT);
  if (uErr) return internalErrorResponse(requestId, uErr);
  const undeadlined = (undead ?? []) as unknown as Record<string, unknown>[];

  return jsonResponse({
    swept_at: nowIso,
    overdue,
    overdue_count: overdue.length,
    undeadlined: undeadlined.map((u) => ({ id: u.id, kind: u.kind, control_uid: u.control_uid })),
    undeadlined_count: undeadlined.length,
    ...(undeadlined.length
      ? {
        warning:
          `${undeadlined.length} open item(s) have no deadline and can never be ` +
          `overdue; they are NOT current, nobody set a date`,
      }
      : {}),
    truncated: ((data ?? []) as unknown[]).length >= SWEEP_LIMIT,
  }, 200, requestId);
}

// ==================================================================== G

/** Assess a value against a limit. An unconfigured limit is UNASSESSED. */
export function assess(
  value: number,
  limit: number | null | undefined,
  warn: number | null | undefined,
  direction: "above" | "below" = "above",
): "within" | "warn" | "breach" | "unassessed" {
  // Null is not zero. Zero is a policy meaning "any amount breaches"; null
  // means nobody has set one, and treating them the same either fabricates a
  // policy or silently exempts the subject.
  if (limit === null || limit === undefined) return "unassessed";
  const breached = direction === "above" ? value > limit : value < limit;
  if (breached) return "breach";
  if (warn !== null && warn !== undefined) {
    const warned = direction === "above" ? value >= warn : value <= warn;
    if (warned) return "warn";
  }
  return "within";
}

/** PUT /primitives/thresholds/{id} — set the policy value. */
export async function putThreshold(
  req: Request,
  thresholdId: string,
  db: SupabaseClient,
  requestId: string,
  ctx: PartnerContext,
  scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireStaff(ctx, requestId, "primitives");
  if (denied) return denied;

  const body = await parseJsonBody(req).catch(() => null);
  const rec = body && typeof body === "object" ? body as Record<string, unknown> : {};

  const errors: ValidationErrorItem[] = [];
  const ue = uidError(rec.control_uid);
  if (ue) errors.push(ue);
  for (const f of ["metric", "subject_scope"]) {
    if (!isNonEmptyString(rec[f])) {
      errors.push({ type: "missing_field", field: f, message: "is required" });
    }
  }
  const dir = rec.direction ?? "above";
  if (dir !== "above" && dir !== "below") {
    errors.push({ type: "invalid_value", field: "direction", message: 'must be "above" or "below"' });
  }
  const lim = rec.limit_value, warn = rec.warn_value;
  if (lim !== undefined && lim !== null && typeof lim !== "number") {
    errors.push({ type: "invalid_value", field: "limit_value", message: "must be a number, or null to leave unconfigured" });
  }
  // A warn level on the wrong side of the limit fires after the breach.
  if (typeof lim === "number" && typeof warn === "number") {
    const ok = dir === "above" ? warn <= lim : warn >= lim;
    if (!ok) {
      errors.push({
        type: "invalid_value",
        field: "warn_value",
        message: `must be ${dir === "above" ? "at or below" : "at or above"} limit_value, or the warning fires after the breach`,
      });
    }
  }
  if (errors.length) return validationError(requestId, errors);

  const nowIso = new Date().toISOString();
  const { error } = await db.schema(scope).from("threshold").upsert({
    id: thresholdId,
    control_uid: rec.control_uid,
    metric: rec.metric,
    subject_scope: rec.subject_scope,
    limit_value: lim ?? null,
    warn_value: warn ?? null,
    direction: dir,
    owner_role: isNonEmptyString(rec.owner_role) ? rec.owner_role : null,
    set_by: ctx.tokenId,
    set_at: nowIso,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error);

  return jsonResponse({
    id: thresholdId,
    control_uid: rec.control_uid,
    metric: rec.metric,
    limit_value: lim ?? null,
    warn_value: warn ?? null,
    direction: dir,
    configured: lim !== undefined && lim !== null,
    ...(lim === undefined || lim === null
      ? {
        warning:
          "registered with NO limit: observations against this threshold will be " +
          "recorded as UNASSESSED, neither within nor breaching",
      }
      : {}),
  }, 200, requestId);
}

/** POST /primitives/thresholds/{id}/observe {value} */
export async function postObservation(
  req: Request,
  thresholdId: string,
  db: SupabaseClient,
  requestId: string,
  ctx: PartnerContext,
  scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireStaff(ctx, requestId, "primitives");
  if (denied) return denied;

  const body = await parseJsonBody(req).catch(() => null);
  const rec = body && typeof body === "object" ? body as Record<string, unknown> : {};
  if (typeof rec.value !== "number") {
    return validationError(requestId, [{
      type: "invalid_value", field: "value", message: "must be a number",
    }]);
  }

  const { data, error: selErr } = await db.schema(scope).from("threshold")
    .select("id, control_uid, metric, limit_value, warn_value, direction")
    .eq("id", thresholdId).maybeSingle();
  if (selErr) return internalErrorResponse(requestId, selErr);
  if (!data) return notFoundResponse(requestId, "threshold", thresholdId);

  const t = data as unknown as Record<string, unknown>;
  const verdict = assess(
    rec.value,
    t.limit_value as number | null,
    t.warn_value as number | null,
    (t.direction as "above" | "below") ?? "above",
  );

  const obsId = `obs_${thresholdId}_${Date.now()}`;
  const { error } = await db.schema(scope).from("threshold_observation").insert({
    id: obsId,
    threshold_id: thresholdId,
    observed_value: rec.value,
    assessment: verdict,
    provenance: provenanceFor(scope, ctx),
  });
  if (error) return internalErrorResponse(requestId, error);

  if (verdict === "breach" || verdict === "warn") {
    try {
      await emitPrimitiveEvent(
        db, scope, `evt_${obsId}_${verdict}`,
        verdict === "breach" ? "threshold.breached" : "threshold.warning",
        "threshold", thresholdId,
        { control_uid: t.control_uid, metric: t.metric, value: rec.value, limit: t.limit_value },
        ctx,
      );
    } catch (e) {
      console.error(`threshold event failed for ${obsId}: ${e}`);
    }
  }


  return jsonResponse({
    id: obsId,
    threshold_id: thresholdId,
    value: rec.value,
    assessment: verdict,
    ...(verdict === "unassessed"
      ? {
        warning:
          "recorded but UNASSESSED: this threshold has no configured limit, so " +
          "no breach determination could be made",
      }
      : {}),
  }, 201, requestId);
}

// ==================================================================== J

/**
 * POST /primitives/attestations {control_uid, statement, period_start?, period_end?}
 *
 * Append-only. The database refuses UPDATE and DELETE, because an attestation
 * that can be revised after the fact attests to nothing.
 */
export async function postAttestation(
  req: Request,
  db: SupabaseClient,
  requestId: string,
  ctx: PartnerContext,
  scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireStaff(ctx, requestId, "primitives");
  if (denied) return denied;

  const body = await parseJsonBody(req).catch(() => null);
  const rec = body && typeof body === "object" ? body as Record<string, unknown> : {};

  const errors: ValidationErrorItem[] = [];
  const ue = uidError(rec.control_uid);
  if (ue) errors.push(ue);
  if (!isNonEmptyString(rec.statement)) {
    errors.push({
      type: "missing_field",
      field: "statement",
      message: "an attestation with no statement asserts nothing",
    });
  }
  if (isNonEmptyString(rec.period_start) && isNonEmptyString(rec.period_end)) {
    if (rec.period_start > rec.period_end) {
      errors.push({
        type: "invalid_value",
        field: "period_end",
        message: "must not precede period_start",
      });
    }
  }
  if (errors.length) return validationError(requestId, errors);

  const id = `att_${crypto.randomUUID()}`;
  const { error } = await db.schema(scope).from("attestation").insert({
    id,
    control_uid: rec.control_uid,
    subject_ref: isNonEmptyString(rec.subject_ref) ? rec.subject_ref : null,
    statement: rec.statement,
    // the ACTOR, from the authenticated context rather than the payload — an
    // attestation someone can attribute to a third party is not an attestation
    attested_by: ctx.tokenId,
    period_start: isNonEmptyString(rec.period_start) ? rec.period_start : null,
    period_end: isNonEmptyString(rec.period_end) ? rec.period_end : null,
    evidence_ref: isNonEmptyString(rec.evidence_ref) ? rec.evidence_ref : null,
    provenance: provenanceFor(scope, ctx),
  });
  if (error) return internalErrorResponse(requestId, error);

  try {
    await emitPrimitiveEvent(
      db, scope, `evt_${id}_attested`, "attestation.recorded", "attestation", id,
      { control_uid: rec.control_uid, attested_by: ctx.tokenId },
      ctx,
    );
  } catch (e) {
    console.error(`attestation event failed for ${id}: ${e}`);
  }

  return jsonResponse({
    id,
    control_uid: rec.control_uid,
    attested_by: ctx.tokenId,
    append_only: true,
  }, 201, requestId);
}

/** Exported so callers cannot re-implement the adverse-outcome rule. */
export function requiresRationale(outcome: string): boolean {
  return ADVERSE_OUTCOMES.has(outcome);
}

/** Exported for the same reason: one definition of "this cannot go overdue". */
export function canBeOverdue(item: { due_at?: string | null; status: string }): boolean {
  return !!item.due_at && (item.status === "open" || item.status === "in_progress");
}
