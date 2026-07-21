-- Fixes found by the LIVE control tier (controls_live_run.ts) on its first
-- run — fake-vs-real defects the hermetic drill could not see because the
-- fake enforces neither NOT NULL nor CHECK constraints.
--
-- 1. PERMANENT records have no expiry by definition (NCUA Schedule A has
--    permanent classes; records_admin.ts inserts NULL for them) but the
--    column said NOT NULL — every permanent record insert failed live.
--    Worse, the disposal check `disposed_at >= retention_expires_at` would
--    have passed VACUOUSLY on a NULL expiry (NULL check = pass), so making
--    the column nullable without tightening the check would let a permanent
--    record be disposed. The corrected check refuses disposal outright when
--    there is no expiry: permanence means never disposable.

alter table "core"."record" alter column "retention_expires_at" drop not null;
alter table "core"."record" drop constraint if exists "ck_record_disposal_after_expiry";
alter table "core"."record"
  add constraint "ck_record_disposal_after_expiry"
  check (
    "disposed_at" is null
    or ("retention_expires_at" is not null and "disposed_at" >= "retention_expires_at")
  );

alter table "sim"."record" alter column "retention_expires_at" drop not null;
alter table "sim"."record" drop constraint if exists "ck_sim_record_disposal_after_expiry";
alter table "sim"."record"
  add constraint "ck_sim_record_disposal_after_expiry"
  check (
    "disposed_at" is null
    or ("retention_expires_at" is not null and "disposed_at" >= "retention_expires_at")
  );

-- 2. loan_application carries TWO status check constraints from different
--    codegen passes — one allowing (created, decisioned, counteroffer,
--    final_action), the other (created, completed, decisioned, withdrawn).
--    Their intersection is two states, so each module's writer violates the
--    other module's constraint. The collision-table class, at constraint
--    level. Reconciled to ONE constraint over the union vocabulary.
alter table "core"."loan_application" drop constraint if exists "loan_application_status_check";
alter table "core"."loan_application" drop constraint if exists "ck_loan_application_status";
alter table "core"."loan_application"
  add constraint "ck_loan_application_status"
  check ("status" in ('created', 'decisioned', 'counteroffer', 'final_action', 'completed', 'withdrawn'));

notify pgrst, 'reload schema';
