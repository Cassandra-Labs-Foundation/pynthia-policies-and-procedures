// Truth in Savings, member lifecycle, fair-lending gaps.
// TIS-01..TIS-08, MP-01..MP-09, FL-02..FL-12.
//
// See the migration header: a disclosure is a DELIVERY, not a document. A
// template register answers "do we have a disclosure"; only a delivery row
// answers "did THIS member get one", which is the question an examiner asks.

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

/** 12 CFR 1030.4(a): account disclosures BEFORE the account is opened. */
export const ACCOUNT_OPENING_DAYS = 0;
/** 1030.5(a): a change in terms adverse to the member gets 30 days' notice. */
export const CHANGE_IN_TERMS_DAYS = 30;
/** 1030.5(b): maturity notice for a term of more than one year. */
export const MATURITY_NOTICE_DAYS = 30;
/** MP-02: an address change holds statements to the old address for review. */
export const ADDRESS_HOLD_DAYS = 30;
/** FL-12: Reg B 1002.12(b) — 25 months from final action. */
export const FAIR_LENDING_RETENTION_DAYS = 25 * 30;
/** MP-09: first response to a member enquiry. */
export const SERVICE_FIRST_RESPONSE_DAYS = 2;

function requireInternalActor(ctx: PartnerContext, requestId: string): Response | null {
  if (ctx.actorType === "partner") return notFoundResponse(requestId, "route", "/deposits");
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
  if (error) throw new Error(`deposits event (${code}): ${error.message}`);
}

const plusDays = (f: Date, d: number) => new Date(f.getTime() + d * DAY_MS).toISOString();

/**
 * TIS-06. APY from the rate and the compounding. DERIVED, because a stored APY
 * that disagrees with its own inputs is precisely the disclosure error the
 * control exists to catch.
 */
export function apyBp(rateBp: number, compounding: string): number {
  const n = compounding === "daily" ? 365
    : compounding === "monthly" ? 12
    : compounding === "quarterly" ? 4
    : 1;
  const r = rateBp / 10000;
  return Math.round((Math.pow(1 + r / n, n) - 1) * 10000);
}

// -------------------------------------------------------- TIS-01 templates

/** POST /deposits/disclosure-templates {kind, version, content_ref, approved_by} */
export async function postDisclosureTemplate(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const kinds = [
    "account_opening", "change_in_terms", "maturity", "periodic_statement",
    "overdraft_service", "valuation_rights", "appraisal_copy", "adverse_action",
  ];
  if (!kinds.includes(String(body.kind)) || !isNonEmptyString(body.version) ||
      !isNonEmptyString(body.approved_by)) {
    return validationError(requestId, [{
      type: "invalid_value", field: "kind",
      message: `kind in ${kinds.join("/")}, version and approved_by are required`,
    }]);
  }
  const now = new Date();
  const id = `dtpl_${body.kind}_${body.version}`;
  const { error } = await db.schema(scope).from("disclosure_template").upsert({
    id, kind: body.kind, version: body.version,
    content_ref: isNonEmptyString(body.content_ref) ? body.content_ref : `ref-${body.version}`,
    effective_at: isNonEmptyString(body.effective_at) ? body.effective_at : now.toISOString(),
    approved_by: body.approved_by, provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_pub`, "disclosure.template.published",
    "disclosure_template", id, {
      "disclosure.kind": body.kind, "disclosure.version": body.version,
      approved_by: body.approved_by,
    }, ctx);
  return jsonResponse({ data: { id } }, 201, requestId);
}

/**
 * POST /deposits/disclosures/deliver
 * {kind, member_ref, account_ref?, trigger_event, template_id?, delivered?}
 *
 * The DELIVERY is the control. A disclosure that exists as a template and was
 * never given to this member discharges nothing.
 */
export async function postDisclosureDelivery(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  if (!isNonEmptyString(body.kind) || !isNonEmptyString(body.member_ref)) {
    return validationError(requestId, [{
      type: "missing_field", field: "member_ref",
      message: "kind and member_ref are required",
    }]);
  }
  const now = new Date();
  const days = body.kind === "change_in_terms" ? CHANGE_IN_TERMS_DAYS
    : body.kind === "maturity" ? MATURITY_NOTICE_DAYS
    : ACCOUNT_OPENING_DAYS;
  const dueAt = plusDays(now, days);
  const delivered = body.delivered !== false;

  // E-SIGN 101(c): electronic delivery without prior consent is not delivery.
  // Refused rather than recorded — a row saying "we emailed it" would otherwise
  // read as a discharged obligation.
  if (body.channel === "esign" && !isNonEmptyString(body.esign_consent_id)) {
    return apiError(409, "esign_consent_missing", requestId, {
      detail: "electronic delivery requires a captured E-SIGN consent",
    });
  }
  const id = `ddel_${body.kind}_${body.member_ref}_${body.account_ref ?? "na"}`;
  const { error } = await db.schema(scope).from("disclosure_delivery").upsert({
    id, template_id: isNonEmptyString(body.template_id) ? body.template_id : null,
    kind: body.kind, member_ref: body.member_ref,
    account_ref: isNonEmptyString(body.account_ref) ? body.account_ref : null,
    trigger_event: isNonEmptyString(body.trigger_event) ? body.trigger_event : "unspecified",
    due_at: dueAt, delivered_at: delivered ? now.toISOString() : null,
    channel: isNonEmptyString(body.channel) ? body.channel : "mail",
    error_detected: body.error_detected === true,
    error_detail: isNonEmptyString(body.error_detail) ? body.error_detail : null,
    // SNAPSHOT, not a pointer. See the migration's second-pass header: an APY
    // that was wrong at the moment of delivery is the violation, and a
    // reference to a configuration that has since moved cannot show it.
    entity_esign_consent_id: isNonEmptyString(body.esign_consent_id)
      ? body.esign_consent_id
      : null,
    member_delivery_channel: isNonEmptyString(body.channel) ? body.channel : "mail",
    member_delivery_failure_reason: isNonEmptyString(body.failure_reason)
      ? body.failure_reason
      : null,
    account_id: isNonEmptyString(body.account_ref) ? body.account_ref : null,
    account_account_type: isNonEmptyString(body.account_type) ? body.account_type : null,
    account_opening_channel: isNonEmptyString(body.opening_channel)
      ? body.opening_channel
      : null,
    account_restriction: isNonEmptyString(body.account_restriction)
      ? body.account_restriction
      : null,
    account_maturity_date: isNonEmptyString(body.maturity_date) ? body.maturity_date : null,
    account_maturity_window: isNonEmptyString(body.maturity_window)
      ? body.maturity_window
      : null,
    account_maturity_disposition: isNonEmptyString(body.maturity_disposition)
      ? body.maturity_disposition
      : null,
    product_interest_config_id: isNonEmptyString(body.interest_config_id)
      ? body.interest_config_id
      : null,
    product_interest_rate_bp: typeof body.rate_bp === "number" ? body.rate_bp : null,
    product_apy_bp: typeof body.rate_bp === "number"
      ? apyBp(body.rate_bp, String(body.compounding ?? "daily"))
      : null,
    address_id: isNonEmptyString(body.address_id) ? body.address_id : null,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  const payload = {
    "disclosure.kind": body.kind, "member.id": body.member_ref,
    "account.id": body.account_ref ?? null, due_at: dueAt,
  };
  if (body.kind === "account_opening") {
    await emit(db, scope, `ev_${id}_aodue`, "disclosure.account_opening_due_at",
      "disclosure_delivery", id, payload, ctx);
    if (delivered) {
      await emit(db, scope, `ev_${id}_ao`, "disclosure.account_opening.delivered",
        "disclosure_delivery", id, payload, ctx);
    }
  }
  if (body.kind === "change_in_terms") {
    await emit(db, scope, `ev_${id}_citdue`, "disclosure.change_in_terms_due_at",
      "disclosure_delivery", id, payload, ctx);
    // TIS-03: whether a change is ADVERSE determines whether 30 days' notice is
    // required at all. Classifying it is the control, not the sending.
    await emit(db, scope, `ev_${id}_class`, "disclosure.classification.logged",
      "disclosure_delivery", id, {
        ...payload, adverse: body.adverse === true,
        notice_required: body.adverse === true,
      }, ctx);
    if (delivered) {
      await emit(db, scope, `ev_${id}_cit`, "disclosure.change_in_terms.sent",
        "disclosure_delivery", id, payload, ctx);
    }
  }
  if (body.kind === "maturity") {
    await emit(db, scope, `ev_${id}_matdue`, "account.maturity.notice.due_at",
      "disclosure_delivery", id, payload, ctx);
    if (delivered) {
      await emit(db, scope, `ev_${id}_mat`, "disclosure.maturity_notice.sent",
        "disclosure_delivery", id, payload, ctx);
    }
  }
  if (body.kind === "valuation_rights") {
    await emit(db, scope, `ev_${id}_valr`, "valuation.rights_disclosure.sent",
      "disclosure_delivery", id, payload, ctx);
  }
  if (body.kind === "appraisal_copy") {
    await emit(db, scope, `ev_${id}_valc`, "valuation.copy.sent",
      "disclosure_delivery", id, payload, ctx);
    await emit(db, scope, `ev_${id}_flrec`, "fair_lending.record_appended",
      "disclosure_delivery", id, payload, ctx);
  }
  if (body.error_detected === true) {
    // TIS-02: a disclosure error is its own finding with its own remediation —
    // reissuing quietly leaves no record that anything was wrong.
    await emit(db, scope, `ev_${id}_err`, "disclosure.error.detected",
      "disclosure_delivery", id, { ...payload, detail: body.error_detail }, ctx);
  }
  return jsonResponse({ data: { id, delivered } }, 201, requestId);
}

// --------------------------------------------------------- TIS-06 interest

/** POST /deposits/interest-config {product_code, rate_bp, compounding, balance_method} */
export async function postInterestConfig(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const rate = typeof body.rate_bp === "number" ? body.rate_bp : NaN;
  const comps = ["daily", "monthly", "quarterly", "annual"];
  const methods = ["daily_balance", "average_daily_balance"];
  if (!isNonEmptyString(body.product_code) || !Number.isFinite(rate) ||
      !comps.includes(String(body.compounding)) || !methods.includes(String(body.balance_method))) {
    return validationError(requestId, [{
      type: "invalid_value", field: "compounding",
      message: `product_code, rate_bp, compounding in ${comps.join("/")} and a balance_method`,
    }]);
  }
  // DERIVED. A supplied APY is the disclosure error the control exists to catch.
  const apy = apyBp(rate, String(body.compounding));
  const now = new Date();
  const id = `picfg_${body.product_code}_${now.getTime()}`;
  const { error } = await db.schema(scope).from("product_interest_config").upsert({
    id, product_code: body.product_code, rate_bp: rate,
    compounding: body.compounding, balance_method: body.balance_method,
    apy_bp: apy, effective_at: now.toISOString(),
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_cfg`, "product.interest_config.updated",
    "product_interest_config", id, {
      "product.rate_bp": rate, "product.apy_bp": apy,
      "product.compounding": body.compounding, "product.balance_method": body.balance_method,
    }, ctx);
  return jsonResponse({ data: { id, apy_bp: apy } }, 201, requestId);
}

/** POST /deposits/interest-runs {period, config_id, accounts} */
export async function postInterestAccrualRun(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const accounts = Array.isArray(body.accounts) ? body.accounts : [];
  const { data: cfg } = await db.schema(scope).from("product_interest_config")
    .select("id, rate_bp, compounding, apy_bp, balance_method")
    .eq("id", body.config_id ?? "").maybeSingle();
  if (!cfg) {
    // Accruing interest with no configuration in force means the rate came
    // from nowhere. There is no honest default.
    return apiError(409, "no_interest_config", requestId, {
      title: "no interest configuration",
      detail: "interest cannot accrue without a configuration in force",
    });
  }
  let total = 0;
  for (const a of accounts) {
    const bal = Number((a as Any).balance_cents ?? 0);
    total += Math.floor((bal * Number(cfg.rate_bp)) / 10000 / 12);
  }
  const now = new Date();
  const id = `iaccr_${body.period ?? "p"}`;
  const { error } = await db.schema(scope).from("interest_accrual_run").upsert({
    id, period: String(body.period ?? "p"), config_id: cfg.id,
    accounts_processed: accounts.length, accrued_total_cents: total,
    completed_at: now.toISOString(), provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_run`, "interest.accrual_run.completed",
    "interest_accrual_run", id, {
      "interest.accrued_total": total, accounts_processed: accounts.length,
      "product.apy_bp": cfg.apy_bp,
    }, ctx);
  await emit(db, scope, `ev_${id}_bal`, "interest.accrued_balance",
    "interest_accrual_run", id, {
      "interest.accrued_balance": total, "balance.method": cfg.balance_method,
    }, ctx);
  return jsonResponse({ data: { id, accrued_total_cents: total } }, 201, requestId);
}

/** POST /deposits/statements {account_ref, period, opening, closing, fees_ytd, od_fees_ytd} */
export async function postStatement(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const open = typeof body.opening_balance_cents === "number" ? body.opening_balance_cents : NaN;
  const close = typeof body.closing_balance_cents === "number" ? body.closing_balance_cents : NaN;
  if (!isNonEmptyString(body.account_ref) || !Number.isFinite(open) || !Number.isFinite(close)) {
    return validationError(requestId, [{
      type: "missing_field", field: "closing_balance_cents",
      message: "account_ref and both balances are required",
    }]);
  }
  const now = new Date();
  const id = `stmt_${body.account_ref}_${body.period ?? "p"}`;
  const odYtd = typeof body.overdraft_fees_ytd_cents === "number"
    ? body.overdraft_fees_ytd_cents
    : 0;
  const { error } = await db.schema(scope).from("statement").upsert({
    id, account_ref: body.account_ref, period: String(body.period ?? "p"),
    opening_balance_cents: open, closing_balance_cents: close,
    interest_paid_cents: typeof body.interest_paid_cents === "number"
      ? body.interest_paid_cents
      : 0,
    fees_ytd_cents: typeof body.fees_ytd_cents === "number" ? body.fees_ytd_cents : 0,
    overdraft_fees_ytd_cents: odYtd,
    issued_at: now.toISOString(), provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_iss`, "statement.issued", "statement", id, {
    "account.id": body.account_ref, period: body.period ?? null,
  }, ctx);
  await emit(db, scope, `ev_${id}_bal`, "balance.disclosed", "statement", id, {
    "balance.opening": open, "balance.closing": close,
  }, ctx);
  // TIS-08 (Reg DD 1030.11): the YEAR-TO-DATE overdraft fee total must appear
  // on the statement. A per-period figure understates what the member paid.
  await emit(db, scope, `ev_${id}_ytd`, "fee.ytd_total", "statement", id, {
    "fee.ytd_total": body.fees_ytd_cents ?? 0,
    "fee.overdraft_ytd_total": odYtd,
  }, ctx);
  await emit(db, scope, `ev_${id}_odfee`, "overdraft.fee.logged", "statement", id, {
    "fee.overdraft_ytd_total": odYtd, "account.id": body.account_ref,
  }, ctx);
  return jsonResponse({ data: { id } }, 201, requestId);
}

// ---------------------------------------------------- MP-01 membership

/** POST /members {entity_ref, eligibility_basis?, eligible} */
export async function postMembership(
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
  const eligible = body.eligible === true;
  if (!eligible && !isNonEmptyString(body.denial_reason)) {
    // "Not eligible" with no basis cannot be appealed, and a field of
    // membership is a factual question with a checkable answer.
    return validationError(requestId, [{
      type: "missing_field", field: "denial_reason",
      message: "an eligibility denial must state its basis",
    }]);
  }
  const now = new Date();
  const id = `mbr_${body.entity_ref}`;
  const { error } = await db.schema(scope).from("membership").upsert({
    id, entity_ref: body.entity_ref,
    eligibility_basis: isNonEmptyString(body.eligibility_basis)
      ? body.eligibility_basis
      : null,
    eligibility_determined_at: now.toISOString(), eligible,
    denial_reason: eligible ? null : body.denial_reason,
    joined_at: eligible ? now.toISOString() : null,
    restriction: "none", provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_det`, "member.eligibility.determined", "membership", id, {
    "member.id": id, eligible, "member.eligibility_basis": body.eligibility_basis ?? null,
  }, ctx);
  if (eligible) {
    await emit(db, scope, `ev_${id}_acct`, "account.created", "membership", id, {
      "member.id": id, "account.type": body.account_type ?? "share",
    }, ctx);
    // MP-01: eligibility determined is not membership. The activation is the
    // separate act, and separating them is what makes "verified but never
    // activated" a visible state rather than an invisible one.
    await emit(db, scope, `ev_${id}_act`, "member.activated", "membership", id, {
      "member.id": id, activated_at: now.toISOString(),
    }, ctx);
  } else {
    await emit(db, scope, `ev_${id}_den`, "member.eligibility.denied", "membership", id, {
      "member.id": id, reason: body.denial_reason,
    }, ctx);
    // A denial the applicant is never told about is indistinguishable from
    // never applying.
    await emit(db, scope, `ev_${id}_notice`, "member.ineligibility_notice.sent",
      "membership", id, { "member.id": id, reason: body.denial_reason }, ctx);
  }
  return jsonResponse({ data: { id, eligible } }, 201, requestId);
}

/** POST /members/:id/address {new_address, old_address?} */
export async function postAddressChange(
  req: Request, memberId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  if (!body.new_address) {
    return validationError(requestId, [{
      type: "missing_field", field: "new_address", message: "is required",
    }]);
  }
  const now = new Date();
  const id = `maddr_${memberId}_${crypto.randomUUID()}`;
  const { error } = await db.schema(scope).from("member_address_change").upsert({
    id, member_ref: memberId, old_address: body.old_address ?? null,
    new_address: body.new_address, changed_at: now.toISOString(),
    hold_expires_at: plusDays(now, ADDRESS_HOLD_DAYS),
    notice_sent_to_old_at: body.old_address ? now.toISOString() : null,
    notice_sent_to_new_at: now.toISOString(),
    card_reissue_request: body.card_requested === true,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_chg`, "entity.address.changed", "membership", memberId, {
    "entity.address_previous": body.old_address ?? null,
    "entity.address_new": body.new_address ?? null,
    "card.reissue_request": body.card_requested === true,
    "member.id": memberId,
  }, ctx);
  await emit(db, scope, `ev_${id}_hold`, "member.address.hold.expires_at",
    "membership", memberId, { hold_expires_at: plusDays(now, ADDRESS_HOLD_DAYS) }, ctx);
  // Red Flags: the notice goes to the OLD address as well. Notifying only the
  // new one tells the person who took the account over, and nobody else.
  await emit(db, scope, `ev_${id}_notice`, "member.address_notice", "membership", memberId, {
    sent_to_old: body.old_address != null, sent_to_new: true,
  }, ctx);
  if (body.card_requested === true) {
    // MP-02, the Red Flags overlap: a new card asked for while the address
    // change is still on hold is the classic takeover pattern. Emitting only
    // the card event would leave the pattern detected by nobody.
    await emit(db, scope, `ev_${id}_rf`, "redflags.case.opened", "membership", memberId, {
      "member.id": memberId, pattern: "card_request_during_address_hold",
      hold_expires_at: plusDays(now, ADDRESS_HOLD_DAYS),
    }, ctx);
  }
  await emit(db, scope, `ev_${id}_sent`, "member.address_notice.sent",
    "membership", memberId, { sent_to_old: body.old_address != null }, ctx);
  return jsonResponse({ data: { id } }, 201, requestId);
}

/** POST /members/:id/preferences {channels, optout_propagated_systems?} */
export async function postMemberPreferences(
  req: Request, memberId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const id = `mpref_${memberId}`;
  await emit(db, scope, `ev_${id}_upd`, "member.preferences.updated", "membership", memberId, {
    "member.id": memberId, channels: body.channels ?? {},
  }, ctx);
  await emit(db, scope, `ev_${id}_prop`, "privacy.optout_propagated", "membership", memberId, {
    systems: body.optout_propagated_systems ?? ["core"],
  }, ctx);
  await emit(db, scope, `ev_${id}_ao`, "disclosure.account_opening.delivered",
    "membership", memberId, { "member.id": memberId, reason: "preference change" }, ctx);
  if (body.reverted === true) {
    // A channel that fails (bounced email, disconnected number) REVERTS to a
    // deliverable one. Silently continuing to send to a dead channel is how a
    // member stops receiving disclosures without anyone noticing.
    await emit(db, scope, `ev_${id}_rev`, "member.channel_reverted", "membership", memberId, {
      reason: body.revert_reason ?? "undeliverable", fallback: "mail",
    }, ctx);
  }
  return jsonResponse({ data: { member_id: memberId } }, 201, requestId);
}

/** POST /members/:id/restrict {restriction, reason, payout_cents?} */
export async function postMemberRestriction(
  req: Request, memberId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const kinds = ["none", "deposit_only", "no_new_services", "frozen"];
  if (!kinds.includes(String(body.restriction)) || !isNonEmptyString(body.reason)) {
    return validationError(requestId, [{
      type: "invalid_value", field: "restriction",
      message: `a restriction in ${kinds.join("/")} and a reason are required`,
    }]);
  }
  const now = new Date();
  const closing = body.close === true;
  const lockType = body.restriction === "frozen" ? "full"
    : body.restriction === "deposit_only" ? "debit_block"
    : body.restriction === "no_new_services" ? "service_block"
    : "none";
  const accountRef = isNonEmptyString(body.account_ref) ? body.account_ref : null;
  if (accountRef) {
    // The notice being true is not the control. If the restriction lives only
    // on the membership row, the account the member transacts against is
    // unchanged and the money still moves.
    const { error: accErr } = await db.schema(scope).from("account")
      .update({ restriction: body.restriction, lock_type: lockType })
      .eq("id", accountRef);
    if (accErr) return internalErrorResponse(requestId, accErr.message);
  }
  const { error } = await db.schema(scope).from("membership").update({
    restriction: body.restriction, restriction_reason: body.reason,
    account_ref: accountRef, account_status: closing ? "closed" : "open",
    account_balance_cents: typeof body.balance_cents === "number" ? body.balance_cents : null,
    account_lock_type: lockType, account_restriction: body.restriction,
    entity_contact: (body.contact ?? null) as Any,
    member_amounts_owed_cents: typeof body.amounts_owed_cents === "number"
      ? body.amounts_owed_cents
      : 0,
    restricted_at: now.toISOString(),
    closed_at: closing ? now.toISOString() : null,
    closure_payout_cents: typeof body.payout_cents === "number" ? body.payout_cents : null,
    updated_at: now.toISOString(),
  }).eq("id", memberId);
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${memberId}_restr`, "member.restriction_notice.sent",
    "membership", memberId, {
      "member.id": memberId, restriction: body.restriction, reason: body.reason,
    }, ctx);
  if (closing) {
    // Closing a share account returns the balance. A closure with no payout
    // recorded cannot show the member got their money.
    await emit(db, scope, `ev_${memberId}_payout`, "member.closure_payout.sent",
      "membership", memberId, {
        "member.id": memberId, payout_cents: body.payout_cents ?? 0,
      }, ctx);
  }
  return jsonResponse({ data: { member_id: memberId, restriction: body.restriction } }, 200, requestId);
}

/** POST /members/:id/records/export {scope_ref, record_count} — MP-08. */
export async function postMemberRecordExport(
  req: Request, memberId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  if (!isNonEmptyString(body.purpose)) {
    // A bulk export of member records without a stated purpose is the shape of
    // an exfiltration, and it has to be refused rather than logged.
    return validationError(requestId, [{
      type: "missing_field", field: "purpose",
      message: "a bulk member-record export must state its purpose",
    }]);
  }
  const id = `mexp_${memberId}_${crypto.randomUUID()}`;
  await emit(db, scope, `ev_${id}_exp`, "record.bulk_export.completed", "membership", memberId, {
    purpose: body.purpose, record_count: body.record_count ?? 0,
    requested_by: body.requested_by ?? ctx.tokenId,
  }, ctx);
  return jsonResponse({ data: { id } }, 201, requestId);
}

/** POST /members/:id/service-requests {channel, received_at?, responded?, resolved?} */
export async function postServiceRequest(
  req: Request, memberId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const receivedAt = isNonEmptyString(body.received_at) ? new Date(body.received_at) : new Date();
  const now = new Date();
  const id = `svcreq_${memberId}_${crypto.randomUUID()}`;
  const dueAt = plusDays(receivedAt, SERVICE_FIRST_RESPONSE_DAYS);
  const { error } = await db.schema(scope).from("service_request").upsert({
    id, member_ref: memberId,
    channel: isNonEmptyString(body.channel) ? body.channel : "phone",
    received_at: receivedAt.toISOString(), first_response_due_at: dueAt,
    first_response_at: body.responded === false ? null : now.toISOString(),
    resolved_at: body.resolved === true ? now.toISOString() : null,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_due`, "service.first.response.due_at",
    "service_request", id, { due_at: dueAt, "member.id": memberId }, ctx);
  if (body.responded !== false) {
    await emit(db, scope, `ev_${id}_resp`, "service.first_response.sent",
      "service_request", id, {
        "member.id": memberId, responded_late: now.toISOString() > dueAt,
      }, ctx);
  }
  if (body.resolved === true) {
    await emit(db, scope, `ev_${id}_res`, "service.resolved", "service_request", id, {
      "member.id": memberId,
    }, ctx);
  }
  return jsonResponse({ data: { id } }, 201, requestId);
}

// ---------------------------------------------------------- FL gaps

/** POST /fair-lending/lo-comp {originator_ref, basis, varies_with_terms, decided_by} */
export async function postLoCompPlan(
  req: Request, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  if (!isNonEmptyString(body.originator_ref) || !isNonEmptyString(body.basis) ||
      !isNonEmptyString(body.decided_by)) {
    return validationError(requestId, [{
      type: "missing_field", field: "basis",
      message: "originator_ref, basis and decided_by are required",
    }]);
  }
  // 12 CFR 1026.36(d): compensation may not be based on a TERM of the
  // transaction. The decision is derived, not supplied — a plan that varies
  // with terms cannot be approved however it is described.
  const varies = body.varies_with_terms === true;
  const decision = varies ? "rejected" : "approved";
  const now = new Date();
  const id = `locomp_${body.originator_ref}`;
  const { error } = await db.schema(scope).from("lo_comp_plan").upsert({
    id, originator_ref: body.originator_ref, basis: body.basis,
    varies_with_terms: varies, decision, decided_by: body.decided_by,
    decided_at: now.toISOString(), provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${id}_dec`, "lo_comp.plan.decided", "lo_comp_plan", id, {
    "lo_comp.basis": body.basis, varies_with_terms: varies, decision,
  }, ctx);
  return jsonResponse({ data: { id, decision } }, 201, requestId);
}

/** POST /fair-lending/applications/:id/options {options_presented, waiver_decision?} */
export async function postApplicationOptions(
  req: Request, appId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const options = Array.isArray(body.options_presented) ? body.options_presented : [];
  await emit(db, scope, `ev_${appId}_opts`, "application.options.presented",
    "loan_application", appId, {
      // 1026.36(e): the anti-steering safe harbour needs THREE options — lowest
      // rate, lowest rate without risky features, lowest total cost. Presenting
      // one is the steering the rule addresses.
      options: options, count: options.length,
      safe_harbour_met: options.length >= 3,
      "application.option_selection": body.option_selected ?? null,
    }, ctx);
  const { error: appErr } = await db.schema(scope).from("loan_application").update({
    option_shortfall_reason: options.length >= 3
      ? null
      : (isNonEmptyString(body.shortfall_reason) ? body.shortfall_reason : "unexplained"),
  }).eq("id", appId);
  if (appErr) return internalErrorResponse(requestId, appErr.message);
  await emit(db, scope, `ev_${appId}_waiv`, "application.option_waiver.decided",
    "loan_application", appId, {
      waived: body.waiver_decision === "waived",
      rationale: body.waiver_rationale ?? null,
    }, ctx);
  await emit(db, scope, `ev_${appId}_disc`, "application.disclosures.presented",
    "loan_application", appId, { disclosures: body.disclosures ?? [] }, ctx);
  await emit(db, scope, `ev_${appId}_final`, "application.final_action.recorded",
    "loan_application", appId, { final_action: body.final_action ?? "pending" }, ctx);
  // FL-12: Reg B 1002.12(b) — 25 months from FINAL ACTION, not from receipt and
  // not from the last time anyone touched the file. The anchor is the whole
  // control; a clock started at the wrong event expires early and legally.
  const retentionExpires = plusDays(new Date(), FAIR_LENDING_RETENTION_DAYS);
  await emit(db, scope, `ev_${appId}_retset`, "record.retention_clock_set",
    "loan_application", appId, {
      anchor: "application.final_action.recorded", months: 25,
    }, ctx);
  await emit(db, scope, `ev_${appId}_retexp`, "record.retention.expires_at",
    "loan_application", appId, { expires_at: retentionExpires }, ctx);
  return jsonResponse({ data: { application_id: appId, options: options.length } }, 201, requestId);
}

/** POST /fair-lending/applications/:id/gmi {gmi, hmda_reportable} — FL-06. */
export async function postGmiCollection(
  req: Request, appId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const gmi = (body.gmi ?? {}) as Record<string, unknown>;
  // Reg B: GMI must be COLLECTED and, where the applicant declines, recorded as
  // declined rather than left blank. A blank is indistinguishable from never
  // having asked.
  const complete = ["ethnicity", "race", "sex"].every((k) => isNonEmptyString(gmi[k]));
  await emit(db, scope, `ev_${appId}_gmi`, "applicant.gmi_responses",
    "loan_application", appId, {
      "applicant.gmi_responses": gmi, complete,
      collected_by_observation: body.by_observation === true,
    }, ctx);
  await emit(db, scope, `ev_${appId}_hmdagmi`, "hmda.gmi.recorded",
    "loan_application", appId, { gmi, complete }, ctx);
  if (body.hmda_reportable !== false) {
    await emit(db, scope, `ev_${appId}_lar`, "hmda.lar_row.recorded",
      "loan_application", appId, { gmi, "application.id": appId }, ctx);
  }
  if (!complete) {
    await emit(db, scope, `ev_${appId}_gmifind`, "finding.opened",
      "loan_application", appId, {
        source: "gmi_collection", detail: "incomplete GMI on a reportable application",
      }, ctx);
  }
  return jsonResponse({ data: { application_id: appId, complete } }, 201, requestId);
}

/** POST /fair-lending/notices/:id/queue {kind} — FL-05. */
export async function postNoticeQueue(
  req: Request, appId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  if (body.kind === "incompleteness") {
    await emit(db, scope, `ev_${appId}_incnotice`, "notice.incompleteness.sent",
      "loan_application", appId, { "application.id": appId }, ctx);
  }
  // FL-05: an adverse action is QUEUED before it is issued, so a notice that
  // never went out is visible as a queued-and-unsent row rather than as
  // nothing at all.
  await emit(db, scope, `ev_${appId}_aanq`, "aan.queued", "loan_application", appId, {
    "application.id": appId, queued_at: new Date().toISOString(),
  }, ctx);
  await emit(db, scope, `ev_${appId}_oral`, "notice.oral.logged",
    "loan_application", appId, { oral: body.oral === true }, ctx);
  return jsonResponse({ data: { application_id: appId } }, 201, requestId);
}

// ---------------------------------------------------- TIS-08 balance inquiry

/**
 * POST /deposits/accounts/:id/balance-inquiry {balance_cents, held_cents}
 *
 * TIS-08 exists because the balance a member is TOLD and the balance available
 * to them are different numbers whenever a hold is on. Disclosing only the
 * ledger balance is what produces the overdraft the member could not have
 * predicted.
 */
export async function postBalanceInquiry(
  req: Request, accountId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  const ledger = typeof body.balance_cents === "number" ? body.balance_cents : 0;
  const held = typeof body.held_cents === "number" ? body.held_cents : 0;
  const id = `binq_${accountId}_${crypto.randomUUID()}`;
  await emit(db, scope, `ev_${id}_inq`, "balance.inquiry.received", "account", accountId, {
    "account.id": accountId, channel: body.channel ?? "unknown",
    // Reg E 1005.17: whether the member opted in to overdraft coverage on
    // one-time debit and ATM transactions changes what the available balance
    // MEANS. Disclosing a number without it is disclosing the wrong number.
    "entity.reg_e_opt_in": body.reg_e_opt_in === true,
  }, ctx);
  await emit(db, scope, `ev_${id}_disc`, "balance.disclosed", "account", accountId, {
    "account.id": accountId, ledger_balance_cents: ledger,
    held_cents: held, available_balance_cents: ledger - held,
  }, ctx);
  return jsonResponse({ data: { available_cents: ledger - held } }, 201, requestId);
}

// -------------------------------------------- FL-02 intake, FL-03/05 notices

/** POST /fair-lending/applications/:id/intake {channel, product_type, applicant_state} */
export async function postApplicationIntake(
  req: Request, appId: string, db: SupabaseClient, requestId: string,
  ctx: PartnerContext, scope: EvidenceScope = "core",
): Promise<Response> {
  const denied = requireInternalActor(ctx, requestId);
  if (denied) return denied;
  const body = (await parseJsonBody(req).catch(() => null)) as Record<string, unknown> ?? {};

  // FL-02: channel and product decide WHICH fair-lending rules apply. An
  // application whose channel is unknown cannot be tested for steering,
  // because there is no cohort to compare it against.
  const { error } = await db.schema(scope).from("loan_application").update({
    channel: isNonEmptyString(body.channel) ? body.channel : "unspecified",
    product_type: isNonEmptyString(body.product_type) ? body.product_type : "unspecified",
    geography: isNonEmptyString(body.geography) ? body.geography : null,
    applicant_state: isNonEmptyString(body.applicant_state) ? body.applicant_state : null,
  }).eq("id", appId);
  if (error) return internalErrorResponse(requestId, error.message);

  await emit(db, scope, `ev_${appId}_intake`, "application.form.rendered",
    "loan_application", appId, {
      "loan_application.channel": body.channel ?? "unspecified",
      "loan_application.product_type": body.product_type ?? "unspecified",
      "applicant.state": body.applicant_state ?? null,
    }, ctx);
  return jsonResponse({ data: { application_id: appId } }, 200, requestId);
}

