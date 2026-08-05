// Card 18 — the heartbeat is the recovery path for dropped webhooks, and a
// recovery that leaves no evidence is indistinguishable from one that never
// ran. These tests pin: (a) a mirror advance emits a durable
// blnk.mirror.recovered event with the exact transition, (b) no advance means
// no event, (c) a failed mirror write emits nothing (evidence only follows a
// real advance).
import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { type BlnkConfig } from "../_shared/blnk.ts";
import { sweepCardAuthorization, sweepTxnTable, type SweepError } from "./sweeps.ts";

interface Recorded {
  updates: { table: string; patch: Record<string, unknown>; id: string }[];
  upserts: { table: string; row: Record<string, unknown>; opts?: Record<string, unknown> }[];
}

// Minimal table-aware stub for the chains the sweeps use:
//   select().not().in().order().limit()  -> {data, error}
//   update().eq()                        -> {error}
//   upsert(row, opts)                    -> {error}
function stubDb(opts: {
  rows: Record<string, Record<string, unknown>[]>;
  updateError?: string;
}): { db: SupabaseClient; rec: Recorded } {
  const rec: Recorded = { updates: [], upserts: [] };
  const makeBuilder = (table: string) => {
    let op: "select" | "update" | "upsert" = "select";
    let patch: Record<string, unknown> = {};
    let matchId = "";
    // deno-lint-ignore no-explicit-any
    const b: any = {};
    const chain = (fn?: (...args: unknown[]) => void) => (...args: unknown[]) => {
      fn?.(...args);
      return b;
    };
    b.select = chain();
    b.not = chain();
    b.in = chain();
    b.order = chain();
    b.limit = chain();
    b.update = chain((p) => {
      op = "update";
      patch = p as Record<string, unknown>;
    });
    b.eq = chain((_col, id) => {
      if (op === "update") matchId = id as string;
    });
    b.upsert = chain((row, o) => {
      op = "upsert";
      rec.upserts.push({ table, row: row as Record<string, unknown>, opts: o as Record<string, unknown> });
    });
    b.then = (
      onFul: (v: unknown) => unknown,
      onRej?: (e: unknown) => unknown,
    ) => {
      let result: unknown;
      if (op === "select") result = { data: opts.rows[table] ?? [], error: null };
      else if (op === "update") {
        if (opts.updateError) result = { error: { message: opts.updateError } };
        else {
          rec.updates.push({ table, patch, id: matchId });
          result = { error: null };
        }
      } else result = { error: null };
      return Promise.resolve(result).then(onFul, onRej);
    };
    return b;
  };
  const db = {
    schema: () => ({ from: (t: string) => makeBuilder(t) }),
  } as unknown as SupabaseClient;
  return { db, rec };
}

// Blnk stub: GET /transactions/:id -> parent; POST /search/transactions -> children.
function stubCfg(opts: {
  parent: { transaction_id: string; status: string };
  children?: { transaction_id: string; status: string; precise_amount?: number }[];
}): BlnkConfig {
  const fetchFn = (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const u = String(url);
    if (init?.method === "POST" && u.endsWith("/search/transactions")) {
      const hits = (opts.children ?? []).map((c) => ({ document: c }));
      return Promise.resolve(new Response(JSON.stringify({ hits }), { status: 200 }));
    }
    if ((init?.method ?? "GET") === "GET" && u.includes("/transactions/")) {
      return Promise.resolve(new Response(JSON.stringify(opts.parent), { status: 200 }));
    }
    return Promise.resolve(new Response(JSON.stringify({ error: `unstubbed ${init?.method} ${u}` }), { status: 500 }));
  };
  return { apiUrl: "http://blnk.test", apiKey: "test-key", fetchFn: fetchFn as typeof fetch };
}

function recoveryEvents(rec: Recorded) {
  return rec.upserts.filter((u) => u.table === "event" && u.row.code === "blnk.mirror.recovered");
}

Deno.test("inflight parent resolved APPLIED: mirror advances and emits blnk.mirror.recovered with the exact transition", async () => {
  const { db, rec } = stubDb({
    rows: {
      ach_transfer: [{ id: "ach_1", blnk_transaction_id: "txn_p", blnk_status: "INFLIGHT" }],
    },
  });
  const cfg = stubCfg({
    parent: { transaction_id: "txn_p", status: "INFLIGHT" },
    children: [{ transaction_id: "txn_c", status: "APPLIED", precise_amount: 5000 }],
  });
  const errors: SweepError[] = [];
  let advanced = 0;
  await sweepTxnTable(db, cfg, "ach_transfer", errors, () => {}, () => advanced++);

  assertEquals(errors, []);
  assertEquals(advanced, 1);
  const upd = rec.updates.find((u) => u.table === "ach_transfer");
  assertExists(upd);
  assertEquals(upd.patch.blnk_status, "APPLIED");

  const evts = recoveryEvents(rec);
  assertEquals(evts.length, 1);
  const evt = evts[0];
  assertEquals(evt.row.id, "evt_recon_ach_1_applied");
  assertEquals(evt.row.type, "reconciliation");
  assertEquals(evt.row.resource_id, "ach_transfer:ach_1");
  const payload = evt.row.payload as Record<string, unknown>;
  assertEquals(payload.from, "INFLIGHT");
  assertEquals(payload.to, "APPLIED");
  assertEquals(payload.blnk_transaction_id, "txn_p");
  // re-sweeps must not duplicate the evidence
  assertEquals(evt.opts?.onConflict, "id");
  assertEquals(evt.opts?.ignoreDuplicates, true);
});

Deno.test("live hold (inflight, no children, mirror in sync): no advance, no event — but synced_at is touched so the sweep window rotates past it", async () => {
  // Without the touch, permanently-inflight rows monopolize the oldest-first
  // sweep window (limit 25) and the heartbeat never reaches a fresh drop.
  const { db, rec } = stubDb({
    rows: {
      wire_transfer: [{ id: "wire_1", blnk_transaction_id: "txn_p", blnk_status: "INFLIGHT" }],
    },
  });
  const cfg = stubCfg({ parent: { transaction_id: "txn_p", status: "INFLIGHT" }, children: [] });
  const errors: SweepError[] = [];
  let advanced = 0;
  await sweepTxnTable(db, cfg, "wire_transfer", errors, () => {}, () => advanced++);

  assertEquals(errors, []);
  assertEquals(advanced, 0);
  assertEquals(rec.updates.length, 1);
  assertEquals(Object.keys(rec.updates[0].patch), ["synced_at"]);
  assertEquals(recoveryEvents(rec).length, 0);
});

Deno.test("card authorization live hold in sync: synced_at touched, nothing else", async () => {
  const { db, rec } = stubDb({
    rows: {
      card_authorization: [{ id: "auth_3", blnk_inflight_id: "txn_p", blnk_status: "INFLIGHT" }],
    },
  });
  const cfg = stubCfg({ parent: { transaction_id: "txn_p", status: "INFLIGHT" }, children: [] });
  const errors: SweepError[] = [];
  let advanced = 0;
  await sweepCardAuthorization(db, cfg, errors, () => {}, () => advanced++);

  assertEquals(errors, []);
  assertEquals(advanced, 0);
  assertEquals(rec.updates.length, 1);
  assertEquals(Object.keys(rec.updates[0].patch), ["synced_at"]);
  assertEquals(recoveryEvents(rec).length, 0);
});

Deno.test("terminal drift (mirror QUEUED, Blnk APPLIED): advances and records QUEUED->APPLIED", async () => {
  const { db, rec } = stubDb({
    rows: {
      transfer: [{ id: "tr_1", blnk_transaction_id: "txn_x", blnk_status: "QUEUED" }],
    },
  });
  const cfg = stubCfg({ parent: { transaction_id: "txn_x", status: "APPLIED" } });
  const errors: SweepError[] = [];
  await sweepTxnTable(db, cfg, "transfer", errors, () => {}, () => {});

  assertEquals(errors, []);
  const evts = recoveryEvents(rec);
  assertEquals(evts.length, 1);
  const payload = evts[0].row.payload as Record<string, unknown>;
  assertEquals(payload.from, "QUEUED");
  assertEquals(payload.to, "APPLIED");
  assertEquals(evts[0].row.resource_id, "transfer:tr_1");
});

Deno.test("card authorization: applied children sum into blnk_committed_amount and the recovery event is emitted", async () => {
  const { db, rec } = stubDb({
    rows: {
      card_authorization: [{ id: "auth_1", blnk_inflight_id: "txn_p", blnk_status: "INFLIGHT" }],
    },
  });
  const cfg = stubCfg({
    parent: { transaction_id: "txn_p", status: "INFLIGHT" },
    children: [
      { transaction_id: "txn_c1", status: "APPLIED", precise_amount: 300 },
      { transaction_id: "txn_c2", status: "APPLIED", precise_amount: 200 },
    ],
  });
  const errors: SweepError[] = [];
  let advanced = 0;
  await sweepCardAuthorization(db, cfg, errors, () => {}, () => advanced++);

  assertEquals(errors, []);
  assertEquals(advanced, 1);
  const upd = rec.updates.find((u) => u.table === "card_authorization");
  assertExists(upd);
  assertEquals(upd.patch.blnk_status, "APPLIED");
  assertEquals(upd.patch.blnk_committed_amount, 500);

  const evts = recoveryEvents(rec);
  assertEquals(evts.length, 1);
  assertEquals(evts[0].row.resource_id, "card_authorization:auth_1");
  assertEquals((evts[0].row.payload as Record<string, unknown>).to, "APPLIED");
});

Deno.test("card authorization: VOID child recovers as VOID", async () => {
  const { db, rec } = stubDb({
    rows: {
      card_authorization: [{ id: "auth_2", blnk_inflight_id: "txn_p", blnk_status: "INFLIGHT" }],
    },
  });
  const cfg = stubCfg({
    parent: { transaction_id: "txn_p", status: "INFLIGHT" },
    children: [{ transaction_id: "txn_c", status: "VOID" }],
  });
  const errors: SweepError[] = [];
  await sweepCardAuthorization(db, cfg, errors, () => {}, () => {});

  assertEquals(errors, []);
  const evts = recoveryEvents(rec);
  assertEquals(evts.length, 1);
  assertEquals(evts[0].row.id, "evt_recon_auth_2_void");
  assertEquals((evts[0].row.payload as Record<string, unknown>).to, "VOID");
});

Deno.test("failed mirror write: error recorded, no advance, no evidence event", async () => {
  const { db, rec } = stubDb({
    rows: {
      ach_transfer: [{ id: "ach_9", blnk_transaction_id: "txn_p", blnk_status: "QUEUED" }],
    },
    updateError: "boom",
  });
  const cfg = stubCfg({ parent: { transaction_id: "txn_p", status: "APPLIED" } });
  const errors: SweepError[] = [];
  let advanced = 0;
  await sweepTxnTable(db, cfg, "ach_transfer", errors, () => {}, () => advanced++);

  assertEquals(errors.length, 1);
  assertEquals(errors[0].error, "boom");
  assertEquals(advanced, 0);
  assertEquals(recoveryEvents(rec).length, 0);
});
