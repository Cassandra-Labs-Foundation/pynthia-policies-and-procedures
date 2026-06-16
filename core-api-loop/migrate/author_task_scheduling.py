#!/usr/bin/env python3
"""
author_task_scheduling.py — register the task-scheduling code family (Lever A).

The remaining unregistered demand is overwhelmingly the deadline/SLA shadow of the factored tasks:
<subject>.<verb>_due / _due_at / _timer and *_expires_at (e.g. access.review_due_at,
audit.remediation_due). The policies enumerate every task's schedule as its own dotted code; to
register that exact code the path must exist, so each becomes a property on its namespace schema
(same mechanism as author_fields — migration tokens only annotate, they don't register).

Grounding: each code is checked against vocab-migration.json `task_map` (the 336 factored tasks).
A code whose base <subject>.<verb> resolves to a known task is a genuine task deadline; the rest are
scheduling fields not tied to a catalogued task. Both are cited demand and get registered, but the
task_map-validated share is reported so the family stays auditable rather than a blind bulk-add.

Reproducible: bootstraps a committed task-scheduling-overlay.yaml from the live scheduling gap, then
applies it deterministically/idempotently.
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
OVERLAY = os.path.join(HERE, "task-scheduling-overlay.yaml")
DUMP = dict(sort_keys=False, default_flow_style=False, width=120, allow_unicode=True)
_SNAKE = re.compile(r"(?<!^)(?=[A-Z])")
def snake(n): return _SNAKE.sub("_", n).lower()

SCHED_SUFFIXES = ("_due_at", "_due", "_timer")
def is_sched(c): return c.endswith(SCHED_SUFFIXES) or "expires_at" in c


def sched_type(field: str):
    if field.endswith("_at") or "expires_at" in field:
        return {"type": "string", "format": "date-time"}
    if field.endswith("_due"):
        return {"type": "string", "format": "date"}
    return {"type": "string", "description": "Timer/SLA marker."}  # _timer


def base_task_key(code: str) -> str:
    """access.review_due_at -> access_review (the task_map key form)."""
    body = code
    for suf in ("_due_at", "_expires_at", "_due", "_timer"):
        if body.endswith(suf):
            body = body[: -len(suf)]; break
    return body.replace(".", "_")


def bootstrap_overlay() -> dict:
    demand = co.load_demand(DEMAND)
    unreg = co.evaluate(SPEC, demand, MIGRATION)["unregistered"]
    task_map = json.load(open(MIGRATION)).get("task_map") or {}
    fields, grounded = {}, 0
    for c in sorted(unreg):
        if not is_sched(c):
            continue
        ns, _, rest = c.partition(".")
        fields.setdefault(ns, {})[rest or ns] = sched_type(rest or ns)["type"]
        if base_task_key(c) in task_map:
            grounded += 1
    total = sum(len(v) for v in fields.values())
    return {"_note": "Task-scheduling code family (Lever A), bootstrapped from the unregistered "
            "scheduling demand. Each is a task deadline/SLA marker registered as a namespace property. "
            "Reviewable source of truth.",
            "_grounding": f"{grounded}/{total} validated against vocab-migration task_map",
            "fields": dict(sorted(fields.items()))}


def main() -> int:
    if os.path.exists(OVERLAY):
        overlay = yaml.safe_load(open(OVERLAY).read()); src = "committed overlay"
    else:
        overlay = bootstrap_overlay()
        open(OVERLAY, "w").write(yaml.safe_dump(overlay, **DUMP)); src = "bootstrapped (wrote overlay)"

    doc = yaml.safe_load(open(SPEC).read())
    schemas = doc["components"]["schemas"]
    snake_domain = {snake(k): k for k, s in schemas.items()
                    if s.get("x-kind") != "vocabulary" and s.get("x-vocabulary") is not False}
    added = new_schemas = 0
    for ns, fdict in (overlay.get("fields") or {}).items():
        if ns in snake_domain:
            target = snake_domain[ns]
        elif ns in schemas:
            target = ns
        else:
            schemas[ns] = {"type": "object", "x-kind": "vocabulary",
                           "description": f"{ns} vocabulary (control demand)."}
            target = ns; new_schemas += 1
        props = schemas[target].setdefault("properties", {})
        for field in fdict:
            if field not in props:
                props[field] = sched_type(field); added += 1
    open(SPEC, "w").write(yaml.safe_dump(doc, **DUMP))
    print(f"author_task_scheduling ({src}): +{added} scheduling fields ({new_schemas} new schemas)")
    print(f"  grounding: {overlay.get('_grounding','n/a')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
