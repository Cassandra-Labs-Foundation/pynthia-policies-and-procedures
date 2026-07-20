-- Truth in Savings, member lifecycle and fair-lending gaps
-- (TIS-01..TIS-08, MP-01..MP-09, FL-02..FL-12).
--
-- THE DECISION: A DISCLOSURE IS A DELIVERY, NOT A DOCUMENT.
--
-- The natural model is a `disclosure` table holding templates. TIS's controls
-- are almost all about DELIVERY — was the right version given to this member,
-- before the right event, within the right window. So the template is one
-- table and every DELIVERY is a row against a member with its own deadline.
-- A template register alone answers "do we have a disclosure"; it cannot
-- answer "did this member get one", which is the only question that matters
-- when an examiner picks an account.

create table if not exists "core"."disclosure_template" (
  "id" text primary key,
  "kind" text not null check ("kind" in
    ('account_opening', 'change_in_terms', 'maturity', 'periodic_statement',
     'overdraft_service', 'valuation_rights', 'appraisal_copy', 'adverse_action')),
  "version" text not null,
  "content_ref" text not null,
  "effective_at" timestamptz not null,
  "superseded_at" timestamptz,
  "approved_by" text not null,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

create table if not exists "core"."disclosure_delivery" (
  "id" text primary key,
  "template_id" text references "core"."disclosure_template" ("id"),
  "kind" text not null,
  "member_ref" text not null,
  "account_ref" text,
  "trigger_event" text not null,
  "due_at" timestamptz not null,
  "delivered_at" timestamptz,
  "channel" text,
  "error_detected" boolean not null default false,
  "error_detail" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- an error flagged with no detail is a flag nobody can act on
  constraint "ck_delivery_error_detailed"
    check (not "error_detected" or "error_detail" is not null)
);

-- TIS-06. The interest configuration and each accrual run. The APY is DERIVED
-- from the rate and the compounding, never supplied: a stored APY that
-- disagrees with its own inputs is the disclosure error the control exists to
-- catch.
create table if not exists "core"."product_interest_config" (
  "id" text primary key,
  "product_code" text not null,
  "rate_bp" int not null,
  "compounding" text not null check ("compounding" in ('daily', 'monthly', 'quarterly', 'annual')),
  "balance_method" text not null check ("balance_method" in ('daily_balance', 'average_daily_balance')),
  "apy_bp" int not null,
  "effective_at" timestamptz not null,
  "superseded_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

create table if not exists "core"."interest_accrual_run" (
  "id" text primary key,
  "period" text not null,
  "config_id" text references "core"."product_interest_config" ("id"),
  "accounts_processed" int not null default 0,
  "accrued_total_cents" bigint not null default 0,
  "completed_at" timestamptz not null,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

-- TIS-05 / TIS-08. The statement is where the year-to-date fee totals and the
-- balances are disclosed, so it carries them rather than pointing at them.
create table if not exists "core"."statement" (
  "id" text primary key,
  "account_ref" text not null,
  "period" text not null,
  "opening_balance_cents" bigint not null,
  "closing_balance_cents" bigint not null,
  "interest_paid_cents" bigint not null default 0,
  "fees_ytd_cents" bigint not null default 0,
  "overdraft_fees_ytd_cents" bigint not null default 0,
  "issued_at" timestamptz not null,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

-- MP-01..MP-09. The member lifecycle around the entity that already exists.
create table if not exists "core"."membership" (
  "id" text primary key,
  "entity_ref" text not null,
  "eligibility_basis" text,
  "eligibility_determined_at" timestamptz,
  "eligible" boolean,
  "denial_reason" text,
  "joined_at" timestamptz,
  "restriction" text check ("restriction" in ('none', 'deposit_only', 'no_new_services', 'frozen')),
  "restriction_reason" text,
  "restricted_at" timestamptz,
  "closed_at" timestamptz,
  "closure_payout_cents" bigint,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  -- a denial must say why; "not eligible" with no basis cannot be appealed
  constraint "ck_membership_denial_reasoned"
    check ("eligible" is not false or "denial_reason" is not null),
  constraint "ck_membership_restriction_reasoned"
    check ("restriction" is null or "restriction" = 'none' or "restriction_reason" is not null)
);

-- MP-02. An address change is a RED FLAG trigger, so it carries a hold during
-- which the old address is also notified — that is what catches the takeover.
create table if not exists "core"."member_address_change" (
  "id" text primary key,
  "member_ref" text not null,
  "old_address" jsonb,
  "new_address" jsonb not null,
  "changed_at" timestamptz not null,
  "hold_expires_at" timestamptz not null,
  "notice_sent_to_old_at" timestamptz,
  "notice_sent_to_new_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

-- MP-09. Service requests with their response clocks.
create table if not exists "core"."service_request" (
  "id" text primary key,
  "member_ref" text not null,
  "channel" text not null,
  "received_at" timestamptz not null,
  "first_response_due_at" timestamptz not null,
  "first_response_at" timestamptz,
  "resolved_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

-- FL-08. Loan originator compensation, which may not vary with loan terms.
create table if not exists "core"."lo_comp_plan" (
  "id" text primary key,
  "originator_ref" text not null,
  "basis" text not null,
  "varies_with_terms" boolean not null,
  "decision" text not null check ("decision" in ('approved', 'rejected')),
  "decided_by" text not null,
  "decided_at" timestamptz not null,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- 12 CFR 1026.36(d): compensation may not be based on a term of the
  -- transaction. A plan that varies with terms cannot be approved.
  constraint "ck_lo_comp_no_term_based"
    check (not "varies_with_terms" or "decision" = 'rejected')
);

create index if not exists "ix_delivery_due" on "core"."disclosure_delivery" ("delivered_at", "due_at");
create index if not exists "ix_membership_entity" on "core"."membership" ("entity_ref");

create schema if not exists "sim";
create table if not exists "sim"."disclosure_template" (like "core"."disclosure_template" including all);
create table if not exists "sim"."disclosure_delivery" (like "core"."disclosure_delivery" including all);
create table if not exists "sim"."product_interest_config" (like "core"."product_interest_config" including all);
create table if not exists "sim"."interest_accrual_run" (like "core"."interest_accrual_run" including all);
create table if not exists "sim"."statement" (like "core"."statement" including all);
create table if not exists "sim"."membership" (like "core"."membership" including all);
create table if not exists "sim"."member_address_change" (like "core"."member_address_change" including all);
create table if not exists "sim"."service_request" (like "core"."service_request" including all);
create table if not exists "sim"."lo_comp_plan" (like "core"."lo_comp_plan" including all);

-- ============================================================================
-- SECOND PASS: THE FACTS A DISCLOSURE HAS TO CARRY WITH IT.
--
-- The first pass modelled deliveries as pointers — "we sent template X to
-- member Y". That is not re-verifiable: it cannot answer "what APY did the
-- member actually see", and an APY that was wrong at the moment of delivery is
-- exactly the TIS violation. So the delivery row SNAPSHOTS the terms it
-- disclosed rather than referring to a configuration that has since moved.
-- ============================================================================
alter table "core"."disclosure_delivery"
  add column if not exists "entity_esign_consent_id" text,
  add column if not exists "member_delivery_channel" text,
  add column if not exists "member_delivery_failure_reason" text,
  add column if not exists "account_id" text,
  add column if not exists "account_account_type" text,
  add column if not exists "account_opening_channel" text,
  add column if not exists "account_restriction" text,
  add column if not exists "account_maturity_date" date,
  add column if not exists "account_maturity_window" text,
  add column if not exists "account_maturity_disposition" text,
  add column if not exists "product_interest_config_id" text,
  add column if not exists "product_interest_rate_bp" int,
  add column if not exists "product_apy_bp" int,
  add column if not exists "address_id" text;

-- E-SIGN 101(c): electronic delivery of a required disclosure is only valid if
-- consent was captured first. Same rule the privacy notices already carry —
-- stated once more here because the delivery table is a different write path
-- and a constraint that lives in only one of two paths is not a constraint.
alter table "core"."disclosure_delivery"
  drop constraint if exists "ck_ddel_esign_requires_consent";
alter table "core"."disclosure_delivery"
  add constraint "ck_ddel_esign_requires_consent"
    check ("channel" <> 'esign' or "entity_esign_consent_id" is not null);

-- TIS §707.8: advertising is disclosure. A template used in an advertisement
-- carries an approval and a medium, and a template with no product scope
-- cannot be checked against the product it was used for.
alter table "core"."disclosure_template"
  add column if not exists "product_scope" text,
  add column if not exists "advertising_medium" text,
  add column if not exists "advertising_approval_id" text;

-- `core.address` (abandoned table, partly revived by the privacy artifact).
-- A mailed disclosure needs somewhere to go, and "we mailed it" with no
-- deliverable address on file is the failure the delivery record exists to
-- catch.
alter table "core"."address"
  add column if not exists "city" text,
  add column if not exists "region" text,
  add column if not exists "postal_code" text;

-- MP-05: a restriction notice has to say what was restricted, on what balance,
-- and what the member still owes — a notice that says only "restricted" gives
-- the member nothing to act on.
alter table "core"."membership"
  add column if not exists "entity_contact" jsonb,
  add column if not exists "account_ref" text,
  add column if not exists "account_status" text,
  add column if not exists "account_balance_cents" bigint,
  add column if not exists "account_lock_type" text,
  add column if not exists "account_restriction" text,
  add column if not exists "member_amounts_owed_cents" bigint;

-- `core.account` gains the two columns a restriction actually sets. Without
-- them the restriction lives only on the membership row and the account the
-- member transacts against is unchanged — the notice would be true and the
-- system would still let the money move.
alter table "core"."account"
  add column if not exists "lock_type" text,
  add column if not exists "restriction" text,
  add column if not exists "opening_channel" text,
  add column if not exists "maturity_date" date,
  add column if not exists "maturity_window" text,
  add column if not exists "maturity_disposition" text;

-- FL-02 / FL-08: channel and product decide which fair-lending rules apply at
-- all, and an options presentation that fell short has to say why.
alter table "core"."loan_application"
  add column if not exists "channel" text,
  add column if not exists "product_type" text,
  add column if not exists "applicant_state" text,
  add column if not exists "option_shortfall_reason" text,
  -- FL-06: HMDA is a geography-keyed filing. An application with no census
  -- tract cannot be tested for redlining, which is the pattern the geography
  -- exists to expose.
  add column if not exists "geography" text;

-- MP-02: the card request is the signal, so it lives on the address-change row
-- rather than only in an event payload — the takeover pattern has to be
-- queryable from the record, not reconstructed from the log.
alter table "core"."member_address_change"
  add column if not exists "card_reissue_request" boolean not null default false;

-- ------------------------------------------------------- FL-03 / FL-05 notices
--
-- NOT A NEW TABLE. `core.adverse_action_notice` already exists (lending
-- origination) and already carries reasons and a second reviewer. A parallel
-- deposit-side notice table would have been the half-built subsystem: two write
-- paths for one ECOA obligation, and eventually only one of them enforces the
-- reasons requirement. FL-05 asks for CONTENT this notice does not yet carry,
-- so the columns go on the notice that already exists.
alter table "core"."adverse_action_notice"
  add column if not exists "subject_kind" text,
  add column if not exists "account_ref" text,
  add column if not exists "applicant_state" text,
  -- Reg B 1002.9(a)(3): the small-business track has its own timing and content
  add column if not exists "applicant_business_revenue_tier" text,
  -- 1002.9(b)(2): a score-based denial owes the applicant the score block
  add column if not exists "decision_score_block" jsonb,
  add column if not exists "loan_party_identity" text,
  add column if not exists "loan_application_incompleteness_notice" boolean,
  -- a counteroffer that was not accepted becomes an adverse action in its own
  -- right; recording the terms is what makes that checkable later
  add column if not exists "loan_application_counteroffer_terms" jsonb,
  -- an oral statement of reasons still has to be recorded; unrecorded, the
  -- institution cannot show the reasons given matched the reasons held
  add column if not exists "loan_application_oral_statement" text;

-- FL-05 also covers deposit-side denials. Same notice, different subject —
-- which is why `loan_application_id` has to become optional rather than being
-- worked around with a placeholder application.
alter table "core"."adverse_action_notice"
  alter column "loan_application_id" drop not null;

-- MP-02: a card reissue asked for while an address change is still on hold is
-- the account-takeover pattern. The request has to be a fact ON THE CARD —
-- recording it only against the address change means the card subsystem, which
-- is the thing that would actually mail a card to the new address, never sees it.
alter table "core"."card"
  add column if not exists "reissue_request" boolean not null default false,
  add column if not exists "ship_to_address_id" text,
  add column if not exists "address_hold_blocked" boolean not null default false;
