-- FIX: a record can be under MORE THAN ONE legal hold.
--
-- THE BUG. `core.record.legal_hold_id` was a single column, so placing a second
-- hold over a record OVERWROTE the first. Releasing the second then cleared
-- `legal_hold_flag` — while the first hold was still live — and the record
-- became disposal-eligible under an active legal hold.
--
-- The release code already carried a comment claiming this case was handled:
--
--   "Clear the flag only on records THIS hold set. A record under two
--    concurrent holds must stay held when one is released."
--
-- The intent was right and the data model could not deliver it. `.eq(
-- "legal_hold_id", holdId)` clears exactly the records whose SINGLE pointer
-- happens to name this hold — which, after a second placement, is all of them.
--
-- SIXTH INSTANCE OF THE FAIL-OPEN CLASS, and the one with the worst
-- consequence: destroying records under litigation hold is spoliation.
-- Every test passed, because no test placed two holds.
--
-- THE FIX: the standing state is DERIVED from a SET, not stored as a pointer.
-- `record_hold` is the membership; `legal_hold_flag` is true iff at least one
-- active hold covers the record. That is the same shape as the privacy opt-out
-- finding — current state that governs future actions cannot be a single
-- pointer any more than it can be an event log.

create table if not exists "core"."record_hold" (
  -- a surrogate id as well as the natural key: every other table in this repo
  -- is keyed on `id` and the writers upsert on it
  "id" text primary key,
  "record_id" text not null,
  "hold_id" text not null,
  "placed_at" timestamptz not null default now(),
  "released_at" timestamptz,
  "provenance" text not null default 'production',
  constraint "uq_record_hold" unique ("record_id", "hold_id")
);

create index if not exists "ix_record_hold_active"
  on "core"."record_hold" ("record_id", "released_at");

create schema if not exists "sim";
create table if not exists "sim"."record_hold" (like "core"."record_hold" including all);

-- `record.legal_hold_id` stays for the moment as the MOST RECENT hold, purely
-- informational. It must never again be used to decide whether a record is
-- held; `record_hold` is the authority.
comment on column "core"."record"."legal_hold_id" is
  'informational only — the most recent hold placed. Holds are a SET; use core.record_hold to decide whether a record is held.';
