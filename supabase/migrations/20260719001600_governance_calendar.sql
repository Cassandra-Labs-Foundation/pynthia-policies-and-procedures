-- The governance calendar (Tier D).
--
-- 83 distinct time-based triggers across the catalogue —
-- training.annual_cycle.opened, governance.board_cycle.opened,
-- compliance.board.report.due_at, vendor.annual.review.due_at, and so on. They
-- are all the same shape: a recurring obligation with a cadence, a due date, and
-- a completion record. So this is ONE register rather than 83 implementations,
-- for the same reason core.payment_approval replaced a second hand-written
-- four-eyes constraint.
--
-- WHY THIS TIER IS HONEST WITHOUT ANY FABRICATION
--
-- A board review genuinely IS due annually. Firing
-- `governance.board_cycle.opened` when the year turns is not a simulation of
-- anything — it is the obligation actually arriving. That is what separates
-- Tier D from Tier C, where the trigger has to be invented.
--
-- THE POLICY VALUES THAT ARE MISSING
--
-- A cadence needs an ANCHOR: when does the fiscal year start, when was the last
-- board review, what date does the training cycle open. Those are facts only
-- the institution holds. An obligation with no anchor is UNSCHEDULED — it never
-- becomes due, and the sweep reports it as unscheduled rather than as "not due",
-- which are very different statements. Same shape as unattributable cash and
-- unassessed dual control. See OQ-15.

create table if not exists "core"."obligation" (
  "id" text primary key,

  -- Which catalogue control this discharges, as the uid the extractor now emits
  -- (policy:control_id) rather than the bare id, because control_id is not
  -- unique — CP-01 names two different controls (OQ-11).
  "control_uid" text not null,

  -- The event to fire when it comes due. This is the catalogue's own declared
  -- trigger, so firing it means the control actually starts rather than merely
  -- resembling a start.
  "trigger_code" text not null,

  "title" text not null,
  "owner_role" text,

  "cadence" text not null check ("cadence" in (
    'annual', 'semiannual', 'quarterly', 'monthly', 'weekly', 'daily', 'ad_hoc'
  )),

  -- NULL = nobody has told us when the cycle starts. Deliberately distinct
  -- from a past date: a null anchor means UNSCHEDULED, and an obligation that
  -- is unscheduled has not been determined not-due, it has not been determined
  -- at all.
  "anchor_date" date,
  "next_due_at" timestamptz,

  "last_completed_at" timestamptz,
  "last_completed_by" text,
  "last_completion_note" text,

  "provenance" text not null default 'unknown'
    check ("provenance" in ('production', 'demo', 'unknown')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),

  constraint "uq_obligation_control_trigger" unique ("control_uid", "trigger_code")
);

comment on column "core"."obligation"."anchor_date" is
  'NULL = UNSCHEDULED. The cadence is known but nobody has supplied when the cycle starts, so no due date can be computed. Reported separately from "not due" by the sweep — see OQ-15.';

comment on column "core"."obligation"."next_due_at" is
  'Computed from anchor_date + cadence. NULL exactly when anchor_date is NULL. A completed obligation advances from its DUE date, not from the completion date, so chronic lateness cannot stretch the cadence.';

-- next_due_at exists if and only if an anchor does. Without this the two could
-- drift into a state where something is due with no basis for the date, or has
-- an anchor but silently never comes due.
alter table "core"."obligation" drop constraint if exists "ck_obligation_due_iff_anchored";
alter table "core"."obligation"
  add constraint "ck_obligation_due_iff_anchored"
  check (("anchor_date" is null) = ("next_due_at" is null));

-- A completion must say who did it, for the same reason a SAR decision does.
alter table "core"."obligation" drop constraint if exists "ck_obligation_completion_attributed";
alter table "core"."obligation"
  add constraint "ck_obligation_completion_attributed"
  check ("last_completed_at" is null or "last_completed_by" is not null);

-- ---------------------------------------------------------- completion log
--
-- The obligation row carries only the LATEST completion. An examiner asking
-- "was the 2024 board review done" needs the history, so every completion is
-- also appended here.
create table if not exists "core"."obligation_completion" (
  "id" text primary key,
  "obligation_id" text not null,
  "due_at" timestamptz not null,
  "completed_at" timestamptz not null,
  "completed_by" text not null,
  "note" text,
  -- computed at completion and stored, because "was this late" must survive
  -- even if the schedule is later changed
  "was_late" boolean not null,
  "provenance" text not null default 'unknown'
    check ("provenance" in ('production', 'demo', 'unknown')),
  "created_at" timestamptz not null default now()
);

alter table "core"."obligation_completion" drop constraint if exists "fk_obligation_completion_obligation";
alter table "core"."obligation_completion"
  add constraint "fk_obligation_completion_obligation"
  foreign key ("obligation_id") references "core"."obligation" ("id");

create index if not exists "idx_obligation_completion_obligation"
  on "core"."obligation_completion" ("obligation_id", "due_at" desc);

-- The sweep's two predicates: due-and-unfired, and unscheduled.
create index if not exists "idx_obligation_due"
  on "core"."obligation" ("next_due_at")
  where "next_due_at" is not null;
create index if not exists "idx_obligation_unscheduled"
  on "core"."obligation" ("control_uid")
  where "anchor_date" is null;

-- sim mirrors: a five-year training cycle cannot be waited out either.
create table if not exists "sim"."obligation" (like "core"."obligation" including defaults including indexes);
create table if not exists "sim"."obligation_completion" (like "core"."obligation_completion" including defaults including indexes);
do $$
declare t text;
begin
  foreach t in array array['obligation', 'obligation_completion'] loop
    execute format('alter table "sim".%I alter column "provenance" set default ''simulated''', t);
    execute format('alter table "sim".%I drop constraint if exists %I', t, 'ck_' || t || '_provenance');
    execute format(
      'alter table "sim".%I add constraint %I check ("provenance" = ''simulated'')',
      t, 'ck_sim_' || t || '_provenance');
  end loop;
end $$;

grant all privileges on "core"."obligation", "core"."obligation_completion" to "service_role";
grant all privileges on "sim"."obligation", "sim"."obligation_completion" to "service_role";

notify pgrst, 'reload schema';
