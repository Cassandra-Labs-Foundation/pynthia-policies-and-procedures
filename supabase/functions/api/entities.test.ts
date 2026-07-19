// Entity chain, cards 19-24.
//
// 19/20 creation per type · 21 unified list + filter · 22 state machine that
// EMITS events on legal transitions and 4xxes illegal ones · 23 beneficial
// owners · 24 compliance locks that leave state intact and are logged.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { getEntities, postEntity, postEntityOwner, postEntityTransition } from "./entities.ts";
import { postAccountLock, postAccountTransition } from "./accounts.ts";
import { type Any, req, stubApiDb } from "./test_helpers.ts";

const PERSON = { type: "person", name: "Ada Member", date_of_birth: "1990-01-01" };

// ------------------------------------------------------------ 19/20: create

Deno.test("a person is created and starts PENDING", async () => {
  const { db, inserts } = stubApiDb({});
  const res = await postEntity(req(PERSON), db, "e1");
  assertEquals(res.status, 201);
  const b = await res.json();
  assertEquals(b.status, "pending");
  assertEquals(b.type, "person");
  assert(String(b.id).startsWith("ent_"));
  assertEquals(inserts.find((i) => i.table === "entity")?.row.status, "pending");
});

Deno.test("business, trust and joint all create with their required fields", async () => {
  const bodies = [
    { type: "business", name: "Acme LLC", tin: "12-3456789" },
    { type: "trust", name: "Ada Family Trust", jurisdiction: "MA" },
    { type: "joint", name: "Ada & Grace Joint" },
  ];
  for (const body of bodies) {
    const { db } = stubApiDb({});
    const res = await postEntity(req(body), db, "e2");
    assertEquals(res.status, 201, `${body.type} must create`);
    assertEquals((await res.json()).type, body.type);
  }
});

Deno.test("per-type required fields are enforced", async () => {
  const bad = [
    { type: "person", name: "No DOB" },                 // person needs date_of_birth
    { type: "business", name: "No TIN" },               // business needs tin
    { type: "trust", name: "No Jurisdiction" },         // trust needs jurisdiction
    { type: "llc", name: "Unknown Type" },              // not a type
    { name: "No Type At All" },
  ];
  for (const body of bad) {
    const { db } = stubApiDb({});
    const res = await postEntity(req(body), db, "e3");
    assertEquals(res.status, 400, JSON.stringify(body));
  }
});

// ---------------------------------------------------------------- 21: list

function listDb(rows: unknown[]) {
  const calls: { fn: string; args: unknown[] }[] = [];
  const chain: Any = {
    select: (...a: unknown[]) => (calls.push({ fn: "select", args: a }), chain),
    eq: (...a: unknown[]) => (calls.push({ fn: "eq", args: a }), chain),
    lt: (...a: unknown[]) => (calls.push({ fn: "lt", args: a }), chain),
    order: (...a: unknown[]) => (calls.push({ fn: "order", args: a }), chain),
    limit: (...a: unknown[]) => (calls.push({ fn: "limit", args: a }), chain),
    then: (res: (v: unknown) => unknown) => res({ data: rows, error: null }),
  };
  const db: Any = { schema: () => ({ from: () => chain }) };
  return { db, calls };
}

Deno.test("the unified list returns mixed types and filters by type", async () => {
  const { db, calls } = listDb([]);
  await getEntities(new Request("https://x/entities?type=business"), db, "e4");
  assertEquals(
    calls.filter((c) => c.fn === "eq").map((c) => `${c.args[0]}=${c.args[1]}`),
    ["type=business"],
  );
  const { db: db2, calls: c2 } = listDb([]);
  await getEntities(new Request("https://x/entities"), db2, "e5");
  assertEquals(c2.filter((c) => c.fn === "eq").length, 0, "no filter -> mixed types");
});

Deno.test("an unknown type filter is refused", async () => {
  const { db } = listDb([]);
  const res = await getEntities(new Request("https://x/entities?type=llc"), db, "e6");
  assertEquals(res.status, 400);
});

// ------------------------------------------------------- 22: state machine

Deno.test("a legal transition updates status and emits an event", async () => {
  const { db, inserts, updates } = stubApiDb({
    row: { id: "ent_1", type: "person", status: "pending", name: "Ada" },
  });
  const res = await postEntityTransition(req({ to: "active" }), "ent_1", db, "e7");
  assertEquals(res.status, 200);
  assertEquals((await res.json()).status, "active");
  assertEquals(updates.find((u) => u.table === "entity")?.patch.status, "active");
  const evt = inserts.find((i) => i.table === "event");
  assertEquals(evt?.row.code, "entity.active");
  assertEquals(evt?.row.resource_id, "ent_1");
});

Deno.test("an illegal transition is a 409 and emits nothing", async () => {
  const { db, inserts } = stubApiDb({
    row: { id: "ent_1", type: "person", status: "archived", name: "Ada" },
  });
  const res = await postEntityTransition(req({ to: "active" }), "ent_1", db, "e8");
  assertEquals(res.status, 409);
  assertEquals((await res.json()).type, "invalid_state");
  assertEquals(inserts.filter((i) => i.table === "event").length, 0);
});

Deno.test("the machine walks pending -> active -> disabled -> archived", async () => {
  const legal: [string, string][] = [
    ["pending", "active"],
    ["active", "disabled"],
    ["disabled", "active"],
    ["disabled", "archived"],
    ["active", "archived"],
  ];
  for (const [from, to] of legal) {
    const { db } = stubApiDb({ row: { id: "e", type: "person", status: from } });
    const res = await postEntityTransition(req({ to }), "e", db, "e9");
    assertEquals(res.status, 200, `${from} -> ${to} must be legal`);
  }
  const illegal: [string, string][] = [
    ["archived", "active"],
    ["archived", "disabled"],
    ["pending", "archived"],
  ];
  for (const [from, to] of illegal) {
    const { db } = stubApiDb({ row: { id: "e", type: "person", status: from } });
    const res = await postEntityTransition(req({ to }), "e", db, "e10");
    assertEquals(res.status, 409, `${from} -> ${to} must be illegal`);
  }
});

// -------------------------------------------------------------- 23: owners

Deno.test("a business records a 25% beneficial owner", async () => {
  const { db, updates } = stubApiDb({
    row: { id: "ent_biz", type: "business", status: "active", owners: [] },
  });
  const res = await postEntityOwner(
    req({ owner_entity_id: "ent_1", ownership_percent: 25 }),
    "ent_biz",
    db,
    "e11",
  );
  assertEquals(res.status, 200);
  const owners = updates.find((u) => u.table === "entity")?.patch.owners as Any;
  assertEquals(owners, [{ entity_id: "ent_1", percent: 25 }]);
});

Deno.test("a person cannot have beneficial owners", async () => {
  const { db } = stubApiDb({ row: { id: "ent_p", type: "person", status: "active" } });
  const res = await postEntityOwner(
    req({ owner_entity_id: "ent_2", ownership_percent: 25 }),
    "ent_p",
    db,
    "e12",
  );
  assertEquals(res.status, 409);
});

Deno.test("ownership percent is bounded 0-100", async () => {
  for (const percent of [0, -5, 101, 25.55555]) {
    const { db } = stubApiDb({ row: { id: "b", type: "business", status: "active", owners: [] } });
    const res = await postEntityOwner(
      req({ owner_entity_id: "ent_2", ownership_percent: percent }),
      "b",
      db,
      "e13",
    );
    assertEquals(res.status, 400, `percent ${percent} must be refused`);
  }
});

// ------------------------------------------------ 24: locks leave state intact

Deno.test("a compliance lock leaves account state intact and is logged", async () => {
  const { db, inserts, updates } = stubApiDb({
    account: { id: "acct_1", status: "open", lock_type: "none" },
  });
  const res = await postAccountLock(
    req({ lock_type: "compliance", reason: "BSA review" }),
    "acct_1",
    db,
    "e14",
  );
  assertEquals(res.status, 200);
  const patch = updates.find((u) => u.table === "account")?.patch as Any;
  assertEquals(patch.lock_type, "compliance");
  assertEquals(patch.status, undefined, "a lock must NOT touch status");
  const evt = inserts.find((i) => i.table === "event");
  assertEquals(evt?.row.code, "account.locked");
  assertEquals((evt?.row.payload as Any).reason, "BSA review");
});

Deno.test("unlock restores none and is logged too", async () => {
  const { db, inserts } = stubApiDb({
    account: { id: "acct_1", status: "open", lock_type: "compliance" },
  });
  const res = await postAccountLock(req({ lock_type: "none" }), "acct_1", db, "e15");
  assertEquals(res.status, 200);
  assertEquals(inserts.find((i) => i.table === "event")?.row.code, "account.unlocked");
});

// --------------------------------------------- 29 (account half): transitions

Deno.test("account machine: open <-> frozen, both -> closed, closed terminal", async () => {
  const legal: [string, string][] = [["open", "frozen"], ["frozen", "open"], ["open", "closed"], ["frozen", "closed"]];
  for (const [from, to] of legal) {
    const { db, inserts } = stubApiDb({ account: { id: "a", status: from, lock_type: "none" } });
    const res = await postAccountTransition(req({ to }), "a", db, "e16");
    assertEquals(res.status, 200, `${from} -> ${to} must be legal`);
    assertEquals(inserts.find((i) => i.table === "event")?.row.code, `account.${to}`);
  }
  for (const [from, to] of [["closed", "open"], ["closed", "frozen"]] as [string, string][]) {
    const { db } = stubApiDb({ account: { id: "a", status: from, lock_type: "none" } });
    const res = await postAccountTransition(req({ to }), "a", db, "e17");
    assertEquals(res.status, 409, `${from} -> ${to} must be illegal`);
  }
});
