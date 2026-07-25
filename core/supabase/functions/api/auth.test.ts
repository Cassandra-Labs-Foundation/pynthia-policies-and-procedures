// Cards 45 (partner tokens) + 51 (partner confinement).
//
// The DB fake below models `.eq()` filtering faithfully rather than returning a
// canned row, which matters: the instance binding in auth.ts is expressed as a
// PREDICATE in the lookup query, so a fake that ignored predicates would pass
// these tests even if that predicate were deleted. Removing
// `.eq("instance_id", …)` from authenticate() must turn the cross-instance
// tests red, and with this fake it does.
import { assert, assertEquals } from "jsr:@std/assert@1";
import {
  authenticate,
  type EndpointScope,
  endpointMatches,
  mintToken,
  scopeAllows,
} from "./auth.ts";
import { type Any } from "./test_helpers.ts";
import { sha256Hex } from "./lib.ts";

const THIS_INSTANCE = "inst_fintech_x";
const OTHER_INSTANCE = "inst_fintech_y";

const WRITE_SCOPE: EndpointScope = { endpoint: "POST /transfers", tier: "write" };
const READ_SCOPE: EndpointScope = { endpoint: "GET /accounts/{id}", tier: "read" };
const OPS_SCOPE: EndpointScope = {
  endpoint: "POST /sandbox/reset",
  tier: "write",
  actors: ["pynthia_ops"],
};

function tokenRow(over: Record<string, unknown> = {}) {
  return {
    id: "tok_1",
    token_hash: "",
    token_prefix: "cass_pt_aaaa",
    actor_type: "partner",
    partner_id: "ptnr_x",
    instance_id: THIS_INSTANCE,
    allowed_endpoints: ["POST /transfers", "GET /accounts/{id}"],
    allowed_tiers: ["read", "write"],
    status: "active",
    expires_at: null,
    ...over,
  };
}

function partnerRow(over: Record<string, unknown> = {}) {
  return { id: "ptnr_x", status: "active", instance_id: THIS_INSTANCE, ...over };
}

/** Applies every recorded .eq() as a real predicate, the way Postgres would. */
function authDb(
  tokens: Record<string, unknown>[],
  partners: Record<string, unknown>[] = [partnerRow()],
  opts: { error?: string } = {},
) {
  const db: Any = {
    schema: () => ({
      from: (table: string) => {
        const filters: Record<string, unknown> = {};
        const chain: Any = {
          select: () => chain,
          eq: (col: string, val: unknown) => {
            filters[col] = val;
            return chain;
          },
          maybeSingle: () => {
            if (opts.error) return Promise.resolve({ data: null, error: { message: opts.error } });
            const src = table === "api_token" ? tokens : partners;
            const found = src.find((r) =>
              Object.entries(filters).every(([k, v]) => r[k] === v)
            );
            return Promise.resolve({ data: found ?? null, error: null });
          },
          // awaited directly (no maybeSingle): the owning-partner resolution
          // for actors that carry no partner of their own
          then: (res: (v: unknown) => unknown) => {
            if (opts.error) return res({ data: null, error: { message: opts.error } });
            const src = table === "api_token" ? tokens : partners;
            return res({
              data: src.filter((r) => Object.entries(filters).every(([k, v]) => r[k] === v)),
              error: null,
            });
          },
        };
        return chain;
      },
    }),
  };
  return db;
}

function bearer(token: string): Request {
  return new Request("https://x/transfers", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ------------------------------------------------------------- scope matching

Deno.test("endpoint matching: exact, global wildcard, prefix wildcard", () => {
  assertEquals(endpointMatches("POST /transfers", "POST /transfers"), true);
  assertEquals(endpointMatches("*", "POST /anything"), true);
  assertEquals(endpointMatches("POST /payments/*", "POST /payments/ach"), true);
  assertEquals(endpointMatches("POST /payments/*", "POST /payments/wire/prepare"), true);
  assertEquals(endpointMatches("POST /transfers", "POST /transfers/{id}"), false);
});

Deno.test("a prefix wildcard stops at the segment boundary", () => {
  // Substring matching would let a scope for /payments/* also cover a route
  // named /payments-admin/purge — a silent privilege escalation for any route
  // whose name merely starts with a granted one.
  assertEquals(endpointMatches("POST /payments/*", "POST /payments-admin/purge"), false);
  assertEquals(endpointMatches("GET /accounts/*", "GET /accounts-internal/all"), false);
});

Deno.test("endpoint and tier are BOTH required — neither alone suffices", () => {
  // right endpoint, wrong tier
  assertEquals(scopeAllows(["POST /transfers"], ["read"], WRITE_SCOPE), false);
  // right tier, wrong endpoint
  assertEquals(scopeAllows(["GET /accounts/{id}"], ["write"], WRITE_SCOPE), false);
  // both
  assertEquals(scopeAllows(["POST /transfers"], ["write"], WRITE_SCOPE), true);
});

Deno.test("a wildcard endpoint list still cannot escape the tier list", () => {
  // The point of checking tiers independently: one over-broad endpoint entry
  // is contained by the tier list rather than being total.
  assertEquals(scopeAllows(["*"], ["read"], WRITE_SCOPE), false);
  assertEquals(scopeAllows(["*"], ["read"], READ_SCOPE), true);
});

// ------------------------------------------------------------ authentication

Deno.test("a valid token authenticates and yields its partner context", async () => {
  const plain = "cass_pt_valid";
  const db = authDb([tokenRow({ token_hash: await sha256Hex(plain) })]);
  const out = await authenticate(bearer(plain), db, WRITE_SCOPE, THIS_INSTANCE, "a1");
  assert(out.ok);
  assertEquals(out.ctx.partnerId, "ptnr_x");
  assertEquals(out.ctx.actorType, "partner");
  assertEquals(out.ctx.idempotencyScope, "ptnr_x");
});

Deno.test("a missing token is a 401", async () => {
  const db = authDb([]);
  const out = await authenticate(
    new Request("https://x/transfers", { method: "POST" }),
    db,
    WRITE_SCOPE,
    THIS_INSTANCE,
    "a2",
  );
  assert(!out.ok);
  assertEquals(out.response.status, 401);
});

Deno.test("the legacy X-Api-Key header is still read", async () => {
  const plain = "cass_pt_legacyheader";
  const db = authDb([tokenRow({ token_hash: await sha256Hex(plain) })]);
  const r = new Request("https://x/transfers", { method: "POST", headers: { "X-Api-Key": plain } });
  const out = await authenticate(r, db, WRITE_SCOPE, THIS_INSTANCE, "a3");
  assert(out.ok);
});

Deno.test("an unknown token is a 401", async () => {
  const db = authDb([tokenRow({ token_hash: await sha256Hex("cass_pt_real") })]);
  const out = await authenticate(bearer("cass_pt_wrong"), db, WRITE_SCOPE, THIS_INSTANCE, "a4");
  assert(!out.ok);
  assertEquals(out.response.status, 401);
});

Deno.test("a revoked token is a 401 — status is filtered in the query", async () => {
  const plain = "cass_pt_revoked";
  const db = authDb([tokenRow({ token_hash: await sha256Hex(plain), status: "revoked" })]);
  const out = await authenticate(bearer(plain), db, WRITE_SCOPE, THIS_INSTANCE, "a5");
  assert(!out.ok);
  assertEquals(out.response.status, 401);
});

Deno.test("an expired token is a 401", async () => {
  const plain = "cass_pt_expired";
  const db = authDb([tokenRow({
    token_hash: await sha256Hex(plain),
    expires_at: new Date(Date.now() - 1000).toISOString(),
  })]);
  const out = await authenticate(bearer(plain), db, WRITE_SCOPE, THIS_INSTANCE, "a6");
  assert(!out.ok);
  assertEquals(out.response.status, 401);
});

Deno.test("a database error during auth fails CLOSED", async () => {
  const plain = "cass_pt_dberr";
  const db = authDb([tokenRow({ token_hash: await sha256Hex(plain) })], [partnerRow()], {
    error: "connection reset",
  });
  const out = await authenticate(bearer(plain), db, WRITE_SCOPE, THIS_INSTANCE, "a7");
  assert(!out.ok, "an unavailable database must not admit the request");
  assertEquals(out.response.status, 401);
});

// ------------------------------------------------------------------- scoping

Deno.test("an out-of-scope endpoint is 403, not 401 — the token IS valid", async () => {
  const plain = "cass_pt_narrow";
  const db = authDb([tokenRow({
    token_hash: await sha256Hex(plain),
    allowed_endpoints: ["GET /accounts/{id}"],
    allowed_tiers: ["read"],
  })]);
  const out = await authenticate(bearer(plain), db, WRITE_SCOPE, THIS_INSTANCE, "a8");
  assert(!out.ok);
  // the distinction matters: 401 means "who are you", 403 means "you, but not here"
  assertEquals(out.response.status, 403);
  assertEquals((await out.response.json()).type, "insufficient_scope");
});

Deno.test("a read-only token cannot reach a write endpoint", async () => {
  const plain = "cass_pt_readonly";
  const db = authDb([tokenRow({
    token_hash: await sha256Hex(plain),
    allowed_endpoints: ["*"],
    allowed_tiers: ["read"],
  })]);
  assertEquals((await authenticate(bearer(plain), db, READ_SCOPE, THIS_INSTANCE, "a9")).ok, true);
  const out = await authenticate(bearer(plain), db, WRITE_SCOPE, THIS_INSTANCE, "a10");
  assert(!out.ok);
  assertEquals(out.response.status, 403);
});

Deno.test("a partner cannot reach an ops-only endpoint even with '*' scope", async () => {
  const plain = "cass_pt_wildcard";
  const db = authDb([tokenRow({
    token_hash: await sha256Hex(plain),
    allowed_endpoints: ["*"],
    allowed_tiers: ["read", "write", "realtime", "bulk"],
  })]);
  const out = await authenticate(bearer(plain), db, OPS_SCOPE, THIS_INSTANCE, "a11");
  assert(!out.ok, "actor class is checked independently of scope breadth");
  assertEquals(out.response.status, 403);
  assert((await out.response.json()).detail.includes("pynthia_ops"));
});

Deno.test("an ops token reaches the ops-only endpoint", async () => {
  const plain = "cass_pt_ops";
  const db = authDb([tokenRow({
    token_hash: await sha256Hex(plain),
    actor_type: "pynthia_ops",
    partner_id: null,
    allowed_endpoints: ["*"],
    allowed_tiers: ["read", "write", "realtime", "bulk"],
  })]);
  const out = await authenticate(bearer(plain), db, OPS_SCOPE, THIS_INSTANCE, "a12");
  assert(out.ok);
  // no partner_id, but still a distinct idempotency namespace
  assertEquals(out.ctx.partnerId, null);
  assertEquals(out.ctx.idempotencyScope, "token:tok_1");
});

// ------------------------------------------------- card 51: instance binding

Deno.test("card 51: a token for ANOTHER instance is rejected here", async () => {
  const plain = "cass_pt_foreign";
  // the row exists and is perfectly valid — on fintech Y
  const db = authDb([tokenRow({
    token_hash: await sha256Hex(plain),
    instance_id: OTHER_INSTANCE,
  })]);
  const out = await authenticate(bearer(plain), db, WRITE_SCOPE, THIS_INSTANCE, "a13");
  assert(!out.ok, "a foreign token must never authenticate");
  assertEquals(out.response.status, 401);
});

Deno.test("card 51: a foreign token is INDISTINGUISHABLE from an unknown one", async () => {
  // If a foreign token produced a distinct error, someone holding one key could
  // probe every instance and map which fintechs exist. Both must be byte-for-
  // byte identical apart from the request id.
  const foreignDb = authDb([tokenRow({
    token_hash: await sha256Hex("cass_pt_foreign"),
    instance_id: OTHER_INSTANCE,
  })]);
  const emptyDb = authDb([]);

  const foreign = await authenticate(bearer("cass_pt_foreign"), foreignDb, WRITE_SCOPE, THIS_INSTANCE, "rid");
  const unknown = await authenticate(bearer("cass_pt_nosuch"), emptyDb, WRITE_SCOPE, THIS_INSTANCE, "rid");
  assert(!foreign.ok && !unknown.ok);
  assertEquals(foreign.response.status, unknown.response.status);
  assertEquals(await foreign.response.text(), await unknown.response.text());
});

Deno.test("card 51: a token whose PARTNER belongs elsewhere is rejected", async () => {
  // Defense in depth: the token row says this instance, but the partner it
  // names does not. Incoherent state fails closed rather than resolving.
  const plain = "cass_pt_mismatch";
  const db = authDb(
    [tokenRow({ token_hash: await sha256Hex(plain) })],
    [partnerRow({ instance_id: OTHER_INSTANCE })],
  );
  const out = await authenticate(bearer(plain), db, WRITE_SCOPE, THIS_INSTANCE, "a14");
  assert(!out.ok);
  assertEquals(out.response.status, 401);
});

Deno.test("a suspended partner's tokens stop working without being revoked", async () => {
  const plain = "cass_pt_suspended";
  const db = authDb(
    [tokenRow({ token_hash: await sha256Hex(plain) })],
    [partnerRow({ status: "suspended" })],
  );
  const out = await authenticate(bearer(plain), db, WRITE_SCOPE, THIS_INSTANCE, "a15");
  assert(!out.ok, "offboarding a fintech must not require revoking each token");
  assertEquals(out.response.status, 401);
});

// ------------------------------------------------------ demo key bootstrap

Deno.test("the demo key works when enabled and is refused when disabled", async () => {
  const db = authDb([]);
  const on = await authenticate(bearer("demo-secret"), db, WRITE_SCOPE, THIS_INSTANCE, "a16", {
    key: "demo-secret",
    enabled: true,
  });
  assert(on.ok);
  assertEquals(on.ctx.actorType, "pynthia_ops");
  assertEquals(on.ctx.idempotencyScope, "token:tok_demo_bootstrap");

  const off = await authenticate(bearer("demo-secret"), db, WRITE_SCOPE, THIS_INSTANCE, "a17", {
    key: "demo-secret",
    enabled: false,
  });
  assert(!off.ok, "ALLOW_DEMO_KEY=false must close the bootstrap path");
  assertEquals(off.response.status, 401);
});

Deno.test("the demo key runs the SAME scope checks, not a bypass", async () => {
  const db = authDb([]);
  // an endpoint restricted to an actor class the bootstrap key is not
  const cuOnly: EndpointScope = { endpoint: "GET /cu/report", tier: "read", actors: ["cu_admin"] };
  const out = await authenticate(bearer("demo-secret"), db, cuOnly, THIS_INSTANCE, "a18", {
    key: "demo-secret",
    enabled: true,
  });
  assert(!out.ok, "the bootstrap credential is scoped, not omnipotent");
  assertEquals(out.response.status, 403);
});

// -------------------------------------------------------------- token minting

Deno.test("a minted token never stores its own plaintext", async () => {
  const { plaintext, row } = await mintToken({
    id: "tok_new",
    actorType: "partner",
    partnerId: "ptnr_x",
    instanceId: THIS_INSTANCE,
    allowedEndpoints: ["POST /transfers"],
    allowedTiers: ["write"],
  });

  assert(plaintext.startsWith("cass_pt_"));
  // the row must contain the hash and nothing from which the token is derivable
  assertEquals(row.token_hash, await sha256Hex(plaintext));
  const serialized = JSON.stringify(row);
  assert(!serialized.includes(plaintext), "plaintext must never reach the database");
  // the prefix is a non-secret slice, short enough to be useless as a credential
  assert(plaintext.startsWith(row.token_prefix as string));
  assert((row.token_prefix as string).length < plaintext.length);
});

Deno.test("two mints never collide", async () => {
  const a = await mintToken({
    id: "t1", actorType: "partner", partnerId: "p", instanceId: THIS_INSTANCE,
    allowedEndpoints: ["*"], allowedTiers: ["read"],
  });
  const b = await mintToken({
    id: "t2", actorType: "partner", partnerId: "p", instanceId: THIS_INSTANCE,
    allowedEndpoints: ["*"], allowedTiers: ["read"],
  });
  assert(a.plaintext !== b.plaintext);
  assert(a.row.token_hash !== b.row.token_hash);
});

// -------------------------------------------- idempotency namespace (card 45)

Deno.test("two partners get distinct idempotency namespaces", async () => {
  const pa = "cass_pt_a", pb = "cass_pt_b";
  const db = authDb(
    [
      tokenRow({ id: "tok_a", token_hash: await sha256Hex(pa), partner_id: "ptnr_a" }),
      tokenRow({ id: "tok_b", token_hash: await sha256Hex(pb), partner_id: "ptnr_b" }),
    ],
    [partnerRow({ id: "ptnr_a" }), partnerRow({ id: "ptnr_b" })],
  );
  const a = await authenticate(bearer(pa), db, WRITE_SCOPE, THIS_INSTANCE, "a19");
  const b = await authenticate(bearer(pb), db, WRITE_SCOPE, THIS_INSTANCE, "a20");
  assert(a.ok && b.ok);
  // the whole point: the same Idempotency-Key from each is two separate claims
  assert(
    a.ctx.idempotencyScope !== b.ctx.idempotencyScope,
    "a shared namespace would let one partner replay the other's cached response",
  );
});
