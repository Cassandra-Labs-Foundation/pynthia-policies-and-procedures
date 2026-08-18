-- Give `pending_resync` a watcher — follow-up to 20260817000300.
--
-- That migration made the metric honest but left it passive: it sat in the
-- /fbo response and nothing looked at it. A freshness guarantee nobody is
-- watching is a freshness hope, and the FBO position now depends on it.
--
-- THE THRESHOLD IS THE WHOLE DESIGN. Alerting on `pending_resync > 0` would
-- fire on every normal money movement, because an account is legitimately
-- pending for up to one reconciler cycle (5 minutes) before the sweep reaches
-- it. That is the same alarm-on-84%-of-rows mistake 20260817000300 was written
-- to correct, and repeating it one migration later would be embarrassing.
--
-- What is abnormal is a movement that has been pending LONGER than the
-- reconciler needed to clear it. `stale_after` (health's existing knob,
-- default 10 minutes) is two full cycles, so by then the sweep has had
-- multiple chances and something is actually wrong: the priority query is
-- erroring, Blnk is refusing that balance, or the function is down.

-- Add the age of the oldest unresolved movement, which is what the alarm keys
-- on. `pending_resync` alone cannot distinguish "moved 4 seconds ago" from
-- "moved yesterday and never recovered", and only the second is an incident.
create or replace function "aggregator".fbo_mirror_staleness(p_instance text)
returns jsonb language sql stable as $$
  with pending as (
    select q."last_move"
    from "core".accounts_pending_resync(100000) q
    join "core"."account" a on a."id" = q."id"
    join "core"."partner" p on p."id" = a."partner_id"
    where p."instance_id" = p_instance
  )
  select jsonb_build_object(
    'instance_id', p_instance,
    'accounts', (select count(*) from "core"."account" a
                   join "core"."partner" p on p."id" = a."partner_id"
                  where p."instance_id" = p_instance
                    and coalesce(a."status", '') <> 'closed'),
    'pending_resync', (select count(*) from pending),
    -- Seconds since the OLDEST movement still waiting on a mirror refresh.
    -- null = nothing pending. This is the alarm's input.
    'pending_age_seconds',
      (select extract(epoch from now() - min("last_move"))::bigint from pending),
    'oldest_sync', (select min(a."balance_synced_at") from "core"."account" a
                      join "core"."partner" p on p."id" = a."partner_id"
                     where p."instance_id" = p_instance
                       and coalesce(a."status", '') <> 'closed'),
    'never_synced', (select count(*) from "core"."account" a
                       join "core"."partner" p on p."id" = a."partner_id"
                      where p."instance_id" = p_instance
                        and coalesce(a."status", '') <> 'closed'
                        and a."balance_synced_at" is null)
  )
$$;

comment on function "aggregator".fbo_mirror_staleness(text) is
  'Whether the FBO roll-up is behind the ledger. `pending_resync` counts '
  'accounts that MOVED since their mirror was synced; `pending_age_seconds` '
  'is how long the oldest of them has waited, and is what aggregator.health() '
  'alarms on. `oldest_sync` is context, not an alarm: an account that has not '
  'transacted has a correct mirror however old its timestamp.';

-- health() now covers both things the position depends on: the consumers that
-- feed the event stream, and the balance mirror the position is summed from.
create or replace function "aggregator".health(stale_after interval default interval '10 minutes')
returns jsonb language plpgsql as $$
declare
  tip bigint;
  last_arrival timestamptz;
  consumers jsonb;
  mirrors jsonb;
  c record;
  m record;
  st jsonb;
begin
  select coalesce(max(sequence_id), 0), max(received_at)
    into tip, last_arrival from "aggregator"."event";

  consumers := '[]'::jsonb;
  for c in select consumer, last_seq, updated_at from "aggregator"."consumer_cursor" loop
    if tip > c.last_seq and now() - c.updated_at > stale_after then
      insert into "aggregator"."alert"
        ("event_id", "alert_type", "instance_id", "details")
      values ('stall_' || c.consumer || '_' || to_char(now(), 'YYYYMMDDHH24'),
              'consumer_stalled', null,
              format('%s stalled: cursor %s of %s, idle since %s',
                     c.consumer, c.last_seq, tip, c.updated_at))
      on conflict ("event_id", "alert_type") do nothing;
    end if;
    consumers := consumers || jsonb_build_object(
      'consumer', c.consumer, 'lag', tip - c.last_seq,
      'idle_seconds', extract(epoch from now() - c.updated_at)::bigint,
      'stalled', tip > c.last_seq and now() - c.updated_at > stale_after);
  end loop;

  -- The FBO roll-up is the sum of core.account.balance, so a mirror the
  -- reconciler has failed to refresh IS the position being wrong. Same hourly
  -- dedup bucket as the consumer stall, and keyed per instance because that is
  -- the grain a position has.
  mirrors := '[]'::jsonb;
  for m in select "instance_id" from "aggregator"."fbo_position" loop
    st := "aggregator".fbo_mirror_staleness(m.instance_id);
    if (st->>'pending_age_seconds') is not null
       and (st->>'pending_age_seconds')::bigint > extract(epoch from stale_after) then
      insert into "aggregator"."alert"
        ("event_id", "alert_type", "instance_id", "details")
      values ('fbomirror_' || m.instance_id || '_' || to_char(now(), 'YYYYMMDDHH24'),
              'fbo_mirror_stale', m.instance_id,
              format('%s: %s account(s) moved but unsynced for %ss — the FBO '
                     'position is understating or overstating by their delta',
                     m.instance_id, st->>'pending_resync', st->>'pending_age_seconds'))
      on conflict ("event_id", "alert_type") do nothing;
    end if;
    mirrors := mirrors || jsonb_build_object(
      'instance_id', m.instance_id,
      'pending_resync', (st->>'pending_resync')::bigint,
      'pending_age_seconds', (st->>'pending_age_seconds')::bigint,
      'stale', (st->>'pending_age_seconds') is not null
               and (st->>'pending_age_seconds')::bigint > extract(epoch from stale_after));
  end loop;

  return jsonb_build_object(
    'tip_sequence', tip,
    'last_ingest_at', last_arrival,
    'ingest_gap_seconds',
      case when last_arrival is null then null
           else extract(epoch from now() - last_arrival)::bigint end,
    'consumers', consumers,
    'mirrors', mirrors);
end $$;

notify pgrst, 'reload schema';
