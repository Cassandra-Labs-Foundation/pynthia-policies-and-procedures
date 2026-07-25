// Unit + behavioral tests for account opening.
//
// Account opening has a quirk the other writers do not: the Idempotency-Key is
// CONDITIONALLY required — only when an opening deposit is present, because
// that is the only case where money moves. Getting that wrong in either
// direction is a real bug: demanding the key for a zero-balance open would
// break callers, and NOT demanding it when funding would allow a duplicate
// opening deposit.
import { assertEquals } from "jsr:@std/assert@1";
import { getAccount, getAccounts, postAccount } from "./accounts.ts";
import {
  type Any, filtersOf, json, listDb, OPS_CTX, req, reqWithoutIdempotencyKey,
  stubApiDb, stubCfg, stubDb, TEST_CTX,
} from "./test_helpers.ts";

const ACCOUNT_ROW = {
  id: "acct_1",
  account_type: "checking",
  balance: 50000,
  blnk_ledger_id: "ldg_1",
  blnk_balance_id: "bln_1",
  balance_synced_at: "2026-07-18T00:00:00Z",
  lock_type: null,
  status: "open",
  created_at: "2026-07-18T00:00:00Z",
};

// ----------------------------------------------------------------- unit level

Deno.test("opening deposit must be a positive integer", async () => {
  const { cfg } = stubCfg([]);
  for (const bad of [0, -100, 12.5]) {
    const { db } = stubDb(null);
    const res = await postAccount(req({ opening_deposit_cents: bad }), db, cfg, "r1", TEST_CTX);
    assertEquals(res.status, 400, `opening deposit ${bad} must be rejected`);
    const b = await res.json();
    assertEquals(
      b.errors.some((e: Any) => e.field === "opening_deposit_cents"),
      true,
    );
  }
});

Deno.test("a funded open REQUIRES an Idempotency-Key — money is moving", async () => {
  const { cfg } = stubCfg([]);
  const { db } = stubDb(null);

  const res = await postAccount(
    reqWithoutIdempotencyKey({ opening_deposit_cents: 10000 }),
    db,
    cfg,
    "r2",
    TEST_CTX,
  );
  assertEquals(res.status, 400);
  const b = await res.json();
  assertEquals(
    b.errors.some((e: Any) => e.field === "Idempotency-Key"),
    true,
    "funding without an idempotency key would allow a duplicate opening deposit",
  );
});

Deno.test("a non-numeric opening deposit is rejected rather than coerced", async () => {
  const { cfg } = stubCfg([]);
  const { db } = stubDb(null);
  const res = await postAccount(req({ opening_deposit_cents: "10000" }), db, cfg, "r3", TEST_CTX);
  assertEquals(res.status, 400);
});

Deno.test("validation reports the deposit and the missing key together, not one at a time", async () => {
  const { cfg } = stubCfg([]);
  const { db } = stubDb(null);
  // invalid amount AND no key: a caller should see both problems in one round trip
  const res = await postAccount(
    reqWithoutIdempotencyKey({ opening_deposit_cents: -5 }),
    db,
    cfg,
    "r4",
    TEST_CTX,
  );
  assertEquals(res.status, 400);
  const fields = (await res.json()).errors.map((e: Any) => e.field).sort();
  assertEquals(fields, ["Idempotency-Key", "opening_deposit_cents"]);
});

// ----------------------------------------------------------- behavioral level

Deno.test("an unfunded open does NOT require an Idempotency-Key", async () => {
  const { cfg } = stubCfg([]);
  const { db } = stubDb(null);

  const res = await postAccount(reqWithoutIdempotencyKey({}), db, cfg, "r5", TEST_CTX);
  // no money moves, so the key is optional — must not be a validation failure
  assertEquals(
    res.status === 400 &&
      (await res.clone().json()).errors?.some((e: Any) => e.field === "Idempotency-Key"),
    false,
  );
});

Deno.test("GET returns the account with its mirrored balance", async () => {
  const { db } = stubDb(ACCOUNT_ROW);
  const res = await getAccount("acct_1", db, "r6", TEST_CTX);
  assertEquals(res.status, 200);
  const b = await res.json();
  assertEquals(b.id, "acct_1");
  assertEquals(b.account_type, "checking");
});

Deno.test("GET on an unknown account is a 404", async () => {
  const { db } = stubDb(null);
  assertEquals((await getAccount("nope", db, "r7", TEST_CTX)).status, 404);
});

// ------------------------------- owning entity (cash / BSA-08 prerequisite)

Deno.test("an account can be opened owned by an entity", async () => {
  const { cfg } = stubCfg([
    json({ ledger_id: "l1" }), json({ balance_id: "b1" }), json({ transaction_id: "t1" }),
  ]);
  const { db, inserts } = stubApiDb({ idem: "fresh" });
  await postAccount(
    req({ account_type: "checking", opening_deposit_cents: 1000, entity_id: "ent_1" }),
    db, cfg, "e1", TEST_CTX,
  );
  const acct = inserts.find((i) => i.table === "account");
  assertEquals(acct?.row.entity_id, "ent_1");
});

Deno.test("an account opened without an entity records NULL, not a fabricated owner", async () => {
  // Deliberate: inventing a member relationship to satisfy NOT NULL would be
  // worse than the null. BSA-08 aggregation simply cannot include this account
  // until someone who knows the answer links it.
  const { cfg } = stubCfg([
    json({ ledger_id: "l1" }), json({ balance_id: "b1" }), json({ transaction_id: "t1" }),
  ]);
  const { db, inserts } = stubApiDb({ idem: "fresh" });
  await postAccount(
    req({ account_type: "checking", opening_deposit_cents: 1000 }), db, cfg, "e2", TEST_CTX,
  );
  assertEquals(inserts.find((i) => i.table === "account")?.row.entity_id, null);
});

Deno.test("a non-string entity_id is refused rather than coerced", async () => {
  const { cfg } = stubCfg([]);
  for (const bad of [7, "", {}, []]) {
    const { db } = stubApiDb({ idem: "fresh" });
    const res = await postAccount(
      req({ account_type: "checking", opening_deposit_cents: 1000, entity_id: bad }),
      db, cfg, "e3", TEST_CTX,
    );
    assertEquals(res.status, 400, `entity_id=${JSON.stringify(bad)} must be refused`);
  }
});

// ------------------------------------------------------------- GET /accounts
//
// The list endpoint core-api.yaml has declared as `list_account` since the spec
// was written, and which nothing implemented — GET /accounts answered 405 while
// GET /accounts/{id} worked, so accounts could be inspected but never found.

Deno.test("the account list is confined to one partner, before any filter", async () => {
  const { db, calls } = listDb([]);
  await getAccounts(new Request("https://x/accounts?status=open"), db, "a1", TEST_CTX);
  assertEquals(
    filtersOf(calls),
    // partner FIRST: ?status= narrows the caller's own page, it never reaches
    // past the predicate into another partner's accounts
    ["eq:partner_id=ptnr_test", "eq:status=open"],
  );
});

Deno.test("entity_id is the member -> accounts walk, and stays inside the partner", async () => {
  const { db, calls } = listDb([]);
  await getAccounts(new Request("https://x/accounts?entity_id=ent_9"), db, "a2", TEST_CTX);
  assertEquals(
    filtersOf(calls),
    ["eq:partner_id=ptnr_test", "eq:entity_id=ent_9"],
    "an entity belonging to another partner must narrow this page to nothing, not reach across",
  );
});

Deno.test("an ops actor lists accounts across partners — D23 gives it full access", async () => {
  const { db, calls } = listDb([]);
  await getAccounts(new Request("https://x/accounts"), db, "a3", OPS_CTX);
  assertEquals(filtersOf(calls), []);
});

Deno.test("an unknown account status is refused", async () => {
  const { db } = listDb([]);
  const res = await getAccounts(new Request("https://x/accounts?status=dormant"), db, "a4", TEST_CTX);
  assertEquals(res.status, 400);
  assertEquals((await res.json()).errors[0].field, "status");
});

Deno.test("a bad cursor and a bad filter come back in ONE 400", async () => {
  const { db } = listDb([]);
  const res = await getAccounts(
    new Request("https://x/accounts?status=dormant&limit=0&after=soon"), db, "a5", TEST_CTX,
  );
  assertEquals(res.status, 400);
  assertEquals(
    (await res.json()).errors.map((e: Any) => e.field).sort(),
    ["after", "limit", "status"],
    "one round trip per bad request, not one per bad field",
  );
});

Deno.test("the page over-fetches by one, and that row becomes the cursor", async () => {
  const rows = [
    { id: "acct_3", created_at: "2026-07-03T00:00:00Z" },
    { id: "acct_2", created_at: "2026-07-02T00:00:00Z" },
    { id: "acct_1", created_at: "2026-07-01T00:00:00Z" },
  ];
  const { db, calls } = listDb(rows);
  const res = await getAccounts(new Request("https://x/accounts?limit=2"), db, "a6", TEST_CTX);
  assertEquals(calls.find((c) => c.fn === "limit")?.args[0], 3, "limit + 1: the extra row IS has_more");
  const body = await res.json();
  assertEquals(body.data.length, 2, "the over-fetched row is not served");
  assertEquals(body.pagination.has_more, true);
  assertEquals(body.pagination.next_after, "2026-07-02T00:00:00Z", "the cursor is the LAST SERVED row");
});

Deno.test("a short page reports no more, and no cursor to follow", async () => {
  const { db } = listDb([{ id: "acct_1", created_at: "2026-07-01T00:00:00Z" }]);
  const res = await getAccounts(new Request("https://x/accounts?limit=2"), db, "a7", TEST_CTX);
  const body = await res.json();
  assertEquals(body.pagination.has_more, false);
  assertEquals(body.pagination.next_after, null);
});

Deno.test("the limit is bounded — an unbounded page is a table scan", async () => {
  for (const bad of ["0", "201", "-1", "1.5", "all"]) {
    const { db } = listDb([]);
    const res = await getAccounts(new Request(`https://x/accounts?limit=${bad}`), db, "a8", TEST_CTX);
    assertEquals(res.status, 400, `limit=${bad} must be refused`);
  }
  const { db, calls } = listDb([]);
  await getAccounts(new Request("https://x/accounts?limit=200"), db, "a9", TEST_CTX);
  assertEquals(calls.find((c) => c.fn === "limit")?.args[0], 201, "200 is the ceiling, and it is allowed");
});

Deno.test("the list envelope is the one core-api.yaml specifies", async () => {
  // The spec has always described list responses as {data, pagination:{...}}
  // via the Pagination schema, and every implementation returned them FLAT —
  // {data, limit, has_more, next_after}. Spec and code disagreed about the
  // shape of every list response in the API, and nothing failed, because
  // nothing compared them. This is that comparison.
  const { db } = listDb([{ id: "acct_1", created_at: "2026-07-01T00:00:00Z" }]);
  const body = await (await getAccounts(new Request("https://x/accounts"), db, "a10", TEST_CTX)).json();

  assertEquals(Object.keys(body).sort(), ["data", "pagination"]);
  assertEquals(Object.keys(body.pagination).sort(), ["has_more", "limit", "next_after"]);
  for (const leaked of ["limit", "has_more", "next_after"]) {
    assertEquals(body[leaked], undefined, `${leaked} must live under pagination, not beside data`);
  }
});
