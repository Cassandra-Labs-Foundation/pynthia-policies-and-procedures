// Audit engagements and findings — AU-03/AU-04 gating, AU-06 report issuance,
// AU-08/AU-09 remediation and closure, AU-07 aging.
//
// The negatives are the control: a plan approved by its own submitter, an
// engagement started without independence or before approval, a report issued
// before fieldwork, a finding closed on a failed retest. Each of those is an
// audit function failing open, and each must refuse.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { makeDrillDb } from "../drill/fake_db.ts";
import { OPS_CTX, req } from "./test_helpers.ts";
import {
  postApproveAuditPlan, postAuditEngagement, postAuditSweep, postCloseFinding,
  postCompleteFieldwork, postFindingResponse, postIssueAuditReport,
  postStartAuditEngagement,
} from "./audit.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
const CTX = OPS_CTX;
/** A second internal actor — the approvals below must come from NOT-the-submitter. */
const SECOND = { ...OPS_CTX, tokenId: "tok_second" };
const codes = (rows: Record<string, Any[]>) =>
  (rows["core.event"] ?? []).map((e) => String(e.code));

const ENG_ID = "aeng_2026_cash_operations";

async function submit(dbx: Any): Promise<void> {
  const res = await postAuditEngagement(
    req({ plan_cycle_year: 2026, scope: "cash operations", auditor_ref: "aud_1" }),
    dbx.client, "t", CTX,
  );
  assertEquals(res.status, 201);
}

/** Submitted → approved (by SECOND) → started, ready for fieldwork. */
async function startEngagement(dbx: Any): Promise<void> {
  await submit(dbx);
  await postApproveAuditPlan(req({}), ENG_ID, dbx.client, "t", SECOND);
  await postStartAuditEngagement(
    req({ independence_attested: true }), ENG_ID, dbx.client, "t", CTX,
  );
}

// ------------------------------------------------------------------ AU-04

Deno.test("AU-04: submitting the plan opens the cycle and schedules the assessment", async () => {
  const dbx = makeDrillDb();
  await submit(dbx);
  assertEquals(dbx.rows["core.audit_engagement"][0].status, "plan_submitted");
  assertEquals(dbx.rows["core.audit_engagement"][0].plan_submitted_by, CTX.tokenId);
  const c = codes(dbx.rows);
  assert(c.includes("audit.plan_cycle.opened"));
  assert(c.includes("audit.annual_plan.submitted"));
  // AU-05: the assessment is scheduled BY opening the cycle, not by a caller
  assert(c.includes("audit.assessment.scheduled"));
});

Deno.test("AU-04: the plan's submitter cannot also approve it", async () => {
  const dbx = makeDrillDb();
  await submit(dbx);
  const res = await postApproveAuditPlan(req({}), ENG_ID, dbx.client, "t", CTX);
  assertEquals(res.status, 409);
  assertEquals(dbx.rows["core.audit_engagement"][0].plan_approved_at, null);
  assert(!codes(dbx.rows).includes("audit.annual_plan.approved"));
});

Deno.test("AU-03/AU-04: no start before approval, and no start without independence", async () => {
  const dbx = makeDrillDb();
  await submit(dbx);
  // approved plan is a precondition — attested or not, the unapproved plan refuses
  const early = await postStartAuditEngagement(
    req({ independence_attested: true }), ENG_ID, dbx.client, "t", CTX,
  );
  assertEquals(early.status, 409);

  await postApproveAuditPlan(req({}), ENG_ID, dbx.client, "t", SECOND);
  // AU-03: an engagement conducted by a non-independent auditor cannot be
  // repaired afterwards, so the attestation gates the start
  const unattested = await postStartAuditEngagement(req({}), ENG_ID, dbx.client, "t", CTX);
  assertEquals(unattested.status, 400);
  assertEquals(dbx.rows["core.audit_engagement"][0].started_at, null);

  const res = await postStartAuditEngagement(
    req({ independence_attested: true }), ENG_ID, dbx.client, "t", CTX,
  );
  assertEquals(res.status, 200);
  const c = codes(dbx.rows);
  assert(c.includes("audit.engagement.started"));
  // AU-03: starting is what grants the auditor access
  assert(c.includes("auditor.access_grant"));
});

// ------------------------------------------------------------------ AU-06

Deno.test("AU-06: a report cannot issue before fieldwork completes", async () => {
  const dbx = makeDrillDb();
  await startEngagement(dbx);
  const res = await postIssueAuditReport(
    req({ findings: [{ severity: "high", summary: "x" }] }), ENG_ID, dbx.client, "t", CTX,
  );
  assertEquals(res.status, 409);
  assertEquals((dbx.rows["core.audit_finding"] ?? []).length, 0, "no findings from an unissued report");
});

Deno.test("AU-06/AU-10: issuing OPENS the findings and starts the retention clock", async () => {
  const dbx = makeDrillDb();
  await startEngagement(dbx);
  await postCompleteFieldwork(req({ rating: "needs_improvement" }), ENG_ID, dbx.client, "t", CTX);
  const res = await postIssueAuditReport(
    req({ findings: [{ severity: "high", summary: "a" }, { severity: "critical", summary: "b" }] }),
    ENG_ID, dbx.client, "t", CTX,
  );
  assertEquals(res.status, 200);
  assertEquals(dbx.rows["core.audit_finding"].length, 2);
  const c = codes(dbx.rows);
  // finding.opened is a CONSEQUENCE of issuance, not an echo — no caller asked for it
  assertEquals(c.filter((x) => x === "finding.opened").length, 2);
  assert(c.includes("audit.report.issued"));
  assert(c.includes("audit.results_delivered_to_board"));
  // AU-10: 7 years from issuance
  const retention = String(dbx.rows["core.audit_engagement"][0].retention_expires_at);
  assertEquals(Number(retention.slice(0, 4)), new Date().getUTCFullYear() + 7);
  assertEquals(dbx.violations, []);
});

// ------------------------------------------------------------ AU-08 / AU-09

Deno.test("AU-08: the management response starts the 90-day remediation clock", async () => {
  const dbx = makeDrillDb();
  await startEngagement(dbx);
  await postCompleteFieldwork(req({ rating: "satisfactory" }), ENG_ID, dbx.client, "t", CTX);
  await postIssueAuditReport(
    req({ findings: [{ severity: "medium", summary: "f" }] }), ENG_ID, dbx.client, "t", CTX,
  );
  const fid = String(dbx.rows["core.audit_finding"][0].id);

  // a response with no text is a checkbox, and is refused
  const empty = await postFindingResponse(req({}), fid, dbx.client, "t", CTX);
  assertEquals(empty.status, 400);
  assertEquals(dbx.rows["core.audit_finding"][0].remediation_due_at, null);

  await postFindingResponse(req({ response: "will fix by Q4" }), fid, dbx.client, "t", CTX);
  const due = new Date(String(dbx.rows["core.audit_finding"][0].remediation_due_at));
  const days = Math.round((due.getTime() - Date.now()) / 86_400_000);
  assertEquals(days, 90);
  assert(codes(dbx.rows).includes("audit.remediation.timer"));
});

Deno.test("AU-09: a failed retest cannot close the finding — it re-communicates", async () => {
  const dbx = makeDrillDb();
  await startEngagement(dbx);
  await postCompleteFieldwork(req({ rating: "satisfactory" }), ENG_ID, dbx.client, "t", CTX);
  await postIssueAuditReport(
    req({ findings: [{ severity: "high", summary: "f" }] }), ENG_ID, dbx.client, "t", CTX,
  );
  const fid = String(dbx.rows["core.audit_finding"][0].id);
  const res = await postCloseFinding(req({ retest_result: "failed" }), fid, dbx.client, "t", CTX);
  assertEquals(res.status, 200);
  assertEquals((await res.json()).closed, false);
  assertEquals(dbx.rows["core.audit_finding"][0].closed_at, null);
  assert(!codes(dbx.rows).includes("finding.closed"));
  // a finding closed on a failed retest is the closure failure an examiner
  // looks for; instead it goes back to management
  assert(codes(dbx.rows).filter((c) => c === "finding.communicated").length >= 2);
});

Deno.test("AU-08: accepting a risk without a rationale is refused; with one it closes", async () => {
  const dbx = makeDrillDb();
  await startEngagement(dbx);
  await postCompleteFieldwork(req({ rating: "satisfactory" }), ENG_ID, dbx.client, "t", CTX);
  await postIssueAuditReport(
    req({ findings: [{ severity: "low", summary: "f" }] }), ENG_ID, dbx.client, "t", CTX,
  );
  const fid = String(dbx.rows["core.audit_finding"][0].id);
  const bare = await postCloseFinding(req({ risk_acceptance: "accepted" }), fid, dbx.client, "t", CTX);
  assertEquals(bare.status, 400, "an accepted risk with no written rationale is not a decision");

  await postCloseFinding(
    req({ risk_acceptance: "accepted", rationale: "cost exceeds exposure" }), fid, dbx.client, "t", CTX,
  );
  assert(dbx.rows["core.audit_finding"][0].closed_at !== null);
  const c = codes(dbx.rows);
  assert(c.includes("finding.risk_acceptance.decided"));
  assert(c.includes("finding.closed"));
});

// ------------------------------------------------------------------ AU-07

Deno.test("AU-07: the sweep escalates a finding whose remediation date passed unclosed", async () => {
  const dbx = makeDrillDb();
  dbx.rows["core.audit_finding"] = [{
    id: "afind_aged", engagement_id: "aeng_x", severity: "critical", summary: "old",
    opened_at: "2026-01-01T00:00:00.000Z", remediation_due_at: "2026-04-01T00:00:00.000Z",
    closed_at: null, provenance: "production",
  }, {
    id: "afind_ok", engagement_id: "aeng_x", severity: "low", summary: "fresh",
    opened_at: "2026-08-01T00:00:00.000Z", remediation_due_at: "2099-01-01T00:00:00.000Z",
    closed_at: null, provenance: "production",
  }];
  const res = await postAuditSweep(req({}), dbx.client, "t", CTX);
  assertEquals((await res.json()).aged_findings, 1);
  const c = codes(dbx.rows);
  assert(c.includes("finding.aging_threshold.breached"));
  assert(c.includes("finding.escalated"));
  // critical aging goes further up
  assert(c.includes("finding.critical.escalated"));
  // the periodic reviews report on what the sweep found
  assert(c.includes("finding.monthly_review.recorded"));
});

Deno.test("a partner token cannot reach the audit routes at all", async () => {
  const dbx = makeDrillDb();
  const res = await postAuditEngagement(
    req({ plan_cycle_year: 2026, scope: "s", auditor_ref: "a" }),
    dbx.client, "t", { ...CTX, actorType: "partner" } as Any,
  );
  assertEquals(res.status, 404);
  assertEquals((dbx.rows["core.audit_engagement"] ?? []).length, 0);
});
