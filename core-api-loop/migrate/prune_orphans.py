#!/usr/bin/env python3
"""
prune_orphans.py — remove authored codes that no (canonical) control cites.

After the .claude worktree contamination fix, 174 of the codes authored by author_fields /
author_task_scheduling were cited ONLY by phantom worktree policies. With the demand recomputed
from the canonical policy tree they are pure unused supply. This removes exactly that set:
  * drops the orphan code from its committed overlay (the source of truth stays accurate),
  * deletes the backing schema property (and any vocab schema left empty),
  * deletes orphan as:event tokens from vocab-migration.

Safe + reproducible: it only removes codes absent from the live demand, so the control gap cannot
rise. Idempotent. Run -> normalize_spec -> derive_bound_controls -> regenerate artifacts.
"""
from __future__ import annotations
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
PREPARE = os.path.join(REPO, "core-api-loop", "prepare")
sys.path.insert(0, PREPARE)
import yaml
import control_oracle as co
SPEC = os.path.join(REPO, "core-api.yaml")
MIGRATION = os.path.join(REPO, "vocab-migration.json")
DEMAND = os.path.join(PREPARE, "demand.json")
OVERLAYS = [os.path.join(HERE, "fields-overlay.yaml"),
            os.path.join(HERE, "task-scheduling-overlay.yaml")]
DUMP = dict(sort_keys=False, default_flow_style=False, width=120, allow_unicode=True)
_SNAKE = re.compile(r"(?<!^)(?=[A-Z])")
def snake(n): return _SNAKE.sub("_", n).lower()


def main() -> int:
    demand = set(co.load_demand(DEMAND)["codes"])
    doc = yaml.safe_load(open(SPEC).read())
    schemas = doc["components"]["schemas"]
    snake_domain = {snake(k): k for k, s in schemas.items()
                    if s.get("x-kind") != "vocabulary" and s.get("x-vocabulary") is not False}

    dropped_fields = dropped_events = dropped_schemas = 0
    pruned_event_codes: set[str] = set()   # only OUR overlay events, so pre-existing orphans are left alone

    for path in OVERLAYS:
        ov = yaml.safe_load(open(path).read())
        # fields
        for ns in list((ov.get("fields") or {}).keys()):
            for field in list(ov["fields"][ns].keys()):
                code = f"{ns}.{field}"
                if code in demand:
                    continue
                del ov["fields"][ns][field]            # prune overlay
                target = snake_domain.get(ns, ns if ns in schemas else None)
                if target and field in (schemas.get(target, {}).get("properties") or {}):
                    del schemas[target]["properties"][field]
                    dropped_fields += 1
            if not ov["fields"][ns]:
                del ov["fields"][ns]
        # events (fields-overlay only)
        for code in list((ov.get("events") or {}).keys()):
            if code not in demand:
                del ov["events"][code]; pruned_event_codes.add(code)
        open(path, "w").write(yaml.safe_dump(ov, **DUMP))

    # drop vocab schemas left empty by the prune (they contribute nothing)
    for k in list(schemas.keys()):
        s = schemas[k]
        if s.get("x-kind") == "vocabulary" and not (s.get("properties") or {}):
            del schemas[k]; dropped_schemas += 1
    open(SPEC, "w").write(yaml.safe_dump(doc, **DUMP))

    # drop ONLY the migration event tokens we authored and just pruned (not pre-existing orphans —
    # those are out of scope; uncited != safe-to-delete for vocabulary we didn't add).
    mig = json.load(open(MIGRATION))
    for code in pruned_event_codes:
        if code in mig["migration"]:
            del mig["migration"][code]; dropped_events += 1
    mig["meta"]["tokens"] = len(mig["migration"])
    json.dump(mig, open(MIGRATION, "w"), indent=2)

    print(f"pruned: {dropped_fields} fields, {dropped_events} event tokens, "
          f"{dropped_schemas} now-empty vocab schemas")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
