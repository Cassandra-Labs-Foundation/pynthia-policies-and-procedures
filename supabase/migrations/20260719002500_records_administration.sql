-- Records administration (RR-01..RR-12) — Schedule A, integrity, archives.
--
-- THIS IS A THIRD DOMAIN SHAPE, and naming it is the point.
--
--   cda   — a noun with no verbs. Nothing existed; one table freed 13 controls.
--   cash  — scattered. Ten controls needing thirteen namespaces, three of them
--           entities that must not be fabricated.
--   here  — a MATURE SUBSYSTEM NEEDING EXTENSIONS. The noun (`core.record`)
--           exists, is populated, and its lifecycle works: clocks are set,
--           holds are placed and released, disposal is gated on three
--           conditions. Every one of the eleven namespaces the ten red controls
--           need is a SATELLITE of that noun, not a new entity.
--
-- The crude concentration ratio scores this 1.00 — maximally scattered, the
-- same as lending — and that reading is wrong. What separates them is that
-- every namespace here hangs off a subsystem that already runs. Sizing has to
-- ask what KIND of thing each namespace is, not how many there are.
--
-- WHAT WAS ALREADY TRUE AND IS NOW WIRED. OQ-10 records that the retention
-- MECHANISM was complete while only 2 of 9 record classes had writers. This
-- migration supplies the schedule those classes are read from, so a class is
-- registered data rather than a constant in TypeScript.

-- ------------------------------------------------------------- Schedule A
--
-- RR-01/RR-09. The retention schedule as DATA. It was previously a frozen
-- `RETENTION_SCHEDULE` map in retention.ts, which cannot be amended by the
-- people who own it, cannot carry a citation, and cannot record WHEN an
-- amendment took effect — so a record disposed last year cannot be checked
-- against the schedule that governed it at the time.
create table if not exists "core"."retention_schedule_entry" (
  "id" text primary key,
  "record_class" text not null,
  "retention_years" int not null check ("retention_years" >= 0),
  "anchor_kind" text not null,
  "citation" text not null,
  "version" int not null check ("version" >= 1),
  -- RR-11: a permanent record has no expiry and must never become disposal
  -- eligible. Modelled as a flag rather than a very large `retention_years`,
  -- because "keep for 999 years" silently becomes disposable in year 1000.
  "permanent" boolean not null default false,
  "effective_at" timestamptz not null,
  "superseded_at" timestamptz,
  "amended_by" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  constraint "ck_retention_schedule_permanent_has_no_term"
    check (not "permanent" or "retention_years" = 0)
);

-- RR-01: a record whose class matches NO schedule entry. It must be visible
-- rather than defaulted — a default retention period applied to an unknown
-- class is a guess that looks like a policy.
create table if not exists "core"."record_class_unmatched" (
  "id" text primary key,
  "record_class" text not null,
  "record_id" text,
  "detected_at" timestamptz not null,
  "resolved_at" timestamptz,
  "resolved_to_class" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

-- --------------------------------------------------- RR-02 media integrity
--
-- Electronic records have to remain READABLE, not merely stored. A conversion
-- that nobody certified and an integrity test nobody ran are the two ways an
-- archive quietly becomes unreadable.
create table if not exists "core"."record_integrity_test" (
  "id" text primary key,
  "subject_kind" text not null check ("subject_kind" in
    ('record', 'core_archive', 'email_archive')),
  "subject_ref" text not null,
  "test_kind" text not null check ("test_kind" in ('conversion', 'readability', 'completeness')),
  "due_at" timestamptz not null,
  "completed_at" timestamptz,
  "passed" boolean,
  "sample_size" int,
  "certified_by" text,
  "finding_id" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  -- a completed test must have a verdict AND a sample; a "test" with neither
  -- is a calendar entry
  constraint "ck_integrity_test_completed_has_verdict"
    check ("completed_at" is null or ("passed" is not null and "sample_size" is not null)),
  -- a FAILED test must open a finding — that is the whole consequence
  constraint "ck_integrity_test_failure_has_finding"
    check ("passed" is not false or "finding_id" is not null)
);

-- ------------------------------------------------ RR-04 destruction logging
--
-- The destruction log is reconciled against the records actually disposed. A
-- log that is only ever appended to cannot detect the case the control exists
-- for: a box marked destroyed whose records were never disposed, or the
-- reverse.
create table if not exists "core"."storage_box" (
  "id" text primary key,
  "label" text not null,
  "location" text not null,
  "record_ids" jsonb not null default '[]'::jsonb,
  "sealed_at" timestamptz,
  "destroyed_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."destruction_log_mismatch" (
  "id" text primary key,
  "box_id" text references "core"."storage_box" ("id"),
  "kind" text not null check ("kind" in
    ('box_destroyed_records_live', 'records_disposed_box_open', 'count_mismatch')),
  "detail" jsonb not null,
  "detected_at" timestamptz not null,
  "resolved_at" timestamptz,
  "resolution" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  constraint "ck_destruction_mismatch_resolution"
    check ("resolved_at" is null or "resolution" is not null)
);

-- ----------------------------------------------------------- RR-06 archives
create table if not exists "core"."archive_confirmation" (
  "id" text primary key,
  "archive_kind" text not null check ("archive_kind" in ('core_archive', 'email_archive')),
  "period" text not null,
  "vendor_ref" text,
  "retention_years_confirmed" int,
  "confirmed_at" timestamptz,
  "confirmed_by" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

-- --------------------------------------------------------------- RR-08 CDD
--
-- CDD profiles refresh on a risk-based cycle. A profile past its refresh date
-- is a STALE record, and RR-08 disposes of stale ones rather than carrying
-- them forward as if current.
create table if not exists "core"."cdd_profile" (
  "id" text primary key,
  "entity_id" text,
  "risk_rating" text not null check ("risk_rating" in ('low', 'medium', 'high')),
  "last_refreshed_at" timestamptz not null,
  "refresh_due_at" timestamptz not null,
  "refreshed_by" text,
  "stale_disposition" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

-- ------------------------------------------------- RR-07 BSA anonymization
--
-- BSA/AML records past retention are ANONYMIZED rather than deleted, so the
-- analytical series survives while the personal data does not. The method is
-- recorded because "disposed" covers both and they are not the same act.
create table if not exists "core"."record_disposition" (
  "id" text primary key,
  "record_id" text not null,
  "method" text not null check ("method" in ('destroyed', 'anonymized', 'returned')),
  "disposed_at" timestamptz not null,
  "approved_by" text not null,
  "retained_fields" jsonb,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

-- ------------------------------------------ RR-09 / RR-11 / RR-12 governance
create table if not exists "core"."records_policy_review" (
  "id" text primary key,
  "cycle_year" int not null,
  "reviewed_at" timestamptz not null,
  "reviewed_by" text not null,
  "policy_document_version" text not null,
  "schedule_entries_amended" int not null default 0,
  "regulation_changes_considered" jsonb not null default '[]'::jsonb,
  "board_report_filed_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

-- RR-12. A REGISTER OF ROLES, not of people. It records that a named
-- responsibility has a current holder and when it was vacated; it does not
-- model employment, which is the line the standing rule draws. Same shape as
-- `cash_asset.custodian_user_id`, which is a pointer rather than an entity.
create table if not exists "core"."records_contact" (
  "id" text primary key,
  "role" text not null,
  "assigned_ref" text,
  "assigned_at" timestamptz,
  "vacated_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  -- a vacancy is a real state and must be representable; what must NOT be
  -- representable is a role that is simultaneously assigned and vacated
  constraint "ck_records_contact_not_both"
    check ("vacated_at" is null or "assigned_ref" is null)
);

create index if not exists "ix_retention_schedule_class"
  on "core"."retention_schedule_entry" ("record_class", "effective_at" desc);
create index if not exists "ix_cdd_profile_due" on "core"."cdd_profile" ("refresh_due_at");

create schema if not exists "sim";
create table if not exists "sim"."retention_schedule_entry" (like "core"."retention_schedule_entry" including all);
create table if not exists "sim"."record_class_unmatched" (like "core"."record_class_unmatched" including all);
create table if not exists "sim"."record_integrity_test" (like "core"."record_integrity_test" including all);
create table if not exists "sim"."storage_box" (like "core"."storage_box" including all);
create table if not exists "sim"."destruction_log_mismatch" (like "core"."destruction_log_mismatch" including all);
create table if not exists "sim"."archive_confirmation" (like "core"."archive_confirmation" including all);
create table if not exists "sim"."cdd_profile" (like "core"."cdd_profile" including all);
create table if not exists "sim"."record_disposition" (like "core"."record_disposition" including all);
create table if not exists "sim"."records_policy_review" (like "core"."records_policy_review" including all);
create table if not exists "sim"."records_contact" (like "core"."records_contact" including all);
