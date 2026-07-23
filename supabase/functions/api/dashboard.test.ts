// Compliance dashboard — the panels aggregate EVIDENCE rows; these tests pin
// that the aggregation is faithful (counts by control/decision, triage
// overdue, CTR clocks, dual-control queue, outbox depth), that partners get
// the BSA-style 404, and that the public shell carries zero data.
import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { type PartnerContext } from "./auth.ts";
import {
  getDashboardData,
  getDashboardEvents,
  getDashboardHeartbeat,
  getDashboardShell,
  getDashboardTrace,
} from "./dashboard.ts";

type Row = Record<string, unknown>;

// Filter-aware stub: applies eq/is/gte/lt/in for real, because core.event is
// queried twice with different predicates and a stub that ignores filters
// would let the two panels silently read each other's rows. Schema-aware:
// rows keyed "sim.event" are only visible through schema("sim"); plain keys
// resolve through schema("core") so the original fixtures keep working.
// rpcs maps rpc name -> (args) => rows, for the heartbeat aggregations.
function stubDb(
  rows: Record<string, Row[]>,
  rpcs: Record<string, (args: Record<string, unknown>) => Row[]> = {},
): SupabaseClient {
  const makeBuilder = (schema: string, table: string) => {
    let out = [...(rows[`${schema}.${table}`] ?? (schema === "core" ? rows[table] : undefined) ?? [])];
    // deno-lint-ignore no-explicit-any
    const b: any = {};
    const chain = (fn?: (...a: unknown[]) => void) => (...a: unknown[]) => {
      fn?.(...a);
      return b;
    };
    b.select = chain();
    b.order = chain();
    b.limit = chain((n) => {
      out = out.slice(0, n as number);
    });
    b.eq = chain((col, val) => {
      out = out.filter((r) => r[col as string] === val);
    });
    b.is = chain((col, val) => {
      out = out.filter((r) => (val === null ? r[col as string] == null : r[col as string] === val));
    });
    b.gte = chain((col, val) => {
      out = out.filter((r) => String(r[col as string] ?? "") >= String(val));
    });
    b.lt = chain((col, val) => {
      out = out.filter((r) => String(r[col as string] ?? "") < String(val));
    });
    b.in = chain((col, vals) => {
      out = out.filter((r) => (vals as unknown[]).includes(r[col as string]));
    });
    b.then = (onFul: (v: unknown) => unknown, onRej?: (e: unknown) => unknown) =>
      Promise.resolve({ data: out, error: null }).then(onFul, onRej);
    return b;
  };
  return {
    schema: (s: string) => ({
      from: (t: string) => makeBuilder(s, t),
      rpc: (name: string, args: Record<string, unknown>) =>
        Promise.resolve(
          name in rpcs
            ? { data: rpcs[name](args), error: null }
            : { data: null, error: { message: `no rpc ${name}` } },
        ),
    }),
  } as unknown as SupabaseClient;
}

function ctx(actorType: string): PartnerContext {
  return { actorType, roles: [], tokenId: "tok_test" } as unknown as PartnerContext;
}

const req = () => new Request("http://x/compliance/dashboard/data");
const RECENT = new Date().toISOString();
const PAST_DUE = new Date(Date.now() - 3600_000).toISOString();
const FUTURE = new Date(Date.now() + 86400_000).toISOString();

Deno.test("demo posture: the data route serves ANY caller, partner included", async () => {
  // Re-locking for production restores the bsa.ts-style partner 404 here —
  // this test then flips back to asserting 404 (see 4b34d6a).
  const res = await getDashboardData(req(), stubDb({}), "t", ctx("partner"));
  assertEquals(res.status, 200);
});

Deno.test("panels aggregate the evidence tables faithfully", async () => {
  const db = stubDb({
    control_result: [
      { control_id: "CG-VEL-01", decision: "block", created_at: RECENT },
      { control_id: "CG-VEL-01", decision: "pass", created_at: RECENT },
      { control_id: "CG-CTR-01", decision: "pass", created_at: RECENT },
    ],
    bsa_alert: [
      // overdue: untriaged and past its clock
      { id: "a1", alert_type: "ctr_threshold", status: "open", triage_due_at: PAST_DUE, triaged_at: null, created_at: RECENT },
      // open but still inside the clock
      { id: "a2", alert_type: "structuring", status: "open", triage_due_at: FUTURE, triaged_at: null, created_at: RECENT },
      // closed alerts never appear
      { id: "a3", alert_type: "ctr_threshold", status: "closed", triage_due_at: PAST_DUE, triaged_at: RECENT, created_at: RECENT },
    ],
    case: [
      { id: "c1", status: "opened", alert_id: "a9", sar_decision: null, opened_at: RECENT },
      { id: "c2", status: "closed", alert_id: "a8", sar_decision: "file", opened_at: RECENT, decided_at: RECENT },
    ],
    ctr_filing: [
      { id: "ctr1", filing_due_at: PAST_DUE, filed_at: null },
      { id: "ctr2", filing_due_at: FUTURE, filed_at: null },
      { id: "ctr3", filing_due_at: PAST_DUE, filed_at: RECENT },
    ],
    payment_approval: [
      { id: "ap1", resource_type: "wire_transfer", resource_id: "w1", created_by: "tok_a", created_at: RECENT, approved_at: null, rejected_at: null },
      { id: "ap2", resource_type: "wire_transfer", resource_id: "w2", created_by: "tok_a", created_at: RECENT, approved_at: RECENT, rejected_at: null },
    ],
    event: [
      { id: "e1", code: "blnk.mirror_recovered", created_at: RECENT, delivered_at: RECENT },
      { id: "e2", code: "blnk.balance_drift", created_at: RECENT, delivered_at: null },
      { id: "e3", code: "transfer.settled", created_at: RECENT, delivered_at: null },
    ],
    blnk_sync_state: [
      { resource: "reconcile", last_cursor: '{"advanced":3}', last_synced_at: RECENT },
    ],
  });

  const res = await getDashboardData(req(), db, "t", ctx("cu_admin"));
  assertEquals(res.status, 200);
  const d = await res.json();

  assertEquals(d.controls.by_control["CG-VEL-01"], { block: 1, pass: 1 });
  assertEquals(d.controls.by_control["CG-CTR-01"], { pass: 1 });
  assertEquals(d.controls.window_capped, false);

  assertEquals(d.alerts.open, 2); // closed alert excluded
  assertEquals(d.alerts.overdue_triage, 1);
  assertEquals(d.alerts.by_type, { ctr_threshold: 1, structuring: 1 });

  assertEquals(d.cases.by_status, { opened: 1, closed: 1 });
  assertEquals(d.cases.sar_decisions, { file: 1 });

  assertEquals(d.ctr.unfiled, 2);
  assertEquals(d.ctr.overdue, 1); // the filed one is not overdue

  assertEquals(d.pending_approvals.count, 1); // decided approvals excluded

  // the two event panels see DIFFERENT filtered sets
  assertEquals(d.ops.events_7d, { "blnk.mirror_recovered": 1, "blnk.balance_drift": 1 });
  assertEquals(d.ops.outbox_undelivered, 2); // e2 + e3, regardless of code

  assertEquals(d.ops.last_reconcile, { advanced: 3 });
});

Deno.test("empty tables produce an empty-but-well-formed payload, not an error", async () => {
  const res = await getDashboardData(req(), stubDb({}), "t", ctx("pynthia_ops"));
  assertEquals(res.status, 200);
  const d = await res.json();
  assertEquals(d.controls.window_rows, 0);
  assertEquals(d.alerts.open, 0);
  assertEquals(d.ctr.unfiled, 0);
  assertEquals(d.ops.outbox_undelivered, 0);
  assertEquals(d.ops.last_reconcile, null);
});

// ---------------------------------------------------------------- heartbeat
// The monitoring tier: every control's event codes bucketed over time, so the
// dashboard can render a per-control pulse and a regulator can see exactly
// when each control last produced evidence.

Deno.test("heartbeat: event + gate pulses ride the RPCs; window and bucket are clamped and reported", async () => {
  let evArgs: Record<string, unknown> = {};
  const db = stubDb({}, {
    event_heartbeat: (args) => {
      evArgs = args;
      return [{ src: "core", code: "transfer.settled", bucket: "2026-07-20T00:00:00+00:00", n: 3 }];
    },
    gate_heartbeat: () => [
      { src: "core", control_id: "CG-NSF-01", decision: "reject", bucket: "2026-07-20T00:00:00+00:00", n: 2 },
    ],
    event_last_seen: () => [{ src: "core", code: "transfer.settled", last_at: RECENT, total: 9 }],
  });
  // absurd params must clamp, not 500 and not scan the whole table
  const res = await getDashboardHeartbeat(
    new Request("http://x/compliance/dashboard/heartbeat?hours=999999&bucket=1"),
    db,
    "t",
  );
  assertEquals(res.status, 200);
  const d = await res.json();
  assertEquals(d.window_hours, 2160);
  assertEquals(d.bucket_seconds, 3600);
  assertEquals(evArgs.bucket_seconds, 3600);
  assertEquals(d.events, [
    { src: "core", code: "transfer.settled", bucket: "2026-07-20T00:00:00+00:00", n: 3 },
  ]);
  assertEquals(d.gate[0].control_id, "CG-NSF-01");
  assertEquals(d.last_seen[0].total, 9);
});

Deno.test("heartbeat: empty database yields empty-but-well-formed arrays", async () => {
  const db = stubDb({}, {
    event_heartbeat: () => [],
    gate_heartbeat: () => [],
    event_last_seen: () => [],
  });
  const res = await getDashboardHeartbeat(
    new Request("http://x/compliance/dashboard/heartbeat"),
    db,
    "t",
  );
  assertEquals(res.status, 200);
  const d = await res.json();
  assertEquals(d.events, []);
  assertEquals(d.gate, []);
  assertEquals(d.window_hours, 168);
});

// ------------------------------------------------------------- event stream
// Click a control -> its raw event history, newest first, payloads inspectable
// but PII-redacted with the SAME boundary rules the aggregator enforces.

const T1 = "2026-07-20T10:00:00.000Z";
const T2 = "2026-07-20T11:00:00.000Z";
const T3 = "2026-07-20T12:00:00.000Z";

function streamFixture() {
  return {
    event: [
      { id: "e3", code: "transfer.settled", type: "transfer", resource_id: "tr_3", payload: { amount_cents: 500, name: "Ada Lovelace" }, provenance: "production", created_at: T3, delivered_at: null },
      { id: "e2", code: "transfer.settled", type: "transfer", resource_id: "tr_2", payload: { amount_cents: 300 }, provenance: "production", created_at: T2, delivered_at: T3 },
      { id: "e1", code: "wire.completed", type: "wire", resource_id: "w_1", payload: { ssn: "000-11-2222" }, provenance: "production", created_at: T1, delivered_at: T2 },
    ],
    "sim.event": [
      { id: "s1", code: "transfer.settled", type: "transfer", resource_id: "tr_sim", payload: { amount_cents: 100 }, provenance: "simulated", created_at: T1, delivered_at: null },
    ],
  };
}

Deno.test("event stream: refuses a codeless query rather than dumping the whole outbox", async () => {
  const res = await getDashboardEvents(
    new Request("http://x/compliance/dashboard/events"),
    stubDb(streamFixture()),
    "t",
  );
  assertEquals(res.status, 422);
});

Deno.test("event stream: filters by code across core AND sim, newest first, payload PII redacted", async () => {
  const res = await getDashboardEvents(
    new Request("http://x/compliance/dashboard/events?codes=transfer.settled"),
    stubDb(streamFixture()),
    "t",
  );
  assertEquals(res.status, 200);
  const d = await res.json();
  assertEquals(d.events.map((e: Row) => e.id), ["e3", "e2", "s1"]);
  // the drill's simulated evidence is visible but labeled — never mixed silently
  assertEquals(d.events[2].src, "sim");
  assertEquals(d.events[0].src, "core");
  // same boundary redaction the aggregator enforces: name never leaves
  assertEquals(d.events[0].payload, { amount_cents: 500 });
});

Deno.test("event stream: cursor pages backwards through history and reports the next cursor", async () => {
  const page1 = await (await getDashboardEvents(
    new Request("http://x/compliance/dashboard/events?codes=transfer.settled&limit=2"),
    stubDb(streamFixture()),
    "t",
  )).json();
  assertEquals(page1.events.map((e: Row) => e.id), ["e3", "e2"]);
  assertEquals(page1.next_before, T2);

  const page2 = await (await getDashboardEvents(
    new Request(`http://x/compliance/dashboard/events?codes=transfer.settled&limit=2&before=${page1.next_before}`),
    stubDb(streamFixture()),
    "t",
  )).json();
  assertEquals(page2.events.map((e: Row) => e.id), ["s1"]);
  assertEquals(page2.next_before, null);
});

// ------------------------------------------------------------------- trace
// Click an event -> the WHOLE transaction cycle for its resource: every event
// it produced plus every gate decision made about it, oldest first.

Deno.test("trace: full event chain + gate decisions for one resource, ascending, redacted", async () => {
  const db = stubDb({
    event: [
      { id: "e2", code: "transfer.settled", type: "transfer", resource_id: "tr_1", payload: { amount_cents: 300, email: "a@b.c" }, provenance: "production", created_at: T2, delivered_at: null },
      { id: "e1", code: "transfer.created", type: "transfer", resource_id: "tr_1", payload: {}, provenance: "production", created_at: T1, delivered_at: null },
      { id: "eX", code: "transfer.created", type: "transfer", resource_id: "tr_OTHER", payload: {}, provenance: "production", created_at: T1, delivered_at: null },
    ],
    "sim.event": [
      { id: "s1", code: "transfer.rejected", type: "transfer", resource_id: "tr_1", payload: {}, provenance: "simulated", created_at: T3, delivered_at: null },
    ],
    control_result: [
      { id: "cr1", control_id: "CG-NSF-01", decision: "reject", event: "transfer.rejected", score: null, subject_ref: "tr_1", provenance: "production", created_at: T1 },
      { id: "crX", control_id: "CG-NSF-01", decision: "pass", event: null, score: null, subject_ref: "tr_OTHER", provenance: "production", created_at: T1 },
    ],
  });
  const res = await getDashboardTrace("tr_1", db, "t");
  assertEquals(res.status, 200);
  const d = await res.json();
  assertEquals(d.resource_id, "tr_1");
  assertEquals(d.events.map((e: Row) => e.id), ["e1", "e2", "s1"]);
  assertEquals(d.events[2].src, "sim");
  assertEquals(d.events[1].payload, { amount_cents: 300 });
  assertEquals(d.control_results.map((c: Row) => c.id), ["cr1"]);
});

Deno.test("the dashboard route 302s to the hosted shell (the gateway cannot serve HTML)", () => {
  const res = getDashboardShell("t");
  assertEquals(res.status, 302);
  assert((res.headers.get("location") ?? "").startsWith("https://"));
});

Deno.test("the hosted shell carries no credentials at all (demo posture)", async () => {
  for (const f of ["index.html", "assets/app.js"]) {
    const src = await Deno.readTextFile(
      new URL(`../../../docs/dashboard/${f}`, import.meta.url),
    );
    assert(!src.includes("token="), `${f}: no token may ride in a URL`);
    assert(!/cass_(?:demo|e2e|pt)_[a-f0-9]/.test(src), `${f}: no live token may be baked in`);
    assert(!src.includes("X-Api-Key"), `${f}: demo shell sends no auth header at all`);
  }
});

Deno.test("the policy hierarchy covers the whole catalogue — every policy, every control, a page each", async () => {
  const dash = new URL("../../../docs/dashboard/", import.meta.url);
  const manifest = JSON.parse(
    await Deno.readTextFile(new URL("manifest.json", dash)),
  );
  const catalogue = JSON.parse(
    await Deno.readTextFile(new URL("../../../controls.json", import.meta.url)),
  );

  const cataloguePolicies = new Set(
    catalogue.controls.map((c: { policy: string }) => c.policy),
  );
  const manifestPolicies = new Set(
    manifest.policies.map((p: { slug: string }) => p.slug),
  );
  // manifest = catalogue policies + the declared runtime gate, nothing else
  for (const p of cataloguePolicies) assert(manifestPolicies.has(p), `missing policy page: ${p}`);
  const extras = [...manifestPolicies].filter((p) => !cataloguePolicies.has(p as string));
  assertEquals(extras, ["money-movement-gate"]);
  assertEquals(manifest.control_count, catalogue.controls.length + 6);

  // the monitoring tier's contract: every control ships its watch list (the
  // event codes its heartbeat sums), its spec rules, and its test verdicts —
  // the three things that make a control auditable from the dashboard alone
  let withVerdicts = 0;
  for (const p of manifest.policies) {
    for (const c of p.controls) {
      assert(Array.isArray(c.watch), `${c.id}: watch codes missing`);
      assert(Array.isArray(c.rules), `${c.id}: spec rules missing`);
      assert(typeof c.tests === "object", `${c.id}: test verdicts missing`);
      if (c.tests.hermetic && c.tests.live) withVerdicts++;
      for (const r of c.rules) {
        assert(Array.isArray(r.produced) && Array.isArray(r.inputs), `${c.id}: malformed rule`);
      }
    }
  }
  assert(withVerdicts >= 300, `only ${withVerdicts} controls carry both tiers' verdicts`);

  // every page loads the shared app under a CONTENT-STAMPED url: without the
  // stamp a rebuilt app.js stays shadowed by the cached one, and the new
  // catalogue renders through old code (observed live — 27 cards from a
  // 28-policy manifest)
  const stamps = new Set<string>();
  for (const p of manifest.policies) {
    const stub = await Deno.readTextFile(new URL(`${p.slug}/index.html`, dash));
    const m = stub.match(/assets\/app\.js\?v=([0-9a-f]{12})/);
    assert(m, `${p.slug}: stub must load the shared app under a versioned url`);
    stamps.add(m[1]);
  }
  const indexHtml = await Deno.readTextFile(new URL("index.html", dash));
  const im = indexHtml.match(/assets\/app\.js\?v=([0-9a-f]{12})/);
  assert(im, "index must load the shared app under a versioned url");
  stamps.add(im[1]);
  assertEquals(stamps.size, 1, "every page must carry the SAME asset stamp");
});
