#!/usr/bin/env bash
# e2e compliance harness — drives the DEPLOYED api against real Blnk and asserts
# that non-compliant transactions are actually FLAGGED, not merely rejected.
#
#   ./supabase/tests/e2e/compliance_e2e.sh
#
# Why this exists (see memory: tdd-with-compliance-e2e): a control that silently
# fails to fire produces a false clean audit, which is worse than a crash. An
# HTTP 422 alone does not prove compliance — the durable artifacts must exist:
#   * core.control_result  (control_id + decision, the evidence row)
#   * core.bsa_alert       (where the control raises one, e.g. CTR)
# So every negative case asserts on the DATABASE, not just the response.
#
# Needs DEMO_API_KEY + SUPABASE_DB_URL in .env.local, and duckdb on PATH.
set -uo pipefail
cd "$(dirname "$0")/../../.."
if [ -f .env.local ]; then set -a; source .env.local; set +a; fi
: "${DEMO_API_KEY:?DEMO_API_KEY not set in .env.local}"
: "${SUPABASE_DB_URL:?SUPABASE_DB_URL not set in .env.local}"

API="${API_BASE:-https://jynsipdvrgqdkeqrlzcv.functions.supabase.co/api}"
AUTH=(-H "X-Api-Key: ${DEMO_API_KEY}" -H "content-type: application/json")
RUN="e2e-$(date +%s)"
PASS=0; FAIL=0

ok()   { printf '  \033[32mPASS\033[0m %s\n' "$1"; PASS=$((PASS+1)); }
bad()  { printf '  \033[31mFAIL\033[0m %s\n     expected: %s\n     actual:   %s\n' "$1" "$2" "$3"; FAIL=$((FAIL+1)); }
check(){ [ "$2" = "$3" ] && ok "$1" || bad "$1" "$3" "$2"; }   # check <name> <actual> <expected>

# sql <query> -> single scalar, ANSI/banner stripped (duckdb prints a Rosetta warning)
sql() {
  duckdb -noheader -list \
    -cmd "ATTACH IF NOT EXISTS '${SUPABASE_DB_URL}' AS pg (TYPE postgres, READ_ONLY);" \
    -c "$1" 2>/dev/null | tr -d '\033' | sed 's/\[[0-9;]*m//g' | grep -vi 'rosetta\|duckdb.org\|warning' | tr -d '[:space:]'
}

api() { # api <method> <path> <idem-suffix> <body> -> writes /tmp/e2e_body, echoes status
  curl -sS -o /tmp/e2e_body -w '%{http_code}' -X "$1" "$API$2" "${AUTH[@]}" \
    -H "Idempotency-Key: $RUN-$3" -d "$4"
}
jget() { python3 -c "import json,sys;d=json.load(open('/tmp/e2e_body'));print(d.get('$1',''))" 2>/dev/null; }
# does the response's control_results contain <control_id>:<decision>?
jctl() { python3 -c "
import json
d=json.load(open('/tmp/e2e_body'))
print('yes' if any(c.get('control_id')=='$1' and c.get('decision')=='$2' for c in d.get('control_results',[])) else 'no')
" 2>/dev/null; }

new_account() { # new_account <cents> <label> -> account id
  curl -sS -X POST "$API/accounts" "${AUTH[@]}" -H "Idempotency-Key: $RUN-acct-$2" \
    -d "{\"account_type\":\"checking\",\"opening_deposit_cents\":$1}" \
  | python3 -c 'import json,sys;print(json.load(sys.stdin)["id"])'
}

echo "== e2e compliance harness ($RUN) =="
echo "-- fixtures --"
RICH_A=$(new_account 5000000 rich-a)     # $50,000
RICH_B=$(new_account 5000000 rich-b)     # $50,000
BROKE=$(new_account  10000  broke)       # $100 — the NSF subject
echo "   rich_a=$RICH_A  rich_b=$RICH_B  broke=$BROKE"

# ---------------------------------------------------------------- happy path
echo "-- 1. COMPLIANT transfer settles cleanly --"
ST=$(api POST /transfers ok1 "{\"source_account_id\":\"$RICH_A\",\"destination_account_id\":\"$RICH_B\",\"amount_cents\":25000,\"description\":\"e2e compliant\"}")
check "compliant transfer -> HTTP 201" "$ST" "201"
check "compliant transfer -> settled"  "$(jget status)" "settled"
OK_ID=$(jget id)
check "compliant transfer raises no blocking control" \
  "$(sql "select count(*) from pg.core.control_result where event='$OK_ID' and decision in ('block','reject');")" "0"

# ------------------------------------------------------------- NSF (reject)
echo "-- 2. NON-COMPLIANT: insufficient funds must be FLAGGED (CG-NSF-01) --"
ST=$(api POST /transfers nsf "{\"source_account_id\":\"$BROKE\",\"destination_account_id\":\"$RICH_A\",\"amount_cents\":500000,\"description\":\"e2e nsf\"}")
check "NSF -> HTTP 422"                "$ST" "422"
check "NSF -> typed insufficient_funds" "$(jget type)" "insufficient_funds"
# the durable evidence: a reject row attributed to CG-NSF-01 for this account
check "NSF -> CG-NSF-01 control_result persisted" \
  "$(sql "select count(*)>0 from pg.core.control_result where control_id='CG-NSF-01' and decision='reject' and subject_ref='$BROKE';")" "true"

# ------------------------------------------------------------- CTR (alert)
echo "-- 3. NON-COMPLIANT: >\$10k must settle AND raise a CTR alert (CG-CTR-01) --"
ST=$(api POST /transfers ctr "{\"source_account_id\":\"$RICH_A\",\"destination_account_id\":\"$RICH_B\",\"amount_cents\":1100000,\"description\":\"e2e ctr\"}")
check "CTR -> HTTP 201 (alert-only, not blocked)" "$ST" "201"
check "CTR -> settled"                            "$(jget status)" "settled"
check "CTR -> CG-CTR-01 reported on response"     "$(jctl CG-CTR-01 pass)" "yes"
CTR_ID=$(jget id)
check "CTR -> CG-CTR-01 control_result persisted" \
  "$(sql "select count(*)>0 from pg.core.control_result where event='$CTR_ID' and control_id='CG-CTR-01';")" "true"
# the BSA artifact an examiner would actually look for
check "CTR -> bsa_alert raised for this transfer" \
  "$(sql "select count(*)>0 from pg.core.bsa_alert where alert_type='ctr_threshold' and details like '%$CTR_ID%';")" "true"

# -------------------------------------------------------- velocity (block)
echo "-- 4. NON-COMPLIANT: daily velocity cap (\$25k) must BLOCK (CG-VEL-01) --"
# rich_b already received funds; drain it past the cap in 6k increments
VEL_BLOCKED="no"
for i in 1 2 3 4 5; do
  ST=$(api POST /transfers "vel$i" "{\"source_account_id\":\"$RICH_B\",\"destination_account_id\":\"$BROKE\",\"amount_cents\":600000,\"description\":\"e2e velocity $i\"}")
  if [ "$ST" = "422" ] && [ "$(jget type)" = "velocity_limit_exceeded" ]; then VEL_BLOCKED="yes"; break; fi
done
check "velocity -> 5th transfer blocked with velocity_limit_exceeded" "$VEL_BLOCKED" "yes"
check "velocity -> CG-VEL-01 block control_result persisted" \
  "$(sql "select count(*)>0 from pg.core.control_result where control_id='CG-VEL-01' and decision='block' and subject_ref='$RICH_B';")" "true"

# ------------------------------------------------- wires: same controls apply
# A wire is a money-movement rail like any other. Before the runGate refactor
# these endpoints did not exist and wires bypassed the gate entirely, so a large
# wire settled with NO bsa_alert — a clean-looking audit over a reportable
# transaction. These assertions are what prove that hole is closed.
echo "-- 5. NON-COMPLIANT WIRE: >\$10k must raise a CTR alert (CG-CTR-01) --"
WIRE_SRC=$(new_account 5000000 wire-src)
ST=$(api POST /payments/wire/prepare wire-ctr "{\"source_account_id\":\"$WIRE_SRC\",\"amount_cents\":1100000,\"beneficiary\":{\"name\":\"Acme Corp\"},\"purpose\":\"e2e wire ctr\"}")
check "wire CTR -> HTTP 201"                     "$ST" "201"
check "wire CTR -> held (submitted)"             "$(jget status)" "submitted"
check "wire CTR -> CG-CTR-01 on response"        "$(jctl CG-CTR-01 pass)" "yes"
WIRE_ID=$(jget id)
check "wire CTR -> CG-CTR-01 control_result persisted" \
  "$(sql "select count(*)>0 from pg.core.control_result where event='$WIRE_ID' and control_id='CG-CTR-01';")" "true"
check "wire CTR -> bsa_alert raised for this wire" \
  "$(sql "select count(*)>0 from pg.core.bsa_alert where alert_type='ctr_threshold' and '$WIRE_ID' <> '' and details like '%$WIRE_ID%';")" "true"

echo "-- 6. NON-COMPLIANT WIRE: insufficient funds must be FLAGGED (CG-NSF-01) --"
WIRE_BROKE=$(new_account 10000 wire-broke)
ST=$(api POST /payments/wire/prepare wire-nsf "{\"source_account_id\":\"$WIRE_BROKE\",\"amount_cents\":500000,\"beneficiary\":{\"name\":\"Acme Corp\"},\"purpose\":\"e2e wire nsf\"}")
check "wire NSF -> HTTP 422"                      "$ST" "422"
check "wire NSF -> typed insufficient_funds"      "$(jget type)" "insufficient_funds"
check "wire NSF -> resource_type is wire_transfer" "$(jget resource_type)" "wire_transfer"
check "wire NSF -> CG-NSF-01 control_result persisted" \
  "$(sql "select count(*)>0 from pg.core.control_result where control_id='CG-NSF-01' and decision='reject' and subject_ref='$WIRE_BROKE';")" "true"
# a blocked wire must never have reached Blnk — assert on THIS wire's row.
# The 422 envelope carries the wire id as resource_id.
WIRE_NSF_ID=$(jget resource_id)
check "wire NSF -> row marked rejected" \
  "$(sql "select status from pg.core.wire_transfer where id='$WIRE_NSF_ID';")" "rejected"
check "wire NSF -> no inflight hold created (gate ran before Blnk)" \
  "$(sql "select case when count(*)=0 then 'no-row' else coalesce(max(blnk_transaction_id),'none') end from pg.core.wire_transfer where id='$WIRE_NSF_ID';")" "none"


echo
echo "== $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] || exit 1
