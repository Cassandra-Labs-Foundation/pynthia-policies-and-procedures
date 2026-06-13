#!/usr/bin/env python3
"""
score.py — The single gated scalar + keep/revert verdict (IMMUTABLE eval harness).

This is the `val_bpb` analog and the accept rule of the AutoResearch loop, folded into one
number so the loop runs unchanged. It composes the two coverage oracles (control + architecture)
with the complexity fitness:

    control_violations = max(0, unregistered_codes        - control_budget)
    arch_violations    = max(0, uncovered_arch_elements   - arch_budget)
    score = (control_violations + arch_violations) * big_penalty + complexity

Lower is better. The runner keeps a candidate iff score(candidate) < score(best). Because the
penalty dwarfs complexity, the loop first drives violations down (feasibility), then minimizes
complexity while staying feasible — the two regimes the plan calls for.

The spec is parsed ONCE here and shared across all three components (no redundant parsing, no
hidden state — re-running parse_core_api.py + build_control_vocabulary.py from scratch on the
final spec must reproduce these numbers; see VERIFY.md round-trip check).

The agent must never edit this file, fitness.py, the oracles, architecture-spec.json, or
score-config.json.
"""

from __future__ import annotations

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)

import control_oracle        # noqa: E402
import architecture_oracle   # noqa: E402
import fitness               # noqa: E402

DEFAULT_CONFIG = os.path.join(HERE, "score-config.json")
DEFAULT_DEMAND = os.path.join(HERE, "demand.json")
DEFAULT_CHECKLIST = os.path.join(HERE, "architecture-spec.json")


def score_spec(spec_path: str, migration_path: str | None, *, config: dict,
               demand: dict, checklist: dict, root: str = REPO_ROOT) -> dict:
    # Parse the candidate ONCE, share across all three components.
    vocab = fitness.parse_vocab(spec_path, migration_path)

    control = control_oracle.evaluate_vocab(vocab, demand)
    arch = architecture_oracle.evaluate(vocab, checklist)
    cx = fitness.complexity(vocab, config, root=root)

    control_budget = config.get("control_budget", 0)
    arch_budget = config.get("arch_budget", 0)
    big = config.get("big_penalty", 100000)

    control_violations = max(0, control["unregistered_count"] - control_budget)
    arch_violations = max(0, arch["uncovered_count"] - arch_budget)
    violations = control_violations + arch_violations
    score = violations * big + cx["complexity"]

    return {
        "spec": spec_path,
        "score": round(score, 4),
        "feasible": violations == 0,
        "violations": {
            "control": control_violations,
            "architecture": arch_violations,
            "total": violations,
        },
        "coverage": {
            "unregistered_codes": control["unregistered_count"],
            "control_budget": control_budget,
            "uncovered_arch_elements": arch["uncovered_count"],
            "arch_budget": arch_budget,
            "registered_events": control["registered_events"],
            "registered_fields": control["registered_fields"],
            "demand_codes": control["demand_codes"],
        },
        "complexity": cx["complexity"],
        "complexity_components": cx["components"],
        "arch_by_category": arch["by_category"],
    }


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    ap.add_argument("-s", "--spec", default=os.path.join(REPO_ROOT, "core-api.yaml"))
    ap.add_argument("-m", "--migration", default=os.path.join(REPO_ROOT, "vocab-migration.json"))
    ap.add_argument("-c", "--config", default=DEFAULT_CONFIG)
    ap.add_argument("--demand", default=DEFAULT_DEMAND,
                    help="Frozen demand snapshot (control_oracle.py --freeze). "
                         "If missing, demand is extracted live.")
    ap.add_argument("--checklist", default=DEFAULT_CHECKLIST)
    ap.add_argument("--control-budget", type=int, default=None,
                    help="Override score-config.json control_budget.")
    ap.add_argument("--arch-budget", type=int, default=None,
                    help="Override score-config.json arch_budget.")
    ap.add_argument("--against", default=None,
                    help="A prior score JSON file (the current best). If given, prints the "
                         "keep/revert verdict: keep iff candidate score < best score.")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args(argv)

    config = fitness.load_config(args.config)
    if args.control_budget is not None:
        config["control_budget"] = args.control_budget
    if args.arch_budget is not None:
        config["arch_budget"] = args.arch_budget

    if os.path.exists(args.demand):
        demand = control_oracle.load_demand(args.demand)
    else:
        demand = control_oracle.extract_demand(REPO_ROOT)
    checklist = json.load(open(args.checklist))

    result = score_spec(args.spec, args.migration, config=config,
                         demand=demand, checklist=checklist)

    verdict = None
    if args.against and os.path.exists(args.against):
        best = json.load(open(args.against))
        keep = result["score"] < best.get("score", float("inf"))
        verdict = {"keep": keep, "candidate_score": result["score"],
                   "best_score": best.get("score"),
                   "delta": round(result["score"] - best.get("score", 0), 4)}
        result["verdict"] = verdict

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"spec                : {result['spec']}")
        print(f"SCORE               : {result['score']}   (lower is better)")
        print(f"feasible            : {result['feasible']}")
        print(f"violations          : control={result['violations']['control']} "
              f"architecture={result['violations']['architecture']}")
        cov = result["coverage"]
        print(f"  unregistered      : {cov['unregistered_codes']} (budget {cov['control_budget']})")
        print(f"  uncovered arch    : {cov['uncovered_arch_elements']} (budget {cov['arch_budget']})")
        print(f"complexity          : {result['complexity']}")
        comp = result["complexity_components"]
        print(f"  concepts={comp['concepts']} fields={comp['field_count']} "
              f"endpoints={comp['endpoint_count']} tasks={comp['task_type_count']} "
              f"generic={comp['generic_field_count']}")
        if verdict:
            print(f"VERDICT             : {'KEEP' if verdict['keep'] else 'REVERT'} "
                  f"(Δ={verdict['delta']} vs best {verdict['best_score']})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
