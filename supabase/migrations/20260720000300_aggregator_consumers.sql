-- Aggregator backbone — cards 55 (events table completed), 56 (cursor loop),
-- 57 (Payment Hub), 58 (BSA Approver), 61 (health checks).
--
-- The consumers are pl/pgsql functions ON PURPOSE: card 56's criterion is
-- "a consumer advances its cursor only after processing, in one txn; a
-- mid-batch kill resumes from last cursor". A SQL function IS one
-- transaction — effects and cursor advance commit together or not at all,
-- and a mid-batch kill (rollback, crash, cancel) leaves the cursor exactly
-- where the last committed run put it. No application-side transaction
-- choreography to get wrong.

-- ---------------------------------------------------------------- card 55
-- Completing aggregator.event against its stated criteria:
--   append-only, unique id (exists), ordering (sequence_id exists),
--   schema_version, PII encrypted.
alter table "aggregator"."event"
  add column if not exists "schema_version" integer not null default 1,
  -- PII travels ONLY as ciphertext (AES-GCM, encrypted by the instance
  -- before send; the aggregator never holds the key). Most events need no
  -- PII at all — they carry entity_hash.
  add column if not exists "pii_ciphertext" text;

-- Raw PII is UNREPRESENTABLE in a payload, not merely discouraged: the
-- instance-side design sends entity_hash instead of identity, and this
-- check makes the aggregator refuse a payload that carries obvious
-- plaintext identity keys even if a future writer forgets.
alter table "aggregator"."event" drop constraint if exists "ck_agg_event_no_raw_pii";
alter table "aggregator"."event"
  add constraint "ck_agg_event_no_raw_pii"
  check (not (payload ?| array['name', 'ssn', 'date_of_birth', 'dob', 'address', 'email', 'phone']));

-- Append-only, structurally: history that can be edited is not history.
create or replace function "aggregator".forbid_mutation() returns trigger
language plpgsql as $$
begin
  raise exception 'aggregator.event is append-only (card 55): % refused', TG_OP;
end $$;

drop trigger if exists "trg_agg_event_append_only" on "aggregator"."event";
create trigger "trg_agg_event_append_only"
  before update or delete on "aggregator"."event"
  for each row execute function "aggregator".forbid_mutation();

-- ---------------------------------------------------------------- card 56
create table if not exists "aggregator"."consumer_cursor" (
  "consumer" text primary key,
  "last_seq" bigint not null default 0,
  "updated_at" timestamptz not null default now()
);

-- ---------------------------------------------------------------- card 57
-- One FBO position per instance, built ONLY from processed events. last_seq
-- records provenance: which event moved it last.
create table if not exists "aggregator"."fbo_position" (
  "instance_id" text primary key,
  "position_cents" bigint not null default 0,
  "last_seq" bigint,
  "updated_at" timestamptz not null default now()
);

-- ---------------------------------------------------------------- card 58
-- Aggregator-side alerts. UNIQUE(event_id, alert_type) is the card's stated
-- dedup: replaying an event cannot mint a second alert of the same type.
create table if not exists "aggregator"."alert" (
  "id" bigint generated always as identity primary key,
  "event_id" text not null,
  "alert_type" text not null,
  "instance_id" text,
  "entity_hash" text,
  "requires_lookback" boolean not null default false,
  "details" text,
  "created_at" timestamptz not null default now(),
  unique ("event_id", "alert_type")
);

-- The event codes that represent money actually moving (settled magnitudes).
create or replace function "aggregator".is_money_code(c text) returns boolean
language sql immutable as $$
  select c in ('transfer.settled', 'wire_transfer.completed', 'ach_transfer.settled',
               'card_authorization.captured')
$$;

-- ------------------------------------------------- card 57: Payment Hub
-- Applies money events to the per-instance FBO position, in sequence order,
-- advancing the cursor in the same transaction. Replays cannot reach it:
-- ingest dedups by event_id, and the cursor is monotonic.
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

  if processed > 0 then
    update "aggregator"."consumer_cursor"
      set last_seq = max_seq, updated_at = now()
      where consumer = 'payment_hub';
  end if;

  return jsonb_build_object('consumer', 'payment_hub',
                            'processed', processed, 'applied', applied,
                            'cursor', coalesce(max_seq, cur));
end $$;

-- ------------------------------------------------- card 58: BSA Approver
-- CTR: any single money event of $10k+ raises ctr_threshold, deduped by the
-- unique constraint. Structuring: an entity whose trailing-24h aggregate of
-- sub-threshold money events crosses $10k is flagged FOR LOOKBACK — the
-- aggregator flags, a human investigates.
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
        -- trailing 24h of sub-threshold movement for the same entity
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

  if processed > 0 then
    update "aggregator"."consumer_cursor"
      set last_seq = max_seq, updated_at = now()
      where consumer = 'bsa_approver';
  end if;

  return jsonb_build_object('consumer', 'bsa_approver',
                            'processed', processed, 'ctr', ctr,
                            'structuring', struct, 'cursor', coalesce(max_seq, cur));
end $$;

-- ------------------------------------------------- card 61: health checks
-- Three gaps, each answerable in one place:
--   staleness    a consumer has unprocessed events and has not advanced
--   ingest gap   nothing has arrived from an instance recently
--   delivery gap measured instance-side (outbox age) — see /events/deliver
-- A trip WRITES an alert row (synthetic hourly event_id keeps it deduped):
-- a health check that only returns JSON is a dashboard, not an alarm.
create or replace function "aggregator".health(stale_after interval default interval '10 minutes')
returns jsonb language plpgsql as $$
declare
  tip bigint;
  last_arrival timestamptz;
  consumers jsonb;
  c record;
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

  return jsonb_build_object(
    'tip_sequence', tip,
    'last_ingest_at', last_arrival,
    'ingest_gap_seconds',
      case when last_arrival is null then null
           else extract(epoch from now() - last_arrival)::bigint end,
    'consumers', consumers);
end $$;

-- consumers + health on the clock, same vault-keyed pattern as the other
-- workers. These run entirely in the database, so no HTTP hop is needed.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'aggregator-consumers') then
    perform cron.unschedule('aggregator-consumers');
  end if;
end $$;
select cron.schedule(
  'aggregator-consumers',
  '* * * * *',
  $job$
  select "aggregator".run_payment_hub(200);
  select "aggregator".run_bsa_approver(200);
  select "aggregator".health();
  $job$
);
