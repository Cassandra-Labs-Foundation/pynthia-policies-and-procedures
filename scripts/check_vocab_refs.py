#!/usr/bin/env python3
"""Mechanically validate vocabulary references in a generated policy.

Extracts every backticked dotted code (e.g. `application.reason_codes[]`)
from a policy Markdown file and classifies each against vocabulary.json:

  field        registered in `fields` (by path)
  event        registered in `events` (by name)
  task/timer   registered in `tasks` (by name)
  provisional  known to the migration map but not registered in the spec
  missing      not registered anywhere

Exit code 0 always (this is a reporting tool); use --strict to exit 1
when the policy's "Engineering vocabulary is provisional" bullet lists a
code that is actually registered (a false alarm) or omits a code that is
actually missing.

The intended consumer is the regenerate-policies validation step: the
subagent runs this against its draft and rewrites the provisional-
vocabulary bullet from the `missing` + `provisional` lists, instead of
eyeballing a 4,000-line DESIGN_NOTES dump.

Usage:
    python3 scripts/check_vocab_refs.py <policy.md> [-v vocabulary.json]
        [--json] [--strict]
"""

import argparse
import json
import re
import sys
from pathlib import Path

# Backticked dotted identifier: snake_case segments, optional [] suffix.
TOKEN_RE = re.compile(r"`([a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+(?:\[\])?)`")

# Dotted strings that are file names, not vocabulary.
EXT_BLOCKLIST = {
    "md", "json", "yaml", "yml", "txt", "csv", "py", "js", "ts",
    "docx", "doc", "pdf", "xlsx", "html", "sh",
}


def norm(code: str) -> str:
    return code.rstrip("[]").removesuffix("[]") if code.endswith("[]") else code


def is_filename(code: str) -> bool:
    return code.rsplit(".", 1)[-1] in EXT_BLOCKLIST


def classify(codes, vocab):
    fields = {f["path"] for f in vocab.get("fields", [])}
    events = {e.get("name") or e.get("code") for e in vocab.get("events", [])}
    tasks = {t["name"] for t in vocab.get("tasks", [])}
    provisional = set(vocab.get("provisional_fields", []))

    out = {"field": [], "event": [], "task": [], "provisional": [], "missing": []}
    for code in sorted(codes):
        base = norm(code)
        if base in fields:
            out["field"].append(code)
        elif base in events:
            out["event"].append(code)
        elif base in tasks:
            out["task"].append(code)
        elif base in provisional:
            out["provisional"].append(code)
        else:
            out["missing"].append(code)
    return out


def match_verb(tail, verbs):
    return next((v for v in sorted(verbs, key=len, reverse=True)
                 if tail == v or tail.endswith("_" + v)), None)


def match_task_type(tail, ttypes):
    return next((t for t in sorted(ttypes, key=len, reverse=True)
                 if t in tail.split("_") or tail == t), None)


def analyze_missing(missing, vocab):
    """Conformance + near-miss analysis for unregistered codes.

    Returns per-code diagnostics:
      near_misses    same field tail registered under another entity —
                     the policy should almost certainly REUSE one of these
      conforming     composes as registered subject + registered verb /
                     task type — ready-to-paste migration entry suggested
      nonconforming  violates the composition grammar (unregistered verb,
                     new subject, or plain data field) — must be renamed,
                     mapped, or flagged as a gap
    """
    verbs = set(vocab.get("event_types", []))
    ttypes = set(vocab.get("task_types", []))
    subjects = set(vocab.get("subjects", []))
    by_tail = {}
    for f in vocab.get("fields", []):
        path = f["path"]
        if "." in path:
            by_tail.setdefault(path.split(".", 1)[1], []).append(path)
    prov_by_tail = {}
    for p in vocab.get("provisional_fields", []):
        if "." in p:
            prov_by_tail.setdefault(p.split(".", 1)[1], []).append(p)

    near_misses, conforming, nonconforming = {}, {}, {}
    for code in missing:
        base = norm(code)
        prefix, _, tail = base.partition(".")
        alts = by_tail.get(tail, []) + [f"{p} (provisional)" for p in prov_by_tail.get(tail, [])]
        if alts:
            near_misses[code] = sorted(alts)[:5]
            continue
        verb = match_verb(tail, verbs)
        ttype = match_task_type(tail, ttypes)
        subj_ok = prefix in subjects
        if verb and subj_ok:
            conforming[code] = {
                "as": "event", "type": verb, "subject": prefix,
                "migration_entry": {base: {"as": "event", "type": verb, "subject": prefix}},
            }
        elif ttype and subj_ok:
            conforming[code] = {
                "as": "task", "type": ttype, "subject": prefix,
                "migration_entry": {base: {"as": "task", "type": ttype, "subject": prefix}},
            }
        else:
            reasons = []
            if not subj_ok:
                reasons.append(f"unregistered subject {prefix!r}")
            if not verb and not ttype:
                reasons.append("no registered verb or task type in tail")
            nonconforming[code] = "; ".join(reasons) or "plain data field — needs spec mapping or gap flag"
    return near_misses, conforming, nonconforming


def extract_bullet_codes(text):
    """Codes listed in the 'Engineering vocabulary is provisional' bullet."""
    m = re.search(
        r"\*\*Engineering vocabulary is provisional[^*]*\*\*.*?(?=\n- \*\*|\n## |\Z)",
        text,
        re.S,
    )
    if not m:
        return set()
    return {c for c in TOKEN_RE.findall(m.group(0)) if not is_filename(c)}


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    root = Path(__file__).resolve().parent.parent
    ap.add_argument("policy", help="Path to generated policy .md")
    ap.add_argument("-v", "--vocab", default=str(root / "vocabulary.json"))
    ap.add_argument("--json", action="store_true", help="JSON output only")
    ap.add_argument("--strict", action="store_true",
                    help="exit 1 if the provisional bullet disagrees with reality")
    args = ap.parse_args()

    text = Path(args.policy).read_text()
    vocab = json.loads(Path(args.vocab).read_text())

    codes = {c for c in TOKEN_RE.findall(text) if not is_filename(c)}
    result = classify(codes, vocab)

    bullet = extract_bullet_codes(text)
    truly_unregistered = {norm(c) for c in result["missing"] + result["provisional"]}
    bullet_norm = {norm(c) for c in bullet}
    false_alarms = sorted(bullet_norm - truly_unregistered)
    omissions = sorted(truly_unregistered - bullet_norm)

    near_misses, conforming, nonconforming = analyze_missing(result["missing"], vocab)

    report = {
        "policy": args.policy,
        "total_codes": len(codes),
        "registered": {k: len(result[k]) for k in ("field", "event", "task")},
        "provisional": result["provisional"],
        "missing": result["missing"],
        "missing_analysis": {
            "near_misses": near_misses,
            "conforming": conforming,
            "nonconforming": nonconforming,
        },
        "bullet": {
            "codes_listed": len(bullet),
            "false_alarms": false_alarms,
            "omissions": omissions,
        },
    }

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        r = report
        print(f"{r['policy']}: {r['total_codes']} unique codes")
        print(f"  registered: {r['registered']['field']} fields, "
              f"{r['registered']['event']} events, {r['registered']['task']} tasks/timers")
        print(f"  provisional (migration-known, spec-unregistered): {len(result['provisional'])}")
        for c in result["provisional"]:
            print(f"    - {c}")
        print(f"  missing (unknown everywhere): {len(result['missing'])}")
        if near_misses:
            print(f"    NEAR-MISSES (reuse the registered code instead): {len(near_misses)}")
            for c, alts in near_misses.items():
                print(f"      - {c}  →  {', '.join(alts)}")
        if conforming:
            print(f"    CONFORMING (grammar-valid; paste into vocab-migration.json): {len(conforming)}")
            for c, info in conforming.items():
                print(f"      - {c}  →  {json.dumps(info['migration_entry'])}")
        if nonconforming:
            print(f"    NONCONFORMING (rename, map, or flag as gap): {len(nonconforming)}")
            for c, why in nonconforming.items():
                print(f"      - {c}  ({why})")
        if false_alarms:
            print(f"  bullet FALSE ALARMS (listed as missing but registered): {len(false_alarms)}")
            for c in false_alarms:
                print(f"    - {c}")
        if omissions:
            print(f"  bullet OMISSIONS (unregistered but not listed): {len(omissions)}")
            for c in omissions:
                print(f"    - {c}")

    if args.strict and (false_alarms or omissions):
        sys.exit(1)


if __name__ == "__main__":
    main()
