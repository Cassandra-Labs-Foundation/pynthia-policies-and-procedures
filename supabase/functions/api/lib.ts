import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const enc = new TextEncoder();

export function createDb(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

export function createRequestId(): string {
  return `req_${crypto.randomUUID()}`;
}

// Constant-time comparison via digest so key length/content can't be timed.
export async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const [da, db] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const x = new Uint8Array(da);
  const y = new Uint8Array(db);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function docUrl(type: string): string {
  return `https://api.cassandra.bank/docs/errors/${type.replace(/_/g, "-")}`;
}

export interface ApiErrorOptions {
  resourceId?: string;
  resourceType?: string;
  detail?: string;
  title?: string;
}

export function apiError(
  status: number,
  type: string,
  requestId: string,
  opts: ApiErrorOptions = {},
): Response {
  const body = {
    status,
    type,
    title: opts.title ?? type.replace(/_/g, " "),
    detail: opts.detail ?? type.replace(/_/g, " "),
    doc_url: docUrl(type),
    request_id: requestId,
    ...(opts.resourceId !== undefined ? { resource_id: opts.resourceId } : {}),
    ...(opts.resourceType !== undefined ? { resource_type: opts.resourceType } : {}),
  };
  return jsonResponse(body, status, requestId);
}

export interface ValidationErrorItem {
  type: string;
  field: string;
  message: string;
}

export function validationError(requestId: string, errors: ValidationErrorItem[]): Response {
  return jsonResponse({ status: 400, type: "validation_error", request_id: requestId, errors }, 400, requestId);
}

export function jsonResponse(
  body: unknown,
  status = 200,
  requestId: string,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "X-Request-Id": requestId,
      ...extraHeaders,
    },
  });
}

export function misconfiguredResponse(requestId: string, message: string): Response {
  return apiError(500, "misconfigured", requestId, {
    title: "Misconfigured",
    detail: message,
  });
}

export function unauthorizedResponse(requestId: string): Response {
  return apiError(401, "unauthorized", requestId, {
    title: "Unauthorized",
    detail: "Invalid or missing X-Api-Key",
  });
}

export function notFoundResponse(
  requestId: string,
  resourceType: string,
  resourceId: string,
): Response {
  return apiError(404, "not_found", requestId, {
    title: "Not Found",
    detail: `${resourceType} not found`,
    resourceType,
    resourceId,
  });
}

export function methodNotAllowedResponse(requestId: string): Response {
  return apiError(405, "method_not_allowed", requestId, {
    title: "Method Not Allowed",
    detail: "HTTP method not allowed for this route",
  });
}

export function bankErrorResponse(requestId: string): Response {
  return apiError(502, "bank_error", requestId, {
    title: "Bank Error",
    detail: "The banking service is temporarily unavailable",
  });
}

export function internalErrorResponse(requestId: string, err?: unknown): Response {
  if (err !== undefined) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${requestId}] internal error: ${msg}`);
  }
  return apiError(500, "internal_error", requestId, {
    title: "Internal Error",
    detail: "An unexpected error occurred",
  });
}

export async function parseJsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

export function dollarsFromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

// ---- idempotency (D6) -------------------------------------------------------

export interface TransferIdempotencyPayload {
  source_account_id: string;
  destination_account_id: string;
  amount_cents: number;
  description: string | null;
}

export async function transferRequestHash(payload: TransferIdempotencyPayload): Promise<string> {
  const canonical = JSON.stringify({
    source_account_id: payload.source_account_id,
    destination_account_id: payload.destination_account_id,
    amount_cents: payload.amount_cents,
    description: payload.description ?? null,
  });
  return await sha256Hex(canonical);
}

export interface AccountIdempotencyPayload {
  account_type: string;
  opening_deposit_cents: number | null;
}

export async function accountRequestHash(payload: AccountIdempotencyPayload): Promise<string> {
  const canonical = JSON.stringify({
    account_type: payload.account_type,
    opening_deposit_cents: payload.opening_deposit_cents ?? null,
  });
  return await sha256Hex(canonical);
}

export interface IdempotencyRow {
  idempotency_key: string;
  endpoint: string;
  request_hash: string;
  response_status: number | null;
  response_body: unknown;
  blnk_reference: string | null;
}

export type IdempotencyClaim =
  | { kind: "fresh"; transferId: string }
  | { kind: "replay"; responseStatus: number; responseBody: unknown }
  | { kind: "resume"; transferId: string }
  | { kind: "conflict" };

export async function claimIdempotency(
  db: SupabaseClient,
  idempotencyKey: string,
  requestHash: string,
  transferId: string,
  endpoint: string,
): Promise<IdempotencyClaim> {
  const { error: insErr } = await db.schema("core").from("idempotency_keys").insert({
    idempotency_key: idempotencyKey,
    endpoint,
    request_hash: requestHash,
    blnk_reference: transferId,
    response_status: null,
  });

  if (!insErr) return { kind: "fresh", transferId };

  if (insErr.code !== "23505") {
    throw new Error(`idempotency insert: ${insErr.message}`);
  }

  const { data, error: fetchErr } = await db.schema("core").from("idempotency_keys")
    .select("idempotency_key, endpoint, request_hash, response_status, response_body, blnk_reference")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (fetchErr) throw new Error(`idempotency fetch: ${fetchErr.message}`);
  if (!data) return { kind: "fresh", transferId };

  const row = data as IdempotencyRow;
  if (row.request_hash !== requestHash) return { kind: "conflict" };

  if (row.response_status !== null && row.response_status !== undefined) {
    return {
      kind: "replay",
      responseStatus: row.response_status,
      responseBody: row.response_body,
    };
  }

  const resumeId = row.blnk_reference ?? transferId;
  return { kind: "resume", transferId: resumeId };
}

export async function storeIdempotencyResponse(
  db: SupabaseClient,
  idempotencyKey: string,
  responseStatus: number,
  responseBody: unknown,
): Promise<void> {
  const { error } = await db.schema("core").from("idempotency_keys")
    .update({ response_status: responseStatus, response_body: responseBody })
    .eq("idempotency_key", idempotencyKey);
  if (error) throw new Error(`idempotency update: ${error.message}`);
}
