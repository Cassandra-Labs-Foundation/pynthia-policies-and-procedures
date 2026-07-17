#!/usr/bin/env bash
# Seed the demo: drive the deployed `api` function to create synthetic accounts
# and a burst of book transfers that generates volume and deliberately trips
# every control. Re-runnable — each run uses a fresh run-id so idempotency keys
# and accounts never collide (volume accumulates across runs, which is fine).
#
#   ./analytics/seed.sh
#
# Needs DEMO_API_KEY in .env.local (same key the api function verifies). All
# money is synthetic; funded from Blnk's @OpeningFunding external balance.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f .env.local ]; then set -a; source .env.local; set +a; fi
: "${DEMO_API_KEY:?DEMO_API_KEY not set in .env.local}"

API="${API_BASE:-https://jynsipdvrgqdkeqrlzcv.functions.supabase.co/api}"
RUN="seed-$(date +%s)"
AUTH=(-H "X-Api-Key: ${DEMO_API_KEY}" -H "content-type: application/json")

# create_account <opening_cents> <label> -> echoes account id
# label must be unique per call: this runs in a command-substitution subshell,
# so a shared counter would reset — the caller-supplied label keys idempotency.
create_account() {
  local cents="$1" ik="$RUN-acct-$2"
  curl -sS -X POST "$API/accounts" "${AUTH[@]}" -H "Idempotency-Key: $ik" \
    -d "{\"account_type\":\"checking\",\"opening_deposit_cents\":$cents}" \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])'
}

# transfer <src> <dst> <cents> <label> -> prints "<status>  controls=[...]"
transfer() {
  local src="$1" dst="$2" cents="$3" label="$4"
  XFER_N=$(( XFER_N + 1 ))
  local ik="$RUN-$label-$XFER_N"
  curl -sS -X POST "$API/transfers" "${AUTH[@]}" -H "Idempotency-Key: $ik" \
    -d "{\"source_account_id\":\"$src\",\"destination_account_id\":\"$dst\",\"amount_cents\":$cents,\"description\":\"$label\"}" \
  | python3 -c '
import json, sys
d = json.load(sys.stdin)
st = d.get("status") or d.get("type")
cr = ",".join("%s:%s" % (c["control_id"], c["decision"]) for c in d.get("control_results", [])) or "-"
print("%-22s controls=[%s]" % (st, cr))'
}

ACCT_N=0; XFER_N=0
echo "== seeding demo ($RUN) =="

echo "-- opening 7 accounts --"
A1=$(create_account 5000000 a1); A2=$(create_account 5000000 a2); A3=$(create_account 5000000 a3)
A4=$(create_account 5000000 a4); A5=$(create_account 5000000 a5); A6=$(create_account 5000000 a6)
A7=$(create_account 10000 a7)     # only $100 — the NSF victim
echo "   A1=$A1  A2=$A2  A3=$A3  A4=$A4  A5=$A5  A6=$A6  A7=$A7 (\$100)"

echo "-- 1. normal volume (small on-us transfers) --"
transfer "$A1" "$A2" 25000   normal   # $250
transfer "$A2" "$A3" 100000  normal   # $1,000
transfer "$A3" "$A1" 50000   normal   # $500

echo "-- 2. AGGREGATE-CTR / structuring: A1,A2,A3 each send \$4,000 to A4 --"
echo "     each < \$10k so the per-txn gate (CG-CTR-01) stays silent;"
echo "     only ctr_daily_inflow.agg_over_10k catches the \$12k aggregate."
transfer "$A1" "$A4" 400000  struct
transfer "$A2" "$A4" 400000  struct
transfer "$A3" "$A4" 400000  struct

echo "-- 3. PER-TXN CTR: A5 -> A6 \$11,000 (> \$10k) fires CG-CTR-01 + bsa_alert --"
transfer "$A5" "$A6" 1100000 ctr

echo "-- 4. VELOCITY: A6 -> A1 \$6,000 x5 (cap \$25k/day) — 4 settle, 5th CG-VEL-01 block --"
for i in 1 2 3 4 5; do
  printf '   #%d ' "$i"; transfer "$A6" "$A1" 600000 velocity
done

echo "-- 5. NSF: A7 (\$100) -> A5 \$5,000 fires CG-NSF-01 reject --"
transfer "$A7" "$A5" 500000 nsf

echo "== done. run analytics: ./analytics/duck.sh -f analytics/demo_queries.sql =="
