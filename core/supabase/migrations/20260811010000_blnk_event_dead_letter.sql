-- blnk_event: bounded re-dispatch, so a permanently-unresolvable delivery stops
-- being re-driven forever.
--
-- sweepInbox re-drives every row in ('received','failed') older than the grace
-- period, with no attempt cap. A row whose failure can NEVER clear — a synthetic
-- id with no core row, an unusable payload — is therefore re-dispatched every 5
-- minutes indefinitely. Two July 2026 test rows ran that way for three and a half
-- weeks, and each one permanently inflated the `failed` count that trips
-- blnk.inbox_backlog, so the alarm drifts toward crying wolf exactly as real
-- traffic starts.
--
-- `attempts` counts re-dispatch failures; `dead_letter` is a terminal status the
-- sweep does not pick up. Dead-lettering is deliberately loud, not silent: the
-- sweep opens a core.finding for each row it parks, because "we stopped retrying
-- this" is a thing someone has to own.

alter table core.blnk_event
  add column if not exists attempts integer not null default 0;

comment on column core.blnk_event.attempts is
  'Re-dispatch failures so far. At INBOX_MAX_ATTEMPTS the row is parked as dead_letter.';

alter table core.blnk_event
  drop constraint if exists blnk_event_status_check;

alter table core.blnk_event
  add constraint blnk_event_status_check
  check (status = any (array['received', 'processed', 'failed', 'skipped', 'dead_letter']));

-- The sweep's hot path: non-terminal rows, oldest first.
create index if not exists blnk_event_sweep_idx
  on core.blnk_event (status, received_at)
  where status in ('received', 'failed');
