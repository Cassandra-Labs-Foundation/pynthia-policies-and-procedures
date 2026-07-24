# Electronic Payment Systems Policy — Summary

> This document serves two purposes:
> 1. A plain-language summary of our Electronic Payment Systems Policy that a regulator or
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

This policy governs Pynthia Credit Union's electronic banking services, with primary emphasis on electronic payment systems that facilitate electronic fund transfers and other financial transactions. It segregates electronic banking into three categories — information-only systems (the public website), electronic information transfer systems (online/business banking, file transfer, ATM, email, eStatements, mobile banking), and electronic payment systems — and applies the most stringent risk management to payment systems. In-scope payment channels include ACH origination, wire transfer entry/approval and settlement (Fedwire, SWIFT), debit/ATM cards, retail and business online banking, bill payment, mobile and remote deposit capture, Zelle, and lockbox. The policy's critical elements are assessing risk, assigning accountability, active board management, ongoing testing and monitoring, training and education, internal controls, and planning for future developments.

## 2. Key Regulatory Authorities

- **NCUA 12 CFR Part 748 and Appendix A (Safeguarding Member Information)** — requires controls to protect member information and operational systems supporting electronic banking.
- **FFIEC IT Examination Handbook (E-Banking / Retail Payment Systems booklets) and FFIEC Authentication Guidance** — set expectations for layered authentication and risk management of electronic payment channels commensurate with risk.
- **NACHA Operating Rules** — govern ACH origination, exposure limits, and warranties for originated entries.
- **Regulation E (12 CFR Part 1005)** — governs electronic fund transfers, including consumer rights and error resolution for affected payment channels.
- **Regulation CC (12 CFR Part 229)** — governs funds availability and remote/mobile deposit capture of checks.
- **Federal Reserve / Fedwire and SWIFT operating rules** — govern wire transfer settlement and distribution.

## 3. What This Policy Must Cover

Of the three electronic banking categories, the level of risk is most significant in electronic payment systems; ACH processing, wire transfer, bill payment, mobile deposit capture, and remote deposit capture are the largest risk areas. Risk is predominantly operational (transaction) risk arising from fraud, error, or inability to deliver services, and depends heavily on third-party vendors (Fiserv, Jack Henry, etc.). Controls must be commensurate with that risk and detailed in the Electronic Banking Risk Assessment.

The policy must establish the following controls:

**(a) Planning and Feasibility Analysis.** Analyze each proposal for a new electronic banking service in three stages — study (needs/objectives/alternatives), design and development (best solution installed, policies/procedures/documentation), and operation (proper operation and maintenance) — and prepare a Product Risk Analysis form for Enterprise Risk Management Committee review.

**(b) Incident Planning and Preparedness.** Maintain a business continuity plan, procedures, and an incident response plan covering electronic banking risks, including regular testing of key electronic banking services (see Business Continuity Plan Policy).

**(c) Internal Routines and Controls.** Maintain comprehensive system reviews and tests validating the controls protecting hardware, software, proprietary data, and electronic transmissions, and train users to adhere to control standards.

**(d) Management Supervision and Oversight.** Keep management and the Board actively involved, supported by the Electronic Banking Risk Assessment, a quarterly IT Committee, an IT Risk Assessment, an annually prepared IT Strategic Plan, an annual IT Audit, IT and Deposit Operations dashboards, and an Electronic Banking Summary, with periodic reports to the Board.

**(e) Authentication Controls.** Require user authentication on all client-facing electronic banking services, applying degrees of authentication in accordance with perceived risk (documented in Exhibit A and the Electronic Banking Authentication and Risk Assessment). Examples include user ID/password/token for system access, tokens and dual control for higher-risk functions, IP and day/time restrictions, mobile device registration, and challenge questions.

**(f) Dual Control for High-Risk Processes.** Apply dual controls or enhanced system access to higher-risk electronic processes (documented in Exhibit B). For ACH origination, recommend dual control for clients originating over $50,000 and assign client/user exposure limits and template restrictions; for wire transfers, require dual control or offline callback approval with PIN, plus daily/periodic limits and predefined templates; for internal Fedwire/SWIFT and item processing, require ID/passcode/token, an additional PIN to release outgoing wires, registered-IP and day/time restrictions, and two employees to originate a wire.

**(g) Electronic Fraud Protection Systems.** Offer and monitor fraud tools including Check Positive Pay, Premium Positive Pay (with ACH monitoring), and card controls (debit-card on/off, limits, and transaction-type settings that do not override institution-defined limits or bypass card-monitoring), and continually monitor fraud trends.

**(h) Vendor Due Diligence.** Perform due diligence on the third-party vendors that design, implement, and service payment technologies (per the Information Technology Cyber Security Policy), including annual review of hosting provider SOC 1 Type II and SOC 2 Type II reports and encryption requirements; the Board and senior management remain responsible for vendor performance.

**(i) Expertise and Training.** Provide employee training (technical coursework, conferences, working groups) and ensure adequate backup for critical staff; provide client training and resource guides at onboarding, annual education and self-certification where applicable, and periodic communications on phishing and online fraud.

**(j) Testing.** Validate that equipment and systems function properly and interoperate with existing technology before deployment, including vendors in the testing process.

Governance of these controls is centralized with the Chief Compliance Officer, with the Assistant Vice President of Deposit Operations designated as ultimately responsible for assessing risks and implementing procedures, the IT Committee and Enterprise Risk Management Committee as required participants, and audit personnel verifying the internal control structure.

## 4. Out of Scope

- Consumer-facing online/mobile banking channel governance (enrollment, member experience, business rules) — see E-Commerce Policy.
- Cybersecurity, encryption, intrusion, and IT general controls — see Information Security Policy.
- Vendor onboarding and ongoing third-party oversight program — see Third-Party Risk Policy.
- Enterprise risk appetite, taxonomy, and scoring methodology — see Enterprise Risk Management Policy.
- Business continuity and disaster recovery program detail — see Business Continuity Plan Policy.

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
(deposits, transfers, cards, BSA). Payment-channel-specific entities and events — ACH origination batches and exposure limits, wire dual-control approval/PIN release, positive-pay exceptions, mobile/remote deposit capture, Zelle transfers, and token/IP authentication settings — are likely sparse or absent in a banking-core spec, so the regenerator should mark them `(Assumption—needs confirmation)` per the meta-prompt's MISSING INFO HANDLING rule.

## 6. Local Overrides to the Shared Meta-Prompt

**Shared control SC-01: NCUA reportable-incident & member notification.**
This policy contains a control named, numbered, and bodied **identically**
to the same control in six other policies — Business Continuity Plan,
E-Commerce, Collections, Information Security, Privacy, and Third-Party
Risk. Before generating, read `shared-controls/ncua-incident-notification.md`
at the project root and emit its "Embeddable block" **verbatim and in
full**, including the heading line itself:

    ## SC-01 — NCUA Reportable Cyber-Incident & Member Notification {#sc-01-ncua-reportable-cyber-incident-member-notification}

Do not renumber this control into the EPS-xx sequence, do not retitle it,
and do not paraphrase the WHY / SYSTEM BEHAVIOR / EVENTS / ALERTS body. The
control ID `SC-01` and this exact title must be byte-identical across all
seven policies — that identity is the point of the consolidation. **Do
not** namespace SC-01's codes under `eps.incident.*` or `eps.incident_ncua.*`.

Payment-incident detection/opening and BCP-test scheduling/completion is
**not** part of SC-01. Emit it as its own separate, normally-numbered
control in this policy's EPS-xx sequence (next available number), titled
along the lines of "Payment-Incident Detection & BCP Testing," retaining
the `eps.incident.*`/`eps.bcp_test.*` namespace there (it's policy-specific,
so the namespace restriction above doesn't apply to it), and have its
SYSTEM BEHAVIOR note that it feeds the SC-01 reportability determination.
Link the two via anchor, but do not merge their bodies.
