-- =====================================================================
-- Cassandra Banking Core API  ->  Supabase schema  (generated)
-- Source: core-api.yaml  v3.0.0
-- Scope: 39 resource tables (banking-core + primitive + domain).
--        30 embedded detail schemas are folded into jsonb columns.
-- Typing: promoted (timestamptz / bigint / numeric / boolean / jsonb).
-- Identifiers are quoted; tables live in schema "core".
-- DO NOT EDIT BY HAND — regenerate via supabase/generate/gen_sql.py.
-- =====================================================================

create schema if not exists "core";
create extension if not exists pgcrypto;      -- gen_random_uuid()

-- updated_at maintenance
create or replace function "core".set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;


create table if not exists "core"."account" (
  "id" text primary key,
  "account_type" text,
  "balance" bigint,
  "blnk_ledger_id" text,
  "created_at" timestamptz,
  "lock_type" text check ("lock_type" in ('none', 'compliance', 'fraud', 'legal', 'admin')),
  "maturity_date" timestamptz,
  "maturity_disposition" text,
  "opening_channel" text,
  "status" text check ("status" in ('open', 'frozen', 'closed')),
  "closure_payout_due_at" timestamptz,
  "maturity_notice_due_at" timestamptz,
  "adverse_action" text,
  "death_flag" text,
  "maturity_window" text,
  "restriction" text,
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."account_number" (
  "id" text primary key,
  "account_id" text,
  "routing_number" text,
  "account_number" text,
  "informational_entity_id" text,
  "status" text check ("status" in ('active', 'disabled', 'canceled')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."ach_transfer" (
  "id" uuid primary key default gen_random_uuid(),
  "amount" bigint,
  "control_results" jsonb,
  "counterparty" jsonb,
  "status" text check ("status" in ('pending_approval', 'submitted', 'settled', 'returned', 'rejected', 'canceled')),
  "window" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."address" (
  "id" uuid primary key default gen_random_uuid(),
  "city" text,
  "country" text,
  "line1" text,
  "line2" text,
  "ncoa_candidate" text,
  "postal_code" text,
  "region" text,
  "ncoa_mismatch" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."bookkeeping_entry" (
  "id" text primary key,
  "account_code_5300" text,
  "amount" bigint,
  "locked_amount" bigint,
  "running_balance" text,
  "schedule_a_code" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."bsa_alert" (
  "id" text primary key,
  "alert_type" text,
  "details" text,
  "entity_hash" text,
  "event_id" text,
  "requires_lookback" text,
  "status" text,
  "triage_timer" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."card" (
  "id" text primary key,
  "reissue_request" text,
  "request_during_address_hold" text,
  "spend_controls" text,
  "status" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."card_authorization" (
  "id" text primary key,
  "amount" bigint,
  "control_results" jsonb,
  "decline_reason" text,
  "merchant" text,
  "status" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."case" (
  "id" text primary key,
  "owner_id" text,
  "audit" jsonb,
  "disclosure" jsonb,
  "escalation" jsonb,
  "evidence" jsonb,
  "status" text check ("status" in ('opened', 'in_review', 'closed')),
  "summary" text,
  "tasks" jsonb,
  "type" text check ("type" in ('investigation', 'sar_decision', 'escalation', 'audit_engagement', 'sar_disclosure_request')),
  "sar_decision_timer" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."change" (
  "id" uuid primary key default gen_random_uuid(),
  "backout_plan" jsonb,
  "deployment_record" jsonb,
  "emergency_approval_timer" text,
  "emergency_justification" text,
  "requested" text,
  "rollback_plan" jsonb,
  "test_evidence" jsonb,
  "approver_id" text,
  "risk_rating" text,
  "cab_review_due_at" timestamptz,
  "post_review_due_at" timestamptz,
  "cab_decision" text,
  "rfc" text,
  "status" text check ("status" in ('requested', 'in_review', 'deployed', 'closed')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."coi" (
  "id" uuid primary key default gen_random_uuid(),
  "adhoc_form" text,
  "attestation_date" date,
  "attestation_signature" text,
  "conflict_identified" text,
  "conflicted_matter_voted" text,
  "determination_made" text,
  "independent_review" text,
  "interest_description" text,
  "matter_reference" text,
  "questionnaire_responses" text,
  "questionnaire_version" text,
  "recusal_noticed" text,
  "recusal_record" jsonb,
  "register_entry_id" text,
  "related_party" text,
  "certification_due" date,
  "questionnaire_due_at" timestamptz,
  "adhoc_disclosure" text,
  "annual_cycle" text,
  "status" text check ("status" in ('disclosed', 'under_review', 'determined')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."complaint" (
  "id" uuid primary key default gen_random_uuid(),
  "category" text,
  "final_response_pending" text,
  "investigation_notes" text,
  "member_id" text,
  "portal_due_date" date,
  "root_cause_tag" text,
  "trend_summary" jsonb,
  "udaap_flag" boolean,
  "channel" text,
  "narrative" text,
  "ack_due_at" timestamptz,
  "final_response_due_at" timestamptz,
  "initial_response_due_at" timestamptz,
  "resolution_due_at" timestamptz,
  "trend_review_due" date,
  "direct" text,
  "privacy" text,
  "regulator" text,
  "status" text check ("status" in ('received', 'investigating', 'resolved', 'closed')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."control_result" (
  "id" text primary key,
  "control_id" text,
  "decision" text check ("decision" in ('pass', 'hold', 'block', 'reject', 'clear')),
  "event" text,
  "matched_lists" jsonb,
  "ofac" jsonb,
  "score" numeric,
  "subject_ref" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."dispute" (
  "id" uuid primary key default gen_random_uuid(),
  "basis" text,
  "category" text,
  "correction_amount" bigint,
  "findings" text,
  "idtheft_report" text,
  "regulator_case_id" text,
  "regulator_routed" text,
  "investigation_due_at" timestamptz,
  "provisional_credit_due_at" timestamptz,
  "response_due_at" timestamptz,
  "rege_clock" text,
  "regulator_response" text,
  "status" text check ("status" in ('filed', 'investigating', 'resolved', 'closed')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."document" (
  "id" text primary key,
  "attached" text,
  "curriculum" jsonb,
  "edd" jsonb,
  "legal_hold_flag" boolean,
  "mi" jsonb,
  "policy" jsonb,
  "report" jsonb,
  "retention_anchor" date,
  "retention_schedule" text,
  "risk" jsonb,
  "subject_ref" text,
  "type" text check ("type" in ('bo_certification', 'risk_profile', 'edd_file', 'risk_catalog', 'policy_version', 'mi_central_log', 'curriculum', 'audit_workpapers', 'board_pack', 'vendor_review', 'vendor_alert')),
  "vendor" jsonb,
  "vendor_alert" jsonb,
  "attachment_due_at" timestamptz,
  "required_set" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."entity" (
  "id" text primary key,
  "address" text,
  "address_change" text,
  "address_new" text,
  "address_previous" text,
  "contact" text,
  "contact_preference" text,
  "date_of_birth" text,
  "disabled" text,
  "email" text,
  "esign_consent" text,
  "jurisdiction" text,
  "name" text,
  "reg_e_opt_in" text,
  "status" text check ("status" in ('pending', 'active', 'disabled', 'archived')),
  "tin" text,
  "type" text,
  "update" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."event" (
  "id" text primary key,
  "code" text,
  "created_at" timestamptz,
  "data" text,
  "entity_hash" text,
  "payload" jsonb,
  "previous_data" jsonb,
  "resource_id" text,
  "type" text,
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."fbo_position" (
  "id" uuid primary key default gen_random_uuid(),
  "balance" bigint,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."filing" (
  "id" text primary key,
  "cmir" jsonb,
  "control_id" text,
  "ctr" jsonb,
  "fbar" jsonb,
  "filed_at" timestamptz,
  "filing_id" text,
  "fincen_314a" jsonb,
  "ofac" jsonb,
  "sar" jsonb,
  "status" text check ("status" in ('prepared', 'submitted', 'acknowledged', 'continuing', 'amended', 'nil_determined')),
  "type" text check ("type" in ('ctr', 'doep', 'sar', 'sar_continuing', 'cmir', 'fbar', 'ofac_blocking', 'ofac_annual', 'fincen_314a')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."finding" (
  "id" uuid primary key default gen_random_uuid(),
  "closure_evidence" jsonb,
  "communicated" text,
  "department" text,
  "identified" text,
  "implementation_date" date,
  "management_response" text,
  "open_report" text,
  "owner" text,
  "remediation_evidence" jsonb,
  "remediation_status" text,
  "responsible_party" text,
  "risk_acceptance_package" text,
  "risk_acceptance_rationale" text,
  "tracked" text,
  "description" text,
  "risk_rating" text,
  "root_cause" text,
  "severity" text,
  "escalation_due_at" timestamptz,
  "monthly_review_due" date,
  "quarterly_report_due" date,
  "response_due_at" timestamptz,
  "aging_threshold" text,
  "corrective_action" text,
  "critical" text,
  "status" text check ("status" in ('open', 'in_remediation', 'risk_accepted', 'closed')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."handover" (
  "id" uuid primary key default gen_random_uuid(),
  "access_scope" text,
  "appointment_reference" text,
  "appointment_status" text,
  "personnel_roster" jsonb,
  "trustee_access_grant_id" text,
  "trustee_access_provisioned" text,
  "trustee_action" text,
  "trustee_contact" text,
  "trustee_credential_id" text,
  "trustee_identity" text,
  "access_expiry_due" date,
  "full_due_at" timestamptz,
  "initial_due_at" timestamptz,
  "status" text check ("status" in ('initiated', 'provisioned', 'completed')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."inbound_payment" (
  "id" text primary key,
  "amount" bigint,
  "originator" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."incident" (
  "id" text primary key,
  "bsa_referral_id" text,
  "cco_signoff" text,
  "checklist_first_hour" text,
  "comms_plan" jsonb,
  "contained" text,
  "containment_timer" text,
  "criminal_suspected" text,
  "data_scope" text,
  "description" text,
  "detail" jsonb,
  "detection_source" text,
  "discovery_notes" text,
  "facts" text,
  "ic_assignment_timer" text,
  "impact_summary" jsonb,
  "legal_review" text,
  "member_notice_required" boolean,
  "member_notice_template" text,
  "misuse_determined" text,
  "misuse_likelihood" text,
  "notice_content" text,
  "notice_template_id" text,
  "notification_determined" text,
  "quarterly_summary" jsonb,
  "recovered" text,
  "reportability_assessment" text,
  "reportability_determination" text,
  "reportability_rationale" text,
  "reportable_determined" text,
  "root_cause" text,
  "sar_referred" text,
  "scope" text,
  "scope_initial" text,
  "severity" text,
  "status" text check ("status" in ('declared', 'responding', 'contained', 'postmortem', 'closed')),
  "summary_id" text,
  "timeline" text,
  "triaged" text,
  "ncua_notice_due_at" timestamptz,
  "notification_due_at" timestamptz,
  "triage_due_at" timestamptz,
  "regulator_notification_due" date,
  "collections" text,
  "material" text,
  "member_impact" text,
  "member_notices" text,
  "security" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."indemnification" (
  "id" uuid primary key default gen_random_uuid(),
  "advance.disbursed" text,
  "advance.requested" text,
  "advance_balance" text,
  "claim.notified" text,
  "conduct_record" jsonb,
  "counsel_opinion" text,
  "decision_body" text,
  "decision_body.selected" text,
  "defense_budget" text,
  "defense_invoice" text,
  "disposition_record" jsonb,
  "enforcement_status" text,
  "expense_statement" text,
  "federal_screen_result" text,
  "liability_terms" jsonb,
  "matter.resolved_favorably" text,
  "payment.blocked" text,
  "payment.disbursed" text,
  "recusal_record" jsonb,
  "repayment.demanded" text,
  "request" text,
  "request.routed" text,
  "standard_determination.made" text,
  "undertaking" text,
  "legal_review" text,
  "advance_due_at" timestamptz,
  "determination_due_at" timestamptz,
  "payment_due_at" timestamptz,
  "status" text check ("status" in ('requested', 'under_review', 'determined', 'paid')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."insider" (
  "id" uuid primary key default gen_random_uuid(),
  "aggregate_credit_amount" bigint,
  "collateral_marketability" text,
  "comparable_terms" jsonb,
  "correspondent_credit_data" jsonb,
  "credit_extended" text,
  "credit_threshold_exceeded" text,
  "funded_terms" jsonb,
  "limits_recomputed" text,
  "officer_financial_statement" text,
  "proposed_terms" jsonb,
  "public_request" text,
  "record_circulated" text,
  "record_compiled" text,
  "record_entry" text,
  "record_prior" text,
  "loc_approval_expires_at" timestamptz,
  "public_request_retention_expires_at" timestamptz,
  "report_due" date,
  "board_approval" text,
  "board_report" text,
  "credit_application" text,
  "public_disclosure" text,
  "terms_parity" text,
  "status" text check ("status" in ('requested', 'board_review', 'approved', 'denied')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."legal_hold" (
  "id" text primary key,
  "hold_scope" text,
  "matter_id" text,
  "matter_ref" jsonb,
  "placed_at" timestamptz,
  "release_approved_by" text,
  "released" text,
  "released_at" timestamptz,
  "schedule_resumed" text,
  "status" text,
  "clear" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."loan" (
  "id" text primary key,
  "accrued_interest" text,
  "action_basis" jsonb,
  "balance" bigint,
  "bankruptcy_case_id" text,
  "booking_block_state" text check ("booking_block_state" in ('open', 'cleared', 'blocked')),
  "charged_off" text,
  "chargeoff_due_closed_end" text,
  "chargeoff_due_open_end" text,
  "chargeoff_month_end_at" timestamptz,
  "classified_substandard" text,
  "collateral_value" text,
  "collectibility_assessment" text,
  "death_loss_estimable" text,
  "delinquency_day_10" text,
  "delinquency_day_20" text,
  "delinquency_day_30" text,
  "delinquency_day_60" text,
  "delinquency_day_90" text,
  "delinquency_engine_run" text,
  "delinquency_engine_schedule" text,
  "dpd" text,
  "dpd_reset" text,
  "dpd_reset_eligibility_check" text,
  "estate_claim_status" text,
  "estimated_recovery" text,
  "foreclosure_impact_eval" text,
  "funding_block_state" text check ("funding_block_state" in ('open', 'cleared', 'blocked')),
  "grace_period_days" text,
  "io_term_months" text,
  "last_payment_date" timestamptz,
  "ltv" numeric,
  "modified_schedule" text,
  "nonaccrual_placed" text,
  "past_due_amount" bigint,
  "product_type" text,
  "proposed_modification" text,
  "repayment_evidence" jsonb,
  "risk_rating" text,
  "well_secured_documented" text,
  "workout_alternatives" text,
  "bankruptcy_chargeoff_due_at" timestamptz,
  "classification_due_at" timestamptz,
  "courtesy_notice_due_at" timestamptz,
  "days_past_due" date,
  "fraud_chargeoff_due_at" timestamptz,
  "nonaccrual_due_at" timestamptz,
  "rating_review_due_at" timestamptz,
  "re_valuation_due" date,
  "right_to_cure_due_at" timestamptz,
  "second_reminder_due_at" timestamptz,
  "status_memo_due_at" timestamptz,
  "accrual" text,
  "bankruptcy_notice" text,
  "io_capitalization" text,
  "modified_payment_3" text,
  "re_writedown" text,
  "status" text check ("status" in ('booking_requested', 'booked', 'funded')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."loan_application" (
  "id" text primary key,
  "action_basis" jsonb,
  "amount" bigint,
  "applicant" jsonb,
  "atr_qm_result" text,
  "channel" text,
  "counteroffer_status" text check ("counteroffer_status" in ('none', 'issued', 'accepted', 'expired')),
  "counteroffer_terms" jsonb,
  "credit_structure" jsonb,
  "data" jsonb,
  "decision" jsonb,
  "decision_block_state" text check ("decision_block_state" in ('open', 'cleared', 'blocked')),
  "doc_block_state" text check ("doc_block_state" in ('open', 'cleared', 'blocked')),
  "dti" numeric,
  "employment" jsonb,
  "final_action" text,
  "geography" text,
  "gmi" jsonb,
  "income_assets" jsonb,
  "incomplete_aged" boolean,
  "notified_at" timestamptz,
  "option_shortfall_reason" text,
  "oral_adverse_decision" boolean,
  "oral_statement" text,
  "parties" jsonb,
  "prequal" jsonb,
  "product_code" text,
  "product_type" text,
  "requested_terms" jsonb,
  "aan_due_at" timestamptz,
  "counteroffer_aan_due_at" timestamptz,
  "decision_due_at" timestamptz,
  "adverse_action" text,
  "decisioned" text,
  "docs" text,
  "incompleteness_notice" text,
  "insider" text,
  "thin_file" text,
  "status" text check ("status" in ('created', 'decisioned', 'counteroffer', 'final_action')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."originator" (
  "id" uuid primary key default gen_random_uuid(),
  "name" text,
  "routing_number" text,
  "reference" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."provider_result" (
  "id" uuid primary key default gen_random_uuid(),
  "document_verified" boolean,
  "identity_verified" boolean,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."records_package" (
  "id" uuid primary key default gen_random_uuid(),
  "artifact_id" text,
  "checksum_chain" text,
  "failure_reason" text,
  "manifest_id" text,
  "rebuilt" text,
  "requested" text,
  "snapshot_as_of" text,
  "snapshot_id" text,
  "snapshot_schedule" text,
  "complete_due_at" timestamptz,
  "snapshot_due" date,
  "start_due_at" timestamptz,
  "status" text check ("status" in ('requested', 'building', 'complete', 'failed')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."risk" (
  "id" text primary key,
  "owner_id" text,
  "assessment_results" jsonb,
  "assessment_scored" text,
  "impact_score" numeric,
  "inherent_rating" text,
  "last_assessed_at" timestamptz,
  "likelihood_score" numeric,
  "poam_cycle" text,
  "poam_status" text,
  "reassessed" text,
  "register_snapshot" jsonb,
  "registered" text,
  "remediation_evidence" jsonb,
  "residual_rating" text,
  "review_overdue" text,
  "threat_catalog" jsonb,
  "candidate_profile" text,
  "description" text,
  "geography_factors" text,
  "inherent_score" numeric,
  "partner_dependency" text,
  "assessment_due_at" timestamptz,
  "assessment_timer" text,
  "product_assessment_due_at" timestamptz,
  "reassessment_due_at" timestamptz,
  "status" text check ("status" in ('registered', 'assessed', 'monitored', 'closed')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."task" (
  "id" text primary key,
  "due_at" timestamptz,
  "retention" jsonb,
  "status" text check ("status" in ('pending', 'due', 'completed', 'overdue')),
  "subject_ref" text,
  "training" jsonb,
  "type" text check ("type" in ('acknowledgement', 'activation', 'analysis', 'approval', 'assessment', 'attestation', 'audit', 'certification', 'chargeoff', 'check', 'classification', 'completion', 'compute', 'consolidation', 'decision', 'delivery', 'deprovision', 'disposal', 'distribution', 'escalation', 'exercise', 'expiry', 'filing', 'flag', 'hold', 'investigation', 'issuance', 'notice', 'onboarding', 'payment', 'plan', 'propagation', 'publish', 'purge', 'reconciliation', 'refresh', 'remediation', 'renewal', 'report', 'resolution', 'response', 'retention', 'review', 'revocation', 'simulation', 'submission', 'sweep', 'test', 'training', 'transition', 'triage', 'update', 'valuation', 'verification')),
  "subject" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."trade" (
  "id" uuid primary key default gen_random_uuid(),
  "blocked_prohibited" text,
  "checklist_exception_raised" text,
  "confirmation_matched" text,
  "entered" text,
  "exception_raised" text,
  "intermediary_blocked" text,
  "intermediary_id" text,
  "intermediary_validated" text,
  "limit_blocked" text,
  "pretrade_checklist" text,
  "settlement_amount" bigint,
  "settlement_date" date,
  "sod_blocked" text,
  "step_attempted" text,
  "ticket" text,
  "valuation_support" text,
  "reconciliation_due_at" timestamptz,
  "instrument_type" text,
  "approval" text,
  "confirmation_discrepancy" text,
  "limit_warning" text,
  "permissibility" text,
  "status" text check ("status" in ('entered', 'confirmed', 'settled', 'blocked')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."training" (
  "id" uuid primary key default gen_random_uuid(),
  "assessment_score" numeric,
  "assignee_id" text,
  "completion_status" text,
  "content_version" text,
  "coverage_pct" text,
  "curriculum_id" text,
  "curriculum_map" text,
  "cycle_close_at" timestamptz,
  "lapsed" text,
  "module_id" text,
  "proficiency.failed" text,
  "refresher_curriculum" text,
  "required_curriculum" text,
  "role_matrix" jsonb,
  "skills_inventory" jsonb,
  "change_summary" text,
  "hire_date" date,
  "role_curriculum" text,
  "annual_due" date,
  "annual_due_at" timestamptz,
  "annual_timer" text,
  "completion_due_at" timestamptz,
  "new_hire_timer" text,
  "newhire_due_at" timestamptz,
  "onboarding_due_at" timestamptz,
  "privacy_due" date,
  "retention_due_at" timestamptz,
  "board_curriculum" text,
  "annual_cycle" text,
  "assignment" text,
  "capital" text,
  "content_trigger" text,
  "refresh" text,
  "remedial" text,
  "session" text,
  "status" text check ("status" in ('assigned', 'in_progress', 'completed', 'lapsed')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."transfer" (
  "id" text primary key,
  "amount" bigint,
  "beneficiary" jsonb,
  "counterparty" jsonb,
  "originator" jsonb,
  "status" text check ("status" in ('pending_approval', 'submitted', 'settled', 'returned', 'rejected', 'canceled')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."user" (
  "id" text primary key,
  "employment_status" text,
  "role" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."verification" (
  "id" text primary key,
  "alt_path_available" text,
  "biometric_consent_id" text,
  "biometric_declined" text,
  "biometric_purged" text,
  "cdd" jsonb,
  "expires_at" timestamptz,
  "match_status" text,
  "ofac_result" text,
  "pep" jsonb,
  "provider" text,
  "provider_result" text,
  "status" text check ("status" in ('pending', 'approved', 'denied')),
  "trust_level" text,
  "type" text,
  "biometric_purge_due_at" timestamptz,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."wire_transfer" (
  "id" uuid primary key default gen_random_uuid(),
  "amount" bigint,
  "beneficiary" jsonb,
  "control_results" jsonb,
  "imad" text,
  "purpose" text,
  "record_retained" text,
  "status" text check ("status" in ('pending_approval', 'submitted', 'completed', 'return_requested', 'returned', 'rejected', 'canceled')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);


-- ---- triggers ----
drop trigger if exists "set_updated_at" on "core"."account";
create trigger "set_updated_at" before update on "core"."account" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."account_number";
create trigger "set_updated_at" before update on "core"."account_number" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."ach_transfer";
create trigger "set_updated_at" before update on "core"."ach_transfer" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."address";
create trigger "set_updated_at" before update on "core"."address" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."bookkeeping_entry";
create trigger "set_updated_at" before update on "core"."bookkeeping_entry" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."bsa_alert";
create trigger "set_updated_at" before update on "core"."bsa_alert" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."card";
create trigger "set_updated_at" before update on "core"."card" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."card_authorization";
create trigger "set_updated_at" before update on "core"."card_authorization" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."case";
create trigger "set_updated_at" before update on "core"."case" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."change";
create trigger "set_updated_at" before update on "core"."change" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."coi";
create trigger "set_updated_at" before update on "core"."coi" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."complaint";
create trigger "set_updated_at" before update on "core"."complaint" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."control_result";
create trigger "set_updated_at" before update on "core"."control_result" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."dispute";
create trigger "set_updated_at" before update on "core"."dispute" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."document";
create trigger "set_updated_at" before update on "core"."document" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."entity";
create trigger "set_updated_at" before update on "core"."entity" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."event";
create trigger "set_updated_at" before update on "core"."event" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."fbo_position";
create trigger "set_updated_at" before update on "core"."fbo_position" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."filing";
create trigger "set_updated_at" before update on "core"."filing" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."finding";
create trigger "set_updated_at" before update on "core"."finding" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."handover";
create trigger "set_updated_at" before update on "core"."handover" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."inbound_payment";
create trigger "set_updated_at" before update on "core"."inbound_payment" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."incident";
create trigger "set_updated_at" before update on "core"."incident" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."indemnification";
create trigger "set_updated_at" before update on "core"."indemnification" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."insider";
create trigger "set_updated_at" before update on "core"."insider" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."legal_hold";
create trigger "set_updated_at" before update on "core"."legal_hold" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."loan";
create trigger "set_updated_at" before update on "core"."loan" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."loan_application";
create trigger "set_updated_at" before update on "core"."loan_application" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."originator";
create trigger "set_updated_at" before update on "core"."originator" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."provider_result";
create trigger "set_updated_at" before update on "core"."provider_result" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."records_package";
create trigger "set_updated_at" before update on "core"."records_package" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."risk";
create trigger "set_updated_at" before update on "core"."risk" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."task";
create trigger "set_updated_at" before update on "core"."task" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."trade";
create trigger "set_updated_at" before update on "core"."trade" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."training";
create trigger "set_updated_at" before update on "core"."training" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."transfer";
create trigger "set_updated_at" before update on "core"."transfer" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."user";
create trigger "set_updated_at" before update on "core"."user" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."verification";
create trigger "set_updated_at" before update on "core"."verification" for each row execute function "core".set_updated_at();
drop trigger if exists "set_updated_at" on "core"."wire_transfer";
create trigger "set_updated_at" before update on "core"."wire_transfer" for each row execute function "core".set_updated_at();


-- ---- comments (table descriptions + control bindings) ----
comment on column "core"."account"."account_type" is 'evidences TIS-04';
comment on column "core"."account"."balance" is 'evidences MB-05, MB-06, TIS-06';
comment on column "core"."account"."lock_type" is 'evidences MEM-05';
comment on column "core"."account"."maturity_date" is 'evidences TIS-04';
comment on column "core"."account"."maturity_disposition" is 'evidences TIS-04';
comment on column "core"."account"."opening_channel" is 'evidences TIS-02';
comment on column "core"."account"."closure_payout_due_at" is 'evidences MB-05';
comment on column "core"."account"."maturity_notice_due_at" is 'evidences TIS-04';
comment on column "core"."account"."adverse_action" is 'provisional (derived from event)';
comment on column "core"."account"."death_flag" is 'provisional (derived from event)';
comment on column "core"."account"."maturity_window" is 'provisional (derived from event)';
comment on column "core"."account"."restriction" is 'provisional (derived from event)';
comment on table "core"."account" is 'A ledger account holding a balance. Lifecycle open↔frozen→closed (Decision 7); carries lock_type and dormancy state.';
comment on column "core"."account_number"."account_id" is 'FK -> account';
comment on table "core"."account_number" is 'A routing/account-number pair issued against an Account — 1:Many (Decision 2). Used for FBO attribution and external addressing (Decision 20).';
comment on column "core"."ach_transfer"."counterparty" is 'embedded Counterparty';
comment on table "core"."ach_transfer" is 'An ACH credit or debit transfer. Lifecycle pending_approval→submitted→settled, with return/rejection handling.';
comment on column "core"."address"."line1" is 'evidences PR-05';
comment on column "core"."address"."ncoa_candidate" is 'evidences PR-05';
comment on column "core"."address"."postal_code" is 'evidences PR-05';
comment on column "core"."address"."ncoa_mismatch" is 'provisional (derived from event)';
comment on table "core"."address" is 'A postal address.';
comment on column "core"."bookkeeping_entry"."schedule_a_code" is 'evidences RR-02';
comment on table "core"."bookkeeping_entry" is 'A double-entry ledger posting.';
comment on column "core"."bsa_alert"."alert_type" is 'evidences BSA-06';
comment on column "core"."bsa_alert"."details" is 'evidences BSA-06';
comment on column "core"."bsa_alert"."entity_hash" is 'evidences BSA-06';
comment on column "core"."bsa_alert"."event_id" is 'FK -> event';
comment on column "core"."bsa_alert"."requires_lookback" is 'evidences BSA-06';
comment on column "core"."bsa_alert"."triage_timer" is 'evidences BSA-06';
comment on table "core"."bsa_alert" is 'A Bank Secrecy Act transaction-monitoring alert.';
comment on column "core"."card"."request_during_address_hold" is 'evidences MB-02';
comment on table "core"."card" is 'A payment card issued against an account.';
comment on table "core"."card_authorization" is 'A card authorization request and its decision.';
comment on column "core"."case"."owner_id" is 'evidences BSA-02, BSA-06, ERM-04, ERM-07, IC-07';
comment on column "core"."case"."audit" is 'embedded AuditDetail';
comment on column "core"."case"."disclosure" is 'embedded DisclosureDetail';
comment on column "core"."case"."escalation" is 'embedded EscalationDetail';
comment on column "core"."case"."evidence" is 'array of Document (soft ref by id -> document); evidences BSA-06';
comment on column "core"."case"."summary" is 'evidences BSA-06';
comment on column "core"."case"."sar_decision_timer" is 'evidences BSA-06, TPR-08';
comment on table "core"."case" is 'An investigation or work case.';
comment on column "core"."change"."backout_plan" is 'evidences IC-05, IS-04';
comment on column "core"."change"."deployment_record" is 'evidences IC-05, IS-04';
comment on column "core"."change"."emergency_justification" is 'evidences IS-04';
comment on column "core"."change"."requested" is 'evidences IC-05';
comment on column "core"."change"."rollback_plan" is 'evidences IC-05, IS-04';
comment on column "core"."change"."test_evidence" is 'evidences IC-05, IS-04';
comment on column "core"."change"."approver_id" is 'evidences IC-05, IS-04';
comment on column "core"."change"."risk_rating" is 'evidences IC-05, IS-04';
comment on column "core"."change"."cab_review_due_at" is 'evidences IC-05, IS-04';
comment on column "core"."change"."post_review_due_at" is 'evidences IC-05, IS-04';
comment on column "core"."change"."cab_decision" is 'provisional (derived from event)';
comment on column "core"."change"."rfc" is 'provisional (derived from event)';
comment on table "core"."change" is 'A change request tracked through review, deployment, and post-implementation review.';
comment on column "core"."coi"."adhoc_form" is 'evidences FD-03';
comment on column "core"."coi"."attestation_date" is 'evidences FD-03';
comment on column "core"."coi"."attestation_signature" is 'evidences FD-03';
comment on column "core"."coi"."conflict_identified" is 'evidences FD-02, RII-07';
comment on column "core"."coi"."conflicted_matter_voted" is 'evidences FD-02';
comment on column "core"."coi"."determination_made" is 'evidences FD-04';
comment on column "core"."coi"."independent_review" is 'evidences FD-04';
comment on column "core"."coi"."interest_description" is 'evidences FD-02, FD-03';
comment on column "core"."coi"."matter_reference" is 'evidences FD-02, FD-04, RII-07';
comment on column "core"."coi"."questionnaire_responses" is 'evidences FD-03';
comment on column "core"."coi"."questionnaire_version" is 'evidences FD-03, IP-16';
comment on column "core"."coi"."recusal_noticed" is 'evidences FD-02';
comment on column "core"."coi"."recusal_record" is 'evidences FD-04';
comment on column "core"."coi"."related_party" is 'evidences FD-02, FD-03, RII-07';
comment on column "core"."coi"."certification_due" is 'evidences FD-03';
comment on column "core"."coi"."questionnaire_due_at" is 'evidences FD-03, IP-16';
comment on column "core"."coi"."adhoc_disclosure" is 'provisional (derived from event)';
comment on column "core"."coi"."annual_cycle" is 'provisional (derived from event)';
comment on table "core"."coi" is 'A conflict-of-interest disclosure tracked from disclosure through review to determination.';
comment on column "core"."complaint"."category" is 'evidences COL-06, CP-08, FL-13, PR-10';
comment on column "core"."complaint"."final_response_pending" is 'evidences CL-06';
comment on column "core"."complaint"."investigation_notes" is 'evidences COL-06, FL-13';
comment on column "core"."complaint"."member_id" is 'evidences COL-06, CP-08, FL-13, PR-10';
comment on column "core"."complaint"."portal_due_date" is 'evidences MB-04';
comment on column "core"."complaint"."root_cause_tag" is 'evidences COL-06, CP-08, FL-13';
comment on column "core"."complaint"."trend_summary" is 'evidences COL-06, CP-08, FL-13, PR-10';
comment on column "core"."complaint"."udaap_flag" is 'evidences COL-06, CP-08';
comment on column "core"."complaint"."channel" is 'evidences COL-06, FL-13';
comment on column "core"."complaint"."narrative" is 'evidences COL-06, CP-08, FL-13, MB-04, PR-10';
comment on column "core"."complaint"."ack_due_at" is 'evidences COL-06, CP-08, FL-13, MB-04';
comment on column "core"."complaint"."final_response_due_at" is 'evidences COL-06, MB-04';
comment on column "core"."complaint"."initial_response_due_at" is 'evidences COL-06, FL-13';
comment on column "core"."complaint"."resolution_due_at" is 'evidences COL-06';
comment on column "core"."complaint"."trend_review_due" is 'evidences COL-06, CP-08, FL-13';
comment on column "core"."complaint"."direct" is 'provisional (derived from event)';
comment on column "core"."complaint"."privacy" is 'provisional (derived from event)';
comment on column "core"."complaint"."regulator" is 'provisional (derived from event)';
comment on table "core"."complaint" is 'A consumer or member complaint tracked from intake through investigation and resolution.';
comment on column "core"."control_result"."ofac" is 'embedded OfacControlContext';
comment on column "core"."control_result"."subject_ref" is 'evidences BSA-05';
comment on table "core"."control_result" is 'The recorded result of a control execution.';
comment on column "core"."dispute"."basis" is 'evidences COL-07, MB-04';
comment on column "core"."dispute"."category" is 'evidences COL-07, MB-04';
comment on column "core"."dispute"."correction_amount" is 'evidences MB-04';
comment on column "core"."dispute"."findings" is 'evidences COL-07, MB-04';
comment on column "core"."dispute"."idtheft_report" is 'evidences COL-07';
comment on column "core"."dispute"."regulator_case_id" is 'evidences MB-04';
comment on column "core"."dispute"."regulator_routed" is 'evidences MB-04';
comment on column "core"."dispute"."investigation_due_at" is 'evidences MB-04';
comment on column "core"."dispute"."provisional_credit_due_at" is 'evidences MB-04';
comment on column "core"."dispute"."response_due_at" is 'evidences MB-04';
comment on column "core"."dispute"."rege_clock" is 'provisional (derived from event)';
comment on column "core"."dispute"."regulator_response" is 'provisional (derived from event)';
comment on table "core"."dispute" is 'A Regulation E error/dispute tracked from filing through investigation to resolution.';
comment on column "core"."document"."attached" is 'evidences IP-15';
comment on column "core"."document"."curriculum" is 'embedded Curriculum';
comment on column "core"."document"."edd" is 'embedded EddFile';
comment on column "core"."document"."mi" is 'embedded MiCentralLog';
comment on column "core"."document"."policy" is 'embedded PolicyDoc';
comment on column "core"."document"."report" is 'embedded BoardPack';
comment on column "core"."document"."retention_anchor" is 'evidences IP-15';
comment on column "core"."document"."retention_schedule" is 'evidences IP-15';
comment on column "core"."document"."risk" is 'embedded RiskCatalogEntry';
comment on column "core"."document"."subject_ref" is 'evidences IP-15, LN-09, RII-09';
comment on column "core"."document"."type" is 'evidences IP-15, LN-09';
comment on column "core"."document"."vendor" is 'embedded VendorReview';
comment on column "core"."document"."vendor_alert" is 'embedded VendorAlert';
comment on column "core"."document"."attachment_due_at" is 'evidences IP-15, LN-09';
comment on column "core"."document"."required_set" is 'provisional (derived from event)';
comment on table "core"."document" is 'A stored document or artifact.';
comment on column "core"."entity"."address" is 'evidences BSA-03';
comment on column "core"."entity"."address_new" is 'evidences MB-02';
comment on column "core"."entity"."address_previous" is 'evidences MB-02';
comment on column "core"."entity"."date_of_birth" is 'evidences BSA-03';
comment on column "core"."entity"."email" is 'evidences EC-03';
comment on column "core"."entity"."esign_consent" is 'evidences TIS-02';
comment on column "core"."entity"."name" is 'evidences BSA-03';
comment on column "core"."entity"."reg_e_opt_in" is 'evidences TIS-08';
comment on column "core"."entity"."tin" is 'evidences BSA-03';
comment on column "core"."entity"."update" is 'provisional (derived from event)';
comment on table "core"."entity" is 'A legal person or organization (person, business, trust, or joint) that owns accounts.';
comment on column "core"."event"."code" is 'evidences IC-08';
comment on column "core"."event"."resource_id" is 'evidences IC-08';
comment on table "core"."event" is 'An immutable, append-only domain event (Decision 4).';
comment on table "core"."fbo_position" is 'For-Benefit-Of position and balance for an aggregator instance (Decision 19).';
comment on column "core"."filing"."cmir" is 'embedded CmirData';
comment on column "core"."filing"."ctr" is 'embedded CtrData';
comment on column "core"."filing"."fbar" is 'embedded FbarData';
comment on column "core"."filing"."filing_id" is 'FK -> filing; evidences BSA-07';
comment on column "core"."filing"."fincen_314a" is 'embedded Fincen314aData';
comment on column "core"."filing"."ofac" is 'embedded OfacReportData';
comment on column "core"."filing"."sar" is 'embedded SarData';
comment on table "core"."filing" is 'A regulatory filing and its lifecycle (submit→acknowledge).';
comment on column "core"."finding"."closure_evidence" is 'evidences AU-09, BCP-13, CP-07, IC-07';
comment on column "core"."finding"."department" is 'evidences AU-07';
comment on column "core"."finding"."identified" is 'evidences AU-03, AU-06, AU-07';
comment on column "core"."finding"."implementation_date" is 'evidences AU-06, AU-08';
comment on column "core"."finding"."management_response" is 'evidences AU-06, CP-07';
comment on column "core"."finding"."open_report" is 'evidences AU-07, CP-01, TPR-01';
comment on column "core"."finding"."owner" is 'evidences BCP-13, BSA-15, CP-06, EC-05, EC-06';
comment on column "core"."finding"."remediation_evidence" is 'evidences AU-08, AU-09, BSA-15';
comment on column "core"."finding"."remediation_status" is 'evidences AU-07, CP-07';
comment on column "core"."finding"."responsible_party" is 'evidences AU-06, AU-07, AU-08';
comment on column "core"."finding"."risk_acceptance_package" is 'evidences AU-08';
comment on column "core"."finding"."risk_acceptance_rationale" is 'evidences AU-08';
comment on column "core"."finding"."tracked" is 'evidences AU-07';
comment on column "core"."finding"."description" is 'evidences AU-03, AU-05, AU-06, AU-07, BSA-15, CP-06, CP-07';
comment on column "core"."finding"."risk_rating" is 'evidences AU-03, AU-06, AU-07';
comment on column "core"."finding"."root_cause" is 'evidences AU-06, EC-05';
comment on column "core"."finding"."severity" is 'evidences AU-07, CP-06, EC-05, EC-06';
comment on column "core"."finding"."escalation_due_at" is 'evidences AU-07, FL-13, IC-07';
comment on column "core"."finding"."monthly_review_due" is 'evidences AU-07';
comment on column "core"."finding"."quarterly_report_due" is 'evidences AU-07, IC-07';
comment on column "core"."finding"."response_due_at" is 'evidences AU-03, AU-06, AU-07, AU-08, AU-09, BCP-13, CP-06, CP-07, EC-05, EC-06, FL-13';
comment on column "core"."finding"."aging_threshold" is 'provisional (derived from event)';
comment on column "core"."finding"."corrective_action" is 'provisional (derived from event)';
comment on column "core"."finding"."critical" is 'provisional (derived from event)';
comment on table "core"."finding" is 'An audit, examination, or compliance finding tracked through its remediation lifecycle.';
comment on column "core"."handover"."access_scope" is 'evidences RP-07';
comment on column "core"."handover"."appointment_reference" is 'evidences RP-07';
comment on column "core"."handover"."personnel_roster" is 'evidences RP-07';
comment on column "core"."handover"."trustee_access_grant_id" is 'evidences RP-07';
comment on column "core"."handover"."trustee_access_provisioned" is 'evidences RP-07';
comment on column "core"."handover"."trustee_action" is 'evidences RP-07';
comment on column "core"."handover"."trustee_credential_id" is 'evidences RP-07';
comment on column "core"."handover"."trustee_identity" is 'evidences RP-07';
comment on column "core"."handover"."access_expiry_due" is 'evidences RP-07';
comment on column "core"."handover"."full_due_at" is 'evidences RP-07';
comment on column "core"."handover"."initial_due_at" is 'evidences RP-07';
comment on table "core"."handover" is 'A trustee/fiduciary handover tracked from initiation through provisioning to completion.';
comment on column "core"."inbound_payment"."amount" is 'evidences RP-04';
comment on table "core"."inbound_payment" is 'An inbound payment routed to an instance.';
comment on column "core"."incident"."bsa_referral_id" is 'evidences PR-09, TPR-08';
comment on column "core"."incident"."checklist_first_hour" is 'evidences BCP-06';
comment on column "core"."incident"."comms_plan" is 'evidences BCP-05, BCP-06, EC-10';
comment on column "core"."incident"."contained" is 'evidences BCP-13';
comment on column "core"."incident"."containment_timer" is 'evidences BCP-10';
comment on column "core"."incident"."criminal_suspected" is 'evidences PR-09';
comment on column "core"."incident"."data_scope" is 'evidences BCP-10, COL-08, EC-10, IS-09, PR-09';
comment on column "core"."incident"."description" is 'evidences MEM-04';
comment on column "core"."incident"."detection_source" is 'evidences BCP-05, BCP-10, COL-08, EC-10, IS-09, PR-09, TPR-08';
comment on column "core"."incident"."facts" is 'evidences BCP-10';
comment on column "core"."incident"."ic_assignment_timer" is 'evidences BCP-05, BCP-09, IS-09';
comment on column "core"."incident"."impact_summary" is 'evidences BCP-06, COL-08, FL-13, PR-10';
comment on column "core"."incident"."legal_review" is 'evidences EC-10';
comment on column "core"."incident"."member_notice_template" is 'evidences BCP-10, COL-08, EC-10, IS-09, PR-09, TPR-08';
comment on column "core"."incident"."misuse_determined" is 'evidences PR-09';
comment on column "core"."incident"."misuse_likelihood" is 'evidences COL-08, EC-10, IS-09';
comment on column "core"."incident"."notice_content" is 'evidences EC-10, IS-09';
comment on column "core"."incident"."notification_determined" is 'evidences BCP-10';
comment on column "core"."incident"."reportability_assessment" is 'evidences BCP-10';
comment on column "core"."incident"."reportability_determination" is 'evidences BCP-10, COL-08, PR-09, TPR-08';
comment on column "core"."incident"."reportability_rationale" is 'evidences IS-09';
comment on column "core"."incident"."reportable_determined" is 'evidences IS-09';
comment on column "core"."incident"."root_cause" is 'evidences BCP-13';
comment on column "core"."incident"."sar_referred" is 'evidences PR-09';
comment on column "core"."incident"."scope" is 'evidences PR-09';
comment on column "core"."incident"."scope_initial" is 'evidences BCP-06, EC-10, IS-09, TPR-08';
comment on column "core"."incident"."severity" is 'evidences BCP-05, COL-08, EC-10, FL-13, IS-09, PR-09, TPR-08';
comment on column "core"."incident"."summary_id" is 'evidences PR-10';
comment on column "core"."incident"."timeline" is 'evidences BCP-06, BCP-13';
comment on column "core"."incident"."ncua_notice_due_at" is 'evidences BCP-10, COL-08, EC-10, IS-09, PR-09, TPR-08';
comment on column "core"."incident"."notification_due_at" is 'evidences BCP-10, COL-08, IS-09, PR-09';
comment on column "core"."incident"."triage_due_at" is 'evidences BCP-05, COL-08, EC-10, IS-09, PR-09';
comment on column "core"."incident"."regulator_notification_due" is 'evidences BCP-11';
comment on column "core"."incident"."collections" is 'provisional (derived from event)';
comment on column "core"."incident"."material" is 'provisional (derived from event)';
comment on column "core"."incident"."member_impact" is 'provisional (derived from event)';
comment on column "core"."incident"."member_notices" is 'provisional (derived from event)';
comment on column "core"."incident"."security" is 'provisional (derived from event)';
comment on table "core"."incident" is 'An operational or security incident and its response.';
comment on column "core"."indemnification"."advance.disbursed" is 'evidences RII-05';
comment on column "core"."indemnification"."advance.requested" is 'evidences RII-05';
comment on column "core"."indemnification"."advance_balance" is 'evidences RII-05';
comment on column "core"."indemnification"."claim.notified" is 'evidences RII-08';
comment on column "core"."indemnification"."conduct_record" is 'evidences RII-03, RII-04, RII-06';
comment on column "core"."indemnification"."counsel_opinion" is 'evidences RII-04, RII-07';
comment on column "core"."indemnification"."decision_body" is 'evidences RII-04';
comment on column "core"."indemnification"."decision_body.selected" is 'evidences RII-07';
comment on column "core"."indemnification"."defense_budget" is 'evidences RII-05';
comment on column "core"."indemnification"."defense_invoice" is 'evidences RII-05';
comment on column "core"."indemnification"."disposition_record" is 'evidences RII-03, RII-04, RII-05';
comment on column "core"."indemnification"."enforcement_status" is 'evidences RII-06';
comment on column "core"."indemnification"."expense_statement" is 'evidences RII-03';
comment on column "core"."indemnification"."federal_screen_result" is 'evidences RII-03, RII-04, RII-05, RII-06';
comment on column "core"."indemnification"."liability_terms" is 'evidences RII-03, RII-04, RII-06, RII-08';
comment on column "core"."indemnification"."matter.resolved_favorably" is 'evidences RII-03';
comment on column "core"."indemnification"."payment.blocked" is 'evidences RII-04, RII-06';
comment on column "core"."indemnification"."payment.disbursed" is 'evidences RII-03, RII-04';
comment on column "core"."indemnification"."recusal_record" is 'evidences RII-07';
comment on column "core"."indemnification"."repayment.demanded" is 'evidences RII-05';
comment on column "core"."indemnification"."request" is 'evidences RII-03';
comment on column "core"."indemnification"."request.routed" is 'evidences RII-04, RII-07';
comment on column "core"."indemnification"."standard_determination.made" is 'evidences RII-04, RII-05';
comment on column "core"."indemnification"."undertaking" is 'evidences RII-05';
comment on column "core"."indemnification"."legal_review" is 'evidences RII-06';
comment on column "core"."indemnification"."advance_due_at" is 'evidences RII-05';
comment on column "core"."indemnification"."determination_due_at" is 'evidences RII-03, RII-04, RII-07';
comment on column "core"."indemnification"."payment_due_at" is 'evidences RII-03, RII-04, RII-05, RII-06';
comment on table "core"."indemnification" is 'An indemnification request tracked from filing through determination to payment.';
comment on column "core"."insider"."aggregate_credit_amount" is 'evidences FD-05, LN-14';
comment on column "core"."insider"."collateral_marketability" is 'evidences FD-05';
comment on column "core"."insider"."comparable_terms" is 'evidences FD-05, LN-14';
comment on column "core"."insider"."correspondent_credit_data" is 'evidences FD-09';
comment on column "core"."insider"."credit_extended" is 'evidences FD-05';
comment on column "core"."insider"."credit_threshold_exceeded" is 'evidences FD-05';
comment on column "core"."insider"."funded_terms" is 'evidences FD-05, LN-14';
comment on column "core"."insider"."limits_recomputed" is 'evidences FD-05';
comment on column "core"."insider"."officer_financial_statement" is 'evidences FD-05';
comment on column "core"."insider"."proposed_terms" is 'evidences FD-05, LN-14';
comment on column "core"."insider"."public_request" is 'evidences FD-09';
comment on column "core"."insider"."record_circulated" is 'evidences FD-03';
comment on column "core"."insider"."record_compiled" is 'evidences FD-05';
comment on column "core"."insider"."record_entry" is 'evidences FD-03, LN-14';
comment on column "core"."insider"."record_prior" is 'evidences FD-03';
comment on column "core"."insider"."loc_approval_expires_at" is 'evidences FD-05';
comment on column "core"."insider"."public_request_retention_expires_at" is 'evidences FD-09';
comment on column "core"."insider"."report_due" is 'evidences FD-05';
comment on column "core"."insider"."board_approval" is 'provisional (derived from event)';
comment on column "core"."insider"."board_report" is 'provisional (derived from event)';
comment on column "core"."insider"."credit_application" is 'provisional (derived from event)';
comment on column "core"."insider"."public_disclosure" is 'provisional (derived from event)';
comment on column "core"."insider"."terms_parity" is 'provisional (derived from event)';
comment on table "core"."insider" is 'A Regulation O insider-credit request tracked through board review to approval or denial.';
comment on column "core"."legal_hold"."hold_scope" is 'evidences IS-18, PR-08, RR-07';
comment on column "core"."legal_hold"."matter_id" is 'evidences RR-07';
comment on column "core"."legal_hold"."matter_ref" is 'evidences IS-18';
comment on column "core"."legal_hold"."release_approved_by" is 'evidences IS-18, RR-07';
comment on column "core"."legal_hold"."schedule_resumed" is 'evidences IS-18';
comment on column "core"."legal_hold"."clear" is 'provisional (derived from event)';
comment on table "core"."legal_hold" is 'A legal hold on records, with release handling.';
comment on column "core"."loan"."accrued_interest" is 'evidences COL-09';
comment on column "core"."loan"."action_basis" is 'evidences LD-07';
comment on column "core"."loan"."balance" is 'evidences COL-03';
comment on column "core"."loan"."bankruptcy_case_id" is 'evidences COL-03';
comment on column "core"."loan"."chargeoff_due_closed_end" is 'evidences CL-03';
comment on column "core"."loan"."chargeoff_due_open_end" is 'evidences CL-03';
comment on column "core"."loan"."chargeoff_month_end_at" is 'evidences COL-03';
comment on column "core"."loan"."classified_substandard" is 'evidences COL-09';
comment on column "core"."loan"."collateral_value" is 'evidences COL-03';
comment on column "core"."loan"."collectibility_assessment" is 'evidences COL-02, COL-09';
comment on column "core"."loan"."death_loss_estimable" is 'evidences CL-03';
comment on column "core"."loan"."dpd" is 'evidences CL-01, CL-02, CL-03, CL-09';
comment on column "core"."loan"."dpd_reset" is 'evidences COL-04';
comment on column "core"."loan"."dpd_reset_eligibility_check" is 'evidences COL-04';
comment on column "core"."loan"."estate_claim_status" is 'evidences CL-03';
comment on column "core"."loan"."estimated_recovery" is 'evidences COL-09';
comment on column "core"."loan"."foreclosure_impact_eval" is 'evidences COL-09';
comment on column "core"."loan"."funding_block_state" is 'evidences LN-11';
comment on column "core"."loan"."grace_period_days" is 'evidences COL-02';
comment on column "core"."loan"."io_term_months" is 'evidences COL-04';
comment on column "core"."loan"."last_payment_date" is 'evidences COL-02';
comment on column "core"."loan"."ltv" is 'evidences COL-03, LN-06';
comment on column "core"."loan"."modified_schedule" is 'evidences COL-04';
comment on column "core"."loan"."nonaccrual_placed" is 'evidences COL-01';
comment on column "core"."loan"."past_due_amount" is 'evidences COL-02';
comment on column "core"."loan"."product_type" is 'evidences COL-02, COL-03';
comment on column "core"."loan"."proposed_modification" is 'evidences COL-04';
comment on column "core"."loan"."repayment_evidence" is 'evidences COL-03, COL-04, COL-09';
comment on column "core"."loan"."risk_rating" is 'evidences COL-01, COL-04, COL-09';
comment on column "core"."loan"."well_secured_documented" is 'evidences COL-03';
comment on column "core"."loan"."workout_alternatives" is 'evidences COL-02';
comment on column "core"."loan"."bankruptcy_chargeoff_due_at" is 'evidences COL-03';
comment on column "core"."loan"."classification_due_at" is 'evidences COL-03';
comment on column "core"."loan"."courtesy_notice_due_at" is 'evidences COL-02';
comment on column "core"."loan"."days_past_due" is 'evidences COL-01, COL-02, COL-03, COL-09';
comment on column "core"."loan"."fraud_chargeoff_due_at" is 'evidences COL-03';
comment on column "core"."loan"."nonaccrual_due_at" is 'evidences COL-09';
comment on column "core"."loan"."rating_review_due_at" is 'evidences COL-09';
comment on column "core"."loan"."re_valuation_due" is 'evidences COL-03';
comment on column "core"."loan"."right_to_cure_due_at" is 'evidences COL-02';
comment on column "core"."loan"."second_reminder_due_at" is 'evidences COL-02';
comment on column "core"."loan"."status_memo_due_at" is 'evidences COL-02';
comment on column "core"."loan"."accrual" is 'provisional (derived from event)';
comment on column "core"."loan"."bankruptcy_notice" is 'provisional (derived from event)';
comment on column "core"."loan"."io_capitalization" is 'provisional (derived from event)';
comment on column "core"."loan"."modified_payment_3" is 'provisional (derived from event)';
comment on column "core"."loan"."re_writedown" is 'provisional (derived from event)';
comment on column "core"."loan"."status" is 'synthesized from x-states (no status property in spec)';
comment on table "core"."loan" is 'A booked loan on the ledger.';
comment on column "core"."loan_application"."action_basis" is 'evidences FL-05, LN-03, LN-07';
comment on column "core"."loan_application"."applicant" is 'embedded Applicant; evidences FL-05';
comment on column "core"."loan_application"."atr_qm_result" is 'evidences LN-05';
comment on column "core"."loan_application"."channel" is 'evidences LD-13';
comment on column "core"."loan_application"."counteroffer_status" is 'evidences FL-05, LN-07';
comment on column "core"."loan_application"."counteroffer_terms" is 'evidences FL-05, LN-07';
comment on column "core"."loan_application"."credit_structure" is 'evidences LN-03';
comment on column "core"."loan_application"."data" is 'evidences LN-03, LN-04';
comment on column "core"."loan_application"."decision" is 'embedded Decision; evidences LN-03, LN-07';
comment on column "core"."loan_application"."decision_block_state" is 'evidences LN-14';
comment on column "core"."loan_application"."doc_block_state" is 'evidences LN-05';
comment on column "core"."loan_application"."dti" is 'evidences LN-03, LN-05';
comment on column "core"."loan_application"."employment" is 'evidences LD-05';
comment on column "core"."loan_application"."final_action" is 'evidences LN-03';
comment on column "core"."loan_application"."geography" is 'evidences FL-06';
comment on column "core"."loan_application"."gmi" is 'evidences FL-02, LN-13';
comment on column "core"."loan_application"."income_assets" is 'evidences LN-03';
comment on column "core"."loan_application"."incomplete_aged" is 'evidences FL-05, LN-03';
comment on column "core"."loan_application"."option_shortfall_reason" is 'evidences FL-08';
comment on column "core"."loan_application"."oral_statement" is 'evidences FL-05, LN-07';
comment on column "core"."loan_application"."parties" is 'embedded LoanParty (array); evidences LN-14';
comment on column "core"."loan_application"."prequal" is 'embedded Prequal';
comment on column "core"."loan_application"."product_code" is 'evidences LN-02';
comment on column "core"."loan_application"."product_type" is 'evidences FL-02, LN-02';
comment on column "core"."loan_application"."requested_terms" is 'evidences FL-08';
comment on column "core"."loan_application"."aan_due_at" is 'evidences FL-05, LN-07';
comment on column "core"."loan_application"."counteroffer_aan_due_at" is 'evidences FL-05, LN-07';
comment on column "core"."loan_application"."decision_due_at" is 'evidences LN-03';
comment on column "core"."loan_application"."adverse_action" is 'provisional (derived from event)';
comment on column "core"."loan_application"."decisioned" is 'provisional (derived from event)';
comment on column "core"."loan_application"."docs" is 'provisional (derived from event)';
comment on column "core"."loan_application"."incompleteness_notice" is 'provisional (derived from event)';
comment on column "core"."loan_application"."insider" is 'provisional (derived from event)';
comment on column "core"."loan_application"."thin_file" is 'provisional (derived from event)';
comment on column "core"."loan_application"."status" is 'synthesized from x-states (no status property in spec)';
comment on table "core"."loan_application" is 'A credit application and its decisioning.';
comment on column "core"."originator"."name" is 'evidences BSA-10';
comment on column "core"."originator"."routing_number" is 'evidences BSA-10';
comment on table "core"."originator" is 'The sending party of a transfer.';
comment on table "core"."provider_result" is 'A result returned by an external provider or vendor.';
comment on column "core"."records_package"."artifact_id" is 'evidences RP-08';
comment on column "core"."records_package"."checksum_chain" is 'evidences IC-08, RP-08';
comment on column "core"."records_package"."failure_reason" is 'evidences RP-08';
comment on column "core"."records_package"."manifest_id" is 'evidences RP-08';
comment on column "core"."records_package"."rebuilt" is 'evidences RP-08';
comment on column "core"."records_package"."snapshot_as_of" is 'evidences RP-08';
comment on column "core"."records_package"."snapshot_id" is 'evidences RP-08';
comment on column "core"."records_package"."snapshot_schedule" is 'evidences RP-08';
comment on column "core"."records_package"."complete_due_at" is 'evidences RP-08';
comment on column "core"."records_package"."snapshot_due" is 'evidences RP-08';
comment on column "core"."records_package"."start_due_at" is 'evidences RP-08';
comment on table "core"."records_package" is 'A records-production package tracked from request through assembly to completion.';
comment on column "core"."risk"."owner_id" is 'evidences BSA-02, BSA-06, ERM-04, ERM-07, IC-07';
comment on column "core"."risk"."assessment_results" is 'evidences AU-04, CP-04, TPR-03';
comment on column "core"."risk"."impact_score" is 'evidences BSA-02, ERM-03, IS-02';
comment on column "core"."risk"."inherent_rating" is 'evidences ERM-03, ERM-04';
comment on column "core"."risk"."last_assessed_at" is 'evidences ERM-04';
comment on column "core"."risk"."likelihood_score" is 'evidences BSA-02, ERM-03, IS-02';
comment on column "core"."risk"."poam_status" is 'evidences IS-02';
comment on column "core"."risk"."register_snapshot" is 'evidences ERM-08';
comment on column "core"."risk"."remediation_evidence" is 'evidences IS-02';
comment on column "core"."risk"."residual_rating" is 'evidences BSA-02, EC-01, ERM-03, ERM-04, IS-02';
comment on column "core"."risk"."review_overdue" is 'evidences ERM-04, IS-02';
comment on column "core"."risk"."threat_catalog" is 'evidences BCP-02, IS-02';
comment on column "core"."risk"."candidate_profile" is 'evidences CP-04, EC-01, IS-02, TPR-03';
comment on column "core"."risk"."description" is 'evidences BSA-02, ERM-04';
comment on column "core"."risk"."geography_factors" is 'evidences BCP-02, TPR-03';
comment on column "core"."risk"."inherent_score" is 'evidences BSA-02, CP-04, EC-01, TPR-03';
comment on column "core"."risk"."partner_dependency" is 'evidences TPR-03';
comment on column "core"."risk"."assessment_due_at" is 'evidences BSA-02';
comment on column "core"."risk"."assessment_timer" is 'evidences IS-02';
comment on column "core"."risk"."product_assessment_due_at" is 'evidences IS-02';
comment on column "core"."risk"."reassessment_due_at" is 'evidences BSA-02, ERM-04, IS-02';
comment on table "core"."risk" is 'A risk-register entry tracked through assessment into ongoing monitoring (remediation is a sub-process).';
comment on column "core"."task"."retention" is 'embedded RetentionSpec';
comment on column "core"."task"."training" is 'embedded TrainingDetail';
comment on column "core"."task"."type" is 'evidences LP-14';
comment on table "core"."task" is 'A unit of compliance or operational work. `type` is the generic verb; `subject` carries the domain.';
comment on column "core"."trade"."blocked_prohibited" is 'evidences IP-03';
comment on column "core"."trade"."checklist_exception_raised" is 'evidences IP-11';
comment on column "core"."trade"."entered" is 'evidences IP-05, IP-08';
comment on column "core"."trade"."intermediary_blocked" is 'evidences IP-08';
comment on column "core"."trade"."intermediary_id" is 'evidences IP-08';
comment on column "core"."trade"."limit_blocked" is 'evidences IP-07';
comment on column "core"."trade"."pretrade_checklist" is 'evidences IP-11';
comment on column "core"."trade"."settlement_amount" is 'evidences IP-14';
comment on column "core"."trade"."settlement_date" is 'evidences IP-14';
comment on column "core"."trade"."sod_blocked" is 'evidences IP-14';
comment on column "core"."trade"."step_attempted" is 'evidences IP-14';
comment on column "core"."trade"."ticket" is 'evidences IP-02, IP-14';
comment on column "core"."trade"."valuation_support" is 'evidences IP-11';
comment on column "core"."trade"."reconciliation_due_at" is 'evidences IP-14';
comment on column "core"."trade"."instrument_type" is 'evidences IP-03';
comment on column "core"."trade"."approval" is 'provisional (derived from event)';
comment on column "core"."trade"."confirmation_discrepancy" is 'provisional (derived from event)';
comment on column "core"."trade"."limit_warning" is 'provisional (derived from event)';
comment on column "core"."trade"."permissibility" is 'provisional (derived from event)';
comment on table "core"."trade" is 'An investment trade tracked from entry through confirmation to settlement.';
comment on column "core"."training"."assessment_score" is 'evidences CC-11, CP-05';
comment on column "core"."training"."assignee_id" is 'evidences CAP-08, CC-11, CP-05, EC-08, EC-12, IP-16, PR-06, RR-09, TIS-10';
comment on column "core"."training"."completion_status" is 'evidences CP-05, EC-12, IP-16, RR-09';
comment on column "core"."training"."content_version" is 'evidences BSA-14, CAP-08, CC-11, CP-05, FL-11, IS-17, TIS-10';
comment on column "core"."training"."coverage_pct" is 'evidences CP-01, CP-05';
comment on column "core"."training"."curriculum_id" is 'evidences CAP-08, FD-10, PR-06';
comment on column "core"."training"."curriculum_map" is 'evidences EC-12';
comment on column "core"."training"."lapsed" is 'evidences CC-11, CP-05, EC-12, RR-09';
comment on column "core"."training"."module_id" is 'evidences RR-09';
comment on column "core"."training"."proficiency.failed" is 'evidences CC-11, CP-05';
comment on column "core"."training"."refresher_curriculum" is 'evidences CP-05, EC-12';
comment on column "core"."training"."required_curriculum" is 'evidences BSA-14, CC-11, CP-05, EC-08, IS-17, RR-09';
comment on column "core"."training"."role_matrix" is 'evidences EC-12, FL-11';
comment on column "core"."training"."skills_inventory" is 'evidences EC-12';
comment on column "core"."training"."change_summary" is 'evidences FL-11';
comment on column "core"."training"."hire_date" is 'evidences BSA-14, CC-11, CP-05, FL-11, IS-17';
comment on column "core"."training"."role_curriculum" is 'evidences BSA-14, CC-11, CP-05, CP-08, FL-11, IP-16, IS-17, TIS-10';
comment on column "core"."training"."annual_due" is 'evidences EC-08, EC-12';
comment on column "core"."training"."annual_due_at" is 'evidences BSA-14, CAP-08, CC-11, CP-05, FD-10, FL-11, IP-16, IS-17, TIS-10';
comment on column "core"."training"."annual_timer" is 'evidences BSA-19';
comment on column "core"."training"."completion_due_at" is 'evidences CP-05, EC-12, IP-16, RR-09';
comment on column "core"."training"."new_hire_timer" is 'evidences BSA-19';
comment on column "core"."training"."newhire_due_at" is 'evidences BSA-14, CC-11, IS-17';
comment on column "core"."training"."onboarding_due_at" is 'evidences CP-05, FL-11, IP-16, PR-06';
comment on column "core"."training"."privacy_due" is 'evidences PR-06';
comment on column "core"."training"."retention_due_at" is 'evidences RR-09';
comment on column "core"."training"."board_curriculum" is 'evidences BSA-14';
comment on column "core"."training"."annual_cycle" is 'provisional (derived from event)';
comment on column "core"."training"."assignment" is 'provisional (derived from event)';
comment on column "core"."training"."capital" is 'provisional (derived from event)';
comment on column "core"."training"."content_trigger" is 'provisional (derived from event)';
comment on column "core"."training"."refresh" is 'provisional (derived from event)';
comment on column "core"."training"."remedial" is 'provisional (derived from event)';
comment on column "core"."training"."session" is 'provisional (derived from event)';
comment on table "core"."training" is 'A training assignment tracked from assignment through completion, with lapse on overdue cycles.';
comment on column "core"."transfer"."beneficiary" is 'embedded Party';
comment on column "core"."transfer"."counterparty" is 'embedded Party';
comment on column "core"."transfer"."originator" is 'embedded Party';
comment on table "core"."transfer" is 'An on-us book transfer between internal accounts (Decision 8). External rails use AchTransfer / WireTransfer.';
comment on column "core"."user"."employment_status" is 'evidences IC-05, IS-06, PR-06';
comment on column "core"."user"."role" is 'evidences CP-03, IS-06, IS-15';
comment on table "core"."user" is 'An operator or staff user of the system.';
comment on column "core"."verification"."alt_path_available" is 'evidences PR-16';
comment on column "core"."verification"."biometric_consent_id" is 'evidences PR-16';
comment on column "core"."verification"."biometric_declined" is 'evidences PR-16';
comment on column "core"."verification"."biometric_purged" is 'evidences PR-16';
comment on column "core"."verification"."cdd" is 'embedded CddProfile';
comment on column "core"."verification"."match_status" is 'evidences BSA-03, EC-03';
comment on column "core"."verification"."pep" is 'embedded PepStatus';
comment on column "core"."verification"."provider" is 'evidences PR-16';
comment on column "core"."verification"."provider_result" is 'evidences BSA-03';
comment on column "core"."verification"."status" is 'evidences BSA-03, MB-01';
comment on column "core"."verification"."trust_level" is 'evidences BSA-03';
comment on column "core"."verification"."biometric_purge_due_at" is 'evidences PR-16';
comment on table "core"."verification" is 'An identity / KYC verification record.';
comment on column "core"."wire_transfer"."amount" is 'evidences BSA-10';
comment on column "core"."wire_transfer"."beneficiary" is 'embedded Beneficiary; evidences BSA-10';
comment on column "core"."wire_transfer"."control_results" is 'evidences BSA-10';
comment on column "core"."wire_transfer"."imad" is 'evidences BSA-10';
comment on column "core"."wire_transfer"."purpose" is 'evidences BSA-10';
comment on table "core"."wire_transfer" is 'A domestic wire transfer. Lifecycle pending_approval→submitted→completed, with return-request handling.';
