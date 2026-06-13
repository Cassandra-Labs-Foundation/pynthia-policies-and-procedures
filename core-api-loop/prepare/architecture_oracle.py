#!/usr/bin/env python3
"""
architecture_oracle.py — Coverage oracle for the system architecture (IMMUTABLE eval harness).

The second of the two coverage oracles. Where control_oracle.py checks that the spec covers
what the *policies* demand, this checks that the spec covers what the *architecture* mandates.

It diffs core-api-loop/prepare/architecture-spec.json (a hand-reviewed, version-pinned
distillation of architecture-decisions.md v1.1) against a candidate's parsed core-vocabulary.json
and returns the list of uncovered architectural elements across five categories:

  * resources       — a named resource must exist as a parsed entity (snake name)
  * state_machines  — a named state machine must exist AND cover its required states
  * event_families  — at least one event must exist under the required dotted prefix
  * endpoints       — a method+path must exist (path params normalized, e.g. {id} -> {})
  * fields          — a specific dotted field path must exist
  * conventions     — representative cross-cutting tokens (idempotency_key, request_id, ...)
                      appear as a substring of some field path (soft signals)

The candidate vocab is produced by reusing scripts/parse_core_api.py (no reimplementation).
The agent must never edit this file or architecture-spec.json.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SCRIPTS_DIR = os.path.join(REPO_ROOT, "scripts")
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)

import parse_core_api  # noqa: E402

try:
    import yaml  # noqa: E402
except ModuleNotFoundError:  # pragma: no cover
    sys.exit("error: PyYAML not installed. Use core-api-loop/.venv "
             "(pip install -r core-api-loop/requirements.txt).")

DEFAULT_SPEC_CHECKLIST = os.path.join(HERE, "architecture-spec.json")


def parse_vocab(spec_path: str, migration_path: str | None) -> dict:
    spec = yaml.safe_load(open(spec_path).read())
    migration_doc = None
    if migration_path and os.path.exists(migration_path):
        migration_doc = json.load(open(migration_path))
    vocab, _warnings = parse_core_api.build(spec, migration_doc)
    return vocab


def _norm_path(path: str) -> str:
    """Normalize an endpoint path for matching: lowercase, strip trailing slash,
    collapse every {param} to {} so {id} and {instance_id} compare equal."""
    p = re.sub(r"\{[^}]*\}", "{}", path.strip().lower())
    if len(p) > 1 and p.endswith("/"):
        p = p[:-1]
    return p


def evaluate(vocab: dict, checklist: dict) -> dict:
    # --- index the parsed vocab -------------------------------------------------
    entity_names = {e["name"] for e in vocab.get("entities", [])}
    sm_index = {sm["name"]: set(sm.get("states") or []) for sm in vocab.get("state_machines", [])}
    event_prefixes = {e["name"].split(".", 1)[0] for e in vocab.get("events", [])}
    field_paths = {f["path"] for f in vocab.get("fields", []) if f.get("path")}
    endpoint_set = {(ep["method"].upper(), _norm_path(ep["path"])) for ep in vocab.get("endpoints", [])}

    gaps: list[dict] = []
    covered = 0

    # --- resources --------------------------------------------------------------
    for r in checklist.get("resources", []):
        if r["name"] in entity_names:
            covered += 1
        else:
            gaps.append({"category": "resource", "element": r["name"],
                         "decision": r.get("decision"), "detail": "no parsed entity with this name"})

    # --- state machines ---------------------------------------------------------
    for sm in checklist.get("state_machines", []):
        have = sm_index.get(sm["name"])
        required = set(sm.get("states") or [])
        if have is None:
            gaps.append({"category": "state_machine", "element": sm["name"],
                         "decision": sm.get("decision"), "detail": "state machine absent"})
        elif not required <= have:
            gaps.append({"category": "state_machine", "element": sm["name"],
                         "decision": sm.get("decision"),
                         "detail": f"missing states {sorted(required - have)}"})
        else:
            covered += 1

    # --- event families ---------------------------------------------------------
    for ef in checklist.get("event_families", []):
        if ef["prefix"] in event_prefixes:
            covered += 1
        else:
            gaps.append({"category": "event_family", "element": ef["prefix"] + ".*",
                         "decision": ef.get("decision"), "detail": "no events under this prefix"})

    # --- endpoints --------------------------------------------------------------
    for ep in checklist.get("endpoints", []):
        key = (ep["method"].upper(), _norm_path(ep["path"]))
        if key in endpoint_set:
            covered += 1
        else:
            gaps.append({"category": "endpoint", "element": f"{ep['method'].upper()} {ep['path']}",
                         "decision": ep.get("decision"), "detail": "endpoint absent"})

    # --- fields -----------------------------------------------------------------
    for f in checklist.get("fields", []):
        if f["path"] in field_paths:
            covered += 1
        else:
            gaps.append({"category": "field", "element": f["path"],
                         "decision": f.get("decision"), "detail": "field path absent"})

    # --- conventions (soft) -----------------------------------------------------
    for tok in checklist.get("conventions", {}).get("tokens", []):
        needle = tok["token"]
        if any(needle in p for p in field_paths):
            covered += 1
        else:
            gaps.append({"category": "convention", "element": needle,
                         "decision": tok.get("decision"),
                         "detail": "no field path contains this token"})

    total = covered + len(gaps)
    return {
        "checklist_elements": total,
        "covered": covered,
        "uncovered_count": len(gaps),
        "gaps": gaps,
        "by_category": {
            cat: sum(1 for g in gaps if g["category"] == cat)
            for cat in ("resource", "state_machine", "event_family", "endpoint", "field", "convention")
        },
    }


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    ap.add_argument("-s", "--spec", default=os.path.join(REPO_ROOT, "core-api.yaml"))
    ap.add_argument("-m", "--migration", default=os.path.join(REPO_ROOT, "vocab-migration.json"))
    ap.add_argument("-c", "--checklist", default=DEFAULT_SPEC_CHECKLIST)
    ap.add_argument("--json", action="store_true", help="Emit JSON only.")
    args = ap.parse_args(argv)

    checklist = json.load(open(args.checklist))
    vocab = parse_vocab(args.spec, args.migration)
    result = evaluate(vocab, checklist)

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"checklist elements  : {result['checklist_elements']}")
        print(f"covered             : {result['covered']}")
        print(f"UNCOVERED (arch gap): {result['uncovered_count']}")
        print(f"  by category       : {json.dumps(result['by_category'])}")
        if result["gaps"]:
            print("  gaps:")
            for g in result["gaps"]:
                print(f"    [{g['category']:13}] {g['element']:42} ({g['decision']}) — {g['detail']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
