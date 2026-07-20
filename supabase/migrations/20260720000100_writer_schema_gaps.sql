-- Writers vs schema: columns the hermetic fake accepted that real Postgres
-- lacks. The fake stores whatever column an insert hands it, so a writer
-- stamping a column no migration ever declared passes 860 tests and then
-- 500s on first contact with the live database (found when every CTR path
-- failed: raiseAlert stamps event.resource_type). Full static sweep of every
-- .insert/.upsert in the functions found exactly three gaps — closed here.

-- 1. event.resource_type — written by 32 modules (raiseAlert and the whole
--    controls surface), never declared. sim.event was created `like
--    core.event` before this column, so it needs its own add.
alter table "core"."event" add column if not exists "resource_type" text;
alter table "sim"."event"  add column if not exists "resource_type" text;

-- 2. finding.provenance — the evidence-provenance pattern (20260719000900)
--    never reached this table. Same fail-safe default: a forgotten stamp
--    under-claims as 'unknown' rather than over-claiming as 'production'.
alter table "core"."finding"
  add column if not exists "provenance" text not null default 'unknown';
alter table "core"."finding" drop constraint if exists "ck_finding_provenance";
alter table "core"."finding"
  add constraint "ck_finding_provenance"
  check ("provenance" in ('production', 'demo', 'unknown'));

-- 3. verification.method / result / provenance — written by the CIP writer
--    (bsa_program) and the biometric purge path (privacy), never declared.
alter table "core"."verification"
  add column if not exists "method" text,
  add column if not exists "result" text,
  add column if not exists "provenance" text not null default 'unknown';
alter table "core"."verification" drop constraint if exists "ck_verification_provenance";
alter table "core"."verification"
  add constraint "ck_verification_provenance"
  check ("provenance" in ('production', 'demo', 'unknown'));

-- sim mirrors the sim-schema convention missed entirely (writers use
-- db.schema(scope) on both tables). LIKE copies no check constraints, so the
-- simulated-only rule is re-added explicitly, same as 20260719000900.
create table if not exists "sim"."finding"
  (like "core"."finding" including defaults including indexes);
create table if not exists "sim"."verification"
  (like "core"."verification" including defaults including indexes);

alter table "sim"."finding" alter column "provenance" set default 'simulated';
alter table "sim"."finding" drop constraint if exists "ck_finding_provenance";
alter table "sim"."finding"
  add constraint "ck_finding_provenance" check ("provenance" = 'simulated');

alter table "sim"."verification" alter column "provenance" set default 'simulated';
alter table "sim"."verification" drop constraint if exists "ck_verification_provenance";
alter table "sim"."verification"
  add constraint "ck_verification_provenance" check ("provenance" = 'simulated');
