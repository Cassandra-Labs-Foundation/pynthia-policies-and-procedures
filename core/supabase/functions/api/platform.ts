// Phase-0 platform surface (cards 03): version + changelog.
import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { API_VERSION, internalErrorResponse, jsonResponse } from "./lib.ts";
import { type PartnerContext } from "./auth.ts";

/** How many daily snapshots the operator view carries. ~2 months of trend. */
const REPORT_5300_DAYS = 60;
export { API_VERSION };

// Newest first; the head entry MUST match API_VERSION (asserted in tests).
// Dates are deploy dates of the corresponding commits on main.
const CHANGELOG = [
  {
    version: "4.0.0",
    date: "2026-07-19",
    changes: [
      "BREAKING: per-partner scoped tokens replace the single shared X-Api-Key",
      "row-level partner ownership: partner_id on accounts, entities and all four rails, enforced on read and on money movement; a foreign row is 404, never 403",
      "tokens carry an actor class, an endpoint allowlist and a tier list; all three are enforced",
      "tokens are bound to their instance and rejected anywhere else, indistinguishably from unknown",
      "partner tokens are refused at the aggregator, which accepts only short-lived instance JWTs",
      "SECURITY: Idempotency-Keys are namespaced per partner — they were previously global, so two partners sharing a key replayed each other's cached response",
      "ACH/wire/card simulation surface under /sandbox/simulate/*, aliasing the real writers",
      "ACH return-code validation + NOC; wire network rejection; card authorization expiry",
    ],
  },
  {
    version: "3.0.0",
    date: "2026-07-19",
    changes: [
      "wire returns: request -> RETURNED (compensating reversal) or COMPLETED, with reasons",
      "movement evidence on every rail: bookkeeping_entry + event per money movement",
      "money conservation guaranteed: partial wire confirms release the unconfirmed remainder",
      "GET /control-results: standalone control-evidence query surface with pagination",
      "CG-STR-01/02 structuring detection; CG-VEL-01 velocity aggregates across rails",
      "domestic-only wires: SWIFT/BIC or non-US beneficiaries refused before any hold",
    ],
  },
  {
    version: "2.0.0",
    date: "2026-07-18",
    changes: [
      "two-phase wire, ACH and card rails on Blnk inflight, all behind the shared control gate",
      "idempotency: replay, conflict 409, resume on the original id",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-07-17",
    changes: ["accounts + book transfers with CG-VEL-01 / CG-LGTXN-01 / CG-NSF-01"],
  },
];

/** GET /changelog — what changed, newest first. */
export function getChangelog(requestId: string): Response {
  return jsonResponse({ data: CHANGELOG }, 200, requestId);
}

// ------------------------------------------------------- 5300 call report

/**
 * GET /reports/5300
 *
 * The operator-facing view of the NCUA 5300 aggregation, for this instance.
 *
 * TWO CLOCKS, AND THEY ARE NOT THE SAME. This endpoint returns both and labels
 * which is which, because presenting them as one number would be a lie an
 * operator cannot detect:
 *
 *   * `current` comes from aggregator.fbo_position. Since migration
 *     20260817000100 that is a VIEW over open member share balances, not a
 *     figure some consumer advances, so it is exact at the moment of the read
 *     rather than as-of a cursor. `last_seq` is read separately from
 *     aggregator.event — see below for why it is still here.
 *   * `history` comes from aggregator.report_5300, written once per instance
 *     per day by analytics/report_5300.sh on a schedule. Its newest row can be
 *     up to a day old, and on a day the job has not run yet there is no row at
 *     all.
 *
 * WHY last_seq SURVIVED THE ACCUMULATOR. It used to be a column on
 * fbo_position, advanced by the payment_hub consumer; the rollup dropped both.
 * But the UI's heartbeat (ui/src/lib/useLiveCore.js) polls this endpoint to ask
 * "did anything happen?", and a DERIVED position cannot answer that: a deposit
 * and an equal withdrawal move the ledger and leave the sum untouched. The
 * honest source is the ingest sequence itself, aggregator.event.sequence_id,
 * which is the same counter payment_hub's cursor tracked and which
 * bsa_approver's cursor still does. Index-only read against
 * idx_aggregator_event_instance — ~0.03ms, which a 5s poll can afford.
 *
 * A dashboard that drew a "live" figure from the daily table would show an
 * operator a settled-volume number that stopped moving at midnight and give no
 * hint why. So `history[0]` is dated and `current` is not, and `stale` says
 * outright whether today's aggregation has landed.
 *
 * Scoped to ctx.instanceId. A token is bound to one instance (card 51) and the
 * call report is per instance, so there is nothing to widen here — reading
 * another instance's position is precisely what that binding exists to stop.
 */
export async function getReport5300(
  _req: Request,
  db: SupabaseClient,
  requestId: string,
  ctx: PartnerContext,
): Promise<Response> {
  const [positionRes, seqRes, historyRes, memberShareRes] = await Promise.all([
    db.schema("aggregator").from("fbo_position")
      .select("instance_id, position_cents, updated_at")
      .eq("instance_id", ctx.instanceId)
      .maybeSingle(),
    // The heartbeat's "did anything happen?" — see the note above. Kept out of
    // the view on purpose: a roll-up of balances has no business carrying an
    // ingest cursor, which is how the last one came to be maintained by hand.
    db.schema("aggregator").from("event")
      .select("sequence_id")
      .eq("instance_id", ctx.instanceId)
      .order("sequence_id", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.schema("aggregator").from("report_5300")
      .select(
        "period, instance_id, as_of, settled_cents, settled_count, ctr_alerts, structuring_alerts, fbo_position_cents, generated_at",
      )
      .eq("instance_id", ctx.instanceId)
      .order("as_of", { ascending: false })
      .limit(REPORT_5300_DAYS),
    // The other half of the FBO tie-out. A partner program's end users are
    // members whose balances are tracked THROUGH its FBO account, so this and
    // the position above are two views of one number and belong in one
    // response — a caller that had to fetch them separately could compare a
    // position against balances read at a different moment.
    //
    // An aggregate function rather than a row walk because this endpoint is
    // the UI's heartbeat: useLiveCore polls it on a timer.
    db.schema("aggregator").rpc("member_share_cents", { p_instance: ctx.instanceId }),
  ]);

  if (positionRes.error) return internalErrorResponse(requestId, positionRes.error);
  if (seqRes.error) return internalErrorResponse(requestId, seqRes.error);
  if (historyRes.error) return internalErrorResponse(requestId, historyRes.error);
  if (memberShareRes.error) return internalErrorResponse(requestId, memberShareRes.error);

  const history = (historyRes.data ?? []) as unknown as Record<string, unknown>[];
  const position = positionRes.data as Record<string, unknown> | null;

  // "Has today's aggregation run?" — asked here rather than left to the client,
  // because every client would otherwise have to know the job's cadence to
  // answer it, and would answer it differently.
  const newest = history.length ? String(history[0].as_of ?? "") : null;
  const today = new Date().toISOString().slice(0, 10);

  return jsonResponse({
    instance_id: ctx.instanceId,
    // live, event-sequenced
    current: position
      ? {
        fbo_position_cents: position.position_cents,
        last_seq: (seqRes.data as Record<string, unknown> | null)?.sequence_id ?? null,
        updated_at: position.updated_at,
      }
      : null,
    // The tie-out, scoped to THIS instance's partner program. Reported even
    // when there is no position row yet, because "members hold $X and the FBO
    // tracks none of it" is a finding, not a blank.
    //
    // The difference is not smoothed by a tolerance: today it is the whole of
    // the unmodelled inbound funding (nothing credits an FBO until a rail
    // emits ach_pull.settled or fbo_funding.settled), and hiding that behind
    // an "acceptable variance" would hide the one number that says so.
    member_share_cents: memberShareRes.data ?? 0,
    fbo_reconciliation_diff_cents:
      Number(position?.position_cents ?? 0) - Number(memberShareRes.data ?? 0),
    // daily snapshots, newest first
    history,
    as_of: newest,
    stale: newest !== today,
    // Named so a reader does not have to infer the cadence from the dates.
    cadence: "aggregator.report_5300 is written once per instance per day by a scheduled job",
    // The one thing that stops this being a real call report, stated where an
    // operator will see it rather than only in BLUEPRINT §521.
    chart_of_accounts_note:
      "Every bookkeeping_entry is stamped account_code_5300='018'; a per-product " +
      "mapping is an open decision, so these figures are volume and position, not " +
      "a line-mapped 5300 filing",
  }, 200, requestId);
}
