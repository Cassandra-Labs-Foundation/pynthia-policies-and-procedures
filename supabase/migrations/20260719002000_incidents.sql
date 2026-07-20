-- Incident response (SC-01 and 23 other in-scope controls).
--
-- THE CLOCK ANCHOR, CHECKED BEFORE BUILDING — and it is INVERTED from the
-- previous two regulatory deadlines in this repo.
--
--   SAR (BSA-06)   30 days from DETECTION, not from triage      -> earlier anchor
--   ECOA (LP-07)   30 days from COMPLETION, not from decision   -> earlier anchor
--   NCUA (SC-01)   72 hours from the REPORTABILITY DETERMINATION -> LATER anchor
--
-- SC-01: "NCUA notification must be sent within 72 hours of that
-- determination." Not from detection, not from declaration. Anchoring on
-- detection would be stricter than the regulation and would report false
-- breaches; anchoring on determination is correct.
--
-- BUT THAT LEAVES A REAL GAP, and it is in the regulation rather than in this
-- schema: NOTHING BOUNDS HOW LONG DETERMINATION TAKES. An institution that
-- never determines reportability never starts the 72-hour clock and never
-- breaches it. So `determination_due_at` below is an INTERNAL deadline this
-- system imposes on itself — not an NCUA requirement — and the sweep surfaces
-- undetermined incidents separately from overdue notifications. See OQ-21.

create table if not exists "core"."incident" (
  "id" text primary key,
  "title" text not null,
  "severity" text not null check ("severity" in ('sev1', 'sev2', 'sev3', 'sev4')),
  "source" text,

  "status" text not null default 'declared' check ("status" in (
    'detected', 'declared', 'contained', 'restored', 'closed'
  )),

  -- the timeline. detected_at is when the SIGNAL arrived; declared_at is when a
  -- human decided it was an incident. They differ and both matter.
  "detected_at" timestamptz not null default now(),
  "declared_at" timestamptz,
  "ic_assigned_to" text,
  "ic_assigned_at" timestamptz,
  "first_hour_completed_at" timestamptz,
  "contained_at" timestamptz,
  "restored_at" timestamptz,
  "closed_at" timestamptz,

  -- SC-01. Write-restricted to Compliance/Legal in the writer.
  "reportability_determined_at" timestamptz,
  "reportability_determined_by" text,
  "is_reportable" boolean,
  "reportability_rationale" text,
  -- 72 hours from DETERMINATION (see header)
  "ncua_notice_due_at" timestamptz,
  "ncua_notified_at" timestamptz,

  -- an INTERNAL bound on determination itself, because the regulation has none
  "determination_due_at" timestamptz,

  "member_impact_confirmed_at" timestamptz,
  "member_notices_sent_at" timestamptz,

  "provenance" text not null default 'unknown',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

-- Convergence with the codegen-era core schema (20260702000100): that
-- migration already created "core"."incident" with a different shape, so the
-- create-table above is a no-op on every database. Bring the existing
-- table up to this declaration column-by-column (append-only; the old
-- columns stay).
alter table "core"."incident" add column if not exists "id" text;
alter table "core"."incident" add column if not exists "title" text not null;
alter table "core"."incident" add column if not exists "severity" text not null check ("severity" in ('sev1', 'sev2', 'sev3', 'sev4'));
alter table "core"."incident" add column if not exists "source" text;
alter table "core"."incident" add column if not exists "status" text not null default 'declared' check ("status" in (;
alter table "core"."incident" add column if not exists "detected_at" timestamptz not null default now();
alter table "core"."incident" add column if not exists "declared_at" timestamptz;
alter table "core"."incident" add column if not exists "ic_assigned_to" text;
alter table "core"."incident" add column if not exists "ic_assigned_at" timestamptz;
alter table "core"."incident" add column if not exists "first_hour_completed_at" timestamptz;
alter table "core"."incident" add column if not exists "contained_at" timestamptz;
alter table "core"."incident" add column if not exists "restored_at" timestamptz;
alter table "core"."incident" add column if not exists "closed_at" timestamptz;
alter table "core"."incident" add column if not exists "reportability_determined_at" timestamptz;
alter table "core"."incident" add column if not exists "reportability_determined_by" text;
alter table "core"."incident" add column if not exists "is_reportable" boolean;
alter table "core"."incident" add column if not exists "reportability_rationale" text;
alter table "core"."incident" add column if not exists "ncua_notice_due_at" timestamptz;
alter table "core"."incident" add column if not exists "ncua_notified_at" timestamptz;
alter table "core"."incident" add column if not exists "determination_due_at" timestamptz;
alter table "core"."incident" add column if not exists "member_impact_confirmed_at" timestamptz;
alter table "core"."incident" add column if not exists "member_notices_sent_at" timestamptz;
alter table "core"."incident" add column if not exists "provenance" text not null default 'unknown';
alter table "core"."incident" add column if not exists "created_at" timestamptz not null default now();
alter table "core"."incident" add column if not exists "updated_at" timestamptz not null default now();


-- SC-01: a NON-reportable determination must be documented with rationale. The
-- undocumented "we decided it wasn't reportable" is the finding an examiner
-- looks for, so it is unrepresentable.
alter table "core"."incident" drop constraint if exists "ck_incident_determination_rationale";
alter table "core"."incident"
  add constraint "ck_incident_determination_rationale"
  check (
    "reportability_determined_at" is null
    or ("is_reportable" is not null and "reportability_rationale" is not null)
  );

-- The 72-hour clock exists only once a determination has been made — it cannot
-- be set earlier, because there is nothing to count from.
alter table "core"."incident" drop constraint if exists "ck_incident_ncua_due_after_determination";
alter table "core"."incident"
  add constraint "ck_incident_ncua_due_after_determination"
  check (
    "ncua_notice_due_at" is null
    or ("reportability_determined_at" is not null
        and "ncua_notice_due_at" > "reportability_determined_at")
  );

-- A notification cannot precede the determination that required it.
alter table "core"."incident" drop constraint if exists "ck_incident_notified_after_determination";
alter table "core"."incident"
  add constraint "ck_incident_notified_after_determination"
  check ("ncua_notified_at" is null or "reportability_determined_at" is not null);

create table if not exists "core"."incident_sitrep" (
  "id" text primary key,
  "incident_id" text not null,
  "sequence" int not null,
  "summary" text not null,
  "issued_at" timestamptz not null default now(),
  "issued_by" text not null,
  "provenance" text not null default 'unknown'
);

alter table "core"."incident_sitrep" drop constraint if exists "fk_sitrep_incident";
alter table "core"."incident_sitrep"
  add constraint "fk_sitrep_incident" foreign key ("incident_id") references "core"."incident" ("id");

create index if not exists "idx_incident_ncua_overdue"
  on "core"."incident" ("ncua_notice_due_at") where "ncua_notified_at" is null;
create index if not exists "idx_incident_undetermined"
  on "core"."incident" ("determination_due_at") where "reportability_determined_at" is null;
create index if not exists "idx_incident_open" on "core"."incident" ("status");

create table if not exists "sim"."incident" (like "core"."incident" including defaults);
create table if not exists "sim"."incident_sitrep" (like "core"."incident_sitrep" including defaults);
grant all privileges on "core"."incident", "core"."incident_sitrep" to "service_role";
grant all privileges on "sim"."incident", "sim"."incident_sitrep" to "service_role";

notify pgrst, 'reload schema';
