#!/usr/bin/env bash
# TODO §7 item 4 — physical pruning of archived aggregator rows.
#
# Deletes hot Postgres rows that the cold tier already serves. The upper
# bound is the max sequence covered by Parquet files COMMITTED to git
# (git ls-files, not the working tree): a row leaves Postgres only after the
# archive of record holds it. aggregator.prune_archived tightens the bound
# further (archive watermark, min consumer cursor) and keeps rows younger
# than 72h regardless — see migration 20260811000100 for the full rule.
#
# Idempotent: a re-run with nothing eligible deletes nothing and says so.
# Scheduled via .github/workflows/aggregator-reporters.yml AFTER the step
# that commits new Parquet; runnable on demand.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f .env.local ]; then set -a; source .env.local; set +a; fi
: "${SUPABASE_DB_URL:?SUPABASE_DB_URL not set — add the session-pooler URI to .env.local}"

# Highest sequence_id reachable from 1 through CONTIGUOUS committed
# coverage, from the events_<from>_<to>.parquet naming convention archive.sh
# writes. Contiguity matters: a sweep that was written but never committed
# (it has happened — see f28afe7) leaves a gap, and rows in a gap exist
# nowhere but Postgres. max(to) would prune them; this walk stops at the gap.
COMMITTED=$(git ls-files 'analytics/archive/*.parquet' \
  | sed -n 's/.*events_\([0-9]*\)_\([0-9]*\)\.parquet/\1 \2/p' \
  | sort -n \
  | awk 'BEGIN {cov = 0}
         $1 > cov + 1 {exit}                # gap — nothing beyond is safe
         $2 > cov     {cov = $2}
         END {print cov}')

if [ -z "${COMMITTED}" ] || [ "${COMMITTED}" -eq 0 ]; then
  echo "prune: no contiguous committed parquet coverage — nothing is safely prunable"
  exit 0
fi

RESULT=$(psql "$SUPABASE_DB_URL" -qtA -c \
  "select aggregator.prune_archived(${COMMITTED});")
echo "prune: ${RESULT}"
