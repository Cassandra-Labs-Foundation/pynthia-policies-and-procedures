# analytics — instance DuckDB layer

Local DuckDB attached **read-only** to the core Supabase project (architecture
D18/D25: the per-instance analytical layer for aggregate control evaluation).
No sync worker yet — views query Postgres live through the `postgres` extension;
a watermark-sync + Parquet archive comes later with the aggregator.

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
