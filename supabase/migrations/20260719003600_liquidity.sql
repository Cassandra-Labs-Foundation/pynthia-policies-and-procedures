-- Liquidity — LQ-02 (maturity mismatch), LQ-03 (LAR bands), LQ-04 (survival
-- horizon), LQ-05 (stress testing), LQ-07 (reporting cadence), LQ-09
-- (contingent federal access).
--
-- ⚑ THE CAPITAL PATTERN RECURS, EXACTLY AS PREDICTED IN §5c.
--
-- Capital had two kinds of threshold and they behave differently:
--
--   STATUTORY      PCA categories. Written in 12 CFR 702, the same for every
--                  credit union, NOT NULL, and a missing value is a bug.
--   INSTITUTIONAL  The Board's internal trigger. Nobody's regulation sets it;
--                  it is NULLABLE and a NULL means UNASSESSED, never "fine".
--
-- Liquidity splits the same way and the line falls in the same place:
--
--   STATUTORY      NCUA §741.12's ASSET-SIZE thresholds. Under $50M: policy
--                  only. $50M-$250M: a contingency funding plan. Over $250M:
--                  demonstrated access to a federal facility. These are facts
--                  about the regulation, so `asset_tier` is NOT NULL and
--                  derived from total assets — never supplied by a caller.
--   INSTITUTIONAL  The LAR bands, the mismatch limits per bucket, the survival
--                  horizon minimum. NCUA sets NONE of these. Every one is
--                  nullable and every verdict column is paired to it by a
--                  both-present-or-both-absent constraint, exactly as
--                  `ck_liquidity_verdict_needs_minimum` already does on
--                  `core.liquidity_report`.
--
-- The prediction is worth recording as confirmed: this was called several
-- artifacts ago and the shape arrived unchanged. It is not a liquidity fact or
-- a capital fact — it is what happens whenever a regulator sets a floor and an
-- institution sets a tighter one on top, and the two must not be stored in the
-- same column.

-- ------------------------------------------------------------ LQ-03 the bands
--
-- INSTITUTIONAL. Nullable by construction: a system with no configured bands
-- reports "unassessed", not "within band".
create table if not exists "core"."lar_band_config" (
  "id" text primary key,
  "version" int not null,
  "critical_bp" int not null,
  "warning_bp" int not null,
  "target_bp" int not null,
  "approved_by" text not null,
  "effective_at" timestamptz not null,
  "superseded_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- bands that cross are not bands
  constraint "ck_lar_bands_ordered"
    check ("critical_bp" < "warning_bp" and "warning_bp" < "target_bp")
);

-- ------------------------------------------------------- the daily position
create table if not exists "core"."liquidity_position" (
  "id" text primary key,
  "as_of_date" date not null,
  "gl_balances" jsonb not null,
  "liquidity_liquid_assets_cents" bigint not null,
  "liquidity_total_assets_cents" bigint not null check ("liquidity_total_assets_cents" > 0),
  -- the haircuts applied to get from book value to liquid value. Stored WITH
  -- the position because a ratio computed under one haircut table and compared
  -- against a band set under another is not a comparison.
  "liquidity_haircut_table" jsonb not null,
  "liquidity_behavioral_assumptions" jsonb not null default '{}'::jsonb,
  "lar_value_bp" int not null,
  -- STATUTORY, derived, never supplied: §741.12 turns on asset size alone.
  "asset_tier" text not null check ("asset_tier" in ('under_50m', 'mid', 'over_250m')),
  -- INSTITUTIONAL, nullable: no configured bands means no band verdict.
  "band_config_id" text references "core"."lar_band_config" ("id"),
  "lar_current_band" text check ("lar_current_band" in
    ('critical', 'warning', 'adequate', 'target')),
  "lar_prior_band" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- THE PAIRING. Same shape as ck_liquidity_verdict_needs_minimum and
  -- ck_analytics_verdict_needs_threshold: a band verdict exists exactly when
  -- the bands that produced it do.
  constraint "ck_lar_band_needs_config"
    check (("band_config_id" is null) = ("lar_current_band" is null))
);

-- ---------------------------------------------------------- LQ-02 mismatch
create table if not exists "core"."maturity_mismatch" (
  "id" text primary key,
  "position_id" text not null references "core"."liquidity_position" ("id"),
  "as_of_date" date not null,
  "mismatch_current_gaps" jsonb not null,
  -- INSTITUTIONAL: nullable, and the verdict is paired to it.
  "mismatch_limit" jsonb,
  "mismatch_breached_bucket" text,
  "mismatch_breach_magnitude_cents" bigint,
  "intraday_recomputed_at" timestamptz,
  "funding_draw_amount_cents" bigint,
  "funding_shortfall_estimate_cents" bigint,
  "dispositioned_at" timestamptz,
  "dispositioned_by" text,
  "disposition" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  constraint "ck_mismatch_breach_needs_limit"
    check ("mismatch_limit" is not null or "mismatch_breached_bucket" is null),
  -- a breach that is closed with no disposition is a breach that stopped being
  -- looked at; the same rule the escalation register already carries
  constraint "ck_mismatch_disposition_reasoned"
    check ("dispositioned_at" is null
           or ("disposition" is not null and "dispositioned_by" is not null))
);

-- ------------------------------------------------- LQ-04 / LQ-05 stress
--
-- Assumptions are VERSIONED, not edited. A survival horizon recomputed under
-- quietly-changed assumptions is the failure LQ-05 describes: the number
-- improves and nothing records why.
create table if not exists "core"."stress_assumption_set" (
  "id" text primary key,
  "version" int not null,
  "stress_set" text not null,
  "stress_behavioral_assumptions" jsonb not null,
  "stress_baas_shock_params" jsonb not null default '{}'::jsonb,
  "stress_intraday_profile" jsonb not null default '{}'::jsonb,
  "stress_assumption_value" jsonb not null default '{}'::jsonb,
  "stress_change_rationale" text,
  "stress_approver_id" text,
  "superseded_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- a changed assumption with no rationale and no approver is an unrecorded
  -- change to the answer
  constraint "ck_stress_change_owned"
    check ("version" = 1 or ("stress_change_rationale" is not null
                             and "stress_approver_id" is not null))
);

create table if not exists "core"."liquidity_stress_run" (
  "id" text primary key,
  "period" text not null,
  "assumption_set_id" text not null references "core"."stress_assumption_set" ("id"),
  "kind" text not null check ("kind" in ('scheduled', 'adhoc')),
  "trigger_reason" text,
  "survival_days_combined" int not null,
  -- INSTITUTIONAL: nullable, paired verdict.
  "survival_threshold_days" int,
  "survival_below_threshold" boolean,
  "ewi_value" jsonb not null default '{}'::jsonb,
  "pack_issued_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  constraint "ck_survival_verdict_needs_threshold"
    check (("survival_threshold_days" is null) = ("survival_below_threshold" is null)),
  -- an ad-hoc rerun exists because something triggered it; an unexplained one
  -- is indistinguishable from someone re-running until the number improved
  constraint "ck_adhoc_rerun_reasoned"
    check ("kind" <> 'adhoc' or "trigger_reason" is not null)
);

-- --------------------------------------------- LQ-09 contingent federal access
create table if not exists "core"."liquidity_facility" (
  "id" text primary key,
  "name" text not null,
  "kind" text not null check ("kind" in ('fhlb', 'discount_window', 'clf', 'correspondent')),
  "facility_contacts" jsonb not null default '{}'::jsonb,
  "facility_collateral_schedule" jsonb not null default '{}'::jsonb,
  "facility_test_script" text,
  "last_tested_at" timestamptz,
  "test_due_at" timestamptz,
  "test_outcome" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- A facility that has never been drawn is a facility nobody knows works. The
  -- test is the control; recording an outcome without a script means the next
  -- person cannot repeat it.
  constraint "ck_facility_test_scripted"
    check ("last_tested_at" is null or "facility_test_script" is not null)
);

create table if not exists "core"."collateral_position" (
  "id" text primary key,
  "facility_id" text not null references "core"."liquidity_facility" ("id"),
  "as_of_date" date not null,
  "collateral_pledge_schedule" jsonb not null,
  "collateral_eligibility_rules" jsonb not null,
  "collateral_unencumbered_balance_cents" bigint not null,
  "headroom_cents" bigint not null,
  "collateral_move_detail" jsonb,
  "recomputed_at" timestamptz,
  -- INSTITUTIONAL: nullable, paired verdict.
  "headroom_floor_cents" bigint,
  "headroom_low" boolean,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  constraint "ck_headroom_verdict_needs_floor"
    check (("headroom_floor_cents" is null) = ("headroom_low" is null))
);

-- --------------------------------------------------------- LQ-07 the packs
create table if not exists "core"."liquidity_pack" (
  "id" text primary key,
  "cadence" text not null check ("cadence" in ('daily', 'weekly', 'board')),
  "period" text not null,
  "position_id" text,
  "contents" jsonb not null,
  "published_at" timestamptz not null,
  "published_by" text not null,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

create index if not exists "ix_liq_position_date"
  on "core"."liquidity_position" ("as_of_date" desc);
create index if not exists "ix_mismatch_open"
  on "core"."maturity_mismatch" ("dispositioned_at", "as_of_date");
create index if not exists "ix_facility_test_due"
  on "core"."liquidity_facility" ("test_due_at") where "last_tested_at" is null;

create schema if not exists "sim";
create table if not exists "sim"."lar_band_config" (like "core"."lar_band_config" including all);
create table if not exists "sim"."liquidity_position" (like "core"."liquidity_position" including all);
create table if not exists "sim"."maturity_mismatch" (like "core"."maturity_mismatch" including all);
create table if not exists "sim"."stress_assumption_set" (like "core"."stress_assumption_set" including all);
create table if not exists "sim"."liquidity_stress_run" (like "core"."liquidity_stress_run" including all);
create table if not exists "sim"."liquidity_facility" (like "core"."liquidity_facility" including all);
create table if not exists "sim"."collateral_position" (like "core"."collateral_position" including all);
create table if not exists "sim"."liquidity_pack" (like "core"."liquidity_pack" including all);
