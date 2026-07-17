-- Canned demo queries. Run all: ./analytics/duck.sh -f analytics/demo_queries.sql

.print === Daily transfer volume by source account ===
select * from daily_transfer_volume order by day, source_account_id;

.print === Control engine activity ===
select * from control_activity order by day, control_id;

.print === Open BSA alerts ===
select alert_type, details, created_at from bsa_alerts_open order by created_at desc;

.print === CTR aggregation: daily inflow per account (flag = aggregate > $10k) ===
select * from ctr_daily_inflow order by day, destination_account_id;

.print === Mirror balances ===
select id, account_type, mirror_balance_dollars, balance_synced_at from account_balances;

.print === Reconciliation events (drift / missing mirror / stuck rows) ===
select * from recon_events order by created_at desc limit 20;

.print === Reconciler sweep state ===
select * from recon_sync_state;
