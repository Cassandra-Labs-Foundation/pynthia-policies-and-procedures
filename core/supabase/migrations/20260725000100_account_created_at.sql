-- The same defect as 20260722000200_event_created_at.sql, in the table that
-- migration did not touch. Worth stating plainly: that fix was applied to ONE
-- table when it should have been applied to a CLASS.
--
-- core.account.created_at was the last nullable created_at among the tables the
-- API paginates. entity, transfer, control_result, event and bsa_alert are all
-- NOT NULL; account alone was not, and 8 of its 1829 rows were dateless.
--
-- Nullable is not a cosmetic difference here, because created_at is the
-- PAGINATION CURSOR (D16). Two things follow from a null in a cursor column,
-- and both are silent:
--
--   * Postgres sorts NULLS FIRST under ORDER BY ... DESC. The dateless rows
--     therefore led every page of GET /accounts rather than trailing it.
--   * The cursor is taken from the last row of the page, so a page ending on a
--     dateless row advertised has_more:true with next_after:null — a caller is
--     told there is more and handed nothing to ask with. GET /accounts?limit=3
--     did exactly this against the live instance.
--
-- The backfill is the same faithful one, for the same reason: updated_at is
-- NOT NULL DEFAULT now(), so for a row never updated since insert it IS the
-- insert time, and for any other it is an honest upper bound. Then the default
-- plus NOT NULL make recurrence structurally impossible instead of a matter of
-- writer discipline.
--
-- A CI guard now asserts this for every cursor column at once
-- (scripts/check_cursor_columns.py), so the next table does not need a third
-- migration to learn the same thing.

update "core"."account" set "created_at" = "updated_at" where "created_at" is null;
alter table "core"."account" alter column "created_at" set default now();
alter table "core"."account" alter column "created_at" set not null;

notify pgrst, 'reload schema';
