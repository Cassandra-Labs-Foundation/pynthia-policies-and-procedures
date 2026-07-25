-- Blnk reconciler schedule: pg_cron + pg_net invoke the blnk-reconcile edge
-- function every 5 minutes (integration plan §6, poll/reconcile path — the
-- authoritative sync while Blnk Cloud webhooks are support-gated).
--
-- One-time operator setup (secret values never live in migrations):
--   1. In SQL:  select vault.create_secret('<random shared secret>', 'blnk_reconcile_key');
--   2. In CLI:  supabase secrets set RECONCILE_SECRET=<same value>
-- Until both exist the function answers 401 and the scheduled call is a no-op.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- idempotent re-schedule
do $$
begin
  if exists (select 1 from cron.job where jobname = 'blnk-reconcile') then
    perform cron.unschedule('blnk-reconcile');
  end if;
end $$;

select cron.schedule(
  'blnk-reconcile',
  '*/5 * * * *',
  $job$
  select net.http_post(
    url := 'https://jynsipdvrgqdkeqrlzcv.functions.supabase.co/blnk-reconcile',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Reconcile-Key',
      (select decrypted_secret from vault.decrypted_secrets where name = 'blnk_reconcile_key')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $job$
);
