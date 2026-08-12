// Ops-security tail — EC-02/IS-06 access lifecycle, BC-07 backup/restore,
// IS-05 vulnerability ordering, IS-13 AI governance.
//
// The negatives: a grant to a separated employee, an attestation over nothing,
// a restore test against a failed backup, a fix that jumped the triage queue,
// and a member-facing AI launch with no approval — each is the control's own
// violation and each must refuse.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { makeDrillDb } from "../drill/fake_db.ts";
import { OPS_CTX, req } from "./test_helpers.ts";
import {
  postAccessGrant, postAccessReview, postAiTool, postAiToolDecision,
  postAiToolLaunch, postBackupCycle, postBackupRemediate, postRestoreTest,
  postSiemAlert, postVulnFinding, postVulnRemediate, postVulnTriage,
} from "./ops_security.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
const CTX = OPS_CTX;
const codes = (rows: Record<string, Any[]>) =>
  (rows["core.event"] ?? []).map((e) => String(e.code));

function seedEmployee(dbx: Any, id: string, status = "active") {
  (dbx.rows["core.employee"] ??= []).push({ id, name: id, status, provenance: "production" });
}

// ------------------------------------------------------ EC-02 / IS-06 access

Deno.test("IS-06: access cannot be granted to a separated employee", async () => {
  const dbx = makeDrillDb();
  seedEmployee(dbx, "emp_gone", "separated");
  const res = await postAccessGrant(
    req({ user_id: "emp_gone", role: "teller_console" }), dbx.client, "t", CTX,
  );
  assertEquals(res.status, 409, "that grant IS the IS-06 exposure");
  assertEquals((dbx.rows["core.access_grant"] ?? []).length, 0);

  const ghost = await postAccessGrant(
    req({ user_id: "emp_never", role: "teller_console" }), dbx.client, "t", CTX,
  );
  assertEquals(ghost.status, 404);
});

Deno.test("EC-02: a grant carries its quarterly review clock; breakglass is loudly visible", async () => {
  const dbx = makeDrillDb();
  seedEmployee(dbx, "emp_1");
  const res = await postAccessGrant(
    req({ user_id: "emp_1", role: "prod_db", breakglass: true }), dbx.client, "t", CTX,
  );
  assertEquals(res.status, 201);
  const days = Math.round(
    (new Date((await res.json()).data.review_due_at).getTime() - Date.now()) / 86_400_000,
  );
  assertEquals(days, 90);
  const c = codes(dbx.rows);
  assert(c.includes("access.role.granted"));
  assert(c.includes("access.provisioned"));
  // breakglass is an EVENT the moment it is used, not after review
  assert(c.includes("access.breakglass.used"));
});

Deno.test("EC-02: an attestation over NOTHING attests nothing, and is refused", async () => {
  const dbx = makeDrillDb();
  const res = await postAccessReview(req({ reviewer: "ciso_1" }), dbx.client, "t", CTX);
  assertEquals(res.status, 409);
  assert(!codes(dbx.rows).includes("access.review_attestation"));
});

Deno.test("EC-02: the review attests every live grant and reviews unreviewed breakglass", async () => {
  const dbx = makeDrillDb();
  seedEmployee(dbx, "emp_1");
  await postAccessGrant(req({ user_id: "emp_1", role: "prod_db", breakglass: true }), dbx.client, "t", CTX);
  await postAccessGrant(req({ user_id: "emp_1", role: "console" }), dbx.client, "t", CTX);
  const res = await postAccessReview(req({ reviewer: "ciso_1" }), dbx.client, "t", CTX);
  assertEquals((await res.json()).data.grants_reviewed, 2);
  assert(dbx.rows["core.access_grant"].every((g) => g.reviewed_at !== null));
  const c = codes(dbx.rows);
  assert(c.includes("access.review_attestation"));
  assert(c.includes("access_review.completed"));
  assertEquals(c.filter((x) => x === "access.breakglass.reviewed").length, 1);
});

// ------------------------------------------------------------------ BC-07

Deno.test("BC-07: a restore test against a FAILED backup tests nothing, and is refused", async () => {
  const dbx = makeDrillDb();
  const bad = await postBackupCycle(req({ status: "failed" }), dbx.client, "t", CTX);
  const badId = (await bad.json()).data.id;
  const refused = await postRestoreTest(req({ backup_id: badId }), dbx.client, "t", CTX);
  assertEquals(refused.status, 409);
  assert(!codes(dbx.rows).includes("restore.completed"));

  const good = await postBackupCycle(
    req({ status: "completed", restore_point: "2026-08-09T00:00:00Z" }), dbx.client, "t", CTX,
  );
  const goodId = (await good.json()).data.id;
  const res = await postRestoreTest(req({ backup_id: goodId }), dbx.client, "t", CTX);
  assertEquals(res.status, 201);
  const c = codes(dbx.rows);
  // the restore validates the point and clocks the RTO — a backup nobody has
  // restored from is a hope, not a backup
  assert(c.includes("restore.rto_timer"));
  assert(c.includes("restore.point.validated"));
  assert(c.includes("restore.test.completed"));
  assert(c.includes("backup.restore.verified"));
});

Deno.test("BC-07: a failed backup is remediable only with a stated action", async () => {
  const dbx = makeDrillDb();
  const ok = await postBackupCycle(req({ status: "completed" }), dbx.client, "t", CTX);
  const okId = (await ok.json()).data.id;
  const notFailed = await postBackupRemediate(req({ action: "rerun" }), okId, dbx.client, "t", CTX);
  assertEquals(notFailed.status, 409, "only a failed job is remediable");

  const bad = await postBackupCycle(req({ status: "failed" }), dbx.client, "t", CTX);
  const badId = (await bad.json()).data.id;
  const silent = await postBackupRemediate(req({}), badId, dbx.client, "t", CTX);
  assertEquals(silent.status, 400, "remediation with no action is a status flip");

  await postBackupRemediate(req({ action: "replaced storage target" }), badId, dbx.client, "t", CTX);
  assertEquals(
    dbx.rows["core.backup_job"].find((j) => j.id === badId)!.status, "remediated",
  );
  assert(codes(dbx.rows).includes("backup.job.remediated"));
});

// ------------------------------------------------------------------ IS-05

Deno.test("IS-05: remediation before triage is refused — the queue is the control", async () => {
  const dbx = makeDrillDb();
  const found = await postVulnFinding(req({ severity: "high" }), dbx.client, "t", CTX);
  const { id } = (await found.json()).data;
  assert(codes(dbx.rows).includes("vuln.finding.confirmed"));

  const early = await postVulnRemediate(req({ fix: "patched" }), id, dbx.client, "t", CTX);
  assertEquals(early.status, 409);
  assertEquals(dbx.rows["core.vuln_finding"][0].remediated_at, null);

  await postVulnTriage(req({ outcome: "fix_now" }), id, dbx.client, "t", CTX);
  const res = await postVulnRemediate(req({ fix: "patched" }), id, dbx.client, "t", CTX);
  assertEquals(res.status, 200);
  assert(dbx.rows["core.vuln_finding"][0].remediated_at !== null);
  const c = codes(dbx.rows);
  assert(c.includes("vuln.triage.completed"));
  assert(c.includes("vuln.remediated"));
});

// ------------------------------------------------------------------ IS-13

Deno.test("IS-13: an unapproved AI tool cannot launch; approval publishes the disclosure", async () => {
  const dbx = makeDrillDb();
  const prop = await postAiTool(req({ name: "chat-helper", member_facing: true }), dbx.client, "t", CTX);
  const { id } = (await prop.json()).data;
  assert(codes(dbx.rows).includes("ai.tool.proposed"));

  const early = await postAiToolLaunch(req({}), id, dbx.client, "t", CTX);
  assertEquals(early.status, 409, "a member-facing AI feature launches after approval, never before");
  assert(!codes(dbx.rows).includes("ai.member_feature.launched"));

  await postAiToolDecision(req({ decision: "approved" }), id, dbx.client, "t", CTX);
  assert(codes(dbx.rows).includes("ai.register.updated"));

  const res = await postAiToolLaunch(req({}), id, dbx.client, "t", CTX);
  assertEquals(res.status, 200);
  const row = dbx.rows["core.ai_tool"][0];
  assertEquals(row.status, "launched");
  // the member disclosure ships IN THE SAME ACT as the launch
  assert(row.disclosure_published_at !== null);
  const c = codes(dbx.rows);
  assert(c.includes("ai.member_feature.launched"));
  assert(c.includes("ai.disclosure.published"));
});

Deno.test("IS-13: a REJECTED tool stays unlaunchable", async () => {
  const dbx = makeDrillDb();
  const prop = await postAiTool(req({ name: "risky-bot" }), dbx.client, "t", CTX);
  const { id } = (await prop.json()).data;
  await postAiToolDecision(req({ decision: "rejected" }), id, dbx.client, "t", CTX);
  assert(codes(dbx.rows).includes("ai.tool.rejected"));
  const res = await postAiToolLaunch(req({}), id, dbx.client, "t", CTX);
  assertEquals(res.status, 409);
  assertEquals(dbx.rows["core.ai_tool"][0].status, "rejected");
});

// ------------------------------------------------------ IS-14 / EC-09 SIEM

Deno.test("IS-14: an alert with no severity is refused — an empty body is not a critical", async () => {
  // Pins the §5 follow-up defect: severity used to DEFAULT to "critical", so
  // an empty POST minted a critical SIEM alert and typos passed into evidence.
  const dbx = makeDrillDb();
  const res = await postSiemAlert(req({}), dbx.client, "t", CTX);
  assertEquals(res.status, 400);
  assertEquals((dbx.rows["core.siem_alert"] ?? []).length, 0);
});

Deno.test("IS-14: a typo severity is refused, not recorded", async () => {
  const dbx = makeDrillDb();
  const res = await postSiemAlert(req({ severity: "sev_critical" }), dbx.client, "t", CTX);
  assertEquals(res.status, 400);
});

Deno.test("IS-14: only a stated critical raises the critical event", async () => {
  const dbx = makeDrillDb();
  await postSiemAlert(req({ severity: "low" }), dbx.client, "t", CTX);
  assert(!codes(dbx.rows).includes("siem.alert_critical"));
  await postSiemAlert(req({ severity: "critical" }), dbx.client, "t", CTX);
  assert(codes(dbx.rows).includes("siem.alert_critical"));
});
