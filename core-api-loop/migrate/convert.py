#!/usr/bin/env python3
"""
convert.py — full bespoke <-> OpenAPI-3 conversion for core-api.yaml.

  to_openapi(spec_dict)   bespoke spec dict -> OpenAPI 3 document
  to_specdict(openapi)    OpenAPI 3 document -> bespoke spec dict

The mapping (lossless — see verify_full.py):
  * each resource            -> components/schemas/<Name>      (x-kind, x-states, x-retention,
                                                                properties verbatim incl enum/$ref)
  * each flat-field prefix   -> components/schemas/<prefix>    (x-kind: vocabulary; flat token
                                 'pfx.rest' -> property 'rest' typed by the flat value)
  * event_types/task_types   -> x-event-types / x-task-types
  * state_machines           -> x-state-machines
  * endpoints                -> paths
  * meta                     -> info (+ x-note / x-elements)
  * property $ref            #/schemas/X  <->  #/components/schemas/X  (OpenAPI-valid form)

Because the *bespoke spec dict* round-trips exactly, parse_core_api.build() produces an identical
core-vocabulary.json from either source — so controls and all 26 policies are unaffected.
"""

from __future__ import annotations

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(REPO_ROOT, "scripts"))
import parse_core_api  # noqa: E402
import yaml            # noqa: E402

BESPOKE_REF = "#/schemas/"
OPENAPI_REF = "#/components/schemas/"


def _rewrite_refs(obj, frm: str, to: str):
    """Deep-copy a JSON-schema fragment, rewriting every nested $ref string (incl. inside items)."""
    if isinstance(obj, dict):
        return {k: (v.replace(frm, to) if k == "$ref" and isinstance(v, str)
                    else _rewrite_refs(v, frm, to)) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_rewrite_refs(x, frm, to) for x in obj]
    return obj


def _prop_to_openapi(ps):
    return _rewrite_refs(ps, BESPOKE_REF, OPENAPI_REF) if isinstance(ps, dict) else ps


def _prop_to_bespoke(ps):
    return _rewrite_refs(ps, OPENAPI_REF, BESPOKE_REF) if isinstance(ps, dict) else ps


def to_openapi(spec: dict) -> dict:
    resources = spec.get("resources") or {}
    flat = spec.get("fields") or {}
    meta = spec.get("meta") or {}

    schemas: dict = {}
    for rname, rspec in resources.items():
        sch = {"type": "object", "x-kind": rspec.get("kind")}
        if "states" in rspec:
            sch["x-states"] = rspec["states"]
        if "retention" in rspec:
            sch["x-retention"] = rspec["retention"]
        sch["properties"] = {p: _prop_to_openapi(ps) for p, ps in (rspec.get("properties") or {}).items()}
        schemas[rname] = sch

    vocab: dict = {}
    for token, typ in flat.items():
        prefix, _, rest = token.partition(".")
        vocab.setdefault(prefix, {})[rest] = typ
    for prefix, props in vocab.items():
        schemas[prefix] = {"type": "object", "x-kind": "vocabulary",
                           "properties": {rest: {"type": typ} for rest, typ in props.items()}}

    import re
    paths: dict = {}
    for path, methods in (spec.get("endpoints") or {}).items():
        params = [{"name": n, "in": "path", "required": True, "schema": {"type": "string"}}
                  for n in re.findall(r"\{([^}]+)\}", path)]
        slug = re.sub(r"[^a-z0-9]+", "_", path.lower()).strip("_")
        ops: dict = {}
        for m, opid in (methods or {}).items():
            # unique operationId for tooling/GitBook; original bespoke id kept in x-operation-id
            op = {"operationId": f"{m}_{slug}", "x-operation-id": opid,
                  "responses": {"200": {"description": "OK"}}}
            if params:
                op["parameters"] = params
            ops[m] = op
        paths[path] = ops

    info = {"title": meta.get("spec_title", "Unknown"), "version": str(meta.get("spec_version", "0"))}
    if meta.get("note") is not None:
        info["x-note"] = meta["note"]
    if meta.get("elements") is not None:
        info["x-elements"] = meta["elements"]

    return {
        "openapi": "3.0.3",
        "info": info,
        "paths": paths,
        "components": {"schemas": schemas},
        "x-event-types": list(spec.get("event_types") or []),
        "x-task-types": list(spec.get("task_types") or []),
        "x-state-machines": spec.get("state_machines") or {},
    }


def to_specdict(doc: dict) -> dict:
    schemas = (doc.get("components") or {}).get("schemas") or {}
    resources: dict = {}
    fields: dict = {}
    for key, sch in schemas.items():
        if sch.get("x-kind") == "vocabulary":
            for prop, ps in (sch.get("properties") or {}).items():
                fields[f"{key}.{prop}"] = ps.get("type") if isinstance(ps, dict) else ps
        else:
            rspec: dict = {"kind": sch.get("x-kind")}
            if "x-states" in sch:
                rspec["states"] = sch["x-states"]
            if "x-retention" in sch:
                rspec["retention"] = sch["x-retention"]
            rspec["properties"] = {p: _prop_to_bespoke(ps) for p, ps in (sch.get("properties") or {}).items()}
            resources[key] = rspec

    endpoints: dict = {}
    for path, methods in (doc.get("paths") or {}).items():
        endpoints[path] = {m: (op or {}).get("x-operation-id", (op or {}).get("operationId"))
                           for m, op in (methods or {}).items()}

    info = doc.get("info") or {}
    meta = {"spec_title": info.get("title"), "spec_version": info.get("version")}
    if info.get("x-note") is not None:
        meta["note"] = info["x-note"]
    if info.get("x-elements") is not None:
        meta["elements"] = info["x-elements"]

    return {
        "meta": meta,
        "resources": resources,
        "fields": fields,
        "event_types": list(doc.get("x-event-types") or []),
        "task_types": list(doc.get("x-task-types") or []),
        "state_machines": doc.get("x-state-machines") or {},
        "endpoints": endpoints,
    }


def main(argv) -> int:
    ap = argparse.ArgumentParser(description="Convert bespoke core-api.yaml <-> OpenAPI 3.")
    ap.add_argument("--to-openapi", action="store_true")
    ap.add_argument("-s", "--spec", default=os.path.join(REPO_ROOT, "core-api.yaml"))
    ap.add_argument("-o", "--output", default=os.path.join(REPO_ROOT, "core-api.openapi.yaml"))
    args = ap.parse_args(argv)
    spec = yaml.safe_load(open(args.spec).read())
    doc = to_openapi(spec)
    with open(args.output, "w", encoding="utf-8") as fh:
        yaml.safe_dump(doc, fh, sort_keys=False, default_flow_style=False, width=120, allow_unicode=True)
    print(json.dumps({"wrote": os.path.relpath(args.output, REPO_ROOT),
                      "schemas": len(doc["components"]["schemas"]),
                      "paths": len(doc["paths"]),
                      "event_types": len(doc["x-event-types"]),
                      "task_types": len(doc["x-task-types"]),
                      "state_machines": len(doc["x-state-machines"])}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
