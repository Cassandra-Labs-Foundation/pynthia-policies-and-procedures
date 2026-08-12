-- TODO §7 items 3+4 — parameterize the BSA thresholds; make archived rows
-- physically prunable.
--
-- PART 1: the $10,000 CTR line, the 24h structuring hot window, and the
-- 90-day lookback horizon were hardcoded in three places (run_bsa_approver
-- here, bsa_reporter.sh in analytics, and prose). They become rows in
-- aggregator.parameter — the VALUES do not change in this migration; only
-- where they live. Changing one is now an UPDATE a human signs off on
-- (TODO §3's institution-parameter territory), not a code hunt.
--
-- PART 2: 20260720000500 said "physical pruning is a later card" — this is
-- the card. The rule: a row may leave Postgres only when it is BOTH
--   (a) at/below every horizon that still reads hot rows:
--       - the archive watermark (the spanning view serves <= watermark
--         from Parquet, so the hot copy is unreachable by queries),
--       - every consumer cursor (a lagging consumer must never have rows
--         pruned out from under its sweep),
--       - the caller-supplied committed_through bound (analytics/prune.sh
--         passes the max sequence covered by Parquet files actually
--         committed to git — the archive of record must HOLD the row
--         before Postgres lets go of it), and
--   (b) older than keep_hours (default 72): run_bsa_approver's structuring
--       branch re-reads already-processed rows by entity_hash over a 24h
--       window, so recent rows stay hot regardless of sequence.
--
-- The append-only trigger stays: UPDATE is refused unconditionally, forever
-- — history that can be edited is not history. DELETE is refused too except
-- inside aggregator.prune_archived, which flags the session via a local GUC
-- for exactly the statement it runs. Pruning is not editing history: the
-- history lives on in git-committed Parquet, which is the archive of record
-- (versioned, tamper-evident) precisely so the hot store can shed it.

-- ------------------------------------------------------------- parameters
create table if not exists "aggregator"."parameter" (
  "name" text primary key,
  "value" bigint not null,
  "description" text,
  "updated_at" timestamptz not null default now()
);

insert into "aggregator"."parameter" ("name", "value", "description") values
  ('ctr_threshold_cents', 1000000,
   'BSA/CTR reporting line (31 CFR 1010.311): single money event at/above this triggers a ctr_threshold alert; sub-threshold aggregation measures against it too.'),
  ('structuring_hot_window_hours', 24,
   'Hot-tier window run_bsa_approver aggregates sub-threshold events over, per entity_hash.'),
  ('structuring_lookback_days', 90,
   'Horizon of the scheduled BSA reporter lookback (analytics/bsa_reporter.sh) across hot+cold tiers.')
on conflict ("name") do nothing;

comment on table "aggregator"."parameter" is
  'BSA/reporting parameters, single-sourced: run_bsa_approver and analytics/bsa_reporter.sh read these instead of hardcoded constants. Values are institution decisions (TODO §3) — change by UPDATE, not by migration.';

-- Loud on a missing name: a typo'd parameter must fail the consumer, not
-- quietly default.
create or replace function "aggregator".param(p_name text) returns bigint
language plpgsql stable as $$
declare v bigint;
begin
  select "value" into v from "aggregator"."parameter" where "name" = p_name;
  if v is null then
    raise exception 'aggregator.param(%): no such parameter', p_name;
  end if;
  return v;
end $$;

-- ------------------------------------------ run_bsa_approver, parameterized
-- Byte-identical logic to 20260720000400 except the three constants now come
-- from aggregator.parameter (values unchanged: 1000000 / 24h).
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
  threshold bigint := "aggregator".param('ctr_threshold_cents');
  hot_window interval := make_interval(hours => "aggregator".param('structuring_hot_window_hours')::integer);
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

      if amount >= threshold then
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
          and e.received_at > r.received_at - hot_window
          and "aggregator".is_money_code(e.code)
          and (e.payload ? 'amount_cents')
          and (e.payload->>'amount_cents')::bigint < threshold;
        if agg >= threshold then
          insert into "aggregator"."alert"
            ("event_id", "alert_type", "instance_id", "entity_hash",
             "requires_lookback", "details")
          values (r.event_id, 'structuring', r.instance_id, r.entity_hash, true,
                  format('sub-threshold aggregate reached %s cents in %s; scheduled lookback owed', agg, hot_window))
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

-- ------------------------------------------------------------------ prune
-- The trigger keeps refusing UPDATE unconditionally. DELETE passes only when
-- the session GUC aggregator.allow_prune is 'on' — set LOCAL by
-- prune_archived for its one statement, never by anything else.
create or replace function "aggregator".forbid_mutation() returns trigger
language plpgsql as $$
begin
  if TG_OP = 'DELETE'
     and current_setting('aggregator.allow_prune', true) = 'on' then
    return OLD;
  end if;
  raise exception 'aggregator.event is append-only (card 55): % refused', TG_OP;
end $$;

create or replace function "aggregator".prune_archived(
  committed_through bigint,
  keep_hours integer default 72
) returns jsonb language plpgsql as $$
declare
  bound bigint;
  watermark bigint;
  min_cursor bigint;
  removed bigint;
begin
  select archived_through into watermark from "aggregator"."archive_watermark";
  select coalesce(min(last_seq), 0) into min_cursor from "aggregator"."consumer_cursor";
  bound := least(committed_through, watermark, min_cursor);

  perform set_config('aggregator.allow_prune', 'on', true);  -- local: this txn only
  delete from "aggregator"."event"
    where sequence_id <= bound
      and received_at < now() - make_interval(hours => keep_hours);
  get diagnostics removed = row_count;
  perform set_config('aggregator.allow_prune', 'off', true);

  return jsonb_build_object(
    'pruned', removed, 'bound', bound,
    'committed_through', committed_through,
    'watermark', watermark, 'min_cursor', min_cursor,
    'keep_hours', keep_hours);
end $$;

comment on function "aggregator".prune_archived(bigint, integer) is
  'Deletes hot rows already served by the cold tier. Bound = least(git-committed parquet coverage, archive watermark, min consumer cursor); rows younger than keep_hours stay for the approver''s hot-window aggregation. Called by analytics/prune.sh after the workflow commits parquet.';

notify pgrst, 'reload schema';
