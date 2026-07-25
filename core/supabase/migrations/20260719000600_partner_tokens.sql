-- Cards 45 (partner tokens) + 51 (partner confinement).
--
-- Replaces the single shared DEMO_API_KEY with per-partner scoped tokens, and
-- binds every token to THIS instance so it fails closed anywhere else.
--
-- Architecture basis:
--   D5  auth model      — partner tokens scoped to partner_id, allowed endpoints
--   D14 rate limiting   — tiers: read / write / real-time / bulk
--   D18 multi-tenancy   — instance-per-fintech (one instance IS one fintech)
--   D23 isolation       — the actor access matrix below
--
-- NOTE ON RLS: the edge functions connect as `service_role`, which BYPASSES
-- RLS (see 20260702000800_core_grants.sql). RLS is therefore NOT the boundary
-- that confines a partner, and nothing here pretends it is. Enforcement lives
-- at the edge (api/auth.ts). What this migration makes real at the DB level is
-- the instance binding: token lookup filters on instance_id, so a token row
-- restored into the wrong instance's database cannot authenticate.

-- ---------------------------------------------------------------- instance
--
-- This instance's own identity. Exactly one row, enforced by the CHECK on a
-- constant column: instance identity is not something that can be ambiguous,
-- and two rows here would make "is this token ours?" unanswerable.
create table if not exists "core"."instance" (
  "singleton" boolean primary key default true check ("singleton"),
  "id" text not null,
  "name" text,
  -- 'fintech' instances host one partner; 'aggregator' is the cross-fintech
  -- layer (D18) and must never accept a partner token at all.
  "kind" text not null default 'fintech' check ("kind" in ('fintech', 'aggregator')),
  "created_at" timestamptz not null default now()
);

comment on table "core"."instance" is
  'D18: this instance''s identity. Exactly one row. Token lookup joins on it so a foreign token cannot authenticate here.';

-- ----------------------------------------------------------------- partner
create table if not exists "core"."partner" (
  "id" text primary key,
  "name" text not null,
  "instance_id" text not null,
  -- suspended: tokens stop working but survive, so access can be restored
  -- without re-issuing credentials. offboarded is terminal.
  "status" text not null default 'active'
    check ("status" in ('active', 'suspended', 'offboarded')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

comment on table "core"."partner" is
  'D5/D18: the fintech operating on this instance. Suspending a partner disables every token it owns without destroying them.';

-- --------------------------------------------------------------- api_token
--
-- The token PLAINTEXT is never stored. `token_hash` is SHA-256 of the token
-- and is what lookup keys on; `token_prefix` is the leading, non-secret slice
-- kept solely so a token can be named in logs and UIs without handling the
-- secret. A stolen database therefore yields no usable credential.
create table if not exists "core"."api_token" (
  "id" text primary key,
  "token_hash" text not null unique,
  "token_prefix" text not null,

  -- D23 access matrix: what KIND of actor this is. Distinct from scope --
  -- a partner with a wildcard endpoint list still must not reach ops-only
  -- surfaces like /sandbox/reset.
  "actor_type" text not null
    check ("actor_type" in ('partner', 'cu_admin', 'pynthia_ops')),

  -- null for cu_admin / pynthia_ops: those actors are not a fintech
  "partner_id" text,
  "instance_id" text not null,

  -- D5: allowed endpoints. Entries are 'METHOD /route/pattern' matched against
  -- the ROUTE's declared identity, not the raw path, so '{id}' segments cannot
  -- be used to widen scope. '*' means every endpoint.
  "allowed_endpoints" text[] not null default '{}',

  -- D14 tiers. Checked INDEPENDENTLY of the endpoint list: a read-only token
  -- cannot reach a write-tier route even if its endpoint list were widened by
  -- mistake. Defense in depth against one misconfigured field.
  "allowed_tiers" text[] not null default '{}',

  "status" text not null default 'active'
    check ("status" in ('active', 'revoked')),
  "expires_at" timestamptz,
  "last_used_at" timestamptz,
  "revoked_at" timestamptz,
  "created_at" timestamptz not null default now()
);

comment on table "core"."api_token" is
  'D5: scoped partner tokens. Plaintext is never stored — token_hash is SHA-256 of the token. Bound to instance_id (card 51).';
comment on column "core"."api_token"."token_hash" is
  'SHA-256 hex of the token plaintext. The only value that can authenticate; the plaintext is shown once at issue and never again.';
comment on column "core"."api_token"."allowed_endpoints" is
  'Route identities (''POST /payments/wire/prepare''), or ''*''. Matched on the route pattern, never the raw path.';

-- Lookup is always (hash, instance): the instance predicate is part of the
-- authentication query itself rather than a check applied afterwards, so a
-- foreign token cannot be resolved even momentarily.
create index if not exists "idx_api_token_lookup"
  on "core"."api_token" ("token_hash", "instance_id")
  where "status" = 'active';

create index if not exists "idx_api_token_partner"
  on "core"."api_token" ("partner_id");

alter table "core"."instance"  enable row level security;
alter table "core"."partner"   enable row level security;
alter table "core"."api_token" enable row level security;

drop trigger if exists "set_updated_at" on "core"."partner";
create trigger "set_updated_at" before update on "core"."partner"
  for each row execute function "core"."set_updated_at"();

-- ------------------------------------------- idempotency: per-partner keys
--
-- SECURITY FIX, not a refactor. `idempotency_key` was the PRIMARY KEY and
-- `partner_id` (present since 20260702000700) was never written. With one
-- shared credential that was merely untidy; with per-partner tokens it is a
-- cross-tenant leak:
--
--   partner A: POST /transfers  Idempotency-Key: order-42  -> response cached
--   partner B: POST /transfers  Idempotency-Key: order-42  -> REPLAY of A's
--                                                             cached response
--
-- Partner B receives partner A's response body — account ids, amounts,
-- counterparties. 'order-42' is exactly the kind of key a partner derives from
-- its own order numbers, so the collision is likely, not adversarial.
--
-- The key is now scoped per partner: same key from two partners is two
-- independent claims.
update "core"."idempotency_keys"
   set "partner_id" = '_legacy_shared_key'
 where "partner_id" is null;

alter table "core"."idempotency_keys"
  alter column "partner_id" set not null;

alter table "core"."idempotency_keys"
  drop constraint if exists "idempotency_keys_pkey";

alter table "core"."idempotency_keys"
  add constraint "idempotency_keys_pkey"
  primary key ("partner_id", "idempotency_key");

comment on column "core"."idempotency_keys"."partner_id" is
  'Part of the primary key since 20260719000600. Two partners may use the same Idempotency-Key; they are separate claims and must never replay each other''s response.';

-- --------------------------------------------------------------- bootstrap
--
-- Seed THIS instance and the demo partner so a fresh database is usable and
-- the migration chain is self-contained. Deliberately seeds NO token: tokens
-- carry secrets and a checked-in secret is not a secret. Issue one with
-- scripts/issue-token.ts.
insert into "core"."instance" ("singleton", "id", "name", "kind")
values (true, coalesce(current_setting('app.instance_id', true), 'inst_local'), 'local instance', 'fintech')
on conflict ("singleton") do nothing;

insert into "core"."partner" ("id", "name", "instance_id")
select 'ptnr_demo', 'Demo Fintech', "id" from "core"."instance"
on conflict ("id") do nothing;
