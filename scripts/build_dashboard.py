#!/usr/bin/env python3
"""Generate the compliance dashboard's policy hierarchy from controls.json.

The dashboard mirrors the repo's policy structure: one page per policy at
compliance/dashboard/<slug>/, driven by a manifest generated from the same
controls.json the crosswalk builds from — so the dashboard can never drift
from the catalogue without CI noticing.

  python3 scripts/build_dashboard.py           # regenerate manifest + stubs
  python3 scripts/build_dashboard.py --check   # fail if anything is stale

Outputs:
  compliance/dashboard/manifest.json      policy -> controls (id, title, anchor,
                                    citations, source link)
  compliance/dashboard/<slug>/index.html  one stub per policy, all identical: they
                                    load the shared app, which reads the
                                    policy slug from its own URL.
"""
import hashlib
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONTROLS = ROOT / "controls.json"
DASH = ROOT / "compliance" / "dashboard"

TITLES = {
    "audit": "Audit",
    "basel-ii-standardized-approach-framework": "Basel II Standardized Approach",
    "bsa": "BSA / AML",
    "business-continuity-plan": "Business Continuity",
    "capitalization": "Capitalization",
    "cash": "Cash Operations",
    "charitable-donation-accounts": "Charitable Donation Accounts",
    "collections": "Collections",
    "compliance": "Compliance Program",
    "director-fiduciary-duties": "Director Fiduciary Duties",
    "e-commerce": "E-Commerce",
    "electronic-payment-systems": "Electronic Payment Systems",
    "enterprise-risk-management": "Enterprise Risk Management",
    "fair-lending": "Fair Lending",
    "information-security": "Information Security",
    "internal-controls": "Internal Controls",
    "investment": "Investments",
    "lending": "Lending",
    "liquidity": "Liquidity",
    "member": "Membership",
    "privacy": "Privacy",
    "record-retention": "Record Retention",
    "reimbursement-insurance-indemnification": "Reimbursement & Indemnification",
    "resolution": "Resolution",
    "shared-controls": "Shared Controls",
    "third-party-risk": "Third-Party Risk",
    "truth-in-savings": "Truth in Savings",
}

REPO_BLOB = (
    "https://github.com/Cassandra-Labs-Foundation/cassandra-platform/blob/main/"
)

STUB = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cassandra — Compliance</title>
<link rel="stylesheet" href="../assets/style.css?v={v}">
</head>
<body>
<div id="root"></div>
<script src="../assets/app.js?v={v}"></script>
</body>
</html>
"""


def asset_version() -> str:
    """Content hash of the shared assets.

    Stamped into every asset URL so a rebuilt app.js can never be shadowed by
    a cached one. Learned the hard way: the manifest's own no-cache fix was
    invisible because the SCRIPT that fetches it was the stale thing.
    """
    h = hashlib.sha256()
    for name in ("style.css", "app.js"):
        h.update((DASH / "assets" / name).read_bytes())
    return h.hexdigest()[:12]


def title_for(slug: str, policy_title: str | None) -> str:
    # the hand-kept map wins: source-doc titles leak internal working names
    # ("... Policy (Table-First, Design-Overlay v2)")
    if slug in TITLES:
        return TITLES[slug]
    if policy_title:
        return policy_title
    return slug.replace("-", " ").title()


# The six gate controls are the RUNTIME layer — born in the banking core
# before the catalogue existed, enforced on every money movement, and the
# bulk of live evidence. They get their own page rather than being invisible.
GATE_POLICY = {
    "slug": "money-movement-gate",
    "title": "Money-Movement Gate (runtime)",
    "controls": [
        {"id": "CG-VEL-01", "title": "Cross-rail daily velocity cap ($25k/day, blocks)"},
        # Renamed from CG-CTR-01 (OQ-01, 2026-08-11): fires on electronic
        # movements only, none CTR-reportable — the old name asserted a filing
        # regime it never touched. Historical control_result rows keep the old id.
        {"id": "CG-LGTXN-01", "title": "Large electronic transaction monitor (> $10k, alert-only)"},
        {"id": "CG-STR-01", "title": "Inbound structuring — aggregate past $10k into one account"},
        {"id": "CG-STR-02", "title": "Outbound structuring — aggregate past $10k out of one account"},
        {"id": "CG-NSF-01", "title": "Insufficient funds (rejects before any hold)"},
        # STUB designation (OQ-02, 2026-08-11): the gate mechanism is real and
        # unbypassable, but the screen underneath is a literal /\bSDN\b/ token
        # match — no sanctions list, no list version, no payment-time screening.
        # The title must say so until a real SDN feed lands (TODO §8).
        {"id": "CG-OFAC-01", "title": "OFAC floor — unbypassable gate, STUB screen (no SDN list wired)", "stub": True},
    ],
}


def load_verdicts() -> dict[str, dict]:
    """Per-uid test verdicts from the two baselines the drill maintains.

    hermetic = control-tests.json (fake DB, frozen clock); live =
    control-tests-live.json (same spec against the real database). The
    dashboard shows both so an examiner sees the CLAIM (hermetic green), the
    PROOF (live green) and the gap between them (the fake-vs-real backlog).
    """
    out: dict[str, dict] = {}
    for tier, fname in (("hermetic", "control-tests.json"), ("live", "control-tests-live.json")):
        path = ROOT / fname
        if not path.exists():
            continue
        for r in json.loads(path.read_text())["results"]:
            v = out.setdefault(r["uid"], {
                "scoped_out": bool(r.get("scoped_out")),
                "scope_reason": r.get("scope_reason"),
            })
            v[tier] = r["status"]
    return out


def build_manifest() -> dict:
    data = json.loads(CONTROLS.read_text())
    verdicts = load_verdicts()
    policies: dict[str, dict] = {}
    for c in data["controls"]:
        slug = c["policy"]
        p = policies.setdefault(slug, {
            "slug": slug,
            "title": title_for(slug, c.get("policy_title")),
            "controls": [],
        })
        # the monitoring spec: what the heartbeat watches for this control —
        # trigger + produced event codes from the control's own rules, the
        # same codes the per-control tests fire and grade against
        rules = []
        watch: set[str] = set()
        for r in c.get("control_rules", []):
            trig = r.get("trigger_event")
            produced = r.get("produced_events", [])
            if trig:
                watch.add(trig)
            watch.update(produced)
            rules.append({
                "trigger": trig,
                "produced": produced,
                "inputs": r.get("required_inputs", []),
                "timer": r.get("deadline_timer"),
                "deadline_text": r.get("deadline_text"),
            })
        p["controls"].append({
            "id": c["control_id"],
            "uid": c["uid"],
            "title": c["title"],
            "doc": REPO_BLOB + c["source_file"] + "#" + c["anchor"],
            "citations": [
                {"text": r["text"], "url": r.get("url")}
                for r in c.get("regulatory_citations", [])
            ],
            "watch": sorted(watch),
            "rules": rules,
            "tests": verdicts.get(c["uid"], {}),
        })
    gate = {
        "slug": GATE_POLICY["slug"],
        "title": GATE_POLICY["title"],
        "controls": [
            {
                "id": c["id"],
                "uid": "money-movement-gate:" + c["id"],
                "title": c["title"],
                "stub": c.get("stub", False),
                "doc": REPO_BLOB + "core/supabase/functions/api/transfers.ts",
                "citations": [],
                # the gate's evidence is core.control_result, not produced
                # events — its heartbeat rides gate_heartbeat by control id
                "watch": [],
                "rules": [],
                "tests": {},
            }
            for c in GATE_POLICY["controls"]
        ],
    }
    ordered = sorted([*policies.values(), gate], key=lambda p: p["title"].lower())
    return {
        "generated_from": "controls.json + the runtime gate (build_dashboard.py)",
        "policy_count": len(ordered),
        "control_count": sum(len(p["controls"]) for p in ordered),
        "policies": ordered,
    }


def desired_files(manifest: dict) -> dict[pathlib.Path, str]:
    v = asset_version()
    files = {DASH / "manifest.json": json.dumps(manifest, indent=1) + "\n"}
    for p in manifest["policies"]:
        files[DASH / p["slug"] / "index.html"] = STUB.format(v=v)

    # the index is hand-written (it carries the explanatory header comment),
    # so its asset URLs are re-stamped in place rather than regenerated
    index = DASH / "index.html"
    files[index] = re.sub(
        r'(assets/(?:style\.css|app\.js))(\?v=[0-9a-f]+)?',
        lambda m: f"{m.group(1)}?v={v}",
        index.read_text(),
    )
    return files


def main() -> int:
    check = "--check" in sys.argv
    manifest = build_manifest()
    files = desired_files(manifest)

    stale = []
    for path, content in files.items():
        current = path.read_text() if path.exists() else None
        if current != content:
            stale.append(str(path.relative_to(ROOT)))
            if not check:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(content)

    if check:
        if stale:
            print("dashboard build STALE — run scripts/build_dashboard.py:")
            for s in stale:
                print(f"  - {s}")
            return 1
        print(
            f"dashboard OK — {manifest['policy_count']} policies, "
            f"{manifest['control_count']} controls"
        )
        return 0

    print(
        f"wrote manifest + {manifest['policy_count']} policy pages "
        f"({manifest['control_count']} controls)"
    )
    if stale:
        for s in stale:
            print(f"  updated {s}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
