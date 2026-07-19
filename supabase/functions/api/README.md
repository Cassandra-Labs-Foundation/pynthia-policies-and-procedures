# api — demo BaaS API slice

Supabase Edge Function exposing a minimal account + book-transfer API for demos.
Auth is a single shared `X-Api-Key` (not per-partner JWT).

## Auth

Every request requires header `X-Api-Key` matching the `DEMO_API_KEY` env var.
Missing or wrong key → `401`.

## Endpoints

Base URL (local): `http://127.0.0.1:54321/functions/v1/api`

### POST /accounts

```bash
curl -sS -X POST "$BASE/accounts" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: $DEMO_API_KEY" \
  -d '{"account_type":"checking","opening_deposit_cents":10000}'
```

### GET /accounts/{id}

```bash
curl -sS "$BASE/accounts/acct_..." -H "X-Api-Key: $DEMO_API_KEY"
```

### POST /transfers

`Idempotency-Key` header is required.

```bash
curl -sS -X POST "$BASE/transfers" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: $DEMO_API_KEY" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "source_account_id": "acct_...",
    "destination_account_id": "acct_...",
    "amount_cents": 5000,
    "description": "demo transfer"
  }'
```

### GET /transfers/{id}

```bash
curl -sS "$BASE/transfers/tr_..." -H "X-Api-Key: $DEMO_API_KEY"
```

### Wires — two-phase (Blnk inflight)

`prepare` places a **hold**; funds only move on `confirm`. That is what
satisfies dual control: money cannot leave on a single call.

```bash
# prepare -> 201, status "submitted" (held). Idempotency-Key required.
curl -sS -X POST "$BASE/payments/wire/prepare" -H "X-Api-Key: $DEMO_API_KEY" \
  -H "Idempotency-Key: $(uuidgen)" -H "Content-Type: application/json" \
  -d '{"source_account_id":"acct_...","amount_cents":1100000,
       "beneficiary":{"name":"Acme Corp"},"purpose":"invoice 42"}'

curl -sS -X POST "$BASE/payments/wire/{id}/confirm" -H "X-Api-Key: $DEMO_API_KEY"   # commit
curl -sS -X POST "$BASE/payments/wire/{id}/cancel"  -H "X-Api-Key: $DEMO_API_KEY"   # void, releases the hold
```

`confirm` accepts an optional `{"amount_cents": N}` to settle for **less** than
was held (partial commit); it must not exceed the held amount.

**Domestic only.** This core sends Fedwire only. A beneficiary carrying a
`swift_code`/`bic`, or a `country` other than `US`, is refused with
`422 international_wire_not_supported` — *before* the idempotency claim, so an
unsendable wire never consumes a key, creates a row, or strands funds in a hold
that can never be sent.

### ACH — two-phase (Blnk inflight)

Submission places a hold rather than moving funds: an entry can still be
returned (R01, R02, …) days later, so holding keeps the ledger honest until the
batch settles.

```bash
# submit -> 201, status "submitted" (held). window: same_day|next_day|two_day
curl -sS -X POST "$BASE/payments/ach" -H "X-Api-Key: $DEMO_API_KEY" \
  -H "Idempotency-Key: $(uuidgen)" -H "Content-Type: application/json" \
  -d '{"source_account_id":"acct_...","amount_cents":250000,
       "counterparty":{"name":"Acme Vendor"},"window":"next_day"}'

curl -sS -X POST "$BASE/payments/ach/{id}/settle" -H "X-Api-Key: $DEMO_API_KEY"  # commit
curl -sS -X POST "$BASE/payments/ach/{id}/return" -H "X-Api-Key: $DEMO_API_KEY" \
  -H "Content-Type: application/json" -d '{"return_reason":"R01"}'               # void
```

Re-settling an already-settled entry **replays** (`Idempotent-Replayed: true`)
rather than erroring, so duplicate settlement notifications are safe. Resolving
a row that is not `submitted` is `409 invalid_state`.

### GET /control-results

The standalone query surface for control evidence (inline `control_results`
show what fired on one request; this queries across requests). Newest first.

```bash
curl -sS "$BASE/control-results?control_id=CG-VEL-01&decision=block&limit=20" \
  -H "X-Api-Key: $DEMO_API_KEY"
```

Filters: `control_id`, `decision` (pass|hold|block|reject|clear), `subject_ref`
(account id), `event` (resource id). `limit` 1-200, default 50. An unknown
`decision` is a 400, never an empty "no findings".

## Idempotency (POST /transfers)

`request_hash` is a SHA-256 hex digest of the canonical transfer body. Same
`Idempotency-Key` + same body → replay: stored response returned with
`Idempotent-Replayed: true`. Same key + different body → `409 idempotency_key_reused`.
If a prior attempt died mid-flight (`response_status` still null), the claim is
**resumed** using the stored transfer id (`blnk_reference`). `502 bank_error`
outcomes are not stored so the claim stays resumable.

## Control gate

Runs on **every money-movement rail** — book transfers, wires and ACH share one
gate (`runGate`), parameterised by a `GateResource`. A new rail that does not
call it is a compliance gap, not a TODO.

| Control    | Trigger                                            | Effect                          |
|------------|----------------------------------------------------|---------------------------------|
| CG-VEL-01  | Source daily outbound > $25k, **summed across rails** | **Block** — `422 velocity_limit_exceeded` |
| CG-CTR-01  | Single transaction > $10k                          | **Alert only** — CTR BSA alert  |
| CG-STR-01  | Daily **inflow** to one account > $10k with no single transaction above it | **Alert only** — structuring BSA alert |
| CG-STR-02  | Daily **outflow** from one account > $10k, across rails, with no single transaction above it | **Alert only** — structuring BSA alert |
| CG-NSF-01  | Source balance < amount                            | **Reject** — `422 insufficient_funds` |

Velocity aggregates `transfer` + `wire_transfer` + `ach_transfer` via
`originator -> {account_id}`, so a member cannot evade the daily cap by
splitting across rails.

CG-STR-01 and CG-STR-02 catch what CG-CTR-01 structurally cannot: the
per-transaction gate sees one transaction at a time, so staying under $10k on
every one while moving a reportable amount in a day would otherwise go
unflagged. Both are evaluated only when the per-transaction gate stayed silent.

They differ by direction, because the two sides need different aggregation
keys. CG-STR-01 sums **inflow to a destination account**, so it is book-side
only — wires/ACH/card have no destination row, since funds leave for an
`@external` balance. CG-STR-02 sums **outflow from the source account across
every rail**, which is what catches an outbound structurer on exactly those
rails. CG-VEL-01 watches the same outflow but only blocks at $25k; CG-STR-02
covers the $10k reportability line beneath it.

The gate runs **before** funds are held, so a blocked two-phase payment never
creates an inflight hold.

## Demo caveats

- `X-Api-Key` is single-tenant demo auth, not per-partner credentials.
- Velocity and balance checks are read-then-write with no serialization or
  locking; production would need a DB-level reservation (architecture D28).
- No rate limiting or pagination.
- Card authorization is **not implemented yet**; the schema and its state
  machine are in place (`20260718000300`) but no endpoint exists.
