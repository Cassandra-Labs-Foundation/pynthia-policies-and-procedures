# Cash Policy — Summary

> This document serves two purposes:
> 1. A plain-language summary of our Cash Policy that a regulator or
>    examiner can read end-to-end in a few minutes.
> 2. The canonical input that our regeneration task feeds into the shared
>    meta-prompt to produce the full Table-First, Design-Overlay v2 policy
>    document.
> 
> Edit this file directly when the policy's substance, scope, or ownership
> changes. The regenerated long-form policy is rebuilt from this summary plus
> the reference documents in `references/`.

---

## Organization and Ownership

**Organization:** Pynthia Credit Union
**Policy Owner:** Patrick Wilson, Chief Compliance Officer
**Approvers:**
- Patrick Wilson, Chief Compliance Officer

## 1. Purpose and Scope

This policy governs the safeguarding, control, and management of cash and cash-equivalent devices across Pynthia Credit Union, merging the former Cash Control and Cash Management policies into a single program. It applies to all employees who handle cash (tellers, vault custodians, branch managers, operations/accounting staff, armored-courier liaisons, and ATM/ITM custodians) and to all locations and channels where cash is received, disbursed, stored, shipped, or reconciled — branches, the operations center, ATMs/ITMs, cash recyclers, and night depositories. The Board delegates day-to-day control to management while retaining ultimate responsibility through limit approval, surprise counts, independent audits, and review of Supervisory Committee and regulatory examinations.

## 2. Key Regulatory Authorities

- **Federal Credit Union Act (FCUA)** — 12 U.S.C. Chapter 14 (e.g., §§1751–1795k); statutory foundation for credit union governance, board duties, the Supervisory Committee, fidelity bond authority, and safety-and-soundness expectations.
- **Bank Secrecy Act (BSA)** — 31 U.S.C. Subchapter II, including §5318(h); requires an AML program with internal controls, training, and independent testing that governs cash handling.
- **NCUA Security Program** — 12 CFR §748.1; requires a written security program with procedures for robberies, burglaries, and embezzlement, plus dual-control and assignment expectations.
- **BSA/AML Program rule** — 31 CFR §1020.210; board-approved AML program with internal controls, training, independent testing, and risk-based CDD.
- **Fidelity (Surety) Bond** — 12 CFR Part 713; minimum bond coverage and the board's duty to ensure adequate protection for cash exposures and seasonal adjustments.
- **Supervisory Committee Audits** — 12 CFR Part 715; surprise cash counts, verification, audit scope, and reporting to the Board.
- **Records Preservation & Retention** — 12 CFR Part 749; retention of reconciliation packs, count sheets, dual-control logs, device load sheets, and exception registers.

## 3. What This Policy Must Cover

Cash risk is concentrated wherever physical currency is held, moved, or reconciled — vaults, teller drawers, ATMs/ITMs, recyclers, petty cash, night drops, and cash shipments. The program quantifies limits, enforces dual control and segregation of duties, ties cash to the general ledger daily, and links exceptions into the BSA/AML governance cadence.

The policy must establish the following controls:

**(a) Governance & Delegation.** Maintain a board-approved, living policy; the Board approves the limits schedule, cash-risk KRIs feed the AML governance dashboard, and exceptions are tracked and reported on the BSA governance cadence with annual review, monthly KRIs, and quarterly Board summaries.

**(b) Scope & Applicability.** Tag all covered employees, activities, and locations/channels; update coverage before go-live of any new asset or role, documenting compensating reviews at small sites.

**(c) Enterprise Cash Limit.** Cap total cash at a board-approved percentage of total assets, auto-notify Treasury to invest excess, and remediate breaches the same day.

**(d) Location & Device Cash Limits.** Maintain per-asset limits for vault, teller, ATM, ITM/VTM, recycler, and petty cash; warn or block loads above limit without an exception ticket and enforce in real time, with dual custodians for vault/ATM/ITM/recycler operations.

**(e) Dual Control, Keys & Combos.** Enforce dual control for vault access, shipments, ATM/ITM loads, and night-drop retrieval; maintain a key/combination custodian registry and rotate on personnel change or at least every 90 days, with immediate revocation on termination.

**(f) Reconciliation & GL Controls.** Reconcile teller, vault, ATM/ITM, recyclers, and petty cash to the GL daily with same-day tie-out, clear suspense within defined aging, and separate custody from posting from reconciliation.

**(g) Over/Short Monitoring.** Track over/short per person and location, investigate variances within 1 business day, set coaching/discipline thresholds, report monthly, and signal recurring anomalies to AML case management.

**(h) ATM/ITM/Night-Drop & Shipments.** Apply dual control to device load/retrieval and night-drop handling with seal capture; log and verify inbound/outbound cash shipments same day against courier receipts and GL.

**(i) Surprise Cash Counts & Audits.** Perform surprise counts across tellers, vaults, and devices at least monthly per site, resolve variances within 1 business day, and feed results to Supervisory Committee/independent audit and AML independent testing.

**(j) Seasonal Deviations & Exceptions.** Require a formal Board deviation memo (reason, duration, revised limits, bond/insurance adjustment) approved before limits are exceeded, with whitelisted temporary limits that sunset on the end date.

**(k) Training & Competency.** Provide initial training within 30 days of hire and annual refreshers covering handling accuracy, counterfeit detection, fraud schemes, robbery/emergency response, dual control, and device/shipment procedures, with role-specific proficiency checks.

**(l) Monitoring, Reporting & Recordkeeping.** Publish monthly KPIs/KRIs within 15 calendar days of month end, maintain an attested exception log, retain required evidence per the records schedule, and provide examiner and AML independent-testing exports.

Governance of these controls is centralized with the Chief Compliance Officer, with Operations, Treasury/Finance, the BSA Officer, and the Supervisory Committee as required participants.

## 4. Out of Scope

- Member share and deposit account terms and disclosures — see Truth in Savings Policy and Member Policy.
- Investment of excess cash and liquidity management — see Investment Policy and Liquidity Policy.
- BSA/AML program design, SAR/CTR filing, and the Travel Rule — see BSA Policy (cash handling links to it but does not redefine it).
- Wire and ACH origination controls and electronic payment channels — see Electronic Payment Systems Policy.
- Information-security controls for cash-handling systems — see Information Security Policy.
- Record-retention schedules beyond cash-specific evidence — see Record Retention Policy.

## 5. System Design Notes

**This section is resolved dynamically at regeneration time.** The
regenerator must invoke the project-scoped `vocabulary` skill (see
`.skills/vocabulary/SKILL.md` at the project root) and inline its
entire stdout as the `DESIGN_NOTES` input to the shared meta-prompt.
Do not hand-curate event or field names here — the skill is the source
of truth and `core-vocabulary.json` evolves.

**Directive to the regenerator.** Before assembling the INPUTS block,
run the skill's extraction script from the project root:

    python3 .skills/vocabulary/scripts/extract_vocabulary.py

Capture the complete stdout verbatim and use it as `DESIGN_NOTES`. The
skill emits a self-contained Markdown block (per-entity field tables
plus events, endpoints, state machines, and plugins). Do not trim,
summarize, or reorder its output — the meta-prompt decides what is
relevant for the policy.

**Failure handling.** If the script exits non-zero, `core-vocabulary.json`
is missing, or the skill reports a parse error, record the failure in
the run summary and proceed with `DESIGN_NOTES` empty. Never invent
event codes or field names; the Design Overlay v2 blocks must only
cite codes that actually exist in the spec.

**Known state of the spec (as of regeneration time).** The parsed spec
is `Cassandra Banking Core API v1.0.0`, which is banking-core
(deposits, transfers, cards, BSA). Physical cash-handling entities and events — vault/teller/ATM/ITM/recycler cash limits, surprise-count and over/short records, key/combination rotation logs, night-drop and cash-shipment chain-of-custody, and seasonal limit deviations — are likely sparse or missing in a banking-core spec, so the regenerator must mark them `(Assumption—needs confirmation)` per the meta-prompt's MISSING INFO HANDLING rule.

## 6. Local Overrides to the Shared Meta-Prompt

{{Usually empty. Put anything here that should override the shared
`meta-prompt.md` for THIS policy only — a different control-ID prefix,
extra required sections, a specific citation style, etc. The regeneration
task applies overrides AFTER the shared meta-prompt, so instructions here
win.}}
