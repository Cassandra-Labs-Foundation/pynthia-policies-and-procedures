#!/usr/bin/env python3
"""Fail the build when the money-code allowlists drift from the spec.

The set of event codes that count as money movement is declared ONCE, in
core/core-api.yaml's x-events registry: every entry carrying `x-money: true`.
Two consumers filter on that set and each carries its own hardcoded copy:

  - aggregator.is_money_code(...)      the Postgres function the payment hub
                                       and BSA approver call (latest
                                       `create or replace` across
                                       core/supabase/migrations/*.sql wins)
  - analytics/aggregator_views.sql     the DuckDB spanning view the reporters
                                       read (agg_money_events)

Before this gate, a new money rail registered in x-events was silently
invisible to both: the FBO position never moved and the BSA lookback never
saw it, with nothing red anywhere. Now the drift is loud: mark the code
`x-money: true` in the spec and this script fails until BOTH copies carry it
(and vice versa — a code removed from the spec must leave both copies).

Deliberately NOT in scope: which codes OUGHT to be money. Whether returns and
inbound codes move the FBO position is the open sign question in TODO §6
("the call is Lorenzo's") — this gate only guarantees that whatever the
answer is, it lands everywhere at once.

Usage:
  python3 scripts/check_money_codes.py    # exit 1 on any drift
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
SPEC = ROOT / "core" / "core-api.yaml"
VIEWS = ROOT / "analytics" / "aggregator_views.sql"
MIGRATIONS = ROOT / "core" / "supabase" / "migrations"

CODE_RE = re.compile(r"'([a-z0-9_.]+)'")


def spec_money_codes() -> set[str]:
    spec = yaml.safe_load(SPEC.read_text())
    events = spec.get("x-events") or {}
    if not events:
        sys.exit("check_money_codes: spec carries no x-events registry")
    return {code for code, entry in events.items()
            if isinstance(entry, dict) and entry.get("x-money") is True}


def sql_fn_codes() -> tuple[set[str], str]:
    """Codes in the LATEST definition of aggregator.is_money_code."""
    defining = [p for p in sorted(MIGRATIONS.glob("*.sql"))
                if 'function "aggregator".is_money_code' in p.read_text()]
    if not defining:
        sys.exit("check_money_codes: no migration defines aggregator.is_money_code")
    latest = defining[-1]
    text = latest.read_text()
    # The function body: from its `create or replace` to the closing `$$;`
    start = text.rindex('function "aggregator".is_money_code')
    body = text[start:text.index("$$;", start)]
    return set(CODE_RE.findall(body)), latest.name


def views_codes() -> set[str]:
    text = VIEWS.read_text()
    m = re.search(r"agg_money_events.*?where code in \(([^)]*)\)", text, re.S)
    if not m:
        sys.exit("check_money_codes: agg_money_events allowlist not found in "
                 f"{VIEWS.relative_to(ROOT)}")
    return set(CODE_RE.findall(m.group(1)))


def main() -> int:
    spec = spec_money_codes()
    fn, fn_file = sql_fn_codes()
    views = views_codes()

    problems = []
    for name, have, fix in [
        (f"aggregator.is_money_code ({fn_file})", fn,
         "add a migration redefining the function"),
        ("analytics/aggregator_views.sql agg_money_events", views,
         "edit the view's allowlist"),
    ]:
        missing = spec - have
        extra = have - spec
        if missing:
            problems.append(f"  {name} is MISSING {sorted(missing)} — {fix}")
        if extra:
            problems.append(f"  {name} carries {sorted(extra)} not marked "
                            "x-money in the spec — mark them or remove them")

    if problems:
        print("money-code allowlists drift from the spec's x-money set "
              f"({sorted(spec)}):", file=sys.stderr)
        print("\n".join(problems), file=sys.stderr)
        return 1

    print(f"money codes OK — {len(spec)} codes, spec == is_money_code == "
          "spanning view")
    return 0


if __name__ == "__main__":
    sys.exit(main())
