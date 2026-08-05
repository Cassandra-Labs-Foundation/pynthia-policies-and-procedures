// Shared per-control test machinery — ONE grader for every tier.
//
// The hermetic runner (controls_test_run.ts) and the live runner
// (controls_live_run.ts) must grade IDENTICALLY or their results cannot be
// compared — and the comparison is the point: a control green on the fake and
// red on the live database is a fake-vs-real defect, found. So the fire
// dispatch and the grading logic live here, imported by both.
//
// Grading semantics (unchanged from the original hermetic runner):
//   - fire every declared trigger_event through the writers
//   - green requires ALL declared produced_events observed
//   - AND every checkable required_input actually supplied (column-token
//     containment; computed inputs may ride on event payloads)

import {
  FIRERS, fireViaAttestation, fireViaObligation, fireViaThreshold, fireViaWorkItem,
  TIMER_RE, type FireEnv,
} from "./firers.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

export interface ControlTest {
  uid: string;
  policy: string;
  control_id: string;
  title: string;
  status: "green" | "red";
  expected: string[];
  observed: string[];
  triggers: string[];
  fire_path?: string;
  scoped_out?: boolean;
  scope_reason?: string;
  required_inputs?: string[];
  inputs_supplied?: string[];
  inputs_unverifiable?: string[];
  blocked_on?: string;
}

/** Choose how to fire a trigger, or report that nothing can. */
export async function fire(
  code: string, uid: string, env: FireEnv,
): Promise<{ blocked: string | null; firePath: string }> {
  if (FIRERS[code]) {
    await FIRERS[code](env, uid);
    return { blocked: null, firePath: "real_writer" };
  }
  if (TIMER_RE.test(code)) {
    await fireViaObligation(code, uid, env);
    return { blocked: null, firePath: "obligation_cadence" };
  }
  // Generic shapes. These are the primitives doing their job — a control whose
  // trigger is "something opened / was requested / was received" is served by
  // the work-item register regardless of which policy it belongs to.
  if (/\.(opened|started|completed|closed|resolved|requested|proposed|submitted|decided|received|presented|issued|sent|published|delivered|reported|filed|notified|acknowledged|scheduled|initiated|drafted|assigned)$/.test(code)) {
    await fireViaWorkItem(code, uid, env);
    return { blocked: null, firePath: "generic_echo" };
  }
  if (/\.(breached|detected|flagged|failed|exceeded|warning|identified)$/.test(code)) {
    await fireViaThreshold(code, uid, env);
    return { blocked: null, firePath: "generic_echo" };
  }
  if (/\.(recorded|logged|updated|changed|created|verified|applied|approved|attested|confirmed|reviewed|declared|posted|activated|expired|hired|separated|blocked)$/.test(code)) {
    await fireViaAttestation(code, uid, env);
    return { blocked: null, firePath: "generic_echo" };
  }
  return { blocked: `no writer for trigger '${code}'`, firePath: "none" };
}

// A trailing plural is stripped on both sides. The corpus says
// `incident.member_notice_template` and the writer emits
// `incident.member_notices.sent`; those are the same fact and failing a
// control on the 's' would be grading the corpus. This is the ONLY
// normalisation applied — anything beyond it starts inventing synonyms.
const stem = (w: string): string =>
  w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w;
const tokens = (s: string): Set<string> =>
  new Set(s.toLowerCase().split(/[^a-z0-9]+/).filter((x) => x.length > 0).map(stem));

/**
 * Grade one control from the run's recorded rows. See the long-form comments
 * in controls_test_run.ts's history for the design rationale of the
 * column-token containment check (BLUEPRINT §5h).
 */
export function gradeControl(
  c: Any,
  rows: Record<string, Any[]>,
  blocked: string | undefined,
  firePath: string,
  knownTables: Set<string>,
  scope: Record<string, { verdict: string; why: string }>,
): ControlTest {
  const rules = (c.control_rules ?? []).filter((r: Any) => r.trigger_event);
  const triggers = [...new Set(rules.map((r: Any) => r.trigger_event))] as string[];
  const expected = [...new Set(rules.flatMap((r: Any) => r.produced_events ?? []))] as string[];
  const requiredInputs = [
    ...new Set(rules.flatMap((r: Any) => r.required_inputs ?? [])),
  ] as string[];

  const emitted = new Set<string>(
    (rows["core.event"] ?? []).concat(rows["sim.event"] ?? []).map((e: Any) => String(e.code)),
  );
  const observed = expected.filter((e) => emitted.has(e));

  const touchedObjects = new Set<string>();
  for (const [k, rs] of Object.entries(rows)) {
    if (!rs.length) continue;
    touchedObjects.add(k.split(".")[1]);
  }

  /** token sets of every populated column, table tokens folded in */
  const candidates: Set<string>[] = [];
  for (const [k, rs] of Object.entries(rows)) {
    if (!rs.length) continue;
    const table = k.split(".")[1];
    const tTok = tokens(table);
    const cols = new Set<string>();
    for (const r of rs) {
      for (const [col, v] of Object.entries(r as Record<string, unknown>)) {
        if (v !== null && v !== undefined && v !== "") cols.add(col);
      }
    }
    for (const col of cols) candidates.push(new Set([...tTok, ...tokens(col)]));
  }
  // computed inputs may ride on event payloads rather than columns
  for (const e of (rows["core.event"] ?? []).concat(rows["sim.event"] ?? [])) {
    const cTok = tokens(String((e as Any).code));
    const walk = (v: unknown, depth: number): void => {
      if (depth > 3 || v === null || typeof v !== "object") return;
      if (Array.isArray(v)) {
        for (const x of v) walk(x, depth + 1);
        return;
      }
      for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
        if (x !== null && x !== undefined && x !== "") {
          candidates.push(new Set([...cTok, ...tokens(k)]));
        }
        walk(x, depth + 1);
      }
    };
    walk((e as Any).payload, 0);
  }

  const supplied = (i: string): boolean => {
    if (!touchedObjects.has(i.split(".")[0])) return false;
    const want = tokens(i);
    return candidates.some((cs) => [...want].every((w) => cs.has(w)));
  };

  const checkable = requiredInputs.filter((i) => knownTables.has(i.split(".")[0]));
  const unverifiable = requiredInputs.filter((i) => !knownTables.has(i.split(".")[0]));
  const inputsSupplied = checkable.filter(supplied);
  const inputsMissing = checkable.filter((i) => !supplied(i));

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
  return {
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
  };
}

const ROOT = new URL("../../../../", import.meta.url).pathname;

/** Catalogue with per-policy replicas deduped, plus scope marks and the
 * checkable-table set — shared setup for both runners. */
export async function loadCatalogue(): Promise<{
  controls: Any[];
  scope: Record<string, { verdict: string; why: string }>;
  knownTables: Set<string>;
}> {
  const schemaSql = await Deno.readTextFile(
    // supabase/ moved under core/ in 2078a19; ROOT is the repo root
    `${ROOT}core/supabase/migrations/20260702000100_core_schema.sql`,
  );
  const knownTables = new Set<string>(
    [...schemaSql.matchAll(/create table if not exists "core"\."([a-z_]+)"/g)].map((m) => m[1]),
  );
  for (
    const t of [
      "cash_transaction", "ctr_filing", "obligation", "obligation_completion",
      "work_item", "threshold", "threshold_observation", "attestation",
      "loan_party", "adverse_action_notice", "payment_approval", "client_limit",
      "cda",
    ]
  ) knownTables.add(t);

  const scopeDoc = JSON.parse(
    await Deno.readTextFile(`${ROOT}control-scope.json`).catch(() => '{"scope":{}}'),
  );
  const catalogue = JSON.parse(await Deno.readTextFile(`${ROOT}controls.json`));
  const seen = new Set<string>();
  const controls = catalogue.controls.filter((c: Any) => {
    const k = `${c.policy}:${c.control_id}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return { controls, scope: scopeDoc.scope ?? {}, knownTables };
}
