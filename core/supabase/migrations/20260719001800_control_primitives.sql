-- The recurring control primitives (§5e).
--
-- Set-cover analysis over all 298 unreachable controls found seven structural
-- shapes that recur regardless of policy. Two exist already (core.obligation
-- for cadence, core.payment_approval for four-eyes). This adds the rest.
--
-- WHY FOUR SHAPES BECAME ONE TABLE
--
-- C (work item), D (request -> decision), F (notice issuance) and E (inbound
-- correspondence) all share the same skeleton: something opens, has a deadline,
-- and closes with an outcome. Four tables would be four near-identical schemas,
-- four sweeps, and four chances for the overdue logic to drift apart — which is
-- the same argument that collapsed the second four-eyes constraint into
-- core.payment_approval.
--
-- They are ONE table with a `kind` discriminator and kind-specific CHECK
-- constraints, so the differences that matter are enforced and the skeleton is
-- shared. G (thresholds) and J (attestations) are genuinely different shapes and
-- stay separate.
--
-- WHAT THIS DELIBERATELY DOES NOT DO
--
-- It registers nothing. An empty primitive changes no coverage number, and per
-- BLUEPRINT 5c a capability nobody has exercised is not an emission. These
-- tables are load-bearing only once a domain puts real rows in them.

-- ============================================================ C / D / F / E
create table if not exists "core"."work_item" (
  "id" text primary key,

  -- policy-qualified (policy:control_id) because control_id is not unique —
  -- CP-01 names two different controls (OQ-11)
  "control_uid" text not null,

  "kind" text not null check ("kind" in (
    'task',     -- C: work someone must do          (review, remediation, engagement)
    'request',  -- D: a proposal awaiting a decision (exception, limit change, waiver)
    'notice',   -- F: something that must be issued  (adverse action, member notice, report)
    'inbound'   -- E: correspondence that arrived    (regulator request, SOC report, subpoena)
  )),

  "subject_ref" text,
  "title" text not null,
  "assigned_to" text,

  "status" text not null default 'open'
    check ("status" in ('open', 'in_progress', 'completed', 'cancelled')),

  "opened_at" timestamptz not null default now(),
  "opened_by" text not null,
  -- Nullable: not every work item has a regulatory deadline. But a NULL due_at
  -- means the item can never be overdue, so the sweep reports those separately
  -- rather than letting them look current — the same visible-unknown treatment
  -- as an unanchored obligation.
  "due_at" timestamptz,

  "closed_at" timestamptz,
  "closed_by" text,
  "outcome" text,
  "outcome_rationale" text,

  -- E only: who it came from and when it arrived. The arrival time is distinct
  -- from opened_at because correspondence can be logged days after receipt, and
  -- the response clock runs from RECEIPT.
  "source_ref" text,
  "received_at" timestamptz,

  "provenance" text not null default 'unknown'
    check ("provenance" in ('production', 'demo', 'unknown')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

-- A closed item names who closed it and when. Same reasoning as every other
-- completion in this schema: an unattributed close is not evidence.
alter table "core"."work_item" drop constraint if exists "ck_work_item_closed_attributed";
alter table "core"."work_item"
  add constraint "ck_work_item_closed_attributed"
  check (
    "status" not in ('completed', 'cancelled')
    or ("closed_at" is not null and "closed_by" is not null)
  );

-- D: a request that completed must say what was decided. A completed request
-- with no outcome is the decision nobody recorded.
alter table "core"."work_item" drop constraint if exists "ck_work_item_request_outcome";
alter table "core"."work_item"
  add constraint "ck_work_item_request_outcome"
  check ("kind" <> 'request' or "status" <> 'completed' or "outcome" is not null);

-- An adverse outcome needs a documented reason, wherever it appears. Third
-- instance of this rule (SAR no-file, ACH return code, now here).
alter table "core"."work_item" drop constraint if exists "ck_work_item_adverse_rationale";
alter table "core"."work_item"
  add constraint "ck_work_item_adverse_rationale"
  check (
    "outcome" is null
    or "outcome" not in ('denied', 'rejected', 'no_action')
    or "outcome_rationale" is not null
  );

-- E: inbound correspondence must say where it came from, or it cannot be
-- responded to or evidenced.
alter table "core"."work_item" drop constraint if exists "ck_work_item_inbound_source";
alter table "core"."work_item"
  add constraint "ck_work_item_inbound_source"
  check ("kind" <> 'inbound' or ("source_ref" is not null and "received_at" is not null));

comment on column "core"."work_item"."due_at" is
  'NULL means no deadline, which is different from "not yet due". The sweep counts undeadlined items separately so they cannot pass as current.';

create index if not exists "idx_work_item_overdue"
  on "core"."work_item" ("due_at")
  where "status" in ('open', 'in_progress') and "due_at" is not null;
create index if not exists "idx_work_item_undeadlined"
  on "core"."work_item" ("kind")
  where "status" in ('open', 'in_progress') and "due_at" is null;
create index if not exists "idx_work_item_control" on "core"."work_item" ("control_uid");

-- ==================================================================== G
--
-- A limit with an owner, and observations against it.
create table if not exists "core"."threshold" (
  "id" text primary key,
  "control_uid" text not null,
  "metric" text not null,
  "subject_scope" text not null,

  -- NULL = NOT CONFIGURED. Deliberately distinct from zero, exactly as
  -- client_limit.ach_dual_control_over_cents is (OQ-14): zero is a policy
  -- meaning "any amount breaches", null means nobody has set one.
  "limit_value" numeric,
  "warn_value" numeric,
  "direction" text not null default 'above' check ("direction" in ('above', 'below')),

  "owner_role" text,
  "set_by" text,
  "set_at" timestamptz,

  "provenance" text not null default 'unknown'
    check ("provenance" in ('production', 'demo', 'unknown')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),

  constraint "uq_threshold_control_metric_scope" unique ("control_uid", "metric", "subject_scope")
);

-- A warn level must sit on the correct side of the limit, or the warning fires
-- after the breach and is useless.
alter table "core"."threshold" drop constraint if exists "ck_threshold_warn_before_limit";
alter table "core"."threshold"
  add constraint "ck_threshold_warn_before_limit"
  check (
    "warn_value" is null or "limit_value" is null
    or ("direction" = 'above' and "warn_value" <= "limit_value")
    or ("direction" = 'below' and "warn_value" >= "limit_value")
  );

create table if not exists "core"."threshold_observation" (
  "id" text primary key,
  "threshold_id" text not null,
  "observed_value" numeric not null,
  "observed_at" timestamptz not null default now(),

  -- 'unassessed' when the threshold has no configured limit. The observation is
  -- still RECORDED — the value was real — but no breach determination exists.
  "assessment" text not null
    check ("assessment" in ('within', 'warn', 'breach', 'unassessed')),

  "provenance" text not null default 'unknown'
    check ("provenance" in ('production', 'demo', 'unknown')),
  "created_at" timestamptz not null default now()
);

alter table "core"."threshold_observation" drop constraint if exists "fk_threshold_observation_threshold";
alter table "core"."threshold_observation"
  add constraint "fk_threshold_observation_threshold"
  foreign key ("threshold_id") references "core"."threshold" ("id");

create index if not exists "idx_threshold_observation_breach"
  on "core"."threshold_observation" ("threshold_id", "observed_at" desc)
  where "assessment" in ('breach', 'warn');
create index if not exists "idx_threshold_unassessed"
  on "core"."threshold_observation" ("observed_at")
  where "assessment" = 'unassessed';

-- ==================================================================== J
--
-- Append-only. An attestation that can be edited is not an attestation.
create table if not exists "core"."attestation" (
  "id" text primary key,
  "control_uid" text not null,
  "subject_ref" text,
  "statement" text not null,
  "attested_by" text not null,
  "attested_at" timestamptz not null default now(),
  "period_start" date,
  "period_end" date,
  "evidence_ref" text,
  "provenance" text not null default 'unknown'
    check ("provenance" in ('production', 'demo', 'unknown')),
  "created_at" timestamptz not null default now()
);

alter table "core"."attestation" drop constraint if exists "ck_attestation_period_ordered";
alter table "core"."attestation"
  add constraint "ck_attestation_period_ordered"
  check ("period_start" is null or "period_end" is null or "period_start" <= "period_end");

create or replace function "core"."forbid_attestation_update"()
returns trigger language plpgsql as $$
begin
  raise exception
    'attestations are append-only: % cannot be modified after it was made', old."id";
end $$;

drop trigger if exists "freeze_attestation" on "core"."attestation";
create trigger "freeze_attestation" before update or delete on "core"."attestation"
  for each row execute function "core"."forbid_attestation_update"();

comment on table "core"."attestation" is
  'Append-only register (primitive J). An attestation that can be edited or deleted after the fact is not evidence of anything, so the trigger refuses both.';

create index if not exists "idx_attestation_control" on "core"."attestation" ("control_uid", "attested_at" desc);

-- ============================================================== sim mirrors
create table if not exists "sim"."work_item" (like "core"."work_item" including defaults including indexes);
create table if not exists "sim"."threshold" (like "core"."threshold" including defaults);
create table if not exists "sim"."threshold_observation" (like "core"."threshold_observation" including defaults including indexes);
create table if not exists "sim"."attestation" (like "core"."attestation" including defaults including indexes);
do $$
declare t text;
begin
  foreach t in array array['work_item', 'threshold', 'threshold_observation', 'attestation'] loop
    execute format('alter table "sim".%I alter column "provenance" set default ''simulated''', t);
    execute format('alter table "sim".%I drop constraint if exists %I', t, 'ck_' || t || '_provenance');
    execute format(
      'alter table "sim".%I add constraint %I check ("provenance" = ''simulated'')',
      t, 'ck_sim_' || t || '_provenance');
  end loop;
end $$;

grant all privileges on
  "core"."work_item", "core"."threshold", "core"."threshold_observation", "core"."attestation"
  to "service_role";
grant all privileges on
  "sim"."work_item", "sim"."threshold", "sim"."threshold_observation", "sim"."attestation"
  to "service_role";

notify pgrst, 'reload schema';
