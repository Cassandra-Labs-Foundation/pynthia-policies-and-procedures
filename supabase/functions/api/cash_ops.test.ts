// Cash operations — CP-01..CP-12.
//
// The load-bearing negatives here are: a limit schedule that is not yet in
// force, an asset with no limit at all, one person doing both halves of dual
// control, a remediation claimed while still over the limit, a suspense item
// nobody clears, a seal that does not match, and a deviation approved without
// the bond that covers it. Every one of them leaves the happy path untouched.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { makeDrillDb } from "../drill/fake_db.ts";
import { OPS_CTX, req } from "./test_helpers.ts";
import {
  CMIR_THRESHOLD_CENTS,
  limitInForce,
  postCashDeviationDecision,
  postCashDeviationRequest,
  postCashEnterprisePosition,
  postCashEnterpriseRemediation,
  postCashException,
  postCashKriPublish,
  postCashLimitsSchedule,
  postCashLoad,
  postCashNightDropRetrieval,
  postCashOverShort,
  postCashRecordsPackage,
  postCashReconciliation,
  postCashShipment,
  postCashShipmentVerify,
  postCashSurpriseCountComplete,
  postCashSurpriseCountSchedule,
  postCashSuspenseClear,
  postCashSuspenseSweep,
  putCashAsset,
} from "./cash_ops.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
const CTX = OPS_CTX;

function codes(rows: Record<string, Any[]>): string[] {
  return (rows["core.event"] ?? []).map((e) => String(e.code));
}

async function seedVault(limit = 750_000_00, balance = 500_000_00) {
  const dbx = makeDrillDb();
  const db = dbx.client;
  await putCashAsset(
    req({ asset_type: "vault", location_id: "b1", balance_cents: balance, custodian_user_id: "cust_1" }),
    "v1", db, "t", CTX,
  );
  await postCashLimitsSchedule(
    req({ asset_id: "v1", limit_cents: limit, effective_at: "2026-01-01T00:00:00.000Z" }),
    db, "t", CTX,
  );
  return { dbx, db };
}

// ------------------------------------------------ CP-04 limits and ordering

Deno.test("CP-04: a FUTURE-dated schedule does not govern today — effective order, not insert order", async () => {
  const { db } = await seedVault();
  await postCashLimitsSchedule(
    req({ asset_id: "v1", limit_cents: 2_000_000_00, effective_at: "2027-01-01T00:00:00.000Z" }),
    db, "t", CTX,
  );
  const now = await limitInForce(db, "core", "v1", new Date("2026-07-19T12:00:00Z"));
  assertEquals(now!.limit_cents, 750_000_00, "the 2027 schedule must not apply in 2026");
  const later = await limitInForce(db, "core", "v1", new Date("2027-06-01T00:00:00Z"));
  assertEquals(later!.limit_cents, 2_000_000_00);
});

Deno.test("CP-04: a BACKDATED correction wins on effective date, not on being typed second", async () => {
  const { db } = await seedVault();
  // entered later, effective EARLIER — must not become the row in force
  await postCashLimitsSchedule(
    req({ asset_id: "v1", limit_cents: 100_00, effective_at: "2025-01-01T00:00:00.000Z" }),
    db, "t", CTX,
  );
  const now = await limitInForce(db, "core", "v1", new Date("2026-07-19T12:00:00Z"));
  assertEquals(now!.limit_cents, 750_000_00);
});

Deno.test("CP-04: an EXPIRED deviation stops governing — that is what makes it seasonal", async () => {
  const { db } = await seedVault();
  await postCashLimitsSchedule(
    req({
      asset_id: "v1", limit_cents: 9_000_000_00, effective_at: "2026-02-01T00:00:00.000Z",
      deviation_id: "dev_1", sunset_at: "2026-03-01T00:00:00.000Z",
    }),
    db, "t", CTX,
  );
  const now = await limitInForce(db, "core", "v1", new Date("2026-07-19T12:00:00Z"));
  assertEquals(now!.limit_cents, 750_000_00, "the lapsed deviation must not still apply");
});

Deno.test("CP-04: the limit is tested against the PROJECTED balance", async () => {
  const { dbx, db } = await seedVault();
  // 500k balance + 300k = 800k, over the 750k limit. Testing the CURRENT
  // balance would permit it.
  const res = await postCashLoad(
    req({ amount_cents: 300_000_00, counter_user_id: "a", custodian_user_id: "b" }),
    "v1", db, "t", CTX,
  );
  assertEquals(res.status, 409);
  assertEquals(dbx.rows["core.cash_load"][0].decision, "blocked");
  assertEquals(dbx.rows["core.cash_load"][0].blocked_reason, "limit_exceeded");
  assertEquals(dbx.rows["core.cash_asset"][0].balance_cents, 500_000_00, "no cash moved");
  assert(codes(dbx.rows).includes("cash.limit_block.alerted"));
});

Deno.test("CP-04: NO limit in force blocks — unknown is not permission", async () => {
  const dbx = makeDrillDb();
  await putCashAsset(
    req({ asset_type: "teller_drawer", location_id: "b2", balance_cents: 100 }),
    "d1", dbx.client, "t", CTX,
  );
  const res = await postCashLoad(
    req({ amount_cents: 100, counter_user_id: "a", custodian_user_id: "b" }),
    "d1", dbx.client, "t", CTX,
  );
  assertEquals(res.status, 409);
  assertEquals(dbx.rows["core.cash_load"][0].blocked_reason, "no_limit_in_force");
});

Deno.test("CP-04: one person cannot be both counter and custodian", async () => {
  const { dbx, db } = await seedVault();
  const res = await postCashLoad(
    req({ amount_cents: 100, counter_user_id: "same", custodian_user_id: "same" }),
    "v1", db, "t", CTX,
  );
  assertEquals(res.status, 409);
  assertEquals(dbx.rows["core.cash_load"][0].blocked_reason, "dual_control_self");
  assert(!codes(dbx.rows).includes("cash.dual_control.completed"));
});

Deno.test("CP-04: a permitted load moves the cash and records dual control", async () => {
  const { dbx, db } = await seedVault();
  const res = await postCashLoad(
    req({ amount_cents: 100_000_00, counter_user_id: "a", custodian_user_id: "b" }),
    "v1", db, "t", CTX,
  );
  assertEquals(res.status, 201);
  assertEquals(dbx.rows["core.cash_asset"][0].balance_cents, 600_000_00);
  assert(codes(dbx.rows).includes("cash.dual_control.completed"));
  assertEquals(dbx.violations, []);
});

// ---------------------------------------------------- CP-03 enterprise limit

Deno.test("CP-03: an unset Board limit reports UNASSESSED, never 'within limit'", async () => {
  const dbx = makeDrillDb();
  await postCashEnterprisePosition(
    req({ as_of_date: "2026-07-31", cash_cents: 9_000_000_00, gl_total_assets_cents: 50_000_000_00 }),
    dbx.client, "t", CTX,
  );
  assertEquals(dbx.rows["core.cash_enterprise_position"][0].verdict, "unassessed");
  assert(!codes(dbx.rows).includes("cash.enterprise_limit.breached"));
  assert(!codes(dbx.rows).includes("cash.enterprise_limit.warning"));
});

Deno.test("CP-03: the warning band fires below the limit and does NOT report a breach", async () => {
  const dbx = makeDrillDb();
  await postCashEnterprisePosition(
    req({
      as_of_date: "2026-05-31", cash_cents: 1_200_000_00,
      gl_total_assets_cents: 50_000_000_00, limit_bp: 300, warning_bp: 200,
    }),
    dbx.client, "t", CTX,
  );
  assertEquals(dbx.rows["core.cash_enterprise_position"][0].verdict, "warning");
  assert(codes(dbx.rows).includes("cash.enterprise_limit.warning"));
  assert(!codes(dbx.rows).includes("cash.enterprise_limit.breached"));
});

Deno.test("CP-03: a breach notifies treasury and starts the remediation clock", async () => {
  const dbx = makeDrillDb();
  await postCashEnterprisePosition(
    req({
      as_of_date: "2026-06-30", cash_cents: 2_000_000_00,
      gl_total_assets_cents: 50_000_000_00, limit_bp: 300, warning_bp: 200,
    }),
    dbx.client, "t", CTX,
  );
  const p = dbx.rows["core.cash_enterprise_position"][0];
  assertEquals(p.verdict, "breached");
  assertEquals(p.excess_cents, 2_000_000_00 - 1_500_000_00);
  assert(p.remediation_due_at);
  assert(codes(dbx.rows).includes("treasury.invest_excess.notified"));
});

Deno.test("CP-03: a remediation is refused while the position is still over the limit", async () => {
  const dbx = makeDrillDb();
  await postCashEnterprisePosition(
    req({
      as_of_date: "2026-06-30", cash_cents: 2_000_000_00,
      gl_total_assets_cents: 50_000_000_00, limit_bp: 300,
    }),
    dbx.client, "t", CTX,
  );
  const bad = await postCashEnterpriseRemediation(
    req({ action: "swept", cash_cents: 1_900_000_00 }), "cashent_20260630", dbx.client, "t", CTX,
  );
  assertEquals(bad.status, 409);
  assert(!codes(dbx.rows).includes("cash.enterprise_limit.remediated"));

  const good = await postCashEnterpriseRemediation(
    req({ action: "swept", cash_cents: 1_400_000_00 }), "cashent_20260630", dbx.client, "t", CTX,
  );
  assertEquals(good.status, 200);
  assert(codes(dbx.rows).includes("cash.enterprise_limit.remediated"));
});

// ---------------------------------------------------- CP-06 recon / suspense

Deno.test("CP-06: a variance parks in GL suspense with an aging clock", async () => {
  const { dbx, db } = await seedVault();
  await postCashReconciliation(
    req({ business_date: "2026-07-16", counted_cents: 499_950_00, gl_balance_cents: 500_000_00 }),
    "v1", db, "t", CTX,
  );
  const rec = dbx.rows["core.cash_reconciliation"][0];
  assertEquals(rec.balanced, false);
  assertEquals(rec.variance_cents, -50_00);
  const sus = dbx.rows["core.gl_cash_suspense"][0];
  assert(sus.escalate_at, "an unreconciled item must carry its own clock");
  assert(codes(dbx.rows).includes("gl.cash_suspense.posted"));
});

Deno.test("CP-06: a balanced day posts NO suspense item", async () => {
  const { dbx, db } = await seedVault();
  await postCashReconciliation(
    req({ business_date: "2026-07-15", counted_cents: 500_000_00, gl_balance_cents: 500_000_00 }),
    "v1", db, "t", CTX,
  );
  assertEquals((dbx.rows["core.gl_cash_suspense"] ?? []).length, 0);
  assert(codes(dbx.rows).includes("cash.recon.completed"));
});

Deno.test("CP-06: the sweep escalates an aged item and touches every row it examines", async () => {
  const { dbx, db } = await seedVault();
  await postCashReconciliation(
    req({ business_date: "2026-07-16", counted_cents: 499_950_00, gl_balance_cents: 500_000_00 }),
    "v1", db, "t", CTX,
  );
  await postCashReconciliation(
    req({ business_date: "2026-07-17", counted_cents: 499_900_00, gl_balance_cents: 500_000_00 }),
    "v1", db, "t", CTX,
  );
  // age only the first
  dbx.rows["core.gl_cash_suspense"][0].escalate_at = "2020-01-01T00:00:00.000Z";
  // stamp BOTH rows with a sentinel so "was this touched" is decidable. The
  // first version of this test compared updated_at to itself and asserted
  // `!== undefined`, which is true of every row the sweep never looked at —
  // a vacuous assertion that survived the starvation mutation. Caught by
  // mutating the sweep and finding the suite did not care.
  const SENTINEL = "1999-01-01T00:00:00.000Z";
  for (const r of dbx.rows["core.gl_cash_suspense"]) r.updated_at = SENTINEL;

  await postCashSuspenseSweep(req({}), db, "t", CTX);

  assertEquals(codes(dbx.rows).filter((c) => c === "gl.cash_suspense.escalated").length, 1);
  // the NON-escalated row must still have been touched, or a bounded
  // oldest-first sweep starves its tail forever
  const untouched = dbx.rows["core.gl_cash_suspense"]
    .filter((r) => r.updated_at === SENTINEL);
  assertEquals(
    untouched.length, 0,
    "every EXAMINED row must be touched, escalated or not — otherwise the sweep window never advances past the tail",
  );
});

Deno.test("CP-06: clearing suspense requires the correcting entry", async () => {
  const { dbx, db } = await seedVault();
  await postCashReconciliation(
    req({ business_date: "2026-07-16", counted_cents: 499_950_00, gl_balance_cents: 500_000_00 }),
    "v1", db, "t", CTX,
  );
  const sid = String(dbx.rows["core.gl_cash_suspense"][0].id);
  const bare = await postCashSuspenseClear(req({}), sid, db, "t", CTX);
  assertEquals(bare.status, 400);
  const ok = await postCashSuspenseClear(req({ correction_txn_id: "gl_1" }), sid, db, "t", CTX);
  assertEquals(ok.status, 200);
  assertEquals(dbx.violations, []);
});

// -------------------------------------------------------- CP-07 over / short

Deno.test("CP-07: the CUMULATIVE total crosses the threshold, not any single event", async () => {
  const { dbx, db } = await seedVault();
  for (const amt of [-2_000, -1_800]) {
    await postCashOverShort(
      req({ custodian_user_id: "teller_9", business_date: "2026-07-10", amount_cents: amt, threshold_cents: 10_000 }),
      "v1", db, "t", CTX,
    );
  }
  assert(!codes(dbx.rows).includes("cash.overshort.threshold_crossed"), "3800 is under 10000");
  await postCashOverShort(
    req({ custodian_user_id: "teller_9", business_date: "2026-07-12", amount_cents: -9_000, threshold_cents: 10_000 }),
    "v1", db, "t", CTX,
  );
  assert(codes(dbx.rows).includes("cash.overshort.threshold_crossed"));
  // and it routes through the SAME alert writer money movement uses
  assert((dbx.rows["core.bsa_alert"] ?? []).length > 0);
});

Deno.test("CP-07: the cumulative is PER CUSTODIAN, not across the institution", async () => {
  const { dbx, db } = await seedVault();
  for (const who of ["a", "b", "c"]) {
    await postCashOverShort(
      req({ custodian_user_id: who, business_date: "2026-07-10", amount_cents: -9_000, threshold_cents: 10_000 }),
      "v1", db, "t", CTX,
    );
  }
  assert(
    !codes(dbx.rows).includes("cash.overshort.threshold_crossed"),
    "three different people at 9000 each must not aggregate into one pattern",
  );
});

Deno.test("CP-07: an unset threshold reports unassessed, not 'not crossed'", async () => {
  const { dbx, db } = await seedVault();
  await postCashOverShort(
    req({ custodian_user_id: "x", business_date: "2026-07-10", amount_cents: -99_999_00 }),
    "v1", db, "t", CTX,
  );
  const ev = (dbx.rows["core.event"] ?? []).find((e) => e.code === "cash.overshort.thresholds");
  assertEquals((ev!.payload as Any).verdict, "unassessed");
  assert(!codes(dbx.rows).includes("cash.overshort.threshold_crossed"));
});

// ---------------------------------------------------------- CP-08 shipments

Deno.test("CP-08: a seal mismatch declares an INCIDENT and refuses verification", async () => {
  const dbx = makeDrillDb();
  await postCashShipment(
    req({ id: "s1", direction: "inbound", amount_cents: 100_00, seal_expected: "A" }),
    dbx.client, "t", CTX,
  );
  const res = await postCashShipmentVerify(
    req({ seal_found: "B", counter_user_id: "x", custodian_user_id: "y" }),
    "s1", dbx.client, "t", CTX,
  );
  assertEquals(res.status, 409);
  assertEquals(dbx.rows["core.cash_shipment"][0].seal_matched, false);
  assertEquals(dbx.rows["core.cash_shipment"][0].verified_at, undefined);
  assert(codes(dbx.rows).includes("cash.seal.mismatch"));
  assert(codes(dbx.rows).includes("incident.created"));
  assertEquals((dbx.rows["core.incident"] ?? []).length, 1);
});

Deno.test("CP-08: a matching seal verifies and declares no incident", async () => {
  const dbx = makeDrillDb();
  await postCashShipment(
    req({ id: "s2", direction: "inbound", amount_cents: 100_00, seal_expected: "A" }),
    dbx.client, "t", CTX,
  );
  const res = await postCashShipmentVerify(
    req({ seal_found: "A", counter_user_id: "x", custodian_user_id: "y" }),
    "s2", dbx.client, "t", CTX,
  );
  assertEquals(res.status, 200);
  assert(codes(dbx.rows).includes("cash.shipment.verified"));
  assert(!codes(dbx.rows).includes("incident.created"));
  assertEquals(dbx.violations, []);
});

Deno.test("CP-08: verification needs two different people", async () => {
  const dbx = makeDrillDb();
  await postCashShipment(
    req({ id: "s3", direction: "inbound", amount_cents: 100_00, seal_expected: "A" }),
    dbx.client, "t", CTX,
  );
  const res = await postCashShipmentVerify(
    req({ seal_found: "A", counter_user_id: "x", custodian_user_id: "x" }),
    "s3", dbx.client, "t", CTX,
  );
  assertEquals(res.status, 400);
});

Deno.test("CP-08: CMIR attaches only to a border crossing above $10,000", async () => {
  const dbx = makeDrillDb();
  // over the threshold but domestic
  await postCashShipment(
    req({ id: "dom", direction: "outbound", amount_cents: 45_000_00, seal_expected: "A" }),
    dbx.client, "t", CTX,
  );
  assertEquals((dbx.rows["core.cmir_filing"] ?? []).length, 0);
  // crosses the border but under the threshold
  await postCashShipment(
    req({ id: "small", direction: "outbound", amount_cents: 500_00, seal_expected: "B", crosses_border: true }),
    dbx.client, "t", CTX,
  );
  assertEquals((dbx.rows["core.cmir_filing"] ?? []).length, 0);
  // both
  await postCashShipment(
    req({ id: "intl", direction: "outbound", amount_cents: 45_000_00, seal_expected: "C", crosses_border: true }),
    dbx.client, "t", CTX,
  );
  assertEquals(dbx.rows["core.cmir_filing"].length, 1);
  assert(codes(dbx.rows).includes("cmir.reportable.identified"));
  assertEquals(CMIR_THRESHOLD_CENTS, 10_000_00);
});

Deno.test("CP-08: a shipment with no EXPECTED seal is refused at dispatch", async () => {
  const dbx = makeDrillDb();
  const res = await postCashShipment(
    req({ direction: "inbound", amount_cents: 100_00 }), dbx.client, "t", CTX,
  );
  assertEquals(res.status, 400);
});

Deno.test("CP-08: night drop retrieval needs two people", async () => {
  const dbx = makeDrillDb();
  const bad = await postCashNightDropRetrieval(
    req({ counter_user_id: "x", custodian_user_id: "x" }), "v1", dbx.client, "t", CTX,
  );
  assertEquals(bad.status, 400);
  const ok = await postCashNightDropRetrieval(
    req({ counter_user_id: "x", custodian_user_id: "y", bag_count: 3 }), "v1", dbx.client, "t", CTX,
  );
  assertEquals(ok.status, 201);
});

// ----------------------------------------------------- CP-09 surprise counts

Deno.test("CP-09: a count with no counter is refused — an uncounted count is a schedule entry", async () => {
  const { db } = await seedVault();
  await postCashSurpriseCountSchedule(
    req({ asset_id: "v1", scheduled_for: "2026-07-18" }), db, "t", CTX,
  );
  const res = await postCashSurpriseCountComplete(
    req({ counted_cents: 1 }), "cashsc_v1_20260718", db, "t", CTX,
  );
  assertEquals(res.status, 400);
});

Deno.test("CP-09: a count variance opens the same investigation an over/short does", async () => {
  const { dbx, db } = await seedVault();
  await postCashSurpriseCountSchedule(
    req({ asset_id: "v1", scheduled_for: "2026-07-18" }), db, "t", CTX,
  );
  await postCashSurpriseCountComplete(
    req({ counted_cents: 499_900_00, counted_by: "auditor_1" }),
    "cashsc_v1_20260718", db, "t", CTX,
  );
  assertEquals(dbx.rows["core.cash_surprise_count"][0].variance_cents, -100_00);
  assert(codes(dbx.rows).includes("cash.overshort_investigation.opened"));
});

// --------------------------------------------------------- CP-10 deviations

Deno.test("CP-10: an approved deviation needs the Board AND the bond", async () => {
  const { dbx, db } = await seedVault();
  await postCashDeviationRequest(
    req({
      asset_id: "v1", requested_limit_cents: 9_000_000_00,
      period_reason: "holiday", sunset_at: "2027-01-15T00:00:00.000Z",
    }),
    db, "t", CTX,
  );
  const id = String(dbx.rows["core.cash_deviation"][0].id);
  const noBond = await postCashDeviationDecision(
    req({ decision: "approved", board_resolution_id: "b1" }), id, db, "t", CTX,
  );
  assertEquals(noBond.status, 400);
  const ok = await postCashDeviationDecision(
    req({ decision: "approved", board_resolution_id: "b1", insurance_bond_adjustment: "rider" }),
    id, db, "t", CTX,
  );
  assertEquals(ok.status, 200);
  // the approval WRITES A SCHEDULE that sunsets, rather than mutating a limit
  const sched = dbx.rows["core.cash_limits_schedule"].find((s) => s.deviation_id === id);
  assert(sched, "an approved deviation must produce a time-boxed schedule row");
  assert(sched!.sunset_at);
});

Deno.test("CP-10: a deviation-backed limit with no sunset is refused", async () => {
  const { db } = await seedVault();
  const res = await postCashLimitsSchedule(
    req({ asset_id: "v1", limit_cents: 1, effective_at: "2026-01-01T00:00:00.000Z", deviation_id: "d" }),
    db, "t", CTX,
  );
  assertEquals(res.status, 400);
});

// ------------------------------------------------------- CP-01 / CP-12 KRI

Deno.test("CP-01/CP-12: the KRI pack is COMPUTED from the registers, not supplied", async () => {
  const { dbx, db } = await seedVault();
  await postCashOverShort(
    req({ custodian_user_id: "a", business_date: "2026-07-10", amount_cents: -2_500 }),
    "v1", db, "t", CTX,
  );
  await postCashReconciliation(
    req({ business_date: "2026-07-16", counted_cents: 499_950_00, gl_balance_cents: 500_000_00 }),
    "v1", db, "t", CTX,
  );
  await postCashException(
    req({ kind: "override", rationale: "r", risk_acceptance: "accepted", accepted_by: "cfo" }),
    db, "t", CTX,
  );
  // a caller-supplied figure that must be IGNORED
  await postCashKriPublish(
    req({ period: "2026-07", overshort_monthly_summary_cents: 0 }), db, "t", CTX,
  );
  const kri = dbx.rows["core.cash_kri"][0];
  assertEquals(kri.overshort_monthly_summary_cents, 2_500);
  assertEquals(kri.recon_variance_count, 1);
  assertEquals(kri.exception_count, 1);
  assertEquals(kri.suspense_open_count, 1);
});

Deno.test("CP-01: an exception with no rationale or risk acceptance is refused", async () => {
  const { db } = await seedVault();
  assertEquals(
    (await postCashException(req({ kind: "k", rationale: "r" }), db, "t", CTX)).status,
    400,
  );
  assertEquals(
    (await postCashException(
      req({ kind: "k", rationale: "r", risk_acceptance: "a" }), db, "t", CTX,
    )).status,
    400,
  );
});

Deno.test("CP-09/CP-12: an export with no declared scope is refused; the item count is counted", async () => {
  const { dbx, db } = await seedVault();
  await postCashReconciliation(
    req({ business_date: "2026-07-15", counted_cents: 500_000_00, gl_balance_cents: 500_000_00 }),
    "v1", db, "t", CTX,
  );
  const noScope = await postCashRecordsPackage(
    req({ purpose: "exam_export" }), db, "t", CTX,
  );
  assertEquals(noScope.status, 400);

  await postCashRecordsPackage(
    req({ purpose: "exam_export", scope: { period: "2026Q3" }, delivered_to: "NCUA" }),
    db, "t", CTX,
  );
  assertEquals(dbx.rows["core.records_package"][0].item_count, 1);
  assert(codes(dbx.rows).includes("exam.export.delivered"));
  assertEquals(dbx.violations, []);
});
