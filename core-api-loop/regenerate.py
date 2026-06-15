#!/usr/bin/env python3
"""
regenerate.py — The OUTER loop: regenerate a policy against the current spec, then measure how
the control demand moved.

The inner loop (run_loop.py) minimizes core-api.yaml against a FROZEN demand. This outer loop
closes the co-evolution: once the spec changes, the policies should be regenerated so they cite
the spec's now-registered vocabulary, which shifts the demand. If the demand stabilizes, you've
reached a fixed point; if it moved, run the inner loop again. (See the plan's two-loop section.)

The whole regeneration is deterministic EXCEPT one step — the LLM that turns a policy's composite
prompt into Markdown. The deterministic scaffolding lives here; the LLM is a pluggable backend:

  prep      reparse core-api.yaml -> core-vocabulary.json (so DESIGN_NOTES reflects the latest
            spec), then run .skills/policy-prep to assemble the composite prompt. The composite
            embeds the meta-prompt + the policy's prompt.md INPUTS + the live vocabulary as
            DESIGN_NOTES. Prints the composite prompt path.
  generate  call the LLM backend (api / cli) on the composite prompt -> raw Markdown. With
            --backend stage it does NOT call an LLM: it just exposes the composite prompt and the
            drop path, so an agent (e.g. a Claude Code subagent) or a human can produce the
            Markdown. This is the default when no API key / claude CLI is present.
  apply     validate the generated Markdown (scripts/check_vocab_refs.py) and install it as
            {slug}/{slug}.md.
  measure   re-extract the demand from the live policy tree and diff it against a saved snapshot
            (codes added/removed, unregistered before/after against the current spec).

Typical agent-driven cycle (no API key needed):
  python core-api-loop/regenerate.py prep fair-lending
  # -> a subagent/human reads .cache/prep/fair-lending.composite-prompt.txt, writes Markdown to
  #    core-api-loop/.regen/fair-lending.generated.md
  python core-api-loop/regenerate.py apply fair-lending
  python core-api-loop/regenerate.py measure --slug fair-lending

Fully automated cycle (with a backend):
  ANTHROPIC_API_KEY=... python core-api-loop/regenerate.py cycle fair-lending --backend api
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(HERE, ".."))
PREPARE = os.path.join(HERE, "prepare")
SCRIPTS = os.path.join(REPO_ROOT, "scripts")
sys.path.insert(0, PREPARE)

import control_oracle  # noqa: E402  (also puts SCRIPTS on sys.path)
import extract_controls  # noqa: E402  (load_api_index for baseline registered sets)

VENV_PY = os.path.join(HERE, ".venv", "bin", "python")
PY = VENV_PY if os.path.exists(VENV_PY) else sys.executable

REGEN_DIR = os.path.join(HERE, ".regen")
REGEN_LOG = os.path.join(HERE, "regen-log.jsonl")  # outer-loop hypothesis->outcome log
PREP_SCRIPT = os.path.join(REPO_ROOT, ".skills", "policy-prep", "scripts", "prepare_policy.py")
PARSE_SCRIPT = os.path.join(SCRIPTS, "parse_core_api.py")
CHECK_SCRIPT = os.path.join(SCRIPTS, "check_vocab_refs.py")

GENERATE_MODEL = "claude-opus-4-8"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def run(cmd: list[str], cwd: str = REPO_ROOT, capture: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, cwd=cwd, text=True,
                          capture_output=capture)


def slug_md_path(slug: str) -> str:
    return os.path.join(REPO_ROOT, slug, f"{slug}.md")


def generated_path(slug: str) -> str:
    return os.path.join(REGEN_DIR, f"{slug}.generated.md")


def demand_snapshot_path(tag: str) -> str:
    return os.path.join(REGEN_DIR, f"demand.{tag}.json")


# --------------------------------------------------------------------------- #
# prep
# --------------------------------------------------------------------------- #
def reparse_spec() -> dict:
    """Re-run parse_core_api.py so core-vocabulary.json reflects the latest core-api.yaml.
    This is what couples regeneration to the optimized spec (DESIGN_NOTES is derived from it)."""
    r = run([PY, PARSE_SCRIPT])
    if r.returncode != 0:
        sys.exit(f"parse_core_api.py failed:\n{r.stderr}")
    return json.loads(r.stdout)


def cmd_prep(args) -> dict:
    os.makedirs(REGEN_DIR, exist_ok=True)
    if not args.no_reparse:
        info = reparse_spec()
        print(f"reparsed spec -> core-vocabulary.json ({info['stats']['entities']} entities, "
              f"{info['stats']['events']} events, {info['stats']['fields']} fields)")
    r = run([PY, PREP_SCRIPT, args.slug])
    if r.returncode != 0:
        sys.exit(f"prepare_policy.py failed for {args.slug}:\n{r.stderr or r.stdout}")
    prep = json.loads(r.stdout)
    prep["composite_prompt_abspath"] = os.path.join(REPO_ROOT, prep["composite_prompt_path"])
    print(json.dumps({k: prep[k] for k in ("slug", "composite_prompt_path",
                                           "composite_prompt_chars", "design_notes_source")},
                     indent=2))
    print(f"\nNext: produce Markdown from the composite prompt into:\n  {generated_path(args.slug)}")
    return prep


# --------------------------------------------------------------------------- #
# generate (pluggable LLM backend)
# --------------------------------------------------------------------------- #
def _read_composite(slug: str) -> str:
    path = os.path.join(REPO_ROOT, ".cache", "prep", f"{slug}.composite-prompt.txt")
    if not os.path.exists(path):
        sys.exit(f"composite prompt not found ({path}); run `prep {slug}` first.")
    return open(path, encoding="utf-8").read()


def _strip_fences(md: str) -> str:
    s = md.strip()
    if s.startswith("```"):
        s = s.split("\n", 1)[1] if "\n" in s else s
        if s.rstrip().endswith("```"):
            s = s.rstrip()[:-3]
    return s.strip() + "\n"


def generate_via_api(composite: str) -> str:
    try:
        import anthropic
    except ModuleNotFoundError:
        sys.exit("--backend api needs the anthropic SDK (pip install anthropic) and ANTHROPIC_API_KEY.")
    client = anthropic.Anthropic()
    # Stream: a full-policy generation (max_tokens 32k) can exceed the SDK's 10-minute
    # non-streaming ceiling, which raises otherwise.
    parts: list[str] = []
    with client.messages.stream(
        model=GENERATE_MODEL,
        max_tokens=32000,
        messages=[{"role": "user", "content": composite}],
    ) as stream:
        for chunk in stream.text_stream:
            parts.append(chunk)
    return _strip_fences("".join(parts))


def generate_via_cli(composite: str) -> str:
    import shutil
    if not shutil.which("claude"):
        sys.exit("--backend cli needs the `claude` CLI on PATH.")
    r = subprocess.run(["claude", "-p", "--model", GENERATE_MODEL],
                       input=composite, text=True, capture_output=True)
    if r.returncode != 0:
        sys.exit(f"claude CLI failed:\n{r.stderr}")
    return _strip_fences(r.stdout)


def cmd_generate(args) -> None:
    os.makedirs(REGEN_DIR, exist_ok=True)
    out = generated_path(args.slug)
    if args.backend == "stage":
        composite = _read_composite(args.slug)
        print(f"composite prompt: {os.path.join(REPO_ROOT, '.cache', 'prep', args.slug + '.composite-prompt.txt')}")
        print(f"  ({len(composite)} chars). Generate the policy Markdown from it and write to:")
        print(f"  {out}")
        print("Then run: regenerate.py apply " + args.slug)
        return
    composite = _read_composite(args.slug)
    md = generate_via_api(composite) if args.backend == "api" else generate_via_cli(composite)
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(md)
    print(f"wrote {out} ({len(md)} chars) via backend={args.backend}")


# --------------------------------------------------------------------------- #
# apply
# --------------------------------------------------------------------------- #
def cmd_apply(args) -> None:
    src = args.from_path or generated_path(args.slug)
    if not os.path.exists(src):
        sys.exit(f"generated Markdown not found: {src} (run prep + generate first).")
    dst = slug_md_path(args.slug)

    # validate references against the current spec (non-fatal report unless --strict)
    chk = run([PY, CHECK_SCRIPT, src, "--json"])
    report = {}
    try:
        report = json.loads(chk.stdout) if chk.stdout.strip() else {}
    except json.JSONDecodeError:
        pass
    if args.strict and chk.returncode != 0:
        sys.exit(f"check_vocab_refs --strict failed for {src}:\n{chk.stdout}\n{chk.stderr}")

    md = open(src, encoding="utf-8").read()
    with open(dst, "w", encoding="utf-8") as fh:
        fh.write(md)
    print(f"installed {src} -> {dst} ({len(md)} chars)")
    if report:
        print("vocab-ref check:", json.dumps(report.get("summary", report), indent=2)[:800])


# --------------------------------------------------------------------------- #
# measure
# --------------------------------------------------------------------------- #
def _snapshot_demand() -> dict:
    return control_oracle.extract_demand(REPO_ROOT)


def cmd_snapshot(args) -> None:
    os.makedirs(REGEN_DIR, exist_ok=True)
    d = _snapshot_demand()
    path = demand_snapshot_path(args.tag)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(d, fh, indent=2, ensure_ascii=False)
    print(f"demand snapshot [{args.tag}] -> {path} "
          f"({d['meta']['unique_codes']} codes, {d['meta']['controls']} controls)")


def cmd_measure(args) -> None:
    before_path = demand_snapshot_path(args.before)
    if not os.path.exists(before_path):
        sys.exit(f"no 'before' snapshot at {before_path}; run `snapshot --tag {args.before}` "
                 f"before regenerating.")
    before = json.load(open(before_path))
    after = _snapshot_demand()  # live, post-apply

    b_codes = set(before["codes"].keys())
    a_codes = set(after["codes"].keys())
    added = sorted(a_codes - b_codes)
    removed = sorted(b_codes - a_codes)

    result = {
        "before": {"codes": len(b_codes), "controls": before["meta"]["controls"]},
        "after": {"codes": len(a_codes), "controls": after["meta"]["controls"]},
        "codes_added": len(added),
        "codes_removed": len(removed),
    }

    # optional: unregistered before/after against the CURRENT spec
    if args.slug or args.spec_scored:
        ec, fp = control_oracle.code_sets(control_oracle.parse_vocab(
            os.path.join(REPO_ROOT, "core-api.yaml"),
            os.path.join(REPO_ROOT, "vocab-migration.json")))
        unreg_before = len(b_codes - ec - fp)
        unreg_after = len(a_codes - ec - fp)
        result["unregistered_before"] = unreg_before
        result["unregistered_after"] = unreg_after
        result["unregistered_delta"] = unreg_after - unreg_before

    print(json.dumps(result, indent=2))
    if args.show:
        if added:
            print(f"\n+ added {len(added)} codes (sample): {added[:20]}")
        if removed:
            print(f"\n- removed {len(removed)} codes (sample): {removed[:20]}")

    # Persist the outcome to the outer-loop log (hypothesis -> outcome), for journal.py.
    slug = getattr(args, "slug", None)
    record = {
        "ts": _now(),
        "loop": "outer",
        "hypothesis": f"regenerate {slug}" if slug else "remeasure demand",
        "note": getattr(args, "note", None),
        "demand_before": result["before"]["codes"],
        "demand_after": result["after"]["codes"],
        "codes_added": result["codes_added"],
        "codes_removed": result["codes_removed"],
    }
    if "unregistered_delta" in result:
        record.update({
            "unregistered_before": result["unregistered_before"],
            "unregistered_after": result["unregistered_after"],
            "unregistered_delta": result["unregistered_delta"],
        })
    with open(REGEN_LOG, "a", encoding="utf-8") as fh:
        fh.write(json.dumps(record) + "\n")


# --------------------------------------------------------------------------- #
# affected-only selection (the spec delta -> which policies to regenerate)
# --------------------------------------------------------------------------- #
def spec_snapshot_path(tag: str) -> str:
    return os.path.join(REGEN_DIR, f"spec.{tag}.json")


def registered_current() -> set:
    """Registered code set (events ∪ field paths) of the CURRENT core-api.yaml."""
    ec, fp = control_oracle.code_sets(control_oracle.parse_vocab(
        os.path.join(REPO_ROOT, "core-api.yaml"),
        os.path.join(REPO_ROOT, "vocab-migration.json")))
    return ec | fp


def registered_from_vocab_json(path: str) -> set:
    ec, fp, _meta, _v = extract_controls.load_api_index(path)
    return ec | fp


def registered_from_ref(ref: str) -> set:
    """Registered set of core-api.yaml as of a git ref (uses the current migration)."""
    r = run(["git", "show", f"{ref}:core-api.yaml"])
    if r.returncode != 0:
        sys.exit(f"git show {ref}:core-api.yaml failed:\n{r.stderr}")
    fd, tmp = tempfile.mkstemp(suffix=".yaml")
    os.close(fd)
    open(tmp, "w").write(r.stdout)
    try:
        ec, fp = control_oracle.code_sets(control_oracle.parse_vocab(
            tmp, os.path.join(REPO_ROOT, "vocab-migration.json")))
    finally:
        os.remove(tmp)
    return ec | fp


def resolve_baseline_registered(args) -> set:
    """The 'old' spec's registered set — the other side of the delta."""
    if getattr(args, "before", None):
        p = spec_snapshot_path(args.before)
        if not os.path.exists(p):
            sys.exit(f"no spec snapshot '{args.before}' at {p}; "
                     f"run `spec-snapshot --tag {args.before}` before changing the spec.")
        return set(json.load(open(p))["registered"])
    if getattr(args, "baseline_vocab", None):
        return registered_from_vocab_json(args.baseline_vocab)
    if getattr(args, "baseline_ref", None):
        return registered_from_ref(args.baseline_ref)
    sys.exit("provide a baseline: --before TAG | --baseline-vocab PATH | --baseline-ref GITREF")


def load_demand_for_affected(args) -> dict:
    """Per-policy citations. Defaults to the frozen prepare/demand.json (the loop's frozen
    demand), falling back to a live extraction."""
    p = getattr(args, "demand", None) or os.path.join(PREPARE, "demand.json")
    if os.path.exists(p):
        return json.load(open(p))
    return control_oracle.extract_demand(REPO_ROOT)


def select_affected(args) -> dict:
    """A policy is AFFECTED iff it cites a code whose registered status flipped between the
    baseline spec and the current spec (symmetric difference of the registered sets). That is
    exactly the set of policies whose valid vocabulary footprint changed — the only ones a
    regeneration can move."""
    base = resolve_baseline_registered(args)
    cur = registered_current()
    delta = base ^ cur                      # codes registered in exactly one of the two specs
    newly = cur - base                      # now registered (policy can adopt -> unregistered drops)
    gone = base - cur                       # no longer registered (policy refs now dangling)
    demand = load_demand_for_affected(args)

    by_slug: dict[str, dict] = {}
    for code, info in demand["codes"].items():
        if code in delta:
            for pol in info.get("policies", []):
                rec = by_slug.setdefault(pol, {"newly": set(), "gone": set()})
                (rec["newly"] if code in newly else rec["gone"]).add(code)

    rows = []
    for slug, rec in sorted(by_slug.items()):
        triggers = sorted(rec["newly"] | rec["gone"])
        rows.append({
            "slug": slug,
            "regeneratable": os.path.exists(os.path.join(REPO_ROOT, slug, "prompt.md")),
            "trigger_count": len(triggers),
            "newly_registered": sorted(rec["newly"]),
            "deregistered": sorted(rec["gone"]),
        })
    return {
        "delta_registered": len(delta),
        "newly_registered_total": len(newly),
        "deregistered_total": len(gone),
        "affected_policies": len(rows),
        "affected": rows,
        "demand_codes": len(demand["codes"]),
    }


def cmd_spec_snapshot(args) -> None:
    os.makedirs(REGEN_DIR, exist_ok=True)
    reg = registered_current()
    p = spec_snapshot_path(args.tag)
    with open(p, "w", encoding="utf-8") as fh:
        json.dump({"meta": {"tag": args.tag, "snapshot_at": _now(),
                            "registered_count": len(reg)},
                   "registered": sorted(reg)}, fh)
    print(f"spec snapshot [{args.tag}] -> {p} ({len(reg)} registered codes)")


def cmd_affected(args) -> dict:
    sel = select_affected(args)
    summary = {k: sel[k] for k in ("delta_registered", "newly_registered_total",
                                   "deregistered_total", "affected_policies", "demand_codes")}
    print(json.dumps(summary, indent=2))
    for r in sel["affected"]:
        mark = "" if r["regeneratable"] else "  [NO prompt.md — cannot regenerate]"
        print(f"  {r['slug']:40} {r['trigger_count']:4} trigger codes{mark}")
        if args.show:
            if r["newly_registered"]:
                print(f"      + now registered: {r['newly_registered'][:12]}")
            if r["deregistered"]:
                print(f"      - de-registered : {r['deregistered'][:12]}")
    return sel


# --------------------------------------------------------------------------- #
# cycle (snapshot -> prep -> generate -> apply -> measure), phase-batched so the
# generate phase can fan out across all affected policies concurrently.
# --------------------------------------------------------------------------- #
def _before_tag(slug: str) -> str:
    return f"cycle-{slug}-before"


def _phase_snapshot_prep(slugs: list[str], args) -> None:
    """Snapshot demand + assemble each composite. Fast/deterministic. Reparse the spec only
    once (the spec is identical across slugs in a single cycle)."""
    import types
    for i, slug in enumerate(slugs):
        print(f"[prep:{slug}] snapshot demand + composite prompt")
        cmd_snapshot(types.SimpleNamespace(tag=_before_tag(slug)))
        cmd_prep(types.SimpleNamespace(slug=slug, no_reparse=(args.no_reparse or i > 0)))


def _ensure_backend(backend: str) -> None:
    """Fail fast (before spawning threads) if an inline backend is unavailable."""
    if backend == "api":
        try:
            import anthropic  # noqa: F401
        except ModuleNotFoundError:
            sys.exit("--backend api needs the anthropic SDK (pip install anthropic).")
        if not os.environ.get("ANTHROPIC_API_KEY"):
            sys.exit("--backend api needs ANTHROPIC_API_KEY in the environment.")
    elif backend == "cli":
        import shutil
        if not shutil.which("claude"):
            sys.exit("--backend cli needs the `claude` CLI on PATH.")


def _generate_one_to_file(slug: str, backend: str) -> int:
    composite = _read_composite(slug)
    md = generate_via_api(composite) if backend == "api" else generate_via_cli(composite)
    with open(generated_path(slug), "w", encoding="utf-8") as fh:
        fh.write(md)
    return len(md)


def _phase_generate(slugs: list[str], args) -> list[str]:
    """Generate every slug. Returns the slugs still PENDING (only possible for stage backend).

    api/cli: independent generations run CONCURRENTLY in a thread pool — wall-clock is one
    generation, not N (each call is I/O-bound and releases the GIL). stage: nothing is generated
    inline; the orchestrator (e.g. parallel Claude Code subagents) produces each drop file, so we
    just report which are still missing."""
    if args.backend == "stage":
        for s in slugs:
            if os.path.exists(generated_path(s)):
                print(f"[generate:{s}] using already-staged {os.path.relpath(generated_path(s), REPO_ROOT)}")
        return [s for s in slugs if not os.path.exists(generated_path(s))]

    _ensure_backend(args.backend)
    from concurrent.futures import ThreadPoolExecutor, as_completed
    jobs = max(1, args.jobs)
    print(f"[generate] {len(slugs)} policy(ies) concurrently (jobs={jobs}, backend={args.backend})")
    with ThreadPoolExecutor(max_workers=jobs) as ex:
        futs = {ex.submit(_generate_one_to_file, s, args.backend): s for s in slugs}
        for fut in as_completed(futs):
            s = futs[fut]
            try:
                n = fut.result()
                print(f"  ✓ {s} ({n} chars)")
            except BaseException as e:                       # noqa: BLE001 — report, don't abort the batch
                print(f"  ✗ {s}: {e}")
    return [s for s in slugs if not os.path.exists(generated_path(s))]


def _phase_apply_measure(slugs: list[str], args) -> None:
    import types
    for slug in slugs:
        if not os.path.exists(generated_path(slug)):
            print(f"[apply:{slug}] SKIP — no generated Markdown")
            continue
        if not os.path.exists(demand_snapshot_path(_before_tag(slug))):
            print(f"[apply:{slug}] SKIP — missing 'before' snapshot (run without --resume first)")
            continue
        print(f"\n========== finalize: {slug} ==========")
        cmd_apply(types.SimpleNamespace(slug=slug, from_path=None, strict=args.strict))
        cmd_measure(types.SimpleNamespace(before=_before_tag(slug), slug=slug,
                                          spec_scored=True, show=args.show,
                                          note=getattr(args, "note", None)))


def cmd_cycle(args) -> None:
    if getattr(args, "affected", False):
        sel = select_affected(args)
        slugs = [r["slug"] for r in sel["affected"] if r["regeneratable"]]
        skipped = [r["slug"] for r in sel["affected"] if not r["regeneratable"]]
        print(f"[cycle --affected] spec delta = {sel['delta_registered']} codes "
              f"({sel['newly_registered_total']} newly registered, "
              f"{sel['deregistered_total']} de-registered); "
              f"{sel['affected_policies']} affected, {len(slugs)} regeneratable"
              + (f"; skipped (no prompt.md): {skipped}" if skipped else ""))
        if not slugs:
            print("nothing to regenerate — spec delta touches no cited codes.")
            return
    else:
        if not args.slug:
            sys.exit("cycle: pass a SLUG, or --affected with a baseline.")
        slugs = [args.slug]

    if not args.resume:
        _phase_snapshot_prep(slugs, args)
        pending = _phase_generate(slugs, args)
        if pending:
            print(f"\n[cycle] {len(pending)} policy(ies) staged, awaiting generation "
                  f"(generate these IN PARALLEL — they are independent):")
            for s in pending:
                print(f"  - {s}: prompt {os.path.join('.cache', 'prep', s + '.composite-prompt.txt')}"
                      f"  ->  {os.path.relpath(generated_path(s), REPO_ROOT)}")
            print("Then re-run the same command with --resume to apply + measure all.")
            return

    _phase_apply_measure(slugs, args)


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    sub = ap.add_subparsers(dest="cmd", required=True)

    p_prep = sub.add_parser("prep", help="reparse spec + assemble composite prompt")
    p_prep.add_argument("slug")
    p_prep.add_argument("--no-reparse", action="store_true",
                        help="skip re-running parse_core_api.py (use existing core-vocabulary.json)")
    p_prep.set_defaults(func=cmd_prep)

    p_gen = sub.add_parser("generate", help="call the LLM backend on the composite prompt")
    p_gen.add_argument("slug")
    p_gen.add_argument("--backend", choices=["stage", "api", "cli"], default="stage")
    p_gen.set_defaults(func=cmd_generate)

    p_app = sub.add_parser("apply", help="validate + install generated Markdown as {slug}.md")
    p_app.add_argument("slug")
    p_app.add_argument("--from", dest="from_path", default=None)
    p_app.add_argument("--strict", action="store_true")
    p_app.set_defaults(func=cmd_apply)

    p_snap = sub.add_parser("snapshot", help="snapshot the live demand under a tag")
    p_snap.add_argument("--tag", required=True)
    p_snap.set_defaults(func=cmd_snapshot)

    p_meas = sub.add_parser("measure", help="diff live demand vs a 'before' snapshot")
    p_meas.add_argument("--before", default="before")
    p_meas.add_argument("--slug", default=None, help="also report unregistered before/after")
    p_meas.add_argument("--spec-scored", action="store_true",
                        help="report unregistered before/after against the current spec")
    p_meas.add_argument("--show", action="store_true", help="print sample added/removed codes")
    p_meas.add_argument("--note", default=None, help="rationale, recorded in regen-log.jsonl")
    p_meas.set_defaults(func=cmd_measure)

    def add_baseline(p):
        g = p.add_argument_group("baseline (the 'old' spec for the delta — pick one)")
        g.add_argument("--before", help="spec-snapshot tag (see `spec-snapshot --tag`)")
        g.add_argument("--baseline-vocab", help="path to an old core-vocabulary.json")
        g.add_argument("--baseline-ref", help="git ref to read core-api.yaml from (e.g. a commit)")
        g.add_argument("--demand", help="demand snapshot for per-policy citations "
                                        "(default: prepare/demand.json, else live)")

    p_spec = sub.add_parser("spec-snapshot", help="save the current spec's registered code set")
    p_spec.add_argument("--tag", required=True)
    p_spec.set_defaults(func=cmd_spec_snapshot)

    p_aff = sub.add_parser("affected",
                           help="list policies whose cited codes intersect the spec delta")
    add_baseline(p_aff)
    p_aff.add_argument("--show", action="store_true", help="print the trigger codes per policy")
    p_aff.set_defaults(func=cmd_affected)

    p_cyc = sub.add_parser("cycle",
                           help="one-shot: snapshot -> prep -> generate -> apply -> measure")
    p_cyc.add_argument("slug", nargs="?", help="policy slug (omit when using --affected)")
    p_cyc.add_argument("--affected", action="store_true",
                       help="regenerate every policy affected by the spec delta (needs a baseline)")
    add_baseline(p_cyc)
    p_cyc.add_argument("--backend", choices=["stage", "api", "cli"], default="stage",
                       help="LLM backend; 'stage' pauses for an agent/human to generate, "
                            "then resume with --resume")
    p_cyc.add_argument("--jobs", type=int, default=4,
                       help="concurrent generations for --backend api/cli (default 4)")
    p_cyc.add_argument("--no-reparse", action="store_true")
    p_cyc.add_argument("--strict", action="store_true")
    p_cyc.add_argument("--show", action="store_true")
    p_cyc.add_argument("--note", default=None, help="rationale, recorded in regen-log.jsonl")
    p_cyc.add_argument("--resume", action="store_true",
                       help="skip snapshot/prep/generate; apply+measure the staged Markdown")
    p_cyc.set_defaults(func=cmd_cycle)

    args = ap.parse_args(argv)
    return args.func(args) or 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
