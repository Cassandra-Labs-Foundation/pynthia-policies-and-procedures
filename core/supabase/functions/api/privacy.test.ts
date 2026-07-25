// Privacy — PR-01..PR-18.
//
// The load-bearing negatives: an E-SIGN delivery with no demonstrated consent,
// an opt-out captured and never propagated, a state request fulfilled before
// the requester is verified, a GPC signal overridden by a banner click, a
// dataset over the re-identification threshold, biometrics with no consent,
// and a correction applied but never pushed to the furnishing systems.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { makeDrillDb } from "../drill/fake_db.ts";
import { OPS_CTX, req } from "./test_helpers.ts";
import {
  MINOR_AGE,
  OPTOUT_PROPAGATION_DAYS,
  STATE_REQUEST_DAYS,
  postAnalyticsDataset,
  postBiometricPurge,
  postBiometricVerification,
  postEsignConsent,
  postFurnishingCorrection,
  postFurnishingDispute,
  postMinorDataEvent,
  postNoticeDelivery,
  postPreferencePropagation,
  postPrivacyNotice,
  postPrivacyPreference,
  postStateRequest,
  postStateRequestFulfilment,
  postWebConsent,
  postWebTagReview,
} from "./privacy.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
const CTX = OPS_CTX;
const codes = (rows: Record<string, Any[]>) =>
  (rows["core.event"] ?? []).map((e) => String(e.code));

async function seedNotice() {
  const dbx = makeDrillDb();
  await postPrivacyNotice(
    req({ version: "v3", template_ref: "tpl-3", effective_at: "2026-01-01T00:00:00.000Z" }),
    dbx.client, "t", CTX,
  );
  return { dbx, db: dbx.client };
}

// -------------------------------------------------------------- PR-01/PR-11

Deno.test("PR-11: E-SIGN delivery with NO consent is refused", async () => {
  const { dbx, db } = await seedNotice();
  const res = await postNoticeDelivery(
    req({ entity_ref: "e1", reason: "annual", channel: "esign" }), "pnotice_v3", db, "t", CTX,
  );
  assertEquals(res.status, 409);
  assertEquals((dbx.rows["core.privacy_notice_delivery"] ?? []).length, 0);
});

Deno.test("PR-11: consent that did not DEMONSTRATE access is not consent", async () => {
  const { dbx, db } = await seedNotice();
  await postEsignConsent(req({ entity_ref: "e1", demonstrated_access: false }), db, "t", CTX);
  assertEquals(dbx.rows["core.esign_consent"][0].captured_at, null);
  // 15 USC 7001(c)(1)(C)(ii): a checkbox is not enough
  const res = await postNoticeDelivery(
    req({ entity_ref: "e1", reason: "annual", channel: "esign", esign_consent_id: "esign_e1" }),
    "pnotice_v3", db, "t", CTX,
  );
  assertEquals(res.status, 409);
  assert(!codes(dbx.rows).includes("privacy.esign_consent.recorded"));
});

Deno.test("PR-11: demonstrated consent permits electronic delivery", async () => {
  const { dbx, db } = await seedNotice();
  await postEsignConsent(req({ entity_ref: "e1", demonstrated_access: true }), db, "t", CTX);
  const res = await postNoticeDelivery(
    req({
      entity_ref: "e1", reason: "member_request", channel: "esign",
      esign_consent_id: "esign_e1",
    }),
    "pnotice_v3", db, "t", CTX,
  );
  assertEquals(res.status, 201);
  assert(codes(dbx.rows).includes("privacy.notice_copy.delivered"));
  assert(
    dbx.rows["core.privacy_notice_delivery"][0].delivered_at,
    "the delivery row must record it, not only the event",
  );
  assertEquals(dbx.violations, []);
});

// ------------------------------------------------------------- PR-02 opt-out

Deno.test("PR-02: an opt-out is a STANDING STATE with a propagation deadline", async () => {
  const dbx = makeDrillDb();
  await postPrivacyPreference(
    req({
      entity_ref: "e1", channel: "nonaffiliate_sharing", opted_out: true,
      source: "member_request",
    }),
    dbx.client, "t", CTX,
  );
  const p = dbx.rows["core.privacy_preference"][0];
  assertEquals(p.opted_out, true);
  assertEquals(p.propagated_at, null, "captured is not propagated");
  const gap = new Date(String(p.propagation_due_at)).getTime() -
    new Date(String(p.effective_at)).getTime();
  assertEquals(Math.round(gap / 86_400_000), OPTOUT_PROPAGATION_DAYS);
});

Deno.test("PR-02: CLEARING an opt-out is recorded as its own state change", async () => {
  const dbx = makeDrillDb();
  await postPrivacyPreference(
    req({ entity_ref: "e1", channel: "marketing", opted_out: false, source: "member_request" }),
    dbx.client, "t", CTX,
  );
  // recording only the opt-outs makes a cleared preference invisible
  assert(codes(dbx.rows).includes("privacy.optout.cleared"));
  assert(!codes(dbx.rows).includes("privacy.optout.received"));
});

Deno.test("PR-02: Nevada is its own regime, not folded into the GLBA opt-out", async () => {
  const dbx = makeDrillDb();
  await postPrivacyPreference(
    req({ entity_ref: "e1", channel: "nevada_sale", opted_out: true, source: "member_request" }),
    dbx.client, "t", CTX,
  );
  assert(codes(dbx.rows).includes("privacy.nv_optout_enforced"));

  const s2 = makeDrillDb();
  await postPrivacyPreference(
    req({
      entity_ref: "e1", channel: "nonaffiliate_sharing", opted_out: true,
      source: "member_request",
    }),
    s2.client, "t", CTX,
  );
  assert(!codes(s2.rows).includes("privacy.nv_optout_enforced"));
});

Deno.test("PR-02: propagation naming NO systems is refused", async () => {
  const dbx = makeDrillDb();
  await postPrivacyPreference(
    req({
      entity_ref: "e1", channel: "nonaffiliate_sharing", opted_out: true,
      source: "member_request",
    }),
    dbx.client, "t", CTX,
  );
  assertEquals(
    (await postPreferencePropagation(req({ systems: [] }), dbx.client, "t", CTX)).status, 400,
  );
  assertEquals(dbx.rows["core.privacy_preference"][0].propagated_at, null);
});

Deno.test("PR-02: propagation records lateness", async () => {
  const dbx = makeDrillDb();
  await postPrivacyPreference(
    req({
      entity_ref: "e1", channel: "nonaffiliate_sharing", opted_out: true,
      source: "member_request",
    }),
    dbx.client, "t", CTX,
  );
  dbx.rows["core.privacy_preference"][0].propagation_due_at = "2020-01-01T00:00:00.000Z";
  await postPreferencePropagation(req({ systems: ["core"] }), dbx.client, "t", CTX);
  const ev = (dbx.rows["core.event"] ?? []).find((e) => e.code === "privacy.optout_propagated");
  assertEquals((ev!.payload as Any).propagated_late, true);
});

// ------------------------------------------------------- PR-12 state rights

Deno.test("PR-12: fulfilling an UNVERIFIED request is refused — that IS the disclosure", async () => {
  const dbx = makeDrillDb();
  await postStateRequest(
    req({ entity_ref: "e1", state: "CA", right_requested: "access" }), dbx.client, "t", CTX,
  );
  const id = "psreq_e1_access";
  assertEquals(
    (await postStateRequestFulfilment(
      req({ verified: false, outcome: "fulfilled" }), id, dbx.client, "t", CTX,
    )).status,
    409,
  );
  assertEquals(dbx.rows["core.privacy_state_request"][0].fulfilled_at, null);
  assertEquals(dbx.violations, []);
});

Deno.test("PR-12: an OPT-OUT right sets the standing state, not just a ticket", async () => {
  const dbx = makeDrillDb();
  await postStateRequest(
    req({ entity_ref: "e1", state: "NV", right_requested: "opt_out" }), dbx.client, "t", CTX,
  );
  // a state request that only produces a task leaves the opt-out depending on
  // somebody remembering
  assertEquals(dbx.rows["core.privacy_preference"].length, 1);
  assertEquals(dbx.rows["core.privacy_preference"][0].opted_out, true);
  assertEquals(dbx.rows["core.privacy_preference"][0].source, "state_request");
});

Deno.test("PR-12: the universal floor uses the STRICTEST deadline", async () => {
  const dbx = makeDrillDb();
  await postStateRequest(
    req({
      entity_ref: "e1", state: "CO", right_requested: "delete",
      received_at: "2026-07-01T00:00:00.000Z",
    }),
    dbx.client, "t", CTX,
  );
  const r = dbx.rows["core.privacy_state_request"][0];
  const days = (new Date(String(r.due_at)).getTime() -
    new Date(String(r.received_at)).getTime()) / 86_400_000;
  assertEquals(days, STATE_REQUEST_DAYS);
});

Deno.test("PR-12: a denial must state its basis", async () => {
  const dbx = makeDrillDb();
  await postStateRequest(
    req({ entity_ref: "e1", state: "CA", right_requested: "delete" }), dbx.client, "t", CTX,
  );
  assertEquals(
    (await postStateRequestFulfilment(
      req({ verified: true, outcome: "denied" }), "psreq_e1_delete", dbx.client, "t", CTX,
    )).status,
    400,
  );
});

// -------------------------------------------------------- PR-14 web tracking

Deno.test("PR-14: a GPC signal OVERRIDES the banner", async () => {
  const dbx = makeDrillDb();
  await postWebConsent(
    req({
      session_ref: "s1", gpc_signal: true,
      categories: { analytics: true, advertising: true },
    }),
    dbx.client, "t", CTX,
  );
  const c = dbx.rows["core.web_consent"][0].categories as Any;
  assertEquals(c.advertising, false, "a banner click must not re-enable what GPC turned off");
  assertEquals(c.analytics, false);
  assertEquals(c.essential, true);
  assert(codes(dbx.rows).includes("web.gpc_signal"));
});

Deno.test("PR-14: tags are gated by BOTH approval and consent", async () => {
  const dbx = makeDrillDb();
  const db = dbx.client;
  await postWebTagReview(
    req({
      vendor: "Analytics Co", category: "analytics", decision: "approved",
      reviewed_by: "po",
    }),
    db, "t", CTX,
  );
  await postWebTagReview(
    req({ vendor: "Ad Net", category: "advertising", decision: "rejected", reviewed_by: "po" }),
    db, "t", CTX,
  );
  // consent to both, but only the approved one may fire
  await postWebConsent(
    req({ session_ref: "s1", categories: { analytics: true, advertising: true } }),
    db, "t", CTX,
  );
  const gated = dbx.rows["core.web_consent"][0].tags_gated as string[];
  assertEquals(gated.length, 1, "the rejected tag is gated even with consent");
  assert(gated[0].includes("adnet"));
});

Deno.test("PR-14: a decided tag needs a named reviewer", async () => {
  const dbx = makeDrillDb();
  assertEquals(
    (await postWebTagReview(
      req({ vendor: "X", category: "analytics", decision: "approved" }), dbx.client, "t", CTX,
    )).status,
    400,
  );
});

// --------------------------------------------------------- PR-13 analytics

Deno.test("PR-13: a dataset over the re-identification threshold is NOT released", async () => {
  const dbx = makeDrillDb();
  const res = await postAnalyticsDataset(
    req({
      purpose: "churn", requested_by: "a1", method: "aggregation",
      reid_risk_bp: 900, risk_threshold_bp: 500,
    }),
    dbx.client, "t", CTX,
  );
  assertEquals(res.status, 409);
  assertEquals(dbx.rows["core.analytics_dataset"][0].approved_at, null);
  assert(codes(dbx.rows).includes("analytics.threshold.breached"));
  assertEquals(dbx.violations, []);
});

Deno.test("PR-13: k-anonymity with no k is refused", async () => {
  const dbx = makeDrillDb();
  assertEquals(
    (await postAnalyticsDataset(
      req({ purpose: "p", requested_by: "a1", method: "k_anonymity" }), dbx.client, "t", CTX,
    )).status,
    400,
  );
});

Deno.test("PR-13: a RAW dataset is never auto-approved", async () => {
  const dbx = makeDrillDb();
  await postAnalyticsDataset(
    req({ purpose: "p", requested_by: "a1", method: "raw", reid_risk_bp: 1, risk_threshold_bp: 500 }),
    dbx.client, "t", CTX,
  );
  assertEquals(dbx.rows["core.analytics_dataset"][0].approved_at, null);
  assert(!codes(dbx.rows).includes("analytics.dataset.approved"));
});

// -------------------------------------------------------- PR-16 biometrics

Deno.test("PR-16: capturing biometrics with NO consent is refused outright", async () => {
  const dbx = makeDrillDb();
  const res = await postBiometricVerification(req({ entity_ref: "e1" }), dbx.client, "t", CTX);
  assertEquals(res.status, 409);
  assertEquals((dbx.rows["core.biometric_verification"] ?? []).length, 0);
});

Deno.test("PR-16: biometric data is PURGED when its purpose ends", async () => {
  const dbx = makeDrillDb();
  await postBiometricVerification(
    req({ entity_ref: "e1", consent_id: "c1", outcome: "verified" }), dbx.client, "t", CTX,
  );
  await postBiometricPurge(req({}), dbx.client, "t", CTX);
  assertEquals(dbx.rows["core.biometric_verification"][0].purged_at, null, "not yet due");

  dbx.rows["core.biometric_verification"][0].purge_due_at = "2020-01-01T00:00:00.000Z";
  await postBiometricPurge(req({}), dbx.client, "t", CTX);
  assert(dbx.rows["core.biometric_verification"][0].purged_at);
  assert(codes(dbx.rows).includes("verification.biometric_purged"));
});

// ------------------------------------------------------ PR-17 children's data

Deno.test("PR-17: the age gate blocks; detection AFTER collection is a different failure", async () => {
  const dbx = makeDrillDb();
  await postMinorDataEvent(
    req({ kind: "age_gate_blocked", subject_ref: "s1", age_asserted: MINOR_AGE - 1 }),
    dbx.client, "t", CTX,
  );
  assert(codes(dbx.rows).includes("privacy.age_gate.blocked"));
  assert(!codes(dbx.rows).includes("privacy.minor_data.detected"));

  await postMinorDataEvent(
    req({ kind: "minor_data_detected", subject_ref: "s2", age_asserted: 10 }),
    dbx.client, "t", CTX,
  );
  // detection carries a deletion obligation the gate does not
  assert(codes(dbx.rows).includes("privacy.minor_data.detected"));
  await postMinorDataEvent(req({ kind: "deleted", subject_ref: "s2" }), dbx.client, "t", CTX);
  assert(codes(dbx.rows).includes("privacy.minor_data_deleted"));
});

// -------------------------------------------------------- PR-05 corrections

Deno.test("PR-05: a correction applied but NOT propagated is not propagated", async () => {
  const dbx = makeDrillDb();
  await postFurnishingDispute(
    req({ entity_ref: "e1", field: "address", disputed_value: "old" }), dbx.client, "t", CTX,
  );
  await postFurnishingCorrection(
    req({ corrected_value: "new" }), "fdisp_e1_address", dbx.client, "t", CTX,
  );
  const d = dbx.rows["core.furnishing_dispute"][0];
  assert(d.correction_applied_at);
  assertEquals(d.propagated_at, null, "the bureaus never see an unpropagated correction");
  assert(!codes(dbx.rows).includes("correction.propagated"));
  // but the deadline to propagate exists
  assert(codes(dbx.rows).includes("correction.propagation.due_at"));
});

Deno.test("PR-05: an NCOA mismatch raises a RED FLAG, not only a data-quality item", async () => {
  const dbx = makeDrillDb();
  await postFurnishingDispute(
    req({
      entity_ref: "e1", field: "address", disputed_value: "old",
      ncoa_candidate: "1 New St", ncoa_mismatch: true, redflag: true,
    }),
    dbx.client, "t", CTX,
  );
  assert(codes(dbx.rows).includes("redflag.detected"));
  assert(codes(dbx.rows).includes("address.ncoa_mismatch.detected"));
  assertEquals(dbx.rows["core.address"][0].ncoa_candidate, "1 New St");
});

Deno.test("PR-05: a furnishing dispute is a DISPUTE, with a basis and no amount", async () => {
  const dbx = makeDrillDb();
  await postFurnishingDispute(
    req({ entity_ref: "e1", field: "balance", dispute_basis: "data_accuracy" }),
    dbx.client, "t", CTX,
  );
  const d = dbx.rows["core.dispute"][0];
  assertEquals(d.kind, "data_accuracy");
  assertEquals(d.amount_cents, null, "a data-accuracy dispute has no money in it");
  assertEquals(d.provisional_credit_due_at, null, "and no Reg E clock");
  assertEquals(dbx.violations, []);
});
