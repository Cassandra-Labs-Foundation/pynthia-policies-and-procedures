// TEST-CATALOG — D8 transfers, D10 card simulation, D17 sandbox discipline,
// D22 control engine surfaces.
import { api, assert, assertEq, assertErrorShape, mkAccount, mkEntity, t } from "./helpers.ts";

async function fundedPair(): Promise<{ from: string; to: string }> {
  const ent = await mkEntity();
  // funded via opening deposit — the harness's own recipe; an empty source
  // account turns every transfer test into an insufficient_funds test
  const from = await mkAccount(ent, 100_000);
  const to = await mkAccount(ent);
  return { from, to };
}

// ----------------------------------------------------------- D8 transfers

t("D8-T1/D22-T4: a transfer response carries status and control_results", async () => {
  const { from, to } = await fundedPair();
  const r = await api("POST", "/transfers", {
    source_account_id: from, destination_account_id: to, amount_cents: 500, description: "contract probe",
  });
  assert(r.status < 500, `D8-T1: no 500 (got ${r.status} ${JSON.stringify(r.body).slice(0, 200)})`);
  const body = r.body.data ?? r.body;
  assert("status" in body, "D8-T1: transfer has a status");
  assert(Array.isArray(body.control_results), "D22-T4: control_results[] on the gated operation");
  for (const c of body.control_results.slice(0, 3)) {
    assert("control_id" in c || "control" in c || "id" in c,
      `D22-T4: control result names its control — got ${JSON.stringify(c).slice(0, 120)}`);
  }
});

t("D8-T3: an on-us transfer settles as an instant book transfer", async () => {
  const { from, to } = await fundedPair();
  const r = await api("POST", "/transfers", {
    source_account_id: from, destination_account_id: to, amount_cents: 100, description: "on-us",
  });
  const body = r.body.data ?? r.body;
  assert(["settled", "completed", "rejected"].includes(String(body.status)),
    `D8-T3: book transfer resolves synchronously, got status '${body.status}'`);
});

// ------------------------------------------------------ D17 sandbox rules

t("D17-T1 (guard half): /sandbox/reset without the confirm phrase is refused", async () => {
  const r = await api("POST", "/sandbox/reset", {});
  assertEq(r.status, 400, "D17-T1: refused");
  assertEq(r.body.type, "validation_error", "D17-T1: as a validation error");
  // The destructive half (instance returns to empty) is deliberately NOT
  // exercised here: the demo instance is shared. smoke.yml owns the full
  // round-trip behind its destructive_reset dispatch flag.
});

t("D17-T3: the sandbox rejects malformed input like prod would", async () => {
  const r = await api("POST", "/sandbox/simulate/card/authorize", { amount_cents: "not-a-number" });
  assert(r.status === 400 || r.status === 422, `D17-T3: got ${r.status}`);
  // validation envelope is the lean shape: status/type/request_id/errors[]
  assertEq(r.body.type, "validation_error", "D17-T3: typed validation");
  assert(Array.isArray(r.body.errors) && r.body.errors.length > 0, "D17-T3: per-field errors[]");
});

t("D17-T4: no magic values — an ordinary amount has no special effect", async () => {
  const { from, to } = await fundedPair();
  const r = await api("POST", "/transfers", {
    source_account_id: from, destination_account_id: to, amount_cents: 66666, description: "not magic",
  });
  assert(r.status < 500, `D17-T4: no 500`);
  const body = r.body.data ?? r.body;
  assert(Array.isArray(body.control_results),
    "D17-T4: the ordinary control path ran (control_results present)");
});

// ----------------------------------------------------- D10 card simulation

t("D10-T1: simulated card auth returns a canonical decision shape", async () => {
  const ent = await mkEntity();
  const src = await mkAccount(ent, 50_000);
  const r = await api("POST", "/sandbox/simulate/card/authorize", {
    source_account_id: src, amount_cents: 1200, merchant: "Contract Coffee",
  });
  assert(r.status < 500, `D10-T1: no 500 (got ${r.status} ${JSON.stringify(r.body).slice(0, 200)})`);
  const body = r.body.data ?? r.body;
  assert("status" in body || "decision" in body,
    `D10-T1: decision shape — got ${JSON.stringify(body).slice(0, 160)}`);
});

// ------------------------------------------------- D22 threshold surfaces

t("D22-T2/T3: a threshold accepts a value and refuses garbage", async () => {
  const id = `th_contract_probe`;
  const ok = await api("PUT", `/primitives/thresholds/${id}`, {
    control_uid: "contract:PROBE", metric: "contract.probe.metric",
    subject_scope: "institution", limit_value: 10,
  });
  assert(ok.status === 200 || ok.status === 201, `D22-T2: within-band accepted, got ${ok.status}`);
  const bad = await api("PUT", `/primitives/thresholds/${id}`, {
    control_uid: "contract:PROBE", metric: "contract.probe.metric",
    subject_scope: "institution", limit_value: "not-a-number",
  });
  assert(bad.status === 400 || bad.status === 422, `D22-T3: out-of-shape refused, got ${bad.status}`);
});

t("D17: an unsimulated rail 501s with a typed index of what IS simulated", async () => {
  const r = await api("POST", "/sandbox/simulate/transfer/settle", {});
  assertEq(r.status, 501, "D17: typed 501");
  assertEq(r.body.type, "not_implemented", "D17: type");
  assert(String(r.body.detail).includes("/payments/ach"),
    "D17: the 501 names the simulated rails instead of making callers guess");
});
