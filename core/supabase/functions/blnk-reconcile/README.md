# blnk-reconcile edge function

Scheduled reconciler invoked by `pg_cron` via `pg_net` every 5 minutes. Blnk is the
ledger source of truth; the `core` schema holds cached mirrors. This function is
the authoritative sync path: it advances stale transaction-status mirrors,
corrects balance drift, and re-drives the webhook inbox.

It stays authoritative **even with webhooks live**. Blnk global webhooks are
never retried on a non-2xx, so a delivery we fail to accept is gone permanently —
the push is an optimization, this pull is the guarantee.

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

1. **Stuck rows** (`ach_transfer`, `wire_transfer`, `transfer`) — rows carrying a
   `blnk_reference` breadcrumb but no `blnk_transaction_id`: the Blnk write may
   have landed while the mirror update never did (a crash between
   `recordTransaction` and the settle update). Resolved by get-by-reference;
   rows still unresolved after 30 minutes are flagged for ops.

   There is no longer a **transaction mirror** sweep. It selected rows by
   `core.<rail>.blnk_status`, fetched the ledger, and wrote that column back —
   while never advancing the rail's own `status`, so nothing downstream ever
   acted on what it learned. Migration 20260817000500 dropped the column and
   the sweep with it; `blnk_transaction_id` stays, so ledger state is
   re-derivable for any row on demand via `getTransaction`.

2. **Card authorization** — same pattern on `blnk_inflight_id`; APPLIED children
   also set `blnk_committed_amount` to the sum of child `precise_amount` values.

3. **Balance drift** (`account`) — compares cached `balance` to Blnk
   `getBalance()`. On mismatch, Blnk wins, a `blnk.balance_drift` event is
   recorded, and `balance_synced_at` is refreshed. On match, only
   `balance_synced_at` is updated.

4. **Missing mirrors** — walks recent Blnk transactions (bounded: up to 5 pages
   × 100, cursor-tracked via `blnk_sync_state` `missing_mirror`). Flags via
   `blnk.missing_mirror` events any transaction lacking a `core_resource` writer-
   contract stamp, with an unrecognized `core_resource.table`, or whose mirror
   row is missing from the corresponding core table (allowlist: `ach_transfer`,
   `wire_transfer`, `transfer`, `card_authorization`).

5. **Webhook inbox re-dispatch** (`blnk_event`, 50 rows) — rows still
   `received` or `failed` after `INBOX_STALE_MINUTES` are re-run through the
   *same* `dispatch` the webhook uses (imported from
   `../blnk-webhook/handlers.ts`, which is why that logic is not inside the HTTP
   entrypoint). Re-dispatch is idempotent: every handler underneath upserts on a
   deterministic id. Emits `blnk.inbox_backlog` once the failed count crosses
   `INBOX_FAILED_ALERT_THRESHOLD`.

   Runs **last**, so the sweeps above may already have written the row a failed
   event was waiting on.

6. **Sync state** — upserts `blnk_sync_state` (`resource = reconcile`) with run
   summary counts.

Partial progress returns `200` with a non-empty `errors` array.

## Type-check

```bash
deno check supabase/functions/blnk-reconcile/index.ts
deno lint supabase/functions/blnk-reconcile/
```
