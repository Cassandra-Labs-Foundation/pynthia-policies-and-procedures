import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { type AccountRow } from "./accounts.ts";
import { type GateResource, recordMovementArtifacts, runGate } from "./transfers.ts";
import {
  type BlnkConfig,
  BlnkError,
  commitInflight,
  recordTransaction,
  transactionMirror,
  voidInflight,
} from "../_shared/blnk.ts";
import {
  apiError,
  bankErrorResponse,
  claimIdempotency,
  internalErrorResponse,
  isNonEmptyString,
  jsonResponse,
  notFoundResponse,
  parseJsonBody,
  sha256Hex,
  storeIdempotencyResponse,
  validationError,
  type ValidationErrorItem,
} from "./lib.ts";

const CARD_NETWORK_BALANCE = "@CardNetwork";
const CURRENCY = "USD";

const CARD_RESOURCE = (id: string): GateResource => ({
  table: "card_authorization",
  type: "card_authorization",
  id,
  label: "card authorization",
  rejectedStatus: "declined",
});

export interface CardAuthRow {
  id: string;
  amount: number;
  status: string;
  merchant: string | null;
  decline_reason: string | null;
  blnk_inflight_id: string | null;
  blnk_committed_amount: number | null;
  originator?: { account_id?: string } | null;
  blnk_reference: string | null;
  blnk_status: string | null;
  created_at: string;
}

const CARD_COLS =
  "id, amount, status, merchant, decline_reason, originator, blnk_inflight_id, blnk_committed_amount, blnk_reference, blnk_status, created_at";

function cardResponse(
  row: CardAuthRow,
  controlResults?: { control_id: string; decision: string }[],
): Record<string, unknown> {
  const captured = row.blnk_committed_amount ?? 0;
  return {
    id: row.id,
    status: row.status,
    amount_cents: row.amount,
    captured_cents: captured,
    // what is still held and could yet be captured or released
    remaining_cents: Math.max(0, row.amount - captured),
    merchant: row.merchant,
    decline_reason: row.decline_reason,
    blnk_inflight_id: row.blnk_inflight_id,
    control_results: controlResults ?? [],
    created_at: row.created_at,
  };
}

/**
 * POST /payments/card/authorize
 *
 * Places an authorization hold. Unlike wires/ACH this hold is routinely settled
 * for LESS than the authorized amount (tip adjustments, partial shipment), and
 * may be captured across SEVERAL calls — so the hold is not a single
 * commit-or-void, it is drawn down incrementally. See postCardCapture.
 */
export async function postCardAuthorize(
  req: Request,
  db: SupabaseClient,
  cfg: BlnkConfig,
  requestId: string,
): Promise<Response> {
  const idempotencyKey = req.headers.get("Idempotency-Key");
  if (!idempotencyKey) {
    return apiError(400, "idempotency_key_required", requestId, {
      title: "Idempotency Key Required",
      detail: "POST /payments/card/authorize requires an Idempotency-Key header",
    });
  }

  const body = await parseJsonBody(req);
  if (body === null || typeof body !== "object") {
    return validationError(requestId, [
      { type: "invalid_value", field: "body", message: "must be a JSON object" },
    ]);
  }
  const b = body as Record<string, unknown>;
  const sourceAccountId = b.source_account_id;
  const amountCents = b.amount_cents;
  const merchant = b.merchant;

  const errors: ValidationErrorItem[] = [];
  if (!isNonEmptyString(sourceAccountId)) {
    errors.push({ type: "missing_field", field: "source_account_id", message: "is required" });
  }
  if (typeof amountCents !== "number" || !Number.isInteger(amountCents) || amountCents <= 0) {
    errors.push({
      type: "invalid_value",
      field: "amount_cents",
      message: "must be a positive integer number of cents",
    });
  }
  if (!isNonEmptyString(merchant)) {
    errors.push({ type: "missing_field", field: "merchant", message: "is required" });
  }
  if (errors.length) return validationError(requestId, errors);

  const amount = amountCents as number;
  const sourceId = sourceAccountId as string;
  const merchantName = merchant as string;

  const requestHash = await sha256Hex(
    JSON.stringify({ source_account_id: sourceId, amount_cents: amount, merchant: merchantName }),
  );

  const freshId = `cauth_${crypto.randomUUID()}`;
  const claim = await claimIdempotency(
    db,
    idempotencyKey,
    requestHash,
    freshId,
    "POST /payments/card/authorize",
  );

  if (claim.kind === "replay") {
    return jsonResponse(claim.responseBody, claim.responseStatus, requestId, {
      "Idempotent-Replayed": "true",
    });
  }
  if (claim.kind === "conflict") {
    return apiError(409, "idempotency_key_reused", requestId, {
      title: "Idempotency Key Reused",
      detail: "Idempotency-Key was used with a different request body",
    });
  }

  const authId = claim.kind === "resume" ? claim.transferId : freshId;

  const { data: account, error: acctErr } = await db.schema("core").from("account")
    .select("id, account_type, balance, blnk_ledger_id, blnk_balance_id, balance_synced_at, lock_type, status, created_at")
    .eq("id", sourceId)
    .maybeSingle();
  if (acctErr) return internalErrorResponse(requestId, acctErr);
  if (!account) return notFoundResponse(requestId, "account", sourceId);
  if (!account.blnk_balance_id) {
    return apiError(409, "account_not_provisioned", requestId, {
      title: "Account Not Provisioned",
      detail: "source account has no Blnk balance yet",
    });
  }

  const { error: insErr } = await db.schema("core").from("card_authorization").upsert({
    id: authId,
    amount,
    originator: { account_id: sourceId },
    merchant: merchantName,
    status: "authorized",
    blnk_committed_amount: 0,
  });
  if (insErr) return internalErrorResponse(requestId, insErr);

  // Gate before the hold, same as every other rail.
  let gate;
  try {
    gate = await runGate(db, cfg, CARD_RESOURCE(authId), account as AccountRow, null, amount);
  } catch (err) {
    return internalErrorResponse(requestId, err);
  }
  if (gate.blocked) {
    // A gate rejection is a DECLINE in card terms; record why on the row so the
    // decline reason survives for the compliance/ops record.
    await db.schema("core").from("card_authorization")
      .update({
        status: "declined",
        decline_reason: String((gate.body as Record<string, unknown>).type ?? "declined"),
      })
      .eq("id", authId);
    await storeIdempotencyResponse(db, idempotencyKey, gate.status, gate.body);
    return jsonResponse(gate.body, gate.status, requestId);
  }

  let mirror;
  try {
    const result = await recordTransaction(cfg, {
      coreResource: { table: "card_authorization", id: authId },
      amountCents: amount,
      currency: CURRENCY,
      source: account.blnk_balance_id,
      destination: CARD_NETWORK_BALANCE,
      description: `card authorization — ${merchantName}`,
      inflight: true,
    });
    mirror = result.mirror;
  } catch (err) {
    if (err instanceof BlnkError) return bankErrorResponse(requestId);
    return internalErrorResponse(requestId, err);
  }

  const { data: updated, error: updErr } = await db.schema("core").from("card_authorization")
    .update({
      // for card the inflight transaction id lands in blnk_inflight_id, not
      // blnk_transaction_id (see 20260702000500 column comment)
      blnk_inflight_id: mirror.blnk_transaction_id,
      blnk_reference: mirror.blnk_reference,
      blnk_status: mirror.blnk_status,
      synced_at: mirror.synced_at,
    })
    .eq("id", authId)
    .select(CARD_COLS)
    .single();
  if (updErr) return internalErrorResponse(requestId, updErr);

  const responseBody = cardResponse(updated as CardAuthRow, gate.controlResults);
  await storeIdempotencyResponse(db, idempotencyKey, 201, responseBody);
  return jsonResponse(responseBody, 201, requestId);
}

/**
 * POST /payments/card/{id}/capture
 *
 * Draws down the hold. Partial and INCREMENTAL: callable repeatedly until the
 * authorized amount is exhausted. Each call commits only the increment, and the
 * running total lives in blnk_committed_amount, so the row moves
 * authorized -> partially_captured -> captured. Over-capture is rejected rather
 * than clamped: silently capturing less than asked would misstate settlement.
 */
export async function postCardCapture(
  req: Request,
  authId: string,
  db: SupabaseClient,
  cfg: BlnkConfig,
  requestId: string,
): Promise<Response> {
  const { data: auth, error: selErr } = await db.schema("core").from("card_authorization")
    .select(CARD_COLS)
    .eq("id", authId)
    .maybeSingle();
  if (selErr) return internalErrorResponse(requestId, selErr);
  if (!auth) return notFoundResponse(requestId, "card_authorization", authId);

  const row = auth as CardAuthRow;
  if (row.status === "captured") {
    return jsonResponse(cardResponse(row), 200, requestId, { "Idempotent-Replayed": "true" });
  }
  if (row.status !== "authorized" && row.status !== "partially_captured") {
    return apiError(409, "invalid_state", requestId, {
      title: "Invalid State",
      detail: `card_authorization ${authId} is ${row.status}; only an open hold can be captured`,
    });
  }
  if (!row.blnk_inflight_id) {
    return apiError(409, "not_held", requestId, {
      title: "Not Held",
      detail: "authorization has no inflight Blnk transaction to capture",
    });
  }

  const alreadyCaptured = row.blnk_committed_amount ?? 0;
  const remaining = row.amount - alreadyCaptured;

  const body = await parseJsonBody(req).catch(() => null);
  const raw = body && typeof body === "object"
    ? (body as Record<string, unknown>).amount_cents
    : undefined;
  // default: capture the whole remaining hold
  const increment = raw === undefined ? remaining : raw;

  if (typeof increment !== "number" || !Number.isInteger(increment) || increment <= 0) {
    return validationError(requestId, [{
      type: "invalid_value",
      field: "amount_cents",
      message: "must be a positive integer number of cents",
    }]);
  }
  if (increment > remaining) {
    return apiError(422, "capture_exceeds_authorization", requestId, {
      title: "Capture Exceeds Authorization",
      detail:
        `cannot capture ${increment} cents; only ${remaining} of the ` +
        `${row.amount} authorization remains held`,
    });
  }

  let blnkTxn;
  try {
    blnkTxn = await commitInflight(cfg, row.blnk_inflight_id, { amountCents: increment });
  } catch (err) {
    if (err instanceof BlnkError) return bankErrorResponse(requestId);
    return internalErrorResponse(requestId, err);
  }

  const captured = alreadyCaptured + increment;
  const mirror = transactionMirror(blnkTxn);
  const { data: updated, error: updErr } = await db.schema("core").from("card_authorization")
    .update({
      status: captured >= row.amount ? "captured" : "partially_captured",
      blnk_committed_amount: captured,
      blnk_status: mirror.blnk_status,
      synced_at: mirror.synced_at,
    })
    .eq("id", authId)
    .select(CARD_COLS)
    .single();
  if (updErr) return internalErrorResponse(requestId, updErr);

  // Each capture is its own money movement, so each gets its own evidence
  // pair. The id embeds the post-capture RUNNING TOTAL: a resume retry of the
  // same capture converges on the same rows (same total), while a further
  // incremental capture (new total) gets fresh ones. The entry books the
  // DELTA — summing a card's entries must equal what actually moved.
  try {
    await recordMovementArtifacts(db, {
      bkeId: `bke_${authId}_captured_c${captured}`,
      evtId: `evt_${authId}_captured_c${captured}`,
      code: "card_authorization.captured",
      resourceType: "card_authorization",
      resourceId: authId,
      amountCents: increment,
      accountId: (row.originator as { account_id?: string } | null)?.account_id ?? null,
      payload: {
        captured_cents: increment,
        captured_total_cents: captured,
        remaining_cents: row.amount - captured,
        merchant: row.merchant,
        blnk_transaction_id: mirror.blnk_transaction_id,
      },
    });
  } catch (artErr) {
    console.error(`card movement artifacts failed for ${authId}: ${artErr}`);
  }

  return jsonResponse(cardResponse(updated as CardAuthRow), 200, requestId);
}

/**
 * POST /payments/card/{id}/reverse
 *
 * Voids the remaining hold. Allowed from partially_captured too — releasing the
 * uncaptured remainder is the normal end state for an under-captured auth; what
 * was already captured stays captured.
 */
export async function postCardReverse(
  req: Request,
  authId: string,
  db: SupabaseClient,
  cfg: BlnkConfig,
  requestId: string,
): Promise<Response> {
  const { data: auth, error: selErr } = await db.schema("core").from("card_authorization")
    .select(CARD_COLS)
    .eq("id", authId)
    .maybeSingle();
  if (selErr) return internalErrorResponse(requestId, selErr);
  if (!auth) return notFoundResponse(requestId, "card_authorization", authId);

  const row = auth as CardAuthRow;
  if (row.status === "reversed" || row.status === "expired") {
    return jsonResponse(cardResponse(row), 200, requestId, { "Idempotent-Replayed": "true" });
  }
  if (row.status !== "authorized" && row.status !== "partially_captured") {
    return apiError(409, "invalid_state", requestId, {
      title: "Invalid State",
      detail: `card_authorization ${authId} is ${row.status}; only an open hold can be reversed`,
    });
  }
  if (!row.blnk_inflight_id) {
    return apiError(409, "not_held", requestId, {
      title: "Not Held",
      detail: "authorization has no inflight Blnk transaction to reverse",
    });
  }

  const body = await parseJsonBody(req).catch(() => null);
  const rawReason = body && typeof body === "object"
    ? (body as Record<string, unknown>).reason
    : undefined;

  try {
    await voidInflight(cfg, row.blnk_inflight_id);
  } catch (err) {
    if (err instanceof BlnkError) return bankErrorResponse(requestId);
    return internalErrorResponse(requestId, err);
  }

  const { data: updated, error: updErr } = await db.schema("core").from("card_authorization")
    .update({
      status: "reversed",
      decline_reason: isNonEmptyString(rawReason) ? rawReason : row.decline_reason,
      synced_at: new Date().toISOString(),
    })
    .eq("id", authId)
    .select(CARD_COLS)
    .single();
  if (updErr) return internalErrorResponse(requestId, updErr);

  return jsonResponse(cardResponse(updated as CardAuthRow), 200, requestId);
}
