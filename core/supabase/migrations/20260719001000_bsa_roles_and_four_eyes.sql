-- Segregation of duties for BSA case management (OQ-08).
--
-- BSA-06 requires an Investigations role to open or close cases and gives the
-- BSA Officer write access to SAR decisions. BSA-07 has a SAR committee make
-- the filing decision. The actor model had three classes — partner, cu_admin,
-- pynthia_ops — so case management could only be gated at "not a partner",
-- and nothing stopped one actor from both opening an investigation and
-- deciding its outcome.
--
-- WHAT THIS IS NOT
--
-- Not an RBAC system. There is no permissions table, no rule evaluation, no
-- role hierarchy and no inheritance. There are four named roles, two hardcoded
-- gates in bsa.ts, and one relational constraint. The requirement is a specific
-- separation an examiner would test, not general permission modelling, and
-- anything more would be building a policy engine nobody asked for.
--
-- WHY A CHECK CONSTRAINT AND NOT RLS
--
-- The property that matters is RELATIONAL: two columns on one row must differ.
-- That is not something row-level security can express — RLS decides which rows
-- an actor may see or touch, not whether two of their values may coincide. A
-- CHECK is also enforced against every writer including service_role, which RLS
-- explicitly is not (the edge functions bypass it). So the separation is
-- structural here without needing to revisit the service_role decision at all.

-- ------------------------------------------------------------------- roles
--
-- Closed vocabulary, same shape as allowed_endpoints / allowed_tiers. Empty by
-- default: a token grants no BSA role unless one is issued deliberately, so
-- adding this column cannot silently widen any existing token.
alter table "core"."api_token"
  add column if not exists "roles" text[] not null default '{}';

alter table "core"."api_token" drop constraint if exists "ck_api_token_roles";
alter table "core"."api_token"
  add constraint "ck_api_token_roles"
  check ("roles" <@ array[
    'bsa_investigator',  -- BSA-06: opens and closes cases
    'bsa_officer',       -- BSA-06/07: writes the SAR decision
    'bsa_compliance',    -- BSA-07: sits on the SAR committee
    'bsa_counsel'        -- BSA-07: legal counsel, "as needed"
  ]::text[]);

comment on column "core"."api_token"."roles" is
  'BSA duty roles (OQ-08). Deliberately NOT a general permission system: a closed four-value vocabulary gating two endpoints. Empty by default so the column cannot widen an existing token.';

-- ------------------------------------------------- who did what, on the row
--
-- Recording the ACTOR, not just the timestamp. Without these the separation is
-- unprovable after the fact: an examiner asking "who decided this, and were
-- they the same person who investigated it?" needs the answer on the row.
alter table "core"."case"
  add column if not exists "opened_by" text,
  add column if not exists "decided_by" text,
  add column if not exists "concurred_by" text[] not null default '{}';

comment on column "core"."case"."opened_by" is
  'api_token.id of the investigator who escalated the alert into this case.';
comment on column "core"."case"."decided_by" is
  'api_token.id of the BSA Officer who recorded the SAR decision. Constrained to differ from opened_by.';
comment on column "core"."case"."concurred_by" is
  'Other SAR committee participants (BSA-07). RECORDED, not enforced — quorum and committee composition are organizational controls this system does not police. See OQ-09.';

-- ----------------------------------------------------- the four-eyes rule
--
-- The whole point of this migration. A NULL decided_by is permitted (an open
-- case has no decider yet); once set it must differ from opened_by.
--
-- IS DISTINCT FROM rather than <>: with plain <> a NULL opened_by would make
-- the comparison NULL, and a CHECK passes on NULL. That would mean a case with
-- no recorded investigator could be decided by anyone — precisely the hole this
-- exists to close, opened by the one input most likely to be missing.
alter table "core"."case" drop constraint if exists "ck_case_four_eyes";
alter table "core"."case"
  add constraint "ck_case_four_eyes"
  check (
    "decided_by" is null
    or "decided_by" is distinct from "opened_by"
  );

comment on constraint "ck_case_four_eyes" on "core"."case" is
  'BSA-06 segregation of duties: the actor who opened an investigation may not decide its SAR outcome. Enforced in the database so it holds against service_role, a migration, or a psql session — not only against the API.';

-- The same rule in the sim schema: the substrate must be able to reproduce a
-- four-eyes VIOLATION as a test case, and it can only do that faithfully if the
-- constraint it violates is the same one.
alter table "sim"."case"
  add column if not exists "opened_by" text,
  add column if not exists "decided_by" text,
  add column if not exists "concurred_by" text[] not null default '{}';

alter table "sim"."case" drop constraint if exists "ck_sim_case_four_eyes";
alter table "sim"."case"
  add constraint "ck_sim_case_four_eyes"
  check (
    "decided_by" is null
    or "decided_by" is distinct from "opened_by"
  );

create index if not exists "idx_case_opened_by" on "core"."case" ("opened_by");
create index if not exists "idx_case_decided_by" on "core"."case" ("decided_by");

notify pgrst, 'reload schema';
