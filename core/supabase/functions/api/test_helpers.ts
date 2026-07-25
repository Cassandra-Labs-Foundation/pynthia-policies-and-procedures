// Shared stubs for the api unit/behavioral tests.
//
// Level 1 (unit) and level 2 (behavioral) run hermetically: no network, no DB.
// Level 3 (compliance) is supabase/tests/e2e/compliance_e2e.sh, which runs
// against the deployed function and real Blnk.

import { type BlnkConfig } from "../_shared/blnk.ts";
import { pgOrderBy, type PgOrder } from "../_shared/pg_order.ts";
import { type PartnerContext } from "./auth.ts";

// deno-lint-ignore no-explicit-any
export type Any = any;

export interface Recorded {
  url: string;
  method: string;
  body: unknown;
}

/**
 * Blnk config whose fetch is captured rather than sent.
 *
 * NB the injection point is `fetchFn`, not `fetch`. Typed as BlnkConfig with no
 * cast on purpose: a wrong field name must fail to compile rather than silently
 * fall through to the real network (which is exactly what happened once).
 */
export function stubCfg(responses: Response[]): { cfg: BlnkConfig; sent: Recorded[] } {
  const sent: Recorded[] = [];
  let i = 0;
  const fetchFn = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    sent.push({
      url,
      method: init?.method ?? "GET",
      body: init?.body ? JSON.parse(init.body as string) : undefined,
    });
    return Promise.resolve(responses[i++] ?? new Response("{}", { status: 200 }));
  };
  const cfg: BlnkConfig = { apiUrl: "https://blnk.test", apiKey: "k", fetchFn };
  return { cfg, sent };
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * Minimal chainable Supabase fake. `row` is what a select resolves to; every
 * update is recorded so a test can assert the PERSISTED transition rather than
 * only the response body. `single()` merges the recorded patches the way
 * Postgres would return the updated row.
 */
export function stubDb(row: unknown) {
  const updates: Record<string, unknown>[] = [];
  // artifact/evidence writes (bookkeeping_entry, event, …) recorded separately
  // so updates.at(-1) assertions on the money row stay stable
  const upserts: { table: string; row: Record<string, unknown>; opts?: unknown }[] = [];
  let currentTable = "";
  const chain: Any = {
    select: () => chain,
    eq: () => chain,
    in: () => chain,
    contains: () => chain,
    neq: () => chain,
    gte: () => chain,
    order: () => chain,
    insert: (patch: Record<string, unknown>) => {
      updates.push(patch);
      return Promise.resolve({ data: null, error: null });
    },
    upsert: (patch: Record<string, unknown>, opts?: unknown) => {
      upserts.push({ table: currentTable, row: patch, opts });
      return Promise.resolve({ data: null, error: null });
    },
    update: (patch: Record<string, unknown>) => {
      updates.push(patch);
      return chain;
    },
    maybeSingle: () => Promise.resolve({ data: row, error: null }),
    single: () =>
      Promise.resolve({
        data: { ...(row as Record<string, unknown>), ...Object.assign({}, ...updates) },
        error: null,
      }),
    then: (res: (v: unknown) => unknown) => res({ data: [], error: null }),
  };
  const db: Any = {
    schema: () => ({
      from: (table: string) => {
        currentTable = table;
        return chain;
      },
    }),
  };
  return { db, updates, upserts };
}

/**
 * A query builder that RECORDS instead of querying — for the list endpoints.
 *
 * List handlers are almost entirely query construction, so what has to be
 * asserted is the query itself: that the partner predicate is present, that it
 * is applied BEFORE any caller-supplied filter, and that a filter narrows the
 * page rather than replacing the predicate. A fake that returned rows would
 * verify none of that — the predicate could be missing entirely and the rows
 * would still come back.
 */
export function listDb(rows: unknown[]) {
  const calls: { fn: string; args: unknown[] }[] = [];
  const record = (fn: string) => (...args: unknown[]) => (calls.push({ fn, args }), chain);
  const chain: Any = {
    select: record("select"),
    eq: record("eq"),
    or: record("or"),
    lt: record("lt"),
    order: record("order"),
    limit: record("limit"),
    then: (res: (v: unknown) => unknown) => {
      // ORDER BY is APPLIED, not just recorded. Returning the fixture in the
      // order it was written made every list test agree with itself about
      // ordering and with the database about nothing — which is how a page
      // that really LEADS with null-cursor rows (Postgres sorts NULLS FIRST
      // under DESC) came back from this double with those rows last, hiding
      // the dead cursor on GET /accounts. Recording a call proves the query
      // was BUILT; running it is what proves the result.
      const order = calls.find((c) => c.fn === "order");
      const data = order
        ? pgOrderBy(
          rows as Record<string, unknown>[],
          order.args[0] as string,
          order.args[1] as PgOrder,
        )
        : rows;
      return res({ data, error: null });
    },
  };
  const db: Any = { schema: () => ({ from: () => chain }) };
  return { db, calls };
}

/** The filter calls in order, as `fn:col=value` — what a list test asserts on. */
export function filtersOf(calls: { fn: string; args: unknown[] }[]): string[] {
  return calls
    .filter((c) => c.fn === "eq" || c.fn === "lt" || c.fn === "or")
    .map((c) => c.fn === "or" ? `or:${c.args[0]}` : `${c.fn}:${c.args[0]}=${c.args[1]}`);
}

/**
 * Partner context for writer tests (card 45).
 *
 * Every writer that claims an Idempotency-Key now needs one, because the key is
 * namespaced per partner. Tests that care about CONFINEMENT build their own
 * with a different partnerId; everything else uses this.
 */
export const TEST_CTX: PartnerContext = {
  tokenId: "tok_test",
  tokenPrefix: "cass_pt_test",
  actorType: "partner",
  roles: [],
  partnerId: "ptnr_test",
  instanceId: "inst_test",
  idempotencyScope: "ptnr_test",
  ownerPartnerId: "ptnr_test",
  evidenceProvenance: "production",
};

/** A second partner on the same instance — for cross-partner isolation tests. */
export const OTHER_CTX: PartnerContext = {
  ...TEST_CTX,
  tokenId: "tok_other",
  partnerId: "ptnr_other",
  idempotencyScope: "ptnr_other",
  ownerPartnerId: "ptnr_other",
  evidenceProvenance: "production",
};

/**
 * An ops actor: not confined to a partner's rows (D23), but still stamps an
 * owner on what it creates because partner_id is NOT NULL.
 */
export const OPS_CTX: PartnerContext = {
  tokenId: "tok_ops",
  tokenPrefix: "cass_ops",
  actorType: "pynthia_ops",
  roles: [],
  partnerId: null,
  instanceId: "inst_test",
  idempotencyScope: "token:tok_ops",
  ownerPartnerId: "ptnr_test",
  evidenceProvenance: "production",
};

/** Request carrying an Idempotency-Key by default (writers guard on it first). */
export function req(
  body?: unknown,
  headers: Record<string, string> = {},
  url = "https://x/payments",
): Request {
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Idempotency-Key": "idem-test",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function reqWithoutIdempotencyKey(body: unknown, url = "https://x/payments"): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export type IdemMode =
  | "fresh"
  | { kind: "conflict" }
  | { kind: "replay"; status: number; body: unknown }
  | { kind: "resume"; id: string };

export interface ApiDbOpts {
  /** row returned for a core.account lookup */
  account?: unknown;
  /** how claimIdempotency should resolve */
  idem?: IdemMode;
  /** row the writer table returns after its update...select().single() */
  row?: Record<string, unknown>;
  /** per-rail rows for the velocity sweep (contains "originator") */
  outbound?: Record<string, { amount: number }[]>;
  /** rows for the structuring sweep (contains "beneficiary") */
  inbound?: { amount: number }[];
}

/**
 * Table-aware Supabase fake covering a full writer happy path: the idempotency
 * claim, the account lookup, the gate's aggregate sweeps, and the writer's own
 * row.
 *
 * claimIdempotency is modelled faithfully rather than short-circuited — it
 * inserts, and on a 23505 re-reads the stored row to decide replay vs conflict
 * vs resume. The fake echoes back the request_hash from the attempted insert,
 * so replay/resume resolve without the test having to recompute the writer's
 * SHA-256 of the body.
 */
export function stubApiDb(opts: ApiDbOpts = {}) {
  const idem = opts.idem ?? "fresh";
  const inserts: { table: string; row: Record<string, unknown>; opts?: unknown }[] = [];
  const updates: { table: string; patch: Record<string, unknown> }[] = [];
  let attemptedHash = "";

  const from = (table: string) => {
    let predicate: "originator" | "beneficiary" | null = null;
    const chain: Any = {
      select: () => chain,
      eq: () => chain,
      in: () => chain,
      neq: () => chain,
      gte: () => chain,
      order: () => chain,
      contains: (col: string) => {
        predicate = col === "beneficiary" ? "beneficiary" : "originator";
        return chain;
      },
      insert: (row: Record<string, unknown>) => {
        if (table === "idempotency_keys") {
          attemptedHash = String(row.request_hash ?? "");
          // a non-fresh claim means the key already exists -> unique violation
          return Promise.resolve(
            idem === "fresh"
              ? { data: null, error: null }
              : { data: null, error: { code: "23505", message: "duplicate key" } },
          );
        }
        inserts.push({ table, row });
        return Promise.resolve({ data: null, error: null });
      },
      upsert: (row: Record<string, unknown>, opts?: unknown) => {
        inserts.push({ table, row, opts });
        return Promise.resolve({ data: null, error: null });
      },
      update: (patch: Record<string, unknown>) => {
        updates.push({ table, patch });
        return chain;
      },
      maybeSingle: () => {
        if (table === "idempotency_keys") {
          if (idem === "fresh") return Promise.resolve({ data: null, error: null });
          if (idem.kind === "conflict") {
            // a different body under the same key
            return Promise.resolve({
              data: { request_hash: `${attemptedHash}-different`, response_status: null },
              error: null,
            });
          }
          if (idem.kind === "replay") {
            return Promise.resolve({
              data: {
                request_hash: attemptedHash,
                response_status: idem.status,
                response_body: idem.body,
              },
              error: null,
            });
          }
          return Promise.resolve({
            data: { request_hash: attemptedHash, response_status: null, blnk_reference: idem.id },
            error: null,
          });
        }
        if (table === "account") return Promise.resolve({ data: opts.account ?? null, error: null });
        return Promise.resolve({ data: opts.row ?? null, error: null });
      },
      single: () =>
        Promise.resolve({
          data: {
            ...(opts.row ?? {}),
            ...Object.assign({}, ...updates.filter((u) => u.table === table).map((u) => u.patch)),
          },
          error: null,
        }),
      then: (res: (v: unknown) => unknown) =>
        res({
          data: predicate === "beneficiary"
            ? (opts.inbound ?? [])
            : (opts.outbound?.[table] ?? []),
          error: null,
        }),
    };
    return chain;
  };

  const db: Any = { schema: () => ({ from }) };
  return { db, inserts, updates };
}

/**
 * The two BSA duty roles, as separate actors. Separate TOKEN IDS is the point:
 * the four-eyes rule compares actors, so a test that reused one id would pass
 * for the wrong reason.
 */
export const INVESTIGATOR_CTX: PartnerContext = {
  ...OPS_CTX,
  tokenId: "tok_investigator",
  roles: ["bsa_investigator"],
  idempotencyScope: "token:tok_investigator",
};

export const OFFICER_CTX: PartnerContext = {
  ...OPS_CTX,
  tokenId: "tok_officer",
  roles: ["bsa_officer"],
  idempotencyScope: "token:tok_officer",
};

/** One actor holding both roles — the case the separation must still refuse. */
export const DUAL_ROLE_CTX: PartnerContext = {
  ...OPS_CTX,
  tokenId: "tok_dual",
  roles: ["bsa_investigator", "bsa_officer"],
  idempotencyScope: "token:tok_dual",
};

/**
 * A request authenticated with the shared bootstrap DEMO_API_KEY — what
 * analytics/seed.sh uses. Its evidence is real evaluation of manufactured
 * traffic, so it must never count toward coverage.
 */
export const DEMO_KEY_CTX: PartnerContext = {
  ...OPS_CTX,
  tokenId: "tok_demo_bootstrap",
  evidenceProvenance: "demo",
};
