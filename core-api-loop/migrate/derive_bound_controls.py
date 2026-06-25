#!/usr/bin/env python3
"""
derive_bound_controls.py — wire the bidirectional contract by deriving x-bound-controls.

The architecture's whole feedback-loop premise — "renaming wire.originator.address breaks BA-03" —
needs each field to know which controls depend on it. That binding is NOT invented: controls.json
already records, per control, the registered field codes it cites. This inverts that mapping
(field -> [control ids]) and stamps `x-bound-controls` onto the matching OpenAPI schema property.

Reproducible + grounded: re-run after any controls.json regeneration. It only ADDS metadata to
existing properties (path/type untouched), so core-vocabulary.json and the policies are unaffected.
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


def _snake(n): return _SNAKE.sub("_", n).lower()


def main() -> int:
    doc = yaml.safe_load(open(SPEC, encoding="utf-8").read())
    if not (isinstance(doc, dict) and doc.get("openapi")):
        sys.exit("core-api.yaml is not an OpenAPI document.")
    controls = json.load(open(CONTROLS))

    # field code -> sorted [control ids]
    field_controls: dict[str, set] = {}
    for c in controls.get("controls", []):
        cid = c.get("control_id")
        for code in (c.get("api_references") or {}).get("fields", []):
            field_controls.setdefault(code, set()).add(cid)

    # prefix -> schema (resources by snake name, vocab schemas by key)
    schemas = doc.get("components", {}).get("schemas", {})
    prefix_schema: dict[str, str] = {}
    for key, s in schemas.items():
        if s.get("x-vocabulary") is False:
            continue
        prefix_schema[_snake(key) if s.get("x-kind") != "vocabulary" else key] = key

    # Clear existing bindings first so re-runs are idempotent: a base property accumulates the
    # UNION across the members that cite it (below), so without a reset a re-run would keep stale
    # control ids from a prior derivation.
    for s in schemas.values():
        for p in (s.get("properties") or {}).values():
            if isinstance(p, dict):
                p.pop("x-bound-controls", None)

    def resolve_prop(skey, rest, seen=None):
        """Find a property in a schema OR its allOf:[$ref] bases — a field factored into a base
        is cited under the member's path but owned by the base, so the binding belongs on the base.
        Multiple members citing the same inherited field accumulate onto the one base property."""
        seen = seen or set()
        if skey in seen:
            return None
        sch = schemas.get(skey) or {}
        prop = (sch.get("properties") or {}).get(rest)
        if isinstance(prop, dict):
            return prop
        for item in (sch.get("allOf") or []):
            ref = item.get("$ref") if isinstance(item, dict) else None
            if isinstance(ref, str) and ref.startswith("#/components/schemas/"):
                r = resolve_prop(ref.rsplit("/", 1)[-1], rest, seen | {skey})
                if r is not None:
                    return r
        return None

    stamped = 0
    for code, cids in field_controls.items():
        prefix, _, rest = code.partition(".")
        if not rest:
            continue
        skey = prefix_schema.get(prefix)
        if not skey:
            continue
        prop = resolve_prop(skey, rest)
        if isinstance(prop, dict):
            # union, since a base property is shared by multiple members that may cite distinct controls
            prop["x-bound-controls"] = sorted(set(prop.get("x-bound-controls") or []) | set(cids))
            stamped += 1

    with open(SPEC, "w", encoding="utf-8") as fh:
        yaml.safe_dump(doc, fh, **DUMP_KW)
    print(f"x-bound-controls stamped on {stamped} fields "
          f"(from {len(field_controls)} control-cited field codes across {len(controls.get('controls', []))} controls)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
