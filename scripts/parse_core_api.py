#!/usr/bin/env python3
"""Parse core-api.yaml (+ vocab-migration.json) into vocabulary.json.

Converts the minimal Cassandra Banking Core API spec into the
vocabulary.json shape consumed by .skills/vocabulary/scripts/
extract_vocabulary.py (and compared against by extract_vocab.py).

Sources
-------
core-api.yaml          meta, resources (states + properties), fields
                       (flat dotted tokens), event_types (verbs),
                       task_types, state_machines, endpoints.
vocab-migration.json   migration: policy token -> {as: field|event|task,
                       ...}. Event tokens carry (subject, type); these
                       become the canonical entity.event codes.

Mapping
-------
entities        one per resource (schema fields) + one per flat-field
                prefix (vocabulary fields).
fields          resource properties (entity = schema name) + flat
                fields (entity = prefix).
events          every migration token with as=event; name is the token
                policies cite, entity is the subject, description names
                the canonical event_type verb.
endpoints       one row per path+method, summary = operation id.
state_machines  from the spec's state_machines section.
plugins         none in the minimal spec.

Extra keys (ignored by the renderer, kept for tooling):
task_types, tasks (from task_map), provisional_fields (migration field
refs not registered in the spec).

Usage:
    python3 scripts/parse_core_api.py [-s core-api.yaml]
        [-m vocab-migration.json] [-o vocabulary.json]
"""

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import yaml

PARSER_VERSION = "0.2.0"

SNAKE_RE = re.compile(r"(?<!^)(?=[A-Z])")


def snake(name: str) -> str:
    return SNAKE_RE.sub("_", name).lower()


def field_record(entity, field, ftype, fmt=None):
    if fmt:
        ftype = f"{ftype} ({fmt})"
    return {
        "path": f"{entity}.{field}",
        "field": field,
        "entity": entity,
        "type": ftype,
        "required": False,
        "nullable": True,
        "description": "",
        "enum_values": None,
        "pii": False,
        "is_computed": False,
        "computed": None,
        "plugin": None,
        "freshness": None,
        "is_state_machine": False,
        "bound_controls": [],
    }


def build(spec, migration_doc):
    resources = spec.get("resources") or {}
    flat_fields = spec.get("fields") or {}
    event_types = set(spec.get("event_types") or [])
    task_types = spec.get("task_types") or []
    state_machines = spec.get("state_machines") or {}
    endpoints_in = spec.get("endpoints") or {}
    migration = (migration_doc or {}).get("migration") or {}
    task_map = (migration_doc or {}).get("task_map") or {}

    warnings = []

    # --- fields ---------------------------------------------------------
    fields = []
    registered_paths = set()
    for rname, rspec in sorted(resources.items()):
        for pname, pspec in sorted((rspec.get("properties") or {}).items()):
            pspec = pspec or {}
            rec = field_record(rname, pname, pspec.get("type", "string"),
                               pspec.get("format"))
            fields.append(rec)
            registered_paths.add(f"{snake(rname)}.{pname}")
    for token, ftype in sorted(flat_fields.items()):
        prefix, _, rest = token.partition(".")
        rec = field_record(prefix, rest, ftype or "string")
        rec["path"] = token
        fields.append(rec)
        registered_paths.add(token)

    # --- entities -------------------------------------------------------
    sm_names = set(state_machines)
    entities = []
    for rname, rspec in sorted(resources.items()):
        props = rspec.get("properties") or {}
        entities.append({
            "name": snake(rname),
            "schema_name": rname,
            "field_count": len(props),
            "computed_field_count": 0,
            "state_machine_field": "status" if rname in sm_names and "status" in props else None,
            "events": [],
            "control_refs": [],
            "retention": rspec.get("retention"),
            "kind": rspec.get("kind"),
        })
    prefix_counts = {}
    for token in flat_fields:
        prefix_counts[token.partition(".")[0]] = prefix_counts.get(token.partition(".")[0], 0) + 1
    resource_snakes = {snake(r) for r in resources}
    for prefix, count in sorted(prefix_counts.items()):
        if prefix in resource_snakes:
            continue
        entities.append({
            "name": prefix,
            "schema_name": prefix,
            "field_count": count,
            "computed_field_count": 0,
            "state_machine_field": None,
            "events": [],
            "control_refs": [],
            "retention": None,
            "kind": "vocabulary",
        })

    # --- events ---------------------------------------------------------
    events = []
    for token, entry in sorted(migration.items()):
        if entry.get("as") != "event":
            continue
        etype = entry.get("type", "")
        if etype not in event_types:
            warnings.append(f"event token {token!r} uses unregistered event_type {etype!r}")
        events.append({
            "name": token,
            "code": token,
            "entity": entry.get("subject", ""),
            "description": f"canonical event_type: `{etype}`",
        })

    # --- endpoints ------------------------------------------------------
    endpoints = []
    for path, methods in sorted(endpoints_in.items()):
        for method, op_id in sorted((methods or {}).items()):
            endpoints.append({
                "method": method.upper(),
                "path": path,
                "summary": op_id,
                "control_refs": [],
                "audit_events": [],
                "request_schema": None,
                "response_schema": None,
            })

    # --- state machines ---------------------------------------------------
    sms = []
    for name, states in sorted(state_machines.items()):
        props = (resources.get(name) or {}).get("properties") or {}
        sms.append({
            "name": name,
            "field": "status" if "status" in props else "",
            "states": list(states or []),
        })

    # --- tasks (extra, not rendered) --------------------------------------
    tasks = []
    for token, entry in sorted(migration.items()):
        if entry.get("as") != "task":
            continue
        ttype = entry.get("type", "")
        if ttype not in set(task_types):
            warnings.append(f"task token {token!r} uses unregistered task_type {ttype!r}")
        tasks.append({"name": token, "subject": entry.get("subject", ""), "type": ttype})
    for tname, entry in sorted(task_map.items()):
        tasks.append({"name": tname, "subject": entry.get("subject", ""),
                      "type": entry.get("type", ""), "source": "task_map"})

    # --- provisional fields (extra, not rendered) --------------------------
    provisional = sorted({
        entry.get("ref") or token
        for token, entry in migration.items()
        if entry.get("as") == "field"
        and (entry.get("ref") or token) not in registered_paths
    })

    meta_in = spec.get("meta") or {}
    out = {
        "meta": {
            "spec_title": meta_in.get("spec_title", "Unknown spec"),
            "spec_version": str(meta_in.get("spec_version", "?")),
            "parser_version": PARSER_VERSION,
            "parsed_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "note": meta_in.get("note"),
            "sources": ["core-api.yaml", "vocab-migration.json"],
        },
        "stats": {
            "entities": len(entities),
            "fields": len(fields),
            "computed_fields": 0,
            "events": len(events),
            "endpoints": len(endpoints),
            "state_machines": len(sms),
            "plugins": 0,
            "task_types": len(task_types),
            "tasks": len(tasks),
            "provisional_fields": len(provisional),
        },
        "entities": entities,
        "fields": fields,
        "events": events,
        "endpoints": endpoints,
        "state_machines": sms,
        "plugins": [],
        "task_types": list(task_types),
        "tasks": tasks,
        "provisional_fields": provisional,
    }
    return out, warnings


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    root = Path(__file__).resolve().parent.parent
    ap.add_argument("-s", "--spec", default=str(root / "core-api.yaml"))
    ap.add_argument("-m", "--migration", default=str(root / "vocab-migration.json"))
    ap.add_argument("-o", "--output", default=str(root / "vocabulary.json"))
    args = ap.parse_args()

    try:
        spec = yaml.safe_load(Path(args.spec).read_text())
    except Exception as e:
        sys.exit(f"error: cannot read spec {args.spec}: {e}")
    migration_doc = None
    mpath = Path(args.migration)
    if mpath.exists():
        try:
            migration_doc = json.loads(mpath.read_text())
        except Exception as e:
            sys.exit(f"error: cannot parse migration file {mpath}: {e}")
    else:
        print(f"warning: {mpath} not found — events/tasks will be empty",
              file=sys.stderr)

    out, warnings = build(spec, migration_doc)
    Path(args.output).write_text(json.dumps(out, indent=2) + "\n")

    for w in warnings:
        print(f"warning: {w}", file=sys.stderr)
    s = out["stats"]
    print(json.dumps({
        "output": str(args.output),
        "spec": f"{out['meta']['spec_title']} v{out['meta']['spec_version']}",
        "stats": s,
        "warnings": len(warnings),
    }, indent=2))


if __name__ == "__main__":
    main()
