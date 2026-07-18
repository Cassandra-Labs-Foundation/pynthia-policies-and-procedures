-- core.wire_transfer had no source-account reference, so a wire recorded whose
-- money left only inside Blnk — not in the core table. Two problems:
--   1. audit: "which wires did this member send?" was unanswerable from core.
--   2. compliance: the CG-VEL-01 daily velocity cap sums per-account volume, so
--      wire volume could not be counted and a member could evade the $25k cap
--      by moving on the wire rail (or simply send unlimited wires).
--
-- Mirrors core.transfer's shape (`originator` jsonb holding {account_id}) so the
-- gate can aggregate both rails with the same `.contains("originator", ...)`
-- predicate.
alter table "core"."wire_transfer"
  add column if not exists "originator" jsonb;

comment on column "core"."wire_transfer"."originator" is
  'Originating party, {account_id: <core.account.id>}. Matches core.transfer.originator so cross-rail velocity can aggregate both.';

-- Supports the per-account, per-day velocity sweep.
create index if not exists "idx_wire_transfer_originator"
  on "core"."wire_transfer" using gin ("originator");

create index if not exists "idx_wire_transfer_created_at"
  on "core"."wire_transfer" ("created_at");
