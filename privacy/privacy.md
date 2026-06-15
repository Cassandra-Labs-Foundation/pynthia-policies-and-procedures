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

## General Policy Statement

Pynthia Credit Union operates a risk-based privacy program governing how nonpublic personal information (NPPI) of members and consumers is collected, used, disclosed, safeguarded, corrected, and disposed of across all deposit, lending, payment, and online products and by all directors, officers, employees, temporary staff, and vendors with access to NPPI. Where two or more applicable laws govern the same data or activity, Pynthia applies the **stricter standard to all members regardless of state of residence**, treating CPRA-equivalent rights (access, deletion, correction, limit-sensitive-PI, data minimization, purpose limitation) as the floor for non-GLBA data such as marketing telemetry. The program complies with the Gramm-Leach-Bliley Act and Regulation P, NCUA Part 748 and Appendices A/B, FCRA/Reg V and NCUA Part 717, the FACTA Disposal Rule, the Right to Financial Privacy Act, E-SIGN, COPPA, and applicable U.S. state privacy laws.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---|---|
| Initial privacy notice at account opening | Member relationship established (`entity.created`) | At or before relationship starts | GLBA initial notice | [PR-01](#pr-01-privacy-notice-lifecycle) |
| Annual privacy notice | Annual cycle opens (`privacy.annual_notice_due_at`) | Every 12 months unless exempt | GLBA annual notice | [PR-01](#pr-01-privacy-notice-lifecycle) |
| Revised notice before material sharing change | Sharing basis changes (`privacy.notice_revised`) | Before new sharing begins | GLBA revised notice | [PR-01](#pr-01-privacy-notice-lifecycle) |
| Opt-out propagation to martech vendors | Opt-out received (`privacy.optout_received`) | 30 days (program standard) | Opt-out suppression | [PR-02](#pr-02-opt-out-capture--honoring) |
| Member access / notice copy request | Copy requested (`privacy.notice_copy_requested`) | 10 days | Notice copy fulfillment | [PR-04](#pr-04-customer-access--authentication) |
| Bureau-reported data correction | Correction identified (`furnishing.correction_identified`) | 30 days | Accuracy / propagation | [PR-05](#pr-05-data-accuracy--corrections) |
| Termination access revocation | Employee separated (`employee.separated`) | 24 hours | Least-privilege RBAC | [PR-06](#pr-06-employee-access-minimization--training) |
| Secure disposal after retention expiry | Retention expired (`record.retention_expired`) | 90 days (legal holds pause) | Certified destruction | [PR-08](#pr-08-secure-disposal-of-nppi) |
| Member breach notification | Misuse determined (`incident.member_impact_confirmed`) | Without unreasonable delay (state clocks) | Breach notice | [PR-09](#pr-09-incident-response--breach-notification) |
| Board privacy report | Annual cycle / material incident (`privacy.board_report_due_at`) | At least annually + ad hoc | Board reporting | [PR-10](#pr-10-recordkeeping-complaints--board-reporting) |
| State privacy rights request | Request received (`privacy.state_request_received`) | Per state clock (45-day CPRA floor) | State rights fulfillment | [PR-12](#pr-12-state-variants-universal-floor) |
| Minor data discovered | Under-13 data detected (`privacy.minor_data_detected`) | Promptly on discovery | COPPA deletion | [PR-17](#pr-17-childrens-data) |

## PR-01 — Privacy Notice Lifecycle  {#pr-01-privacy-notice-lifecycle}

- **WHY (Reg cite):** GLBA/Reg P requires initial notices at relationship start ([§1016.4](https://www.ecfr.gov/current/title-12/part-1016#p-1016.4)), annual notices ([§1016.5](https://www.ecfr.gov/current/title-12/part-1016#p-1016.5)), revised notices before new sharing ([§1016.8](https://www.ecfr.gov/current/title-12/part-1016#p-1016.8)), and prescribed delivery methods ([§1016.9](https://www.ecfr.gov/current/title-12/part-1016#p-1016.9)).
- **SYSTEM BEHAVIOR:** The system publishes a versioned notice template and delivers initial notices at or before the relationship begins, schedules annual notices on a 12-month cycle unless the annual-notice exemption applies, and issues revised notices before any material change to sharing takes effect. Each delivery records channel, timestamp, and template id. Non-exception sharing is blocked until the applicable notice is delivered; sharing that qualifies under a §1016.13–§1016.15 exception is not blocked. Notice templates and the publish/retire workflow are write-restricted to Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | New member relationship established (`entity.created`) | Member identity (`entity.id`), delivery channel (`member.delivery_channel`), template (`disclosure.template_id`) | Initial notice delivered (`privacy.notice_delivered`) | At/before relationship start (internal: same business day) |
  | Annual notice cycle opens (`privacy.annual_notice_due_at`) | Exemption status (`privacy.annual_exemption_status`), template (`disclosure.template_id`) | Annual notice delivered (`privacy.notice_delivered`) | Every 12 months (enforced by `privacy.annual_notice_due_at`) |
  | Material sharing change proposed (`privacy.notice_template_published`) | Change basis (`privacy.sharing_change_basis`), new template (`disclosure.template_id`) | Revised notice issued (`privacy.notice_revised`); sharing held until delivered (`privacy.sharing_blocked`) | Before sharing begins (internal: 30 days lead) |

- **ALERTS/METRICS:** Alert on any non-exception share attempted while `privacy.sharing_blocked` is true (target zero); track annual-notice on-time delivery rate (target 100%) and aging on overdue cycles.

## PR-02 — Opt-Out Capture & Honoring  {#pr-02-opt-out-capture--honoring}

- **WHY (Reg cite):** GLBA/Reg P [§1016.7](https://www.ecfr.gov/current/title-12/part-1016#p-1016.7) governs the opt-out right and requires a reasonable means and reasonable time to opt out of covered sharing.
- **SYSTEM BEHAVIOR:** The system provides at least two opt-out channels, enforces suppression immediately on capture, and propagates the opt-out to martech vendors within the 30-day program standard. A revoked opt-out is captured and re-applied with a revocation artifact. Opt-out flags are write-restricted to Compliance and the member self-service channel.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Member submits opt-out (`privacy.optout_received`) | Opt-out channel (`privacy.optout_channel`), scope (`privacy.optout_scope`), member (`entity.id`) | Suppression enforced (`privacy.optout_enforced`) | Immediately (internal: real-time) |
  | Opt-out enforced and pending vendor sync (`privacy.optout_enforced`) | Martech vendor list (`vendor.id`), scope (`privacy.optout_scope`) | Propagation confirmed (`privacy.optout_propagated`) | 30 days (enforced by `privacy.optout_propagation_due_at`) |
  | Member revokes opt-out (`privacy.optout_cleared`) | Revocation artifact (`privacy.revocation_artifact_id`), member (`entity.id`) | Suppression cleared (`privacy.optout_cleared`) | Immediately (internal: real-time) |

- **ALERTS/METRICS:** Alert on opt-outs un-propagated past 30 days via `privacy.optout_propagation_due_at` aging; target zero suppression-leak events in martech.

## PR-03 — Permissible Disclosures & Exceptions  {#pr-03-permissible-disclosures--exceptions}

- **WHY (Reg cite):** GLBA/Reg P exceptions for service providers/joint marketing ([§1016.13](https://www.ecfr.gov/current/title-12/part-1016#p-1016.13)), servicing/processing ([§1016.14](https://www.ecfr.gov/current/title-12/part-1016#p-1016.14)), and legal/protective purposes ([§1016.15](https://www.ecfr.gov/current/title-12/part-1016#p-1016.15)) permit sharing without opt-out only when correctly classified.
- **SYSTEM BEHAVIOR:** Each disclosure is tagged with a legal basis under §1016.13, §1016.14, or §1016.15, and the system blocks the share until a GLBA confidentiality clause is verified in the vendor contract. A disclosure that cannot be mapped to a permissible basis is held. Legal-basis tagging and the approved-basis registry are write-restricted to Compliance and Legal.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Disclosure initiated to third party (`disclosure.initiated`) | Legal basis (`disclosure.legal_basis`), vendor (`vendor.id`), GLBA addendum (`vendor.glba_addendum_id`) | Legal basis recorded (`disclosure.legal_basis_recorded`); share held if unverified (`disclosure.basis_blocked`) | Before transfer (internal: real-time gate) |
  | Vendor confidentiality clause checked (`vendor.glba_clause_verified`) | Clause id (`vendor.clause_id`), data scope (`vendor.data_scope`) | Basis approved (`disclosure.basis_approved`) | Before first transfer (internal: at onboarding) |

- **ALERTS/METRICS:** Alert on any disclosure with `disclosure.basis_blocked` true or an unverified GLBA clause (target zero); track distribution of disclosures by exception basis monthly.

## PR-04 — Customer Access & Authentication  {#pr-04-customer-access--authentication}

- **WHY (Reg cite):** Identity verification before disclosing member information and timely fulfillment of notice copy requests are required under GLBA/Reg P [§1016.9](https://www.ecfr.gov/current/title-12/part-1016#p-1016.9), the NCUA [Part 748](https://www.ecfr.gov/current/title-12/part-748) safeguarding standards, and the [Right to Financial Privacy Act](https://www.law.cornell.edu/uscode/text/12/3401).
- **SYSTEM BEHAVIOR:** The system verifies identity before disclosing member information across in-person, phone, and online channels, and validates a power-of-attorney artifact when an agent acts on a member's behalf. Disclosure is refused on failed authentication. Notice copy requests are fulfilled within 10 days. Authentication outcomes and POA artifacts are write-restricted to authorized member-service and Compliance roles.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Member or agent requests information (`access.request_received`) | Authentication result (`access.authenticated`), agent identity (`access.agent_identity`), POA artifact (`access.poa_artifact_id`) | Access provisioned or refused (`access.provisioned` / `access.poa_rejected`) | At time of request (internal: real-time) |
  | Member requests a notice copy (`privacy.notice_copy_requested`) | Member identity (`entity.id`), template (`disclosure.template_id`) | Notice copy delivered (`privacy.notice_copy_delivered`) | 10 days (enforced by `privacy.notice_copy_due_at`) |

- **ALERTS/METRICS:** Alert on disclosures issued without a recorded authentication pass (target zero); track notice-copy fulfillment latency against the 10-day SLA.

## PR-05 — Data Accuracy & Corrections  {#pr-05-data-accuracy--corrections}

- **WHY (Reg cite):** FCRA/Reg V furnisher accuracy and dispute obligations ([12 CFR Part 1022](https://www.ecfr.gov/current/title-12/part-1022)), the NCUA Part 717 address-discrepancy and Red Flags rules ([12 CFR Part 717](https://www.ecfr.gov/current/title-12/part-717)), and NCUA [Part 748](https://www.ecfr.gov/current/title-12/part-748) safeguards require accurate member information and prompt correction.
- **SYSTEM BEHAVIOR:** The system propagates master-data corrections to all systems and, where applicable, to prior recipients within 30 days for bureau-reported items, and routes USPS/NCOA address mismatches through the Red Flags process for step-up handling. Correction evidence is retained. Correction propagation and furnishing files are write-restricted to Compliance and the furnishing operations role.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Bureau-reported correction identified (`furnishing.correction_identified`) | Disputed account (`furnishing.disputed_account`), evidence (`correction.evidence_artifact_id`) | Correction propagated (`furnishing.correction_applied`, `correction.propagated`) | 30 days (enforced by `correction.propagation_due_at`) |
  | NCOA/USPS address mismatch detected (`address.ncoa_mismatch_detected`) | Candidate address (`address.ncoa_candidate`), member (`entity.id`) | Red Flag case opened (`redflag.detected`) | At detection (internal: same business day) |

- **ALERTS/METRICS:** Alert on bureau corrections un-propagated past 30 days via `correction.propagation_due_at`; track NCOA mismatch volume routed to Red Flags.

## PR-06 — Employee Access Minimization & Training  {#pr-06-employee-access-minimization--training}

- **WHY (Reg cite):** NCUA [Part 748 Appendix A](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20A%20to%20Part%20748) requires access controls limited to need-to-know, periodic access review, prompt termination of access, and staff training on the information-security program.
- **SYSTEM BEHAVIOR:** The system enforces least-privilege RBAC, runs quarterly access reviews, revokes access within 24 hours of termination, and assigns onboarding plus annual privacy training. Role entitlements and review attestations are write-restricted to Information Security/IT with Compliance oversight.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Employee separated (`employee.separated`) | User id (`user.id`), role (`user.role`), employment status (`user.employment_status`) | Access deprovisioned (`access.deprovisioned`) | 24 hours (enforced by `access.deprovision_due_at`) |
  | Quarterly access review opens (`access.review_due`) | Reviewer roster (`access.reviewer_roster`), role entitlements (`access.role_entitlements`) | Review completed and attested (`access.review_completed`) | Quarterly (enforced by `access.review_due`) |
  | New hire onboarded into covered role (`employee.hired`) | Curriculum (`training.curriculum_id`), assignee (`training.assignee_id`) | Privacy training assigned then completed (`training.onboarding_completed`) | Onboarding + annual (enforced by `training.newhire_due_at`, `training.privacy_due`) |

- **ALERTS/METRICS:** Alert on terminations with access still active past 24 hours (target zero) and on overdue quarterly reviews; track annual privacy training completion (target 100%).

## PR-07 — Third-Party Oversight & Contracts  {#pr-07-third-party-oversight--contracts}

- **WHY (Reg cite):** GLBA/Reg P [§1016.13](https://www.ecfr.gov/current/title-12/part-1016#p-1016.13) and NCUA [Part 748](https://www.ecfr.gov/current/title-12/part-748) require GLBA addenda, data maps, and oversight of service providers handling member information before and during the engagement.
- **SYSTEM BEHAVIOR:** The system requires privacy due diligence, a GLBA addendum, a data map, and subprocessor flow-down attestations before the first data transfer, and continuous monitoring plus annual review thereafter. Privacy sign-off blocks data sharing until complete. Privacy-review records and addendum verification are write-restricted to Compliance and Legal; this control covers only the privacy-specific clauses, with broader vendor lifecycle governed by the Third-Party Risk Policy.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Vendor data sharing requested (`vendor.data_sharing_requested`) | GLBA addendum (`vendor.glba_addendum_id`), data map (`vendor.data_map_id`), subprocessor attestation (`vendor.subprocessor_attestation`) | Privacy review completed; sharing authorized or held (`vendor.privacy_approved` / `vendor.privacy_blocked`) | Before first transfer (internal: at onboarding) |
  | Annual vendor privacy review opens (`vendor.annual_review_due`) | Refreshed evidence (`vendor.evidence_refreshed`), NPI access flag (`vendor.npi_access_flag`) | Review completed (`vendor.monitoring_review_completed`) | Annually (enforced by `vendor.annual_review_due_at`) |

- **ALERTS/METRICS:** Alert on any data transfer where `vendor.privacy_blocked` is true or the GLBA addendum is unverified (target zero); track overdue annual privacy reviews.

## PR-08 — Secure Disposal of NPPI  {#pr-08-secure-disposal-of-nppi}

- **WHY (Reg cite):** The FACTA Disposal Rule ([16 CFR Part 682](https://www.ecfr.gov/current/title-16/part-682)) and NCUA [Part 748](https://www.ecfr.gov/current/title-12/part-748) require reasonable measures for certified disposal of consumer-report information and NPPI.
- **SYSTEM BEHAVIOR:** The system enforces the retention schedule and triggers certified destruction of paper, media, and data within 90 days of retention expiry, with active legal holds pausing the disposal clock and resuming it on release. A certificate of destruction is retained for each batch. Disposal execution and hold/release authority are write-restricted to Records management and Compliance; retention-schedule scope beyond NPPI disposal timing is governed by the Record Retention Policy.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Retention period expires (`record.retention_expired`) | Record class (`record.retention_class`), legal-hold status (`record.hold_status`), media type (`record.media_type`) | Destruction certified (`record.destruction_certified`, `disposal.certificate_recorded`) | 90 days (enforced by `record.destruction_due_at`; paused by hold) |
  | Legal hold released (`record.hold_released`) | Hold matter (`record.hold_matter_id`), release authority (`record.hold_release_auth`) | Disposal clock resumed (`disposal.clock_resumed`) | On release (internal: same business day) |

- **ALERTS/METRICS:** Alert on records past 90-day disposal SLA via `record.destruction_due_at` aging (target zero); reconcile destruction certificates against disposal batches monthly.

## PR-09 — Incident Response & Breach Notification  {#pr-09-incident-response--breach-notification}

- **WHY (Reg cite):** NCUA [Part 748 Appendix B](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20B%20to%20Part%20748) governs the response program and member notification for unauthorized access to member information; state breach laws set notification clocks; the [Right to Financial Privacy Act](https://www.law.cornell.edu/uscode/text/12/3401) constrains disclosure to government.
- **SYSTEM BEHAVIOR:** The system detects, contains, classifies, and assesses misuse likelihood for incidents touching NPPI, notifies members and regulators without unreasonable delay per the applicable state clock, refers to BSA for SAR filing where criminal activity is suspected, and integrates Privacy and Legal into the IR runbook. Member notice content and reportability determinations are write-restricted to the incident commander, Compliance, and Legal; SAR filing mechanics are governed by the BSA Policy.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Privacy incident declared (`incident.declared`) | Data scope (`incident.data_scope`), detection source (`incident.detection_source`), severity (`incident.severity`) | Incident triaged and contained (`incident.classified`, `incident.containment_started`) | Triage (enforced by `incident.triage_due_at`) |
  | Member misuse confirmed (`incident.member_impact_confirmed`) | Notice template (`incident.member_notice_template`), notice content (`incident.notice_content`), member scope (`incident.scope`) | Member notices sent (`incident.member_notices_sent`) | Without unreasonable delay, per state clock (enforced by `incident.notification_due_at`) |
  | NCUA notification criteria met (`incident.material_flagged`) | Reportability determination (`incident.reportability_determination`), metrics (`ncua.metrics_snapshot`) | NCUA notified (`incident.ncua_notified`) | Per Appendix B (enforced by `incident.ncua_notice_due_at`) |
  | Criminal activity suspected (`incident.security_confirmed`) | Criminal-suspected flag (`incident.criminal_suspected`), BSA referral (`incident.bsa_referral_id`) | SAR referral recorded (`incident.sar_referred`) | Per BSA referral SLA (internal: same business day) |

- **ALERTS/METRICS:** Alert on member-notification clocks approaching the state deadline via `incident.notification_due_at` aging; track time-to-containment and the count of incidents requiring NCUA notification.

## PR-10 — Recordkeeping, Complaints & Board Reporting  {#pr-10-recordkeeping-complaints--board-reporting}

- **WHY (Reg cite):** NCUA [Part 748](https://www.ecfr.gov/current/title-12/part-748) requires the program to be documented and reported to the board, including its status and material incidents.
- **SYSTEM BEHAVIOR:** The system centralizes complaint logs, notices, opt-outs, and metrics, and delivers a privacy report to the board at least annually and ad hoc for material incidents. Privacy complaints are logged and routed for investigation and response. The board metrics package and complaint dispositions are write-restricted to Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Privacy complaint received (`complaint.privacy_received`) | Complaint category (`complaint.category`), member (`complaint.member_id`), narrative (`complaint.investigation_notes`) | Complaint logged and resolved (`complaint.logged`, `complaint.resolved`) | Per complaint SLA (enforced by `complaint.resolution_due_at`) |
  | Annual board cycle opens (`privacy.board_report_due_at`) | Metrics package (`privacy.metrics_package_id`), board metrics inputs (`board_pack.training_metrics`) | Board report delivered (`privacy.board_report_delivered`) | At least annually (enforced by `privacy.board_report_due_at`) |
  | Material privacy incident occurs (`incident.material_flagged`) | Incident summary (`incident.impact_summary`), metrics (`ncua.metrics_snapshot`) | Ad hoc board report delivered (`privacy.board_adhoc_delivered`) | Promptly on material event (internal: 5 business days) |

- **ALERTS/METRICS:** Alert on overdue board reporting via `privacy.board_report_due_at`; track privacy complaint volume, resolution latency, and trend tags.

## PR-11 — Website Posting & E-SIGN Delivery  {#pr-11-website-posting--e-sign-delivery}

- **WHY (Reg cite):** GLBA/Reg P [§1016.9](https://www.ecfr.gov/current/title-12/part-1016#p-1016.9) governs notice delivery and copy fulfillment; [E-SIGN, 15 USC §7001](https://www.law.cornell.edu/uscode/text/15/7001) governs electronic delivery and capture of consumer e-consent.
- **SYSTEM BEHAVIOR:** The system hosts the current notice in an ADA-accessible format, captures and retains E-SIGN consent artifacts including the consumer's confirmation of electronic access, and fulfills notice copy requests within 10 days. Website notice content and e-consent records are write-restricted to Compliance and Digital operations.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Member begins e-delivery consent (`privacy.esign_consent_started`) | ESIGN consent evidence (`member.esign_consent_evidence`), access confirmation (`privacy.esign_access_confirmation`) | E-consent recorded (`privacy.esign_consent_recorded`) | At enrollment (internal: real-time) |
  | Notice template published or revised (`privacy.notice_template_published`) | ADA validation (`privacy.ada_validation_id`), template (`disclosure.template_id`) | Website notice updated (`privacy.website_notice_updated`) | On publish (internal: same business day) |
  | Member requests notice copy electronically (`privacy.notice_copy_requested`) | Member identity (`entity.id`), delivery channel (`member.delivery_channel`) | Notice copy delivered (`privacy.notice_copy_delivered`) | 10 days (enforced by `privacy.notice_copy_due_at`) |

- **ALERTS/METRICS:** Alert on ADA validation failures on the published notice (target zero); track e-consent capture rate and notice-copy fulfillment latency.

## PR-12 — State Variants (Universal Floor)  {#pr-12-state-variants-universal-floor}

- **WHY (Reg cite):** GLBA/Reg P [§1016.17](https://www.ecfr.gov/current/title-12/part-1016#p-1016.17) preserves stricter state privacy law; CPRA, Vermont, and Nevada requirements govern non-GLBA marketing/telemetry data, applied here as a universal floor for all members.
- **SYSTEM BEHAVIOR:** The system separates GLBA NPPI from non-GLBA telemetry, applies CPRA-equivalent rights (access, delete, correct, limit sensitive PI, data minimization, purpose limitation) to all members regardless of state, and honors "Do Not Sell/Share," GPC signals, and Vermont opt-in / Nevada opt-out limits for non-GLBA data. State requests that cannot be auto-classified are routed to Compliance. State-request fulfillment and data-classification rules are write-restricted to Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | State privacy rights request received (`privacy.state_request_received`) | Request type (`privacy.state_request_type`), data classification (`privacy.data_classification`), member (`entity.id`) | Request fulfilled (`privacy.state_request_fulfilled`) | Per state clock; 45-day CPRA floor (enforced by `privacy.state_request_due_at`) |
  | Nevada opt-out received (`privacy.nv_optout_received`) | Opt-out scope (`privacy.optout_scope`), member (`entity.id`) | Nevada opt-out enforced (`privacy.nv_optout_enforced`) | Per Nevada timeline (internal: 30 days) |

- **ALERTS/METRICS:** Alert on state requests approaching the 45-day CPRA floor via `privacy.state_request_due_at` aging; track request volume by type and GLBA/non-GLBA classification accuracy.

## PR-13 — Anonymization & Aggregation  {#pr-13-anonymization--aggregation}

- **WHY (Reg cite):** CPRA's de-identification standard (data minimization and purpose limitation, applied as the universal floor per GLBA/Reg P [§1016.17](https://www.ecfr.gov/current/title-12/part-1016#p-1016.17)) permits analytics/R&D only on non-identifiable data with re-identification prohibited.
- **SYSTEM BEHAVIOR:** The system permits analytics/R&D only on documented, non-identifiable datasets with re-identification contractually and technically prohibited, applies small-cohort suppression thresholds, and reviews de-identification methods at least annually. Dataset approval and method definitions are write-restricted to Compliance and Data Governance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Analytics dataset requested (`analytics.dataset_requested`) | De-id method (`analytics.deid_method_id`), cohort threshold (`analytics.cohort_threshold`), re-id risk (`analytics.reid_risk_assessment`) | Dataset approved (`analytics.dataset_approved`) | Before use (internal: at request) |
  | Annual method review opens (`analytics.method_review_due`) | Method id (`analytics.deid_method_id`), source scope (`analytics.source_scope`) | Method review completed (`analytics.method_review_completed`) | Annually (enforced by `analytics.method_review_due_at`) |

- **ALERTS/METRICS:** Alert on any analytics dataset used without an approved de-id method (target zero); track overdue annual method reviews.

## PR-14 — Cookies & Online Tracking (Non-GLBA)  {#pr-14-cookies--online-tracking-non-glba}

- **WHY (Reg cite):** CPRA's opt-out-of-sale/share and universal opt-out (GPC) obligations for non-GLBA online data, applied as the universal floor under GLBA/Reg P [§1016.17](https://www.ecfr.gov/current/title-12/part-1016#p-1016.17), govern cookie consent and tag gating.
- **SYSTEM BEHAVIOR:** The system operates a cookie banner and preference center, blocks non-essential tags until consent where required, and honors GPC and other universal opt-out signals for California users. New tags require review before deployment. Consent state and tag approvals are write-restricted to Compliance and Digital operations.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Visitor session starts (`web.session_started`) | Visitor jurisdiction (`web.visitor_jurisdiction`), GPC signal (`web.gpc_signal`), consent state (`web.consent_state`) | Consent recorded; non-essential tags gated (`web.consent_recorded`, `web.tags_gated`) | At session start (internal: real-time) |
  | New tracking tag proposed (`web.tag_review_requested`) | Tag vendor (`web.tag_vendor_id`), data scope (`web.tag_data_scope`) | Tag approved or rejected (`web.tag_approved` / `web.tag_rejected`) | Before deployment (internal: pre-deploy gate) |

- **ALERTS/METRICS:** Alert on non-essential tags firing before consent or against a GPC signal for CA users (target zero); track consent-banner interaction and tag-gating coverage.

## PR-15 — Third-Party App/Account Connections  {#pr-15-third-party-appaccount-connections}

- **WHY (Reg cite):** GLBA/Reg P [§1016.14](https://www.ecfr.gov/current/title-12/part-1016#p-1016.14) servicing/processing exception and NCUA [Part 748](https://www.ecfr.gov/current/title-12/part-748) safeguards govern member-authorized API connections and token scope.
- **SYSTEM BEHAVIOR:** The system scopes and consents member-authorized API connections with purpose-limited tokens, provides an immediate revoke path, and prohibits token reuse beyond the consented scope by suspending the connection on a scope violation. Connection consent and token lifecycle are write-restricted to the connections service with Compliance oversight.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Member authorizes a connection (`connection.consent_granted`) | Party (`connection.party_id`), token scope (`privacy.optout_scope` n/a — token scope), access log (`connection.access_log_id`) | Purpose-limited token issued (`connection.token_issued`) | At consent (internal: real-time) |
  | Member requests revoke (`connection.revoke_requested`) | Connection (`connection.party_id`), token reference (`connection.access_log_id`) | Token revoked (`connection.token_revoked`) | Immediately (internal: real-time) |
  | Scope violation detected (`connection.scope_violation_detected`) | Connection (`connection.party_id`), access log (`connection.access_log_id`) | Connection suspended (`connection.suspended`) | At detection (internal: real-time) |

- **ALERTS/METRICS:** Alert on connections exceeding consented scope (`connection.scope_violation_detected`, target zero) and on revoke-request latency; track active connections by token scope.

## PR-16 — Biometric Data for KYC  {#pr-16-biometric-data-for-kyc}

- **WHY (Reg cite):** State biometric privacy law (applied as the universal floor under GLBA/Reg P [§1016.17](https://www.ecfr.gov/current/title-12/part-1016#p-1016.17)) and NCUA [Part 748](https://www.ecfr.gov/current/title-12/part-748) safeguards govern vendor face-match/liveness data, storage, and purge.
- **SYSTEM BEHAVIOR:** The system permits vendor face-match/liveness only under explicit contractual limits, prefers vendor-side storage, prohibits model reuse, purges biometric data per the applicable state biometric clock, and offers a non-biometric verification path where feasible. A member who declines biometrics is routed to the alternative path. Biometric consent records and purge scheduling are write-restricted to Compliance and Information Security.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Biometric verification started (`verification.biometric_started`) | Biometric consent (`verification.biometric_consent_id`), provider (`verification.provider`), alt-path availability (`verification.alt_path_available`) | Biometric verification completed (`verification.biometric_completed`) | At verification (internal: real-time) |
  | Member declines biometrics (`verification.alt_path_started`) | Declined flag (`verification.biometric_declined`), alt-path availability (`verification.alt_path_available`) | Alternative verification started (`verification.alt_path_started`) | At declination (internal: real-time) |
  | Biometric retention expires (`verification.biometric_purge_due_at`) | Consent id (`verification.biometric_consent_id`), purged flag (`verification.biometric_purged`) | Biometric data purged (`verification.biometric_completed` w/ purge) | Per state biometric clock (enforced by `verification.biometric_purge_due_at`) |

- **ALERTS/METRICS:** Alert on biometric records past the state purge clock via `verification.biometric_purge_due_at` (target zero); track alt-path uptake and vendor-side-storage compliance.

## PR-17 — Children's Data  {#pr-17-childrens-data}

- **WHY (Reg cite):** [COPPA, 16 CFR Part 312](https://www.ecfr.gov/current/title-16/part-312) requires that a service not directed to under-13 users gate by age and promptly delete data collected from children on discovery.
- **SYSTEM BEHAVIOR:** The system applies an age gate, treats the service as not directed to under-13 users, and promptly deletes data identified as belonging to a minor on discovery. Age-gate rulesets and minor-deletion authority are write-restricted to Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Age-gate evaluation runs (`web.session_started`) | Age-gate ruleset (`privacy.age_gate_ruleset_id`), visitor (`web.visitor_id`) | Gate decision recorded (`privacy.age_gate_blocked`) | At entry (internal: real-time) |
  | Minor data detected (`privacy.minor_data_detected`) | Data classification (`privacy.data_classification`), member (`entity.id`) | Minor data deleted (`privacy.minor_data_deleted`) | Promptly on discovery (internal: same business day) |

- **ALERTS/METRICS:** Alert on any detected under-13 data not deleted same business day (target zero); track age-gate block rate.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer, holds primary accountability for this policy, jointly with the BSA/AML Officer for incident and SAR-referral coordination.
- **Required participants:** Privacy Operations, Legal, Information Security/IT, and the relevant business owners execute and maintain the controls above.
- **Approval:** Approved by Patrick Wilson, Chief Compliance Officer.
- **Review cadence:** Reviewed at least every 12 months (next review {{2027-07-01}}) and upon any material change in sharing practices, applicable law, or system design; board reporting occurs at least annually and ad hoc for material incidents per [PR-10](#pr-10-recordkeeping-complaints--board-reporting).
- **Cross-references:** Information-security safeguards (Information Security Policy); vendor lifecycle beyond privacy clauses (Third-Party Risk Policy); retention schedules beyond NPPI disposal timing (Record Retention Policy); SAR mechanics and BSA/AML program (BSA Policy); account servicing disclosures (Member Policy); electronic delivery channel mechanics (E-Commerce Policy).

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** The privacy-side resources, fields, events, and timers referenced in the SYSTEM BEHAVIOR and EVENTS tables throughout this document are drawn from the parsed `core-vocabulary.json`. Several codes used are registered (e.g., `privacy.*`, `vendor.*`, `record.*`, `verification.biometric_*`, `web.*`, `connection.*`), but a few are composed under the grammar or rely on provisional spellings and require engineering confirmation before the next review — specifically `privacy.notice_template_id`, the connection token-scope field (no registered `connection.token_scope` exists; current rows reference `connection.access_log_id` as the closest registered surrogate), and the use of `privacy.data_classification` for minor-data tagging in PR-17.
- **State-clock parameterization.** PR-09 and PR-12 reference "without unreasonable delay per state clocks" and a 45-day CPRA floor; the specific per-state deadline table (and Nevada's 60-day statutory window vs. the 30-day internal standard) must be confirmed by Legal and encoded in the timer configuration.
- **Annual-notice exemption.** PR-01 assumes Pynthia may qualify for the GLBA annual-notice exemption when sharing has not changed and no opt-out applies; eligibility (`privacy.annual_exemption_status`) must be confirmed against current sharing practices.
- **Charter / NCUA applicability.** This policy assumes Pynthia is an NCUA-regulated credit union subject to Part 748 (and Part 717 for FCRA). If charter or examiner expectations differ, the WHY citations in PR-04, PR-05, PR-06, PR-07, PR-08, PR-09, and PR-10 must be revalidated.
- **Biometric law scope.** PR-16 applies a generic "state biometric clock"; the controlling state biometric statutes (e.g., Illinois BIPA-style retention/purge requirements) and whether Pynthia's member base triggers them must be confirmed by Legal.
- **RFPA government-access handling.** RFPA is cited in PR-04 and PR-09 for member notice on government access to financial records; the detailed RFPA notice-and-challenge workflow is assumed to live in a separate legal-process runbook and is referenced here only at the privacy boundary.
- **Opt-out propagation standard.** The 30-day martech propagation window in PR-02 is a program standard, not a Reg P deadline; confirm it remains the intended SLA.
