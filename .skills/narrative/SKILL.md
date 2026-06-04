---
name: narrative
description: Produce a regulator-facing prose narrative version of a Pynthia compliance policy as a sibling to the structured Table-First / Design-Overlay v2 output. Use this skill whenever the user wants a narrative, prose, plain-language, regulator-readable, or examiner-readable version of a policy — even if they don't name this skill explicitly. Also use it when the user asks to "rewrite the fair-lending policy as prose," "make a flowing version," "draft the examiner-facing summary," or anything that implies a non-tabular policy artifact. The regeneration pipeline calls this skill alongside the structured meta-prompt to emit a sibling slug-narrative.md file (e.g., fair-lending-narrative.md) in the policy folder. This skill is project-scoped to the "policies and procedures" folder.
---

# Narrative skill

## What this skill does

This skill produces the **regulator-facing prose narrative** version of a
Pynthia compliance policy. It is a sibling artifact to the structured
Table-First / Design-Overlay v2 output that `meta-prompt.md` produces. Both
are generated from the same inputs — the per-policy `prompt.md` plus
`references/` — but they serve different audiences:

| Artifact | Audience | Form |
|---|---|---|
| `{slug}.md` (structured) | Engineers + program owners | Tables, control IDs (FL-01…), Design Overlay v2 blocks with TRIGGERS / INPUTS / OUTPUTS / event + field codes, full citations and eCFR/LII hyperlinks |
| `{slug}-narrative.md` (this skill) | Regulators / examiners | Flowing prose, control sections headed by name (no FL-XX), no URLs, no "12 CFR §…" references — laws are named by act name only |

The two files describe **the same policy**. Discrepancies are bugs. The
narrative is shorter — roughly a 10-minute read for an examiner — and
trades the engineering scaffolding (event codes, field codes, audit-log
lists) for plain-language explanation.

## When to use it

Use this skill when:

- The regeneration pipeline is running and a policy's `prompt.md` is being
  rebuilt — emit the narrative sibling alongside the structured file.
- The user asks for a prose, narrative, plain-language, regulator-facing,
  or examiner-facing version of a policy.
- The user asks to "make the policy readable" or "produce the version
  we'd hand a regulator" or anything in that family.

Don't use this skill to:

- Produce the structured Design Overlay v2 document — that's
  `meta-prompt.md`.
- Edit `prompt.md` (the canonical regulator-readable summary). The
  narrative is generated **from** `prompt.md` plus references; it does not
  replace `prompt.md`.

## How to invoke

The skill ships one file: `narrative-prompt.md`. The regenerator (or a
human running this manually) composes a single prompt by concatenating, in
order:

1. The contents of `narrative-prompt.md` (this skill's template).
2. The INPUTS block, populated from the policy's `prompt.md` (the same
   inputs the structured meta-prompt uses: ORGANIZATION, POLICY_NAME,
   SCOPE, OWNER & APPROVERS, POLICY_SUMMARY, REFERENCE_POLICY,
   AUTHORITY_HINTS, DESIGN_NOTES — though DESIGN_NOTES is **not** echoed
   into the narrative output; see "Design notes" below).
3. Optionally, the just-regenerated structured policy as
   `STRUCTURED_POLICY` — used for cross-checking factual claims, never
   for copying form.

Send the composite prompt to Claude. Capture the output and write it to
`{policy-folder}/{slug}-narrative.md`.

### Manual invocation (no regenerator)

If a human asks Claude to produce a narrative version directly, do this:

1. Read `narrative-prompt.md`.
2. Read the target policy's `prompt.md` (and its `references/` if
   relevant).
3. Compose the prompt as above and follow the template's instructions to
   produce the narrative.
4. Write the result to `{policy-folder}/{slug}-narrative.md` and report
   the path back to the user.

## Timing (optional but recommended)

If the caller is the `regenerate-policies` scheduled task (or any other long-running orchestration that already uses the project's `timing` skill), the call into this skill should be wrapped with two `timing.py mark` calls so the narrative phase shows up in the per-run report:

```bash
python3 .skills/timing/scripts/timing.py mark "$RUN_ID" narrative_started --phase "$SLUG"
# ...invoke the model with narrative-prompt.md + the INPUTS block...
python3 .skills/timing/scripts/timing.py mark "$RUN_ID" narrative_generated --phase "$SLUG" --detail "output_chars={len}"
```

Use the same `$SLUG` as the structured generation so per-policy phase totals aggregate both artifacts together. For ad-hoc manual invocations (no regenerator), timing is unnecessary — skip it.

## Expected input

The skill assumes the policy folder has the standard shape used by every
other policy in this project:

- `prompt.md` — a regulator-readable summary that doubles as canonical
  input.
- `references/` — optional PDF/DOCX source material.
- The shared `meta-prompt.md` and `manifest.yaml` exist at the project
  root (the skill doesn't read them directly but expects the regenerator
  to manage them).

If `prompt.md` is missing or malformed, abort and report the failure
rather than fabricating content. The narrative must be grounded in the
source material; making things up defeats its purpose.

## Output shape

A single Markdown file written to `{policy-folder}/{slug}-narrative.md`,
with this stable structure:

1. YAML front-matter — mirrors the structured doc's front-matter, with
   the title suffixed " (Narrative)" and a `format: narrative` tag.
2. **Overview** — one paragraph stating the commitment, scope, and
   what's distinctive about this institution's risk profile.
3. **Regulatory Framework** — three to five flowing paragraphs on the
   statutes and regulations that apply, how they overlap, and where the
   policy concentrates its attention. Laws are named by their familiar
   act names ("Regulation B," "Fair Housing Act," "HMDA"); URLs and
   "12 CFR §…" references are deliberately absent.
4. **Controls** — one short narrative section per control. Heading is
   the control name in plain English; anchor is the slug of that name.
   Body is one to three paragraphs covering what we do, why, when, and
   who is accountable, in flowing prose without inline citations.
5. **Governance & Accountability** — a prose section on ownership,
   approvers, review cadence, and cross-references.
6. **Open Items** — a short prose closing section that lists any
   assumptions or dependencies on engineering / operations to confirm,
   mirroring (in prose) the structured doc's "Assumptions & Gaps."

No tables. No URLs or hyperlinks. No "12 CFR §…" or "§-clause"
references. Bullets only where prose cannot carry the load (and even
there, prefer prose). No control ID prefixes (FL-XX) in headings. No
inlined engineering vocabulary (event codes, field codes).

## Design notes

- **Engineering vocabulary is intentionally absent.** The structured doc
  is where event codes (`application.submitted`) and field codes
  (`applicant.race`) belong. The narrative paraphrases — "when an
  application is submitted," "applicant-provided race and ethnicity
  data." A regulator reads the narrative; an engineer reads the
  structured doc.
- **Citations and links are intentionally absent.** The structured doc
  carries the full eCFR / LII hyperlinks and §-clause specificity. The
  narrative refers to laws by act name only — "Regulation B," "the
  Fair Housing Act," "HMDA," "Regulation Z's loan-officer-compensation
  rules." This keeps the prose readable; the structured doc is where
  an examiner clicks through to the actual rule text.
- **Anchors enable cross-linking.** Each control heading carries a
  `{#slug}` anchor matching the slug of the control's plain-language
  name. The structured policy can reference the narrative via these
  anchors (e.g., `{slug}-narrative.md#pre-launch-partner-model-fair-lending-review`).
  Pick the slug once, keep it stable across regenerations.
- **Same facts, different form.** Discrepancies between the structured
  and narrative outputs are bugs. If the structured doc says "monthly
  for high-risk partners," the narrative says it too — just differently.
  When a structured-doc claim is itself an assumption, the narrative
  surfaces it in prose in the closing Open Items section.
- **No filtering of substance — but filtering of form.** Every control
  in the structured doc gets a section in the narrative. The form
  changes (prose, no tables); the substance does not.
- **Where the policy makes a deliberate judgment, name it.** Examples:
  Pynthia's choice of the 80% AIR rule as primary DI benchmark; the
  partner-tiered monitoring cadence; the second-look scope being broader
  than the traditional thin-file threshold. These are the parts of the
  policy that distinguish Pynthia's posture from a generic restatement
  of regulation, and they're what makes the narrative valuable to an
  examiner.
- **Length target: roughly a 10-minute read.** That's a soft cap — long
  enough to cover every control, short enough that an examiner reads
  every word. If the structured doc has twelve controls, the narrative
  has twelve short sections, not twelve essays.
