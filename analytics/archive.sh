#!/usr/bin/env bash
# Card 62 — the sync mechanism: watermark archiving to Parquet.
#
# Exports aggregator.event rows in (last watermark, current max] to one
# Parquet file per run under analytics/archive/, then advances the watermark
# in Postgres. The spanning view (aggregator_views.sql) serves rows above the
# watermark from hot Postgres and rows at/below it from cold Parquet, so a
# query crosses both tiers without double-counting.
#
# Idempotent: a re-run with no new rows archives nothing — but STILL stamps
# archived_at (the card-18 liveness lesson: a run that found no work is
# evidence of liveness and must say so).
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f .env.local ]; then set -a; source .env.local; set +a; fi
: "${SUPABASE_DB_URL:?SUPABASE_DB_URL not set — add the session-pooler URI to .env.local}"

mkdir -p analytics/archive

W=$(psql "$SUPABASE_DB_URL" -qtA -c "select archived_through from aggregator.archive_watermark;")
M=$(psql "$SUPABASE_DB_URL" -qtA -c "select coalesce(max(sequence_id), 0) from aggregator.event;")

if [ "$M" -le "$W" ]; then
  psql "$SUPABASE_DB_URL" -qtA -c "update aggregator.archive_watermark set archived_at = now();" >/dev/null
  echo "archive: nothing new (watermark $W, max $M) — liveness stamped"
  exit 0
fi

OUT="analytics/archive/events_$((W + 1))_${M}.parquet"
duckdb -cmd "INSTALL postgres; LOAD postgres; INSTALL json; LOAD json;" \
  -cmd "ATTACH '${SUPABASE_DB_URL}' AS pg (TYPE postgres, READ_ONLY);" \
  -c "COPY (
        select sequence_id, event_id, instance_id, code, entity_hash,
               cast(payload as varchar) as payload, schema_version, received_at
        from pg.aggregator.event
        where sequence_id > ${W} and sequence_id <= ${M}
        order by sequence_id
      ) TO '${OUT}' (FORMAT parquet);"

psql "$SUPABASE_DB_URL" -qtA -c \
  "update aggregator.archive_watermark set archived_through = ${M}, archived_at = now();" >/dev/null
echo "archive: wrote ${OUT} (seq $((W + 1))..${M}); watermark advanced to ${M}"
