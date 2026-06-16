#!/usr/bin/env python3
"""
propose.py — the inner-loop move proposer for supervise.py (a `--proposer-cmd`).

Each invocation makes ONE move on core-api.yaml and prints a JSON line {"label","note",...} that
the supervisor logs. "No change" means the inner loop has converged.

A move is a single structured EDIT OP, applied with surgical text edits (NOT a YAML round-trip),
so comments, ordering, and diff readability are preserved:

  {"op":"add_field","path":"x.y","type":"string"}     register a cited code (close a gap)
  {"op":"add_event_type","name":"verb"}
  {"op":"delete_field","path":"x.y"}                   delete an orphan (cut complexity)
  {"op":"delete_endpoint","path":"/cases"}
  {"op":"delete_resource","name":"Foo"}
  {"op":"delete_state_machine","name":"Foo"}
  {"op":"delete_event_type","name":"verb"}
  {"op":"delete_task_type","name":"type"}
  {"op":"noop"}                                        nothing beneficial left -> converged

The scorer is the judge: the supervisor adjudicates each move and keeps it only if the score
improves, so a bad proposal is simply reverted. propose.py just suggests.

Backends:
  --backend greedy   deterministic, no LLM. Feasibility regime (control violations > 0): register
                     the highest-referenced unregistered code. Otherwise: delete an orphan
                     endpoint the architecture doesn't require. Fully autonomous; ideal for tests.
  --backend api      LLM (anthropic SDK + ANTHROPIC_API_KEY) proposes the op, prompted with
                     program.md + the current score state + a spec inventory (Elon ordering).
  --backend cli      LLM via the `claude` CLI.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(HERE, ".."))
PREPARE = os.path.join(HERE, "prepare")
sys.path.insert(0, PREPARE)

import control_oracle  # noqa: E402
import fitness         # noqa: E402
import score as score_mod  # noqa: E402
import yaml            # noqa: E402

SPEC = os.path.join(REPO_ROOT, "core-api.yaml")
MIGRATION = os.path.join(REPO_ROOT, "vocab-migration.json")
DEMAND = os.path.join(PREPARE, "demand.json")
CONFIG = os.path.join(PREPARE, "score-config.json")
CHECKLIST = os.path.join(PREPARE, "architecture-spec.json")
PROGRAM_MD = os.path.join(HERE, "program.md")
GENERATE_MODEL = "claude-opus-4-8"


# --------------------------------------------------------------------------- #
# edit applier — operates on the parsed OpenAPI 3 document.
# core-api.yaml is machine-generated OpenAPI (no hand comments to preserve), so a
# load -> modify -> dump round-trip is robust and keeps diffs minimal.
# --------------------------------------------------------------------------- #
_SNAKE = re.compile(r"(?<!^)(?=[A-Z])")
DUMP_KW = dict(sort_keys=False, default_flow_style=False, width=120, allow_unicode=True)


def _snake(n: str) -> str:
    return _SNAKE.sub("_", n).lower()


def _find_resource_key(schemas: dict, name: str):
    """Resolve a resource/schema name tolerantly: exact key, else snake-case match."""
    if name in schemas:
        return name
    target = _snake(name)
    return next((k for k in schemas if _snake(k) == target), None)


def _is_referenced(doc: dict, schema_key: str) -> bool:
    """True if any $ref points at this schema (deleting it would dangle the ref / break OpenAPI)."""
    return f'"#/components/schemas/{schema_key}"' in json.dumps(doc)


def _migration() -> dict:
    try:
        return json.load(open(MIGRATION))
    except Exception:  # noqa: BLE001 — missing/unreadable migration just means "no refs known"
        return {}


def _event_verbs_in_use() -> set:
    """Verbs referenced by any migration as:event token. Deleting such a verb is the blind-spot
    move: the event tokens keep registering by NAME (so coverage/score is unchanged), but their
    canonical type now dangles — a false complexity 'win' the scorer cannot see. Refuse it here."""
    return {e.get("type") for e in (_migration().get("migration") or {}).values()
            if e.get("as") == "event" and e.get("type")}


def _task_types_in_use() -> set:
    """Task verbs referenced by any migration task_map entry — same blind spot for delete_task_type."""
    return {t.get("type") for t in (_migration().get("task_map") or {}).values() if t.get("type")}


def apply_op(op: dict) -> bool:
    """Apply one edit op to the OpenAPI core-api.yaml in place. Returns True iff it changed.

    Ops mirror the bespoke set but act on the OpenAPI structure:
      add_field/delete_field  -> components/schemas/<prefix>/properties (vocab schema), or a
                                 resource schema whose snake(name) == prefix
      add_event_type/delete_* -> x-event-types / x-task-types
      delete_endpoint         -> paths
      delete_resource         -> components/schemas/<Name>
      delete_state_machine    -> x-state-machines (+ the schema's x-states)

    Defensive: a malformed/unknown op is a no-op, never an exception — LLM proposers emit
    imperfect ops; a bad suggestion is ignored, then reverted/converged."""
    doc = yaml.safe_load(open(SPEC, encoding="utf-8").read())
    if not (isinstance(doc, dict) and doc.get("openapi")):
        return False  # not an OpenAPI document
    kind = op.get("op")
    path = (op.get("path") or "").strip()
    name = (op.get("name") or "").strip()
    schemas = doc.setdefault("components", {}).setdefault("schemas", {})
    changed = False

    if kind == "add_field" and "." in path:
        prefix, rest = path.split(".", 1)
        sch = schemas.setdefault(prefix, {"type": "object", "x-kind": "vocabulary", "properties": {}})
        props = sch.setdefault("properties", {})
        if rest not in props:
            props[rest] = {"type": op.get("type", "string")}
            changed = True

    elif kind == "delete_field" and "." in path:
        prefix, rest = path.split(".", 1)
        if prefix in schemas and rest in (schemas[prefix].get("properties") or {}):
            del schemas[prefix]["properties"][rest]
            changed = True
        else:
            for k, sch in schemas.items():
                if _snake(k) == prefix and rest in (sch.get("properties") or {}):
                    del sch["properties"][rest]
                    changed = True
                    break

    elif kind == "add_event_type" and name:
        lst = doc.setdefault("x-event-types", [])
        if name not in lst:
            lst.append(name)
            changed = True

    elif kind == "delete_event_type" and name:
        # refuse if a migration event token still references this verb — the deletion would dangle
        # those (cited) events without the scorer noticing (they register by name). Not an orphan.
        lst = doc.get("x-event-types") or []
        if name in lst and name not in _event_verbs_in_use():
            lst.remove(name)
            changed = True

    elif kind == "delete_task_type" and name:
        lst = doc.get("x-task-types") or []
        if name in lst and name not in _task_types_in_use():
            lst.remove(name)
            changed = True

    elif kind == "delete_endpoint" and path:
        if path in (doc.get("paths") or {}):
            del doc["paths"][path]
            changed = True

    elif kind == "delete_resource" and name:
        key = _find_resource_key(schemas, name)
        # refuse to delete a schema still referenced via $ref (it isn't an orphan, and removing
        # it would leave a dangling ref / invalid OpenAPI). Un-reference it first.
        if key is not None and schemas[key].get("x-kind") != "vocabulary" \
                and not _is_referenced(doc, key):
            del schemas[key]
            changed = True

    elif kind == "delete_state_machine" and name:
        sms = doc.get("x-state-machines") or {}
        key = name if name in sms else next((k for k in sms if _snake(k) == _snake(name)), None)
        if key is not None:
            del sms[key]
            changed = True
        rk = _find_resource_key(schemas, name)
        if rk is not None and "x-states" in schemas[rk]:
            del schemas[rk]["x-states"]
            changed = True

    if changed:
        with open(SPEC, "w", encoding="utf-8") as fh:
            yaml.safe_dump(doc, fh, **DUMP_KW)
    return changed


# --------------------------------------------------------------------------- #
# shared state: score + inventory + demand
# --------------------------------------------------------------------------- #
def load_state():
    cfg = fitness.load_config(CONFIG)
    # honor the recorded budgets if a best.json exists (set by run_loop init)
    best_path = os.path.join(HERE, "best.json")
    if os.path.exists(best_path):
        b = json.load(open(best_path))
        if "budgets" in b:
            cfg["control_budget"] = b["budgets"]["control_budget"]
            cfg["arch_budget"] = b["budgets"]["arch_budget"]
    demand = control_oracle.load_demand(DEMAND) if os.path.exists(DEMAND) \
        else control_oracle.extract_demand(REPO_ROOT)
    checklist = json.load(open(CHECKLIST))
    vocab = fitness.parse_vocab(SPEC, MIGRATION)
    result = score_mod.score_spec(SPEC, MIGRATION, config=cfg, demand=demand,
                                  checklist=checklist, root=REPO_ROOT)
    return cfg, demand, checklist, vocab, result


def unregistered_by_refcount(demand, vocab):
    ec, fp = control_oracle.code_sets(vocab)
    reg = ec | fp
    rows = []
    for code, info in demand["codes"].items():
        if code not in reg:
            rows.append((code, len(info.get("controls", []))))
    rows.sort(key=lambda r: (-r[1], r[0]))
    return rows


def spec_inventory(vocab):
    return {
        "resources": sorted(e["schema_name"] for e in vocab["entities"] if e.get("kind") != "vocabulary"),
        "endpoints": sorted({ep["path"] for ep in vocab["endpoints"]}),
        "event_types": sorted(vocab.get("event_types", [])),
        "task_types": sorted(vocab.get("task_types", [])),
        "field_count": len(vocab["fields"]),
    }


# --------------------------------------------------------------------------- #
# greedy backend (deterministic, no LLM)
# --------------------------------------------------------------------------- #
def propose_greedy(demand, vocab, result) -> dict:
    cov = result["coverage"]
    # feasibility regime: register the most-referenced unregistered code
    if result["violations"]["control"] > 0:
        rows = unregistered_by_refcount(demand, vocab)
        # only register codes that look like field paths (dotted), skip anything already odd
        for code, refs in rows:
            if re.match(r"^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$", code):
                return {"op": "add_field", "path": code, "type": "string",
                        "label": f"register {code}",
                        "note": f"feasibility: cited by {refs} control(s), was unregistered"}
    # feasible on controls: delete a TRUE orphan endpoint — one whose first path segment is
    # neither a resource plural (so the derivation requires its REST) nor an architecture-mandated
    # special / exempt prefix. Aligned with architecture_oracle so we never propose a move the
    # gate would just revert.
    import endpoint_rules as er
    cl = json.load(open(CHECKLIST))
    plurals = er.all_resource_plurals(vocab)
    exempt = set(cl.get("endpoint_exempt_prefixes", []))
    special = {er.first_segment(e["path"]) for e in cl.get("endpoints", [])}
    for path in sorted({ep["path"] for ep in vocab["endpoints"]}):
        seg = er.first_segment(path)
        if seg not in plurals and seg not in exempt and seg not in special:
            return {"op": "delete_endpoint", "path": path,
                    "label": f"delete orphan endpoint {path}",
                    "note": "no backing resource and not an architecture-mandated/exempt endpoint"}
    return {"op": "noop", "label": None, "note": "greedy: no beneficial move left"}


# --------------------------------------------------------------------------- #
# LLM backends
# --------------------------------------------------------------------------- #
def build_llm_prompt(demand, vocab, result) -> str:
    inv = spec_inventory(vocab)
    unreg = unregistered_by_refcount(demand, vocab)[:25]
    program = open(PROGRAM_MD, encoding="utf-8").read()
    ctx = {
        "score": result["score"],
        "violations": result["violations"],
        "coverage": result["coverage"],
        "complexity": result["complexity"],
        "complexity_components": result["complexity_components"],
        "arch_by_category": result["arch_by_category"],
        "top_unregistered_codes": [{"code": c, "ref_count": r} for c, r in unreg],
        "spec_inventory": {
            "resources": inv["resources"],
            "endpoints": inv["endpoints"],
            "event_types": inv["event_types"][:60],
            "task_types": inv["task_types"],
            "field_count": inv["field_count"],
        },
    }
    schema = (
        'Emit EXACTLY ONE move as a single-line JSON object on the LAST line, with keys '
        '"op","label","note" plus op args. Valid ops:\n'
        '  {"op":"add_field","path":"x.y","type":"string"}        register a cited code (close a control gap)\n'
        '  {"op":"add_event_type","name":"verb"}\n'
        '  {"op":"delete_field","path":"x.y"}                     delete an orphan\n'
        '  {"op":"delete_endpoint","path":"/cases"}\n'
        '  {"op":"delete_resource","name":"Foo"}\n'
        '  {"op":"delete_state_machine","name":"Foo"}\n'
        '  {"op":"delete_event_type","name":"verb"}\n'
        '  {"op":"delete_task_type","name":"type"}\n'
        '  {"op":"noop"}                                          if no beneficial move remains\n'
    )
    return (
        "You are the INNER-LOOP PROPOSER for minimizing core-api.yaml. Make ONE move that should "
        "lower the score. The score is judged by an immutable scorer and your move is auto-reverted "
        "if it doesn't help, so propose your single best move.\n\n"
        "=== CONTRACT (program.md) ===\n" + program + "\n\n"
        "=== CURRENT STATE (score.py) ===\n" + json.dumps(ctx, indent=2) + "\n\n"
        "=== HOW TO CHOOSE ===\n"
        "Follow Elon ordering. If control violations > 0 (infeasible), the dominant cost is the "
        "gap: register a high-ref unregistered code (add_field, or add_event_type if it is a verb), "
        "or delete an orphan that opens no gap. Once feasible, delete/merge orphans to cut "
        "complexity (concepts are weighted heaviest). Never delete an element the architecture "
        "requires. Do NOT delete_event_type / delete_task_type for a verb still referenced by event "
        "or task data — those codes register by NAME so the score won't drop, the move is refused, "
        "and you've wasted the turn. If nothing helps, emit noop.\n\n"
        "=== OUTPUT ===\n" + schema +
        "\nThink briefly, then output the single-line JSON op as the final line."
    )


def call_llm(prompt: str, backend: str) -> str:
    if backend == "api":
        try:
            import anthropic
        except ModuleNotFoundError:
            sys.exit("--backend api needs the anthropic SDK + ANTHROPIC_API_KEY.")
        client = anthropic.Anthropic()
        msg = client.messages.create(model=GENERATE_MODEL, max_tokens=2000,
                                     messages=[{"role": "user", "content": prompt}])
        return "".join(b.text for b in msg.content if getattr(b, "type", "") == "text")
    import shutil
    if not shutil.which("claude"):
        sys.exit("--backend cli needs the `claude` CLI on PATH.")
    r = subprocess.run(["claude", "-p", "--model", GENERATE_MODEL],
                       input=prompt, text=True, capture_output=True)
    if r.returncode != 0:
        sys.exit(f"claude CLI failed:\n{r.stderr}")
    return r.stdout


def parse_op(text: str) -> dict:
    for line in reversed(text.strip().splitlines()):
        line = line.strip()
        if line.startswith("{") and '"op"' in line:
            try:
                return json.loads(line)
            except json.JSONDecodeError:
                pass
    return {"op": "noop", "label": None, "note": "could not parse an op from the LLM output"}


def propose_llm(demand, vocab, result, backend) -> dict:
    return parse_op(call_llm(build_llm_prompt(demand, vocab, result), backend))


# --------------------------------------------------------------------------- #
# main
# --------------------------------------------------------------------------- #
def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    ap.add_argument("--backend", choices=["greedy", "api", "cli"], default="greedy")
    ap.add_argument("--dry-run", action="store_true",
                    help="print the proposed op but do not edit core-api.yaml")
    args = ap.parse_args(argv)

    _cfg, demand, _checklist, vocab, result = load_state()
    if args.backend == "greedy":
        op = propose_greedy(demand, vocab, result)
    else:
        op = propose_llm(demand, vocab, result, args.backend)

    # status tells the supervisor how to read a "no change":
    #   applied   -> the spec changed (a real move)
    #   converged -> the proposer deliberately has no move (noop) -> inner loop is done
    #   retry     -> the proposed op didn't apply (malformed / matched nothing) -> try again
    deliberate_noop = op.get("op") in (None, "noop")
    applied = False
    status = "converged" if deliberate_noop else "proposed"
    if not args.dry_run and not deliberate_noop:
        try:
            applied = apply_op(op)
        except Exception as e:  # noqa: BLE001 — never let a bad op crash the proposer
            applied, op = False, {**op, "note": f"op failed to apply: {e}"}
        status = "applied" if applied else "retry"

    print(json.dumps({"label": op.get("label"), "note": op.get("note"),
                      "op": op.get("op"), "applied": applied, "status": status}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
