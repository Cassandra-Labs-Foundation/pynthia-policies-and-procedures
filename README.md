# Cassandra Platform

A banking core for a credit union in which **the compliance policy and the running system are
the same artifact**. Policy prose is authored once, controls are extracted from it
mechanically, and those controls become the database schema, the runtime gate, and the tests
that prove the gate fires. A control that no code enforces shows up red on a dashboard rather
than passing silently in a binder.

This replaces `compliance-system-architecture.md` (2024), which was right about the shape and
wrong about every name.

## Layout

```
compliance/     the policy side — currently at the repo root, see "Moving parts" below
  <26 policy folders>/  prompt.md -> {slug}.md, plus references/
  shared-controls/      cross-policy controls, hand-authored (no prompt.md)
  scripts/              the extractors
  docs/dashboard/       the evidence dashboard (GitHub Pages)

core/           the banking core
  supabase/             39 tables, 66 migrations, 48 API modules, the drill harness
  core-api.yaml         the spec (OpenAPI 3.0.3)
  core-api-loop/        the spec's self-minimising loop
  architecture-decisions.md   28 decisions, D1-D28 — hand-authored, authoritative
  research/             provider-API analysis that informs the decisions
  verifier/             black-box test-target enumeration

ui/             the staff console (Next.js) — early, mock-data

analytics/      DuckDB views, the 5300 and BSA reporters
```

Generated artifacts (`controls.json`, `core-vocabulary.json`, `control-vocabulary.json`,
`extracted-vocab.json`, `crosswalk.json`, `control-tests*.json`) live at the **repo root**
because the dependency runs both ways — compliance produces what the core consumes, and the
core's spec produces what compliance classifies against. They are the contract between the two
halves, owned by neither.

## The core idea

A **control** is a single obligation with an id, a regulatory citation, a trigger event, the
events it must produce, and the inputs it requires. That block lives in the policy markdown a
compliance officer writes; `extract_controls.py` parses it. Everything downstream is derived,
so the prose and the system cannot disagree without something going red.

## The pipeline

```
prompt.md ──(LLM, regenerate-policy.yml)──> {slug}.md          the authored policy
                                                │
                                    extract_controls.py
                                                ▼
core-api.yaml ──parse_core_api.py──> core-vocabulary.json ─> controls.json  (333 controls)
                                                │                  │
                          ┌─────────────────────┼──────────────────┴─────────┐
                          ▼                     ▼                            ▼
                    gen_sql.py            gen_tests.py                build_dashboard.py
                   core schema            pgTAP suite                 the evidence site
```

Every arrow is a script in `scripts/` or `supabase/generate/`, and CI re-runs them on every
push that touches an input. `extract-artifacts.yml` commits the regenerated JSON straight to
`main` — no PR, because a pure function of already-reviewed inputs has nothing to review.

## The bidirectional loop

**Legal → engineering.** A control names vocabulary (`member.tax_id`,
`cip.identity_verified`). `check_vocab_refs.py` classifies each token against the spec:
registered, provisional, or missing. Missing vocabulary is a demand signal — the policy is
asking for a field or event the core does not yet have.

**Engineering → legal.** `core-api-loop/` runs the other direction: it takes the accumulated
demand and searches for the smallest spec that satisfies it, so the API converges on what the
policies actually need instead of on what someone guessed up front.

## The control engine at runtime

`runGate` is the enforcement point. Money-movement modules — `ach.ts`, `cards.ts`, `cda.ts`,
`transfers.ts`, `wires.ts`, `simulate.ts` — call the same gate, so a control written once
applies across every rail rather than being re-implemented per payment type. The gate reads the
control catalogue; it is not hand-coded per rule.

All 48 API modules ship as a single Deno function with one `index.ts`. Compliance is not a
separate service — `bsa.ts` and `wires.ts` are in the same deployment and share the gate.

## Evidence, in three tiers

| tier | what it proves | where |
|---|---|---|
| **hermetic** | unit + behavioural, against `fake_db.ts` (which parses the real migrations for column defaults) | `deno test supabase/functions/` |
| **schema** | pgTAP — structure, CHECK enforcement, per-control field coverage | `supabase/tests/` |
| **drill** | one test per control: fire its trigger, assert its produced events | `supabase/functions/drill/` |

The drill runs twice — against the fake (`control-tests.json`) and against the real database
(`control-tests-live.json`). **A control that is hermetic-green and live-red is a fake-vs-real
defect**, and those are the interesting ones: constraint divergence, missing NOT NULL columns,
status vocabularies the schema rejects. The live tier exists to find exactly this class.

Red is the backlog, not a failure. `red_by_reason` in `control-tests.json` says why each one is
red — usually "no writer" for a noun the core does not model yet.

## Dashboard

`docs/dashboard/` renders the catalogue and its evidence: per-policy pages generated from
`controls.json`, plus a synthetic `money-movement-gate` view that cuts across policies. Hosted
on GitHub Pages because the Supabase gateway rewrites renderable content types on shared
domains.

**Demo posture:** the data route is public and the evidence is synthetic. The `provenance`
column (`production` / `demo` / `unknown`) is what keeps synthetic rows from being mistaken for
real ones — it is load-bearing, not decorative.

## Moving parts

This repo was consolidated from three (`pynthia-policies-and-procedures`, `cassandra-core`,
`core-ui`) in July 2026. Two things are mid-flight:

- The 26 policy folders, `scripts/`, and `docs/dashboard/` are still at the repo root; they
  move under `compliance/` in a follow-up. The layout above is the target.
- `core/verifier/` enumerates 529 test targets, but its control tier is already built — better
  — as `drill/`. Its remaining value is the other 208 targets (contract, property,
  state-machine). See `core/README.md`.

`SUMMARY.md` is the policy index. `BLUEPRINT.md` and `HANDOFF.md` are the working record of
what is verified and what is not — start with `HANDOFF.md`.
