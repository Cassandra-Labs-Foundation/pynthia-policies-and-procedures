// Phase-0 platform surface (cards 03): version + changelog.
import { API_VERSION, jsonResponse } from "./lib.ts";
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
    changes: ["accounts + book transfers with CG-VEL-01 / CG-CTR-01 / CG-NSF-01"],
  },
];

/** GET /changelog — what changed, newest first. */
export function getChangelog(requestId: string): Response {
  return jsonResponse({ data: CHANGELOG }, 200, requestId);
}
