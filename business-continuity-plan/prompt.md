# Business Continuity Plan Policy — Summary

> This document serves two purposes:
> 1. A plain-language summary of our Business Continuity Plan Policy that a regulator or
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

Pynthia Credit Union is a federally insured credit union chartered in California, operating nationwide across member-facing digital channels and with operational personnel located in California, South Carolina, Texas, and Porto, Portugal. The credit union maintains a risk-based, Board-approved Business Continuity & Disaster Recovery (BCP/DR) program to withstand, respond to, and recover from disruptive events affecting facilities, systems, vendors, data, and people. It covers internal operations and external member-facing services across all channels and partners, prioritizing human safety, continuity of critical services, prudent recovery, and post-incident learning. The program aligns with NCUA requirements for records preservation and GLBA-style safeguards and incident response applicable to federally insured credit unions. California serves as the primary regulatory jurisdiction; the program accounts for applicable law and hazard profiles across all operational locations, including cross-border data and employment considerations for the Portugal office.

## 2. Key Regulatory Authorities

- **NCUA — Records Preservation & Catastrophic Act Preparedness (12 CFR Part 749)** — requires vital records management, records preservation programs, and disaster recovery of records (Appendices A/B).
- **NCUA — Security Program; Appendix A, Safeguarding Member Information (12 CFR Part 748)** — requires an information security program with incident response and service-provider oversight (GLBA-aligned safeguards).
- **NCUA — Board Responsibilities (12 CFR § 701.4)** — Board oversight, policy approval, delegation, and accountability.
- **FFIEC Business Continuity Management Booklet** — informs supervisory expectations as guidance (not codified); this policy cites only binding regulations above and implements compatible controls.

## 3. What This Policy Must Cover

Continuity risk concentrates in the credit union's ability to keep critical member-facing services running through facility loss, IT/cloud outage, cyber/data breach, vendor failure, and people-availability events, and in its discipline to recover within defined RTO/RPO targets and learn from incidents. Hazards vary by region (e.g., wildfire/smoke in CA, tornado/storm in TX).

The policy must establish the following controls:

**(a) Governance & Roles.** The Board approves and oversees the continuity program; management maintains a living BCP/DR plan with named owners and an Incident Management Team (IMT). Review the plan at least annually and verify the IMT roster quarterly.

**(b) Risk Assessment (Hazards by Region).** Maintain a threat register scoring hazards by likelihood and impact by geography, refreshed annually or after major change. Hazard profiles by operational location: California (wildfire/smoke, earthquake, grid outage/PSPS, drought); South Carolina (hurricane/tropical storm, flood, tornado); Texas (tornado, severe storm, extreme heat, winter storm/grid outage); Porto, Portugal (flood, earthquake/seismic, extreme heat, European regulatory disruption). All locations share cyber, pandemic, and key-person risk. The Portugal office also requires assessment of cross-border data transfer constraints (GDPR/Schrems II) and local labor-law implications for continuity activation.

**(c) Business Impact Analysis (BIA).** Catalog services, rank by member impact and regulatory dependency, identify vital records, and set RTO/RPO and recovery sequence; update annually and certify quarterly for changes. Electronic payment channels (ACH origination, wire transfer, debit/ATM card, mobile/remote deposit capture, Zelle) must be treated as highest-priority critical services given their direct member impact and regulatory dependency (see Electronic Payment Systems Policy).

**(d) Training, Testing & Exercises.** Run at least one enterprise exercise per year (orientation, tabletop, functional), track completion, feed gaps to a corrective action plan, and report results to the Board within 30 days.

**(e) Monitoring, Detection & Severity.** Operate central on-call with a SEV-1 to SEV-4 severity matrix and weather/cyber/vendor monitors; assign an Incident Commander within 5 minutes for SEV-1 and issue initial comms within 15 minutes.

**(f) Incident Declaration & Initial Actions.** Execute a "first hour" checklist (safety, stabilize, scope, assign roles, notify, set cadence); produce a Sitrep v1 within 30 minutes and maintain a 30–60 minute cadence until stabilized.

**(g) Data Backup & Restore; RTO/RPO.** Maintain tiered, immutable/offsite backups with critical RPO ≤ 15 minutes; perform restore tests for each tier quarterly; use clean point-in-time restores for crypto-lock events.

**(h) Alternate Site & Remote Operations.** Maintain a pre-approved remote posture (VPN, MFA), hot/virtual site options, and minimum staffing lists; achieve alternate-site/remote readiness within 8 hours and full critical ops within 24 hours.

**(i) Major IT Failure Response.** Maintain a runbook for core/cloud outages (detect, isolate blast radius, rollback/failover, communicate); assign IC within 5 minutes, issue member status within 15 minutes, and fail over per BIA tier with dual control for rollback.

**(j) Incident Response (Privacy/Security).** Implement GLBA-aligned containment, eradication, recovery, forensics, and notification decisioning with service-provider coordination; begin containment within 1 hour and consult counsel within 24 hours, with notices per applicable breach law.

**(k) Communications & Notification Tree.** Maintain contact trees for employees, Board, regulators, vendors, and media with predefined status-page playbooks; issue the first internal alert within 15 minutes and notify regulators per law/policy, with backup channels if comms platforms fail.

**(l) People Continuity & Pandemic.** Identify essential roles, cross-train, and implement split teams/remote work; activate staffing plans within 24 hours of an absenteeism (≥30%) or public-health trigger.

**(m) Post-Incident Review (PIR).** Conduct a PIR with root cause, what worked/failed, and a corrective action plan; draft the PIR within 10 business days and approve the CAP within 30 days, with retest verification.

**(n) Vendor Contingency Management.** Maintain vendor BCP/IR attestations, SLAs, RTO/RPO, and DR test evidence; refresh evidence annually, define exit/failover criteria, and diversify against shared failure modes.

Governance of these controls is centralized with the Chief Compliance Officer, with the Business Continuity Manager, Incident Management Team, IT/SRE, HR, Vendor Risk, and the Board of Directors as required participants.

## 4. Out of Scope

- Detailed cyber incident response runbooks and security control design — see Information Security Policy.
- General vendor onboarding, due diligence, and oversight — see Third-Party Risk Policy.
- Member breach-notification privacy obligations in detail — see Privacy Policy.
- Vital records retention schedules outside continuity — see Record Retention Policy.
- Enterprise risk taxonomy and aggregation — see Enterprise Risk Management Policy.
- Electronic payment channel-specific controls, ACH/wire dual-control requirements, and payment channel authentication — see Electronic Payment Systems Policy.

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
(deposits, transfers, cards, BSA). Continuity-domain entities and events such as incident declarations, severity classification, RTO/RPO service tiers, backup/restore jobs, alternate-site activation, IMT rosters, notification trees, and post-incident reviews are likely sparse or absent in a banking-core spec, so the regenerator should mark them `(Assumption—needs confirmation)` per the meta-prompt's MISSING INFO HANDLING rule.

## 6. Local Overrides to the Shared Meta-Prompt

{{Usually empty. Put anything here that should override the shared
`meta-prompt.md` for THIS policy only — a different control-ID prefix,
extra required sections, a specific citation style, etc. The regeneration
task applies overrides AFTER the shared meta-prompt, so instructions here
win.}}
