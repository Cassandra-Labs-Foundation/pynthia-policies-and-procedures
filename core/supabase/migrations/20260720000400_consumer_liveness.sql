-- Consumer liveness — the card-18 lesson, third appearance.
--
-- The first consumer deployment only touched consumer_cursor.updated_at when
-- it processed events, so a caught-up consumer's timestamp aged while idle
-- and the FIRST event to arrive after a quiet spell made health() flag it
-- stalled instantly (observed live within minutes of deploy: lag 1, "idle"
-- 687s, alert fired — while the cron was running fine every minute).
--
-- Same principle as the reconciler's touchSynced and the outbox rotation:
-- a run that examined the queue and found nothing IS evidence of liveness,
-- and must say so. updated_at now means "last ran", not "last advanced";
-- last_seq alone carries progress.

create or replace function "aggregator".run_payment_hub(batch integer default 100)
returns jsonb language plpgsql as $$
declare
  cur bigint;
  processed integer := 0;
  applied integer := 0;
  max_seq bigint;
  r record;
begin
  insert into "aggregator"."consumer_cursor" ("consumer") values ('payment_hub')
    on conflict ("consumer") do nothing;
  select last_seq into cur from "aggregator"."consumer_cursor"
    where consumer = 'payment_hub' for update;

  for r in
    select sequence_id, instance_id, code, payload
    from "aggregator"."event"
    where sequence_id > cur
    order by sequence_id
    limit batch
  loop
    processed := processed + 1;
    max_seq := r.sequence_id;
    if "aggregator".is_money_code(r.code) and (r.payload ? 'amount_cents') then
      insert into "aggregator"."fbo_position" as f
        ("instance_id", "position_cents", "last_seq")
      values (r.instance_id, (r.payload->>'amount_cents')::bigint, r.sequence_id)
      on conflict ("instance_id") do update set
        position_cents = f.position_cents + excluded.position_cents,
        last_seq = excluded.last_seq,
        updated_at = now();
      applied := applied + 1;
    end if;
  end loop;

  -- liveness: every run stamps the cursor, advanced or not
  update "aggregator"."consumer_cursor"
    set last_seq = coalesce(max_seq, last_seq), updated_at = now()
    where consumer = 'payment_hub';

  return jsonb_build_object('consumer', 'payment_hub',
                            'processed', processed, 'applied', applied,
                            'cursor', coalesce(max_seq, cur));
end $$;

create or replace function "aggregator".run_bsa_approver(batch integer default 100)
returns jsonb language plpgsql as $$
declare
  cur bigint;
  processed integer := 0;
  ctr integer := 0;
  struct integer := 0;
  max_seq bigint;
  amount bigint;
  agg bigint;
  r record;
begin
  insert into "aggregator"."consumer_cursor" ("consumer") values ('bsa_approver')
    on conflict ("consumer") do nothing;
  select last_seq into cur from "aggregator"."consumer_cursor"
    where consumer = 'bsa_approver' for update;

  for r in
    select sequence_id, event_id, instance_id, code, entity_hash, payload, received_at
    from "aggregator"."event"
    where sequence_id > cur
    order by sequence_id
    limit batch
  loop
    processed := processed + 1;
    max_seq := r.sequence_id;

    if "aggregator".is_money_code(r.code) and (r.payload ? 'amount_cents') then
      amount := (r.payload->>'amount_cents')::bigint;

      if amount >= 1000000 then
        insert into "aggregator"."alert"
          ("event_id", "alert_type", "instance_id", "entity_hash", "details")
        values (r.event_id, 'ctr_threshold', r.instance_id, r.entity_hash,
                format('%s of %s cents crossed the $10k reporting line', r.code, amount))
        on conflict ("event_id", "alert_type") do nothing;
        ctr := ctr + 1;
      elsif r.entity_hash is not null then
        select coalesce(sum((e.payload->>'amount_cents')::bigint), 0) into agg
        from "aggregator"."event" e
        where e.entity_hash = r.entity_hash
          and e.sequence_id <= r.sequence_id
          and e.received_at > r.received_at - interval '24 hours'
          and "aggregator".is_money_code(e.code)
          and (e.payload ? 'amount_cents')
          and (e.payload->>'amount_cents')::bigint < 1000000;
        if agg >= 1000000 then
          insert into "aggregator"."alert"
            ("event_id", "alert_type", "instance_id", "entity_hash",
             "requires_lookback", "details")
          values (r.event_id, 'structuring', r.instance_id, r.entity_hash, true,
                  format('sub-threshold aggregate reached %s cents in 24h; 90-day lookback owed', agg))
          on conflict ("event_id", "alert_type") do nothing;
          struct := struct + 1;
        end if;
      end if;
    end if;
  end loop;

  -- liveness: every run stamps the cursor, advanced or not
  update "aggregator"."consumer_cursor"
    set last_seq = coalesce(max_seq, last_seq), updated_at = now()
    where consumer = 'bsa_approver';

  return jsonb_build_object('consumer', 'bsa_approver',
                            'processed', processed, 'ctr', ctr,
                            'structuring', struct, 'cursor', coalesce(max_seq, cur));
end $$;
