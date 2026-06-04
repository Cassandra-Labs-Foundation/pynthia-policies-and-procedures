#!/usr/bin/env python3
"""Per-phase timestamp instrumentation for long-running Claude tasks.

Usage:
  timing.py start <run_id>
  timing.py mark  <run_id> <event> [--phase <phase>] [--detail "k=v,k=v"]
  timing.py end   <run_id>
  timing.py report <run_id>

Writes JSONL to .cache/timing/<run_id>.jsonl. See SKILL.md for the recommended
phase labels used by the regenerate-policies task and the narrative skill.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path


def log_dir() -> Path:
    """Resolve the timing log directory.

    Uses TIMING_DIR env var if set; otherwise `.cache/timing/` under the
    current working directory. The regenerator runs from the project root
    so the default is correct for the standard case.
    """
    env = os.environ.get("TIMING_DIR")
    if env:
        return Path(env)
    return Path(".cache/timing")


def log_path(run_id: str) -> Path:
    d = log_dir()
    d.mkdir(parents=True, exist_ok=True)
    # Sanitize run_id so it's safe as a filename (no slashes, no colons on Windows).
    safe = run_id.replace("/", "_").replace(":", "-")
    return d / f"{safe}.jsonl"


def read_marks(path: Path) -> list[dict]:
    if not path.exists():
        return []
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def write_mark(path: Path, mark: dict) -> None:
    with path.open("a") as f:
        f.write(json.dumps(mark) + "\n")


def parse_detail(s: str | None) -> dict:
    if not s:
        return {}
    out: dict = {}
    for pair in s.split(","):
        pair = pair.strip()
        if not pair:
            continue
        if "=" not in pair:
            out[pair] = True
            continue
        k, v = pair.split("=", 1)
        out[k.strip()] = v.strip()
    return out


def cmd_start(args: argparse.Namespace) -> int:
    path = log_path(args.run_id)
    if path.exists():
        path.unlink()
    now = time.time()
    write_mark(path, {
        "event": "run_start",
        "ts": now,
        "ts_iso": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now)),
        "wall_elapsed_s": 0.0,
    })
    print(f"[  0.00s] run_start  (log: {path})", file=sys.stderr)
    return 0


def cmd_mark(args: argparse.Namespace) -> int:
    path = log_path(args.run_id)
    marks = read_marks(path)
    if not marks:
        # Auto-start if missing; convenient for ad-hoc use.
        cmd_start(args)
        marks = read_marks(path)
    start_ts = marks[0]["ts"]
    now = time.time()
    detail = parse_detail(args.detail)
    mark = {
        "event": args.event,
        "ts": now,
        "wall_elapsed_s": round(now - start_ts, 3),
    }
    if args.phase:
        mark["phase"] = args.phase
    if detail:
        mark["detail"] = detail
    write_mark(path, mark)
    bits = [f"[{mark['wall_elapsed_s']:>7.2f}s]", args.event]
    if args.phase:
        bits.append(f"[{args.phase}]")
    if detail:
        bits.append(json.dumps(detail, separators=(",", ":")))
    print(" ".join(bits), file=sys.stderr)
    return 0


def cmd_end(args: argparse.Namespace) -> int:
    path = log_path(args.run_id)
    marks = read_marks(path)
    if not marks:
        print(f"timing.end: no log for run_id={args.run_id}", file=sys.stderr)
        return 1
    start_ts = marks[0]["ts"]
    now = time.time()
    write_mark(path, {
        "event": "run_end",
        "ts": now,
        "wall_elapsed_s": round(now - start_ts, 3),
    })
    return cmd_report(args)


def cmd_report(args: argparse.Namespace) -> int:
    path = log_path(args.run_id)
    marks = read_marks(path)
    if not marks:
        print(f"timing.report: no log for run_id={args.run_id}", file=sys.stderr)
        return 1

    print(f"\nTiming report — run {args.run_id}")
    print("=" * 78)
    print(f"{'Elapsed':>10}  {'Delta':>8}  Event")
    print("-" * 78)
    prev_ts = marks[0]["ts"]
    for m in marks:
        elapsed = m.get("wall_elapsed_s", m["ts"] - marks[0]["ts"])
        delta = m["ts"] - prev_ts
        phase_str = f" [{m['phase']}]" if m.get("phase") else ""
        detail_str = ""
        if m.get("detail"):
            detail_str = "  " + json.dumps(m["detail"], separators=(",", ":"))
        print(f"{elapsed:>9.2f}s  {delta:>7.2f}s  {m['event']}{phase_str}{detail_str}")
        prev_ts = m["ts"]

    # Per-phase totals: a mark's phase label describes the work that produced it,
    # so the delta from the previous mark counts toward that phase.
    phase_totals: dict[str, float] = {}
    unphased_total = 0.0
    for i in range(1, len(marks)):
        delta = marks[i]["ts"] - marks[i - 1]["ts"]
        phase = marks[i].get("phase")
        if phase:
            phase_totals[phase] = phase_totals.get(phase, 0.0) + delta
        else:
            unphased_total += delta

    if phase_totals or unphased_total > 0:
        print()
        print("Per-phase totals:")
        for phase, total in sorted(phase_totals.items(), key=lambda x: -x[1]):
            print(f"  {phase:<28} {total:>8.2f}s")
        if unphased_total > 0:
            print(f"  {'(no phase)':<28} {unphased_total:>8.2f}s")

    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_start = sub.add_parser("start", help="Initialize a new timing run")
    p_start.add_argument("run_id")
    p_start.set_defaults(func=cmd_start)

    p_mark = sub.add_parser("mark", help="Append a timestamped event mark")
    p_mark.add_argument("run_id")
    p_mark.add_argument("event")
    p_mark.add_argument("--phase", default=None)
    p_mark.add_argument("--detail", default=None,
                        help="Comma-separated key=value pairs")
    p_mark.set_defaults(func=cmd_mark)

    p_end = sub.add_parser("end", help="Append run_end and print report")
    p_end.add_argument("run_id")
    p_end.set_defaults(func=cmd_end)

    p_report = sub.add_parser("report", help="Print report without ending the run")
    p_report.add_argument("run_id")
    p_report.set_defaults(func=cmd_report)

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
