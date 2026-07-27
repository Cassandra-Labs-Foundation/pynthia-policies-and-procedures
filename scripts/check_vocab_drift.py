#!/usr/bin/env python3
"""Fail the build when the core API stops backing a code a policy depends on.

The compliance system's load-bearing assumption is that every backticked
`entity.field` / `entity.event` in a policy resolves to something the core
actually implements. `core-vocabulary.json` is the registry of what it
implements, rebuilt from core-api.yaml on every push. When engineering
renames or drops a term, the policy that cites it silently starts pointing at
nothing — the obligation is still written down, and nothing enforces it.

This is the gate for that. It is deliberately NOT check_vocab_refs.py --strict:

  check_vocab_refs --strict fails when the policy's "Engineering vocabulary is
  provisional" bullet disagrees with reality in EITHER direction. Across the 25
  enabled policies that is 474 over-listings versus 59 omissions. An over-listing
  is a code the bullet names that the spec DOES register — meta-prompt.md forbids
  those (the bullet names only what is missing), but 21 of 25 policies enumerate
  their confirmed codes anyway; third-party-risk lists 81 in one sentence. Wiring
  --strict as-is pins the build red on 474 findings that no core change can fix,
  which trains everyone to ignore it.

So this checks OMISSIONS ONLY, and ratchets rather than demanding zero:

  regression  a policy cites a code that resolves nowhere AND was not already
              doing so at the baseline  ->  exit 1
  improvement fewer omissions than baseline  ->  pass, and say so; run --update
              to bank the win so it cannot silently regress later

Over-listings are reported but never fail: no control is broken by one, and only
a regeneration can clear it. They heal as each policy regenerates for its own
reasons, against the tightened meta-prompt rule.

  python3 scripts/check_vocab_drift.py           # report
  python3 scripts/check_vocab_drift.py --check   # exit 1 on regression (CI)
  python3 scripts/check_vocab_drift.py --update  # rewrite the baseline

Scope is the enabled policies in compliance/policies/manifest.yaml, matching the
gate regenerate-policy.yml already applies. manifest.yaml is parsed by regex,
not pyyaml: core-ci.yml has no setup-python step and installs nothing, and this
must run there.
"""
import argparse
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import check_vocab_refs as cvr  # noqa: E402  (path set above)

ROOT = pathlib.Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "compliance" / "policies" / "manifest.yaml"
VOCAB = ROOT / "core-vocabulary.json"
BASELINE = ROOT / "vocab-drift-baseline.json"

# - folder: bsa      /      enabled: true
FOLDER_RE = re.compile(r"^\s*-\s*folder:\s*(\S+)", re.M)
ENTRY_RE = re.compile(
    r"^\s*-\s*folder:\s*(?P<folder>\S+)\s*$"
    r"(?P<body>(?:\n(?!\s*-\s*folder:).*)*)",
    re.M,
)


def enabled_policies() -> list[tuple[str, pathlib.Path]]:
    """(slug, path to {slug}.md) for every manifest entry with enabled: true."""
    text = MANIFEST.read_text()
    out = []
    for m in ENTRY_RE.finditer(text):
        folder = m.group("folder")
        body = m.group("body")
        if not re.search(r"^\s*enabled:\s*true\s*$", body, re.M):
            continue
        slug_m = re.search(r"^\s*slug:\s*(\S+)", body, re.M)
        slug = slug_m.group(1) if slug_m else folder
        path = MANIFEST.parent / folder / f"{slug}.md"
        if path.exists():
            out.append((slug, path))
    return sorted(out)


def omissions_for(path: pathlib.Path, vocab: dict) -> tuple[list[str], list[str]]:
    """(omissions, false_alarms) for one policy — same math as check_vocab_refs."""
    text = path.read_text()
    codes = {c for c in cvr.TOKEN_RE.findall(text) if not cvr.is_filename(c)}
    result = cvr.classify(codes, vocab)
    bullet = {cvr.norm(c) for c in cvr.extract_bullet_codes(text)}
    unregistered = {cvr.norm(c) for c in result["missing"] + result["provisional"]}
    return sorted(unregistered - bullet), sorted(bullet - unregistered)


def scan() -> dict:
    vocab = json.loads(VOCAB.read_text())
    return {
        slug: {"omissions": om, "false_alarms": len(fa)}
        for slug, path in enabled_policies()
        for om, fa in [omissions_for(path, vocab)]
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--check", action="store_true", help="exit 1 on regression")
    ap.add_argument("--update", action="store_true", help="rewrite the baseline")
    args = ap.parse_args()

    current = scan()

    if args.update or not BASELINE.exists():
        BASELINE.write_text(json.dumps({
            "note": "Per-policy codes that resolve nowhere in core-vocabulary.json. "
                    "The gate fails when a policy gains a code not listed here. "
                    "Shrink it; never grow it by hand.",
            "generated_from": "check_vocab_drift.py --update",
            "total": sum(len(v["omissions"]) for v in current.values()),
            "policies": {k: v["omissions"] for k, v in sorted(current.items())},
        }, indent=1) + "\n")
        print(f"baseline written — {sum(len(v['omissions']) for v in current.values())} "
              f"omissions across {len(current)} policies")
        return 0

    base = json.loads(BASELINE.read_text())["policies"]
    regressions: dict[str, list[str]] = {}
    improvements: dict[str, int] = {}
    for slug, data in sorted(current.items()):
        known = set(base.get(slug, []))
        now = set(data["omissions"])
        if new := sorted(now - known):
            regressions[slug] = new
        if fixed := len(known - now):
            improvements[slug] = fixed

    total_now = sum(len(v["omissions"]) for v in current.values())
    total_fa = sum(v["false_alarms"] for v in current.values())
    print(f"{len(current)} enabled policies — {total_now} omissions "
          f"(baseline {sum(len(v) for v in base.values())})")
    # Not drift, and not "prose lagging reality": these are codes the bullet
    # names that the spec DOES register. meta-prompt.md's ASSUMPTIONS & GAPS
    # rule says the bullet names only what is missing — third-party-risk lists
    # 81 under "drawn from the registered vocabulary and confirmed". Prompt
    # non-compliance, clearable only by regeneration. Reported, never failed.
    print(f"  {total_fa} codes over-listed in a bullet that should name only "
          f"missing ones — regeneration debt, not drift")

    for slug, fixed in improvements.items():
        print(f"  improved  {slug}: {fixed} fewer")
    if improvements and not regressions:
        print("\nRun scripts/check_vocab_drift.py --update to bank the improvement.")

    if regressions:
        print("\nVOCABULARY DRIFT — these policies cite codes the core no longer backs:")
        for slug, codes in regressions.items():
            print(f"  {slug}")
            for c in codes:
                print(f"    - {c}")
        print("\nThe policy states an obligation the spec stopped supporting. Either\n"
              "restore the term in core-api.yaml, map it in vocab-migration.json, or\n"
              "regenerate the policy so its prose matches what the core implements.")
        return 1 if args.check else 0

    print("no drift")
    return 0


if __name__ == "__main__":
    sys.exit(main())
