-- Investment portfolio (IP-02..IP-17) — trades, positions, credit, liquidity.
--
-- BLUEPRINT §0 lists "a securities book (`position.booked`,
-- `trade.limit.blocked`)" as one of the missing ENTITIES that no primitive
-- substitutes for. That was right, and it is what this migration builds. It is
-- also the last of the big missing nouns: after this the remaining reds are
-- overwhelmingly organisational or waiting on `employee`.
--
-- `core.trade` and `core.document` are two of the 22 ABANDONED TABLES — present
-- in the schema, never written. Their declared shape was read before being
-- trusted, per the caution on that finding.
--
-- FOUR DESIGN DECISIONS.
--
-- 1. A TRADE AND A POSITION ARE DIFFERENT NOUNS. A trade is an event with a
--    counterparty and a settlement date; a position is a holding with a
--    carrying value that changes without anyone trading. Controls that look
--    similar attach to different ones — IP-07's concentration limit is on the
--    POSITION, IP-14's segregation of duties is on the TRADE — and collapsing
--    them would put the limit check on the wrong object.
--
-- 2. THE PERMISSIBLE-INSTRUMENT LIST IS DATA, NOT CODE. 12 CFR 703.14 is
--    statutory and could be hardcoded like the PCA bands; it is not, because
--    a federally insured state-chartered credit union operates under a
--    different list, and OQ (charter applicability) is already open on exactly
--    this question for CDA. An effective-dated list keeps the answer
--    configurable without making it optional.
--
-- 3. CONCENTRATION IS CHECKED ON THE PROJECTED POSITION. Same rule as the CDA
--    5% cap and the cash device limit: testing the current holding and then
--    booking the trade permits every first breach.
--
-- 4. SEGREGATION OF DUTIES IS THREE ROLES, NOT TWO. Execution, confirmation
--    and settlement/reconciliation. Two-way separation lets the person who
--    executed a trade also reconcile it, which is the case that hides an
--    unauthorised trade — the confirmation is the only independent evidence
--    that the trade the book says happened is the trade the counterparty
--    thinks happened.

-- --------------------------------------------------------- instrument list
create table if not exists "core"."instrument_list" (
  "id" text primary key,
  "instrument_class" text not null,
  "permissible" boolean not null,
  "citation" text not null,
  "max_maturity_months" int,
  "min_rating" text,
  "version" int not null check ("version" >= 1),
  "effective_at" timestamptz not null,
  "superseded_at" timestamptz,
  "reviewed_by" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

-- ------------------------------------------------------------ counterparties
create table if not exists "core"."intermediary" (
  "id" text primary key,
  "name" text not null,
  "kind" text not null check ("kind" in ('broker_dealer', 'safekeeper', 'both')),
  "regulator" text,
  "registration_status" text not null default 'unknown'
    check ("registration_status" in ('active', 'lapsed', 'unknown')),
  "approved" boolean not null default false,
  "disqualified_reason" text,
  "last_reviewed_at" timestamptz,
  "review_due_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  constraint "ck_intermediary_approved_clean"
    check (not ("approved" and "disqualified_reason" is not null))
);

-- ------------------------------------------------------------------ issuers
create table if not exists "core"."credit_file" (
  "id" text primary key,
  "issuer_ref" text not null,
  "internal_rating" text not null,
  "external_rating" text,
  "analysis_ref" text not null,
  "approved_by" text not null,
  "approved_at" timestamptz not null,
  -- IP-05: credit analysis goes stale. The re-analysis date is on the file so
  -- an aged file is a fact rather than something a report has to derive.
  "reanalysis_due_at" timestamptz not null,
  "reanalysed_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."security" (
  "id" text primary key,
  "cusip" text,
  "issuer_ref" text not null,
  "instrument_class" text not null,
  "maturity_date" date,
  "external_rating" text,
  "fair_value_cents" bigint,
  "fair_value_at" timestamptz,
  "fair_value_source" text,
  "amortized_cost_cents" bigint,
  "otti_recognised_cents" bigint,
  "liquidity_class" text check ("liquidity_class" in ('level_1', 'level_2', 'level_3')),
  "downgraded_at" timestamptz,
  "downgrade_reviewed_at" timestamptz,
  "downgrade_reviewed_by" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  -- IP-10: a fair value with no source is a number somebody typed. Level 3
  -- especially — the whole point of the hierarchy is knowing which it is.
  constraint "ck_security_fair_value_sourced"
    check ("fair_value_cents" is null or "fair_value_source" is not null),
  -- IP-05: a downgrade that nobody reviewed is the state the control exists to
  -- surface, so it must be representable; a review with no downgrade is not.
  constraint "ck_security_downgrade_review_needs_downgrade"
    check ("downgrade_reviewed_at" is null or "downgraded_at" is not null)
);

-- -------------------------------------------------------------------- limits
create table if not exists "core"."limit_set" (
  "id" text primary key,
  "scope_kind" text not null check ("scope_kind" in
    ('issuer', 'instrument_class', 'intermediary', 'sector')),
  "scope_ref" text not null,
  "limit_bp_of_capital" int not null check ("limit_bp_of_capital" > 0),
  "warning_bp_of_capital" int,
  "approved_by" text not null,
  "effective_at" timestamptz not null,
  "superseded_at" timestamptz,
  "last_reviewed_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- a warning at or above the limit never fires before the limit does
  constraint "ck_limit_set_warning_below_limit"
    check ("warning_bp_of_capital" is null
           or "warning_bp_of_capital" < "limit_bp_of_capital")
);

-- --------------------------------------------------------- trades/positions
--
-- See decision 1 in the header: a TRADE is an event, a POSITION is a holding.
create table if not exists "core"."position" (
  "id" text primary key,
  "security_id" text not null references "core"."security" ("id"),
  "par_cents" bigint not null default 0,
  "book_value_cents" bigint not null default 0,
  "market_value_cents" bigint,
  "booked_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."trade" (
  "id" text primary key,
  "security_id" text references "core"."security" ("id"),
  "intermediary_id" text references "core"."intermediary" ("id"),
  "side" text not null check ("side" in ('buy', 'sell')),
  "par_cents" bigint not null check ("par_cents" > 0),
  "price_bp" int not null,
  "trade_date" date not null,
  "settle_date" date,

  -- IP-14: three distinct roles. See decision 4 in the header.
  "executed_by" text not null,
  "confirmed_by" text,
  "settled_by" text,

  "permissibility_verdict" text not null
    check ("permissibility_verdict" in ('permissible', 'prohibited', 'unassessed')),
  "limit_verdict" text not null
    check ("limit_verdict" in ('within', 'warning', 'breached', 'unassessed')),
  "decision" text not null check ("decision" in ('executed', 'blocked')),
  "blocked_reasons" jsonb not null default '[]'::jsonb,
  -- what was bought, what it settled for, and what supported the price. A
  -- trade recording only par cannot evidence that the price was reasonable.
  "instrument_type" text,
  "settlement_amount_cents" bigint,
  "valuation_support" text,
  "step_attempted" text,
  "ticket" text,
  "confirmation_ref" text,
  "confirmation_matched" boolean,
  "reconciled_at" timestamptz,
  "checklist_completed_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),

  constraint "ck_trade_reasons_match_decision"
    check (("decision" = 'executed') = (jsonb_array_length("blocked_reasons") = 0)),
  -- the executing trader may not confirm or settle their own trade
  constraint "ck_trade_sod_confirm"
    check ("confirmed_by" is null or "confirmed_by" <> "executed_by"),
  constraint "ck_trade_sod_settle"
    check ("settled_by" is null or "settled_by" <> "executed_by"),
  -- an executed trade must have cleared BOTH gates; unassessed is not a pass
  constraint "ck_trade_executed_cleared"
    check ("decision" <> 'executed'
           or ("permissibility_verdict" = 'permissible'
               and "limit_verdict" in ('within', 'warning')))
);

-- Convergence with the codegen-era core schema (20260702000100): that
-- migration already created "core"."trade" with a different shape, so the
-- create-table above is a no-op on every database. Bring the existing
-- table up to this declaration column-by-column (append-only; the old
-- columns stay).
alter table "core"."trade" add column if not exists "id" text;
-- the codegen-era table minted uuid ids; this workstream's writers use text ids
alter table "core"."trade" alter column "id" type text;
alter table "core"."trade" add column if not exists "security_id" text references "core"."security" ("id");
alter table "core"."trade" add column if not exists "intermediary_id" text references "core"."intermediary" ("id");
alter table "core"."trade" add column if not exists "side" text not null check ("side" in ('buy', 'sell'));
alter table "core"."trade" add column if not exists "par_cents" bigint not null check ("par_cents" > 0);
alter table "core"."trade" add column if not exists "price_bp" int not null;
alter table "core"."trade" add column if not exists "trade_date" date not null;
alter table "core"."trade" add column if not exists "settle_date" date;
alter table "core"."trade" add column if not exists "executed_by" text not null;
alter table "core"."trade" add column if not exists "confirmed_by" text;
alter table "core"."trade" add column if not exists "settled_by" text;
alter table "core"."trade" add column if not exists "permissibility_verdict" text not null check ("permissibility_verdict" in ('permissible', 'prohibited', 'unassessed'));
alter table "core"."trade" add column if not exists "limit_verdict" text not null check ("limit_verdict" in ('within', 'warning', 'breached', 'unassessed'));
alter table "core"."trade" add column if not exists "decision" text not null check ("decision" in ('executed', 'blocked'));
alter table "core"."trade" add column if not exists "blocked_reasons" jsonb not null default '[]'::jsonb;
alter table "core"."trade" add column if not exists "instrument_type" text;
alter table "core"."trade" add column if not exists "settlement_amount_cents" bigint;
alter table "core"."trade" add column if not exists "valuation_support" text;
alter table "core"."trade" add column if not exists "step_attempted" text;
alter table "core"."trade" add column if not exists "ticket" text;
alter table "core"."trade" add column if not exists "confirmation_ref" text;
alter table "core"."trade" add column if not exists "confirmation_matched" boolean;
alter table "core"."trade" add column if not exists "reconciled_at" timestamptz;
alter table "core"."trade" add column if not exists "checklist_completed_at" timestamptz;
alter table "core"."trade" add column if not exists "provenance" text not null default 'production';
alter table "core"."trade" add column if not exists "created_at" timestamptz not null default now();
alter table "core"."trade" add column if not exists "updated_at" timestamptz not null default now();






create table if not exists "core"."trade_exception" (
  "id" text primary key,
  "trade_id" text references "core"."trade" ("id"),
  "kind" text not null,
  "detail" jsonb not null,
  "raised_by" text not null,
  "approved_by" text,
  "approved_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  constraint "ck_trade_exception_four_eyes"
    check ("approved_by" is null or "approved_by" <> "raised_by")
);

-- --------------------------------------------------------------------- repo
create table if not exists "core"."repo_agreement" (
  "id" text primary key,
  "intermediary_id" text references "core"."intermediary" ("id"),
  "direction" text not null check ("direction" in ('repo', 'reverse_repo')),
  "principal_cents" bigint not null check ("principal_cents" > 0),
  "collateral_value_cents" bigint not null,
  "required_margin_bp" int not null,
  "actual_margin_bp" int not null,
  "margin_call_issued_at" timestamptz,
  "revaluation_due_at" timestamptz not null,
  "decision" text not null check ("decision" in ('booked', 'blocked')),
  "blocked_reason" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  -- the margin must equal its own components or the shortfall test is
  -- unauditable
  constraint "ck_repo_margin_matches"
    check ("actual_margin_bp" =
           (("collateral_value_cents" - "principal_cents") * 10000) / "principal_cents")
);

-- ------------------------------------------------------- liquidity and CFP
create table if not exists "core"."liquidity_report" (
  "id" text primary key,
  "period" text not null,
  "level_1_cents" bigint not null default 0,
  "level_2_cents" bigint not null default 0,
  "level_3_cents" bigint not null default 0,
  "marketable_pct_bp" int not null,
  "min_marketable_bp" int,
  "breached" boolean,
  "published_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  constraint "ck_liquidity_verdict_needs_minimum"
    check (("min_marketable_bp" is null) = ("breached" is null))
);

create table if not exists "core"."cfp_state" (
  "id" text primary key,
  "level" text not null check ("level" in ('normal', 'heightened', 'stress', 'crisis')),
  "changed_at" timestamptz not null,
  "changed_by" text not null,
  "trigger_detail" jsonb,
  "execution_plan_ref" text,
  "investment_test_completed_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- IP-17: activating a contingency level without the plan that says what to
  -- do is an alarm with no procedure behind it
  constraint "ck_cfp_activation_has_plan"
    check ("level" = 'normal' or "execution_plan_ref" is not null)
);

-- --------------------------------------------- ALM / stress / performance
create table if not exists "core"."alm_simulation" (
  "id" text primary key,
  "kind" text not null check ("kind" in ('irr', 'stress', 'portfolio_stress')),
  "period" text not null,
  "scenario" text not null,
  "result_bp" int not null,
  "minimum_bp" int,
  "breached" boolean,
  "escalated_at" timestamptz,
  "completed_at" timestamptz not null,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  constraint "ck_alm_verdict_needs_minimum"
    check (("minimum_bp" is null) = ("breached" is null)),
  -- a breach that nobody escalated is the state the control exists to catch,
  -- so it stays representable; an escalation with no breach does not
  constraint "ck_alm_escalation_needs_breach"
    check ("escalated_at" is null or "breached" = true)
);

create table if not exists "core"."performance_measurement" (
  "id" text primary key,
  "period" text not null,
  "portfolio_return_bp" int not null,
  "benchmark_ref" text not null,
  "benchmark_return_bp" int not null,
  "attribution" jsonb not null,
  "target_risk_reviewed_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

-- ---------------------------------------------------------- documentation
--
-- `core.document` is an abandoned table. IP-15 needs a REQUIRED SET per trade
-- and the ability to say which of them is missing — a bag of attachments
-- cannot answer that.
create table if not exists "core"."document" (
  "id" text primary key,
  "subject_kind" text not null,
  "subject_ref" text not null,
  "doc_type" text not null,
  "attached_at" timestamptz,
  "attachment_due_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

-- Convergence with the codegen-era core schema (20260702000100): that
-- migration already created "core"."document" with a different shape, so the
-- create-table above is a no-op on every database. Bring the existing
-- table up to this declaration column-by-column (append-only; the old
-- columns stay).
alter table "core"."document" add column if not exists "id" text;
alter table "core"."document" add column if not exists "subject_kind" text not null;
alter table "core"."document" add column if not exists "subject_ref" text not null;
alter table "core"."document" add column if not exists "doc_type" text not null;
alter table "core"."document" add column if not exists "attached_at" timestamptz;
alter table "core"."document" add column if not exists "attachment_due_at" timestamptz;
alter table "core"."document" add column if not exists "provenance" text not null default 'production';
alter table "core"."document" add column if not exists "created_at" timestamptz not null default now();






create table if not exists "core"."sod_violation" (
  "id" text primary key,
  "subject_kind" text not null,
  "subject_ref" text not null,
  "role_a" text not null,
  "role_b" text not null,
  "actor_ref" text not null,
  "detected_at" timestamptz not null,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

create index if not exists "ix_instrument_list_class"
  on "core"."instrument_list" ("instrument_class", "effective_at" desc);
create index if not exists "ix_limit_set_scope"
  on "core"."limit_set" ("scope_kind", "scope_ref", "effective_at" desc);
create index if not exists "ix_position_security" on "core"."position" ("security_id");
create index if not exists "ix_trade_security" on "core"."trade" ("security_id");

create schema if not exists "sim";
create table if not exists "sim"."instrument_list" (like "core"."instrument_list" including all);
create table if not exists "sim"."intermediary" (like "core"."intermediary" including all);
create table if not exists "sim"."credit_file" (like "core"."credit_file" including all);
create table if not exists "sim"."security" (like "core"."security" including all);
create table if not exists "sim"."limit_set" (like "core"."limit_set" including all);
create table if not exists "sim"."position" (like "core"."position" including all);
create table if not exists "sim"."trade" (like "core"."trade" including all);
create table if not exists "sim"."trade_exception" (like "core"."trade_exception" including all);
create table if not exists "sim"."repo_agreement" (like "core"."repo_agreement" including all);
create table if not exists "sim"."liquidity_report" (like "core"."liquidity_report" including all);
create table if not exists "sim"."cfp_state" (like "core"."cfp_state" including all);
create table if not exists "sim"."alm_simulation" (like "core"."alm_simulation" including all);
create table if not exists "sim"."performance_measurement" (like "core"."performance_measurement" including all);
create table if not exists "sim"."document" (like "core"."document" including all);
create table if not exists "sim"."sod_violation" (like "core"."sod_violation" including all);

-- `core.user` is another of the 22 ABANDONED TABLES. IP-14 needs the ROLE an
-- actor holds so the segregation matrix can be checked. This models a system
-- principal and its duties — not a person and not employment, the same line
-- `records_contact` and `core.insider` sit on.
alter table "core"."user"
  add column if not exists "role" text,
  add column if not exists "provenance" text not null default 'production';
