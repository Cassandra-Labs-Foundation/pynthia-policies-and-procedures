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
| `index.ts` | HTTP entry: signature verify, inbox insert, hand off to dispatch |
| `handlers.ts` | event → `core` writes. Shared with `blnk-reconcile`'s inbox re-dispatch |
| `types.ts` | Blnk webhook payload shapes (`data` treated as a loose contract) |
| `handlers.test.ts` | hermetic tests for the dispatch table |
| `deno.json` | import map + lint/fmt |

The handlers are a separate module from the HTTP entry on purpose: the reconciler
re-drives stalled inbox rows through the *same* `dispatch`, and Blnk never
retries a delivery, so the re-driver is the only second chance an event gets. It
must not be a second copy of the logic.

## Handled events

| Event | Effect |
|---|---|
| `transaction.applied\|inflight\|void\|rejected\|scheduled` | update the money row's `blnk_status`/`synced_at` (+ `blnk_committed_amount` on card capture); `applied` also refreshes the `account.balance` mirror |
| `balance.created` | → `account.blnk_balance_id` (+ mirror `balance`) |
| `balance.monitor` | → `bsa_alert` via `raiseAlert`, with BSA-06's triage clock started |
| `reconciliation.completed\|failed` | advance `blnk_sync_state`; unmatched items and failures open a `finding` |
| `bulk_transaction.applied\|inflight\|failed` | iterate inline constituents; `failed` opens a `finding` |
| `system.error` | → `finding` (nothing else surfaces Blnk-internal failures) |

Unlisted events are stored and marked `skipped`. Remaining gaps — `control_result`
rows for monitor trips, matched-result pull into `bookkeeping_entry`, and the
id-only `bulk_transaction` form — are tracked in [TODO.md](TODO.md).

## Routing contract (Phase-2 writers must honor)

The function routes an event back to the exact `core` row two ways:

1. **Preferred** — the transaction/balance was created with
   `meta_data.core_resource = { "table": "ach_transfer", "id": "<row id>" }`.
2. **Fallback** — match `blnk_reference` on the row against the event's
   `reference` (so stamp `blnk_reference` = our resource id when creating the
   Blnk object).

Set at least one, or events land in the inbox as `failed` (no target row).

> **Blnk does not round-trip the reference on queued moves.** `POST
> /transactions` returns a QUEUED *parent* holding the reference you sent; when
> it applies, Blnk creates a **child** (`parent_transaction` → the parent) whose
> reference is yours with **`_q`** appended, and the webhook fires for the child.
> `coreReference()` in `handlers.ts` strips that suffix so the fallback can still
> match, and the row keeps the canonical un-suffixed spelling. Until 2026-08-11
> it did not, so the fallback was dead for every queued transaction — only route
> 1 worked. Prefer route 1 regardless; it is the one that never depends on how
> Blnk rewrites references.

Note also that `blnk_transaction_id` ends up holding the **child** id, while the
command path persists the **parent** id from the POST response. The child is the
one that reaches a terminal status — the parent stays `QUEUED` forever — so the
webhook's value is the useful one, and a row that never receives a delivery will
keep a parent id the reconciler re-polls as non-terminal.

## Configuration

- `supabase/config.toml` sets `verify_jwt = false` for this function (Blnk signs
  its own requests) and exposes the `core` schema to PostgREST.
- **Secrets** (Supabase Vault / function secrets):
  - `BLNK_WEBHOOK_SECRET` — Blnk `server.secret_key`.
  - `BLNK_API_URL`, `BLNK_API_KEY` — *optional*; enable the balance-mirror
    refresh on `transaction.applied` (needs scope `balances:read`). Absent, that
    refresh logs and skips and the reconciler's drift sweep covers it.
  - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — auto-injected by the runtime;
    the service-role key bypasses RLS to write `core`.

## Enabling deliveries — order matters

The function **500s on every request while `BLNK_WEBHOOK_SECRET` is unset**, and
Blnk **never retries a non-2xx delivery**. Setting the URL in Blnk before the
secret exists on our side therefore loses every event in that window, for good.
So: secret first, prove it with a signed POST, *then* point Blnk at us.

```bash
supabase secrets set BLNK_WEBHOOK_SECRET=<blnk instance secret key>
supabase functions deploy blnk-webhook
```

Verify with the signed-request recipe under [Local test](#local-test) against the
deployed URL — expect `{"ok":true,...}`, and a bad signature to give `401`. A
`500` mentioning `BLNK_WEBHOOK_SECRET unset` means stop and fix that first.

Only then, in the Blnk Cloud dashboard:

> Settings → Instances → ••• → Environment variables → set `BLNK_WEBHOOK_URL` to
> `https://<project-ref>.functions.supabase.co/blnk-webhook`
> (and `BLNK_WEBHOOK_HEADERS` for any custom headers). Saving **restarts the
> instance** — which also restarts the REST base the command path uses, so pick
> a quiet window.

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
