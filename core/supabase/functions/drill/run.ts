// Drill runner. Writes DRILL.md + drill.json, or checks for regressions.
//
//   deno run --allow-all supabase/functions/drill/run.ts
//   deno run --allow-all supabase/functions/drill/run.ts --check

import {
  ENFORCED, FROZEN_NOW, freezeClock, makeDrillDb, restoreClock,
  restoreUUID, runCases, seedRandom, seedUUID, UNENFORCED, type CaseResult, type Env,
} from "./drill.ts";
import { CASES, seedInstitution } from "./cases.ts";

const ROOT = new URL("../../../../", import.meta.url).pathname;
const SEED = 20260719;

async function main() {
  const checkOnly = Deno.args.includes("--check");

  freezeClock();
  seedRandom(SEED);
  seedUUID();

  const dbx = makeDrillDb();
  const env: Env = { db: dbx.client, rows: dbx.rows, violations: dbx.violations, fired: new Set() };
  seedInstitution(env);
  const results = await runCases(CASES, env);

  for (const e of env.rows["sim.event"] ?? []) env.fired.add(String(e.code));

  restoreClock();
  restoreUUID();

  const passed = results.filter((r) => r.status === "drill_passed").length;
  const failed = results.filter((r) => r.status === "drill_failed").length;
  const notRun = results.filter((r) => r.status === "drill_not_runnable").length;

  // inventory cross-reference — NOT a licence to add anything
  const inv = JSON.parse(await Deno.readTextFile(`${ROOT}crosswalk-emitted-events.json`));
  const known = new Set<string>(inv.literal.map((e: { code: string }) => e.code));
  for (const t of inv.templated ?? []) for (const c of t.expands_to) known.add(c);
  const firedKnown = [...env.fired].filter((c) => known.has(c)).sort();
  const firedUnknown = [...env.fired].filter((c) => !known.has(c)).sort();

  const doc = {
    meta: {
      generator: "supabase/functions/drill/run.ts",
      seed: SEED,
      frozen_clock: FROZEN_NOW,
      deterministic: true,
      what_this_is_not:
        "A DRILL IS NOT COVERAGE. These results describe machinery exercised against a " +
        "SYNTHETIC institution that supplied its own configuration. A real institution has " +
        "supplied none of it. Nothing here may be read as a control being satisfied. " +
        "Regulatory coverage lives in CROSSWALK.md and is measured in reachable/completable.",
    },
    summary: {
      cases: results.length,
      drill_passed: passed,
      drill_failed: failed,
      drill_not_runnable: notRun,
      negatives: results.filter((r) => r.kind === "negative").length,
      constraint_violations: env.violations.length,
      distinct_controls_touched: new Set(results.flatMap((r) => r.controls)).size,
      policies_touched: new Set(results.flatMap((r) => r.controls).map((c) => c.split(":")[0])).size,
    },
    fidelity: {
      unenforced_by_the_fake: UNENFORCED,
      enforced_by_the_fake: ENFORCED,
    },
    inventory_cross_reference: {
      note:
        "Codes fired during a DRILL are not grounds for adding anything to " +
        "crosswalk-emitted-events.json. A synthetic obligation firing audit.cycle_timer " +
        "is the drill exercising the machinery, not the core emitting the code for a real " +
        "institution. See BLUEPRINT 5c.",
      fired_and_already_in_inventory: firedKnown,
      fired_and_NOT_in_inventory: firedUnknown,
    },
    results,
  };

  if (checkOnly) {
    const prevText = await Deno.readTextFile(`${ROOT}drill.json`).catch(() => null);
    if (!prevText) {
      console.error("drill --check: no drill.json to compare against; run without --check first");
      Deno.exit(1);
    }
    const prev = JSON.parse(prevText);
    const prevById = new Map<string, CaseResult>(prev.results.map((r: CaseResult) => [r.id, r]));
    const regressions: string[] = [];
    for (const r of results) {
      const p = prevById.get(r.id);
      if (!p) continue;
      if (p.status === "drill_passed" && r.status !== "drill_passed") {
        regressions.push(`${r.id}: ${p.status} -> ${r.status} (expected ${r.expected}, got ${r.actual})`);
      }
    }
    for (const [id, p] of prevById) {
      if (!results.some((r) => r.id === id) && p.status === "drill_passed") {
        regressions.push(`${id}: case disappeared (was drill_passed)`);
      }
    }
    if (regressions.length) {
      console.error("DRILL REGRESSION:");
      for (const r of regressions) console.error(`  - ${r}`);
      Deno.exit(1);
    }
    console.log(`drill --check OK — ${passed} passed, ${failed} failed, ${notRun} not runnable`);
    return;
  }

  await Deno.writeTextFile(`${ROOT}drill.json`, JSON.stringify(doc, null, 2) + "\n");
  await Deno.writeTextFile(`${ROOT}DRILL.md`, render(doc));
  console.log(`wrote drill.json and DRILL.md`);
  console.log(`  ${passed} passed · ${failed} failed · ${notRun} not runnable`);
  console.log(`  ${doc.summary.distinct_controls_touched} controls across ${doc.summary.policies_touched} policies`);
}

// deno-lint-ignore no-explicit-any
function render(d: any): string {
  const L: string[] = [];
  const A = (s = "") => L.push(s);

  A("# DRILL — a synthetic institution, run end to end");
  A("");
  A("> ## A DRILL IS NOT COVERAGE");
  A(">");
  A("> A fire drill proves the alarm works. Nobody concludes the building burned.");
  A(">");
  A("> Everything below describes machinery exercised against a **synthetic**");
  A("> institution that supplied its own configuration — registered obligations,");
  A("> configured thresholds, linked members, transaction traffic.");
  A("> **A real institution has supplied none of it.** That difference is the whole");
  A("> reason this file and `CROSSWALK.md` disagree, and it is why reconciling them");
  A("> by raising the smaller number would be fabrication rather than reconciliation.");
  A(">");
  A("> Regulatory coverage is measured in `reachable` / `completable` and lives in");
  A("> [CROSSWALK.md](CROSSWALK.md). Nothing here may be read as a control being");
  A("> satisfied.");
  A("");
  A("## What this drill does NOT prove");
  A("");
  A("The drill runs against an in-memory stand-in, not Postgres. These guarantees");
  A("are enforced **only in the database** and are therefore **NOT proven here**:");
  A("");
  for (const u of d.fidelity.unenforced_by_the_fake) {
    A(`- **${u.what}**  `);
    A(`  ${u.why_it_matters}`);
  }
  A("");
  A(`For completeness, ${d.fidelity.enforced_by_the_fake.length} CHECK constraints ARE`);
  A("re-implemented in the fake and are exercised: " +
    d.fidelity.enforced_by_the_fake.map((c: string) => `\`${c}\``).join(", ") + ".");
  A("");
  A("## Result");
  A("");
  A(`| | |`);
  A(`|---|---:|`);
  A(`| cases | ${d.summary.cases} |`);
  A(`| \`drill_passed\` | ${d.summary.drill_passed} |`);
  A(`| \`drill_failed\` | ${d.summary.drill_failed} |`);
  A(`| \`drill_not_runnable\` | ${d.summary.drill_not_runnable} |`);
  A(`| negative cases | ${d.summary.negatives} |`);
  A(`| CHECK violations during the run | ${d.summary.constraint_violations} |`);
  A(`| distinct controls touched | ${d.summary.distinct_controls_touched} |`);
  A(`| policies touched | ${d.summary.policies_touched} |`);
  A("");
  A(`Deterministic: seed \`${d.meta.seed}\`, clock frozen at \`${d.meta.frozen_clock}\`.`);
  A("Two runs of the same code produce identical results, which is what makes");
  A("`--check` a regression gate rather than noise.");
  A("");
  A("## Cases");
  A("");
  A("| id | status | kind | controls | what |");
  A("|---|---|---|---|---|");
  for (const r of d.results) {
    const icon = r.status === "drill_passed" ? "pass" : r.status === "drill_failed" ? "**FAIL**" : "**not runnable**";
    A(`| \`${r.id}\` | ${icon} | ${r.kind} | ${r.controls.map((c: string) => `\`${c}\``).join(" ") || "—"} | ${r.what} |`);
  }
  A("");
  const bad = d.results.filter((r: CaseResult) => r.status !== "drill_passed");
  if (bad.length) {
    A("### Cases that did not pass");
    A("");
    for (const r of bad) {
      A(`**\`${r.id}\`** — ${r.what}  `);
      A(`expected \`${r.expected}\`, got \`${r.actual}\`${r.note ? `  \n  ${r.note}` : ""}`);
      A("");
    }
  }
  A("## Event codes fired");
  A("");
  A(d.inventory_cross_reference.note);
  A("");
  A(`Already in the inventory (${d.inventory_cross_reference.fired_and_already_in_inventory.length}): ` +
    (d.inventory_cross_reference.fired_and_already_in_inventory.map((c: string) => `\`${c}\``).join(", ") || "—"));
  A("");
  A(`Fired here but **NOT** in the inventory (${d.inventory_cross_reference.fired_and_NOT_in_inventory.length}): ` +
    (d.inventory_cross_reference.fired_and_NOT_in_inventory.map((c: string) => `\`${c}\``).join(", ") || "—"));
  A("");
  A("The second list is the interesting one and it stays where it is. Those codes");
  A("were fired by synthetic configuration; adding them to the inventory would");
  A("raise reachability on the strength of a drill, which is precisely the");
  A("substitution `BLUEPRINT` §5c exists to prevent.");
  A("");
  return L.join("\n");
}

if (import.meta.main) await main();
