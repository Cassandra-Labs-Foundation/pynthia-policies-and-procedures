---
description: >-
  Most this should be about governance/audit of the 3rd party that we use to do
  AML/CFT checks
---

# AML/CFT

> **General Policy Statement**\
> \{{ORGANIZATION\}} maintains a risk-based, Board-approved BSA/AML/OFAC program that meets 12 CFR §748.2 requirements for federally insured credit unions and applicable Treasury regulations (31 CFR Chapter X). We verify customer identities, perform due diligence (including enhanced due diligence where warranted), monitor and report suspicious activity, file required reports (CTR, SAR, CMIR, FBAR), maintain required records, screen against sanctions lists, and escalate breaches pursuant to this policy’s controls. (NCUA 12 CFR §748.2; 31 CFR Part 1020; 31 CFR Part 1010; 31 CFR Part 501.) ([law.cornell.edu](https://www.law.cornell.edu/cfr/text/12/748.2?utm_source=chatgpt.com))

***

### Multi-Rule Authority Table <a href="#authority" id="authority"></a>

| Topic                            | Scope                                          | Key Clauses / Notes                                                                                                                                                                                                                                                                   |
| -------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **NCUA BSA Program Rule**        | Credit unions                                  | Program requirement; CIP component. 12 CFR §748.2(b) (links to 31 CFR 1020.220). ([law.cornell.edu](https://www.law.cornell.edu/cfr/text/12/748.2?utm_source=chatgpt.com))                                                                                                            |
| **AML Program & CIP**            | Banks/credit unions                            | 31 CFR §1020.210 (AML program), §1020.220 (CIP). ([ecfr.gov](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1020?utm_source=chatgpt.com))                                                                                                                            |
| **CTR**                          | Currency >$10,000                              | 31 CFR §1010.311 (requirement); §1010.306 (15-day filing). ([ecfr.gov](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1010/subpart-E/section-1010.520?utm_source=chatgpt.com))                                                                                       |
| **SAR**                          | Suspicious transactions                        | 31 CFR §1020.320 (30-day/60-day timing; continuing SARs). ([ecfr.gov](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1020/subpart-B/section-1020.220?utm_source=chatgpt.com))                                                                                        |
| **Monetary Instruments Log**     | $3k–$10k purchases                             | 31 CFR §1010.415 (recordkeeping). ([ecfr.gov](https://www.ecfr.gov/current/title-12/chapter-VII/subchapter-A/part-748/section-748.2?utm_source=chatgpt.com))                                                                                                                          |
| **Funds Transfer “Travel Rule”** | ≥$3,000 wires                                  | 31 CFR §1010.410(e),(f) (record/transmittor/beneficiary info). ([law.cornell.edu](https://www.law.cornell.edu/cfr/text/31/1020.220?utm_source=chatgpt.com))                                                                                                                           |
| **314(a) Info Sharing**          | Gov’t → FIs                                    | 31 CFR §1010.520 (search & respond; 14 days). FinCEN 314(a) Fact Sheet. ([law.cornell.edu](https://www.law.cornell.edu/cfr/text/31/1010.520?utm_source=chatgpt.com))                                                                                                                  |
| **314(b) Voluntary FI↔FI**       | FI ↔ FI                                        | 31 CFR §1010.540 (safe harbor, verification). ([law.cornell.edu](https://www.law.cornell.edu/cfr/text/31/1010.540?utm_source=chatgpt.com))                                                                                                                                            |
| **Record Retention (BSA)**       | All records                                    | 31 CFR §1010.430 (5 years). ([law.cornell.edu](https://www.law.cornell.edu/cfr/text/31/1010.430?utm_source=chatgpt.com))                                                                                                                                                              |
| **CMIR (Form 105)**              | Cross-border cash >$10k                        | 31 CFR §1010.340 (report); timing/where to file. ([law.cornell.edu](https://www.law.cornell.edu/cfr/text/31/1010.340?utm_source=chatgpt.com))                                                                                                                                         |
| **FBAR**                         | Foreign accts >$10k agg.                       | 31 CFR §1010.350; due April 15 via BSA E-File. ([ecfr.gov](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1010?utm_source=chatgpt.com))                                                                                                                              |
| **OFAC**                         | Sanctions screening                            | 31 CFR Part 501 (procedures/penalties); Part 594 (terrorism sanctions); OFAC updates. ([ecfr.gov](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-V/part-501?toc=1\&utm_source=chatgpt.com))                                                                                 |
| **PEPs (Risk-Based EDD)**        | Foreign/domestic PEPs; close associates/family | Risk-based EDD expectation under AML program/CIP; no blanket prohibition. See **31 CFR §1020.210** (program), **§1020.220** (CIP); **FFIEC BSA/AML Manual – Customer Due Diligence/PEPs** (risk indicators, EDD expectations); **FinCEN advisories** on public corruption typologies. |

***

### Timing Matrix <a href="#timing-matrix" id="timing-matrix"></a>

| Scenario                                                   | Trigger (human → event)                                    |                                                                                         Deadline | Content Reference                          | Control                                                  |
| ---------------------------------------------------------- | ---------------------------------------------------------- | -----------------------------------------------------------------------------------------------: | ------------------------------------------ | -------------------------------------------------------- |
| File CTR for currency >$10k (aggregate, same business day) | Teller/ops flags cash total → `cash.threshold.exceeded`    |                                                         **15 calendar days** from transaction(s) | 31 CFR §1010.306; §1010.311                | [BA-07](aml-cft.md#ba-07-ctr-filing)                     |
| File SAR (suspect identified)                              | Investigator marks “SAR required” → `sar.decision.made`    |                                                              **30 calendar days** from detection | 31 CFR §1020.320(b)(3)                     | [BA-08](aml-cft.md#ba-08-sar-filing-and-confidentiality) |
| File SAR (no suspect)                                      | Investigator marks “no suspect” → `sar.no-suspect`         |                                                              **60 calendar days** from detection | 31 CFR §1020.320(b)(3)                     | [BA-08](aml-cft.md#ba-08-sar-filing-and-confidentiality) |
| Continuing SAR                                             | Case open >90 days → `sar.continuing.review`               |                                                       **Every 90 days** while activity continues | FFIEC practice via §1020.320               | [BA-08](aml-cft.md#ba-08-sar-filing-and-confidentiality) |
| Respond to 314(a) request                                  | FinCEN request received → `314a.request.received`          |                                                          **14 calendar days** (unless specified) | 31 CFR §1010.520; FinCEN 314(a) Fact Sheet | [BA-11](aml-cft.md#ba-11-information-sharing-314a-314b)  |
| CMIR (own transport/receipt)                               | Ops confirms cross-border currency → `cmir.required`       | **15 calendar days after receipt** (or by date of mailing/shipping if not accompanying a person) | 31 CFR §1010.340; §1010.306                | [BA-17](aml-cft.md#ba-17-cmir-cross-border-currency)     |
| FBAR                                                       | Fin acct aggregate >$10k prior year → `fbar.threshold.met` |                                                     **April 15** (automatic extension to Oct 15) | 31 CFR §1010.350                           | [BA-18](aml-cft.md#ba-18-fbar-foreign-accounts)          |
| Monetary instrument log consolidation                      | Branch sends monthly log → `mil.monthly.close`             |                                    **By the 15th of following month** (model practice per notes) | 31 CFR §1010.415                           | [BA-09](aml-cft.md#ba-09-monetary-instruments-logs)      |
| OFAC record retention                                      | Record created → `ofac.record.created`                     |                                                        **10 years** (effective **Mar 12, 2025**) | 31 CFR Part 501 (amended 2024–25)          | [BA-05](aml-cft.md#ba-05-ofac-screening-and-holds)       |
| Complete PEP EDD (high-risk) before activation             | KYC marks PEP high-risk → `pep.hit.high`                   |                                                                    **Before account activation** | FFIEC PEP EDD expectations                 | [BA-20](aml-cft.md#ba-20-pep-screening-and-edd)          |

***

### Control Index <a href="#control-index" id="control-index"></a>

| ID                                                                               | Control Name                                               | Purpose                                                                              | Primary Rule(s)                                                                                                                                                     |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [BA-01](aml-cft.md#ba-01-governance-delegation)                                  | Governance & Delegation                                    | Define ownership, approvals, roles, segregation of duties                            | 12 CFR §748.2(b) ([law.cornell.edu](https://www.law.cornell.edu/cfr/text/12/748.2?utm_source=chatgpt.com))                                                          |
| [BA-02](aml-cft.md#ba-02-enterprise-bsaaml-risk-assessment)                      | Enterprise BSA/AML Risk Assessment                         | Identify inherent/residual risk; set EDD triggers                                    | 12 CFR §748.2; 31 CFR §1020.210 ([law.cornell.edu](https://www.law.cornell.edu/cfr/text/12/748.2?utm_source=chatgpt.com))                                           |
| [BA-03](aml-cft.md#ba-03-cip-customer-identification-program)                    | CIP                                                        | Verify identity; required data; retention                                            | 31 CFR §1020.220; §1010.430 ([GovInfo](https://www.govinfo.gov/content/pkg/CFR-2024-title31-vol3/pdf/CFR-2024-title31-vol3-sec1020-220.pdf?utm_source=chatgpt.com)) |
| [BA-04](aml-cft.md#ba-04-cdd-edd-incl-beneficial-ownership)                      | CDD / EDD (incl. Beneficial Ownership)                     | Understand nature/purpose; event-driven updates                                      | 12 CFR §748.2; 31 CFR Part 1020                                                                                                                                     |
| [BA-05](aml-cft.md#ba-05-ofac-screening-and-holds)                               | OFAC Screening & Holds                                     | Screen, block/reject, retain 10 years                                                | 31 CFR Part 501; Part 594                                                                                                                                           |
| [BA-06](aml-cft.md#ba-06-transaction-monitoring-casemgmt)                        | Monitoring & Case Mgmt                                     | Detect unusual activity; routing to SAR decision                                     | 31 CFR §1020.320                                                                                                                                                    |
| [BA-07](aml-cft.md#ba-07-ctr-filing)                                             | CTR Filing                                                 | Aggregate and file CTRs timely                                                       | 31 CFR §1010.311; §1010.306                                                                                                                                         |
| [BA-08](aml-cft.md#ba-08-sar-filing-and-confidentiality)                         | SAR Filing & Confidentiality                               | Decide, file, board reporting, confidentiality                                       | 31 CFR §1020.320                                                                                                                                                    |
| [BA-09](aml-cft.md#ba-09-monetary-instruments-logs)                              | Monetary Instruments Logs                                  | Required records for $3k–$10k                                                        | 31 CFR §1010.415                                                                                                                                                    |
| [BA-10](aml-cft.md#ba-10-travel-rule-wires-3000)                                 | Travel Rule (Wires ≥$3,000)                                | Maintain/transmit required info                                                      | 31 CFR §1010.410(e),(f)                                                                                                                                             |
| [BA-11](aml-cft.md#ba-11-information-sharing-314a-314b)                          | Information Sharing (314(a)/(b))                           | Respond to FinCEN; safe-harbor FI↔FI                                                 | 31 CFR §1010.520; §1010.540                                                                                                                                         |
| [BA-12](aml-cft.md#ba-12-record-retention)                                       | Record Retention                                           | 5-year BSA; special OFAC 10-year                                                     | 31 CFR §1010.430; Part 501                                                                                                                                          |
| [BA-13](aml-cft.md#ba-13-escalation-breach-reporting)                            | Escalation Pathway                                         | Internal breach reporting; regulator notifications                                   | 12 CFR §748.1 & §748.2                                                                                                                                              |
| [BA-14](aml-cft.md#ba-14-training)                                               | Training                                                   | Role-based training & tracking                                                       | 12 CFR §748.2(c)                                                                                                                                                    |
| [BA-15](aml-cft.md#ba-15-independent-testing)                                    | Independent Testing                                        | Annual/18-month cycle testing                                                        | 12 CFR §748.2(c)                                                                                                                                                    |
| [BA-16](aml-cft.md#ba-16-high-risk-categories-msb-correspondent-private-banking) | High-Risk Categories (MSB, Correspondent, Private Banking) | EDD for MSBs; correspondent/private banking filters                                  | 31 CFR §1010.100(ff); program rules                                                                                                                                 |
| [BA-17](aml-cft.md#ba-17-cmir-cross-border-currency)                             | CMIR (Cross-Border Currency)                               | Form 105 filing & docs                                                               | 31 CFR §1010.340                                                                                                                                                    |
| [BA-18](aml-cft.md#ba-18-fbar-foreign-accounts)                                  | FBAR                                                       | BSA e-file deadline                                                                  | 31 CFR §1010.350                                                                                                                                                    |
| [BA-19](aml-cft.md#ba-19-prepaid-access-third-parties)                           | Prepaid Access & Third Parties                             | Vendor due diligence & monitoring                                                    | 31 CFR Part 1010; OFAC Part 501                                                                                                                                     |
| [BA-20](aml-cft.md#ba-20-pep-screening-and-edd)                                  | PEP Screening & EDD                                        | Identify PEPs, apply risk-based EDD, heightened approvals/monitoring where warranted | 31 CFR §1020.210, §1020.220; FFIEC BSA/AML Manual (PEPs)                                                                                                            |

***

## Control Overlays (Design Overlay v2)

### BA-01 — Governance & Delegation <a href="#ba-01-governance-delegation" id="ba-01-governance-delegation"></a>

* WHY (Reg cite): Board must establish/administer BSA/AML program incl. CIP, internal controls, testing, training, BSA Officer. 12 CFR §748.2. ([law.cornell.edu](https://www.law.cornell.edu/cfr/text/12/748.2?utm_source=chatgpt.com))
* SYSTEM BEHAVIOR: Enforce ownership fields on each control; require electronic approval workflow for policy updates; maintain RACI registry.
* TRIGGERS (human → event): Board approves policy → (`governance.policy.approved`); BSA Officer appointed/changed → (`role.bsa.officer.set`).
* INPUTS (human → field): Owner name/title (`governance.owner`); Delegations (`governance.delegations`); Board minutes link (`governance.minutes.url`).
* OUTPUTS: Current org chart; duty segregation matrix; attestations.
* TIMERS/SLAs: Review **annually**; interim within **30 days** of material change.
* EDGE CASES: Acting BSA Officer coverage during leave.
* AUDIT LOGS: `policy.version.created`, `policy.version.approved`.
* ACCESS CONTROL: Board/CEO/BSA Officer edit; read for auditors.
* ALERTS/METRICS: Past-due policy review; % controls with named DRI.

### BA-02 — Enterprise BSA/AML Risk Assessment <a href="#ba-02-enterprise-bsaaml-risk-assessment" id="ba-02-enterprise-bsaaml-risk-assessment"></a>

* WHY (Reg cite): Risk-based program expectation; set scope for CDD/EDD/monitoring. 12 CFR §748.2; 31 CFR §1020.210. ([law.cornell.edu](https://www.law.cornell.edu/cfr/text/12/748.2?utm_source=chatgpt.com))
* SYSTEM BEHAVIOR: Maintain product/partner/channel risk catalog; compute inherent→residual scores; auto-open EDD tasks if thresholds met.
* TRIGGERS: New product/partner → (`risk.object.added`); periodic review → (`risk.review.due`).
* INPUTS: Product (`risk.product`), Channel (`risk.channel`), Geography (`risk.geo`), Customer type (`risk.member.type`).
* OUTPUTS: Board-presentable risk report; EDD queue.
* TIMERS/SLAs: Review **every 12–18 months** (notes) or on material change.
* EDGE CASES: Fintech partner sunset; surge in typology alerts.
* AUDIT LOGS: `risk.assessment.created`, `risk.assessment.approved`.
* ACCESS CONTROL: BSA Officer owns; contributors: Compliance, Ops, Vendor Mgmt.
* ALERTS/METRICS: Open high-risk items; EDD backlog days.

### BA-03 — CIP (Customer Identification Program) <a href="#ba-03-cip-customer-identification-program" id="ba-03-cip-customer-identification-program"></a>

* WHY (Reg cite): Identity verification & retention. 31 CFR §1020.220; §1010.430. ([GovInfo](https://www.govinfo.gov/content/pkg/CFR-2024-title31-vol3/pdf/CFR-2024-title31-vol3-sec1020-220.pdf?utm_source=chatgpt.com))
* SYSTEM BEHAVIOR: Enforce required data; allow doc/non-doc verification workflows; block activation until `cip.status=verified`.
* TRIGGERS: Application submitted → (`application.created`); KYC vendor result → (`kyc.result.received`).
* INPUTS: Legal name (`member.name`), DOB (`member.dob`), Address (`member.addr`), TIN/SSN/ITIN/EIN (`member.tin`), ID doc metadata (`kyc.doc.meta`).
* OUTPUTS: CIP decision (`cip.status`), reasons, verification evidence.
* TIMERS/SLAs: Verify within **reasonable time** post-opening; retain ID info **5 years** after account closure; verification records **5 years** after made. 31 CFR §1020.220(a)(3). ([ecfr.gov](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1020?utm_source=chatgpt.com))
* EDGE CASES: “TIN applied for”, remote onboarding, credit card exceptions.
* AUDIT LOGS: `cip.started`, `cip.verified`, `cip.failed`, `account.closed.cip`.
* ACCESS CONTROL: Restricted to KYC teams & BSA; PII safeguarded.
* ALERTS/METRICS: % provisional accounts > X days; verification failure rate.

### BA-04 — CDD / EDD (incl. Beneficial Ownership) <a href="#ba-04-cdd-edd-incl-beneficial-ownership" id="ba-04-cdd-edd-incl-beneficial-ownership"></a>

* WHY (Reg cite): Understand nature/purpose; risk-based monitoring; event-driven updates. 12 CFR §748.2; 31 CFR Part 1020. ([law.cornell.edu](https://www.law.cornell.edu/cfr/text/12/748.2?utm_source=chatgpt.com))
* SYSTEM BEHAVIOR: Collect expected activity and BO info; maintain high-risk playbooks (MSB, cross-border, cash-intensive).
* TRIGGERS: Business onboarding → (`cdd.started`); ownership change signal → (`bo.info.change_detected`).
* INPUTS: Purpose (`cdd.purpose`), Source of funds/wealth (`cdd.sow`), BO list (`bo.owners[]` with % and control role), Expected volumes (`cdd.expected.activity`).
* OUTPUTS: Risk rating; EDD checklist; periodic refresh tasks.
* TIMERS/SLAs: Refresh per risk tier; event-driven updates when anomalies detected.
* EDGE CASES: Trusts as owners; complex layered structures.
* AUDIT LOGS: `cdd.completed`, `edd.completed`, `bo.cert.attested`.
* ACCESS CONTROL: BSA + onboarding teams.
* ALERTS/METRICS: % high-risk without EDD < SLA; BO certification staleness.

### BA-05 — OFAC Screening & Holds <a href="#ba-05-ofac-screening-and-holds" id="ba-05-ofac-screening-and-holds"></a>

* WHY (Reg cite): Sanctions compliance; blocking/rejecting transactions; 10-year record retention from **Mar 12, 2025**. 31 CFR Part 501; Part 594. ([ecfr.gov](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-V/part-501?toc=1\&utm_source=chatgpt.com))
* SYSTEM BEHAVIOR: Screen members, counterparties, and payments at onboarding and pre-execution; block or reject per program; capture blocking reports.
* TRIGGERS: Onboarding complete → (`ofac.screen.at.onboard`); payment initiated → (`payment.pre.screen`).
* INPUTS: Names/aliases (`party.name[]`), DOB/country (`party.dob`,`party.country`), Payment metadata (`payment.meta`).
* OUTPUTS: Hit/no-hit; block/reject action; reports filed under Part 501.
* TIMERS/SLAs: File required OFAC reports per Part 501 timelines; retain records **10 years**. ([Federal Register](https://www.federalregister.gov/documents/2024/10/08/2024-23217/reporting-procedures-and-penalties-regulations?utm_source=chatgpt.com))
* EDGE CASES: Program-specific licenses; false positives; 50% rule aggregation.
* AUDIT LOGS: `ofac.hit.reviewed`, `ofac.blocked`, `ofac.rejected`, `ofac.report.filed`.
* ACCESS CONTROL: Sanctions team only; strict confidentiality.
* ALERTS/METRICS: Hit rate; decision time; overdue blocked-property reports.

### BA-06 — Transaction Monitoring & Case Mgmt <a href="#ba-06-transaction-monitoring-casemgmt" id="ba-06-transaction-monitoring-casemgmt"></a>

* WHY (Reg cite): Detect and report suspicious activity. 31 CFR §1020.320. ([ecfr.gov](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1020/subpart-B/section-1020.220?utm_source=chatgpt.com))
* SYSTEM BEHAVIOR: Generate alerts from rules/models; case queue with dispositions; feed to SAR decision.
* TRIGGERS: Alert generated → (`tms.alert.created`); analyst disposition → (`tms.case.decision`).
* INPUTS: Alert type (`alert.type`), Entities (`entity.ids`), Narrative notes (`case.notes`).
* OUTPUTS: Case files; escalation recommendations; SAR/no-SAR outcome.
* TIMERS/SLAs: Triage ≤ **2 business days**; decision within **30 days** of detection if SAR-worthy.
* EDGE CASES: Continued activity; insider abuse; structuring patterns.
* AUDIT LOGS: `case.opened`, `case.closed`, `sar.recommended`.
* ACCESS CONTROL: Need-to-know; segregation from lines of business.
* ALERTS/METRICS: Aging buckets; % closed ≤ SLA; repeat subjects.

### BA-07 — CTR Filing <a href="#ba-07-ctr-filing" id="ba-07-ctr-filing"></a>

* WHY (Reg cite): Report >$10k cash transactions aggregated by person/day. 31 CFR §1010.311; filing per §1010.306. ([ecfr.gov](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1010/subpart-E/section-1010.520?utm_source=chatgpt.com))
* SYSTEM BEHAVIOR: Auto-aggregate cash in/out per EIN/SSN per business day; flag exemptions (Phase I/II) and maintain DEP list; e-file CTR.
* TRIGGERS: Cash activity hits threshold → (`cash.threshold.exceeded`); exemption review → (`ctr.exemption.review.due`).
* INPUTS: Member ID (`member.id`); cash transactions (`cash.txn[]`); exemption status (`ctr.exempt.status`).
* OUTPUTS: CTR XML; confirmation receipt; exemption register.
* TIMERS/SLAs: File **within 15 days** of transaction(s); annual exemption review.
* EDGE CASES: Multiple branches; agencies; ineligible businesses.
* AUDIT LOGS: `ctr.generated`, `ctr.filed`, `ctr.exemption.added`.
* ACCESS CONTROL: BSA Ops only.
* ALERTS/METRICS: CTR timeliness; exemption recertification past due.

### BA-08 — SAR Filing & Confidentiality <a href="#ba-08-sar-filing-and-confidentiality" id="ba-08-sar-filing-and-confidentiality"></a>

* WHY (Reg cite): Detect/report suspicious transactions; protect SAR confidentiality. 31 CFR §1020.320. ([ecfr.gov](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1020/subpart-B/section-1020.220?utm_source=chatgpt.com))
* SYSTEM BEHAVIOR: Manage SAR decision workflow; ensure SAR and supporting docs retained 5 years; restrict SAR visibility; Board reporting cadence.
* TRIGGERS: Investigator selects “File SAR” → (`sar.decision.made`); continuing activity → (`sar.continuing.review`).
* INPUTS: Narrative (`sar.narrative`), Suspect details (`sar.subjects[]`), Loss amount (`sar.amount`).
* OUTPUTS: Filed SAR; internal monthly Board summary (non-detail if conflict).
* TIMERS/SLAs: **30 days** (suspect known) / **60 days** (no suspect); **90-day** continuing SAR cadence.
* EDGE CASES: Insider abuse (file regardless of amount); subpoenas for SARs (decline & notify FinCEN/NCUA).
* AUDIT LOGS: `sar.filed`, `sar.request.external`, `sar.request.declined`.
* ACCESS CONTROL: Strict “SAR room” permissions.
* ALERTS/METRICS: SAR timeliness; % cases escalated to SAR.

### BA-09 — Monetary Instruments Logs <a href="#ba-09-monetary-instruments-logs" id="ba-09-monetary-instruments-logs"></a>

* WHY (Reg cite): $3k–$10k monetary instruments purchase records. 31 CFR §1010.415. ([ecfr.gov](https://www.ecfr.gov/current/title-12/chapter-VII/subchapter-A/part-748/section-748.2?utm_source=chatgpt.com))
* SYSTEM BEHAVIOR: Capture identity, instrument, serials; monthly consolidation.
* TRIGGERS: MI purchase recorded → (`mi.purchase.logged`); month-end → (`mil.monthly.close`).
* INPUTS: Purchaser ID (`mi.buyer.id`), instrument details (`mi.items[]`), date/location (`mi.branch`).
* OUTPUTS: Branch log; central log.
* TIMERS/SLAs: Send to central by **15th** monthly; retain **5 years**.
* EDGE CASES: Aggregation across windows/locations.
* AUDIT LOGS: `mil.submitted`, `mil.validated`.
* ACCESS CONTROL: Branch managers + Compliance.
* ALERTS/METRICS: Missing serials; late logs.

### BA-10 — Travel Rule (Wires ≥$3,000) <a href="#ba-10-travel-rule-wires-3000" id="ba-10-travel-rule-wires-3000"></a>

* WHY (Reg cite): Maintain/transmit transmittor/beneficiary data. 31 CFR §1010.410(e),(f). ([law.cornell.edu](https://www.law.cornell.edu/cfr/text/31/1020.220?utm_source=chatgpt.com))
* SYSTEM BEHAVIOR: Require fields before release; store originator/beneficiary/ FI identifiers; include in outgoing orders.
* TRIGGERS: Wire created → (`wire.created`); release attempt → (`wire.release.requested`).
* INPUTS: Originator name/account/address (`wire.orig.*`); beneficiary name/account/address (`wire.ben.*`); FI IDs (`wire.fi.sender`,`wire.fi.receiver`).
* OUTPUTS: Complete payment order; audit packet.
* TIMERS/SLAs: Pre-release validation required.
* EDGE CASES: Non-consumer ACH/ATM/POS exclusions.
* AUDIT LOGS: `wire.validation.passed`, `wire.released`.
* ACCESS CONTROL: Payments ops; read for BSA.
* ALERTS/METRICS: % wires missing data; rejects.

### BA-11 — Information Sharing (314(a)/(b)) <a href="#ba-11-information-sharing-314a-314b" id="ba-11-information-sharing-314a-314b"></a>

* WHY (Reg cite): Mandatory searches (314(a)); optional safe-harbor sharing (314(b)). 31 CFR §1010.520; §1010.540. ([law.cornell.edu](https://www.law.cornell.edu/cfr/text/31/1010.520?utm_source=chatgpt.com))
* SYSTEM BEHAVIOR: Intake FinCEN SISS requests; search accounts/transactions across specified lookback windows; track 14-day clock; maintain 314(b) certification status and counterpart verification.
* TRIGGERS: Request received → (`314a.request.received`); FI sharing request → (`314b.request.initiated`).
* INPUTS: Subject list (`314a.subjects[]`); search windows (`314a.window`).
* OUTPUTS: Subject Information Form; internal evidence; 314(b) logs (no SAR content).
* TIMERS/SLAs: **14 days** unless otherwise specified; annual 314(b) certification.
* EDGE CASES: SAR confidentiality in 314(b) exchanges.
* AUDIT LOGS: `314a.response.filed`, `314b.counterparty.verified`.
* ACCESS CONTROL: BSA Officer controlled.
* ALERTS/METRICS: Outstanding 314(a) items; expired 314(b) certs.

### BA-12 — Record Retention <a href="#ba-12-record-retention" id="ba-12-record-retention"></a>

* WHY (Reg cite): 5-year baseline for BSA; OFAC records **10 years** from 3/12/2025. 31 CFR §1010.430; 31 CFR Part 501. ([GovInfo](https://www.govinfo.gov/link/cfr/31/1010?link-type=pdf\&sectionnum=430\&year=mostrecent\&utm_source=chatgpt.com))
* SYSTEM BEHAVIOR: Apply retention schedules by record type; legal holds override; purge with audit logs.
* TRIGGERS: Record creation → (`record.created`); scheduled purge → (`record.purge.due`).
* INPUTS: Record type (`record.type`), creation date (`record.created.at`).
* OUTPUTS: Retention registry; purge certificates.
* TIMERS/SLAs: Purge after required period unless on hold.
* EDGE CASES: Credit-card CIP dormancy; litigation holds.
* AUDIT LOGS: `record.purged`, `hold.applied`.
* ACCESS CONTROL: Records mgmt + Compliance.
* ALERTS/METRICS: % records with assigned schedule; purge backlog.

### BA-13 — Escalation Pathway <a href="#ba-13-escalation-breach-reporting" id="ba-13-escalation-breach-reporting"></a>

* WHY (Reg cite): Prompt internal reporting; regulator notifications under program rules. 12 CFR §748.2; related guidance. ([law.cornell.edu](https://www.law.cornell.edu/cfr/text/12/748.2?utm_source=chatgpt.com))
* SYSTEM BEHAVIOR: One-click “Breach/Emergent Issue” escalation to BSA Officer/GC; incident ticketing; regulator contact book.
* TRIGGERS: Staff reports breach/deficiency → (`incident.reported`); regulator inquiry → (`reg.req.received`).
* INPUTS: Incident type (`incident.type`), facts/time (`incident.timeline`), affected controls (`incident.controls[]`).
* OUTPUTS: Incident report; remediation plan; if applicable, regulatory submission record (e.g., NCUA 120-hour production under PATRIOT Act info request).
* TIMERS/SLAs: Internal acknowledgment ≤ **1 business day**; action plan ≤ **5 business days**.
* EDGE CASES: SAR confidentiality during incident handling.
* AUDIT LOGS: `incident.opened`, `incident.closed`.
* ACCESS CONTROL: Need-to-know (BSA/GC/CEO).
* ALERTS/METRICS: Open incidents; time-to-closure.

### BA-14 — Training <a href="#ba-14-training" id="ba-14-training"></a>

* WHY (Reg cite): Role-appropriate BSA/AML/OFAC training. 12 CFR §748.2(c). ([law.cornell.edu](https://www.law.cornell.edu/cfr/text/12/748.2?utm_source=chatgpt.com))
* SYSTEM BEHAVIOR: Assign curricula by role; completion tracking; Board and committee training tracked separately.
* TRIGGERS: New hire → (`training.assigned`); annual cycle → (`training.annual.start`).
* INPUTS: Role (`hr.role`), completion evidence (`lms.certificate.url`).
* OUTPUTS: Training matrix; delinquency list.
* TIMERS/SLAs: Complete within **30 days** of hire; annual refresh by **policy anniversary**.
* EDGE CASES: Contractors/fintech partners with access.
* AUDIT LOGS: `training.completed`.
* ACCESS CONTROL: HR + Compliance.
* ALERTS/METRICS: Completion rate; past-due learners.

### BA-15 — Independent Testing <a href="#ba-15-independent-testing" id="ba-15-independent-testing"></a>

* WHY (Reg cite): Periodic independent testing of program and CIP. 12 CFR §748.2(c). ([law.cornell.edu](https://www.law.cornell.edu/cfr/text/12/748.2?utm_source=chatgpt.com))
* SYSTEM BEHAVIOR: Audit calendar; scope mapping to controls; issue tracking to remediation.
* TRIGGERS: Audit start → (`audit.started`); issues logged → (`audit.issue.logged`).
* INPUTS: Audit plan (`audit.plan`), samples (`audit.samples`).
* OUTPUTS: Report to Board; remediation tickets.
* TIMERS/SLAs: Every **12–18 months**; track remediation SLAs.
* EDGE CASES: Conflicts of interest.
* AUDIT LOGS: `audit.completed`, `remediation.closed`.
* ACCESS CONTROL: Audit/Compliance only.
* ALERTS/METRICS: Open findings; repeat findings rate.

### BA-16 — High-Risk Categories (MSB, Correspondent, Private Banking) <a href="#ba-16-high-risk-categories-msb-correspondent-private-banking" id="ba-16-high-risk-categories-msb-correspondent-private-banking"></a>

* WHY (Reg cite): Risk-based EDD expectations for elevated typologies; MSB oversight. (Program rules; 31 CFR §1010.100(ff) definitions). ([ecfr.gov](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1020?utm_source=chatgpt.com))
* SYSTEM BEHAVIOR: Apply category checklists; require FINCEN registration checks for MSBs; license verification; site visit capture.
* TRIGGERS: Business classified as MSB/correspondent/private banking → (`edd.highrisk.flag`).
* INPUTS: Registration proof (`msb.reg`), licenses (`msb.state.licenses`), agent list (`msb.agents[]`).
* OUTPUTS: EDD report; approval record.
* TIMERS/SLAs: Annual EDD refresh; more frequent as risk dictates.
* EDGE CASES: Mixed-business revenues; ineligible activities.
* AUDIT LOGS: `edd.msbs.reviewed`, `edd.sitevisit.logged`.
* ACCESS CONTROL: BSA due diligence team.
* ALERTS/METRICS: Lapses in MSB renewals; unresolved red flags.

### BA-17 — CMIR (Cross-Border Currency) <a href="#ba-17-cmir-cross-border-currency" id="ba-17-cmir-cross-border-currency"></a>

* WHY (Reg cite): Report >$10k cross-border physical transport. 31 CFR §1010.340; filing logistics. ([law.cornell.edu](https://www.law.cornell.edu/cfr/text/31/1010.340?utm_source=chatgpt.com))
* SYSTEM BEHAVIOR: Identify scenarios (own shipments/receipts); generate Form 105; store confirmations.
* TRIGGERS: Declared shipment/receipt → (`cmir.required`).
* INPUTS: Amount (`cmir.amount`), route (`cmir.route`), parties (`cmir.parties`).
* OUTPUTS: Filed CMIR; tracking record.
* TIMERS/SLAs: **15 days** after receipt; by mailing/shipping date if not accompanying a person. ([Federal Register](https://www.federalregister.gov/documents/2025/06/18/2025-11211/agency-information-collection-activities-proposed-renewal-comment-request-renewal-without-change-of?utm_source=chatgpt.com))
* EDGE CASES: Common carriers (armored) guidance.
* AUDIT LOGS: `cmir.filed`.
* ACCESS CONTROL: Treasury Ops + BSA.
* ALERTS/METRICS: Late filings.

### BA-18 — FBAR (Foreign Accounts) <a href="#ba-18-fbar-foreign-accounts" id="ba-18-fbar-foreign-accounts"></a>

* WHY (Reg cite): Report foreign financial accounts >$10k aggregate. 31 CFR §1010.350. ([ecfr.gov](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1010?utm_source=chatgpt.com))
* SYSTEM BEHAVIOR: Inventory foreign accounts; calendar deadlines; e-file via BSA system.
* TRIGGERS: Threshold met → (`fbar.threshold.met`).
* INPUTS: Account list (`fbar.accounts[]`), max values (`fbar.max`).
* OUTPUTS: Filed FBAR; confirmation.
* TIMERS/SLAs: **Apr 15** (automatic extension to Oct 15).
* EDGE CASES: Consolidated subsidiaries.
* AUDIT LOGS: `fbar.filed`.
* ACCESS CONTROL: Treasury + BSA.
* ALERTS/METRICS: Missing account attestations.

### BA-19 — Prepaid Access & Third Parties <a href="#ba-19-prepaid-access-third-parties" id="ba-19-prepaid-access-third-parties"></a>

* WHY (Reg cite): Risk-based controls over prepaid programs and vendors; sanctions obligations. 31 CFR Part 1010; 31 CFR Part 501. ([ecfr.gov](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1020?utm_source=chatgpt.com))
* SYSTEM BEHAVIOR: Require due-diligence package; contract clauses for data access/audit/sanctions; set program limits in system.
* TRIGGERS: New program/vendor → (`vendor.onboard.prepaid`); periodic review → (`vendor.review.due`).
* INPUTS: Program features (`prepaid.features`), limits (`prepaid.limits`), monitoring feed (`prepaid.tx.feed`).
* OUTPUTS: Approved product config; monitoring dashboards.
* TIMERS/SLAs: Annual vendor review; critical alerts real-time to TMS.
* EDGE CASES: Non-member purchases (restrict as per notes).
* AUDIT LOGS: `vendor.dd.completed`, `prepaid.config.changed`.
* ACCESS CONTROL: Vendor Mgmt + Compliance.
* ALERTS/METRICS: Data feed uptime; rule hit rates.

### BA-20 — PEP Screening & EDD <a href="#ba-20-pep-screening-and-edd" id="ba-20-pep-screening-and-edd"></a>

* WHY (Reg cite): Risk-based AML program and CIP; enhanced due diligence for higher-risk PEPs (no categorical prohibition). [31 CFR §1020.210](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1020/subpart-B/section-1020.210); [31 CFR §1020.220](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1020/subpart-B/section-1020.220); FFIEC BSA/AML Manual—PEPs.
* SYSTEM BEHAVIOR: Screen applicants/BOs/signers against PEP datasets at onboarding/refresh; route PEP hits to EDD profile and elevated approval; adjust monitoring for cash/wires/cross-border/high-risk geos/state-owned.
* TRIGGERS: Onboarding complete → (`pep.screen.onboard`); KYC refresh due → (`pep.refresh.due`); ownership change → (`bo.info.change_detected`); adverse media → (`kyc.adverse_media.match`).
* INPUTS: PEP status (`pep.status`), role (`pep.role`), associates (`pep.associates[]`), source of wealth/funds (`cdd.sow`, `cdd.sof`), office/jurisdiction/tenure (`pep.office`, `pep.jurisdiction`, `pep.term`).
* OUTPUTS: EDD profile/risk rating (`edd.profile.url`); approval record (`edd.approval.record`); monitoring overrides (`tms.rule.override`).
* TIMERS/SLAs: EDD before activation (high-risk) or 30 days (moderate); annual refresh high-risk, biennial moderate (per BA-02).
* EDGE CASES: Domestic/foreign/former PEPs (foreign/former higher risk); associates/family as PEP-related; false positives require verification.
* AUDIT LOGS: `pep.hit.created`, `pep.hit.cleared`, `edd.profile.completed`, `edd.approval.granted`, `tms.rule.updated`.
* ACCESS CONTROL: Restricted to KYC/EDD analysts, BSA Officer, auditors (read-only).
* ALERTS/METRICS: % PEP hits closed in SLA; false positives #; EDD refresh overdue; SAR rate for PEPs vs. baseline.

***

### Embedded Checklists & Templates <a href="#checklists" id="checklists"></a>

* **Board Items Pack:** Policy approval memo, BSA Officer designation letter, meeting minutes template.
* **CIP Pack:** Required data fields (retail/business), doc/non-doc verification flows, adverse-result reasons.
* **CDD/EDD Pack:** Member risk questionnaire, BO certification form, MSB EDD checklist, site-visit template.
* **OFAC Pack:** Screening SOP, block/reject decision tree, blocked property report template.
* **CTR Pack:** Aggregation playbook, exemption (Phase I/II) DEP tracking sheet.
* **SAR Pack:** Narrative template, decision memo template, monthly Board summary template.
* **Travel Rule Pack:** Required wire fields matrix, pre-release validation checklist.
* **314(a)/(b) Pack:** SISS workflow guide, subject search worksheet, 314(b) certification & counterpart verification log.
* **Records Pack:** Retention schedule by artifact; purge certificate template.
* **Incident Pack:** Escalation form, 5-day remediation plan, regulator contact sheet.

***

### Governance & Sign-Off <a href="#governance" id="governance"></a>

* **Owner:** \{{Owner, Title\}} (BSA/AML/OFAC Compliance Officer).
* **Approvals:** \{{Approver 1, Title\}}; \{{Approver 2, Title\}}.
* **Review Cadence:** Annual (or earlier upon material change to products, partners, channels, or regulation).
* **Related Policies:** Information Security; Vendor Management; Privacy; Sanctions; Records Management.
* **Change Management:** Material updates require Board approval and versioned retention with minutes link.

***

### Definitions (select) <a href="#definitions" id="definitions"></a>

<details>

<summary>Click to expand Definitions</summary>

* **Money Laundering:** Placement, layering, integration typologies as commonly described in FinCEN/FFIEC materials (see program WHY cites above).
* **Terrorist Financing:** Funding via legitimate or illicit sources directed to terrorist activity.
* **Member (Customer):** Natural person or legal entity establishing an account/relationship.
* **Beneficial Owner:** Natural persons who own ≥25% equity interests and one control person, as captured in BO certification.
* **MSB:** Money services business per 31 CFR §1010.100(ff). ([ecfr.gov](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1020?utm_source=chatgpt.com))
* **Politically Exposed Person (PEP):** An individual who is or has been entrusted with a prominent public function (domestic or foreign), and their close associates and immediate family. PEP status does not by itself mandate account denial; it does inform risk-based EDD and monitoring expectations.

</details>

***

### Assumptions & Gaps (to confirm)

<details>

<summary>Click to expand Assumptions &#x26; Gaps</summary>

* **ORG & SCOPE:** \{{ORGANIZATION\}} and specific products/channels/partners not provided; controls are **minimum viable** and must be tailored.
* **BOI Access:** If leveraging FinCEN BOI access, internal procedures must align with access rule specifics (not scoped here).
* **Deadlines in Notes:** “Monthly Board SAR report” and “MI logs by 15th” reflected as internal policy; confirm cadence with management.
* **Prepaid Access Limits:** Implemented as risk mitigants; finalize thresholds during product approval.
* **Regulatory Contact List:** Populate incident pack with current NCUA region and FinCEN contacts.

</details>

***

#### Caller Inputs Mapping (for build-time wiring)

* Map Patrick’s bullets to: BA-01 (delegation/governance), BA-02 (risk assessment), BA-03/04 (CDD/ECDD), BA-12 (record retention 5 years), BA-07/08 (CTR/SAR), BA-11 (314(a)/(b)), BA-13 (escalation), BA-19 (prepaid/third-party).
* Where notes specify examples (e.g., high-risk info to collect), attach them as **field-level hints** in the **CDD/EDD Pack** rather than duplicating in control prose.

***

**End of Document**
