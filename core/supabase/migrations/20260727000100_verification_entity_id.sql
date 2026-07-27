-- core.verification records WHO was verified nowhere.
--
-- The KYC handler builds the row, inserts it, and then returns `entity_id` to
-- the caller in its 201 body — a field that was never on the row and never
-- stored. The only surviving link is core.event.payload->>'entity_id', on an
-- append-only stream that is not a join target. So "show me this member's KYC
-- and OFAC history", the central Member Services question, has no query.
--
-- This is not a latent problem. It has already cost twice:
--
--   * bsa_program.ts carries a comment explaining that sending a phantom
--     entity_id fails the WHOLE upsert with PGRST204, "which is how BSA-03's
--     evidence row silently never landed live while every event still emitted".
--     The workaround was a deterministic id, cipv_<entity_ref>.
--   * privacy.ts still sends entity_id on its biometric upsert. That write has
--     therefore never succeeded: core.verification holds 179 kyc, 170
--     estate_claimant and 1 cip_documentary row, and ZERO biometric rows. The
--     column being absent is the reason.
--
-- Adding the column fixes the second of those on the spot.
--
-- WHAT THE BACKFILL DELIBERATELY DOES NOT DO
--
-- estate_claimant rows are left NULL, and that is the point of doing this by
-- type rather than by a single clever join. core.estate_claim has both
-- entity_id and verification_id, so a join is available and would populate all
-- 170. It would also be WRONG: estate_claim.entity_id is the DECEASED MEMBER,
-- while the verification it points at verifies the CLAIMANT — a different
-- person, who may not be an entity at all (claimant is a jsonb blob).
-- Backfilling from it would have Member Services report "this member was
-- identity-verified" on the strength of verifying someone claiming against
-- their estate. A null is the honest answer; a plausible wrong id is not.
--
-- Verifying the claimant needs its own subject reference. Out of scope here,
-- and left null rather than approximated.

alter table "core"."verification" add column if not exists "entity_id" text;
alter table "sim"."verification" add column if not exists "entity_id" text;

comment on column "core"."verification"."entity_id" is
  'The entity this verification is ABOUT. Null on estate_claimant rows: those '
  'verify a claimant against the estate, not the member on the claim — see '
  '20260727000100. Nullable because 171 pre-existing rows have no recoverable '
  'subject and inventing one would be worse than admitting it.';

-- Both backfills below require the entity to actually EXIST. No foreign key is
-- added here (171 rows would have to stay null under one, and estate_claimant
-- deliberately does), so nothing but this predicate stops a dangling id from
-- being written — and a dangling id is worse than a null: a null renders as
-- "unknown", a dangling one renders as a member who does not exist.
--
-- It is not hypothetical. The single cip_documentary row is cipv_ent_cip1,
-- decoding to ent_cip1, which is not in core.entity — a drill artifact. It
-- stays null. All 179 kyc payload ids do resolve, and are taken.

-- kyc: the event payload carries the entity the handler had in hand and threw
-- away. This is the faithful source — the same value the 201 response returned.
update "core"."verification" v
   set "entity_id" = e."payload"->>'entity_id'
  from "core"."event" e
 where e."resource_id" = v."id"
   and e."type" = 'verification'
   and e."payload"->>'entity_id' is not null
   and v."entity_id" is null
   and exists (
     select 1 from "core"."entity" x where x."id" = e."payload"->>'entity_id'
   );

-- cip_documentary: no event payload, but bsa_program.ts mints a DETERMINISTIC
-- id precisely because it could not store the link — cipv_<entity_ref>. That
-- prefix is the linkage, so it is read back where it resolves.
update "core"."verification" v
   set "entity_id" = substring(v."id" from 6)
 where v."type" = 'cip_documentary'
   and v."id" like 'cipv\_%'
   and v."entity_id" is null
   and exists (
     select 1 from "core"."entity" x where x."id" = substring(v."id" from 6)
   );

-- Member Services reads this per member; without the index that is a seq scan
-- of every verification the institution has ever run.
create index if not exists "ix_verification_entity_id"
  on "core"."verification" ("entity_id")
  where "entity_id" is not null;

notify pgrst, 'reload schema';
