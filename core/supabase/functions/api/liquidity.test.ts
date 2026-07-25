// Liquidity — and the confirmation of the statutory/institutional split.
//
// THE PREDICTION THIS FILE CHECKS. Several artifacts ago, working on capital,
// the claim was that any domain where a REGULATOR sets a floor and an
// INSTITUTION sets a tighter one on top would produce the same schema shape:
// the statutory value NOT NULL and derived, the institutional one nullable and
// paired to its verdict by a both-present-or-both-absent constraint. Liquidity
// is the last domain likely to produce a genuinely new shape. It did not. The
// tests below assert both halves of the split explicitly, so the claim is
// checkable rather than asserted in a comment.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { makeDrillDb } from "../drill/fake_db.ts";
import { OPS_CTX, req } from "./test_helpers.ts";
import {
  assetTier, CFP_REQUIRED_ASSETS_CENTS, FEDERAL_ACCESS_REQUIRED_ASSETS_CENTS, larBand,
  postCollateralPosition, postFacility, postLarBandConfig, postLiquidityPack,
  postLiquidityPosition, postMaturityMismatch, postStressAssumptions, postStressRun,
} from "./liquidity.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
const CTX = OPS_CTX;
const codes = (rows: Record<string, Any[]>) =>
  (rows["core.event"] ?? []).map((e) => String(e.code));

const HAIRCUTS = { treasury: 0, agency: 200 };
const position = (over: Record<string, unknown> = {}) =>
  req({
    as_of_date: "2026-07-18", liquid_assets_cents: 40_000_000_00,
    total_assets_cents: 400_000_000_00, haircut_table: HAIRCUTS, ...over,
  });

async function withBands(dbx: Any) {
  await postLarBandConfig(
    req({ critical_bp: 500, warning_bp: 800, target_bp: 1200, approved_by: "alco_chair" }),
    dbx.client, "t", CTX,
  );
}

// ================== THE STATUTORY HALF: derived, NOT NULL ==================

Deno.test("STATUTORY: the §741.12 asset tier is derived, not supplied", () => {
  // These are facts about the regulation applied to a number the system holds.
  assertEquals(assetTier(CFP_REQUIRED_ASSETS_CENTS - 1), "under_50m");
  assertEquals(assetTier(CFP_REQUIRED_ASSETS_CENTS), "mid");
  assertEquals(assetTier(FEDERAL_ACCESS_REQUIRED_ASSETS_CENTS), "over_250m");
});

Deno.test("STATUTORY: a caller cannot assert its way out of the tier", async () => {
  const dbx = makeDrillDb();
  await postLiquidityPosition(
    position({ total_assets_cents: 400_000_000_00, asset_tier: "under_50m" }),
    dbx.client, "t", CTX,
  );
  // Supplied "under_50m" ignored. Letting a caller set this would let them
  // assert out of the contingency-funding-plan obligation entirely.
  assertEquals(dbx.rows["core.liquidity_position"][0].asset_tier, "over_250m");
});

// ============ THE INSTITUTIONAL HALF: nullable, paired to its verdict ============

Deno.test("INSTITUTIONAL: no configured bands means NO BAND, not 'adequate'", () => {
  assertEquals(larBand(9999, null), null);
  assertEquals(larBand(1, null), null, "a 0.01% ratio with no bands is still no verdict");
});

Deno.test("INSTITUTIONAL: an unconfigured system reports 'unassessed'", async () => {
  const dbx = makeDrillDb();
  await postLiquidityPosition(position(), dbx.client, "t", CTX);
  const p = dbx.rows["core.liquidity_position"][0];
  assertEquals(p.band_config_id, null);
  assertEquals(
    p.lar_current_band, null,
    "'adequate' here would read as an institution that never breached a band it never set",
  );
  const ev = (dbx.rows["core.event"] ?? []).find((e) => e.code === "lar.computed");
  assertEquals((ev!.payload as Any).verdict, "unassessed");
  assert(!codes(dbx.rows).includes("lar.critical.breached"));
});

Deno.test("INSTITUTIONAL: with bands configured the same ratio gets a verdict", async () => {
  const dbx = makeDrillDb();
  await withBands(dbx);
  await postLiquidityPosition(position(), dbx.client, "t", CTX);
  const p = dbx.rows["core.liquidity_position"][0];
  assertEquals(p.lar_value_bp, 1000);
  assertEquals(p.lar_current_band, "adequate");
  assert(p.band_config_id !== null, "the verdict and the config that made it, together");
});

Deno.test("the same both-present-or-both-absent pairing on mismatch, survival and headroom", async () => {
  const dbx = makeDrillDb();
  await withBands(dbx);
  await postLiquidityPosition(position(), dbx.client, "t", CTX);

  // mismatch: gaps with no limit
  await postMaturityMismatch(
    req({ gaps: { "0_30d": -90_000_000_00 } }), "liqpos_2026-07-18", dbx.client, "t", CTX,
  );
  const m = dbx.rows["core.maturity_mismatch"][0];
  assertEquals(m.mismatch_limit, null);
  assertEquals(m.mismatch_breached_bucket, null);
  assert(!codes(dbx.rows).includes("alert.mismatch_breach"));

  // survival: days with no threshold
  await postStressAssumptions(
    req({ set: "baseline", behavioral_assumptions: { runoff_bp: 500 } }), dbx.client, "t", CTX,
  );
  await postStressRun(
    req({ period: "q", kind: "scheduled", survival_days: 3 }), dbx.client, "t", CTX,
  );
  const r = dbx.rows["core.liquidity_stress_run"][0];
  assertEquals(r.survival_threshold_days, null);
  assertEquals(r.survival_below_threshold, null, "3 days with no threshold is still no verdict");

  // headroom: a balance with no floor
  await postFacility(req({ name: "FHLB", kind: "fhlb" }), dbx.client, "t", CTX);
  await postCollateralPosition(
    req({ unencumbered_cents: 1, pledged_cents: 0, eligibility_rules: { m: "x" } }),
    "fac_fhlb", dbx.client, "t", CTX,
  );
  const c = dbx.rows["core.collateral_position"][0];
  assertEquals(c.headroom_floor_cents, null);
  assertEquals(c.headroom_low, null);
  assert(!codes(dbx.rows).includes("alert.headroom_low"));
});

// ------------------------------------------------------------------ LQ-03

Deno.test("LQ-03: a critical breach fires, and a band CHANGE is its own alert", async () => {
  const dbx = makeDrillDb();
  await withBands(dbx);
  await postLiquidityPosition(position({ as_of_date: "2026-07-17" }), dbx.client, "t", CTX);
  await postLiquidityPosition(
    position({ as_of_date: "2026-07-18", liquid_assets_cents: 12_000_000_00 }),
    dbx.client, "t", CTX,
  );
  const c = codes(dbx.rows);
  assert(c.includes("lar.critical.breached"));
  // The band moving is information the daily ratio does not carry on its own.
  assert(c.includes("alert.lar_band_change"));
});

Deno.test("LQ-03: bands that cross are refused", async () => {
  const dbx = makeDrillDb();
  const res = await postLarBandConfig(
    req({ critical_bp: 900, warning_bp: 500, target_bp: 1200, approved_by: "chair" }),
    dbx.client, "t", CTX,
  );
  assertEquals(res.status, 400);
  assertEquals((dbx.rows["core.lar_band_config"] ?? []).length, 0);
});

Deno.test("LQ-03: a ratio with no haircut table is refused", async () => {
  const dbx = makeDrillDb();
  const res = await postLiquidityPosition(
    req({ as_of_date: "2026-07-18", liquid_assets_cents: 1, total_assets_cents: 100 }),
    dbx.client, "t", CTX,
  );
  assertEquals(res.status, 400, "a ratio nobody can reproduce is not evidence");
});

// ------------------------------------------------------------------ LQ-02

Deno.test("LQ-02: a breach disposition needs an owner", async () => {
  const dbx = makeDrillDb();
  await withBands(dbx);
  await postLiquidityPosition(position(), dbx.client, "t", CTX);
  const res = await postMaturityMismatch(
    req({
      gaps: { "0_30d": -90_000_000_00 }, limit: { "0_30d": -50_000_000_00 },
      disposition: "drew on the line",
    }),
    "liqpos_2026-07-18", dbx.client, "t", CTX,
  );
  assertEquals(res.status, 400);
});

Deno.test("LQ-02: a breached bucket carries its magnitude", async () => {
  const dbx = makeDrillDb();
  await withBands(dbx);
  await postLiquidityPosition(position(), dbx.client, "t", CTX);
  await postMaturityMismatch(
    req({
      gaps: { "0_30d": -90_000_000_00 }, limit: { "0_30d": -50_000_000_00 },
      disposition: "drew on the FHLB line", dispositioned_by: "treasurer_1",
    }),
    "liqpos_2026-07-18", dbx.client, "t", CTX,
  );
  const m = dbx.rows["core.maturity_mismatch"][0];
  assertEquals(m.mismatch_breached_bucket, "0_30d");
  assertEquals(m.mismatch_breach_magnitude_cents, 40_000_000_00);
  assert(codes(dbx.rows).includes("mismatch.breach.dispositioned"));
});

// ------------------------------------------------------------ LQ-04 / LQ-05

Deno.test("LQ-05: changing an assumption without a rationale and approver is refused", async () => {
  const dbx = makeDrillDb();
  await postStressAssumptions(
    req({ set: "baseline", behavioral_assumptions: { runoff_bp: 500 } }), dbx.client, "t", CTX,
  );
  const res = await postStressAssumptions(
    req({ set: "severe", behavioral_assumptions: { runoff_bp: 1500 } }), dbx.client, "t", CTX,
  );
  assertEquals(res.status, 400, "the number improves and nothing records why");
  assertEquals(dbx.rows["core.stress_assumption_set"].length, 1);
});

Deno.test("LQ-05: assumptions are VERSIONED, so an old run stays reproducible", async () => {
  const dbx = makeDrillDb();
  await postStressAssumptions(
    req({ set: "baseline", behavioral_assumptions: { runoff_bp: 500 } }), dbx.client, "t", CTX,
  );
  await postStressAssumptions(
    req({
      set: "severe", behavioral_assumptions: { runoff_bp: 1500 },
      rationale: "March partner exit showed 15%", approver_id: "alco_chair",
    }),
    dbx.client, "t", CTX,
  );
  const sets = dbx.rows["core.stress_assumption_set"];
  assertEquals(sets.length, 2, "superseded, not overwritten");
  assert(sets.find((x) => x.version === 1)!.superseded_at !== null);
  assertEquals(sets.find((x) => x.version === 2)!.superseded_at, null);
});

Deno.test("LQ-05: an ad-hoc rerun must say what triggered it", async () => {
  const dbx = makeDrillDb();
  await postStressAssumptions(
    req({ set: "baseline", behavioral_assumptions: {} }), dbx.client, "t", CTX,
  );
  const res = await postStressRun(
    req({ period: "q", kind: "adhoc", survival_days: 80 }), dbx.client, "t", CTX,
  );
  // Otherwise indistinguishable from re-running until the number improved.
  assertEquals(res.status, 400);
});

Deno.test("LQ-04: a run with no assumption set on file is refused", async () => {
  const dbx = makeDrillDb();
  const res = await postStressRun(
    req({ period: "q", kind: "scheduled", survival_days: 45 }), dbx.client, "t", CTX,
  );
  assertEquals(res.status, 400, "a number with no provenance");
});

Deno.test("LQ-04: below the threshold fires; above it does not", async () => {
  const dbx = makeDrillDb();
  await postStressAssumptions(
    req({ set: "baseline", behavioral_assumptions: {} }), dbx.client, "t", CTX,
  );
  await postStressRun(
    req({ period: "q1", kind: "scheduled", survival_days: 45, threshold_days: 60 }),
    dbx.client, "t", CTX,
  );
  assert(codes(dbx.rows).includes("survival.below_threshold"));

  const dbx2 = makeDrillDb();
  await postStressAssumptions(
    req({ set: "baseline", behavioral_assumptions: {} }), dbx2.client, "t", CTX,
  );
  await postStressRun(
    req({ period: "q1", kind: "scheduled", survival_days: 90, threshold_days: 60 }),
    dbx2.client, "t", CTX,
  );
  assert(!codes(dbx2.rows).includes("survival.below_threshold"));
});

// ------------------------------------------------------------------ LQ-09

Deno.test("LQ-09: a facility test with no script is refused", async () => {
  const dbx = makeDrillDb();
  const res = await postFacility(
    req({ name: "FHLB", kind: "fhlb", tested: true }), dbx.client, "t", CTX,
  );
  assertEquals(res.status, 400, "an outcome nobody can repeat is unverifiable");
});

Deno.test("LQ-09: headroom with no eligibility rules is refused", async () => {
  const dbx = makeDrillDb();
  await postFacility(req({ name: "FHLB", kind: "fhlb" }), dbx.client, "t", CTX);
  const res = await postCollateralPosition(
    req({ unencumbered_cents: 1, pledged_cents: 0 }), "fac_fhlb", dbx.client, "t", CTX,
  );
  assertEquals(res.status, 400, "headroom against collateral the facility may not accept");
});

Deno.test("LQ-09: headroom below the floor alerts", async () => {
  const dbx = makeDrillDb();
  await postFacility(req({ name: "FHLB", kind: "fhlb" }), dbx.client, "t", CTX);
  await postCollateralPosition(
    req({
      unencumbered_cents: 30_000_000_00, pledged_cents: 28_000_000_00,
      floor_cents: 5_000_000_00, eligibility_rules: { m: "1-4 family" }, recompute: true,
    }),
    "fac_fhlb", dbx.client, "t", CTX,
  );
  const c = dbx.rows["core.collateral_position"][0];
  assertEquals(c.headroom_cents, 2_000_000_00);
  assertEquals(c.headroom_low, true);
  const cs = codes(dbx.rows);
  assert(cs.includes("alert.headroom_low"));
  assert(cs.includes("collateral.headroom_rechecked"));
});

// ------------------------------------------------------------------ LQ-07

Deno.test("LQ-07: the board pack is ASSEMBLED from the positions, not re-entered", async () => {
  const dbx = makeDrillDb();
  await withBands(dbx);
  await postLiquidityPosition(position(), dbx.client, "t", CTX);
  await postLiquidityPack(req({ cadence: "board", period: "2026-07" }), dbx.client, "t", CTX);
  const pack = dbx.rows["core.liquidity_pack"][0];
  // A deck whose numbers were typed in separately is a second source of truth,
  // and the two diverge on exactly the day it matters.
  assertEquals((pack.contents as Any)["lar.value"], 1000);
  assertEquals((pack.contents as Any)["lar.current_band"], "adequate");
  assert(codes(dbx.rows).includes("report.board_deck.published"));
});

Deno.test("a partner token cannot reach the liquidity routes", async () => {
  const dbx = makeDrillDb();
  const res = await postLiquidityPosition(
    position(), dbx.client, "t", { ...CTX, actorType: "partner" } as Any,
  );
  assertEquals(res.status, 404);
});
