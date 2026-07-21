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

function stubDb() {
  const upserts: { table: string; rows: Any; opts: Any }[] = [];
  const rpcs: { fn: string; args: Any }[] = [];
  const db: Any = {
    schema: (_s: string) => ({
      from: (table: string) => ({
        upsert: (rows: Any, opts: Any) => {
          upserts.push({ table, rows, opts });
          return Promise.resolve({ data: null, error: null });
        },
      }),
      rpc: (fn: string, args?: Any) => {
        rpcs.push({ fn, args });
        return Promise.resolve({ data: { consumer: fn, processed: 0 }, error: null });
      },
    }),
  };
  return { db, upserts, rpcs };
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

Deno.test("POST /consumers/{name}/run drives exactly the named consumer (cards 56-58)", async () => {
  const { db, rpcs } = stubDb();
  for (const [name, fn] of [["payment_hub", "run_payment_hub"], ["bsa_approver", "run_bsa_approver"]]) {
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
});
