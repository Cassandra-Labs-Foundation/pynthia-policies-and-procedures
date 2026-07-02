#!/usr/bin/env python3
"""Generate Supabase migration SQL from model.json.

Emits 4 migrations under supabase/migrations/:
  20260702000100_core_schema.sql        schema + tables + PKs + state/enum CHECKs + audit cols + updated_at trigger + comments
  20260702000200_core_indexes.sql       btree indexes on *_id / status / created_at
  20260702000300_core_foreign_keys.sql  hard FK constraints (apply AFTER bulk load)
  20260702000400_core_rls.sql           enable RLS + locked-down default (service_role only)
"""
import json, sys, os, textwrap

model = json.load(open('model.json'))
OUT = sys.argv[1] if len(sys.argv) > 1 else 'supabase/migrations'
os.makedirs(OUT, exist_ok=True)
SCHEMA = 'core'
SPEC_VERSION = '3.0.0'

def q(ident):
    return '"' + ident.replace('"', '""') + '"'

def qq(s):
    return "'" + s.replace("'", "''") + "'"

RESERVED_TABLES = {'case', 'user'}  # kept as-is but always quoted

# ------------------------------------------------------------------ tables
tables = model['tables']
order = sorted(tables.keys(), key=lambda n: tables[n]['table'])

hdr = f"""-- =====================================================================
-- Cassandra Banking Core API  ->  Supabase schema  (generated)
-- Source: core-api.yaml  v{SPEC_VERSION}
-- Scope: 39 resource tables (banking-core + primitive + domain).
--        30 embedded detail schemas are folded into jsonb columns.
-- Typing: promoted (timestamptz / bigint / numeric / boolean / jsonb).
-- Identifiers are quoted; tables live in schema "{SCHEMA}".
-- DO NOT EDIT BY HAND — regenerate via supabase/generate/gen_sql.py.
-- =====================================================================

create schema if not exists {q(SCHEMA)};
create extension if not exists pgcrypto;      -- gen_random_uuid()

-- updated_at maintenance
create or replace function {q(SCHEMA)}.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
"""

lines = [hdr]
comments = []
triggers = []

for n in order:
    t = tables[n]
    tbl = t['table']
    fq = f"{q(SCHEMA)}.{q(tbl)}"
    coldefs = []
    seen = set()

    # primary key
    if t['has_own_id']:
        coldefs.append(f"  {q('id')} text primary key")
    else:
        coldefs.append(f"  {q('id')} uuid primary key default gen_random_uuid()")
    seen.add('id')

    has_created = any(c['name'] == 'created_at' for c in t['columns'])

    for c in t['columns']:
        name = c['name']
        if name in seen:
            continue
        seen.add(name)
        typ = c['type']
        line = f"  {q(name)} {typ}"
        # status / state CHECK
        if name == 'status' and t['states']:
            allowed = ', '.join(qq(s) for s in t['states'])
            line += f" check ({q(name)} in ({allowed}))"
        elif c.get('enum'):
            allowed = ', '.join(qq(str(v)) for v in c['enum'])
            line += f" check ({q(name)} in ({allowed}))"
        coldefs.append(line)
        # column comment (control bindings / provenance)
        cbits = []
        if c.get('note'):
            cbits.append(c['note'])
        if c.get('controls'):
            cbits.append('evidences ' + ', '.join(c['controls']))
        if c.get('provisional'):
            cbits.append('provisional (derived from event)')
        if cbits:
            comments.append(f"comment on column {fq}.{q(name)} is {qq('; '.join(cbits))};")

    # audit columns
    if not has_created:
        coldefs.append(f"  {q('created_at')} timestamptz not null default now()")
    coldefs.append(f"  {q('updated_at')} timestamptz not null default now()")

    body = ',\n'.join(coldefs)
    lines.append(f"\ncreate table if not exists {fq} (\n{body}\n);")
    if t.get('description'):
        comments.append(f"comment on table {fq} is {qq(t['description'])};")
    triggers.append(
        f"drop trigger if exists {q('set_updated_at')} on {fq};\n"
        f"create trigger {q('set_updated_at')} before update on {fq} "
        f"for each row execute function {q(SCHEMA)}.set_updated_at();")

lines.append("\n\n-- ---- triggers ----")
lines.extend(triggers)
lines.append("\n\n-- ---- comments (table descriptions + control bindings) ----")
lines.extend(comments)

open(os.path.join(OUT, '20260702000100_core_schema.sql'), 'w').write('\n'.join(lines) + '\n')

# ------------------------------------------------------------------ indexes
idx = [f"-- Indexes for {SCHEMA} schema (generated)\n"]
for n in order:
    t = tables[n]
    tbl = t['table']
    fq = f"{q(SCHEMA)}.{q(tbl)}"
    for c in t['columns']:
        nm = c['name']
        if nm == 'id':
            continue
        if nm.endswith('_id') or nm == 'status' or nm == 'created_at':
            idx.append(f"create index if not exists {q('idx_'+tbl+'_'+nm)} on {fq} ({q(nm)});")
open(os.path.join(OUT, '20260702000200_core_indexes.sql'), 'w').write('\n'.join(idx) + '\n')

# ------------------------------------------------------------------ FKs
fk = [textwrap.dedent(f"""\
    -- Foreign keys for {SCHEMA} schema (generated).
    -- Apply AFTER bulk-loading data: the source API feed uses loose string ids
    -- with no guaranteed insert order, so FKs are isolated here and can be
    -- deferred or skipped without blocking ingest. All are ON DELETE SET NULL.
    """)]
fk_count = 0
for n in order:
    t = tables[n]
    tbl = t['table']
    fq = f"{q(SCHEMA)}.{q(tbl)}"
    for f in t['fks']:
        col = f['column']
        ref = tables[f['ref_table']]['table'] if f['ref_table'] in tables else None
        if not ref:
            continue
        if ref == tbl:
            continue  # skip self-referential inference (e.g. filing.filing_id is a FinCEN ref, not a PK)
        cname = f"fk_{tbl}_{col}"
        fk.append(
            f"alter table {fq} add constraint {q(cname)} "
            f"foreign key ({q(col)}) references {q(SCHEMA)}.{q(ref)}({q('id')}) "
            f"on delete set null;")
        fk_count += 1
open(os.path.join(OUT, '20260702000300_core_foreign_keys.sql'), 'w').write('\n'.join(fk) + '\n')

# ------------------------------------------------------------------ RLS
rls = [textwrap.dedent(f"""\
    -- Row Level Security for {SCHEMA} schema (generated).
    -- Default posture: RLS ON, no permissive policy => only the service_role
    -- (which bypasses RLS) can read/write. This is the secure default for
    -- banking data. Add explicit policies below to expose rows to end users.
    """)]
for n in order:
    t = tables[n]
    fq = f"{q(SCHEMA)}.{q(t['table'])}"
    rls.append(f"alter table {fq} enable row level security;")
rls.append(textwrap.dedent(f"""
    -- Example: allow authenticated users to read everything (uncomment to use)
    -- do $$ declare r record; begin
    --   for r in select tablename from pg_tables where schemaname = '{SCHEMA}' loop
    --     execute format('create policy %I on {SCHEMA}.%I for select to authenticated using (true)',
    --                    'read_'||r.tablename, r.tablename);
    --   end loop; end $$;
    """))
open(os.path.join(OUT, '20260702000400_core_rls.sql'), 'w').write('\n'.join(rls) + '\n')

print(f"Wrote 4 migrations to {OUT}/")
print(f"  tables={len(order)}  fk_constraints={fk_count}  comments={len(comments)}")
