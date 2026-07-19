// Card 16: events outbox + worker.
//
// core.event IS the outbox — every rail, entity, lock and verification writes
// into it (cards 22/24/29/31/39-42). The worker sweeps rows that are
// undelivered and due, POSTs each to the target, marks delivery only on a
// 2xx, and reschedules with exponential backoff when the target is down. An
// event is never lost: failure only pushes next_attempt_at into the future.
//
// Scheduling: pg_cron -> pg_net calls POST /events/deliver every minute (the
// vault-keyed pattern blnk-reconcile established). The default target is our
// own /sandbox/event-sink, so the loop is provable end-to-end with no
// external dependency; EVENT_WEBHOOK_URL overrides it for a real consumer.
import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { internalErrorResponse, jsonResponse } from "./lib.ts";

const SWEEP_LIMIT = 50;
const BASE_BACKOFF_MS = 30_000; // 30s, 60s, 120s, ... capped below
const MAX_BACKOFF_MS = 15 * 60_000;

export interface DeliverDeps {
  fetchFn: (url: string, init?: RequestInit) => Promise<Response>;
  targetUrl: string;
  apiKey: string | null;
}

interface OutboxRow {
  id: string;
  code: string;
  type: string;
  resource_id: string;
  payload: unknown;
  delivery_attempts: number | null;
  created_at: string;
}

export async function deliverEvents(
  db: SupabaseClient,
  deps: DeliverDeps,
): Promise<{ swept: number; delivered: number; failed: number }> {
  const now = new Date().toISOString();
  const { data, error } = await db.schema("core").from("event")
    .select("id, code, type, resource_id, payload, delivery_attempts, created_at")
    .is("delivered_at", null)
    .or(`next_attempt_at.is.null,next_attempt_at.lte.${now}`)
    .order("created_at", { ascending: true })
    .limit(SWEEP_LIMIT);
  if (error) throw new Error(`outbox sweep: ${error.message}`);

  const rows = (data ?? []) as unknown as OutboxRow[];
  let delivered = 0;
  let failed = 0;

  for (const row of rows) {
    let ok = false;
    try {
      const res = await deps.fetchFn(deps.targetUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(deps.apiKey ? { "X-Api-Key": deps.apiKey } : {}),
        },
        body: JSON.stringify({
          id: row.id,
          code: row.code,
          type: row.type,
          resource_id: row.resource_id,
          payload: row.payload,
          created_at: row.created_at,
        }),
      });
      ok = res.ok;
    } catch {
      ok = false; // network down = target down: retry, never crash the sweep
    }

    if (ok) {
      const { error: updErr } = await db.schema("core").from("event")
        .update({ delivered_at: new Date().toISOString() })
        .eq("id", row.id);
      if (updErr) console.error(`delivery mark failed for ${row.id}: ${updErr.message}`);
      delivered++;
    } else {
      const attempts = (row.delivery_attempts ?? 0) + 1;
      const backoff = Math.min(BASE_BACKOFF_MS * 2 ** (attempts - 1), MAX_BACKOFF_MS);
      const { error: updErr } = await db.schema("core").from("event")
        .update({
          delivery_attempts: attempts,
          next_attempt_at: new Date(Date.now() + backoff).toISOString(),
        })
        .eq("id", row.id);
      if (updErr) console.error(`retry schedule failed for ${row.id}: ${updErr.message}`);
      failed++;
    }
  }

  return { swept: rows.length, delivered, failed };
}

/** POST /events/deliver — one worker sweep (cron target; also callable ad hoc). */
export async function postDeliverEvents(
  _req: Request,
  db: SupabaseClient,
  requestId: string,
): Promise<Response> {
  const targetUrl = Deno.env.get("EVENT_WEBHOOK_URL") ??
    `${Deno.env.get("SUPABASE_URL")}/functions/v1/api/sandbox/event-sink`;
  try {
    const out = await deliverEvents(db, {
      fetchFn: (url, init) => fetch(url, init),
      targetUrl,
      apiKey: Deno.env.get("DEMO_API_KEY") ?? null,
    });
    return jsonResponse(out, 200, requestId);
  } catch (err) {
    return internalErrorResponse(requestId, err);
  }
}

/** POST /sandbox/event-sink — default delivery target; proves the round trip. */
export function postEventSink(requestId: string): Response {
  return jsonResponse({ ok: true }, 200, requestId);
}
