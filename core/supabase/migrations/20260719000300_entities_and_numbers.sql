-- Entity chain (cards 23, 28).
--
-- Card 23: beneficial owners live ON the entity as jsonb
-- [{entity_id, percent}] — the spec nests them and no owners table exists;
-- matches the hybrid rule used for every other nested detail.
alter table "core"."entity"
  add column if not exists "owners" jsonb;

comment on column "core"."entity"."owners" is
  'Beneficial owners, [{entity_id, percent}]. business/trust only (card 23).';

-- Card 28: a canceled number is NEVER reissued. The index deliberately has NO
-- status filter — uniqueness must span active, disabled and canceled rows
-- alike, so the mint loop treats a collision with a retired pair as "roll
-- again", never as an opportunity to resurrect it.
create unique index if not exists "uq_account_number_pair"
  on "core"."account_number" ("routing_number", "account_number");
