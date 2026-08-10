-- Dotted column names -> snake_case, where the convention already says so.
--
-- core.training and core.indemnification date from the first schema cut,
-- which stored corpus field tokens VERBATIM as column names — including the
-- dots ("proficiency.failed", "payment.disbursed"). Everything since has
-- normalised dot -> underscore: the spec's parity checker expects it (the
-- schema-parity baseline carries these as `missing-in-db`), the generated
-- pgTAP coverage suite asserts the snake_case names (10 todo() markers), and
-- PostgREST cannot address a dotted column in a JSON payload at all — a
-- writer for any of these columns is impossible until they are renamed.
--
-- No writer references the dotted names (grep: zero hits outside migrations),
-- and neither table has a sim mirror, so the rename is data-preserving and
-- reaches everything there is to reach. Plain statements, not a DO block:
-- check_schema_parity.py reads migrations statically and a rename it cannot
-- parse would leave the baseline stuck.

alter table "core"."training" rename column "proficiency.failed" to "proficiency_failed";

alter table "core"."indemnification" rename column "advance.disbursed" to "advance_disbursed";
alter table "core"."indemnification" rename column "advance.requested" to "advance_requested";
alter table "core"."indemnification" rename column "claim.notified" to "claim_notified";
alter table "core"."indemnification" rename column "decision_body.selected" to "decision_body_selected";
alter table "core"."indemnification" rename column "matter.resolved_favorably" to "matter_resolved_favorably";
alter table "core"."indemnification" rename column "payment.blocked" to "payment_blocked";
alter table "core"."indemnification" rename column "payment.disbursed" to "payment_disbursed";
alter table "core"."indemnification" rename column "repayment.demanded" to "repayment_demanded";
alter table "core"."indemnification" rename column "request.routed" to "request_routed";
alter table "core"."indemnification" rename column "standard_determination.made" to "standard_determination_made";

-- Same first-cut era, same class of fake-vs-real defect: core.address and
-- core.training kept uuid primary keys while every writer and fixture uses
-- deterministic text ids (hr.ts's `trn_<employee>_<course>` upsert key is the
-- convergence mechanism). The live tier refused every such row
-- ("invalid input syntax for type uuid"), which is how BA-08's and CP-12's
-- training inputs read as unsupplied. No FK references either table.
alter table "core"."address" alter column "id" drop default;
alter table "core"."address" alter column "id" type text;
alter table "core"."training" alter column "id" drop default;
alter table "core"."training" alter column "id" type text;
-- core.finding too: both its writers (ecommerce.ts `find_<id>`, the Blnk
-- webhook) key it with text ids, and the refused upsert aborted the whole
-- e-commerce risk-assessment handler before any of its events emitted.
alter table "core"."finding" alter column "id" drop default;
alter table "core"."finding" alter column "id" type text;
