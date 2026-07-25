-- The violation tier — cards drawn from the drill's in-scope red list, built
-- TDD-style: each control's trigger->produced_events spec is the failing
-- test; these tables are what the writers need to make them pass WITH
-- enforcement (a violating transaction must be REFUSED and leave evidence,
-- not merely logged).
--
-- Covers: CP-05 (custody), CP-07 (coaching), CP-12 (training coverage),
-- MP-06 (expulsion), MP-07 (death/estate), RS-03 (safe mode), PR-03
-- (disclosures), PR-04 (member data access), PR-15 (connections), DF-05
-- (insider credit), and the HR seam they share (IS-06's future writer too).

-- ------------------------------------------------------------------ HR seam
--
-- cash_ops.ts refused to invent personnel facts, and that was right — the
-- fix is not invention but a WRITER: personnel facts are declared by an
-- authorized internal actor exactly like thresholds and board approvals.
create table if not exists "core"."employee" (
  "id" text primary key,
  "name" text not null,
  "role" text not null,
  "cash_handler" boolean not null default false,
  "status" text not null default 'active' check ("status" in ('active', 'separated')),
  "hired_at" timestamptz not null default now(),
  "separated_at" timestamptz,
  "provenance" text not null default 'production'
);

create table if not exists "core"."hr_action" (
  "id" text primary key,
  "employee_id" text not null references "core"."employee"("id"),
  "kind" text not null check ("kind" in ('coaching', 'counseling', 'termination_review')),
  "cause_type" text,
  "cause_id" text,
  "notes" text,
  "recorded_at" timestamptz not null default now(),
  "provenance" text not null default 'production'
);

-- (training lives in the EXISTING core.training table — no parallel table)

-- --------------------------------------------------------- CP-05 custody
create table if not exists "core"."cash_custody" (
  "id" text primary key,
  "employee_id" text not null references "core"."employee"("id"),
  "kind" text not null check ("kind" in ('key', 'combination', 'keybox')),
  "asset_id" text,
  "granted_at" timestamptz not null default now(),
  "revoked_at" timestamptz,
  "revoke_reason" text,
  "rotation_due_at" timestamptz,
  "attested_at" timestamptz,
  "attestation_due_at" timestamptz,
  "provenance" text not null default 'production'
);

create table if not exists "core"."cash_keybox_access" (
  "id" text primary key,
  "custody_id" text not null references "core"."cash_custody"("id"),
  "second_person_id" text not null references "core"."employee"("id"),
  "reason" text not null,
  "opened_at" timestamptz not null default now(),
  "provenance" text not null default 'production'
);

-- --------------------------------------------------- MP-07 death + estate
create table if not exists "core"."estate_claim" (
  "id" text primary key,
  "entity_id" text not null,
  "date_of_death" date not null,
  "death_certificate_ref" text not null,
  "authority_document_ref" text,
  "claimant" text not null,
  "verification_id" text,
  "status" text not null default 'documented'
    check ("status" in ('documented', 'verified', 'paid')),
  "payout_cents" bigint,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "provenance" text not null default 'production'
);

-- ------------------------------------------------------- MP-06 expulsion
create table if not exists "core"."expulsion" (
  "id" text primary key,
  "entity_id" text not null,
  "grounds" text not null,
  "decided_by" text not null,
  "meeting_date" date not null,
  "notice_sent_at" timestamptz,
  "notice_channel" text,
  "hearing_requested_at" timestamptz,
  "hearing_held_at" timestamptz,
  "board_report_filed_at" timestamptz,
  "payout_cents" bigint,
  "amounts_owed_cents" bigint,
  "payout_sent_at" timestamptz,
  "status" text not null default 'decided'
    check ("status" in ('decided', 'noticed', 'hearing', 'final', 'reversed')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "provenance" text not null default 'production'
);

-- ------------------------------------------------------- RS-03 safe mode
--
-- One row per activation. The PARTIAL UNIQUE index makes "at most one active
-- safe mode" a database fact rather than an application hope.
create table if not exists "core"."safe_mode" (
  "id" text primary key,
  "status" text not null default 'active' check ("status" in ('active', 'deactivated')),
  "trigger_basis" text not null,
  "per_txn_cap_cents" bigint not null,
  "restricted_types" text[] not null default '{}',
  "activated_by" text not null,
  "activated_at" timestamptz not null default now(),
  "processor_confirmed_at" timestamptz,
  "deactivated_at" timestamptz,
  "deactivated_by" text,
  "deactivation_second_authorizer" text,
  "provenance" text not null default 'production'
);
create unique index if not exists "uq_safe_mode_single_active"
  on "core"."safe_mode" ("status") where ("status" = 'active');

-- ----------------------------------------------------- PR-03 disclosures
create table if not exists "core"."privacy_disclosure" (
  "id" text primary key,
  "entity_id" text not null,
  "recipient" text not null,
  "legal_basis" text,
  "vendor_id" text,
  "vendor_glba_addendum_id" text,
  "data_scope" text[],
  "blocked" boolean not null default false,
  "blocked_reason" text,
  "created_at" timestamptz not null default now(),
  "provenance" text not null default 'production'
);

-- ------------------------------------------------- PR-04 member access
create table if not exists "core"."privacy_access_request" (
  "id" text primary key,
  "entity_id" text not null,
  "requester_kind" text not null
    check ("requester_kind" in ('self', 'agent_poa', 'legal_process', 'other')),
  "agent_identity" text,
  "poa_artifact_id" text,
  "legal_process_artifact_id" text,
  "rfpa_applicable" boolean,
  "status" text not null check ("status" in ('granted', 'refused')),
  "refusal_reason" text,
  "decided_at" timestamptz not null default now(),
  "provenance" text not null default 'production'
);

-- ------------------------------------------------- PR-15 connections
--
-- A third-party connection IS a scoped token (card 45) with consent and a
-- lifecycle. token_id links to core.api_token so scope enforcement at the
-- router doubles as connection-scope enforcement.
create table if not exists "core"."connection" (
  "id" text primary key,
  "entity_id" text not null,
  "party_id" text not null,
  "scopes" text[] not null,
  "token_id" text not null,
  "status" text not null default 'active'
    check ("status" in ('active', 'suspended', 'revoked')),
  "consent_granted_at" timestamptz not null default now(),
  "violation_count" integer not null default 0,
  "suspended_at" timestamptz,
  "revoked_at" timestamptz,
  "provenance" text not null default 'production'
);

-- ------------------------------------------------------ DF-05 insider
create table if not exists "core"."insider_credit" (
  "id" text primary key,
  "covered_person_id" text not null,
  "loan_application_id" text,
  "amount_cents" bigint not null,
  "aggregate_after_cents" bigint not null,
  "threshold_cents" bigint,
  "threshold_exceeded" boolean not null default false,
  "board_approval_id" text,
  "proposed_terms" jsonb,
  "comparable_terms" jsonb,
  "terms_parity" boolean,
  "status" text not null default 'screened'
    check ("status" in ('screened', 'board_pending', 'approved', 'extended', 'refused')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "provenance" text not null default 'production'
);

-- deceased and expelled join the lock vocabulary — enforcement is the
-- EXISTING lock gate in the transfer path; these controls ride it.
alter table "core"."account" drop constraint if exists "account_lock_type_check";
alter table "core"."account"
  add constraint "account_lock_type_check"
  check ("lock_type" in ('none', 'compliance', 'fraud', 'legal', 'admin', 'deceased', 'expelled'));

notify pgrst, 'reload schema';
