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
import { getDashboardData, getDashboardShell } from "./dashboard.ts";

type Row = Record<string, unknown>;

// Filter-aware stub: applies eq/is/gte/in for real, because core.event is
// queried twice with different predicates and a stub that ignores filters
// would let the two panels silently read each other's rows.
function stubDb(rows: Record<string, Row[]>): SupabaseClient {
  const makeBuilder = (table: string) => {
    let out = [...(rows[table] ?? [])];
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
    b.in = chain((col, vals) => {
      out = out.filter((r) => (vals as unknown[]).includes(r[col as string]));
    });
    b.then = (onFul: (v: unknown) => unknown, onRej?: (e: unknown) => unknown) =>
      Promise.resolve({ data: out, error: null }).then(onFul, onRej);
    return b;
  };
  return {
    schema: () => ({ from: (t: string) => makeBuilder(t) }),
  } as unknown as SupabaseClient;
}

function ctx(actorType: string): PartnerContext {
  return { actorType, roles: [], tokenId: "tok_test" } as unknown as PartnerContext;
}

const req = () => new Request("http://x/compliance/dashboard/data");
const RECENT = new Date().toISOString();
const PAST_DUE = new Date(Date.now() - 3600_000).toISOString();
const FUTURE = new Date(Date.now() + 86400_000).toISOString();

Deno.test("partner actors get 404, never 403 — same confidentiality rule as bsa.ts", async () => {
  const res = await getDashboardData(req(), stubDb({}), "t", ctx("partner"));
  assertEquals(res.status, 404);
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

Deno.test("the dashboard route 302s to the hosted shell (the gateway cannot serve HTML)", () => {
  const res = getDashboardShell("t");
  assertEquals(res.status, 302);
  assert((res.headers.get("location") ?? "").startsWith("https://"));
});

Deno.test("the hosted shell is pure chrome: header auth, no token in URLs, no baked secrets", async () => {
  const html = await Deno.readTextFile(
    new URL("../../../docs/dashboard/index.html", import.meta.url),
  );
  assertStringIncludes(html, '"X-Api-Key"');
  assert(!html.includes("token="), "token must never ride in a URL");
  assertStringIncludes(html, "sessionStorage");
  assert(!/cass_(?:demo|e2e|pt)_[a-f0-9]/.test(html), "no live token may be baked into the shell");
});
