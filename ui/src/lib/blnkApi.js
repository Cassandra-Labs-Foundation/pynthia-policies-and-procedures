// Server-side Blnk client. NEVER import this from a component.
//
// Blnk is where the actual double-entry ledger lives. `core.bookkeeping_entry`
// is single-sided and stamps every row with the same 5300 code, so it is not a
// GL; `core.account.blnk_balance_id` is commented "Source of truth for funds"
// and that is literally true — the debits, the credits and the postings that
// move them are all here, not in Postgres.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHY THE KEY MATTERS MORE THAN THE CORE'S
//
// X-blnk-key is the instance secret. It is not just a read credential: the same
// value SIGNS WEBHOOKS (BLNK_WEBHOOK_SECRET is the same secret in .env.local).
// Leaking it would let a caller both move money and forge the callbacks that
// tell this system money moved. So it stays server-side, the allowlist below is
// READ-only, and there is no path here that can post a transaction.
const BASE_URL = process.env.BLNK_API_URL;
const API_KEY = process.env.BLNK_API_KEY;

/**
 * Read paths the browser may reach.
 *
 * Anchored, and deliberately narrow. Blnk's write surface is POST /transactions
 * and POST /balances — neither is reachable here, and the proxy route rejects
 * any method other than GET, so the allowlist is the second of two locks
 * rather than the only one.
 */
const ALLOWED = [
  /^ledgers$/,
  /^ledgers\/[A-Za-z0-9_-]+$/,
  /^balances$/,
  /^balances\/[A-Za-z0-9_-]+$/,
  /^transactions$/,
  /^transactions\/[A-Za-z0-9_-]+$/,
];

/** Only paging and filtering. Nothing here can widen what a caller reaches. */
const ALLOWED_PARAMS = ["limit", "page", "offset", "ledger_id", "balance_id", "status"];

export function isAllowedBlnkPath(path) {
  return ALLOWED.some((p) => p.test(path));
}

export class BlnkApiError extends Error {
  constructor(status, body) {
    super(`Blnk responded ${status}`);
    this.status = status;
    this.body = body;
  }
}

/** GET an allowlisted Blnk path. Throws BlnkApiError on a non-2xx. */
export async function blnkGet(path, searchParams) {
  if (!BASE_URL || !API_KEY) {
    throw new BlnkApiError(503, {
      detail:
        "BLNK_API_URL and BLNK_API_KEY are unset. They are required for the general " +
        "ledger view — set them in ui/.env.local locally and in the host's " +
        "environment for a deploy.",
    });
  }
  if (!isAllowedBlnkPath(path)) {
    throw new BlnkApiError(404, { detail: `not a proxied Blnk path: ${path}` });
  }

  const url = new URL(`${BASE_URL.replace(/\/$/, "")}/${path}`);
  for (const key of ALLOWED_PARAMS) {
    const value = searchParams?.get(key);
    if (value !== null && value !== undefined) url.searchParams.set(key, value);
  }

  const res = await fetch(url, {
    headers: { "X-blnk-key": API_KEY, accept: "application/json" },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new BlnkApiError(res.status, body);
  return body;
}
