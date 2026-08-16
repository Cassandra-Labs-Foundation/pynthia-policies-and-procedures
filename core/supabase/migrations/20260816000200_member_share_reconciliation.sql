-- The FBO tie-out — TODO §3, decided 2026-08-16.
--
-- THE DECISION. A partner program's end users ARE members of this credit
-- union, and their balances are tracked THROUGH that program's FBO account.
-- Two consequences, and this migration serves the second:
--
--   1. Their deposits are member shares. They stay on the share lines
--      (902/657/...), and NCUA line 880 Non-Member Deposits is genuinely
--      zero — see ui/src/lib/ncua5300.js for why that zero is asserted from
--      this decision rather than evidenced (core.membership holds 2 rows and
--      joins to nothing).
--
--   2. "Tracked through the FBO account" makes the FBO position and the sum
--      of that program's member balances TWO VIEWS OF ONE NUMBER. That is an
--      invariant, so something should check it. This function is that check's
--      other half.
--
-- WHY IT IS A FUNCTION AND NOT A QUERY IN THE HANDLER. GET /reports/5300 is
-- the UI's heartbeat — useLiveCore polls it on a timer to watch the position
-- advance. Summing ~1,900 account rows over PostgREST on every tick would
-- turn a cheap poll into a page-sized transfer. This returns one bigint,
-- computed next to the data, using idx_account_partner.
--
-- WHY IT LIVES IN `aggregator` THOUGH IT READS ONLY `core`. The sole consumer
-- is the FBO reconciliation, and fbo_read is here. Keeping both halves of one
-- tie-out in one schema makes it findable; splitting them across schemas by
-- which tables they happen to touch does not.
--
-- SCOPING IS THE WHOLE POINT. An FBO position belongs to ONE instance, so the
-- balances it is compared against must belong to that instance's partner and
-- no other. The first cut of this reconciliation compared one instance's
-- position against every account in the core, which silently folded other
-- programs' deposits into the gap.
create or replace function "aggregator".member_share_cents(p_instance text)
returns bigint language sql stable as $$
  select coalesce(sum(a."balance"), 0)::bigint
  from "core"."account" a
  join "core"."partner" p on p."id" = a."partner_id"
  where p."instance_id" = p_instance
    -- closed accounts hold no share balance to report, matching bucketShares
    and coalesce(a."status", '') <> 'closed'
$$;

comment on function "aggregator".member_share_cents(text) is
  'Sum of open member share balances for the partner program mapped to this '
  'aggregator instance. The other half of the FBO tie-out: because a program''s '
  'members are tracked through its FBO account, this should equal '
  'aggregator.fbo_position.position_cents for the same instance. It does not '
  'today, and the gap is the unmodelled inbound funding (TODO §6).';

notify pgrst, 'reload schema';
