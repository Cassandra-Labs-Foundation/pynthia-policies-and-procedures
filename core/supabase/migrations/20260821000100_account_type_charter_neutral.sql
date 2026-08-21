-- account_type becomes charter-neutral — TODO §3, decided 2026-08-21.
--
-- WHY THE PREVIOUS ANSWER WAS SCOPED WRONG. 20260816000100 closed this
-- vocabulary to credit-union share products and excluded 'savings' and
-- 'certificate' on the grounds that "two spellings of one NCUA line is exactly
-- the ambiguity this constraint exists to remove". That reasoning holds only
-- while NCUA 5300 is the only form this core will ever produce. `checking` and
-- `share_draft` are not two spellings of one line: they are two CHARTERS'
-- names for one product, and the line it reports on is a function of who is
-- filing. A bank has no share drafts at all — its transaction deposits land on
-- FFIEC Call Report Schedule RC-E, which has no line 902 anywhere in it.
--
-- This core already settled the same argument once, for a different list, in
-- 20260719002700: "THE PERMISSIBLE-INSTRUMENT LIST IS DATA, NOT CODE ... a
-- federally insured state-chartered credit union operates under a different
-- list." A product vocabulary that hardcodes one regulator's nouns is the same
-- mistake at a different table.
--
-- WHAT IS CANONICAL NOW. Six products, named in the vocabulary that generalises
-- across charters:
--
--     checking        transaction / demand deposit   (CU: share draft)
--     savings         regular savings                (CU: share)
--     money_market    money market                   (CU: money market share)
--     certificate     time deposit                   (CU: share certificate)
--     ira, keogh      retirement                     (identical both ways —
--                                                     these are tax
--                                                     constructs, not charter
--                                                     constructs)
--
-- The three credit-union spellings stay accepted ON THE WIRE and normalise on
-- write (api/accounts.ts); they are in the POST /accounts request enum and
-- deliberately NOT here, because storing both spellings is how you get back
-- the ambiguity 20260816000100 was right to be worried about. An institution
-- integrates in its own vocabulary; the core holds one.
--
-- WHICH LINE A PRODUCT FILES ON IS NOT DECIDED HERE, and that is the point.
-- The NCUA 5300 map (checking/share_draft -> 902, savings/share -> 657, and so
-- on) lives in ui/src/lib/ncua5300.js and is correct for a federally insured
-- credit union. A second charter needs a second map, keyed by charter, moved
-- out of the browser bundle — the follow-up recorded in TODO §3, blocked on
-- the institution-parameters sign-off that would say what charter this is.
--
-- ROWS. 1,946 accounts read 'checking' and are already canonical; 1 reads
-- 'share_certificate' and is rewritten to 'certificate'. Every one of them
-- belongs to ptnr_demo or ptnr_drill — this core has never opened a member
-- account — so unlike OQ-12's 3 quarantined NULL entity_id rows there is no
-- history here to refuse to fabricate. The UPDATE runs before the constraint
-- so the constraint can be added VALIDATED.
--
-- 'checking' IS NO LONGER LEGACY. It stops being the residue of a default and
-- becomes the canonical name of a real product, because the hole it named is
-- closed on the other side: account_type is REQUIRED on POST /accounts as of
-- this change (the OQ-12 treatment), so no future row carries it by omission.
-- That is what actually distinguishes a stated product from an unstated one; a
-- CHECK can only stop invented values.
--
-- The CHECK is written on ONE line with no inline comments because
-- check_schema_parity.py parses this shape directly (CHECK_RE, then a comma
-- split) to decide whether the spec's enum is enforced in storage. A prettier
-- multi-line form parses into garbage and reports the column as
-- enum-unenforced — the gate telling the truth about a constraint it cannot
-- read, so the SQL bends to the parser rather than the reverse.

-- ORDER MATTERS, and the first attempt at this migration got it wrong: the
-- rewrites below move rows to values the OLD constraint does not admit, so
-- running them first fails on `certificate` mid-statement. Drop, rewrite, then
-- re-add — the table is unconstrained only for the width of this transaction.
alter table "core"."account" drop constraint if exists "ck_account_type_vocabulary";

update "core"."account" set "account_type" = 'checking'    where "account_type" = 'share_draft';
update "core"."account" set "account_type" = 'savings'     where "account_type" = 'share';
update "core"."account" set "account_type" = 'certificate' where "account_type" = 'share_certificate';

alter table "core"."account"
  add constraint "ck_account_type_vocabulary"
  check ("account_type" in ('checking', 'savings', 'money_market', 'certificate', 'ira', 'keogh'));

comment on column "core"."account"."account_type" is
  'evidences TIS-04. Closed, charter-neutral vocabulary (ck_account_type_vocabulary); '
  'mirrors the spec enum on components/schemas/Account and api/accounts.ts ACCOUNT_TYPES. '
  'POST /accounts also accepts the credit-union spellings share_draft/share/share_certificate '
  'and normalises them to checking/savings/certificate on write. Required on create since '
  '2026-08-21, so a value here is a product somebody chose. Which NCUA 5300 or FFIEC line it '
  'files on is a function of this product AND the institution charter, and is not encoded here.';

notify pgrst, 'reload schema';
