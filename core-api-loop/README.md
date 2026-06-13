# core-api-loop

An AutoResearch-style self-minimizing loop for `core-api.yaml`. The agent edits one file
(`core-api.yaml`); an **immutable** eval harness scores it; the runner keeps a move iff it beats
the best. Goal: the smallest API that fully spans both the **controls** (policy demand) and the
**architecture** (`architecture-decisions.md`).

See the plan in `~/.claude/plans/` and the agent contract in [`program.md`](program.md).

## Layout

```
inputs/                       one-time snapshots from cassandra-core (see PROVENANCE.md)
  architecture-decisions.md       authoritative (v1.1)
  compliance-system-architecture.md  conceptual + STALE (Kafka/openapi.yaml superseded)
  fair-lending-openapi.yaml       phase-1 reference sub-spec
prepare/                      THE IMMUTABLE EVAL HARNESS — the agent must never edit this
  control_oracle.py               coverage vs policy demand (unregistered = demand - events - fields)
  architecture_oracle.py          coverage vs architecture-spec.json
  architecture-spec.json          hand-reviewed checklist distilled from architecture-decisions.md
  fitness.py                      complexity (concepts/fields/endpoints/tasks + genericness tax)
  score.py                        single gated scalar + keep/revert verdict
  score-config.json               weights, budgets, big_penalty
  demand.json                     frozen demand snapshot (control_oracle.py --freeze)
program.md                    agent instructions (Elon ordering, authority precedence, scope)
run_loop.py                   INNER loop: keep-iff-best runner (init / status / adjudicate / run)
regenerate.py                 OUTER loop: regenerate a policy vs the spec + measure demand delta
supervise.py                  drives inner<->outer to a fixed point (outer only after inner converges)
journal.py                    unified hypothesis->outcome log (inner moves + outer cycles)
requirements.txt              PyYAML
.venv/                        local venv (gitignored)
best.json, moves.jsonl        inner-loop working state (gitignored)
.regen/                       outer-loop working state: generated md + demand snapshots (gitignored)
```

## Setup

```bash
python3.12 -m venv core-api-loop/.venv
core-api-loop/.venv/bin/pip install -r core-api-loop/requirements.txt
```

## Use (human-approved inner loop)

```bash
PY=core-api-loop/.venv/bin/python
$PY core-api-loop/run_loop.py init          # freeze demand + record baseline (run once)
# ... edit core-api.yaml: one named move ...
$PY core-api-loop/run_loop.py adjudicate --label "merge wire_details into wire_transfer"
#   -> KEEP (commit) if score drops, else REVERT (git checkout). Logged to moves.jsonl.
```

Inspect any spec without the runner:
```bash
$PY core-api-loop/prepare/score.py                 # score current spec
$PY core-api-loop/prepare/control_oracle.py        # unregistered codes
$PY core-api-loop/prepare/architecture_oracle.py   # uncovered architecture elements
```

> The runner refuses to commit on `main` — work on a loop branch (e.g. `core-api-loop/run`)
> or pass `--allow-main`.

## Outer loop (policy regeneration → demand co-evolution)

The inner loop minimizes the spec against a **frozen** demand. The outer loop regenerates the
policies against the (now smaller/different) spec so they cite its registered vocabulary, which
shifts the demand. If the demand stabilizes you've hit a fixed point; if it moves, run the inner
loop again. `regenerate.py` owns all the determinism; the LLM that turns a composite prompt into
Markdown is a **pluggable backend**.

The composite prompt is assembled by the existing `.skills/policy-prep` skill: `meta-prompt.md`
+ the policy's `{slug}/prompt.md` INPUTS + the live vocabulary as `DESIGN_NOTES` (from
`.skills/vocabulary/scripts/extract_vocabulary.py` over `core-vocabulary.json` — this is the spec
coupling). `regenerate.py prep` re-parses the spec first so `DESIGN_NOTES` is current.

**One-shot (`cycle`)** — snapshot → prep → generate → apply → measure:

```bash
PY=core-api-loop/.venv/bin/python
# Fully automated (needs a backend):
ANTHROPIC_API_KEY=... $PY core-api-loop/regenerate.py cycle fair-lending --backend api --show

# Agent/human (no backend): cycle runs snapshot+prep, then PAUSES with the composite-prompt path.
$PY core-api-loop/regenerate.py cycle fair-lending              # -> pauses, prints drop path
#   ...a Claude Code subagent reads .cache/prep/fair-lending.composite-prompt.txt and writes the
#      generated Markdown to core-api-loop/.regen/fair-lending.generated.md...
$PY core-api-loop/regenerate.py cycle fair-lending --resume     # -> apply + measure
```

`cycle` stages the demand snapshot under `cycle-<slug>-before`; `--resume` reuses it. If the
generated Markdown already exists when `cycle` reaches the generate step (stage backend), it
proceeds without pausing.

**Affected-only (recommended steady state)** — regenerate just the policies the spec change can
actually move, not all ~26. A policy is *affected* iff it cites a code whose **registered status
flipped** between the baseline spec and the current spec (symmetric difference of the registered
sets ∩ the policy's cited codes) — i.e. a code it cited became registered (it can now reuse it →
unregistered drops) or a code it cited got removed (its reference now dangles). Everything else is
left untouched.

```bash
PY=core-api-loop/.venv/bin/python
# At the START of an outer cycle (before the inner loop edits the spec):
$PY core-api-loop/regenerate.py spec-snapshot --tag pre
# ... run the inner loop (run_loop.py) — core-api.yaml changes ...
$PY core-api-loop/regenerate.py affected --before pre --show          # preview: which policies + why
$PY core-api-loop/regenerate.py cycle --affected --before pre --backend api   # regenerate just those
```

Baseline (the "old" spec) can be a `spec-snapshot` tag (`--before`), an old `core-vocabulary.json`
(`--baseline-vocab`), or a git ref (`--baseline-ref <commit>`).

**Concurrent generation.** `cycle` is phase-batched (prep all → generate all → apply/measure all)
so the generate phase — the only slow part — fans out across affected policies:

- `--backend api|cli`: generations run in a thread pool (`--jobs N`, default 4). Each call is
  I/O-bound, so N policies complete in ~one generation's wall-clock, not N×.
- `--backend stage`: `cycle --affected` preps + stages every affected policy, then pauses with the
  full pending list. Because the policies are independent, generate them **in parallel** (e.g. one
  Claude Code subagent per policy, spawned in a single message — they run concurrently), each
  writing its `.regen/<slug>.generated.md`. Then `cycle --affected --before pre --resume` applies +
  measures all. Wall-clock ≈ one generation regardless of how many policies.

Measured: one fair-lending cycle ≈ **5.7 min** (≈99.7% in the single LLM generation; prep + apply +
measure together are ~1.4 s). A thread-pool sanity check showed 4 stubbed generations finishing in
2.0 s at `--jobs 4` vs 8.0 s at `--jobs 1`.

**Step-by-step** (same stages, run individually) — `snapshot --tag … / prep / generate / apply /
measure` — see `regenerate.py --help`.

> Today there is no `claude` CLI / `ANTHROPIC_API_KEY` / `anthropic` SDK on this machine, so the
> usable backend is `stage` driven by a Claude Code subagent. `--backend api|cli` works as soon as
> a key or the CLI is present (model: `claude-opus-4-8`).

## Supervisor — drive inner↔outer to a fixed point

`supervise.py` runs the full co-evolution. **The invariant: an outer cycle runs ONLY after the
inner loop has converged.** Per round:

1. freeze demand + snapshot the baseline spec
2. **inner loop to convergence** — propose a move (`--proposer-cmd`) → adjudicate, repeated until
   the proposer stops changing the spec, `--patience` consecutive moves are reverted, or
   `--max-inner` is hit
3. **gate** — only now compute the spec delta and the affected policies
4. if nothing is affected → spec converged, no policy impacted → **fixed point**, stop
5. **outer** — regenerate the affected policies (delegates to `regenerate.py`)
6. re-freeze demand; if it didn't move → **fixed point**, stop; else next round

Stops at `--max-outer` rounds or after `--ratchet` rounds with no best-score improvement. Every
inner move and outer cycle flows into the same journal; round boundaries are in
`supervisor-rounds.jsonl`.

```bash
PY=core-api-loop/.venv/bin/python
# on a loop branch (inner moves commit); api/cli regenerate inline:
$PY core-api-loop/supervise.py --proposer-cmd "<cmd that edits core-api.yaml, prints {label,note}>" \
    --outer-backend api --patience 2 --max-inner 20 --max-outer 5
# stage backend: each round preps+stages affected policies and PAUSES; generate them in parallel
# (subagents), then continue with:
$PY core-api-loop/supervise.py --resume
```

The **proposer** is the universal hook for the inner-move generator: a shell command that edits
`core-api.yaml` to make one move and prints `{"label":..,"note":..}`. The supervisor writes the
current scorer state to `.regen/proposer-context.json` before each call and the move contract is in
[`program.md`](program.md). Point it at an LLM (`claude -p < prompt`), a script, anything; "no
change" means the inner loop has converged.

> Verified end-to-end (deterministic proposer, no LLM): round 1 kept 3 inner feasibility moves
> (unregistered 1116→1113), declared convergence, the gate found 2 affected policies, the outer
> step engaged and paused for staged generation; `--resume` applied + measured + re-froze and
> reported the demand had moved (→ next round).

## Journal — what was tried and what happened

Every hypothesis the loop tested and its outcome is logged, in one place:

- **Inner moves** → `moves.jsonl` (written by `run_loop.py adjudicate`): the move `--label` is the
  hypothesis, the `--note` its rationale; `kept`/Δ/coverage/complexity/commit is the outcome.
- **Outer cycles** → `regen-log.jsonl` (written by `regenerate.py measure`/`cycle`): "regenerate
  <slug>" is the hypothesis; the demand + unregistered delta is the outcome.

`journal.py` merges both into one chronological view:

```bash
core-api-loop/.venv/bin/python core-api-loop/journal.py            # readable table + summary
core-api-loop/.venv/bin/python core-api-loop/journal.py --kept-only # only moves that landed
core-api-loop/.venv/bin/python core-api-loop/journal.py --write      # also -> core-api-loop/JOURNAL.md
```

```
TIME         LOOP  HYPOTHESIS                         OUTCOME
06-13 19:20  inner delete orphan /cases endpoints     KEPT   Δ-42 | unreg 1116 arch 34 cx 4412 [9ee05bc]
06-13 19:21  inner delete Account state machine       revert Δ+100000 | unreg 1116 arch 35 cx 4412
06-13 19:38  outer regenerate fair-lending            unreg 1116→1088 (-28) | demand 3792→3711 (+4/-85)
inner: 1/2 moves kept (1 reverted) | best score 115004454 → 115004412 | outer cycles: 1
```

Pass a rationale at run time so it lands in the journal:
`run_loop.py adjudicate --label "merge wire_details into wire_transfer" --note "both describe the same wire; fields are 1:1"`
and `regenerate.py cycle fair-lending --note "lending vocab now registered"`. The logs + `JOURNAL.md`
are local working state (gitignored); regenerate the journal any time from the logs.

## The score

```
score = (control_violations + arch_violations) * big_penalty + complexity   # lower is better
control_violations = max(0, unregistered_codes      - control_budget)
arch_violations    = max(0, uncovered_arch_elements - arch_budget)
```
Feasibility first (drive violations to 0/budget), then minimize complexity. Budgets default to
hard 0 in `score-config.json`; set a provisional budget there or via
`--control-budget/--arch-budget` to start in the minimize-complexity regime.

## Verified baseline (2026-06-13, live policy tree, hard budgets)

| metric | value |
|---|---|
| parsed spec | 265 entities, 1,683 fields, 1,221 events, 35 endpoints, 12 state machines, 28 task types |
| control demand | 3,792 codes across 30 policies / 371 controls |
| **unregistered (control gap)** | **1,116** |
| **uncovered architecture elements** | **34 / 51** (state machines all pass; gap is the banking-core endpoint surface + `account_number`) |
| complexity | 4,454 |
| score | 115,004,454 |

> Note: the committed `controls.json` (942 unregistered, 26 policies) is **stale** vs the live
> policy tree (1,116, 30 policies). The oracle computes against the live markdown.

### Harness verification (all pass)

1. **Oracle sanity** — reproduces 1,116 control gap + a non-empty 34-element architecture gap.
2. **Deletion safety** — free deletion (`/cases` endpoints) → complexity 4454→4412, no new
   violation → **KEEP** (Δ=−42). Load-bearing deletion (`Account` state machine) → arch gap
   34→35 → **REVERT** (Δ=+100000). The gate has teeth.
3. **Runner dry-run** — `adjudicate` committed only the kept move and reverted the losing one
   cleanly; `moves.jsonl` logged both attempts.
4. **Round-trip integrity** — from-scratch `parse_core_api.py` + `extract_controls.py` reproduce
   265 entities and 1,116 unregistered, matching the oracle (no hidden state).
5. **Outer-loop convergence** — demonstrated end-to-end on `fair-lending`: `prep` (reparse +
   composite) → a Claude Code subagent generated a 46 KB / 13-control policy from the composite
   prompt → `apply` (validated: 65 events + 61 fields + 29 tasks registered) → `measure`. The
   demand moved 3,792→3,711 codes (4 added, 85 removed) and **unregistered dropped 1,116→1,088
   (−28)** against the unchanged spec — purely from the regenerated policy reusing more registered
   codes. (Demo reverted afterward; generated copy kept in `.regen/`.)

### Fix shipped during verification

`scripts/extract_controls.py` `EXCLUDE_PATH_PARTS` now also excludes `core-api-loop` — otherwise
the harness's own Markdown (e.g. a generated policy staged in `.regen/`) would be miscounted as a
policy and inflate both the demand and the repo's committed `controls.json`.
