-- EPS authentication, card controls and positive-pay exceptions (EPS-05, EPS-07).
--
-- SCOPE NOTE. Of the ten in-scope eps controls, four (EPS-04 IT committee,
-- EPS-08 vendor due diligence, EPS-09 training, EPS-11 BCP testing) are
-- organisational by the in/out rule in control-scope.json — they govern staff
-- and vendors, not transactions or members. They are NOT rescoped here; the
-- observation is recorded so the eps denominator is read correctly.
--
-- EPS-05 and EPS-07 share one shape: a DECISION taken against a member or a
-- transaction, which may raise an EXCEPTION that someone must then resolve.
-- One table for the decision, one for the exception, rather than separate
-- auth/fraud stacks that would express the same lifecycle twice.

create table if not exists "core"."eps_auth_event" (
  "id" text primary key,
  "subject_ref" text not null,
  "channel" text not null,
  "decision" text not null check ("decision" in ('allowed', 'challenged', 'denied', 'locked_out')),

  -- EPS-05: the failure count is what drives lockout, so it is stored rather
  -- than recomputed from a log that may have been trimmed.
  "failure_count" int not null default 0,
  "challenge_method" text,
  "locked_out_at" timestamptz,

  "provenance" text not null default 'unknown',
  "created_at" timestamptz not null default now()
);

-- A lockout decision must carry the timestamp that proves it happened, and a
-- non-lockout must not. An auth record claiming 'locked_out' with no lockout
-- time is the state an examiner reads as a control that fired on paper only.
alter table "core"."eps_auth_event" drop constraint if exists "ck_eps_auth_lockout_stamped";
alter table "core"."eps_auth_event"
  add constraint "ck_eps_auth_lockout_stamped"
  check (("decision" = 'locked_out') = ("locked_out_at" is not null));

-- A challenge decision must say HOW the member was challenged. "We challenged
-- them" with no method is not evidence of an authentication control.
alter table "core"."eps_auth_event" drop constraint if exists "ck_eps_auth_challenge_method";
alter table "core"."eps_auth_event"
  add constraint "ck_eps_auth_challenge_method"
  check ("decision" <> 'challenged' or "challenge_method" is not null);

create table if not exists "core"."eps_card_control" (
  "id" text primary key,
  "card_ref" text not null,
  "control_type" text not null,
  "applied_by" text not null,
  "applied_at" timestamptz not null default now(),
  "previous_value" text,
  "new_value" text not null,
  "provenance" text not null default 'unknown',
  "created_at" timestamptz not null default now()
);

-- EPS-07: positive-pay exceptions are PRESENTED, then DECIDED, and the pay/
-- return decision has a cutoff. An exception nobody decides by the cutoff pays
-- by default, so the undecided state must be visible rather than inferred.
create table if not exists "core"."eps_pospay_exception" (
  "id" text primary key,
  "account_ref" text not null,
  "item_ref" text not null,
  "amount_cents" bigint not null,
  "reason" text not null,

  "presented_at" timestamptz not null default now(),
  "decision_cutoff_at" timestamptz not null,
  "decision" text check ("decision" is null or "decision" in ('pay', 'return')),
  "decided_at" timestamptz,
  "decided_by" text,

  "provenance" text not null default 'unknown',
  "created_at" timestamptz not null default now()
);

-- A decision requires a decider and a time. The three move together or not at
-- all; any partial combination is an exception whose disposition cannot be
-- attributed to anyone.
alter table "core"."eps_pospay_exception" drop constraint if exists "ck_eps_pospay_decision_complete";
alter table "core"."eps_pospay_exception"
  add constraint "ck_eps_pospay_decision_complete"
  check (
    ("decision" is null and "decided_at" is null and "decided_by" is null)
    or ("decision" is not null and "decided_at" is not null and "decided_by" is not null)
  );

create index if not exists "idx_eps_pospay_undecided"
  on "core"."eps_pospay_exception" ("decision_cutoff_at") where "decision" is null;
create index if not exists "idx_eps_auth_subject" on "core"."eps_auth_event" ("subject_ref");

create table if not exists "sim"."eps_auth_event" (like "core"."eps_auth_event" including defaults);
create table if not exists "sim"."eps_card_control" (like "core"."eps_card_control" including defaults);
create table if not exists "sim"."eps_pospay_exception" (like "core"."eps_pospay_exception" including defaults);
grant all privileges on "core"."eps_auth_event", "core"."eps_card_control",
  "core"."eps_pospay_exception" to "service_role";
grant all privileges on "sim"."eps_auth_event", "sim"."eps_card_control",
  "sim"."eps_pospay_exception" to "service_role";

notify pgrst, 'reload schema';
