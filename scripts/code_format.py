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


def decompose_timer(code: str, task_types: set[str]) -> tuple[str, str | None, str | None, str | None]:
    """Split a deadline timer code into (object, qualifier, task_type, marker).

    A timer is the obligation facet of an object, the Task primitive in code form:
    `object.[qualifier.]<task_type>.due_at`. The `due_at`/`due` marker identifies
    it as a deadline; the trailing registered task type (one of x-task-types) is
    the obligation kind. `access.review_due_at` -> (access, None, review, due_at);
    `capital.annual_review_due_at` -> (capital, annual, review, due_at).

    marker=None when the code carries no due marker (not a timer / non-conforming);
    task_type=None when the obligation tail is not a registered task type.
    """
    obj, _, rest = code.partition(".")
    norm = rest.replace(".", "_")
    marker: str | None = None
    for m in ("_expires_at", "_due_at", "_due", "_timer"):
        if norm.endswith(m):
            marker, norm = m.lstrip("_"), norm[: -len(m)]
            break
    if marker is None:
        return obj, (rest or None), None, None
    best: str | None = None
    for t in task_types:
        if norm == t or norm.endswith("_" + t):
            if best is None or len(t) > len(best):
                best = t
    qualifier = norm[: -len(best)].rstrip("_") if best else norm
    return obj, (qualifier or None), best, marker


def timer_struct(code: str, task_types: set[str]) -> dict:
    """Decompose a timer into a serializable Task record {object, task_type, …, conforms}."""
    obj, qualifier, task_type, marker = decompose_timer(code, task_types)
    canon = ".".join(p for p in (obj, qualifier, task_type, marker) if p)
    return {
        "object": obj,
        "qualifier": qualifier,
        "task_type": task_type,
        "marker": marker,
        "canonical": canon,
        "conforms": marker is not None and task_type is not None,
    }


def canonical_code(code: str, actions: set[str], task_types: set[str]) -> str:
    """Unified canonical form across BOTH grammars: try the event grammar
    (object.property.action), then the timer grammar (object.[qualifier.]task_type.due_at),
    else return the code unchanged. This is the single normalization the pipeline applies to every
    cited/registered code, so a fused timer like `account.maturity_notice_due_at` lands in the same
    dotted form on both the supply (core-vocabulary) and demand (controls) sides."""
    ev = canonical(code, actions)
    if ev != code:
        return ev
    tm = timer_struct(code, task_types)
    if tm["conforms"]:
        return tm["canonical"]
    return code


def load_actions(vocab_path: str) -> set[str]:
    """Load the registered action vocabulary (x-event-types) from core-vocabulary.json."""
    with open(vocab_path, encoding="utf-8") as fh:
        return set(json.load(fh).get("event_types", []))


def load_task_types(vocab_path: str) -> set[str]:
    """Load the registered task-type vocabulary (x-task-types) from core-vocabulary.json."""
    with open(vocab_path, encoding="utf-8") as fh:
        return set(json.load(fh).get("task_types", []))


# --------------------------------------------------------------------------- #
# CLI — conformance report
# --------------------------------------------------------------------------- #

def _main() -> int:
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    vocab_path = os.path.join(root, "core-vocabulary.json")
    actions = load_actions(vocab_path)
    task_types = load_task_types(vocab_path)
    controls = json.load(open(os.path.join(root, "controls.json")))

    codes: set[str] = set()
    for c in controls.get("controls", []):
        for r in c.get("control_rules", []):
            if r.get("trigger_event"):
                codes.add(r["trigger_event"])
            codes.update(r.get("produced_events") or [])

    # A code conforms under EITHER grammar: an event (object.property.action) or a timer
    # (object.[qualifier.]task_type.due_at). Checking only the event grammar wrongly flags every
    # timer as non-conforming.
    conforming, nonconforming = [], []
    for code in sorted(codes):
        ok = decompose(code, actions)[2] is not None or timer_struct(code, task_types)["conforms"]
        (conforming if ok else nonconforming).append(code)

    print(f"codes: {len(codes)}")
    print(f"  conforming (event object.property.action OR timer object.task_type.due_at): "
          f"{len(conforming)} ({100 * len(conforming) // max(1, len(codes))}%)")
    print(f"  non-conforming (tail not a registered action or task type): {len(nonconforming)}")
    if nonconforming:
        print("\nnon-conforming codes (tail is not a registered action — register or normalize):")
        for code in nonconforming:
            print(f"  {code}")
    return 0


if __name__ == "__main__":
    raise SystemExit(_main())
