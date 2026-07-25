// KYC chain, cards 39-42.
//
// 39: a run returns a result THROUGH the adapter; partner attestation carries
//     a trust level. 40: sims force approve/deny. 41: OFAC screens on EVERY
//     path — the first enforcing floor control: no trust level, no simulation
//     override, no provider choice gets around it. 42: alloy, socure and
//     middesk all work through the one adapter.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { postVerification } from "./kyc.ts";
import { type Any, req, stubApiDb, TEST_CTX } from "./test_helpers.ts";

const ENTITY = { id: "ent_1", type: "person", status: "active", name: "Ada Member" };
const SDN_ENTITY = { id: "ent_bad", type: "person", status: "active", name: "SDN TEST SUBJECT" };

function kycDb(entity: Record<string, unknown>) {
  return stubApiDb({ row: entity });
}
const controlRows = (inserts: { table: string; row: Any }[]) =>
  inserts.filter((i) => i.table === "control_result").map((i) => ({ id: i.row.control_id, d: i.row.decision }));

// -------------------------------------------------------------- 39: adapter

Deno.test("a KYC run returns a result through the adapter", async () => {
  const { db, inserts } = kycDb(ENTITY);
  const res = await postVerification(req({}), "ent_1", db, "k1", TEST_CTX);
  assertEquals(res.status, 201);
  const b = await res.json();
  assertEquals(b.provider, "alloy", "default provider");
  assertEquals(b.status, "approved");
  assert(String(b.id).startsWith("ver_"));
  const row = inserts.find((i) => i.table === "verification")?.row;
  assertEquals(row?.status, "approved");
  assertEquals(row?.provider, "alloy");
});

Deno.test("a partner attestation records its trust level", async () => {
  const { db, inserts } = kycDb(ENTITY);
  const res = await postVerification(
    req({ attestation: { partner: "fintech-x", trust_level: "full" } }),
    "ent_1",
    db,
    "k2",
    TEST_CTX,
  );
  assertEquals(res.status, 201);
  const b = await res.json();
  assertEquals(b.trust_level, "full");
  assertEquals(b.status, "approved");
  assertEquals(inserts.find((i) => i.table === "verification")?.row.trust_level, "full");
});

Deno.test("an unknown trust level is refused", async () => {
  const { db } = kycDb(ENTITY);
  const res = await postVerification(
    req({ attestation: { partner: "fintech-x", trust_level: "absolute" } }),
    "ent_1",
    db,
    "k3",
    TEST_CTX,
  );
  assertEquals(res.status, 400);
});

// ----------------------------------------------------------------- 40: sims

Deno.test("simulations force approve and deny", async () => {
  for (const [simulate, expected] of [["approve", "approved"], ["deny", "denied"]] as const) {
    const { db } = kycDb(ENTITY);
    const res = await postVerification(req({ simulate }), "ent_1", db, "k4", TEST_CTX);
    assertEquals((await res.json()).status, expected, `simulate=${simulate}`);
  }
});

// ----------------------------------------------------- 41: always-on OFAC

Deno.test("every run leaves OFAC evidence — including clean passes", async () => {
  const { db, inserts } = kycDb(ENTITY);
  await postVerification(req({}), "ent_1", db, "k5", TEST_CTX);
  assertEquals(controlRows(inserts), [{ id: "CG-OFAC-01", d: "pass" }],
    "a screen that leaves no evidence is indistinguishable from one that never ran");
});

Deno.test("an OFAC hit denies and raises the alert", async () => {
  const { db, inserts } = kycDb(SDN_ENTITY);
  const res = await postVerification(req({}), "ent_bad", db, "k6", TEST_CTX);
  assertEquals(res.status, 201);
  const b = await res.json();
  assertEquals(b.status, "denied");
  assertEquals(b.ofac_result, "hit");
  assertEquals(controlRows(inserts), [{ id: "CG-OFAC-01", d: "reject" }]);
  assertEquals(inserts.find((i) => i.table === "bsa_alert")?.row.alert_type, "ofac");
});

Deno.test("a FULL-TRUST attestation cannot bypass the OFAC floor", async () => {
  const { db, inserts } = kycDb(SDN_ENTITY);
  const res = await postVerification(
    req({ attestation: { partner: "fintech-x", trust_level: "full" } }),
    "ent_bad",
    db,
    "k7",
    TEST_CTX,
  );
  assertEquals((await res.json()).status, "denied", "floor control beats trust level");
  assertEquals(controlRows(inserts), [{ id: "CG-OFAC-01", d: "reject" }]);
});

Deno.test("a forced approve cannot bypass the OFAC floor either", async () => {
  const { db } = kycDb(SDN_ENTITY);
  const res = await postVerification(req({ simulate: "approve" }), "ent_bad", db, "k8", TEST_CTX);
  assertEquals((await res.json()).status, "denied", "floor control beats simulation");
});

// ------------------------------------------------------------ 42: providers

Deno.test("alloy, socure and middesk all work through the one adapter", async () => {
  for (const provider of ["alloy", "socure", "middesk"]) {
    const { db, inserts } = kycDb(ENTITY);
    const res = await postVerification(req({ provider }), "ent_1", db, "k9", TEST_CTX);
    assertEquals(res.status, 201, provider);
    assertEquals((await res.json()).provider, provider);
    assertEquals(inserts.find((i) => i.table === "verification")?.row.provider, provider);
  }
});

Deno.test("an unknown provider is refused, not silently defaulted", async () => {
  const { db } = kycDb(ENTITY);
  const res = await postVerification(req({ provider: "experian" }), "ent_1", db, "k10", TEST_CTX);
  assertEquals(res.status, 400);
});
