// Unit + behavioral tests for the card writer.
//
// Cards carry the riskiest arithmetic in the API: a hold is drawn down across
// several captures, so the running total, the remaining balance and the
// terminal transition all have to agree. The compliance harness proves the
// happy path end-to-end; these prove the edges that are painful to reach
// against a live ledger (exact-boundary capture, over-capture by one cent,
// capture after reversal).
import { assert, assertEquals } from "jsr:@std/assert@1";
import { postCardCapture, postCardReverse } from "./cards.ts";
import { type Any, json, req, stubCfg, stubDb } from "./test_helpers.ts";

const AUTH = {
  id: "cauth_1",
  amount: 100000, // $1,000 authorized
  status: "authorized",
  merchant: "Acme Coffee",
  decline_reason: null,
  blnk_inflight_id: "txn_hold",
  blnk_committed_amount: 0,
  blnk_reference: "card_authorization:cauth_1",
  blnk_status: "INFLIGHT",
  created_at: "2026-07-18T00:00:00Z",
};

const committed = () => json({ transaction_id: "txn_hold", reference: "card_authorization:cauth_1", status: "APPLIED" });

// ----------------------------------------------------------- capture amounts

Deno.test("capture with no body captures the entire remaining hold", async () => {
  const { cfg, sent } = stubCfg([committed()]);
  const { db } = stubDb(AUTH);

  const res = await postCardCapture(req(), "cauth_1", db, cfg, "r1");
  assertEquals(res.status, 200);
  const b = await res.json();
  assertEquals(b.status, "captured");
  assertEquals(b.captured_cents, 100000);
  assertEquals(b.remaining_cents, 0);
  // integer minor units on the wire — floats never touch the money path
  assertEquals((sent[0].body as Any).precise_amount, 100000);
  assertEquals((sent[0].body as Any).amount, undefined);
});

Deno.test("partial capture moves to partially_captured and tracks the remainder", async () => {
  const { cfg } = stubCfg([committed()]);
  const { db } = stubDb(AUTH);

  const res = await postCardCapture(req({ amount_cents: 30000 }), "cauth_1", db, cfg, "r2");
  const b = await res.json();
  assertEquals(b.status, "partially_captured");
  assertEquals(b.captured_cents, 30000);
  assertEquals(b.remaining_cents, 70000);
});

Deno.test("incremental capture accumulates onto what was already captured", async () => {
  const { cfg } = stubCfg([committed()]);
  // $300 already drawn down; capture $700 more to close it out exactly
  const { db } = stubDb({ ...AUTH, status: "partially_captured", blnk_committed_amount: 30000 });

  const res = await postCardCapture(req({ amount_cents: 70000 }), "cauth_1", db, cfg, "r3");
  const b = await res.json();
  assertEquals(b.status, "captured", "exact-boundary capture must be terminal, not partial");
  assertEquals(b.captured_cents, 100000);
  assertEquals(b.remaining_cents, 0);
});

Deno.test("over-capture by a single cent is refused, and never reaches Blnk", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db } = stubDb({ ...AUTH, status: "partially_captured", blnk_committed_amount: 30000 });

  // remaining is 70000; ask for one cent more
  const res = await postCardCapture(req({ amount_cents: 70001 }), "cauth_1", db, cfg, "r4");
  assertEquals(res.status, 422);
  assertEquals((await res.json()).type, "capture_exceeds_authorization");
  assertEquals(sent.length, 0, "must not commit an over-capture");
});

Deno.test("capture is refused for non-positive or non-integer amounts", async () => {
  const { cfg, sent } = stubCfg([]);
  for (const amount of [0, -1, 12.5]) {
    const { db } = stubDb(AUTH);
    const res = await postCardCapture(req({ amount_cents: amount }), "cauth_1", db, cfg, "r5");
    assertEquals(res.status, 400, `amount ${amount} must be rejected`);
  }
  assertEquals(sent.length, 0);
});

// -------------------------------------------------------- state transitions

Deno.test("re-capturing an already-captured authorization replays, never double-commits", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db } = stubDb({ ...AUTH, status: "captured", blnk_committed_amount: 100000 });

  const res = await postCardCapture(req(), "cauth_1", db, cfg, "r6");
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("Idempotent-Replayed"), "true");
  assertEquals(sent.length, 0, "a settled authorization must not be captured again");
});

Deno.test("capturing a reversed authorization is a 409, not a silent no-op", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db } = stubDb({ ...AUTH, status: "reversed" });

  const res = await postCardCapture(req(), "cauth_1", db, cfg, "r7");
  assertEquals(res.status, 409);
  assertEquals((await res.json()).type, "invalid_state");
  assertEquals(sent.length, 0);
});

Deno.test("capturing a declined authorization is a 409", async () => {
  const { cfg } = stubCfg([]);
  const { db } = stubDb({ ...AUTH, status: "declined", blnk_inflight_id: null });
  const res = await postCardCapture(req(), "cauth_1", db, cfg, "r8");
  assertEquals(res.status, 409);
});

Deno.test("capture on an unknown authorization is a 404", async () => {
  const { cfg } = stubCfg([]);
  const { db } = stubDb(null);
  assertEquals((await postCardCapture(req(), "nope", db, cfg, "r9")).status, 404);
});

// ------------------------------------------------------------------ reversal

Deno.test("reverse voids the hold and retains the already-captured amount", async () => {
  const { cfg, sent } = stubCfg([json({ transaction_id: "txn_hold", reference: "card_authorization:cauth_1", status: "VOID" })]);
  const { db, updates } = stubDb({ ...AUTH, status: "partially_captured", blnk_committed_amount: 20000 });

  const res = await postCardReverse(req({ reason: "merchant cancelled" }), "cauth_1", db, cfg, "r10");
  assertEquals(res.status, 200);
  const b = await res.json();
  assertEquals(b.status, "reversed");
  assertEquals(b.captured_cents, 20000, "reversal must not claw back a completed capture");
  assertEquals((sent[0].body as Any).status, "void");
  assertEquals(updates.at(-1)?.decline_reason, "merchant cancelled");
});

Deno.test("re-reversing replays instead of voiding twice", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db } = stubDb({ ...AUTH, status: "reversed" });

  const res = await postCardReverse(req(), "cauth_1", db, cfg, "r11");
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("Idempotent-Replayed"), "true");
  assertEquals(sent.length, 0);
});

Deno.test("reversing a fully captured authorization is a 409 — nothing is held", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db } = stubDb({ ...AUTH, status: "captured", blnk_committed_amount: 100000 });

  const res = await postCardReverse(req(), "cauth_1", db, cfg, "r12");
  assertEquals(res.status, 409);
  assert(sent.length === 0, "must not void a hold that was fully drawn down");
});

// ------------------------------------- movement artifacts (card-31 follow-up)
// Each CAPTURE is its own money movement, so each gets its own evidence pair.
// The id embeds the post-capture running total: a resume retry of the same
// capture converges on the same rows, while a further incremental capture gets
// new ones. Authorize (hold) and reverse (void of the remainder) move nothing.

const AUTH_WITH_ORIGINATOR = { ...AUTH, originator: { account_id: "acct_src" } };

Deno.test("a capture writes bookkeeping + captured event keyed by running total", async () => {
  const { cfg } = stubCfg([committed()]);
  const { db, upserts } = stubDb(AUTH_WITH_ORIGINATOR);

  await postCardCapture(req({ amount_cents: 30000 }), "cauth_1", db, cfg, "ca1");
  const bke = upserts.find((u) => u.table === "bookkeeping_entry");
  assertEquals(bke?.row.id, "bke_cauth_1_captured_c30000");
  assertEquals(bke?.row.amount, 30000, "the entry books the DELTA, not the total");
  const evt = upserts.find((u) => u.table === "event");
  assertEquals(evt?.row.id, "evt_cauth_1_captured_c30000");
  assertEquals(evt?.row.code, "card_authorization.captured");
  const payload = evt?.row.payload as Any;
  assertEquals(payload.captured_cents, 30000);
  assertEquals(payload.captured_total_cents, 30000);
  assertEquals(payload.remaining_cents, 70000);
});

Deno.test("an incremental capture gets a distinct evidence pair", async () => {
  const { cfg } = stubCfg([committed()]);
  const { db, upserts } = stubDb({
    ...AUTH_WITH_ORIGINATOR,
    status: "partially_captured",
    blnk_committed_amount: 30000,
  });

  await postCardCapture(req({ amount_cents: 70000 }), "cauth_1", db, cfg, "ca2");
  const bke = upserts.find((u) => u.table === "bookkeeping_entry");
  assertEquals(bke?.row.id, "bke_cauth_1_captured_c100000");
  assertEquals(bke?.row.amount, 70000);
  assertEquals((upserts.find((u) => u.table === "event")?.row.payload as Any).captured_total_cents, 100000);
});

Deno.test("reverse releases the remainder and books nothing", async () => {
  const { cfg } = stubCfg([json({ transaction_id: "txn_hold", reference: "card_authorization:cauth_1", status: "VOID" })]);
  const { db, upserts } = stubDb({ ...AUTH_WITH_ORIGINATOR, status: "partially_captured", blnk_committed_amount: 20000 });

  await postCardReverse(req({ reason: "merchant cancelled" }), "cauth_1", db, cfg, "ca3");
  assertEquals(upserts.length, 0, "voiding the uncaptured remainder moves no money");
});
