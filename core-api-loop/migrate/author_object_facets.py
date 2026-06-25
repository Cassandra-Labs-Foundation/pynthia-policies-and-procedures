#!/usr/bin/env python3
"""
author_object_facets.py — make each object schema self-contained.

The core models one object across four facets that today live in four disconnected
registries: properties (schema fields), events (x-event-types + embedded codes),
lifecycle (x-states), and obligations (per-domain *_due_at fields). This step folds
the last three onto the object schema they belong to, derived from x-control-rules:

  - x-actions : the events this object emits — {action, property, transitions_to}.
                Built from every rule trigger/produced whose object is this schema.
                transitions_to is wired when the action name matches one of the
                object's declared x-states (a state is the codomain of an action).
  - x-timers  : the obligations owed by this object — {task_type, qualifier}. Built
                from every rule deadline whose object is this schema. This is the
                Task primitive (subject_ref=object, type=task_type) in schema form,
                replacing the bespoke per-domain *_due_at field.
  - x-states  : augmented in place — left as authored, but each state now has an
                action that reaches it (see x-actions.transitions_to), so the flat
                list becomes a graph (states = nodes, actions = edges).

Source of truth stays the EVENTS tables (via controls.json). This only re-projects
them onto the objects. Additive + idempotent: re-run after controls.json changes.
A report at the end flags objects that emit actions but have no schema, and objects
with x-states whose states no action reaches (unwired lifecycle to author).
"""

from __future__ import annotations

import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
import yaml  # noqa: E402

SPEC = os.path.join(REPO_ROOT, "core-api.yaml")
CONTROLS = os.path.join(REPO_ROOT, "controls.json")
DUMP_KW = dict(sort_keys=False, default_flow_style=False, width=120, allow_unicode=True)
_SNAKE = re.compile(r"(?<!^)(?=[A-Z])")


def _snake(n: str) -> str:
    return _SNAKE.sub("_", n).lower()


def build_prefix_map(schemas: dict) -> dict[str, str]:
    """object prefix -> schema key (resources by snake name, vocab schemas by key)."""
    prefix_schema: dict[str, str] = {}
    for key, s in schemas.items():
        if s.get("x-vocabulary") is False:
            continue
        prefix = key if s.get("x-kind") == "vocabulary" else _snake(key)
        prefix_schema[prefix] = key
    return prefix_schema


def main() -> int:
    doc = yaml.safe_load(open(SPEC, encoding="utf-8").read())
    if not (isinstance(doc, dict) and doc.get("openapi")):
        sys.exit("core-api.yaml is not an OpenAPI document.")
    controls = json.load(open(CONTROLS))
    schemas = doc.get("components", {}).get("schemas", {})
    prefix_schema = build_prefix_map(schemas)

    # object -> {actions: {name: {properties:set, transitions_to:set}}, timers: {(tt,qual)}}
    actions: dict[str, dict[str, dict[str, set]]] = {}
    timers: dict[str, set[tuple]] = {}

    def add_action(ev: dict | None):
        if not ev or not ev.get("object") or not ev.get("action"):
            return
        o, a, p = ev["object"], ev["action"], ev.get("property")
        rec = actions.setdefault(o, {}).setdefault(a, {"properties": set(), "transitions_to": set()})
        if p:
            rec["properties"].add(p)

    for c in controls.get("controls", []):
        for r in c.get("control_rules", []):
            add_action(r.get("trigger"))
            for ev in r.get("produced", []):
                add_action(ev)
            d = r.get("deadline")
            if d and d.get("object") and d.get("task_type"):
                timers.setdefault(d["object"], set()).add((d["task_type"], d.get("qualifier")))

    objects_seen = set(actions) | set(timers)
    stamped = unmapped = 0
    unwired_states: dict[str, list[str]] = {}

    for obj in sorted(objects_seen):
        skey = prefix_schema.get(obj)
        if not skey:
            unmapped += 1
            continue
        schema = schemas[skey]
        states = set(schema.get("x-states") or [])

        # x-actions, wiring transitions_to where the action reaches a declared state
        reached: set[str] = set()
        xacts = []
        for name in sorted(actions.get(obj, {})):
            rec = actions[obj][name]
            entry = {"action": name}
            if rec["properties"]:
                entry["properties"] = sorted(rec["properties"])
            if name in states:
                entry["transitions_to"] = name
                reached.add(name)
            xacts.append(entry)
        if xacts:
            schema["x-actions"] = xacts

        # x-timers (the Task obligations this object owes)
        xtimers = []
        for tt, qual in sorted(timers.get(obj, set()), key=lambda x: (x[0], x[1] or "")):
            e = {"task_type": tt}
            if qual:
                e["qualifier"] = qual
            xtimers.append(e)
        if xtimers:
            schema["x-timers"] = xtimers

        if states and (states - reached):
            unwired_states[skey] = sorted(states - reached)
        stamped += 1

    with open(SPEC, "w", encoding="utf-8") as fh:
        yaml.safe_dump(doc, fh, **DUMP_KW)

    n_act = sum(len(v) for v in actions.values())
    n_tim = sum(len(v) for v in timers.values())
    print(f"object facets stamped on {stamped} schemas: "
          f"{n_act} actions, {n_tim} timers across {len(objects_seen)} objects.")
    print(f"  objects with no matching schema (gap): {unmapped}")
    print(f"  schemas with x-states not reached by any action (lifecycle to wire): {len(unwired_states)}")
    for k, miss in list(unwired_states.items())[:8]:
        print(f"    {k}: {miss}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
