#!/usr/bin/env python3
"""Fail the build when the spec's schemas and the migrations disagree — with a
shrink-only baseline for the inherited divergence.

The migrations are the truth for the live database; the spec is the truth for
the names policies cite. Neither may drift from the other unnoticed: a control
bound to `cdd_profile.risk_tier` while the database enforces `risk_rating`
('medium', not 'moderate') is a control bound to nothing, and it stayed that
way for six weeks because no consumer failed.

Model extracted from core/supabase/migrations/*.sql (schema "core" only; "sim"
mirrors it): CREATE TABLE columns with types and inline `check ("c" in (...))`
enums, plus ALTER TABLE ADD COLUMN and RENAME COLUMN. The regex shapes mirror
drill/fake_db.ts's own migration parser, which the hermetic suite already
trusts.

Spec side comes from core-api.yaml components/schemas via the same adapter the
vocabulary uses (scripts/parse_core_api.openapi_to_spec), so this checker and
the vocabulary can never disagree about what the spec says.

Findings are stable strings; schema-parity-baseline.json is the inherited debt.
New findings fail the build; fixes are banked with --update. Shrink it, never
grow it by hand.

  python3 scripts/check_schema_parity.py            # report
  python3 scripts/check_schema_parity.py --check    # exit 1 on NEW findings
  python3 scripts/check_schema_parity.py --update   # bank the current state
"""
import argparse
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import yaml  # noqa: E402
import spec_io  # noqa: E402
import parse_core_api as pca  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent
MIGRATIONS = ROOT / "core" / "supabase" / "migrations"
SPEC = ROOT / "core" / "core-api.yaml"
BASELINE = ROOT / "schema-parity-baseline.json"

TABLE_RE = re.compile(r'create table if not exists\s+"core"\."([a-z_0-9]+)"\s*\(([\s\S]*?)\n\);', re.I)
# the column class allows dots: the first schema cut stored corpus tokens
# verbatim ("payment.disbursed"), and a column the model cannot see is a
# rename the model cannot apply (20260809000100 normalises them away)
COL_RE = re.compile(r'^\s{2}"([a-z_0-9.]+)"\s+([a-zA-Z]+)(.*)$', re.M)
CHECK_RE = re.compile(r'check \("([a-z_0-9]+)" in \(([^)]*)\)\)', re.I)
ALTER_RE = re.compile(r'alter table\s+"core"\."([a-z_0-9]+)"([\s\S]*?);', re.I)
ADD_RE = re.compile(r'add column if not exists\s+"([a-z_0-9]+)"\s+([a-zA-Z]+)(.*)', re.I)
RENAME_RE = re.compile(r'rename column\s+"([a-z_0-9.]+)"\s+to\s+"([a-z_0-9]+)"', re.I)
# constraint names follow ck_<table>_<column>; a DROP whose name embeds a
# column clears that column's modeled enum (a later ADD CONSTRAINT re-sets it)
DROP_CK_RE = re.compile(r'drop constraint if exists\s+"ck_([a-z_0-9]+)"', re.I)
# Deletion was previously unmodelled: the gate replayed creates and adds and
# nothing else, so a table or column removed by a migration stayed in the model
# forever — and removing it from the SPEC then read as fresh divergence, which
# is precisely backwards. A dropped table is not a spec violation, it is the
# spec and the migrations agreeing to delete something.
DROP_TABLE_RE = re.compile(r'drop table if exists\s+"core"\."([a-z_0-9]+)"', re.I)
DROP_COL_RE = re.compile(r'drop column if exists\s+"([a-z_0-9]+)"', re.I)

# SQL type -> acceptable OpenAPI types
TYPE_OK = {
    "text": {"string"}, "varchar": {"string"}, "uuid": {"string"},
    "bigint": {"integer"}, "int": {"integer"}, "integer": {"integer"},
    "smallint": {"integer"}, "numeric": {"number", "integer"},
    "boolean": {"boolean"},
    "timestamptz": {"string"}, "timestamp": {"string"}, "date": {"string"},
    "jsonb": {"object", "array"}, "json": {"object", "array"},
}


def db_model():
    tables = {}
    for f in sorted(MIGRATIONS.glob("*.sql")):
        sql = f.read_text()
        for tname, body in TABLE_RE.findall(sql):
            cols = tables.setdefault(tname, {})
            for cname, ctype, rest in COL_RE.findall(body):
                enum = None
                m = CHECK_RE.search(rest)
                if m and m.group(1) == cname:
                    enum = [v.strip().strip("'") for v in m.group(2).split(",")]
                cols[cname] = {"type": ctype, "enum": enum}
        for tname in DROP_TABLE_RE.findall(sql):
            tables.pop(tname, None)
        for tname, body in ALTER_RE.findall(sql):
            cols = tables.setdefault(tname, {})
            for cname in DROP_COL_RE.findall(body):
                cols.pop(cname, None)
            for cname, ctype, rest in ADD_RE.findall(body):
                enum = None
                m = CHECK_RE.search(rest)
                if m and m.group(1) == cname:
                    enum = [v.strip().strip("'") for v in m.group(2).split(",")]
                cols[cname] = {"type": ctype, "enum": enum}
            for old, new in RENAME_RE.findall(body):
                if old in cols:
                    cols[new] = cols.pop(old)
            # DROP CONSTRAINT "ck_<table>_<col>" widens the column — clear the
            # modeled enum so a check-dropping migration cannot leave a stale
            # narrow enum silently satisfied
            for ckname in DROP_CK_RE.findall(body):
                rest = ckname[len(tname) + 1:] if ckname.startswith(tname + "_") else ckname
                if rest in cols:
                    cols[rest]["enum"] = None
            # ADD CONSTRAINT ... CHECK ("col" IN (...)) replaces the column's
            # enum (the rename pattern: drop check, rename, add new check)
            for cname, vals in CHECK_RE.findall(body):
                if cname in cols:
                    cols[cname]["enum"] = [v.strip().strip("'")
                                           for v in vals.split(",")]
    return tables


def spec_model():
    doc = spec_io.load_spec(SPEC)
    spec = pca.openapi_to_spec(doc)
    out = {}
    for name, r in (spec.get("resources") or {}).items():
        snake = pca.snake(name)
        props = {}
        for pn, ps in (r.get("properties") or {}).items():
            if not isinstance(ps, dict):
                ps = {}
            props[pn] = {"type": ps.get("type"), "enum": ps.get("enum"),
                         "column": ps.get("x-column")}
        out[snake] = {"schema": name, "props": props,
                      "states": list(r.get("states") or []) or None,
                      "kind": r.get("kind")}
    return out


def findings():
    db = db_model()
    spec = spec_model()
    out = []
    for snake, s in sorted(spec.items()):
        if snake not in db:
            out.append(f"unbacked-schema: {s['schema']} has no core.{snake} table")
            continue
        cols = db[snake]
        covered = set()
        # x-column is a mapping, not a silencer: it must be 1:1, must not
        # shadow a real property, and the wire name itself must NOT be a
        # column (else there is nothing to map)
        seen_targets = {}
        for pn, ps in sorted(s["props"].items()):
            tgt = ps.get("column")
            if not tgt:
                continue
            if pn in cols:
                out.append(f"x-column-invalid: {snake}.{pn} maps to {tgt} but "
                           f"'{pn}' is itself a column")
            if tgt in s["props"]:
                out.append(f"x-column-invalid: {snake}.{pn} maps to {tgt}, "
                           "which is also a spec property")
            if tgt in seen_targets:
                out.append(f"x-column-invalid: {snake}.{pn} and "
                           f"{snake}.{seen_targets[tgt]} both map to {tgt}")
            seen_targets[tgt] = pn
        for pn, ps in sorted(s["props"].items()):
            # x-column: the wire name differs from the storage column (the API
            # boundary renames it, e.g. transfer.amount_cents <- amount)
            col_name = ps.get("column") or pn
            if col_name not in cols:
                out.append(f"missing-in-db: {snake}.{pn} (spec {s['schema']})")
                continue
            covered.add(col_name)
            col = cols[col_name]
            ok = TYPE_OK.get(col["type"], {col["type"]})
            if ps["type"] and ps["type"] not in ok:
                out.append(f"type-mismatch: {snake}.{pn} spec={ps['type']} db={col['type']}")
            spec_enum = ps["enum"] or (s["states"] if pn == "status" else None)
            if spec_enum and col["enum"] and sorted(spec_enum) != sorted(col["enum"]):
                out.append(f"enum-mismatch: {snake}.{pn} "
                           f"spec={sorted(spec_enum)} db={sorted(col['enum'])}")
            elif spec_enum and not col["enum"]:
                # the spec promises a closed vocabulary the DB does not enforce
                out.append(f"enum-unenforced: {snake}.{pn} spec={sorted(spec_enum)} "
                           "(no CHECK constraint in migrations)")
        for cn in sorted(cols):
            if cn not in s["props"] and cn not in covered:
                out.append(f"missing-in-spec: {snake}.{cn}")
    spec_tables = set(spec)
    for tname in sorted(db):
        if tname not in spec_tables:
            out.append(f"unspecced-table: core.{tname}")
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--update", action="store_true")
    args = ap.parse_args()

    current = findings()
    counts = {}
    for f in current:
        counts[f.split(":")[0]] = counts.get(f.split(":")[0], 0) + 1

    if args.update or not BASELINE.exists():
        BASELINE.write_text(json.dumps({
            "note": "Spec-vs-migrations divergence inherited at gate creation. "
                    "The gate fails on NEW findings only. Shrink this; never "
                    "grow it by hand.",
            "generated_from": "check_schema_parity.py --update",
            "total": len(current),
            "findings": current,
        }, indent=1) + "\n")
        print(f"baseline written — {len(current)} findings {counts}")
        return 0

    baseline = set(json.loads(BASELINE.read_text())["findings"])
    new = [f for f in current if f not in baseline]
    fixed = len(baseline) - len(baseline & set(current))
    print(f"schema parity: {len(current)} findings {counts} "
          f"(baseline {len(baseline)}, fixed {fixed}, new {len(new)})")
    if new:
        print("\nNEW divergence (fix it or consciously bank it with --update):",
              file=sys.stderr)
        for f in new:
            print(f"  {f}", file=sys.stderr)
        return 1 if args.check else 0
    if fixed:
        print("improvement — run --update to bank it so it cannot regress.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
