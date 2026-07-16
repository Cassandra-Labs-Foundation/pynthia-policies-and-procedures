// blnk-reconcile — scheduled reconciler (pg_cron → pg_net every 5 min).
//
// Blnk is ledger source of truth; core.* holds cached mirrors. Webhooks are off,
// so this function advances stale transaction-status mirrors and corrects balance
// drift. Config: verify_jwt = false; auth = X-Reconcile-Key header.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  blnkConfigFromEnv,
  getTransaction,
  getBalance,
  searchTransactions,
  BlnkError,
  type BlnkConfig,
} from "../_shared/blnk.ts";

const PENDING_STATUSES = ["QUEUED", "INFLIGHT", "SCHEDULED"] as const;
const TXN_TABLES = ["ach_transfer", "wire_transfer", "transfer"] as const;

interface TxnMirrorRow {
  id: string;
  blnk_transaction_id: string;
  blnk_status: string;
}

interface CardAuthRow {
  id: string;
  blnk_inflight_id: string;
  blnk_status: string;
}

interface AccountRow {
  id: string;
  balance: number;
  blnk_balance_id: string;
}

interface SweepError {
  table: string;
  id: string;
  error: string;
}

interface SweptCounts {
  ach_transfer: number;
  wire_transfer: number;
  transfer: number;
  card_authorization: number;
  balances: number;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function errMsg(e: unknown): string {
  if (e instanceof BlnkError || e instanceof Error) return e.message;
  return String(e);
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

// INFLIGHT parents stay INFLIGHT forever; terminal state lives in child txns.
async function resolveInflightChildren(
  cfg: BlnkConfig,
  parentTxnId: string,
): Promise<"VOID" | "APPLIED" | null> {
  const children = await searchTransactions(cfg, {
    q: "*",
    queryBy: "reference",
    filterBy: `parent_transaction:=${parentTxnId}`,
    perPage: 50,
  });
  if (children.length === 0) return null;
  if (children.some((c) => c.status === "VOID")) return "VOID";
  if (children.some((c) => c.status === "APPLIED")) return "APPLIED";
  return null;
}

function sumAppliedAmount(children: { status: string; precise_amount?: number }[]): number {
  return children
    .filter((c) => c.status === "APPLIED")
    .reduce((sum, c) => sum + (typeof c.precise_amount === "number" ? c.precise_amount : 0), 0);
}

async function sweepTxnTable(
  db: SupabaseClient,
  cfg: BlnkConfig,
  table: string,
  errors: SweepError[],
  onSwept: (n: number) => void,
  onAdvanced: () => void,
): Promise<void> {
  const { data, error } = await db.schema("core").from(table)
    .select("id, blnk_transaction_id, blnk_status")
    .not("blnk_transaction_id", "is", null)
    .in("blnk_status", [...PENDING_STATUSES])
    .order("synced_at", { ascending: true, nullsFirst: true })
    .limit(25);

  if (error) {
    errors.push({ table, id: "*", error: error.message });
    return;
  }

  const rows = (data ?? []) as TxnMirrorRow[];
  onSwept(rows.length);

  for (const row of rows) {
    try {
      const txn = await getTransaction(cfg, row.blnk_transaction_id);
      const now = new Date().toISOString();

      if (txn.status === "INFLIGHT") {
        const resolved = await resolveInflightChildren(cfg, row.blnk_transaction_id);
        // No children yet: still a live hold — but mirror QUEUED -> INFLIGHT if stale.
        const next = resolved ?? (row.blnk_status !== "INFLIGHT" ? "INFLIGHT" : null);
        if (next === null) continue;

        const { error: updErr } = await db.schema("core").from(table).update({
          blnk_status: next,
          synced_at: now,
        }).eq("id", row.id);
        if (updErr) errors.push({ table, id: row.id, error: updErr.message });
        else onAdvanced();
      } else if (txn.status !== row.blnk_status) {
        const { error: updErr } = await db.schema("core").from(table).update({
          blnk_status: txn.status,
          synced_at: now,
        }).eq("id", row.id);
        if (updErr) errors.push({ table, id: row.id, error: updErr.message });
        else onAdvanced();
      }
    } catch (e) {
      errors.push({ table, id: row.id, error: errMsg(e) });
    }
  }
}

async function sweepCardAuthorization(
  db: SupabaseClient,
  cfg: BlnkConfig,
  errors: SweepError[],
  onSwept: (n: number) => void,
  onAdvanced: () => void,
): Promise<void> {
  const table = "card_authorization";
  const { data, error } = await db.schema("core").from(table)
    .select("id, blnk_inflight_id, blnk_status")
    .not("blnk_inflight_id", "is", null)
    .in("blnk_status", [...PENDING_STATUSES])
    .order("synced_at", { ascending: true, nullsFirst: true })
    .limit(25);

  if (error) {
    errors.push({ table, id: "*", error: error.message });
    return;
  }

  const rows = (data ?? []) as CardAuthRow[];
  onSwept(rows.length);

  for (const row of rows) {
    try {
      const txn = await getTransaction(cfg, row.blnk_inflight_id);
      const now = new Date().toISOString();

      if (txn.status === "INFLIGHT") {
        const children = await searchTransactions(cfg, {
          q: "*",
          queryBy: "reference",
          filterBy: `parent_transaction:=${row.blnk_inflight_id}`,
          perPage: 50,
        });
        if (children.length === 0) {
          // Still a live hold — mirror QUEUED -> INFLIGHT if stale.
          if (row.blnk_status !== "INFLIGHT") {
            const { error: updErr } = await db.schema("core").from(table).update({
              blnk_status: "INFLIGHT",
              synced_at: now,
            }).eq("id", row.id);
            if (updErr) errors.push({ table, id: row.id, error: updErr.message });
            else onAdvanced();
          }
          continue;
        }

        if (children.some((c) => c.status === "VOID")) {
          const { error: updErr } = await db.schema("core").from(table).update({
            blnk_status: "VOID",
            synced_at: now,
          }).eq("id", row.id);
          if (updErr) errors.push({ table, id: row.id, error: updErr.message });
          else onAdvanced();
        } else {
          const applied = children.filter((c) => c.status === "APPLIED");
          if (applied.length === 0) continue;

          const { error: updErr } = await db.schema("core").from(table).update({
            blnk_status: "APPLIED",
            blnk_committed_amount: sumAppliedAmount(children),
            synced_at: now,
          }).eq("id", row.id);
          if (updErr) errors.push({ table, id: row.id, error: updErr.message });
          else onAdvanced();
        }
      } else if (txn.status !== row.blnk_status) {
        const { error: updErr } = await db.schema("core").from(table).update({
          blnk_status: txn.status,
          synced_at: now,
        }).eq("id", row.id);
        if (updErr) errors.push({ table, id: row.id, error: updErr.message });
        else onAdvanced();
      }
    } catch (e) {
      errors.push({ table, id: row.id, error: errMsg(e) });
    }
  }
}

async function sweepBalances(
  db: SupabaseClient,
  cfg: BlnkConfig,
  errors: SweepError[],
  onSwept: (n: number) => void,
  onDrift: () => void,
): Promise<void> {
  const table = "account";
  const { data, error } = await db.schema("core").from(table)
    .select("id, balance, blnk_balance_id")
    .not("blnk_balance_id", "is", null)
    .order("balance_synced_at", { ascending: true, nullsFirst: true })
    .limit(25);

  if (error) {
    errors.push({ table, id: "*", error: error.message });
    return;
  }

  const rows = (data ?? []) as AccountRow[];
  onSwept(rows.length);

  for (const row of rows) {
    try {
      const blnkBal = await getBalance(cfg, row.blnk_balance_id);
      const actual = blnkBal.balance;
      if (typeof actual !== "number") {
        errors.push({ table, id: row.id, error: "balance response missing numeric balance" });
        continue;
      }

      const now = new Date().toISOString();
      if (actual !== row.balance) {
        const { error: updErr } = await db.schema("core").from(table).update({
          balance: actual,
          balance_synced_at: now,
        }).eq("id", row.id);
        if (updErr) {
          errors.push({ table, id: row.id, error: updErr.message });
          continue;
        }

        const { error: evtErr } = await db.schema("core").from("event").insert({
          id: crypto.randomUUID(),
          code: "blnk.balance_drift",
          type: "reconciliation",
          resource_id: row.id,
          payload: {
            blnk_balance_id: row.blnk_balance_id,
            mirrored: row.balance,
            actual,
          },
          created_at: now,
        });
        if (evtErr) errors.push({ table: "event", id: row.id, error: evtErr.message });
        else onDrift();
      } else {
        const { error: updErr } = await db.schema("core").from(table).update({
          balance_synced_at: now,
        }).eq("id", row.id);
        if (updErr) errors.push({ table, id: row.id, error: updErr.message });
      }
    } catch (e) {
      errors.push({ table, id: row.id, error: errMsg(e) });
    }
  }
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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const errors: SweepError[] = [];
    const swept: SweptCounts = {
      ach_transfer: 0,
      wire_transfer: 0,
      transfer: 0,
      card_authorization: 0,
      balances: 0,
    };
    let advanced = 0;
    let drifts = 0;

    for (const table of TXN_TABLES) {
      await sweepTxnTable(
        db,
        cfg,
        table,
        errors,
        (n) => { swept[table] += n; },
        () => { advanced++; },
      );
    }

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

    const summary = { swept, advanced, drifts, error_count: errors.length };
    const now = new Date().toISOString();
    const { error: syncErr } = await db.schema("core").from("blnk_sync_state").upsert({
      resource: "reconcile",
      last_cursor: JSON.stringify(summary),
      last_synced_at: now,
      updated_at: now,
    });
    if (syncErr) errors.push({ table: "blnk_sync_state", id: "reconcile", error: syncErr.message });

    return json({ ok: true, swept, advanced, drifts, errors });
  } catch (e) {
    return json({ ok: false, error: errMsg(e) }, 500);
  }
});
