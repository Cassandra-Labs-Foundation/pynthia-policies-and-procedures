-- Record retention (BSA-21) and its lifecycle mechanics (SC-02).
--
-- BSA-21's trigger is account.closed, which the core already emits — so like
-- case management this starts from a real event rather than a fabricated one.
-- What it needs that did not exist: the retention register itself. The controls
-- reference record.retention_anchor / retention_class / retention_expires_at /
-- legal_hold_flag, and there is no core.record table at all. core.legal_hold
-- and core.records_package exist but neither is a per-record retention row.
--
-- THE THREE-CONDITION RULE, MADE UNREPRESENTABLE
--
-- SC-02: a record becomes eligible for disposal only when (a) retention has
-- expired, (b) no legal hold is in force, and (c) records-retention approval
-- has been given. Each of those is a CHECK constraint below, so a premature,
-- held, or unapproved disposal cannot be written at all — not by the API, not
-- by service_role, not by a psql session. Destroying a record early is the one
-- action in this domain that cannot be undone or compensated, which is why it
-- is enforced where nothing can route around it rather than in the writer.
--
-- Legal hold PRECEDES everything: "legal holds take precedence over all
-- scheduled destruction". The constraint is written so the hold flag alone is
-- sufficient to block, independent of dates and approvals.

-- ------------------------------------------------------ the retention register
create table if not exists "core"."record" (
  "id" text primary key,

  -- BSA-21's schedule is per record CLASS, and the class also decides which
  -- anchor date the clock runs from — closure for CIP identity, filing date
  -- for a SAR. Both are stored rather than derived so a schedule change does
  -- not silently re-date existing records.
  "record_class" text not null check ("record_class" in (
    'cip_identity',          -- 5y after account closure
    'cip_verification',      -- 5y after made
    'beneficial_owner',      -- 5y after account closure
    'ctr',                   -- 5y from report date
    'sar',                   -- 5y from filing date
    'monetary_instrument',   -- 5y
    'wire_transfer',         -- 5y
    'cmir',                  -- 5y
    'ofac_blocked'           -- 10y after unblocking / transaction date
  )),
  "subject_ref" text not null,
  "retention_anchor" timestamptz not null,
  "retention_anchor_kind" text not null,
  "retention_expires_at" timestamptz not null,

  "legal_hold_flag" boolean not null default false,
  "legal_hold_id" text,

  -- SC-02 condition (c). Recorded as an ACTOR, not a boolean: "who approved
  -- this destruction" is the question asked after the fact.
  "disposal_approved_by" text,
  "disposal_approved_at" timestamptz,

  "disposed_at" timestamptz,
  "destruction_certificate" text,

  "provenance" text not null default 'unknown'
    check ("provenance" in ('production', 'unknown')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

comment on table "core"."record" is
  'Retention register (BSA-21). Deliberately has NO partner_id: retention is the chartered institution''s obligation across every fintech it hosts, like control_result and bsa_alert. See ownership.ts INSTANCE_SCOPED_TABLES.';

-- ---------------------------------------------- the three disposal conditions
--
-- Written as three separate constraints rather than one compound check so a
-- violation names WHICH condition failed. A single constraint would report
-- "ck_record_disposal violated" for all three causes, and the difference
-- between "too early" and "under legal hold" is exactly what an investigator
-- needs to know.

-- (a) retention must have expired
alter table "core"."record" drop constraint if exists "ck_record_disposal_after_expiry";
alter table "core"."record"
  add constraint "ck_record_disposal_after_expiry"
  check ("disposed_at" is null or "disposed_at" >= "retention_expires_at");

-- (b) legal hold blocks destruction, unconditionally and by itself
alter table "core"."record" drop constraint if exists "ck_record_disposal_not_held";
alter table "core"."record"
  add constraint "ck_record_disposal_not_held"
  check ("disposed_at" is null or "legal_hold_flag" = false);

-- (c) approval is required, and must precede the disposal it authorises
alter table "core"."record" drop constraint if exists "ck_record_disposal_approved";
alter table "core"."record"
  add constraint "ck_record_disposal_approved"
  check (
    "disposed_at" is null
    or ("disposal_approved_by" is not null
        and "disposal_approved_at" is not null
        and "disposal_approved_at" <= "disposed_at")
  );

comment on constraint "ck_record_disposal_not_held" on "core"."record" is
  'SC-02: legal holds take precedence over all scheduled destruction. Independent of dates and approvals — the flag alone blocks.';

-- Provenance is immutable here for the same reason as everywhere else.
drop trigger if exists "freeze_provenance" on "core"."record";
create trigger "freeze_provenance" before update on "core"."record"
  for each row execute function "core"."forbid_provenance_update"();

-- A destroyed record cannot come back. Without this an UPDATE could clear
-- disposed_at and make a destroyed record look extant, which would misrepresent
-- the destruction log rather than merely losing data.
create or replace function "core"."forbid_disposal_reversal"()
returns trigger language plpgsql as $$
begin
  if old."disposed_at" is not null and new."disposed_at" is distinct from old."disposed_at" then
    raise exception 'disposal is irreversible: record % was destroyed at %', old."id", old."disposed_at";
  end if;
  return new;
end $$;

drop trigger if exists "freeze_disposal" on "core"."record";
create trigger "freeze_disposal" before update on "core"."record"
  for each row execute function "core"."forbid_disposal_reversal"();

-- --------------------------------------------------------------- legal hold
alter table "core"."legal_hold"
  add column if not exists "scope_class" text,
  add column if not exists "scope_subject_ref" text,
  add column if not exists "placed_by" text,
  add column if not exists "provenance" text not null default 'unknown';

alter table "core"."legal_hold" drop constraint if exists "ck_legal_hold_provenance";
alter table "core"."legal_hold"
  add constraint "ck_legal_hold_provenance"
  check ("provenance" in ('production', 'unknown'));

-- SC-02: "hold release requires written authorization from the CCO or General
-- Counsel". Release without a recorded approver is refused structurally, the
-- same shape as the SAR do-not-file rationale.
alter table "core"."legal_hold" drop constraint if exists "ck_legal_hold_release_authorized";
alter table "core"."legal_hold"
  add constraint "ck_legal_hold_release_authorized"
  check ("released_at" is null or "release_approved_by" is not null);

-- ------------------------------------------------------------ sim mirror
--
-- THE substrate case. Retention periods are five and ten years, so disposal
-- eligibility cannot be reached by waiting and cannot be tested in core without
-- fabricating a record that claims to be from 2019 — which is precisely the
-- false evidence the provenance split exists to prevent. Aged records live in
-- sim, where 'simulated' is the only permitted provenance and a coverage query
-- against core cannot see them.
create table if not exists "sim"."record" (like "core"."record" including defaults including indexes);

alter table "sim"."record" alter column "provenance" set default 'simulated';
alter table "sim"."record" drop constraint if exists "ck_record_provenance";
alter table "sim"."record" drop constraint if exists "ck_sim_record_provenance";
alter table "sim"."record"
  add constraint "ck_sim_record_provenance" check ("provenance" = 'simulated');

-- The disposal conditions are re-applied identically. The substrate must be
-- able to reproduce a VIOLATION faithfully, and it can only do that if the
-- constraint it violates is the same one core has.
alter table "sim"."record" drop constraint if exists "ck_sim_record_disposal_after_expiry";
alter table "sim"."record"
  add constraint "ck_sim_record_disposal_after_expiry"
  check ("disposed_at" is null or "disposed_at" >= "retention_expires_at");
alter table "sim"."record" drop constraint if exists "ck_sim_record_disposal_not_held";
alter table "sim"."record"
  add constraint "ck_sim_record_disposal_not_held"
  check ("disposed_at" is null or "legal_hold_flag" = false);
alter table "sim"."record" drop constraint if exists "ck_sim_record_disposal_approved";
alter table "sim"."record"
  add constraint "ck_sim_record_disposal_approved"
  check (
    "disposed_at" is null
    or ("disposal_approved_by" is not null and "disposal_approved_at" is not null
        and "disposal_approved_at" <= "disposed_at")
  );

drop trigger if exists "freeze_disposal" on "sim"."record";
create trigger "freeze_disposal" before update on "sim"."record"
  for each row execute function "core"."forbid_disposal_reversal"();

create table if not exists "sim"."legal_hold" (like "core"."legal_hold" including defaults);
alter table "sim"."legal_hold" alter column "provenance" set default 'simulated';
alter table "sim"."legal_hold" drop constraint if exists "ck_legal_hold_provenance";
alter table "sim"."legal_hold" drop constraint if exists "ck_sim_legal_hold_provenance";
alter table "sim"."legal_hold"
  add constraint "ck_sim_legal_hold_provenance" check ("provenance" = 'simulated');

-- ----------------------------------------------------------------- indexes
--
-- The disposal sweep looks for the eligible tail: expired, not held, not yet
-- disposed. Partial index matching that predicate exactly.
create index if not exists "idx_record_disposal_eligible"
  on "core"."record" ("retention_expires_at")
  where "disposed_at" is null and "legal_hold_flag" = false;
create index if not exists "idx_record_subject" on "core"."record" ("subject_ref");
create index if not exists "idx_record_class" on "core"."record" ("record_class");
create index if not exists "idx_legal_hold_scope" on "core"."legal_hold" ("scope_subject_ref");

grant all privileges on "core"."record" to "service_role";
grant all privileges on "sim"."record" to "service_role";
grant all privileges on "sim"."legal_hold" to "service_role";

notify pgrst, 'reload schema';
