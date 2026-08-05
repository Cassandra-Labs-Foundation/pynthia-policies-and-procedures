-- The CDD risk field had two names and two vocabularies, and the controls
-- cite the one the database did not have.
--
--   core-api.yaml CddProfile        risk_tier   ('low', 'moderate', 'high')
--   core.cdd_profile                risk_rating ('low', 'medium',   'high')
--
-- BSA-02, BSA-04 and RR-08 all declare `cdd.risk_tier` as a required input.
-- The column being called `risk_rating` is not a cosmetic disagreement: the
-- coverage grader matches required inputs by token against the columns that
-- are actually populated, so `cdd.risk_tier` read as UNSUPPLIED against a
-- fully populated table — three controls blocked on an input that was sitting
-- right there under another name. The policy side is the authority on what a
-- control demands, so the schema moves rather than the controls.
--
-- 'medium' -> 'moderate' for the same reason: the enum is part of the field's
-- meaning, and a tier value the spec does not define is a value no control can
-- reason about.
--
-- `sim.cdd_profile` was created `like "core"."cdd_profile" including all`
-- (20260719002500_records_administration.sql:218). INCLUDING ALL implies
-- INCLUDING CONSTRAINTS, so sim holds its OWN copy of both the column and the
-- CHECK — renaming core does not reach it, and it must be migrated in step or
-- the two schemas drift apart on a column the drill writes to.
--
-- Order matters: the CHECK is dropped BEFORE the data is rewritten, because
-- 'moderate' violates the old constraint and 'medium' violates the new one.
-- There is no ordering of rename-then-update that does not pass through an
-- illegal intermediate state while a constraint is attached.

alter table "core"."cdd_profile" drop constraint if exists "cdd_profile_risk_rating_check";
alter table "core"."cdd_profile" rename column "risk_rating" to "risk_tier";
update "core"."cdd_profile" set "risk_tier" = 'moderate' where "risk_tier" = 'medium';
alter table "core"."cdd_profile"
  add constraint "ck_cdd_profile_risk_tier"
  check ("risk_tier" in ('low', 'moderate', 'high'));

alter table "sim"."cdd_profile" drop constraint if exists "cdd_profile_risk_rating_check";
alter table "sim"."cdd_profile" rename column "risk_rating" to "risk_tier";
update "sim"."cdd_profile" set "risk_tier" = 'moderate' where "risk_tier" = 'medium';
alter table "sim"."cdd_profile"
  add constraint "ck_sim_cdd_profile_risk_tier"
  check ("risk_tier" in ('low', 'moderate', 'high'));

comment on column "core"."cdd_profile"."risk_tier" is 'evidences BSA-02, BSA-04, RR-08';

notify pgrst, 'reload schema';
