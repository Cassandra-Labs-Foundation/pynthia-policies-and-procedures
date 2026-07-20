-- The tail: EPS-01/03/06/10, IS-03/10/19, CP-08/09, DF-06/09, IC-02/04.
--
-- ⚑ ALMOST ALL EXTENSION. Thirteen controls across five policies, and after
-- reading exists_check properly this time, nine of them attach to subsystems
-- that already exist: `eps.ts` (payment_approval, client_limit, control_result),
-- `capital.ts` (capital_target, contingency memos), `lending_underwriting.ts`
-- (insider, insider_loan_review), `cash_ops.ts` (cash_reconciliation),
-- `incidents.ts` (pir). That ratio is the real state of the codebase at the end
-- of this exercise, and it is why §5i earned a script.
--
-- ⚑ IC-02 IS THE LAST NEW SHAPE: SEPARATION OF DUTIES IS A PAIR CONSTRAINT.
--
-- Every other control here asks about one object. SoD asks about a RELATION —
-- not "may this person do X" but "may this person do X GIVEN they can already
-- do Y". That cannot live on a role row, because the conflict is a property of
-- the pair. So `sod_rule` holds pairs, and the check runs at GRANT time and
-- BLOCKS, rather than being detected by a quarterly review that finds the
-- conflict has been live for three months.
--
-- The compensating control is the part people get wrong: a conflict that cannot
-- be avoided is accepted WITH a compensating control, and the acceptance is a
-- decision with an owner and an expiry — not a permanent exception created by
-- someone who has since left.

-- ------------------------------------------------------------------- IC-02
create table if not exists "core"."sod_rule" (
  "id" text primary key,
  "sod_matrix_version" int not null,
  "role_a" text not null,
  "role_b" text not null,
  "sod_conflict" text not null,
  "sod_risk_rationale" text not null,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- a role does not conflict with itself, and a rule saying so would block
  -- every grant
  constraint "ck_sod_distinct_roles" check ("role_a" <> "role_b")
);

create table if not exists "core"."access_role_grant" (
  "id" text primary key,
  "subject_ref" text not null,
  "access_role_id" text not null,
  "access_role_entitlements" jsonb not null default '[]'::jsonb,
  "granted_at" timestamptz,
  "blocked_at" timestamptz,
  "sod_check_result" text not null check ("sod_check_result" in ('clear', 'conflict')),
  "sod_conflict_with" text,
  -- an accepted conflict needs a compensating control, an approver AND an
  -- expiry. A permanent exception created by someone who has since left is the
  -- failure mode this column exists for.
  "sod_compensating_control" text,
  "compensating_approved_by" text,
  "compensating_expires_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- granted-with-conflict requires the full acceptance package
  constraint "ck_sod_grant_blocked_or_compensated"
    check ("sod_check_result" = 'clear'
           or "granted_at" is null
           or ("sod_compensating_control" is not null
               and "compensating_approved_by" is not null
               and "compensating_expires_at" is not null)),
  -- a conflict names what it conflicts with, or nobody can review it
  constraint "ck_sod_conflict_named"
    check ("sod_check_result" = 'clear' or "sod_conflict_with" is not null)
);

-- ------------------------------------------------------------------- IC-04
create table if not exists "core"."recon_item" (
  "id" text primary key,
  "recon_ref" text not null,
  "cadence" text not null check ("cadence" in ('daily', 'monthly')),
  "gl_balances" jsonb not null,
  "gl_trial_balance" jsonb,
  "variance_cents" bigint not null,
  "recon_item_owner" text not null,
  "recon_item_age_days" int not null default 0,
  "recon_research_notes" text,
  "escalated_at" timestamptz,
  "resolved_at" timestamptz,
  "resolution" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- IC-04's real control is AGE. A variance is not a problem on day one; a
  -- variance nobody has closed in thirty days is a different fact, and only the
  -- age column distinguishes them.
  constraint "ck_recon_resolution_stated"
    check ("resolved_at" is null or "resolution" is not null),
  constraint "ck_recon_escalation_researched"
    check ("escalated_at" is null or "recon_research_notes" is not null)
);

-- ------------------------------------------------------------------- IS-03
create table if not exists "core"."it_asset" (
  "id" text primary key,
  "asset_owner" text not null,
  "asset_classification" text not null check ("asset_classification" in
    ('public', 'internal', 'confidential', 'restricted')),
  "asset_media_type" text not null,
  "asset_attributes" jsonb not null default '{}'::jsonb,
  "asset_cmdb_snapshot" jsonb,
  "attested_at" timestamptz,
  "attested_by" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  -- IS-03 is an ownership control, not an inventory one. An asset with no
  -- named owner has nobody to attest to it, and an unattested asset is one
  -- nobody has confirmed still exists or still matters.
  constraint "ck_asset_attestation_owned"
    check ("attested_at" is null or "attested_by" is not null)
);

-- ------------------------------------------------------------------- EPS
create table if not exists "core"."eps_proposal" (
  "id" text primary key,
  "eps_service_id" text not null,
  "eps_proposal_sponsor" text not null,
  "eps_proposal_study_doc" text,
  "eps_proposal_design_docs" jsonb not null default '[]'::jsonb,
  "risk_inherent_score" int,
  "eps_risk_assessment_delta" jsonb,
  "product_risk_analysis_at" timestamptz,
  "erm_review_decision" text check ("erm_review_decision" in ('approved', 'rejected')),
  "erm_reviewed_by" text,
  "activated_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- a new payment service activated before ERM reviewed it is the whole reason
  -- EPS-01 exists; the gate is the activation, not the paperwork
  constraint "ck_eps_activation_after_erm"
    check ("activated_at" is null or "erm_review_decision" = 'approved'),
  constraint "ck_eps_erm_decision_owned"
    check ("erm_review_decision" is null or "erm_reviewed_by" is not null),
  -- ERM cannot review what was never analysed
  constraint "ck_eps_erm_after_analysis"
    check ("erm_review_decision" is null or "product_risk_analysis_at" is not null)
);

create table if not exists "core"."eps_control_review" (
  "id" text primary key,
  "eps_service_id" text not null,
  "eps_control_review_checklist" jsonb not null,
  "eps_control_review_prior_findings" jsonb not null default '[]'::jsonb,
  "eps_control_review_deficiency_found" boolean not null,
  "eps_deficiency_description" text,
  "eps_deficiency_rating" text check ("eps_deficiency_rating" in ('low', 'medium', 'high')),
  "review_due_at" timestamptz not null,
  "opened_at" timestamptz not null,
  "completed_at" timestamptz,
  "remediation_due_at" timestamptz,
  "remediation_opened_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- a deficiency with no description and no rating cannot be prioritised, and
  -- an unprioritised deficiency is one that never gets scheduled
  constraint "ck_eps_deficiency_described"
    check (not "eps_control_review_deficiency_found"
           or ("eps_deficiency_description" is not null
               and "eps_deficiency_rating" is not null)),
  -- and a found deficiency opens remediation; a review that finds and does
  -- nothing is a review that documented the problem for the next reviewer
  constraint "ck_eps_deficiency_remediated"
    check (not "eps_control_review_deficiency_found"
           or "completed_at" is null
           or "remediation_due_at" is not null)
);

create table if not exists "core"."eps_deployment" (
  "id" text primary key,
  "eps_service_id" text not null,
  "eps_test_plan" text,
  "eps_test_interop_scope" jsonb not null default '{}'::jsonb,
  "eps_vendor_test_participation" boolean not null default false,
  "eps_test_results" jsonb,
  "eps_test_defects" jsonb not null default '[]'::jsonb,
  "eps_test_risk_acceptance" text,
  "eps_change_rollback_plan" text,
  "eps_change_exception_approval" text,
  "emergency_exception" boolean not null default false,
  "scheduled_at" timestamptz not null,
  "retro_due_at" timestamptz,
  "retro_completed_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- EPS-10: a deployment with no rollback plan is a deployment that cannot be
  -- undone, and an emergency exception is exactly when that matters most —
  -- so the emergency path needs MORE, not less
  constraint "ck_eps_deploy_rollback"
    check ("eps_change_rollback_plan" is not null),
  constraint "ck_eps_emergency_approved"
    check (not "emergency_exception" or "eps_change_exception_approval" is not null),
  -- known defects shipped anyway is a decision somebody has to own
  constraint "ck_eps_defects_accepted"
    check ("eps_test_defects" = '[]'::jsonb or "eps_test_risk_acceptance" is not null)
);

-- ------------------------------------------------------------------- DF-06
create table if not exists "core"."affiliate" (
  "id" text primary key,
  "affiliate_list_entry" text not null,
  "relationship" text not null,
  "list_updated_at" timestamptz not null,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

create table if not exists "core"."affiliate_transaction" (
  "id" text primary key,
  "affiliate_id" text not null references "core"."affiliate" ("id"),
  "affiliate_transaction_type" text not null,
  "affiliate_transaction_amount_cents" bigint not null,
  "cu_unimpaired_capital_surplus_cents" bigint not null,
  "affiliate_limit_utilization_bp" int not null,
  "affiliate_collateral_type" text,
  "affiliate_collateral_value_cents" bigint,
  "affiliate_required_coverage_ratio_bp" int,
  "affiliate_market_terms_basis" text,
  "affiliate_asset_quality_classification" text,
  "affiliate_independent_evaluation" text,
  "limits_checked_at" timestamptz not null,
  "lqa_screen_at" timestamptz,
  "within_limits" boolean not null,
  "funded_at" timestamptz,
  "file_archived_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- Regulation W in shape: a covered credit transaction with an affiliate must
  -- be collateralised, and funding one over the limit is the violation itself
  constraint "ck_affiliate_no_funding_over_limit"
    check ("funded_at" is null or "within_limits"),
  -- a low-quality-asset screen is required before funding; unscreened is not
  -- the same as screened-and-clean
  constraint "ck_affiliate_funding_screened"
    check ("funded_at" is null or "lqa_screen_at" is not null)
);

create index if not exists "ix_recon_open" on "core"."recon_item" ("resolved_at", "recon_item_age_days" desc);
create index if not exists "ix_sod_conflicts" on "core"."access_role_grant" ("sod_check_result");
create index if not exists "ix_asset_unattested" on "core"."it_asset" ("attested_at");

create schema if not exists "sim";
create table if not exists "sim"."sod_rule" (like "core"."sod_rule" including all);
create table if not exists "sim"."access_role_grant" (like "core"."access_role_grant" including all);
create table if not exists "sim"."recon_item" (like "core"."recon_item" including all);
create table if not exists "sim"."it_asset" (like "core"."it_asset" including all);
create table if not exists "sim"."eps_proposal" (like "core"."eps_proposal" including all);
create table if not exists "sim"."eps_control_review" (like "core"."eps_control_review" including all);
create table if not exists "sim"."eps_deployment" (like "core"."eps_deployment" including all);
create table if not exists "sim"."affiliate" (like "core"."affiliate" including all);
create table if not exists "sim"."affiliate_transaction" (like "core"."affiliate_transaction" including all);

-- ⚑ CP-08/CP-09 AND THE EVENT-WITHOUT-STATE SMELL, ONE LAST TIME.
--
-- `capital.ts` already emits `capital.contingency_action.executed`,
-- `capital.action.proposed` and `capital.action.executed` — all three with an
-- EMPTY PAYLOAD, because there was no action record to put in them. That is the
-- same smell the earlier sweep found on `loan.dpd_reset`: a verb with no noun.
-- An examiner asking "which action, for how much, approved by whom" gets an
-- event that says an action happened.
--
-- So the register exists now and the events carry its id.
create table if not exists "core"."capital_action" (
  "id" text primary key,
  "position_id" text not null,
  "capital_contingency_action_id" text not null,
  "capital_action_analysis_id" text,
  "capital_action_type" text not null check ("capital_action_type" in
    ('retained_earnings', 'subordinated_debt', 'asset_sale', 'distribution',
     'growth_restriction', 'secondary_capital')),
  "capital_action_amount_cents" bigint not null,
  "capital_expected_capital_impact_cents" bigint not null,
  "capital_projected_shortfall_cents" bigint,
  "capital_projection_below_target" boolean,
  "capital_projection_below_well_capitalized" boolean,
  "capital_subordinated_debt_cents" bigint,
  "capital_instrument_terms" jsonb,
  "capital_eligible_retained_income_cents" bigint,
  "capital_proposed_distribution_amount_cents" bigint,
  "capital_distribution_restriction" boolean not null default false,
  -- CP-09: some capital actions require the regulator's blessing BEFORE they
  -- happen. An executed action whose preapproval is still pending is the
  -- violation, not a paperwork lag.
  "capital_regulatory_preapproval_id" text,
  "capital_regulatory_preapproval_status" text check
    ("capital_regulatory_preapproval_status" in ('not_required', 'pending', 'granted', 'denied')),
  "capital_board_resolution_id" text,
  "proposed_at" timestamptz not null,
  "board_decided_at" timestamptz,
  "executed_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  constraint "ck_capaction_board_before_execution"
    check ("executed_at" is null or "capital_board_resolution_id" is not null),
  -- the one that matters: never execute ahead of the regulator
  constraint "ck_capaction_preapproval_before_execution"
    check ("executed_at" is null
           or "capital_regulatory_preapproval_status" in ('not_required', 'granted')),
  -- and a distribution while distributions are restricted is the thing the
  -- restriction is for
  constraint "ck_capaction_no_restricted_distribution"
    check ("executed_at" is null
           or "capital_action_type" <> 'distribution'
           or not "capital_distribution_restriction")
);

create table if not exists "sim"."capital_action" (like "core"."capital_action" including all);

-- DF-09: an insider public-request disclosure has its own retention clock.
alter table "core"."insider"
  add column if not exists "insider_correspondent_credit_data" jsonb,
  add column if not exists "public_request_at" timestamptz,
  add column if not exists "public_disclosure_issued_at" timestamptz,
  add column if not exists "public_request_retention_expires_at" timestamptz;

-- IS-10: a red-flag case is DISPOSED, and the disposal feeds the ruleset.
create table if not exists "core"."redflag_case" (
  "id" text primary key,
  "account_id" text,
  "redflag_type" text not null,
  "redflag_address_reissue_match" boolean not null default false,
  "redflag_stepup_required" boolean not null default false,
  "stepup_completed_at" timestamptz,
  "disposed_at" timestamptz,
  "disposition" text,
  "sar_filing_id" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- a step-up that was required and never completed is an unverified member
  -- proceeding as a verified one
  constraint "ck_redflag_stepup_before_disposal"
    check ("disposed_at" is null or not "redflag_stepup_required"
           or "stepup_completed_at" is not null),
  constraint "ck_redflag_disposition_stated"
    check ("disposed_at" is null or "disposition" is not null)
);

create table if not exists "core"."redflag_ruleset" (
  "id" text primary key,
  "version" int not null,
  "redflag_ruleset" jsonb not null,
  "redflag_pattern_updates" jsonb not null default '[]'::jsonb,
  "redflag_case_stats" jsonb not null default '{}'::jsonb,
  "updated_at" timestamptz not null,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

create table if not exists "sim"."redflag_case" (like "core"."redflag_case" including all);
create table if not exists "sim"."redflag_ruleset" (like "core"."redflag_ruleset" including all);

-- EPS-01: `core.risk` is one of the abandoned tables. A new payment service
-- adds to the enterprise risk register or the register does not describe the
-- enterprise; the inherent score belongs there, not only on the proposal.
alter table "core"."risk"
  add column if not exists "inherent_score" int,
  add column if not exists "service_ref" text;

-- EPS-06: releasing a wire is a SECOND, separately authenticated act. The PIN
-- and the originating IP are what distinguish a release by the authorised
-- operator from a release by whoever has their session.
create table if not exists "core"."wire_release" (
  "id" text primary key,
  "wire_ref" text not null,
  "eps_wire_originator_id" text not null,
  "eps_wire_release_pin_verified" boolean not null,
  "eps_wire_ip" text,
  "eps_wire_ip_allowlisted" boolean,
  "eps_wire_second_approval" text,
  "requested_at" timestamptz not null,
  "released_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- an unrecognised IP is not a release; unknown is not permission
  constraint "ck_wire_release_verified"
    check ("released_at" is null
           or ("eps_wire_release_pin_verified" and "eps_wire_ip_allowlisted" is true
               and "eps_wire_second_approval" is not null))
);

-- EPS-06: an ACH batch runs a named set of checks and the RESULTS are the
-- evidence. "Passed" with no per-check result is one boolean standing in for
-- five, and it cannot say which one would have caught the thing that got through.
create table if not exists "core"."ach_control_result" (
  "id" text primary key,
  "ach_transfer_ref" text not null,
  "ach_transfer_amount_cents" bigint not null,
  "eps_client_ach_exposure_limit_cents" bigint,
  "eps_client_ach_template_only" boolean not null default false,
  "control_results" jsonb not null,
  "passed" boolean not null,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- the verdict is derived from the results; a pass with a failing check in the
  -- set is the contradiction this constraint exists to make impossible
  constraint "ck_ach_results_present"
    check (jsonb_typeof("control_results") = 'object')
);

-- EPS-06: a limit change is a REQUEST that somebody else decides, with a
-- justification. A limit an operator can raise for themselves is not a limit.
create table if not exists "core"."eps_limit_change" (
  "id" text primary key,
  "partner_id" text not null,
  "requested_by" text not null,
  "eps_limit_change_justification" text not null,
  "eps_limit_change_approver_id" text,
  "eps_client_wire_daily_limit_cents" bigint,
  "eps_client_ach_exposure_limit_cents" bigint,
  "requested_at" timestamptz not null,
  "decided_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  constraint "ck_limit_change_four_eyes"
    check ("decided_at" is null
           or ("eps_limit_change_approver_id" is not null
               and "eps_limit_change_approver_id" <> "requested_by"))
);

-- EPS-06: positive pay. An item presented against the issue file has a decision
-- DEADLINE, and a missed deadline is a default-pay or default-return decision
-- made by nobody.
create table if not exists "core"."pospay_item" (
  "id" text primary key,
  "eps_pospay_issue_file" text not null,
  "eps_pospay_presented_item" jsonb not null,
  "eps_pospay_decision_due_at" timestamptz not null,
  "decision" text check ("decision" in ('pay', 'return')),
  "decided_at" timestamptz,
  "decided_by" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  constraint "ck_pospay_decision_owned"
    check ("decided_at" is null or "decided_by" is not null)
);

create table if not exists "sim"."wire_release" (like "core"."wire_release" including all);
create table if not exists "sim"."ach_control_result" (like "core"."ach_control_result" including all);
create table if not exists "sim"."eps_limit_change" (like "core"."eps_limit_change" including all);
create table if not exists "sim"."pospay_item" (like "core"."pospay_item" including all);
