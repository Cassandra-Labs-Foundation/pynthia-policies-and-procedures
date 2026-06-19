#!/usr/bin/env python3
"""
score.py — The single gated scalar + keep/revert verdict (IMMUTABLE eval harness).

This is the `val_bpb` analog and the accept rule of the AutoResearch loop, folded into one
number so the loop runs unchanged. It composes the two coverage oracles (control + architecture),
the complexity fitness, and the conformance oracle's regularity surcharge:

    control_violations = max(0, unregistered_codes        - control_budget)
    arch_violations    = max(0, uncovered_arch_elements   - arch_budget)
    irregularity       = weighted noncanonical_events + noncanonical_timers + namespace_gaps
                         (conformance_oracle; 0 unless config.structural_terms)
    score = (control_violations + arch_violations) * big_penalty + complexity + irregularity

Lower is better. The irregularity term is a soft surcharge, not a gate — it rewards codes that
decompose into registered object.property.action / object.task_type.due primitives, the
description length the element-count complexity term cannot see. The runner keeps a candidate iff score(candidate) < score(best). Because the
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
import conformance_oracle    # noqa: E402
import invariant_oracle      # noqa: E402
import factoring_oracle      # noqa: E402
import fitness               # noqa: E402

DEFAULT_CONFIG = os.path.join(HERE, "score-config.json")
DEFAULT_DEMAND = os.path.join(HERE, "demand.json")
DEFAULT_CHECKLIST = os.path.join(HERE, "architecture-spec.json")


def score_spec(spec_path: str, migration_path: str | None, *, config: dict,
               demand: dict, checklist: dict, root: str = REPO_ROOT) -> dict:
    # Parse the candidate ONCE, share across all three components.
    vocab = fitness.parse_vocab(spec_path, migration_path)
    import yaml as _yaml
    _raw = _yaml.safe_load(open(spec_path).read())
    _doc = _raw if isinstance(_raw, dict) and _raw.get("openapi") else None

    control = control_oracle.evaluate_vocab(vocab, demand)
    arch = architecture_oracle.evaluate(vocab, checklist, _doc)
    cx = fitness.complexity(vocab, config, root=root, doc=_doc)

    # Structural regularity surcharge (soft, behind the structural_terms flag): rewards codes
    # that decompose into registered object.property.action / object.task_type.due primitives.
    conf = conformance_oracle.evaluate_vocab(vocab, conformance_oracle.load_demand_rules())
    irregularity = conformance_oracle.irregularity(conf, config) if config.get("structural_terms") else 0.0

    # Self-consistency GATE: x-actions/x-timers/transitions/refs must resolve. A hard violation
    # (folded into big_penalty) so no minimizing/factoring move can leave the model broken.
    inv = invariant_oracle.evaluate(_doc)

    # Factoring / description-length surcharge (soft, behind structural_terms): rewards extracting
    # repeated field clusters into a composed base. Zero unless the term is enabled.
    fac = factoring_oracle.evaluate(_doc)
    redundancy = factoring_oracle.redundancy_term(fac, config) if config.get("structural_terms") else 0.0

    control_budget = config.get("control_budget", 0)
    arch_budget = config.get("arch_budget", 0)
    big = config.get("big_penalty", 100000)

    control_violations = max(0, control["unregistered_count"] - control_budget)
    arch_violations = max(0, arch["uncovered_count"] - arch_budget)
    invariant_violations = inv["violation_count"]
    violations = control_violations + arch_violations + invariant_violations
    score = violations * big + cx["complexity"] + irregularity + redundancy

    return {
        "spec": spec_path,
        "score": round(score, 4),
        "feasible": violations == 0,
        "violations": {
            "control": control_violations,
            "architecture": arch_violations,
            "invariant": invariant_violations,
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
            # inverse signal: spec supply no control cites (orphan / deletion candidates).
            # informational, NOT a gate — much uncited supply is architecture-required or
            # contract plumbing; the arch gate protects the load-bearing ones. See control_oracle.
            "unused_field_count": control["unused_field_count"],
            "unused_event_count": control["unused_event_count"],
        },
        "complexity": cx["complexity"],
        "complexity_components": cx["components"],
        "irregularity": round(irregularity, 4),
        "regularity": {
            "noncanonical_events": conf["noncanonical_event_count"],
            "noncanonical_timers": conf["noncanonical_timer_count"],
            "namespace_gaps": conf["namespace_gap_count"],
            "scored": bool(config.get("structural_terms")),
        },
        "redundancy": round(redundancy, 4),
        "factoring": {
            "compressible_surplus": fac["redundancy"],
            "mixin_candidates": fac["mixin_candidates"][:5],
            "scored": bool(config.get("structural_terms")),
        },
        "invariant_detail": inv["violations"],
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
              f"architecture={result['violations']['architecture']} "
              f"invariant={result['violations']['invariant']}")
        cov = result["coverage"]
        print(f"  unregistered      : {cov['unregistered_codes']} (budget {cov['control_budget']})")
        print(f"  uncovered arch    : {cov['uncovered_arch_elements']} (budget {cov['arch_budget']})")
        print(f"complexity          : {result['complexity']}")
        comp = result["complexity_components"]
        print(f"  concepts={comp['concepts']} fields={comp['field_count']} "
              f"endpoints={comp['endpoint_count']} tasks={comp['task_type_count']} "
              f"generic={comp['generic_field_count']}")
        reg = result["regularity"]
        tag = "" if reg["scored"] else " (not scored)"
        print(f"irregularity        : {result['irregularity']}{tag}")
        print(f"  noncanon_events={reg['noncanonical_events']} "
              f"noncanon_timers={reg['noncanonical_timers']} "
              f"namespace_gaps={reg['namespace_gaps']}")
        fac = result["factoring"]
        print(f"redundancy          : {result['redundancy']}{'' if fac['scored'] else ' (not scored)'} "
              f"(compressible surplus {fac['compressible_surplus']})")
        for c in fac["mixin_candidates"][:3]:
            print(f"  mixin~{c['anchor']}: {c['fields']} ({c['member_count']} members)")
        if verdict:
            print(f"VERDICT             : {'KEEP' if verdict['keep'] else 'REVERT'} "
                  f"(Δ={verdict['delta']} vs best {verdict['best_score']})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
