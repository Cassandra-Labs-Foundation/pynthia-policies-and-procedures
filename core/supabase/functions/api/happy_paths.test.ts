// Happy-path (submission) coverage for the three two-phase writers.
//
// These were the last hermetic gap: every writer's *resolution* half (confirm/
// settle/capture) was covered, but the *submission* half was not, because it
// runs through claimIdempotency and so needs a fake that models the claim
// rather than short-circuiting it. stubApiDb does that faithfully.
//
// What matters here is the ORDER of operations, which the compliance harness
// can only observe indirectly: the row is written, then the gate runs, and only
// if the gate passes does anything reach Blnk. A writer that called Blnk first
// would still look correct end-to-end while leaving orphaned holds behind on
// every declined payment.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { postWirePrepare } from "./wires.ts";
import { postAch } from "./ach.ts";
import { postCardAuthorize } from "./cards.ts";
import { type Any, json, req, stubApiDb, stubCfg, TEST_CTX } from "./test_helpers.ts";

const ACCOUNT = {
  id: "acct_src",
  account_type: "checking",
  balance: 5_000_000,
  blnk_ledger_id: "ldg_1",
  blnk_balance_id: "bln_src",
  balance_synced_at: "2026-07-18T00:00:00Z",
  lock_type: null,
  status: "open",
  created_at: "2026-07-18T00:00:00Z",
};

// getBalance (NSF check) then the inflight create
const gatePasses = () => json({ balance: 5_000_000, currency: "USD" });
const inflight = (ref: string) =>
  json({ transaction_id: "txn_new", reference: ref, status: "INFLIGHT" });

const WIRE_BODY = {
  source_account_id: "acct_src",
  amount_cents: 250_000,
  beneficiary: { name: "Acme Corp" },
  purpose: "invoice 42",
};
const ACH_BODY = {
  source_account_id: "acct_src",
  amount_cents: 250_000,
  counterparty: { name: "Acme Vendor" },
  window: "next_day",
};
const CARD_BODY = {
  source_account_id: "acct_src",
  amount_cents: 100_000,
  merchant: "Acme Coffee",
};

// ------------------------------------------------------------ wire: prepare

Deno.test("wire prepare holds funds and lands submitted", async () => {
  const { cfg, sent } = stubCfg([gatePasses(), inflight("wire_transfer:w1")]);
  const { db, inserts, updates } = stubApiDb({ account: ACCOUNT, row: { id: "w1", amount: 250_000 } });

  const res = await postWirePrepare(req(WIRE_BODY), db, cfg, "r1", TEST_CTX);
  assertEquals(res.status, 201);
  assertEquals((await res.json()).status, "submitted");

  // the hold is an INFLIGHT transaction, not a settled one
  const create = sent.find((s) => s.url.endsWith("/transactions"));
  assert(create, "must create a Blnk transaction");
  assertEquals((create.body as Any).inflight, true);
  assertEquals((create.body as Any).destination, "@FedWire");
  assertEquals((create.body as Any).precise_amount, 250_000);
  // and the row records who the money left
  const row = inserts.find((i) => i.table === "wire_transfer");
  assertEquals((row?.row.originator as Any).account_id, "acct_src");
  // filter by table: storeIdempotencyResponse writes to idempotency_keys after
  // the wire row, so the last update overall is not the wire's
  assertEquals(updates.filter((u) => u.table === "wire_transfer").at(-1)?.patch.status, "submitted");
});

Deno.test("wire prepare runs the gate BEFORE placing the hold", async () => {
  // NSF: gate blocks on the balance lookup, so no transaction may be created
  const { cfg, sent } = stubCfg([json({ balance: 100, currency: "USD" })]);
  const { db } = stubApiDb({ account: ACCOUNT, row: { id: "w1" } });

  const res = await postWirePrepare(req(WIRE_BODY), db, cfg, "r2", TEST_CTX);
  assertEquals(res.status, 422);
  assertEquals(
    sent.some((s) => s.url.endsWith("/transactions")),
    false,
    "a declined payment must never leave an orphaned hold",
  );
});

Deno.test("wire prepare replays a completed claim without touching Blnk", async () => {
  const { cfg, sent } = stubCfg([]);
  const stored = { id: "w1", status: "submitted" };
  const { db } = stubApiDb({ account: ACCOUNT, idem: { kind: "replay", status: 201, body: stored } });

  const res = await postWirePrepare(req(WIRE_BODY), db, cfg, "r3", TEST_CTX);
  assertEquals(res.status, 201);
  assertEquals(res.headers.get("Idempotent-Replayed"), "true");
  assertEquals(await res.json(), stored);
  assertEquals(sent.length, 0, "a replay must not re-hold funds");
});

Deno.test("wire prepare 409s when the same key arrives with a different body", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db } = stubApiDb({ account: ACCOUNT, idem: { kind: "conflict" } });

  const res = await postWirePrepare(req(WIRE_BODY), db, cfg, "r4", TEST_CTX);
  assertEquals(res.status, 409);
  assertEquals((await res.json()).type, "idempotency_key_reused");
  assertEquals(sent.length, 0);
});

Deno.test("wire prepare resumes an interrupted claim on the ORIGINAL id", async () => {
  const { cfg, sent } = stubCfg([gatePasses(), inflight("wire_transfer:w_orig")]);
  const { db } = stubApiDb({
    account: ACCOUNT,
    idem: { kind: "resume", id: "w_orig" },
    row: { id: "w_orig" },
  });

  const res = await postWirePrepare(req(WIRE_BODY), db, cfg, "r5", TEST_CTX);
  assertEquals(res.status, 201);
  // reusing the interrupted id keeps the Blnk reference stable, which is what
  // stops a retry from double-holding the same funds
  const create = sent.find((s) => s.url.endsWith("/transactions"));
  assertEquals((create!.body as Any).reference, "wire_transfer:w_orig");
});

Deno.test("wire prepare 404s an unknown source account before any Blnk call", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db } = stubApiDb({ account: null });
  const res = await postWirePrepare(req(WIRE_BODY), db, cfg, "r6", TEST_CTX);
  assertEquals(res.status, 404);
  assertEquals(sent.length, 0);
});

Deno.test("wire prepare 409s an account with no Blnk balance provisioned", async () => {
  const { cfg } = stubCfg([]);
  const { db } = stubApiDb({ account: { ...ACCOUNT, blnk_balance_id: null } });
  const res = await postWirePrepare(req(WIRE_BODY), db, cfg, "r7", TEST_CTX);
  assertEquals(res.status, 409);
  assertEquals((await res.json()).type, "account_not_provisioned");
});

// -------------------------------------------------------------- ach: submit

Deno.test("ach submit holds funds toward the ACH network and lands submitted", async () => {
  const { cfg, sent } = stubCfg([gatePasses(), inflight("ach_transfer:a1")]);
  const { db, inserts } = stubApiDb({ account: ACCOUNT, row: { id: "a1", amount: 250_000 } });

  const res = await postAch(req(ACH_BODY), db, cfg, "r8", TEST_CTX);
  assertEquals(res.status, 201);
  assertEquals((await res.json()).status, "submitted");

  const create = sent.find((s) => s.url.endsWith("/transactions"));
  assertEquals((create!.body as Any).inflight, true);
  assertEquals((create!.body as Any).destination, "@ACHNetwork");
  const row = inserts.find((i) => i.table === "ach_transfer");
  assertEquals(row?.row.window, "next_day");
  assertEquals((row?.row.originator as Any).account_id, "acct_src");
});

Deno.test("ach submit defaults the settlement window when none is given", async () => {
  const { cfg } = stubCfg([gatePasses(), inflight("ach_transfer:a2")]);
  const { db, inserts } = stubApiDb({ account: ACCOUNT, row: { id: "a2" } });

  const { window: _omitted, ...noWindow } = ACH_BODY;
  await postAch(req(noWindow), db, cfg, "r9", TEST_CTX);
  assertEquals(inserts.find((i) => i.table === "ach_transfer")?.row.window, "next_day");
});

Deno.test("ach submit runs the gate BEFORE placing the hold", async () => {
  const { cfg, sent } = stubCfg([json({ balance: 100, currency: "USD" })]);
  const { db } = stubApiDb({ account: ACCOUNT, row: { id: "a1" } });

  assertEquals((await postAch(req(ACH_BODY), db, cfg, "r10", TEST_CTX)).status, 422);
  assertEquals(sent.some((s) => s.url.endsWith("/transactions")), false);
});

// --------------------------------------------------------- card: authorize

Deno.test("card authorize places a hold with nothing captured yet", async () => {
  const { cfg, sent } = stubCfg([gatePasses(), inflight("card_authorization:c1")]);
  const { db, inserts } = stubApiDb({
    account: ACCOUNT,
    row: { id: "c1", amount: 100_000, status: "authorized", blnk_committed_amount: 0 },
  });

  const res = await postCardAuthorize(req(CARD_BODY), db, cfg, "r11", TEST_CTX);
  assertEquals(res.status, 201);
  const b = await res.json();
  assertEquals(b.status, "authorized");
  assertEquals(b.captured_cents, 0);
  assertEquals(b.remaining_cents, 100_000);

  const create = sent.find((s) => s.url.endsWith("/transactions"));
  assertEquals((create!.body as Any).inflight, true);
  assertEquals((create!.body as Any).destination, "@CardNetwork");
  // capture accounting starts explicitly at zero rather than null
  assertEquals(inserts.find((i) => i.table === "card_authorization")?.row.blnk_committed_amount, 0);
});

Deno.test("a gate-blocked authorization is recorded as declined with a reason", async () => {
  const { cfg, sent } = stubCfg([json({ balance: 100, currency: "USD" })]);
  const { db, updates } = stubApiDb({ account: ACCOUNT, row: { id: "c1" } });

  const res = await postCardAuthorize(req(CARD_BODY), db, cfg, "r12", TEST_CTX);
  assertEquals(res.status, 422);
  assertEquals(sent.some((s) => s.url.endsWith("/transactions")), false);

  const declined = updates.filter((u) => u.table === "card_authorization").at(-1);
  assertEquals(declined?.patch.status, "declined");
  assertEquals(declined?.patch.decline_reason, "insufficient_funds");
});

Deno.test("card authorize requires a merchant", async () => {
  const { cfg } = stubCfg([]);
  const { db } = stubApiDb({ account: ACCOUNT });
  const { merchant: _omitted, ...noMerchant } = CARD_BODY;
  const res = await postCardAuthorize(req(noMerchant), db, cfg, "r13", TEST_CTX);
  assertEquals(res.status, 400);
  assert((await res.json()).errors.some((e: Any) => e.field === "merchant"));
});
