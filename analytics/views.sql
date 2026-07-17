-- Analytical views over the live core schema (attached as `pg`, read-only).
-- Re-created on every duck.sh launch; safe to edit and relaunch.
-- jsonb columns arrive as JSON text — extracted with the json extension.

-- Daily outbound volume per source account (settled money movement only).
create or replace view daily_transfer_volume as
select
  cast(t.created_at as date)                            as day,
  json_extract_string(t.originator, '$.account_id')     as source_account_id,
  count(*)                                              as transfers,
  sum(t.amount)                                         as total_cents,
  round(sum(t.amount) / 100.0, 2)                       as total_dollars
from pg.core.transfer t
where t.status = 'settled'
group by 1, 2;

-- Control engine activity by day / control / decision.
create or replace view control_activity as
select
  cast(cr.created_at as date) as day,
  cr.control_id,
  cr.decision,
  count(*)                    as results
from pg.core.control_result cr
group by 1, 2, 3;

-- Open BSA alert feed.
create or replace view bsa_alerts_open as
select a.id, a.alert_type, a.entity_hash, a.details, a.requires_lookback, a.created_at
from pg.core.bsa_alert a
where a.status = 'open';

-- CTR aggregation: daily INFLOW per destination account. The per-transaction
-- gate (CG-CTR-01) only sees single transfers > $10k; this catches aggregates —
-- several smaller credits summing past the threshold in one day (structuring
-- pattern). agg_over_10k is the flag the BSA workflow consumes.
create or replace view ctr_daily_inflow as
select
  cast(t.created_at as date)                          as day,
  json_extract_string(t.beneficiary, '$.account_id')  as destination_account_id,
  count(*)                                            as credits,
  sum(t.amount)                                       as inflow_cents,
  sum(t.amount) > 1000000                             as agg_over_10k
from pg.core.transfer t
where t.status = 'settled'
group by 1, 2;

-- Mirror balances + sync freshness (mirror integrity at a glance).
create or replace view account_balances as
select
  a.id, a.account_type, a.status,
  a.balance                          as mirror_balance_cents,
  round(a.balance / 100.0, 2)        as mirror_balance_dollars,
  a.blnk_balance_id,
  a.balance_synced_at
from pg.core.account a
where a.blnk_balance_id is not null;

-- Reconciliation health: drift / missing-mirror / stuck-row events + sweep state.
create or replace view recon_events as
select e.created_at, e.code, e.resource_id, e.payload
from pg.core.event e
where e.code like 'blnk.%';

create or replace view recon_sync_state as
select s.resource, s.last_cursor, s.last_synced_at
from pg.core.blnk_sync_state s;
