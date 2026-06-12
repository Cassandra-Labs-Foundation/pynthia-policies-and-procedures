# Record Retention Policy — Summary

> This document serves two purposes:
> 1. A plain-language summary of our Record Retention Policy that a regulator or
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

Pynthia Credit Union maintains a comprehensive record-retention and destruction program that establishes minimum retention periods for records, provides for the systematic and consistent disposal of obsolete records, and ensures records can be promptly produced for examiners, auditors, and legal investigations. The program covers retention for compliance, legal (statute-of-limitations), administrative, and managerial reasons, and applies to all Pynthia directors, officers, and employees and to records in any form — paper, imaged, microform, or electronic media — including records held by the core processor and email archives. A product-appropriate retention schedule (Schedule A) is maintained for Pynthia's actual deposit, lending, and payment activities.

## 2. Key Regulatory Authorities

- **California Financial Code** — State record-retention provisions applicable to DFPI-chartered institutions.
- **CCPA / CPRA** — Personal-information retention and deletion rights for consumers (cross-reference Privacy Policy).
- **Interagency Guidelines Establishing Information Security Standards (12 CFR Part 364, App. B)** — Administrative, technical, and physical safeguards governing the security and destruction of customer-information records.
- **Bank Secrecy Act recordkeeping (31 CFR §1010.430)** — 5-year retention of BSA/AML records.
- **Regulation B / ECOA (12 CFR Part 1002)** — 25-month retention of credit-application records.
- **Regulation Z / TILA (12 CFR Part 1026)** — 3-year retention after disclosure.
- **Regulation CC (12 CFR Part 229)** — 2-year retention.
- **Regulation E (12 CFR Part 1005)** — 2-year retention.
- **HMDA / Regulation C (12 CFR Part 1003)** — Loan/application register retention.
- **GLBA, FCRA, and IRS retention rules** — Privacy, consumer-report, and tax-record retention requirements.

## 3. What This Policy Must Cover

Retention risk concentrates in two failure modes: destroying records too early (and losing the ability to demonstrate compliance or defend a claim) and keeping records too long (raising security, cost, and CCPA-deletion exposure). The policy must assign clear ownership, define retention periods by record class, and govern defensible, certified destruction.

The policy must establish the following controls:

**(a) Responsibility and Administration.** Designate a single senior owner (SVP-level, Operations & Finance) responsible for monitoring retention and destruction and reporting to the Board, with each department naming a records-retention contact accountable for proper completion of retention in its area.

**(b) Retention Schedule (Schedule A).** Maintain a record-retention schedule keyed to Pynthia's actual products and services, applying federal minimums (e.g., BSA 5 years, Reg B 25 months, Reg Z 3 years after disclosure, Reg CC/Reg E 2 years) and California Financial Code overlays; records substantially similar to scheduled items inherit the appropriate period. Do not carry over Alabama Banking Code schedules.

**(c) Retention Methods and Electronic-Record Integrity.** Permit retention in any reproducible form (hard copy, imaging, microform, electronic media) provided electronic records remain accurate, accessible, and of sufficient integrity for examiners to determine financial condition and the substance of transactions.

**(d) Annual Policy and Schedule Review.** Review the policy and Schedule A at least annually, revising for changes in state/federal reporting requirements, products/services, complexity, consumer-compliance requirements, technology, and storage costs.

**(e) Document Destruction.** Destroy records only after the documented destruction date, using a licensed destruction vendor in accordance with 12 CFR Part 364 App. B, with two-person verification (initialed destruction log) and retention of the vendor's destruction certificate.

**(f) Destruction Logging and Storage Convention.** Maintain a Destruction Log (Exhibit 1) per department for examiner review and label storage boxes with Box Number, Content Description, From/To Dates, and Destruction Date matching the log.

**(g) Legal Holds.** Suspend scheduled destruction for records subject to litigation, investigation, or subpoena until the hold is released.

**(h) Core Processor and Email Archives.** Hold each department accountable for confirming proper retention timeframes for records maintained on the core processor's electronic archive, and assign IT responsibility for email archives with periodic retrievability testing.

**(i) Training.** Provide annual record-retention training to all employees, with department-specific training developed by each records-retention contact.

Governance of these controls is centralized with the Chief Compliance Officer, with the SVP of Operations & Finance, department records-retention contacts, IT, and Internal Audit as required participants.

## 4. Out of Scope

- The substantive BSA/AML program (only its recordkeeping periods are referenced) — see BSA Policy.
- Loan file and collections records management beyond retention periods — see Lending Policy and Collections Policy.
- Deposit and cash operations records beyond retention periods — see Cash Policy.
- Security safeguards and email-system controls — see Information Security Policy.
- Consumer personal-information deletion rights — see Privacy Policy.
- Employee/HR personnel records (no dedicated HR policy in this repository).

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
(deposits, transfers, cards, BSA). Record-retention-specific entities and events such as record-class retention schedules, retention-expiry and legal-hold flags, destruction logs and vendor destruction certificates, and email/archive retrievability test results are likely sparse or missing in a banking-core spec, so the regenerator must mark them `(Assumption—needs confirmation)` per the meta-prompt's MISSING INFO HANDLING rule.

## 6. Local Overrides to the Shared Meta-Prompt

{{Usually empty. Put anything here that should override the shared
`meta-prompt.md` for THIS policy only — a different control-ID prefix,
extra required sections, a specific citation style, etc. The regeneration
task applies overrides AFTER the shared meta-prompt, so instructions here
win.}}
