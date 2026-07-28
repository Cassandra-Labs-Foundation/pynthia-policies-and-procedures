// Server-side core-API client. NEVER import this from a component.
//
// The API authenticates with X-Api-Key. That key is a bearer credential for the
// whole banking core — it opens accounts, moves money and files CTRs — so it
// must not reach the browser. Neither name is prefixed NEXT_PUBLIC_, which is
// what keeps Next.js from inlining them into the client bundle; the module is
// reached only through the proxy route in pages/api/, which runs on the server.

const BASE_URL = process.env.CORE_API_URL;
const API_KEY = process.env.CORE_API_KEY;

/**
 * The paths the browser may reach, and nothing else.
 *
 * An allowlist rather than a blocklist, and READ-only, because the alternative
 * — forwarding whatever path arrives — would hand every caller of this UI the
 * server's credential and the write half of the API with it: POST /transfers
 * moves real money. A new endpoint here is a deliberate line, not a default.
 *
 * Anchored patterns: an unanchored /accounts would also match
 * /accounts/{id}/numbers, quietly widening the surface past what was reviewed.
 */
const ALLOWED = [
  /^entities$/,
  /^entities\/[A-Za-z0-9_-]+$/,
  /^accounts$/,
  /^accounts\/[A-Za-z0-9_-]+$/,
  /^transfers$/,
  /^transfers\/[A-Za-z0-9_-]+$/,
  // Compliance/ops reads. All four are GET-only in the core's route table and
  // gate on cu_admin/pynthia_ops (control-results is instance-scoped rather
  // than actor-scoped), so the shared staff key reaches them as-is.
  /^control-results$/,
  /^governance\/obligations$/,
  /^eps\/pending-approvals$/,
  /^cash\/aggregation$/,
  // The 5300 operator view. Reads aggregator.* rather than core.*, and is
  // scoped server-side to the token's own instance — there is no parameter
  // here that could widen it to another instance.
  /^reports\/5300$/,
];

/**
 * Query params that may be forwarded.
 *
 * Separate from the path allowlist because params carry their own reach:
 * everything here narrows a result set. Anything unlisted is dropped rather
 * than passed through, so a param the core API grows later cannot become
 * browser-reachable just by existing.
 */
const ALLOWED_PARAMS = [
  "limit",
  "after",
  "type",
  "status",
  "entity_id",
  "account_id",
  // GET /cash/aggregation 400s without this one — it is not an optional filter
  "business_date",
  // GET /control-results filters
  "control_id",
  "decision",
  "subject_ref",
  "event",
];

export function isAllowedPath(path) {
  return ALLOWED.some((p) => p.test(path));
}

export class CoreApiError extends Error {
  constructor(status, body) {
    super(`core API responded ${status}`);
    this.status = status;
    this.body = body;
  }
}

/** GET an allowlisted path. Throws CoreApiError on a non-2xx. */
export async function coreGet(path, searchParams) {
  if (!BASE_URL || !API_KEY) {
    throw new CoreApiError(503, {
      detail:
        "CORE_API_URL and CORE_API_KEY are unset — copy ui/.env.local.example to " +
        "ui/.env.local and fill them in. See ui/README.md.",
    });
  }
  if (!isAllowedPath(path)) throw new CoreApiError(404, { detail: `not a proxied path: ${path}` });

  const url = new URL(`${BASE_URL.replace(/\/$/, "")}/${path}`);
  for (const key of ALLOWED_PARAMS) {
    const value = searchParams?.get(key);
    if (value !== null && value !== undefined) url.searchParams.set(key, value);
  }

  const res = await fetch(url, {
    headers: { "X-Api-Key": API_KEY, accept: "application/json" },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new CoreApiError(res.status, body);
  return body;
}
