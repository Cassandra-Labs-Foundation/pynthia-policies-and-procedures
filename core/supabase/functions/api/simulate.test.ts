// Cards 35 / 38 / 44 — the simulation dispatcher.
//
// These tests are deliberately about ROUTING, not rail behaviour: the rails'
// own suites cover what a return or an expiry does. What must be proved here is
// that a simulate path lands on the REAL writer — because the moment a
// simulate route grows its own implementation, the compliance evidence the
// sandbox produces stops being evidence of the production path.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { postSimulate } from "./simulate.ts";
import { type Any, json, req, stubApiDb, stubCfg, TEST_CTX } from "./test_helpers.ts";

const ACCOUNT = {
  id: "acct_1",
  account_type: "checking",
  balance: 500_000,
  blnk_ledger_id: "ldg_1",
  blnk_balance_id: "bal_1",
  balance_synced_at: new Date().toISOString(),
  lock_type: null,
  status: "open",
  created_at: new Date().toISOString(),
};

const HELD_ACH = {
  id: "ach_1",
  amount: 5_000,
  status: "submitted",
  counterparty: {},
  window: "next_day",
  originator: { account_id: "acct_1" },
  return_reason: null,
  noc: null,
  blnk_transaction_id: "txn_1",
  blnk_reference: "ref_1",
  created_at: new Date().toISOString(),
};

function inflight() {
  return json({ transaction_id: "txn_1", reference: "ref_1", status: "INFLIGHT" });
}
function voided() {
  return json({ transaction_id: "txn_1", reference: "ref_1", status: "VOID" });
}

Deno.test("an unsimulated path still returns the typed 501, and says what IS simulated", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db } = stubApiDb({});
  const res = await postSimulate(req({}), "/check/deposit", db, cfg, "s1", TEST_CTX);
  assertEquals(res.status, 501);
  const b = await res.json();
  assertEquals(b.type, "not_implemented");
  // the card-09 contract: unfilled simulation is an explicit 501, not a 404
  assert(b.detail.includes("/check/deposit"), "names the path that is missing");
  assert(b.detail.includes("POST /payments/ach"), "lists the rails that ARE simulated");
  assertEquals(sent.length, 0, "a 501 touches no ledger");
});

Deno.test("simulate/ach/{id}/return drives the REAL return path — voids the hold", async () => {
  const { cfg, sent } = stubCfg([voided()]);
  const { db, updates } = stubApiDb({ row: HELD_ACH });

  const res = await postSimulate(req({ return_reason: "R01" }), "/ach/ach_1/return", db, cfg, "s2", TEST_CTX);
  assertEquals(res.status, 200);
  // proof it is the production writer and not a simulator: the real Blnk void
  // went out, and the real column was written
  assertEquals((sent[0].body as Any).status, "void");
  const patch = updates.filter((u) => u.table === "ach_transfer").at(-1)!.patch;
  assertEquals(patch.status, "returned");
  assertEquals(patch.return_reason, "R01");
});

Deno.test("simulate rejects a bogus return code exactly as the real endpoint does", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db } = stubApiDb({ row: HELD_ACH });
  // R99 is not a NACHA code; the simulator must not be a way to write one
  const res = await postSimulate(req({ return_reason: "R99" }), "/ach/ach_1/return", db, cfg, "s3", TEST_CTX);
  assertEquals(res.status, 400);
  assertEquals(sent.length, 0);
});

Deno.test("simulate/ach runs the compliance gate — a blocked entry is blocked here too", async () => {
  const { cfg, sent } = stubCfg([inflight()]);
  // $260k of prior same-day outbound puts this over the CG-VEL-01 $25k cap
  const { db, inserts } = stubApiDb({
    account: ACCOUNT,
    outbound: { ach_transfer: [{ amount: 26_000_00 }] },
  });

  const res = await postSimulate(
    req({ source_account_id: "acct_1", amount_cents: 1_000, counterparty: {} }),
    "/ach",
    db,
    cfg,
    "s4",
    TEST_CTX,
  );

  assertEquals(res.status, 422);
  assertEquals((await res.json()).type, "velocity_limit_exceeded");
  // the whole point of aliasing: control evidence is written for a SIMULATED
  // transaction exactly as for a real one
  const cr = inserts.filter((i) => i.table === "control_result");
  assertEquals(cr.length, 1);
  assertEquals(cr[0].row.control_id, "CG-VEL-01");
  assertEquals(cr[0].row.decision, "block");
  assertEquals(sent.length, 0, "a blocked entry never reaches the ledger");
});

Deno.test("wire return/resolve is not shadowed by the bare return route", async () => {
  const { cfg } = stubCfg([]);
  const { db } = stubApiDb({
    row: { id: "w1", amount: 1000, status: "completed", beneficiary: {}, originator: {} },
  });
  // /wire/{id}/return/resolve must reach the RESOLVE handler; if the broader
  // /wire/{id}/return pattern matched first it would 400 on a missing `reason`
  // instead of on a missing `outcome`
  const res = await postSimulate(req({}), "/wire/w1/return/resolve", db, cfg, "s5", TEST_CTX);
  assertEquals(res.status, 400);
  const b = await res.json();
  assertEquals(b.errors[0].field, "outcome");
});

Deno.test("every rail's terminal step is reachable through simulate", async () => {
  // A spelling regression here is silent in production and only shows up as a
  // 501 mid-demo, so the table is asserted directly.
  const paths = [
    "/ach", "/ach/x/settle", "/ach/x/return", "/ach/x/noc",
    "/wire/prepare", "/wire/x/confirm", "/wire/x/cancel", "/wire/x/reject",
    "/wire/x/return", "/wire/x/return/resolve",
    "/card/authorize", "/card/x/capture", "/card/x/settle", "/card/x/reverse", "/card/x/expire",
  ];
  for (const p of paths) {
    const { cfg } = stubCfg([voided(), voided()]);
    // no row / no account: each handler bails early (404 or 400), which is
    // fine — this asserts the ROUTE exists, not what it then does
    const { db } = stubApiDb({});
    const res = await postSimulate(req({}), p, db, cfg, "s6", TEST_CTX);
    assert(res.status !== 501, `${p} must be simulated, got 501`);
  }
});
