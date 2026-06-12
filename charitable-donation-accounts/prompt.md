# Charitable Donation Accounts Policy — Summary

> This document serves two purposes:
> 1. A plain-language summary of our Charitable Donation Accounts Policy that a regulator or
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

This policy governs the establishment and operation of Charitable Donation Accounts (CDAs) used to support mission-aligned charitable giving under the FCU incidental-powers rule. It applies to all CDA structures, the trustees and managers that hold or manage CDA assets, and the staff and committees that fund, monitor, distribute from, account for, and terminate CDAs. When a CDA satisfies every condition of 12 CFR §721.3(b)(2), its investments are not limited by Part 703; the credit union caps aggregate CDA book value at no more than 5% of net worth, distributes at least 51% of Total Return to Qualified Charities at least every five years and again at termination, and prohibits affiliate fees from the CDA.

## 2. Key Regulatory Authorities

- **FCU Incidental Powers — Charitable Donation Accounts** — 12 CFR §721.3(b)(2)(i)–(vii); sets the CDA conditions: the ≤5% net-worth cap and cure period, segregation/labeling, trustee/manager qualification, required agreement clauses (A)–(D), the ≥51%-of-Total-Return distribution at least every 5 years and at termination, liquidation including distribution-in-kind, and definitions including Qualified Charity and Affiliate.
- **Investments (context)** — 12 CFR Part 703; the FCU investment limits that otherwise apply but do **not** apply to a CDA when §721.3(b)(2) is met.
- **Qualified Charity (tax status)** — 26 U.S.C. §501(c)(3); defines donee eligibility.
- **ADA (accessibility of public communications)** — 28 CFR Part 36; accessibility of CDA-related web pages and public announcements.

## 3. What This Policy Must Cover

CDA risk is concentrated in maintaining the regulatory safe harbor: if any §721.3(b)(2) condition fails, Part 703 relief is lost. The program therefore enforces the cap, segregation, qualified vendors, required agreement clauses, distribution cadence, GAAP accounting, and the prohibition on affiliate fees.

The policy must establish the following controls:

**(a) Governance & Ownership.** The Board adopts and annually re-adopts this policy and approves CDA structures, vendors, strategy/limits, and distributions; quarterly board reporting (cap utilization, performance, window coverage, exceptions) is due within 30 days of quarter-end, and CDA actions are blocked if the policy is expired.

**(b) Definitions.** Maintain a central glossary (CDA, Qualified Charity, Total Return, Distribution in Kind, Affiliate, Net Worth, Book Value) that powers validations, calculations, and reporting.

**(c) Structure & Segregation.** Require a segregated custodial account or SPE/trust labeled "Charitable Donation Account," with structure selected and evidence packet assembled before first funding.

**(d) Trustee & Manager Qualification.** Onboard only trustees that are regulated and any non-CU discretionary manager that is an SEC-registered investment adviser or OCC-regulated; validate at onboarding, review annually, and escalate a registration lapse to the Board within 2 business days.

**(e) Written Agreement — Required Clauses (A)–(D).** Block funding unless the agreement names Qualified Charities (A), states investment strategy/risk (B), requires GAAP accounting (C), and sets distribution frequency per §721.3(b)(2)(v) (D); amendments require Board re-approval.

**(f) Funding Cap — Monitoring & Cure.** Keep aggregate CDA book value at no more than 5% of net worth (internal buffer default 4%); run monthly and quarter-end cap tests, block funding on projected breach, and cure any breach within 30 calendar days.

**(g) Investment Strategy & Risk Limits.** Apply Board-approved prudent overlays (single-issuer, sector, liquidity, volatility, drawdown) with pre-trade and monthly post-trade checks even though Part 703 limits do not apply.

**(h) Charity Eligibility & Giving Rules.** Validate donee EIN and IRS §501(c)(3)/(c)(19) status, track the rolling five-year window, and distribute at least 51% of Total Return at least every 5 years and at termination (default annual cadence by Dec 31).

**(i) Accounting, Reporting & Records.** Enforce GAAP entries, perform monthly reconciliations, maintain Call Report Account 789H mapping, and issue the quarterly Board/ALCO packet within 30 days of quarter-end.

**(j) Third-Party Risk Management.** Run life-cycle due diligence on trustees/managers (regulatory status, financials, SOC/ISO, BCP/DR, fees/conflicts), review annually, require contracts with a 90-day termination and asset-transfer steps, and escalate material issues within 2 business days.

**(k) Internal Controls & Testing.** Require dual approvals for distributions at or above $5,000, segregation of duties, automated cap checks, quarterly valuation reviews, and annual Internal Audit testing with tracked remediation.

**(l) Termination.** At termination, satisfy the ≥51% closing distribution and receive remaining assets in cash or in-kind only if otherwise permissible FCU investments; report within 30 days post-close.

**(m) Conflicts & Fees.** Block payment of any CDA fees or expenses to the credit union or its affiliates (preserving the Total Return definition) via a payee blocklist and quarterly fee review, escalating conflicts within 5 business days.

**(n) Communications & Accessibility.** Apply a pre-publication ADA/WCAG checklist to CDA web pages and press, with Marketing and Compliance approval and archived artifacts.

Governance of these controls is centralized with the Chief Compliance Officer, with the CFO/Controller, ALCO, TPRM, Legal, and the Board as required participants.

## 4. Out of Scope

- General FCU investment portfolio limits and permissible investments — see Investment Policy (Part 703 context).
- Trustee/manager vendor management beyond CDA-specific diligence — see Third-Party Risk Policy.
- Enterprise financial reporting and Call Report production beyond the 789H CDA mapping — see Capitalization Policy and Record Retention Policy.
- Website accessibility standards generally — see Compliance Policy and E-Commerce Policy.

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
(deposits, transfers, cards, BSA). CDA-specific entities and events — segregated charitable-donation-account structures, trustee/manager registration tracking, Total Return and net-worth cap tests, five-year distribution windows, Qualified Charity EIN/IRS verification, and Call Report 789H mapping — are likely sparse or missing in a banking-core spec, so the regenerator must mark them `(Assumption—needs confirmation)` per the meta-prompt's MISSING INFO HANDLING rule.

## 6. Local Overrides to the Shared Meta-Prompt

{{Usually empty. Put anything here that should override the shared
`meta-prompt.md` for THIS policy only — a different control-ID prefix,
extra required sections, a specific citation style, etc. The regeneration
task applies overrides AFTER the shared meta-prompt, so instructions here
win.}}
