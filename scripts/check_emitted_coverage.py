#!/usr/bin/env python3
"""Fail the build when the core emits an event code the spec does not register.

The inverse of check_vocab_drift.py. That gate protects the DEMAND side: no
policy may cite a code the core dropped. This one protects the SUPPLY side: no
code the core actually emits may be missing from the spec's event registry
(x-events in core-api.yaml, surfaced as `events` in core-vocabulary.json).

Before this gate existed the two lists were disjoint by 41 codes — every
`blnk.*` and `card.*` emission, half of each state machine's transitions —
because the registry was seeded from policy prose only and nothing ever
compared it against what the code emits. The crosswalk then honestly reported
297 of 316 controls unreachable, measured across that gap.

The emitted inventory is crosswalk-emitted-events.json (hand-maintained,
literal + templated expansions; build_crosswalk.py --check keeps its literal
half from drifting against the source). Codes are compared in canonical
spelling (scripts/code_format.py), the same normalization every consumer of
core-vocabulary.json applies.

Stdlib-only on purpose: core-ci.yml installs nothing, and this must run there.

  python3 scripts/check_emitted_coverage.py          # report + exit 1 on gaps
"""
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import code_format  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent
VOCAB = ROOT / "core-vocabulary.json"
EMITTED = ROOT / "crosswalk-emitted-events.json"


def main() -> int:
    vocab = json.loads(VOCAB.read_text())
    canon = code_format.canonicalizer(VOCAB)
    # An emitted code is covered if the spec registers it as an EVENT or a
    # TASK — emitted deadline codes (cash.coverage.attestation.due_at) are
    # task registrations, not events.
    registered = {canon(e.get("code") or e.get("name")) for e in vocab.get("events", [])} \
        | {canon(t["name"]) for t in vocab.get("tasks", [])}

    emitted = code_format.emitted_codes(json.loads(EMITTED.read_text()))

    # The core must EMIT canonical spellings, not merely canonicalize-to-match:
    # both this gate and the crosswalk compare canonically, so a new fused
    # emission (bsa_alert.triage_overdue) would pass every gate while the
    # literal-matching control grader marks the control red. This caught
    # nothing on the day it was added — which is the moment to add it.
    fused = sorted(c for c in emitted if canon(c) != c)
    if fused:
        print("emitted-coverage FAILED — emit the CANONICAL spelling "
              "(scripts/code_format.py):", file=sys.stderr)
        for c in fused:
            print(f"  {c}  ->  {canon(c)}", file=sys.stderr)
        return 1

    missing = sorted(code for code in emitted if canon(code) not in registered)
    if missing:
        print("emitted-coverage FAILED — the core emits codes the spec does not "
              "register in x-events:", file=sys.stderr)
        for code in missing:
            print(f"  {code}", file=sys.stderr)
        print(f"\n{len(missing)} of {len(emitted)} emitted codes unregistered. "
              "Register each in core/core-api.yaml x-events (subject + canonical "
              "type verb), then rebuild core-vocabulary.json.", file=sys.stderr)
        return 1

    print(f"emitted coverage OK — all {len(emitted)} emitted codes are registered "
          f"in the spec ({len(registered)} registered events total).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
