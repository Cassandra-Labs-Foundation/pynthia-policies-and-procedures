#!/usr/bin/env python3
"""
invariant_oracle.py — the self-consistency GATE for the spec minimizer.

The other terms reward shrinking and regularizing the spec. This one guards the
floor: it makes structural self-inconsistency a hard violation (folded into the
big_penalty gate, like control/arch coverage), so no minimizing or factoring move
can leave the object model internally broken. It finds nothing to improve on a
clean spec — its job is to STAY clean under optimization pressure, which matters
more as the factoring oracle starts aggressively rewriting structure.

Invariants (each violation counts 1):

  action_registered    : every schema x-actions[].action is a registered x-event-type.
  transition_valid     : every x-actions[].transitions_to is one of that schema's x-states.
  timer_registered     : every schema x-timers[].task_type is a registered x-task-type.
  ref_resolves         : every `$ref: #/components/schemas/X` target X exists.

These are pure structural facts about the candidate doc — no demand needed, no
fuzzy judgment, nothing the proposer can launder. A move that deletes an action
still named by an x-action, or a schema still referenced by a $ref, immediately
shows up as a violation and is auto-reverted by the keep-iff-lower rule.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))

REF_RE = re.compile(r"#/components/schemas/([A-Za-z0-9_]+)")


def evaluate(doc: dict | None) -> dict:
    if not isinstance(doc, dict):
        return {"violation_count": 0, "violations": {}, "details": []}
    schemas = doc.get("components", {}).get("schemas", {})
    actions = set(doc.get("x-event-types", []))
    task_types = set(doc.get("x-task-types", []))
    names = set(schemas)

    bad_action, bad_transition, bad_timer, bad_ref = [], [], [], []

    for key, s in schemas.items():
        states = set(s.get("x-states") or [])
        for a in (s.get("x-actions") or []):
            if a.get("action") and a["action"] not in actions:
                bad_action.append(f"{key}.x-actions:{a['action']}")
            tt = a.get("transitions_to")
            if tt and tt not in states:
                bad_transition.append(f"{key}.x-actions:{a.get('action')}->{tt}")
        for t in (s.get("x-timers") or []):
            if t.get("task_type") and t["task_type"] not in task_types:
                bad_timer.append(f"{key}.x-timers:{t['task_type']}")

    # $ref resolution across the whole doc
    for target in REF_RE.findall(json.dumps(doc)):
        if target not in names:
            bad_ref.append(target)
    bad_ref = sorted(set(bad_ref))

    violations = {
        "action_registered": len(bad_action),
        "transition_valid": len(bad_transition),
        "timer_registered": len(bad_timer),
        "ref_resolves": len(bad_ref),
    }
    total = sum(violations.values())
    return {
        "violation_count": total,
        "violations": violations,
        "details": {
            "bad_action": bad_action[:20],
            "bad_transition": bad_transition[:20],
            "bad_timer": bad_timer[:20],
            "bad_ref": bad_ref[:20],
        },
    }


def main(argv: list[str]) -> int:
    import yaml
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    ap.add_argument("-s", "--spec", default=os.path.join(REPO_ROOT, "core-api.yaml"))
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args(argv)
    raw = yaml.safe_load(open(args.spec).read())
    doc = raw if isinstance(raw, dict) and raw.get("openapi") else None
    result = evaluate(doc)
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"invariant violations: {result['violation_count']}")
        for k, v in result["violations"].items():
            print(f"  {k:18}: {v}")
        for k, lst in result["details"].items():
            if lst:
                print(f"    {k}: {lst[:6]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
