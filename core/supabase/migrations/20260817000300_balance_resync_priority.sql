-- Keep the FBO roll-up fresh where freshness can actually be lost.
--
-- WHAT THE MEASUREMENT SAID. After 20260817000100 made the position a roll-up
-- of `core.account.balance`, `fbo_mirror_staleness` reported 1,610 of 1,907
-- accounts "stale over 1h" and that looked alarming. It was measuring the
-- wrong thing. On the live core, over 48 hours:
--
--   blnk.balance_drift events                     1
--   accounts that MOVED after their last sync     0
--
-- An account that has not transacted since its last sync does not have a
-- stale mirror; it has a correct one with an old timestamp. Wall-clock age is
-- not the risk, and an alarm that fires on 84% of rows every hour is the same
-- alarm this repo has twice watched decay into noise (the inbox backlog, the
-- drill's 404ing balance ids). This migration replaces the metric with the
-- question that has a wrong answer: did money move after we last looked?
--
-- WHY THE NUMBER IS 0, AND WHY THAT IS NOT AN ARGUMENT FOR DOING NOTHING.
-- Three independent paths refresh a balance: the write path refreshes both
-- accounts after a transfer, the webhook refreshes on `transaction.applied`,
-- and this sweep is the backstop. The 0 means the first two are working. The
-- gap is the account where BOTH fail — the write-path refresh degrades to a
-- warning in `meta.warnings` and the webhook is never retried by Blnk — and
-- that account then waited for a round-robin cycle. At 25 rows per 5 minutes
-- against 1,907 accounts that cycle is ~6.4 hours, and it is the position that
-- is wrong for those hours now, not just a display value.

-- Accounts whose balance moved after the mirror was last synced, oldest
-- movement first. The window is deliberate: the round-robin pass below cycles
-- the whole table in hours, so anything older than 7 days has certainly been
-- swept, and bounding the scan keeps this cheap as the rail tables grow.
create or replace function "core".accounts_pending_resync(p_limit integer default 25)
returns table (id text, balance bigint, blnk_balance_id text, last_move timestamptz)
language sql stable as $$
  with moved as (
    select aid, max(created_at) as last_move
    from (
      -- both legs: a book transfer CREDITS the beneficiary, and a mirror that
      -- only tracked debits would drift in exactly one direction
      select "originator"->>'account_id' as aid, "created_at"
        from "core"."transfer" where "status" = 'settled'
      union all
      select "beneficiary"->>'account_id' as aid, "created_at"
        from "core"."transfer" where "status" = 'settled'
      union all
      select "originator"->>'account_id' as aid, "created_at"
        from "core"."wire_transfer" where "status" = 'completed'
      union all
      select "originator"->>'account_id' as aid, "created_at"
        from "core"."ach_transfer" where "status" = 'settled'
      union all
      select "originator"->>'account_id' as aid, "created_at"
        from "core"."card_authorization"
       where "status" in ('captured', 'partially_captured')
    ) r
    where aid is not null
      and "created_at" > now() - interval '7 days'
    group by aid
  )
  select a."id", a."balance", a."blnk_balance_id", m.last_move
  from "core"."account" a
  join moved m on m.aid = a."id"
  where a."blnk_balance_id" like 'bln_%'
    and (a."balance_synced_at" is null or a."balance_synced_at" < m.last_move)
  order by m.last_move asc
  limit p_limit
$$;

comment on function "core".accounts_pending_resync(integer) is
  'Accounts whose ledger balance moved after the mirror was last synced — the '
  'only accounts whose mirror can actually be wrong. blnk-reconcile sweeps '
  'these BEFORE its round-robin pass, so a missed write-path refresh is '
  'corrected within one 5-minute run instead of within a full ~6h cycle.';

-- The metric now answers the question that has a wrong answer.
create or replace function "aggregator".fbo_mirror_staleness(p_instance text)
returns jsonb language sql stable as $$
  select jsonb_build_object(
    'instance_id', p_instance,
    'accounts', (select count(*) from "core"."account" a
                   join "core"."partner" p on p."id" = a."partner_id"
                  where p."instance_id" = p_instance
                    and coalesce(a."status", '') <> 'closed'),
    -- Not wall-clock age: accounts where money moved after the last sync.
    -- Non-zero means the position is provably behind the ledger.
    'pending_resync', (select count(*) from "core".accounts_pending_resync(100000) q
                         join "core"."account" a on a."id" = q."id"
                         join "core"."partner" p on p."id" = a."partner_id"
                        where p."instance_id" = p_instance),
    'oldest_sync', (select min(a."balance_synced_at") from "core"."account" a
                      join "core"."partner" p on p."id" = a."partner_id"
                     where p."instance_id" = p_instance
                       and coalesce(a."status", '') <> 'closed'),
    'never_synced', (select count(*) from "core"."account" a
                       join "core"."partner" p on p."id" = a."partner_id"
                      where p."instance_id" = p_instance
                        and coalesce(a."status", '') <> 'closed'
                        and a."balance_synced_at" is null)
  )
$$;

comment on function "aggregator".fbo_mirror_staleness(text) is
  'Whether the FBO roll-up is behind the ledger. `pending_resync` is the '
  'load-bearing field — accounts that MOVED since their mirror was synced. '
  '`oldest_sync` is context, not an alarm: an account that has not transacted '
  'has a correct mirror however old its timestamp.';

notify pgrst, 'reload schema';
