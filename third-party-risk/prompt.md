# Third-Party Risk Policy — Summary

> This document serves two purposes:
> 1. A plain-language summary of our Third-Party Risk Policy that a regulator or
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

Pynthia Credit Union uses vendors and other third parties to deliver products and services, but the Board and management remain fully responsible for safety and soundness, BSA/AML, sanctions, consumer protection, privacy, and capital adequacy. This combined Third-Party Risk policy (merging the former Vendor Management and Outsourcing policies) governs how the institution identifies, assesses, approves, contracts with, monitors, and exits third-party relationships across the full lifecycle. It applies to all third parties receiving compensation or accessing nonpublic member or operational data, and serves as the minimum standard for governance, lifecycle controls, and engineering requirements.

## 2. Key Regulatory Authorities

- **Interagency Guidance on Third-Party Relationships: Risk Management (88 FR 37920)** — Lifecycle and governance expectations (planning, due diligence, contracting, monitoring, termination, governance) for banking organizations.
- **BSA / AML & CIP (31 CFR Chapter X; 31 CFR §1020.220)** — BSA/AML program and CIP obligations; the institution remains responsible even when a third party performs onboarding, KYC, monitoring, or sanctions screening.
- **NCUA Part 748 (12 CFR Part 748, incl. §748.0, §748.2, Appendices A & B)** — Security program, BSA procedures, safeguarding of member information, and incident-response and member-notice expectations where vendors are involved.
- **GLBA / Regulation P (12 CFR Part 1016)** — Privacy notices and limits on sharing and reuse of nonpublic personal information by nonaffiliated third parties.
- **Bank Service Company Act (12 USC §1867(c))** — Notification of certain service-provider contracts and examination authority over service companies (Assumption—application depends on charter and primary regulator).
- **NCUA BSA/AML oversight** — Examination expectations for BSA/AML, including third-party arrangements; credit unions remain responsible for BSA/AML compliance even when using vendors.

## 3. What This Policy Must Cover

Third-party risk concentrates wherever a vendor performs a core/capital-impacting function, touches member NPI or network connectivity, or supports BSA/AML, KYC, or sanctions activities — because outsourcing the activity never outsources the responsibility. The policy must enforce a risk-based lifecycle (Planning → Due Diligence → Contracting → Ongoing Monitoring → Termination) with explicit criticality tiering and visibility into fourth-party subcontractors.

The policy must establish the following controls:

**(a) Governance & Accountability.** Maintain an authoritative vendor-governance configuration mapping Board, committees, and management roles to third-party responsibilities, require Board/committee approval for the policy and material vendors, re-approve at least annually, and have Internal Audit review the program at least every 24 months (Interagency Guidance; 12 CFR Part 748).

**(b) Vendor Inventory & Criticality Classification.** Maintain a centralized inventory of all third parties receiving compensation or accessing data, classify by inherent risk and criticality (Critical/Material/Minor/Exempt), flag core/capital-impacting/BSA roles and NPI/network access, add vendors before contract execution, and reconcile against AP/procurement at least quarterly (Interagency Guidance; NCUA safeguarding).

**(c) Risk Assessment & Planning.** Require a pre-contract, risk-proportionate assessment (strategic, financial, operational, compliance, BSA/AML, reputation, cyber, capital/liquidity) completed and approved before execution for Medium/High-risk vendors, with emergency provisional engagements flagged for full review within 30 days (Interagency Guidance; 12 USC §1867(c) where applicable).

**(d) Due Diligence & AML/KYC Expectations.** Require a due-diligence package proportional to risk, enhanced due diligence for any onboarding/KYC/AML/sanctions/monitoring vendor (including a documented BSA/AML responsibility split), completion before any production data or NPI is shared, and EDD refresh at least annually (31 CFR §1020.220; NCUA BSA; Interagency Guidance).

**(e) Contract Standards & Regulatory Clauses.** Enforce a standard clause library (scope/SLAs, party responsibilities and subcontractor oversight, GLBA/Reg P data security, BSA/AML and sanctions, audit and examination rights, BCP/DR, termination and exit assistance) with all required clauses checked before execution, Legal and Risk sign-off for capital-impacting/core contracts, and an exceptions log; review the library at least annually (Interagency Guidance; GLBA/Reg P; Part 748).

**(f) Outsourcing of Core & Capital-Impacting Functions.** Tag vendors operating core/ledger/card systems, settlement/funding flows, or critical BSA/AML processes as mandatory High inherent risk, requiring annual comprehensive review, board-level awareness, and enhanced exit/contingency planning tested at least every 24 months (Interagency Guidance; BSA/AML; Part 748).

**(g) Ongoing Monitoring, Performance & Risk Reporting.** Define a risk-proportionate monitoring plan (annual for High, every 2 years for Medium, every 3 years for Low), collect SOC reports/metrics/pen-tests, require remediation plans for high-severity issues within 30 days, and report High/Medium vendor status to the Board (Interagency Guidance; Part 748).

**(h) Incident & Breach Reporting.** Require vendors to notify the institution of incidents within a contractual SLA (e.g., 24 hours of discovery), triage internally within 1 business day, and map handling to SAR, member-notice, and regulator-notice requirements per Part 748 Appendix B (12 CFR Part 748 App. A & B; BSA SAR rules; Interagency Guidance).

**(i) Termination & Exit Strategy.** Maintain an exit strategy (alternates, data migration/deletion, transition timelines) for all critical/capital-impacting vendors within 90 days of onboarding, refreshed and approved before any termination notice (Interagency Guidance; GLBA safeguarding during transition).

**(j) Key Third-Party Owners & RACI.** Maintain and publish a register of Critical and Material relationships with assigned business, risk, compliance/BSA, and technical owners, completed before go-live and reviewed at least annually; block contract execution where ownership is unresolved (Interagency Guidance).

Governance of these controls is centralized with the Chief Compliance Officer, with the Vendor Risk team, Legal, Procurement, Finance, Information Security/IT, business owners, and Internal Audit as required participants.

## 4. Out of Scope

- Vendor information-security and data-protection control requirements — see Information Security Policy.
- BSA/AML due diligence on payment processors and the broader BSA program — see BSA Policy.
- Vendor record retention and destruction schedules — see Record Retention Policy.
- Vendor contingency planning and operational continuity — see Business Continuity Plan.
- Privacy-specific contractual clauses and NPPI sharing limits — see Privacy Policy.
- Material outsourcing implications for enterprise risk appetite — see Enterprise Risk Management Policy.

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
(deposits, transfers, cards, BSA). Third-party-risk-specific entities and events such as the vendor inventory and criticality classification, vendor risk assessments and due-diligence packages, contract clause-coverage records, vendor monitoring cycles and ratings, vendor incident reports, and exit plans are likely sparse or missing in a banking-core spec, so the regenerator must mark them `(Assumption—needs confirmation)` per the meta-prompt's MISSING INFO HANDLING rule.

## 6. Local Overrides to the Shared Meta-Prompt

{{Usually empty. Put anything here that should override the shared
`meta-prompt.md` for THIS policy only — a different control-ID prefix,
extra required sections, a specific citation style, etc. The regeneration
task applies overrides AFTER the shared meta-prompt, so instructions here
win.}}
