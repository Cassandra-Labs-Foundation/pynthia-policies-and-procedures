// Every route must be authorization-accounted-for. Three legal states:
//   1. route-level actors gate (declarative, enforced by authenticate), or
//   2. handler self-gates (requireInternalActor / requireBsa — the designed
//      404-for-partners confidentiality posture), or
//   3. an INTENDED partner surface, named in PARTNER_SURFACE below.
//
// This is the table-level guarantee the 2026-08 routing review demanded: with
// 200+ routes relying on in-handler gating, nothing else fails when the next
// handler forgets its requireInternalActor call. Static analysis on purpose —
// index.ts calls Deno.serve at import time, so it cannot be imported here.
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const dir = new URL(".", import.meta.url).pathname;
// the table is split: hand-written entries in index.ts, spec-generated
// entries in routes.gen.ts — the invariant covers both
const indexText = await Deno.readTextFile(dir + "index.ts") + "\n" +
  await Deno.readTextFile(dir + "routes.gen.ts");

// handler name -> module, from both files' import blocks
const modOf = new Map<string, string>();
for (const m of indexText.matchAll(/import\s*\{([^}]*)\}\s*from\s*"\.\/([a-z_0-9]+)\.ts"/g)) {
  for (const raw of m[1].split(",")) {
    const n = raw.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0].trim();
    if (n) modOf.set(n, m[2]);
  }
}

// does this module's exported function body call an internal gate?
const gateCache = new Map<string, Map<string, boolean>>();
async function selfGates(mod: string, fn: string): Promise<boolean> {
  if (!gateCache.has(mod)) {
    const t = await Deno.readTextFile(dir + mod + ".ts");
    const decls = [...t.matchAll(/^export (?:async )?function ([A-Za-z0-9_]+)/gm)];
    const map = new Map<string, boolean>();
    for (let i = 0; i < decls.length; i++) {
      const start = decls[i].index!;
      const end = i + 1 < decls.length ? decls[i + 1].index! : t.length;
      const body = t.slice(start, end);
      map.set(decls[i][1], body.includes("requireInternalActor(ctx") || body.includes("requireBsa("));
    }
    gateCache.set(mod, map);
  }
  return gateCache.get(mod)!.get(fn) ?? false;
}

// The intended partner-facing API: the ONLY routes allowed to carry neither an
// actors gate nor an in-handler gate. Additions here are a conscious decision
// to expose a surface to partner tokens.
const PARTNER_SURFACE = new Set([
  "POST /privacy/connections",
  "POST /accounts", "GET /accounts", "GET /accounts/{id}",
  "POST /accounts/{id}/numbers", "GET /accounts/{id}/numbers",
  "POST /accounts/{id}/lock", "POST /accounts/{id}/transition",
  "POST /account-numbers/{id}/transition",
  "POST /entities", "GET /entities", "GET /entities/{id}",
  "POST /entities/{id}/transition", "POST /entities/{id}/owners",
  "GET /entities/{id}/verifications", "POST /entities/{id}/verifications",
  "POST /transfers", "GET /transfers", "GET /transfers/{id}",
  "GET /wire-transfers", "GET /wire-transfers/{id}",
  "GET /ach-transfers", "GET /ach-transfers/{id}",
  "GET /cards", "GET /cards/{id}",
  "POST /payments/ach", "POST /payments/ach/{id}/settle",
  "POST /payments/ach/{id}/return", "POST /payments/ach/{id}/noc",
  "POST /payments/ach/{id}/approve",
  "POST /payments/card/authorize", "POST /payments/card/{id}/capture",
  "POST /payments/card/{id}/reverse", "POST /payments/card/{id}/expire",
  "POST /payments/wire/prepare", "POST /payments/wire/{id}/confirm",
  "POST /payments/wire/{id}/cancel", "POST /payments/wire/{id}/reject",
  "POST /payments/wire/{id}/return", "POST /payments/wire/{id}/return/resolve",
  "POST /payments/wire/{id}/approve",
  "GET /reports/5300", "GET /changelog", "POST /sandbox/simulate",
  "GET /control-results",
  // public dashboard chrome + data (public: true or read-only evidence)
  "GET /compliance/dashboard", "GET /compliance/dashboard/data",
  "GET /compliance/dashboard/heartbeat", "GET /compliance/dashboard/events",
  "GET /compliance/dashboard/trace/{resourceId}",
  // the dashboard's one public WRITE — an officer flagging an event routes a
  // sim-scope escalation; unauthenticated by the same demo posture as the
  // reads (postDashboardFlag documents the deferred production auth model).
  "POST /compliance/dashboard/flag",
]);

const entries = indexText.match(/\{\s*(?:\/\/[^\n]*\n\s*)*method:[\s\S]*?\n  \},/g) ?? [];

Deno.test("every route is authorization-accounted-for (actors, self-gate, or declared partner surface)", async () => {
  assert(entries.length > 300, `route parser found only ${entries.length} entries`);
  const offenders: string[] = [];
  const seen = new Set<string>();
  for (const e of entries) {
    const ep = e.match(/endpoint: "([^"]+)"/)?.[1] ?? "(unparsed)";
    seen.add(ep);
    if (/\bactors:/.test(e)) continue;
    const fn = e.match(/await ([A-Za-z0-9_]+)\(/)?.[1];
    const mod = fn ? modOf.get(fn) : undefined;
    if (fn && mod && await selfGates(mod, fn)) continue;
    if (PARTNER_SURFACE.has(ep)) continue;
    offenders.push(`${ep} (${fn ?? "inline"})`);
  }
  assertEquals(offenders, [],
    "routes with no actors gate, no in-handler gate, and no PARTNER_SURFACE entry");
  // keep the allowlist pruned: every entry must still name a real route
  const stale = [...PARTNER_SURFACE].filter((ep) => !seen.has(ep));
  assertEquals(stale, [], "PARTNER_SURFACE entries that no longer match a route");
});

// public: true skips authenticate() entirely, and since the route table is
// generated from the spec, a one-token x-audience edit could mint an
// unauthenticated route. Pin the public set so widening it is a conscious,
// reviewed change HERE — this test runs on every PR, the spec-side generator
// check only post-merge.
const PUBLIC_ROUTES = new Set([
  "GET /compliance/dashboard",
  "GET /compliance/dashboard/data",
  "GET /compliance/dashboard/heartbeat",
  "GET /compliance/dashboard/events",
  "GET /compliance/dashboard/trace/{resourceId}",
  "POST /compliance/dashboard/flag",
]);

Deno.test("public (unauthenticated) routes are exactly the pinned dashboard set", () => {
  const found = new Set<string>();
  for (const e of entries) {
    if (/\bpublic: true\b/.test(e)) {
      found.add(e.match(/endpoint: "([^"]+)"/)?.[1] ?? "(unparsed)");
    }
  }
  assertEquals([...found].sort(), [...PUBLIC_ROUTES].sort());
});

// The spec's x-audience flows into each generated Route as `audience`. This
// reconciliation is that annotation's consumer: an operation the spec calls
// "partner" that this file's PARTNER_SURFACE does not vouch for (or vice
// versa) is a lie in one of the two places, and it fails here on every PR.
Deno.test("spec x-audience agrees with PARTNER_SURFACE on every generated route", () => {
  const disagreements: string[] = [];
  for (const e of entries) {
    const audience = e.match(/audience: "([a-z]+)"/)?.[1];
    if (!audience) continue; // hand entries in index.ts carry no audience field
    const ep = e.match(/endpoint: "([^"]+)"/)?.[1] ?? "(unparsed)";
    const vouched = PARTNER_SURFACE.has(ep);
    if (audience === "partner" && !vouched) {
      disagreements.push(`${ep}: spec says partner, PARTNER_SURFACE does not vouch`);
    }
    if (audience !== "partner" && audience !== "public" && vouched) {
      disagreements.push(`${ep}: PARTNER_SURFACE vouches, spec says ${audience}`);
    }
  }
  assertEquals(disagreements, []);
});
