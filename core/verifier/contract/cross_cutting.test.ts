// TEST-CATALOG Tier 1 — cross-cutting contract: D12 errors, D13 versioning,
// D16 pagination, D5 auth. Black-box over HTTP; see helpers.ts for the
// isolation model.
import { api, assert, assertEq, assertErrorShape, t } from "./helpers.ts";

// ---------------------------------------------------------------- D12 errors

t("D12-T1: a single error carries status/type/title/detail/doc_url/request_id", async () => {
  const r = await api("GET", "/definitely-not-a-route");
  assertEq(r.status, 404, "unknown route is 404");
  assertErrorShape(r, "D12-T1");
});

t("D12-T2: validation failure is type:validation_error with per-field errors[]", async () => {
  const r = await api("POST", "/entities", {}); // type + name missing
  assertEq(r.status, 400, "D12-T2: validation is 400");
  assertEq(r.body.type, "validation_error", "D12-T2: type");
  assert(Array.isArray(r.body.errors) && r.body.errors.length > 0, "D12-T2: errors[] non-empty");
  for (const e of r.body.errors) {
    assert("type" in e && "field" in e && "message" in e,
      `D12-T2: per-field error needs type/field/message — got ${JSON.stringify(e)}`);
  }
});

t("D12-T3: request_id is unique per response", async () => {
  const a = await api("GET", "/definitely-not-a-route");
  const b = await api("GET", "/definitely-not-a-route");
  assert(a.body.request_id !== b.body.request_id, "D12-T3: two calls, two request_ids");
});

// ------------------------------------------------------------ D13 versioning

t("D13-T1: every response carries X-API-Version MAJOR.MINOR.PATCH", async () => {
  const ok = await api("GET", "/changelog");
  const err = await api("GET", "/definitely-not-a-route");
  for (const [name, r] of [["success", ok], ["error", err]] as const) {
    const v = r.headers.get("x-api-version");
    assert(v && /^\d+\.\d+\.\d+$/.test(v), `D13-T1: ${name} response version header, got '${v}'`);
  }
});

t("D13-T2: GET /changelog returns structured entries", async () => {
  const r = await api("GET", "/changelog");
  assertEq(r.status, 200, "D13-T2: 200");
  const entries = r.body.data ?? r.body;
  assert(Array.isArray(entries) && entries.length > 0, "D13-T2: non-empty list");
  for (const e of entries.slice(0, 3)) {
    assert("version" in e && "date" in e && "changes" in e,
      `D13-T2: entry needs version/date/changes — got ${JSON.stringify(e).slice(0, 120)}`);
  }
});

// ------------------------------------------------------------ D16 pagination

t("D16-T1: list endpoints return data + pagination{has_more,next_after,limit}", async () => {
  const r = await api("GET", "/cards?limit=2");
  assertEq(r.status, 200, "D16-T1: 200");
  assert(Array.isArray(r.body.data), "D16-T1: data[]");
  const p = r.body.pagination ?? {};
  for (const f of ["has_more", "next_after", "limit"]) {
    assert(f in p, `D16-T1: pagination.${f} present`);
  }
});

t("D16-T2: ?after= returns the next page with no overlap", async () => {
  const first = await api("GET", "/cards?limit=3");
  if (!first.body.pagination?.has_more) return; // not enough rows to page — vacuous
  const cursor = encodeURIComponent(String(first.body.pagination.next_after));
  const second = await api("GET", `/cards?limit=3&after=${cursor}`);
  assertEq(second.status, 200, "D16-T2: second page 200");
  const a = new Set(first.body.data.map((x: { id: string }) => x.id));
  for (const row of second.body.data) {
    assert(!a.has(row.id), `D16-T2: row ${row.id} appears on both pages`);
  }
});

t("D16-T3: limit bounds are enforced, not 500s", async () => {
  const one = await api("GET", "/cards?limit=1");
  assertEq(one.body.data.length, 1, "D16-T3: limit=1 returns 1");
  for (const bad of ["0", "-5", "100000", "banana"]) {
    const r = await api("GET", `/cards?limit=${bad}`);
    assert(r.status !== 500, `D16-T3: limit=${bad} must not 500 (got ${r.status})`);
    if (r.status === 200) {
      assert(r.body.data.length <= 200, `D16-T3: limit=${bad} clamped (got ${r.body.data.length} rows)`);
    }
  }
});

t("D16-T4: the final page says has_more:false, next_after:null", async () => {
  let cursor: string | null = null;
  for (let page = 0; page < 60; page++) {
    const q = cursor ? `?limit=100&after=${encodeURIComponent(cursor)}` : "?limit=100";
    const r = await api("GET", `/cards${q}`);
    assertEq(r.status, 200, `D16-T4: page ${page} 200`);
    if (!r.body.pagination.has_more) {
      assertEq(r.body.pagination.next_after, null, "D16-T4: terminal next_after is null");
      return;
    }
    cursor = String(r.body.pagination.next_after);
  }
  throw new Error("D16-T4: 60 pages of 100 without termination — cursor loop?");
});

// ------------------------------------------------------------------ D5 auth

t("D5-T1: a valid partner key reaches an allowed endpoint", async () => {
  const r = await api("GET", "/changelog");
  assertEq(r.status, 200, "D5-T1");
});

t("D5-T3: missing or invalid key is 401 with the error envelope", async () => {
  const missing = await api("GET", "/cards", undefined, { key: null });
  assertEq(missing.status, 401, "D5-T3: no key");
  assertErrorShape(missing, "D5-T3 missing");
  const invalid = await api("GET", "/cards", undefined, { key: "not-a-real-key" });
  assertEq(invalid.status, 401, "D5-T3: bad key");
  assertErrorShape(invalid, "D5-T3 invalid");
});

// D5-T2 is written and IGNORED: the demo key is deliberately an INTERNAL
// actor (demo posture — ALLOW_DEMO_KEY), so it legitimately reaches
// /internal/* and cannot demonstrate partner scoping. The test needs a real
// partner-scoped token, which has no provisioning API; catalog state [~].
t("D5-T2: a partner key scoped away from an internal endpoint cannot reach it", async () => {
  const r = await api("POST", "/internal/role-grants", { subject_ref: "x", role_id: "y" });
  assert(r.status === 404 || r.status === 403, `D5-T2: expected 404/403, got ${r.status}`);
  assertErrorShape(r, "D5-T2");
}, true);
