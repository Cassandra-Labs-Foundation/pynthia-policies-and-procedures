#!/usr/bin/env python3
"""
author_control_rules.py — project the policy EVENTS rules into core-api.yaml.

Each control's EVENTS table is the executable contract: *when* a trigger fires,
*which inputs* must be present, *which logged event* satisfies the control, and
*within* what deadline. `extract_controls.py` already parses those rows into the
normalized `control_rules` records in controls.json. This step stamps them onto
the spec as a top-level `x-control-rules` array, so the rule structure lives in
core-api.yaml itself rather than only in the policy prose.

That projection is what makes the spec self-describe its automation: the Supabase
`control_rule` table is a 1:1 read of `x-control-rules`, and `x-bound-controls`
becomes derivable from it (a field is bound to a control iff it appears in that
control's rule inputs/outputs/timer). Source of truth is the EVENTS tables; this
only re-emits them in machine form.

Reproducible + additive: re-run after any controls.json regeneration. It sets a
single top-level key on the OpenAPI document (schemas/paths untouched), so
core-vocabulary.json and the policies are unaffected.
"""

from __future__ import annotations

import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
import yaml  # noqa: E402

SPEC = os.path.join(REPO_ROOT, "core-api.yaml")
CONTROLS = os.path.join(REPO_ROOT, "controls.json")
DUMP_KW = dict(sort_keys=False, default_flow_style=False, width=120, allow_unicode=True)


def collect_rules(controls: dict) -> list[dict]:
    """Flatten every control's control_rules into one deterministically ordered list."""
    rules: list[dict] = []
    for c in controls.get("controls", []):
        rules.extend(c.get("control_rules", []))
    # stable order: control id, then trigger, then first produced event
    rules.sort(key=lambda r: (
        r.get("control_id") or "",
        r.get("trigger_event") or "",
        (r.get("produced_events") or [""])[0],
    ))
    return rules


def main() -> int:
    doc = yaml.safe_load(open(SPEC, encoding="utf-8").read())
    if not (isinstance(doc, dict) and doc.get("openapi")):
        sys.exit("core-api.yaml is not an OpenAPI document.")
    controls = json.load(open(CONTROLS))

    rules = collect_rules(controls)
    doc["x-control-rules"] = rules

    with open(SPEC, "w", encoding="utf-8") as fh:
        yaml.safe_dump(doc, fh, **DUMP_KW)

    complete = sum(1 for r in rules if r.get("trigger_event") and r.get("produced_events"))
    print(f"x-control-rules stamped: {len(rules)} rules "
          f"across {len(controls.get('controls', []))} controls "
          f"({complete} with both trigger + produced event, "
          f"{len(rules) - complete} partial).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
