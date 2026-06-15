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

    stamped = 0
    for code, cids in field_controls.items():
        prefix, _, rest = code.partition(".")
        if not rest:
            continue
        skey = prefix_schema.get(prefix)
        if not skey:
            continue
        prop = (schemas[skey].get("properties") or {}).get(rest)
        if isinstance(prop, dict):
            prop["x-bound-controls"] = sorted(cids)
            stamped += 1

    with open(SPEC, "w", encoding="utf-8") as fh:
        yaml.safe_dump(doc, fh, **DUMP_KW)
    print(f"x-bound-controls stamped on {stamped} fields "
          f"(from {len(field_controls)} control-cited field codes across {len(controls.get('controls', []))} controls)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
