// Unit + behavioral tests for GET /control-results (card 47).
//
// The inline half of card 47 has existed since the gate was built — every
// money-movement response carries control_results. This is the other half: the
// standalone query surface an examiner or ops dashboard reads WITHOUT
// replaying transactions. Level 3 cross-checks the endpoint against the
// database and against inline results in the harness.
import { assertEquals } from "jsr:@std/assert@1";
import { getControlResults } from "./controls.ts";
import { type Any } from "./test_helpers.ts";

const ROW = {
  id: "cr_1",
  control_id: "CG-VEL-01",
  decision: "block",
  event: "tr_1",
  subject_ref: "acct_src",
  score: null,
  created_at: "2026-07-19T00:00:00Z",
};

/** Chain fake that records every query-builder call so filters are assertable. */
function stubQueryDb(rows: unknown[]) {
  const calls: { fn: string; args: unknown[] }[] = [];
  const chain: Any = {
    select: (...args: unknown[]) => (calls.push({ fn: "select", args }), chain),
    eq: (...args: unknown[]) => (calls.push({ fn: "eq", args }), chain),
    order: (...args: unknown[]) => (calls.push({ fn: "order", args }), chain),
    limit: (...args: unknown[]) => (calls.push({ fn: "limit", args }), chain),
    then: (res: (v: unknown) => unknown) => res({ data: rows, error: null }),
  };
  const db: Any = {
    schema: () => ({
      from: (table: string) => (calls.push({ fn: "from", args: [table] }), chain),
    }),
  };
  return { db, calls };
}

const get = (qs = "") => new Request(`https://x/control-results${qs}`);
const eqPairs = (calls: { fn: string; args: unknown[] }[]) =>
  calls.filter((c) => c.fn === "eq").map((c) => `${c.args[0]}=${c.args[1]}`);

Deno.test("returns rows wrapped in data with a 200", async () => {
  const { db } = stubQueryDb([ROW]);
  const res = await getControlResults(get(), db, "r1");
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.data.length, 1);
  assertEquals(body.data[0].control_id, "CG-VEL-01");
});

Deno.test("newest results come first, capped at the default limit", async () => {
  const { db, calls } = stubQueryDb([]);
  await getControlResults(get(), db, "r2");
  const order = calls.find((c) => c.fn === "order");
  assertEquals(order?.args[0], "created_at");
  assertEquals((order?.args[1] as Any)?.ascending, false);
  // limit+1: the endpoint over-fetches one probe row to answer has_more
  assertEquals(calls.find((c) => c.fn === "limit")?.args[0], 51);
});

Deno.test("every documented filter narrows the query", async () => {
  const { db, calls } = stubQueryDb([]);
  await getControlResults(
    get("?control_id=CG-LGTXN-01&decision=pass&subject_ref=acct_x&event=tr_9"),
    db,
    "r3",
  );
  const pairs = eqPairs(calls).sort();
  assertEquals(pairs, [
    "control_id=CG-LGTXN-01",
    "decision=pass",
    "event=tr_9",
    "subject_ref=acct_x",
  ]);
});

Deno.test("an unknown decision value is refused, not silently empty", async () => {
  const { db } = stubQueryDb([]);
  const res = await getControlResults(get("?decision=maybe"), db, "r4");
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.errors.some((e: Any) => e.field === "decision"), true);
});

Deno.test("limit is honored within bounds and refused outside them", async () => {
  const { db, calls } = stubQueryDb([]);
  await getControlResults(get("?limit=10"), db, "r5");
  assertEquals(calls.find((c) => c.fn === "limit")?.args[0], 11); // +1 probe row

  for (const bad of ["0", "-5", "201", "ten", "2.5"]) {
    const { db: db2 } = stubQueryDb([]);
    const res = await getControlResults(get(`?limit=${bad}`), db2, "r6");
    assertEquals(res.status, 400, `limit=${bad} must be refused`);
  }
});

Deno.test("no matches is an empty data array, not an error", async () => {
  const { db } = stubQueryDb([]);
  const res = await getControlResults(get("?control_id=CG-NOPE-99"), db, "r7");
  assertEquals(res.status, 200);
  assertEquals((await res.json()).data, []);
});
