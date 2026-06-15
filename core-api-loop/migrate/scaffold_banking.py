#!/usr/bin/env python3
"""
scaffold_banking.py — add the missing banking surface, driven by architecture-spec.json.

The banking endpoints/resources the architecture mandates (D1/D8/D9/D17/D19/D20) are absent, which
is most of the architecture-oracle gap. This scaffolds them from the committed authority — it does
NOT invent:
  * the missing AccountNumber resource (D2 1:Many, D20 allocation: routing/account number,
    informational_entity_id for FBO, lifecycle active/disabled/canceled)
  * a REST surface for the banking-core stateful resources (Account, Entity, AccountNumber,
    AchTransfer, WireTransfer, Card)
  * the architecture-mandated special endpoints listed in architecture-spec.json (entity creation,
    payment hub, sandbox simulators, fbo/inbound, auth) with a minimal contract

After scaffolding, run author_contracts.py (resource CRUD) + enrich_openapi.py (tags). This is
additive to the vocabulary (new banking entities/fields/endpoints) — that's the point; it closes
the gap. It only ADDS, never removes, so existing policies/controls are unaffected.
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
CHECKLIST = os.path.join(REPO_ROOT, "core-api-loop", "prepare", "architecture-spec.json")
DUMP_KW = dict(sort_keys=False, default_flow_style=False, width=120, allow_unicode=True)
_SNAKE = re.compile(r"(?<!^)(?=[A-Z])")

BANKING_RESOURCES = ["Account", "Entity", "AccountNumber", "AchTransfer", "WireTransfer", "Card", "Transfer"]


def _snake(n): return _SNAKE.sub("_", n).lower()
def _plural(s): return s[:-1] + "ies" if s.endswith("y") else (s + "es" if s.endswith(("s", "x", "ch", "sh")) else s + "s")
def _plural_path(snake): return _plural(snake).replace("_", "-")


def _op(operation_id, summary):
    return {"operationId": operation_id, "x-operation-id": operation_id, "summary": summary,
            "responses": {"200": {"description": "OK"}}}


def _idparam():
    return {"name": "id", "in": "path", "required": True, "schema": {"type": "string"}}


def ensure_account_number(schemas) -> bool:
    if "AccountNumber" in schemas:
        return False
    schemas["AccountNumber"] = {
        "type": "object", "x-kind": "banking-core",
        "x-states": ["active", "disabled", "canceled"],
        "description": "Routing/account-number pair; 1:Many to Account (D2); FBO attribution (D20).",
        "properties": {
            "id": {"type": "string"},
            "account_id": {"type": "string", "description": "Parent ledger Account (1:Many)."},
            "routing_number": {"type": "string"},
            "account_number": {"type": "string"},
            "informational_entity_id": {"type": "string", "description": "FBO attribution."},
            "status": {"type": "string", "enum": ["active", "disabled", "canceled"]}}}
    return True


def ensure_resource_rest(doc, resource, schema) -> list:
    """Ensure list/create/get (+ transition if stateful) exist, filling missing methods on an
    existing collection too (e.g. add POST to a GET-only /loans)."""
    paths = doc.setdefault("paths", {})
    sn = _snake(resource)
    p = _plural_path(sn)
    added = []
    coll = paths.setdefault(f"/{p}", {})
    if "get" not in coll:
        coll["get"] = _op(f"list_{sn}", f"List {p}"); added.append(f"GET /{p}")
    if "post" not in coll:
        coll["post"] = _op(f"create_{sn}", f"Create {resource}"); added.append(f"POST /{p}")
    item = paths.setdefault(f"/{p}/{{id}}", {})
    if "get" not in item:
        op = _op(f"get_{sn}", f"Get {resource}"); op["parameters"] = [_idparam()]
        item["get"] = op; added.append(f"GET /{p}/{{id}}")
    if schema.get("x-states"):
        tr = paths.setdefault(f"/{p}/{{id}}/transition", {})
        if "post" not in tr:
            op = _op(f"transition_{sn}", f"Transition {resource}"); op["parameters"] = [_idparam()]
            tr["post"] = op; added.append(f"POST /{p}/{{id}}/transition")
    return added


def ensure_special(doc, method, path) -> bool:
    """Add an architecture-mandated non-resource endpoint with a minimal but complete contract."""
    paths = doc.setdefault("paths", {})
    methods = paths.setdefault(path, {})
    m = method.lower()
    if m in methods:
        return False
    oid = (m + "_" + re.sub(r"[^a-z0-9]+", "_", path.lower())).strip("_")
    op = {"operationId": oid, "x-operation-id": oid,
          "summary": f"{method.upper()} {path}",
          "responses": {
              "200": {"description": "OK", "content": {"application/json": {"schema": {"type": "object"}}}},
              "400": {"description": "Invalid request.",
                      "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Error"}}}}}}
    params = [{"name": n, "in": "path", "required": True, "schema": {"type": "string"}}
              for n in re.findall(r"\{([^}]+)\}", path)]
    if params:
        op["parameters"] = params
    if m in ("post", "put", "patch"):
        op["requestBody"] = {"required": True,
                             "content": {"application/json": {"schema": {"type": "object"}}}}
    methods[m] = op
    return True


def main() -> int:
    doc = yaml.safe_load(open(SPEC, encoding="utf-8").read())
    if not (isinstance(doc, dict) and doc.get("openapi")):
        sys.exit("core-api.yaml is not an OpenAPI document.")
    checklist = json.load(open(CHECKLIST))
    schemas = doc.setdefault("components", {}).setdefault("schemas", {})

    new_an = ensure_account_number(schemas)

    # REST for the banking-core resources + every stateful resource (architecture-spec.json
    # endpoint_derivation=stateful requires a REST surface for any resource with a state machine).
    targets = list(dict.fromkeys(BANKING_RESOURCES + [
        k for k, s in schemas.items() if s.get("x-states") and s.get("x-vocabulary") is not False]))
    rest_added = []
    for r in targets:
        if r in schemas:
            rest_added += ensure_resource_rest(doc, r, schemas[r])

    # architecture-mandated special endpoints (non-resource): only those whose resource CRUD
    # the generator can't produce (payments/sandbox/fbo/inbound/auth + entity creation subtypes).
    # Add any architecture-mandated endpoint not already present. The resource REST above already
    # created the plain CRUD shapes (so ensure_special skips those); this picks up creation
    # subtypes (/entities/person) and non-resource endpoints (payments/sandbox/fbo/inbound/auth).
    specials_added = []
    for ep in checklist.get("endpoints", []):
        if ensure_special(doc, ep["method"], ep["path"]):
            specials_added.append(f"{ep['method']} {ep['path']}")

    with open(SPEC, "w", encoding="utf-8") as fh:
        yaml.safe_dump(doc, fh, **DUMP_KW)
    print(f"AccountNumber added: {new_an}")
    print(f"resource REST endpoints added ({len(rest_added)}): {rest_added}")
    print(f"special endpoints added ({len(specials_added)}): {specials_added}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
