-- Cash OPERATIONS (CP-01..CP-12) — vaults, devices, limits, reconciliation.
--
-- NOT the same domain as `core.cash_transaction`. That table exists because a
-- CTR obligation attaches to CURRENCY MOVING ACROSS THE COUNTER for a member
-- (BSA-08). This one is about the institution's own currency INVENTORY: how
-- much is in which vault, who has custody of it, whether the drawer balanced,
-- whether the shipment arrived with its seal intact. Same physical money, two
-- unrelated obligations, and merging them would give the CTR aggregation a set
-- of vault balances to sum over.
--
-- WHAT THIS DELIBERATELY DOES NOT BUILD.
--
-- CP-05 (custody revocation on separation) and CP-07 (over/short coaching)
-- declare `employee.*` and `hr.*`. Those are PEOPLE and organisational
-- process. Building them would turn two controls green by inventing the facts
-- the controls exist to check — the same class of error as backfilling
-- `account.entity_id` with a guessed owner. Both stay RED and their red lines
-- name the entity. See the standing rule in BLUEPRINT.
--
-- Everything cash-native IS built, including two things that look like foreign
-- namespaces and are not: `gl.cash_suspense` (a suspense account is a ledger
-- artifact, not a person) and `cmir` (FinCEN Form 105 on currency shipments —
-- a BSA filing on this exact inventory, and one of OQ-10's nine unwired
-- retention record classes).
--
-- THE ORDERING ASSUMPTION, FIFTH INSTANCE. A limits schedule is
-- EFFECTIVE-DATED: the schedule in force is the one with the greatest
-- `effective_at` not in the future, NOT the most recently inserted row. A
-- schedule entered today to take effect next month must not silently start
-- governing today's loads, and a backdated correction must not lose to the row
-- that was typed first. Every read of a limit goes through one accessor for
-- this reason. See BLUEPRINT §5g.

-- ------------------------------------------------------------------ policy
create table if not exists "core"."cash_policy" (
  "id" text primary key,
  "policy_document_version" text not null,
  "adopted_at" timestamptz not null,
  "board_resolution_id" text not null,
  "policy_expiry_at" timestamptz not null,
  "superseded_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  constraint "ck_cash_policy_expiry_after_adoption"
    check ("policy_expiry_at" > "adopted_at")
);

-- ------------------------------------------------------------------- assets
--
-- CP-04. A cash ASSET is any container the institution holds currency in: a
-- vault, a teller drawer, an ATM/ITM, a night drop. They differ in limit and
-- in who may open them, not in kind.
create table if not exists "core"."cash_asset" (
  "id" text primary key,
  "location_id" text not null,
  "asset_type" text not null check ("asset_type" in
    ('vault', 'teller_drawer', 'atm', 'itm', 'night_drop', 'cash_recycler')),
  "balance_cents" bigint not null default 0 check ("balance_cents" >= 0),
  "custodian_user_id" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

-- CP-04 / CP-10. Limits are effective-dated and Board-authorised. A limit with
-- no schedule behind it is a number someone typed.
create table if not exists "core"."cash_limits_schedule" (
  "id" text primary key,
  "asset_id" text not null references "core"."cash_asset" ("id"),
  "limit_cents" bigint not null check ("limit_cents" > 0),
  "effective_at" timestamptz not null,
  "board_resolution_id" text,
  -- CP-10: a seasonal deviation raises a limit temporarily. It MUST sunset —
  -- a deviation with no end date is a permanent limit change wearing an
  -- exception's name.
  "deviation_id" text,
  "sunset_at" timestamptz,
  "whitelisted" boolean not null default false,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  constraint "ck_cash_schedule_deviation_sunsets"
    check ("deviation_id" is null or "sunset_at" is not null)
);

-- Every load request, INCLUDING refusals. Same rule as the CDA funding gate:
-- a limit that only records what it permitted cannot be audited.
create table if not exists "core"."cash_load" (
  "id" text primary key,
  "asset_id" text not null references "core"."cash_asset" ("id"),
  "amount_cents" bigint not null check ("amount_cents" <> 0),
  "projected_balance_cents" bigint not null,
  "limit_cents" bigint,
  "decision" text not null check ("decision" in ('permitted', 'blocked')),
  "blocked_reason" text,
  -- CP-04/CP-08 dual control: the counter and the custodian are two PEOPLE.
  "counter_user_id" text,
  "custodian_user_id" text,
  "exception_ticket_id" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  constraint "ck_cash_load_dual_control"
    check ("decision" <> 'permitted' or (
      "counter_user_id" is not null and "custodian_user_id" is not null
      and "counter_user_id" <> "custodian_user_id"
    )),
  constraint "ck_cash_load_reason_matches_decision"
    check (("decision" = 'blocked') = ("blocked_reason" is not null))
);

-- --------------------------------------------------------- enterprise limit
--
-- CP-03. Aggregate cash as a percentage of total assets, with a warning band
-- below the limit. Both are INSTITUTIONAL (Board-set), unlike the PCA bands
-- and unlike the CDA 5% cap, so an unconfigured limit reports `unassessed`
-- and NOT "within limit". Third place in this repo that distinction is drawn.
create table if not exists "core"."cash_enterprise_position" (
  "id" text primary key,
  "as_of_date" date not null,
  "cash_cents" bigint not null,
  "gl_total_assets_cents" bigint not null check ("gl_total_assets_cents" > 0),
  "utilization_bp" int not null,
  "limit_bp" int,
  "warning_bp" int,
  "verdict" text not null check ("verdict" in
    ('within_limit', 'warning', 'breached', 'unassessed')),
  "excess_cents" bigint not null default 0,
  "headroom_cents" bigint,
  "remediation_due_at" timestamptz,
  "remediated_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  constraint "ck_cash_enterprise_unassessed_has_no_verdict"
    check (("limit_bp" is null) = ("verdict" = 'unassessed')),
  constraint "ck_cash_enterprise_remediation_only_if_breached"
    check ("remediation_due_at" is null or "verdict" = 'breached')
);

-- ----------------------------------------------------- reconciliation / GL
--
-- CP-06. The variance must equal its own components or the verdict is
-- unauditable — same constraint shape as the CDA reconciliation.
create table if not exists "core"."cash_reconciliation" (
  "id" text primary key,
  "asset_id" text not null references "core"."cash_asset" ("id"),
  "business_date" date not null,
  "counted_cents" bigint not null,
  "gl_balance_cents" bigint not null,
  "variance_cents" bigint not null,
  "balanced" boolean not null,
  "research_notes" text,
  "due_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  constraint "ck_cash_recon_variance_matches"
    check ("variance_cents" = "counted_cents" - "gl_balance_cents"),
  constraint "ck_cash_recon_balanced_matches_variance"
    check ("balanced" = ("variance_cents" = 0))
);

-- An unreconciled variance parks in suspense and AGES. The aging is the
-- control: a suspense item nobody clears is the failure mode, so the clock is
-- on the row rather than in a report.
create table if not exists "core"."gl_cash_suspense" (
  "id" text primary key,
  "reconciliation_id" text references "core"."cash_reconciliation" ("id"),
  "amount_cents" bigint not null check ("amount_cents" <> 0),
  "opened_at" timestamptz not null,
  "escalate_at" timestamptz not null,
  "escalated_at" timestamptz,
  "cleared_at" timestamptz,
  "correction_txn_id" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  -- clearing a suspense item requires the correcting entry, or "cleared" means
  -- "we stopped looking at it"
  constraint "ck_gl_suspense_cleared_has_correction"
    check ("cleared_at" is null or "correction_txn_id" is not null)
);

-- ------------------------------------------------------------- over / short
--
-- CP-07. Built even though CP-07 stays RED on `hr.coaching.recorded`: the
-- over/short record is real, feeds the KRI and the BSA alert, and refusing to
-- build it because one declared consequence is organisational would lose the
-- six that are not.
create table if not exists "core"."cash_overshort" (
  "id" text primary key,
  "asset_id" text not null references "core"."cash_asset" ("id"),
  "custodian_user_id" text not null,
  "business_date" date not null,
  -- signed: positive is over, negative is short
  "amount_cents" bigint not null check ("amount_cents" <> 0),
  "cumulative_cents" bigint not null default 0,
  "research_notes" text,
  "investigation_due_at" timestamptz,
  "investigation_opened_at" timestamptz,
  "resolved_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

-- --------------------------------------------------------------- shipments
--
-- CP-08. A shipment's SEAL is the control. The expected seal is recorded when
-- the shipment is dispatched and compared on receipt; storing only the found
-- seal makes a mismatch undetectable, which is the entire risk.
create table if not exists "core"."cash_shipment" (
  "id" text primary key,
  "asset_id" text references "core"."cash_asset" ("id"),
  "direction" text not null check ("direction" in ('inbound', 'outbound')),
  "amount_cents" bigint not null check ("amount_cents" > 0),
  "courier_receipt_id" text,
  "seal_expected" text not null,
  "seal_found" text,
  "seal_matched" boolean,
  "crosses_border" boolean not null default false,
  "verification_due_at" timestamptz,
  "verified_at" timestamptz,
  "incident_id" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  -- a shipment cannot be verified while its seal is unchecked or mismatched
  constraint "ck_cash_shipment_verified_seal_ok"
    check ("verified_at" is null or "seal_matched" = true)
);

-- CP-08 / 31 CFR 1010.340. FinCEN Form 105 on currency crossing the border
-- above $10,000. Also closes one of OQ-10's nine unwired retention classes.
create table if not exists "core"."cmir_filing" (
  "id" text primary key,
  "shipment_id" text not null references "core"."cash_shipment" ("id"),
  "amount_cents" bigint not null,
  "identified_at" timestamptz not null,
  "filed_at" timestamptz,
  "filed_by" text,
  "fincen_ref" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  constraint "ck_cmir_filed_has_ref"
    check ("filed_at" is null or ("filed_by" is not null and "fincen_ref" is not null))
);

-- --------------------------------------------------------- surprise counts
create table if not exists "core"."cash_surprise_count" (
  "id" text primary key,
  "asset_id" text not null references "core"."cash_asset" ("id"),
  "scheduled_for" date not null,
  "due_at" timestamptz not null,
  "completed_at" timestamptz,
  "counted_cents" bigint,
  "book_cents" bigint,
  "variance_cents" bigint,
  "counted_by" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  -- CP-09: a surprise count is only a count if someone counted. A completed
  -- row with no counter and no figure is a scheduling record.
  constraint "ck_cash_surprise_completed_has_count"
    check ("completed_at" is null or (
      "counted_cents" is not null and "book_cents" is not null
      and "counted_by" is not null
    ))
);

-- ------------------------------------------------------------- deviations
create table if not exists "core"."cash_deviation" (
  "id" text primary key,
  "asset_id" text not null references "core"."cash_asset" ("id"),
  "requested_limit_cents" bigint not null check ("requested_limit_cents" > 0),
  "period_reason" text not null,
  "sunset_at" timestamptz not null,
  "board_resolution_id" text,
  "insurance_bond_adjustment" text,
  "decision" text not null check ("decision" in ('requested', 'approved', 'denied', 'expired')),
  "decided_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  -- CP-10: raising a cash limit is a Board decision, and the bond has to cover
  -- the higher exposure. An approval missing either is not an approval.
  constraint "ck_cash_deviation_approval_complete"
    check ("decision" <> 'approved' or (
      "board_resolution_id" is not null and "insurance_bond_adjustment" is not null
    ))
);

-- -------------------------------------------------- exceptions, KRI, records
--
-- CP-01 / CP-10 / CP-12. An exception register entry without a rationale AND
-- an explicit risk acceptance is a log line; the two fields are what make it a
-- governance record.
create table if not exists "core"."cash_exception" (
  "id" text primary key,
  "asset_id" text references "core"."cash_asset" ("id"),
  "kind" text not null,
  "rationale" text not null,
  "risk_acceptance" text not null,
  "accepted_by" text not null,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now()
);

create table if not exists "core"."cash_kri" (
  "id" text primary key,
  "period" text not null,
  "overshort_monthly_summary_cents" bigint not null default 0,
  "overshort_event_count" int not null default 0,
  "recon_variance_count" int not null default 0,
  "exception_count" int not null default 0,
  "suspense_open_count" int not null default 0,
  "trend" text,
  "publish_due_at" timestamptz not null,
  "published_at" timestamptz,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

-- CP-09 / CP-12. An examiner export is a bundle of evidence with a declared
-- scope. The scope is stored because "what did we give them" is the question
-- asked afterwards.
create table if not exists "core"."records_package" (
  "id" text primary key,
  "purpose" text not null check ("purpose" in ('exam_export', 'supervisory_count', 'internal')),
  "scope" jsonb not null,
  "item_count" int not null default 0,
  "requested_at" timestamptz not null,
  "completed_at" timestamptz,
  "delivered_at" timestamptz,
  "delivered_to" text,
  "provenance" text not null default 'production',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  constraint "ck_records_package_delivered_after_complete"
    check ("delivered_at" is null or "completed_at" is not null)
);

-- Convergence with the codegen-era core schema (20260702000100): that
-- migration already created "core"."records_package" with a different shape, so the
-- create-table above is a no-op on every database. Bring the existing
-- table up to this declaration column-by-column (append-only; the old
-- columns stay).
alter table "core"."records_package" add column if not exists "id" text;
alter table "core"."records_package" add column if not exists "purpose" text not null check ("purpose" in ('exam_export', 'supervisory_count', 'internal'));
alter table "core"."records_package" add column if not exists "scope" jsonb not null;
alter table "core"."records_package" add column if not exists "item_count" int not null default 0;
alter table "core"."records_package" add column if not exists "requested_at" timestamptz not null;
alter table "core"."records_package" add column if not exists "completed_at" timestamptz;
alter table "core"."records_package" add column if not exists "delivered_at" timestamptz;
alter table "core"."records_package" add column if not exists "delivered_to" text;
alter table "core"."records_package" add column if not exists "provenance" text not null default 'production';
alter table "core"."records_package" add column if not exists "created_at" timestamptz not null default now();
alter table "core"."records_package" add column if not exists "updated_at" timestamptz not null default now();


create index if not exists "ix_cash_limits_schedule_effective"
  on "core"."cash_limits_schedule" ("asset_id", "effective_at" desc);
create index if not exists "ix_gl_cash_suspense_open"
  on "core"."gl_cash_suspense" ("cleared_at", "escalate_at");
create index if not exists "ix_cash_overshort_custodian"
  on "core"."cash_overshort" ("custodian_user_id", "business_date" desc);

create schema if not exists "sim";
create table if not exists "sim"."cash_policy" (like "core"."cash_policy" including all);
create table if not exists "sim"."cash_asset" (like "core"."cash_asset" including all);
create table if not exists "sim"."cash_limits_schedule" (like "core"."cash_limits_schedule" including all);
create table if not exists "sim"."cash_load" (like "core"."cash_load" including all);
create table if not exists "sim"."cash_enterprise_position" (like "core"."cash_enterprise_position" including all);
create table if not exists "sim"."cash_reconciliation" (like "core"."cash_reconciliation" including all);
create table if not exists "sim"."gl_cash_suspense" (like "core"."gl_cash_suspense" including all);
create table if not exists "sim"."cash_overshort" (like "core"."cash_overshort" including all);
create table if not exists "sim"."cash_shipment" (like "core"."cash_shipment" including all);
create table if not exists "sim"."cmir_filing" (like "core"."cmir_filing" including all);
create table if not exists "sim"."cash_surprise_count" (like "core"."cash_surprise_count" including all);
create table if not exists "sim"."cash_deviation" (like "core"."cash_deviation" including all);
create table if not exists "sim"."cash_exception" (like "core"."cash_exception" including all);
create table if not exists "sim"."cash_kri" (like "core"."cash_kri" including all);
create table if not exists "sim"."records_package" (like "core"."records_package" including all);
