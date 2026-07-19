-- Loan origination spine (LP-03, LP-07, LP-11).
--
-- core.loan_application has existed since the first migration with 20+ columns
-- and no writer. Lending is 15 controls; this builds the SPINE the others hang
-- off rather than all of them: the application lifecycle, the adverse-action
-- obligation, and the OFAC gate on loan parties.
--
-- THREE FINDINGS THIS DOMAIN FORCED
--
-- 1. FOUR-EYES, FOR THE THIRD TIME. LP-07 requires an adverse action notice to
--    pass second-level review by Compliance or senior underwriting before it is
--    issued. That is the same property as the SAR decision (ck_case_four_eyes)
--    and payment origination (ck_payment_approval_four_eyes). Rather than a
--    third bespoke constraint, core.payment_approval's resource_type widens to
--    carry it.
--
--    NAMING DEBT, recorded rather than hidden: `payment_approval` is now the
--    wrong name — it is a general four-eyes register and two of its three
--    resource types are not payments. Renaming is free while the migration is
--    unapplied and is owed. See OQ-17.
--
-- 2. LP-11 IS THE OFAC CALL SITE OQ-02 SAID WAS MISSING. BSA-05 requires
--    screening at payment submission and the call site did not exist; LP-11
--    requires it at loan_party.added with a funding BLOCK on a potential match.
--    The screen itself is still the sandbox stub — that half of OQ-02 remains
--    domain-blocked on a real list — but the blocking MECHANISM is now real and
--    is the part that was architecturally absent.
--
-- 3. ECOA's CLOCK IS 30 DAYS FROM APPLICATION COMPLETION, NOT FROM DECISION.
--    Reg B runs from when the application was complete. Anchoring on the
--    decision date would let a slow decision silently extend the notice
--    deadline, which is the same failure shape as the SAR clock running from
--    triage instead of detection.

-- ------------------------------------------------------------ loan parties
create table if not exists "core"."loan_party" (
  "id" text primary key,
  "loan_application_id" text not null,
  "entity_id" text,

  "role" text not null check ("role" in ('borrower', 'co_borrower', 'guarantor')),
  "party_name" text not null,

  -- LP-11. 'unscreened' is the initial state and is deliberately NOT the same
  -- as 'clear': a party nobody screened has not been found clean.
  "ofac_status" text not null default 'unscreened'
    check ("ofac_status" in ('unscreened', 'clear', 'potential_match', 'cleared_after_review', 'confirmed_match')),
  "ofac_list_version" text,
  "ofac_result" text,
  "ofac_screened_at" timestamptz,
  "ofac_cleared_by" text,

  "provenance" text not null default 'unknown'
    check ("provenance" in ('production', 'demo', 'unknown')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

comment on column "core"."loan_party"."ofac_status" is
  'LP-11. unscreened != clear: a party nobody screened has not been found clean. Only clear and cleared_after_review permit funding.';

comment on column "core"."loan_party"."ofac_list_version" is
  'The SDN list version screened against. NULL means the screen ran without a versioned list — currently always, because the screen is a sandbox stub (OQ-02). A screen whose list version is unknown cannot be re-verified later.';

-- ------------------------------------------- application lifecycle columns
alter table "core"."loan_application"
  add column if not exists "status" text not null default 'created',
  add column if not exists "completed_at" timestamptz,
  add column if not exists "decisioned_at" timestamptz,
  add column if not exists "decisioned_by" text,
  add column if not exists "final_action" text,
  add column if not exists "funding_block_state" text not null default 'open',
  add column if not exists "provenance" text not null default 'unknown';

alter table "core"."loan_application" drop constraint if exists "ck_loan_application_status";
alter table "core"."loan_application"
  add constraint "ck_loan_application_status"
  check ("status" in ('created', 'completed', 'decisioned', 'withdrawn'));

alter table "core"."loan_application" drop constraint if exists "ck_loan_application_final_action";
alter table "core"."loan_application"
  add constraint "ck_loan_application_final_action"
  check ("final_action" is null or "final_action" in ('approved', 'denied', 'counteroffer', 'withdrawn', 'incomplete'));

alter table "core"."loan_application" drop constraint if exists "ck_loan_application_funding_block";
alter table "core"."loan_application"
  add constraint "ck_loan_application_funding_block"
  check ("funding_block_state" in ('open', 'cleared', 'blocked'));

alter table "core"."loan_application" drop constraint if exists "ck_loan_application_provenance";
alter table "core"."loan_application"
  add constraint "ck_loan_application_provenance"
  check ("provenance" in ('production', 'demo', 'unknown'));

-- ------------------------------------------------- adverse action notices
create table if not exists "core"."adverse_action_notice" (
  "id" text primary key,
  "loan_application_id" text not null,

  -- ECOA/Reg B: 30 days from the date the application was COMPLETE.
  "application_completed_at" timestamptz not null,
  "notice_due_at" timestamptz not null,

  "reasons" jsonb not null,
  "credit_score_disclosed" boolean not null default false,
  "cra_disclosure_included" boolean not null default false,

  -- LP-07's second-level review, before issuance.
  "reviewed_by" text,
  "reviewed_at" timestamptz,

  "issued_at" timestamptz,
  "issued_by" text,

  "provenance" text not null default 'unknown'
    check ("provenance" in ('production', 'demo', 'unknown')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),

  constraint "uq_aan_application" unique ("loan_application_id")
);

-- LP-07: the notice must pass second-level review BEFORE it is issued. An AAN
-- that went out unreviewed cannot be un-sent, so this is enforced in the
-- database rather than in the writer.
alter table "core"."adverse_action_notice" drop constraint if exists "ck_aan_reviewed_before_issue";
alter table "core"."adverse_action_notice"
  add constraint "ck_aan_reviewed_before_issue"
  check (
    "issued_at" is null
    or ("reviewed_by" is not null and "reviewed_at" is not null and "reviewed_at" <= "issued_at")
  );

-- ECOA requires SPECIFIC reasons. An empty array is not a reason list, and a
-- notice with no reasons is the adverse-action finding an examiner looks for.
alter table "core"."adverse_action_notice" drop constraint if exists "ck_aan_has_reasons";
alter table "core"."adverse_action_notice"
  add constraint "ck_aan_has_reasons"
  check (jsonb_typeof("reasons") = 'array' and jsonb_array_length("reasons") > 0);

comment on constraint "ck_aan_reviewed_before_issue" on "core"."adverse_action_notice" is
  'LP-07: second-level review by Compliance or senior underwriting precedes issuance. An issued notice cannot be recalled, so the ordering is enforced structurally.';

-- ----------------------------------------- four-eyes register widens (OQ-17)
--
-- The third use of the same property. `payment_approval` is now misnamed; see
-- the header note and OQ-17.
alter table "core"."payment_approval" drop constraint if exists "payment_approval_resource_type_check";
alter table "core"."payment_approval"
  add constraint "payment_approval_resource_type_check"
  check ("resource_type" in (
    'wire_transfer', 'ach_transfer', 'client_limit_change', 'pospay_exception',
    'adverse_action_notice'
  ));

-- ----------------------------------------------------------------- indexes
create index if not exists "idx_loan_party_application" on "core"."loan_party" ("loan_application_id");
create index if not exists "idx_loan_party_unscreened"
  on "core"."loan_party" ("loan_application_id")
  where "ofac_status" = 'unscreened';
create index if not exists "idx_aan_overdue"
  on "core"."adverse_action_notice" ("notice_due_at")
  where "issued_at" is null;
create index if not exists "idx_loan_application_status" on "core"."loan_application" ("status");

alter table "core"."loan_party" drop constraint if exists "fk_loan_party_application";
alter table "core"."loan_party"
  add constraint "fk_loan_party_application"
  foreign key ("loan_application_id") references "core"."loan_application" ("id");
alter table "core"."adverse_action_notice" drop constraint if exists "fk_aan_application";
alter table "core"."adverse_action_notice"
  add constraint "fk_aan_application"
  foreign key ("loan_application_id") references "core"."loan_application" ("id");

-- sim mirrors: a 30-day ECOA clock cannot be waited out.
create table if not exists "sim"."loan_application" (like "core"."loan_application" including defaults);
create table if not exists "sim"."loan_party" (like "core"."loan_party" including defaults including indexes);
create table if not exists "sim"."adverse_action_notice" (like "core"."adverse_action_notice" including defaults including indexes);
do $$
declare t text;
begin
  foreach t in array array['loan_application', 'loan_party', 'adverse_action_notice'] loop
    execute format('alter table "sim".%I alter column "provenance" set default ''simulated''', t);
    execute format('alter table "sim".%I drop constraint if exists %I', t, 'ck_' || t || '_provenance');
    execute format(
      'alter table "sim".%I add constraint %I check ("provenance" = ''simulated'')',
      t, 'ck_sim_' || t || '_provenance');
  end loop;
end $$;

grant all privileges on "core"."loan_party", "core"."adverse_action_notice" to "service_role";
grant all privileges on "sim"."loan_application", "sim"."loan_party", "sim"."adverse_action_notice" to "service_role";

notify pgrst, 'reload schema';
