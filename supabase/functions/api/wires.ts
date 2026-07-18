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

// Outbound wires leave the customer balance for the Fed settlement rail. Blnk
// auto-creates `@`-prefixed external balances on first reference, so there is
// nothing to provision here (integration plan §3).
const FEDWIRE_BALANCE = "@FedWire";

// core.account carries no currency column; the demo slice is USD-only, matching
// accounts.ts / transfers.ts.
const CURRENCY = "USD";

const WIRE_RESOURCE = (id: string): GateResource => ({
  table: "wire_transfer",
  type: "wire_transfer",
  id,
  label: "outbound wire",
});

export interface WireRow {
  id: string;
  amount: number;
  status: string;
  beneficiary: unknown;
  purpose: string | null;
  imad: string | null;
  blnk_transaction_id: string | null;
  blnk_reference: string | null;
  blnk_status: string | null;
  created_at: string;
}

function wireResponse(
  row: WireRow,
  controlResults?: { control_id: string; decision: string }[],
): Record<string, unknown> {
  return {
    id: row.id,
    status: row.status,
    amount_cents: row.amount,
    beneficiary: row.beneficiary,
    purpose: row.purpose,
    imad: row.imad,
    blnk_transaction_id: row.blnk_transaction_id,
    control_results: controlResults ?? [],
    created_at: row.created_at,
  };
}

/**
 * POST /payments/wire/prepare
 *
 * Phase 1 of the two-phase wire. Creates the `core.wire_transfer` row and an
 * *inflight* Blnk transaction, which holds the funds in the customer's
 * `inflight_debit_balance` without moving them. Money only actually moves on
 * confirm — this is what satisfies the dual-control requirement (integration
 * plan §4): the funds cannot leave until a second call commits them.
 */
export async function postWirePrepare(
  req: Request,
  db: SupabaseClient,
  cfg: BlnkConfig,
  requestId: string,
): Promise<Response> {
  const idempotencyKey = req.headers.get("Idempotency-Key");
  if (!idempotencyKey) {
    return apiError(400, "idempotency_key_required", requestId, {
      title: "Idempotency Key Required",
      detail: "POST /payments/wire/prepare requires an Idempotency-Key header",
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
  const beneficiary = b.beneficiary;
  const purpose = b.purpose;

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
  if (beneficiary === null || typeof beneficiary !== "object" || Array.isArray(beneficiary)) {
    errors.push({ type: "invalid_value", field: "beneficiary", message: "must be an object" });
  }
  if (purpose !== undefined && typeof purpose !== "string") {
    errors.push({ type: "invalid_value", field: "purpose", message: "must be a string" });
  }
  if (errors.length) return validationError(requestId, errors);

  const amount = amountCents as number;
  const sourceId = sourceAccountId as string;
  const purposeText = typeof purpose === "string" ? purpose : null;

  const requestHash = await sha256Hex(
    JSON.stringify({
      source_account_id: sourceId,
      amount_cents: amount,
      beneficiary,
      purpose: purposeText,
    }),
  );

  const freshWireId = crypto.randomUUID();
  const claim = await claimIdempotency(
    db,
    idempotencyKey,
    requestHash,
    freshWireId,
    "POST /payments/wire/prepare",
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

  // A resumed claim reuses the id from the interrupted attempt so the Blnk
  // `reference` stays stable and we cannot double-hold the same funds.
  const wireId = claim.kind === "resume" ? claim.transferId : freshWireId;

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

  const { error: insErr } = await db.schema("core").from("wire_transfer").upsert({
    id: wireId,
    amount,
    // records whose money is leaving: needed for audit and for the per-account
    // daily velocity aggregate, which spans rails.
    originator: { account_id: sourceId },
    beneficiary,
    purpose: purposeText,
    status: "pending_approval",
  });
  if (insErr) return internalErrorResponse(requestId, insErr);

  // Compliance gate runs BEFORE any money is held. A wire is a money-movement
  // path like any other: CTR reporting, NSF and the velocity cap all apply, and
  // a rail that skips them would let a large wire settle with no BSA alert.
  // A wire has no destination account row (funds leave for @FedWire), hence null.
  let gate;
  try {
    gate = await runGate(db, cfg, WIRE_RESOURCE(wireId), account as AccountRow, null, amount);
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
      coreResource: { table: "wire_transfer", id: wireId },
      amountCents: amount,
      currency: CURRENCY,
      source: account.blnk_balance_id,
      destination: FEDWIRE_BALANCE,
      description: purposeText ?? "outbound wire",
      inflight: true,
    });
    mirror = result.mirror;
  } catch (err) {
    // Leave the row in pending_approval with no Blnk id; the reconciler's
    // non-terminal sweep will retry or surface it. 502 is not stored against
    // the idempotency claim, so the caller can safely retry the same key.
    if (err instanceof BlnkError) return bankErrorResponse(requestId);
    return internalErrorResponse(requestId, err);
  }

  const { data: updated, error: updErr } = await db.schema("core").from("wire_transfer")
    .update({
      status: "submitted",
      blnk_transaction_id: mirror.blnk_transaction_id,
      blnk_reference: mirror.blnk_reference,
      blnk_status: mirror.blnk_status,
      synced_at: mirror.synced_at,
    })
    .eq("id", wireId)
    .select("id, amount, status, beneficiary, purpose, imad, blnk_transaction_id, blnk_reference, blnk_status, created_at")
    .single();
  if (updErr) return internalErrorResponse(requestId, updErr);

  const responseBody = wireResponse(updated as WireRow, gate.controlResults);
  await storeIdempotencyResponse(db, idempotencyKey, 201, responseBody);
  return jsonResponse(responseBody, 201, requestId);
}

/**
 * POST /payments/wire/{id}/confirm — commit the inflight hold. Blnk permits a
 * partial commit (up to the held amount), so an optional `amount_cents` lets a
 * wire settle for less than it was prepared for.
 */
export async function postWireConfirm(
  req: Request,
  wireId: string,
  db: SupabaseClient,
  cfg: BlnkConfig,
  requestId: string,
): Promise<Response> {
  return await resolveInflight(req, wireId, db, cfg, requestId, "confirm");
}

/** POST /payments/wire/{id}/cancel — void the hold and release the funds. */
export async function postWireCancel(
  req: Request,
  wireId: string,
  db: SupabaseClient,
  cfg: BlnkConfig,
  requestId: string,
): Promise<Response> {
  return await resolveInflight(req, wireId, db, cfg, requestId, "cancel");
}

async function resolveInflight(
  req: Request,
  wireId: string,
  db: SupabaseClient,
  cfg: BlnkConfig,
  requestId: string,
  action: "confirm" | "cancel",
): Promise<Response> {
  const { data: wire, error: selErr } = await db.schema("core").from("wire_transfer")
    .select("id, amount, status, beneficiary, purpose, imad, blnk_transaction_id, blnk_reference, blnk_status, created_at")
    .eq("id", wireId)
    .maybeSingle();
  if (selErr) return internalErrorResponse(requestId, selErr);
  if (!wire) return notFoundResponse(requestId, "wire_transfer", wireId);

  // Only a submitted (held) wire can be resolved. Re-confirming a completed
  // wire is a no-op replay rather than an error, so retries stay safe.
  if (wire.status === (action === "confirm" ? "completed" : "canceled")) {
    return jsonResponse(wireResponse(wire as WireRow), 200, requestId, {
      "Idempotent-Replayed": "true",
    });
  }
  if (wire.status !== "submitted") {
    return apiError(409, "invalid_state", requestId, {
      title: "Invalid State",
      detail: `wire_transfer ${wireId} is ${wire.status}; only 'submitted' can be ${action}ed`,
    });
  }
  if (!wire.blnk_transaction_id) {
    return apiError(409, "not_held", requestId, {
      title: "Not Held",
      detail: "wire has no inflight Blnk transaction to resolve",
    });
  }

  let partialCents: number | undefined;
  if (action === "confirm") {
    const body = await parseJsonBody(req).catch(() => null);
    const raw = body && typeof body === "object"
      ? (body as Record<string, unknown>).amount_cents
      : undefined;
    if (raw !== undefined) {
      if (typeof raw !== "number" || !Number.isInteger(raw) || raw <= 0 || raw > wire.amount) {
        return validationError(requestId, [{
          type: "invalid_value",
          field: "amount_cents",
          message: `must be a positive integer no greater than the held amount (${wire.amount})`,
        }]);
      }
      partialCents = raw;
    }
  }

  let blnkTxn;
  try {
    blnkTxn = action === "confirm"
      ? await commitInflight(cfg, wire.blnk_transaction_id, { amountCents: partialCents })
      : await voidInflight(cfg, wire.blnk_transaction_id);
  } catch (err) {
    if (err instanceof BlnkError) return bankErrorResponse(requestId);
    return internalErrorResponse(requestId, err);
  }

  const mirror = transactionMirror(blnkTxn);
  const { data: updated, error: updErr } = await db.schema("core").from("wire_transfer")
    .update({
      status: action === "confirm" ? "completed" : "canceled",
      blnk_status: mirror.blnk_status,
      synced_at: mirror.synced_at,
    })
    .eq("id", wireId)
    .select("id, amount, status, beneficiary, purpose, imad, blnk_transaction_id, blnk_reference, blnk_status, created_at")
    .single();
  if (updErr) return internalErrorResponse(requestId, updErr);

  return jsonResponse(wireResponse(updated as WireRow), 200, requestId);
}
