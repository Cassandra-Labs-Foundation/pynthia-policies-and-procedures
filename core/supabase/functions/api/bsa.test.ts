// BSA case management (BSA-06/07) and the evidence-provenance machinery.
//
// The TDD point of this file: a control's interesting behaviour is often a
// NEGATIVE — the alert nobody triaged, the decision nobody made, the SAR filed
// past its deadline. Those produce no event on their own precisely because
// nothing happened, so a substrate that can only express the happy path proves
// almost nothing. Roughly half the tests below drive a failure.
import { assert, assertEquals } from "jsr:@std/assert@1";
import {
  addBusinessDays,
  getCase,
  postAlertTriage,
  postCaseDecision,
  postTimerSweep,
  provenanceFor,
  raiseAlert,
  triageDueAt,
} from "./bsa.ts";
import {
  type Any,
  DUAL_ROLE_CTX,
  INVESTIGATOR_CTX,
  OFFICER_CTX,
  OPS_CTX,
  req,
  TEST_CTX,
} from "./test_helpers.ts";

/** Records the schema every call targeted, so scope separation is assertable. */
function bsaDb(rows: Record<string, Record<string, unknown>[]>) {
  const writes: { schema: string; table: string; op: string; row: Any }[] = [];
  let schema = "core";
  const from = (table: string) => {
    const filters: { col: string; val: unknown }[] = [];
    const chain: Any = {
      select: () => chain,
      eq: (col: string, val: unknown) => (filters.push({ col, val }), chain),
      is: (col: string, val: unknown) => (filters.push({ col, val }), chain),
      lt: () => chain,
      order: () => chain,
      limit: () => chain,
      insert: (row: Any) => {
        writes.push({ schema, table, op: "insert", row });
        return Promise.resolve({ error: null });
      },
      upsert: (row: Any) => {
        writes.push({ schema, table, op: "upsert", row });
        return Promise.resolve({ error: null });
      },
      update: (patch: Any) => {
        writes.push({ schema, table, op: "update", row: patch });
        return chain;
      },
      maybeSingle: () => {
        const src = rows[table] ?? [];
        const found = src.find((r) =>
          filters.every((f) => f.val === null ? r[f.col] == null : r[f.col] === f.val)
        );
        return Promise.resolve({ data: found ?? null, error: null });
      },
      single: () => {
        const src = rows[table] ?? [];
        const base = src[0] ?? {};
        const patches = writes.filter((w) => w.table === table && w.op === "update");
        return Promise.resolve({
          data: { ...base, ...Object.assign({}, ...patches.map((p) => p.row)) },
          error: null,
        });
      },
      then: (res: (v: unknown) => unknown) => res({ data: rows[table] ?? [], error: null }),
    };
    return chain;
  };
  const db: Any = { schema: (s: string) => (schema = s, { from }) };
  return { db, writes };
}

const OPEN_ALERT = {
  id: "alert_tr1_ctr_threshold",
  alert_type: "ctr_threshold",
  status: "open",
  entity_hash: "hash1",
  event_id: "evt_alert_tr1_ctr_threshold",
  details: "book transfer over $10,000",
  triage_due_at: "2026-07-21T00:00:00.000Z",
  triaged_at: null,
  triage_outcome: null,
  case_id: null,
  provenance: "production",
  created_at: "2026-07-19T00:00:00.000Z",
};

const OPEN_CASE = {
  id: "case_1",
  alert_id: "alert_tr1_ctr_threshold",
  type: "investigation",
  status: "opened",
  summary: "escalated",
  evidence: [],
  opened_at: "2026-07-19T01:00:00.000Z",
  sar_decision_due_at: "2026-08-18T00:00:00.000Z",
  decided_at: null,
  sar_decision: null,
  decision_rationale: null,
  opened_by: "tok_investigator",
  decided_by: null,
  concurred_by: [],
  provenance: "production",
  created_at: "2026-07-19T01:00:00.000Z",
};

// --------------------------------------------------------- OQ-05: the fix

Deno.test("raiseAlert writes the causing event FIRST, then points the alert at it", async () => {
  const { db, writes } = bsaDb({});
  const { alertId, eventId } = await raiseAlert(db, {
    alertType: "ctr_threshold",
    entityHash: "h",
    causeType: "transfer",
    causeId: "tr1",
    details: "over $10k",
  });

  // order is load-bearing: the alert's FK points at the event
  assertEquals(writes[0].table, "event");
  assertEquals(writes[1].table, "bsa_alert");
  // and the 2-business-day clock starting is its own event (BSA-06 produced)
  assertEquals(writes[2].row.code, "bsa_alert.triage.timer");
  // the event's code is BSA-06's DECLARED trigger — raising an alert now fires
  // the thing the catalogue says starts case management
  assertEquals(writes[0].row.code, "bsa_alert.created");
  assertEquals(writes[1].row.event_id, eventId);
  assert(writes[1].row.event_id !== null, "event_id was forced NULL before OQ-05");
  assertEquals(alertId, "alert_tr1_ctr_threshold");
});

Deno.test("alert ids are deterministic so a retried gate cannot duplicate them", async () => {
  const mk = async () => {
    const { db, writes } = bsaDb({});
    await raiseAlert(db, {
      alertType: "structuring", entityHash: "h",
      causeType: "transfer", causeId: "tr9", details: "d",
    });
    return writes.find((w) => w.table === "bsa_alert")!.row.id;
  };
  assertEquals(await mk(), await mk(), "D26 requires idempotent alert inserts");
});

Deno.test("a raised alert carries its 2-business-day triage deadline", async () => {
  const { db, writes } = bsaDb({});
  await raiseAlert(db, {
    alertType: "ofac", entityHash: "h",
    causeType: "verification", causeId: "v1", details: "d",
  });
  const alert = writes.find((w) => w.table === "bsa_alert")!.row;
  assert(alert.triage_due_at, "BSA-06's clock must start at creation, not first look");
});

// ------------------------------------------------------------- the clock

Deno.test("business-day arithmetic skips weekends", () => {
  // Friday 2026-07-17 + 2 business days = Tuesday 2026-07-21
  const due = addBusinessDays(new Date("2026-07-17T12:00:00Z"), 2);
  assertEquals(due.toISOString().slice(0, 10), "2026-07-21");
  // Monday + 2 = Wednesday
  assertEquals(
    addBusinessDays(new Date("2026-07-20T12:00:00Z"), 2).toISOString().slice(0, 10),
    "2026-07-22",
  );
});

Deno.test("the triage deadline never lands on a weekend", () => {
  for (let d = 13; d <= 26; d++) {
    const due = new Date(triageDueAt(new Date(`2026-07-${d}T12:00:00Z`)));
    const dow = due.getUTCDay();
    assert(dow !== 0 && dow !== 6, `2026-07-${d} produced a weekend deadline`);
  }
});

// ------------------------------------------------------------ triage path

Deno.test("escalating opens a case and starts the SAR clock from DETECTION", async () => {
  const { db, writes } = bsaDb({ bsa_alert: [OPEN_ALERT] });
  const res = await postAlertTriage(
    req({ outcome: "escalated" }), OPEN_ALERT.id, db, "b1", INVESTIGATOR_CTX,
  );
  assertEquals(res.status, 200);
  const kase = writes.find((w) => w.table === "case" && w.op === "insert")!.row;
  assertEquals(kase.status, "opened");
  assertEquals(kase.alert_id, OPEN_ALERT.id);
  // 30 days from alert creation (2026-07-19), NOT from triage. Triaging late
  // must not buy more time.
  assertEquals(String(kase.sar_decision_due_at).slice(0, 10), "2026-08-18");
  assertEquals(
    writes.find((w) => w.table === "event" && w.row.code === "case.opened")?.row.code,
    "case.opened",
  );
});

Deno.test("no_suspect extends the SAR clock to 60 days, not 30", async () => {
  const { db, writes } = bsaDb({ bsa_alert: [OPEN_ALERT] });
  await postAlertTriage(
    req({ outcome: "escalated", no_suspect: true }), OPEN_ALERT.id, db, "b2", INVESTIGATOR_CTX,
  );
  const kase = writes.find((w) => w.table === "case" && w.op === "insert")!.row;
  assertEquals(String(kase.sar_decision_due_at).slice(0, 10), "2026-09-17");
});

Deno.test("resolving an alert without a documented rationale is refused", async () => {
  // Deciding NOT to investigate is exactly the decision an examiner asks about.
  const { db, writes } = bsaDb({ bsa_alert: [OPEN_ALERT] });
  const res = await postAlertTriage(
    req({ outcome: "resolved" }), OPEN_ALERT.id, db, "b3", INVESTIGATOR_CTX,
  );
  assertEquals(res.status, 400);
  assertEquals((await res.json()).errors[0].field, "note");
  assertEquals(writes.length, 0, "nothing is written on a refused triage");
});

Deno.test("resolving WITH a rationale closes the alert and opens no case", async () => {
  const { db, writes } = bsaDb({ bsa_alert: [OPEN_ALERT] });
  const res = await postAlertTriage(
    req({ outcome: "resolved", note: "known payroll counterparty" }),
    OPEN_ALERT.id, db, "b4", INVESTIGATOR_CTX,
  );
  assertEquals(res.status, 200);
  assertEquals(writes.filter((w) => w.table === "case").length, 0);
  assertEquals(writes.find((w) => w.table === "bsa_alert" && w.op === "update")!.row.status, "closed");
});

Deno.test("re-triaging replays instead of overwriting the first decision", async () => {
  const { db, writes } = bsaDb({
    bsa_alert: [{ ...OPEN_ALERT, triaged_at: "2026-07-19T02:00:00Z", triage_outcome: "resolved" }],
  });
  const res = await postAlertTriage(
    req({ outcome: "escalated" }), OPEN_ALERT.id, db, "b5", INVESTIGATOR_CTX,
  );
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("Idempotent-Replayed"), "true");
  assertEquals(writes.length, 0, "a second triage must not erase the first rationale");
});

// ---------------------------------------------------------- SAR decision

Deno.test("a no_file decision REQUIRES a rationale (BSA-07 retention)", async () => {
  const { db, writes } = bsaDb({ case: [OPEN_CASE] });
  const res = await postCaseDecision(req({ decision: "no_file" }), "case_1", db, "b6", OFFICER_CTX);
  assertEquals(res.status, 400);
  assertEquals((await res.json()).errors[0].field, "rationale");
  assertEquals(writes.length, 0);
});

Deno.test("filing a SAR closes the case and emits sar.filed", async () => {
  const { db, writes } = bsaDb({ case: [OPEN_CASE] });
  const res = await postCaseDecision(
    req({ decision: "file", rationale: "structuring pattern confirmed" }),
    "case_1", db, "b7", OFFICER_CTX,
  );
  assertEquals(res.status, 200);
  assertEquals(writes.find((w) => w.table === "case" && w.op === "update")!.row.status, "closed");
  // find by CODE, not by table: the decision emits case.investigation_complete
  // (BSA-06's trigger) alongside the filing outcome
  const codes = writes.filter((w) => w.table === "event").map((w) => w.row.code);
  assert(codes.includes("sar.filed"), `expected sar.filed in ${codes}`);
  assert(codes.includes("case.investigation_complete"), "the investigation completing is its own event");
});

Deno.test("a no-file decision emits its own distinct event", async () => {
  const { db, writes } = bsaDb({ case: [OPEN_CASE] });
  await postCaseDecision(
    req({ decision: "no_file", rationale: "verified payroll" }),
    "case_1", db, "b8", OFFICER_CTX,
  );
  const codes2 = writes.filter((w) => w.table === "event").map((w) => w.row.code);
  assert(codes2.includes("sar.decision_no_file"), `expected sar.decision_no_file in ${codes2}`);
  assert(!codes2.includes("sar.filed"), "a no-file decision must not emit sar.filed");
});

Deno.test("a LATE decision is recorded as late rather than silently accepted", async () => {
  // The negative that matters most: the SAR was filed, but past the deadline.
  // Filing still succeeds — but the lateness is itself reportable and must
  // survive on the row rather than being dropped.
  const overdue = { ...OPEN_CASE, sar_decision_due_at: "2020-01-01T00:00:00.000Z" };
  const { db, writes } = bsaDb({ case: [overdue] });
  const res = await postCaseDecision(
    req({ decision: "file", rationale: "late but filed" }), "case_1", db, "b9", OFFICER_CTX,
  );
  assertEquals(res.status, 200);
  assertEquals((await res.json()).decision_was_late, true);
  const filed = writes.find((w) => w.table === "event" && w.row.code === "sar.filed")!;
  assertEquals(filed.row.payload.late, true);
});

// ------------------------------------------- the negatives: timer sweeps

Deno.test("the sweep surfaces an alert nobody triaged in time", async () => {
  // Nothing HAPPENED here — that is the point. An untriaged alert emits no
  // event of its own, so without the sweep the breach is invisible.
  const { db, writes } = bsaDb({
    bsa_alert: [{ ...OPEN_ALERT, triage_due_at: "2020-01-01T00:00:00.000Z", triaged_at: null }],
    case: [],
  });
  const res = await postTimerSweep(req({}), db, "b10", OPS_CTX);
  assertEquals(res.status, 200);
  const b = await res.json();
  assertEquals(b.breach_count, 1);
  assertEquals(b.breaches[0].kind, "triage_overdue");
  assertEquals(writes.find((w) => w.table === "event")!.row.code, "bsa_alert.triage.overdue");
});

Deno.test("the sweep surfaces a case nobody decided in time", async () => {
  const { db, writes } = bsaDb({
    bsa_alert: [],
    case: [{ ...OPEN_CASE, sar_decision_due_at: "2020-01-01T00:00:00.000Z", decided_at: null }],
  });
  const b = await (await postTimerSweep(req({}), db, "b11", OPS_CTX)).json();
  assertEquals(b.breach_count, 1);
  assertEquals(b.breaches[0].kind, "sar_decision_overdue");
  assertEquals(writes.find((w) => w.table === "event")!.row.code, "case.sar_decision.overdue");
});

Deno.test("breach event ids are deterministic — repeated sweeps do not pile up", async () => {
  const mk = async () => {
    const { db, writes } = bsaDb({
      bsa_alert: [{ ...OPEN_ALERT, triage_due_at: "2020-01-01T00:00:00.000Z" }],
      case: [],
    });
    await postTimerSweep(req({}), db, "b12", OPS_CTX);
    return writes.find((w) => w.table === "event")!.row.id;
  };
  assertEquals(await mk(), await mk());
});

Deno.test("a clean sweep reports zero breaches, not silence", async () => {
  const { db } = bsaDb({ bsa_alert: [], case: [] });
  const b = await (await postTimerSweep(req({}), db, "b13", OPS_CTX)).json();
  assertEquals(b.breach_count, 0);
  assertEquals(b.truncated, false, "a capped sweep must not read as a clean one");
});

// ------------------------------------------------- confidentiality (BSA-07)

Deno.test("a partner cannot reach case management at all — and gets 404, not 403", async () => {
  const { db, writes } = bsaDb({ bsa_alert: [OPEN_ALERT], case: [OPEN_CASE] });
  for (
    const [name, res] of [
      ["triage", await postAlertTriage(req({ outcome: "escalated" }), OPEN_ALERT.id, db, "b14", TEST_CTX)],
      ["decision", await postCaseDecision(req({ decision: "file", rationale: "x" }), "case_1", db, "b15", TEST_CTX)],
      ["sweep", await postTimerSweep(req({}), db, "b16", TEST_CTX)],
      ["get", await getCase("case_1", db, "b17", TEST_CTX)],
    ] as [string, Response][]
  ) {
    // 403 would confirm the case exists, which under BSA-07 is itself the
    // confidential fact
    assertEquals(res.status, 404, `${name} must be invisible to a partner`);
  }
  assertEquals(writes.length, 0, "a partner request writes nothing anywhere");
});

// --------------------------------------------------- provenance / sim scope

Deno.test("scope decides provenance, and the two cannot disagree", () => {
  assertEquals(provenanceFor("core"), "production");
  assertEquals(provenanceFor("sim"), "simulated");
});

Deno.test("a sim-scoped request writes ONLY into the sim schema", async () => {
  const { db, writes } = bsaDb({ bsa_alert: [{ ...OPEN_ALERT, provenance: "simulated" }] });
  await postAlertTriage(
    req({ outcome: "escalated" }), OPEN_ALERT.id, db, "b18", INVESTIGATOR_CTX, "sim",
  );
  assert(writes.length > 0, "the request must actually write something");
  for (const w of writes) {
    assertEquals(w.schema, "sim", `${w.table} escaped into ${w.schema}`);
  }
});

Deno.test("every row a sim request writes is stamped simulated", async () => {
  const { db, writes } = bsaDb({ bsa_alert: [{ ...OPEN_ALERT, provenance: "simulated" }] });
  await postAlertTriage(
    req({ outcome: "escalated" }), OPEN_ALERT.id, db, "b19", INVESTIGATOR_CTX, "sim",
  );
  // the schema CHECK constraints make the inverse unrepresentable, but the
  // writer must not rely on the database to catch its own mistake
  for (const w of writes.filter((x) => x.op !== "update")) {
    assertEquals(w.row.provenance, "simulated", `${w.table} was not stamped`);
  }
});

Deno.test("a core-scoped request never writes into sim", async () => {
  const { db, writes } = bsaDb({ bsa_alert: [OPEN_ALERT] });
  await postAlertTriage(req({ outcome: "escalated" }), OPEN_ALERT.id, db, "b20", INVESTIGATOR_CTX);
  for (const w of writes) {
    assertEquals(w.schema, "core");
    if (w.op !== "update") assertEquals(w.row.provenance, "production");
  }
});

// ------------------------------------------ segregation of duties (OQ-08)
//
// BSA-06 requires an Investigations role to open/close cases and gives the BSA
// Officer write access to SAR decisions. The property an examiner tests is not
// "are there roles" but "can one person do both" — so most of these drive the
// violation rather than the happy path.

Deno.test("triage requires the Investigations role, not merely being staff", async () => {
  const { db, writes } = bsaDb({ bsa_alert: [OPEN_ALERT] });
  // a legitimate ops actor with no BSA duty role
  const res = await postAlertTriage(
    req({ outcome: "escalated" }), OPEN_ALERT.id, db, "sod1", OPS_CTX,
  );
  assertEquals(res.status, 403);
  assertEquals((await res.json()).type, "insufficient_role");
  assertEquals(writes.length, 0);
});

Deno.test("the SAR decision requires the BSA Officer role", async () => {
  const { db, writes } = bsaDb({ case: [OPEN_CASE] });
  const res = await postCaseDecision(
    req({ decision: "file", rationale: "x" }), "case_1", db, "sod2", INVESTIGATOR_CTX,
  );
  // an investigator is inside the perimeter but this is not their duty
  assertEquals(res.status, 403);
  assertEquals((await res.json()).type, "insufficient_role");
  assertEquals(writes.length, 0);
});

Deno.test("a role failure is 403 while a partner is 404 — the distinction is deliberate", async () => {
  const { db } = bsaDb({ case: [OPEN_CASE] });
  const staff = await postCaseDecision(
    req({ decision: "file", rationale: "x" }), "case_1", db, "sod3", OPS_CTX,
  );
  const partner = await postCaseDecision(
    req({ decision: "file", rationale: "x" }), "case_1", db, "sod4", TEST_CTX,
  );
  // staff already know case management exists; telling them "not your duty"
  // discloses nothing. A partner must not learn the case exists at all.
  assertEquals(staff.status, 403);
  assertEquals(partner.status, 404);
});

Deno.test("the investigator who opened a case cannot decide it", async () => {
  // THE four-eyes property. The actor holds bsa_officer, so the role gate lets
  // them through — what stops them is having opened this specific case.
  const opened = { ...OPEN_CASE, opened_by: "tok_dual" };
  const { db, writes } = bsaDb({ case: [opened] });
  const res = await postCaseDecision(
    req({ decision: "file", rationale: "self-approved" }), "case_1", db, "sod5", DUAL_ROLE_CTX,
  );
  assertEquals(res.status, 409);
  assertEquals((await res.json()).type, "segregation_of_duties");
  assertEquals(writes.length, 0, "a self-approved SAR decision must not be written");
});

Deno.test("holding BOTH roles does not defeat the separation", async () => {
  // Someone could reasonably issue one token with both duties. The separation
  // is per-CASE, not per-token, so that token can still act — just not on a
  // case it opened itself.
  const someoneElsesCase = { ...OPEN_CASE, opened_by: "tok_investigator" };
  const { db, writes } = bsaDb({ case: [someoneElsesCase] });
  const res = await postCaseDecision(
    req({ decision: "file", rationale: "independent review" }), "case_1", db, "sod6", DUAL_ROLE_CTX,
  );
  assertEquals(res.status, 200);
  assert(writes.length > 0, "a dual-role actor may decide a case it did not open");
});

Deno.test("the case records WHO opened and WHO decided, so the separation is provable later", async () => {
  const { db, writes } = bsaDb({ bsa_alert: [OPEN_ALERT] });
  await postAlertTriage(
    req({ outcome: "escalated" }), OPEN_ALERT.id, db, "sod7", INVESTIGATOR_CTX,
  );
  const opened = writes.find((w) => w.table === "case" && w.op === "insert")!.row;
  assertEquals(opened.opened_by, "tok_investigator");

  const { db: db2, writes: w2 } = bsaDb({ case: [OPEN_CASE] });
  await postCaseDecision(
    req({ decision: "file", rationale: "confirmed" }), "case_1", db2, "sod8", OFFICER_CTX,
  );
  const decided = w2.find((w) => w.table === "case" && w.op === "update")!.row;
  assertEquals(decided.decided_by, "tok_officer");
  // an examiner asking "were these the same person?" can answer from the row
  assert(opened.opened_by !== decided.decided_by);
});

Deno.test("SAR committee concurrence is recorded but not enforced (OQ-09)", async () => {
  const { db, writes } = bsaDb({ case: [OPEN_CASE] });
  await postCaseDecision(
    req({
      decision: "file",
      rationale: "committee reviewed",
      concurred_by: ["tok_compliance", "tok_counsel"],
    }),
    "case_1", db, "sod9", OFFICER_CTX,
  );
  const patch = writes.find((w) => w.table === "case" && w.op === "update")!.row;
  assertEquals(patch.concurred_by, ["tok_compliance", "tok_counsel"]);

  // and a decision with NO concurrence still succeeds: quorum is an
  // organizational control this system deliberately does not police
  const { db: db2 } = bsaDb({ case: [OPEN_CASE] });
  const solo = await postCaseDecision(
    req({ decision: "file", rationale: "no committee" }), "case_1", db2, "sod10", OFFICER_CTX,
  );
  assertEquals(solo.status, 200);
});
