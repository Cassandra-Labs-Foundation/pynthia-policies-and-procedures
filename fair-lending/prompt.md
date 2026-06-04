# Fair Lending Policy — Summary

> This document serves two purposes:
> 1. A plain-language summary of our Fair Lending Policy that a regulator or
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

This policy prohibits discrimination in all lending activities and ensures equal access to credit for all creditworthy applicants. It sets required controls, timing, and records to comply with ECOA/Reg B, FHA/NCUA, Reg Z, and related rules across marketing, origination, servicing, collections, and third parties. It applies to every stage of the credit lifecycle — inquiries, application, evaluation, pricing, appraisal, action-taken notices, monitoring data collection, advertising, and record retention — and to third parties acting for the Credit Union.

## 2. Key Regulatory Authorities

- **ECOA / Reg B (12 CFR Part 1002)** — covers all credit, including inquiries (§1002.5), evaluation (§1002.6), action-taken notices (§1002.9), retention (§1002.12), monitoring (§1002.13), appraisals/ROV (§1002.14), definitions (§1002.2), and the prohibition (§1002.4).
- **FHA / HUD / NCUA** — 42 USC §3605; 24 CFR Part 100; 12 CFR 701.31 — govern real-estate-related transactions and signage/advertising.
- **HMDA / Reg C (12 CFR Part 1003, incl. §1003.4)** — governs GMI collection, the LAR, and submission/disclosure where applicable.
- **TILA / Reg Z (12 CFR §1026.24; §1026.36(d),(e))** — govern advertising, Loan Originator compensation, and anti-steering.
- **ADA (28 CFR Part 36; 29 CFR Part 1630)** — access and reasonable accommodation.
- **FCRA / Reg V (15 USC §1681 et seq.; §615), interagency appraisal-independence rules, and CFPB UDAAP standards** — related requirements affecting adverse-action content and fair treatment.

## 3. What This Policy Must Cover

Fair-lending risk is concentrated wherever discretion, proxies, or data quality can produce disparate treatment, disparate impact, or redlining — in underwriting and pricing, advertising and geo-targeting, GMI/LAR integrity, action-taken notice timing, and third-party conduct (for which ECOA liability flows to the creditor). Controls must combine system enforcement with documented human review and Board oversight.

The policy must establish the following controls:

**(a) Prohibition & Protected Bases.** System and staff must not use protected traits or proxies (e.g., ZIP/neighborhood, property age/location) at any stage and must avoid unjustified disparate impact and redlining; Compliance approves the protected-trait list and proxy guardrails, with annual policy review and quarterly Board reporting.

**(b) Permissible Inquiries.** Limit questions on spouse, marital status, sex, childbearing, and immigration to what is permitted and present required disclosures before sensitive fields are collected, targeting 100% of applications with proper disclosures.

**(c) Evaluation & Pricing Rules.** Use demonstrably/statistically sound scoring or documented judgmental criteria, never assign negative factors for elderly applicants, treat public-assistance income equally, and require pricing-exception capture and approval, with monthly Compliance exception review by the 10th.

**(d) Appraisal Independence & ROV.** Do not rely on biased appraisals, separate valuation staff from production influence, and provide a reconsideration-of-value pathway with outcomes logged and ROV review within 15 days of request.

**(e) Action-Taken Notices.** Generate and send notices per the timing matrix — completed application approve/counter/deny within 30 days, incomplete within 30 days, existing-account adverse action within 30 days, unaccepted counteroffer within 90 days, small-business phone credit (≤$1MM revenue) within a "reasonable time" — including a score block when a score is used; target on-time rate ≥ 99.5% with zero breaches.

**(f) Government Monitoring (GMI/HMDA).** For covered transactions, ask but do not require GMI, record via visual/surname rule where required if declined, and maintain LAR accuracy with quarterly LAR QC and annual submission per the Reg C calendar.

**(g) Advertising & Fair Housing.** Enforce trigger-term disclosures and APR prominence, apply the Fair Housing legend to real-estate ads, prohibit exclusionary geo-targeting, and require a pre-flight checklist approval before launch, targeting 100% of ads with a completed checklist.

**(h) LO Compensation & Anti-Steering.** Prohibit compensation based on loan terms or proxies and present/document meaningful alternatives (lowest rate, lowest fees, lowest total cost), blocking finalization without evidence; where fewer than three eligible options exist, require a Compliance waiver.

**(i) Third-Party Fair-Lending Oversight.** Perform due diligence at vendor onboarding and require a monthly Fair-Lending MI pack (applications, approvals, pricing, exceptions, complaints) due by the 5th business day, escalating corrective action plans as needed.

**(j) Monitoring & Reviews.** Run quarterly disparity analytics (applications/approvals/price/terms/denials/exceptions) due within 30 days of quarter close and an annual redlining review by Q1, with Board reporting and corrective actions; disparity deltas beyond thresholds trigger a CAP.

**(k) Training.** Provide role-based onboarding within 30 days of role start plus annual training by December 31 (including contractors and third parties), tracking completion to ≥ 98% and refreshing on rule/product changes.

**(l) Record Retention.** Retain records per the grid — consumer applications/decisions and existing-account adverse actions 25 months, business credit ≤$1MM 12 months, certain business credit >$1MM 60 days (extended to 12 months if reasons or retention requested), HMDA/GMI and LO-comp per their calendars, and self-tests 25 months — extending all on litigation/investigation hold.

Governance of these controls is centralized with the Chief Compliance Officer, with Lending Operations, Analytics, Third-Party Risk Management, Legal, HR, and Marketing as required participants, and Board reporting at least quarterly.

## 4. Out of Scope

- General consumer and mortgage lending underwriting standards and credit policy — see Lending Policy.
- Collections operations and procedures (beyond fair-lending conduct) — see Collections Policy.
- Model development, validation, and governance for scoring models — see Enterprise Risk Management Policy and the Model Risk Management Program.
- Third-party onboarding and oversight program mechanics — see Third-Party Risk Policy.
- Privacy notices and data handling — see Privacy Policy.
- General record-retention schedules outside fair-lending records — see Record Retention Policy.

## 5. System Design Notes

**This section is resolved dynamically at regeneration time.** The
regenerator must invoke the project-scoped `vocabulary` skill (see
`.skills/vocabulary/SKILL.md` at the project root) and inline its
entire stdout as the `DESIGN_NOTES` input to the shared meta-prompt.
Do not hand-curate event or field names here — the skill is the source
of truth and `vocabulary.json` evolves.

**Directive to the regenerator.** Before assembling the INPUTS block,
run the skill's extraction script from the project root:

    python3 .skills/vocabulary/scripts/extract_vocabulary.py

Capture the complete stdout verbatim and use it as `DESIGN_NOTES`. The
skill emits a self-contained Markdown block (per-entity field tables
plus events, endpoints, state machines, and plugins). Do not trim,
summarize, or reorder its output — the meta-prompt decides what is
relevant for the policy.

**Failure handling.** If the script exits non-zero, `vocabulary.json`
is missing, or the skill reports a parse error, record the failure in
the run summary and proceed with `DESIGN_NOTES` empty. Never invent
event codes or field names; the Design Overlay v2 blocks must only
cite codes that actually exist in the spec.

**Known state of the spec (as of regeneration time).** The parsed spec
is `Cassandra Banking Core API v1.0.0`, which is banking-core
(deposits, transfers, cards, BSA). Lending and fair-lending entities and events — loan applications and decisions, underwriting inputs and credit scores, pricing exceptions, action-taken notices, GMI/HMDA LAR records, appraisal/ROV records, and anti-steering option sets — are likely sparse or absent in a deposits-centric banking-core spec, so the regenerator should mark them `(Assumption—needs confirmation)` per the meta-prompt's MISSING INFO HANDLING rule.

## 6. Local Overrides to the Shared Meta-Prompt

{{Usually empty. Put anything here that should override the shared
`meta-prompt.md` for THIS policy only — a different control-ID prefix,
extra required sections, a specific citation style, etc. The regeneration
task applies overrides AFTER the shared meta-prompt, so instructions here
win.}}
