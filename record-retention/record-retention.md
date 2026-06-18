```yaml
---
title: Record Retention Policy (Table-First, Design-Overlay v3)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2025-07-01
next_review: 2026-07-01
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Record Retention, Destruction, Legal Hold, BSA, CPRA, Schedule A]
---
```

## General Policy Statement

Pynthia Credit Union maintains a comprehensive record-retention and destruction program that establishes minimum retention periods for all records, provides for the systematic and defensible disposal of obsolete records, and ensures records can be promptly produced for examiners, auditors, and legal investigations. The program covers retention for compliance, legal (statute-of-limitations), administrative, and managerial purposes and applies to all Pynthia directors, officers, and employees. It governs records in any form — paper, imaged, microform, or electronic media — including records held by the core processor and email archives. Retention periods are keyed to Pynthia's actual California-chartered credit union products and services (Schedule A); Alabama Banking Code schedules are not carried forward. The two principal failure modes this policy guards against are premature destruction (loss of compliance evidence or litigation defense) and excessive retention (security, cost, and CPRA deletion-right exposure).

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Annual policy and Schedule A review | Calendar year-end or material product/regulatory change | 12 months from last review | Policy text + Schedule A | [RR-04 — Annual Policy and Schedule Review](#rr-04-annual-policy-and-schedule-review) |
| Retention clock set on new record | Record created or account/relationship closed | Same business day | `record.retention_anchor`, `record.retention_class` | [RR-02 — Retention Schedule (Schedule A)](#rr-02-retention-schedule-schedule-a) |
| Destruction eligibility reached | `record.retention_expires_at` fires | After documented destruction date (no earlier) | Destruction Log (Exhibit 1), vendor certificate | [RR-05 — Document Destruction](#rr-05-document-destruction) |
| Destruction log entry created | Records placed in destruction bin or delivered to vendor | Same day as destruction | Exhibit 1 per department | [RR-06 — Destruction Logging and Storage Convention](#rr-06-destruction-logging-and-storage-convention) |
| Legal hold placed | Litigation, investigation, or subpoena identified | Immediately upon notice | `legal_hold.hold_scope`, `record.legal_hold_flag` | [RR-07 — Legal Holds](#rr-07-legal-holds) |
| Legal hold released | Matter resolved and hold authorizer approves release | Upon written release authorization | `legal_hold.released_at`, `disposal.clock_resumed` | [RR-07 — Legal Holds](#rr-07-legal-holds) |
| Core-processor retention confirmed | Annual review cycle | 12 months | `core_archive.retention_config` | [RR-08 — Core Processor and Email Archives](#rr-08-core-processor-and-email-archives) |
| Email archive retrievability test | Annual review cycle | 12 months | `email_archive.test_due` | [RR-08 — Core Processor and Email Archives](#rr-08-core-processor-and-email-archives) |
| Annual employee training | Calendar year | 12 months from last cycle | Training completion records | [RR-09 — Training](#rr-09-training) |
| BSA/AML anonymization after 5-year period | 5-year BSA retention period expires | Before any further retention of individually identifiable data | Anonymization audit trail | [RR-10 — BSA/AML Anonymization and Extended Analytical Retention](#rr-10-bsaaml-anonymization-and-extended-analytical-retention) |
| CDD refresh — higher-risk customer | Rolling annual cycle or new product/service added | 12 months from last refresh | CDD refresh record | [RR-11 — CDD Refresh Cycle and Stale-Record Disposition](#rr-11-cdd-refresh-cycle-and-stale-record-disposition) |
| CDD refresh — standard-risk customer | Rolling biennial cycle or new product/service added | 24 months from last refresh | CDD refresh record | [RR-11 — CDD Refresh Cycle and Stale-Record Disposition](#rr-11-cdd-refresh-cycle-and-stale-record-disposition) |
| Permanent-record inventory confirmation | Annual review cycle | 12 months | SVP attestation to Board | [RR-12 — Institutional and Corporate Records — Retention Schedule](#rr-12-institutional-and-corporate-records-retention-schedule) |

---

## RR-01 — Responsibility and Administration {#rr-01-responsibility-and-administration}

**WHY (Reg cite):** Sound governance of a retention program requires a designated senior owner with Board accountability. [12 CFR Part 364, App. B](https://www.ecfr.gov/current/title-12/part-364) (Interagency Guidelines Establishing Information Security Standards) requires administrative safeguards — including clear ownership — over the security, confidentiality, and integrity of customer-information records throughout their lifecycle, including at destruction.

**SYSTEM BEHAVIOR:** The SVP of Operations & Finance is the single senior owner responsible for monitoring all record-retention and destruction activity, maintaining and updating this policy, and reporting program status to the Board of Directors at least annually. Each department designates one employee as its records-retention contact; that contact is accountable for proper completion of retention obligations within the department and for forwarding any proposed policy updates to the SVP of Operations & Finance. The CCO owns this policy document and approves it; the SVP of Operations & Finance owns operational execution. The `records` entity is write-restricted to Compliance and the SVP of Operations & Finance for contact-assignment and exception-count fields; department contacts may update their own department's retention log entries.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Department records-retention contact is newly designated or changes (`records.contact_assigned`) | Department identifier (`department.id`), new contact name (`records.contact_name`) | Contact assignment recorded in program roster (`records.contact_assigned`) | Immediately upon designation |
| SVP of Operations & Finance submits annual Board report on retention program (`records.board_report_filed`) | Exception count (`records.exception_count`), destruction activity summary, permanent-record inventory status, any policy gaps | Board report filed and logged (`records.board_report_filed`) | Annually; enforced by `records.board_report_due_at` |
| Records-retention contact vacancy detected (contact separated or role vacated) (`records.contact_vacated`) | Departing contact identity (`employee.id`), department identifier (`department.id`) | Vacancy flagged; SVP notified for reassignment (`records.contact_vacated`) | Same business day as separation or vacancy |

**ALERTS/METRICS:** Alert fires when `records.board_report_due_at` is within 10 business days and no `records.board_report_filed` event has been emitted for the current cycle. Alert fires when `records.contact_vacated` is unresolved for more than 5 business days (department has no designated contact).

---

## RR-02 — Retention Schedule (Schedule A) {#rr-02-retention-schedule-schedule-a}

**WHY (Reg cite):** Multiple federal regulations mandate minimum retention periods: [31 CFR §1010.430](https://www.ecfr.gov/current/title-31/part-1010/section-1010.430) (BSA — 5 years); [12 CFR Part 1002](https://www.ecfr.gov/current/title-12/part-1002) (Reg B/ECOA — 25 months for credit-application records); [12 CFR Part 1026](https://www.ecfr.gov/current/title-12/part-1026) (Reg Z/TILA — 3 years after disclosure); [12 CFR Part 229](https://www.ecfr.gov/current/title-12/part-229) (Reg CC — 2 years); [12 CFR Part 1005](https://www.ecfr.gov/current/title-12/part-1005) (Reg E — 2 years); [12 CFR Part 1003](https://www.ecfr.gov/current/title-12/part-1003) (HMDA/Reg C — LAR and supporting records). California Financial Code imposes additional state-law overlays for DFPI-chartered institutions.

**SYSTEM BEHAVIOR:** Schedule A is the authoritative retention schedule keyed to Pynthia's actual deposit, lending, and payment products. Each record class in Schedule A carries a retention period, an anchor-date rule (e.g., date of account closure, date of disclosure, date of transaction), and a destruction-date formula. Records substantially similar to a scheduled item inherit the applicable period. Alabama Banking Code schedules are not used. For operational simplicity, consumer transaction records subject to 2-year minimums (Reg CC, Reg E) and the 25-month Reg B minimum are retained on a unified 3-year schedule; this consolidation is documented in Schedule A and does not materially increase CPRA exposure. When a record is created or an anchor event occurs (e.g., account closure), the system sets `record.retention_anchor`, `record.retention_class`, and `record.retention_expires_at` automatically from the Schedule A lookup. The `schedule_a` entity is write-restricted to Compliance and the SVP of Operations & Finance; department contacts may propose amendments but cannot directly modify the schedule.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New record created or anchor event occurs (e.g., account closed, disclosure delivered) (`record.retention_clock_set`) | Record identifier (`record.id`), record class (`record.retention_class`), anchor date (`record.retention_anchor`), applicable Schedule A entry (`schedule_a.retention_period`) | Retention clock set; expiry date stamped (`record.retention_clock_set`); `record.retention_expires_at` populated | Same business day as triggering event |
| Record class encountered that has no Schedule A entry (`record_class.unmatched`) | Record description (`record_class.description`), department identifier (`department.id`) | Gap flagged to Compliance and SVP for Schedule A amendment (`schedule_a.entry_added` after resolution) | Within 5 business days of detection |
| Schedule A entry amended (new product, regulatory change, or annual review) (`schedule_a.entry_added`) | Amendment description, prior period, new period, authority basis (`regulation.citation`) | Schedule A version incremented and logged (`schedule_a.entry_added`); prior version archived | Before the amended period takes effect |

**ALERTS/METRICS:** Alert fires when `record_class.unmatched` events accumulate more than 5 unresolved instances in any rolling 30-day window. Dashboard metric: count of records with `record.retention_expires_at` in the past and no `record.destroyed` or `record.hold_applied` event — target zero.

---

## RR-03 — Retention Methods and Electronic-Record Integrity {#rr-03-retention-methods-and-electronic-record-integrity}

**WHY (Reg cite):** [12 CFR Part 364, App. B](https://www.ecfr.gov/current/title-12/part-364) requires that electronic records be accurate, accessible, and of sufficient integrity to enable examiners to determine a financial institution's financial condition and the substance and purpose of all transactions. No federal regulation mandates a specific storage medium, permitting retention in any reproducible form.

**SYSTEM BEHAVIOR:** Records may be retained in any reproducible form: hard copy, photocopy, computer printout, microfilm, microfiche, imaging, or electronic media storage. Electronic records must remain accurate, accessible, and of sufficient integrity throughout the retention period. Integrity is verified by periodic testing of electronic archives (see [RR-08](#rr-08-core-processor-and-email-archives) for core-processor and email-archive specifics). When a record is converted from one medium to another (e.g., paper scanned to image), the conversion must be certified before the source medium is destroyed. Records that cannot be reproduced into a usable format fail the integrity standard and must be remediated before the retention period expires. The `record_integrity` subject and `record.integrity_test_due` timer govern scheduled integrity checks; write access to integrity-test results is restricted to IT and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Electronic record or archive integrity test scheduled (`record.integrity_test_completed`) | Record or archive identifier (`record.id`), storage medium (`record.storage_medium`), test scope | Integrity test result logged (`record.integrity_test_completed`); failure triggers remediation task | Annually or upon medium conversion; enforced by `record.integrity_test_due` |
| Record converted from one medium to another (`record.conversion_certified`) | Source medium (`record.media_type`), target medium, conversion method, certifying officer | Conversion certified and logged (`record.conversion_certified`); `record.media_converted` set | Before source medium is destroyed |
| Integrity failure detected (record not reproducible or corrupted) (`record.audit.opened`) | Record identifier (`record.id`), failure description (`incident.description`), storage medium | Remediation task opened; Compliance and SVP notified (`record.audit.opened`) | Within 1 business day of detection |

**ALERTS/METRICS:** Alert fires when any `record.integrity_test_due` timer is overdue by more than 5 business days. Alert fires immediately on any integrity-failure event with no remediation task opened within 1 business day.

---

## RR-04 — Annual Policy and Schedule Review {#rr-04-annual-policy-and-schedule-review}

**WHY (Reg cite):** [12 CFR Part 364, App. B](https://www.ecfr.gov/current/title-12/part-364) requires ongoing maintenance of information-security safeguards, which includes keeping retention schedules current. California Financial Code requires DFPI-chartered institutions to maintain records in accordance with current state and federal requirements, necessitating periodic review as those requirements change.

**SYSTEM BEHAVIOR:** The SVP of Operations & Finance, in coordination with the CCO, reviews this policy and Schedule A at least annually. The review must consider: changes in state and federal reporting requirements; changes in Pynthia's products and services; changes in overall complexity; changes in consumer-compliance requirements; technological advances; and changes in storage costs. Any revisions are forwarded to the CCO for approval and, where material, to the Board of Directors. The `records.annual_review_due_at` timer enforces the annual cadence. The `policy` entity tracks version, effective date, and Board approval; write access is restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual review cycle opens (`records.policy_review_completed`) | Prior policy version (`policy.document_version`), review checklist covering the six statutory factors, any proposed amendments | Review completed and logged; amended policy version drafted if changes required (`records.policy_review_completed`, `policy.amendment_proposed` if changes) | 12 months from last review; enforced by `records.annual_review_due_at` |
| Policy amendment approved by CCO and Board (where material) (`policy.board_approved`) | Redlined policy draft (`policy.draft_redline`), change summary (`policy.change_summary`), Board minutes reference (`policy.minutes_reference`) | New policy version published and logged (`policy.version_published`); prior version archived | Before the amended policy takes effect |
| Regulation change detected that affects retention periods (`regulation.retention_change_detected`) | Regulatory citation (`regulation.citation`), affected record classes, required period change | Out-of-cycle Schedule A amendment initiated (`schedule_a.entry_added` after resolution); CCO notified | Within 30 days of regulatory effective date |

**ALERTS/METRICS:** Alert fires when `records.annual_review_due_at` is within 30 days and no `records.policy_review_completed` event has been emitted for the current cycle. Alert fires when `regulation.retention_change_detected` is unresolved (no Schedule A amendment) for more than 30 days.

---

## RR-05 — Document Destruction {#rr-05-document-destruction}

**WHY (Reg cite):** [12 CFR Part 364, App. B](https://www.ecfr.gov/current/title-12/part-364) requires that destruction of customer-information records be conducted using appropriate safeguards, including use of a licensed destruction vendor. Premature destruction of records subject to regulatory retention periods violates the underlying regulations (e.g., [31 CFR §1010.430](https://www.ecfr.gov/current/title-31/part-1010/section-1010.430), [12 CFR Part 1002](https://www.ecfr.gov/current/title-12/part-1002), [12 CFR Part 1026](https://www.ecfr.gov/current/title-12/part-1026)).

**SYSTEM BEHAVIOR:** Records may not be destroyed before the documented destruction date recorded in the Destruction Log (Exhibit 1) and on the storage box. Destruction must be performed by a licensed document-destruction vendor in accordance with [12 CFR Part 364, App. B](https://www.ecfr.gov/current/title-12/part-364). Two verifying associates must initial the Destruction Log entry at the time of destruction. The vendor's destruction certificate must be obtained and attached to the log entry. Records subject to a legal hold (see [RR-07](#rr-07-legal-holds)) are excluded from all destruction runs regardless of their scheduled destruction date. The `record.disposal_eligible` flag must be `true` and `record.legal_hold_flag` must be absent or `false` before any destruction event is emitted. Write access to destruction-log entries is restricted to the department records-retention contact and the SVP of Operations & Finance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Retention period expires and record is eligible for destruction (`record.destruction_initiated`) | Record identifier (`record.id`), destruction date (`record.destruction_date`), `record.disposal_eligible` = true, `record.legal_hold_flag` = false, storage box number (`storage_box.number`) | Destruction initiated; record flagged for vendor pickup (`record.destruction_initiated`) | After documented destruction date; enforced by `record.destruction_due_at` |
| Destruction executed by licensed vendor (`record.destroyed`) | Vendor identity, two-associate initials (logged in `destruction_log.entry_id`), vendor destruction certificate (`vendor.destruction_certificate`) | Record destroyed; destruction log entry completed with certificate attached (`record.destroyed`, `disposal.certificate_recorded`) | Same day as physical destruction |
| Destruction certificate received and attached (`disposal.certificate_recorded`) | Vendor destruction certificate, destruction log entry reference (`destruction_log.entry_id`) | Certificate recorded and linked to destruction log (`disposal.certificate_recorded`) | Within 2 business days of destruction |

**ALERTS/METRICS:** Alert fires when `record.destruction_due_at` is overdue by more than 30 days and no `record.destroyed` event has been emitted (records eligible but not yet destroyed). Alert fires immediately if a `record.destruction_initiated` event is emitted for a record where `record.legal_hold_flag` is true — this is a control failure requiring immediate investigation.

---

## RR-06 — Destruction Logging and Storage Convention {#rr-06-destruction-logging-and-storage-convention}

**WHY (Reg cite):** [12 CFR Part 364, App. B](https://www.ecfr.gov/current/title-12/part-364) requires that destruction be documented with sufficient evidence for examiner review. Examiners expect to be able to trace any record's disposition — whether retained, destroyed, or held — from a single log.

**SYSTEM BEHAVIOR:** Each department maintains a Destruction Log (Exhibit 1) for all records being retained and destroyed. The log is maintained by the department's records-retention contact and must be available for review by internal and external examiners at all times. Physical storage boxes must be labeled on the front with at minimum: Box Number, Content Description, From Date, To Date, and Destruction Date. The information on the box label must correspond exactly to the Destruction Log entry for that box. The `storage_box` entity captures these five fields; the `destruction_log` entity links each box to its log entry. Mismatches between box labels and log entries must be detected and resolved before any destruction run. Write access to `destruction_log` entries is restricted to the department records-retention contact; the SVP of Operations & Finance has read access to all departments.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Records placed in storage box (`storage_box.created`) | Box number (`storage_box.number`), content description (`storage_box.description`), from date (`storage_box.from_date`), to date (`storage_box.to_date`), destruction date (`storage_box.destruction_date`) | Storage box record created; corresponding destruction log entry created (`storage_box.created`, `destruction_log.entry_created`) | Same day records are boxed |
| Mismatch detected between box label and destruction log entry (`destruction_log.mismatch_detected`) | Box number (`storage_box.number`), log entry reference (`destruction_log.entry_id`), discrepancy description | Mismatch flagged; department contact and SVP notified (`destruction_log.mismatch_detected`) | Within 1 business day of detection |
| Mismatch resolved (`destruction_log.mismatch_resolved`) | Corrected box label or log entry, resolution notes | Mismatch resolved and logged (`destruction_log.mismatch_resolved`) | Within 5 business days of detection |

**ALERTS/METRICS:** Alert fires when any `destruction_log.mismatch_detected` event is unresolved for more than 5 business days. Dashboard metric: count of storage boxes with no corresponding `destruction_log.entry_id` — target zero.

---

## RR-07 — Legal Holds {#rr-07-legal-holds}

**WHY (Reg cite):** Destruction of records subject to litigation, investigation, or subpoena constitutes spoliation and may violate court orders, regulatory directives, and applicable law. [12 CFR Part 364, App. B](https://www.ecfr.gov/current/title-12/part-364) requires that customer-information records be protected from unauthorized destruction. The legal-hold obligation is independent of and supersedes any scheduled destruction date in Schedule A.

**SYSTEM BEHAVIOR:** When Pynthia receives notice of litigation, a regulatory investigation, or a subpoena, the CCO or General Counsel immediately places a legal hold on all records potentially relevant to the matter. The hold is recorded in the `legal_hold` entity with `legal_hold.hold_scope` describing the affected record classes and `legal_hold.matter_id` linking to the matter. All affected records have `record.legal_hold_flag` set to `true` and `record.hold_status` updated; these records are excluded from all routine destruction runs (see [RR-05](#rr-05-document-destruction)) until the hold is released. Holds are released only upon written authorization from the CCO or General Counsel after the matter is resolved; release sets `legal_hold.released_at` and `legal_hold.schedule_resumed`, restoring normal destruction eligibility. The `legal_hold` entity is write-restricted to Compliance (CCO) and Legal.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Litigation, investigation, or subpoena notice received (`legal_hold.created`) | Matter reference (`legal_hold.matter_id`), hold scope (`legal_hold.hold_scope`), placing authority (`legal_hold.placed_at`), affected record classes | Legal hold created; all in-scope records flagged (`legal_hold.created`, `record.hold_applied` for each affected record) | Immediately upon notice; same business day |
| Legal hold release authorized by CCO or General Counsel (`legal_hold.clear_confirmed`) | Release authorization (`legal_hold.release_approved_by`), matter resolution basis, release date (`legal_hold.released_at`) | Hold released; `legal_hold.schedule_resumed` set; affected records' `record.legal_hold_flag` cleared; normal destruction clock resumed (`legal_hold.clear_confirmed`, `record.hold_released` for each affected record) | Upon written release authorization |
| Destruction run attempted on a held record (control failure) | Record identifier (`record.id`), `record.legal_hold_flag` = true | Destruction blocked; alert fired; incident opened (`record.hold_applied` re-asserted; `incident.created`) | Immediately; automated block |

**ALERTS/METRICS:** Alert fires immediately if any destruction event is attempted on a record with `record.legal_hold_flag` = true. Alert fires when any `legal_hold` with `status` = active has been open for more than 365 days without a review event — prompts CCO to confirm the hold remains necessary.

---

## RR-08 — Core Processor and Email Archives {#rr-08-core-processor-and-email-archives}

**WHY (Reg cite):** [12 CFR Part 364, App. B](https://www.ecfr.gov/current/title-12/part-364) requires that administrative safeguards extend to all media on which customer information is stored, including records maintained by service providers. BSA recordkeeping under [31 CFR §1010.430](https://www.ecfr.gov/current/title-31/part-1010/section-1010.430) applies regardless of whether records are held by the institution or its core processor.

**SYSTEM BEHAVIOR:** The core processor (currently FIS) maintains a large portion of critical customer and institution records via electronic archive. Each department is accountable for confirming that proper retention timeframes are configured in the core-processor archive for records within its area of responsibility; this confirmation is documented annually via the `core_archive.retention_config` field and the `core_archive.retention_confirmed` event. IT is responsible for email archives: IT must configure email retention periods consistent with Schedule A and must periodically test that archived emails are retrievable. Retrievability test results are recorded in the `email_archive` entity. Failures in either the core-processor configuration or email retrievability testing must be escalated to the SVP of Operations & Finance and CCO within 1 business day. Write access to `core_archive` configuration is restricted to IT with Compliance approval; `email_archive` test results are written by IT.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual core-processor retention confirmation (`core_archive.retention_confirmed`) | Department identifier (`department.id`), retention configuration snapshot (`core_archive.retention_config`), confirming contact (`records.contact_name`) | Confirmation recorded; any misconfiguration flagged for remediation (`core_archive.retention_confirmed`) | Annually; enforced by `core_archive.confirmation_due` |
| Email archive retrievability test completed (`email_archive.test_completed`) | Test scope, sample of archived emails tested, test result (pass/fail), IT responsible party | Test result recorded (`email_archive.test_completed`); failure triggers escalation | Annually; enforced by `email_archive.test_due` |
| Core-processor misconfiguration or email retrievability failure detected | Failure description (`incident.description`), affected record classes, department identifier (`department.id`) | Incident opened; SVP and CCO notified; remediation task created (`incident.created`) | Within 1 business day of detection |

**ALERTS/METRICS:** Alert fires when `core_archive.confirmation_due` is overdue by more than 5 business days for any department. Alert fires when `email_archive.test_due` is overdue by more than 5 business days. Alert fires immediately on any email retrievability test failure.

---

## RR-09 — Training {#rr-09-training}

**WHY (Reg cite):** [12 CFR Part 364, App. B](https://www.ecfr.gov/current/title-12/part-364) requires that personnel be trained on information-security safeguards, which includes proper record handling and destruction. Effective training is also a prerequisite for demonstrating a sound compliance management system to NCUA examiners under [12 CFR Part 701.31](https://www.ecfr.gov/current/title-12/part-701/section-701.31).

**SYSTEM BEHAVIOR:** All Pynthia directors, officers, and employees receive annual record-retention training covering this policy, Schedule A, destruction procedures, and legal-hold obligations. Training is coordinated by the Operations department. Each department's records-retention contact develops department-specific training content covering that department's particular retention requirements. Completion is tracked per employee; the `training` entity records completion status, curriculum version, and due date. Department-specific training content is developed by the records-retention contact and reviewed by the CCO before delivery. Write access to training completion records is restricted to the Operations department and IT (for LMS integration); department contacts may submit completion attestations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual training cycle opens (`training.annual_cycle_opened`) | Curriculum version (`training.content_version`), assignee roster (`training.assignee_id` for all employees), due date (`training.annual_due_at`) | Training assignments created for all employees (`training.annual_cycle_opened`, `training.assignment_created` per employee) | At cycle open; enforced by `training.annual_due_at` |
| Employee completes annual record-retention training (`training.completed`) | Employee identifier (`training.assignee_id`), curriculum identifier (`training.curriculum_id`), completion date, assessment score (`training.assessment_score`) | Completion recorded (`training.completed`); `training.completion_status` updated | Within the annual cycle window; enforced by `training.annual_due_at` |
| Department-specific training content approved (`training.session_delivered`) | Department identifier (`department.id`), content version, CCO approval reference, records-retention contact identifier | Department training content approved and delivered (`training.session_delivered`) | Before department-specific training is delivered to employees |

**ALERTS/METRICS:** Alert fires when `training.annual_due_at` is within 30 days and training completion rate across all employees is below 80%. Alert fires when any employee's training is overdue (past `training.annual_due_at` with no `training.completed` event) — target zero overdue at cycle close.

---

## RR-10 — BSA/AML Anonymization and Extended Analytical Retention {#rr-10-bsaaml-anonymization-and-extended-analytical-retention}

**WHY (Reg cite):** [31 CFR §1010.430](https://www.ecfr.gov/current/title-31/part-1010/section-1010.430) requires 5-year retention of BSA/AML records. California's Consumer Privacy Rights Act (CPRA) requires that personal information not be retained longer than necessary for the disclosed purpose and grants consumers deletion rights; retention of individually identifiable BSA data beyond 5 years without a specific legal basis creates CPRA exposure. Anonymized data that meets the CPRA de-identification standard (Cal. Civ. Code §1798.140(m)) is not "personal information" and may be retained for legitimate analytical purposes.

**SYSTEM BEHAVIOR:** At the expiration of the 5-year BSA/AML retention period, individually identifiable customer information in BSA/AML records must be either destroyed (per [RR-05](#rr-05-document-destruction)) or anonymized to the CPRA de-identification standard: (1) reasonable measures are taken to prevent re-identification; and (2) Pynthia makes a public commitment not to re-identify the data. Anonymized and aggregated BSA/AML data — from which no individual can be identified — may be retained beyond 5 years for compliance analytics, trend analysis, and program improvement. The anonymization process, the date it occurred, and the method used must be documented in the audit trail so that examiners can confirm the disposition of individually identifiable records even when older data cannot be traced to specific customers. The `analytics.deid_method_id` field records the de-identification method; `analytics.reid_risk_assessment` documents the re-identification risk assessment. Write access to anonymization records is restricted to Compliance (BSA department) and IT.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| 5-year BSA/AML retention period expires for a record or batch (`record.retention_expired`) | Record identifier (`record.id`), record class (`record.retention_class`), retention anchor (`record.retention_anchor`), `record.retention_expires_at` | Retention expiry flagged; disposition decision required — destroy or anonymize (`record.retention_expired`) | At `record.retention_expires_at`; enforced by `record.destruction_due_at` |
| Anonymization of individually identifiable BSA/AML data executed (`record.disposed`) | De-identification method (`analytics.deid_method_id`), re-identification risk assessment (`analytics.reid_risk_assessment`), anonymization date, authorizing officer, public commitment reference | Anonymization recorded in audit trail; `record.dispositioned` set; anonymized dataset retained under new record class (`record.disposed`, `disposal.certificate_recorded`) | Before any further retention of individually identifiable data beyond 5 years |
| Anonymized BSA/AML dataset retained for extended analytical use (`records.retention_applied`) | Anonymized dataset identifier, anonymization audit trail reference, retention justification (analytics/trend/program improvement), `analytics.deid_method_id` | Extended retention documented; dataset flagged as anonymized and non-PII (`records.retention_applied`) | At time of anonymization decision |

**ALERTS/METRICS:** Alert fires when any BSA/AML record reaches `record.retention_expires_at` and no disposition event (`record.destroyed` or `record.disposed`) has been emitted within 30 days. Alert fires if any anonymized dataset lacks a `analytics.deid_method_id` reference — indicates incomplete anonymization documentation.

---

## RR-11 — CDD Refresh Cycle and Stale-Record Disposition {#rr-11-cdd-refresh-cycle-and-stale-record-disposition}

**WHY (Reg cite):** FinCEN's Customer Due Diligence rule ([31 CFR §1010.230](https://www.ecfr.gov/current/title-31/part-1010/section-1010.230)) requires financial institutions to maintain current and accurate CDD information and to update it on a risk-based schedule. CPRA data-minimization obligations (Cal. Civ. Code §1798.100(e)) require that personal information not be retained beyond what is necessary — superseded CDD records containing stale personal information must be disposed of rather than accumulated.

**SYSTEM BEHAVIOR:** CDD records are refreshed on a rolling basis: at minimum annually for higher-risk customers (`cdd.risk_tier` = high), every two years for standard-risk customers (`cdd.risk_tier` = standard), and upon any new product or service added to a customer relationship. The `cdd.refresh_due` timer enforces the applicable cadence. Upon refresh, the BSA department evaluates superseded CDD records: information that has been updated or replaced is destroyed or anonymized (consistent with [RR-10](#rr-10-bsaaml-anonymization-and-extended-analytical-retention)) rather than carried forward. The BSA department must document in the customer file: the refresh date, the triggering event (scheduled review or new product/service), and the disposition of superseded records. Only current, accurate CDD information is maintained in the active customer file. Write access to CDD refresh records and disposition documentation is restricted to the BSA department; Compliance has read access.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| CDD refresh due (scheduled cycle or new product/service trigger) (`cdd.profile_refreshed`) | Customer identifier (`member.id`), risk tier (`cdd.risk_tier`), triggering event (scheduled review or new product), prior CDD profile snapshot (`cdd.profile`) | CDD profile refreshed; refresh date and trigger documented in customer file (`cdd.profile_refreshed`) | Annually for high-risk; every 24 months for standard-risk; immediately upon new product/service; enforced by `cdd.refresh_due` |
| Superseded CDD records evaluated for disposition (`record.disposed` or `record.destroyed`) | Superseded record identifier (`record.id`), disposition decision (destroy or anonymize), disposition method, authorizing BSA officer | Superseded records destroyed or anonymized; disposition documented in customer file (`record.destroyed` or `record.disposed`) | At time of CDD refresh; same business day |
| New product or service added to customer relationship triggering out-of-cycle CDD refresh (`cdd.profile_refreshed`) | Customer identifier (`member.id`), new product/service identifier (`product.id`), prior refresh date | Out-of-cycle CDD refresh initiated and completed; documented in customer file (`cdd.profile_refreshed`) | Immediately upon product/service addition |

**ALERTS/METRICS:** Alert fires when `cdd.refresh_due` is overdue by more than 10 business days for any customer. Dashboard metric: count of customers with overdue CDD refresh by risk tier — target zero. Alert fires when a CDD refresh event has no corresponding superseded-record disposition event within 5 business days.

---

## RR-12 — Institutional and Corporate Records — Retention Schedule {#rr-12-institutional-and-corporate-records-retention-schedule}

**WHY (Reg cite):** Permanent corporate records (charter, bylaws, Board minutes, examination reports) have no scheduled destruction date under California Financial Code and NCUA governance requirements ([12 CFR Part 701.31](https://www.ecfr.gov/current/title-12/part-701/section-701.31)). Tax records must be retained for 7 years to cover the IRS 6-year underreporting statute of limitations ([26 U.S.C. §6501](https://www.law.cornell.edu/uscode/text/26/6501)) plus a 1-year buffer; the California FTB 4-year SOL is fully covered. ERISA benefit plan records require 6-year retention ([29 U.S.C. §1027](https://www.law.cornell.edu/uscode/text/29/1027)). Vendor and contract records follow FFIEC Third-Party Risk Management Guidance (life of agreement plus 3 years). Where the source reference contained a range or discrepancy, the longer period governs (e.g., audit reports: 5 years, not 4).

**SYSTEM BEHAVIOR:** Schedule A includes a dedicated institutional-records section with the categories and periods below. Permanent records carry a destruction date of "Permanent" in Schedule A and in the `storage_box.destruction_date` field; they are excluded from all routine destruction runs. The SVP of Operations & Finance confirms the permanent-record inventory annually and reports any gaps to the Board. Where a discrepancy existed between the source reference and Patrick's notes, the longer period is used and documented in Schedule A. The `schedule_a` entity is write-restricted to Compliance and the SVP of Operations & Finance.

**Permanent records** (no scheduled destruction; stored in secure, retrievable format indefinitely):
- Articles of Incorporation, Charter, Bylaws, DFPI license, NCUA insurance certificate, and all amendments
- General Ledger Daily Statements of Condition
- Board of Directors meeting minutes, board committee minutes, and all supporting packages
- Stockholder/member meeting minutes
- Stock or membership share issuance, transfer, and register records
- Dividend checks and register
- Trust Committee and Trust Investment Committee minute books
- Report of Examination by DFPI or NCUA
- FinCEN 105 Forms of Exempt Customers
- Group insurance records
- Computer records of all account activity

**Corporate governance records** (10 years or longer after triggering event):
- Board resolutions — 10 years after resolution
- Administrative and regulatory actions (MOUs, Cease & Desist Orders) — 10 years after termination
- Merger, acquisition, divestiture, and change-of-control applications and approvals — 10 years after event
- Surety bonds for lost stockholder/member certificates — 10 years after bond
- Robbery and fraud records — 10 years
- Equal Employment Opportunity employer information — 10 years
- Bankruptcy files — 10 years

**Tax records** (7 years — covers IRS 6-year underreporting SOL plus 1-year buffer; FTB 4-year SOL fully covered):
- Federal and state tax returns and all supporting documentation
- W-2, W-4, 1099, and related tax forms
- Payroll tax filings and supporting records
- HR tax records (A-4, state withholding equivalents)
- Expense vouchers and expense checks (7 years after paid)
- General Ledger debit and credit tickets (7 years)
- Vendor invoices and bills paid (7 years)
- Investment accrual and bond amortization records (7 years)

**Audit and examination records** (5 years — longer period governs over the 4-year entries in the source reference):
- Internal and external audit reports, management responses, and work papers — 5 years
- Risk assessment reports — 5 years
- Director and employee training records — 5 years
- Internal investigations — 5 years after close of investigation

**Financial and operational records** (5–7 years as appropriate):
- Call Reports, Y-6, Y-9, and supporting documents — 5 years
- FDIC/NCUA assessment forms — 5 years
- Fixed assets records — 5 years
- Income and dividend reports — 6 years
- Official checks outstanding reconcilements — 5 years
- Wire transfer agreements, logs, and requests — 5 years
- BSA/AML compliance program documentation — 5 years ([31 CFR §1010.430](https://www.ecfr.gov/current/title-31/part-1010/section-1010.430))
- Allowance for Loan and Lease Loss computations — 5 years
- Annual budget — 5 years
- Interest rate risk reports and documentation — 5 years

**Vendor and contract records** (life of agreement plus 3 years after termination — FFIEC Third-Party Risk Management Guidance):
- Vendor files, contracts, and due diligence records — 3 years after end of agreement (longer if subject to legal hold or regulatory inquiry)
- Federal funds line and other borrowing agreements — 3 years after close

**HR and employment records**:
- ERISA benefit plan documents and reports — 6 years after plan closure ([29 U.S.C. §1027](https://www.law.cornell.edu/uscode/text/29/1027))
- Personnel files, background checks, salary changes, training records — 3 years after termination
- Job applications for persons hired — 3 years after termination
- Job applications for persons not hired — 3 years
- Payroll records, deductions, and overtime records — 3 years (FLSA minimum; [29 U.S.C. §211](https://www.law.cornell.edu/uscode/text/29/211))
- Salary records — 5 years
- OSHA Forms 100/101/102 — 5 years

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual permanent-record inventory confirmed by SVP of Operations & Finance (`records.board_report_filed`) | Permanent-record inventory list (all Schedule A "Permanent" entries), confirmation that each category is present and retrievable, any gaps identified | Inventory confirmation documented; gaps reported to Board in annual report (`records.board_report_filed`) | Annually; enforced by `records.board_report_due_at` |
| Institutional record created or received (e.g., new Board minutes, new examination report) (`record.retention_clock_set`) | Record identifier (`record.id`), record class (`record.retention_class`), anchor date (`record.retention_anchor`), applicable Schedule A period (`schedule_a.retention_period`) | Retention clock set; for permanent records, `record.retention_expires_at` = "Permanent"; `record.disposal_eligible` = false (`record.retention_clock_set`) | Same business day as creation or receipt |
| Permanent record found missing from inventory (`record.audit.opened`) | Missing record class, last known location, responsible department | Gap investigation opened; SVP and CCO notified; Board informed at next report (`record.audit.opened`) | Within 1 business day of detection |

**ALERTS/METRICS:** Alert fires when any permanent record class is absent from the annual inventory confirmation. Alert fires when any record with `schedule_a.retention_period` = "Permanent" has `record.disposal_eligible` = true — this is a configuration error requiring immediate correction. Dashboard metric: count of institutional records with missing or misconfigured retention clocks — target zero.

---

## Governance & Sign-Off {#governance}

| Role | Name | Responsibility |
|---|---|---|
| Policy Owner | Patrick Wilson, Chief Compliance Officer | Drafts, maintains, and approves this policy; escalation point for all retention disputes |
| Operational Owner | SVP of Operations & Finance | Monitors retention and destruction activity; reports to Board; confirms permanent-record inventory annually |
| Department Records-Retention Contacts | One per department (designated by department head) | Accountable for proper completion of retention within their department; maintains Destruction Log (Exhibit 1) |
| IT | IT Department | Responsible for email archives and core-processor retention configuration; conducts retrievability testing |
| Internal Audit | Internal Audit | Reviews retention program annually; findings reported per [RR-12](#rr-12-institutional-and-corporate-records-retention-schedule) audit-records period |

**Review cadence:** This policy and Schedule A are reviewed at least annually by the SVP of Operations & Finance and CCO, with Board approval for material changes. The `records.annual_review_due_at` timer enforces the cadence.

**Cross-references (out-of-scope items handled elsewhere):**
- Substantive BSA/AML program — BSA Policy
- Loan file and collections records management beyond retention periods — Lending Policy and Collections Policy
- Deposit and cash operations records beyond retention periods — Cash Policy
- Security safeguards and email-system controls — Information Security Policy
- Consumer personal-information deletion rights — Privacy Policy
- Employee/HR personnel records (no dedicated HR policy currently in repository — see [Assumptions & Gaps](#assumptions-gaps))

---

## Assumptions & Gaps {#assumptions-gaps}

- **Engineering vocabulary is provisional.** The record-retention-side resources, fields, and events referenced throughout this document (e.g., `records.contact_name`, `records.exception_count`, `records.contact_vacated`, `record_class.unmatched`, `record_class.description`, `records.retention.expires_at`, `disposal.due_at`, `retention.timer`) are drawn from the registered core-API vocabulary where registered codes exist, and from the provisional-codes list where listed. Codes not yet registered in `core-vocabulary.json` — including any composed under the Composition grammar — are the target naming scheme and will be confirmed by engineering before the next review cycle.

- **Alabama Banking Code schedules excluded.** The reference policy was originally drafted for an Alabama-chartered bank and referenced the Alabama Banking Code (5-2A-9, 5-4A-1). Those schedules have been removed entirely. Pynthia is a California-chartered credit union subject to the California Financial Code and DFPI supervision. If any Alabama-derived period was longer than the applicable federal or California minimum, the federal/California minimum governs; no Alabama-specific period has been carried forward.

- **Unified 3-year consumer transaction schedule.** Consumer transaction records subject to 2-year minimums (Reg CC, Reg E) and the 25-month Reg B minimum are retained on a unified 3-year schedule. This assumption is documented in Schedule A. If Pynthia's legal counsel or DFPI examiner requires strict adherence to the shorter minimums for any record class, Schedule A must be amended.

- **DFPI charter confirmed; NCUA insurance confirmed.** This policy assumes Pynthia is a DFPI-chartered, federally insured credit union subject to both California Financial Code and NCUA Part 701.31. If charter or insurance status changes, retention periods and regulatory citations must be re-evaluated.

- **HMDA reporter status.** The policy references HMDA/Reg C retention obligations. Pynthia's HMDA reporter status (whether it meets the coverage thresholds under [12 CFR Part 1003](https://www.ecfr.gov/current/title-12/part-1003)) should be confirmed annually; if Pynthia is not a covered institution in a given year, HMDA-specific retention periods in Schedule A are not required but may be retained as a conservative default.

- **No dedicated HR policy.** Patrick's notes identify HR and employment records as within scope of this policy's retention schedule but note there is no dedicated HR policy in the repository. Personnel files, payroll records, ERISA plan documents, and OSHA records are governed by the periods in [RR-12](#rr-12-institutional-and-corporate-records-retention-schedule). If a dedicated HR policy is adopted, those periods should be cross-referenced and this policy updated to defer to it.

- **Audit-records period discrepancy resolved.** The source reference contained a discrepancy: "4 years" for audit reports in the Risk Management section and "5 years" in the Accounting section. Per Patrick's instruction, the longer period (5 years) governs for all audit reports, management responses, work papers, risk assessment reports, director and employee training records, and internal investigations. This resolution is documented in Schedule A.

- **Salary records period.** The source reference listed salary records at 4 years; Patrick's notes specify 5 years. The 5-year period is used throughout this policy. If the 4-year period was based on a specific California or federal authority, that authority should be identified and Schedule A annotated accordingly.

- **Payroll records period.** The source reference listed payroll records at 2 years; Patrick's notes specify 3 years (FLSA minimum). The 3-year FLSA minimum governs. The 2-year figure in the source reference appears to have been below the FLSA floor and is not carried forward.

- **CPRA/CCPA cross-reference.** This policy references CPRA data-minimization and de-identification standards in [RR-10](#rr-10-bsaaml-anonymization-and-extended-analytical-retention) and [RR-11](#rr-11-cdd-refresh-cycle-and-stale-record-disposition). The substantive consumer deletion-rights program (including responding to individual deletion requests) is out of scope and governed by the Privacy Policy. If the Privacy Policy's deletion-rights procedures conflict with any retention period in Schedule A (e.g., a consumer requests deletion of a record Pynthia is legally required to retain), the legal-retention obligation prevails and must be communicated to the consumer per CPRA §1798.105(d).

- **Vendor destruction certificate.** [RR-05](#rr-05-document-destruction) requires a vendor destruction certificate. If the licensed vendor does not provide a certificate for a particular destruction run, the two-associate initials in the Destruction Log serve as the primary documentation, and the absence of a certificate must be noted in the log with an explanation. Engineering should confirm whether `vendor.destruction_certificate` is the correct field or whether a separate `disposal.certificate_recorded` artifact is preferred.

- **Trust records.** The source reference included a Trust section. Patrick's notes do not address trust products specifically. Trust Committee and Trust Investment Committee minute books are included as permanent records in [RR-12](#rr-12-institutional-and-corporate-records-retention-schedule). If Pynthia operates trust services, a more detailed trust-records section should be added to Schedule A; this is flagged as a gap pending confirmation of whether Pynthia has active trust operations.

- **Investment and securities records.** The source reference included an Investments section with periods ranging from 2 to 6 years. Patrick's notes do not address investment records specifically beyond the institutional-records categories in section (l). Investment accrual and bond amortization records (7 years) are included in [RR-12](#rr-12-institutional-and-corporate-records-retention-schedule). A full investment-records section in Schedule A should be confirmed with the CFO and investment manager; this is flagged as a gap.

- **Teller/branch operational records.** The source reference included a detailed Teller/Branch section with short retention periods (30 days to 5 years). Patrick's notes do not address these specifically. These records are within scope of this policy but are not individually enumerated above; they should be included in Schedule A under the appropriate department section. Engineering should confirm whether the `storage_box` and `destruction_log` entities are sufficient to manage high-volume, short-retention teller records or whether a separate operational-records workflow is needed.
