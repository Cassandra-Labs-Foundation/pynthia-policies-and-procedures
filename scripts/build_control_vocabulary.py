#!/usr/bin/env python3
"""
build_control_vocabulary.py — Roll the per-control code references in controls.json
up into a single API-vocabulary requirements catalogue.

This answers the question "what is the complete set of API vocabulary the
policies need?" by inverting controls.json: instead of codes listed under each
control, it lists every code once, grouped by entity (the code's dotted prefix),
and for each code records:

  - status   : where it stands in the API spec
                 * "event"        — a registered event in core-vocabulary.json
                 * "field"        — a registered field path in core-vocabulary.json
                 * "unregistered" — referenced by a policy but NOT yet in the spec
                                    (i.e. vocabulary engineering still needs to add)
  - spec      : enrichment pulled from core-vocabulary.json for registered codes
                 (event description / entity, or field type / pii / description)
  - controls  : the control IDs that reference the code
  - policies  : the policies those controls live in
  - ref_count : how many controls reference it

Input : controls.json   (produced by scripts/extract_controls.py)
Spec  : core-vocabulary.json  (engineering's parsed API model, optional but recommended)
Output: control-vocabulary.json

Usage:
    python3 scripts/build_control_vocabulary.py
    python3 scripts/build_control_vocabulary.py -o control-vocabulary.json --root /path
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone


def load_json(path: str):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def build_spec_index(vocab: dict | None):
    """Return lookup dicts for event and field enrichment from core-vocabulary.json."""
    events: dict[str, dict] = {}
    fields: dict[str, dict] = {}
    if not vocab:
        return events, fields
    for e in vocab.get("events", []):
        for key in (e.get("code"), e.get("name")):
            if key and key not in events:
                events[key] = {
                    "entity": e.get("entity"),
                    "description": (e.get("description") or "").strip() or None,
                }
    for f in vocab.get("fields", []):
        p = f.get("path")
        if p and p not in fields:
            fields[p] = {
                "entity": f.get("entity"),
                "type": f.get("type"),
                "pii": bool(f.get("pii")),
                "required": bool(f.get("required")),
                "description": (f.get("description") or "").strip() or None,
            }
    return events, fields


def build(root: str) -> dict:
    controls_doc = load_json(os.path.join(root, "controls.json"))
    vocab_path = os.path.join(root, "core-vocabulary.json")
    vocab = load_json(vocab_path) if os.path.exists(vocab_path) else None
    spec_events, spec_fields = build_spec_index(vocab)

    # code -> aggregate record
    codes: dict[str, dict] = {}
    statuses: dict[str, dict] = {}

    def touch(code: str, status: str, control_id: str, policy: str):
        rec = codes.get(code)
        if rec is None:
            spec = None
            if status == "event":
                spec = spec_events.get(code)
            elif status == "field":
                spec = spec_fields.get(code)
            rec = codes[code] = {
                "code": code,
                "entity": code.split(".", 1)[0],
                "status": status,
                "spec": spec,
                "controls": set(),
                "policies": set(),
            }
        rec["controls"].add(control_id)
        rec["policies"].add(policy)

    for c in controls_doc.get("controls", []):
        cid = c["control_id"]
        pol = c["policy"]
        api = c.get("api_references", {})
        for code in api.get("events", []):
            touch(code, "event", cid, pol)
        for code in api.get("fields", []):
            touch(code, "field", cid, pol)
        for code in api.get("unregistered", []):
            touch(code, "unregistered", cid, pol)
        for st in api.get("statuses", []):
            rec = statuses.setdefault(st, {"value": st, "controls": set(), "policies": set()})
            rec["controls"].add(cid)
            rec["policies"].add(pol)

    # Group codes by entity prefix.
    entities: dict[str, dict] = {}
    for code, rec in codes.items():
        ent = rec["entity"]
        bucket = entities.setdefault(ent, {
            "entity": ent,
            "code_count": 0,
            "registered_events": 0,
            "registered_fields": 0,
            "unregistered": 0,
            "codes": [],
        })
        bucket["code_count"] += 1
        if rec["status"] == "event":
            bucket["registered_events"] += 1
        elif rec["status"] == "field":
            bucket["registered_fields"] += 1
        else:
            bucket["unregistered"] += 1
        bucket["codes"].append({
            "code": rec["code"],
            "status": rec["status"],
            "spec": rec["spec"],
            "ref_count": len(rec["controls"]),
            "controls": sorted(rec["controls"]),
            "policies": sorted(rec["policies"]),
        })

    # Sort codes within each entity: unregistered first (the worklist), then by code.
    status_order = {"unregistered": 0, "event": 1, "field": 2}
    for bucket in entities.values():
        bucket["codes"].sort(key=lambda r: (status_order.get(r["status"], 9), r["code"]))

    entities_sorted = dict(sorted(entities.items()))

    status_list = sorted(
        ({"value": s["value"],
          "ref_count": len(s["controls"]),
          "controls": sorted(s["controls"]),
          "policies": sorted(s["policies"])}
         for s in statuses.values()),
        key=lambda r: r["value"],
    )

    n_event = sum(1 for r in codes.values() if r["status"] == "event")
    n_field = sum(1 for r in codes.values() if r["status"] == "field")
    n_unreg = sum(1 for r in codes.values() if r["status"] == "unregistered")

    return {
        "meta": {
            "generator": "scripts/build_control_vocabulary.py",
            "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "source": "controls.json",
            "api_model": controls_doc.get("meta", {}).get("api_model"),
            "controls_generated_at": controls_doc.get("meta", {}).get("generated_at"),
        },
        "stats": {
            "entities": len(entities_sorted),
            "unique_codes": len(codes),
            "registered_events": n_event,
            "registered_fields": n_field,
            "unregistered_codes": n_unreg,
            "statuses": len(status_list),
        },
        "entities": entities_sorted,
        "statuses": status_list,
    }


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="Roll controls.json up into an API-vocabulary catalogue.")
    ap.add_argument("--root", default=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                    help="Repo root (default: parent of scripts/).")
    ap.add_argument("-o", "--output", default=None,
                    help="Output path (default: <root>/control-vocabulary.json).")
    args = ap.parse_args(argv)

    root = os.path.abspath(args.root)
    controls_path = os.path.join(root, "controls.json")
    if not os.path.exists(controls_path):
        print(f"ERROR: {controls_path} not found — run scripts/extract_controls.py first.",
              file=sys.stderr)
        return 2

    out = args.output or os.path.join(root, "control-vocabulary.json")
    doc = build(root)
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(doc, fh, indent=2, ensure_ascii=False)
        fh.write("\n")

    s = doc["stats"]
    print(f"Wrote {out}")
    print(f"  entities            : {s['entities']}")
    print(f"  unique codes        : {s['unique_codes']}")
    print(f"  registered events   : {s['registered_events']}")
    print(f"  registered fields   : {s['registered_fields']}")
    print(f"  unregistered (gap)  : {s['unregistered_codes']}")
    print(f"  status values       : {s['statuses']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
