// blnk-webhook — Supabase Edge Function (Deno)
//
// Ingests Blnk Cloud webhooks using the inbox pattern:
//   1. verify HMAC-SHA256 signature (X-Blnk-Signature / X-Blnk-Timestamp)
//   2. idempotently record the delivery in core.blnk_event
//   3. best-effort apply it to the mapped core row (status/balance mirror)
//   4. always 200 once safely stored — failures are marked for a reconciler,
//      never re-driven by webhook retry storms.
//
// Config: this function must run with verify_jwt = false (Blnk signs its own
// requests; there is no Supabase JWT). See config.toml + README.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-injected),
//      BLNK_WEBHOOK_SECRET (= Blnk server.secret_key).

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { BlnkWebhook, BlnkTransactionData, BlnkIdentityData, BlnkBalanceData } from "./types.ts";

const REPLAY_WINDOW_SECONDS = 300; // ±5 min, per Blnk guidance
const MONEY_TABLES = new Set([
  "ach_transfer", "wire_transfer", "transfer", "inbound_payment", "card_authorization",
]);

const enc = new TextEncoder();

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// ---- signature verification -------------------------------------------------
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verify(req: Request, rawBody: string, secret: string): Promise<string | null> {
  const signature = req.headers.get("X-Blnk-Signature");
  const timestamp = req.headers.get("X-Blnk-Timestamp");
  if (!signature || !timestamp) return "missing signature/timestamp headers";

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return "invalid timestamp";
  const skew = Math.abs(Date.now() / 1000 - ts);
  if (skew > REPLAY_WINDOW_SECONDS) return `timestamp outside replay window (${Math.round(skew)}s)`;

  const expected = await hmacHex(secret, `${timestamp}.${rawBody}`);
  if (!timingSafeEqual(enc.encode(expected), enc.encode(signature))) return "signature mismatch";
  return null; // ok
}

// ---- idempotency key --------------------------------------------------------
// No stable delivery id in the payload, so derive one that dedups retries of the
// SAME logical event: event + the object it concerns.
function eventKey(event: string, data: Record<string, unknown>): string {
  const anchor =
    (data.transaction_id as string) ??
    (data.balance_id as string) ??
    (data.identity_id as string) ??
    (data.reconciliation_id as string) ??
    (data.reference as string) ??
    "novel";
  return `${event}:${anchor}`;
}

// ---- routing helpers --------------------------------------------------------
function coreRef(data: { meta_data?: { core_resource?: { table: string; id: string } } | null }) {
  const r = data?.meta_data?.core_resource;
  return r && typeof r.table === "string" && typeof r.id === "string" ? r : null;
}

const ID_COLUMN: Record<string, string> = {
  ach_transfer: "blnk_transaction_id",
  wire_transfer: "blnk_transaction_id",
  transfer: "blnk_transaction_id",
  inbound_payment: "blnk_transaction_id",
  card_authorization: "blnk_inflight_id", // card auth = inflight hold
};

async function applyTransaction(db: SupabaseClient, d: BlnkTransactionData): Promise<void> {
  const ref = coreRef(d);
  let table = ref?.table;
  let match: Record<string, string> = ref ? { id: ref.id } : {};

  // Fallback: locate by blnk_reference across money tables (needs Phase-2 writers
  // to have stamped blnk_reference = our resource id on the row).
  if (!table && d.reference) {
    for (const t of MONEY_TABLES) {
      const { data: rows } = await db.schema("core").from(t)
        .select("id").eq("blnk_reference", d.reference).limit(1);
      if (rows && rows.length) { table = t; match = { blnk_reference: d.reference }; break; }
    }
  }
  if (!table || !MONEY_TABLES.has(table)) {
    throw new Error(`no core row for transaction ${d.transaction_id ?? d.reference ?? "?"}`);
  }

  const patch: Record<string, unknown> = {
    blnk_status: d.status,
    synced_at: new Date().toISOString(),
    [ID_COLUMN[table]]: d.transaction_id,
    ...(d.reference ? { blnk_reference: d.reference } : {}),
  };
  // card capture: track cumulative committed amount on APPLIED
  if (table === "card_authorization" && d.status === "APPLIED" && typeof d.precise_amount === "number") {
    patch.blnk_committed_amount = d.precise_amount;
  }
  const { error } = await db.schema("core").from(table).update(patch).match(match);
  if (error) throw new Error(`update ${table}: ${error.message}`);

  // TODO(phase-5): on APPLIED, refresh account.balance mirror for d.source/d.destination
  //   via Blnk GET /balances/{id}; raise control_result/bsa_alert on flagged moves.
}

async function applyIdentity(db: SupabaseClient, d: BlnkIdentityData): Promise<void> {
  const ref = coreRef(d);
  if (!ref || ref.table !== "entity") return; // nothing to mirror
  const { error } = await db.schema("core").from("entity")
    .update({ blnk_identity_id: d.identity_id }).eq("id", ref.id);
  if (error) throw new Error(`update entity: ${error.message}`);
}

async function applyBalance(db: SupabaseClient, d: BlnkBalanceData): Promise<void> {
  const ref = coreRef(d);
  if (!ref || ref.table !== "account") return;
  const patch: Record<string, unknown> = { blnk_balance_id: d.balance_id };
  if (typeof d.balance === "number") { patch.balance = d.balance; patch.balance_synced_at = new Date().toISOString(); }
  const { error } = await db.schema("core").from("account").update(patch).eq("id", ref.id);
  if (error) throw new Error(`update account: ${error.message}`);
}

// event -> handler. Unlisted events are stored and marked 'skipped'.
async function dispatch(db: SupabaseClient, wh: BlnkWebhook): Promise<"processed" | "skipped"> {
  switch (wh.event) {
    case "transaction.applied":
    case "transaction.inflight":
    case "transaction.void":
    case "transaction.rejected":
    case "transaction.scheduled":
      await applyTransaction(db, wh.data as BlnkTransactionData);
      return "processed";
    case "identity.created":
      await applyIdentity(db, wh.data as BlnkIdentityData);
      return "processed";
    case "balance.created":
      await applyBalance(db, wh.data as BlnkBalanceData);
      return "processed";
    // TODO(phase-4/5): balance.monitor -> bsa_alert/control_result;
    //   reconciliation.* -> bookkeeping/recon; bulk_transaction.* -> iterate.
    default:
      return "skipped";
  }
}

// ---- HTTP entry -------------------------------------------------------------
Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const secret = Deno.env.get("BLNK_WEBHOOK_SECRET");
  if (!secret) return json({ error: "server misconfigured: BLNK_WEBHOOK_SECRET unset" }, 500);

  const rawBody = await req.text();
  const failure = await verify(req, rawBody, secret);
  if (failure) return json({ error: `unauthorized: ${failure}` }, 401);

  let wh: BlnkWebhook;
  try {
    wh = JSON.parse(rawBody) as BlnkWebhook;
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  if (!wh?.event || typeof wh.data !== "object" || wh.data === null) {
    return json({ error: "missing event/data" }, 400);
  }

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // bypasses RLS
    { auth: { persistSession: false } },
  );

  const id = eventKey(wh.event, wh.data as Record<string, unknown>);
  const ref = coreRef(wh.data as { meta_data?: { core_resource?: { table: string; id: string } } });

  // Idempotent inbox insert. Conflict = already delivered -> ack and stop.
  const { error: insErr } = await db.schema("core").from("blnk_event").insert({
    id,
    event: wh.event,
    blnk_id: (wh.data as Record<string, unknown>).transaction_id ??
             (wh.data as Record<string, unknown>).balance_id ??
             (wh.data as Record<string, unknown>).identity_id ?? null,
    resource_type: ref?.table ?? null,
    resource_id: ref?.id ?? null,
    payload: wh,
    status: "received",
  });
  if (insErr) {
    if (insErr.code === "23505") return json({ ok: true, duplicate: true }); // already ingested
    return json({ error: `inbox insert: ${insErr.message}` }, 500); // storage failed -> let Blnk retry
  }

  // Best-effort apply. Once stored we always 200; processing errors are recorded
  // on the inbox row for a reconciler, not surfaced as webhook failures.
  try {
    const outcome = await dispatch(db, wh);
    await db.schema("core").from("blnk_event")
      .update({ status: outcome, processed_at: new Date().toISOString() }).eq("id", id);
    return json({ ok: true, status: outcome });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await db.schema("core").from("blnk_event")
      .update({ status: "failed", error: msg, processed_at: new Date().toISOString() }).eq("id", id);
    return json({ ok: true, status: "failed" }); // stored; reconciler will retry
  }
});
