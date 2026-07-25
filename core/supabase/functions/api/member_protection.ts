// Member protection + resolution safe mode — MP-06, MP-07, RS-03.
//
// Built TDD-style from the drill's red specs, and each flow ENFORCES, not
// just records:
//
//   MP-07: a death report flags every account (lock_type=deceased) — the
//          EXISTING transfer lock gate then refuses movement; a payout
//          without completed claimant verification is refused.
//   MP-06: an expulsion cannot be noticed to a member with no deliverable
//          contact; the payout nets amounts owed.
//   RS-03: while safe mode is active, transactions over the cap (or of a
//          restricted type) are refused AND leave safe_mode.transaction.decided
//          evidence; deactivation requires two different authorizers.

import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { type PartnerContext } from "./auth.ts";
import { type EvidenceScope, provenanceFor } from "./bsa.ts";
import {
  apiError, internalErrorResponse, isNonEmptyString, jsonResponse, notFoundResponse,
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
  if (error) console.error(`member_protection event (${code}): ${error.message}`);
}

// ------------------------------------------------- MP-07 death and estate

/**
 * POST /members/{entityId}/death-report {date_of_death, death_certificate_ref}
 *
 * Every account of the member is locked `deceased` — one event per account,
 * because "the member's accounts were flagged" is only true account by
 * account. The transfer path's existing lock gate is the enforcement; this
 * writer never needs its own.
 */
export async function postDeathReport(
  req: Request, entityId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};
  if (!isNonEmptyString(body.date_of_death) || !isNonEmptyString(body.death_certificate_ref)) {
    return validationError(requestId, [{
      type: "missing_field", field: "date_of_death",
      message: "date_of_death and death_certificate_ref are required — a death is flagged from a document, not a rumor",
    }]);
  }
  const { data: ent } = await db.schema(scope).from("entity")
    .select("id").eq("id", entityId).maybeSingle();
  if (!ent) return notFoundResponse(requestId, "entity", entityId);

  const { data: accounts } = await db.schema(scope).from("account")
    .select("id, balance, lock_type").eq("entity_id", entityId);
  for (const a of accounts ?? []) {
    await db.schema(scope).from("account").update({ lock_type: "deceased" }).eq("id", a.id);
    await emit(db, scope, `ev_death_${a.id}`, "account.death_flag.applied", "account", String(a.id), {
      "member.id": entityId, "estate.date_of_death": body.date_of_death,
      "estate.death_certificate_ref": body.death_certificate_ref,
      "account.balance": a.balance ?? null, previous_lock: a.lock_type,
    }, ctx);
  }
  await emit(db, scope, `ev_death_rep_${entityId}`, "member.death.reported", "entity", entityId, {
    "member.id": entityId, "estate.date_of_death": body.date_of_death,
    accounts_flagged: (accounts ?? []).length,
  }, ctx);
  return jsonResponse({
    data: { entity_id: entityId, accounts_flagged: (accounts ?? []).length },
  }, 201, requestId);
}

/**
 * POST /members/{entityId}/estate-claims
 * {claimant, date_of_death, death_certificate_ref, authority_document_ref}
 *
 * Documents the claim and opens claimant VERIFICATION — the payout gate.
 */
export async function postEstateClaim(
  req: Request, entityId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};
  if (
    !isNonEmptyString(body.claimant) || !isNonEmptyString(body.date_of_death) ||
    !isNonEmptyString(body.death_certificate_ref)
  ) {
    return validationError(requestId, [{
      type: "missing_field", field: "claimant",
      message: "claimant, date_of_death and death_certificate_ref are required",
    }]);
  }
  const id = `estate_${crypto.randomUUID()}`;
  const verificationId = `ver_${crypto.randomUUID()}`;
  // the claimant's verification is a real core.verification row — the same
  // machinery KYC uses, because "who is this person" is the same question
  const { error: verErr } = await db.schema(scope).from("verification").insert({
    id: verificationId, type: "estate_claimant", status: "pending",
  });
  if (verErr) return internalErrorResponse(requestId, verErr.message);
  await emit(db, scope, `ev_${verificationId}_created`, "verification.created",
    "verification", verificationId, {
      "verification.status": "pending", "estate.claimant_verification_id": verificationId,
      claimant: body.claimant,
    }, ctx);

  const { error } = await db.schema(scope).from("estate_claim").upsert({
    id, entity_id: entityId, date_of_death: body.date_of_death,
    death_certificate_ref: body.death_certificate_ref,
    authority_document_ref: isNonEmptyString(body.authority_document_ref)
      ? body.authority_document_ref
      : null,
    claimant: body.claimant, verification_id: verificationId,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_doc`, "estate.claim_documented", "estate_claim", id, {
    "member.id": entityId, "estate.date_of_death": body.date_of_death,
    "estate.death_certificate_ref": body.death_certificate_ref,
    "estate.authority_document_ref": body.authority_document_ref ?? null,
    "estate.claimant_verification_id": verificationId,
  }, ctx);
  return jsonResponse({ data: { id, verification_id: verificationId } }, 201, requestId);
}

/**
 * POST /estate-claims/{id}/payout {amounts_owed_cents?}
 *
 * THE GATE: no payout before the claimant's verification COMPLETES. Paying an
 * unverified claimant is the violation MP-07 exists to prevent.
 */
export async function postEstatePayout(
  req: Request, claimId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};
  const { data: claim } = await db.schema(scope).from("estate_claim")
    .select("id, entity_id, verification_id, status").eq("id", claimId).maybeSingle();
  if (!claim) return notFoundResponse(requestId, "estate_claim", claimId);
  if (claim.status === "paid") {
    return apiError(409, "estate_already_paid", requestId, {
      title: "Already Paid", detail: "this estate claim has already been paid out",
    });
  }
  // 'approved' is the verification table's own vocabulary (its check
  // constraint allows pending/approved/denied — 'completed' was an invented
  // word the live tier refused)
  const { data: ver } = await db.schema(scope).from("verification")
    .select("id, status").eq("id", String(claim.verification_id)).maybeSingle();
  if (!ver || ver.status !== "approved") {
    return apiError(409, "claimant_not_verified", requestId, {
      title: "Claimant Not Verified",
      detail: `payout refused: claimant verification is '${ver?.status ?? "missing"}', not approved — ` +
        "paying an unverified claimant is the exposure MP-07 exists to prevent",
    });
  }

  const { data: accounts } = await db.schema(scope).from("account")
    .select("id, balance").eq("entity_id", String(claim.entity_id));
  const balance = (accounts ?? []).reduce((n: number, a: Any) => n + Number(a.balance ?? 0), 0);
  const owed = typeof body.amounts_owed_cents === "number" ? body.amounts_owed_cents : 0;
  const payout = Math.max(0, balance - owed);

  const now = new Date().toISOString();
  const { error } = await db.schema(scope).from("estate_claim").update({
    status: "paid", payout_cents: payout, updated_at: now,
  }).eq("id", claimId);
  if (error) return internalErrorResponse(requestId, error.message);
  await emit(db, scope, `ev_${claimId}_paid`, "estate.payout.sent", "estate_claim", claimId, {
    "member.id": claim.entity_id, "account.balance": balance,
    "member.amounts_owed": owed, payout_cents: payout,
    "verification.status": "approved",
  }, ctx);
  return jsonResponse({ data: { id: claimId, payout_cents: payout } }, 200, requestId);
}

// ------------------------------------------------------- MP-06 expulsion

/**
 * POST /members/{entityId}/expulsion {grounds, decided_by, meeting_date, amounts_owed_cents?}
 *
 * The notice needs a deliverable CONTACT — expelling someone who cannot be
 * told is the due-process violation, so it refuses rather than pretends.
 */
export async function postExpulsion(
  req: Request, entityId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};
  if (
    !isNonEmptyString(body.grounds) || !isNonEmptyString(body.decided_by) ||
    !isNonEmptyString(body.meeting_date)
  ) {
    return validationError(requestId, [{
      type: "missing_field", field: "grounds",
      message: "grounds, decided_by and meeting_date are required — expulsion is a board act, not a status flip",
    }]);
  }
  const { data: ent } = await db.schema(scope).from("entity")
    .select("id, email, address").eq("id", entityId).maybeSingle();
  if (!ent) return notFoundResponse(requestId, "entity", entityId);

  const contact = isNonEmptyString((ent as Any).email)
    ? { channel: "email", value: (ent as Any).email }
    : (ent as Any).address
    ? { channel: "mail", value: "address on file" }
    : null;
  if (!contact) {
    return apiError(422, "no_deliverable_contact", requestId, {
      title: "No Deliverable Contact",
      detail: "the member has no email or address on file; an expulsion notice that cannot be " +
        "delivered denies the hearing right the FCU Act attaches to it",
    });
  }

  const id = `expul_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const { error } = await db.schema(scope).from("expulsion").upsert({
    id, entity_id: entityId, grounds: body.grounds, decided_by: body.decided_by,
    meeting_date: body.meeting_date, notice_sent_at: now, notice_channel: contact.channel,
    amounts_owed_cents: typeof body.amounts_owed_cents === "number" ? body.amounts_owed_cents : 0,
    status: "noticed", provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_dec`, "member.expulsion.decided", "expulsion", id, {
    "member.id": entityId, "expulsion.grounds": body.grounds,
    "expulsion.decided_by": body.decided_by,
  }, ctx);
  await emit(db, scope, `ev_${id}_notice`, "member.expulsion_notice", "expulsion", id, {
    "member.id": entityId, "expulsion.grounds": body.grounds,
    "entity.contact": contact.channel,
  }, ctx);
  await emit(db, scope, `ev_${id}_sent`, "member.expulsion_notice.sent", "expulsion", id, {
    "member.id": entityId, "entity.contact": contact.channel,
  }, ctx);
  await emit(db, scope, `ev_${id}_meet`, "expulsion.meeting_date", "expulsion", id, {
    "expulsion.meeting_date": body.meeting_date,
  }, ctx);
  return jsonResponse({ data: { id, notice_channel: contact.channel } }, 201, requestId);
}

/** POST /expulsions/{id}/hearing {kind: requested|held} */
export async function postExpulsionHearing(
  req: Request, expulsionId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};
  const kind = body.kind;
  if (kind !== "requested" && kind !== "held") {
    return validationError(requestId, [{
      type: "invalid_value", field: "kind", message: "kind must be 'requested' or 'held'",
    }]);
  }
  const { data: ex } = await db.schema(scope).from("expulsion")
    .select("id, status").eq("id", expulsionId).maybeSingle();
  if (!ex) return notFoundResponse(requestId, "expulsion", expulsionId);

  const now = new Date().toISOString();
  const patch = kind === "requested"
    ? { hearing_requested_at: now, status: "hearing", updated_at: now }
    : { hearing_held_at: now, updated_at: now };
  const { error } = await db.schema(scope).from("expulsion").update(patch).eq("id", expulsionId);
  if (error) return internalErrorResponse(requestId, error.message);
  await emit(
    db, scope, `ev_${expulsionId}_h${kind}`,
    kind === "requested" ? "member.expulsion_hearing.requested" : "member.expulsion_hearing.held",
    "expulsion", expulsionId,
    { "expulsion.hearing_requested_at": kind === "requested" ? now : undefined, kind },
    ctx,
  );
  return jsonResponse({ data: { id: expulsionId, [kind]: true } }, 200, requestId);
}

/**
 * POST /expulsions/{id}/close — files the board report and sends the payout
 * (share balance net of amounts owed), locking the accounts `expelled`.
 */
export async function postExpulsionClose(
  req: Request, expulsionId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const _body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};
  const { data: ex } = await db.schema(scope).from("expulsion")
    .select("id, entity_id, status, amounts_owed_cents").eq("id", expulsionId).maybeSingle();
  if (!ex) return notFoundResponse(requestId, "expulsion", expulsionId);
  if (ex.status === "final") {
    return apiError(409, "expulsion_final", requestId, {
      title: "Already Final", detail: "this expulsion is already closed",
    });
  }

  const { data: accounts } = await db.schema(scope).from("account")
    .select("id, balance").eq("entity_id", String(ex.entity_id));
  const balance = (accounts ?? []).reduce((n: number, a: Any) => n + Number(a.balance ?? 0), 0);
  const owed = Number(ex.amounts_owed_cents ?? 0);
  const payout = Math.max(0, balance - owed);
  const now = new Date().toISOString();

  for (const a of accounts ?? []) {
    await db.schema(scope).from("account").update({ lock_type: "expelled" }).eq("id", a.id);
  }
  const { error } = await db.schema(scope).from("expulsion").update({
    status: "final", board_report_filed_at: now, payout_cents: payout,
    payout_sent_at: now, updated_at: now,
  }).eq("id", expulsionId);
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${expulsionId}_report`, "expulsion.board_report.filed",
    "expulsion", expulsionId, {
      "member.id": ex.entity_id, "expulsion.grounds": undefined,
      accounts_locked: (accounts ?? []).length,
    }, ctx);
  await emit(db, scope, `ev_${expulsionId}_payout`, "member.expulsion_payout.sent",
    "expulsion", expulsionId, {
      "member.id": ex.entity_id, "account.balance": balance,
      "member.amounts_owed": owed, payout_cents: payout,
    }, ctx);
  return jsonResponse({ data: { id: expulsionId, payout_cents: payout } }, 200, requestId);
}

// ------------------------------------------------------- RS-03 safe mode

/**
 * POST /resolution/safe-mode {trigger_basis, per_txn_cap_cents, restricted_types?, activated_by}
 *
 * The partial unique index makes double-activation a database refusal.
 * Processor confirmation is a separate step because it is a separate FACT.
 */
export async function postSafeModeActivate(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};
  if (
    !isNonEmptyString(body.trigger_basis) || !isNonEmptyString(body.activated_by) ||
    typeof body.per_txn_cap_cents !== "number" || body.per_txn_cap_cents <= 0
  ) {
    return validationError(requestId, [{
      type: "missing_field", field: "trigger_basis",
      message: "trigger_basis, activated_by and a positive per_txn_cap_cents are required",
    }]);
  }
  const id = `safemode_${crypto.randomUUID()}`;
  const { error } = await db.schema(scope).from("safe_mode").insert({
    id, trigger_basis: body.trigger_basis,
    per_txn_cap_cents: body.per_txn_cap_cents,
    restricted_types: Array.isArray(body.restricted_types) ? body.restricted_types : [],
    activated_by: body.activated_by,
    provenance: provenanceFor(scope, ctx),
  });
  if (error) {
    if (/uq_safe_mode_single_active|duplicate key/.test(error.message)) {
      return apiError(409, "safe_mode_already_active", requestId, {
        title: "Safe Mode Already Active",
        detail: "at most one safe mode can be active — the database enforces it",
      });
    }
    return internalErrorResponse(requestId, error.message);
  }
  await emit(db, scope, `ev_${id}_act`, "safe_mode.activated", "safe_mode", id, {
    "safe_mode.trigger_basis": body.trigger_basis,
    "safe_mode.cap_profile_id": id,
    "resolution_posture.current": "safe_mode",
    per_txn_cap_cents: body.per_txn_cap_cents,
    restricted_types: body.restricted_types ?? [],
  }, ctx);
  return jsonResponse({ data: { id } }, 201, requestId);
}

/** POST /resolution/safe-mode/{id}/processor-confirm {processor_ref} */
export async function postSafeModeProcessorConfirm(
  req: Request, safeModeId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};
  const { data: sm } = await db.schema(scope).from("safe_mode")
    .select("id, status").eq("id", safeModeId).maybeSingle();
  if (!sm) return notFoundResponse(requestId, "safe_mode", safeModeId);
  const now = new Date().toISOString();
  const { error } = await db.schema(scope).from("safe_mode")
    .update({ processor_confirmed_at: now }).eq("id", safeModeId);
  if (error) return internalErrorResponse(requestId, error.message);
  await emit(db, scope, `ev_${safeModeId}_proc`, "safe_mode.processor.confirmed",
    "safe_mode", safeModeId, { processor_ref: body.processor_ref ?? null }, ctx);
  return jsonResponse({ data: { id: safeModeId, processor_confirmed: true } }, 200, requestId);
}

/**
 * POST /resolution/safe-mode/{id}/deactivate {authorized_by, second_authorizer}
 *
 * TWO different authorizers — leaving safe mode is as consequential as
 * entering it, and one person's judgment was the failure mode that got the
 * institution here.
 */
export async function postSafeModeDeactivate(
  req: Request, safeModeId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};
  const { data: sm } = await db.schema(scope).from("safe_mode")
    .select("id, status").eq("id", safeModeId).maybeSingle();
  if (!sm) return notFoundResponse(requestId, "safe_mode", safeModeId);
  if (sm.status !== "active") {
    return apiError(409, "safe_mode_not_active", requestId, {
      title: "Not Active", detail: "this safe mode is not active",
    });
  }
  if (
    !isNonEmptyString(body.authorized_by) || !isNonEmptyString(body.second_authorizer) ||
    body.authorized_by === body.second_authorizer
  ) {
    return apiError(422, "dual_authorization_required", requestId, {
      title: "Dual Authorization Required",
      detail: "deactivating safe mode requires two DIFFERENT authorizers (RS-03)",
    });
  }
  const now = new Date().toISOString();
  const { error } = await db.schema(scope).from("safe_mode").update({
    status: "deactivated", deactivated_at: now,
    deactivated_by: body.authorized_by,
    deactivation_second_authorizer: body.second_authorizer,
  }).eq("id", safeModeId);
  if (error) return internalErrorResponse(requestId, error.message);
  await emit(db, scope, `ev_${safeModeId}_deact`, "safe_mode.deactivated",
    "safe_mode", safeModeId, {
      authorized_by: body.authorized_by, second_authorizer: body.second_authorizer,
    }, ctx);
  return jsonResponse({ data: { id: safeModeId, deactivated: true } }, 200, requestId);
}

export type SafeModeOutcome =
  | { restricted: false }
  | { restricted: true; safeModeId: string; reason: string };

/**
 * The RS-03 gate, called from the transfer path BEFORE money moves. Every
 * decision while safe mode is active — allowed or refused — leaves
 * safe_mode.transaction.decided evidence: an examiner asking "what did safe
 * mode actually do" reads decisions, not configuration.
 */
export async function safeModeGate(
  db: SupabaseClient,
  amountCents: number,
  txnType: string,
  resourceId: string,
  ctx?: PartnerContext,
  scope: EvidenceScope = "core",
): Promise<SafeModeOutcome> {
  const { data: sm } = await db.schema(scope).from("safe_mode")
    .select("id, per_txn_cap_cents, restricted_types").eq("status", "active").maybeSingle();
  if (!sm) return { restricted: false };

  const overCap = amountCents > Number(sm.per_txn_cap_cents);
  const typeRestricted = (sm.restricted_types ?? []).includes(txnType);
  const refused = overCap || typeRestricted;
  const reason = overCap
    ? `amount ${amountCents} exceeds the safe-mode cap ${sm.per_txn_cap_cents}`
    : `transaction type '${txnType}' is restricted while safe mode is active`;

  await emit(db, scope, `ev_smdec_${resourceId}`, "safe_mode.transaction.decided",
    "safe_mode", String(sm.id), {
      "transaction.amount": amountCents, "transaction.type": txnType,
      "safe_mode.daily_outflow_total": null,
      decision: refused ? "refused" : "allowed",
      ...(refused ? { reason } : {}),
      resource_id: resourceId,
    }, ctx);

  return refused ? { restricted: true, safeModeId: String(sm.id), reason } : { restricted: false };
}
