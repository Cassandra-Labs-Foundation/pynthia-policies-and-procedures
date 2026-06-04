---
title: Privacy Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v3.0
effective: 2026-06-04
next_review: 2027-06-04
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Privacy, GLBA, Regulation P, NPPI, Data Protection]
---

# Privacy Policy

## General Policy Statement

Pynthia Credit Union operates a risk-based privacy program governing how nonpublic personal information (NPPI) of members and consumers is collected, used, disclosed, safeguarded, corrected, and disposed of — in any form, across all deposit, lending, payment, and online products, and binding on all directors, officers, employees, temporary staff, and vendors with access to NPPI. The program complies with the Gramm-Leach-Bliley Act and [Regulation P (12 CFR Part 1016)](https://www.ecfr.gov/current/title-12/part-1016), [NCUA Part 748](https://www.ecfr.gov/current/title-12/part-748) information-security and incident-response guidelines, FCRA/Reg V (including [NCUA Part 717](https://www.ecfr.gov/current/title-12/part-717)), the [FACTA Disposal Rule (16 CFR Part 682)](https://www.ecfr.gov/current/title-16/part-682), the [Right to Financial Privacy Act (12 USC §3401 et seq.)](https://www.law.cornell.edu/uscode/text/12/chapter-35), [E-SIGN (15 USC §7001)](https://www.law.cornell.edu/uscode/text/15/7001), [COPPA (16 CFR Part 312)](https://www.ecfr.gov/current/title-16/part-312), and applicable U.S. state privacy laws where they touch non-GLBA data such as marketing telemetry. Privacy risk concentrates wherever NPPI is created, shared with third parties, accessed by members or staff, or disposed of, and at the boundary where non-GLBA data triggers stricter state-law obligations; the controls below operationalize the full GLBA notice lifecycle, enforce member choices, restrict and document permissible disclosures, and integrate privacy into incident response.

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Initial privacy notice | Member relationship established (`entity.created`) | At or before establishment | Current GLBA model notice | [PV-01](#pv-01-privacy-notice-lifecycle) |
| Annual privacy notice | 12 months since last notice (`privacy.annual_notice_due`) | Every 12 months unless exempt | Current GLBA model notice | [PV-01](#pv-01-privacy-notice-lifecycle) |
| Revised privacy notice | Material change in sharing approved (`privacy.notice_revised`) | Before the change takes effect | Revised notice + new opt-out window | [PV-01](#pv-01-privacy-notice-lifecycle) |
| Opt-out suppression | Member submits opt-out (`privacy.optout_received`) | Immediate internal suppression | Suppression flag on member profile | [PV-02](#pv-02-opt-out-capture-and-honoring) |
| Opt-out vendor propagation | Suppression flag set (`privacy.optout_enforced`) | 30 days (program standard) | Vendor suppression confirmations | [PV-02](#pv-02-opt-out-capture-and-honoring) |
| Policy/notice copy request | Member requests a copy (`privacy.notice_copy_requested`) | 10 days | Current notice via requested channel | [PV-04](#pv-04-customer-access-and-authentication), [PV-11](#pv-11-website-posting-and-e-sign-delivery) |
| Bureau-reported correction | Master-data correction confirmed (`entity.updated`) | 30 days to propagate | Corrected record + bureau update | [PV-05](#pv-05-data-accuracy-and-corrections) |
| Access revocation on termination | Employee terminated (`employee.terminated`) | 24 hours | Access revocation record | [PV-06](#pv-06-employee-access-minimization-and-training) |
| Quarterly access review | Quarter end (`privacy.access_review_due`) | Quarterly | Access review attestation | [PV-06](#pv-06-employee-access-minimization-and-training) |
| Secure disposal | Retention period expires (`record.retention_expired`) | 90 days (legal holds pause) | Certificate of destruction | [PV-08](#pv-08-secure-disposal-of-nppi) |
| Breach notification | Incident classified as notifiable (`incident.classified`) | Without unreasonable delay per state clocks | Member + regulator notifications | [PV-09](#pv-09-incident-response-and-breach-notification) |
| Board privacy report | Annual cycle or material incident (`privacy.board_report_due`) | At least annually; ad hoc for material incidents | Board privacy report | [PV-10](#pv-10-recordkeeping-complaints-and-board-reporting) |
| CA "Do Not Sell/Share" / GPC | Signal or request received (`privacy.state_request_received`) | Per CPRA clocks (15 business days for opt-out) | State-request disposition record | [PV-12](#pv-12-state-variants-ca-cpra-vermont-nevada) |
| Minor data deletion | Under-13 data discovered (`privacy.minor_data_detected`) | Promptly on discovery | Deletion record | [PV-17](#pv-17-childrens-data) |

## PV-01 — Privacy Notice Lifecycle {#pv-01-privacy-notice-lifecycle}

- **WHY (Reg cite):** Reg P requires an initial notice at or before establishing the customer relationship ([§1016.4](https://www.ecfr.gov/current/title-12/part-1016/section-1016.4)), an annual notice every 12 months unless exempt ([§1016.5](https://www.ecfr.gov/current/title-12/part-1016/section-1016.5)), and a revised notice before any material change in sharing practices ([§1016.8](https://www.ecfr.gov/current/title-12/part-1016/section-1016.8)), delivered so the member can reasonably be expected to receive it ([§1016.9](https://www.ecfr.gov/current/title-12/part-1016/section-1016.9)).
- **SYSTEM BEHAVIOR:** The notice engine delivers the initial notice at or before relationship establishment, schedules annual notices on a rolling 12-month clock, and gates any approved material change in sharing behind delivery of a revised notice with a fresh opt-out window. Every delivery records the channel, timestamp, and template ID. Non-exception sharing (anything outside §1016.13–§1016.15) is blocked system-wide until the governing notice is delivered. Pynthia qualifies for the annual-notice exemption only while it shares solely under the exceptions and its notice is unchanged; the engine re-evaluates exemption status whenever the notice template changes. Notice templates are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Member relationship established (`entity.created`) | Member identity (`entity.id`), contact channel (`entity.contact_preference`), notice template (`privacy.notice_template_id`) | Initial notice delivered with channel/timestamp/template recorded (`privacy.notice_delivered`) | At or before establishment |
  | Annual notice clock matures (`privacy.annual_notice_due`) | Member roster (`entity.id`), exemption status (`privacy.annual_exemption_status`), current template (`privacy.notice_template_id`) | Annual notice delivered or exemption recorded (`privacy.notice_delivered`) | 12 months from prior notice (enforced by `privacy.annual_notice_due_at`) |
  | Material sharing change approved (`privacy.notice_revised`) | Revised template (`privacy.notice_template_id`), change description (`privacy.sharing_change_basis`), affected member set (`entity.id`) | Revised notice delivered; new sharing blocked until delivery (`privacy.notice_delivered`, `privacy.sharing_blocked`) | Before the change takes effect |

- **ALERTS/METRICS:** Aging alert on any member past the annual-notice due date (target zero); count of sharing attempts blocked pending notice delivery; delivery failure rate by channel reviewed monthly.

## PV-02 — Opt-Out Capture & Honoring {#pv-02-opt-out-capture-and-honoring}

- **WHY (Reg cite):** Reg P [§1016.7](https://www.ecfr.gov/current/title-12/part-1016/section-1016.7) requires reasonable means to opt out of nonaffiliate sharing and requires the institution to comply with an opt-out direction as soon as reasonably practicable, with the direction effective until revoked.
- **SYSTEM BEHAVIOR:** Members can opt out through at least two channels (online preference center and phone/branch). Receipt of an opt-out sets a suppression flag on the member profile immediately, which the sharing gateway enforces on every outbound nonaffiliate marketing disclosure. Opt-outs propagate to martech vendors within 30 days (program standard) and remain effective indefinitely until the member revokes in writing or electronically. Joint account opt-outs by any accountholder suppress sharing for the whole account. Suppression flags are write-restricted to Privacy Operations and the automated capture pipeline.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Member submits opt-out via any channel (`privacy.optout_received`) | Member identity (`entity.id`), channel (`privacy.optout_channel`), scope of election (`privacy.optout_scope`) | Suppression flag set on profile (`privacy.optout_enforced`) | Immediate (internal: same business day) |
  | Suppression flag set (`privacy.optout_enforced`) | Vendor list (`vendor.id[]`), member suppression record (`privacy.optout_scope`) | Vendor suppression confirmations (`privacy.optout_propagated`) | 30 days (enforced by `privacy.optout_propagation_due_at`) |
  | Member revokes opt-out (`privacy.optout_revoked`) | Written/electronic revocation artifact (`privacy.revocation_artifact_id`), member identity (`entity.id`) | Suppression flag cleared with revocation evidence (`privacy.optout_cleared`) | — |

- **ALERTS/METRICS:** Zero tolerance for disclosures to a suppressed member (gateway block count reviewed weekly); vendor propagation aging alert at 25 days; opt-out capture-to-enforcement latency distribution (target same business day).

## PV-03 — Permissible Disclosures & Exceptions {#pv-03-permissible-disclosures-and-exceptions}

- **WHY (Reg cite):** Reg P permits sharing without opt-out only under the service-provider/joint-marketing exception ([§1016.13](https://www.ecfr.gov/current/title-12/part-1016/section-1016.13)), the processing-and-servicing exception ([§1016.14](https://www.ecfr.gov/current/title-12/part-1016/section-1016.14)), and the legal/protective exceptions ([§1016.15](https://www.ecfr.gov/current/title-12/part-1016/section-1016.15)); §1016.13 conditions the exception on a contract limiting the recipient's use and disclosure.
- **SYSTEM BEHAVIOR:** Every disclosure of NPPI to a third party is tagged at initiation with its legal basis (§1016.13, §1016.14, §1016.15, or member-consented), and the sharing gateway rejects untagged disclosures. For §1016.13 disclosures, the gateway verifies an executed GLBA confidentiality clause exists in the vendor contract record before the first transfer. Legal-process disclosures (subpoenas, court orders) route through Legal, which applies RFPA member-notice procedures where the requester is a federal government authority; member-initiated access is governed by [PV-04](#pv-04-customer-access-and-authentication). Disclosure-basis tags are write-restricted to Privacy Operations and Legal.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Outbound NPPI disclosure initiated (`disclosure.initiated`) | Recipient (`vendor.id`), data categories (`disclosure.data_categories[]`), legal basis (`disclosure.legal_basis`) | Basis-tagged disclosure record (`disclosure.recorded`) | Before transmission |
  | §1016.13 sharing requested for a new vendor (`disclosure.vendor_basis_check`) | Vendor contract record (`vendor.contract_id`), GLBA clause attestation (`vendor.glba_clause_verified`) | Gateway approval or block (`disclosure.basis_approved` / `disclosure.basis_blocked`) | Before first transfer |
  | Legal process received (`legal.process_received`) | Process document (`legal.process_artifact_id`), member identity (`entity.id`), RFPA applicability (`legal.rfpa_applicable`) | Legal-reviewed disclosure with RFPA notice/certification where required (`disclosure.legal_basis_recorded`) | Per the instrument's return date |

- **ALERTS/METRICS:** Count of gateway blocks for missing basis tag or missing GLBA clause (each block investigated within 2 business days); quarterly reconciliation of the disclosure log against vendor contract records (target zero unmatched disclosures).

## PV-04 — Customer Access & Authentication {#pv-04-customer-access-and-authentication}

- **WHY (Reg cite):** NCUA [Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires safeguards against unauthorized access to member information; Reg P [§1016.9](https://www.ecfr.gov/current/title-12/part-1016/section-1016.9) governs delivery of notices on request; and the [RFPA (12 USC §3401 et seq.)](https://www.law.cornell.edu/uscode/text/12/chapter-35) restricts disclosure of financial records to government authorities without proper process.
- **SYSTEM BEHAVIOR:** Before disclosing member information in person, by phone, or online, staff and systems verify identity using channel-appropriate authentication (government ID in person, knowledge/possession factors by phone, credentialed session online). Agents acting under a power of attorney must present the instrument, which Legal validates before any disclosure. Failed authentication results in refusal of disclosure and an attempt record; repeated failures route to fraud review. Requests for a copy of this policy or the privacy notice are fulfilled within 10 days. Authentication-rule configuration is write-restricted to Information Security.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Member information requested in any channel (`access.request_received`) | Requester identity claims (`access.identity_factors[]`), channel (`access.channel`), account linkage (`entity.id`) | Authentication pass/fail decision (`access.authenticated` / `access.refused`) | Before any disclosure |
  | Agent presents power of attorney (`access.poa_presented`) | POA instrument (`access.poa_artifact_id`), agent identity (`access.agent_identity`), principal (`entity.id`) | Legal validation outcome (`access.poa_validated` / `access.poa_rejected`) | Before any disclosure |
  | Member requests policy/notice copy (`privacy.notice_copy_requested`) | Member contact (`entity.contact_preference`), current template (`privacy.notice_template_id`) | Copy delivered via requested channel (`privacy.notice_copy_delivered`) | 10 days (enforced by `privacy.notice_copy_due_at`) |

- **ALERTS/METRICS:** Failed-authentication rate by channel with anomaly alerting; zero disclosures recorded after a failed authentication (reconciled monthly); notice-copy fulfillment aging alert at 7 days.

## PV-05 — Data Accuracy & Corrections {#pv-05-data-accuracy-and-corrections}

- **WHY (Reg cite):** FCRA/[Reg V (12 CFR Part 1022)](https://www.ecfr.gov/current/title-12/part-1022) requires furnishers to maintain accuracy and integrity of consumer information furnished to bureaus; [NCUA Part 717](https://www.ecfr.gov/current/title-12/part-717) implements the Red Flags and address-discrepancy rules for credit unions; [NCUA Part 748](https://www.ecfr.gov/current/title-12/part-748) requires safeguarding the integrity of member records.
- **SYSTEM BEHAVIOR:** Confirmed corrections to master member data (name, address, SSN, contact details) propagate automatically to all downstream systems, and for bureau-reported items the correction is furnished to each bureau and prior recipient where applicable within 30 days. USPS/NCOA address mismatches and address discrepancies on bureau pulls route through the Red Flags identity-theft program before the address of record changes. Master-data correction authority is write-restricted to designated Member Services roles with dual control on SSN changes.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Master-data correction confirmed (`entity.updated`) | Corrected fields with prior values (`entity.changed_fields[]`, `previous_data`), correction evidence (`correction.evidence_artifact_id`) | Propagation to all systems and bureau/prior-recipient updates (`correction.propagated`) | 30 days for bureau-reported items (enforced by `correction.propagation_due_at`) |
  | USPS/NCOA mismatch detected (`address.ncoa_mismatch_detected`) | Reported vs. on-file address (`entity.address`, `address.ncoa_candidate`), member identity (`entity.id`) | Red Flags case opened; address change held pending resolution (`redflags.case_opened`) | Before the address of record changes |
  | Bureau address discrepancy notice received (`bureau.address_discrepancy_received`) | Bureau notice (`bureau.discrepancy_artifact_id`), member identity (`entity.id`) | Reasonable-belief determination and confirmed address furnished (`bureau.address_confirmed`) | Next regular furnishing cycle |

- **ALERTS/METRICS:** Bureau-correction aging alert at 25 days (target zero past 30); count of Red Flags cases opened from address mismatches and their resolution latency; monthly reconciliation of master-data changes against propagation confirmations.

## PV-06 — Employee Access Minimization & Training {#pv-06-employee-access-minimization-and-training}

- **WHY (Reg cite):** NCUA [Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires access controls on member information systems, restriction of access to those with a need to know, and staff training to implement the security program.
- **SYSTEM BEHAVIOR:** Access to NPPI is granted through least-privilege role-based access control mapped to job function; standing access outside an employee's role requires documented Compliance approval with an expiry. Quarterly access reviews recertify every NPPI-scoped role assignment, and terminations revoke all access within 24 hours. All staff complete privacy training at onboarding and annually thereafter; failure to complete training within the grace period suspends NPPI access. RBAC role definitions are write-restricted to Information Security with Compliance sign-off.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | NPPI access requested (`access.role_requested`) | Employee identity (`employee.id`), role and justification (`access.role_id`, `access.justification`) | Approved least-privilege grant or denial (`access.role_granted` / `access.role_denied`) | Before access is provisioned |
  | Quarter end (`privacy.access_review_due`) | Current role assignments (`access.role_assignments[]`), manager attestations (`access.review_attestation`) | Recertification or revocation per role (`access.review_completed`) | Quarterly (enforced by `privacy.access_review_due_at`) |
  | Employee terminated (`employee.terminated`) | Employee identity (`employee.id`), provisioned access inventory (`access.role_assignments[]`) | All access revoked with revocation record (`access.revoked`) | 24 hours (enforced by `access.revocation_due_at`) |
  | Training cycle due (`training.privacy_due`) | Staff roster (`employee.id`), assigned curriculum (`training.curriculum_id`) | Completion record or access suspension (`training.completed` / `access.suspended`) | Onboarding + annually |

- **ALERTS/METRICS:** Revocations exceeding 24 hours alert Information Security and Compliance immediately (target zero); quarterly review completion rate (target 100%); training delinquency count with auto-suspension confirmations.

## PV-07 — Third-Party Oversight & Contracts {#pv-07-third-party-oversight-and-contracts}

- **WHY (Reg cite):** Reg P [§1016.13](https://www.ecfr.gov/current/title-12/part-1016/section-1016.13) conditions the service-provider exception on a contract restricting the recipient's use of NPPI; NCUA [Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires oversight of service-provider arrangements, including due diligence and contractual security requirements.
- **SYSTEM BEHAVIOR:** Before the first NPPI transfer to any vendor, Privacy Operations confirms completed due diligence, an executed GLBA addendum, a current data map describing what NPPI flows where, and flow-down of obligations to subprocessors; the sharing gateway blocks transfers to vendors missing any artifact. Each vendor is re-reviewed annually with continuous monitoring of breach disclosures and SOC-report exceptions between reviews. Detailed vendor lifecycle risk management beyond these privacy-specific gates is governed by the Third-Party Risk Policy. Vendor privacy-artifact records are write-restricted to Privacy Operations.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | New vendor proposed for NPPI access (`vendor.privacy_review_requested`) | Due-diligence package (`vendor.due_diligence_artifact_id`), GLBA addendum (`vendor.glba_addendum_id`), data map (`vendor.data_map_id`), subprocessor flow-downs (`vendor.subprocessor_attestation`) | Privacy approval gating first transfer (`vendor.privacy_approved` / `vendor.privacy_blocked`) | Before first data transfer |
  | Annual review clock matures (`vendor.annual_review_due`) | Updated artifacts (`vendor.data_map_id`, `vendor.glba_addendum_id`), monitoring findings (`vendor.monitoring_findings[]`) | Renewed approval or remediation plan (`vendor.review_completed`) | Annually (enforced by `vendor.annual_review_due_at`) |
  | Monitoring signal received (`vendor.monitoring_alert`) | Signal details (`vendor.monitoring_findings[]`), affected data map (`vendor.data_map_id`) | Risk disposition; transfer suspension if warranted (`vendor.risk_dispositioned`) | 10 business days |

- **ALERTS/METRICS:** Zero transfers to vendors without complete privacy artifacts (gateway block count reviewed weekly); annual-review aging alert at 30 days before due; open vendor remediation items tracked to closure.

## PV-08 — Secure Disposal of NPPI {#pv-08-secure-disposal-of-nppi}

- **WHY (Reg cite):** The FACTA Disposal Rule ([16 CFR Part 682](https://www.ecfr.gov/current/title-16/part-682)) requires reasonable measures to protect against unauthorized access to consumer report information in connection with its disposal; NCUA [Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires proper disposal of member information.
- **SYSTEM BEHAVIOR:** When a record's retention period expires under the Record Retention Policy schedule, paper, media, and electronic data containing NPPI are destroyed by certified methods (cross-cut shredding, media degaussing/physical destruction, cryptographic erasure) within 90 days, and a certificate of destruction is retained for each disposal batch. An active legal hold pauses the disposal clock for the held records until the hold is released. Disposal-batch approval is write-restricted to Privacy Operations; legal-hold flags are write-restricted to Legal.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Retention period expires (`record.retention_expired`) | Record inventory (`record.id[]`), media type (`record.media_type`), legal-hold status (`record.legal_hold_flag`) | Disposal batch scheduled or hold-paused (`disposal.scheduled` / `disposal.held`) | 90 days (enforced by `disposal.due_at`; legal holds pause) |
  | Disposal executed by certified vendor or internal process (`disposal.executed`) | Batch manifest (`disposal.batch_manifest_id`), destruction method (`disposal.method`) | Certificate of destruction retained (`disposal.certificate_recorded`) | At completion of destruction |
  | Legal hold released (`legal.hold_released`) | Held record set (`record.id[]`), release authorization (`legal.hold_release_id`) | Disposal clock resumed (`disposal.clock_resumed`) | — |

- **ALERTS/METRICS:** Aging alert on expired records not disposed at 75 days; 100% of disposal batches matched to a certificate of destruction (reconciled quarterly); count of records under legal hold reviewed monthly for stale holds.

## PV-09 — Incident Response & Breach Notification {#pv-09-incident-response-and-breach-notification}

- **WHY (Reg cite):** NCUA [Part 748 Appendix B](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20B%20to%20Part%20748) requires a response program for unauthorized access to member information, including member notice when misuse has occurred or is reasonably possible; state breach-notification laws set jurisdiction-specific notification clocks; the [RFPA](https://www.law.cornell.edu/uscode/text/12/chapter-35) governs related government information requests.
- **SYSTEM BEHAVIOR:** Suspected privacy incidents are detected, contained, and classified by Information Security with Privacy Operations and Legal embedded in the incident-response runbook from triage onward. Classification determines whether member and regulator notification is required; notifications issue without unreasonable delay and within the shortest applicable state clock for the affected population. Where the incident involves suspected criminal activity, the BSA/AML Officer evaluates SAR filing under the BSA Policy. Detailed security-program containment controls live in the Information Security Policy. Incident-classification decisions are write-restricted to the incident commander with Compliance concurrence.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Suspected privacy incident detected (`incident.detected`) | Incident details (`incident.id`, `incident.description`), affected data scope (`incident.data_scope`) | Containment actions + incident record (`incident.contained`) | Immediately upon detection |
  | Incident classified (`incident.classified`) | Affected member set (`entity.id[]`), jurisdictions (`incident.jurisdictions[]`), misuse assessment (`incident.misuse_likelihood`) | Notification determination (`incident.notification_determined`) | Without unreasonable delay |
  | Notification required (`incident.notification_determined`) | Notification templates (`incident.notice_template_id`), member contacts (`entity.contact_preference`), regulator list (`incident.regulator_list[]`) | Member + NCUA/state regulator notifications sent (`incident.notifications_sent`) | Shortest applicable state clock (enforced by `incident.notification_due_at`) |
  | Criminal activity suspected (`incident.criminal_suspected`) | Incident facts (`incident.id`), BSA referral package (`incident.bsa_referral_id`) | SAR evaluation referred to BSA Officer (`incident.sar_referred`) | Per BSA Policy timelines |

- **ALERTS/METRICS:** Detection-to-containment and classification-to-notification latency distributions reviewed after every incident; zero notifications past the applicable state clock; annual tabletop exercise completion with Privacy and Legal participation.

## PV-10 — Recordkeeping, Complaints & Board Reporting {#pv-10-recordkeeping-complaints-and-board-reporting}

- **WHY (Reg cite):** NCUA [Part 748](https://www.ecfr.gov/current/title-12/part-748) requires board oversight of the security program, including approval and annual reporting on its status; centralized records evidence compliance with [Reg P](https://www.ecfr.gov/current/title-12/part-1016) notice and opt-out obligations.
- **SYSTEM BEHAVIOR:** Privacy Operations maintains a centralized privacy record store containing complaint logs, notice-delivery records, opt-out elections, disclosure logs, training completions, disposal certificates, and program metrics. Privacy complaints from any intake channel are logged, triaged, and tracked to resolution. The CCO reports program status, metrics, material complaints, and incidents to the Board at least annually, and ad hoc for material incidents. The privacy record store is append-only; deletion is write-restricted to Privacy Operations under the retention schedule.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Privacy complaint received (`complaint.privacy_received`) | Complaint details (`complaint.id`, `complaint.category`), member identity (`entity.id`) | Triaged complaint record tracked to resolution (`complaint.resolved`) | Resolution within 30 days (internal standard) |
  | Annual Board reporting cycle (`privacy.board_report_due`) | Program metrics (`privacy.metrics_package_id`), complaint and incident summaries (`complaint.summary_id`, `incident.summary_id`) | Board privacy report with minutes reference (`privacy.board_report_delivered`) | Annually (enforced by `privacy.board_report_due_at`) |
  | Material incident occurs (`incident.material_flagged`) | Incident record (`incident.id`), impact assessment (`incident.impact_summary`) | Ad hoc Board briefing (`privacy.board_adhoc_delivered`) | Next Board meeting or sooner |

- **ALERTS/METRICS:** Complaint aging alert at 20 days; complaint volume and category trends reported quarterly; Board-report delivery tracked against the annual deadline (target zero misses).

## PV-11 — Website Posting & E-SIGN Delivery {#pv-11-website-posting-and-e-sign-delivery}

- **WHY (Reg cite):** Reg P [§1016.9](https://www.ecfr.gov/current/title-12/part-1016/section-1016.9) permits electronic notice delivery where the member agrees and requires that members can obtain notices on request; [E-SIGN (15 USC §7001)](https://www.law.cornell.edu/uscode/text/15/7001) conditions electronic delivery of required disclosures on demonstrable consumer consent.
- **SYSTEM BEHAVIOR:** The current privacy notice is hosted on the public website in an ADA-accessible format (WCAG-conformant HTML with an accessible PDF alternative) and updated within one business day of any approved template change. Members electing electronic delivery complete the E-SIGN consent flow, and the consent artifact — including the demonstrable-access confirmation — is captured and retained for the life of the relationship plus the retention period. Requests for a paper or electronic copy of the notice are fulfilled within 10 days. Website notice content is write-restricted to Compliance via the publication pipeline.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Notice template approved for publication (`privacy.notice_template_published`) | Approved template (`privacy.notice_template_id`), accessibility validation (`privacy.ada_validation_id`) | Accessible notice live on website (`privacy.website_notice_updated`) | 1 business day |
  | Member elects electronic delivery (`privacy.esign_consent_started`) | Member identity (`entity.id`), demonstrable-access confirmation (`privacy.esign_access_confirmation`) | E-consent artifact retained (`privacy.esign_consent_recorded`) | Before first electronic-only delivery |
  | Member requests notice copy (`privacy.notice_copy_requested`) | Requested channel (`entity.contact_preference`), current template (`privacy.notice_template_id`) | Copy fulfilled (`privacy.notice_copy_delivered`) | 10 days (enforced by `privacy.notice_copy_due_at`) |

- **ALERTS/METRICS:** Automated accessibility scan on every notice publication (target zero WCAG failures); e-consent capture completeness audited quarterly; copy-request fulfillment aging alert at 7 days.

## PV-12 — State Variants (CA/CPRA, Vermont, Nevada) {#pv-12-state-variants-ca-cpra-vermont-nevada}

- **WHY (Reg cite):** GLBA-covered NPPI is generally exempt from state consumer-privacy statutes, but non-GLBA data (marketing telemetry, website analytics) remains subject to the [CCPA/CPRA (Cal. Civ. Code §1798.100 et seq.)](https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?division=3.&part=4.&lawCode=CIV&title=1.81.5), Vermont's opt-in sharing regime, and Nevada's sale opt-out ([NRS 603A](https://www.leg.state.nv.us/NRS/NRS-603A.html)); Reg P [§1016.17](https://www.ecfr.gov/current/title-12/part-1016/section-1016.17) preserves stricter state protections.
- **SYSTEM BEHAVIOR:** Every member and consumer record carries a jurisdiction tag, and data inventories separate GLBA NPPI from non-GLBA telemetry so state obligations apply only to the non-GLBA set. For California users, the system honors "Do Not Sell/Share" requests and Global Privacy Control (GPC) signals against non-GLBA data within CPRA clocks; Vermont members require opt-in before nonaffiliate marketing sharing of covered data; Nevada residents' sale opt-outs are recorded and enforced. State-request dispositions are write-restricted to Privacy Operations.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | State privacy request or GPC signal received (`privacy.state_request_received`) | Jurisdiction tag (`entity.jurisdiction`), request type (`privacy.state_request_type`), GLBA/non-GLBA data split (`privacy.data_classification`) | Disposition applied to non-GLBA data only (`privacy.state_request_fulfilled`) | CPRA: 15 business days for opt-out (enforced by `privacy.state_request_due_at`) |
  | Vermont member nonaffiliate marketing share proposed (`disclosure.vt_optin_check`) | Member jurisdiction (`entity.jurisdiction`), opt-in election (`privacy.vt_optin_status`) | Share allowed only with recorded opt-in (`disclosure.vt_optin_enforced`) | Before disclosure |
  | Nevada sale opt-out received (`privacy.nv_optout_received`) | Member identity (`entity.id`), verification result (`access.authenticated`) | Sale suppression recorded (`privacy.nv_optout_enforced`) | 60 days per NRS 603A |

- **ALERTS/METRICS:** GPC signal honor rate (target 100%, sampled monthly); state-request aging alerts at 80% of each statutory clock; quarterly audit that no GLBA NPPI was processed under a state-request disposition.

## PV-13 — Anonymization & Aggregation {#pv-13-anonymization-and-aggregation}

- **WHY (Reg cite):** Reg P's definition of NPPI ([§1016.3(p)–(q)](https://www.ecfr.gov/current/title-12/part-1016/section-1016.3)) excludes information that does not identify a consumer, such as aggregate information or blind data without personal identifiers — making documented de-identification the condition for analytics use outside GLBA sharing limits.
- **SYSTEM BEHAVIOR:** Analytics and R&D uses of member data are permitted only on datasets that pass a documented de-identification or aggregation procedure; re-identification is prohibited by policy and by contract for any external recipient. Small-cohort suppression thresholds apply to aggregate outputs so cells below the minimum count are suppressed or coarsened. Privacy Operations reviews de-identification methods annually against current re-identification risk. Approval of de-identification procedures is write-restricted to Privacy Operations.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Analytics dataset requested (`analytics.dataset_requested`) | Source data scope (`analytics.source_scope`), de-identification method (`analytics.deid_method_id`), cohort thresholds (`analytics.cohort_threshold`) | Approved de-identified dataset with method record (`analytics.dataset_approved`) | Before analytics use |
  | Annual method review clock matures (`analytics.method_review_due`) | Current methods inventory (`analytics.deid_method_id[]`), re-identification risk assessment (`analytics.reid_risk_assessment`) | Renewed or revoked method approvals (`analytics.method_review_completed`) | Annually (enforced by `analytics.method_review_due_at`) |

- **ALERTS/METRICS:** Zero analytics datasets released without an approved method record (reconciled quarterly); count of small-cohort suppressions applied; annual method review completion on schedule.

## PV-14 — Cookies & Online Tracking (non-GLBA) {#pv-14-cookies-and-online-tracking-non-glba}

- **WHY (Reg cite):** Online tracking telemetry falls outside GLBA NPPI and is governed by state law — the [CPRA](https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?division=3.&part=4.&lawCode=CIV&title=1.81.5) requires honoring opt-out preference signals such as GPC for the sale or sharing of personal information collected online.
- **SYSTEM BEHAVIOR:** The website and mobile properties operate a cookie banner and preference center; non-essential tags (analytics, advertising) are blocked until consent is recorded where jurisdictionally required, while strictly necessary cookies always load. Universal opt-out signals (GPC) are honored automatically for California users and treated as a valid opt-out of sale/sharing for non-GLBA data, coordinating with the suppression records in [PV-12](#pv-12-state-variants-ca-cpra-vermont-nevada). Tag-manager configuration is write-restricted to Information Security with Privacy Operations approval for any new tracking tag.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Visitor session starts (`web.session_started`) | Jurisdiction inference (`web.visitor_jurisdiction`), consent state (`web.consent_state`), GPC header (`web.gpc_signal`) | Tag-loading decision per category (`web.tags_gated`) | Before non-essential tags fire |
  | Visitor sets preferences (`web.consent_updated`) | Selected categories (`web.consent_categories[]`), session/visitor identifier (`web.visitor_id`) | Consent record retained; tags reconfigured (`web.consent_recorded`) | Immediate |
  | New tracking tag proposed (`web.tag_review_requested`) | Tag purpose and vendor (`web.tag_vendor_id`), data collected (`web.tag_data_scope`) | Privacy approval before deployment (`web.tag_approved` / `web.tag_rejected`) | Before deployment |

- **ALERTS/METRICS:** Automated scan for tags firing before consent (target zero violations, scanned weekly); GPC honor rate sampled monthly; inventory drift between approved tags and tags observed in production.

## PV-15 — Third-Party App/Account Connections {#pv-15-third-party-appaccount-connections}

- **WHY (Reg cite):** Member-authorized data sharing is a disclosure with member consent under Reg P ([§1016.15(a)(1)](https://www.ecfr.gov/current/title-12/part-1016/section-1016.15)), and NCUA [Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires access controls over systems that expose member information.
- **SYSTEM BEHAVIOR:** Member-authorized API connections (data aggregators, third-party apps) are established only through a consent flow that displays the specific data scopes requested; issued tokens are purpose-limited to the consented scopes and expire on a defined schedule. Members have an immediate in-app revoke path that invalidates tokens in real time. Reuse of connection data beyond the consented scope is prohibited and enforced contractually with the connecting party. Token-scope definitions are write-restricted to Information Security.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Member authorizes a connection (`connection.consent_granted`) | Member identity (`entity.id`), requested scopes (`connection.scopes[]`), connecting party (`connection.party_id`) | Purpose-limited token issued with consent artifact (`connection.token_issued`) | At consent |
  | Member revokes a connection (`connection.revoke_requested`) | Connection identifier (`connection.id`), member authentication (`access.authenticated`) | Token invalidated in real time (`connection.token_revoked`) | Immediate |
  | Token scope violation detected (`connection.scope_violation_detected`) | Access pattern (`connection.access_log_id`), consented scopes (`connection.scopes[]`) | Token suspension + party escalation (`connection.suspended`) | Same business day |

- **ALERTS/METRICS:** Revocation latency distribution (target real-time, alert above 5 minutes); scope-violation detections trended monthly (target zero); stale-token count past expiry reviewed weekly.

## PV-16 — Biometric Data for KYC {#pv-16-biometric-data-for-kyc}

- **WHY (Reg cite):** Biometric identifiers used in identity verification are sensitive member information safeguarded under NCUA [Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748), and state biometric statutes such as the [Illinois Biometric Information Privacy Act (740 ILCS 14)](https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=3004) impose consent, retention, and destruction requirements.
- **SYSTEM BEHAVIOR:** Vendor face-match and liveness checks for KYC are permitted only under explicit contractual limits: vendor-side storage is preferred over local retention, vendor reuse of biometric data for model training or any other purpose is prohibited, and biometric artifacts are purged per the strictest applicable state biometric law. Members are offered a non-biometric verification path where feasible (e.g., document-plus-knowledge verification). Biometric-vendor contract terms are write-restricted to Legal and Privacy Operations.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Biometric KYC check initiated (`verification.biometric_started`) | Member consent (`verification.biometric_consent_id`), vendor (`verification.provider`), verification record (`verification.id`) | Verification result with vendor-side storage attestation (`verification.biometric_completed`) | At verification |
  | Member declines biometric path (`verification.biometric_declined`) | Member identity (`entity.id`), alternative method availability (`verification.alt_path_available`) | Non-biometric verification routed (`verification.alt_path_started`) | At verification |
  | Biometric retention clock matures (`verification.biometric_purge_due`) | Stored artifacts inventory (`verification.biometric_artifact_id[]`), applicable state law (`entity.jurisdiction`) | Purge confirmation from vendor and local systems (`verification.biometric_purged`) | Per strictest applicable state clock (enforced by `verification.biometric_purge_due_at`) |

- **ALERTS/METRICS:** Purge-confirmation completeness audited quarterly (target 100% matched); count of members routed to the non-biometric path; vendor attestation of no model reuse reviewed at each annual vendor review.

## PV-17 — Children's Data {#pv-17-childrens-data}

- **WHY (Reg cite):** [COPPA (16 CFR Part 312)](https://www.ecfr.gov/current/title-16/part-312) prohibits collecting personal information online from children under 13 without verifiable parental consent and requires deletion of improperly collected data.
- **SYSTEM BEHAVIOR:** Pynthia's online services are not directed to children under 13; digital onboarding applies an age gate, and custodial/minor accounts are opened only through an adult custodian in branch-supervised flows. If data from an under-13 user is discovered to have been collected online without valid parental consent, it is promptly deleted and the collection vector is remediated. Age-gate configuration is write-restricted to Information Security with Compliance approval.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Digital onboarding started (`entity.created`) | Declared date of birth (`entity.date_of_birth`), age-gate rule set (`privacy.age_gate_ruleset_id`) | Under-13 attempts blocked (`privacy.age_gate_blocked`) | At onboarding |
  | Under-13 data discovered (`privacy.minor_data_detected`) | Affected records (`record.id[]`), collection vector (`privacy.collection_vector`) | Deletion record + vector remediation (`privacy.minor_data_deleted`) | Promptly on discovery (internal: 5 business days) |

- **ALERTS/METRICS:** Age-gate block count trended monthly; zero open minor-data deletion items past 5 business days; annual review of online properties for child-directed content drift.

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for this policy, its controls, and the privacy program, jointly coordinating incident and SAR matters with the BSA/AML Officer.
- **Required participants:** Privacy Operations, Legal, Information Security/IT, and the business owners of each product channel participate in control operation as described in each overlay.
- **Approvals:** Patrick Wilson, Chief Compliance Officer. Material changes to sharing practices, notice templates, or control design require CCO approval before the change takes effect (see [PV-01](#pv-01-privacy-notice-lifecycle)).
- **Review cadence:** Full policy review at least every 12 months (next review per front-matter), and ad hoc upon material regulatory change, material incident, or new product/channel touching NPPI.
- **Cross-references:** Information Security Policy (detailed safeguards and security-program controls); Third-Party Risk Policy (vendor lifecycle beyond privacy-specific gates); Record Retention Policy (retention schedules feeding [PV-08](#pv-08-secure-disposal-of-nppi)); BSA Policy (SAR mechanics referenced in [PV-09](#pv-09-incident-response-and-breach-notification)); Member Policy (account servicing and non-privacy disclosures); E-Commerce Policy (electronic delivery channel mechanics supporting [PV-11](#pv-11-website-posting-and-e-sign-delivery)).

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** The parsed engineering spec (`vocabulary.json`, Cassandra Banking Core API v1.0.0) is banking-core only and defines zero events. Apart from registered entities and fields such as `entity.id`, `entity.created`, `entity.updated`, `verification.id`, `verification.provider`, and `previous_data`, the privacy-domain codes used throughout the EVENTS tables (the `privacy.*`, `disclosure.*`, `access.*`, `vendor.*`, `disposal.*`, `incident.*`, `complaint.*`, `analytics.*`, `web.*`, `connection.*`, `training.*`, `correction.*`, `record.*`, `legal.*`, `bureau.*`, `address.*`, `redflags.*`, `employee.*` families and the biometric `verification.*` extensions) are the target naming scheme and will be confirmed and registered by engineering before the next review.
- **Annual-notice exemption status is assumed but unconfirmed.** PV-01 assumes Pynthia may qualify for the Reg P §1016.5(e) annual-notice exemption while sharing only under the exceptions; Compliance must confirm actual sharing practices against the exemption conditions.
- **The 30-day martech opt-out propagation window is a program standard,** not a regulatory deadline; Reg P requires compliance "as soon as reasonably practicable." The 30-day figure comes from program notes and should be confirmed against vendor contract SLAs.
- **State-law scope is limited to California, Vermont, and Nevada** per program notes. Other state privacy statutes generally exempt GLBA-regulated entities or data, but their applicability to Pynthia's non-GLBA telemetry should be re-assessed annually as laws change.
- **CPRA clocks in PV-12** assume the 15-business-day opt-out compliance window; access/deletion requests on non-GLBA data, if any arise, carry the separate 45-day CPRA response clock not separately controlled here because volume is expected to be negligible — confirm with Privacy Operations.
- **Biometric purge timing in PV-16** applies "the strictest applicable state clock"; the operative jurisdictions for Pynthia's membership footprint (e.g., whether Illinois BIPA, Texas CUBI, or Washington's biometric statute apply) need Legal confirmation.
- **Internal SLAs** (same-business-day opt-out enforcement, 30-day complaint resolution, 5-business-day minor-data deletion, 1-business-day website notice update, 10-business-day vendor monitoring disposition) are program standards inferred where the source notes were silent; confirm with Privacy Operations before operationalizing alerts.
- **Reference policies (Acorns and Portage Bank notices)** were consumer-facing GLBA model notices, not internal program policies; they informed the notice-content and state-disclosure framing in PV-01, PV-11, and PV-12 but contributed no control structure. Pynthia's own sharing grid (which boxes of the model form are "Yes") must be confirmed by Compliance before the next notice publication.
- **The RFPA applies to federal government requests;** PV-03 and PV-04 assume Legal maintains the certification and member-notice workflow. State-authority requests follow state financial-records law not separately enumerated here.
