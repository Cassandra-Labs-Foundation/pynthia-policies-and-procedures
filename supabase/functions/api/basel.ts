// Basel II standardized approach (BA-03..BA-06) and business continuity
// (BC-05, BC-11, BC-13).
//
// See the migration header. The load-bearing decision: AN UNMAPPED EXPOSURE
// REFUSES. Weighting it zero is capital that does not exist, and it is the
// error a risk-weight engine makes silently — the ratio simply comes out
// better than it should and nothing in the output says why.

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

/** BC-05: an incident commander must be named inside this. */
export const IC_ASSIGNMENT_MINUTES = 15;
/** BC-05: first internal comms. */
export const COMMS_INITIAL_MINUTES = 60;
/** BC-13: the PIR draft clock, from incident closure. */
export const PIR_DRAFT_DAYS = 5;
/** BC-13: how long a corrective action may sit unapproved. */
export const CAP_APPROVAL_DAYS = 10;

/**
 * BA-06. The Basel payout ladder: the deeper into the buffer, the smaller the
 * share of earnings that may be distributed.
 */
export function maxPayoutRatioBp(shortfallBp: number, requirementBp: number): number {
  if (shortfallBp <= 0) return 10000;
  const quartile = shortfallBp / Math.max(requirementBp, 1);
  if (quartile <= 0.25) return 6000;
  if (quartile <= 0.5) return 4000;
  if (quartile <= 0.75) return 2000;
  return 0;
}

function requireInternalActor(ctx: PartnerContext, requestId: string): Response | null {
  if (ctx.actorType === "partner") return notFoundResponse(requestId, "route", "/basel");
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
  if (error) throw new Error(`basel event (${code}): ${error.message}`);
}

// ------------------------------------------------------------ BA-04 schedule

/** POST /basel/rwa-schedules {risk_weight_map, ccf_map, change_authority?, approved_by} */
export async function postRwaSchedule(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  if (body.risk_weight_map == null || !isNonEmptyString(body.approved_by)) {
    return validationError(requestId, [{
      type: "missing_field", field: "risk_weight_map",
      message: "a schedule needs its weights and an approver",
    }]);
  }
  const { data: prior } = await db.schema(scope).from("rwa_schedule")
    .select("id, rwa_schedule_version").is("superseded_at", null);
  const version = (prior ?? []).length + 1;
  if (version > 1 && !isNonEmptyString(body.change_authority)) {
    // Changing a STATUTORY schedule is not an ordinary edit. Without the
    // authority under which it changed, nobody can tell a rule change from a
    // convenient one — and a convenient one improves every ratio at once.
    return validationError(requestId, [{
      type: "missing_field", field: "change_authority",
      message: "changing a risk-weight schedule needs the authority for the change",
    }]);
  }
  const now = new Date();
  for (const p of prior ?? []) {
    await db.schema(scope).from("rwa_schedule")
      .update({ superseded_at: now.toISOString() }).eq("id", p.id);
  }
  const id = `rwasched_v${version}`;
  const { error } = await db.schema(scope).from("rwa_schedule").upsert({
    id, rwa_schedule_version: version,
    rwa_risk_weight_map: body.risk_weight_map as Any,
    rwa_ccf_map: (body.ccf_map ?? {}) as Any,
    rwa_weights: (body.risk_weight_map ?? {}) as Any,
    rwa_change_authority: isNonEmptyString(body.change_authority) ? body.change_authority : null,
    rwa_proposed_change: (body.proposed_change ?? null) as Any,
    capital_regulatory_preapproval_id: isNonEmptyString(body.regulatory_preapproval_id)
      ? body.regulatory_preapproval_id
      : null,
    approved_at: now.toISOString(), approved_by: body.approved_by,
    effective_at: now.toISOString(), superseded_at: null,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_ver`, "rwa.schedule_version", "rwa_schedule", id, {
    "rwa.schedule_version": version, "rwa.risk_weight_map": body.risk_weight_map,
    "rwa.weights": body.risk_weight_map, "rwa.ccf_map": body.ccf_map ?? {},
    "rwa.change_authority": body.change_authority ?? null,
    "rwa.proposed_change": body.proposed_change ?? null,
    "capital.regulatory_preapproval_id": body.regulatory_preapproval_id ?? null,
  }, ctx);
  return jsonResponse({ data: { id, version } }, 201, requestId);
}

// ------------------------------------------------------------- BA-06 buffers

/** POST /basel/buffers {as_of_date, cet1_ratio_bp, requirement_bp, ccyb_level_bp?} */
export async function postCapitalBuffer(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const cet1 = Number(body.cet1_ratio_bp ?? 0);
  const requirement = Number(body.requirement_bp ?? 0);
  if (!(requirement > 0)) {
    return validationError(requestId, [{
      type: "missing_field", field: "requirement_bp", message: "is required",
    }]);
  }
  const shortfall = Math.max(0, requirement - cet1);
  const status = shortfall <= 0 ? "met" : "breached";
  // INSTITUTIONAL (§5k): no configured CCyB means NO payout cap, which means no
  // distribution verdict — not an unrestricted distribution.
  const ccyb = typeof body.ccyb_level_bp === "number" ? body.ccyb_level_bp : null;
  const maxPayout = ccyb === null ? null : maxPayoutRatioBp(shortfall, requirement);
  const proposed = typeof body.proposed_distribution_amount_cents === "number"
    ? body.proposed_distribution_amount_cents
    : null;
  const permitted = maxPayout === null
    ? null
    : (proposed === null ? true : maxPayout > 0);

  const now = new Date();
  const id = `capbuf_${body.as_of_date ?? "d"}`;
  const { error } = await db.schema(scope).from("capital_buffer").upsert({
    id, as_of_date: body.as_of_date ?? "2026-07-19",
    capital_cet1_ratio_bp: cet1, capital_buffer_requirement_bp: requirement,
    capital_buffer_shortfall_bp: shortfall, capital_buffer_status: status,
    capital_proposed_ccyb_level_bp: typeof body.proposed_ccyb_level_bp === "number"
      ? body.proposed_ccyb_level_bp
      : null,
    capital_ccyb_level_bp: ccyb, capital_max_payout_ratio_bp: maxPayout,
    capital_dividend_schedule: (body.dividend_schedule ?? null) as Any,
    capital_proposed_distribution_amount_cents: proposed,
    gl_loan_growth_yoy_bp: typeof body.loan_growth_yoy_bp === "number"
      ? body.loan_growth_yoy_bp
      : null,
    distribution_permitted: permitted, provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  const payload = {
    "capital.cet1_ratio": cet1, "capital.buffer_requirement": requirement,
    "capital.buffer_shortfall": shortfall, "capital.buffer_status": status,
    "capital.max_payout_ratio": maxPayout,
    "capital.ccyb_level": ccyb,
    "capital.proposed_ccyb_level": body.proposed_ccyb_level_bp ?? null,
    "capital.proposed_distribution_amount": proposed,
    "capital.dividend_schedule": body.dividend_schedule ?? null,
    "gl.loan_growth_yoy": body.loan_growth_yoy_bp ?? null,
    verdict: maxPayout === null ? "unassessed" : status,
  };
  await emit(db, scope, `ev_${id}_status`, "capital.buffer_status.recorded",
    "capital_buffer", id, payload, ctx);
  if (ccyb !== null) {
    await emit(db, scope, `ev_${id}_ccyb`, "capital.ccyb_level",
      "capital_buffer", id, payload, ctx);
    if (ccyb > 0) {
      await emit(db, scope, `ev_${id}_ccybact`, "capital.ccyb.activated",
        "capital_buffer", id, payload, ctx);
    }
    await emit(db, scope, `ev_${id}_payout`, "capital.max_payout_ratio",
      "capital_buffer", id, payload, ctx);
  }
  if (shortfall > 0) {
    await emit(db, scope, `ev_${id}_breach`, "capital.buffer.breached",
      "capital_buffer", id, payload, ctx);
    if (maxPayout !== null) {
      await emit(db, scope, `ev_${id}_restrict`, "capital.distribution_restriction.applied",
        "capital_buffer", id, payload, ctx);
    }
  }
  if (typeof body.loan_growth_yoy_bp === "number" && body.loan_growth_yoy_bp > 1500) {
    await emit(db, scope, `ev_${id}_growth`, "capital.credit_growth_threshold_crossed",
      "capital_buffer", id, payload, ctx);
  }
  return jsonResponse({
    data: { id, buffer_status: status, max_payout_ratio_bp: maxPayout },
  }, 201, requestId);
}

// ------------------------------------------------------------- BA-05 CFP

/** POST /basel/cfp-profiles {as_of_date, hqla_cents, net_outflows_30d_cents, cfp_level, ...} */
export async function postCfpProfile(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const levels = ["normal", "heightened", "stress", "crisis"];
  const level = levels.includes(String(body.cfp_level)) ? String(body.cfp_level) : "normal";
  if (level !== "normal" && body.liquidation_hierarchy == null) {
    // Deciding what to sell DURING the crisis is when the decision is worst.
    return validationError(requestId, [{
      type: "missing_field", field: "liquidation_hierarchy",
      message: "a CFP above normal must already say what gets liquidated first",
    }]);
  }
  const shares = Number(body.gl_total_shares_cents ?? 1);
  const hqla = Number(body.hqla_cents ?? 0);
  const now = new Date();
  const id = `cfpprof_${body.as_of_date ?? "d"}`;
  const { error } = await db.schema(scope).from("cfp_liquidity_profile").upsert({
    id, as_of_date: body.as_of_date ?? "2026-07-19",
    gl_total_shares_cents: shares, liquidity_hqla_balance_cents: hqla,
    liquidity_net_outflows_30d_cents: Number(body.net_outflows_30d_cents ?? 0),
    liquidity_asf_total_cents: Number(body.asf_total_cents ?? 0),
    liquidity_rsf_total_cents: Number(body.rsf_total_cents ?? 0),
    liquidity_clf_capacity_cents: Number(body.clf_capacity_cents ?? 0),
    liquidity_concentration: (body.concentration ?? {}) as Any,
    liquidity_ratio_to_shares_bp: Math.round((hqla / Math.max(shares, 1)) * 10000),
    liquidity_diversification_plan: isNonEmptyString(body.diversification_plan)
      ? body.diversification_plan
      : null,
    liquidity_stress: (body.stress ?? {}) as Any,
    cfp_level: level,
    cfp_liquidation_hierarchy: (body.liquidation_hierarchy ?? null) as Any,
    cfp_execution_plan_documented: body.execution_plan_documented === true,
    cfp_investment_test_due_at: new Date(now.getTime() + 365 * DAY_MS).toISOString(),
    cfp_investment_test_completed_at: body.investment_test_completed === true
      ? now.toISOString()
      : null,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  const payload = {
    "gl.total_shares": shares, "liquidity.hqla_balance": hqla,
    "liquidity.net_outflows_30d": body.net_outflows_30d_cents ?? 0,
    "liquidity.asf_total": body.asf_total_cents ?? 0,
    "liquidity.rsf_total": body.rsf_total_cents ?? 0,
    "liquidity.clf_capacity": body.clf_capacity_cents ?? 0,
    "liquidity.concentration": body.concentration ?? {},
    "liquidity.ratio_to_shares": Math.round((hqla / Math.max(shares, 1)) * 10000),
    "liquidity.diversification_plan": body.diversification_plan ?? null,
    "liquidity.stress": body.stress ?? {},
    "cfp.level": level, "cfp.liquidation_hierarchy": body.liquidation_hierarchy ?? null,
    "cfp.execution_plan_documented": body.execution_plan_documented === true,
    "cfp.investment.test.due_at": new Date(now.getTime() + 365 * DAY_MS).toISOString(),
  };
  await emit(db, scope, `ev_${id}_rep`, "liquidity.report", "cfp_liquidity_profile", id, payload, ctx);
  await emit(db, scope, `ev_${id}_lvl`, "cfp.level", "cfp_liquidity_profile", id, payload, ctx);
  await emit(db, scope, `ev_${id}_hier`, "cfp.liquidation_hierarchy",
    "cfp_liquidity_profile", id, payload, ctx);
  await emit(db, scope, `ev_${id}_div`, "liquidity.diversification_plan.logged",
    "cfp_liquidity_profile", id, payload, ctx);
  if (level !== "normal") {
    await emit(db, scope, `ev_${id}_trans`, "cfp.transition.started",
      "cfp_liquidity_profile", id, payload, ctx);
  }
  if (body.investment_test_completed === true) {
    await emit(db, scope, `ev_${id}_test`, "cfp.investment_test.completed",
      "cfp_liquidity_profile", id, payload, ctx);
  }
  return jsonResponse({ data: { id, cfp_level: level } }, 201, requestId);
}

// -------------------------------------------------------------- BC-11 comms

/** POST /bcp/comms-tree {contact_tree, stakeholder_matrix, primary, backup} */
export async function postCommsTree(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  if (body.contact_tree == null || String(body.primary) === String(body.backup)) {
    // The comms platform fails during exactly the incidents that need it. A
    // backup channel identical to the primary is not a backup.
    return validationError(requestId, [{
      type: "invalid_value", field: "backup",
      message: "a contact tree and a DISTINCT backup channel are required",
    }]);
  }
  const { error } = await db.schema(scope).from("comms_tree").upsert({
    id: "commstree", comms_contact_tree: body.contact_tree as Any,
    comms_stakeholder_matrix: (body.stakeholder_matrix ?? {}) as Any,
    primary_channel: String(body.primary ?? "email"),
    backup_channel: String(body.backup ?? "sms"),
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);
  return jsonResponse({ data: { id: "commstree" } }, 201, requestId);
}

/** POST /bcp/incidents/:id/comms {platform_failed?, media_inquiry?, ceo_approval?} — BC-11. */
export async function postIncidentComms(
  req: Request, incidentId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const { data: tree } = await db.schema(scope).from("comms_tree")
    .select("id, primary_channel, backup_channel, comms_contact_tree, comms_stakeholder_matrix")
    .eq("id", "commstree").maybeSingle();
  if (!tree) return notFoundResponse(requestId, "comms_tree", "commstree");

  const failed = body.platform_failed === true;
  const channel = failed ? tree.backup_channel : tree.primary_channel;
  const now = new Date();
  await db.schema(scope).from("incident").update({
    comms_initial_issued_at: now.toISOString(),
    comms_initial_due_at: new Date(now.getTime() + COMMS_INITIAL_MINUTES * 60_000).toISOString(),
  }).eq("id", incidentId);

  const payload = {
    "comms.contact_tree": tree.comms_contact_tree,
    "comms.stakeholder_matrix": tree.comms_stakeholder_matrix,
    "comms.holding_statement": body.holding_statement ?? null,
    "comms.ceo_approval": body.ceo_approval ?? null,
    channel,
  };
  await emit(db, scope, `ev_${incidentId}_alert`, "comms.internal_alert.issued",
    "incident", incidentId, payload, ctx);
  await emit(db, scope, `ev_${incidentId}_init`, "comms.initial.issued",
    "incident", incidentId, payload, ctx);
  if (failed) {
    // The failover is its own event because "we communicated" and "we
    // communicated on the backup because the primary was down" are different
    // facts, and the second one is what the post-incident review needs.
    await emit(db, scope, `ev_${incidentId}_backup`, "comms.backup.activated",
      "incident", incidentId, { ...payload, primary: tree.primary_channel }, ctx);
  }
  if (body.media_inquiry === true) {
    if (!isNonEmptyString(body.ceo_approval)) {
      return apiError(409, "media_response_unapproved", requestId, {
        title: "media response requires CEO approval",
        detail: "an unapproved media response is the institution speaking without deciding to",
      });
    }
    await emit(db, scope, `ev_${incidentId}_media`, "comms.media_response.logged",
      "incident", incidentId, payload, ctx);
  }
  return jsonResponse({ data: { incident_id: incidentId, channel } }, 201, requestId);
}

// ---------------------------------------------------------------- BC-13 PIR

/** POST /bcp/incidents/:id/pir {root_cause, timeline, impact_summary} */
export async function postPir(
  req: Request, incidentId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const draft = body.drafted !== false;
  if (draft && !(isNonEmptyString(body.root_cause) && body.timeline != null)) {
    // A PIR with no root cause has reviewed nothing; it is a summary of what
    // everyone already saw.
    return validationError(requestId, [{
      type: "missing_field", field: "root_cause",
      message: "a drafted PIR needs a root cause and a timeline",
    }]);
  }
  const now = new Date();
  const id = `pir_${incidentId}`;
  const { error } = await db.schema(scope).from("pir").upsert({
    id, incident_id: incidentId,
    incident_root_cause: isNonEmptyString(body.root_cause) ? body.root_cause : null,
    incident_timeline: (body.timeline ?? null) as Any,
    incident_impact_summary: isNonEmptyString(body.impact_summary)
      ? body.impact_summary
      : null,
    draft_due_at: new Date(now.getTime() + PIR_DRAFT_DAYS * DAY_MS).toISOString(),
    drafted_at: draft ? now.toISOString() : null,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  const payload = {
    "incident.root_cause": body.root_cause ?? null,
    "incident.timeline": body.timeline ?? null,
    "incident.impact_summary": body.impact_summary ?? null,
  };
  await emit(db, scope, `ev_${id}_timer`, "pir.draft_timer", "pir", id, {
    due_at: new Date(now.getTime() + PIR_DRAFT_DAYS * DAY_MS).toISOString(),
  }, ctx);
  if (draft) {
    await emit(db, scope, `ev_${id}_drafted`, "pir.drafted", "pir", id, payload, ctx);
  }
  return jsonResponse({ data: { id, drafted: draft } }, 201, requestId);
}

/** POST /bcp/pirs/:id/actions {description, owner, approved_by?, retest_result?} — BC-13. */
export async function postCorrectiveAction(
  req: Request, pirId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const { data: pir } = await db.schema(scope).from("pir")
    .select("id").eq("id", pirId).maybeSingle();
  if (!pir) return notFoundResponse(requestId, "pir", pirId);

  if (!isNonEmptyString(body.description) || !isNonEmptyString(body.owner)) {
    return validationError(requestId, [{
      type: "missing_field", field: "owner",
      message: "a corrective action needs a description and an owner",
    }]);
  }
  const retested = isNonEmptyString(body.retest_result);
  const completed = body.completed === true || retested;
  const now = new Date();
  const id = `cap_${pirId}_${body.key ?? crypto.randomUUID()}`;
  const { error } = await db.schema(scope).from("corrective_action").upsert({
    id, pir_id: pirId, description: body.description, owner: body.owner,
    due_at: new Date(now.getTime() + 30 * DAY_MS).toISOString(),
    approval_due_at: new Date(now.getTime() + CAP_APPROVAL_DAYS * DAY_MS).toISOString(),
    approved_at: isNonEmptyString(body.approved_by) ? now.toISOString() : null,
    approved_by: isNonEmptyString(body.approved_by) ? body.approved_by : null,
    completed_at: completed ? now.toISOString() : null,
    retest_verified_at: retested ? now.toISOString() : null,
    retest_result: retested ? body.retest_result : null,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_created`, "cap.item.created", "corrective_action", id, {
    description: body.description, owner: body.owner,
  }, ctx);
  await emit(db, scope, `ev_${id}_apprtimer`, "cap.approval.timer", "corrective_action", id, {
    due_at: new Date(now.getTime() + CAP_APPROVAL_DAYS * DAY_MS).toISOString(),
  }, ctx);
  if (isNonEmptyString(body.approved_by)) {
    await emit(db, scope, `ev_${id}_appr`, "cap.approved", "corrective_action", id, {
      approved_by: body.approved_by,
    }, ctx);
  }
  if (completed) {
    await emit(db, scope, `ev_${id}_done`, "cap.item.completed", "corrective_action", id, {}, ctx);
  }
  if (retested) {
    // "Completed" is the owner's opinion. The RETEST is the evidence, and a
    // corrective action nobody retested is one nobody knows worked.
    await emit(db, scope, `ev_${id}_retest`, "cap.retest.verified", "corrective_action", id, {
      result: body.retest_result,
    }, ctx);
  }
  return jsonResponse({ data: { id, retested } }, 201, requestId);
}
