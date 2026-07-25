-- Basel II standardized approach (BA-03..BA-06) and business continuity
-- (BC-05, BC-11, BC-13).
--
-- NOT MODELLED: BA-08 needs ALCO and board minutes; BC-07 needs the backup
-- system's own job results; BC-09 needs an IT failover feed; BC-15 needs
-- counsel and a vendor attestation. See BLUEPRINT §X.
--
-- ⚑ §5k AGAIN, AND FOR THE THIRD TIME IN THREE ARTIFACTS.
--
-- Basel is the purest instance of the statutory/institutional split in the
-- corpus, because the two live side by side in the same ratio:
--
--   STATUTORY      The RISK WEIGHTS. 0% sovereign, 20% agency, 50% qualifying
--                  mortgage, 100% corporate, 150% past-due-90. These are in
--                  the rule. They are a SCHEDULE, versioned and approved, and
--                  a missing weight is a BUG that must refuse rather than
--                  default — an unmapped exposure silently weighted 0% is
--                  capital that does not exist.
--   INSTITUTIONAL  The COUNTERCYCLICAL BUFFER level. Set by the authority
--                  within a range, and by the institution above it. Nullable,
--                  and no configured CCyB means no payout restriction verdict.
--
-- The BCP tables are deliberately thin: they hang off `core.incident`, which
-- already carries severity, IC assignment, containment and the comms gate.

-- ------------------------------------------------------------ BA-04 schedule
--
-- STATUTORY, versioned. A risk-weight schedule that can be edited in place
-- means a capital ratio computed last quarter cannot be reproduced.
create table if not exists "core"."rwa_schedule" (
  "id" text primary key,
  "rwa_schedule_version" int not null,
  "rwa_risk_weight_map" jsonb not null,
  "rwa_ccf_map" jsonb not null default '{}'::jsonb,
  "rwa_weights" jsonb not null default '{}'::jsonb,
  "rwa_change_authority" text,
  "rwa_proposed_change" jsonb,
  "capital_regulatory_preapproval_id" text,
  "approved_at" timestamptz,
  "approved_by" text,
  "effective_at" timestamptz not null,
  "superseded_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- changing a statutory schedule is not an ordinary edit: it needs the
  -- authority under which it changed, or nobody can tell a rule change from a
  -- convenient one
  constraint "ck_rwa_change_authorised"
    check ("rwa_schedule_version" = 1 or "rwa_change_authority" is not null),
  constraint "ck_rwa_approved_owned"
    check ("approved_at" is null or "approved_by" is not null)
);

-- NOT A SECOND RWA RUN TABLE. `capital.ts` already computes credit RWA onto
-- `core.capital_position`, with the same unmapped-exposure discipline arrived
-- at independently ("an exposure class with no published weight is NOT weighted
-- at zero"). What BA-03 adds is the MARKET and OPERATIONAL legs and the total;
-- what BA-04 adds is versioning the weights so a ratio computed last quarter
-- can be reproduced. Both go onto what exists.
alter table "core"."capital_position"
  add column if not exists "rwa_schedule_id" text,
  add column if not exists "rwa_market_cents" bigint,
  add column if not exists "rwa_operational_cents" bigint,
  add column if not exists "capital_rwa_total_cents" bigint,
  add column if not exists "trading_book_cents" bigint,
  add column if not exists "trading_threshold_cents" bigint,
  add column if not exists "trading_threshold_crossed" boolean,
  add column if not exists "unmapped_exposures" jsonb;

-- BA-03: below the trading threshold the market-risk charge does not APPLY at
-- all. Pairing the verdict to the threshold is what distinguishes "zero because
-- it does not apply" from "zero because nobody computed it".
alter table "core"."capital_position" drop constraint if exists "ck_trading_verdict_needs_threshold";
alter table "core"."capital_position"
  add constraint "ck_trading_verdict_needs_threshold"
    check (("trading_threshold_cents" is null) = ("trading_threshold_crossed" is null));

-- ------------------------------------------------------------- BA-06 buffers
create table if not exists "core"."capital_buffer" (
  "id" text primary key,
  "as_of_date" date not null,
  "capital_cet1_ratio_bp" int not null,
  "capital_buffer_requirement_bp" int not null,
  "capital_buffer_shortfall_bp" int,
  "capital_buffer_status" text not null,
  -- INSTITUTIONAL (§5k): the countercyclical buffer is a policy decision, and
  -- an unset one produces NO payout restriction, not an unrestricted payout.
  "capital_proposed_ccyb_level_bp" int,
  "capital_ccyb_level_bp" int,
  "capital_max_payout_ratio_bp" int,
  "capital_dividend_schedule" jsonb,
  "capital_proposed_distribution_amount_cents" bigint,
  "gl_loan_growth_yoy_bp" int,
  "distribution_permitted" boolean,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- the payout cap exists exactly when the buffer requirement it derives from
  -- has been breached and a CCyB level is set
  constraint "ck_payout_cap_paired"
    check (("capital_ccyb_level_bp" is null) = ("capital_max_payout_ratio_bp" is null)),
  -- a distribution verdict requires the cap that produced it
  constraint "ck_distribution_verdict_needs_cap"
    check ("distribution_permitted" is null or "capital_max_payout_ratio_bp" is not null)
);

-- ------------------------------------------------------------- BA-05 CFP
create table if not exists "core"."cfp_liquidity_profile" (
  "id" text primary key,
  "as_of_date" date not null,
  "gl_total_shares_cents" bigint not null,
  "liquidity_hqla_balance_cents" bigint not null,
  "liquidity_net_outflows_30d_cents" bigint not null,
  "liquidity_asf_total_cents" bigint not null default 0,
  "liquidity_rsf_total_cents" bigint not null default 0,
  "liquidity_clf_capacity_cents" bigint not null default 0,
  "liquidity_concentration" jsonb not null default '{}'::jsonb,
  "liquidity_ratio_to_shares_bp" int not null,
  "liquidity_diversification_plan" text,
  "liquidity_stress" jsonb not null default '{}'::jsonb,
  "cfp_level" text not null check ("cfp_level" in ('normal', 'heightened', 'stress', 'crisis')),
  "cfp_liquidation_hierarchy" jsonb,
  "cfp_execution_plan_documented" boolean not null default false,
  "cfp_investment_test_due_at" timestamptz,
  "cfp_investment_test_completed_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- A contingency funding plan above 'normal' with no liquidation hierarchy is
  -- a plan to decide what to sell during the crisis, which is when the decision
  -- is worst.
  constraint "ck_cfp_hierarchy_above_normal"
    check ("cfp_level" = 'normal' or "cfp_liquidation_hierarchy" is not null)
);

-- ---------------------------------------------------------- BC-11 / BC-13
create table if not exists "core"."comms_tree" (
  "id" text primary key,
  "comms_contact_tree" jsonb not null,
  "comms_stakeholder_matrix" jsonb not null,
  "primary_channel" text not null,
  "backup_channel" text not null,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- BC-11 exists because the comms platform fails during exactly the incidents
  -- that need it. A tree with no backup channel is a tree with one channel.
  constraint "ck_comms_backup_distinct"
    check ("backup_channel" <> "primary_channel")
);

create table if not exists "core"."pir" (
  "id" text primary key,
  "incident_id" text not null,
  "incident_root_cause" text,
  "incident_timeline" jsonb,
  "incident_impact_summary" text,
  "draft_due_at" timestamptz not null,
  "drafted_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- a post-incident review with no root cause has reviewed nothing; it is a
  -- summary of what everyone already saw
  constraint "ck_pir_drafted_has_cause"
    check ("drafted_at" is null
           or ("incident_root_cause" is not null and "incident_timeline" is not null))
);

create table if not exists "core"."corrective_action" (
  "id" text primary key,
  "pir_id" text not null references "core"."pir" ("id"),
  "description" text not null,
  "owner" text not null,
  "due_at" timestamptz not null,
  "approval_due_at" timestamptz not null,
  "approved_at" timestamptz,
  "approved_by" text,
  "completed_at" timestamptz,
  -- BC-13's real control: a corrective action nobody RETESTED is a corrective
  -- action nobody knows worked. "Completed" is the owner's opinion; the retest
  -- is the evidence.
  "retest_verified_at" timestamptz,
  "retest_result" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  constraint "ck_cap_approval_owned"
    check ("approved_at" is null or "approved_by" is not null),
  constraint "ck_cap_retest_resulted"
    check ("retest_verified_at" is null or "retest_result" is not null)
);

create index if not exists "ix_rwa_schedule_current"
  on "core"."rwa_schedule" ("superseded_at", "rwa_schedule_version" desc);
create index if not exists "ix_cap_open" on "core"."corrective_action" ("retest_verified_at", "due_at");

create schema if not exists "sim";
create table if not exists "sim"."rwa_schedule" (like "core"."rwa_schedule" including all);
create table if not exists "sim"."capital_buffer" (like "core"."capital_buffer" including all);
create table if not exists "sim"."cfp_liquidity_profile" (like "core"."cfp_liquidity_profile" including all);
create table if not exists "sim"."comms_tree" (like "core"."comms_tree" including all);
create table if not exists "sim"."pir" (like "core"."pir" including all);
create table if not exists "sim"."corrective_action" (like "core"."corrective_action" including all);

-- BC-05: the IC assignment is a CLOCK, not just a name. An incident with an
-- assigned commander who was assigned four hours late was uncommanded for four
-- hours, and only the timer makes that visible.
alter table "core"."incident"
  add column if not exists "ic_assignment_due_at" timestamptz,
  add column if not exists "oncall_ic_rotation" text,
  add column if not exists "comms_initial_due_at" timestamptz,
  add column if not exists "comms_initial_issued_at" timestamptz;
