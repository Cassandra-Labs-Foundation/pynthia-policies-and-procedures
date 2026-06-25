```yaml
---
title: Privacy Policy (Table-First, Design-Overlay v3)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-07-01
next_review: 2027-07-01
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Privacy, GLBA, Regulation P, NCUA 748, FCRA, FACTA, RFPA, E-SIGN, COPPA, State Privacy]
---
```

# Privacy Policy

## General Policy Statement

Pynthia Credit Union operates a risk-based privacy program that governs how nonpublic personal information (NPPI) of members and consumers is collected, used, disclosed, safeguarded, corrected, and disposed of across all deposit, lending, payment, and online products and all channels. Where two or more applicable laws govern the same data or processing activity, the Credit Union applies the stricter requirement to all members regardless of state of residence; for non-GLBA data, CPRA-equivalent standards (data minimization, purpose limitation, retention disclosure, sensitive-PI limits, and access/deletion/correction rights) serve as the universal floor. All directors, officers, employees, temporary staff, and vendors with access to NPPI are bound by this policy. Detailed information-security safeguards, vendor lifecycle management beyond privacy-specific clauses, record retention schedules beyond NPPI disposal timing, SAR filing mechanics, member account servicing, and electronic-delivery channel mechanics are addressed in their respective policies and are out of scope here.

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Initial privacy notice — new member/consumer relationship | Relationship established (`privacy.notice.delivered`) | At or before relationship starts | Reg P §1016.4 notice | [PR-01](#pr-01-privacy-notice-lifecycle) |
| Annual privacy notice — non-exempt | 12-month anniversary of last notice (`privacy.annual_notice_due_at`) | Every 12 months | Reg P §1016.5 notice | [PR-01](#pr-01-privacy-notice-lifecycle) |
| Revised notice — material change in sharing | Material change identified (`privacy.notice.revised`) | Prior to change taking effect | Reg P §1016.8 notice | [PR-01](#pr-01-privacy-notice-lifecycle) |
| Notice copy on request | Member requests copy (`privacy.notice_copy.requested`) | 10 calendar days | Reg P §1016.9 | [PR-01](#pr-01-privacy-notice-lifecycle) |
| Opt-out suppression — immediate | Opt-out received (`privacy.optout.received`) | Immediate (same business day) | Reg P §1016.7 | [PR-02](#pr-02-opt-out-capture-and-honoring) |
| Opt-out propagation to martech vendors | Opt-out enforced (`privacy.optout_propagation_due_at`) | 30 days | Program standard | [PR-02](#pr-02-opt-out-capture-and-honoring) |
| Permissible disclosure — legal basis tagging | Disclosure initiated (`disclosure.legal_basis.recorded`) | Before data transfer | Reg P §§1016.13–1016.15 | [PR-03](#pr-03-permissible-disclosures-and-exceptions) |
| Member identity verification before disclosure | Access request received (`access.request.received`) | Before disclosure | RFPA; NCUA §748 | [PR-04](#pr-04-member-access-and-authentication) |
| Data accuracy correction — bureau-reported | Correction identified (`correction.propagation_due_at`) | 30 days | Reg V; NCUA Part 717 | [PR-05](#pr-05-data-accuracy-and-corrections) |
| Employee access revocation on termination | Employee separated (`employee.separated`) | 24 hours | NCUA §748 App. A | [PR-06](#pr-06-employee-access-minimization-and-training) |
| Quarterly access review | Review cycle opens (`access.review_due_at`) | Quarterly | NCUA §748 App. A | [PR-06](#pr-06-employee-access-minimization-and-training) |
| Privacy training — onboarding | Employee hired (`employee.hired`) | Within 30 days of hire | NCUA §748 App. A | [PR-06](#pr-06-employee-access-minimization-and-training) |
| Privacy training — annual | Annual cycle opens (`training.annual_due_at`) | Annually | NCUA §748 App. A | [PR-06](#pr-06-employee-access-minimization-and-training) |
| Vendor GLBA addendum — before first data transfer | Vendor onboarding started (`vendor.onboarding.started`) | Before first transfer | Reg P §1016.13; NCUA §748 | [PR-07](#pr-07-third-party-oversight-and-contracts) |
| Vendor annual privacy review | Annual review due (`vendor.annual_review_due_at`) | Annually | Reg P §1016.13; NCUA §748 | [PR-07](#pr-07-third-party-oversight-and-contracts) |
| NPPI disposal — retention expiry | Retention expires (`record.retention_expires_at`) | Within 90 days of expiry | 16 CFR Part 682; NCUA §748 | [PR-08](#pr-08-secure-disposal-of-nppi) |
| Incident detection and triage | Incident detected (`incident.detected`) | Immediate triage | NCUA §748 App. B | [PR-09](#pr-09-incident-response-and-breach-notification) |
| Member breach notification | Notification determination made (`incident.notification_due_at`) | Without unreasonable delay / per state clock | State breach laws; NCUA §748 App. B | [PR-09](#pr-09-incident-response-and-breach-notification) |
| Board privacy report — annual | Annual cycle (`privacy.board_report_due_at`) | Annually | NCUA §748 | [PR-10](#pr-10-recordkeeping-complaints-and-board-reporting) |
| Board privacy report — material incident | Material incident flagged (`privacy.board_adhoc.delivered`) | Ad hoc | NCUA §748 | [PR-10](#pr-10-recordkeeping-complaints-and-board-reporting) |
| Website notice update | Material change in sharing (`privacy.website_notice.updated`) | Before change takes effect | Reg P §1016.9 | [PR-11](#pr-11-website-posting-and-e-sign-delivery) |
| State rights request fulfillment | State request received (`privacy.state_request.received`) | Per applicable state clock (`privacy.state_request_due_at`) | CPRA; Vermont; Nevada | [PR-12](#pr-12-state-privacy-rights-universal-floor) |
| Do Not Sell/Share / GPC signal | GPC signal detected (`web.gpc_signal`) | Immediate | CPRA; Nevada | [PR-12](#pr-12-state-privacy-rights-universal-floor) |
| Analytics/R&D — de-identification review | Annual method review due (`analytics.method_review_due_at`) | Annually | CPRA floor; program standard | [PR-13](#pr-13-anonymization-and-aggregation) |
| Cookie consent — non-essential tag blocking | Session started (`web.session.started`) | Before tag fires | CPRA; program standard | [PR-14](#pr-14-cookies-and-online-tracking) |
| Third-party API connection — consent capture | Connection consent granted (`connection.consent.granted`) | Before token issued | Program standard; CPRA | [PR-15](#pr-15-third-party-app-and-account-connections) |
| Third-party API connection — revocation | Revoke requested (`connection.revoke.requested`) | Immediate | Program standard | [PR-15](#pr-15-third-party-app-and-account-connections) |
| Biometric data — purge on expiry | Biometric purge due (`verification.biometric_purge_due_at`) | Per state biometric law | State biometric laws; program standard | [PR-16](#pr-16-biometric-data-for-kyc) |
| Minor data — deletion on discovery | Minor data detected (`privacy.minor_data.detected`) | Promptly (internal: 5 BD) | COPPA 16 CFR Part 312 | [PR-17](#pr-17-childrens-data) |

---

## PR-01 — Privacy Notice Lifecycle {#pr-01-privacy-notice-lifecycle}

**WHY (Reg cite):** [Regulation P §§1016.4, 1016.5, 1016.8, 1016.9](https://www.ecfr.gov/current/title-12/part-1016) require credit unions to deliver an initial privacy notice at or before establishing a customer relationship, an annual notice every 12 months (unless the §1016.5(e) exemption applies), and a revised notice before any material change in sharing practices. Notices must be delivered in a manner the member can retain and must include all required content elements.

**SYSTEM BEHAVIOR:** The system maintains a notice lifecycle state machine keyed to each member relationship. On relationship creation, it blocks non-exception sharing until the initial notice delivery event is recorded. The annual notice scheduler evaluates the §1016.5(e) exemption flag (`privacy.annual_exemption_status`) each cycle; if exempt, it records the exemption and suppresses delivery. Revised notices are triggered by any change to `privacy.sharing_change_basis` and must be delivered before the change takes effect; the system blocks the new sharing activity until `privacy.notice.delivered` is recorded for the revised template. Notice copy requests are fulfilled within 10 calendar days. Each delivery event records the channel, timestamp, and template ID. The `privacy.notice_template_id` and `privacy.esign_consent` fields are write-restricted to Compliance and Privacy Operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member relationship established (`entity.created`) | Member identity (`entity.id`), delivery channel (`member.delivery_channel`), e-consent artifact if electronic (`privacy.esign_consent`), notice template (`privacy.notice_template_id`) | Initial privacy notice delivered + `privacy.notice.delivered` | At or before relationship starts (internal: same day; enforced by `privacy.annual_notice_due_at` set at T+0) |
| 12-month anniversary of last notice delivery (`privacy.annual_notice_due_at`) | Exemption status (`privacy.annual_exemption_status`), delivery channel (`member.delivery_channel`), template ID (`privacy.notice_template_id`) | Annual notice delivered or exemption recorded + `privacy.notice.delivered` | Every 12 months (internal: 10 BD before due date; enforced by `privacy.annual_notice_due_at`) |
| Material change in sharing identified (`privacy.notice.revised`) | Change description (`privacy.sharing_change_basis`), new template (`privacy.notice_template_id`), delivery channel (`member.delivery_channel`) | Revised notice delivered; sharing blocked until delivery confirmed + `privacy.notice.delivered` | Prior to change taking effect (internal: 30 days advance; enforced by `privacy.annual_notice_due_at` reset) |
| Member requests notice copy (`privacy.notice_copy.requested`) | Member identity (`entity.id`), preferred channel (`member.delivery_channel`) | Notice copy delivered + `privacy.notice_copy.delivered` | 10 calendar days (internal: 5 BD; enforced by `privacy.notice_copy_due_at`) |

**ALERTS/METRICS:** Alert when any member relationship has no `privacy.notice.delivered` event recorded within 1 BD of relationship creation (target: zero). Alert when annual notice queue ages past 10 BD before `privacy.annual_notice_due_at` (target: zero overdue). Monitor notice copy fulfillment rate against 10-day deadline; alert on any breach.

---

## PR-02 — Opt-Out Capture and Honoring {#pr-02-opt-out-capture-and-honoring}

**WHY (Reg cite):** [Regulation P §1016.7](https://www.ecfr.gov/current/title-12/part-1016) requires that members be given a reasonable opportunity and means to opt out of non-exception sharing, that opt-outs be honored before sharing occurs, and that the opt-out remain in effect until revoked. The Credit Union provides at least two opt-out channels (online preference center and written/phone) and applies a 30-day program standard for propagation to martech vendors.

**SYSTEM BEHAVIOR:** On receipt of an opt-out, the system immediately sets `privacy.optout_enforced` and blocks all non-exception sharing for the member. The opt-out scope (`privacy.optout_scope`) and channel (`privacy.optout_channel`) are recorded. A propagation task is created with a 30-day deadline (`privacy.optout_propagation_due_at`) to push the suppression to all martech vendors in the data map. If a member revokes an opt-out, `privacy.optout_revoked` is recorded and the revocation artifact ID (`privacy.revocation_artifact_id`) is stored. Nevada-specific "Do Not Sell" opt-outs are tracked separately via `privacy.nv_optout_enforced`. The opt-out record is write-restricted to Privacy Operations; downstream martech vendor suppression lists are updated by the integration layer on the propagation task completion event.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member submits opt-out via any channel (`privacy.optout.received`) | Member identity (`entity.id`), opt-out channel (`privacy.optout_channel`), opt-out scope (`privacy.optout_scope`) | Sharing blocked; opt-out recorded + `privacy.optout.received`; propagation task created | Immediate suppression (same BD); propagation task due within 30 days (enforced by `privacy.optout_propagation_due_at`) |
| Propagation task due (`privacy.optout_propagation_due_at`) | Vendor data map (`vendor.data_map_id`), opt-out scope (`privacy.optout_scope`), member ID (`entity.id`) | Martech vendor suppression confirmed + `privacy.optout_propagated` | 30 days from opt-out receipt (enforced by `privacy.optout_propagation_due_at`) |
| Member revokes opt-out (`privacy.optout.cleared`) | Member identity (`entity.id`), revocation artifact (`privacy.revocation_artifact_id`) | Opt-out cleared; sharing re-enabled + `privacy.optout.cleared` | Immediate (same BD) |
| Nevada "Do Not Sell" opt-out received (`privacy.nv_optout.received`) | Member identity (`entity.id`), Nevada residency indicator (`entity.jurisdiction`) | Nevada opt-out enforced + `privacy.nv_optout_enforced` recorded | Immediate (same BD) |

**ALERTS/METRICS:** Alert on any non-exception sharing event for a member with `privacy.optout_enforced` set (target: zero). Alert when propagation tasks age past 25 days without completion (5-day early warning before 30-day deadline). Monitor opt-out channel availability; alert if either channel is unavailable for more than 4 hours.

---

## PR-03 — Permissible Disclosures and Exceptions {#pr-03-permissible-disclosures-and-exceptions}

**WHY (Reg cite):** [Regulation P §§1016.13 (service-provider/joint-marketing), 1016.14 (servicing/processing), and 1016.15 (legal/protective exceptions)](https://www.ecfr.gov/current/title-12/part-1016) enumerate the circumstances under which NPPI may be shared without member opt-out. Each disclosure must be tagged with a legal basis, and the service-provider/joint-marketing exception requires a GLBA confidentiality clause in the vendor contract before sharing.

**SYSTEM BEHAVIOR:** Every outbound NPPI disclosure is routed through a disclosure gate that requires a recorded `disclosure.legal_basis` before the transfer is permitted. The gate checks `disclosure.legal_basis` against the registered exception taxonomy (§1016.13, §1016.14, §1016.15) and blocks the transfer if no valid basis is recorded (`privacy.sharing_blocked`). For §1016.13 disclosures, the gate additionally verifies that `vendor.glba_addendum_id` is populated and `vendor.glba_clause` is verified before allowing the transfer. Joint-marketing disclosures require a formal agreement reference. All disclosure events are logged with the legal basis, vendor ID, data scope, and timestamp. Compliance is write-authorized for legal basis codes; business owners may initiate disclosure requests but cannot self-approve the legal basis.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Outbound NPPI disclosure initiated (`disclosure.initiated`) | Legal basis code (`disclosure.legal_basis`), vendor ID (`vendor.id`), data scope (`vendor.data_scope`), GLBA addendum ID if §1016.13 (`vendor.glba_addendum_id`) | Legal basis recorded; transfer permitted or blocked + `disclosure.legal_basis.recorded` or `privacy.sharing_blocked` | Before data transfer (real-time gate) |
| §1016.13 disclosure — GLBA clause verification (`vendor.glba_clause.verified`) | Vendor contract ID (`vendor.contract_id`), GLBA addendum ID (`vendor.glba_addendum_id`), data scope (`vendor.data_scope`) | GLBA clause verified; transfer unblocked + `vendor.glba_clause.verified` | Before first data transfer |
| Disclosure basis rejected — no valid exception (`privacy.sharing_blocked`) | Attempted disclosure record (`disclosure.legal_basis`), requestor ID, data scope (`vendor.data_scope`) | Sharing blocked; escalation created + `privacy.sharing_blocked` | Immediate (real-time) |

**ALERTS/METRICS:** Alert on any `privacy.sharing_blocked` event (target: zero unresolved within 1 BD). Monitor the ratio of disclosures with a recorded legal basis to total outbound transfers; target 100%. Alert if any §1016.13 transfer occurs without a verified `vendor.glba_addendum_id`.

---

## PR-04 — Member Access and Authentication {#pr-04-member-access-and-authentication}

**WHY (Reg cite):** [Regulation P §1016.9](https://www.ecfr.gov/current/title-12/part-1016) and the [Right to Financial Privacy Act (12 USC §3401 et seq.)](https://www.law.cornell.edu/uscode/text/12/3401) require that member financial information be disclosed only to authorized parties. [NCUA Part 748](https://www.ecfr.gov/current/title-12/part-748) requires information-security controls that include identity verification before disclosure. The Credit Union verifies identity across in-person, phone, and online channels before disclosing any NPPI, and verifies power-of-attorney documentation for agents.

**SYSTEM BEHAVIOR:** Every member information access request triggers an authentication check. The system records the authentication method (`member.identity_check_method`), the channel, and the outcome. On failed authentication, the system records `access.refused` and blocks disclosure; no NPPI is returned. For agent access, the system additionally requires a validated POA artifact (`access.poa_artifact_id`, `access.poa_validated`) before permitting disclosure. RFPA government-access requests are routed to Legal for review (`legal.rfpa_applicable`) before any records are produced. Notice copy requests are fulfilled within 10 calendar days (see [PR-01](#pr-01-privacy-notice-lifecycle)). The `access.authenticated` and `access.poa_validated` fields are write-restricted to the authentication service; human override requires Compliance sign-off.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member or agent requests account information (`access.request.received`) | Member identity (`entity.id`), channel, authentication credentials, agent POA artifact if applicable (`access.poa_artifact_id`) | Authentication outcome recorded; disclosure permitted or refused + `access.granted` or `access.refused` | Before any NPPI disclosed (real-time) |
| Agent presents POA (`access.poa.presented`) | POA document (`access.poa_artifact_id`), member ID (`entity.id`), agent identity (`access.agent_identity`) | POA validated or rejected + `access.poa.presented` or `access.poa.rejected` | Before agent disclosure (real-time) |
| Government/legal process request received (`legal.process.received`) | Legal process document (`legal.process_artifact_id`), RFPA applicability flag (`legal.rfpa_applicable`), scope of records requested | Legal review initiated; RFPA notice issued if required + `legal.process.received` | Per RFPA notice requirements before production |
| Authentication failure (`access.refused`) | Member ID (`entity.id`), channel, failure reason | Disclosure blocked; failure logged + `access.refused` | Immediate (real-time) |

**ALERTS/METRICS:** Alert on any NPPI disclosure event that lacks a preceding `access.granted` event in the same session (target: zero). Monitor authentication failure rates by channel; alert if failure rate exceeds 10% in any 1-hour window (potential credential-stuffing signal). Alert on any government-access request that does not have a `legal.rfpa_applicable` determination within 1 BD.

---

## PR-05 — Data Accuracy and Corrections {#pr-05-data-accuracy-and-corrections}

**WHY (Reg cite):** [FCRA/Regulation V (12 CFR Part 1022)](https://www.ecfr.gov/current/title-12/part-1022) and [NCUA Part 717](https://www.ecfr.gov/current/title-12/part-717) require furnishers to investigate disputes and correct inaccurate information reported to consumer reporting agencies. [NCUA Part 748](https://www.ecfr.gov/current/title-12/part-748) requires data integrity controls. USPS/NCOA address mismatches must be routed through the Red Flags program per [12 CFR Part 717](https://www.ecfr.gov/current/title-12/part-717).

**SYSTEM BEHAVIOR:** When a data correction is identified (whether from a member dispute, internal audit, or bureau feedback), the system creates a correction record and sets a 30-day propagation deadline (`correction.propagation_due_at`) for bureau-reported items. The correction is propagated to all internal systems holding the affected data and to prior recipients where applicable; `correction.propagated` is recorded on completion. USPS/NCOA address mismatches detected via `address.ncoa_mismatch` are automatically routed to the Red Flags workflow (`redflag.detected`) before any address update is applied. Member-initiated disputes are tracked through the furnishing dispute workflow (`furnishing.dispute.received`). The CPRA-equivalent correction right extends to all members for non-GLBA data; state rights requests are handled under [PR-12](#pr-12-state-privacy-rights-universal-floor). Correction records are write-restricted to Privacy Operations and the relevant business system owner.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Data inaccuracy identified — bureau-reported (`furnishing.correction.applied`) | Affected member ID (`entity.id`), inaccurate field, corrected value, evidence artifact (`correction.evidence_artifact_id`) | Correction record created; propagation task set + `furnishing.correction.applied`; propagation due (`correction.propagation_due_at`) | Correction propagated within 30 days (enforced by `correction.propagation_due_at`) |
| USPS/NCOA address mismatch detected (`address.ncoa_mismatch.detected`) | Member ID (`entity.id`), NCOA candidate address (`address.ncoa_candidate`), mismatch flag (`address.ncoa_mismatch`) | Red Flags case opened; address update held pending review + `redflag.detected` | Before address update applied (real-time gate) |
| Member dispute received — furnishing (`furnishing.dispute.received`) | Member ID (`entity.id`), disputed account (`furnishing.disputed_account`), dispute basis (`dispute.basis`), supporting documentation | Dispute investigation opened; provisional correction if warranted + `furnishing.dispute.received`; investigation due (`furnishing.dispute_due_at`) | Investigation within 30 days (enforced by `furnishing.dispute_due_at`) |
| Correction propagation complete (`correction.propagated`) | Correction record ID (`correction.evidence_artifact_id`), list of systems updated, prior recipients notified | Propagation confirmed + `correction.propagated` | Within 30 days of correction identification (enforced by `correction.propagation_due_at`) |

**ALERTS/METRICS:** Alert when any correction propagation task ages past 25 days without `correction.propagated` (5-day early warning). Alert on any NCOA mismatch that does not have a `redflag.detected` event within 1 BD. Monitor open furnishing disputes against 30-day investigation deadline; target zero overdue.

---

## PR-06 — Employee Access Minimization and Training {#pr-06-employee-access-minimization-and-training}

**WHY (Reg cite):** [NCUA Part 748, Appendix A](https://www.ecfr.gov/current/title-12/part-748) requires credit unions to implement an information-security program that includes access controls limiting employee access to member information on a need-to-know basis, periodic access reviews, prompt revocation on termination, and privacy training for all personnel with access to NPPI.

**SYSTEM BEHAVIOR:** Access to NPPI systems is governed by role-based access control (RBAC). Each role's entitlements (`access.role_entitlements`) are defined by Information Security and approved by the relevant business owner. On employee termination (`employee.separated`), the system creates a 24-hour revocation task (`access.deprovision_due_at`) and blocks the user account; `access.deprovisioned` must be recorded within 24 hours. Quarterly access reviews (`access.review_due_at`) require each manager to attest to the continued appropriateness of their team's entitlements (`access.review_attestation`); any entitlement not attested is automatically suspended. Privacy training is assigned at onboarding (`training.onboarding_due_at`) and annually (`training.annual_due_at`); completion is recorded in the training system (`training.completed`). Employees who fail to complete training within the deadline have NPPI system access suspended until completion. Access entitlement changes are write-restricted to Information Security with business-owner approval; training completion records are write-restricted to the LMS.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Employee hired (`employee.hired`) | Employee ID (`employee.id`), role (`user.role`), hire date (`training_detail.hire_date`) | RBAC role provisioned; onboarding privacy training assigned + `access.provisioned`; training due (`training.onboarding_due_at`) | Access provisioned same day; training completed within 30 days of hire (enforced by `training.onboarding_due_at`) |
| Employee separated (`employee.separated`) | Employee ID (`employee.id`), separation date, role (`user.role`) | All NPPI access revoked; revocation recorded + `access.deprovisioned` | Within 24 hours (enforced by `access.deprovision_due_at`) |
| Quarterly access review cycle opens (`access.review_due_at`) | Manager roster (`access.reviewer_roster`), entitlement list (`access.role_entitlements`), last review date (`access.last_reviewed_at`) | Review attestation recorded; unattested entitlements suspended + `access_review.completed` | Quarterly (enforced by `access.review_due_at`) |
| Annual privacy training cycle opens (`training.annual_due_at`) | Employee roster, role-based curriculum (`training.role_curriculum`), prior completion records | Training assigned; completion recorded + `training.completed` | Annually (enforced by `training.annual_due_at`) |

**ALERTS/METRICS:** Alert on any `access.deprovisioned` event that occurs more than 24 hours after `employee.separated` (target: zero). Alert on any quarterly review cycle where attestation rate falls below 100% at the 5-BD mark. Monitor annual training completion rate; alert if below 95% at the 30-day mark before cycle close.

---

## PR-07 — Third-Party Oversight and Contracts {#pr-07-third-party-oversight-and-contracts}

**WHY (Reg cite):** [Regulation P §1016.13](https://www.ecfr.gov/current/title-12/part-1016) conditions the service-provider/joint-marketing exception on a contractual confidentiality obligation. [NCUA Part 748](https://www.ecfr.gov/current/title-12/part-748) requires the credit union to oversee service providers that have access to member information, including due diligence before engagement and ongoing monitoring. Subprocessor flow-downs ensure that GLBA obligations extend through the vendor's supply chain.

**SYSTEM BEHAVIOR:** No NPPI may be transferred to a vendor until (1) due diligence is complete (`vendor.due_diligence.approved`), (2) a GLBA addendum is executed and verified (`vendor.glba_addendum_id`, `vendor.glba_clause.verified`), (3) a data map is on file (`vendor.data_map_id`), and (4) subprocessor flow-down attestation is recorded (`vendor.subprocessor_attestation`). The system enforces this gate via `vendor.privacy_blocked` until all four conditions are met. Annual reviews (`vendor.annual_review_due_at`) reassess the data map, GLBA clause currency, and subprocessor list. Continuous monitoring alerts (`vendor.monitoring_alert`) are routed to Privacy Operations within 1 BD. Vendor privacy review records are write-restricted to Privacy Operations and the Third-Party Risk function.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Vendor onboarding initiated for NPPI-touching vendor (`vendor.onboarding.started`) | Vendor ID (`vendor.id`), data scope (`vendor.data_scope`), due diligence package (`vendor.due_diligence_artifact_id`), GLBA addendum (`vendor.glba_addendum_id`), data map (`vendor.data_map_id`), subprocessor attestation (`vendor.subprocessor_attestation`) | Due diligence approved; GLBA clause verified; data transfer unblocked + `vendor.due_diligence.approved`, `vendor.glba_clause.verified`, `vendor.privacy.approved` | Before first data transfer |
| Annual vendor privacy review due (`vendor.annual_review_due_at`) | Vendor ID (`vendor.id`), current data map (`vendor.data_map_id`), GLBA addendum currency, subprocessor list (`vendor.subprocessor_attestation`), monitoring findings (`vendor.monitoring_alert`) | Annual review completed; data map updated if needed + `vendor.review.completed` | Annually (enforced by `vendor.annual_review_due_at`) |
| Vendor monitoring alert received (`vendor.monitoring_alert`) | Vendor ID (`vendor.id`), alert details (`vendor.alert_details`), impact scope (`vendor.impact_scope`) | Alert routed to Privacy Operations; escalation created if material + `vendor.incident.logged` | Within 1 BD of alert receipt |

**ALERTS/METRICS:** Alert on any NPPI transfer to a vendor without a verified `vendor.glba_addendum_id` (target: zero). Alert when annual vendor review tasks age past 11 months without completion. Monitor open vendor monitoring alerts; target resolution within 5 BD for non-critical, 1 BD for critical.

---

## PR-08 — Secure Disposal of NPPI {#pr-08-secure-disposal-of-nppi}

**WHY (Reg cite):** The [FACTA Disposal Rule (16 CFR Part 682)](https://www.ecfr.gov/current/title-16/part-682) requires reasonable measures for the disposal of consumer report information and records derived from it. [NCUA Part 748](https://www.ecfr.gov/current/title-12/part-748) requires the credit union to properly dispose of member information. Legal holds pause the retention clock; disposal resumes only after the hold is released.

**SYSTEM BEHAVIOR:** When a record's retention period expires (`record.retention_expires_at`), the system checks for an active legal hold (`record.legal_hold_flag`). If a hold is active, disposal is deferred and `disposal.held` is recorded; the clock resumes when the hold is released (`legal_hold.clear.confirmed`). If no hold is active, a disposal task is created with a 90-day deadline (`record.destruction_due_at`). Disposal must use a certified method appropriate to the media type (`disposal.method`): cross-cut shredding for paper, degaussing or physical destruction for magnetic media, and cryptographic erasure or certified wipe for digital records. A certificate of destruction (`disposal.certificate`) is recorded in the destruction log (`destruction_log.entry_id`) upon completion. Disposal records are write-restricted to Records Management; certificates are countersigned by Information Security for digital media.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Record retention period expires (`record.retention_expires_at`) | Record ID (`record.id`), retention class (`record.retention_class`), legal hold flag (`record.legal_hold_flag`), media type (`record.media_type`) | Disposal task created or hold deferral recorded + `disposal.scheduled` or `disposal.held` | Disposal task created within 1 BD of expiry |
| Legal hold released on previously deferred record (`legal_hold.clear.confirmed`) | Record ID (`record.id`), hold release authorization (`legal_hold.release_approved_by`), matter ID (`legal_hold.matter_id`) | Disposal clock resumed; disposal task created + `disposal.clock_resumed`; destruction due (`record.destruction_due_at`) | Disposal task created within 1 BD of hold release |
| Disposal executed (`disposal.executed`) | Record ID (`record.id`), disposal method (`disposal.method`), batch manifest (`disposal.batch_manifest_id`), vendor certificate if applicable | Certificate of destruction recorded in destruction log + `disposal.certificate.recorded`, `record.destroyed` | Within 90 days of retention expiry or hold release (enforced by `record.destruction_due_at`) |

**ALERTS/METRICS:** Alert on any disposal task that ages past 75 days without `disposal.executed` (15-day early warning before 90-day deadline). Alert on any `record.destroyed` event without a corresponding `disposal.certificate.recorded` (target: zero). Monitor destruction log for mismatches (`destruction_log.mismatch`); alert immediately on any detected.

---

## PR-09 — Incident Response and Breach Notification {#pr-09-incident-response-and-breach-notification}

**WHY (Reg cite):** [NCUA Part 748, Appendix B](https://www.ecfr.gov/current/title-12/part-748) requires credit unions to develop and implement an incident-response program that includes detecting, containing, and notifying members and regulators of unauthorized access to member information. State breach notification laws impose specific deadlines. Where criminal activity is suspected, a SAR referral is required under BSA program obligations (mechanics governed by the BSA Policy).

**SYSTEM BEHAVIOR:** On detection of a potential privacy incident, the system creates an incident record and starts the triage clock (`incident.triage_due_at`). Privacy Operations and Legal are notified immediately. The incident is classified (`incident.classified`) for scope (`incident.data_scope`), member impact (`incident.member_impact`), and materiality (`incident.material`). If member notification is required (`incident.member_notice_required`), the system sets `incident.notification_due_at` based on the applicable state clock and the strictest-standard default. NCUA notification is tracked via `incident.ncua_notice_due_at`. If criminal activity is suspected (`incident.criminal_suspected`), the incident is flagged for SAR referral (`incident.sar_referred`) per the BSA Policy. The IR runbook integrates Privacy and Legal as required participants. Incident records are write-restricted to the Incident Commander and Privacy Operations; member notice content (`incident.notice_content`) requires Legal sign-off before dispatch.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Privacy incident detected (`incident.detected`) | Detection source (`incident.detection_source`), initial scope (`incident.scope_initial`), description (`incident.description`) | Incident record created; triage clock started; Privacy Operations and Legal notified + `incident.created`, `incident.detected` | Immediate (triage due within 24 hours; enforced by `incident.triage_due_at`) |
| Incident classified (`incident.classified`) | Data scope (`incident.data_scope`), member impact (`incident.member_impact`), materiality flag (`incident.material`), criminal suspicion flag (`incident.criminal_suspected`) | Classification recorded; notification determination made; SAR referral flagged if applicable + `incident.classified`, `notification.decision.recorded` | Within 72 hours of detection (internal SLA) |
| Member notification required (`incident.member_notice_required` = true) | Notice template (`incident.notice_template_id`), notice content (`incident.notice_content`), member list (`incident.member_notices`), applicable state clock | Member notices sent; notification recorded + `incident.member_notices.sent` | Without unreasonable delay per applicable state clock (enforced by `incident.notification_due_at`) |
| NCUA notification required (`incident.ncua_notice_due_at`) | Incident summary, scope, containment status (`incident.contained`), member impact count | NCUA notified + `incident.ncua.notified` | Per NCUA §748 App. B timeline (enforced by `incident.ncua_notice_due_at`) |
| Criminal activity suspected (`incident.criminal_suspected` = true) | Incident ID (`incident.id`), BSA referral basis | SAR referral flagged; BSA Officer notified + `incident.sar_referred` | Within 1 BD of classification |

**ALERTS/METRICS:** Alert on any incident triage task that ages past 20 hours without `incident.classified` (4-hour early warning before 24-hour SLA). Alert when `incident.notification_due_at` is within 48 hours and `incident.member_notices.sent` is not recorded. Monitor mean time from `incident.detected` to `incident.contained`; target under 4 hours for Severity 1.

---

## PR-10 — Recordkeeping, Complaints, and Board Reporting {#pr-10-recordkeeping-complaints-and-board-reporting}

**WHY (Reg cite):** [NCUA Part 748](https://www.ecfr.gov/current/title-12/part-748) requires credit unions to maintain records sufficient to demonstrate compliance with their information-security and privacy programs and to report material privacy matters to the Board. Centralized complaint logging supports examination readiness and trend analysis.

**SYSTEM BEHAVIOR:** The Privacy Operations function maintains a centralized log of all privacy complaints (`complaint.privacy`), notices delivered, opt-outs, and program metrics. Privacy complaints received through any channel are logged within 1 BD (`complaint.logged`) and routed for investigation. The annual Board privacy report (`privacy.board_report_due_at`) consolidates complaint trends, incident summaries, opt-out volumes, training completion rates, and vendor oversight findings. Material incidents trigger an ad hoc Board report (`privacy.board_adhoc.delivered`) within 5 BD of the materiality determination. All log entries and Board reports are write-restricted to Privacy Operations; the CCO approves Board report content before delivery.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Privacy complaint received (`complaint.privacy.received`) | Complaint narrative (`complaint.narrative`), channel (`complaint.channel`), member ID (`complaint.member_id`), category (`complaint.category`) | Complaint logged; investigation opened + `complaint.logged`, `complaint.privacy.received` | Logged within 1 BD; initial response within 5 BD (enforced by `complaint.initial_response_due_at`) |
| Annual Board privacy report due (`privacy.board_report_due_at`) | Metrics package (`privacy.metrics_package_id`), complaint trend summary (`complaint.trend_summary`), incident log, opt-out volumes, training completion rates, vendor oversight findings | Board report delivered + `privacy.board_report.delivered` | Annually (enforced by `privacy.board_report_due_at`) |
| Material privacy incident determined (`incident.material` = true) | Incident summary, scope, member impact, remediation status | Ad hoc Board report delivered + `privacy.board_adhoc.delivered` | Within 5 BD of materiality determination |
| Privacy complaint trend review due (`complaint.trend_review_due`) | Complaint log (`complaint.trend_summary`), root cause tags (`complaint.root_cause_tag`), prior period comparison | Trend report issued; systemic issues escalated if identified + `complaint.trend.reported` | Quarterly |

**ALERTS/METRICS:** Alert on any privacy complaint that ages past 4 BD without an initial response (1-day early warning before 5-BD SLA). Alert if the annual Board report is not delivered within 5 BD of `privacy.board_report_due_at`. Monitor complaint volume trend; alert if month-over-month increase exceeds 20%.

---

## PR-11 — Website Posting and E-SIGN Delivery {#pr-11-website-posting-and-e-sign-delivery}

**WHY (Reg cite):** [Regulation P §1016.9](https://www.ecfr.gov/current/title-12/part-1016) permits electronic delivery of privacy notices if the member has affirmatively consented. [E-SIGN (15 USC §7001)](https://www.law.cornell.edu/uscode/text/15/7001) governs the validity of electronic consent and requires that the consent artifact be retained. The current notice must be continuously accessible on the Credit Union's website in an ADA-accessible format.

**SYSTEM BEHAVIOR:** The website hosts the current privacy notice at a stable URL. On any notice revision, the website notice is updated before the revised notice takes effect (`privacy.website_notice.updated`), and the ADA accessibility validation ID (`privacy.ada_validation_id`) is recorded. For electronic delivery, the system captures the member's e-consent artifact (`privacy.esign_consent`, `member.esign_consent_captured`, `member.esign_consent_evidence`) before delivering any notice electronically; the consent artifact is retained for the life of the relationship plus the applicable record retention period. E-consent confirmation is sent to the member (`privacy.esign_access_confirmation`). If a member withdraws e-consent, delivery reverts to paper. The website notice and e-consent artifacts are write-restricted to Privacy Operations and the Web team; ADA validation is performed by an independent accessibility reviewer.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Privacy notice revised or initially published (`privacy.notice_template.published`) | Notice template (`privacy.notice_template_id`), ADA validation ID (`privacy.ada_validation_id`), effective date | Website notice updated; ADA validation recorded + `privacy.website_notice.updated` | Before revised notice takes effect |
| Member provides e-consent for electronic delivery (`privacy.esign_consent.started`) | Member ID (`entity.id`), e-consent artifact (`privacy.esign_consent`), consent evidence (`member.esign_consent_evidence`), delivery channel | E-consent recorded; confirmation sent to member + `privacy.esign_consent.recorded`, `member.esign_consent_captured` | Before first electronic delivery |
| Member requests notice copy electronically (`privacy.notice_copy.requested`) | Member ID (`entity.id`), e-consent status (`privacy.esign_consent`), preferred channel | Notice copy delivered electronically + `privacy.notice_copy.delivered` | 10 calendar days (enforced by `privacy.notice_copy_due_at`) |

**ALERTS/METRICS:** Alert if the website notice URL returns a non-200 status for more than 15 minutes (availability SLA). Alert if ADA validation is not recorded within 1 BD of a notice template publication. Monitor e-consent artifact retention; alert on any electronic delivery without a recorded `member.esign_consent_evidence`.

---

## PR-12 — State Privacy Rights: Universal Floor {#pr-12-state-privacy-rights-universal-floor}

**WHY (Reg cite):** California CPRA ([Cal. Civ. Code §§1798.100 et seq.](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=1798.100.&lawCode=CIV)), Vermont's data broker law, and Nevada's privacy statute impose rights and restrictions on non-GLBA data (e.g., marketing telemetry, website analytics). Pynthia applies CPRA-equivalent standards as a universal floor to all members regardless of state of residence: data minimization, purpose limitation, access, deletion, correction, and the right to limit use of sensitive personal information. "Do Not Sell/Share" and Global Privacy Control (GPC) signals are honored for non-GLBA data.

**SYSTEM BEHAVIOR:** Non-GLBA data (marketing telemetry, web analytics, behavioral data) is classified separately from NPPI (`privacy.data_classification`). The system maintains a state rights request queue (`privacy.state_request_type`, `privacy.state_request_due_at`) and routes requests to Privacy Operations for fulfillment. Access, deletion, and correction requests are fulfilled within the applicable state deadline (45 days for CPRA, extendable once). GPC signals detected in web sessions (`web.gpc_signal`) are treated as "Do Not Sell/Share" opt-outs for California members and are processed immediately. Vermont and Nevada marketing limits are enforced via the opt-out workflow in [PR-02](#pr-02-opt-out-capture-and-honoring). Sensitive personal information (as defined by CPRA) is subject to use-limitation controls; members may request limitation via the preference center. State rights request records are write-restricted to Privacy Operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member submits state rights request (access/delete/correct/limit) (`privacy.state_request.received`) | Member ID (`entity.id`), request type (`privacy.state_request_type`), jurisdiction (`entity.jurisdiction`), identity verification | Request logged; fulfillment task created + `privacy.state_request.received`; due (`privacy.state_request_due_at`) | Fulfillment within applicable state deadline (45 days CPRA; enforced by `privacy.state_request_due_at`) |
| GPC signal detected in web session (`web.gpc_signal`) | Visitor jurisdiction (`web.visitor_jurisdiction`), GPC signal value (`web.gpc_signal`), session ID (`web.session`) | Do Not Sell/Share opt-out applied for CA members; consent state updated + `web.consent.updated` | Immediate (real-time) |
| State rights request fulfilled (`privacy.state_request_fulfilled`) | Request ID, fulfillment evidence, data provided or deleted | Fulfillment recorded + `privacy.state_request_fulfilled` | Within applicable state deadline (enforced by `privacy.state_request_due_at`) |
| Vermont/Nevada marketing opt-out received (`privacy.nv_optout.received` or equivalent) | Member ID (`entity.id`), jurisdiction (`entity.jurisdiction`), opt-out scope | Marketing suppression applied; opt-out recorded + `privacy.nv_optout_enforced` | Immediate |

**ALERTS/METRICS:** Alert when any state rights request ages past 35 days without fulfillment (10-day early warning before 45-day CPRA deadline). Alert on any GPC signal that does not produce a `web.consent.updated` event within 1 minute. Monitor state rights request volume by type and jurisdiction quarterly.

---

## PR-13 — Anonymization and Aggregation {#pr-13-anonymization-and-aggregation}

**WHY (Reg cite):** CPRA-equivalent standards (applied as the universal floor per the Strictest-Standard Default) require that analytics and R&D use of personal data be limited to documented, non-identifiable data. Re-identification is prohibited. The Credit Union applies small-cohort thresholds and annual method reviews to ensure de-identification remains effective.

**SYSTEM BEHAVIOR:** Analytics and R&D use of member data is permitted only on data that has been de-identified using a documented method (`analytics.deid_method_id`). The de-identification method is reviewed annually (`analytics.method_review_due_at`). Small-cohort thresholds (`analytics.cohort_threshold`) are enforced at query time to prevent re-identification through aggregation. Re-identification attempts are prohibited by policy and technically blocked; any re-identification risk assessment (`analytics.reid_risk_assessment`) that identifies a material risk triggers an immediate review. The de-identification method registry and cohort threshold configuration are write-restricted to Privacy Operations and the Data Governance function.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Analytics dataset requested for R&D use (`analytics.dataset.requested`) | Dataset scope (`analytics.source_scope`), de-identification method ID (`analytics.deid_method_id`), cohort threshold (`analytics.cohort_threshold`), purpose documentation | Dataset approved or rejected; de-identification confirmed + `analytics.dataset.approved` or `analytics.dataset.requested` (rejected) | Before data access granted |
| Annual de-identification method review due (`analytics.method_review_due_at`) | Method ID (`analytics.deid_method_id`), prior review results, re-identification risk assessment (`analytics.reid_risk_assessment`) | Method review completed; method updated if needed + `analytics.method_review.completed` | Annually (enforced by `analytics.method_review_due_at`) |
| Re-identification risk identified (`analytics.reid_risk_assessment` flags material risk) | Dataset ID, risk assessment findings (`analytics.reid_risk_assessment`), affected cohort | Immediate review triggered; dataset access suspended pending remediation + `analytics.threshold.breached` | Immediate |

**ALERTS/METRICS:** Alert on any analytics dataset access without a recorded `analytics.deid_method_id` (target: zero). Alert when annual method review ages past 11 months without completion. Alert immediately on any `analytics.threshold.breached` event.

---

## PR-14 — Cookies and Online Tracking {#pr-14-cookies-and-online-tracking}

**WHY (Reg cite):** CPRA-equivalent standards (applied as the universal floor) require that non-essential tracking technologies not be activated without member consent for California members. GPC signals must be honored. Vermont and Nevada impose additional marketing limits addressed in [PR-12](#pr-12-state-privacy-rights-universal-floor). This control covers non-GLBA data only; GLBA-covered online banking session data is governed by the Information Security Policy.

**SYSTEM BEHAVIOR:** The website operates a cookie banner and preference center. On session start, the system detects the visitor's jurisdiction (`web.visitor_jurisdiction`) and consent state (`web.consent_state`). Non-essential tags (analytics, advertising, behavioral) are blocked (`web.tags_gated`) until affirmative consent is recorded (`web.consent.recorded`) for jurisdictions requiring it. GPC signals (`web.gpc_signal`) are detected and treated as opt-outs for California visitors, immediately updating the consent state. Tag vendor IDs (`web.tag_vendor_id`) and data scope (`web.tag_data_scope`) are recorded for each approved tag. The tag allowlist is reviewed quarterly (`web.tag_review`). Tag configuration is write-restricted to the Web team with Privacy Operations approval; GPC signal processing is automated and cannot be overridden without Privacy Operations sign-off.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Web session started (`web.session.started`) | Visitor jurisdiction (`web.visitor_jurisdiction`), GPC signal (`web.gpc_signal`), prior consent state (`web.consent_state`) | Consent state evaluated; non-essential tags blocked or permitted + `web.consent.recorded` or tags gated (`web.tags_gated`) | Before any non-essential tag fires (real-time) |
| Member updates cookie preferences (`web.consent.updated`) | Member/visitor ID (`web.visitor_id`), updated consent choices, jurisdiction (`web.visitor_jurisdiction`) | Consent state updated; tag firing adjusted + `web.consent.updated` | Immediate |
| Tag review cycle due (`web.tag_review`) | Tag inventory (`web.tag_vendor_id`, `web.tag_data_scope`), prior review results | Tag review completed; unauthorized tags removed + `web.tag.approved` or `web.tag.rejected` | Quarterly |
| New tag proposed for deployment (`web.tag_review.requested`) | Tag vendor ID (`web.tag_vendor_id`), data scope (`web.tag_data_scope`), purpose documentation | Tag approved or rejected by Privacy Operations + `web.tag.approved` or `web.tag.rejected` | Before tag deployment |

**ALERTS/METRICS:** Alert on any non-essential tag firing event without a preceding `web.consent.recorded` for a jurisdiction-requiring session (target: zero). Alert on any GPC signal that does not produce a `web.consent.updated` within 1 minute. Monitor quarterly tag review completion; alert if overdue by more than 5 BD.

---

## PR-15 — Third-Party App and Account Connections {#pr-15-third-party-app-and-account-connections}

**WHY (Reg cite):** CPRA-equivalent standards (applied as the universal floor) require purpose limitation and member control over data shared with third-party applications. The Credit Union's open-banking API connections must be scoped to the member's consented purpose, use purpose-limited tokens, and provide an immediate revocation path. Reuse of data beyond the consented scope is prohibited.

**SYSTEM BEHAVIOR:** Third-party API connections are established only after the member grants explicit consent (`connection.consent.granted`) specifying the scope and purpose. The system issues a purpose-limited token (`connection.token.issued`) scoped to the consented data elements. The connection record captures the party ID (`connection.party_id`), consent artifact (`connection.consent`), and access log ID (`connection.access_log_id`). Scope violations are detected in real time (`connection.scope_violation.detected`) and result in immediate token suspension (`connection.suspended`). Members may revoke any connection at any time (`connection.revoke.requested`); revocation is immediate and the token is invalidated (`connection.token_revoked`). Connections are write-restricted to the API gateway; revocation can be initiated by the member through the online banking portal or by Privacy Operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member authorizes third-party connection (`connection.consent.granted`) | Member ID (`entity.id`), third-party party ID (`connection.party_id`), consented scope, purpose documentation | Connection created; purpose-limited token issued + `connection.consent.granted`, `connection.token.issued` | Before any data access |
| Scope violation detected (`connection.scope_violation.detected`) | Connection ID (`connection.id`), violated scope, access log ID (`connection.access_log_id`) | Token suspended; Privacy Operations notified; incident created if material + `connection.scope_violation.detected`, `connection.suspended` | Immediate (real-time) |
| Member revokes connection (`connection.revoke.requested`) | Member ID (`entity.id`), connection ID (`connection.id`) | Token invalidated; connection suspended + `connection.token_revoked`, `connection.suspended` | Immediate |

**ALERTS/METRICS:** Alert on any `connection.scope_violation.detected` event (target: zero unresolved within 1 BD). Alert on any data access event from a connection with `connection.suspended` status (target: zero). Monitor active connection count and revocation rate quarterly.

---

## PR-16 — Biometric Data for KYC {#pr-16-biometric-data-for-kyc}

**WHY (Reg cite):** State biometric privacy laws (including Illinois BIPA, Texas, and Washington) impose strict requirements on the collection, use, retention, and destruction of biometric identifiers. CPRA-equivalent standards (applied as the universal floor) require explicit consent and purpose limitation. The Credit Union uses vendor-side face-match/liveness detection for KYC only under explicit contractual limits, prefers vendor-side storage, prohibits model reuse, and purges biometric data per applicable state law.

**SYSTEM BEHAVIOR:** Biometric data collection for KYC is permitted only with explicit member consent (`verification.biometric_consent_id`) and only through vendors operating under contractual limits that prohibit model reuse and require vendor-side storage. The system records the biometric consent ID, the verification outcome (`verification.match_status`), and the purge deadline (`verification.biometric_purge_due_at`) at the time of collection. A non-biometric alternative path is offered where feasible (`verification.alt_path_available`); members who decline biometric verification are routed to the alternative (`verification.biometric_declined`). Biometric data is purged on schedule (`verification.biometric_purged`); the purge event is recorded. Biometric consent and purge records are write-restricted to Privacy Operations and the KYC vendor integration layer.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member presented with biometric KYC option (`verification.biometric.started`) | Member ID (`entity.id`), alternative path availability (`verification.alt_path_available`), consent form | Consent captured or biometric declined; alternative path started if declined + `verification.biometric.started`, `verification.biometric_consent_id` recorded or `verification.biometric_declined` | Before biometric data collected |
| Biometric verification completed (`verification.biometric.completed`) | Consent ID (`verification.biometric_consent_id`), match status (`verification.match_status`), purge deadline (`verification.biometric_purge_due_at`) | Verification result recorded; purge timer set + `verification.biometric.completed`; purge due (`verification.biometric_purge_due_at`) | Immediately on completion |
| Biometric purge due (`verification.biometric_purge_due_at`) | Verification ID (`verification.id`), biometric data reference, vendor purge confirmation | Biometric data purged; purge recorded + `verification.biometric_purged` | Per applicable state biometric law deadline (enforced by `verification.biometric_purge_due_at`) |

**ALERTS/METRICS:** Alert on any biometric data collection event without a recorded `verification.biometric_consent_id` (target: zero). Alert when biometric purge tasks age past the state-law deadline without `verification.biometric_purged` (target: zero). Monitor alternative path offer rate; alert if below 100% of biometric-capable sessions.

---

## PR-17 — Children's Data {#pr-17-childrens-data}

**WHY (Reg cite):** [COPPA (16 CFR Part 312)](https://www.ecfr.gov/current/title-16/part-312) prohibits the collection of personal information from children under 13 without verifiable parental consent. The Credit Union's services are not directed to children under 13. Any minor data collected without valid parental consent must be deleted promptly on discovery.

**SYSTEM BEHAVIOR:** The Credit Union operates age gates (`privacy.age_gate_ruleset_id`) on all digital onboarding flows to prevent under-13 users from creating accounts or providing personal information. If minor data is detected post-collection (e.g., through date-of-birth review or parental complaint), the system flags the record (`privacy.minor_data.detected`) and creates a deletion task with a 5-BD internal deadline. The deletion is recorded (`privacy.minor_data_deleted`). Privacy Operations is notified immediately on detection. The age gate ruleset and minor data deletion records are write-restricted to Privacy Operations. If the detection suggests a systemic failure of the age gate, an incident is created per [PR-09](#pr-09-incident-response-and-breach-notification).

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Under-13 user attempts onboarding (`privacy.age_gate_blocked`) | Age gate ruleset ID (`privacy.age_gate_ruleset_id`), date of birth or age indicator, session ID | Access blocked; no data collected + `privacy.age_gate_blocked` | Real-time (before any data collected) |
| Minor data detected post-collection (`privacy.minor_data.detected`) | Member/record ID, date of birth or age indicator, collection vector (`privacy.collection_vector`) | Privacy Operations notified; deletion task created + `privacy.minor_data.detected` | Immediate notification; deletion within 5 BD (internal SLA) |
| Minor data deleted (`privacy.minor_data_deleted`) | Record ID, deletion confirmation, deletion method | Deletion recorded + `privacy.minor_data_deleted` | Within 5 BD of detection (internal SLA) |

**ALERTS/METRICS:** Alert on any `privacy.minor_data.detected` event (target: zero; each instance is a potential COPPA violation). Alert if minor data deletion is not completed within 3 BD of detection (2-day early warning before 5-BD SLA). Monitor age gate block rate; a sudden drop may indicate a gate failure.

---

## Governance & Sign-Off {#governance}

**Policy Owner:** Patrick Wilson, Chief Compliance Officer — responsible for maintaining this policy, ensuring controls are implemented, and reporting to the Board.

**Required Participants:** Privacy Operations, Legal, Information Security/IT, BSA/AML Officer, and relevant business owners are required participants in the governance of these controls.

**Approval:** This policy requires approval by the Chief Compliance Officer. Board-level awareness is required for material privacy incidents and the annual privacy report.

**Review Cadence:** This policy is reviewed annually and upon any material change in applicable law, the Credit Union's products or services, or a material privacy incident. The next scheduled review is 2027-07-01.

**Cross-References:**
- Information Security Policy (detailed safeguards and technical controls)
- Third-Party Risk Policy (vendor onboarding, lifecycle risk management beyond privacy clauses)
- Record Retention Policy (retention schedules beyond NPPI disposal timing)
- BSA Policy (SAR filing mechanics)
- Member Policy (account servicing and non-privacy disclosures)
- E-Commerce Policy (electronic delivery channel mechanics)

**Sign-Off:**

| Role | Name | Date |
|---|---|---|
| Chief Compliance Officer | Patrick Wilson | __________ |

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional for several privacy-domain codes.** The following codes used in this document are registered in `core-vocabulary.json` and confirmed: `privacy.*` fields and events (e.g., `privacy.annual_notice_due_at`, `privacy.optout_propagation_due_at`, `privacy.notice_copy_due_at`, `privacy.state_request_due_at`, `privacy.board_report_due_at`, `privacy.notice.delivered`, `privacy.optout.received`, `privacy.optout_propagated`, `privacy.state_request.received`, `privacy.board_report.delivered`, `privacy.board_adhoc.delivered`, `privacy.website_notice.updated`, `privacy.minor_data.detected`, `privacy.esign_consent.recorded`, `privacy.notice_copy.delivered`), `web.*` fields and events, `connection.*` fields and events, `verification.biometric_*` fields and events, `analytics.*` fields and events, `address.ncoa_mismatch.*`, `correction.*`, `disposal.*`, `record.*`, `vendor.*`, `training.*`, `access.*`, `employee.*`, `incident.*`, `complaint.*`, `furnishing.*`, `redflag.*`, `destruction_log.*`. The following codes are composed per the grammar and are provisional pending engineering registration: `privacy.collection_vector` (new property on `privacy`), `privacy.minor_data_deleted` (new property on `privacy`), `privacy.nv_optout_enforced` (registered as `privacy.nv_optout_enforced` in vocabulary — confirm spelling), `privacy.sharing_blocked` (registered — confirm), `privacy.esign_access_confirmation` (registered — confirm). Engineering should confirm all `privacy.*` field spellings against the registered schema before implementation.

- **Annual notice exemption logic.** The §1016.5(e) exemption applies when the Credit Union (a) shares only under exceptions that do not require opt-out and (b) has not changed its privacy policies since the last notice. The system flag `privacy.annual_exemption_status` is assumed to be set by a Compliance-owned workflow that evaluates both conditions. The specific business logic for this evaluation is not defined in this policy and must be specified in the implementing procedure.

- **State biometric law deadlines.** The `verification.biometric_purge_due_at` timer is set at the time of biometric data collection. The specific retention period varies by state (e.g., Illinois BIPA: 3 years or within 1 year of purpose fulfillment, whichever is earlier). The system must be configured with the applicable state-law deadline for each member's jurisdiction. This configuration is assumed to be maintained by Privacy Operations and has not been validated against all states where Pynthia has members.

- **CPRA "sensitive personal information" definition.** PR-12 references the right to limit use of sensitive personal information. The specific categories of data Pynthia collects that qualify as "sensitive personal information" under CPRA (e.g., precise geolocation, biometric data, financial account credentials) must be enumerated in the implementing data inventory. This policy assumes that enumeration exists; if it does not, it must be created before PR-12 controls can be fully implemented.

- **GPC signal detection scope.** PR-14 and PR-12 require honoring GPC signals for California members. The `web.gpc_signal` field is registered in vocabulary. The technical implementation of GPC signal detection (browser header parsing, CDN-level vs. application-level) is assumed to be specified in the E-Commerce Policy and the Web team's implementation runbook. This policy assumes that detection is real-time and covers all digital channels.

- **Vermont and Nevada marketing limits — specific scope.** Patrick's notes reference Vermont and Nevada marketing limits for non-GLBA data. The specific categories of data and marketing activities subject to Vermont's data broker law and Nevada's SB 220 opt-out right have not been enumerated in this policy. Privacy Operations must confirm the specific data flows subject to these requirements and update the data map accordingly.

- **Non-biometric KYC alternative path feasibility.** PR-16 requires offering a non-biometric alternative path "where feasible." The determination of feasibility for each product and channel is a business judgment that must be documented by the relevant business owner and approved by Privacy Operations. This policy assumes that feasibility determinations are maintained in the product risk register.

- **RFPA government-access process.** PR-04 references RFPA notice and process requirements. The specific RFPA notice templates, challenge procedures, and Legal review workflow are assumed to be documented in the Legal department's playbook. This policy does not reproduce those mechanics.

- **SAR referral mechanics.** PR-09 flags criminal-activity incidents for SAR referral. The mechanics of SAR preparation, review, and filing are governed by the BSA Policy. This policy assumes that the `incident.sar_referred` flag triggers the BSA workflow automatically; the integration between the incident management system and the BSA case management system must be confirmed by engineering.

- **Strictest-standard default — conflict resolution.** The policy applies the strictest applicable standard across all members regardless of state. Where two standards conflict in a way not addressed by this policy (e.g., a state law that is stricter than CPRA in a specific dimension), Privacy Operations and Legal must resolve the conflict and document the resolution. No such conflicts have been identified at the time of drafting.

- **COPPA — parental consent workflow.** PR-17 treats the service as not directed to under-13 users and relies on age gates rather than a parental consent workflow. If Pynthia ever introduces a product directed to minors (e.g., youth savings accounts with parental co-ownership), a separate COPPA parental consent control will be required. This policy does not address that scenario.

- **Board approval of this policy.** The approver list currently includes only the Chief Compliance Officer. Confirm with governance whether Board approval or ratification is required for the Privacy Policy under Pynthia's bylaws or NCUA examination expectations. If Board approval is required, the YAML front-matter and Governance section should be updated accordingly.
