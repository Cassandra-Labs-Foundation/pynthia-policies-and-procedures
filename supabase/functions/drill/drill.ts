// The compliance DRILL — a synthetic institution, run end to end.
//
//   deno run --allow-all supabase/functions/drill/drill.ts          # write artifacts
//   deno run --allow-all supabase/functions/drill/drill.ts --check  # regression gate
//
// A DRILL IS NOT COVERAGE. A fire drill proves the alarm works; nobody concludes
// the building burned. This exercises the machinery against a synthetic
// institution that supplies its own configuration — registered obligations,
// configured thresholds, linked members. A real institution has supplied none of
// that, which is the entire difference between this and CROSSWALK.md, and the
// reason a drill result must never be read as a control being satisfied.
//
// Everything here writes to the `sim` schema with provenance 'simulated', which
// the core CHECK constraints make unrepresentable in `core`.
//
// DETERMINISM. The clock is frozen and the PRNG is seeded, so two runs of the
// same code produce byte-identical results. That is what makes --check a
// regression gate rather than noise: a case that passed yesterday and fails
// today is a real signal.

import { makeDrillDb, UNENFORCED, ENFORCED } from "./fake_db.ts";
import { type PartnerContext } from "../api/auth.ts";

// ---------------------------------------------------------------- determinism

/** Frozen instant. Every timestamp the handlers generate resolves to this. */
export const FROZEN_NOW = "2026-07-19T12:00:00.000Z";

const RealDate = Date;
function freezeClock() {
  const fixed = new RealDate(FROZEN_NOW).getTime();
  // A frozen clock is what makes two runs byte-identical, which is what makes
  // --check a regression gate rather than noise. `new Date()` with no argument
  // resolves to the fixed instant; every other form behaves normally so date
  // ARITHMETIC (due dates, ECOA clocks) still works.
  // deno-lint-ignore no-explicit-any
  const Frozen: any = function (this: unknown, ...args: unknown[]) {
    // deno-lint-ignore no-explicit-any
    return args.length === 0 ? new RealDate(fixed) : new (RealDate as any)(...args);
  };
  Frozen.prototype = RealDate.prototype;
  Frozen.now = () => fixed;
  Frozen.parse = RealDate.parse;
  Frozen.UTC = RealDate.UTC;
  // deno-lint-ignore no-explicit-any
  (globalThis as any).Date = Frozen;
}
function restoreClock() {
  // deno-lint-ignore no-explicit-any
  (globalThis as any).Date = RealDate;
}

/** Seeded PRNG (mulberry32). Deterministic ids without crypto.randomUUID. */
let seedState = 0x9e3779b9;
function seedRandom(seed: number) {
  seedState = seed >>> 0;
}
function rnd(): number {
  seedState |= 0;
  seedState = (seedState + 0x6d2b79f5) | 0;
  let t = Math.imul(seedState ^ (seedState >>> 15), 1 | seedState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const realUUID = crypto.randomUUID;
function seedUUID() {
  // deno-lint-ignore no-explicit-any
  (crypto as any).randomUUID = () => {
    const h = "0123456789abcdef";
    let s = "";
    for (let i = 0; i < 32; i++) s += h[Math.floor(rnd() * 16)];
    return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20,32)}`;
  };
}
function restoreUUID() {
  // deno-lint-ignore no-explicit-any
  (crypto as any).randomUUID = realUUID;
}

// ------------------------------------------------------------------- context

function ctxFor(tokenId: string, roles: string[] = [], actor = "pynthia_ops"): PartnerContext {
  return {
    tokenId,
    tokenPrefix: "cass_drill",
    // deno-lint-ignore no-explicit-any
    actorType: actor as any,
    // deno-lint-ignore no-explicit-any
    roles: roles as any,
    partnerId: null,
    instanceId: "inst_drill",
    idempotencyScope: `token:${tokenId}`,
    ownerPartnerId: "ptnr_drill",
    evidenceProvenance: "production",
  };
}

export const ACTORS = {
  ops: ctxFor("tok_ops"),
  investigator: ctxFor("tok_investigator", ["bsa_investigator"]),
  officer: ctxFor("tok_officer", ["bsa_officer"]),
  preparer: ctxFor("tok_preparer"),
  approver: ctxFor("tok_approver"),
  reviewer: ctxFor("tok_reviewer"),
  partner: { ...ctxFor("tok_partner"), actorType: "partner" as const, partnerId: "ptnr_drill" },
};

// --------------------------------------------------------------- case model

export type CaseKind = "positive" | "negative";

export interface DrillCase {
  id: string;
  /** policy-qualified uids this exercises; [] where the control is CG-* only */
  controls: string[];
  kind: CaseKind;
  what: string;
  /** returns a short outcome string; throws to fail */
  run: (env: Env) => Promise<string>;
  /** the outcome the case asserts */
  expect: string;
}

export interface Env {
  // deno-lint-ignore no-explicit-any
  db: any;
  // deno-lint-ignore no-explicit-any
  rows: Record<string, any[]>;
  // deno-lint-ignore no-explicit-any
  violations: any[];
  /** event codes fired during the run, for the inventory cross-reference */
  fired: Set<string>;
}

export interface CaseResult {
  id: string;
  controls: string[];
  kind: CaseKind;
  what: string;
  status: "drill_passed" | "drill_failed" | "drill_not_runnable";
  expected: string;
  actual: string;
  note?: string;
}

/** Reads a Response body without consuming the caller's copy. */
export async function body(res: Response): Promise<Record<string, unknown>> {
  try {
    return await res.clone().json();
  } catch {
    return {};
  }
}

export async function runCases(cases: DrillCase[], env: Env): Promise<CaseResult[]> {
  const out: CaseResult[] = [];
  for (const c of cases) {
    let status: CaseResult["status"] = "drill_passed";
    let actual = "";
    let note: string | undefined;
    try {
      actual = await c.run(env);
      if (actual !== c.expect) status = "drill_failed";
    } catch (e) {
      // A throw means the case could not execute at all — a missing writer, an
      // unreachable precondition. Distinguished from a failed assertion,
      // because "we could not run this" and "this behaved wrongly" are
      // different findings.
      status = "drill_not_runnable";
      actual = "threw";
      note = String(e).slice(0, 240);
    }
    out.push({
      id: c.id,
      controls: c.controls,
      kind: c.kind,
      what: c.what,
      status,
      expected: c.expect,
      actual,
      note,
    });
  }
  return out;
}

export { freezeClock, restoreClock, seedRandom, seedUUID, restoreUUID, makeDrillDb, UNENFORCED, ENFORCED };
