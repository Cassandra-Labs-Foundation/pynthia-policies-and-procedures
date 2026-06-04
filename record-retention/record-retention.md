---
title: Record Retention Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v3.0
effective: 2026-06-04
next_review: 2027-06-04
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Record Retention, Document Destruction, Legal Holds, Records Management]
---

# Record Retention Policy

## General Policy Statement

Pynthia Credit Union maintains a comprehensive record-retention and destruction program that establishes minimum retention periods for records, provides for the systematic and consistent disposal of obsolete records, and ensures records can be promptly produced for examiners, auditors, and legal investigations. The program addresses both retention failure modes: destroying records too early (losing the ability to demonstrate compliance or defend a claim) and keeping records too long (raising security, cost, and CCPA-deletion exposure). It covers retention for compliance, legal (statute-of-limitations), administrative, and managerial purposes; applies to all Pynthia directors, officers, and employees; and reaches records in any form — paper, imaged, microform, or electronic media — including records held on the core processor's electronic archive and in email archives. A product-appropriate retention schedule (Schedule A) keyed to Pynthia's actual deposit, lending, and payment activities is maintained under this policy, governed centrally by the Chief Compliance Officer.

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Quarterly retention status report to the Board | Quarter closes (`records.board_report_due`) | 30 days after quarter end | SVP Operations & Finance retention/destruction report | [RR-01](#rr-01-responsibility-and-administration) |
| New product or service launches | Product approved for launch (`product.launched`) | Before first customer record is created | Schedule A entry assigned for the new record class | [RR-02](#rr-02-retention-schedule-schedule-a) |
| Annual policy and Schedule A review | Review anniversary reached (`records.annual_review_due`) | 12 months from last approval | Revised policy + Schedule A to Board | [RR-04](#rr-04-annual-policy-and-schedule-review) |
| Record reaches its documented destruction date | Destruction date passes (`record.destruction_due`) | Within 90 days of destruction date (no earlier than the date itself) | Certified destruction via licensed vendor | [RR-05](#rr-05-document-destruction) |
| Litigation, investigation, or subpoena received | Hold notice issued (`legal_hold.created`) | Same business day | Destruction suspension across all affected record classes | [RR-07](#rr-07-legal-holds) |
| Legal hold released | Hold release approved (`legal_hold.released`) | 5 business days to resume schedule | Updated destruction dates on held records | [RR-07](#rr-07-legal-holds) |
| Email archive retrievability test | Test cycle due (`email_archive.test_due`) | Semi-annually | IT retrievability test results | [RR-08](#rr-08-core-processor-and-email-archives) |
| Annual record-retention training | Training cycle opens (`training.retention_cycle_opened`) | Within 12 months of prior completion | Completion records for all employees | [RR-09](#rr-09-training) |

## RR-01 — Responsibility and Administration {#rr-01-responsibility-and-administration}

**WHY (Reg cite):** The Interagency Guidelines Establishing Information Security Standards ([12 CFR Part 364, Appendix B](https://www.ecfr.gov/current/title-12/part-364/appendix-Appendix%20B%20to%20Part%20364)) require board involvement and assigned responsibility for the program that protects and properly disposes of customer information; NCUA's parallel safeguards rule ([12 CFR Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748)) imposes the same governance expectation on federally insured credit unions.

**SYSTEM BEHAVIOR:** A single senior owner — the SVP of Operations & Finance — is responsible for monitoring all retention and destruction activity, maintaining this policy, and reporting to the Board of Directors quarterly. Each department designates a records-retention contact accountable for proper completion of retention in its area, including reviewing the department's Schedule A items, maintaining its Destruction Log, and developing department-specific training. The Chief Compliance Officer holds central governance over the control set. The roster of department contacts is write-restricted to the SVP of Operations & Finance and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarter closes and Board report is due (`records.board_report_due`) | Destruction Log entries for the quarter (`destruction_log.entries[]`), open legal holds (`legal_hold.status`), schedule exceptions (`records.exception_count`) | Quarterly retention/destruction report to the Board (`records.board_report_filed`) | 30 days after quarter end (enforced by `records.board_report_due_at`) |
| Department contact vacates the role (`records.contact_vacated`) | Department identifier (`department.id`), successor name (`records.contact_name`) | Updated contact roster + Board-report notation (`records.contact_assigned`) | 10 business days |

**ALERTS/METRICS:** Alert to the CCO if a Board report is not filed within 30 days of quarter end or if any department lacks a named records-retention contact for more than 10 business days; metric: 100% of departments with a current contact on file.

## RR-02 — Retention Schedule (Schedule A) {#rr-02-retention-schedule-schedule-a}

**WHY (Reg cite):** Federal minimum retention periods anchor the schedule: BSA recordkeeping at 5 years ([31 CFR §1010.430](https://www.ecfr.gov/current/title-31/section-1010.430)), Regulation B credit-application records at 25 months ([12 CFR §1002.12](https://www.ecfr.gov/current/title-12/part-1002/section-1002.12)), Regulation Z evidence of compliance for 2 years after disclosure with longer periods for mortgage provisions ([12 CFR §1026.25](https://www.ecfr.gov/current/title-12/part-1026/section-1026.25)), Regulation CC at 2 years ([12 CFR §229.21(g)](https://www.ecfr.gov/current/title-12/section-229.21#p-229.21(g))), Regulation E at 2 years ([12 CFR §1005.13(b)](https://www.ecfr.gov/current/title-12/part-1005/section-1005.13#p-1005.13(b))), and HMDA/Regulation C register retention ([12 CFR §1003.5](https://www.ecfr.gov/current/title-12/part-1003/section-1003.5)); the [California Financial Code](https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?tocCode=FIN) supplies state overlays for a California-supervised institution.

**SYSTEM BEHAVIOR:** Pynthia maintains Schedule A — Retention Items, a record-retention schedule keyed to Pynthia's actual deposit, lending, and payment products and services. Each record class carries a retention period set at the longest applicable federal minimum, California Financial Code overlay, or business/statute-of-limitations need; records substantially similar to a scheduled item inherit the appropriate period for that item. Legacy Alabama Banking Code schedules from the predecessor reference policy are not carried over. When a record class also contains consumer personal information, the period is set no longer than reasonably necessary, consistent with the CCPA retention-disclosure principle (deletion rights themselves are governed by the Privacy Policy). Schedule A is write-restricted to Compliance; department contacts propose changes through the SVP of Operations & Finance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New product or service approved for launch (`product.launched`) | Record classes the product generates (`record_class.id[]`), governing citations (`record_class.authority_refs[]`) | Schedule A entry with assigned retention period (`schedule_a.entry_added`) | Before first customer record is created |
| Record encountered that matches no Schedule A entry (`record_class.unmatched`) | Record description (`record_class.description`), nearest scheduled analog (`schedule_a.analog_entry_id`) | Inherited retention period assignment + Schedule A update (`schedule_a.entry_inherited`) | 30 days |
| Regulatory retention period changes (`regulation.retention_change_detected`) | Citation and new period (`record_class.authority_refs[]`, `schedule_a.retention_period`) | Amended Schedule A entry (`schedule_a.entry_amended`) | Before the regulatory effective date |

**ALERTS/METRICS:** Alert to Compliance when any record class remains unmatched to Schedule A beyond 30 days; metrics: count of unmatched record classes (target zero) and percentage of Schedule A entries with a current authority citation (target 100%).

## RR-03 — Retention Methods and Electronic-Record Integrity {#rr-03-retention-methods-and-electronic-record-integrity}

**WHY (Reg cite):** Federal law recognizes records retained in reproducible electronic form provided they remain accurate and accessible — see the E-SIGN record-retention standard ([15 U.S.C. §7001(d)](https://www.law.cornell.edu/uscode/text/15/7001)) — and the safeguards guidelines ([12 CFR Part 364, Appendix B](https://www.ecfr.gov/current/title-12/part-364/appendix-Appendix%20B%20to%20Part%20364)) require integrity protections for stored customer information.

**SYSTEM BEHAVIOR:** Records may be retained in any reproducible form — hard copy, photocopy, computer printout, microfilm, microfiche, imaging, or electronic media — provided the record can be readily reproduced into paper copy on demand. Electronic records must remain accurate, accessible, and of sufficient integrity throughout their retention period for examiners and auditors to determine Pynthia's financial condition and the substance and purpose of all transactions. When a record is converted between media (e.g., paper to image), the converted copy must be verified legible and complete before any original is destroyed under [RR-05](#rr-05-document-destruction). Storage-system administrative access is write-restricted to IT with Compliance review of access changes.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Record converted to a new medium (`record.media_converted`) | Source record identifier (`record.id`), target medium (`record.storage_medium`), legibility check result (`record.conversion_verified`) | Verified converted record; original released for destruction eligibility (`record.conversion_certified`) | Before original is destroyed |
| Periodic integrity sample of stored electronic records (`record.integrity_test_due`) | Sample of stored records (`record.id[]`), reproduction output (`record.reproduction_result`) | Integrity test report to SVP Operations & Finance (`record.integrity_test_completed`) | Annually (internal: within 30 days of test due date) |

**ALERTS/METRICS:** Alert to IT and the SVP of Operations & Finance on any failed reproduction or integrity-sample failure; metrics: integrity-test pass rate (target 100%) and time-to-reproduce a requested record (target under 1 business day).

## RR-04 — Annual Policy and Schedule Review {#rr-04-annual-policy-and-schedule-review}

**WHY (Reg cite):** The safeguards guidelines require periodic reassessment and Board reporting on the information program ([12 CFR Part 364, Appendix B](https://www.ecfr.gov/current/title-12/part-364/appendix-Appendix%20B%20to%20Part%20364)), and retention minimums shift as regulations such as [12 CFR §1002.12](https://www.ecfr.gov/current/title-12/part-1002/section-1002.12) and [31 CFR §1010.430](https://www.ecfr.gov/current/title-31/section-1010.430) are amended, making a recurring review the mechanism that keeps Schedule A lawful.

**SYSTEM BEHAVIOR:** The SVP of Operations & Finance leads a review of this policy and Schedule A at least annually, with each department contact reviewing their area's items. The review considers changes in state and federal reporting requirements, changes in Pynthia's products and services, changes in overall complexity, changes in consumer-compliance requirements, technological advances, and changes in storage costs. Proposed revisions flow from department contacts to the SVP of Operations & Finance, then to the Chief Compliance Officer and the Board for approval. Approval of revisions is restricted to the Board; interim non-substantive corrections may be applied by Compliance and ratified at the next review.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual review window opens (`records.annual_review_due`) | Current policy and Schedule A (`schedule_a.version`), department review attestations (`records.dept_review_attested[]`), change drivers (`records.review_factors[]`) | Board-approved revised policy and Schedule A (`records.policy_review_completed`) | 12 months from last approval (enforced by `records.annual_review_due_at`) |

**ALERTS/METRICS:** Alert to the CCO at 11 months since last approval if the review has not started, escalating at 12 months; metric: days since last Board-approved review (target ≤ 365).

## RR-05 — Document Destruction {#rr-05-document-destruction}

**WHY (Reg cite):** The Interagency Guidelines require proper disposal of customer information ([12 CFR Part 364, Appendix B](https://www.ecfr.gov/current/title-12/part-364/appendix-Appendix%20B%20to%20Part%20364)), and the FCRA Disposal Rule requires reasonable measures against unauthorized access to consumer-report information in disposal ([12 CFR §1022.42](https://www.ecfr.gov/current/title-12/part-1022/section-1022.42)).

**SYSTEM BEHAVIOR:** Records are destroyed only on or after their documented destruction date, and only when no legal hold under [RR-07](#rr-07-legal-holds) applies. Destruction uses a licensed document-destruction vendor in accordance with 12 CFR Part 364, Appendix B. Two verifying employees initial the department's Destruction Log to confirm what was destroyed, and the vendor's destruction certificate is attached to the log and retained. Destruction before the documented date is prohibited without written Compliance approval; destruction of records under hold is prohibited absolutely. Vendor selection and the approved-vendor list are write-restricted to the SVP of Operations & Finance with Compliance concurrence.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Record's documented destruction date passes with no hold (`record.destruction_due`) | Box/record identifiers (`record.id[]`, `storage_box.number`), hold check result (`legal_hold.clear_confirmed`), destruction date (`record.destruction_date`) | Records delivered to licensed vendor; Destruction Log entry opened (`record.destruction_initiated`) | Within 90 days of destruction date (enforced by `record.destruction_due_at`) |
| Vendor completes destruction (`vendor.destruction_completed`) | Vendor certificate (`vendor.destruction_certificate`), two verifier initials (`destruction_log.verifier_initials[]`) | Completed Destruction Log entry with attached certificate (`record.destruction_certified`) | 10 business days after vendor pickup |

**ALERTS/METRICS:** Alert to Compliance on any destruction-log entry lacking two verifier initials or a vendor certificate within 10 business days, and on any attempted destruction of a record under legal hold (target zero); metric: backlog of records past destruction date (aging buckets, alert at > 90 days).

## RR-06 — Destruction Logging and Storage Convention {#rr-06-destruction-logging-and-storage-convention}

**WHY (Reg cite):** Examiner production expectations under the safeguards guidelines ([12 CFR Part 364, Appendix B](https://www.ecfr.gov/current/title-12/part-364/appendix-Appendix%20B%20to%20Part%20364)) and NCUA's supervisory examination and reporting authority ([12 U.S.C. §1782](https://www.law.cornell.edu/uscode/text/12/1782)) require Pynthia to demonstrate what was retained, where, and what was destroyed and when.

**SYSTEM BEHAVIOR:** Each department maintains a Destruction Log (Exhibit 1) recording every retained record set and its disposition, available at all times for internal and external examiner review. Physical storage boxes are labeled with four mandatory fields — Box Number, Content Description, From/To Dates, and Destruction Date — and the label data must match the corresponding Destruction Log entry exactly. Discrepancies between a box label and the log are resolved by the department contact before the box may be moved or destroyed. Destruction Logs are write-restricted to the department's records-retention contact and read-accessible to Compliance, Internal Audit, and examiners.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Records boxed for storage (`storage_box.created`) | Box number (`storage_box.number`), content description (`storage_box.description`), date range (`storage_box.from_date`, `storage_box.to_date`), destruction date (`storage_box.destruction_date`) | Labeled box + matching Destruction Log entry (`destruction_log.entry_created`) | Before box enters storage |
| Label/log mismatch found (`destruction_log.mismatch_detected`) | Box identifier (`storage_box.number`), conflicting values (`destruction_log.entry_id`) | Corrected log or label + reconciliation note (`destruction_log.mismatch_resolved`) | 10 business days |

**ALERTS/METRICS:** Alert to the department contact and SVP of Operations & Finance on any unresolved label/log mismatch older than 10 business days; metric: percentage of stored boxes with complete four-field labels on periodic audit sampling (target 100%).

## RR-07 — Legal Holds {#rr-07-legal-holds}

**WHY (Reg cite):** Destruction of records relevant to a federal investigation or contemplated official proceeding can constitute obstruction under [18 U.S.C. §1519](https://www.law.cornell.edu/uscode/text/18/1519), and spoliation of electronically stored information exposes Pynthia to adverse-inference sanctions in civil litigation ([Fed. R. Civ. P. 37(e)](https://www.law.cornell.edu/rules/frcp/rule_37)).

**SYSTEM BEHAVIOR:** Upon notice of litigation, a government investigation, or a subpoena, scheduled destruction is suspended the same business day for all records reasonably related to the matter, regardless of their destruction dates. The Chief Compliance Officer (with counsel as needed) defines the hold scope, notifies affected department contacts and IT (for core-processor and email records), and tracks the hold until released. Held records are flagged in the Destruction Log and excluded from destruction batches under [RR-05](#rr-05-document-destruction). On release, normal schedule dates resume within 5 business days. Hold creation and release are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Litigation/investigation/subpoena notice received (`legal_hold.created`) | Matter description (`legal_hold.matter_ref`), affected record classes (`record_class.id[]`), custodian departments (`department.id[]`) | Hold notice to department contacts and IT; held records flagged (`legal_hold.notices_issued`) | Same business day |
| Hold released by Compliance/counsel (`legal_hold.released`) | Hold identifier (`legal_hold.id`), release authorization (`legal_hold.release_approved_by`) | Flags cleared; destruction dates resumed (`legal_hold.schedule_resumed`) | 5 business days |

**ALERTS/METRICS:** Alert to the CCO on any destruction event touching a flagged record (target zero — this is a hard-stop control) and on hold notices unacknowledged by a department contact after 2 business days; metric: open holds with age, reviewed quarterly.

## RR-08 — Core Processor and Email Archives {#rr-08-core-processor-and-email-archives}

**WHY (Reg cite):** Retention obligations such as [31 CFR §1010.430](https://www.ecfr.gov/current/title-31/section-1010.430) and [12 CFR §1005.13(b)](https://www.ecfr.gov/current/title-12/part-1005/section-1005.13#p-1005.13(b)) attach to the records themselves regardless of where they are stored, and the safeguards guidelines ([12 CFR Part 364, Appendix B](https://www.ecfr.gov/current/title-12/part-364/appendix-Appendix%20B%20to%20Part%20364)) require oversight of service providers that store customer information.

**SYSTEM BEHAVIOR:** A large portion of Pynthia's critical member and institution records resides on the core processor's electronic archive. Each department is accountable for confirming that the retention timeframes configured on the core archive for its records match Schedule A, and for documenting that confirmation annually as part of the [RR-04](#rr-04-annual-policy-and-schedule-review) review. Email archives are the responsibility of the IT department, which tests semi-annually that archived emails remain retrievable for their full retention period; email-system security controls themselves are governed by the Information Security Policy. Core-archive retention configuration changes are write-restricted to IT acting on a department contact's documented request.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual core-archive retention confirmation due (`core_archive.confirmation_due`) | Schedule A periods for department record classes (`schedule_a.entry_id[]`), core archive configuration (`core_archive.retention_config`) | Department confirmation attestation (`core_archive.retention_confirmed`) | Annually, within the RR-04 review window |
| Email retrievability test due (`email_archive.test_due`) | Sample of archived emails across retention vintages (`email_archive.sample_ids[]`) | Retrieval test report (`email_archive.test_completed`) | Semi-annually (internal: results filed within 15 business days) |

**ALERTS/METRICS:** Alert to the SVP of Operations & Finance on any core-archive period that diverges from Schedule A and on any failed email retrieval; metrics: count of divergent core-archive configurations (target zero) and email retrievability test pass rate (target 100%).

## RR-09 — Training {#rr-09-training}

**WHY (Reg cite):** The safeguards guidelines require staff training as part of the information program ([12 CFR Part 364, Appendix B](https://www.ecfr.gov/current/title-12/part-364/appendix-Appendix%20B%20to%20Part%20364)), and accurate execution of retention minimums such as [12 CFR §1002.12](https://www.ecfr.gov/current/title-12/part-1002/section-1002.12) depends on employees knowing the schedule that applies to their records.

**SYSTEM BEHAVIOR:** All Pynthia employees receive record-retention training at least annually. Each department's records-retention contact develops department-specific training covering this policy and the department's Schedule A items, Destruction Log practice, and legal-hold obligations. New hires complete the training within their onboarding period before handling retained records. Training completion records are themselves retained per Schedule A. The training curriculum is write-restricted to the department contacts with Compliance review.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual training cycle opens (`training.retention_cycle_opened`) | Employee roster (`employee.id[]`), department curricula (`training.curriculum_id[]`) | Completion record per employee (`training.retention_completed`) | Within 12 months of prior completion (enforced by `training.retention_due_at`) |
| New hire onboards (`employee.hired`) | New-hire identity (`employee.id`), assigned department curriculum (`training.curriculum_id`) | Onboarding training completion record (`training.retention_completed`) | Within onboarding period (internal: 30 days) |

**ALERTS/METRICS:** Alert to the department contact and SVP of Operations & Finance for any employee past due on annual training; metrics: annual completion rate (target 100%) and median days-to-complete for new hires.

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — central governance of this policy and its controls.
- **Program administrator:** SVP of Operations & Finance — day-to-day monitoring of retention and destruction and quarterly Board reporting ([RR-01](#rr-01-responsibility-and-administration)).
- **Approvers:** Patrick Wilson, Chief Compliance Officer; revisions to the policy and Schedule A are approved by the Board of Directors ([RR-04](#rr-04-annual-policy-and-schedule-review)).
- **Required participants:** Department records-retention contacts, IT (core processor and email archives), and Internal Audit (independent testing of Destruction Logs and schedule adherence).
- **Review cadence:** At least annually, or sooner upon material regulatory, product, or technology change.
- **Cross-references:** BSA Policy (substantive BSA/AML program), Lending Policy and Collections Policy (loan-file and collections records management), Cash Policy (deposit and cash operations records), Information Security Policy (security safeguards and email-system controls), Privacy Policy (consumer personal-information deletion rights).

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** The events, fields, and timers referenced throughout the EVENTS tables (e.g., `record.destruction_due`, `legal_hold.created`, `schedule_a.entry_added`, `training.retention_completed`) are not registered in `vocabulary.json` — the parsed Cassandra Banking Core spec defines no events at all and contains no records-management, legal-hold, or training resources. All codes used here follow the target naming scheme and will be confirmed by engineering before the next review.
- **Schedule A is maintained as a separate controlled document.** This policy governs the schedule's construction, inheritance rule, and review; the line-item schedule itself (keyed to Pynthia's actual deposit, lending, and payment products, with federal minimums and California Financial Code overlays, and excluding legacy Alabama Banking Code periods) lives as a companion artifact referenced from [RR-02](#rr-02-retention-schedule-schedule-a). Patrick's notes did not include the Pynthia-specific line items, so the reference policy's bank-era schedule was treated as input, not adopted verbatim.
- **12 CFR Part 364, Appendix B is an FDIC rule.** Patrick's notes specify destruction in accordance with Part 364 App. B; for a federally insured credit union the directly applicable parallel is NCUA 12 CFR Part 748, Appendix A. Both are cited in [RR-01](#rr-01-responsibility-and-administration); confirmation is needed on whether Pynthia's charter and insurance status make Part 748 the controlling citation throughout.
- **Specific California Financial Code retention sections are not enumerated.** The notes require "California Financial Code overlays" without citing sections; the controlling DFPI retention provisions applicable to Pynthia's charter need to be confirmed and pinned to individual Schedule A entries.
- **Quarterly Board-reporting cadence is assumed.** The notes require reporting to the Board without specifying frequency; quarterly was selected as the minimal defensible cadence pending confirmation.
- **The destruction-window SLA (90 days after destruction date) and hold-resume SLA (5 business days) are internal assumptions.** No regulation fixes these; they were chosen as operationally reasonable and need owner confirmation.
- **Semi-annual email retrievability testing is an assumption.** The notes require "periodic" testing without a frequency; semi-annual was selected pending confirmation by IT and the CCO.
- **Exhibit 1 — Destruction Log format is inherited from the reference policy.** The exhibit itself is maintained outside this document; its field set is assumed to mirror the box-label convention in [RR-06](#rr-06-destruction-logging-and-storage-convention).
- **Employee/HR personnel-record retention has no dedicated policy home.** This repository has no HR policy; HR record classes are covered only through Schedule A entries until a dedicated policy exists.
- **CCPA over-retention exposure is addressed structurally, not procedurally.** This policy caps retention at scheduled periods to limit deletion-right exposure; the consumer deletion-request workflow itself is governed by the Privacy Policy and is out of scope here.
