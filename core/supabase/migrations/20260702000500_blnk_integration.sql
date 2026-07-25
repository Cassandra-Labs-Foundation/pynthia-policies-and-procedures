-- =====================================================================
-- Blnk × Supabase integration — Phase 1 mapping layer
-- See supabase/blnk-integration-plan.md
--
-- Blnk (managed Cloud) is the source of truth for money. This migration adds a
-- thin mapping layer to the spec-generated `core` schema: pointers to Blnk
-- objects (balances, transactions, identities), a webhook event inbox, and sync
-- state. Hand-authored (not regenerated) — the blnk_* fields are an integration
-- concern, not part of core-api.yaml.
--
-- Nothing sensitive is added here: authoritative PII residency is a compliance
-- decision (plan §11.2); this layer stores only ids/status/flags.
-- =====================================================================

-- ---- account: balance is a MIRROR of Blnk; add balance + ledger pointers ----
alter table "core"."account"
  add column if not exists "blnk_balance_id" text,
  add column if not exists "balance_synced_at" timestamptz;
comment on column "core"."account"."blnk_balance_id" is 'Blnk balance id (bln_...) — the customer account balance. Source of truth for funds.';
comment on column "core"."account"."blnk_ledger_id" is 'Blnk ledger id (ldg_...) grouping this account''s balance (customer ledger).';
comment on column "core"."account"."balance" is 'CACHED MIRROR of the Blnk balance; updated from webhooks. Blnk is authoritative — do not compute here.';
comment on column "core"."account"."balance_synced_at" is 'When `balance` was last reconciled from a Blnk event/snapshot.';

-- ---- money-movement tables -> Blnk transactions ----
alter table "core"."ach_transfer"
  add column if not exists "blnk_transaction_id" text,
  add column if not exists "blnk_reference" text,
  add column if not exists "blnk_status" text,
  add column if not exists "synced_at" timestamptz;
alter table "core"."wire_transfer"
  add column if not exists "blnk_transaction_id" text,
  add column if not exists "blnk_reference" text,
  add column if not exists "blnk_status" text,
  add column if not exists "synced_at" timestamptz;
alter table "core"."transfer"
  add column if not exists "blnk_transaction_id" text,
  add column if not exists "blnk_reference" text,
  add column if not exists "blnk_status" text,
  add column if not exists "synced_at" timestamptz;
alter table "core"."inbound_payment"
  add column if not exists "blnk_transaction_id" text,
  add column if not exists "blnk_reference" text,
  add column if not exists "synced_at" timestamptz;

-- card auth/settle -> Blnk INFLIGHT (hold -> partial/incremental commit -> void)
alter table "core"."card_authorization"
  add column if not exists "blnk_inflight_id" text,
  add column if not exists "blnk_reference" text,
  add column if not exists "blnk_committed_amount" bigint,
  add column if not exists "blnk_status" text,
  add column if not exists "synced_at" timestamptz;
comment on column "core"."card_authorization"."blnk_inflight_id" is 'Blnk inflight transaction id (hold). Settlement = commit (partial/incremental); decline/expiry = void.';
comment on column "core"."card_authorization"."blnk_committed_amount" is 'Cumulative committed (settled) amount against the inflight hold, in minor units.';

-- ---- entity -> Blnk identity ; verification -> tokenization flag ----
alter table "core"."entity"
  add column if not exists "blnk_identity_id" text;
comment on column "core"."entity"."blnk_identity_id" is 'Blnk identity id (idt_...). Deterministic: idt_<entity uuid>.';
alter table "core"."verification"
  add column if not exists "blnk_tokenized" boolean not null default false;
comment on column "core"."verification"."blnk_tokenized" is 'True once PII fields are tokenized in Blnk (FirstName/LastName/EmailAddress/PhoneNumber/Street/PostCode).';

-- blnk_status reflects Blnk transaction lifecycle
do $$
declare t text;
begin
  foreach t in array array['ach_transfer','wire_transfer','transfer','card_authorization'] loop
    execute format(
      'alter table core.%I add constraint %I check (%I in (''QUEUED'',''INFLIGHT'',''APPLIED'',''VOID'',''REJECTED'',''SCHEDULED''))',
      t, 'chk_'||t||'_blnk_status', 'blnk_status');
  end loop;
end $$;

-- ---- webhook event inbox (idempotent ingest of Blnk events) ----
create table if not exists "core"."blnk_event" (
  "id" text primary key,                       -- Blnk event/delivery id (idempotency key)
  "event" text not null,                        -- e.g. transaction.applied, balance.monitor
  "blnk_id" text,                               -- referenced Blnk object id (txn_/bln_/idt_...)
  "resource_type" text,                         -- mapped core table, e.g. ach_transfer
  "resource_id" text,                           -- mapped core row id
  "payload" jsonb not null,
  "status" text not null default 'received'
      check ("status" in ('received', 'processed', 'failed', 'skipped')),
  "error" text,
  "received_at" timestamptz not null default now(),
  "processed_at" timestamptz,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);
comment on table "core"."blnk_event" is 'Inbox for Blnk webhooks. Ingested idempotently by delivery id, then applied to the target row.';

-- ---- sync state (drift detection / backfill cursors) ----
create table if not exists "core"."blnk_sync_state" (
  "resource" text primary key,                  -- e.g. balances, transactions, identities
  "last_cursor" text,
  "last_synced_at" timestamptz,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);
comment on table "core"."blnk_sync_state" is 'Per-resource sync cursor + last-sync time for Blnk backfill and balance-drift checks.';

-- ---- indexes ----
create index if not exists "idx_account_blnk_balance_id" on "core"."account" ("blnk_balance_id");
create index if not exists "idx_ach_transfer_blnk_transaction_id" on "core"."ach_transfer" ("blnk_transaction_id");
create index if not exists "idx_ach_transfer_blnk_reference" on "core"."ach_transfer" ("blnk_reference");
create index if not exists "idx_ach_transfer_blnk_status" on "core"."ach_transfer" ("blnk_status");
create index if not exists "idx_wire_transfer_blnk_transaction_id" on "core"."wire_transfer" ("blnk_transaction_id");
create index if not exists "idx_wire_transfer_blnk_reference" on "core"."wire_transfer" ("blnk_reference");
create index if not exists "idx_wire_transfer_blnk_status" on "core"."wire_transfer" ("blnk_status");
create index if not exists "idx_transfer_blnk_transaction_id" on "core"."transfer" ("blnk_transaction_id");
create index if not exists "idx_transfer_blnk_reference" on "core"."transfer" ("blnk_reference");
create index if not exists "idx_transfer_blnk_status" on "core"."transfer" ("blnk_status");
create index if not exists "idx_inbound_payment_blnk_transaction_id" on "core"."inbound_payment" ("blnk_transaction_id");
create index if not exists "idx_card_authorization_blnk_inflight_id" on "core"."card_authorization" ("blnk_inflight_id");
create index if not exists "idx_card_authorization_blnk_status" on "core"."card_authorization" ("blnk_status");
create index if not exists "idx_entity_blnk_identity_id" on "core"."entity" ("blnk_identity_id");
create index if not exists "idx_blnk_event_event" on "core"."blnk_event" ("event");
create index if not exists "idx_blnk_event_status" on "core"."blnk_event" ("status");
create index if not exists "idx_blnk_event_resource_id" on "core"."blnk_event" ("resource_id");
create index if not exists "idx_blnk_event_blnk_id" on "core"."blnk_event" ("blnk_id");

-- ---- updated_at triggers on new tables ----
drop trigger if exists "set_updated_at" on "core"."blnk_event";
create trigger "set_updated_at" before update on "core"."blnk_event"
  for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."blnk_sync_state";
create trigger "set_updated_at" before update on "core"."blnk_sync_state"
  for each row execute function "core".set_updated_at();

-- ---- RLS: locked down (service_role only), consistent with the rest of core ----
alter table "core"."blnk_event" enable row level security;
alter table "core"."blnk_sync_state" enable row level security;
