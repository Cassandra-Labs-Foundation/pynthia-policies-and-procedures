// Card 16: events outbox + worker.
//
// core.event IS the outbox — every rail, entity, lock and verification already
// writes into it. The worker sweeps undelivered rows, POSTs each to the
// target, marks delivery on a 2xx, and RETRIES with growing backoff when the
// target is down. An event is never lost: failure only reschedules it.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { deliverEvents } from "./events.ts";
import { type Any, json } from "./test_helpers.ts";

function outboxDb(rows: Record<string, unknown>[]) {
  const updates: { id: string; patch: Record<string, unknown> }[] = [];
  let lastId = "";
  const chain: Any = {
    select: () => chain,
    is: () => chain,
    or: () => chain,
    order: () => chain,
    limit: () => chain,
    eq: (_col: string, id: string) => ((lastId = id), chain),
    update: (patch: Record<string, unknown>) => {
      const self: Any = {
        eq: (_c: string, id: string) => {
          updates.push({ id, patch });
          return Promise.resolve({ data: null, error: null });
        },
        in: (_c: string, ids: string[]) => {
          for (const id of ids) updates.push({ id, patch });
          return Promise.resolve({ data: null, error: null });
        },
      };
      return self;
    },
    then: (res: (v: unknown) => unknown) => res({ data: rows, error: null }),
  };
  const db: Any = { schema: () => ({ from: () => chain }) };
  return { db, updates };
}

function sink(responses: Response[]) {
  const sent: { url: string; body: Any }[] = [];
  let i = 0;
  const fetchFn = (url: string | URL | Request, init?: RequestInit) => {
    sent.push({ url: String(url), body: init?.body ? JSON.parse(init.body as string) : null });
    return Promise.resolve(responses[i++] ?? new Response("{}", { status: 200 }));
  };
  return { fetchFn, sent };
}

const EVT = (id: string, attempts = 0) => ({
  id,
  code: "entity.created",
  type: "entity",
  resource_id: "ent_1",
  payload: { hello: "world" },
  delivery_attempts: attempts,
  created_at: "2026-07-19T00:00:00Z",
});

Deno.test("due events are delivered to the target and marked delivered", async () => {
  const { db, updates } = outboxDb([EVT("evt_1"), EVT("evt_2")]);
  const { fetchFn, sent } = sink([json({ ok: true }), json({ ok: true })]);

  const out = await deliverEvents(db, { fetchFn, targetUrl: "https://sink.test/hook", apiKey: "k" });
  assertEquals(out.delivered, 2);
  assertEquals(sent.length, 2);
  assertEquals(sent[0].url, "https://sink.test/hook");
  assertEquals(sent[0].body.id, "evt_1");
  assertEquals(sent[0].body.code, "entity.created");
  for (const u of updates) assert(u.patch.delivered_at, `${u.id} must be marked delivered`);
});

Deno.test("a down target reschedules the event instead of losing it", async () => {
  const { db, updates } = outboxDb([EVT("evt_1")]);
  const { fetchFn } = sink([json({ error: "boom" }, 503)]);

  const out = await deliverEvents(db, { fetchFn, targetUrl: "https://sink.test/hook", apiKey: "k" });
  assertEquals(out.delivered, 0);
  assertEquals(out.failed, 1);
  const patch = updates[0].patch;
  assertEquals(patch.delivered_at, undefined, "failure must not mark delivery");
  assertEquals(patch.delivery_attempts, 1);
  assert(new Date(String(patch.next_attempt_at)).getTime() > Date.now(), "retry is scheduled in the future");
});

Deno.test("backoff grows with the attempt count", async () => {
  const { db: db1, updates: u1 } = outboxDb([EVT("evt_1", 0)]);
  const { db: db5, updates: u5 } = outboxDb([EVT("evt_1", 4)]);
  const failing = () => sink([json({ error: "down" }, 503)]);

  await deliverEvents(db1, { fetchFn: failing().fetchFn, targetUrl: "https://s/h", apiKey: "k" });
  await deliverEvents(db5, { fetchFn: failing().fetchFn, targetUrl: "https://s/h", apiKey: "k" });
  const wait1 = new Date(String(u1[0].patch.next_attempt_at)).getTime() - Date.now();
  const wait5 = new Date(String(u5[0].patch.next_attempt_at)).getTime() - Date.now();
  assert(wait5 > wait1 * 2, `attempt-5 backoff (${wait5}ms) must dwarf attempt-1 (${wait1}ms)`);
});

Deno.test("a thrown fetch (network down) is a retry, not a crash", async () => {
  const { db, updates } = outboxDb([EVT("evt_1")]);
  const fetchFn = () => Promise.reject(new TypeError("connection refused"));

  const out = await deliverEvents(db, { fetchFn, targetUrl: "https://s/h", apiKey: "k" });
  assertEquals(out.failed, 1);
  assertEquals(updates[0].patch.delivery_attempts, 1);
});

Deno.test("an empty outbox sweep is a clean no-op", async () => {
  const { db, updates } = outboxDb([]);
  const { fetchFn, sent } = sink([]);
  const out = await deliverEvents(db, { fetchFn, targetUrl: "https://s/h", apiKey: "k" });
  assertEquals(out, { swept: 0, delivered: 0, failed: 0 });
  assertEquals(sent.length, 0);
  assertEquals(updates.length, 0);
});

// ---- card 55: the outbox targets the aggregator for real ----

const AGG = { url: "https://agg.test/aggregator", jwt: "hdr.claims.sig" };

Deno.test("aggregator mode: one batched POST with a Bearer instance JWT, all marked delivered", async () => {
  const { db, updates } = outboxDb([EVT("evt_1"), EVT("evt_2"), EVT("evt_3")]);
  const { fetchFn, sent } = sink([json({ ingested: 3 })]);

  const out = await deliverEvents(db, {
    fetchFn,
    targetUrl: "https://sink.test/hook",
    apiKey: "k",
    aggregator: AGG,
  });

  assertEquals(out, { swept: 3, delivered: 3, failed: 0 });
  assertEquals(sent.length, 1); // ONE request, not one per event
  assertEquals(sent[0].url, "https://agg.test/aggregator/events/ingest");
  assertEquals(sent[0].body.events.length, 3);
  assertEquals(sent[0].body.events[0].id, "evt_1");
  assertEquals(sent[0].body.events[0].schema_version, 1);
  assert("entity_hash" in sent[0].body.events[0], "batch must carry entity_hash");
  assertEquals(updates.length, 3);
  for (const u of updates) assert(u.patch.delivered_at, "every event marked delivered");
});

Deno.test("aggregator refusal reschedules the WHOLE batch with backoff — nothing is lost", async () => {
  const { db, updates } = outboxDb([EVT("evt_1"), EVT("evt_2", 2)]);
  const { fetchFn } = sink([new Response("{}", { status: 503 })]);

  const out = await deliverEvents(db, {
    fetchFn,
    targetUrl: "https://sink.test/hook",
    apiKey: "k",
    aggregator: AGG,
  });

  assertEquals(out, { swept: 2, delivered: 0, failed: 2 });
  assertEquals(updates.length, 2);
  for (const u of updates) {
    assert(!("delivered_at" in u.patch), "a refused batch delivers nothing");
    assert(u.patch.next_attempt_at, "and everything is rescheduled");
  }
  // per-event attempt counts still advance independently
  assertEquals(updates.find((u) => u.id === "evt_1")?.patch.delivery_attempts, 1);
  assertEquals(updates.find((u) => u.id === "evt_2")?.patch.delivery_attempts, 3);
});

Deno.test("without aggregator config the sink path is untouched", async () => {
  const { db } = outboxDb([EVT("evt_1")]);
  const { fetchFn, sent } = sink([json({ ok: true })]);
  await deliverEvents(db, { fetchFn, targetUrl: "https://sink.test/hook", apiKey: "k" });
  assertEquals(sent[0].url, "https://sink.test/hook");
});
