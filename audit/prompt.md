# Audit Policy — Summary

> This document serves two purposes:
> 1. A plain-language summary of our Audit Policy that a regulator or
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

This policy charges Pynthia Credit Union to perform regular, risk-focused reviews of its key controls, systems, and procedures to confirm that effective controls are implemented and that risk management practices are sound. It establishes the frequency and objectives of audits based on risk assessment results, requires that audits be conducted or reviewed by parties independent of those who develop or maintain the programs under review, and ensures results are reported to the Audit Committee and the Board of Directors. It applies to all operational, compliance, financial, and IT functions of the credit union and to the work of internal and external auditors.

## 2. Key Regulatory Authorities

- **NCUA Supervisory Committee Audit (12 CFR Part 715)** — requires the Supervisory/Audit Committee to obtain an annual audit of the credit union's books and records and to oversee the audit function independent of management.
- **NCUA 12 CFR Part 748** — requires periodic independent testing of the credit union's security and compliance programs by staff independent of those that develop or maintain them.
- **Regulatory audit manuals (CFPB, OCC, FDIC, Federal Reserve)** — used to develop, change, and implement audit work programs; programs are updated when regulatory guidance changes.

## 3. What This Policy Must Cover

Audit risk concentrates in the independence and authority of the audit function and in the timely identification, reporting, tracking, and remediation of control deficiencies. The policy must ensure the audit function reports functionally to the Audit Committee (not management), has unrestricted access to records, personnel, and systems, and that findings are escalated and closed through disciplined governance.

The policy must establish the following controls:

**(a) Board of Directors Oversight.** The Board establishes the Audit Committee, reviews testing results to ensure sufficient resources are invested to implement and test approved controls, and reviews and approves this policy at least annually.

**(b) Audit Committee Governance and Independence.** A designated Audit Committee oversees the audit function, meeting at least monthly. It develops and manages the audit program, approves audit frequencies, schedules, objectives, and scope, engages external auditors, promptly reviews and approves audit reports, delivers results to the Board, and oversees responses. The committee holds hiring/firing authority over the Chief Audit Executive and controls the audit budget to preserve independence.

**(c) Internal Auditor Independence and Reporting.** The Internal Auditor reports functionally to the Audit Committee rather than to management, conducts audits per the approved scope and schedule, has unrestricted access to records, personnel, and systems, holds no operational responsibilities, and reports findings and recommendations on a timely basis.

**(d) Risk-Based Audit Scope and Frequency.** Auditors submit an annual general audit scope, frequency schedule, and risk assessment to the Audit Committee for approval. Audits are tentatively scheduled monthly then finalized; frequency is adjusted based on prior audit ratings and control strength, with all scope/frequency changes documented in work papers. At a minimum, defined audit types are executed at least annually.

**(e) Audit Types and Network Assessments.** A range of risk-focused audits is conducted at least annually, including administrative audits, baseline compliance audits, social engineering assessments, and acceptable use assessments, plus technical assessments on internal and external IT systems (vulnerability assessments, penetration tests, and system configuration assessments).

**(f) Audit Reporting and Work Papers.** Each audit report documents scope and objective, dates of coverage, findings and deficiencies, recommendations, root cause, management responses, responsible party, and implementation date, with an overall and per-finding risk rating (High/Moderate/Low). Audit work papers document the procedures followed and provide sufficient evidence to support all conclusions.

**(g) Finding Tracking and Escalation.** Findings from internal and external audits and examinations are tracked, monitored, and followed up with department supervisors. Findings are reviewed at the Compliance Committee monthly; findings older than three months are escalated to the Audit Committee/Board; all findings are formally reported to the Audit Committee at least quarterly.

**(h) Management Response and Risk Acceptance.** Management responds with a remediation action plan or formally accepts the risk no later than 30 days from the final report date. Risk acceptance must be fully documented, provided to the Audit Committee, and generally requires Board-level approval to close.

**(i) Follow-Up Audits.** Internal Audit reviews all identified findings prior to closure to confirm appropriate remediation; poor prior audit ratings drive enhanced audit review frequency.

**(j) Work Paper Retention and Physical Control.** Work papers and audit reports are retained for seven years after the audit report date. Work papers are the property of Internal Audit, kept under their control and in a secure location; requests for access by persons outside Internal Audit require Audit Committee approval.

Governance of these controls is centralized with the Chief Compliance Officer, with the Audit Committee, Board of Directors, and Internal Audit as required participants.

## 4. Out of Scope

- Detailed audit operating procedures (work papers preparation, sample sizing, exit interviews, audit work programs) — maintained as operating procedures, not in this policy.
- Information security control testing and IT audit execution — see Information Security Policy.
- BSA/AML independent testing — see BSA Policy (control BA-15).
- Day-to-day internal control design and ownership — see Internal Controls Policy.
- Enterprise risk taxonomy and risk assessment methodology — see Enterprise Risk Management Policy.

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
(deposits, transfers, cards, BSA). Audit-domain entities and events such as audit engagements, work papers, findings, risk ratings, corrective-action tracking, and Audit Committee approvals are likely sparse or absent in a banking-core spec, so the regenerator should mark them `(Assumption—needs confirmation)` per the meta-prompt's MISSING INFO HANDLING rule.

## 6. Local Overrides to the Shared Meta-Prompt

{{Usually empty. Put anything here that should override the shared
`meta-prompt.md` for THIS policy only — a different control-ID prefix,
extra required sections, a specific citation style, etc. The regeneration
task applies overrides AFTER the shared meta-prompt, so instructions here
win.}}
