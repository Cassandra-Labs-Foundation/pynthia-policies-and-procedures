#!/usr/bin/env python3
"""
enumerate.py — the deterministic backbone of the test-generation pipeline.

Fuses the four inputs into a flat TARGET LIST (every test the generator will emit, each
citing its source per PRINCIPLES P7) plus a WORKLIST (targets not yet testable, with reasons).
No LLM, no randomness, byte-stable output (P6, P10). The per-element generator (generate.py)
consumes targets.json; the LLM never decides *what* to test, only *how*.

Inputs (version-pinned snapshot at repo root + verifier/):
  core-api.yaml        enumeration — resources(+states), endpoints       [OpenAPI 3.0.3]
  controls.json        enumeration — controls, events[], api_references
  crosswalk-emitted-events.json  the routed emission inventory — inducibility ground truth
  properties.yaml      curated cross-cutting invariants / attack oracle
  compliance-floor.yaml floor designation (deprioritized — white-label only)

Outputs (under verifier/):
  targets.json         the full structured target list
  worklist.md          not-yet-testable targets, grouped by reason (auto-shrinks as upstream converges, P9)
  + a coverage summary to stdout

The spec is parsed through scripts/parse_core_api.openapi_to_spec — the same adapter that
builds core-vocabulary.json — so the verifier and the vocabulary can never disagree about
what the spec says. Needs pyyaml (like every consumer of the spec). An empty enumeration
is FATAL: the 2026-07 incident where the old bespoke-format parser matched zero of the
OpenAPI document and "successfully" wrote an empty targets.json must not recur.
"""
import json, re, sys, collections
from pathlib import Path

CORE = Path(__file__).resolve().parents[2]          # core/
ROOT = CORE.parent                                   # repo root
VERIFIER = CORE / "verifier"

sys.path.insert(0, str(ROOT / "scripts"))
import yaml                                          # noqa: E402
import spec_io                                       # noqa: E402
import code_format                                   # noqa: E402
import parse_core_api as pca                         # noqa: E402  (openapi_to_spec)

# The enumerator's inputs no longer share a directory. In cassandra-core they all sat at
# that repo's root; here the spec and the floor designation live with the core, while
# controls.json and the emitted inventory are artifacts at the repo root because both
# halves of the system read them.
SPEC = CORE / "core-api.yaml"
FLOOR = CORE / "compliance-floor.yaml"
CONTROLS = ROOT / "controls.json"
EMITTED = ROOT / "crosswalk-emitted-events.json"


# ────────────────────────────── parsers ──────────────────────────────
def parse_core_api(path):
    """Return (resources, endpoints). resources: {name: {kind, states[]}}. endpoints: [(method,path,op)].

    Ported to OpenAPI: delegates to scripts/parse_core_api.openapi_to_spec (schemas ->
    resources with x-states, paths -> endpoints) and adapts to the shapes this
    enumerator has always used."""
    doc = spec_io.load_spec(path)
    if not (isinstance(doc, dict) and doc.get("openapi")):
        sys.exit(f"FATAL: {path} is not an OpenAPI document — refusing to enumerate.")
    spec = pca.openapi_to_spec(doc)
    resources = {name: {"kind": r.get("kind") or "?", "states": list(r.get("states") or [])}
                 for name, r in (spec.get("resources") or {}).items()}
    endpoints = [(method.upper(), p, op)
                 for p, methods in sorted((spec.get("endpoints") or {}).items())
                 for method, op in sorted((methods or {}).items())]
    if not resources or not endpoints:
        sys.exit("FATAL: spec parsed to an empty enumeration "
                 f"(resources={len(resources)}, endpoints={len(endpoints)}) — "
                 "refusing to overwrite targets.json with an empty target list.")
    return resources, endpoints


def emitted_trigger_codes(path):
    """Canonicalized set of event codes the ROUTED core actually emits — the honest
    'can the API induce this trigger' ground truth, replacing the old hand-maintained
    INDUCIBLE_SUBJECTS prefix list (which predated the payments/HR/privacy surface)."""
    return code_format.emitted_codes(json.loads(path.read_text()))


def emitted_code_sources(path):
    """code -> emitting source file, from the inventory's provenance column.
    emitted_codes() flattens this away, but the inducer question needs it: for
    a request-driven control the HTTP call IS the trigger and only the OUTPUTS
    are emitted, so 'which routed handler produces this rule's whole reaction'
    is the honest inducibility test when the trigger itself is not an event
    the core writes."""
    inv = json.loads(path.read_text())
    out = {}
    for e in inv["literal"]:
        out[e["code"]] = str(e.get("source", "")).split(":")[0]
    for t in inv["templated"]:
        src = str(t.get("source", "")).split(":")[0]
        for c in t["expands_to"]:
            out[c] = src
    return out


def parse_properties(path):
    """Return [{id,kind,pillars[],tier,status,severity}] — only the metadata fields we enumerate on."""
    body = path.read_text().split('\nproperties:', 1)[1]
    out = []
    for blk in re.split(r'\n  - id: ', body)[1:]:
        pid = blk.split('\n', 1)[0].strip()
        def field(name, default=None):
            m = re.search(rf'^    {name}: (.+)$', blk, re.M)
            return m.group(1).strip() if m else default
        pillars = field('pillars', '[]')
        out.append({
            "id": pid,
            "kind": field('kind', '?'),
            "pillars": re.findall(r'\b(functional|detection|resiliency|compliance|security)\b', pillars),
            "tier": field('tier', 'light_api'),
            "status": field('status', 'draft'),
            "severity": field('severity', 'med'),
        })
    return out


def parse_floor(path):
    if not path.exists():
        return set()
    t = path.read_text()
    seg = t.split('floor_controls:', 1)[1].split('candidates:', 1)[0] if 'floor_controls:' in t else ''
    return set(re.findall(r'-\s*control_id:\s*(\S+)', seg))


def parse_floor_triggers(path):
    """{control_id: [trigger codes]} from the floor_controls section."""
    if not path.exists():
        return {}
    t = path.read_text()
    seg = t.split('floor_controls:', 1)[1].split('candidates:', 1)[0] if 'floor_controls:' in t else ''
    out = {}
    for blk in re.split(r'\n\s*-\s*control_id:\s*', seg)[1:]:
        cid = blk.split('\n', 1)[0].strip()
        m = re.search(r'floor_triggers:\s*\[([^\]]*)\]', blk)
        if m:
            out[cid] = [x.strip() for x in m.group(1).split(',') if x.strip()]
    return out


# ────────────────────────────── enumeration ──────────────────────────────
def enum_contract(endpoints):
    targets = []
    for method, path, op in endpoints:
        targets.append({
            "target_id": f"contract:{method}:{path}",
            "kind": "contract", "pillars": ["functional", "security"],
            "tier": "light_api", "status": "ready",
            "source": f"core-api.yaml endpoints {method} {path}",
            "payload": {"method": method, "path": path, "operation": op},
        })
    return targets


def enum_state_machines(resources, endpoints):
    # resource name -> True if an endpoint path references it (kebab+plural heuristic)
    ep_paths = {p for _, p, _ in endpoints}
    def has_endpoint(name):
        kebab = re.sub(r'(?<!^)(?=[A-Z])', '-', name).lower()      # LoanApplication -> loan-application
        return any(p == f"/{kebab}s" or p.startswith(f"/{kebab}s/") or
                   p == f"/{kebab}es" for p in ep_paths)
    targets = []
    for name, info in sorted(resources.items()):
        if not info["states"]:
            continue
        ready = has_endpoint(name)
        targets.append({
            "target_id": f"sm:{name}",
            "kind": "state_machine", "pillars": ["functional"],
            "tier": "light_api",
            "status": "ready" if ready else "spec_ahead",
            "reason": None if ready else "no endpoint exposes this resource yet (banking core)",
            "source": f"core-api.yaml resource {name} (kind={info['kind']})",
            "payload": {"resource": name, "kind": info["kind"], "states": info["states"]},
        })
    return targets


def classify_control(ctrl, inducible, canon, emitters, scoped_out):
    """Return (status, reason, testable_events). status: ready | worklist | out_of_scope.

    A trigger is inducible iff the ROUTED core can emit it (membership in the
    canonicalized emitted inventory) — the same denominator the crosswalk uses.
    A rule is testable only if its OUTPUTS are emittable too: a black-box test
    fires the trigger and then asserts the produced events, so an output no
    routed handler emits makes the assertion unwinnable, not merely weak.

    NOTE this is stricter than drill coverage on purpose: the drill imports
    handlers directly (firers.ts reaches unrouted modules like lending.ts), so
    a control can be drill-green and still `no_api_inducer` here. The verifier
    is black-box by charter — reachable means reachable over HTTP."""
    # An obligation discharged by people and paperwork has no API inducer BY
    # DESIGN — counting it as verifier backlog misstates the backlog. The
    # scoping file is the same one the drill grader reads; the verifier was
    # its only consumer that didn't.
    if scoped_out:
        return "out_of_scope", "scoped_out (control-scope.json)", []

    ar = ctrl.get("api_references") or {}
    unregistered = set(ar.get("unregistered", []))
    testable = []
    reasons = set()
    for ev in (ctrl.get("events") or []):
        trig = (ev.get("trigger") or {}).get("code")
        if not trig:
            continue
        subject = trig.split('.')[0]
        out_codes = [c for o in (ev.get("outputs") or []) for c in (o.get("codes") or [])]
        real_output = [c for c in out_codes if c != trig]
        if trig in unregistered:
            reasons.add("unregistered_trigger"); continue
        inducer = {"via": "emitted_trigger"}
        if canon(trig) not in inducible:
            # Request-driven rule: the trigger names the CALL, not an emitted
            # code. If one routed handler emits the rule's entire reaction,
            # that handler's route is the inducer — fire it, assert the
            # outputs. Requiring a single common source keeps this honest
            # (it refuses the unrouted credit surface, whose outputs no
            # routed code emits at all).
            srcs = {emitters.get(canon(c)) for c in real_output}
            if not real_output or None in srcs or len(srcs) != 1:
                reasons.add("no_api_inducer"); continue
            inducer = {"via": "routed_outputs", "source": srcs.pop()}
        if not real_output:
            reasons.add("degenerate_output"); continue
        if any(canon(c) not in inducible for c in real_output):
            reasons.add("unemittable_output"); continue
        testable.append({"trigger": trig, "outputs": real_output,
                         "within": ev.get("within"), "subject": subject,
                         "inducer": inducer})
    if testable:
        return "ready", None, testable
    # priority of reasons for the worklist label
    for r in ("no_api_inducer", "unregistered_trigger", "unemittable_output",
              "degenerate_output"):
        if r in reasons:
            return "worklist", r, []
    return "worklist", "no_trigger", []


def enum_controls(controls, floor_ids, inducible, canon, emitters, scope):
    # control_ids are NOT globally unique (10 collide — e.g. BC-* is reused by the Basel framework
    # and the business-continuity plan). Disambiguate colliding ids by policy slug for a unique target_id.
    counts = collections.Counter(c["control_id"] for c in controls)
    collisions = {cid for cid, n in counts.items() if n > 1}
    targets = []
    for c in controls:
        cid = c["control_id"]
        slug = c.get("policy") or Path(c.get("source_file", "")).parent.name or "unknown"
        tid = f"control:{cid}" if cid not in collisions else f"control:{cid}@{slug}"
        scoped_out = (scope.get(f"{slug}:{cid}") or {}).get("verdict") == "out"
        status, reason, testable = classify_control(c, inducible, canon, emitters, scoped_out)
        targets.append({
            "target_id": tid,
            "kind": "control", "pillars": ["compliance", "detection"],
            "tier": "light_api", "status": status, "reason": reason,
            "source": f"controls.json {cid} ({slug}) — {c.get('title','')}",
            "floor": cid in floor_ids,
            "payload": {"control_id": cid, "policy": slug, "title": c.get("title", ""),
                        "testable_events": testable},
        })
    return targets


def enum_properties(props):
    targets = []
    for p in props:
        targets.append({
            "target_id": f"property:{p['id']}",
            "kind": "property", "pillars": p["pillars"],
            "tier": p["tier"], "status": p["status"],
            "reason": None if p["status"] in ("ready",) else p["status"],
            "source": f"properties.yaml {p['id']}",
            "payload": {"property_id": p["id"], "kind": p["kind"], "severity": p["severity"]},
        })
    return targets


# ────────────────────────────── main ──────────────────────────────
def main():
    resources, endpoints = parse_core_api(SPEC)
    controls = json.loads(CONTROLS.read_text())["controls"]
    props = parse_properties(VERIFIER / "properties.yaml")
    floor_ids = parse_floor(FLOOR)

    canon = code_format.canonicalizer(ROOT / "core-vocabulary.json")
    inducible = {canon(c) for c in emitted_trigger_codes(EMITTED)}
    emitters = {canon(k): v for k, v in emitted_code_sources(EMITTED).items()}
    scope = json.loads((ROOT / "control-scope.json").read_text())["scope"]

    # floor ids must resolve — a dangling floor designation attaches the
    # FLOOR-ALWAYS-FIRES assertions to nothing (which is how the BS-*→BSA-*
    # rename went unnoticed for a month)
    known_ids = {c["control_id"] for c in controls}
    dangling = sorted(floor_ids - known_ids)
    if dangling:
        sys.exit(f"FATAL: compliance-floor.yaml names control ids absent from "
                 f"controls.json: {dangling}")

    # ...and floor TRIGGERS must be qualifying events of their control (the
    # file's own contract: "from controls.json events[]"). The id check alone
    # let a dead code (sar.decision_file) carry the SAR floor assertion.
    floor_triggers = parse_floor_triggers(FLOOR)
    for cid, trigs in sorted(floor_triggers.items()):
        cited = set()
        for c in controls:
            if c["control_id"] != cid:
                continue
            for ev in (c.get("events") or []):
                t = (ev.get("trigger") or {}).get("code")
                if t:
                    cited.add(canon(t))
                for o in (ev.get("outputs") or []):
                    cited.update(canon(x) for x in (o.get("codes") or []))
        bad = sorted(t for t in trigs if canon(t) not in cited)
        if bad:
            sys.exit(f"FATAL: compliance-floor.yaml floor_triggers for {cid} are "
                     f"not qualifying events of that control: {bad}")

    targets = (enum_contract(endpoints) + enum_state_machines(resources, endpoints)
               + enum_controls(controls, floor_ids, inducible, canon, emitters, scope)
               + enum_properties(props))
    targets.sort(key=lambda t: t["target_id"])

    # uniqueness guard — target_id is the citation handle (P7); collisions are a fatal data error
    ids = [t["target_id"] for t in targets]
    dupes = sorted(i for i, n in collections.Counter(ids).items() if n > 1)
    if dupes:
        print(f"FATAL: {len(dupes)} duplicate target_ids: {dupes[:10]}", file=sys.stderr)
        sys.exit(1)

    # ---- write targets.json (deterministic) ----
    targets_text = json.dumps(
        {"meta": {"generator": "verifier/generator/enumerate.py",
                  "total": len(targets), "inputs": {
                      "core_api_resources": len(resources), "endpoints": len(endpoints),
                      "controls": len(controls), "properties": len(props),
                      "floor_controls": len(floor_ids)}},
         "targets": targets}, indent=2, sort_keys=False) + "\n"

    # ---- worklist.md (built before the check so the gate covers BOTH outputs) ----
    not_ready = [t for t in targets if t["status"] != "ready"]
    by_reason = {}
    for t in not_ready:
        by_reason.setdefault((t["kind"], t.get("reason") or t["status"]), []).append(t)
    lines = ["# Worklist — targets not yet testable",
             "",
             "Auto-generated by `verifier/generator/enumerate.py` (PRINCIPLES P9 — shrinks as the upstream",
             "loop exposes more of the API). Do not edit by hand.", ""]
    for (kind, reason), ts in sorted(by_reason.items()):
        lines.append(f"## {kind} — {reason}  ({len(ts)})")
        for t in sorted(ts, key=lambda x: x["target_id"]):
            lines.append(f"- `{t['target_id']}` — {t['source']}")
        lines.append("")
    worklist_text = "\n".join(lines)

    import generated  # scripts/ is on sys.path — the shared staleness gate
    outputs = {VERIFIER / "targets.json": targets_text,
               VERIFIER / "worklist.md": worklist_text}
    if "--check" in sys.argv[1:]:
        if generated.check_or_write(outputs, check=True,
                                    rerun_hint="core/verifier/generator/enumerate.py"):
            sys.exit(1)
        print(f"enumeration OK — {len(targets)} targets current")
        return
    generated.check_or_write(outputs, check=False, rerun_hint="")

    # ---- stdout summary ----
    def tally(key):
        out = {}
        for t in targets:
            out.setdefault(t[key], {"ready": 0, "other": 0})
            out[t[key]]["ready" if t["status"] == "ready" else "other"] += 1
        return out
    print(f"TARGETS: {len(targets)}  (ready {sum(1 for t in targets if t['status']=='ready')}"
          f" / not-ready {len(not_ready)})\n")
    print(f"{'kind':14}{'ready':>7}{'not-ready':>11}")
    for kind, c in sorted(tally('kind').items()):
        print(f"{kind:14}{c['ready']:>7}{c['other']:>11}")
    print()
    statuses = {}
    for t in targets:
        statuses[t["status"]] = statuses.get(t["status"], 0) + 1
    print("by status:", dict(sorted(statuses.items())))
    # control reasons (the worklist that upstream convergence shrinks)
    creasons = {}
    for t in targets:
        if t["kind"] == "control" and t["status"] != "ready":
            creasons[t["reason"]] = creasons.get(t["reason"], 0) + 1
    print("control worklist reasons:", dict(sorted(creasons.items())))
    ctrl_ready = sum(1 for t in targets if t["kind"] == "control" and t["status"] == "ready")
    print(f"controls testable now: {ctrl_ready} / {len(controls)}")
    print(f"\nwrote {VERIFIER/'targets.json'}  and  {VERIFIER/'worklist.md'}")


if __name__ == "__main__":
    main()
