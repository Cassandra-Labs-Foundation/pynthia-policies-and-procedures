-- Cards 52 / 54 — CU-admin reads and cross-fintech search, aggregator-only.
--
-- Card 52: the credit union oversees every fintech instance, so its admin
-- credential READS across all of them and WRITES nothing. The role lives on
-- the credential row and is minted into the JWT by /auth/token — a client
-- cannot assert it.
--
-- Card 54: a cross-fintech query (by entity_hash — never identity) succeeds
-- HERE and nowhere else. Instance tokens are refused this surface: an
-- instance seeing another instance's activity is exactly the contamination
-- D23 forbids, so the search is cu_admin-only.
alter table "aggregator"."instance_credential"
  add column if not exists "role" text not null default 'instance'
    check ("role" in ('instance', 'cu_admin'));

create or replace function "aggregator".admin_overview()
returns jsonb language sql stable as $$
  select coalesce(jsonb_agg(row_data order by row_data->>'instance_id'), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'instance_id', i.instance_id,
      'position_cents', coalesce(f.position_cents, 0),
      'event_count', coalesce(e.n, 0),
      'last_event_at', e.latest,
      'open_alerts', coalesce(a.n, 0)
    ) as row_data
    -- an instance is visible if it has EITHER events or a position — a
    -- position-only instance (funded, quiet) must not be invisible to its CU
    from (select instance_id from "aggregator"."event"
          union
          select instance_id from "aggregator"."fbo_position") i
    left join "aggregator"."fbo_position" f using (instance_id)
    left join (select instance_id, count(*) n, max(received_at) latest
               from "aggregator"."event" group by 1) e using (instance_id)
    left join (select instance_id, count(*) n
               from "aggregator"."alert" group by 1) a using (instance_id)
  ) rows;
$$;

create or replace function "aggregator".search_entity(p_hash text)
returns jsonb language sql stable as $$
  select jsonb_build_object(
    'entity_hash', p_hash,
    -- per-instance activity: the CROSS-fintech view no single instance holds
    'instances', coalesce((
      select jsonb_agg(jsonb_build_object(
        'instance_id', s.instance_id,
        'event_count', s.n,
        'money_cents', s.cents,
        'first_seen', s.first_seen,
        'last_seen', s.last_seen))
      from (
        select instance_id, count(*) n,
               sum(case when "aggregator".is_money_code(code)
                          and (payload ? 'amount_cents')
                        then (payload->>'amount_cents')::bigint else 0 end) cents,
               min(received_at) first_seen, max(received_at) last_seen
        from "aggregator"."event"
        where entity_hash = p_hash
        group by 1
      ) s), '[]'::jsonb),
    'alerts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'alert_type', alert_type, 'instance_id', instance_id,
        'requires_lookback', requires_lookback, 'created_at', created_at))
      from "aggregator"."alert" where entity_hash = p_hash), '[]'::jsonb),
    'sar_candidates', coalesce((
      select jsonb_agg(jsonb_build_object(
        'instance_id', instance_id, 'window_end', window_end,
        'total_cents', total_cents, 'event_count', event_count))
      from "aggregator"."sar_candidate" where entity_hash = p_hash), '[]'::jsonb)
  );
$$;

notify pgrst, 'reload schema';
