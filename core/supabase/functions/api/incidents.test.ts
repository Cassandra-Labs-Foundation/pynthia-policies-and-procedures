// Incident response — the EC-13 assessment, the external-comms gate, and the
// SC-03 sitrep cadence.
//
// WHY THIS FILE EXISTS AT ALL. `incidents.ts` had no unit test until now; it
// was covered only by the control drill, which fires the happy path. Three
// mutations survived the first sweep — external comms with no legal review, an
// assessment with no scope or member impact, and a sev1 cadence quietly relaxed
// to eight hours — and every one of them is a control failing open. The drill
// proved the events get emitted; nothing proved the refusals refuse.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { makeDrillDb } from "../drill/fake_db.ts";
import { OPS_CTX, req } from "./test_helpers.ts";
import {
  postExternalComms, postIncident, postIncidentAssessment, SITREP_CADENCE_MINUTES,
} from "./incidents.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
const CTX = OPS_CTX;
const codes = (rows: Record<string, Any[]>) =>
  (rows["core.event"] ?? []).map((e) => String(e.code));

async function declare(dbx: Any, severity = "sev1"): Promise<string> {
  const res = await postIncident(
    req({ title: "test incident", severity, source: "siem" }), dbx.client, "t", CTX,
  );
  return String((await res.json()).id);
}

// ------------------------------------------------------------------ SC-03

Deno.test("SC-03: declaration sets a recurring sitrep cadence, not just v1", async () => {
  const dbx = makeDrillDb();
  const id = await declare(dbx);
  const ev = (dbx.rows["core.event"] ?? []).find((e) => e.code === "sitrep.cadence_timer");
  // v1 is not the control. An incident that issued one sitrep and went quiet is
  // exactly what the cadence exists to catch.
  assert(ev, "a cadence timer must exist alongside the v1 timer");
  assertEquals((ev!.payload as Any).cadence_minutes, SITREP_CADENCE_MINUTES.sev1);
  assertEquals(dbx.rows["core.incident"].find((i) => i.id === id)!.sitrep_cadence_minutes, 60);
});

Deno.test("SC-03: the cadence scales with severity", async () => {
  // A sev1 reporting on the same rhythm as a sev4 is not being managed.
  assert(SITREP_CADENCE_MINUTES.sev1 < SITREP_CADENCE_MINUTES.sev2);
  assert(SITREP_CADENCE_MINUTES.sev2 < SITREP_CADENCE_MINUTES.sev3);
  assert(SITREP_CADENCE_MINUTES.sev3 < SITREP_CADENCE_MINUTES.sev4);

  const dbx = makeDrillDb();
  await declare(dbx, "sev4");
  const ev = (dbx.rows["core.event"] ?? []).find((e) => e.code === "sitrep.cadence_timer");
  assertEquals((ev!.payload as Any).cadence_minutes, SITREP_CADENCE_MINUTES.sev4);
});

// ------------------------------------------------------------------ EC-13

Deno.test("EC-13: an assessment with no data scope is refused", async () => {
  const dbx = makeDrillDb();
  const id = await declare(dbx);
  const res = await postIncidentAssessment(
    req({ member_impact: "some members affected" }), id, dbx.client, "t", CTX,
  );
  assertEquals(res.status, 400, "a status update wearing the word 'assessment'");
  assertEquals(dbx.rows["core.incident"].find((i) => i.id === id)!.assessment_completed_at, null);
});

Deno.test("EC-13: an assessment with no member impact is refused", async () => {
  const dbx = makeDrillDb();
  const id = await declare(dbx);
  const res = await postIncidentAssessment(
    req({ data_scope: { members: 1400 } }), id, dbx.client, "t", CTX,
  );
  assertEquals(res.status, 400);
});

Deno.test("EC-13: a complete assessment records scope, impact and both event names", async () => {
  const dbx = makeDrillDb();
  const id = await declare(dbx);
  await postIncidentAssessment(
    req({
      data_scope: { members: 1400, fields: ["account_number"] },
      member_impact: "1,400 members' account numbers exposed",
      facts: { vector: "credential stuffing" }, detection_source: "siem",
    }),
    id, dbx.client, "t", CTX,
  );
  const row = dbx.rows["core.incident"].find((i) => i.id === id)!;
  assert(row.assessment_completed_at !== null);
  assertEquals((row.data_scope as Any).members, 1400);
  const c = codes(dbx.rows);
  assert(c.includes("incident.assessment.completed"));
  // BLUEPRINT §5j: the corpus name AND the internal one.
  assert(c.includes("incident.reportability_assessment"));
});

Deno.test("EC-13: external comms with no legal review is REFUSED", async () => {
  const dbx = makeDrillDb();
  const id = await declare(dbx);
  const res = await postExternalComms(
    req({ holding_statement: "we are investigating" }), id, dbx.client, "t", CTX,
  );
  assertEquals(res.status, 409, "2am is when this judgement is worst");
  assertEquals(dbx.rows["core.incident"].find((i) => i.id === id)!.external_comms_at, null);
  assert(!codes(dbx.rows).includes("incident.external_comms.recorded"));
});

Deno.test("EC-13: external comms with no recorded statement is refused", async () => {
  const dbx = makeDrillDb();
  const id = await declare(dbx);
  const res = await postExternalComms(
    req({ legal_reviewed_by: "counsel_1" }), id, dbx.client, "t", CTX,
  );
  assertEquals(res.status, 400, "what went out has to be recorded verbatim");
});

Deno.test("EC-13: reviewed comms are recorded with the statement and the reviewer", async () => {
  const dbx = makeDrillDb();
  const id = await declare(dbx);
  await postExternalComms(
    req({
      holding_statement: "we are investigating an incident affecting online banking",
      legal_reviewed_by: "counsel_1", comms_plan: { channels: ["website"] },
    }),
    id, dbx.client, "t", CTX,
  );
  const row = dbx.rows["core.incident"].find((i) => i.id === id)!;
  assert(row.external_comms_at !== null);
  assertEquals(row.legal_review_by, "counsel_1");
  assertEquals(
    row.comms_holding_statement,
    "we are investigating an incident affecting online banking",
  );
  assert(codes(dbx.rows).includes("incident.external_comms.recorded"));
});
