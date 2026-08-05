// Records administration — RR-01..RR-12.
//
// The negatives that matter: a record class with no schedule entry (which must
// refuse, not default), a permanent record that must never become disposal
// eligible, an integrity test that fails and must open a finding, a box marked
// destroyed whose records are still live, and a schedule amendment that must
// not retroactively govern a record disposed under the old one.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { makeDrillDb } from "../drill/fake_db.ts";
import { OPS_CTX, req } from "./test_helpers.ts";
import {
  CDD_REFRESH_MONTHS,
  postArchiveConfirmation,
  postCddProfile,
  postCddRefresh,
  postDestructionLogReconcile,
  postDestructionLogResolve,
  postIntegrityTestComplete,
  postIntegrityTestSchedule,
  postRecordClassify,
  postRecordDisposition,
  postRecordsPolicyReview,
  postRetentionScheduleEntry,
  postStorageBox,
  putRecordsContact,
  scheduleInForce,
} from "./records_admin.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
const CTX = OPS_CTX;
const codes = (rows: Record<string, Any[]>) =>
  (rows["core.event"] ?? []).map((e) => String(e.code));

async function seedSchedule() {
  const dbx = makeDrillDb();
  await postRetentionScheduleEntry(
    req({
      record_class: "cip_identity", retention_years: 5, anchor_kind: "account_closed",
      citation: "31 CFR 1020.220", effective_at: "2026-01-01T00:00:00.000Z",
    }),
    dbx.client, "t", CTX,
  );
  return { dbx, db: dbx.client };
}

// --------------------------------------------------------- RR-01 Schedule A

Deno.test("RR-01: a schedule entry with no citation is refused", async () => {
  const dbx = makeDrillDb();
  const res = await postRetentionScheduleEntry(
    req({ record_class: "misc", retention_years: 3, anchor_kind: "created" }),
    dbx.client, "t", CTX,
  );
  assertEquals(res.status, 400);
  assertEquals((dbx.rows["core.retention_schedule_entry"] ?? []).length, 0);
});

Deno.test("RR-01: an amendment supersedes and inherits, and the version increments", async () => {
  const { dbx, db } = await seedSchedule();
  await postRetentionScheduleEntry(
    req({
      record_class: "cip_identity", retention_years: 7, anchor_kind: "account_closed",
      citation: "31 CFR 1020.220", effective_at: "2026-06-01T00:00:00.000Z",
    }),
    db, "t", CTX,
  );
  const rows = dbx.rows["core.retention_schedule_entry"];
  assertEquals(rows.length, 2);
  assertEquals(rows.map((r) => r.version).sort(), [1, 2]);
  assert(codes(dbx.rows).includes("schedule_a.entry.amended"));
  assert(codes(dbx.rows).includes("schedule_a.entry_inherited"));
});

Deno.test("RR-01/RR-09: an amendment does NOT retroactively govern — the schedule in force is effective-dated", async () => {
  const { db } = await seedSchedule();
  await postRetentionScheduleEntry(
    req({
      record_class: "cip_identity", retention_years: 7, anchor_kind: "account_closed",
      citation: "31 CFR 1020.220", effective_at: "2026-06-01T00:00:00.000Z",
    }),
    db, "t", CTX,
  );
  // a record disposed in March 2026 must be checkable against the 5-year rule
  const then = await scheduleInForce(db, "core", "cip_identity", new Date("2026-03-01T00:00:00Z"));
  assertEquals(then!.retention_years, 5, "the June amendment must not govern March");
  const now = await scheduleInForce(db, "core", "cip_identity", new Date("2026-09-01T00:00:00Z"));
  assertEquals(now!.retention_years, 7);
});

Deno.test("RR-01: a future-dated amendment does not leave a gap with no schedule", async () => {
  const { db } = await seedSchedule();
  await postRetentionScheduleEntry(
    req({
      record_class: "cip_identity", retention_years: 7, anchor_kind: "account_closed",
      citation: "c", effective_at: "2027-01-01T00:00:00.000Z",
    }),
    db, "t", CTX,
  );
  // between now and the amendment there must still be a schedule in force
  const between = await scheduleInForce(db, "core", "cip_identity", new Date("2026-08-01T00:00:00Z"));
  assert(between, "superseding at 'now' rather than at the effective date would leave a gap");
  assertEquals(between!.retention_years, 5);
});

Deno.test("RR-01: an unmatched class REFUSES rather than defaulting a retention period", async () => {
  const { dbx, db } = await seedSchedule();
  const res = await postRecordClassify(
    req({ record_class: "mystery", record_id: "r1" }), db, "t", CTX,
  );
  assertEquals(res.status, 409);
  assertEquals(dbx.rows["core.record_class_unmatched"].length, 1);
  assert(codes(dbx.rows).includes("record_class.unmatched"));
  // and crucially NO record was created with a guessed clock
  assertEquals((dbx.rows["core.record"] ?? []).length, 0);
});

Deno.test("RR-01: the clock comes from the SCHEDULE, not a constant", async () => {
  const { dbx, db } = await seedSchedule();
  await postRecordClassify(
    req({ record_class: "cip_identity", record_id: "r1", subject_ref: "a1" }), db, "t", CTX,
  );
  const rec = dbx.rows["core.record"][0];
  assertEquals(new Date(String(rec.retention_expires_at)).getUTCFullYear(),
    new Date().getUTCFullYear() + 5);
  assert(codes(dbx.rows).includes("record.retention_clock_set"));
});

Deno.test("RR-01: a RETIRED class stops applying and refuses like an unregistered one", async () => {
  const { dbx, db } = await seedSchedule();
  // a retirement supersedes with no successor
  await postRetentionScheduleEntry(
    req({
      record_class: "cip_identity", retire: true, citation: "n/a",
      effective_at: "2026-06-01T00:00:00.000Z",
    }),
    db, "t", CTX,
  );
  const after = await scheduleInForce(db, "core", "cip_identity", new Date("2026-09-01T00:00:00Z"));
  assertEquals(after, null, "a retired entry must not keep governing");
  // and classifying against it now refuses rather than using the retired period
  const res = await postRecordClassify(
    req({ record_class: "cip_identity", record_id: "r1" }), db, "t", CTX,
  );
  assertEquals(res.status, 409);
  assert(codes(dbx.rows).includes("record_class.unmatched"));
  // BEFORE the retirement date it still governs
  const before = await scheduleInForce(db, "core", "cip_identity", new Date("2026-03-01T00:00:00Z"));
  assertEquals(before!.retention_years, 5);
});

// ------------------------------------------------------ RR-11 permanent

Deno.test("RR-11: a permanent record gets no expiry and is explicitly NOT disposal eligible", async () => {
  const dbx = makeDrillDb();
  await postRetentionScheduleEntry(
    req({ record_class: "charter", permanent: true, anchor_kind: "created", citation: "12 CFR 701" }),
    dbx.client, "t", CTX,
  );
  await postRecordClassify(
    req({ record_class: "charter", record_id: "perm1" }), dbx.client, "t", CTX,
  );
  assertEquals(dbx.rows["core.record"][0].retention_expires_at, null);
  const ev = (dbx.rows["core.event"] ?? []).find((e) => e.code === "record.disposal_eligible");
  assert(ev, "'never eligible' must be stated, not merely absent");
  assertEquals((ev!.payload as Any).eligible, false);
});

Deno.test("RR-11: a permanent record cannot be disposed by any method", async () => {
  const dbx = makeDrillDb();
  await postRetentionScheduleEntry(
    req({ record_class: "charter", permanent: true, anchor_kind: "created", citation: "c" }),
    dbx.client, "t", CTX,
  );
  await postRecordClassify(req({ record_class: "charter", record_id: "perm1" }), dbx.client, "t", CTX);
  const res = await postRecordDisposition(
    req({ method: "destroyed", approved_by: "x" }), "perm1", dbx.client, "t", CTX,
  );
  assertEquals(res.status, 409);
  assertEquals((dbx.rows["core.record_disposition"] ?? []).length, 0);
});

// ------------------------------------------------------- RR-02/06 integrity

Deno.test("RR-02: a completed test needs a verdict, a sample and a certifier", async () => {
  const dbx = makeDrillDb();
  await postIntegrityTestSchedule(
    req({ subject_kind: "record", subject_ref: "r1", test_kind: "conversion" }),
    dbx.client, "t", CTX,
  );
  const res = await postIntegrityTestComplete(
    req({ passed: true }), "rint_record_r1_conversion", dbx.client, "t", CTX,
  );
  assertEquals(res.status, 400);
  assertEquals(dbx.rows["core.record_integrity_test"][0].completed_at, null);
});

Deno.test("RR-02: a FAILED test opens a finding; a passing one does not", async () => {
  const dbx = makeDrillDb();
  await postIntegrityTestSchedule(
    req({ subject_kind: "record", subject_ref: "r1", test_kind: "readability" }),
    dbx.client, "t", CTX,
  );
  await postIntegrityTestComplete(
    req({ passed: false, sample_size: 40, certified_by: "ro" }),
    "rint_record_r1_readability", dbx.client, "t", CTX,
  );
  assert(codes(dbx.rows).includes("finding.opened"));
  assert(dbx.rows["core.record_integrity_test"][0].finding_id);

  const dbx2 = makeDrillDb();
  await postIntegrityTestSchedule(
    req({ subject_kind: "record", subject_ref: "r2", test_kind: "readability" }),
    dbx2.client, "t", CTX,
  );
  await postIntegrityTestComplete(
    req({ passed: true, sample_size: 40, certified_by: "ro" }),
    "rint_record_r2_readability", dbx2.client, "t", CTX,
  );
  assert(!codes(dbx2.rows).includes("finding.opened"));
  assertEquals(dbx2.violations, []);
});

Deno.test("RR-06: an archive confirmation records the years the vendor actually confirmed", async () => {
  const dbx = makeDrillDb();
  await postArchiveConfirmation(
    req({
      archive_kind: "core_archive", period: "2026", vendor_ref: "v1",
      retention_years_confirmed: 7, confirmed_by: "ro",
    }),
    dbx.client, "t", CTX,
  );
  assertEquals(dbx.rows["core.archive_confirmation"][0].retention_years_confirmed, 7);
  assert(codes(dbx.rows).includes("core_archive.retention.confirmed"));
});

// -------------------------------------------------- RR-04 destruction log

Deno.test("RR-04: a box marked destroyed whose records are still live is a mismatch", async () => {
  const { dbx, db } = await seedSchedule();
  await postRecordClassify(req({ record_class: "cip_identity", record_id: "r1" }), db, "t", CTX);
  await postStorageBox(
    req({ id: "b1", label: "BOX-A", location: "offsite", record_ids: ["r1"] }), db, "t", CTX,
  );
  dbx.rows["core.storage_box"][0].destroyed_at = "2026-07-01T00:00:00.000Z";

  await postDestructionLogReconcile(req({}), db, "t", CTX);
  assertEquals(dbx.rows["core.destruction_log_mismatch"].length, 1);
  assertEquals(dbx.rows["core.destruction_log_mismatch"][0].kind, "box_destroyed_records_live");
  assert(codes(dbx.rows).includes("destruction_log.mismatch.detected"));
});

Deno.test("RR-04: a consistent box produces NO mismatch — the reconcile is not an echo", async () => {
  const { dbx, db } = await seedSchedule();
  await postRecordClassify(req({ record_class: "cip_identity", record_id: "r1" }), db, "t", CTX);
  await postStorageBox(
    req({ id: "b1", label: "BOX-A", location: "offsite", record_ids: ["r1"] }), db, "t", CTX,
  );
  await postDestructionLogReconcile(req({}), db, "t", CTX);
  assertEquals((dbx.rows["core.destruction_log_mismatch"] ?? []).length, 0);
  assert(!codes(dbx.rows).includes("destruction_log.mismatch.detected"));
});

Deno.test("RR-04: a mismatch cannot be closed without an explanation", async () => {
  const { dbx, db } = await seedSchedule();
  await postRecordClassify(req({ record_class: "cip_identity", record_id: "r1" }), db, "t", CTX);
  await postStorageBox(
    req({ id: "b1", label: "BOX-A", location: "offsite", record_ids: ["r1"] }), db, "t", CTX,
  );
  dbx.rows["core.storage_box"][0].destroyed_at = "2026-07-01T00:00:00.000Z";
  await postDestructionLogReconcile(req({}), db, "t", CTX);
  assertEquals((await postDestructionLogResolve(req({}), "dlmm_b1", db, "t", CTX)).status, 400);
  assertEquals(
    (await postDestructionLogResolve(req({ resolution: "recalled" }), "dlmm_b1", db, "t", CTX)).status,
    200,
  );
});

// --------------------------------------------------------------- RR-08 CDD

Deno.test("RR-08: the refresh cycle is RISK-BASED, not one interval for everyone", async () => {
  const dbx = makeDrillDb();
  for (const [i, risk] of ["high", "moderate", "low"].entries()) {
    await postCddProfile(
      req({ id: `p${i}`, entity_id: `e${i}`, risk_tier: risk, last_refreshed_at: "2026-01-01T00:00:00.000Z" }),
      dbx.client, "t", CTX,
    );
  }
  const due = dbx.rows["core.cdd_profile"].map((p) => String(p.refresh_due_at).slice(0, 7));
  assertEquals(due, ["2027-01", "2029-01", "2031-01"]);
  assertEquals(CDD_REFRESH_MONTHS.high, 12);
});

Deno.test("RR-08: a refresh records whether it was LATE", async () => {
  const dbx = makeDrillDb();
  await postCddProfile(
    req({ id: "p1", entity_id: "e1", risk_tier: "high", last_refreshed_at: "2020-01-01T00:00:00.000Z" }),
    dbx.client, "t", CTX,
  );
  await postCddRefresh(req({ refreshed_by: "analyst" }), "p1", dbx.client, "t", CTX);
  const ev = (dbx.rows["core.event"] ?? []).find((e) => e.code === "cdd.profile.refreshed");
  assertEquals((ev!.payload as Any).refreshed_late, true);
});

// ------------------------------------------------------ RR-07 disposition

Deno.test("RR-07: anonymized and destroyed are different acts and are recorded as such", async () => {
  const { dbx, db } = await seedSchedule();
  dbx.rows["core.record"] ??= [];
  dbx.rows["core.record"].push({
    id: "bsa1", record_class: "bsa_sar", subject_ref: "c1",
    retention_anchor: "2014-01-01T00:00:00.000Z",
    retention_expires_at: "2019-01-01T00:00:00.000Z",
    legal_hold_flag: false, disposed_at: null, provenance: "production",
  });
  await postRecordDisposition(
    req({ method: "anonymized", approved_by: "bsa", retained_fields: ["amount_band"] }),
    "bsa1", db, "t", CTX,
  );
  const d = dbx.rows["core.record_disposition"][0];
  assertEquals(d.method, "anonymized");
  assertEquals(d.retained_fields, ["amount_band"]);
  const ev = (dbx.rows["core.event"] ?? []).find((e) => e.code === "record.disposal_method");
  assertEquals((ev!.payload as Any).method, "anonymized");
});

Deno.test("RR-07: the three disposal conditions still apply — a method is not a bypass", async () => {
  const { dbx, db } = await seedSchedule();
  dbx.rows["core.record"] ??= [];
  dbx.rows["core.record"].push({
    id: "held", record_class: "bsa_sar", subject_ref: "c1",
    retention_anchor: "2014-01-01T00:00:00.000Z",
    retention_expires_at: "2019-01-01T00:00:00.000Z",
    legal_hold_flag: true, disposed_at: null, provenance: "production",
  });
  dbx.rows["core.record"].push({
    id: "unexpired", record_class: "bsa_sar", subject_ref: "c2",
    retention_anchor: "2024-01-01T00:00:00.000Z",
    retention_expires_at: "2099-01-01T00:00:00.000Z",
    legal_hold_flag: false, disposed_at: null, provenance: "production",
  });
  assertEquals(
    (await postRecordDisposition(req({ method: "anonymized", approved_by: "x" }), "held", db, "t", CTX)).status,
    409,
  );
  assertEquals(
    (await postRecordDisposition(req({ method: "anonymized", approved_by: "x" }), "unexpired", db, "t", CTX)).status,
    409,
  );
  assertEquals((dbx.rows["core.record_disposition"] ?? []).length, 0);
});

// ------------------------------------------------- RR-09 / RR-12 governance

Deno.test("RR-09: the amendment count is COUNTED from the schedule, not asserted", async () => {
  const { db, dbx } = await seedSchedule();
  await postRetentionScheduleEntry(
    req({
      record_class: "cip_identity", retention_years: 7, anchor_kind: "account_closed",
      citation: "c", effective_at: "2026-06-01T00:00:00.000Z",
    }),
    db, "t", CTX,
  );
  await postRecordsPolicyReview(
    req({
      cycle_year: 2026, reviewed_by: "ro", policy_document_version: "v3",
      schedule_entries_amended: 99, regulation_changes: ["x"],
    }),
    db, "t", CTX,
  );
  assertEquals(dbx.rows["core.records_policy_review"][0].schedule_entries_amended, 1);
  assert(codes(dbx.rows).includes("records.board_report.filed"));
});

Deno.test("RR-12: a VACANCY is recorded as its own state", async () => {
  const dbx = makeDrillDb();
  await putRecordsContact(req({ assigned_ref: "ro_1" }), "records_officer", dbx.client, "t", CTX);
  assert(codes(dbx.rows).includes("records.contact.assigned"));

  await putRecordsContact(req({ vacate: true }), "records_officer", dbx.client, "t", CTX);
  const row = dbx.rows["core.records_contact"][0];
  assertEquals(row.assigned_ref, null);
  assert(row.vacated_at, "a vacancy must be distinguishable from a role that never existed");
  assert(codes(dbx.rows).includes("records.contact_vacated"));
  assertEquals(dbx.violations, []);
});
