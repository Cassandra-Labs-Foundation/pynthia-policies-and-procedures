-- The FBO position becomes a ROLL-UP — R3, decided 2026-08-17.
--
-- THE DECISION IT FINISHES. 20260816000200 settled what an FBO position is:
-- a partner program's end users are members of this credit union and their
-- balances are tracked THROUGH that program's FBO account, which makes the
-- position and the sum of that program's member balances "two views of one
-- number". This migration stops maintaining the second view separately.
--
-- WHAT WAS WRONG, and it was not the arithmetic. `run_payment_hub` accumulated
-- the position forward from `aggregator.event` through a hand-maintained sign
-- table (`fbo_delta`). Three properties of that design, each of which bit:
--
--   1. The sign table was wrong for a month — every money code added, so
--      SENDING money raised the balance. $1,927,341 of pure outflow.
--   2. A forward-only cursor cannot be replayed. When the direction was
--      corrected, the positions already written stayed wrong, and §7's
--      pruning had emptied `aggregator.event` (0 rows at cursor 1705305), so
--      the fix had to be reconstructed from a parquet archive under two
--      competing models with an explained=old/new/no classifier.
--   3. Nothing independent could contradict it. It was wrong in the only
--      copy anyone read, which is why a year of green CI never noticed.
--
-- A derived quantity has none of those failure modes. It cannot drift from
-- its own inputs, it is recomputed rather than replayed, and its sign is not
-- a function anyone can typo — it is whichever way the underlying balances
-- moved.
--
-- WHAT THIS DOES NOT CHANGE. No rail is touched. Money still moves
-- `bln_member -> @FedWire` with no second leg, on-us book transfers still net
-- to zero (now structurally, because neither side leaves the member set
-- rather than because a table says `internal`), and Blnk remains the source
-- of truth for every balance being summed.
--
-- WHAT THIS MAKES LOAD-BEARING. `core.account.balance` is how Postgres knows
-- what Blnk says, so the position is exactly as true as the mirror is. That
-- promotes two things previously treated as overhead into the tie-out itself:
-- the webhook's balance refresh and blnk-reconcile's `sweepBalances` drift
-- check. Do not "optimise" either away; they are now the accuracy of the
-- position, and `fbo_mirror_staleness` below is the tripwire that says so.

-- ---------------------------------------------------------------- 1. preserve
-- The accumulated numbers are financial history and a human may want to diff
-- against them. Renamed, never dropped: this migration removes a MECHANISM,
-- and deleting the evidence of the mechanism it replaces is how the next
-- reconstruction-from-parquet starts.
alter table if exists "aggregator"."fbo_position"
  rename to "fbo_position_accumulated_legacy";

comment on table "aggregator"."fbo_position_accumulated_legacy" is
  'FROZEN 2026-08-17. The forward-only accumulator that aggregator.fbo_position '
  'used to be, kept for comparison against the roll-up that replaced it. '
  'Nothing writes this table; nothing should read it outside an investigation.';

-- ------------------------------------------------------------------ 2. derive
-- Every instance this deployment knows about, whether or not it has partners
-- or ever emitted an event. A missing row previously meant "position 0" by
-- coalesce; it now means the same thing explicitly.
create or replace view "aggregator"."fbo_position" as
  select
    i."instance_id",
    "aggregator".member_share_cents(i."instance_id") as "position_cents",
    -- As-of, and honestly so: the position is only as fresh as the least
    -- recently synced balance underneath it.
    (select min(a."balance_synced_at")
       from "core"."account" a
       join "core"."partner" p on p."id" = a."partner_id"
      where p."instance_id" = i."instance_id"
        and coalesce(a."status", '') <> 'closed') as "updated_at"
  from (
    select "instance_id" from "aggregator"."instance_credential"
    union
    select distinct "instance_id" from "core"."partner" where "instance_id" is not null
    union
    -- Nothing that had a position may silently lose one. A row reading 0 is a
    -- statement; a row that disappears is a reader getting NULL and coalescing
    -- it to the same 0 without ever knowing an instance went missing.
    select "instance_id" from "aggregator"."fbo_position_accumulated_legacy"
  ) i;

comment on view "aggregator"."fbo_position" is
  'The FBO position per instance: the sum of that program''s open member share '
  'balances (aggregator.member_share_cents). A VIEW rather than a table so the '
  'number cannot be written to — the accumulator it replaced was wrong for a '
  'month precisely because it could be. `last_seq` is gone with the cursor that '
  'produced it; `updated_at` is now the oldest balance sync underneath the sum.';

-- --------------------------------------------------------------- 3. staleness
-- The roll-up is only as true as the mirror. This is the check that says when
-- it is not, and it is the replacement for the events-vs-balances tie-out that
-- the roll-up makes vacuous.
create or replace function "aggregator".fbo_mirror_staleness(p_instance text)
returns jsonb language sql stable as $$
  select jsonb_build_object(
    'instance_id', p_instance,
    'accounts', count(*),
    'never_synced', count(*) filter (where a."balance_synced_at" is null),
    'oldest_sync', min(a."balance_synced_at"),
    'stale_over_1h', count(*) filter (
      where a."balance_synced_at" is null
         or a."balance_synced_at" < now() - interval '1 hour')
  )
  from "core"."account" a
  join "core"."partner" p on p."id" = a."partner_id"
  where p."instance_id" = p_instance
    and coalesce(a."status", '') <> 'closed'
$$;

comment on function "aggregator".fbo_mirror_staleness(text) is
  'How much of the FBO roll-up is standing on a stale balance mirror. '
  'blnk-reconcile refreshes those balances every 5 minutes, so a non-zero '
  'stale_over_1h means the reconciler is failing for those accounts and the '
  'position is correspondingly untrustworthy.';

-- ------------------------------------------------------------------- 4. reads
-- `inbound_cents` is gone: it reported money events the hub had not yet
-- applied, and there is no longer an apply step for them to be waiting on.
-- No consumer read it (checked across ui/, functions/, analytics/, scripts/).
--
-- Reserves: a CAPTURED reserve now counts against available alongside a held
-- one. Under the accumulator, accept debited the position and released the
-- hold, netting exactly -amount; counting captured reproduces that same
-- available figure without writing to a derived quantity.
create or replace function "aggregator".fbo_read(p_instance text)
returns jsonb language sql stable as $$
  select jsonb_build_object(
    'instance_id', p_instance,
    'position_cents', "aggregator".member_share_cents(p_instance),
    'reserved_cents', coalesce((select sum(amount_cents)
        from "aggregator"."reserve"
        where instance_id = p_instance and status in ('held', 'captured')), 0),
    'available_balance_cents',
      "aggregator".member_share_cents(p_instance)
      - coalesce((select sum(amount_cents)
          from "aggregator"."reserve"
          where instance_id = p_instance and status in ('held', 'captured')), 0),
    'mirror', "aggregator".fbo_mirror_staleness(p_instance)
  );
$$;

-- -------------------------------------------------------------- 5. no writers
-- accept_origination no longer debits the position. Capturing a reserve does
-- not move a member balance, so under the roll-up it cannot move the position;
-- the capture is carried by the reserve's own status, which fbo_read counts.
--
-- OPEN, and stated rather than assumed: if an accepted origination ever
-- settles into a real outbound movement, member balances will fall AND the
-- captured reserve will still be subtracted — a double count. That rail does
-- not exist today (one accepted origination, $50 on inst_local). It must be
-- resolved before one does.
create or replace function "aggregator".accept_origination(p_id text)
returns jsonb language plpgsql as $$
declare
  org record;
  pos_before bigint;
  pos_after bigint;
begin
  select o.id, o.instance_id, o.amount_cents, o.status into org
    from "aggregator"."origination" o where o.id = p_id for update;
  if org.id is null then return jsonb_build_object('error', 'not_found'); end if;
  if org.status <> 'pending' then
    return jsonb_build_object('error', 'wrong_state', 'status', org.status);
  end if;

  pos_before := "aggregator".member_share_cents(org.instance_id);

  update "aggregator"."reserve" set status = 'captured', updated_at = now()
    where origination_id = p_id and status = 'held';
  if not found then return jsonb_build_object('error', 'reserve_missing'); end if;

  update "aggregator"."origination" set status = 'accepted', updated_at = now()
    where id = p_id;

  pos_after := "aggregator".member_share_cents(org.instance_id);

  return jsonb_build_object('origination_id', p_id, 'status', 'accepted',
    'position_before_cents', pos_before, 'position_after_cents', pos_after);
end $$;

-- ------------------------------------------------------------ 5b. originate
-- Two things in `originate` assumed the accumulator and must move with it.
--
-- THE STALENESS GATE. It refused to reserve when `payment_hub` had not run
-- recently — "refusing to reserve against unmaintained state". That intent is
-- right and now points at the wrong thing: the position no longer depends on
-- the hub, it depends on the balance mirror. So the gate now measures the
-- mirror. It is a strictly better gate than the one it replaces, because it
-- guards the actual input rather than a consumer that happened to feed it.
--
-- THE LOCK. It serialized per instance by locking the fbo_position row, which
-- a view cannot provide. An advisory lock on the instance id gives the same
-- check-then-reserve atomicity without needing a row to exist — and it never
-- silently no-ops the way `for update` on a missing row did.
create or replace function "aggregator".originate(
  p_instance text, p_amount bigint, p_stale_after_secs integer default 120
) returns jsonb language plpgsql as $$
declare
  swept timestamptz;
  avail bigint;
  org_id text;
  rsv_id text;
begin
  -- The maintainer, not the data's absolute age. blnk-reconcile sweeps 25
  -- balances per 5-minute run against ~1,900 accounts, so a full cycle is
  -- hours by design and "oldest balance is older than 120s" is true forever —
  -- a gate that always fires is the same as no gate, decided at the worst
  -- possible moment. What the old gate actually asserted was "the consumer
  -- maintaining this state ran recently", and that is still answerable.
  select last_synced_at into swept
    from "core"."blnk_sync_state" where resource = 'reconcile';
  if swept is null or swept < now() - make_interval(secs => p_stale_after_secs * 5) then
    return jsonb_build_object(
      'error', 'consumer_stale',
      'retry_after_secs', p_stale_after_secs,
      'detail', 'blnk-reconcile last ran ' || coalesce(swept::text, 'never')
        || '; refusing to reserve against unmaintained state');
  end if;

  perform pg_advisory_xact_lock(hashtext(p_instance));

  select (("aggregator".fbo_read(p_instance))->>'available_balance_cents')::bigint into avail;
  if avail < p_amount then
    return jsonb_build_object(
      'error', 'insufficient_available',
      'available_balance_cents', avail, 'requested_cents', p_amount);
  end if;

  insert into "aggregator"."origination" ("instance_id", "amount_cents")
    values (p_instance, p_amount) returning id into org_id;
  insert into "aggregator"."reserve" ("origination_id", "instance_id", "amount_cents")
    values (org_id, p_instance, p_amount) returning id into rsv_id;

  return jsonb_build_object(
    'origination_id', org_id, 'reserve_id', rsv_id,
    'instance_id', p_instance, 'amount_cents', p_amount, 'status', 'pending');
end $$;

-- ---------------------------------------------------------------- 6. teardown
-- The consumer, its cursor, and the sign table that drove it.
drop function if exists "aggregator".run_payment_hub(integer);
drop function if exists "aggregator".fbo_delta(text);
delete from "aggregator"."consumer_cursor" where "consumer" = 'payment_hub';

do $$
begin
  if exists (select 1 from cron.job where jobname = 'aggregator-consumers') then
    perform cron.unschedule('aggregator-consumers');
  end if;
end $$;

select cron.schedule(
  'aggregator-consumers',
  '* * * * *',
  $job$
  select "aggregator".run_bsa_approver(200);
  select "aggregator".health();
  $job$
);

notify pgrst, 'reload schema';
