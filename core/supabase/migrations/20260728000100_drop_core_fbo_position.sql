-- Two tables named fbo_position, and only one of them is the FBO position.
--
--   aggregator.fbo_position  (instance_id, position_cents, last_seq, updated_at)
--     The real one. The Payment Hub advances it continuously against an event
--     sequence; analytics/report_5300.sh reads it; GET /reports/5300 serves it.
--     3 instances, live.
--
--   core.fbo_position        (id, balance, created_at, updated_at)
--     0 rows. No writer, no reader, no route, no test. Not even the same shape
--     — `balance` against `position_cents`, and no instance_id at all, so it
--     could not hold a per-instance position even if something did write to it.
--
-- The names being identical is the hazard. Anyone building the next reporting
-- surface reaches for core.* by default, because that is where every other
-- readable table lives — and they would find a table with a plausible name, a
-- plausible column, and no rows, and conclude that FBO tracking is unbuilt.
-- The empty table is worse than no table: it answers the question wrongly.
--
-- Dropped rather than commented, because a comment does not stop autocomplete.
-- Nothing to migrate: it has never held a row. Verified against the live
-- instance before writing this, not inferred from the schema.

drop table if exists "core"."fbo_position";

notify pgrst, 'reload schema';
