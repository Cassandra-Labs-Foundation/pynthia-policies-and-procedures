-- Link accounts to the entity that owns them.
--
-- PREREQUISITE FOR CASH (BSA-08), not a nice-to-have.
--
-- BSA-08 aggregates cash-in and cash-out "per person per business day" and
-- names entity.name and entity.tin among its required inputs. core.account has
-- never had ANY link to core.entity — no entity_id, no member_id, nothing. So
-- a cash subsystem built today could only aggregate per ACCOUNT.
--
-- That matters because per-account aggregation is a KNOWN DEFECT already
-- recorded against the existing controls. From the CG-STR-01 crosswalk entry:
--
--     "per-account, not per-person: splitting across two accounts owned by the
--      same member evades it entirely"
--
-- Building cash on the same footing would reproduce that defect at birth, in
-- the one control where the evasion it enables (structuring to stay under the
-- CTR threshold) is the specific behaviour the control exists to catch. So the
-- link comes first.
--
-- It also retroactively improves CG-STR-01 / CG-STR-02: once accounts carry an
-- owner, their aggregation can move from per-account to per-entity and the
-- recorded gap closes for the rails that already exist.

alter table "core"."account"
  add column if not exists "entity_id" text;

comment on column "core"."account"."entity_id" is
  'Owning member/entity. Required for BSA-08 per-person cash aggregation and for closing the per-account evasion gap in CG-STR-01/02. Nullable during backfill — see the NOT NULL note below.';

-- Deliberately NULLABLE for now, and this is a departure from the pattern used
-- for partner_id, which was made NOT NULL immediately.
--
-- partner_id could be backfilled truthfully: D18 gives an instance exactly one
-- fintech, so every existing row had an unambiguous owner. There is no
-- equivalent fact here. Accounts were opened with no entity at all, and there
-- is nothing in the data that says which member owns which account — inventing
-- a link would fabricate a member relationship, which is worse than a null in
-- exactly the way this repo keeps insisting on.
--
-- So: nullable, with a partial index over the unlinked rows so the backlog is
-- queryable, and NOT NULL deferred until either the rows are linked by someone
-- who knows the answer or the demo accounts are discarded.
create index if not exists "idx_account_unlinked"
  on "core"."account" ("created_at")
  where "entity_id" is null;

create index if not exists "idx_account_entity" on "core"."account" ("entity_id");

alter table "core"."account" drop constraint if exists "fk_account_entity_id";
alter table "core"."account"
  add constraint "fk_account_entity_id"
  foreign key ("entity_id") references "core"."entity" ("id");

-- Cash aggregation will key on this, so it needs to be efficient from the
-- start: the CTR sweep asks "every cash transaction for this entity today",
-- which is an entity + date range scan.
comment on index "core"."idx_account_entity" is
  'Supports per-ENTITY aggregation (BSA-08 CTR, and the CG-STR-01/02 upgrade from per-account).';

notify pgrst, 'reload schema';
