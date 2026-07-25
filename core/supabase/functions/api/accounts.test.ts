// Unit + behavioral tests for account opening.
//
// Account opening has a quirk the other writers do not: the Idempotency-Key is
// CONDITIONALLY required — only when an opening deposit is present, because
// that is the only case where money moves. Getting that wrong in either
// direction is a real bug: demanding the key for a zero-balance open would
// break callers, and NOT demanding it when funding would allow a duplicate
// opening deposit.
import { assertEquals } from "jsr:@std/assert@1";
import { getAccount, postAccount } from "./accounts.ts";
import { type Any, json, req, reqWithoutIdempotencyKey, stubApiDb, stubCfg, stubDb, TEST_CTX } from "./test_helpers.ts";

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
