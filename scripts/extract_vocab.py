#!/usr/bin/env python3
"""Extract vocabulary tokens from generated policy/procedure documents.

Scans each policy folder for its generated output (`<slug>/<slug>.md` and
`<slug>/<slug>-narrative.md`), pulling every backticked dotted token like
`audit.committee_meeting_scheduled`. Prompts, NOTES.md, and references/ are
ignored — only generated artifacts count.

Output (extracted-vocab.json) is structured for later comparison against
core-vocabulary.json (the parsed OpenAPI spec):

{
  "meta":     { parsed_at, repo, parser_version },
  "stats":    { policies_scanned, files_scanned, unique_tokens, total_occurrences },
  "entities": { "<prefix>": { token_count, tokens: [...] }, ... },
  "tokens":   { "<entity.field>": { entity, field, count,
                                    policies: [...],
                                    occurrences: [{file, line}, ...] }, ... }
}

Usage:
    python3 scripts/extract_vocab.py [repo_root] [-o output.json]
"""

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

PARSER_VERSION = "0.1.0"

# Backticked dotted identifier: snake_case segments, entity prefix >= 2 chars.
TOKEN_RE = re.compile(r"`([a-z][a-z0-9_]+(?:\.[a-z][a-z0-9_]*)+)`")

# Dotted strings that are file names, not vocabulary.
EXT_BLOCKLIST = {
    "md", "json", "yaml", "yml", "txt", "csv", "py", "js", "ts",
    "docx", "doc", "pdf", "xlsx", "html", "sh",
}


def generated_files(root: Path):
    """Yield (slug, path) for each generated policy doc."""
    for folder in sorted(p for p in root.iterdir() if p.is_dir() and not p.name.startswith(".")):
        slug = folder.name
        for candidate in (folder / f"{slug}.md", folder / f"{slug}-narrative.md"):
            if candidate.is_file():
                yield slug, candidate


def extract(root: Path) -> dict:
    tokens: dict[str, dict] = {}
    policies, files_scanned, total = set(), 0, 0

    for slug, path in generated_files(root):
        files_scanned += 1
        policies.add(slug)
        rel = str(path.relative_to(root))
        for lineno, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            for match in TOKEN_RE.finditer(line):
                tok = match.group(1)
                if tok.rsplit(".", 1)[-1] in EXT_BLOCKLIST:
                    continue
                entity, field = tok.split(".", 1)
                rec = tokens.setdefault(tok, {
                    "entity": entity,
                    "field": field,
                    "count": 0,
                    "policies": set(),
                    "occurrences": [],
                })
                rec["count"] += 1
                rec["policies"].add(slug)
                rec["occurrences"].append({"file": rel, "line": lineno})
                total += 1

    entities: dict[str, dict] = {}
    for tok in sorted(tokens):
        tokens[tok]["policies"] = sorted(tokens[tok]["policies"])
        ent = tokens[tok]["entity"]
        entities.setdefault(ent, {"token_count": 0, "tokens": []})
        entities[ent]["token_count"] += 1
        entities[ent]["tokens"].append(tok)

    return {
        "meta": {
            "parser_version": PARSER_VERSION,
            "parsed_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "repo": root.name,
        },
        "stats": {
            "policies_scanned": len(policies),
            "files_scanned": files_scanned,
            "unique_tokens": len(tokens),
            "total_occurrences": total,
        },
        "entities": dict(sorted(entities.items())),
        "tokens": {t: tokens[t] for t in sorted(tokens)},
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("root", nargs="?", default=".", help="repo root (default: cwd)")
    ap.add_argument("-o", "--output", default="extracted-vocab.json")
    args = ap.parse_args()

    root = Path(args.root).resolve()
    if not root.is_dir():
        sys.exit(f"error: {root} is not a directory")

    result = extract(root)
    out = Path(args.output)
    if not out.is_absolute():
        out = root / out
    out.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")

    s = result["stats"]
    print(f"Scanned {s['files_scanned']} files across {s['policies_scanned']} policies")
    print(f"Found {s['unique_tokens']} unique tokens ({s['total_occurrences']} occurrences)")
    print(f"Entities: {len(result['entities'])}")
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
