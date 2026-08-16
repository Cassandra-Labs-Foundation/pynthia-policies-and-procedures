-- Aggregator spanning views (card 62): one query surface over hot Postgres
-- and cold Parquet. Loaded by the reporter jobs (and duck.sh users who .read
-- it) AFTER at least one archive run exists — read_parquet errors on an
-- empty glob, and that error is correct: querying "the archive" before an
-- archive exists should be loud, not an empty result.
--
-- The watermark is the partition line. Cold serves sequence_id <= watermark
-- from Parquet; hot serves sequence_id > watermark from Postgres. Rows still
-- physically present in Postgres at/below the watermark are deliberately NOT
-- read from there — every event has exactly one serving tier, so a count over
-- agg_events_all can never double-count.

create or replace view agg_events_cold as
select sequence_id, event_id, instance_id, code, entity_hash,
       payload, schema_version, received_at, 'cold' as tier
from read_parquet('analytics/archive/*.parquet');

create or replace view agg_events_hot as
select e.sequence_id, e.event_id, e.instance_id, e.code, e.entity_hash,
       cast(e.payload as varchar) as payload, e.schema_version, e.received_at,
       'hot' as tier
from pg.aggregator.event e
where e.sequence_id > (select archived_through from pg.aggregator.archive_watermark);

create or replace view agg_events_all as
select * from agg_events_cold
union all
select * from agg_events_hot;

-- The money-event filter the consumers use, mirrored for analytics. The
-- canonical set is the spec: x-events entries marked `x-money: true` in
-- core/core-api.yaml. scripts/check_money_codes.py (in the rebuild cascade)
-- goes red if this list or aggregator.is_money_code drifts from it — edit
-- the spec first, then both copies.
create or replace view agg_money_events as
select *, cast(json_extract_string(payload, '$.amount_cents') as bigint) as amount_cents
from agg_events_all
where code in ('transfer.settled', 'wire_transfer.completed',
               'ach_transfer.settled', 'card_authorization.captured',
               'ach_pull.settled')
  and json_extract_string(payload, '$.amount_cents') is not null;

-- The FBO position model, mirrored for analytics. SEPARATE from the money
-- filter above on purpose: `x-money` answers "did money move, does BSA care"
-- (it drives CTR and structuring detection), while `x-fbo` answers "how does
-- an instance's FBO position move". `transfer.settled` is money but nets to
-- zero inside one fintech's FBO; the return codes are not new reportable
-- transactions but they DO credit the position back.
--
-- The canonical set is the spec: x-events entries carrying `x-fbo`, mirrored
-- into aggregator.fbo_delta and into this view. scripts/check_money_codes.py
-- (in the rebuild cascade) goes red if any of the three drift — edit the spec
-- first, then both copies.
create or replace view agg_fbo_events as
select *,
       cast(json_extract_string(payload, '$.amount_cents') as bigint) as amount_cents,
       case
         when code in ('ach_transfer.settled', 'wire_transfer.completed',
                       'card_authorization.captured') then -1
         when code in ('ach_transfer.returned', 'wire_transfer.returned',
                       'ach_pull.settled', 'fbo_funding.settled') then 1
         else 0
       end as fbo_delta
from agg_events_all
where code in ('ach_transfer.settled', 'wire_transfer.completed',
               'card_authorization.captured',
               'ach_transfer.returned', 'wire_transfer.returned',
               'ach_pull.settled', 'fbo_funding.settled')
  and json_extract_string(payload, '$.amount_cents') is not null;
