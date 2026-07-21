// ONE TEST PER CONTROL — all 316. THE HERMETIC TIER.
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
//
// The fire dispatch and grading live in controls_grading.ts, SHARED with the
// live runner (controls_live_run.ts) — one grader for both tiers, so a
// hermetic-green/live-red diff always means a fake-vs-real defect and never a
// grading skew.

import { makeDrillDb } from "./fake_db.ts";
import {
  ACTORS, FROZEN_NOW, freezeClock, restoreClock, seedRandom, seedUUID, restoreUUID,
} from "./drill.ts";
import { seedInstitution } from "./cases.ts";
import { type FireEnv } from "./firers.ts";
import { type ControlTest, fire, gradeControl, loadCatalogue } from "./controls_grading.ts";

const ROOT = new URL("../../../", import.meta.url).pathname;

// deno-lint-ignore no-explicit-any
type Any = any;

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

async function main() {
  const checkOnly = Deno.args.includes("--check");
  freezeClock();
  seedRandom(20260719);
  seedUUID();

  const { controls, scope, knownTables } = await loadCatalogue();

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

    let blocked: string | undefined;
    let firePath = "none";

    if (triggers.length === 0) {
      blocked = "catalogue entry declares no trigger event";
    } else {
      for (const t of triggers) {
        try {
          const out = await fire(t, `${c.policy}:${c.control_id}`, env);
          firePath = out.firePath !== "none" ? out.firePath : firePath;
          if (out.blocked && !blocked) blocked = out.blocked;
        } catch (e) {
          if (!blocked) blocked = `firing '${t}' threw: ${String(e).slice(0, 120)}`;
        }
      }
    }

    results.push(gradeControl(c, dbx.rows, blocked, firePath, knownTables, scope));
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

await main();
