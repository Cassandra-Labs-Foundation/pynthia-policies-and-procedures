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


# --------------------------------------- ACH walks the full state machine
# Card 34: PENDING_APPROVAL -> SUBMITTED -> SETTLED -> RETURNED. The last hop is
# the one that matters: an ACH return arrives days AFTER settlement (R01,
# unauthorized debit). The hold is already committed by then, so it cannot be
# voided -- it must be undone by a compensating entry.
echo "-- 18. ACH: a SETTLED entry can still be returned (R01 arrives late) --"
AS=$(new_account 5000000 ach-settle)
ST=$(api POST /payments/ach ach-full "{\"source_account_id\":\"$AS\",\"amount_cents\":150000,\"counterparty\":{\"name\":\"Acme Vendor\"},\"window\":\"next_day\"}")
check "ACH submit -> HTTP 201"        "$ST" "201"
check "ACH submit -> submitted"       "$(jget status)" "submitted"
AID=$(jget id)
ST=$(curl -sS -o /tmp/e2e_body -w '%{http_code}' -X POST "$API/payments/ach/$AID/settle" "${AUTH[@]}")
check "ACH settle -> settled"         "$(jget status)" "settled"
# now the late return, against an entry that has already settled
ST=$(curl -sS -o /tmp/e2e_body -w '%{http_code}' -X POST "$API/payments/ach/$AID/return" "${AUTH[@]}" -d '{"return_reason":"R01"}')
check "post-settlement return -> HTTP 200" "$ST" "200"
check "post-settlement return -> returned" "$(jget status)" "returned"
check "row reaches returned in the database" \
  "$(sql "select status from pg.core.ach_transfer where id='$AID';")" "returned"


# ---------------------------------- settlement evidence trio (card 31)
# One settled transfer must leave (1) the mirror on the row, (2) a bookkeeping
# entry, (3) a transfer.settled event. Money that moves without GL + event
# evidence is invisible to the 5300 side and to event-driven controls.
echo "-- 19. a settled transfer leaves bookkeeping + event evidence --"
check "bookkeeping entry exists (deterministic id)" \
  "$(sql "select count(*) from pg.core.bookkeeping_entry where id='bke_$OK_ID';")" "1"
check "bookkeeping entry carries the amount" \
  "$(sql "select amount from pg.core.bookkeeping_entry where id='bke_$OK_ID';")" "25000"
check "transfer.settled event exists for the transfer" \
  "$(sql "select count(*) from pg.core.event where id='evt_${OK_ID}_settled' and code='transfer.settled' and resource_id='$OK_ID';")" "1"

# ------------------------------------------------ wire returns (card 37)
# A return request resolves to RETURNED or COMPLETED, with reasons. Acceptance
# must be a compensating reversal (funds already left for @FedWire), never a
# mutation of settled history.
echo "-- 20. wire return: accepted resolution lands RETURNED with reason --"
WR=$(new_account 5000000 wire-return)
ST=$(api POST /payments/wire/prepare wret1 "{\"source_account_id\":\"$WR\",\"amount_cents\":200000,\"beneficiary\":{\"name\":\"Acme Corp\",\"country\":\"US\"},\"purpose\":\"e2e wire return\"}")
WID=$(jget id)
ST=$(curl -sS -o /tmp/e2e_body -w '%{http_code}' -X POST "$API/payments/wire/$WID/confirm" "${AUTH[@]}")
check "wire confirmed (completed)"          "$(jget status)" "completed"
ST=$(curl -sS -o /tmp/e2e_body -w '%{http_code}' -X POST "$API/payments/wire/$WID/return" "${AUTH[@]}" -d '{"reason":"beneficiary fraud claim"}')
check "return request -> HTTP 200"          "$ST" "200"
check "return request -> return_requested"  "$(jget status)" "return_requested"
ST=$(curl -sS -o /tmp/e2e_body -w '%{http_code}' -X POST "$API/payments/wire/$WID/return/resolve" "${AUTH[@]}" -d '{"outcome":"accepted"}')
check "accepted resolution -> returned"     "$(jget status)" "returned"
check "DB reaches returned, reason retained" \
  "$(sql "select status || ':' || coalesce(return_reason,'') from pg.core.wire_transfer where id='$WID';")" "returned:beneficiaryfraudclaim"

echo "-- 21. wire return: rejected resolution restores COMPLETED with trail --"
ST=$(api POST /payments/wire/prepare wret2 "{\"source_account_id\":\"$WR\",\"amount_cents\":150000,\"beneficiary\":{\"name\":\"Acme Corp\",\"country\":\"US\"},\"purpose\":\"e2e wire return 2\"}")
W2=$(jget id)
curl -sS -o /tmp/e2e_body -X POST "$API/payments/wire/$W2/confirm" "${AUTH[@]}"
curl -sS -o /tmp/e2e_body -X POST "$API/payments/wire/$W2/return" "${AUTH[@]}" -d '{"reason":"suspected duplicate"}'
ST=$(curl -sS -o /tmp/e2e_body -w '%{http_code}' -X POST "$API/payments/wire/$W2/return/resolve" "${AUTH[@]}" -d '{"outcome":"rejected","reason":"funds already withdrawn"}')
check "rejected resolution -> HTTP 200"     "$ST" "200"
check "rejected resolution keeps completed" "$(jget status)" "completed"
check "reason trail records the rejection" \
  "$(sql "select count(*) from pg.core.wire_transfer where id='$W2' and return_reason like '%rejected%';")" "1"


# ------------------------- movement artifacts on every rail (31 follow-up)
# Every money movement must leave its bookkeeping + event pair; holds/voids
# leave none. Reuses this run's wire (completed then returned) and ACH
# (settled then returned), plus a fresh card walk with exact capture totals.
echo "-- 22. wire + ACH movements left their evidence pairs --"
check "wire confirm -> bookkeeping entry" \
  "$(sql "select count(*) from pg.core.bookkeeping_entry where id='bke_${WID}_completed';")" "1"
check "wire confirm -> wire_transfer.completed event" \
  "$(sql "select count(*) from pg.core.event where id='evt_${WID}_completed' and code='wire_transfer.completed';")" "1"
check "wire accepted return -> reversal bookkeeping entry" \
  "$(sql "select count(*) from pg.core.bookkeeping_entry where id='bke_${WID}_returned';")" "1"
check "wire accepted return -> wire_transfer.returned event" \
  "$(sql "select count(*) from pg.core.event where id='evt_${WID}_returned' and code='wire_transfer.returned';")" "1"
check "ach settle -> evidence pair" \
  "$(sql "select count(*) from pg.core.bookkeeping_entry where id='bke_${AID}_settled';")" "1"
check "ach late return -> reversal evidence pair" \
  "$(sql "select count(*) from pg.core.event where id='evt_${AID}_returned' and code='ach_transfer.returned';")" "1"

echo "-- 23. each card capture books its own delta --"
CA=$(new_account 5000000 card-art)
ST=$(api POST /payments/card/authorize card-art "{\"source_account_id\":\"$CA\",\"amount_cents\":100000,\"merchant\":\"Evidence Cafe\"}")
CID=$(jget id)
check "authorize alone books nothing (hold, not movement)" \
  "$(sql "select count(*) from pg.core.bookkeeping_entry where id like 'bke_${CID}%';")" "0"
curl -sS -o /tmp/e2e_body -X POST "$API/payments/card/$CID/capture" "${AUTH[@]}" -d '{"amount_cents":30000}'
check "first capture -> entry books the 30000 delta" \
  "$(sql "select amount from pg.core.bookkeeping_entry where id='bke_${CID}_captured_c30000';")" "30000"
curl -sS -o /tmp/e2e_body -X POST "$API/payments/card/$CID/capture" "${AUTH[@]}"
check "final capture -> second entry books the 70000 delta" \
  "$(sql "select amount from pg.core.bookkeeping_entry where id='bke_${CID}_captured_c100000';")" "70000"
check "capture events carry the running total" \
  "$(sql "select count(*) from pg.core.event where id='evt_${CID}_captured_c100000' and code='card_authorization.captured';")" "1"
check "entries sum to what actually moved" \
  "$(sql "select sum(amount) from pg.core.bookkeeping_entry where id like 'bke_${CID}_captured%';")" "100000"


# ------------------------------------ money conservation (card 33)
# Conservation must be checked against the LEDGER (Blnk), not our mirrors: a
# fresh pair of accounts walks every rail, then their authoritative balances
# must equal the arithmetic prediction and NO inflight residue may survive a
# terminal state. Residue = member funds stranded in a hold nobody will ever
# commit or void — invisible to mirror-based checks.
blnk_bal() { # blnk_bal <account_id> <field>
  local bid
  bid=$(sql "select blnk_balance_id from pg.core.account where id='$1';")
  curl -sS "$BLNK_API_URL/balances/$bid" -H "X-blnk-key: $BLNK_API_KEY" \
  | python3 -c "import json,sys;d=json.load(sys.stdin);print(int(d.get('$2') or 0))"
}
echo "-- 24. conservation: every rail, then the ledger must add up --"
CA=$(new_account 1000000 cons-a)   # $10,000
CB=$(new_account 500000  cons-b)   # $5,000
# book: CA -> CB $1,000 (stays inside the instance)
api POST /transfers cons-book "{\"source_account_id\":\"$CA\",\"destination_account_id\":\"$CB\",\"amount_cents\":100000,\"description\":\"cons book\"}" >/dev/null
# wire out $2,000, confirmed in full, then returned -> net zero
api POST /payments/wire/prepare cons-w1 "{\"source_account_id\":\"$CA\",\"amount_cents\":200000,\"beneficiary\":{\"name\":\"Acme\",\"country\":\"US\"},\"purpose\":\"cons wire\"}" >/dev/null
CW1=$(jget id)
curl -sS -o /tmp/e2e_body -X POST "$API/payments/wire/$CW1/confirm" "${AUTH[@]}"
curl -sS -o /tmp/e2e_body -X POST "$API/payments/wire/$CW1/return" "${AUTH[@]}" -d '{"reason":"conservation walk"}'
curl -sS -o /tmp/e2e_body -X POST "$API/payments/wire/$CW1/return/resolve" "${AUTH[@]}" -d '{"outcome":"accepted"}'
# wire held at $1,000 but confirmed for only $400 -> the $600 remainder must be RELEASED
api POST /payments/wire/prepare cons-w2 "{\"source_account_id\":\"$CA\",\"amount_cents\":100000,\"beneficiary\":{\"name\":\"Acme\",\"country\":\"US\"},\"purpose\":\"cons partial\"}" >/dev/null
CW2=$(jget id)
curl -sS -o /tmp/e2e_body -X POST "$API/payments/wire/$CW2/confirm" "${AUTH[@]}" -d '{"amount_cents":40000}'
# ACH out $500 settled then returned late -> net zero
api POST /payments/ach cons-ach "{\"source_account_id\":\"$CA\",\"amount_cents\":50000,\"counterparty\":{\"name\":\"Acme\"},\"window\":\"next_day\"}" >/dev/null
CACH=$(jget id)
curl -sS -o /tmp/e2e_body -X POST "$API/payments/ach/$CACH/settle" "${AUTH[@]}"
curl -sS -o /tmp/e2e_body -X POST "$API/payments/ach/$CACH/return" "${AUTH[@]}" -d '{"return_reason":"R01"}'
# card $300 authorized, captured $100 + $200 (fully drawn)
api POST /payments/card/authorize cons-card "{\"source_account_id\":\"$CA\",\"amount_cents\":30000,\"merchant\":\"Cons Cafe\"}" >/dev/null
CCARD=$(jget id)
curl -sS -o /tmp/e2e_body -X POST "$API/payments/card/$CCARD/capture" "${AUTH[@]}" -d '{"amount_cents":10000}'
curl -sS -o /tmp/e2e_body -X POST "$API/payments/card/$CCARD/capture" "${AUTH[@]}" -d '{"amount_cents":20000}'
# the ledger must now add up exactly:
#   CA = 10000 - 1000(book) - 400(partial wire) - 300(card) = $8,300
#   CB =  5000 + 1000(book)                                 = $6,000
check "CA ledger balance conserves (830000c)"  "$(blnk_bal "$CA" balance)" "830000"
check "CB ledger balance conserves (600000c)"  "$(blnk_bal "$CB" balance)" "600000"
check "CA has NO stranded inflight residue"    "$(blnk_bal "$CA" inflight_debit_balance)" "0"
check "CB has NO stranded inflight residue"    "$(blnk_bal "$CB" inflight_debit_balance)" "0"


# ---------------------------------- GET /control-results (card 47)
# The standalone query surface must AGREE with both the inline results and the
# database — three views of the same evidence, no drift between them.
echo "-- 25. control results surface via GET and agree with DB + inline --"
ST=$(curl -sS -o /tmp/e2e_body -w '%{http_code}' "$API/control-results?event=$CTR_ID" "${AUTH[@]}")
check "GET by event -> HTTP 200" "$ST" "200"
check "GET by event -> carries the CG-CTR-01 that surfaced inline" \
  "$(python3 -c "import json;d=json.load(open('/tmp/e2e_body'));print('yes' if any(r['control_id']=='CG-CTR-01' for r in d['data']) else 'no')")" "yes"
check "GET by event -> row count agrees with the database" \
  "$(python3 -c "import json;d=json.load(open('/tmp/e2e_body'));print(len(d['data']))")" \
  "$(sql "select count(*) from pg.core.control_result where event='$CTR_ID';")"
ST=$(curl -sS -o /tmp/e2e_body -w '%{http_code}' "$API/control-results?control_id=CG-VEL-01&decision=block&subject_ref=$RICH_B" "${AUTH[@]}")
check "GET filtered to this run's velocity block finds it" \
  "$(python3 -c "import json;d=json.load(open('/tmp/e2e_body'));print(len(d['data']))")" \
  "$(sql "select count(*) from pg.core.control_result where control_id='CG-VEL-01' and decision='block' and subject_ref='$RICH_B';")"
ST=$(curl -sS -o /tmp/e2e_body -w '%{http_code}' "$API/control-results?decision=maybe" "${AUTH[@]}")
check "an unknown decision is refused (400), never an empty 'no findings'" "$ST" "400"


# --------------------------------- phase-0 platform surface (02/03/04/08/09)
echo "-- 26. platform: envelope, version, changelog, pagination, guards --"
ST=$(curl -sS -o /tmp/e2e_body -w '%{http_code}' "$API/definitely-not-a-route" "${AUTH[@]}")
check "unknown route -> 404 typed envelope"     "$ST" "404"
check "envelope carries type/request_id/doc_url" \
  "$(python3 -c "import json;d=json.load(open('/tmp/e2e_body'));print('yes' if d.get('type')=='not_found' and d.get('request_id') and str(d.get('doc_url','')).startswith('https') else 'no')")" "yes"
VH=$(curl -sSi "$API/changelog" "${AUTH[@]}" | grep -ci "x-api-version:")
check "X-API-Version header on responses"       "$VH" "1"
curl -sS -o /tmp/e2e_body "$API/changelog" "${AUTH[@]}"
check "changelog leads with the current version" \
  "$(python3 -c "import json;d=json.load(open('/tmp/e2e_body'));print(d['data'][0]['version'])")" "3.0.0"
curl -sS -o /tmp/e2e_body "$API/control-results?limit=1" "${AUTH[@]}"
# URL-encode: timestamptz cursors carry '+00:00', and a raw '+' decodes to a space
PAGE_AFTER=$(python3 -c "import json,urllib.parse;d=json.load(open('/tmp/e2e_body'));print(urllib.parse.quote(d['next_after']) if d['has_more'] else '')")
PAGE1_ID=$(python3 -c "import json;d=json.load(open('/tmp/e2e_body'));print(d['data'][0]['id'])")
check "page 1 signals has_more with a cursor"   "$([ -n "$PAGE_AFTER" ] && echo yes)" "yes"
curl -sS -o /tmp/e2e_body "$API/control-results?limit=1&after=$PAGE_AFTER" "${AUTH[@]}"
check "page 2 advances past page 1" \
  "$(python3 -c "import json;d=json.load(open('/tmp/e2e_body'));print('yes' if d['data'] and d['data'][0]['id'] != '$PAGE1_ID' else 'no')")" "yes"
ST=$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$API/sandbox/reset" "${AUTH[@]}" -d '{}')
check "reset without confirm token -> 400"      "$ST" "400"
ST=$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$API/sandbox/simulate/wire/whatever" "${AUTH[@]}" -d '{}')
check "unfilled simulate route -> typed 501"    "$ST" "501"
SIM=$(new_account 200000 sim-alias)
ST=$(api POST /sandbox/simulate/card/authorize sim-card "{\"source_account_id\":\"$SIM\",\"amount_cents\":10000,\"merchant\":\"Sim Cafe\"}")
check "simulate card authorize aliases the live rail" "$ST" "201"


# --------------------------------------------- entity chain (cards 19-24)
echo "-- 27. entities: create all four types, machine emits, owners, locks --"
ST=$(api POST /entities ent-p "{\"type\":\"person\",\"name\":\"Ada Member\",\"date_of_birth\":\"1990-01-01\"}")
check "person creates -> 201"                "$ST" "201"
check "person starts PENDING"                "$(jget status)" "pending"
ENT_P=$(jget id)
ST=$(api POST /entities ent-b "{\"type\":\"business\",\"name\":\"Acme LLC\",\"tin\":\"12-3456789\"}")
ENT_B=$(jget id)
api POST /entities ent-t "{\"type\":\"trust\",\"name\":\"Ada Family Trust\",\"jurisdiction\":\"MA\"}" >/dev/null
api POST /entities ent-j "{\"type\":\"joint\",\"name\":\"Ada + Grace Joint\"}" >/dev/null
check "business/trust/joint all created"     "$ST" "201"
ST=$(curl -sS -o /tmp/e2e_body -w '%{http_code}' -X POST "$API/entities/$ENT_P/transition" "${AUTH[@]}" -d '{"to":"active"}')
check "pending -> active is legal"           "$(jget status)" "active"
check "the transition left an event" \
  "$(sql "select count(*) from pg.core.event where code='entity.active' and resource_id='$ENT_P';")" "1"
ST=$(curl -sS -o /tmp/e2e_body -w '%{http_code}' -X POST "$API/entities/$ENT_P/transition" "${AUTH[@]}" -d '{"to":"pending"}')
check "illegal transition -> 400/409"        "$([ "$ST" = "400" ] || [ "$ST" = "409" ] && echo yes)" "yes"
ST=$(curl -sS -o /tmp/e2e_body -w '%{http_code}' -X POST "$API/entities/$ENT_B/owners" "${AUTH[@]}" -d "{\"owner_entity_id\":\"$ENT_P\",\"ownership_percent\":25}")
check "25% owner recorded on the business"   "$(python3 -c "import json;d=json.load(open('/tmp/e2e_body'));print(d['owners'][0]['percent'])")" "25"
curl -sS -o /tmp/e2e_body "$API/entities?type=business&limit=5" "${AUTH[@]}"
check "unified list filters by type" \
  "$(python3 -c "import json;d=json.load(open('/tmp/e2e_body'));print('yes' if d['data'] and all(r['type']=='business' for r in d['data']) else 'no')")" "yes"
LOCKA=$(new_account 100000 lock-demo)
curl -sS -o /tmp/e2e_body -X POST "$API/accounts/$LOCKA/lock" "${AUTH[@]}" -d '{"lock_type":"compliance","reason":"BSA review"}'
check "compliance lock leaves state intact"  "$(jget status)" "open"
check "the lock is logged" \
  "$(sql "select count(*) from pg.core.event where code='account.locked' and resource_id='$LOCKA';")" "1"

# ---------------------------------------- account numbers (cards 26-29)
echo "-- 28. numbers: 3-8-1 Luhn, many per account, canceled never reissued --"
NUMA=$(new_account 100000 num-demo)
curl -sS -o /tmp/e2e_body -X POST "$API/accounts/$NUMA/numbers" "${AUTH[@]}" -d '{}'
N1=$(jget id)
AN1=$(jget account_number)
check "minted number is 12 digits"           "$(python3 -c "import re;print('yes' if re.fullmatch(r'\\d{12}','$AN1') else 'no')")" "yes"
check "Luhn check digit verifies" \
  "$(python3 -c "
s='$AN1'[:11]; want=int('$AN1'[11])
t=0
for pos,ch in enumerate(reversed(s), start=1):
    d=int(ch)
    if pos%2==1:
        d*=2
        if d>9: d-=9
    t+=d
print('yes' if (10-t%10)%10==want else 'no')")" "yes"
curl -sS -o /tmp/e2e_body -X POST "$API/accounts/$NUMA/numbers" "${AUTH[@]}" -d '{"cu_direct":true}'
check "CU-direct mints under prefix 000"     "$(python3 -c "print('yes' if '$(jget account_number)'.startswith('000') else 'no')")" "yes"
curl -sS -o /tmp/e2e_body -X POST "$API/accounts/$NUMA/numbers" "${AUTH[@]}" -d '{}'
curl -sS -o /tmp/e2e_body "$API/accounts/$NUMA/numbers" "${AUTH[@]}"
check "one account carries multiple distinct pairs" \
  "$(python3 -c "
import json;d=json.load(open('/tmp/e2e_body'))
pairs=[(r['routing_number'],r['account_number']) for r in d['data']]
print('yes' if len(pairs)>=3 and len(set(pairs))==len(pairs) else 'no')")" "yes"
ST=$(curl -sS -o /tmp/e2e_body -w '%{http_code}' -X POST "$API/account-numbers/$N1/transition" "${AUTH[@]}" -d '{"to":"canceled"}')
check "a number cancels"                     "$(jget status)" "canceled"
ST=$(curl -sS -o /tmp/e2e_body -w '%{http_code}' -X POST "$API/account-numbers/$N1/transition" "${AUTH[@]}" -d '{"to":"active"}')
check "canceled is forever -> 409"           "$ST" "409"
check "uniqueness spans every status (DB-wide, no pair ever reused)" \
  "$(sql "select count(*) - count(distinct routing_number || ':' || account_number) from pg.core.account_number;")" "0"


# ------------------------------------------------ KYC + OFAC floor (39-42)
echo "-- 29. KYC: adapter, sims, providers, and the OFAC floor --"
api POST /entities kyc-p "{\"type\":\"person\",\"name\":\"Grace Applicant\",\"date_of_birth\":\"1992-03-03\"}" >/dev/null
KENT=$(jget id)
ST=$(curl -sS -o /tmp/e2e_body -w '%{http_code}' -X POST "$API/entities/$KENT/verifications" "${AUTH[@]}" -d '{}')
check "KYC run -> 201 through the adapter"    "$ST" "201"
check "default provider approved"             "$(jget status)" "approved"
KVER=$(jget id)
check "clean pass still leaves OFAC evidence" \
  "$(sql "select count(*) from pg.core.control_result where event='$KVER' and control_id='CG-OFAC-01' and decision='pass';")" "1"
curl -sS -o /tmp/e2e_body -X POST "$API/entities/$KENT/verifications" "${AUTH[@]}" -d '{"simulate":"deny"}'
check "simulated deny is denied"              "$(jget status)" "denied"
for P in socure middesk; do
  curl -sS -o /tmp/e2e_body -X POST "$API/entities/$KENT/verifications" "${AUTH[@]}" -d "{\"provider\":\"$P\"}"
  check "provider $P works through the adapter" "$(jget provider)" "$P"
done
api POST /entities kyc-sdn "{\"type\":\"person\",\"name\":\"SDN TEST SUBJECT\",\"date_of_birth\":\"1980-01-01\"}" >/dev/null
SDNENT=$(jget id)
curl -sS -o /tmp/e2e_body -X POST "$API/entities/$SDNENT/verifications" "${AUTH[@]}" -d '{"attestation":{"partner":"fintech-x","trust_level":"full"}}'
check "OFAC hit denies EVEN with full-trust attestation" "$(jget status)" "denied"
SDNVER=$(jget id)
check "the floor rejection is evidenced" \
  "$(sql "select count(*) from pg.core.control_result where event='$SDNVER' and control_id='CG-OFAC-01' and decision='reject';")" "1"
check "the OFAC hit raised its alert" \
  "$(sql "select count(*)>0 from pg.core.bsa_alert where alert_type='ofac' and details like '%$SDNENT%';")" "true"


echo
echo "== $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ] || exit 1
