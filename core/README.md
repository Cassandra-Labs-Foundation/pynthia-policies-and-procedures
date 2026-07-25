# core/ — architecture, research, verifier

Imported from `Cassandra-Labs-Foundation/cassandra-core` @ `af1c062` on 2026-07-24.

| | what it is | lifecycle |
|---|---|---|
| `architecture-decisions.md` | the 28 formal decisions (v1.1, D1–D28) | **authoritative**, hand-authored |
| `research/` | provider-API analysis pipeline | re-runnable; outputs gitignored |
| `verifier/` | black-box test-target enumeration | see caveat below |

## architecture-decisions.md is the reason this directory exists

`core/supabase/` cites these decisions **87 times across 24 files** — `-- per D4`, `(D23)`,
`D25` — and until this import none of those citations resolved, because the log lived in
another repo. Code compensated by re-narrating decisions inline, which is how a decision
log and its implementation drift apart without anyone noticing.

It is **hand-authored**. `research/` informs it; nothing generates it. See
`research/readme.md` stage 7 — that step is a human reading stages 5–6 and writing prose.
Do not regenerate it from the pipeline.

## research/

Self-contained. `python3 run_pipeline.py` crawls the providers in `providers.json`, extracts
semantic maps, and diffs specs; outputs land in a gitignored `build/`. Stages 5–7 are manual
(paste an artifact plus a prompt into an LLM, then synthesise by hand).

Two things did **not** come across:

- `5300-call-report.md` and its prompt → moved to `analytics/reference/`. They analyse NCUA
  Form 5300 requirements, which is not provider research — and they specify a reporter that
  already exists here (`analytics/report_5300.sh`, run daily by `aggregator-reporters.yml`).
- `compliance-system-architecture.md` → deliberately left in `cassandra-core/archive/`. It
  was right about the shape and wrong about every name (Kafka, `openapi.yaml`,
  `vocabulary.json` — all superseded) and the count (223 controls; there are now 333). The
  current description of the system is this repo's top-level `README.md`.

## verifier/ — read this before using it

`generator/enumerate.py` turns `core-api.yaml` + `controls.json` + `properties.yaml` +
`compliance-floor.yaml` into `targets.json` (529 targets) and `worklist.md`. Deterministic;
the model never decides *what* to test, only *how*.

Three caveats:

1. **It cannot currently run here.** `parse_core_api` reads the original bespoke flat format
   (top-level `resources:` / `endpoints:`). This repo's `core-api.yaml` is OpenAPI 3.0.3, which
   it matches none of — and it does not fail, it returns empty and completes "successfully"
   with `core_api_resources: 0, endpoints: 0`, silently dropping all 143 contract and 24
   state-machine targets. The committed `targets.json` (529 targets, 75 resources, 143
   endpoints) is the last valid output, enumerated in cassandra-core against the old format.
   Porting the parser to OpenAPI is prerequisite work for anything else here.

2. **Its targets are stale even once that is fixed.** They were enumerated against
   cassandra-core's pinned June snapshots — 321 controls, against today's 333.
3. **Its control tier is already built, better, as `core/supabase/functions/drill/`.** Drill has
   the hermetic backend (`fake_db.ts`), the live one (`live_db.ts`), 964 lines of cases and
   a grader, and produces 333 results in `control-tests.json` / `control-tests-live.json`.
   Verifier's 321 control targets are the same population.

   What drill does *not* cover is verifier's other **208** targets — 143 contract (error
   envelope, pagination, versioning, idempotency), 41 property (cross-cutting invariants),
   24 state-machine. That gap is the real remaining value here.

`PRINCIPLES.md` P1 says the core "may be regenerated in any language", which is why the
suite is black-box over HTTP. That premise no longer holds: the Supabase core is the real
one. The black-box discipline is still worth keeping — it is good test design — but it is
no longer protecting a planned rewrite.

`TEST-CATALOG.md`'s 86 checkboxes are all unwritten, and a good number of its Tier-1 items
are things drill already covers. Re-derive rather than inherit.

## Not imported

`archive/` (33 MB of POCs: tiger-beetle-core, blnk-core, stablecoin-core, core-ui) and
`archive/research-legacy/` (283 files) stay in `cassandra-core`, which remains the archive
of record.
