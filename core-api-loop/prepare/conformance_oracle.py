#!/usr/bin/env python3
"""
conformance_oracle.py — structural-regularity signal for the spec minimizer.

control_oracle asks "is each demanded code registered?" (presence). This oracle asks
the deeper question the count-based fitness cannot see: are the registered codes
ORGANIZED as `object.property.action` (events) and `object.<task_type>.due_at`
(timers), composed from registered primitives — or a flat pile of opaque codes?

A spec where every code decomposes into registered primitives is more *regular* —
shorter to describe generatively (objects × actions × properties + a grammar) than
N bespoke codes of the same count. That regularity is a real, minimizable form of
description length the element-count complexity term is blind to. This oracle
surfaces it as three crisp signals that drive concrete proposer moves:

  noncanonical_events : demanded event codes whose action tail is NOT a registered
                        action (x-event-types) in the candidate spec. Fix = register
                        the action (a concept — expensive, so only if reused) or
                        normalize the code to an existing action.
  noncanonical_timers : demanded timer codes that are not
                        `object.<registered task_type>.due_at`. Fix = register the
                        task type or fold into the generic Task pattern.
  namespace_gaps      : `object.property` a demanded event implies but the spec does
                        not register as a field. Fix = register the field (the
                        field/event reconciliation move).

Anti-gaming: every signal requires a REAL registered primitive (action ∈ x-event-types,
task_type ∈ x-task-types, property ∈ a schema field) — the same closed-registry
discipline control_oracle enforces. Dot-shape alone earns nothing; the proposer
cannot launder by renaming. Demanded codes come from controls.json (immutable
authored demand), never from the proposer-editable spec.

Reported but deliberately NOT scored: near-duplicate fields (fuzzy — gameable) and
choreography orphans (a property of the demand graph, not fixable by editing the
spec). Those are informational, like control_oracle's unused-supply signal.
"""

from __future__ import annotations

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(REPO_ROOT, "scripts"))

from code_format import decompose, decompose_timer  # canonical decomposition (single source of truth)

CONTROLS = os.path.join(REPO_ROOT, "controls.json")


def load_demand_rules(path: str = CONTROLS) -> dict:
    """Collect the demanded codes from controls.json: event codes, timer codes, event-implied object.property."""
    events: set[str] = set()
    timers: set[str] = set()
    implied_props: set[str] = set()
    if not os.path.exists(path):
        return {"events": events, "timers": timers, "implied_props": implied_props}
    doc = json.load(open(path, encoding="utf-8"))
    for c in doc.get("controls", []):
        for r in c.get("control_rules", []):
            if r.get("trigger_event"):
                events.add(r["trigger_event"])
            events.update(r.get("produced_events") or [])
            if r.get("deadline_timer"):
                timers.add(r["deadline_timer"])
    return {"events": events, "timers": timers, "implied_props": implied_props}


def evaluate_vocab(vocab: dict, demand_rules: dict) -> dict:
    """Score the candidate spec's regularity against the demanded codes."""
    actions = set(vocab.get("event_types", []))
    task_types = set(vocab.get("task_types", []))
    field_paths = {f["path"] for f in vocab.get("fields", []) if f.get("path")}

    noncanon_events, noncanon_timers, gaps = [], [], []

    for code in sorted(demand_rules["events"]):
        obj, prop, action = decompose(code, actions)
        if action is None:
            noncanon_events.append(code)
        if prop is not None:
            op = f"{obj}.{prop}"
            if op not in field_paths:
                gaps.append(op)

    for code in sorted(demand_rules["timers"]):
        _o, _q, tt, marker = decompose_timer(code, task_types)
        if marker is None or tt is None:
            noncanon_timers.append(code)

    gaps = sorted(set(gaps))
    return {
        "noncanonical_event_count": len(noncanon_events),
        "noncanonical_timer_count": len(noncanon_timers),
        "namespace_gap_count": len(gaps),
        "irregularity_count": len(noncanon_events) + len(noncanon_timers) + len(gaps),
        "noncanonical_events": noncanon_events,
        "noncanonical_timers": noncanon_timers,
        "namespace_gaps": gaps,
    }


def irregularity(result: dict, config: dict) -> float:
    """Weighted structural surcharge from score-config.json weights."""
    w = config.get("weights", {})
    return (
        w.get("conformance_event", 1) * result["noncanonical_event_count"]
        + w.get("conformance_timer", 1) * result["noncanonical_timer_count"]
        + w.get("namespace_gap", 1) * result["namespace_gap_count"]
    )


def main(argv: list[str]) -> int:
    sys.path.insert(0, HERE)
    import control_oracle  # reuse its vocab parser for a standalone run
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    ap.add_argument("-s", "--spec", default=os.path.join(REPO_ROOT, "core-api.yaml"))
    ap.add_argument("-m", "--migration", default=os.path.join(REPO_ROOT, "vocab-migration.json"))
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args(argv)

    vocab = control_oracle.parse_vocab(args.spec, args.migration)
    result = evaluate_vocab(vocab, load_demand_rules())

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"noncanonical events : {result['noncanonical_event_count']}")
        print(f"noncanonical timers : {result['noncanonical_timer_count']}")
        print(f"namespace gaps      : {result['namespace_gap_count']}")
        print(f"irregularity (count): {result['irregularity_count']}")
        for label, key in (("events", "noncanonical_events"),
                           ("timers", "noncanonical_timers"),
                           ("gaps", "namespace_gaps")):
            sample = result[key][:6]
            if sample:
                print(f"  sample {label}: {sample}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
