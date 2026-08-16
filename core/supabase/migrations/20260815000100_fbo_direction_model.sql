-- The FBO position direction model — TODO §6, decided 2026-08-15.
--
-- WHAT WAS WRONG. `aggregator.fbo_position` is the per-fintech FBO balance:
-- Pynthia is a chartered narrow bank, the deposits sit on our own balance
-- sheet, and each integrating fintech has an FBO account with us holding its
-- end users' money. Every other part of the aggregator already agreed —
-- `fbo_read` computes `available = position - held reserves` and
-- `accept_origination` does `position_cents - amount_cents`, both of which
-- say plainly that position is a balance and spending reduces it.
--
-- `run_payment_hub` disagreed. It applied `position_cents + amount_cents` for
-- every money code, and all four money codes are outbound settlements, so
-- SENDING money increased the balance. On the live instance that is the whole
-- of `inst_local`'s +$1,927,341 position: it is a sum of outflows.
--
-- WHY THE SIGN FLIP ALONE WAS NOT THE FIX. Three findings, re-measured
-- against `aggregator.event` (the stream this consumer actually reads —
-- §6's original numbers were taken from `core.event`, a separate stream with
-- no bridge into this one):
--
--   1. `transfer.settled` is an on-us book transfer between internal accounts
--      (spec Decision 8). Within one fintech's FBO it nets to zero, so it is
--      a CATEGORY error, not a sign error — flipping it would be wrong in the
--      other direction. It is the largest contributor: 313 events,
--      $1,456,341 of the position.
--   2. `ach_transfer.returned` and `wire_transfer.returned` carry
--      `amount_cents` but had no FBO effect, so $273,000 of reversals were
--      invisible to the position.
--   3. There is still NO inbound funding code in `x-events`. Nothing credits
--      an FBO, so the corrected position runs negative until one exists. That
--      is the honest signal, and it is deliberate — see TODO §6.
--
-- THE MODEL. Direction is declared in the spec (`x-fbo` on the `x-events`
-- entry) and mirrored here; `scripts/check_money_codes.py` fails the build if
-- the two drift, the same rule the `x-money` allowlist already follows.
--
-- Note this is a SECOND axis, deliberately not folded into `is_money_code`.
-- That allowlist is shared with `run_bsa_approver`, where it drives CTR and
-- structuring detection. Dropping `transfer.settled` from it to neutralise
-- the position would have blinded CTR to on-us transfers, and adding the
-- return codes would have minted CTR alerts for reversals. `x-money` keeps
-- meaning "money moved, BSA cares"; `x-fbo` means "and this is how the
-- position moves".
--
-- KNOWN LIMITATION, stated rather than assumed: `transfer.settled` nets to
-- zero only when both legs live in the SAME fintech's FBO. Its payload
-- carries `source_account_id`/`destination_account_id` but the aggregator has
-- no account -> instance mapping, and an ingested event is attributed to the
-- single instance on its JWT, so a cross-fintech transfer cannot be
-- represented at all today. `internal` is right for every transfer the model
-- can currently express.

-- -1 debits the FBO (money left), +1 credits it (money came back or came in),
-- 0 has no effect on the position. Mirrors x-fbo in core/core-api.yaml.
create or replace function "aggregator".fbo_delta(c text) returns integer
language sql immutable as $$
  select case
    when c in ('ach_transfer.settled', 'wire_transfer.completed',
               'card_authorization.captured') then -1
    when c in ('ach_transfer.returned', 'wire_transfer.returned') then 1
    else 0
  end
$$;

-- The hub now applies a SIGNED delta and skips codes with no FBO effect.
-- Everything else about it is unchanged from 20260720000400, including the
-- liveness stamp (a run that found nothing is still evidence of liveness).
create or replace function "aggregator".run_payment_hub(batch integer default 100)
returns jsonb language plpgsql as $$
declare
  cur bigint;
  processed integer := 0;
  applied integer := 0;
  max_seq bigint;
  delta integer;
  r record;
begin
  insert into "aggregator"."consumer_cursor" ("consumer") values ('payment_hub')
    on conflict ("consumer") do nothing;
  select last_seq into cur from "aggregator"."consumer_cursor"
    where consumer = 'payment_hub' for update;

  for r in
    select sequence_id, instance_id, code, payload
    from "aggregator"."event"
    where sequence_id > cur
    order by sequence_id
    limit batch
  loop
    processed := processed + 1;
    max_seq := r.sequence_id;
    delta := "aggregator".fbo_delta(r.code);
    if delta <> 0 and (r.payload ? 'amount_cents') then
      insert into "aggregator"."fbo_position" as f
        ("instance_id", "position_cents", "last_seq")
      values (r.instance_id,
              (r.payload->>'amount_cents')::bigint * delta,
              r.sequence_id)
      on conflict ("instance_id") do update set
        position_cents = f.position_cents + excluded.position_cents,
        last_seq = excluded.last_seq,
        updated_at = now();
      applied := applied + 1;
    end if;
  end loop;

  -- liveness: every run stamps the cursor, advanced or not
  update "aggregator"."consumer_cursor"
    set last_seq = coalesce(max_seq, last_seq), updated_at = now()
    where consumer = 'payment_hub';

  return jsonb_build_object('consumer', 'payment_hub',
                            'processed', processed, 'applied', applied,
                            'cursor', coalesce(max_seq, cur));
end $$;

notify pgrst, 'reload schema';
