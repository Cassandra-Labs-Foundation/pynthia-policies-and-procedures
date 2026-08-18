-- Dead Blnk integration surface — review of 2026-08-17.
--
-- Each of these was declared by the Phase-1 mapping layer (20260702000500)
-- against a plan that was never finished, and each has since been carrying
-- live plumbing for something no writer produces. All four are EMPTY on the
-- live core, verified before this migration was written — this removes
-- mechanism, not history.
--
--   core.inbound_payment          0 rows, no writer in api/, no operation in
--                                 core-api.yaml — yet it sits in blnk-webhook's
--                                 routing map AND blnk-reconcile's missing-
--                                 mirror allowlist, so both functions have been
--                                 reconciling a table nothing can write.
--   core.entity.blnk_identity_id  0 rows. `createIdentity()` exists in the Blnk
--                                 client with ZERO call sites, so no identity is
--                                 ever created — while the webhook still handled
--                                 `identity.created` for the objects we never
--                                 make. Consuming an event for an object you
--                                 never create is a mirror of nothing.
--   core.verification.blnk_tokenized  0 rows, and ZERO references anywhere in
--                                 the codebase. A column that no line of code
--                                 has ever mentioned.
--
-- `bankLedgerId()` goes with them, in code: the plan gave the Bank Ledger the
-- FBO/settlement balances, nothing ever passed a ledgerId, and 20260817000100
-- settled the FBO position as a roll-up of member balances — so the second
-- ledger has no remaining purpose to be built toward.

drop table if exists "core"."inbound_payment";

alter table "core"."entity" drop column if exists "blnk_identity_id";
alter table "core"."verification" drop column if exists "blnk_tokenized";

notify pgrst, 'reload schema';
