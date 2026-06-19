#!/usr/bin/env python3
"""
code_format.py — the canonical object.property.action decomposition.

Single source of truth for how an event code splits into its three primitives:

    object . property . action          record.retention_clock.set
    object . action      (no property)  record.disposed   (whole-object lifecycle)

  - object   : the code prefix — a registered entity / noun
  - property : a registered field of that object — the data point that changed
  - action   : a registered action verb (one of x-event-types) — what happened

The action is matched as the longest registered verb the code ends with
(token-aligned on `_`/`.`), so a fused suffix like `retention_clock_set`
resolves to property `retention_clock` + action `set`. A code whose tail is not
a registered action is *non-conforming* — decompose() returns action=None and
canonical() leaves it untouched, so callers can flag it rather than guess.

Dependency-free (standard library only) so the stdlib extractors can import it.

CLI: `python3 scripts/code_format.py` prints a conformance report for every
event code in controls.json against the action registry in core-vocabulary.json.
"""

from __future__ import annotations

import json
import os
import sys


def decompose(code: str, actions: set[str]) -> tuple[str, str | None, str | None]:
    """Split an event code into (object, property, action).

    `actions` is the registered action vocabulary (x-event-types). Returns
    action=None when the code's tail is not a registered action (non-conforming).
    """
    obj, _, rest = code.partition(".")
    norm = rest.replace(".", "_")
    best: str | None = None
    for a in actions:
        if norm == a or norm.endswith("_" + a):
            if best is None or len(a) > len(best):
                best = a
    if best is None:
        return obj, (rest or None), None
    prop = norm[: -len(best)].rstrip("_")
    return obj, (prop or None), best


def canonical(code: str, actions: set[str]) -> str:
    """Return the code in canonical dotted object.property.action form.

    Non-conforming codes (no registered action tail) are returned unchanged.
    """
    obj, prop, action = decompose(code, actions)
    if action is None:
        return code
    return ".".join(p for p in (obj, prop, action) if p)


def event_struct(code: str, actions: set[str]) -> dict:
    """Decompose a code into a serializable {object, property, action, canonical, conforms}."""
    obj, prop, action = decompose(code, actions)
    return {
        "object": obj,
        "property": prop,
        "action": action,
        "canonical": canonical(code, actions),
        "conforms": action is not None,
    }


def load_actions(vocab_path: str) -> set[str]:
    """Load the registered action vocabulary (x-event-types) from core-vocabulary.json."""
    with open(vocab_path, encoding="utf-8") as fh:
        return set(json.load(fh).get("event_types", []))


# --------------------------------------------------------------------------- #
# CLI — conformance report
# --------------------------------------------------------------------------- #

def _main() -> int:
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    actions = load_actions(os.path.join(root, "core-vocabulary.json"))
    controls = json.load(open(os.path.join(root, "controls.json")))

    codes: set[str] = set()
    for c in controls.get("controls", []):
        for r in c.get("control_rules", []):
            if r.get("trigger_event"):
                codes.add(r["trigger_event"])
            codes.update(r.get("produced_events") or [])

    conforming, nonconforming = [], []
    for code in sorted(codes):
        (conforming if decompose(code, actions)[2] else nonconforming).append(code)

    print(f"event codes: {len(codes)}")
    print(f"  conforming (object[.property].action): {len(conforming)} "
          f"({100 * len(conforming) // max(1, len(codes))}%)")
    print(f"  non-conforming (action not registered): {len(nonconforming)}")
    if nonconforming:
        print("\nnon-conforming codes (tail is not a registered action — register or normalize):")
        for code in nonconforming:
            print(f"  {code}")
    return 0


if __name__ == "__main__":
    raise SystemExit(_main())
