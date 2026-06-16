---
title: Member Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-16
next_review: 2027-06-16
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Member Lifecycle, Membership, Expulsion, Disputes, Estate]
---

## General Policy Statement

Pynthia Credit Union commits to fair, lawful, and well-documented treatment of members across the entire membership lifecycle — from eligibility and onboarding through account maintenance, communications, disputes, restrictions, closures, expulsion, death, and records handling. This policy governs all members and their accounts across all service channels. It enforces identity verification at onboarding and at sensitive maintenance events, timely and fair dispute resolution, and statutory due process for restrictions, closures, and expulsion. CIP/identity-program internals, Red Flags technical controls, privacy notices, retention schedules, complaint-program structure, online/mobile channels, and Truth-in-Savings disclosure content live in their respective policies and are referenced, not duplicated, here.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---:|---|
| Eligibility denied at onboarding | Field-of-membership rule fails (`member.eligibility_rule_failed`) | Promptly (internal: 5 BD) | Ineligibility notice with basis | [MB-01](#mb-01-membership-eligibility-onboarding) |
| Change of address request | Member submits address change (`entity.update_requested`) | Notice same day; card/statement hold 14 days | Prior-address notice + waiting window | [MB-02](#mb-02-account-maintenance-change-of-address) |
| Member dispute (Reg E EFT error) | Member asserts EFT error (`dispute.opened`) | 10 BD investigate / 45 days resolve | Provisional credit + resolution letter | [MB-04](#mb-04-member-disputes-dispute-resolution) |
| Regulator-routed complaint | DFPI/CFPB complaint received (`complaint.regulator_received`) | Acknowledge ≤5 BD; respond per portal date | Forward to designated officer | [MB-04](#mb-04-member-disputes-dispute-resolution) |
| Account restriction/closure by CU | Grounds determined (`account.restriction_approved` / `account.closure_approved`) | Notice promptly; payout per closure timer | Documented rationale + member notice | [MB-05](#mb-05-account-restrictions-closures) |
| Member expulsion | Board/CEO expulsion decided (`member.expulsion_decided`) | Hearing right; reconsideration ≤30 days | Expulsion notice + share payout | [MB-06](#mb-06-member-expulsion) |
| Member death | Death reported (`member.death_reported`) | Payout per estate timer | Beneficiary/POD claim + documentation | [MB-07](#mb-07-member-death-estate-handling) |
| Member service inquiry | Inquiry received (`service.inquiry_received`) | First response per SLA | Channel-standard response | [MB-09](#mb-09-member-service-standards) |

## MB-01 — Membership Eligibility & Onboarding  {#mb-01-membership-eligibility-onboarding}

**WHY (Reg cite):** State-chartered credit union membership is limited to a defined field of membership under [California Credit Union Law, Cal. Fin. Code Div. 5 (§§14000 et seq.)](https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?tocCode=FIN&division=5.&title=&part=&chapter=&article=); identity verification at account opening is required as a precondition to establishing membership (CIP program internals governed by the BSA Policy, integrated here).

**SYSTEM BEHAVIOR:** When an applicant applies, the system evaluates field-of-membership eligibility and links the result to a completed identity verification before a membership is activated; a failed eligibility rule blocks activation and triggers an ineligibility notice with the basis. Identity verification is consumed from the CIP/identity-verification process (see BSA Policy) and must reach an approved state before `member.activated`. The eligibility-basis field and activation transition are write-restricted to Member Services with Compliance oversight.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Applicant submits membership application (`member.application_submitted`) | Applicant identity (`enrollment.applicant_identity`), identity evidence (`enrollment.identity_evidence`), eligibility basis (`member.eligibility_basis`) | Verification record opened + onboarding task (`verification.created`) | At submission (internal: same day) |
| Identity verification approved and eligibility passes (`verification.completed`) | Verification status (`verification.status`), member-number match (`enrollment.member_number_match`) | Membership activated (`member.activated`) | Before activation (internal: 1 BD) |
| Field-of-membership rule fails (`member.eligibility_rule_failed`) | Eligibility denied flag (`member.eligibility_denied`), eligibility basis (`member.eligibility_basis`) | Ineligibility notice sent (`member.ineligibility_notice_sent`) | Promptly (internal: 5 BD) |

**ALERTS/METRICS:** Alert on memberships activated without a completed verification (target zero); track onboarding cycle time and eligibility-denial rate by channel.

## MB-02 — Account Maintenance & Change of Address  {#mb-02-account-maintenance-change-of-address}

**WHY (Reg cite):** Address changes are an identity-theft red flag requiring verification and protective controls under the [FACT Act Red Flags Rule (16 CFR Part 681)](https://www.ecfr.gov/current/title-16/part-681) and the [FCRA address-discrepancy duties (15 USC §1681c-1, §1681m(e))](https://www.law.cornell.edu/uscode/text/15/1681m); technical Red Flags controls are governed by the Information Security Policy.

**SYSTEM BEHAVIOR:** A change-of-address request requires identity verification before processing; on commit the system sends notice to the prior address and places a hold that delays dispatch of a new card or statement for a waiting window. A suspicious or NCOA-mismatched change triggers Red Flags review and step-up verification; a card reissue requested during the address hold is blocked until the hold expires. Bank-error address corrections may suppress the member notice. The address-hold timer and identity-check method are write-restricted to Member Services.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member requests address change (`entity.update_requested`) | Identity-check method (`member.identity_check_method`), new address (`entity.address_new`), prior address (`entity.address_previous`) | Address updated + prior-address notice (`member.address_notice_sent`) | Notice same day (internal: same day) |
| Address change committed; card/statement hold applied (`entity.address_changed`) | Address hold expiry (`member.address_hold_expires_at`), reissue-during-hold flag (`card.request_during_address_hold`) | Dispatch hold set (`account.lock_applied`) | 14-day hold (enforced by `member.address_hold_expires_at`) |
| NCOA mismatch or suspicious change detected (`address.ncoa_mismatch_detected`) | Reissue-match flag (`redflag.address_reissue_match`), step-up required (`redflag.stepup_required`) | Red Flags case opened (`redflag.detected`) | At detection (internal: same day) |

**ALERTS/METRICS:** Alert on address changes processed without verification (target zero) and on card reissues dispatched before hold expiry; track NCOA-mismatch step-up completion rate.

## MB-03 — Member Communications & Preferences  {#mb-03-member-communications-preferences}

**WHY (Reg cite):** Electronic delivery of required disclosures requires affirmative consent under [E-SIGN (15 USC §7001)](https://www.law.cornell.edu/uscode/text/15/7001); information-sharing opt-outs and delivery of required notices are governed by [Regulation P (12 CFR Part 1016)](https://www.ecfr.gov/current/title-12/part-1016) (privacy program internals in the Privacy Policy).

**SYSTEM BEHAVIOR:** The system captures and honors member communication preferences — electronic versus paper delivery and information-sharing opt-outs — and enforces them on required disclosure delivery. E-delivery requires captured E-SIGN consent before electronic channel is used; a delivery failure on the chosen channel reverts to a compliant fallback channel and flags the member record. Preference and consent fields are write-restricted to Member Services; opt-out enforcement honors the Privacy Policy program.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member sets or updates preferences (`member.preferences_updated`) | Contact preferences (`member.contact_preferences`), delivery channel (`member.delivery_channel`), e-sign consent evidence (`member.esign_consent_evidence`) | Preferences effective + consent recorded (`privacy.esign_consent_recorded`) | At update (internal: same day) |
| Delivery on chosen channel fails (`member.delivery_failed`) | Delivery failure reason (`member.delivery_failure_reason`), reverted channel (`member.channel_reverted`) | Fallback delivery + record flag (`notice.sent`) | At failure (internal: 1 BD) |

**ALERTS/METRICS:** Alert on electronic disclosures sent without captured E-SIGN consent (target zero); track delivery-failure rate and opt-out enforcement latency.

## MB-04 — Member Disputes & Dispute Resolution  {#mb-04-member-disputes-dispute-resolution}

**WHY (Reg cite):** EFT error-resolution timelines and provisional credit are required under [Regulation E (12 CFR §1005.11)](https://www.ecfr.gov/current/title-12/part-1005#p-1005.11); complaint handling and forwarding of DFPI/CFPB-routed complaints to a designated officer follow the [California Consumer Financial Protection Law (CCFPL, Cal. Fin. Code §90008)](https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?division=24.&chapter=&part=&lawCode=FIN) and CFPB complaint-response expectations (complaint-program structure in the Compliance Policy).

**SYSTEM BEHAVIOR:** The system provides standardized complaint intake, escalation, and response with defined timelines; for asserted EFT errors it starts the Reg E clock, posts provisional credit where required, and completes investigation within the regulatory window. Regulator-routed (DFPI/CFPB) complaints are forwarded to the designated officer and tracked against the portal response date. A complaint reclassified as a dispute carries its evidence forward without restarting intake. Dispute basis and regulator-routing fields are write-restricted to the designated officer and Member Services.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member asserts EFT error (`dispute.opened`) | Dispute basis (`dispute.basis`), category (`dispute.category`), correction amount (`dispute.correction_amount`) | Reg E clock started (`dispute.rege_clock_started`) | Investigate ≤10 BD (enforced by `dispute.investigation_due_at`) |
| Provisional credit required before completion (`dispute.provisional_credit_posted`) | Investigation due (`dispute.investigation_due_at`), provisional credit due (`dispute.provisional_credit_due_at`) | Provisional credit posted (`dispute.provisional_credit_posted`) | 10 BD (enforced by `dispute.provisional_credit_due_at`) |
| Investigation completed and decision reached (`dispute.investigation_completed`) | Findings (`dispute.findings`), correction amount (`dispute.correction_amount`) | Resolution sent (`dispute.response_sent`) | 45 days (enforced by `dispute.response_due_at`) |
| DFPI/CFPB complaint received (`complaint.regulator_received`) | Regulator case id (`dispute.regulator_case_id`), narrative (`complaint.narrative`), portal due date (`complaint.portal_due_date`) | Acknowledged + routed to officer (`complaint.acknowledged`) | Ack ≤5 BD (enforced by `complaint.ack_due_at`) |
| Regulator response prepared (`dispute.regulator_response_filed`) | Regulator routed flag (`dispute.regulator_routed`), final response due (`complaint.final_response_due_at`) | Regulator response filed (`dispute.regulator_response_filed`) | Per portal date (enforced by `complaint.final_response_due_at`) |

**ALERTS/METRICS:** Aging alerts on disputes approaching the Reg E 10-BD and 45-day thresholds and on regulator complaints approaching portal due dates; track provisional-credit timeliness and reopened-dispute rate.

## MB-05 — Account Restrictions & Closures  {#mb-05-account-restrictions-closures}

**WHY (Reg cite):** Sanctions limiting services for abusive conduct, and credit-union-initiated restriction or closure, must preserve a member's core share and voting rights and follow the bylaws and [Federal Credit Union Act / NCUA framework (12 USC §1764)](https://www.law.cornell.edu/uscode/text/12/1764) as applied under [California Credit Union Law (Cal. Fin. Code Div. 5)](https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?tocCode=FIN&division=5.&title=&part=&chapter=&article=).

**SYSTEM BEHAVIOR:** Restrictions and closures initiated by the credit union require documented grounds and a designated approval before they take effect, after which the system notifies the member and, on closure, schedules the share/deposit payout net of amounts owed. Sanctions for abusive conduct may deny services involving personal contact or premises access while preserving the right to maintain a share account and vote, unless the conduct warrants full removal under MB-06. Restriction approver and grounds fields are write-restricted to authorized approvers (CEO/Executive Team per bylaws).

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Restriction grounds approved (`account.restriction_approved`) | Restriction grounds (`restriction.grounds`), approver (`restriction.approved_by`) | Restriction notice sent (`member.restriction_notice_sent`) | Promptly (internal: 2 BD) |
| Closure approved by credit union (`account.closure_approved`) | Amounts owed (`member.amounts_owed`), closure payout due (`account.closure_payout_due_at`) | Account closed + member notice (`account.closed`) | Notice promptly (internal: 2 BD) |
| Closure payout scheduled (`account.closed`) | Balance (`account.balance`), closure payout due (`account.closure_payout_due_at`) | Closure payout sent (`member.closure_payout_sent`) | Per payout timer (enforced by `account.closure_payout_due_at`) |

**ALERTS/METRICS:** Alert on restrictions/closures effected without a recorded approver or grounds (target zero); track payout timeliness and member-notice delivery confirmation.

## MB-06 — Member Expulsion  {#mb-06-member-expulsion}

**WHY (Reg cite):** Member expulsion for cause must follow the statutory procedure — permissible grounds, written notice, the member's right to be heard at a special meeting, reconsideration, and payout of shares net of amounts owed — under the [Federal Credit Union Act §118 (12 USC §1764)](https://www.law.cornell.edu/uscode/text/12/1764) and [California Credit Union Law (Cal. Fin. Code Div. 5)](https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?tocCode=FIN&division=5.&title=&part=&chapter=&article=) with Board ratification.

**SYSTEM BEHAVIOR:** An expulsion decision records permissible grounds, sends written notice of expulsion and reasons, and opens the member's right to request a hearing at a special meeting and to request reconsideration within the statutory window; expulsion does not relieve the member of liabilities, and remaining shares are paid in withdrawal order net of amounts owed. A reconsideration request is decided by the President/CEO and reported to the Board and Supervisory Committee at the next meeting. Expulsion grounds, hearing dates, and reconsideration timers are write-restricted to the Board/CEO and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Expulsion decided for cause (`member.expulsion_decided`) | Grounds (`expulsion.grounds`), decided by (`expulsion.decided_by`) | Expulsion notice sent (`member.expulsion_notice_sent`) | Promptly (internal: 5 BD) |
| Member requests hearing at special meeting (`member.expulsion_hearing_requested`) | Hearing requested at (`expulsion.hearing_requested_at`), meeting date (`expulsion.meeting_date`) | Hearing scheduled + hearing held (`member.expulsion_hearing_requested`) | Per bylaws (internal: 30 days) |
| Member requests reconsideration (`member.expulsion_reconsideration_requested`) | Reconsideration requested at (`expulsion.reconsideration_requested_at`), amounts owed (`member.amounts_owed`) | Reconsideration decided (`member.expulsion_reconsideration_decided`) | ≤30 days from expulsion (internal: 30 days) |
| Expulsion finalized; shares payable (`member.expulsion_decided`) | Amounts owed (`member.amounts_owed`), balance (`account.balance`) | Expulsion payout sent (`member.expulsion_payout_sent`) | Promptly as funds available (internal: 10 BD) |
| Board/Supervisory reporting cycle (`expulsion.board_report_filed`) | Decided by (`expulsion.decided_by`), grounds (`expulsion.grounds`) | Board report filed (`expulsion.board_report_filed`) | Next scheduled meeting (enforced by `board.notification_due_at`) |

**ALERTS/METRICS:** Alert on expulsions lacking notice, recorded grounds, or unfiled Board report (target zero); track reconsideration-window adherence and payout timeliness.

## MB-07 — Member Death & Estate Handling  {#mb-07-member-death-estate-handling}

**WHY (Reg cite):** Account handling on a member's death — payable-on-death designations, beneficiary claims, and required documentation — must follow account-contract terms and California probate/POD law, consistent with the [California Credit Union Law (Cal. Fin. Code Div. 5)](https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?tocCode=FIN&division=5.&title=&part=&chapter=&article=) and applicable [California Probate Code (§5000 et seq., multiple-party accounts)](https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?tocCode=PROB).

**SYSTEM BEHAVIOR:** On a reported death the system applies a death flag, requires a death certificate and claimant verification, validates POD/beneficiary designations and authority documents, and schedules payout to verified claimants per the estate timer; benefits received post-mortem (e.g., direct deposits after death) are flagged for return. Estate authority documents, claimant verification, and payout timing are write-restricted to Member Services with Compliance review.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member death reported (`member.death_reported`) | Date of death (`estate.date_of_death`), death certificate (`estate.death_certificate_ref`) | Death flag applied (`account.death_flag_applied`) | At report (internal: 1 BD) |
| Beneficiary/POD claim submitted (`estate.claim_submitted`) | Claimant verification (`estate.claimant_verification_id`), authority document (`estate.authority_document_ref`), claim form (`estate.claim_form_ref`) | Claim documented + payout scheduled (`estate.claim_submitted`) | Payout per timer (enforced by `estate.payout_due_at`) |
| Post-mortem benefit received (`estate.benefit_returned`) | Benefit-received flag (`estate.benefit_received_postmortem`), payout due (`estate.payout_due_at`) | Benefit returned (`estate.benefit_returned`) | Promptly on identification (internal: 5 BD) |

**ALERTS/METRICS:** Alert on payouts released without verified claimant or authority document (target zero); track death-flag latency and unreturned post-mortem benefits aging.

## MB-08 — Member Records & Privacy  {#mb-08-member-records-privacy}

**WHY (Reg cite):** Member records and access must be maintained on a need-to-know basis consistent with [Regulation P safeguards (12 CFR Part 1016)](https://www.ecfr.gov/current/title-12/part-1016) and applicable retention duties (retention schedules in the Record Retention Policy; privacy program in the Privacy Policy).

**SYSTEM BEHAVIOR:** Member records are retained under a defined retention class with access logged and restricted to a need-to-know basis; sensitive-record access is recorded with actor and purpose, and disposal occurs only after retention expiry and absent a legal hold. Retention class, hold status, and sensitive-access fields are write-restricted to Records/Compliance; access enforcement defers to the access-control program.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member record created or updated (`record.created`) | Retention class (`record.retention_class`), record class (`record.class`) | Retention clock set (`record.retention_clock_set`) | At creation (internal: same day) |
| Sensitive member record accessed (`record.access_logged`) | Actor id (`record.actor_id`), access purpose (`record.access_purpose`), sensitive-access flag (`record.sensitive_access`) | Access log entry written (`record.access_logged`) | At access (real-time) |
| Retention expires with no hold (`record.retention_expired`) | Disposal eligible (`record.disposal_eligible`), legal-hold flag (`record.legal_hold_flag`) | Record disposed (`record.disposed`) | Per retention timer (enforced by `record.retention_expires_at`) |

**ALERTS/METRICS:** Alert on sensitive-record access without recorded purpose and on disposal attempts against held records (target zero); track access-log coverage and overdue-disposal backlog.

## MB-09 — Member Service Standards  {#mb-09-member-service-standards}

**WHY (Reg cite):** Timely, channel-consistent member service supports fair-dealing and UDAAP expectations under the [California Consumer Financial Protection Law (CCFPL, Cal. Fin. Code §90003)](https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?division=24.&chapter=&part=&lawCode=FIN) (UDAAP monitoring program in the Compliance Policy).

**SYSTEM BEHAVIOR:** Each member inquiry is assigned a category, channel, and owner with a first-response and resolution SLA; an inquiry that surfaces a regulated grievance is reclassified as a dispute and routed to MB-04 without losing its timeline. Service category, owner, and SLA timers are write-restricted to Member Services.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member inquiry received (`service.inquiry_received`) | Inquiry id (`service.inquiry_id`), category (`service.category`), assigned to (`service.assigned_to`) | First response sent (`service.first_response_sent`) | Per SLA (enforced by `service.first_response_due_at`) |
| Inquiry worked to closure (`service.resolved`) | First response due (`service.first_response_due_at`), resolution due (`service.resolution_due_at`) | Inquiry resolved (`service.resolved`) | Per SLA (enforced by `service.resolution_due_at`) |
| Inquiry surfaces regulated grievance (`service.inquiry_received`) | Reclassified-as-dispute flag (`service.reclassified_as_dispute`), category (`service.category`) | Routed to disputes (`dispute.opened`) | At triage (internal: same day) |

**ALERTS/METRICS:** Aging alerts on inquiries breaching first-response or resolution SLAs; track reclassification rate and channel-level SLA adherence.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for this policy and its controls.
- **Approver(s):** Patrick Wilson, Chief Compliance Officer.
- **Required participants:** Member Services (onboarding, maintenance, communications, disputes, service); BSA (identity verification integration, Red Flags); the Board (expulsion grounds, special meetings, ratification, and Supervisory Committee reporting).
- **Review cadence:** Annual review (next review 2027-06-16) or upon material regulatory change; tracked via the policy review timer (`policy.review_due_at`).
- **Cross-references:** BSA Policy (CIP/CDD), Information Security Policy (Red Flags technical controls), Privacy Policy (notices and information-sharing), Record Retention Policy (schedules), Compliance Policy (complaint program and UDAAP), E-Commerce Policy (online/mobile channels), Truth-in-Savings Policy (account disclosure content).
- **Control cross-cut:** The [Timing Matrix](#timing-matrix) is the single consolidated deadline view; each row links to its governing control.

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** The member-lifecycle resources, fields, events, and timers cited throughout the control overlays target the registered Cassandra Banking Core vocabulary; most member/dispute/estate/expulsion codes used here are registered, but a small number rely on provisional spellings (e.g., `complaint.id`, `dispute.status`, `service.channel`, `member.state`, `enrollment.channel`). Where a concept is registered, the registered code is used verbatim; where only a provisional spelling exists, that exact spelling is used. Engineering will confirm all member-side codes before the next review.
- **Charter type and statutory applicability.** This policy assumes Pynthia is a California state-chartered credit union, so California Credit Union Law and CCFPL govern membership, expulsion, special meetings, and complaint forwarding; the Federal Credit Union Act §118 / NCUA framework is cited as the federal-equivalent anchor for expulsion and restriction. If Pynthia is federally chartered, NCUA Part 701.31 and FCU Act procedures govern and the California citations are secondary — to be confirmed by Compliance.
- **Reg E vs. Reg DD scope.** MB-04 assumes member disputes principally implicate Regulation E EFT error-resolution; non-EFT account disputes and Truth-in-Savings disclosure content are out of scope here and handled under the Truth-in-Savings and Compliance Policies. Confirm whether any billing-error (Reg Z) disputes also route through this control.
- **Address waiting window length.** MB-02 assumes a 14-day card/statement dispatch hold after a change of address; the exact window is an operational parameter to be confirmed against the Information Security Red Flags procedure.
- **Expulsion reconsideration window.** MB-06 assumes a 30-day reconsideration window and "next scheduled meeting" Board/Supervisory reporting, consistent with the reference policies; confirm the exact statutory/bylaw window applicable to Pynthia.
- **POD/estate documentation set.** MB-07 assumes death certificate plus claimant verification and authority documents as the required claim package; confirm the precise documentation matrix (small-estate affidavits, letters testamentary thresholds) with Legal.
- **Service SLA values.** MB-09 first-response and resolution SLAs are governed by registered timers but their specific durations are not set in PATRICK_NOTES; Member Services to define and confirm the channel-level SLA targets.
