# Customer Due Diligence

#### Placeholders to fill

\{{Primary\_KYC\_Vendor\_Name\}}, \{{Secondary\_Data\_Providers\}}, \{{Program\_Manager\_1\}}, \{{Program\_Manager\_2\}}, \{{Risk\_Appetite\_Summary\}}, \{{Hard\_Threshold\}}, \{{High\_Risk\_Industries\_List\}}, \{{Sanctions\_List\_Provider\}}, \{{Adverse\_Media\_Provider\}}, \{{Review\_Frequencies\}}.

If you want, I can tune this for your exact vendors/partners and drop in an Appendix C checklist + calendar with your real SLAs and models.

#### Patrick's Requirements

* [ ] Governance
* [ ] Scope
* [ ] Who is it outsourced to?&#x20;
* [ ] What are our policies to review the third party?&#x20;
* [ ] When does ECDD apply?&#x20;
* [ ] What are your rejection limits?&#x20;
* [ ] Who is responsible for reporting breaches?&#x20;
* [ ] What's the review cadence?&#x20;

Awesome — here’s a first-cut, board-ready CDD policy for Pynthia that’s tight, complete, and easy to expand later. I included short footnotes with primary sources.

***

## Pynthia Credit Union — Customer Due Diligence (CDD) Policy

### 1) Purpose & Authority

This policy establishes the Customer Due Diligence (CDD) standards for **Pynthia Credit Union** (“Pynthia”). It implements and supports Pynthia’s BSA/AML Program and Customer Identification Program (CIP) and applies to all onboarding and ongoing relationship-management activities across products, partners, and channels.

**Authority (summary):**

* **NCUA 12 CFR Part 748** requires a written, board-approved BSA program and related security/incident practices. ([eCFR](https://www.ecfr.gov/current/title-12/chapter-VII/subchapter-A/part-748/section-748.2?utm_source=chatgpt.com))
* **FinCEN 31 CFR 1020.210** requires appropriate, risk-based procedures for **ongoing CDD** (understanding nature/purpose; member risk profiles). ([eCFR](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1020/subpart-B/section-1020.210?utm_source=chatgpt.com))
* **FinCEN 31 CFR 1020.220** sets CIP requirements (identity verification, risk-based procedures). ([eCFR](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1020/subpart-B/section-1020.220?utm_source=chatgpt.com))
* **FinCEN 31 CFR 1010.230** requires **beneficial ownership** identification/verification for legal-entity members. ([eCFR](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1010/subpart-B/section-1010.230))
* **NCUA Cyber Incident Notification**: report “reportable cyber incidents” to NCUA **within 72 hours** and follow Appendix B member-notice guidance. ([NCUA](https://ncua.gov/regulation-supervision/letters-credit-unions-other-guidance/cyber-incident-notification-requirements?utm_source=chatgpt.com))

> **Note on CTA/BOI:** FinCEN’s March 26, 2025 interim final rule narrowed Corporate Transparency Act reporting to foreign reporting companies. This does **not** change financial-institution obligations under **31 CFR 1010.230** to collect beneficial ownership from legal-entity members. ([Federal Register](https://www.federalregister.gov/documents/2025/03/26/2025-05199/beneficial-ownership-information-reporting-requirement-revision-and-deadline-extension))

### 2) Governance

* **Ownership:** The **BSA/AML Officer** owns this policy, ensures implementation, and reports to senior management and the Board Risk Committee. The **Board** approves the policy at least annually and receives regular CDD reporting. ([FFIEC BSA/AML](https://bsaaml.ffiec.gov/manual/AssessingTheBSAAMLComplianceProgram/04?utm_source=chatgpt.com))
* **The Four Pillars (+CDD):** Internal controls, independent testing, designated BSA Officer, training, **and** risk-based ongoing CDD per 31 CFR 1020.210. ([eCFR](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1020/subpart-B/section-1020.210?utm_source=chatgpt.com))
* **Escalation:** Material CDD issues → BSA/AML Officer → Management Risk Committee → Board.
* **Coverage:** Business lines, operations, information security, vendor management, and program-manager partners are accountable for compliance; Pynthia remains ultimately responsible.

### 3) Scope

Applies to all members (consumers, SMBs), products (deposits, cards, payments), channels (including non-face-to-face), and **BaaS partner** flows where onboarding occurs on Pynthia’s behalf. Interfaces with CIP/KYB, sanctions screening, fraud risk, SAR/CTR processes, vendor management, and incident response. ([FFIEC BSA/AML](https://bsaaml.ffiec.gov/manual?utm_source=chatgpt.com))

### 4) Definitions (selected)

* **CDD:** Processes to understand the **nature and purpose** of the relationship, develop/update **member risk profiles**, and conduct **ongoing monitoring**. ([FFIEC BSA/AML](https://bsaaml.ffiec.gov/manual/AssessingComplianceWithBSARegulatoryRequirements/02_ep?utm_source=chatgpt.com))
* **ECDD:** Enhanced CDD applied to higher-risk members, activities, products, geographies, or conditions.
* **Beneficial Owner (Legal Entities):** Any individual owning **≥25%** equity **and** one control party (significant responsibility). ([eCFR](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1010/subpart-B/section-1010.230))
* **Program Manager:** A third party that markets, onboards, or services members on Pynthia’s behalf under BaaS arrangements.

### 5) Risk-Based CDD Standards

**At onboarding (all members):**

* Collect sufficient information to understand the **nature/purpose** of the relationship and establish an **initial risk profile** (expected activity, funding sources, products, geographies, occupation/NAICS, anticipated volumes).
* **CIP** identity verification (risk-based, documentary/non-documentary), list screening (OFAC/sanctions), and fraud controls. ([Legal Information Institute](https://www.law.cornell.edu/cfr/text/31/1020.220?utm_source=chatgpt.com))
* **Legal entities:** Collect and **verify** beneficial owner(s) and control person per **1010.230**. ([eCFR](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1010/subpart-B/section-1010.230))

**Ongoing:**

* Monitor activity vs. expected profile; investigate deviations.
* Refresh member information on a **risk-based** cadence and upon triggers (alerts, KYC friction, ownership changes, sanctions/adverse-media hits, program changes). ([FFIEC BSA/AML](https://bsaaml.ffiec.gov/manual/AssessingComplianceWithBSARegulatoryRequirements/02_ep?utm_source=chatgpt.com))

### 6) When Enhanced CDD (ECDD) Applies — Triggers & Actions

Apply ECDD when one or more triggers exist. For each trigger, gather additional information, verify independently where feasible, escalate approvals as defined, and increase monitoring/refresh frequency.

| **Trigger**                                                                  | **What we get/do (examples)**                                                                   | **Review cadence / approvals**              |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Politically Exposed Person (PEP) or high-risk public profile                 | Senior management occupation details; source of wealth; source of funds; enhanced adverse-media | Quarterly review; BSA Officer approval      |
| High-risk geography (member, UBO, counterparties, or IP), cross-border wires | Purpose of cross-border activity; corridors; expected volumes; correspondent paths              | Quarterly; BSA Officer                      |
| Cash-intensive business, MSB, crypto-exposed activity                        | Licenses/registrations; program flow; wallet/exchange relationships                             | Quarterly; BSA Officer                      |
| Complex ownership (trusts, layered entities)                                 | Organizational charts; control documentation; legal opinions as needed                          | Semiannual; BSA Officer                     |
| Non-face-to-face with weak identity assurance                                | Additional verification; liveness/biometric or reliable third-party data                        | Quarterly; Ops + BSA                        |
| Adverse media or sanctions proximity/false positives                         | Documentary rebuttal; manual review; senior sign-off                                            | As events occur; BSA                        |
| Program-manager onboarding anomalies (high friction, high override rate)     | File/decision sampling; model back-testing; vendor RCA and fixes                                | Monthly until stabilized; BSA + Vendor Mgmt |

_(Customize with \{{Additional\_ECDD\_Triggers\}} as needed.)_\
**Standards reference:** FFIEC CDD procedures and FinCEN CDD rule. ([FFIEC BSA/AML](https://bsaaml.ffiec.gov/manual/AssessingComplianceWithBSARegulatoryRequirements/02_ep?utm_source=chatgpt.com))

### 7) Rejection & Exit Limits

Use consistent, risk-based thresholds. At minimum:

| **Decision**            | **Examples**                                                                                                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hard decline**        | Sanctions match; unresolved identity; refusal to provide/verify **beneficial owners**; prohibited industries per \{{High\_Risk\_Industries\_List\}}; confirmed fraud; model risk score > **\{{Hard\_Threshold\}}**. |
| **Conditional approve** | Elevated risk mitigated by lower limits, restricted features, or enhanced monitoring; clear documented rationale and timeline to graduate or exit.                                                                  |
| **Exit/Offboarding**    | Sustained non-cooperation; repeated SAR-related behavior; data integrity failures; vendor inability to meet SLAs creating unmitigated risk.                                                                         |

(See Appendix B for the decision flow.)

### 8) Outsourcing & Third-Party Oversight (KYC/KYB Vendors & Program Managers)

Pynthia may **outsource execution** (e.g., identity proofing, KYB data, risk modeling, onboarding flows) to **\{{Primary\_KYC\_Vendor\_Name\}}** and **\{{Program\_Manager\_1\}}/\{{Program\_Manager\_2\}}**, but **retains full accountability** for BSA/AML compliance.

**Minimum controls (life-cycle):**

* **Pre-contract due diligence:** Capabilities/data sources, model documentation and validation approach, accuracy/bias metrics, _match logic & thresholds_, watchlist providers, SOC 2/ISO 27001, privacy/GLBA safeguards, BCP/DR, subcontractor management, financial condition, regulatory posture.
* **Contracts:** Clear roles; SLAs/KPIs; audit/exam rights; data retention/deletion; security & incident-notice within contractual timelines to meet NCUA **72-hour** rule; termination/transition; human-in-the-loop/override rights. ([NCUA](https://ncua.gov/regulation-supervision/letters-credit-unions-other-guidance/cyber-incident-notification-requirements?utm_source=chatgpt.com))
* **Ongoing monitoring:** Quarterly KPI/SLA reviews; model back-testing & drift monitoring; annual independent audits or certifications; periodic control walk-throughs; issue management with documented corrective actions; **right to override** vendor outcomes.
* **Alignment to guidance:** Follow NCUA third-party expectations and **interagency third-party risk** principles (planning → due diligence → contracting → ongoing monitoring → termination). ([NCUA](https://ncua.gov/regulation-supervision/letters-credit-unions-other-guidance/evaluating-third-party-relationships?utm_source=chatgpt.com))

**Who is it outsourced to?** Maintain a current register of vendors and program managers (scope, data used, decision rights, and points of contact), including **\{{Primary\_KYC\_Vendor\_Name\}}**, **\{{Secondary\_Data\_Providers\}}**, **\{{Program\_Manager\_1\}}**, **\{{Program\_Manager\_2\}}**. _(Appendix C template.)_

**Review cadence:** Vendor KYC stack **quarterly** (KPIs) and **annually** (comprehensive review); program-manager **quarterly** control reviews and **annual** onsite/virtual assessments at minimum. _(Adjust by risk.)_ ([Federal Register](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management?utm_source=chatgpt.com))

### 9) Breach/Incident Reporting Responsibilities

* **Rapid triage & containment** by InfoSec and the vendor/program manager; immediate notification to the BSA/AML Officer and CISO.
* **NCUA reporting:** If a **reportable cyber incident** occurs (or third-party notification indicates one), Pynthia notifies NCUA **as soon as possible, no later than 72 hours** from reasonable belief or third-party notice (whichever is sooner). ([NCUA](https://ncua.gov/regulation-supervision/letters-credit-unions-other-guidance/cyber-incident-notification-requirements?utm_source=chatgpt.com))
* **Member notification:** Follow **Appendix B to Part 748** (risk assessment; clear, conspicuous notice where warranted). ([eCFR](https://www.ecfr.gov/current/title-12/chapter-VII/subchapter-A/part-748/appendix-Appendix%20B%20to%20Part%20748?utm_source=chatgpt.com))
* **SAR/other filings:** AML Investigations determines SAR need and coordinates with Legal/Compliance. Document incident details, impacts, and corrective actions. ([FFIEC BSA/AML](https://bsaaml.ffiec.gov/manual/AssessingComplianceWithBSARegulatoryRequirements/02_ep?utm_source=chatgpt.com))

**Roles:**

* **Responsible for reporting breaches:** **CISO** (incident to NCUA with Compliance support); **BSA/AML Officer** (BSA/SAR matters); **Vendor Manager** ensures third-party notifications per contract.

### 10) Recordkeeping & Retention

* Maintain CDD/CIP/beneficial-ownership records in retrievable form.
* **Retention:** Five (5) years for records required under the BSA; identity-verification records kept per CIP rule (generally five years after account closure for certain identity records). ([eCFR](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1010/subpart-D/section-1010.430?utm_source=chatgpt.com))

### 11) Quality Assurance, Metrics & Review Cadence

* **QA sampling:** Periodic sampling of onboarding and refresh files; verify data quality, evidence of nature/purpose, beneficial ownership, and approvals.
* **Model/decisioning QA:** Back-testing and drift monitoring on vendor/program-manager systems; align changes with change-management.
* **KRIs/KPIs (examples):** CDD cycle time; % high-risk members with timely ECDD; rejection rate and reasons; alert-to-SAR conversion; vendor SLA adherence; false-positive/false-negative rates on identity models; % files with current BO.
* **Cadence:**
  * **Quarterly** management reviews (metrics; issues; remediation).
  * **Annual** policy review and **Board** re-approval.
  * **Annual** independent test of BSA/AML (scope includes CDD). ([Published Guides](https://publishedguides.ncua.gov/examiner/Content/ExaminersGuide/RegulatoryCompliance/BSA/ExamProcedures/BSAPoliciesProcedures.htm?utm_source=chatgpt.com))
  * **Risk-based** vendor and program-manager reviews (minimum **annual**; more frequent for critical/high-risk). ([Federal Register](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management?utm_source=chatgpt.com))

### 12) Roles & Responsibilities (summary)

* **Board:** Approves policy; receives reports.
* **BSA/AML Officer:** Policy owner; ECDD decisions; SAR oversight; reporting.
* **First Line (Ops/Onboarding/Program Managers):** Execute CIP/CDD; collect & maintain data; implement controls.
* **Vendor Management:** Due diligence, contracting, monitoring, issue remediation.
* **InfoSec/CISO:** Security controls; incident response; NCUA 72-hour notice coordination.
* **Internal Audit/Independent Testing:** Risk-based, at least annually.

### 13) Appendices (editable templates)

**Appendix A — ECDD Trigger → Action Matrix**

* Table with Trigger, Additional Info, Verification Method, Approval Level, Review Frequency.

**Appendix B — Rejection & Exit Decision Flow**

* Decision tree: Screening hit? Identity unresolved? High risk unmitigated? SAR behavior? → Decline / Conditional / Exit with approvals.

**Appendix C — Third-Party Oversight Checklist & Review Calendar**

* Planning; due diligence; contracting (security, SLAs, audit rights, data rights); ongoing monitoring; issue mgmt; termination plans.

**Appendix D — Authority Mapping**

* Regulation/Citation → Where addressed in policy.

***

### Footnotes / References

1. **12 CFR Part 748 (NCUA)** — written, board-approved BSA program; security/incident obligations. ([eCFR](https://www.ecfr.gov/current/title-12/chapter-VII/subchapter-A/part-748/section-748.2?utm_source=chatgpt.com))
2. **FinCEN 31 CFR 1020.210** — AML program must include appropriate risk-based **ongoing CDD** (nature/purpose; risk profiles). ([eCFR](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1020/subpart-B/section-1020.210?utm_source=chatgpt.com))
3. **FinCEN 31 CFR 1020.220** — CIP requirements, risk-based identity verification. ([eCFR](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1020/subpart-B/section-1020.220?utm_source=chatgpt.com))
4. **FinCEN 31 CFR 1010.230** — Beneficial ownership requirements for legal-entity customers (≥25% ownership + one control individual). ([eCFR](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1010/subpart-B/section-1010.230))
5. **FFIEC BSA/AML Manual (CDD)** — nature/purpose, risk profiles, ongoing monitoring exams. ([FFIEC BSA/AML](https://bsaaml.ffiec.gov/manual/AssessingComplianceWithBSARegulatoryRequirements/02_ep?utm_source=chatgpt.com))
6. **NCUA Cyber Incident Notification** — report within **72 hours** of reasonable belief/third-party notice; see quick-reference guide. ([NCUA](https://ncua.gov/regulation-supervision/letters-credit-unions-other-guidance/cyber-incident-notification-requirements?utm_source=chatgpt.com))
7. **Appendix B to Part 748** — member-notice guidance for unauthorized access/use. ([eCFR](https://www.ecfr.gov/current/title-12/chapter-VII/subchapter-A/part-748/appendix-Appendix%20B%20to%20Part%20748?utm_source=chatgpt.com))
8. **CTA/BOI — Interim Final Rule (Mar 26, 2025)** — exempts _domestic_ reporting companies; foreign reporting companies continue to report (with limits). Does **not** change FI CDD obligations under 1010.230. ([Federal Register](https://www.federalregister.gov/documents/2025/03/26/2025-05199/beneficial-ownership-information-reporting-requirement-revision-and-deadline-extension))
9. **Interagency Third-Party Risk Guidance** — lifecycle principles for third-party relationships (plan, diligence, contract, monitor, terminate). ([Federal Register](https://www.federalregister.gov/documents/2023/06/09/2023-12340/interagency-guidance-on-third-party-relationships-risk-management?utm_source=chatgpt.com))

