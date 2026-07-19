// Card 51 — the aggregator boundary.
//
// Two things are proved here. First, that a partner key is rejected at the
// aggregator (the card's done criterion). Second, that the instance JWT which
// IS accepted cannot be forged with the classic JWT attacks — a boundary that
// rejects partner tokens but accepts alg:"none" has not moved the security
// anywhere.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { looksLikePartnerToken, signInstanceJwt, verifyInstanceJwt } from "./auth.ts";
import { handleAggregator } from "./handler.ts";

const SECRET = "aggregator-signing-secret";
const NOW = 1_800_000_000_000; // fixed clock; Date.now() would make expiry tests flaky
const nowSec = Math.floor(NOW / 1000);

function claims(over: Record<string, unknown> = {}) {
  return { instance_id: "inst_fintech_x", iat: nowSec, exp: nowSec + 900, ...over } as {
    instance_id: string;
    iat: number;
    exp: number;
  };
}

function aggReq(token: string | null, body: unknown = { events: [] }): Request {
  return new Request("https://x/aggregator/events/ingest", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}`, "content-type": "application/json" } : {},
    body: JSON.stringify(body),
  });
}

// deno-lint-ignore no-explicit-any
function ingestDb(): { db: any; rows: any[] } {
  // deno-lint-ignore no-explicit-any
  const rows: any[] = [];
  // deno-lint-ignore no-explicit-any
  const db: any = {
    schema: () => ({
      from: () => ({
        // deno-lint-ignore no-explicit-any
        upsert: (r: any[]) => {
          rows.push(...r);
          return Promise.resolve({ error: null });
        },
      }),
    }),
  };
  return { db, rows };
}

// ------------------------------------------------------------ JWT mechanics

Deno.test("a signed instance JWT round-trips", async () => {
  const jwt = await signInstanceJwt(claims(), SECRET);
  const out = await verifyInstanceJwt(jwt, SECRET, NOW);
  assert(out.ok);
  assertEquals(out.claims.instance_id, "inst_fintech_x");
});

Deno.test('alg:"none" is refused — the token cannot vouch for itself', async () => {
  const enc = (o: unknown) =>
    btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const forged = `${enc({ alg: "none", typ: "JWT" })}.${enc(claims())}.`;
  const out = await verifyInstanceJwt(forged, SECRET, NOW);
  assert(!out.ok);
  assertEquals(out.reason, "unsupported_alg");
});

Deno.test("a token signed with the wrong secret is refused", async () => {
  const jwt = await signInstanceJwt(claims(), "attacker-secret");
  const out = await verifyInstanceJwt(jwt, SECRET, NOW);
  assert(!out.ok);
  assertEquals(out.reason, "bad_signature");
});

Deno.test("tampering with the payload invalidates the signature", async () => {
  const jwt = await signInstanceJwt(claims(), SECRET);
  const [h, _p, s] = jwt.split(".");
  const swapped = btoa(JSON.stringify(claims({ instance_id: "inst_fintech_y" })))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  // claiming to be another instance is exactly the cross-contamination D23 bars
  const out = await verifyInstanceJwt(`${h}.${swapped}.${s}`, SECRET, NOW);
  assert(!out.ok);
  assertEquals(out.reason, "bad_signature");
});

Deno.test("an expired token is refused", async () => {
  const jwt = await signInstanceJwt(claims({ iat: nowSec - 7200, exp: nowSec - 3600 }), SECRET);
  const out = await verifyInstanceJwt(jwt, SECRET, NOW);
  assert(!out.ok);
  assertEquals(out.reason, "expired");
});

Deno.test("a token with no expiry is refused, not treated as eternal", async () => {
  const enc = (o: unknown) =>
    btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const header = enc({ alg: "HS256", typ: "JWT" });
  const payload = enc({ instance_id: "inst_fintech_x", iat: nowSec });
  // sign it properly so only the missing exp can be what rejects it
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${header}.${payload}`));
  const b64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const out = await verifyInstanceJwt(`${header}.${payload}.${b64}`, SECRET, NOW);
  assert(!out.ok);
  assertEquals(out.reason, "missing_expiry");
});

Deno.test("D19 caps instance tokens at one hour", async () => {
  // validly signed and not yet expired, but minted with a 24-hour life: a
  // compromised signer must not be able to issue effectively permanent creds
  const jwt = await signInstanceJwt(claims({ exp: nowSec + 86400 }), SECRET);
  const out = await verifyInstanceJwt(jwt, SECRET, NOW);
  assert(!out.ok);
  assertEquals(out.reason, "lifetime_too_long");
});

Deno.test("an iat far in the future is refused", async () => {
  // the way a caller would otherwise smuggle a long-lived token past the
  // lifetime cap: push iat forward so exp - iat looks small
  const jwt = await signInstanceJwt(claims({ iat: nowSec + 86400, exp: nowSec + 86400 + 900 }), SECRET);
  const out = await verifyInstanceJwt(jwt, SECRET, NOW);
  assert(!out.ok);
  assertEquals(out.reason, "issued_in_future");
});

Deno.test("malformed tokens are refused without throwing", async () => {
  for (const bad of ["", "a", "a.b", "a.b.c.d", "!!!.???.***"]) {
    const out = await verifyInstanceJwt(bad, SECRET, NOW);
    assert(!out.ok, `${bad} must be refused`);
  }
});

// ---------------------------------------- card 51: partner keys at the edge

Deno.test("partner tokens are recognisable by prefix", () => {
  assertEquals(looksLikePartnerToken("cass_pt_abc123"), true);
  assertEquals(looksLikePartnerToken("eyJhbGciOiJIUzI1NiJ9.x.y"), false);
});

Deno.test("card 51: a partner key is REJECTED at the aggregator", async () => {
  const { db } = ingestDb();
  const res = await handleAggregator(
    aggReq("cass_pt_perfectlyvalidoninstancex"),
    { jwtSecret: SECRET, db, now: NOW },
    "r1",
  );
  assertEquals(res.status, 403);
  const b = await res.json();
  assertEquals(b.type, "partner_token_not_valid_here");
  // the refusal explains itself: the presenter already knows they hold a
  // partner token, so naming it leaks nothing and saves an afternoon
  assert(b.detail.includes("never accepted at the aggregator"));
});

Deno.test("card 51: a partner key is refused even when the aggregator is misconfigured", async () => {
  const { db } = ingestDb();
  const res = await handleAggregator(
    aggReq("cass_pt_something"),
    { jwtSecret: undefined, db, now: NOW }, // no signing key at all
    "r2",
  );
  // 403, not a 500 that leaks server state — the class check does not depend
  // on the aggregator's own configuration
  assertEquals(res.status, 403);
  assertEquals((await res.json()).type, "partner_token_not_valid_here");
});

Deno.test("card 51: the X-Api-Key header does not work at the aggregator either", async () => {
  const { db } = ingestDb();
  const r = new Request("https://x/aggregator/events/ingest", {
    method: "POST",
    headers: { "X-Api-Key": "cass_pt_viaheader", "content-type": "application/json" },
    body: JSON.stringify({ events: [] }),
  });
  const res = await handleAggregator(r, { jwtSecret: SECRET, db, now: NOW }, "r3");
  assertEquals(res.status, 403);
});

Deno.test("no credential at all is a 401", async () => {
  const { db } = ingestDb();
  const res = await handleAggregator(aggReq(null), { jwtSecret: SECRET, db, now: NOW }, "r4");
  assertEquals(res.status, 401);
});

// ------------------------------------------------------------ event ingest

Deno.test("a valid instance JWT reaches ingest", async () => {
  const { db, rows } = ingestDb();
  const jwt = await signInstanceJwt(claims(), SECRET);
  const res = await handleAggregator(
    aggReq(jwt, { events: [{ id: "evt_1", code: "transfer.settled", resource_id: "transfer:t1" }] }),
    { jwtSecret: SECRET, db, now: NOW },
    "r5",
  );
  assertEquals(res.status, 200);
  assertEquals((await res.json()).ingested, 1);
  assertEquals(rows[0].event_id, "evt_1");
});

Deno.test("instance_id comes from the TOKEN, never from the body", async () => {
  const { db, rows } = ingestDb();
  const jwt = await signInstanceJwt(claims({ instance_id: "inst_fintech_x" }), SECRET);
  const res = await handleAggregator(
    aggReq(jwt, {
      events: [{
        id: "evt_2",
        code: "transfer.settled",
        // fintech X trying to write events attributed to fintech Y
        instance_id: "inst_fintech_y",
      }],
    }),
    { jwtSecret: SECRET, db, now: NOW },
    "r6",
  );
  assertEquals(res.status, 200);
  assertEquals(
    rows[0].instance_id,
    "inst_fintech_x",
    "a body-supplied instance_id must never override the verified claim",
  );
});

Deno.test("ingest requires a non-empty events array", async () => {
  const { db } = ingestDb();
  const jwt = await signInstanceJwt(claims(), SECRET);
  for (const body of [{}, { events: [] }, { events: "nope" }]) {
    const res = await handleAggregator(aggReq(jwt, body), { jwtSecret: SECRET, db, now: NOW }, "r7");
    assertEquals(res.status, 400);
  }
});

Deno.test("an event with no id is refused — dedup depends on it", async () => {
  const { db } = ingestDb();
  const jwt = await signInstanceJwt(claims(), SECRET);
  const res = await handleAggregator(
    aggReq(jwt, { events: [{ code: "transfer.settled" }] }),
    { jwtSecret: SECRET, db, now: NOW },
    "r8",
  );
  assertEquals(res.status, 400);
});
