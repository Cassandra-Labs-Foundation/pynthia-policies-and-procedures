#!/usr/bin/env python3
"""Single-pass pre-pass for one policy regeneration.

Does parse + directive + references + assembly in one Python call, writes a
composite prompt to disk, and returns a JSON summary on stdout.

See ../SKILL.md for the full contract.
"""

from __future__ import annotations

import argparse
import concurrent.futures as cf
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass, field
from pathlib import Path


# ---------- helpers -------------------------------------------------------

def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def best_effort_write(path: Path, data: str | bytes) -> None:
    """Write to path, swallowing OSError so cache writes never fail the run."""
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        if isinstance(data, bytes):
            path.write_bytes(data)
        else:
            path.write_text(data)
    except OSError as e:
        print(f"WARN: cache write failed at {path}: {e}", file=sys.stderr)


# ---------- prompt.md parsing ---------------------------------------------

@dataclass
class PolicyInputs:
    organization: str = ""
    policy_name: str = ""
    scope: str = ""
    owner_approvers: str = ""
    patrick_notes: str = ""
    authority_hints: str = "auto"
    design_notes: str = ""
    design_notes_source: str = ""
    local_overrides: str = ""


SECTION_PATTERNS: dict[str, list[str]] = {
    # Map of structured-input key → list of acceptable heading-matchers.
    # Order matters when there are aliases; first match wins.
    "organization_and_ownership": [r"^##\s+Organization\s+and\s+Ownership\s*$"],
    "purpose_and_scope":          [r"^##\s+1\.\s+Purpose\s+and\s+Scope\s*$"],
    "authority":                  [r"^##\s+2\.\s+Key\s+Regulatory\s+Authorities\s*$"],
    "must_cover":                 [r"^##\s+3\.\s+What\s+This\s+Policy\s+Must\s+Cover\s*$"],
    "out_of_scope":               [r"^##\s+4\.\s+Out\s+of\s+Scope\s*$"],
    "design_notes":               [r"^##\s+5\.\s+System\s+Design\s+Notes\s*$"],
    "local_overrides":            [r"^##\s+6\.\s+Local\s+Overrides.*$"],
}


def slice_sections(text: str) -> dict[str, str]:
    """Cut the doc into named sections keyed by SECTION_PATTERNS."""
    out: dict[str, str] = {}
    lines = text.splitlines(keepends=True)
    # Build a list of (index, key) for each matched heading.
    matches: list[tuple[int, str]] = []
    for i, line in enumerate(lines):
        if not line.startswith("## "):
            continue
        for key, patterns in SECTION_PATTERNS.items():
            if any(re.match(p, line.rstrip(), re.IGNORECASE) for p in patterns):
                matches.append((i, key))
                break
    # Slice between consecutive matches.
    for j, (start_idx, key) in enumerate(matches):
        end_idx = matches[j + 1][0] if j + 1 < len(matches) else len(lines)
        body = "".join(lines[start_idx + 1:end_idx]).strip()
        out[key] = body
    return out


def extract_h1_title(text: str) -> str:
    for line in text.splitlines():
        if line.startswith("# "):
            title = line[2:].strip()
            # Strip trailing " — Summary" if present.
            title = re.sub(r"\s*—\s*Summary\s*$", "", title)
            return title
    return ""


def parse_organization_and_ownership(body: str) -> tuple[str, str]:
    """Pull ORGANIZATION and OWNER & APPROVERS from the Organization section."""
    org = ""
    owner_approvers = ""
    org_m = re.search(r"\*\*Organization:\*\*\s*(.+)", body)
    if org_m:
        org = org_m.group(1).strip()
    # Collect owner and approvers lines.
    owner_m = re.search(r"\*\*Policy Owner:\*\*\s*(.+)", body)
    approver_block: list[str] = []
    if owner_m:
        approver_block.append(f"Owner: {owner_m.group(1).strip()}")
    approvers_m = re.search(r"\*\*Approvers:\*\*\s*\n((?:-\s+.+\n?)+)", body)
    if approvers_m:
        approver_block.append("Approvers:")
        for ln in approvers_m.group(1).strip().splitlines():
            approver_block.append("  " + ln.strip())
    owner_approvers = "\n".join(approver_block) if approver_block else body.strip()
    if not org:
        # Fall back to the whole section.
        org = body.strip().splitlines()[0] if body.strip() else "(unspecified)"
    return org, owner_approvers


def parse_authority_hints(body: str) -> str:
    body = body.strip()
    return "auto" if body.lower() in ("auto", "auto.") else body


def parse_prompt_md(text: str) -> tuple[PolicyInputs, list[str]]:
    """Return (inputs, missing_sections)."""
    sections = slice_sections(text)
    missing: list[str] = []
    required = ["organization_and_ownership", "purpose_and_scope", "must_cover", "design_notes"]
    for key in required:
        body = sections.get(key, "")
        if not body or re.search(r"\{\{[^}]+\}\}", body):
            missing.append(key)
    inputs = PolicyInputs()
    inputs.policy_name = extract_h1_title(text)
    org, oa = parse_organization_and_ownership(sections.get("organization_and_ownership", ""))
    inputs.organization = org
    inputs.owner_approvers = oa
    inputs.scope = sections.get("purpose_and_scope", "").strip()
    inputs.authority_hints = parse_authority_hints(sections.get("authority", "auto"))
    must_cover = sections.get("must_cover", "").strip()
    oos = sections.get("out_of_scope", "").strip()
    if oos:
        inputs.patrick_notes = must_cover + "\n\nOut of scope:\n" + oos
    else:
        inputs.patrick_notes = must_cover
    inputs.design_notes = sections.get("design_notes", "").strip()
    inputs.local_overrides = sections.get("local_overrides", "").strip()
    return inputs, missing


# ---------- DESIGN_NOTES directive ---------------------------------------

DIRECTIVE_MARKERS = [
    r"resolved\s+dynamically\s+at\s+regeneration\s+time",
    r"\*\*Directive\s+to\s+the\s+regenerator\.\*\*",
    r"\.skills/[\w\-/]+\.py",  # any reference to a skill script
]

DIRECTIVE_COMMAND_PATTERNS = [
    # Fenced code block containing a shell command that includes a .skills path.
    r"```(?:\w*\n)?(.*?\.skills/[^`\n]+?)\n?```",
    # Indented (2+ spaces or tab) line containing a python3 + .skills/ command.
    # Permissive on what comes between python3 and the script path (e.g.,
    # "python3 .skills/foo.py" or "python3 -u .skills/foo.py --flag").
    r"^[ \t]{2,}(python3\s+[^\n]*?\.skills/\S+\.py[^\n]*)$",
]


def detect_directive(design_notes_section: str) -> str | None:
    """Return the shell command if Section 5 is a directive; else None."""
    if not any(re.search(m, design_notes_section, re.IGNORECASE) for m in DIRECTIVE_MARKERS):
        return None
    for pat in DIRECTIVE_COMMAND_PATTERNS:
        m = re.search(pat, design_notes_section, re.DOTALL | re.MULTILINE)
        if m:
            cmd = m.group(1).strip()
            # If a fenced block had a leading language marker, strip it.
            cmd = cmd.lstrip("$ ").strip()
            return cmd
    return None


def resolve_directive(
    command: str,
    project_root: Path,
    cache_dir: Path,
    memo: dict[str, str],
) -> tuple[str, str]:
    """Return (stdout, source_label). Updates `memo` keyed by cache key."""
    # Cache key: sha256(command || script_bytes || vocabulary.json bytes)
    h = hashlib.sha256()
    h.update(command.encode())
    # If command references a script under .skills, include the script's bytes.
    script_m = re.search(r"(\.skills/[\w\-/]+\.py)", command)
    if script_m:
        script_path = project_root / script_m.group(1)
        if script_path.exists():
            h.update(script_path.read_bytes())
    vocab_path = project_root / "vocabulary.json"
    if vocab_path.exists():
        h.update(vocab_path.read_bytes())
    key = h.hexdigest()
    if key in memo:
        return memo[key], "dynamic via skill (cached)"
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache_path = cache_dir / f"{key}.txt"
    if cache_path.exists():
        out = cache_path.read_text()
        memo[key] = out
        return out, "dynamic via skill (cached)"
    # Cache miss — run it.
    try:
        result = subprocess.run(
            command, shell=True, cwd=str(project_root),
            capture_output=True, text=True, timeout=60,
        )
        if result.returncode != 0:
            first = (result.stderr or "").splitlines()
            reason = first[0] if first else f"exit {result.returncode}"
            return "", f"dynamic via skill (failed: {reason})"
        out = result.stdout
        if not out.strip():
            return "", "dynamic via skill (produced empty output)"
        best_effort_write(cache_path, out)
        memo[key] = out
        return out, "dynamic via skill (ok)"
    except subprocess.TimeoutExpired:
        return "", "dynamic via skill (failed: timeout)"
    except FileNotFoundError as e:
        return "", f"dynamic via skill (failed: {e})"


# ---------- references ----------------------------------------------------

# Source formats we convert to durable markdown the first time we see them.
# The converted markdown is written beside the source as "<original-name>.md"
# (e.g. "BSA Policy 2018.docx" -> "BSA Policy 2018.docx.md") and committed to
# the repo, so subsequent regenerations reuse it instead of re-converting.
CONVERTIBLE_EXTS = {".pdf", ".doc", ".docx", ".txt"}

# First line of a converted .md carries the source's content hash so we can
# detect when the source has changed and re-convert only then.
CONVERTED_HEADER_PREFIX = "<!-- policy-prep:converted"
CONVERTED_HEADER_HASH_RE = re.compile(r'source-sha256="([0-9a-f]{64})"')


@dataclass
class ReferenceResult:
    filename: str
    text: str = ""
    status: str = ""  # converted | reconverted | reused | orphan-md | skipped | failed
    error: str = ""


def extract_pdf(path: Path) -> str:
    result = subprocess.run(
        ["pdftotext", "-layout", str(path), "-"],
        capture_output=True, text=True, timeout=60,
    )
    if result.returncode != 0:
        raise RuntimeError(f"pdftotext failed: {result.stderr.strip()[:200]}")
    return result.stdout


def extract_docx(path: Path) -> str:
    import mammoth  # type: ignore
    with path.open("rb") as f:
        return mammoth.extract_raw_text(f).value


def convert_doc_to_docx(path: Path, cache_dir: Path) -> Path:
    """Return path to the cached .docx, converting via libreoffice if needed."""
    src_hash = sha256_file(path)
    cache_dir.mkdir(parents=True, exist_ok=True)
    cached = cache_dir / f"{src_hash}.docx"
    if cached.exists():
        return cached
    with tempfile.TemporaryDirectory() as tmp:
        result = subprocess.run(
            ["soffice", "--headless", "--convert-to", "docx", "--outdir", tmp, str(path)],
            capture_output=True, text=True, timeout=120,
        )
        if result.returncode != 0:
            raise RuntimeError(
                f"libreoffice failed: {result.stderr.strip()[:200] or result.stdout.strip()[:200]}"
            )
        produced = list(Path(tmp).glob("*.docx"))
        if not produced:
            raise RuntimeError("libreoffice produced no .docx")
        shutil.copy2(produced[0], cached)
        return cached


def source_to_markdown(path: Path, ext: str, converted_cache: Path) -> str:
    """Convert one source document to markdown text."""
    if ext == ".pdf":
        return extract_pdf(path)
    if ext == ".docx":
        return extract_docx(path)
    if ext == ".doc":
        return extract_docx(convert_doc_to_docx(path, converted_cache))
    if ext == ".txt":
        return path.read_text(errors="replace")
    raise RuntimeError(f"unsupported extension {ext}")


def make_converted_header(src_name: str, src_hash: str) -> str:
    return f'{CONVERTED_HEADER_PREFIX} source="{src_name}" source-sha256="{src_hash}" -->\n\n'


def converted_md_path(source: Path) -> Path:
    """Durable markdown sibling for a source file: '<name>.md' beside it."""
    return source.with_name(source.name + ".md")


def read_converted_hash(md_path: Path) -> str | None:
    """Return the source-sha256 recorded in a converted .md header, if any."""
    try:
        with md_path.open("r", errors="replace") as f:
            first = f.readline()
    except OSError:
        return None
    if first.startswith(CONVERTED_HEADER_PREFIX):
        m = CONVERTED_HEADER_HASH_RE.search(first)
        if m:
            return m.group(1)
    return None


def read_md_body(md_path: Path) -> str:
    """Read a .md reference, stripping our conversion header line if present."""
    text = md_path.read_text(errors="replace")
    lines = text.splitlines(keepends=True)
    if lines and lines[0].startswith(CONVERTED_HEADER_PREFIX):
        rest = lines[1:]
        if rest and rest[0].strip() == "":
            rest = rest[1:]
        return "".join(rest)
    return text


def extract_all_references(refs_dir: Path, cache_root: Path) -> tuple[str, dict]:
    """Resolve a policy's references to markdown text.

    Each source document (.pdf/.doc/.docx/.txt) is converted to markdown the
    first time it is seen and persisted beside it as "<name>.md" (committed to
    the repo). On later runs the persisted markdown is reused unless the source
    file's content hash has changed, in which case it is re-converted. Markdown
    files that are the persisted conversion of a present source are skipped
    (handled via their source); orphan markdown (source no longer present) and
    hand-authored markdown are used directly.
    """
    empty = {"total": 0, "extracted": 0, "cache_hits": 0, "converted": 0, "failed": [], "skipped": []}
    if not refs_dir.exists() or not refs_dir.is_dir():
        return "", empty
    files = sorted([p for p in refs_dir.iterdir() if p.is_file()])
    names = {p.name for p in files}
    converted_cache = cache_root / "converted"
    # Markdown siblings that are the persisted conversion of a present source.
    paired_md = {p.name + ".md" for p in files if p.suffix.lower() in CONVERTIBLE_EXTS} & names

    def handle(p: Path) -> ReferenceResult:
        out = ReferenceResult(filename=p.name)
        ext = p.suffix.lower()
        if p.name.startswith(".") or p.name == "README.md":
            out.status = "skipped"
            out.error = "skipped (dotfile / README)"
            return out
        if ext in CONVERTIBLE_EXTS:
            try:
                src_hash = sha256_file(p)
                md_path = converted_md_path(p)
                existed_before = md_path.exists()
                if existed_before and read_converted_hash(md_path) == src_hash:
                    out.text = read_md_body(md_path)
                    out.status = "reused"
                    return out
                md_text = source_to_markdown(p, ext, converted_cache)
                best_effort_write(
                    md_path, make_converted_header(p.name, src_hash) + md_text.strip() + "\n"
                )
                out.text = md_text
                out.status = "reconverted" if existed_before else "converted"
                return out
            except Exception as e:
                out.status = "failed"
                out.error = f"{type(e).__name__}: {str(e)[:200]}"
                return out
        if ext == ".md":
            if p.name in paired_md:
                # The persisted conversion of a source file in this same folder.
                # Represented by its source (counted there), so don't report it.
                out.status = "paired"
                return out
            out.text = read_md_body(p)
            out.status = "orphan-md"
            return out
        out.status = "skipped"
        out.error = f"skipped (unsupported: {ext or 'no extension'})"
        return out

    max_workers = max(1, min(8, len(files)))
    with cf.ThreadPoolExecutor(max_workers=max_workers) as ex:
        results = list(ex.map(handle, files))

    stats = {
        "total": len(files) - len(paired_md),  # sidecars counted via their source
        "extracted": 0,
        "cache_hits": 0,
        "converted": 0,
        "failed": [],
        "skipped": [],
    }
    blocks: list[str] = []
    for r in results:
        if r.status == "paired":
            continue
        if r.status == "skipped":
            stats["skipped"].append(r.filename)
            continue
        if r.status == "failed":
            stats["failed"].append({"file": r.filename, "reason": r.error})
            continue
        stats["extracted"] += 1
        if r.status in ("converted", "reconverted"):
            stats["converted"] += 1
        else:  # reused | orphan-md  -> no conversion work done
            stats["cache_hits"] += 1
        blocks.append(f"### Source: {r.filename}\n\n{r.text.strip()}\n")
    text = "\n---\n\n".join(blocks)
    return text, stats


# ---------- composite assembly --------------------------------------------

def assemble_composite_prompt(meta_prompt: str, inputs: PolicyInputs, reference_policy: str) -> str:
    """Compose the meta-prompt + INPUTS block + LOCAL_OVERRIDES."""
    block = (
        "INPUTS (provided by the caller):\n"
        f"- ORGANIZATION: {inputs.organization}\n"
        f"- POLICY_NAME: {inputs.policy_name}\n"
        f"- SCOPE: {inputs.scope}\n"
        f"- OWNER & APPROVERS: {inputs.owner_approvers}\n"
        f'- PATRICK_NOTES: """{inputs.patrick_notes}"""\n'
        f'- REFERENCE_POLICY: """{reference_policy}"""\n'
        f"- AUTHORITY_HINTS: {inputs.authority_hints}\n"
        f'- DESIGN_NOTES: """{inputs.design_notes}"""\n'
    )
    parts = [meta_prompt.rstrip(), "", block]
    if inputs.local_overrides:
        parts += ["", "LOCAL OVERRIDES (apply after all meta-prompt rules):", inputs.local_overrides]
    return "\n".join(parts) + "\n"


# ---------- main ---------------------------------------------------------

def fail(message: str, code: int = 1) -> int:
    print(json.dumps({"error": message}), file=sys.stderr)
    return code


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument("slug")
    p.add_argument("--project-root", type=Path, default=None)
    p.add_argument("--meta-prompt", type=Path, default=None)
    args = p.parse_args()

    timings: dict[str, float] = {}
    t_total_start = time.perf_counter()

    project_root = (args.project_root or Path.cwd()).resolve()
    if not project_root.exists():
        return fail(f"project root not found: {project_root}")

    meta_prompt_path = (args.meta_prompt or (project_root / "meta-prompt.md")).resolve()
    if not meta_prompt_path.exists():
        return fail(f"meta-prompt.md not found at {meta_prompt_path}")

    policy_folder = project_root / args.slug
    prompt_path = policy_folder / "prompt.md"
    if not prompt_path.exists():
        return fail(f"prompt.md not found at {prompt_path}")

    refs_dir = policy_folder / "references"
    cache_root = project_root / ".cache"

    # Step 1: parse prompt.md
    t = time.perf_counter()
    prompt_text = prompt_path.read_text()
    inputs, missing = parse_prompt_md(prompt_text)
    timings["parse_prompt_md"] = round(time.perf_counter() - t, 3)
    if missing:
        return fail(f"prompt.md sections missing or placeholder: {missing}")

    # Step 2: resolve directive (if Section 5 is one)
    t = time.perf_counter()
    directive_memo: dict[str, str] = {}
    directive_cmd = detect_directive(inputs.design_notes)
    if directive_cmd:
        resolved, source = resolve_directive(
            directive_cmd, project_root, cache_root / "directives", directive_memo,
        )
        inputs.design_notes = resolved  # replace literal directive text with output
        inputs.design_notes_source = source
    else:
        inputs.design_notes_source = "literal Section 5"
    timings["resolve_directive"] = round(time.perf_counter() - t, 3)

    # Step 3: extract references
    t = time.perf_counter()
    reference_policy, ref_stats = extract_all_references(refs_dir, cache_root)
    timings["extract_references"] = round(time.perf_counter() - t, 3)

    # Step 4: assemble composite
    t = time.perf_counter()
    meta_prompt_text = meta_prompt_path.read_text()
    composite = assemble_composite_prompt(meta_prompt_text, inputs, reference_policy)
    out_dir = cache_root / "prep"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{args.slug}.composite-prompt.txt"
    out_path.write_text(composite)
    timings["assemble_composite"] = round(time.perf_counter() - t, 3)

    timings["total"] = round(time.perf_counter() - t_total_start, 3)

    summary = {
        "slug": args.slug,
        "composite_prompt_path": str(out_path.relative_to(project_root)),
        "composite_prompt_chars": len(composite),
        "policy_name": inputs.policy_name,
        "design_notes_source": inputs.design_notes_source,
        "references": ref_stats,
        "timing": timings,
    }
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
