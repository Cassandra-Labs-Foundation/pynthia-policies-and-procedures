#!/usr/bin/env python3
"""Generate the compliance dashboard's policy hierarchy from controls.json.

The dashboard mirrors the repo's policy structure: one page per policy at
docs/dashboard/<slug>/, driven by a manifest generated from the same
controls.json the crosswalk builds from — so the dashboard can never drift
from the catalogue without CI noticing.

  python3 scripts/build_dashboard.py           # regenerate manifest + stubs
  python3 scripts/build_dashboard.py --check   # fail if anything is stale

Outputs:
  docs/dashboard/manifest.json      policy -> controls (id, title, anchor,
                                    citations, source link)
  docs/dashboard/<slug>/index.html  one stub per policy, all identical: they
                                    load the shared app, which reads the
                                    policy slug from its own URL.
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONTROLS = ROOT / "controls.json"
DASH = ROOT / "docs" / "dashboard"

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
    "https://github.com/Cassandra-Labs-Foundation/pynthia-policies-and-procedures/blob/main/"
)

STUB = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cassandra — Compliance</title>
<link rel="stylesheet" href="../assets/style.css">
</head>
<body>
<div id="root"></div>
<script src="../assets/app.js"></script>
</body>
</html>
"""


def title_for(slug: str, policy_title: str | None) -> str:
    if policy_title:
        return policy_title
    if slug in TITLES:
        return TITLES[slug]
    return slug.replace("-", " ").title()


def build_manifest() -> dict:
    data = json.loads(CONTROLS.read_text())
    policies: dict[str, dict] = {}
    for c in data["controls"]:
        slug = c["policy"]
        p = policies.setdefault(slug, {
            "slug": slug,
            "title": title_for(slug, c.get("policy_title")),
            "controls": [],
        })
        p["controls"].append({
            "id": c["control_id"],
            "title": c["title"],
            "doc": REPO_BLOB + c["source_file"] + "#" + c["anchor"],
            "citations": [
                {"text": r["text"], "url": r.get("url")}
                for r in c.get("regulatory_citations", [])
            ],
        })
    ordered = sorted(policies.values(), key=lambda p: p["title"].lower())
    return {
        "generated_from": "controls.json",
        "policy_count": len(ordered),
        "control_count": sum(len(p["controls"]) for p in ordered),
        "policies": ordered,
    }


def desired_files(manifest: dict) -> dict[pathlib.Path, str]:
    files = {DASH / "manifest.json": json.dumps(manifest, indent=1) + "\n"}
    for p in manifest["policies"]:
        files[DASH / p["slug"] / "index.html"] = STUB
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
