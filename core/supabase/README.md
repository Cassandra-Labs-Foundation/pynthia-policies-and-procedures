# Supabase schema — Cassandra Banking Core API

Postgres schema generated from [`core-api.yaml`](../core-api.yaml) (v3.0.0), the
Cassandra Banking Core API spec. All objects live in a dedicated `core` schema.

## What's here

```
supabase/
  migrations/
    20260702000100_core_schema.sql        schema + 39 tables + PKs + CHECK constraints + audit cols + updated_at trigger + column comments
    20260702000200_core_indexes.sql       btree indexes on *_id / status / created_at
    20260702000300_core_foreign_keys.sql  hard FK constraints — apply AFTER bulk load
    20260702000400_core_rls.sql           enable RLS (locked down by default)
    20260702000500..000800                blnk mirror cols, reconcile cron, idempotency, grants
    20260718000100_wire_originator.sql    wire_transfer.originator (audit + cross-rail velocity)
    20260718000200_ach_card_originator.sql  same for ach_transfer + card_authorization
    20260718000300_card_authorization_states.sql  CHECK over the card auth lifecycle
  tests/               pgTAP suite turning controls.json into database tests — see tests/README.md
  generate/
    extract_model.py   parses core-api.yaml -> model.json (relational model)
    gen_sql.py         model.json -> the 4 migration files
    gen_tests.py       controls.json + model.json -> the pgTAP suite
    model.json         cached intermediate model
    checks_manifest.json  machine-readable list of every test assertion
```

**Totals:** 39 tables · 691 columns · 99 indexes · 151 CHECK constraints · 2 FKs · RLS on all tables.

## Modeling decisions

| Concern | Decision |
|---|---|
| **Scope** | 39 resource tables from the `banking-core` + `primitive` + `domain` schema tiers. The 206 `vocabulary` control-evidence schemas are **not** tabled. |
| **Embedded detail** | 30 detail schemas (`AuditDetail`, `SarData`, `Applicant`, …) that are only ever nested are folded into `jsonb` columns on their parent (hybrid rule). `Document` and `Filing` are polymorphic wrappers — jsonb suits their variants. |
| **Typing** | Loose `string` fields promoted to proper Postgres types: `timestamptz` (`format: date-time`, `*_at`, `*_date`), `bigint` (integers / balances), `numeric`, `boolean`, `jsonb`. Ambiguous flag/timer strings stay `text` (conservative). |
| **Primary keys** | 22 schemas expose an API string `id` → `id text primary key`. 17 have no id in the spec → synthesized `id uuid default gen_random_uuid()`. |
| **State machines** | `x-states` and field `enum`s become `CHECK` constraints (151 total). `loan` and `loan_application` declare `x-states` and `/transition` endpoints but no `status` field, so a `status` column is synthesized from their states. |
| **Foreign keys** | The spec is loosely coupled (untyped string ids), so only 2 unambiguous FKs are inferred (`account_number.account_id`, `bsa_alert.event_id`). They live in a separate migration so ingest order never blocks. All `*_id` columns are indexed as soft references regardless. |
| **Arrays of resources** | `case.evidence` (→ Document), `*.control_results` (→ ControlResult), `case.tasks` (id list) are stored as `jsonb` soft-refs on the parent, matching the API payload shape. |
| **Compliance linkage** | Every field's `x-bound-controls` is preserved as a `comment on column` (e.g. `evidences MB-05, TIS-06`). 492 column comments. |
| **Identifiers** | All table/column names are quoted, so reserved words (`case`, `user`, `window`) are safe. |

## Applying

**Option A — Supabase CLI** (recommended)

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

> **Deploy order is load-bearing.** Apply migrations *before* deploying the edge
> functions. `runGate` reads `originator` on every money movement, so shipping
> the functions first breaks **book transfers too**, not just the new rail.

**Option B — SQL editor / psql**: run the files in filename order. Skip
`..._foreign_keys.sql` until after you bulk-load data, then apply it.

Validated: all 4 migrations apply cleanly against Postgres (39 tables, 99
indexes, 151 checks, 2 FKs, RLS on all tables); smoke inserts and CHECK
rejection confirmed. The pgTAP suite in [tests/](tests/) turns the compliance
controls into 2,566 database assertions — see [tests/README.md](tests/README.md).

## Exposing the API (optional)

The tables are in schema `core`, **not** `public`, so PostgREST does not expose
them by default. To get the auto-generated REST/GraphQL API, add `core` to the
exposed schemas and grant access. This is **not** in the migrations (keeps them
portable + secure by default) — apply deliberately:

```sql
-- config.toml:  [api] schemas = ["public", "core"]   (or set in Dashboard → API settings)
grant usage on schema core to anon, authenticated, service_role;
grant all on all tables in schema core to service_role;      -- service_role bypasses RLS
-- Then add per-table RLS policies (see 20260702000400_core_rls.sql for a template)
-- before granting select/insert to anon/authenticated.
```

RLS is **on** with no permissive policy, so only `service_role` can touch the
data until you add policies. That is the intended default for banking data.

## Regenerating

Edit the spec or the generator, then:

```bash
cd supabase/generate
python extract_model.py ../../core-api.yaml   # -> model.json
python gen_sql.py ../migrations               # -> the 4 .sql files
```

The migration files are generated artifacts — edit `gen_sql.py`, not the SQL.
