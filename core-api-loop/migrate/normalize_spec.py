#!/usr/bin/env python3
"""
normalize_spec.py — reproducible spec hygiene passes (re-runnable, vocab-safe).

  1. Drop info.x-elements — a hand-maintained self-count that drifted (claimed endpoints:27 /
     fields:1301 while the spec has 77 paths / 269 schemas). An auditable artifact shouldn't carry
     a self-description that misstates its own contents; the real counts live in core-vocabulary.json.
  2. Resource-qualify bare x-operation-ids (list -> list_incident) so they're unique, matching the
     banking-core block's scheme. Only the endpoint summary derives from x-operation-id, so this is
     vocabulary-safe.
  3. Type discipline: *_count fields -> integer (a count is not a float); appraisal.value -> integer
     (a dollar figure). Field PATHS are unchanged, so controls and policies are unaffected.
"""

from __future__ import annotations

import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
import yaml  # noqa: E402

SPEC = os.path.join(REPO_ROOT, "core-api.yaml")
DUMP_KW = dict(sort_keys=False, default_flow_style=False, width=120, allow_unicode=True)
_SNAKE = re.compile(r"(?<!^)(?=[A-Z])")
VERBS = {"list", "get", "create", "update", "delete", "transition", "open"}
MONEY_VALUE_FIELDS = {("appraisal", "value")}  # 'value' fields that are dollar amounts


def _snake(n): return _SNAKE.sub("_", n).lower()
def _plural(s): return s[:-1] + "ies" if s.endswith("y") else (s + "es" if s.endswith(("s", "x", "ch", "sh")) else s + "s")


def main() -> int:
    doc = yaml.safe_load(open(SPEC, encoding="utf-8").read())
    if not (isinstance(doc, dict) and doc.get("openapi")):
        sys.exit("core-api.yaml is not an OpenAPI document.")
    schemas = doc.get("components", {}).get("schemas", {})

    # 1. drop stale self-count
    dropped = doc.get("info", {}).pop("x-elements", None) is not None

    # 2. resource-qualify bare x-operation-ids
    plural_map = {_plural(_snake(k)).replace("_", "-"): _snake(k) for k, s in schemas.items()
                  if s.get("x-kind") != "vocabulary" and s.get("x-vocabulary") is not False}
    qualified = 0
    for path, methods in (doc.get("paths") or {}).items():
        res = plural_map.get(path.strip("/").split("/")[0])
        for m, op in (methods or {}).items():
            if not isinstance(op, dict):
                continue
            xoid = op.get("x-operation-id")
            if xoid and "_" not in xoid and xoid in VERBS and res:
                op["x-operation-id"] = f"{xoid}_{res}"
                qualified += 1

    # 3. type discipline
    fixed_counts = fixed_value = 0
    for name, s in schemas.items():
        for prop, ps in (s.get("properties") or {}).items():
            if not isinstance(ps, dict) or ps.get("type") != "number":
                continue
            if "count" in prop.lower():
                ps["type"] = "integer"; fixed_counts += 1
            elif (name, prop) in MONEY_VALUE_FIELDS:
                ps["type"] = "integer"; fixed_value += 1

    with open(SPEC, "w", encoding="utf-8") as fh:
        yaml.safe_dump(doc, fh, **DUMP_KW)
    print(f"dropped x-elements: {dropped} | x-operation-ids qualified: {qualified} | "
          f"count fields -> integer: {fixed_counts} | value fields -> integer: {fixed_value}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
