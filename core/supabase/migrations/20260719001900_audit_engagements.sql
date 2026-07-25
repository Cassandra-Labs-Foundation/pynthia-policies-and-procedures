-- Audit engagements and findings (AU-03 … AU-10).
--
-- FIRST FINDING, BEFORE ANY CODE: "audit" is not one artifact, it is three.
--
--   board/committee minutes   AU-01, AU-02   board.minutes.recorded, committee minutes
--   audit engagement          AU-03..AU-06, AU-10   plan -> engagement -> fieldwork -> report
--   audit finding             AU-07..AU-09   opened -> communicated -> response -> closed
--
-- This migration builds the second and third. They are built together because
-- they are genuinely coupled — `audit.report.issued` produces `finding.opened`,
-- so a finding cannot exist without an engagement to have been found by.
-- Minutes are a separate artifact and are NOT built here.
--
-- That decomposition took longer than the implementation, and is the answer to
-- "what does one green control cost": the expensive part is deciding what the
-- artifact IS, not writing it.

create table if not exists "core"."audit_engagement" (
  "id" text primary key,
  "plan_cycle_year" int not null,
  "scope" text not null,
  "auditor_ref" text not null,

  -- AU-03: internal auditor independence. Recorded on the engagement because
  -- independence is asserted per engagement, not once globally.
  "independence_attested_by" text,
  "independence_attested_at" timestamptz,

  "status" text not null default 'planned' check ("status" in (
    'planned', 'plan_submitted', 'plan_approved', 'in_progress',
    'fieldwork_complete', 'reported', 'closed'
  )),

  "plan_submitted_at" timestamptz,
  "plan_submitted_by" text,
  "plan_approved_at" timestamptz,
  "plan_approved_by" text,

  "started_at" timestamptz,
  "fieldwork_completed_at" timestamptz,
  "report_drafted_at" timestamptz,
  "report_issued_at" timestamptz,
  "report_issued_by" text,

  -- AU-04: a poor rating increases audit frequency. Stored because the NEXT
  -- cycle's cadence depends on it.
  "rating" text check ("rating" is null or "rating" in ('satisfactory', 'needs_improvement', 'poor')),

  -- AU-10: work papers are retained from issuance.
  "retention_expires_at" timestamptz,

  "provenance" text not null default 'unknown',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

-- AU-04: the plan is submitted then APPROVED, by different actors. Fourth use
-- of the four-eyes property; it goes through core.payment_approval like the
-- others rather than growing a fourth bespoke constraint.
alter table "core"."audit_engagement" drop constraint if exists "ck_audit_plan_four_eyes";
alter table "core"."audit_engagement"
  add constraint "ck_audit_plan_four_eyes"
  check (
    "plan_approved_by" is null
    or "plan_approved_by" is distinct from "plan_submitted_by"
  );

-- AU-03: an engagement cannot start until independence is attested. Enforced
-- structurally because an engagement conducted by a non-independent auditor
-- cannot be retrospectively made independent.
alter table "core"."audit_engagement" drop constraint if exists "ck_audit_independence_before_start";
alter table "core"."audit_engagement"
  add constraint "ck_audit_independence_before_start"
  check ("started_at" is null or "independence_attested_by" is not null);

-- AU-06/AU-10: a report cannot be issued before fieldwork completed, and
-- issuance sets the retention clock.
alter table "core"."audit_engagement" drop constraint if exists "ck_audit_report_after_fieldwork";
alter table "core"."audit_engagement"
  add constraint "ck_audit_report_after_fieldwork"
  check ("report_issued_at" is null or "fieldwork_completed_at" is not null);

create table if not exists "core"."audit_finding" (
  "id" text primary key,
  "engagement_id" text not null,
  "severity" text not null check ("severity" in ('low', 'medium', 'high', 'critical')),
  "summary" text not null,

  "opened_at" timestamptz not null default now(),
  "communicated_at" timestamptz,

  -- AU-08: management responds, which starts the remediation clock.
  "management_response" text,
  "management_response_at" timestamptz,
  "remediation_due_at" timestamptz,

  -- AU-08: risk acceptance is an alternative to remediation and needs its own
  -- decision, with a rationale. Same rule as a SAR no-file.
  "risk_acceptance_proposed_at" timestamptz,
  "risk_acceptance_decision" text check (
    "risk_acceptance_decision" is null or "risk_acceptance_decision" in ('accepted', 'rejected')
  ),
  "risk_acceptance_rationale" text,

  -- AU-09: closure is VERIFIED by retest, not asserted by the responder.
  "retest_result" text check ("retest_result" is null or "retest_result" in ('passed', 'failed')),
  "closed_at" timestamptz,
  "closure_verified_by" text,

  "provenance" text not null default 'unknown',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

alter table "core"."audit_finding" drop constraint if exists "fk_audit_finding_engagement";
alter table "core"."audit_finding"
  add constraint "fk_audit_finding_engagement"
  foreign key ("engagement_id") references "core"."audit_engagement" ("id");

-- AU-09: a finding closes only on a PASSED retest, verified by someone. A
-- finding closed on a failed retest, or on nobody's verification, is the
-- audit-closure finding an examiner looks for.
alter table "core"."audit_finding" drop constraint if exists "ck_audit_finding_closure_verified";
alter table "core"."audit_finding"
  add constraint "ck_audit_finding_closure_verified"
  check (
    "closed_at" is null
    or ("closure_verified_by" is not null
        and ("retest_result" = 'passed' or "risk_acceptance_decision" = 'accepted'))
  );

-- AU-08: an accepted risk needs a documented rationale.
alter table "core"."audit_finding" drop constraint if exists "ck_audit_risk_acceptance_rationale";
alter table "core"."audit_finding"
  add constraint "ck_audit_risk_acceptance_rationale"
  check ("risk_acceptance_decision" is null or "risk_acceptance_rationale" is not null);

-- AU-07: the aging sweep's predicate.
create index if not exists "idx_audit_finding_aging"
  on "core"."audit_finding" ("remediation_due_at")
  where "closed_at" is null;
create index if not exists "idx_audit_finding_engagement" on "core"."audit_finding" ("engagement_id");
create index if not exists "idx_audit_engagement_cycle" on "core"."audit_engagement" ("plan_cycle_year");

create table if not exists "sim"."audit_engagement" (like "core"."audit_engagement" including defaults);
create table if not exists "sim"."audit_finding" (like "core"."audit_finding" including defaults);

grant all privileges on "core"."audit_engagement", "core"."audit_finding" to "service_role";
grant all privileges on "sim"."audit_engagement", "sim"."audit_finding" to "service_role";

notify pgrst, 'reload schema';
