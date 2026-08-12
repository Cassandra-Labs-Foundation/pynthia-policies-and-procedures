#!/usr/bin/env bash
# Card 59 — BSA Reporter: the scheduled 90-day lookback.
#
# The BSA Approver (card 58) flags sub-threshold aggregates with
# requires_lookback=true but only sees a 24-hour window in hot Postgres.
# This job answers the debt: for every flagged entity it totals sub-threshold
# money movement over the trailing lookback horizon ACROSS BOTH TIERS (hot
# Postgres + cold Parquet, card 62's spanning view) and writes a SAR candidate
# row back to Postgres when the pattern holds at that horizon. The horizon and
# the threshold come from aggregator.parameter (structuring_lookback_days,
# ctr_threshold_cents — 90 / 1000000 as seeded), the same rows
# run_bsa_approver reads, so the approver and the reporter cannot disagree.
#
# Idempotent by UNIQUE(entity_hash, window_end): one candidate per entity per
# run-day, enforced both by the anti-join here and the table constraint.
# Scheduled via .github/workflows/aggregator-reporters.yml (daily) and
# runnable on demand — the harness runs it directly.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f .env.local ]; then set -a; source .env.local; set +a; fi
: "${SUPABASE_DB_URL:?SUPABASE_DB_URL not set — add the session-pooler URI to .env.local}"

duckdb -cmd "INSTALL postgres; LOAD postgres; INSTALL json; LOAD json;" \
  -cmd "ATTACH '${SUPABASE_DB_URL}' AS pg (TYPE postgres, READ_ONLY);" \
  -cmd "ATTACH '${SUPABASE_DB_URL}' AS pgw (TYPE postgres);" \
  -cmd ".read analytics/aggregator_views.sql" \
  -c "
insert into pgw.aggregator.sar_candidate
  (entity_hash, instance_id, window_start, window_end, total_cents, event_count, details)
with params as (
  -- Single-sourced with run_bsa_approver: aggregator.parameter is canonical
  -- (migration 20260811000100); a missing row fails the join loudly.
  select
    (select \"value\" from pg.aggregator.parameter where name = 'ctr_threshold_cents')     as threshold_cents,
    (select \"value\" from pg.aggregator.parameter where name = 'structuring_lookback_days') as lookback_days
),
flagged as (
  select distinct entity_hash, instance_id
  from pg.aggregator.alert
  where alert_type = 'structuring' and requires_lookback and entity_hash is not null
),
lookback as (
  select f.entity_hash, f.instance_id, p.lookback_days,
         sum(e.amount_cents)            as total_cents,
         count(*)                       as event_count,
         min(cast(e.received_at as date)) as window_start
  from flagged f
  cross join params p
  join agg_money_events e on e.entity_hash = f.entity_hash
  where e.received_at > now() - to_days(cast(p.lookback_days as integer))
    and e.amount_cents < p.threshold_cents
  group by 1, 2, 3
  having sum(e.amount_cents) >= max(p.threshold_cents)
)
select l.entity_hash, l.instance_id, l.window_start, current_date,
       l.total_cents, l.event_count,
       l.lookback_days || '-day lookback: ' || l.event_count || ' sub-threshold events totalling '
         || l.total_cents || ' cents (spans hot+cold tiers)'
from lookback l
where not exists (
  select 1 from pg.aggregator.sar_candidate s
  where s.entity_hash = l.entity_hash and s.window_end = current_date
);"

echo "bsa_reporter: lookback complete"
