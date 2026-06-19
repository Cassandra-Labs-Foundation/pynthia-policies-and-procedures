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
score = (control_violations + arch_violations + invariant_violations) * big_penalty
      + complexity + irregularity + redundancy                       # lower is better
control_violations  = max(0, unregistered_codes      - control_budget)
arch_violations     = max(0, uncovered_arch_elements - arch_budget)
invariant_violations= x-actions/x-timers/transitions/$ref that do not resolve   # must stay 0
irregularity        = conformance_event * noncanonical_events
                    + conformance_timer * noncanonical_timers
                    + namespace_gap     * namespace_gaps      # 0 when structural_terms is off
redundancy          = redundancy_weight * compressible_field_surplus   # 0 when structural_terms is off
```

Three regimes follow automatically:
- **While violations > 0 (infeasible):** the penalty dominates — your job is to *close gaps*
  (register cited codes, add architecture-mandated resources/state-machines/events/endpoints) and
  *never introduce an invariant violation* (a dangling `$ref`, an `x-action` naming an unregistered
  action). The invariant gate makes inconsistency as expensive as a coverage gap.
- **Once feasible:** the penalty is zero — your job is to *minimize complexity, irregularity, AND
  redundancy* without reopening any gap or breaking an invariant.

`irregularity` (the `conformance_oracle` surcharge) rewards a *regular* spec: codes that
decompose into registered primitives — events as `object.property.action` (action ∈
x-event-types), timers as `object.<task_type>.due_at` (task_type ∈ x-task-types), and every
`object.property` an event implies registered as a field. It is description length the element
count is blind to: a spec generated from `objects × actions × properties` + a grammar is shorter
than N bespoke codes of equal count. The demanded codes come from `controls.json` (immutable) and
every term needs a real registered primitive, so you cannot lower it by renaming — only by
genuinely registering the missing field/action/task type or normalizing a code onto an existing
one. Run `conformance_oracle.py` to see exactly which codes are non-canonical.

`redundancy` (the `factoring_oracle` surcharge) rewards *compression*: the same field cluster
copied across many objects is description length a base schema could hold once. `extract_base` the
cluster (members compose it via `allOf:[$ref]`) and the copies collapse to one definition + N
references. Run `factoring_oracle.py` for the `extract_base` targets. The concept weight (10×) on
the new base means only genuinely repeated clusters pay — the loop will not over-shatter the model.

`irregularity` (the `conformance_oracle` surcharge) rewards a *regular* spec: codes that
decompose into registered primitives — events as `object.property.action` (action ∈
x-event-types), timers as `object.<task_type>.due_at` (task_type ∈ x-task-types), and every
`object.property` an event implies registered as a field. It is description length the element
count is blind to: a spec generated from `objects × actions × properties` + a grammar is shorter
than N bespoke codes of equal count. The demanded codes come from `controls.json` (immutable) and
every term needs a real registered primitive, so you cannot lower it by renaming — only by
genuinely registering the missing field/action/task type or normalizing a code onto an existing
one. Run `conformance_oracle.py` to see exactly which codes are non-canonical.

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
4. **Regularize & factor survivors** (when `irregularity > 0` or `redundancy > 0`). For each
   non-canonical code or repeated cluster that survived steps 1–3:
   - A field an event implies but the spec lacks → **register the field** (`object.property`).
     Lowers `namespace_gaps`.
   - A timer spelled as a bespoke `*_due_at` field → **fold into the Task pattern**
     `object.<registered task_type>.due_at`. Lowers `noncanonical_timers`.
   - An event whose action tail is unregistered → **register the action** only if it is reused
     across enough codes to beat its concept weight (10×); otherwise **normalize** the code onto
     an existing action. Lowers `noncanonical_events`.
   - A field cluster repeated across many objects (`factoring_oracle.py` mixin candidates) →
     **`extract_base`** it into a composed base. Lowers `redundancy`. Only fields identical across
     all members move; the rest stay put.
   This step *adds* elements on purpose — a registered field or a base schema that retires a chunk
   of irregularity/redundancy is a net score win. It is the one place where growing the spec lowers
   the score. **Invariant guard:** every regularize/factor move must leave `x-actions`, `x-timers`,
   `transitions_to`, and every `$ref` resolving — an inconsistency is a hard violation (big_penalty),
   so a move that breaks the model is auto-reverted however much else it saves.

The proposer is fed a **learned-moves** block (from `moves.jsonl` via `move_memory.py`) summarizing
which move TYPES have been kept vs reverted. Favor kept-types; avoid revert-types unless you have a
new angle. It biases search only — every move is still judged by the immutable scorer.

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
