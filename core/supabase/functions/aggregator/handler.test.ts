// Aggregator handler — cards 55 (ingest completes: schema_version, PII
// refusal) and 61/56-58 (health + consumer routes). Auth edge cases live in
// auth.test.ts; these tests cover what an authenticated instance can do.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { handleAggregator } from "./handler.ts";
import { signInstanceJwt } from "./auth.ts";

const SECRET = "test-aggregator-secret";

async function jwt(instanceId = "inst_test"): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return await signInstanceJwt({ instance_id: instanceId, iat: now, exp: now + 300 }, SECRET);
}

// deno-lint-ignore no-explicit-any
type Any = any;

function stubDb(opts: { rpcResults?: Record<string, Any>; credentials?: Record<string, string> } = {}) {
  const upserts: { table: string; rows: Any; opts: Any }[] = [];
  const rpcs: { fn: string; args: Any }[] = [];
  const db: Any = {
    schema: (_s: string) => ({
      from: (table: string) => ({
        upsert: (rows: Any, o: Any) => {
          upserts.push({ table, rows, opts: o });
          return Promise.resolve({ data: null, error: null });
        },
        select: () => ({
          eq: (_c: string, id: string) => ({
            maybeSingle: () => {
              const hash = opts.credentials?.[id];
              return Promise.resolve({
                data: hash ? { instance_id: id, client_secret_hash: hash } : null,
                error: null,
              });
            },
          }),
        }),
      }),
      rpc: (fn: string, args?: Any) => {
        rpcs.push({ fn, args });
        return Promise.resolve({
          data: opts.rpcResults?.[fn] ?? { consumer: fn, processed: 0 },
          error: null,
        });
      },
    }),
  };
  return { db, upserts, rpcs };
}

async function sha256hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function req(path: string, body: unknown, token: string, method = "POST"): Request {
  return new Request(`https://agg.test/aggregator${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: method === "GET" ? undefined : JSON.stringify(body),
  });
}

Deno.test("ingest stamps instance_id from the TOKEN and defaults schema_version", async () => {
  const { db, upserts } = stubDb();
  const res = await handleAggregator(
    req("/events/ingest", {
      events: [{ id: "evt_1", code: "transfer.settled", resource_id: "t1", payload: { amount_cents: 100 }, instance_id: "inst_forged" }],
    }, await jwt("inst_real")),
    { jwtSecret: SECRET, db },
    "t",
  );
  assertEquals(res.status, 200);
  assertEquals(upserts[0].rows[0].instance_id, "inst_real"); // never the body's claim
  assertEquals(upserts[0].rows[0].schema_version, 1);
  assertEquals(upserts[0].opts.onConflict, "event_id");
});

Deno.test("raw PII in a payload is refused with a NAMED 400 — identity crosses only as entity_hash", async () => {
  const { db, upserts } = stubDb();
  const res = await handleAggregator(
    req("/events/ingest", {
      events: [{ id: "evt_1", code: "entity.created", payload: { name: "Dana Whitfield" } }],
    }, await jwt()),
    { jwtSecret: SECRET, db },
    "t",
  );
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.type, "raw_pii_refused");
  assert(body.detail.includes("'name'"), "the refused key is named");
  assertEquals(upserts.length, 0, "nothing may be stored");
});

Deno.test("GET /health runs the SQL health check (card 61)", async () => {
  const { db, rpcs } = stubDb();
  const res = await handleAggregator(
    req("/health", null, await jwt(), "GET"),
    { jwtSecret: SECRET, db },
    "t",
  );
  assertEquals(res.status, 200);
  assertEquals(rpcs[0].fn, "health");
});

// ---- card 64: /auth/token ----

Deno.test("/auth/token exchanges a valid client secret for a 300s JWT", async () => {
  const { db } = stubDb({ credentials: { inst_a: await sha256hex("s3cret") } });
  const res = await handleAggregator(
    req("/auth/token", { instance_id: "inst_a", client_secret: "s3cret" }, ""),
    { jwtSecret: SECRET, db },
    "t",
  );
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.expires_in, 300);
  assert(body.access_token.split(".").length === 3, "a JWT comes back");
});

Deno.test("/auth/token: wrong secret and unknown instance are the SAME 401", async () => {
  const { db } = stubDb({ credentials: { inst_a: await sha256hex("s3cret") } });
  const wrong = await handleAggregator(
    req("/auth/token", { instance_id: "inst_a", client_secret: "nope" }, ""),
    { jwtSecret: SECRET, db },
    "t",
  );
  const unknown = await handleAggregator(
    req("/auth/token", { instance_id: "inst_ghost", client_secret: "s3cret" }, ""),
    { jwtSecret: SECRET, db },
    "t",
  );
  assertEquals(wrong.status, 401);
  assertEquals(unknown.status, 401);
  assertEquals((await wrong.json()).detail, (await unknown.json()).detail, "indistinguishable");
});

// ---- cards 52/54: cu_admin reads, cross-fintech search confinement ----

async function adminJwt(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return await signInstanceJwt(
    { instance_id: "cu_admin_main", iat: now, exp: now + 300, role: "cu_admin" },
    SECRET,
  );
}

Deno.test("cu_admin reads across instances; an instance token cannot (card 52)", async () => {
  const { db, rpcs } = stubDb({ rpcResults: { admin_overview: [] } });
  const ok = await handleAggregator(
    req("/admin/overview", null, await adminJwt(), "GET"),
    { jwtSecret: SECRET, db },
    "t",
  );
  assertEquals(ok.status, 200);
  assertEquals(rpcs[0].fn, "admin_overview");
  const refused = await handleAggregator(
    req("/admin/overview", null, await jwt("inst_a"), "GET"),
    { jwtSecret: SECRET, db },
    "t",
  );
  assertEquals(refused.status, 403);
  assertEquals((await refused.json()).type, "cu_admin_only");
});

Deno.test("cu_admin writes are refused wholesale — read-only by credential class (card 52)", async () => {
  const { db, upserts } = stubDb();
  for (const p of ["/events/ingest", "/originations", "/consumers/payment_hub/run"]) {
    const res = await handleAggregator(
      req(p, { events: [{ id: "e1", code: "x" }], amount_cents: 5 }, await adminJwt()),
      { jwtSecret: SECRET, db },
      "t",
    );
    assertEquals(res.status, 403, `${p} must refuse an admin write`);
    assertEquals((await res.json()).type, "admin_read_only");
  }
  assertEquals(upserts.length, 0);
});

Deno.test("cross-fintech search: cu_admin by entity_hash only; instance tokens refused (card 54)", async () => {
  const { db, rpcs } = stubDb({ rpcResults: { search_entity: { entity_hash: "abc", instances: [] } } });
  const ok = await handleAggregator(
    req("/search?entity_hash=abc", null, await adminJwt(), "GET"),
    { jwtSecret: SECRET, db },
    "t",
  );
  assertEquals(ok.status, 200);
  assertEquals(rpcs[0].args.p_hash, "abc");
  const noHash = await handleAggregator(
    req("/search", null, await adminJwt(), "GET"),
    { jwtSecret: SECRET, db },
    "t",
  );
  assertEquals(noHash.status, 400, "identity cannot be the key — entity_hash is required");
  const inst = await handleAggregator(
    req("/search?entity_hash=abc", null, await jwt("inst_a"), "GET"),
    { jwtSecret: SECRET, db },
    "t",
  );
  assertEquals(inst.status, 403, "an instance reading cross-fintech is D23 contamination");
});

// ---- cards 65/66/67: FBO reads + origination flow ----

Deno.test("GET /fbo reads the TOKEN's instance — no path parameter to read another's", async () => {
  const { db, rpcs } = stubDb();
  const res = await handleAggregator(
    req("/fbo", null, await jwt("inst_mine"), "GET"),
    { jwtSecret: SECRET, db },
    "t",
  );
  assertEquals(res.status, 200);
  assertEquals(rpcs[0].fn, "fbo_read");
  assertEquals(rpcs[0].args.p_instance, "inst_mine");
});

Deno.test("a clean origination returns 201 pending (card 66)", async () => {
  const { db, rpcs } = stubDb({
    rpcResults: { originate: { origination_id: "org_1", status: "pending", amount_cents: 500 } },
  });
  const res = await handleAggregator(
    req("/originations", { amount_cents: 500 }, await jwt("inst_a")),
    { jwtSecret: SECRET, db },
    "t",
  );
  assertEquals(res.status, 201);
  assertEquals((await res.json()).status, "pending");
  assertEquals(rpcs[0].args.p_instance, "inst_a");
});

Deno.test("a stale payment hub is a 503 WITH Retry-After (card 66)", async () => {
  const { db } = stubDb({
    rpcResults: {
      originate: { error: "consumer_stale", retry_after_secs: 120, detail: "hub last ran long ago" },
    },
  });
  const res = await handleAggregator(
    req("/originations", { amount_cents: 500 }, await jwt()),
    { jwtSecret: SECRET, db },
    "t",
  );
  assertEquals(res.status, 503);
  assertEquals(res.headers.get("Retry-After"), "120");
  assertEquals((await res.json()).type, "consumer_stale");
});

Deno.test("saga exits route to accept/reject; resolved twice is a 409 (card 67)", async () => {
  const { db, rpcs } = stubDb({
    rpcResults: {
      accept_origination: { origination_id: "org_1", status: "accepted" },
      reject_origination: { error: "wrong_state", status: "accepted" },
    },
  });
  const ok = await handleAggregator(
    req("/originations/org_1/accept", {}, await jwt()),
    { jwtSecret: SECRET, db },
    "t",
  );
  assertEquals(ok.status, 200);
  assertEquals(rpcs[0].fn, "accept_origination");
  const twice = await handleAggregator(
    req("/originations/org_1/reject", {}, await jwt()),
    { jwtSecret: SECRET, db },
    "t",
  );
  assertEquals(twice.status, 409);
});

Deno.test("POST /consumers/{name}/run drives exactly the named consumer (cards 56-58)", async () => {
  const { db, rpcs } = stubDb();
  for (const [name, fn] of [["bsa_approver", "run_bsa_approver"]]) {
    const res = await handleAggregator(
      req(`/consumers/${name}/run`, {}, await jwt()),
      { jwtSecret: SECRET, db },
      "t",
    );
    assertEquals(res.status, 200);
    assertEquals(rpcs.at(-1)?.fn, fn);
  }
  const res = await handleAggregator(
    req("/consumers/rm_rf/run", {}, await jwt()),
    { jwtSecret: SECRET, db },
    "t",
  );
  assertEquals(res.status, 404, "unknown consumers are not a dispatch surface");

  // payment_hub was RETIRED with the accumulator (migration 20260817000100).
  // It must 404 like any other unknown consumer rather than linger as a
  // 200-returning no-op — a healthy-looking consumer that does nothing is how
  // the position it used to maintain stayed wrong for a year.
  const retired = await handleAggregator(
    req("/consumers/payment_hub/run", {}, await jwt()),
    { jwtSecret: SECRET, db },
    "t",
  );
  assertEquals(retired.status, 404, "the FBO position is a roll-up; nothing runs to maintain it");
});
