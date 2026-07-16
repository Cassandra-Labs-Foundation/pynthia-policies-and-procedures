# blnk-reconcile edge function

Scheduled reconciler invoked by `pg_cron` via `pg_net` every 5 minutes. Blnk is the
ledger source of truth; the `core` schema holds cached mirrors. With webhooks
disabled, this function is the authoritative sync path: it advances stale
transaction-status mirrors and corrects balance drift.

## Auth

`verify_jwt = false` (configured in `config.toml`). Requests must include header
`X-Reconcile-Key` matching the `RECONCILE_SECRET` function secret. Missing or
wrong key → `401`. Only `POST` is accepted (`405` otherwise).

## Environment

| Variable | Role |
|---|---|
| `RECONCILE_SECRET` | Shared secret with the cron job (`X-Reconcile-Key`) |
| `BLNK_API_URL`, `BLNK_API_KEY` | Blnk REST API (via `blnkConfigFromEnv()`) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected; service-role client on `core` |

## Invocation

```bash
supabase functions serve blnk-reconcile --no-verify-jwt

curl -sS -X POST http://localhost:54321/functions/v1/blnk-reconcile \
  -H "X-Reconcile-Key: $RECONCILE_SECRET"
```

Production: `pg_cron` schedules `net.http_post` to the deployed function URL
with the same header.

## Sweeps (25 rows each, oldest `synced_at` / `balance_synced_at` first)

1. **Transaction mirrors** (`ach_transfer`, `wire_transfer`, `transfer`) — rows
   with pending `blnk_status` and a `blnk_transaction_id`. Fetches Blnk status;
   updates on change. `INFLIGHT` parents resolve via child transactions (VOID
   wins, else APPLIED).

2. **Card authorization** — same pattern on `blnk_inflight_id`; APPLIED children
   also set `blnk_committed_amount` to the sum of child `precise_amount` values.

3. **Balance drift** (`account`) — compares cached `balance` to Blnk
   `getBalance()`. On mismatch, Blnk wins, a `blnk.balance_drift` event is
   recorded, and `balance_synced_at` is refreshed. On match, only
   `balance_synced_at` is updated.

4. **Sync state** — upserts `blnk_sync_state` (`resource = reconcile`) with run
   summary counts.

Partial progress returns `200` with a non-empty `errors` array.

## Type-check

```bash
deno check supabase/functions/blnk-reconcile/index.ts
deno lint supabase/functions/blnk-reconcile/
```
