#!/usr/bin/env python3
"""
supervise.py — drive the full inner<->outer co-evolution to a fixed point.

THE INVARIANT: an OUTER cycle (expensive policy regeneration) runs ONLY after the INNER loop has
converged. The inner loop is cheap and runs many times per round; the outer loop is rare.

Per round:
  1. freeze demand + snapshot the baseline spec (the "old" spec, for affected-detection)
  2. INNER: propose -> adjudicate, repeated until CONVERGENCE, defined as any of:
       - the proposer makes no change to core-api.yaml (it has run out of moves), or
       - `--patience` consecutive proposed moves are reverted (no score improvement), or
       - `--max-inner` moves taken
  3. GATE: only now compute the spec delta vs the baseline and the AFFECTED policies
  4. if nothing is affected -> the spec converged and no policy is impacted -> FIXED POINT, stop
  5. OUTER: regenerate the affected policies (delegates to regenerate.py)
  6. re-freeze the demand; if it didn't move -> FIXED POINT, stop; else go to the next round
  Also stops at `--max-outer` rounds, or after `--ratchet` rounds with no best-score improvement.

Proposer (the inner move generator) — the one piece that must be plugged in:
  --proposer-cmd "<shell>"   a command (cwd = repo root) that edits core-api.yaml to make ONE move
                             and prints a JSON line {"label":..,"note":..} (auto-labelled if not).
                             Before each call the supervisor writes the current scorer state to
                             core-api-loop/.regen/proposer-context.json; the move contract is in
                             core-api-loop/program.md. Point it at an LLM (`claude -p < prompt`),
                             a script, anything. No change = inner converged.

Outer backend:
  --outer-backend stage|api|cli   stage preps+stages affected policies and PAUSES (generate them
                             in parallel, then `supervise.py --resume`); api/cli regenerate inline.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
import types

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(HERE, ".."))
PREPARE = os.path.join(HERE, "prepare")
sys.path.insert(0, HERE)
sys.path.insert(0, PREPARE)

import run_loop      # noqa: E402  (inner loop: init / adjudicate)
import regenerate    # noqa: E402  (outer loop: spec-snapshot / affected / cycle)

SPEC = os.path.join(REPO_ROOT, "core-api.yaml")
DEMAND = os.path.join(PREPARE, "demand.json")
STATE = os.path.join(HERE, ".regen", "supervisor-state.json")
ROUNDS_LOG = os.path.join(HERE, "supervisor-rounds.jsonl")
PROPOSER_CTX = os.path.join(HERE, ".regen", "proposer-context.json")
BASELINE_TAG = "supervisor-baseline"


def _spec_hash() -> str:
    return hashlib.sha256(open(SPEC, "rb").read()).hexdigest()


def _demand_codes() -> set:
    if not os.path.exists(DEMAND):
        return set()
    return set(json.load(open(DEMAND))["codes"].keys())


def _best_score():
    b = run_loop.read_best()
    return b["score"] if b else None


def _log_round(rec: dict) -> None:
    with open(ROUNDS_LOG, "a", encoding="utf-8") as fh:
        fh.write(json.dumps(rec) + "\n")


def _write_proposer_context(args) -> None:
    """Hand the proposer where-we-stand so it can choose a sensible move."""
    os.makedirs(os.path.dirname(PROPOSER_CTX), exist_ok=True)
    sys.path.insert(0, PREPARE)
    import score as score_mod  # noqa: E402
    import control_oracle      # noqa: E402
    import fitness             # noqa: E402
    cfg = fitness.load_config(os.path.join(PREPARE, "score-config.json"))
    best = run_loop.read_best()
    if best and "budgets" in best:
        cfg["control_budget"] = best["budgets"]["control_budget"]
        cfg["arch_budget"] = best["budgets"]["arch_budget"]
    demand = control_oracle.load_demand(DEMAND) if os.path.exists(DEMAND) \
        else control_oracle.extract_demand(REPO_ROOT)
    checklist = json.load(open(os.path.join(PREPARE, "architecture-spec.json")))
    result = score_mod.score_spec(SPEC, os.path.join(REPO_ROOT, "vocab-migration.json"),
                                  config=cfg, demand=demand, checklist=checklist, root=REPO_ROOT)
    with open(PROPOSER_CTX, "w", encoding="utf-8") as fh:
        json.dump({"program_md": os.path.join(HERE, "program.md"),
                   "spec": SPEC, "score": result}, fh, indent=2)


# --------------------------------------------------------------------------- #
# inner loop to convergence
# --------------------------------------------------------------------------- #
def _parse_proposer(stdout: str) -> dict:
    for line in reversed(stdout.strip().splitlines()):
        line = line.strip()
        if line.startswith("{"):
            try:
                return json.loads(line)
            except json.JSONDecodeError:
                pass
    return {}


def run_inner(args) -> dict:
    moves = kept = 0
    streak = 0
    bad_ops = 0
    score_before = _best_score()
    reason = "max_inner"
    for _ in range(args.max_inner):
        _write_proposer_context(args)
        before_hash = _spec_hash()
        proc = subprocess.run(args.proposer_cmd, shell=True, cwd=REPO_ROOT,
                              text=True, capture_output=True)
        if proc.returncode != 0:
            print(f"  proposer exited {proc.returncode}; treating as converged.\n{proc.stderr[:400]}")
            reason = "proposer_error"
            break
        j = _parse_proposer(proc.stdout)
        if _spec_hash() == before_hash:
            # no spec change: distinguish a deliberate noop (converged) from a bad op (retry)
            if j.get("status") == "retry" and bad_ops < args.propose_retries:
                bad_ops += 1
                print(f"  proposer op didn't apply ({j.get('note')}) -> retry "
                      f"{bad_ops}/{args.propose_retries}")
                continue
            print("  proposer has no further move -> inner converged.")
            reason = "proposer_no_change"
            break
        bad_ops = 0
        label = j.get("label") or f"auto move {moves + 1}"
        note = j.get("note")
        s_before = _best_score()
        run_loop.cmd_adjudicate(types.SimpleNamespace(
            label=label, note=note, allow_main=args.allow_main, no_revert=False,
            control_budget=None, arch_budget=None))
        moves += 1
        s_after = _best_score()
        if s_after is not None and s_before is not None and s_after < s_before:
            kept += 1
            streak = 0
        else:
            streak += 1
            if streak >= args.patience:
                print(f"  {streak} non-improving moves (patience={args.patience}) "
                      f"-> inner converged.")
                reason = "patience"
                break
    score_after = _best_score()
    improved = (score_before is not None and score_after is not None
                and score_after < score_before)
    return {"moves": moves, "kept": kept, "converged_reason": reason,
            "score_before": score_before, "score_after": score_after, "improved": improved}


# --------------------------------------------------------------------------- #
# one round
# --------------------------------------------------------------------------- #
def baseline_args():
    return types.SimpleNamespace(before=BASELINE_TAG, baseline_vocab=None,
                                 baseline_ref=None, demand=None)


def run_round(round_no: int, args) -> dict:
    print(f"\n############## ROUND {round_no} ##############")
    # 1. freeze demand + baseline spec
    run_loop.cmd_init(types.SimpleNamespace(control_budget=args.control_budget,
                                            arch_budget=args.arch_budget))
    regenerate.cmd_spec_snapshot(types.SimpleNamespace(tag=BASELINE_TAG))
    demand_before = _demand_codes()

    # 2. INNER to convergence
    print(f"\n--- round {round_no}: INNER loop (proposer: {args.proposer_cmd}) ---")
    inner = run_inner(args)
    print(f"--- inner: {inner['kept']}/{inner['moves']} kept, converged ({inner['converged_reason']}), "
          f"score {inner['score_before']} -> {inner['score_after']} ---")

    # 3+4. GATE: compute affected only AFTER convergence
    sel = regenerate.select_affected(baseline_args())
    affected = [r["slug"] for r in sel["affected"] if r["regeneratable"]]
    print(f"\n--- round {round_no}: GATE -> spec delta {sel['delta_registered']} codes, "
          f"{len(affected)} affected policy(ies): {affected or '(none)'} ---")

    rec = {"round": round_no, "inner": inner, "delta_registered": sel["delta_registered"],
           "affected": affected, "demand_before": len(demand_before)}

    if not affected:
        rec["outcome"] = "fixed_point_no_affected"
        _log_round(rec)
        print("==> FIXED POINT: inner converged and the spec delta impacts no policy. Stopping.")
        return {"stop": True, **rec}

    # 5. OUTER (gated)
    print(f"\n--- round {round_no}: OUTER regenerate {len(affected)} policy(ies) "
          f"(backend={args.outer_backend}) ---")
    cyc = types.SimpleNamespace(
        slug=None, affected=True, before=BASELINE_TAG, baseline_vocab=None, baseline_ref=None,
        demand=None, backend=args.outer_backend, jobs=args.jobs, no_reparse=False,
        strict=False, show=False, note=f"supervisor round {round_no}", resume=False)
    regenerate.cmd_cycle(cyc)

    if args.outer_backend == "stage":
        pending = [s for s in affected if not os.path.exists(regenerate.generated_path(s))]
        if pending:
            _save_state({"round": round_no, "demand_before": sorted(demand_before),
                         "affected": affected, "phase": "awaiting_outer_generation"})
            rec["outcome"] = "paused_for_generation"
            _log_round(rec)
            print(f"\n==> PAUSED: generate the {len(pending)} staged policy(ies) in parallel, "
                  f"then `supervise.py --resume`.")
            return {"stop": True, "paused": True, **rec}

    return _finish_round_after_outer(round_no, args, demand_before, affected, rec)


def _finish_round_after_outer(round_no, args, demand_before, affected, rec) -> dict:
    """Apply+measure already done by cmd_cycle (inline backends) or by --resume; here we
    re-freeze and decide whether the demand moved."""
    run_loop.cmd_init(types.SimpleNamespace(control_budget=args.control_budget,
                                            arch_budget=args.arch_budget))
    demand_after = _demand_codes()
    moved = demand_after != set(demand_before)
    rec["demand_after"] = len(demand_after)
    rec["demand_moved"] = bool(moved)
    if not moved:
        rec["outcome"] = "fixed_point_demand_stable"
        _log_round(rec)
        print("==> FIXED POINT: demand did not move after regeneration. Stopping.")
        return {"stop": True, **rec}
    rec["outcome"] = "continue"
    _log_round(rec)
    print(f"==> demand moved ({len(set(demand_before))} -> {len(demand_after)} codes); next round.")
    return {"stop": False, **rec}


def _save_state(d: dict) -> None:
    os.makedirs(os.path.dirname(STATE), exist_ok=True)
    json.dump(d, open(STATE, "w"))


def _load_state():
    return json.load(open(STATE)) if os.path.exists(STATE) else None


# --------------------------------------------------------------------------- #
# driver
# --------------------------------------------------------------------------- #
def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    ap.add_argument("--proposer-cmd", default=None,
                    help="shell command that edits core-api.yaml to make ONE move (required "
                         "unless --resume)")
    ap.add_argument("--outer-backend", choices=["stage", "api", "cli"], default="stage")
    ap.add_argument("--jobs", type=int, default=4)
    ap.add_argument("--patience", type=int, default=2,
                    help="consecutive non-improving inner moves that mean 'converged'")
    ap.add_argument("--propose-retries", type=int, default=2,
                    help="times to retry the proposer when an op fails to apply before converging")
    ap.add_argument("--max-inner", type=int, default=20, help="inner-move cap per round")
    ap.add_argument("--max-outer", type=int, default=5, help="outer rounds cap")
    ap.add_argument("--ratchet", type=int, default=2,
                    help="stop after this many rounds with no best-score improvement")
    ap.add_argument("--allow-main", action="store_true")
    ap.add_argument("--control-budget", type=int, default=None)
    ap.add_argument("--arch-budget", type=int, default=None)
    ap.add_argument("--resume", action="store_true",
                    help="resume a stage-backend round paused awaiting outer generation")
    args = ap.parse_args(argv)

    start_round = 1
    if args.resume:
        st = _load_state()
        if not st or st.get("phase") != "awaiting_outer_generation":
            sys.exit("nothing to resume (no paused supervisor state).")
        print(f"resuming round {st['round']} (apply + measure the generated policies) ...")
        regenerate.cmd_cycle(types.SimpleNamespace(
            slug=None, affected=True, before=BASELINE_TAG, baseline_vocab=None, baseline_ref=None,
            demand=None, backend="stage", jobs=args.jobs, no_reparse=False,
            strict=False, show=False, note=None, resume=True))
        r = _finish_round_after_outer(st["round"], args, set(st["demand_before"]),
                                      st["affected"], {"round": st["round"], "resumed": True})
        os.path.exists(STATE) and os.remove(STATE)
        if r["stop"]:
            return 0
        start_round = st["round"] + 1
        if start_round > args.max_outer:
            print(f"\n==> resumed round complete; reached --max-outer ({args.max_outer}). Stopping.")
            return 0

    if not args.proposer_cmd:
        sys.exit("supervise needs --proposer-cmd (the inner-move generator), unless --resume.")

    best_history = []
    no_improve = 0
    for rnd in range(start_round, args.max_outer + 1):
        res = run_round(rnd, args)
        if res.get("stop"):
            return 0
        # round-level ratchet on best score
        sc = _best_score()
        if best_history and sc is not None and sc >= best_history[-1]:
            no_improve += 1
        else:
            no_improve = 0
        best_history.append(sc)
        if no_improve >= args.ratchet:
            print(f"\n==> RATCHET: {no_improve} rounds with no improvement. Stopping.")
            return 0
    print(f"\n==> reached --max-outer ({args.max_outer}) rounds. Stopping.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
