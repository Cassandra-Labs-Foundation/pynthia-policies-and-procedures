#!/usr/bin/env python3
"""
author_paths.py — make the spec's paths section describe the RUNNING router.

Until this step, paths: was the July design prototype: 143 operations of which
119 had no handler, while 345 live routes were invisible to the spec. Nothing
consumed paths (the verifier — its only intended consumer — was broken), so it
drifted freely. This step imports the router's own route table as the paths
section, after which scripts/check_route_parity.py keeps the two welded.

For every route in api/index.ts:
  - if the old spec had a matching operation (same method + path shape), its
    authored content (summary, parameters, requestBody, responses, x-*) is
    KEPT — that design work is real — rekeyed to the router's parameter names;
  - otherwise a minimal honest operation is created: summary from the
    handler's own doc comment, a 2XX/4XX response stub explicitly marked as
    not-yet-authored, and no fabricated schemas.
Every operation gains:
  x-handler   "module.function" (or "index.ts (inline)")
  x-audience  partner | public | internal
                partner  = PARTNER_SURFACE in route_gating.test.ts
                public   = route declares public: true
                internal = everything else (actors-gated or handler-gated)
  x-tier      the route's rate/authz tier
  x-actors    the route-level actors gate, when present

Old operations with NO live route move verbatim to x-proposed-paths — design
intent is kept, but it can no longer masquerade as description.

One-time + idempotent (re-running re-derives from the current router).
"""

from __future__ import annotations

import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(REPO_ROOT, "scripts"))
import yaml  # noqa: E402
import code_format  # noqa: E402
import spec_io  # noqa: E402

SPEC = os.path.join(REPO_ROOT, "core", "core-api.yaml")
API = os.path.join(REPO_ROOT, "core", "supabase", "functions", "api")
DUMP_KW = dict(sort_keys=False, default_flow_style=False, width=120, allow_unicode=True)

# body may not contain */ — this pins the comment to the export it directly
# precedes; a lazy .*? from an EARLIER comment could swallow intervening code
FN_DOC = re.compile(
    r"/\*\*((?:[^*]|\*(?!/))*)\*/\s*\nexport (?:async )?function ([A-Za-z0-9_]+)")


def parse_router():
    # the shared route-table parser — scripts/route_table.py owns the regexes
    import route_table
    return route_table.parse_routes(API)


def partner_surface():
    t = open(os.path.join(API, "route_gating.test.ts")).read()
    block = t[t.index("PARTNER_SURFACE = new Set(["):]
    block = block[:block.index("]);")]
    return set(re.findall(r'"([A-Z]+ /[^"]*)"', block))


def handler_summaries():
    out = {}
    for f in os.listdir(API):
        if not f.endswith(".ts") or f.endswith(".test.ts"):
            continue
        for doc, name in FN_DOC.findall(open(os.path.join(API, f)).read()):
            lines = [re.sub(r"^\s*\*\s?", "", ln).strip() for ln in doc.strip().splitlines()]
            lines = [ln for ln in lines if ln]
            if not lines:
                continue
            first = lines[0]
            # doc comments usually open with the route and body shape
            # ("POST /x {a, b} — does y"); strip both, keep the prose
            m = re.match(r"^(?:GET|POST|PUT|PATCH|DELETE)\s+\S+\s*(?:\{[^}]*\}\s*)?"
                         r"(?:[-—–]\s*)?(.*)$", first)
            summary = (m.group(1) if m else first).strip()
            if not summary:
                for ln in lines[1:]:
                    cand = ln.strip()
                    if cand and not cand.startswith("{"):
                        summary = cand
                        break
            if summary and not summary.startswith("{"):
                out[name] = summary.rstrip(".")[:160]
    return out


# annotations a stub rebuild must preserve — hand-applied policy, not derivable
CARRY_KEYS = ("x-route", "x-ui-surface", "x-audience", "parameters", "security", "tags")

norm = code_format.norm_path


def rekey_params(op, old_path, new_path):
    """Rename path-level {param} placeholders (and matching parameter objects)
    from the old spec spelling to the router's."""
    old_names = re.findall(r"\{([^}]+)\}", old_path)
    new_names = re.findall(r"\{([^}]+)\}", new_path)
    mapping = dict(zip(old_names, new_names))
    for p in op.get("parameters", []) or []:
        if isinstance(p, dict) and p.get("in") == "path" and p.get("name") in mapping:
            p["name"] = mapping[p["name"]]
    return op


def main() -> int:
    doc = spec_io.load_spec(SPEC)
    if not (isinstance(doc, dict) and doc.get("openapi")):
        sys.exit("core-api.yaml is not an OpenAPI document.")
    routes = parse_router()
    partner = partner_surface()
    summaries = handler_summaries()

    old_paths = doc.get("paths") or {}
    old_by_norm = {}
    for p, methods in old_paths.items():
        for m, op in (methods or {}).items():
            old_by_norm[(m.upper(), norm(p))] = (p, op)

    new_paths = {}
    created = 0
    for r in routes:
        ep = f'{r["method"]} {r["path"]}'
        audience = ("public" if r["public"]
                    else "partner" if ep in partner
                    else "internal")
        key = (r["method"], norm(r["path"]))
        existing = old_by_norm.get(key)
        # ops carrying our own not-yet-authored stub are re-derivable, not
        # authored content — rebuild them so summary fixes propagate on re-run
        is_stub = (existing is not None and "not yet authored"
                   in ((existing[1].get("responses") or {}).get("2XX") or {})
                   .get("description", ""))
        if existing is not None and not is_stub:
            old_p, op = existing
            op = rekey_params(dict(op), old_p, r["path"])
        else:
            # a rebuilt stub must KEEP hand-applied annotations — or a re-run
            # would silently unroute bespoke entries and cut the UI surface
            # (found the hard way in review)
            carried = ({k: existing[1][k] for k in CARRY_KEYS if k in existing[1]}
                       if existing else {})
            summary = summaries.get(r["handler"] or "", "")
            op = {
                "summary": summary or f'{r["method"]} {r["path"]}',
                "operationId": re.sub(r"(?<!^)(?=[A-Z0-9])", "_", r["handler"]).lower()
                               if r["handler"] else ep.lower().replace(" ", "_").replace("/", "_"),
                "responses": {
                    "2XX": {"description": "Success. Response contract not yet "
                                           "authored — the handler is the contract; "
                                           "see x-handler."},
                    "4XX": {"description": "Validation, authorization, or not-found "
                                           "per the standard error envelope."},
                },
            }
            op.update(carried)
            created += 1
        op["x-handler"] = (f'{r["module"]}.{r["handler"]}' if r["handler"]
                           else "index.ts (inline)")
        # the SPEC owns x-audience once stamped — the partner_surface() seed
        # (read from route_gating.test.ts) applies only to first-time ops, so
        # reformatting the test's literal can never silently reclassify an
        # operation on re-run
        op.setdefault("x-audience", audience)
        op["x-tier"] = r["tier"]
        if r["actors"]:
            op["x-actors"] = r["actors"]
        else:
            op.pop("x-actors", None)
        new_paths.setdefault(r["path"], {})[r["method"].lower()] = op

    matched = {(r["method"], norm(r["path"])) for r in routes} & set(old_by_norm)
    proposed = {}
    for (m, np), (p, op) in old_by_norm.items():
        if (m, np) not in matched:
            proposed.setdefault(p, {})[m.lower()] = op

    doc["paths"] = {p: new_paths[p] for p in sorted(new_paths)}
    if proposed:
        doc["x-proposed-paths"] = {p: proposed[p] for p in sorted(proposed)}
        doc.setdefault("info", {})["x-proposed-note"] = (
            "x-proposed-paths holds designed-but-unimplemented operations moved "
            "out of paths on 2026-08-03 so the paths section describes only the "
            "running router (gated by scripts/check_route_parity.py). Promote an "
            "entry back into paths by implementing and routing its handler.")

    spec_io.dump_spec(doc, SPEC)

    n_props = sum(len(v) for v in proposed.values())
    print(f"paths rebuilt from the router: {len(routes)} operations "
          f"({len(matched)} kept authored content, {created} created minimal); "
          f"{n_props} unimplemented operations moved to x-proposed-paths.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
