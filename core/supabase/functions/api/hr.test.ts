// HR seam — CP-05 custody revocation on separation, CP-07 coaching, CP-12
// computed training coverage, IS-06 access deprovisioning, BA-08 assignments.
//
// The negatives: a separated employee still holding vault keys or live
// credentials is the exposure the controls name, coaching with no notes is a
// checkbox, and coverage over zero declared employees is UNASSESSED — an
// institution that has not declared its people has not demonstrated coverage.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { makeDrillDb } from "../drill/fake_db.ts";
import { OPS_CTX, req } from "./test_helpers.ts";
import {
  postEmployee, postEmployeeCoaching, postEmployeeSeparate, postEmployeeTraining,
  postTrainingAssignment, trainingCoveragePct,
} from "./hr.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
const CTX = OPS_CTX;
const codes = (rows: Record<string, Any[]>) =>
  (rows["core.event"] ?? []).map((e) => String(e.code));

async function hire(dbx: Any, id: string, cashHandler = true): Promise<void> {
  const res = await postEmployee(
    req({ id, name: "Pat Teller", role: "teller", cash_handler: cashHandler }),
    dbx.client, "t", CTX,
  );
  assertEquals(res.status, 201);
}

Deno.test("an employee needs a name and a role", async () => {
  const dbx = makeDrillDb();
  const res = await postEmployee(req({ name: "Pat" }), dbx.client, "t", CTX);
  assertEquals(res.status, 400);
  assertEquals((dbx.rows["core.employee"] ?? []).length, 0);
});

Deno.test("hiring records the personnel fact as an event", async () => {
  const dbx = makeDrillDb();
  await hire(dbx, "emp_1");
  assertEquals(dbx.rows["core.employee"][0].status, "active");
  assert(codes(dbx.rows).includes("employee.hired"));
});

// ------------------------------------------------------------------ CP-05

Deno.test("CP-05: separation revokes every LIVE cash custody in the same request", async () => {
  const dbx = makeDrillDb();
  await hire(dbx, "emp_1");
  dbx.rows["core.cash_custody"] = [
    {
      id: "cust_live", employee_id: "emp_1", kind: "key", asset_id: "vault_1",
      revoked_at: null, provenance: "production",
    },
    { // already revoked — must not be touched again
      id: "cust_done", employee_id: "emp_1", kind: "combination", asset_id: "vault_2",
      revoked_at: "2026-01-01T00:00:00.000Z", revoke_reason: "rotation", provenance: "production",
    },
  ];
  const res = await postEmployeeSeparate(req({ reason: "resigned" }), "emp_1", dbx.client, "t", CTX);
  assertEquals((await res.json()).data.custodies_revoked, 1);
  assertEquals(dbx.rows["core.employee"][0].status, "separated");
  const live = dbx.rows["core.cash_custody"].find((c) => c.id === "cust_live")!;
  assert(live.revoked_at !== null, "a separated employee still holding vault keys is the exposure");
  assertEquals(live.revoke_reason, "employee_separated");
  assertEquals(
    dbx.rows["core.cash_custody"].find((c) => c.id === "cust_done")!.revoke_reason, "rotation",
  );
  const c = codes(dbx.rows);
  assert(c.includes("employee.separated"));
  assert(c.includes("cash.custody.revoked"));
  assert(c.includes("cash.coverage.updated"));
});

Deno.test("IS-06: separation deprovisions live access in the same act", async () => {
  const dbx = makeDrillDb();
  await hire(dbx, "emp_1");
  dbx.rows["core.access_grant"] = [{
    id: "acc_1", user_id: "emp_1", role: "teller_console",
    deprovisioned_at: null, provenance: "production",
  }];
  await postEmployeeSeparate(req({}), "emp_1", dbx.client, "t", CTX);
  assert(dbx.rows["core.access_grant"][0].deprovisioned_at !== null);
  assert(codes(dbx.rows).includes("access.deprovisioned"));
  // the IAM projection follows the personnel fact
  assertEquals(dbx.rows["core.user"][0].employment_status, "separated");
});

// ------------------------------------------------------------------ CP-07

Deno.test("CP-07: coaching with no notes is a checkbox, and is refused", async () => {
  const dbx = makeDrillDb();
  await hire(dbx, "emp_1");
  const res = await postEmployeeCoaching(
    req({ cause_type: "over_short" }), "emp_1", dbx.client, "t", CTX,
  );
  assertEquals(res.status, 400);
  assert(!codes(dbx.rows).includes("hr.coaching.recorded"));

  await postEmployeeCoaching(
    req({ cause_type: "over_short", cause_id: "os_1", notes: "reviewed drawer procedure" }),
    "emp_1", dbx.client, "t", CTX,
  );
  assertEquals(dbx.rows["core.hr_action"][0].kind, "coaching");
  assert(codes(dbx.rows).includes("hr.coaching.recorded"));
});

// ------------------------------------------------------------------ CP-12

Deno.test("training completion lands on the SHARED training table, not a parallel one", async () => {
  const dbx = makeDrillDb();
  // an unknown employee cannot be trained into existence
  const ghost = await postEmployeeTraining(req({ course: "cash_handling" }), "emp_ghost", dbx.client, "t", CTX);
  assertEquals(ghost.status, 404);

  await hire(dbx, "emp_1");
  await postEmployeeTraining(req({ course: "cash_handling" }), "emp_1", dbx.client, "t", CTX);
  const row = dbx.rows["core.training"][0];
  assertEquals(row.assignee_id, "emp_1");
  assertEquals(row.completion_status, "completed");
  assert(codes(dbx.rows).includes("training.completed"));
});

Deno.test("CP-12: coverage over NO declared employees is unassessed, never 100%", async () => {
  const dbx = makeDrillDb();
  assertEquals(await trainingCoveragePct(dbx.client, "core"), null);

  await hire(dbx, "emp_1");
  await hire(dbx, "emp_2");
  await hire(dbx, "emp_3", false); // not a cash handler — outside the denominator
  await postEmployeeTraining(req({ course: "cash_handling" }), "emp_1", dbx.client, "t", CTX);
  // 1 of 2 cash-handlers trained — computed, never caller-supplied
  assertEquals(await trainingCoveragePct(dbx.client, "core"), 50);
});

// ------------------------------------------------------------------ BA-08

Deno.test("BA-08: a capital training assignment carries the annual clock and the corpus code", async () => {
  const dbx = makeDrillDb();
  await hire(dbx, "emp_1");
  const res = await postTrainingAssignment(
    req({ curriculum: "capital", assignee_id: "emp_1" }), dbx.client, "t", CTX,
  );
  assertEquals(res.status, 201);
  const days = Math.round(
    (new Date((await res.json()).data.annual_due_at).getTime() - Date.now()) / 86_400_000,
  );
  assertEquals(days, 365);
  // the assignment IS a training row in 'assigned' status
  const trn = dbx.rows["core.training"].find((t) => t.id === "trn_emp_1_capital")!;
  assertEquals(trn.completion_status, "assigned");
  const c = codes(dbx.rows);
  assert(c.includes("training.assignment.created"));
  // `training.capital` is BA-08's own name, kept verbatim
  assert(c.includes("training.capital"));
});
