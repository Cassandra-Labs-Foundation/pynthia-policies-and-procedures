-- core.record carried TWO provenance checks: the inline one from table
-- creation (production, unknown) and ck_record_provenance from the later
-- provenance rollout (production, demo, unknown). Both are enforced, so the
-- intersection won — and 'demo' was rejected on the ONE core evidence table
-- that forbids it. Every other core table accepts it.
--
-- The consequence was not a failed insert; it was a LIE. The drill worked
-- around the constraint by labelling its retention fixtures
-- provenance='production', so synthetic records sat in the retention register
-- claiming to be real member records — in the register that answers "what do
-- we hold, and when must it be destroyed". That is the exact confusion the
-- provenance column exists to prevent, and it silently contaminated the
-- dashboard's provenance filter (a24a855) for this table.
--
-- Dropping the stale check restores the three-value vocabulary. It only ever
-- ADDS an accepted value, so no existing row can violate it.
alter table "core"."record" drop constraint if exists "record_provenance_check";

notify pgrst, 'reload schema';
