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
import {
  BLNK_BALANCE_ID_PREFIX,
  INBOX_FAILED_ALERT_THRESHOLD,
  INBOX_MAX_ATTEMPTS,
  sweepBalances,
  sweepCardAuthorization,
  sweepInbox,
  type SweepError,
} from "./sweeps.ts";

interface Recorded {
  rpcs: { fn: string; args: unknown }[];
  likes: { table: string; column: string; pattern: string }[];
  updates: { table: string; patch: Record<string, unknown>; id: string }[];
  upserts: { table: string; row: Record<string, unknown>; opts?: Record<string, unknown> }[];
  inserts: { table: string; row: Record<string, unknown> }[];
}

// Minimal table-aware stub for the chains the sweeps use:
//   select().not().in().order().limit()  -> {data, error}
//   update().eq()                        -> {error}
//   upsert(row, opts)                    -> {error}
function stubDb(opts: {
  rows: Record<string, Record<string, unknown>[]>;
  updateError?: string;
  /** rows returned by core.accounts_pending_resync — the balance sweep's priority pass */
  pendingResync?: Record<string, unknown>[];
}): { db: SupabaseClient; rec: Recorded } {
  const rec: Recorded = { rpcs: [], likes: [], updates: [], upserts: [], inserts: [] };
  const makeBuilder = (table: string) => {
    let op: "select" | "update" | "upsert" | "insert" = "select";
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
    b.like = chain((col, pattern) => {
      rec.likes.push({ table, column: col as string, pattern: pattern as string });
    });
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
    // The sweeps write evidence events with .insert() (blnk.balance_drift,
    // blnk.stuck_row, blnk.missing_mirror). Without this the call threw and the
    // sweep's own catch swallowed it into `errors`, so a test could see a
    // mirror corrected while the event proving it was never checked.
    b.insert = chain((row) => {
      op = "insert";
      rec.inserts.push({ table, row: row as Record<string, unknown> });
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
    schema: () => ({
      from: (t: string) => makeBuilder(t),
      // The balance sweep's priority pass. Defaults to empty so the existing
      // tests exercise the round-robin tail exactly as before; a test wanting
      // the priority pass supplies rows via opts.pendingResync.
      rpc: (fn: string, args: unknown) => {
        rec.rpcs.push({ fn, args });
        return Promise.resolve({ data: opts.pendingResync ?? [], error: null });
      },
    }),
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



Deno.test("card authorization live hold in sync: synced_at touched, nothing else", async () => {
  const { db, rec } = stubDb({
    rows: {
      card_authorization: [{ id: "auth_3", blnk_inflight_id: "txn_p" }],
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


Deno.test("card authorization: applied children sum into blnk_committed_amount and the recovery event is emitted", async () => {
  const { db, rec } = stubDb({
    rows: {
      card_authorization: [{ id: "auth_1", blnk_inflight_id: "txn_p" }],
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
  assertEquals(upd.patch.blnk_committed_amount, 500);

  // blnk_committed_amount is the one mirror on this row that IS read —
  // cards.ts sizes the remaining capture from it — so the recovery event now
  // reports the committed amount moving, not a ledger status nobody consumed.
  const evts = recoveryEvents(rec);
  assertEquals(evts.length, 1);
  assertEquals(evts[0].row.resource_id, "card_authorization:auth_1");
  assertEquals((evts[0].row.payload as Record<string, unknown>).to, "500");
});

Deno.test("card authorization: a VOID child is REPORTED, not guessed into a status", async () => {
  const { db, rec } = stubDb({
    rows: {
      card_authorization: [{ id: "auth_2", blnk_inflight_id: "txn_p", status: "authorized" }],
    },
  });
  const cfg = stubCfg({
    parent: { transaction_id: "txn_p", status: "INFLIGHT" },
    children: [{ transaction_id: "txn_c", status: "VOID" }],
  });
  const errors: SweepError[] = [];
  await sweepCardAuthorization(db, cfg, errors, () => {}, () => {});

  assertEquals(errors, []);
  // A void is a reversal or an expiry depending on who decided, and those are
  // different terminal states in a dispute. The sweep must not pick one.
  const released = rec.inserts.concat(rec.upserts.map((u) => ({ table: u.table, row: u.row })))
    .filter((i) => i.table === "event" && i.row.code === "blnk.hold_released_upstream");
  assertEquals(released.length, 1, "the divergence is emitted as an event");
  assertEquals(released[0].row.resource_id, "card_authorization:auth_2");
  const statusWrite = rec.updates.find((u) =>
    u.table === "card_authorization" && "status" in u.patch
  );
  assertEquals(statusWrite, undefined, "and no business status is invented");
});


// ---- inbox dead-letter cap ---------------------------------------------------
//
// sweepInbox re-drove every ('received','failed') row with no attempt cap, so a
// failure that can NEVER clear was retried every 5 minutes forever. Two July 2026
// test rows ran that way for three and a half weeks and each one permanently
// inflated the `failed` count behind blnk.inbox_backlog — the alarm decaying into
// noise exactly as the webhook cutover made real traffic start arriving.

/** Stub for sweepInbox's chains, incl. the head/count query and `.lt()`. */
function stubInboxDb(rows: Record<string, unknown>[], failedCount = 0): {
  db: SupabaseClient;
  rec: { updates: Record<string, unknown>[]; findings: Record<string, unknown>[]; statusFilters: unknown[][] };
} {
  const rec = {
    updates: [] as Record<string, unknown>[],
    findings: [] as Record<string, unknown>[],
    statusFilters: [] as unknown[][],
  };
  const makeBuilder = (table: string) => {
    let op: "select" | "update" | "upsert" = "select";
    let isCount = false;
    let patch: Record<string, unknown> = {};
    // deno-lint-ignore no-explicit-any
    const b: any = {};
    const chain = (fn?: (...args: unknown[]) => void) => (...args: unknown[]) => {
      fn?.(...args);
      return b;
    };
    b.select = chain((_cols, o) => {
      if ((o as { head?: boolean } | undefined)?.head) isCount = true;
    });
    b.in = chain((col, vs) => {
      if (col === "status") rec.statusFilters.push(vs as unknown[]);
    });
    b.lt = chain();
    b.order = chain();
    b.limit = chain();
    b.eq = chain();
    b.update = chain((p) => {
      op = "update";
      patch = p as Record<string, unknown>;
    });
    b.upsert = chain((row) => {
      op = "upsert";
      if (table === "finding") rec.findings.push(row as Record<string, unknown>);
    });
    b.insert = chain();
    b.then = (onFul: (v: unknown) => unknown, onRej?: (e: unknown) => unknown) => {
      let result: unknown;
      if (op === "select") {
        result = isCount
          ? { count: failedCount, error: null }
          : { data: table === "blnk_event" ? rows : [], error: null };
      } else if (op === "update") {
        if (table === "blnk_event") rec.updates.push(patch);
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

// balance.monitor with no balance_id throws inside dispatch — a deterministic,
// permanently-unresolvable failure, which is exactly the shape the cap is for.
const unresolvable = (attempts: number) => ({
  id: "evt_1",
  event: "balance.monitor",
  payload: { event: "balance.monitor", data: {} },
  status: "failed",
  attempts,
});

Deno.test("inbox: a failure below the cap stays retryable and counts an attempt", async () => {
  const { db, rec } = stubInboxDb([unresolvable(INBOX_MAX_ATTEMPTS - 2)]);
  const errors: SweepError[] = [];
  await sweepInbox(db, errors, () => {}, () => {});

  assertEquals(rec.updates[0].status, "failed");
  assertEquals(rec.updates[0].attempts, INBOX_MAX_ATTEMPTS - 1);
  assertEquals(rec.findings.length, 0, "no finding until the row is actually parked");
});

Deno.test("inbox: the last attempt parks the row as dead_letter and opens a finding", async () => {
  const { db, rec } = stubInboxDb([unresolvable(INBOX_MAX_ATTEMPTS - 1)]);
  const errors: SweepError[] = [];
  await sweepInbox(db, errors, () => {}, () => {});

  assertEquals(rec.updates[0].status, "dead_letter");
  assertEquals(rec.updates[0].attempts, INBOX_MAX_ATTEMPTS);
  assertEquals(rec.findings.length, 1, "parking a delivery must leave an owner");
  assertEquals(rec.findings[0].root_cause, "blnk_inbox_dead_letter");
  assertEquals(rec.findings[0].severity, "high");
});

Deno.test("inbox: an unusable payload counts an attempt instead of being skipped forever", async () => {
  // This branch used to `continue` without touching the row, so it was re-swept
  // and re-skipped on every run for as long as the row existed.
  const { db, rec } = stubInboxDb([{
    id: "evt_bad",
    event: "transaction.applied",
    payload: null,
    status: "failed",
    attempts: 0,
  }]);
  const errors: SweepError[] = [];
  await sweepInbox(db, errors, () => {}, () => {});

  assertEquals(rec.updates.length, 1, "an unusable row must be recorded, not silently skipped");
  assertEquals(rec.updates[0].attempts, 1);
});

Deno.test("inbox: dead_letter is terminal — the sweep never picks it back up", async () => {
  const { db, rec } = stubInboxDb([]);
  const errors: SweepError[] = [];
  await sweepInbox(db, errors, () => {}, () => {});

  const swept = rec.statusFilters[0];
  assertEquals(swept, ["received", "failed"]);
  assertEquals(
    swept.includes("dead_letter"),
    false,
    "re-sweeping dead_letter would restore the forever-retry the cap removes",
  );
});

Deno.test("inbox: the backlog alarm counts parked rows too", async () => {
  // Parking stops the churn; it does not mean the delivery arrived. If the cap
  // removed rows from the count it would hide the very backlog it makes legible.
  const { db, rec } = stubInboxDb([], INBOX_FAILED_ALERT_THRESHOLD);
  const errors: SweepError[] = [];
  await sweepInbox(db, errors, () => {}, () => {});

  const countFilter = rec.statusFilters[rec.statusFilters.length - 1];
  assertEquals(countFilter, ["failed", "dead_letter"]);
});

// ---- drift sweep ignores fixture balance ids ---------------------------------
//
// The drill seeds live ptnr_drill accounts with placeholder blnk_balance_ids —
// "b" (drill/firers.ts, the account.closed firer) and "bal_1".."bal_l"
// (drill/cases.ts). They cannot be nulled out, because api/wires.ts rejects an
// account whose blnk_balance_id is null. Selecting on "is not null" therefore
// dragged all 22 into the sweep as permanent GET /balances 404s, re-run every
// 5 minutes and growing with every drill run — the same channel-flooding that
// made the inbox backlog alarm meaningless.

Deno.test("balance drift: only ids Blnk could have issued are swept", async () => {
  const { db, rec } = stubDb({ rows: {} });
  const errors: SweepError[] = [];
  await sweepBalances(db, {} as BlnkConfig, errors, () => {}, () => {});

  const f = rec.likes.find((l) => l.table === "account");
  assertExists(f, "the drift sweep must constrain blnk_balance_id by prefix");
  assertEquals(f.column, "blnk_balance_id");
  assertEquals(f.pattern, `${BLNK_BALANCE_ID_PREFIX}%`);
});

// The FBO position is a roll-up of these balances (20260817000100), so an
// account that moved since its last sync is not a stale display value — it is
// the position being wrong. Round-robin alone gave those a ~6.4h worst case
// (25 rows / 5 min against 1,907 accounts). The priority pass is what makes it
// one run, and this pins that it actually preempts rather than appends.
Deno.test("balance drift: moved-since-sync accounts preempt the round-robin", async () => {
  const moved = [{ id: "acct_moved", balance: 100, blnk_balance_id: "bln_moved" }];
  const { db, rec } = stubDb({ rows: {}, pendingResync: moved });
  const errors: SweepError[] = [];
  let swept = 0;
  let drifted = 0;
  // The ledger says 250; the mirror says 100. The position is therefore wrong
  // by 150 until this sweep runs.
  const balanceCfg = {
    apiUrl: "https://blnk.test",
    apiKey: "k",
    fetchFn: () =>
      Promise.resolve(
        new Response(JSON.stringify({ balance: 250 }), {
          headers: { "content-type": "application/json" },
        }),
      ),
  } as unknown as BlnkConfig;
  await sweepBalances(db, balanceCfg, errors, (n) => swept += n, () => drifted++);

  const call = rec.rpcs.find((r) => r.fn === "accounts_pending_resync");
  assertExists(call, "the sweep must ask which accounts moved since their sync");
  assertEquals(swept, 1, "the moved account is swept");
  const upd = rec.updates.find((u) => u.table === "account" && u.id === "acct_moved");
  assertExists(upd, "and its mirror is the one refreshed");
  assertEquals(upd.patch.balance, 250, "corrected to what the ledger says");
  assertEquals(drifted, 1, "and the correction is reported as drift, not silently applied");
  assertEquals(errors.length, 0);
});

Deno.test("balance drift: the drill's placeholder ids cannot match that filter", () => {
  // Pins the actual literals in drill/firers.ts and drill/cases.ts, so a future
  // fixture that happens to start with bln_ fails here rather than silently
  // rejoining the sweep.
  for (const fixture of ["b", "bal_1", "bal_6", "bal_1b", "bal_l"]) {
    assertEquals(
      fixture.startsWith(BLNK_BALANCE_ID_PREFIX),
      false,
      `${fixture} must not look like a Blnk-issued balance id`,
    );
  }
  assertEquals("bln_feb66ca7-2808-41c5-93e2-b366f158b77f".startsWith(BLNK_BALANCE_ID_PREFIX), true);
});
