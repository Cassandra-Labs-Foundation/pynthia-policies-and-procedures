# E-Commerce Policy — Summary

> This document serves two purposes:
> 1. A plain-language summary of our E-Commerce Policy that a regulator or
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

This policy establishes how Pynthia Credit Union identifies, measures, monitors, and controls the risks arising from its electronic-commerce (online and mobile banking) channels, and sets the expectations of management and the Board when implementing and operating those systems. E-commerce here means the computer hardware, software, and telecommunication systems — operating over public networks such as the Internet — that let members access account and general credit-union information and conduct transactions. The policy governs the consumer-facing channel layer (what we offer online, how members enroll and authenticate, and the business rules that surround it); backend payment rails, cybersecurity controls, and CIP for online account opening live in adjacent policies.

## 2. Key Regulatory Authorities

- **NCUA 12 CFR Part 748 and Appendix A (Safeguarding Member Information)** — requires a board-approved security program with controls to protect member data integrity, confidentiality, and availability across electronic channels.
- **FFIEC IT Examination Handbook (E-Banking booklet) and FFIEC Authentication Guidance (2021 update)** — set expectations for risk-based authentication, layered security, and risk management of internet and mobile banking.
- **E-SIGN Act (15 USC §7001 et seq.)** — governs electronic records, signatures, and member consent to electronic delivery of disclosures.
- **Regulation E (12 CFR Part 1005)** — governs electronic fund transfers, error resolution, and required disclosures delivered through electronic channels.
- **GLBA (15 USC §§6801–6809)** — establishes the safeguards principle for nonpublic personal information handled online.

## 3. What This Policy Must Cover

Risk in this domain is concentrated in the public-network attack surface and in member authentication: malicious attacks, viruses, employee misuse of sensitive information, hardware/software failure, disasters, and unauthorized account access by another person. Because the channel runs over the Internet and depends on core and e-commerce vendors (e.g., Fiserv), the policy must establish layered preventive, detective, and recovery controls and assign clear accountability.

The policy must establish the following controls:

**(a) Safeguarding Member Information.** E-commerce systems must maintain data integrity, ensure member privacy, and protect computer and telecommunication systems from unauthorized intrusion, misuse, or fraud, with end-to-end security controls applied to critical data.

**(b) Network and Data Access Controls.** Verify and enforce each user's authorized right to access the network, applications, and data using user IDs, passwords with regular updates, member-set security questions, physical controls (e.g., locked computer room), and software/hardware security devices (anti-virus, firewall, monitoring software).

**(c) User Authentication and Enrollment.** Identify the member before issuing authorization codes, then assign an access code and password and authenticate identity on every access. Members may not complete an e-commerce enrollment application fully online; the applicant must supply related account numbers and submit electronically, in person, or by mail, with identity and member-number verification before access is granted and an email confirmation sent.

**(d) Member Password Standards.** Issue a randomly generated eight-character temporary password when none is requested; require members to change it on first access and at least annually thereafter. Passwords must meet core-vendor (Fiserv) complexity rules — minimum length 8, maximum 32, at least one upper-case and one lower-case letter, at least one number or special character, no name/Login ID/"Fiserv"/"password" content, and no reuse of the prior 5 passwords.

**(e) Firewalls.** Combine hardware and software to block unwanted communication while permitting acceptable traffic, protecting all connection points between internal and external networks; review and test firewalls periodically, with an independent provider conducting an annual intrusion-risk review and test.

**(f) Encryption.** Use TLS connections with current SSL certificates and ciphers for all e-commerce communications and when transmitting sensitive or critical data; test the SSL certificate and TLS protocol at least yearly (e.g., Qualys SSL Labs) and retain results with IT.

**(g) Transaction Verification.** Define valid and authentic electronic-communication procedures in member e-commerce agreements, maintain audit trails identifying the parties initiating transactions, and use them to verify transactions and rebut repudiation claims.

**(h) Virus Protection.** Maintain a credit-union-wide detection and prevention program including end-user policies, training and awareness, anti-virus tools, and enforcement procedures.

**(i) Security Monitoring, Penetration Testing, and Intrusion Detection.** Use monitoring tools to identify vulnerabilities and detect intrusions in real time; engage a bonded outside firm to conduct penetration testing and recommend remediation; produce real-time transaction and audit logs, terminate suspicious connections, maintain an incident database for trend analysis, and monitor 24/7 via a security operations center.

**(j) Breach of Security Response.** On detection of an unauthorized act or user, notify management immediately, determine the extent of damage/disclosure and potential legal liability, and execute response activities covering communications with members, law enforcement, regulators, and media — with only designated individuals authorized to communicate externally.

**(k) Contingency Planning and Business Continuity.** Incorporate all e-commerce systems into overall contingency and business-continuity efforts, confirm core processor and e-commerce provider disaster-recovery arrangements, and base the recovery plan on a business impact analysis that prioritizes the most critical functions and systems.

**(l) Expertise and Training.** Assess staffing and training needs for systems development, operation, and member support; provide additional training as appropriate and reassess needs annually to keep pace with technological and personnel changes.

Governance of these controls is centralized with the Chief Compliance Officer, with the IT department (CIO), Deposit Operations, and Information Security as required participants; the Board approves the written policy and reviews it at least annually.

## 4. Out of Scope

- Backend payment rails (ACH, wires, cards, bill pay, RDC) — see Electronic Payment Systems Policy.
- Cybersecurity and information-security controls for online channels — see Information Security Policy.
- Customer Identification Program for online account opening — see BSA Policy.
- Online privacy notices, cookies, and third-party app connections — see Privacy Policy.
- Oversight of online-service vendors and third parties — see Third-Party Risk Policy.
- Channel-level business continuity and disaster recovery detail — see Business Continuity Plan Policy.

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
(deposits, transfers, cards, BSA). Online-channel entities and events — member enrollment/authentication sessions, device registration, password resets, security-question challenges, e-SIGN consent records, and online-banking audit trails — are likely sparse or absent in a banking-core spec, so the regenerator should mark them `(Assumption—needs confirmation)` per the meta-prompt's MISSING INFO HANDLING rule.

## 6. Local Overrides to the Shared Meta-Prompt

**Shared control SC-01: NCUA reportable-incident & member notification.**
This policy contains a control named, numbered, and bodied **identically**
to the same control in six other policies — Business Continuity Plan,
Electronic Payment Systems, Collections, Information Security, Privacy,
and Third-Party Risk. Before generating, read
`shared-controls/ncua-incident-notification.md` at the project root and
emit its "Embeddable block" **verbatim and in full**, including the
heading line itself:

    ## SC-01 — NCUA Reportable Cyber-Incident & Member Notification {#sc-01-ncua-reportable-cyber-incident-member-notification}

Do not renumber this control into the EC-xx sequence, do not retitle it,
and do not paraphrase the WHY / SYSTEM BEHAVIOR / EVENTS / ALERTS body. The
control ID `SC-01` and this exact title must be byte-identical across all
seven policies — that identity is the point of the consolidation.

This policy's own breach detection/declaration, damage and legal-liability
assessment, and external-communications gating is **not** part of SC-01.
Emit it as its own separate, normally-numbered control in this policy's
EC-xx sequence (next available number), titled along the lines of "Breach
Detection, Liability Assessment & External Comms Gating," and have its
SYSTEM BEHAVIOR note that it feeds the SC-01 reportability determination.
Link the two via anchor, but do not merge their bodies.
