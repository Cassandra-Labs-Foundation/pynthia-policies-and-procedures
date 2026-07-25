-- Found BY the monitoring dashboard, first day on the job: 38,144 of 40,583
-- core.event rows (94%) had NULL created_at — every control-writer event
-- (incidents, BSA alerts, timers, the whole violation tier) was dateless.
-- Only the money rails stamped the column, so every time-windowed view of
-- the evidence — the heartbeat, the 7-day panels, an examiner's "show me
-- last quarter" — silently saw the rails and nothing else.
--
-- Evidence that cannot be placed on a timeline is not auditable evidence.
--
-- The faithful backfill exists because updated_at is NOT NULL DEFAULT now()
-- and no writer ever updates event rows except delivery marks: for a
-- never-delivered row updated_at IS the insert time; for delivered rows it
-- is the delivery mark — minutes after insert at worst, and the honest
-- upper bound either way. Then the default + NOT NULL make recurrence
-- structurally impossible rather than a matter of writer discipline (the
-- provenance lesson, applied to time).

update "core"."event" set "created_at" = "updated_at" where "created_at" is null;
alter table "core"."event" alter column "created_at" set default now();
alter table "core"."event" alter column "created_at" set not null;

update "sim"."event" set "created_at" = "updated_at" where "created_at" is null;
alter table "sim"."event" alter column "created_at" set default now();
alter table "sim"."event" alter column "created_at" set not null;

notify pgrst, 'reload schema';
