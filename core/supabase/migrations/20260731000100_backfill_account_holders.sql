-- Every account gets a holder, including the simulated ones.
--
-- 1,794 of this instance's 1,829 accounts carried entity_id NULL — created
-- through POST /accounts, whose entity_id is optional and defaults to null,
-- by seed and smoke traffic that never passed one. The consequence surfaced
-- in the teller UI: a transaction journal whose Member column could show
-- nothing but account ids, because for every transfer-carrying account there
-- was literally no member to name. A credit-union core simulating accounts
-- that no member holds is simulating something that cannot exist: CIP puts
-- identity before account opening, and every real account has a holder.
--
-- The fix is a deterministic assignment of existing members to the orphaned
-- accounts:
--
--   - Existing members only. entity_id carries a foreign key to core.entity
--     (20260719001300), and inventing entities here would fabricate people;
--     distributing accounts over the members the simulation already has
--     changes account rows alone.
--   - Deterministic, not random(). The account's own id is hashed (md5, so
--     the result does not depend on a Postgres build the way hashtext can)
--     to pick a member. Re-running the statement is a no-op twice over: the
--     WHERE clause only touches NULLs, and the same input hashes to the
--     same member.
--   - Guarded against an empty entity table. On a freshly reset instance
--     with no members, this backfills nothing rather than dividing by zero.
--
-- What this deliberately does NOT do: change POST /accounts to require
-- entity_id. Whether an account may ever exist unheld (operational/FBO
-- shapes) is an API-contract decision with its own blast radius across the
-- rails and tests, not something to smuggle into a data backfill.

with members as (
  select
    id,
    row_number() over (order by id) - 1 as idx,
    count(*) over () as n
  from "core"."entity"
),
orphans as (
  select
    a.id as account_id,
    -- first 8 hex chars of md5 -> int32 -> non-negative -> mod member count
    mod(
      ('x' || substr(md5(a.id), 1, 8))::bit(32)::int::bigint
        & 2147483647,
      (select n from members limit 1)
    ) as pick
  from "core"."account" a
  where a.entity_id is null
    and exists (select 1 from members)
)
update "core"."account" a
set entity_id = m.id
from orphans o
join members m on m.idx = o.pick
where a.id = o.account_id;

notify pgrst, 'reload schema';
