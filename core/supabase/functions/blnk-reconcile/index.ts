// blnk-reconcile — scheduled reconciler (pg_cron → pg_net every 5 min).
//
// Blnk is ledger source of truth; core.* holds cached mirrors. This function
// advances stale transaction-status mirrors, corrects balance drift, and
// re-drives the webhook inbox. It stays authoritative even with webhooks live,
// because Blnk never retries a failed delivery — a pushed event is an
// optimization, this pull is the guarantee.
// The sweeps live in sweeps.ts (importable for hermetic tests — card 18).
// Config: verify_jwt = false; auth = X-Reconcile-Key header.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { blnkConfigFromEnv } from "../_shared/blnk.ts";
import {
  errMsg,
  sweepBalances,
  sweepCardAuthorization,
  sweepInbox,
  sweepMissingMirrors,
  sweepStuckRows,
  type SweepError,
} from "./sweeps.ts";

interface SweptCounts {
  card_authorization: number;
  balances: number;
  blnk_transactions: number;
  stuck_rows: number;
  inbox: number;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// Constant-time comparison via digest so key length/content can't be timed.
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
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

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const secret = Deno.env.get("RECONCILE_SECRET");
  if (!secret) return json({ error: "server misconfigured: RECONCILE_SECRET unset" }, 500);

  const key = req.headers.get("X-Reconcile-Key");
  if (!key || !(await timingSafeEqual(key, secret))) return json({ error: "unauthorized" }, 401);

  try {
    const cfg = blnkConfigFromEnv();
    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      // CORE_SERVICE_ROLE_KEY first — see api/lib.ts createDb(). A broken
      // injected key ("JWT issued at future") silently kills every sweep, and
      // this function is the authority the webhook path falls back to, so it
      // failing closed is worse here than almost anywhere else.
      (Deno.env.get("CORE_SERVICE_ROLE_KEY") ||
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"))!,
      { auth: { persistSession: false } },
    );

    const errors: SweepError[] = [];
    const swept: SweptCounts = {
      card_authorization: 0,
      balances: 0,
      blnk_transactions: 0,
      stuck_rows: 0,
      inbox: 0,
    };
    let advanced = 0;
    let drifts = 0;
    let missingMirrors = 0;
    let recovered = 0;
    let redispatched = 0;

    await sweepCardAuthorization(
      db,
      cfg,
      errors,
      (n) => { swept.card_authorization = n; },
      () => { advanced++; },
    );

    await sweepBalances(
      db,
      cfg,
      errors,
      (n) => { swept.balances = n; },
      () => { drifts++; },
    );

    await sweepStuckRows(
      db,
      cfg,
      errors,
      (n) => { swept.stuck_rows += n; },
      () => { recovered++; },
    );

    await sweepMissingMirrors(
      db,
      cfg,
      errors,
      (n) => { swept.blnk_transactions = n; },
      () => { missingMirrors++; },
    );

    // Inbox last: the sweeps above may have written the very row a failed event
    // was waiting on, so re-dispatch gets the freshest possible state.
    await sweepInbox(
      db,
      errors,
      (n) => { swept.inbox = n; },
      () => { redispatched++; },
    );

    const summary = {
      swept, advanced, drifts, recovered, redispatched,
      missing_mirrors: missingMirrors, error_count: errors.length,
    };
    const now = new Date().toISOString();
    const { error: syncErr } = await db.schema("core").from("blnk_sync_state").upsert({
      resource: "reconcile",
      last_cursor: JSON.stringify(summary),
      last_synced_at: now,
      updated_at: now,
    });
    if (syncErr) errors.push({ table: "blnk_sync_state", id: "reconcile", error: syncErr.message });

    return json({
      ok: true, swept, advanced, drifts, recovered, redispatched,
      missing_mirrors: missingMirrors, errors,
    });
  } catch (e) {
    return json({ ok: false, error: errMsg(e) }, 500);
  }
});
