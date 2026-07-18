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


# ------------------------------------------------ cross-rail velocity evasion
# CG-VEL-01 is a per-account DAILY cap. If it only summed core.transfer, wire
# volume would never count -- so a member could send unlimited wires, or split
# across rails, and never trip the cap. This walks the wire rail alone past
# $25k and requires the gate to block.
echo "-- 7. NON-COMPLIANT: velocity cap must span RAILS, not just book transfers --"
XR=$(new_account 5000000 xrail)
XR_BLOCKED="no"
for i in 1 2 3 4 5; do
  ST=$(api POST /payments/wire/prepare "xrail$i" "{\"source_account_id\":\"$XR\",\"amount_cents\":600000,\"beneficiary\":{\"name\":\"Acme Corp\"},\"purpose\":\"e2e xrail $i\"}")
  if [ "$ST" = "422" ] && [ "$(jget type)" = "velocity_limit_exceeded" ]; then XR_BLOCKED="yes"; break; fi
done
check "wire-only volume past \$25k is blocked by CG-VEL-01" "$XR_BLOCKED" "yes"
check "cross-rail velocity -> CG-VEL-01 block persisted for the account" \
  "$(sql "select count(*)>0 from pg.core.control_result where control_id='CG-VEL-01' and decision='block' and subject_ref='$XR';")" "true"
# and the mixed case: book volume must see prior wire volume
MIX=$(new_account 5000000 mixed)
api POST /payments/wire/prepare mix-w "{\"source_account_id\":\"$MIX\",\"amount_cents\":2000000,\"beneficiary\":{\"name\":\"Acme Corp\"},\"purpose\":\"e2e mixed wire\"}" >/dev/null
ST=$(api POST /transfers mix-t "{\"source_account_id\":\"$MIX\",\"destination_account_id\":\"$RICH_A\",\"amount_cents\":600000,\"description\":\"e2e mixed book\"}")
check "book transfer after a \$20k wire trips the cap (rails aggregate)" "$ST" "422"
check "mixed-rail block is typed velocity_limit_exceeded" "$(jget type)" "velocity_limit_exceeded"


# --------------------------------------------------- structuring / aggregate CTR
# The per-transaction gate (CG-CTR-01) only sees one transfer at a time, so a
# member can stay under $10k on every single transfer and still move a
# reportable amount in a day. That is textbook structuring. Until now it was
# visible only in the ctr_daily_inflow DuckDB view -- i.e. after the fact, in
# analytics -- and nothing in the live path flagged it.
echo "-- 8. NON-COMPLIANT: structuring -- 3x \$4k to one account aggregates past \$10k --"
S1=$(new_account 5000000 str-1); S2=$(new_account 5000000 str-2); S3=$(new_account 5000000 str-3)
DEST=$(new_account 10000 str-dest)
api POST /transfers str1 "{\"source_account_id\":\"$S1\",\"destination_account_id\":\"$DEST\",\"amount_cents\":400000,\"description\":\"e2e struct 1\"}" >/dev/null
api POST /transfers str2 "{\"source_account_id\":\"$S2\",\"destination_account_id\":\"$DEST\",\"amount_cents\":400000,\"description\":\"e2e struct 2\"}" >/dev/null
# third crosses the aggregate line: 3 x $4,000 = $12,000 into one account today
ST=$(api POST /transfers str3 "{\"source_account_id\":\"$S3\",\"destination_account_id\":\"$DEST\",\"amount_cents\":400000,\"description\":\"e2e struct 3\"}")
check "structuring -> individual transfer still settles (alert-only)" "$ST" "201"
check "structuring -> per-txn CG-CTR-01 stays silent (each < \$10k)" "$(jctl CG-CTR-01 pass)" "no"
check "structuring -> CG-STR-01 reported on response"                "$(jctl CG-STR-01 pass)" "yes"
STR_ID=$(jget id)
check "structuring -> CG-STR-01 control_result persisted" \
  "$(sql "select count(*)>0 from pg.core.control_result where event='$STR_ID' and control_id='CG-STR-01';")" "true"
check "structuring -> bsa_alert raised against the receiving account" \
  "$(sql "select count(*)>0 from pg.core.bsa_alert where alert_type='structuring' and '$DEST' <> '' and details like '%$DEST%';")" "true"


# ------------------------------------------------------- ACH: same gate applies
echo "-- 9. NON-COMPLIANT ACH: >\$10k must raise a CTR alert, NSF must block --"
ACH_SRC=$(new_account 5000000 ach-src)
ST=$(api POST /payments/ach ach-ctr "{\"source_account_id\":\"$ACH_SRC\",\"amount_cents\":1100000,\"counterparty\":{\"name\":\"Acme Vendor\"},\"window\":\"next_day\"}")
check "ACH CTR -> HTTP 201"                  "$ST" "201"
check "ACH CTR -> held (submitted)"          "$(jget status)" "submitted"
check "ACH CTR -> CG-CTR-01 on response"     "$(jctl CG-CTR-01 pass)" "yes"
ACH_ID=$(jget id)
check "ACH CTR -> bsa_alert raised for this ACH" \
  "$(sql "select count(*)>0 from pg.core.bsa_alert where alert_type='ctr_threshold' and '$ACH_ID' <> '' and details like '%$ACH_ID%';")" "true"

ACH_BROKE=$(new_account 10000 ach-broke)
ST=$(api POST /payments/ach ach-nsf "{\"source_account_id\":\"$ACH_BROKE\",\"amount_cents\":500000,\"counterparty\":{\"name\":\"Acme Vendor\"}}")
check "ACH NSF -> HTTP 422"                       "$ST" "422"
check "ACH NSF -> resource_type is ach_transfer"  "$(jget resource_type)" "ach_transfer"
ACH_NSF_ID=$(jget resource_id)
check "ACH NSF -> no inflight hold created (gate ran before Blnk)" \
  "$(sql "select case when count(*)=0 then 'no-row' else coalesce(max(blnk_transaction_id),'none') end from pg.core.ach_transfer where id='$ACH_NSF_ID';")" "none"

echo "-- 10. ACH settle commits the hold --"
ST=$(api POST "/payments/ach/$ACH_ID/settle" ach-settle "{}")
check "ACH settle -> HTTP 200"   "$ST" "200"
check "ACH settle -> settled"    "$(jget status)" "settled"

echo "-- 11. ACH volume counts toward the cross-rail velocity cap --"
AV=$(new_account 5000000 ach-vel)
AV_BLOCKED="no"
for i in 1 2 3 4 5; do
  ST=$(api POST /payments/ach "achvel$i" "{\"source_account_id\":\"$AV\",\"amount_cents\":600000,\"counterparty\":{\"name\":\"Acme Vendor\"}}")
  if [ "$ST" = "422" ] && [ "$(jget type)" = "velocity_limit_exceeded" ]; then AV_BLOCKED="yes"; break; fi
done
check "ACH-only volume past \$25k is blocked by CG-VEL-01" "$AV_BLOCKED" "yes"


# ------------------------------- cards: partial + incremental capture, gated
echo "-- 12. CARD: authorize -> partial capture -> capture -> reverse remainder --"
C_SRC=$(new_account 5000000 card-src)
ST=$(api POST /payments/card/authorize card-auth "{\"source_account_id\":\"$C_SRC\",\"amount_cents\":100000,\"merchant\":\"Acme Coffee\"}")
check "card authorize -> HTTP 201"        "$ST" "201"
check "card authorize -> authorized"      "$(jget status)" "authorized"
check "card authorize -> nothing captured yet" "$(jget captured_cents)" "0"
CARD_ID=$(jget id)

# capture $300 of a $1000 hold
ST=$(api POST "/payments/card/$CARD_ID/capture" card-cap1 "{\"amount_cents\":30000}")
check "partial capture -> HTTP 200"                "$ST" "200"
check "partial capture -> partially_captured"      "$(jget status)" "partially_captured"
check "partial capture -> captured_cents tracks"   "$(jget captured_cents)" "30000"
check "partial capture -> remaining_cents tracks"  "$(jget remaining_cents)" "70000"

# over-capture must be refused, not clamped
ST=$(api POST "/payments/card/$CARD_ID/capture" card-cap-over "{\"amount_cents\":80000}")
check "over-capture -> 422 refused (not clamped)"  "$ST" "422"
check "over-capture -> typed capture_exceeds_authorization" "$(jget type)" "capture_exceeds_authorization"

# incremental capture of the rest closes it out
ST=$(api POST "/payments/card/$CARD_ID/capture" card-cap2 "{\"amount_cents\":70000}")
check "incremental capture -> captured"            "$(jget status)" "captured"
check "incremental capture -> full amount captured" "$(jget captured_cents)" "100000"
check "re-capturing a captured auth replays"       "$(api POST "/payments/card/$CARD_ID/capture" card-cap3 "{}")" "200"

echo "-- 13. CARD: reversing an under-captured hold releases the remainder --"
ST=$(api POST /payments/card/authorize card-auth2 "{\"source_account_id\":\"$C_SRC\",\"amount_cents\":50000,\"merchant\":\"Acme Coffee\"}")
CARD2=$(jget id)
api POST "/payments/card/$CARD2/capture" card2-cap "{\"amount_cents\":20000}" >/dev/null
ST=$(api POST "/payments/card/$CARD2/reverse" card2-rev "{\"reason\":\"merchant cancelled\"}")
check "reverse from partially_captured -> HTTP 200" "$ST" "200"
check "reverse -> reversed"                         "$(jget status)" "reversed"
check "reverse -> already-captured amount retained" "$(jget captured_cents)" "20000"

echo "-- 14. NON-COMPLIANT CARD: NSF must decline before any hold --"
C_BROKE=$(new_account 10000 card-broke)
ST=$(api POST /payments/card/authorize card-nsf "{\"source_account_id\":\"$C_BROKE\",\"amount_cents\":500000,\"merchant\":\"Acme Coffee\"}")
check "card NSF -> HTTP 422"                          "$ST" "422"
check "card NSF -> resource_type is card_authorization" "$(jget resource_type)" "card_authorization"
NSF_CARD=$(jget resource_id)
check "card NSF -> row marked declined"  \
  "$(sql "select status from pg.core.card_authorization where id='$NSF_CARD';")" "declined"
check "card NSF -> no hold placed (gate ran before Blnk)" \
  "$(sql "select case when count(*)=0 then 'no-row' else coalesce(max(blnk_inflight_id),'none') end from pg.core.card_authorization where id='$NSF_CARD';")" "none"


# ------------------------------------------------- outbound structuring (STR-02)
# CG-STR-01 watches inflow to a destination account. Wires/ACH/card have no
# destination row -- funds leave for an @external balance -- so a member
# structuring money OUT was invisible to it, and CG-VEL-01 only blocks the same
# flow at $25k. This walks $12k out of one account in $4k wires: every single
# transaction stays under the CTR line, and the day does not.
echo "-- 15. NON-COMPLIANT: outbound structuring across wires (CG-STR-02) --"
OB=$(new_account 5000000 outbound-str)
api POST /payments/wire/prepare ob-1 "{\"source_account_id\":\"$OB\",\"amount_cents\":400000,\"beneficiary\":{\"name\":\"Acme Corp\"},\"purpose\":\"ob 1\"}" >/dev/null
api POST /payments/wire/prepare ob-2 "{\"source_account_id\":\"$OB\",\"amount_cents\":400000,\"beneficiary\":{\"name\":\"Acme Corp\"},\"purpose\":\"ob 2\"}" >/dev/null
# third wire takes the day to $12k
ST=$(api POST /payments/wire/prepare ob-3 "{\"source_account_id\":\"$OB\",\"amount_cents\":400000,\"beneficiary\":{\"name\":\"Acme Corp\"},\"purpose\":\"ob 3\"}")
check "outbound structuring -> wire still settles (alert-only)" "$ST" "201"
check "outbound structuring -> per-txn CG-CTR-01 stays silent"  "$(jctl CG-CTR-01 pass)" "no"
check "outbound structuring -> CG-STR-02 on response"           "$(jctl CG-STR-02 pass)" "yes"
OB_ID=$(jget id)
check "outbound structuring -> CG-STR-02 control_result persisted" \
  "$(sql "select count(*)>0 from pg.core.control_result where event='$OB_ID' and control_id='CG-STR-02';")" "true"
check "outbound structuring -> bsa_alert names the sending account" \
  "$(sql "select count(*)>0 from pg.core.bsa_alert where alert_type='structuring' and '$OB' <> '' and details like '%OUTBOUND%' and details like '%$OB%';")" "true"

echo "-- 16. outbound structuring aggregates across DIFFERENT rails --"
XB=$(new_account 5000000 xrail-str)
api POST /payments/ach xb-ach "{\"source_account_id\":\"$XB\",\"amount_cents\":400000,\"counterparty\":{\"name\":\"Acme Vendor\"}}" >/dev/null
api POST /payments/card/authorize xb-card "{\"source_account_id\":\"$XB\",\"amount_cents\":400000,\"merchant\":\"Acme Coffee\"}" >/dev/null
# a book transfer completes the $12k day across three different rails
ST=$(api POST /transfers xb-book "{\"source_account_id\":\"$XB\",\"destination_account_id\":\"$RICH_A\",\"amount_cents\":400000,\"description\":\"xrail structuring\"}")
check "cross-rail outbound structuring -> settles" "$ST" "201"
check "cross-rail outbound structuring -> CG-STR-02 fires" "$(jctl CG-STR-02 pass)" "yes"


# ------------------------------------------------------ domestic-only wires
echo "-- 17. A SWIFT / international wire must be refused (domestic only) --"
DOM=$(new_account 5000000 domestic)
ST=$(api POST /payments/wire/prepare intl-swift "{\"source_account_id\":\"$DOM\",\"amount_cents\":100000,\"beneficiary\":{\"name\":\"Acme GmbH\",\"swift_code\":\"DEUTDEFF\"},\"purpose\":\"intl\"}")
check "SWIFT wire -> HTTP 422"                       "$ST" "422"
check "SWIFT wire -> typed international_wire_not_supported" "$(jget type)" "international_wire_not_supported"
ST=$(api POST /payments/wire/prepare intl-country "{\"source_account_id\":\"$DOM\",\"amount_cents\":100000,\"beneficiary\":{\"name\":\"Acme GmbH\",\"country\":\"DE\"},\"purpose\":\"intl\"}")
check "non-US beneficiary country -> HTTP 422"       "$ST" "422"
# refused before a row is created, so no stranded hold and no orphan row
check "refused international wire creates NO wire row" \
  "$(sql "select count(*) from pg.core.wire_transfer where cast(originator as varchar) like '%$DOM%';")" "0"
ST=$(api POST /payments/wire/prepare domestic-ok "{\"source_account_id\":\"$DOM\",\"amount_cents\":100000,\"beneficiary\":{\"name\":\"Acme Corp\",\"country\":\"US\",\"routing_number\":\"021000021\"},\"purpose\":\"domestic\"}")
check "explicit US beneficiary still settles"        "$ST" "201"


echo
echo "== $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] || exit 1
