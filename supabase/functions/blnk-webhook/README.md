# blnk-webhook edge function

Ingests [Blnk Cloud webhooks](https://docs.blnkfinance.com/webhooks/overview)
into the Supabase `core` schema using the **inbox pattern**:

1. **Verify** the HMAC-SHA256 signature (`X-Blnk-Signature` / `X-Blnk-Timestamp`,
   signed payload = `timestamp + "." + rawBody`, secret = Blnk `server.secret_key`),
   with a ±5-minute replay window.
2. **Record** the delivery idempotently in `core.blnk_event` (PK dedups retries
   of the same logical event).
3. **Apply** it best-effort to the mapped `core` row (status / balance mirror).
4. **Always 200** once stored — processing errors are marked `failed` on the
   inbox row for a reconciler, never re-driven by webhook retries.

## Files

| File | Role |
|---|---|
| `index.ts` | HTTP entry, signature verify, inbox insert, event dispatch |
| `types.ts` | Blnk webhook payload shapes (`data` treated as a loose contract) |
| `deno.json` | import map + lint/fmt |

## Handled events

`transaction.applied\|inflight\|void\|rejected\|scheduled` → update the money
row's `blnk_status`/`synced_at` (+ `blnk_committed_amount` on card capture);
`identity.created` → `entity.blnk_identity_id`; `balance.created` →
`account.blnk_balance_id` (+ mirror `balance`). Unlisted events are stored and
marked `skipped`. TODOs are flagged inline for `balance.monitor` →
`bsa_alert`/`control_result`, `reconciliation.*`, and `bulk_transaction.*`.

## Routing contract (Phase-2 writers must honor)

The function routes an event back to the exact `core` row two ways:

1. **Preferred** — the transaction/identity/balance was created with
   `meta_data.core_resource = { "table": "ach_transfer", "id": "<row id>" }`.
2. **Fallback** — match `blnk_reference` on the row against the event's
   `reference` (so stamp `blnk_reference` = our resource id when creating the
   Blnk object).

Set at least one, or events land in the inbox as `failed` (no target row).

## Configuration

- `supabase/config.toml` sets `verify_jwt = false` for this function (Blnk signs
  its own requests) and exposes the `core` schema to PostgREST.
- **Secrets** (Supabase Vault / function secrets):
  - `BLNK_WEBHOOK_SECRET` — Blnk `server.secret_key`.
  - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — auto-injected by the runtime;
    the service-role key bypasses RLS to write `core`.

```bash
supabase secrets set BLNK_WEBHOOK_SECRET=<blnk server.secret_key>
supabase functions deploy blnk-webhook
# then register the function URL in Blnk notification config:
#   https://<project-ref>.functions.supabase.co/blnk-webhook
```

## Local test

```bash
supabase functions serve blnk-webhook --no-verify-jwt

# sign a payload the way Blnk does and POST it:
SECRET=testsecret
TS=$(date +%s)
BODY='{"event":"transaction.applied","data":{"transaction_id":"txn_1","reference":"acht-1","status":"APPLIED","meta_data":{"core_resource":{"table":"ach_transfer","id":"<row-id>"}}}}'
SIG=$(printf '%s.%s' "$TS" "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -hex | sed 's/^.* //')
curl -sS -X POST http://localhost:54321/functions/v1/blnk-webhook \
  -H "X-Blnk-Timestamp: $TS" -H "X-Blnk-Signature: $SIG" \
  -H "content-type: application/json" -d "$BODY"
```

Expect `{"ok":true,"status":"processed"}` (or `skipped`/`failed`/`duplicate`).
Bad signature → `401`.

## Type-check

```bash
deno check supabase/functions/blnk-webhook/index.ts
```
