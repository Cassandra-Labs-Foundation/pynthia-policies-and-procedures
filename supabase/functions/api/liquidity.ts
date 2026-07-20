// Liquidity — LQ-02, LQ-03, LQ-04, LQ-05, LQ-07, LQ-09.
//
// See the migration header. The one thing to carry in from it: the STATUTORY
// asset tier (§741.12) is derived and NOT NULL; every INSTITUTIONAL threshold
// — LAR bands, mismatch limits, survival horizon, headroom floor — is nullable
// and paired to its verdict. An unconfigured band produces "unassessed", never
// "within band". This is the capital pattern, predicted and confirmed.

import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { type PartnerContext } from "./auth.ts";
import { type EvidenceScope, provenanceFor } from "./bsa.ts";
import {
  internalErrorResponse, isNonEmptyString, jsonResponse, notFoundResponse,
  parseJsonBody, validationError,
} from "./lib.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
const DAY_MS = 24 * 60 * 60 * 1000;

/** NCUA §741.12 asset-size thresholds. STATUTORY — these are in the rule. */
export const CFP_REQUIRED_ASSETS_CENTS = 50_000_000_00;
export const FEDERAL_ACCESS_REQUIRED_ASSETS_CENTS = 250_000_000_00;
/** LQ-09: how often a facility must be proven to actually work. */
export const FACILITY_TEST_DAYS = 365;

/**
 * §741.12's tier, DERIVED from total assets. Never accepted from a caller: it
 * is a fact about the regulation applied to a number this system already holds,
 * and letting a caller assert it would let them assert out of an obligation.
 */
export function assetTier(totalAssetsCents: number): string {
  if (totalAssetsCents >= FEDERAL_ACCESS_REQUIRED_ASSETS_CENTS) return "over_250m";
  if (totalAssetsCents >= CFP_REQUIRED_ASSETS_CENTS) return "mid";
  return "under_50m";
}

/**
 * The band a ratio falls in, or NULL when no bands are configured.
 *
 * Returning "adequate" for an unconfigured system would be the flattering
 * error: an institution that never set a band reads as one that never breached.
 */
export function larBand(
  valueBp: number,
  cfg: { critical_bp: number; warning_bp: number; target_bp: number } | null,
): string | null {
  if (!cfg) return null;
  if (valueBp < cfg.critical_bp) return "critical";
  if (valueBp < cfg.warning_bp) return "warning";
  if (valueBp < cfg.target_bp) return "adequate";
  return "target";
}

function requireInternalActor(ctx: PartnerContext, requestId: string): Response | null {
  if (ctx.actorType === "partner") return notFoundResponse(requestId, "route", "/liquidity");
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
  if (error) throw new Error(`liquidity event (${code}): ${error.message}`);
}

// --------------------------------------------------------------- LQ-03 bands

/** POST /liquidity/lar-bands {critical_bp, warning_bp, target_bp, approved_by} */
export async function postLarBandConfig(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const crit = Number(body.critical_bp), warn = Number(body.warning_bp);
  const tgt = Number(body.target_bp);
  if (!(crit < warn && warn < tgt) || !isNonEmptyString(body.approved_by)) {
    // Bands that cross are not bands, and an unapproved band is a suggestion.
    return validationError(requestId, [{
      type: "invalid_value", field: "critical_bp",
      message: "bands must be strictly ordered and approved by someone",
    }]);
  }
  const now = new Date();
  const { data: prior } = await db.schema(scope).from("lar_band_config")
    .select("id, version").is("superseded_at", null);
  const version = (prior ?? []).length + 1;
  for (const p of prior ?? []) {
    await db.schema(scope).from("lar_band_config")
      .update({ superseded_at: now.toISOString() }).eq("id", p.id);
  }
  const id = `larcfg_v${version}`;
  const { error } = await db.schema(scope).from("lar_band_config").upsert({
    id, version, critical_bp: crit, warning_bp: warn, target_bp: tgt,
    approved_by: body.approved_by, effective_at: now.toISOString(),
    superseded_at: null, provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);
  return jsonResponse({ data: { id, version } }, 201, requestId);
}

/**
 * POST /liquidity/positions {as_of_date, liquid_assets_cents, total_assets_cents, ...}
 *
 * LQ-03 and the anchor for LQ-02 and LQ-07.
 */
export async function postLiquidityPosition(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const total = Number(body.total_assets_cents ?? 0);
  const liquid = Number(body.liquid_assets_cents ?? 0);
  if (!(total > 0) || body.haircut_table == null) {
    // A ratio with no haircut table is a ratio nobody can reproduce.
    return validationError(requestId, [{
      type: "missing_field", field: "haircut_table",
      message: "total assets and the haircut table applied are both required",
    }]);
  }
  const larBp = Math.round((liquid / total) * 10000);
  const { data: cfgs } = await db.schema(scope).from("lar_band_config")
    .select("id, critical_bp, warning_bp, target_bp").is("superseded_at", null);
  const cfg = (cfgs ?? [])[0] ?? null;
  const band = larBand(larBp, cfg as Any);

  const { data: priors } = await db.schema(scope).from("liquidity_position")
    .select("id, as_of_date, lar_current_band");
  const prior = (priors ?? [])
    .filter((p: Any) => String(p.as_of_date) < String(body.as_of_date))
    .sort((a: Any, b: Any) => String(b.as_of_date).localeCompare(String(a.as_of_date)))[0];

  const now = new Date();
  const id = `liqpos_${body.as_of_date}`;
  const { error } = await db.schema(scope).from("liquidity_position").upsert({
    id, as_of_date: body.as_of_date,
    gl_balances: (body.gl_balances ?? {}) as Any,
    liquidity_liquid_assets_cents: liquid,
    liquidity_total_assets_cents: total,
    liquidity_haircut_table: body.haircut_table as Any,
    liquidity_behavioral_assumptions: (body.behavioral_assumptions ?? {}) as Any,
    lar_value_bp: larBp,
    // STATUTORY: derived, never supplied.
    asset_tier: assetTier(total),
    band_config_id: cfg ? cfg.id : null,
    lar_current_band: band,
    lar_prior_band: prior ? prior.lar_current_band : null,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  const payload = {
    "lar.value": larBp, "lar.current_band": band, "lar.prior_band": prior?.lar_current_band ?? null,
    "liquidity.liquid_assets": liquid, "liquidity.total_assets": total,
    "liquidity.haircut_table": body.haircut_table,
    asset_tier: assetTier(total),
    // The honest form of an unconfigured system. See the module header.
    verdict: band ?? "unassessed",
  };
  await emit(db, scope, `ev_${id}_lar`, "lar.computed", "liquidity_position", id, payload, ctx);
  if (band && prior && prior.lar_current_band !== band) {
    await emit(db, scope, `ev_${id}_bandchg`, "alert.lar_band_change",
      "liquidity_position", id, { from: prior.lar_current_band, to: band }, ctx);
    await emit(db, scope, `ev_${id}_bandalert`, "lar.band_alert.issued",
      "liquidity_position", id, payload, ctx);
  } else if (band) {
    await emit(db, scope, `ev_${id}_bandalert`, "lar.band_alert.issued",
      "liquidity_position", id, payload, ctx);
  }
  if (band === "critical") {
    await emit(db, scope, `ev_${id}_crit`, "lar.critical.breached",
      "liquidity_position", id, payload, ctx);
  }
  return jsonResponse({
    data: { id, lar_value_bp: larBp, band, verdict: band ?? "unassessed", asset_tier: assetTier(total) },
  }, 201, requestId);
}

// ------------------------------------------------------------ LQ-02 mismatch

/** POST /liquidity/positions/:id/mismatch {gaps, limit?, disposition?} */
export async function postMaturityMismatch(
  req: Request, positionId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const { data: pos } = await db.schema(scope).from("liquidity_position")
    .select("id, as_of_date").eq("id", positionId).maybeSingle();
  if (!pos) return notFoundResponse(requestId, "liquidity_position", positionId);

  const gaps = (body.gaps ?? {}) as Record<string, number>;
  const limit = (body.limit ?? null) as Record<string, number> | null;
  // INSTITUTIONAL: no limit means no breach verdict, not "no breach".
  let breachedBucket: string | null = null;
  let magnitude: number | null = null;
  if (limit) {
    for (const [bucket, gap] of Object.entries(gaps)) {
      const cap = limit[bucket];
      if (typeof cap === "number" && Math.abs(gap) > Math.abs(cap)) {
        breachedBucket = bucket;
        magnitude = Math.abs(gap) - Math.abs(cap);
        break;
      }
    }
  }
  const disposed = isNonEmptyString(body.disposition);
  if (breachedBucket && disposed && !isNonEmptyString(body.dispositioned_by)) {
    return validationError(requestId, [{
      type: "missing_field", field: "dispositioned_by",
      message: "a disposition is a decision and needs an owner",
    }]);
  }
  const now = new Date();
  const id = `mism_${positionId}`;
  const { error } = await db.schema(scope).from("maturity_mismatch").upsert({
    id, position_id: positionId, as_of_date: pos.as_of_date,
    mismatch_current_gaps: gaps as Any, mismatch_limit: limit as Any,
    mismatch_breached_bucket: breachedBucket,
    mismatch_breach_magnitude_cents: magnitude,
    intraday_recomputed_at: body.intraday === true ? now.toISOString() : null,
    funding_draw_amount_cents: typeof body.draw_amount_cents === "number"
      ? body.draw_amount_cents
      : null,
    funding_shortfall_estimate_cents: typeof body.shortfall_estimate_cents === "number"
      ? body.shortfall_estimate_cents
      : null,
    dispositioned_at: disposed ? now.toISOString() : null,
    dispositioned_by: disposed ? body.dispositioned_by : null,
    disposition: disposed ? body.disposition : null,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  const payload = {
    "mismatch.current_gaps": gaps, "mismatch.limit": limit,
    "mismatch.breached_bucket": breachedBucket,
    "mismatch.breach_magnitude": magnitude,
    "gl.balances": body.gl_balances ?? {},
    "liquidity.behavioral_assumptions": body.behavioral_assumptions ?? {},
    "funding.draw_amount": body.draw_amount_cents ?? null,
    "funding.shortfall_estimate": body.shortfall_estimate_cents ?? null,
    verdict: limit ? (breachedBucket ? "breached" : "within") : "unassessed",
  };
  await emit(db, scope, `ev_${id}_gap`, "mismatch.gap_computed",
    "maturity_mismatch", id, payload, ctx);
  if (body.intraday === true) {
    await emit(db, scope, `ev_${id}_intra`, "mismatch.intraday_recomputed",
      "maturity_mismatch", id, payload, ctx);
  }
  if (breachedBucket) {
    await emit(db, scope, `ev_${id}_alert`, "alert.mismatch_breach",
      "maturity_mismatch", id, payload, ctx);
  }
  if (disposed) {
    await emit(db, scope, `ev_${id}_disp`, "mismatch.breach.dispositioned",
      "maturity_mismatch", id, {
        ...payload, disposition: body.disposition, by: body.dispositioned_by,
      }, ctx);
  }
  return jsonResponse({ data: { id, breached_bucket: breachedBucket } }, 201, requestId);
}

// ----------------------------------------------------- LQ-04 / LQ-05 stress

/** POST /liquidity/stress-assumptions {set, behavioral_assumptions, rationale?, approver_id?} */
export async function postStressAssumptions(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const { data: prior } = await db.schema(scope).from("stress_assumption_set")
    .select("id, version").is("superseded_at", null);
  const version = (prior ?? []).length + 1;
  if (version > 1 && !(isNonEmptyString(body.rationale) && isNonEmptyString(body.approver_id))) {
    // A survival horizon recomputed under quietly-changed assumptions is the
    // failure LQ-05 describes: the number improves and nothing records why.
    return validationError(requestId, [{
      type: "missing_field", field: "rationale",
      message: "changing a stress assumption needs a rationale and an approver",
    }]);
  }
  const now = new Date();
  for (const p of prior ?? []) {
    await db.schema(scope).from("stress_assumption_set")
      .update({ superseded_at: now.toISOString() }).eq("id", p.id);
  }
  const id = `stressassm_v${version}`;
  const { error } = await db.schema(scope).from("stress_assumption_set").upsert({
    id, version, stress_set: isNonEmptyString(body.set) ? body.set : "baseline",
    stress_behavioral_assumptions: (body.behavioral_assumptions ?? {}) as Any,
    stress_baas_shock_params: (body.baas_shock_params ?? {}) as Any,
    stress_intraday_profile: (body.intraday_profile ?? {}) as Any,
    stress_assumption_value: (body.assumption_value ?? {}) as Any,
    stress_change_rationale: isNonEmptyString(body.rationale) ? body.rationale : null,
    stress_approver_id: isNonEmptyString(body.approver_id) ? body.approver_id : null,
    superseded_at: null, provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  // Versioned, not edited: the prior set stays readable so a number computed
  // last quarter can still be reproduced.
  await emit(db, scope, `ev_${id}_ver`, "stress.assumption_versioned",
    "stress_assumption_set", id, {
      "stress.set": body.set ?? "baseline", version,
      "stress.behavioral_assumptions": body.behavioral_assumptions ?? {},
      "stress.baas_shock_params": body.baas_shock_params ?? {},
      "stress.intraday_profile": body.intraday_profile ?? {},
      "stress.assumption_value": body.assumption_value ?? {},
      "stress.change_rationale": body.rationale ?? null,
      "stress.approver_id": body.approver_id ?? null,
    }, ctx);
  return jsonResponse({ data: { id, version } }, 201, requestId);
}

/** POST /liquidity/stress-runs {period, kind, survival_days, threshold_days?} */
export async function postStressRun(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const { data: sets } = await db.schema(scope).from("stress_assumption_set")
    .select("id, version").is("superseded_at", null);
  const set = (sets ?? [])[0];
  if (!set) {
    // A stress run with no assumption set is a number with no provenance.
    return validationError(requestId, [{
      type: "missing_field", field: "assumption_set",
      message: "no current stress assumption set; a run would have no provenance",
    }]);
  }
  const adhoc = body.kind === "adhoc";
  if (adhoc && !isNonEmptyString(body.trigger_reason)) {
    // An unexplained rerun is indistinguishable from re-running until the
    // number improved.
    return validationError(requestId, [{
      type: "missing_field", field: "trigger_reason",
      message: "an ad-hoc rerun must say what triggered it",
    }]);
  }
  // INSTITUTIONAL: nullable threshold, paired verdict.
  const threshold = typeof body.threshold_days === "number" ? body.threshold_days : null;
  const days = Number(body.survival_days ?? 0);
  const below = threshold === null ? null : days < threshold;

  const now = new Date();
  const id = `stressrun_${body.period ?? "p"}_${adhoc ? "adhoc" : "sched"}`;
  const { error } = await db.schema(scope).from("liquidity_stress_run").upsert({
    id, period: String(body.period ?? "p"), assumption_set_id: set.id,
    kind: adhoc ? "adhoc" : "scheduled",
    trigger_reason: isNonEmptyString(body.trigger_reason) ? body.trigger_reason : null,
    survival_days_combined: days,
    survival_threshold_days: threshold, survival_below_threshold: below,
    ewi_value: (body.ewi_value ?? {}) as Any,
    pack_issued_at: now.toISOString(), provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  const payload = {
    "survival.days_combined": days, "stress.set": set.id,
    "ewi.value": body.ewi_value ?? {},
    "stress.behavioral_assumptions": body.behavioral_assumptions ?? {},
    "stress.assumption_value": body.assumption_value ?? {},
    "liquidity.haircut_table": body.haircut_table ?? {},
    verdict: threshold === null ? "unassessed" : (below ? "below" : "above"),
  };
  await emit(db, scope, `ev_${id}_surv`, "survival.computed",
    "liquidity_stress_run", id, payload, ctx);
  if (adhoc) {
    await emit(db, scope, `ev_${id}_adhoc`, "survival.adhoc_computed",
      "liquidity_stress_run", id, payload, ctx);
    await emit(db, scope, `ev_${id}_rerun`, "stress.adhoc_rerun.issued",
      "liquidity_stress_run", id, { ...payload, trigger: body.trigger_reason }, ctx);
  }
  if (below === true) {
    await emit(db, scope, `ev_${id}_below`, "survival.below_threshold",
      "liquidity_stress_run", id, payload, ctx);
  }
  await emit(db, scope, `ev_${id}_pack`, "stress.pack.issued",
    "liquidity_stress_run", id, { ...payload, "stress.pack": id }, ctx);
  return jsonResponse({ data: { id, survival_days: days, below_threshold: below } }, 201, requestId);
}

// ---------------------------------------------------------------- LQ-09

/** POST /liquidity/facilities {name, kind, test_script, contacts} */
export async function postFacility(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const kinds = ["fhlb", "discount_window", "clf", "correspondent"];
  if (!kinds.includes(String(body.kind)) || !isNonEmptyString(body.name)) {
    return validationError(requestId, [{
      type: "invalid_value", field: "kind", message: `kind must be one of ${kinds.join("/")}`,
    }]);
  }
  const tested = body.tested === true;
  if (tested && !isNonEmptyString(body.test_script)) {
    // Recording a test outcome with no script means the next person cannot
    // repeat it, which makes the outcome unverifiable.
    return validationError(requestId, [{
      type: "missing_field", field: "test_script",
      message: "a facility test needs the script it was run from",
    }]);
  }
  const now = new Date();
  const id = `fac_${body.kind}`;
  const { error } = await db.schema(scope).from("liquidity_facility").upsert({
    id, name: body.name, kind: body.kind,
    facility_contacts: (body.contacts ?? {}) as Any,
    facility_collateral_schedule: (body.collateral_schedule ?? {}) as Any,
    facility_test_script: isNonEmptyString(body.test_script) ? body.test_script : null,
    last_tested_at: tested ? now.toISOString() : null,
    test_due_at: new Date(now.getTime() + FACILITY_TEST_DAYS * DAY_MS).toISOString(),
    test_outcome: tested ? String(body.test_outcome ?? "drew successfully") : null,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  if (tested) {
    // A facility that has never been drawn is a facility nobody knows works.
    await emit(db, scope, `ev_${id}_test`, "facility.test.completed",
      "liquidity_facility", id, {
        "facility.contacts": body.contacts ?? {},
        "facility.test_script": body.test_script,
        "facility.collateral_schedule": body.collateral_schedule ?? {},
        outcome: body.test_outcome ?? "drew successfully",
      }, ctx);
  }
  return jsonResponse({ data: { id, tested } }, 201, requestId);
}

/** POST /liquidity/facilities/:id/collateral {pledge_schedule, unencumbered_cents, floor?} */
export async function postCollateralPosition(
  req: Request, facilityId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const { data: fac } = await db.schema(scope).from("liquidity_facility")
    .select("id").eq("id", facilityId).maybeSingle();
  if (!fac) return notFoundResponse(requestId, "liquidity_facility", facilityId);

  if (body.eligibility_rules == null) {
    // Headroom computed without the eligibility rules is headroom against
    // collateral the facility may not accept.
    return validationError(requestId, [{
      type: "missing_field", field: "eligibility_rules",
      message: "headroom needs the rules that decide what counts",
    }]);
  }
  const unenc = Number(body.unencumbered_cents ?? 0);
  const pledged = Number(body.pledged_cents ?? 0);
  const headroom = unenc - pledged;
  // INSTITUTIONAL: nullable floor, paired verdict.
  const floor = typeof body.floor_cents === "number" ? body.floor_cents : null;
  const low = floor === null ? null : headroom < floor;

  const now = new Date();
  const recompute = body.recompute === true;
  const id = `coll_${facilityId}_${body.as_of_date ?? "d"}`;
  const { error } = await db.schema(scope).from("collateral_position").upsert({
    id, facility_id: facilityId, as_of_date: body.as_of_date ?? "2026-07-19",
    collateral_pledge_schedule: (body.pledge_schedule ?? {}) as Any,
    collateral_eligibility_rules: body.eligibility_rules as Any,
    collateral_unencumbered_balance_cents: unenc,
    headroom_cents: headroom,
    collateral_move_detail: (body.move_detail ?? null) as Any,
    recomputed_at: recompute ? now.toISOString() : null,
    headroom_floor_cents: floor, headroom_low: low,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  const payload = {
    "collateral.unencumbered_balance": unenc,
    "collateral.pledge_schedule": body.pledge_schedule ?? {},
    "collateral.eligibility_rules": body.eligibility_rules,
    "collateral.move_detail": body.move_detail ?? null,
    headroom_cents: headroom,
    verdict: floor === null ? "unassessed" : (low ? "low" : "adequate"),
  };
  await emit(db, scope, `ev_${id}_hr`, "collateral.headroom_computed",
    "collateral_position", id, payload, ctx);
  if (recompute) {
    await emit(db, scope, `ev_${id}_re`, "collateral.headroom_rechecked",
      "collateral_position", id, payload, ctx);
  }
  if (low === true) {
    await emit(db, scope, `ev_${id}_low`, "alert.headroom_low",
      "collateral_position", id, payload, ctx);
  }
  return jsonResponse({ data: { id, headroom_cents: headroom, low } }, 201, requestId);
}

// ------------------------------------------------------------- LQ-07 packs

/** POST /liquidity/packs {cadence, period, position_id} */
export async function postLiquidityPack(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const cadences = ["daily", "weekly", "board"];
  if (!cadences.includes(String(body.cadence))) {
    return validationError(requestId, [{
      type: "invalid_value", field: "cadence", message: `one of ${cadences.join("/")}`,
    }]);
  }
  const { data: pos } = await db.schema(scope).from("liquidity_position")
    .select("id, lar_value_bp, lar_current_band, as_of_date");
  const latest = (pos ?? []).sort((a: Any, b: Any) =>
    String(b.as_of_date).localeCompare(String(a.as_of_date)))[0];
  const { data: mism } = await db.schema(scope).from("maturity_mismatch")
    .select("id, mismatch_current_gaps");
  const { data: coll } = await db.schema(scope).from("collateral_position")
    .select("id, headroom_cents");
  const { data: runs } = await db.schema(scope).from("liquidity_stress_run")
    .select("id, survival_days_combined");

  // The pack is ASSEMBLED from the positions, not re-entered. A board deck
  // whose numbers were typed in separately is a second source of truth, and the
  // two diverge on exactly the day it matters.
  const contents = {
    "lar.value": latest?.lar_value_bp ?? null,
    "lar.current_band": latest?.lar_current_band ?? null,
    "mismatch.current_gaps": (mism ?? [])[0]?.mismatch_current_gaps ?? {},
    "collateral.headroom_computed": (coll ?? [])[0]?.headroom_cents ?? null,
    "survival.days_combined": (runs ?? [])[0]?.survival_days_combined ?? null,
    "concentration.top10": body.concentration_top10 ?? [],
    "ewi.ceo_summary": body.ceo_summary ?? null,
    "report.weekly_deltas": body.weekly_deltas ?? {},
    "policy.limit_registry": body.limit_registry ?? [],
    "stress.pack": (runs ?? [])[0]?.id ?? null,
  };
  const now = new Date();
  const id = `liqpack_${body.cadence}_${body.period ?? "p"}`;
  const { error } = await db.schema(scope).from("liquidity_pack").upsert({
    id, cadence: body.cadence, period: String(body.period ?? "p"),
    position_id: latest?.id ?? null, contents: contents as Any,
    published_at: now.toISOString(), published_by: ctx.tokenId,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  const code = body.cadence === "daily"
    ? "report.daily_pack.published"
    : body.cadence === "weekly"
    ? "report.weekly_digest.published"
    : "report.board_deck.published";
  await emit(db, scope, `ev_${id}_pub`, code, "liquidity_pack", id, contents, ctx);
  return jsonResponse({ data: { id, cadence: body.cadence } }, 201, requestId);
}
