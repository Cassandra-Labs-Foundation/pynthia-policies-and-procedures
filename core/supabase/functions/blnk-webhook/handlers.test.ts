// blnk-webhook handlers — the events that went live when Blnk Cloud shipped
// self-serve global webhooks (2026-07).
//
// What these pin, and why each one is load-bearing:
//   (a) a balance monitor trip becomes a real BSA alert with BSA-06's triage
//       clock already started — the alert is worthless without the deadline;
//   (b) an unresolvable trip THROWS, so the inbox marks it `failed` and the
//       reconciler re-drives it, rather than silently swallowing a tripwire;
//   (c) reconciliation/bulk/system failures each open a finding — a Blnk-side
//       failure nobody owns is the same as no detection at all;
//   (d) eventKey distinguishes successive trips of the SAME monitor. Anchoring
//       on balance_id alone made every future trip a "duplicate" and dropped
//       it. Blnk never retries, so that drop would have been permanent.

import {
  assert,
  assertEquals,
  assertRejects,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { coreReference, dispatch, eventKey } from "./handlers.ts";
import type { BlnkWebhook } from "./types.ts";

interface Recorded {
  upserts: { table: string; row: Record<string, unknown> }[];
  updates: { table: string; patch: Record<string, unknown> }[];
  inserts: { table: string; row: Record<string, unknown> }[];
  /** column -> values the handler filtered on, so a lookup's shape can be pinned. */
  filters: { table: string; column: string; values: unknown[] }[];
  /** `.match({...})` args, i.e. which row an update actually targeted. */
  matches: { table: string; on: Record<string, unknown> }[];
}

/** Table-aware stub for the chains the handlers use. */
function stubDb(rows: Record<string, Record<string, unknown>[]> = {}): {
  db: SupabaseClient;
  rec: Recorded;
} {
  const rec: Recorded = { upserts: [], updates: [], inserts: [], filters: [], matches: [] };
  const makeBuilder = (table: string) => {
    let op: "select" | "update" | "upsert" | "insert" = "select";
    let patch: Record<string, unknown> = {};
    // deno-lint-ignore no-explicit-any
    const b: any = {};
    const chain = (fn?: (...args: unknown[]) => void) => (...args: unknown[]) => {
      fn?.(...args);
      return b;
    };
    b.select = chain();
    b.eq = chain((col, v) => {
      rec.filters.push({ table, column: col as string, values: [v] });
    });
    b.match = chain((on) => {
      rec.matches.push({ table, on: on as Record<string, unknown> });
    });
    b.in = chain((col, vs) => {
      rec.filters.push({ table, column: col as string, values: vs as unknown[] });
    });
    b.not = chain();
    b.lt = chain();
    b.order = chain();
    b.limit = chain();
    b.update = chain((p) => {
      op = "update";
      patch = p as Record<string, unknown>;
    });
    b.upsert = chain((row) => {
      op = "upsert";
      rec.upserts.push({ table, row: row as Record<string, unknown> });
    });
    b.insert = chain((row) => {
      op = "insert";
      rec.inserts.push({ table, row: row as Record<string, unknown> });
    });
    b.then = (onFul: (v: unknown) => unknown, onRej?: (e: unknown) => unknown) => {
      let result: unknown;
      if (op === "select") result = { data: rows[table] ?? [], error: null };
      else if (op === "update") {
        rec.updates.push({ table, patch });
        result = { error: null };
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

const wh = (event: string, data: Record<string, unknown>): BlnkWebhook =>
  ({ event, data }) as BlnkWebhook;

// ---- (d) the duplicate-collapse regression -----------------------------------

Deno.test("eventKey: two trips of the same monitor are distinct events", () => {
  const a = eventKey("balance.monitor", {
    monitor_id: "mon_1",
    balance_id: "bln_1",
    triggered_at: "2026-07-28T10:00:00Z",
  });
  const b = eventKey("balance.monitor", {
    monitor_id: "mon_1",
    balance_id: "bln_1",
    triggered_at: "2026-08-04T10:00:00Z",
  });
  assert(a !== b, "same monitor tripping twice must not collapse to one inbox key");
});

Deno.test("eventKey: a redelivery of ONE trip still dedups", () => {
  const d = { monitor_id: "mon_1", balance_id: "bln_1", triggered_at: "2026-07-28T10:00:00Z" };
  assertEquals(eventKey("balance.monitor", { ...d }), eventKey("balance.monitor", { ...d }));
});

Deno.test("eventKey: transactions still anchor on transaction_id", () => {
  assertEquals(
    eventKey("transaction.applied", { transaction_id: "txn_9", reference: "ach_transfer:1" }),
    "transaction.applied:txn_9",
  );
});

Deno.test("eventKey: ledger.created anchors on ledger_id", () => {
  assertEquals(
    eventKey("ledger.created", { ledger_id: "ldg_1" }),
    "ledger.created:ldg_1",
  );
  assert(
    eventKey("ledger.created", { ledger_id: "ldg_1" }) !==
      eventKey("ledger.created", { ledger_id: "ldg_2" }),
    "two different ledgers must not share an inbox key",
  );
});

Deno.test("eventKey: an id-less event fingerprints its payload, not a shared literal", () => {
  // The old fallback was the constant "novel", so the FIRST id-less event of a
  // type claimed the key and every later one was dropped as a duplicate —
  // permanently, since Blnk never retries.
  const a = eventKey("some.event", { foo: "a" });
  const b = eventKey("some.event", { foo: "b" });
  assert(a !== b, "distinct id-less events must get distinct keys");
  assertEquals(a, eventKey("some.event", { foo: "a" }), "a true redelivery still dedups");
  assert(!a.endsWith(":novel"), "the shared-literal fallback must be gone");
});

// ---- (a) + (b) balance.monitor ----------------------------------------------

Deno.test("balance.monitor raises a BSA alert with the triage clock started", async () => {
  const { db, rec } = stubDb({ account: [{ id: "acct_1" }] });

  const outcome = await dispatch(
    db,
    wh("balance.monitor", {
      monitor_id: "mon_ctr",
      balance_id: "bln_1",
      condition: { field: "balance", operator: ">", value: 1_000_000 },
      value: 1_250_000,
      triggered_at: "2026-07-28T10:00:00Z",
      meta_data: { alert_type: "ctr_threshold" },
    }),
  );
  assertEquals(outcome, "processed");

  const alert = rec.upserts.find((u) => u.table === "bsa_alert");
  assert(alert, "a tripped monitor must produce a bsa_alert");
  assertEquals(alert.row.alert_type, "ctr_threshold");
  assertEquals(alert.row.status, "open");
  // BSA-06: the 2-business-day clock starts at creation. An alert without it is
  // a detection with no deadline, which is the failure this whole path exists to avoid.
  assert(alert.row.triage_due_at, "triage_due_at must be set");
  assert(alert.row.entity_hash, "entity_hash must be set");
  assertStringIncludes(String(alert.row.details), "bln_1");

  // BSA-06 also declares the trigger event and the timer event.
  const codes = rec.upserts.filter((u) => u.table === "event").map((u) => u.row.code);
  assert(codes.includes("bsa_alert.created"), "must emit bsa_alert.created");
  assert(codes.includes("bsa_alert.triage.timer"), "must emit the triage timer event");
});

Deno.test("balance.monitor without a matching account throws (inbox marks it failed)", async () => {
  const { db } = stubDb({ account: [] });
  await assertRejects(
    () => dispatch(db, wh("balance.monitor", { balance_id: "bln_unknown" })),
    Error,
    "no account for balance",
  );
});

Deno.test("balance.monitor without a balance_id throws rather than guessing", async () => {
  const { db } = stubDb();
  await assertRejects(
    () => dispatch(db, wh("balance.monitor", { monitor_id: "mon_1" })),
    Error,
    "without balance_id",
  );
});

// ---- (c) failure paths open findings ----------------------------------------

Deno.test("reconciliation.completed advances the cursor and flags unmatched items", async () => {
  const { db, rec } = stubDb();
  const outcome = await dispatch(
    db,
    wh("reconciliation.completed", {
      reconciliation_id: "rcn_1",
      status: "completed",
      matched_count: 40,
      unmatched_count: 3,
    }),
  );
  assertEquals(outcome, "processed");

  const sync = rec.upserts.find((u) => u.table === "blnk_sync_state");
  assert(sync, "cursor must advance so a later backfill can resume");
  assertEquals(sync.row.resource, "reconciliation");
  assertEquals(sync.row.last_cursor, "rcn_1");

  const finding = rec.upserts.find((u) => u.table === "finding");
  assert(finding, "unmatched ledger items must open a finding");
  assertEquals(finding.row.status, "open");
  assertEquals(finding.row.provenance, "production");
  assertStringIncludes(String(finding.row.description), "3 unmatched");
});

Deno.test("reconciliation.completed with everything matched opens no finding", async () => {
  const { db, rec } = stubDb();
  await dispatch(
    db,
    wh("reconciliation.completed", {
      reconciliation_id: "rcn_2",
      matched_count: 40,
      unmatched_count: 0,
    }),
  );
  assert(rec.upserts.find((u) => u.table === "blnk_sync_state"), "cursor still advances");
  assertEquals(rec.upserts.filter((u) => u.table === "finding").length, 0);
});

Deno.test("reconciliation.failed opens a high-severity finding", async () => {
  const { db, rec } = stubDb();
  await dispatch(
    db,
    wh("reconciliation.failed", { reconciliation_id: "rcn_3", reason: "source file unreadable" }),
  );
  const finding = rec.upserts.find((u) => u.table === "finding");
  assert(finding);
  assertEquals(finding.row.severity, "high");
  assertStringIncludes(String(finding.row.description), "source file unreadable");
});

Deno.test("system.error opens a finding — nothing else surfaces Blnk internals", async () => {
  const { db, rec } = stubDb();
  const outcome = await dispatch(
    db,
    wh("system.error", { component: "queue", error: "worker panic", reference: "ref_1" }),
  );
  assertEquals(outcome, "processed");
  const finding = rec.upserts.find((u) => u.table === "finding");
  assert(finding);
  assertEquals(finding.row.severity, "high");
  assertStringIncludes(String(finding.row.description), "worker panic");
});

// ---- bulk transactions -------------------------------------------------------

Deno.test("bulk_transaction.failed opens a finding", async () => {
  const { db, rec } = stubDb();
  await dispatch(db, wh("bulk_transaction.failed", { batch_id: "bulk_1", reason: "partial write" }));
  const finding = rec.upserts.find((u) => u.table === "finding");
  assert(finding);
  assertEquals(finding.row.severity, "high");
});

Deno.test("bulk_transaction.applied mirrors every inline constituent", async () => {
  const { db, rec } = stubDb();
  const outcome = await dispatch(
    db,
    wh("bulk_transaction.applied", {
      batch_id: "bulk_2",
      transactions: [
        {
          transaction_id: "txn_a",
          status: "APPLIED",
          meta_data: { core_resource: { table: "ach_transfer", id: "ach_1" } },
        },
        {
          transaction_id: "txn_b",
          status: "APPLIED",
          meta_data: { core_resource: { table: "wire_transfer", id: "wire_1" } },
        },
      ],
    }),
  );
  assertEquals(outcome, "processed");
  const tables = rec.updates.map((u) => u.table);
  assert(tables.includes("ach_transfer"), "first constituent must be mirrored");
  assert(tables.includes("wire_transfer"), "second constituent must be mirrored");
});

Deno.test("bulk_transaction: one bad constituent does not strand the others", async () => {
  const { db, rec } = stubDb();
  // The second has no core_resource and no reference, so it cannot be routed.
  await assertRejects(
    () =>
      dispatch(
        db,
        wh("bulk_transaction.applied", {
          batch_id: "bulk_3",
          transactions: [
            {
              transaction_id: "txn_a",
              status: "APPLIED",
              meta_data: { core_resource: { table: "ach_transfer", id: "ach_1" } },
            },
            { transaction_id: "txn_orphan", status: "APPLIED" },
          ],
        }),
      ),
    Error,
    "bulk constituents failed",
  );
  // The good one was still applied before the error surfaced.
  assert(
    rec.updates.some((u) => u.table === "ach_transfer"),
    "a routable constituent must be mirrored even when a sibling fails",
  );
});

// ---- (e) the `_q` queued-reference regression --------------------------------
//
// Blnk's queued flow returns a QUEUED parent carrying the reference we sent,
// then applies a CHILD whose reference has `_q` appended — and fires the webhook
// for the child. The fallback route compared that raw child reference against
// blnk_reference, so it matched nothing for EVERY queued transaction: throw ->
// inbox `failed` -> re-driven every 5 minutes forever. Found live 2026-08-11 by
// running a real transfer end-to-end; only meta_data.core_resource had ever
// worked, which is why the hermetic suite never noticed.

Deno.test("coreReference: recovers the reference our writers actually stamped", () => {
  assertEquals(coreReference("ach_transfer:abc_q"), "ach_transfer:abc");
  // Non-queued references must survive untouched...
  assertEquals(coreReference("ach_transfer:abc"), "ach_transfer:abc");
  // ...including the leg suffix the writer contract allows, and ids ending in q.
  assertEquals(coreReference("transfer:abc:debit"), "transfer:abc:debit");
  assertEquals(coreReference("ach_transfer:abcq"), "ach_transfer:abcq");
});

Deno.test("a queued transaction's `_q` child still finds its core row", async () => {
  // Row was stamped by the writer with the CANONICAL reference; the event
  // arrives carrying the `_q` child spelling. No core_resource -> fallback only.
  const { db, rec } = stubDb({
    ach_transfer: [{ id: "ach_1", blnk_reference: "ach_transfer:ach_1" }],
  });

  await dispatch(
    db,
    wh("transaction.applied", {
      transaction_id: "txn_child",
      parent_transaction: "txn_parent",
      reference: "ach_transfer:ach_1_q",
      status: "APPLIED",
    }),
  );

  const lookup = rec.filters.find((f) => f.column === "blnk_reference");
  assert(lookup, "the fallback must query blnk_reference");
  assert(
    lookup.values.includes("ach_transfer:ach_1"),
    "must look up the canonical reference, not only the `_q` child spelling",
  );

  const upd = rec.updates.find((u) => u.table === "ach_transfer");
  assert(upd, "the queued child must still mirror onto the core row");
  assertEquals(upd.patch.blnk_status, "APPLIED");
  assertEquals(upd.patch.blnk_transaction_id, "txn_child");
  // Persisting `_q` would corrupt the reconciler's by-reference lookups.
  assertEquals(
    upd.patch.blnk_reference,
    "ach_transfer:ach_1",
    "the row must keep the canonical reference, never the `_q` spelling",
  );
});

Deno.test("a row already stamped `_q` by an earlier delivery is still matched", async () => {
  // Rows written before this fix hold the `_q` spelling. Both must resolve, and
  // the update must target the value the row actually holds.
  const { db, rec } = stubDb({
    ach_transfer: [{ id: "ach_1", blnk_reference: "ach_transfer:ach_1_q" }],
  });

  await dispatch(
    db,
    wh("transaction.applied", {
      transaction_id: "txn_child",
      reference: "ach_transfer:ach_1_q",
      status: "APPLIED",
    }),
  );

  const lookup = rec.filters.find((f) => f.column === "blnk_reference");
  assert(lookup?.values.includes("ach_transfer:ach_1_q"), "the `_q` spelling must stay a candidate");
  assertEquals(
    rec.matches.find((m) => m.table === "ach_transfer")?.on.blnk_reference,
    "ach_transfer:ach_1_q",
    "the update must target the value the row actually holds",
  );
});

Deno.test("core_resource still wins over the reference fallback", async () => {
  const { db, rec } = stubDb();
  await dispatch(
    db,
    wh("transaction.applied", {
      transaction_id: "txn_child",
      reference: "ach_transfer:ach_1_q",
      status: "APPLIED",
      meta_data: { core_resource: { table: "ach_transfer", id: "ach_1" } },
    }),
  );
  assert(
    !rec.filters.some((f) => f.column === "blnk_reference"),
    "an explicitly routed event must not run the fallback scan at all",
  );
  assertEquals(
    rec.matches.find((m) => m.table === "ach_transfer")?.on.id,
    "ach_1",
    "explicit routing targets the row by id",
  );
});

// ---- unchanged behaviour still holds ----------------------------------------

Deno.test("an unknown event is stored and skipped, never failed", async () => {
  const { db } = stubDb();
  assertEquals(await dispatch(db, wh("ledger.created", { ledger_id: "ldg_1" })), "skipped");
});
