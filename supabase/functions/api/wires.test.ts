// Unit + behavioral tests for the wire writer.
//
// Level 1 (unit)       — validation/guard logic in isolation, no network or DB.
// Level 2 (behavioral) — the endpoint honors its contract: state-machine
//                        transitions, replay semantics, partial-commit bounds,
//                        and the exact Blnk call each transition makes.
// Level 3 (compliance) lives in supabase/tests/e2e/compliance_e2e.sh.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { postWireCancel, postWireConfirm, postWirePrepare } from "./wires.ts";
import { type Any, json, req, reqWithoutIdempotencyKey, stubCfg, stubDb } from "./test_helpers.ts";

const HELD_WIRE = {
  id: "w1",
  amount: 500000,
  status: "submitted",
  beneficiary: { name: "Acme" },
  purpose: "invoice",
  imad: null,
  blnk_transaction_id: "txn_held",
  blnk_reference: "wire_transfer:w1",
  blnk_status: "INFLIGHT",
  created_at: "2026-07-18T00:00:00Z",
};

// ----------------------------------------------------------------- unit level

Deno.test("prepare requires an Idempotency-Key", async () => {
  const { cfg } = stubCfg([]);
  const { db } = stubDb(null);
  const res = await postWirePrepare(reqWithoutIdempotencyKey({}), db, cfg, "r1");
  assertEquals(res.status, 400);
  assertEquals((await res.json()).type, "idempotency_key_required");
});

Deno.test("prepare rejects a missing source_account_id", async () => {
  const { cfg } = stubCfg([]);
  const { db } = stubDb(null);
  const res = await postWirePrepare(
    req({ amount_cents: 1000, beneficiary: {} }),
    db,
    cfg,
    "r2",
  );
  assertEquals(res.status, 400);
  const b = await res.json();
  assertEquals(b.type, "validation_error");
  assert(b.errors.some((e: Any) => e.field === "source_account_id"));
});

Deno.test("prepare rejects non-positive / non-integer amounts", async () => {
  const { cfg } = stubCfg([]);
  for (const amount of [0, -5, 10.5]) {
    const { db } = stubDb(null);
    const res = await postWirePrepare(
      req({ source_account_id: "a1", amount_cents: amount, beneficiary: {} }),
      db,
      cfg,
      "r3",
    );
    assertEquals(res.status, 400, `amount ${amount} should be rejected`);
    const b = await res.json();
    assert(b.errors.some((e: Any) => e.field === "amount_cents"));
  }
});

Deno.test("prepare requires a beneficiary object, not a scalar or array", async () => {
  const { cfg } = stubCfg([]);
  for (const bad of ["Acme", 42, ["a"]]) {
    const { db } = stubDb(null);
    const res = await postWirePrepare(
      req({ source_account_id: "a1", amount_cents: 1000, beneficiary: bad }),
      db,
      cfg,
      "r4",
    );
    assertEquals(res.status, 400, `beneficiary ${JSON.stringify(bad)} should be rejected`);
  }
});

// ----------------------------------------------------------- behavioral level

Deno.test("confirm commits the inflight hold and moves submitted -> completed", async () => {
  const { cfg, sent } = stubCfg([json({ transaction_id: "txn_held", reference: "wire_transfer:w1", status: "APPLIED" })]);
  const { db, updates } = stubDb(HELD_WIRE);

  const res = await postWireConfirm(req(), "w1", db, cfg, "r5");
  assertEquals(res.status, 200);
  assertEquals((await res.json()).status, "completed");

  // the contract: a PUT commit against the held transaction
  assertEquals(sent.length, 1);
  assertEquals(sent[0].method, "PUT");
  assert(sent[0].url.endsWith("/transactions/inflight/txn_held"));
  assertEquals((sent[0].body as Any).status, "commit");
  // and the persisted transition
  assertEquals(updates.at(-1)?.status, "completed");
});

Deno.test("cancel voids the hold and moves submitted -> canceled", async () => {
  const { cfg, sent } = stubCfg([json({ transaction_id: "txn_held", reference: "wire_transfer:w1", status: "VOID" })]);
  const { db, updates } = stubDb(HELD_WIRE);

  const res = await postWireCancel(req(), "w1", db, cfg, "r6");
  assertEquals(res.status, 200);
  assertEquals((await res.json()).status, "canceled");
  assertEquals((sent[0].body as Any).status, "void");
  assertEquals(updates.at(-1)?.status, "canceled");
});

Deno.test("confirm on a non-submitted wire is a 409, and touches Blnk not at all", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db } = stubDb({ ...HELD_WIRE, status: "pending_approval" });

  const res = await postWireConfirm(req(), "w1", db, cfg, "r7");
  assertEquals(res.status, 409);
  assertEquals((await res.json()).type, "invalid_state");
  assertEquals(sent.length, 0, "must not call Blnk for an invalid transition");
});

Deno.test("re-confirming an already-completed wire replays instead of double-committing", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db } = stubDb({ ...HELD_WIRE, status: "completed" });

  const res = await postWireConfirm(req(), "w1", db, cfg, "r8");
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("Idempotent-Replayed"), "true");
  assertEquals(sent.length, 0, "must not re-commit an already-settled wire");
});

Deno.test("confirm rejects a partial amount greater than the held amount", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db } = stubDb(HELD_WIRE); // held = 500000

  const res = await postWireConfirm(req({ amount_cents: 600000 }), "w1", db, cfg, "r9");
  assertEquals(res.status, 400);
  assertEquals(sent.length, 0, "must not commit an over-amount");
});

Deno.test("confirm passes a valid partial amount through to the commit", async () => {
  const { cfg, sent } = stubCfg([json({ transaction_id: "txn_held", reference: "wire_transfer:w1", status: "APPLIED" })]);
  const { db } = stubDb(HELD_WIRE);

  const res = await postWireConfirm(req({ amount_cents: 250000 }), "w1", db, cfg, "r10");
  assertEquals(res.status, 200);
  // helper converts integer cents -> major units on the wire
  assertEquals((sent[0].body as Any).amount, 2500);
});

Deno.test("confirm on an unknown wire is a 404", async () => {
  const { cfg } = stubCfg([]);
  const { db } = stubDb(null);
  const res = await postWireConfirm(req(), "nope", db, cfg, "r11");
  assertEquals(res.status, 404);
});

// ------------------------------------------------------------ domestic only
// The core is domestic-only (Fedwire). An international beneficiary must be
// refused at the edge rather than held and then failed downstream: placing an
// inflight hold for a wire that can never be sent strands the customer's funds
// until someone notices.

Deno.test("a beneficiary carrying a SWIFT/BIC code is refused", async () => {
  const { cfg, sent } = stubCfg([]);
  for (const field of ["swift_code", "bic"]) {
    const { db } = stubDb(null);
    const res = await postWirePrepare(
      req({
        source_account_id: "a1",
        amount_cents: 100000,
        beneficiary: { name: "Acme GmbH", [field]: "DEUTDEFF" },
      }),
      db,
      cfg,
      "rd1",
    );
    assertEquals(res.status, 422, `${field} must be refused`);
    assertEquals((await res.json()).type, "international_wire_not_supported");
  }
  assertEquals(sent.length, 0, "an unsendable wire must never reach Blnk");
});

Deno.test("a non-US beneficiary country is refused", async () => {
  const { cfg } = stubCfg([]);
  const { db } = stubDb(null);
  const res = await postWirePrepare(
    req({
      source_account_id: "a1",
      amount_cents: 100000,
      beneficiary: { name: "Acme GmbH", country: "DE" },
    }),
    db,
    cfg,
    "rd2",
  );
  assertEquals(res.status, 422);
  assertEquals((await res.json()).type, "international_wire_not_supported");
});

Deno.test("an explicit US beneficiary is accepted (case-insensitive)", async () => {
  for (const country of ["US", "us"]) {
    const { cfg } = stubCfg([]);
    const { db } = stubDb(null);
    const res = await postWirePrepare(
      req({
        source_account_id: "a1",
        amount_cents: 100000,
        beneficiary: { name: "Acme Corp", country, routing_number: "021000021" },
      }),
      db,
      cfg,
      "rd3",
    );
    // proceeds past the domestic check (fails later on the null account lookup)
    assertEquals(res.status === 422, false, `country ${country} must be accepted`);
  }
});

// ------------------------------------------------------- wire returns (card 37)
// "A return request resolves to RETURNED or COMPLETED with reasons." Two-step,
// mirroring the schema's state machine: completed -> return_requested ->
// (accepted) returned | (rejected) completed. A return of a COMPLETED wire
// cannot void anything — the funds already left for @FedWire — so acceptance
// posts a compensating reversal, the same append-only pattern as the ACH
// post-settlement return.
import { postWireReturn, postWireReturnResolve } from "./wires.ts";

const COMPLETED_WIRE = {
  ...HELD_WIRE,
  status: "completed",
  blnk_status: "APPLIED",
  originator: { account_id: "acct_src" },
  return_reason: null,
};

// like ach.test.ts dbWithAccount: 1st maybeSingle -> wire row, 2nd -> account
function wireDbWithAccount(row: unknown) {
  const updates: Record<string, unknown>[] = [];
  const chain: Any = {
    select: () => chain,
    eq: () => chain,
    update: (p: Record<string, unknown>) => {
      updates.push(p);
      return chain;
    },
    insert: () => Promise.resolve({ data: null, error: null }),
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
    return Promise.resolve({
      data: call === 1 ? row : { id: "acct_src", blnk_balance_id: "bln_src" },
      error: null,
    });
  };
  const db: Any = { schema: () => ({ from: () => chain }) };
  return { db, updates };
}

Deno.test("a completed wire accepts a return request and records the reason", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db, updates } = wireDbWithAccount(COMPLETED_WIRE);

  const res = await postWireReturn(req({ reason: "beneficiary fraud claim" }), "w1", db, cfg, "wr1");
  assertEquals(res.status, 200);
  assertEquals((await res.json()).status, "return_requested");
  assertEquals(updates.at(-1)?.status, "return_requested");
  assertEquals(updates.at(-1)?.return_reason, "beneficiary fraud claim");
  assertEquals(sent.length, 0, "requesting a return moves no money");
});

Deno.test("a return request without a reason is refused", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db } = wireDbWithAccount(COMPLETED_WIRE);
  const res = await postWireReturn(req({}), "w1", db, cfg, "wr2");
  assertEquals(res.status, 400);
  assertEquals(sent.length, 0);
});

Deno.test("a submitted (held) wire cannot be returned — cancel is the verb", async () => {
  const { cfg } = stubCfg([]);
  const { db } = wireDbWithAccount({ ...COMPLETED_WIRE, status: "submitted" });
  const res = await postWireReturn(req({ reason: "R" }), "w1", db, cfg, "wr3");
  assertEquals(res.status, 409);
  assertEquals((await res.json()).type, "invalid_state");
});

Deno.test("re-requesting a return replays instead of erroring", async () => {
  const { cfg } = stubCfg([]);
  const { db } = wireDbWithAccount({ ...COMPLETED_WIRE, status: "return_requested", return_reason: "R" });
  const res = await postWireReturn(req({ reason: "R" }), "w1", db, cfg, "wr4");
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("Idempotent-Replayed"), "true");
});

Deno.test("an ACCEPTED resolution reverses via compensating entry and lands returned", async () => {
  const { cfg, sent } = stubCfg([
    json({ transaction_id: "txn_rev", reference: "wire_transfer:w1:return", status: "APPLIED" }),
  ]);
  const { db, updates } = wireDbWithAccount({
    ...COMPLETED_WIRE,
    status: "return_requested",
    return_reason: "beneficiary fraud claim",
  });

  const res = await postWireReturnResolve(req({ outcome: "accepted" }), "w1", db, cfg, "wr5");
  assertEquals(res.status, 200);
  assertEquals((await res.json()).status, "returned");
  // a new POST /transactions, not a mutation of the settled original
  const call = sent[0];
  assertEquals(call.method, "POST");
  assertEquals(call.url.endsWith("/transactions"), true);
  assertEquals((call.body as Any).source, "@FedWire");
  assertEquals((call.body as Any).destination, "bln_src");
  assertEquals((call.body as Any).inflight, undefined);
  assertEquals((call.body as Any).reference, "wire_transfer:w1:return");
  assertEquals(updates.at(-1)?.status, "returned");
});

Deno.test("a REJECTED resolution restores completed and keeps the reason trail", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db, updates } = wireDbWithAccount({
    ...COMPLETED_WIRE,
    status: "return_requested",
    return_reason: "beneficiary fraud claim",
  });

  const res = await postWireReturnResolve(
    req({ outcome: "rejected", reason: "funds already withdrawn" }),
    "w1",
    db,
    cfg,
    "wr6",
  );
  assertEquals(res.status, 200);
  assertEquals((await res.json()).status, "completed");
  assertEquals(sent.length, 0, "a rejected return moves no money");
  const reason = String(updates.at(-1)?.return_reason ?? "");
  assertEquals(reason.includes("beneficiary fraud claim"), true);
  assertEquals(reason.includes("funds already withdrawn"), true);
});

Deno.test("resolve is only valid from return_requested", async () => {
  const { cfg } = stubCfg([]);
  const { db } = wireDbWithAccount(COMPLETED_WIRE); // still completed
  const res = await postWireReturnResolve(req({ outcome: "accepted" }), "w1", db, cfg, "wr7");
  assertEquals(res.status, 409);
});

Deno.test("resolve rejects an unknown outcome", async () => {
  const { cfg } = stubCfg([]);
  const { db } = wireDbWithAccount({ ...COMPLETED_WIRE, status: "return_requested" });
  const res = await postWireReturnResolve(req({ outcome: "maybe" }), "w1", db, cfg, "wr8");
  assertEquals(res.status, 400);
});

Deno.test("resolving an already-returned wire replays", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db } = wireDbWithAccount({ ...COMPLETED_WIRE, status: "returned" });
  const res = await postWireReturnResolve(req({ outcome: "accepted" }), "w1", db, cfg, "wr9");
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("Idempotent-Replayed"), "true");
  assertEquals(sent.length, 0, "a replay must never post a second reversal");
});
