// The tail — SoD, reconciliation ageing, assets, red flags, capital actions,
// affiliates, EPS.
//
// IC-02 is the only new SHAPE here and it gets the most tests: separation of
// duties is a PAIR constraint. Every other control in this repo asks "may this
// person do X"; SoD asks "may this person do X GIVEN they can already do Y",
// which cannot be answered from a role row.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { makeDrillDb } from "../drill/fake_db.ts";
import { OPS_CTX, req } from "./test_helpers.ts";
import {
  AFFILIATE_SINGLE_LIMIT_BP, postAchControlResults, postAffiliate, postAffiliateTransaction,
  postCapitalAction, postEpsControlReview, postEpsDeployment, postEpsLimitChange,
  postEpsProposal, postItAsset, postPospayItem, postReconItem, postRedflagCase,
  postRedflagRuleset, postRoleGrant, postSodRule, postWireRelease, RECON_ESCALATION_DAYS,
} from "./tail.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
const CTX = OPS_CTX;
const codes = (rows: Record<string, Any[]>) =>
  (rows["core.event"] ?? []).map((e) => String(e.code));

async function conflictRule(dbx: Any) {
  await postSodRule(
    req({
      role_a: "payment_initiator", role_b: "payment_approver",
      conflict: "initiate and approve the same payment",
      rationale: "one person could move money with no second pair of eyes",
    }),
    dbx.client, "t", CTX,
  );
}

// ============================== IC-02 the pair constraint ==================

Deno.test("IC-02: the conflicting grant is BLOCKED at grant time, not reviewed later", async () => {
  const dbx = makeDrillDb();
  await conflictRule(dbx);
  await postRoleGrant(
    req({ subject_ref: "u1", role_id: "payment_initiator" }), dbx.client, "t", CTX,
  );
  const res = await postRoleGrant(
    req({ subject_ref: "u1", role_id: "payment_approver" }), dbx.client, "t", CTX,
  );
  // A quarterly review finds the conflict has been live for three months, which
  // is three months of one person moving money unchecked.
  assertEquals(res.status, 409);
  const grant = dbx.rows["core.access_role_grant"].find((g) => g.access_role_id === "payment_approver")!;
  assertEquals(grant.granted_at, null);
  assert(grant.blocked_at !== null);
  assertEquals(grant.sod_check_result, "conflict");
  assert(codes(dbx.rows).includes("sod.grant.blocked"));
});

Deno.test("IC-02: the SAME role is clear for a DIFFERENT subject — it is the pair", async () => {
  const dbx = makeDrillDb();
  await conflictRule(dbx);
  await postRoleGrant(req({ subject_ref: "u1", role_id: "payment_initiator" }), dbx.client, "t", CTX);
  const res = await postRoleGrant(
    req({ subject_ref: "u2", role_id: "payment_approver" }), dbx.client, "t", CTX,
  );
  // The conflict is not a property of `payment_approver`. This is the whole
  // reason it cannot live on a role row.
  assertEquals(res.status, 201);
  assertEquals(
    dbx.rows["core.access_role_grant"].find((g) => g.subject_ref === "u2")!.sod_check_result,
    "clear",
  );
});

Deno.test("IC-02: a BLOCKED role does not count as held for the next check", async () => {
  const dbx = makeDrillDb();
  await conflictRule(dbx);
  await postSodRule(
    req({ role_a: "payment_approver", role_b: "vendor_admin", rationale: "pay a vendor you created" }),
    dbx.client, "t", CTX,
  );
  await postRoleGrant(req({ subject_ref: "u1", role_id: "payment_initiator" }), dbx.client, "t", CTX);
  await postRoleGrant(req({ subject_ref: "u1", role_id: "payment_approver" }), dbx.client, "t", CTX);
  // payment_approver was BLOCKED, so it must not make vendor_admin conflict.
  const res = await postRoleGrant(
    req({ subject_ref: "u1", role_id: "vendor_admin" }), dbx.client, "t", CTX,
  );
  assertEquals(res.status, 201, "a blocked grant is not a held role");
});

Deno.test("IC-02: an unavoidable conflict is accepted only WITH a compensating control", async () => {
  const dbx = makeDrillDb();
  await conflictRule(dbx);
  await postRoleGrant(req({ subject_ref: "u2", role_id: "payment_initiator" }), dbx.client, "t", CTX);
  const res = await postRoleGrant(
    req({
      subject_ref: "u2", role_id: "payment_approver",
      compensating_control: "all payments over $10k reviewed by internal audit weekly",
      compensating_approved_by: "cro_1",
    }),
    dbx.client, "t", CTX,
  );
  assertEquals(res.status, 201);
  const g = dbx.rows["core.access_role_grant"].find((x) => x.access_role_id === "payment_approver")!;
  assert(g.granted_at !== null);
  // and it EXPIRES. A permanent exception created by someone who has since left
  // is the failure this shape exists to prevent.
  assert(g.compensating_expires_at !== null);
  assert(codes(dbx.rows).includes("sod.compensating_control.approved"));
});

Deno.test("IC-02: a compensating control with no approver does not unblock", async () => {
  const dbx = makeDrillDb();
  await conflictRule(dbx);
  await postRoleGrant(req({ subject_ref: "u3", role_id: "payment_initiator" }), dbx.client, "t", CTX);
  const res = await postRoleGrant(
    req({ subject_ref: "u3", role_id: "payment_approver", compensating_control: "we'll watch it" }),
    dbx.client, "t", CTX,
  );
  assertEquals(res.status, 409, "an unapproved compensating control is a hope");
});

// ================================== IC-04 ageing ===========================

Deno.test("IC-04: age is the control — a fresh variance does not escalate", async () => {
  const dbx = makeDrillDb();
  await postReconItem(
    req({ recon_ref: "r1", cadence: "daily", variance_cents: 1250, owner: "acct_1", age_days: 1 }),
    dbx.client, "t", CTX,
  );
  assertEquals(dbx.rows["core.recon_item"][0].escalated_at, null);
  assert(!codes(dbx.rows).includes("recon.item.escalated"));
});

Deno.test("IC-04: at the threshold it escalates, and must carry the research", async () => {
  const dbx = makeDrillDb();
  const res = await postReconItem(
    req({
      recon_ref: "r2", cadence: "monthly", variance_cents: 40_000,
      owner: "acct_2", age_days: RECON_ESCALATION_DAYS,
    }),
    dbx.client, "t", CTX,
  );
  assertEquals(res.status, 400, "escalating with nothing researched escalates a mystery");

  await postReconItem(
    req({
      recon_ref: "r2", cadence: "monthly", variance_cents: 40_000,
      owner: "acct_2", age_days: RECON_ESCALATION_DAYS,
      research_notes: "traced to an unposted ACH return from March",
    }),
    dbx.client, "t", CTX,
  );
  assert(codes(dbx.rows).includes("recon.item.escalated"));
});

// ==================================== IS-03 ================================

Deno.test("IS-03: an asset with no named owner is refused", async () => {
  const dbx = makeDrillDb();
  const res = await postItAsset(
    req({ asset_id: "s1", classification: "restricted" }), dbx.client, "t", CTX,
  );
  // IS-03 is an ownership control, not an inventory one.
  assertEquals(res.status, 400);
});

Deno.test("IS-03: an attestation needs the name of whoever made it", async () => {
  const dbx = makeDrillDb();
  const res = await postItAsset(
    req({ asset_id: "s1", owner: "infra", classification: "internal", attest: true }),
    dbx.client, "t", CTX,
  );
  assertEquals(res.status, 400);
});

// ==================================== IS-10 ================================

Deno.test("IS-10: a case whose required step-up never completed cannot be disposed", async () => {
  const dbx = makeDrillDb();
  const res = await postRedflagCase(
    req({
      account_id: "a1", type: "address_change_then_card", stepup_required: true,
      disposition: "closed, no fraud",
    }),
    dbx.client, "t", CTX,
  );
  // An unverified member proceeded as a verified one, and closing hides it.
  assertEquals(res.status, 409);
  assertEquals((dbx.rows["core.redflag_case"] ?? []).length, 0);
});

Deno.test("IS-10: dispositions feed the next ruleset", async () => {
  const dbx = makeDrillDb();
  await postRedflagCase(
    req({
      account_id: "a1", type: "address_change_then_card", stepup_required: true,
      stepup_completed: true, disposition: "confirmed takeover", sar_filing_id: "SAR-1",
    }),
    dbx.client, "t", CTX,
  );
  await postRedflagRuleset(
    req({ ruleset: { window_days: 30 }, pattern_updates: ["widen to 45 days"] }),
    dbx.client, "t", CTX,
  );
  const stats = dbx.rows["core.redflag_ruleset"][0].redflag_case_stats as Any;
  // A detection ruleset that never learns from its own dispositions detects
  // last year's fraud.
  assertEquals(stats.disposed, 1);
  assertEquals(stats.by_type.address_change_then_card, 1);
});

// ================================ CP-08 / CP-09 ============================

Deno.test("CP-09: executing ahead of the regulator is refused", async () => {
  const dbx = makeDrillDb();
  const res = await postCapitalAction(
    req({
      position_id: "cap_1", action_type: "subordinated_debt", amount_cents: 5_000_000,
      regulatory_preapproval_status: "pending", board_resolution_id: "BR-1", execute: true,
    }),
    dbx.client, "t", CTX,
  );
  assertEquals(res.status, 409, "a pending preapproval is not a paperwork lag");
  assertEquals((dbx.rows["core.capital_action"] ?? []).length, 0);
});

Deno.test("CP-09: a distribution while distributions are restricted is refused", async () => {
  const dbx = makeDrillDb();
  const res = await postCapitalAction(
    req({
      position_id: "cap_1", action_type: "distribution", amount_cents: 500_000,
      distribution_restriction: true, board_resolution_id: "BR-1", execute: true,
    }),
    dbx.client, "t", CTX,
  );
  assertEquals(res.status, 409, "the restriction exists for exactly this action");
});

Deno.test("CP-08: the contingency events now carry the action they are about", async () => {
  const dbx = makeDrillDb();
  await postCapitalAction(
    req({
      position_id: "cap_1", action_type: "subordinated_debt", amount_cents: 5_000_000,
      expected_capital_impact_cents: 5_000_000, regulatory_preapproval_status: "granted",
      regulatory_preapproval_id: "NCUA-PRE-9", board_resolution_id: "BR-1", execute: true,
    }),
    dbx.client, "t", CTX,
  );
  const ev = (dbx.rows["core.event"] ?? [])
    .find((e) => e.code === "capital.contingency_action.executed");
  // These three fired with EMPTY payloads before this artifact — a verb with no
  // noun, the same smell the earlier sweep found on loan.dpd_reset.
  assertEquals((ev!.payload as Any)["capital.action_amount"], 5_000_000);
  assertEquals((ev!.payload as Any)["capital.action_type"], "subordinated_debt");
});

Deno.test("CP-09: an executed action needs the board resolution behind it", async () => {
  const dbx = makeDrillDb();
  const res = await postCapitalAction(
    req({
      position_id: "cap_1", action_type: "asset_sale", amount_cents: 1,
      regulatory_preapproval_status: "not_required", execute: true,
    }),
    dbx.client, "t", CTX,
  );
  assertEquals(res.status, 400);
});

// ==================================== DF-06 ================================

Deno.test("DF-06: funding over the affiliate limit is refused", async () => {
  const dbx = makeDrillDb();
  await postAffiliate(req({ list_entry: "CUSO", relationship: "cuso" }), dbx.client, "t", CTX);
  const res = await postAffiliateTransaction(
    req({
      type: "credit", amount_cents: 20_000_000, capital_surplus_cents: 100_000_000,
      lqa_screened: true, fund: true,
    }),
    "aff_CUSO", dbx.client, "t", CTX,
  );
  assertEquals(res.status, 409);
  assertEquals(
    (dbx.rows["core.affiliate_transaction"] ?? []).length, 0,
    "the funding is refused, not recorded as funded",
  );
});

Deno.test("DF-06: unscreened is not screened-and-clean", async () => {
  const dbx = makeDrillDb();
  await postAffiliate(req({ list_entry: "CUSO" }), dbx.client, "t", CTX);
  const res = await postAffiliateTransaction(
    req({ type: "credit", amount_cents: 5_000_000, capital_surplus_cents: 100_000_000, fund: true }),
    "aff_CUSO", dbx.client, "t", CTX,
  );
  assertEquals(res.status, 409);
});

Deno.test("DF-06: a limit expressed against capital cannot be checked without capital", async () => {
  const dbx = makeDrillDb();
  await postAffiliate(req({ list_entry: "CUSO" }), dbx.client, "t", CTX);
  const res = await postAffiliateTransaction(
    req({ type: "credit", amount_cents: 1 }), "aff_CUSO", dbx.client, "t", CTX,
  );
  // Refused rather than defaulted: a default here is a limit nobody set.
  assertEquals(res.status, 400);
});

Deno.test("DF-06: a within-limit screened transaction funds and archives", async () => {
  const dbx = makeDrillDb();
  await postAffiliate(req({ list_entry: "CUSO" }), dbx.client, "t", CTX);
  await postAffiliateTransaction(
    req({
      type: "credit", amount_cents: 5_000_000, capital_surplus_cents: 100_000_000,
      collateral_type: "us_treasury", collateral_value_cents: 6_500_000,
      lqa_screened: true, fund: true,
    }),
    "aff_CUSO", dbx.client, "t", CTX,
  );
  const tx = dbx.rows["core.affiliate_transaction"][0];
  assertEquals(tx.affiliate_limit_utilization_bp, 500);
  assert(tx.affiliate_limit_utilization_bp < AFFILIATE_SINGLE_LIMIT_BP);
  assert(tx.file_archived_at !== null);
});

// ==================================== EPS ==================================

Deno.test("EPS-01: activation before ERM approval is refused", async () => {
  const dbx = makeDrillDb();
  const res = await postEpsProposal(
    req({ service_id: "rtp", sponsor: "vp", activate: true }), dbx.client, "t", CTX,
  );
  // The gate is the ACTIVATION, not the paperwork.
  assertEquals(res.status, 409);
});

Deno.test("EPS-01: the inherent score lands in the enterprise risk register", async () => {
  const dbx = makeDrillDb();
  await postEpsProposal(
    req({ service_id: "rtp", sponsor: "vp", inherent_score: 7 }), dbx.client, "t", CTX,
  );
  const r = dbx.rows["core.risk"][0];
  assertEquals(r.inherent_score, 7);
  assertEquals(r.inherent_rating, "high", "a register that omits new services does not describe the enterprise");
});

Deno.test("EPS-03: a found deficiency with no rating cannot be prioritised", async () => {
  const dbx = makeDrillDb();
  const res = await postEpsControlReview(
    req({
      service_id: "rtp", checklist: { dual_control: true },
      deficiency_found: true, description: "no dual control",
    }),
    dbx.client, "t", CTX,
  );
  assertEquals(res.status, 400);
});

Deno.test("EPS-03: a found deficiency opens remediation in the same write", async () => {
  const dbx = makeDrillDb();
  await postEpsControlReview(
    req({
      service_id: "rtp", checklist: { dual_control: true }, deficiency_found: true,
      description: "no dual control on limit changes", rating: "high",
    }),
    dbx.client, "t", CTX,
  );
  const r = dbx.rows["core.eps_control_review"][0];
  // A review that finds and does nothing documented the problem for the next
  // reviewer.
  assert(r.remediation_due_at !== null);
  assert(codes(dbx.rows).includes("eps.deficiency_remediation.opened"));
});

Deno.test("EPS-10: no rollback plan, no deployment", async () => {
  const dbx = makeDrillDb();
  const res = await postEpsDeployment(req({ service_id: "rtp" }), dbx.client, "t", CTX);
  assertEquals(res.status, 400);
});

Deno.test("EPS-10: the emergency path needs MORE, not less", async () => {
  const dbx = makeDrillDb();
  const res = await postEpsDeployment(
    req({ service_id: "rtp", rollback_plan: "revert to v3.2", emergency: true }),
    dbx.client, "t", CTX,
  );
  // The emergency path is where the normal gates were skipped; the approval IS
  // the record of who chose that.
  assertEquals(res.status, 409);
});

Deno.test("EPS-10: shipping with known defects requires a recorded acceptance", async () => {
  const dbx = makeDrillDb();
  const res = await postEpsDeployment(
    req({ service_id: "rtp", rollback_plan: "revert", defects: ["timeout on resend"] }),
    dbx.client, "t", CTX,
  );
  assertEquals(res.status, 400);
});

Deno.test("EPS-06: an unconfigured IP allowlist is UNKNOWN, and unknown is not permission", async () => {
  const dbx = makeDrillDb();
  await postWireRelease(
    req({
      wire_ref: "w1", originator_id: "o1", pin_verified: true, ip: "203.0.113.9",
      second_approval: "ops_2",
    }),
    dbx.client, "t", CTX,
  );
  const r = dbx.rows["core.wire_release"][0];
  assertEquals(r.eps_wire_ip_allowlisted, null);
  assertEquals(r.released_at, null, "a null cannot satisfy the release condition");
  assert(!codes(dbx.rows).includes("eps.wire_ip.verified"));
});

Deno.test("EPS-06: an allowlisted IP with PIN and second approval releases", async () => {
  const dbx = makeDrillDb();
  await postWireRelease(
    req({
      wire_ref: "w2", originator_id: "o1", pin_verified: true, ip: "203.0.113.9",
      ip_allowlist: ["203.0.113.9"], second_approval: "ops_2",
    }),
    dbx.client, "t", CTX,
  );
  assert(dbx.rows["core.wire_release"][0].released_at !== null);
  assert(codes(dbx.rows).includes("eps.wire_ip.verified"));
});

Deno.test("EPS-06: an IP off the allowlist does not release", async () => {
  const dbx = makeDrillDb();
  await postWireRelease(
    req({
      wire_ref: "w3", originator_id: "o1", pin_verified: true, ip: "198.51.100.4",
      ip_allowlist: ["203.0.113.9"], second_approval: "ops_2",
    }),
    dbx.client, "t", CTX,
  );
  assertEquals(dbx.rows["core.wire_release"][0].released_at, null);
});

Deno.test("EPS-06: a verdict with no individual check results is refused", async () => {
  const dbx = makeDrillDb();
  const res = await postAchControlResults(
    req({ transfer_ref: "a1", amount_cents: 1 }), dbx.client, "t", CTX,
  );
  // One boolean standing in for five cannot say which check would have caught
  // what got through.
  assertEquals(res.status, 400);
});

Deno.test("EPS-06: the pass verdict is DERIVED from the individual checks", async () => {
  const dbx = makeDrillDb();
  await postAchControlResults(
    req({
      transfer_ref: "a1", amount_cents: 1,
      checks: { within_limit: true, template_matched: false, dual_control: true },
    }),
    dbx.client, "t", CTX,
  );
  assertEquals(dbx.rows["core.ach_control_result"][0].passed, false);
});

Deno.test("EPS-06: a limit change approved by its own requester is refused", async () => {
  const dbx = makeDrillDb();
  const res = await postEpsLimitChange(
    req({ partner_id: "p1", justification: "volume", approver_id: CTX.tokenId }),
    dbx.client, "t", CTX,
  );
  // A limit an operator can raise for themselves is not a limit.
  assertEquals(res.status, 409);
});

Deno.test("EPS-06: a positive-pay item carries its decision deadline", async () => {
  const dbx = makeDrillDb();
  await postPospayItem(
    req({ issue_file: "if_1", item_ref: "chk_1", item: { check_no: 1 } }), dbx.client, "t", CTX,
  );
  const p = dbx.rows["core.pospay_item"][0];
  // A missed deadline is a default-pay decision made by nobody.
  assert(p.eps_pospay_decision_due_at !== null);
  assertEquals(p.decision, null);
});

Deno.test("a partner token cannot reach the internal routes", async () => {
  const dbx = makeDrillDb();
  const res = await postRoleGrant(
    req({ subject_ref: "u1", role_id: "r1" }), dbx.client, "t",
    { ...CTX, actorType: "partner" } as Any,
  );
  assertEquals(res.status, 404);
});
