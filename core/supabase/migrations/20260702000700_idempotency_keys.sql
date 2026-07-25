-- Idempotency keys for the BaaS API (architecture decision D6):
-- header-based, never expire, pass through to Blnk `reference`,
-- 409 on same key + different request_hash, replay cached response otherwise.

create table if not exists "core"."idempotency_keys" (
  "idempotency_key" text primary key,
  "partner_id" text,
  "endpoint" text not null,
  "request_hash" text not null,             -- SHA-256 of the normalized request body
  "response_status" int,
  "response_body" jsonb,
  "blnk_reference" text,
  "created_at" timestamptz not null default now()
);
comment on table "core"."idempotency_keys" is
  'D6: Idempotency-Key registry. Same key + same request_hash -> replay cached response; different request_hash -> 409.';

create index if not exists "idx_idempotency_keys_blnk_reference"
  on "core"."idempotency_keys" ("blnk_reference");

alter table "core"."idempotency_keys" enable row level security;
