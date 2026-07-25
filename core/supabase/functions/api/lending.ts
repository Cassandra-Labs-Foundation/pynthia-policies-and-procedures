// Loan origination spine — LP-03 (applications), LP-07 (adverse action),
// LP-11 (OFAC gate).
//
// Lending is 15 controls. This is the spine the rest hang off, not all of them:
// the application lifecycle, the ECOA adverse-action obligation, and the OFAC
// screen on loan parties. Credit scoring (LP-04), ATR/QM (LP-05), appraisals
// (LP-06), pricing (LP-10) and insider lending (LP-14) are not built.
//
// THE ECOA CLOCK RUNS FROM COMPLETION, NOT FROM DECISION
//
// Reg B gives 30 days from the date the application was COMPLETE. Anchoring on
// the decision date would let a slow decision silently extend the notice
// deadline — the same failure shape as the SAR clock running from triage rather
// than detection, and the same fix.
//
// LP-11 IS HALF OF OQ-02
//
// OQ-02 recorded that CG-OFAC-01's screen is a sandbox stub AND that screening
// never runs at payment submission. Those are two different problems: the
// missing list is domain-blocked, the missing CALL SITE was architectural. This
// builds the call site, with the funding block LP-11 requires. The screen it
// calls is still the stub, and every party row records that its list version is
// unknown so the gap stays visible on the data rather than only in a document.

import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { type PartnerContext } from "./auth.ts";
import { type EvidenceScope, provenanceFor, raiseAlert } from "./bsa.ts";
import {
  apiError,
  internalErrorResponse,
  isNonEmptyString,
  jsonResponse,
  notFoundResponse,
  parseJsonBody,
  sha256Hex,
  validationError,
  type ValidationErrorItem,
} from "./lib.ts";

/** ECOA / Reg B: 30 days from the date the application was complete. */
export const ECOA_NOTICE_DAYS = 30;

const PARTY_ROLES = ["borrower", "co_borrower", "guarantor"] as const;
const ADVERSE_ACTIONS = ["denied", "counteroffer", "incomplete"] as const;

const SWEEP_LIMIT = 100;

/**
 * OFAC statuses that permit funding.
 *
 * `unscreened` is deliberately absent. A party nobody screened has not been
 * found clean, and treating the two the same is how an unscreened borrower
 * gets funded.
 */
const FUNDABLE_OFAC = new Set(["clear", "cleared_after_review"]);

/**
 * The sandbox screen, unchanged from kyc.ts and still a stub (OQ-02).
 *
 * Deliberately NOT re-implemented differently here: two screens that disagree
 * would be worse than one that is honestly limited.
 */
function ofacScreen(name: string): "clear" | "potential_match" {
  return /\bSDN\b/i.test(name) ? "potential_match" : "clear";
}

export function ecoaNoticeDueAt(completedAt: string): string {
  const d = new Date(completedAt);
  d.setUTCDate(d.getUTCDate() + ECOA_NOTICE_DAYS);
  return d.toISOString();
}

export function isAdverse(finalAction: string): boolean {
  return (ADVERSE_ACTIONS as readonly string[]).includes(finalAction);
}

// NOTE: no blanket actor gate here, deliberately. Lending is a partner-facing
// product so a partner MAY originate an application. What a partner must not do
// is review or issue its own adverse action notice — enforced per endpoint by
// the four-eyes check in postAanIssue rather than by excluding partners from the
// whole domain.

async function emitLendingEvent(
  db: SupabaseClient,
  scope: EvidenceScope,
  id: string,
  code: string,
  resourceType: string,
  resourceId: string,
  payload: Record<string, unknown>,
  ctx?: PartnerContext,
): Promise<void> {
  const { error } = await db.schema(scope).from("event").upsert({
    id,
    code,
    resource_type: resourceType,
    resource_id: `${resourceType}:${resourceId}`,
    payload,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw new Error(`lending event (${code}): ${error.message}`);
}

/**
 * POST /lending/applications/{id}/parties {role, party_name, entity_id?}
 *
 * LP-11: every borrower, co-borrower and guarantor is screened when added, and
 * a potential match BLOCKS funding until it is reviewed.
 */
export async function postLoanParty(
  req: Request,
  applicationId: string,
  db: SupabaseClient,
  requestId: string,
  ctx: PartnerContext,
  scope: EvidenceScope = "core",
): Promise<Response> {
  const body = await parseJsonBody(req).catch(() => null);
  const rec = body && typeof body === "object" ? body as Record<string, unknown> : {};

  const errors: ValidationErrorItem[] = [];
  if (!PARTY_ROLES.includes(rec.role as typeof PARTY_ROLES[number])) {
    errors.push({
      type: "invalid_value",
      field: "role",
      message: `must be one of: ${PARTY_ROLES.join(", ")}`,
    });
  }
  if (!isNonEmptyString(rec.party_name)) {
    errors.push({ type: "missing_field", field: "party_name", message: "is required to screen" });
  }
  if (errors.length) return validationError(requestId, errors);

  const { data: app, error: appErr } = await db.schema(scope).from("loan_application")
    .select("id, status, funding_block_state").eq("id", applicationId).maybeSingle();
  if (appErr) return internalErrorResponse(requestId, appErr);
  if (!app) return notFoundResponse(requestId, "loan_application", applicationId);

  const partyId = `lparty_${applicationId}_${String(rec.role)}_${await sha256Hex(String(rec.party_name))}`.slice(0, 120);
  const nowIso = new Date().toISOString();
  const verdict = ofacScreen(String(rec.party_name));

  const { error: insErr } = await db.schema(scope).from("loan_party").upsert({
    id: partyId,
    loan_application_id: applicationId,
    entity_id: isNonEmptyString(rec.entity_id) ? rec.entity_id : null,
    role: rec.role,
    party_name: rec.party_name,
    // LP-11 declares the party's identity and contact alongside the screen
    // RESULT. A screen recorded without what was screened cannot be re-run or
    // disputed — the same defect OQ-02 records against the stub itself.
    identity: rec.identity ?? null,
    contact: rec.contact ?? null,
    ofac_result: verdict,
    ofac_status: verdict,
    // NULL, always, and that is the point: the stub screen has no versioned
    // list, so no screen here can be re-verified later (OQ-02).
    ofac_list_version: null,
    ofac_screened_at: nowIso,
    provenance: provenanceFor(scope, ctx),
  }, { onConflict: "id" });
  if (insErr) return internalErrorResponse(requestId, insErr);

  if (verdict === "potential_match") {
    // LP-11: the block is on FUNDING, not on the application. The application
    // may proceed to a decision; the money may not move.
    const { error: blkErr } = await db.schema(scope).from("loan_application")
      .update({ funding_block_state: "blocked" }).eq("id", applicationId);
    if (blkErr) return internalErrorResponse(requestId, blkErr);

    try {
      await raiseAlert(db, {
        ctx,
        scope,
        alertType: "ofac",
        entityHash: await sha256Hex(String(rec.party_name)),
        causeType: "loan_party",
        causeId: partyId,
        details:
          `OFAC potential match on loan party (application=${applicationId}, ` +
          `role=${rec.role}); funding blocked pending review`,
      });
      await emitLendingEvent(
        db, scope, `evt_${partyId}_escalated`, "loan_party.ofac.escalated",
        "loan_party", partyId,
        { application_id: applicationId, role: rec.role },
        ctx,
      );
    } catch (e) {
      console.error(`ofac escalation failed for ${partyId}: ${e}`);
    }
  }

  try {
    await emitLendingEvent(
      db, scope, `evt_${partyId}_added`, "loan_party.added", "loan_party", partyId,
      { application_id: applicationId, role: rec.role, ofac_status: verdict },
      ctx,
    );
    // LP-11 declares the screen OUTCOMES as separate facts. Emitting only the
    // escalation meant a CLEAN screen left no evidence it had run at all, so
    // "screened and clear" and "never screened" produced the same event log —
    // exactly the defect the always-on OFAC floor exists to prevent on the
    // payment rails, reproduced on the lending rail.
    await emitLendingEvent(
      db, scope, `evt_${partyId}_screened`, "loan_party.ofac.screened", "loan_party", partyId,
      {
        application_id: applicationId, role: rec.role, ofac_status: verdict,
        ofac_list_version: null, screened_at: nowIso,
      },
      ctx,
    );
    if (verdict === "clear") {
      await emitLendingEvent(
        db, scope, `evt_${partyId}_cleared`, "loan_party.ofac.cleared", "loan_party", partyId,
        { application_id: applicationId, role: rec.role },
        ctx,
      );
    } else {
      await emitLendingEvent(
        db, scope, `evt_${partyId}_potential`, "loan_party.ofac_potential_match",
        "loan_party", partyId,
        { application_id: applicationId, role: rec.role },
        ctx,
      );
    }
  } catch (e) {
    console.error(`loan_party.added event failed for ${partyId}: ${e}`);
  }

  return jsonResponse({
    id: partyId,
    loan_application_id: applicationId,
    role: rec.role,
    ofac_status: verdict,
    ofac_list_version: null,
    funding_blocked: verdict === "potential_match",
    // stated on every response, not only in a document
    screening_caveat:
      "screened against a sandbox stub, not a versioned SDN list; this screen " +
      "cannot be re-verified (OQ-02)",
  }, 201, requestId);
}

/**
 * POST /lending/applications/{id}/decision {final_action, reasons?, decisioned_by}
 *
 * LP-03 records the final action. LP-07 queues an adverse action notice when
 * that action is adverse, with the ECOA clock anchored on COMPLETION.
 */
export async function postLoanDecision(
  req: Request,
  applicationId: string,
  db: SupabaseClient,
  requestId: string,
  ctx: PartnerContext,
  scope: EvidenceScope = "core",
): Promise<Response> {
  const body = await parseJsonBody(req).catch(() => null);
  const rec = body && typeof body === "object" ? body as Record<string, unknown> : {};

  const errors: ValidationErrorItem[] = [];
  const validActions = ["approved", ...ADVERSE_ACTIONS, "withdrawn"];
  if (!isNonEmptyString(rec.final_action) || !validActions.includes(rec.final_action)) {
    errors.push({
      type: "invalid_value",
      field: "final_action",
      message: `must be one of: ${validActions.join(", ")}`,
    });
  }
  // ECOA requires SPECIFIC reasons for an adverse action. Demanded at the
  // decision, not at notice time, because reconstructing why later is exactly
  // what produces boilerplate reasons.
  if (isNonEmptyString(rec.final_action) && isAdverse(rec.final_action)) {
    if (!Array.isArray(rec.reasons) || rec.reasons.length === 0) {
      errors.push({
        type: "missing_field",
        field: "reasons",
        message:
          "an adverse action requires at least one SPECIFIC reason (ECOA); " +
          "reasons cannot be reconstructed later",
      });
    }
  }
  if (errors.length) return validationError(requestId, errors);

  const { data: app, error: appErr } = await db.schema(scope).from("loan_application")
    .select("id, status, completed_at, decisioned_at, final_action, funding_block_state")
    .eq("id", applicationId).maybeSingle();
  if (appErr) return internalErrorResponse(requestId, appErr);
  if (!app) return notFoundResponse(requestId, "loan_application", applicationId);

  const row = app as unknown as Record<string, unknown>;
  if (row.decisioned_at) {
    return jsonResponse({ id: applicationId, final_action: row.final_action }, 200, requestId, {
      "Idempotent-Replayed": "true",
    });
  }
  if (!row.completed_at) {
    // The ECOA clock has no anchor until the application is complete, so a
    // decision here would produce a notice deadline with no basis.
    return apiError(409, "application_incomplete", requestId, {
      title: "Application Incomplete",
      detail:
        `loan application ${applicationId} has no completed_at; the ECOA notice ` +
        `clock runs from completion and cannot be anchored`,
    });
  }

  const nowIso = new Date().toISOString();
  const finalAction = rec.final_action as string;

  const { error: updErr } = await db.schema(scope).from("loan_application")
    .update({
      status: "decisioned",
      decisioned_at: nowIso,
      decisioned_by: ctx.tokenId,
      final_action: finalAction,
    })
    .eq("id", applicationId);
  if (updErr) return internalErrorResponse(requestId, updErr);

  let aan: Record<string, unknown> | null = null;
  if (isAdverse(finalAction)) {
    const aanId = `aan_${applicationId}`;
    const dueAt = ecoaNoticeDueAt(String(row.completed_at));
    const { error: aanErr } = await db.schema(scope).from("adverse_action_notice").upsert({
      id: aanId,
      loan_application_id: applicationId,
      // anchored on COMPLETION, so a slow decision cannot extend the deadline
      application_completed_at: row.completed_at,
      notice_due_at: dueAt,
      reasons: rec.reasons,
      credit_score_disclosed: rec.credit_score_disclosed === true,
      cra_disclosure_included: rec.cra_disclosure_included === true,
      provenance: provenanceFor(scope, ctx),
    }, { onConflict: "id", ignoreDuplicates: true });
    if (aanErr) return internalErrorResponse(requestId, aanErr);

    try {
      await emitLendingEvent(
        db, scope, `evt_${aanId}_queued`, "aan.queued", "adverse_action_notice", aanId,
        { application_id: applicationId, final_action: finalAction, notice_due_at: dueAt },
        ctx,
      );
    } catch (e) {
      console.error(`aan.queued event failed for ${aanId}: ${e}`);
    }
    aan = { id: aanId, notice_due_at: dueAt, reviewed: false, issued: false };
  }

  try {
    await emitLendingEvent(
      db, scope, `evt_${applicationId}_final_action`, "application.final_action.recorded",
      "loan_application", applicationId,
      { final_action: finalAction, decisioned_by: ctx.tokenId },
      ctx,
    );
  } catch (e) {
    console.error(`final action event failed for ${applicationId}: ${e}`);
  }

  return jsonResponse({
    id: applicationId,
    final_action: finalAction,
    decisioned_at: nowIso,
    decisioned_by: ctx.tokenId,
    adverse_action_notice: aan,
    funding_block_state: row.funding_block_state,
  }, 200, requestId);
}

/**
 * POST /lending/aan/{id}/issue {issued_by}
 *
 * LP-07: issuance requires prior second-level review by a different actor. The
 * database enforces the ordering (ck_aan_reviewed_before_issue) because an
 * issued notice cannot be recalled.
 */
export async function postAanIssue(
  // no body is read: issuance is the act itself, and the issuer comes from the
  // authenticated context rather than the payload
  _req: Request,
  aanId: string,
  db: SupabaseClient,
  requestId: string,
  ctx: PartnerContext,
  scope: EvidenceScope = "core",
): Promise<Response> {
  const { data, error: selErr } = await db.schema(scope).from("adverse_action_notice")
    .select("id, loan_application_id, reviewed_by, reviewed_at, issued_at, notice_due_at")
    .eq("id", aanId).maybeSingle();
  if (selErr) return internalErrorResponse(requestId, selErr);
  if (!data) return notFoundResponse(requestId, "adverse_action_notice", aanId);

  const row = data as unknown as Record<string, unknown>;
  if (row.issued_at) {
    return jsonResponse({ id: aanId, issued_at: row.issued_at }, 200, requestId, {
      "Idempotent-Replayed": "true",
    });
  }
  if (!row.reviewed_by) {
    return apiError(409, "second_review_required", requestId, {
      title: "Second Review Required",
      detail:
        `adverse action notice ${aanId} has not passed second-level review; ` +
        `LP-07 requires Compliance or senior underwriting sign-off before issuance`,
    });
  }
  if (row.reviewed_by === ctx.tokenId) {
    // the third instance of the same four-eyes property
    return apiError(409, "four_eyes_violation", requestId, {
      title: "Four Eyes Violation",
      detail: `token ${ctx.tokenId} reviewed this notice and may not also issue it`,
    });
  }

  const nowIso = new Date().toISOString();
  const late = new Date(nowIso) > new Date(String(row.notice_due_at));

  const { error: updErr } = await db.schema(scope).from("adverse_action_notice")
    .update({ issued_at: nowIso, issued_by: ctx.tokenId }).eq("id", aanId);
  if (updErr) return internalErrorResponse(requestId, updErr);

  try {
    await emitLendingEvent(
      db, scope, `evt_${aanId}_issued`, "aan.issued", "adverse_action_notice", aanId,
      {
        application_id: row.loan_application_id,
        issued_by: ctx.tokenId,
        reviewed_by: row.reviewed_by,
        due_at: row.notice_due_at,
        late,
      },
      ctx,
    );
  } catch (e) {
    console.error(`aan.issued event failed for ${aanId}: ${e}`);
  }

  return jsonResponse({
    id: aanId,
    issued_at: nowIso,
    issued_by: ctx.tokenId,
    reviewed_by: row.reviewed_by,
    issued_late: late,
  }, 200, requestId);
}

/**
 * POST /lending/sweep — the NEGATIVES.
 *
 * Three absences, none of which produce an event on their own:
 *   an adverse decision whose ECOA notice was never issued
 *   a loan party nobody screened
 *   an application whose funding block was never resolved
 */
export async function postLendingSweep(
  _req: Request,
  db: SupabaseClient,
  requestId: string,
  ctx: PartnerContext,
  scope: EvidenceScope = "core",
): Promise<Response> {
  const nowIso = new Date().toISOString();
  const overdueNotices: { id: string; due_at: string }[] = [];

  const { data: aans, error } = await db.schema(scope).from("adverse_action_notice")
    .select("id, loan_application_id, notice_due_at, issued_at")
    .is("issued_at", null)
    .lt("notice_due_at", nowIso)
    .limit(SWEEP_LIMIT);
  if (error) return internalErrorResponse(requestId, error);

  for (const r of (aans ?? []) as unknown as Record<string, unknown>[]) {
    const id = String(r.id);
    try {
      await emitLendingEvent(
        db, scope, `evt_${id}_overdue`, "aan.notice_overdue", "adverse_action_notice", id,
        { due_at: r.notice_due_at, application_id: r.loan_application_id, detected_at: nowIso },
        ctx,
      );
      overdueNotices.push({ id, due_at: String(r.notice_due_at) });
    } catch (e) {
      console.error(`aan overdue event failed for ${id}: ${e}`);
    }
  }

  const { data: unscreened, error: uErr } = await db.schema(scope).from("loan_party")
    .select("id, loan_application_id, role")
    .eq("ofac_status", "unscreened")
    .limit(SWEEP_LIMIT);
  if (uErr) return internalErrorResponse(requestId, uErr);

  const { data: blocked, error: bErr } = await db.schema(scope).from("loan_application")
    .select("id, funding_block_state")
    .eq("funding_block_state", "blocked")
    .limit(SWEEP_LIMIT);
  if (bErr) return internalErrorResponse(requestId, bErr);

  const unscreenedRows = (unscreened ?? []) as unknown[];
  return jsonResponse({
    swept_at: nowIso,
    overdue_notices: overdueNotices,
    overdue_notice_count: overdueNotices.length,
    // an unscreened party is NOT a clear one
    unscreened_parties: unscreenedRows.length,
    blocked_applications: ((blocked ?? []) as unknown[]).length,
    ...(unscreenedRows.length
      ? {
        warning:
          `${unscreenedRows.length} loan part(ies) have never been screened; ` +
          `unscreened is not clear and these cannot be funded`,
      }
      : {}),
    truncated: ((aans ?? []) as unknown[]).length >= SWEEP_LIMIT,
  }, 200, requestId);
}

/** Exported for the funding gate — LP-11's actual teeth. */
export function fundingPermitted(parties: { ofac_status: string }[]): boolean {
  return parties.every((p) => FUNDABLE_OFAC.has(p.ofac_status));
}
