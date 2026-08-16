#!/usr/bin/env bash
# TODO §6 — reconcile aggregator.fbo_position against the FBO direction model.
#
# The payment hub is a forward-only consumer: it applies each event once and
# advances a cursor. When migration 20260815000100 corrected the direction it
# applies, the positions already in the table stayed wrong, and they cannot be
# fixed by replay — §7's physical pruning has already emptied the hot
# aggregator.event table (0 rows at cursor 1705305). The parquet archive is
# the record of truth for everything below the watermark, so both the
# correction and the ongoing check come from there.
#
# THE FORMULA. A position is not purely event-derived: accept_origination also
# debits it when a reserve is captured.
#
#   position = SUM(signed event amounts)  -  SUM(captured reserves)
#
# Run under BOTH models, which is what makes each row self-explaining:
#
#   explained=new   position matches the corrected model — the healthy state
#   explained=old   position matches the PRE-correction model (every money
#                   code added) — wrong, but fully accounted for, so --apply
#                   can safely move it
#   explained=no    matches neither: something outside this model moved the
#                   row. NEVER written by --apply. Silently overwriting a row
#                   we cannot explain is how §2's fake-vs-real defects
#                   happened; this asks to be proven right first.
#
# WHY --check EXISTS. Pruning is not itself defective — the events are safe in
# git-committed parquet, and this script can rebuild from them. What was
# missing is that nothing NOTICED when the hub's live position diverged from
# what the archive says it should be. That is precisely how the sign error
# survived: it was wrong in the only copy anyone read. --check runs daily in
# aggregator-reporters.yml and goes red on divergence.
#
# Instances that legitimately cannot reconcile are named in
# analytics/fbo-unreconciled.json — a ratchet, shrink it, never grow it.
#
#   ./analytics/fbo_recompute.sh            # report only (default)
#   ./analytics/fbo_recompute.sh --check    # exit 1 on unexplained divergence
#   ./analytics/fbo_recompute.sh --apply    # write the `old`-explained rows
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f .env.local ]; then set -a; source .env.local; set +a; fi
: "${SUPABASE_DB_URL:?SUPABASE_DB_URL not set — add the session-pooler URI to .env.local}"

MODE=report
case "${1:-}" in
  --apply) MODE=apply ;;
  --check) MODE=check ;;
  "") ;;
  *) echo "unknown argument: $1 (expected --check or --apply)" >&2; exit 2 ;;
esac

BASELINE=analytics/fbo-unreconciled.json

REPORT=$(duckdb -csv -noheader -c "
INSTALL json; LOAD json;
INSTALL postgres; LOAD postgres;
ATTACH '${SUPABASE_DB_URL}' AS pg (TYPE postgres, READ_ONLY);

-- Cold tier alone would be enough today, but span both so the script stays
-- correct the moment new events land above the watermark.
create or replace view ev as
  select sequence_id, instance_id, code, payload from read_parquet('analytics/archive/*.parquet')
  union all
  select e.sequence_id, e.instance_id, e.code, cast(e.payload as varchar)
  from pg.aggregator.event e
  where e.sequence_id > (select archived_through from pg.aggregator.archive_watermark);

with amounts as (
  select instance_id, code,
         cast(json_extract_string(payload, '\$.amount_cents') as bigint) as amount
  from ev
  where json_extract_string(payload, '\$.amount_cents') is not null
),
events as (
  select instance_id,
         -- the OLD model: every x-money code added, whatever direction it was
         sum(case when code in ('transfer.settled','wire_transfer.completed',
                                'ach_transfer.settled','card_authorization.captured')
                  then amount else 0 end) as old_events,
         -- the NEW model: x-fbo signed. Mirrors aggregator.fbo_delta.
         sum(case
               when code in ('ach_transfer.settled','wire_transfer.completed',
                             'card_authorization.captured') then -amount
               when code in ('ach_transfer.returned','wire_transfer.returned',
                             'ach_pull.settled','fbo_funding.settled') then amount
               else 0 end) as new_events
  from amounts group by 1
),
captured as (
  select instance_id, sum(amount_cents) as captured
  from pg.aggregator.reserve where status = 'captured' group by 1
),
inst as (
  select instance_id from pg.aggregator.fbo_position
  union select instance_id from events
  union select instance_id from captured
),
calc as (
  select i.instance_id,
         coalesce(p.position_cents, 0)                       as actual,
         coalesce(e.old_events, 0) - coalesce(c.captured, 0)  as old_expected,
         coalesce(e.new_events, 0) - coalesce(c.captured, 0)  as new_expected
  from inst i
  left join pg.aggregator.fbo_position p on p.instance_id = i.instance_id
  left join events   e on e.instance_id = i.instance_id
  left join captured c on c.instance_id = i.instance_id
)
select instance_id, actual, old_expected, new_expected,
       case when actual = new_expected then 'new'
            when actual = old_expected then 'old'
            else 'no' end as explained
from calc order by instance_id;
" 2>/dev/null \
  | sed $'s/\x1b\\[[0-9;]*[a-zA-Z]//g' \
  | grep -E '^[a-z0-9_]+,-?[0-9]+,-?[0-9]+,-?[0-9]+,(new|old|no)$')

# ^ escapes stripped, THEN shape-filtered. duckdb prints environment banners
# (the Rosetta notice on an x86 binary, extension chatter) onto the same
# stream, and a banner line reaching the awk below would print as a phantom
# instance. The sed is not cosmetic: the banner's trailing colour reset lands
# glued to the front of the next real row, and filtering without stripping it
# first silently DROPPED a live instance from this report.

if [ -z "$REPORT" ]; then
  echo "no rows — is analytics/archive/ populated and SUPABASE_DB_URL reachable?" >&2
  exit 1
fi

printf '%-18s %16s %16s %16s  %s\n' instance actual old_model new_model explained
printf '%s\n' "$REPORT" | awk -F, '{printf "%-18s %16.2f %16.2f %16.2f  %s\n", $1, $2/100, $3/100, $4/100, $5}'

BASELINED=$(python3 -c "
import json
print(' '.join(k for k in json.load(open('$BASELINE')) if not k.startswith('_')))
")

# Divergence = anything not matching the corrected model, minus the instances
# the baseline already admits cannot reconcile.
DIVERGED=$(printf '%s\n' "$REPORT" | awk -F, -v base=" $BASELINED " \
  '$5!="new" && index(base, " " $1 " ")==0 {print $1}')
# A baselined instance that HAS started reconciling is the ratchet's cue to shrink.
RECOVERED=$(printf '%s\n' "$REPORT" | awk -F, -v base=" $BASELINED " \
  '$5=="new" && index(base, " " $1 " ")>0 {print $1}')

if [ -n "$RECOVERED" ]; then
  echo
  echo "now reconciling — remove from $BASELINE (the ratchet only shrinks):"
  printf '  %s\n' $RECOVERED
fi

case "$MODE" in
  check)
    if [ -n "$DIVERGED" ]; then
      echo
      echo "FBO POSITION DRIFT — these instances do not match the archive under" >&2
      echo "the corrected model, and are not baselined as unreconcilable:" >&2
      printf '  %s\n' $DIVERGED >&2
      echo >&2
      echo "Either the hub applied something wrong, or a position was written" >&2
      echo "outside it. Fix the cause, or run --apply if this is the known" >&2
      echo "pre-correction state (see TODO §6)." >&2
      exit 1
    fi
    echo
    echo "FBO positions reconcile with the archive under the corrected model"
    ;;
  apply)
    WRITABLE=$(printf '%s\n' "$REPORT" | awk -F, '$5=="old"{print $1}')
    if [ -z "$WRITABLE" ]; then
      echo
      echo "nothing to write — no instance is in the pre-correction state"
      exit 0
    fi
    printf '%s\n' "$REPORT" | awk -F, '$5=="old"{printf "update aggregator.fbo_position set position_cents = %s, updated_at = now() where instance_id = '\''%s'\'';\n", $4, $1}' \
      | psql "$SUPABASE_DB_URL" -X -q -v ON_ERROR_STOP=1
    echo
    echo "applied. positions now:"
    psql "$SUPABASE_DB_URL" -X -q -c \
      "select instance_id, position_cents/100.0 as dollars, last_seq from aggregator.fbo_position order by 1;"
    ;;
  report)
    echo
    echo "report only — --check to fail on divergence, --apply to write"
    ;;
esac
