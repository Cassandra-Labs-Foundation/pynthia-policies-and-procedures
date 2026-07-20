-- Collections (CO-01..CO-11) — delinquency, workouts, charge-off, overdraft.
--
-- THE STRUCTURAL DECISION: DELINQUENCY IS DERIVED, NOT SET.
--
-- The natural model is a `delinquency_status` column somebody updates. That
-- fails the way every stored-verdict fails here: the status and the facts drift,
-- and the status is what the controls read. Days past due is a FUNCTION of the
-- due date and the payment history, so it is computed on every evaluation and
-- the STAGE is derived from it. What is stored is the evaluation — the answer
-- and the inputs that produced it — so a classification can be recomputed and
-- disputed.
--
-- 12 CFR 1026 and the NCUA charge-off guidance both key off days past due, and
-- the bands are REGULATORY rather than institutional: 90 days for retail
-- classification, 120/180 for charge-off depending on product. Those are
-- lookups, like the PCA bands. The institution's own earlier intervention
-- points (day 10, day 30) ARE its choice and are configured.

alter table "core"."loan"
  add column if not exists "member_ref" text,
  add column if not exists "product" text,
  add column if not exists "principal_cents" bigint,
  add column if not exists "next_due_date" date,
  add column if not exists "last_payment_at" timestamptz,
  add column if not exists "days_past_due" int,
  add column if not exists "delinquency_stage" text,
  add column if not exists "classification" text,
  add column if not exists "nonaccrual_at" timestamptz,
  add column if not exists "charged_off_at" timestamptz,
  add column if not exists "attorney_represented" boolean not null default false,
  add column if not exists "cease_communication_at" timestamptz,
  add column if not exists "bankruptcy_flag" boolean not null default false,
  add column if not exists "scra_flag" boolean not null default false,
  -- what each control actually reads off the loan. The grace period and the
  -- product type change WHEN a loan is delinquent; the collateral figures
  -- change what classification it carries; the accrual and collectibility
  -- assessments are what nonaccrual and foreclosure turn on.
  add column if not exists "grace_period_days" int,
  add column if not exists "last_payment_date" date,
  add column if not exists "product_type" text,
  add column if not exists "collateral_value" bigint,
  add column if not exists "ltv" int,
  add column if not exists "well_secured_documented" boolean,
  add column if not exists "proposed_modification" jsonb,
  add column if not exists "io_term_months" int,
  add column if not exists "accrued_interest" bigint,
  add column if not exists "collectibility_assessment" text,
  add column if not exists "foreclosure_impact_eval" text,
  add column if not exists "repayment_evidence" text,
  add column if not exists "entity_contact" jsonb,
  -- CO-02: the notice has to say HOW MUCH is past due and what alternatives
  -- exist; a right-to-cure notice with neither is not a cure notice.
  add column if not exists "past_due_amount" bigint,
  add column if not exists "workout_alternatives" jsonb,
  -- CO-03: bankruptcy and death are separate charge-off paths from
  -- delinquency, each with its own evidence and its own recovery estimate.
  add column if not exists "bankruptcy_case_id" text,
  add column if not exists "estate_claim_status" text,
  add column if not exists "estimated_recovery" bigint;

alter table "core"."account"
  add column if not exists "death_flag" boolean not null default false;

-- Each evaluation, with the inputs that produced it. See the header: the
-- verdict is derived and stored ALONGSIDE its inputs so it can be recomputed.
create table if not exists "core"."delinquency_evaluation" (
  "id" text primary key,
  "loan_id" text not null,
  "as_of" timestamptz not null,
  "next_due_date" date not null,
  "days_past_due" int not null,
  "stage" text not null check ("stage" in
    ('current', 'early', 'late', 'seriously_delinquent', 'charge_off_eligible')),
  "classification" text check ("classification" in
    ('pass', 'special_mention', 'substandard', 'doubtful', 'loss')),
  "nonaccrual" boolean not null default false,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

-- CO-04. A workout CHANGES THE CONTRACT, so it needs approval by someone other
-- than whoever negotiated it, and a TDR determination — a concession to a
-- borrower in financial difficulty is a troubled debt restructuring whether or
-- not anyone calls it one.
create table if not exists "core"."loan_modification" (
  "id" text primary key,
  "loan_id" text not null,
  "kind" text not null check ("kind" in
    ('forbearance', 'extension', 'rate_reduction', 'term_extension', 'reage', 'settlement')),
  "borrower_hardship" boolean not null,
  "concession_granted" boolean not null,
  "tdr" boolean not null,
  "requested_by" text not null,
  "approved_by" text,
  "decision" text not null check ("decision" in ('pending', 'approved', 'denied')),
  "decided_at" timestamptz,
  "effective_at" timestamptz,
  "reage_count_12m" int not null default 0,
  "proposed_modification" jsonb,
  "io_term_months" int,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- FFIEC: a re-age requires the borrower to have demonstrated capacity, and
  -- there are limits on how often. Unlimited re-aging turns a delinquent loan
  -- into a current one on paper.
  constraint "ck_modification_reage_limit"
    check ("kind" <> 'reage' or "reage_count_12m" <= 1),
  constraint "ck_modification_four_eyes"
    check ("approved_by" is null or "approved_by" <> "requested_by"),
  -- a TDR is hardship AND concession; recording one without the other is the
  -- misclassification the determination exists to prevent
  constraint "ck_modification_tdr_derived"
    check ("tdr" = ("borrower_hardship" and "concession_granted"))
);

-- CO-05. FDCPA-style protections. These are STANDING STATES on the loan, and
-- the communication gate reads them — see the standing-state rule in BLUEPRINT.
create table if not exists "core"."collection_contact" (
  "id" text primary key,
  "loan_id" text not null,
  "member_ref" text not null,
  "channel" text not null check ("channel" in ('phone', 'email', 'sms', 'letter', 'in_person')),
  "attempted_at" timestamptz not null,
  "local_hour" int not null check ("local_hour" between 0 and 23),
  "decision" text not null check ("decision" in ('permitted', 'blocked')),
  "blocked_reason" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  constraint "ck_contact_reason_matches"
    check (("decision" = 'blocked') = ("blocked_reason" is not null))
);

-- CO-10. An overdraft that goes to collections, and the fee waivers that
-- accompany it.
create table if not exists "core"."overdraft_referral" (
  "id" text primary key,
  "account_ref" text not null,
  "balance_cents" bigint not null,
  "days_negative" int not null,
  "referred_at" timestamptz not null,
  "fees_assessed_cents" bigint not null default 0,
  "fees_waived_cents" bigint not null default 0,
  "waiver_approved_by" text,
  "charged_off_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- a waiver is a giveaway of income and needs an owner
  constraint "ck_overdraft_waiver_owned"
    check ("fees_waived_cents" = 0 or "waiver_approved_by" is not null)
);

create index if not exists "ix_delinq_loan" on "core"."delinquency_evaluation" ("loan_id", "as_of" desc);
create index if not exists "ix_contact_loan" on "core"."collection_contact" ("loan_id", "attempted_at" desc);

create schema if not exists "sim";
create table if not exists "sim"."delinquency_evaluation" (like "core"."delinquency_evaluation" including all);
create table if not exists "sim"."loan_modification" (like "core"."loan_modification" including all);
create table if not exists "sim"."collection_contact" (like "core"."collection_contact" including all);
create table if not exists "sim"."overdraft_referral" (like "core"."overdraft_referral" including all);

-- CO-11: a collections-data incident runs through the SAME incident machinery.
-- These are the fields the reportability determination needs and a severity
-- alone cannot supply.
alter table "core"."incident"
  add column if not exists "description" text,
  add column if not exists "detection_source" text,
  add column if not exists "data_scope" jsonb,
  add column if not exists "scope_initial" jsonb,
  add column if not exists "collections" boolean not null default false,
  add column if not exists "reportability_assessment" text;
