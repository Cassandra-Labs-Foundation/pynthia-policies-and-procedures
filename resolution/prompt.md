# Resolution Policy — Summary

> This document serves two purposes:
> 1. A plain-language summary of our Resolution Policy that a regulator or
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

Pynthia Credit Union maintains a minimal, testable resolution framework to protect member funds and ensure orderly continuity, handover, or wind-down under stress. The policy enables the institution to monitor leading indicators, place itself into controlled "safe mode," freeze or limit transactions at the account or institution level, pivot to trustee/conservator operations, and restore member-facing services by the next business day where feasible. It applies to all products, channels, partners, and systems enumerated in the scope registry, and integrates with the institution's Business Continuity, Information Security, and BSA/AML controls.

## 2. Key Regulatory Authorities

- **Federal Credit Union Act (12 USC §1786(h), §1787)** — Triggers and powers for conservatorship, appointment of a conservator/liquidating agent, and liquidation.
- **NCUA Part 709 (12 CFR Part 709)** — Involuntary liquidation of federal credit unions, including claims priorities, setoff, and share-insurance payout mechanics.
- **NCUA Part 748 (12 CFR §748.0–§748.3)** — Security program, catastrophic-act reporting, and BSA compliance for incident-response integration and reporting.
- **NCUA Part 749 (12 CFR Part 749)** — Records-preservation program, requiring reproducible records for handover.
- **NCUA Part 741 (12 CFR Part 741)** — Requirements for insurance and related safety-and-soundness expectations for insured credit unions.
- **Share Insurance (12 USC §1781–§1790d, selected; §1787 for payouts)** — Member access and coverage during resolution.
- **NCUA Part 708b (12 CFR Part 708b)** — Mergers, including emergency assisted mergers as a resolution contingency.

## 3. What This Policy Must Cover

Resolution risk concentrates at the transition from stressed-but-going-concern operations into regulator-directed wind-down: the institution must be able to detect deterioration early, throttle outflows without cutting members off, and hand a clean, reproducible operating environment to a conservator. The policy must define a clear scope, decision rights, and tested mechanics for each escalation stage.

The policy must establish the following controls:

**(a) Policy Scope.** Maintain a machine-readable scope registry enumerating in-scope products, channels, critical vendors, and critical systems (with RTO/RPO targets), updated within 5 business days of any material change and published to control engines within 24 hours of approval, so freezes, limits, and exports apply deterministically (12 CFR Part 741; §748.0–§748.2).

**(b) Early-Warning Indicators.** Maintain a ruleset that shifts the institution into Prepared or Elevated posture when liquidity, net-outflow, capital/PCA, payment-failure, or CAMELS-proxy thresholds breach, evaluated hourly during business hours and daily after hours, damped by a two-consecutive-interval rule (FCUA §1786/§1787; Part 741).

**(c) Safe-Mode Transaction Controls.** Toggle a safe-mode flag that sets daily and per-transaction outbound caps, channel allowlists, and onboarding controls while preserving read-only access, applied within 60 minutes of trigger and propagated to all processors within 30 minutes of the core change, keeping critical inbound credits (payroll, benefits) open (12 CFR Part 748).

**(d) Targeted Account Freeze.** Freeze specified member accounts/entities, block debits, and allow regulator-approved credits within 30 minutes of approval, honoring legal garnishment precedence and joint/fiduciary edge cases (FCUA §1787; Part 748).

**(e) Institution-Wide Freeze.** Set a global FROZEN state on Board emergency resolution or NCUA directive within 60 minutes, with public/member notice within 2 hours and confirmation to the regulator (FCUA §1786/§1787).

**(f) Next-Business-Day Availability.** Ensure the member portal/API supports balance inquiry, statement download, claims instructions, and contact routing (read-only if needed) by the next local business open following a freeze or handover (Part 741; §1787).

**(g) Trustee/Conservator Handover.** Generate and deliver a standardized handover packet and provision scoped trustee access, with an initial version within 4 hours and full delivery within 24 hours of an NCUA appointment notice (FCUA §1786(h), §1787; 12 CFR Part 709).

**(h) Records Preservation for Resolution.** Build a Part 749-compliant resolution records package (member/share/loan ledgers, ACH/card histories, GL, governance minutes, contracts, BSA logs) with signed checksums and encrypted archives, started within 2 hours and completed within 24 hours, plus retained monthly snapshots (12 CFR Part 749; Part 709/§1787).

**(i) Testing & Validation.** Run semiannual failover drills, quarterly restore tests, and an annual trustee tabletop, publishing reports within 10 business days post-test and remediating high-risk items within 30 days (12 CFR §748.0–§748.2; safety/soundness).

**(j) Governance & Review Cadence.** Maintain a resolution RACI and exception register, conduct a quarterly operational review by day 20, and update the policy within 30 days of any material change (FCUA; Part 741; §748.2).

Governance of these controls is centralized with the Chief Compliance Officer, with the Board, CEO, Risk Engineering, IT/DevOps, Communications, and the BSA/AML Officer as required participants, and Internal Audit testing effectiveness.

## 4. Out of Scope

- Pre-resolution early-warning indicators, contingency funding, and "less than well-capitalized" liquidity triggers — see Liquidity Policy.
- Prompt-Corrective-Action capital tiers that drive when resolution planning activates — see Capitalization Policy.
- Operational continuity and disaster recovery for going-concern disruptions — see Business Continuity Plan.
- Retention schedules underlying the resolution records package — see Record Retention Policy.
- SAR/CTR preservation mechanics and BSA program — see BSA Policy.
- Vendor contract continuity through receivership — see Third-Party Risk Policy.

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
(deposits, transfers, cards, BSA). Resolution-specific entities and events such as institution-level safe-mode/freeze states, risk-posture transitions, trustee/conservator handover packets and scoped access roles, resolution records-package manifests with checksums, and failover/restore test results are likely sparse or missing in a banking-core spec, so the regenerator must mark them `(Assumption—needs confirmation)` per the meta-prompt's MISSING INFO HANDLING rule.

## 6. Local Overrides to the Shared Meta-Prompt

{{Usually empty. Put anything here that should override the shared
`meta-prompt.md` for THIS policy only — a different control-ID prefix,
extra required sections, a specific citation style, etc. The regeneration
task applies overrides AFTER the shared meta-prompt, so instructions here
win.}}
