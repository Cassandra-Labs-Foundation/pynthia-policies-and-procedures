# Capitalization — Drafting Notes

## Reference doc value (Patrick)
*"Attached policy is very light but fine for a starting point."*

→ `33 Capital Policy.pdf` is a thin starting point. Use the structural skeleton but expect to triple it in depth when drafting the canonical.

## Canonical drafting work needed
The existing `capitalization.md` is brief. A complete capital policy typically covers:

1. **Purpose & Scope** — applies to all capital-impacting decisions.
2. **Capital Adequacy Framework** — minimum thresholds for:
   - **CET1** (Common Equity Tier 1) ratio.
   - **Tier 1** capital ratio.
   - **Total capital ratio.**
   - **Tier 1 leverage ratio.**
   - **Capital conservation buffer** (2.5% on top of minimums under Basel III).
3. **Prompt Corrective Action (PCA) Thresholds** — internal triggers above the regulatory PCA thresholds (well-capitalized / adequately-capitalized / undercapitalized / significantly undercapitalized / critically undercapitalized).
4. **Capital Planning** — annual capital plan, multi-year forward look, stress scenarios.
5. **Capital Stress Testing** — methodology, scenarios (base / adverse / severely adverse), governance.
6. **Internal Capital Adequacy Assessment Process (ICAAP)** — risk-based assessment beyond regulatory minimums.
7. **Capital Actions** — dividend declarations, share buybacks, capital raises, redemptions.
8. **Triggers & Escalation** — what happens when ratios approach thresholds.
9. **Reporting** — frequency to Board / management, content of capital reports.
10. **Review & Approval** — annual policy review, Board approval cadence.

## Tight interaction with adjacent policies
- **`basel-ii-standardized-approach-framework/`** — this dir holds the risk-weight methodology that *feeds* the ratio calculations in this policy. Cross-reference, don't duplicate the risk-weight tables.
- **`liquidity/`** — the merged liquidity policy already includes CFP-handling for "becoming less than well-capitalized" scenarios; align trigger levels.
- **`enterprise-risk-management/`** — capital is one of the major risk categories under RA-02 taxonomy.
- **`contingency-funding-plan/` (now in `liquidity/`)** — undercapitalization restrictions on funding sources (brokered deposits, national rate cap).

## DFPI scope
- **California Financial Code** capital requirements for state-chartered institutions.
- **DFPI minimum capital expectations** — may exceed federal minimums; check current DFPI examination guidance.
- **Federal: Basel III standardized approach** (12 CFR Part 324 for FDIC, Part 217 for Reg Q FRB, Part 3 for OCC) — applies to all insured depository institutions.
- **PCA framework** under 12 USC § 1831o (FDICIA) — applies regardless of regulator; thresholds are well-capitalized (10% total / 8% Tier 1 / 6.5% CET1 / 5% leverage), adequately-capitalized, etc.
- If Pynthia is a state-chartered credit union: **NCUA risk-based capital rule** doesn't apply (federal only), but DFPI sets state expectations.

## Capital actions specific to early-stage / regulated institutions
- **Common stock issuance** — Reg D / Reg A / Reg S exemptions if private placement.
- **Subordinated debt** as Tier 2 capital — regulatory approval requirements.
- **Capital injections from parent / holding company** — Source of Strength doctrine (12 USC § 1831o-1).
- **Dividend restrictions** — earnings-based limits, regulatory pre-approval if exceeding limits.
