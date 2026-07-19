// Unit + behavioral tests for the wire writer.
//
// Level 1 (unit)       — validation/guard logic in isolation, no network or DB.
// Level 2 (behavioral) — the endpoint honors its contract: state-machine
//                        transitions, replay semantics, partial-commit bounds,
//                        and the exact Blnk call each transition makes.
// Level 3 (compliance) lives in supabase/tests/e2e/compliance_e2e.sh.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { postWireCancel, postWireConfirm, postWirePrepare, postWireReject } from "./wires.ts";
import { type Any, json, req, reqWithoutIdempotencyKey, stubApiDb, stubCfg, stubDb, TEST_CTX } from "./test_helpers.ts";

const HELD_WIRE = {
  id: "w1",
  // EPS-06: confirm now requires a second approver. These fixtures represent a
  // wire that HAS been approved — the refusal path is tested explicitly below.
  dual_control_status: "approved",
  created_by: "tok_preparer",
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
  const res = await postWirePrepare(reqWithoutIdempotencyKey({}), db, cfg, "r1", TEST_CTX);
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
    TEST_CTX,
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
      TEST_CTX,
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
      TEST_CTX,
    );
    assertEquals(res.status, 400, `beneficiary ${JSON.stringify(bad)} should be rejected`);
  }
});

// ----------------------------------------------------------- behavioral level

Deno.test("confirm commits the inflight hold and moves submitted -> completed", async () => {
  const { cfg, sent } = stubCfg([json({ transaction_id: "txn_held", reference: "wire_transfer:w1", status: "APPLIED" })]);
  const { db, updates } = stubDb(HELD_WIRE);

  const res = await postWireConfirm(req(), "w1", db, cfg, "r5", TEST_CTX);
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

  const res = await postWireCancel(req(), "w1", db, cfg, "r6", TEST_CTX);
  assertEquals(res.status, 200);
  assertEquals((await res.json()).status, "canceled");
  assertEquals((sent[0].body as Any).status, "void");
  assertEquals(updates.at(-1)?.status, "canceled");
});

Deno.test("confirm on a non-submitted wire is a 409, and touches Blnk not at all", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db } = stubDb({ ...HELD_WIRE, status: "pending_approval" });

  const res = await postWireConfirm(req(), "w1", db, cfg, "r7", TEST_CTX);
  assertEquals(res.status, 409);
  assertEquals((await res.json()).type, "invalid_state");
  assertEquals(sent.length, 0, "must not call Blnk for an invalid transition");
});

Deno.test("re-confirming an already-completed wire replays instead of double-committing", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db } = stubDb({ ...HELD_WIRE, status: "completed" });

  const res = await postWireConfirm(req(), "w1", db, cfg, "r8", TEST_CTX);
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("Idempotent-Replayed"), "true");
  assertEquals(sent.length, 0, "must not re-commit an already-settled wire");
});

Deno.test("confirm rejects a partial amount greater than the held amount", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db } = stubDb(HELD_WIRE); // held = 500000

  const res = await postWireConfirm(req({ amount_cents: 600000 }), "w1", db, cfg, "r9", TEST_CTX);
  assertEquals(res.status, 400);
  assertEquals(sent.length, 0, "must not commit an over-amount");
});

Deno.test("confirm passes a valid partial amount through to the commit", async () => {
  const { cfg, sent } = stubCfg([json({ transaction_id: "txn_held", reference: "wire_transfer:w1", status: "APPLIED" })]);
  const { db } = stubDb(HELD_WIRE);

  const res = await postWireConfirm(req({ amount_cents: 250000 }), "w1", db, cfg, "r10", TEST_CTX);
  assertEquals(res.status, 200);
  // helper converts integer cents -> major units on the wire
  assertEquals((sent[0].body as Any).precise_amount, 250000); // integer minor units
});

Deno.test("confirm on an unknown wire is a 404", async () => {
  const { cfg } = stubCfg([]);
  const { db } = stubDb(null);
  const res = await postWireConfirm(req(), "nope", db, cfg, "r11", TEST_CTX);
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
      TEST_CTX,
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
    TEST_CTX,
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
      TEST_CTX,
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
  const upserts: { table: string; row: Record<string, unknown>; opts?: unknown }[] = [];
  let currentTable = "";
  const chain: Any = {
    select: () => chain,
    eq: () => chain,
    update: (p: Record<string, unknown>) => {
      updates.push(p);
      return chain;
    },
    insert: () => Promise.resolve({ data: null, error: null }),
    upsert: (row: Record<string, unknown>, opts?: unknown) => {
      upserts.push({ table: currentTable, row, opts });
      return Promise.resolve({ data: null, error: null });
    },
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

Deno.test("a completed wire accepts a return request and records the reason", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db, updates } = wireDbWithAccount(COMPLETED_WIRE);

  const res = await postWireReturn(req({ reason: "beneficiary fraud claim" }), "w1", db, cfg, "wr1", TEST_CTX);
  assertEquals(res.status, 200);
  assertEquals((await res.json()).status, "return_requested");
  assertEquals(updates.at(-1)?.status, "return_requested");
  assertEquals(updates.at(-1)?.return_reason, "beneficiary fraud claim");
  assertEquals(sent.length, 0, "requesting a return moves no money");
});

Deno.test("a return request without a reason is refused", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db } = wireDbWithAccount(COMPLETED_WIRE);
  const res = await postWireReturn(req({}), "w1", db, cfg, "wr2", TEST_CTX);
  assertEquals(res.status, 400);
  assertEquals(sent.length, 0);
});

Deno.test("a submitted (held) wire cannot be returned — cancel is the verb", async () => {
  const { cfg } = stubCfg([]);
  const { db } = wireDbWithAccount({ ...COMPLETED_WIRE, status: "submitted" });
  const res = await postWireReturn(req({ reason: "R" }), "w1", db, cfg, "wr3", TEST_CTX);
  assertEquals(res.status, 409);
  assertEquals((await res.json()).type, "invalid_state");
});

Deno.test("re-requesting a return replays instead of erroring", async () => {
  const { cfg } = stubCfg([]);
  const { db } = wireDbWithAccount({ ...COMPLETED_WIRE, status: "return_requested", return_reason: "R" });
  const res = await postWireReturn(req({ reason: "R" }), "w1", db, cfg, "wr4", TEST_CTX);
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

  const res = await postWireReturnResolve(req({ outcome: "accepted" }), "w1", db, cfg, "wr5", TEST_CTX);
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
    TEST_CTX,
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
  const res = await postWireReturnResolve(req({ outcome: "accepted" }), "w1", db, cfg, "wr7", TEST_CTX);
  assertEquals(res.status, 409);
});

Deno.test("resolve rejects an unknown outcome", async () => {
  const { cfg } = stubCfg([]);
  const { db } = wireDbWithAccount({ ...COMPLETED_WIRE, status: "return_requested" });
  const res = await postWireReturnResolve(req({ outcome: "maybe" }), "w1", db, cfg, "wr8", TEST_CTX);
  assertEquals(res.status, 400);
});

Deno.test("resolving an already-returned wire replays", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db } = wireDbWithAccount({ ...COMPLETED_WIRE, status: "returned" });
  const res = await postWireReturnResolve(req({ outcome: "accepted" }), "w1", db, cfg, "wr9", TEST_CTX);
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("Idempotent-Replayed"), "true");
  assertEquals(sent.length, 0, "a replay must never post a second reversal");
});

// ------------------------------------- movement artifacts (card-31 follow-up)
// Evidence rows land wherever money actually MOVES: confirm (commit) and an
// accepted return (compensating reversal). A cancel voids an unspent hold —
// no movement, no artifacts.

const HELD_WITH_ORIGINATOR = { ...HELD_WIRE, originator: { account_id: "acct_src" } };

Deno.test("wire confirm writes bookkeeping + wire_transfer.completed event", async () => {
  const { cfg } = stubCfg([json({ transaction_id: "txn_held", reference: "wire_transfer:w1", status: "APPLIED" })]);
  const { db, upserts } = stubDb(HELD_WITH_ORIGINATOR);

  await postWireConfirm(req(), "w1", db, cfg, "wa1", TEST_CTX);
  const bke = upserts.find((u) => u.table === "bookkeeping_entry");
  assertEquals(bke?.row.id, "bke_w1_completed");
  assertEquals(bke?.row.amount, 500000);
  const evt = upserts.find((u) => u.table === "event");
  assertEquals(evt?.row.id, "evt_w1_completed");
  assertEquals(evt?.row.code, "wire_transfer.completed");
  assertEquals(evt?.row.resource_id, "w1");
  assertEquals((evt?.row.payload as Any).amount_cents, 500000);
  assertEquals((evt?.opts as Any)?.ignoreDuplicates, true);
});

Deno.test("a partial confirm records the amount that actually moved", async () => {
  const { cfg } = stubCfg([json({ transaction_id: "txn_held", reference: "wire_transfer:w1", status: "APPLIED" })]);
  const { db, upserts } = stubDb(HELD_WITH_ORIGINATOR);

  await postWireConfirm(req({ amount_cents: 200000 }), "w1", db, cfg, "wa2", TEST_CTX);
  assertEquals(upserts.find((u) => u.table === "bookkeeping_entry")?.row.amount, 200000);
  assertEquals((upserts.find((u) => u.table === "event")?.row.payload as Any).amount_cents, 200000);
});

Deno.test("wire cancel moves no money and writes no artifacts", async () => {
  const { cfg } = stubCfg([json({ transaction_id: "txn_held", reference: "wire_transfer:w1", status: "VOID" })]);
  const { db, upserts } = stubDb(HELD_WITH_ORIGINATOR);

  await postWireCancel(req(), "w1", db, cfg, "wa3", TEST_CTX);
  assertEquals(upserts.length, 0, "voiding an unspent hold is not a money movement");
});

Deno.test("an accepted wire return writes its own reversal artifacts", async () => {
  const { cfg } = stubCfg([
    json({ transaction_id: "txn_rev", reference: "wire_transfer:w1:return", status: "APPLIED" }),
  ]);
  const { db, upserts } = wireDbWithAccount({
    ...COMPLETED_WIRE,
    status: "return_requested",
    return_reason: "beneficiary fraud claim",
  });

  await postWireReturnResolve(req({ outcome: "accepted" }), "w1", db, cfg, "wa4", TEST_CTX);
  const bke = upserts.find((u) => u.table === "bookkeeping_entry");
  assertEquals(bke?.row.id, "bke_w1_returned");
  const evt = upserts.find((u) => u.table === "event");
  assertEquals(evt?.row.id, "evt_w1_returned");
  assertEquals(evt?.row.code, "wire_transfer.returned");
  assertEquals((evt?.row.payload as Any).reason, "beneficiary fraud claim");
});

// -------------------------------------- partial-confirm residue (card 33)
// Found by the conservation sweep: confirming a wire for LESS than was held
// left the remainder in inflight_debit_balance forever — $600 of member money
// stranded with no path to release. A partial confirm is terminal (the wire
// settles for less), so the unconfirmed remainder must be VOIDED.

Deno.test("a partial confirm releases the unconfirmed remainder", async () => {
  const { cfg, sent } = stubCfg([
    json({ transaction_id: "txn_held", reference: "wire_transfer:w1", status: "APPLIED" }),
    json({ transaction_id: "txn_held", reference: "wire_transfer:w1", status: "VOID" }),
  ]);
  const { db } = stubDb(HELD_WITH_ORIGINATOR); // held 500000

  const res = await postWireConfirm(req({ amount_cents: 200000 }), "w1", db, cfg, "pr1", TEST_CTX);
  assertEquals(res.status, 200);
  assertEquals(sent.length, 2, "commit the partial, then void the remainder");
  assertEquals((sent[0].body as Any).status, "commit");
  assertEquals((sent[1].body as Any).status, "void");
});

Deno.test("a full confirm voids nothing — there is no remainder", async () => {
  const { cfg, sent } = stubCfg([
    json({ transaction_id: "txn_held", reference: "wire_transfer:w1", status: "APPLIED" }),
  ]);
  const { db } = stubDb(HELD_WITH_ORIGINATOR);

  await postWireConfirm(req(), "w1", db, cfg, "pr2", TEST_CTX);
  assertEquals(sent.length, 1, "nothing left to void after a full commit");
});

Deno.test("a confirm for exactly the held amount is a full confirm", async () => {
  const { cfg, sent } = stubCfg([
    json({ transaction_id: "txn_held", reference: "wire_transfer:w1", status: "APPLIED" }),
  ]);
  const { db } = stubDb(HELD_WITH_ORIGINATOR);

  await postWireConfirm(req({ amount_cents: 500000 }), "w1", db, cfg, "pr3", TEST_CTX);
  assertEquals(sent.length, 1, "amount == held must not trigger a void");
});

Deno.test("remainder release survives a transient void failure by retrying", async () => {
  // The conservation sweep caught the single-attempt release flaking: the void
  // can race the commit inside Blnk, the catch swallowed it, and the remainder
  // stranded anyway — the exact bug the fix was for, back as a coin-flip.
  const { cfg, sent } = stubCfg([
    json({ transaction_id: "txn_held", reference: "wire_transfer:w1", status: "APPLIED" }),
    json({ error: "still processing" }, 500),
    json({ transaction_id: "txn_held", reference: "wire_transfer:w1", status: "VOID" }),
  ]);
  const { db } = stubDb(HELD_WITH_ORIGINATOR);

  const res = await postWireConfirm(req({ amount_cents: 200000 }), "w1", db, cfg, "rt1", TEST_CTX);
  assertEquals(res.status, 200);
  assertEquals(sent.length, 3, "commit, failed void, retried void");
  assertEquals((sent[1].body as Any).status, "void");
  assertEquals((sent[2].body as Any).status, "void");
});

// ---------------------------------------------------- network reject (card 38)
//
// 'rejected' was in the status CHECK from the start, but the only way to reach
// it was a runGate block at prepare — i.e. WE refused. There was no path for
// the Fed or the beneficiary bank refusing a wire we had already submitted,
// which is the more common rejection in practice.

const voidedWire = () => json({ transaction_id: "txn_held", reference: "wire_transfer:w1", status: "VOID" });

Deno.test("reject VOIDS the hold and moves submitted -> rejected", async () => {
  const { cfg, sent } = stubCfg([voidedWire()]);
  const { db, updates } = stubDb({ ...HELD_WIRE, originator: { account_id: "acct_1" } });

  const res = await postWireReject(req({ reason: "beneficiary account closed" }), "w1", db, cfg, "j1", TEST_CTX);
  assertEquals(res.status, 200);
  assertEquals((await res.json()).status, "rejected");
  assertEquals((sent[0].body as Any).status, "void", "a rejected wire releases the hold");
  assertEquals(updates.at(-1)?.status, "rejected");
  assertEquals(updates.at(-1)?.return_reason, "beneficiary account closed");
});

Deno.test("reject requires a reason — an unexplained rejection is not auditable", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db } = stubDb(HELD_WIRE);
  const res = await postWireReject(req({}), "w1", db, cfg, "j2", TEST_CTX);
  assertEquals(res.status, 400);
  assertEquals((await res.json()).errors[0].field, "reason");
  assertEquals(sent.length, 0);
});

Deno.test("a COMPLETED wire cannot be rejected — it must be returned", async () => {
  // The critical distinction: rejection voids a hold, but a completed wire's
  // funds have already left for @FedWire. Voiding is not available; only a
  // compensating reversal is. Getting this wrong would silently no-op.
  const { cfg, sent } = stubCfg([]);
  const { db } = stubDb({ ...HELD_WIRE, status: "completed" });
  const res = await postWireReject(req({ reason: "too late" }), "w1", db, cfg, "j3", TEST_CTX);
  assertEquals(res.status, 409);
  const b = await res.json();
  assertEquals(b.type, "invalid_state");
  assert(b.detail.includes("returned"), "the error must point at the return path");
  assertEquals(sent.length, 0, "no ledger call on an invalid transition");
});

Deno.test("re-rejecting replays rather than double-voiding", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db } = stubDb({ ...HELD_WIRE, status: "rejected" });
  const res = await postWireReject(req({ reason: "dup notice" }), "w1", db, cfg, "j4", TEST_CTX);
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("Idempotent-Replayed"), "true");
  assertEquals(sent.length, 0);
});

Deno.test("reject books no money but emits the rejection event", async () => {
  const { cfg } = stubCfg([voidedWire()]);
  const { db, upserts } = stubDb({ ...HELD_WIRE, originator: { account_id: "acct_1" } });
  await postWireReject(req({ reason: "invalid routing number" }), "w1", db, cfg, "j5", TEST_CTX);

  const bke = upserts.find((u) => u.table === "bookkeeping_entry");
  assertEquals(bke?.row.amount, 0, "nothing moved — the hold was released");
  const evt = upserts.find((u) => u.table === "event");
  assertEquals(evt?.row.code, "wire_transfer.rejected");
  // downstream systems must learn the wire is dead, not still in flight
  assertEquals((evt?.row.payload as Any).reason, "invalid routing number");
  assertEquals((evt?.row.payload as Any).released_cents, 500000);
});


// ------------------------------------------------ EPS-06 dual control
//
// The prepare/confirm split was two CALLS, not two PEOPLE: anyone holding a
// token could prepare and immediately confirm. EPS-06 says wire dual control is
// REQUIRED, so these are the tests that corrected the API rather than the ones
// that describe it.

Deno.test("a wire awaiting its second approver cannot be confirmed", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db } = stubDb({ ...HELD_WIRE, dual_control_status: "required" });
  const res = await postWireConfirm(req(), "w1", db, cfg, "dc1", TEST_CTX);
  assertEquals(res.status, 409);
  const b = await res.json();
  assertEquals(b.type, "dual_control_required");
  assert(b.detail.includes("/approve"), "the refusal must say how to resolve it");
  assertEquals(sent.length, 0, "no money may move while approval is outstanding");
});

Deno.test("a wire the second approver REJECTED cannot be confirmed either", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db } = stubDb({ ...HELD_WIRE, dual_control_status: "rejected" });
  const res = await postWireConfirm(req(), "w1", db, cfg, "dc2", TEST_CTX);
  assertEquals(res.status, 409);
  assertEquals((await res.json()).type, "dual_control_rejected");
  assertEquals(sent.length, 0);
});

Deno.test("an UNASSESSED wire cannot be confirmed — unknown is not permission", async () => {
  // Wires are unconditional under EPS-06, so unassessed should never occur on
  // this rail; if it somehow does, it must not read as approval.
  const { cfg, sent } = stubCfg([]);
  const { db } = stubDb({ ...HELD_WIRE, dual_control_status: "unassessed" });
  assertEquals((await postWireConfirm(req(), "w1", db, cfg, "dc3", TEST_CTX)).status, 409);
  assertEquals(sent.length, 0);
});

Deno.test("prepare records the originator and marks dual control required", async () => {
  const { cfg } = stubCfg([
    // runGate reads the balance FIRST (CG-NSF-01); without this the gate blocks
    // on insufficient funds and prepare never reaches the approval record
    json({ balance: 5_000_00 }),
    json({ transaction_id: "txn_1", reference: "wire_transfer:w1", status: "INFLIGHT" }),
  ]);
  const { db, inserts } = stubApiDb({
    account: {
      id: "acct_1", account_type: "checking", balance: 5_000_00,
      blnk_ledger_id: "l", blnk_balance_id: "b", balance_synced_at: null,
      lock_type: null, status: "open", created_at: new Date().toISOString(),
    },
    row: { id: "w1", amount: 1000, status: "submitted", beneficiary: {} },
  });
  await postWirePrepare(
    req({ source_account_id: "acct_1", amount_cents: 1000, beneficiary: { name: "A", country: "US" } }),
    db, cfg, "dc4", TEST_CTX,
  );
  // find by CONTENT: prepare writes the row and then patches it with the Blnk
  // mirror, so the first wire_transfer write is not necessarily the one under
  // test here
  const wire = inserts.find((i) => i.table === "wire_transfer" && "dual_control_status" in i.row)?.row;
  assertEquals(wire?.dual_control_status, "required");
  assertEquals(wire?.created_by, "tok_test", "the originator is captured at origination");
  // and the maker-checker record is opened at the same moment
  const appr = inserts.find((i) => i.table === "payment_approval");
  assertEquals(appr?.row.created_by, "tok_test");
});
