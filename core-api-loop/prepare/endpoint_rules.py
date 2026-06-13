#!/usr/bin/env python3
"""
endpoint_rules.py — DERIVE the required endpoint surface from the resources (IMMUTABLE harness).

Endpoints are not asserted by hand; they are a consequence of the resources the spec defines. An
endpoint is justified iff it is the REST surface of a resource (or an architecture-mandated special
endpoint). This is what lets the architecture oracle treat resource-backed endpoints as
load-bearing: deleting `/cases` opens a gap because `Case` is a resource that needs a REST surface.

Default policy: REST for every resource the loop should expose.

  mode = "stateful" (default): expose resources that have a state machine — i.e. lifecycle
         entities you genuinely operate on (Account, Entity, Case, Filing, Incident, ...). The
         spec's ~45 value-object resources (config, reports, sub-records) get no endpoints.
  mode = "all": REST for every authored resource (warning: the current spec has 57 authored
         resources, so this demands ~140 endpoints and reports most of them as gaps).

Required REST per in-scope resource with plural path P:
  GET  /P            (list)
  POST /P            (create)
  GET  /P/{id}       (get)
  + if it has a state machine: at least one POST /P/{id}/<action> (lifecycle / transition)

Non-resource endpoints (payment hub, sandbox sims, fbo, auth, events) are exempt — see
architecture-spec.json `endpoint_exempt_prefixes`.
"""

from __future__ import annotations

import re

# Irregular snake-singular -> snake-plural overrides (extend as needed).
IRREGULAR_PLURALS: dict[str, str] = {}


def pluralize(snake: str) -> str:
    if snake in IRREGULAR_PLURALS:
        return IRREGULAR_PLURALS[snake]
    if snake.endswith("y") and (len(snake) < 2 or snake[-2] not in "aeiou"):
        return snake[:-1] + "ies"
    if snake.endswith(("s", "x", "z", "ch", "sh")):
        return snake + "es"
    return snake + "s"


def plural_path_seg(snake: str) -> str:
    """Snake resource name -> first path segment (kebab plural). account_number -> account-numbers."""
    return pluralize(snake).replace("_", "-")


def norm_path(path: str) -> str:
    p = re.sub(r"\{[^}]*\}", "{}", path.strip().lower())
    return p[:-1] if len(p) > 1 and p.endswith("/") else p


def first_segment(path: str) -> str:
    parts = norm_path(path).strip("/").split("/")
    return parts[0] if parts and parts[0] else ""


def in_scope_resources(vocab: dict, mode: str) -> list[dict]:
    """Authored resources (not auto-generated vocabulary prefixes) in scope for REST derivation."""
    sm_names = {sm["name"] for sm in vocab.get("state_machines", [])}
    out = []
    for e in vocab.get("entities", []):
        if e.get("kind") == "vocabulary":
            continue
        stateful = e.get("schema_name") in sm_names
        if mode == "stateful" and not stateful:
            continue
        out.append({"snake": e["name"], "schema": e.get("schema_name"),
                    "plural": plural_path_seg(e["name"]), "stateful": stateful})
    return out


def all_resource_plurals(vocab: dict) -> dict:
    """{first-path-segment -> resource schema} for EVERY authored resource (any mode), used to
    attribute an endpoint to a backing resource for orphan detection. A non-stateful resource
    (e.g. Document) still backs its endpoints even if 'stateful' mode doesn't require them."""
    out = {}
    for e in vocab.get("entities", []):
        if e.get("kind") == "vocabulary":
            continue
        out[plural_path_seg(e["name"])] = e.get("schema_name")
    return out


def derive_required(vocab: dict, mode: str = "stateful") -> tuple[list[dict], dict]:
    """Return (required, plural_map).

    required: list of {kind, method, path, resource} entries the spec MUST expose. kind is
      "rest" (exact method+path) or "lifecycle" (any POST under /P/{id}/...).
    plural_map: {first-path-segment -> resource schema name} for orphan attribution.
    """
    required: list[dict] = []
    plural_map: dict[str, str] = {}
    for r in in_scope_resources(vocab, mode):
        P = r["plural"]
        plural_map[P] = r["schema"]
        required.append({"kind": "rest", "method": "GET", "path": f"/{P}", "resource": r["schema"]})
        required.append({"kind": "rest", "method": "POST", "path": f"/{P}", "resource": r["schema"]})
        required.append({"kind": "rest", "method": "GET", "path": f"/{P}/{{id}}", "resource": r["schema"]})
        if r["stateful"]:
            required.append({"kind": "lifecycle", "method": "POST", "path": f"/{P}/{{id}}",
                             "resource": r["schema"]})
    return required, plural_map
