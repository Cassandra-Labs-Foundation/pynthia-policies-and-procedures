-- Dual control for high-risk payment processes (EPS-06).
--
-- WHAT THIS CONTROL REVEALED
--
-- 1. FOUR-EYES IS NEEDED TWICE, SO IT SHOULD NOT BE BESPOKE.
--
--    20260719001000 gave core.case a hand-written ck_case_four_eyes for the SAR
--    decision. EPS-06 needs exactly the same property on payment origination:
--    whoever creates an ACH batch or prepares a wire must not be whoever
--    approves it. Writing a second bespoke constraint would mean the next
--    domain writes a third, each subtly different, and the drift between them
--    would be invisible until an examiner found it.
--
--    So the approval record is ONE table with ONE constraint, keyed by
--    (resource_type, resource_id). core.case keeps its own constraint because
--    it is already deployed and the columns live on the case row, but every
--    new domain uses this.
--
-- 2. THE API WAS WRONG, NOT THE CONTROL.
--
--    Wire confirm could previously be called by anyone holding a token — the
--    two-phase prepare/confirm split gave dual CONTROL in the sense of two
--    calls, but not dual CONTROL in the sense of two people. EPS-06 says wire
--    dual control is REQUIRED (not "recommended"), so the wire path changes:
--    confirm now demands an approver distinct from the preparer.
--
-- 3. THE ACH THRESHOLD IS A POLICY VALUE NOBODY HAS SUPPLIED.
--
--    EPS-06: "dual control is recommended for clients originating over $50,000
--    per batch; client exposure limits are assigned by the Credit Union". Both
--    the threshold and whether it applies are per-client configuration this
--    repo does not hold. See the unassessed handling below and OQ-14.

-- ------------------------------------------------------- per-client limits
create table if not exists "core"."client_limit" (
  "id" text primary key,
  "partner_id" text not null,

  -- Null means NOT CONFIGURED, which is deliberately distinct from zero.
  -- Zero would mean "every batch needs dual control"; null means nobody has
  -- said. Collapsing the two would turn an unanswered question into a policy.
  "ach_dual_control_over_cents" bigint,
  "ach_client_exposure_limit_cents" bigint,
  "wire_daily_limit_cents" bigint,

  "set_by" text,
  "set_at" timestamptz,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),

  constraint "uq_client_limit_partner" unique ("partner_id")
);

comment on column "core"."client_limit"."ach_dual_control_over_cents" is
  'NULL = not configured, which is NOT the same as 0. An unconfigured limit makes ACH batches UNASSESSED for dual control rather than silently exempt (which fails open) or silently blocked (which fails closed on a value nobody chose). See OQ-14.';

alter table "core"."client_limit" drop constraint if exists "fk_client_limit_partner";
alter table "core"."client_limit"
  add constraint "fk_client_limit_partner"
  foreign key ("partner_id") references "core"."partner" ("id");

-- ------------------------------------------------- the approval record
--
-- One table for every maker-checker relationship, so the four-eyes rule is
-- written once.
create table if not exists "core"."payment_approval" (
  "id" text primary key,

  "resource_type" text not null check ("resource_type" in (
    'wire_transfer', 'ach_transfer', 'client_limit_change', 'pospay_exception'
  )),
  "resource_id" text not null,

  "created_by" text not null,
  "created_at" timestamptz not null default now(),

  "approved_by" text,
  "approved_at" timestamptz,
  "rejected_by" text,
  "rejected_at" timestamptz,
  "decision_note" text,

  -- Why dual control applied at all: the threshold that triggered it, or that
  -- it is unconditional for this rail. Recorded so an examiner can see the
  -- basis rather than inferring it from the amount.
  "basis" text not null,
  "threshold_cents" bigint,

  "provenance" text not null default 'unknown'
    check ("provenance" in ('production', 'demo', 'unknown')),

  constraint "uq_payment_approval_resource" unique ("resource_type", "resource_id")
);

-- THE RULE, written once. Whoever created it may not approve it.
alter table "core"."payment_approval" drop constraint if exists "ck_payment_approval_four_eyes";
alter table "core"."payment_approval"
  add constraint "ck_payment_approval_four_eyes"
  check (
    "approved_by" is null
    or "approved_by" is distinct from "created_by"
  );

comment on constraint "ck_payment_approval_four_eyes" on "core"."payment_approval" is
  'EPS-06 dual control: the actor who originated a payment may not approve it. Same property as ck_case_four_eyes on core.case, deliberately expressed once here so every future domain inherits it rather than writing its own.';

-- A decision is one or the other, never both.
alter table "core"."payment_approval" drop constraint if exists "ck_payment_approval_one_decision";
alter table "core"."payment_approval"
  add constraint "ck_payment_approval_one_decision"
  check (not ("approved_at" is not null and "rejected_at" is not null));

-- A rejection needs an actor too, for the same reason an approval does.
alter table "core"."payment_approval" drop constraint if exists "ck_payment_approval_rejector";
alter table "core"."payment_approval"
  add constraint "ck_payment_approval_rejector"
  check ("rejected_at" is null or "rejected_by" is not null);

create index if not exists "idx_payment_approval_pending"
  on "core"."payment_approval" ("resource_type", "created_at")
  where "approved_at" is null and "rejected_at" is null;

-- ------------------------------------------- dual-control state on the rails
--
-- 'unassessed' is the visible-unknown state. It exists because the ACH
-- threshold is per-client configuration nobody has supplied: a batch from a
-- client with no configured limit cannot be said to need dual control OR to be
-- exempt from it, and pretending otherwise in either direction is the failure
-- this column exists to prevent.
do $$
declare t text;
begin
  foreach t in array array['ach_transfer', 'wire_transfer'] loop
    execute format(
      'alter table "core".%I add column if not exists "dual_control_status" text '
      'not null default ''not_required''', t);
    execute format('alter table "core".%I drop constraint if exists %I', t, 'ck_' || t || '_dual_control');
    execute format(
      'alter table "core".%I add constraint %I check ("dual_control_status" in '
      '(''not_required'', ''required'', ''approved'', ''rejected'', ''unassessed''))', t);
    execute format('alter table "core".%I add column if not exists "created_by" text', t);
  end loop;
end $$;

comment on column "core"."ach_transfer"."dual_control_status" is
  'unassessed = no client limit configured, so no determination could be made. Deliberately distinct from not_required, which is a positive finding that the batch is below a KNOWN threshold.';

-- A wire may not COMPLETE while its dual control is outstanding. Enforced in
-- the database because EPS-06 makes wire dual control unconditional, and a
-- guard in the writer alone would be bypassable by any other code path.
alter table "core"."wire_transfer" drop constraint if exists "ck_wire_dual_control_before_complete";
alter table "core"."wire_transfer"
  add constraint "ck_wire_dual_control_before_complete"
  check (
    "status" <> 'completed'
    or "dual_control_status" in ('approved', 'not_required')
  );

comment on constraint "ck_wire_dual_control_before_complete" on "core"."wire_transfer" is
  'EPS-06: wire dual control is REQUIRED, not recommended. A wire cannot reach completed while its second approval is outstanding, unassessed or rejected.';

-- sim mirrors
create table if not exists "sim"."payment_approval" (like "core"."payment_approval" including defaults including indexes);
alter table "sim"."payment_approval" alter column "provenance" set default 'simulated';
alter table "sim"."payment_approval" drop constraint if exists "ck_payment_approval_provenance";
alter table "sim"."payment_approval"
  add constraint "ck_sim_payment_approval_provenance" check ("provenance" = 'simulated');
alter table "sim"."payment_approval" drop constraint if exists "ck_sim_payment_approval_four_eyes";
alter table "sim"."payment_approval"
  add constraint "ck_sim_payment_approval_four_eyes"
  check ("approved_by" is null or "approved_by" is distinct from "created_by");

create table if not exists "sim"."client_limit" (like "core"."client_limit" including defaults);

grant all privileges on "core"."client_limit", "core"."payment_approval" to "service_role";
grant all privileges on "sim"."client_limit", "sim"."payment_approval" to "service_role";

notify pgrst, 'reload schema';
