#!/usr/bin/env python3
"""
enrich_openapi.py — make core-api.yaml render organized in GitBook / Swagger UI.

OpenAPI renderers build the sidebar from operation `tags`. Our generated spec had none, so every
endpoint landed in one ungrouped blob. This adds, idempotently:
  * a `tags: [<Resource>]` on every operation, derived from the first path segment
    (/loan-applications/{id}/decision -> tag "Loan Applications")
  * a readable `summary` derived from the operationId (list_cases -> "List cases")
  * a top-level `tags:` list (sorted, with descriptions) so GitBook shows ordered sections

Tags/summaries are ignored by scripts/parse_core_api.py's adapter, so core-vocabulary.json — and
controls + all policies — are unchanged (verified after running). Re-runnable: only fills gaps.
"""

from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
import yaml  # noqa: E402

SPEC = os.path.join(REPO_ROOT, "core-api.yaml")
DUMP_KW = dict(sort_keys=False, default_flow_style=False, width=120, allow_unicode=True)
METHODS = ("get", "post", "put", "patch", "delete")


def _titlecase(segment: str) -> str:
    return " ".join(w.capitalize() for w in segment.replace("_", "-").split("-") if w)


def _tag_for(path: str) -> str:
    seg = path.strip("/").split("/")[0]
    return _titlecase(seg) if seg else "Default"


def _summary_from(op: dict, method: str, path: str) -> str:
    oid = op.get("x-operation-id") or op.get("operationId") or ""
    if oid:
        s = oid.replace("_", " ").strip()
        return s[:1].upper() + s[1:]
    return f"{method.upper()} {path}"


def main() -> int:
    doc = yaml.safe_load(open(SPEC, encoding="utf-8").read())
    if not (isinstance(doc, dict) and doc.get("openapi")):
        sys.exit("core-api.yaml is not an OpenAPI document.")

    tags_used: dict[str, None] = {}
    for path, methods in (doc.get("paths") or {}).items():
        tag = _tag_for(path)
        tags_used[tag] = None
        for method, op in (methods or {}).items():
            if method.lower() not in METHODS or not isinstance(op, dict):
                continue
            if not op.get("tags"):
                op["tags"] = [tag]
            if not op.get("summary"):
                op["summary"] = _summary_from(op, method, path)

    # top-level tags list (sorted) for sidebar order + section descriptions
    existing = {t["name"]: t for t in (doc.get("tags") or []) if isinstance(t, dict) and "name" in t}
    for name in tags_used:
        existing.setdefault(name, {"name": name, "description": f"{name} operations."})
    doc["tags"] = [existing[n] for n in sorted(existing)]

    with open(SPEC, "w", encoding="utf-8") as fh:
        yaml.safe_dump(doc, fh, **DUMP_KW)
    print(f"tagged {len(doc.get('paths') or {})} paths into {len(doc['tags'])} groups: "
          f"{[t['name'] for t in doc['tags']]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
