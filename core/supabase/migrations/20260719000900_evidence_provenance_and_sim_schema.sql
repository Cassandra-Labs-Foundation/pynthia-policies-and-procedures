-- Evidence provenance, enforced structurally rather than by discipline.
--
-- THE PROBLEM THIS SOLVES, WHICH ALREADY EXISTS
--
-- core.control_result rows are the repo's evidence artifact: a control that
-- leaves no row is indistinguishable from a control that never ran. But there
-- has never been anything on the row saying WHERE it came from, and
-- analytics/seed.sh drives the deployed API specifically to "trip every
-- control", while the e2e harness fires 159 live assertions at the same tables.
-- So the evidence table is already a mixture of real gate decisions, demo
-- seeding and test assertions, with nothing telling them apart.
--
-- That is worse than an empty table. An empty table is honestly empty.
--
-- WHY A COLUMN ALONE IS NOT ENOUGH
--
-- A `provenance` column plus "the coverage query must filter on it" is
-- discipline. One forgotten WHERE clause silently re-contaminates the claim,
-- and nothing fails loudly when it happens. So simulated evidence lives in a
-- SEPARATE SCHEMA, and the check constraints below make the separation
-- structural in both directions:
--
--   core.*  CHECK provenance IN ('production','unknown')   -- 'simulated' is
--                                                             NOT REPRESENTABLE
--   sim.*   CHECK provenance = 'simulated'
--
-- A simulated control_result cannot be written into core even deliberately —
-- not by a bug, not by a forgotten parameter, not by a human at a psql prompt.
-- A query against core cannot see simulated evidence because it is not there.
--
-- WHY THE DEFAULT IS 'unknown' AND NOT 'production'
--
-- Fail-safe direction. A writer that forgets to stamp provenance produces a row
-- that does not count toward coverage, which under-claims. Defaulting to
-- 'production' would mean every forgotten stamp silently over-claims, which is
-- the exact failure this migration exists to prevent.

-- ------------------------------------------------------- provenance on core
--
-- No backfill statement is needed: the DEFAULT applies to existing rows as the
-- column is added, so everything already written becomes 'unknown'. That is
-- deliberate and is the only truthful classification available. Those rows were
-- produced by an unrecorded mix of real calls, seed.sh and the e2e harness;
-- marking them 'production' would be a fabrication and marking them 'simulated'
-- would be an equally unfounded guess. The count of 'unknown' rows is reported
-- by scripts/build_crosswalk.py rather than hidden — it is the honest statement
-- that evidence written before this migration cannot support a coverage claim.

do $$
declare t text;
begin
  foreach t in array array[
    'control_result', 'bsa_alert', 'event', 'case', 'bookkeeping_entry', 'filing'
  ] loop
    execute format(
      'alter table "core".%I add column if not exists "provenance" text not null default ''unknown''', t);
    execute format(
      'alter table "core".%I drop constraint if exists %I', t, 'ck_' || t || '_provenance');
    execute format(
      'alter table "core".%I add constraint %I check ("provenance" in (''production'', ''unknown''))',
      t, 'ck_' || t || '_provenance');
  end loop;
end $$;

comment on column "core"."control_result"."provenance" is
  'production | unknown. ''simulated'' is deliberately not permitted here — simulated evidence lives in the sim schema and cannot be represented in core.';

-- ------------------------------------------------------------- immutability
--
-- Provenance is a claim about where a row came from, which cannot change after
-- the fact. Without this an UPDATE could relabel simulated-era rows as
-- production, which is precisely the laundering the separation exists to stop.
create or replace function "core"."forbid_provenance_update"()
returns trigger language plpgsql as $$
begin
  if new."provenance" is distinct from old."provenance" then
    raise exception
      'provenance is immutable (% -> %): a row cannot change where it came from',
      old."provenance", new."provenance";
  end if;
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'control_result', 'bsa_alert', 'event', 'case', 'bookkeeping_entry', 'filing'
  ] loop
    execute format('drop trigger if exists "freeze_provenance" on "core".%I', t);
    execute format(
      'create trigger "freeze_provenance" before update on "core".%I
         for each row execute function "core"."forbid_provenance_update"()', t);
  end loop;
end $$;

-- --------------------------------------------------------------- sim schema
--
-- Mirrors of the evidence tables for simulated subsystems (the TDD substrate).
-- Same column shapes so one control implementation can be pointed at either
-- schema — if sim used a different shape we would be testing sim-specific code
-- and shipping something else, which is how simulation harnesses stop proving
-- anything.
create schema if not exists "sim";

comment on schema "sim" is
  'Simulated evidence for control TDD. Structurally separate from core: a coverage query against core cannot see these rows. Never counts toward regulatory coverage.';

create table if not exists "sim"."control_result" (like "core"."control_result" including defaults including indexes);
create table if not exists "sim"."bsa_alert"     (like "core"."bsa_alert"     including defaults including indexes);
create table if not exists "sim"."event"         (like "core"."event"         including defaults including indexes);
create table if not exists "sim"."case"          (like "core"."case"          including defaults including indexes);

-- The mirror of the core constraint, inverted. Together the two make the
-- separation total: 'simulated' only in sim, never 'simulated' in core.
do $$
declare t text;
begin
  foreach t in array array['control_result', 'bsa_alert', 'event', 'case'] loop
    execute format(
      'alter table "sim".%I alter column "provenance" set default ''simulated''', t);
    execute format(
      'alter table "sim".%I drop constraint if exists %I', t, 'ck_' || t || '_provenance');
    execute format(
      'alter table "sim".%I add constraint %I check ("provenance" = ''simulated'')',
      t, 'ck_sim_' || t || '_provenance');
    execute format('drop trigger if exists "freeze_provenance" on "sim".%I', t);
    execute format(
      'create trigger "freeze_provenance" before update on "sim".%I
         for each row execute function "core"."forbid_provenance_update"()', t);
  end loop;
end $$;

-- ------------------------------------------------- the case chain (BSA-06/07)
--
-- core.case has been fully shaped since the first migration — status machine,
-- type, sar_decision_timer, evidence, summary — and has never had a writer, so
-- every alert the gate raises has been a dead end. These columns complete the
-- chain the catalogue describes: alert -> triage -> case -> SAR decision.
alter table "core"."bsa_alert"
  add column if not exists "triage_due_at" timestamptz,
  add column if not exists "triaged_at" timestamptz,
  add column if not exists "triage_outcome" text,
  add column if not exists "case_id" text;

alter table "core"."bsa_alert"
  drop constraint if exists "ck_bsa_alert_triage_outcome";
alter table "core"."bsa_alert"
  add constraint "ck_bsa_alert_triage_outcome"
  check ("triage_outcome" is null or "triage_outcome" in ('resolved', 'escalated'));

comment on column "core"."bsa_alert"."triage_due_at" is
  'BSA-06: alerts are triaged within 2 business days of creation. A NULL triaged_at past this instant is an overdue alert — the negative case the timer sweep exists to surface.';

alter table "core"."case"
  add column if not exists "alert_id" text,
  add column if not exists "opened_at" timestamptz,
  add column if not exists "sar_decision_due_at" timestamptz,
  add column if not exists "decided_at" timestamptz,
  add column if not exists "sar_decision" text,
  add column if not exists "decision_rationale" text;

alter table "core"."case" drop constraint if exists "ck_case_sar_decision";
alter table "core"."case"
  add constraint "ck_case_sar_decision"
  check ("sar_decision" is null or "sar_decision" in ('file', 'no_file'));

comment on column "core"."case"."sar_decision" is
  'BSA-07: file | no_file. A no_file decision REQUIRES a rationale — do-not-file decisions must be documented and retained, so an undocumented one is refused rather than stored.';

-- The alert -> case link the investigator needs. Not an FK to core.case because
-- sim.case is a legitimate target under the same code path.
create index if not exists "idx_bsa_alert_case_id" on "core"."bsa_alert" ("case_id");
create index if not exists "idx_case_alert_id" on "core"."case" ("alert_id");

-- Partial indexes for the two timer sweeps: both scan for the OVERDUE tail, so
-- the index only needs to cover rows that have not yet been resolved.
create index if not exists "idx_bsa_alert_triage_overdue"
  on "core"."bsa_alert" ("triage_due_at")
  where "triaged_at" is null;
create index if not exists "idx_case_decision_overdue"
  on "core"."case" ("sar_decision_due_at")
  where "decided_at" is null;

-- --------------------------------------------------------------- sim grants
grant usage on schema "sim" to "service_role";
grant all privileges on all tables in schema "sim" to "service_role";
alter default privileges in schema "sim" grant all on tables to "service_role";

-- Deliberately NOT granted to anon/authenticated. Simulated evidence has no
-- audience outside the test substrate.

notify pgrst, 'reload schema';
