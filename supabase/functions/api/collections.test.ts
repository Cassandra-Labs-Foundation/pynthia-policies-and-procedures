// Collections — CO-01..CO-11.
//
// The negatives: a loan with no due date (no days-past-due can be computed), a
// self-approved workout, a second re-age, contact outside permitted hours or
// against a protection, and a fee waiver with no approver.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { makeDrillDb } from "../drill/fake_db.ts";
import { OPS_CTX, req } from "./test_helpers.ts";
import {
  CHARGE_OFF_DPD,
  NONACCRUAL_DPD,
  classificationFor,
  daysPastDue,
  postChargeOff,
  postCollectionContact,
  postCollectionProtection,
  postDelinquencyEvaluation,
  postLoanModification,
  postOverdraftReferral,
  stageFor,
} from "./collections.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
const CTX = OPS_CTX;
const codes = (rows: Record<string, Any[]>) =>
  (rows["core.event"] ?? []).map((e) => String(e.code));

function seedLoan(o: Record<string, unknown> = {}) {
  const dbx = makeDrillDb();
  dbx.rows["core.loan"] = [{
    id: "loan_1", member_ref: "m1", product: "consumer", product_type: "closed_end_consumer",
    principal_cents: 500_000, next_due_date: "2026-01-01",
    attorney_represented: false, bankruptcy_flag: false, scra_flag: false,
    provenance: "production", ...o,
  }];
  return { dbx, db: dbx.client };
}

// ------------------------------------------------- derivation, not assertion

Deno.test("CO-02: days past due is DERIVED from the due date", () => {
  assertEquals(daysPastDue("2026-07-01", new Date("2026-07-15T00:00:00Z")), 14);
  assertEquals(daysPastDue("2026-08-01", new Date("2026-07-15T00:00:00Z")), 0, "not yet due");
});

Deno.test("CO-03: the classification bands are the regulatory ones", () => {
  assertEquals(classificationFor(0), "pass");
  assertEquals(classificationFor(45), "special_mention");
  assertEquals(classificationFor(95), "substandard");
  assertEquals(classificationFor(130), "doubtful");
  assertEquals(classificationFor(200), "loss");
  assertEquals(stageFor(200), "charge_off_eligible");
  assertEquals(CHARGE_OFF_DPD, 180);
});

Deno.test("CO-02: a loan with NO due date cannot be evaluated", async () => {
  const { dbx, db } = seedLoan({ next_due_date: null });
  const res = await postDelinquencyEvaluation(req({}), "loan_1", db, "t", CTX);
  assertEquals(res.status, 409);
  assertEquals((dbx.rows["core.delinquency_evaluation"] ?? []).length, 0);
});

Deno.test("CO-02/03/09: one evaluation derives stage, classification and nonaccrual", async () => {
  const { dbx, db } = seedLoan();
  await postDelinquencyEvaluation(
    req({ as_of: "2026-07-15T00:00:00.000Z" }), "loan_1", db, "t", CTX,
  );
  const e = dbx.rows["core.delinquency_evaluation"][0];
  assertEquals(e.days_past_due, 195);
  assertEquals(e.stage, "charge_off_eligible");
  assertEquals(e.classification, "loss");
  assertEquals(e.nonaccrual, true);
  // the inputs are stored alongside the verdict so it can be recomputed
  assertEquals(e.next_due_date, "2026-01-01");
  // "triggered" and "placed" are different facts
  assert(codes(dbx.rows).includes("loan.nonaccrual.triggered"));
  assert(codes(dbx.rows).includes("loan.nonaccrual.placed"));
});

Deno.test("CO-02: a CURRENT loan fires no delinquency thresholds", async () => {
  const { dbx, db } = seedLoan({ next_due_date: "2099-01-01" });
  await postDelinquencyEvaluation(req({}), "loan_1", db, "t", CTX);
  assertEquals(dbx.rows["core.delinquency_evaluation"][0].stage, "current");
  assert(!codes(dbx.rows).includes("loan.delinquency_day_10"));
  assert(!codes(dbx.rows).includes("loan.nonaccrual.triggered"));
  assertEquals(NONACCRUAL_DPD, 90);
});

Deno.test("CO-09: a loan brought current comes back ON accrual", async () => {
  const { dbx, db } = seedLoan();
  await postDelinquencyEvaluation(req({ as_of: "2026-07-15T00:00:00.000Z" }), "loan_1", db, "t", CTX);
  assert(dbx.rows["core.loan"][0].nonaccrual_at);
  dbx.rows["core.loan"][0].next_due_date = "2099-01-01";
  await postDelinquencyEvaluation(req({}), "loan_1", db, "t", CTX);
  // without this the loan stays nonaccrual forever and income is never restored
  assert(codes(dbx.rows).includes("loan.accrual.restored"));
});

// ------------------------------------------------------------ CO-04 workouts

Deno.test("CO-04: the TDR determination is DERIVED, not supplied", async () => {
  const { dbx, db } = seedLoan();
  await postLoanModification(
    req({
      kind: "forbearance", borrower_hardship: true, concession_granted: true,
      requested_by: "c1", approved_by: "m1", tdr: false,
    }),
    "loan_1", db, "t", CTX,
  );
  assertEquals(
    dbx.rows["core.loan_modification"][0].tdr, true,
    "a supplied tdr flag is how a restructuring gets recorded as an extension",
  );

  const s2 = seedLoan();
  await postLoanModification(
    req({
      kind: "extension", borrower_hardship: false, concession_granted: true,
      requested_by: "c1", approved_by: "m1",
    }),
    "loan_1", s2.db, "t", CTX,
  );
  assertEquals(s2.dbx.rows["core.loan_modification"][0].tdr, false, "concession without hardship");
});

Deno.test("CO-04: a workout cannot be approved by whoever negotiated it", async () => {
  const { dbx, db } = seedLoan();
  const res = await postLoanModification(
    req({
      kind: "extension", borrower_hardship: false, concession_granted: false,
      requested_by: "c1", approved_by: "c1",
    }),
    "loan_1", db, "t", CTX,
  );
  assertEquals(res.status, 409);
  assertEquals((dbx.rows["core.loan_modification"] ?? []).length, 0);
});

Deno.test("CO-04: a second re-age within twelve months is refused", async () => {
  const { dbx, db } = seedLoan();
  const mod = () => req({
    kind: "reage", borrower_hardship: true, concession_granted: false,
    requested_by: "c1", approved_by: "m1",
  });
  assertEquals((await postLoanModification(mod(), "loan_1", db, "t", CTX)).status, 201);
  // unlimited re-aging turns a delinquent loan current on paper with nothing paid
  assertEquals((await postLoanModification(mod(), "loan_1", db, "t", CTX)).status, 409);
  assertEquals(dbx.rows["core.loan_modification"].length, 1);
});

Deno.test("CO-04: days-past-due resets only after payments are demonstrated", async () => {
  const { dbx, db } = seedLoan();
  await postLoanModification(
    req({
      kind: "forbearance", borrower_hardship: true, concession_granted: true,
      requested_by: "c1", approved_by: "m1",
    }),
    "loan_1", db, "t", CTX,
  );
  assert(codes(dbx.rows).includes("loan.dpd_reset_eligibility_check"));
  assert(!codes(dbx.rows).includes("loan.dpd_reset"), "approval alone must not reset");

  const s2 = seedLoan();
  await postLoanModification(
    req({
      kind: "forbearance", borrower_hardship: true, concession_granted: true,
      requested_by: "c1", approved_by: "m1", payments_received_after_mod: true,
    }),
    "loan_1", s2.db, "t", CTX,
  );
  assert(codes(s2.dbx.rows).includes("loan.dpd_reset"));
  // the event says it happened; only the row says it is TRUE. This assertion
  // is what caught the reset that was announced and never applied.
  assertEquals(s2.dbx.rows["core.loan"][0].days_past_due, 0);
  assertEquals(s2.dbx.rows["core.loan"][0].delinquency_stage, "current");
});

// -------------------------------------------------------- CO-05 the FDCPA gate

Deno.test("CO-05: contact outside permitted hours is blocked", async () => {
  const { dbx, db } = seedLoan();
  assertEquals(
    (await postCollectionContact(
      req({ channel: "phone", local_hour: 6, member_ref: "m1" }), "loan_1", db, "t", CTX,
    )).status,
    409,
  );
  assertEquals(dbx.rows["core.collection_contact"][0].blocked_reason, "outside_permitted_hours");
  assertEquals(
    (await postCollectionContact(
      req({ channel: "phone", local_hour: 14, member_ref: "m1" }), "loan_1", db, "t", CTX,
    )).status,
    201,
  );
});

Deno.test("CO-05: each protection is a STANDING STATE that blocks contact", async () => {
  for (const [patch, reason] of [
    [{ attorney_represented: true }, "attorney_represented"],
    [{ cease: true }, "cease_communication_requested"],
    [{ bankruptcy: true }, "automatic_stay"],
  ] as Any[]) {
    const { dbx, db } = seedLoan();
    await postCollectionProtection(req(patch), "loan_1", db, "t", CTX);
    const res = await postCollectionContact(
      req({ channel: "phone", local_hour: 14, member_ref: "m1" }), "loan_1", db, "t", CTX,
    );
    assertEquals(res.status, 409);
    assertEquals(dbx.rows["core.collection_contact"][0].blocked_reason, reason);
    assert(codes(dbx.rows).includes("collections.contact_gated"));
  }
});

Deno.test("CO-05: a BLOCKED contact is still recorded", async () => {
  const { dbx, db } = seedLoan({ attorney_represented: true });
  await postCollectionContact(
    req({ channel: "phone", local_hour: 14, member_ref: "m1" }), "loan_1", db, "t", CTX,
  );
  // a gate that records only what it permitted cannot be audited
  assertEquals(dbx.rows["core.collection_contact"].length, 1);
  assert(codes(dbx.rows).includes("collections.contact.logged"));
  assertEquals(dbx.violations, []);
});

// ------------------------------------------------------------ CO-10 overdraft

Deno.test("CO-10: a fee waiver with no approver is refused", async () => {
  const dbx = makeDrillDb();
  assertEquals(
    (await postOverdraftReferral(
      req({
        account_ref: "a1", balance_cents: -10_000, days_negative: 5,
        fees_assessed_cents: 3_000, fees_waived_cents: 3_000,
      }),
      dbx.client, "t", CTX,
    )).status,
    400,
  );
  assertEquals((dbx.rows["core.overdraft_referral"] ?? []).length, 0);
});

Deno.test("CO-10: a sustained negative balance suppresses fees and charges off at 45 days", async () => {
  const dbx = makeDrillDb();
  await postOverdraftReferral(
    req({ account_ref: "a1", balance_cents: -10_000, days_negative: 5 }), dbx.client, "t", CTX,
  );
  assert(!codes(dbx.rows).includes("fee.overdraft.suppressed"));
  assertEquals(dbx.rows["core.overdraft_referral"][0].charged_off_at, null);

  const d2 = makeDrillDb();
  await postOverdraftReferral(
    req({ account_ref: "a2", balance_cents: -40_000, days_negative: 50 }), d2.client, "t", CTX,
  );
  // continuing to charge an account that cannot pay is the practice the control stops
  assert(codes(d2.rows).includes("fee.overdraft.suppressed"));
  assert(codes(d2.rows).includes("overdraft.charged_off"));
  // the STATE must change too, not just the event — a mutation that stopped
  // stamping charged_off_at survived on the event assertion alone
  assert(
    d2.rows["core.overdraft_referral"][0].charged_off_at,
    "the referral row must record the charge-off, not only announce it",
  );
  assertEquals(d2.violations, []);
});

Deno.test("CO-03: charging off LATE is recorded as late", async () => {
  const { dbx, db } = seedLoan();
  await postDelinquencyEvaluation(req({ as_of: "2026-07-15T00:00:00.000Z" }), "loan_1", db, "t", CTX);
  await postChargeOff(req({ approved_by: "cco" }), "loan_1", db, "t", CTX);
  const ev = (dbx.rows["core.event"] ?? []).find((e) => e.code === "loan.charged_off");
  assertEquals((ev!.payload as Any).charged_off_late, true, "195 dpd is past the 180-day guidance");
});
