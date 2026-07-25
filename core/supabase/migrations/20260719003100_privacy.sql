-- Privacy (PR-01..PR-18) — GLBA notices, opt-outs, state rights, tracking.
--
-- THE ONE STRUCTURAL DECISION: OPT-OUT IS A STANDING STATE, NOT AN EVENT.
--
-- The natural model is a log of opt-out requests. That is wrong in a way that
-- fails silently: the obligation is not "record that they asked", it is "do not
-- share, from now on, until they say otherwise". A log answers "did they ask";
-- a standing state answers "may we share TODAY", which is the question every
-- disclosure has to ask.
--
-- So `privacy_preference` holds the CURRENT state per member per channel, and
-- the requests that changed it are events on top. The propagation deadline
-- lives on the state row, because the failure mode is a preference captured at
-- the desk and never pushed to the systems that actually do the sharing.
--
-- SECOND DECISION: STATE RIGHTS ARE A SUPERSET, NOT A PARALLEL TRACK.
-- PR-12 asks for a universal floor across state regimes. Modelling CCPA, CPA,
-- VCDPA and the rest as separate flows guarantees they drift; modelling one
-- request type with the STRICTEST deadline and the widest right set means a new
-- state law is a configuration change rather than a new subsystem.

-- ------------------------------------------------------------------ notices
create table if not exists "core"."privacy_notice" (
  "id" text primary key,
  "version" text not null,
  "template_ref" text not null,
  "effective_at" timestamptz not null,
  "superseded_at" timestamptz,
  "published_to_website_at" timestamptz,
  "material_change" boolean not null default false,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

create table if not exists "core"."privacy_notice_delivery" (
  "id" text primary key,
  "notice_id" text not null references "core"."privacy_notice" ("id"),
  "entity_ref" text not null,
  "reason" text not null check ("reason" in
    ('initial', 'annual', 'revision', 'member_request')),
  "channel" text not null check ("channel" in ('mail', 'email', 'esign', 'in_branch')),
  "due_at" timestamptz not null,
  "delivered_at" timestamptz,
  -- E-SIGN: electronic delivery requires prior consent, and consent that was
  -- never captured makes the delivery invalid rather than merely undocumented
  "esign_consent_id" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  constraint "ck_notice_esign_requires_consent"
    check ("channel" <> 'esign' or "esign_consent_id" is not null)
);

create table if not exists "core"."esign_consent" (
  "id" text primary key,
  "entity_ref" text not null,
  "started_at" timestamptz not null,
  "captured_at" timestamptz,
  "demonstrated_access" boolean not null default false,
  "withdrawn_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- E-SIGN 101(c)(1)(C)(ii): consent must be given in a way that REASONABLY
  -- DEMONSTRATES the member can access the electronic records. A checkbox
  -- alone does not.
  constraint "ck_esign_capture_demonstrated"
    check ("captured_at" is null or "demonstrated_access")
);

-- --------------------------------------------------------- the standing state
--
-- See the header: this is a STATE, not a log.
create table if not exists "core"."privacy_preference" (
  "id" text primary key,
  "entity_ref" text not null,
  "channel" text not null check ("channel" in
    ('affiliate_sharing', 'nonaffiliate_sharing', 'marketing', 'nevada_sale', 'targeted_ads')),
  -- PR-12's floor is applied per jurisdiction: the strictest rule governs, but
  -- which rules apply at all depends on where the member is
  "entity_jurisdiction" text,
  "opted_out" boolean not null,
  "source" text not null check ("source" in
    ('member_request', 'gpc_signal', 'state_request', 'default')),
  "effective_at" timestamptz not null,
  -- the failure mode this column exists for: a preference captured at the desk
  -- and never pushed to the systems that do the sharing
  "propagation_due_at" timestamptz not null,
  "propagated_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

-- ------------------------------------------------------- state privacy rights
create table if not exists "core"."privacy_state_request" (
  "id" text primary key,
  "entity_ref" text not null,
  "state" text not null,
  "entity_jurisdiction" text,
  "right_requested" text not null check ("right_requested" in
    ('access', 'delete', 'correct', 'portability', 'opt_out', 'know')),
  "received_at" timestamptz not null,
  "verified_at" timestamptz,
  "due_at" timestamptz not null,
  "extended_due_at" timestamptz,
  "fulfilled_at" timestamptz,
  "outcome" text,
  "denial_basis" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- a request cannot be fulfilled before the requester is verified; fulfilling
  -- an unverified access request IS the disclosure the right exists to control
  constraint "ck_state_request_verified_before_fulfilled"
    check ("fulfilled_at" is null or "verified_at" is not null),
  -- a denial must state its basis
  constraint "ck_state_request_denial_reasoned"
    check ("outcome" <> 'denied' or "denial_basis" is not null)
);

-- ---------------------------------------------------------- web and tracking
create table if not exists "core"."web_consent" (
  "id" text primary key,
  "session_ref" text not null,
  "entity_ref" text,
  "categories" jsonb not null,
  "gpc_signal" boolean not null default false,
  "recorded_at" timestamptz not null,
  "tags_gated" jsonb not null default '[]'::jsonb,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

create table if not exists "core"."web_tag" (
  "id" text primary key,
  "vendor" text not null,
  "category" text not null check ("category" in
    ('essential', 'analytics', 'advertising', 'functional')),
  "decision" text not null check ("decision" in ('approved', 'rejected', 'pending')),
  "reviewed_by" text,
  "reviewed_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  constraint "ck_web_tag_decision_reviewed"
    check ("decision" = 'pending' or ("reviewed_by" is not null and "reviewed_at" is not null))
);

-- ------------------------------------------------ analytics / de-identification
create table if not exists "core"."analytics_dataset" (
  "id" text primary key,
  "purpose" text not null,
  "requested_by" text not null,
  "requested_at" timestamptz not null,
  "method" text not null check ("method" in ('aggregation', 'k_anonymity', 'suppression', 'raw')),
  "k_value" int,
  "reid_risk_bp" int,
  "risk_threshold_bp" int,
  "risk_breached" boolean,
  "approved_at" timestamptz,
  "approved_by" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- an unset threshold cannot produce a verdict. Same rule as everywhere else.
  constraint "ck_analytics_verdict_needs_threshold"
    check (("risk_threshold_bp" is null) = ("risk_breached" is null)),
  -- k-anonymity with no k is not k-anonymity
  constraint "ck_analytics_k_present"
    check ("method" <> 'k_anonymity' or "k_value" is not null),
  -- a dataset over the re-identification threshold must not be approved
  constraint "ck_analytics_no_approval_over_threshold"
    check ("approved_at" is null or "risk_breached" is not true)
);

-- ------------------------------------------------------------ biometrics
create table if not exists "core"."biometric_verification" (
  "id" text primary key,
  "entity_ref" text not null,
  "consent_id" text,
  -- PR-16: a member who declines biometrics must have another route to
  -- verification. No alternative means biometrics are effectively mandatory.
  "alt_path_available" boolean not null default true,
  "alt_path_used" boolean not null default false,
  "started_at" timestamptz not null,
  "completed_at" timestamptz,
  "outcome" text check ("outcome" in ('verified', 'declined')),
  -- BIPA-style: biometric data is retained only as long as the purpose lasts
  "purge_due_at" timestamptz not null,
  "purged_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- capturing biometrics without written consent is the violation; there is no
  -- version of this that is merely undocumented
  constraint "ck_biometric_requires_consent"
    check ("consent_id" is not null)
);

-- ----------------------------------------------------------- children's data
create table if not exists "core"."minor_data_event" (
  "id" text primary key,
  "kind" text not null check ("kind" in ('age_gate_blocked', 'minor_data_detected', 'deleted')),
  "subject_ref" text not null,
  "age_asserted" int,
  "detected_at" timestamptz not null,
  "deleted_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

-- --------------------------------------------------- corrections / furnishing
create table if not exists "core"."furnishing_dispute" (
  "id" text primary key,
  "entity_ref" text not null,
  "field" text not null,
  "disputed_value" text,
  "address_ncoa_candidate" text,
  "address_ncoa_mismatch" boolean not null default false,
  -- shares this register with MP-04's Reg E disputes; the basis is what
  -- distinguishes a data-accuracy dispute from a transaction one
  "dispute_basis" text,
  "corrected_value" text,
  "received_at" timestamptz not null,
  "due_at" timestamptz not null,
  "investigated_at" timestamptz,
  "correction_applied_at" timestamptz,
  "propagation_due_at" timestamptz,
  "propagated_at" timestamptz,
  "redflag_raised" boolean not null default false,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- FCRA: a correction that is applied but never propagated to the systems
  -- that furnish is a correction the credit bureaus never see
  constraint "ck_furnishing_correction_propagates"
    check ("correction_applied_at" is null or "propagation_due_at" is not null)
);

create index if not exists "ix_privacy_pref_entity"
  on "core"."privacy_preference" ("entity_ref", "channel");
create index if not exists "ix_privacy_pref_unpropagated"
  on "core"."privacy_preference" ("propagated_at", "propagation_due_at");
create index if not exists "ix_state_request_open"
  on "core"."privacy_state_request" ("fulfilled_at", "due_at");

create schema if not exists "sim";
create table if not exists "sim"."privacy_notice" (like "core"."privacy_notice" including all);
create table if not exists "sim"."privacy_notice_delivery" (like "core"."privacy_notice_delivery" including all);
create table if not exists "sim"."esign_consent" (like "core"."esign_consent" including all);
create table if not exists "sim"."privacy_preference" (like "core"."privacy_preference" including all);
create table if not exists "sim"."privacy_state_request" (like "core"."privacy_state_request" including all);
create table if not exists "sim"."web_consent" (like "core"."web_consent" including all);
create table if not exists "sim"."web_tag" (like "core"."web_tag" including all);
create table if not exists "sim"."analytics_dataset" (like "core"."analytics_dataset" including all);
create table if not exists "sim"."biometric_verification" (like "core"."biometric_verification" including all);
create table if not exists "sim"."minor_data_event" (like "core"."minor_data_event" including all);
create table if not exists "sim"."furnishing_dispute" (like "core"."furnishing_dispute" including all);

-- `core.address` is another of the 22 ABANDONED TABLES. PR-05 compares the
-- address of record against what the postal service says, and a comparison
-- needs both sides to be rows.
alter table "core"."address"
  add column if not exists "entity_ref" text,
  add column if not exists "line1" text,
  add column if not exists "ncoa_candidate" text,
  add column if not exists "ncoa_mismatch" boolean not null default false,
  add column if not exists "checked_at" timestamptz,
  add column if not exists "provenance" text not null default 'production';

-- PR-16: a member who declines biometrics must have another route.
alter table "core"."verification"
  add column if not exists "alt_path_available" boolean,
  add column if not exists "alt_path_used" boolean,
  add column if not exists "biometric_consent_id" text;
