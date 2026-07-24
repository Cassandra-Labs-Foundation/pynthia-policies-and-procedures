-- The gate tier's last-evidence timestamp. Found by driving the dashboard as
-- a compliance officer: every money-movement gate control rendered
-- "LAST EVIDENCE: never" beside a sparkline full of pulses, because
-- event_last_seen indexes EVENT codes and the gate writes no events — its
-- evidence is core.control_result rows. The UI had counts for the gates but
-- no timestamp, hardcoded last_at to null, and ago(null) reads "never".
--
-- A false "never" on the controls that block real money is the exact
-- inversion of the dashboard's promise: an examiner reads "this control has
-- never fired" about the one that fired this morning.
--
-- Same shape as event_last_seen: both worlds, labeled, never merged.
create or replace function "core"."gate_last_seen"()
returns table ("src" text, "control_id" text, "last_at" timestamptz, "total" bigint)
language sql stable as $$
  select 'core', r."control_id", max(r."created_at"), count(*)
    from "core"."control_result" r
   where r."control_id" is not null
   group by 2
  union all
  select 'sim', r."control_id", max(r."created_at"), count(*)
    from "sim"."control_result" r
   where r."control_id" is not null
   group by 2
   order by 2, 1
$$;
grant execute on function "core"."gate_last_seen"() to service_role;

notify pgrst, 'reload schema';
