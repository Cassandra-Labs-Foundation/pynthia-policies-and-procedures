# blnk-webhook — outstanding work

Blnk Cloud shipped self-serve global webhooks in July 2026, so the items that
were dormant waiting on delivery are now built. The handlers live in
[handlers.ts](handlers.ts) (split out of `index.ts` so `blnk-reconcile` can
re-drive the identical dispatch), covered by [handlers.test.ts](handlers.test.ts),
and cross-ref the [pgTAP suite](../../tests/README.md) and
[integration plan](../../blnk-integration-plan.md).

**Not yet done — the switch itself.** See plan §6 for the runbook. In short:
set `BLNK_WEBHOOK_SECRET` and verify a signed test POST returns 200 *before*
pasting the receiver URL into `BLNK_WEBHOOK_URL`, because Blnk never retries a
non-2xx and the function 500s while that secret is unset.

## 1. Balance-mirror refresh on `transaction.applied` — BUILT

`refreshBalanceMirrors` fetches `GET /balances/{id}` for each real (non-`@`)
`source`/`destination` and updates `core.account` (`balance`,
`balance_synced_at`) by `blnk_balance_id`.

- Needs `BLNK_API_URL` / `BLNK_API_KEY` (scope `balances:read`) in Vault. When
  they are absent the refresh **logs and skips** rather than failing the
  delivery — a lost delivery is permanent, a stale mirror is not.
- The `blnk-reconcile` balance-drift sweep remains the authority; this is the
  fast path, not the guarantee.
- **Controls:** GL/mirror integrity (MB-05/06), account balance accuracy.

## 2. `balance.monitor` → `bsa_alert` — BUILT

Resolves `balance_id` → `account`, then delegates to `raiseAlert` (in
[`../api/bsa.ts`](../api/bsa.ts)) rather than writing `bsa_alert` directly, so
BSA-06's 2-business-day triage clock and the `bsa_alert.created` /
`bsa_alert.triage.timer` events come from one implementation.

- `alert_type` is read from `meta_data.alert_type` on the monitor, defaulting to
  `balance_monitor`. Only the configuring side knows a monitor's compliance
  purpose, so it is passed in rather than inferred from the raw condition.
- **Configure the monitors in Blnk** (one per threshold) — this handler only
  translates trips into alerts.
- A trip that cannot be resolved to an account **throws**, so the inbox marks it
  `failed` and the reconciler re-drives it. A dropped tripwire is worse than a
  noisy one.
- **Controls:** BSA-06, cash (CA-*), liquidity/concentration (ERM), CTR.

Remaining: `control_result` rows tying a trip to its control are still not
written — `control_result.control_id` needs a mapping from monitor → control id
that does not exist yet.

## 3. `reconciliation.completed` / `.failed` — PARTIALLY BUILT

Both advance `core.blnk_sync_state` (`resource='reconciliation'`,
`last_cursor`=`reconciliation_id`). `failed` opens a high-severity
`core.finding`; `completed` with `unmatched_count > 0` opens a medium one.

Remaining: pulling **matched** results into `core.bookkeeping_entry`. Blnk stores
them per-transaction in `meta_data.reconciled`, so it needs a paged transaction
fetch keyed off the reconciliation id plus a `bookkeeping_entry` mapping that
neither the plan nor the schema pins down. The cursor already advances, so a
later backfill can resume from `last_cursor`.

## 4. `bulk_transaction.applied` / `inflight` / `failed` — BUILT

`applied`/`inflight` iterate inline constituents through `applyTransaction`,
collecting per-constituent failures so one bad item cannot strand its siblings.
`failed` opens a finding.

Known gap: when Blnk sends **ids only** rather than inline transactions, the
event is marked `skipped`. Resolving it would mean N API reads inside a webhook
that must return fast and is never retried; the reconciler re-polls non-terminal
rows anyway.

## 5. Inbox reconciler / retry worker — BUILT

[`../blnk-reconcile/`](../blnk-reconcile/index.ts), scheduled by
`20260702000600_blnk_reconcile_cron.sql` (pg_cron → pg_net every 5 min):
non-terminal status sweep, balance-drift check emitting `core.event` code
`blnk.balance_drift`, `blnk_sync_state` bookkeeping.

**Inbox re-dispatch** (`sweepInbox`) re-drives `core.blnk_event` rows in
`status IN ('received','failed')` older than `INBOX_STALE_MINUTES`, and emits
`core.event` code `blnk.inbox_backlog` once the failed count crosses
`INBOX_FAILED_ALERT_THRESHOLD`. It runs **last** in the reconcile pass, so the
earlier sweeps may have written the very row a failed event was waiting on.

## 6. Phase-2 writer contract (enforce upstream) — helper BUILT, adoption pending

The shared helper exists: [`../_shared/blnk.ts`](../_shared/blnk.ts) (tests in
`blnk.test.ts`). It enforces `reference = table:id[:leg]` +
`meta_data.core_resource` on every write, sends integer-cents `precise_amount`
only (Blnk rejects `amount`+`precise_amount` together; `description` is
required), dedups duplicate references via exact-match search, and returns
mirror objects for the caller to persist. Live-verified 2026-07-13
(inflight → void round-trip on the dev instance).

Remaining:
- **Key scopes**: the command-path key needs `transactions:read` (by-id reads,
  reconciler) and `search:write` (dedup-by-reference lookup) in addition to the
  write scopes. The webhook's balance refresh additionally needs `balances:read`.
- Adopt the helper in every money-movement writer as they're built; add a
  check/test that writers don't call Blnk directly.

## 7. Hardening — P3

- Secret rotation for `BLNK_WEBHOOK_SECRET` (support two active secrets during
  rotation).
- Metrics/alerting on `blnk_event` failure rate and processing lag. Partially
  addressed by `blnk.inbox_backlog`; there is still no lag metric.
- Backfill path using `blnk_sync_state.last_cursor` for cold-start / gap recovery.
- **Per-trip identity for `balance.monitor`.** `eventKey` discriminates trips by
  `monitor_id` + `triggered_at`. If Blnk turns out to send neither, repeated
  trips of one monitor collapse into a single inbox key and the later ones are
  dropped as duplicates. Verify against a real payload once deliveries start,
  and fall back to the balance-monitors poll if that is the case.
