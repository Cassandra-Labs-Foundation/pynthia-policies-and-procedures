#!/usr/bin/env python3
"""
reconcile_transfers.py — split transfers by rail (the original architecture-doc model).

Decision: per-rail AchTransfer/WireTransfer are canonical (they have the distinct ACH vs wire
state machines D8/D9 define). The unified rail-discriminator `Transfer` is de-unified into the D8
on-us *book* transfer (drops `rail` + the `WireDetails` blob), so two transfer models no longer
compete on one surface. The per-rail counterparties are typed (no more bare strings).

Constrained by reality: policies cite beneficiary.* and originator.* codes, so those party schemas
stay; only the uncited unified-model cruft (Transfer.rail/wire, WireDetails) is removed. /transfers
is kept (architecture-mandated, D8). All changes are vocab-safe for cited codes.

This script is idempotent and edits a schema that contracts derive from, so it must BRACKET
author_contracts: the orphan WireDetails can only be pruned once author_contracts has regenerated
the /transfers requestBody without its (now-removed) Transfer.wire $ref. Canonical pipeline:
  scaffold_banking -> author_contracts -> reconcile_transfers -> author_contracts
    -> reconcile_transfers -> enrich_openapi -> normalize_spec -> derive_bound_controls
(reconcile pass 1 de-unifies + retypes; pass 2 prunes the orphan; both are no-ops if already done.)
"""
import json, os, sys
HERE=os.path.dirname(os.path.abspath(__file__)); REPO=os.path.abspath(os.path.join(HERE,"..",".."))
import yaml
SPEC=os.path.join(REPO,"core-api.yaml")
DUMP=dict(sort_keys=False,default_flow_style=False,width=120,allow_unicode=True)

def main():
    doc=yaml.safe_load(open(SPEC).read()); S=doc["components"]["schemas"]; changed=[]
    # 1. de-unify Transfer: drop the multi-rail pretense (rail + wire) -> D8 book transfer
    if "Transfer" in S:
        for f in ("rail","wire"):
            if f in (S["Transfer"].get("properties") or {}):
                del S["Transfer"]["properties"][f]; changed.append(f"Transfer.{f} removed")
        S["Transfer"]["description"]="On-us / book transfer (D8). External rails use AchTransfer / WireTransfer."
    # 2. delete WireDetails if now unreferenced
    if "WireDetails" in S and '"#/components/schemas/WireDetails"' not in json.dumps(doc):
        del S["WireDetails"]; changed.append("WireDetails deleted (orphan)")
    # 3. type the per-rail counterparties (bare string -> typed party schema)
    for res,field,party in (("AchTransfer","counterparty","Counterparty"),
                            ("WireTransfer","beneficiary","Beneficiary")):
        p=(S.get(res,{}).get("properties") or {}).get(field)
        if isinstance(p,dict) and p.get("type")=="string" and party in S:
            S[res]["properties"][field]={"$ref":f"#/components/schemas/{party}"}
            changed.append(f"{res}.{field} -> $ref {party}")
    open(SPEC,"w").write(yaml.safe_dump(doc,**DUMP))
    print("changes:"); [print("  -",c) for c in changed]
    return 0
raise SystemExit(main())
