#!/usr/bin/env python3
"""Regenerate ONE policy via the raw Anthropic API (no Claude Code agent loop).

Why raw API: policy-prep already assembles a self-contained composite prompt,
so generation is a pure completion, not an agent task. Calling the API directly
is faster (no CLI/agent-loop overhead), cheaper (prompt caching on the shared
meta-prompt), and deterministic.

Document-reading optimization is preserved by REUSING policy-prep's functions
in-process — the same durable, content-hashed reference conversions and parallel
extraction the scheduled task uses. We do not re-implement any of it here.

Per slug this script:
  1. Parses prompt.md, resolves the Section-5 directive, extracts references
     (all via policy-prep) -> structured `inputs` + `reference_policy`.
  2. Structured policy:  system = meta-prompt.md (cached) ; user = INPUTS block.
     -> writes {slug}/{slug}.md
  3. Stamps this policy's row in STATUS.md (its row only — never the shared
     header — so parallel per-policy PRs don't collide).

Usage:
  ANTHROPIC_API_KEY=... python3 scripts/regenerate_policy.py <slug> \
      [--model claude-sonnet-4-6] [--max-tokens 32000] [--project-root DIR]
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from pathlib import Path

import anthropic

# Reuse policy-prep verbatim — this is the document-reading optimization.
PREP_DIR = Path(__file__).resolve().parent.parent / ".skills" / "policy-prep" / "scripts"
sys.path.insert(0, str(PREP_DIR))
import prepare_policy as pp  # noqa: E402  (path injected above)


def log(msg: str) -> None:
    print(msg, file=sys.stderr, flush=True)


def generate(client: anthropic.Anthropic, *, model: str, max_tokens: int,
             temperature: float, system_text: str, user_text: str) -> str:
    """One cached completion. system_text is the stable, cache-marked prefix."""
    out: list[str] = []
    with client.messages.stream(
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
        system=[{
            "type": "text",
            "text": system_text,
            "cache_control": {"type": "ephemeral"},  # shared across policies -> cache hit
        }],
        messages=[{"role": "user", "content": user_text}],
    ) as stream:
        for chunk in stream.text_stream:
            out.append(chunk)
        final = stream.get_final_message()
    u = final.usage
    log(f"    usage: in={u.input_tokens} out={u.output_tokens} "
        f"cache_write={getattr(u, 'cache_creation_input_tokens', 0)} "
        f"cache_read={getattr(u, 'cache_read_input_tokens', 0)}")
    if final.stop_reason == "max_tokens":
        raise RuntimeError(
            f"output hit max_tokens ({max_tokens}) — policy was truncated. "
            f"Raise --max-tokens and re-run.")
    return "".join(out)


def inputs_block(meta_prompt: str, inputs, reference_policy: str) -> str:
    """The INPUTS block exactly as policy-prep emits it (no drift): take the
    assembled composite and strip the meta-prompt prefix back off."""
    composite = pp.assemble_composite_prompt(meta_prompt, inputs, reference_policy)
    tail = composite[len(meta_prompt.rstrip()):]
    return tail.lstrip("\n")


def stamp_status(status_path: Path, *, policy_name: str, slug: str,
                 design_notes_source: str, skipped: str, ts: str) -> None:
    """Update ONLY this slug's row in STATUS.md (insert if missing). The shared
    header / 'Last run' lines are deliberately left untouched so concurrent
    per-policy PRs never conflict on them."""
    row = (f"| {policy_name or slug} | {slug} | ✅ regenerated | {ts} | "
           f"{design_notes_source} | {skipped or '—'} | — |")
    if not status_path.exists():
        log(f"    STATUS.md absent at {status_path}; skipping stamp.")
        return
    lines = status_path.read_text().splitlines()
    needle = f"| {slug} |"
    for i, line in enumerate(lines):
        if needle in line and not line.lstrip().startswith("| Policy "):
            lines[i] = row
            break
    else:
        # No existing row: append after the last table row, else at EOF.
        insert_at = len(lines)
        for i, line in enumerate(lines):
            if line.lstrip().startswith("|"):
                insert_at = i + 1
        lines.insert(insert_at, row)
    status_path.write_text("\n".join(lines) + "\n")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("slug")
    ap.add_argument("--model", default="claude-sonnet-4-6")
    ap.add_argument("--max-tokens", type=int, default=32000)
    ap.add_argument("--temperature", type=float, default=0.0)
    ap.add_argument("--project-root", type=Path, default=None)
    args = ap.parse_args()

    root = (args.project_root or Path.cwd()).resolve()
    slug = args.slug
    folder = root / slug
    prompt_path = folder / "prompt.md"
    meta_path = root / "meta-prompt.md"

    for p in (prompt_path, meta_path):
        if not p.exists():
            log(f"FATAL: missing {p}")
            return 1

    # --- 1. Prep (reuse policy-prep: optimized, cached document reading) -------
    log(f"[{slug}] parsing prompt.md + extracting references (policy-prep)…")
    prompt_text = prompt_path.read_text()
    inputs, missing = pp.parse_prompt_md(prompt_text)
    if missing:
        log(f"FATAL: prompt.md sections missing/placeholder: {missing}")
        return 1

    cache_root = root / ".cache"
    directive_cmd = pp.detect_directive(inputs.design_notes)
    if directive_cmd:
        resolved, source = pp.resolve_directive(
            directive_cmd, root, cache_root / "directives", {})
        inputs.design_notes = resolved
        inputs.design_notes_source = source
    else:
        inputs.design_notes_source = "literal Section 5"

    reference_policy, ref_stats = pp.extract_all_references(folder / "references", cache_root)
    log(f"[{slug}] references: extracted={ref_stats['extracted']} "
        f"cache_hits={ref_stats['cache_hits']} converted={ref_stats['converted']} "
        f"failed={len(ref_stats['failed'])} skipped={len(ref_stats['skipped'])}")

    meta_prompt = meta_path.read_text()

    client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY

    # --- 2. Structured policy --------------------------------------------------
    log(f"[{slug}] generating structured policy ({args.model})…")
    structured = generate(
        client, model=args.model, max_tokens=args.max_tokens,
        temperature=args.temperature,
        system_text=meta_prompt,                      # cached, shared across policies
        user_text=inputs_block(meta_prompt, inputs, reference_policy),
    )
    (folder / f"{slug}.md").write_text(structured.rstrip() + "\n")
    log(f"[{slug}] wrote {slug}/{slug}.md ({len(structured)} chars)")

    # --- 3. STATUS.md (this row only) -----------------------------------------
    skipped_parts = ref_stats["skipped"] + [f["file"] for f in ref_stats["failed"]]
    ts = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    stamp_status(
        root / "STATUS.md", policy_name=inputs.policy_name, slug=slug,
        design_notes_source=inputs.design_notes_source,
        skipped=", ".join(skipped_parts), ts=ts)
    log(f"[{slug}] done.")

    print(json.dumps({
        "slug": slug,
        "policy_name": inputs.policy_name,
        "structured_chars": len(structured),
        "design_notes_source": inputs.design_notes_source,
        "references": ref_stats,
    }))
    return 0


if __name__ == "__main__":
    sys.exit(main())
