// Unit + behavioral tests for the ACH writer.
//
// The settle/return split is the part worth pinning down: both resolve the same
// inflight hold but in opposite directions, and getting them backwards would
// move money on a returned entry — a failure the compliance harness would only
// catch if it happened to assert balances.
import { assertEquals } from "jsr:@std/assert@1";
import { postAch, postAchReturn, postAchSettle } from "./ach.ts";
import { type Any, json, req, reqWithoutIdempotencyKey, stubCfg, stubDb } from "./test_helpers.ts";

const HELD = {
  id: "ach_1",
  amount: 250000,
  status: "submitted",
  counterparty: { name: "Acme Vendor" },
  window: "next_day",
  blnk_transaction_id: "txn_held",
  blnk_reference: "ach_transfer:ach_1",
  blnk_status: "INFLIGHT",
  created_at: "2026-07-18T00:00:00Z",
};

const applied = () => json({ transaction_id: "txn_held", reference: "ach_transfer:ach_1", status: "APPLIED" });
const voided = () => json({ transaction_id: "txn_held", reference: "ach_transfer:ach_1", status: "VOID" });

// ----------------------------------------------------------------- unit level

Deno.test("submit requires an Idempotency-Key", async () => {
  const { cfg } = stubCfg([]);
  const { db } = stubDb(null);
  const res = await postAch(reqWithoutIdempotencyKey({}), db, cfg, "r1");
  assertEquals(res.status, 400);
  assertEquals((await res.json()).type, "idempotency_key_required");
});

Deno.test("submit rejects a missing source_account_id", async () => {
  const { cfg } = stubCfg([]);
  const { db } = stubDb(null);
  const res = await postAch(req({ amount_cents: 1000, counterparty: {} }), db, cfg, "r2");
  assertEquals(res.status, 400);
  const b = await res.json();
  assertEquals(b.type, "validation_error");
  assertEquals(b.errors.some((e: Any) => e.field === "source_account_id"), true);
});

Deno.test("submit rejects non-positive / non-integer amounts", async () => {
  const { cfg } = stubCfg([]);
  for (const amount of [0, -5, 10.5]) {
    const { db } = stubDb(null);
    const res = await postAch(
      req({ source_account_id: "a1", amount_cents: amount, counterparty: {} }),
      db, cfg, "r3",
    );
    assertEquals(res.status, 400, `amount ${amount} must be rejected`);
  }
});

Deno.test("submit rejects a settlement window outside the allowed set", async () => {
  const { cfg } = stubCfg([]);
  const { db } = stubDb(null);
  const res = await postAch(
    req({ source_account_id: "a1", amount_cents: 1000, counterparty: {}, window: "whenever" }),
    db, cfg, "r4",
  );
  assertEquals(res.status, 400);
  const b = await res.json();
  assertEquals(b.errors.some((e: Any) => e.field === "window"), true);
});

Deno.test("submit requires counterparty to be an object, not a scalar", async () => {
  const { cfg } = stubCfg([]);
  for (const bad of ["Acme", 7, ["a"]]) {
    const { db } = stubDb(null);
    const res = await postAch(
      req({ source_account_id: "a1", amount_cents: 1000, counterparty: bad }),
      db, cfg, "r5",
    );
    assertEquals(res.status, 400, `counterparty ${JSON.stringify(bad)} must be rejected`);
  }
});

// ----------------------------------------------------------- behavioral level

Deno.test("settle COMMITS the hold and moves submitted -> settled", async () => {
  const { cfg, sent } = stubCfg([applied()]);
  const { db, updates } = stubDb(HELD);

  const res = await postAchSettle(req(), "ach_1", db, cfg, "r6");
  assertEquals(res.status, 200);
  assertEquals((await res.json()).status, "settled");
  assertEquals(sent[0].method, "PUT");
  assertEquals((sent[0].body as Any).status, "commit");
  assertEquals(updates.at(-1)?.status, "settled");
});

Deno.test("return VOIDS the hold and moves submitted -> returned", async () => {
  const { cfg, sent } = stubCfg([voided()]);
  const { db, updates } = stubDb(HELD);

  const res = await postAchReturn(req({ return_reason: "R01" }), "ach_1", db, cfg, "r7");
  assertEquals(res.status, 200);
  assertEquals((await res.json()).status, "returned");
  // opposite direction from settle — money must NOT move on a return
  assertEquals((sent[0].body as Any).status, "void");
  assertEquals(updates.at(-1)?.status, "returned");
});

Deno.test("return retains the reason code on the row", async () => {
  const { cfg } = stubCfg([voided()]);
  const { db, updates } = stubDb(HELD);
  await postAchReturn(req({ return_reason: "R02" }), "ach_1", db, cfg, "r8");
  assertEquals(String(updates.at(-1)?.window).includes("R02"), true);
});

Deno.test("return rejects a blank reason code rather than storing junk", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db } = stubDb(HELD);
  const res = await postAchReturn(req({ return_reason: "" }), "ach_1", db, cfg, "r9");
  assertEquals(res.status, 400);
  assertEquals(sent.length, 0);
});

Deno.test("re-settling an already-settled entry replays, never double-commits", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db } = stubDb({ ...HELD, status: "settled" });

  const res = await postAchSettle(req(), "ach_1", db, cfg, "r10");
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("Idempotent-Replayed"), "true");
  assertEquals(sent.length, 0, "duplicate settlement notifications must be safe");
});

Deno.test("settling a returned entry is a 409 — money must not move after a return", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db } = stubDb({ ...HELD, status: "returned" });

  const res = await postAchSettle(req(), "ach_1", db, cfg, "r11");
  assertEquals(res.status, 409);
  assertEquals((await res.json()).type, "invalid_state");
  assertEquals(sent.length, 0);
});

Deno.test("resolving an entry with no hold is a 409, not a crash", async () => {
  const { cfg } = stubCfg([]);
  const { db } = stubDb({ ...HELD, blnk_transaction_id: null });
  const res = await postAchSettle(req(), "ach_1", db, cfg, "r12");
  assertEquals(res.status, 409);
  assertEquals((await res.json()).type, "not_held");
});

Deno.test("resolving an unknown entry is a 404", async () => {
  const { cfg } = stubCfg([]);
  const { db } = stubDb(null);
  assertEquals((await postAchSettle(req(), "nope", db, cfg, "r13")).status, 404);
});

// --------------------------------------------- post-settlement return (R01)
// Card 34's done criteria requires SUBMITTED -> SETTLED -> RETURNED. An ACH
// return routinely arrives days after settlement (R01, unauthorized debit), so
// 'settled' must be a valid starting point for a return. It cannot be a void:
// the hold is already committed and the money has moved, so it needs a
// compensating entry in the opposite direction.

const SETTLED = {
  ...HELD,
  status: "settled",
  originator: { account_id: "acct_src" },
  blnk_status: "APPLIED",
};

function dbWithAccount(row: unknown) {
  const updates: Record<string, unknown>[] = [];
  const upserts: { table: string; row: Record<string, unknown>; opts?: unknown }[] = [];
  let currentTable = "";
  const chain: Any = {
    select: () => chain,
    eq: () => chain,
    update: (p: Record<string, unknown>) => { updates.push(p); return chain; },
    insert: () => Promise.resolve({ data: null, error: null }),
    upsert: (row: Record<string, unknown>, opts?: unknown) => {
      upserts.push({ table: currentTable, row, opts });
      return Promise.resolve({ data: null, error: null });
    },
    maybeSingleQueue: [] as unknown[],
    // mirror the real .update(...).select().single(): return the UPDATED row,
    // not the stale one, or the response body lags the persisted state
    single: () =>
      Promise.resolve({
        data: { ...(row as Record<string, unknown>), ...Object.assign({}, ...updates) },
        error: null,
      }),
    then: (r: (v: unknown) => unknown) => r({ data: [], error: null }),
  };
  let call = 0;
  chain.maybeSingle = () => {
    call += 1;
    // first lookup is the ach row, second is the originating account
    return Promise.resolve({
      data: call === 1 ? row : { id: "acct_src", blnk_balance_id: "bln_src" },
      error: null,
    });
  };
  const db: Any = {
    schema: () => ({
      from: (table: string) => {
        currentTable = table;
        return chain;
      },
    }),
  };
  return { db, updates, upserts };
}

Deno.test("a settled entry CAN be returned — returns arrive days later", async () => {
  const { cfg, sent } = stubCfg([
    json({ transaction_id: "txn_reversal", reference: "ach_transfer:ach_1:return", status: "APPLIED" }),
  ]);
  const { db, updates } = dbWithAccount(SETTLED);

  const res = await postAchReturn(req({ return_reason: "R01" }), "ach_1", db, cfg, "pr1");
  assertEquals(res.status, 200);
  assertEquals((await res.json()).status, "returned");
  assertEquals(updates.at(-1)?.status, "returned");
});

Deno.test("a post-settlement return REVERSES rather than voiding", async () => {
  const { cfg, sent } = stubCfg([
    json({ transaction_id: "txn_reversal", reference: "ach_transfer:ach_1:return", status: "APPLIED" }),
  ]);
  const { db } = dbWithAccount(SETTLED);

  await postAchReturn(req({ return_reason: "R01" }), "ach_1", db, cfg, "pr2");

  // a new transaction, not a PUT against the committed hold
  const call = sent[0];
  assertEquals(call.method, "POST");
  assertEquals(call.url.endsWith("/transactions"), true);
  // money flows back FROM the network TO the member
  assertEquals((call.body as Any).source, "@ACHNetwork");
  assertEquals((call.body as Any).destination, "bln_src");
  assertEquals((call.body as Any).inflight, false);
  // ':return' leg keeps it distinct from the original entry's reference
  assertEquals((call.body as Any).reference, "ach_transfer:ach_1:return");
});

Deno.test("settling is still refused once returned", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db } = stubDb({ ...HELD, status: "returned" });
  assertEquals((await postAchSettle(req(), "ach_1", db, cfg, "pr3")).status, 409);
  assertEquals(sent.length, 0);
});

// ------------------------------------- movement artifacts (card-31 follow-up)
// Money moves on settle (commit) and on a post-settlement return (compensating
// reversal). A pre-settlement return voids the hold — nothing moved, nothing
// to book.

const HELD_WITH_ORIGINATOR = { ...HELD, originator: { account_id: "acct_src" } };

Deno.test("ach settle writes bookkeeping + ach_transfer.settled event", async () => {
  const { cfg } = stubCfg([applied()]);
  const { db, upserts } = stubDb(HELD_WITH_ORIGINATOR);

  await postAchSettle(req(), "ach_1", db, cfg, "aa1");
  const bke = upserts.find((u) => u.table === "bookkeeping_entry");
  assertEquals(bke?.row.id, "bke_ach_1_settled");
  assertEquals(bke?.row.amount, 250000);
  const evt = upserts.find((u) => u.table === "event");
  assertEquals(evt?.row.id, "evt_ach_1_settled");
  assertEquals(evt?.row.code, "ach_transfer.settled");
  assertEquals((evt?.opts as Any)?.ignoreDuplicates, true);
});

Deno.test("a pre-settlement return voids the hold and books nothing", async () => {
  const { cfg } = stubCfg([voided()]);
  const { db, upserts } = stubDb(HELD_WITH_ORIGINATOR);

  await postAchReturn(req({ return_reason: "R01" }), "ach_1", db, cfg, "aa2");
  assertEquals(upserts.length, 0, "no money moved; the row's returned status is the record");
});

Deno.test("a post-settlement return writes reversal artifacts", async () => {
  const { cfg } = stubCfg([
    json({ transaction_id: "txn_reversal", reference: "ach_transfer:ach_1:return", status: "APPLIED" }),
  ]);
  const { db, upserts } = dbWithAccount(SETTLED);

  await postAchReturn(req({ return_reason: "R01" }), "ach_1", db, cfg, "aa3");
  const bke = upserts.find((u) => u.table === "bookkeeping_entry");
  assertEquals(bke?.row.id, "bke_ach_1_returned");
  assertEquals(bke?.row.amount, 250000);
  const evt = upserts.find((u) => u.table === "event");
  assertEquals(evt?.row.id, "evt_ach_1_returned");
  assertEquals(evt?.row.code, "ach_transfer.returned");
  assertEquals((evt?.row.payload as Any).reason, "R01");
});
