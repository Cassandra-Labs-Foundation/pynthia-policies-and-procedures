# Member Policy — Summary

> This document serves two purposes:
> 1. A plain-language summary of our Member Policy that a regulator or
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

This policy is the member-lifecycle umbrella governing the events and rights affecting members of Pynthia Credit Union from onboarding through expulsion. It consolidates membership eligibility and onboarding, account maintenance and change of address, member communications, disputes and dispute resolution, account restrictions and closures, member expulsion, death and estate handling, and member records. It applies to all members and their accounts across all service channels.

## 2. Key Regulatory Authorities

- **California Credit Union Law (Cal. Fin. Code Division 5, §§14000 et seq.)** — governs state-chartered credit union membership, expulsion procedures, special member meetings, and members' right to be heard.
- **California Consumer Financial Protection Law (CCFPL)** — complaint handling and UDAAP standards in member interactions, including DFPI complaint forwarding to a designated officer.
- **Regulation E (12 CFR Part 1005)** — error-resolution rights and timelines for electronic fund transfers on member accounts.
- **Regulation DD / Truth in Savings (12 CFR Part 1030; NCUA Part 707 if federally chartered)** — account disclosures provided to members.
- **Regulation P (Gramm-Leach-Bliley, 12 CFR Part 1016)** — member privacy notices and information-sharing limits.
- **FACT Act Red Flags Rule (16 CFR Part 681 / FCRA)** — identity-theft triggers, including those raised by change-of-address requests.
- **Federal Credit Union Act §118 (12 U.S.C. §1764)** — statutory grounds and procedure for member expulsion (for federally chartered equivalents).

## 3. What This Policy Must Cover

Member-lifecycle risk at Pynthia is concentrated in identity verification at onboarding and at account-maintenance events, in the fairness and timeliness of dispute resolution, and in the due-process requirements that govern restrictions, closures, and expulsion of a member.

The policy must establish the following controls:

**(a) Membership Eligibility & Onboarding.** Enforce field-of-membership eligibility rules and capture required identity verification at account opening, integrating with the CIP/identity-verification process before a membership is established.

**(b) Account Maintenance & Change of Address.** Require identity verification before processing a change of address, send notice to the prior address, and impose a waiting window before a new card or statement is dispatched, triggering Red Flags review on suspicious changes.

**(c) Member Communications & Preferences.** Capture and honor communication preferences and opt-outs, including electronic versus paper delivery and required disclosure delivery.

**(d) Member Disputes & Dispute Resolution.** Provide a standardized complaint-intake, escalation, and response process with defined response timelines and forwarding of DFPI/CFPB-routed complaints to the designated officer.

**(e) Account Restrictions & Closures.** Define the conditions and approvals under which an account may be restricted or closed by the credit union, with documented rationale and member notification.

**(f) Member Expulsion.** Implement the statutory expulsion procedure — permissible grounds, notice requirements, the member's right to be heard at a special meeting, and the effect of expulsion on existing loans and shares.

**(g) Member Death & Estate Handling.** Govern account handling on a member's death, including payable-on-death designations, beneficiary claims, and required documentation.

**(h) Member Records & Privacy.** Maintain member records and privacy controls consistent with retention and privacy requirements, restricting access on a need-to-know basis.

**(i) Member Service Standards.** Establish service response timelines and channel standards for member-facing interactions.

Governance of these controls is centralized with the Chief Compliance Officer, with Member Services, BSA, and the Board (for expulsion and special meetings) as required participants.

## 4. Out of Scope

- CIP and customer due diligence / identity verification program — see BSA Policy.
- Change-of-address and identity-theft Red Flags technical controls — see Information Security Policy.
- Member privacy notices and information-sharing program — see Privacy Policy.
- Member record retention schedules — see Record Retention Policy.
- Complaint-logging program structure and UDAAP monitoring — see Compliance Policy.
- Member-facing online and mobile channels — see E-Commerce Policy.
- Truth-in-Savings account disclosure content — see Truth-in-Savings Policy.

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
(deposits, transfers, cards, BSA). Member-lifecycle entities and events beyond core account/customer records — field-of-membership eligibility, change-of-address verification and notices, complaint/dispute cases, account restriction and expulsion proceedings, special-meeting records, and death/estate handling — are likely sparse or absent in a banking-core spec, so the regenerator must mark them `(Assumption—needs confirmation)` per the meta-prompt's MISSING INFO HANDLING rule.

## 6. Local Overrides to the Shared Meta-Prompt

{{Usually empty. Put anything here that should override the shared
`meta-prompt.md` for THIS policy only — a different control-ID prefix,
extra required sections, a specific citation style, etc. The regeneration
task applies overrides AFTER the shared meta-prompt, so instructions here
win.}}
