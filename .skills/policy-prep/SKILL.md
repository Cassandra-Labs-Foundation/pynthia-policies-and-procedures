---
name: policy-prep
description: Single-pass Python helper that performs all the deterministic pre-model work for one policy regeneration — parses prompt.md, resolves the DESIGN_NOTES directive (with cache), converts each reference document (PDF/DOC/DOCX/TXT) to durable markdown the first time it is seen (persisted beside the source and reused until the source changes), assembles the full composite prompt, and writes it ready for the model to consume. Cuts roughly 30 model tool-call iterations per policy down to one shell-out, reducing wall-clock orchestration overhead from minutes to seconds. Use whenever the regenerate-policies scheduled task is preparing a policy for generation.
---

# policy-prep skill

## What this does

For a single policy slug, runs every deterministic step that previously had the regenerator's Claude agent driving bash + Read + Edit calls in a long loop. One Python invocation:

1. Reads `meta-prompt.md` from the project root.
2. Reads `{slug}/prompt.md` and parses its six expected sections into structured inputs.
3. Detects whether Section 5 is a directive; resolves it (with disk cache lookup by sha256 of command + script + vocabulary.json bytes).
4. Lists `{slug}/references/`, dispatches by extension, converts each source document to markdown in parallel via `ThreadPoolExecutor`, and concatenates the markdown into `REFERENCE_POLICY`. **Conversions are durable:** the markdown for a source `foo.pdf` is written beside it as `foo.pdf.md` (committed to the repo) with a header recording the source's sha256. On later runs the persisted `.md` is reused as-is and the source is only re-converted when its content hash changes. This means a reference is converted **once**, not on every regeneration.
5. Assembles the composite prompt (meta-prompt + INPUTS block + LOCAL_OVERRIDES if any).
6. Writes the composite prompt to `.cache/prep/{slug}.composite-prompt.txt`.
7. Prints a JSON summary to stdout for the regenerator: design_notes source, reference cache stats, output path, and per-step timings.

The model never has to drive the parsing, extraction, or assembly — it just reads the composite prompt and generates.

## Why this exists

Measured timing on the previous run showed ~168 seconds of orchestration overhead per policy. The actual deterministic work — parsing one Markdown file, running pdftotext on cached PDFs, calling mammoth on a cached .docx, hashing strings — adds up to single-digit seconds when done in one Python pass. The overhead was the model's loop latency, not the work itself.

## When to use it

- The `regenerate-policies` scheduled task should invoke this once per enabled policy, before the generation step.
- Any future test harness for the meta-prompt should use this so timing comparisons reflect inherent generation cost, not orchestration noise.

Don't use it for ad-hoc edits to a single policy file — it's designed for the full prep-then-generate flow.

## How to invoke

```bash
python3 .skills/policy-prep/scripts/prepare_policy.py <slug> \
  [--project-root DIR]    # defaults to current working directory
  [--meta-prompt PATH]    # defaults to {project-root}/meta-prompt.md
```

Returns 0 on success and prints a JSON object to stdout. Returns non-zero on hard failures (missing prompt.md, no required sections); orchestrator should treat the policy as FAILED and continue.

Stdout JSON shape:
```json
{
  "slug": "fair-lending",
  "composite_prompt_path": ".cache/prep/fair-lending.composite-prompt.txt",
  "composite_prompt_chars": 32145,
  "policy_name": "Fair Lending Policy",
  "design_notes_source": "dynamic via skill (cached)",
  "references": {
    "total": 3,
    "extracted": 3,
    "cache_hits": 3,
    "converted": 0,
    "failed": [],
    "skipped": []
  },
  "timing": {
    "parse_prompt_md": 0.012,
    "resolve_directive": 0.045,
    "extract_references": 0.318,
    "assemble_composite": 0.003,
    "total": 0.398
  }
}
```

## What the orchestrator does after

The composite prompt at `.cache/prep/{slug}.composite-prompt.txt` is ready to be sent to the model verbatim. The regenerator's per-policy flow becomes:

```bash
# 1. Run prep (fast Python — typically <5s)
PREP_JSON=$(python3 .skills/policy-prep/scripts/prepare_policy.py "$SLUG")

# 2. Mark
python3 .skills/timing/scripts/timing.py mark "$RUN_ID" prep_done --phase "$SLUG" --detail "..."

# 3. Read the composite prompt
COMPOSITE_PATH=$(echo "$PREP_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['composite_prompt_path'])")

# 4. Generate (model — this is the inherent cost)
# (model reads $COMPOSITE_PATH and produces the full policy Markdown)

# 5. Validate + write + mark as before
```

Four model tool calls per policy instead of thirty-plus.

## Reference conversion (durable, committed)

The authoritative converted form of every reference lives **beside the source** in `{slug}/references/`, not in the throwaway `.cache/`:

- Source `Foo.pdf` → durable `Foo.pdf.md` (same for `.doc`, `.docx`, `.txt`).
- The first line of each generated `.md` is a header: `<!-- policy-prep:converted source="Foo.pdf" source-sha256="…" -->`. This header is stripped before the markdown is fed to the model, but lets the script detect staleness.
- On each run: if `Foo.pdf.md` exists and its recorded hash matches `Foo.pdf`'s current bytes → reuse (no conversion). Otherwise convert and (re)write `Foo.pdf.md`. So a reference is converted **once** and only re-converted when the source actually changes.
- A `.md` whose paired source is present in the same folder is skipped silently (it's represented by its source). A `.md` whose source is absent (orphan) or a hand-authored `.md` is used directly.
- Unsupported binaries (e.g. `.xlsx`) are listed under `skipped`, not `failed`.

`references` stats: `extracted` = references whose text was included; `converted` = how many were (re)converted this run; `cache_hits` = how many were reused without conversion; `total` excludes the paired `.md` sidecars (they're counted via their source).

These `.md` files are intended to be committed to the repo so a fresh clone reuses them too.

## Cache layout

The script still uses the project's `.cache/` for genuinely ephemeral work:

- `.cache/converted/<sha256>.docx` — intermediate `.doc` → `.docx` conversions (libreoffice)
- `.cache/directives/<sha256>.txt` — directive stdout
- `.cache/prep/<slug>.composite-prompt.txt` — composite prompt

Cache reads are best-effort. Cache misses fall back to fresh execution and write a new entry. Cache writes that fail are logged but don't fail the run. (Durable reference markdown is NOT in `.cache/` — see the section above.)

## Failure modes

- Missing `prompt.md` → exit 1, JSON to stderr with `error: prompt.md missing`.
- prompt.md has a missing or `{{placeholder}}` section → exit 1, JSON to stderr with `error: section X is a placeholder`.
- Directive command exit non-zero → continue with empty DESIGN_NOTES, mark `design_notes_source: dynamic via skill (failed: <reason>)`.
- Reference extraction failure on one file → continue with the rest, list the failure in `references.failed`.
- All reference extractions fail → continue (empty REFERENCE_POLICY), still emit composite prompt.

## Design notes

- The script mirrors the regenerator task's caching keys exactly so caches built by the old flow remain valid.
- Reference extraction uses `ThreadPoolExecutor` with `max_workers=min(8, len(references))` — same as the regenerator spec.
- The script is read-only on `meta-prompt.md`, `manifest.yaml`, and per-policy `prompt.md`. Within `references/` it only ever *adds or refreshes* `<source>.md` conversion siblings — it never modifies or deletes the source documents. All other writes are under `.cache/`.
- No model calls. No subagents. No network beyond what `pdftotext` / `mammoth` / `libreoffice` do (none).
