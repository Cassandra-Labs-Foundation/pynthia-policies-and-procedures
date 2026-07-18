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
