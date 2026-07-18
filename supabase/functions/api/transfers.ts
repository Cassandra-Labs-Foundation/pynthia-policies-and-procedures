import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  type BlnkConfig,
  BlnkError,
  blnkReference,
  getBalance,
  recordTransaction,
} from "../_shared/blnk.ts";
import { type AccountRow } from "./accounts.ts";
import {
  apiError,
  bankErrorResponse,
  claimIdempotency,
  dollarsFromCents,
  internalErrorResponse,
  isNonEmptyString,
  jsonResponse,
  notFoundResponse,
  parseJsonBody,
  sha256Hex,
  storeIdempotencyResponse,
  transferRequestHash,
  validationError,
  type ValidationErrorItem,
} from "./lib.ts";

export interface TransferRow {
  id: string;
  amount: number;
  status: string;
  originator: { account_id: string };
  beneficiary: { account_id: string };
  counterparty: unknown;
  blnk_transaction_id: string | null;
  blnk_reference: string | null;
  blnk_status: string | null;
  synced_at: string | null;
  created_at: string;
}

export interface ControlResultRef {
  control_id: string;
  decision: string;
}

type GateBlocked = { blocked: true; status: number; body: Record<string, unknown> };
type GatePassed = { blocked: false; controlResults: ControlResultRef[] };

export type GateOutcome = GateBlocked | GatePassed;

/**
 * Identifies the money-movement row being gated, so the same controls can run
 * over any rail (book transfer, wire, …) instead of only `core.transfer`.
 * `table` is where a blocking control writes the rejected status; `label` is
 * the human phrasing used in the BSA alert narrative.
 */
export interface GateResource {
  table: string;
  type: string;
  id: string;
  label: string;
}

export const TRANSFER_RESOURCE = (id: string): GateResource => ({
  table: "transfer",
  type: "transfer",
  id,
  label: "book transfer",
});

export async function runGate(
  db: SupabaseClient,
  cfg: BlnkConfig,
  resource: GateResource,
  sourceAccount: AccountRow,
  _destAccount: AccountRow | null,
  amountCents: number,
): Promise<GateOutcome> {
  const controlResults: ControlResultRef[] = [];
  const sourceAccountId = sourceAccount.id;
  const transferId = resource.id;

  // LIMITATION: daily velocity is summed over core.transfer only, so volume on
  // other rails (wires) does not count toward the $25k cap and a customer could
  // split across rails to evade it. Cross-rail aggregation is the follow-up.
  const todayStart = `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`;
  const { data: velocityRows, error: velErr } = await db.schema("core").from("transfer")
    .select("amount")
    .contains("originator", { account_id: sourceAccountId })
    .in("status", ["pending_approval", "submitted", "settled"])
    .neq("id", transferId)
    .gte("created_at", todayStart);

  if (velErr) throw new Error(`velocity query: ${velErr.message}`);

  const priorSum = (velocityRows ?? []).reduce(
    (sum, row) => sum + (row as { amount: number }).amount,
    0,
  );
  if (priorSum + amountCents > 2_500_000) {
    const crId = `cr_${crypto.randomUUID()}`;
    const { error: crErr } = await db.schema("core").from("control_result").insert({
      id: crId,
      control_id: "CG-VEL-01",
      decision: "block",
      event: transferId,
      subject_ref: sourceAccountId,
      score: null,
    });
    if (crErr) throw new Error(`control_result insert (CG-VEL-01): ${crErr.message}`);
    controlResults.push({ control_id: "CG-VEL-01", decision: "block" });

    const { error: rejErr } = await db.schema("core").from(resource.table)
      .update({ status: "rejected" })
      .eq("id", transferId);
    if (rejErr) throw new Error(`${resource.table} reject update (velocity): ${rejErr.message}`);

    return {
      blocked: true,
      status: 422,
      body: {
        status: 422,
        type: "velocity_limit_exceeded",
        title: "Velocity Limit Exceeded",
        detail: "Daily outbound transfer volume exceeds $25,000",
        doc_url: "https://api.cassandra.bank/docs/errors/velocity-limit-exceeded",
        resource_id: transferId,
        resource_type: resource.type,
      },
    };
  }

  if (amountCents > 1_000_000) {
    const crId = `cr_${crypto.randomUUID()}`;
    const alertId = `alert_${crypto.randomUUID()}`;
    const entityHash = await sha256Hex(sourceAccountId);

    const { error: crErr } = await db.schema("core").from("control_result").insert({
      id: crId,
      control_id: "CG-CTR-01",
      decision: "pass",
      event: transferId,
      subject_ref: sourceAccountId,
    });
    if (crErr) throw new Error(`control_result insert (CG-CTR-01): ${crErr.message}`);
    controlResults.push({ control_id: "CG-CTR-01", decision: "pass" });

    // event_id has fk_bsa_alert_event_id -> core.event(id), and no core.event row is ever
    // created for a transfer, so event_id must stay null here (the transfer id is carried
    // in details instead) or every insert violates the FK and is silently dropped.
    const { error: bsaErr } = await db.schema("core").from("bsa_alert").insert({
      id: alertId,
      alert_type: "ctr_threshold",
      status: "open",
      requires_lookback: "true",
      entity_hash: entityHash,
      event_id: null,
      details: `${resource.label} over $10,000 (${resource.type}_id=${transferId}, amount_cents=${amountCents})`,
    });
    if (bsaErr) throw new Error(`bsa_alert insert: ${bsaErr.message}`);
  }

  const blnkBal = await getBalance(cfg, sourceAccount.blnk_balance_id!);
  const available = typeof blnkBal.balance === "number" ? blnkBal.balance : 0;

  if (available < amountCents) {
    const crId = `cr_${crypto.randomUUID()}`;
    const { error: crErr } = await db.schema("core").from("control_result").insert({
      id: crId,
      control_id: "CG-NSF-01",
      decision: "reject",
      event: transferId,
      subject_ref: sourceAccountId,
    });
    if (crErr) throw new Error(`control_result insert (CG-NSF-01): ${crErr.message}`);
    controlResults.push({ control_id: "CG-NSF-01", decision: "reject" });

    const { error: rejErr } = await db.schema("core").from(resource.table)
      .update({ status: "rejected" })
      .eq("id", transferId);
    if (rejErr) throw new Error(`${resource.table} reject update (NSF): ${rejErr.message}`);

    const detail =
      `Insufficient funds: available $${dollarsFromCents(available)}, ` +
      `requested $${dollarsFromCents(amountCents)}`;

    return {
      blocked: true,
      status: 422,
      body: {
        status: 422,
        type: "insufficient_funds",
        title: "Insufficient Funds",
        detail,
        doc_url: "https://api.cassandra.bank/docs/errors/insufficient-funds",
        resource_id: transferId,
        resource_type: resource.type,
      },
    };
  }

  return { blocked: false, controlResults };
}

async function loadControlResults(
  db: SupabaseClient,
  transferId: string,
): Promise<ControlResultRef[]> {
  const { data, error } = await db.schema("core").from("control_result")
    .select("control_id, decision")
    .eq("event", transferId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`control_result fetch: ${error.message}`);
  return (data ?? []) as ControlResultRef[];
}

async function validateAccount(
  db: SupabaseClient,
  accountId: string,
): Promise<{ ok: true; account: AccountRow } | { ok: false; body: Record<string, unknown> }> {
  const { data, error } = await db.schema("core").from("account")
    .select("id, account_type, balance, blnk_ledger_id, blnk_balance_id, balance_synced_at, lock_type, status, created_at")
    .eq("id", accountId)
    .maybeSingle();

  if (error) throw new Error(`account fetch: ${error.message}`);

  if (!data) {
    return {
      ok: false,
      body: {
        status: 422,
        type: "account_not_found",
        title: "Account Not Found",
        detail: "Account not found",
        doc_url: "https://api.cassandra.bank/docs/errors/account-not-found",
        resource_id: accountId,
        resource_type: "account",
      },
    };
  }

  const account = data as AccountRow;

  if (account.status !== "open") {
    return {
      ok: false,
      body: {
        status: 422,
        type: "account_not_open",
        title: "Account Not Open",
        detail: "Account is not open",
        doc_url: "https://api.cassandra.bank/docs/errors/account-not-open",
        resource_id: accountId,
        resource_type: "account",
      },
    };
  }

  if (account.lock_type !== "none") {
    return {
      ok: false,
      body: {
        status: 422,
        type: "account_locked",
        title: "Account Locked",
        detail: "Account is locked",
        doc_url: "https://api.cassandra.bank/docs/errors/account-locked",
        resource_id: accountId,
        resource_type: "account",
      },
    };
  }

  if (!account.blnk_balance_id) {
    return {
      ok: false,
      body: {
        status: 422,
        type: "account_not_provisioned",
        title: "Account Not Provisioned",
        detail: "Account has no Blnk balance",
        doc_url: "https://api.cassandra.bank/docs/errors/account-not-provisioned",
        resource_id: accountId,
        resource_type: "account",
      },
    };
  }

  return { ok: true, account };
}

async function refreshAccountBalance(
  db: SupabaseClient,
  cfg: BlnkConfig,
  account: AccountRow,
): Promise<void> {
  const blnkBal = await getBalance(cfg, account.blnk_balance_id!);
  if (typeof blnkBal.balance !== "number") {
    throw new Error("balance response missing numeric balance");
  }
  const syncedAt = new Date().toISOString();
  const { error } = await db.schema("core").from("account")
    .update({ balance: blnkBal.balance, balance_synced_at: syncedAt })
    .eq("id", account.id);
  if (error) throw new Error(`account balance update: ${error.message}`);
}

function errorResponse(
  status: number,
  requestId: string,
  body: Record<string, unknown>,
): Response {
  return jsonResponse({ ...body, request_id: requestId }, status, requestId);
}

export async function postTransfer(
  req: Request,
  db: SupabaseClient,
  cfg: BlnkConfig,
  requestId: string,
): Promise<Response> {
  const idempotencyKey = req.headers.get("Idempotency-Key");
  if (!idempotencyKey) {
    return validationError(requestId, [{
      type: "missing_field",
      field: "Idempotency-Key",
      message: "required header",
    }]);
  }

  const raw = await parseJsonBody(req);
  const body = (raw && typeof raw === "object") ? raw as Record<string, unknown> : {};
  const errors: ValidationErrorItem[] = [];

  const sourceAccountId = body.source_account_id;
  const destAccountId = body.destination_account_id;
  const amountCents = body.amount_cents;
  const description = body.description;

  if (!isNonEmptyString(sourceAccountId)) {
    errors.push({ type: "missing_field", field: "source_account_id", message: "required" });
  }
  if (!isNonEmptyString(destAccountId)) {
    errors.push({ type: "missing_field", field: "destination_account_id", message: "required" });
  }
  if (!Number.isSafeInteger(amountCents) || (amountCents as number) <= 0) {
    errors.push({
      type: "invalid_value",
      field: "amount_cents",
      message: "must be a positive integer",
    });
  }
  if (
    isNonEmptyString(sourceAccountId) &&
    isNonEmptyString(destAccountId) &&
    sourceAccountId === destAccountId
  ) {
    errors.push({
      type: "invalid_value",
      field: "destination_account_id",
      message: "must differ from source_account_id",
    });
  }

  if (errors.length) return validationError(requestId, errors);

  const amount = amountCents as number;
  const sourceId = sourceAccountId as string;
  const destId = destAccountId as string;
  const desc = typeof description === "string" ? description : null;

  const requestHash = await transferRequestHash({
    source_account_id: sourceId,
    destination_account_id: destId,
    amount_cents: amount,
    description: desc,
  });

  const freshTransferId = `tr_${crypto.randomUUID()}`;
  const claim = await claimIdempotency(db, idempotencyKey, requestHash, freshTransferId, "POST /transfers");

  if (claim.kind === "replay") {
    return jsonResponse(
      claim.responseBody,
      claim.responseStatus,
      requestId,
      { "Idempotent-Replayed": "true" },
    );
  }

  if (claim.kind === "conflict") {
    return apiError(409, "idempotency_key_reused", requestId, {
      title: "Idempotency Key Reused",
      detail: "Idempotency-Key was used with a different request body",
    });
  }

  const transferId = claim.kind === "resume" ? claim.transferId : freshTransferId;

  const sourceCheck = await validateAccount(db, sourceId);
  if (!sourceCheck.ok) {
    const stored = { ...sourceCheck.body, request_id: requestId };
    await storeIdempotencyResponse(db, idempotencyKey, 422, stored);
    return errorResponse(422, requestId, sourceCheck.body);
  }

  const destCheck = await validateAccount(db, destId);
  if (!destCheck.ok) {
    const stored = { ...destCheck.body, request_id: requestId };
    await storeIdempotencyResponse(db, idempotencyKey, 422, stored);
    return errorResponse(422, requestId, destCheck.body);
  }

  const sourceAccount = sourceCheck.account;
  const destAccount = destCheck.account;

  const { data: existingTransfer, error: xferFetchErr } = await db.schema("core").from("transfer")
    .select("id, amount, status, originator, beneficiary, counterparty, blnk_transaction_id, blnk_reference, blnk_status, synced_at, created_at")
    .eq("id", transferId)
    .maybeSingle();
  if (xferFetchErr) throw new Error(`transfer fetch: ${xferFetchErr.message}`);

  let transferRow = existingTransfer as TransferRow | null;
  let createdAt = transferRow?.created_at ?? new Date().toISOString();

  if (!transferRow) {
    const { error: insErr } = await db.schema("core").from("transfer").insert({
      id: transferId,
      amount,
      status: "pending_approval",
      originator: { account_id: sourceId },
      beneficiary: { account_id: destId },
      counterparty: null,
      created_at: createdAt,
    });
    if (insErr) throw new Error(`transfer insert: ${insErr.message}`);
    transferRow = {
      id: transferId,
      amount,
      status: "pending_approval",
      originator: { account_id: sourceId },
      beneficiary: { account_id: destId },
      counterparty: null,
      blnk_transaction_id: null,
      blnk_reference: null,
      blnk_status: null,
      synced_at: null,
      created_at: createdAt,
    };
  } else {
    createdAt = transferRow.created_at;
  }

  const controlResults: ControlResultRef[] = [];

  if (transferRow.status === "settled") {
    controlResults.push(...await loadControlResults(db, transferId));
  } else {
    const gate = await runGate(db, cfg, TRANSFER_RESOURCE(transferId), sourceAccount, destAccount, amount);
    if (gate.blocked) {
      const stored = { ...gate.body, request_id: requestId };
      await storeIdempotencyResponse(db, idempotencyKey, gate.status, stored);
      return errorResponse(gate.status, requestId, gate.body);
    }
    controlResults.push(...gate.controlResults);

    try {
      const result = await recordTransaction(cfg, {
        coreResource: { table: "transfer", id: transferId },
        amountCents: amount,
        currency: "USD",
        source: sourceAccount.blnk_balance_id!,
        destination: destAccount.blnk_balance_id!,
        description: desc ?? `book transfer ${transferId}`,
      });

      const mirror = result.mirror;

      // Best-effort breadcrumb: persist the mirror immediately so blnk_reference /
      // blnk_transaction_id survive even if the settle-status update below fails with a
      // non-Blnk error after the Blnk write has already committed.
      const { error: breadcrumbErr } = await db.schema("core").from("transfer").update({
        blnk_transaction_id: mirror.blnk_transaction_id,
        blnk_reference: mirror.blnk_reference,
        blnk_status: mirror.blnk_status,
        synced_at: mirror.synced_at,
      }).eq("id", transferId);
      if (breadcrumbErr) {
        console.error(`transfer breadcrumb update failed for ${transferId}: ${breadcrumbErr.message}`);
      }

      const { error: updErr } = await db.schema("core").from("transfer").update({
        status: "settled",
        blnk_transaction_id: mirror.blnk_transaction_id,
        blnk_reference: mirror.blnk_reference,
        blnk_status: mirror.blnk_status,
        synced_at: mirror.synced_at,
      }).eq("id", transferId);
      if (updErr) throw new Error(`transfer settle update: ${updErr.message}`);

      transferRow = {
        ...transferRow,
        status: "settled",
        blnk_transaction_id: mirror.blnk_transaction_id,
        blnk_reference: mirror.blnk_reference,
        blnk_status: mirror.blnk_status,
        synced_at: mirror.synced_at,
      };
    } catch (e) {
      if (e instanceof BlnkError) {
        const ref = blnkReference({ table: "transfer", id: transferId });
        const syncedAt = new Date().toISOString();
        await db.schema("core").from("transfer").update({
          blnk_reference: ref,
          synced_at: syncedAt,
        }).eq("id", transferId);
        return bankErrorResponse(requestId);
      }
      throw e;
    }
  }

  const warnings: string[] = [];
  try {
    await refreshAccountBalance(db, cfg, sourceAccount);
  } catch {
    warnings.push("failed to refresh source account balance");
  }
  try {
    await refreshAccountBalance(db, cfg, destAccount);
  } catch {
    warnings.push("failed to refresh destination account balance");
  }

  const successBody: Record<string, unknown> = {
    id: transferId,
    status: "settled",
    amount_cents: amount,
    source_account_id: sourceId,
    destination_account_id: destId,
    blnk_transaction_id: transferRow.blnk_transaction_id,
    control_results: controlResults,
    created_at: createdAt,
  };
  if (warnings.length) successBody.meta = { warnings };

  await storeIdempotencyResponse(db, idempotencyKey, 201, successBody);
  return jsonResponse(successBody, 201, requestId);
}

export async function getTransfer(
  transferId: string,
  db: SupabaseClient,
  requestId: string,
): Promise<Response> {
  const { data, error } = await db.schema("core").from("transfer")
    .select("id, status, amount, originator, beneficiary, blnk_transaction_id, blnk_status, created_at")
    .eq("id", transferId)
    .maybeSingle();

  if (error) return internalErrorResponse(requestId, error);
  if (!data) return notFoundResponse(requestId, "transfer", transferId);

  const row = data as TransferRow;
  return jsonResponse({
    id: row.id,
    status: row.status,
    amount_cents: row.amount,
    originator: row.originator,
    beneficiary: row.beneficiary,
    blnk_transaction_id: row.blnk_transaction_id,
    blnk_status: row.blnk_status,
    created_at: row.created_at,
  }, 200, requestId);
}
