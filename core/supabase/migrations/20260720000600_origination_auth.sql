-- Cards 64/65/66/67 — Origination API: auth, FBO reads, the reserve saga.
--
-- Card 64 note says "mTLS + short-lived JWT + /auth/token". The mTLS half is
-- PLATFORM-BLOCKED: Supabase terminates TLS at its edge and does not forward
-- client certificates to edge functions, so mutual TLS cannot be enforced
-- here. That is flagged, not papered over (the cards 08/14/17 rule). What IS
-- enforceable: /auth/token exchanges a per-instance client secret for a
-- short-lived (300s) instance JWT, so long-lived secrets never ride on
-- request paths — only their 5-minute derivatives do.
create table if not exists "aggregator"."instance_credential" (
  "instance_id" text primary key,
  -- sha256 hex of the client secret; the plaintext never lands in this db
  "client_secret_hash" text not null,
  "created_at" timestamptz not null default now(),
  "rotated_at" timestamptz
);

-- Card 66: an origination is the aggregator-side intent to move money out of
-- an instance's FBO position. It is born pending WITH its reserve (one txn);
-- the saga (card 67) resolves it to accepted or rejected.
create table if not exists "aggregator"."origination" (
  "id" text primary key default ('org_' || replace(gen_random_uuid()::text, '-', '')),
  "instance_id" text not null,
  "amount_cents" bigint not null check ("amount_cents" > 0),
  "status" text not null default 'pending'
    check ("status" in ('pending', 'accepted', 'rejected')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "aggregator"."reserve" (
  "id" text primary key default ('rsv_' || replace(gen_random_uuid()::text, '-', '')),
  "origination_id" text not null unique references "aggregator"."origination"("id"),
  "instance_id" text not null,
  "amount_cents" bigint not null check ("amount_cents" > 0),
  "status" text not null default 'held'
    check ("status" in ('held', 'captured', 'released')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

-- Card 65: FBO reads return CONSUMER-BUILT state — position from the Payment
-- Hub's fbo_position, available = position minus held reserves, inbound =
-- money events the hub has not applied yet (beyond its cursor). Nothing here
-- recomputes from raw events; reads reflect exactly what the consumers built.
create or replace function "aggregator".fbo_read(p_instance text)
returns jsonb language sql stable as $$
  select jsonb_build_object(
    'instance_id', p_instance,
    'position_cents', coalesce((select position_cents
        from "aggregator"."fbo_position" where instance_id = p_instance), 0),
    'reserved_cents', coalesce((select sum(amount_cents)
        from "aggregator"."reserve"
        where instance_id = p_instance and status = 'held'), 0),
    'available_balance_cents',
      coalesce((select position_cents
        from "aggregator"."fbo_position" where instance_id = p_instance), 0)
      - coalesce((select sum(amount_cents)
        from "aggregator"."reserve"
        where instance_id = p_instance and status = 'held'), 0),
    'inbound_cents', coalesce((select sum((e.payload->>'amount_cents')::bigint)
        from "aggregator"."event" e
        where e.instance_id = p_instance
          and e.sequence_id > (select last_seq from "aggregator"."consumer_cursor"
                               where consumer = 'payment_hub')
          and "aggregator".is_money_code(e.code)
          and (e.payload ? 'amount_cents')), 0)
  );
$$;

-- Card 66: a clean origination reserves and returns pending; a stale Payment
-- Hub refuses with retry-after — originating against a position nobody is
-- maintaining would reserve against fiction. Freshness means the consumer
-- RAN recently (updated_at, the liveness stamp), not that it advanced.
create or replace function "aggregator".originate(
  p_instance text, p_amount bigint, p_stale_after_secs integer default 120
) returns jsonb language plpgsql as $$
declare
  hub_ran_at timestamptz;
  avail bigint;
  org_id text;
  rsv_id text;
begin
  select updated_at into hub_ran_at
    from "aggregator"."consumer_cursor" where consumer = 'payment_hub';
  if hub_ran_at is null or hub_ran_at < now() - make_interval(secs => p_stale_after_secs) then
    return jsonb_build_object(
      'error', 'consumer_stale',
      'retry_after_secs', p_stale_after_secs,
      'detail', 'payment_hub last ran ' || coalesce(hub_ran_at::text, 'never')
        || '; refusing to reserve against unmaintained state');
  end if;

  -- Serialize originations per instance (card 69): without this lock, two
  -- concurrent originations could both read the same available balance and
  -- jointly oversubscribe the position. Locking the position row makes
  -- check-then-reserve atomic per instance. No row = position 0 = nothing
  -- to oversubscribe; the available check below refuses on its own.
  perform 1 from "aggregator"."fbo_position"
    where instance_id = p_instance for update;

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

-- Card 67: the saga's two exits, each a single transaction (a pl/pgsql
-- function body), each returning the position before/after so callers hold
-- the conservation evidence rather than trusting the transition happened.
--   accept: reserve held->captured, position -= amount. Net across the pair:
--           exactly -amount, no residual hold.
--   reject: reserve held->released, position untouched. Net: zero.
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

  select coalesce(position_cents, 0) into pos_before
    from "aggregator"."fbo_position" where instance_id = org.instance_id for update;

  update "aggregator"."reserve" set status = 'captured', updated_at = now()
    where origination_id = p_id and status = 'held';
  if not found then return jsonb_build_object('error', 'reserve_missing'); end if;

  update "aggregator"."fbo_position"
    set position_cents = position_cents - org.amount_cents, updated_at = now()
    where instance_id = org.instance_id
    returning position_cents into pos_after;
  update "aggregator"."origination" set status = 'accepted', updated_at = now()
    where id = p_id;

  return jsonb_build_object('origination_id', p_id, 'status', 'accepted',
    'position_before_cents', pos_before, 'position_after_cents', pos_after);
end $$;

create or replace function "aggregator".reject_origination(p_id text)
returns jsonb language plpgsql as $$
declare
  org record;
begin
  select o.id, o.instance_id, o.amount_cents, o.status into org
    from "aggregator"."origination" o where o.id = p_id for update;
  if org.id is null then return jsonb_build_object('error', 'not_found'); end if;
  if org.status <> 'pending' then
    return jsonb_build_object('error', 'wrong_state', 'status', org.status);
  end if;

  update "aggregator"."reserve" set status = 'released', updated_at = now()
    where origination_id = p_id and status = 'held';
  update "aggregator"."origination" set status = 'rejected', updated_at = now()
    where id = p_id;

  return jsonb_build_object('origination_id', p_id, 'status', 'rejected');
end $$;

notify pgrst, 'reload schema';
