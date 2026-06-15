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

## General Policy Statement

Pynthia Credit Union maintains a comprehensive record-retention and destruction program that sets minimum retention periods by record class, provides for systematic and certified destruction of obsolete records, and ensures records in any form — paper, imaged, microform, or electronic media, including core-processor archives and email — can be produced promptly for examiners, auditors, and legal investigations. The program is owned by the Chief Compliance Officer, administered by a designated SVP of Operations & Finance, and applies to all Pynthia directors, officers, and employees. Retention periods are keyed to Pynthia's actual deposit, lending, and payment products (Schedule A) and apply federal minimums and California Financial Code overlays; the program defaults to retaining records only as long as legally and operationally required, balancing the risk of premature destruction against the security, cost, and deletion-rights exposure of over-retention.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---|---|
| New record enters a class and starts its clock | Record created/classified (`record.created`) | Per Schedule A class | Retention anchor + class | [RR-02](#rr-02-retention-schedule-schedule-a) |
| Annual policy & schedule review | Annual review cycle opens (`records.policy_review_completed`) | At least every 12 months | Updated policy + Schedule A | [RR-04](#rr-04-annual-policy-and-schedule-review) |
| Record reaches its destruction date | Retention clock expires (`record.retention_expired`) | On/after documented destruction date | Two-person verified, certified destruction | [RR-05](#rr-05-document-destruction) |
| Box/log convention applied at destruction | Destruction entry created (`destruction_log.entry_created`) | At destruction event | Destruction Log + labeled box | [RR-06](#rr-06-destruction-logging-and-storage-convention) |
| Litigation/investigation/subpoena received | Legal hold placed (`legal.hold_placed`) | Immediately; destruction suspended until release | Hold registry entry; clock suspended | [RR-07](#rr-07-legal-holds) |
| Annual email-archive retrievability test | Test cycle due (`email_archive.test_completed`) | At least every 12 months | Retrievability test result | [RR-08](#rr-08-core-processor-and-email-archives) |
| Annual employee retention training | Training cycle opens (`training.retention_cycle_opened`) | At least every 12 months | Completion record | [RR-09](#rr-09-training) |

## RR-01 — Responsibility and Administration  {#rr-01-responsibility-and-administration}

**WHY (Reg cite):** Sound record-retention programs operate under continuing Board authority and assigned senior ownership; the Interagency Guidelines Establishing Information Security Standards require the institution to assign responsibility for the program protecting customer information ([12 CFR Part 364, App. B](https://www.ecfr.gov/current/title-12/part-364/appendix-Appendix%20B%20to%20Part%20364)). California Financial Code recordkeeping obligations require an accountable owner for DFPI-chartered institutions.

**SYSTEM BEHAVIOR:** A single senior owner (SVP, Operations & Finance) is designated to monitor retention and destruction and report to the Board, and each department designates a records-retention contact accountable for proper completion of retention in its area. The system records each designation and the owning department, and routes a Board-facing retention report on the governance cycle. Designation records and the role register are write-restricted to Compliance; department contacts may update only their own area's retention status. If a designated department contact vacates the role, the area's pending destruction actions are paused until a replacement is recorded.

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| SVP/owner or a department contact is designated (`records.contact_assigned`) | Designee identity (`records.contact_name`), owning department (`department.id`), effective date (`covered_person.effective_date`) | Designation record + governance log (`governance.designation_recorded`) | At appointment (internal: 5 BD) |
| Department records-retention contact vacates (`records.contact_assigned` with `records.contact_vacated`) | Vacated contact (`records.contact_vacated`), affected area (`department.id`) | Reassignment task opened; pending disposal paused (`records.contact_assigned`) | Internal: 10 BD to reassign |
| Periodic Board retention report due (`records.board_report_filed`) | Retention metrics snapshot (`records.exception_count`), owner attestation (`covered_person.designated`) | Board retention report (`records.board_report_filed`) | Annual (enforced by `records.board_report_due_at`) |

**ALERTS/METRICS:** Alert on any department with a vacated records-retention contact older than 10 business days; target zero unassigned areas and on-time delivery of every scheduled Board retention report.

## RR-02 — Retention Schedule (Schedule A)  {#rr-02-retention-schedule-schedule-a}

**WHY (Reg cite):** Federal recordkeeping minimums anchor the schedule: BSA/AML records 5 years ([31 CFR §1010.430](https://www.ecfr.gov/current/title-31/section-1010.430)), Reg B credit-application records 25 months ([12 CFR §1002.12](https://www.ecfr.gov/current/title-12/part-1002#p-1002.12)), Reg Z 3 years after disclosure ([12 CFR §1026.25](https://www.ecfr.gov/current/title-12/part-1026#p-1026.25)), Reg CC 2 years ([12 CFR §229.21(g)](https://www.ecfr.gov/current/title-12/part-229#p-229.21)), Reg E 2 years ([12 CFR §1005.13](https://www.ecfr.gov/current/title-12/part-1005#p-1005.13)), with California Financial Code overlays applied where stricter.

**SYSTEM BEHAVIOR:** Schedule A maps each record class to a minimum retention period keyed to Pynthia's actual deposit, lending, and payment products, applying the stricter of federal minimum or California Financial Code overlay; records substantially similar to a scheduled item inherit the appropriate period. When a record is created, the system sets its retention clock from the anchor date defined by the matching Schedule A class. Schedule A entries are write-restricted to Compliance and the SVP owner; legacy Alabama Banking Code schedules are not carried over and any inherited Alabama period is treated as unmapped and re-derived from federal/California rules. A record class with no matching Schedule A entry is flagged as unmatched and routed to Compliance for classification rather than defaulting to destruction.

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Record is created and must inherit a class (`record.created`) | Record class (`record.retention_class`), storage medium (`record.storage_medium`), matched Schedule A code (`bookkeeping_entry.schedule_a_code`) | Retention clock set on record (`record.retention_clock_set`) | At creation (internal: same day) |
| Schedule A entry added or amended (`schedule_a.entry_added`) | Retention period (`schedule_a.retention_period`), inheritance flag (`schedule_a.entry_inherited`), amendment flag (`schedule_a.entry_amended`) | Schedule A entry + change log (`schedule_a.entry_added`) | At approval (internal: 5 BD) |
| Record class has no matching Schedule A entry (`record.created` with `record_class.unmatched`) | Proposed class (`record.retention_class`), record metadata (`record.metadata`) | Unmatched-class case for Compliance (`record.audit.opened`) | Internal: 10 BD to classify |

**ALERTS/METRICS:** Alert on any record created without a resolved Schedule A class older than 10 business days; target zero unmatched record classes and zero records with no retention clock set.

## RR-03 — Retention Methods and Electronic-Record Integrity  {#rr-03-retention-methods-and-electronic-record-integrity}

**WHY (Reg cite):** Records may be retained in any reproducible form provided integrity, accuracy, and accessibility are preserved for examiners to determine financial condition and the substance of transactions; the safeguarding of customer-information records across media is governed by the Interagency Guidelines ([12 CFR Part 364, App. B](https://www.ecfr.gov/current/title-12/part-364/appendix-Appendix%20B%20to%20Part%20364)). Reg B and Reg Z reproducibility expectations apply to electronically retained compliance records ([12 CFR §1002.12](https://www.ecfr.gov/current/title-12/part-1002#p-1002.12)).

**SYSTEM BEHAVIOR:** Records may be held as hard copy, imaging, microform, or electronic media so long as they remain accurate, accessible, and of sufficient integrity to be reproduced into a faithful copy on demand. When a record is converted between media, the system verifies and certifies the conversion before the source may be dispositioned, and runs periodic integrity tests on electronically retained records. Conversion certification and integrity-test configuration are write-restricted to Compliance and IT. A record that fails an integrity or reproduction test is held from destruction until the failure is remediated.

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Record is converted to another medium (`record.conversion_verified`) | Source medium (`record.media_type`), target medium (`record.storage_medium`), conversion result (`record.reproduction_result`) | Conversion certification (`record.conversion_certified`) | At conversion (internal: same day) |
| Periodic integrity/reproducibility test runs (`record.integrity_test_completed`) | Record class (`record.retention_class`), reproduction result (`record.reproduction_result`) | Integrity test result (`record.integrity_test_completed`) | Periodic (enforced by `record.integrity_test_due`) |

**ALERTS/METRICS:** Alert on any failed integrity or reproduction test; target zero unremediated integrity failures and 100% on-time completion of scheduled integrity tests.

## RR-04 — Annual Policy and Schedule Review  {#rr-04-annual-policy-and-schedule-review}

**WHY (Reg cite):** Retention requirements shift with regulatory reporting changes, products, complexity, technology, and storage costs; periodic policy review under Board authority maintains compliance with recordkeeping rules including BSA ([31 CFR §1010.430](https://www.ecfr.gov/current/title-31/section-1010.430)) and the Interagency safeguard guidelines ([12 CFR Part 364, App. B](https://www.ecfr.gov/current/title-12/part-364/appendix-Appendix%20B%20to%20Part%20364)).

**SYSTEM BEHAVIOR:** The policy and Schedule A are reviewed at least annually, revising for changes in state/federal reporting requirements, products and services, complexity, consumer-compliance requirements, technology, and storage costs; detected regulatory retention changes feed the review. The review cycle is governed by a registered timer, and a warning fires before the review lapses. Policy and Schedule A approval is write-restricted to the CCPO and SVP owner. A regulatory change detected mid-cycle triggers an interim Schedule A amendment rather than waiting for the annual cycle.

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual review cycle opens (`records.policy_review_completed`) | Current policy version (`policy.document_version`), Schedule A version (`schedule_a.version`), change drivers (`regulatory.change_identified`) | Completed review + revised policy/schedule (`records.policy_review_completed`) | Annual (enforced by `records.annual_review_due_at`) |
| Regulatory retention change detected mid-cycle (`regulation.retention_change_detected`) | Source citation (`regulation.citation`), affected class (`record.retention_class`) | Interim Schedule A amendment (`schedule_a.entry_added`) | Internal: 30 days from detection (enforced by `regulation.inventory_review_due_at`) |

**ALERTS/METRICS:** Alert when the annual review timer is within 30 days of lapse and when it lapses; target zero overdue annual reviews and prompt closure of detected regulatory-change items.

## RR-05 — Document Destruction  {#rr-05-document-destruction}

**WHY (Reg cite):** Records may be destroyed only after their documented retention period, and customer-information records must be disposed of using methods that render them unreadable per the Interagency Guidelines ([12 CFR Part 364, App. B](https://www.ecfr.gov/current/title-12/part-364/appendix-Appendix%20B%20to%20Part%20364)). Premature destruction undercuts compliance evidence required by BSA ([31 CFR §1010.430](https://www.ecfr.gov/current/title-31/section-1010.430)) and Reg B/Reg Z ([12 CFR §1002.12](https://www.ecfr.gov/current/title-12/part-1002#p-1002.12); [12 CFR §1026.25](https://www.ecfr.gov/current/title-12/part-1026#p-1026.25)).

**SYSTEM BEHAVIOR:** When a record's retention clock expires and no hold applies, it becomes disposal-eligible; destruction is performed only on or after the documented destruction date by a licensed destruction vendor, with two-person verification (initialed destruction log) and retention of the vendor's destruction certificate. Destruction is blocked for any record with an active legal hold. The disposal method and the licensed-vendor designation are write-restricted to Compliance; initiation of destruction requires two distinct verifying associates and cannot be self-approved.

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Retention clock expires for a record (`record.retention_expired`) | Destruction date (`record.destruction_date`), disposal-eligible flag (`record.disposal_eligible`), hold status (`record.hold_status`) | Disposal scheduled (`disposal.scheduled`) | On/after destruction date (enforced by `record.destruction_due_at`) |
| Two-person verified destruction executed (`record.destroyed`) | Disposal method (`record.disposal_method`), two-person verification (`record.actor_id`), batch manifest (`disposal.batch_manifest_id`) | Destruction executed + audit entry (`disposal.executed`) | At destruction (internal: same day) |
| Vendor destruction certificate received (`record.destruction_certified`) | Vendor certificate (`vendor.destruction_certificate`), batch manifest (`disposal.batch_manifest_id`) | Certificate recorded (`disposal.certificate_recorded`) | Internal: 5 BD of destruction |

**ALERTS/METRICS:** Alert on any disposal executed without a recorded vendor certificate, any destruction attempted against a held record, and any single-actor destruction attempt; target zero policy-violating destructions.

## RR-06 — Destruction Logging and Storage Convention  {#rr-06-destruction-logging-and-storage-convention}

**WHY (Reg cite):** A per-department destruction log and labeled storage support examiner review and demonstrate defensible disposal consistent with the Interagency safeguard guidelines ([12 CFR Part 364, App. B](https://www.ecfr.gov/current/title-12/part-364/appendix-Appendix%20B%20to%20Part%20364)) and the evidentiary purpose of BSA recordkeeping ([31 CFR §1010.430](https://www.ecfr.gov/current/title-31/section-1010.430)).

**SYSTEM BEHAVIOR:** Each department maintains a Destruction Log (Exhibit 1) available for examiner review, and storage boxes are labeled with Box Number, Content Description, From/To Dates, and Destruction Date that must match the log entry. The system creates a log entry at each destruction event and reconciles box labels against the log. Destruction Log entries are write-restricted to the department records-retention contact and Compliance. A box whose label fields do not match its log entry is flagged and held from destruction until the mismatch is resolved.

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Storage box created and labeled (`storage_box.created`) | Box number (`storage_box.number`), content description (`storage_box.description`), from/to dates (`storage_box.from_date`, `storage_box.to_date`), destruction date (`storage_box.destruction_date`) | Storage box record (`storage_box.created`) | At boxing (internal: same day) |
| Destruction log entry created at destruction (`destruction_log.entry_created`) | Log entry id (`destruction_log.entry_id`), matching box destruction date (`storage_box.destruction_date`) | Destruction Log entry (`destruction_log.entry_created`) | At destruction (internal: same day) |
| Box label and log entry disagree (`destruction_log.mismatch_detected`) | Box label fields (`storage_box.number`), log entry id (`destruction_log.entry_id`) | Mismatch case; box held (`destruction_log.mismatch_resolved`) | Internal: 5 BD to resolve |

**ALERTS/METRICS:** Alert on any unresolved box/log mismatch older than 5 business days; target zero label-log discrepancies at examiner review.

## RR-07 — Legal Holds  {#rr-07-legal-holds}

**WHY (Reg cite):** Records subject to litigation, investigation, or subpoena must be preserved; the program's purpose includes prompt production to authorities in legal investigations, and destruction of held customer records would violate the disposal expectations of the Interagency Guidelines ([12 CFR Part 364, App. B](https://www.ecfr.gov/current/title-12/part-364/appendix-Appendix%20B%20to%20Part%20364)) and undercut BSA evidentiary retention ([31 CFR §1010.430](https://www.ecfr.gov/current/title-31/section-1010.430)).

**SYSTEM BEHAVIOR:** On notice of litigation, investigation, or subpoena, a legal hold is placed that suspends scheduled destruction for in-scope records until the hold is formally released; the retention clock resumes only after release approval. Placement and release of holds are write-restricted to Legal and Compliance; release requires a recorded approver. Any disposal action targeting a held record is blocked while the hold is active, and a record under hold cannot be destroyed even if its Schedule A clock has otherwise expired.

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Litigation/investigation/subpoena received (`legal.process_received`) | Matter reference (`legal.matter_id`), hold scope (`legal.hold_scope`) | Legal hold created (`legal.hold_placed`) | Immediately on notice (internal: same day) |
| Hold applied to in-scope records (`record.hold_applied`) | Record scope (`record.hold_scope`), hold matter (`record.hold_matter_id`), authorizer (`record.hold_authorizer`) | Records flagged held; destruction suspended (`record.hold_placed`) | Internal: 1 BD of hold creation |
| Hold released after matter closes (`legal.hold_released`) | Release approver (`legal_hold.release_approved_by`), release id (`legal.hold_release_id`) | Hold lifted; clock resumed (`record.hold_released`) | At release (internal: same day) |

**ALERTS/METRICS:** Alert on any destruction attempt against a held record and on holds open beyond their matter's expected duration; target zero destructions of held records.

## RR-08 — Core Processor and Email Archives  {#rr-08-core-processor-and-email-archives}

**WHY (Reg cite):** Records held on third-party electronic archives must still meet retention and reproducibility requirements; integrity and safeguarding of customer-information records on the core processor and email systems fall under the Interagency Guidelines ([12 CFR Part 364, App. B](https://www.ecfr.gov/current/title-12/part-364/appendix-Appendix%20B%20to%20Part%20364)) and federal retention minimums such as BSA ([31 CFR §1010.430](https://www.ecfr.gov/current/title-31/section-1010.430)).

**SYSTEM BEHAVIOR:** Each department is accountable for confirming that proper retention timeframes are configured for records maintained on the core processor's electronic archive, and IT is accountable for email archives with periodic retrievability testing to confirm archived emails can be retrieved. Core-archive retention configuration confirmation is performed on a recurring cycle, and the email-archive retrievability test runs at least annually. Core-archive retention configuration is write-restricted to the owning department and Compliance; email-archive configuration is write-restricted to IT. A failed email retrievability test holds affected records from any scheduled destruction until retrievability is restored.

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Department confirms core-archive retention timeframes (`core_archive.retention_confirmed`) | Retention configuration (`core_archive.retention_config`), owning department (`department.id`) | Core-archive confirmation (`core_archive.retention_confirmed`) | Periodic (enforced by `core_archive.confirmation_due`) |
| IT runs email-archive retrievability test (`email_archive.test_completed`) | Test scope (`record.retention_class`), retrieval result (`record.reproduction_result`) | Email retrievability test result (`email_archive.test_completed`) | At least annual (enforced by `email_archive.test_due`) |

**ALERTS/METRICS:** Alert on any overdue core-archive confirmation or email retrievability test and on any failed email retrieval; target 100% on-time confirmations and zero unretrievable email-archive samples.

## RR-09 — Training  {#rr-09-training}

**WHY (Reg cite):** Effective recordkeeping depends on trained personnel; security-awareness and program training for staff handling customer-information records is contemplated by the Interagency Guidelines ([12 CFR Part 364, App. B](https://www.ecfr.gov/current/title-12/part-364/appendix-Appendix%20B%20to%20Part%20364)), and accurate retention execution supports BSA recordkeeping obligations ([31 CFR §1010.430](https://www.ecfr.gov/current/title-31/section-1010.430)).

**SYSTEM BEHAVIOR:** Record-retention training is provided to all employees at least annually, with department-specific content developed by each department's records-retention contact. The annual training cycle is opened on a registered timer, assignments are tracked to completion, and lapses are flagged. Training curriculum and completion records are write-restricted to Compliance and the assigning department contact. An employee who does not complete assigned retention training by the cycle close is flagged for remedial assignment rather than silently passing.

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Annual retention training cycle opens (`training.retention_cycle_opened`) | Curriculum id (`training.curriculum_id`), role/department matrix (`training.role_matrix`) | Training assignments created (`training.assigned`) | Annual (enforced by `training.retention_due_at`) |
| Employee completes assigned retention training (`training.retention_completed`) | Assignee (`training.assignee_id`), completion status (`training.completion_status`) | Completion record (`training.completion_recorded`) | By cycle close (enforced by `training.completion_due_at`) |
| Assigned training lapses unfinished (`training.retention_completed` with `training.lapsed`) | Assignee (`training.assignee_id`), lapse flag (`training.lapsed`) | Remedial assignment (`training.remedial_assigned`) | Internal: 10 BD after cycle close |

**ALERTS/METRICS:** Alert on any employee with incomplete retention training at cycle close; target 100% annual completion and prompt remediation of lapses.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for the policy and its centralized governance.
- **Administrator:** SVP, Operations & Finance — monitors retention and destruction and reports to the Board.
- **Required participants:** Department records-retention contacts, IT (email archives), and Internal Audit, each as referenced in the controls above.
- **Approval:** Approved by the Chief Compliance Officer; material changes and the annual review (see [RR-04](#rr-04-annual-policy-and-schedule-review)) require re-approval.
- **Review cadence:** At least every 12 months, or upon a detected regulatory retention change, per [RR-04](#rr-04-annual-policy-and-schedule-review).
- **Cross-references:** Substantive BSA/AML program → BSA Policy; loan/collections file management → Lending and Collections Policies; deposit/cash operations records → Cash Policy; security and email-system controls → Information Security Policy; consumer deletion rights → Privacy Policy. This policy governs retention periods and defensible destruction only.

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** Several field/event codes used in the control overlays are drawn from the registered core vocabulary (e.g., `record.*`, `disposal.*`, `destruction_log.*`, `storage_box.*`, `legal.*`, `schedule_a.*`, `core_archive.*`, `email_archive.*`, `training.*`, `records.*`) or from the agreed provisional-codes list (e.g., `department.id`, `record.retention_class`, `record.hold_scope`, `record.matter_id`, `record_class.description`, `records.retention.expires_at`, `retention.*`, `schedule_a.version`, `storage_box.description`). Where a registered code did not exist, the provisional spelling was reused verbatim; these will be confirmed by engineering before the next review. No new subjects, verbs, or task types were coined.
- **California Financial Code overlays are referenced generically.** Specific California Financial Code section numbers and the precise overlay periods per record class are not enumerated in PATRICK_NOTES; Schedule A must encode the stricter-of (federal vs. California) period per class, to be confirmed with counsel/DFPI guidance.
- **Charter type / NCUA applicability.** Pynthia is described as a credit union but DESIGN_NOTES and AUTHORITY_HINTS center on DFPI/California and Interagency 12 CFR Part 364 App. B; the precise primary regulator (NCUA vs. DFPI for a state-chartered CU) and any NCUA-specific recordkeeping overlay should be confirmed. NCUA 701.31 was not anchored because it addresses nondiscrimination in real-estate lending, not retention.
- **Alabama Banking Code removed.** The reference policy's Alabama schedules and 12 CFR Part 364 "bank" framing are intentionally dropped; any record class previously deriving its period only from Alabama law must be re-derived under federal/California rules ([RR-02](#rr-02-retention-schedule-schedule-a)).
- **HMDA/Reg C retention.** HMDA LAR retention applies only if Pynthia is a HMDA reporter; reporter status is assumed unconfirmed and the corresponding Schedule A class is conditional.
- **Schedule A content not reproduced.** The full per-class retention table (Schedule A / Exhibit 1) is maintained as a controlled artifact governed by [RR-02](#rr-02-retention-schedule-schedule-a) and [RR-04](#rr-04-annual-policy-and-schedule-review); this policy defines how the schedule is built, applied, and reviewed rather than restating every line item.
- **Core-archive confirmation cadence.** PATRICK_NOTES require departments to confirm core-processor retention but do not state a frequency; a recurring confirmation cycle is assumed ([RR-08](#rr-08-core-processor-and-email-archives)) and the exact interval needs confirmation.
