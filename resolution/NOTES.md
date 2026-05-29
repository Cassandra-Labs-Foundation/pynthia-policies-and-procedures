# Resolution — Drafting Notes

## Reference docs
- **`resolutions-handbook.pdf`** — FDIC Resolutions Handbook (revised Jan 15, 2019). The canonical regulator-side reference on how failed-bank resolution actually works (least-cost test, P&A transactions, bridge banks, payouts). Use to understand the regulator's playbook so the institution's policy aligns with what FDIC will do.
- **`boa-1207.pdf`** — Bank of America Title I resolution plan / "Living Will" (Dodd-Frank §165(d) filing). A model for what a large-bank resolution plan looks like — likely overkill for Pynthia's actual scope but useful as a structural reference for the *content* of a resolution plan.

## Scope clarification
"Resolution" at a small/early-stage state-chartered institution usually does NOT mean a Dodd-Frank §165(d) Living Will (that's only for institutions with >$50B in assets after 2018 EGRRCPA threshold change). For Pynthia the policy more likely covers:

1. **Recovery Plan** — what management does to recover before resolution (overlaps with `liquidity/` CFP).
2. **Resolution Planning** — orderly wind-down procedures the institution prepares for the FDIC's benefit.
3. **Safe-mode controls** — transaction-level controls during stress (the existing RZ-02 section).
4. **Account freeze procedures** — targeted (RZ-03) and institution-wide (RZ-04).
5. **Next-business-day availability** — depositor access continuity (RZ-05).
6. **Trustee / conservator handover** — when DFPI or FDIC takes over (RZ-06).
7. **Records preservation** — what must be ready for FDIC at point of resolution (RZ-07).

The existing canonical already has RZ-00..RZ-09 covering this scope. Good backbone.

## Canonical drafting work needed
Existing sections RZ-00..RZ-09 cover:
- Scope, EWIs, safe mode, targeted freeze, institution-wide freeze, next-business-day availability, trustee/conservator handover, records preservation for resolution, testing/validation, governance/review cadence.

Strong starting point. Drafting enrichment from references:
- **From `resolutions-handbook.pdf`:** what data FDIC needs at point of failure (insured/uninsured deposit split, loan files, IT systems inventory, vendor contracts, key personnel). Use to expand RZ-07 (records preservation).
- **From `boa-1207.pdf`:** structural sections of a formal resolution plan (executive summary, material entities, critical operations, core business lines, MIS, interconnections, funding/liquidity profile, capital, recovery indicators, resolution strategy). Adapt for Pynthia's scale.

## DFPI scope
- **California Financial Code** — DFPI receivership powers for state-chartered institutions; covers when DFPI can take possession, conservatorship procedures, depositor protections.
- **Federal: FDIA § 11** (12 USC § 1821) — FDIC receivership; least-cost test; P&A transactions.
- **Dodd-Frank §165(d) Title I plans** — only required for very large institutions (originally >$50B, raised to >$250B for most banks under EGRRCPA 2018). Almost certainly does NOT apply to Pynthia.
- **NCUA Part 749** — only if federal CU.
- **State CU resolution** under Cal Fin Code Div 5 if Pynthia is a state-chartered credit union.

## Tight interaction with adjacent policies
- **`liquidity/`** — early warning indicators, contingency funding plan, "becoming less than well-capitalized" triggers are pre-resolution. Resolution policy picks up where CFP ends.
- **`capitalization/`** — PCA tiers (well-capitalized → adequately → undercapitalized → significantly undercapitalized → critically undercapitalized) drive when resolution planning kicks in.
- **`business-continuity-plan/`** — BCP handles operational continuity; resolution handles institutional wind-down. Different but related.
- **`record-retention/`** — RZ-07 records preservation must align with retention schedules.
- **`bsa/`** — SAR / CTR records must be preserved through resolution.
- **`third-party-risk/`** — vendor contracts and continuity through receivership.
