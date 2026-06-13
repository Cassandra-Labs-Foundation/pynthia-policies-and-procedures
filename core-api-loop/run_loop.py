#!/usr/bin/env python3
"""
run_loop.py — AutoResearch-style keep-iff-best runner for core-api.yaml.

Orchestrates the loop: a move edits core-api.yaml, score.py judges it, the runner KEEPS (git
commit) or REVERTS (git checkout) the spec, and logs every attempt to moves.jsonl. The accumulated
git history of kept moves + moves.jsonl IS the learned-move library.

Subcommands
-----------
  init        Freeze the demand snapshot and record the baseline best score (best.json).
              Run once at the start of an inner-loop session.
  status      Print the current best score.
  adjudicate  Score the current working-tree core-api.yaml against best.json, then:
                * KEEP   (score < best): git commit core-api.yaml, update best.json
                * REVERT (otherwise)   : git checkout -- core-api.yaml
              Logs the attempt to moves.jsonl. This is the unit of human-approved iteration.
  run         Autonomous loop: repeat [--propose-cmd edits spec] -> adjudicate, --iters times.

Safety
------
  * Commits only core-api.yaml, never the immutable harness or policies.
  * Refuses to commit on the default branch unless --allow-main is passed (use a loop branch).
  * Budgets can be overridden per session with --control-budget / --arch-budget (forwarded to
    score.py); they are recorded in best.json so comparisons stay apples-to-apples.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(HERE, ".."))
PREPARE = os.path.join(HERE, "prepare")
sys.path.insert(0, PREPARE)

import control_oracle        # noqa: E402
import architecture_oracle   # noqa: E402
import fitness               # noqa: E402
import score as score_mod    # noqa: E402

SPEC = os.path.join(REPO_ROOT, "core-api.yaml")
MIGRATION = os.path.join(REPO_ROOT, "vocab-migration.json")
DEMAND = os.path.join(PREPARE, "demand.json")
CONFIG = os.path.join(PREPARE, "score-config.json")
CHECKLIST = os.path.join(PREPARE, "architecture-spec.json")
BEST = os.path.join(HERE, "best.json")
MOVES = os.path.join(HERE, "moves.jsonl")


# --------------------------------------------------------------------------- #
# helpers
# --------------------------------------------------------------------------- #
def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def git(*args: str, check: bool = True) -> str:
    out = subprocess.run(["git", "-C", REPO_ROOT, *args],
                         capture_output=True, text=True)
    if check and out.returncode != 0:
        sys.exit(f"git {' '.join(args)} failed:\n{out.stderr}")
    return out.stdout.strip()


def current_branch() -> str:
    return git("rev-parse", "--abbrev-ref", "HEAD")


def load_config(args) -> dict:
    cfg = fitness.load_config(CONFIG)
    if getattr(args, "control_budget", None) is not None:
        cfg["control_budget"] = args.control_budget
    if getattr(args, "arch_budget", None) is not None:
        cfg["arch_budget"] = args.arch_budget
    return cfg


def load_demand():
    if os.path.exists(DEMAND):
        return control_oracle.load_demand(DEMAND)
    return control_oracle.extract_demand(REPO_ROOT)


def score_current(cfg: dict) -> dict:
    demand = load_demand()
    checklist = json.load(open(CHECKLIST))
    return score_mod.score_spec(SPEC, MIGRATION, config=cfg, demand=demand,
                                checklist=checklist, root=REPO_ROOT)


def log_move(record: dict) -> None:
    with open(MOVES, "a", encoding="utf-8") as fh:
        fh.write(json.dumps(record) + "\n")


def read_best() -> dict | None:
    return json.load(open(BEST)) if os.path.exists(BEST) else None


def write_best(result: dict) -> None:
    with open(BEST, "w", encoding="utf-8") as fh:
        json.dump(result, fh, indent=2)
        fh.write("\n")


# --------------------------------------------------------------------------- #
# subcommands
# --------------------------------------------------------------------------- #
def cmd_init(args) -> int:
    # 1. freeze demand
    demand = control_oracle.extract_demand(REPO_ROOT)
    with open(DEMAND, "w", encoding="utf-8") as fh:
        json.dump(demand, fh, indent=2, ensure_ascii=False)
        fh.write("\n")
    print(f"froze demand: {DEMAND} ({demand['meta']['unique_codes']} codes, "
          f"{demand['meta']['controls']} controls)")
    # 2. baseline score
    cfg = load_config(args)
    result = score_current(cfg)
    result["recorded_at"] = _now()
    result["budgets"] = {"control_budget": cfg["control_budget"],
                         "arch_budget": cfg["arch_budget"]}
    write_best(result)
    print(f"baseline best score: {result['score']} "
          f"(feasible={result['feasible']}, "
          f"unregistered={result['coverage']['unregistered_codes']}, "
          f"uncovered_arch={result['coverage']['uncovered_arch_elements']}, "
          f"complexity={result['complexity']})")
    return 0


def cmd_status(args) -> int:
    best = read_best()
    if not best:
        print("no best.json — run `run_loop.py init` first.")
        return 1
    print(json.dumps({k: best[k] for k in ("score", "feasible", "coverage",
                                           "complexity", "budgets", "recorded_at")
                      if k in best}, indent=2))
    return 0


def cmd_adjudicate(args) -> int:
    best = read_best()
    if not best:
        print("no best.json — run `run_loop.py init` first.")
        return 1
    cfg = load_config(args)
    # keep budgets consistent with the recorded baseline unless explicitly overridden
    if args.control_budget is None and "budgets" in best:
        cfg["control_budget"] = best["budgets"]["control_budget"]
    if args.arch_budget is None and "budgets" in best:
        cfg["arch_budget"] = best["budgets"]["arch_budget"]

    cand = score_current(cfg)
    keep = cand["score"] < best["score"]
    record = {
        "ts": _now(),
        "label": args.label,
        "candidate_score": cand["score"],
        "best_score": best["score"],
        "delta": round(cand["score"] - best["score"], 4),
        "kept": keep,
        "feasible": cand["feasible"],
        "coverage": cand["coverage"],
        "complexity": cand["complexity"],
    }

    branch = current_branch()
    if keep:
        if branch == "main" and not args.allow_main:
            log_move({**record, "kept": False, "note": "refused commit on main"})
            sys.exit("score improved but on branch 'main' — create a loop branch or pass "
                     "--allow-main. NOT committing.")
        git("add", "core-api.yaml")
        msg = f"loop: {args.label}\n\nscore {best['score']} -> {cand['score']} " \
              f"(unreg {cand['coverage']['unregistered_codes']}, " \
              f"arch {cand['coverage']['uncovered_arch_elements']}, " \
              f"cx {cand['complexity']})"
        git("commit", "-m", msg)
        record["commit"] = git("rev-parse", "--short", "HEAD")
        cand["recorded_at"] = _now()
        cand["budgets"] = {"control_budget": cfg["control_budget"],
                           "arch_budget": cfg["arch_budget"]}
        write_best(cand)
        verdict = f"KEEP  (Δ={record['delta']}, commit {record['commit']})"
    else:
        if not args.no_revert:
            git("checkout", "--", "core-api.yaml")
        verdict = f"REVERT (Δ={record['delta']}{'' if not args.no_revert else ', left dirty'})"

    log_move(record)
    print(f"[{args.label}] {verdict}")
    print(f"  candidate {cand['score']} vs best {best['score']} | "
          f"unreg {cand['coverage']['unregistered_codes']} | "
          f"arch {cand['coverage']['uncovered_arch_elements']} | cx {cand['complexity']}")
    return 0


def cmd_run(args) -> int:
    if not read_best():
        print("no best.json — running init first.")
        cmd_init(args)
    for i in range(args.iters):
        print(f"\n=== iteration {i + 1}/{args.iters} ===")
        if args.propose_cmd:
            print(f"propose: {args.propose_cmd}")
            rc = subprocess.run(args.propose_cmd, shell=True, cwd=REPO_ROOT).returncode
            if rc != 0:
                print(f"propose-cmd exited {rc}; skipping adjudication this round.")
                continue
        else:
            print("no --propose-cmd: edit core-api.yaml now, then re-run `adjudicate`. "
                  "(autonomous run needs a proposer command.)")
            return 0
        args.label = args.label or f"auto move {i + 1}"
        cmd_adjudicate(args)
        args.label = None
    return 0


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    sub = ap.add_subparsers(dest="cmd", required=True)

    def add_common(p):
        p.add_argument("--control-budget", type=int, default=None)
        p.add_argument("--arch-budget", type=int, default=None)

    p_init = sub.add_parser("init", help="freeze demand + record baseline best score")
    add_common(p_init)
    p_init.set_defaults(func=cmd_init)

    p_status = sub.add_parser("status", help="print current best score")
    p_status.set_defaults(func=cmd_status)

    p_adj = sub.add_parser("adjudicate", help="score working tree, keep or revert")
    add_common(p_adj)
    p_adj.add_argument("--label", required=True, help="name of this move")
    p_adj.add_argument("--allow-main", action="store_true",
                       help="permit committing on the default branch")
    p_adj.add_argument("--no-revert", action="store_true",
                       help="on a losing move, leave the working tree dirty instead of reverting")
    p_adj.set_defaults(func=cmd_adjudicate)

    p_run = sub.add_parser("run", help="autonomous propose->adjudicate loop")
    add_common(p_run)
    p_run.add_argument("--propose-cmd", default=None,
                       help="shell command that edits core-api.yaml (the proposer)")
    p_run.add_argument("--iters", type=int, default=1)
    p_run.add_argument("--label", default=None)
    p_run.add_argument("--allow-main", action="store_true")
    p_run.add_argument("--no-revert", action="store_true")
    p_run.set_defaults(func=cmd_run)

    args = ap.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
