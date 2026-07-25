#!/usr/bin/env python3
"""Mechanically validate architecture-decision references in the codebase.

The core cites architecture decisions in comments — "per D4", "(D23)", "D19
specifies mTLS" — as the justification for why a table, a constraint or an
auth rule is shaped the way it is. Those citations are load-bearing
documentation: they are how someone reading a migration finds out WHY.

Until the consolidation they pointed at a decision log in a different repo and
resolved to nothing, so nobody could tell a live citation from a stale one.
This closes that: every DN in the code must name a decision the log actually
defines.

  registered    DN has a matching "### Decision N:" section in the log
  unresolved    DN has no such section — a typo, or a decision that was
                renumbered or removed out from under the code

Exit code 0 always (this is a reporting tool); use --strict to exit 1 when any
citation is unresolved. That is the form wired into core-ci.

Usage:
    python3 scripts/check_decision_refs.py [--json] [--strict]
        [--log core/architecture-decisions.md]
"""

import argparse
import json
import re
import subprocess
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_LOG = ROOT / "core" / "architecture-decisions.md"

# "### Decision 4: Event Architecture"
DECISION_RE = re.compile(r"^###\s+Decision\s+(\d{1,2})\s*:\s*(.+?)\s*$", re.M)

# A citation is a bare DN token: "per D4", "(D23)", "D19 specifies".
# \b on both sides keeps it off 3D/2D and off identifiers like FOO_D1.
CITATION_RE = re.compile(r"\bD(\d{1,2})\b")

# Where citations are expected to live. The log itself is excluded — it uses
# "Decision N" prose, and self-citation would be circular.
SEARCH_GLOBS = ("core/**", "compliance/**", "scripts/**", "analytics/**", ".github/**")
SEARCH_SUFFIXES = {".ts", ".sql", ".py", ".md", ".yaml", ".yml", ".sh"}


def tracked_files(root: Path, log_rel: str) -> list[Path]:
    """Every tracked file that could carry a citation. Tracked-only, so a local
    .venv or build/ directory can never inflate or break the count."""
    out = subprocess.run(
        ["git", "-C", str(root), "ls-files", *SEARCH_GLOBS],
        capture_output=True, text=True, check=True,
    ).stdout.splitlines()
    return [
        root / p for p in out
        if Path(p).suffix in SEARCH_SUFFIXES and p != log_rel
    ]


def parse_log(path: Path) -> dict[int, str]:
    # The log has some mojibake from an old encoding round-trip; titles are for
    # display only, so decode leniently rather than failing the check on it.
    text = path.read_text(encoding="utf-8", errors="replace")
    return {int(n): title for n, title in DECISION_RE.findall(text)}


def scan(files: list[Path], root: Path):
    per_decision = Counter()
    per_file = Counter()
    sites = defaultdict(list)
    for f in files:
        try:
            text = f.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        for i, line in enumerate(text.splitlines(), 1):
            for n in CITATION_RE.findall(line):
                n = int(n)
                per_decision[n] += 1
                per_file[str(f.relative_to(root))] += 1
                sites[n].append(f"{f.relative_to(root)}:{i}")
    return per_decision, per_file, sites


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--log", default=str(DEFAULT_LOG), help="path to the decision log")
    ap.add_argument("--json", action="store_true", help="JSON output only")
    ap.add_argument("--strict", action="store_true",
                    help="exit 1 if any citation is unresolved")
    args = ap.parse_args()

    log_path = Path(args.log)
    if not log_path.is_file():
        print(f"decision log not found: {log_path}", file=sys.stderr)
        return 2

    decisions = parse_log(log_path)
    log_rel = str(log_path.resolve().relative_to(ROOT))
    files = tracked_files(ROOT, log_rel)
    per_decision, per_file, sites = scan(files, ROOT)

    defined = set(decisions)
    cited = set(per_decision)
    unresolved = sorted(cited - defined)
    uncited = sorted(defined - cited)
    total = sum(per_decision.values())

    result = {
        "decisions_defined": len(defined),
        "citations_total": total,
        "decisions_cited": len(cited),
        "files_citing": len(per_file),
        "unresolved": {f"D{n}": sites[n] for n in unresolved},
        "uncited_decisions": [f"D{n}" for n in uncited],
    }

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"decision log      : {log_rel} ({len(defined)} decisions)")
        print(f"citations         : {total} across {len(per_file)} files")
        print(f"decisions cited   : {len(cited)}/{len(defined)}")
        if uncited:
            # Not a failure. A decision no code cites is either purely
            # architectural or not built yet — useful signal, not a defect.
            print(f"never cited       : {', '.join('D%d' % n for n in uncited)}")
        print()
        print("most-cited:")
        for n, c in per_decision.most_common(5):
            print(f"   D{n:<3} {c:>3}  {decisions.get(n, '?')}")
        if unresolved:
            print()
            print(f"UNRESOLVED ({len(unresolved)}) — cited but not defined in the log:")
            for n in unresolved:
                print(f"   D{n} cited at:")
                for s in sites[n][:5]:
                    print(f"      {s}")
                if len(sites[n]) > 5:
                    print(f"      ... and {len(sites[n]) - 5} more")

    if args.strict and unresolved:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
