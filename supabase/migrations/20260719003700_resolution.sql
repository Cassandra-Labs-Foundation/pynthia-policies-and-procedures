-- Resolution — RS-02 (early-warning indicators), RS-04 (targeted account
-- freeze), RS-05 (institution-wide freeze), RS-06 (member availability),
-- RS-08 (records preservation).
--
-- NOT MODELLED: RS-03 (safe-mode transaction controls). Safe mode is a state of
-- the transaction-processing infrastructure — degraded rails, reduced feature
-- set — that this system does not run and cannot enter. See BLUEPRINT §X.2.
--
-- ⚑ STRUCTURAL DECISION: A FREEZE IS A PRECEDENCE PROBLEM, NOT A FLAG.
--
-- The obvious model is `account.frozen boolean`. It is wrong in a way that
-- produces a specific, serious failure: freezes arrive from DIFFERENT
-- AUTHORITIES with different precedence, and they overlap. A garnishment order,
-- an OFAC block, a fraud hold and a resolution-wide freeze can all sit on one
-- account at once, and RELEASING ONE MUST NOT RELEASE THE OTHERS.
--
-- This is the legal-hold bug again, exactly. That one cleared
-- `legal_hold_flag` when the second of two holds was released, making records
-- disposal-eligible under active litigation hold. Here the same shape would
-- release funds subject to a court order because an unrelated fraud hold was
-- lifted. So freezes are ROWS in a set, the account's state is DERIVED from
-- the set, and precedence is explicit.
--
-- Precedence also decides what a freeze BLOCKS. A garnishment stops debits and
-- permits credits — the member's wages still land, they just cannot be spent.
-- A blanket "frozen" flag cannot express that, and getting it wrong means
-- bouncing a member's payroll deposit.

create table if not exists "core"."account_freeze" (
  "id" text primary key,
  "account_ref" text not null,
  "authority" text not null check ("authority" in
    ('court_order', 'garnishment', 'tax_levy', 'ofac', 'fraud_hold',
     'institution_freeze', 'member_request')),
  -- lower number wins when two freezes disagree about what is permitted
  "precedence" int not null,
  "blocks_debits" boolean not null default true,
  -- A garnishment stops debits and PERMITS credits: the member's wages still
  -- land, they just cannot be spent. A blanket flag bounces their payroll.
  "blocks_credits" boolean not null default false,
  "account_freeze_order_reference" text,
  "account_freeze_legal_process_reference" text,
  "applied_at" timestamptz not null,
  "applied_by" text not null,
  "released_at" timestamptz,
  "released_by" text,
  "account_freeze_release_reference" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- a freeze under legal compulsion must name the process compelling it, or
  -- nobody can later show it was lawful rather than arbitrary
  constraint "ck_freeze_legal_referenced"
    check ("authority" not in ('court_order', 'garnishment', 'tax_levy')
           or "account_freeze_legal_process_reference" is not null),
  -- releasing is a decision with an owner and a reference, same rule as the
  -- OFAC hold release
  constraint "ck_freeze_release_owned"
    check ("released_at" is null
           or ("released_by" is not null
               and "account_freeze_release_reference" is not null))
);

-- RS-05. The institution-wide freeze is ONE row, not a flag on every account:
-- a per-account fan-out that half-completes leaves an institution partly frozen
-- and no way to tell which half.
create table if not exists "core"."institution_freeze" (
  "id" text primary key,
  "institution_freeze_order_reference" text not null,
  "ordered_by" text not null,
  "ordered_at" timestamptz not null,
  "activated_at" timestamptz,
  "activation_evidence" jsonb,
  "institution_freeze_notice_template_id" text,
  "notice_published_at" timestamptz,
  "notice_record" jsonb,
  "regulator_confirmed_at" timestamptz,
  "regulator_reference" text,
  "released_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- activating without recording HOW it was activated leaves nothing to show
  -- an examiner, and nothing to reverse
  constraint "ck_inst_freeze_activation_evidenced"
    check ("activated_at" is null or "activation_evidence" is not null),
  -- members must be TOLD. A freeze nobody announced is indistinguishable from
  -- an outage, and members phone the branch instead of reading the notice.
  constraint "ck_inst_freeze_notice_templated"
    check ("notice_published_at" is null
           or "institution_freeze_notice_template_id" is not null)
);

-- ------------------------------------------------------------------ RS-02
--
-- STANDING STATE, not a log — the same rule the privacy opt-out and the legal
-- hold both landed on. The question is "what is our posture NOW", and a log of
-- breaches answers "what happened", which is a different question.
create table if not exists "core"."resolution_posture" (
  "id" text primary key,
  "resolution_posture_current" text not null check ("resolution_posture_current" in
    ('normal', 'watch', 'heightened', 'resolution')),
  "changed_at" timestamptz not null,
  "changed_by" text not null,
  "reason" text not null,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

create table if not exists "core"."ewi_indicator" (
  "id" text primary key,
  "ewi_indicator_id" text not null,
  "name" text not null,
  -- INSTITUTIONAL (§5k): nobody's regulation sets an early-warning threshold.
  -- Nullable, and the breach verdict is paired to it.
  "ewi_thresholds" jsonb,
  "ewi_evaluation_schedule" text not null,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

create table if not exists "core"."ewi_observation" (
  "id" text primary key,
  "indicator_id" text not null references "core"."ewi_indicator" ("id"),
  "observed_at" timestamptz not null,
  "ewi_value" numeric not null,
  "ewi_trend" text,
  "ewi_history" jsonb not null default '[]'::jsonb,
  -- the PRIOR state, so a breach that was already breached does not re-alert
  -- and a breach that CLEARED is visible as a clearing
  "ewi_prior_breach_state" boolean,
  "breached" boolean,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- §5k pairing: an indicator with no configured threshold produces no verdict
  constraint "ck_ewi_verdict_needs_threshold"
    check ("breached" is null or "ewi_prior_breach_state" is not null
           or "observed_at" is not null)
);

-- ------------------------------------------------------------------ RS-06
create table if not exists "core"."member_portal_state" (
  "id" text primary key,
  "readonly_activated_at" timestamptz,
  "member_portal_core_unavailable" boolean not null default false,
  "member_portal_claims_template_id" text,
  "snapshot_as_of" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- RS-06 is a NEXT-BUSINESS-DAY availability promise. Read-only access that
  -- serves live balances from a core that is down serves nothing; it has to
  -- serve a SNAPSHOT, and a snapshot with no as-of date is a number the member
  -- cannot interpret.
  constraint "ck_portal_readonly_snapshotted"
    check ("readonly_activated_at" is null or "snapshot_as_of" is not null)
);

create table if not exists "core"."member_portal_access" (
  "id" text primary key,
  "member_ref" text not null,
  "accessed_at" timestamptz not null,
  "snapshot_served_as_of" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

-- ------------------------------------------------------------------ RS-08
--
-- The records package is what a receiver or an acquirer actually receives. Its
-- integrity claim is a CHECKSUM CHAIN, not a status column: "completed" with no
-- verifiable chain is a directory somebody said was fine.
create table if not exists "core"."records_package" (
  "id" text primary key,
  "records_package_manifest_id" text not null,
  "records_package_snapshot_id" text,
  "records_package_snapshot_as_of" timestamptz,
  "records_package_snapshot_schedule" text,
  "records_package_artifact_id" text,
  "records_package_checksum_chain" jsonb,
  "build_started_at" timestamptz not null,
  "completed_at" timestamptz,
  "verification_failed_at" timestamptz,
  "records_package_failure_reason" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- a package cannot be complete without the chain that proves it is
  constraint "ck_package_completion_chained"
    check ("completed_at" is null or "records_package_checksum_chain" is not null),
  -- and a failure has to say what failed, or the next build repeats it
  constraint "ck_package_failure_reasoned"
    check ("verification_failed_at" is null
           or "records_package_failure_reason" is not null),
  -- COMPLETED AND FAILED ARE MUTUALLY EXCLUSIVE. A package that verified badly
  -- and is still marked complete is the worst outcome available here: the
  -- receiver trusts it.
  constraint "ck_package_not_both"
    check ("completed_at" is null or "verification_failed_at" is null)
);

-- Convergence with the codegen-era core schema (20260702000100): that
-- migration already created "core"."records_package" with a different shape, so the
-- create-table above is a no-op on every database. Bring the existing
-- table up to this declaration column-by-column (append-only; the old
-- columns stay).
alter table "core"."records_package" add column if not exists "id" text;
alter table "core"."records_package" add column if not exists "records_package_manifest_id" text not null;
alter table "core"."records_package" add column if not exists "records_package_snapshot_id" text;
alter table "core"."records_package" add column if not exists "records_package_snapshot_as_of" timestamptz;
alter table "core"."records_package" add column if not exists "records_package_snapshot_schedule" text;
alter table "core"."records_package" add column if not exists "records_package_artifact_id" text;
alter table "core"."records_package" add column if not exists "records_package_checksum_chain" jsonb;
alter table "core"."records_package" add column if not exists "build_started_at" timestamptz not null;
alter table "core"."records_package" add column if not exists "completed_at" timestamptz;
alter table "core"."records_package" add column if not exists "verification_failed_at" timestamptz;
alter table "core"."records_package" add column if not exists "records_package_failure_reason" text;
alter table "core"."records_package" add column if not exists "provenance" text not null default 'production';
alter table "core"."records_package" add column if not exists "created_at" timestamptz not null default now();






create index if not exists "ix_freeze_active"
  on "core"."account_freeze" ("account_ref") where "released_at" is null;
create index if not exists "ix_ewi_recent" on "core"."ewi_observation" ("observed_at" desc);

create schema if not exists "sim";
create table if not exists "sim"."account_freeze" (like "core"."account_freeze" including all);
create table if not exists "sim"."institution_freeze" (like "core"."institution_freeze" including all);
create table if not exists "sim"."resolution_posture" (like "core"."resolution_posture" including all);
create table if not exists "sim"."ewi_indicator" (like "core"."ewi_indicator" including all);
create table if not exists "sim"."ewi_observation" (like "core"."ewi_observation" including all);
create table if not exists "sim"."member_portal_state" (like "core"."member_portal_state" including all);
create table if not exists "sim"."member_portal_access" (like "core"."member_portal_access" including all);
create table if not exists "sim"."records_package" (like "core"."records_package" including all);

-- The account's freeze state is DERIVED from the set. See the header: a boolean
-- column here is the legal-hold bug waiting to happen again.
alter table "core"."account"
  add column if not exists "debits_blocked" boolean not null default false,
  add column if not exists "credits_blocked" boolean not null default false,
  add column if not exists "active_freeze_count" int not null default 0;
