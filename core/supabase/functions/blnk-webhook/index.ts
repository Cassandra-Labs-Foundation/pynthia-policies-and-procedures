// blnk-webhook — Supabase Edge Function (Deno)
//
// Ingests Blnk Cloud webhooks using the inbox pattern:
//   1. verify HMAC-SHA256 signature (X-Blnk-Signature / X-Blnk-Timestamp)
//   2. idempotently record the delivery in core.blnk_event
//   3. best-effort apply it to the mapped core row (status/balance mirror)
//   4. always 200 once safely stored — failures are marked for a reconciler,
//      never re-driven by webhook retry storms.
//
// The event handlers live in handlers.ts, shared with blnk-reconcile's inbox
// re-dispatch. This file is transport only: verify, store, hand off.
//
// Config: this function must run with verify_jwt = false (Blnk signs its own
// requests; there is no Supabase JWT). See config.toml + README.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-injected),
//      BLNK_WEBHOOK_SECRET (= Blnk server.secret_key).
//      BLNK_API_URL / BLNK_API_KEY (optional) enable the balance-mirror refresh.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { BlnkWebhook } from "./types.ts";
import { coreRef, dispatch, eventKey } from "./handlers.ts";

const REPLAY_WINDOW_SECONDS = 300; // ±5 min, per Blnk guidance

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
    // CORE_SERVICE_ROLE_KEY first, same escape hatch as api/lib.ts createDb().
    // The injected SUPABASE_SERVICE_ROLE_KEY cannot be overwritten, so when it
    // is itself broken — a JWT whose `iat` runs ahead of the database clock,
    // which PostgREST rejects as "JWT issued at future" — every write here
    // fails and there is otherwise no way to substitute a working credential.
    // That failure is unusually expensive on this path: the inbox insert 500s,
    // and Blnk never retries a non-2xx, so the delivery is gone for good.
    (Deno.env.get("CORE_SERVICE_ROLE_KEY") ||
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"))!, // bypasses RLS
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
