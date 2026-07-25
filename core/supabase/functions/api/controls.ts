import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  internalErrorResponse,
  jsonResponse,
  validationError,
  type ValidationErrorItem,
} from "./lib.ts";

// Matches core.control_result's CHECK constraint; an unknown value would just
// return an empty list, which reads as "no findings" — the one thing a
// compliance query must never silently say by accident.
const DECISIONS = ["pass", "hold", "block", "reject", "clear"];
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const FILTERS = ["control_id", "decision", "subject_ref", "event"] as const;

/**
 * GET /control-results — the standalone query surface for control evidence
 * (card 47). Inline `control_results` on money-movement responses show what
 * fired on THAT request; this answers the examiner/ops questions across
 * requests: "show me every CG-VEL-01 block", "what fired on this account",
 * "what fired for this transfer". Newest first.
 */
export async function getControlResults(
  req: Request,
  db: SupabaseClient,
  requestId: string,
): Promise<Response> {
  const q = new URL(req.url).searchParams;

  const errors: ValidationErrorItem[] = [];
  const decision = q.get("decision");
  if (decision !== null && !DECISIONS.includes(decision)) {
    errors.push({
      type: "invalid_value",
      field: "decision",
      message: `must be one of: ${DECISIONS.join(", ")}`,
    });
  }
  // Card 04: forward-only cursor. `after` is the previous page's next_after
  // (created_at of its last row); strictly-older filtering means a row created
  // between requests can never be served twice.
  const after = q.get("after");
  if (after !== null && Number.isNaN(Date.parse(after))) {
    errors.push({
      type: "invalid_value",
      field: "after",
      message: "must be an ISO-8601 timestamp (use next_after from the previous page)",
    });
  }
  let limit = DEFAULT_LIMIT;
  const rawLimit = q.get("limit");
  if (rawLimit !== null) {
    const n = Number(rawLimit);
    if (!Number.isInteger(n) || n < 1 || n > MAX_LIMIT) {
      errors.push({
        type: "invalid_value",
        field: "limit",
        message: `must be an integer between 1 and ${MAX_LIMIT}`,
      });
    } else {
      limit = n;
    }
  }
  if (errors.length) return validationError(requestId, errors);

  // over-fetch by one: the probe row answers has_more without a second query
  let query = db.schema("core").from("control_result")
    .select("id, control_id, decision, event, subject_ref, score, created_at")
    .order("created_at", { ascending: false })
    .limit(limit + 1);
  for (const f of FILTERS) {
    const v = q.get(f);
    if (v !== null && v !== "") query = query.eq(f, v);
  }
  if (after) query = query.lt("created_at", after);

  const { data, error } = await query;
  if (error) return internalErrorResponse(requestId, error);

  const rows = (data ?? []) as { created_at: string }[];
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  return jsonResponse({
    data: page,
    limit,
    has_more: hasMore,
    next_after: hasMore && page.length ? page[page.length - 1].created_at : null,
  }, 200, requestId);
}
