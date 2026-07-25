-- Cash transactions and Currency Transaction Reporting (BSA-08).
--
-- WHAT BUILDING THIS REVEALED
--
-- "Cash" is two domains that share one missing foundation:
--
--   BSA-08 (ctr.* triggers)   per-PERSON per-business-day aggregation of
--                             currency in/out, and a FinCEN filing obligation
--   CP-01..CP-12 (cash.*)     cash OPERATIONS -- vault and device limits, dual
--                             control, reconciliation, over/short
--
-- Neither can exist without a record of currency actually moving, and the core
-- had none. Every "cash" control in the catalogue was unreachable for the same
-- structural reason: there is no cash. This table is that foundation; the
-- operational controls layer on it.
--
-- WHY THIS FINALLY MAKES CTR REAL (OQ-01)
--
-- CG-CTR-01 fires on electronic movements, which are not CTR-reportable at all.
-- A CTR obligation under 31 CFR 1010.311 attaches to CURRENCY. This table is
-- the first thing in the core that represents currency, so it is the first
-- thing that can owe a CTR.

create table if not exists "core"."cash_transaction" (
  "id" text primary key,

  -- 31 CFR 1010.311 aggregates cash-in and cash-out SEPARATELY; a $6k deposit
  -- and a $6k withdrawal on the same day are not a $12k reportable event.
  -- Storing the direction rather than a signed amount keeps that separation
  -- impossible to collapse by accident.
  "direction" text not null check ("direction" in ('cash_in', 'cash_out')),
  "amount" bigint not null check ("amount" > 0),

  "account_id" text,

  -- The PERSON. Nullable, and that is the whole design problem this table
  -- forced into the open -- see the unattributable note below.
  "entity_id" text,

  -- Business date, not the timestamp. CTR aggregates per BUSINESS DAY, and a
  -- transaction at 23:59 local belongs to that day regardless of how UTC
  -- rounds it. Stored explicitly so the aggregation never has to infer it.
  "business_date" date not null,
  "occurred_at" timestamptz not null default now(),

  "branch_ref" text,
  "teller_ref" text,
  "instrument_type" text,

  "provenance" text not null default 'unknown'
    check ("provenance" in ('production', 'demo', 'unknown')),
  "partner_id" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

comment on column "core"."cash_transaction"."entity_id" is
  'The person this currency is attributed to. NULL means unattributable — the transaction is real and counted, but cannot be assigned to a person, so no CTR determination can be made for it. Never silently dropped from aggregation.';

comment on column "core"."cash_transaction"."business_date" is
  'CTR aggregates per business day (31 CFR 1010.311). Stored rather than derived from occurred_at so a UTC boundary cannot silently move a transaction between reporting days.';

alter table "core"."cash_transaction" drop constraint if exists "fk_cash_transaction_entity";
alter table "core"."cash_transaction"
  add constraint "fk_cash_transaction_entity"
  foreign key ("entity_id") references "core"."entity" ("id");
alter table "core"."cash_transaction" drop constraint if exists "fk_cash_transaction_account";
alter table "core"."cash_transaction"
  add constraint "fk_cash_transaction_account"
  foreign key ("account_id") references "core"."account" ("id");

-- The aggregation index: per person, per day, per direction.
create index if not exists "idx_cash_txn_entity_date"
  on "core"."cash_transaction" ("entity_id", "business_date", "direction");

-- The UNATTRIBUTABLE index. A partial index over exactly the rows that cannot
-- be assigned to a person, because those are a compliance finding in their own
-- right and need to be as cheap to find as the attributed ones.
create index if not exists "idx_cash_txn_unattributable"
  on "core"."cash_transaction" ("business_date")
  where "entity_id" is null;

-- ------------------------------------------------------------ CTR filings
--
-- One row per (person, business day) whose aggregate crossed the threshold.
create table if not exists "core"."ctr_filing" (
  "id" text primary key,
  "entity_id" text not null,
  "business_date" date not null,

  "cash_in_total" bigint not null default 0,
  "cash_out_total" bigint not null default 0,

  "threshold_crossed_at" timestamptz not null,
  -- 31 CFR 1010.306(a)(1): 15 calendar days from the transaction date.
  "filing_due_at" timestamptz not null,

  "filed_at" timestamptz,
  "filed_by" text,
  "fincen_ref" text,

  -- Phase I / Phase II exemptions. Recorded, not evaluated — see OQ-13.
  "exemption_basis" text,

  "provenance" text not null default 'unknown'
    check ("provenance" in ('production', 'demo', 'unknown')),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),

  -- one filing per person per day; a second threshold crossing on the same day
  -- amends the existing obligation rather than creating a duplicate
  constraint "uq_ctr_entity_date" unique ("entity_id", "business_date")
);

-- A filed CTR must say where it went. An unreferenced "filed" row is the
-- compliance equivalent of a control that leaves no evidence.
alter table "core"."ctr_filing" drop constraint if exists "ck_ctr_filed_has_ref";
alter table "core"."ctr_filing"
  add constraint "ck_ctr_filed_has_ref"
  check ("filed_at" is null or ("filed_by" is not null and "fincen_ref" is not null));

comment on constraint "ck_ctr_filed_has_ref" on "core"."ctr_filing" is
  'A CTR marked filed must carry the filer and the FinCEN reference. Claiming a filing with no evidence of transmission is worse than an unfiled CTR, because it stops the overdue sweep from finding it.';

-- The overdue sweep's predicate: crossed the threshold, deadline passed, never
-- filed. This is the NEGATIVE — a CTR that was owed and nobody filed produces
-- no event of its own.
create index if not exists "idx_ctr_overdue"
  on "core"."ctr_filing" ("filing_due_at")
  where "filed_at" is null;

create index if not exists "idx_ctr_entity_date" on "core"."ctr_filing" ("entity_id", "business_date");

-- ---------------------------------------------------------------- sim mirrors
--
-- Structuring that spans days cannot be produced by waiting either — the
-- pattern needs a week of history. Same reasoning as retention.
create table if not exists "sim"."cash_transaction" (like "core"."cash_transaction" including defaults including indexes);
create table if not exists "sim"."ctr_filing" (like "core"."ctr_filing" including defaults including indexes);

do $$
declare t text;
begin
  foreach t in array array['cash_transaction', 'ctr_filing'] loop
    execute format('alter table "sim".%I alter column "provenance" set default ''simulated''', t);
    execute format('alter table "sim".%I drop constraint if exists %I', t, 'ck_' || t || '_provenance');
    execute format(
      'alter table "sim".%I add constraint %I check ("provenance" = ''simulated'')',
      t, 'ck_sim_' || t || '_provenance');
  end loop;
end $$;

grant all privileges on "core"."cash_transaction", "core"."ctr_filing" to "service_role";
grant all privileges on "sim"."cash_transaction", "sim"."ctr_filing" to "service_role";

notify pgrst, 'reload schema';
