#!/usr/bin/env python3
"""Generate a pgTAP test suite from controls.json + model.json.

Layers:
  00_schema_structure   tables / PK / audit cols / updated_at trigger / RLS
  01_state_machines     valid status accepted, invalid rejected (throws_ok/lives_ok)
  02_control_coverage   each in-scope control's bound fields exist as columns
                        (gaps -> todo; out-of-scope vocab fields tallied)
  03_deadline_invariants  *_due_at past-due detection, proved with seeded rows
  90_deadline_monitors.sql  plain-SQL ops queries (not a test) for alerts_metrics
Also writes checks_manifest.json for out-of-band local verification.
"""
import json, os, re, sys, collections

HERE = os.path.dirname(os.path.abspath(__file__))
CONTROLS = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', '..', 'controls.json')
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, '..', 'tests')
os.makedirs(OUT, exist_ok=True)
SCHEMA = 'core'

model = json.load(open(os.path.join(HERE, 'model.json')))
controls = json.load(open(CONTROLS))['controls']

# ---- model lookups ------------------------------------------------------
tables = {t['table']: t for t in model['tables'].values()}
cols_of = {name: {c['name']: c for c in t['columns']} for name, t in tables.items()}
# add synthesized audit/pk columns that DDL always adds
for name, t in tables.items():
    cols_of[name].setdefault('id', {'name': 'id', 'type': 'text' if t['has_own_id'] else 'uuid'})
    cols_of[name].setdefault('created_at', {'name': 'created_at', 'type': 'timestamptz'})
    cols_of[name].setdefault('updated_at', {'name': 'updated_at', 'type': 'timestamptz'})

def snake(n): return re.sub(r'(?<!^)(?=[A-Z])', '_', n).lower()

# embedded schema (snake) -> (parent_table, jsonb_column)
embedded_parent = {}
for name, t in tables.items():
    for jd in t.get('jsonb_detail', []):
        embedded_parent[snake(jd['detail_schema'])] = (t['table'], jd['column'])

PG_TYPE = {'text': 'text', 'bigint': 'bigint', 'numeric': 'numeric', 'boolean': 'boolean',
           'timestamptz': 'timestamp with time zone', 'date': 'date', 'jsonb': 'jsonb', 'uuid': 'uuid'}

TERMINAL = ('closed', 'resolved', 'complete', 'completed', 'released', 'cancelled', 'canceled',
            'filed', 'booked', 'settled', 'denied', 'rejected', 'expired', 'done', 'paid',
            'remediated', 'retired', 'purged', 'archived', 'returned', 'disabled', 'no_file')

def q(i): return '"' + i.replace('"', '""') + '"'
def lit(s): return "'" + str(s).replace("'", "''") + "'"

def header(plan_n, title):
    return (f"-- {title}\n-- generated from controls.json + model.json — DO NOT EDIT BY HAND\n"
            f"begin;\nselect plan({plan_n});\n\n")
FOOTER = "\nselect * from finish();\nrollback;\n"

manifest = {'has_table': [], 'has_column': [], 'col_type': [], 'has_pk': [],
            'has_trigger': [], 'rls': [], 'coverage_gaps': [], 'deadlines': []}

order = sorted(tables)

# ========================================================================
# 00 schema structure
# ========================================================================
a = []
n = 0
a.append(f"select has_schema({lit(SCHEMA)});"); n += 1
for name in order:
    t = tables[name]; tbl = t['table']
    a.append(f"\n-- {tbl}")
    a.append(f"select has_table({lit(SCHEMA)}, {lit(tbl)}, {lit('table '+tbl+' exists')});"); n += 1
    manifest['has_table'].append(tbl)
    a.append(f"select has_pk({lit(SCHEMA)}, {lit(tbl)}, {lit(tbl+' has a primary key')});"); n += 1
    manifest['has_pk'].append(tbl)
    a.append(f"select has_trigger({lit(SCHEMA)}, {lit(tbl)}, {lit('set_updated_at')}, "
             f"{lit(tbl+' has updated_at trigger')});"); n += 1
    manifest['has_trigger'].append(tbl)
    # RLS enabled
    a.append(f"select is(relrowsecurity, true, {lit('RLS enabled on '+tbl)}) "
             f"from pg_class where oid = {lit(SCHEMA+'.'+tbl)}::regclass;"); n += 1
    manifest['rls'].append(tbl)
    # every column exists + type
    for cn, c in cols_of[name].items():
        pgt = PG_TYPE.get(c['type'], 'text')
        a.append(f"select has_column({lit(SCHEMA)}, {lit(tbl)}, {lit(cn)});"); n += 1
        a.append(f"select col_type_is({lit(SCHEMA)}, {lit(tbl)}, {lit(cn)}, {lit(pgt)});"); n += 1
        manifest['has_column'].append((tbl, cn))
        manifest['col_type'].append((tbl, cn, pgt))
open(os.path.join(OUT, '00_schema_structure.test.sql'), 'w').write(header(n, 'Schema structure') + '\n'.join(a) + FOOTER)

# ========================================================================
# 01 state machines  (valid status accepted / invalid rejected)
# ========================================================================
a = []; n = 0
def seed_cols(name):
    """minimal INSERT column list+values to satisfy PK/not-null for a table."""
    t = tables[name]
    parts = []
    if t['has_own_id']:
        parts.append(('id', lit('t_smoke_'+t['table'])))
    return parts

for name in order:
    t = tables[name]; tbl = t['table']; states = t['states']
    if not states:
        continue
    fq = f"{q(SCHEMA)}.{q(tbl)}"
    base = seed_cols(name)
    good = states[0]
    cols = base + [('status', lit(good))]
    collist = ', '.join(q(c) for c, _ in cols)
    valgood = ', '.join(v for _, v in cols)
    valbad = ', '.join((lit('t_smoke_bad_'+tbl) if c == 'id' else lit('__invalid__')) for c, _ in cols)
    a.append(f"\n-- {tbl}: status in {states}")
    a.append(f"select lives_ok($$insert into {fq} ({collist}) values ({valgood})$$, "
             f"{lit(tbl+': valid status '+good+' accepted')});"); n += 1
    a.append(f"select throws_ok($$insert into {fq} ({collist}) values ({valbad})$$, "
             f"'23514', null, {lit(tbl+': invalid status rejected by CHECK')});"); n += 1
open(os.path.join(OUT, '01_state_machines.test.sql'), 'w').write(header(n, 'State-machine CHECK enforcement') + '\n'.join(a) + FOOTER)

# ========================================================================
# 02 control coverage
# ========================================================================
def classify_field(code):
    parts = code.split('.'); obj = parts[0]
    if obj in tables:
        rem = '_'.join(parts[1:])
        if parts[1:] and rem in cols_of[obj]:
            return ('col', tables[obj]['table'], rem)
        if len(parts) > 1 and parts[1] in cols_of[obj]:
            return ('col', tables[obj]['table'], parts[1])
        return ('gap', tables[obj]['table'], '_'.join(parts[1:]) or '?')
    if obj in embedded_parent:
        pt, pc = embedded_parent[obj]
        return ('embedded', pt, pc)
    return ('oos', obj, None)

a = []; n = 0
covered_controls = 0
seen_assert = set()
for ctl in controls:
    cid = ctl['control_id']
    fields = ctl.get('api_references', {}).get('fields', [])
    kinds = collections.Counter()
    lines = []
    for code in sorted(set(fields)):
        kind, tbl, col = classify_field(code)
        kinds[kind] += 1
        if kind == 'col':
            key = (tbl, col)
            lines.append(f"select has_column({lit(SCHEMA)}, {lit(tbl)}, {lit(col)}, "
                         f"{lit(cid+': '+code+' -> '+tbl+'.'+col)});")
            n += 1
        elif kind == 'embedded':
            lines.append(f"select has_column({lit(SCHEMA)}, {lit(tbl)}, {lit(col)}, "
                         f"{lit(cid+': '+code+' -> embedded in '+tbl+'.'+col)});")
            n += 1
        elif kind == 'gap':
            lines.append(f"select todo({lit(cid+' gap: '+code+' -> '+tbl+'.'+col+' MISSING')}, 1);")
            lines.append(f"select has_column({lit(SCHEMA)}, {lit(tbl)}, {lit(col)});")
            n += 1
            manifest['coverage_gaps'].append((cid, code, tbl, col))
    if not lines:
        continue  # control is entirely out of scope (vocab) -> not testable here
    covered_controls += 1
    oos = kinds['oos']
    a.append(f"\n-- {cid} {ctl['title']}  (in-scope fields: {kinds['col']+kinds['embedded']}, "
             f"gaps: {kinds['gap']}, out-of-scope: {oos})")
    a.extend(lines)
open(os.path.join(OUT, '02_control_coverage.test.sql'), 'w').write(
    header(n, f'Control coverage — {covered_controls} in-scope controls') + '\n'.join(a) + FOOTER)

# ========================================================================
# 03 deadline invariants  (past-due detection proved with seeded rows)
# ========================================================================
# control(s) evidencing each table.column, from column comments (x-bound-controls)
ctrl_by_field = collections.defaultdict(set)
for ctl in controls:
    for code in ctl.get('api_references', {}).get('fields', []):
        kind, tbl, col = classify_field(code)
        if kind in ('col', 'embedded'):
            ctrl_by_field[(tbl, col)].add(ctl['control_id'])

a = []; n = 0
for name in order:
    t = tables[name]; tbl = t['table']
    due = [c['name'] for c in t['columns'] if c['name'].endswith('_due_at')]
    if not due:
        continue
    fq = f"{q(SCHEMA)}.{q(tbl)}"
    states = t['states'] or []
    open_states = [s for s in states if not any(k in s for k in TERMINAL)]
    for dcol in due:
        ev = sorted(ctrl_by_field.get((tbl, dcol), []))
        evtxt = ('evidences ' + ', '.join(ev)) if ev else 'no direct control binding'
        idv = t['has_own_id']
        idcol = [('id', 't_dl')] if idv else []
        # violating row: due in past + open status; compliant: due in future
        stat_open = open_states[0] if open_states else (states[0] if states else None)
        stat_term = None
        for s in states:
            if any(k in s for k in TERMINAL):
                stat_term = s; break
        def row(idsuffix, due_expr, status):
            cols = []
            # id must be unique per (table, due-column, role): a text-PK table with
            # several _due_at columns runs all its scenarios in one txn.
            if idv: cols.append(('id', lit('t_dl_'+tbl+'_'+dcol+'_'+idsuffix)))
            cols.append((dcol, due_expr))
            if status is not None: cols.append(('status', lit(status)))
            cl = ', '.join(q(c) for c, _ in cols)
            vl = ', '.join(v for _, v in cols)
            return f"insert into {fq} ({cl}) values ({vl});"
        # detection predicate
        if open_states:
            pred = f"{q(dcol)} < now() and {q('status')} = any(array[{', '.join(lit(s) for s in open_states)}])"
        else:
            pred = f"{q(dcol)} < now()"
        # Each test file runs in one begin/rollback txn against a freshly-migrated
        # (empty) DB, and each scenario only sets ITS due_at column (others stay
        # NULL and are excluded by `dcol < now()`), so counting all matches = the
        # seeded violator(s). No id filter needed (synth-uuid tables have no stable id).
        a.append(f"\n-- {tbl}.{dcol}  ({evtxt}); open states: {open_states or 'n/a (no status enum)'}")
        a.append(row('viol', "now() - interval '1 day'", stat_open))
        a.append(row('ok_future', "now() + interval '30 days'", stat_open))
        if stat_term and open_states:  # past-due terminal row must be excluded by the status filter
            a.append(row('ok_term', "now() - interval '1 day'", stat_term))
        a.append(f"select is( (select count(*) from {fq} where {pred})::int, "
                 f"1, {lit(tbl+'.'+dcol+' past-due detection flags exactly the violator ('+evtxt+')')});")
        n += 1
        manifest['deadlines'].append({'table': tbl, 'col': dcol, 'open_states': open_states,
                                      'has_status': bool(states), 'terminal_seeded': bool(stat_term),
                                      'controls': ev})
open(os.path.join(OUT, '03_deadline_invariants.test.sql'), 'w').write(
    header(n, f'Deadline data-invariants — {len(manifest["deadlines"])} due-date checks') + '\n'.join(a) + FOOTER)

# ========================================================================
# 90 deadline monitors  (plain SQL, ops use — operationalizes alerts_metrics)
# ========================================================================
m = ["-- Past-due monitors (plain SQL, NOT pgTAP). Each returns currently-violating rows.",
     "-- Operationalizes the deadline half of each control's alerts_metrics.\n"]
for d in manifest['deadlines']:
    tbl, dcol, os_ = d['table'], d['col'], d['open_states']
    fq = f"{q(SCHEMA)}.{q(tbl)}"
    pred = (f"{q(dcol)} < now() and {q('status')} = any(array[{', '.join(lit(s) for s in os_)}])"
            if os_ else f"{q(dcol)} < now()")
    ev = ', '.join(d['controls']) or 'unbound'
    m.append(f"-- {tbl}.{dcol}  ({ev})")
    m.append(f"select {lit(tbl)} as table, {lit(dcol)} as deadline, id, {q('status') if d['has_status'] else 'null'} as status, {q(dcol)} as due_at\n"
             f"from {fq} where {pred};\n")
open(os.path.join(OUT, '90_deadline_monitors.sql'), 'w').write('\n'.join(m) + '\n')

json.dump(manifest, open(os.path.join(HERE, 'checks_manifest.json'), 'w'), indent=2)

print(f"tests written to {OUT}")
print(f"  00 structure : {len(manifest['has_table'])} tables, {len(manifest['has_column'])} columns")
print(f"  01 states    : {sum(1 for t in tables.values() if t['states'])} tables")
print(f"  02 coverage  : {covered_controls} in-scope controls, {len(manifest['coverage_gaps'])} gap(s)")
print(f"  03 deadlines : {len(manifest['deadlines'])} due-date invariants")
