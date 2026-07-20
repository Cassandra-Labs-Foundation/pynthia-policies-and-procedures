-- Complaints and disputes (CO-06, FL-13, MP-04, PR-10).
--
-- `core.complaint` and `core.dispute` are two of the 22 ABANDONED TABLES.
--
-- WHY THESE ARE ONE MIGRATION AND TWO TABLES. A complaint and a Reg E dispute
-- arrive through the same door and are constantly conflated, but they carry
-- DIFFERENT CLOCKS and different consequences:
--
--   a COMPLAINT has an acknowledgement deadline, an initial response, a final
--   response, and a root-cause tag that feeds trend analysis;
--   a DISPUTE (12 CFR 1005.11) has a 10-business-day provisional-credit clock,
--   a 45/90-day investigation limit, and a MONEY consequence — provisional
--   credit actually posts.
--
-- Modelling one as a flavour of the other loses whichever clock belongs to the
-- other. A dispute recorded as a complaint silently drops the provisional
-- credit obligation; a complaint recorded as a dispute acquires a Reg E clock
-- it does not have.
--
-- FOUR POLICIES SHARE THIS SUBSTRATE and each reads it differently: collections
-- wants resolution timeliness (CO-06), fair lending wants disparity in WHO
-- complains (FL-13), member services wants the dispute lifecycle (MP-04),
-- privacy wants privacy-category complaints and board reporting (PR-10). One
-- register, four lenses — which is why the CATEGORY and the ROOT-CAUSE TAG are
-- required fields rather than free text.

create table if not exists "core"."complaint" (
  "id" text primary key,
  "member_id" text,
  "channel" text not null check ("channel" in
    ('direct', 'regulator', 'portal', 'branch', 'phone', 'social')),
  -- the lens each policy reads by. Free text here would make every downstream
  -- analysis a string-matching exercise.
  "category" text not null check ("category" in
    ('privacy', 'fair_lending', 'collections', 'fees', 'service', 'dispute', 'other')),
  "narrative" text not null,
  "regulator" text,
  "regulator_case_id" text,
  -- a regulator portal sets its own response window, shorter than ours;
  -- answering on our schedule misses theirs
  "portal_due_date" timestamptz,
  -- MP-04: a complaint the institution cannot respond to is not actionable
  "entity_contact" jsonb,

  -- CO-06 / MP-04 clocks. Acknowledgement is separate from the initial
  -- response, which is separate from the final one — collapsing them loses the
  -- deadline that is usually the one missed.
  "received_at" timestamptz not null,
  "ack_due_at" timestamptz not null,
  "acknowledged_at" timestamptz,
  "initial_response_due_at" timestamptz not null,
  "initial_response_sent_at" timestamptz,
  "final_response_due_at" timestamptz not null,
  "final_response_sent_at" timestamptz,

  "investigation_notes" text,
  "root_cause_tag" text,
  -- UDAAP: a complaint alleging unfair, deceptive or abusive practice is a
  -- different severity of thing and must be flaggable at intake.
  "udaap_flag" boolean not null default false,
  "resolved_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),

  -- a regulator-channel complaint must carry the regulator; otherwise the
  -- response deadline cannot be attributed and the case cannot be answered
  constraint "ck_complaint_regulator_channel"
    check ("channel" <> 'regulator' or "regulator" is not null),
  -- resolution requires the final response AND a root cause. A complaint closed
  -- with no root cause contributes nothing to the trend analysis that CO-06,
  -- FL-13 and PR-10 all depend on — it is closed, not resolved.
  constraint "ck_complaint_resolution_complete"
    check ("resolved_at" is null or (
      "final_response_sent_at" is not null and "root_cause_tag" is not null
    ))
);

-- Convergence with the codegen-era core schema (20260702000100): that
-- migration already created "core"."complaint" with a different shape, so the
-- create-table above is a no-op on every database. Bring the existing
-- table up to this declaration column-by-column (append-only; the old
-- columns stay).
alter table "core"."complaint" add column if not exists "id" text;
-- the codegen-era table minted uuid ids; this workstream's writers use text ids
alter table "core"."complaint" alter column "id" type text;
alter table "core"."complaint" add column if not exists "member_id" text;
alter table "core"."complaint" add column if not exists "channel" text not null check ("channel" in ('direct', 'regulator', 'portal', 'branch', 'phone', 'social'));
alter table "core"."complaint" add column if not exists "category" text not null check ("category" in ('privacy', 'fair_lending', 'collections', 'fees', 'service', 'dispute', 'other'));
alter table "core"."complaint" add column if not exists "narrative" text not null;
alter table "core"."complaint" add column if not exists "regulator" text;
alter table "core"."complaint" add column if not exists "regulator_case_id" text;
alter table "core"."complaint" add column if not exists "portal_due_date" timestamptz;
alter table "core"."complaint" add column if not exists "entity_contact" jsonb;
alter table "core"."complaint" add column if not exists "received_at" timestamptz not null;
alter table "core"."complaint" add column if not exists "ack_due_at" timestamptz not null;
alter table "core"."complaint" add column if not exists "acknowledged_at" timestamptz;
alter table "core"."complaint" add column if not exists "initial_response_due_at" timestamptz not null;
alter table "core"."complaint" add column if not exists "initial_response_sent_at" timestamptz;
alter table "core"."complaint" add column if not exists "final_response_due_at" timestamptz not null;
alter table "core"."complaint" add column if not exists "final_response_sent_at" timestamptz;
alter table "core"."complaint" add column if not exists "investigation_notes" text;
alter table "core"."complaint" add column if not exists "root_cause_tag" text;
alter table "core"."complaint" add column if not exists "udaap_flag" boolean not null default false;
alter table "core"."complaint" add column if not exists "resolved_at" timestamptz;
alter table "core"."complaint" add column if not exists "provenance" text not null default 'production';
alter table "core"."complaint" add column if not exists "created_at" timestamptz not null default now();
alter table "core"."complaint" add column if not exists "updated_at" timestamptz not null default now();






-- 12 CFR 1005.11. A DIFFERENT clock and a money consequence.
create table if not exists "core"."dispute" (
  "id" text primary key,
  "complaint_id" text references "core"."complaint" ("id"),
  "member_id" text,
  "account_id" text,
  "basis" text not null,
  -- NULLABLE, and the reason matters: a Reg E dispute has an amount, a FCRA
  -- data-accuracy dispute (PR-05) does not. The corpus treats both as
  -- `dispute.*` and splitting them into separate registers made PR-05 unable to
  -- find its own basis. Forcing an amount onto a non-monetary dispute would
  -- fabricate one.
  "amount_cents" bigint check ("amount_cents" is null or "amount_cents" > 0),
  "kind" text not null default 'reg_e' check ("kind" in ('reg_e', 'data_accuracy')),
  "notified_at" timestamptz not null,

  -- Reg E: provisional credit within 10 business days unless the
  -- investigation completes first.
  -- only a monetary dispute carries a provisional-credit obligation
  "provisional_credit_due_at" timestamptz,
  "provisional_credit_posted_at" timestamptz,
  "provisional_credit_cents" bigint,
  -- 45 days, or 90 for new accounts / POS / foreign-initiated
  "investigation_due_at" timestamptz not null,
  "investigation_completed_at" timestamptz,
  "findings" text,
  "correction_amount_cents" bigint,
  "response_sent_at" timestamptz,
  "resolved_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),

  -- provisional credit that is recorded but carries no amount never reached
  -- the member's balance
  constraint "ck_dispute_provisional_credit_amount"
    check ("provisional_credit_posted_at" is null or "provisional_credit_cents" is not null),
  -- a Reg E dispute must carry its amount and its provisional-credit clock;
  -- a data-accuracy one must not pretend to
  constraint "ck_dispute_rege_has_amount"
    check ("kind" <> 'reg_e' or ("amount_cents" is not null
           and "provisional_credit_due_at" is not null)),
  -- a completed investigation must have findings; Reg E requires the member be
  -- told the BASIS of the determination, not just the outcome
  constraint "ck_dispute_investigation_findings"
    check ("investigation_completed_at" is null or "findings" is not null),
  -- resolution requires the member to have been told
  constraint "ck_dispute_resolution_notified"
    check ("resolved_at" is null or "response_sent_at" is not null)
);

-- Convergence with the codegen-era core schema (20260702000100): that
-- migration already created "core"."dispute" with a different shape, so the
-- create-table above is a no-op on every database. Bring the existing
-- table up to this declaration column-by-column (append-only; the old
-- columns stay).
alter table "core"."dispute" add column if not exists "id" text;
-- the codegen-era table minted uuid ids; this workstream's writers use text ids
alter table "core"."dispute" alter column "id" type text;
alter table "core"."dispute" add column if not exists "complaint_id" text references "core"."complaint" ("id");
alter table "core"."dispute" add column if not exists "member_id" text;
alter table "core"."dispute" add column if not exists "account_id" text;
alter table "core"."dispute" add column if not exists "basis" text not null;
alter table "core"."dispute" add column if not exists "amount_cents" bigint check ("amount_cents" is null or "amount_cents" > 0);
alter table "core"."dispute" add column if not exists "kind" text not null default 'reg_e' check ("kind" in ('reg_e', 'data_accuracy'));
alter table "core"."dispute" add column if not exists "notified_at" timestamptz not null;
alter table "core"."dispute" add column if not exists "provisional_credit_due_at" timestamptz;
alter table "core"."dispute" add column if not exists "provisional_credit_posted_at" timestamptz;
alter table "core"."dispute" add column if not exists "provisional_credit_cents" bigint;
alter table "core"."dispute" add column if not exists "investigation_due_at" timestamptz not null;
alter table "core"."dispute" add column if not exists "investigation_completed_at" timestamptz;
alter table "core"."dispute" add column if not exists "findings" text;
alter table "core"."dispute" add column if not exists "correction_amount_cents" bigint;
alter table "core"."dispute" add column if not exists "response_sent_at" timestamptz;
alter table "core"."dispute" add column if not exists "resolved_at" timestamptz;
alter table "core"."dispute" add column if not exists "provenance" text not null default 'production';
alter table "core"."dispute" add column if not exists "created_at" timestamptz not null default now();
alter table "core"."dispute" add column if not exists "updated_at" timestamptz not null default now();






-- CO-06 / FL-13 / PR-10 trend analysis, and the board packets that read it.
create table if not exists "core"."complaint_trend" (
  "id" text primary key,
  "period" text not null,
  "lens" text not null check ("lens" in ('collections', 'fair_lending', 'privacy', 'enterprise')),
  "total" int not null,
  "by_root_cause" jsonb not null default '{}'::jsonb,
  "by_category" jsonb not null default '{}'::jsonb,
  "udaap_count" int not null default 0,
  "overdue_count" int not null default 0,
  "disparity_bp" int,
  "threshold_bp" int,
  "breached" boolean,
  "cap_opened_at" timestamptz,
  "reported_at" timestamptz not null,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- an unset threshold cannot produce a verdict either way. Fourth domain to
  -- apply this rule, after capital, cash and fair lending.
  constraint "ck_complaint_trend_verdict_needs_threshold"
    check (("threshold_bp" is null) = ("breached" is null))
);

create index if not exists "ix_complaint_category" on "core"."complaint" ("category", "received_at" desc);
create index if not exists "ix_complaint_open" on "core"."complaint" ("resolved_at", "final_response_due_at");
create index if not exists "ix_dispute_complaint" on "core"."dispute" ("complaint_id");

create schema if not exists "sim";
create table if not exists "sim"."complaint" (like "core"."complaint" including all);
create table if not exists "sim"."dispute" (like "core"."dispute" including all);
create table if not exists "sim"."complaint_trend" (like "core"."complaint_trend" including all);
