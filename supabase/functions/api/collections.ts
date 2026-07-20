// Collections — CO-01..CO-11.
//
// See the migration header: delinquency is DERIVED from the due date and the
// payment history, never a status somebody sets. What is stored is the
// evaluation, with its inputs, so a classification can be recomputed.

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

/**
 * REGULATORY bands (NCUA / FFIEC retail credit classification). These are
 * lookups, like the PCA bands — not institutional choices.
 */
export const CLASSIFY_SPECIAL_MENTION_DPD = 30;
export const CLASSIFY_SUBSTANDARD_DPD = 90;
export const CLASSIFY_DOUBTFUL_DPD = 120;
export const CHARGE_OFF_DPD = 180;
/** Nonaccrual at 90 days past due. */
export const NONACCRUAL_DPD = 90;
/** The institution's own earlier touchpoints — configured, not statutory. */
export const EARLY_STAGE_DPD = 10;
export const LATE_STAGE_DPD = 30;
/** FDCPA 1692c(a)(1): no contact before 8am or after 9pm local time. */
export const CONTACT_EARLIEST_HOUR = 8;
export const CONTACT_LATEST_HOUR = 21;
/** CO-07: the furnishing cycle. */
const FURNISHING_CYCLE_DAYS = 30;

function requireInternalActor(ctx: PartnerContext, requestId: string): Response | null {
  if (ctx.actorType === "partner") return notFoundResponse(requestId, "route", "/collections");
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
  if (error) throw new Error(`collections event (${code}): ${error.message}`);
}

const plusDays = (f: Date, d: number) => new Date(f.getTime() + d * DAY_MS).toISOString();

/** Days past due, from the due date and the evaluation date. Never stored raw. */
export function daysPastDue(nextDueDate: string, asOf: Date): number {
  const due = new Date(`${nextDueDate}T00:00:00.000Z`).getTime();
  return Math.max(0, Math.floor((asOf.getTime() - due) / DAY_MS));
}

export function stageFor(dpd: number): string {
  if (dpd >= CHARGE_OFF_DPD) return "charge_off_eligible";
  if (dpd >= CLASSIFY_SUBSTANDARD_DPD) return "seriously_delinquent";
  if (dpd >= LATE_STAGE_DPD) return "late";
  if (dpd >= EARLY_STAGE_DPD) return "early";
  return "current";
}

export function classificationFor(dpd: number): string {
  if (dpd >= CHARGE_OFF_DPD) return "loss";
  if (dpd >= CLASSIFY_DOUBTFUL_DPD) return "doubtful";
  if (dpd >= CLASSIFY_SUBSTANDARD_DPD) return "substandard";
  if (dpd >= CLASSIFY_SPECIAL_MENTION_DPD) return "special_mention";
  return "pass";
}

// ---------------------------------------------------- CO-01 policy and scope

/** POST /collections/policy {version, approved_by, scope} */
export async function postCollectionsPolicy(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  if (!isNonEmptyString(body.version) || !isNonEmptyString(body.approved_by)) {
    return validationError(requestId, [{
      type: "missing_field", field: "approved_by",
      message: "version and approved_by are required",
    }]);
  }
  const id = `colpol_${body.version}`;
  await emit(db, scope, `ev_${id}_act`, "collections.policy_version.activated",
    "collections", id, {
      "collections.policy_version": body.version, approved_by: body.approved_by,
      "collections.scope": body.scope ?? null,
    }, ctx);
  await emit(db, scope, `ev_${id}_review`, "collections.policy_review.completed",
    "collections", id, {
      "collections.policy_version": body.version, "collections.scope": body.scope ?? null,
      // CO-01: agencies acting for the credit union are in scope of its policy
      agencies: body.agencies ?? [],
    }, ctx);
  await emit(db, scope, `ev_${id}_board`, "collections.board_report.issued",
    "collections", id, { "collections.policy_version": body.version }, ctx);
  // A policy with no breach register cannot show it is followed. Logging the
  // absence of breaches is as much the control as logging one.
  await emit(db, scope, `ev_${id}_breach`, "collections.policy_breach.logged",
    "collections", id, {
      breaches: body.breaches ?? [], count: Array.isArray(body.breaches) ? body.breaches.length : 0,
    }, ctx);
  return jsonResponse({ data: { id } }, 201, requestId);
}

// -------------------------------- CO-02/03/09 delinquency and classification

/**
 * POST /collections/loans/:id/evaluate {as_of?}
 *
 * The whole of CO-02, CO-03 and CO-09 in one derivation. Days past due is
 * computed from the due date; the stage, the classification and the nonaccrual
 * verdict all follow from it. Nothing here is set by hand.
 */
export async function postDelinquencyEvaluation(
  req: Request, loanId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const { data: loan } = await db.schema(scope).from("loan")
    .select("id, member_ref, product, product_type, principal_cents, next_due_date, nonaccrual_at, charged_off_at, grace_period_days, last_payment_date, collateral_value, ltv, accrued_interest, collectibility_assessment, repayment_evidence, entity_contact, bankruptcy_case_id, estate_claim_status, estimated_recovery")
    .eq("id", loanId).maybeSingle();
  if (!loan) return notFoundResponse(requestId, "loan", loanId);
  if (!isNonEmptyString(loan.next_due_date)) {
    // Without a due date there is no days-past-due, and a delinquency stage
    // asserted without one would be a guess.
    return apiError(409, "loan_has_no_due_date", requestId, {
      title: "cannot evaluate delinquency",
      detail: "the loan has no next_due_date, so days past due cannot be computed",
    });
  }

  const asOf = isNonEmptyString(body.as_of) ? new Date(body.as_of) : new Date();
  const dpd = daysPastDue(String(loan.next_due_date), asOf);
  const stage = stageFor(dpd);
  const classification = classificationFor(dpd);
  const nonaccrual = dpd >= NONACCRUAL_DPD;

  const id = `deval_${loanId}_${asOf.toISOString().slice(0, 10)}`;
  const { error } = await db.schema(scope).from("delinquency_evaluation").upsert({
    id, loan_id: loanId, as_of: asOf.toISOString(),
    next_due_date: loan.next_due_date, days_past_due: dpd,
    stage, classification, nonaccrual,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await db.schema(scope).from("loan").update({
    // The GRACE PERIOD shifts when a loan is delinquent at all, so it is read
    // and written back rather than assumed to be zero.
    grace_period_days: typeof body.grace_period_days === "number"
      ? body.grace_period_days
      : (loan.grace_period_days ?? 0),
    last_payment_date: isNonEmptyString(body.last_payment_date)
      ? body.last_payment_date
      : (loan.last_payment_date ?? null),
    product_type: isNonEmptyString(body.product_type)
      ? body.product_type
      : (loan.product_type ?? loan.product ?? "consumer"),
    collateral_value: typeof body.collateral_value === "number"
      ? body.collateral_value
      : (loan.collateral_value ?? null),
    ltv: typeof body.ltv === "number" ? body.ltv : (loan.ltv ?? null),
    // "well secured" is what lets a delinquent loan keep accruing. Asserting it
    // without documentation is the judgment call the control exists to pin.
    well_secured_documented: body.well_secured_documented === true,
    accrued_interest: typeof body.accrued_interest === "number"
      ? body.accrued_interest
      : (loan.accrued_interest ?? 0),
    collectibility_assessment: isNonEmptyString(body.collectibility_assessment)
      ? body.collectibility_assessment
      : (loan.collectibility_assessment ?? null),
    repayment_evidence: isNonEmptyString(body.repayment_evidence)
      ? body.repayment_evidence
      : (loan.repayment_evidence ?? null),
    entity_contact: body.entity_contact ?? loan.entity_contact ?? null,
    // CO-02: the cure notice must state the amount and the alternatives. A
    // notice with neither tells the borrower nothing they can act on.
    past_due_amount: typeof body.past_due_amount === "number"
      ? body.past_due_amount
      : Math.max(0, Math.floor(Number(loan.principal_cents ?? 0) / 12) * Math.min(dpd / 30, 6)),
    workout_alternatives: body.workout_alternatives
      ?? ["forbearance", "extension", "rate_reduction"],
    // CO-03: bankruptcy and death are separate charge-off paths, each with its
    // own evidence and recovery estimate.
    bankruptcy_case_id: isNonEmptyString(body.bankruptcy_case_id)
      ? body.bankruptcy_case_id
      : (loan.bankruptcy_case_id ?? null),
    estate_claim_status: isNonEmptyString(body.estate_claim_status)
      ? body.estate_claim_status
      : (loan.estate_claim_status ?? null),
    estimated_recovery: typeof body.estimated_recovery === "number"
      ? body.estimated_recovery
      : (loan.estimated_recovery ?? null),
    days_past_due: dpd, delinquency_stage: stage, classification,
    nonaccrual_at: nonaccrual && !loan.nonaccrual_at ? asOf.toISOString() : loan.nonaccrual_at,
  }).eq("id", loanId);

  const payload = {
    "loan.days_past_due": dpd, "loan.stage": stage,
    "loan.classification": classification, "loan.id": loanId,
    "loan.balance": loan.principal_cents ?? null,
    "member.id": loan.member_ref ?? null,
  };
  await emit(db, scope, `ev_${id}_run`, "loan.delinquency_engine_run", "loan", loanId, payload, ctx);
  await emit(db, scope, `ev_${id}_dpd`, "loan.dpd.updated", "loan", loanId, payload, ctx);

  // Each threshold is its own declared trigger, because each carries a
  // different obligation. Emitting one generic "delinquent" event would make
  // the day-10 outreach and the day-90 classification indistinguishable.
  if (dpd >= EARLY_STAGE_DPD) {
    await emit(db, scope, `ev_${id}_d10`, "loan.delinquency_day_10", "loan", loanId, payload, ctx);
    await emit(db, scope, `ev_${id}_courtesy`, "collections.courtesy_notice.sent",
      "loan", loanId, payload, ctx);
    await emit(db, scope, `ev_${id}_note`, "collections.past_due_note.retained",
      "loan", loanId, payload, ctx);
  }
  if (dpd >= LATE_STAGE_DPD) {
    await emit(db, scope, `ev_${id}_d30`, "loan.delinquency_day_30", "loan", loanId, payload, ctx);
    await emit(db, scope, `ev_${id}_second`, "collections.second_reminder.sent",
      "loan", loanId, payload, ctx);
    // UCCC-style right to cure: the borrower must be told how to bring the loan
    // current BEFORE acceleration, not after.
    await emit(db, scope, `ev_${id}_cure`, "collections.right_to_cure.sent",
      "loan", loanId, payload, ctx);
  }
  if (dpd >= 60) {
    await emit(db, scope, `ev_${id}_d60`, "loan.delinquency_day_60", "loan", loanId, payload, ctx);
    await emit(db, scope, `ev_${id}_memo`, "collections.status_memo.filed",
      "loan", loanId, payload, ctx);
  }
  if (dpd >= CLASSIFY_SUBSTANDARD_DPD) {
    await emit(db, scope, `ev_${id}_d90`, "loan.delinquency_day_90", "loan", loanId, payload, ctx);
    await emit(db, scope, `ev_${id}_class`, "loan.classification.assigned",
      "loan", loanId, { ...payload, "loan.classification": classification }, ctx);
    await emit(db, scope, `ev_${id}_rating`, "loan.risk_rating", "loan", loanId, {
      ...payload, "loan.risk_rating": classification,
    }, ctx);
    await emit(db, scope, `ev_${id}_ratrev`, "loan.rating_review.completed",
      "loan", loanId, { ...payload, "loan.classification": classification }, ctx);
    await emit(db, scope, `ev_${id}_nonacc`, "loan.nonaccrual.triggered", "loan", loanId, {
      ...payload, nonaccrual_at: asOf.toISOString(),
    }, ctx);
    // "triggered" and "placed" are different facts: the first is the threshold,
    // the second is the ledger action. A trigger with no placement leaves
    // interest accruing on a loan that should not accrue.
    await emit(db, scope, `ev_${id}_nonaccp`, "loan.nonaccrual.placed", "loan", loanId, {
      ...payload, nonaccrual_at: asOf.toISOString(),
    }, ctx);
  }
  if (dpd >= CHARGE_OFF_DPD) {
    // Closed-end and open-end credit charge off on different schedules; the
    // corpus names them separately because the product determines which applies.
    const code = String(loan.product ?? "").includes("open")
      ? "loan.chargeoff_due_open_end"
      : "loan.chargeoff_due_closed_end";
    await emit(db, scope, `ev_${id}_codue`, code, "loan", loanId, {
      ...payload, charge_off_dpd: CHARGE_OFF_DPD,
    }, ctx);
  }
  if (dpd === 0 && loan.nonaccrual_at) {
    // A loan brought current comes OFF nonaccrual. Without this the loan stays
    // nonaccrual forever and the income is never restored.
    await emit(db, scope, `ev_${id}_restore`, "loan.accrual.restored", "loan", loanId, {
      ...payload, restored_at: asOf.toISOString(),
    }, ctx);
  }
  return jsonResponse({
    data: { loan_id: loanId, days_past_due: dpd, stage, classification, nonaccrual },
  }, 201, requestId);
}

/** POST /collections/loans/:id/charge-off {approved_by, amount_cents} */
export async function postChargeOff(
  req: Request, loanId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const { data: loan } = await db.schema(scope).from("loan")
    .select("id, days_past_due, charged_off_at, principal_cents").eq("id", loanId).maybeSingle();
  if (!loan) return notFoundResponse(requestId, "loan", loanId);
  if (!isNonEmptyString(body.approved_by)) {
    return validationError(requestId, [{
      type: "missing_field", field: "approved_by", message: "is required",
    }]);
  }
  const now = new Date();
  await db.schema(scope).from("loan")
    .update({ charged_off_at: now.toISOString() }).eq("id", loanId);
  await emit(db, scope, `ev_${loanId}_chargedoff`, "loan.charged_off", "loan", loanId, {
    "loan.days_past_due": loan.days_past_due ?? null,
    amount_cents: body.amount_cents ?? loan.principal_cents ?? null,
    approved_by: body.approved_by,
    // FFIEC: charging off LATE is its own finding — the loss was carried on the
    // books longer than the guidance allows.
    charged_off_late: Number(loan.days_past_due ?? 0) > CHARGE_OFF_DPD,
  }, ctx);
  await emit(db, scope, `ev_${loanId}_rewd`, "loan.re_writedown.booked", "loan", loanId, {
    // a second write-down after a partial charge-off is its own event; folding
    // it into the first understates the loss history
    amount_cents: body.amount_cents ?? null,
  }, ctx);
  await db.schema(scope).from("loan").update({
    foreclosure_impact_eval: isNonEmptyString(body.foreclosure_impact_eval)
      ? body.foreclosure_impact_eval
      : "not evaluated",
  }).eq("id", loanId);
  await emit(db, scope, `ev_${loanId}_fcl`, "loan.foreclosure.approved", "loan", loanId, {
    approved_by: body.approved_by, collateral: body.collateral ?? null,
    "loan.foreclosure_impact_eval": body.foreclosure_impact_eval ?? "not evaluated",
  }, ctx);
  await emit(db, scope, `ev_${loanId}_recovery`, "loan.recovery.tracked", "loan", loanId, {
    // a charged-off loan is still collectable; ceasing to track it is how
    // recoveries go unrecorded
    tracking: true,
  }, ctx);
  return jsonResponse({ data: { loan_id: loanId, charged_off: true } }, 200, requestId);
}

// ------------------------------------------------------------ CO-04 workouts

/**
 * POST /collections/loans/:id/modifications
 * {kind, borrower_hardship, concession_granted, requested_by, approved_by?}
 *
 * The TDR determination is DERIVED: hardship AND concession. Letting it be
 * supplied is how a troubled debt restructuring gets recorded as an ordinary
 * extension.
 */
export async function postLoanModification(
  req: Request, loanId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const kinds = [
    "forbearance", "extension", "rate_reduction", "term_extension", "reage", "settlement",
  ];
  if (!kinds.includes(String(body.kind)) || !isNonEmptyString(body.requested_by)) {
    return validationError(requestId, [{
      type: "invalid_value", field: "kind",
      message: `kind in ${kinds.join("/")} and requested_by are required`,
    }]);
  }
  const hardship = body.borrower_hardship === true;
  const concession = body.concession_granted === true;
  const tdr = hardship && concession;
  const approvedBy = isNonEmptyString(body.approved_by) ? body.approved_by : null;

  if (approvedBy && approvedBy === body.requested_by) {
    return apiError(409, "modification_self_approved", requestId, {
      title: "self-approved modification",
      detail: "a workout changes the contract and cannot be approved by whoever negotiated it",
    });
  }

  // FFIEC: re-aging is limited. Unlimited re-aging turns a delinquent loan into
  // a current one on paper without the borrower paying anything.
  const { data: priors } = await db.schema(scope).from("loan_modification")
    .select("id, loan_id, kind, decision").eq("loan_id", loanId);
  const reages = (priors ?? []).filter((m: Any) =>
    m.kind === "reage" && m.decision === "approved"
  ).length;
  if (body.kind === "reage" && reages >= 1) {
    return apiError(409, "reage_limit_exceeded", requestId, {
      title: "re-age limit exceeded",
      detail: "this loan has already been re-aged within the last 12 months",
    });
  }

  const now = new Date();
  const id = `lmod_${loanId}_${crypto.randomUUID()}`;
  const decision = approvedBy ? "approved" : "pending";
  const { error } = await db.schema(scope).from("loan_modification").upsert({
    id, loan_id: loanId, kind: body.kind,
    borrower_hardship: hardship, concession_granted: concession, tdr,
    requested_by: body.requested_by, approved_by: approvedBy, decision,
    decided_at: approvedBy ? now.toISOString() : null,
    effective_at: approvedBy ? now.toISOString() : null,
    reage_count_12m: body.kind === "reage" ? reages + 1 : 0,
    proposed_modification: body.proposed_modification ?? null,
    io_term_months: typeof body.io_term_months === "number" ? body.io_term_months : null,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_req`, "loan.modification.requested",
    "loan_modification", id, {
      kind: body.kind, "loan.id": loanId, requested_by: body.requested_by,
    }, ctx);
  await emit(db, scope, `ev_${id}_tdr`, "tdr.determination.recorded",
    "loan_modification", id, {
      tdr, borrower_hardship: hardship, concession_granted: concession,
    }, ctx);
  if (approvedBy) {
    await emit(db, scope, `ev_${id}_dec`, "loan.modification.decided",
      "loan_modification", id, {
        decision: "approved", approved_by: approvedBy, kind: body.kind,
      }, ctx);
    await emit(db, scope, `ev_${id}_sched`, "loan.modified_schedule",
      "loan_modification", id, { effective_at: now.toISOString(), tdr, kind: body.kind }, ctx);
    await emit(db, scope, `ev_${id}_elc`, "elc.modification.approved",
      "loan_modification", id, { approved_by: approvedBy, tdr }, ctx);
    // FFIEC: days-past-due may only be RESET after the borrower demonstrates
    // capacity — three consecutive payments. Resetting on approval alone is how
    // a delinquent loan becomes current without anything being paid.
    const eligible = body.payments_received_after_mod === true;
    await emit(db, scope, `ev_${id}_reseteligible`, "loan.dpd_reset_eligibility_check",
      "loan_modification", id, {
        eligible, basis: "three consecutive payments after modification",
      }, ctx);
    if (eligible) {
      // THE RESET HAS TO HAPPEN, not merely be announced. This emitted
      // `loan.dpd_reset` and changed nothing: the loan stayed delinquent, the
      // classification stayed where it was, and every test passed because they
      // asserted the EVENT. Found by sweeping for that shape after the
      // overdraft charge-off mutation survived on the same smell.
      await db.schema(scope).from("loan").update({
        days_past_due: 0, delinquency_stage: "current", classification: "pass",
      }).eq("id", loanId);
      await emit(db, scope, `ev_${id}_reset`, "loan.dpd_reset", "loan_modification", id, {
        tdr, kind: body.kind, days_past_due: 0,
      }, ctx);
    }
    await emit(db, scope, `ev_${id}_qrev`, "tdr.quarterly_review.completed",
      "loan_modification", id, { tdr, kind: body.kind }, ctx);
  }
  return jsonResponse({ data: { id, tdr, decision } }, 201, requestId);
}

// ----------------------------------------------------- CO-05 communications

/**
 * POST /collections/loans/:id/contact {channel, local_hour, member_ref}
 *
 * The FDCPA gate. Every protection is a STANDING STATE on the loan — attorney
 * representation, a cease-communication request, bankruptcy, SCRA — and each
 * blocks contact until it is lifted. See the standing-state rule in BLUEPRINT:
 * these govern future actions and cannot be a log of past requests.
 */
export async function postCollectionContact(
  req: Request, loanId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const channels = ["phone", "email", "sms", "letter", "in_person"];
  const hour = typeof body.local_hour === "number" ? body.local_hour : NaN;
  if (!channels.includes(String(body.channel)) || !Number.isFinite(hour)) {
    return validationError(requestId, [{
      type: "invalid_value", field: "local_hour",
      message: `channel in ${channels.join("/")} and the member's LOCAL hour are required`,
    }]);
  }
  const { data: loan } = await db.schema(scope).from("loan")
    .select("id, member_ref, attorney_represented, cease_communication_at, bankruptcy_flag, scra_flag")
    .eq("id", loanId).maybeSingle();
  if (!loan) return notFoundResponse(requestId, "loan", loanId);

  let reason: string | null = null;
  if (loan.attorney_represented === true) reason = "attorney_represented";
  else if (loan.cease_communication_at) reason = "cease_communication_requested";
  else if (loan.bankruptcy_flag === true) reason = "automatic_stay";
  else if (hour < CONTACT_EARLIEST_HOUR || hour >= CONTACT_LATEST_HOUR) {
    reason = "outside_permitted_hours";
  }

  const now = new Date();
  const id = `ccontact_${loanId}_${crypto.randomUUID()}`;
  const decision = reason === null ? "permitted" : "blocked";
  const { error } = await db.schema(scope).from("collection_contact").upsert({
    id, loan_id: loanId,
    member_ref: isNonEmptyString(body.member_ref)
      ? body.member_ref
      : String(loan.member_ref ?? "unknown"),
    channel: body.channel, attempted_at: now.toISOString(), local_hour: hour,
    decision, blocked_reason: reason, provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_log`, "collections.contact.logged",
    "collection_contact", id, {
      channel: body.channel, local_hour: hour, decision,
      "member.attorney_flag_set": loan.attorney_represented === true,
    }, ctx);
  if (decision === "blocked") {
    await emit(db, scope, `ev_${id}_gated`, "collections.contact_gated",
      "collection_contact", id, { reason, channel: body.channel }, ctx);
    return apiError(409, "collection_contact_blocked", requestId, {
      title: "contact blocked", detail: reason ?? "blocked",
    });
  }
  return jsonResponse({ data: { id, decision } }, 201, requestId);
}

/** POST /collections/loans/:id/protections {attorney_represented?, cease?, bankruptcy?, scra?} */
export async function postCollectionProtection(
  req: Request, loanId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const now = new Date();
  const patch: Record<string, unknown> = {};
  if (typeof body.attorney_represented === "boolean") {
    patch.attorney_represented = body.attorney_represented;
  }
  if (body.cease === true) patch.cease_communication_at = now.toISOString();
  if (body.cease === false) patch.cease_communication_at = null;
  if (typeof body.bankruptcy === "boolean") patch.bankruptcy_flag = body.bankruptcy;
  if (typeof body.scra === "boolean") patch.scra_flag = body.scra;
  if (Object.keys(patch).length === 0) {
    return validationError(requestId, [{
      type: "missing_field", field: "attorney_represented",
      message: "at least one protection must be set or cleared",
    }]);
  }
  const { error } = await db.schema(scope).from("loan").update(patch).eq("id", loanId);
  if (error) return internalErrorResponse(requestId, error.message);

  if (patch.attorney_represented === true) {
    await emit(db, scope, `ev_${loanId}_atty`, "member.attorney_flag_set", "loan", loanId, {
      "loan.id": loanId,
    }, ctx);
    await emit(db, scope, `ev_${loanId}_attyid`, "collections.attorney.identified",
      "loan", loanId, { attorney_ref: body.attorney_ref ?? null }, ctx);
  }
  if (body.cease === true) {
    await emit(db, scope, `ev_${loanId}_ceasereq`, "collections.cease_request.received",
      "loan", loanId, { requested_at: now.toISOString() }, ctx);
    await emit(db, scope, `ev_${loanId}_ceaseflag`, "member.cease_flag_set", "loan", loanId, {
      set_at: now.toISOString(),
    }, ctx);
  }
  if (isNonEmptyString(body.template_ref)) {
    // CO-05: collection letters are reviewed before use. An unapproved template
    // is the FDCPA exposure, not the individual letter.
    await emit(db, scope, `ev_${loanId}_tmplsub`, "collections.template.submitted",
      "loan", loanId, { template_ref: body.template_ref }, ctx);
    await emit(db, scope, `ev_${loanId}_tmplappr`, "collections.template.approved",
      "loan", loanId, {
        template_ref: body.template_ref, approved_by: body.template_approved_by ?? null,
      }, ctx);
  }
  return jsonResponse({ data: { loan_id: loanId, ...patch } }, 200, requestId);
}

// -------------------------------------------------------- CO-07 furnishing

/** POST /collections/furnishing/cycle {period, accounts_furnished} */
export async function postFurnishingCycle(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  // The furnished figures come from the evaluations, not from the caller. A
  // cycle that reports what someone typed cannot be reconciled against what
  // the bureaus received.
  const { data: loans } = await db.schema(scope).from("loan")
    .select("id, days_past_due, classification, charged_off_at, bankruptcy_flag");
  const furnished = (loans ?? []).filter((l: Any) => l.days_past_due != null);
  const now = new Date();
  const id = `furncycle_${body.period ?? "p"}`;

  await emit(db, scope, `ev_${id}_due`, "furnishing.cycle_due_at", "loan", id, {
    due_at: plusDays(now, FURNISHING_CYCLE_DAYS), period: body.period ?? null,
  }, ctx);
  await emit(db, scope, `ev_${id}_furn`, "furnishing.cycle.completed", "loan", id, {
    accounts_furnished: furnished.length,
    // FCRA 623(a)(2): a bankruptcy or a dispute changes what may be furnished,
    // so those counts travel with the cycle rather than being derived later
    bankruptcy_flagged: furnished.filter((l: Any) => l.bankruptcy_flag === true).length,
    charged_off: furnished.filter((l: Any) => l.charged_off_at).length,
    period: body.period ?? null,
  }, ctx);
  await emit(db, scope, `ev_${id}_file`, "furnishing.file_transmitted", "loan", id, {
    accounts_furnished: furnished.length, attested_by: body.attested_by ?? null,
  }, ctx);
  await emit(db, scope, `ev_${id}_findings`, "dispute.findings", "loan", id, {
    // FCRA distinguishes an ordinary accuracy dispute from an IDENTITY THEFT
    // one: the second requires a police report or FTC affidavit and blocks
    // furnishing on the tradeline. Recording only "a dispute" loses that.
    "dispute.category": body.dispute_category ?? "accuracy",
    "dispute.idtheft_report": body.idtheft_report ?? null,
    // FCRA 623(a)(8): the investigation's findings go back to the furnisher AND
    // the consumer. A cycle that transmits without findings closes nothing.
    disputes_investigated: body.disputes_investigated ?? 0,
  }, ctx);
  await emit(db, scope, `ev_${id}_corr`, "furnishing.correction.applied", "loan", id, {
    corrections: body.corrections ?? 0,
  }, ctx);
  await emit(db, scope, `ev_${id}_resolved`, "furnishing.dispute.resolved", "loan", id, {
    disputes_resolved: body.disputes_resolved ?? 0,
  }, ctx);
  await emit(db, scope, `ev_${id}_idtheft`, "fraud.idtheft_case.opened", "loan", id, {
    // an identity-theft dispute is not a data-quality dispute: it opens a fraud
    // case and blocks furnishing on the disputed tradeline
    idtheft_disputes: body.idtheft_disputes ?? 0,
  }, ctx);
  return jsonResponse({ data: { id, accounts_furnished: furnished.length } }, 201, requestId);
}

// --------------------------------------------------------- CO-10 overdraft

/** POST /collections/overdrafts {account_ref, balance_cents, days_negative, fees_assessed_cents?} */
export async function postOverdraftReferral(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const bal = typeof body.balance_cents === "number" ? body.balance_cents : NaN;
  const days = typeof body.days_negative === "number" ? body.days_negative : NaN;
  if (!isNonEmptyString(body.account_ref) || !Number.isFinite(bal) || !Number.isFinite(days)) {
    return validationError(requestId, [{
      type: "missing_field", field: "days_negative",
      message: "account_ref, balance_cents and days_negative are required",
    }]);
  }
  const waived = typeof body.fees_waived_cents === "number" ? body.fees_waived_cents : 0;
  const waiverBy = isNonEmptyString(body.waiver_approved_by) ? body.waiver_approved_by : null;
  if (waived > 0 && !waiverBy) {
    // A fee waiver is a giveaway of income; an unowned one is indistinguishable
    // from a fee that was never assessed.
    return validationError(requestId, [{
      type: "missing_field", field: "waiver_approved_by",
      message: "a fee waiver requires a named approver",
    }]);
  }

  const now = new Date();
  const id = `odref_${body.account_ref}`;
  const { error } = await db.schema(scope).from("overdraft_referral").upsert({
    id, account_ref: body.account_ref, balance_cents: bal, days_negative: days,
    referred_at: now.toISOString(),
    fees_assessed_cents: typeof body.fees_assessed_cents === "number"
      ? body.fees_assessed_cents
      : 0,
    fees_waived_cents: waived, waiver_approved_by: waiverBy,
    charged_off_at: days >= 45 ? now.toISOString() : null,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  const payload = {
    "overdraft.account_ref": body.account_ref, "overdraft.balance": bal,
    "overdraft.days_negative": days,
  };
  await emit(db, scope, `ev_${id}_ref`, "overdraft.referral.issued",
    "overdraft_referral", id, payload, ctx);
  await emit(db, scope, `ev_${id}_report`, "overdraft.report.reviewed",
    "overdraft_referral", id, payload, ctx);
  await emit(db, scope, `ev_${id}_feelog`, "overdraft.fee.logged",
    "overdraft_referral", id, {
      ...payload, fees_assessed_cents: body.fees_assessed_cents ?? 0,
    }, ctx);
  if (days >= 30) {
    // A recurring or long-running overdraft stops accruing fees. Continuing to
    // charge an account that cannot pay is the practice the control exists to
    // stop, and suppression has to be its own recorded act.
    await emit(db, scope, `ev_${id}_suppress`, "fee.overdraft.suppressed",
      "overdraft_referral", id, { ...payload, reason: "sustained negative balance" }, ctx);
    await emit(db, scope, `ev_${id}_pattern`, "overdraft.recurring_pattern.detected",
      "overdraft_referral", id, payload, ctx);
  }
  if (waived > 0) {
    await emit(db, scope, `ev_${id}_waivreq`, "overdraft.waiver.requested",
      "overdraft_referral", id, { ...payload, waived_cents: waived }, ctx);
    await emit(db, scope, `ev_${id}_waiver`, "overdraft.waiver.approved",
      "overdraft_referral", id, {
        ...payload, waived_cents: waived, approved_by: waiverBy,
      }, ctx);
  }
  if (days >= 45) {
    // NCUA: a negative balance is charged off at 45 days. Carrying it longer
    // overstates assets.
    await emit(db, scope, `ev_${id}_co`, "overdraft.charged_off",
      "overdraft_referral", id, { ...payload, charge_off_days: 45 }, ctx);
  }
  await emit(db, scope, `ev_${id}_track`, "overdraft.recovery.tracked",
    "overdraft_referral", id, payload, ctx);
  return jsonResponse({ data: { id, charged_off: days >= 45 } }, 201, requestId);
}
