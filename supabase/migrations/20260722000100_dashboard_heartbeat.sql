-- The monitoring tier's aggregations. The dashboard's job is to show a
-- HEARTBEAT per control — every event each control produced, bucketed over
-- time, clickable down to the raw payload — so the compliance team runs the
-- day on it and an examiner can audit any control by reading its history.
--
-- PostgREST cannot GROUP BY, so the bucketing lives here as three stable SQL
-- functions. Both provenance worlds are returned, LABELED, never merged:
-- core.* is production evidence, sim.* is the drill's simulated evidence
-- (the structural split from 20260719000900). A dashboard that hid the sim
-- world would hide the violation drills that prove the controls fire; one
-- that mixed the worlds would launder simulation into production claims.

-- The stream route filters .in(code) and orders by created_at; the heartbeat
-- groups by code over a window. Same composite index serves both.
create index if not exists "idx_event_code_created" on "core"."event" ("code", "created_at");
create index if not exists "idx_sim_event_code_created" on "sim"."event" ("code", "created_at");
create index if not exists "idx_event_resource" on "core"."event" ("resource_id");
create index if not exists "idx_sim_event_resource" on "sim"."event" ("resource_id");
create index if not exists "idx_control_result_subject" on "core"."control_result" ("subject_ref");

-- One row per (world, event code, time bucket): the pulse itself.
create or replace function "core"."event_heartbeat"(
  "since" timestamptz,
  "bucket_seconds" integer
) returns table ("src" text, "code" text, "bucket" timestamptz, "n" bigint)
language sql stable as $$
  select 'core', e."code",
         to_timestamp(floor(extract(epoch from e."created_at") / "bucket_seconds") * "bucket_seconds"),
         count(*)
    from "core"."event" e
   where e."created_at" >= "since" and e."code" is not null
   group by 2, 3
  union all
  select 'sim', e."code",
         to_timestamp(floor(extract(epoch from e."created_at") / "bucket_seconds") * "bucket_seconds"),
         count(*)
    from "sim"."event" e
   where e."created_at" >= "since" and e."code" is not null
   group by 2, 3
   order by 3, 2, 1
   limit 100000
$$;

-- The money-movement gate's own pulse: control_result rows by control and
-- decision. The gate controls (CG-*) have no produced_events in the
-- catalogue — their evidence table IS this one.
create or replace function "core"."gate_heartbeat"(
  "since" timestamptz,
  "bucket_seconds" integer
) returns table ("src" text, "control_id" text, "decision" text, "bucket" timestamptz, "n" bigint)
language sql stable as $$
  select 'core', r."control_id", r."decision",
         to_timestamp(floor(extract(epoch from r."created_at") / "bucket_seconds") * "bucket_seconds"),
         count(*)
    from "core"."control_result" r
   where r."created_at" >= "since" and r."control_id" is not null
   group by 2, 3, 4
  union all
  select 'sim', r."control_id", r."decision",
         to_timestamp(floor(extract(epoch from r."created_at") / "bucket_seconds") * "bucket_seconds"),
         count(*)
    from "sim"."control_result" r
   where r."created_at" >= "since" and r."control_id" is not null
   group by 2, 3, 4
   order by 4, 2, 1
   limit 100000
$$;

-- Unwindowed on purpose: "this control has NEVER produced evidence" and
-- "this control went silent three weeks ago" are different findings, and a
-- windowed query cannot tell them apart.
create or replace function "core"."event_last_seen"()
returns table ("src" text, "code" text, "last_at" timestamptz, "total" bigint)
language sql stable as $$
  select 'core', e."code", max(e."created_at"), count(*)
    from "core"."event" e
   where e."code" is not null
   group by 2
  union all
  select 'sim', e."code", max(e."created_at"), count(*)
    from "sim"."event" e
   where e."code" is not null
   group by 2
   order by 2, 1
$$;

grant execute on function "core"."event_heartbeat"(timestamptz, integer) to service_role;
grant execute on function "core"."gate_heartbeat"(timestamptz, integer) to service_role;
grant execute on function "core"."event_last_seen"() to service_role;

notify pgrst, 'reload schema';
