#!/usr/bin/env python3
"""
control_oracle.py — Coverage oracle for the control demand (IMMUTABLE eval harness).

Part of the AutoResearch-style self-minimizing loop for core-api.yaml. This is the
`prepare.py` analog: the agent edits core-api.yaml, this measures coverage. The agent
must never edit this file.

What it measures
----------------
The policies cite a fixed set of dotted API codes (e.g. `account.id`, `eps.proposal.submitted`).
That set — the DEMAND — is a property of the policy markdown alone and does NOT depend on the
spec. A code is "registered" if the candidate core-api.yaml exposes it as an event or a field,
and "unregistered" otherwise. So for any candidate spec:

    unregistered = demand_codes - event_codes - field_paths

This reuses the EXISTING, dependency-free pipeline scripts verbatim — it does not reimplement
classification:
  * scripts/parse_core_api.py   : core-api.yaml (+ vocab-migration.json) -> parsed vocab
  * scripts/extract_controls.py : the demand extractor + the registered/event/field rule
                                  (load_api_index, find_policy_files, parse_control_body,
                                   classify_codes)

Two-phase use (mirrors "frozen demand" in the inner loop)
---------------------------------------------------------
  1. Snapshot the demand once at loop start (it never changes while policies are frozen):
         python control_oracle.py --freeze -o demand.json
  2. Score any candidate spec against the frozen demand (fast: parse + set arithmetic):
         python control_oracle.py --spec /path/core-api.yaml --demand demand.json --json

If --demand is omitted the demand is extracted live from the policy tree (slower, but always
matches scripts/extract_controls.py exactly).

Note on the committed controls.json: as of 2026-06-13 the committed controls.json (942
unregistered, 26 policies) is STALE relative to the live policy tree (1116 unregistered, 30
policies). This oracle computes against the live policy markdown, so its baseline is 1116.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone

# --- locate repo + existing scripts, import them as the source of truth ------------
HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SCRIPTS_DIR = os.path.join(REPO_ROOT, "scripts")
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)

import parse_core_api      # noqa: E402  (engineering spec -> vocab)
import extract_controls    # noqa: E402  (demand extractor + classification rule)

try:
    import yaml            # noqa: E402  (PyYAML; see core-api-loop/requirements.txt)
except ModuleNotFoundError:  # pragma: no cover
    sys.exit("error: PyYAML not installed. Use core-api-loop/.venv "
             "(pip install -r core-api-loop/requirements.txt).")


# --------------------------------------------------------------------------- #
# Demand extraction (spec-independent): every dotted code the policies cite.
# --------------------------------------------------------------------------- #
def extract_demand(root: str = REPO_ROOT) -> dict:
    """Walk the policy markdown and return the demand: every dotted code cited,
    with the controls/policies that cite it. Reuses extract_controls primitives so
    the code set is identical to what scripts/extract_controls.py would classify."""
    files = extract_controls.find_policy_files(root)
    by_code: dict[str, dict] = {}
    policies: set[str] = set()
    control_count = 0
    for path in files:
        text = open(path, encoding="utf-8").read()
        heads = list(extract_controls.CONTROL_HEADING_RE.finditer(text))
        if not heads:
            continue
        slug = extract_controls.slug_from_path(root, path)
        policies.add(slug)
        all_h2 = [m.start() for m in extract_controls.ANY_H2_RE.finditer(text)]
        for hm in heads:
            control_count += 1
            cid = hm.group("id")
            start = hm.end()
            later = [o for o in all_h2 if o > hm.start()]
            end = later[0] if later else len(text)
            parsed = extract_controls.parse_control_body(text[start:end])
            for code in parsed["_all_dotted"]:
                rec = by_code.setdefault(code, {"controls": set(), "policies": set()})
                rec["controls"].add(cid)
                rec["policies"].add(slug)
    return {
        "meta": {
            "generator": "core-api-loop/prepare/control_oracle.py::extract_demand",
            "extracted_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "repo_root": os.path.basename(root),
            "policies": len(policies),
            "controls": control_count,
            "unique_codes": len(by_code),
        },
        "codes": {c: {"controls": sorted(v["controls"]), "policies": sorted(v["policies"])}
                  for c, v in sorted(by_code.items())},
    }


def load_demand(path: str) -> dict:
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


# --------------------------------------------------------------------------- #
# Spec index: parse a candidate core-api.yaml into the registered code sets.
# --------------------------------------------------------------------------- #
def parse_vocab(spec_path: str, migration_path: str | None) -> dict:
    """Parse a candidate core-api.yaml into the in-memory vocab dict (no file write)."""
    spec = yaml.safe_load(open(spec_path).read())
    migration_doc = None
    if migration_path and os.path.exists(migration_path):
        migration_doc = json.load(open(migration_path))
    vocab, _warnings = parse_core_api.build(spec, migration_doc)
    return vocab


def code_sets(vocab: dict) -> tuple[set, set]:
    """Extract (event_codes, field_paths) from a parsed vocab — the same sets
    extract_controls.load_api_index builds, so classification matches exactly."""
    event_codes: set[str] = set()
    for e in vocab.get("events", []):
        if e.get("code"):
            event_codes.add(e["code"])
        if e.get("name"):
            event_codes.add(e["name"])
    field_paths = {f["path"] for f in vocab.get("fields", []) if f.get("path")}
    return event_codes, field_paths


def spec_index(spec_path: str, migration_path: str | None) -> tuple[set, set, dict]:
    """Parse a candidate spec into (event_codes, field_paths, parsed_stats)."""
    vocab = parse_vocab(spec_path, migration_path)
    event_codes, field_paths = code_sets(vocab)
    return event_codes, field_paths, vocab.get("stats", {})


def evaluate_vocab(vocab: dict, demand: dict) -> dict:
    """Classify the frozen demand against an already-parsed vocab (no re-parse).
    Mirrors extract_controls.classify_codes: event takes priority over field."""
    event_codes, field_paths = code_sets(vocab)
    demand_codes = set(demand["codes"].keys())
    reg_events = sorted(demand_codes & event_codes)
    reg_fields = sorted((demand_codes & field_paths) - event_codes)
    unregistered = sorted(demand_codes - event_codes - field_paths)
    return {
        "spec_stats": vocab.get("stats", {}),
        "demand_codes": len(demand_codes),
        "registered_events": len(reg_events),
        "registered_fields": len(reg_fields),
        "unregistered_count": len(unregistered),
        "unregistered": unregistered,
        "demand_meta": demand.get("meta", {}),
    }


# --------------------------------------------------------------------------- #
# Evaluate: classify the frozen demand against the candidate spec.
# --------------------------------------------------------------------------- #
def evaluate(spec_path: str, demand: dict, migration_path: str | None) -> dict:
    vocab = parse_vocab(spec_path, migration_path)
    return {"spec": spec_path, **evaluate_vocab(vocab, demand)}


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #
def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    ap.add_argument("-s", "--spec", default=os.path.join(REPO_ROOT, "core-api.yaml"),
                    help="Candidate core-api.yaml (default: repo root).")
    ap.add_argument("-m", "--migration", default=os.path.join(REPO_ROOT, "vocab-migration.json"),
                    help="vocab-migration.json (default: repo root).")
    ap.add_argument("--root", default=REPO_ROOT, help="Policy repo root (for live demand).")
    ap.add_argument("--demand", default=None,
                    help="Frozen demand snapshot (from --freeze). If omitted, demand is "
                         "extracted live from the policy tree.")
    ap.add_argument("--freeze", action="store_true",
                    help="Extract the demand and write it to -o (a reusable snapshot), then exit.")
    ap.add_argument("-o", "--output", default=None, help="Output path for --freeze.")
    ap.add_argument("--json", action="store_true", help="Emit JSON only.")
    args = ap.parse_args(argv)

    if args.freeze:
        demand = extract_demand(args.root)
        out = args.output or os.path.join(HERE, "demand.json")
        with open(out, "w", encoding="utf-8") as fh:
            json.dump(demand, fh, indent=2, ensure_ascii=False)
            fh.write("\n")
        print(json.dumps({"wrote": out, **demand["meta"]}, indent=2))
        return 0

    demand = load_demand(args.demand) if args.demand else extract_demand(args.root)
    result = evaluate(args.spec, demand, args.migration)

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"spec                : {result['spec']}")
        print(f"demand codes        : {result['demand_codes']}")
        print(f"registered events   : {result['registered_events']}")
        print(f"registered fields   : {result['registered_fields']}")
        print(f"UNREGISTERED (gap)  : {result['unregistered_count']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
