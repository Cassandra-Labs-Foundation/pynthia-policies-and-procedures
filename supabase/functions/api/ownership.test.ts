// Row-level partner ownership.
//
// The DB fakes here apply `.eq()` as real predicates. That is what gives the
// tests teeth: the enforcement is a WHERE clause pushed into the query, so a
// fake that ignored predicates would keep passing after the clause was
// deleted. Several tests below assert the predicate is present at all, which
// is the property that survives refactoring.
import { assert, assertEquals } from "jsr:@std/assert@1";
import {
  INSTANCE_SCOPED_TABLES,
  isConfined,
  ownsRow,
  scopeToPartner,
  withOwner,
} from "./ownership.ts";
import { getAccount } from "./accounts.ts";
import { postAch } from "./ach.ts";
import { provenanceFor } from "./bsa.ts";
import { postAchSettle } from "./ach.ts";
import { type Any, DEMO_KEY_CTX, OPS_CTX, OTHER_CTX, req, stubApiDb, stubCfg, TEST_CTX } from "./test_helpers.ts";

/** Records every .eq() and only returns rows that satisfy all of them. */
function rowsDb(table: string, rows: Record<string, unknown>[]) {
  const filters: Record<string, unknown>[] = [];
  const chain: Any = {
    select: () => chain,
    eq: (col: string, val: unknown) => {
      filters.push({ col, val });
      return chain;
    },
    order: () => chain,
    limit: () => chain,
    lt: () => chain,
    update: () => chain,
    insert: () => Promise.resolve({ error: null }),
    upsert: () => Promise.resolve({ error: null }),
    maybeSingle: () =>
      Promise.resolve({
        data: rows.find((r) => filters.every((f) => r[f.col as string] === f.val)) ?? null,
        error: null,
      }),
    single: () =>
      Promise.resolve({
        data: rows.find((r) => filters.every((f) => r[f.col as string] === f.val)) ?? null,
        error: null,
      }),
    then: (res: (v: unknown) => unknown) =>
      res({
        data: rows.filter((r) => filters.every((f) => r[f.col as string] === f.val)),
        error: null,
      }),
  };
  const db: Any = { schema: () => ({ from: (t: string) => (t === table ? chain : chain) }) };
  return { db, filters };
}

// ------------------------------------------------------------ who is confined

Deno.test("only partner actors are confined; D23 roles see across fintechs", () => {
  assertEquals(isConfined(TEST_CTX), true);
  // confining these would break exactly the cross-fintech visibility that the
  // credit-union admin and Pynthia operations roles exist to provide
  assertEquals(isConfined(OPS_CTX), false);
});

Deno.test("scopeToPartner adds the predicate for a partner and not for ops", () => {
  const calls: { col: string; val: unknown }[] = [];
  const q: Any = { eq: (col: string, val: unknown) => (calls.push({ col, val }), q) };

  scopeToPartner(q, TEST_CTX);
  assertEquals(calls, [{ col: "partner_id", val: "ptnr_test" }]);

  calls.length = 0;
  scopeToPartner(q, OPS_CTX);
  assertEquals(calls, [], "an unconfined actor's query is returned untouched");
});

Deno.test("ownsRow rejects another partner's row and tolerates ops", () => {
  const mine = { partner_id: "ptnr_test" };
  const theirs = { partner_id: "ptnr_other" };
  assertEquals(ownsRow(mine, TEST_CTX), true);
  assertEquals(ownsRow(theirs, TEST_CTX), false);
  assertEquals(ownsRow(theirs, OPS_CTX), true);
  assertEquals(ownsRow(null, TEST_CTX), false, "a missing row is never owned");
});

// ------------------------------------------------------------------ stamping

Deno.test("withOwner stamps ownerPartnerId, not partnerId", () => {
  assertEquals(withOwner({ id: "x" }, TEST_CTX).partner_id, "ptnr_test");
  // an ops actor has partnerId null but still creates rows, and partner_id is
  // NOT NULL — ownerPartnerId is what makes that representable
  assertEquals(OPS_CTX.partnerId, null);
  assertEquals(withOwner({ id: "x" }, OPS_CTX).partner_id, "ptnr_test");
});

Deno.test("the owner stamp is never null for any actor type", () => {
  for (const ctx of [TEST_CTX, OTHER_CTX, OPS_CTX]) {
    const stamped = withOwner({ id: "x" }, ctx);
    assert(
      typeof stamped.partner_id === "string" && stamped.partner_id.length > 0,
      `${ctx.actorType} must produce a non-null owner — the column is NOT NULL`,
    );
  }
});

// ---------------------------------------------------- reads are confined

Deno.test("a partner cannot read another partner's account", async () => {
  const { db } = rowsDb("account", [
    { id: "acct_1", partner_id: "ptnr_other", status: "open", balance: 100 },
  ]);
  const res = await getAccount("acct_1", db, "o1", TEST_CTX);
  // 404, NOT 403: a 403 would confirm the id exists and hand out an
  // enumeration oracle for other partners' account ids
  assertEquals(res.status, 404);
  assertEquals((await res.json()).type, "not_found");
});

Deno.test("a partner reads its own account normally", async () => {
  const { db } = rowsDb("account", [
    { id: "acct_1", partner_id: "ptnr_test", status: "open", balance: 100 },
  ]);
  assertEquals((await getAccount("acct_1", db, "o2", TEST_CTX)).status, 200);
});

Deno.test("an ops actor reads any partner's account", async () => {
  const { db } = rowsDb("account", [
    { id: "acct_1", partner_id: "ptnr_other", status: "open", balance: 100 },
  ]);
  assertEquals((await getAccount("acct_1", db, "o3", OPS_CTX)).status, 200);
});

// ------------------------------------------- money movement is confined too

Deno.test("a partner cannot settle another partner's ACH entry", async () => {
  // The dangerous case: settling commits a Blnk hold and MOVES MONEY. A read
  // leak is bad; being able to advance another fintech's payment is worse.
  const { cfg, sent } = stubCfg([]);
  const { db } = rowsDb("ach_transfer", [{
    id: "ach_1",
    partner_id: "ptnr_other",
    status: "submitted",
    amount: 5000,
    blnk_transaction_id: "txn_1",
  }]);
  const res = await postAchSettle(req(), "ach_1", db, cfg, "o4", TEST_CTX);
  assertEquals(res.status, 404);
  assertEquals(sent.length, 0, "no ledger call may be made on a foreign row");
});

Deno.test("a partner settles its own ACH entry", async () => {
  const { cfg } = stubCfg([
    new Response(JSON.stringify({ transaction_id: "txn_1", status: "APPLIED" }), {
      headers: { "content-type": "application/json" },
    }),
  ]);
  const { db } = rowsDb("ach_transfer", [{
    id: "ach_1",
    partner_id: "ptnr_test",
    status: "submitted",
    amount: 5000,
    originator: { account_id: "acct_1" },
    blnk_transaction_id: "txn_1",
  }]);
  assertEquals((await postAchSettle(req(), "ach_1", db, cfg, "o5", TEST_CTX)).status, 200);
});

// --------------------------------------- what must NOT be partner-scoped

Deno.test("the instance-scoped table list covers the compliance record", () => {
  // Asserted rather than left to a comment. Partner-scoping any of these would
  // fragment the view the controls exist to produce — and silently, because a
  // narrowed aggregate still returns a clean result and still writes a passing
  // control_result. A cap that never trips reads exactly like a cap that was
  // never exceeded.
  for (const t of ["control_result", "bsa_alert", "event", "filing"]) {
    assert(
      (INSTANCE_SCOPED_TABLES as readonly string[]).includes(t),
      `${t} is the instance's compliance record and must stay instance-wide`,
    );
  }
});

Deno.test("idempotency is namespaced by CALLER, ownership by OWNER — not the same key", () => {
  // An ops actor acting for a partner shares that partner's rows but must not
  // share its idempotency keyspace, or an ops retry could collide with the
  // partner's own in-flight claim.
  assertEquals(OPS_CTX.ownerPartnerId, TEST_CTX.ownerPartnerId);
  assert(
    OPS_CTX.idempotencyScope !== TEST_CTX.idempotencyScope,
    "same owner, different caller — the two namespaces must stay independent",
  );
});

// ------------------------------- demo-credential provenance (seed.sh gap)

Deno.test("evidence written under the bootstrap credential is stamped demo", async () => {
  // analytics/seed.sh authenticates with the shared DEMO_API_KEY and drives the
  // API specifically to trip every control. The evaluation is real; the traffic
  // is manufactured and the credential is unattributable, so the rows must not
  // be counted as production evidence.
  const { cfg } = stubCfg([]);
  const { db, inserts } = stubApiDb({
    account: {
      id: "acct_1", account_type: "checking", balance: 5_000_00,
      blnk_ledger_id: "l", blnk_balance_id: "b", balance_synced_at: null,
      lock_type: null, status: "open", created_at: new Date().toISOString(),
    },
    outbound: { ach_transfer: [{ amount: 26_000_00 }] },
  });
  await postAch(
    req({ source_account_id: "acct_1", amount_cents: 1_000, counterparty: {} }),
    db, cfg, "d1", DEMO_KEY_CTX,
  );
  const cr = inserts.filter((i) => i.table === "control_result");
  assertEquals(cr.length, 1);
  assertEquals(cr[0].row.provenance, "demo", "seed traffic must not read as production");
});

Deno.test("the same request under a real token is stamped production", async () => {
  const { cfg } = stubCfg([]);
  const { db, inserts } = stubApiDb({
    account: {
      id: "acct_1", account_type: "checking", balance: 5_000_00,
      blnk_ledger_id: "l", blnk_balance_id: "b", balance_synced_at: null,
      lock_type: null, status: "open", created_at: new Date().toISOString(),
    },
    outbound: { ach_transfer: [{ amount: 26_000_00 }] },
  });
  await postAch(
    req({ source_account_id: "acct_1", amount_cents: 1_000, counterparty: {} }),
    db, cfg, "d2", TEST_CTX,
  );
  const cr = inserts.filter((i) => i.table === "control_result");
  assertEquals(cr[0].row.provenance, "production");
});

Deno.test("sim scope outranks the credential — simulated is simulated", () => {
  assertEquals(provenanceFor("sim", DEMO_KEY_CTX), "simulated");
  assertEquals(provenanceFor("core", DEMO_KEY_CTX), "demo");
  assertEquals(provenanceFor("core", TEST_CTX), "production");
  // no context at all defaults to production, which is the ONE unsafe default
  // here — it is acceptable only because every call site passes ctx, asserted
  // by the two tests above
  assertEquals(provenanceFor("core"), "production");
});
