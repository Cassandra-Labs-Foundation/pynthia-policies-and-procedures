# analytics — instance DuckDB layer

Local DuckDB attached **read-only** to the core Supabase project (architecture
D18/D25: the per-instance analytical layer for aggregate control evaluation).
Views query Postgres live through the `postgres` extension.

Since cards 62/59/60 this directory also holds the **aggregator's analytical
tail**: watermark archiving to Parquet and the two scheduled reporters.

## Aggregator jobs (cards 62, 59, 60)

| Job | What it does |
|---|---|
| `./analytics/archive.sh` | Card 62's sync mechanism: exports `aggregator.event` rows up to the current max `sequence_id` into `analytics/archive/*.parquet`, then advances the watermark in `aggregator.archive_watermark`. Rows are not deleted from Postgres (append-only trigger stays intact); the spanning view partitions by watermark so each row has exactly one serving tier. An empty run still stamps `archived_at` — liveness evidence. |
| `./analytics/bsa_reporter.sh` | Card 59: for every entity the BSA Approver flagged `requires_lookback`, totals sub-threshold movement over the trailing **90 days across hot Postgres + cold Parquet** and writes `aggregator.sar_candidate` rows. Idempotent per entity per day. |
| `./analytics/report_5300.sh` | Card 60: one call-report aggregation row per instance per day into `aggregator.report_5300` (settled volume from the spanning view, alert counts, FBO position). Idempotent per day. |

`analytics/aggregator_views.sql` defines the spanning views (`agg_events_cold`
/ `agg_events_hot` / `agg_events_all` / `agg_money_events`). Load it after at
least one archive run exists — `read_parquet` on an empty glob errors, and
that error is correct.

**Schedule:** `.github/workflows/aggregator-reporters.yml` runs all three
daily and commits new Parquet files to main — git is the cold archive of
record. Activating it needs the `SUPABASE_DB_URL` repo secret (session-pooler
URI): `gh secret set SUPABASE_DB_URL --body "$SUPABASE_DB_URL"`. Until then
the workflow reports itself skipped.

## Setup

1. `brew install duckdb` (≥ 1.1)
2. Add the **session pooler** URI (port 5432 — the transaction pooler will not
   work for ATTACH) to `.env.local` at the repo root:

   ```
   SUPABASE_DB_URL=postgresql://postgres.<ref>:<db-password>@<region>.pooler.supabase.com:5432/postgres
   ```

   Dashboard → Connect → Session pooler. `.env.local` is gitignored.

3. `./analytics/duck.sh` — interactive shell with views ready, or
   `./analytics/duck.sh -f analytics/demo_queries.sql` for the canned demo.

## Generating demo data

`./analytics/seed.sh` drives the deployed `api` function to create synthetic
accounts and a burst of book transfers that trips every control — velocity
block, per-transaction CTR, insufficient funds, and (the interesting one) an
**aggregate CTR**: three sub-$10k credits to one account that individually evade
the per-transaction gate but sum past $10k in a day, so only `ctr_daily_inflow`
flags them. Needs `DEMO_API_KEY` in `.env.local`. Re-runnable (fresh run-id per
run; volume accumulates). Then run the demo queries above to see it.

The local database file `analytics/core.duckdb` is a cache/workspace and is
gitignored; views are re-created from `views.sql` on every launch.

## Views

| View | What it shows |
|---|---|
| `daily_transfer_volume` | settled outbound volume per source account per day |
| `control_activity` | control_result counts by day / control / decision |
| `bsa_alerts_open` | open BSA alert feed |
| `ctr_daily_inflow` | daily inflow per destination account, flagged when the **aggregate** crosses $10k — catches structuring the per-transaction CG-CTR-01 gate can't see |
| `account_balances` | mirror balances + sync freshness |
| `recon_events` | `blnk.balance_drift` / `blnk.missing_mirror` / `blnk.stuck_row` events |
| `recon_sync_state` | reconciler sweep cursors + last-run summary |
