---
name: vocabulary
description: Extract the current engineering vocabulary (entities, fields, events, endpoints) from core-vocabulary.json and emit it as structured Markdown grouped by entity, suitable for pasting into Section 5 ("System Design Notes") of a policy prompt.md. Use this skill whenever the user wants to refresh Section 5, dump the current vocabulary, pull the latest event/field codes, or check what's registered in the engineering spec — even if they don't name the skill explicitly. This skill is project-scoped to the "policies and procedures" folder.
---

# Vocabulary skill

## What this skill does

This skill reads the canonical `core-vocabulary.json` at the root of the
"policies and procedures" project (a parsed dump of the engineering API
spec) and produces a single Markdown block listing:

- Spec metadata (title, version, parsed-at timestamp) and totals
- Every entity with a per-entity field table (type, required, PII, bound
  controls, one-line description)
- The events list — or, when the events list is empty, a clearly
  labelled warning plus the endpoints list as candidate signals
- The endpoints list (method, path, summary, control refs, audit events)
- State machines and plugins (if present)

The output is deliberately **unfiltered**. The downstream meta-prompt
decides what is relevant for each policy — this skill's job is to make
the current state of the spec visible in a form the policy author (or
the regenerator) can scan quickly.

## When to use it

Use this skill when:

- The user is writing or updating Section 5 ("System Design Notes") of a
  policy `prompt.md`.
- The user asks for the "latest vocabulary", "current event and field
  codes", "what engineering has registered", or anything that implies
  freshness of the spec.
- The regeneration pipeline is running and needs the current vocabulary
  to fill `DESIGN_NOTES` in the meta-prompt inputs block.

Don't use this skill to write the policy itself — it only produces the
vocabulary block. Composition into `prompt.md` or the meta-prompt inputs
is the caller's job.

## How to invoke

The skill ships with one script. Run it from anywhere; it auto-locates
`core-vocabulary.json` at the project root.

```
python3 "/sessions/nice-serene-clarke/mnt/policies and procedures/.skills/vocabulary/scripts/extract_vocabulary.py"
```

Useful flags:

- `-i PATH` — use a different core-vocabulary.json (e.g., a branch copy).
- `-o PATH.md` — write to a file instead of stdout.
- `--max-desc N` — cap the per-field one-line description at N chars
  (default 140). Lower this if the output feels too wide for GitBook.

Typical flow when asked "refresh Section 5":

1. Run the script and capture its stdout.
2. Show the Markdown block to the user OR splice it into the relevant
   `prompt.md`'s Section 5, depending on what they asked for.
3. If the script emitted the "no events defined" warning, surface that
   to the user — Section 5 should not invent event codes; it should
   either reference the endpoints as candidate signals or flag the gap
   for engineering to close.

## Expected input

The skill assumes `core-vocabulary.json` at the project root has the shape
produced by the spec parser. Required top-level keys: `meta`, `stats`,
`entities`, `fields`. Optional keys used when present: `events`,
`endpoints`, `state_machines`, `plugins`. Missing optional keys degrade
gracefully — the skill emits an "_No X defined in core-vocabulary.json._"
line and continues.

If `core-vocabulary.json` is absent or malformed the script exits non-zero
with a message on stderr. Report the failure to the user rather than
papering over it with stale data.

## Output shape

The script emits one self-contained Markdown document. The structure is
always the same (stable section order):

1. `# System Design Notes — Engineering Vocabulary` + meta/totals
2. `## Entities and fields` — one `###` sub-section per entity, each
   with a field table
3. `## Events` — table or the empty-events warning
4. `## Endpoints` — table
5. `## State machines` and `## Plugins` — bullets or the "none
   defined" line

The whole block can be pasted directly under the `## 5. System Design
Notes` heading of a `prompt.md`, or included verbatim as part of the
`DESIGN_NOTES` input to the shared meta-prompt.

## Design notes

- **No filtering.** The user chose "dump everything, let meta-prompt
  pick." If you find yourself wanting to prune the output for a
  particular policy, resist — the regeneration step is where policy
  relevance gets decided.
- **Descriptions are truncated to one line** (default 140 chars) so the
  table stays scannable. The full description remains in
  `core-vocabulary.json` if the caller needs it.
- **Empty events is a known edge case** in the current spec (0 events
  at time of writing). The warning is deliberately visible so the
  policy author doesn't quietly reference event codes that don't
  exist.
- The script is idempotent and safe to re-run — it never modifies
  `core-vocabulary.json` or any other file unless `-o` is passed.
