#!/usr/bin/env python3
"""Parse core-api.yaml -> structured relational model for Supabase DDL generation.

Decisions honored:
- Scope: banking-core + primitive + domain schemas (~69).
- Split: endpoint-backed / orphan-resource schemas -> TABLES;
         embedded-only detail schemas -> jsonb columns on their parent.
- Typing: promote loose `string` to proper Postgres types.
- Nesting: hybrid -> FK for entity refs, jsonb for detail blobs.
"""
import yaml, collections, json, re, sys

SPEC = sys.argv[1] if len(sys.argv) > 1 else 'core-api.yaml'
spec = yaml.safe_load(open(SPEC))
schemas = spec['components']['schemas']
paths = spec.get('paths', {})

TARGET_KINDS = {'banking-core', 'primitive', 'domain'}
MIXIN_KINDS = {'mixin'}
targets = {n for n, s in schemas.items() if s.get('x-kind') in TARGET_KINDS}
mixins = {n for n, s in schemas.items() if s.get('x-kind') in MIXIN_KINDS}

# ---- endpoint detection: schema returned by a path's 200/201 as the primary body ----
def top_ref(obj):
    if not isinstance(obj, dict):
        return None
    if '$ref' in obj:
        return obj['$ref'].split('/')[-1]
    if obj.get('type') == 'object' and 'properties' in obj:
        d = obj['properties'].get('data')
        if isinstance(d, dict):
            if '$ref' in d:
                return d['$ref'].split('/')[-1]
            if d.get('type') == 'array' and isinstance(d.get('items'), dict) and '$ref' in d['items']:
                return d['items']['$ref'].split('/')[-1]
    if obj.get('type') == 'array' and isinstance(obj.get('items'), dict) and '$ref' in obj['items']:
        return obj['items']['$ref'].split('/')[-1]
    return None

has_endpoint = {}
for p, ops in paths.items():
    for method, op in (ops or {}).items():
        if not isinstance(op, dict):
            continue
        for code in ('200', '201'):
            r = op.get('responses', {}).get(code)
            if not r:
                continue
            sc = r.get('content', {}).get('application/json', {}).get('schema')
            n = top_ref(sc)
            if n in targets:
                has_endpoint.setdefault(n, []).append(f"{method.upper()} {p}")
                break

# ---- property-level refs (direct, not walking into other schemas) ----
def resolve_allof(name, seen=None):
    """Return (own_props: {name: prop}, inherited_from: [mixin names], states)."""
    s = schemas[name]
    props = {}
    inherited = []
    states = s.get('x-states')
    # allOf entries
    for entry in s.get('allOf', []) or []:
        if isinstance(entry, dict) and '$ref' in entry:
            base = entry['$ref'].split('/')[-1]
            inherited.append(base)
            bs = schemas.get(base, {})
            for pn, pv in (bs.get('properties') or {}).items():
                props.setdefault(pn, pv)
        elif isinstance(entry, dict) and 'properties' in entry:
            for pn, pv in entry['properties'].items():
                props.setdefault(pn, pv)
    for pn, pv in (s.get('properties') or {}).items():
        props[pn] = pv
    return props, inherited, states

# classify nested refs among targets
def prop_direct_ref(pv):
    """If a property is a $ref or array-of-$ref, return (refname, is_array)."""
    if not isinstance(pv, dict):
        return None, False
    if '$ref' in pv:
        return pv['$ref'].split('/')[-1], False
    if pv.get('type') == 'array' and isinstance(pv.get('items'), dict) and '$ref' in pv['items']:
        return pv['items']['$ref'].split('/')[-1], True
    return None, False

# figure out which targets are embedded-only (jsonb) vs tables
nested_by = collections.defaultdict(set)
for n in targets:
    props, _, _ = resolve_allof(n)
    for pn, pv in props.items():
        ref, _ = prop_direct_ref(pv)
        if ref in targets and ref != n:
            nested_by[ref].add(n)

table_set = {n for n in targets if n in has_endpoint or not nested_by[n]}
embedded_set = targets - table_set

# ---- type promotion ----
def snake(name):
    s = re.sub(r'(?<!^)(?=[A-Z])', '_', name).lower()
    return s

def pg_type(colname, pv):
    """Promote an OpenAPI property to a Postgres type."""
    t = pv.get('type')
    fmt = pv.get('format')
    lname = colname.lower()
    # explicit formats
    if fmt == 'date-time':
        return 'timestamptz'
    if fmt == 'date':
        return 'date'
    if t == 'integer':
        return 'bigint'
    if t == 'number':
        return 'numeric'
    if t == 'boolean':
        return 'boolean'
    if t == 'object':
        return 'jsonb'
    if t == 'array':
        return 'jsonb'
    # string with name-based promotion
    if t == 'string' or t is None:
        if lname.endswith('_at') or lname.endswith('_timestamp'):
            return 'timestamptz'
        if lname.endswith('_date'):
            return 'date'
        if lname.endswith('_amount') or lname in ('amount', 'balance'):
            return 'bigint'
        return 'text'
    return 'text'

# FK inference: a scalar column named <x>_id whose <x> maps to a table
table_by_snake = {}
for n in table_set:
    table_by_snake[snake(n)] = n
# also common aliases
ALIAS = {
    'account': 'Account', 'entity': 'Entity', 'loan': 'Loan',
    'loan_application': 'LoanApplication', 'card': 'Card', 'case': 'Case',
    'incident': 'Incident', 'task': 'Task', 'document': 'Document',
    'filing': 'Filing', 'transfer': 'Transfer', 'verification': 'Verification',
    'ach_transfer': 'AchTransfer', 'wire_transfer': 'WireTransfer',
    'account_number': 'AccountNumber', 'event': 'Event',
}

def fk_target(colname):
    if colname == 'id':
        return None
    m = re.match(r'^(.*)_id$', colname)
    if not m:
        return None
    stem = m.group(1)
    if stem in ('owner', 'blnk_ledger', 'external', 'idempotency', 'agent', 'role', 'poa_artifact',
                'breakglass', 'reviewer', 'user_roster', 'provider', 'parent'):
        return None  # ambiguous / external / generic
    if stem in table_by_snake:
        return table_by_snake[stem]
    if stem in ALIAS:
        return ALIAS[stem]
    return None

# ---- build model ----
model = {'tables': {}, 'embedded': sorted(embedded_set), 'notes': []}

for n in sorted(table_set):
    props, inherited, states = resolve_allof(n)
    cols = []
    fks = []
    jsonb_detail = []
    softrefs = []          # array-of-resource stored as jsonb soft-ref
    has_own_id = 'id' in props
    for pn, pv in props.items():
        ref, is_array = prop_direct_ref(pv)
        col = snake(pn)
        ctrls = pv.get('x-bound-controls') if isinstance(pv, dict) else None
        if ref in embedded_set:
            # embedded detail schema -> jsonb blob (hybrid rule)
            jsonb_detail.append({'column': col, 'detail_schema': ref, 'array': is_array})
            cols.append({'name': col, 'type': 'jsonb', 'enum': None, 'controls': ctrls,
                         'note': f'embedded {ref}' + (' (array)' if is_array else '')})
            continue
        if ref in table_set:
            if is_array:
                # array of a resource object, embedded in payload -> jsonb soft-ref by id
                softrefs.append({'column': col, 'ref_table': ref})
                cols.append({'name': col, 'type': 'jsonb', 'enum': None, 'controls': ctrls,
                             'note': f'array of {ref} (soft ref by id -> {snake(ref)})'})
                continue
            else:
                # single ref -> FK column <prop>_id
                fkcol = col if col.endswith('_id') else col + '_id'
                cols.append({'name': fkcol, 'type': 'text', 'enum': None, 'controls': ctrls,
                             'note': f'FK -> {snake(ref)}'})
                fks.append({'column': fkcol, 'ref_table': ref})
                continue
        # scalar / inline object / scalar array
        typ = pg_type(col, pv)
        enum = pv.get('enum')
        fkt = fk_target(col) if typ == 'text' else None
        note = None
        if fkt and fkt in table_set:
            fks.append({'column': col, 'ref_table': fkt, 'soft_scalar': True})
            note = f'FK -> {snake(fkt)}'
        cols.append({'name': col, 'type': typ, 'enum': enum, 'note': note,
                     'controls': pv.get('x-bound-controls') if isinstance(pv, dict) else None,
                     'provisional': bool(isinstance(pv, dict) and pv.get('x-provisional'))})
    # Synthesize a status column for stateful entities that declare x-states but
    # expose no `status` property (e.g. loan / loan_application — state is managed
    # via /transition endpoints). Without it the state machine is unenforceable.
    if states and not any(c['name'] == 'status' for c in cols):
        cols.append({'name': 'status', 'type': 'text', 'enum': None,
                     'note': 'synthesized from x-states (no status property in spec)',
                     'controls': None, 'provisional': False})
    model['tables'][n] = {
        'schema': n,
        'table': snake(n),
        'kind': schemas[n].get('x-kind'),
        'description': schemas[n].get('description'),
        'states': states,
        'inherited': inherited,
        'endpoints': has_endpoint.get(n, []),
        'has_own_id': has_own_id,          # True -> id text PK from API; False -> synth uuid PK
        'columns': cols,
        'fks': fks,
        'jsonb_detail': jsonb_detail,
        'softrefs': softrefs,
    }

json.dump(model, open('model.json', 'w'), indent=2)

# ---- summary ----
print(f"TABLES: {len(model['tables'])}")
print(f"EMBEDDED (jsonb): {len(model['embedded'])}")
tot_cols = sum(len(t['columns']) for t in model['tables'].values())
tot_fks = sum(len(t['fks']) for t in model['tables'].values())
print(f"Total columns: {tot_cols}  Total FKs: {tot_fks}")
synth = [t['table'] for t in model['tables'].values() if not t['has_own_id']]
print(f"Synth-UUID PK tables ({len(synth)}): {synth}")
print("\nPer-table (pk / cols / fks / jsonb-detail / softref / states):")
for n, t in sorted(model['tables'].items()):
    st = len(t['states']) if t['states'] else 0
    pk = 'text' if t['has_own_id'] else 'uuid'
    print(f"  {t['table']:26s} pk={pk:4s} cols={len(t['columns']):3d} fks={len(t['fks']):2d} "
          f"jsonb={len(t['jsonb_detail']):2d} soft={len(t['softrefs']):2d} states={st}")
