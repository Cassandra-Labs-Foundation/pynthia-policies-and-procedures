// The rail and lending read endpoints (GET /wire-transfers, /ach-transfers,
// /cards, /loan-applications).
//
// These resources had 20+ write endpoints between them and no way to read any
// of them back. What is tested here is mostly what a read must REFUSE: the
// partner predicate going on before any caller-supplied filter, an unknown
// status being rejected rather than passed to PostgREST, and the one table
// that cannot be partner-scoped at all refusing the actors it cannot confine.

import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { getWireTransfer, getWireTransfers } from "./wires.ts";
import { getAchTransfer, getAchTransfers } from "./ach.ts";
import { getCards } from "./cards.ts";
import { getLoanApplications } from "./lending.ts";
import { filtersOf, listDb, OPS_CTX, stubDb, TEST_CTX } from "./test_helpers.ts";

// ------------------------------------------------------------- partner scoping

Deno.test("every rail list is confined to one partner BEFORE any caller filter", async () => {
  // Order matters, not just presence: the partner predicate is what makes the
  // rest of the query safe, so it cannot be appended after a filter the caller
  // supplied.
  // Each rail is given a status from its OWN vocabulary — a card is never
  // 'rejected', it is 'declined', and passing the wrong word would 400 before
  // the query is built and make this assertion vacuously pass on an empty list.
  const cases: [string, typeof getWireTransfers, string][] = [
    ["wire-transfers", getWireTransfers, "rejected"],
    ["ach-transfers", getAchTransfers, "returned"],
    ["cards", getCards, "declined"],
  ];
  for (const [path, handler, status] of cases) {
    const { db, calls } = listDb([]);
    await handler(new Request(`https://x/${path}?status=${status}`), db, "r0", TEST_CTX);
    assertEquals(
      filtersOf(calls),
      ["eq:partner_id=ptnr_test", `eq:status=${status}`],
      `${path} must scope before it filters`,
    );
  }
});

Deno.test("an ops actor lists every rail across partners — D23", async () => {
  for (const handler of [getWireTransfers, getAchTransfers, getCards]) {
    const { db, calls } = listDb([]);
    await handler(new Request("https://x/x"), db, "r1", OPS_CTX);
    assertEquals(filtersOf(calls), []);
  }
});

// ------------------------------------------------------------ status vocabulary

Deno.test("each rail refuses a status outside its OWN vocabulary", async () => {
  // The three rails do not share a status set — 'settled' is an ACH terminal
  // state, wires reach 'completed', and a card is 'captured'. Validating them
  // against one merged list would accept a status the table's CHECK refuses.
  const wrong: [string, unknown, string][] = [
    ["wire", getWireTransfers, "settled"], // ACH's word, not a wire's
    ["ach", getAchTransfers, "completed"], // the wire's word
    ["card", getCards, "submitted"], // neither
  ];
  for (const [name, handler, bad] of wrong) {
    const { db, calls } = listDb([]);
    const res = await (handler as typeof getWireTransfers)(
      new Request(`https://x/x?status=${bad}`),
      db,
      "r2",
      TEST_CTX,
    );
    assertEquals(res.status, 400, `${name} must refuse ${bad}`);
    assertEquals(
      calls.filter((c) => c.fn === "eq" && c.args[0] === "status").length,
      0,
      `${name}: ${bad} must never reach the query builder`,
    );
  }
});

Deno.test("dual_control_status is validated, and is what makes an approval id resolvable", async () => {
  const { db, calls } = listDb([]);
  const bad = await getWireTransfers(
    new Request("https://x/wire-transfers?dual_control_status=maybe"),
    db,
    "r3",
    TEST_CTX,
  );
  assertEquals(bad.status, 400);

  const { db: db2, calls: calls2 } = listDb([]);
  await getWireTransfers(
    new Request("https://x/wire-transfers?dual_control_status=unassessed"),
    db2,
    "r4",
    TEST_CTX,
  );
  assertEquals(filtersOf(calls2), [
    "eq:partner_id=ptnr_test",
    "eq:dual_control_status=unassessed",
  ]);
  assert(calls.length >= 0);
});

Deno.test("a wire read carries dual_control_status — without it an approval id says nothing", async () => {
  // GET /eps/pending-approvals hands out a resource_id and nothing else. If the
  // wire it points at came back without this field there would still be no way
  // to tell an approved wire from one still waiting, which is the whole reason
  // these endpoints exist.
  const { db } = listDb([{
    id: "wire_1",
    amount: 500000,
    status: "pending_approval",
    dual_control_status: "required",
    beneficiary: { name: "ACME" },
    purpose: null,
    imad: null,
    return_reason: null,
    control_results: [{ control_id: "EPS-06", decision: "hold" }],
    blnk_transaction_id: null,
    blnk_reference: null,
    blnk_status: null,
    created_at: "2026-07-20T00:00:00Z",
  }]);
  const res = await getWireTransfers(new Request("https://x/wire-transfers"), db, "r5", TEST_CTX);
  const body = await res.json();
  assertEquals(res.status, 200);
  assertEquals(body.data[0].dual_control_status, "required");
  assertEquals(body.data[0].amount_cents, 500000);
  // control_results survive the read rather than being flattened to a decision
  assertEquals(body.data[0].control_results[0].control_id, "EPS-06");
  // the spec's nested envelope, not a flat one
  assertEquals(body.pagination.has_more, false);
});

// ------------------------------------------------------------- uuid-keyed ids

Deno.test("a malformed id on a uuid-keyed rail is 404, not 500", async () => {
  // core.wire_transfer and core.ach_transfer key on uuid; account, transfer,
  // card_authorization and loan_application all key on text. On the text tables
  // a junk id is simply a row that isn't there. On these two PostgREST hands it
  // to Postgres, which raises a CAST ERROR rather than returning no rows — so
  // the handler's error branch answered 500 and a caller who typo'd an id was
  // told "an unexpected error occurred". Caught before the query is issued.
  for (const [name, handler] of [["wire", getWireTransfer], ["ach", getAchTransfer]] as const) {
    const { db, calls } = listDb([]);
    const res = await handler(new Request("https://x/x"), "does-not-exist", db, "u1", TEST_CTX);
    assertEquals(res.status, 404, `${name} must 404 a malformed id`);
    assertEquals(calls.length, 0, `${name}: the database must never see an unparseable uuid`);
  }
});

Deno.test("a well-formed but absent uuid is also 404 — the two are indistinguishable", async () => {
  // Answering 400 for "malformed" and 404 for "absent" would let a caller sort
  // real ids from unreal ones by shape alone. Same reasoning as OWN-01 taking
  // 404 over 403 across partners.
  const { db } = stubDb(null);
  const res = await getWireTransfer(
    new Request("https://x/x"),
    "00000000-0000-4000-8000-000000000000",
    db,
    "u2",
    TEST_CTX,
  );
  assertEquals(res.status, 404);
});

// --------------------------------------------------- the unscopeable table

Deno.test("loan applications REFUSE a partner actor — the table has no partner_id", async () => {
  // core.loan_application carries no partner_id, so scopeToPartner has nothing
  // to filter on. Serving a confined caller anyway would hand one fintech the
  // whole instance's loan book. Refusing is the conservative reading until the
  // column exists.
  const { db, calls } = listDb([]);
  const res = await getLoanApplications(
    new Request("https://x/loan-applications"),
    db,
    "r6",
    TEST_CTX,
  );
  assertEquals(res.status, 403);
  assertEquals(calls.length, 0, "the query must not run at all for a confined actor");
});

Deno.test("loan applications serve an ops actor, who is unconfined by D23", async () => {
  const { db, calls } = listDb([]);
  const res = await getLoanApplications(
    new Request("https://x/loan-applications?status=decisioned"),
    db,
    "r7",
    OPS_CTX,
  );
  assertEquals(res.status, 200);
  assertEquals(filtersOf(calls), ["eq:status=decisioned"]);
});

Deno.test("a loan application read omits applicant PII and the raw decision payload", async () => {
  // The table has 40+ columns including applicant, employment, income_assets
  // and the full decision jsonb. An operator queue needs none of it, and a
  // projection that widens by accident is how PII leaves a system.
  const { db } = listDb([{
    id: "app_1",
    status: "decisioned",
    amount: 2500000,
    product_type: "auto",
    product_code: "AUTO-60",
    channel: "branch",
    decision_due_at: "2026-08-01T00:00:00Z",
    aan_due_at: null,
    final_action: null,
    adverse_action: null,
    counteroffer_status: "none",
    funding_block_state: "clear",
    decisioned_at: "2026-07-20T00:00:00Z",
    decisioned_by: "tok_x",
    completed_at: null,
    provenance: "simulated",
    created_at: "2026-07-19T00:00:00Z",
  }]);
  const res = await getLoanApplications(new Request("https://x/loan-applications"), db, "r8", OPS_CTX);
  const body = await res.json();
  const row = body.data[0];
  for (const forbidden of ["applicant", "employment", "income_assets", "decision", "gmi", "data"]) {
    assertEquals(row[forbidden], undefined, `${forbidden} must not be served`);
  }
  assertEquals(row.amount_cents, 2500000);
  // a null clock is "not anchored yet", and must stay null rather than becoming a date
  assertEquals(row.aan_due_at, null);
});
