-- Same gap core.wire_transfer had (fixed in 20260718000100): neither
-- ach_transfer nor card_authorization recorded which account the money moved
-- from. That blocks two things:
--   1. audit -- "which ACH debits / card auths did this member originate?" is
--      unanswerable from core.
--   2. compliance -- CG-VEL-01 is a per-account daily cap and CG-STR-01 sums
--      per-account flow, so a rail that cannot be attributed to an account
--      silently escapes both.
--
-- Mirrors core.transfer.originator ({account_id: ...}) so runGate aggregates
-- every rail with the same `.contains("originator", ...)` predicate.
alter table "core"."ach_transfer"
  add column if not exists "originator" jsonb;

alter table "core"."card_authorization"
  add column if not exists "originator" jsonb;

comment on column "core"."ach_transfer"."originator" is
  'Originating party, {account_id: <core.account.id>}. Matches core.transfer.originator for cross-rail velocity.';
comment on column "core"."card_authorization"."originator" is
  'Originating party, {account_id: <core.account.id>}. Matches core.transfer.originator for cross-rail velocity.';

create index if not exists "idx_ach_transfer_originator"
  on "core"."ach_transfer" using gin ("originator");
create index if not exists "idx_ach_transfer_created_at"
  on "core"."ach_transfer" ("created_at");

create index if not exists "idx_card_authorization_originator"
  on "core"."card_authorization" using gin ("originator");
create index if not exists "idx_card_authorization_created_at"
  on "core"."card_authorization" ("created_at");
