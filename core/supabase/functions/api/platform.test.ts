// Phase-0 platform contract (cards 02, 03, 04).
//
// 02 — every error is the canonical typed envelope (request id + doc_url).
// 03 — every response carries X-API-Version; GET /changelog responds.
// 04 — list endpoints page forward with has_more / next_after.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { API_VERSION, getChangelog } from "./platform.ts";
import { getControlResults } from "./controls.ts";
import { apiError, jsonResponse, notFoundResponse } from "./lib.ts";
import { type Any } from "./test_helpers.ts";

// ----------------------------------------------------- 02: error envelope

Deno.test("errors carry the canonical envelope: status, type, title, request id, doc url", async () => {
  const res = notFoundResponse("req_x", "route", "/nope");
  assertEquals(res.status, 404);
  const b = await res.json();
  for (const key of ["status", "type", "title", "detail", "doc_url", "request_id"]) {
    assert(key in b, `envelope must carry ${key}`);
  }
  assertEquals(b.request_id, "req_x");
  assert(String(b.doc_url).startsWith("https://"), "doc_url must be a link");
});

Deno.test("apiError stamps the same envelope for arbitrary error types", async () => {
  const res = apiError(422, "some_condition", "req_y", { title: "T", detail: "D" });
  const b = await res.json();
  assertEquals(b.type, "some_condition");
  assertEquals(b.request_id, "req_y");
  assert("doc_url" in b);
});

// ----------------------------------------------------- 03: version header

Deno.test("success responses carry X-API-Version", () => {
  const res = jsonResponse({ ok: true }, 200, "req_z");
  assertEquals(res.headers.get("X-API-Version"), API_VERSION);
});

Deno.test("error responses carry X-API-Version too", () => {
  const res = apiError(404, "not_found", "req_z", { title: "T", detail: "D" });
  assertEquals(res.headers.get("X-API-Version"), API_VERSION);
});

Deno.test("GET /changelog responds newest-first and leads with the current version", async () => {
  const res = getChangelog("req_c");
  assertEquals(res.status, 200);
  const b = await res.json();
  assert(Array.isArray(b.data) && b.data.length > 0);
  assertEquals(b.data[0].version, API_VERSION);
  for (const e of b.data) {
    assert(e.version && e.date && Array.isArray(e.changes), "each entry: version, date, changes[]");
  }
});

// ------------------------------------------------------- 04: pagination

function pagedDb(rows: unknown[]) {
  const calls: { fn: string; args: unknown[] }[] = [];
  const chain: Any = {
    select: (...a: unknown[]) => (calls.push({ fn: "select", args: a }), chain),
    eq: (...a: unknown[]) => (calls.push({ fn: "eq", args: a }), chain),
    lt: (...a: unknown[]) => (calls.push({ fn: "lt", args: a }), chain),
    order: (...a: unknown[]) => (calls.push({ fn: "order", args: a }), chain),
    limit: (...a: unknown[]) => (calls.push({ fn: "limit", args: a }), chain),
    then: (res: (v: unknown) => unknown) => res({ data: rows, error: null }),
  };
  const db: Any = { schema: () => ({ from: () => chain }) };
  return { db, calls };
}
const rowAt = (i: number) => ({
  id: `cr_${i}`,
  control_id: "CG-LGTXN-01",
  decision: "pass",
  event: `tr_${i}`,
  subject_ref: "acct_x",
  score: null,
  created_at: `2026-07-19T00:00:${String(i).padStart(2, "0")}Z`,
});
const get = (qs = "") => new Request(`https://x/control-results${qs}`);

Deno.test("a full page signals has_more and hands back a cursor", async () => {
  // limit 2 -> endpoint should over-fetch by one to learn there is more
  const { db } = pagedDb([rowAt(9), rowAt(8), rowAt(7)]);
  const res = await getControlResults(get("?limit=2"), db, "p1");
  const b = await res.json();
  assertEquals(b.data.length, 2, "over-fetched probe row must not leak into the page");
  assertEquals(b.pagination.has_more, true);
  assertEquals(b.pagination.next_after, rowAt(8).created_at, "cursor is the last returned row's created_at");
});

Deno.test("a short page says has_more false with no cursor", async () => {
  const { db } = pagedDb([rowAt(3)]);
  const res = await getControlResults(get("?limit=2"), db, "p2");
  const b = await res.json();
  assertEquals(b.pagination.has_more, false);
  assertEquals(b.pagination.next_after, null);
});

Deno.test("after= filters strictly older than the cursor", async () => {
  const { db, calls } = pagedDb([]);
  await getControlResults(get("?after=2026-07-19T00:00:08Z"), db, "p3");
  const lt = calls.find((c) => c.fn === "lt");
  assertEquals(lt?.args[0], "created_at");
  assertEquals(lt?.args[1], "2026-07-19T00:00:08Z");
});

Deno.test("a malformed after cursor is refused", async () => {
  const { db } = pagedDb([]);
  const res = await getControlResults(get("?after=yesterday-ish"), db, "p4");
  assertEquals(res.status, 400);
  assert((await res.json()).errors.some((e: Any) => e.field === "after"));
});
