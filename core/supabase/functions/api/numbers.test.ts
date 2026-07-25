// Account numbers, cards 26-29.
//
// 26 format: 12 digits = 3-digit prefix + 8-digit body + 1 Luhn check digit;
// prefix 000 reserved for CU-direct. 27 many numbers per account, distinct
// pairs. 28 a canceled number is NEVER reissued (uniqueness spans every
// status). 29 the number state machine rejects illegal transitions.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { luhnCheckDigit, mintAccountNumber, postAccountNumber, postNumberTransition, ROUTING_NUMBER } from "./numbers.ts";
import { type Any, req, stubApiDb, TEST_CTX } from "./test_helpers.ts";

// ------------------------------------------------------------- 26: format

Deno.test("minted numbers are 12 digits: 3-digit prefix + 8 body + Luhn digit", () => {
  for (let i = 0; i < 20; i++) {
    const n = mintAccountNumber(false);
    assert(/^\d{12}$/.test(n), `${n} must be 12 digits`);
    assert(!n.startsWith("000"), "partner numbers must not use the CU-direct prefix");
    assertEquals(Number(n[11]), luhnCheckDigit(n.slice(0, 11)), "last digit is the Luhn check");
  }
});

Deno.test("prefix 000 is reserved for CU-direct minting", () => {
  const n = mintAccountNumber(true);
  assert(n.startsWith("000"), "cu_direct mints under 000");
  assertEquals(Number(n[11]), luhnCheckDigit(n.slice(0, 11)));
});

Deno.test("the routing number carries a valid ABA checksum", () => {
  const d = ROUTING_NUMBER.split("").map(Number);
  const sum = 3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8]);
  assertEquals(sum % 10, 0);
});

// ------------------------------------------------------- 27/28: mint + reuse

function mintDb(opts: { account?: unknown; conflicts?: number } = {}) {
  let conflictsLeft = opts.conflicts ?? 0;
  const inserts: { table: string; row: Record<string, unknown> }[] = [];
  const chain: Any = {
    select: () => chain,
    eq: () => chain,
    order: () => chain,
    limit: () => chain,
    maybeSingle: () => Promise.resolve({ data: opts.account ?? null, error: null }),
    insert: (row: Record<string, unknown>) => {
      if (conflictsLeft > 0) {
        conflictsLeft--;
        return Promise.resolve({ data: null, error: { code: "23505", message: "duplicate" } });
      }
      inserts.push({ table: "account_number", row });
      return Promise.resolve({ data: null, error: null });
    },
    then: (res: (v: unknown) => unknown) => res({ data: [], error: null }),
  };
  const db: Any = { schema: () => ({ from: () => chain }) };
  return { db, inserts };
}
const ACCOUNT = { id: "acct_1", status: "open", lock_type: "none" };

Deno.test("minting stores an active number bound to the account", async () => {
  const { db, inserts } = mintDb({ account: ACCOUNT });
  const res = await postAccountNumber(req({}), "acct_1", db, "n1", TEST_CTX);
  assertEquals(res.status, 201);
  const row = inserts[0].row;
  assertEquals(row.account_id, "acct_1");
  assertEquals(row.status, "active");
  assertEquals(row.routing_number, ROUTING_NUMBER);
  assert(/^\d{12}$/.test(String(row.account_number)));
});

Deno.test("a mint collision retries with a fresh number instead of failing", async () => {
  // uniqueness spans canceled rows too, so collisions are expected and benign
  const { db, inserts } = mintDb({ account: ACCOUNT, conflicts: 2 });
  const res = await postAccountNumber(req({}), "acct_1", db, "n2", TEST_CTX);
  assertEquals(res.status, 201);
  assertEquals(inserts.length, 1, "exactly one row lands after retries");
});

Deno.test("minting on an unknown account is a 404", async () => {
  const { db } = mintDb({});
  assertEquals((await postAccountNumber(req({}), "nope", db, "n3", TEST_CTX)).status, 404);
});

// --------------------------------------------------- 29: number transitions

Deno.test("number machine: active <-> disabled, both -> canceled, canceled terminal", async () => {
  const legal: [string, string][] = [
    ["active", "disabled"],
    ["disabled", "active"],
    ["active", "canceled"],
    ["disabled", "canceled"],
  ];
  for (const [from, to] of legal) {
    const { db, inserts } = stubApiDb({
      row: { id: "can_1", account_id: "acct_1", status: from },
      account: { id: "acct_1", partner_id: "ptnr_test" },
    });
    const res = await postNumberTransition(req({ to }), "can_1", db, "n4", TEST_CTX);
    assertEquals(res.status, 200, `${from} -> ${to} must be legal`);
    assertEquals(inserts.find((i) => i.table === "event")?.row.code, `account_number.${to}`);
  }
  for (const [from, to] of [["canceled", "active"], ["canceled", "disabled"]] as [string, string][]) {
    const { db } = stubApiDb({
      row: { id: "can_1", account_id: "acct_1", status: from },
      account: { id: "acct_1", partner_id: "ptnr_test" },
    });
    const res = await postNumberTransition(req({ to }), "can_1", db, "n5", TEST_CTX);
    assertEquals(res.status, 409, `${from} -> ${to} must stay illegal — canceled is forever`);
  }
});
