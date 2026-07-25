// Resolution — RS-02, RS-04, RS-05, RS-06, RS-08.
//
// See the migration header. The one thing to carry in: A FREEZE IS A SET, NOT A
// FLAG. Freezes arrive from different authorities, overlap, and releasing one
// must not release the others. This is the legal-hold bug in a second place,
// and it is more expensive here — the failure releases money subject to a court
// order rather than making records disposal-eligible.

import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { type PartnerContext } from "./auth.ts";
import { type EvidenceScope, provenanceFor } from "./bsa.ts";
import {
  internalErrorResponse, isNonEmptyString, jsonResponse, notFoundResponse,
  parseJsonBody, validationError,
} from "./lib.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

/**
 * Freeze precedence. Lower wins when two freezes disagree about what is
 * permitted. Court process outranks everything the institution decides on its
 * own, because the institution does not get to weigh it.
 */
export const FREEZE_PRECEDENCE: Record<string, number> = {
  court_order: 10,
  tax_levy: 20,
  garnishment: 30,
  ofac: 40,
  institution_freeze: 50,
  fraud_hold: 60,
  member_request: 70,
};

/** Which freezes permit credits. A garnishment must not bounce payroll. */
const BLOCKS_CREDITS: Record<string, boolean> = {
  court_order: true,
  ofac: true,
  institution_freeze: true,
  tax_levy: false,
  garnishment: false,
  fraud_hold: false,
  member_request: false,
};

function requireInternalActor(ctx: PartnerContext, requestId: string): Response | null {
  if (ctx.actorType === "partner") return notFoundResponse(requestId, "route", "/resolution");
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
  if (error) throw new Error(`resolution event (${code}): ${error.message}`);
}

/**
 * Recompute the account's blocked state from the LIVE freezes.
 *
 * THE WHOLE POINT. Never "set frozen = false on release"; always derive from
 * what is still standing. The legal-hold bug was exactly the other thing, and
 * it passed its own test because the test asserted the buggy behaviour.
 */
async function recomputeFreezeState(
  db: SupabaseClient, scope: EvidenceScope, accountRef: string,
): Promise<{ debits: boolean; credits: boolean; count: number; winner: string | null }> {
  const { data: rows } = await db.schema(scope).from("account_freeze")
    .select("id, authority, precedence, blocks_debits, blocks_credits, released_at, account_ref")
    .eq("account_ref", accountRef);
  const live = (rows ?? []).filter((r: Any) => r.released_at == null);
  const debits = live.some((r: Any) => r.blocks_debits === true);
  const credits = live.some((r: Any) => r.blocks_credits === true);
  const winner = live.length
    ? live.slice().sort((a: Any, b: Any) => Number(a.precedence) - Number(b.precedence))[0]
      .authority as string
    : null;
  await db.schema(scope).from("account").update({
    debits_blocked: debits, credits_blocked: credits, active_freeze_count: live.length,
  }).eq("id", accountRef);
  return { debits, credits, count: live.length, winner };
}

// ------------------------------------------------------------------ RS-04

/** POST /resolution/freezes {account_ref, authority, order_reference, ...} */
export async function postAccountFreeze(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const authority = String(body.authority ?? "");
  if (!(authority in FREEZE_PRECEDENCE) || !isNonEmptyString(body.account_ref)) {
    return validationError(requestId, [{
      type: "invalid_value", field: "authority",
      message: `authority must be one of ${Object.keys(FREEZE_PRECEDENCE).join("/")}`,
    }]);
  }
  const legalAuthorities = ["court_order", "garnishment", "tax_levy"];
  if (legalAuthorities.includes(authority) && !isNonEmptyString(body.legal_process_reference)) {
    // A freeze under legal compulsion must name the process compelling it, or
    // nobody can later show it was lawful rather than arbitrary.
    return validationError(requestId, [{
      type: "missing_field", field: "legal_process_reference",
      message: "a freeze under legal process must name the process",
    }]);
  }
  const now = new Date();
  const id = `frz_${body.account_ref}_${authority}`;
  const { error } = await db.schema(scope).from("account_freeze").upsert({
    id, account_ref: body.account_ref, authority,
    precedence: FREEZE_PRECEDENCE[authority],
    blocks_debits: true, blocks_credits: BLOCKS_CREDITS[authority] === true,
    account_freeze_order_reference: isNonEmptyString(body.order_reference)
      ? body.order_reference
      : null,
    account_freeze_legal_process_reference: isNonEmptyString(body.legal_process_reference)
      ? body.legal_process_reference
      : null,
    applied_at: now.toISOString(), applied_by: ctx.tokenId,
    released_at: null, provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  const state = await recomputeFreezeState(db, scope, String(body.account_ref));
  await emit(db, scope, `ev_${id}_applied`, "account_freeze.applied", "account_freeze", id, {
    "account_freeze.order_reference": body.order_reference ?? null,
    "account_freeze.legal_process_reference": body.legal_process_reference ?? null,
    authority, blocks_credits: BLOCKS_CREDITS[authority] === true,
    active_freezes: state.count,
  }, ctx);
  if (state.count > 1) {
    // Two authorities on one account. Which one governs has to be RESOLVED and
    // recorded, not left to whichever code path runs last.
    await emit(db, scope, `ev_${id}_prec`, "account_freeze.precedence.resolved",
      "account_freeze", id, {
        governing_authority: state.winner, active_freezes: state.count,
        debits_blocked: state.debits, credits_blocked: state.credits,
      }, ctx);
  }
  return jsonResponse({
    data: { id, active_freezes: state.count, governing: state.winner },
  }, 201, requestId);
}

/** POST /resolution/freezes/:id/release {release_reference} — RS-04. */
export async function postFreezeRelease(
  req: Request, freezeId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const { data: row } = await db.schema(scope).from("account_freeze")
    .select("id, account_ref, authority").eq("id", freezeId).maybeSingle();
  if (!row) return notFoundResponse(requestId, "account_freeze", freezeId);

  if (!isNonEmptyString(body.release_reference)) {
    return validationError(requestId, [{
      type: "missing_field", field: "release_reference",
      message: "releasing a freeze needs the authority that released it",
    }]);
  }
  const now = new Date();
  const { error } = await db.schema(scope).from("account_freeze").update({
    released_at: now.toISOString(), released_by: ctx.tokenId,
    account_freeze_release_reference: body.release_reference,
  }).eq("id", freezeId);
  if (error) return internalErrorResponse(requestId, error.message);

  // DERIVED, not cleared. Releasing this freeze must not release the others.
  const state = await recomputeFreezeState(db, scope, String(row.account_ref));
  await emit(db, scope, `ev_${freezeId}_rel`, "account_freeze.released",
    "account_freeze", freezeId, {
      "account_freeze.release_reference": body.release_reference,
      authority: row.authority, remaining_freezes: state.count,
      still_blocked: state.debits,
    }, ctx);
  if (state.count > 0) {
    await emit(db, scope, `ev_${freezeId}_prec2`, "account_freeze.precedence.resolved",
      "account_freeze", freezeId, {
        governing_authority: state.winner, active_freezes: state.count,
      }, ctx);
  }
  return jsonResponse({
    data: { id: freezeId, remaining_freezes: state.count, debits_blocked: state.debits },
  }, 200, requestId);
}

/** POST /resolution/freezes/:id/credit {amount_cents} — a credit against a freeze. */
export async function postFrozenAccountCredit(
  req: Request, accountRef: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const state = await recomputeFreezeState(db, scope, accountRef);
  if (state.credits) {
    return jsonResponse({
      data: { posted: false, reason: "credits blocked", governing: state.winner },
    }, 200, requestId);
  }
  // A garnishment stops debits and PERMITS credits. Posting the member's
  // payroll while their account is frozen for a garnishment is correct
  // behaviour, not a leak, and it is the case a boolean flag gets wrong.
  await emit(db, scope, `ev_frz_${accountRef}_cr`, "account_freeze.credit.posted",
    "account", accountRef, {
      amount_cents: body.amount_cents ?? 0, governing_authority: state.winner,
      debits_blocked: state.debits, credits_blocked: state.credits,
    }, ctx);
  return jsonResponse({ data: { posted: true, governing: state.winner } }, 201, requestId);
}

// ------------------------------------------------------------------ RS-05

/** POST /resolution/institution-freeze {order_reference, notice_template_id, ...} */
export async function postInstitutionFreeze(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  if (!isNonEmptyString(body.order_reference) || !isNonEmptyString(body.ordered_by)) {
    return validationError(requestId, [{
      type: "missing_field", field: "order_reference",
      message: "an institution-wide freeze needs the order and who gave it",
    }]);
  }
  const activate = body.activate !== false;
  if (activate && body.activation_evidence == null) {
    // Activating without recording HOW leaves nothing to show an examiner and
    // nothing to reverse.
    return validationError(requestId, [{
      type: "missing_field", field: "activation_evidence",
      message: "activation must record how the freeze was actually applied",
    }]);
  }
  const publish = isNonEmptyString(body.notice_template_id);
  const now = new Date();
  const id = `instfrz_${body.order_reference}`;
  const { error } = await db.schema(scope).from("institution_freeze").upsert({
    id, institution_freeze_order_reference: body.order_reference,
    ordered_by: body.ordered_by, ordered_at: now.toISOString(),
    activated_at: activate ? now.toISOString() : null,
    activation_evidence: (body.activation_evidence ?? null) as Any,
    institution_freeze_notice_template_id: publish ? body.notice_template_id : null,
    notice_published_at: publish ? now.toISOString() : null,
    notice_record: publish
      ? { template_id: body.notice_template_id, channels: body.channels ?? ["website"] } as Any
      : null,
    regulator_confirmed_at: isNonEmptyString(body.regulator_reference)
      ? now.toISOString()
      : null,
    regulator_reference: isNonEmptyString(body.regulator_reference)
      ? body.regulator_reference
      : null,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  const payload = {
    "institution_freeze.order_reference": body.order_reference,
    "institution_freeze.notice_template_id": body.notice_template_id ?? null,
  };
  if (activate) {
    await emit(db, scope, `ev_${id}_act`, "institution_freeze.activated",
      "institution_freeze", id, payload, ctx);
    await emit(db, scope, `ev_${id}_evi`, "institution_freeze.activation_evidence",
      "institution_freeze", id, { ...payload, evidence: body.activation_evidence }, ctx);
  }
  if (publish) {
    // Members must be TOLD. A freeze nobody announced is indistinguishable from
    // an outage, and they phone the branch instead of reading the notice.
    await emit(db, scope, `ev_${id}_notice`, "institution_freeze.notice.published",
      "institution_freeze", id, payload, ctx);
    await emit(db, scope, `ev_${id}_noticerec`, "institution_freeze.notice_record",
      "institution_freeze", id, {
        ...payload, channels: body.channels ?? ["website"],
      }, ctx);
  }
  if (isNonEmptyString(body.regulator_reference)) {
    await emit(db, scope, `ev_${id}_reg`, "institution_freeze.regulator.confirmed",
      "institution_freeze", id, { reference: body.regulator_reference }, ctx);
  }
  return jsonResponse({ data: { id, activated: activate, notice_published: publish } }, 201, requestId);
}

// ------------------------------------------------------------------ RS-06

/** POST /resolution/member-portal {core_unavailable, claims_template_id, snapshot_as_of} */
export async function postMemberPortalState(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const activate = body.activate !== false;
  if (activate && !isNonEmptyString(body.snapshot_as_of)) {
    // RS-06 promises next-business-day availability. Read-only access serving
    // live balances from a core that is DOWN serves nothing — it has to serve a
    // snapshot, and a snapshot with no as-of date is a number the member cannot
    // interpret or rely on.
    return validationError(requestId, [{
      type: "missing_field", field: "snapshot_as_of",
      message: "read-only access must serve a dated snapshot, not a live read",
    }]);
  }
  const now = new Date();
  const { error } = await db.schema(scope).from("member_portal_state").upsert({
    id: "portal", readonly_activated_at: activate ? now.toISOString() : null,
    member_portal_core_unavailable: body.core_unavailable === true,
    member_portal_claims_template_id: isNonEmptyString(body.claims_template_id)
      ? body.claims_template_id
      : null,
    snapshot_as_of: activate ? body.snapshot_as_of : null,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  if (activate) {
    await emit(db, scope, `ev_portal_ro`, "member_portal.readonly.activated",
      "member_portal_state", "portal", {
        "member_portal.core_unavailable": body.core_unavailable === true,
        "member_portal.claims_template_id": body.claims_template_id ?? null,
        snapshot_as_of: body.snapshot_as_of,
      }, ctx);
  }
  return jsonResponse({ data: { activated: activate } }, 201, requestId);
}

/** POST /resolution/member-portal/access {member_ref} — RS-06. */
export async function postMemberPortalAccess(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const { data: state } = await db.schema(scope).from("member_portal_state")
    .select("id, snapshot_as_of, readonly_activated_at").eq("id", "portal").maybeSingle();
  if (!state?.readonly_activated_at) {
    return notFoundResponse(requestId, "member_portal_state", "portal");
  }
  const now = new Date();
  const id = `portacc_${body.member_ref}_${crypto.randomUUID()}`;
  const { error } = await db.schema(scope).from("member_portal_access").upsert({
    id, member_ref: String(body.member_ref ?? "unknown"), accessed_at: now.toISOString(),
    snapshot_served_as_of: state.snapshot_as_of, provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_srv`, "member_portal.snapshot_served",
    "member_portal_access", id, {
      "member.id": body.member_ref ?? null, snapshot_as_of: state.snapshot_as_of,
    }, ctx);
  // Access during a resolution is evidence: who saw what, as of when. It is
  // what answers a later dispute about what the member was told.
  await emit(db, scope, `ev_${id}_log`, "member_portal.access.logged",
    "member_portal_access", id, {
      "member.id": body.member_ref ?? null, accessed_at: now.toISOString(),
    }, ctx);
  return jsonResponse({ data: { id, snapshot_as_of: state.snapshot_as_of } }, 201, requestId);
}

// ------------------------------------------------------------------ RS-02

/** POST /resolution/ewi/indicators {indicator_id, name, thresholds?, schedule} */
export async function postEwiIndicator(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  if (!isNonEmptyString(body.indicator_id)) {
    return validationError(requestId, [{
      type: "missing_field", field: "indicator_id", message: "is required",
    }]);
  }
  const id = `ewi_${body.indicator_id}`;
  const { error } = await db.schema(scope).from("ewi_indicator").upsert({
    id, ewi_indicator_id: body.indicator_id,
    name: isNonEmptyString(body.name) ? body.name : String(body.indicator_id),
    // INSTITUTIONAL (§5k): nullable. Nobody's regulation sets an EWI threshold.
    ewi_thresholds: (body.thresholds ?? null) as Any,
    ewi_evaluation_schedule: isNonEmptyString(body.schedule) ? body.schedule : "daily",
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);
  return jsonResponse({ data: { id } }, 201, requestId);
}

/** POST /resolution/ewi/sweep {observations: [{indicator_id, value}]} — RS-02. */
export async function postEwiSweep(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const { data: inds } = await db.schema(scope).from("ewi_indicator")
    .select("id, ewi_indicator_id, ewi_thresholds, ewi_evaluation_schedule");
  const { data: priorObs } = await db.schema(scope).from("ewi_observation")
    .select("id, indicator_id, breached, observed_at, ewi_value");
  const obs = Array.isArray(body.observations) ? body.observations : [];
  const now = new Date();

  let breachCount = 0;
  const results: Any[] = [];
  for (const o of obs as Any[]) {
    const ind = (inds ?? []).find((i: Any) => i.ewi_indicator_id === o.indicator_id);
    if (!ind) continue;
    const thresholds = ind.ewi_thresholds as Any;
    const value = Number(o.value ?? 0);
    // §5k: no configured threshold, no verdict.
    const breached = thresholds == null
      ? null
      : value >= Number(thresholds.breach_at ?? Infinity);
    const prior = (priorObs ?? [])
      .filter((p: Any) => p.indicator_id === ind.id)
      .sort((a: Any, b: Any) => String(b.observed_at).localeCompare(String(a.observed_at)))[0];
    const priorState = prior ? (prior.breached as boolean | null) : null;
    if (breached === true) breachCount++;

    // NOT timestamp-keyed. Two sweeps inside the same clock tick would collide
    // on the id and the second would silently overwrite the first, taking the
    // prior-breach state with it — which is the input the re-alert suppression
    // depends on. Found by a mutation that survived only because the frozen
    // drill clock produced exactly that collision.
    const seq = (priorObs ?? []).filter((p: Any) => p.indicator_id === ind.id).length + 1;
    const oid = `ewiobs_${ind.id}_${seq}`;
    const { error } = await db.schema(scope).from("ewi_observation").upsert({
      id: oid, indicator_id: ind.id, observed_at: now.toISOString(),
      ewi_value: value,
      ewi_trend: prior
        ? (value > Number(prior.ewi_value) ? "worsening" : "improving")
        : "first",
      ewi_history: (priorObs ?? [])
        .filter((p: Any) => p.indicator_id === ind.id)
        .map((p: Any) => ({ at: p.observed_at, value: p.ewi_value })) as Any,
      ewi_prior_breach_state: priorState,
      breached, provenance: provenanceFor(scope, ctx),
    }, { onConflict: "id" });
    if (error) return internalErrorResponse(requestId, error.message);

    // A breach that was ALREADY breached is not new information; re-alerting on
    // it every sweep is how a real breach gets lost in the noise.
    if (breached === true && priorState !== true) {
      await emit(db, scope, `ev_${oid}_br`, "ewi.threshold.breached",
        "ewi_observation", oid, {
          "ewi.indicator_id": ind.ewi_indicator_id, "ewi.value": value,
          "ewi.thresholds": thresholds, "ewi.prior_breach_state": priorState,
          "ewi.trend": prior ? "worsening" : "first",
        }, ctx);
    }
    results.push({ indicator_id: ind.ewi_indicator_id, value, breached });
  }

  const sweepId = `ewisweep_${body.period ?? now.toISOString()}`;
  await emit(db, scope, `ev_${sweepId}_done`, "ewi.sweep.completed", "ewi_observation", sweepId, {
    "ewi.evaluation_schedule": (inds ?? [])[0]?.ewi_evaluation_schedule ?? "daily",
    "ewi.history": results, evaluated: results.length, breached: breachCount,
  }, ctx);

  // The posture is a STANDING STATE. It moves when the breach count crosses,
  // and the CEO summary goes out on the change, not on every sweep.
  const { data: postures } = await db.schema(scope).from("resolution_posture")
    .select("id, resolution_posture_current, changed_at");
  const current = (postures ?? []).sort((a: Any, b: Any) =>
    String(b.changed_at).localeCompare(String(a.changed_at)))[0];
  const target = breachCount >= 3 ? "heightened" : breachCount >= 1 ? "watch" : "normal";
  const currentPosture = current?.resolution_posture_current ?? "normal";
  if (target !== currentPosture) {
    const pid = `posture_${now.toISOString()}`;
    await db.schema(scope).from("resolution_posture").upsert({
      id: pid, resolution_posture_current: target, changed_at: now.toISOString(),
      changed_by: ctx.tokenId,
      reason: `${breachCount} early-warning indicator(s) breached`,
      provenance: provenanceFor(scope, ctx),
    }, { onConflict: "id" });
    await emit(db, scope, `ev_${pid}_chg`, "resolution_posture.changed",
      "resolution_posture", pid, {
        "resolution_posture.current": target, from: currentPosture, breached: breachCount,
      }, ctx);
    await emit(db, scope, `ev_${pid}_ceo`, "ewi.ceo_summary.sent",
      "resolution_posture", pid, {
        "ewi.ceo_summary": `posture ${currentPosture} -> ${target}: ${breachCount} indicator(s) breached`,
        "resolution_posture.current": target,
      }, ctx);
  }
  return jsonResponse({
    data: { evaluated: results.length, breached: breachCount, posture: target },
  }, 201, requestId);
}

// ------------------------------------------------------------------ RS-08

/** POST /resolution/records-packages {manifest_id, snapshot_as_of, artifacts} */
export async function postRecordsPackage(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  if (!isNonEmptyString(body.manifest_id)) {
    return validationError(requestId, [{
      type: "missing_field", field: "manifest_id",
      message: "a package is built against a manifest",
    }]);
  }
  const now = new Date();
  const id = `recpkg_${body.manifest_id}`;
  await db.schema(scope).from("records_package").upsert({
    id, records_package_manifest_id: body.manifest_id,
    records_package_snapshot_id: isNonEmptyString(body.snapshot_id) ? body.snapshot_id : null,
    records_package_snapshot_as_of: isNonEmptyString(body.snapshot_as_of)
      ? body.snapshot_as_of
      : null,
    records_package_snapshot_schedule: isNonEmptyString(body.snapshot_schedule)
      ? body.snapshot_schedule
      : "nightly",
    records_package_artifact_id: isNonEmptyString(body.artifact_id) ? body.artifact_id : null,
    build_started_at: now.toISOString(), provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });

  const payload = {
    "records_package.manifest_id": body.manifest_id,
    "records_package.snapshot_id": body.snapshot_id ?? null,
    "records_package.snapshot_as_of": body.snapshot_as_of ?? null,
    "records_package.snapshot_schedule": body.snapshot_schedule ?? "nightly",
    "records_package.artifact_id": body.artifact_id ?? null,
  };
  await emit(db, scope, `ev_${id}_start`, "records_package.build.started",
    "records_package", id, payload, ctx);

  // The integrity claim is a CHECKSUM CHAIN, not a status column. "Completed"
  // with no verifiable chain is a directory somebody said was fine.
  const chain = (body.checksum_chain ?? null) as Any;
  const expected = body.expected_checksum;
  const verified = chain != null &&
    (!isNonEmptyString(expected) || chain.root === expected);

  if (!verified) {
    const reason = chain == null
      ? "no checksum chain produced"
      : `chain root ${chain.root} does not match the expected ${expected}`;
    await db.schema(scope).from("records_package").update({
      records_package_checksum_chain: chain,
      verification_failed_at: now.toISOString(),
      records_package_failure_reason: reason,
    }).eq("id", id);
    // Completed and failed are mutually exclusive: a package that verified
    // badly and is still marked complete is the worst outcome here, because the
    // receiver trusts it.
    await emit(db, scope, `ev_${id}_fail`, "records_package.verification.failed",
      "records_package", id, { ...payload, "records_package.failure_reason": reason }, ctx);
    return jsonResponse({ data: { id, verified: false, reason } }, 200, requestId);
  }

  await db.schema(scope).from("records_package").update({
    records_package_checksum_chain: chain, completed_at: now.toISOString(),
  }).eq("id", id);
  await emit(db, scope, `ev_${id}_snap`, "records_package.snapshot.completed",
    "records_package", id, payload, ctx);
  await emit(db, scope, `ev_${id}_done`, "records_package.completed",
    "records_package", id, {
      ...payload, "records_package.checksum_chain": chain,
    }, ctx);
  return jsonResponse({ data: { id, verified: true } }, 201, requestId);
}
