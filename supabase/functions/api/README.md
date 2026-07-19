# api — demo BaaS API slice

Supabase Edge Function exposing a minimal account + book-transfer API for demos.
Auth is a single shared `X-Api-Key` (not per-partner JWT).

## Auth — scoped partner tokens (card 45)

**Breaking as of v4.0.0.** The single shared `X-Api-Key` is replaced by
per-partner tokens.

```bash
curl -sS "$BASE/accounts/acct_..." -H "Authorization: Bearer cass_pt_..."
```

`X-Api-Key` is still read as a legacy header carrying the same token value.

A request is admitted only if **all** of these hold — they are independent so
that one misconfigured field is contained by the others:

| Check | Failure |
|---|---|
| token hashes to a live row **on this instance** | `401` |
| owning partner is `active` | `401` |
| actor class may reach this endpoint | `403 insufficient_scope` |
| endpoint is in the token's allowlist | `403 insufficient_scope` |
| endpoint's tier is in the token's tier list | `403 insufficient_scope` |

`401` vs `403` is deliberate: `401` means *we don't know you*, `403` means
*we know you, but not here*. Every authentication failure — unknown, revoked,
expired, or **valid on another instance** — returns a byte-identical `401`, so
holding one token tells you nothing about which instances it works on.

**Scope.** `allowed_endpoints` entries are route identities carrying `{id}`
placeholders (`POST /payments/wire/{id}/confirm`), never concrete paths, so
scope cannot be widened by choosing a resource id. `*` grants everything;
`POST /payments/*` matches on segment boundaries.

**Tiers** (D14): `read`, `write`, `realtime` (card auth), `bulk`. Each route
declares one and every response carries `X-RateLimit-Tier`. Tier is checked
independently of the endpoint list — a `read`-only token cannot reach a write
endpoint even with `*` scope. Rate *limits* themselves are a separate card;
only the tier dimension is enforced today.

**Actor classes** (D23): `partner`, `cu_admin`, `pynthia_ops`. Ops-only
endpoints (`/sandbox/reset`, `/events/deliver`, `/sandbox/event-sink`) are
closed to partners regardless of scope breadth.

### Row-level ownership

Instance binding answers *may this token authenticate here*; `partner_id`
answers *may this partner touch this row*. Both apply — they are layered, not
alternatives.

Rows carry `partner_id` (NOT NULL, FK to `core.partner`) on `account`,
`entity`, `transfer`, `wire_transfer`, `ach_transfer` and `card_authorization`.
`account_number` deliberately has **no** column: it reaches its owner through
`fk_account_number_account_id`, the one link in this schema where a join is
both correct and indexed.

A partner reading or mutating another partner's row gets **404, not 403** — a
403 would confirm the id exists and hand out an enumeration oracle. This
applies to money movement too: settling, capturing or confirming another
partner's payment is not possible, and no ledger call is made before the row
is found.

`cu_admin` and `pynthia_ops` are **not** confined, per D23's access matrix —
confining them would break the cross-fintech visibility those roles exist for.

**Not partner-scoped, deliberately:** `control_result`, `bsa_alert`, `event`,
`filing`, `case`, `dispute`. These are the instance's compliance record. CTR
aggregation, structuring detection and BSA reporting are obligations of the
chartered credit union across every fintech it hosts; narrowing them per
partner would fragment the view the controls exist to produce — and silently,
since a narrowed aggregate still returns a clean result and still writes a
passing `control_result`. `runGate`'s cross-rail sweeps stay instance-wide for
the same reason.

**Why not RLS.** The edge functions connect as `service_role`, which bypasses
row-level security entirely, so policies written today would enforce nothing
and no test could exercise them. Two enforcement layers where one silently does
nothing is worse than one that visibly does everything. The database still
contributes, but as *integrity* rather than access control: `NOT NULL` plus a
foreign key to `core.partner`, which `service_role` cannot violate either. The
application decides access; the schema guarantees every row has a real owner —
different assertions, so they cannot drift into disagreement. RLS becomes worth
writing in the same change that makes it load-bearing: dropping `service_role`
for a request-scoped role carrying partner identity.

### Issuing a token

```bash
deno run --allow-env --allow-net scripts/issue-token.ts \
  --partner ptnr_demo --actor partner \
  --endpoints 'POST /transfers,GET /accounts/{id}' --tiers read,write \
  --expires-days 90
```

The plaintext prints **once**. Only its SHA-256 is stored — there is no
retrieval path, by design: a database compromise must not be a credential
compromise. Lost tokens are re-issued, not recovered.

### Idempotency is namespaced per partner

`Idempotency-Key` is scoped to the calling partner. It previously was not, and
two partners sending the same key — `order-42`, derived from their own order
numbers — collided, with the second **receiving the first's cached response
body**. If you relied on keys being global, they are not, and were never safe
that way.

### `DEMO_API_KEY`

Still accepted as a bootstrap `pynthia_ops` credential, because the card-16
outbox worker uses it to reach its own `/sandbox/event-sink`. It resolves
through the same pipeline and obeys the same scope checks. **Set
`ALLOW_DEMO_KEY=false` in any real deployment.**

### Required environment

| Variable | Purpose |
|---|---|
| `INSTANCE_ID` | which instance this process is. Absent → every request `500`s |
| `DEMO_API_KEY` | bootstrap credential (optional once real tokens exist) |
| `ALLOW_DEMO_KEY` | `false` disables the bootstrap path |

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

### ACH returns, return codes, and NOC

A return carries a NACHA return code, validated against the recognised set —
an unrecognised code is a `400`, not a stored string that merely *looks* like a
code. It lands in `ach_transfer.return_reason` (its own column since
`20260719000500`; it used to be string-mangled into `window`).

```bash
curl -sS -X POST "$BASE/payments/ach/{id}/return" -H "X-Api-Key: $DEMO_API_KEY" \
  -H "Content-Type: application/json" -d '{"return_reason":"R01"}'
```

`R05`, `R07`, `R10` and `R29` assert the debit was **never authorized**. Those
raise an `unauthorized_ach_return` bsa_alert; ordinary returns (R01 insufficient
funds, R02 account closed, …) do not.

**A NOC is not a return.** `POST /payments/ach/{id}/noc` records a notification
of change: the entry settled and the money moved, and the C-code obliges the
ODFI to correct its stored details for *future* entries. It writes no status and
makes no ledger call — but it does emit a durable event, because "we were told
the account number was wrong and did nothing" is the audit finding it exists to
prevent. The code determines which fields it may correct (`C01` the account
number, `C02` the routing number, `C03` both), so a mismatched `corrections`
object is a `400`.

```bash
curl -sS -X POST "$BASE/payments/ach/{id}/noc" -H "X-Api-Key: $DEMO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"code":"C01","corrections":{"account_number":"9876543210"}}'
```

### Wire rejection vs cancel vs return

Three different ways a wire fails to arrive, kept as three states because they
answer different questions in a Reg J / UCC 4A dispute:

| Transition | Meaning | Ledger |
|---|---|---|
| `POST /payments/wire/{id}/cancel` | *we* withdrew it | void the hold |
| `POST /payments/wire/{id}/reject` | the *network* refused it | void the hold |
| `POST /payments/wire/{id}/return` | it settled, then came back | compensating reversal |

Reject requires a `reason` and only applies to a `submitted` wire. A `completed`
wire cannot be rejected — its funds already left, so it must be *returned*.

### POST /payments/card/{id}/expire

An uncaptured authorization ages out: the hold is voided and the remainder
released. Ledger-identical to a reversal, but a separate terminal state because
a reversal is someone's decision and an expiry is the absence of one — merging
them would make "merchants who never capture" unqueryable. Whatever was already
captured stays captured.

### POST /sandbox/simulate/*

Drive any rail through its lifecycle without a vendor. Every simulate route
**aliases the production writer**, so a simulated transaction takes the same
path as a real one: same `runGate` call sites, same `control_result` rows, same
bookkeeping and event evidence, same Blnk commit or void. There is no
`is_simulation` branch anywhere in the rails — that branch is the reason
simulation harnesses stop being evidence of anything.

```
POST /sandbox/simulate/ach                     POST /sandbox/simulate/wire/prepare
POST /sandbox/simulate/ach/{id}/settle         POST /sandbox/simulate/wire/{id}/confirm
POST /sandbox/simulate/ach/{id}/return         POST /sandbox/simulate/wire/{id}/cancel
POST /sandbox/simulate/ach/{id}/noc            POST /sandbox/simulate/wire/{id}/reject
                                               POST /sandbox/simulate/wire/{id}/return
POST /sandbox/simulate/card/authorize          POST /sandbox/simulate/wire/{id}/return/resolve
POST /sandbox/simulate/card/{id}/capture
POST /sandbox/simulate/card/{id}/reverse
POST /sandbox/simulate/card/{id}/expire
```

A path with no simulation returns the typed `501` and lists what *is* simulated.
Note that the gate is **not** re-run on lifecycle transitions: CG-VEL-01's daily
aggregate already counts rows in `settled`/`captured`/`completed`, so gating
again at settle would count the same dollars twice and spuriously trip the cap.
The gate fires where production fires it — prepare, submit, authorize.

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
