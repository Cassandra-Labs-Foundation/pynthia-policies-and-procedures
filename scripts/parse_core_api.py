#!/usr/bin/env python3
"""Parse core-api.yaml (+ vocab-migration.json) into core-vocabulary.json.

core-api.yaml is an **OpenAPI 3** document (migrated from the original bespoke flat format).
build() auto-detects the `openapi:` key and adapts it to the internal spec shape via
openapi_to_spec() — components/schemas -> resources + flat fields, x-event-types / x-task-types /
x-state-machines -> the corresponding sections, paths -> endpoints. A legacy bespoke spec (with
top-level resources/fields/...) is still parsed directly. Either source yields the same
core-vocabulary.json shape consumed by .skills/vocabulary/scripts/extract_vocabulary.py.

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
        [-m vocab-migration.json] [-o core-vocabulary.json]
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
    if isinstance(spec, dict) and spec.get("openapi"):   # OpenAPI 3 source -> adapt to bespoke
        spec = openapi_to_spec(spec)
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
            # Policies cite snake_case paths (account.id), so register the
            # path that way; entity stays CamelCase for renderer grouping.
            rec["path"] = f"{snake(rname)}.{pname}"
            fields.append(rec)
            registered_paths.add(rec["path"])
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
        rec = {"name": token, "subject": entry.get("subject", ""), "type": ttype}
        timer_of = entry.get("timer_of") or entry.get("timer")
        if timer_of:
            rec["timer_of"] = timer_of if timer_of != "due_at" else None
            rec["is_timer"] = True
        tasks.append(rec)
    for tname, entry in sorted(task_map.items()):
        tasks.append({"name": tname, "subject": entry.get("subject", ""),
                      "type": entry.get("type", ""), "source": "task_map"})

    # --- subject registry --------------------------------------------------
    subjects = sorted(
        {e.get("subject") for e in migration.values() if e.get("subject")}
        | {e.get("subject") for e in task_map.values() if e.get("subject")}
    )

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
        "event_types": list(spec.get("event_types") or []),
        "subjects": subjects,
        "tasks": tasks,
        "provisional_fields": provisional,
    }
    return out, warnings


def openapi_to_spec(doc):
    """Adapt an OpenAPI 3 document to the bespoke spec dict build() expects.

    core-api.yaml is an OpenAPI 3 document (migrated from the bespoke flat format). Every
    components/schema is a resource (x-kind != 'vocabulary') or a flat-vocabulary prefix
    (x-kind == 'vocabulary'); events/tasks/state-machines/meta live in x- extensions. This is
    the inverse of core-api-loop/migrate/convert.py and is verified lossless there.
    """
    schemas = (doc.get("components") or {}).get("schemas") or {}

    def rewrite_refs(obj):
        if isinstance(obj, dict):
            return {k: (v.replace("#/components/schemas/", "#/schemas/")
                        if k == "$ref" and isinstance(v, str) else rewrite_refs(v))
                    for k, v in obj.items()}
        if isinstance(obj, list):
            return [rewrite_refs(x) for x in obj]
        return obj

    resources, fields = {}, {}
    for key, sch in schemas.items():
        if sch.get("x-kind") == "vocabulary":
            for prop, ps in (sch.get("properties") or {}).items():
                fields[f"{key}.{prop}"] = ps.get("type") if isinstance(ps, dict) else ps
        else:
            rspec = {"kind": sch.get("x-kind")}
            if "x-states" in sch:
                rspec["states"] = sch["x-states"]
            if "x-retention" in sch:
                rspec["retention"] = sch["x-retention"]
            rspec["properties"] = {p: rewrite_refs(ps) for p, ps in (sch.get("properties") or {}).items()}
            resources[key] = rspec

    endpoints = {}
    for path, methods in (doc.get("paths") or {}).items():
        endpoints[path] = {m: (op or {}).get("x-operation-id", (op or {}).get("operationId"))
                           for m, op in (methods or {}).items()}

    info = doc.get("info") or {}
    meta = {"spec_title": info.get("title"), "spec_version": info.get("version")}
    if info.get("x-note") is not None:
        meta["note"] = info["x-note"]
    if info.get("x-elements") is not None:
        meta["elements"] = info["x-elements"]

    return {
        "meta": meta,
        "resources": resources,
        "fields": fields,
        "event_types": list(doc.get("x-event-types") or []),
        "task_types": list(doc.get("x-task-types") or []),
        "state_machines": doc.get("x-state-machines") or {},
        "endpoints": endpoints,
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    root = Path(__file__).resolve().parent.parent
    ap.add_argument("-s", "--spec", default=str(root / "core-api.yaml"))
    ap.add_argument("-m", "--migration", default=str(root / "vocab-migration.json"))
    ap.add_argument("-o", "--output", default=str(root / "core-vocabulary.json"))
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
