-- Row-level partner ownership, layered UNDER the instance binding from
-- 20260719000600 rather than replacing it.
--
--   instance binding  — can this token authenticate here at all?     (card 51)
--   partner ownership — may this partner touch THIS ROW?             (this file)
--
-- Both apply. A token is first resolved against core.instance; only then does
-- row ownership come into play. Dropping either leaves a real hole: instance
-- binding alone lets any token on this instance read every row, and ownership
-- alone lets a foreign token in to be scoped.
--
-- WHY COLUMNS AND NOT JOINS. The core schema has exactly two foreign keys
-- (account_number -> account, bsa_alert -> event); every other link is jsonb.
-- core.account has no entity_id at all, so an account has nothing to derive
-- ownership from. The rails link through `originator` jsonb which is GIN
-- indexed -- that serves containment lookups but CANNOT serve a join on
-- originator->>'account_id', and runGate issues four such rail queries per
-- money movement. So ownership is stored on the rails and on account/entity,
-- and derived only where a real indexed FK already exists (account_number).
--
-- WHAT IS DELIBERATELY NOT SCOPED: control_result, bsa_alert, event, filing,
-- case, dispute. These are the instance's compliance record, not a partner's
-- property. CTR aggregation, structuring detection and BSA reporting are
-- obligations of the chartered institution across ALL its fintechs; scoping
-- them per partner would fragment exactly the view those controls exist to
-- provide. See the runGate note in transfers.ts.

-- ------------------------------------------------------------- the columns
--
-- Nullable first so the backfill below has something to write into; the NOT
-- NULL lands after. Doing it in one step would fail on any existing row.
alter table "core"."account"             add column if not exists "partner_id" text;
alter table "core"."entity"              add column if not exists "partner_id" text;
alter table "core"."transfer"            add column if not exists "partner_id" text;
alter table "core"."wire_transfer"       add column if not exists "partner_id" text;
alter table "core"."ach_transfer"        add column if not exists "partner_id" text;
alter table "core"."card_authorization"  add column if not exists "partner_id" text;

-- ---------------------------------------------------------------- backfill
--
-- Every existing row was written under the shared DEMO_API_KEY, i.e. by the
-- bootstrap `pynthia_ops` actor, which carries no partner of its own. Under
-- D18 an instance hosts exactly one fintech, so the instance's sole partner is
-- the unambiguous owner of everything already here — that is what makes this
-- backfill correct rather than a guess.
--
-- Resolved from the table rather than hardcoding 'ptnr_demo' so the migration
-- is correct on an instance whose partner was seeded under another id.
do $$
declare
  owner_id text;
  partner_count int;
begin
  select count(*) into partner_count from "core"."partner" where "status" = 'active';

  if partner_count = 0 then
    raise exception
      'no active partner: run 20260719000600 (which seeds one) before backfilling ownership';
  end if;
  if partner_count > 1 then
    -- Ambiguous, and guessing would silently hand one fintech's rows to
    -- another. Fail loudly and make a human choose.
    raise exception
      'multiple active partners (%): backfill owner is ambiguous, assign partner_id manually before applying',
      partner_count;
  end if;

  select "id" into owner_id from "core"."partner" where "status" = 'active';

  update "core"."account"            set "partner_id" = owner_id where "partner_id" is null;
  update "core"."entity"             set "partner_id" = owner_id where "partner_id" is null;
  update "core"."transfer"           set "partner_id" = owner_id where "partner_id" is null;
  update "core"."wire_transfer"      set "partner_id" = owner_id where "partner_id" is null;
  update "core"."ach_transfer"       set "partner_id" = owner_id where "partner_id" is null;
  update "core"."card_authorization" set "partner_id" = owner_id where "partner_id" is null;
end $$;

-- --------------------------------------------------------- NOT NULL + FKs
--
-- NOT NULL is load-bearing, not tidiness. A nullable owner means any query
-- that later grows a `partner_id = $1` predicate silently drops the NULL rows.
-- On a listing that is a confusing bug; on an aggregate it is a limit that
-- never trips while the control still records a clean pass. Making an unowned
-- row unrepresentable removes that failure mode at the source.
alter table "core"."account"             alter column "partner_id" set not null;
alter table "core"."entity"              alter column "partner_id" set not null;
alter table "core"."transfer"            alter column "partner_id" set not null;
alter table "core"."wire_transfer"       alter column "partner_id" set not null;
alter table "core"."ach_transfer"        alter column "partner_id" set not null;
alter table "core"."card_authorization"  alter column "partner_id" set not null;

-- These FKs are INTEGRITY, not access control, and that distinction is the
-- whole design: RLS would be inert here because the edge functions connect as
-- service_role and bypass it, but a foreign key is enforced against every
-- writer including service_role and a human at a psql prompt. So the database
-- guarantees "this row is owned by a real partner on this instance" while the
-- application decides "this caller may touch this row" — two different
-- assertions that cannot drift into disagreement, rather than two copies of
-- the same one.
alter table "core"."account"
  add constraint "fk_account_partner_id"
  foreign key ("partner_id") references "core"."partner" ("id");
alter table "core"."entity"
  add constraint "fk_entity_partner_id"
  foreign key ("partner_id") references "core"."partner" ("id");
alter table "core"."transfer"
  add constraint "fk_transfer_partner_id"
  foreign key ("partner_id") references "core"."partner" ("id");
alter table "core"."wire_transfer"
  add constraint "fk_wire_transfer_partner_id"
  foreign key ("partner_id") references "core"."partner" ("id");
alter table "core"."ach_transfer"
  add constraint "fk_ach_transfer_partner_id"
  foreign key ("partner_id") references "core"."partner" ("id");
alter table "core"."card_authorization"
  add constraint "fk_card_authorization_partner_id"
  foreign key ("partner_id") references "core"."partner" ("id");

-- ----------------------------------------------------------------- indexes
--
-- Composite (partner_id, created_at desc) rather than a bare partner_id index:
-- every list endpoint paginates with `order(created_at desc) + lt(created_at,
-- $after) + limit`, so the partner predicate and the cursor are one access
-- path. A single-column partner index would filter and then re-sort.
--
-- The rails' existing GIN indexes on `originator` are untouched: runGate's
-- cross-rail sweeps stay instance-wide and must not acquire a partner
-- predicate (see the header note).
create index if not exists "idx_account_partner"
  on "core"."account" ("partner_id", "created_at" desc);
create index if not exists "idx_entity_partner"
  on "core"."entity" ("partner_id", "created_at" desc);
create index if not exists "idx_transfer_partner"
  on "core"."transfer" ("partner_id", "created_at" desc);
create index if not exists "idx_wire_transfer_partner"
  on "core"."wire_transfer" ("partner_id", "created_at" desc);
create index if not exists "idx_ach_transfer_partner"
  on "core"."ach_transfer" ("partner_id", "created_at" desc);
create index if not exists "idx_card_authorization_partner"
  on "core"."card_authorization" ("partner_id", "created_at" desc);

comment on column "core"."account"."partner_id" is
  'Owning fintech. Layered under the instance binding: instance decides whether a token authenticates, partner_id decides which rows it reaches.';
comment on column "core"."entity"."partner_id" is
  'Owning fintech. core.account carries no entity_id, so ownership cannot be derived — it is stored.';
comment on column "core"."transfer"."partner_id" is
  'Owning fintech. Derivable only via originator->>''account_id'', which the GIN index on originator cannot serve — stored for the hot path.';

-- account_number deliberately has NO partner_id: it reaches its owner through
-- fk_account_number_account_id, which is indexed by
-- idx_account_number_account_id. This is the one link in the schema where a
-- join is both correct and cheap, so duplicating the column here would be
-- denormalization with a drift risk and no benefit.
comment on table "core"."account_number" is
  'Account numbers (D20). Ownership derives from account_id via the existing FK — no partner_id column by design.';
