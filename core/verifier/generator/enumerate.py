#!/usr/bin/env python3
"""
enumerate.py — the deterministic backbone of the test-generation pipeline.

Fuses the four inputs into a flat TARGET LIST (every test the generator will emit, each
citing its source per PRINCIPLES P7) plus a WORKLIST (targets not yet testable, with reasons).
No LLM, no randomness, byte-stable output (P6, P10). The per-element generator (generate.py)
consumes targets.json; the LLM never decides *what* to test, only *how*.

Inputs (version-pinned snapshot at repo root + verifier/):
  core-api.yaml        enumeration — resources(+states), endpoints       [custom DSL, not OpenAPI]
  controls.json        enumeration — 317 controls, events[], api_references
  properties.yaml      curated cross-cutting invariants / attack oracle
  compliance-floor.yaml floor designation (deprioritized — white-label only)

Outputs (under verifier/):
  targets.json         the full structured target list
  worklist.md          not-yet-testable targets, grouped by reason (auto-shrinks as upstream converges, P9)
  + a coverage summary to stdout

YAML parsing here is intentionally STRUCTURAL/targeted (the files are regular and we own their
shape), so the tool has zero third-party deps. Swap in pyyaml if the shapes drift.
"""
import json, re, sys, collections
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VERIFIER = ROOT / "verifier"

# Substrate resources whose endpoints can INDUCE an event (have a POST/transition op).
# Read-only resources (control_result, event) are observers, not inducers.
INDUCIBLE_SUBJECTS = {"case", "document", "filing", "incident",
                      "legal_hold", "loan_application", "loan", "task"}


# ────────────────────────────── parsers ──────────────────────────────
def parse_core_api(path):
    """Return (resources, endpoints). resources: {name: {kind, states[]}}. endpoints: [(method,path,op)]."""
    lines = path.read_text().splitlines()
    resources, endpoints = {}, []
    section = None          # 'resources' | 'endpoints' | other
    cur = None              # current resource name
    collecting_states = False
    cur_path = None         # current endpoint path
    for ln in lines:
        if re.match(r'^[A-Za-z_]+:\s*$', ln):          # top-level key
            section = ln.split(':', 1)[0]
            cur = cur_path = None; collecting_states = False
            continue
        if section == 'resources':
            m = re.match(r'^  ([A-Za-z][A-Za-z0-9_]*):\s*$', ln)
            if m:
                cur = m.group(1); resources[cur] = {"kind": "?", "states": []}
                collecting_states = False; continue
            if cur and re.match(r'^    kind:', ln):
                resources[cur]["kind"] = ln.split(':', 1)[1].strip()
            elif cur and re.match(r'^    states:\s*$', ln):
                collecting_states = True
            elif collecting_states and re.match(r'^    - ', ln):
                resources[cur]["states"].append(ln.split('- ', 1)[1].strip())
            elif re.match(r'^    [a-z]', ln):
                collecting_states = False
        elif section == 'endpoints':
            m = re.match(r'^  (/\S+):\s*$', ln)
            if m:
                cur_path = m.group(1); continue
            m = re.match(r'^    (get|post|patch|put|delete):\s*(\S+)', ln)
            if m and cur_path:
                endpoints.append((m.group(1).upper(), cur_path, m.group(2)))
    return resources, endpoints


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


def classify_control(ctrl):
    """Return (status, reason, testable_events). status: ready | worklist."""
    ar = ctrl.get("api_references") or {}
    registered = set(ar.get("events", [])) | set(ar.get("fields", []))
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
        if subject not in INDUCIBLE_SUBJECTS:
            reasons.add("no_api_inducer"); continue
        if not real_output:
            reasons.add("degenerate_output"); continue
        testable.append({"trigger": trig, "outputs": real_output,
                         "within": ev.get("within"), "subject": subject})
    if testable:
        return "ready", None, testable
    # priority of reasons for the worklist label
    for r in ("no_api_inducer", "unregistered_trigger", "degenerate_output"):
        if r in reasons:
            return "worklist", r, []
    return "worklist", "no_trigger", []


def enum_controls(controls, floor_ids):
    # control_ids are NOT globally unique (10 collide — e.g. BC-* is reused by the Basel framework
    # and the business-continuity plan). Disambiguate colliding ids by policy slug for a unique target_id.
    counts = collections.Counter(c["control_id"] for c in controls)
    collisions = {cid for cid, n in counts.items() if n > 1}
    targets = []
    for c in controls:
        cid = c["control_id"]
        slug = Path(c.get("source_file", "")).parent.name or "unknown"
        tid = f"control:{cid}" if cid not in collisions else f"control:{cid}@{slug}"
        status, reason, testable = classify_control(c)
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
    resources, endpoints = parse_core_api(ROOT / "core-api.yaml")
    controls = json.loads((ROOT / "controls.json").read_text())["controls"]
    props = parse_properties(VERIFIER / "properties.yaml")
    floor_ids = parse_floor(ROOT / "compliance-floor.yaml")

    targets = (enum_contract(endpoints) + enum_state_machines(resources, endpoints)
               + enum_controls(controls, floor_ids) + enum_properties(props))
    targets.sort(key=lambda t: t["target_id"])

    # uniqueness guard — target_id is the citation handle (P7); collisions are a fatal data error
    ids = [t["target_id"] for t in targets]
    dupes = sorted(i for i, n in collections.Counter(ids).items() if n > 1)
    if dupes:
        print(f"FATAL: {len(dupes)} duplicate target_ids: {dupes[:10]}", file=sys.stderr)
        sys.exit(1)

    # ---- write targets.json (deterministic) ----
    (VERIFIER / "targets.json").write_text(json.dumps(
        {"meta": {"generator": "verifier/generator/enumerate.py",
                  "total": len(targets), "inputs": {
                      "core_api_resources": len(resources), "endpoints": len(endpoints),
                      "controls": len(controls), "properties": len(props),
                      "floor_controls": len(floor_ids)}},
         "targets": targets}, indent=2, sort_keys=False) + "\n")

    # ---- write worklist.md ----
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
    (VERIFIER / "worklist.md").write_text("\n".join(lines))

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
