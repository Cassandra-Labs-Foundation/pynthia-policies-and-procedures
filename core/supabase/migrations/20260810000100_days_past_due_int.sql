-- days_past_due is a COUNT, not a calendar date.
--
-- The first schema cut typed it `date` (20260702000100:565); the collections
-- migration later did `add column if not exists "days_past_due" int`
-- (20260719003300:25) — a silent no-op because the column already existed.
-- The static schema model reads the ADD and reports int, the live column is
-- date, and every delinquency-engine write of an integer bounced
-- ("invalid input syntax for type date: 221") — which is how CO-02/CO-03
-- read as fake-vs-real defects.
--
-- USING null: any values that survived in a date-typed day-counter are
-- semantically garbage; the engine recomputes on every evaluation.

alter table "core"."loan" alter column "days_past_due" type int using null;
