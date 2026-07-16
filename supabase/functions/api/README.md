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

## Idempotency (POST /transfers)

`request_hash` is a SHA-256 hex digest of the canonical transfer body. Same
`Idempotency-Key` + same body → replay: stored response returned with
`Idempotent-Replayed: true`. Same key + different body → `409 idempotency_key_reused`.
If a prior attempt died mid-flight (`response_status` still null), the claim is
**resumed** using the stored transfer id (`blnk_reference`). `502 bank_error`
outcomes are not stored so the claim stays resumable.

## Control gate (POST /transfers)

| Control    | Trigger                         | Effect                          |
|------------|---------------------------------|---------------------------------|
| CG-VEL-01  | Source daily outbound > $25k    | **Block** — `422 velocity_limit_exceeded` |
| CG-CTR-01  | Amount > $10k                   | **Alert only** — CTR BSA alert  |
| CG-NSF-01  | Source balance < amount         | **Reject** — `422 insufficient_funds` |

## Demo caveats

- `X-Api-Key` is single-tenant demo auth, not per-partner credentials.
- Velocity and balance checks are read-then-write with no serialization or
  locking; production would need a DB-level reservation (architecture D28).
- No rate limiting or pagination.
