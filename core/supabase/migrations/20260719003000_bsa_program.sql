-- BSA/AML programme (BSA-03..BSA-19) — OFAC, EDD, SAR, filings.
--
-- ⚠ THE MOST OVER-READABLE MIGRATION IN THIS REPO. Read this before quoting
-- any BSA control as green.
--
-- **BSA-05 going green means the SCREENING MECHANISM works end to end. It does
-- NOT mean the screen detects anything.** OQ-02 records that the OFAC screen is
-- `/\bSDN\b/i` against a name, with no list, no `ofac.list_version`, and no
-- 50%-rule derivation. That is unchanged here. What this migration adds is the
-- machinery OQ-02 says is missing — the call site at payment submission, the
-- hold, the escalation, the clearance record — all of which are real and
-- testable. The comparison set is still empty.
--
-- So `ofac_screen.list_version` is NOT NULL-able by accident: it is nullable on
-- purpose and it is NULL on every row this system writes. A screen that cannot
-- name the list it ran against cannot be re-verified later, and the column
-- being visibly empty is the honest form of that.
--
-- WHAT THIS BUYS ANYWAY, and why it is worth building: every OFAC control in
-- the corpus currently fails because the MECHANISM does not exist. With the
-- mechanism, the remaining gap is one procurement decision (buy a list) rather
-- than an engineering project. That is a materially better place to be, and it
-- is the split OQ-02 asked for.

-- ------------------------------------------------------------------ screening
create table if not exists "core"."ofac_screen" (
  "id" text primary key,
  "subject_kind" text not null check ("subject_kind" in
    ('entity', 'loan_party', 'wire_beneficiary', 'ach_counterparty', 'monetary_instrument')),
  "subject_ref" text not null,
  "screened_name" text not null,
  -- NULL on every row. See the header: a screen that cannot name its list
  -- cannot be re-verified, and this column is where that shows.
  "list_version" text,
  "verdict" text not null check ("verdict" in ('clear', 'potential_match', 'confirmed_match')),
  "screened_at" timestamptz not null,
  "hold_placed_at" timestamptz,
  "hold_released_at" timestamptz,
  "released_by" text,
  "escalated_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- a match that placed no hold permitted the transaction it was screening
  constraint "ck_ofac_match_holds"
    check ("verdict" = 'clear' or "hold_placed_at" is not null),
  -- releasing a hold is a DECISION and needs an owner
  constraint "ck_ofac_release_owned"
    check ("hold_released_at" is null or "released_by" is not null)
);

-- --------------------------------------------------------------- EDD and PEP
create table if not exists "core"."edd_profile" (
  "id" text primary key,
  "entity_ref" text not null,
  "category" text not null check ("category" in
    ('msb', 'correspondent', 'pep', 'cash_intensive', 'nonresident_alien', 'privately_owned_atm')),
  "trigger_reason" text not null,
  "opened_at" timestamptz not null,
  "due_at" timestamptz not null,
  "completed_at" timestamptz,
  "approved_by" text,
  -- the corpus names this `edd.approver_id`; the column follows the
  -- specification's vocabulary rather than a tidier internal one (same rule as
  -- the cda clause columns)
  "approver_id" text,
  "senior_approval_required" boolean not null default false,
  "findings" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  -- EDD "completed" with no findings recorded is a status change
  constraint "ck_edd_completion_evidenced"
    check ("completed_at" is null or "findings" is not null),
  -- a category requiring senior approval cannot be approved by nobody
  constraint "ck_edd_senior_approval"
    check (not "senior_approval_required" or "completed_at" is null
           or "approved_by" is not null)
);

create table if not exists "core"."pep_screen" (
  "id" text primary key,
  "entity_ref" text not null,
  "screened_name" text not null,
  "list_version" text,
  "verdict" text not null check ("verdict" in ('clear', 'hit')),
  "pep_category" text,
  "screened_at" timestamptz not null,
  "edd_profile_id" text references "core"."edd_profile" ("id"),
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- a PEP hit that opens no EDD is a hit nobody acted on
  constraint "ck_pep_hit_opens_edd"
    check ("verdict" = 'clear' or "edd_profile_id" is not null)
);

-- ------------------------------------------------- BSA-09 monetary instruments
--
-- 31 CFR 1010.415: cash purchases of monetary instruments between $3,000 and
-- $10,000 require a log entry AND verified identification. Below $3,000 nothing
-- attaches; at $10,000 and above a CTR does instead.
create table if not exists "core"."monetary_instrument" (
  "id" text primary key,
  "instrument_type" text not null check ("instrument_type" in
    ('cashiers_check', 'money_order', 'travelers_check', 'bank_draft')),
  "amount_cents" bigint not null check ("amount_cents" > 0),
  "purchased_at" timestamptz not null,
  "purchaser_ref" text,
  "purchaser_name" text not null,
  "purchaser_id_type" text,
  "purchaser_id_number" text,
  "purchaser_dob" date,
  "log_required" boolean not null,
  "id_verified" boolean not null default false,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- a logged purchase without verified identification is the failure the log
  -- exists to prevent: an anonymous instrument in the reportable band
  constraint "ck_mi_log_requires_id"
    check (not "log_required" or (
      "id_verified" and "purchaser_id_type" is not null
      and "purchaser_id_number" is not null
    ))
);

-- ------------------------------------------------------------ BSA-13 FBAR
create table if not exists "core"."fbar_account" (
  "id" text primary key,
  "account_ref" text not null,
  "country" text not null,
  "institution_name" text not null,
  "max_value_cents" bigint not null,
  "reporting_year" int not null,
  "added_at" timestamptz not null,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

create table if not exists "core"."fbar_filing" (
  "id" text primary key,
  "reporting_year" int not null,
  "aggregate_max_cents" bigint not null,
  "threshold_cents" bigint not null,
  "required" boolean not null,
  "due_at" timestamptz not null,
  "filed_at" timestamptz,
  "filed_by" text,
  "bsa_efiling_ref" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  constraint "ck_fbar_filed_has_ref"
    check ("filed_at" is null or ("filed_by" is not null and "bsa_efiling_ref" is not null))
);

-- ------------------------------------ BSA-11 / BSA-19 inbound from FinCEN
--
-- `core.filing` is one of the 22 ABANDONED TABLES. A 314(a) request and a GTO
-- both ARRIVE at the institution and are logged, searched and answered — they
-- are not the regulator's own actions, which is why they are in scope while
-- an examiner's findings are not (see BLUEPRINT §X.2).
alter table "core"."filing"
  add column if not exists "kind" text,
  add column if not exists "reference" text,
  add column if not exists "received_at" timestamptz,
  add column if not exists "response_due_at" timestamptz,
  add column if not exists "searched_at" timestamptz,
  add column if not exists "match_count" int,
  add column if not exists "responded_at" timestamptz,
  add column if not exists "responded_by" text,
  add column if not exists "provenance" text not null default 'production';

create table if not exists "core"."regulatory_change" (
  "id" text primary key,
  "kind" text not null check ("kind" in ('gto', 'special_measure', 'advisory', 'rule_change')),
  "reference" text not null,
  "issued_by" text not null,
  "received_at" timestamptz not null,
  "effective_at" timestamptz not null,
  "assessment_due_at" timestamptz not null,
  "applicability" text,
  "assessed_at" timestamptz,
  "assessed_by" text,
  "controls_updated" jsonb not null default '[]'::jsonb,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- an assessment with no applicability determination has not been assessed
  constraint "ck_regchange_assessment_complete"
    check ("assessed_at" is null or "applicability" is not null)
);

-- ------------------------------------------------------- BSA-14 escalation
create table if not exists "core"."escalation" (
  "id" text primary key,
  "source_kind" text not null,
  "source_ref" text not null,
  "severity" text not null check ("severity" in ('routine', 'elevated', 'urgent')),
  "routed_to" text not null,
  "routed_at" timestamptz not null,
  "ack_due_at" timestamptz not null,
  "acknowledged_at" timestamptz,
  "acknowledged_by" text,
  "closed_at" timestamptz,
  "disposition" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- an escalation closed with no disposition is an escalation that stopped
  -- being looked at
  constraint "ck_escalation_closure_disposed"
    check ("closed_at" is null or "disposition" is not null)
);

create index if not exists "ix_ofac_screen_subject" on "core"."ofac_screen" ("subject_ref");
create index if not exists "ix_edd_open" on "core"."edd_profile" ("completed_at", "due_at");
create index if not exists "ix_escalation_open" on "core"."escalation" ("closed_at", "ack_due_at");
create index if not exists "ix_mi_purchaser" on "core"."monetary_instrument" ("purchaser_ref", "purchased_at" desc);

create schema if not exists "sim";
create table if not exists "sim"."ofac_screen" (like "core"."ofac_screen" including all);
create table if not exists "sim"."edd_profile" (like "core"."edd_profile" including all);
create table if not exists "sim"."pep_screen" (like "core"."pep_screen" including all);
create table if not exists "sim"."monetary_instrument" (like "core"."monetary_instrument" including all);
create table if not exists "sim"."fbar_account" (like "core"."fbar_account" including all);
create table if not exists "sim"."fbar_filing" (like "core"."fbar_filing" including all);
create table if not exists "sim"."regulatory_change" (like "core"."regulatory_change" including all);
create table if not exists "sim"."escalation" (like "core"."escalation" including all);

-- `core.originator` is another of the 22 ABANDONED TABLES. 31 CFR 1010.410(f)
-- requires the Travel Rule record be RETAINED for five years and retrievable —
-- which an event payload is not, so it has to be a row.
alter table "core"."originator"
  add column if not exists "name" text,
  add column if not exists "address" text,
  add column if not exists "reference" text,
  add column if not exists "routing_number" text,
  add column if not exists "beneficiary_name" text,
  add column if not exists "beneficiary_reference" text,
  add column if not exists "wire_ref" text,
  add column if not exists "amount_cents" bigint,
  add column if not exists "provenance" text not null default 'production';

-- BSA-03: a CIP that records only "verified" cannot distinguish a documentary
-- full match from a thin non-documentary one, and the two carry different risk.
alter table "core"."verification"
  add column if not exists "provider_result" text,
  add column if not exists "match_status" text,
  add column if not exists "trust_level" text;
