-- Access, risk breaches and control exceptions (ERM-06, ERM-07, IC-06).
--
-- THREE REGISTERS THAT ARE THE SAME SHAPE AND MUST NOT BE MERGED.
--
-- A RISK BREACH (ERM-06) is an appetite excursion: a KRI moved outside the
-- Board's stated tolerance. It escalates on a clock and is closed by returning
-- inside appetite.
--
-- A RISK ACCEPTANCE (ERM-07) is a decision to STAY outside appetite for a
-- stated period. It is the opposite disposition of the same fact, and it
-- EXPIRES — which is the control, because an acceptance nobody revisits is a
-- permanent exception granted by inattention.
--
-- A CONTROL OVERRIDE (IC-06) is a single act: someone bypassed a control on one
-- transaction. It has no period and no expiry; what it has is a rationale and
-- an analytics trail that makes repetition visible.
--
-- Merging any pair loses the thing that distinguishes them — the clock, the
-- expiry, or the repetition count. They share a shape and nothing else.
--
-- WHAT IS ABSENT: `core.access` is NOT built here. EC-02 and IS-06 both need
-- `employee.terminated` / `employee.separated` to drive deprovisioning, and
-- access provisioning without the separation trigger is the half of the control
-- that never fires. Building the register alone would produce a table that
-- looks like access management and cannot revoke anything. Both stay RED; see
-- BLUEPRINT §X.1.

-- --------------------------------------------------------------- the register
--
-- `core.risk` is another of the 22 ABANDONED TABLES. ERM-06 and ERM-07 both
-- read it: a breach is an excursion on a REGISTERED risk with a named owner and
-- a residual rating, and an acceptance is a decision to carry that specific
-- risk. Without the register both controls are about excursions on nothing.
alter table "core"."risk"
  add column if not exists "taxonomy_category_code" text,
  add column if not exists "title" text,
  add column if not exists "owner_id" text,
  add column if not exists "inherent_rating" text,
  add column if not exists "residual_rating" text,
  add column if not exists "remediation_evidence" text,
  add column if not exists "last_assessed_at" timestamptz,
  add column if not exists "provenance" text not null default 'production';

-- ------------------------------------------------------------- risk appetite
create table if not exists "core"."risk_appetite" (
  "id" text primary key,
  "risk_id" text,
  "taxonomy_category_code" text not null,
  "kri_name" text not null,
  "tolerance_value" numeric not null,
  "direction" text not null check ("direction" in ('above', 'below')),
  "owner_id" text not null,
  "document_ref" text not null,
  "approved_by" text not null,
  "effective_at" timestamptz not null,
  "superseded_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

-- ERM-06. An excursion outside appetite, with its escalation clocks.
create table if not exists "core"."risk_breach" (
  "id" text primary key,
  "appetite_id" text references "core"."risk_appetite" ("id"),
  "taxonomy_category_code" text not null,
  "kri_value" numeric not null,
  "tolerance_value" numeric not null,
  -- how far outside, kept as its own column because the SIZE of the excursion
  -- drives severity and a report that only says "breached" cannot rank
  "current_excursion" numeric not null,
  "severity" text not null check ("severity" in ('low', 'moderate', 'high', 'critical')),
  "owner_id" text not null,
  "residual_rating" text,
  "impact_summary" text,
  "detected_at" timestamptz not null,
  "triage_due_at" timestamptz not null,
  "triaged_at" timestamptz,
  "cro_notified_at" timestamptz,
  "committee_due_at" timestamptz not null,
  "committee_presented_at" timestamptz,
  "review_due_at" timestamptz not null,
  "reviewed_at" timestamptz,
  "remediation_plan" text,
  "remediation_status" text not null default 'open'
    check ("remediation_status" in ('open', 'in_progress', 'complete', 'accepted')),
  "closed_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),

  -- the excursion must equal its own components, or severity is unauditable
  constraint "ck_risk_breach_excursion_matches"
    check ("current_excursion" = abs("kri_value" - "tolerance_value")),
  -- a breach closed with no remediation plan is a breach that stopped being
  -- looked at
  constraint "ck_risk_breach_closure_planned"
    check ("closed_at" is null or "remediation_plan" is not null)
);

-- ERM-07. The opposite disposition, and it EXPIRES.
create table if not exists "core"."risk_acceptance" (
  "id" text primary key,
  "risk_id" text not null,
  "breach_id" text references "core"."risk_breach" ("id"),
  "owner_id" text not null,
  "rationale" text not null,
  "remediation_evidence" text,
  "requested_at" timestamptz not null,
  "decision_due_at" timestamptz not null,
  "decision" text check ("decision" in ('accepted', 'declined')),
  "decided_at" timestamptz,
  "decided_by" text,
  -- an acceptance with no expiry is a permanent exception granted by
  -- inattention. NOT NULL is the control.
  "expiry_date" timestamptz not null,
  "expiry_alert_at" timestamptz not null,
  "expiry_alerted_at" timestamptz,
  "expired_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),

  -- four-eyes: the owner requesting an acceptance cannot grant it
  constraint "ck_risk_acceptance_four_eyes"
    check ("decided_by" is null or "decided_by" <> "owner_id"),
  -- the alert must precede the expiry, or it fires after the thing it warns of
  constraint "ck_risk_acceptance_alert_before_expiry"
    check ("expiry_alert_at" < "expiry_date")
);

-- IC-06. A single act, with no period.
create table if not exists "core"."control_override" (
  "id" text primary key,
  "control_id" text not null,
  "subject_kind" text not null,
  "subject_ref" text not null,
  "actor_ref" text not null,
  "rationale" text not null,
  "invoked_at" timestamptz not null,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

-- IC-06. A registered exception: scoped, approved and time-boxed.
create table if not exists "core"."control_exception" (
  "id" text primary key,
  "control_id" text not null,
  "scope" text not null,
  "rationale" text not null,
  "risk_acceptance_id" text references "core"."risk_acceptance" ("id"),
  "approver_id" text not null,
  "registered_by" text not null,
  "registered_at" timestamptz not null,
  "expires_at" timestamptz not null,
  "reverted_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- an exception approved by the person who registered it is not approved
  constraint "ck_control_exception_four_eyes"
    check ("approver_id" <> "registered_by")
);

create index if not exists "ix_risk_breach_open" on "core"."risk_breach" ("closed_at", "review_due_at");
create index if not exists "ix_risk_acceptance_expiry" on "core"."risk_acceptance" ("expired_at", "expiry_alert_at");
create index if not exists "ix_control_exception_expiry" on "core"."control_exception" ("reverted_at", "expires_at");

create schema if not exists "sim";
create table if not exists "sim"."risk_appetite" (like "core"."risk_appetite" including all);
create table if not exists "sim"."risk_breach" (like "core"."risk_breach" including all);
create table if not exists "sim"."risk_acceptance" (like "core"."risk_acceptance" including all);
create table if not exists "sim"."control_override" (like "core"."control_override" including all);
create table if not exists "sim"."control_exception" (like "core"."control_exception" including all);
