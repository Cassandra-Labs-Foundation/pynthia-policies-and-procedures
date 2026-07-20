// Complaints and Reg E disputes — CO-06, FL-13, MP-04, PR-10.
//
// The load-bearing negatives: a complaint resolved with no root cause (which
// silently empties the trend analysis three policies depend on), a complaint
// resolved before the member was told, a dispute closed with no findings, and a
// trend threshold nobody set.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { makeDrillDb } from "../drill/fake_db.ts";
import { OPS_CTX, req } from "./test_helpers.ts";
import {
  ACK_DAYS,
  PROVISIONAL_CREDIT_DAYS,
  REGULATOR_FINAL_RESPONSE_DAYS,
  postComplaint,
  postComplaintAcknowledge,
  postComplaintBoardReport,
  postComplaintResolve,
  postComplaintResponse,
  postComplaintTrend,
  postDispute,
  postDisputeResolve,
  postProvisionalCredit,
} from "./complaints.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
const CTX = OPS_CTX;
const codes = (rows: Record<string, Any[]>) =>
  (rows["core.event"] ?? []).map((e) => String(e.code));

const intake = (o: Record<string, unknown> = {}) => req({
  channel: "direct", category: "fees", member_id: "m1",
  narrative: "charged twice", received_at: "2026-07-01T00:00:00.000Z",
  entity_contact: { email: "m1@example.test" }, ...o,
});

async function seedOne(o: Record<string, unknown> = {}) {
  const dbx = makeDrillDb();
  await postComplaint(intake(o), dbx.client, "t", CTX);
  return { dbx, db: dbx.client, id: String(dbx.rows["core.complaint"][0].id) };
}

// ------------------------------------------------------------------ intake

Deno.test("CO-06: every clock starts at RECEIPT, not at triage", async () => {
  const { dbx } = await seedOne();
  const c = dbx.rows["core.complaint"][0];
  // The SUPPLIED receipt time must be the anchor. Comparing the interval alone
  // is not enough — if the writer ignored `received_at` and used `now`, the
  // interval would still be five days and the test would pass while a complaint
  // that sat in an inbox for a week silently got its deadline reset.
  assertEquals(String(c.received_at), "2026-07-01T00:00:00.000Z");
  const recv = new Date(String(c.received_at)).getTime();
  assertEquals(
    new Date(String(c.ack_due_at)).getTime() - recv,
    ACK_DAYS * 24 * 60 * 60 * 1000,
  );
  assertEquals(String(c.ack_due_at), "2026-07-06T00:00:00.000Z");
});

Deno.test("CO-06: a complaint with no valid CATEGORY is refused", async () => {
  const dbx = makeDrillDb();
  // four separate policies read this register by category, so absent is not an
  // option even though "other" is
  assertEquals(
    (await postComplaint(
      req({ channel: "phone", narrative: "x" }), dbx.client, "t", CTX,
    )).status,
    400,
  );
  assertEquals(
    (await postComplaint(
      req({ channel: "phone", category: "not_a_category", narrative: "x" }),
      dbx.client, "t", CTX,
    )).status,
    400,
  );
  assertEquals((dbx.rows["core.complaint"] ?? []).length, 0);
});

Deno.test("CO-06: a complaint with no narrative is refused", async () => {
  const dbx = makeDrillDb();
  const res = await postComplaint(
    req({ channel: "phone", category: "service" }), dbx.client, "t", CTX,
  );
  assertEquals(res.status, 400);
  assertEquals((dbx.rows["core.complaint"] ?? []).length, 0);
});

Deno.test("CO-06: a regulator complaint must name the regulator and gets the longer clock", async () => {
  const dbx = makeDrillDb();
  assertEquals(
    (await postComplaint(
      req({ channel: "regulator", category: "other", narrative: "x" }), dbx.client, "t", CTX,
    )).status,
    400,
  );
  await postComplaint(
    intake({ channel: "regulator", category: "fair_lending", regulator: "CFPB" }),
    dbx.client, "t", CTX,
  );
  const c = dbx.rows["core.complaint"][0];
  const days = (new Date(String(c.final_response_due_at)).getTime() -
    new Date(String(c.received_at)).getTime()) / (24 * 60 * 60 * 1000);
  assertEquals(days, REGULATOR_FINAL_RESPONSE_DAYS);
  // and the portal's own, SHORTER window is tracked separately
  assert(c.portal_due_date);
  assert(String(c.portal_due_date) < String(c.final_response_due_at));
  assert(codes(dbx.rows).includes("complaint.regulator.received"));
});

Deno.test("PR-10: a privacy complaint raises its own event, a fees one does not", async () => {
  const p = await seedOne({ category: "privacy" });
  assert(codes(p.dbx.rows).includes("complaint.privacy.received"));
  const f = await seedOne({ category: "fees" });
  assert(!codes(f.dbx.rows).includes("complaint.privacy.received"));
});

Deno.test("CO-06: acknowledgement records whether it was LATE", async () => {
  const { dbx, db, id } = await seedOne();
  dbx.rows["core.complaint"][0].ack_due_at = "2020-01-01T00:00:00.000Z";
  await postComplaintAcknowledge(req({ acknowledged_by: "svc" }), id, db, "t", CTX);
  const ev = (dbx.rows["core.event"] ?? []).find((e) => e.code === "complaint.acknowledged");
  assertEquals((ev!.payload as Any).acknowledged_late, true);
});

// -------------------------------------------------------------- resolution

Deno.test("CO-06: initial and final responses are SEPARATE obligations", async () => {
  const { dbx, db, id } = await seedOne();
  await postComplaintResponse(req({ stage: "initial", body_ref: "r1" }), id, db, "t", CTX);
  assert(codes(dbx.rows).includes("complaint.initial_response.sent"));
  assert(!codes(dbx.rows).includes("complaint.final_response.sent"));
  assertEquals(dbx.rows["core.complaint"][0].final_response_sent_at, null);

  await postComplaintResponse(req({ stage: "final", body_ref: "r2" }), id, db, "t", CTX);
  assert(codes(dbx.rows).includes("complaint.final_response.sent"));
});

Deno.test("CO-06: a response with no content is refused", async () => {
  const { db, id } = await seedOne();
  assertEquals(
    (await postComplaintResponse(req({ stage: "final" }), id, db, "t", CTX)).status, 400,
  );
});

Deno.test("CO-06: resolving with NO ROOT CAUSE is refused — it empties the trend analysis", async () => {
  const { dbx, db, id } = await seedOne();
  await postComplaintResponse(req({ stage: "final", body_ref: "r2" }), id, db, "t", CTX);
  const res = await postComplaintResolve(req({ investigation_notes: "n" }), id, db, "t", CTX);
  assertEquals(res.status, 400);
  assertEquals(dbx.rows["core.complaint"][0].resolved_at, null);
  assert(!codes(dbx.rows).includes("complaint.resolved"));
});

Deno.test("CO-06: a complaint cannot be resolved before the member is told", async () => {
  const { dbx, db, id } = await seedOne();
  const res = await postComplaintResolve(req({ root_cause_tag: "x" }), id, db, "t", CTX);
  assertEquals(res.status, 409);
  assertEquals(dbx.rows["core.complaint"][0].resolved_at, null);
  assertEquals(dbx.violations, []);
});

Deno.test("CO-06: a fully handled complaint resolves and carries its root cause", async () => {
  const { dbx, db, id } = await seedOne();
  await postComplaintResponse(req({ stage: "final", body_ref: "r2" }), id, db, "t", CTX);
  const res = await postComplaintResolve(
    req({ root_cause_tag: "duplicate_fee", investigation_notes: "defect" }), id, db, "t", CTX,
  );
  assertEquals(res.status, 200);
  assert(codes(dbx.rows).includes("complaint.investigation.completed"));
  const ev = (dbx.rows["core.event"] ?? []).find((e) => e.code === "complaint.resolved");
  assertEquals((ev!.payload as Any)["complaint.root_cause_tag"], "duplicate_fee");
});

// ------------------------------------------------------------- Reg E disputes

Deno.test("MP-04: a dispute carries its OWN clocks, distinct from the complaint's", async () => {
  const { dbx, db, id } = await seedOne();
  await postDispute(
    req({
      complaint_id: id, member_id: "m1", account_id: "a1", basis: "unauthorised",
      amount_cents: 45_000, notified_at: "2026-07-02T00:00:00.000Z",
    }),
    db, "t", CTX,
  );
  const d = dbx.rows["core.dispute"][0];
  const days = (new Date(String(d.provisional_credit_due_at)).getTime() -
    new Date(String(d.notified_at)).getTime()) / (24 * 60 * 60 * 1000);
  assertEquals(days, PROVISIONAL_CREDIT_DAYS);
  assert(codes(dbx.rows).includes("dispute.rege_clock.started"));
  // the dispute's clock is NOT the complaint's
  assert(String(d.investigation_due_at) !== String(dbx.rows["core.complaint"][0].final_response_due_at));
});

Deno.test("MP-04: the extended investigation window is 90 days, not 45", async () => {
  const dbx = makeDrillDb();
  await postDispute(
    req({
      member_id: "m1", basis: "b", amount_cents: 100, extended: true,
      notified_at: "2026-07-02T00:00:00.000Z",
    }),
    dbx.client, "t", CTX,
  );
  const d = dbx.rows["core.dispute"][0];
  const days = (new Date(String(d.investigation_due_at)).getTime() -
    new Date(String(d.notified_at)).getTime()) / (24 * 60 * 60 * 1000);
  assertEquals(days, 90);
});

Deno.test("MP-04: provisional credit posts an AMOUNT and records lateness", async () => {
  const dbx = makeDrillDb();
  await postDispute(
    req({ member_id: "m1", basis: "b", amount_cents: 45_000, notified_at: "2020-01-01T00:00:00.000Z" }),
    dbx.client, "t", CTX,
  );
  const did = String(dbx.rows["core.dispute"][0].id);
  await postProvisionalCredit(req({}), did, dbx.client, "t", CTX);
  assertEquals(dbx.rows["core.dispute"][0].provisional_credit_cents, 45_000);
  const ev = (dbx.rows["core.event"] ?? []).find((e) =>
    e.code === "dispute.provisional_credit.posted"
  );
  assertEquals((ev!.payload as Any).posted_late, true);
});

Deno.test("MP-04: a dispute cannot be closed without findings", async () => {
  const dbx = makeDrillDb();
  await postDispute(
    req({ member_id: "m1", basis: "b", amount_cents: 100 }), dbx.client, "t", CTX,
  );
  const did = String(dbx.rows["core.dispute"][0].id);
  assertEquals((await postDisputeResolve(req({}), did, dbx.client, "t", CTX)).status, 400);
  assertEquals(
    (await postDisputeResolve(
      req({ findings: "confirmed unauthorised", correction_amount_cents: 100 }),
      did, dbx.client, "t", CTX,
    )).status,
    200,
  );
  assert(codes(dbx.rows).includes("dispute.response.sent"));
  assertEquals(dbx.violations, []);
});

// ------------------------------------------------------------------- trends

Deno.test("FL-13: the trend is COUNTED from the register, not supplied", async () => {
  const dbx = makeDrillDb();
  const db = dbx.client;
  for (const cat of ["fees", "fees", "privacy"]) {
    await postComplaint(intake({ category: cat }), db, "t", CTX);
  }
  await postComplaintTrend(req({ period: "q", lens: "enterprise", total: 999 }), db, "t", CTX);
  const t = dbx.rows["core.complaint_trend"][0];
  assertEquals(t.total, 3);
  assertEquals((t.by_category as Any).fees, 2);
});

Deno.test("FL-13: an unresolved complaint past its deadline counts as OVERDUE", async () => {
  const { dbx, db } = await seedOne();
  dbx.rows["core.complaint"][0].final_response_due_at = "2020-01-01T00:00:00.000Z";
  await postComplaintTrend(req({ period: "q", lens: "enterprise" }), db, "t", CTX);
  assertEquals(dbx.rows["core.complaint_trend"][0].overdue_count, 1);
});

Deno.test("FL-13: a disparity above threshold opens a CAP and a remediation", async () => {
  const { dbx, db } = await seedOne();
  await postComplaintTrend(
    req({ period: "q", lens: "fair_lending", threshold_bp: 500, cohorts: { a: 200, b: 900 } }),
    db, "t", CTX,
  );
  assertEquals(dbx.rows["core.complaint_trend"][0].breached, true);
  assert(codes(dbx.rows).includes("analytics.cap.opened"));
  assert(codes(dbx.rows).includes("fair_lending.remediation.opened"));
});

Deno.test("FL-13: an unset threshold yields NO verdict and opens nothing", async () => {
  const { dbx, db } = await seedOne();
  await postComplaintTrend(
    req({ period: "q", lens: "fair_lending", cohorts: { a: 200, b: 900 } }), db, "t", CTX,
  );
  assertEquals(dbx.rows["core.complaint_trend"][0].breached, null);
  assert(!codes(dbx.rows).includes("analytics.cap.opened"));
  assertEquals(dbx.violations, []);
});

Deno.test("FL-13: the lens filters — a privacy lens does not count fee complaints", async () => {
  const dbx = makeDrillDb();
  const db = dbx.client;
  await postComplaint(intake({ category: "fees" }), db, "t", CTX);
  await postComplaint(intake({ category: "privacy" }), db, "t", CTX);
  await postComplaintTrend(req({ period: "q", lens: "privacy" }), db, "t", CTX);
  assertEquals(dbx.rows["core.complaint_trend"][0].total, 1);
});

Deno.test("PR-10: a material privacy incident delivers an AD HOC board report", async () => {
  const { dbx, db } = await seedOne({ category: "privacy" });
  await postComplaintBoardReport(req({ period: "q", audience: "privacy" }), db, "t", CTX);
  assert(codes(dbx.rows).includes("privacy.board_report.delivered"));
  assert(!codes(dbx.rows).includes("privacy.board_adhoc.delivered"));

  await postComplaintBoardReport(
    req({ period: "q2", audience: "privacy", adhoc: true, material_incident_id: "inc_1" }),
    db, "t", CTX,
  );
  assert(codes(dbx.rows).includes("privacy.board_adhoc.delivered"));
});
