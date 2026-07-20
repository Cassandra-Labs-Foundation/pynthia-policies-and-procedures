"""Size a domain the corrected way: scan ALL THREE declaration sources.

A control is blocked by everything it DECLARES — its trigger, its produced
events, and its required inputs. Scanning only produced events (the obvious
choice) understates the dependency set; see BLUEPRINT's "read first".

Prints, per namespace, whether a table for it EXISTS, whether anything WRITES
to it, and which controls depend on it — so the entity/satellite call can be
made explicitly and audited.
"""
import json, re, glob, collections, sys

def tables_and_writers():
    tables = set()
    for f in glob.glob('supabase/migrations/*.sql'):
        for m in re.finditer(r'create table if not exists "core"\."([a-z_0-9]+)"', open(f).read()):
            tables.add(m.group(1))
    writes = collections.Counter()
    for f in glob.glob('supabase/functions/**/*.ts', recursive=True):
        if f.endswith('.test.ts'):
            continue
        src = re.sub(r'\s+', ' ', open(f).read())
        for m in re.finditer(r'\.from\(\s*"([a-z_0-9]+)"\s*\)', src):
            tail = src[m.end():m.end() + 300]
            nxt = tail.find('.from(')
            if nxt != -1:
                tail = tail[:nxt]
            if re.search(r'\.(insert|upsert|update|delete)\(', tail):
                writes[m.group(1)] += 1
    return tables, writes

def declared(r):
    """Every namespace the control declares, across all three sources."""
    ns = set()
    for t in r.get('triggers', []):
        ns.add(t.split('.')[0])
    for e in r.get('expected', []):
        ns.add(e.split('.')[0])
    for i in (r.get('required_inputs') or []):
        ns.add(i.split('.')[0])
    return ns

def blocking(r):
    """Namespaces that are actually UNSATISFIED for this control."""
    ns = set()
    if (r.get('blocked_on') or '').startswith('no writer'):
        for t in r['triggers']:
            ns.add(t.split('.')[0])
    for e in r.get('expected', []):
        if e not in r.get('observed', []):
            ns.add(e.split('.')[0])
    b = r.get('blocked_on') or ''
    if b.startswith('inputs not supplied'):
        for i in b.split(': ', 1)[1].split(', '):
            ns.add(i.split('.')[0])
    return ns

def main(selector):
    tables, writes = tables_and_writers()
    res = json.load(open('control-tests.json'))['results']
    red = [r for r in res if not r['scoped_out'] and r['status'] == 'red']
    if selector.startswith('ns:'):
        want = selector[3:]
        rows = [r for r in red if want in declared(r)]
        title = f"controls declaring namespace '{want}'"
    else:
        rows = [r for r in red if r['policy'] == selector]
        title = f"policy '{selector}'"

    print(f"=== {title}: {len(rows)} in-scope red ===\n")
    freq = collections.Counter(n for r in rows for n in blocking(r))
    print(f"{'namespace':24s} {'table?':8s} {'writer?':8s} controls")
    for n, c in freq.most_common():
        t = 'yes' if n in tables else 'NO'
        w = 'yes' if writes[n] else ('ABANDONED' if n in tables else '-')
        print(f"  {n:22s} {t:8s} {w:9s} {c}")
    print()
    for r in rows:
        print(f"  {r['uid']:44s} {sorted(blocking(r))}")

if __name__ == '__main__':
    main(sys.argv[1])
