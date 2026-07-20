#!/usr/bin/env python3
"""Does this already exist?

STANDING PRE-ARTIFACT STEP. Twelve artifacts in, the codebase is large enough
that "is there already a writer for this" is a real question, and the failure
mode is not wasted work — it is DUPLICATED CAPABILITY THAT DIVERGES. Two
adverse-action notice writers are worse than one incomplete one, because
eventually only one of them enforces the reasons requirement.

Usage:  python3 scripts/exists_check.py <policy> [<policy> ...]

For every noun in the declared inputs and produced events of that policy's red
controls, report any table, column or event code that already carries it.
"""
import json, re, subprocess, sys, pathlib
from collections import defaultdict

ROOT = pathlib.Path(__file__).resolve().parent.parent
STOP = {
    "id", "at", "to", "of", "the", "a", "is", "by", "on", "ref", "type", "kind",
    "status", "date", "time", "count", "cents", "bp", "pct", "completed", "created",
    "updated", "sent", "due", "logged", "recorded", "decided", "opened", "closed",
}

def nouns(policy_results):
    out = set()
    for r in policy_results:
        for s in list(r.get("required_inputs") or []) + list(r.get("expected") or []):
            for tok in re.split(r"[^a-z0-9]+", s.lower()):
                if len(tok) > 3 and tok not in STOP:
                    out.add(tok)
    return sorted(out)

def main():
    results = json.loads((ROOT / "control-tests.json").read_text())["results"]
    wanted = set(sys.argv[1:])
    reds = [r for r in results
            if r["policy"] in wanted and not r["scoped_out"] and r["status"] == "red"]
    if not reds:
        print("no in-scope reds for", ", ".join(sorted(wanted)))
        return

    sql = "\n".join(p.read_text() for p in sorted((ROOT / "supabase/migrations").glob("*.sql")))
    tables = set(re.findall(r'create table if not exists "core"\."(\w+)"', sql))
    tables |= set(re.findall(r'alter table "core"\."(\w+)"', sql))
    columns = set(re.findall(r'add column if not exists "(\w+)"', sql))
    columns |= set(re.findall(r'^\s+"(\w+)" ', sql, re.M))

    api = ROOT / "supabase/functions/api"
    codes = set()
    fns = defaultdict(set)
    for p in api.glob("*.ts"):
        if p.name.endswith(".test.ts"):
            continue
        src = p.read_text()
        codes |= set(re.findall(r'"([a-z][a-z0-9_]*(?:\.[a-z0-9_]+)+)"', src))
        for m in re.findall(r"export (?:async )?function (\w+)", src):
            fns[m].add(p.name)

    print(f"EXISTS-CHECK for {', '.join(sorted(wanted))} — {len(reds)} red controls\n")
    for n in nouns(reds):
        hits = []
        t = sorted(x for x in tables if n in x)
        c = sorted(x for x in columns if n in x)
        e = sorted(x for x in codes if n in x)
        f = sorted(x for x in fns if n in x.lower())
        if t: hits.append("tables=" + ",".join(t[:4]))
        if c: hits.append("cols=" + ",".join(c[:4]))
        if e: hits.append("events=" + ",".join(e[:4]))
        if f: hits.append("fns=" + ",".join(f"{x}({','.join(sorted(fns[x]))})" for x in f[:3]))
        if hits:
            print(f"  ⚠ {n:<24} {' | '.join(hits)}")
    print("\nAnything flagged above ALREADY EXISTS. Extend it; do not write a second one.")

main()
