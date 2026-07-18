import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { type AccountRow } from "./accounts.ts";
import { type GateResource, runGate } from "./transfers.ts";
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

// Outbound ACH debits leave the customer balance for the ACH network. Blnk
// auto-creates `@`-prefixed external balances on first reference.
const ACH_NETWORK_BALANCE = "@ACHNetwork";
const CURRENCY = "USD";

// Standard NACHA-ish settlement windows; free text in the schema, constrained
// here so the writer cannot invent values the ops side does not expect.
const WINDOWS = ["same_day", "next_day", "two_day"] as const;

const ACH_RESOURCE = (id: string): GateResource => ({
  table: "ach_transfer",
  type: "ach_transfer",
  id,
  label: "outbound ACH",
  rejectedStatus: "rejected",
});

export interface AchRow {
  id: string;
  amount: number;
  status: string;
  counterparty: unknown;
  window: string | null;
  blnk_transaction_id: string | null;
  blnk_reference: string | null;
  blnk_status: string | null;
  created_at: string;
}

function achResponse(
  row: AchRow,
  controlResults?: { control_id: string; decision: string }[],
): Record<string, unknown> {
  return {
    id: row.id,
    status: row.status,
    amount_cents: row.amount,
    counterparty: row.counterparty,
    window: row.window,
    blnk_transaction_id: row.blnk_transaction_id,
    control_results: controlResults ?? [],
    created_at: row.created_at,
  };
}

/**
 * POST /payments/ach
 *
 * Submits an outbound ACH debit. Like wires this is two-phase on Blnk inflight:
 * submission places a HOLD, and the funds only actually move when the batch
 * settles. That matters for ACH specifically because a submitted entry can
 * still be returned (R01 insufficient funds, R02 account closed, …) days later
 * — holding rather than moving keeps the ledger honest until settlement.
 */
export async function postAch(
  req: Request,
  db: SupabaseClient,
  cfg: BlnkConfig,
  requestId: string,
): Promise<Response> {
  const idempotencyKey = req.headers.get("Idempotency-Key");
  if (!idempotencyKey) {
    return apiError(400, "idempotency_key_required", requestId, {
      title: "Idempotency Key Required",
      detail: "POST /payments/ach requires an Idempotency-Key header",
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
  const counterparty = b.counterparty;
  const window = b.window;

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
  if (counterparty === null || typeof counterparty !== "object" || Array.isArray(counterparty)) {
    errors.push({ type: "invalid_value", field: "counterparty", message: "must be an object" });
  }
  if (window !== undefined && !WINDOWS.includes(window as typeof WINDOWS[number])) {
    errors.push({
      type: "invalid_value",
      field: "window",
      message: `must be one of: ${WINDOWS.join(", ")}`,
    });
  }
  if (errors.length) return validationError(requestId, errors);

  const amount = amountCents as number;
  const sourceId = sourceAccountId as string;
  const windowText = typeof window === "string" ? window : "next_day";

  const requestHash = await sha256Hex(
    JSON.stringify({
      source_account_id: sourceId,
      amount_cents: amount,
      counterparty,
      window: windowText,
    }),
  );

  const freshAchId = crypto.randomUUID();
  const claim = await claimIdempotency(
    db,
    idempotencyKey,
    requestHash,
    freshAchId,
    "POST /payments/ach",
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

  // A resumed claim reuses the interrupted attempt's id so the Blnk `reference`
  // stays stable and the same entry cannot be double-held.
  const achId = claim.kind === "resume" ? claim.transferId : freshAchId;

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

  const { error: insErr } = await db.schema("core").from("ach_transfer").upsert({
    id: achId,
    amount,
    // records whose money is leaving: needed for audit and for the per-account
    // daily aggregates (CG-VEL-01 velocity, CG-STR-01 structuring).
    originator: { account_id: sourceId },
    counterparty,
    window: windowText,
    status: "pending_approval",
  });
  if (insErr) return internalErrorResponse(requestId, insErr);

  // Gate before the hold: an ACH debit is a money-movement rail like any other,
  // so CTR / NSF / velocity all apply. A rail that skips them would let a large
  // ACH settle with no BSA alert.
  let gate;
  try {
    gate = await runGate(db, cfg, ACH_RESOURCE(achId), account as AccountRow, null, amount);
  } catch (err) {
    return internalErrorResponse(requestId, err);
  }
  if (gate.blocked) {
    await storeIdempotencyResponse(db, idempotencyKey, gate.status, gate.body);
    return jsonResponse(gate.body, gate.status, requestId);
  }

  let mirror;
  try {
    const result = await recordTransaction(cfg, {
      coreResource: { table: "ach_transfer", id: achId },
      amountCents: amount,
      currency: CURRENCY,
      source: account.blnk_balance_id,
      destination: ACH_NETWORK_BALANCE,
      description: `outbound ACH (${windowText})`,
      inflight: true,
    });
    mirror = result.mirror;
  } catch (err) {
    // Row stays pending_approval with no Blnk id; the reconciler's non-terminal
    // sweep surfaces it. 502 is not stored, so the same key can be retried.
    if (err instanceof BlnkError) return bankErrorResponse(requestId);
    return internalErrorResponse(requestId, err);
  }

  const cols =
    "id, amount, status, counterparty, window, blnk_transaction_id, blnk_reference, blnk_status, created_at";
  const { data: updated, error: updErr } = await db.schema("core").from("ach_transfer")
    .update({
      status: "submitted",
      blnk_transaction_id: mirror.blnk_transaction_id,
      blnk_reference: mirror.blnk_reference,
      blnk_status: mirror.blnk_status,
      synced_at: mirror.synced_at,
    })
    .eq("id", achId)
    .select(cols)
    .single();
  if (updErr) return internalErrorResponse(requestId, updErr);

  const responseBody = achResponse(updated as AchRow, gate.controlResults);
  await storeIdempotencyResponse(db, idempotencyKey, 201, responseBody);
  return jsonResponse(responseBody, 201, requestId);
}

/** POST /payments/ach/{id}/settle — commit the hold; the batch cleared. */
export async function postAchSettle(
  req: Request,
  achId: string,
  db: SupabaseClient,
  cfg: BlnkConfig,
  requestId: string,
): Promise<Response> {
  return await resolveAch(req, achId, db, cfg, requestId, "settle");
}

/**
 * POST /payments/ach/{id}/return — void the hold; the RDFI returned the entry.
 * Distinct from settle because the money never moves, and the return reason
 * (R01, R02, …) is retained for the ops/compliance record.
 */
export async function postAchReturn(
  req: Request,
  achId: string,
  db: SupabaseClient,
  cfg: BlnkConfig,
  requestId: string,
): Promise<Response> {
  return await resolveAch(req, achId, db, cfg, requestId, "return");
}

async function resolveAch(
  req: Request,
  achId: string,
  db: SupabaseClient,
  cfg: BlnkConfig,
  requestId: string,
  action: "settle" | "return",
): Promise<Response> {
  const cols =
    "id, amount, status, counterparty, window, blnk_transaction_id, blnk_reference, blnk_status, created_at";
  const { data: ach, error: selErr } = await db.schema("core").from("ach_transfer")
    .select(cols)
    .eq("id", achId)
    .maybeSingle();
  if (selErr) return internalErrorResponse(requestId, selErr);
  if (!ach) return notFoundResponse(requestId, "ach_transfer", achId);

  const terminal = action === "settle" ? "settled" : "returned";

  // Re-resolving an already-resolved entry replays rather than erroring, so
  // duplicate settlement notifications from the network stay safe.
  if (ach.status === terminal) {
    return jsonResponse(achResponse(ach as AchRow), 200, requestId, {
      "Idempotent-Replayed": "true",
    });
  }
  if (ach.status !== "submitted") {
    return apiError(409, "invalid_state", requestId, {
      title: "Invalid State",
      detail: `ach_transfer ${achId} is ${ach.status}; only 'submitted' can be ${action}ed`,
    });
  }
  if (!ach.blnk_transaction_id) {
    return apiError(409, "not_held", requestId, {
      title: "Not Held",
      detail: "ACH entry has no inflight Blnk transaction to resolve",
    });
  }

  let returnReason: string | null = null;
  if (action === "return") {
    const body = await parseJsonBody(req).catch(() => null);
    const raw = body && typeof body === "object"
      ? (body as Record<string, unknown>).return_reason
      : undefined;
    if (raw !== undefined && !isNonEmptyString(raw)) {
      return validationError(requestId, [{
        type: "invalid_value",
        field: "return_reason",
        message: "must be a non-empty string (e.g. R01)",
      }]);
    }
    returnReason = isNonEmptyString(raw) ? raw : null;
  }

  let blnkTxn;
  try {
    blnkTxn = action === "settle"
      ? await commitInflight(cfg, ach.blnk_transaction_id)
      : await voidInflight(cfg, ach.blnk_transaction_id);
  } catch (err) {
    if (err instanceof BlnkError) return bankErrorResponse(requestId);
    return internalErrorResponse(requestId, err);
  }

  const mirror = transactionMirror(blnkTxn);
  const patch: Record<string, unknown> = {
    status: terminal,
    blnk_status: mirror.blnk_status,
    synced_at: mirror.synced_at,
  };
  // `window` doubles as the ops note field in this schema slice; keep the
  // return reason on the row so the compliance record survives.
  if (returnReason) patch.window = `${ach.window ?? ""} return:${returnReason}`.trim();

  const { data: updated, error: updErr } = await db.schema("core").from("ach_transfer")
    .update(patch)
    .eq("id", achId)
    .select(cols)
    .single();
  if (updErr) return internalErrorResponse(requestId, updErr);

  return jsonResponse(achResponse(updated as AchRow), 200, requestId);
}
