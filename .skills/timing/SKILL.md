---
name: timing
description: Instrument any long-running Claude-driven task with per-phase timestamps so we can see where wall-clock actually goes and identify rate-limiting steps with data instead of estimates. Use this skill whenever the user asks to "time the regenerator," "instrument the pipeline," "measure where the time goes," "profile this task," or anything in that family. Lightweight Python — appends one JSONL line per mark to .cache/timing/<run_id>.jsonl and prints a phase-by-phase report at run end. Designed to be called from inside the regenerate-policies scheduled task and from the narrative skill's caller. This skill is project-scoped to the "policies and procedures" folder.
---

# Timing skill

## What this skill does

Records per-phase timestamps for any task that wants observability. Each call to `timing.py mark` appends one line to a JSONL log under `.cache/timing/<run_id>.jsonl`. At the end of a run, `timing.py end` (or `report`) prints a phase-by-phase breakdown showing wall-clock elapsed at each mark and delta between consecutive marks.

The point: stop guessing at where time goes. One real run prints the answer.

## When to use it

Use this skill when:

- The regenerate-policies task is running and you want a per-phase breakdown so you can identify which step is rate-limiting.
- The narrative skill is being invoked and the caller wants to know how long it took (broken down by glue / per-control phases if fanned out, or just start/end for the monolithic v2 form).
- Any future long-running orchestration in this project needs observability.

Don't use this skill for:

- Single, fast commands (`<1s`) — the overhead of marking dwarfs the work.
- Debug logging — this is for timing, not arbitrary events. Use stderr or a separate log for diagnostic messages.

## How to invoke

Four commands:

```bash
# Initialize a run. RUN_ID is any identifier you want — ISO timestamp is conventional.
python3 .skills/timing/scripts/timing.py start <run_id>

# Mark a phase boundary. EVENT is a short snake_case label.
python3 .skills/timing/scripts/timing.py mark <run_id> <event> [--phase <phase>] [--detail "k=v,k=v"]

# Finalize and print a report. (Implies a final run_end mark.)
python3 .skills/timing/scripts/timing.py end <run_id>

# Print a report without finalizing (useful mid-run for sanity-checking).
python3 .skills/timing/scripts/timing.py report <run_id>
```

`--phase` is optional but encouraged — it groups consecutive marks together so the report can sum per-phase totals. `--detail` is for context that doesn't fit in the event name (e.g., `n_files=3,cache_hits=2`). Both are stored as structured fields in the JSONL log.

## Convention

For the regenerate-policies task, use ISO 8601 UTC as the run_id (the same string the task already captures for STATUS.md):

```bash
RUN_ID=$(date -u +%Y-%m-%dT%H:%M:%SZ)
python3 .skills/timing/scripts/timing.py start "$RUN_ID"
```

For the narrative skill, use a run_id derived from the caller's context (e.g., the regenerator's RUN_ID with a `-narrative` suffix, or a fresh ISO timestamp for ad-hoc invocations).

## Recommended phase labels for the regenerator

These match the pipeline diagram. If you mark with these consistently, run-over-run comparisons line up cleanly:

- `deps_checked` — pdftotext + mammoth availability confirmed
- `manifest_read` — meta-prompt.md + manifest.yaml loaded
- For each policy (with `--detail slug=<slug>`):
  - `policy_started`
  - `policy_prompt_parsed`
  - `directive_resolved` — Section 5 directive done (or noted as skipped)
  - `references_extracted` (`--detail n_files=N,cache_hits=K`)
  - `prompt_assembled`
  - `policy_generated` — the big model call returned
  - `policy_validated`
  - `policy_written`
- `status_md_written`
- (auto from `end`) `run_end`

## Output

`.cache/timing/<run_id>.jsonl` — one JSON object per line. Cheap to read with `jq` or another tool.

Final report from `end` looks like:

```
Timing report — run 2026-05-21T17:30:00Z
======================================================================
   Elapsed     Delta  Event
----------------------------------------------------------------------
      0.00s    0.00s  run_start
      0.21s    0.21s  deps_checked
      0.35s    0.14s  manifest_read
      0.41s    0.06s  policy_started [fair-lending] {'slug': 'fair-lending'}
      0.52s    0.11s  policy_prompt_parsed [fair-lending]
      0.55s    0.03s  directive_resolved [fair-lending]
      2.31s    1.76s  references_extracted [fair-lending] {'n_files': 3, 'cache_hits': 2}
      2.33s    0.02s  prompt_assembled [fair-lending]
    104.62s  102.29s  policy_generated [fair-lending]
    104.71s    0.09s  policy_validated [fair-lending]
    104.74s    0.03s  policy_written [fair-lending]
    104.99s    0.25s  status_md_written
    105.01s    0.02s  run_end

Per-phase totals:
  fair-lending             102.33s
  (no phase)                 2.68s
```

That tells you exactly where the time went: 102s in the model call, ~3s in everything else. With a number like that on the page, you can stop arguing about whether reference extraction or YAML front-matter matters.

## Design notes

- **The script is intentionally tiny.** No dependencies beyond the Python stdlib. The whole thing is one file, ~80 lines.
- **JSONL is the storage.** One line per mark. Easy to tail, easy to grep, easy to post-process with `jq`. If you want CSV or a chart later, write a separate tool that reads the JSONL.
- **`.cache/timing/` is gitignored implicitly** because `.cache/` is already part of the regenerator's local-only state. Don't commit timing logs.
- **The clock is wall-clock (`time.time()`), not CPU time.** That's what we care about for "how long does the user wait."
- **Phase totals are computed from marks within a phase span.** A mark's phase label applies to the work *just completed* (i.e., the delta from the previous mark). If you don't pass `--phase`, the delta still appears in the timeline but doesn't aggregate.
