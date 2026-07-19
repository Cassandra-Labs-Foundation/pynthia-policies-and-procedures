-- Charitable Donation Accounts (CDA-01..CDA-14), 12 CFR 721.3(b)(2).
--
-- FOUR THINGS THAT SHAPED THIS, ALL DECIDED BEFORE WRITING THE WRITERS.
--
-- 1. THE NOUN DID NOT EXIST — and unlike cards.ts, neither did any verb. The
--    cda namespace tallied 32 trigger occurrences across 13 in-scope controls
--    and the core had no representation of a charitable donation account at
--    all: no structure, no agreement, no donee, no book value. Every cda
--    control was unsatisfiable for the same reason, which is why they all read
--    identically red ("produced 0/N"). This migration builds the noun first.
--
-- 2. THE SAFE HARBOUR IS A CONJUNCTION, SO THE GATE IS ONE GATE. §721.3(b)(2)
--    is not a list of independent obligations — failing ANY condition forfeits
--    Part 703 relief for the whole account. CDA-03 (segregation), CDA-05
--    (clauses A-D), CDA-06 (the 5% cap) and CDA-01 (unexpired policy) all
--    declare `cda.funding_gate_evaluated` or block funding, and building four
--    separate checks would let three pass while the fourth was never
--    consulted. There is ONE gate (`evaluateFundingGate`), it evaluates every
--    condition on every request, and it reports each condition's verdict
--    separately so a refusal names what actually failed. Precedent: runGate.
--
-- 3. THE CAP TEST IS PROJECTED, NOT CURRENT — and the ordering is the control.
--    §721.3(b)(2)(iii) caps AGGREGATE book value. The natural implementation
--    tests the aggregate, records the funding, and moves on; that permits every
--    breach exactly once, because the amount being requested is not in the
--    aggregate at the time it is tested. The projected aggregate here is
--    `current + requested` and it is computed BEFORE any row is written. This
--    is the fourth instance of the ordering-assumption class (BLUEPRINT §5g)
--    and the first caught by design rather than by a failing drill.
--
-- 4. THE FIVE-YEAR WINDOW IS A RATIO OVER A WINDOW, NOT A COUNTER. CDA-08
--    requires >=51% of TOTAL RETURN distributed at least every five years. A
--    running count of distributions says nothing about that ratio, and a
--    ratio over all history hides a window that closed short. The window is a
--    row with its own open/close dates, and coverage is
--    distributed_in_window / total_return_in_window.

-- ------------------------------------------------------------------ policy
--
-- Column names here follow the CORPUS's vocabulary (`policy_expiry_at`,
-- `agreement_gaap_clause`) rather than a tidier internal one. That is
-- deliberate: the control catalogue names these fields, the input grader now
-- checks them by name, and a schema that renames the specification's terms
-- makes every such check a translation exercise.
--
-- CDA-01: "If the policy lapses, all CDA actions (funding, trades,
-- distributions) are blocked until re-adoption is recorded." That is a
-- cross-cutting gate, not a reporting line, so the adoption register is a
-- table the gate reads rather than a flag someone sets.
create table if not exists "core"."cda_policy" (
  "id" text primary key,
  "policy_version" text not null,
  "adopted_at" timestamptz not null,
  "board_resolution_id" text not null,
  -- an adoption with no expiry could never lapse, which is the failure this
  -- control exists to prevent
  "policy_expiry_at" timestamptz not null,
  "superseded_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  constraint "ck_cda_policy_expiry_after_adoption"
    check ("policy_expiry_at" > "adopted_at")
);

-- ------------------------------------------------------------------ vendor
--
-- CDA-04: only regulated trustees and qualified non-CU discretionary managers
-- (SEC-registered IA or OCC-regulated). `qualified` is DERIVED from the
-- regulator and registration status, never supplied — a supplied qualification
-- flag is an assertion, and the control exists to check the assertion.
create table if not exists "core"."cda_vendor" (
  "id" text primary key,
  "name" text not null,
  "role" text not null check ("role" in ('trustee', 'discretionary_manager')),
  "regulator" text,
  "registration_status" text not null default 'unknown'
    check ("registration_status" in ('active', 'lapsed', 'unknown')),
  "registration_evidence_ref" text,
  "qualified" boolean not null default false,
  "disqualified_reason" text,
  "last_reviewed_at" timestamptz,
  "review_due_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  -- a vendor cannot be qualified and carry a disqualification reason
  constraint "ck_cda_vendor_qualified_clean"
    check (not ("qualified" and "disqualified_reason" is not null))
);

-- --------------------------------------------------------------------- cda
--
-- The account itself. Structure and agreement live here rather than in
-- separate tables because both are properties of the SAME safe-harbour claim,
-- and splitting them makes it possible to have an account whose structure row
-- exists and whose agreement row does not without anything being obviously
-- wrong.
create table if not exists "core"."cda" (
  "id" text primary key,
  "vendor_id" text references "core"."cda_vendor" ("id"),

  -- CDA-03 §721.3(b)(2)(i): segregated or held by a regulated trustee, and
  -- "properly designated as a charitable donation account"
  "structure_type" text check ("structure_type" in ('segregated_custodial', 'spe_trust')),
  "account_label" text,
  "custodian_statement_ref" text,
  "evidence_packet_filed_at" timestamptz,

  -- CDA-05 §721.3(b)(2)(v): clauses A-D. Stored as four separate booleans, not
  -- one `agreement_validated`, because "which clause is missing" is the whole
  -- content of the refusal.
  "agreement_named_charities_clause" boolean not null default false,
  "agreement_strategy_clause" boolean not null default false,
  "agreement_gaap_clause" boolean not null default false,
  "agreement_distribution_clause" boolean not null default false,
  "agreement_validated_at" timestamptz,
  -- CDA-07 declares `cda.strategy_limits` SEPARATELY from `cda.overlay_limits`,
  -- and collapsing the two lost a distinction the policy actually draws: the
  -- overlays are Board-set risk caps, the strategy limits are clause (B) of the
  -- written agreement. A pre-trade check that consults only the overlays is not
  -- checking the agreement it is bound by.
  "strategy_limits" jsonb not null default '{}'::jsonb,

  "book_value_cents" bigint not null default 0 check ("book_value_cents" >= 0),
  "status" text not null default 'proposed'
    check ("status" in ('proposed', 'funded', 'terminating', 'closed')),
  "terminated_at" timestamptz,
  "closed_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),

  -- An agreement is validated only when all four clauses are. Storing a
  -- validation timestamp alongside an unvalidated clause would let the gate
  -- read `agreement_validated_at is not null` and pass an agreement missing
  -- clause C.
  constraint "ck_cda_agreement_all_clauses"
    check ("agreement_validated_at" is null or (
      "agreement_named_charities_clause" and "agreement_strategy_clause"
      and "agreement_gaap_clause" and "agreement_distribution_clause"
    )),
  -- CDA-03: the packet is the structure type, the label AND the custodial
  -- statement. Any one missing means it is not filed.
  constraint "ck_cda_evidence_packet_complete"
    check ("evidence_packet_filed_at" is null or (
      "structure_type" is not null and "account_label" is not null
      and "custodian_statement_ref" is not null
    ))
);

-- ------------------------------------------------------------------ funding
--
-- Every funding request, INCLUDING the refused ones. A gate that only records
-- what it permitted cannot be audited: "no blocked fundings" and "the gate
-- never ran" produce the same table.
create table if not exists "core"."cda_funding_request" (
  "id" text primary key,
  "cda_id" text not null references "core"."cda" ("id"),
  "amount_cents" bigint not null check ("amount_cents" > 0),
  "decision" text not null check ("decision" in ('permitted', 'blocked')),
  -- which conditions failed; empty array iff permitted
  "blocked_reasons" jsonb not null default '[]'::jsonb,
  "projected_aggregate_cents" bigint not null,
  "net_worth_cents" bigint not null,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  constraint "ck_cda_funding_reasons_match_decision"
    check (("decision" = 'permitted') = (jsonb_array_length("blocked_reasons") = 0))
);

-- ----------------------------------------------------------------- cap test
--
-- CDA-06 §721.3(b)(2)(iii). Both bounds are stored: the STATUTORY 5% (a
-- lookup, like the PCA bands) and the INTERNAL buffer (Board-set, default 4%
-- per PATRICK_NOTES but confirmable). Same split as capital.
create table if not exists "core"."cda_cap_test" (
  "id" text primary key,
  "as_of_date" date not null,
  "aggregate_book_value_cents" bigint not null,
  "net_worth_cents" bigint not null check ("net_worth_cents" > 0),
  "utilization_bp" int not null,
  "buffer_bp" int not null,
  "buffer_breached" boolean not null,
  "cap_breached" boolean not null,
  "excess_cents" bigint not null default 0,
  "cure_due_at" timestamptz,
  "cure_plan" text,
  "cured_at" timestamptz,
  "certified_by" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  -- a cure clock can only exist for an actual breach
  constraint "ck_cda_cure_only_if_breached"
    check ("cure_due_at" is null or "cap_breached"),
  -- an excess with no breach, or a breach with no excess, is arithmetic that
  -- disagrees with its own verdict
  constraint "ck_cda_excess_iff_breached"
    check (("excess_cents" > 0) = "cap_breached")
);

-- ------------------------------------------------------- distribution window
--
-- CDA-08 §721.3(b)(2)(iv)-(v). The window is a row so that a window which
-- CLOSED short is a durable fact rather than an arithmetic accident of when
-- someone happened to run the query.
create table if not exists "core"."cda_distribution_window" (
  "id" text primary key,
  "cda_id" text not null references "core"."cda" ("id"),
  "opened_at" timestamptz not null,
  "closes_at" timestamptz not null,
  "total_return_cents" bigint not null default 0,
  "distributed_cents" bigint not null default 0,
  "coverage_bp" int not null default 0,
  "closed_at" timestamptz,
  "closed_short" boolean,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  constraint "ck_cda_window_closes_after_open" check ("closes_at" > "opened_at")
);

create table if not exists "core"."cda_distribution" (
  "id" text primary key,
  "cda_id" text not null references "core"."cda" ("id"),
  "window_id" text references "core"."cda_distribution_window" ("id"),
  "donee_name" text not null,
  "donee_ein" text,
  -- 26 USC 501(c)(3) and, where applicable, (c)(19)
  "donee_irs_status" text check ("donee_irs_status" in ('501c3', '501c19', 'none', 'unknown')),
  "donee_validated" boolean not null default false,
  "amount_cents" bigint not null check ("amount_cents" > 0),
  "kind" text not null default 'periodic' check ("kind" in ('periodic', 'closing')),
  "proposed_by" text not null,
  "approved_by" text,
  "decision" text not null check ("decision" in ('executed', 'blocked', 'pending_approval')),
  "blocked_reason" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),

  -- CDA-11: >= $5,000 needs a SECOND person. Two calls by one token is not
  -- dual control — the same finding EPS-06 produced on the wire rail, applied
  -- here before it could be made again.
  constraint "ck_cda_distribution_dual_control"
    check ("decision" <> 'executed' or "amount_cents" < 500000
           or ("approved_by" is not null and "approved_by" <> "proposed_by")),
  -- CDA-08: an executed distribution's donee must have been validated
  constraint "ck_cda_distribution_donee_validated"
    check ("decision" <> 'executed' or "donee_validated")
);

-- ---------------------------------------------------------------------- fee
--
-- CDA-13: §721.3(b)(2) prohibits CDA fees/expenses being paid to the credit
-- union or its affiliates. `payee_is_affiliate` is derived from the blocklist,
-- not supplied.
create table if not exists "core"."cda_fee_payment" (
  "id" text primary key,
  "cda_id" text not null references "core"."cda" ("id"),
  "payee" text not null,
  "payee_is_affiliate" boolean not null,
  "amount_cents" bigint not null check ("amount_cents" > 0),
  "decision" text not null check ("decision" in ('permitted', 'blocked')),
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  constraint "ck_cda_fee_affiliate_blocked"
    check (not ("payee_is_affiliate" and "decision" = 'permitted'))
);

-- -------------------------------------------------------------------- trade
--
-- CDA-07: Part 703 limits do not apply to a compliant CDA, so these overlays
-- are BOARD-SET rather than statutory. Unlike the PCA bands they cannot be
-- looked up, so an unconfigured overlay reports `unassessed` and NOT "within
-- limits" — same discipline as the capital internal trigger.
create table if not exists "core"."cda_overlay" (
  "id" text primary key,
  "cda_id" text not null references "core"."cda" ("id"),
  "kind" text not null check ("kind" in
    ('single_issuer', 'sector', 'liquidity', 'volatility', 'drawdown')),
  "limit_bp" int not null check ("limit_bp" > 0),
  "approved_by" text not null,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

create table if not exists "core"."cda_trade" (
  "id" text primary key,
  "cda_id" text not null references "core"."cda" ("id"),
  "issuer" text not null,
  "sector" text,
  "amount_cents" bigint not null check ("amount_cents" > 0),
  "pretrade_verdict" text not null
    check ("pretrade_verdict" in ('within_limits', 'breach', 'unassessed')),
  "breached_overlays" jsonb not null default '[]'::jsonb,
  "executed" boolean not null default false,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- an overlay breach blocks execution; an UNASSESSED overlay also blocks,
  -- because unknown is not permission (precedent: the wire dual-control state)
  constraint "ck_cda_trade_execution_requires_clearance"
    check (not "executed" or "pretrade_verdict" = 'within_limits')
);

-- ----------------------------------------------------------------- accounts
--
-- CDA-09: GAAP entries, monthly reconciliation, 789H Call Report mapping.
create table if not exists "core"."cda_reconciliation" (
  "id" text primary key,
  "cda_id" text not null references "core"."cda" ("id"),
  "period" text not null,
  "gl_balance_cents" bigint not null,
  "custodian_balance_cents" bigint not null,
  "difference_cents" bigint not null,
  "reconciled" boolean not null,
  "account_789h_mapped" boolean not null default false,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  -- the stored difference must equal its own components, or the reconciliation
  -- verdict is unauditable
  constraint "ck_cda_recon_difference_matches"
    check ("difference_cents" = "gl_balance_cents" - "custodian_balance_cents"),
  constraint "ck_cda_recon_verdict_matches_difference"
    check ("reconciled" = ("difference_cents" = 0))
);

-- ------------------------------------------------------------- termination
--
-- CDA-12 §721.3(b)(2)(vi): >=51% closing distribution, and remaining assets in
-- cash or in-kind only where the asset is an otherwise permissible FCU
-- investment under Part 703.
create table if not exists "core"."cda_termination" (
  "id" text primary key,
  "cda_id" text not null references "core"."cda" ("id"),
  "approved_by" text not null,
  "approved_at" timestamptz not null,
  "closing_distribution_cents" bigint not null default 0,
  "closing_coverage_bp" int,
  "final_accounting_ref" text,
  "report_due_at" timestamptz,
  "report_issued_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "core"."cda_inkind_asset" (
  "id" text primary key,
  "termination_id" text not null references "core"."cda_termination" ("id"),
  "asset_class" text not null,
  "amount_cents" bigint not null check ("amount_cents" > 0),
  "permissible" boolean not null,
  "determination_ref" text,
  "decision" text not null check ("decision" in ('received', 'blocked_liquidate')),
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  constraint "ck_cda_inkind_nonpermissible_blocked"
    check ("permissible" or "decision" = 'blocked_liquidate')
);

-- --------------------------------------------------------------- glossary
--
-- CDA-02. A glossary is only a control if something reads it: the version is
-- what CDA-02's alert compares against ("a validation referencing a term whose
-- version differs from the active version"). Terms carry their citation
-- because a definition with no cite cannot be checked against the reg.
create table if not exists "core"."cda_glossary_term" (
  "id" text primary key,
  "term" text not null,
  "definition" text not null,
  "citation" text not null,
  "version" int not null check ("version" >= 1),
  "attested_by" text not null,
  "active" boolean not null default true,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

-- --------------------------------------------------------- communications
--
-- CDA-14: publication gated on a completed WCAG checklist AND both Marketing
-- and Compliance approvals.
create table if not exists "core"."cda_communication" (
  "id" text primary key,
  "title" text not null,
  "draft_ref" text not null,
  "wcag_checklist_passed" boolean,
  "marketing_approved_by" text,
  "compliance_approved_by" text,
  "approved_at" timestamptz,
  "published_at" timestamptz,
  "archived_ref" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  constraint "ck_cda_comm_approval_complete"
    check ("approved_at" is null or (
      "wcag_checklist_passed" and "marketing_approved_by" is not null
      and "compliance_approved_by" is not null
    )),
  constraint "ck_cda_comm_publish_requires_approval"
    check ("published_at" is null or "approved_at" is not null),
  -- CDA-14 requires the artifact archived AT publication, not eventually
  constraint "ck_cda_comm_published_is_archived"
    check ("published_at" is null or "archived_ref" is not null)
);

-- --------------------------------------------------------------- programme
--
-- CDA-11's annual internal audit of the CDA programme. Deliberately NOT
-- core.audit_engagement: that table models an engagement with a plan cycle,
-- independence attestation and fieldwork, and a CDA programme test is one
-- finding register hanging off one annual cycle. Reusing it would have meant
-- fabricating a plan approval and an independence attestation nobody made.
create table if not exists "core"."cda_audit_finding" (
  "id" text primary key,
  "cycle_year" int not null,
  "summary" text not null,
  "remediation_owner" text not null,
  "remediation_due_at" timestamptz not null,
  "closed_at" timestamptz,
  "closure_evidence_ref" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  constraint "ck_cda_finding_closure_evidenced"
    check ("closed_at" is null or "closure_evidence_ref" is not null)
);

create table if not exists "core"."cda_valuation_review" (
  "id" text primary key,
  "cda_id" text not null references "core"."cda" ("id"),
  "period" text not null,
  "independent_pricing_ref" text not null,
  "portfolio_composition" jsonb not null,
  "reviewed_by" text not null,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

create index if not exists "ix_cda_funding_request_cda"
  on "core"."cda_funding_request" ("cda_id", "created_at" desc);
create index if not exists "ix_cda_distribution_window"
  on "core"."cda_distribution" ("window_id");
create index if not exists "ix_cda_cap_test_asof"
  on "core"."cda_cap_test" ("as_of_date" desc);
create index if not exists "ix_cda_policy_expiry"
  on "core"."cda_policy" ("expires_at" desc);

-- sim mirrors. Same rule as everywhere else: evidence written by a simulation
-- lives in `sim` and can never be counted as production evidence.
create schema if not exists "sim";
create table if not exists "sim"."cda" (like "core"."cda" including all);
create table if not exists "sim"."cda_policy" (like "core"."cda_policy" including all);
create table if not exists "sim"."cda_vendor" (like "core"."cda_vendor" including all);
create table if not exists "sim"."cda_funding_request" (like "core"."cda_funding_request" including all);
create table if not exists "sim"."cda_cap_test" (like "core"."cda_cap_test" including all);
create table if not exists "sim"."cda_distribution" (like "core"."cda_distribution" including all);
create table if not exists "sim"."cda_distribution_window" (like "core"."cda_distribution_window" including all);
create table if not exists "sim"."cda_fee_payment" (like "core"."cda_fee_payment" including all);
create table if not exists "sim"."cda_overlay" (like "core"."cda_overlay" including all);
create table if not exists "sim"."cda_trade" (like "core"."cda_trade" including all);
create table if not exists "sim"."cda_reconciliation" (like "core"."cda_reconciliation" including all);
create table if not exists "sim"."cda_termination" (like "core"."cda_termination" including all);
create table if not exists "sim"."cda_inkind_asset" (like "core"."cda_inkind_asset" including all);
create table if not exists "sim"."cda_glossary_term" (like "core"."cda_glossary_term" including all);
create table if not exists "sim"."cda_communication" (like "core"."cda_communication" including all);
create table if not exists "sim"."cda_audit_finding" (like "core"."cda_audit_finding" including all);
create table if not exists "sim"."cda_valuation_review" (like "core"."cda_valuation_review" including all);
