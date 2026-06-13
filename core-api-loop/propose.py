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

SPEC = os.path.join(REPO_ROOT, "core-api.yaml")
MIGRATION = os.path.join(REPO_ROOT, "vocab-migration.json")
DEMAND = os.path.join(PREPARE, "demand.json")
CONFIG = os.path.join(PREPARE, "score-config.json")
CHECKLIST = os.path.join(PREPARE, "architecture-spec.json")
PROGRAM_MD = os.path.join(HERE, "program.md")
GENERATE_MODEL = "claude-opus-4-8"


# --------------------------------------------------------------------------- #
# surgical text-edit applier (no YAML round-trip)
# --------------------------------------------------------------------------- #
def _find_section(lines: list[str], name: str):
    """Return (body_start, body_end) line indices for a top-level `name:` section."""
    hdr = None
    for i, ln in enumerate(lines):
        if ln[:1] not in (" ", "\t", "#") and ln.split(":", 1)[0] == name and ln.rstrip("\n").endswith(":"):
            hdr = i
            break
    if hdr is None:
        return None
    body_start = hdr + 1
    body_end = len(lines)
    for j in range(body_start, len(lines)):
        s = lines[j].rstrip("\n")
        if not s.strip():
            continue
        if s.startswith("#"):
            body_end = j
            break
        if lines[j][:1] not in (" ", "\t") and not s.startswith("- "):
            body_end = j
            break
    return body_start, body_end


def _is_2indent_key(line: str) -> bool:
    # a 2-space-indented mapping key — NOT a deeper indent and NOT a "- " list item
    # (state-machine states are `  - state`, which must count as children, not keys)
    return line[:2] == "  " and len(line) > 2 and line[2] not in (" ", "-")


def add_list_item(lines, section, item) -> bool:
    sec = _find_section(lines, section)
    if not sec:
        return False
    bs, be = sec
    if any(lines[i].strip() == f"- {item}" for i in range(bs, be)):
        return False
    lines.insert(bs, f"- {item}\n")
    return True


def delete_list_item(lines, section, item) -> bool:
    sec = _find_section(lines, section)
    if not sec:
        return False
    bs, be = sec
    for i in range(bs, be):
        if lines[i].strip() == f"- {item}":
            del lines[i]
            return True
    return False


def add_field(lines, path, typ="string") -> bool:
    sec = _find_section(lines, "fields")
    if not sec:
        return False
    bs, be = sec
    if any(lines[i].startswith(f"  {path}:") for i in range(bs, be)):
        return False
    lines.insert(bs, f"  {path}: {typ}\n")
    return True


def delete_field(lines, path) -> bool:
    sec = _find_section(lines, "fields")
    if not sec:
        return False
    bs, be = sec
    for i in range(bs, be):
        if _is_2indent_key(lines[i]) and lines[i].rstrip("\n").startswith(f"  {path}:"):
            if lines[i].split(":", 1)[0].strip() == path:
                del lines[i]
                return True
    return False


def delete_block(lines, section, key) -> bool:
    """Delete a 2-indent keyed block (and its deeper-indented children) within a section."""
    sec = _find_section(lines, section)
    if not sec:
        return False
    bs, be = sec
    start = None
    for i in range(bs, be):
        if _is_2indent_key(lines[i]) and lines[i].rstrip("\n").rstrip() == f"  {key}:":
            start = i
            break
    if start is None:
        return False
    end = be
    for j in range(start + 1, be):
        if lines[j].strip() == "":
            continue
        if _is_2indent_key(lines[j]) or lines[j][:1] not in (" ", "\t"):
            end = j
            break
    del lines[start:end]
    return True


def apply_op(op: dict) -> bool:
    """Apply one edit op to core-api.yaml in place. Returns True iff the file changed.

    Defensive: a malformed op (unknown kind, missing/empty path|name) is treated as a no-op,
    never an exception — an LLM proposer can and will emit imperfect ops, and a bad suggestion
    should just be ignored (and then reverted/converged), not crash the run."""
    lines = open(SPEC, encoding="utf-8").read().splitlines(keepends=True)
    kind = op.get("op")
    path = (op.get("path") or "").strip()
    name = (op.get("name") or "").strip()
    changed = False
    if kind == "add_field" and path:
        changed = add_field(lines, path, op.get("type", "string"))
    elif kind == "delete_field" and path:
        changed = delete_field(lines, path)
    elif kind == "add_event_type" and name:
        changed = add_list_item(lines, "event_types", name)
    elif kind == "delete_event_type" and name:
        changed = delete_list_item(lines, "event_types", name)
    elif kind == "delete_task_type" and name:
        changed = delete_list_item(lines, "task_types", name)
    elif kind == "delete_endpoint" and path:
        changed = delete_block(lines, "endpoints", path)
    elif kind == "delete_resource" and name:
        changed = delete_block(lines, "resources", name)
    elif kind == "delete_state_machine" and name:
        changed = delete_block(lines, "state_machines", name)
    else:
        return False  # noop or malformed/unsupported op
    if changed:
        open(SPEC, "w", encoding="utf-8").write("".join(lines))
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
        "requires. If nothing helps, emit noop.\n\n"
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

    applied = False
    if not args.dry_run and op.get("op") not in (None, "noop"):
        try:
            applied = apply_op(op)
        except Exception as e:  # noqa: BLE001 — never let a bad op crash the proposer
            op = {"op": "noop", "label": None, "note": f"op failed to apply: {e}"}
        if not applied and op.get("op") != "noop":
            # target absent / nothing changed -> signal convergence to the supervisor
            op = {"op": "noop", "label": None,
                  "note": f"op {op.get('op')} matched nothing (already applied?)"}

    # the supervisor parses {"label","note"} from the last JSON line; "no change" = converged
    print(json.dumps({"label": op.get("label"), "note": op.get("note"),
                      "op": op.get("op"), "applied": applied}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
