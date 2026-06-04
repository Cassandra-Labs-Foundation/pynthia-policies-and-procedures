# Information Security Policy — Summary

> This document serves two purposes:
> 1. A plain-language summary of our Information Security Policy that a regulator or
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

This policy establishes Pynthia Credit Union's risk-based information security (cybersecurity) program to safeguard member and organizational information and ensure its confidentiality, integrity, availability, and resilience. Scope includes people, facilities, data, systems, networks, vendors, AI tools, and member-facing channels. Engineering and operations must implement the controls below and evidence them through audit logs and periodic testing.

## 2. Key Regulatory Authorities

- **NCUA 12 CFR Part 748 (Security Program, Report of Suspected Crimes, and Cyber Incident Notification)** — requires the program, suspicious-activity reporting, and 72-hour cyber incident notification under §748.1(c).
- **NCUA 12 CFR Part 748, Appendix A (Guidelines for Safeguarding Member Information)** — requires safeguards, risk assessment, testing, and vendor oversight.
- **NCUA 12 CFR Part 748, Appendix B (Response Programs)** — requires an incident response program and member notice.
- **NCUA 12 CFR Part 717 Subpart J (Identity Theft Red Flags)** — requires an identity-theft program and red-flag detection.
- **FACTA Disposal Rule (16 CFR Part 682)** — requires secure disposal of consumer information.
- **NCUA 12 CFR Part 749 (Records Preservation)** — sets retention schedules and vital-records requirements (Appendix B).
- **GLBA (15 USC §§6801–6809)** — establishes the safeguards principle for nonpublic personal information.
- **ADA (28 CFR Part 36)** — supporting authority for facilities access and visitor controls.
- *Framework references (non-regulatory): NIST SP 800-53 Rev.5, NIST CSF 2.0.*

## 3. What This Policy Must Cover

Risk in this domain spans the full technology and human attack surface — member data, systems, networks, vendors, facilities, and AI tools — where confidentiality, integrity, availability, and timely regulatory notification are all at stake. The program is board-governed and risk-based, with engineering implementing and evidencing each control.

The policy must establish the following controls:

**(a) Governance & Oversight.** Maintain a single authoritative Security Program record with owners, charter, KPIs, and review cadence; obtain annual policy approval and deliver quarterly KPI reports to the Board/Supervisory Committee within 30 days post-quarter.

**(b) Enterprise Risk Assessment.** Maintain a risk register mapping assets, threats, and controls (including fraud, social engineering, ID theft, and AI risks), conducting assessments at least every 12 months with monthly POA&M updates and a lightweight risk assessment within 10 business days for new products.

**(c) Asset Inventory & Classification.** Maintain a CMDB of hardware, software, data stores, and vendors with data classification (Public/Internal/Confidential-NPI), posting inventory deltas within 5 business days of change and attesting quarterly.

**(d) Change Management & Configuration Control.** Operate an RFC workflow with risk, test evidence, backout, and approval; require CAB review within 3 business days for medium/high-risk changes and post-review of emergency changes within 24 hours.

**(e) Vulnerability Testing & Penetration Testing.** Schedule automated scans and an annual external pen-test, triaging high-risk findings within 5 business days and patching Critical within 7 days, High within 15, and Medium within 30, tracked to closure in a POA&M.

**(f) Access Control & Authentication.** Enforce SSO/MFA, least-privilege role-based access, and joiner/mover/leaver automation; deprovision on termination the same business day and conduct quarterly access reviews, with break-glass accounts heavily logged.

**(g) Data Protection, Encryption & Disposal.** Encrypt data in transit and at rest with approved crypto (e.g., AES-256, TLS 1.2+), enforce DLP, render disposed data unreadable, and complete disposal within 30 days of eligibility unless under litigation hold.

**(h) Backup & Disaster Recovery.** Define RTO/RPO by system, maintain offsite/immutable backups, verify restores weekly, and run an annual full DR exercise, with ransomware isolation and clean-room restores.

**(i) Incident Response & Cyber Incident Reporting.** Maintain an IR plan, roster, and playbooks; notify NCUA within 72 hours of determining a reportable incident and provide member notice without unreasonable delay per Appendix B, coordinating with law enforcement.

**(j) Identity Theft Red Flags Program.** Maintain a red-flag matrix with step-up verification and account holds, reviewing red-flag cases same day and the ruleset quarterly, with SAR referral where applicable.

**(k) Vendor Risk Management.** Perform due diligence (security, privacy, SOC reports) and require contractual safeguards (breach notice, disposition, right to audit) with ongoing monitoring; review high-risk vendors annually and apply contractual breach-notice windows.

**(l) Physical Security & Facilities.** Enforce card/access controls, visitor escort and logs, CCTV/alarm monitoring, and secure areas for servers/media, deactivating badges within 24 hours of separation.

**(m) AI Governance & Usage Disclosure.** Maintain a default pro-AI posture with controls — AI Use Register, DPIA before production, vendor/feature review, member-facing disclosure, and no unapproved upload of NPI to external AI — updating the registry within 5 days of approval.

**(n) Logging, Monitoring & Alerting.** Centralize logs in a SIEM with time-sync and real-time alerting for critical events, reviewing critical alerts daily and retaining security-relevant logs at least 12 months aligned to the records schedule.

**(o) Acceptable Use & Communications Systems.** Document permitted use of devices, email, messaging, internet, and removable media with monitoring notice and BYOD/remote-work safeguards, requiring acknowledgment before access is granted.

**(p) Social Media.** Pre-approve corporate posts, require disclaimers on personal posts, prohibit member-information disclosure, and escalate scams/impersonation with same-day takedown escalation.

**(q) Training, Awareness & Testing.** Provide role-based training with quarterly phishing simulations and high-risk-role deep-dives, completing new-hire training within 30 days and annual refreshers, with re-training after repeated phishing failures.

**(r) Records Management & Retention.** Apply retention schedules by record class with a legal-hold process aligned to data disposal, processing the destruction queue monthly unless on hold.

Governance of these controls is centralized with the Chief Compliance Officer, with the Information Security/IT lead, Engineering/SecOps, Risk, Privacy, HR, Facilities, and the Board/Supervisory Committee as required participants.

## 4. Out of Scope

- Consumer-facing online/mobile banking channel governance — see E-Commerce Policy.
- Electronic payment rails and payment-channel controls — see Electronic Payment Systems Policy.
- Marketing-compliance and advertising rules (e.g., Reg Z advertising) — see Fair Lending Policy where applicable.
- Enterprise risk appetite, taxonomy, and scoring methodology — see Enterprise Risk Management Policy.
- Vendor onboarding and oversight program mechanics beyond information-security diligence — see Third-Party Risk Policy.
- Detailed business continuity planning — see Business Continuity Plan Policy.
- Privacy notices and member privacy rights — see Privacy Policy.

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
(deposits, transfers, cards, BSA). Information-security operational entities and events — asset/CMDB records, change/RFC and CAB workflows, vulnerability findings and POA&Ms, IAM joiner/mover/leaver events, incident and red-flag cases, vendor risk records, SIEM offenses, and AI-use registry entries — are largely absent from a banking-core transaction spec, so the regenerator should mark them `(Assumption—needs confirmation)` per the meta-prompt's MISSING INFO HANDLING rule.

## 6. Local Overrides to the Shared Meta-Prompt

{{Usually empty. Put anything here that should override the shared
`meta-prompt.md` for THIS policy only — a different control-ID prefix,
extra required sections, a specific citation style, etc. The regeneration
task applies overrides AFTER the shared meta-prompt, so instructions here
win.}}
