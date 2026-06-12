# Compliance Policy — Summary

> This document serves two purposes:
> 1. A plain-language summary of our Compliance Policy that a regulator or
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

This policy establishes Pynthia Credit Union's Compliance Management System (CMS) — the governance, responsibilities, training, monitoring, and assurance framework that keeps the credit union in compliance with all applicable federal and California (DFPI) laws and regulations. It applies to the Board, executive management, the compliance function, department managers, and every employee. The CMS is built to Prevent, Detect, and Correct compliance issues, and the compliance function maintains a direct reporting line to the Board (or its Audit/Risk committee) that does not route through executive management, preserving independence.

## 2. Key Regulatory Authorities

- **Equal Credit Opportunity Act (ECOA) / Regulation B** — nondiscrimination in credit.
- **Truth in Lending Act (TILA) / Regulation Z** — consumer credit disclosures.
- **Home Mortgage Disclosure Act (HMDA) / Regulation C** — mortgage data collection and reporting.
- **Expedited Funds Availability Act / Regulation CC** — funds availability.
- **Electronic Fund Transfer Act / Regulation E** — electronic transfers and error resolution.
- **Truth in Savings Act / Regulation DD** — deposit account disclosures.
- **Gramm-Leach-Bliley Act (GLBA) / Regulation P** — privacy of consumer financial information and safeguarding.
- **Bank Secrecy Act (BSA) and USA PATRIOT Act** — AML/CIP/CDD/OFAC obligations.
- **Real Estate Settlement Procedures Act (RESPA) / Regulation X** — settlement-service practices.
- **Fair Housing Act** — nondiscrimination in housing-related lending.
- **Fair Credit Reporting Act (FCRA) / FACTA** — consumer reporting and identity-theft Red Flags.
- **Fair Debt Collection Practices Act (FDCPA) / Regulation F** — debt-collection conduct.
- **SAFE Act** — mortgage loan originator registration.
- **Military Lending Act (MLA) and Servicemembers Civil Relief Act (SCRA)** — servicemember protections.
- **UDAAP — Dodd-Frank Act §§ 1031 & 1036** — unfair, deceptive, or abusive acts or practices.
- **California Consumer Financial Protection Law (CCFPL)** — DFPI consumer-protection authority.
- **California Financing Law; Rosenthal Fair Debt Collection Practices Act; Holden Act; California Homeowner Bill of Rights; CCPA/CPRA; Unruh Civil Rights Act** — California overlays examined by DFPI.

## 3. What This Policy Must Cover

Compliance risk is concentrated in governance independence, regulatory-change management, training coverage, and the quality of monitoring and assurance. This is primarily a governance policy demonstrating a sound, board-supervised process; substantive product rules live in their owning policies.

The policy must establish the following controls:

**(a) Governance & Reporting Line.** Define how compliance flows from the Board to the people doing the work; the compliance function reports directly to the Board (or Audit/Risk committee) on a line that does not route through executive management, and the Compliance Officer reports to the Board at least quarterly on regulatory changes, policies for approval, training, and audit/exam findings and corrective actions.

**(b) Scope of Applicable Laws.** Maintain a current inventory of all federal and California laws and regulations applicable to the credit union's products and activities, updated as regulations change.

**(c) Roles & Responsibilities.** Assign the Compliance Officer responsibility for the CMS (risk assessments, policies/procedures/internal controls, training coordination, complaint monitoring, exam and consultant coordination), with department managers responsible for compliance in their functional areas and a designated backup (CFO and/or Operations Officer) if the Compliance Officer cannot serve.

**(d) Risk Assessments.** Conduct periodic compliance risk assessments to prioritize monitoring and assurance activity.

**(e) Training Standards.** Require every employee to be trained on compliance (a baseline expectation of every regulator); set standards for initial onboarding training and annual refreshers, retain attendance records (Compliance and HR), and allow the compliance team to assign remedial training.

**(f) Monitoring & Assurance Reviews.** Perform ongoing compliance monitoring and assurance reviews of regulated activities, documenting what was reviewed over the trailing 12 months and the findings, so results are replicable.

**(g) Independent Audit.** Subject the compliance system to an external/independent audit at least annually that reviews the assurance reviews themselves and can replicate the findings; route findings, responses, and corrective actions to the Board.

**(h) Regulatory-Change & Complaint Management.** Direct regulatory correspondence to the Compliance Officer, analyze and implement required changes (procedures and training), and manage consumer complaints as a compliance signal.

**(i) Review Cadence.** State a clear review cadence — the policy and CMS are reviewed and re-approved by the Board at least annually and upon material regulatory change.

Governance of these controls is centralized with the Chief Compliance Officer, with the Board (and its Audit/Risk committee), department managers, Human Resources, and Internal Audit as required participants.

## 4. Out of Scope

- Substantive BSA/AML program design and SAR/CTR filing — see BSA Policy.
- Fair-lending testing and adverse-action methodology — see Fair Lending Policy.
- Member privacy and GLBA safeguarding mechanics — see Privacy Policy and Information Security Policy.
- Loan-collection conduct and complaint SLAs specific to collections — see Collections Policy.
- Internal audit charter and the broader internal-control framework — see Audit Policy and Internal Controls Policy.
- Loans to insiders and director conflicts (Reg O) — see Director Fiduciary Duties Policy and Lending Policy.
- Detailed record-retention schedules — see Record Retention Policy.

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
(deposits, transfers, cards, BSA). Compliance-governance entities and events — the regulatory-requirement inventory, compliance risk assessments, monitoring/assurance review records, training assignments and completions, complaint cases, and audit/exam findings with corrective-action tracking — are likely sparse or missing in a banking-core spec, so the regenerator must mark them `(Assumption—needs confirmation)` per the meta-prompt's MISSING INFO HANDLING rule.

## 6. Local Overrides to the Shared Meta-Prompt

{{Usually empty. Put anything here that should override the shared
`meta-prompt.md` for THIS policy only — a different control-ID prefix,
extra required sections, a specific citation style, etc. The regeneration
task applies overrides AFTER the shared meta-prompt, so instructions here
win.}}
