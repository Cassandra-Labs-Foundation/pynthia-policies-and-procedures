#!/usr/bin/env python3
"""
author_field_reconciliation.py — one object.property namespace for fields and events.

An event is `object.property.action`, so every event asserts that `object.property`
is a real data point — a field. But the event vocabulary and the field vocabulary
drifted: most properties embedded in events are not registered as fields (e.g.
`capital.stress_report.reviewed` implies field `capital.stress_report`, unregistered).
This reconciles the two so fields ⊇ event-properties: a field is the data point, an
event is that field plus an action — the same tree.

For each `object.property` an event implies but no field declares, on the object's
schema:

  - REGISTER (safe, automatic): no similar field exists -> add the property as a
    provisional, event-derived field. Marked `x-provisional` + `x-derived-from: event`
    so it is distinguishable from authored fields and idempotent on re-run.
  - NORMALIZE (needs a human): a similar field already exists on the object (token
    overlap) -> registering would mint a near-duplicate, the very drift we are
    closing. These are written to vocab-field-normalize.txt for a decision instead.

Source of truth stays the EVENTS tables (via controls.json). Additive + idempotent:
re-run after controls.json changes. Re-run parse_core_api.py afterward to fold the
new fields into core-vocabulary.json.
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
CONTROLS = os.path.join(REPO_ROOT, "controls.json")
NORMALIZE_OUT = os.path.join(REPO_ROOT, "vocab-field-normalize.txt")
DUMP_KW = dict(sort_keys=False, default_flow_style=False, width=120, allow_unicode=True)
_SNAKE = re.compile(r"(?<!^)(?=[A-Z])")


def _snake(n: str) -> str:
    return _SNAKE.sub("_", n).lower()


def build_prefix_map(schemas: dict) -> dict[str, str]:
    out: dict[str, str] = {}
    for key, s in schemas.items():
        if s.get("x-vocabulary") is False:
            continue
        out[key if s.get("x-kind") == "vocabulary" else _snake(key)] = key
    return out


def similar(prop: str, registered: set[str]) -> str | None:
    """Return a registered field on the same object that `prop` likely duplicates, else None."""
    pt = set(prop.split("_"))
    for f in registered:
        ft = set(f.split("_"))
        if not (pt & ft):
            continue
        # subset either way, or majority token overlap -> treat as a normalize candidate
        if pt <= ft or ft <= pt or len(pt & ft) / len(pt | ft) >= 0.5:
            return f
    return None


def main() -> int:
    doc = yaml.safe_load(open(SPEC, encoding="utf-8").read())
    if not (isinstance(doc, dict) and doc.get("openapi")):
        sys.exit("core-api.yaml is not an OpenAPI document.")
    controls = json.load(open(CONTROLS))
    schemas = doc.get("components", {}).get("schemas", {})
    prefix_schema = build_prefix_map(schemas)

    # object -> properties implied by events; record an example event for provenance
    implied: dict[str, dict[str, str]] = {}
    for c in controls.get("controls", []):
        for r in c.get("control_rules", []):
            for ev in [r.get("trigger")] + (r.get("produced") or []):
                if ev and ev.get("object") and ev.get("property"):
                    implied.setdefault(ev["object"], {}).setdefault(
                        ev["property"], ev.get("canonical") or "")

    registered = added = normalize = no_schema = 0
    normalize_rows: list[str] = []

    for obj in sorted(implied):
        skey = prefix_schema.get(obj)
        if not skey:
            no_schema += len(implied[obj])
            continue
        schema = schemas[skey]
        props = schema.setdefault("properties", {})
        have = set(props.keys())
        for prop in sorted(implied[obj]):
            if prop in have:
                registered += 1
                continue
            dup = similar(prop, have)
            if dup:
                normalize += 1
                normalize_rows.append(f"{obj}.{prop}\t~ existing {obj}.{dup}\t(from {implied[obj][prop]})")
                continue
            props[prop] = {
                "type": "string",
                "x-provisional": True,
                "x-derived-from": "event",
                "description": f"Provisional field implied by event {implied[obj][prop]}; "
                               f"registered to reconcile the field/event namespace.",
            }
            have.add(prop)
            added += 1

    with open(SPEC, "w", encoding="utf-8") as fh:
        yaml.safe_dump(doc, fh, **DUMP_KW)

    with open(NORMALIZE_OUT, "w", encoding="utf-8") as fh:
        fh.write("# Event-implied properties that resemble an existing field on the same object.\n")
        fh.write("# Registering would mint a near-duplicate. Decide: normalize the event to the\n")
        fh.write("# existing field, or confirm they are genuinely distinct (then register by hand).\n\n")
        fh.write("\n".join(sorted(normalize_rows)) + "\n")

    total = registered + added + normalize + no_schema
    print(f"field/event reconciliation over {total} event-implied object.property pairs:")
    print(f"  already a registered field : {registered}")
    print(f"  registered now (safe add)  : {added}")
    print(f"  normalize candidates (flag): {normalize}  -> {os.path.basename(NORMALIZE_OUT)}")
    print(f"  object has no schema (gap) : {no_schema}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
