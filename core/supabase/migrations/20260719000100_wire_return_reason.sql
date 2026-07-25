-- Wire returns (card 37): the state machine already carries
-- return_requested/returned, but nothing recorded WHY a return was requested
-- or how the claim resolved. The reason is the compliance substance — a
-- returned wire with no recorded cause is exactly the kind of unexplained
-- reversal an examiner flags.
--
-- One text column carries the whole trail: the request reason, and on a
-- rejected resolution the rejection cause is appended ("<reason> | rejected:
-- <why>"), so the row keeps both halves of the story without a second table.
alter table "core"."wire_transfer"
  add column if not exists "return_reason" text;

comment on column "core"."wire_transfer"."return_reason" is
  'Why a return was requested; on a rejected resolution the rejection cause is appended. Null = never subject to a return claim.';
