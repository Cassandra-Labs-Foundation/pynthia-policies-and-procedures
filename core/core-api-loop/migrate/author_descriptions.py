#!/usr/bin/env python3
"""
author_descriptions.py — make the spec render as rich GitBook docs (field tables + model pages).

Two doc-quality issues both reduce to the same spec-side lever — descriptions:
  * Field tables vs JSON blobs: GitBook's OpenAPI integration renders schemas as field tables, but
    a table of un-described rows is barely better than a blob. 84% of fields carry x-bound-controls;
    this derives a description for each ("Evidences control(s) BSA-04.") — reproducible, no
    fabrication, and it turns every field table into a compliance-aware reference.
  * Data-model pages for the nouns: GitBook generates a page per components/schema. The 57 real
    resources (Account, AccountNumber, Entity, ...) had no summary; this applies authored one-liners
    from the committed descriptions-overlay.yaml so each model page opens with a real description.

Must run AFTER derive_bound_controls.py (it reads x-bound-controls). Idempotent and vocab-safe:
descriptions never touch field paths/types, so core-vocabulary.json and the policies are unchanged.

--resync: clear every description that is PURE generated text ("Evidences
control(s) <ids>.") before re-deriving, so a rebinding (x-bound-controls
regenerated from a renamed control catalogue) cannot leave descriptions
asserting bindings the spec no longer carries. Authored prose never matches
the pattern and is never touched.
"""
from __future__ import annotations
import os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
import yaml
import sys as _sys; _sys.path.insert(0, os.path.join(REPO, "scripts"))
import spec_io
SPEC = os.path.join(REPO, "core", "core-api.yaml")
OVERLAY = os.path.join(HERE, "descriptions-overlay.yaml")
DUMP = dict(sort_keys=False, default_flow_style=False, width=120, allow_unicode=True)
GENERATED = re.compile(r"^Evidences controls? [A-Z][A-Z0-9-]*(?:, [A-Z][A-Z0-9-]*)*\.$")


def main() -> int:
    resync = "--resync" in sys.argv[1:]
    doc = spec_io.load_spec(SPEC)
    schemas = doc["components"]["schemas"]
    overlay = yaml.safe_load(open(OVERLAY).read()) if os.path.exists(OVERLAY) else {}
    # flatten {kind: {Name: desc}} -> {Name: desc}
    res_desc = {name: d for group in overlay.values() if isinstance(group, dict)
                for name, d in group.items()}

    res_set = field_set = cleared = 0
    for name, schema in schemas.items():
        if not isinstance(schema, dict):
            continue
        # resource page summary (overlay is the source of truth for the 57 real nouns)
        if name in res_desc and schema.get("description") != res_desc[name]:
            schema["description"] = res_desc[name]; res_set += 1
        # field descriptions derived from control bindings (only where absent — don't clobber authored)
        for pn, pp in (schema.get("properties") or {}).items():
            if not isinstance(pp, dict):
                continue
            if resync and GENERATED.match(pp.get("description") or ""):
                del pp["description"]; cleared += 1
            if pp.get("description"):
                continue
            cids = pp.get("x-bound-controls")
            if cids:
                noun = "control" if len(cids) == 1 else "controls"
                pp["description"] = f"Evidences {noun} {', '.join(cids)}."
                field_set += 1

    spec_io.dump_spec(doc, SPEC)
    print(f"author_descriptions: {res_set} resource descriptions applied (overlay), "
          f"{field_set} field descriptions derived from x-bound-controls"
          + (f" ({cleared} stale generated descriptions cleared)" if resync else ""))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
