// E-commerce — EC-01 (policy and risk assessment), EC-03 (enrollment),
// EC-04 (credentials), EC-07 (transaction audit trail and repudiation).
//
// See the migration header for what is deliberately ABSENT: firewalls, TLS,
// antivirus and penetration testing are controls over infrastructure this
// system does not run. They stay red naming the feed they need, rather than
// going green on a caller's say-so.

import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { type PartnerContext } from "./auth.ts";
import { type EvidenceScope, provenanceFor } from "./bsa.ts";
import {
  apiError, internalErrorResponse, isNonEmptyString, jsonResponse, notFoundResponse,
  parseJsonBody, validationError,
} from "./lib.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
const DAY_MS = 24 * 60 * 60 * 1000;

/** EC-04: a temporary password that outlives this is not temporary. */
export const TEMP_PASSWORD_HOURS = 24;
/** EC-03: consecutive failures before the credential locks. */
export const LOCKOUT_THRESHOLD = 5;

function requireInternalActor(ctx: PartnerContext, requestId: string): Response | null {
  if (ctx.actorType === "partner") return notFoundResponse(requestId, "route", "/ecommerce");
  return null;
}

async function emit(
  db: SupabaseClient, scope: EvidenceScope, id: string, code: string,
  resourceType: string, resourceId: string, payload: Record<string, unknown>,
  ctx?: PartnerContext,
): Promise<void> {
  const { error } = await db.schema(scope).from("event").upsert({
    id, code, resource_type: resourceType, resource_id: `${resourceType}:${resourceId}`,
    payload, provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw new Error(`ecommerce event (${code}): ${error.message}`);
}

// ------------------------------------------------------- EC-01 policy + risk

/** POST /ecommerce/risk-assessments {document_version, findings, control_register} */
export async function postEcommerceRiskAssessment(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  if (!isNonEmptyString(body.document_version)) {
    return validationError(requestId, [{
      type: "missing_field", field: "document_version",
      message: "a risk assessment is against a specific version of the policy",
    }]);
  }
  const now = new Date();
  const completed = body.completed !== false;
  const boardApproved = body.board_approved_by;
  if (boardApproved && !completed) {
    // The board approving a policy whose risk assessment was never completed is
    // the approval EC-01 exists to prevent. Refused, not flagged.
    return apiError(409, "assessment_incomplete", requestId, {
      title: "board approval before the risk assessment completed",
      detail: "the assessment is what the board is approving against",
    });
  }
  const id = `ecra_${body.document_version}`;
  const { error } = await db.schema(scope).from("ecommerce_risk_assessment").upsert({
    id, policy_document_version: body.document_version,
    assessment_due_at: new Date(now.getTime() + 365 * DAY_MS).toISOString(),
    completed_at: completed ? now.toISOString() : null,
    finding_description: isNonEmptyString(body.finding_description)
      ? body.finding_description
      : null,
    control_register: (body.control_register ?? []) as Any,
    regulatory_change_analysis: isNonEmptyString(body.regulatory_change_analysis)
      ? body.regulatory_change_analysis
      : null,
    board_approved_at: boardApproved ? now.toISOString() : null,
    board_approved_by: isNonEmptyString(boardApproved) ? boardApproved : null,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  // A risk assessment whose findings live only in a text column is a document.
  // `core.finding` is the register the audit and remediation controls already
  // read from, and an e-commerce finding that never lands there is a finding
  // nobody will track to closure.
  if (isNonEmptyString(body.finding_description)) {
    const { error: fErr } = await db.schema(scope).from("finding").upsert({
      id: `find_${id}`, description: body.finding_description,
      severity: isNonEmptyString(body.finding_severity) ? body.finding_severity : "medium",
      remediation_status: "open", owner: isNonEmptyString(body.finding_owner)
        ? body.finding_owner
        : "information_security",
      identified: "ecommerce_risk_assessment",
      provenance: provenanceFor(scope, ctx),
    }, { onConflict: "id" });
    if (fErr) return internalErrorResponse(requestId, fErr.message);
  }

  const payload = {
    "policy.document_version": body.document_version,
    "finding.description": body.finding_description ?? null,
    "control.register": body.control_register ?? [],
    "regulatory.change_analysis": body.regulatory_change_analysis ?? null,
    "ecommerce.risk.assessment.due": new Date(now.getTime() + 365 * DAY_MS).toISOString(),
  };
  if (completed) {
    await emit(db, scope, `ev_${id}_done`, "ecommerce.risk_assessment.completed",
      "ecommerce_risk_assessment", id, payload, ctx);
  }
  await emit(db, scope, `ev_${id}_ver`, "policy.document_version",
    "ecommerce_risk_assessment", id, payload, ctx);
  if (boardApproved) {
    await emit(db, scope, `ev_${id}_appr`, "policy.board.approved",
      "ecommerce_risk_assessment", id, { ...payload, approved_by: boardApproved }, ctx);
    await emit(db, scope, `ev_${id}_apprat`, "policy.board_approved_at",
      "ecommerce_risk_assessment", id, { approved_at: now.toISOString() }, ctx);
  }
  return jsonResponse({ data: { id, completed } }, 201, requestId);
}

// ------------------------------------------------------------ EC-03 enrollment

/** POST /ecommerce/enrollments {member_ref, channel, applicant_identity, ...} */
export async function postEnrollment(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const channels = ["web", "mobile", "branch", "phone"];
  if (!isNonEmptyString(body.member_ref) || !channels.includes(String(body.channel))) {
    return validationError(requestId, [{
      type: "invalid_value", field: "channel",
      message: `member_ref and a channel in ${channels.join("/")} are required`,
    }]);
  }
  const now = new Date();
  // UNKNOWN IS NOT PERMISSION. If the caller supplies no member-number
  // comparison, the answer is NULL — not false, and certainly not true. A
  // missing comparison and a failed one are different facts and the approval
  // constraint treats both as blocking.
  const match = typeof body.member_number_match === "boolean"
    ? body.member_number_match
    : null;
  const verified = body.verified === true;
  const id = `enroll_${body.member_ref}`;
  const { error } = await db.schema(scope).from("ecommerce_enrollment").upsert({
    id, member_ref: body.member_ref, channel: body.channel,
    applicant_identity: isNonEmptyString(body.applicant_identity)
      ? body.applicant_identity
      : "unstated",
    identity_evidence: (body.identity_evidence ?? {}) as Any,
    member_number_match: match,
    entity_email: isNonEmptyString(body.entity_email) ? body.entity_email : null,
    submitted_at: now.toISOString(),
    verified_at: body.verified === undefined ? null : now.toISOString(),
    verification_outcome: body.verified === undefined
      ? null
      : (verified ? "verified" : "denied"),
    denial_reason: verified || body.verified === undefined
      ? null
      : (isNonEmptyString(body.denial_reason) ? body.denial_reason : "identity not established"),
    approved_at: verified && match === true ? now.toISOString() : null,
    confirmation_sent_at: verified && match === true ? now.toISOString() : null,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  const payload = {
    "enrollment.applicant_identity": body.applicant_identity ?? "unstated",
    "enrollment.channel": body.channel,
    "enrollment.identity_evidence": body.identity_evidence ?? {},
    "enrollment.member_number_match": match,
    "entity.email": body.entity_email ?? null,
  };
  await emit(db, scope, `ev_${id}_sub`, "ecommerce.enrollment.submitted",
    "ecommerce_enrollment", id, payload, ctx);
  if (body.verified !== undefined) {
    await emit(db, scope, `ev_${id}_ver`,
      verified ? "verification.completed" : "verification.denied",
      "ecommerce_enrollment", id, { ...payload, outcome: verified ? "verified" : "denied" }, ctx);
  }
  if (verified && match === true) {
    await emit(db, scope, `ev_${id}_appr`, "ecommerce.enrollment.approved",
      "ecommerce_enrollment", id, payload, ctx);
    // The confirmation goes to the MEMBER, so an enrollment they did not make is
    // visible to them. An approval nobody was told about is a silent takeover.
    await emit(db, scope, `ev_${id}_conf`, "ecommerce.enrollment_confirmation.sent",
      "ecommerce_enrollment", id, { "entity.email": body.entity_email ?? null }, ctx);
  }
  await emit(db, scope, `ev_${id}_trail`, "ecommerce.audit_trail.recorded",
    "ecommerce_enrollment", id, { ...payload, step: "enrollment" }, ctx);
  return jsonResponse({ data: { id, approved: verified && match === true } }, 201, requestId);
}

// ----------------------------------------------------------- EC-04 credentials

/** POST /ecommerce/credentials {member_ref, login_id, temp_password?} */
export async function postCredentialIssue(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  if (!isNonEmptyString(body.member_ref) || !isNonEmptyString(body.login_id)) {
    return validationError(requestId, [{
      type: "missing_field", field: "login_id", message: "member_ref and login_id are required",
    }]);
  }
  const now = new Date();
  const temp = body.temporary !== false;
  const id = `cred_${body.member_ref}`;
  const { error } = await db.schema(scope).from("member_credential").upsert({
    id, member_ref: body.member_ref, login_id: body.login_id,
    // The hash stands in for a real KDF. This is a control test harness, not a
    // credential store, and the column exists so the CONTROL can be tested —
    // see BLUEPRINT on what hermetic verification does and does not claim.
    password_hash: isNonEmptyString(body.password_hash) ? body.password_hash : "argon2id$stub",
    security_questions: (body.security_questions ?? []) as Any,
    is_temporary: temp,
    // A temporary password with no expiry is a permanent one wearing a label.
    temp_password_expires_at: temp
      ? new Date(now.getTime() + TEMP_PASSWORD_HOURS * 3_600_000).toISOString()
      : null,
    password_set_at: temp ? null : now.toISOString(),
    failed_login_count: 0, provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  const payload = {
    "member_credential.login_id": body.login_id,
    "member_credential.is_temporary": temp,
    "member_credential.temp_password": temp,
    "member_credential.password_hash": "redacted",
    "member_credential.security_questions": body.security_questions ?? [],
  };
  await emit(db, scope, `ev_${id}_issued`, "member_credential.issued",
    "member_credential", id, payload, ctx);
  await emit(db, scope, `ev_${id}_temp`, "member_credential.is_temporary",
    "member_credential", id, {
      "member_credential.is_temporary": temp,
      expires_at: temp
        ? new Date(now.getTime() + TEMP_PASSWORD_HOURS * 3_600_000).toISOString()
        : null,
    }, ctx);
  if (!temp) {
    await emit(db, scope, `ev_${id}_setat`, "member_credential.password_set_at",
      "member_credential", id, { "member_credential.password_set_at": now.toISOString() }, ctx);
  }
  return jsonResponse({ data: { id, temporary: temp } }, 201, requestId);
}

/** POST /ecommerce/credentials/:id/password {new_password} — EC-04. */
export async function postPasswordChange(
  req: Request, credId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const { data: row } = await db.schema(scope).from("member_credential")
    .select("id, login_id, is_temporary").eq("id", credId).maybeSingle();
  if (!row) return notFoundResponse(requestId, "member_credential", credId);

  if (!isNonEmptyString(body.new_password)) {
    return validationError(requestId, [{
      type: "missing_field", field: "new_password", message: "is required",
    }]);
  }
  const now = new Date();
  // See the migration header: `is_temporary` moves HERE and nowhere else.
  // Issuing a permanent-looking credential and never forcing the change is the
  // failure EC-04 describes, so the flag can only be cleared by an actual change.
  const { error } = await db.schema(scope).from("member_credential").update({
    password_hash: "argon2id$stub_rotated", is_temporary: false,
    temp_password_expires_at: null, password_set_at: now.toISOString(),
    failed_login_count: 0, updated_at: now.toISOString(),
  }).eq("id", credId);
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${credId}_chg`, "member_credential.password.changed",
    "member_credential", credId, {
      "member_credential.login_id": row.login_id,
      "member_credential.new_password": "redacted",
      was_temporary: row.is_temporary === true,
    }, ctx);
  await emit(db, scope, `ev_${credId}_setat`, "member_credential.password_set_at",
    "member_credential", credId, {
      "member_credential.password_set_at": now.toISOString(),
    }, ctx);
  return jsonResponse({ data: { id: credId, is_temporary: false } }, 200, requestId);
}

/** POST /ecommerce/credentials/:id/login-failed — EC-03 lockout. */
export async function postLoginFailure(
  _req: Request, credId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;

  const { data: row } = await db.schema(scope).from("member_credential")
    .select("id, failed_login_count, login_id").eq("id", credId).maybeSingle();
  if (!row) return notFoundResponse(requestId, "member_credential", credId);

  const count = Number(row.failed_login_count ?? 0) + 1;
  const lock = count >= LOCKOUT_THRESHOLD;
  const now = new Date();
  const { error } = await db.schema(scope).from("member_credential").update({
    failed_login_count: count,
    locked_at: lock ? now.toISOString() : null,
    lockout_reason: lock ? `${count} consecutive failed logins` : null,
    updated_at: now.toISOString(),
  }).eq("id", credId);
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${credId}_fail_${count}`, "ecommerce.audit_trail.recorded",
    "member_credential", credId, {
      "member_credential.login_id": row.login_id, failed_login_count: count, step: "login_failed",
    }, ctx);
  if (lock) {
    await emit(db, scope, `ev_${credId}_lock`, "ecommerce.credential.locked",
      "member_credential", credId, { reason: `${count} consecutive failed logins` }, ctx);
    // Locked AND recorded. A lockout the member is never told about looks to
    // them like the service being broken, and they call the branch instead of
    // reporting the takeover attempt.
    await emit(db, scope, `ev_${credId}_lockrec`, "ecommerce.lockout.recorded",
      "member_credential", credId, { failed_login_count: count, threshold: LOCKOUT_THRESHOLD }, ctx);
  }
  return jsonResponse({ data: { id: credId, locked: lock, failures: count } }, 200, requestId);
}

// ------------------------------------------------------------ EC-07 audit trail

/** POST /ecommerce/transactions {member_ref, type, amount_cents, initiated_by} */
export async function postEcommerceTransaction(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  if (!isNonEmptyString(body.member_ref) || !isNonEmptyString(body.initiated_by)) {
    // EC-07 is answered by WHO initiated it. A transaction whose initiator is
    // unrecorded cannot be defended against a repudiation claim, which makes
    // the missing field the whole failure rather than a tidiness problem.
    return validationError(requestId, [{
      type: "missing_field", field: "initiated_by",
      message: "the audit trail needs the member and the initiator",
    }]);
  }
  const now = new Date();
  const id = `ectx_${body.member_ref}_${crypto.randomUUID()}`;
  const trail = {
    initiated_by: body.initiated_by, at: now.toISOString(),
    source_ip: body.source_ip ?? null, device: body.device ?? null,
    session_ref: body.session_ref ?? null,
  };
  const { error } = await db.schema(scope).from("ecommerce_transaction").upsert({
    id, member_ref: body.member_ref,
    transaction_type: isNonEmptyString(body.transaction_type) ? body.transaction_type : "transfer",
    transaction_amount_cents: typeof body.amount_cents === "number" ? body.amount_cents : 0,
    transaction_initiated_by: body.initiated_by, initiated_at: now.toISOString(),
    audit_trail: trail, provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_trail`, "ecommerce.audit_trail.recorded",
    "ecommerce_transaction", id, {
      "member.id": body.member_ref, "transaction.amount": body.amount_cents ?? 0,
      "transaction.initiated_by": body.initiated_by,
      "transaction.type": body.transaction_type ?? "transfer",
      "ecommerce.audit_trail.recorded": trail,
    }, ctx);
  return jsonResponse({ data: { id } }, 201, requestId);
}

/** POST /ecommerce/transactions/:id/repudiation {claimed, outcome?, rationale?} */
export async function postRepudiationReview(
  req: Request, txId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const { data: row } = await db.schema(scope).from("ecommerce_transaction")
    .select("id, audit_trail, member_ref").eq("id", txId).maybeSingle();
  if (!row) return notFoundResponse(requestId, "ecommerce_transaction", txId);

  const outcomes = ["upheld", "rejected"];
  const outcome = outcomes.includes(String(body.outcome)) ? String(body.outcome) : null;
  if (outcome && !isNonEmptyString(body.rationale)) {
    // "Rejected" with no rationale is the member's word discarded without a
    // record. The audit trail exists so the answer can be shown, not asserted.
    return validationError(requestId, [{
      type: "missing_field", field: "rationale",
      message: "a repudiation outcome must state what the audit trail showed",
    }]);
  }
  const now = new Date();
  const { error } = await db.schema(scope).from("ecommerce_transaction").update({
    repudiation_claimed_at: now.toISOString(),
    repudiation_reviewed_at: outcome ? now.toISOString() : null,
    repudiation_outcome: outcome,
    repudiation_rationale: outcome ? body.rationale : null,
  }).eq("id", txId);
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${txId}_rep`, "ecommerce.repudiation.reviewed",
    "ecommerce_transaction", txId, {
      outcome, rationale: body.rationale ?? null,
      "ecommerce.audit_trail.recorded": row.audit_trail,
    }, ctx);
  return jsonResponse({ data: { id: txId, outcome } }, 200, requestId);
}
