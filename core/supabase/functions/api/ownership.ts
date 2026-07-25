// Row-level partner ownership — the enforcement half.
//
// Layered UNDER the instance binding (card 51), not replacing it:
//
//   authenticate()  — may this token act on this instance, at this endpoint?
//   this module     — may this partner touch THIS ROW?
//
// WHY THIS IS THE ONLY ENFORCEMENT LAYER. RLS would be the obvious second one
// and is deliberately not used: the edge functions connect as service_role,
// which bypasses row-level security entirely (20260702000800_core_grants.sql),
// so policies written today would enforce nothing and no test could exercise
// them. Two enforcement layers where one silently does nothing is worse than
// one layer that visibly does everything — the dormant one accrues trust it
// has not earned. The database still contributes, but as INTEGRITY rather than
// access control: partner_id is NOT NULL with a foreign key to core.partner,
// which service_role cannot violate either. The application decides access;
// the schema guarantees every row has a real owner. Different assertions, so
// they cannot drift into disagreement.
//
// RLS becomes worth writing in the same change that makes it load-bearing —
// dropping service_role for a request-scoped role carrying partner identity.
// Not before.

import { type PartnerContext } from "./auth.ts";

/**
 * Should this actor's reads and writes be confined to one partner's rows?
 *
 * Only `partner` actors are confined. D23's access matrix gives the credit
 * union admin read access ACROSS fintechs and Pynthia operations full access —
 * confining them would break the cross-fintech visibility those roles exist
 * for. This is the hook card 52 (CU-admin read) builds on.
 */
export function isConfined(ctx: PartnerContext): boolean {
  return ctx.actorType === "partner";
}

/**
 * Apply the partner predicate to a PostgREST query builder.
 *
 * Returns the builder untouched for unconfined actors, so callers can wrap
 * every partner-scoped read without branching at each site.
 */
// T is intentionally unconstrained. Constraining it to the builder's shape
// (`{ eq: (c: string, v: any) => T }`) makes the compiler walk PostgREST's
// recursive generic types and fail with TS2589 "type instantiation is
// excessively deep". The single cast below is the containment for that.
export function scopeToPartner<T>(query: T, ctx: PartnerContext): T {
  if (!isConfined(ctx)) return query;
  // ctx.partnerId is non-null whenever isConfined() is true: a `partner` actor
  // without a partner_id cannot authenticate (auth.ts rejects it as incoherent)
  // deno-lint-ignore no-explicit-any
  return (query as any).eq("partner_id", ctx.partnerId) as T;
}

/**
 * Does this already-fetched row belong to the caller?
 *
 * For the path where the row was fetched by primary key and re-querying with a
 * partner predicate would mean a second round trip.
 */
export function ownsRow(
  row: { partner_id?: string | null } | null | undefined,
  ctx: PartnerContext,
): boolean {
  if (!row) return false;
  if (!isConfined(ctx)) return true;
  return row.partner_id === ctx.partnerId;
}

/**
 * Tables whose rows are the INSTANCE's record rather than a partner's, and
 * which must therefore never acquire a partner predicate.
 *
 * This is not a performance exemption. CTR aggregation, structuring detection
 * and BSA reporting are obligations of the chartered credit union across every
 * fintech it hosts. Filtering these by partner would fragment precisely the
 * view the controls exist to produce — and would do so silently, because a
 * narrowed aggregate still returns a clean result and still writes a passing
 * control_result. A limit that never trips looks identical to a limit that was
 * never exceeded.
 *
 * Exported so the test suite can assert the list rather than trusting a
 * comment to be honoured.
 */
export const INSTANCE_SCOPED_TABLES = [
  "control_result",
  "bsa_alert",
  "event",
  "filing",
  "case",
  "dispute",
  "bookkeeping_entry",
  "idempotency_keys",
  // retention is the chartered institution's obligation across every fintech
  // it hosts, not a per-partner asset
  "record",
  "legal_hold",
] as const;

/** Stamp the owning partner onto a row being created. */
export function withOwner<T extends Record<string, unknown>>(
  row: T,
  ctx: PartnerContext,
): T & { partner_id: string } {
  // ownerPartnerId, not partnerId: ops and cu_admin actors legitimately create
  // rows and have no partner of their own, but partner_id is NOT NULL.
  return { ...row, partner_id: ctx.ownerPartnerId };
}
