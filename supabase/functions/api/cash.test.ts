// Cash + CTR (BSA-08).
//
// The load-bearing property here is not "does the threshold fire" — it is what
// happens to currency that CANNOT be attributed to a person. Legacy accounts
// have no owner and cannot be truthfully backfilled, so aggregation has to
// handle unknowns. Silently dropping them understates the aggregate and hides
// CTRs that were owed; silently bucketing each as its own person makes every
// unlinked account look like a separate individual under the threshold, which
// is structuring by accident.
//
// Both are the same failure as fabricating the entity link: turning "we do not
// know" into a confident wrong answer. Roughly half this file drives that case.
import { assert, assertEquals } from "jsr:@std/assert@1";
import {
  aggregateDay,
  crossesThreshold,
  CTR_THRESHOLD_CENTS,
  ctrDueAt,
  getCashAggregation,
  postCashTransaction,
  postCtrFile,
  postCtrSweep,
} from "./cash.ts";
import { type Any, OPS_CTX, req, TEST_CTX } from "./test_helpers.ts";

function cashDb(rows: Record<string, Record<string, unknown>[]>) {
  const writes: { schema: string; table: string; op: string; row: Any }[] = [];
  let schema = "core";
  const from = (table: string) => {
    const filters: { col: string; val: unknown }[] = [];
    const chain: Any = {
      select: () => chain,
      eq: (col: string, val: unknown) => (filters.push({ col, val }), chain),
      is: (col: string, val: unknown) => (filters.push({ col, val }), chain),
      lt: () => chain,
      order: () => chain,
      limit: () => chain,
      insert: (row: Any) => {
        writes.push({ schema, table, op: "insert", row });
        return Promise.resolve({ error: null });
      },
      upsert: (row: Any) => {
        writes.push({ schema, table, op: "upsert", row });
        return Promise.resolve({ error: null });
      },
      update: (patch: Any) => {
        writes.push({ schema, table, op: "update", row: patch });
        const p: Any = Promise.resolve({ error: null });
        p.eq = () => p;
        return p;
      },
      maybeSingle: () => {
        const src = rows[table] ?? [];
        return Promise.resolve({
          data: src.find((r) => filters.every((f) => r[f.col] === f.val)) ?? null,
          error: null,
        });
      },
      then: (res: (v: unknown) => unknown) => {
        const src = rows[table] ?? [];
        return res({
          data: src.filter((r) =>
            filters.every((f) => f.val === null ? r[f.col] == null : r[f.col] === f.val)
          ),
          error: null,
        });
      },
    };
    return chain;
  };
  const db: Any = { schema: (s: string) => (schema = s, { from }) };
  return { db, writes };
}

const DAY = "2026-07-19";
const linkedAccount = { id: "acct_1", entity_id: "ent_1" };
const unlinkedAccount = { id: "acct_legacy", entity_id: null };

const txn = (o: Record<string, unknown>) => ({
  id: "cash_x", direction: "cash_in", amount: 100, entity_id: "ent_1",
  business_date: DAY, ...o,
});

// ---------------------------------------------------------- the arithmetic

Deno.test("cash-in and cash-out are aggregated SEPARATELY, never summed", () => {
  // $6k in and $6k out is not a $12k reportable event. Summing them would
  // manufacture a CTR obligation that does not exist.
  const { attributed } = aggregateDay([
    txn({ id: "a", direction: "cash_in", amount: 600_000 }),
    txn({ id: "b", direction: "cash_out", amount: 600_000 }),
  ]);
  assertEquals(attributed.ent_1.cash_in, 600_000);
  assertEquals(attributed.ent_1.cash_out, 600_000);
  assertEquals(crossesThreshold(attributed.ent_1), false);
});

Deno.test("the threshold is ABOVE $10,000, not at it", () => {
  assertEquals(crossesThreshold({ cash_in: CTR_THRESHOLD_CENTS, cash_out: 0 }), false);
  assertEquals(crossesThreshold({ cash_in: CTR_THRESHOLD_CENTS + 1, cash_out: 0 }), true);
  // either direction alone is enough
  assertEquals(crossesThreshold({ cash_in: 0, cash_out: CTR_THRESHOLD_CENTS + 1 }), true);
});

Deno.test("the filing deadline is 15 calendar days from the BUSINESS date", () => {
  assertEquals(ctrDueAt("2026-07-19").slice(0, 10), "2026-08-03");
  // month boundary
  assertEquals(ctrDueAt("2026-12-20").slice(0, 10), "2027-01-04");
});

// ------------------------------ the unattributable case (the whole point)

Deno.test("unattributable currency is COUNTED, not dropped from the aggregate", () => {
  const { attributed, unattributable } = aggregateDay([
    txn({ id: "a", amount: 400_000 }),
    txn({ id: "b", amount: 900_000, entity_id: null }),
  ]);
  assertEquals(attributed.ent_1.cash_in, 400_000);
  // dropping this would understate the day by $9,000 and could hide a CTR
  assertEquals(unattributable.cash_in, 900_000);
  assertEquals(unattributable.ids, ["b"]);
});

Deno.test("unattributable rows are NOT each bucketed as their own person", () => {
  // Three unlinked transactions of $9k each. Bucketed individually every one
  // sits under the threshold and nothing fires — structuring by accident.
  const { attributed, unattributable } = aggregateDay([
    txn({ id: "a", amount: 900_000, entity_id: null }),
    txn({ id: "b", amount: 900_000, entity_id: null }),
    txn({ id: "c", amount: 900_000, entity_id: null }),
  ]);
  assertEquals(Object.keys(attributed).length, 0, "no synthetic identities may be invented");
  assertEquals(unattributable.cash_in, 2_700_000);
  assertEquals(unattributable.ids.length, 3);
});

Deno.test("recording currency against an unlinked account warns and raises an alert", async () => {
  const { db, writes } = cashDb({ account: [unlinkedAccount] });
  const res = await postCashTransaction(
    req({ direction: "cash_in", amount_cents: 500_000, business_date: DAY, account_id: "acct_legacy" }),
    db, "c1", OPS_CTX,
  );
  assertEquals(res.status, 201);
  const b = await res.json();
  assertEquals(b.attributable, false);
  assertEquals(b.entity_id, null);
  assert(b.warning.includes("UNATTRIBUTABLE"), "the response must say so, not just a log line");
  assertEquals(b.ctr, null, "no CTR determination is possible for unattributable currency");
  // and it is a finding, not a data-entry nit
  const alert = writes.find((w) => w.table === "bsa_alert");
  assertEquals(alert?.row.alert_type, "unattributable_cash");
});

Deno.test("the transaction is still RECORDED even though it cannot be attributed", async () => {
  // Refusing it would be the third wrong answer: the currency really moved.
  const { db, writes } = cashDb({ account: [unlinkedAccount] });
  await postCashTransaction(
    req({ direction: "cash_out", amount_cents: 700_000, business_date: DAY, account_id: "acct_legacy" }),
    db, "c2", OPS_CTX,
  );
  const rec = writes.find((w) => w.table === "cash_transaction");
  assertEquals(rec?.row.amount, 700_000);
  assertEquals(rec?.row.entity_id, null);
});

Deno.test("a day containing unattributable currency is reported INCOMPLETE", async () => {
  const { db } = cashDb({
    cash_transaction: [
      txn({ id: "a", amount: 400_000 }),
      txn({ id: "b", amount: 900_000, entity_id: null }),
    ],
  });
  const res = await getCashAggregation(
    new Request(`https://x/cash/aggregation?business_date=${DAY}`), db, "c3", OPS_CTX,
  );
  const b = await res.json();
  assertEquals(b.complete, false);
  assertEquals(b.unattributable.cash_in, 900_000);
  assertEquals(b.unattributable.transaction_count, 1);
  assert(
    b.warning.includes("lower bound"),
    "per-person totals must be labelled a lower bound when the day is incomplete",
  );
});

Deno.test("a fully attributed day reports complete, with no warning", async () => {
  const { db } = cashDb({ cash_transaction: [txn({ id: "a", amount: 400_000 })] });
  const b = await (await getCashAggregation(
    new Request(`https://x/cash/aggregation?business_date=${DAY}`), db, "c4", OPS_CTX,
  )).json();
  assertEquals(b.complete, true);
  assertEquals(b.warning, undefined);
  assertEquals(b.people[0].entity_id, "ent_1");
});

// ------------------------------------------------------ CTR determination

Deno.test("crossing the threshold opens a CTR with a 15-day clock", async () => {
  const { db, writes } = cashDb({
    account: [linkedAccount],
    cash_transaction: [txn({ id: "a", amount: 900_000 }), txn({ id: "b", amount: 200_000 })],
  });
  const res = await postCashTransaction(
    req({ direction: "cash_in", amount_cents: 200_000, business_date: DAY, account_id: "acct_1" }),
    db, "c5", OPS_CTX,
  );
  assertEquals(res.status, 201);
  const b = await res.json();
  assertEquals(b.attributable, true);
  assertEquals(b.ctr.id, `ctr_ent_1_${DAY}`);
  assertEquals(b.ctr.filing_due_at.slice(0, 10), "2026-08-03");
  const codes = writes.filter((w) => w.table === "event").map((w) => w.row.code);
  assert(codes.includes("ctr.threshold.reached"), "BSA-08's declared trigger");
  assert(codes.includes("ctr.filing.timer"));
});

Deno.test("an aggregate that stays under the threshold opens no CTR", async () => {
  const { db, writes } = cashDb({
    account: [linkedAccount],
    cash_transaction: [txn({ id: "a", amount: 400_000 })],
  });
  const b = await (await postCashTransaction(
    req({ direction: "cash_in", amount_cents: 400_000, business_date: DAY, account_id: "acct_1" }),
    db, "c6", OPS_CTX,
  )).json();
  assertEquals(b.ctr, null);
  assertEquals(writes.filter((w) => w.table === "ctr_filing").length, 0);
});

Deno.test("the CTR id is deterministic per person per day — a second crossing amends", async () => {
  const { db, writes } = cashDb({
    account: [linkedAccount],
    cash_transaction: [txn({ id: "a", amount: 1_100_000 })],
  });
  await postCashTransaction(
    req({ direction: "cash_in", amount_cents: 100_000, business_date: DAY, account_id: "acct_1" }),
    db, "c7", OPS_CTX,
  );
  const ctr = writes.find((w) => w.table === "ctr_filing")!;
  assertEquals(ctr.row.id, `ctr_ent_1_${DAY}`);
  assertEquals(ctr.op, "upsert", "a second crossing must amend, not duplicate");
});

// -------------------------------------------------------------- filing

Deno.test("filing without a FinCEN reference is refused", async () => {
  // A CTR marked filed with no reference is worse than an unfiled one: it stops
  // the overdue sweep from ever finding it.
  const { db, writes } = cashDb({
    ctr_filing: [{ id: "ctr_1", entity_id: "ent_1", business_date: DAY, filing_due_at: "2026-08-03T00:00:00Z", filed_at: null }],
  });
  const res = await postCtrFile(req({ filed_by: "bsa-officer" }), "ctr_1", db, "f1", OPS_CTX);
  assertEquals(res.status, 400);
  assertEquals((await res.json()).errors[0].field, "fincen_ref");
  assertEquals(writes.length, 0);
});

Deno.test("a LATE filing succeeds but is recorded as late", async () => {
  const { db, writes } = cashDb({
    ctr_filing: [{ id: "ctr_1", entity_id: "ent_1", business_date: DAY, filing_due_at: "2020-01-01T00:00:00Z", filed_at: null }],
  });
  const res = await postCtrFile(
    req({ filed_by: "bsa-officer", fincen_ref: "BSA-123" }), "ctr_1", db, "f2", OPS_CTX,
  );
  assertEquals(res.status, 200);
  assertEquals((await res.json()).filed_late, true);
  assertEquals(writes.find((w) => w.table === "event")!.row.payload.late, true);
});

Deno.test("re-filing replays rather than filing twice", async () => {
  const { db, writes } = cashDb({
    ctr_filing: [{ id: "ctr_1", entity_id: "ent_1", business_date: DAY, filing_due_at: "2026-08-03T00:00:00Z", filed_at: "2026-07-25T00:00:00Z" }],
  });
  const res = await postCtrFile(
    req({ filed_by: "x", fincen_ref: "y" }), "ctr_1", db, "f3", OPS_CTX,
  );
  assertEquals(res.headers.get("Idempotent-Replayed"), "true");
  assertEquals(writes.length, 0);
});

// ------------------------------------------- the negatives: the sweep

Deno.test("the sweep surfaces a CTR that was owed and nobody filed", async () => {
  // Nothing happened — that is why it needs a sweep to be visible at all.
  const { db, writes } = cashDb({
    ctr_filing: [{ id: "ctr_1", entity_id: "ent_1", business_date: DAY, filing_due_at: "2020-01-01T00:00:00Z", filed_at: null }],
    cash_transaction: [],
  });
  const b = await (await postCtrSweep(req({}), db, "s1", OPS_CTX)).json();
  assertEquals(b.overdue_count, 1);
  assertEquals(writes.find((w) => w.table === "event")!.row.code, "ctr.filing_overdue");
});

Deno.test("the sweep also reports unattributable currency as a standing gap", async () => {
  // A day with unassignable cash may be concealing a CTR obligation that was
  // never even DETECTED — a breach nobody can enumerate.
  const { db } = cashDb({
    ctr_filing: [],
    cash_transaction: [
      txn({ id: "u1", amount: 900_000, entity_id: null }),
      txn({ id: "u2", amount: 800_000, entity_id: null }),
    ],
  });
  const b = await (await postCtrSweep(req({}), db, "s2", OPS_CTX)).json();
  assertEquals(b.unattributable_transactions, 2);
  assertEquals(b.unattributable_cents, 1_700_000);
});

Deno.test("breach event ids are deterministic — repeated sweeps do not pile up", async () => {
  const mk = async () => {
    const { db, writes } = cashDb({
      ctr_filing: [{ id: "ctr_1", entity_id: "e", business_date: DAY, filing_due_at: "2020-01-01T00:00:00Z", filed_at: null }],
      cash_transaction: [],
    });
    await postCtrSweep(req({}), db, "s3", OPS_CTX);
    return writes.find((w) => w.table === "event")!.row.id;
  };
  assertEquals(await mk(), await mk());
});

// ------------------------------------------------------------ validation

Deno.test("business_date is required and must be a date, not a timestamp", async () => {
  const { db, writes } = cashDb({ account: [linkedAccount] });
  for (const bad of [undefined, "2026-07-19T10:00:00Z", "19/07/2026", ""]) {
    const res = await postCashTransaction(
      req({ direction: "cash_in", amount_cents: 100, account_id: "acct_1", business_date: bad }),
      db, "v1", OPS_CTX,
    );
    assertEquals(res.status, 400, `business_date=${bad} must be refused`);
  }
  assertEquals(writes.length, 0);
});

Deno.test("currency with neither an account nor an entity is refused", async () => {
  const { db } = cashDb({});
  const res = await postCashTransaction(
    req({ direction: "cash_in", amount_cents: 100, business_date: DAY }), db, "v2", OPS_CTX,
  );
  assertEquals(res.status, 400);
});

Deno.test("a partner cannot reach cash at all", async () => {
  const { db, writes } = cashDb({ account: [linkedAccount] });
  for (
    const [name, res] of [
      ["record", await postCashTransaction(req({ direction: "cash_in", amount_cents: 100, business_date: DAY, account_id: "acct_1" }), db, "p1", TEST_CTX)],
      ["aggregate", await getCashAggregation(new Request(`https://x/?business_date=${DAY}`), db, "p2", TEST_CTX)],
      ["file", await postCtrFile(req({ filed_by: "a", fincen_ref: "b" }), "ctr_1", db, "p3", TEST_CTX)],
      ["sweep", await postCtrSweep(req({}), db, "p4", TEST_CTX)],
    ] as [string, Response][]
  ) {
    assertEquals(res.status, 404, `${name} must be invisible to a partner`);
  }
  assertEquals(writes.length, 0);
});

// ------------------------------------------------------- the sim substrate

Deno.test("multi-day structuring history lives in sim — it cannot be waited out", async () => {
  const { db, writes } = cashDb({ account: [linkedAccount], cash_transaction: [] });
  await postCashTransaction(
    req({ direction: "cash_in", amount_cents: 100, business_date: DAY, account_id: "acct_1" }),
    db, "sim1", OPS_CTX, "sim",
  );
  assert(writes.length > 0);
  for (const w of writes) {
    assertEquals(w.schema, "sim", `${w.table} escaped into ${w.schema}`);
    if (w.op !== "update") assertEquals(w.row.provenance, "simulated");
  }
});

Deno.test("the core path never writes into sim", async () => {
  const { db, writes } = cashDb({ account: [linkedAccount], cash_transaction: [] });
  await postCashTransaction(
    req({ direction: "cash_in", amount_cents: 100, business_date: DAY, account_id: "acct_1" }),
    db, "sim2", OPS_CTX,
  );
  for (const w of writes) {
    assertEquals(w.schema, "core");
    if (w.op !== "update") assertEquals(w.row.provenance, "production");
  }
});
