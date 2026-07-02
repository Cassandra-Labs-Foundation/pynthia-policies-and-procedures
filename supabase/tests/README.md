# Control tests (pgTAP)

Generated test suite that turns the compliance controls in
[`controls.json`](../../controls.json) into runnable database tests against the
`core` schema. **2,566 assertions** across four files.

| File | Plan | What it checks |
|---|---:|---|
| `00_schema_structure.test.sql` | 1539 | Every table exists with a PK, `set_updated_at` trigger, and RLS enabled; every one of the 691 columns exists with its expected Postgres type. |
| `01_state_machines.test.sql` | 48 | For each of the 24 stateful tables: a valid `status` is accepted, an invalid one is rejected by the CHECK constraint (`throws_ok` 23514). |
| `02_control_coverage.test.sql` | 932 | For **172 in-scope controls**, every bound field (`api_references.fields`) resolves to a real column — each assertion is tagged with its `control_id`. Fields the schema lacks are `todo()` (see gaps below). |
| `03_deadline_invariants.test.sql` | 47 | For each `*_due_at` column: seed a past-due open row, a future row, and a past-due terminal row, then assert past-due detection flags **exactly** the violator. Each is tagged with the control(s) it evidences. |

`90_deadline_monitors.sql` is **not** a test — it's plain SQL (one `SELECT` per
deadline) that returns currently-violating rows, operationalizing the deadline
half of each control's `alerts_metrics` for ops/monitoring.

## Running

pgTAP must be available in the test database:

```sql
create extension if not exists pgtap;
```

Then either:

```bash
supabase test db                    # runs everything in supabase/tests/
# or, directly:
pg_prove -d <db> supabase/tests/*.test.sql
```

Each file wraps its assertions in `begin … rollback`, so tests never persist
data. They assume a freshly-migrated (empty) `core` schema — which is what
`supabase test db` provides.

Verified out-of-band against a real Postgres (pgTAP stubbed for the syntax gate,
every assertion's truth re-checked via `pg_catalog`, and all seed/detection SQL
executed): **0 failures.**

## Scope

Tests cover the **~29 in-scope tables** and the **172 controls** that bind to
them. The other 158 controls reference only the 206 vocabulary objects that were
intentionally left out of the schema (see [../README.md](../README.md)), so they
are not testable here — file 02's per-control header notes how many of each
control's fields are out-of-scope.

## Known coverage gaps (`todo`)

Nine control-referenced fields have no column. They read as event markers
(`object.action`) rather than stored fields, so they surface as `todo()` — the
suite stays green while flagging them. Add columns (boolean/timestamptz) or an
event-log table if you want them enforced:

| Control | Field | Expected column |
|---|---|---|
| CP-11 | `training.proficiency.failed` | `core.training.proficiency_failed` |
| RII-03 | `indemnification.payment.disbursed` | `core.indemnification.payment_disbursed` |
| RII-04 | `indemnification.payment.blocked` | `core.indemnification.payment_blocked` |
| RII-04 | `indemnification.standard_determination.made` | `core.indemnification.standard_determination_made` |
| RII-05 | `indemnification.advance.disbursed` | `core.indemnification.advance_disbursed` |
| RII-05 | `indemnification.repayment.demanded` | `core.indemnification.repayment_demanded` |
| RII-06 | `indemnification.payment.blocked` | `core.indemnification.payment_blocked` |
| RII-08 | `indemnification.claim.notified` | `core.indemnification.claim_notified` |

## Notes / heuristics

- **Terminal states**: file 03 treats states matching a terminal lexicon
  (closed, resolved, complete, released, cancelled, filed, settled, denied, …)
  as "closed"; a past-due row in those states is *not* flagged. The lexicon is in
  `gen_tests.py` — adjust per table if a state is misclassified.
- **`loan` / `loan_application` status**: these declare `x-states` and expose
  `/transition` endpoints but no `status` field in the spec, so the schema
  synthesizes a `status` column (see [../README.md](../README.md)). Without it
  their state machines couldn't be tested.

## Regenerating

```bash
cd supabase/generate
python gen_tests.py ../../controls.json ../tests
```

Edit `gen_tests.py`, not the `.sql` — the test files are generated artifacts.
