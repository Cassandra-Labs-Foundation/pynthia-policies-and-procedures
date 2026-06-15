#!/usr/bin/env python3
"""
verify_full.py — prove the FULL bespoke -> OpenAPI 3 conversion is lossless.

Three checks:
  [1] spec-dict round-trip: to_specdict(to_openapi(spec)) == spec
  [2] vocabulary identity : build(spec) == build(to_specdict(to_openapi(spec)))  (ignoring the
      parsed_at timestamp) — i.e. core-vocabulary.json is byte-identical from either source, so
      controls.json and every policy's vocabulary reference are unaffected.
  [3] OpenAPI 3 validity  : the generated doc validates (GitBook-renderable).
"""

from __future__ import annotations

import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(REPO_ROOT, "scripts"))

import convert          # noqa: E402
import parse_core_api   # noqa: E402
import yaml             # noqa: E402

SPEC = os.path.join(REPO_ROOT, "core-api.yaml")
MIGRATION = os.path.join(REPO_ROOT, "vocab-migration.json")


def _strip_parsed_at(vocab: dict) -> dict:
    v = json.loads(json.dumps(vocab))  # deep copy
    v.get("meta", {}).pop("parsed_at", None)
    return v


def _diff_keys(a, b, path=""):
    """First few structural differences between two JSON-able objects."""
    out = []
    if type(a) is not type(b):
        return [f"{path}: type {type(a).__name__} vs {type(b).__name__}"]
    if isinstance(a, dict):
        for k in set(a) | set(b):
            if k not in a:
                out.append(f"{path}.{k}: missing in A")
            elif k not in b:
                out.append(f"{path}.{k}: missing in B")
            else:
                out += _diff_keys(a[k], b[k], f"{path}.{k}")
            if len(out) > 8:
                break
    elif isinstance(a, list):
        if a != b:
            out.append(f"{path}: list differs (len {len(a)} vs {len(b)})")
    elif a != b:
        out.append(f"{path}: {a!r} != {b!r}")
    return out


def main() -> int:
    ok = True
    spec = yaml.safe_load(open(SPEC).read())
    migration = json.load(open(MIGRATION))

    doc = convert.to_openapi(spec)
    back = convert.to_specdict(doc)

    # [1] spec-dict round-trip
    d = _diff_keys(spec, back)
    if not d:
        print("[1] spec-dict round-trip   : PASS (identical)")
    else:
        ok = False
        print(f"[1] spec-dict round-trip   : FAIL\n      " + "\n      ".join(d[:8]))

    # [2] vocabulary identity
    v_bespoke, _ = parse_core_api.build(spec, migration)
    v_openapi, _ = parse_core_api.build(back, migration)
    vb, vo = _strip_parsed_at(v_bespoke), _strip_parsed_at(v_openapi)
    if vb == vo:
        print(f"[2] vocabulary identity    : PASS (entities={vb['stats']['entities']}, "
              f"fields={vb['stats']['fields']}, events={vb['stats']['events']}, "
              f"endpoints={vb['stats']['endpoints']}, sms={vb['stats']['state_machines']})")
    else:
        ok = False
        print("[2] vocabulary identity    : FAIL\n      " + "\n      ".join(_diff_keys(vb, vo)[:8]))

    # [3] OpenAPI 3 validity
    try:
        from openapi_spec_validator import validate
        validate(doc)
        print("[3] OpenAPI 3 validity     : PASS")
    except Exception as e:  # noqa: BLE001
        ok = False
        print(f"[3] OpenAPI 3 validity     : FAIL — {str(e)[:300]}")

    print("\n=== FULL MIGRATION", "PASS" if ok else "FAIL", "===")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
