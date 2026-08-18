#!/usr/bin/env python3
"""Fail the build when the money-code allowlists drift from the spec.

One axis is declared ONCE, in core/core-api.yaml's x-events registry, and
mirrored into hardcoded copies that this gate keeps honest.

`x-money: true` — "money moved, and BSA cares". Consumers:

  - aggregator.is_money_code(...)      the Postgres function the BSA approver
                                       calls for CTR + structuring detection
                                       (latest `create or replace` across
                                       core/supabase/migrations/*.sql wins)
  - analytics/aggregator_views.sql     the DuckDB spanning view the reporters
                                       read (agg_money_events)

The `x-fbo` axis this gate used to police was removed on 2026-08-17: the FBO
position became a roll-up of member balances (migration 20260817000100), so
`aggregator.fbo_delta` and `agg_fbo_events` — its only two consumers — no
longer exist. A direction declared in the spec that nothing applies is exactly
the drift this file exists to prevent, so the axis left with them.

Before this gate, a new money rail registered in x-events was silently
invisible to the BSA lookback, with nothing red anywhere. Now the drift is
loud: declare it in the spec and this script fails until every copy carries it
(and vice versa — a code removed from the spec must leave them all).

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


def _events() -> dict:
    spec = yaml.safe_load(SPEC.read_text())
    events = spec.get("x-events") or {}
    if not events:
        sys.exit("check_money_codes: spec carries no x-events registry")
    return events


def spec_money_codes(events: dict) -> set[str]:
    return {code for code, entry in events.items()
            if isinstance(entry, dict) and entry.get("x-money") is True}



def _latest_defining(fn: str) -> tuple[str, str]:
    """(body, filename) of the LATEST `create or replace` of an aggregator fn."""
    needle = f'function "aggregator".{fn}'
    defining = [p for p in sorted(MIGRATIONS.glob("*.sql")) if needle in p.read_text()]
    if not defining:
        sys.exit(f"check_money_codes: no migration defines aggregator.{fn}")
    latest = defining[-1]
    text = latest.read_text()
    start = text.rindex(needle)
    return text[start:text.index("$$;", start)], latest.name


def sql_fn_codes() -> tuple[set[str], str]:
    """Codes in the LATEST definition of aggregator.is_money_code."""
    body, name = _latest_defining("is_money_code")
    return set(CODE_RE.findall(body)), name



def views_codes() -> set[str]:
    text = VIEWS.read_text()
    m = re.search(r"agg_money_events.*?where code in \(([^)]*)\)", text, re.S)
    if not m:
        sys.exit("check_money_codes: agg_money_events allowlist not found in "
                 f"{VIEWS.relative_to(ROOT)}")
    return set(CODE_RE.findall(m.group(1)))



def _compare_set(name: str, have: set[str], spec: set[str], fix: str) -> list[str]:
    problems = []
    missing = spec - have
    extra = have - spec
    if missing:
        problems.append(f"  {name} is MISSING {sorted(missing)} — {fix}")
    if extra:
        problems.append(f"  {name} carries {sorted(extra)} not marked "
                        "x-money in the spec — mark them or remove them")
    return problems



def main() -> int:
    events = _events()
    money = spec_money_codes(events)

    fn, fn_file = sql_fn_codes()

    problems = []
    problems += _compare_set(f"aggregator.is_money_code ({fn_file})", fn, money,
                             "add a migration redefining the function")
    problems += _compare_set("analytics/aggregator_views.sql agg_money_events",
                             views_codes(), money, "edit the view's allowlist")

    if problems:
        print("money-code allowlists drift from the spec "
              f"(x-money: {sorted(money)}):", file=sys.stderr)
        print("\n".join(problems), file=sys.stderr)
        return 1

    print(f"money codes OK — {len(money)} x-money codes "
          "(spec == is_money_code == agg_money_events)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
