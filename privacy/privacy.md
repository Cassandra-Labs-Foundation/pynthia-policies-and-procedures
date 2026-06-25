```yaml
---
title: Privacy Policy (Table-First, Design-Overlay v3)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-07-01
next_review: 2027-07-01
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Privacy, GLBA, Reg P, NCUA 748, FCRA, FACTA, RFPA, E-SIGN, COPPA, State Privacy]
---
```

# Privacy Policy

## General Policy Statement

Pynthia Credit Union ("Pynthia") operates a risk-based privacy program that governs how nonpublic personal information ("NPPI") of members and consumers is collected, used, disclosed, safeguarded, corrected, and disposed of across all deposit, lending, payment, and online products and all channels. The program complies with the Gramm-Leach-Bliley Act and Regulation P (12 CFR Part 1016), NCUA Part 748 and its Appendices A and B, FCRA/Reg V (12 CFR Part 1022) and NCUA Part 717, the FACTA Disposal Rule (16 CFR Part 682), the Right to Financial Privacy Act (12 USC §3401 et seq.), E-SIGN (15 USC §7001), COPPA (16 CFR Part 312), and applicable U.S. state privacy laws (California/CPRA, Vermont, Nevada) where they govern non-GLBA data such as marketing telemetry. Where two or more laws govern the same data or processing activity, Pynthia applies the stricter requirement to all members regardless of state of residence; for non-GLBA data, CPRA-equivalent standards (data minimization, purpose limitation, retention disclosure, sensitive-PI limits, and access/deletion/correction rights) serve as the universal floor. All directors, officers, employees, temporary staff, and vendors with access to NPPI are in scope; information in any form is covered.

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Initial privacy notice — new member/consumer relationship | Relationship established (`privacy.notice.delivered`) | At or before relationship starts | Reg P §1016.4 notice template | [PR-01](#pr-01-privacy-notice-lifecycle) |
| Annual privacy notice | 12-month anniversary of last notice (`privacy.annual.notice.due_at`) | Every 12 months | Reg P §1016.5 notice template | [PR-01](#pr-01-privacy-notice-lifecycle) |
| Revised privacy notice — material sharing change | Sharing practice change identified (`privacy.notice.revised`) | Before change takes effect | Reg P §1016.8 revised template | [PR-01](#pr-01-privacy-notice-lifecycle) |
| Notice copy request | Member requests copy (`privacy.notice_copy.requested`) | 10 days | Reg P §1016.9 / E-SIGN | [PR-01](#pr-01-privacy-notice-lifecycle) |
| Opt-out suppression — immediate | Opt-out received (`privacy.optout.received`) | Immediate (same processing cycle) | Suppression list | [PR-02](#pr-02-opt-out-capture-and-honoring) |
| Opt-out propagation to martech vendors | Opt-out enforced internally (`privacy.optout_enforced`) | 30 days (`privacy.optout.propagation.due_at`) | Vendor suppression feed | [PR-02](#pr-02-opt-out-capture-and-honoring) |
| Permissible disclosure — legal-basis tag required | Disclosure request initiated (`disclosure.initiated`) | Before data leaves Pynthia | Legal-basis register | [PR-03](#pr-03-permissible-disclosures-and-exceptions) |
| Member identity verification — information request | Member or agent requests account information (`access.request.received`) | Before disclosure | Authentication checklist | [PR-04](#pr-04-member-access-and-authentication) |
| Data accuracy correction — bureau-reported items | Correction identified (`correction.propagated`) | 30 days (`correction.propagation.due_at`) | Correction propagation log | [PR-05](#pr-05-data-accuracy-and-corrections) |
| NCOA address mismatch → Red Flags routing | NCOA mismatch detected (`address.ncoa_mismatch.detected`) | Immediate routing | Red Flags runbook | [PR-05](#pr-05-data-accuracy-and-corrections) |
| Employee access revocation — termination | Employee separated (`employee.separated`) | 24 hours (`access.deprovision.due_at`) | Access deprovisioning checklist | [PR-06](#pr-06-employee-access-minimization-and-training) |
| Quarterly access review | Review cycle opens | Quarterly (`privacy.access_review_due`) | RBAC role matrix | [PR-06](#pr-06-employee-access-minimization-and-training) |
| Annual privacy training | Annual cycle opens (`training.annual_cycle.opened`) | Within onboarding window / annually (`training.privacy_due`) | Privacy training curriculum | [PR-06](#pr-06-employee-access-minimization-and-training) |
| Vendor GLBA addendum — before first data transfer | Vendor onboarding initiated (`vendor.onboarding.started`) | Before first data transfer | GLBA addendum template | [PR-07](#pr-07-third-party-oversight-and-contracts) |
| Vendor annual privacy review | Annual review cycle (`vendor.annual.review.due_at`) | Annually | Vendor privacy review checklist | [PR-07](#pr-07-third-party-oversight-and-contracts) |
| NPPI disposal — retention expiry | Retention period expires (`record.retention.expired`) | Within 90 days of expiry (`record.disposal.due_at`) | Destruction certificate | [PR-08](#pr-08-secure-disposal-of-nppi) |
| Incident detection → classification → SAR referral | Incident declared (`incident.created`) | Classify within triage SLA; SAR referral per BSA Policy | IR runbook | [PR-09](#pr-09-incident-detection-classification-and-sar-referral) |
| NCUA reportable cyber-incident & member notification | Reportability determined (`incident.reportability_determination`) | Without unreasonable delay; state clocks apply | SC-01 runbook | [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification) |
| Privacy complaint — initial acknowledgement | Complaint received (`complaint.privacy.received`) | Per complaint SLA (`complaint.ack_due_at`) | Complaint log | [PR-10](#pr-10-recordkeeping-complaints-and-board-reporting) |
| Annual Board privacy report | Annual cycle | Annually (`privacy.board_report_due_at`) | Board privacy metrics package | [PR-10](#pr-10-recordkeeping-complaints-and-board-reporting) |
| Website notice update | Material notice change (`privacy.website_notice.updated`) | Before change takes effect | ADA-accessible notice template | [PR-11](#pr-11-website-posting-and-e-sign-delivery) |
| State rights request (access/delete/correct/limit) | Request received (`privacy.state_request.received`) | 45 days (CA/CPRA default; `privacy.state_request_due_at`) | State rights response template | [PR-12](#pr-12-state-privacy-rights-universal-floor) |
| GPC / Do-Not-Sell signal | Signal detected (`web.gpc_signal` set) | Immediate (same session) | Consent management platform | [PR-13](#pr-13-cookies-and-online-tracking) |
| Third-party API connection — consent capture | Connection consent granted (`connection.consent.granted`) | Before token issued | Consent artifact | [PR-14](#pr-14-third-party-app-and-account-connections) |
| API connection revocation | Revocation requested (`connection.revoke.requested`) | Immediate token revocation | Token revocation log | [PR-14](#pr-14-third-party-app-and-account-connections) |
| Biometric data purge | Biometric purge timer fires (`verification.biometric.purge.due_at`) | Per state biometric law | Purge certificate | [PR-15](#pr-15-biometric-data-for-kyc) |
| Minor data deletion | Minor data detected (`privacy.minor_data.detected`) | Promptly / without unreasonable delay | Deletion log | [PR-16](#pr-16-childrens-data-and-coppa) |
| Anonymization method annual review | Annual cycle | Annually (`analytics.method.review.due_at`) | De-identification method register | [PR-17](#pr-17-anonymization-and-aggregation) |

---

## PR-01 — Privacy Notice Lifecycle {#pr-01-privacy-notice-lifecycle}

**WHY (Reg cite):** [Reg P §1016.4](https://www.ecfr.gov/current/title-12/part-1016#p-1016.4) requires an initial notice at or before the time a customer relationship is established. [§1016.5](https://www.ecfr.gov/current/title-12/part-1016#p-1016.5) requires an annual notice unless the §1016.5(e) exemption applies. [§1016.8](https://www.ecfr.gov/current/title-12/part-1016#p-1016.8) requires a revised notice before any material change in sharing practices. [§1016.9](https://www.ecfr.gov/current/title-12/part-1016#p-1016.9) governs delivery methods and copy requests. [15 USC §7001](https://www.law.cornell.edu/uscode/text/15/7001) (E-SIGN) authorizes electronic delivery when e-consent is captured.

**SYSTEM BEHAVIOR:** The system delivers the current approved notice template at or before relationship establishment, suppressing any non-exception sharing until delivery is confirmed. Annual notices are triggered by the `privacy.annual.notice.due_at` timer; the system evaluates the §1016.5(e) exemption flag (`privacy.annual_exemption_status`) before dispatching — if exempt, it logs the determination and skips delivery. Revised notices are triggered when a material sharing change is approved; the system blocks the new sharing practice until the revised notice is delivered and the delivery timestamp is recorded. Notice copy requests are fulfilled within 10 days. All deliveries record channel, timestamp, and template ID. The `privacy.notice_template_id` and `privacy.esign_consent` fields are write-restricted to Compliance and the Privacy Operations team; no other role may alter notice content or delivery records.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New member/consumer relationship established (`entity.created` or `account.created`) | Member identity (`entity.id`), delivery channel (`member.delivery_channel`), e-consent status (`entity.esign_consent`), current template (`privacy.notice_template_id`) | Initial notice delivered + delivery record (`privacy.notice.delivered`); e-consent artifact if electronic (`privacy.esign_consent.recorded`) | At or before relationship starts (internal: same-session; enforced by `privacy.annual.notice.due_at` set at T+0) |
| Annual notice timer fires (`privacy.annual.notice.due_at`) | Exemption status (`privacy.annual_exemption_status`), delivery channel (`member.delivery_channel`), current template (`privacy.notice_template_id`) | Annual notice delivered or exemption logged (`privacy.notice.delivered`); delivery timestamp and template ID recorded | Every 12 months (internal: 11-month alert; enforced by `privacy.annual_notice_due_at`) |
| Material sharing change approved (`privacy.sharing_change_basis` set, `privacy.notice.revised`) | Change description (`privacy.sharing_change_basis`), revised template (`privacy.notice_template_id`), sharing-block flag (`privacy.sharing.blocked`) | Revised notice delivered; sharing block lifted only after delivery confirmed (`privacy.notice.delivered`) | Before change takes effect (internal: sharing remains blocked until `privacy.notice.delivered` fires) |
| Member requests notice copy (`privacy.notice_copy.requested`) | Member identity (`entity.id`), preferred channel (`member.delivery_channel`), e-consent if electronic (`entity.esign_consent`) | Notice copy delivered (`privacy.notice_copy.delivered`); delivery timestamp logged | 10 days (enforced by `privacy.notice_copy_due_at`) |

**ALERTS/METRICS:** Alert fires if any `privacy.annual.notice.due_at` timer reaches T−30 days without a confirmed `privacy.notice.delivered` event. Target: zero overdue initial or annual notices at month-end. Notice copy requests aged beyond 8 days trigger an escalation alert to Privacy Operations.

---

## PR-02 — Opt-Out Capture and Honoring {#pr-02-opt-out-capture-and-honoring}

**WHY (Reg cite):** [Reg P §1016.7](https://www.ecfr.gov/current/title-12/part-1016#p-1016.7) requires that members be given a reasonable means to opt out of non-exception sharing and that opt-outs be honored. Pynthia's program standard requires at least two opt-out channels and propagation to martech vendors within 30 days.

**SYSTEM BEHAVIOR:** The system accepts opt-out elections through at least two channels (online preference center and phone/written request). Upon receipt, the suppression flag is applied immediately within the same processing cycle — no batch delay is permitted. The opt-out scope (`privacy.optout_scope`) is recorded alongside the channel (`privacy.optout_channel`). Propagation to martech vendors is tracked by the `privacy.optout.propagation.due_at` timer (30-day program standard). Members may revoke an opt-out at any time; revocation is logged with a revocation artifact (`privacy.revocation_artifact_id`). Vermont opt-in status (`privacy.vt_optin_status`) and Nevada opt-out enforcement (`privacy.nv_optout_enforced`) are tracked as separate state-law fields. The `privacy.optout_enforced` and `privacy.optout_propagated` fields are write-restricted to the Privacy Operations system; manual overrides require Compliance sign-off.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member submits opt-out election (`privacy.optout.received`) | Member identity (`entity.id`), opt-out channel (`privacy.optout_channel`), opt-out scope (`privacy.optout_scope`) | Suppression applied immediately (`privacy.optout_enforced`); opt-out record logged | Immediate — same processing cycle (no regulatory deadline for suppression speed; internal SLA: same cycle) |
| Opt-out enforced internally; vendor propagation required (`privacy.optout_enforced`) | Vendor list with martech scope, opt-out scope (`privacy.optout_scope`), propagation timer (`privacy.optout.propagation.due_at`) | Vendor suppression feed updated (`privacy.optout_propagated`); propagation timestamp logged | 30 days (program standard; enforced by `privacy.optout_propagation_due_at`) |
| Member revokes prior opt-out (`privacy.optout.cleared`) | Member identity (`entity.id`), revocation artifact (`privacy.revocation_artifact_id`) | Opt-out cleared (`privacy.optout.cleared`); revocation logged with artifact ID | Immediate |
| Nevada opt-out request received (`privacy.nv_optout.received`) | Member identity (`entity.id`), Nevada residency indicator (`entity.jurisdiction`), request channel | Nevada suppression applied (`privacy.nv_optout_enforced`); request logged | Reasonable time (internal: same processing cycle) |

**ALERTS/METRICS:** Alert fires if any `privacy.optout.propagation.due_at` timer reaches T−5 business days without a confirmed `privacy.optout_propagated` event. Target: zero opt-outs propagated beyond 30 days. Monthly dashboard shows opt-out volume by channel and vendor propagation lag.

---

## PR-03 — Permissible Disclosures and Exceptions {#pr-03-permissible-disclosures-and-exceptions}

**WHY (Reg cite):** [Reg P §1016.13](https://www.ecfr.gov/current/title-12/part-1016#p-1016.13) (service-provider/joint-marketing exception), [§1016.14](https://www.ecfr.gov/current/title-12/part-1016#p-1016.14) (processing/servicing exception), and [§1016.15](https://www.ecfr.gov/current/title-12/part-1016#p-1016.15) (legal/protective exception) define the permissible bases for sharing NPPI without member opt-out. [NCUA Part 748](https://www.ecfr.gov/current/title-12/part-748) requires that vendor contracts include confidentiality obligations.

**SYSTEM BEHAVIOR:** Every disclosure of NPPI must be tagged with a legal basis drawn from the registered exception set (§1016.13, §1016.14, or §1016.15) before data leaves Pynthia's systems. The system enforces a pre-disclosure gate: if `disclosure.legal_basis` is not recorded, the disclosure is blocked (`privacy.sharing.blocked`). For §1016.13 disclosures, the system additionally verifies that a GLBA confidentiality clause (`vendor.glba_clause`) is present and verified in the vendor contract before releasing data. Joint-marketing disclosures require a formal agreement on file. Legal/protective disclosures (e.g., court orders, government requests) are routed through Legal and logged with the process artifact (`legal.process_artifact_id`). The `disclosure.legal_basis` field is write-restricted to Compliance and Legal; business units may request but not self-approve.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Disclosure of NPPI to a third party initiated (`disclosure.initiated`) | Legal basis (`disclosure.legal_basis`), recipient identity (`vendor.id` or `entity.id`), data scope (`vendor.data_scope`), GLBA clause verification for §1016.13 (`vendor.glba_clause`) | Legal basis recorded (`disclosure.legal_basis.recorded`); sharing blocked if basis absent (`privacy.sharing.blocked`) | Before data leaves Pynthia (internal: gate enforced at disclosure initiation) |
| §1016.13 service-provider/joint-marketing disclosure (`disclosure.basis.approved`) | GLBA addendum ID (`vendor.glba_addendum_id`), GLBA clause verified (`vendor.glba_clause`), data map (`vendor.data_map_id`) | Disclosure authorized and logged (`disclosure.recorded`); GLBA clause verification event (`vendor.glba_clause.verified`) | Before first data transfer |
| Legal/protective disclosure — court order or government request (`legal.process.received`) | Legal process artifact (`legal.process_artifact_id`), RFPA applicability flag (`legal.rfpa_applicable`), Legal sign-off | Disclosure logged with legal basis (`disclosure.legal_basis.recorded`); RFPA notice issued if applicable (`notice.sent`) | Per legal process deadline; RFPA notice before disclosure where required |
| Disclosure basis audit — periodic review | Disclosure log, legal basis register, vendor contract status | Disclosure audit completed (`disclosure.recorded`); exceptions flagged | Annually (as part of vendor annual review; see [PR-07](#pr-07-third-party-oversight-and-contracts)) |

**ALERTS/METRICS:** Alert fires on any attempted disclosure where `disclosure.legal_basis` is absent — these are blocked and counted as control failures. Target: zero untagged disclosures. Monthly report of disclosure volume by exception category reviewed by Compliance.

---

## PR-04 — Member Access and Authentication {#pr-04-member-access-and-authentication}

**WHY (Reg cite):** [Reg P §1016.9](https://www.ecfr.gov/current/title-12/part-1016#p-1016.9) requires that members be able to obtain copies of the privacy notice. [NCUA Part 748](https://www.ecfr.gov/current/title-12/part-748) requires safeguards against unauthorized access to member information. The [Right to Financial Privacy Act (12 USC §3401 et seq.)](https://www.law.cornell.edu/uscode/text/12/3401) governs government access to financial records and requires member notice and process protections.

**SYSTEM BEHAVIOR:** Before disclosing any member account information or NPPI — in-person, by phone, or online — the system requires successful identity verification. The verification method (`member.identity_check_method`) is logged for every access event. For agents acting under power of attorney, the POA artifact must be validated (`access.poa.validated`) before access is granted; disclosure is refused and logged if POA validation fails (`access.poa.rejected`). Authentication failures result in refusal of disclosure (`access.refused`) and are logged. Government requests for financial records are routed through Legal for RFPA compliance review before any response. Privacy notice copy requests are fulfilled within 10 days (see [PR-01](#pr-01-privacy-notice-lifecycle)). The `access.role_entitlements` field governing which staff roles may access which member data categories is write-restricted to Information Security/IT with Compliance approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member or agent requests account information or NPPI disclosure (`access.request.received`) | Member identity (`entity.id`), verification method (`member.identity_check_method`), channel (`access.channel` — provisional), POA artifact if agent (`access.poa_artifact_id`) | Authentication result logged; disclosure granted (`access.granted`) or refused (`access.refused`); POA validated (`access.poa.validated`) or rejected (`access.poa.rejected`) | Before disclosure (internal: real-time gate) |
| Authentication fails on information request | Failed attempt count (`member_credential.failed_attempts`), channel, member ID (`entity.id`) | Disclosure refused and logged (`access.refused`); failed attempt recorded | Immediate — no disclosure until authentication succeeds |
| Government request for financial records received (`legal.process.received`) | Legal process artifact (`legal.process_artifact_id`), RFPA applicability flag (`legal.rfpa_applicable`), Legal sign-off | RFPA review completed; member notice issued if required (`notice.sent`); response authorized or challenged | Per RFPA timeline; member notice before disclosure where required by [12 USC §3405](https://www.law.cornell.edu/uscode/text/12/3405) |
| Member requests privacy notice copy (`privacy.notice_copy.requested`) | Member identity (`entity.id`), delivery channel (`member.delivery_channel`) | Notice copy delivered (`privacy.notice_copy.delivered`) | 10 days (enforced by `privacy.notice_copy_due_at`) |

**ALERTS/METRICS:** Alert fires on any disclosure event lacking a preceding successful authentication record. Target: zero unauthenticated disclosures. Failed authentication rate by channel monitored weekly; spikes trigger Red Flags review.

---

## PR-05 — Data Accuracy and Corrections {#pr-05-data-accuracy-and-corrections}

**WHY (Reg cite):** [FCRA/Reg V (12 CFR Part 1022)](https://www.ecfr.gov/current/title-12/part-1022) and [NCUA Part 717](https://www.ecfr.gov/current/title-12/part-717) require furnishers to investigate and correct inaccurate consumer information and to handle address discrepancies. [NCUA Part 748](https://www.ecfr.gov/current/title-12/part-748) requires safeguards for member information integrity. The [FACTA address-discrepancy rule (12 CFR §1022.82)](https://www.ecfr.gov/current/title-12/part-1022#p-1022.82) requires reasonable policies for address discrepancies received from consumer reporting agencies.

**SYSTEM BEHAVIOR:** When a data correction is identified — whether from a member dispute, internal audit, or bureau feedback — the system propagates the correction to all internal systems and, for bureau-reported items, to prior recipients where applicable, within 30 days. The `correction.propagation.due_at` timer enforces this deadline. USPS/NCOA address mismatches (`address.ncoa_mismatch`) are detected automatically and routed immediately to the Red Flags program (`redflag.detected`) for disposition before any address-dependent action (e.g., card reissue) proceeds. Address discrepancies received from consumer reporting agencies are handled per the FACTA address-discrepancy rule: Pynthia forms a reasonable belief about the correct address before furnishing and flags the discrepancy for member notification where required. The `correction.propagated` field is write-restricted to the Data Governance/Privacy Operations team; corrections require documented evidence (`correction.evidence_artifact_id`).

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Data correction identified — bureau-reported item (`furnishing.correction.identified`) | Correction details, evidence artifact (`correction.evidence_artifact_id`), affected systems list, prior recipient list | Correction propagated to all systems and prior recipients (`correction.propagated`); propagation log entry created | 30 days (enforced by `correction.propagation.due_at`) |
| NCOA/USPS address mismatch detected (`address.ncoa_mismatch.detected`) | Member ID (`entity.id`), old address (`address.line1`, `address.postal_code`), NCOA candidate (`address.ncoa_candidate`), mismatch flag (`address.ncoa_mismatch`) | Red Flags case opened (`redflag.detected`); address-dependent actions blocked pending disposition | Immediate routing (internal: same processing cycle; Red Flags disposition per `redflag.review_due_at`) |
| Address discrepancy received from consumer reporting agency (`bureau.address_discrepancy.received`) | Bureau discrepancy artifact (`bureau.discrepancy_artifact_id` — provisional), member ID (`entity.id`), reported address vs. file address | Reasonable-belief determination logged; member notified if required (`notice.sent`); furnishing corrected if needed (`furnishing.correction.applied`) | Reasonable time before next furnishing cycle (internal: within current furnishing cycle; `furnishing.cycle_due_at`) |
| Member disputes accuracy of information on file (`dispute.opened`) | Dispute basis (`dispute.basis`), member ID (`entity.id`), disputed data category | Investigation opened (`dispute.investigation.completed`); correction applied if substantiated (`furnishing.correction.applied`); member notified of outcome | 30 days investigation (enforced by `dispute.investigation_due_at`); furnishing correction within next cycle |

**ALERTS/METRICS:** Alert fires if any `correction.propagation.due_at` timer reaches T−5 business days without a confirmed `correction.propagated` event. NCOA mismatch queue monitored daily; any item aged beyond 2 business days without Red Flags disposition triggers escalation. Target: zero bureau-reported corrections propagated beyond 30 days.

---

## PR-06 — Employee Access Minimization and Training {#pr-06-employee-access-minimization-and-training}

**WHY (Reg cite):** [NCUA Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires that credit unions implement access controls, including need-to-know restrictions, and that employees receive training on information security and privacy obligations. Least-privilege access and timely revocation on separation are core safeguard requirements.

**SYSTEM BEHAVIOR:** All access to NPPI is governed by role-based access control (RBAC). Roles are defined by the minimum access necessary for the job function (`access.role_entitlements`). Quarterly access reviews (`privacy.access_review_due`) require managers to attest that each direct report's access remains appropriate; unattested roles are automatically flagged for suspension. Upon employee termination or separation, all NPPI-system access must be deprovisioned within 24 hours (`access.deprovision.due_at`). New hires complete privacy training during onboarding (`training.onboarding.due_at`); all staff complete annual privacy training (`training.privacy_due`). Training completion is recorded per individual (`training.completion.recorded`). Separation-triggered deprovisioning is initiated by HR's `employee.separated` event and is write-restricted to Information Security/IT; Compliance receives a daily exception report of any deprovisioning not completed within the 24-hour window.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Employee hired or role changed (`employee.hired` or `employee.role.changed`) | Employee ID (`employee.id`), role (`user.role`), required access scope (`access.role_entitlements`), hire date (`training_detail.hire_date`) | Access provisioned (`access.provisioned`); onboarding privacy training assigned (`training.assignment.created`) | Access: same day; training: within onboarding window (enforced by `training.onboarding.due_at`) |
| Employee separated (`employee.separated`) | Employee ID (`employee.id`), separation date, system access roster (`access.user_roster`) | All NPPI-system access deprovisioned (`access.deprovisioned`); deprovisioning logged | 24 hours (enforced by `access.deprovision.due_at`) |
| Quarterly access review cycle opens (`privacy.access_review_due`) | Role matrix (`access.reviewer_roster`), current entitlements (`access.role_entitlements`), last review date (`access.last_reviewed_at`) | Access review completed and attested (`access.review.completed`); unattested roles flagged for suspension | Quarterly (enforced by `privacy.access_review_due_at`) |
| Annual privacy training cycle opens (`training.annual_cycle.opened`) | Employee roster, curriculum version (`training.curriculum_id`), prior completion records | Training assigned (`training.annual.assigned`); completion recorded (`training.completion.recorded`) | Annually (enforced by `training.privacy_due`) |

**ALERTS/METRICS:** Alert fires on any `access.deprovision.due_at` timer that expires without a confirmed `access.deprovisioned` event — these are P1 exceptions reported to Compliance and CISO within 1 hour. Quarterly access review completion rate target: 100% within the review window. Annual privacy training completion rate target: 100% by cycle close; non-completions escalated to department heads at T+30 days.

---

## PR-07 — Third-Party Oversight and Contracts {#pr-07-third-party-oversight-and-contracts}

**WHY (Reg cite):** [Reg P §1016.13](https://www.ecfr.gov/current/title-12/part-1016#p-1016.13) requires that service-provider and joint-marketing exceptions be supported by contracts with confidentiality obligations. [NCUA Part 748](https://www.ecfr.gov/current/title-12/part-748) requires that credit unions oversee vendors with access to member information and ensure contractual safeguards. Subprocessor flow-down obligations derive from the same GLBA confidentiality framework.

**SYSTEM BEHAVIOR:** No vendor may receive NPPI until: (1) due diligence is completed and documented (`vendor.due_diligence.approved`), (2) a GLBA confidentiality addendum is verified in the contract (`vendor.glba_addendum_id`, `vendor.glba_clause.verified`), (3) a data map is on file (`vendor.data_map_id`), and (4) subprocessor flow-down attestation is received (`vendor.subprocessor_attestation`). The system enforces a pre-transfer gate (`vendor.privacy.blocked`) until all four conditions are met. Annual privacy reviews (`vendor.annual.review.due_at`) reassess each vendor's data scope, contract terms, and monitoring results. Continuous monitoring alerts (`vendor.monitoring.alert`) are routed to Privacy Operations for triage. Vendor data deletion attestation (`vendor.data_deletion_attestation`) is required upon contract termination. This control covers only privacy-specific vendor obligations; broader vendor lifecycle management is governed by the Third-Party Risk Policy. The `vendor.glba_addendum_id` and `vendor.data_map_id` fields are write-restricted to Compliance and Legal.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Vendor onboarding initiated for NPPI-access vendor (`vendor.onboarding.started`) | Due diligence package (`vendor.due_diligence_artifact_id`), GLBA addendum (`vendor.glba_addendum_id`), data map (`vendor.data_map_id`), subprocessor attestation (`vendor.subprocessor_attestation`) | Due diligence approved (`vendor.due_diligence.approved`); GLBA clause verified (`vendor.glba_clause.verified`); data transfer gate lifted (`vendor.privacy.blocked` cleared) | Before first data transfer (internal: gate enforced until all four conditions confirmed) |
| Annual vendor privacy review cycle opens (`vendor.annual.review.due_at`) | Prior review results, current contract terms (`vendor.contract_clauses`), data map (`vendor.data_map_id`), monitoring findings (`vendor.monitoring.alert`) | Annual review completed (`vendor.review.completed`); findings logged; remediation opened if required (`vendor.cap.issued`) | Annually (enforced by `vendor.annual_review_due_at`) |
| Continuous monitoring alert fires (`vendor.monitoring.alert`) | Alert details (`vendor.issue_detail`), severity (`vendor.issue_severity`), affected data scope (`vendor.data_scope`) | Alert triaged (`vendor.incident.triage.due`); escalation issued if high severity (`vendor.cap.issued`) | Triage within 2 business days (enforced by `vendor.incident_triage_due`) |
| Vendor contract terminated (`vendor.termination.initiated`) | Vendor ID (`vendor.id`), data deletion attestation (`vendor.data_deletion_attestation`), destruction certificate (`vendor.destruction_certificate`) | Data deletion attested and logged; destruction certificate recorded (`disposal.certificate.recorded`) | Per contract termination timeline; deletion attestation within 30 days of termination |

**ALERTS/METRICS:** Alert fires if any vendor with `vendor.npi_access_flag = true` reaches its `vendor.annual_review_due_at` without a completed `vendor.review.completed` event. Target: zero NPPI-access vendors without a current (≤12-month) privacy review. Monitoring alert triage backlog target: zero items aged beyond 2 business days.

---

## PR-08 — Secure Disposal of NPPI {#pr-08-secure-disposal-of-nppi}

**WHY (Reg cite):** The [FACTA Disposal Rule (16 CFR Part 682)](https://www.ecfr.gov/current/title-16/part-682) requires reasonable measures for the disposal of consumer report information and derived records. [NCUA Part 748](https://www.ecfr.gov/current/title-12/part-748) requires safeguards for member information throughout its lifecycle, including at disposal. Legal holds pause the retention clock until released.

**SYSTEM BEHAVIOR:** When a record's retention period expires (`record.retention.expired`), the system schedules certified destruction within 90 days (`record.disposal.due_at`). Destruction applies to paper, electronic media, and data-at-rest and must use a method appropriate to the media type (`disposal.method`). A certificate of destruction is required for every disposal batch (`disposal.certificate`), and the batch manifest ID (`disposal.batch_manifest_id`) is logged. Legal holds (`record.legal_hold_flag`) pause the retention clock; the clock resumes only after the hold is formally released (`legal_hold.clear.confirmed`) and `disposal.clock_resumed` is set. Disposal is blocked for any record under an active legal hold. The `record.disposal_eligible` flag and `record.disposal.due_at` timer are managed by the Records/Privacy Operations team; manual overrides require documented Legal approval. Detailed retention schedules and non-NPPI disposal timing are governed by the Record Retention Policy.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Retention period expires for NPPI record (`record.retention.expired`) | Record ID (`record.id`), retention class (`record.retention_class`), legal hold flag (`record.legal_hold_flag`), media type (`record.media_type`) | Disposal scheduled (`disposal.scheduled`); disposal-eligible flag set (`record.disposal_eligible = true`); legal hold check performed | Disposal must complete within 90 days of expiry (enforced by `record.disposal.due_at`) |
| Disposal executed — paper, media, or data (`disposal.executed`) | Batch manifest (`disposal.batch_manifest_id`), disposal method (`disposal.method`), destruction vendor if external | Certificate of destruction recorded (`disposal.certificate.recorded`); destruction log entry created (`destruction_log.entry.created`) | Within 90 days of retention expiry (enforced by `record.disposal.due_at`) |
| Legal hold placed on NPPI record (`record.hold.placed`) | Hold matter ID (`legal_hold.matter_id`), hold scope (`legal_hold.hold_scope`), authorizer | Disposal clock paused (`disposal.held`); legal hold flag set (`record.legal_hold_flag = true`) | Immediate upon hold placement |
| Legal hold released (`legal_hold.clear.confirmed`) | Hold release authorization (`legal_hold.release_approved_by`), matter ID (`legal_hold.matter_id`) | Disposal clock resumed (`disposal.clock_resumed`); new `record.disposal.due_at` computed from release date | Immediately upon release; 90-day disposal window restarts |

**ALERTS/METRICS:** Alert fires if any `record.disposal.due_at` timer expires without a confirmed `disposal.executed` event — these are reported to Compliance and Records Management within 24 hours. Target: zero NPPI records disposed beyond 90 days of retention expiry (excluding active legal holds). Monthly destruction log reconciliation (`destruction_log.mismatch.detected`) reviewed by Privacy Operations.

---

## PR-09 — Incident Detection, Classification, and SAR Referral {#pr-09-incident-detection-classification-and-sar-referral}

**WHY (Reg cite):** [NCUA Part 748, Appendix B](https://www.ecfr.gov/current/title-12/part-748) requires a written incident-response program covering detection, containment, and notification. State breach notification laws impose jurisdiction-specific clocks. The Bank Secrecy Act (31 USC §5318) and [NCUA Part 748](https://www.ecfr.gov/current/title-12/part-748) require SAR filing where criminal activity is suspected in connection with a breach. This control feeds the reportability determination in [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification).

**SYSTEM BEHAVIOR:** Upon detection of a potential privacy incident, an incident record is created and assigned a severity (`incident.severity`). The triage clock starts immediately (`incident.triage.due_at`). Classification determines whether NPPI was involved (`incident.data_scope`), the likelihood of misuse (`incident.misuse_likelihood`), and whether criminal activity is suspected (`incident.criminal_suspected`). If criminal activity is suspected, the incident is referred to the BSA/AML Officer for SAR evaluation (`incident.sar_referred`); SAR filing mechanics are governed by the BSA Policy. State breach notification clocks are set based on the jurisdiction(s) of affected members (`incident.notification_due_at`); Privacy and Legal jointly determine the applicable clock. The reportability determination for NCUA purposes (`incident.reportability_determination`) is passed to [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification) for the regulatory notification and member-notice workflow. Privacy Operations and Legal are required participants in all privacy-incident triage; the `incident.legal_review` and `incident.cco_signoff` fields are write-restricted to Legal and the CCO respectively.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Potential privacy incident detected (`incident.detected`) | Detection source (`incident.detection_source`), initial scope (`incident.scope_initial`), description (`incident.description`) | Incident created (`incident.created`); severity assigned (`incident.severity.assigned`); triage clock started (`incident.triage.due_at`) | Immediate upon detection (internal: triage SLA enforced by `incident.triage.due_at`) |
| Incident triaged and classified (`incident.classified`) | Data scope (`incident.data_scope`), misuse likelihood (`incident.misuse_likelihood`), criminal suspicion flag (`incident.criminal_suspected`), affected member count (`incident.member_impact`), jurisdiction(s) | Classification recorded; state breach notification clock set (`incident.notification_due_at`); reportability determination initiated (`incident.reportability_determination`); SAR referral if criminal activity suspected (`incident.sar_referred`) | Within triage SLA (enforced by `incident.triage.due_at`); state clocks set at classification |
| Criminal activity suspected in connection with breach (`incident.criminal_suspected` = true) | Incident ID (`incident.id`), BSA referral basis, BSA Officer ID | SAR referral logged (`incident.sar_referred`); BSA Officer notified; SAR evaluation per BSA Policy (`sar.filing.timer`) | Immediate referral; SAR filing per BSA Policy timeline |
| State breach notification clock expires (`incident.notification_due_at`) | Affected member list, notice template (`incident.notice_template_id`), state-specific content (`incident.notice_content`), Legal sign-off | Member notices sent (`incident.member_notices.sent`); regulator notified per state law (`incident.regulator.notified`); notification logged | Per applicable state clock (enforced by `incident.notification_due_at`); feeds SC-01 for NCUA notification |

**ALERTS/METRICS:** Alert fires if any `incident.triage.due_at` timer expires without a confirmed `incident.classified` event. State breach notification clocks at T−2 days trigger P1 escalation to Privacy, Legal, and the CCO. SAR referral queue monitored daily by BSA/AML Officer. Target: zero state notification deadlines missed.

---

## SC-01 — NCUA Reportable Cyber-Incident & Member Notification {#sc-01-ncua-reportable-cyber-incident-member-notification}

**WHY (Reg cite):** [NCUA Part 748, Appendix B](https://www.ecfr.gov/current/title-12/part-748) requires federally insured credit unions to notify NCUA of reportable cyber incidents "as soon as possible" and no later than 72 hours after the credit union reasonably believes a reportable cyber incident has occurred. Member notification must follow without unreasonable delay once misuse is determined or reasonably likely. State breach-notification laws impose concurrent or shorter clocks and are tracked in [PR-09](#pr-09-incident-detection-classification-and-sar-referral).

**SYSTEM BEHAVIOR:** When the incident-response team determines that an incident meets the NCUA reportability threshold — unauthorized access to, or disruption of, member information systems or member financial information — the `incident.reportability_determination` field is set and the 72-hour NCUA notification clock begins (`incident.ncua.notice.due_at`). The CCO must sign off on the reportability determination (`incident.cco_signoff`) before the NCUA notification is filed. Member notification is required without unreasonable delay once `incident.misuse.determined` is set to true or misuse is reasonably likely; the `incident.member_notice_required` boolean gates the member-notice workflow. The `incident.notification_due_at` field tracks the earliest applicable state or federal deadline. All notification artifacts — NCUA filing, member notice template, and delivery records — are retained in the incident record. This control receives its trigger from [PR-09](#pr-09-incident-detection-classification-and-sar-referral); the two controls are linked but not merged. The `incident.reportability_determination` and `incident.cco_signoff` fields are write-restricted to the CCO and designated Privacy/Legal staff.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Reportability determination made (`incident.reportable.determined`) | Incident ID (`incident.id`), reportability rationale (`incident.reportability_rationale`), data scope (`incident.data_scope`), CCO sign-off (`incident.cco_signoff`), NCUA notification due (`incident.ncua.notice.due_at`) | Reportability determination recorded (`incident.reportability_determination`); NCUA notification clock started (`incident.ncua.notice.due_at`); NCUA notified (`incident.ncua.notified`) | 72 hours from reasonable belief of reportable incident (enforced by `incident.ncua.notice.due_at`) |
| Misuse determined or reasonably likely (`incident.misuse.determined`) | Misuse likelihood assessment (`incident.misuse_likelihood`), affected member list (`incident.member_impact`), notice template (`incident.member_notice_template`), `incident.member_notice_required = true` | Member notice workflow initiated; member notices sent (`incident.member_notices.sent`); delivery logged | Without unreasonable delay (enforced by `incident.notification_due_at`; state clocks from PR-09 apply concurrently) |
| NCUA notification sent (`incident.ncua.notified`) | NCUA notification content, incident summary (`incident.summary_id`), CCO sign-off (`incident.cco_signoff`) | NCUA notification filed and logged (`ncua.notification.sent`); NCUA acknowledgement tracked (`ncua.ack.received`) | Within 72 hours of reportability determination (enforced by `incident.ncua.notice.due_at`) |
| Incident closed post-notification (`incident.closed`) | Postmortem completed (`incident.postmortem.completed`), root cause (`incident.root_cause`), remediation evidence | Incident closed (`incident.closed`); quarterly summary updated (`incident.quarterly_summary`); board ad-hoc report if material (`privacy.board_adhoc.delivered`) | Postmortem within 30 days of containment (internal SLA) |

**ALERTS/METRICS:** Alert fires at T−12 hours before `incident.ncua.notice.due_at` if NCUA notification has not been filed. Member-notice delivery failures (`member.delivery.failed`) trigger immediate re-routing to an alternate channel. Target: 100% of reportable incidents notified to NCUA within 72 hours; zero member-notice delivery failures unresolved beyond 24 hours.

---

## PR-10 — Recordkeeping, Complaints, and Board Reporting {#pr-10-recordkeeping-complaints-and-board-reporting}

**WHY (Reg cite):** [NCUA Part 748](https://www.ecfr.gov/current/title-12/part-748) requires that credit unions maintain records sufficient to demonstrate compliance with their information-security and privacy programs and report material incidents and program status to the Board. Centralized complaint logging supports examination readiness and trend analysis.

**SYSTEM BEHAVIOR:** All privacy-program artifacts — notices, opt-out records, disclosure logs, access logs, training records, incident records, and vendor privacy reviews — are centralized in the privacy records system with retention anchors set per the Record Retention Policy. Privacy complaints received through any channel are logged as `complaint.privacy` records with acknowledgement, investigation, and resolution timers. Complaint trends are reviewed quarterly and reported to the Board annually (`privacy.board_report_due_at`) and ad hoc for material incidents (`privacy.board_adhoc.delivered`). The annual Board report includes: notice delivery metrics, opt-out volumes, disclosure exception counts, access-review completion rates, training completion rates, vendor privacy review status, incident summary, and complaint trends. The `privacy.metrics_package_id` field links the board report to its underlying data. Board report drafts are write-restricted to the CCO; the Board package is distributed by the CCO or designee.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Privacy complaint received through any channel (`complaint.privacy.received`) | Complaint narrative (`complaint.narrative`), channel (`complaint.channel`), member ID (`complaint.member_id`), category (`complaint.category`) | Complaint logged (`complaint.logged`); acknowledgement sent (`complaint.acknowledged`); investigation opened | Acknowledgement per SLA (enforced by `complaint.ack_due_at`); resolution per `complaint.resolution.due_at` |
| Privacy complaint resolved (`complaint.resolved`) | Investigation notes (`complaint.investigation_notes`), root cause tag (`complaint.root_cause_tag`), resolution outcome | Final response sent (`complaint.final_response.sent`); complaint closed (`complaint.resolved`) | Per `complaint.final_response.due_at` |
| Annual Board privacy report cycle opens (`privacy.board_report_due_at`) | Metrics package (`privacy.metrics_package_id`), notice delivery stats, opt-out counts, incident summary, training completion, vendor review status | Board privacy report delivered (`privacy.board_report.delivered`) | Annually (enforced by `privacy.board_report_due_at`) |
| Material privacy incident occurs (feeds from [SC-01](#sc-01-ncua-reportable-cyber-incident-member-notification)) | Incident summary (`incident.summary_id`), impact assessment (`incident.impact_summary`), CCO sign-off | Ad-hoc Board notification delivered (`privacy.board_adhoc.delivered`) | Without unreasonable delay after material determination |

**ALERTS/METRICS:** Alert fires if any `complaint.ack_due_at` timer expires without a confirmed `complaint.acknowledged` event. Complaint aging dashboard reviewed weekly by Privacy Operations. Annual Board report must be delivered before the first Board meeting of each calendar year. Target: zero privacy complaints unacknowledged beyond SLA; zero Board reports delivered late.

---

## PR-11 — Website Posting and E-SIGN Delivery {#pr-11-website-posting-and-e-sign-delivery}

**WHY (Reg cite):** [Reg P §1016.9(b)](https://www.ecfr.gov/current/title-12/part-1016#p-1016.9) permits electronic delivery of privacy notices when the consumer agrees. [15 USC §7001](https://www.law.cornell.edu/uscode/text/15/7001) (E-SIGN) requires that e-consent be affirmatively obtained and that the consumer be able to access the notice in a form they can retain. ADA accessibility requirements apply to the website notice under [28 CFR Part 36](https://www.ecfr.gov/current/title-28/part-36).

**SYSTEM BEHAVIOR:** The current approved privacy notice is posted on Pynthia's website in an ADA-accessible format (`privacy.ada_validation_id`). The website notice is updated whenever a revised notice is approved (`privacy.website_notice.updated`). For electronic delivery of notices, the system captures and retains e-consent artifacts (`privacy.esign_consent`, `entity.esign_consent`) before delivering electronically; if e-consent is absent or withdrawn, the system falls back to paper delivery. E-consent artifacts include the consent timestamp, method, and access confirmation (`privacy.esign_access_confirmation`). Notice copy requests submitted online are fulfilled within 10 days (see [PR-01](#pr-01-privacy-notice-lifecycle)). The `privacy.ada_validation_id` field is updated by the Web/IT team upon each notice revision and validated by Compliance before publication. The website notice version must match the current approved template (`privacy.notice_template_id`); mismatches trigger an alert.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Revised privacy notice approved for publication (`privacy.notice.revised`) | Approved template (`privacy.notice_template_id`), ADA validation ID (`privacy.ada_validation_id`), CCO sign-off | Website notice updated (`privacy.website_notice.updated`); ADA validation confirmed; publication timestamp logged | Before revised notice takes effect (internal: same day as approval) |
| Member initiates e-consent for electronic notice delivery (`privacy.esign_consent.started`) | Member identity (`entity.id`), consent method, access confirmation (`privacy.esign_access_confirmation`), e-consent artifact | E-consent recorded (`privacy.esign_consent.recorded`); consent artifact retained with timestamp | Before first electronic delivery |
| Member withdraws e-consent | Member identity (`entity.id`), withdrawal timestamp, prior consent artifact | E-consent cleared; delivery channel reverted to paper (`member.channel_reverted`); withdrawal logged | Immediate; next notice delivered by paper |
| Website notice version mismatch detected (internal audit) | Current website version, current approved template (`privacy.notice_template_id`) | Mismatch alert fired; website updated to current template (`privacy.website_notice.updated`) | Remediation within 1 business day of detection |

**ALERTS/METRICS:** Automated daily check compares the live website notice version against `privacy.notice_template_id`; mismatch triggers a P2 alert to Web/IT and Compliance. E-consent artifact retention verified quarterly. Target: zero days where the website notice is out of sync with the current approved template.

---

## PR-12 — State Privacy Rights: Universal Floor {#pr-12-state-privacy-rights-universal-floor}

**WHY (Reg cite):** California Consumer Privacy Act as amended by CPRA ([Cal. Civ. Code §1798.100 et seq.](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1798.100.&lawCode=CIV)) establishes rights to access, delete, correct, and limit use of sensitive personal information. Vermont [9 V.S.A. §2430 et seq.](https://legislature.vermont.gov/statutes/section/09/062/02430) and Nevada [NRS §603A](https://www.leg.state.nv.us/NRS/NRS-603A.html) impose marketing-sharing limits. Pynthia applies CPRA-equivalent standards as a universal floor for all members regardless of state of residence, covering non-GLBA data only (GLBA NPPI is governed by Reg P controls above).

**SYSTEM BEHAVIOR:** Non-GLBA data (marketing telemetry, website interaction data, and similar) is segregated from GLBA NPPI in the data classification system (`privacy.data_classification`). All members — regardless of state — may exercise access, deletion, correction, and sensitive-PI-use-limitation rights against non-GLBA data. Requests are received through the privacy rights portal or by written request, logged as `privacy.state_request.received`, and fulfilled within 45 days (extendable by 45 days with notice). Data minimization and purpose limitation are enforced at collection: the `privacy.collection_vector` field documents the stated purpose for each data category, and data may not be used beyond that purpose without a new consent or legal basis. Sensitive personal information (as defined under CPRA) is subject to use-limitation rights; the `privacy.optout_scope` field tracks sensitive-PI-use-limitation elections. Vermont opt-in status (`privacy.vt_optin_status`) and Nevada opt-out enforcement (`privacy.nv_optout_enforced`) are tracked separately. The `privacy.state_request_type` and `privacy.state_request_fulfilled` fields are write-restricted to Privacy Operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| State rights request received — access, delete, correct, or limit (`privacy.state_request.received`) | Member identity (`entity.id`), request type (`privacy.state_request_type`), data category, verification of identity | Request logged; identity verified; fulfillment clock started (`privacy.state_request_due_at`) | 45 days (extendable by 45 days with notice; enforced by `privacy.state_request_due_at`) |
| State rights request fulfilled (`privacy.state_request_fulfilled`) | Request ID, fulfillment evidence, data corrected/deleted/disclosed/limited as applicable | Fulfillment recorded (`privacy.state_request_fulfilled`); member notified of outcome | Within 45-day window (enforced by `privacy.state_request_due_at`) |
| Sensitive-PI use-limitation election received (`privacy.optout.received` with sensitive-PI scope) | Member identity (`entity.id`), sensitive-PI categories, opt-out scope (`privacy.optout_scope`) | Sensitive-PI use limited (`privacy.optout_enforced`); election logged | Immediate (same processing cycle) |
| Vermont opt-in check required before non-GLBA marketing sharing (`disclosure.vt_optin_check`) | Vermont residency indicator (`entity.jurisdiction`), opt-in status (`privacy.vt_optin_status`) | Opt-in verified (`disclosure.vt_optin_enforced`); sharing blocked if opt-in absent | Before sharing (internal: gate enforced at disclosure initiation) |

**ALERTS/METRICS:** Alert fires if any `privacy.state_request_due_at` timer reaches T−5 days without a confirmed `privacy.state_request_fulfilled` event. Monthly dashboard shows request volume by type and fulfillment rate. Target: 100% of state rights requests fulfilled within the 45-day window; zero sensitive-PI use-limitation elections not honored within the same processing cycle.

---

## PR-13 — Cookies and Online Tracking {#pr-13-cookies-and-online-tracking}

**WHY (Reg cite):** California/CPRA ([Cal. Civ. Code §1798.135](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1798.135.&lawCode=CIV)) requires a "Do Not Sell or Share" opt-out mechanism and recognition of the Global Privacy Control (GPC) signal for California users. Non-essential tracking technologies require consent where required by applicable law. This control applies to non-GLBA data only.

**SYSTEM BEHAVIOR:** Pynthia's website and online banking portal operate a cookie banner and preference center. Non-essential tags (analytics, advertising, and social-media pixels) are blocked by default until the member or visitor grants consent (`web.consent_state`). For California users, the GPC signal (`web.gpc_signal`) is detected and honored automatically as a Do-Not-Sell/Share election without requiring additional action by the user. Tag vendors are reviewed and approved before deployment (`web.tag.approved`); unapproved tags are blocked (`web.tag.rejected`). The tag data scope (`web.tag_data_scope`) is documented for each approved vendor. Tag reviews are conducted at least annually (`web.tag_review`). The `web.consent_state` and `web.tags_gated` fields are managed by the Web/IT team; changes to the approved tag list require Compliance sign-off.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Visitor session starts on Pynthia website or portal (`web.session.started`) | Visitor ID (`web.visitor_id`), jurisdiction (`web.visitor_jurisdiction`), prior consent state (`web.consent_state`), GPC signal (`web.gpc_signal`) | Consent state evaluated; non-essential tags gated (`web.tags_gated`) until consent; GPC signal honored for CA users as Do-Not-Sell/Share | Immediate — same session (no regulatory deadline; internal SLA: real-time) |
| Member or visitor grants or updates cookie consent (`web.consent.recorded`) | Consent choices, visitor ID (`web.visitor_id`), consent timestamp | Consent recorded (`web.consent.recorded`); tag gating updated (`web.tags_gated`); consent artifact retained | Immediate |
| GPC signal detected for California user (`web.gpc_signal` set) | Visitor jurisdiction (`web.visitor_jurisdiction = CA`), GPC signal value | Do-Not-Sell/Share election applied (`privacy.optout_enforced`); GPC signal logged (`web.consent.recorded`) | Immediate — same session |
| New tag vendor proposed for deployment (`web.tag_review.requested`) | Tag vendor ID (`web.tag_vendor_id`), data scope (`web.tag_data_scope`), Compliance review | Tag approved (`web.tag.approved`) or rejected (`web.tag.rejected`); approval logged | Before deployment (internal: Compliance review within 5 business days of request) |

**ALERTS/METRICS:** Automated scan detects any non-essential tag firing without a prior consent record — these are P1 control failures reported to Web/IT and Compliance within 1 hour. Annual tag inventory review completion tracked. Target: zero non-essential tags firing without consent; zero unapproved tags in production.

---

## PR-14 — Third-Party App and Account Connections {#pr-14-third-party-app-and-account-connections}

**WHY (Reg cite):** [NCUA Part 748](https://www.ecfr.gov/current/title-12/part-748) requires safeguards for member information shared through third-party connections. [Reg P §1016.13](https://www.ecfr.gov/current/title-12/part-1016#p-1016.13) requires that service-provider exceptions be supported by contractual confidentiality obligations. Member-authorized data sharing through APIs (e.g., open banking, financial aggregators) must be scoped to the consented purpose and revocable.

**SYSTEM BEHAVIOR:** Member-authorized API connections are established only after explicit consent is captured (`connection.consent.granted`), specifying the permitted data scope and purpose. Tokens are issued with purpose-limited scopes (`connection.scope_violation.detected` fires if a token is used beyond its consented scope). Members may revoke any connection at any time through the portal or by request; revocation is immediate (`connection.token_revoked`). Scope violations are detected in real time and result in token suspension (`connection.suspended`) and member notification. Third-party apps accessing member data through API connections must have a GLBA confidentiality clause on file (see [PR-07](#pr-07-third-party-oversight-and-contracts)). Reuse of member data beyond the consented scope by the third party is prohibited and constitutes a vendor incident. The `connection.consent` and `connection.token_revoked` fields are write-restricted to the API gateway/IT team; Compliance receives a daily report of scope violations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member authorizes third-party API connection (`connection.consent.granted`) | Member identity (`entity.id`), third-party app identity (`connection.party_id`), consented data scope, purpose, consent artifact | Consent recorded (`connection.consent.granted`); purpose-limited token issued (`connection.token.issued`); access log entry created (`connection.access_log_id`) | Before token issued (internal: consent captured in same session) |
| Scope violation detected — token used beyond consented scope (`connection.scope_violation.detected`) | Token ID, requested scope vs. consented scope, third-party app ID (`connection.party_id`) | Token suspended (`connection.suspended`); scope violation logged; member notified; vendor incident opened | Immediate — real-time detection |
| Member revokes API connection (`connection.revoke.requested`) | Member identity (`entity.id`), connection ID (`connection.id`), revocation timestamp | Token revoked immediately (`connection.token_revoked`); revocation logged | Immediate |
| Annual review of active API connections | Active connection list, consent artifacts, data scope per connection | Connections without valid consent or with expired scope reviewed; stale connections revoked | Annually (as part of vendor annual review; see [PR-07](#pr-07-third-party-oversight-and-contracts)) |

**ALERTS/METRICS:** Alert fires on any `connection.scope_violation.detected` event — these are P1 incidents. Daily report of active connections with consent age >12 months reviewed by Privacy Operations. Target: zero scope violations unresolved beyond 1 hour; zero active connections without a current consent artifact.

---

## PR-15 — Biometric Data for KYC {#pr-15-biometric-data-for-kyc}

**WHY (Reg cite):** State biometric privacy laws — including the Illinois Biometric Information Privacy Act ([740 ILCS 14](https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=3004)) and similar statutes — impose collection-consent, retention-limit, and destruction requirements for biometric identifiers. [NCUA Part 748](https://www.ecfr.gov/current/title-12/part-748) requires safeguards for all member information, including biometric data. Where feasible, a non-biometric identity-verification path must be offered.

**SYSTEM BEHAVIOR:** Biometric data (face-match and liveness data) may be used for KYC only under explicit contractual limits with the vendor, with vendor-side storage preferred. Pynthia does not store raw biometric templates internally where vendor-side storage is available. Biometric consent is captured before any biometric collection (`verification.biometric_consent_id`); members who decline biometric verification are offered a non-biometric path (`verification.alt_path_available`). Biometric data is purged per the applicable state biometric law timeline (`verification.biometric.purge.due_at`); the purge is certified (`verification.biometric_purged`). Vendors are prohibited from using biometric data to train models beyond the contracted KYC purpose. Biometric vendor contracts are reviewed as part of [PR-07](#pr-07-third-party-oversight-and-contracts). The `verification.biometric_consent_id` and `verification.biometric.purge.due_at` fields are managed by the Identity/IT team; Compliance reviews purge completion monthly.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member initiates KYC with biometric verification (`verification.biometric.started`) | Member identity (`entity.id`), biometric consent ID (`verification.biometric_consent_id`), alt-path availability (`verification.alt_path_available`) | Consent recorded; biometric verification initiated; purge timer set (`verification.biometric.purge.due_at`) | Consent before collection (internal: real-time gate) |
| Member declines biometric verification (`verification.biometric.declined`) | Member identity (`entity.id`), alt-path flag (`verification.alt_path_available`) | Non-biometric path initiated (`verification.alt_path.started`); declination logged | Immediate — alt path offered in same session |
| Biometric purge timer fires (`verification.biometric.purge.due_at`) | Verification ID (`verification.id`), vendor storage confirmation, purge method | Biometric data purged (`verification.biometric_purged`); purge certificate recorded (`disposal.certificate.recorded`) | Per applicable state biometric law (enforced by `verification.biometric_purge_due_at`) |
| Biometric vendor contract reviewed (`vendor.review.completed` for biometric vendor) | Vendor contract terms, model-reuse prohibition clause, storage-location confirmation, purge SLA | Review completed; model-reuse prohibition confirmed; findings logged | Annually (as part of [PR-07](#pr-07-third-party-oversight-and-contracts) annual vendor review) |

**ALERTS/METRICS:** Alert fires if any `verification.biometric_purge_due_at` timer expires without a confirmed `verification.biometric_purged` event. Monthly purge completion report reviewed by Compliance. Target: zero biometric records retained beyond the applicable state law deadline; 100% of members offered a non-biometric path where feasible.

---

## PR-16 — Children's Data and COPPA {#pr-16-childrens-data-and-coppa}

**WHY (Reg cite):** The [Children's Online Privacy Protection Act (COPPA), 16 CFR Part 312](https://www.ecfr.gov/current/title-16/part-312), prohibits the collection of personal information from children under 13 without verifiable parental consent. Pynthia's services are not directed to children under 13; if minor data is discovered, it must be deleted promptly.

**SYSTEM BEHAVIOR:** Pynthia's online services are not directed to users under 13. Age gates (`privacy.age_gate_ruleset_id`) are implemented at account opening and online enrollment to screen for users under 13; users who trigger the age gate are blocked from proceeding (`privacy.age_gate.blocked`). If minor data is discovered — through a complaint, audit, or system detection — it is flagged immediately (`privacy.minor_data.detected`) and deleted without unreasonable delay (`privacy.minor_data_deleted`). No marketing or profiling data is retained for any user identified as under 13. Parental consent workflows are not offered; the service is treated as not directed to under-13 users. The `privacy.age_gate_ruleset_id` is maintained by the Web/IT team; changes require Compliance approval. Minor-data deletion events are logged and reported to the CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| User triggers age gate at account opening or online enrollment (`privacy.age_gate.blocked`) | User session ID (`web.visitor_id`), age-gate ruleset (`privacy.age_gate_ruleset_id`), date of birth input (`entity.date_of_birth`) | Age gate block logged (`privacy.age_gate.blocked`); user prevented from proceeding; no data retained | Immediate — real-time gate |
| Minor data discovered on existing account or in system (`privacy.minor_data.detected`) | Account or user ID, data categories involved, discovery source | Minor data flagged (`privacy.minor_data.detected`); deletion initiated; CCO notified | Deletion without unreasonable delay (internal: within 5 business days of detection) |
| Minor data deleted (`privacy.minor_data_deleted`) | Deletion scope, deletion method, evidence artifact | Deletion confirmed (`privacy.minor_data_deleted`); deletion log entry created (`destruction_log.entry.created`) | Within 5 business days of detection (internal SLA) |
| Age-gate ruleset updated (`privacy.age_gate_ruleset_id` changed) | New ruleset version, Compliance approval, change rationale | Ruleset update logged; Compliance sign-off recorded | Before deployment |

**ALERTS/METRICS:** Alert fires on any `privacy.minor_data.detected` event — these are P1 items reported to the CCO within 1 hour. Deletion completion tracked; any deletion not confirmed within 5 business days escalates to the CCO and Legal. Target: zero minor data retained beyond 5 business days of discovery.

---

## PR-17 — Anonymization and Aggregation {#pr-17-anonymization-and-aggregation}

**WHY (Reg cite):** [NCUA Part 748](https://www.ecfr.gov/current/title-12/part-748) requires safeguards for member information; use of de-identified data for analytics reduces privacy risk. CPRA-equivalent standards (applied as the universal floor per the General Policy Statement) require that de-identification be documented and that re-identification be prohibited. [12 CFR Part 1022](https://www.ecfr.gov/current/title-12/part-1022) (Reg V) and state privacy laws treat re-identified data as personal information subject to full protections.

**SYSTEM BEHAVIOR:** Analytics and R&D activities may use member data only in documented, non-identifiable form. De-identification methods are registered in the analytics method register (`analytics.deid_method_id`) and reviewed annually (`analytics.method.review.due_at`). Small-cohort thresholds (`analytics.cohort_threshold`) are applied to all aggregate outputs to prevent re-identification by inference. Re-identification of de-identified data is prohibited; any attempt or suspected re-identification is treated as a privacy incident (see [PR-09](#pr-09-incident-detection-classification-and-sar-referral)). Re-identification risk assessments (`analytics.reid_risk_assessment`) are documented for each de-identification method. The `analytics.deid_method_id` and `analytics.cohort_threshold` fields are write-restricted to the Data Governance team with Compliance approval; business units may request analytics datasets but may not modify de-identification parameters.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Analytics dataset requested for R&D or business analytics (`analytics.dataset.requested`) | Requester ID, data scope (`analytics.source_scope`), stated purpose, de-identification method (`analytics.deid_method_id`), cohort threshold (`analytics.cohort_threshold`) | Dataset approved (`analytics.dataset.approved`) or rejected; de-identification method and cohort threshold logged | Before dataset released (internal: Data Governance review within 5 business days) |
| Annual de-identification method review cycle opens (`analytics.method.review.due_at`) | Current method register (`analytics.deid_method_id`), re-identification risk assessments (`analytics.reid_risk_assessment`), prior review results | Method review completed (`analytics.method_review.completed`); methods updated or retired as needed | Annually (enforced by `analytics.method_review_due_at`) |
| Re-identification attempt or suspected re-identification detected | Dataset ID, detection source, data scope | Privacy incident opened (see [PR-09](#pr-09-incident-detection-classification-and-sar-referral)); dataset access suspended | Immediate — treated as privacy incident |
| Cohort threshold breach detected in aggregate output (`analytics.threshold.breached`) | Output dataset, cohort size, threshold value (`analytics.cohort_threshold`) | Output suppressed; breach logged (`analytics.threshold.breached`); Data Governance notified | Immediate — output suppressed before release |

**ALERTS/METRICS:** Alert fires if any `analytics.method.review.due_at` timer expires without a confirmed `analytics.method_review.completed` event. Cohort threshold breach count monitored monthly; target: zero. Any re-identification attempt triggers a P1 privacy incident. Target: 100% of analytics datasets released with a documented, current de-identification method on file.

---

## Governance & Sign-Off {#governance}

| Role | Responsibility |
|---|---|
| **Patrick Wilson, Chief Compliance Officer** | Policy owner; approves all revisions; signs off on reportability determinations (SC-01); receives ad-hoc Board notifications for material incidents |
| **BSA/AML Officer** | Joint governance for SAR referrals from privacy incidents (PR-09); co-owner of incident-response integration |
| **Privacy Operations** | Day-to-day operation of notice lifecycle, opt-out processing, state rights requests, complaint logging, and vendor privacy reviews |
| **Legal** | RFPA compliance review; legal-basis tagging for disclosures; legal hold management; state breach notification clock determination |
| **Information Security / IT** | RBAC enforcement; access deprovisioning; biometric vendor technical controls; API gateway management; website notice publication |
| **Business Owners** | Accountable for data minimization and purpose limitation within their product lines; participate in access reviews |

**Review cadence:** This policy is reviewed annually and whenever a material change in law, regulation, or Pynthia's data-sharing practices occurs. The next scheduled review is 2027-07-01.

**Cross-references:**
- Information Security Policy (detailed safeguards and technical controls)
- Third-Party Risk Policy (vendor lifecycle beyond privacy-specific clauses)
- Record Retention Policy (retention schedules and non-NPPI disposal)
- BSA Policy (SAR filing mechanics)
- Member Policy (account servicing disclosures)
- E-Commerce Policy (electronic delivery channels and online product mechanics)

**Approvals:**

| Approver | Title | Date |
|---|---|---|
| Patrick Wilson | Chief Compliance Officer | __________ |

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional for several privacy-domain fields.** The following codes used in this document are not yet confirmed as registered in `core-vocabulary.json` and should be validated by engineering before the next review: `access.channel` (provisional per DESIGN_NOTES), `bureau.discrepancy_artifact_id` (provisional per DESIGN_NOTES), `privacy.collection_vector`, `privacy.data_classification`, `privacy.sharing_change_basis`, `privacy.vt_optin_status`, `privacy.nv_optout_enforced`, `privacy.optout_scope`, `privacy.optout_channel`, `privacy.optout_enforced`, `privacy.optout_propagated`, `privacy.optout.propagation.due_at`, `privacy.revocation_artifact_id`, `privacy.esign_access_confirmation`, `privacy.ada_validation_id`, `privacy.age_gate_ruleset_id`, `privacy.age_gate.blocked`, `privacy.minor_data_deleted`, `privacy.metrics_package_id`, `privacy.state_request_type`, `privacy.state_request_fulfilled`, `privacy.state_request_due_at`, `privacy.sharing.blocked`, `privacy.annual_exemption_status`, `privacy.notice_template_id`, `privacy.board_adhoc`, `web.gpc_signal`, `web.tag_data_scope`, `web.tag_vendor_id`, `web.tags_gated`, `web.visitor_jurisdiction`, `connection.access_log_id`, `connection.party_id`, `connection.scope_violation`, `connection.suspended`, `connection.token_revoked`, `analytics.deid_method_id`, `analytics.cohort_threshold`, `analytics.reid_risk_assessment`, `analytics.source_scope`, `analytics.method.review.due_at`, `member.channel_reverted`, `member.identity_check_method`, `legal.rfpa_applicable`, `legal.process_artifact_id`, `vendor.data_map_id`, `vendor.subprocessor_attestation`, `vendor.glba_addendum_id`, `vendor.data_deletion_attestation`, `vendor.npi_access_flag`. Registered codes from DESIGN_NOTES (e.g., `privacy.notice.delivered`, `privacy.optout.received`, `privacy.board_report_due_at`, `privacy.annual.notice.due_at`, `privacy.notice_copy_due_at`, `privacy.optout_propagation_due_at`, `privacy.state_request_due_at`, `privacy.access_review_due`, `privacy.board_report.delivered`, `privacy.esign_consent.recorded`, `privacy.notice_copy.delivered`, `privacy.notice_copy.requested`, `privacy.notice.revised`, `privacy.website_notice.updated`, `privacy.minor_data.detected`, `privacy.board_adhoc.delivered`, `privacy.nv_optout.received`, `privacy.optout.cleared`, `privacy.sharing_change_basis`, `web.consent.recorded`, `web.consent_state`, `web.session.started`, `web.tag.approved`, `web.tag.rejected`, `web.tag_review.requested`, `connection.consent.granted`, `connection.revoke.requested`, `connection.token.issued`, `verification.biometric.purge.due_at`, `verification.biometric_consent_id`, `verification.biometric_purged`, `verification.biometric.declined`, `verification.alt_path.started`, `analytics.method_review.completed`, `analytics.dataset.approved`, `analytics.dataset.requested`, `analytics.threshold.breached`, `correction.propagated`, `correction.propagation.due_at`, `correction.evidence_artifact_id`, `address.ncoa_mismatch.detected`, `access.deprovision.due_at`, `access.deprovisioned`, `access.provisioned`, `access.refused`, `access.granted`, `access.poa.validated`, `access.poa.rejected`, `access.poa_artifact_id`, `access.role_entitlements`, `access.reviewer_roster`, `access.last_reviewed_at`, `access.review.completed`, `access.user_roster`, `employee.separated`, `employee.hired`, `employee.role.changed`, `employee.id`, `training.privacy_due`, `training.annual_cycle.opened`, `training.annual.assigned`, `training.completion.recorded`, `training.assignment.created`, `training.onboarding.due_at`, `vendor.onboarding.started`, `vendor.due_diligence.approved`, `vendor.glba_clause.verified`, `vendor.review.completed`, `vendor.annual.review.due_at`, `vendor.incident.triage.due`, `vendor.cap.issued`, `vendor.monitoring.alert`, `vendor.termination.initiated`, `vendor.destruction_certificate`, `vendor.issue_detail`, `vendor.issue_severity`, `vendor.data_scope`, `vendor.contract_clauses`, `vendor.glba_clause`, `vendor.due_diligence_artifact_id`, `record.retention.expired`, `record.disposal.due_at`, `record.legal_hold_flag`, `record.disposal_eligible`, `record.id`, `record.retention_class`, `record.media_type`, `record.hold.placed`, `disposal.scheduled`, `disposal.executed`, `disposal.certificate.recorded`, `disposal.batch_manifest_id`, `disposal.method`, `disposal.held`, `disposal.clock_resumed`, `legal_hold.matter_id`, `legal_hold.hold_scope`, `legal_hold.release_approved_by`, `legal_hold.clear.confirmed`, `destruction_log.entry.created`, `incident.created`, `incident.detected`, `incident.classified`, `incident.triage.due_at`, `incident.severity.assigned`, `incident.data_scope`, `incident.misuse_likelihood`, `incident.criminal_suspected`, `incident.notification_due_at`, `incident.sar_referred`, `incident.reportability_determination`, `incident.reportability_rationale`, `incident.ncua.notice.due_at`, `incident.cco_signoff`, `incident.member_notice_required`, `incident.member_notice_template`, `incident.member_notices.sent`, `incident.ncua.notified`, `incident.postmortem.completed`, `incident.root_cause`, `incident.quarterly_summary`, `incident.summary_id`, `incident.impact_summary`, `incident.notice_template_id`, `incident.notice_content`, `incident.member_impact`, `incident.misuse.determined`, `incident.reportable.determined`, `incident.regulator.notified`, `ncua.notification.sent`, `ncua.ack.received`, `complaint.privacy.received`, `complaint.logged`, `complaint.acknowledged`, `complaint.resolved`, `complaint.final_response.sent`, `complaint.ack_due_at`, `complaint.resolution.due_at`, `complaint.final_response.due_at`, `complaint.narrative`, `complaint.channel`, `complaint.member_id`, `complaint.category`, `complaint.investigation_notes`, `complaint.root_cause_tag`, `disclosure.initiated`, `disclosure.legal_basis`, `disclosure.legal_basis.recorded`, `disclosure.recorded`, `disclosure.vt_optin_check`, `disclosure.vt_optin_enforced`, `furnishing.correction.identified`, `furnishing.correction.applied`, `furnishing.cycle_due_at`, `redflag.detected`, `redflag.review_due_at`, `dispute.opened`, `dispute.basis`, `dispute.investigation.completed`, `dispute.investigation_due_at`, `entity.id`, `entity.esign_consent`, `entity.date_of_birth`, `entity.jurisdiction`, `entity.created`, `account.created`, `member.delivery_channel`, `member.esign_consent_captured`, `member_credential.failed_attempts`, `member.address_hold.expires_at`) are used as registered and do not require re-confirmation.

- **HMDA reporter status not confirmed.** This policy assumes Pynthia is not a HMDA reporter for purposes of this privacy policy. If Pynthia meets the HMDA coverage thresholds, additional HMDA data-sharing and accuracy obligations under 12 CFR Part 1003 should be reviewed for integration.

- **NCUA charter type assumed to be federally insured.** The policy applies NCUA Part 748 and Part 717 on the assumption that Pynthia is a federally insured credit union. If Pynthia is state-chartered and not federally insured, the applicable state-law equivalents should be confirmed with Legal.

- **State biometric law applicability.** The biometric control (PR-15) references state biometric laws generically. The specific states whose laws apply to Pynthia's member base (e.g., Illinois BIPA, Texas, Washington) should be confirmed by Legal and the applicable purge timelines registered in `verification.biometric.purge.due_at` per state.

- **COPPA parental-consent workflow.** This policy treats Pynthia's services as not directed to under-13 users and does not implement a parental-consent workflow. If Pynthia introduces any product or feature that could be directed to minors (e.g., youth savings accounts with online access), a COPPA-compliant parental-consent workflow must be designed and this control updated.

- **Right to Financial Privacy Act (RFPA) notice procedures.** The RFPA control in PR-04 assumes that Legal maintains current RFPA notice templates and challenge procedures. The specific RFPA notice timing and challenge rights under [12 USC §3405](https://www.law.cornell.edu/uscode/text/12/3405) and [§3410](https://www.law.cornell.edu/uscode/text/12/3410) should be confirmed with Legal and documented in the Legal runbook referenced by this policy.

- **Vermont opt-in scope.** Vermont's marketing-sharing opt-in requirement ([9 V.S.A. §2430](https://legislature.vermont.gov/statutes/section/09/062/02430)) applies to sharing with non-affiliated third parties for marketing. The exact categories of sharing subject to Vermont opt-in at Pynthia should be confirmed by Legal and mapped to the `privacy.vt_optin_status` field.

- **Nevada opt-out scope.** Nevada's opt-out right under [NRS §603A.340](https://www.leg.state.nv.us/NRS/NRS-603A.html) applies to "sale" of covered information. Legal should confirm whether any of Pynthia's data-sharing arrangements constitute a "sale" under Nevada law and whether the `privacy.nv_optout_enforced` field needs to gate specific sharing flows.

- **SC-01 shared-control embeddable block.** The SC-01 control above is intended to be byte-identical to the shared control in `shared-controls/ncua-incident-notification.md`. If that file has been updated since this policy was generated, the SC-01 block in this document must be regenerated from the current embeddable block before the next review.

- **Annual exemption evaluation logic.** The §1016.5(e) annual-notice exemption applies when Pynthia has not changed its privacy policies or sharing practices since the last notice and shares only within the enumerated exceptions. The system logic for evaluating `privacy.annual_exemption_status` should be confirmed with Compliance and Legal before the first annual notice cycle.
