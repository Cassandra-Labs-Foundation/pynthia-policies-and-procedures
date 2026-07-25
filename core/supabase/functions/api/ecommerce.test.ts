// E-commerce: enrollment, credentials, transaction audit trail.
//
// The credential tests are the ones that matter. EC-04 is not "do we issue
// passwords" — it is "is anyone sitting on a temporary password right now",
// which only a standing state can answer.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { makeDrillDb } from "../drill/fake_db.ts";
import { OPS_CTX, req } from "./test_helpers.ts";
import {
  LOCKOUT_THRESHOLD, postCredentialIssue, postEcommerceRiskAssessment,
  postEcommerceTransaction, postEnrollment, postLoginFailure, postPasswordChange,
  postRepudiationReview,
} from "./ecommerce.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
const CTX = OPS_CTX;
const codes = (rows: Record<string, Any[]>) =>
  (rows["core.event"] ?? []).map((e) => String(e.code));

// ------------------------------------------------------------------- EC-01

Deno.test("EC-01: board approval before the assessment completes is refused", async () => {
  const dbx = makeDrillDb();
  const res = await postEcommerceRiskAssessment(
    req({ document_version: "v4", completed: false, board_approved_by: "chair" }),
    dbx.client, "t", CTX,
  );
  assertEquals(res.status, 409, "the assessment is what the board is approving against");
  assertEquals((dbx.rows["core.ecommerce_risk_assessment"] ?? []).length, 0);
});

Deno.test("EC-01: a finding lands in core.finding, not only in a text column", async () => {
  const dbx = makeDrillDb();
  await postEcommerceRiskAssessment(
    req({
      document_version: "v3", finding_description: "session timeout too long",
      control_register: ["EC-03"], board_approved_by: "chair",
    }),
    dbx.client, "t", CTX,
  );
  // The register the remediation controls already read from. A finding that
  // never lands there is one nobody will track to closure.
  const f = (dbx.rows["core.finding"] ?? [])[0];
  assertEquals(f.description, "session timeout too long");
  assertEquals(f.remediation_status, "open");
});

// ------------------------------------------------------------------- EC-03

Deno.test("EC-03: an unanswered member-number comparison blocks approval", async () => {
  const dbx = makeDrillDb();
  await postEnrollment(
    req({ member_ref: "m9", channel: "web", applicant_identity: "A", verified: true }),
    dbx.client, "t", CTX,
  );
  const e = dbx.rows["core.ecommerce_enrollment"][0];
  // UNKNOWN IS NOT PERMISSION: null, not false, and certainly not approved.
  assertEquals(e.member_number_match, null);
  assertEquals(e.approved_at, null);
  assert(!codes(dbx.rows).includes("ecommerce.enrollment.approved"));
});

Deno.test("EC-03: a matched, verified enrollment approves AND confirms to the member", async () => {
  const dbx = makeDrillDb();
  await postEnrollment(
    req({
      member_ref: "m1", channel: "web", applicant_identity: "Real",
      member_number_match: true, entity_email: "m1@example.test", verified: true,
    }),
    dbx.client, "t", CTX,
  );
  const c = codes(dbx.rows);
  assert(c.includes("ecommerce.enrollment.approved"));
  // An approval nobody was told about is a silent takeover.
  assert(c.includes("ecommerce.enrollment_confirmation.sent"));
});

Deno.test("EC-03: a denial records its reason", async () => {
  const dbx = makeDrillDb();
  await postEnrollment(
    req({
      member_ref: "m8", channel: "phone", applicant_identity: "Wrong",
      member_number_match: false, verified: false, denial_reason: "number mismatch",
    }),
    dbx.client, "t", CTX,
  );
  assertEquals(dbx.rows["core.ecommerce_enrollment"][0].denial_reason, "number mismatch");
  assert(codes(dbx.rows).includes("verification.denied"));
});

// ------------------------------------------------------------------- EC-04

Deno.test("EC-04: a temporary credential carries an expiry and no set-date", async () => {
  const dbx = makeDrillDb();
  await postCredentialIssue(req({ member_ref: "m1", login_id: "member1" }), dbx.client, "t", CTX);
  const c = dbx.rows["core.member_credential"][0];
  assertEquals(c.is_temporary, true);
  // A temporary password with no expiry is a permanent one wearing a label.
  assert(c.temp_password_expires_at !== null);
  assertEquals(c.password_set_at, null);
});

Deno.test("EC-04: only an actual password change clears is_temporary", async () => {
  const dbx = makeDrillDb();
  await postCredentialIssue(req({ member_ref: "m1", login_id: "member1" }), dbx.client, "t", CTX);
  assertEquals(dbx.rows["core.member_credential"][0].is_temporary, true);
  await postPasswordChange(req({ new_password: "correct-horse" }), "cred_m1", dbx.client, "t", CTX);
  const c = dbx.rows["core.member_credential"][0];
  assertEquals(c.is_temporary, false);
  assertEquals(c.temp_password_expires_at, null);
  // the anchor the expiry clock needs
  assert(c.password_set_at !== null);
  assert(codes(dbx.rows).includes("member_credential.password.changed"));
});

Deno.test("EC-03: consecutive failures lock the credential, and the lock is recorded", async () => {
  const dbx = makeDrillDb();
  await postCredentialIssue(req({ member_ref: "m1", login_id: "member1" }), dbx.client, "t", CTX);
  for (let i = 0; i < LOCKOUT_THRESHOLD - 1; i++) {
    await postLoginFailure(req({}), "cred_m1", dbx.client, "t", CTX);
  }
  assertEquals(dbx.rows["core.member_credential"][0].locked_at, null, "not yet");
  await postLoginFailure(req({}), "cred_m1", dbx.client, "t", CTX);
  const c = dbx.rows["core.member_credential"][0];
  assert(c.locked_at !== null);
  assertEquals(c.lockout_reason, `${LOCKOUT_THRESHOLD} consecutive failed logins`);
  // Locked AND recorded: a silent lockout looks to the member like a broken
  // service, and they never report the takeover attempt.
  assert(codes(dbx.rows).includes("ecommerce.lockout.recorded"));
});

// ------------------------------------------------------------------- EC-07

Deno.test("EC-07: a transaction with no recorded initiator is refused", async () => {
  const dbx = makeDrillDb();
  const res = await postEcommerceTransaction(
    req({ member_ref: "m1", transaction_type: "transfer", amount_cents: 100 }),
    dbx.client, "t", CTX,
  );
  assertEquals(res.status, 400, "an unrecorded initiator cannot answer a repudiation claim");
  assertEquals((dbx.rows["core.ecommerce_transaction"] ?? []).length, 0);
});

Deno.test("EC-07: a repudiation outcome with no rationale is refused", async () => {
  const dbx = makeDrillDb();
  await postEcommerceTransaction(
    req({ member_ref: "m1", amount_cents: 100, initiated_by: "m1", source_ip: "203.0.113.7" }),
    dbx.client, "t", CTX,
  );
  const id = String(dbx.rows["core.ecommerce_transaction"][0].id);
  const res = await postRepudiationReview(req({ outcome: "rejected" }), id, dbx.client, "t", CTX);
  assertEquals(res.status, 400, "the member's word cannot be discarded without a record");
  assertEquals(dbx.rows["core.ecommerce_transaction"][0].repudiation_outcome, null);
});

Deno.test("EC-07: the review carries the trail it was decided from", async () => {
  const dbx = makeDrillDb();
  await postEcommerceTransaction(
    req({
      member_ref: "m1", amount_cents: 100, initiated_by: "m1",
      source_ip: "203.0.113.7", device: "ios",
    }),
    dbx.client, "t", CTX,
  );
  const id = String(dbx.rows["core.ecommerce_transaction"][0].id);
  await postRepudiationReview(
    req({ outcome: "rejected", rationale: "member's own device and session" }),
    id, dbx.client, "t", CTX,
  );
  const ev = (dbx.rows["core.event"] ?? [])
    .find((e) => e.code === "ecommerce.repudiation.reviewed");
  const trail = (ev!.payload as Any)["ecommerce.audit_trail.recorded"];
  assertEquals(trail.source_ip, "203.0.113.7", "shown, not asserted");
});

Deno.test("a partner token cannot reach the e-commerce routes", async () => {
  const dbx = makeDrillDb();
  const res = await postCredentialIssue(
    req({ member_ref: "m1", login_id: "x" }), dbx.client, "t",
    { ...CTX, actorType: "partner" } as Any,
  );
  assertEquals(res.status, 404);
});
