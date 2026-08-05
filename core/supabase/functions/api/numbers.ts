// Account numbers (cards 26-29).
//
// Format (card 26): 12 digits = 3-digit prefix + 8-digit body + 1 Luhn check
// digit. Prefix 000 is reserved for CU-direct numbers; partner mints use 100.
// Uniqueness spans EVERY status (card 28): the unique index has no status
// filter, so a canceled number can never be reissued — the mint loop treats a
// collision as "roll again", not an error.
import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  apiError,
  internalErrorResponse,
  isNonEmptyString,
  jsonResponse,
  notFoundResponse,
  parseJsonBody,
  sha256Hex,
  validationError,
} from "./lib.ts";
import { scopeToPartner } from "./ownership.ts";
import { type PartnerContext } from "./auth.ts";

// Demo ABA with a VALID checksum (3(d1+d4+d7)+7(d2+d5+d8)+(d3+d6+d9) ≡ 0 mod 10)
// but an obviously fake prefix — never a real institution's number.
export const ROUTING_NUMBER = "123456780";

const CU_DIRECT_PREFIX = "000";
const PARTNER_PREFIX = "100";

export function luhnCheckDigit(digits: string): number {
  let sum = 0;
  // rightmost digit of `digits` is position 1 (the check digit goes to its right)
  for (let i = digits.length - 1, pos = 1; i >= 0; i--, pos++) {
    let d = Number(digits[i]);
    if (pos % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return (10 - (sum % 10)) % 10;
}

/** 3-digit prefix + 8 random digits + Luhn check digit. */
export function mintAccountNumber(cuDirect: boolean): string {
  const prefix = cuDirect ? CU_DIRECT_PREFIX : PARTNER_PREFIX;
  const body = String(Math.floor(Math.random() * 100_000_000)).padStart(8, "0");
  const partial = prefix + body;
  return partial + String(luhnCheckDigit(partial));
}

const NUMBER_COLS = "id, account_id, routing_number, account_number, status, created_at";

// Card 29 (number half): active <-> disabled; canceled is forever.
const TRANSITIONS: Record<string, string[]> = {
  active: ["disabled", "canceled"],
  disabled: ["active", "canceled"],
  canceled: [],
};

function numberResponse(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id,
    account_id: row.account_id,
    routing_number: row.routing_number,
    account_number: row.account_number,
    status: row.status,
    created_at: row.created_at,
  };
}

/** POST /accounts/{id}/numbers {cu_direct?} — mint a number (cards 26/27). */
export async function postAccountNumber(
  req: Request,
  accountId: string,
  db: SupabaseClient,
  requestId: string,
  ctx: PartnerContext,
): Promise<Response> {
  const raw = await parseJsonBody(req).catch(() => null);
  const cuDirect = !!(raw && typeof raw === "object" && (raw as Record<string, unknown>).cu_direct === true);

  const { data: acct, error: selErr } = await scopeToPartner(
    db.schema("core").from("account").select("id, status").eq("id", accountId),
    ctx,
  ).maybeSingle();
  if (selErr) return internalErrorResponse(requestId, selErr);
  if (!acct) return notFoundResponse(requestId, "account", accountId);

  // Collisions include CANCELED rows by design — roll a fresh number and try
  // again rather than ever bringing a retired pair back to life.
  for (let attempt = 0; attempt < 5; attempt++) {
    const number = mintAccountNumber(cuDirect);
    const row = {
      id: `can_${crypto.randomUUID()}`,
      account_id: accountId,
      routing_number: ROUTING_NUMBER,
      account_number: number,
      status: "active",
    };
    const { error } = await db.schema("core").from("account_number").insert(row);
    if (!error) {
      return jsonResponse(
        numberResponse({ ...row, created_at: new Date().toISOString() }),
        201,
        requestId,
      );
    }
    if (error.code !== "23505") return internalErrorResponse(requestId, error);
  }
  return apiError(503, "mint_exhausted", requestId, {
    title: "Mint Exhausted",
    detail: "could not mint a unique account number after 5 attempts",
  });
}

/** GET /accounts/{id}/numbers — card 27. */
export async function getAccountNumbers(
  accountId: string,
  db: SupabaseClient,
  requestId: string,
  ctx: PartnerContext,
): Promise<Response> {
  // account_number carries no partner_id: it reaches its owner through
  // fk_account_number_account_id, the one link in this schema where a join is
  // both correct and indexed (idx_account_number_account_id). Confirming the
  // PARENT is owned is what confines the list — a 404 rather than an empty
  // page, so a foreign account id is indistinguishable from a missing one.
  const { data: parent, error: parentErr } = await scopeToPartner(
    db.schema("core").from("account").select("id").eq("id", accountId),
    ctx,
  ).maybeSingle();
  if (parentErr) return internalErrorResponse(requestId, parentErr);
  if (!parent) return notFoundResponse(requestId, "account", accountId);

  const { data, error } = await db.schema("core").from("account_number")
    .select(NUMBER_COLS).eq("account_id", accountId)
    .order("created_at", { ascending: false }).limit(200);
  if (error) return internalErrorResponse(requestId, error);
  return jsonResponse({ data: ((data ?? []) as Record<string, unknown>[]).map(numberResponse) }, 200, requestId);
}

/** POST /account-numbers/{id}/transition {to} — card 29 (number half). */
export async function postNumberTransition(
  req: Request,
  numberId: string,
  db: SupabaseClient,
  requestId: string,
  ctx: PartnerContext,
): Promise<Response> {
  const raw = await parseJsonBody(req).catch(() => null);
  const to = raw && typeof raw === "object" ? (raw as Record<string, unknown>).to : undefined;
  if (!isNonEmptyString(to) || !(to in TRANSITIONS)) {
    return validationError(requestId, [{
      type: "invalid_value",
      field: "to",
      message: `must be one of: ${Object.keys(TRANSITIONS).join(", ")}`,
    }]);
  }

  const { data: num, error: selErr } = await db.schema("core").from("account_number")
    .select(NUMBER_COLS).eq("id", numberId).maybeSingle();
  if (selErr) return internalErrorResponse(requestId, selErr);
  if (!num) return notFoundResponse(requestId, "account_number", numberId);

  // Derived ownership again: resolve the parent account under the partner
  // predicate. Reported as a missing NUMBER, not a missing account — the
  // caller asked about a number, and naming the account would confirm one
  // exists behind an id they cannot see.
  const { data: owner, error: ownerErr } = await scopeToPartner(
    db.schema("core").from("account").select("id")
      .eq("id", String((num as Record<string, unknown>).account_id)),
    ctx,
  ).maybeSingle();
  if (ownerErr) return internalErrorResponse(requestId, ownerErr);
  if (!owner) return notFoundResponse(requestId, "account_number", numberId);

  const from = String((num as Record<string, unknown>).status);
  if (!(TRANSITIONS[from] ?? []).includes(to)) {
    return apiError(409, "invalid_state", requestId, {
      title: "Invalid State",
      detail: `account_number ${numberId} is ${from}; legal transitions: ${(TRANSITIONS[from] ?? []).join(", ") || "(none — canceled is forever)"}`,
    });
  }

  const { data: updated, error: updErr } = await db.schema("core").from("account_number")
    .update({ status: to }).eq("id", numberId).select(NUMBER_COLS).single();
  if (updErr) return internalErrorResponse(requestId, updErr);

  // `active` is an adjective state; the event uses the registry's verb form.
  const numberStateEvent: Record<string, string> = { active: "account_number.activated" };
  const eventCode = numberStateEvent[to] ?? `account_number.${to}`;
  const { error: evtErr } = await db.schema("core").from("event").insert({
    id: `evt_${crypto.randomUUID()}`,
    code: eventCode,
    type: "account_number",
    resource_id: numberId,
    entity_hash: await sha256Hex(String((num as Record<string, unknown>).account_id)),
    payload: { from, to },
    created_at: new Date().toISOString(),
  });
  if (evtErr) console.error(`event emit failed (${eventCode}): ${evtErr.message}`);

  return jsonResponse(numberResponse(updated as Record<string, unknown>), 200, requestId);
}
