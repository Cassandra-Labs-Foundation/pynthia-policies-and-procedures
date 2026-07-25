-- Cards 35 (ACH simulations): give the ACH rail somewhere honest to put a
-- return code and a notification of change.
--
-- Until now postAchReturn stored the NACHA return code by STRING-MANGLING it
-- into `window`:
--
--     patch.window = `${ach.window ?? ""} return:${returnReason}`.trim()
--
-- so a settled-then-returned entry ended up with window = 'next_day return:R01'.
-- That is wrong three ways: `window` is the settlement window and is read as
-- such by the ops side, the value no longer matches the WINDOWS enum the writer
-- validates on submit, and the return code cannot be queried without a LIKE.
-- wire_transfer already carries a dedicated `return_reason` (20260719000100);
-- ACH gets the same column so the two return-bearing rails agree.
--
-- `noc` is jsonb rather than a pair of scalar columns because a notification of
-- change carries a code plus a code-dependent correction payload (C01 corrects
-- the account number, C02 the routing number, C03 both), and the corrected
-- fields differ per code.
alter table "core"."ach_transfer"
  add column if not exists "return_reason" text,
  add column if not exists "noc" jsonb;

comment on column "core"."ach_transfer"."return_reason" is
  'NACHA return code (R01, R02, …) when status = returned. Previously mangled into `window`; see 20260719000500.';

-- A NOC is NOT a return. The entry settles normally and the money moves; the
-- C-code tells the ODFI to correct its stored counterparty details for FUTURE
-- entries (NACHA gives 6 banking days). So `noc` is deliberately independent of
-- `status` -- an entry can be settled AND carry a NOC, and recording one must
-- never move the row toward 'returned'.
comment on column "core"."ach_transfer"."noc" is
  'Notification of change: {code, received_at, corrections{}}. Administrative only — does not change status and moves no money.';

-- Return codes are queried by the compliance side to find the unauthorized
-- class (R05/R07/R10/R29), which is what drives the unauthorized-return
-- bsa_alert. Partial: the overwhelming majority of rows never carry one.
create index if not exists "idx_ach_transfer_return_reason"
  on "core"."ach_transfer" ("return_reason")
  where "return_reason" is not null;
