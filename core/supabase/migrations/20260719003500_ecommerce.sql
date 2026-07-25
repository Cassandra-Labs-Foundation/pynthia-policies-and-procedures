-- E-commerce (EC-01, EC-03, EC-04, EC-07) and the incident gaps EC-13/SC-03.
--
-- WHAT IS NOT HERE, AND WHY. EC-05 (firewalls), EC-06 (TLS), EC-08 (antivirus)
-- and EC-09 (penetration testing and intrusion detection) are NOT modelled.
-- Every one of them is a control over infrastructure this system does not run
-- and cannot observe: a firewall rule review, a TLS cipher rating, an endpoint
-- agent's remediation, a pentest report. A table that accepted "firewall
-- reviewed: true" from a caller would turn four infrastructure controls green
-- while proving nothing whatsoever about the infrastructure. They stay red,
-- naming the feed they need. See BLUEPRINT §X.2.
--
-- STRUCTURAL DECISION: A CREDENTIAL IS A STANDING STATE WITH A TEMPORARY FLAG.
--
-- The natural model is a log of credential issuances. That fails the way the
-- privacy opt-out log failed: the obligation is not "record that we issued a
-- password", it is "no member is sitting on a temporary password right now".
-- A log answers the first; only a state row with `is_temporary` and
-- `password_set_at` answers the second, which is the one EC-04 asks.
--
-- The corollary is that `is_temporary` must be FALSE-able only by an actual
-- password change. Issuing a permanent-looking credential and never forcing the
-- change is the failure; so the column moves on `password.changed` and nowhere
-- else.

create table if not exists "core"."ecommerce_enrollment" (
  "id" text primary key,
  "member_ref" text not null,
  "channel" text not null check ("channel" in ('web', 'mobile', 'branch', 'phone')),
  "applicant_identity" text not null,
  "identity_evidence" jsonb not null default '{}'::jsonb,
  -- EC-03: the member number the applicant claims has to MATCH the one on file.
  -- An enrollment that never compared them has authenticated nobody.
  "member_number_match" boolean,
  "entity_email" text,
  "submitted_at" timestamptz not null,
  "verified_at" timestamptz,
  "verification_outcome" text check ("verification_outcome" in ('verified', 'denied')),
  "denial_reason" text,
  "approved_at" timestamptz,
  "confirmation_sent_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- unknown is not permission: an enrollment cannot be approved while the
  -- member-number comparison has no answer
  constraint "ck_enroll_approval_needs_match"
    check ("approved_at" is null or "member_number_match" is true),
  constraint "ck_enroll_denial_reasoned"
    check ("verification_outcome" <> 'denied' or "denial_reason" is not null),
  -- the confirmation goes to the member so an enrollment they did not make is
  -- visible to them; an approval nobody was told about is a silent takeover
  constraint "ck_enroll_approval_confirmed"
    check ("approved_at" is null or "confirmation_sent_at" is not null)
);

-- See the header: STATE, not a log.
create table if not exists "core"."member_credential" (
  "id" text primary key,
  "member_ref" text not null,
  "login_id" text not null,
  "password_hash" text not null,
  "security_questions" jsonb not null default '[]'::jsonb,
  "is_temporary" boolean not null,
  "temp_password_expires_at" timestamptz,
  "password_set_at" timestamptz,
  "failed_login_count" int not null default 0,
  "locked_at" timestamptz,
  "lockout_reason" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  -- a temporary credential with no expiry is a permanent one wearing a label
  constraint "ck_credential_temp_expires"
    check (not "is_temporary" or "temp_password_expires_at" is not null),
  -- and a permanent one has to know WHEN the member set it, or the expiry
  -- clock EC-04 asks about has no anchor
  constraint "ck_credential_permanent_anchored"
    check ("is_temporary" or "password_set_at" is not null),
  -- a lock is a decision and needs a stated reason
  constraint "ck_credential_lock_reasoned"
    check ("locked_at" is null or "lockout_reason" is not null)
);

-- EC-07: the audit trail IS the control. A transaction the member later
-- repudiates is answered by the record of who initiated it from where, and a
-- review with no trail to review is a review of nothing.
create table if not exists "core"."ecommerce_transaction" (
  "id" text primary key,
  "member_ref" text not null,
  "transaction_type" text not null,
  "transaction_amount_cents" bigint not null,
  "transaction_initiated_by" text not null,
  "initiated_at" timestamptz not null,
  "audit_trail" jsonb not null,
  "repudiation_claimed_at" timestamptz,
  "repudiation_reviewed_at" timestamptz,
  "repudiation_outcome" text check ("repudiation_outcome" in ('upheld', 'rejected')),
  "repudiation_rationale" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- a repudiation review that reaches a conclusion has to say why; "rejected"
  -- with no rationale is the member's word discarded without a record
  constraint "ck_repudiation_reasoned"
    check ("repudiation_outcome" is null or "repudiation_rationale" is not null),
  constraint "ck_repudiation_reviewed_before_outcome"
    check ("repudiation_outcome" is null or "repudiation_reviewed_at" is not null)
);

-- EC-01: the e-commerce policy and its risk assessment. `core.policy` already
-- exists; this is the assessment that has to accompany a board approval.
create table if not exists "core"."ecommerce_risk_assessment" (
  "id" text primary key,
  "policy_document_version" text not null,
  "assessment_due_at" timestamptz not null,
  "completed_at" timestamptz,
  "finding_description" text,
  "control_register" jsonb not null default '[]'::jsonb,
  "regulatory_change_analysis" text,
  "board_approved_at" timestamptz,
  "board_approved_by" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- the board approving a policy whose risk assessment was never completed is
  -- the approval EC-01 exists to prevent
  constraint "ck_ecomm_board_after_assessment"
    check ("board_approved_at" is null or "completed_at" is not null)
);

create index if not exists "ix_credential_temp"
  on "core"."member_credential" ("is_temporary", "temp_password_expires_at");
create index if not exists "ix_ecomm_repudiation_open"
  on "core"."ecommerce_transaction" ("repudiation_reviewed_at", "repudiation_claimed_at");

create schema if not exists "sim";
create table if not exists "sim"."ecommerce_enrollment" (like "core"."ecommerce_enrollment" including all);
create table if not exists "sim"."member_credential" (like "core"."member_credential" including all);
create table if not exists "sim"."ecommerce_transaction" (like "core"."ecommerce_transaction" including all);
create table if not exists "sim"."ecommerce_risk_assessment" (like "core"."ecommerce_risk_assessment" including all);

-- ------------------------------------------------------------ EC-13 / SC-03
--
-- NOT A NEW INCIDENT TABLE. `core.incident` and `core.incident_sitrep` already
-- exist and already carry the reportability determination. EC-13 asks for the
-- ASSESSMENT that precedes it — what was in scope, whose data, what the member
-- impact was — and for the external-communications gate. Those are columns on
-- the incident that already exists.
alter table "core"."incident"
  add column if not exists "detection_source" text,
  add column if not exists "scope_initial" text,
  add column if not exists "data_scope" jsonb,
  add column if not exists "facts" jsonb,
  add column if not exists "member_impact" text,
  add column if not exists "assessment_completed_at" timestamptz,
  add column if not exists "legal_review_at" timestamptz,
  add column if not exists "legal_review_by" text,
  add column if not exists "comms_plan" jsonb,
  add column if not exists "comms_holding_statement" text,
  add column if not exists "external_comms_at" timestamptz,
  -- SC-03: the sitrep cadence, not just the first one. An incident that issued
  -- v1 and then went quiet is the failure mode the cadence exists to catch.
  add column if not exists "sitrep_cadence_minutes" int;

-- External communications about a breach carry legal exposure the incident
-- commander is not positioned to judge. The gate is legal review, and it is a
-- constraint rather than a procedure note because a procedure note does not
-- stop a well-meaning comms lead at 2am.
alter table "core"."incident" drop constraint if exists "ck_incident_comms_after_legal";
alter table "core"."incident"
  add constraint "ck_incident_comms_after_legal"
    check ("external_comms_at" is null or "legal_review_at" is not null);

-- And the assessment precedes the determination it feeds.
alter table "core"."incident" drop constraint if exists "ck_incident_assessment_before_determination";
alter table "core"."incident"
  add constraint "ck_incident_assessment_before_determination"
    check ("reportability_determined_at" is null or "assessment_completed_at" is not null);
