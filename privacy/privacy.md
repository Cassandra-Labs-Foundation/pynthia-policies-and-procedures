---
title: Privacy Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-16
next_review: 2027-06-16
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Privacy, GLBA, RegP, NPPI, FCRA, CPRA]
---

## General Policy Statement

Pynthia Credit Union operates a risk-based privacy program governing how nonpublic personal information (NPPI) of members and consumers is collected, used, disclosed, safeguarded, corrected, and disposed of across all deposit, lending, payment, and online products, and applicable to all directors, officers, employees, temporary staff, and vendors with access to NPPI. The program complies with the Gramm-Leach-Bliley Act and Regulation P, NCUA Part 748, FCRA/Reg V and NCUA Part 717, the FACTA Disposal Rule, the Right to Financial Privacy Act, E-SIGN, and applicable U.S. state privacy laws. Where two or more laws govern the same data or activity, Pynthia applies the **stricter standard to all members regardless of state of residence**, with CPRA-equivalent rights (access, deletion, correction, limitation of sensitive PI, data minimization, purpose limitation) serving as the floor for non-GLBA data such as marketing telemetry.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Initial privacy notice | New relationship established (`entity.created`) | At or before relationship start | GLBA initial notice | [PR-01](#pr-01-privacy-notice-lifecycle) |
| Annual privacy notice | 12 months since last notice, non-exempt (`privacy.annual_notice_due_at`) | Every 12 months | GLBA annual notice | [PR-01](#pr-01-privacy-notice-lifecycle) |
| Revised notice before material sharing change | Material change to sharing proposed (`privacy.notice_revised`) | Before sharing begins | GLBA revised notice | [PR-01](#pr-01-privacy-notice-lifecycle) |
| Opt-out propagation to martech | Opt-out received (`privacy.optout_received`) | 30 days (program standard) | Suppression record | [PR-02](#pr-02-opt-out-capture-and-honoring) |
| Notice copy on request | Member requests copy (`privacy.notice_copy_requested`) | 10 days | GLBA notice copy | [PR-04](#pr-04-customer-access-and-authentication), [PR-11](#pr-11-website-posting-and-e-sign-delivery) |
| Bureau-reported correction propagation | Correction identified (`correction.propagation_due_at`) | 30 days | Corrected data + recipients | [PR-05](#pr-05-data-accuracy-and-corrections) |
| Access revocation on termination | Employee separated (`employee.separated`) | 24 hours | Deprovision record | [PR-06](#pr-06-employee-access-minimization-and-training) |
| Secure disposal of NPPI | Retention expired (`record.retention_expired`) | 90 days (legal holds pause) | Certificate of destruction | [PR-08](#pr-08-secure-disposal-of-nppi) |
| Member breach notification | Misuse determined reportable (`incident.member_impact_confirmed`) | Without unreasonable delay (state clocks) | Member breach notice | [PR-09](#pr-09-incident-response-and-breach-notification) |
| NCUA incident notification | Reportable incident determined (`incident.ncua_notice_due_at`) | Per Part 748 App. B | NCUA notice | [PR-09](#pr-09-incident-response-and-breach-notification) |
| State privacy request (access/delete/correct) | Request received (`privacy.state_request_received`) | Per state statute | State rights fulfillment | [PR-12](#pr-12-state-privacy-variants-universal-floor) |
| Minor data deletion | Under-13 data detected (`privacy.minor_data_detected`) | Promptly on discovery | Deletion record | [PR-17](#pr-17-childrens-data) |
| Board reporting | Annual cycle / material incident (`privacy.board_report_due_at`) | Annual + ad hoc | Board privacy report | [PR-10](#pr-10-recordkeeping-complaints-and-board-reporting) |

## PR-01 — Privacy Notice Lifecycle  {#pr-01-privacy-notice-lifecycle}

- **WHY (Reg cite):** Regulation P requires initial notices at relationship inception ([§1016.4](https://www.ecfr.gov/current/title-12/part-1016#p-1016.4)), annual notices unless exempt ([§1016.5](https://www.ecfr.gov/current/title-12/part-1016#p-1016.5)), revised notices before a material change in sharing ([§1016.8](https://www.ecfr.gov/current/title-12/part-1016#p-1016.8)), and prescribed delivery methods ([§1016.9](https://www.ecfr.gov/current/title-12/part-1016#p-1016.9)).
- **SYSTEM BEHAVIOR:** On relationship creation the platform delivers the initial notice at or before account opening and records the delivery channel, timestamp, and template id; an annual scheduler fires every 12 months unless the registered annual-notice exemption status applies, in which case the cycle is suppressed and the exemption is logged. When a material change to sharing is proposed, the system blocks all non-exception sharing until the revised notice has been delivered. Template publication and the sharing-block override are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | New member or consumer relationship established (`entity.created`) | Member identity (`member.id`), delivery channel (`member.delivery_channel`), notice template (`privacy.notice_template_id`) | Initial notice delivered + delivery record (`privacy.notice_delivered`) | At or before relationship start (enforced by `privacy.annual_notice_due_at`) |
  | Annual notice cycle due, non-exempt (`privacy.annual_notice_due_at`) | Exemption status (`privacy.annual_exemption_status`), template (`privacy.notice_template_id`) | Annual notice delivered (`privacy.notice_delivered`) | 12 months (enforced by `privacy.annual_notice_due_at` under `privacy_annual_notice`) |
  | Material change to sharing proposed (`privacy.notice_revised`) | Change basis (`privacy.sharing_change_basis`), template (`privacy.notice_template_id`) | Revised notice delivered; sharing block released (`privacy.notice_delivered`) | Before non-exception sharing begins |
  | New notice template approved (`privacy.notice_template_published`) | Template id (`privacy.notice_template_id`), data classification (`privacy.data_classification`) | Published template + publication record (`privacy.notice_template_published`) | — (internal: prior to first use) |

- **ALERTS/METRICS:** Alert on any annual-notice timer aging past due and target zero overdue; alert on any sharing event attempted while `privacy.sharing_blocked` is set, target zero leakage.

## PR-02 — Opt-Out Capture & Honoring  {#pr-02-opt-out-capture-and-honoring}

- **WHY (Reg cite):** Regulation P [§1016.7](https://www.ecfr.gov/current/title-12/part-1016#p-1016.7) governs the consumer right to opt out of certain information sharing and the institution's duty to provide reasonable opt-out means and honor them.
- **SYSTEM BEHAVIOR:** The platform offers at least two opt-out channels, enforces suppression immediately upon receipt, and propagates the opt-out to martech vendors within the 30-day program standard. Opt-out revocation reverses suppression and is logged with a revocation artifact. Opt-out scope and enforcement flags are write-restricted to Privacy Operations.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Member submits opt-out (`privacy.optout_received`) | Opt-out channel (`privacy.optout_channel`), scope (`privacy.optout_scope`), member identity (`member.id`) | Suppression enforced + opt-out record (`privacy.optout_received`) | Immediate |
  | Opt-out enforced, requires vendor propagation (`privacy.optout_propagation_due_at`) | Opt-out scope (`privacy.optout_scope`), enforcement flag (`privacy.optout_enforced`) | Vendor suppression propagated (`privacy.optout_propagated`) | 30 days program standard (enforced by `privacy.optout_propagation_due_at` under `privacy_optout_propagation`) |
  | Member revokes opt-out (`privacy.optout_cleared`) | Revocation artifact (`privacy.revocation_artifact_id`), opt-out scope (`privacy.optout_scope`) | Suppression cleared + revocation record (`privacy.optout_cleared`) | Immediate |

- **ALERTS/METRICS:** Alert on opt-out propagation timer aging beyond 30 days, target zero overdue; monitor suppression-enforcement latency distribution from receipt to enforcement (target sub-second) and target zero shares to opted-out members.

## PR-03 — Permissible Disclosures & Exceptions  {#pr-03-permissible-disclosures-and-exceptions}

- **WHY (Reg cite):** Regulation P exceptions for service providers and joint marketing ([§1016.13](https://www.ecfr.gov/current/title-12/part-1016#p-1016.13)), servicing and processing ([§1016.14](https://www.ecfr.gov/current/title-12/part-1016#p-1016.14)), and other permitted purposes including legal/protective ([§1016.15](https://www.ecfr.gov/current/title-12/part-1016#p-1016.15)) define when sharing is allowed without opt-out.
- **SYSTEM BEHAVIOR:** Every disclosure must be tagged with a legal basis under the applicable exception before data leaves the institution; disclosures lacking an approved basis are blocked. For service-provider and joint-marketing exceptions the system verifies a GLBA confidentiality clause exists in the vendor contract before sharing. Legal-basis approval is write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Disclosure initiated (`disclosure.initiated`) | Legal basis (`disclosure.legal_basis`), recipient/vendor basis check (`disclosure.vendor_basis_check`) | Basis recorded; blocked if unverified (`disclosure.legal_basis_recorded`) | — (internal: before data leaves institution) |
  | Disclosure legal basis approved (`disclosure.basis_approved`) | Legal basis (`disclosure.legal_basis`), GLBA addendum reference (`vendor.glba_addendum_id`) | Approved-basis record (`disclosure.basis_approved`) | — (internal: prior to share) |
  | Service-provider/joint-marketing share requested (`vendor.data_sharing_requested`) | GLBA clause verification (`disclosure.vendor_basis_check`), addendum (`vendor.glba_addendum_id`) | Sharing authorized + record (`vendor.data_sharing_authorized`) | — (internal: clause verified pre-share) |

- **ALERTS/METRICS:** Alert on any disclosure attempted with `disclosure.basis_blocked` set, target zero un-based disclosures; track count of shares blocked for missing GLBA clause.

## PR-04 — Customer Access & Authentication  {#pr-04-customer-access-and-authentication}

- **WHY (Reg cite):** Regulation P delivery requirements ([§1016.9](https://www.ecfr.gov/current/title-12/part-1016#p-1016.9)), NCUA member-information safeguards ([Part 748](https://www.ecfr.gov/current/title-12/part-748)), and the Right to Financial Privacy Act ([12 USC §3401 et seq.](https://www.law.cornell.edu/uscode/text/12/3401)) require identity verification before disclosing member information and govern release of records.
- **SYSTEM BEHAVIOR:** Before disclosing member information across in-person, phone, or online channels the platform verifies member identity, and where an agent acts on a member's behalf it validates a power-of-attorney artifact; failed authentication refuses disclosure. Notice copy requests are fulfilled within 10 days. Authentication-method configuration and POA validation are write-restricted to Privacy Operations and member-services supervisors.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Member or agent requests information (`access.request_received`) | Identity check method (`member.identity_check_method`), agent identity (`access.agent_identity`), POA artifact (`access.poa_artifact_id`) | Authentication result; disclosure or refusal (`access.granted`) | — (internal: real-time before disclosure) |
  | Agent presents power-of-attorney (`access.poa_presented`) | POA artifact (`access.poa_artifact_id`), validation flag (`access.poa_validated`) | POA accepted or rejected (`access.poa_rejected`) | — (internal: real-time) |
  | Member requests notice copy (`privacy.notice_copy_requested`) | Member identity (`member.id`), template (`privacy.notice_template_id`) | Notice copy delivered (`privacy.notice_copy_delivered`) | 10 days (enforced by `privacy.notice_copy_due_at` under `privacy_notice_copy`) |

- **ALERTS/METRICS:** Alert on notice-copy timer aging past 10 days, target zero overdue; monitor authentication failure and refused-disclosure rates for anomalies.

## PR-05 — Data Accuracy & Corrections  {#pr-05-data-accuracy-and-corrections}

- **WHY (Reg cite):** FCRA/Reg V ([12 CFR Part 1022](https://www.ecfr.gov/current/title-12/part-1022)) governs accuracy of furnished consumer information, NCUA Part 717 ([12 CFR Part 717](https://www.ecfr.gov/current/title-12/part-717)) implements Red Flags and address-discrepancy rules, and NCUA [Part 748](https://www.ecfr.gov/current/title-12/part-748) requires safeguarding member information.
- **SYSTEM BEHAVIOR:** Master-data corrections propagate to all downstream systems and, where applicable, to prior recipients within 30 days for bureau-reported items, with propagation evidence retained. USPS/NCOA address mismatches route through the Red Flags address-discrepancy process. Correction propagation scheduling is write-restricted to Privacy Operations.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Bureau-reported correction identified (`furnishing.correction_applied`) | Correction evidence (`correction.evidence_artifact_id`), disputed account (`furnishing.disputed_account`) | Correction propagated + record (`correction.propagated`) | 30 days (enforced by `correction.propagation_due_at` under `correction_propagation`) |
  | Address discrepancy received (`bureau.address_discrepancy_received`) | NCOA candidate (`address.ncoa_candidate`), discrepancy artifact (`bureau.discrepancy_artifact_id`) | Red Flags case opened or address confirmed (`bureau.address_confirmed`) | — (internal: per Red Flags SLA) |
  | NCOA mismatch detected (`address.ncoa_mismatch_detected`) | Address fields (`address.line1`, `address.postal_code`), NCOA candidate (`address.ncoa_candidate`) | Red Flags review opened (`redflags.review_opened`) | — (internal: per Red Flags SLA) |

- **ALERTS/METRICS:** Alert on correction-propagation timer aging past 30 days, target zero overdue; track count of unresolved address discrepancies aging beyond the Red Flags SLA.

## PR-06 — Employee Access Minimization & Training  {#pr-06-employee-access-minimization-and-training}

- **WHY (Reg cite):** NCUA [Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires access controls, least-privilege restriction of member information, and ongoing staff training as part of the information-security program.
- **SYSTEM BEHAVIOR:** Access follows least-privilege RBAC with quarterly access reviews; on termination, access is revoked within 24 hours. Onboarding privacy training is assigned at hire and annual privacy training thereafter. Role entitlements and review attestations are write-restricted to Information Security/IT.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Employee separated (`employee.separated`) | User id (`user.id`), employment status (`user.employment_status`) | Access deprovisioned (`access.deprovisioned`) | 24 hours (enforced by `access.deprovision_due_at` under `access_deprovision`) |
  | Quarterly access review due (`access.review_due`) | Reviewer roster (`access.reviewer_roster`), role entitlements (`access.role_entitlements`) | Access review completed + attestation (`access.review_completed`) | Quarterly (enforced by `access.review_due_at` under `access_review`) |
  | Employee hired into covered role (`employee.hired`) | Assignee id (`training.assignee_id`), privacy curriculum (`training.curriculum_id`) | Onboarding training assigned (`training.assigned`) | At hire (enforced by `training.onboarding_due_at` under `training_newhire`) |
  | Annual privacy training cycle opened (`training.annual_cycle_opened`) | Curriculum (`training.curriculum_id`), assignee (`training.assignee_id`) | Annual training completed (`training.completed`) | Annual (enforced by `training.privacy_due` under `training_privacy`) |

- **ALERTS/METRICS:** Alert on any termination where deprovision exceeds 24 hours, target zero; track quarterly access-review completion percentage (target 100%) and annual privacy training coverage percentage.

## PR-07 — Third-Party Oversight & Contracts  {#pr-07-third-party-oversight-and-contracts}

- **WHY (Reg cite):** Regulation P joint-marketing/service-provider exception ([§1016.13](https://www.ecfr.gov/current/title-12/part-1016#p-1016.13)) and NCUA [Part 748](https://www.ecfr.gov/current/title-12/part-748) require contractual safeguards and oversight of third parties with access to member information.
- **SYSTEM BEHAVIOR:** Before first data transfer the program requires due diligence, an executed GLBA addendum, a data map, and subprocessor flow-downs; first transfer is blocked until privacy sign-off is recorded. Privacy oversight re-attests on annual review with continuous monitoring. The privacy block flag is write-restricted to Compliance and Privacy Operations. This control governs only privacy-specific clauses; broader vendor lifecycle risk management is handled under the Third-Party Risk Policy.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Vendor privacy review requested before first transfer (`vendor.privacy_review_requested`) | GLBA addendum (`vendor.glba_addendum_id`), data map (`vendor.data_map_id`), NPI access flag (`vendor.npi_access_flag`) | Privacy approval; transfer block released (`vendor.privacy_approved`) | — (internal: before first transfer) |
  | GLBA clause verification performed (`vendor.glba_clause_verified`) | Clause id (`vendor.clause_id`), subprocessor attestation (`vendor.subprocessor_attestation`) | Clause-verified record (`vendor.glba_clause_verified`) | — (internal: pre-transfer) |
  | Annual vendor privacy review due (`vendor.annual_review_due`) | Data map (`vendor.data_map_id`), monitoring alerts (`vendor.monitoring_alert`) | Annual review completed (`vendor.monitoring_review_completed`) | Annual (enforced by `vendor.annual_review_due_at` under `vendor_annual_review`) |

- **ALERTS/METRICS:** Alert on any data transfer attempted while `vendor.privacy_blocked` is set, target zero; track count of vendors overdue for annual privacy review.

## PR-08 — Secure Disposal of NPPI  {#pr-08-secure-disposal-of-nppi}

- **WHY (Reg cite):** The FACTA Disposal Rule ([16 CFR Part 682](https://www.ecfr.gov/current/title-16/part-682)) requires reasonable measures for disposal of consumer report information, and NCUA [Part 748](https://www.ecfr.gov/current/title-12/part-748) requires safeguarding member information through its lifecycle.
- **SYSTEM BEHAVIOR:** The retention schedule drives certified destruction of paper, media, and data within 90 days of retention expiry; an active legal hold pauses the destruction clock and resumes it on release. Each disposal retains a certificate of destruction. Hold placement and release are write-restricted to Legal. Detailed retention schedules beyond NPPI disposal timing live in the Record Retention Policy.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Retention expired for NPPI record (`record.retention_expired`) | Record class (`record.retention_class`), disposal eligibility (`record.disposal_eligible`), legal hold flag (`record.legal_hold_flag`) | Disposal scheduled (`disposal.scheduled`) | 90 days, paused by hold (enforced by `record.disposal_due_at` under `record_disposal`) |
  | Disposal executed (`record.destroyed`) | Disposal method (`record.disposal_method`), batch manifest (`disposal.batch_manifest_id`) | Certificate of destruction recorded (`disposal.certificate_recorded`) | — (internal: at execution) |
  | Legal hold released, clock resumes (`legal_hold.clear_confirmed`) | Hold scope (`legal_hold.hold_scope`), resume flag (`disposal.clock_resumed`) | Schedule resumed record (`legal_hold.clear_confirmed`) | — (internal: on release) |

- **ALERTS/METRICS:** Alert on any NPPI record past 90-day disposal window without an active hold, target zero; track certificate-of-destruction completeness (one per disposal batch).

## PR-09 — Incident Response & Breach Notification  {#pr-09-incident-response-and-breach-notification}

- **WHY (Reg cite):** NCUA [Part 748 Appendix B](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20B%20to%20Part%20748) prescribes the response program and member notification for unauthorized access to member information; state breach laws set notification clocks; the Right to Financial Privacy Act ([12 USC §3401 et seq.](https://www.law.cornell.edu/uscode/text/12/3401)) governs records access.
- **SYSTEM BEHAVIOR:** The platform detects, contains, classifies, and determines reportability of incidents involving member information, notifying affected members and regulators without unreasonable delay per applicable state clocks and Part 748. Where criminal activity is suspected the incident is referred for SAR filing under the BSA Policy. Privacy and Legal are integrated into the IR runbook. Reportability determination and member-notice template selection are write-restricted to Compliance and Legal.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Incident involving member data detected (`incident.detected`) | Data scope (`incident.data_scope`), detection source (`incident.detection_source`), severity (`incident.severity`) | Incident triaged (`incident.classified`) | Triage SLA (enforced by `incident.triage_due_at` under `incident_triage`) |
  | Misuse/member impact determined reportable (`incident.member_impact_confirmed`) | Misuse determination (`incident.misuse_determined`), notice template (`incident.member_notice_template`) | Member notices sent (`incident.member_notices_sent`) | Without unreasonable delay, state clocks (enforced by `incident.notification_due_at` under `incident_notification`) |
  | Reportable incident determined for NCUA (`incident.ncua_notified`) | Reportability determination (`incident.reportability_determination`), metrics snapshot (`ncua.metrics_snapshot`) | NCUA notice sent (`incident.ncua_notified`) | Per Part 748 App. B (enforced by `incident.ncua_notice_due_at` under `incident_ncua_notice`) |
  | Criminal activity suspected (`incident.material_flagged`) | Criminal-suspected flag (`incident.criminal_suspected`), BSA referral (`incident.bsa_referral_id`) | SAR referral recorded (`incident.material_flagged`) | — (internal: per BSA Policy SAR clock) |

- **ALERTS/METRICS:** Alert on member-notification and NCUA-notification timers aging toward their state/regulatory deadlines, target zero breaches; track median time from detection to containment.

## PR-10 — Recordkeeping, Complaints & Board Reporting  {#pr-10-recordkeeping-complaints-and-board-reporting}

- **WHY (Reg cite):** NCUA [Part 748](https://www.ecfr.gov/current/title-12/part-748) requires the board to oversee the information-security and privacy program, including reporting on its status and material incidents.
- **SYSTEM BEHAVIOR:** The platform centralizes complaint logs, notices, opt-outs, and program metrics, and delivers a privacy report to the Board at least annually and ad hoc for material incidents. Privacy complaints are logged through the incident/complaint pipeline. Board package contents and metrics packages are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual board reporting cycle due (`privacy.board_report_due_at`) | Metrics package (`privacy.metrics_package_id`), complaint trend summary (`complaint.trend_summary`) | Board privacy report delivered (`privacy.board_report_delivered`) | Annual (enforced by `privacy.board_report_due_at` under `privacy_board_report`) |
  | Material privacy incident occurs (`incident.material_flagged`) | Incident summary (`incident.summary_id`), impact summary (`incident.impact_summary`) | Ad hoc board report delivered (`privacy.board_adhoc_delivered`) | Ad hoc on materiality |
  | Privacy complaint received (`complaint.privacy_received`) | Complaint narrative (`complaint.narrative`), category (`complaint.category`), member id (`complaint.member_id`) | Complaint logged (`complaint.logged`) | — (internal: per complaint pipeline SLA) |

- **ALERTS/METRICS:** Alert if the annual board report is not delivered within the cycle window, target zero misses; track privacy-complaint volume and trend deltas period over period.

## PR-11 — Website Posting & E-SIGN Delivery  {#pr-11-website-posting-and-e-sign-delivery}

- **WHY (Reg cite):** Regulation P delivery rules ([§1016.9](https://www.ecfr.gov/current/title-12/part-1016#p-1016.9)) permit electronic delivery, and E-SIGN ([15 USC §7001](https://www.law.cornell.edu/uscode/text/15/7001)) governs electronic consent capture and retention for notices delivered electronically.
- **SYSTEM BEHAVIOR:** The current notice is hosted in an ADA-accessible format and the system captures and retains e-consent artifacts before electronic delivery. Notice copy requests are fulfilled within 10 days. ADA validation references and e-consent records are write-restricted to Privacy Operations. Electronic delivery channel mechanics beyond consent capture are governed by the E-Commerce Policy.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Website notice updated (`privacy.website_notice_updated`) | Template id (`privacy.notice_template_id`), ADA validation (`privacy.ada_validation_id`) | Updated accessible notice posted (`privacy.website_notice_updated`) | — (internal: at publication) |
  | E-consent capture started for electronic delivery (`privacy.esign_consent_started`) | E-sign consent evidence (`member.esign_consent_evidence`), access confirmation (`privacy.esign_access_confirmation`) | E-consent recorded (`privacy.esign_consent_recorded`) | — (internal: before electronic delivery) |
  | Member requests notice copy (`privacy.notice_copy_requested`) | Member identity (`member.id`), template (`privacy.notice_template_id`) | Notice copy delivered (`privacy.notice_copy_delivered`) | 10 days (enforced by `privacy.notice_copy_due_at` under `privacy_notice_copy`) |

- **ALERTS/METRICS:** Alert on failed ADA validation of the posted notice, target zero; track e-consent capture completeness for electronically delivered notices.

## PR-12 — State Privacy Variants (Universal Floor)  {#pr-12-state-privacy-variants-universal-floor}

- **WHY (Reg cite):** State privacy laws (California/CPRA, Vermont, Nevada) impose access/deletion/correction and Do-Not-Sell/Share obligations on non-GLBA data; Regulation P ([§1016.7](https://www.ecfr.gov/current/title-12/part-1016#p-1016.7)) preserves additional state-law sharing limits. Pynthia applies CPRA-equivalent rights as the universal floor for all members.
- **SYSTEM BEHAVIOR:** The platform separates GLBA NPPI from non-GLBA telemetry and applies CPRA-equivalent rights (access, delete, correct, limit sensitive PI use, data minimization, purpose limitation) to all members regardless of state. It honors Do Not Sell/Share requests and GPC signals for non-GLBA data and enforces Vermont opt-in and Nevada opt-out marketing limits. State-request fulfillment routing and Vermont/Nevada enforcement flags are write-restricted to Privacy Operations.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | State privacy request received (`privacy.state_request_received`) | Request type (`privacy.state_request_type`), data classification (`privacy.data_classification`), member id (`member.id`) | Request fulfilled + record (`privacy.state_request_fulfilled`) | Per state statute (enforced by `privacy.state_request_due_at` under `privacy_state_request`) |
  | Nevada opt-out received (`privacy.nv_optout_received`) | Opt-out scope (`privacy.optout_scope`), enforcement flag (`privacy.nv_optout_enforced`) | Nevada opt-out enforced (`privacy.nv_optout_received`) | Per Nevada law (program: immediate) |
  | Vermont sharing requires opt-in (`disclosure.initiated`) | Vermont opt-in check (`disclosure.vt_optin_check`), opt-in status (`privacy.vt_optin_status`) | Sharing blocked until opt-in (`disclosure.legal_basis_recorded`) | — (internal: before share) |

- **ALERTS/METRICS:** Alert on state-request timer aging toward statutory deadline, target zero late fulfillments; track count of non-GLBA shares blocked for missing Vermont opt-in or honored Nevada/Do-Not-Sell signals.

## PR-13 — Anonymization & Aggregation  {#pr-13-anonymization-and-aggregation}

- **WHY (Reg cite):** CPRA-equivalent data-minimization and purpose-limitation standards (applied as the universal floor per [PR-12](#pr-12-state-privacy-variants-universal-floor)) permit analytics/R&D only on de-identified data; Regulation P sharing limits ([§1016.7](https://www.ecfr.gov/current/title-12/part-1016#p-1016.7)) and NCUA [Part 748](https://www.ecfr.gov/current/title-12/part-748) safeguarding requirements anchor the prohibition on re-identification.
- **SYSTEM BEHAVIOR:** Analytics and R&D are permitted only on documented, non-identifiable datasets with re-identification prohibited and small-cohort thresholds applied; de-identification methods are reviewed at least annually. Dataset approval and de-identification method definitions are write-restricted to Privacy Operations and the analytics method owner.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Analytics dataset requested (`analytics.dataset_requested`) | De-id method (`analytics.deid_method_id`), cohort threshold (`analytics.cohort_threshold`), source scope (`analytics.source_scope`) | Dataset approved or rejected (`analytics.dataset_approved`) | — (internal: before dataset use) |
  | Re-identification risk assessed (`analytics.method_review_completed`) | Re-id risk assessment (`analytics.reid_risk_assessment`), method id (`analytics.deid_method_id`) | Method review completed (`analytics.method_review_completed`) | Annual (enforced by `analytics.method_review_due_at` under `analytics_method_review`) |

- **ALERTS/METRICS:** Alert on de-identification method review aging past 12 months, target zero overdue; track count of datasets failing the small-cohort threshold check.

## PR-14 — Cookies & Online Tracking (Non-GLBA)  {#pr-14-cookies-and-online-tracking-non-glba}

- **WHY (Reg cite):** California/CPRA and other state privacy laws (applied as the universal floor per [PR-12](#pr-12-state-privacy-variants-universal-floor)) require consent and honoring of universal opt-out signals for non-GLBA online tracking; ADA accessibility ([28 CFR Part 36](https://www.ecfr.gov/current/title-28/part-36)) governs the accessible presentation of the cookie banner and preference center.
- **SYSTEM BEHAVIOR:** The platform operates a cookie banner and preference center, blocks non-essential tags until consent is captured where required, and honors GPC and other universal opt-out signals for California users. New tags require review and approval before deployment. Tag approval and consent-state configuration are write-restricted to Privacy Operations.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Web session started (`web.session_started`) | Visitor jurisdiction (`web.visitor_jurisdiction`), GPC signal (`web.gpc_signal`), consent state (`web.consent_state`) | Tags gated per consent (`web.consent_recorded`) | — (internal: real-time before non-essential tags fire) |
  | New tracking tag submitted for review (`web.tag_review_requested`) | Tag vendor (`web.tag_vendor_id`), tag data scope (`web.tag_data_scope`) | Tag approved or rejected (`web.tag_approved`) | — (internal: before deployment) |
  | Consent preference updated (`web.consent_updated`) | Consent state (`web.consent_state`), visitor id (`web.visitor_id`) | Updated consent recorded (`web.consent_updated`) | — (internal: immediate) |

- **ALERTS/METRICS:** Alert on any non-essential tag firing before consent for in-scope jurisdictions, target zero; track GPC honoring rate for California sessions.

## PR-15 — Third-Party App/Account Connections  {#pr-15-third-party-app-account-connections}

- **WHY (Reg cite):** Regulation P servicing/processing exception ([§1016.14](https://www.ecfr.gov/current/title-12/part-1016#p-1016.14)) and NCUA [Part 748](https://www.ecfr.gov/current/title-12/part-748) govern member-authorized data-sharing connections and the safeguarding of member information passed through APIs.
- **SYSTEM BEHAVIOR:** Member-authorized API connections are scoped and consented with purpose-limited tokens and an immediate revoke path; reuse beyond the consented scope is prohibited and detected. Token issuance scope and revocation are write-restricted to Privacy Operations and the connection's owning service.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Member grants connection consent (`connection.consent_granted`) | Party id (`connection.party_id`), token scope (`connection.access_log_id`) | Purpose-limited token issued (`connection.token_issued`) | — (internal: at consent) |
  | Member requests revoke (`connection.revoke_requested`) | Connection id (`connection.id`), token reference (`connection.token_revoked`) | Token revoked + connection suspended (`connection.revoke_requested`) | Immediate |
  | Out-of-scope reuse detected (`connection.scope_violation_detected`) | Token scope (`connection.access_log_id`), party id (`connection.party_id`) | Connection suspended + violation record (`connection.scope_violation_detected`) | Immediate |

- **ALERTS/METRICS:** Alert on any detected scope violation, target zero; track revoke-path latency from request to token revocation (target sub-minute).

## PR-16 — Biometric Data for KYC  {#pr-16-biometric-data-for-kyc}

- **WHY (Reg cite):** State biometric privacy laws and CPRA sensitive-PI limits (applied as the universal floor per [PR-12](#pr-12-state-privacy-variants-universal-floor)) constrain collection, storage, and reuse of biometric identifiers; NCUA [Part 748](https://www.ecfr.gov/current/title-12/part-748) requires safeguarding such NPPI throughout its lifecycle.
- **SYSTEM BEHAVIOR:** Vendor face-match and liveness checks are permitted only under explicit contractual limits, with vendor-side storage preferred and model reuse prohibited; biometric data is purged per state biometric law, and a non-biometric verification path is offered where feasible. Biometric consent capture and the alternate-path flag are write-restricted to Privacy Operations and the identity vendor configuration.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Biometric verification started (`verification.biometric_started`) | Biometric consent (`verification.biometric_consent_id`), alt-path availability (`verification.alt_path_available`) | Biometric check completed (`verification.biometric_completed`) | — (internal: real-time) |
  | Member declines biometric path (`verification.alt_path_started`) | Decline flag (`verification.biometric_declined`), alt-path availability (`verification.alt_path_available`) | Non-biometric verification path opened (`verification.alt_path_started`) | — (internal: immediate) |
  | Biometric retention expired (`verification.biometric_purged`) | Purge flag (`verification.biometric_purged`), purge due (`verification.biometric_purge_due_at`) | Biometric data purged + record (`verification.biometric_purged`) | Per state biometric law (enforced by `verification.biometric_purge_due_at` under `verification_biometric_purge`) |

- **ALERTS/METRICS:** Alert on biometric purge timer aging past statutory window, target zero; track adoption rate of the non-biometric alternate path.

## PR-17 — Children's Data  {#pr-17-childrens-data}

- **WHY (Reg cite):** COPPA ([16 CFR Part 312](https://www.ecfr.gov/current/title-16/part-312)) governs collection of personal information from children under 13 and requires deletion of data collected without valid parental consent.
- **SYSTEM BEHAVIOR:** The platform applies age gates, treats the service as not directed to under-13 users, and promptly deletes minor data on discovery. Age-gate ruleset configuration and minor-data deletion authorization are write-restricted to Privacy Operations.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Under-13 data detected (`privacy.minor_data_detected`) | Age-gate ruleset (`privacy.age_gate_ruleset_id`), member id (`member.id`) | Minor data deleted + record (`privacy.minor_data_detected`) | Promptly on discovery |
  | Age gate blocks under-13 registration (`privacy.minor_data_detected`) | Age-gate block flag (`privacy.age_gate_blocked`), ruleset (`privacy.age_gate_ruleset_id`) | Registration blocked + record (`privacy.minor_data_detected`) | — (internal: real-time at gate) |

- **ALERTS/METRICS:** Alert on any detected minor data not deleted within the prompt-deletion window, target zero; track age-gate block counts as a population-health signal.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer, with the BSA/AML Officer as joint program owner for incident-to-SAR referral controls.
- **Required participants:** Privacy Operations, Legal, Information Security/IT, and affected business owners.
- **Approvals:** Patrick Wilson, Chief Compliance Officer.
- **Review cadence:** Annual review (next review 2027-06-16) and ad hoc upon material regulatory or product change.
- **Cross-references:** Information Security Policy (safeguards), Third-Party Risk Policy (vendor lifecycle), Record Retention Policy (retention schedules), BSA Policy (SAR mechanics), Member Policy (account servicing), E-Commerce Policy (electronic delivery mechanics). Internal control cross-references appear only in the [Timing Matrix](#timing-matrix).

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** The privacy-side resources, fields, events, and timers referenced throughout the EVENTS tables (e.g., `privacy.*`, `disclosure.*`, `vendor.privacy_*`, `web.consent_*`, `connection.*`, `verification.biometric_*`, `analytics.deid_*`) are drawn from the registered `privacy`, `disclosure`, `vendor`, `web`, `connection`, `verification`, `analytics`, `correction`, `record`, and `incident` subjects in the parsed banking-core vocabulary, plus the provisional-codes list. Any code that resolves to a provisional spelling (e.g., `privacy.notice_template_id`) uses that exact agreed spelling and will be confirmed by engineering before the next review. No new subjects, verbs, or task types were minted.
- **HMDA reporter / charter applicability.** This policy assumes Pynthia is an NCUA-chartered credit union subject to Part 748, Part 717, and Reg P; if charter type or HMDA reporter status differs, the WHY citations for the incident, accuracy, and oversight controls should be re-confirmed.
- **State-law scope.** State variants are modeled on California/CPRA, Vermont, and Nevada and applied as a universal floor; if Pynthia takes deposits from members in additional states with stricter non-GLBA rules, [PR-12](#pr-12-state-privacy-variants-universal-floor) thresholds need confirmation before the next review.
- **Opt-out propagation window.** The 30-day vendor propagation window in [PR-02](#pr-02-opt-out-capture-and-honoring) is a Pynthia program standard, not a Reg P mandate; confirm it remains the stricter applicable standard for non-GLBA telemetry.
- **Biometric and minor-data clocks.** [PR-16](#pr-16-biometric-data-for-kyc) purge timing and [PR-17](#pr-17-childrens-data) "promptly on discovery" deletion follow the strictest applicable state biometric law and COPPA respectively; specific day-count SLAs were not provided in PATRICK_NOTES and should be parameterized by Legal.
- **Red Flags integration.** [PR-05](#pr-05-data-accuracy-and-corrections) routes USPS/NCOA mismatches into the Red Flags process owned outside this policy; the exact downstream SLA is governed by the Red Flags program and is referenced, not redefined, here.
