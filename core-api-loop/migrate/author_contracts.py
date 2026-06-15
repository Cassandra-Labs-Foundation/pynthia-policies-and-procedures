#!/usr/bin/env python3
"""
author_contracts.py — generate OpenAPI request/response contracts deterministically.

Reproducibility model: rules + a committed overlay, no LLM at build time.
  * Layer 1/2 (rules): shared components (Error/ValidationError/Pagination + limit/after +
    Idempotency-Key, grounded in architecture-decisions.md D6/D12/D16) and the CRUD+transition
    skeleton derived from each resource schema.
  * Layer 3 (overlay): the semantic facts rules can't derive — required create-fields, named-action
    request bodies, and example values — live in a committed `contracts-overlay.yaml` (the durable,
    reviewable source of truth). Running this script regenerates the contracts byte-deterministically
    from (schemas + overlay); the YAML is never hand-patched.

Shared components are marked x-vocabulary:false so scripts/parse_core_api.py skips them — the domain
vocabulary (core-vocabulary.json) and the 26 policies stay byte-identical.

Overlay format (keyed by resource schema name):
  LoanApplication:
    create_required: [applicant_id, amount]
    examples: {amount: 25000, product: auto}
    actions:
      decision: {summary: "...", required: [decision],
                 body: {decision: {type: string, enum: [approve, deny]}, reason: {type: string}}}

Usage: author_contracts.py [--paths-prefix /cases] [--overlay PATH]
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
OVERLAY = os.path.join(HERE, "contracts-overlay.yaml")
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
    schemas["Error"] = {
        "type": "object", "x-vocabulary": False,
        "description": "Increase-style error (architecture-decisions.md D12).",
        "properties": {
            "status": {"type": "integer"}, "type": {"type": "string"},
            "title": {"type": "string"}, "detail": {"type": "string"},
            "doc_url": {"type": "string", "format": "uri"},
            "request_id": {"type": "string"},
            "resource_id": {"type": "string"}, "resource_type": {"type": "string"}}}
    schemas["ValidationError"] = {
        "type": "object", "x-vocabulary": False,
        "description": "Multiple validation errors (architecture-decisions.md D12).",
        "properties": {
            "status": {"type": "integer"}, "type": {"type": "string"},
            "errors": {"type": "array", "items": {"type": "object", "properties": {
                "type": {"type": "string"}, "field": {"type": "string"},
                "message": {"type": "string"}}}}}}
    schemas["Pagination"] = {
        "type": "object", "x-vocabulary": False,
        "description": "Transparent cursor pagination (architecture-decisions.md D16).",
        "properties": {"has_more": {"type": "boolean"}, "next_after": {"type": "string"},
                       "limit": {"type": "integer"}}}
    params["Limit"] = {"name": "limit", "in": "query",
                       "description": "Page size (D16).", "schema": {"type": "integer", "default": 100}}
    params["After"] = {"name": "after", "in": "query",
                       "description": "Cursor: return items after this id (D16).", "schema": {"type": "string"}}
    params["IdempotencyKey"] = {"name": "Idempotency-Key", "in": "header", "required": True,
                                "description": "Idempotency key, never expires (D6).", "schema": {"type": "string"}}


def _err(code, desc, schema="Error"):
    return {str(code): {"description": desc, **_json(_ref(schema))}}


def _writable(resource_schema, ov) -> dict:
    props = {}
    examples = (ov or {}).get("examples") or {}
    for k, v in (resource_schema.get("properties") or {}).items():
        if k in READONLY or k.endswith("_at"):
            continue
        prop = dict(v) if isinstance(v, dict) else v
        if isinstance(prop, dict) and k in examples:
            prop["example"] = examples[k]
        props[k] = prop
    body = {"type": "object", "properties": props}
    if (ov or {}).get("create_required"):
        body["required"] = [f for f in ov["create_required"] if f in props]
    return body


def _action_body(action, resource_schema, ov):
    spec = ((ov or {}).get("actions") or {}).get(action)
    if spec and spec.get("body"):
        b = {"type": "object", "properties": spec["body"]}
        if spec.get("required"):
            b["required"] = spec["required"]
        return b, spec.get("summary")
    if action == "transition" and resource_schema.get("x-states"):
        return ({"type": "object", "properties": {
            "to_state": {"type": "string", "enum": list(resource_schema["x-states"])},
            "reason": {"type": "string"}}}, None)
    return ({"type": "object", "description": f"Inputs for the {action} action."}, None)


def author_path(doc, path, methods, resource, resource_schema, ov) -> None:
    segs = path.strip("/").split("/")
    ref = _ref(resource)
    for method, op in (methods or {}).items():
        if method.lower() not in METHODS or not isinstance(op, dict):
            continue
        is_collection = len(segs) == 1
        is_item = len(segs) == 2 and segs[1].startswith("{")
        is_action = len(segs) == 3 and segs[1].startswith("{")
        # shapes this generator handles; anything else (e.g. /entities/person creation subtypes,
        # contracted elsewhere) is left untouched — do NOT strip its body/responses.
        write = method in ("post", "put", "patch")
        if not ((is_collection and method in ("get", "post", "put"))
                or (is_item and method in ("get", "patch", "put", "delete"))
                or (is_action and method in ("post", "put"))):
            continue
        params = [p for p in (op.get("parameters") or []) if isinstance(p, dict) and p.get("in") == "path"]
        op.pop("requestBody", None)

        if is_collection and method == "get":
            params += [_pref("Limit"), _pref("After")]
            op["responses"] = {"200": {"description": f"A page of {resource} objects.", **_json(
                {"type": "object", "properties": {
                    "data": {"type": "array", "items": ref}, "pagination": _ref("Pagination")}})},
                **_err(400, "Invalid request.")}
        elif is_collection and method in ("post", "put"):
            params += [_pref("IdempotencyKey")]
            op["requestBody"] = {"required": True, **_json(_writable(resource_schema, ov))}
            op["responses"] = {"201": {"description": f"The created {resource}.", **_json(ref)},
                               **_err(409, "Idempotency-Key reused with different args (D6)."),
                               **_err(422, "Validation failed.", "ValidationError")}
        elif is_item and method == "get":
            op["responses"] = {"200": {"description": f"The requested {resource}.", **_json(ref)},
                               **_err(404, f"{resource} not found.")}
        elif is_item and method in ("patch", "put"):
            op["requestBody"] = {"required": True, **_json(_writable(resource_schema, ov))}
            op["responses"] = {"200": {"description": f"The updated {resource}.", **_json(ref)},
                               **_err(404, f"{resource} not found."),
                               **_err(422, "Validation failed.", "ValidationError")}
        elif is_item and method == "delete":
            op["responses"] = {"204": {"description": "Deleted."}, **_err(404, f"{resource} not found.")}
        elif is_action and method in ("post", "put"):
            body, summary = _action_body(segs[2], resource_schema, ov)
            op["requestBody"] = {"required": True, **_json(body)}
            if summary and not op.get("summary"):
                op["summary"] = summary
            op["responses"] = {"200": {"description": f"The updated {resource}.", **_json(ref)},
                               **_err(404, f"{resource} not found."),
                               **_err(422, "Validation failed.", "ValidationError")}
        else:
            continue
        if params:
            op["parameters"] = params


def main(argv) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    ap.add_argument("--paths-prefix", default=None)
    ap.add_argument("--overlay", default=OVERLAY)
    args = ap.parse_args(argv)

    doc = yaml.safe_load(open(SPEC, encoding="utf-8").read())
    if not (isinstance(doc, dict) and doc.get("openapi")):
        sys.exit("core-api.yaml is not an OpenAPI document.")
    overlay = yaml.safe_load(open(args.overlay).read()) if os.path.exists(args.overlay) else {}
    overlay = overlay or {}
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
        author_path(doc, path, methods, resource, schemas[resource], overlay.get(resource))
        done.append(path)

    with open(SPEC, "w", encoding="utf-8") as fh:
        yaml.safe_dump(doc, fh, **DUMP_KW)
    print(f"authored contracts for {len(done)} paths "
          f"(overlay: {len(overlay)} resources from {os.path.relpath(args.overlay, REPO_ROOT) if os.path.exists(args.overlay) else 'none'})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
