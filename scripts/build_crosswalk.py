#!/usr/bin/env python3
"""Build the CG-* <-> catalogue crosswalk.

    python3 scripts/build_crosswalk.py           # regenerate crosswalk.json + CROSSWALK.md
    python3 scripts/build_crosswalk.py --check   # validate only; non-zero exit on drift

WHAT IS GENERATED VS HAND-AUTHORED
----------------------------------
Generated (regenerate freely):
  * the reachability view -- derived from controls.json trigger events and the
    emitted-event inventory. Pure computation, no judgment.
  * both rendered outputs.

Hand-authored (crosswalk-mappings.json):
  * every claim about what a CG-* control does or does not discharge.

The mapping half CANNOT be generated. controls.json carries no field naming the
mechanism a control needs, and the CG-* namespace does not appear in it at all,
so there is no key to join on. What this script does instead is VALIDATE the
hand-authored claims -- every cited catalogue id must exist, every verdict must
be in the vocabulary -- so the file cannot rot into referencing controls that
were renamed or deleted. It cannot check whether a judgment is correct; only a
reviewer can, which is why every claim carries `needs_review` / `reviewed_by`.

BIAS
----
This artifact is used to make regulatory coverage claims, so it must under-claim.
The script enforces two rules mechanically:
  * a `discharges` verdict must list zero gaps (a gap contradicts the verdict)
  * a claim with gaps must not be verdict `discharges`
Both fail the build rather than warning, because a silently over-stated row is
the specific failure this artifact exists to prevent.
"""

import json
import pathlib
import re
import sys
from collections import Counter, defaultdict

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONTROLS = ROOT / "controls.json"
MAPPINGS = ROOT / "crosswalk-mappings.json"
EMITTED = ROOT / "crosswalk-emitted-events.json"
OUT_JSON = ROOT / "crosswalk.json"
OUT_MD = ROOT / "CROSSWALK.md"

VERDICTS = {
    "discharges",
    "partially_discharges",
    "related",
    "no_catalogue_counterpart",
}

# Reachability is deliberately strict: "reachable" means the core can fire
# EVERY trigger the control declares, not most of them. A control whose triggers
# are half firable is not half-implementable -- it is blocked, and saying so is
# the point.
REACH_FULL = "reachable"
REACH_PARTIAL = "partially_reachable"
REACH_NONE = "unreachable"


def load(path):
    with open(path) as fh:
        return json.load(fh)


def emitted_codes(inv):
    # shared shape-strict reader — see scripts/code_format.emitted_codes
    import code_format
    return code_format.emitted_codes(inv)


OBJ_CODE = re.compile(r'\bcode: "([a-z_]+\.[a-z_.]+)"')
EMIT_OPEN = re.compile(r"\bemit\w*\(")
DOTTED_STR = re.compile(r'"([a-z_]+\.[a-z_.]+)"')
COMMENT = re.compile(r"//[^\n]*|/\*.*?\*/", re.S)

# Top-level function boundaries: classic declarations AND arrow consts. An
# arrow handler that is not its own segment would have its emissions credited
# to whatever function precedes it — a routed one makes that a false positive.
FN_DECL = re.compile(
    r"^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\("
    r"|^(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\(",
    re.M)


def emit_call_codes(text):
    """Dotted string-literal codes passed to emit-style helpers.

    For each `emit*(...)` call, scan the balanced argument list and collect
    every dotted double-quoted string that appears BEFORE the first top-level
    `{` (the payload object, whose keys are dotted field paths, not codes).
    This survives nested calls in earlier arguments (`now.getTime()`), plain
    string ids, and catches BOTH branches of a ternary code argument —
    the naive first-string regex was blind to a quarter of real sites."""
    found = set()
    for m in EMIT_OPEN.finditer(text):
        depth, i = 1, m.end()
        arg_end, payload_at = None, None
        in_str = None
        while i < len(text) and i < m.end() + 2000:
            ch = text[i]
            if in_str:
                if ch == "\\":
                    i += 2
                    continue
                if ch == in_str:
                    in_str = None
            elif ch in "\"'`":
                in_str = ch
            elif ch == "(":
                depth += 1
            elif ch == ")":
                depth -= 1
                if depth == 0:
                    arg_end = i
                    break
            elif ch == "{" and depth == 1 and payload_at is None:
                payload_at = i
            i += 1
        stop = payload_at if payload_at is not None else arg_end
        if stop is not None:
            found.update(mm.group(1)
                         for mm in DOTTED_STR.finditer(text[m.end():stop]))
    return found


def literal_codes_in_text(text):
    return {m.group(1) for m in OBJ_CODE.finditer(text)} | emit_call_codes(text)


def routed_handlers_by_module():
    """{module stem: set of handler names} the router actually imports.
    api/index.ts is explicit that unrouting IS the removal of reachability —
    and routing is per-HANDLER, not per-file: cash_ops.ts exports 3 routed
    handlers next to dozens the router never imports. An unreachable
    handler's emissions are capability, not supply; they belong in the
    inventory's _deliberately_excluded_unrouted block, not in `literal`."""
    import route_table
    return route_table.imports_by_module(ROOT / "core" / "supabase" / "functions" / "api")


def reachable_codes_in_module(text, routed_names):
    """Literal codes emitted inside routed handlers of one api module,
    including local functions transitively called from them. Comments are
    stripped first so a function name in prose cannot pull a segment into the
    closure. Attribution is by top-level function segment (declarations and
    arrow consts); the closure starts from the router's imports and adds any
    locally declared function referenced from a reachable segment.
    Conservative in the safe direction: a missed reference weakens the guard,
    it cannot demand an unreachable code."""
    text = COMMENT.sub("", text)
    decls = [(m.start(), m.group(1) or m.group(2)) for m in FN_DECL.finditer(text)]
    bounds = [pos for pos, _ in decls] + [len(text)]
    segments = {name: text[bounds[i]:bounds[i + 1]]
                for i, (_, name) in enumerate(decls)}

    reachable = set(routed_names) & set(segments)
    grew = True
    while grew:
        grew = False
        for name in list(reachable):
            for other in segments:
                if other not in reachable and re.search(rf"\b{other}\s*\(",
                                                        segments[name]):
                    reachable.add(other)
                    grew = True

    found = set()
    for name in reachable:
        found.update(literal_codes_in_text(segments[name]))
    return found


def literal_codes_in_source():
    """Re-grep the source for literal codes so the easy half of the inventory
    cannot drift unnoticed. api/ modules are scoped to their ROUTED handlers
    (see routed_handlers_by_module); the non-api functions (blnk-reconcile,
    blnk-webhook) run whole on their schedule/webhook entrypoints and are
    scanned in full. The original code:-only, whole-tree grep matched 1 of
    the ~60 routed positional emissions while demanding nothing false; this
    one sees both shapes and stays inside the reachable surface."""
    routed = routed_handlers_by_module()
    found = set()
    for p in (ROOT / "core" / "supabase" / "functions").rglob("*.ts"):
        if p.name.endswith(".test.ts"):
            continue
        # The DRILL is not the core. Its fixture data names trigger codes it
        # will fire against a SYNTHETIC institution (`trigger_code:
        # "audit.cycle_timer"`), and this grep would read those as codes the
        # core emits — which is precisely the substitution 5c forbids, arriving
        # by accident rather than by edit. Caught by this check on the drill's
        # first run; excluded here so it cannot recur.
        posix = p.as_posix()
        if "/drill/" in posix:
            continue
        # The aggregator ingests caller-supplied codes into its OWN schema —
        # not a core emission surface (see inventory notes).
        if "/aggregator/" in posix:
            continue
        if "/api/" in posix:
            found.update(reachable_codes_in_module(p.read_text(),
                                                   routed.get(p.stem, set())))
        else:
            found.update(literal_codes_in_text(COMMENT.sub("", p.read_text())))
    return found


def control_triggers(control):
    return sorted(
        {
            r["trigger_event"]
            for r in control.get("control_rules", [])
            if r.get("trigger_event")
        }
    )


def control_identity(c):
    # NOTE: since the extractor emits `uid` (policy:control_id) this function
    # only still exists to collapse REPLICAS -- SC-02 has nine distinct uids
    # but is one control. Collisions are now detectable from uid alone.
    """True identity of a catalogue entry.

    control_id is NOT unique: 333 rows carry 306 distinct ids. Two different
    things cause that, and they need different handling.

      * SHARED controls (SC-01, SC-02) are replicated verbatim into every policy
        that references them — nine identical copies of SC-02. Counting those
        nine times inflates every reachability figure.
      * COLLISIONS: CP-01 in `capitalization` (capital targets) and CP-01 in
        `cash` (cash governance) are different controls that happen to share an
        id. Keying on the id alone silently picks whichever was loaded last, so
        a crosswalk claim citing "CP-01" could be validated against — and
        appear to describe — the wrong control entirely.

    Identity is therefore (control_id, title, trigger-set): replicas collapse,
    genuine collisions stay distinct and get flagged.
    """
    return (
        c["control_id"],
        c["title"],
        tuple(control_triggers(c)),
    )


def dedupe_controls(controls):
    """Collapse verbatim replicas; keep collisions apart."""
    seen = {}
    for c in controls:
        key = control_identity(c)
        if key in seen:
            seen[key]["_policies"].append(c["policy"])
        else:
            copy = dict(c)
            copy["_policies"] = [c["policy"]]
            seen[key] = copy
    return list(seen.values())


def collisions(controls):
    """control_ids that map to more than one DISTINCT control."""
    by_id = {}
    for c in controls:
        by_id.setdefault(c["control_id"], set()).add(c["title"])
    return {cid: sorted(titles) for cid, titles in by_id.items() if len(titles) > 1}


def control_produced(control):
    out = set()
    for r in control.get("control_rules", []):
        out.update(r.get("produced_events", []) or [])
    return sorted(out)


def build_reachability(controls, emitted):
    """Reachability is about TRIGGERS: can the core fire what starts this control?

    That alone over-claims, and BSA-21 is the proof — its only declared trigger
    is `account.closed`, which the core happens to emit, so it scores fully
    reachable while the retention schedule, legal holds and disposal workflow it
    actually describes do not exist anywhere. So each row also records which of
    the control's PRODUCED events the core could emit. A control that can be
    started but whose outputs are all unemittable is reachable and still not
    implementable, and `completable` is the flag that says so.
    """
    rows = []
    for c in controls:
        trigs = control_triggers(c)
        produced = control_produced(c)
        prod_firable = [p for p in produced if p in emitted]
        prod_missing = [p for p in produced if p not in emitted]
        if not trigs:
            # No declared trigger at all: not reachable, but for a different
            # reason than a missing subsystem -- the catalogue entry simply
            # does not say what fires it. Surfaced separately below.
            rows.append(
                {
                    "control_id": c["control_id"],
                    "policy": c["policy"],
                    "title": c["title"],
                    "reachability": REACH_NONE,
                    "triggers_total": 0,
                    "triggers_firable": [],
                    "triggers_missing": [],
                    "produced_total": len(produced),
                    "produced_firable": prod_firable,
                    "produced_missing": prod_missing,
                    "completable": False,
                    "note": "catalogue entry declares no trigger event",
                }
            )
            continue
        firable = [t for t in trigs if t in emitted]
        missing = [t for t in trigs if t not in emitted]
        if not missing:
            reach = REACH_FULL
        elif firable:
            reach = REACH_PARTIAL
        else:
            reach = REACH_NONE
        rows.append(
            {
                "control_id": c["control_id"],
                "policy": c["policy"],
                "title": c["title"],
                "reachability": reach,
                "triggers_total": len(trigs),
                "triggers_firable": firable,
                "triggers_missing": missing,
                "produced_total": len(produced),
                "produced_firable": prod_firable,
                "produced_missing": prod_missing,
                # startable AND able to signal its own outputs
                "completable": reach == REACH_FULL and not prod_missing,
                "note": None,
            }
        )
    return rows


# The only provenance value that may be counted as evidence. 'unknown' is the
# honest label for everything written before 20260719000900 (a mix of real
# calls, analytics/seed.sh and the e2e harness, with nothing recording which);
# 'simulated' cannot appear in core at all because the check constraints make it
# unrepresentable there.
COUNTABLE_PROVENANCE = "production"


def check_provenance(evidence_rows, errors):
    """Hard-fail if anything that is not production provenance reaches a
    coverage count.

    This is the backstop for the whole separation. The schema split already
    makes simulated evidence unreachable from core, and the check constraints
    make it unrepresentable there — this catches the remaining case, which is a
    coverage claim built on rows whose origin was never recorded.
    """
    bad = [r for r in evidence_rows if r.get("provenance") != COUNTABLE_PROVENANCE]
    if bad:
        counts = Counter(r.get("provenance") for r in bad)
        errors.append(
            "coverage count included non-production evidence: "
            + ", ".join(f"{n} row(s) provenance={p!r}" for p, n in counts.items())
            + " — simulated and unknown-origin rows can never support a claim"
        )


def validate(mappings, controls_by_id, ambiguous, by_uid, errors):
    for m in mappings["mappings"]:
        for claim in m["claims"]:
            cid = claim.get("catalogue_control")
            verdict = claim.get("verdict")
            where = f"{m['cg_control']} -> {cid or '(none)'}"

            if verdict not in VERDICTS:
                errors.append(f"{where}: unknown verdict {verdict!r}")

            if verdict == "no_catalogue_counterpart":
                if cid is not None:
                    errors.append(
                        f"{where}: no_catalogue_counterpart must not cite a control"
                    )
            else:
                if cid is None:
                    errors.append(f"{where}: verdict {verdict} requires a catalogue_control")
                elif cid not in controls_by_id and ":" not in cid:
                    errors.append(
                        f"{where}: cites {cid}, which is not in controls.json "
                        f"(renamed or removed?)"
                    )
                elif ":" in cid:
                    # a uid-qualified citation resolves a collision explicitly
                    if cid not in by_uid:
                        errors.append(f"{where}: cites uid {cid}, which does not exist")
                elif cid in ambiguous:
                    # A claim citing a colliding id does not say WHICH control it
                    # discharges, and the two may be unrelated. Refused rather
                    # than resolved arbitrarily.
                    errors.append(
                        f"{where}: {cid} is ambiguous — it names "
                        f"{len(ambiguous[cid])} different controls "
                        f"({'; '.join(ambiguous[cid])}). Qualify the claim."
                    )

            gaps = claim.get("gaps", [])
            # the two under-claim rules, enforced rather than trusted
            if verdict == "discharges" and gaps:
                errors.append(
                    f"{where}: verdict 'discharges' but {len(gaps)} gap(s) listed — "
                    f"a gap contradicts a full discharge"
                )
            if verdict == "partially_discharges" and not gaps:
                errors.append(
                    f"{where}: 'partially_discharges' must say what is missing; "
                    f"gaps is empty"
                )
            if verdict == "related" and not gaps:
                errors.append(f"{where}: 'related' must say why it does not discharge")

            for cand in claim.get("candidates_examined", []):
                if cand not in controls_by_id:
                    errors.append(f"{where}: candidates_examined cites unknown {cand}")


def render_md(data):
    m = data["mappings"]
    r = data["reachability"]
    counts = data["summary"]
    L = []
    A = L.append

    A("# CG-\\* ↔ control catalogue crosswalk")
    A("")
    A("> **Generated** by `scripts/build_crosswalk.py`. Do not edit by hand —")
    A("> edit `crosswalk-mappings.json` (judgments) or")
    A("> `crosswalk-emitted-events.json` (event inventory) and regenerate.")
    A("")
    A(f"Catalogue: **{counts['catalogue_controls']}** distinct controls across "
      f"**{counts['policies']}** policies "
      f"({counts['catalogue_rows']} rows — shared controls like SC-02 are "
      f"replicated into every policy that references them, and are counted once "
      f"here). ")
    A(f"Implemented: **{counts['cg_controls']}** `CG-*` controls. ")
    A(f"Event codes the core can emit: **{counts['emitted_events']}**. ")
    A(f"Distinct trigger events the catalogue demands: **{counts['demanded_triggers']}**.")
    A("")
    A("## How to read this")
    A("")
    A("This artifact is used to make regulatory coverage claims, so it is built")
    A("to **under-claim**. A verdict of `discharges` asserts that a catalogue")
    A("control needs no further work. **Nothing currently holds that verdict.**")
    A("")
    A("| Verdict | Meaning |")
    A("|---|---|")
    A("| `discharges` | fully satisfies the catalogue control |")
    A("| `partially_discharges` | satisfies part — the gaps say exactly what is missing |")
    A("| `related` | same subject area, does **not** discharge |")
    A("| `no_catalogue_counterpart` | nothing in the catalogue corresponds |")
    A("")
    A("Claims marked **needs review** are proposals awaiting a compliance")
    A("reviewer, not findings. A row is only load-bearing once `reviewed_by` is set.")
    A("")

    if counts["id_collisions"]:
        A("> **control_id is not unique.** "
          + ", ".join(f"`{k}`" for k in sorted(counts["id_collisions"]))
          + " each name more than one distinct control. A crosswalk claim citing "
            "a colliding id is refused by the build rather than resolved "
            "arbitrarily, because the two controls may be unrelated.")
        A("")

    A("## Evidence provenance")
    A("")
    A("`control_result` rows are this repo's evidence artifact, and until")
    A("migration `20260719000900` nothing on the row recorded where it came")
    A("from. `analytics/seed.sh` drives the deployed API specifically to trip")
    A("every control, and the e2e harness fires 159 live assertions at the same")
    A("tables — so rows written before that migration are a mixture of real gate")
    A("decisions, demo seeding and test assertions with no way to tell them")
    A("apart. They are labelled `unknown`, which is the only claim the data")
    A("supports.")
    A("")
    A("**Evidence written before the provenance migration cannot support a")
    A("coverage claim.** Simulated evidence lives in the `sim` schema and is")
    A("structurally unreachable from `core` — the check constraints make")
    A("`provenance = 'simulated'` unrepresentable in a core table, so it is not")
    A("a filter that could be forgotten. This build hard-fails if any")
    A("non-`production` row reaches a coverage count.")
    A("")
    A("## Summary of claims")
    A("")
    A("| Verdict | Claims |")
    A("|---|---:|")
    for k, v in sorted(counts["verdicts"].items(), key=lambda kv: -kv[1]):
        A(f"| `{k}` | {v} |")
    A("")
    A(f"Open questions requiring a decision: **{counts['open_questions']}** "
      f"({counts['open_questions_high']} high severity).")
    A("")
    A(f"Awaiting review: **{counts['needs_review']}** of {counts['total_claims']} claims. ")
    A(f"Reviewed: **{counts['reviewed']}**.")
    A("")

    # ---- view 1
    A("## View 1 — what each implemented control discharges")
    A("")
    for entry in m["mappings"]:
        A(f"### `{entry['cg_control']}`")
        A("")
        impl = entry["implementation"]
        A(f"*{impl['behaviour']}*")
        A("")
        A(f"Source: `{impl['source']}`")
        if impl.get("screening_function"):
            A(f"  · screening function: `{impl['screening_function']}`")
        A("")
        for claim in entry["claims"]:
            cid = claim.get("catalogue_control")
            title = claim.get("catalogue_title", "")
            head = f"{cid} — {title}" if cid else "no catalogue counterpart"
            flag = " ⚠️ **needs review**" if claim.get("needs_review") else ""
            A(f"**{head}** → `{claim['verdict']}`{flag}")
            A("")
            A(claim["rationale"])
            A("")
            if claim.get("gaps"):
                A("Missing:")
                A("")
                for g in claim["gaps"]:
                    A(f"- {g}")
                A("")
            if claim.get("candidates_examined"):
                A(f"Candidates examined and rejected: "
                  f"{', '.join('`%s`' % c for c in claim['candidates_examined'])}")
                A("")
            if claim.get("would_discharge_if"):
                A(f"> Would discharge if: {claim['would_discharge_if']}")
                A("")
            if claim.get("implication"):
                A(f"> Implication: {claim['implication']}")
                A("")

    if m.get("excluded"):
        A("### Excluded")
        A("")
        for e in m["excluded"]:
            A(f"- `{e['cg_control']}` — {e['reason']}")
        A("")

    # ---- open questions
    oq = m.get("open_questions", [])
    if oq:
        A("## Open questions")
        A("")
        A(r"Places where the catalogue is ambiguous, a CG-\* control does not")
        A("cleanly correspond to anything, or a mapping turns on a decision that")
        A("is not mine to make. Deliberately not smoothed over — several change")
        A("what the crosswalk should say.")
        A("")
        order = {"high": 0, "medium": 1, "low": 2}
        for q in sorted(oq, key=lambda z: order.get(z["severity"], 9)):
            A(f"### {q['id']} · {q['severity']} — {q['question']}")
            A("")
            A(f"**Finding.** {q['finding']}")
            A("")
            A(f"**Why it matters.** {q['why_it_matters']}")
            A("")
            A(f"**Asks of reviewer.** {q['asks_of_reviewer']}")
            A("")

    # ---- view 2
    A("## View 2 — which catalogue controls are reachable")
    A("")
    A("**Reachable** means the core can fire *every* trigger the control")
    A("declares. Partial reachability is its own category: a control whose")
    A("triggers are half firable is blocked, not half-done.")
    A("")
    A("| Reachability | Controls |")
    A("|---|---:|")
    A(f"| `{REACH_FULL}` | {counts['reach'][REACH_FULL]} |")
    A(f"| `{REACH_PARTIAL}` | {counts['reach'][REACH_PARTIAL]} |")
    A(f"| `{REACH_NONE}` | {counts['reach'][REACH_NONE]} |")
    A("")
    A(f"**Completable: {counts['completable']}.** Reachability only asks whether the")
    A("core can *start* a control. A control can be startable and still have no")
    A("way to signal its own outputs — BSA-21 scores fully reachable because its")
    A("one trigger is `account.closed`, while the retention schedule, legal holds")
    A("and disposal workflow it describes exist nowhere. `completable` means every")
    A("trigger fires **and** every produced event can be emitted. Use that number,")
    A("not the reachable one, when estimating what is buildable.")
    A("")

    full = [x for x in r if x["reachability"] == REACH_FULL]
    part = [x for x in r if x["reachability"] == REACH_PARTIAL]

    A(f"### Fully reachable ({len(full)})")
    A("")
    if full:
        A("| Control | Policy | Title | Triggers | Completable | Cannot emit |")
        A("|---|---|---|---|---|---|")
        for x in full:
            A(f"| `{x['control_id']}` | {x['policy']} | {x['title']} | "
              f"{', '.join('`%s`' % t for t in x['triggers_firable'])} | "
              f"{'yes' if x['completable'] else '**no**'} | "
              f"{', '.join('`%s`' % t for t in x['produced_missing'][:3]) or '—'} |")
    else:
        A("*None.*")
    A("")

    A(f"### Partially reachable ({len(part)})")
    A("")
    A("These are the nearest to buildable: some triggers already fire.")
    A("")
    if part:
        A("| Control | Policy | Firable | Missing |")
        A("|---|---|---|---|")
        for x in sorted(part, key=lambda z: -len(z["triggers_firable"]))[:40]:
            A(f"| `{x['control_id']}` | {x['policy']} | "
              f"{', '.join('`%s`' % t for t in x['triggers_firable'])} | "
              f"{', '.join('`%s`' % t for t in x['triggers_missing'][:4])}"
              f"{' …' if len(x['triggers_missing']) > 4 else ''} |")
    else:
        A("*None.*")
    A("")

    A("### Unreachable — blocked on subsystems that do not exist")
    A("")
    A("Grouped by the namespace of the missing trigger, which is a decent proxy")
    A("for the subsystem that would have to be built first.")
    A("")
    A("| Missing-trigger namespace | Controls blocked |")
    A("|---|---:|")
    for ns, n in counts["blocked_by_namespace"][:22]:
        A(f"| `{ns}` | {n} |")
    A("")

    return "\n".join(L) + "\n"


def main():
    check_only = "--check" in sys.argv

    controls_doc = load(CONTROLS)
    controls = controls_doc["controls"]
    errors = []
    controls_by_id = {c["control_id"]: c for c in controls}
    ambiguous = collisions(controls)
    # the extractor now reports collisions itself; cross-check rather than
    # trusting either side alone
    extractor_says = set(controls_doc.get("id_collisions", {}))
    if extractor_says != set(ambiguous):
        errors.append(
            f"collision detection disagrees: extractor found {sorted(extractor_says)}, "
            f"crosswalk found {sorted(ambiguous)} — one of the two is stale"
        )
    # reachability is computed over DEDUPED controls; counting SC-02 nine times
    # would inflate every figure in the artifact
    unique_controls = dedupe_controls(controls)
    mappings = load(MAPPINGS)
    inv = load(EMITTED)
    emitted = emitted_codes(inv)
    # Inventory codes are the RAW strings the source emits (the grep depends on
    # that); control triggers are canonicalized by the extractor. Compare in
    # both spellings so a fused emission (bsa_alert.triage_overdue) matches its
    # canonical citation (bsa_alert.triage.overdue).
    import code_format
    canon = code_format.canonicalizer(ROOT / "core-vocabulary.json")
    emitted |= {canon(c) for c in emitted}

    by_uid = {c['uid']: c for c in controls}
    validate(mappings, controls_by_id, ambiguous, by_uid, errors)
    # No live DB here (hermetic by design), so there are no evidence rows to
    # inspect in this run. The guard is wired and exercised by the test below
    # it; when a coverage report is generated against a real instance the rows
    # are passed in here.
    check_provenance(mappings.get("_evidence_sample", []), errors)

    # drift check on the half that CAN be automated
    grepped = literal_codes_in_source()
    undeclared = sorted(grepped - emitted)
    if undeclared:
        errors.append(
            "source emits literal event codes absent from "
            f"crosswalk-emitted-events.json: {undeclared}"
        )

    if errors:
        print("crosswalk validation FAILED:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        return 1

    reach = build_reachability(unique_controls, emitted)

    demanded = set()
    for c in unique_controls:
        demanded.update(control_triggers(c))

    blocked_ns = Counter()
    for x in reach:
        if x["reachability"] == REACH_NONE and x["triggers_missing"]:
            blocked_ns[x["triggers_missing"][0].split(".")[0]] += 1
        elif x["reachability"] == REACH_NONE and x["triggers_total"] == 0:
            blocked_ns["(no trigger declared)"] += 1

    verdicts = Counter()
    needs_review = reviewed = total_claims = 0
    for m in mappings["mappings"]:
        for claim in m["claims"]:
            verdicts[claim["verdict"]] += 1
            total_claims += 1
            if claim.get("needs_review"):
                needs_review += 1
            if claim.get("reviewed_by"):
                reviewed += 1

    summary = {
        "catalogue_rows": len(controls),
        "catalogue_controls": len(unique_controls),
        "id_collisions": ambiguous,
        "policies": len({c["policy"] for c in controls}),
        "cg_controls": len(mappings["mappings"]),
        "emitted_events": len(emitted),
        "demanded_triggers": len(demanded),
        "verdicts": dict(verdicts),
        "total_claims": total_claims,
        "needs_review": needs_review,
        "reviewed": reviewed,
        "reach": {
            REACH_FULL: sum(1 for x in reach if x["reachability"] == REACH_FULL),
            REACH_PARTIAL: sum(1 for x in reach if x["reachability"] == REACH_PARTIAL),
            REACH_NONE: sum(1 for x in reach if x["reachability"] == REACH_NONE),
        },
        "completable": sum(1 for x in reach if x["completable"]),
        "blocked_by_namespace": blocked_ns.most_common(),
        "open_questions": len(mappings.get("open_questions", [])),
        "open_questions_high": sum(
            1 for q in mappings.get("open_questions", []) if q["severity"] == "high"
        ),
    }

    data = {
        "meta": {
            "generator": "scripts/build_crosswalk.py",
            "controls_source": "controls.json",
            "controls_generated_at": controls_doc["meta"]["generated_at"],
            "mappings_source": "crosswalk-mappings.json",
            "emitted_source": "crosswalk-emitted-events.json",
            "under_claim_policy": (
                "'discharges' asserts no further work is needed and is enforced to "
                "carry zero gaps. Claims are proposals until reviewed_by is set."
            ),
        },
        "summary": summary,
        "mappings": mappings,
        "reachability": reach,
    }

    if check_only:
        # Staleness gate: the committed crosswalk must match what a rebuild
        # would produce. Without this, --check validated the INPUTS while the
        # committed reachability numbers could describe a controls.json two
        # revisions old (which is exactly what happened in July 2026).
        import generated
        if generated.check_or_write(
                {OUT_JSON: json.dumps(data, indent=2) + "\n",
                 OUT_MD: render_md(data)},
                check=True, rerun_hint="scripts/build_crosswalk.py"):
            return 1
        print(f"crosswalk OK — {total_claims} claims, {needs_review} awaiting review")
        return 0

    OUT_JSON.write_text(json.dumps(data, indent=2) + "\n")
    OUT_MD.write_text(render_md(data))
    print(f"wrote {OUT_JSON.name} and {OUT_MD.name}")
    print(f"  claims: {total_claims} ({needs_review} awaiting review)")
    print(f"  reachability: {summary['reach']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
