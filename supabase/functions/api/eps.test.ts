// EPS-06 dual control for high-risk payment processes.
//
// Two properties matter here and both are about what the system does when it
// does NOT know something:
//
//   the four-eyes rule    two calls is not two people
//   the unassessed state  no configured client limit is not "exempt"
//
// The second is the one that fails quietly if it fails. A batch from a client
// with no limit could plausibly be treated as below-threshold, and nothing
// would look wrong.
import { assert, assertEquals } from "jsr:@std/assert@1";
import {
  achDualControl,
  getPendingApprovals,
  postPaymentApproval,
  putClientLimit,
  wireDualControl,
} from "./eps.ts";
import { type Any, OPS_CTX, req, TEST_CTX } from "./test_helpers.ts";

function epsDb(rows: Record<string, Record<string, unknown>[]>) {
  const writes: { schema: string; table: string; op: string; row: Any }[] = [];
  let schema = "core";
  const from = (table: string) => {
    const filters: { col: string; val: unknown }[] = [];
    const chain: Any = {
      select: () => chain,
      eq: (col: string, val: unknown) => (filters.push({ col, val }), chain),
      is: (col: string, val: unknown) => (filters.push({ col, val }), chain),
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

// ------------------------------------------------- the assessment itself

Deno.test("wire dual control is unconditional — no policy value needed", () => {
  // EPS-06 states it as required with no threshold, so there is nothing to
  // look up and nothing to be unassessed about.
  const d = wireDualControl();
  assertEquals(d.status, "required");
  assertEquals(d.thresholdCents, null);
});

Deno.test("an unconfigured ACH limit is UNASSESSED, not exempt and not required", () => {
  // The whole point. Treating null as exempt fails open on a $2m batch;
  // treating it as required fails closed on a number nobody chose.
  for (const missing of [null, undefined]) {
    const d = achDualControl(200_000_00, missing);
    assertEquals(d.status, "unassessed");
    assert(d.basis.includes("no ACH dual-control limit configured"));
  }
});

Deno.test("a configured limit produces a real determination in both directions", () => {
  assertEquals(achDualControl(60_000_00, 50_000_00).status, "required");
  assertEquals(achDualControl(40_000_00, 50_000_00).status, "not_required");
  // exactly at the limit is NOT over it
  assertEquals(achDualControl(50_000_00, 50_000_00).status, "not_required");
});

Deno.test("a configured limit of ZERO is a real policy, not an absence", () => {
  // zero means "every batch needs dual control" and must not collapse into null
  assertEquals(achDualControl(1, 0).status, "required");
  assertEquals(achDualControl(1, null).status, "unassessed");
});

// ------------------------------------------------------ the four-eyes rule

const PENDING = {
  id: "appr_wire_transfer_w1",
  resource_type: "wire_transfer",
  resource_id: "w1",
  created_by: "tok_preparer",
  approved_by: null,
  approved_at: null,
  rejected_at: null,
  basis: "EPS-06: wire dual control is required unconditionally",
};

Deno.test("the originator cannot approve their own payment", async () => {
  const { db, writes } = epsDb({ payment_approval: [PENDING] });
  const selfCtx = { ...OPS_CTX, tokenId: "tok_preparer" };
  const res = await postPaymentApproval(req({}), "wire_transfer", "w1", db, "e1", selfCtx);
  assertEquals(res.status, 409);
  assertEquals((await res.json()).type, "dual_control_violation");
  assertEquals(writes.length, 0, "a self-approved wire must not be written");
});

Deno.test("a different actor can approve, and both actors are recorded", async () => {
  const { db, writes } = epsDb({ payment_approval: [PENDING] });
  const res = await postPaymentApproval(
    req({}), "wire_transfer", "w1", db, "e2", { ...OPS_CTX, tokenId: "tok_approver" },
  );
  assertEquals(res.status, 200);
  const b = await res.json();
  assertEquals(b.originator, "tok_preparer");
  assertEquals(b.approver, "tok_approver");
  // the rail row is advanced too, which is what unblocks confirm
  const rail = writes.find((w) => w.table === "wire_transfer");
  assertEquals(rail?.row.dual_control_status, "approved");
});

Deno.test("a rejection blocks rather than approves", async () => {
  const { db, writes } = epsDb({ payment_approval: [PENDING] });
  await postPaymentApproval(
    req({ outcome: "reject", note: "beneficiary unverified" }),
    "wire_transfer", "w1", db, "e3", { ...OPS_CTX, tokenId: "tok_approver" },
  );
  assertEquals(writes.find((w) => w.table === "wire_transfer")?.row.dual_control_status, "rejected");
  assertEquals(writes.find((w) => w.table === "payment_approval")?.row.rejected_by, "tok_approver");
});

Deno.test("re-approving replays rather than re-deciding", async () => {
  const { db, writes } = epsDb({
    payment_approval: [{ ...PENDING, approved_at: "2026-07-19T00:00:00Z", approved_by: "tok_a" }],
  });
  const res = await postPaymentApproval(
    req({}), "wire_transfer", "w1", db, "e4", { ...OPS_CTX, tokenId: "tok_b" },
  );
  assertEquals(res.headers.get("Idempotent-Replayed"), "true");
  assertEquals(writes.length, 0);
});

// --------------------------------------- unassessed payments stay visible

Deno.test("pending-approvals separates PENDING from UNASSESSED", async () => {
  // They are different states: pending means someone must act; unassessed means
  // nobody determined whether anyone needed to.
  const { db } = epsDb({
    payment_approval: [PENDING],
    ach_transfer: [{ id: "ach_1", amount: 200_000_00, dual_control_status: "unassessed" }],
    wire_transfer: [],
  });
  const b = await (await getPendingApprovals(req({}), db, "e5", OPS_CTX)).json();
  assertEquals(b.pending_count, 1);
  assertEquals(b.unassessed_count, 1);
  assertEquals(b.unassessed[0].amount, 200_000_00);
  assert(
    b.warning.includes("NOT blocked and NOT determined exempt"),
    "the unassessed state must be stated, not inferred from a count",
  );
});

Deno.test("with everything assessed there is no warning", async () => {
  const { db } = epsDb({ payment_approval: [], ach_transfer: [], wire_transfer: [] });
  const b = await (await getPendingApprovals(req({}), db, "e6", OPS_CTX)).json();
  assertEquals(b.unassessed_count, 0);
  assertEquals(b.warning, undefined);
});

// ------------------------------------------------------- setting the policy

Deno.test("client limits can be set, which is what resolves the unassessed state", async () => {
  const { db, writes } = epsDb({});
  const res = await putClientLimit(
    req({ ach_dual_control_over_cents: 5_000_000 }), "ptnr_test", db, "e7", OPS_CTX,
  );
  assertEquals(res.status, 200);
  assertEquals(writes.find((w) => w.table === "client_limit")?.row.ach_dual_control_over_cents, 5_000_000);
  assertEquals(writes.find((w) => w.table === "client_limit")?.row.set_by, "tok_ops");
});

Deno.test("a fintech cannot set its own dual-control threshold", async () => {
  const { db, writes } = epsDb({});
  const res = await putClientLimit(
    req({ ach_dual_control_over_cents: 999_999_999 }), "ptnr_test", db, "e8", TEST_CTX,
  );
  assertEquals(res.status, 404);
  assertEquals(writes.length, 0);
});

Deno.test("a negative or fractional limit is refused", async () => {
  const { db } = epsDb({});
  for (const bad of [-1, 1.5]) {
    const res = await putClientLimit(
      req({ ach_dual_control_over_cents: bad }), "ptnr_test", db, "e9", OPS_CTX,
    );
    assertEquals(res.status, 400, `limit ${bad} must be refused`);
  }
});

Deno.test("explicit null leaves the limit unconfigured rather than setting zero", async () => {
  const { db, writes } = epsDb({});
  await putClientLimit(req({ ach_dual_control_over_cents: null }), "ptnr_test", db, "e10", OPS_CTX);
  assertEquals(writes.find((w) => w.table === "client_limit")?.row.ach_dual_control_over_cents, null);
});
