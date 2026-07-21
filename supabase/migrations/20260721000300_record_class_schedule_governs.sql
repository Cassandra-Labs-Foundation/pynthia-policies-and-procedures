-- Found by the live control tier: core.record carries a hardcoded
-- record_class allowlist from the BSA-era migration (9 classes), while
-- records_admin.ts governs classes through the Schedule A table and refuses
-- unmatched classes with a recorded 409 (record_class_unmatched). Two
-- authorities, one narrower and stale: every non-BSA class the writers use
-- (cash_operations, regulatory_assessment, credit_package, ...) violated the
-- constraint live while passing the fake. The SCHEDULE is the registry — a
-- static constraint cannot track it, so it goes.
alter table "core"."record" drop constraint if exists "record_record_class_check";
alter table "sim"."record" drop constraint if exists "record_record_class_check";
alter table "sim"."record" drop constraint if exists "sim_record_record_class_check";
notify pgrst, 'reload schema';
