-- core.account.account_type becomes a closed vocabulary — TODO §3, 2026-08-16.
--
-- WHY. account_type was unconstrained free text, and api/accounts.ts
-- substitutes the literal 'checking' when a caller names no type. The result
-- is that 1,917 live accounts holding $55,455,245 all read 'checking' with no
-- way to tell a STATED product from an UNSTATED one — and that column is what
-- ui/src/lib/ncua5300.js buckets onto NCUA 5300 share lines. Signing off on
-- the checking -> 902 (Share Drafts) mapping therefore meant signing off on a
-- default value becoming a regulatory filing position.
--
-- This does not resolve that. It stops the ambiguity GROWING: from here a
-- caller must name a real credit-union share product, so the next 1,917
-- accounts carry an answer somebody chose. The mapping decision for the
-- existing rows stays open in TODO §3, deliberately.
--
-- THE VOCABULARY, and what is missing from it. The provisional map in
-- ncua5300.js also accepts 'savings' (same NCUA line as share, 657) and
-- 'certificate' (same as share_certificate, 908C). Two spellings of one line
-- is exactly the ambiguity this constraint exists to remove, so they are NOT
-- admitted here; no live account uses either, and both map entries become
-- unreachable once this lands — prune them when the chart of accounts is
-- signed off.
--
-- 'checking' is LEGACY. It stays only because the live rows carry it. It is
-- the one value in this list that does not name a credit-union product, and
-- the spec marks it as such.
--
-- NCUA lines, in the order written below: checking is the legacy default and
-- maps nowhere on its own (that is the open decision); share_draft 902,
-- share 657, money_market 911, share_certificate 908C, ira and keogh both
-- 906C.
--
-- NULL IS STILL PERMITTED, on purpose, and comes for free: a CHECK fails only
-- when its expression is FALSE, and `null in (...)` is unknown, so a row with
-- no account_type passes without an explicit `is null or` arm. That is the
-- behaviour wanted here — the pgTAP suites (03, 04) and the deadline fixtures
-- insert accounts with no account_type at all, and live data holds zero NULLs.
-- Making the column NOT NULL, or the field required on POST /accounts (the
-- OQ-12 treatment), is the follow-up that actually closes the "default masks
-- unset" hole, and it is a contract change rather than a constraint.
--
-- Written on ONE line with no inline comments because check_schema_parity.py
-- parses this shape directly (CHECK_RE, then a comma split) to decide whether
-- the spec's enum is enforced in storage. A prettier multi-line form with
-- trailing comments parses into garbage values and reports the column as
-- enum-unenforced — which is the gate telling the truth about a constraint it
-- cannot read, so the SQL bends to the parser rather than the reverse.
--
-- Verified before writing: zero live rows violate this (1,917 checking,
-- 1 share_certificate, 0 null), so the constraint is added VALIDATED rather
-- than NOT VALID.
alter table "core"."account" drop constraint if exists "ck_account_type_vocabulary";
alter table "core"."account"
  add constraint "ck_account_type_vocabulary"
  check ("account_type" in ('checking', 'share_draft', 'share', 'money_market', 'share_certificate', 'ira', 'keogh'));

comment on column "core"."account"."account_type" is
  'evidences TIS-04. Closed vocabulary (ck_account_type_vocabulary); mirrors the '
  'spec enum and api/accounts.ts ACCOUNT_TYPES. Drives NCUA 5300 share-line '
  'bucketing in ui/src/lib/ncua5300.js. `checking` is legacy — it is the default '
  'for a caller that named no product, so it does not evidence a chosen type.';

notify pgrst, 'reload schema';
