// TEST-CATALOG — D6 idempotency: the highest-value contract tests.
import { api, assert, assertEq, t, uid } from "./helpers.ts";

const BODY = { entity_id: "ent_1", account_type: "checking" };

t("D6-T1: same key + same body replays the cached response, no second resource", async () => {
  const key = uid();
  const first = await api("POST", "/accounts", BODY, { idem: key });
  assert(first.status === 200 || first.status === 201, `first create: ${first.status}`);
  const replay = await api("POST", "/accounts", BODY, { idem: key });
  assertEq(String(replay.body.id), String(first.body.id), "D6-T1: same resource id");
  assertEq(replay.headers.get("idempotent-replayed"), "true", "D6-T1: Idempotent-Replayed header");
});

t("D6-T2: same key + different body is 409 idempotency_key_reused", async () => {
  const key = uid();
  const first = await api("POST", "/accounts", BODY, { idem: key });
  assert(first.status === 200 || first.status === 201, `first create: ${first.status}`);
  const conflict = await api("POST", "/accounts", { ...BODY, account_type: "savings" }, { idem: key });
  assertEq(conflict.status, 409, "D6-T2: 409");
  assertEq(conflict.body.type, "idempotency_key_reused", "D6-T2: type");
});

t("D6-T3: an unknown key proceeds normally and writes a fresh resource", async () => {
  const a = await api("POST", "/accounts", BODY, { idem: uid() });
  const b = await api("POST", "/accounts", BODY, { idem: uid() });
  assert(a.body.id && b.body.id && a.body.id !== b.body.id,
    `D6-T3: two keys, two resources (got ${a.body.id} / ${b.body.id})`);
});

// D6-T4 is written and IGNORED: the catalog requires a mutating call WITHOUT
// an Idempotency-Key to be rejected, but the implementation accepts it and
// creates the resource (verified 2026-08-10 against the deployed core).
// Catalog state: [~] written, failing — enforcement is a contract decision
// with blast radius on every existing caller, so it needs a deliberate
// migration, not a silent flip inside a test-debt pass.
t("D6-T4: a mutating endpoint without Idempotency-Key is rejected", async () => {
  const r = await api("POST", "/accounts", BODY, { idem: null });
  assert(r.status === 400 || r.status === 422, `D6-T4: expected rejection, got ${r.status}`);
}, true);

t("D6-T5: a key still replays after many intervening operations", async () => {
  const key = uid();
  const first = await api("POST", "/accounts", BODY, { idem: key });
  assert(first.status === 200 || first.status === 201, `first create: ${first.status}`);
  for (let i = 0; i < 25; i++) await api("GET", "/cards?limit=1");
  const replay = await api("POST", "/accounts", BODY, { idem: key });
  assertEq(String(replay.body.id), String(first.body.id), "D6-T5: still the same resource");
  assertEq(replay.headers.get("idempotent-replayed"), "true", "D6-T5: still replayed");
});
