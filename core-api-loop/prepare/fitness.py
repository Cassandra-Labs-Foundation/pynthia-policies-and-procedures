#!/usr/bin/env python3
"""
fitness.py — Complexity (the soft objective) over a candidate spec (IMMUTABLE eval harness).

Lower is simpler. The scorer minimizes this subject to the coverage gates. The metric is a
weighted sum over the parsed vocab, designed so the cheapest way to lower it is to genuinely
delete/merge concepts — not to launder complexity into untyped blobs or into the controls.

  complexity = W_concept   * concepts          (resources + distinct event verbs + endpoint shapes)
             + W_field     * field_count
             + W_endpoint  * endpoint_count
             + W_task      * task_type_count
             + W_generic   * generic_field_count   (anti-gaming surcharge)
             + W_enum      * enum_overage          (per enum value above enum_cap, across the doc)
             + W_global_dl * global_description_len (optional; off by default)

Anti-gaming:
  * Concepts are weighted heaviest, so collapsing many narrow resources into one general one
    (a real simplification) pays, while shattering one resource into many does not.
  * The genericness surcharge taxes every `object`/`any`/untyped field, so "dump everything
    into a metadata blob" never scores well — and the control oracle still requires the real
    dotted field/event to exist, so a blob satisfies no codes for free.
  * The enum-cardinality surcharge taxes every enum value above enum_cap. This closes a blind
    spot: enum *values* (e.g. a 337-value Task.type) are constraints inside the schema that the
    parser never lifts into the vocabulary, so without this term they cost zero and the minimizer
    cannot see — let alone delete — them. A bloated enum now screams in the score; collapsing it
    to a small generic set (the architecture's intent) is a large score win the loop will keep.
  * The optional global-DL term adds the byte-length of controls.json + control-vocabulary.json,
    catching attempts to push complexity out of the spec and into the controls.

Weights live in core-api-loop/prepare/score-config.json (so they are reviewable and pinned).
The agent must never edit this file or that config.
"""

from __future__ import annotations

import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SCRIPTS_DIR = os.path.join(REPO_ROOT, "scripts")
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)

import parse_core_api  # noqa: E402

try:
    import yaml  # noqa: E402
except ModuleNotFoundError:  # pragma: no cover
    sys.exit("error: PyYAML not installed. Use core-api-loop/.venv "
             "(pip install -r core-api-loop/requirements.txt).")

DEFAULT_CONFIG = os.path.join(HERE, "score-config.json")

# Field-type strings (from parse_core_api) that count as "generic" / untyped.
GENERIC_TYPES = {"", "object", "any", "json", "map", "dict", "unknown"}

# Money-type discipline: a dollar amount must NOT be a float — rounding drift breaks ledger
# invariants (Sum(balances) == settlement account) invisibly. Money = integer minor units.
# Ratios/scores/rates legitimately stay `number`, so the check is amount-leaves only.
MONEY_WORDS = ("amount", "balance", "total", "principal", "settlement", "proceeds", "draw")
NONMONEY_WORDS = ("ratio", "rate", "score", "pct", "percent", "ltv", "cet1", "factor",
                  "count", "days", "number", "probability", "weight", "multiplier", "bps",
                  "yield", "dti", "apr", "value")


def is_money_float(path: str, ftype) -> bool:
    """True iff this field is a money amount typed as float (`number`) — a ledger ship-blocker."""
    if str(ftype or "").split("(")[0].strip().lower() != "number":
        return False
    leaf = path.split(".")[-1].lower()
    if any(k in leaf for k in NONMONEY_WORDS):
        return False
    return any(k in leaf for k in MONEY_WORDS)


def load_config(path: str | None) -> dict:
    cfg = json.load(open(path or DEFAULT_CONFIG))
    return cfg


def parse_vocab(spec_path: str, migration_path: str | None) -> dict:
    spec = yaml.safe_load(open(spec_path).read())
    migration_doc = None
    if migration_path and os.path.exists(migration_path):
        migration_doc = json.load(open(migration_path))
    vocab, _warnings = parse_core_api.build(spec, migration_doc)
    return vocab


def _is_generic(ftype) -> bool:
    if not ftype:
        return True
    base = str(ftype).split("(")[0].strip().lower()
    return base in GENERIC_TYPES


def _normalize_endpoint_shape(path: str) -> str:
    import re
    return re.sub(r"\{[^}]*\}", "{}", path.strip().lower()).rstrip("/")


def enum_offenders(doc, cap: int) -> list[tuple[int, int, str]]:
    """Walk the raw OpenAPI doc for enum constraints. Returns (size, overage, location) for every
    enum with more than `cap` values, largest first. Enum *values* live inside schema/property
    constraints and are never parsed into the vocabulary, so this is the only place they are seen."""
    found: list[tuple[int, int, str]] = []

    def walk(o, where: str) -> None:
        if isinstance(o, dict):
            e = o.get("enum")
            if isinstance(e, list) and len(e) > cap:
                found.append((len(e), len(e) - cap, where or "<root>"))
            for k, v in o.items():
                if k != "enum":
                    walk(v, f"{where}.{k}" if where else k)
        elif isinstance(o, list):
            for i, v in enumerate(o):
                walk(v, f"{where}[{i}]")

    if isinstance(doc, dict):
        walk(doc, "")
    found.sort(reverse=True)
    return found


def enum_overage(doc, cap: int) -> int:
    return sum(over for _size, over, _where in enum_offenders(doc, cap))


def components(vocab: dict, doc=None, enum_cap: int = 12) -> dict:
    entities = vocab.get("entities", [])
    fields = vocab.get("fields", [])
    endpoints = vocab.get("endpoints", [])

    # "resources" = authored schema resources, excluding the auto-generated
    # vocabulary-prefix entities (kind == "vocabulary") that the parser synthesizes
    # from flat fields — those aren't concepts the agent designs.
    resources = sum(1 for e in entities if e.get("kind") != "vocabulary")
    distinct_event_verbs = len(set(vocab.get("event_types", [])))
    endpoint_shapes = len({_normalize_endpoint_shape(ep["path"]) for ep in endpoints})
    concepts = resources + distinct_event_verbs + endpoint_shapes

    field_count = len(fields)
    generic_fields = sum(1 for f in fields if _is_generic(f.get("type")))
    money_floats = sum(1 for f in fields if is_money_float(f.get("path", ""), f.get("type")))
    endpoint_count = len(endpoints)
    task_type_count = len(vocab.get("task_types", []))

    enum_over = enum_overage(doc, enum_cap) if doc is not None else 0

    return {
        "resources": resources,
        "distinct_event_verbs": distinct_event_verbs,
        "endpoint_shapes": endpoint_shapes,
        "concepts": concepts,
        "field_count": field_count,
        "generic_field_count": generic_fields,
        "money_float_count": money_floats,
        "endpoint_count": endpoint_count,
        "task_type_count": task_type_count,
        "enum_overage": enum_over,
    }


def global_description_len(root: str) -> int:
    total = 0
    for name in ("controls.json", "control-vocabulary.json"):
        p = os.path.join(root, name)
        if os.path.exists(p):
            total += os.path.getsize(p)
    return total


def complexity(vocab: dict, config: dict, root: str = REPO_ROOT, doc=None) -> dict:
    w = config.get("weights", {})
    c = components(vocab, doc=doc, enum_cap=config.get("enum_cap", 12))
    score = (
        w.get("concept", 10) * c["concepts"]
        + w.get("field", 1) * c["field_count"]
        + w.get("endpoint", 3) * c["endpoint_count"]
        + w.get("task", 2) * c["task_type_count"]
        + w.get("generic", 5) * c["generic_field_count"]
        + w.get("money_float", 8) * c["money_float_count"]
        + w.get("enum", 1) * c["enum_overage"]
    )
    gdl = 0
    if config.get("global_dl", False):
        gdl = global_description_len(root)
        score += w.get("global_dl", 0.0001) * gdl
    return {"complexity": round(score, 4), "components": c, "global_dl_bytes": gdl}


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    ap.add_argument("-s", "--spec", default=os.path.join(REPO_ROOT, "core-api.yaml"))
    ap.add_argument("-m", "--migration", default=os.path.join(REPO_ROOT, "vocab-migration.json"))
    ap.add_argument("-c", "--config", default=DEFAULT_CONFIG)
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args(argv)

    cfg = load_config(args.config)
    vocab = parse_vocab(args.spec, args.migration)
    raw = yaml.safe_load(open(args.spec).read())
    doc = raw if isinstance(raw, dict) and raw.get("openapi") else None
    result = complexity(vocab, cfg, doc=doc)

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"complexity          : {result['complexity']}")
        for k, v in result["components"].items():
            print(f"  {k:22}: {v}")
        if cfg.get("global_dl"):
            print(f"  global_dl_bytes       : {result['global_dl_bytes']}")
        offenders = enum_offenders(doc, cfg.get("enum_cap", 12)) if doc is not None else []
        if offenders:
            print(f"  enum offenders (> {cfg.get('enum_cap', 12)}):")
            for size, over, where in offenders[:8]:
                print(f"    {size:4} values (+{over})  {where}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
