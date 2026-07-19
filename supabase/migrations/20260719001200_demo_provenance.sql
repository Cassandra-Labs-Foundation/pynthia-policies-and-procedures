-- Close the other half of the provenance gap.
--
-- 20260719000900 labelled HISTORICAL evidence `unknown` and made simulated
-- evidence unrepresentable in core. It left the future open: analytics/seed.sh
-- drives the deployed API specifically to "trip every control", and every row
-- it produced from that point on was stamped `production` — new demo evidence,
-- indistinguishable from the real thing. The guarantee was half-built.
--
-- WHY NOT JUST POINT seed.sh AT sim
--
-- Because it cannot be. The seed creates accounts and transfers, and those are
-- core BUSINESS rows, not evidence — sim only mirrors the evidence tables. A
-- transfer has to live in core.transfer or it is not a transfer.
--
-- And the control evaluations it produces are not fake: the gate really ran,
-- on real rows, with real arithmetic. What makes them unusable for a coverage
-- claim is not that the evaluation was simulated but that the TRAFFIC was
-- manufactured to trip controls, under a shared bootstrap credential that
-- cannot be attributed to any real actor.
--
-- So `demo` is its own provenance class, and the distinction is honest:
--
--   production  a real actor's request on this instance
--   demo        real control evaluation of deliberately manufactured traffic
--   unknown     written before provenance existed; origin unrecoverable
--   simulated   sim schema only; unrepresentable here
--
-- Only `production` may support a coverage claim. The crosswalk build already
-- hard-fails on anything else, so widening the enum does not widen what counts.

do $$
declare t text;
begin
  foreach t in array array[
    'control_result', 'bsa_alert', 'event', 'case', 'bookkeeping_entry',
    'filing', 'record'
  ] loop
    execute format(
      'alter table "core".%I drop constraint if exists %I', t, 'ck_' || t || '_provenance');
    execute format(
      'alter table "core".%I add constraint %I '
      'check ("provenance" in (''production'', ''demo'', ''unknown''))',
      t, 'ck_' || t || '_provenance');
  end loop;
end $$;

alter table "core"."legal_hold" drop constraint if exists "ck_legal_hold_provenance";
alter table "core"."legal_hold"
  add constraint "ck_legal_hold_provenance"
  check ("provenance" in ('production', 'demo', 'unknown'));

comment on column "core"."control_result"."provenance" is
  'production | demo | unknown. Only production may support a coverage claim. demo = a real control evaluation of traffic manufactured by analytics/seed.sh under the shared bootstrap credential. simulated is not permitted here — it lives in the sim schema.';

-- Retro-label what the bootstrap credential already wrote. Deliberately NOT
-- attempted: those rows are indistinguishable from real ones by construction
-- (that is the whole finding), so they stay `unknown` rather than being
-- reclassified on a guess. `demo` applies from here forward, where the writer
-- actually knows which credential it authenticated.

notify pgrst, 'reload schema';
