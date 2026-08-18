-- Drop the blnk_status mirror — review of 2026-08-17.
--
-- 2,579 populated values across four rails, read by exactly one thing: the
-- sweep that maintained them. `sweepTxnTable` selected rows whose blnk_status
-- was pending, fetched the ledger, and wrote blnk_status back. It never
-- advanced a rail's own `status`, so nothing downstream ever acted on what it
-- learned. Every business decision in this core — can this wire be confirmed,
-- is this ACH settled, how much of this authorization remains — reads the
-- rail's own status column, never this one.
--
-- A mirror whose only consumer is its own maintainer is not evidence. It is a
-- loop that looks like diligence, and it cost a 65-line sweep plus a Blnk
-- round trip per row per cycle to keep telling itself the truth.
--
-- WHAT IS NOT LOST. `blnk_transaction_id` / `blnk_inflight_id` stay, so ledger
-- state is re-derivable for any row at any time via getTransaction. The two
-- sweeps that do real work stay: `sweepStuckRows` still recovers a transaction
-- id whose write landed in Blnk but never came back, and
-- `sweepCardAuthorization` still maintains `blnk_committed_amount` — the one
-- mirror on these rows that IS read, since cards.ts sizes the remaining
-- capture from it.
--
-- WHAT IMPROVED. The card sweep used blnk_status as its selection predicate;
-- it now selects on the business status ('authorized', 'partially_captured'),
-- which is the state this core actually believes. And where it used to write
-- blnk_status='VOID' on discovering the ledger had released a hold, it now
-- emits `blnk.hold_released_upstream` — because a void is a reversal or an
-- expiry depending on who decided, those are different terminal states in a
-- Reg E dispute, and recording the divergence in a column nobody read was
-- indistinguishable from not noticing it.

alter table "core"."transfer" drop constraint if exists "chk_transfer_blnk_status";
alter table "core"."wire_transfer" drop constraint if exists "chk_wire_transfer_blnk_status";
alter table "core"."ach_transfer" drop constraint if exists "chk_ach_transfer_blnk_status";
alter table "core"."card_authorization" drop constraint if exists "chk_card_authorization_blnk_status";

drop index if exists "core"."idx_ach_transfer_blnk_status";
drop index if exists "core"."idx_wire_transfer_blnk_status";
drop index if exists "core"."idx_transfer_blnk_status";
drop index if exists "core"."idx_card_authorization_blnk_status";

alter table "core"."transfer" drop column if exists "blnk_status";
alter table "core"."wire_transfer" drop column if exists "blnk_status";
alter table "core"."ach_transfer" drop column if exists "blnk_status";
alter table "core"."card_authorization" drop column if exists "blnk_status";

notify pgrst, 'reload schema';
