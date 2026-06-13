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
             + W_global_dl * global_description_len (optional; off by default)

Anti-gaming:
  * Concepts are weighted heaviest, so collapsing many narrow resources into one general one
    (a real simplification) pays, while shattering one resource into many does not.
  * The genericness surcharge taxes every `object`/`any`/untyped field, so "dump everything
    into a metadata blob" never scores well — and the control oracle still requires the real
    dotted field/event to exist, so a blob satisfies no codes for free.
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


def components(vocab: dict) -> dict:
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
    endpoint_count = len(endpoints)
    task_type_count = len(vocab.get("task_types", []))

    return {
        "resources": resources,
        "distinct_event_verbs": distinct_event_verbs,
        "endpoint_shapes": endpoint_shapes,
        "concepts": concepts,
        "field_count": field_count,
        "generic_field_count": generic_fields,
        "endpoint_count": endpoint_count,
        "task_type_count": task_type_count,
    }


def global_description_len(root: str) -> int:
    total = 0
    for name in ("controls.json", "control-vocabulary.json"):
        p = os.path.join(root, name)
        if os.path.exists(p):
            total += os.path.getsize(p)
    return total


def complexity(vocab: dict, config: dict, root: str = REPO_ROOT) -> dict:
    w = config.get("weights", {})
    c = components(vocab)
    score = (
        w.get("concept", 10) * c["concepts"]
        + w.get("field", 1) * c["field_count"]
        + w.get("endpoint", 3) * c["endpoint_count"]
        + w.get("task", 2) * c["task_type_count"]
        + w.get("generic", 5) * c["generic_field_count"]
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
    result = complexity(vocab, cfg)

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"complexity          : {result['complexity']}")
        for k, v in result["components"].items():
            print(f"  {k:22}: {v}")
        if cfg.get("global_dl"):
            print(f"  global_dl_bytes       : {result['global_dl_bytes']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
