#!/usr/bin/env python3
"""
factor_schemas.py — extract repeated field clusters into base mixins (factor BEFORE binding).

factoring_oracle finds property clusters shared across >= cluster_min schemas (name + routing_number
across the party schemas; id + owner_id; the review_due scheduling shadow). This extracts each strong
cluster into an `x-kind: mixin` base the members compose via allOf:[$ref], so a shared field is
defined once instead of N times.

Pipeline placement: run AFTER the field authors and BEFORE derive_bound_controls / author_descriptions
— "factor before binding". Then the fields are still bare, so structurally-identical copies merge
cleanly; parse_core_api flattens allOf (member paths like beneficiary.name survive — coverage-safe);
and derive_bound_controls resolves through allOf so a control citing an inherited field stamps the
base. The extract is also metadata-aware (union of x-bound-controls) so it is safe to re-run post-bind.

Reproducible + deterministic: extracts every candidate with savings >= MIN_SAVINGS, idempotent.
"""
from __future__ import annotations
import os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(REPO, "core-api-loop", "prepare"))
import yaml
import factoring_oracle
SPEC = os.path.join(REPO, "core-api.yaml")
DUMP = dict(sort_keys=False, default_flow_style=False, width=120, allow_unicode=True)
MIN_SAVINGS = 5
_META = ("x-bound-controls", "description")
_SNAKE = re.compile(r"(?<!^)(?=[A-Z])")


def _struct(d):
    return {k: v for k, v in d.items() if k not in _META} if isinstance(d, dict) else d


def _base_name(anchor: str) -> str:
    return "".join(w.capitalize() for w in re.split(r"[_.]", anchor) if w) + "Base"


def extract_base(schemas: dict, name: str, fields, members) -> bool:
    """Move fields shared (structurally identical) across all members into a new mixin base; members
    compose it via allOf:[$ref]. Metadata-aware: base carries the union of x-bound-controls."""
    member_keys = [k for m in members for k in (
        [m] if m in schemas else [kk for kk in schemas if _SNAKE.sub("_", kk).lower() == _SNAKE.sub("_", m).lower()])]
    member_keys = list(dict.fromkeys(member_keys))
    if name in schemas or len(member_keys) < 2:
        return False
    safe: dict = {}
    for f in fields:
        defs = [(schemas[k].get("properties") or {}).get(f) for k in member_keys]
        if any(d is None for d in defs):
            continue
        if any(not isinstance(d, dict) for d in defs):
            if all(d == defs[0] for d in defs):
                safe[f] = defs[0]
            continue
        if all(_struct(d) == _struct(defs[0]) for d in defs):
            base_def = dict(_struct(defs[0]))
            bound = sorted({c for d in defs for c in (d.get("x-bound-controls") or [])})
            if bound:
                base_def["x-bound-controls"] = bound
            desc = next((d.get("description") for d in defs if d.get("description")), None)
            if desc:
                base_def["description"] = desc
            safe[f] = base_def
    if not safe:
        return False
    ref = {"$ref": f"#/components/schemas/{name}"}
    schemas[name] = {"type": "object", "x-kind": "mixin", "properties": safe,
                     "description": f"Extracted base: fields shared by {len(member_keys)} schemas."}
    for k in member_keys:
        props = schemas[k].get("properties") or {}
        for f in safe:
            props.pop(f, None)
        schemas[k]["properties"] = props
        allof = schemas[k].setdefault("allOf", [])
        if ref not in allof:
            allof.append(ref)
    return True


def main() -> int:
    doc = yaml.safe_load(open(SPEC).read())
    schemas = doc["components"]["schemas"]
    cands = factoring_oracle.evaluate(doc).get("mixin_candidates", [])
    applied = []
    for c in cands:
        if c.get("savings_estimate", 0) < MIN_SAVINGS:
            continue
        name = _base_name(c["anchor"])
        if extract_base(schemas, name, c.get("fields", []), c.get("members", [])):
            applied.append(f"{name}({','.join(c.get('fields', []))} ×{c.get('member_count')})")
    open(SPEC, "w").write(yaml.safe_dump(doc, **DUMP))
    print(f"factored {len(applied)} base mixins: {applied}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
