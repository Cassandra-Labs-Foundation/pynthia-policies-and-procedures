#!/usr/bin/env python3
"""Fail the build when the router and the spec's paths section disagree.

The 2026-08 postmortem: the spec's paths described a design that was never
built (119 phantom operations) while 345 running routes were invisible to it,
because paths had no consumer that failed when it lied. This is that consumer.

Both sides in one comparison:
  router  = every `endpoint:` declaration in the split route table
            (api/index.ts hand entries + api/routes.gen.ts generated entries)
  spec    = every operation in the built core-vocabulary.json (which mirrors
            core-api.yaml paths exactly; using the artifact keeps this stdlib-only
            so core-ci can run it)

Any route the spec lacks, or any spec operation with no route, is a failure.
Designed-but-unimplemented operations belong in x-proposed-paths (excluded from
the vocabulary's endpoints), not in paths.

  python3 scripts/check_route_parity.py        # report + exit 1 on divergence
"""
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from code_format import norm_path as norm  # noqa: E402
import route_table  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent
VOCAB = ROOT / "core-vocabulary.json"
API_DIR = ROOT / "core" / "supabase" / "functions" / "api"


def main() -> int:
    vocab = json.loads(VOCAB.read_text())
    spec = {(e["method"], norm(e["path"])) for e in vocab.get("endpoints", [])}

    router = {(m, norm(p)) for m, p in route_table.endpoints(API_DIR)}

    missing_in_spec = sorted(router - spec)
    phantom = sorted(spec - router)
    if missing_in_spec or phantom:
        print("route parity FAILED:", file=sys.stderr)
        for m, p in missing_in_spec:
            print(f"  routed but absent from spec paths: {m} {p}", file=sys.stderr)
        for m, p in phantom:
            print(f"  in spec paths but not routed (move to x-proposed-paths "
                  f"or route it): {m} {p}", file=sys.stderr)
        print(f"\n{len(missing_in_spec)} unspecified routes, {len(phantom)} phantom "
              "operations. Rerun core/core-api-loop/migrate/author_paths.py or "
              "edit paths by hand, then rebuild core-vocabulary.json.",
              file=sys.stderr)
        return 1
    print(f"route parity OK — {len(router)} operations, spec and router agree.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
