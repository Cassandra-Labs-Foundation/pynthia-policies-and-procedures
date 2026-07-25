-- One more create-body casualty of the table collision class: core.trade
-- pre-existed (codegen schema), so its re-declaration's table-level
-- constraints never applied. The sod constraints were re-added by a later
-- alter; this one was not. Full constraint sweep found exactly this gap.
alter table "core"."trade" drop constraint if exists "ck_trade_reasons_match_decision";
alter table "core"."trade"
  add constraint "ck_trade_reasons_match_decision"
  check (("decision" = 'executed') = (jsonb_array_length("blocked_reasons") = 0));
