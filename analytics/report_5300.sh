#!/usr/bin/env bash
# Card 60 — 5300 Reporter: the scheduled call-report aggregation.
#
# One row per instance per run-day: settled money movement (from the
# spanning view — hot Postgres + cold Parquet), alert counts, and the FBO
# position the Payment Hub maintains. The row set is the evidence that "a
# scheduled 5300 aggregation runs"; mapping these lines onto the full NCUA
# 5300 form is a reporting exercise on top of this table, not more plumbing.
#
# Idempotent by UNIQUE(period, instance_id, as_of): re-runs on the same day
# are no-ops via the anti-join. Scheduled via
# .github/workflows/aggregator-reporters.yml (daily) and runnable on demand.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f .env.local ]; then set -a; source .env.local; set +a; fi
: "${SUPABASE_DB_URL:?SUPABASE_DB_URL not set — add the session-pooler URI to .env.local}"

duckdb -cmd "INSTALL postgres; LOAD postgres; INSTALL json; LOAD json;" \
  -cmd "ATTACH '${SUPABASE_DB_URL}' AS pg (TYPE postgres, READ_ONLY);" \
  -cmd "ATTACH '${SUPABASE_DB_URL}' AS pgw (TYPE postgres);" \
  -cmd ".read analytics/aggregator_views.sql" \
  -c "
insert into pgw.aggregator.report_5300
  (period, instance_id, as_of, settled_cents, settled_count,
   ctr_alerts, structuring_alerts, fbo_position_cents)
with money as (
  select instance_id,
         sum(amount_cents) as settled_cents,
         count(*)          as settled_count
  from agg_money_events
  group by 1
),
alerts as (
  select instance_id,
         sum(case when alert_type = 'ctr_threshold' then 1 else 0 end) as ctr_alerts,
         sum(case when alert_type = 'structuring'   then 1 else 0 end) as structuring_alerts
  from pg.aggregator.alert
  group by 1
),
fbo as (
  select instance_id, position_cents from pg.aggregator.fbo_position
)
select cast(year(current_date) as varchar) || '-Q' || cast(quarter(current_date) as varchar),
       m.instance_id, current_date,
       m.settled_cents, m.settled_count,
       coalesce(a.ctr_alerts, 0), coalesce(a.structuring_alerts, 0),
       coalesce(f.position_cents, 0)
from money m
left join alerts a using (instance_id)
left join fbo    f using (instance_id)
where not exists (
  select 1 from pg.aggregator.report_5300 r
  where r.instance_id = m.instance_id and r.as_of = current_date
);"

echo "report_5300: aggregation complete"
