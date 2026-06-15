#!/usr/bin/env python3
"""
author_contracts.py — fill in OpenAPI request/response contracts for the endpoints.

Layer 1: shared components authored once, grounded in architecture-decisions.md
  * Error / ValidationError  (D12, Increase-style)   * Pagination (D16, cursor)
  * limit / after params (D16)                        * Idempotency-Key header (D6)
  All marked `x-vocabulary: false` so scripts/parse_core_api.py skips them — the domain
  vocabulary (core-vocabulary.json) and the 26 policies are unaffected.

Layer 2: a rule-driven generator for the CRUD + transition skeleton. For each path it derives the
  resource schema (path segment -> plural -> schema) and emits the standard contract by shape:
    GET  /xs              list  -> 200 {data:[X], pagination}, ?limit&after
    POST /xs              create-> body (writable subset of X), 201 X, Idempotency-Key, 409, 422
    GET  /xs/{id}         get   -> 200 X, 404
    PATCH/xs/{id}         update-> body (partial X), 200 X, 404, 422
    POST /xs/{id}/<act>   action-> body (transition: to_state+reason; else generic), 200 X, 404, 422
  Existing tags / summary / operationId / x-operation-id and path params are preserved.

Request bodies and list envelopes are INLINE (not top-level components), so they never enter the
vocabulary. Read-only fields (id, status, *_at) are excluded from writable bodies.

Usage: author_contracts.py --paths-prefix /cases     (omit to do every path)
"""

from __future__ import annotations

import argparse
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
import yaml  # noqa: E402

SPEC = os.path.join(REPO_ROOT, "core-api.yaml")
DUMP_KW = dict(sort_keys=False, default_flow_style=False, width=120, allow_unicode=True)
_SNAKE = re.compile(r"(?<!^)(?=[A-Z])")
READONLY = {"id", "status"}
METHODS = ("get", "post", "put", "patch", "delete")


def _snake(n): return _SNAKE.sub("_", n).lower()
def _plural(s): return s[:-1] + "ies" if s.endswith("y") else (s + "es" if s.endswith(("s", "x", "ch", "sh")) else s + "s")
def _ref(name): return {"$ref": f"#/components/schemas/{name}"}
def _pref(name): return {"$ref": f"#/components/parameters/{name}"}
def _json(schema): return {"content": {"application/json": {"schema": schema}}}


def shared_components(doc) -> None:
    schemas = doc.setdefault("components", {}).setdefault("schemas", {})
    params = doc["components"].setdefault("parameters", {})
    schemas.setdefault("Error", {
        "type": "object", "x-vocabulary": False,
        "description": "Increase-style error (architecture-decisions.md D12).",
        "properties": {
            "status": {"type": "integer"}, "type": {"type": "string"},
            "title": {"type": "string"}, "detail": {"type": "string"},
            "doc_url": {"type": "string", "format": "uri"},
            "request_id": {"type": "string"},
            "resource_id": {"type": "string"}, "resource_type": {"type": "string"}}})
    schemas.setdefault("ValidationError", {
        "type": "object", "x-vocabulary": False,
        "description": "Multiple validation errors (architecture-decisions.md D12).",
        "properties": {
            "status": {"type": "integer"}, "type": {"type": "string"},
            "errors": {"type": "array", "items": {"type": "object", "properties": {
                "type": {"type": "string"}, "field": {"type": "string"},
                "message": {"type": "string"}}}}}})
    schemas.setdefault("Pagination", {
        "type": "object", "x-vocabulary": False,
        "description": "Transparent cursor pagination (architecture-decisions.md D16).",
        "properties": {"has_more": {"type": "boolean"}, "next_after": {"type": "string"},
                       "limit": {"type": "integer"}}})
    params.setdefault("Limit", {"name": "limit", "in": "query",
                                "description": "Page size (D16).", "schema": {"type": "integer", "default": 100}})
    params.setdefault("After", {"name": "after", "in": "query",
                                "description": "Cursor: return items after this id (D16).", "schema": {"type": "string"}})
    params.setdefault("IdempotencyKey", {"name": "Idempotency-Key", "in": "header", "required": True,
                                         "description": "Idempotency key, never expires (D6).", "schema": {"type": "string"}})


def _err(code, desc, schema="Error"):
    return {str(code): {"description": desc, **_json(_ref(schema))}}


def _writable(resource_schema) -> dict:
    props = {k: v for k, v in (resource_schema.get("properties") or {}).items()
             if k not in READONLY and not k.endswith("_at")}
    return {"type": "object", "properties": props}


def author_path(doc, path, methods, resource, resource_schema) -> None:
    segs = path.strip("/").split("/")
    ref = _ref(resource)
    for method, op in (methods or {}).items():
        if method.lower() not in METHODS or not isinstance(op, dict):
            continue
        # preserve existing path params; we replace query/header params + body + responses
        path_params = [p for p in (op.get("parameters") or []) if isinstance(p, dict) and p.get("in") == "path"]
        params = list(path_params)
        body = None
        responses = {}

        is_collection = len(segs) == 1
        is_item = len(segs) == 2 and segs[1].startswith("{")
        is_action = len(segs) == 3 and segs[1].startswith("{")

        if is_collection and method == "get":            # list
            params += [_pref("Limit"), _pref("After")]
            responses = {"200": {"description": f"A page of {resource} objects.", **_json(
                {"type": "object", "properties": {
                    "data": {"type": "array", "items": ref}, "pagination": _ref("Pagination")}})},
                **_err(400, "Invalid request.")}
        elif is_collection and method in ("post", "put"):  # create
            params += [_pref("IdempotencyKey")]
            body = {"required": True, **_json(_writable(resource_schema))}
            responses = {"201": {"description": f"The created {resource}.", **_json(ref)},
                         **_err(409, "Idempotency-Key reused with different args (D6)."),
                         **_err(422, "Validation failed.", "ValidationError")}
        elif is_item and method == "get":                 # retrieve
            responses = {"200": {"description": f"The requested {resource}.", **_json(ref)},
                         **_err(404, f"{resource} not found.")}
        elif is_item and method in ("patch", "put"):      # update
            body = {"required": True, **_json(_writable(resource_schema))}
            responses = {"200": {"description": f"The updated {resource}.", **_json(ref)},
                         **_err(404, f"{resource} not found."),
                         **_err(422, "Validation failed.", "ValidationError")}
        elif is_item and method == "delete":
            responses = {"204": {"description": "Deleted."}, **_err(404, f"{resource} not found.")}
        elif is_action and method in ("post", "put"):     # lifecycle action
            action = segs[2]
            if action == "transition" and resource_schema.get("x-states"):
                body = {"required": True, **_json({"type": "object", "properties": {
                    "to_state": {"type": "string", "enum": list(resource_schema["x-states"])},
                    "reason": {"type": "string"}}})}
            else:
                body = {"required": True, **_json({"type": "object",
                        "description": f"Inputs for the {action} action."})}
            responses = {"200": {"description": f"The updated {resource}.", **_json(ref)},
                         **_err(404, f"{resource} not found."),
                         **_err(422, "Validation failed.", "ValidationError")}
        else:
            continue

        if params:
            op["parameters"] = params
        if body is not None:
            op["requestBody"] = body
        op["responses"] = responses


def main(argv) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    ap.add_argument("--paths-prefix", default=None, help="only author paths under this prefix (e.g. /cases)")
    args = ap.parse_args(argv)

    doc = yaml.safe_load(open(SPEC, encoding="utf-8").read())
    if not (isinstance(doc, dict) and doc.get("openapi")):
        sys.exit("core-api.yaml is not an OpenAPI document.")
    shared_components(doc)

    schemas = doc["components"]["schemas"]
    plural_map = {_plural(_snake(k)).replace("_", "-"): k for k, s in schemas.items()
                  if s.get("x-kind") != "vocabulary" and s.get("x-vocabulary") is not False}

    done = []
    for path, methods in (doc.get("paths") or {}).items():
        if args.paths_prefix and not path.startswith(args.paths_prefix):
            continue
        seg = path.strip("/").split("/")[0]
        resource = plural_map.get(seg)
        if not resource:
            print(f"  skip {path}: no resource schema for segment '{seg}'")
            continue
        author_path(doc, path, methods, resource, schemas[resource])
        done.append(path)

    with open(SPEC, "w", encoding="utf-8") as fh:
        yaml.safe_dump(doc, fh, **DUMP_KW)
    print(f"authored contracts for {len(done)} paths: {done}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
