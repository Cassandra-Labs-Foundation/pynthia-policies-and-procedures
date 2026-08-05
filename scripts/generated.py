#!/usr/bin/env python3
"""check_or_write — the one staleness gate for generated files.

Every generator in this repo has the same tail: render the text, and either
write it or (in --check mode) fail if the committed file differs. Five scripts
had five hand-rolled copies with five message wordings and two different
answers to "report the first stale file or all of them". This is the shared
body: it reports ALL stale paths.
"""
import pathlib
import sys


def check_or_write(outputs: dict, *, check: bool, rerun_hint: str) -> int:
    """outputs: {path: text}. In check mode, print every stale path and return
    1 if any; otherwise write them all and return 0."""
    if check:
        stale = [str(p) for p, text in outputs.items()
                 if not pathlib.Path(p).exists()
                 or pathlib.Path(p).read_text() != text]
        if stale:
            print(f"STALE — rerun {rerun_hint} and commit:", file=sys.stderr)
            for s in stale:
                print(f"  {s}", file=sys.stderr)
            return 1
        return 0
    for p, text in outputs.items():
        pathlib.Path(p).write_text(text)
    return 0
