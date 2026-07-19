-- Card 08: sandbox reset. One SECURITY DEFINER function truncates the
-- instance's mutable state so a test can start from a clean slate. Exposed
-- ONLY to service_role (the edge functions); anon/authenticated cannot touch
-- it. TRUNCATE rather than DELETE: instant, resets identity state, and cannot
-- leave half a slate on error (single statement, one lock scope).
--
-- Blnk caveat (documented on the card): Blnk Cloud has no wipe API, so ledger
-- HISTORY survives a reset. The endpoint voids outstanding inflight holds
-- before truncating, so no member funds stay stranded; fresh runs then mint
-- fresh accounts/balances, which is why harness volume accumulating in Blnk
-- was already the accepted norm.
create or replace function "core"."sandbox_reset"()
returns void
language plpgsql
security definer
set search_path = core
as $$
begin
  truncate table
    "core"."idempotency_keys",
    "core"."bookkeeping_entry",
    "core"."event",
    "core"."bsa_alert",
    "core"."control_result",
    "core"."card_authorization",
    "core"."ach_transfer",
    "core"."wire_transfer",
    "core"."transfer",
    "core"."account_number",
    "core"."account",
    "core"."blnk_event",
    "core"."blnk_sync_state";
end;
$$;

revoke all on function "core"."sandbox_reset"() from public;
grant execute on function "core"."sandbox_reset"() to service_role;

comment on function "core"."sandbox_reset"() is
  'Sandbox-only clean slate (card 08). Truncates instance state; Blnk ledger history is append-only and survives. service_role only.';
