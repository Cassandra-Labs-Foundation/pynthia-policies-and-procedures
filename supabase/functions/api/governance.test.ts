// The governance calendar (Tier D).
//
// The interesting states here are all absences, and there are TWO of them which
// must never be confused:
//
//   overdue      came due, nobody did it
//   unscheduled  never came due at all, because nobody said when the cycle starts
//
// Unscheduled is the more dangerous. An overdue obligation at least appears on a
// list; an unscheduled one looks exactly like a satisfied one from any distance,
// because in both cases nothing is outstanding.
import { assert, assertEquals } from "jsr:@std/assert@1";
import {
  advance,
  firstDue,
  getObligations,
  postCalendarSweep,
  postObligation,
  postObligationComplete,
} from "./governance.ts";
import { type Any, OPS_CTX, req, TEST_CTX } from "./test_helpers.ts";

function govDb(rows: Record<string, Record<string, unknown>[]>) {
  const writes: { schema: string; table: string; op: string; row: Any }[] = [];
  let schema = "core";
  const from = (table: string) => {
    const filters: { col: string; val: unknown }[] = [];
    const chain: Any = {
      select: () => chain,
      eq: (col: string, val: unknown) => (filters.push({ col, val }), chain),
      is: (col: string, val: unknown) => (filters.push({ col, val }), chain),
      lte: () => chain,
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
          filters.every((f) => f.val === null ? r[f.col] == null : r[f.col] === f.val)
        ),
        error: null,
      }),
    };
    return chain;
  };
  const db: Any = { schema: (s: string) => (schema = s, { from }) };
  return { db, writes };
}

const oblig = (o: Record<string, unknown> = {}) => ({
  id: "oblig_bsa_BSA-16_audit.cycle_timer",
  control_uid: "bsa:BSA-16",
  trigger_code: "audit.cycle_timer",
  title: "Independent testing cycle",
  cadence: "annual",
  anchor_date: "2026-01-01",
  next_due_at: "2026-01-01T00:00:00.000Z",
  last_completed_at: null,
  last_completed_by: null,
  provenance: "production",
  ...o,
});

// ------------------------------------------------------------- the cadence

Deno.test("each cadence advances by its own period", () => {
  const base = new Date("2026-01-15T00:00:00Z");
  assertEquals(advance(base, "annual")!.toISOString().slice(0, 10), "2027-01-15");
  assertEquals(advance(base, "semiannual")!.toISOString().slice(0, 10), "2026-07-15");
  assertEquals(advance(base, "quarterly")!.toISOString().slice(0, 10), "2026-04-15");
  assertEquals(advance(base, "monthly")!.toISOString().slice(0, 10), "2026-02-15");
  assertEquals(advance(base, "weekly")!.toISOString().slice(0, 10), "2026-01-22");
});

Deno.test("ad_hoc has no next occurrence and does not invent one", () => {
  // Treating it as annual would manufacture a cadence the policy never stated.
  assertEquals(advance(new Date(), "ad_hoc"), null);
});

Deno.test("the anchor IS the first occurrence, not the one after it", () => {
  // Advancing on registration would silently skip the first cycle.
  assertEquals(firstDue("2026-01-01").slice(0, 10), "2026-01-01");
});

// -------------------------------------------------- registration + anchoring

Deno.test("an obligation can be registered WITHOUT an anchor, and says so", async () => {
  const { db, writes } = govDb({});
  const res = await postObligation(
    req({
      control_uid: "bsa:BSA-16",
      trigger_code: "audit.cycle_timer",
      title: "Independent testing",
      cadence: "annual",
    }),
    db, "g1", OPS_CTX,
  );
  assertEquals(res.status, 201);
  const b = await res.json();
  assertEquals(b.scheduled, false);
  assertEquals(b.next_due_at, null);
  assert(b.warning.includes("never come due"), "the response must state it, not imply it");
  // recorded as existing, which is the point — the obligation is real even
  // though its schedule is unknown
  assertEquals(writes.find((w) => w.table === "obligation")?.row.anchor_date, null);
});

Deno.test("an anchored obligation gets a real due date", async () => {
  const { db, writes } = govDb({});
  const b = await (await postObligation(
    req({
      control_uid: "bsa:BSA-16",
      trigger_code: "audit.cycle_timer",
      title: "Independent testing",
      cadence: "annual",
      anchor_date: "2026-03-01",
    }),
    db, "g2", OPS_CTX,
  )).json();
  assertEquals(b.scheduled, true);
  assertEquals(b.next_due_at.slice(0, 10), "2026-03-01");
  assertEquals(b.warning, undefined);
  assertEquals(writes.find((w) => w.table === "obligation")?.row.next_due_at.slice(0, 10), "2026-03-01");
});

Deno.test("a bare control_id is refused — ids are not unique across policies", async () => {
  // OQ-11: CP-01 names two different controls. Accepting a bare id would let an
  // obligation attach to whichever one happened to resolve.
  const { db, writes } = govDb({});
  const res = await postObligation(
    req({ control_uid: "CP-01", trigger_code: "x.due_at", title: "t", cadence: "annual" }),
    db, "g3", OPS_CTX,
  );
  assertEquals(res.status, 400);
  assert((await res.json()).errors[0].message.includes("ambiguous"));
  assertEquals(writes.length, 0);
});

Deno.test("an unknown cadence is refused rather than defaulted", async () => {
  const { db } = govDb({});
  const res = await postObligation(
    req({ control_uid: "a:B-01", trigger_code: "x", title: "t", cadence: "fortnightly" }),
    db, "g4", OPS_CTX,
  );
  assertEquals(res.status, 400);
});

// ------------------------------------------------------------- completion

Deno.test("completion advances from the DUE date, not from when it was done", async () => {
  // THE property. A quarterly review due Jan 1 and completed Mar 1 is next due
  // Apr 1 — three months after it was DUE. Advancing from the completion date
  // would make it Jun 1, and chronic lateness would quietly stretch the cadence
  // until the obligation stopped recurring at all.
  const { db } = govDb({
    obligation: [oblig({ cadence: "quarterly", next_due_at: "2026-01-01T00:00:00.000Z" })],
  });
  const res = await postObligationComplete(
    req({ completed_by: "internal-audit" }), oblig().id, db, "g5", OPS_CTX,
  );
  assertEquals(res.status, 200);
  const b = await res.json();
  assertEquals(b.next_due_at.slice(0, 10), "2026-04-01");
  assertEquals(b.completed_late, true, "completing after the due date is late");
});

Deno.test("every completion is appended to the log, not just the latest", async () => {
  const { db, writes } = govDb({ obligation: [oblig()] });
  await postObligationComplete(req({ completed_by: "audit", note: "clean" }), oblig().id, db, "g6", OPS_CTX);
  const log = writes.find((w) => w.table === "obligation_completion");
  assertEquals(log?.row.completed_by, "audit");
  assertEquals(log?.row.was_late, true);
  // lateness is STORED, so it survives a later schedule change
  assert("was_late" in (log?.row ?? {}));
});

Deno.test("completion without an attributed actor is refused", async () => {
  const { db, writes } = govDb({ obligation: [oblig()] });
  const res = await postObligationComplete(req({}), oblig().id, db, "g7", OPS_CTX);
  assertEquals(res.status, 400);
  assertEquals((await res.json()).errors[0].field, "completed_by");
  assertEquals(writes.length, 0);
});

Deno.test("an UNSCHEDULED obligation cannot be completed — there is no due date to satisfy", async () => {
  const { db, writes } = govDb({
    obligation: [oblig({ anchor_date: null, next_due_at: null })],
  });
  const res = await postObligationComplete(
    req({ completed_by: "audit" }), oblig().id, db, "g8", OPS_CTX,
  );
  assertEquals(res.status, 409);
  assertEquals((await res.json()).type, "obligation_unscheduled");
  assertEquals(writes.length, 0, "completing an unanchored obligation would fabricate a cycle");
});

// -------------------------------------------------------- the sweep

Deno.test("the sweep fires the CATALOGUE's own trigger code", async () => {
  // Not a generic 'obligation.due' — the control's declared trigger, so the
  // control genuinely starts rather than merely resembling a start.
  const { db, writes } = govDb({ obligation: [oblig()] });
  await postCalendarSweep(req({}), db, "g9", OPS_CTX);
  const codes = writes.filter((w) => w.table === "event").map((w) => w.row.code);
  assert(codes.includes("audit.cycle_timer"), `expected the declared trigger in ${codes}`);
});

Deno.test("a due obligation nobody completed is reported OVERDUE", async () => {
  const { db, writes } = govDb({ obligation: [oblig()] });
  const b = await (await postCalendarSweep(req({}), db, "g10", OPS_CTX)).json();
  assertEquals(b.overdue_count, 1);
  assert(b.overdue[0].days_late > 0);
  const codes = writes.filter((w) => w.table === "event").map((w) => w.row.code);
  assert(codes.includes("governance.obligation.overdue"));
});

Deno.test("an obligation completed since it came due is NOT overdue", async () => {
  const { db } = govDb({
    obligation: [oblig({ last_completed_at: "2026-06-01T00:00:00.000Z" })],
  });
  const b = await (await postCalendarSweep(req({}), db, "g11", OPS_CTX)).json();
  assertEquals(b.overdue_count, 0);
  assertEquals(b.fired_count, 1, "it still fires — the cycle opened");
});

Deno.test("UNSCHEDULED is reported separately from overdue, never merged", async () => {
  // The distinction that matters: unscheduled obligations are not late, they
  // are undetermined. Counting them as overdue would overstate; omitting them
  // would hide them entirely.
  const { db } = govDb({
    obligation: [
      oblig(),
      oblig({ id: "oblig_unsched", anchor_date: null, next_due_at: null }),
    ],
  });
  const b = await (await postCalendarSweep(req({}), db, "g12", OPS_CTX)).json();
  assertEquals(b.unscheduled_count, 1);
  assertEquals(b.unscheduled[0].id, "oblig_unsched");
  assert(
    b.warning.includes("NOT satisfied and NOT overdue"),
    "the unscheduled state must be named, not left to inference",
  );
});

Deno.test("a fully scheduled, fully current calendar reports no warning", async () => {
  const { db } = govDb({
    obligation: [oblig({ next_due_at: "2099-01-01T00:00:00.000Z" })],
  });
  const b = await (await postCalendarSweep(req({}), db, "g13", OPS_CTX)).json();
  assertEquals(b.unscheduled_count, 0);
  assertEquals(b.warning, undefined);
});

Deno.test("sweep event ids are deterministic per due date — re-sweeping does not pile up", async () => {
  const mk = async () => {
    const { db, writes } = govDb({ obligation: [oblig()] });
    await postCalendarSweep(req({}), db, "g14", OPS_CTX);
    return writes.filter((w) => w.table === "event").map((w) => w.row.id).sort();
  };
  assertEquals(await mk(), await mk());
});

// ------------------------------------------------------------- access + sim

Deno.test("a partner cannot see or touch the governance calendar", async () => {
  const { db, writes } = govDb({ obligation: [oblig()] });
  for (
    const [name, res] of [
      ["register", await postObligation(req({ control_uid: "a:B-01", trigger_code: "x", title: "t", cadence: "annual" }), db, "a1", TEST_CTX)],
      ["complete", await postObligationComplete(req({ completed_by: "x" }), oblig().id, db, "a2", TEST_CTX)],
      ["sweep", await postCalendarSweep(req({}), db, "a3", TEST_CTX)],
      ["list", await getObligations(req({}), db, "a4", TEST_CTX)],
    ] as [string, Response][]
  ) {
    assertEquals(res.status, 404, `${name} must be invisible to a partner`);
  }
  assertEquals(writes.length, 0);
});

Deno.test("the sim path writes only to sim, stamped simulated", async () => {
  const { db, writes } = govDb({ obligation: [oblig()] });
  await postObligationComplete(req({ completed_by: "audit" }), oblig().id, db, "s1", OPS_CTX, "sim");
  assert(writes.length > 0);
  for (const w of writes) {
    assertEquals(w.schema, "sim");
    if (w.op !== "update") assertEquals(w.row.provenance, "simulated");
  }
});
