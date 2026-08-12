-- EPS-05 defect fix (TODO §5 follow-up, the worst of the four): the lockout
-- counter read its prior state as max(failure_count) EVER for the subject —
-- cumulative, not consecutive. A success wrote a fresh zero row but the old
-- max still won the next read, so fail,fail,success,fail locked the member
-- out; and after any lockout the counter could never fall below the
-- threshold again, making every subsequent failure a lockout forever.
--
-- Ordering by created_at is not the fix: the drill's frozen clock (and any
-- same-millisecond burst) makes timestamp order arbitrary — that exact
-- nondeterminism is why the max(failure_count) read was written in the first
-- place. chain_seq is a per-subject monotonic attempt sequence: every attempt
-- (success or failure) takes prior chain_seq + 1, so "the latest attempt" is
-- a deterministic read in both the real database and the drill fake.

alter table "core"."eps_auth_event"
  add column if not exists "chain_seq" int not null default 0;

-- Backfill: within any existing chain, failure_count already rises
-- monotonically and success rows sit at 0, so failure_count is the best
-- available ordering for historical rows. The first post-migration attempt
-- reads max(chain_seq) and continues from there.
update "core"."eps_auth_event" set "chain_seq" = "failure_count" where "chain_seq" = 0;

comment on column "core"."eps_auth_event"."chain_seq" is
  'Per-subject monotonic attempt sequence. The latest attempt is max(chain_seq) — never order auth state by created_at (frozen drill clock / same-ms bursts) and never by failure_count alone (cumulative-lockout defect, fixed 2026-08-11).';
