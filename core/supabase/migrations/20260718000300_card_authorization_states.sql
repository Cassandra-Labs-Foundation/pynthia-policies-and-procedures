-- card_authorization.status was unconstrained free text: unlike wire_transfer
-- and ach_transfer, core-api.yaml declares no `x-states` and no enum for
-- CardAuthorization, so the generator emitted no CHECK. The state machine was
-- enforced nowhere -- any string could be written, and a typo ('captued') would
-- persist silently and then be invisible to every status-based query, including
-- the reconciler's non-terminal sweep.
--
-- The states below are INTRODUCED here (not derived from the spec) and follow
-- Blnk inflight semantics, which is what actually backs a card hold:
--
--   authorize            -> inflight hold placed        -> 'authorized'
--   capture (partial)    -> commit < held amount        -> 'partially_captured'
--   capture (full/final) -> commit up to held amount    -> 'captured'   (terminal)
--   decline              -> no hold ever placed         -> 'declined'   (terminal)
--   reversal             -> void the hold               -> 'reversed'   (terminal)
--   expiry               -> void the hold on expiry     -> 'expired'    (terminal)
--
-- 'partially_captured' is a real, non-terminal state rather than a rounding of
-- 'captured': Blnk permits multiple incremental commits against one hold up to
-- the held amount, so an authorization can sit partially captured and later
-- reach 'captured'. Collapsing the two would lose the still-held remainder.
-- Amounts committed so far are already tracked in blnk_committed_amount
-- (added in 20260702000500).
--
-- Safe to apply as a plain CHECK: the table is empty, so there is no legacy
-- value to grandfather.
alter table "core"."card_authorization"
  add constraint "card_authorization_status_check"
  check ("status" in (
    'authorized',
    'partially_captured',
    'captured',
    'declined',
    'reversed',
    'expired'
  ));

comment on column "core"."card_authorization"."status" is
  'Authorization lifecycle. authorized -> partially_captured -> captured; declined/reversed/expired are terminal. Introduced here; core-api.yaml declares no x-states for CardAuthorization.';

-- Matches the status/created_at indexes the other money-movement rails carry;
-- the reconciler sweeps non-terminal rows by status and date.
create index if not exists "idx_card_authorization_status"
  on "core"."card_authorization" ("status");
