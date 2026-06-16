#!/usr/bin/env python3
"""
author_fields.py — register the genuine domain-field gap onto the spec (reproducible).

Of the unregistered control demand, ~half is task-scheduling shadow (_due/_due_at/_timer — handled
elsewhere) and ~half is genuine missing domain vocabulary the policies cite but the spec never
supplied (loan.*, cdd.*, cash.overshort.amount, ...). This authors that genuine half:
  * field-like codes  -> a property on the owning schema. snake(code-namespace) matching a domain
                         resource (Loan, Member, ...) lands there; otherwise a flat x-kind:vocabulary
                         schema named for the namespace (created if absent, e.g. cdd/edd/furnisher).
  * event-like codes  -> a token in vocab-migration.json {as:event}, the sanctioned event mechanism
                         (a past-tense ending like .released/.submitted is an event, not a field);
                         its verb is added to x-event-types if missing.

Reproducibility: the work-list is a committed overlay (fields-overlay.yaml). First run BOOTSTRAPS it
from the live unregistered set (so it is complete and auditable), then commits it as the source of
truth; subsequent runs apply the committed overlay deterministically and idempotently. Types are
inferred conservatively (never `number` for a money word -> no money-float penalty; never generic).
"""
from __future__ import annotations
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
PREPARE = os.path.join(REPO, "core-api-loop", "prepare")
sys.path.insert(0, PREPARE)
import yaml
import control_oracle as co
SPEC = os.path.join(REPO, "core-api.yaml")
MIGRATION = os.path.join(REPO, "vocab-migration.json")
DEMAND = os.path.join(PREPARE, "demand.json")
OVERLAY = os.path.join(HERE, "fields-overlay.yaml")
DUMP = dict(sort_keys=False, default_flow_style=False, width=120, allow_unicode=True)
_SNAKE = re.compile(r"(?<!^)(?=[A-Z])")
def snake(n): return _SNAKE.sub("_", n).lower()

EVENT_VERBS = {"released", "submitted", "updated", "verified", "issued", "created", "approved",
               "denied", "closed", "opened", "completed", "triggered", "escalated", "resolved",
               "filed", "posted", "settled", "returned", "activated", "deactivated", "frozen",
               "flagged", "reviewed", "executed", "published", "sent", "queued", "started",
               "finished", "passed", "failed", "breached", "cured", "waived", "detected", "cleared"}
SCHED = lambda c: c.endswith(("_due", "_due_at", "_timer")) or "expires_at" in c


def infer_type(field: str):
    leaf = field.split(".")[-1].lower()
    if leaf.endswith("_id") or leaf == "id":
        return {"type": "string"}
    if leaf.endswith("_at"):
        return {"type": "string", "format": "date-time"}
    if any(k in leaf for k in ("amount", "balance", "exposure", "proceeds", "principal", "cost", "limit")):
        return {"type": "integer", "description": "Minor units."}      # never float -> no money-float penalty
    if any(k in leaf for k in ("count", "_num", "days", "age", "number")):
        return {"type": "integer"}
    if any(k in leaf for k in ("ratio", "rate", "pct", "percent", "score", "dti", "ltv")):
        return {"type": "number"}
    return {"type": "string"}                                          # safe default (not generic)


def bootstrap_overlay() -> dict:
    demand = co.load_demand(DEMAND)
    unreg = co.evaluate(SPEC, demand, MIGRATION)["unregistered"]
    real = [c for c in unreg if not SCHED(c)]
    events, fields = {}, {}
    for c in sorted(real):
        verb = c.rsplit(".", 1)[-1].rsplit("_", 1)[-1]
        if verb in EVENT_VERBS:
            events[c] = {"as": "event", "type": verb, "subject": c.split(".")[0]}
        else:
            ns, _, rest = c.partition(".")
            fields.setdefault(ns, {})[rest or ns] = infer_type(rest or ns)["type"]
    return {"_note": "Genuine domain-field gap authored by author_fields.py. Bootstrapped from the "
            "unregistered control demand (non-scheduling). Reviewable source of truth; edit here.",
            "fields": dict(sorted(fields.items())), "events": dict(sorted(events.items()))}


def main() -> int:
    if os.path.exists(OVERLAY):
        overlay = yaml.safe_load(open(OVERLAY).read())
        src = "committed overlay"
    else:
        overlay = bootstrap_overlay()
        open(OVERLAY, "w").write(yaml.safe_dump(overlay, **DUMP))
        src = "bootstrapped (wrote fields-overlay.yaml)"

    doc = yaml.safe_load(open(SPEC).read())
    schemas = doc["components"]["schemas"]
    snake_domain = {snake(k): k for k, s in schemas.items()
                    if s.get("x-kind") != "vocabulary" and s.get("x-vocabulary") is not False}

    added_fields = new_schemas = 0
    for ns, fdict in (overlay.get("fields") or {}).items():
        if ns in snake_domain:
            target = snake_domain[ns]
        elif ns in schemas:
            target = ns
        else:
            schemas[ns] = {"type": "object", "x-kind": "vocabulary",
                           "description": f"{ns} vocabulary (control demand)."}
            target = ns; new_schemas += 1
        props = schemas[target].setdefault("properties", {})
        for field, ftype in fdict.items():
            if field not in props:
                props[field] = infer_type(field) if not isinstance(ftype, str) else {"type": ftype, **({"format": "date-time"} if field.endswith("_at") else {})}
                added_fields += 1
    open(SPEC, "w").write(yaml.safe_dump(doc, **DUMP))

    # events -> vocab-migration map (and ensure each verb is a known event type)
    mig = json.load(open(MIGRATION))
    xet = set(doc.get("x-event-types") or [])
    added_events = new_verbs = 0
    for code, rec in (overlay.get("events") or {}).items():
        # force event registration even if a stray as:field token already claims this code
        # (an event code marked as a field registers as neither — it has no backing property).
        if mig["migration"].get(code, {}).get("as") != "event":
            mig["migration"][code] = rec; added_events += 1
        if rec["type"] not in xet:
            xet.add(rec["type"]); new_verbs += 1
    # consistency: every verb any migration event token references must be a known event type,
    # else the token dangles (registers by name but points at a missing type). Also repairs verbs
    # an over-eager inner-loop delete_event_type orphaned (the move ignored migration usage).
    for entry in mig["migration"].values():
        if entry.get("as") == "event" and entry.get("type") and entry["type"] not in xet:
            xet.add(entry["type"]); new_verbs += 1
    if new_verbs:
        doc["x-event-types"] = sorted(xet)
        open(SPEC, "w").write(yaml.safe_dump(doc, **DUMP))
    mig["meta"]["tokens"] = len(mig["migration"])
    json.dump(mig, open(MIGRATION, "w"), indent=2)

    print(f"author_fields ({src}):")
    print(f"  +{added_fields} fields ({new_schemas} new vocabulary schemas)")
    print(f"  +{added_events} event tokens ({new_verbs} new event verbs)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
