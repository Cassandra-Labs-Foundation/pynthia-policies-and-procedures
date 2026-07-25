-- Lending underwriting, pricing and fair-lending (LP-02..LP-14).
--
-- WHY THIS IS THE BIGGEST SURFACE PER CONTROL SO FAR, AND WHY THAT WAS
-- PREDICTED. Thirteen red controls declaring TWENTY-FIVE namespaces, of which
-- twenty-two had no table at all. Unlike record-retention — where eleven
-- namespaces were all facets of ONE lifecycle and five registers covered them —
-- these are five genuinely separate sub-domains: credit decisioning, appraisal
-- and collateral, pricing and HPML, exceptions, and fair-lending analytics.
-- Same crude concentration ratio (1.00), roughly double the surface.
--
-- THE ABANDONED-TABLE LEVER: I MEASURED THIS WRONG BEFORE BUILDING, and the
-- correction is worth more than the original claim. The pre-build analysis
-- concluded `core.loan` was irrelevant to lending — it scanned only the
-- namespaces of MISSING PRODUCED EVENTS. `loan` appears in lending through
-- REQUIRED_INPUTS instead (`loan.ltv` on LP-03 and LP-06, `loan.booking.requested`
-- as LP-09's trigger), which that scan never looked at. Three controls, not
-- zero.
--
-- The lesson generalises to the estimator: a control is blocked by everything
-- it DECLARES — triggers, produced events AND required inputs — and measuring
-- any one of the three understates the dependency set. The abandoned-table
-- count of 36 was computed over required_inputs and is unaffected; the
-- per-domain namespace analysis was not, and has been corrected.
--
-- ONE PIECE OF EXISTING MACHINERY IS DELIBERATELY REUSED RATHER THAN COPIED:
-- the adverse-action notice. `core.adverse_action_notice` already exists with
-- its ECOA clock and its review-before-issue constraint. LP-04, LP-07 and
-- LP-12 all end in an AAN and none of them get their own.

-- ------------------------------------------------------- LP-02 eligibility
--
-- The product catalogue and its prohibited-practice screens. Versioned because
-- LP-02's control is that a change to eligibility criteria is a governed event,
-- not a config edit.
create table if not exists "core"."credit_config" (
  "id" text primary key,
  "product_code" text not null,
  "version" int not null check ("version" >= 1),
  "min_credit_score" int,
  "max_dti_bp" int,
  "max_ltv_bp" int,
  -- practices that are prohibited outright rather than priced for
  "prohibited_practices" jsonb not null default '[]'::jsonb,
  "effective_at" timestamptz not null,
  "superseded_at" timestamptz,
  "approved_by" text not null,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

-- ------------------------------------ LP-03 / LP-09 credit application record
--
-- The CAR is the assembled application file. SEALING it is the control: after
-- the decision the file must not change, because a file that can be edited
-- after an adverse action cannot evidence the reason the action was taken.
create table if not exists "core"."credit_application_record" (
  "id" text primary key,
  "loan_application_id" text not null,
  "documents" jsonb not null default '[]'::jsonb,
  "alternative_data_used" boolean not null default false,
  "sealed_at" timestamptz,
  "sealed_by" text,
  "validated_at" timestamptz,
  "retention_started_at" timestamptz,
  "retention_expires_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  constraint "ck_car_sealed_has_sealer"
    check ("sealed_at" is null or "sealed_by" is not null),
  -- ECOA/Reg B: the credit file retention clock starts at the DECISION, and a
  -- started clock must have an end. A start with no expiry is a clock nobody
  -- can act on.
  constraint "ck_car_retention_paired"
    check (("retention_started_at" is null) = ("retention_expires_at" is null))
);

-- --------------------------------------------------------- LP-04 credit data
create table if not exists "core"."credit_report" (
  "id" text primary key,
  "loan_application_id" text not null,
  "bureau" text not null,
  "pulled_at" timestamptz not null,
  "score" int,
  "score_model" text,
  -- LP-04: a report older than the freshness window cannot support a decision.
  -- Stored rather than computed at read time so the decision is reproducible.
  "fresh_at_decision" boolean,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

-- ---------------------------------------------- LP-05 / LP-08 exception cases
--
-- An underwriting exception is a DECISION TO LEND OUTSIDE POLICY. It blocks
-- closing until decided, which is the only thing that makes it an exception
-- rather than a note.
create table if not exists "core"."loan_exception" (
  "id" text primary key,
  "loan_application_id" text not null,
  "kind" text not null,
  "detail" jsonb not null,
  "mitigating_factors" text,
  "closing_block_state" text not null default 'blocked'
    check ("closing_block_state" in ('blocked', 'released')),
  "submitted_at" timestamptz,
  "submitted_by" text,
  "decision" text check ("decision" in ('approved', 'denied')),
  "decided_at" timestamptz,
  "decided_by" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  -- LP-08 four-eyes: the underwriter who submits an exception cannot approve
  -- their own. Fourth place this rule appears; same shape as EPS-06 and CDA-11.
  constraint "ck_loan_exception_four_eyes"
    check ("decision" is null or ("decided_by" is not null and "decided_by" <> "submitted_by")),
  -- closing can only be released by a DECISION
  constraint "ck_loan_exception_release_requires_decision"
    check ("closing_block_state" = 'blocked' or "decision" is not null)
);

-- ------------------------------------------------ LP-06 appraisal/collateral
create table if not exists "core"."appraisal_order" (
  "id" text primary key,
  "loan_application_id" text not null,
  "appraiser_ref" text not null,
  "ordered_at" timestamptz not null,
  -- ECOA Valuations Rule: a copy must be delivered PROMPTLY and no later than
  -- three business days before consummation.
  "delivery_due_at" timestamptz not null,
  "completed_at" timestamptz,
  "value_cents" bigint,
  "copy_delivered_at" timestamptz,
  "rov_requested_at" timestamptz,
  "rov_decision" text check ("rov_decision" in ('upheld', 'revised')),
  "rov_decided_by" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  -- a completed valuation must carry a value; "completed" with no number is a
  -- status change
  constraint "ck_appraisal_completed_has_value"
    check ("completed_at" is null or "value_cents" is not null),
  -- LP-06: the person deciding a reconsideration of value must not be the
  -- appraiser whose value is being reconsidered
  constraint "ck_appraisal_rov_independent"
    check ("rov_decision" is null or ("rov_decided_by" is not null
           and "rov_decided_by" <> "appraiser_ref"))
);

-- ------------------------------------------------------------- LP-10 pricing
--
-- HPML (12 CFR 1026.35) compares the APR against the APOR for a comparable
-- transaction. The APOR is PUBLISHED BY THE FFIEC — it is a lookup, not an
-- institutional choice, and so it is stored per rate sheet rather than
-- configured.
create table if not exists "core"."rate_sheet" (
  "id" text primary key,
  "product_code" text not null,
  "effective_at" timestamptz not null,
  "base_rate_bp" int not null,
  "apor_bp" int not null,
  "published_at" timestamptz,
  "published_by" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- an unpublished rate sheet must not price anything
  constraint "ck_rate_sheet_published_has_publisher"
    check ("published_at" is null or "published_by" is not null)
);

create table if not exists "core"."loan_pricing" (
  "id" text primary key,
  "loan_application_id" text not null,
  "rate_sheet_id" text references "core"."rate_sheet" ("id"),
  "quoted_apr_bp" int not null,
  "apor_bp" int not null,
  "spread_bp" int not null,
  "hpml" boolean not null,
  "exception_requested_by" text,
  "exception_rationale" text,
  "exception_decision" text check ("exception_decision" in ('approved', 'denied')),
  "exception_decided_by" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- the spread must equal its own components or the HPML verdict is unauditable
  constraint "ck_loan_pricing_spread_matches"
    check ("spread_bp" = "quoted_apr_bp" - "apor_bp"),
  -- LP-10: a pricing exception is four-eyes like every other override here
  constraint "ck_loan_pricing_exception_four_eyes"
    check ("exception_decision" is null or ("exception_decided_by" is not null
           and "exception_decided_by" <> "exception_requested_by"))
);

-- ------------------------------------------------ LP-12 prequal and steering
create table if not exists "core"."prequalification" (
  "id" text primary key,
  "subject_ref" text not null,
  "requested_at" timestamptz not null,
  "decision" text not null check ("decision" in ('prequalified', 'declined', 'referred')),
  "products_offered" jsonb not null default '[]'::jsonb,
  "products_eligible" jsonb not null default '[]'::jsonb,
  "steering_flag" boolean not null default false,
  "discouragement_flag" boolean not null default false,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

-- ------------------------------------------ LP-13 fair lending and HMDA
create table if not exists "core"."fair_lending_analysis" (
  "id" text primary key,
  "period" text not null,
  "kind" text not null check ("kind" in ('disparity', 'redlining', 'steering')),
  "cohorts" jsonb not null,
  "disparity_bp" int,
  "threshold_bp" int,
  "breached" boolean,
  "completed_at" timestamptz,
  "remediation_opened_at" timestamptz,
  "remediation_closed_at" timestamptz,
  "remediation_evidence" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  -- an unset threshold cannot produce a breach verdict either way. Same rule
  -- as the capital internal trigger and the cash enterprise limit.
  constraint "ck_fair_lending_verdict_needs_threshold"
    check (("threshold_bp" is null) = ("breached" is null)),
  constraint "ck_fair_lending_closure_evidenced"
    check ("remediation_closed_at" is null or "remediation_evidence" is not null)
);

create table if not exists "core"."hmda_lar" (
  "id" text primary key,
  "reporting_year" int not null,
  "record_count" int not null,
  "qc_completed_at" timestamptz,
  "qc_error_count" int,
  "submitted_at" timestamptz,
  "submitted_by" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- HMDA: the LAR is QC'd BEFORE submission. Submitting first and checking
  -- afterwards is the failure the control exists to prevent, and it is the
  -- ordering that looks harmless in code.
  constraint "ck_hmda_qc_before_submission"
    check ("submitted_at" is null or ("qc_completed_at" is not null
           and "qc_completed_at" <= "submitted_at"))
);

-- ------------------------------------------------------------- LP-14 insider
--
-- Regulation O. A REGISTER OF COVERED PERSONS by role — director, executive
-- officer, principal shareholder and their related interests. Like
-- `records_contact` this stores a reference and a role, not an employment
-- record: the control is "is this borrower a covered person", which is a
-- membership question.
create table if not exists "core"."insider" (
  "id" text primary key,
  "subject_ref" text not null,
  "role" text not null check ("role" in
    ('director', 'executive_officer', 'principal_shareholder', 'related_interest')),
  "effective_from" timestamptz not null,
  "effective_to" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

-- Convergence with the codegen-era core schema (20260702000100): that
-- migration already created "core"."insider" with a different shape, so the
-- create-table above is a no-op on every database. Bring the existing
-- table up to this declaration column-by-column (append-only; the old
-- columns stay).
alter table "core"."insider" add column if not exists "id" text;
-- the codegen-era table minted uuid ids; this workstream's writers use text ids
alter table "core"."insider" alter column "id" type text;
alter table "core"."insider" add column if not exists "subject_ref" text not null;
alter table "core"."insider" add column if not exists "role" text not null check ("role" in ('director', 'executive_officer', 'principal_shareholder', 'related_interest'));
alter table "core"."insider" add column if not exists "effective_from" timestamptz not null;
alter table "core"."insider" add column if not exists "effective_to" timestamptz;
alter table "core"."insider" add column if not exists "provenance" text not null default 'production';
alter table "core"."insider" add column if not exists "created_at" timestamptz not null default now();






create table if not exists "core"."insider_loan_review" (
  "id" text primary key,
  "loan_application_id" text not null,
  "insider_id" text not null references "core"."insider" ("id"),
  -- Reg O limits attach to AGGREGATE credit to the insider, not to this loan
  -- alone; a per-loan check passes every time an insider borrows in slices.
  "aggregate_credit_amount" bigint,
  "proposed_terms" jsonb,
  "terms_parity_checked" boolean not null default false,
  "terms_comparable" boolean,
  "board_approval_required" boolean not null,
  "board_resolution_id" text,
  "board_approved_at" timestamptz,
  "reported_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  -- Reg O: preferential terms are prohibited outright, so a loan whose terms
  -- are NOT comparable cannot carry a board approval — it must not be made.
  constraint "ck_insider_no_approval_on_preferential"
    check ("board_approved_at" is null or "terms_comparable" = true)
);

create index if not exists "ix_credit_config_effective"
  on "core"."credit_config" ("product_code", "effective_at" desc);
create index if not exists "ix_rate_sheet_effective"
  on "core"."rate_sheet" ("product_code", "effective_at" desc);
create index if not exists "ix_loan_exception_app"
  on "core"."loan_exception" ("loan_application_id");
create index if not exists "ix_insider_subject" on "core"."insider" ("subject_ref");

create schema if not exists "sim";
create table if not exists "sim"."credit_config" (like "core"."credit_config" including all);
create table if not exists "sim"."credit_application_record" (like "core"."credit_application_record" including all);
create table if not exists "sim"."credit_report" (like "core"."credit_report" including all);
create table if not exists "sim"."loan_exception" (like "core"."loan_exception" including all);
create table if not exists "sim"."appraisal_order" (like "core"."appraisal_order" including all);
create table if not exists "sim"."rate_sheet" (like "core"."rate_sheet" including all);
create table if not exists "sim"."loan_pricing" (like "core"."loan_pricing" including all);
create table if not exists "sim"."prequalification" (like "core"."prequalification" including all);
create table if not exists "sim"."fair_lending_analysis" (like "core"."fair_lending_analysis" including all);
create table if not exists "sim"."hmda_lar" (like "core"."hmda_lar" including all);
create table if not exists "sim"."insider" (like "core"."insider" including all);
create table if not exists "sim"."insider_loan_review" (like "core"."insider_loan_review" including all);

-- The application carries its own content, so downstream controls can ask the
-- application row who applied and on what basis rather than reassembling it.
alter table "core"."loan_application"
  add column if not exists "product_type" text,
  add column if not exists "applicant" jsonb,
  add column if not exists "data" jsonb,
  add column if not exists "income_assets" jsonb,
  add column if not exists "atr_qm_result" text,
  add column if not exists "dti_bp" int,
  add column if not exists "thin_file" boolean,
  add column if not exists "action_basis" jsonb,
  -- government monitoring information: collected and reported under Reg B /
  -- HMDA, and never an input to the decision
  add column if not exists "gmi" jsonb,
  add column if not exists "channel" text,
  add column if not exists "doc_block_state" text,
  add column if not exists "notified_at" timestamptz,
  add column if not exists "incomplete_aged" boolean,
  add column if not exists "counteroffer_status" text,
  add column if not exists "counteroffer_terms" jsonb,
  add column if not exists "oral_adverse_decision" boolean;

alter table "core"."loan_party"
  add column if not exists "identity" jsonb,
  add column if not exists "contact" jsonb,
  add column if not exists "ofac_result" text;

-- LP-03/LP-06/LP-09: `core.loan` is one of the 22 ABANDONED TABLES — modelled
-- in the schema and never written. Booking is what LP-09 needs and `loan.ltv`
-- is what LP-03 and LP-06 read. Adding the columns the controls actually
-- declare rather than assuming the abandoned shape fits.
alter table "core"."loan"
  add column if not exists "loan_application_id" text,
  add column if not exists "ltv" int,
  add column if not exists "booked_at" timestamptz,
  add column if not exists "booked_by" text,
  add column if not exists "provenance" text not null default 'production';
