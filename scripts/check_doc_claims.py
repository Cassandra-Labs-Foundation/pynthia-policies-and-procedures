#!/usr/bin/env python3
"""Gate: hand-written docs may not lie about paths or numbers.

Prose has no consumer, so it drifts wherever nothing goes red — the July 2026
lesson, applied to documentation. This checker walks the hand-maintained docs
and fails when:

  1. a path they reference does not exist (the demo runbook shipped three
     broken commands for weeks because nothing checked them), or
  2. a drift-prone number they embed disagrees with the generated artifacts
     (verifier target counts survived two READMEs at 529 long after the truth
     was 767). Numbers come from scripts/gen_state.py's state() — the same
     values STATE.md prints — so the page and the gate cannot disagree.

Docs NOT checked: docs/history/ (frozen snapshots, banner-stamped),
generated markdown (CROSSWALK.md, STATE.md), machine-written files
(STATUS.md), the GitBook TOC (SUMMARY.md), and policy markdown (its own
pipeline gates it).

Run via scripts/rebuild_artifacts.sh, after gen_state.py.
"""

import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from gen_state import state  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent

CHECKED_DOCS = [
    "README.md",
    "CLAUDE.md",
    "docs/README.md",
    "docs/demo-runbook.md",
    "docs/drill.md",
    "core/README.md",
    "ui/README.md",
    "ui/product-research.md",
    "analytics/README.md",
]

# Directories a doc-relative or repo-relative path may resolve against.
# core/supabase/functions/ covers the convention of writing handler paths
# as `api/foo.ts` (the deployment's own root).
RESOLUTION_ROOTS = [
    ROOT,
    ROOT / "core",
    ROOT / "core" / "supabase",
    ROOT / "core" / "supabase" / "functions",
]

PATHISH = re.compile(r"^\.?/?[A-Za-z0-9_.\-\[\]]+(/[A-Za-z0-9_.\-\[\]]+)+/?$")
BANNED_CHARS = set("*{}$<>|()@")


def is_path_candidate(token):
    token = token.strip().rstrip(".,;:")
    if not token or " " in token:
        return None
    if token.startswith(("http://", "https://")):
        return None
    if BANNED_CHARS & set(token):
        return None
    if "/" not in token:
        return None
    if not PATHISH.match(token):
        return None
    if token.startswith("./"):
        token = token[2:]
    return token.rstrip("/")


def path_exists(rel, doc_dir):
    """True if the path resolves — or if its FIRST segment resolves nowhere,
    meaning the token is not a repo path at all (an external repo like
    `cassandra-core/archive/`, an OpenAPI pointer like `components/schemas`)
    rather than a misspelled one. Real references start from a segment that
    exists (scripts/, core/, .github/, api/ under the functions root, …), so
    a resolvable first segment with an unresolvable remainder is the lie
    this gate exists to catch."""
    first = rel.split("/", 1)[0]
    roots = [doc_dir] + RESOLUTION_ROOTS
    if not any((base / first).exists() for base in roots):
        return True
    return any((base / rel).exists() for base in roots)


def check_paths(doc, text, errors):
    doc_dir = (ROOT / doc).parent
    fence_lang = None
    for i, line in enumerate(text.splitlines(), 1):
        stripped = line.strip()
        if stripped.startswith("```"):
            fence_lang = None if fence_lang is not None else stripped[3:].strip()
            continue
        tokens = []
        if fence_lang is None:
            tokens = re.findall(r"`([^`]+)`", line)          # prose: backtick spans
            tokens += re.findall(r"\]\(([^)#]+)(?:#[^)]*)?\)", line)  # md links
        elif fence_lang in ("bash", "sh"):
            tokens = stripped.split()                        # commands: every token
        for tok in tokens:
            rel = is_path_candidate(tok)
            if rel and not path_exists(rel, doc_dir):
                errors.append(f"{doc}:{i}: path does not exist: `{tok}`")


def approx(claimed, actual, pct=3):
    return abs(claimed - actual) <= max(1, actual * pct / 100)


def demo_section_number():
    harness = ROOT / "core" / "supabase" / "tests" / "e2e" / "compliance_e2e.sh"
    m = re.search(r"--\s*(\d+)\.\s.*demo\.sh", harness.read_text())
    return int(m.group(1)) if m else None


def check_numbers(doc, text, errors, s):
    k = s["targets_by_kind"]
    non_control = s["targets_total"] - k.get("control", 0)
    control_set = {
        s["controls_total"], s["controls_in_scope"], s["controls_scoped_out"],
        s["hermetic_green"], s["hermetic_red"], s["live_green"], s["live_red"],
    }
    # pattern -> (allowed set | ("approx", actual), label)
    registry = [
        (r"(\d+)\s+migrations?\b", {s["migrations"]}, "migrations"),
        (r"(\d+)\s+API modules\b", {s["api_modules"]}, "API modules"),
        (r"(\d+)\s+routes\b", {s["routes"]}, "routes"),
        (r"~?(\d+)\s+(?:live\s+)?assertions\b", ("approx", s["e2e_assertions"]), "e2e assertions"),
        (r"(\d+)\s+(?:test\s+)?targets\b", {s["targets_total"], non_control}, "verifier targets"),
        (r"(\d+)\s+contract\b", {k.get("contract", 0)}, "contract targets"),
        (r"(\d+)\s+property\b", {k.get("property", 0)}, "property targets"),
        (r"(\d+)\s+state[- ]machine\b", {k.get("state_machine", 0)}, "state-machine targets"),
        (r"(\d+)\s+controls?\b", control_set, "controls"),
        (r"(\d+)\s+polic(?:y|ies)\b", {s["policies"], s["policy_prompts"], s["policies"] + 1},
         "policies"),
        (r"(\d+)\s+decisions\b", {s["decisions"]}, "decisions"),
        (r"D1[–-]D(\d+)\b", {s["decisions"]}, "decision range"),
        (r"Section (\d+) runs", {demo_section_number()}, "demo.sh section"),
    ]
    for i, line in enumerate(text.splitlines(), 1):
        for pattern, allowed, label in registry:
            for m in re.finditer(pattern, line):
                claimed = int(m.group(1))
                if isinstance(allowed, tuple):
                    ok = approx(claimed, allowed[1])
                    want = f"~{allowed[1]}"
                else:
                    ok = claimed in allowed
                    want = " or ".join(str(v) for v in sorted(allowed, key=str))
                if not ok:
                    errors.append(
                        f"{doc}:{i}: {label} claim says {claimed}, artifacts say {want}"
                    )
    # citation counts ("N times across M files") are checked against the
    # instrument of record, check_decision_refs.py
    cite = re.search(r"(\d+)\s+times across\s+(\d+)\s+files", text)
    if cite:
        import subprocess
        out = subprocess.run(
            [sys.executable, str(ROOT / "scripts" / "check_decision_refs.py")],
            capture_output=True, text=True, check=False,
        ).stdout
        m = re.search(r"citations\s*:\s*(\d+) across (\d+) files", out)
        if m and (cite.group(1), cite.group(2)) != (m.group(1), m.group(2)):
            errors.append(
                f"{doc}: citation claim says {cite.group(1)}/{cite.group(2)} files, "
                f"check_decision_refs.py says {m.group(1)}/{m.group(2)}"
            )


def main():
    s = state()
    errors = []
    for doc in CHECKED_DOCS:
        path = ROOT / doc
        if not path.exists():
            errors.append(f"{doc}: checked doc is missing")
            continue
        text = path.read_text()
        check_paths(doc, text, errors)
        check_numbers(doc, text, errors, s)
    if errors:
        print(f"DOC CLAIMS: {len(errors)} stale claim(s) — fix the doc (or the code):")
        for e in errors:
            print(f"  {e}")
        sys.exit(1)
    print(f"doc claims OK — {len(CHECKED_DOCS)} docs, paths + numbers agree with artifacts")


if __name__ == "__main__":
    main()
