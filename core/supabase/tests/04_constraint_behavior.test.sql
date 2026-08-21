-- Constraint BEHAVIOR — the guarantees docs/drill.md says the hermetic drill
-- cannot exercise, exercised for real.
--
-- Hand-authored (unlike 00-03, which are generated from controls.json — this
-- file is NOT produced by gen_tests.py and is safe to edit). Each case
-- attempts the forbidden write and asserts Postgres refuses it with the
-- expected SQLSTATE, via pgTAP's throws_ok (which runs the statement inside
-- its own savepoint, so one refusal cannot poison the transaction):
--
--   23503  foreign_key_violation      fk_cash_transaction_entity,
--                                     fk_account_entity_id (see note below),
--                                     fk_loan_party_application,
--                                     fk_entity_partner_id
--   23505  unique_violation           uq_ctr_entity_date,
--                                     uq_payment_approval_resource,
--                                     uq_aan_application
--   23502  not_null_violation         partner_id on core.entity / core.account
--   P0001  raise_exception            freeze_provenance, freeze_disposal,
--                                     freeze_attestation
--
-- NOTE: docs/drill.md calls the account->entity FK "fk_account_entity"; its
-- real name (20260719001300_account_entity_link.sql) is "fk_account_entity_id".
--
-- Positive companions (lives_ok) prove each seed shape is otherwise valid, so
-- a throw is attributable to the constraint under test rather than to an
-- unrelated defect in the insert.
--
-- Assumes a freshly-migrated schema (what `supabase test db` provides after
-- `supabase db reset`). Everything rolls back; nothing persists.

begin;
select plan(27);

-- ------------------------------------------------------------------- seeds
-- Plain inserts: these MUST succeed or the file aborts, which is the correct
-- failure mode for a broken seed.
insert into "core"."partner" ("id", "name", "instance_id")
  values ('t04_partner', 'constraint-behavior test partner', 't04_instance');
insert into "core"."entity" ("id", "partner_id", "status")
  values ('t04_entity', 't04_partner', 'active');
insert into "core"."loan_application" ("id") values ('t04_app');

-- ------------------------------------- fk_cash_transaction_entity (23503)
select lives_ok(
  $$insert into "core"."cash_transaction" ("id", "direction", "amount", "business_date", "entity_id")
    values ('t04_cash_ok', 'cash_in', 500000, current_date, 't04_entity')$$,
  'cash_transaction: insert attributed to a real entity is accepted');
select throws_ok(
  $$insert into "core"."cash_transaction" ("id", "direction", "amount", "business_date", "entity_id")
    values ('t04_cash_bad', 'cash_in', 500000, current_date, 't04_no_such_entity')$$,
  '23503', null,
  'fk_cash_transaction_entity: currency cannot be attributed to a nonexistent person');

-- ---------------------------------------- fk_account_entity_id (23503)
select lives_ok(
  $$insert into "core"."account" ("id", "status", "partner_id", "entity_id")
    values ('t04_acct_ok', 'open', 't04_partner', 't04_entity')$$,
  'account: insert linked to a real owning entity is accepted');
select throws_ok(
  $$insert into "core"."account" ("id", "status", "partner_id", "entity_id")
    values ('t04_acct_bad', 'open', 't04_partner', 't04_no_such_entity')$$,
  '23503', null,
  'fk_account_entity_id: an account cannot claim a nonexistent owner');

-- ------------------------------------- fk_loan_party_application (23503)
select lives_ok(
  $$insert into "core"."loan_party" ("id", "loan_application_id", "role", "party_name")
    values ('t04_party_ok', 't04_app', 'borrower', 'Pat Borrower')$$,
  'loan_party: insert against a real application is accepted');
select throws_ok(
  $$insert into "core"."loan_party" ("id", "loan_application_id", "role", "party_name")
    values ('t04_party_bad', 't04_no_such_app', 'borrower', 'Ghost Borrower')$$,
  '23503', null,
  'fk_loan_party_application: a party cannot attach to a nonexistent application');

-- ------------------------------------------ uq_ctr_entity_date (23505)
select lives_ok(
  $$insert into "core"."ctr_filing" ("id", "entity_id", "business_date", "threshold_crossed_at", "filing_due_at")
    values ('t04_ctr_1', 't04_entity', date '2026-07-19', timestamptz '2026-07-19 12:00Z', timestamptz '2026-08-03 12:00Z')$$,
  'ctr_filing: first filing for (person, business day) is accepted');
select throws_ok(
  $$insert into "core"."ctr_filing" ("id", "entity_id", "business_date", "threshold_crossed_at", "filing_due_at")
    values ('t04_ctr_2', 't04_entity', date '2026-07-19', timestamptz '2026-07-19 13:00Z', timestamptz '2026-08-03 13:00Z')$$,
  '23505', null,
  'uq_ctr_entity_date: a second crossing on the same day must amend, not duplicate');

-- --------------------------------- uq_payment_approval_resource (23505)
select lives_ok(
  $$insert into "core"."payment_approval" ("id", "resource_type", "resource_id", "created_by", "basis")
    values ('t04_pa_1', 'wire_transfer', 't04_wire', 'maker@t04', 'over dual-control threshold')$$,
  'payment_approval: first four-eyes record for a resource is accepted');
select throws_ok(
  $$insert into "core"."payment_approval" ("id", "resource_type", "resource_id", "created_by", "basis")
    values ('t04_pa_2', 'wire_transfer', 't04_wire', 'maker2@t04', 'over dual-control threshold')$$,
  '23505', null,
  'uq_payment_approval_resource: one resource cannot carry two approval records');

-- ------------------------------------------ uq_aan_application (23505)
select lives_ok(
  $$insert into "core"."adverse_action_notice" ("id", "loan_application_id", "application_completed_at", "notice_due_at", "reasons")
    values ('t04_aan_1', 't04_app', timestamptz '2026-07-01 00:00Z', timestamptz '2026-07-31 00:00Z', '["insufficient income"]'::jsonb)$$,
  'adverse_action_notice: first AAN for an application is accepted');
select throws_ok(
  $$insert into "core"."adverse_action_notice" ("id", "loan_application_id", "application_completed_at", "notice_due_at", "reasons")
    values ('t04_aan_2', 't04_app', timestamptz '2026-07-01 00:00Z', timestamptz '2026-07-31 00:00Z', '["credit history"]'::jsonb)$$,
  '23505', null,
  'uq_aan_application: an application cannot accumulate duplicate AAN obligations');

-- ------------------------------------------- freeze_provenance (P0001)
insert into "core"."record"
  ("id", "record_class", "subject_ref", "retention_anchor", "retention_anchor_kind", "retention_expires_at")
  values ('t04_rec', 'cip_identity', 'account:t04_acct_ok',
          timestamptz '2026-01-01 00:00Z', 'account.closed', timestamptz '2031-01-01 00:00Z');
select throws_ok(
  $$update "core"."record" set "provenance" = 'production' where "id" = 't04_rec'$$,
  'P0001',
  'provenance is immutable (unknown -> production): a row cannot change where it came from',
  'freeze_provenance: a row cannot be relabelled as production after the fact');
select lives_ok(
  $$update "core"."record" set "legal_hold_flag" = true, "legal_hold_id" = 't04_hold' where "id" = 't04_rec'$$,
  'freeze_provenance: non-provenance columns on the same row remain updatable');

-- --------------------------------------------- freeze_disposal (P0001)
-- A legitimately-disposed record: retention expired, approval preceded
-- disposal, no hold — every CHECK satisfied, so the only thing refusing the
-- reversal below is the trigger.
insert into "core"."record"
  ("id", "record_class", "subject_ref", "retention_anchor", "retention_anchor_kind", "retention_expires_at",
   "disposal_approved_by", "disposal_approved_at", "disposed_at")
  values ('t04_rec_disposed', 'cip_identity', 'account:t04_acct_ok',
          timestamptz '2020-01-01 00:00Z', 'account.closed', timestamptz '2025-01-01 00:00Z',
          'records-admin@t04', timestamptz '2025-02-01 00:00Z', timestamptz '2025-02-02 00:00Z');
select throws_ok(
  $$update "core"."record" set "disposed_at" = null where "id" = 't04_rec_disposed'$$,
  'P0001', null,
  'freeze_disposal: a destroyed record cannot be made to look extant again');
select throws_ok(
  $$update "core"."record" set "disposed_at" = timestamptz '2026-01-01 00:00Z' where "id" = 't04_rec_disposed'$$,
  'P0001', null,
  'freeze_disposal: a disposal timestamp cannot be re-dated either');

-- ------------------------------------------ freeze_attestation (P0001)
insert into "core"."attestation" ("id", "control_uid", "statement", "attested_by")
  values ('t04_att', 'director-fiduciary-duties:DF-01', 'I reviewed the thing.', 'director@t04');
select throws_ok(
  $$update "core"."attestation" set "statement" = 'I reviewed a different thing.' where "id" = 't04_att'$$,
  'P0001',
  'attestations are append-only: t04_att cannot be modified after it was made',
  'freeze_attestation: an attestation cannot be edited');
select throws_ok(
  $$delete from "core"."attestation" where "id" = 't04_att'$$,
  'P0001',
  'attestations are append-only: t04_att cannot be modified after it was made',
  'freeze_attestation: an attestation cannot be deleted');

-- -------------------- partner ownership: NOT NULL + FK to core.partner
select throws_ok(
  $$insert into "core"."entity" ("id", "status") values ('t04_orphan_entity', 'active')$$,
  '23502', null,
  'entity.partner_id NOT NULL: an unowned member row is unrepresentable');
select throws_ok(
  $$insert into "core"."entity" ("id", "partner_id", "status") values ('t04_bad_owner', 't04_no_such_partner', 'active')$$,
  '23503', null,
  'fk_entity_partner_id: an entity cannot claim a partner this instance does not host');
select throws_ok(
  $$insert into "core"."account" ("id", "status") values ('t04_orphan_acct', 'open')$$,
  '23502', null,
  'account.partner_id NOT NULL: an unowned account row is unrepresentable');
select throws_ok(
  $$insert into "core"."account" ("id", "status", "partner_id") values ('t04_bad_owner_acct', 'open', 't04_no_such_partner')$$,
  '23503', null,
  'fk_account_partner_id: an account cannot claim a partner this instance does not host');

-- ------------------------------ ck_account_type_vocabulary (23514)
-- account_type drives NCUA 5300 share-line bucketing (ui/src/lib/ncua5300.js),
-- and was unconstrained free text until migration 20260816000100. Migration
-- 20260821000100 then made the vocabulary charter-NEUTRAL: it names the deposit
-- product (checking, savings, money_market, certificate, ira, keogh) rather than
-- one regulator's nouns, because which line a product files on depends on the
-- filing institution's charter. The handler rejects bad values first; this
-- proves the table refuses them too, so a writer that bypasses the API cannot
-- mint a product no filing has a line for.
select throws_ok(
  $$insert into "core"."account" ("id", "status", "partner_id", "entity_id", "account_type")
    values ('t04_acct_badtype', 'open', 't04_partner', 't04_entity', 'brokerage')$$,
  '23514', null,
  'ck_account_type_vocabulary: an invented deposit product is unrepresentable');

-- THE NORMALISATION BOUNDARY, asserted from the storage side. POST /accounts
-- accepts the credit-union spellings share_draft / share / share_certificate
-- and rewrites them to checking / savings / certificate on write. Storage holds
-- one spelling per product, so the CU spelling arriving here means the handler
-- was bypassed — exactly the case this constraint exists to catch. Refusing it
-- is the assertion, not an oversight.
select throws_ok(
  $$insert into "core"."account" ("id", "status", "partner_id", "entity_id", "account_type")
    values ('t04_acct_alias', 'open', 't04_partner', 't04_entity', 'share_certificate')$$,
  '23514', null,
  'ck_account_type_vocabulary: a wire-only alias never reaches storage un-normalised');

select lives_ok(
  $$insert into "core"."account" ("id", "status", "partner_id", "entity_id", "account_type")
    values ('t04_acct_goodtype', 'open', 't04_partner', 't04_entity', 'certificate')$$,
  'the canonical spelling of a time deposit is accepted');

-- `savings` was refused before 20260821000100 as "a second spelling of share".
-- It is now the canonical name of the product, and share is the alias — the
-- inversion is the whole point of the charter-neutral vocabulary.
select lives_ok(
  $$insert into "core"."account" ("id", "status", "partner_id", "entity_id", "account_type")
    values ('t04_acct_savings', 'open', 't04_partner', 't04_entity', 'savings')$$,
  'savings is canonical now, not an alias');

-- NULL stays permitted on purpose (a CHECK passes on NULL): the deadline and
-- coverage suites insert accounts with no account_type at all, and closing
-- that hole is a contract change (making the field required), not a
-- constraint. Asserted so the allowance is a decision, not an oversight.
select lives_ok(
  $$insert into "core"."account" ("id", "status", "partner_id", "entity_id")
    values ('t04_acct_nulltype', 'open', 't04_partner', 't04_entity')$$,
  'account_type NULL is still accepted — deliberately, see 20260816000100');

select * from finish();
rollback;
