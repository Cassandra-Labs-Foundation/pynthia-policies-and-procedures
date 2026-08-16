#!/usr/bin/env python3
"""Fail the build when the money-code allowlists drift from the spec.

Two independent axes are declared ONCE each, in core/core-api.yaml's x-events
registry, and mirrored into hardcoded copies that this gate keeps honest.

`x-money: true` — "money moved, and BSA cares". Consumers:

  - aggregator.is_money_code(...)      the Postgres function the BSA approver
                                       calls for CTR + structuring detection
                                       (latest `create or replace` across
                                       core/supabase/migrations/*.sql wins)
  - analytics/aggregator_views.sql     the DuckDB spanning view the reporters
                                       read (agg_money_events)

`x-fbo: outbound | inbound | internal` — how the event moves an instance's FBO
position: outbound debits it (-1), inbound credits it (+1), internal nets to
zero (0). Consumers:

  - aggregator.fbo_delta(...)          the Postgres function the payment hub
                                       applies as a signed delta
  - analytics/aggregator_views.sql     agg_fbo_events

The two axes are deliberately NOT the same set (TODO §6, decided 2026-08-15).
`transfer.settled` is money — the BSA approver must keep seeing on-us
transfers for CTR — but nets to zero inside one fintech's FBO, so it is
`internal`. The return codes are the mirror case: they credit the position
back but are not new reportable transactions, so they carry `x-fbo` and no
`x-money`. Folding them into one allowlist would have blinded CTR to on-us
transfers or minted CTR alerts for reversals.

Before this gate, a new money rail registered in x-events was silently
invisible to every consumer: the FBO position never moved and the BSA lookback
never saw it, with nothing red anywhere. Now the drift is loud: declare it in
the spec and this script fails until every copy carries it (and vice versa —
a code removed from the spec must leave them all).

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

# x-fbo vocabulary -> the signed delta every mirror must apply
DIRECTIONS = {"outbound": -1, "inbound": 1, "internal": 0}


def _events() -> dict:
    spec = yaml.safe_load(SPEC.read_text())
    events = spec.get("x-events") or {}
    if not events:
        sys.exit("check_money_codes: spec carries no x-events registry")
    return events


def spec_money_codes(events: dict) -> set[str]:
    return {code for code, entry in events.items()
            if isinstance(entry, dict) and entry.get("x-money") is True}


def spec_fbo_codes(events: dict) -> dict[str, int]:
    """{code: delta} for every x-events entry declaring x-fbo."""
    out: dict[str, int] = {}
    for code, entry in events.items():
        if not isinstance(entry, dict) or "x-fbo" not in entry:
            continue
        direction = entry["x-fbo"]
        if direction not in DIRECTIONS:
            sys.exit(f"check_money_codes: {code} declares x-fbo: {direction!r} "
                     f"— must be one of {sorted(DIRECTIONS)}")
        out[code] = DIRECTIONS[direction]
    return out


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


def sql_fbo_codes() -> tuple[dict[str, int], str]:
    """{code: delta} from the LATEST definition of aggregator.fbo_delta.

    Only the non-zero arms are named in SQL; `internal` codes fall through to
    the function's `else 0`, so they are correct by omission and are checked
    that way below.
    """
    body, name = _latest_defining("fbo_delta")
    out: dict[str, int] = {}
    for codes, delta in re.findall(r"when c in \(([^)]*)\)\s*then\s*(-?\d+)", body, re.S):
        for code in CODE_RE.findall(codes):
            out[code] = int(delta)
    return out, name


def views_codes() -> set[str]:
    text = VIEWS.read_text()
    m = re.search(r"agg_money_events.*?where code in \(([^)]*)\)", text, re.S)
    if not m:
        sys.exit("check_money_codes: agg_money_events allowlist not found in "
                 f"{VIEWS.relative_to(ROOT)}")
    return set(CODE_RE.findall(m.group(1)))


def views_fbo_codes() -> dict[str, int]:
    text = VIEWS.read_text()
    m = re.search(r"create or replace view agg_fbo_events(.*?);", text, re.S)
    if not m:
        sys.exit("check_money_codes: agg_fbo_events not found in "
                 f"{VIEWS.relative_to(ROOT)}")
    out: dict[str, int] = {}
    for codes, delta in re.findall(r"when code in \(([^)]*)\)\s*then\s*(-?\d+)",
                                   m.group(1), re.S):
        for code in CODE_RE.findall(codes):
            out[code] = int(delta)
    return out


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


def _compare_deltas(name: str, have: dict[str, int], spec: dict[str, int],
                    fix: str) -> list[str]:
    """The SQL/view copies name only non-zero arms; `internal` is 0 by omission."""
    problems = []
    nonzero = {c: d for c, d in spec.items() if d != 0}
    internal = {c for c, d in spec.items() if d == 0}

    for code, delta in sorted(nonzero.items()):
        if code not in have:
            problems.append(f"  {name} is MISSING {code} (delta {delta:+d}) — {fix}")
        elif have[code] != delta:
            problems.append(f"  {name} applies {have[code]:+d} to {code} but the "
                            f"spec says {delta:+d} — {fix}")
    for code in sorted(set(have) - set(nonzero)):
        if code in internal:
            problems.append(f"  {name} applies {have[code]:+d} to {code}, which the "
                            "spec declares `x-fbo: internal` (must net to zero)")
        else:
            problems.append(f"  {name} applies {have[code]:+d} to {code}, which "
                            "declares no x-fbo in the spec — declare it or remove it")
    return problems


def main() -> int:
    events = _events()
    money = spec_money_codes(events)
    fbo = spec_fbo_codes(events)

    fn, fn_file = sql_fn_codes()
    fbo_fn, fbo_fn_file = sql_fbo_codes()

    problems = []
    problems += _compare_set(f"aggregator.is_money_code ({fn_file})", fn, money,
                             "add a migration redefining the function")
    problems += _compare_set("analytics/aggregator_views.sql agg_money_events",
                             views_codes(), money, "edit the view's allowlist")
    problems += _compare_deltas(f"aggregator.fbo_delta ({fbo_fn_file})", fbo_fn, fbo,
                                "add a migration redefining the function")
    problems += _compare_deltas("analytics/aggregator_views.sql agg_fbo_events",
                                views_fbo_codes(), fbo, "edit the view's case arms")

    # A money code with no declared FBO effect is the exact drift that made the
    # payment hub add outflows to the position for a year: it moved money and
    # nobody had said which way.
    undeclared = sorted(money - set(fbo))
    if undeclared:
        problems.append(f"  x-events: {undeclared} carry x-money but no x-fbo — "
                        "declare outbound/inbound/internal so the payment hub "
                        "knows which way the position moves")

    if problems:
        print("money-code allowlists drift from the spec "
              f"(x-money: {sorted(money)}; x-fbo: "
              f"{ {c: d for c, d in sorted(fbo.items())} }):", file=sys.stderr)
        print("\n".join(problems), file=sys.stderr)
        return 1

    print(f"money codes OK — {len(money)} x-money codes (spec == is_money_code "
          f"== agg_money_events), {len(fbo)} x-fbo codes (spec == fbo_delta "
          "== agg_fbo_events)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
