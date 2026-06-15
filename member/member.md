---
title: Member Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v3.0
effective: 2026-06-04
next_review: 2027-06-04
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Member Lifecycle, Membership, Disputes, Expulsion, Estates]
---

## General Policy Statement

Pynthia Credit Union manages the full member lifecycle — eligibility and onboarding, account maintenance, communications, dispute resolution, restrictions and closures, statutory expulsion, death and estate handling, member records, and service standards — with verified identity at every sensitive event, fair and timely dispute handling, and statutory due process for any action that restricts or terminates a member's relationship. This policy applies to all members and their accounts across all service channels. Identity-verification program mechanics (CIP/CDD), Red Flags technical controls, privacy notice content, record-retention schedules, complaint-program structure, online/mobile channel controls, and Truth-in-Savings disclosure content are governed by the respective dedicated policies and are out of scope here.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---|---|
| Change-of-address waiting window before new card/statement dispatch | Address change processed (`entity.address_changed`) | At least 30 days hold; notice to old + new address same day | Confirmation notice to prior and new address | [MEM-02](#mem-02--account-maintenance--change-of-address) |
| Member complaint acknowledged | Complaint received (`complaint.received`) | 5 BD acknowledge | Acknowledgement to member | [MEM-04](#mem-04--member-disputes--dispute-resolution) |
| Member complaint final response | Investigation complete (`complaint.investigation_completed`) | 15 BD final response | Final response letter | [MEM-04](#mem-04--member-disputes--dispute-resolution) |
| DFPI/CFPB-routed complaint forwarded | Regulator complaint received (`complaint.regulator_received`) | Same day to designated officer | Routed case to designated officer | [MEM-04](#mem-04--member-disputes--dispute-resolution) |
| Member notified of credit-union-initiated restriction/closure | Restriction/closure approved (`account.restriction_approved` / `account.closure_approved`) | Notice at/before action | Restriction/closure notice with rationale | [MEM-05](#mem-05--account-restrictions--closures) |
| Closure share payout | Account closed (`account.closed`) | Promptly, net of amounts owed | Payout to member | [MEM-05](#mem-05--account-restrictions--closures) |
| Expulsion notice + right to be heard | Expulsion decided (`member.expulsion_decided`) | Notice immediate; reconsideration window 30 days | Written expulsion notice + reasons | [MEM-06](#mem-06--member-expulsion) |
| Expelled-member share payout | Reconsideration resolved/expired (`member.expulsion_reconsideration_decided`) | Promptly, net of amounts owed | Payout to expelled member | [MEM-06](#mem-06--member-expulsion) |
| Estate payout on death claim | Beneficiary claim documented (`estate.claim_submitted`) | Promptly upon valid documentation | Payout to beneficiary/estate | [MEM-07](#mem-07--member-death--estate-handling) |
| Member service first response | Inquiry received (`service.inquiry_received`) | Per channel SLA (internal) | First response to member | [MEM-09](#mem-09--member-service-standards) |

## MEM-01 — Membership Eligibility & Onboarding

**WHY (Reg cite):** State-chartered membership eligibility (field of membership) and member admission are governed by [California Credit Union Law, Cal. Fin. Code Div. 5 §§14000 et seq.](https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?tocCode=FIN&division=5.&title=&part=&chapter=&article=); identity collection at account opening is anchored to CIP under [31 CFR 1020.220](https://www.ecfr.gov/current/title-31/part-1020#p-1020.220), implemented here as a gate before membership is established (program detail in the BSA Policy).

**SYSTEM BEHAVIOR:** When an applicant submits a membership application, the system evaluates field-of-membership eligibility and requires a completed identity verification (CIP) before a membership may be activated; the membership cannot transition to active until both eligibility is determined and verification is approved. If eligibility fails, an ineligibility notice is generated and the application stops. Eligibility-basis and identity-check-method fields are write-restricted to Member Services and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Membership application submitted (`member.application_submitted`) | Applicant identity (`enrollment.applicant_identity`), identity evidence (`enrollment.identity_evidence`), eligibility basis (`member.eligibility_basis`) | Eligibility evaluation recorded (`member.eligibility_determined`) | At onboarding (internal: 1 BD) |
| Identity verification completed (`verification.completed`) | Verification result (`verification.match_status`), provider result (`verification.provider_result`) | Membership activated (`member.activated`) | Before membership establishment |
| Field-of-membership rule fails (`member.eligibility_rule_failed`) | Eligibility basis (`member.eligibility_basis`), denial reason (`member.eligibility_denied`) | Ineligibility notice sent (`member.ineligibility_notice_sent`) | At decision (internal: 1 BD) |

**ALERTS/METRICS:** Alert on any membership activated without a linked approved verification (target zero); monitor onboarding-to-activation latency and ineligibility-notice send rate.

## MEM-02 — Account Maintenance & Change of Address

**WHY (Reg cite):** Change-of-address handling triggers the FACT Act Red Flags Rule address-discrepancy and card-reissue provisions under [16 CFR Part 681](https://www.ecfr.gov/current/title-16/part-681) (FCRA), and physical-address capture supports CIP under [31 CFR 1020.220](https://www.ecfr.gov/current/title-31/part-1020#p-1020.220); identity verification before processing a change protects against account takeover (Red Flags technical controls in the Information Security Policy).

**SYSTEM BEHAVIOR:** Before processing an address change, the system requires identity verification of the requestor, sends a confirmation notice to both the prior and new address, and applies a hold window before any new card or statement is dispatched to the new address. A suspicious change — including a request for card reissue during the address hold or an NCOA mismatch — opens a Red Flags case for step-up review. Bank-error address corrections may suppress the dual-address notice as an inline carve-out. The address-hold timer and dispute flag are write-restricted to Member Services with Compliance oversight.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Address change requested (`entity.update_requested`) | Requestor identity check method (`member.identity_check_method`), new address (`entity.address_new`), prior address (`entity.address_previous`) | Address change processed + dual-address notice (`member.address_notice_sent`) | Notice same day (internal: same day; hold enforced by `member.address_hold_expires_at`) |
| Card reissue requested during address hold (`redflag.detected`) | Reissue-match flag (`redflag.address_reissue_match`), step-up flag (`redflag.stepup_required`) | Red Flags case opened (`redflags.case_opened`) | Hold window ≥30 days (enforced by `member.address_hold_expires_at`) |
| NCOA / address-discrepancy detected (`address.ncoa_mismatch_detected`) | NCOA candidate (`address.ncoa_candidate`), bureau discrepancy artifact (`bureau.discrepancy_artifact_id`) | Red Flags review opened (`redflags.review_opened`) | At detection (internal: 1 BD) |

**ALERTS/METRICS:** Alert when a card/statement dispatch is attempted before the address hold expires (target zero); monitor count of address-change Red Flags cases and step-up completion rate.

## MEM-03 — Member Communications & Preferences

**WHY (Reg cite):** Electronic delivery of required disclosures requires consumer consent under the [E-SIGN Act, 15 U.S.C. §7001](https://www.law.cornell.edu/uscode/text/15/7001); delivery of account disclosures themselves is governed by Truth in Savings ([12 CFR Part 1030](https://www.ecfr.gov/current/title-12/part-1030); NCUA Part 707 if federally chartered) with content owned by the Truth-in-Savings Policy.

**SYSTEM BEHAVIOR:** The system captures and honors each member's communication preferences and opt-outs, including electronic-versus-paper delivery, and enforces that required disclosures are delivered through a channel consistent with captured E-SIGN consent. If electronic delivery fails, the channel reverts to paper and a delivery-failure record is created. Members may change preferences at any time, taking effect on the recorded effective date. Contact-preference and e-delivery fields are write-restricted to Member Services.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member sets/updates communication preferences (`member.preferences_updated`) | Contact preferences (`member.contact_preferences`), delivery channel (`member.delivery_channel`), e-delivery flag (`member.edelivery_enabled`) | Preferences effective recorded (`member.preferences_updated`) | At update (internal: real-time) |
| E-SIGN consent captured for electronic delivery (`privacy.esign_consent_recorded`) | E-sign consent evidence (`member.esign_consent_evidence`), consent capture flag (`member.esign_consent_captured`) | Consent recorded (`privacy.esign_consent_recorded`) | Before first electronic disclosure |
| Electronic delivery fails (`member.delivery_failed`) | Delivery failure reason (`member.delivery_failure_reason`), channel reverted flag (`member.channel_reverted`) | Delivery failure recorded + reverted to paper (`member.delivery_failed`) | At failure (internal: next cycle) |

**ALERTS/METRICS:** Alert on required disclosures sent electronically without recorded E-SIGN consent (target zero); monitor electronic delivery-failure rate and channel-revert volume.

## MEM-04 — Member Disputes & Dispute Resolution

**WHY (Reg cite):** Standardized complaint intake, timelines, and UDAAP-fair handling are anchored to the [California Consumer Financial Protection Law (CCFPL)](https://www.dfpi.ca.gov/) with DFPI complaint forwarding to a designated officer; EFT error-resolution rights and timelines on member accounts are governed by Regulation E ([12 CFR Part 1005, §1005.11](https://www.ecfr.gov/current/title-12/part-1005#p-1005.11)). Complaint-program structure and UDAAP monitoring live in the Compliance Policy.

**SYSTEM BEHAVIOR:** The system provides standardized complaint intake across channels, acknowledges receipt, escalates per category, and issues a final response within defined timelines. Complaints routed from DFPI/CFPB are forwarded to the designated officer the same day they are received. Disputes that meet Regulation E error criteria start the Reg E clock and provisional-credit handling. UDAAP-flagged complaints are routed for trend monitoring. The complaint category, UDAAP flag, and regulator-routing fields are write-restricted to Compliance and Member Services leads.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member complaint received (`complaint.received`) | Member id (`complaint.member_id`), category (`complaint.category`), narrative (`incident.description`) | Complaint acknowledged (`complaint.acknowledged`) | 5 BD (enforced by `complaint.ack_due_at`) |
| Investigation completed (`complaint.investigation_completed`) | Investigation notes (`complaint.investigation_notes`), root-cause tag (`complaint.root_cause_tag`) | Final response sent (`complaint.final_response_sent`) | 15 BD (enforced by `complaint.final_response_due_at`) |
| DFPI/CFPB complaint received (`complaint.regulator_received`) | Regulator case id (`dispute.regulator_case_id`), routing flag (`dispute.regulator_routed`) | Routed to designated officer (`escalation.routed`) | Same day (enforced by `complaint.initial_response_due_at`) |
| Reg E error dispute opened (`dispute.opened`) | Dispute basis (`dispute.basis`), dispute category (`dispute.category`) | Reg E clock started (`dispute.rege_clock_started`) | Investigation per Reg E (enforced by `dispute.investigation_due_at`) |

**ALERTS/METRICS:** Aging alert on complaints approaching the 5 BD ack and 15 BD final-response timers; target zero regulator-routed complaints not forwarded same day; monitor UDAAP-flag rate and complaint trend volume.

## MEM-05 — Account Restrictions & Closures

**WHY (Reg cite):** Conditions, approvals, and member notification for credit-union-initiated restriction or closure are governed by the credit union's bylaws under [California Credit Union Law, Cal. Fin. Code Div. 5 §§14000 et seq.](https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?tocCode=FIN&division=5.&title=&part=&chapter=&article=), and credit-union service sanctions short of expulsion (e.g., denial of services other than share account and voting rights) are limited by member-service-agreement and [Federal Credit Union Act](https://www.law.cornell.edu/uscode/text/12/chapter-14) constraints.

**SYSTEM BEHAVIOR:** A restriction or closure initiated by the credit union requires a documented rationale and a defined approval before it takes effect, and the member is notified at or before the action. Closure triggers a prompt share payout to the member after deducting any amounts owed; restriction does not relieve the member of liability. Abusive-conduct sanctions may deny services involving personal contact while preserving the right to maintain a share account and to vote, applied as an inline carve-out within the rationale. Restriction/closure grounds and approver fields are write-restricted to authorized approvers under Compliance oversight.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Restriction approved (`account.restriction_approved`) | Restriction grounds (`restriction.grounds`), approver (`restriction.approved_by`) | Restriction notice sent (`member.restriction_notice_sent`) | Notice at/before action (internal: same day) |
| Closure approved (`account.closure_approved`) | Closure rationale (`account.lock_type`), amounts owed (`member.amounts_owed`) | Account closed (`account.closed`) | At approval (internal: 1 BD) |
| Account closed by credit union (`account.closed`) | Member balance (`account.balance`), amounts owed (`member.amounts_owed`) | Closure payout sent (`member.closure_payout_sent`) | Promptly (enforced by `account.closure_payout_due_at`) |

**ALERTS/METRICS:** Alert on any restriction/closure executed without a recorded rationale and approver (target zero); monitor closure-payout aging against the payout timer.

## MEM-06 — Member Expulsion

**WHY (Reg cite):** Permissible grounds, notice, the member's right to be heard at a special meeting, reconsideration, and the effect of expulsion on shares and loans are governed by the credit union's bylaws under [California Credit Union Law, Cal. Fin. Code Div. 5 §§14000 et seq.](https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?tocCode=FIN&division=5.&title=&part=&chapter=&article=), with the federally chartered statutory analog at [Federal Credit Union Act §118, 12 U.S.C. §1764](https://www.law.cornell.edu/uscode/text/12/1764).

**SYSTEM BEHAVIOR:** Expulsion follows the statutory procedure: a written notice of expulsion stating the grounds is sent, the member has 30 days to request reconsideration (and may be heard at a special meeting), and the President/CEO or Board decides reconsideration. Expulsion does not relieve the member of outstanding liabilities; share and deposit amounts are promptly paid following expulsion after deducting amounts due, including early-withdrawal penalties. A report of each expulsion is filed to the Board and Supervisory Committee at the next scheduled meeting. Expulsion grounds, decided-by, and hearing fields are write-restricted to Compliance and the Board.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Expulsion decided (`member.expulsion_decided`) | Grounds (`expulsion.grounds`), decided-by (`expulsion.decided_by`) | Expulsion notice sent (`member.expulsion_notice_sent`) | Notice immediate (internal: 1 BD) |
| Member requests reconsideration / hearing (`member.expulsion_reconsideration_requested`) | Reconsideration requested timestamp (`expulsion.reconsideration_requested_at`), special-meeting date (`expulsion.meeting_date`) | Reconsideration decided (`member.expulsion_reconsideration_decided`) | 30 days to request (internal: decide within 30 days of request) |
| Reconsideration resolved or window expired (`member.expulsion_reconsideration_decided`) | Amounts owed (`member.amounts_owed`), member balance (`account.balance`) | Expulsion payout sent (`member.expulsion_payout_sent`) | Promptly (enforced by `account.closure_payout_due_at`) |
| Expulsion completed (`member.expelled`) | Expulsion record, grounds (`expulsion.grounds`) | Board/Supervisory report filed (`expulsion.board_report_filed`) | Next scheduled Board/Supervisory meeting |

**ALERTS/METRICS:** Aging alert on reconsideration requests approaching the 30-day decision window; target zero expulsions without a filed Board/Supervisory report; monitor expulsion-payout aging.

## MEM-07 — Member Death & Estate Handling

**WHY (Reg cite):** Account handling on a member's death — payable-on-death designations, beneficiary claims, and required documentation — is governed by the credit union's bylaws and account agreements under [California Credit Union Law, Cal. Fin. Code Div. 5 §§14000 et seq.](https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?tocCode=FIN&division=5.&title=&part=&chapter=&article=) and applicable California probate/POD rules.

**SYSTEM BEHAVIOR:** On a reported death, the system applies a death flag to the member's accounts and gates further activity pending documentation. Beneficiary or estate claims require a death certificate, claimant verification, and (where applicable) POD/beneficiary or authority documentation before payout. Post-mortem benefits received in error are flagged for return. Estate authority documents and death-certificate references are write-restricted to Member Services with Compliance oversight.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member death reported (`member.death_reported`) | Date of death (`estate.date_of_death`), death certificate ref (`estate.death_certificate_ref`) | Death flag applied (`account.death_flag_applied`) | At report (internal: 1 BD) |
| Beneficiary/estate claim submitted (`estate.claim_submitted`) | Claimant verification (`estate.claimant_verification_id`), authority document (`estate.authority_document_ref`), claim form (`estate.claim_form_ref`) | Claim documented (`estate.claim_submitted`) | On receipt (internal: 3 BD to validate) |
| Valid claim ready for payout (`estate.claim_submitted`) | Member balance (`account.balance`), claim documentation (`estate.claim_documented`) | Estate payout sent (`estate.payout_sent`) | Promptly (enforced by `estate.payout_due_at`) |
| Post-mortem benefit received in error (`member.death_reported`) | Benefit-received flag (`estate.benefit_received_postmortem`) | Benefit returned (`estate.benefit_returned`) | On detection (internal: 5 BD) |

**ALERTS/METRICS:** Alert on activity attempted on a death-flagged account without a documented claim (target zero); monitor estate-payout aging and post-mortem benefit-return count.

## MEM-08 — Member Records & Privacy

**WHY (Reg cite):** Member privacy and information-sharing limits are governed by Regulation P / Gramm-Leach-Bliley ([12 CFR Part 1016](https://www.ecfr.gov/current/title-12/part-1016)); member-record access on a need-to-know basis supports the GLBA Safeguards expectations. Privacy-notice content and the information-sharing program live in the Privacy Policy; record-retention schedules live in the Record Retention Policy.

**SYSTEM BEHAVIOR:** Member records are retained under the applicable retention class and access is restricted on a need-to-know basis, with sensitive access logged. Information sharing is blocked where a member opt-out has been recorded and enforced. The system maintains a retention clock per record class and dispositions records only when the clock expires and no legal hold is in place. Access purpose, actor role, and sensitive-access fields are write-restricted and audited; record disposition is restricted to Records and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Sensitive member record accessed (`record.access_logged`) | Actor id (`record.actor_id`), actor role (`record.actor_role`), access purpose (`record.access_purpose`) | Access logged (`record.access_logged`) | At access (real-time) |
| Member privacy opt-out received (`privacy.optout_received`) | Opt-out scope (`privacy.optout_scope`), opt-out channel (`privacy.optout_channel`) | Opt-out enforced + sharing blocked (`privacy.optout_received`) | At receipt (internal: enforced same cycle; propagation via `privacy.optout_propagation_due_at`) |
| Member record retention clock expires (`record.retention_expired`) | Retention class (`record.retention_class`), hold status (`record.hold_status`) | Record dispositioned (`record.disposed`) | At expiry (enforced by `record.retention_expires_at`) |

**ALERTS/METRICS:** Alert on information sharing attempted against an enforced opt-out (target zero) and on sensitive-record access without a logged purpose; monitor records past retention without disposition.

## MEM-09 — Member Service Standards

**WHY (Reg cite):** Service-response standards operationalize fair-treatment expectations under the [California Consumer Financial Protection Law (CCFPL)](https://www.dfpi.ca.gov/) and ensure inquiries that surface a regulated issue (e.g., a Reg E dispute) are escalated promptly; this is a service-quality control rather than a single statutory deadline.

**SYSTEM BEHAVIOR:** The system records member inquiries by channel, issues a first response within the channel SLA, and resolves or escalates within target. An inquiry that meets dispute criteria is reclassified into the dispute process so the [MEM-04](#mem-04--member-disputes--dispute-resolution) timelines apply. Service category and assignment fields are write-restricted to Member Services.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member inquiry received (`service.inquiry_received`) | Inquiry id (`service.inquiry_id`), category (`service.category`), assigned-to (`service.assigned_to`) | First response sent (`service.first_response_sent`) | Per channel SLA (enforced by `service.first_response_due_at`) |
| Inquiry resolved or escalated (`service.resolved`) | Resolution category (`service.category`), reclassified-as-dispute flag (`service.reclassified_as_dispute`) | Inquiry resolved / reclassified (`service.resolved`) | Target SLA (enforced by `service.resolution_due_at`) |

**ALERTS/METRICS:** Aging alert on inquiries approaching first-response and resolution SLAs; monitor first-response latency distribution and reclassification-to-dispute rate.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for this policy, its controls, and annual review.
- **Approval:** Approved by Patrick Wilson, Chief Compliance Officer; expulsion and special-meeting matters additionally require Board action, with each expulsion reported to the Board and Supervisory Committee.
- **Required participants:** Member Services (onboarding, maintenance, communications, service), BSA (identity verification and Red Flags interfaces), and the Board (expulsion and special meetings).
- **Review cadence:** Annual, or upon material regulatory change. Next review: 2027-07-01.
- **Cross-references:** BSA Policy (CIP/CDD), Information Security Policy (Red Flags technical controls), Privacy Policy (privacy notices and information-sharing), Record Retention Policy (retention schedules), Compliance Policy (complaint-program structure and UDAAP), E-Commerce Policy (online/mobile channels), Truth-in-Savings Policy (disclosure content).

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** Most member-lifecycle fields, events, and timers referenced in the EVENTS tables are registered in the parsed core vocabulary; where a precise field was unavailable, the closest registered or agreed-provisional code was used (e.g., `incident.description` for complaint narrative, `entity.address_new`/`entity.address_previous` for change-of-address, `account.lock_type` for closure rationale). Provisional-but-agreed codes used include `complaint.narrative`, `complaint.id`, `dispute.status`, and `member.state`; these and any near-substitutes will be confirmed by engineering before the next review.
- **Charter type and statutory basis.** This policy assumes Pynthia is a California state-chartered credit union, so expulsion, restriction, special-meeting, and estate handling are anchored primarily to California Credit Union Law and the bylaws; the Federal Credit Union Act §118 (12 U.S.C. §1764) citation is included as the federal analog and applies only if/where federal chartering or NCUA rules govern. The correct primary authority must be confirmed.
- **Expulsion procedural detail.** The 30-day reconsideration window and "promptly pay shares after deducting amounts owed" are drawn from the reference policies; the special-meeting right-to-be-heard mechanics (notice period, quorum) follow the bylaws and must be confirmed against the current bylaws and any post-2022 FCU Act expulsion-by-member-vote amendments.
- **Change-of-address hold length.** A ≥30-day card/statement dispatch hold is assumed as the minimal viable window; the exact hold duration and the conditions for bank-error notice suppression must be confirmed against the Information Security Red Flags procedures.
- **Complaint timelines.** The 5 BD acknowledgement and 15 BD final-response targets are assumed internal SLAs aligned to DFPI/CCFPL expectations; confirm against the Compliance Policy's complaint-program standard and any DFPI portal-imposed due dates (`complaint.portal_due_date`).
- **Regulation E specifics.** MEM-04 references the Reg E error-resolution clock and provisional credit at a high level; the precise 10/45/90-day timelines and provisional-credit triggers are governed by 12 CFR 1005.11 and the dispute engine, and are not restated here to avoid duplication.
- **POD / estate documentation set.** The required documentation for beneficiary/POD claims (death certificate, claimant verification, authority document) is assumed; the exact document checklist and any small-estate affidavit thresholds must be confirmed with Legal.
- **NCUA Part 701.31 applicability.** Part 701.31 (non-discrimination/advertising) was not anchored to a control because it applies to federally chartered credit unions; if Pynthia is federally chartered, a non-discrimination control should be added or cross-referenced.
