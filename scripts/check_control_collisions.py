#!/usr/bin/env python3
"""GATE: no two policies may define the same bare control id.

Born from OQ-11: a regeneration of the cash policy silently switched its
control prefix from CA- to CP-, colliding with capitalization's CP-01..CP-10.
The extractor contained the damage (uids stayed unique, the crosswalk refused
bare-id claims), but a human citing "CP-03" in a memo or an examination
response was ambiguous for a month and nobody noticed. This gate makes the
next such regeneration fail the build instead.

Reads controls.json (so it runs AFTER extract_controls.py in the cascade) and
exits 1 if any bare control_id appears under more than one policy.
"""
import json
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main() -> int:
    data = json.loads((ROOT / "controls.json").read_text())
    owners: dict[str, set[str]] = defaultdict(set)
    for c in data["controls"]:
        owners[c["control_id"]].add(c["policy"])

    # Shared controls (SC-*) are DELIBERATELY hosted by many policies with
    # shared-controls as the canonical owner — that duplication is the feature
    # (see TODO §10's byte-identity item), not a collision. Everything else
    # must have exactly one owning policy.
    collisions = {
        cid: sorted(pols)
        for cid, pols in owners.items()
        if len(pols) > 1 and "shared-controls" not in pols
    }
    if collisions:
        print("control-id collision GATE: bare ids defined by more than one policy —")
        for cid, pols in sorted(collisions.items()):
            print(f"  {cid}: {', '.join(pols)}")
        print("fix the corpus (one policy renumbers), never the extractor; see OQ-11.")
        return 1

    print(f"control-id collisions OK — {len(owners)} bare ids, each owned by exactly one policy")
    return 0


if __name__ == "__main__":
    sys.exit(main())
