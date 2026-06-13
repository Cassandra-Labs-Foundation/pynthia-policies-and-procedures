# program.md — instructions for the spec-minimizing agent

You are optimizing **one file**: `core-api.yaml` at the repo root. This is the AutoResearch
`train.py` analog — the single mutable artifact. Your job is to make it the **smallest API that
still fully spans both the architecture and the controls**.

## Hard contract (do not violate)

1. **You may edit only `core-api.yaml`.** Never edit anything under `core-api-loop/prepare/`
   (the oracles, `fitness.py`, `score.py`, `architecture-spec.json`, `score-config.json`),
   never edit `core-api-loop/inputs/`, never edit the policy markdown, `controls.json`,
   `vocab-migration.json`, or the `scripts/`. The evaluator is immutable by design — that is the
   anti-gaming guarantee. If you think the evaluator is wrong, stop and tell a human; do not
   route around it.
2. **One named move per candidate.** Make a single, describable change (e.g. "merge
   `wire_details` into `wire_transfer`"), then score. This keeps payoff attributable and builds
   the learned-move library (git history + `moves.jsonl`).
3. **The score is the judge.** Keep a move iff it lowers the score. You do not get to argue with
   the number.

## The objective

```
score = (control_violations + arch_violations) * big_penalty + complexity      # lower is better
control_violations = max(0, unregistered_codes      - control_budget)
arch_violations    = max(0, uncovered_arch_elements - arch_budget)
```

Two regimes follow automatically:
- **While violations > 0 (infeasible):** the penalty dominates — your job is to *close gaps*
  (register cited codes, add architecture-mandated resources/state-machines/events/endpoints).
- **Once feasible:** the penalty is zero — your job is to *minimize complexity* without
  reopening any gap.

Run the scorer to see exactly where you stand:
```
core-api-loop/.venv/bin/python core-api-loop/prepare/score.py
```

## Elon's algorithm — apply in THIS ORDER (delete before simplify)

The ordering is load-bearing. Do not jump to step 3 before exhausting steps 1–2.

1. **Question every element.** For each resource, field, event, endpoint, task type, state
   machine in the spec: *which control code or which `architecture-spec.json` line justifies it?*
   - A code in the demand justifies a field/event (run `control_oracle.py`).
   - A line in `architecture-spec.json` justifies a resource/SM/event-family/endpoint.
   - If nothing justifies it, it is an **orphan**.
2. **Delete orphans.** Remove the element, re-score. Keep the deletion iff the score did not rise
   (i.e. no gap opened). A deletion that lowers complexity with no new violation is free money.
3. **Simplify / merge survivors.** Only now: unify near-duplicate resources, make derivable
   fields computed, subsume narrow endpoints under a general one, collapse redundant event verbs.
   Re-score after each. Heaviest payoff is on **concepts** (resources + distinct event verbs +
   endpoint shapes) — they are weighted 10×.

Do **not** chase complexity by genericizing: replacing typed fields with `object`/`any` blobs is
taxed by the genericness surcharge, and the control oracle still demands the real dotted codes
exist — a blob registers nothing. There is no free lunch there.

## Authority precedence (critical — avoid stale-doc poisoning)

- `core-api-loop/inputs/architecture-decisions.md` (**v1.1**) is **authoritative**. When in
  doubt about what the API must express, it wins.
- `core-api-loop/inputs/compliance-system-architecture.md` is **conceptual only and STALE**. Its
  names are superseded — it says "Kafka", "openapi.yaml", "vocabulary.json". Per Decision 4,
  **Kafka was eliminated** in favor of PostgreSQL append-only event logs. **Never reintroduce**
  these dead concepts into the spec.
- The control demand (policy markdown) is fixed during the inner loop. You serve it; you don't
  edit it.

## Scope (set per run)

- **Phase 1 (default): fair-lending overfit.** Work only the fair-lending sub-spec. Reference
  `core-api-loop/inputs/fair-lending-openapi.yaml`. Prove the loop converges on a minimal
  sub-spec covering only FL controls + the architecture they touch.
- Widen to all domains only after the oracles have demonstrably caught bad moves and a held-out
  control slice validates that "small" isn't "overfit".

## Move protocol (with the runner)

1. `core-api-loop/.venv/bin/python core-api-loop/run_loop.py status` — see the current best score.
2. Edit `core-api.yaml` — one named move.
3. `core-api-loop/run_loop.py adjudicate --label "merge wire_details into wire_transfer"`
   — scores, then **keeps** (commits) iff better or **reverts** (`git checkout core-api.yaml`)
   otherwise, and logs the attempt to `core-api-loop/moves.jsonl`.
4. Repeat.
