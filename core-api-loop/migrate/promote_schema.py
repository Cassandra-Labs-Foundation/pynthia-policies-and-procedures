#!/usr/bin/env python3
"""
promote_schema.py — elevate a heavy, well-cited vocabulary schema into a first-class typed
resource (pile C). The JUDGMENT — which schemas, and the lifecycle each one runs through — lives
in promotion-overlay.yaml (authored, flagged for compliance review). This step emits the
MECHANICAL surface so every promotion is consistent and reproducible:

  * flip x-kind vocabulary -> domain (or the requested kind)
  * ensure a `status` field carrying the lifecycle (enum of states)
  * add x-states + the doc-level x-state-machines entry (so the parser sees a state machine)
  * emit the REST surface the architecture oracle requires of a STATEFUL resource, mirroring the
    house shape (shared Pagination / Error / ValidationError, Limit/After params):
        GET  /plural            (list)
        POST /plural            (create)
        GET  /plural/{id}       (get)
        POST /plural/{id}/transition   (lifecycle)

Field paths are unchanged (finding.* stays finding.*), so promotion is coverage-safe; the added
status field + endpoints are new supply, and the endpoints exactly satisfy the new stateful
requirement so the architecture gap does not move. Idempotent: re-run after editing the overlay.
Runs in the migrate phase, after factor_schemas, before derive_bound_controls.
"""
from __future__ import annotations

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(REPO, "core-api-loop", "prepare"))
import yaml  # noqa: E402
import endpoint_rules as er  # noqa: E402

SPEC = os.path.join(REPO, "core-api.yaml")
OVERLAY = os.path.join(HERE, "promotion-overlay.yaml")
DUMP = dict(sort_keys=False, default_flow_style=False, width=120, allow_unicode=True)


def _title(snake: str) -> str:
    return "".join(w.capitalize() for w in snake.split("_"))


def _ok(desc, key):
    return {"description": desc, "content": {"application/json": {"schema": {"$ref": f"#/components/schemas/{key}"}}}}


def _err(desc, schema="Error"):
    return {"description": desc, "content": {"application/json": {"schema": {"$ref": f"#/components/schemas/{schema}"}}}}


def _id_param():
    return [{"name": "id", "in": "path", "required": True, "schema": {"type": "string"}}]


def _rest_surface(name: str, key: str) -> dict:
    """The 4 derived endpoints for a stateful resource (snake name, schema key)."""
    plural = er.plural_path_seg(name)          # kebab plural: finding -> findings
    op = plural.replace("-", "_")
    title = _title(name)
    tag = title + "s"
    list_create = {
        "get": {
            "operationId": f"get_{op}", "x-operation-id": f"list_{name}",
            "responses": {
                "200": {"description": f"A page of {title} objects.", "content": {"application/json": {"schema": {
                    "type": "object", "properties": {
                        "data": {"type": "array", "items": {"$ref": f"#/components/schemas/{key}"}},
                        "pagination": {"$ref": "#/components/schemas/Pagination"}}}}}},
                "400": _err("Invalid request.")},
            "tags": [tag], "summary": f"List {name}",
            "parameters": [{"$ref": "#/components/parameters/Limit"}, {"$ref": "#/components/parameters/After"}]},
        "post": {
            "operationId": f"post_{op}", "x-operation-id": f"create_{name}",
            "responses": {"201": _ok(f"The created {title}.", key), "400": _err("Invalid request."),
                          "422": _err("Validation failed.", "ValidationError")},
            "tags": [tag], "summary": f"Create {name}",
            "requestBody": {"required": True, "content": {"application/json": {"schema": {"$ref": f"#/components/schemas/{key}"}}}}},
    }
    get_one = {"get": {
        "operationId": f"get_{op}_id", "x-operation-id": f"get_{name}",
        "responses": {"200": _ok(f"The requested {title}.", key), "404": _err(f"{title} not found.")},
        "parameters": _id_param(), "tags": [tag], "summary": f"Get {name}"}}
    action_schema = {"type": "object", "properties": {"action": {"type": "string"}}, "required": ["action"]}
    action_body = {"required": True, "content": {"application/json": {"schema": action_schema}}}
    transition = {"post": {
        "operationId": f"post_{op}_id_transition", "x-operation-id": f"transition_{name}",
        "responses": {"200": _ok(f"The updated {title}.", key), "404": _err(f"{title} not found."),
                      "422": _err("Validation failed.", "ValidationError")},
        "parameters": _id_param(), "tags": [tag], "summary": f"Transition {name}",
        "requestBody": action_body}}
    return {f"/{plural}": list_create, f"/{plural}/{{id}}": get_one, f"/{plural}/{{id}}/transition": transition}


def promote(doc: dict, entry: dict) -> bool:
    schemas = doc["components"]["schemas"]
    name = entry["name"]
    if name not in schemas:
        print(f"  skip {name}: not a schema key")
        return False
    states = list(entry["states"])
    s = schemas[name]
    s["x-kind"] = entry.get("kind", "domain")
    if entry.get("description"):
        s["description"] = entry["description"]
    props = s.setdefault("properties", {})
    status = props.setdefault("status", {"type": "string", "description": "Lifecycle state."})
    status["enum"] = states
    s["x-states"] = states
    doc.setdefault("x-state-machines", {})[name] = states
    doc.setdefault("paths", {}).update(_rest_surface(name, name))
    return True


def main() -> int:
    doc = yaml.safe_load(open(SPEC).read())
    overlay = yaml.safe_load(open(OVERLAY).read()) if os.path.exists(OVERLAY) else {}
    done = []
    for entry in (overlay.get("promote") or []):
        if promote(doc, entry):
            done.append(entry["name"])
    open(SPEC, "w").write(yaml.safe_dump(doc, **DUMP))
    print(f"promoted {len(done)} vocab schemas to stateful typed resources: {done}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
