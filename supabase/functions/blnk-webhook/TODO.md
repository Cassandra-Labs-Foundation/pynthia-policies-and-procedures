# blnk-webhook — outstanding work

The scaffold ([index.ts](index.ts)) handles `transaction.*`, `identity.created`,
and `balance.created`. The items below are stubbed as inline `TODO`s and marked
`skipped` at runtime until built. Ordered by priority; each notes the Blnk
payload, the target `core` write, and the compliance control it feeds
(cross-refs the [pgTAP suite](../../tests/README.md) and
[integration plan](../../blnk-integration-plan.md)).

## 1. Balance-mirror refresh on `transaction.applied` — P1

**Why:** transaction payloads carry `source`/`destination` (balance ids) but
**not** the resulting balances, so `account.balance` stays stale after a move.

**Do:** on `transaction.applied`, for each of `data.source` / `data.destination`
that is a real balance (not an `@`-external), call Blnk `GET /balances/{id}`
and update `core.account` (`balance`, `balance_synced_at`) where
`blnk_balance_id` matches.

- New env: `BLNK_API_URL`, `BLNK_API_KEY` (scope `balances:read`), in Vault.
- Idempotent (overwrite with authoritative value). Skip `@`-balances.
- Alternative/complement: a periodic snapshot sync (see §5) instead of per-txn
  fetch, to bound API calls under bulk load.
- **Controls:** GL/mirror integrity (MB-05/06), account balance accuracy.

## 2. `balance.monitor` → `bsa_alert` / `control_result` — P1

**Why:** Blnk balance monitors are our real-time threshold tripwires
(CTR aggregation, cash limits, liquidity, concentration, structuring).

**Payload:** `data` has `balance_id`, the monitor `condition` (field/operator/
value), and the current value.

**Do:**
1. Resolve `balance_id` → `account` (→ `entity`) via `blnk_balance_id`.
2. Upsert `core.bsa_alert`: `alert_type` (from monitor purpose), `entity_hash`,
   `event_id` = inbox id, `requires_lookback`, `status='open'`, start
   `triage_timer` (BSA-06 requires triage within 2 BD — see the deadline test).
3. Optionally write a `core.control_result` row tying the trip to the control.

- Configure the monitors in Blnk (one per threshold); this handler only
  translates trips → alerts.
- **Controls:** BSA-06 (transaction monitoring), cash (CA-*), liquidity/
  concentration (ERM), CTR thresholds.

## 3. `reconciliation.completed` / `reconciliation.failed` → recon + sync_state — P2

**Payload:** `reconciliation_id`, `status`, matched/unmatched counts.

**Do:**
- Update `core.blnk_sync_state` (`resource='reconciliation'`, `last_cursor` =
  `reconciliation_id`, `last_synced_at`).
- On `completed`: pull matched results (Blnk stores them in each transaction's
  `meta_data.reconciled`) into `core.bookkeeping_entry` / recon rows; open a
  `core.finding` (or exception) for unmatched items.
- On `failed`: mark inbox `failed`, raise a `finding`.
- **Controls:** reconciliation controls, GL integrity, trade/settlement.

## 4. `bulk_transaction.applied` / `inflight` / `failed` → iterate — P2

**Payload:** a batch id and/or a list of constituent transactions.

**Do:** for `applied`/`inflight`, iterate constituents through the existing
`applyTransaction`; for `failed`, mark inbox `failed` and raise a `finding`.
Guard payload size; page if Blnk sends ids only (fetch details per id).

## 5. Inbox reconciler / retry worker — P2

**Why:** the function always 200s after storing; failed/again-transient events
need a re-driver, and balance mirrors need periodic drift correction.

**Do:** a scheduled job (pg_cron or a scheduled edge function) that:
- re-dispatches `core.blnk_event` rows in `status IN ('received','failed')` older
  than N minutes (re-dispatch is idempotent);
- **drift check:** compare `account.balance` vs Blnk `GET /balances/{id}`, alert
  on mismatch (feeds recon controls);
- alerts when failed-inbox volume crosses a threshold.

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
  write scopes.
- Adopt the helper in every money-movement writer as they're built; add a
  check/test that writers don't call Blnk directly.

## 7. Hardening — P3

- Secret rotation for `BLNK_WEBHOOK_SECRET` (support two active secrets during
  rotation).
- Metrics/alerting on `blnk_event` failure rate and processing lag.
- Backfill path using `blnk_sync_state.last_cursor` for cold-start / gap recovery.
