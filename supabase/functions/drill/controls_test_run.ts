// ONE TEST PER CONTROL — all 316.
//
//   deno run --allow-all supabase/functions/drill/controls_test_run.ts
//   deno run --allow-all supabase/functions/drill/controls_test_run.ts --check
//
// Every control in controls.json declares trigger_event -> produced_events.
// That IS the specification, so every test is the same shape:
//
//     fire the control's trigger through the API
//     assert its produced_events appear in the event log
//
// A control whose subsystem does not exist has no firer, goes RED, and the red
// line names the trigger that needs a writer. RED IS THE BACKLOG — these are
// not skipped, not pending, and never pass vacuously.

import { makeDrillDb } from "./fake_db.ts";
import { ACTORS, FROZEN_NOW, freezeClock, restoreClock, seedRandom, seedUUID, restoreUUID } from "./drill.ts";
import { seedInstitution } from "./cases.ts";
import {
  FIRERS, fireViaAttestation, fireViaObligation, fireViaThreshold, fireViaWorkItem,
  TIMER_RE, type FireEnv,
} from "./firers.ts";

const ROOT = new URL("../../../", import.meta.url).pathname;

// deno-lint-ignore no-explicit-any
type Any = any;

interface ControlTest {
  uid: string;
  policy: string;
  control_id: string;
  title: string;
  status: "green" | "red";
  /** produced events the control declares */
  expected: string[];
  /** of those, which actually appeared */
  observed: string[];
  triggers: string[];
  fire_path?: string;
  scoped_out?: boolean;
  scope_reason?: string;
  required_inputs?: string[];
  inputs_supplied?: string[];
  inputs_unverifiable?: string[];
  /** why it is red */
  blocked_on?: string;
}

function mkBlnk(balance: number): Any {
  return {
    apiUrl: "https://blnk.drill", apiKey: "k",
    fetchFn: (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const payload = url.includes("/balances/")
        ? { balance, inflight_balance: 0 }
        : { transaction_id: "txn", reference: "ref", status: "APPLIED" };
      return Promise.resolve(new Response(JSON.stringify(payload), {
        headers: { "content-type": "application/json" },
      }));
    },
  };
}

let firePath = "none";

/** Choose how to fire a trigger, or report that nothing can. */
async function fire(
  code: string, uid: string, env: FireEnv,
): Promise<string | null> {
  if (FIRERS[code]) {
    firePath = "real_writer";
    await FIRERS[code](env, uid);
    return null;
  }
  if (TIMER_RE.test(code)) {
    firePath = "obligation_cadence";
    await fireViaObligation(code, uid, env);
    return null;
  }
  // Generic shapes. These are the primitives doing their job — a control whose
  // trigger is "something opened / was requested / was received" is served by
  // the work-item register regardless of which policy it belongs to.
  if (/\.(opened|started|completed|closed|resolved|requested|proposed|submitted|decided|received|presented|issued|sent|published|delivered|reported|filed|notified|acknowledged|scheduled|initiated|drafted|assigned)$/.test(code)) {
    firePath = "generic_echo";
    await fireViaWorkItem(code, uid, env);
    return null;
  }
  if (/\.(breached|detected|flagged|failed|exceeded|warning|identified)$/.test(code)) {
    firePath = "generic_echo";
    await fireViaThreshold(code, uid, env);
    return null;
  }
  if (/\.(recorded|logged|updated|changed|created|verified|applied|approved|attested|confirmed|reviewed|declared|posted|activated|expired|hired|separated|blocked)$/.test(code)) {
    firePath = "generic_echo";
    await fireViaAttestation(code, uid, env);
    return null;
  }
  return `no writer for trigger '${code}'`;
}

async function main() {
  const checkOnly = Deno.args.includes("--check");
  freezeClock();
  seedRandom(20260719);
  seedUUID();

  // Which input objects are CHECKABLE. An input like `bsa_alert.alert_type`
  // names a real table and can be verified; one like `governance.bsa_officer_id`
  // names an abstract namespace with no table behind it and cannot. Grading
  // against un-checkable inputs would fail every control for a reason that says
  // nothing about the control, so they are reported as UNVERIFIABLE instead of
  // counted either way.
  const schemaSql = await Deno.readTextFile(`${ROOT}supabase/migrations/20260702000100_core_schema.sql`);
  const knownTables = new Set<string>(
    [...schemaSql.matchAll(/create table if not exists "core"\."([a-z_]+)"/g)].map((m) => m[1]),
  );
  for (const t of [
    "cash_transaction", "ctr_filing", "obligation", "obligation_completion",
    "work_item", "threshold", "threshold_observation", "attestation",
    "loan_party", "adverse_action_notice", "payment_approval", "client_limit",
    // Adding `cda` here is what makes the cda controls' declared inputs
    // CHECKABLE instead of unverifiable. Before it, all 60-odd cda.* inputs
    // graded as un-checkable and every cda control could go green on produced
    // events alone. See the instrument caveat in BLUEPRINT §5h: the check is
    // object-granular, so this binds `a cda row must exist` and not the
    // individual field.
    "cda",
  ]) knownTables.add(t);

  // Scope marks live in a checked-in file and are applied HERE, so regenerating
  // this artifact cannot silently drop the scoping decision. Re-applying them by
  // hand afterwards was fragile: the first person to regenerate would lose the
  // decision and it would look like a clean run rather than data loss.
  const scopeDoc = JSON.parse(
    await Deno.readTextFile(`${ROOT}control-scope.json`).catch(() => '{"scope":{}}'),
  );
  const scope: Record<string, { verdict: string; why: string }> = scopeDoc.scope ?? {};

  const catalogue = JSON.parse(await Deno.readTextFile(`${ROOT}controls.json`));
  // dedupe replicas (SC-01/SC-02 appear once per referencing policy)
  const seen = new Set<string>();
  const controls = catalogue.controls.filter((c: Any) => {
    const k = `${c.policy}:${c.control_id}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const results: ControlTest[] = [];
  let counter = 0;

  for (const c of controls) {
    // Fresh institution per control: 316 tests sharing one ledger would make
    // every result depend on execution order, and an order-dependent red is
    // not a specification.
    const dbx = makeDrillDb();
    const env: FireEnv = {
      db: dbx.client, rows: dbx.rows, cfg: mkBlnk(500_000_00),
      ctx: ACTORS.ops, actors: ACTORS, n: () => ++counter,
    };
    // deno-lint-ignore no-explicit-any
    seedInstitution(env as any);

    const rules = (c.control_rules ?? []).filter((r: Any) => r.trigger_event);
    const triggers = [...new Set(rules.map((r: Any) => r.trigger_event))] as string[];
    const expected = [
      ...new Set(rules.flatMap((r: Any) => r.produced_events ?? [])),
    ] as string[];
    // A control declares required_inputs; a test that ignores them grades the
    // plumbing rather than the control. Green requires the inputs to have been
    // SUPPLIED — i.e. the run wrote a row in the object each input names.
    const requiredInputs = [
      ...new Set(rules.flatMap((r: Any) => r.required_inputs ?? [])),
    ] as string[];

    let blocked: string | undefined;
    firePath = "none";

    if (triggers.length === 0) {
      blocked = "catalogue entry declares no trigger event";
    } else {
      for (const t of triggers) {
        try {
          const why = await fire(t, `${c.policy}:${c.control_id}`, env);
          if (why && !blocked) blocked = why;
        } catch (e) {
          if (!blocked) blocked = `firing '${t}' threw: ${String(e).slice(0, 120)}`;
        }
      }
    }

    const emitted = new Set<string>(
      (dbx.rows["core.event"] ?? []).concat(dbx.rows["sim.event"] ?? []).map((e: Any) => String(e.code)),
    );
    const observed = expected.filter((e) => emitted.has(e));

    // which declared inputs were actually supplied by the run
    const touchedObjects = new Set<string>();
    for (const [k, rs] of Object.entries(dbx.rows)) {
      if (!rs.length) continue;
      touchedObjects.add(k.split(".")[1]);
    }
    const checkable = requiredInputs.filter((i) => knownTables.has(i.split(".")[0]));
    const unverifiable = requiredInputs.filter((i) => !knownTables.has(i.split(".")[0]));
    const inputsSupplied = checkable.filter((i) => touchedObjects.has(i.split(".")[0]));
    const inputsMissing = checkable.filter((i) => !touchedObjects.has(i.split(".")[0]));

    const green = expected.length > 0 &&
      observed.length === expected.length &&
      inputsMissing.length === 0 &&
      !blocked;

    if (!green && !blocked) {
      blocked = expected.length === 0
        ? "control declares no produced events"
        : observed.length !== expected.length
        ? `produced ${observed.length}/${expected.length}: missing ${
          expected.filter((e) => !emitted.has(e)).slice(0, 4).join(", ")
        }`
        : `inputs not supplied: ${inputsMissing.slice(0, 4).join(", ")}`;
    }

    const sc = scope[`${c.policy}:${c.control_id}`];
    results.push({
      scoped_out: sc ? sc.verdict !== "in" : false,
      scope_reason: sc?.why ?? "unclassified",
      uid: `${c.policy}:${c.control_id}`,
      policy: c.policy,
      control_id: c.control_id,
      title: c.title,
      status: green ? "green" : "red",
      expected,
      observed,
      triggers,
      required_inputs: requiredInputs,
      inputs_supplied: inputsSupplied,
      inputs_unverifiable: unverifiable,
      fire_path: firePath,
      blocked_on: green ? undefined : blocked,
    });
  }

  restoreClock();
  restoreUUID();

  const green = results.filter((r) => r.status === "green");
  const red = results.filter((r) => r.status === "red");

  // group the red by WHY, because that grouping is the build order
  const byReason: Record<string, number> = {};
  for (const r of red) {
    const key = (r.blocked_on ?? "").startsWith("no writer for trigger")
      ? `no writer: ${(r.blocked_on ?? "").split("'")[1]?.split(".")[0] ?? "?"}.*`
      : (r.blocked_on ?? "").startsWith("produced")
      ? "trigger fires but produced events missing"
      : (r.blocked_on ?? "").startsWith("firing")
      ? "firer threw"
      : r.blocked_on ?? "?";
    byReason[key] = (byReason[key] ?? 0) + 1;
  }

  const doc = {
    meta: {
      generator: "supabase/functions/drill/controls_test_run.ts",
      seed: 20260719,
      frozen_clock: FROZEN_NOW,
      what_this_is:
        "One test per control, derived from the control's own spec: fire its " +
        "trigger_event, assert its produced_events appear. RED IS THE BACKLOG.",
    },
    summary: {
      total: results.length,
      // IN-SCOPE is the progress metric; scoped_out stays visible beside it so
      // the shape of the whole obligation remains legible.
      in_scope: results.filter((r) => !r.scoped_out).length,
      scoped_out: results.filter((r) => r.scoped_out).length,
      in_scope_green: results.filter((r) => !r.scoped_out && r.status === "green").length,
      in_scope_red: results.filter((r) => !r.scoped_out && r.status === "red").length,
      scope_note:
        "Scoped-out controls are real obligations discharged by people and paperwork. " +
        "This system covers the technical controls; the organisational ones are not claimed.",
      green: green.length,
      red: red.length,
      pct_green: Math.round((green.length / results.length) * 1000) / 10,
      red_by_reason: Object.fromEntries(
        Object.entries(byReason).sort((a, b) => b[1] - a[1]),
      ),
      inputs_unverifiable_total: results.reduce(
        (n, r) => n + (r.inputs_unverifiable?.length ?? 0), 0,
      ),
      green_by_fire_path: Object.fromEntries(
        Object.entries(
          green.reduce((m: Record<string, number>, r) => {
            m[r.fire_path ?? "?"] = (m[r.fire_path ?? "?"] ?? 0) + 1;
            return m;
          }, {}),
        ).sort((a, b) => b[1] - a[1]),
      ),
      green_by_policy: Object.fromEntries(
        Object.entries(
          green.reduce((m: Record<string, number>, r) => {
            m[r.policy] = (m[r.policy] ?? 0) + 1;
            return m;
          }, {}),
        ).sort((a, b) => b[1] - a[1]),
      ),
    },
    results,
  };

  if (checkOnly) {
    const prev = JSON.parse(await Deno.readTextFile(`${ROOT}control-tests.json`).catch(() => "null"));
    if (!prev) {
      console.error("no control-tests.json; run without --check first");
      Deno.exit(1);
    }
    const prevGreen = new Set(
      prev.results.filter((r: ControlTest) => r.status === "green").map((r: ControlTest) => r.uid),
    );
    const regressed = results.filter((r) => r.status === "red" && prevGreen.has(r.uid));
    if (regressed.length) {
      console.error("CONTROL TEST REGRESSION:");
      for (const r of regressed) console.error(`  - ${r.uid}: green -> red (${r.blocked_on})`);
      Deno.exit(1);
    }
    console.log(`control tests --check OK — ${green.length} green / ${red.length} red`);
    return;
  }

  await Deno.writeTextFile(`${ROOT}control-tests.json`, JSON.stringify(doc, null, 2) + "\n");
  console.log(
    `IN-SCOPE: ${doc.summary.in_scope_green} GREEN / ${doc.summary.in_scope_red} RED ` +
    `(of ${doc.summary.in_scope})   [+${doc.summary.scoped_out} scoped out, not claimed]`,
  );
  console.log("\nred, grouped by what is missing:");
  for (const [k, v] of Object.entries(doc.summary.red_by_reason)) {
    console.log(`  ${String(v).padStart(4)}  ${k}`);
  }
  console.log("\nGREEN BY FIRE PATH — how the green was obtained:");
  for (const [k, v] of Object.entries(doc.summary.green_by_fire_path)) {
    console.log(`  ${String(v).padStart(4)}  ${k}`);
  }
  console.log("\ngreen by policy:");
  for (const [k, v] of Object.entries(doc.summary.green_by_policy)) {
    console.log(`  ${String(v).padStart(4)}  ${k}`);
  }
}

if (import.meta.main) await main();
