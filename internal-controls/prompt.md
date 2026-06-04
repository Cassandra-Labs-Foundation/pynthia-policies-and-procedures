# Internal Controls Policy — Summary

> This document serves two purposes:
> 1. A plain-language summary of our Internal Controls Policy that a regulator or
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

This policy establishes Pynthia Credit Union's internal control framework — the system of segregation of duties, authorizations, reconciliations, access controls, and management oversight that safeguards assets, ensures the reliability of financial reporting, and promotes compliance with laws and regulations. It applies to all operational and financial processes, business units, employees, and supporting systems across the credit union, including activities performed by third-party service providers on its behalf.

## 2. Key Regulatory Authorities

- **NCUA 12 CFR Part 715 (Supervisory Committee Audits and Verifications)** — requires an internal control structure supporting an annual audit and member account verification by the Supervisory Committee.
- **NCUA 12 CFR §741.3 (Criteria for Insurance)** — sound business and home office practices, including adequate internal controls and recordkeeping, as a condition of insurability.
- **NCUA 12 CFR Part 748 (Security Program, Suspicious Activity, and Records)** — internal controls over security, recordkeeping, and the BSA/AML compliance program.
- **Federal Credit Union Act (12 U.S.C. §1761b)** — Supervisory Committee duties to ensure internal controls are established and effectively maintained.
- **FFIEC and NCUA examiner guidance on internal controls** — expectations for the control environment, risk assessment, control activities, information and communication, and monitoring (COSO-aligned framework).

## 3. What This Policy Must Cover

Internal control risk at Pynthia is concentrated wherever a single individual could initiate, approve, record, and conceal a transaction; where reconciliations, access provisioning, or override authority are weak; and where management lacks timely, reliable evidence that controls are operating as designed.

The policy must establish the following controls:

**(a) Control Environment and Governance.** Define the control framework, assign control ownership for each material process, and establish board and Supervisory Committee oversight, with the framework reviewed at least annually.

**(b) Segregation of Duties.** Ensure no single individual can control all phases of a transaction (initiation, authorization, custody, recording, and reconciliation); the system must detect and block incompatible-duty combinations and log attempted violations.

**(c) Authorization and Approval Limits.** Maintain a role-based authority matrix defining transaction and approval limits, requiring documented approval before execution and dual control for high-risk transactions.

**(d) Reconciliations.** Require timely reconciliation of general ledger, subsidiary ledgers, suspense, and clearing accounts (daily for cash and high-volume accounts, monthly for others), with aged reconciling items escalated and resolved within defined timeframes.

**(e) Access and Change Controls.** Provision system access on least-privilege and need-to-know principles, review entitlements periodically (at least annually and on role change), and enforce change-management approval for changes to financial systems and control configurations.

**(f) Exception and Override Management.** Capture every control override or exception with rationale and approver, route above-limit exceptions for senior approval, and produce override analytics for management and audit.

**(g) Monitoring and Self-Assessment.** Perform ongoing control self-assessments and management testing, track deficiencies to remediation with owners and due dates, and report results to the board and Supervisory Committee.

**(h) Audit Trail and Recordkeeping.** Maintain complete, tamper-evident audit logs of transactions and control events and retain control documentation in line with regulatory and internal retention requirements.

Governance of these controls is centralized with the Chief Compliance Officer, with process owners, Finance, Internal Audit, and the Supervisory Committee as required participants.

## 4. Out of Scope

- Information security and logical access technical controls — see Information Security Policy.
- Enterprise risk appetite and risk taxonomy — see Enterprise Risk Management Policy.
- Internal and Supervisory Committee audit execution and scope — see Audit Policy.
- BSA/AML program controls specifically — see BSA Policy.
- Third-party/vendor control assurance (e.g., SOC reports) — see Third-Party Risk Policy.
- Record retention schedules generally — see Record Retention Policy.

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
(deposits, transfers, cards, BSA). Internal-control governance entities and events — segregation-of-duties rules, role/authority matrices, reconciliation runs and breaks, access-entitlement reviews, control overrides, and self-assessment/deficiency tracking — are likely sparse or absent in a banking-core spec, so the regenerator must mark them `(Assumption—needs confirmation)` per the meta-prompt's MISSING INFO HANDLING rule.

## 6. Local Overrides to the Shared Meta-Prompt

{{Usually empty. Put anything here that should override the shared
`meta-prompt.md` for THIS policy only — a different control-ID prefix,
extra required sections, a specific citation style, etc. The regeneration
task applies overrides AFTER the shared meta-prompt, so instructions here
win.}}
