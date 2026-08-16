-- The FBO position direction model (TODO §6), exercised against the real
-- migrated schema.
--
-- WHY THIS FILE EXISTS. run_payment_hub added outflows to an instance's FBO
-- position for a year — sending money made the balance go UP — and no test
-- caught it, because the only coverage the hub had (handler.test.ts) asserts
-- which RPC gets dispatched, never what the arithmetic does. Dispatch tests
-- cannot see a sign error. These can.
--
-- Every assertion below is behavioral: seed events, run the consumer, read
-- the position back.
begin;
select plan(16);

-- ---------------------------------------------------------------- fbo_delta
-- The direction map itself. scripts/check_money_codes.py already gates it
-- against the spec's x-fbo declarations; this checks the values are what the
-- model says rather than merely consistent with a mirror.
select is("aggregator".fbo_delta('ach_transfer.settled'), -1,
          'an outbound ACH settlement debits the FBO');
select is("aggregator".fbo_delta('wire_transfer.completed'), -1,
          'an outbound wire debits the FBO');
select is("aggregator".fbo_delta('card_authorization.captured'), -1,
          'a card capture debits the FBO');
select is("aggregator".fbo_delta('ach_transfer.returned'), 1,
          'a returned ACH credits the position back');
select is("aggregator".fbo_delta('wire_transfer.returned'), 1,
          'a returned wire credits the position back');
select is("aggregator".fbo_delta('transfer.settled'), 0,
          'an on-us book transfer nets to zero inside one fintech FBO');
select is("aggregator".fbo_delta('member.created'), 0,
          'a code with no FBO meaning has no FBO effect');

-- Inbound funding (20260815000200): the two ways a fintech's FBO gets money.
select is("aggregator".fbo_delta('ach_pull.settled'), 1,
          'an end-user ACH pull credits the FBO');
select is("aggregator".fbo_delta('fbo_funding.settled'), 1,
          'the fintech funding its own FBO credits it');

-- The x-money split is a compliance boundary, not a detail: an end-user pull
-- must reach the BSA approver's CTR/structuring branch, program treasury
-- funding must not (it would fire on every large top-up and bury real hits).
select ok("aggregator".is_money_code('ach_pull.settled'),
          'inbound end-user money IS money — the BSA approver must see it');
select ok(not "aggregator".is_money_code('fbo_funding.settled'),
          'program funding is NOT a member transaction — kept out of CTR');

-- ------------------------------------------------------------ the hub itself
-- A fresh instance, one of every directional code. Net expectation:
--   -$300 outbound  +$200 returned  +$0 on-us  +$50 pull  +$25 funding = -$25
insert into "aggregator"."event"
  (event_id, instance_id, code, payload, schema_version, received_at)
values
  ('evt_fbo_1', 'inst_pgtap', 'ach_transfer.settled',      '{"amount_cents": 10000}', 1, now()),
  ('evt_fbo_2', 'inst_pgtap', 'wire_transfer.completed',   '{"amount_cents": 10000}', 1, now()),
  ('evt_fbo_3', 'inst_pgtap', 'card_authorization.captured','{"amount_cents": 10000}', 1, now()),
  ('evt_fbo_4', 'inst_pgtap', 'ach_transfer.returned',     '{"amount_cents": 10000}', 1, now()),
  ('evt_fbo_5', 'inst_pgtap', 'wire_transfer.returned',    '{"amount_cents": 10000}', 1, now()),
  ('evt_fbo_6', 'inst_pgtap', 'transfer.settled',          '{"amount_cents": 10000}', 1, now()),
  ('evt_fbo_7', 'inst_pgtap', 'ach_pull.settled',          '{"amount_cents": 5000}',  1, now()),
  ('evt_fbo_8', 'inst_pgtap', 'fbo_funding.settled',       '{"amount_cents": 2500}',  1, now());

select lives_ok(
  $$ select "aggregator".run_payment_hub(1000) $$,
  'the payment hub runs over the seeded batch');

select is(
  (select position_cents from "aggregator"."fbo_position" where instance_id = 'inst_pgtap'),
  -2500::bigint,
  'position nets to -$25 across all eight codes, NOT the +$675 the old hub gave');

-- The regression this file is named for: under the old model every money code
-- added, so this batch would have read +$675. Assert the sign directly so a
-- future revert cannot pass by coincidence.
select cmp_ok(
  (select position_cents from "aggregator"."fbo_position" where instance_id = 'inst_pgtap'),
  '<', 0::bigint,
  'a batch that is net outbound leaves the position NEGATIVE');

-- Re-running is a no-op: the cursor advanced past these events. A consumer
-- that double-applied on re-run would silently double every position.
select lives_ok(
  $$ select "aggregator".run_payment_hub(1000) $$,
  'a second run over the same events is safe to issue');

select is(
  (select position_cents from "aggregator"."fbo_position" where instance_id = 'inst_pgtap'),
  -2500::bigint,
  're-running the hub changes nothing — the cursor is already past the batch');

select * from finish();
rollback;
