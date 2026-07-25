#!/usr/bin/env python3
"""
move_memory.py — learned-move memory for the inner-loop proposer.

run_loop.py logs every adjudicated move to moves.jsonl: {label, delta, kept, ...}.
That log IS a training signal the proposer currently ignores — it re-derives every
move from scratch each turn and happily re-proposes shapes that were just reverted.
This module turns the log into memory: it clusters moves by TYPE, scores each type
by how often it was kept and how much it moved the score, and renders a compact
"what works / what doesn't" block that propose.py injects into the LLM prompt.

This is proposer-side only (NOT under prepare/) — it influences which move the
proposer TRIES, never how a move is SCORED. The immutable evaluator and the
keep-iff-lower rule are untouched, so memory can bias search toward winners
without any anti-gaming risk: a remembered-good move that no longer helps is still
reverted by the scorer.
"""

from __future__ import annotations

import json
import os
import re
import sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
MOVES = os.path.join(HERE, "moves.jsonl")

# Map a move label to a coarse type. Order matters — first match wins.
_TYPE_RULES = [
    (re.compile(r"\bextract\b|\bmixin\b|\ballOf\b", re.I), "extract_base"),
    (re.compile(r"\bfold\b.*\btask\b|\bdue_at\b|\btimer\b", re.I), "fold_timer"),
    (re.compile(r"\bnormali[sz]e\b", re.I), "normalize_code"),
    (re.compile(r"\bregister\b|\badd_field\b|\bimplied\b", re.I), "register_field"),
    (re.compile(r"\bmerge\b|\bunify\b|\bsubsume\b|\bcollapse\b", re.I), "merge"),
    (re.compile(r"\bdelete\b.*\bendpoint\b", re.I), "delete_endpoint"),
    (re.compile(r"\bdelete\b.*\bresource\b", re.I), "delete_resource"),
    (re.compile(r"\bdelete\b.*\b(event|verb)\b", re.I), "delete_event_type"),
    (re.compile(r"\bdelete\b.*\btask\b", re.I), "delete_task_type"),
    (re.compile(r"\bdelete\b", re.I), "delete_other"),
    (re.compile(r"\badd_event_type\b|\bregister.*verb\b", re.I), "add_event_type"),
]


def move_type(label: str, op: str | None = None) -> str:
    if op:
        return op
    for rx, name in _TYPE_RULES:
        if rx.search(label or ""):
            return name
    return (label or "other").strip().split()[0].lower() if label else "other"


def load_moves(path: str = MOVES) -> list[dict]:
    if not os.path.exists(path):
        return []
    out = []
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if not line:
            continue
        try:
            out.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return out


def summarize(moves: list[dict]) -> dict:
    agg: dict[str, dict] = defaultdict(lambda: {"attempts": 0, "kept": 0, "delta_sum": 0.0})
    for m in moves:
        t = move_type(m.get("label", ""), m.get("op"))
        a = agg[t]
        a["attempts"] += 1
        if m.get("kept"):
            a["kept"] += 1
        d = m.get("delta")
        if isinstance(d, (int, float)):
            a["delta_sum"] += d
    for t, a in agg.items():
        a["keep_rate"] = round(a["kept"] / a["attempts"], 3) if a["attempts"] else 0.0
        a["avg_delta"] = round(a["delta_sum"] / a["attempts"], 2) if a["attempts"] else 0.0
    return dict(agg)


def winning(summary: dict, min_attempts: int = 2) -> list[tuple[str, dict]]:
    return sorted(
        [(t, a) for t, a in summary.items() if a["attempts"] >= min_attempts and a["keep_rate"] >= 0.5],
        key=lambda kv: (kv[1]["keep_rate"], kv[1]["avg_delta"]),
    )


def losing(summary: dict, min_attempts: int = 3) -> list[tuple[str, dict]]:
    return sorted(
        [(t, a) for t, a in summary.items() if a["attempts"] >= min_attempts and a["keep_rate"] < 0.25],
        key=lambda kv: kv[1]["keep_rate"],
    )


def render_for_prompt(path: str = MOVES, max_items: int = 6) -> str:
    moves = load_moves(path)
    if len(moves) < 4:
        return ""  # not enough history to be worth biasing on
    s = summarize(moves)
    win = winning(s)[:max_items]
    lose = losing(s)[:max_items]
    lines = [f"=== LEARNED MOVES (from {len(moves)} past attempts) ==="]
    if win:
        lines.append("Move types that tend to be KEPT (favor these where applicable):")
        for t, a in sorted(win, key=lambda kv: kv[1]["keep_rate"], reverse=True):
            lines.append(f"  {t}: kept {a['kept']}/{a['attempts']} (avg Δ {a['avg_delta']})")
    if lose:
        lines.append("Move types that tend to be REVERTED (avoid unless you have a new angle):")
        for t, a in lose:
            lines.append(f"  {t}: kept {a['kept']}/{a['attempts']} (avg Δ {a['avg_delta']})")
    return "\n".join(lines) if (win or lose) else ""


def main(argv=None) -> int:
    moves = load_moves()
    s = summarize(moves)
    print(f"moves logged: {len(moves)}")
    for t, a in sorted(s.items(), key=lambda kv: -kv[1]["attempts"]):
        print(f"  {t:18} attempts={a['attempts']:3} kept={a['kept']:3} "
              f"keep_rate={a['keep_rate']:.2f} avg_delta={a['avg_delta']}")
    block = render_for_prompt()
    if block:
        print("\n--- prompt block ---\n" + block)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
