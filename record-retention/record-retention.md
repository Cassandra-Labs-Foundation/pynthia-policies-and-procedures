---
title: Record Retention Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-18
next_review: 2027-06-18
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Record Retention, Records Management, Destruction, Legal Hold]
---

## General Policy Statement

Pynthia Credit Union maintains a comprehensive record-retention and destruction program that sets minimum retention periods by record class, provides for systematic and defensible destruction of obsolete records, and ensures records can be promptly produced for examiners, auditors, and legal proceedings. The program addresses retention for compliance, legal (statute-of-limitations), administrative, and managerial purposes; applies to all directors, officers, and employees; and covers records in any reproducible form — paper, imaged, microform, or electronic media — including records held by the core processor and email archives. Retention risk is managed at both extremes: destroying records too early (losing the ability to demonstrate compliance or defend a claim) and keeping records too long (raising security, cost, and deletion-rights exposure). A product-appropriate retention schedule (Schedule A) keyed to Pynthia's actual deposit, lending, and payment activities is maintained and reviewed at least annually.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Record created → retention clock anchored | Record created (`record.created`) | Same business day | Schedule A class + anchor date assigned | [RR-02](#rr-02-retention-schedule-schedule-a) |
| Retention period reached | Retention timer expires (`record.retention_expired`) | Per Schedule A class | Disposal eligibility set | [RR-05](#rr-05-defensible-certified-destruction) |
| Destruction executed | Disposal scheduled and run (`disposal.executed`) | At/after documented destruction date | Destruction Log entry + vendor certificate | [RR-05](#rr-05-defensible-certified-destruction) |
| Litigation / investigation / subpoena received | Legal hold placed (`legal_hold.created`) | Before next destruction cycle | Hold registry entry; clock suspended | [RR-07](#rr-07-legal-holds) |
| Legal hold released | Hold released (`legal_hold.clear_confirmed`) | Resume on confirmation | Schedule resumed | [RR-07](#rr-07-legal-holds) |
| Annual policy & Schedule A review | Annual review window opens (`records.policy_review_completed`) | Every 12 months | Updated policy + Schedule A version | [RR-04](#rr-04-annual-policy-and-schedule-review) |
| Electronic-record integrity test | Integrity test due (`record.integrity_test_completed`) | Per test cycle | Reproduction/integrity result | [RR-03](#rr-03-retention-methods-and-electronic-record-integrity) |
| Annual records training | Training cycle opens (`training.retention_completed`) | Every 12 months | Completion records | [RR-09](#rr-09-records-retention-training) |
| BSA/AML 5-year retention expires → anonymization or destroy | Retention timer reaches 5-year mark (`records.bsa_retention_expired`) | At 5-year mark or per schedule | Anonymization certificate or destruction record | [RR-10](#rr-10-bsaml-anonymization-and-extended-analytical-retention) |
| CDD record refresh due | Scheduled review or new product/service added (`cdd.refresh_triggered`) | Annually (high-risk); every 2 years (standard-risk); on new product/service | CDD refresh record; superseded record disposition | [RR-11](#rr-11-cdd-refresh-cycle-and-stale-record-disposition) |

## RR-01 — Responsibility and Administration  {#rr-01-responsibility-and-administration}

**WHY (Reg cite):** A single accountable owner and a designated departmental contact structure are required to operate a defensible program under the [Interagency Guidelines Establishing Information Security Standards (12 CFR Part 364, App. B)](https://www.ecfr.gov/current/title-12/part-364), which require administrative controls over the handling, retention, and disposal of member-information records, and to satisfy [California Financial Code](https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?tocCode=FIN) recordkeeping obligations.

**SYSTEM BEHAVIOR:** A senior owner (SVP, Operations & Finance) is designated as program owner accountable for monitoring retention and destruction and reporting to the Board; each department names a records-retention contact accountable for proper completion of retention in its area. The system records each designation and reports the program status to the Board on the governance cycle. A vacancy in the program-owner or any departmental-contact role starts a timer so the gap is filled before the next destruction or review cycle. The designation roster and program-owner assignment are write-restricted to Compliance and the program owner.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Program owner / departmental contact designated (`governance.designation_recorded`) | Owner identity (`records.contact_name`), department (`department.id`), authority statement (`governance.authority_statement`) | Designation recorded + roster entry (`records.contact_assigned`) | Same business day (internal: 1 BD) |
| Departmental contact vacated (`records.contact_assigned`) | Vacated role (`records.contact_vacated`), department (`department.id`) | Re-designation task opened (`governance.designation_recorded`) | Before next destruction/review cycle |
| Board reporting cycle reached (`governance.board_cycle_opened`) | Retention metrics snapshot (`records.exception_count`), board package (`board.agenda_id`) | Board report filed (`records.board_report_filed`) | Annual (enforced by `records.board_report_due_at`) |

**ALERTS/METRICS:** Alert on any unfilled program-owner or departmental-contact role past its timer; target zero vacant contacts; track board-report on-time delivery against `records.board_report_due_at`.

## RR-02 — Retention Schedule (Schedule A)  {#rr-02-retention-schedule-schedule-a}

**WHY (Reg cite):** Federal minimums anchor Schedule A: [BSA recordkeeping, 31 CFR §1010.430](https://www.ecfr.gov/current/title-31/section-1010.430) (5 years); [Reg B / ECOA, 12 CFR §1002.12](https://www.ecfr.gov/current/title-12/part-1002#p-1002.12) (25 months); [Reg Z / TILA, 12 CFR §1026.25](https://www.ecfr.gov/current/title-12/part-1026#p-1026.25) (2 years, 3 years for certain records); [Reg CC, 12 CFR §229.21](https://www.ecfr.gov/current/title-12/part-229) and [Reg E, 12 CFR §1005.13](https://www.ecfr.gov/current/title-12/part-1005#p-1005.13) (2 years); plus [California Financial Code](https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?tocCode=FIN) overlays.

**SYSTEM BEHAVIOR:** The system maintains Schedule A as a versioned mapping of record class to minimum retention period, keyed to Pynthia's actual deposit, lending, and payment products. On creation, every record is assigned a Schedule A class and a retention anchor date, from which the retention timer is computed; records substantially similar to a scheduled item inherit the appropriate period. Alabama Banking Code schedules are not carried over — only the federal minimums and California overlays apply. Any record that cannot be matched to a class is flagged for Compliance disposition rather than silently defaulted. Schedule A versions and class-to-period mappings are write-restricted to Compliance and the program owner.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Record created (`record.created`) | Record class (`record.retention_class`), anchor date (`record.retention_anchor`), Schedule A version (`schedule_a.version`) | Retention clock set (`record.retention_clock_set`) | Same business day |
| Schedule A entry added or amended (`schedule_a.entry_added`) | Class code (`schedule_a.analog_entry_id`), retention period (`schedule_a.retention_period`), inheritance flag (`schedule_a.entry_inherited`) | Schedule A version published (`records.policy_review_completed`) | Per annual review (enforced by `records.annual_review_due_at`) |
| Record class unmatched (`record.created`) | Unmatched class signal (`record_class.unmatched`), record id (`record.id`) | Disposition task for Compliance (`document.disposition_recorded`) | Same business day |

**ALERTS/METRICS:** Target zero unmatched record classes aging beyond one business day; alert on records with no retention anchor; track Schedule A version currency against the annual review.

## RR-03 — Retention Methods and Electronic-Record Integrity  {#rr-03-retention-methods-and-electronic-record-integrity}

**WHY (Reg cite):** Records may be kept in any reproducible form provided electronic records remain accurate, accessible, and of sufficient integrity for examiners to determine financial condition and the substance of transactions, consistent with the safeguards required by the [Interagency Guidelines Establishing Information Security Standards (12 CFR Part 364, App. B)](https://www.ecfr.gov/current/title-12/part-364) and the recordkeeping expectations in [California Financial Code](https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?tocCode=FIN).

**SYSTEM BEHAVIOR:** The system permits retention in hard copy, imaging, microform, or electronic media, recording the storage medium for each record. Periodic integrity testing reproduces a sample of electronic records to confirm they are accurate, accessible, and faithfully reproducible into usable copies; failed reproductions are logged and routed for remediation. When records are converted from one medium to another, the conversion is verified and certified so the reproduced record carries the same retention status as the original. Integrity-test configuration and conversion certification are write-restricted to IT and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Integrity test cycle due (`record.integrity_test_completed`) | Storage medium (`record.storage_medium`), sample scope (`record.metadata`) | Integrity/reproduction result recorded (`record.integrity_test_completed`) | Per test cycle (enforced by `record.integrity_test_due`) |
| Record media converted (`record.conversion_verified`) | Source/target media (`record.media_type`), conversion result (`record.reproduction_result`) | Conversion certified (`record.conversion_certified`) | At conversion |

**ALERTS/METRICS:** Alert on any failed reproduction or overdue integrity test; target 100% reproducibility on sampled electronic records; track conversion-certification completion rate.

## RR-04 — Annual Policy and Schedule Review  {#rr-04-annual-policy-and-schedule-review}

**WHY (Reg cite):** Annual review keeps retention periods aligned with changing federal and state requirements, products, complexity, technology, and storage costs, supporting the administrative-safeguard expectations of the [Interagency Guidelines (12 CFR Part 364, App. B)](https://www.ecfr.gov/current/title-12/part-364) and ongoing compliance with the underlying retention rules ([Reg B §1002.12](https://www.ecfr.gov/current/title-12/part-1002#p-1002.12), [Reg Z §1026.25](https://www.ecfr.gov/current/title-12/part-1026#p-1026.25), [Reg CC Part 229](https://www.ecfr.gov/current/title-12/part-229), [Reg E §1005.13](https://www.ecfr.gov/current/title-12/part-1005#p-1005.13), [BSA 31 CFR §1010.430](https://www.ecfr.gov/current/title-31/section-1010.430)).

**SYSTEM BEHAVIOR:** At least annually, the program owner reviews this policy and Schedule A and revises them for changes in state/federal reporting requirements, products and services, complexity, consumer-compliance requirements, technology, and storage costs; departmental contacts review their own Schedule A areas and forward proposed updates. When a monitored regulation changes a retention requirement, an interim review is triggered rather than waiting for the annual cycle. The published policy version and Schedule A version are write-restricted to Compliance and the program owner.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual review window opens (`governance.board_cycle_opened`) | Current policy version (`policy.document_version`), Schedule A version (`schedule_a.version`), review factors (`records.retention.class`) | Policy review completed + Schedule A updated (`records.policy_review_completed`) | Annual (enforced by `records.annual_review_due_at`) |
| Regulatory retention change detected (`regulation.retention_change_detected`) | Source citation (`regulation.citation`), change analysis (`regulatory.change_identified`) | Interim review logged (`regulation.inventory_reviewed`) | On detection (enforced by `regulation.inventory_review_due_at`) |

**ALERTS/METRICS:** Alert when `records.annual_review_due_at` is within warning window or lapsed; track count of interim reviews triggered by regulatory changes; target zero overdue annual reviews.

## RR-05 — Defensible, Certified Destruction  {#rr-05-defensible-certified-destruction}

**WHY (Reg cite):** Records may be destroyed only after the documented destruction date, using a licensed vendor with proper safeguards, in accordance with the [Interagency Guidelines Establishing Information Security Standards (12 CFR Part 364, App. B)](https://www.ecfr.gov/current/title-12/part-364), which require secure disposal of member-information records.

**SYSTEM BEHAVIOR:** When a record's retention timer expires and no legal hold applies, the record becomes disposal-eligible and is scheduled for destruction at or after its documented destruction date. Destruction is performed by a licensed destruction vendor; two associates verify and initial the destruction log, and the vendor's destruction certificate is retained and attached. A record under legal hold is excluded from disposal eligibility until the hold is released (see [RR-07](#rr-07-legal-holds)). Disposal execution and certificate recording are write-restricted to Operations and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Retention period reached (`record.retention_expired`) | Retention expiry (`record.retention_expires_at`), hold status (`record.hold_status`) | Disposal eligibility set (`disposal.scheduled`) | At expiry (enforced by `record.destruction_due_at`) |
| Destruction executed by vendor (`disposal.executed`) | Disposal method (`disposal.method`), batch manifest (`disposal.batch_manifest_id`), two-person verification (`record.actor_id`) | Record destroyed + certificate recorded (`record.destruction_certified`) | At/after documented destruction date (enforced by `record.destruction_cycle_due_at`) |
| Vendor certificate received (`disposal.certificate_recorded`) | Vendor certificate (`vendor.destruction_certificate`), batch manifest (`disposal.batch_manifest_id`) | Certificate filed to record (`record.destroyed`) | Same business day as destruction |

**ALERTS/METRICS:** Alert on any destruction missing two-person verification or a vendor certificate; target zero records destroyed before their documented destruction date; track disposal-eligible backlog aging against `record.destruction_due_at`.

## RR-06 — Destruction Logging and Storage Convention  {#rr-06-destruction-logging-and-storage-convention}

**WHY (Reg cite):** A per-department Destruction Log and consistent box labeling provide the auditable disposal trail examiners expect under the [Interagency Guidelines (12 CFR Part 364, App. B)](https://www.ecfr.gov/current/title-12/part-364) and demonstrate that retention periods under the underlying rules were observed before disposal.

**SYSTEM BEHAVIOR:** Each department maintains a Destruction Log (Exhibit 1) for examiner review; every storage box is labeled with Box Number, Content Description, From/To Dates, and Destruction Date that match the corresponding log entry. The system creates a log entry when a box is registered and reconciles box labels to log entries; any mismatch between a box label and its log entry is flagged and must be resolved before destruction proceeds. Destruction Log entries and storage-box records are write-restricted to the departmental records-retention contact and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Storage box registered (`storage_box.created`) | Box number (`storage_box.number`), content description (`storage_box.description`), from/to dates (`storage_box.from_date`), destruction date (`storage_box.destruction_date`) | Destruction Log entry created (`destruction_log.entry_created`) | Same business day |
| Box label vs. log mismatch found (`destruction_log.mismatch_detected`) | Box record (`storage_box.number`), log entry (`destruction_log.entry_id`) | Mismatch resolution recorded (`destruction_log.mismatch_resolved`) | Before destruction proceeds |

**ALERTS/METRICS:** Alert on any unresolved box/log mismatch and on boxes lacking a complete label set; target zero mismatches at destruction time; track log-to-disposal reconciliation completeness.

## RR-07 — Legal Holds  {#rr-07-legal-holds}

**WHY (Reg cite):** Scheduled destruction must be suspended for records subject to litigation, investigation, or subpoena until the hold is released, preserving records and avoiding spoliation; this preservation duty overrides the routine disposal contemplated by the underlying retention rules and the [Interagency Guidelines (12 CFR Part 364, App. B)](https://www.ecfr.gov/current/title-12/part-364).

**SYSTEM BEHAVIOR:** When a litigation, investigation, or subpoena matter arises, a legal hold is placed that suspends the retention clock and blocks disposal for every record in the hold scope; held records cannot become disposal-eligible regardless of their retention timer. The hold remains until formally released by authorized counsel, at which point the retention clock resumes from where it was suspended and normal disposal eligibility is restored. Legal-hold placement and release are write-restricted to Legal and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Litigation/investigation/subpoena received (`legal.process_received`) | Matter id (`legal_hold.matter_id`), hold scope (`legal_hold.hold_scope`) | Legal hold created + disposal blocked (`legal_hold.created`) | Before next destruction cycle |
| Hold applied to records (`record.hold_placed`) | In-scope record set (`record.hold_scope`), authorizer (`record.hold_authorizer`) | Hold applied; clock suspended (`record.hold_applied`) | Same business day as hold creation |
| Hold released by counsel (`legal.hold_released`) | Release approver (`legal_hold.release_approved_by`), matter id (`legal_hold.matter_id`) | Hold lifted; schedule resumed (`legal_hold.clear_confirmed`) | On authorized release |

**ALERTS/METRICS:** Target zero disposals of held records; alert on any disposal attempt blocked by a hold; track open holds aging and days-to-release after matter closure.

## RR-08 — Core Processor and Email Archives  {#rr-08-core-processor-and-email-archives}

**WHY (Reg cite):** Records held on the core processor's electronic archive and in email archives must meet the same accuracy, accessibility, and integrity standards and remain retrievable, consistent with the [Interagency Guidelines (12 CFR Part 364, App. B)](https://www.ecfr.gov/current/title-12/part-364) and the federal retention minimums those records satisfy ([BSA 31 CFR §1010.430](https://www.ecfr.gov/current/title-31/section-1010.430), [Reg B §1002.12](https://www.ecfr.gov/current/title-12/part-1002#p-1002.12)).

**SYSTEM BEHAVIOR:** Each department confirms that proper retention timeframes are configured for the records it maintains on the core processor's electronic archive, and the system records that confirmation against the archive's retention configuration. IT owns email archives and performs periodic retrievability testing to confirm archived emails can be retrieved within retention; failed retrievals are logged for remediation. Core-archive retention configuration is write-restricted to the responsible department and Compliance; email-archive testing is write-restricted to IT.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Core-archive retention confirmation due (`core_archive.retention_confirmed`) | Archive retention config (`core_archive.retention_config`), department (`department.id`) | Retention confirmation recorded (`core_archive.retention_confirmed`) | Per confirmation cycle (enforced by `core_archive.confirmation_due`) |
| Email archive retrievability test due (`email_archive.test_completed`) | Test scope (`email_archive.test_due`), sample set (`record.metadata`) | Retrievability test result recorded (`email_archive.test_completed`) | Per test cycle (enforced by `email_archive.test_due`) |

**ALERTS/METRICS:** Alert on any failed email retrieval or overdue core-archive confirmation; target zero unretrievable archived records on sample; track confirmation/test on-time completion.

## RR-09 — Records Retention Training  {#rr-09-records-retention-training}

**WHY (Reg cite):** Annual, role-appropriate training equips staff to apply retention and destruction correctly, an administrative safeguard expected under the [Interagency Guidelines (12 CFR Part 364, App. B)](https://www.ecfr.gov/current/title-12/part-364).

**SYSTEM BEHAVIOR:** The system assigns annual record-retention training to all employees and tracks completion; each department's records-retention contact develops department-specific content covering this policy and that department's retention requirements. New hires in covered roles are assigned training on onboarding. Lapsed or incomplete training triggers remedial assignment. Training content and completion records are write-restricted to Compliance and the training administrator.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual training cycle opens (`training.retention_cycle_opened`) | Curriculum (`training.required_curriculum`), assignee (`training.assignee_id`) | Training assigned (`training.annual_assigned`) | Annual (enforced by `training.retention_due_at`) |
| Employee completes training (`training.retention_completed`) | Module id (`training.module_id`), completion status (`training.completion_status`) | Completion recorded (`training.completion_recorded`) | By cycle close (enforced by `training.completion_due_at`) |
| Training lapsed or incomplete (`training.retention_completed`) | Lapse flag (`training.lapsed`), assignee (`training.assignee_id`) | Remedial training assigned (`training.remedial_assigned`) | On lapse |

**ALERTS/METRICS:** Alert on overdue or lapsed assignments; target 100% completion by cycle close; track department-specific content currency against the annual policy review.

## RR-10 — BSA/AML Anonymization and Extended Analytical Retention  {#rr-10-bsaml-anonymization-and-extended-analytical-retention}

**WHY (Reg cite):** The [Bank Secrecy Act recordkeeping rule (31 CFR §1010.430)](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1010/subpart-D/section-1010.430) requires 5-year retention of BSA/AML records. Beyond that period, the California Consumer Privacy Rights Act (CPRA) creates a data-minimization obligation that requires destruction or de-identification of individually identifiable personal information when the original retention purpose has expired. Retention of anonymized/aggregated BSA data for analytics must satisfy CPRA's de-identification standard.

**SYSTEM BEHAVIOR:** When a BSA/AML record's 5-year retention period expires, the system flags it for a mandatory disposition decision: either destroy or anonymize to CPRA de-identification standards (reasonable measures taken to prevent re-identification; a documented public commitment not to re-identify). Anonymized and aggregated BSA/AML data — from which no individual can be identified — may be retained beyond 5 years for compliance analytics, trend analysis, and program improvement; the system records the anonymization event, the date it occurred, the method applied, and confirmation that re-identification safeguards are in place. An audit trail is generated so examiners can confirm the disposition of individually identifiable records even when older data cannot be traced to specific members. Individually identifiable records that are not anonymized must be destroyed under RR-05. The anonymization configuration and the disposition decision are write-restricted to BSA Compliance and Legal.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| BSA/AML 5-year retention period expires (`records.bsa_retention_expired`) | Record class (`record.retention_class`), expiry date (`record.retention_expires_at`), hold status (`record.hold_status`) | Disposition task created — destroy or anonymize (`disposal.scheduled`) | At 5-year expiry (enforced by `record.destruction_due_at`) |
| Anonymization executed (`records.bsa_anonymized`) | Anonymization method (`records.anonymization_method`), de-identification confirmation (`records.reidentification_safeguards_confirmed`), data set scope (`records.bsa_dataset_scope`) | Anonymization record created; audit trail entry logged; retention clock extended for analytical data (`records.bsa_anonymized`) | At anonymization (before individually identifiable data is destroyed) |
| Extended analytical retention — review cycle (`records.bsa_anonymous_retention_reviewed`) | Anonymized data inventory (`records.bsa_dataset_scope`), ongoing analytical purpose (`records.analytical_purpose`) | Retention justification renewed or data destroyed (`records.bsa_anonymous_retention_reviewed`) | Annual review (enforced by `records.bsa_anonymous_retention_review_due_at`) |

**ALERTS/METRICS:** Alert on any BSA/AML record reaching the 5-year mark without a disposition decision; target zero individually identifiable records retained beyond 5 years without a documented anonymization or destruction action; track the count of anonymized datasets with valid de-identification certifications.

---

## RR-11 — CDD Refresh Cycle and Stale-Record Disposition  {#rr-11-cdd-refresh-cycle-and-stale-record-disposition}

**WHY (Reg cite):** The [Bank Secrecy Act's Customer Due Diligence rule (31 CFR §1010.230)](https://www.ecfr.gov/current/title-31/subtitle-B/chapter-X/part-1010/subpart-B/section-1010.230) requires ongoing CDD that keeps customer risk profiles current. The CPRA data-minimization principle requires systematic elimination of stale personal information that is no longer needed for the purpose for which it was collected. Combining a rolling refresh cycle with prompt disposal of superseded records satisfies both requirements.

**SYSTEM BEHAVIOR:** CDD records are refreshed on a rolling basis: at minimum annually for higher-risk customers, every two years for standard-risk customers, and upon any new product or service added to a customer relationship. When a refresh is completed, superseded CDD records — information that has been updated or replaced — are evaluated and disposed of by destruction or anonymization consistent with RR-10 rather than carried forward; only current, accurate customer information is maintained. The BSA department documents the refresh date, the triggering event (scheduled review or new product/service), and the disposition of superseded records in the member file. Refresh and disposition records are write-restricted to the BSA department and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| CDD refresh due — scheduled cycle (`cdd.refresh_triggered`) | Customer risk tier (`cdd_profile.risk_tier`), refresh trigger type (`cdd.refresh_trigger`), last refresh date (`cdd.refresh_date`) | CDD refresh task opened (`cdd.refresh_triggered`) | Annual (high-risk; enforced by `cdd.refresh_due_at`); every 2 years (standard-risk) |
| CDD refresh due — new product or service added (`cdd.refresh_triggered`) | New product/service id (`product.id`), customer relationship id (`entity.id`) | CDD refresh task opened immediately (`cdd.refresh_triggered`) | On product/service addition |
| CDD refresh completed (`cdd.refreshed`) | Updated CDD record (`cdd_profile.risk_tier`), refresh date (`cdd.refresh_date`), trigger (`cdd.refresh_trigger`), superseded-record scope | Refresh recorded; superseded-record disposition task created (`cdd.refreshed`) | At completion |
| Superseded CDD records disposed (`records.bsa_anonymized` or `record.destroyed`) | Superseded record set, disposition method (destroy or anonymize per RR-10 / RR-05), authorizer (`record.hold_authorizer`) | Disposition logged; member file updated (`records.bsa_anonymized` or `record.destroyed`) | Same cycle as refresh completion |

**ALERTS/METRICS:** Alert on any CDD record overdue for refresh; target zero high-risk customer profiles past their annual refresh date; track the volume of superseded CDD records disposed per cycle and confirm no superseded records carried forward.

---

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer, accountable for the program, this policy, and Schedule A.
- **Program administration:** SVP, Operations & Finance, monitors retention and destruction activity and reports to the Board; each department's records-retention contact is accountable for proper completion of retention in its area (see [RR-01](#rr-01-responsibility-and-administration)).
- **Required participants:** SVP Operations & Finance, departmental records-retention contacts, IT (email and core-archive retrievability), and Internal Audit.
- **Approval:** Approved by the Chief Compliance Officer; material changes require re-approval.
- **Review cadence:** This policy and Schedule A are reviewed at least annually (see [RR-04](#rr-04-annual-policy-and-schedule-review)); the program owner reports status to the Board on the governance cycle.
- **Cross-references:** BSA Policy (substantive BSA/AML program); Lending Policy and Collections Policy (loan file and collections records management beyond retention periods); Cash Policy (deposit and cash operations records beyond retention periods); Information Security Policy (security safeguards and email-system controls); Privacy Policy (consumer personal-information deletion rights).

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** Several record-, schedule-, destruction-, legal-hold-, core-archive-, email-archive-, and training-side field/event/timer codes referenced in the control overlays (e.g., `record.retention_class`, `record.retention_clock_set`, `schedule_a.version`, `record.destruction_due_at`, `core_archive.confirmation_due`, `email_archive.test_due`, `records.annual_review_due_at`, `training.retention_due_at`) draw on the registered `record`, `schedule_a`, `destruction_log`, `storage_box`, `legal_hold`, `core_archive`, `email_archive`, `records`, and `training` subjects in DESIGN_NOTES. Where a more specific timer or field is implied but not yet registered, it is composed from registered subjects/verbs/task types per the Composition grammar; engineering will confirm exact spellings before the next review.
- **Provisional codes in use.** Where the policy needs a concept listed under DESIGN_NOTES "Provisional codes," the agreed spelling is used verbatim (e.g., `record.id`, `records.retention.expires_at`, `record_class.description`, `disposal.due_at`); these remain provisional until registered.
- **California overlay specifics pending.** The exact California Financial Code retention overlays that extend or exceed federal minimums need confirmation by Legal/Compliance and must be encoded as specific Schedule A class periods; the policy assumes federal minimums govern unless a California overlay is longer.
- **Alabama schedules excluded.** Per PATRICK_NOTES, legacy Alabama Banking Code schedules from the reference policy are intentionally not carried over; the reference document's Schedule A line items are treated as a starting inventory to be re-keyed to Pynthia's actual deposit, lending, and payment products under [RR-02](#rr-02-retention-schedule-schedule-a).
- **Charter / examiner applicability.** This policy assumes Pynthia is a DFPI-chartered, NCUA-insured credit union; the specific examining authority's disposal and recordkeeping expectations should be confirmed and reconciled against the 12 CFR Part 364 App. B framing inherited from the reference policy.
- **Integrity-test and core-archive cadences unspecified.** PATRICK_NOTES require periodic email retrievability testing and departmental confirmation of core-processor retention but do not fix intervals; the minimal viable control schedules each on a recurring cycle whose period needs IT/Compliance confirmation.
- **HR/personnel records scope.** Employee/HR personnel records have no dedicated HR policy in this repository; whether they fall under this program or a future HR policy needs confirmation. They are not separately controlled here beyond general record-class handling.
