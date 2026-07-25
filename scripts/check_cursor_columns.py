#!/usr/bin/env python3
"""Every pagination cursor column must be NOT NULL in the schema.

WHY THIS EXISTS

D16 pages with a transparent cursor: a list endpoint over-fetches by one, and
`next_after` is the cursor column of the LAST ROW IT SERVES. That construction
has an unstated requirement — the cursor column must never be NULL — and
nothing enforced it.

GET /accounts shipped violating it. core.account.created_at was nullable while
every sibling table's was NOT NULL, and Postgres sorts NULLS FIRST under
ORDER BY ... DESC, so the dateless rows LED every page. The response was a 200
with a well-formed body, `has_more: true`, and `next_after: null` — a caller
told to fetch more and handed nothing to fetch it with. A correct client loops
on page one forever; a defensive one stops early and under-reports. No status
code, no schema validation and no unit test caught it, because nothing about it
is malformed. It is only WRONG.

It had also been fixed once before, for one table: 20260722000200 made
core.event.created_at NOT NULL for the same reason. That fix was applied to a
table when it should have been applied to a class, so account kept the defect
for three more days. This script is the class-level version — the reason a
third table will not need a third migration to learn it.

WHAT IT CHECKS

Cursor sites are discovered from the code rather than declared in a list here,
because a list is a second thing to keep in sync and would silently go stale
the moment someone adds an endpoint. A site is any query chain that both
selects `from("<table>")` and orders by a column, inside a function that calls
paginate(). For each, the migrations must make that column NOT NULL — either
in its CREATE TABLE or via a later `alter column ... set not null`.

    ok           cursor column is NOT NULL
    nullable     cursor column can be NULL -> a page can end on a dead cursor
    unknown      column not found in the migrations at all

Exit 0 always unless --strict, which exits 1 on any non-ok site. --strict is
the form wired into core-ci.

Usage:
    python3 scripts/check_cursor_columns.py [--json] [--strict]
"""

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API_DIR = ROOT / "core" / "supabase" / "functions" / "api"
MIGRATIONS = ROOT / "core" / "supabase" / "migrations"

# A top-level `export ... function name(` through to the next one. Crude, but
# these handlers are flat and it only needs to bound "same function as a
# paginate() call".
FUNC_RE = re.compile(
    r"^export\s+(?:async\s+)?function\s+(\w+)\s*\(", re.MULTILINE
)
FROM_RE = re.compile(r'\.from\(\s*"([^"]+)"\s*\)')
ORDER_RE = re.compile(r'\.order\(\s*"([^"]+)"')


def functions(source: str):
    """Yield (name, body) for each exported function in a module."""
    marks = [(m.start(), m.group(1)) for m in FUNC_RE.finditer(source)]
    for i, (start, name) in enumerate(marks):
        end = marks[i + 1][0] if i + 1 < len(marks) else len(source)
        yield name, source[start:end]


def cursor_sites():
    """Discover (file, function, table, column) for every paginated query."""
    sites = []
    for path in sorted(API_DIR.glob("*.ts")):
        if path.name.endswith(".test.ts"):
            continue
        source = path.read_text()
        for name, body in functions(source):
            if "paginate(" not in body:
                continue
            tables = FROM_RE.findall(body)
            columns = ORDER_RE.findall(body)
            for table in tables:
                for column in columns:
                    sites.append(
                        {
                            "file": str(path.relative_to(ROOT)),
                            "function": name,
                            "table": table,
                            "column": column,
                        }
                    )
    return sites


def column_is_not_null(table: str, column: str):
    """Is core.<table>.<column> NOT NULL after the whole migration chain?

    Returns True / False, or None when the column is never declared.
    """
    found = False
    not_null = False

    create_re = re.compile(
        r'create table[^;]*?"core"\."%s"\s*\((.*?)\n\);' % re.escape(table),
        re.DOTALL | re.IGNORECASE,
    )
    col_re = re.compile(r'^\s*"%s"\s+([^,\n]*)' % re.escape(column), re.MULTILINE)
    alter_not_null_re = re.compile(
        r'alter table\s+"core"\."%s"\s+alter column\s+"%s"\s+set not null'
        % (re.escape(table), re.escape(column)),
        re.IGNORECASE,
    )
    alter_drop_null_re = re.compile(
        r'alter table\s+"core"\."%s"\s+alter column\s+"%s"\s+drop not null'
        % (re.escape(table), re.escape(column)),
        re.IGNORECASE,
    )

    # Chronological: a later DROP NOT NULL must be able to undo an earlier SET.
    for path in sorted(MIGRATIONS.glob("*.sql")):
        sql = path.read_text()
        for block in create_re.findall(sql):
            m = col_re.search(block)
            if m:
                found = True
                if "not null" in m.group(1).lower():
                    not_null = True
        if alter_not_null_re.search(sql):
            found = True
            not_null = True
        if alter_drop_null_re.search(sql):
            found = True
            not_null = False

    return not_null if found else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--strict", action="store_true")
    args = ap.parse_args()

    results = []
    for site in cursor_sites():
        state = column_is_not_null(site["table"], site["column"])
        site["status"] = (
            "ok" if state is True else "nullable" if state is False else "unknown"
        )
        results.append(site)

    bad = [r for r in results if r["status"] != "ok"]

    if args.json:
        print(json.dumps({"sites": results, "failing": len(bad)}, indent=2))
    else:
        for r in results:
            mark = "ok      " if r["status"] == "ok" else r["status"].ljust(8)
            print(f"  {mark} core.{r['table']}.{r['column']}  ({r['function']})")
        print(f"\n{len(results)} cursor site(s), {len(bad)} failing")
        for r in bad:
            print(
                f"\n  {r['file']}:{r['function']} paginates core.{r['table']} "
                f"on {r['column']}, which is {r['status'].upper()}.\n"
                f"  A page ending on a row whose {r['column']} is NULL advertises "
                f"has_more with next_after:null,\n"
                f"  which no caller can act on. Make the column NOT NULL "
                f"(see 20260725000100_account_created_at.sql)."
            )

    if not results:
        print("no cursor sites found — has the paginate() convention changed?")
        return 1 if args.strict else 0

    return 1 if (bad and args.strict) else 0


if __name__ == "__main__":
    sys.exit(main())
