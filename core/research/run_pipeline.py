#!/usr/bin/env python3
"""
run_pipeline.py — orchestrator for the API-research pipeline.

Chains the per-provider stages (crawl -> extract -> verify) and the spec stage
(minify), then runs the cross-provider mechanical comparison ONCE over every
artifact that exists. Reproducible and idempotent: a stage is skipped when its
output is already present and newer than its input (override with --force).

The pipeline is AUTOMATED ONLY UP TO THE JSON/CSV ARTIFACTS. The prose summaries,
the cross-provider write-ups, and architecture-decisions.md are produced at a
manual LLM/human seam — this script stops at the artifacts and prints the
remaining manual steps. See PIPELINE.md for the full picture.

Usage:
    python run_pipeline.py                         # run everything in providers.json
    python run_pipeline.py --only increase,unit    # subset of providers
    python run_pipeline.py --stages compare        # just (re)run the comparison
    python run_pipeline.py --skip-stages crawl     # everything but crawling
    python run_pipeline.py --force                 # ignore cached outputs
    python run_pipeline.py --dry-run               # print the plan, run nothing

Config: providers.json (see that file's _comment). Outputs land under research/build/.
This script is stdlib-only; the underlying stage scripts have their own deps
(e.g. api_crawler.py needs Playwright). A failing stage is recorded and the run
continues; the comparison uses whatever artifacts succeeded.
"""
import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

RESEARCH_DIR = Path(__file__).resolve().parent
PER_PROVIDER_STAGES = ["crawl", "extract", "verify", "minify"]
ALL_STAGES = PER_PROVIDER_STAGES + ["compare"]


def rel(p: Path) -> str:
    """Path relative to research/ for tidy logging."""
    try:
        return str(p.relative_to(RESEARCH_DIR))
    except ValueError:
        return str(p)


def newer_than(out: Path, src: Path) -> bool:
    """True if out exists and is at least as new as src (src may be None/URL)."""
    if not out.exists():
        return False
    if src is None or not Path(src).exists():
        return True
    return out.stat().st_mtime >= Path(src).stat().st_mtime


class Runner:
    def __init__(self, args):
        self.args = args
        self.build = (RESEARCH_DIR / args.build_dir).resolve()
        self.stages = set(args.stages.split(",")) if args.stages else set(ALL_STAGES)
        self.skip = set(args.skip_stages.split(",")) if args.skip_stages else set()
        self.manifest = {"started_at": _now(), "stages": {}, "providers": {}, "compare": {}}

    # ---- stage execution -------------------------------------------------
    def _run_script(self, script, argv, cwd=None):
        """Invoke a stage script; return (ok, detail)."""
        cmd = [sys.executable, str(RESEARCH_DIR / script), *map(str, argv)]
        if self.args.dry_run:
            print(f"      DRY-RUN: {' '.join(rel(Path(c)) if Path(c).exists() else c for c in cmd)}")
            return True, "dry-run"
        t0 = time.time()
        proc = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
        dt = round(time.time() - t0, 1)
        if proc.returncode != 0:
            tail = (proc.stderr or proc.stdout).strip().splitlines()[-3:]
            return False, f"exit {proc.returncode} ({dt}s): {' | '.join(tail)}"
        return True, f"ok ({dt}s)"

    def _do(self, stage, label, out: Path, src, fn):
        """Wrap a stage with selection, idempotency, and manifest recording."""
        if stage not in self.stages or stage in self.skip:
            return ("skipped-deselected", out)
        if not self.args.force and newer_than(out, src):
            print(f"   [{stage}] {label}: cached -> {rel(out)}")
            return ("cached", out)
        print(f"   [{stage}] {label}: running -> {rel(out)}")
        out.parent.mkdir(parents=True, exist_ok=True)
        ok, detail = fn()
        status = "ok" if ok else "FAILED"
        if not ok:
            print(f"      ✗ {detail}")
        return (status if ok else f"failed: {detail}", out)

    # ---- per-provider chain ----------------------------------------------
    def run_provider(self, p):
        name = p["name"]
        if p.get("enabled", True) is False:
            print(f"\n• {name}: disabled ({p.get('note', 'no source')}) — skipped")
            self.manifest["providers"][name] = {"disabled": True}
            return None
        print(f"\n• {name}")
        pdir = self.build / name
        result = {"compare_input": None, "stages": {}}

        doc_url = p.get("doc_url") or None
        openapi = (RESEARCH_DIR / p["openapi"]).resolve() if p.get("openapi") else None

        if doc_url:
            docs = pdir / f"{name}_api_docs"
            st, _ = self._do("crawl", "crawl docs", docs / "crawl_report.json", None,
                             lambda: self._run_script("api_crawler.py", [doc_url, docs]))
            result["stages"]["crawl"] = st

            smap = pdir / f"{name}_semantic_map_improved.json"
            st, _ = self._do("extract", "extract semantic map", smap, docs / "crawl_report.json",
                             lambda: self._run_script("semantic_extractor.py", [docs, smap]))
            result["stages"]["extract"] = st
            if smap.exists():
                result["compare_input"] = smap

            vrep = pdir / "verification_report.json"
            self._do("verify", "verify (advisory)", vrep, smap,
                     lambda: self._run_script("semantic_verifier.py", [docs, smap, vrep]))
            result["stages"]["verify"] = "advisory"

        if openapi:
            if not openapi.exists():
                print(f"   [minify] spec missing: {rel(openapi)} — skipped")
                result["stages"]["minify"] = "failed: spec missing"
            else:
                minified = pdir / f"{name}.min.json"
                st, _ = self._do("minify", "minify OpenAPI spec", minified, openapi,
                                 lambda: self._run_script(
                                     "openapi_minifier.py",
                                     [openapi, "-o", minified]))
                result["stages"]["minify"] = st
                # prefer the spec for compare; minified if produced, else raw
                result["compare_input"] = minified if minified.exists() else openapi

        self.manifest["providers"][name] = result["stages"]
        return result["compare_input"]

    # ---- cross-provider comparison ---------------------------------------
    def run_compare(self, inputs):
        if "compare" not in self.stages or "compare" in self.skip:
            return
        print("\n• compare (cross-provider, mechanical)")
        inputs = [i for i in inputs if i and Path(i).exists()]
        if len(inputs) < 2:
            print(f"   need >=2 inputs, have {len(inputs)} — skipped")
            self.manifest["compare"] = {"status": "skipped", "inputs": len(inputs)}
            return
        cmp_dir = self.build / "compare"
        cmp_dir.mkdir(parents=True, exist_ok=True)
        print("   inputs: " + ", ".join(rel(Path(i)) for i in inputs))
        ok, detail = self._run_script("api_comparisons.py",
                                      [str(i) for i in inputs], cwd=cmp_dir)
        print(f"   {'✓' if ok else '✗'} {detail} -> {rel(cmp_dir)}/*.csv")
        self.manifest["compare"] = {"status": "ok" if ok else "failed",
                                    "detail": detail, "inputs": [rel(Path(i)) for i in inputs]}

    # ---- driver ----------------------------------------------------------
    def run(self, providers):
        print(f"Pipeline: stages={sorted(self.stages - self.skip)}  build={rel(self.build)}"
              f"{'  [DRY-RUN]' if self.args.dry_run else ''}")
        compare_inputs = []
        for p in providers:
            ci = self.run_provider(p)
            if ci:
                compare_inputs.append(ci)
        self.run_compare(compare_inputs)
        self._finish()

    def _finish(self):
        self.manifest["finished_at"] = _now()
        if not self.args.dry_run:
            man = self.build / "pipeline-run.json"
            man.parent.mkdir(parents=True, exist_ok=True)
            man.write_text(json.dumps(self.manifest, indent=2))
            print(f"\nManifest: {rel(man)}")
        failed = [n for n, s in self.manifest["providers"].items()
                  if isinstance(s, dict) and any(str(v).startswith("failed") for v in s.values())]
        if failed:
            print(f"⚠ providers with failed stages: {', '.join(failed)}")
        print(_MANUAL_NEXT_STEPS)


def _now():
    # avoid Date.now-style nondeterminism concerns: wall clock is fine for a manifest
    return time.strftime("%Y-%m-%dT%H:%M:%S")


_MANUAL_NEXT_STEPS = """
─── Manual stages (not automated — see PIPELINE.md) ───────────────────────────
 5. Per-provider summary: paste each build/<provider>/<provider>_semantic_map_improved.json
    plus api_analysis_summaries/api-documentation-summary-prompt.md into an LLM.
 6. Cross-provider write-up: paste the build/compare/*.csv + summaries plus
    complete-comparison-prompt.md into an LLM.
 7. architecture-decisions.md is HAND-AUTHORED. This pipeline does NOT regenerate it.
"""


def load_config(path: Path):
    cfg = json.loads(path.read_text())
    return cfg.get("build_dir", "build"), cfg.get("providers", [])


def main(argv):
    ap = argparse.ArgumentParser(description="Run the API-research pipeline.")
    ap.add_argument("--config", default="providers.json", help="provider config (default: providers.json)")
    ap.add_argument("--only", help="comma-separated provider names to run")
    ap.add_argument("--stages", help=f"comma-separated subset of {ALL_STAGES}")
    ap.add_argument("--skip-stages", help="comma-separated stages to skip")
    ap.add_argument("--build-dir", help="output root (overrides config)")
    ap.add_argument("--force", action="store_true", help="re-run even if outputs are cached")
    ap.add_argument("--dry-run", action="store_true", help="print the plan, run nothing")
    args = ap.parse_args(argv)

    cfg_path = (RESEARCH_DIR / args.config).resolve()
    if not cfg_path.exists():
        print(f"config not found: {rel(cfg_path)}")
        return 1
    build_dir, providers = load_config(cfg_path)
    if args.build_dir:
        build_dir = args.build_dir
    else:
        args.build_dir = build_dir

    if args.only:
        wanted = set(args.only.split(","))
        providers = [p for p in providers if p["name"] in wanted]
        missing = wanted - {p["name"] for p in providers}
        if missing:
            print(f"unknown providers: {', '.join(missing)}")
            return 1
    if not providers:
        print("no providers selected")
        return 1

    Runner(args).run(providers)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
