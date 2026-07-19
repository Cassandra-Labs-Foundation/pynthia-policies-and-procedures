-- Capital adequacy and PCA classification (CP-01..CP-10, BA-01..BA-08).
--
-- THREE FINDINGS THAT SHAPED THIS, ALL CHECKED BEFORE BUILDING.
--
-- 1. THE PCA THRESHOLDS ARE STATUTORY, SO THEY ARE HARDCODED — and that is
--    correct rather than fabrication. 12 CFR 702.102 defines the bands and
--    capitalization.md restates them ("net worth ratio >= 7%"). This is the
--    FIRST artifact where a threshold could be populated honestly instead of
--    left unassessed, and the distinction matters: an unconfigured ACH
--    dual-control limit is a domain question nobody answered, whereas an
--    unconfigured PCA floor would be a number we simply failed to look up.
--
--    CP-03 splits them explicitly: the REGULATORY floor is statutory, the
--    INTERNAL early-warning trigger above it is "approved by the Board...
--    write-restricted to the CCO". So the second layer stays nullable and
--    unassessed until someone supplies it — same pattern as everywhere else.
--
-- 2. core.threshold DOES NOT FIT and is deliberately not used. It compares one
--    OBSERVED value against one limit. A capital ratio is COMPUTED from
--    components (net worth / total assets) and classified into FIVE BANDS.
--    Both halves are wrong, and bending threshold to cover it would leave a
--    primitive that handles computed positions badly while appearing to
--    support them.
--
-- 3. THERE IS A CLOCK, and its anchor is the CLASSIFICATION. NCUA requires a
--    net worth restoration plan within 45 days of becoming undercapitalized —
--    not from the quarter-end the data describes, and not from when someone
--    noticed. Fourth instance of the anchor question, and the fourth different
--    answer.

create table if not exists "core"."capital_position" (
  "id" text primary key,
  "as_of_date" date not null,

  -- the COMPONENTS, stored, because the ratio must be reproducible from them.
  -- A stored ratio with no components cannot be audited or recomputed.
  "net_worth_cents" bigint not null,
  "total_assets_cents" bigint not null check ("total_assets_cents" > 0),
  "risk_weighted_assets_cents" bigint,

  -- computed and stored: net_worth / total_assets, in basis points to avoid
  -- floating point on a regulatory number
  "net_worth_ratio_bp" int not null,

  -- 12 CFR 702.102
  "pca_category" text not null check ("pca_category" in (
    'well_capitalized',              -- >= 7.00%
    'adequately_capitalized',        -- 6.00% - 6.99%
    'undercapitalized',              -- 4.00% - 5.99%
    'significantly_undercapitalized',-- 2.00% - 3.99%
    'critically_undercapitalized'    -- < 2.00%
  )),

  -- CP-03: the internal early-warning trigger sits ABOVE the regulatory floor
  -- and is Board-approved. NULL = nobody has set one, which is NOT the same as
  -- "no internal trigger was breached".
  "internal_trigger_bp" int,
  "internal_trigger_breached" boolean,

  -- the 45-day clock, anchored on CLASSIFICATION (see header)
  "nwrp_due_at" timestamptz,
  "nwrp_filed_at" timestamptz,
  "nwrp_filed_by" text,

  "distribution_restricted" boolean not null default false,

  "provenance" text not null default 'unknown',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  constraint "uq_capital_position_date" unique ("as_of_date")
);

-- The ratio must equal the components. A position whose stored ratio disagrees
-- with its own inputs is worse than no position: every downstream
-- classification inherits the error silently.
alter table "core"."capital_position" drop constraint if exists "ck_capital_ratio_matches_components";
alter table "core"."capital_position"
  add constraint "ck_capital_ratio_matches_components"
  check ("net_worth_ratio_bp" = (("net_worth_cents" * 10000) / "total_assets_cents"));

-- A restoration plan can only be due for an institution that is actually
-- undercapitalized. A due date on a well-capitalized position would be a
-- deadline with no obligation behind it.
alter table "core"."capital_position" drop constraint if exists "ck_capital_nwrp_only_if_under";
alter table "core"."capital_position"
  add constraint "ck_capital_nwrp_only_if_under"
  check (
    "nwrp_due_at" is null
    or "pca_category" in ('undercapitalized', 'significantly_undercapitalized', 'critically_undercapitalized')
  );

-- An unset internal trigger cannot report a breach verdict either way.
alter table "core"."capital_position" drop constraint if exists "ck_capital_internal_verdict";
alter table "core"."capital_position"
  add constraint "ck_capital_internal_verdict"
  check (("internal_trigger_bp" is null) = ("internal_trigger_breached" is null));

create index if not exists "idx_capital_nwrp_overdue"
  on "core"."capital_position" ("nwrp_due_at") where "nwrp_filed_at" is null;
create index if not exists "idx_capital_as_of" on "core"."capital_position" ("as_of_date" desc);

create table if not exists "sim"."capital_position" (like "core"."capital_position" including defaults);
grant all privileges on "core"."capital_position" to "service_role";
grant all privileges on "sim"."capital_position" to "service_role";

notify pgrst, 'reload schema';

-- CAPITAL IS NOT ONE ARTIFACT. Working the controls split it into four:
--   position + PCA classification   CP-02/03/04, BA-01   (above)
--   Board-approved targets          CP-01, CP-03         (here)
--   plan / stress / ICAAP cycle     CP-05/06, BA-07      (here)
--   Pillar-3 disclosure, ALCO       BA-08                (governance-shaped, not built)
-- Same shape as the audit decomposition: the expensive part was seeing the
-- seams, not writing the tables.

-- Tier 1 / Tier 2 components (BA-02). Stored on the position because the
-- classification is as-of a date, not a standing property of the institution.
alter table "core"."capital_position" add column if not exists "tier1_cents" bigint;
alter table "core"."capital_position" add column if not exists "tier2_cents" bigint;
alter table "core"."capital_position" add column if not exists "classification_approved_by" text;
alter table "sim"."capital_position" add column if not exists "tier1_cents" bigint;
alter table "sim"."capital_position" add column if not exists "tier2_cents" bigint;
alter table "sim"."capital_position" add column if not exists "classification_approved_by" text;

-- CP-01/CP-03: internal capital targets sit ABOVE the statutory floor and are
-- BOARD-APPROVED. This is the institutional half of the threshold story — the
-- PCA bands are law and hardcoded, these are a choice and must be recorded as
-- one, by someone, on a date.
create table if not exists "core"."capital_target" (
  "id" text primary key,
  "effective_date" date not null,
  "target_bp" int not null,
  "proposed_by" text not null,
  "approved_by" text,
  "approved_at" timestamptz,
  "provenance" text not null default 'unknown',
  "created_at" timestamptz not null default now()
);

-- Fifth use of the four-eyes property. A target the proposer approved alone is
-- not a Board-approved target, it is a preference.
alter table "core"."capital_target" drop constraint if exists "ck_capital_target_four_eyes";
alter table "core"."capital_target"
  add constraint "ck_capital_target_four_eyes"
  check ("approved_by" is null or "approved_by" is distinct from "proposed_by");

-- A target below the statutory floor is not a target, it is a plan to be
-- undercapitalized. CP-01 requires internal targets ABOVE regulatory minimums.
alter table "core"."capital_target" drop constraint if exists "ck_capital_target_above_floor";
alter table "core"."capital_target"
  add constraint "ck_capital_target_above_floor" check ("target_bp" >= 700);

-- CP-05/CP-06/BA-07: capital plan, stress report and ICAAP report are the same
-- shape — a document prepared on a cycle, presented, then reviewed — so they
-- are one table with a `kind`, not three near-identical ones.
create table if not exists "core"."capital_document" (
  "id" text primary key,
  "kind" text not null check ("kind" in ('capital_plan', 'stress_report', 'icaap_report')),
  "cycle" text not null,
  "prepared_by" text not null,
  "prepared_at" timestamptz not null default now(),
  "presented_at" timestamptz,
  "presented_to" text,
  "reviewed_at" timestamptz,
  "reviewed_by" text,
  "prior_document_id" text,
  "provenance" text not null default 'unknown',
  "created_at" timestamptz not null default now(),
  constraint "uq_capital_document_cycle" unique ("kind", "cycle")
);

-- Review follows presentation. A document reviewed by a body it was never
-- presented to is the governance equivalent of a rubber stamp, and CP-05
-- requires Board/ALM presentation specifically.
alter table "core"."capital_document" drop constraint if exists "ck_capital_document_review_after_present";
alter table "core"."capital_document"
  add constraint "ck_capital_document_review_after_present"
  check ("reviewed_at" is null or "presented_at" is not null);

create index if not exists "idx_capital_target_effective" on "core"."capital_target" ("effective_date" desc);
create index if not exists "idx_capital_document_kind" on "core"."capital_document" ("kind", "cycle");

create table if not exists "sim"."capital_target" (like "core"."capital_target" including defaults);
create table if not exists "sim"."capital_document" (like "core"."capital_document" including defaults);
grant all privileges on "core"."capital_target", "core"."capital_document" to "service_role";
grant all privileges on "sim"."capital_target", "sim"."capital_document" to "service_role";

notify pgrst, 'reload schema';
