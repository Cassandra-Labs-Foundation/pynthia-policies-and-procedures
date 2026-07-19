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

// Outbound wires leave the customer balance for the Fed settlement rail. Blnk
// auto-creates `@`-prefixed external balances on first reference, so there is
// nothing to provision here (integration plan §3).
const FEDWIRE_BALANCE = "@FedWire";

// core.account carries no currency column; the demo slice is USD-only, matching
// accounts.ts / transfers.ts.
const CURRENCY = "USD";

// This core is domestic-only (Fedwire). An international beneficiary is refused
// at the edge rather than held and failed downstream: placing an inflight hold
// for a wire that can never be sent strands the customer's funds until someone
// notices. Detected by the markers an international instruction actually
// carries — a SWIFT/BIC routing code, or a non-US beneficiary country.
function internationalMarker(beneficiary: Record<string, unknown>): string | null {
  if (isNonEmptyString(beneficiary.swift_code)) return "beneficiary.swift_code";
  if (isNonEmptyString(beneficiary.bic)) return "beneficiary.bic";
  const country = beneficiary.country;
  if (isNonEmptyString(country) && country.trim().toUpperCase() !== "US") {
    return `beneficiary.country=${country}`;
  }
  return null;
}

const WIRE_RESOURCE = (id: string): GateResource => ({
  table: "wire_transfer",
  type: "wire_transfer",
  id,
  label: "outbound wire",
  rejectedStatus: "rejected",
});

export interface WireRow {
  id: string;
  amount: number;
  status: string;
  beneficiary: unknown;
  purpose: string | null;
  imad: string | null;
  originator?: { account_id?: string } | null;
  return_reason?: string | null;
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
    return_reason: row.return_reason ?? null,
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

  // Refuse before the idempotency claim: an unsendable wire should not consume
  // a key or create a row.
  const marker = internationalMarker(beneficiary as Record<string, unknown>);
  if (marker) {
    return apiError(422, "international_wire_not_supported", requestId, {
      title: "International Wire Not Supported",
      detail: `this core sends domestic (Fedwire) wires only; saw ${marker}`,
    });
  }

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
    .select("id, amount, status, beneficiary, purpose, imad, originator, blnk_transaction_id, blnk_reference, blnk_status, created_at")
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

  // A partial confirm is TERMINAL — the wire settles for less. Blnk keeps the
  // unconfirmed remainder held in inflight_debit_balance after a partial
  // commit, so without this void it is stranded forever: member money that is
  // neither spendable nor releasable. Found by the conservation sweep ($600
  // residue). Best-effort: the commit is final either way, and the sweep's
  // inflight-residue check surfaces a failed release.
  if (action === "confirm" && partialCents !== undefined && partialCents < wire.amount) {
    try {
      await voidInflight(cfg, wire.blnk_transaction_id);
    } catch (voidErr) {
      console.error(`remainder release failed for wire ${wireId}: ${voidErr}`);
    }
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

  // Confirm COMMITS the hold — money moved; a cancel voids it — nothing did.
  // Best-effort: the commit is already final, so evidence failure must not 500.
  if (action === "confirm") {
    const movedCents = partialCents ?? (wire.amount as number);
    try {
      await recordMovementArtifacts(db, {
        bkeId: `bke_${wireId}_completed`,
        evtId: `evt_${wireId}_completed`,
        code: "wire_transfer.completed",
        resourceType: "wire_transfer",
        resourceId: wireId,
        amountCents: movedCents,
        accountId: (wire.originator as { account_id?: string } | null)?.account_id ?? null,
        payload: {
          amount_cents: movedCents,
          held_cents: wire.amount,
          blnk_transaction_id: wire.blnk_transaction_id,
        },
      });
    } catch (artErr) {
      console.error(`wire movement artifacts failed for ${wireId}: ${artErr}`);
    }
  }

  return jsonResponse(wireResponse(updated as WireRow), 200, requestId);
}


// ------------------------------------------------------------- wire returns
//
// Card 37: "a return request resolves to RETURNED or COMPLETED with reasons."
// Two-step, matching the schema's state machine (`return_requested` sits
// between `completed` and `returned`): a completed wire cannot simply be
// voided — the funds already left for @FedWire — so requesting a return holds
// the claim open, and only an ACCEPTED resolution posts a compensating
// reversal (@FedWire -> the originating member balance, leg ":return"). A
// REJECTED resolution restores `completed` and keeps the reason trail. Both
// paths stay append-only: settled history is never mutated.

const RETURN_COLS =
  "id, amount, status, beneficiary, purpose, imad, originator, return_reason, blnk_transaction_id, blnk_reference, blnk_status, created_at";

/** POST /payments/wire/{id}/return — request the return of a completed wire. */
export async function postWireReturn(
  req: Request,
  wireId: string,
  db: SupabaseClient,
  cfg: BlnkConfig,
  requestId: string,
): Promise<Response> {
  const body = await parseJsonBody(req).catch(() => null);
  const reason = body && typeof body === "object"
    ? (body as Record<string, unknown>).reason
    : undefined;
  if (!isNonEmptyString(reason)) {
    return validationError(requestId, [{
      type: "missing_field",
      field: "reason",
      message: "a return reason is required (e.g. beneficiary fraud claim)",
    }]);
  }

  const { data: wire, error: selErr } = await db.schema("core").from("wire_transfer")
    .select(RETURN_COLS)
    .eq("id", wireId)
    .maybeSingle();
  if (selErr) return internalErrorResponse(requestId, selErr);
  if (!wire) return notFoundResponse(requestId, "wire_transfer", wireId);

  if (wire.status === "return_requested") {
    return jsonResponse(wireResponse(wire as WireRow), 200, requestId, {
      "Idempotent-Replayed": "true",
    });
  }
  if (wire.status !== "completed") {
    return apiError(409, "invalid_state", requestId, {
      title: "Invalid State",
      detail:
        `wire_transfer ${wireId} is ${wire.status}; only a completed wire can be returned — a held wire should be canceled`,
    });
  }

  const { data: updated, error: updErr } = await db.schema("core").from("wire_transfer")
    .update({ status: "return_requested", return_reason: reason })
    .eq("id", wireId)
    .select(RETURN_COLS)
    .single();
  if (updErr) return internalErrorResponse(requestId, updErr);

  return jsonResponse(wireResponse(updated as WireRow), 200, requestId);
}

/**
 * POST /payments/wire/{id}/return/resolve — settle the pending return claim.
 * `{outcome: "accepted"}` reverses the funds and lands `returned`;
 * `{outcome: "rejected", reason?}` restores `completed`, appending why.
 */
export async function postWireReturnResolve(
  req: Request,
  wireId: string,
  db: SupabaseClient,
  cfg: BlnkConfig,
  requestId: string,
): Promise<Response> {
  const body = await parseJsonBody(req).catch(() => null);
  const rec = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const outcome = rec.outcome;
  if (outcome !== "accepted" && outcome !== "rejected") {
    return validationError(requestId, [{
      type: "invalid_value",
      field: "outcome",
      message: 'must be "accepted" or "rejected"',
    }]);
  }

  const { data: wire, error: selErr } = await db.schema("core").from("wire_transfer")
    .select(RETURN_COLS)
    .eq("id", wireId)
    .maybeSingle();
  if (selErr) return internalErrorResponse(requestId, selErr);
  if (!wire) return notFoundResponse(requestId, "wire_transfer", wireId);

  if (wire.status === "returned") {
    return jsonResponse(wireResponse(wire as WireRow), 200, requestId, {
      "Idempotent-Replayed": "true",
    });
  }
  if (wire.status !== "return_requested") {
    return apiError(409, "invalid_state", requestId, {
      title: "Invalid State",
      detail: `wire_transfer ${wireId} is ${wire.status}; only 'return_requested' can be resolved`,
    });
  }

  if (outcome === "rejected") {
    const why = isNonEmptyString(rec.reason) ? rec.reason : "unspecified";
    const trail = `${wire.return_reason ?? "return requested"} | rejected: ${why}`;
    const { data: updated, error: updErr } = await db.schema("core").from("wire_transfer")
      .update({ status: "completed", return_reason: trail })
      .eq("id", wireId)
      .select(RETURN_COLS)
      .single();
    if (updErr) return internalErrorResponse(requestId, updErr);
    return jsonResponse(wireResponse(updated as WireRow), 200, requestId);
  }

  // accepted: undo with a compensating entry, never by mutating the original
  const originatorAccountId = (wire.originator as { account_id?: string } | null)?.account_id;
  if (!originatorAccountId) {
    return apiError(409, "not_reversible", requestId, {
      title: "Not Reversible",
      detail: "completed wire has no originator account to credit back",
    });
  }
  const { data: acct, error: acctErr } = await db.schema("core").from("account")
    .select("id, blnk_balance_id")
    .eq("id", originatorAccountId)
    .maybeSingle();
  if (acctErr) return internalErrorResponse(requestId, acctErr);
  if (!acct?.blnk_balance_id) {
    return apiError(409, "not_reversible", requestId, {
      title: "Not Reversible",
      detail: "originating account has no Blnk balance to credit back",
    });
  }

  let mirror;
  try {
    const reversal = await recordTransaction(cfg, {
      coreResource: { table: "wire_transfer", id: wireId },
      // ":return" leg keeps the reference distinct from the original wire's,
      // so the reversal cannot be deduped away as a duplicate of it
      leg: "return",
      amountCents: wire.amount as number,
      currency: CURRENCY,
      source: FEDWIRE_BALANCE,
      destination: acct.blnk_balance_id as string,
      description: `wire return (${wire.return_reason ?? "unspecified"})`,
    });
    mirror = reversal.mirror;
  } catch (err) {
    if (err instanceof BlnkError) return bankErrorResponse(requestId);
    return internalErrorResponse(requestId, err);
  }

  const { data: updated, error: updErr } = await db.schema("core").from("wire_transfer")
    .update({ status: "returned", blnk_status: mirror.blnk_status, synced_at: mirror.synced_at })
    .eq("id", wireId)
    .select(RETURN_COLS)
    .single();
  if (updErr) return internalErrorResponse(requestId, updErr);

  // The reversal moved money back — it gets its own evidence pair.
  try {
    await recordMovementArtifacts(db, {
      bkeId: `bke_${wireId}_returned`,
      evtId: `evt_${wireId}_returned`,
      code: "wire_transfer.returned",
      resourceType: "wire_transfer",
      resourceId: wireId,
      amountCents: wire.amount as number,
      accountId: originatorAccountId,
      payload: {
        amount_cents: wire.amount,
        reason: wire.return_reason ?? null,
        blnk_transaction_id: mirror.blnk_transaction_id,
      },
    });
  } catch (artErr) {
    console.error(`wire return artifacts failed for ${wireId}: ${artErr}`);
  }

  return jsonResponse(wireResponse(updated as WireRow), 200, requestId);
}
