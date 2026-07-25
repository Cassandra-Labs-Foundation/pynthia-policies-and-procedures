-- Foreign keys for core schema (generated).
-- Apply AFTER bulk-loading data: the source API feed uses loose string ids
-- with no guaranteed insert order, so FKs are isolated here and can be
-- deferred or skipped without blocking ingest. All are ON DELETE SET NULL.

alter table "core"."account_number" add constraint "fk_account_number_account_id" foreign key ("account_id") references "core"."account"("id") on delete set null;
alter table "core"."bsa_alert" add constraint "fk_bsa_alert_event_id" foreign key ("event_id") references "core"."event"("id") on delete set null;
