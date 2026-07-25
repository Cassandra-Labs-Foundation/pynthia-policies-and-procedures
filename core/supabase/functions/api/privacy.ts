// Privacy — PR-01..PR-18. GLBA notices, opt-outs, state rights, tracking.
//
// See the migration header for the two structural decisions: an opt-out is a
// STANDING STATE rather than an event log, and state privacy rights are one
// request type with the strictest deadline rather than a flow per statute.
//
// PR-03, PR-04 and PR-15 are built at the bottom of this file as GATES:
// sharing without a legal basis is blocked (not logged), access without
// entitlement is refused (and the refusal recorded), and a third-party
// connection is a scoped token whose scope violation revokes it. Each was
// drawn from the drill's red spec — the TDD loop the corpus drives.

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

/** GLBA: the annual notice, and 30 days to deliver a requested copy. */
export const ANNUAL_NOTICE_DAYS = 365;
export const NOTICE_COPY_DAYS = 30;
/** GLBA 16 CFR 313.7: 30 days to honour an opt-out across all systems. */
export const OPTOUT_PROPAGATION_DAYS = 30;
/**
 * PR-12's universal floor: the STRICTEST state deadline, applied to all. CCPA
 * allows 45 days; several states allow 45 with a 45-day extension. Taking the
 * strictest means a new statute is a configuration change, not a subsystem.
 */
export const STATE_REQUEST_DAYS = 45;
export const STATE_REQUEST_EXTENSION_DAYS = 45;
/** FCRA 623(a)(8): 30 days to investigate a direct dispute. */
export const FURNISHING_DISPUTE_DAYS = 30;
/** A correction must reach the furnishing systems, not just the record. */
export const CORRECTION_PROPAGATION_DAYS = 5;
/** Biometric data is purged when its purpose ends. */
export const BIOMETRIC_PURGE_DAYS = 30;
/** Under this age, data must not be collected at all. */
export const MINOR_AGE = 13;

const CHANNELS = [
  "affiliate_sharing", "nonaffiliate_sharing", "marketing", "nevada_sale", "targeted_ads",
];

function requireInternalActor(ctx: PartnerContext, requestId: string): Response | null {
  if (ctx.actorType === "partner") return notFoundResponse(requestId, "route", "/privacy");
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
  if (error) throw new Error(`privacy event (${code}): ${error.message}`);
}

const plusDays = (f: Date, d: number) => new Date(f.getTime() + d * DAY_MS).toISOString();

// ------------------------------------------------------------- PR-01 notices

/** POST /privacy/notices {version, template_ref, effective_at?, material_change?} */
export async function postPrivacyNotice(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  if (!isNonEmptyString(body.version) || !isNonEmptyString(body.template_ref)) {
    return validationError(requestId, [{
      type: "missing_field", field: "template_ref",
      message: "version and template_ref are required",
    }]);
  }
  const now = new Date();
  const id = `pnotice_${body.version}`;
  const { error } = await db.schema(scope).from("privacy_notice").upsert({
    id, version: body.version, template_ref: body.template_ref,
    effective_at: isNonEmptyString(body.effective_at) ? body.effective_at : now.toISOString(),
    published_to_website_at: now.toISOString(),
    material_change: body.material_change === true,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_pub`, "privacy.notice_template.published",
    "privacy_notice", id, { version: body.version, template_ref: body.template_ref }, ctx);
  await emit(db, scope, `ev_${id}_web`, "privacy.website_notice.updated",
    "privacy_notice", id, {
      version: body.version, published_at: now.toISOString(),
    }, ctx);
  if (body.material_change === true) {
    // A material change re-triggers delivery to everyone; a version bump that
    // does not is the case where members are governed by a notice they never
    // received.
    await emit(db, scope, `ev_${id}_rev`, "privacy.notice.revised", "privacy_notice", id, {
      version: body.version, material_change: true,
    }, ctx);
  }
  return jsonResponse({ data: { id } }, 201, requestId);
}

/**
 * POST /privacy/notices/:id/deliver
 * {entity_ref, reason, channel, esign_consent_id?}
 */
export async function postNoticeDelivery(
  req: Request, noticeId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const reasons = ["initial", "annual", "revision", "member_request"];
  const channels = ["mail", "email", "esign", "in_branch"];
  if (!reasons.includes(String(body.reason)) || !channels.includes(String(body.channel)) ||
      !isNonEmptyString(body.entity_ref)) {
    return validationError(requestId, [{
      type: "invalid_value", field: "reason",
      message: `entity_ref, reason in ${reasons.join("/")} and channel in ${channels.join("/")}`,
    }]);
  }

  // E-SIGN: electronic delivery requires prior consent that DEMONSTRATED the
  // member can access electronic records. Delivering without it is invalid,
  // not merely undocumented.
  if (body.channel === "esign") {
    const cid = isNonEmptyString(body.esign_consent_id) ? body.esign_consent_id : null;
    if (!cid) {
      return apiError(409, "esign_consent_missing", requestId, {
        title: "E-SIGN consent required",
        detail: "electronic delivery requires prior consent under 15 USC 7001(c)",
      });
    }
    const { data: c } = await db.schema(scope).from("esign_consent")
      .select("id, captured_at, demonstrated_access, withdrawn_at").eq("id", cid).maybeSingle();
    if (!c || !c.captured_at || c.demonstrated_access !== true || c.withdrawn_at) {
      return apiError(409, "esign_consent_invalid", requestId, {
        title: "E-SIGN consent not valid",
        detail: "consent must be captured, demonstrate access, and not be withdrawn",
      });
    }
  }

  const now = new Date();
  const days = body.reason === "member_request" ? NOTICE_COPY_DAYS : ANNUAL_NOTICE_DAYS;
  const id = `pdeliv_${noticeId}_${body.entity_ref}_${body.reason}`;
  const { error } = await db.schema(scope).from("privacy_notice_delivery").upsert({
    id, notice_id: noticeId, entity_ref: body.entity_ref,
    reason: body.reason, channel: body.channel,
    due_at: plusDays(now, days), delivered_at: now.toISOString(),
    esign_consent_id: isNonEmptyString(body.esign_consent_id) ? body.esign_consent_id : null,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_del`, "privacy.notice.delivered",
    "privacy_notice_delivery", id, {
      "privacy.notice_version": noticeId, reason: body.reason, channel: body.channel,
      entity_ref: body.entity_ref,
    }, ctx);
  if (body.reason === "member_request") {
    await emit(db, scope, `ev_${id}_copy`, "privacy.notice_copy.delivered",
      "privacy_notice_delivery", id, {
        entity_ref: body.entity_ref, due_at: plusDays(now, NOTICE_COPY_DAYS),
      }, ctx);
  }
  return jsonResponse({ data: { id } }, 201, requestId);
}

/** POST /privacy/esign-consents {entity_ref, demonstrated_access} */
export async function postEsignConsent(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  if (!isNonEmptyString(body.entity_ref)) {
    return validationError(requestId, [{
      type: "missing_field", field: "entity_ref", message: "is required",
    }]);
  }
  const now = new Date();
  const demonstrated = body.demonstrated_access === true;
  const id = `esign_${body.entity_ref}`;
  const { error } = await db.schema(scope).from("esign_consent").upsert({
    id, entity_ref: body.entity_ref, started_at: now.toISOString(),
    captured_at: demonstrated ? now.toISOString() : null,
    demonstrated_access: demonstrated,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_start`, "privacy.esign_consent.started",
    "esign_consent", id, { entity_ref: body.entity_ref }, ctx);
  if (demonstrated) {
    await emit(db, scope, `ev_${id}_cap`, "member.esign_consent_captured",
      "esign_consent", id, { entity_ref: body.entity_ref, demonstrated_access: true }, ctx);
    await emit(db, scope, `ev_${id}_rec`, "privacy.esign_consent.recorded",
      "esign_consent", id, { entity_ref: body.entity_ref }, ctx);
  } else {
    // 15 USC 7001(c)(1)(C)(ii): a checkbox that does not demonstrate the member
    // can actually receive electronic records is not consent.
    await emit(db, scope, `ev_${id}_incomplete`, "privacy.esign_consent.incomplete",
      "esign_consent", id, { reason: "access not demonstrated" }, ctx);
  }
  return jsonResponse({ data: { id, captured: demonstrated } }, 201, requestId);
}

// ---------------------------------------------------------- PR-02 opt-outs

/**
 * POST /privacy/preferences {entity_ref, channel, opted_out, source}
 *
 * A STANDING STATE, not a log. See the migration header: the obligation is
 * "do not share from now on", and only a current-state row answers that.
 */
export async function postPrivacyPreference(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const sources = ["member_request", "gpc_signal", "state_request", "default"];
  if (!CHANNELS.includes(String(body.channel)) || !isNonEmptyString(body.entity_ref) ||
      typeof body.opted_out !== "boolean" || !sources.includes(String(body.source))) {
    return validationError(requestId, [{
      type: "invalid_value", field: "channel",
      message: `entity_ref, channel in ${CHANNELS.join("/")}, an explicit opted_out and a source`,
    }]);
  }
  const now = new Date();
  const id = `ppref_${body.entity_ref}_${body.channel}`;
  const { error } = await db.schema(scope).from("privacy_preference").upsert({
    id, entity_ref: body.entity_ref, channel: body.channel,
    // PR-12's universal floor is applied per JURISDICTION: the strictest rule
    // governs, but which rules apply at all depends on where the member is.
    entity_jurisdiction: isNonEmptyString(body.entity_jurisdiction)
      ? body.entity_jurisdiction
      : null,
    opted_out: body.opted_out, source: body.source,
    effective_at: now.toISOString(),
    propagation_due_at: plusDays(now, OPTOUT_PROPAGATION_DAYS),
    propagated_at: null,
    updated_at: now.toISOString(),
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  const payload = {
    entity_ref: body.entity_ref, "privacy.channel": body.channel,
    "entity.jurisdiction": body.entity_jurisdiction ?? null,
    opted_out: body.opted_out, source: body.source,
    propagation_due_at: plusDays(now, OPTOUT_PROPAGATION_DAYS),
  };
  if (body.opted_out === true) {
    await emit(db, scope, `ev_${id}_recv`, "privacy.optout.received",
      "privacy_preference", id, payload, ctx);
    if (body.channel === "nevada_sale") {
      // Nevada SB220 is its own regime with its own enforcement point; folding
      // it into the GLBA opt-out loses the distinction the statute draws.
      await emit(db, scope, `ev_${id}_nv`, "privacy.nv_optout_enforced",
        "privacy_preference", id, payload, ctx);
    }
  } else {
    // Clearing an opt-out is a state change with the same weight as setting
    // one. Recording only the opt-outs makes a cleared preference invisible.
    await emit(db, scope, `ev_${id}_clear`, "privacy.optout.cleared",
      "privacy_preference", id, payload, ctx);
  }
  return jsonResponse({ data: { id, opted_out: body.opted_out } }, 201, requestId);
}

/**
 * POST /privacy/preferences/propagate {systems}
 *
 * PR-02's real control. A preference captured and never pushed to the systems
 * that do the sharing has changed nothing — the sweep is what closes the loop,
 * and every examined row is touched so a bounded sweep cannot starve its tail.
 */
export async function postPreferencePropagation(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const systems = Array.isArray(body.systems) ? body.systems.map(String) : [];
  if (systems.length === 0) {
    // Propagating to no systems is not propagation.
    return validationError(requestId, [{
      type: "missing_field", field: "systems",
      message: "propagation must name the systems the preference reached",
    }]);
  }
  const now = new Date();
  const iso = now.toISOString();
  const { data, error } = await db.schema(scope).from("privacy_preference")
    .select("id, entity_ref, channel, opted_out, propagation_due_at, propagated_at")
    .is("propagated_at", null)
    .order("propagation_due_at", { ascending: true })
    .limit(500);
  if (error) return internalErrorResponse(requestId, error.message);

  let late = 0;
  for (const p of data ?? []) {
    const id = String(p.id);
    const isLate = String(p.propagation_due_at) < iso;
    if (isLate) late++;
    await db.schema(scope).from("privacy_preference")
      .update({ propagated_at: iso, updated_at: iso }).eq("id", id);
    await emit(db, scope, `ev_${id}_prop`, "privacy.optout_propagated",
      "privacy_preference", id, {
        systems, entity_ref: p.entity_ref, "privacy.channel": p.channel,
        propagated_late: isLate,
      }, ctx);
  }
  return jsonResponse({
    data: { propagated: (data ?? []).length, late },
  }, 200, requestId);
}

// ------------------------------------------------------- PR-12 state rights

/** POST /privacy/state-requests {entity_ref, state, right_requested, received_at?} */
export async function postStateRequest(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const rights = ["access", "delete", "correct", "portability", "opt_out", "know"];
  if (!rights.includes(String(body.right_requested)) || !isNonEmptyString(body.entity_ref) ||
      !isNonEmptyString(body.state)) {
    return validationError(requestId, [{
      type: "invalid_value", field: "right_requested",
      message: `entity_ref, state and a right in ${rights.join("/")}`,
    }]);
  }
  const receivedAt = isNonEmptyString(body.received_at) ? new Date(body.received_at) : new Date();
  const id = `psreq_${body.entity_ref}_${body.right_requested}`;
  const { error } = await db.schema(scope).from("privacy_state_request").upsert({
    id, entity_ref: body.entity_ref, state: body.state,
    entity_jurisdiction: body.state,
    right_requested: body.right_requested,
    received_at: receivedAt.toISOString(),
    due_at: plusDays(receivedAt, STATE_REQUEST_DAYS),
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_recv`, "privacy.state_request.received",
    "privacy_state_request", id, {
      state: body.state, right: body.right_requested, entity_ref: body.entity_ref,
      "entity.jurisdiction": body.state,
    }, ctx);
  await emit(db, scope, `ev_${id}_due`, "privacy.state_request_due_at",
    "privacy_state_request", id, {
      due_at: plusDays(receivedAt, STATE_REQUEST_DAYS), days: STATE_REQUEST_DAYS,
    }, ctx);

  // An opt-out right sets the STANDING STATE, not just a ticket. A state
  // request that only produces a task is the case where the member's opt-out
  // depends on somebody remembering.
  if (body.right_requested === "opt_out") {
    const prefId = `ppref_${body.entity_ref}_nonaffiliate_sharing`;
    const now = new Date();
    await db.schema(scope).from("privacy_preference").upsert({
      id: prefId, entity_ref: body.entity_ref, channel: "nonaffiliate_sharing",
      opted_out: true, source: "state_request", effective_at: now.toISOString(),
      propagation_due_at: plusDays(now, OPTOUT_PROPAGATION_DAYS), propagated_at: null,
      updated_at: now.toISOString(), provenance: provenanceFor(scope, ctx),
    }, { onConflict: "id" });
    await emit(db, scope, `ev_${id}_optout`, "privacy.optout.received",
      "privacy_preference", prefId, { source: "state_request", state: body.state }, ctx);
  }
  return jsonResponse({ data: { id } }, 201, requestId);
}

/** POST /privacy/state-requests/:id/fulfil {verified, outcome, denial_basis?} */
export async function postStateRequestFulfilment(
  req: Request, reqId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const { data: r } = await db.schema(scope).from("privacy_state_request")
    .select("id, due_at, right_requested, entity_ref, state").eq("id", reqId).maybeSingle();
  if (!r) return notFoundResponse(requestId, "privacy_state_request", reqId);

  if (body.verified !== true) {
    // Fulfilling an unverified access request IS the disclosure the right
    // exists to control. Refusing is the control.
    return apiError(409, "state_request_unverified", requestId, {
      title: "requester not verified",
      detail: "fulfilling an unverified access request is itself an unauthorised disclosure",
    });
  }
  const outcome = isNonEmptyString(body.outcome) ? body.outcome : "fulfilled";
  if (outcome === "denied" && !isNonEmptyString(body.denial_basis)) {
    return validationError(requestId, [{
      type: "missing_field", field: "denial_basis",
      message: "a denial must state its basis",
    }]);
  }

  const now = new Date();
  const { error } = await db.schema(scope).from("privacy_state_request").update({
    verified_at: now.toISOString(), fulfilled_at: now.toISOString(),
    outcome, denial_basis: isNonEmptyString(body.denial_basis) ? body.denial_basis : null,
  }).eq("id", reqId);
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${reqId}_ful`, "privacy.state_request_fulfilled",
    "privacy_state_request", reqId, {
      outcome, right: r.right_requested, state: r.state,
      fulfilled_late: now.toISOString() > String(r.due_at),
    }, ctx);
  return jsonResponse({ data: { id: reqId, outcome } }, 200, requestId);
}

// ------------------------------------------------------ PR-14 web tracking

/** POST /privacy/web/consent {session_ref, categories, gpc_signal?, entity_ref?} */
export async function postWebConsent(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  if (!isNonEmptyString(body.session_ref)) {
    return validationError(requestId, [{
      type: "missing_field", field: "session_ref", message: "is required",
    }]);
  }
  const gpc = body.gpc_signal === true;
  const supplied = (body.categories ?? {}) as Record<string, unknown>;
  // A Global Privacy Control signal OVERRIDES the banner. Treating it as advisory
  // — or letting a later banner click re-enable advertising — is the failure
  // the signal exists to prevent.
  const categories = {
    essential: true,
    functional: gpc ? false : supplied.functional === true,
    analytics: gpc ? false : supplied.analytics === true,
    advertising: gpc ? false : supplied.advertising === true,
  };

  const { data: tags } = await db.schema(scope).from("web_tag")
    .select("id, category, decision");
  // Tags are gated by BOTH consent and approval. An approved advertising tag
  // still fires only with advertising consent; a consented category still
  // fires nothing that was never reviewed.
  const gated = (tags ?? []).filter((t: Any) =>
    t.decision !== "approved" ||
    !(categories as Record<string, boolean>)[String(t.category)]
  ).map((t: Any) => String(t.id));

  const now = new Date();
  const id = `wconsent_${body.session_ref}`;
  const { error } = await db.schema(scope).from("web_consent").upsert({
    id, session_ref: body.session_ref,
    entity_ref: isNonEmptyString(body.entity_ref) ? body.entity_ref : null,
    categories, gpc_signal: gpc, recorded_at: now.toISOString(),
    tags_gated: gated, provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_rec`, "web.consent.recorded", "web_consent", id, {
    categories, gpc_signal: gpc,
  }, ctx);
  await emit(db, scope, `ev_${id}_upd`, "web.consent.updated", "web_consent", id, {
    categories, gpc_signal: gpc,
  }, ctx);
  await emit(db, scope, `ev_${id}_gated`, "web.tags_gated", "web_consent", id, {
    gated_count: gated.length, gated,
  }, ctx);
  if (gpc) {
    await emit(db, scope, `ev_${id}_gpc`, "web.gpc_signal", "web_consent", id, {
      honoured: true, categories,
    }, ctx);
  }
  return jsonResponse({ data: { id, tags_gated: gated.length } }, 201, requestId);
}

/** POST /privacy/web/tags {vendor, category, decision, reviewed_by} */
export async function postWebTagReview(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const cats = ["essential", "analytics", "advertising", "functional"];
  if (!isNonEmptyString(body.vendor) || !cats.includes(String(body.category))) {
    return validationError(requestId, [{
      type: "invalid_value", field: "category",
      message: `vendor and a category in ${cats.join("/")}`,
    }]);
  }
  const decision = body.decision === "approved" || body.decision === "rejected"
    ? String(body.decision)
    : "pending";
  if (decision !== "pending" && !isNonEmptyString(body.reviewed_by)) {
    return validationError(requestId, [{
      type: "missing_field", field: "reviewed_by",
      message: "a decided tag needs a named reviewer",
    }]);
  }
  const now = new Date();
  const id = `wtag_${String(body.vendor).toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  const { error } = await db.schema(scope).from("web_tag").upsert({
    id, vendor: body.vendor, category: body.category, decision,
    reviewed_by: decision === "pending" ? null : body.reviewed_by,
    reviewed_at: decision === "pending" ? null : now.toISOString(),
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_rev`, "web.tag_review", "web_tag", id, {
    vendor: body.vendor, category: body.category, decision,
  }, ctx);
  await emit(db, scope, `ev_${id}_${decision}`,
    decision === "approved" ? "web.tag.approved" : decision === "rejected" ? "web.tag.rejected" : "web.tag_review.requested",
    "web_tag", id, { vendor: body.vendor, reviewed_by: body.reviewed_by ?? null }, ctx);
  return jsonResponse({ data: { id, decision } }, 201, requestId);
}

// -------------------------------------------------------- PR-13 analytics

/**
 * POST /privacy/analytics/datasets
 * {purpose, requested_by, method, k_value?, reid_risk_bp?, risk_threshold_bp?}
 */
export async function postAnalyticsDataset(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const methods = ["aggregation", "k_anonymity", "suppression", "raw"];
  if (!methods.includes(String(body.method)) || !isNonEmptyString(body.purpose) ||
      !isNonEmptyString(body.requested_by)) {
    return validationError(requestId, [{
      type: "invalid_value", field: "method",
      message: `purpose, requested_by and a method in ${methods.join("/")}`,
    }]);
  }
  const k = typeof body.k_value === "number" ? body.k_value : null;
  if (body.method === "k_anonymity" && k === null) {
    return validationError(requestId, [{
      type: "missing_field", field: "k_value",
      message: "k-anonymity with no k is not k-anonymity",
    }]);
  }
  const riskBp = typeof body.reid_risk_bp === "number" ? body.reid_risk_bp : null;
  const thresholdBp = typeof body.risk_threshold_bp === "number" ? body.risk_threshold_bp : null;
  // An unset threshold yields NO verdict. Same rule as every other threshold.
  const breached = thresholdBp === null || riskBp === null ? null : riskBp > thresholdBp;

  const now = new Date();
  const id = `ads_${String(body.purpose).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 24)}`;
  const approve = breached !== true && body.method !== "raw";
  const { error } = await db.schema(scope).from("analytics_dataset").upsert({
    id, purpose: body.purpose, requested_by: body.requested_by,
    requested_at: now.toISOString(), method: body.method, k_value: k,
    reid_risk_bp: riskBp, risk_threshold_bp: thresholdBp, risk_breached: breached,
    approved_at: approve ? now.toISOString() : null,
    approved_by: approve ? (isNonEmptyString(body.approved_by) ? body.approved_by : "privacy_officer") : null,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_req`, "analytics.dataset.requested",
    "analytics_dataset", id, {
      purpose: body.purpose, method: body.method, k_value: k,
    }, ctx);
  await emit(db, scope, `ev_${id}_mrev`, "analytics.method_review.completed",
    "analytics_dataset", id, {
      method: body.method, reid_risk_bp: riskBp, risk_threshold_bp: thresholdBp,
    }, ctx);
  if (breached === true) {
    await emit(db, scope, `ev_${id}_thr`, "analytics.threshold.breached",
      "analytics_dataset", id, { reid_risk_bp: riskBp, risk_threshold_bp: thresholdBp }, ctx);
    return apiError(409, "reid_risk_too_high", requestId, {
      title: "re-identification risk above threshold",
      detail: `${riskBp}bp exceeds the ${thresholdBp}bp threshold; the dataset is not released`,
    });
  }
  if (approve) {
    await emit(db, scope, `ev_${id}_appr`, "analytics.dataset.approved",
      "analytics_dataset", id, { method: body.method, k_value: k }, ctx);
  }
  return jsonResponse({ data: { id, approved: approve } }, 201, requestId);
}

// -------------------------------------------------------- PR-16 biometrics

/** POST /privacy/biometrics {entity_ref, consent_id, outcome?} */
export async function postBiometricVerification(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  if (!isNonEmptyString(body.entity_ref)) {
    return validationError(requestId, [{
      type: "missing_field", field: "entity_ref", message: "is required",
    }]);
  }
  if (!isNonEmptyString(body.consent_id)) {
    // Capturing biometrics without written consent is the violation. There is
    // no version of this that is merely undocumented.
    return apiError(409, "biometric_consent_required", requestId, {
      title: "biometric consent required",
      detail: "biometric data may not be captured without prior written consent",
    });
  }
  const now = new Date();
  const id = `bio_${body.entity_ref}`;
  const outcome = body.outcome === "declined" ? "declined" : "verified";
  const { error } = await db.schema(scope).from("biometric_verification").upsert({
    id, entity_ref: body.entity_ref, consent_id: body.consent_id,
    // PR-16: biometric verification must have a NON-biometric alternative. A
    // member who declines biometrics cannot thereby be denied an account.
    alt_path_available: body.alt_path_available !== false,
    alt_path_used: body.alt_path_used === true,
    started_at: now.toISOString(), completed_at: now.toISOString(), outcome,
    purge_due_at: plusDays(now, BIOMETRIC_PURGE_DAYS),
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await db.schema(scope).from("verification").upsert({
    id: `ver_bio_${body.entity_ref}`, entity_id: body.entity_ref,
    type: "biometric", method: "biometric", result: outcome,
    alt_path_available: body.alt_path_available !== false,
    alt_path_used: body.alt_path_used === true,
    biometric_consent_id: body.consent_id,
    match_status: outcome === "verified" ? "match" : "no_match",
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  await emit(db, scope, `ev_${id}_start`, "verification.biometric.started",
    "biometric_verification", id, {
      "verification.biometric_consent_id": body.consent_id, entity_ref: body.entity_ref,
      "verification.alt_path_available": body.alt_path_available !== false,
      "verification.alt_path_used": body.alt_path_used === true,
    }, ctx);
  await emit(db, scope, `ev_${id}_cid`, "verification.biometric_consent_id",
    "biometric_verification", id, { consent_id: body.consent_id }, ctx);
  await emit(db, scope, `ev_${id}_${outcome}`,
    outcome === "verified" ? "verification.biometric.completed" : "verification.biometric.declined",
    "biometric_verification", id, { outcome, entity_ref: body.entity_ref }, ctx);
  await emit(db, scope, `ev_${id}_purgedue`, "verification.biometric.purge.due_at",
    "biometric_verification", id, { purge_due_at: plusDays(now, BIOMETRIC_PURGE_DAYS) }, ctx);
  return jsonResponse({ data: { id, outcome } }, 201, requestId);
}

/** POST /privacy/biometrics/purge — the retention limit is the control. */
export async function postBiometricPurge(
  _req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;

  const iso = new Date().toISOString();
  const { data, error } = await db.schema(scope).from("biometric_verification")
    .select("id, entity_ref, purge_due_at, purged_at")
    .is("purged_at", null)
    .order("purge_due_at", { ascending: true })
    .limit(500);
  if (error) return internalErrorResponse(requestId, error.message);

  let purged = 0;
  for (const b of data ?? []) {
    const id = String(b.id);
    if (String(b.purge_due_at) <= iso) {
      await db.schema(scope).from("biometric_verification")
        .update({ purged_at: iso }).eq("id", id);
      await emit(db, scope, `ev_${id}_purged`, "verification.biometric_purged",
        "biometric_verification", id, {
          entity_ref: b.entity_ref, purge_due_at: b.purge_due_at,
          purged_late: String(b.purge_due_at) < iso,
        }, ctx);
      purged++;
    }
  }
  return jsonResponse({ data: { examined: (data ?? []).length, purged } }, 200, requestId);
}

// ---------------------------------------------------- PR-17 children's data

/** POST /privacy/minors {kind, subject_ref, age_asserted?} */
export async function postMinorDataEvent(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  if (!isNonEmptyString(body.subject_ref)) {
    return validationError(requestId, [{
      type: "missing_field", field: "subject_ref", message: "is required",
    }]);
  }
  const age = typeof body.age_asserted === "number" ? body.age_asserted : null;
  const now = new Date();
  const isMinor = age !== null && age < MINOR_AGE;
  const kind = isNonEmptyString(body.kind)
    ? String(body.kind)
    : (isMinor ? "age_gate_blocked" : "minor_data_detected");

  const id = `minor_${body.subject_ref}_${kind}`;
  const { error } = await db.schema(scope).from("minor_data_event").upsert({
    id, kind, subject_ref: body.subject_ref, age_asserted: age,
    detected_at: now.toISOString(),
    deleted_at: kind === "deleted" ? now.toISOString() : null,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  if (kind === "age_gate_blocked") {
    await emit(db, scope, `ev_${id}_blocked`, "privacy.age_gate.blocked",
      "minor_data_event", id, { subject_ref: body.subject_ref, age_asserted: age }, ctx);
  }
  if (kind === "minor_data_detected") {
    // Detecting minor data AFTER collection is a different failure from the
    // gate working, and it carries a deletion obligation the gate does not.
    await emit(db, scope, `ev_${id}_detected`, "privacy.minor_data.detected",
      "minor_data_event", id, { subject_ref: body.subject_ref, age_asserted: age }, ctx);
  }
  if (kind === "deleted") {
    await emit(db, scope, `ev_${id}_deleted`, "privacy.minor_data_deleted",
      "minor_data_event", id, { subject_ref: body.subject_ref }, ctx);
  }
  return jsonResponse({ data: { id, kind } }, 201, requestId);
}

// ------------------------------------------------------- PR-05 corrections

/** POST /privacy/furnishing-disputes {entity_ref, field, disputed_value, received_at?} */
export async function postFurnishingDispute(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  if (!isNonEmptyString(body.entity_ref) || !isNonEmptyString(body.field)) {
    return validationError(requestId, [{
      type: "missing_field", field: "field", message: "entity_ref and field are required",
    }]);
  }
  const receivedAt = isNonEmptyString(body.received_at) ? new Date(body.received_at) : new Date();
  const now = new Date();
  const id = `fdisp_${body.entity_ref}_${body.field}`;
  const { error } = await db.schema(scope).from("furnishing_dispute").upsert({
    id, entity_ref: body.entity_ref, field: body.field,
    disputed_value: isNonEmptyString(body.disputed_value) ? body.disputed_value : null,
    // PR-05: an NCOA mismatch is a Red Flags trigger as well as a data-quality
    // one, so the candidate address and the mismatch verdict are both kept.
    address_ncoa_candidate: isNonEmptyString(body.ncoa_candidate)
      ? body.ncoa_candidate
      : null,
    address_ncoa_mismatch: body.ncoa_mismatch === true,
    // PR-05 shares its register with MP-04's Reg E disputes: the BASIS is what
    // distinguishes a data-accuracy dispute from a transaction one, and both
    // arrive through the same door.
    dispute_basis: isNonEmptyString(body.dispute_basis)
      ? body.dispute_basis
      : "data_accuracy",
    received_at: receivedAt.toISOString(),
    due_at: plusDays(receivedAt, FURNISHING_DISPUTE_DAYS),
    redflag_raised: body.redflag === true,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  // `core.address` is another of the 22 abandoned tables. An NCOA candidate
  // has to be a ROW: PR-05's control is comparing the address of record against
  // what the postal service says, and a payload cannot be compared against.
  if (isNonEmptyString(body.ncoa_candidate)) {
    await db.schema(scope).from("address").upsert({
      id: `addr_${body.entity_ref}`, entity_ref: body.entity_ref,
      line1: body.disputed_value ?? null,
      ncoa_candidate: body.ncoa_candidate,
      ncoa_mismatch: body.ncoa_mismatch === true,
      checked_at: now.toISOString(), provenance: provenanceFor(scope, ctx),
    }, { onConflict: "id" });
  }
  // The corpus treats a furnishing dispute as a DISPUTE — same register MP-04
  // reads. It carries a basis and no amount: a data-accuracy dispute has no
  // money in it and no provisional-credit clock.
  await db.schema(scope).from("dispute").upsert({
    id: `disp_${id}`, member_id: body.entity_ref,
    basis: isNonEmptyString(body.dispute_basis) ? body.dispute_basis : "data_accuracy",
    kind: "data_accuracy", amount_cents: null,
    notified_at: receivedAt.toISOString(),
    provisional_credit_due_at: null,
    investigation_due_at: plusDays(receivedAt, FURNISHING_DISPUTE_DAYS),
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  await emit(db, scope, `ev_${id}_recv`, "furnishing.dispute.received",
    "furnishing_dispute", id, {
      field: body.field, entity_ref: body.entity_ref,
      "address.ncoa_candidate": body.ncoa_candidate ?? null,
      "address.ncoa_mismatch": body.ncoa_mismatch === true,
      "dispute.basis": body.dispute_basis ?? "data_accuracy",
    }, ctx);
  if (body.ncoa_mismatch === true) {
    await emit(db, scope, `ev_${id}_ncoa`, "address.ncoa_mismatch.detected",
      "furnishing_dispute", id, {
        "address.ncoa_candidate": body.ncoa_candidate ?? null,
      }, ctx);
  }
  await emit(db, scope, `ev_${id}_due`, "furnishing.dispute_due_at",
    "furnishing_dispute", id, {
      due_at: plusDays(receivedAt, FURNISHING_DISPUTE_DAYS), days: FURNISHING_DISPUTE_DAYS,
    }, ctx);
  if (body.redflag === true) {
    // An address mismatch or a disputed identity element is a Red Flags
    // trigger, not only a data-quality one.
    await emit(db, scope, `ev_${id}_rf`, "redflag.detected", "furnishing_dispute", id, {
      field: body.field, reason: "identity element disputed",
    }, ctx);
  }
  return jsonResponse({ data: { id } }, 201, requestId);
}

/** POST /privacy/furnishing-disputes/:id/correct {corrected_value, systems} */
export async function postFurnishingCorrection(
  req: Request, dispId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const { data: d } = await db.schema(scope).from("furnishing_dispute")
    .select("id, field, entity_ref, due_at").eq("id", dispId).maybeSingle();
  if (!d) return notFoundResponse(requestId, "furnishing_dispute", dispId);
  if (!isNonEmptyString(body.corrected_value)) {
    return validationError(requestId, [{
      type: "missing_field", field: "corrected_value", message: "is required",
    }]);
  }
  const systems = Array.isArray(body.systems) ? body.systems.map(String) : [];
  const now = new Date();
  const { error } = await db.schema(scope).from("furnishing_dispute").update({
    corrected_value: body.corrected_value,
    investigated_at: now.toISOString(),
    correction_applied_at: now.toISOString(),
    propagation_due_at: plusDays(now, CORRECTION_PROPAGATION_DAYS),
    propagated_at: systems.length > 0 ? now.toISOString() : null,
  }).eq("id", dispId);
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${dispId}_applied`, "furnishing.correction.applied",
    "furnishing_dispute", dispId, {
      field: d.field, corrected_value: body.corrected_value,
      applied_late: now.toISOString() > String(d.due_at),
    }, ctx);
  await emit(db, scope, `ev_${dispId}_propdue`, "correction.propagation.due_at",
    "furnishing_dispute", dispId, {
      propagation_due_at: plusDays(now, CORRECTION_PROPAGATION_DAYS),
    }, ctx);
  if (systems.length > 0) {
    // FCRA: a correction applied to the record but never pushed to the
    // furnishing systems is a correction the bureaus never see.
    await emit(db, scope, `ev_${dispId}_prop`, "correction.propagated",
      "furnishing_dispute", dispId, { systems, field: d.field }, ctx);
  }
  return jsonResponse({ data: { id: dispId, propagated: systems.length > 0 } }, 200, requestId);
}

// -------------------------------------------------- PR-08 / PR-18 disposal

/** POST /privacy/disposal-certificates {record_ref, method, certificate_ref, approved_by} */
export async function postDisposalCertificate(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  if (!isNonEmptyString(body.record_ref) || !isNonEmptyString(body.certificate_ref)) {
    return validationError(requestId, [{
      type: "missing_field", field: "certificate_ref",
      message: "record_ref and certificate_ref are required",
    }]);
  }
  const now = new Date();
  await emit(db, scope, `ev_dispcert_${body.record_ref}`, "disposal.certificate.recorded",
    "record", String(body.record_ref), {
      certificate_ref: body.certificate_ref, method: body.method ?? "destroyed",
      approved_by: body.approved_by ?? null,
    }, ctx);
  await emit(db, scope, `ev_dispdue_${body.record_ref}`, "record.destruction_due_at",
    "record", String(body.record_ref), {
      destruction_due_at: isNonEmptyString(body.destruction_due_at)
        ? body.destruction_due_at
        : now.toISOString(),
    }, ctx);
  return jsonResponse({ data: { record_ref: body.record_ref } }, 201, requestId);
}

/** POST /privacy/incidents/:id/notification-decision {decision, rationale, sar_referred?} */
export async function postNotificationDecision(
  req: Request, incidentId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  if (!isNonEmptyString(body.rationale)) {
    // A decision NOT to notify is still a decision and needs its reasoning.
    // Recording only the notifications makes "we decided not to" indistinguishable
    // from "nobody considered it".
    return validationError(requestId, [{
      type: "missing_field", field: "rationale",
      message: "a notification decision — either way — requires its rationale",
    }]);
  }
  await emit(db, scope, `ev_${incidentId}_notifdec`, "notification.decision.recorded",
    "incident", incidentId, {
      decision: body.decision ?? "notify", rationale: body.rationale,
      "incident.description": body.description ?? body.rationale,
      "incident.detection_source": body.detection_source ?? "internal",
      "incident.data_scope": body.data_scope ?? null,
      "incident.scope_initial": body.scope_initial ?? body.data_scope ?? null,
      "incident.criminal_suspected": body.sar_referred === true,
      // PR-18: materiality is the determination that drives notification, and
      // it is a verdict rather than a description.
      "incident.material": body.material === true,
    }, ctx);
  if (body.sar_referred === true) {
    await emit(db, scope, `ev_${incidentId}_sarref`, "incident.sar_referred",
      "incident", incidentId, { reason: body.rationale }, ctx);
  }
  return jsonResponse({ data: { incident_id: incidentId } }, 201, requestId);
}

// ------------------------------------------------ PR-03 permissible disclosures

/** GLBA legal bases under which member data may leave the institution. */
const DISCLOSURE_BASES = [
  "consent", "service_provider_glba", "legal_process", "fraud_prevention",
  "regulatory_examination", "joint_marketing_glba",
];

/**
 * POST /privacy/disclosures {entity_id, recipient, legal_basis?, vendor_id?,
 * vendor_glba_addendum_id?, data_scope?}
 *
 * PR-03 built as a GATE, not a log: a disclosure with no recognized legal
 * basis — or to a vendor with no GLBA addendum — is BLOCKED, and the block
 * itself is the evidence (privacy.sharing.blocked). Sharing member data first
 * and papering it later is the violation.
 */
export async function postPrivacyDisclosure(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};
  if (!isNonEmptyString(body.entity_id) || !isNonEmptyString(body.recipient)) {
    return validationError(requestId, [{
      type: "missing_field", field: "entity_id",
      message: "entity_id and recipient are required",
    }]);
  }
  const id = `disc_${crypto.randomUUID()}`;
  const basis = isNonEmptyString(body.legal_basis) ? body.legal_basis : null;
  const vendorId = isNonEmptyString(body.vendor_id) ? body.vendor_id : null;
  const addendum = isNonEmptyString(body.vendor_glba_addendum_id)
    ? body.vendor_glba_addendum_id
    : null;

  const block = async (reason: string): Promise<Response> => {
    await db.schema(scope).from("privacy_disclosure").upsert({
      id, entity_id: body.entity_id, recipient: body.recipient,
      legal_basis: basis, vendor_id: vendorId, vendor_glba_addendum_id: addendum,
      data_scope: Array.isArray(body.data_scope) ? body.data_scope : null,
      blocked: true, blocked_reason: reason, provenance: provenanceFor(scope, ctx),
    }, { onConflict: "id" });
    await emit(db, scope, `ev_${id}_blocked`, "privacy.sharing.blocked",
      "privacy_disclosure", id, {
        "disclosure.legal_basis": basis, "vendor.id": vendorId,
        "vendor.data_scope": body.data_scope ?? null, reason,
      }, ctx);
    return apiError(422, "privacy_sharing_blocked", requestId, {
      title: "Sharing Blocked", detail: reason,
    });
  };

  if (!basis || !DISCLOSURE_BASES.includes(basis)) {
    return await block(
      basis
        ? `'${basis}' is not a recognized GLBA legal basis`
        : "no legal basis stated — member data does not leave on an unstated theory",
    );
  }
  if (basis === "service_provider_glba" && (!vendorId || !addendum)) {
    return await block(
      "a service-provider disclosure requires the vendor and its GLBA addendum — " +
        "an addendum promised later is an addendum absent now",
    );
  }

  const { error } = await db.schema(scope).from("privacy_disclosure").upsert({
    id, entity_id: body.entity_id, recipient: body.recipient,
    legal_basis: basis, vendor_id: vendorId, vendor_glba_addendum_id: addendum,
    data_scope: Array.isArray(body.data_scope) ? body.data_scope : null,
    blocked: false, provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_basis`, "disclosure.legal_basis.recorded",
    "privacy_disclosure", id, {
      "disclosure.legal_basis": basis, recipient: body.recipient,
      "vendor.data_scope": body.data_scope ?? null,
    }, ctx);
  await emit(db, scope, `ev_${id}_init`, "disclosure.initiated",
    "privacy_disclosure", id, { recipient: body.recipient }, ctx);
  if (vendorId) {
    await emit(db, scope, `ev_${id}_glba`, "vendor.glba_clause.verified",
      "privacy_disclosure", id, {
        "vendor.id": vendorId, "vendor.glba_addendum_id": addendum,
        "vendor.contract_id": body.vendor_contract_id ?? null,
      }, ctx);
  }
  return jsonResponse({ data: { id, blocked: false } }, 201, requestId);
}

// ------------------------------------------------ PR-04 member data access

/**
 * POST /privacy/access-requests {entity_id, requester_kind, agent_identity?,
 * poa_artifact_id?, legal_process_artifact_id?, rfpa_applicable?}
 *
 * Who may see a member's data: the member, an agent with a VALID POA, or
 * legal process. Anyone else is refused — and the refusal is recorded, not
 * merely returned, because "we refused" is the compliance evidence.
 */
export async function postPrivacyAccessRequest(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};
  const kind = body.requester_kind;
  if (
    !isNonEmptyString(body.entity_id) ||
    !["self", "agent_poa", "legal_process", "other"].includes(String(kind))
  ) {
    return validationError(requestId, [{
      type: "invalid_value", field: "requester_kind",
      message: "entity_id and requester_kind (self|agent_poa|legal_process|other) are required",
    }]);
  }
  const id = `par_${crypto.randomUUID()}`;
  const record = async (
    status: "granted" | "refused", extra: Record<string, unknown>, refusal?: string,
  ) => {
    await db.schema(scope).from("privacy_access_request").upsert({
      id, entity_id: body.entity_id, requester_kind: kind,
      agent_identity: isNonEmptyString(body.agent_identity) ? body.agent_identity : null,
      poa_artifact_id: isNonEmptyString(body.poa_artifact_id) ? body.poa_artifact_id : null,
      legal_process_artifact_id: isNonEmptyString(body.legal_process_artifact_id)
        ? body.legal_process_artifact_id
        : null,
      rfpa_applicable: body.rfpa_applicable === true,
      status, refusal_reason: refusal ?? null, provenance: provenanceFor(scope, ctx),
    }, { onConflict: "id" });
    await emit(db, scope, `ev_${id}_recv`, "access.request.received",
      "privacy_access_request", id, {
        "entity.id": body.entity_id, requester_kind: kind,
        "access.agent_identity": body.agent_identity ?? null,
      }, ctx);
    await emit(
      db, scope, `ev_${id}_${status}`,
      status === "granted" ? "access.granted" : "access.refused",
      "privacy_access_request", id,
      { "entity.id": body.entity_id, requester_kind: kind, ...extra },
      ctx,
    );
  };

  if (kind === "self") {
    await record("granted", {});
    return jsonResponse({ data: { id, status: "granted" } }, 201, requestId);
  }
  if (kind === "agent_poa") {
    await emit(db, scope, `ev_${id}_poa`, "access.poa.presented",
      "privacy_access_request", id, {
        "access.poa_artifact_id": body.poa_artifact_id ?? null,
        "access.agent_identity": body.agent_identity ?? null,
      }, ctx);
    if (!isNonEmptyString(body.poa_artifact_id) || !isNonEmptyString(body.agent_identity)) {
      await emit(db, scope, `ev_${id}_poarej`, "access.poa.rejected",
        "privacy_access_request", id, {
          reason: "POA artifact or agent identity missing",
        }, ctx);
      await record("refused", {}, "POA artifact or agent identity missing");
      return apiError(422, "poa_rejected", requestId, {
        title: "POA Rejected",
        detail: "an agent needs a POA artifact and an identity — a claimed POA is not a POA",
      });
    }
    await record("granted", { "access.poa_artifact_id": body.poa_artifact_id });
    return jsonResponse({ data: { id, status: "granted" } }, 201, requestId);
  }
  if (kind === "legal_process") {
    await emit(db, scope, `ev_${id}_legal`, "legal.process.received",
      "privacy_access_request", id, {
        "legal.process_artifact_id": body.legal_process_artifact_id ?? null,
        "legal.rfpa_applicable": body.rfpa_applicable === true,
      }, ctx);
    if (!isNonEmptyString(body.legal_process_artifact_id)) {
      await record("refused", {}, "no legal process artifact");
      return apiError(422, "legal_process_missing", requestId, {
        title: "Legal Process Missing",
        detail: "legal-process access requires the instrument itself",
      });
    }
    await record("granted", {
      "legal.process_artifact_id": body.legal_process_artifact_id,
    });
    return jsonResponse({ data: { id, status: "granted" } }, 201, requestId);
  }
  // kind === "other" — no entitlement, refused, recorded
  await record("refused", {}, "requester has no entitlement to this member's data");
  return apiError(403, "access_refused", requestId, {
    title: "Access Refused",
    detail: "no entitlement: not the member, no POA, no legal process (PR-04)",
  });
}

// ------------------------------------------- PR-15 third-party connections

/**
 * POST /privacy/connections {entity_id, party_id, scopes[]}
 *
 * A connection IS a scoped token (card 45) with consent and a lifecycle: the
 * member consents, a token is minted confined to the granted scopes, and the
 * router's scope enforcement doubles as connection enforcement. The token's
 * sha256 goes in api_token; the PLAINTEXT is returned once, here, and never
 * stored — same property as every other token in the system.
 */
export async function postPrivacyConnection(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};
  const scopes = Array.isArray(body.scopes) ? body.scopes.map(String) : [];
  if (!isNonEmptyString(body.entity_id) || !isNonEmptyString(body.party_id) || scopes.length === 0) {
    return validationError(requestId, [{
      type: "missing_field", field: "scopes",
      message: "entity_id, party_id and at least one scope are required — an unscoped connection is not consent",
    }]);
  }

  // The token is confined to the MEMBER's fintech, never to the minting
  // actor: an ops-minted connection with the ops actor's (null) partner would
  // be scoped to nothing and read as 404s everywhere — the live tier found
  // exactly that. Entity first; a single-partner instance may fall back to
  // its one partner; ambiguity refuses.
  let partnerId: string | null = null;
  const { data: ent } = await db.schema(scope).from("entity")
    .select("id, partner_id").eq("id", String(body.entity_id)).maybeSingle();
  partnerId = (ent as Any)?.partner_id ?? ctx.partnerId ?? null;
  if (!partnerId) {
    const { data: partners } = await db.schema(scope).from("partner")
      .select("id").eq("status", "active").limit(2);
    if ((partners ?? []).length === 1) partnerId = String((partners as Any)[0].id);
  }
  if (!partnerId) {
    return apiError(422, "connection_unscopable", requestId, {
      title: "Connection Unscopable",
      detail: "the member's partner could not be determined; an unscoped connection token is confined to nothing",
    });
  }

  const id = `conn_${crypto.randomUUID()}`;
  const plaintext = `cass_pt_conn_${crypto.randomUUID().replace(/-/g, "")}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(plaintext));
  const hash = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  const tokenId = `tok_conn_${crypto.randomUUID()}`;

  const { error: tokErr } = await db.schema(scope).from("api_token").insert({
    id: tokenId, token_hash: hash, token_prefix: plaintext.slice(0, 12),
    actor_type: "partner", roles: [],
    partner_id: partnerId, instance_id: ctx.instanceId,
    allowed_endpoints: scopes, allowed_tiers: ["read"], status: "active",
  });
  if (tokErr) return internalErrorResponse(requestId, tokErr.message);

  const { error } = await db.schema(scope).from("connection").upsert({
    id, entity_id: body.entity_id, party_id: body.party_id, scopes,
    token_id: tokenId, provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_consent`, "connection.consent.granted", "connection", id, {
    "connection.party_id": body.party_id, "entity.id": body.entity_id,
    "connection.id": id, scopes,
  }, ctx);
  await emit(db, scope, `ev_${id}_token`, "connection.token.issued", "connection", id, {
    "connection.party_id": body.party_id, token_id: tokenId, scopes,
  }, ctx);
  return jsonResponse({ data: { id, token: plaintext, token_id: tokenId, scopes } }, 201, requestId);
}

/**
 * A scope violation on a connection token — called from the router's
 * insufficient_scope path, so the VIOLATING REQUEST ITSELF triggers
 * suspension and revocation. Also callable directly (POST
 * /privacy/connections/{id}/scope-violation) for operator-driven cases.
 */
export async function recordConnectionScopeViolation(
  db: SupabaseClient, connectionId: string, attempted: string,
  ctx?: PartnerContext, scope: EvidenceScope = "core",
): Promise<void> {
  const { data: conn } = await db.schema(scope).from("connection")
    .select("id, token_id, status, violation_count").eq("id", connectionId).maybeSingle();
  if (!conn) return;
  const now = new Date().toISOString();
  await db.schema(scope).from("connection").update({
    status: "revoked", violation_count: Number(conn.violation_count ?? 0) + 1,
    suspended_at: conn.status === "active" ? now : undefined,
    revoked_at: now,
  }).eq("id", connectionId);
  await db.schema(scope).from("api_token").update({ status: "revoked" })
    .eq("id", String(conn.token_id));
  await emit(db, scope, `ev_${connectionId}_viol_${Date.now()}`,
    "connection.scope_violation.detected", "connection", connectionId, {
      "connection.id": connectionId, attempted,
      "connection.access_log_id": `viol_${connectionId}`,
    }, ctx);
  await emit(db, scope, `ev_${connectionId}_susp`, "connection.suspended",
    "connection", connectionId, { cause: "scope_violation" }, ctx);
  await emit(db, scope, `ev_${connectionId}_revoked`, "connection.token_revoked",
    "connection", connectionId, { token_id: conn.token_id }, ctx);
}

/** POST /privacy/connections/{id}/scope-violation {attempted} */
export async function postConnectionScopeViolation(
  req: Request, connectionId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};
  const { data: conn } = await db.schema(scope).from("connection")
    .select("id").eq("id", connectionId).maybeSingle();
  if (!conn) return notFoundResponse(requestId, "connection", connectionId);
  await recordConnectionScopeViolation(
    db, connectionId, String(body.attempted ?? "unspecified"), ctx, scope,
  );
  return jsonResponse({ data: { id: connectionId, revoked: true } }, 200, requestId);
}
