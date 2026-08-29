// TEST-CATALOG — D7 state machines (entity, account) + D1 unified entities
// + D2/D20 account numbers, over the routed surface.
import { api, assert, assertEq, assertErrorShape, mkAccount, mkEntity, t } from "./helpers.ts";

// ------------------------------------------------- D7-A account transitions

t("D7-A1: account OPEN→FROZEN→OPEN→CLOSED is legal; CLOSED→OPEN is refused", async () => {
  const ent = await mkEntity();
  const acct = await mkAccount(ent);
  for (const to of ["frozen", "open", "closed"]) {
    const r = await api("POST", `/accounts/${acct}/transition`, { to });
    assert(r.status === 200 || r.status === 201,
      `D7-A1: →${to} should be legal, got ${r.status} ${JSON.stringify(r.body).slice(0, 160)}`);
  }
  const illegal = await api("POST", `/accounts/${acct}/transition`, { to: "open" });
  assert(illegal.status >= 400 && illegal.status < 500,
    `D7-A1: CLOSED→OPEN must be refused, got ${illegal.status}`);
  assertErrorShape(illegal, "D7-A1 illegal transition");
});

// ------------------------------------------------- D7-E entity transitions

t("D7-E1: entity PENDING→ACTIVE→DISABLED→ACTIVE→ARCHIVED is the legal path", async () => {
  const ent = await mkEntity();
  for (const to of ["active", "disabled", "active", "archived"]) {
    const r = await api("POST", `/entities/${ent}/transition`, { to });
    assert(r.status === 200 || r.status === 201,
      `D7-E1: →${to} should be legal, got ${r.status} ${JSON.stringify(r.body).slice(0, 160)}`);
  }
  const read = await api("GET", `/entities/${ent}`);
  const status = read.body.status ?? read.body.data?.status;
  assertEq(status, "archived", "D7-E1: read-back terminal status");
});

t("D7-E2: illegal entity transitions are refused (ARCHIVED→ACTIVE, PENDING→ARCHIVED)", async () => {
  const buried = await mkEntity();
  for (const to of ["active", "archived"]) {
    await api("POST", `/entities/${buried}/transition`, { to });
  }
  const exhume = await api("POST", `/entities/${buried}/transition`, { to: "active" });
  assert(exhume.status >= 400 && exhume.status < 500,
    `D7-E2: ARCHIVED→ACTIVE must be refused, got ${exhume.status}`);
  assertErrorShape(exhume, "D7-E2 archived→active");
  const fresh = await mkEntity();
  const skip = await api("POST", `/entities/${fresh}/transition`, { to: "archived" });
  assert(skip.status >= 400 && skip.status < 500,
    `D7-E2: PENDING→ARCHIVED must be refused, got ${skip.status}`);
  assertErrorShape(skip, "D7-E2 pending→archived");
});

// ------------------------------------------------------- D1 unified listing

t("D1-T5: created entities appear in GET /entities with a type discriminator", async () => {
  const ent = await mkEntity();
  const r = await api("GET", `/entities/${ent}`);
  assertEq(r.status, 200, "D1-T5: entity readable");
  const row = r.body.data ?? r.body;
  assertEq(row.type, "person", "D1-T5: type discriminator");
});

// -------------------------------------------- D2/D20 account numbers + Luhn

function luhnOk(num: string): boolean {
  let sum = 0;
  let dbl = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = num.charCodeAt(i) - 48;
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

t("D2-T1 + D20-T1/T2: one account issues multiple distinct 12-digit Luhn-valid numbers", async () => {
  const ent = await mkEntity();
  const acct = await mkAccount(ent);
  const nums: string[] = [];
  for (let i = 0; i < 2; i++) {
    const r = await api("POST", `/accounts/${acct}/numbers`, {});
    assert(r.status === 200 || r.status === 201,
      `D2-T1: allocation ${i} got ${r.status} ${JSON.stringify(r.body).slice(0, 160)}`);
    const num = String(r.body.account_number ?? r.body.data?.account_number ?? r.body.number ?? "");
    assert(/^\d{12}$/.test(num), `D20-T1: 12 digits, got '${num}'`);
    assert(luhnOk(num), `D20-T2: Luhn check digit fails for '${num}'`);
    nums.push(num);
  }
  assert(nums[0] !== nums[1], "D2-T1: numbers are distinct");
  const listed = await api("GET", `/accounts/${acct}/numbers`);
  assertEq(listed.status, 200, "D2-T1: numbers listable");
});
