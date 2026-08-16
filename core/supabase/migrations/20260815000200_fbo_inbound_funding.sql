-- Inbound FBO funding — TODO §6's last open question, answered 2026-08-15.
--
-- HOW A FINTECH'S FBO GETS FUNDED (Lorenzo): by the fintech itself, and by
-- ACH pulls against its end users' external accounts. Two codes, because they
-- are two different things arriving by two different routes and BSA cares
-- about exactly one of them:
--
--   ach_pull.settled     an ACH debit against an END USER's external account
--                        settles, crediting the FBO. This is an end-user
--                        transaction, so it is `x-money` — the BSA approver
--                        must see it for CTR and structuring the same way it
--                        sees outbound settlement. Until now the aggregator's
--                        transaction monitoring was outbound-only, which is a
--                        blind side no reviewer would accept.
--
--   fbo_funding.settled  the FINTECH funds its own FBO from its treasury.
--                        Deliberately NOT `x-money`: this is a program-level
--                        movement between institutions, not a transaction by
--                        or for a member, and running it through the CTR
--                        branch would fire an alert on every large top-up and
--                        bury the real ones. It moves the position and nothing
--                        else. Flagged for confirmation in TODO §6 — it is the
--                        one judgment call in this migration.
--
--                        Rail-agnostic on purpose: "the fintech funds it" did
--                        not specify wire vs ACH credit, and inventing a rail
--                        in the code name would encode a guess. If the rail
--                        turns out to matter (it will for OFAC and for the
--                        travel rule on wires), split it then.
--
-- Both are `x-fbo: inbound`. With them registered, the corrected position
-- stops being outflow-only by construction — see 20260815000100 for why it
-- ran negative without them.
--
-- Neither code is emitted yet: no inbound rail is built. Registering ahead of
-- emission is the direction the repo's rules run (check_emitted_coverage.py
-- fails on emitted-but-unregistered, never the reverse), and it means the
-- first inbound event to arrive credits the right instance instead of being
-- silently ignored by a consumer that had never heard of it.

-- ach_pull.settled joins the x-money set: inbound end-user money is money.
-- Mirrors x-money in core/core-api.yaml; scripts/check_money_codes.py gates it.
create or replace function "aggregator".is_money_code(c text) returns boolean
language sql immutable as $$
  select c in ('transfer.settled', 'wire_transfer.completed', 'ach_transfer.settled',
               'card_authorization.captured', 'ach_pull.settled')
$$;

-- Both inbound codes credit the position. Mirrors x-fbo in core/core-api.yaml.
create or replace function "aggregator".fbo_delta(c text) returns integer
language sql immutable as $$
  select case
    when c in ('ach_transfer.settled', 'wire_transfer.completed',
               'card_authorization.captured') then -1
    when c in ('ach_transfer.returned', 'wire_transfer.returned',
               'ach_pull.settled', 'fbo_funding.settled') then 1
    else 0
  end
$$;

notify pgrst, 'reload schema';
