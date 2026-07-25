// HR seam — the minimal personnel layer three controls were red for.
//
// cash_ops.ts declined to invent an employee concept, and that was correct:
// turning CP-05/CP-07 green by fabricating personnel facts would grade the
// fabrication. The cure is a WRITER — personnel facts declared by an
// authorized internal actor, exactly like thresholds and board approvals.
//
//   CP-05: employee.separated must revoke cash custody (the hook lives here —
//          separation without revocation is the violation the control names)
//   CP-07: hr.coaching.recorded is the graduated response to a sub-threshold
//          over/short pattern
//   CP-12: training.coverage_pct is COMPUTED from core.training over
//          cash-handling employees — never caller-supplied
//   IS-06 (future): the same hired/separated events drive access lifecycle

import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { type PartnerContext } from "./auth.ts";
import { type EvidenceScope, provenanceFor } from "./bsa.ts";
import {
  internalErrorResponse, isNonEmptyString, jsonResponse, notFoundResponse,
  parseJsonBody, validationError,
} from "./lib.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

async function emit(
  db: SupabaseClient, scope: EvidenceScope, id: string, code: string,
  resourceType: string, resourceId: string, payload: Record<string, unknown>,
  ctx?: PartnerContext,
): Promise<void> {
  const { error } = await db.schema(scope).from("event").upsert({
    id, code, resource_type: resourceType, resource_id: `${resourceType}:${resourceId}`,
    payload, provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id", ignoreDuplicates: true });
  if (error) console.error(`hr event (${code}): ${error.message}`);
}

/** POST /hr/employees {id?, name, role, cash_handler?} */
export async function postEmployee(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};
  if (!isNonEmptyString(body.name) || !isNonEmptyString(body.role)) {
    return validationError(requestId, [{
      type: "missing_field", field: "name", message: "name and role are required",
    }]);
  }
  const id = isNonEmptyString(body.id) ? body.id : `emp_${crypto.randomUUID()}`;
  const { error } = await db.schema(scope).from("employee").upsert({
    id, name: body.name, role: body.role,
    cash_handler: body.cash_handler === true,
    status: "active", provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);
  await emit(db, scope, `ev_${id}_hired`, "employee.hired", "employee", id, {
    "employee.id": id, role: body.role, cash_handler: body.cash_handler === true,
  }, ctx);
  return jsonResponse({ data: { id } }, 201, requestId);
}

/**
 * POST /hr/employees/{id}/separate {reason?}
 *
 * CP-05's hook: separation REVOKES every live cash custody the employee
 * holds, in the same request — a separated employee still holding vault keys
 * is the exact exposure the control exists to close. The revocations and the
 * coverage update are evidence, not side effects.
 */
export async function postEmployeeSeparate(
  req: Request, employeeId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};
  const { data: emp } = await db.schema(scope).from("employee")
    .select("id, status, cash_handler").eq("id", employeeId).maybeSingle();
  if (!emp) return notFoundResponse(requestId, "employee", employeeId);

  const now = new Date().toISOString();
  const { error } = await db.schema(scope).from("employee")
    .update({ status: "separated", separated_at: now }).eq("id", employeeId);
  if (error) return internalErrorResponse(requestId, error.message);
  await emit(db, scope, `ev_${employeeId}_sep`, "employee.separated", "employee", employeeId, {
    "employee.id": employeeId, reason: body.reason ?? null,
  }, ctx);

  // revoke every live custody NOW — and say so, one event per custody
  const { data: custodies } = await db.schema(scope).from("cash_custody")
    .select("id, kind, asset_id").eq("employee_id", employeeId).is("revoked_at", null);
  for (const c of custodies ?? []) {
    await db.schema(scope).from("cash_custody").update({
      revoked_at: now, revoke_reason: "employee_separated",
    }).eq("id", c.id);
    await emit(db, scope, `ev_${c.id}_revoked`, "cash.custody.revoked", "cash_custody", String(c.id), {
      "employee.id": employeeId, kind: c.kind, asset_id: c.asset_id,
      revoke_reason: "employee_separated",
    }, ctx);
  }
  if ((custodies ?? []).length > 0) {
    await emit(db, scope, `ev_${employeeId}_cov`, "cash.coverage.updated", "employee", employeeId, {
      "cash.coverage.registry": (custodies ?? []).map((c: Any) => c.id),
      cause: "employee_separated",
    }, ctx);
  }

  // the IAM projection follows the personnel fact
  await db.schema(scope).from("user").upsert({
    id: employeeId, employment_status: "separated",
  }, { onConflict: "id" });

  // IS-06: separation deprovisions ACCESS in the same act, same principle as
  // custody — a separated employee with live credentials is the exposure
  const { data: grants } = await db.schema(scope).from("access_grant")
    .select("id, role").eq("user_id", employeeId).is("deprovisioned_at", null);
  for (const g of grants ?? []) {
    await db.schema(scope).from("access_grant").update({ deprovisioned_at: now }).eq("id", g.id);
    await emit(db, scope, `ev_${g.id}_deprov`, "access.deprovisioned", "access_grant", String(g.id), {
      "user.id": employeeId, "user.employment_status": "separated", role: g.role,
    }, ctx);
  }
  return jsonResponse({
    data: { id: employeeId, separated: true, custodies_revoked: (custodies ?? []).length },
  }, 200, requestId);
}

/** POST /hr/employees/{id}/coaching {cause_type, cause_id, notes} — CP-07's
 * graduated response: the pattern is real but below the BSA line. */
export async function postEmployeeCoaching(
  req: Request, employeeId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};
  if (!isNonEmptyString(body.notes)) {
    return validationError(requestId, [{
      type: "missing_field", field: "notes",
      message: "coaching with no notes is a checkbox, not a response",
    }]);
  }
  const { data: emp } = await db.schema(scope).from("employee")
    .select("id").eq("id", employeeId).maybeSingle();
  if (!emp) return notFoundResponse(requestId, "employee", employeeId);

  const id = `hract_${crypto.randomUUID()}`;
  const { error } = await db.schema(scope).from("hr_action").upsert({
    id, employee_id: employeeId, kind: "coaching",
    cause_type: isNonEmptyString(body.cause_type) ? body.cause_type : null,
    cause_id: isNonEmptyString(body.cause_id) ? body.cause_id : null,
    notes: body.notes, provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);
  await emit(db, scope, `ev_${id}_coach`, "hr.coaching.recorded", "hr_action", id, {
    "employee.id": employeeId, cause_type: body.cause_type ?? null,
    cause_id: body.cause_id ?? null,
  }, ctx);
  return jsonResponse({ data: { id } }, 201, requestId);
}

/** POST /hr/employees/{id}/training {course} */
export async function postEmployeeTraining(
  req: Request, employeeId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};
  if (!isNonEmptyString(body.course)) {
    return validationError(requestId, [{
      type: "missing_field", field: "course", message: "course is required",
    }]);
  }
  const { data: emp } = await db.schema(scope).from("employee")
    .select("id").eq("id", employeeId).maybeSingle();
  if (!emp) return notFoundResponse(requestId, "employee", employeeId);

  // the schema already HAS a training table — a parallel one would let the
  // two disagree about who is trained
  const id = `trn_${employeeId}_${body.course}`.replace(/[^a-zA-Z0-9_]/g, "_");
  // core.training predates the provenance convention — it has no such column
  // (the live tier said so within minutes of this writer existing)
  const { error } = await db.schema(scope).from("training").upsert({
    id, assignee_id: employeeId, curriculum_id: body.course,
    completion_status: "completed",
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);
  await emit(db, scope, `ev_${id}_done`, "training.completed", "training", id, {
    "employee.id": employeeId, course: body.course,
  }, ctx);
  return jsonResponse({ data: { id } }, 201, requestId);
}

/**
 * CP-12's `training.coverage_pct`, COMPUTED — trained cash-handlers over all
 * cash-handlers. No employees at all is UNASSESSED (null), never 100%: an
 * institution that has not declared its people has not demonstrated coverage.
 */
export async function trainingCoveragePct(
  db: SupabaseClient, scope: EvidenceScope, course = "cash_handling",
): Promise<number | null> {
  const { data: handlers } = await db.schema(scope).from("employee")
    .select("id").eq("cash_handler", true).eq("status", "active");
  if (!handlers || handlers.length === 0) return null;
  const { data: trained } = await db.schema(scope).from("training")
    .select("assignee_id").eq("curriculum_id", course).eq("completion_status", "completed");
  const trainedSet = new Set((trained ?? []).map((t: Any) => String(t.assignee_id)));
  const covered = handlers.filter((h: Any) => trainedSet.has(String(h.id))).length;
  return Math.round((covered / handlers.length) * 1000) / 10;
}

/**
 * POST /hr/training-assignments {curriculum, assignee_id, annual_due_at?}
 *
 * BA-08's capital training cycle rides the same HR seam: the assignment is
 * CREATED with its annual clock; completion goes through the existing
 * training writer. `training.capital` is the event code BA-08 declares for
 * the capital curriculum — the corpus's name, kept verbatim.
 */
export async function postTrainingAssignment(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};
  if (!isNonEmptyString(body.curriculum) || !isNonEmptyString(body.assignee_id)) {
    return validationError(requestId, [{
      type: "missing_field", field: "curriculum",
      message: "curriculum and assignee_id are required",
    }]);
  }
  const { data: emp } = await db.schema(scope).from("employee")
    .select("id").eq("id", body.assignee_id).maybeSingle();
  if (!emp) return notFoundResponse(requestId, "employee", String(body.assignee_id));
  const id = `trnasg_${crypto.randomUUID()}`;
  const dueAt = isNonEmptyString(body.annual_due_at)
    ? body.annual_due_at
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await db.schema(scope).from("training_assignment").upsert({
    id, curriculum: body.curriculum, assignee_id: body.assignee_id,
    annual_due_at: dueAt, provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);
  // the assignment IS a training row in 'assigned' status; completion
  // overwrites it through the completion writer
  await db.schema(scope).from("training").upsert({
    id: `trn_${body.assignee_id}_${body.curriculum}`.replace(/[^a-zA-Z0-9_]/g, "_"),
    assignee_id: body.assignee_id, curriculum_id: body.curriculum,
    completion_status: "assigned",
  }, { onConflict: "id", ignoreDuplicates: true });

  await emit(db, scope, `ev_${id}_created`, "training.assignment.created",
    "training_assignment", id, {
      "training.required_curriculum": body.curriculum,
      "training.annual_due_at": dueAt,
      assignee_id: body.assignee_id,
    }, ctx);
  if (body.curriculum === "capital") {
    await emit(db, scope, `ev_${id}_capital`, "training.capital",
      "training_assignment", id, {
        "training.capital": true, "training.annual_due_at": dueAt,
      }, ctx);
  }
  return jsonResponse({ data: { id, annual_due_at: dueAt } }, 201, requestId);
}
