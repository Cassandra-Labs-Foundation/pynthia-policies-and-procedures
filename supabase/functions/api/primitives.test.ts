// The recurring control primitives (BLUEPRINT §5e).
//
// EVERY primitive here is exercised against control uids drawn from DIFFERENT
// policies. That is the test of whether it is a primitive at all: a shape that
// only serves the policy it was extracted from is not a primitive, it is that
// policy's schema with a general-sounding name. The uids used are real entries
// from controls.json across audit, third-party-risk, cash, lending, liquidity,
// capitalization, privacy, bsa, compliance and director-fiduciary-duties.
import { assert, assertEquals } from "jsr:@std/assert@1";
import {
  assess,
  canBeOverdue,
  postAttestation,
  postObservation,
  postWorkItem,
  postWorkItemClose,
  postWorkItemSweep,
  putThreshold,
  requiresRationale,
} from "./primitives.ts";
import { type Any, OPS_CTX, req, TEST_CTX } from "./test_helpers.ts";

function primDb(rows: Record<string, Record<string, unknown>[]>) {
  const writes: { schema: string; table: string; op: string; row: Any }[] = [];
  let schema = "core";
  const from = (table: string) => {
    const filters: { col: string; val: unknown }[] = [];
    const lts: { col: string; val: unknown }[] = [];
    const chain: Any = {
      select: () => chain,
      eq: (col: string, val: unknown) => (filters.push({ col, val }), chain),
      is: (col: string, val: unknown) => (filters.push({ col, val }), chain),
      in: () => chain,
      // modelled, not ignored: the sweep's overdue query is `.lt(due_at, now)`,
      // and a fake that ignored it would return undeadlined rows as overdue and
      // the test would pass for the wrong reason
      lt: (col: string, val: unknown) => (lts.push({ col, val }), chain),
      order: () => chain,
      limit: () => chain,
      insert: (row: Any) => (writes.push({ schema, table, op: "insert", row }), Promise.resolve({ error: null })),
      upsert: (row: Any) => (writes.push({ schema, table, op: "upsert", row }), Promise.resolve({ error: null })),
      update: (patch: Any) => {
        writes.push({ schema, table, op: "update", row: patch });
        const p: Any = Promise.resolve({ error: null });
        p.eq = () => p;
        return p;
      },
      maybeSingle: () => Promise.resolve({
        data: (rows[table] ?? []).find((r) => filters.every((f) => r[f.col] === f.val)) ?? null,
        error: null,
      }),
      then: (res: (v: unknown) => unknown) => res({
        data: (rows[table] ?? []).filter((r) =>
          filters.every((f) => f.val === null ? r[f.col] == null : r[f.col] === f.val) &&
          lts.every((f) => r[f.col] != null && String(r[f.col]) < String(f.val))
        ),
        error: null,
      }),
    };
    return chain;
  };
  const db: Any = { schema: (s: string) => (schema = s, { from }) };
  return { db, writes };
}

// ================================================= C/D/F/E — the work item

Deno.test("all four kinds open, across four DIFFERENT policies", async () => {
  // audit / cash / privacy / bsa — if the shape only fitted one of these it
  // would not be a primitive.
  const cases: [string, string, Record<string, unknown>][] = [
    ["task", "audit:AU-01", {}],
    ["request", "cash:CP-01", {}],
    ["notice", "privacy:PR-01", {}],
    ["inbound", "bsa:BSA-01", { source_ref: "FinCEN", received_at: "2026-07-01T00:00:00Z" }],
  ];
  for (const [kind, uid, extra] of cases) {
    const { db, writes } = primDb({});
    const res = await postWorkItem(
      req({ control_uid: uid, kind, title: `t-${kind}`, due_at: "2026-08-01T00:00:00Z", ...extra }),
      db, "p1", OPS_CTX,
    );
    assertEquals(res.status, 201, `${kind} for ${uid} must open`);
    assertEquals(writes.find((w) => w.table === "work_item")?.row.kind, kind);
  }
});

Deno.test("a bare control_id is refused — ids collide across policies (OQ-11)", async () => {
  // 'CP-01' is BOTH capitalization:CP-01 and cash:CP-01. Accepting the bare id
  // would attach work to whichever resolved.
  const { db, writes } = primDb({});
  const res = await postWorkItem(
    req({ control_uid: "CP-01", kind: "task", title: "t" }), db, "p2", OPS_CTX,
  );
  assertEquals(res.status, 400);
  assert((await res.json()).errors[0].message.includes("ambiguous"));
  assertEquals(writes.length, 0);
});

Deno.test("an item with NO deadline says so and is not silently current", async () => {
  const { db } = primDb({});
  const b = await (await postWorkItem(
    req({ control_uid: "third-party-risk:TR-01", kind: "task", title: "vendor review" }),
    db, "p3", OPS_CTX,
  )).json();
  assertEquals(b.deadlined, false);
  assert(b.warning.includes("never become overdue"));
});

Deno.test("inbound correspondence must record its SOURCE and ARRIVAL time", async () => {
  // The response clock runs from receipt, and correspondence is often logged
  // days after it arrives.
  const { db, writes } = primDb({});
  for (const missing of [{ received_at: "2026-07-01T00:00:00Z" }, { source_ref: "OCC" }, {}]) {
    const res = await postWorkItem(
      req({ control_uid: "bsa:BSA-01", kind: "inbound", title: "314(a) request", ...missing }),
      db, "p4", OPS_CTX,
    );
    assertEquals(res.status, 400, `inbound missing ${JSON.stringify(missing)} must be refused`);
  }
  assertEquals(writes.length, 0);
});

Deno.test("a REQUEST cannot close without saying what was decided", async () => {
  const { db, writes } = primDb({
    work_item: [{ id: "wi_1", kind: "request", control_uid: "lending:LP-01", status: "open", due_at: null, closed_at: null }],
  });
  const res = await postWorkItemClose(req({}), "wi_1", db, "p5", OPS_CTX);
  assertEquals(res.status, 400);
  assertEquals((await res.json()).errors[0].field, "outcome");
  assertEquals(writes.length, 0);
});

Deno.test("an adverse outcome requires a reason — same rule as a SAR no-file", async () => {
  const { db, writes } = primDb({
    work_item: [{ id: "wi_1", kind: "request", control_uid: "investment:IP-01", status: "open", due_at: null, closed_at: null }],
  });
  const res = await postWorkItemClose(req({ outcome: "denied" }), "wi_1", db, "p6", OPS_CTX);
  assertEquals(res.status, 400);
  assertEquals((await res.json()).errors[0].field, "rationale");
  assertEquals(writes.length, 0);
});

Deno.test("requiresRationale is exported so no caller re-implements it", () => {
  assertEquals(requiresRationale("denied"), true);
  assertEquals(requiresRationale("rejected"), true);
  assertEquals(requiresRationale("no_action"), true);
  assertEquals(requiresRationale("approved"), false);
});

Deno.test("closing late is RECORDED, never suppressed", async () => {
  const { db, writes } = primDb({
    work_item: [{
      id: "wi_1", kind: "task", control_uid: "audit:AU-01", status: "open",
      due_at: "2020-01-01T00:00:00Z", closed_at: null,
    }],
  });
  const b = await (await postWorkItemClose(
    req({ outcome: "completed" }), "wi_1", db, "p7", OPS_CTX,
  )).json();
  assertEquals(b.closed_late, true);
  assertEquals(writes.find((w) => w.table === "event")!.row.payload.late, true);
});

Deno.test("re-closing replays rather than re-deciding", async () => {
  const { db, writes } = primDb({
    work_item: [{ id: "wi_1", kind: "task", control_uid: "audit:AU-01", status: "completed", closed_at: "2026-07-01T00:00:00Z" }],
  });
  const res = await postWorkItemClose(req({ outcome: "x" }), "wi_1", db, "p8", OPS_CTX);
  assertEquals(res.headers.get("Idempotent-Replayed"), "true");
  assertEquals(writes.length, 0);
});

Deno.test("the sweep separates OVERDUE from UNDEADLINED", async () => {
  // Different absences. Overdue means a date passed; undeadlined means nobody
  // set one, and an undeadlined item sits in the queue looking exactly like an
  // item that is simply not due yet.
  const { db } = primDb({
    work_item: [
      { id: "wi_late", kind: "task", control_uid: "compliance:CM-01", status: "open", due_at: "2020-01-01T00:00:00Z" },
      { id: "wi_none", kind: "task", control_uid: "internal-controls:IC-01", status: "open", due_at: null },
    ],
  });
  const b = await (await postWorkItemSweep(req({}), db, "p9", OPS_CTX)).json();
  assertEquals(b.overdue_count, 1);
  assertEquals(b.undeadlined_count, 1);
  assert(b.warning.includes("NOT current"));
});

Deno.test("canBeOverdue is one definition, exported", () => {
  assertEquals(canBeOverdue({ due_at: "2020-01-01", status: "open" }), true);
  assertEquals(canBeOverdue({ due_at: null, status: "open" }), false);
  assertEquals(canBeOverdue({ due_at: "2020-01-01", status: "completed" }), false);
});

// ============================================================ G — thresholds

Deno.test("an unconfigured limit is UNASSESSED, not within and not breaching", () => {
  // Same rule as the ACH dual-control limit (OQ-14) and unattributable cash.
  assertEquals(assess(999_999, null, null), "unassessed");
  assertEquals(assess(999_999, undefined, null), "unassessed");
});

Deno.test("a limit of ZERO is a real policy, not an absence", () => {
  assertEquals(assess(1, 0, null), "breach");
  assertEquals(assess(1, null, null), "unassessed");
});

Deno.test("thresholds work in both directions", () => {
  // liquidity floors go DOWN, capital ratios go DOWN, cash limits go UP
  assertEquals(assess(5, 10, null, "above"), "within");
  assertEquals(assess(15, 10, null, "above"), "breach");
  assertEquals(assess(15, 10, null, "below"), "within");
  assertEquals(assess(5, 10, null, "below"), "breach");
});

Deno.test("a warn level fires before the breach, not after", () => {
  assertEquals(assess(8, 10, 8, "above"), "warn");
  assertEquals(assess(7, 10, 8, "above"), "within");
  assertEquals(assess(11, 10, 8, "above"), "breach");
});

Deno.test("a warn level on the wrong side of the limit is refused", async () => {
  // Otherwise the warning fires after the breach and is useless.
  const { db, writes } = primDb({});
  const res = await putThreshold(
    req({ control_uid: "liquidity:LQ-01", metric: "lcr", subject_scope: "institution", limit_value: 100, warn_value: 120, direction: "above" }),
    "th_1", db, "p10", OPS_CTX,
  );
  assertEquals(res.status, 400);
  assertEquals((await res.json()).errors[0].field, "warn_value");
  assertEquals(writes.length, 0);
});

Deno.test("thresholds serve THREE different policies with the same shape", async () => {
  for (const [uid, metric, scope] of [
    ["liquidity:LQ-01", "lcr", "institution"],
    ["capitalization:CP-01", "net_worth_ratio", "institution"],
    ["cash:CP-01", "vault_cash", "branch:001"],
  ]) {
    const { db, writes } = primDb({});
    const res = await putThreshold(
      req({ control_uid: uid, metric, subject_scope: scope, limit_value: 10 }),
      `th_${metric}`, db, "p11", OPS_CTX,
    );
    assertEquals(res.status, 200, `${uid} must configure`);
    assertEquals(writes.find((w) => w.table === "threshold")?.row.metric, metric);
  }
});

Deno.test("an observation against an unconfigured threshold is recorded but UNASSESSED", async () => {
  const { db, writes } = primDb({
    threshold: [{ id: "th_1", control_uid: "liquidity:LQ-01", metric: "lcr", limit_value: null, warn_value: null, direction: "above" }],
  });
  const b = await (await postObservation(req({ value: 42 }), "th_1", db, "p12", OPS_CTX)).json();
  assertEquals(b.assessment, "unassessed");
  assert(b.warning.includes("no configured limit"));
  // the VALUE was real and is kept — only the determination is missing
  assertEquals(writes.find((w) => w.table === "threshold_observation")?.row.observed_value, 42);
});

Deno.test("a breach emits an event; a within-limit observation does not", async () => {
  const { db, writes } = primDb({
    threshold: [{ id: "th_1", control_uid: "capitalization:CP-01", metric: "nw", limit_value: 10, warn_value: null, direction: "above" }],
  });
  await postObservation(req({ value: 20 }), "th_1", db, "p13", OPS_CTX);
  assertEquals(writes.find((w) => w.table === "event")?.row.code, "threshold.breached");

  const { db: db2, writes: w2 } = primDb({
    threshold: [{ id: "th_1", control_uid: "capitalization:CP-01", metric: "nw", limit_value: 10, warn_value: null, direction: "above" }],
  });
  await postObservation(req({ value: 5 }), "th_1", db2, "p14", OPS_CTX);
  assertEquals(w2.filter((w) => w.table === "event").length, 0);
});

// ========================================================== J — attestation

Deno.test("an attestation records the AUTHENTICATED actor, not a payload claim", async () => {
  // An attestation someone can attribute to a third party is not an attestation.
  const { db, writes } = primDb({});
  await postAttestation(
    req({ control_uid: "director-fiduciary-duties:DF-01", statement: "reviewed", attested_by: "someone-else" }),
    db, "p15", OPS_CTX,
  );
  assertEquals(writes.find((w) => w.table === "attestation")?.row.attested_by, "tok_ops");
});

Deno.test("an attestation with no statement asserts nothing and is refused", async () => {
  const { db, writes } = primDb({});
  const res = await postAttestation(
    req({ control_uid: "compliance:CM-01" }), db, "p16", OPS_CTX,
  );
  assertEquals(res.status, 400);
  assertEquals(writes.length, 0);
});

Deno.test("an inverted attestation period is refused", async () => {
  const { db } = primDb({});
  const res = await postAttestation(
    req({
      control_uid: "internal-controls:IC-01", statement: "s",
      period_start: "2026-12-31", period_end: "2026-01-01",
    }),
    db, "p17", OPS_CTX,
  );
  assertEquals(res.status, 400);
});

Deno.test("attestations serve THREE different policies", async () => {
  for (const uid of ["director-fiduciary-duties:DF-01", "information-security:IS-01", "truth-in-savings:TIS-01"]) {
    const { db, writes } = primDb({});
    const res = await postAttestation(req({ control_uid: uid, statement: "attested" }), db, "p18", OPS_CTX);
    assertEquals(res.status, 201, `${uid} must attest`);
    assertEquals(writes.find((w) => w.table === "attestation")?.row.control_uid, uid);
  }
});

// ------------------------------------------------------------ access + sim

Deno.test("a partner cannot reach any primitive", async () => {
  const { db, writes } = primDb({ work_item: [], threshold: [] });
  for (
    const [name, res] of [
      ["work item", await postWorkItem(req({ control_uid: "a:B-01", kind: "task", title: "t" }), db, "a1", TEST_CTX)],
      ["close", await postWorkItemClose(req({}), "wi_1", db, "a2", TEST_CTX)],
      ["sweep", await postWorkItemSweep(req({}), db, "a3", TEST_CTX)],
      ["threshold", await putThreshold(req({}), "th_1", db, "a4", TEST_CTX)],
      ["observe", await postObservation(req({ value: 1 }), "th_1", db, "a5", TEST_CTX)],
      ["attest", await postAttestation(req({ control_uid: "a:B-01", statement: "s" }), db, "a6", TEST_CTX)],
    ] as [string, Response][]
  ) {
    assertEquals(res.status, 404, `${name} must be invisible to a partner`);
  }
  assertEquals(writes.length, 0);
});

Deno.test("the sim path writes only to sim, stamped simulated", async () => {
  const { db, writes } = primDb({});
  await postWorkItem(
    req({ control_uid: "audit:AU-01", kind: "task", title: "t" }), db, "s1", OPS_CTX, "sim",
  );
  assert(writes.length > 0);
  for (const w of writes) {
    assertEquals(w.schema, "sim");
    if (w.op !== "update") assertEquals(w.row.provenance, "simulated");
  }
});
