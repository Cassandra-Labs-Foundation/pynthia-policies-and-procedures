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

# Member Policy

## General Policy Statement

Pynthia Credit Union manages the full member lifecycle — eligibility and onboarding, account maintenance, communications, disputes, restrictions and closures, expulsion, death and estate handling, records, and service standards — under a single set of controls that protect members' statutory rights while protecting the credit union from identity, fraud, and conduct risk. Every lifecycle event that affects a member's rights (a restriction, a closure, an expulsion, a disputed transaction) is verified, documented, time-bound, and reviewable, and due process is applied before any adverse action. This policy applies to all members and their accounts across all service channels; the Chief Compliance Officer owns the policy, with Member Services, BSA, and the Board of Directors as required participants for the controls assigned to them.

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Change of address — notice to prior address | Address change processed (`entity.address_changed`) | Notice mailed within 1 business day; 10-calendar-day hold before new card/statement dispatch | Dual-address confirmation notice | [MB-02](#mb-02-account-maintenance--change-of-address) |
| Reg E error claim — acknowledgment & investigation | Member asserts EFT error (`dispute.opened`) | Provisional credit decision within 10 business days; investigation complete within 45 days (90 for new accounts/POS/foreign) | Reg E §1005.11 error-resolution notice | [MB-04](#mb-04-member-disputes--dispute-resolution) |
| General (non-Reg E) complaint response | Complaint logged (`dispute.opened`) | Acknowledge within 5 business days; substantive response within 15 business days | Complaint response letter | [MB-04](#mb-04-member-disputes--dispute-resolution) |
| DFPI/CFPB-routed complaint forwarding | Regulator portal complaint received (`dispute.regulator_routed`) | Forward to designated officer same business day; respond within regulator portal deadline (typically 15 days) | Regulator portal response | [MB-04](#mb-04-member-disputes--dispute-resolution) |
| Account restriction — member notification | Restriction applied (`account.lock_applied`) | Written notice within 3 business days unless legally prohibited (e.g., SAR confidentiality) | Restriction notice with rationale | [MB-05](#mb-05-account-restrictions--closures) |
| Credit-union-initiated closure — notice & payout | Closure approved (`account.closure_approved`) | 30 days' advance notice; remaining share balance remitted within 10 business days of closure | Closure notice + final statement | [MB-05](#mb-05-account-restrictions--closures) |
| Expulsion — written notice to member | Expulsion decision (`member.expulsion_decided`) | Written notice with grounds and hearing rights before effective date; reconsideration window 30 days | Expulsion notice per Cal. Fin. Code / FCU Act §118 | [MB-06](#mb-06-member-expulsion) |
| Expulsion — payout of shares | Expulsion effective (`member.expelled`) | Shares paid promptly as funds become available, net of amounts owed | Final share payout statement | [MB-06](#mb-06-member-expulsion) |
| Death notification — account flag | Verified death notice received (`member.death_reported`) | Accounts flagged and debit access reviewed same business day | Estate-handling checklist | [MB-07](#mb-07-member-death--estate-handling) |
| POD/beneficiary claim — payout | Complete claim documentation received (`estate.claim_documented`) | Verified claim paid within 10 business days | Beneficiary payout record | [MB-07](#mb-07-member-death--estate-handling) |
| Member service inquiry — first response | Inquiry received (`service.inquiry_received`) | First response within 1 business day; resolution or status update within 5 business days | Service-standard response | [MB-09](#mb-09-member-service-standards) |

## MB-01 — Membership Eligibility & Onboarding {#mb-01-membership-eligibility--onboarding}

**WHY (Reg cite):** California Credit Union Law limits membership to persons within the credit union's approved field of membership ([Cal. Fin. Code Division 5, §14000 et seq.](https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?tocCode=FIN&division=5.&title=&part=&chapter=&article=)), and federal customer-identification requirements apply before an account relationship is established ([31 U.S.C. §5318(l)](https://www.law.cornell.edu/uscode/text/31/5318)).

**SYSTEM BEHAVIOR:** Before a membership is established, the system validates the applicant against the credit union's documented field-of-membership rules (employment, geography, family relationship, or association membership) and records the eligibility basis on the member record. Membership creation is gated on a passed identity verification: the entity-creation flow (`POST /entities/person`) initiates a CIP verification (`POST /entities/{entity_id}/verifications`) and the membership cannot activate until `verification.status` is `approved` and `ofac_result.match_status` is `clear` — the verification program itself is governed by the BSA Policy, not here. An applicant who fails eligibility receives a written ineligibility explanation; an applicant whose verification is denied is handled under the BSA Policy's denial procedure. Eligibility-basis overrides are write-restricted to Member Services supervisors, and eligibility-rule configuration is write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Membership application submitted (`member.application_submitted`) | Applicant identity (`entity.name`, `entity.date_of_birth`, `entity.address`), claimed eligibility basis (`member.eligibility_basis`) | Eligibility determination recorded (`member.eligibility_determined`) | Same business day (internal: at point of application where in-person) |
| Eligibility confirmed and identity verification initiated (`member.eligibility_determined`) | Verification request (`verification.id`, `verification.type` = kyc), provider result (`verification.provider_result.identity_verified`), OFAC screen (`verification.ofac_result.match_status`) | Membership activated with verified identity (`member.activated`) | Upon `verification.status` = approved (internal: 2 business days for clean files) |
| Applicant found ineligible (`member.eligibility_denied`) | Eligibility basis evaluated (`member.eligibility_basis`), rule that failed (`member.eligibility_rule_failed`) | Written ineligibility explanation issued (`member.ineligibility_notice_sent`) | 5 business days (internal: 2 BD) |

**ALERTS/METRICS:** Track membership applications pending verification beyond 5 business days (alert at >10 aged items), eligibility-override rate by branch (investigate outliers above 2% of openings), and zero memberships activated with `verification.status` ≠ approved (hard target: zero).

## MB-02 — Account Maintenance & Change of Address {#mb-02-account-maintenance--change-of-address}

**WHY (Reg cite):** The FACT Act Red Flags Rule requires programs to detect identity theft in connection with address changes ([16 CFR Part 681](https://www.ecfr.gov/current/title-16/part-681)), and FCRA imposes card-issuer duties to assess validity of address changes followed shortly by card requests ([15 U.S.C. §1681m(e)](https://www.law.cornell.edu/uscode/text/15/1681m)).

**SYSTEM BEHAVIOR:** A change of address, phone, or email is processed only after the requesting member's identity is verified — photo identification in person, or documented secondary-level identification for phone and digital channels — and the requester must state the current on-file address, which staff verify against the record before applying the change. On every address change the system automatically mails a confirmation notice to both the prior and the new address, and imposes a 10-calendar-day waiting window before any new card, PIN, or statement is dispatched to the new address; a card request arriving inside that window routes to fraud review before fulfillment. Address corrections due to credit-union error may suppress the notice but require supervisor approval logged with the correction. A change exhibiting Red Flags indicators (mismatch with verification data, change followed by card or credential requests, member reporting an unrecognized change notice) triggers the Red Flags review process — the technical Red Flags controls are governed by the Information Security Policy. The member record must always retain a physical address even when mail routes to a PO Box. Notice suppression and waiting-window overrides are write-restricted to Member Services supervisors with mandatory reason codes.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member requests address/contact change (`entity.update_requested`) | Identity verification per channel (`member.identity_check_method`), current on-file address stated (`entity.address`), new address (`entity.address_new`) | Change applied with prior address preserved (`entity.address_changed`, via `PATCH /entities/person/{entity_id}`) | Same business day (internal: at point of request) |
| Address change applied (`entity.address_changed`) | Prior address (`entity.address_previous`), new address (`entity.address`) | Confirmation notice mailed to prior and new address (`member.address_notice_sent`) | 1 business day; 10-calendar-day dispatch hold starts (enforced by `member.address_hold_expires_at`) |
| Card/PIN/statement request during hold window (`card.request_during_address_hold`) | Hold expiry (`member.address_hold_expires_at`), requester identity (`member.identity_check_method`) | Fraud review case opened or release approved (`fraud.review_opened`) | Before fulfillment (internal: review within 2 BD) |
| Member reports unrecognized change notice (`member.address_change_disputed`) | Member identity (`entity.id`), disputed change record (`entity.address_changed`) | Red Flags review initiated and change reversed pending review (`redflags.review_opened`) | Same business day |

**ALERTS/METRICS:** Alert on any card dispatched inside the 10-day hold window without a cleared fraud review (target: zero), monitor notice-suppression rate by employee (investigate above 1% of changes), and track address-change-plus-card-request pairs within 30 days as a Red Flags volume metric.

## MB-03 — Member Communications & Preferences {#mb-03-member-communications--preferences}

**WHY (Reg cite):** Electronic delivery of required disclosures is valid only with prior consumer consent meeting E-SIGN requirements ([15 U.S.C. §7001(c)](https://www.law.cornell.edu/uscode/text/15/7001)), and account disclosures themselves must be delivered per Regulation DD ([12 CFR Part 1030](https://www.ecfr.gov/current/title-12/part-1030)).

**SYSTEM BEHAVIOR:** The system maintains a per-member communications-preference record covering delivery channel (electronic versus paper), marketing opt-outs, and language preference, and every outbound communication consults that record before dispatch. Electronic delivery of required disclosures is permitted only after the member has provided E-SIGN-compliant consent with a demonstrated ability to access the electronic format; absent valid consent, required disclosures default to paper. Opt-out elections take effect within 10 business days of receipt and persist until the member changes them. Statement-delivery failures (bounced email, returned mail) automatically revert the affected member to the alternate channel and flag the contact record for update. Disclosure content requirements live in the Truth-in-Savings Policy and privacy-notice content in the Privacy Policy; this control governs only the capture and honoring of delivery preferences. Preference records are member-editable through authenticated channels; staff edits require the same identity verification as MB-02 maintenance events.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member sets or changes preferences (`member.preferences_updated`) | Member identity (`entity.id`), elected channel (`member.delivery_channel`), opt-out elections (`member.optouts[]`) | Preference record updated and effective (`member.preferences_effective`) | 10 business days for opt-outs (internal: next business day) |
| Member consents to e-delivery (`member.esign_consent_captured`) | Consent demonstration (`member.esign_consent_evidence`), email on file (`entity.email`) | E-delivery enabled for required disclosures (`member.edelivery_enabled`) | Immediately upon valid consent |
| Delivery failure detected (`member.delivery_failed`) | Failed channel (`member.delivery_channel`), failure type (`member.delivery_failure_reason`) | Channel reverted and contact-update flag raised (`member.channel_reverted`) | Next statement cycle (internal: 5 BD) |

**ALERTS/METRICS:** Track required disclosures sent electronically without valid E-SIGN consent on file (target: zero), opt-out effectuation latency distribution (alert above 10 business days), and delivery-failure backlog older than one statement cycle.

## MB-04 — Member Disputes & Dispute Resolution {#mb-04-member-disputes--dispute-resolution}

**WHY (Reg cite):** Regulation E mandates error-resolution investigation and provisional-credit timelines for electronic fund transfer disputes ([12 CFR §1005.11](https://www.ecfr.gov/current/title-12/part-1005/section-1005.11)), and the California Consumer Financial Protection Law subjects member-complaint handling to DFPI oversight and UDAAP standards ([Cal. Fin. Code §90000 et seq.](https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?tocCode=FIN&division=24.&title=&part=&chapter=&article=)).

**SYSTEM BEHAVIOR:** Every member complaint or dispute — any channel, any subject — enters a single intake queue with a unique case ID, a category, and a regulatory clock assigned at intake: Reg E error claims run the §1005.11 timeline (10-business-day provisional-credit decision, 45-day investigation, extended to 90 days for new accounts, point-of-sale, or foreign-initiated transfers), while all other complaints run the internal standard of 5-business-day acknowledgment and 15-business-day substantive response. Complaints routed through the DFPI or CFPB portals are forwarded to the designated complaints officer (the CCO or written designee) the same business day and answered within the portal deadline. Unresolved or repeated complaints escalate to the CCO, and complaints alleging discrimination, UDAAP, or fee abuse are escalated regardless of resolution status; the complaint-logging program structure and UDAAP trend monitoring are governed by the Compliance Policy. If a Reg E investigation finds no error, the member receives a written explanation and provisional credit is reversed with 5 business days' notice before debiting. Case closure and provisional-credit reversal are write-restricted to Member Services supervisors; regulator-routed cases are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member asserts an EFT error (`dispute.opened`, category = reg_e) | Member identity (`entity.id`), disputed transaction (`bookkeeping_entry.id`, `bookkeeping_entry.amount`), assertion details (`dispute.description`) | Case opened with Reg E clock (`dispute.rege_clock_started`) | At receipt (clock starts; enforced by `dispute.provisional_credit_due_at`) |
| Provisional-credit decision point (`dispute.provisional_credit_due`) | Investigation status (`dispute.status`), claim amount (`dispute.amount`) | Provisional credit posted or written denial issued (`dispute.provisional_credit_posted`) | 10 business days (enforced by `dispute.provisional_credit_due_at`) |
| Investigation concluded (`dispute.investigation_completed`) | Findings (`dispute.findings`), corrected amounts (`dispute.correction_amount`) | Final resolution letter + correction or reversal notice (`dispute.resolved`) | 45 days; 90 days new account/POS/foreign (enforced by `dispute.investigation_due_at`) |
| Non-Reg E complaint logged (`dispute.opened`, category = general) | Member identity (`entity.id`), complaint description (`dispute.description`), category (`dispute.category`) | Acknowledgment then substantive response (`dispute.response_sent`) | Acknowledge 5 BD; respond 15 BD (enforced by `dispute.response_due_at`) |
| DFPI/CFPB portal complaint received (`dispute.regulator_routed`) | Portal case ID (`dispute.regulator_case_id`), portal deadline (`dispute.regulator_due_at`) | Forwarded to designated officer; portal response filed (`dispute.regulator_response_filed`) | Forward same business day; respond by portal deadline (typically 15 days) |

**ALERTS/METRICS:** Daily aging report on open Reg E cases at 7 business days (pre-provisional-credit) and 40/85 days (pre-investigation deadline) with escalation to the CCO at any breach (target: zero missed Reg E deadlines); monthly complaint volume, category mix, and repeat-complainant metrics feed the Compliance Policy's UDAAP monitoring.

## MB-05 — Account Restrictions & Closures {#mb-05-account-restrictions--closures}

**WHY (Reg cite):** Restriction of services for abusive conduct must stop short of denying the statutory minimum of share-account maintenance and meeting voting rights preserved by California Credit Union Law ([Cal. Fin. Code Division 5, §14000 et seq.](https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?tocCode=FIN&division=5.&title=&part=&chapter=&article=)), and any restriction tied to suspected unlawful activity must respect confidentiality rules under [31 U.S.C. §5318(g)](https://www.law.cornell.edu/uscode/text/31/5318).

**SYSTEM BEHAVIOR:** An account may be restricted or closed by the credit union only on documented grounds — abusive conduct as defined in this control, suspected fraud, legal process, loss caused to the credit union, or sustained policy violations — with the grounds, the approving officer, and the scope of restriction recorded on the case before the restriction is applied. Abusive conduct includes harassment, threats, profane or intimidating language toward staff or members, fraudulent or deceptive activity, property misappropriation, violation of security procedures, and weapons or intoxication on premises; sanctions are imposed by the CEO (or, in the CEO's absence, an Executive Team member) and may include denial of services involving personal contact, denial of premises access, or denial of all services — except that a restricted member always retains the right to maintain a share account and to vote at annual and special meetings. Threats of violence are reported to local law enforcement. Restrictions are implemented through account locks (`lock_type` = compliance, fraud, legal, or admin) and the member is notified in writing with the rationale within 3 business days unless notification is legally prohibited (for example, SAR confidentiality). Credit-union-initiated closures require 30 days' advance written notice (except where fraud or legal process compels immediate action), and the remaining share balance, net of amounts owed, is remitted within 10 business days of closure; restriction or closure does not relieve the member of any liability to the credit union. Lock application and release are write-restricted to Compliance and BSA; closure approval is write-restricted to the CEO or designated Executive Team members.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Restriction grounds documented and approved (`account.restriction_approved`) | Grounds and evidence (`restriction.grounds`, `restriction.evidence_refs[]`), approving officer (`restriction.approved_by`) | Lock applied (`account.lock_applied`, via `PUT /accounts/{account_id}/lock`, `account.lock_type`) | Before restriction takes effect |
| Lock applied (`account.lock_applied`) | Member contact record (`entity.address`, `member.delivery_channel`), rationale (`restriction.grounds`) | Written restriction notice sent (`member.restriction_notice_sent`) | 3 business days unless legally prohibited |
| Credit-union-initiated closure approved (`account.closure_approved`) | Closure grounds (`restriction.grounds`), account balance (`account.balances.balance`), amounts owed (`member.amounts_owed`) | Advance closure notice; account closed (`account.closed`, via `POST /accounts/{account_id}/status`) | 30 days' notice (immediate where fraud/legal process compels) |
| Account closed (`account.closed`) | Final balance net of offsets (`account.balances.balance`, `member.amounts_owed`) | Remaining shares remitted + final statement (`member.closure_payout_sent`) | 10 business days (enforced by `account.closure_payout_due_at`) |

**ALERTS/METRICS:** Weekly report of all active locks with grounds and age (locks older than 90 days without case review escalate to the CCO), restriction-notice latency distribution (target: 100% within 3 business days where permitted), and closure payouts pending beyond 10 business days (target: zero).

## MB-06 — Member Expulsion {#mb-06-member-expulsion}

**WHY (Reg cite):** Expulsion of a member must follow the statutory procedure — permissible grounds, written notice, and the member's right to be heard — under California Credit Union Law ([Cal. Fin. Code Division 5, §14000 et seq.](https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?tocCode=FIN&division=5.&title=&part=&chapter=&article=)); the federal analogue for federally chartered credit unions is FCU Act §118 ([12 U.S.C. §1764](https://www.law.cornell.edu/uscode/text/12/1764)).

**SYSTEM BEHAVIOR:** A member may be expelled only for cause — conduct causing the credit union a loss, activity breaching federal or state law, threatening or abusive behavior toward employees or members, or conduct otherwise harmful to the credit union — under authority delegated by the Board to the CEO, with every expulsion reported to the Board of Directors and the Supervisory Committee at their next scheduled meetings. Membership terminations resulting from loan charge-offs or bankruptcy are handled under collections procedures, not this control. Before expulsion takes effect the member receives written notice stating the grounds and the member's rights, including the right to be heard at a special meeting of members where state law or the bylaws so provide; in extreme cases of abusive behavior the CEO may impose immediate expulsion subject to ratification at the next annual meeting or a specially called meeting. The expelled member has 30 days from the expulsion date to request reconsideration, decided by the CEO. Expulsion does not relieve the member of liability to the credit union or accelerate existing loans, which continue under their original terms; share balances are paid promptly as funds become available, net of amounts owed. A member seeking reinstatement may petition after repaying any losses, with the CEO deciding. Expulsion case records are write-restricted to the CCO and the CEO's office.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Expulsion grounds documented and decided (`member.expulsion_decided`) | Cause and evidence (`expulsion.grounds`, `expulsion.evidence_refs[]`), deciding officer (`expulsion.decided_by`) | Written notice with grounds and hearing/meeting rights (`member.expulsion_notice_sent`) | Before effective date (immediate-expulsion cases: notice within 3 BD, ratification at next meeting) |
| Member exercises right to be heard (`member.expulsion_hearing_requested`) | Hearing request (`expulsion.hearing_requested_at`), meeting logistics (`expulsion.meeting_date`) | Special-meeting record and outcome (`member.expulsion_hearing_held`) | Per bylaws meeting-notice requirements |
| Expulsion effective (`member.expelled`) | Share balances (`account.balances.balance`), amounts owed (`member.amounts_owed`), loan status (`member.outstanding_loans[]`) | Share payout net of offsets + loans continue on original terms (`member.expulsion_payout_sent`) | Promptly as funds become available |
| Reconsideration requested (`member.expulsion_reconsideration_requested`) | Request within window (`expulsion.reconsideration_requested_at`), original case record (`expulsion.grounds`) | Reconsideration decision (`member.expulsion_reconsideration_decided`) | Request within 30 days of expulsion (internal: decide within 30 days of request) |
| Expulsion completed (`member.expelled`) | Case summary (`expulsion.grounds`, `expulsion.decided_by`) | Report to Board and Supervisory Committee (`expulsion.board_report_filed`) | Next scheduled Board and Supervisory Committee meetings |

**ALERTS/METRICS:** Track expulsions per quarter with grounds breakdown reported to the Board, immediate expulsions pending ratification (alert if any remains unratified past the next member meeting), and reconsideration requests pending beyond 30 days (target: zero).

## MB-07 — Member Death & Estate Handling {#mb-07-member-death--estate-handling}

**WHY (Reg cite):** Payable-on-death account proceeds pass to designated beneficiaries under the California Probate Code's multiple-party accounts law ([Cal. Prob. Code §5100 et seq.](https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?tocCode=PROB&division=5.&title=&part=1.&chapter=&article=)), and share insurance treatment of these accounts follows NCUA rules ([12 CFR Part 745](https://www.ecfr.gov/current/title-12/part-745)).

**SYSTEM BEHAVIOR:** On receipt of a verified notice of a member's death — a certified death certificate or equivalent official record — the system flags the member's accounts the same business day, suspends member-initiated debit access (cards, digital credentials, standing instructions) pending estate resolution, and continues to accept deposits; joint accounts with survivorship pass to the surviving joint owner with title updated on documentation. Payable-on-death proceeds are released to the designated beneficiary upon presentation of the death certificate, beneficiary identification verified to MB-01 standards, and a completed claim form; estates without a POD designation require letters testamentary, letters of administration, or a California small-estate affidavit where applicable before release. Amounts owed to the credit union are deducted before payout, and known government-benefit payments received after the date of death are returned per the originator's reclamation rules. Estate case records and payout approvals are write-restricted to Member Services supervisors with Compliance review on payouts above the small-estate threshold.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Verified death notice received (`member.death_reported`) | Certified death certificate (`estate.death_certificate_ref`), member identity (`entity.id`) | Accounts flagged, debit access suspended (`account.death_flag_applied`, via `PUT /accounts/{account_id}/lock`) | Same business day |
| Beneficiary or estate claim submitted (`estate.claim_submitted`) | Claimant identity verified (`estate.claimant_verification_id`), POD designation or letters/affidavit (`estate.authority_document_ref`), claim form (`estate.claim_form_ref`) | Claim documentation determination (`estate.claim_documented`) | 5 business days for completeness review |
| Claim documentation complete (`estate.claim_documented`) | Payable balance (`account.balances.balance`), amounts owed (`member.amounts_owed`) | Payout to beneficiary/estate + final statement (`estate.payout_sent`) | 10 business days (enforced by `estate.payout_due_at`) |
| Post-death government benefit received (`estate.benefit_received_postmortem`) | Date of death (`estate.date_of_death`), payment details (`inbound_payment.id`, `inbound_payment.amount`) | Reclamation return processed (`estate.benefit_returned`) | Per originator reclamation rules |

**ALERTS/METRICS:** Track time from death notice to account flag (target: 100% same business day), estate claims pending documentation beyond 30 days (outreach required), payouts pending beyond 10 business days after documentation (target: zero), and post-death debit activity on flagged accounts (target: zero).

## MB-08 — Member Records & Privacy {#mb-08-member-records--privacy}

**WHY (Reg cite):** Member nonpublic personal information is protected under Regulation P ([12 CFR Part 1016](https://www.ecfr.gov/current/title-12/part-1016)), and credit union records must be maintained per NCUA records-preservation requirements ([12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749)).

**SYSTEM BEHAVIOR:** The system maintains a complete, accurate member record — identity, eligibility basis, account relationships, preference elections, dispute and restriction history, and estate events — with every change captured in the audit trail alongside the actor and the prior value, and prior addresses preserved on every address change. Access to member records is restricted on a need-to-know basis enforced through role-based permissions: front-line staff see the records required for the member in front of them, sensitive fields (verification raw responses, dispute case notes, restriction grounds) are visible only to compliance-scoped roles, and bulk record export requires CCO approval. Retention periods follow the Record Retention Policy schedules, and the privacy-notice program and information-sharing limits are governed by the Privacy Policy; this control governs the record-keeping and access discipline itself. Record-access entitlement changes are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member record changed (`entity.updated`) | Changed fields and prior values (`event.previous_data`), acting user (`record.actor_id`) | Immutable audit entry (`record.audit_entry_written`) | At write time |
| Sensitive-record access occurs (`record.sensitive_access`) | Accessor role (`record.actor_role`), record accessed (`entity.id`), purpose code (`record.access_purpose`) | Access-log entry (`record.access_logged`) | At access time |
| Bulk export requested (`record.bulk_export_requested`) | Requester and justification (`record.actor_id`, `record.export_justification`), CCO approval (`record.export_approved_by`) | Approved export with manifest (`record.bulk_export_completed`) | After approval only (internal: approval decision within 5 BD) |

**ALERTS/METRICS:** Monthly access-log review sampling sensitive-record reads for purpose validity, alert on bulk exports without a logged approval (target: zero), and alert on any record update lacking a corresponding audit entry (reconciliation target: zero gaps).

## MB-09 — Member Service Standards {#mb-09-member-service-standards}

**WHY (Reg cite):** Consistent, non-deceptive member service is a UDAAP expectation under the California Consumer Financial Protection Law ([Cal. Fin. Code §90000 et seq.](https://leginfo.legislature.ca.gov/faces/codes_displayexpandedbranch.xhtml?tocCode=FIN&division=24.&title=&part=&chapter=&article=)) and the federal prohibition on unfair, deceptive, or abusive acts or practices ([12 U.S.C. §5531](https://www.law.cornell.edu/uscode/text/12/5531)).

**SYSTEM BEHAVIOR:** Member-facing service interactions across all channels run against published service standards: a first response to any member inquiry within 1 business day, and resolution or a documented status update within 5 business days, with the inquiry logged, categorized, and tracked to closure. Inquiries that are actually complaints or disputes are reclassified into the MB-04 intake queue at the point of recognition so the correct regulatory clock applies. Channel standards (branch wait targets, call-center answer times, secure-message turnaround) are set by Member Services management within these outer bounds and published to staff; online and mobile channel availability is governed by the E-Commerce Policy. Service-standard configuration is write-restricted to Member Services management with Compliance review at policy renewal.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Member inquiry received (`service.inquiry_received`) | Member identity (`entity.id`), inquiry channel and category (`service.channel`, `service.category`) | First response sent (`service.first_response_sent`) | 1 business day (enforced by `service.first_response_due_at`) |
| Inquiry open past first response (`service.first_response_sent`) | Case status (`service.status`), assigned owner (`service.assigned_to`) | Resolution or status update (`service.resolved` or `service.status_update_sent`) | 5 business days (enforced by `service.resolution_due_at`) |
| Inquiry recognized as complaint (`service.reclassified_as_dispute`) | Inquiry record (`service.inquiry_id`), complaint indicators (`service.category`) | Dispute case opened in MB-04 queue (`dispute.opened`) | At recognition, same business day |

**ALERTS/METRICS:** Weekly service-level dashboard: first-response and resolution SLA attainment by channel (alert below 95%), reclassification latency from inquiry to dispute (target: same day), and aging inquiries past 5 business days escalated to Member Services management.

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for policy content, control performance, and regulatory mapping.
- **Approvers:** Patrick Wilson, Chief Compliance Officer. Expulsion authority and any delegation of it ([MB-06](#mb-06-member-expulsion)) rest with the Board of Directors, which also receives expulsion reports with the Supervisory Committee.
- **Required participants:** Member Services (MB-01, MB-02, MB-03, MB-07, MB-09 operations), BSA (verification gating in MB-01, lock actions in MB-05), Board of Directors (expulsion and special meetings in MB-06).
- **Review cadence:** Annual review and reapproval, or sooner upon material change to California Credit Union Law, CCFPL/DFPI complaint rules, Regulation E, or the Red Flags Rule.
- **Cross-references:** CIP/identity-verification program — BSA Policy. Red Flags technical controls — Information Security Policy. Privacy notices and information sharing — Privacy Policy. Retention schedules — Record Retention Policy. Complaint-program structure and UDAAP monitoring — Compliance Policy. Online/mobile channels — E-Commerce Policy. Account disclosure content — Truth-in-Savings Policy.

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** The current `vocabulary.json` (Cassandra Banking Core v1.0.0) defines no events and is banking-core only: it covers `entity`, `account`, `verification`, `card`, and transfer resources but registers none of the member-lifecycle events, fields, or timers cited in this document (`member.*`, `dispute.*`, `restriction.*`, `expulsion.*`, `estate.*`, `service.*`, `record.*`, `redflags.*`, `fraud.*`, and all `*_due_at` / `*_expires_at` timers). The codes used in the EVENTS tables are the target naming scheme and will be confirmed and registered by engineering before the next review. Where existing resources apply (e.g., `entity.address`, `account.lock_type`, `verification.ofac_result.match_status`, `PUT /accounts/{account_id}/lock`), the registered names were used.
- **Charter assumption.** Pynthia is treated as a California state-chartered credit union: California Credit Union Law (Cal. Fin. Code Division 5) and the California Probate Code govern expulsion and estate handling, with FCU Act §118 cited as the federal analogue. Specific Division 5 section numbers for expulsion and special-meeting procedure, and the bylaws' meeting-notice periods, need confirmation against the current bylaws.
- **Internal SLAs are proposed, not mandated.** The non-regulatory deadlines (5-BD complaint acknowledgment, 15-BD substantive response, 3-BD restriction notice, 30-day closure notice, 10-BD closure/estate payouts, 1-BD/5-BD service standards, 10-calendar-day address-change dispatch hold) are minimum-viable values inferred from industry practice where Patrick's notes were silent; Patrick should confirm or adjust each.
- **Designated complaints officer.** The DFPI/CFPB-routed complaint recipient is assumed to be the CCO or a written designee; the formal designation filed with DFPI needs confirmation.
- **Abusive-conduct definitions and sanction authority** were carried from the reference Abusive Member Policy (CEO imposes sanctions; Executive Team in the CEO's absence; share-account and voting rights always preserved). Whether Pynthia wants Board-level approval for any sanction tier needs confirmation.
- **Reconsideration and reinstatement** windows (30 days to request reconsideration; reinstatement on repayment of losses, decided by the CEO) were carried from the reference expulsion policy and should be reconciled with Pynthia's bylaws.
- **Small-estate threshold and probate documentation** requirements assume current California small-estate affidavit limits; the operational threshold for Compliance review of estate payouts needs to be set.
- **Field-of-membership rule set** (employment groups, geographic boundaries, associations) is assumed to exist as a documented configuration; the authoritative source for those rules and its change-control process need confirmation.
