# Collections Policy — Summary

> This document serves two purposes:
> 1. A plain-language summary of our Collections Policy that a regulator or
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

This policy requires management to recognize, monitor, and control loan delinquencies and overdrafts; to classify and charge off loans with a high probability of loss in a timely, consistent manner; and to treat members fairly and lawfully in all collection, forbearance, problem-loan, foreclosure, and complaint-handling activities. It applies to all consumer and small-business credit products the credit union originates or services (residential mortgages, home equity and home improvement loans, unsecured installment loans, credit cards, and co-branded or white-label partner programs) and to overdraft programs that function as extensions of credit. Collections must comply with applicable prudential, safety-and-soundness, consumer-protection, privacy, and information-security requirements.

## 2. Key Regulatory Authorities

- **NCUA Part 748 (Security Program, Suspicious Transactions, Catastrophic Acts, Cyber Incidents, and BSA)** — 12 CFR Part 748; written security and response program, protection of member records, and reportable events (including cyber incidents reportable to NCUA).
- **FFIEC Uniform Retail Credit Classification and Account Management Policy** — closed-end retail loans charged off at 120 DPD, open-end at 180 DPD, retail accounts 90+ DPD classified Substandard; guidance on bankruptcy, fraud, death, re-aging, workouts, and residential real estate.
- **FDCPA / Regulation F** — 12 CFR Part 1006; prohibits abusive, unfair, and deceptive practices, limits communications (time, place, frequency), and restricts time-barred-debt suits.
- **UDAAP — Dodd-Frank Act §§ 1031 & 1036** — 12 U.S.C. 5531, 5536; prohibits unfair, deceptive, or abusive acts or practices in collections, forbearance, overdraft handling, and complaint resolution.
- **FCRA / Regulation V** — 12 CFR Part 1022; furnisher duties for accuracy, dispute investigation, and negative-information and identity-theft provisions.
- **CFPB Complaint Program / Expectations** — complete, accurate, and timely complaint responses (typically 15 days initial, 60 days final for regulator complaints).
- **Interagency Nonaccrual / Problem Asset Guidance** — conditions for nonaccrual, return to accrual, and problem-loan/OREO classification (Watch/Substandard/Doubtful/Loss).
- **State Right-to-Cure / Foreclosure / Repossession Laws (varies)** — state-specific requirements overlay these federal minimums; Legal maps product-level parameters.

## 3. What This Policy Must Cover

Collections risk spans credit-loss recognition (timely classification and charge-off), consumer-protection conduct (Reg F/UDAAP), data accuracy (FCRA furnishing/disputes), and information security (incident reporting). Timings in this policy are minimum standards; products or states with stricter requirements must configure tighter SLAs.

The policy must establish the following controls:

**(a) Collections Governance & Scope.** Maintain a single policy configuration object defining covered products, channels, and three-lines ownership; bind every collections workflow to an active policy version; report loans >30 DPD, problem loans, nonaccruals, and OREO to the Board/Executive Loan Committee at least monthly; review the policy at least annually; and log material breaches within 5 business days.

**(b) Delinquency Monitoring & Early-Stage Collections.** Run a nightly delinquency engine with grace periods (10 days standard, 15 days first-mortgage consumer); send courtesy notices at 10/15 days, second reminders by day 20, and a formal right-to-cure within 5 days of 30-day delinquency; require a 60-day status memo within 10 days of 60 DPD; retain Past Due Notes for at least one year.

**(c) Retail Credit Classification & Charge-Offs.** Classify retail loans Substandard at 90 DPD; auto-charge-off closed-end at 120 DPD and open-end at 180 DPD by month-end; charge off bankruptcy within 60 days of notice, fraud within 90 days of confirmation, and death once loss is reasonably estimable; write down real estate exceeding fair value net of cost to sell.

**(d) Forbearance, Extensions, Workouts & TDRs.** Govern hardship forbearance, extensions, and TDRs so modifications reflect sustainable repayment capacity; reset days-past-due only after defined performance (e.g., three consecutive modified payments); cap extensions (e.g., up to three months) and require committee approval for interest capitalization and interest-only arrangements (3–12 months); review active TDRs quarterly.

**(e) Consumer Protection in Collections Communications.** Enforce permitted calling times, frequency caps, and do-not-call/attorney/cease-communication flags; prohibit harassment, threats, obscene language, and false credit-information disclosures; route all templates and scripts through Compliance, with cease-communication flags effective within 1 business day.

**(f) Consumer Complaint Intake & Resolution.** Operate a single complaint platform capturing all channels; respond to regulator complaints within 15 days (initial) and 60 days (final) and to direct complaints within 5 business days (acknowledgment) and 30 days (resolution); tag root cause and UDAAP flags.

**(g) Credit Reporting & Dispute Handling.** Generate monthly Metro 2 furnishing files, track furnishing history, and investigate disputes within 30 days of receipt, applying corrections in the next furnishing batch and escalating identity-theft disputes to Fraud.

**(h) Collections Data Breach & Incident Reporting.** Log and classify incidents affecting collections data; triage within 24 hours; notify NCUA no later than 72 hours after reasonable belief of a reportable cyber incident; and send member notices as soon as reasonably possible after misuse is determined likely.

**(i) Problem Loans, Nonaccrual & Foreclosure Governance.** Maintain risk ratings (Pass/Watch/Substandard/Doubtful/Loss); place loans on nonaccrual at 90+ DPD or when full collection is doubtful, reversing accrued interest; require a pre-foreclosure financial-impact evaluation with CCO and President approval; review Watch/Substandard/Doubtful ratings quarterly.

**(j) Overdraft Collections and Fee Waiver Practices.** Treat overdrafts as short-term unsecured credit; review the daily overdraft report same business day; require approval within lending authority; assess fees consistently; allow fee waivers only as documented exceptions with CCO approval for recurring patterns; prohibit ongoing payroll overdraft coverage absent a formal facility.

Governance of these controls is centralized with the Chief Compliance Officer, with Collections Operations, Credit Risk, Legal, IT/Security, Finance, and the Executive Loan Committee as required participants.

## 4. Out of Scope

- Loan origination, underwriting, and credit policy — see Lending Policy.
- Fair-lending and adverse-action requirements — see Fair Lending Policy.
- BSA/AML program and SAR filing (referenced for fraud charge-offs) — see BSA Policy.
- Enterprise information-security controls and incident-response framework — see Information Security Policy.
- Member privacy and data-handling obligations — see Privacy Policy.
- Detailed OREO valuation and disposition — governed by separate OREO guidelines.
- Vendor management of third-party collectors beyond conduct requirements — see Third-Party Risk Policy.
- Record-retention schedules beyond collections-specific evidence — see Record Retention Policy.

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
(deposits, transfers, cards, BSA). Collections-specific entities and events — delinquency buckets and days-past-due engines, retail charge-off and recovery postings, forbearance/TDR plan objects, Reg F communication logs, complaint and dispute case management, risk ratings and nonaccrual flags, and foreclosure/OREO records — are likely sparse or missing in a banking-core spec, so the regenerator must mark them `(Assumption—needs confirmation)` per the meta-prompt's MISSING INFO HANDLING rule.

## 6. Local Overrides to the Shared Meta-Prompt

{{Usually empty. Put anything here that should override the shared
`meta-prompt.md` for THIS policy only — a different control-ID prefix,
extra required sections, a specific citation style, etc. The regeneration
task applies overrides AFTER the shared meta-prompt, so instructions here
win.}}
