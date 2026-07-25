// Resolution — and the second appearance of the legal-hold bug shape.
//
// The freeze tests are the point of this file. A freeze modelled as
// `account.frozen boolean` releases every freeze when any one is released. That
// bug already happened once in this repo, on legal holds, where it made records
// disposal-eligible under active litigation hold. Here it releases money
// subject to a court order. Same shape, worse consequence.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { makeDrillDb } from "../drill/fake_db.ts";
import { OPS_CTX, req } from "./test_helpers.ts";
import {
  FREEZE_PRECEDENCE, postAccountFreeze, postEwiIndicator, postEwiSweep, postFreezeRelease,
  postFrozenAccountCredit, postInstitutionFreeze, postMemberPortalAccess,
  postMemberPortalState, postRecordsPackage,
} from "./resolution.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
const CTX = OPS_CTX;
const codes = (rows: Record<string, Any[]>) =>
  (rows["core.event"] ?? []).map((e) => String(e.code));

function withAccount(dbx: Any) {
  dbx.rows["core.account"] = [{
    id: "a1", entity_id: "e1", status: "open", account_type: "checking",
    balance: 0, partner_id: "p1", provenance: "production",
  }];
}

// ============ RS-04: A FREEZE IS A SET, NOT A FLAG ============

Deno.test("RS-04: releasing ONE of two freezes leaves the other standing", async () => {
  const dbx = makeDrillDb();
  withAccount(dbx);
  await postAccountFreeze(
    req({
      account_ref: "a1", authority: "court_order",
      legal_process_reference: "NC-CV-2026-118",
    }),
    dbx.client, "t", CTX,
  );
  await postAccountFreeze(
    req({ account_ref: "a1", authority: "fraud_hold" }), dbx.client, "t", CTX,
  );
  assertEquals(dbx.rows["core.account"][0].active_freeze_count, 2);

  await postFreezeRelease(
    req({ release_reference: "fraud-cleared" }), "frz_a1_fraud_hold", dbx.client, "t", CTX,
  );

  // THE BUG THIS EXISTS TO PREVENT. A boolean flag would now be false and the
  // court order would be unenforced — money released under active legal process.
  const acct = dbx.rows["core.account"][0];
  assertEquals(acct.active_freeze_count, 1);
  assertEquals(acct.debits_blocked, true, "the court order is still standing");
});

Deno.test("RS-04: releasing the LAST freeze does clear the account", async () => {
  const dbx = makeDrillDb();
  withAccount(dbx);
  await postAccountFreeze(req({ account_ref: "a1", authority: "fraud_hold" }), dbx.client, "t", CTX);
  await postFreezeRelease(
    req({ release_reference: "cleared" }), "frz_a1_fraud_hold", dbx.client, "t", CTX,
  );
  const acct = dbx.rows["core.account"][0];
  assertEquals(acct.active_freeze_count, 0);
  assertEquals(acct.debits_blocked, false, "derived, so it clears when nothing is left");
});

Deno.test("RS-04: a garnishment blocks debits and PERMITS credits", async () => {
  const dbx = makeDrillDb();
  withAccount(dbx);
  await postAccountFreeze(
    req({ account_ref: "a1", authority: "garnishment", legal_process_reference: "NC-1" }),
    dbx.client, "t", CTX,
  );
  const res = await postFrozenAccountCredit(req({ amount_cents: 250_000 }), "a1", dbx.client, "t", CTX);
  // The member's wages still land; they just cannot be spent. A blanket flag
  // bounces their payroll deposit, which is the case this models.
  assertEquals(res.status, 201);
  assertEquals(dbx.rows["core.account"][0].debits_blocked, true);
  assertEquals(dbx.rows["core.account"][0].credits_blocked, false);
  assert(codes(dbx.rows).includes("account_freeze.credit.posted"));
});

Deno.test("RS-04: an OFAC block stops credits too", async () => {
  const dbx = makeDrillDb();
  withAccount(dbx);
  await postAccountFreeze(req({ account_ref: "a1", authority: "ofac" }), dbx.client, "t", CTX);
  const res = await postFrozenAccountCredit(req({ amount_cents: 1 }), "a1", dbx.client, "t", CTX);
  const body = await res.json();
  assertEquals(body.data.posted, false);
});

Deno.test("RS-04: precedence is explicit and court process outranks the rest", async () => {
  assert(FREEZE_PRECEDENCE.court_order < FREEZE_PRECEDENCE.institution_freeze);
  assert(FREEZE_PRECEDENCE.tax_levy < FREEZE_PRECEDENCE.fraud_hold);

  const dbx = makeDrillDb();
  withAccount(dbx);
  await postAccountFreeze(req({ account_ref: "a1", authority: "fraud_hold" }), dbx.client, "t", CTX);
  await postAccountFreeze(
    req({ account_ref: "a1", authority: "court_order", legal_process_reference: "NC-1" }),
    dbx.client, "t", CTX,
  );
  const ev = (dbx.rows["core.event"] ?? [])
    .find((e) => e.code === "account_freeze.precedence.resolved");
  // Which one governs is RESOLVED and recorded, not left to whichever code path
  // happened to run last.
  assertEquals((ev!.payload as Any).governing_authority, "court_order");
});

Deno.test("RS-04: a legal-process freeze with no reference is refused", async () => {
  const dbx = makeDrillDb();
  withAccount(dbx);
  const res = await postAccountFreeze(
    req({ account_ref: "a1", authority: "garnishment" }), dbx.client, "t", CTX,
  );
  assertEquals(res.status, 400, "nobody could later show it was lawful rather than arbitrary");
});

Deno.test("RS-04: a release with no reference is refused", async () => {
  const dbx = makeDrillDb();
  withAccount(dbx);
  await postAccountFreeze(req({ account_ref: "a1", authority: "fraud_hold" }), dbx.client, "t", CTX);
  const res = await postFreezeRelease(req({}), "frz_a1_fraud_hold", dbx.client, "t", CTX);
  assertEquals(res.status, 400);
  assertEquals(dbx.rows["core.account"][0].debits_blocked, true, "still frozen");
});

// ------------------------------------------------------------------ RS-05

Deno.test("RS-05: activation with no evidence is refused", async () => {
  const dbx = makeDrillDb();
  const res = await postInstitutionFreeze(
    req({ order_reference: "ORD-1", ordered_by: "ncua" }), dbx.client, "t", CTX,
  );
  assertEquals(res.status, 400, "nothing to show an examiner and nothing to reverse");
});

Deno.test("RS-05: activation records evidence, notice and regulator confirmation", async () => {
  const dbx = makeDrillDb();
  await postInstitutionFreeze(
    req({
      order_reference: "ORD-1", ordered_by: "ncua",
      activation_evidence: { rails_disabled: ["ach", "wire"] },
      notice_template_id: "ntpl_v1", regulator_reference: "CONF-77",
    }),
    dbx.client, "t", CTX,
  );
  const c = codes(dbx.rows);
  assert(c.includes("institution_freeze.activated"));
  assert(c.includes("institution_freeze.activation_evidence"));
  // A freeze nobody announced is indistinguishable from an outage.
  assert(c.includes("institution_freeze.notice.published"));
  assert(c.includes("institution_freeze.regulator.confirmed"));
});

// ------------------------------------------------------------------ RS-06

Deno.test("RS-06: read-only access with no dated snapshot is refused", async () => {
  const dbx = makeDrillDb();
  const res = await postMemberPortalState(req({ core_unavailable: true }), dbx.client, "t", CTX);
  // Serving live balances from a core that is DOWN serves nothing.
  assertEquals(res.status, 400);
});

Deno.test("RS-06: access serves the snapshot and is logged as evidence", async () => {
  const dbx = makeDrillDb();
  await postMemberPortalState(
    req({
      core_unavailable: true, claims_template_id: "claims_v1",
      snapshot_as_of: "2026-07-18T23:59:59.000Z",
    }),
    dbx.client, "t", CTX,
  );
  await postMemberPortalAccess(req({ member_ref: "m1" }), dbx.client, "t", CTX);
  const acc = dbx.rows["core.member_portal_access"][0];
  assertEquals(acc.snapshot_served_as_of, "2026-07-18T23:59:59.000Z");
  // Who saw what, as of when — what answers a later dispute.
  assert(codes(dbx.rows).includes("member_portal.access.logged"));
});

// ------------------------------------------------------------------ RS-02

async function threeIndicators(dbx: Any) {
  for (const [id, thr] of [
    ["deposit_outflow_bp", { breach_at: 300 }], ["lar_bp", { breach_at: 700 }],
    ["nonperforming_bp", { breach_at: 200 }], ["unconfigured", null],
  ] as Any[]) {
    await postEwiIndicator(
      req({ indicator_id: id, name: id, thresholds: thr, schedule: "daily" }),
      dbx.client, "t", CTX,
    );
  }
}

Deno.test("RS-02: an indicator with no configured threshold yields NO verdict", async () => {
  const dbx = makeDrillDb();
  await threeIndicators(dbx);
  await postEwiSweep(
    req({ period: "d1", observations: [{ indicator_id: "unconfigured", value: 999_999 }] }),
    dbx.client, "t", CTX,
  );
  const o = dbx.rows["core.ewi_observation"][0];
  // §5k again: institutional threshold, nullable, paired verdict.
  assertEquals(o.breached, null, "999,999 against no threshold is still no verdict");
  assert(!codes(dbx.rows).includes("ewi.threshold.breached"));
});

Deno.test("RS-02: an already-breached indicator does not re-alert", async () => {
  const dbx = makeDrillDb();
  await threeIndicators(dbx);
  await postEwiSweep(
    req({ period: "d1", observations: [{ indicator_id: "deposit_outflow_bp", value: 400 }] }),
    dbx.client, "t", CTX,
  );
  const first = codes(dbx.rows).filter((c) => c === "ewi.threshold.breached").length;
  assertEquals(first, 1);
  await postEwiSweep(
    req({ period: "d2", observations: [{ indicator_id: "deposit_outflow_bp", value: 450 }] }),
    dbx.client, "t", CTX,
  );
  // Re-alerting every sweep is how a real breach gets lost in the noise.
  assertEquals(codes(dbx.rows).filter((c) => c === "ewi.threshold.breached").length, 1);
  // and the second observation is a SEPARATE row — if the two collided on their
  // id the suppression above would pass for the wrong reason
  assertEquals(dbx.rows["core.ewi_observation"].length, 2);
  const second = dbx.rows["core.ewi_observation"].find((o) => o.ewi_value === 450)!;
  assertEquals(second.ewi_prior_breach_state, true, "it knew it was already breached");
});

Deno.test("RS-02: the posture is a standing state and moves with the breach count", async () => {
  const dbx = makeDrillDb();
  await threeIndicators(dbx);
  await postEwiSweep(
    req({ period: "d1", observations: [{ indicator_id: "deposit_outflow_bp", value: 400 }] }),
    dbx.client, "t", CTX,
  );
  assertEquals(dbx.rows["core.resolution_posture"][0].resolution_posture_current, "watch");

  await postEwiSweep(
    req({
      period: "d2",
      observations: [
        { indicator_id: "deposit_outflow_bp", value: 450 },
        { indicator_id: "lar_bp", value: 800 },
        { indicator_id: "nonperforming_bp", value: 300 },
      ],
    }),
    dbx.client, "t", CTX,
  );
  const latest = dbx.rows["core.resolution_posture"]
    .sort((a, b) => String(b.changed_at).localeCompare(String(a.changed_at)))[0];
  assertEquals(latest.resolution_posture_current, "heightened");
  // The CEO summary goes out on the CHANGE, not on every sweep.
  assert(codes(dbx.rows).includes("ewi.ceo_summary.sent"));
});

// ------------------------------------------------------------------ RS-08

Deno.test("RS-08: a package whose checksum chain does not match FAILS", async () => {
  const dbx = makeDrillDb();
  await postRecordsPackage(
    req({
      manifest_id: "man_1", checksum_chain: { root: "deadbeef" },
      expected_checksum: "cafebabe",
    }),
    dbx.client, "t", CTX,
  );
  const p = dbx.rows["core.records_package"][0];
  assertEquals(p.completed_at, null, "completed and failed are mutually exclusive");
  assert(p.verification_failed_at !== null);
  assert(String(p.records_package_failure_reason).includes("deadbeef"));
  assert(codes(dbx.rows).includes("records_package.verification.failed"));
  assert(!codes(dbx.rows).includes("records_package.completed"));
});

Deno.test("RS-08: a package with NO chain at all fails rather than completing", async () => {
  const dbx = makeDrillDb();
  await postRecordsPackage(req({ manifest_id: "man_2" }), dbx.client, "t", CTX);
  const p = dbx.rows["core.records_package"][0];
  // "Completed" with no verifiable chain is a directory somebody said was fine.
  assertEquals(p.completed_at, null);
  assertEquals(p.records_package_failure_reason, "no checksum chain produced");
});

Deno.test("RS-08: a matching chain completes", async () => {
  const dbx = makeDrillDb();
  await postRecordsPackage(
    req({
      manifest_id: "man_3", snapshot_as_of: "2026-07-18T23:59:59.000Z",
      checksum_chain: { root: "cafebabe", links: 412 }, expected_checksum: "cafebabe",
    }),
    dbx.client, "t", CTX,
  );
  const p = dbx.rows["core.records_package"][0];
  assert(p.completed_at !== null);
  assertEquals(p.verification_failed_at, null);
  assert(codes(dbx.rows).includes("records_package.completed"));
});

Deno.test("a partner token cannot reach the resolution routes", async () => {
  const dbx = makeDrillDb();
  const res = await postAccountFreeze(
    req({ account_ref: "a1", authority: "fraud_hold" }), dbx.client, "t",
    { ...CTX, actorType: "partner" } as Any,
  );
  assertEquals(res.status, 404);
});
