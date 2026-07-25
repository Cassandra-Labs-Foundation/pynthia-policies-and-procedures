-- BSA-05 / BSA-10, live red: the Travel Rule writer retains originator rows
-- under writer-style text ids (orig_<wire_ref>), but the generated schema
-- gave core.originator a uuid id — so every live upsert died on 22P02, the
-- error went unchecked, and the five-year retention row (31 CFR 1010.410(f))
-- never landed while the wire events emitted anyway. The fake compares ids
-- as strings and could not see it: type coercion is a Postgres-only defect
-- class (DRILL.md), which is exactly what the live tier exists to catch.
--
-- Text ids match every adopted evidence table (cipv_, cdd_, ctr_, cmir_),
-- and a DETERMINISTIC id per wire is what makes replays idempotent instead
-- of duplicative — a retention property, not a style choice.
alter table "core"."originator" alter column "id" type text using "id"::text;

notify pgrst, 'reload schema';
