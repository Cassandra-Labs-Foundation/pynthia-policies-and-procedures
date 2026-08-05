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
 * moves real money.
 *
 * GENERATED from the spec since 2026-08: the deliberate "what may the browser
 * reach" line is `x-ui-surface: true` on a GET operation in core/core-api.yaml,
 * and scripts/gen_ui_contract.py derives this file's allowlist (paths AND
 * query params) from it — CI fails if they drift apart. Widening the surface
 * is a spec change, reviewed where the rest of the contract lives.
 *
 * Anchored patterns: an unanchored /accounts would also match
 * /accounts/{id}/numbers, quietly widening the surface past what was reviewed.
 */
import contract from "./coreApi.allowlist.json";

const ALLOWED = contract.paths.map((p) => new RegExp(p.pattern));

/**
 * Query params that may be forwarded — from the same spec operations.
 * Everything here narrows a result set; anything unlisted is dropped rather
 * than passed through, so a param the core API grows later cannot become
 * browser-reachable without a spec edit.
 */
const ALLOWED_PARAMS = contract.params;

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
