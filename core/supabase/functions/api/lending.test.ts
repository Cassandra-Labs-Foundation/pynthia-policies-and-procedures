// Loan origination spine — LP-03, LP-07, LP-11.
//
// The negatives here are regulatory deadlines and unscreened parties, both of
// which are absences: an ECOA notice nobody sent and a borrower nobody screened
// each produce no event of their own.
import { assert, assertEquals } from "jsr:@std/assert@1";
import {
  ecoaNoticeDueAt,
  fundingPermitted,
  isAdverse,
  postAanIssue,
  postLendingSweep,
  postLoanDecision,
  postLoanParty,
} from "./lending.ts";
import { type Any, OPS_CTX, req } from "./test_helpers.ts";

function lendDb(rows: Record<string, Record<string, unknown>[]>) {
  const writes: { schema: string; table: string; op: string; row: Any }[] = [];
  let schema = "core";
  const from = (table: string) => {
    const filters: { col: string; val: unknown }[] = [];
    const chain: Any = {
      select: () => chain,
      eq: (col: string, val: unknown) => (filters.push({ col, val }), chain),
      is: (col: string, val: unknown) => (filters.push({ col, val }), chain),
      lt: () => chain,
      order: () => chain,
      limit: () => chain,
      insert: (row: Any) => (writes.push({ schema, table, op: "insert", row }), Promise.resolve({ error: null })),
      upsert: (row: Any) => (writes.push({ schema, table, op: "upsert", row }), Promise.resolve({ error: null })),
      update: (patch: Any) => {
        writes.push({ schema, table, op: "update", row: patch });
        const p: Any = Promise.resolve({ error: null });
        p.eq = () => p;
        return p;
      },
      maybeSingle: () => Promise.resolve({
        data: (rows[table] ?? []).find((r) => filters.every((f) => r[f.col] === f.val)) ?? null,
        error: null,
      }),
      then: (res: (v: unknown) => unknown) => res({
        data: (rows[table] ?? []).filter((r) =>
          filters.every((f) => f.val === null ? r[f.col] == null : r[f.col] === f.val)
        ),
        error: null,
      }),
    };
    return chain;
  };
  const db: Any = { schema: (s: string) => (schema = s, { from }) };
  return { db, writes };
}

const COMPLETED = "2026-06-01T00:00:00.000Z";
const app = (o: Record<string, unknown> = {}) => ({
  id: "app_1", status: "completed", completed_at: COMPLETED,
  decisioned_at: null, final_action: null, funding_block_state: "open", ...o,
});

// -------------------------------------------------------------- the clock

Deno.test("the ECOA clock runs from COMPLETION, not from the decision", () => {
  // Anchoring on the decision date would let a slow decision silently extend
  // the notice deadline — the SAR-clock failure shape, again.
  assertEquals(ecoaNoticeDueAt(COMPLETED).slice(0, 10), "2026-07-01");
});

Deno.test("counteroffer and incomplete are adverse; approved is not", () => {
  assertEquals(isAdverse("denied"), true);
  assertEquals(isAdverse("counteroffer"), true);
  assertEquals(isAdverse("incomplete"), true);
  assertEquals(isAdverse("approved"), false);
  assertEquals(isAdverse("withdrawn"), false);
});

// ------------------------------------------------------ decision + notice

Deno.test("an adverse decision without SPECIFIC reasons is refused", async () => {
  // Demanded at decision time, because reconstructing reasons later is exactly
  // what produces boilerplate.
  const { db, writes } = lendDb({ loan_application: [app()] });
  for (const body of [{ final_action: "denied" }, { final_action: "denied", reasons: [] }]) {
    const res = await postLoanDecision(req(body), "app_1", db, "l1", OPS_CTX);
    assertEquals(res.status, 400);
    assertEquals((await res.json()).errors[0].field, "reasons");
  }
  assertEquals(writes.length, 0);
});

Deno.test("a denial queues an AAN anchored on the completion date", async () => {
  const { db, writes } = lendDb({ loan_application: [app()] });
  const res = await postLoanDecision(
    req({ final_action: "denied", reasons: ["insufficient income"] }), "app_1", db, "l2", OPS_CTX,
  );
  assertEquals(res.status, 200);
  const b = await res.json();
  assertEquals(b.adverse_action_notice.notice_due_at.slice(0, 10), "2026-07-01");
  const aan = writes.find((w) => w.table === "adverse_action_notice")!.row;
  assertEquals(aan.application_completed_at, COMPLETED);
  const codes = writes.filter((w) => w.table === "event").map((w) => w.row.code);
  assert(codes.includes("aan.queued"));
  assert(codes.includes("application.final_action.recorded"));
});

Deno.test("an approval queues no notice", async () => {
  const { db, writes } = lendDb({ loan_application: [app()] });
  const b = await (await postLoanDecision(
    req({ final_action: "approved" }), "app_1", db, "l3", OPS_CTX,
  )).json();
  assertEquals(b.adverse_action_notice, null);
  assertEquals(writes.filter((w) => w.table === "adverse_action_notice").length, 0);
});

Deno.test("an INCOMPLETE application cannot be decisioned — the clock has no anchor", async () => {
  const { db, writes } = lendDb({ loan_application: [app({ completed_at: null })] });
  const res = await postLoanDecision(
    req({ final_action: "denied", reasons: ["x"] }), "app_1", db, "l4", OPS_CTX,
  );
  assertEquals(res.status, 409);
  assertEquals((await res.json()).type, "application_incomplete");
  assertEquals(writes.length, 0);
});

Deno.test("re-decisioning replays rather than overwriting the first decision", async () => {
  const { db, writes } = lendDb({
    loan_application: [app({ decisioned_at: "2026-06-05T00:00:00Z", final_action: "approved" })],
  });
  const res = await postLoanDecision(
    req({ final_action: "denied", reasons: ["changed mind"] }), "app_1", db, "l5", OPS_CTX,
  );
  assertEquals(res.headers.get("Idempotent-Replayed"), "true");
  assertEquals(writes.length, 0);
});

// ------------------------------------------- LP-07 second review (four-eyes)

const AAN = (o: Record<string, unknown> = {}) => ({
  id: "aan_app_1", loan_application_id: "app_1",
  reviewed_by: null, reviewed_at: null, issued_at: null,
  notice_due_at: "2026-07-01T00:00:00.000Z", ...o,
});

Deno.test("an unreviewed notice cannot be issued", async () => {
  const { db, writes } = lendDb({ adverse_action_notice: [AAN()] });
  const res = await postAanIssue(req({}), "aan_app_1", db, "l6", OPS_CTX);
  assertEquals(res.status, 409);
  assertEquals((await res.json()).type, "second_review_required");
  assertEquals(writes.length, 0, "an issued notice cannot be recalled");
});

Deno.test("the reviewer cannot also issue — four-eyes, third instance", async () => {
  const { db, writes } = lendDb({
    adverse_action_notice: [AAN({ reviewed_by: "tok_ops", reviewed_at: "2026-06-10T00:00:00Z" })],
  });
  const res = await postAanIssue(req({}), "aan_app_1", db, "l7", OPS_CTX);
  assertEquals(res.status, 409);
  assertEquals((await res.json()).type, "four_eyes_violation");
  assertEquals(writes.length, 0);
});

Deno.test("a different actor may issue a reviewed notice, and lateness is recorded", async () => {
  const { db, writes } = lendDb({
    adverse_action_notice: [AAN({ reviewed_by: "tok_reviewer", reviewed_at: "2026-06-10T00:00:00Z" })],
  });
  const res = await postAanIssue(req({}), "aan_app_1", db, "l8", OPS_CTX);
  assertEquals(res.status, 200);
  const b = await res.json();
  assertEquals(b.reviewed_by, "tok_reviewer");
  assertEquals(b.issued_by, "tok_ops");
  assertEquals(b.issued_late, true, "issued after 2026-07-01");
  assertEquals(writes.find((w) => w.table === "event")!.row.payload.late, true);
});

// ------------------------------------------------------ LP-11 OFAC gate

Deno.test("a clean party screens clear and does not block funding", async () => {
  const { db, writes } = lendDb({ loan_application: [app()] });
  const b = await (await postLoanParty(
    req({ role: "borrower", party_name: "Ada Member" }), "app_1", db, "l9", OPS_CTX,
  )).json();
  assertEquals(b.ofac_status, "clear");
  assertEquals(b.funding_blocked, false);
  assertEquals(writes.filter((w) => w.table === "loan_application").length, 0);
});

Deno.test("a potential match BLOCKS funding and raises an alert", async () => {
  const { db, writes } = lendDb({ loan_application: [app()] });
  const b = await (await postLoanParty(
    req({ role: "guarantor", party_name: "SDN Holdings" }), "app_1", db, "l10", OPS_CTX,
  )).json();
  assertEquals(b.ofac_status, "potential_match");
  assertEquals(b.funding_blocked, true);
  assertEquals(writes.find((w) => w.table === "loan_application")?.row.funding_block_state, "blocked");
  assertEquals(writes.find((w) => w.table === "bsa_alert")?.row.alert_type, "ofac");
});

Deno.test("every screened party records that its list version is unknown (OQ-02)", async () => {
  // The stub screen has no versioned list, so no screen here can be
  // re-verified. Stated on the row and in the response rather than only in a
  // document, so the gap is visible in the data.
  const { db, writes } = lendDb({ loan_application: [app()] });
  const b = await (await postLoanParty(
    req({ role: "borrower", party_name: "Ada Member" }), "app_1", db, "l11", OPS_CTX,
  )).json();
  assertEquals(b.ofac_list_version, null);
  assert(b.screening_caveat.includes("cannot be re-verified"));
  assertEquals(writes.find((w) => w.table === "loan_party")?.row.ofac_list_version, null);
});

Deno.test("UNSCREENED is not fundable — absence of a screen is not a clean screen", () => {
  assertEquals(fundingPermitted([{ ofac_status: "clear" }]), true);
  assertEquals(fundingPermitted([{ ofac_status: "cleared_after_review" }]), true);
  assertEquals(fundingPermitted([{ ofac_status: "unscreened" }]), false);
  assertEquals(fundingPermitted([{ ofac_status: "potential_match" }]), false);
  // one bad party spoils the application
  assertEquals(fundingPermitted([{ ofac_status: "clear" }, { ofac_status: "unscreened" }]), false);
});

// ---------------------------------------------------------- the sweep

Deno.test("an ECOA notice nobody sent is surfaced", async () => {
  const { db, writes } = lendDb({
    adverse_action_notice: [AAN({ notice_due_at: "2020-01-01T00:00:00Z" })],
    loan_party: [], loan_application: [],
  });
  const b = await (await postLendingSweep(req({}), db, "l12", OPS_CTX)).json();
  assertEquals(b.overdue_notice_count, 1);
  assertEquals(writes.find((w) => w.table === "event")!.row.code, "aan.notice_overdue");
});

Deno.test("unscreened parties are reported as a standing gap", async () => {
  const { db } = lendDb({
    adverse_action_notice: [],
    loan_party: [{ id: "p1", loan_application_id: "app_1", role: "borrower", ofac_status: "unscreened" }],
    loan_application: [],
  });
  const b = await (await postLendingSweep(req({}), db, "l13", OPS_CTX)).json();
  assertEquals(b.unscreened_parties, 1);
  assert(b.warning.includes("unscreened is not clear"));
});

Deno.test("a clean sweep reports zero with no warning", async () => {
  const { db } = lendDb({ adverse_action_notice: [], loan_party: [], loan_application: [] });
  const b = await (await postLendingSweep(req({}), db, "l14", OPS_CTX)).json();
  assertEquals(b.overdue_notice_count, 0);
  assertEquals(b.warning, undefined);
});

Deno.test("the sim path writes only to sim, stamped simulated", async () => {
  const { db, writes } = lendDb({ loan_application: [app()] });
  await postLoanParty(req({ role: "borrower", party_name: "Ada" }), "app_1", db, "s1", OPS_CTX, "sim");
  assert(writes.length > 0);
  for (const w of writes) {
    assertEquals(w.schema, "sim");
    if (w.op !== "update") assertEquals(w.row.provenance, "simulated");
  }
});
