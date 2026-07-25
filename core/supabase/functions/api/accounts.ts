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
  pageEnvelope,
  paginate,
  parseJsonBody,
  parsePageParams,
  sha256Hex,
  storeIdempotencyResponse,
  validationError,
  type ValidationErrorItem,
} from "./lib.ts";
import { scopeToPartner } from "./ownership.ts";
import { setRetentionClocks } from "./retention.ts";
import { type PartnerContext } from "./auth.ts";

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
  ctx: PartnerContext,
): Promise<Response> {
  const raw = await parseJsonBody(req);
  const body = (raw && typeof raw === "object") ? raw as Record<string, unknown> : {};

  const accountType = isNonEmptyString(body.account_type) ? body.account_type : "checking";
  const openingDeposit = body.opening_deposit_cents;
  // Owning member. Optional at the API boundary because existing callers do not
  // send it, but see 20260719001300: cash (BSA-08) aggregates per PERSON, so an
  // account with no entity cannot participate in CTR aggregation at all.
  const entityId = body.entity_id;

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
  if (entityId !== undefined && !isNonEmptyString(entityId)) {
    errors.push({
      type: "invalid_value",
      field: "entity_id",
      message: "must be a non-empty string naming the owning entity",
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
    const claim = await claimIdempotency(db, ctx.idempotencyScope, idempotencyKey, requestHash, freshId, "POST /accounts");

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

  const { data: existing, error: fetchErr } = await scopeToPartner(
    db.schema("core").from("account")
      .select("id, account_type, balance, blnk_ledger_id, blnk_balance_id, balance_synced_at, lock_type, status, created_at")
      .eq("id", accountId),
    ctx,
  ).maybeSingle();
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
      partner_id: ctx.ownerPartnerId,
      entity_id: isNonEmptyString(entityId) ? entityId : null,
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
      await storeIdempotencyResponse(db, ctx.idempotencyScope, idemKeyToStore, 201, successBody);
    }

    return jsonResponse(successBody, 201, requestId);
  } catch (e) {
    if (e instanceof BlnkError) return bankErrorResponse(requestId);
    throw e;
  }
}

const ACCOUNT_COLS =
  "id, account_type, status, balance, balance_synced_at, blnk_balance_id, entity_id, created_at";

// The account lifecycle (card 29). Repeated here as a filter allowlist rather
// than imported from ACCOUNT_TRANSITIONS below, because that map's KEYS are
// the states a transition may start FROM — reusing it would silently drop any
// terminal state from the filter the day one is added.
const ACCOUNT_STATUSES = ["open", "frozen", "closed"];

/**
 * GET /accounts — one partner's accounts, newest first.
 *
 * `?entity_id=` is the member -> accounts walk. It is a filter on top of the
 * partner predicate, never instead of it: core.account carries no derivable
 * ownership (see 20260719000800_partner_ownership.sql), so an entity_id that
 * belongs to another partner must narrow this page to nothing rather than
 * reach across.
 */
export async function getAccounts(
  req: Request,
  db: SupabaseClient,
  requestId: string,
  ctx: PartnerContext,
): Promise<Response> {
  const q = new URL(req.url).searchParams;
  const { limit, after, errors } = parsePageParams(q);

  const status = q.get("status");
  if (status !== null && !ACCOUNT_STATUSES.includes(status)) {
    errors.push({
      type: "invalid_value",
      field: "status",
      message: `must be one of: ${ACCOUNT_STATUSES.join(", ")}`,
    });
  }
  const entityId = q.get("entity_id");
  if (entityId !== null && entityId.length === 0) {
    errors.push({ type: "invalid_value", field: "entity_id", message: "must not be empty" });
  }
  if (errors.length) return validationError(requestId, errors);

  let query = scopeToPartner(
    db.schema("core").from("account").select(ACCOUNT_COLS),
    ctx,
  )
    .order("created_at", { ascending: false })
    .limit(limit + 1);
  if (status) query = query.eq("status", status);
  if (entityId) query = query.eq("entity_id", entityId);
  if (after) query = query.lt("created_at", after);

  const { data, error } = await query;
  if (error) return internalErrorResponse(requestId, error);

  const { page, has_more, next_after } = paginate(
    (data ?? []) as Record<string, unknown>[],
    limit,
  );
  return jsonResponse(pageEnvelope(page, { limit, has_more, next_after }), 200, requestId);
}

export async function getAccount(
  accountId: string,
  db: SupabaseClient,
  requestId: string,
  ctx: PartnerContext,
): Promise<Response> {
  const { data, error } = await scopeToPartner(
    db.schema("core").from("account")
      .select("id, account_type, status, balance, balance_synced_at, blnk_balance_id, created_at")
      .eq("id", accountId),
    ctx,
  ).maybeSingle();

  if (error) return internalErrorResponse(requestId, error);
  if (!data) return notFoundResponse(requestId, "account", accountId);

  return jsonResponse(data, 200, requestId);
}

// ------------------------------------------------- locks + transitions (24/29)

// Card 24: a lock constrains USE without touching the lifecycle — a frozen
// account is a state change, a locked one is a restriction overlaid on
// whatever state it is in. That distinction is why lock never writes status.
const LOCK_TYPES = ["none", "compliance", "fraud", "legal", "admin"];

// Card 29 (account half): open <-> frozen, both -> closed, closed forever.
const ACCOUNT_TRANSITIONS: Record<string, string[]> = {
  open: ["frozen", "closed"],
  frozen: ["open", "closed"],
  closed: [],
};

async function emitAccountEvent(
  db: SupabaseClient,
  code: string,
  accountId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const { error } = await db.schema("core").from("event").insert({
    id: `evt_${crypto.randomUUID()}`,
    code,
    type: "account",
    resource_id: accountId,
    entity_hash: await sha256Hex(accountId),
    payload,
    created_at: new Date().toISOString(),
  });
  if (error) console.error(`event emit failed (${code} ${accountId}): ${error.message}`);
}

/** POST /accounts/{id}/lock {lock_type, reason?} — card 24. `none` unlocks. */
export async function postAccountLock(
  req: Request,
  accountId: string,
  db: SupabaseClient,
  requestId: string,
  ctx: PartnerContext,
): Promise<Response> {
  const raw = await parseJsonBody(req).catch(() => null);
  const body = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const lockType = body.lock_type;
  if (!isNonEmptyString(lockType) || !LOCK_TYPES.includes(lockType)) {
    return validationError(requestId, [{
      type: "invalid_value",
      field: "lock_type",
      message: `must be one of: ${LOCK_TYPES.join(", ")}`,
    }]);
  }

  const { data: acct, error: selErr } = await scopeToPartner(
    db.schema("core").from("account").select("id, status, lock_type").eq("id", accountId),
    ctx,
  ).maybeSingle();
  if (selErr) return internalErrorResponse(requestId, selErr);
  if (!acct) return notFoundResponse(requestId, "account", accountId);

  const { error: updErr } = await db.schema("core").from("account")
    .update({ lock_type: lockType }).eq("id", accountId);
  if (updErr) return internalErrorResponse(requestId, updErr);

  // logged, with the state it deliberately did NOT touch in the payload
  await emitAccountEvent(db, lockType === "none" ? "account.unlocked" : "account.locked", accountId, {
    lock_type: lockType,
    previous_lock: (acct as Record<string, unknown>).lock_type ?? "none",
    status_untouched: (acct as Record<string, unknown>).status,
    reason: isNonEmptyString(body.reason) ? body.reason : null,
  });

  return jsonResponse({
    id: accountId,
    status: (acct as Record<string, unknown>).status,
    lock_type: lockType,
  }, 200, requestId);
}

/** POST /accounts/{id}/transition {to} — card 29 (account half). */
export async function postAccountTransition(
  req: Request,
  accountId: string,
  db: SupabaseClient,
  requestId: string,
  ctx: PartnerContext,
): Promise<Response> {
  const raw = await parseJsonBody(req).catch(() => null);
  const to = raw && typeof raw === "object" ? (raw as Record<string, unknown>).to : undefined;
  if (!isNonEmptyString(to) || !(to in ACCOUNT_TRANSITIONS)) {
    return validationError(requestId, [{
      type: "invalid_value",
      field: "to",
      message: `must be one of: ${Object.keys(ACCOUNT_TRANSITIONS).join(", ")}`,
    }]);
  }

  const { data: acct, error: selErr } = await scopeToPartner(
    db.schema("core").from("account").select("id, status, lock_type").eq("id", accountId),
    ctx,
  ).maybeSingle();
  if (selErr) return internalErrorResponse(requestId, selErr);
  if (!acct) return notFoundResponse(requestId, "account", accountId);

  const from = String((acct as Record<string, unknown>).status);
  if (!(ACCOUNT_TRANSITIONS[from] ?? []).includes(to)) {
    return apiError(409, "invalid_state", requestId, {
      title: "Invalid State",
      detail: `account ${accountId} is ${from}; legal transitions: ${(ACCOUNT_TRANSITIONS[from] ?? []).join(", ") || "(none — closed is forever)"}`,
    });
  }

  const { error: updErr } = await db.schema("core").from("account")
    .update({ status: to }).eq("id", accountId);
  if (updErr) return internalErrorResponse(requestId, updErr);

  await emitAccountEvent(db, `account.${to}`, accountId, { from, to });

  // BSA-21: closing an account starts the retention clock on its
  // closure-anchored records (CIP identity, beneficial owners). Best-effort —
  // the closure itself is already committed, and a failed clock is recoverable
  // by re-running the sweep, whereas failing the closure is not.
  if (to === "closed") {
    try {
      await setRetentionClocks(db, accountId, new Date());
    } catch (retErr) {
      console.error(`retention clocks failed for ${accountId}: ${retErr}`);
    }
  }
  return jsonResponse({ id: accountId, status: to }, 200, requestId);
}
