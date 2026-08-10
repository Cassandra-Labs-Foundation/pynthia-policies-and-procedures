// ONE TEST PER CONTROL — THE LIVE TIER.
//
//   deno run --allow-all supabase/functions/drill/controls_live_run.ts
//   deno run --allow-all supabase/functions/drill/controls_live_run.ts --policy cash
//   deno run --allow-all supabase/functions/drill/controls_live_run.ts --check
//
// Same catalogue, same firers, same grader as the hermetic tier — but the
// database is the REAL project. This is the tier the hermetic fake cannot
// stand in for: real schema, real constraints, real triggers, real PostgREST
// column behavior. A control green hermetically and red here is a
// fake-vs-real defect by definition (the grader is shared, so nothing else
// can explain the diff).
//
// Isolation model: the hermetic tier gets a fresh institution per control;
// live re-seeds converge instead — the clock is frozen and UUIDs are seeded,
// so ids are deterministic and every upsert lands on the same rows run after
// run. Observation is scoped to THE RUN by the recording wrapper (live_db.ts),
// never by reading the accumulated database back.
//
// The ledger stays fake here (mkBlnk): this tier tests control writers
// against the real database, not money movement — the harness owns live
// money.

import { makeLiveDb, materializeSeeds } from "./live_db.ts";
import { ACTORS } from "./drill.ts";
import { seedInstitution } from "./cases.ts";
import { type FireEnv } from "./firers.ts";
import { type ControlTest, fire, gradeControl, loadCatalogue } from "./controls_grading.ts";

const ROOT = new URL("../../../../", import.meta.url).pathname;

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
  const polIdx = Deno.args.indexOf("--policy");
  const policyFilter = polIdx >= 0 ? Deno.args[polIdx + 1] : null;

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (source .env.local)");
    Deno.exit(1);
  }

  // UNFROZEN on purpose: the hermetic tier freezes clock and UUIDs for
  // byte-identical baselines; live, frozen ids collide with prior runs'
  // rows (23505) and a frozen clock disagrees with server-side now(), so
  // cadence sweeps grade wrongly. Live runs use real time and real ids —
  // rows accumulate per run, which the sim schema exists to absorb.
  const { controls: all, scope, knownTables } = await loadCatalogue();
  const controls = policyFilter ? all.filter((c: Any) => c.policy === policyFilter) : all;

  const results: ControlTest[] = [];
  // run-unique counter base: the hermetic tier's counter restarts at 0 every
  // run, which is fine against a fresh fake but makes every run's fixture ids
  // collide with the last run's rows on a live database (holds already
  // released, records already disposed — convergence whack-a-mole). A random
  // base gives each run fresh fixtures; the sim/core drill rows accumulate,
  // which the demo project absorbs.
  let counter = Math.floor(Math.random() * 1_000_000) * 1000;
  let done = 0;

  const debug = Deno.env.get("DRILL_DEBUG");
  for (const c of controls) {
    // names the control BEFORE it fires, so a hang identifies itself — a
    // stalled run otherwise leaves no trace of where it stopped
    if (debug) console.error(`  [ctl] ${c.policy}:${c.control_id}`);
    // One recording scope per control — the live db is shared, the OBSERVATION
    // is not. Convergent ids make cross-control and cross-run writes collide
    // into the same rows instead of accumulating garbage.
    const dbx = makeLiveDb(url, key);
    const env: FireEnv = {
      db: dbx.client, rows: dbx.rows, cfg: mkBlnk(500_000_00),
      ctx: ACTORS.ops, actors: ACTORS, n: () => ++counter,
    };
    // deno-lint-ignore no-explicit-any
    await Promise.resolve(seedInstitution(env as any));
    // the fake reads its own store; the live database must be GIVEN the seeds
    // — ONCE per run: they are identical for every control, and materializing
    // them 333 times over the network was the whole runtime
    if (done === 0) {
      const seedFailures = await materializeSeeds(dbx.raw, dbx.rows);
      if (seedFailures.length) {
        console.error(`  seed rows the live schema refused (${seedFailures.length}):`);
        for (const f of [...new Set(seedFailures)].slice(0, 10)) console.error(`    ${f}`);
      }
    }

    const rules = (c.control_rules ?? []).filter((r: Any) => r.trigger_event);
    const triggers = [...new Set(rules.map((r: Any) => r.trigger_event))] as string[];

    let blocked: string | undefined;
    let firePath = "none";

    if (triggers.length === 0) {
      blocked = "catalogue entry declares no trigger event";
    } else {
      for (const t of triggers) {
        if (debug) console.error(`  [fire] ${t}`);
        try {
          const out = await fire(t, `${c.policy}:${c.control_id}`, env);
          firePath = out.firePath !== "none" ? out.firePath : firePath;
          if (out.blocked && !blocked) blocked = out.blocked;
        } catch (e) {
          if (!blocked) blocked = `firing '${t}' threw: ${String(e).slice(0, 160)}`;
        }
      }
    }

    results.push(gradeControl(c, dbx.rows, blocked, firePath, knownTables, scope));
    done++;
    if (done % 25 === 0) console.error(`  ...${done}/${controls.length}`);
  }

  const green = results.filter((r) => r.status === "green");
  const red = results.filter((r) => r.status === "red");

  // THE DIFF IS THE FINDING: hermetic-green controls that are live-red are
  // fake-vs-real defects; each one names a place the fake lied.
  const hermetic = JSON.parse(
    await Deno.readTextFile(`${ROOT}control-tests.json`).catch(() => '{"results":[]}'),
  );
  const hermeticGreen = new Set(
    (hermetic.results ?? []).filter((r: ControlTest) => r.status === "green").map((
      r: ControlTest,
    ) => r.uid),
  );
  const fakeVsReal = results.filter((r) => r.status === "red" && hermeticGreen.has(r.uid));

  const doc = {
    meta: {
      generator: "supabase/functions/drill/controls_live_run.ts",
      clock: "unfrozen (live)",
      policy_filter: policyFilter,
      what_this_is:
        "The hermetic per-control tests re-run against the REAL database. " +
        "A hermetic-green/live-red control is a fake-vs-real defect.",
    },
    summary: {
      ran: results.length,
      green: green.length,
      red: red.length,
      in_scope_green: results.filter((r) => !r.scoped_out && r.status === "green").length,
      in_scope_red: results.filter((r) => !r.scoped_out && r.status === "red").length,
      fake_vs_real_defects: fakeVsReal.map((r) => ({ uid: r.uid, blocked_on: r.blocked_on })),
    },
    results,
  };

  if (checkOnly) {
    const prev = JSON.parse(
      await Deno.readTextFile(`${ROOT}control-tests-live.json`).catch(() => "null"),
    );
    if (!prev) {
      console.error("no control-tests-live.json; run without --check first");
      Deno.exit(1);
    }
    const prevGreen = new Set(
      prev.results.filter((r: ControlTest) => r.status === "green").map((r: ControlTest) => r.uid),
    );
    const regressed = results.filter((r) => r.status === "red" && prevGreen.has(r.uid));
    if (regressed.length) {
      console.error("LIVE CONTROL TEST REGRESSION:");
      for (const r of regressed) console.error(`  - ${r.uid}: green -> red (${r.blocked_on})`);
      Deno.exit(1);
    }
    console.log(`live control tests --check OK — ${green.length} green / ${red.length} red`);
    return;
  }

  if (!policyFilter) {
    await Deno.writeTextFile(`${ROOT}control-tests-live.json`, JSON.stringify(doc, null, 2) + "\n");
  }
  console.log(
    `LIVE: ${doc.summary.in_scope_green} GREEN / ${doc.summary.in_scope_red} RED in scope` +
      (policyFilter ? `  (policy ${policyFilter})` : ""),
  );
  if (fakeVsReal.length) {
    console.log(`\nFAKE-VS-REAL DEFECTS (hermetic green, live red): ${fakeVsReal.length}`);
    for (const r of fakeVsReal) console.log(`  - ${r.uid}: ${r.blocked_on}`);
  } else {
    console.log("\nno fake-vs-real defects in this run");
  }
}

await main();
