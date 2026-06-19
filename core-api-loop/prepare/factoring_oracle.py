#!/usr/bin/env python3
"""
factoring_oracle.py — the description-length / factor-extraction signal.

The complexity term counts elements; it cannot see that the SAME field cluster is
copied across dozens of objects. That repetition is compressible: define the
cluster once as a base schema and have each object compose it (`allOf: [$ref]`).
This oracle measures the uncompressed repetition and surfaces the clusters worth
extracting, so the loop can discover shared primitives we did not hand-author —
true minimum-description-length pressure.

  redundancy : sum over property NAME p of (n_p - 1), where n_p is the number of
               object schemas that declare p as their OWN property (i.e. not via an
               allOf base) and n_p >= cluster_min. Each such p could live once in a
               base and be referenced n_p times; the (n_p - 1) copies are the
               compressible surplus. Extracting a base that members compose by
               $ref removes p from their own properties -> n_p falls -> redundancy
               falls. (Scored softly; behind the structural_terms flag.)

  mixin_candidates : for the strongest recurring properties, the co-occurring
               property set — concrete `extract_base` targets {fields, members}.
               Reported to guide the proposer; not itself scored.

Anti-gaming: redundancy only drops when properties actually leave member schemas
into a referenced base (real composition). Declaring an unreferenced base changes
nothing. The concept weight (10x) on the new base means extraction pays only when
it retires enough duplication — self-limiting, so the loop will not over-shatter
the model into micro-mixins.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))

# Names too generic to be a meaningful shared concept on their own — counted for
# redundancy but never proposed as a stand-alone mixin (they belong inside a cluster).
TRIVIAL = {"id", "type", "status", "name", "description", "version"}


def _own_props(schema: dict) -> set[str]:
    """A schema's own (non-inherited) property names. allOf-inherited props live in the base."""
    return set((schema.get("properties") or {}).keys())


def evaluate(doc: dict | None, cluster_min: int = 4) -> dict:
    if not isinstance(doc, dict):
        return {"redundancy": 0, "top_recurring": [], "mixin_candidates": []}
    schemas = doc.get("components", {}).get("schemas", {})

    prop_objects: dict[str, set[str]] = defaultdict(set)
    obj_props: dict[str, set[str]] = {}
    for key, s in schemas.items():
        own = _own_props(s)
        obj_props[key] = own
        for p in own:
            prop_objects[p].add(key)

    counts = Counter({p: len(objs) for p, objs in prop_objects.items()})
    recurring = {p: n for p, n in counts.items() if n >= cluster_min}
    redundancy = sum(n - 1 for n in recurring.values())

    # mixin candidates: anchor on each strong non-trivial recurring property, then
    # add properties that co-occur in a majority of that property's member objects.
    candidates = []
    seen_members: list[set[str]] = []
    for anchor, n in counts.most_common():
        if n < cluster_min or anchor in TRIVIAL:
            continue
        members = prop_objects[anchor]
        co = Counter()
        for o in members:
            co.update(obj_props[o])
        cluster = {p for p, c in co.items() if c >= 0.6 * len(members)}
        cluster = {p for p in cluster if counts[p] >= cluster_min}
        if len(cluster) < 2:
            continue
        if any(members <= m or m <= members for m in seen_members):
            continue  # avoid reporting nested duplicates of the same group
        seen_members.append(members)
        candidates.append({
            "anchor": anchor,
            "fields": sorted(cluster),
            "member_count": len(members),
            "savings_estimate": sum(counts[p] - 1 for p in cluster),
        })
        if len(candidates) >= 8:
            break

    return {
        "redundancy": redundancy,
        "cluster_min": cluster_min,
        "top_recurring": [{"prop": p, "objects": n} for p, n in counts.most_common(15) if n >= cluster_min],
        "mixin_candidates": candidates,
    }


def redundancy_term(result: dict, config: dict) -> float:
    w = config.get("weights", {})
    return w.get("redundancy", 0.25) * result["redundancy"]


def main(argv: list[str]) -> int:
    import yaml
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    ap.add_argument("-s", "--spec", default=os.path.join(REPO_ROOT, "core-api.yaml"))
    ap.add_argument("--cluster-min", type=int, default=4)
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args(argv)
    raw = yaml.safe_load(open(args.spec).read())
    doc = raw if isinstance(raw, dict) and raw.get("openapi") else None
    result = evaluate(doc, cluster_min=args.cluster_min)
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"redundancy (compressible surplus): {result['redundancy']}")
        print("top recurring properties:")
        for r in result["top_recurring"]:
            print(f"  {r['prop']:24} in {r['objects']} objects")
        print("mixin candidates (extract_base targets):")
        for c in result["mixin_candidates"]:
            print(f"  base~{c['anchor']}: {c['fields']}  ({c['member_count']} members, ~{c['savings_estimate']} saved)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
