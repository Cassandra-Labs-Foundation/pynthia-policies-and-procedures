import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  type BlnkConfig,
  BlnkError,
  createCustomerBalance,
  getBalance,
  recordTransaction,
} from "../_shared/blnk.ts";
import {
  accountRequestHash,
  apiError,
  bankErrorResponse,
  claimIdempotency,
  internalErrorResponse,
  isNonEmptyString,
  jsonResponse,
  notFoundResponse,
  parseJsonBody,
  storeIdempotencyResponse,
  validationError,
  type ValidationErrorItem,
} from "./lib.ts";

export interface AccountRow {
  id: string;
  account_type: string;
  balance: number;
  blnk_ledger_id: string | null;
  blnk_balance_id: string | null;
  balance_synced_at: string | null;
  lock_type: string;
  status: string;
  created_at: string;
}

export async function postAccount(
  req: Request,
  db: SupabaseClient,
  cfg: BlnkConfig,
  requestId: string,
): Promise<Response> {
  const raw = await parseJsonBody(req);
  const body = (raw && typeof raw === "object") ? raw as Record<string, unknown> : {};

  const accountType = isNonEmptyString(body.account_type) ? body.account_type : "checking";
  const openingDeposit = body.opening_deposit_cents;

  const errors: ValidationErrorItem[] = [];
  if (openingDeposit !== undefined) {
    if (!Number.isSafeInteger(openingDeposit) || (openingDeposit as number) <= 0) {
      errors.push({
        type: "invalid_value",
        field: "opening_deposit_cents",
        message: "must be a positive integer",
      });
    }
  }

  const idempotencyKey = req.headers.get("Idempotency-Key");
  if (openingDeposit !== undefined && !idempotencyKey) {
    errors.push({
      type: "missing_field",
      field: "Idempotency-Key",
      message: "required header when opening_deposit_cents is present",
    });
  }
  if (errors.length) return validationError(requestId, errors);

  const freshId = `acct_${crypto.randomUUID()}`;
  let accountId = freshId;
  let idemKeyToStore: string | null = null;

  if (idempotencyKey) {
    idemKeyToStore = idempotencyKey;
    const requestHash = await accountRequestHash({
      account_type: accountType,
      opening_deposit_cents: typeof openingDeposit === "number" ? openingDeposit : null,
    });
    const claim = await claimIdempotency(db, idempotencyKey, requestHash, freshId, "POST /accounts");

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
    accountId = claim.kind === "resume" ? claim.transferId : freshId;
  }

  const createdAt = new Date().toISOString();

  const { data: existing, error: fetchErr } = await db.schema("core").from("account")
    .select("id, account_type, balance, blnk_ledger_id, blnk_balance_id, balance_synced_at, lock_type, status, created_at")
    .eq("id", accountId)
    .maybeSingle();
  if (fetchErr) throw new Error(`account fetch: ${fetchErr.message}`);

  let account = existing as AccountRow | null;

  if (!account) {
    const { error: insErr } = await db.schema("core").from("account").insert({
      id: accountId,
      account_type: accountType,
      status: "open",
      lock_type: "none",
      balance: 0,
      created_at: createdAt,
    });
    if (insErr) throw new Error(`account insert: ${insErr.message}`);
    account = {
      id: accountId,
      account_type: accountType,
      balance: 0,
      blnk_ledger_id: null,
      blnk_balance_id: null,
      balance_synced_at: null,
      lock_type: "none",
      status: "open",
      created_at: createdAt,
    };
  }

  try {
    let blnkBalanceId = account.blnk_balance_id;

    if (!blnkBalanceId) {
      const { mirror } = await createCustomerBalance(cfg, {
        coreResource: { table: "account", id: accountId },
        currency: "USD",
      });
      blnkBalanceId = mirror.blnk_balance_id;

      const balancePatch: Record<string, unknown> = {
        blnk_balance_id: mirror.blnk_balance_id,
        balance_synced_at: mirror.balance_synced_at,
      };
      if (mirror.blnk_ledger_id) balancePatch.blnk_ledger_id = mirror.blnk_ledger_id;

      const { error: updErr } = await db.schema("core").from("account")
        .update(balancePatch)
        .eq("id", accountId);
      if (updErr) throw new Error(`account balance-id update: ${updErr.message}`);
    }

    let balance = account.balance;

    if (typeof openingDeposit === "number" && openingDeposit > 0) {
      await recordTransaction(cfg, {
        coreResource: { table: "account", id: accountId },
        leg: "open",
        amountCents: openingDeposit,
        currency: "USD",
        source: "@OpeningFunding",
        destination: blnkBalanceId,
        description: "opening deposit",
        allowOverdraft: true,
      });

      const blnkBal = await getBalance(cfg, blnkBalanceId);
      if (typeof blnkBal.balance !== "number") {
        throw new BlnkError("balance response missing numeric balance", 502, blnkBal);
      }
      balance = blnkBal.balance;
      const syncedAt = new Date().toISOString();
      const { error: balErr } = await db.schema("core").from("account")
        .update({ balance, balance_synced_at: syncedAt })
        .eq("id", accountId);
      if (balErr) throw new Error(`account balance update: ${balErr.message}`);
    }

    const successBody = {
      id: accountId,
      account_type: account.account_type,
      status: "open",
      balance,
      blnk_balance_id: blnkBalanceId,
      created_at: account.created_at,
    };

    if (idemKeyToStore) {
      await storeIdempotencyResponse(db, idemKeyToStore, 201, successBody);
    }

    return jsonResponse(successBody, 201, requestId);
  } catch (e) {
    if (e instanceof BlnkError) return bankErrorResponse(requestId);
    throw e;
  }
}

export async function getAccount(
  accountId: string,
  db: SupabaseClient,
  requestId: string,
): Promise<Response> {
  const { data, error } = await db.schema("core").from("account")
    .select("id, account_type, status, balance, balance_synced_at, blnk_balance_id, created_at")
    .eq("id", accountId)
    .maybeSingle();

  if (error) return internalErrorResponse(requestId, error);
  if (!data) return notFoundResponse(requestId, "account", accountId);

  return jsonResponse(data, 200, requestId);
}
