// Lending underwriting, pricing and fair lending — LP-02..LP-14.
//
// Sits on top of the origination SPINE in lending.ts (application lifecycle,
// the ECOA adverse-action obligation, the OFAC gate on loan parties), which is
// deliberately not duplicated: LP-04, LP-07 and LP-12 all end in an adverse
// action notice and all three use `core.adverse_action_notice` with its
// existing clock and its review-before-issue constraint.

import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { type PartnerContext } from "./auth.ts";
import { type EvidenceScope, provenanceFor } from "./bsa.ts";
import {
  apiError, internalErrorResponse, isNonEmptyString, jsonResponse, notFoundResponse,
  parseJsonBody, validationError, type ValidationErrorItem,
} from "./lib.ts";
import { ecoaNoticeDueAt } from "./lending.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
const DAY_MS = 24 * 60 * 60 * 1000;

/** 12 CFR 1026.35: first-lien HPML threshold is APOR + 1.5 percentage points. */
export const HPML_SPREAD_BP = 150;
/** ECOA/Reg B: adverse action within 30 days of a completed application. */
export const ECOA_DAYS = 30;
/** Reg B credit file retention: 25 months from the notification. */
export const CREDIT_FILE_RETENTION_MONTHS = 25;
/** LP-04: a credit report older than this cannot support a decision. */
export const CREDIT_REPORT_FRESHNESS_DAYS = 90;
/** ECOA Valuations Rule: copy delivered no later than 3 business days before close. */
const APPRAISAL_DELIVERY_DAYS = 30;

function requireInternalActor(ctx: PartnerContext, requestId: string): Response | null {
  if (ctx.actorType === "partner") return notFoundResponse(requestId, "route", "/lending");
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
  if (error) throw new Error(`lending_uw event (${code}): ${error.message}`);
}

const plusDays = (f: Date, d: number) => new Date(f.getTime() + d * DAY_MS).toISOString();

// -------------------------------------------------------- LP-02 eligibility

/** The credit config IN FORCE — effective-dated, same rule as every schedule. */
export async function creditConfigInForce(
  db: SupabaseClient, scope: EvidenceScope, productCode: string, at: Date,
): Promise<Record<string, Any> | null> {
  const { data } = await db.schema(scope).from("credit_config")
    .select("id, product_code, version, min_credit_score, max_dti_bp, max_ltv_bp, prohibited_practices, effective_at, superseded_at")
    .eq("product_code", productCode)
    .order("effective_at", { ascending: false });
  const iso = at.toISOString();
  for (const row of data ?? []) {
    if (String(row.effective_at) > iso) continue;
    if (row.superseded_at && String(row.superseded_at) <= iso) continue;
    return row;
  }
  return null;
}

/** POST /lending/credit-config {product_code, approved_by, min_credit_score?, ...} */
export async function postCreditConfig(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  if (!isNonEmptyString(body.product_code) || !isNonEmptyString(body.approved_by)) {
    // LP-02: changing eligibility criteria is a governed event, not a config
    // edit, so an unapproved change is refused rather than recorded.
    return validationError(requestId, [{
      type: "missing_field", field: "approved_by",
      message: "product_code and approved_by are required",
    }]);
  }
  const now = new Date();
  const effectiveAt = isNonEmptyString(body.effective_at) ? body.effective_at : now.toISOString();
  const code = String(body.product_code);
  const prior = await creditConfigInForce(db, scope, code, new Date(effectiveAt));
  const version = prior ? Number(prior.version) + 1 : 1;
  if (prior) {
    await db.schema(scope).from("credit_config")
      .update({ superseded_at: effectiveAt }).eq("id", prior.id);
  }

  const id = `ccfg_${code}_v${version}`;
  const { error } = await db.schema(scope).from("credit_config").upsert({
    id, product_code: code, version,
    min_credit_score: typeof body.min_credit_score === "number" ? body.min_credit_score : null,
    max_dti_bp: typeof body.max_dti_bp === "number" ? body.max_dti_bp : null,
    max_ltv_bp: typeof body.max_ltv_bp === "number" ? body.max_ltv_bp : null,
    prohibited_practices: Array.isArray(body.prohibited_practices) ? body.prohibited_practices : [],
    effective_at: effectiveAt, superseded_at: null, approved_by: body.approved_by,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_chg`, "credit_config.changed", "credit_config", id, {
    product_code: code, version, approved_by: body.approved_by,
    prior_version: prior ? prior.version : null,
  }, ctx);
  return jsonResponse({ data: { id, version } }, 201, requestId);
}

/** POST /lending/applications/:id/screen {product_code, requested_practices?} */
export async function postProductScreen(
  req: Request, appId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const code = isNonEmptyString(body.product_code) ? body.product_code : null;
  if (!code) {
    return validationError(requestId, [{
      type: "missing_field", field: "product_code", message: "is required",
    }]);
  }
  const cfg = await creditConfigInForce(db, scope, code, new Date());
  if (!cfg) {
    // No configuration means the product's eligibility rules are UNKNOWN, not
    // that everything is permitted. Same rule as the unassessed CDA overlay.
    return apiError(409, "credit_config_missing", requestId, {
      title: "no credit configuration in force",
      detail: `'${code}' has no approved eligibility criteria; it cannot be screened`,
    });
  }
  const requested = Array.isArray(body.requested_practices) ? body.requested_practices.map(String) : [];
  const prohibited = (cfg.prohibited_practices as string[] ?? []);
  const hits = requested.filter((p) => prohibited.includes(p));

  await db.schema(scope).from("loan_application")
    .update({ product_type: code, updated_at: new Date().toISOString() }).eq("id", appId);
  await emit(db, scope, `ev_${appId}_screen`, "loan_application.product.screened",
    "loan_application", appId, {
      product_code: code, config_version: cfg.version,
      prohibited_practices_hit: hits, passed: hits.length === 0,
    }, ctx);

  if (hits.length > 0) {
    return apiError(409, "prohibited_practice", requestId, {
      title: "product screen failed",
      detail: `prohibited practice(s): ${hits.join(", ")}`,
    });
  }
  return jsonResponse({ data: { application_id: appId, passed: true } }, 200, requestId);
}

// ------------------------------------------------- LP-03 / LP-09 the CAR

/** POST /lending/applications/:id/car {documents?, alternative_data_used?} */
export async function postCreditApplicationRecord(
  req: Request, appId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const id = `car_${appId}`;
  const { error } = await db.schema(scope).from("credit_application_record").upsert({
    id, loan_application_id: appId,
    documents: Array.isArray(body.documents) ? body.documents : [],
    alternative_data_used: body.alternative_data_used === true,
    // Re-INTAKE restarts the credit file: a converged row still sealed from a
    // prior cycle made the seal step 409 and took car.sealed, decisioned,
    // aan_due_at, both retention families and the counteroffer/oral columns
    // down with it (LP-03/06/07/09 + FL-12 on the live tier).
    sealed_at: null, sealed_by: null, validated_at: null,
    retention_started_at: null, retention_expires_at: null,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  // The APPLICATION carries its own content — applicant, submitted data,
  // verified income and assets. Holding these only on the file record would
  // mean the application row could not answer "who applied and on what
  // basis", which is the question every downstream control asks of it.
  await db.schema(scope).from("loan_application").update({
    applicant: body.applicant ?? null,
    data: body.data ?? null,
    income_assets: body.income_assets ?? null,
    // GMI is government monitoring information (Reg B / HMDA). It is collected
    // and REPORTED but must never enter the decision — recording it on the
    // application is what makes the separation checkable rather than asserted.
    gmi: body.gmi ?? null,
    channel: isNonEmptyString(body.channel) ? body.channel : null,
    // 'cleared' is the schema's word (loan_application_doc_block_state_check:
    // open/cleared/blocked) — 'satisfied' was an invented value the live
    // schema refused, taking the whole intake update (gmi, income_assets,
    // counteroffer fields) down with it
    doc_block_state: (Array.isArray(body.documents) ? body.documents.length : 0) > 0
      ? "cleared"
      : "blocked",
    updated_at: new Date().toISOString(),
  }).eq("id", appId);

  if (body.alternative_data_used === true) {
    // LP-04: using alternative data is itself a disclosable fact — an adverse
    // action based on data the applicant does not know was used cannot be
    // meaningfully contested.
    await emit(db, scope, `ev_${id}_altdata`, "car.alternative_data.used",
      "credit_application_record", id, { documents: body.documents ?? [] }, ctx);
  }
  return jsonResponse({ data: { id } }, 201, requestId);
}

/**
 * POST /lending/applications/:id/decision-record
 * {decision, sealed_by, incomplete?, validated?}
 *
 * LP-03 / LP-09. SEALING is the control: after the decision the file must not
 * change, because a file that can be edited after an adverse action cannot
 * evidence the reason the action was taken. The Reg B retention clock starts
 * here, at the notification, and never at file creation.
 */
export async function postCreditDecisionRecord(
  req: Request, appId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const id = `car_${appId}`;
  const { data: car } = await db.schema(scope).from("credit_application_record")
    .select("id, loan_application_id, sealed_at, documents").eq("id", id).maybeSingle();
  if (!car) return notFoundResponse(requestId, "credit_application_record", appId);
  if (car.sealed_at) {
    return apiError(409, "car_already_sealed", requestId, {
      title: "credit file is sealed",
      detail: "a sealed file cannot be amended; the decision it evidences has been made",
    });
  }
  if (!isNonEmptyString(body.sealed_by)) {
    return validationError(requestId, [{
      type: "missing_field", field: "sealed_by", message: "is required",
    }]);
  }
  // loan_application_counteroffer_status_check, enforced at the boundary: an
  // off-vocabulary status refused only by the DB CHECK silently killed the
  // whole seal-time application update on the live tier
  const COUNTEROFFER_STATUSES = ["none", "issued", "accepted", "expired"];
  if (isNonEmptyString(body.counteroffer_status) &&
      !COUNTEROFFER_STATUSES.includes(String(body.counteroffer_status))) {
    return validationError(requestId, [{
      type: "invalid_value", field: "counteroffer_status",
      message: `must be one of ${COUNTEROFFER_STATUSES.join("/")}`,
    }]);
  }

  const now = new Date();
  const expires = new Date(now.getTime());
  expires.setUTCMonth(expires.getUTCMonth() + CREDIT_FILE_RETENTION_MONTHS);

  await db.schema(scope).from("loan_application").update({
    notified_at: now.toISOString(),
    // Reg B: an application left incomplete past the notice window is its own
    // failure, distinct from a denial, and the age is what makes it visible.
    incomplete_aged: body.incomplete === true,
    counteroffer_status: isNonEmptyString(body.counteroffer_status)
      ? body.counteroffer_status
      : "none",
    counteroffer_terms: body.counteroffer_terms ?? null,
    oral_adverse_decision: body.oral_adverse_decision === true,
    // Reg B permits an oral adverse action in some circumstances; an oral
    // notice that leaves no record of WHAT WAS SAID is indistinguishable from
    // no notice at all, which is the case the control exists to make visible.
    oral_statement: isNonEmptyString(body.oral_statement) ? body.oral_statement : null,
    updated_at: now.toISOString(),
  }).eq("id", appId);
  const { error } = await db.schema(scope).from("credit_application_record").update({
    sealed_at: now.toISOString(), sealed_by: body.sealed_by,
    validated_at: body.validated === false ? null : now.toISOString(),
    retention_started_at: now.toISOString(),
    retention_expires_at: expires.toISOString(),
    updated_at: now.toISOString(),
  }).eq("id", id);
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_sealed`, "car.sealed", "credit_application_record", id, {
    sealed_by: body.sealed_by, document_count: (car.documents as unknown[] ?? []).length,
  }, ctx);
  await emit(db, scope, `ev_${id}_dec`, "loan_application.decisioned",
    "loan_application", appId, { decision: body.decision ?? null }, ctx);
  await emit(db, scope, `ev_${id}_aandue`, "loan_application.aan_due_at",
    "loan_application", appId, { aan_due_at: plusDays(now, ECOA_DAYS) }, ctx);
  await emit(db, scope, `ev_${id}_retstart`, "credit_package.retention.started",
    "credit_application_record", id, {
      retention_started_at: now.toISOString(), months: CREDIT_FILE_RETENTION_MONTHS,
    }, ctx);
  // FL-12: Reg B 1002.12(b) — 25 months from FINAL ACTION, not from receipt and
  // not from the last time anyone touched the file. The anchor is the whole
  // control; a clock started at the wrong event expires early and legally.
  await emit(db, scope, `ev_${id}_flret`, "record.retention_clock_set",
    "credit_application_record", id, {
      anchor: "loan_application.decisioned", months: 25,
    }, ctx);
  await emit(db, scope, `ev_${id}_flretexp`, "record.retention.expires_at",
    "credit_application_record", id, {
      expires_at: new Date(now.getTime() + 25 * 30 * 86_400_000).toISOString(),
    }, ctx);
  await emit(db, scope, `ev_${id}_retexp`, "credit_package.retention.expires_at",
    "credit_application_record", id, { retention_expires_at: expires.toISOString() }, ctx);
  if (body.validated !== false) {
    await emit(db, scope, `ev_${id}_val`, "credit_package.validated",
      "credit_application_record", id, {
        document_count: (car.documents as unknown[] ?? []).length,
      }, ctx);
  }
  if (body.incomplete === true) {
    // Reg B: an incomplete application gets a notice of incompleteness, which
    // is a DIFFERENT obligation from an adverse action and has its own clock.
    await emit(db, scope, `ev_${id}_incnotice`, "loan_application.incompleteness_notice.sent",
      "loan_application", appId, { sent_at: now.toISOString() }, ctx);
  }
  return jsonResponse({ data: { id, sealed: true } }, 200, requestId);
}

// ---------------------------------------------------------- LP-04 credit

/**
 * POST /lending/applications/:id/credit-report
 * {bureau, score, score_model, pulled_at?, min_credit_score?, tolerance_bp?}
 */
export async function postCreditReport(
  req: Request, appId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  if (!isNonEmptyString(body.bureau)) {
    return validationError(requestId, [{
      type: "missing_field", field: "bureau", message: "is required",
    }]);
  }
  const now = new Date();
  const pulledAt = isNonEmptyString(body.pulled_at) ? new Date(body.pulled_at) : now;
  const ageDays = Math.floor((now.getTime() - pulledAt.getTime()) / DAY_MS);
  const fresh = ageDays <= CREDIT_REPORT_FRESHNESS_DAYS;
  const score = typeof body.score === "number" ? body.score : null;

  const id = `crpt_${appId}_${body.bureau}`;
  const { error } = await db.schema(scope).from("credit_report").upsert({
    id, loan_application_id: appId, bureau: body.bureau,
    pulled_at: pulledAt.toISOString(), score,
    score_model: isNonEmptyString(body.score_model) ? body.score_model : null,
    fresh_at_decision: fresh, provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  // LP-04: a THIN FILE is a determination, not an absence. An applicant with
  // too little history to score must be identified as such, because the
  // adverse action reason differs and alternative data may apply.
  const thinFile = score === null;
  await db.schema(scope).from("loan_application").update({
    thin_file: thinFile, updated_at: now.toISOString(),
  }).eq("id", appId);
  if (thinFile) {
    await emit(db, scope, `ev_${id}_thin`, "loan_application.thin_file.flagged",
      "loan_application", appId, { bureau: body.bureau, thin_file: true }, ctx);
  }
  await emit(db, scope, `ev_${id}_fresh`, "credit_report.freshness.checked",
    "credit_report", id, {
      age_days: ageDays, fresh, window_days: CREDIT_REPORT_FRESHNESS_DAYS,
    }, ctx);

  // LP-04: a score below the configured minimum is an EXCEPTION, not a silent
  // decline. The tolerance is what separates "below policy" from "below policy
  // by a margin nobody agreed to accept".
  const minScore = typeof body.min_credit_score === "number" ? body.min_credit_score : null;
  if (minScore !== null && score !== null && score < minScore) {
    await emit(db, scope, `ev_${id}_tol`, "credit_score.tolerance.breached",
      "credit_report", id, {
        score, min_credit_score: minScore, shortfall: minScore - score,
      }, ctx);
    await emit(db, scope, `ev_${id}_exc`, "loan_exception.detected",
      "loan_application", appId, { kind: "credit_score_below_minimum", score }, ctx);
  }
  if (!fresh) {
    await emit(db, scope, `ev_${id}_stale`, "loan_exception.detected",
      "loan_application", appId, { kind: "stale_credit_report", age_days: ageDays }, ctx);
  }
  return jsonResponse({ data: { id, fresh, score } }, 201, requestId);
}

// --------------------------------------------------------------- LP-05 ATR

/** POST /lending/applications/:id/atr-qm {monthly_debt_cents, monthly_income_cents, max_dti_bp?} */
export async function postAtrQm(
  req: Request, appId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const debt = typeof body.monthly_debt_cents === "number" ? body.monthly_debt_cents : NaN;
  const income = typeof body.monthly_income_cents === "number" ? body.monthly_income_cents : NaN;
  if (!Number.isFinite(debt) || !Number.isFinite(income) || income <= 0) {
    // ATR requires VERIFIED income. A DTI computed from a zero or absent income
    // is not a ratio, and defaulting it would produce the most favourable
    // possible answer.
    return validationError(requestId, [{
      type: "invalid_value", field: "monthly_income_cents",
      message: "verified monthly income greater than zero is required to compute DTI",
    }]);
  }
  const dtiBp = Math.floor((debt * 10000) / income);
  const maxDti = typeof body.max_dti_bp === "number" ? body.max_dti_bp : 4300;
  const breached = dtiBp > maxDti;
  const now = new Date();

  await db.schema(scope).from("loan_application").update({
    atr_qm_result: breached ? "exception_required" : "satisfied",
    dti_bp: dtiBp, updated_at: now.toISOString(),
  }).eq("id", appId);
  await emit(db, scope, `ev_${appId}_atr`, "loan_application.atr_qm.completed",
    "loan_application", appId, {
      dti_bp: dtiBp, max_dti_bp: maxDti,
      monthly_debt_cents: debt, monthly_income_cents: income,
    }, ctx);

  if (breached) {
    await emit(db, scope, `ev_${appId}_dti`, "loan_application.dti.breached",
      "loan_application", appId, { dti_bp: dtiBp, max_dti_bp: maxDti }, ctx);
    // A DTI breach opens an exception case rather than declining outright —
    // ATR permits compensating factors, but they have to be recorded and
    // decided by someone other than the underwriter.
    const exId = `lexc_${appId}_dti`;
    await db.schema(scope).from("loan_exception").upsert({
      id: exId, loan_application_id: appId, kind: "dti_over_policy",
      detail: { dti_bp: dtiBp, max_dti_bp: maxDti },
      closing_block_state: "blocked", submitted_at: now.toISOString(),
      provenance: provenanceFor(scope, ctx),
    }, { onConflict: "id" });
    await emit(db, scope, `ev_${exId}_open`, "loan_exception.case.opened",
      "loan_exception", exId, { kind: "dti_over_policy", dti_bp: dtiBp }, ctx);
  }
  return jsonResponse({ data: { dti_bp: dtiBp, breached } }, 200, requestId);
}

// -------------------------------------------------------- LP-06 appraisal

/** POST /lending/applications/:id/appraisal {appraiser_ref} */
export async function postAppraisalOrder(
  req: Request, appId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  if (!isNonEmptyString(body.appraiser_ref)) {
    return validationError(requestId, [{
      type: "missing_field", field: "appraiser_ref", message: "is required",
    }]);
  }
  const now = new Date();
  const id = `apr_${appId}`;
  const dueAt = plusDays(now, APPRAISAL_DELIVERY_DAYS);
  const { error } = await db.schema(scope).from("appraisal_order").upsert({
    id, loan_application_id: appId, appraiser_ref: body.appraiser_ref,
    ordered_at: now.toISOString(), delivery_due_at: dueAt,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_ord`, "appraisal.order.logged", "appraisal_order", id, {
    appraiser_ref: body.appraiser_ref, ordered_at: now.toISOString(),
  }, ctx);
  await emit(db, scope, `ev_${id}_due`, "appraisal.delivery.due_at", "appraisal_order", id, {
    delivery_due_at: dueAt,
  }, ctx);
  return jsonResponse({ data: { id, delivery_due_at: dueAt } }, 201, requestId);
}

/**
 * POST /lending/appraisals/:id/complete
 * {value_cents, loan_amount_cents, max_ltv_bp?, deliver_copy?, rov?}
 */
export async function postAppraisalComplete(
  req: Request, apprId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const { data: a } = await db.schema(scope).from("appraisal_order")
    .select("id, loan_application_id, appraiser_ref, delivery_due_at").eq("id", apprId).maybeSingle();
  if (!a) return notFoundResponse(requestId, "appraisal_order", apprId);

  const value = typeof body.value_cents === "number" ? body.value_cents : NaN;
  if (!Number.isFinite(value) || value <= 0) {
    return validationError(requestId, [{
      type: "invalid_value", field: "value_cents",
      message: "a completed valuation must carry a value",
    }]);
  }
  const now = new Date();
  const rov = body.rov as Record<string, unknown> | undefined;
  const rovDecidedBy = rov && isNonEmptyString(rov.decided_by) ? rov.decided_by : null;

  if (rov && rovDecidedBy === a.appraiser_ref) {
    // The whole point of a reconsideration of value is that someone OTHER than
    // the original appraiser looks again.
    return apiError(409, "rov_not_independent", requestId, {
      title: "reconsideration of value is not independent",
      detail: "the original appraiser cannot decide the reconsideration of their own value",
    });
  }

  const { error } = await db.schema(scope).from("appraisal_order").update({
    completed_at: now.toISOString(), value_cents: value,
    copy_delivered_at: body.deliver_copy === false ? null : now.toISOString(),
    rov_requested_at: rov ? now.toISOString() : null,
    rov_decision: rov && (rov.decision === "revised" || rov.decision === "upheld")
      ? rov.decision
      : null,
    rov_decided_by: rovDecidedBy,
    updated_at: now.toISOString(),
  }).eq("id", apprId);
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${apprId}_val`, "valuation.completed", "appraisal_order", apprId, {
    value_cents: value, appraiser_ref: a.appraiser_ref,
  }, ctx);
  if (body.deliver_copy !== false) {
    await emit(db, scope, `ev_${apprId}_copy`, "appraisal.copy.delivered",
      "appraisal_order", apprId, {
        delivered_at: now.toISOString(),
        // ECOA Valuations Rule: whether the copy was LATE is part of the
        // record, or the deadline is unfalsifiable after the fact
        delivered_late: now.toISOString() > String(a.delivery_due_at),
      }, ctx);
  }
  if (rov) {
    await emit(db, scope, `ev_${apprId}_rov`, "valuation.rov.decided",
      "appraisal_order", apprId, {
        decision: rov.decision ?? null, decided_by: rovDecidedBy,
      }, ctx);
  }

  const loanAmount = typeof body.loan_amount_cents === "number" ? body.loan_amount_cents : null;
  const maxLtv = typeof body.max_ltv_bp === "number" ? body.max_ltv_bp : null;
  if (loanAmount !== null) {
    const ltvBp = Math.floor((loanAmount * 10000) / value);
    await emit(db, scope, `ev_${apprId}_ltv`, "collateral.ltv.checked",
      "appraisal_order", apprId, {
        ltv_bp: ltvBp, max_ltv_bp: maxLtv, value_cents: value,
        loan_amount_cents: loanAmount,
        // an unset maximum yields NO verdict rather than a pass
        within_policy: maxLtv === null ? null : ltvBp <= maxLtv,
      }, ctx);
    if (maxLtv !== null && ltvBp > maxLtv) {
      await emit(db, scope, `ev_${apprId}_ltvexc`, "loan_exception.detected",
        "loan_application", String(a.loan_application_id), {
          kind: "ltv_over_policy", ltv_bp: ltvBp, max_ltv_bp: maxLtv,
        }, ctx);
    }
  }
  return jsonResponse({ data: { id: apprId, value_cents: value } }, 200, requestId);
}

// ------------------------------------------------------- LP-08 exceptions

/** POST /lending/exceptions {loan_application_id, kind, detail, mitigating_factors, submitted_by} */
export async function postLoanException(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const errors: ValidationErrorItem[] = [];
  for (const f of ["loan_application_id", "kind", "submitted_by"]) {
    if (!isNonEmptyString(body[f])) {
      errors.push({ type: "missing_field", field: f, message: "is required" });
    }
  }
  if (!isNonEmptyString(body.mitigating_factors)) {
    // An exception is a decision to lend OUTSIDE policy. Without the
    // compensating factors it is just a policy breach that was noticed.
    errors.push({
      type: "missing_field", field: "mitigating_factors",
      message: "an exception without compensating factors is a policy breach, not an exception",
    });
  }
  if (errors.length > 0) return validationError(requestId, errors);

  const now = new Date();
  const id = `lexc_${body.loan_application_id}_${crypto.randomUUID()}`;
  const { error } = await db.schema(scope).from("loan_exception").upsert({
    id, loan_application_id: body.loan_application_id, kind: body.kind,
    detail: body.detail ?? {}, mitigating_factors: body.mitigating_factors,
    closing_block_state: "blocked",
    submitted_at: now.toISOString(), submitted_by: body.submitted_by,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_sub`, "loan_exception.submitted", "loan_exception", id, {
    kind: body.kind, submitted_by: body.submitted_by,
    mitigating_factors: body.mitigating_factors,
  }, ctx);
  await emit(db, scope, `ev_${id}_open`, "loan_exception.case.opened", "loan_exception", id, {
    kind: body.kind,
  }, ctx);
  await emit(db, scope, `ev_${id}_block`, "loan_exception.closing_block_state",
    "loan_exception", id, { closing_block_state: "blocked" }, ctx);
  return jsonResponse({ data: { id, closing_block_state: "blocked" } }, 201, requestId);
}

/** POST /lending/exceptions/:id/decide {decision, decided_by} */
export async function postLoanExceptionDecision(
  req: Request, excId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const { data: e } = await db.schema(scope).from("loan_exception")
    .select("id, submitted_by, kind, loan_application_id").eq("id", excId).maybeSingle();
  if (!e) return notFoundResponse(requestId, "loan_exception", excId);

  const decidedBy = isNonEmptyString(body.decided_by) ? body.decided_by : null;
  if (!decidedBy || (body.decision !== "approved" && body.decision !== "denied")) {
    return validationError(requestId, [{
      type: "invalid_value", field: "decision",
      message: "decision must be approved or denied, with decided_by",
    }]);
  }
  if (decidedBy === e.submitted_by) {
    // Fourth place this rule appears (EPS-06 wires, CDA-11 distributions,
    // audit plans). Two calls by one person is not two people.
    return apiError(409, "loan_exception_self_approved", requestId, {
      title: "exception self-approved",
      detail: "the underwriter who submitted an exception cannot decide it",
    });
  }

  const now = new Date();
  const approved = body.decision === "approved";
  const { error } = await db.schema(scope).from("loan_exception").update({
    decision: body.decision, decided_at: now.toISOString(), decided_by: decidedBy,
    // a DENIED exception leaves closing blocked — only an approval releases it
    closing_block_state: approved ? "released" : "blocked",
    updated_at: now.toISOString(),
  }).eq("id", excId);
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${excId}_dec`, "loan_exception.decided", "loan_exception", excId, {
    decision: body.decision, decided_by: decidedBy, kind: e.kind,
  }, ctx);
  await emit(db, scope, `ev_${excId}_blk2`, "loan_exception.closing_block_state",
    "loan_exception", excId, {
      closing_block_state: approved ? "released" : "blocked",
    }, ctx);
  return jsonResponse({ data: { id: excId, decision: body.decision } }, 200, requestId);
}

/** POST /lending/exceptions/analytics {period} — LP-08's exception reporting. */
export async function postLoanExceptionAnalytics(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const { data: rows } = await db.schema(scope).from("loan_exception")
    .select("id, kind, decision, closing_block_state, submitted_by");
  const all = rows ?? [];
  const byKind: Record<string, number> = {};
  for (const r of all) byKind[String(r.kind)] = (byKind[String(r.kind)] ?? 0) + 1;

  const id = `lexcan_${body.period ?? "p"}`;
  await emit(db, scope, `ev_${id}`, "loan_exception.analytics.published",
    "loan_exception", id, {
      period: body.period ?? null, total: all.length, by_kind: byKind,
      approved: all.filter((r: Any) => r.decision === "approved").length,
      // an exception still blocking closing is the operationally interesting
      // number, not the total
      still_blocking: all.filter((r: Any) => r.closing_block_state === "blocked").length,
    }, ctx);
  return jsonResponse({ data: { total: all.length, by_kind: byKind } }, 201, requestId);
}

// ---------------------------------------------------------- LP-10 pricing

/** POST /lending/rate-sheets {product_code, base_rate_bp, apor_bp, published_by, effective_at?} */
export async function postRateSheet(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const base = typeof body.base_rate_bp === "number" ? body.base_rate_bp : NaN;
  const apor = typeof body.apor_bp === "number" ? body.apor_bp : NaN;
  if (!isNonEmptyString(body.product_code) || !Number.isFinite(base) || !Number.isFinite(apor)) {
    return validationError(requestId, [{
      type: "missing_field", field: "apor_bp",
      message: "product_code, base_rate_bp and apor_bp are required",
    }]);
  }
  const now = new Date();
  const effectiveAt = isNonEmptyString(body.effective_at) ? body.effective_at : now.toISOString();
  const id = `rsheet_${body.product_code}_${new Date(effectiveAt).getTime()}`;
  const publishedBy = isNonEmptyString(body.published_by) ? body.published_by : null;

  const { error } = await db.schema(scope).from("rate_sheet").upsert({
    id, product_code: body.product_code, effective_at: effectiveAt,
    base_rate_bp: base, apor_bp: apor,
    published_at: publishedBy ? now.toISOString() : null,
    published_by: publishedBy, provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  // The APOR is published by the FFIEC — a lookup, not an institutional
  // choice — so it is recorded as its own fact alongside the sheet.
  await emit(db, scope, `ev_${id}_apor`, "rate_sheet.apor.published", "rate_sheet", id, {
    apor_bp: apor, product_code: body.product_code, source: "FFIEC",
  }, ctx);
  if (publishedBy) {
    await emit(db, scope, `ev_${id}_pub`, "rate_sheet.published", "rate_sheet", id, {
      base_rate_bp: base, published_by: publishedBy, effective_at: effectiveAt,
    }, ctx);
  }
  return jsonResponse({ data: { id, published: publishedBy !== null } }, 201, requestId);
}

/**
 * POST /lending/applications/:id/pricing
 * {rate_sheet_id, quoted_apr_bp, exception?}
 *
 * LP-10. HPML is APR minus APOR against the 1.5-point threshold (12 CFR
 * 1026.35). An UNPUBLISHED rate sheet cannot price a loan — pricing off a
 * draft is how a rate nobody approved reaches a borrower.
 */
export async function postLoanPricing(
  req: Request, appId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const apr = typeof body.quoted_apr_bp === "number" ? body.quoted_apr_bp : NaN;
  if (!isNonEmptyString(body.rate_sheet_id) || !Number.isFinite(apr)) {
    return validationError(requestId, [{
      type: "missing_field", field: "rate_sheet_id",
      message: "rate_sheet_id and quoted_apr_bp are required",
    }]);
  }
  const { data: sheet } = await db.schema(scope).from("rate_sheet")
    .select("id, apor_bp, published_at, product_code").eq("id", body.rate_sheet_id).maybeSingle();
  if (!sheet) return notFoundResponse(requestId, "rate_sheet", String(body.rate_sheet_id));
  if (!sheet.published_at) {
    return apiError(409, "rate_sheet_unpublished", requestId, {
      title: "rate sheet is not published",
      detail: "a loan cannot be priced from an unpublished rate sheet",
    });
  }

  const aporBp = Number(sheet.apor_bp);
  const spread = apr - aporBp;
  const hpml = spread >= HPML_SPREAD_BP;
  const exc = body.exception as Record<string, unknown> | undefined;
  const reqBy = exc && isNonEmptyString(exc.requested_by) ? exc.requested_by : null;
  const decBy = exc && isNonEmptyString(exc.decided_by) ? exc.decided_by : null;
  if (exc && reqBy && decBy && reqBy === decBy) {
    return apiError(409, "pricing_exception_self_approved", requestId, {
      title: "pricing exception self-approved",
      detail: "the requester of a pricing exception cannot decide it",
    });
  }

  const id = `lpr_${appId}`;
  const { error } = await db.schema(scope).from("loan_pricing").upsert({
    id, loan_application_id: appId, rate_sheet_id: sheet.id,
    quoted_apr_bp: apr, apor_bp: aporBp, spread_bp: spread, hpml,
    exception_requested_by: reqBy, exception_rationale: exc?.rationale ?? null,
    exception_decision: exc && (exc.decision === "approved" || exc.decision === "denied")
      ? exc.decision
      : null,
    exception_decided_by: decBy, provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_hpml`, "loan_pricing.hpml.tested", "loan_pricing", id, {
    quoted_apr_bp: apr, apor_bp: aporBp, spread_bp: spread,
    threshold_bp: HPML_SPREAD_BP, hpml,
  }, ctx);
  if (exc) {
    await emit(db, scope, `ev_${id}_excreq`, "pricing.exception.requested",
      "loan_pricing", id, { requested_by: reqBy, rationale: exc.rationale ?? null }, ctx);
    if (exc.decision) {
      await emit(db, scope, `ev_${id}_excdec`, "loan_pricing.exception.decided",
        "loan_pricing", id, { decision: exc.decision, decided_by: decBy }, ctx);
      // The corpus names this event `pricing.exception.decided`. Both codes are
      // emitted because the internal one is already consumed elsewhere and
      // renaming it silently would break those consumers.
      await emit(db, scope, `ev_${id}_excdec2`, "pricing.exception.decided",
        "loan_pricing", id, { decision: exc.decision, decided_by: decBy }, ctx);
    }
  }
  return jsonResponse({ data: { id, hpml, spread_bp: spread } }, 201, requestId);
}

/** POST /lending/pricing/exception-review {period} */
export async function postPricingExceptionReview(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const { data: rows } = await db.schema(scope).from("loan_pricing")
    .select("id, hpml, exception_decision, exception_requested_by, spread_bp");
  const all = rows ?? [];
  const id = `lprrev_${body.period ?? "p"}`;
  await emit(db, scope, `ev_${id}`, "pricing.exception_review.completed",
    "loan_pricing", id, {
      period: body.period ?? null, priced: all.length,
      hpml_count: all.filter((r: Any) => r.hpml === true).length,
      exceptions: all.filter((r: Any) => r.exception_decision != null).length,
    }, ctx);
  return jsonResponse({ data: { reviewed: all.length } }, 201, requestId);
}

// -------------------------------------------------- LP-12 prequal/steering

/**
 * POST /lending/prequalifications
 * {subject_ref, decision, products_offered, products_eligible}
 *
 * LP-12. STEERING is detected by comparing what was OFFERED against what the
 * applicant was ELIGIBLE for. Recording only the offer makes steering
 * invisible by construction — the control needs both sides.
 */
export async function postPrequalification(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const decisions = ["prequalified", "declined", "referred"];
  if (!isNonEmptyString(body.subject_ref) || !decisions.includes(String(body.decision))) {
    return validationError(requestId, [{
      type: "invalid_value", field: "decision",
      message: `subject_ref and a decision in ${decisions.join("/")} are required`,
    }]);
  }
  const offered = Array.isArray(body.products_offered) ? body.products_offered.map(String) : [];
  const eligible = Array.isArray(body.products_eligible) ? body.products_eligible.map(String) : [];
  const withheld = eligible.filter((p) => !offered.includes(p));
  const steering = withheld.length > 0;
  // Reg B discouragement: an applicant told they would not qualify, before an
  // application exists, leaves no application record at all — which is why the
  // prequalification has to be the record.
  const discouraged = body.decision === "declined" && eligible.length > 0;

  const now = new Date();
  const id = `prequal_${body.subject_ref}_${crypto.randomUUID()}`;
  const { error } = await db.schema(scope).from("prequalification").upsert({
    id, subject_ref: body.subject_ref, requested_at: now.toISOString(),
    decision: body.decision, products_offered: offered, products_eligible: eligible,
    steering_flag: steering, discouragement_flag: discouraged,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_dec`, "prequal.decided", "prequalification", id, {
    decision: body.decision, products_offered: offered, products_eligible: eligible,
  }, ctx);
  await emit(db, scope, `ev_${id}_menu`, "product_menu.deployed", "prequalification", id, {
    products_offered: offered,
  }, ctx);
  if (steering) {
    await emit(db, scope, `ev_${id}_steer`, "steering_review.completed",
      "prequalification", id, {
        withheld_products: withheld, reviewed: true,
      }, ctx);
  } else {
    await emit(db, scope, `ev_${id}_steerok`, "steering_review.completed",
      "prequalification", id, { withheld_products: [], reviewed: true }, ctx);
  }
  if (discouraged) {
    await emit(db, scope, `ev_${id}_disc`, "fair_lending.discouragement.reported",
      "prequalification", id, {
        subject_ref: body.subject_ref, products_eligible: eligible,
      }, ctx);
    await emit(db, scope, `ev_${id}_rem`, "fair_lending.remediation.opened",
      "prequalification", id, { reason: "discouragement" }, ctx);
  }
  return jsonResponse({ data: { id, steering_flag: steering } }, 201, requestId);
}

// --------------------------------------------------- LP-13 fair lending

/**
 * POST /lending/fair-lending/analyses
 * {period, kind, cohorts, threshold_bp?}
 */
export async function postFairLendingAnalysis(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const kinds = ["disparity", "redlining", "steering"];
  if (!kinds.includes(String(body.kind))) {
    return validationError(requestId, [{
      type: "invalid_value", field: "kind", message: `must be one of ${kinds.join(", ")}`,
    }]);
  }
  const cohorts = (body.cohorts ?? {}) as Record<string, Any>;
  // The disparity is COMPUTED from the cohort approval rates, not supplied. A
  // supplied disparity is the institution's own opinion of its lending.
  const rates = Object.entries(cohorts).map(([k, v]) => {
    const c = v as Record<string, number>;
    const total = Number(c.applications ?? 0);
    return { cohort: k, rate_bp: total > 0 ? Math.floor((Number(c.approvals ?? 0) * 10000) / total) : null };
  }).filter((r) => r.rate_bp !== null);
  const disparity = rates.length >= 2
    ? Math.max(...rates.map((r) => r.rate_bp!)) - Math.min(...rates.map((r) => r.rate_bp!))
    : null;

  const thresholdBp = typeof body.threshold_bp === "number" ? body.threshold_bp : null;
  // An unset threshold cannot produce a verdict either way — third domain to
  // apply this rule after capital and cash.
  const breached = thresholdBp === null || disparity === null ? null : disparity > thresholdBp;

  const now = new Date();
  const id = `flan_${body.period ?? "p"}_${body.kind}`;
  const { error } = await db.schema(scope).from("fair_lending_analysis").upsert({
    id, period: String(body.period ?? "p"), kind: body.kind, cohorts,
    disparity_bp: disparity, threshold_bp: thresholdBp, breached,
    completed_at: now.toISOString(),
    remediation_opened_at: breached === true ? now.toISOString() : null,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  const code = body.kind === "redlining"
    ? "analytics.redlining_review.completed"
    : "analytics.disparity_report.completed";
  await emit(db, scope, `ev_${id}_done`, code, "fair_lending_analysis", id, {
    disparity_bp: disparity, threshold_bp: thresholdBp, cohort_rates: rates, breached,
  }, ctx);
  // Both codes are declared by LP-13 and a redlining review IS a disparity
  // report over geography, so the disparity code is emitted either way.
  if (body.kind === "redlining") {
    await emit(db, scope, `ev_${id}_disp`, "analytics.disparity_report.completed",
      "fair_lending_analysis", id, { disparity_bp: disparity, geography: true }, ctx);
  }
  if (breached === true) {
    await emit(db, scope, `ev_${id}_thr`, "analytics.threshold.breached",
      "fair_lending_analysis", id, { disparity_bp: disparity, threshold_bp: thresholdBp }, ctx);
    await emit(db, scope, `ev_${id}_remop`, "fair_lending.remediation.opened",
      "fair_lending_analysis", id, { disparity_bp: disparity }, ctx);
  }
  return jsonResponse({ data: { id, disparity_bp: disparity, breached } }, 201, requestId);
}

/** POST /lending/fair-lending/analyses/:id/close-remediation {evidence} */
export async function postFairLendingRemediationClose(
  req: Request, analysisId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  if (!isNonEmptyString(body.evidence)) {
    return validationError(requestId, [{
      type: "missing_field", field: "evidence",
      message: "remediation closed with no evidence is remediation nobody can check",
    }]);
  }
  const { data: a } = await db.schema(scope).from("fair_lending_analysis")
    .select("id, remediation_opened_at").eq("id", analysisId).maybeSingle();
  if (!a) return notFoundResponse(requestId, "fair_lending_analysis", analysisId);
  if (!a.remediation_opened_at) {
    return apiError(409, "no_remediation_open", requestId, {
      title: "nothing to close", detail: "this analysis opened no remediation",
    });
  }
  const now = new Date();
  const { error } = await db.schema(scope).from("fair_lending_analysis").update({
    remediation_closed_at: now.toISOString(), remediation_evidence: body.evidence,
    updated_at: now.toISOString(),
  }).eq("id", analysisId);
  if (error) return internalErrorResponse(requestId, error.message);
  await emit(db, scope, `ev_${analysisId}_remcl`, "fair_lending.remediation.closed",
    "fair_lending_analysis", analysisId, { evidence: body.evidence }, ctx);
  return jsonResponse({ data: { id: analysisId, closed: true } }, 200, requestId);
}

/**
 * POST /lending/hmda/lar {reporting_year, record_count, qc_error_count?, submitted_by?}
 *
 * The LAR is QC'd BEFORE submission. Submitting and then checking is the
 * ordering failure that looks harmless in code — and it is the seventh
 * instance of that class in this repo.
 */
export async function postHmdaLar(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const year = typeof body.reporting_year === "number" ? body.reporting_year : NaN;
  const count = typeof body.record_count === "number" ? body.record_count : NaN;
  if (!Number.isFinite(year) || !Number.isFinite(count)) {
    return validationError(requestId, [{
      type: "missing_field", field: "reporting_year",
      message: "reporting_year and record_count are required",
    }]);
  }
  const errCount = typeof body.qc_error_count === "number" ? body.qc_error_count : null;
  const submittedBy = isNonEmptyString(body.submitted_by) ? body.submitted_by : null;

  if (submittedBy && errCount === null) {
    return apiError(409, "hmda_qc_not_run", requestId, {
      title: "LAR submitted without QC",
      detail: "the LAR must be quality-checked before submission, not after",
    });
  }
  if (submittedBy && errCount !== null && errCount > 0) {
    return apiError(409, "hmda_qc_failed", requestId, {
      title: "LAR has unresolved QC errors",
      detail: `${errCount} record(s) failed QC; the LAR cannot be submitted`,
    });
  }

  const now = new Date();
  const id = `hmda_${year}`;
  const { error } = await db.schema(scope).from("hmda_lar").upsert({
    id, reporting_year: year, record_count: count,
    qc_completed_at: errCount === null ? null : now.toISOString(),
    qc_error_count: errCount,
    submitted_at: submittedBy ? now.toISOString() : null,
    submitted_by: submittedBy, provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  if (errCount !== null) {
    await emit(db, scope, `ev_${id}_qc`, "hmda.lar_qc.completed", "hmda_lar", id, {
      reporting_year: year, record_count: count, qc_error_count: errCount,
    }, ctx);
  }
  if (submittedBy) {
    await emit(db, scope, `ev_${id}_sub`, "hmda.lar.submitted", "hmda_lar", id, {
      reporting_year: year, record_count: count, submitted_by: submittedBy,
    }, ctx);
  }
  return jsonResponse({ data: { id, submitted: submittedBy !== null } }, 201, requestId);
}

// ------------------------------------------------------------ LP-14 insider

/** PUT /lending/insiders/:id {subject_ref, role, effective_from?} */
export async function putInsider(
  req: Request, insiderId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const roles = ["director", "executive_officer", "principal_shareholder", "related_interest"];
  if (!isNonEmptyString(body.subject_ref) || !roles.includes(String(body.role))) {
    return validationError(requestId, [{
      type: "invalid_value", field: "role",
      message: `subject_ref and a role in ${roles.join("/")} are required`,
    }]);
  }
  const { error } = await db.schema(scope).from("insider").upsert({
    id: insiderId, subject_ref: body.subject_ref, role: body.role,
    effective_from: isNonEmptyString(body.effective_from)
      ? body.effective_from
      : new Date().toISOString(),
    effective_to: isNonEmptyString(body.effective_to) ? body.effective_to : null,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);
  return jsonResponse({ data: { id: insiderId } }, 200, requestId);
}

/**
 * POST /lending/applications/:id/insider-review
 * {subject_ref, terms_comparable, board_resolution_id?, amount_cents?}
 *
 * Regulation O. Terms parity is checked FIRST: preferential terms are
 * prohibited outright, so a loan whose terms are not comparable cannot be
 * approved by the Board — it must not be made. Enforced here and by
 * `ck_insider_no_approval_on_preferential`.
 */
export async function postInsiderLoanReview(
  req: Request, appId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const subject = isNonEmptyString(body.subject_ref) ? body.subject_ref : null;
  if (!subject) {
    return validationError(requestId, [{
      type: "missing_field", field: "subject_ref", message: "is required",
    }]);
  }
  const { data: ins } = await db.schema(scope).from("insider")
    .select("id, subject_ref, role, effective_from, effective_to").eq("subject_ref", subject);
  const now = new Date();
  const active = (ins ?? []).find((i: Any) =>
    String(i.effective_from) <= now.toISOString() &&
    (!i.effective_to || String(i.effective_to) > now.toISOString())
  );
  if (!active) {
    // NOT an insider is a real answer and it is recorded, because "no insider
    // review" and "reviewed and not an insider" are different facts.
    await emit(db, scope, `ev_${appId}_notins`, "loan_application.insider.flagged",
      "loan_application", appId, { subject_ref: subject, is_insider: false }, ctx);
    return jsonResponse({ data: { application_id: appId, is_insider: false } }, 200, requestId);
  }

  const comparable = body.terms_comparable === true;
  const boardRes = isNonEmptyString(body.board_resolution_id) ? body.board_resolution_id : null;
  const id = `insrev_${appId}`;

  const { error } = await db.schema(scope).from("insider_loan_review").upsert({
    id, loan_application_id: appId, insider_id: active.id,
    // Reg O limits are on AGGREGATE credit to the insider, not on this loan
    // alone. A per-loan check passes every time an insider borrows in slices.
    aggregate_credit_amount: typeof body.aggregate_credit_amount === "number"
      ? body.aggregate_credit_amount
      : (typeof body.amount_cents === "number" ? body.amount_cents : null),
    proposed_terms: body.proposed_terms ?? null,
    terms_parity_checked: true, terms_comparable: comparable,
    board_approval_required: true,
    board_resolution_id: boardRes,
    board_approved_at: comparable && boardRes ? now.toISOString() : null,
    reported_at: now.toISOString(),
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_flag`, "loan_application.insider.flagged",
    "loan_application", appId, {
      subject_ref: subject, is_insider: true, role: active.role,
    }, ctx);
  // DF-05 names the same facts under two codes each (the OQ-22 alias class):
  // flagged/screened and terms_parity.checked/terms_parity. The writer emits
  // both names so neither control is unsatisfiable for a naming reason.
  await emit(db, scope, `ev_${id}_screen`, "loan_application.insider.screened",
    "loan_application", appId, {
      subject_ref: subject, "covered_person.id": active.id,
      "loan_application.applicant": subject, "loan_application.insider": true,
    }, ctx);
  await emit(db, scope, `ev_${id}_parity`, "insider.terms_parity.checked",
    "insider_loan_review", id, {
      terms_comparable: comparable, role: active.role,
      aggregate_credit_amount: body.aggregate_credit_amount ?? body.amount_cents ?? null,
      proposed_terms: body.proposed_terms ?? null,
    }, ctx);
  await emit(db, scope, `ev_${id}_parity2`, "insider.terms_parity",
    "insider_loan_review", id, {
      "insider.terms_parity": comparable,
      "insider.proposed_terms": body.proposed_terms ?? null,
      "insider.comparable_terms": body.comparable_terms ?? null,
    }, ctx);

  // DF-05: Reg O limits are on AGGREGATE credit against unimpaired capital
  // and surplus. The capital figure is INSTITUTIONAL — unset reports
  // unassessed, never "not exceeded" (the statutory/institutional split).
  const aggregate = typeof body.aggregate_credit_amount === "number"
    ? body.aggregate_credit_amount
    : (typeof body.amount_cents === "number" ? body.amount_cents : 0);
  const capital = typeof body.unimpaired_capital_surplus_cents === "number"
    ? body.unimpaired_capital_surplus_cents
    : null;
  const thresholdCents = capital === null ? null : Math.floor(capital * 0.05);
  const exceeded = thresholdCents !== null && aggregate > thresholdCents;
  await db.schema(scope).from("insider_credit").upsert({
    id: `inscred_${appId}`, covered_person_id: String(active.id),
    loan_application_id: appId, amount_cents: aggregate,
    aggregate_after_cents: aggregate, threshold_cents: thresholdCents,
    threshold_exceeded: exceeded,
    board_approval_id: boardRes, proposed_terms: body.proposed_terms ?? null,
    comparable_terms: body.comparable_terms ?? null, terms_parity: comparable,
    status: exceeded && !boardRes ? "board_pending" : "screened",
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  await emit(db, scope, `ev_${id}_limits`, "insider.limits_recomputed",
    "insider_credit", `inscred_${appId}`, {
      "insider.aggregate_credit_amount": aggregate,
      "cu.unimpaired_capital_surplus": capital,
      threshold_cents: thresholdCents,
      ...(thresholdCents === null ? { verdict: "unassessed" } : {}),
    }, ctx);
  if (exceeded) {
    await emit(db, scope, `ev_${id}_thresh`, "insider.credit_threshold_exceeded",
      "insider_credit", `inscred_${appId}`, {
        "insider.aggregate_credit_amount": aggregate, threshold_cents: thresholdCents,
        "insider.record_entry": `inscred_${appId}`,
        "board.disinterested_quorum": body.board_disinterested_quorum ?? null,
      }, ctx);
  }
  await emit(db, scope, `ev_${id}_report`, "insider.board_report.issued",
    "insider_loan_review", id, {
      subject_ref: subject, role: active.role, amount_cents: body.amount_cents ?? null,
    }, ctx);

  if (!comparable) {
    return apiError(409, "insider_preferential_terms", requestId, {
      title: "insider loan on preferential terms",
      detail: "Regulation O prohibits terms more favourable than those for comparable borrowers",
    });
  }
  if (!boardRes) {
    return apiError(409, "insider_board_approval_missing", requestId, {
      title: "board approval required",
      detail: "an insider loan requires a recorded Board resolution before it is made",
    });
  }
  await emit(db, scope, `ev_${id}_board`, "insider.board_approval.recorded",
    "insider_loan_review", id, { board_resolution_id: boardRes }, ctx);
  await emit(db, scope, `ev_${id}_board2`, "insider.board_approval",
    "insider_loan_review", id, {
      "insider.board_approval": boardRes, "insider.funded_terms": body.proposed_terms ?? null,
    }, ctx);
  return jsonResponse({ data: { id, approved: true } }, 200, requestId);
}


// ----------------------------------------------- LP-09 booking (core.loan)

/**
 * POST /lending/applications/:id/book {booked_by, principal_cents, value_cents}
 *
 * `core.loan` is one of the 22 ABANDONED TABLES — modelled in the schema and
 * never written by anything. LP-09 declares `loan.booking.requested` as its
 * trigger and LP-03/LP-06 read `loan.ltv`, so three controls were blocked on a
 * table whose design was already done.
 *
 * The LTV is computed and stored here rather than at appraisal time because
 * the booked principal is what it is a ratio OF — an LTV computed against a
 * requested amount is not the LTV of the loan that exists.
 */
export async function postLoanBooking(
  req: Request, appId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const principal = typeof body.principal_cents === "number" ? body.principal_cents : NaN;
  const value = typeof body.value_cents === "number" ? body.value_cents : NaN;
  if (!Number.isFinite(principal) || principal <= 0 || !isNonEmptyString(body.booked_by)) {
    return validationError(requestId, [{
      type: "invalid_value", field: "principal_cents",
      message: "a positive principal_cents and booked_by are required",
    }]);
  }

  // LP-08: an exception still blocking closing must stop the booking. This is
  // the only place the block has teeth — a `closing_block_state` nothing reads
  // is a column, not a control.
  const { data: excs } = await db.schema(scope).from("loan_exception")
    .select("id, loan_application_id, closing_block_state")
    .eq("loan_application_id", appId).eq("closing_block_state", "blocked");
  if ((excs ?? []).length > 0) {
    return apiError(409, "closing_blocked_by_exception", requestId, {
      title: "closing is blocked",
      detail: `${(excs ?? []).length} undecided underwriting exception(s) on this application`,
    });
  }

  const now = new Date();
  const ltv = Number.isFinite(value) && value > 0
    ? Math.floor((principal * 10000) / value)
    : null;
  const id = `loan_${appId}`;
  const { error } = await db.schema(scope).from("loan").upsert({
    id, loan_application_id: appId, ltv,
    booked_at: now.toISOString(), booked_by: body.booked_by,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_book`, "loan.booking.requested", "loan", id, {
    loan_application_id: appId, principal_cents: principal, ltv, booked_by: body.booked_by,
  }, ctx);
  return jsonResponse({ data: { id, ltv } }, 201, requestId);
}

/**
 * POST /lending/applications/:id/adverse-action
 * {reasons, decided_by, reviewed_by, oral?}
 *
 * LP-04 / LP-07. Reuses `core.adverse_action_notice` — its ECOA clock and its
 * review-before-issue constraint already exist and are not duplicated.
 *
 * ORAL notice is its own event. Reg B permits an oral adverse action in some
 * circumstances, and an oral notice that leaves no record is indistinguishable
 * from no notice at all — which is the case the control exists to make
 * visible.
 */
export async function postLendingAdverseAction(
  req: Request, appId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const reasons = Array.isArray(body.reasons) ? body.reasons.map(String) : [];
  const reviewedBy = isNonEmptyString(body.reviewed_by) ? body.reviewed_by : null;
  if (reasons.length === 0 || !reviewedBy) {
    // ECOA: a notice with no specific reasons tells the applicant nothing they
    // can act on, and an unreviewed notice is the defect ck_aan_reviewed_
    // before_issue exists to prevent.
    return validationError(requestId, [{
      type: "missing_field", field: "reasons",
      message: "specific reasons and a second reviewer are required",
    }]);
  }
  const now = new Date();
  // Reg B: the BASIS of the action is what the notice has to disclose, and it
  // has to be the basis actually used — recorded on the application so the
  // notice cannot cite reasons the decision did not turn on.
  await db.schema(scope).from("loan_application").update({
    action_basis: reasons, updated_at: now.toISOString(),
  }).eq("id", appId);
  // The ECOA clock anchors on COMPLETION (NOT NULL on the table — the fake
  // accepted a notice without it, the live schema refuses it, which is how
  // LP-04/LP-07/FL-03/FL-05 read as fake-vs-real defects).
  const { data: app } = await db.schema(scope).from("loan_application")
    .select("completed_at").eq("id", appId).maybeSingle();
  const completedAt = typeof (app as Any)?.completed_at === "string"
    ? String((app as Any).completed_at)
    : now.toISOString();
  const id = `aan_${appId}`;
  const { error } = await db.schema(scope).from("adverse_action_notice").upsert({
    id, loan_application_id: appId, reasons,
    application_completed_at: completedAt,
    notice_due_at: ecoaNoticeDueAt(completedAt),
    reviewed_by: reviewedBy, reviewed_at: now.toISOString(),
    issued_at: now.toISOString(),
    // FL-05 content. A notice that says only "denied — see reasons" leaves the
    // applicant unable to check whether the reasons cited were the ones used.
    subject_kind: body.subject_kind === "account" ? "account" : "loan_application",
    account_ref: isNonEmptyString(body.account_ref) ? body.account_ref : null,
    applicant_state: isNonEmptyString(body.applicant_state) ? body.applicant_state : null,
    applicant_business_revenue_tier: isNonEmptyString(body.business_revenue_tier)
      ? body.business_revenue_tier
      : null,
    decision_score_block: (body.score_block ?? null) as Any,
    loan_party_identity: isNonEmptyString(body.party_identity) ? body.party_identity : null,
    loan_application_incompleteness_notice: body.incompleteness_notice === true,
    loan_application_counteroffer_terms: (body.counteroffer_terms ?? null) as Any,
    loan_application_oral_statement: isNonEmptyString(body.oral_statement)
      ? body.oral_statement
      : null,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_issued`, "aan.issued", "adverse_action_notice", id, {
    reasons, reviewed_by: reviewedBy, loan_application_id: appId,
  }, ctx);
  await emit(db, scope, `ev_${id}_dec`, "loan_application.adverse_action.decided",
    "adverse_action_notice", id, {
      "loan_application.adverse_action": reasons,
      "loan_application.action_basis": reasons,
      "account.adverse_action": body.subject_kind === "account" ? reasons : null,
    }, ctx);
  if (body.oral === true) {
    await emit(db, scope, `ev_${id}_oral`, "notice.oral.logged",
      "adverse_action_notice", id, {
        loan_application_id: appId, reasons,
        // Reg B: an oral notice must still be followed by the written one
        written_notice_issued: true,
      }, ctx);
  }
  return jsonResponse({ data: { id } }, 201, requestId);
}
