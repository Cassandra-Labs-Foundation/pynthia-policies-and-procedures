-- Card 51 — the aggregator's event store (D4 / D21 / D27).
--
-- DEPLOYMENT NOTE: in production the aggregator is its OWN Supabase project
-- (D25), not a schema inside a fintech instance. It lives in this migration
-- chain so the boundary is testable and CI applies it, but shipping it means
-- running this file against the aggregator project and NOT against instances.
-- Keeping it in a separate `aggregator` schema rather than `core` makes that
-- split mechanical rather than a matter of remembering.

create schema if not exists "aggregator";

-- Append-only, per D4 (PostgreSQL event log replacing Kafka).
create table if not exists "aggregator"."event" (
  "sequence_id" bigserial primary key,
  -- The instance's own event id. UNIQUE is what makes at-least-once delivery
  -- from the instance outbox safe: a redelivered event collides and is
  -- ignored rather than double-counted by the four consumers (D27).
  "event_id" text not null unique,
  -- Written from the VERIFIED JWT claims, never from the request body — a body
  -- field would let one instance write events attributed to another.
  "instance_id" text not null,
  "code" text,
  "resource_id" text,
  -- D21: per-entity ordering. Each entity lives in exactly one instance (D23),
  -- so an entity's events arrive from one outbox in sequence.
  "entity_hash" text,
  "payload" jsonb not null default '{}',
  "received_at" timestamptz not null default now()
);

comment on table "aggregator"."event" is
  'D4/D21: append-only cross-instance event log. event_id UNIQUE provides dedup for at-least-once outbox delivery.';
comment on column "aggregator"."event"."instance_id" is
  'Source instance, taken from the verified instance JWT — never from the request body (D23 cross-contamination guard).';

-- Consumers read with independent cursors (D27), so both orderings matter:
-- global sequence for the cursor sweep, per-entity for ordered replay.
create index if not exists "idx_aggregator_event_instance"
  on "aggregator"."event" ("instance_id", "sequence_id");
create index if not exists "idx_aggregator_event_entity"
  on "aggregator"."event" ("entity_hash", "sequence_id")
  where "entity_hash" is not null;

alter table "aggregator"."event" enable row level security;

grant usage on schema "aggregator" to "service_role";
grant all privileges on all tables in schema "aggregator" to "service_role";
grant all privileges on all sequences in schema "aggregator" to "service_role";
alter default privileges in schema "aggregator" grant all on tables to "service_role";
alter default privileges in schema "aggregator" grant all on sequences to "service_role";

notify pgrst, 'reload schema';
