-- Card 16: events outbox + worker.
--
-- core.event is the outbox; these columns are its delivery ledger. NULL
-- delivered_at = pending; the worker marks it only on a 2xx from the target,
-- and failure reschedules via next_attempt_at (exponential backoff) — an
-- event is never lost, only delayed.
alter table "core"."event"
  add column if not exists "delivered_at" timestamptz,
  add column if not exists "delivery_attempts" integer not null default 0,
  add column if not exists "next_attempt_at" timestamptz;

comment on column "core"."event"."delivered_at" is
  'Set on a 2xx from the delivery target. NULL = still owed to the consumer (card 16).';

-- the worker's sweep: undelivered-and-due only
create index if not exists "idx_event_undelivered"
  on "core"."event" ("next_attempt_at", "created_at")
  where "delivered_at" is null;

-- every minute, one sweep — same vault-keyed pg_cron -> pg_net pattern as
-- blnk-reconcile. Operator setup (values never live in migrations):
--   select vault.create_secret('<DEMO_API_KEY>', 'event_worker_key');
-- Until the secret exists the call 401s and the schedule is a no-op.
create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'event-worker') then
    perform cron.unschedule('event-worker');
  end if;
end $$;

select cron.schedule(
  'event-worker',
  '* * * * *',
  $job$
  select net.http_post(
    url := 'https://jynsipdvrgqdkeqrlzcv.functions.supabase.co/api/events/deliver',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Api-Key',
      (select decrypted_secret from vault.decrypted_secrets where name = 'event_worker_key')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $job$
);
