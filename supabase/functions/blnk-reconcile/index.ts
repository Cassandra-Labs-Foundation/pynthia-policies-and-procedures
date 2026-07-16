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
  type BlnkTransaction,
} from "../_shared/blnk.ts";

const PENDING_STATUSES = ["QUEUED", "INFLIGHT", "SCHEDULED"] as const;
const TXN_TABLES = ["ach_transfer", "wire_transfer", "transfer"] as const;
const MIRROR_TABLES = [
  "ach_transfer",
  "wire_transfer",
  "transfer",
  "inbound_payment",
  "card_authorization",
] as const;

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
  blnk_transactions: number;
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

async function emitMissingMirror(
  db: SupabaseClient,
  txn: BlnkTransaction,
  txnId: string,
  coreResource: { table?: string; id?: string } | undefined,
  reason: string,
  errors: SweepError[],
  onMissing: () => void,
): Promise<void> {
  const { data: existing, error: dedupErr } = await db.schema("core").from("event")
    .select("id")
    .eq("code", "blnk.missing_mirror")
    .eq("resource_id", txnId)
    .limit(1);

  if (dedupErr) {
    errors.push({ table: "event", id: txnId, error: dedupErr.message });
    return;
  }
  if (existing && existing.length > 0) return;

  const createdAt = typeof txn.created_at === "string" ? txn.created_at : null;
  const { error: insErr } = await db.schema("core").from("event").insert({
    id: crypto.randomUUID(),
    code: "blnk.missing_mirror",
    type: "reconciliation",
    resource_id: txnId,
    payload: {
      reason,
      transaction_id: txnId,
      reference: txn.reference ?? null,
      core_resource: coreResource ?? null,
      created_at: createdAt,
    },
    created_at: new Date().toISOString(),
  });
  if (insErr) {
    errors.push({ table: "event", id: txnId, error: insErr.message });
    return;
  }
  onMissing();
}

async function sweepMissingMirrors(
  db: SupabaseClient,
  cfg: BlnkConfig,
  errors: SweepError[],
  onSwept: (n: number) => void,
  onMissing: () => void,
): Promise<void> {
  const { data: cursorRow, error: cursorErr } = await db.schema("core").from("blnk_sync_state")
    .select("last_cursor")
    .eq("resource", "missing_mirror")
    .maybeSingle();

  if (cursorErr) {
    errors.push({ table: "blnk_sync_state", id: "missing_mirror", error: cursorErr.message });
    return;
  }

  const effectiveCursor = (typeof cursorRow?.last_cursor === "string" && cursorRow.last_cursor)
    ? cursorRow.last_cursor
    : new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const cursorMs = Date.parse(effectiveCursor);

  const collected: BlnkTransaction[] = [];
  let newestSeen: string | null = null;
  let fetchedAny = false;
  // Grace window: a txn's mirror write may still be in flight on the command
  // path — too-young txns are neither examined nor cursor-advanced past, so the
  // next run picks them up instead of flagging a false missing_mirror.
  const eligibleMaxMs = Date.now() - 2 * 60 * 1000;

  try {
    const perPage = 100;
    for (let page = 1; page <= 5; page++) {
      const txns = await searchTransactions(cfg, {
        q: "*",
        queryBy: "reference",
        sortBy: "created_at:desc",
        perPage,
        page,
      });

      if (txns.length === 0) break;
      fetchedAny = true;

      let oldestMsOnPage = Infinity;
      for (const txn of txns) {
        const createdAt = txn.created_at;
        if (typeof createdAt !== "string") continue;
        const ms = Date.parse(createdAt);
        if (Number.isNaN(ms)) continue;

        if (ms < oldestMsOnPage) oldestMsOnPage = ms;
        if (ms > eligibleMaxMs) continue; // too young — leave for the next run
        if (newestSeen === null || ms > Date.parse(newestSeen)) newestSeen = createdAt;
        if (ms >= cursorMs) collected.push(txn);
      }

      if (txns.length < perPage) break;
      if (oldestMsOnPage < cursorMs) break;
    }
  } catch (e) {
    errors.push({ table: "blnk_search", id: "*", error: errMsg(e) });
    return;
  }

  onSwept(collected.length);

  for (const txn of collected) {
    const txnId = txn.transaction_id;

    const createdAt = txn.created_at;
    if (typeof createdAt !== "string" || Number.isNaN(Date.parse(createdAt))) {
      errors.push({ table: "blnk_search", id: txnId, error: "unparseable created_at" });
      continue;
    }

    const parentTxn = txn.parent_transaction;
    if (typeof parentTxn === "string" && parentTxn.length > 0) continue;

    const metaData = txn.meta_data;
    if (metaData?.synthetic === true) continue;

    const coreResourceRaw = metaData?.core_resource;
    const coreResource = (coreResourceRaw && typeof coreResourceRaw === "object")
      ? coreResourceRaw as { table?: string; id?: string }
      : undefined;

    if (!coreResource?.table || !coreResource?.id) {
      await emitMissingMirror(db, txn, txnId, coreResource, "no core_resource", errors, onMissing);
      continue;
    }

    if (!(MIRROR_TABLES as readonly string[]).includes(coreResource.table)) {
      await emitMissingMirror(db, txn, txnId, coreResource, "unknown table", errors, onMissing);
      continue;
    }

    const { data, error } = await db.schema("core").from(coreResource.table)
      .select("id")
      .eq("id", coreResource.id)
      .maybeSingle();

    if (error) {
      errors.push({ table: coreResource.table, id: coreResource.id, error: error.message });
      continue;
    }

    if (data === null) {
      await emitMissingMirror(db, txn, txnId, coreResource, "row missing", errors, onMissing);
    }
  }

  const now = new Date().toISOString();
  const newCursor = fetchedAny && newestSeen ? newestSeen : effectiveCursor;
  const { error: upsertErr } = await db.schema("core").from("blnk_sync_state").upsert({
    resource: "missing_mirror",
    last_cursor: newCursor,
    last_synced_at: now,
    updated_at: now,
  });
  if (upsertErr) {
    errors.push({ table: "blnk_sync_state", id: "missing_mirror", error: upsertErr.message });
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
      blnk_transactions: 0,
    };
    let advanced = 0;
    let drifts = 0;
    let missingMirrors = 0;

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

    await sweepMissingMirrors(
      db,
      cfg,
      errors,
      (n) => { swept.blnk_transactions = n; },
      () => { missingMirrors++; },
    );

    const summary = { swept, advanced, drifts, missing_mirrors: missingMirrors, error_count: errors.length };
    const now = new Date().toISOString();
    const { error: syncErr } = await db.schema("core").from("blnk_sync_state").upsert({
      resource: "reconcile",
      last_cursor: JSON.stringify(summary),
      last_synced_at: now,
      updated_at: now,
    });
    if (syncErr) errors.push({ table: "blnk_sync_state", id: "reconcile", error: syncErr.message });

    return json({ ok: true, swept, advanced, drifts, missing_mirrors: missingMirrors, errors });
  } catch (e) {
    return json({ ok: false, error: errMsg(e) }, 500);
  }
});
