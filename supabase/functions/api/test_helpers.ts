// Shared stubs for the api unit/behavioral tests.
//
// Level 1 (unit) and level 2 (behavioral) run hermetically: no network, no DB.
// Level 3 (compliance) is supabase/tests/e2e/compliance_e2e.sh, which runs
// against the deployed function and real Blnk.

import { type BlnkConfig } from "../_shared/blnk.ts";

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
    upsert: (patch: Record<string, unknown>) => {
      updates.push(patch);
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
  const db: Any = { schema: () => ({ from: () => chain }) };
  return { db, updates };
}

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
