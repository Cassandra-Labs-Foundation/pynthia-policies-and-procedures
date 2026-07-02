```markdown
---
title: BSA Policy (Table-First, Design-Overlay v3)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2025-07-01
next_review: 2026-07-01
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, BSA, AML, CFT, OFAC, CIP, CDD, FinCEN, NCUA]
---

# BSA Policy

## General Policy Statement

Pynthia Credit Union maintains a risk-based, Board-approved integrated BSA/AML/CFT/OFAC/CIP program that meets [12 CFR § 748.2](https://www.ecfr.gov/current/title-12/part-748#p-748.2) for federally insured credit unions and applicable Treasury regulations under [31 CFR Chapter X](https://www.ecfr.gov/current/title-31/chapter-X). The program verifies member identities, performs customer due diligence (including enhanced due diligence where warranted), monitors and reports suspicious activity, files required reports (CTR, SAR, CMIR, FBAR), maintains required records, screens against OFAC sanctions lists, identifies politically exposed persons, and escalates breaches. It applies to all members, accounts, transactions, channels, and third parties of the credit union. This policy consolidates the formerly separate AML/CFT, OFAC, and Customer Due Diligence programs. Out of scope: information system safeguards and cyber incident response (see Information Security Policy); third-party/vendor onboarding generally (see Third-Party Risk Policy); member privacy and data-handling (see Privacy Policy); general records management outside BSA records (see Record Retention Policy); detection of suspicious activity within payment rails operationally (see Electronic Payment Systems Policy); and IRS/FinCEN Form 8300 (not applicable to Pynthia as a financial institution — CTR obligations under [31 CFR § 1010.311](https://www.ecfr.gov/current/title-31/part-1010#p-1010.311) govern equivalent cash reporting).

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Board policy approval (annual) | Policy anniversary → `governance.policy.approved` | Annual | Board minutes; policy version | [BSA-01](#bsa-01-governance--delegation) |
| Interim policy review on material change | Material change identified → `policy.material_change.flagged` | 30 days | Revised policy version | [BSA-01](#bsa-01-governance--delegation) |
| Risk assessment review | Scheduled or material change → `risk.assessment.completed` | 12–18 months | Risk assessment report | [BSA-02](#bsa-02-enterprise-bsaaml-risk-assessment) |
| CIP verification complete before account opening | Onboarding submitted → `verification.created` | Before account opening | CIP verification record | [BSA-03](#bsa-03-customer-identification-program-cip) |
| CDD profile created at onboarding | KYC/CIP passed → `cdd.profile.created` | At account opening | CDD profile | [BSA-04](#bsa-04-customer-due-diligence--enhanced-due-diligence) |
| EDD refresh (risk-tier driven) | Scheduler → `edd.refresh.due` | Per risk tier (high: annual) | EDD file | [BSA-04](#bsa-04-customer-due-diligence--enhanced-due-diligence) |
| OFAC screening at onboarding | New member/counterparty → `ofac.hold.placed` | Before account activation / pre-execution | OFAC screening result | [BSA-05](#bsa-05-ofac-screening--holds) |
| OFAC block/reject report to OFAC | Block or rejection executed → `ofac.blocked` / `ofac.rejected` | 10 business days | OFAC report | [BSA-05](#bsa-05-ofac-screening--holds) |
| OFAC annual blocked-property report | June 30 snapshot → `ofac.annual_report.filed` | September 30 | Annual OFAC report | [BSA-05](#bsa-05-ofac-screening--holds) |
| BSA alert triage | Alert generated → `bsa_alert.created` | 2 business days | Alert disposition record | [BSA-06](#bsa-06-transaction-monitoring--case-management) |
| SAR decision from case | Case investigation complete → `case.investigation_complete` | 30 days from detection (60 if no suspect) | SAR decision file | [BSA-07](#bsa-07-sar-filing--confidentiality) |
| Continuing SAR | Prior SAR filed → `sar.continuing.filed` | Every 90 days while activity continues | Continuing SAR | [BSA-07](#bsa-07-sar-filing--confidentiality) |
| CTR filing | Cash threshold reached → `ctr.threshold.reached` | 15 calendar days after transaction date | CTR (FinCEN e-file) | [BSA-08](#bsa-08-ctr-filing--exemptions) |
| CTR exemption DOEP filing | First exempt transaction → `ctr.exemption.designated` | 30 days after first exempt transaction | DOEP (FinCEN Form 110) | [BSA-08](#bsa-08-ctr-filing--exemptions) |
| CTR exemption annual review | Scheduler → `ctr.exemption.reviewed` | Annually | Exemption review record | [BSA-08](#bsa-08-ctr-filing--exemptions) |
| Monetary instrument log consolidation | Month-end → `mi.central_log.updated` | 15th of following month | Central MI log | [BSA-09](#bsa-09-monetary-instruments-log) |
| Wire travel-rule validation | Wire ≥ $3,000 submitted → `wire_transfer.submitted` | Before wire release | Wire record with originator/beneficiary | [BSA-10](#bsa-10-travel-rule-wires-3000) |
| 314(a) search and response | FinCEN SISS request received → `regulator.request.received` | 14 calendar days | 314(a) response via SISS | [BSA-11](#bsa-11-information-sharing-314a314b) |
| BSA record retention clock set | Account closed or record created → `account.closed` | Immediately on trigger | Retention record | [BSA-21](#bsa-21-bsa-record-retention) |
| Escalation acknowledgment | Breach/issue reported → `escalation.created` | 1 business day | Escalation acknowledgment | [BSA-12](#bsa-12-escalation-pathway) |
| Escalation action plan | Escalation acknowledged → `escalation.acknowledged` | 5 business days | Action plan | [BSA-12](#bsa-12-escalation-pathway) |
| New-hire BSA training | Employee hired → `employee.hired` | 30 days of hire | Training completion record | [BSA-13](#bsa-13-training) |
| Annual BSA training | Policy anniversary → `training.annual_cycle.opened` | Annually by policy anniversary | Training completion record | [BSA-13](#bsa-13-training) |
| Independent testing | Scheduler → `audit.cycle_timer` | Every 12–18 months | Audit report | [BSA-14](#bsa-14-independent-testing) |
| High-risk category EDD refresh | Scheduler or event → `edd.refresh.due` | At least annually | EDD file with category checklist | [BSA-15](#bsa-15-high-risk-categories-msb-correspondent-private-banking) |
| CMIR filing | Reportable shipment identified → `cmir.reportable.identified` | 15 days after receipt (or by mailing/shipping date) | FinCEN Form 105 | [BSA-16](#bsa-16-cmir-cross-border-currency) |
| FBAR filing | April 15 (auto-extension October 15) → `fbar.filing_timer` | April 15 (auto-extension October 15) | FinCEN Form 114 | [BSA-17](#bsa-17-fbar) |
| Prepaid/third-party vendor annual review | Scheduler → `vendor.annual_review_due` | Annually | Vendor review report | [BSA-18](#bsa-18-prepaid-access--third-parties) |
| PEP EDD before activation | PEP hit at onboarding → `pep.hit` | Before account activation (high-risk PEP) | EDD file with elevated approval | [BSA-19](#bsa-19-pep-screening--edd) |
| FinCEN special measure / GTO operationalization | Special measure or GTO received → `regulatory.correspondence.received` | 1 business day to circulate; GTO-specified deadline to implement | GTO compliance record | [BSA-20](#bsa-20-fincen-special-measures--gtos) |

---

## BSA-01 — Governance & Delegation {#bsa-01-governance--delegation}

**WHY (Reg cite):** [12 CFR § 748.2](https://www.ecfr.gov/current/title-12/part-748#p-748.2) requires a federally insured credit union to maintain a Board-approved BSA/AML program with a designated BSA Officer, internal controls, independent testing, and training. The FFIEC BSA/AML Examination Manual informs examiner expectations for governance structure, RACI accountability, and Board reporting cadence.

**SYSTEM BEHAVIOR:** The Board designates the BSA Officer annually by resolution and approves this policy at least annually; interim review is required within 30 days of any material change. A RACI registry (`governance.raci_registry`) defines roles and segregation of duties across Compliance, BSA Operations, Vendor Management, Payments Operations, HR, and Internal Audit. The BSA Officer produces a monthly Board/committee report covering CTR counts, SAR counts, active exemptions, cash-activity changes, regulatory changes, law-enforcement requests, positive government-list hits, wire activity, training activity, and monetary-instrument log reviews. Policy publication is write-restricted to the BSA Officer; Board and examiners have read access.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Board approves policy annually (`governance.policy.approved`) | Policy draft (`policy.draft_id`), approver roster (`policy.approver_id`), effective date (`policy.effective_date`) | Approved policy version + Board minutes (`governance.policy.approved`; `policy.version.published`) | Annual (enforced by `policy.board_approval_due_at`) |
| Material change identified requiring interim review (`policy.material_change.flagged`) | Change description (`policy.change_description`), change rationale (`policy.change_rationale`) | Revised policy version submitted for Board ratification (`policy.amendment.proposed`) | 30 days of material change |
| BSA Officer designated or re-designated (`governance.bsa_officer.designated`) | BSA Officer ID (`governance.bsa_officer_id`), Board resolution ID (`board.resolution_id`) | Designation record (`governance.designation.recorded`) | Annually or on vacancy |
| Monthly Board/committee report submitted (`reporting.board_pack.submitted`) | BSA metrics (`reporting.bsa_metrics`), SAR count (`reporting.sar_count`), OFAC metrics (`reporting.ofac_metrics`), training metrics (`reporting.training_metrics`) | Board pack delivered (`governance.board_report.delivered`) | Monthly (enforced by `reporting.board_pack_due`) |

**ALERTS/METRICS:** Alert when policy age exceeds 12 months without Board re-approval; alert when BSA Officer designation lapses; track % of monthly Board reports delivered on time (target: 100%).

---

## BSA-02 — Enterprise BSA/AML Risk Assessment {#bsa-02-enterprise-bsaaml-risk-assessment}

**WHY (Reg cite):** [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/part-1020#p-1020.210) requires a risk-based AML program; [12 CFR § 748.2](https://www.ecfr.gov/current/title-12/part-748#p-748.2) requires internal controls calibrated to the credit union's risk profile. The FFIEC BSA/AML Examination Manual requires a documented risk assessment covering products, services, customers, and geographies, with inherent-to-residual scoring and EDD triggers.

**SYSTEM BEHAVIOR:** The BSA Officer maintains a product/partner/channel/geography risk catalog (`risk_catalog_entry`) that computes inherent and residual risk scores and sets EDD triggers by risk tier. The assessment is reviewed every 12–18 months or within 30 days of a material change (new product, new channel, significant customer-base shift, or regulatory change). Results are reported to the Board. The risk catalog is write-restricted to the BSA Officer and Compliance; Internal Audit has read access.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Scheduled risk assessment cycle opens (`risk.assessment.completed`) | Risk catalog entries (`risk_catalog_entry.inherent_score`, `risk_catalog_entry.geography_factors`, `risk_catalog_entry.partner_dependency`), prior assessment results (`risk.assessment_results`) | Updated risk assessment report published to Board (`risk.assessment.published`) | Every 12–18 months (enforced by `risk.assessment_due_at`) |
| Material change triggers out-of-cycle reassessment (`policy.material_change.flagged`) | Change description (`policy.change_description`), affected product/channel/partner | Revised risk assessment (`risk.assessment.completed`) | 30 days of material change |
| EDD trigger threshold set or revised (`risk.rating.recorded`) | Risk tier definitions, EDD trigger criteria (`risk.inherent_rating`, `risk.residual_rating`) | Updated risk catalog entry (`risk.catalog_entry.created`) | At each assessment cycle |

**ALERTS/METRICS:** Alert when last assessment date exceeds 18 months; alert when a material change has not triggered a reassessment within 30 days; track residual-risk score distribution across product/channel/partner catalog.

---

## BSA-03 — Customer Identification Program (CIP) {#bsa-03-customer-identification-program-cip}

**WHY (Reg cite):** [31 CFR § 1020.220](https://www.ecfr.gov/current/title-31/part-1020#p-1020.220) (implementing USA PATRIOT Act § 326) requires collection and verification of legal name, date of birth, address, and TIN for individuals; legal name, address, and TIN for entities; documentary or non-documentary verification; and retention of identity information for 5 years after account closure and verification records for 5 years after made. [12 CFR § 748.2](https://www.ecfr.gov/current/title-12/part-748#p-748.2) incorporates CIP into the BSA program requirement.

**SYSTEM BEHAVIOR:** The system blocks account activation until CIP verification passes. Required identity data for individuals: legal name (`entity.name`), date of birth (`entity.date_of_birth`), address (`entity.address`), and TIN (`entity.tin`). For entities: legal name, address, and EIN/TIN. Documentary verification (unexpired government-issued photo ID) or non-documentary verification (credit bureau, public databases) is permitted; if initial verification fails and additional CDD does not resolve identity, the BSA Officer may close the account. Non-US persons require bank officer approval and one of: TIN, passport number and country of issuance, alien identification card number, or other government-issued document with photo. A 45-day pending list tracks missing TINs for authorized signers; failure to provide within 45 days results in removal from the account. Existing customers with a reasonable belief of known identity are exempt from re-verification. CIP records are write-restricted to onboarding staff; BSA Officer and Compliance have read/override access.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Identity verification initiated at onboarding (`verification.created`) | Legal name (`entity.name`), DOB (`entity.date_of_birth`), address (`entity.address`), TIN (`entity.tin`), document type and number (`verification.type`) | Verification record created (`verification.created`) | Before account opening |
| Verification provider returns result (`verification.completed`) | Provider result (`verification.provider_result`), match status (`verification.match_status`), trust level (`verification.trust_level`) | Pass/conditional/deny decision logged (`verification.completed` or `verification.denied`) | Before account opening (enforced by `verification.expires_at`) |
| Verification fails — manual review required (`verification.denied`) | Discrepancy details, BSA Officer review notes | Manual review outcome; account blocked until resolved (`verification.denied`) | Same business day as failure |
| Account opened after CIP pass (`account.created`) | Verified identity record (`verification.id`), account type (`account.account_type`), opening channel (`account.opening_channel`) | Account created; CIP retention clock set (`account.created`; `record.retention_clock_set`) | Immediately on CIP pass |

**ALERTS/METRICS:** Alert on any account opened without a completed verification record; track manual-review rate and aging queue (target: zero accounts open with unresolved CIP); alert on 45-day TIN pending list items approaching expiry.

---

## BSA-04 — Customer Due Diligence & Enhanced Due Diligence {#bsa-04-customer-due-diligence--enhanced-due-diligence}

**WHY (Reg cite):** [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/part-1020#p-1020.210) requires ongoing CDD including understanding the nature and purpose of customer relationships, maintaining risk profiles, and conducting ongoing monitoring. [31 CFR § 1010.230](https://www.ecfr.gov/current/title-31/part-1010#p-1010.230) requires collection and verification of beneficial ownership for legal-entity customers (natural persons owning ≥ 25% plus one control person). The FFIEC BSA/AML Examination Manual defines EDD expectations for higher-risk customers and entities.

**SYSTEM BEHAVIOR:** At account opening, staff collect expected activity, source of funds, and source of wealth (`cdd.source_of_funds`, `cdd.expected_activity`). A risk tier is assigned (`cdd.risk_tier`) and a CDD profile created. For legal-entity customers, a Beneficial Ownership Certification Form is collected identifying all natural persons owning ≥ 25% (ownership prong) and one control person (control prong); each beneficial owner is subject to CIP-equivalent identity verification and OFAC screening. Exemptions from BO collection apply to certain regulated entities (e.g., federally regulated financial institutions, listed companies, government entities) — rationale is documented. High-risk playbooks govern EDD for higher-risk categories (NRAs, PEPs, MSBs, cash-intensive businesses, NGOs, professional service providers, correspondent accounts, private banking). EDD is completed before account activation for high-risk members. CDD profiles are refreshed per risk tier (high: annually; medium: every 2 years; low: every 3 years) and on event-driven changes (ownership change, adverse media hit, SAR filing). If a trust owns ≥ 25% of a legal entity, the trustee is treated as the beneficial owner. BO data is restricted to need-to-know; Compliance and BSA Officer have write access; Internal Audit has read access.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| CDD profile created at account opening (`cdd.profile.created`) | Expected activity (`cdd.expected_activity`), source of funds (`cdd.source_of_funds`), industry code (`cdd.industry_code`), risk tier (`cdd.risk_tier`) | CDD profile created and logged (`cdd.profile.created`) | At account opening |
| Beneficial ownership form submitted for legal entity (`cdd.bo.certified`) | BO list with name, address, DOB, TIN for each owner ≥ 25% (`entity.name`, `entity.date_of_birth`, `entity.tin`, `entity.address`), control person (`cdd.control_person`), ownership % | BO record created; each BO verified and OFAC-screened (`cdd.bo.certified`) | Before business account opening |
| EDD triggered by risk tier or event (`edd.pep.opened` / `edd.completed`) | Source of wealth (`edd.source_of_wealth`), category checklist (`edd.category_checklist`), approver ID (`edd.approver_id`), site visit report if applicable (`edd.site_visit_report`) | EDD file completed with keep/limit/exit recommendation (`edd.completed`) | Before activation for high-risk; within 5 business days of trigger for existing members |
| CDD profile refresh due (`cdd.profile.refreshed`) | Updated expected activity, source of funds, BO re-check, adverse media rescan | Refreshed CDD profile (`cdd.profile.refreshed`) | Per risk tier (enforced by `cdd.refresh_due`) |
| Ownership change detected (`entity.updated`) | Updated BO list, new ownership percentages | BO record updated; EDD refresh triggered if threshold crossed (`cdd.bo.certified`) | Within 30 days of change |

**ALERTS/METRICS:** Alert when EDD refresh is overdue by risk tier; track % of legal-entity accounts with complete BO records (target: 100%); alert on any high-risk account activated without completed EDD.

---

## BSA-05 — OFAC Screening & Holds {#bsa-05-ofac-screening--holds}

**WHY (Reg cite):** [31 CFR Part 501](https://www.ecfr.gov/current/title-31/part-501) and applicable sanctions program regulations (e.g., [31 CFR Part 594](https://www.ecfr.gov/current/title-31/part-594)) require screening, blocking or rejecting prohibited transactions, reporting to OFAC within 10 business days, and retaining records for 10 years (effective March 12, 2025). The 50% rule requires blocking property of entities 50% or more owned by a sanctioned person even if not on the SDN list.

**SYSTEM BEHAVIOR:** The system screens members, beneficial owners, counterparties, and payments at onboarding and pre-execution against all current OFAC Sanctions Lists (SDN and applicable non-SDN lists). On a potential match, an automatic hold is placed and the BSA Officer is notified immediately. The BSA Officer compares data to determine if the match is valid; if sufficient discrepancies disprove the match, the hold is cleared with documented rationale. If a match is confirmed, the OFAC Hotline (1-800-540-6322) is contacted, the transaction or account is blocked or rejected per OFAC instructions, and a report is filed with OFAC within 10 business days via the OFAC Reporting System (ORS). Blocked funds are held in a segregated interest-bearing account; no set-offs are permitted; normal service charges may be debited. The 50% rule is applied to identify indirectly blocked entities. Licenses and false-positive dispositions are documented. OFAC records are retained for 10 years. The Compliance Officer periodically visits the OFAC website to maintain current list versions. OFAC adjudication is write-restricted to the BSA Officer and designated Compliance staff.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New member, BO, or counterparty screened at onboarding (`ofac.hold.placed`) | Subject identifiers (`entity.name`, `entity.tin`, `entity.date_of_birth`, `entity.address`), list version (`ofac.list_version`), match score (`ofac_result.match_score`) | Screening result logged; hold placed if potential match (`ofac.hold.placed`) | Before account activation / pre-execution |
| Payment or wire screened pre-execution (`ofac.hold.placed`) | Originator and beneficiary identifiers (`originator.name`, `originator.routing_number`, `beneficiary.name`, `beneficiary.routing_number`), payment instructions (`ofac.payment_instructions`) | Screening result logged; hold placed if potential match (`ofac.hold.placed`) | Before transaction execution |
| OFAC list updated (`ofac.list.updated`) | New list version (`ofac.list_version`) | Re-screen triggered for existing members and pending transactions (`ofac.rescreen.completed`) | Within 1 business day of list update |
| Potential match adjudicated — cleared (`ofac.cleared`) | Discrepancy rationale, hotline record if contacted (`ofac.hotline_record`) | Hold released; false-positive documented (`ofac.cleared`) | 1 business day of hold placement |
| Match confirmed — block executed (`ofac.blocked`) | Confirmed match details, blocked property description (`ofac.blocked_property`), OFAC instructions | Blocked funds placed in segregated account; OFAC report filed (`ofac.blocked`; `ofac.report.filed`) | Report to OFAC within 10 business days |
| Match confirmed — transaction rejected (`ofac.rejected`) | Rejection basis, payment instructions copy | Rejection reported to OFAC (`ofac.rejected`; `ofac.report.filed`) | Report to OFAC within 10 business days |
| Annual blocked-property report due (`ofac.annual_report.filed`) | All blocked assets as of June 30 (`ofac.blocked_property`) | Annual report filed with OFAC by September 30 (`ofac.annual_report.filed`) | September 30 annually (enforced by `ofac.annual_report_due`) |

**ALERTS/METRICS:** Alert on any hold unresolved beyond 1 business day; alert on OFAC report not filed within 10 business days of block/rejection; track false-positive rate and average time to disposition; alert when list version is more than 1 business day stale.

---

## BSA-06 — Transaction Monitoring & Case Management {#bsa-06-transaction-monitoring--case-management}

**WHY (Reg cite):** [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/part-1020#p-1020.210) requires ongoing monitoring to identify and report suspicious transactions. [31 CFR § 1020.320](https://www.ecfr.gov/current/title-31/part-1020#p-1020.320) sets SAR filing deadlines anchored to the date of initial detection. The FFIEC BSA/AML Examination Manual defines alert management, case documentation, and SAR decision standards.

**SYSTEM BEHAVIOR:** Rules- and model-based monitoring generates BSA alerts (`bsa_alert`) from transaction streams. Each alert is triaged within 2 business days of generation; alerts that cannot be resolved at triage are escalated to a case (`case`). The SAR decision (file or no-file) must be made within 30 days of the date of initial detection of facts that may constitute suspicious activity (60 days if no suspect is identified). Cases include all supporting evidence, narrative, and a SAR decision file. Elder financial exploitation and human trafficking red flags are treated as suspicious activity and routed through this workflow. The BSA Officer and designated Compliance staff have write access to cases; Internal Audit has read access.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Transaction monitoring system generates alert (`bsa_alert.created`) | Alert type (`bsa_alert.alert_type`), triggering event ID (`bsa_alert.event_id`), entity hash (`bsa_alert.entity_hash`), lookback flag (`bsa_alert.requires_lookback`) | BSA alert created; triage timer started (`bsa_alert.created`; enforced by `bsa_alert.triage_timer`) | Immediately on detection |
| Alert triaged — escalated to case (`case.opened`) | Alert details (`bsa_alert.details`), alert status (`bsa_alert.status`), triage rationale | Case opened with evidence and summary (`case.opened`) | Within 2 business days of alert (enforced by `bsa_alert.triage_timer`) |
| Case investigation complete — SAR decision required (`case.investigation_complete`) | Case evidence (`case.evidence`), case summary (`case.summary`), SAR narrative draft (`sar.narrative`), prior filing ID if continuing (`sar.prior_filing_id`) | SAR decision file produced; SAR filed or no-file documented (`case.investigation_complete`; `sar.decision_file` or `sar.decision_no_file`) | 30 days from initial detection (60 if no suspect; enforced by `case.sar_decision_timer`) |

**ALERTS/METRICS:** Alert on any BSA alert unresolved beyond 2 business days; alert on any case approaching the 30-day SAR decision deadline without a decision; track alert-to-SAR conversion rate and case aging distribution.

---

## BSA-07 — SAR Filing & Confidentiality {#bsa-07-sar-filing--confidentiality}

**WHY (Reg cite):** [31 CFR § 1020.320](https://www.ecfr.gov/current/title-31/part-1020#p-1020.320) requires filing SARs within 30 calendar days of initial detection (60 days if no suspect identified), continuing SARs every 90 days while activity continues, and retaining SARs and supporting documentation for 5 years from the filing date. SAR confidentiality is mandated — no disclosure to the subject; subpoenas for SARs must be declined with notification to FinCEN and NCUA.

**SYSTEM BEHAVIOR:** The SAR committee (BSA Officer, senior management, legal counsel as needed) reviews the case and makes the SAR/no-SAR determination. SARs are filed electronically via FinCEN's BSA E-Filing System. If a violation requires immediate attention (e.g., ongoing reportable violation), law enforcement (IRS Criminal Investigation or FBI) and NCUA are notified by telephone in addition to timely SAR filing. All SAR filings are reported to the Board at the next scheduled meeting. SAR visibility is restricted — only the BSA Officer, designated Compliance staff, and legal counsel may access SAR records; no employee may disclose to any person involved in the transaction that a SAR has been filed or prepared. Subpoenas or other requests to disclose a SAR are declined unless requested by FinCEN, appropriate law enforcement, or a federal banking agency; FinCEN and NCUA are notified of any such subpoena. The SAR committee also determines whether to restrict or close the account of a SAR subject. Monthly Board summaries include SAR counts and brief descriptions (no subject names in Board materials). SAR records are write-restricted to the BSA Officer and designated Compliance staff.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| SAR filing decision made — file (`sar.filed`) | SAR narrative (`sar.narrative`), filing ID (`sar.filing_id`), prior filing ID if applicable (`sar.prior_filing_id`), case evidence (`case.evidence`) | SAR filed electronically; filing ID recorded; Board notified at next meeting (`sar.filed`) | 30 days from initial detection; 60 days if no suspect (enforced by `sar.filing_timer`) |
| SAR filing decision made — no file (`sar.decision_no_file`) | No-file rationale, case summary (`case.summary`) | No-file decision documented and retained (`sar.decision_no_file`) | 30 days from initial detection |
| Continuing activity — continuing SAR due (`sar.continuing.filed`) | 90-day review period activity, prior filing ID (`sar.prior_filing_id`), updated narrative (`sar.narrative`) | Continuing SAR filed (`sar.continuing.filed`) | Every 90 days while activity continues (enforced by `sar.continuing_timer`) |
| Subpoena or disclosure request received for SAR (`sar.disclosure_request.received`) | Request details, requestor identity | Declination issued; FinCEN and NCUA notified (`sar.disclosure.declined`) | Immediately on receipt |

**ALERTS/METRICS:** Alert on any SAR approaching the 30-day deadline without filing; alert on any continuing SAR cycle overdue; track SAR filing timeliness (target: 100% on time); alert on any unauthorized SAR access attempt.

---

## BSA-08 — CTR Filing & Exemptions {#bsa-08-ctr-filing--exemptions}

**WHY (Reg cite):** [31 CFR § 1010.311](https://www.ecfr.gov/current/title-31/part-1010#p-1010.311) and [31 CFR § 1010.306](https://www.ecfr.gov/current/title-31/part-1010#p-1010.306) require filing a FinCEN Currency Transaction Report (CTR) for each currency transaction exceeding $10,000, within 15 calendar days of the transaction date, with aggregation of multiple same-day transactions by or on behalf of the same person. [31 CFR § 1010.311](https://www.ecfr.gov/current/title-31/part-1010#p-1010.311) also governs Phase I and Phase II exemptions; FinCEN Form 110 (Designation of Exempt Person / DOEP) must be filed within 30 days of the first exempt transaction and renewed annually.

**SYSTEM BEHAVIOR:** The system auto-aggregates cash-in and cash-out transactions per person per business day. When the aggregate exceeds $10,000, a CTR is generated and e-filed with FinCEN within 15 calendar days. Phase I exemptions (banks, government entities, listed companies and their subsidiaries) do not require a DOEP filing but require annual monitoring. Phase II exemptions (eligible non-listed businesses and payroll customers) require a DOEP filing within 30 days of the first exempt transaction and annual review to confirm continued eligibility. Ineligible business types (as defined in 31 CFR) cannot be exempted. Revocation of an exemption is effected by resuming CTR filing; a DOEP revocation form is optional. CTR backfilling: if a required CTR was not filed, the credit union begins filing and contacts the FinCEN Help Line. CTR records are retained for 5 years from the date of the report. The BSA Officer reviews CTR system reports daily; write access is restricted to BSA Operations.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Cash aggregation threshold reached for a person on a business day (`ctr.threshold.reached`) | Cash-in total (`ctr.cash_in_total`), cash-out total (`ctr.cash_out_total`), person identity, exemption basis if applicable (`ctr.exemption_basis`) | CTR prepared for e-filing (`ctr.threshold.reached`; enforced by `ctr.filing_timer`) | 15 calendar days after transaction date |
| CTR e-filed with FinCEN (`ctr.filed`) | Completed CTR data, FinCEN filing confirmation | CTR filed; filing ID recorded (`ctr.filed`) | Within 15 calendar days of transaction |
| First exempt transaction — DOEP filing required (`ctr.exemption.designated`) | Exempt person identity, exemption basis (Phase I or II), eligibility documentation | DOEP (FinCEN Form 110) filed; exemption record created (`ctr.doep.filed`; `ctr.exemption.designated`) | Within 30 days of first exempt transaction |
| Annual exemption review due (`ctr.exemption.reviewed`) | Exemption file, eligibility documentation (annual reports, stock quotes, business verification) | Annual review completed; exemption confirmed or revoked (`ctr.exemption.reviewed`) | Annually (enforced by `ctr.exemption_review_timer`) |

**ALERTS/METRICS:** Alert on any CTR not filed within 15 calendar days; alert on any DOEP not filed within 30 days of first exempt transaction; alert on annual exemption reviews overdue; track CTR filing timeliness (target: 100% on time).

---

## BSA-09 — Monetary Instruments Log {#bsa-09-monetary-instruments-log}

**WHY (Reg cite):** [31 CFR § 1010.415](https://www.ecfr.gov/current/title-31/part-1010#p-1010.415) requires recordkeeping for purchases of monetary instruments (cashier's checks, bank drafts) for cash amounts between $3,000 and $10,000 inclusive, including purchaser identity, instrument type, serial numbers, and dollar amounts. Records must be retained for 5 years.

**SYSTEM BEHAVIOR:** At the point of sale, staff verify purchaser identity (via account records/CIP or acceptable photo ID) and capture all required fields. Simultaneous purchases of the same or different instrument types totaling $3,000 or more are treated as one purchase. Indirect currency purchases (where currency is deposited first then used to purchase an instrument) are still subject to recordkeeping. If the purchaser cannot provide required information or cannot be identified, the transaction is refused. Branch-level records are consolidated to the central MI log by the 15th of the following month. The BSA Officer reviews the Official Document Report periodically. MI log write access is restricted to BSA Operations; BSA Officer has read/review access.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Monetary instrument purchased for cash $3,000–$10,000 (`monetary_instrument.purchased`) | Purchaser name (`mi.purchaser_id_number`), purchase date, instrument type (`mi.instrument_type`), serial numbers, dollar amount (`mi.amount`), account number or ID document details | MI log entry created (`mi.log_entry.created`) | At point of sale |
| Monthly consolidation to central log (`mi.central_log.updated`) | All branch MI log entries for the prior month | Central MI log updated (`mi.central_log.updated`; enforced by `mi.consolidation_timer`) | By 15th of following month |

**ALERTS/METRICS:** Alert on any MI purchase record missing required fields; alert on monthly consolidation not completed by the 15th; track completeness rate of MI log entries (target: 100%).

---

## BSA-10 — Travel Rule (Wires ≥ $3,000) {#bsa-10-travel-rule-wires-3000}

**WHY (Reg cite):** [31 CFR § 1010.410(e) and (f)](https://www.ecfr.gov/current/title-31/part-1010#p-1010.410) (the "Travel Rule") require that funds transfers of $3,000 or more include and transmit originator name and address, originator account number, originator's financial institution identity, beneficiary name, beneficiary account number, and beneficiary's financial institution identity. Records must be retrievable by originator or beneficiary name or account number and retained for 5 years.

**SYSTEM BEHAVIOR:** Incoming and outgoing wires are processed only for established members. Before a wire is released, the system validates that all required Travel Rule fields are present. For in-person wire orders, the employee verifies the identity of the person placing the order. For non-in-person orders, a copy or record of the payment method is retained. When acting as an intermediary financial institution, the credit union passes through all received information to the next institution. Exemptions apply when both originator and beneficiary are the same person at the same domestic institution, or when both are domestic banks, government entities, or their subsidiaries. Wire records are retained for 5 years. Wire release is restricted to authorized Payments Operations staff with dual-control for high-value wires.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Wire transfer ≥ $3,000 submitted for processing (`wire_transfer.submitted`) | Originator name and address (`originator.name`, `originator.reference`), originator account number (`party.account_number`), originator FI routing (`originator.routing_number`), beneficiary name (`beneficiary.name`), beneficiary account number (`beneficiary.account_number`), beneficiary FI (`beneficiary.bank_name`, `beneficiary.routing_number`), amount (`wire_transfer.amount`), purpose (`wire_transfer.purpose`) | Travel Rule validation completed; wire record created (`wire_transfer.created`) | Before wire release |
| Wire released after Travel Rule validation (`wire_transfer.created`) | All Travel Rule fields validated, OFAC screening result (`wire_transfer.control_results`) | Wire record retained; IMAD recorded (`wire_transfer.record.retained`) | Immediately on release |
| Incoming wire ≥ $3,000 received (`wire_transfer.created`) | Original payment order retained (`wire_transfer.imad`), all received Travel Rule fields | Incoming wire record retained (`wire_transfer.record.retained`) | Immediately on receipt |

**ALERTS/METRICS:** Alert on any wire released without complete Travel Rule fields; alert on any wire record missing IMAD or retention flag; track Travel Rule field completeness rate (target: 100%).

---

## BSA-11 — Information Sharing (314(a)/314(b)) {#bsa-11-information-sharing-314a314b}

**WHY (Reg cite):** [31 CFR § 1010.520](https://www.ecfr.gov/current/title-31/part-1010#p-1010.520) (Section 314(a)) requires financial institutions to search records and respond to FinCEN SISS requests within 14 calendar days, covering deposit records, funds transfer records (12-month lookback for account-linked transactions; 6-month for non-account-linked), monetary instrument sales records, loan records, and safe deposit records. [31 CFR § 1010.540](https://www.ecfr.gov/current/title-31/part-1010#p-1010.540) (Section 314(b)) provides a voluntary safe harbor for registered financial institutions to share information about suspected money laundering or terrorist financing; annual certification renewal is required.

**SYSTEM BEHAVIOR:** The BSA Officer and designated approved employees receive 314(a) requests via the FinCEN Secure Information Sharing System (SISS). Upon receipt, the credit union searches its master customer database (deposit, loan, wire, MI, and safe deposit records) within the specified lookback windows. Positive matches are reported to FinCEN via SISS within 14 days; no negative response is required. A copy of the response and supporting documents is retained in the 314(a) request file. If a match is found, the SAR committee reviews whether a SAR should be filed. 314(a) request information is confidential — access is limited to approved personnel only; documents are destroyed via shredding when no longer needed. For 314(b), the BSA Officer maintains current FinCEN registration and verifies counterpart registration before sharing; annual certification renewal is tracked. 314(a) access is restricted to BSA Officer and Board-approved employees.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| FinCEN 314(a) SISS request received (`regulator.request.received`) | Request scope (`fincen314a_data.request_scope`), named subjects, lookback windows | Search initiated across all required record types (`regulator.request.received`) | Immediately on receipt |
| 314(a) search completed — match found (`regulator.response.sent`) | Match details (account or transaction match only — no SAR information), SISS response | Positive match reported to FinCEN via SISS; response copy retained (`regulator.response.sent`; `filing.fincen_314a`) | Within 14 calendar days of request |
| 314(a) search completed — no match | Search completion record | No-response documented internally (no FinCEN response required) | Within 14 calendar days of request |
| 314(b) annual certification renewal due (`vendor.annual_review_due`) | FinCEN registration status, counterpart registration (`fincen314a_data.counterpart_registration`) | 314(b) certification renewed; counterpart verification documented | Annually |

**ALERTS/METRICS:** Alert on any 314(a) request approaching the 14-day deadline without response; alert on 314(b) certification lapse; track 314(a) response timeliness (target: 100% within 14 days).

---

## BSA-21 — BSA Record Retention {#bsa-21-bsa-record-retention}

**WHY (Reg cite):** [31 CFR § 1010.430](https://www.ecfr.gov/current/title-31/part-1010#p-1010.430) establishes a 5-year baseline retention period for BSA records. [31 CFR § 1020.220](https://www.ecfr.gov/current/title-31/part-1020#p-1020.220) requires retention of CIP identity information for 5 years after account closure and verification records for 5 years after made. [31 CFR § 1020.320](https://www.ecfr.gov/current/title-31/part-1020#p-1020.320) requires SAR and supporting documentation retention for 5 years from filing date. [31 CFR Part 501](https://www.ecfr.gov/current/title-31/part-501) OFAC regulations require 10-year retention for blocked/rejected transaction records (effective March 12, 2025). [31 CFR § 1010.415](https://www.ecfr.gov/current/title-31/part-1010#p-1010.415) requires 5-year retention for monetary instrument logs. [31 CFR § 1010.410](https://www.ecfr.gov/current/title-31/part-1010#p-1010.410) requires 5-year retention for wire transfer records.

**SYSTEM BEHAVIOR:** Records are stored in immutable, searchable storage indexed to member ID and retrievable by originator/beneficiary name or account number for wire records. Retention clocks are set at the triggering event for each record class per the schedule below. Records subject to a legal hold are not purged until the hold is released (see [SC-02](#sc-02-record-retention-lifecycle-mechanics)). Retention schedules by record class:

| Record Class | Retention Period | Clock Anchor |
|---|---|---|
| CIP identity information | 5 years after account closure | `account.closed` |
| CIP verification records (methods, results, discrepancy resolution) | 5 years after verification made | `verification.completed` |
| SAR and supporting documentation | 5 years from SAR filing date | `sar.filed` |
| CTR records | 5 years from date of report | `ctr.filed` |
| Monetary instrument log records | 5 years from date of record | `mi.log_entry.created` |
| Wire transfer records | 5 years from date of record | `wire_transfer.created` |
| OFAC blocked/rejected transaction records | 10 years after unblocking or rejection date | `ofac.blocked` / `ofac.rejected` |
| OFAC blocked property records | Period of blocking + 10 years after unblocking | `ofac.blocked` |
| CMIR records | 5 years from filing date | `cmir.filed` |
| FBAR records | 5 years from filing date | `fbar.filed` |
| 314(a) request files | Until after most current NCUA BSA exam | `regulator.response.sent` |
| General BSA program records | 5 years | Record creation |

Write access to retention configuration is restricted to Compliance and BSA Officer; records are encrypted at rest and in transit.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Account closed — CIP retention clock set (`account.closed`) | Account ID (`account.id`), closure date, member ID (`member.id`), CIP record reference (`verification.id`) | Retention clock set for CIP identity records (5 years from closure) (`record.retention_clock_set`; `retention.timer_set`) | Immediately on account closure |
| Verification completed — verification record retention clock set (`verification.completed`) | Verification ID (`verification.id`), verification date, methods used (`verification.type`), results (`verification.match_status`) | Retention clock set for verification records (5 years from date made) (`record.retention_clock_set`) | Immediately on verification completion |
| SAR filed — SAR retention clock set (`sar.filed`) | SAR filing ID (`sar.filing_id`), filing date | Retention clock set for SAR and supporting docs (5 years from filing) (`record.retention_clock_set`) | Immediately on SAR filing |
| OFAC block or rejection executed — OFAC retention clock set (`ofac.blocked` / `ofac.rejected`) | OFAC report ID, block/rejection date, property description (`ofac.blocked_property`) | Retention clock set (10 years from unblocking/rejection) (`record.retention_clock_set`) | Immediately on block/rejection |
| BSA record created (CTR, MI log, wire, CMIR, FBAR) | Record type, creation date, filing ID | Retention clock set per schedule above (`record.retention_clock_set`) | Immediately on record creation |

**ALERTS/METRICS:** Alert on any BSA record without a retention clock set; alert on retrieval failures during examiner export requests (target: zero); track % of records indexed and retrievable by required identifiers.

---

## SC-02 — Record-Retention Lifecycle Mechanics {#sc-02-record-retention-lifecycle-mechanics}

**WHY (Reg cite):** [31 CFR § 1010.430](https://www.ecfr.gov/current/title-31/part-1010#p-1010.430) (BSA 5-year baseline); [31 CFR § 1020.220](https://www.ecfr.gov/current/title-31/part-1020#p-1020.220) (CIP retention); [31 CFR Part 501](https://www.ecfr.gov/current/title-31/part-501) (OFAC 10-year retention). Legal-hold obligations arise under applicable federal and state litigation-hold doctrine. Permanent-record categories are defined by the credit union's Record Retention Policy.

**SYSTEM BEHAVIOR:** Once a retention clock is set (by BSA-21 or any other domain control), the lifecycle engine manages three phases: (1) **Active retention** — record is immutable and indexed; no deletion permitted. (2) **Legal-hold override** — if a `legal_hold` is placed on a record, the destruction clock is suspended regardless of the scheduled expiry; the clock resumes only after the hold is released and `legal_hold.clear.confirmed` is logged. (3) **Destruction** — when `record.retention.expires_at` is reached and no legal hold is active, the destruction workflow is initiated: a destruction manifest is created, dual-control approval is obtained, the record is destroyed by an approved method, and a `destruction_log` entry is written. Permanent records (as classified in the Record Retention Policy) are never destroyed; the engine flags them and routes to archival. The engine is write-restricted to the Records Management function; Compliance and Legal have read access; no individual user may self-authorize destruction.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Retention clock expires and no legal hold is active (`record.retention.expired`) | Record ID (`record.id`), retention class (`record.retention_class`), retention anchor (`record.retention_anchor`), legal-hold status (`record.hold_status`) | Destruction workflow initiated; destruction manifest created (`record.destruction.initiated`) | Immediately on expiry |
| Legal hold placed on a record (`legal_hold.created`) | Matter ID (`legal_hold.matter_id`), hold scope (`legal_hold.hold_scope`), authorizer (`record.hold_authorizer`) | Destruction clock suspended; hold registry updated (`record.hold.placed`; `legal_hold.created`) | Immediately on hold placement |
| Legal hold released (`legal_hold.clear.confirmed`) | Hold release authorization (`legal_hold.release_approved_by`), matter closure confirmation | Destruction clock resumed; hold registry updated (`record.hold.lifted`; `legal_hold.clear.confirmed`) | Immediately on release |
| Destruction approved and executed (`record.destroyed`) | Destruction manifest ID, dual-control approver IDs, destruction method (`record.disposal_method`) | Destruction log entry written; certificate of destruction recorded (`record.destroyed`; `destruction_log.entry.created`) | Within the destruction workflow SLA (internal: 5 business days of manifest creation) |
| Permanent record identified at expiry (`record.retention.expired` with permanent class) | Record class (`record.class`), permanent classification basis | Record flagged as permanent; routed to archival; no destruction initiated (`record.retained`) | Immediately on expiry check |

**ALERTS/METRICS:** Alert on any destruction initiated without dual-control approval; alert on any legal-hold record approaching scheduled expiry (to confirm hold is still active); track destruction backlog age (target: zero records past expiry + 5 BD without disposition); alert on any permanent record flagged for destruction in error.

---

## BSA-12 — Escalation Pathway {#bsa-12-escalation-pathway}

**WHY (Reg cite):** [12 CFR § 748.2](https://www.ecfr.gov/current/title-12/part-748#p-748.2) requires internal controls that ensure timely detection and escalation of BSA/AML breaches. The FFIEC BSA/AML Examination Manual expects documented escalation procedures with defined timelines and regulator notification where applicable.

**SYSTEM BEHAVIOR:** Any employee may initiate a one-click breach or emergent-issue escalation to the BSA Officer and General Counsel via the escalation workflow. The BSA Officer acknowledges internally within 1 business day and produces an action plan within 5 business days. Where the breach or issue requires regulator notification (e.g., NCUA, FinCEN), the action plan includes the notification timeline and responsible party. Escalation records are write-restricted to the reporter and BSA Officer; General Counsel and Board have read access.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Breach or emergent issue reported (`escalation.created`) | Description (`escalation.description`), facts (`escalation.facts`), severity (`escalation.severity`), reporter ID (`escalation.reporter_id`), regulatory assessment (`escalation.regulatory_assessment`) | Escalation created; BSA Officer and General Counsel notified (`escalation.created`; `escalation.routed`) | Immediately on report |
| BSA Officer acknowledges escalation (`escalation.acknowledged`) | Acknowledgment timestamp, BSA Officer ID | Acknowledgment logged (`escalation.acknowledged`) | Within 1 business day (enforced by `escalation.ack_timer`) |
| Action plan produced (`escalation.action_plan.published`) | Action plan with remediation steps, responsible parties, regulator notification plan if applicable | Action plan published (`escalation.action_plan.published`) | Within 5 business days of acknowledgment (enforced by `escalation.plan_timer`) |

**ALERTS/METRICS:** Alert on any escalation unacknowledged beyond 1 business day; alert on any action plan not produced within 5 business days; track open escalations by severity and age.

---

## BSA-13 — Training {#bsa-13-training}

**WHY (Reg cite):** [12 CFR § 748.2](https://www.ecfr.gov/current/title-12/part-748#p-748.2) requires periodic training for all appropriate personnel. [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/part-1020#p-1020.210) requires training as a component of the AML program. The FFIEC BSA/AML Examination Manual expects role-based curricula, new-hire training within 30 days, annual training, and separate Board/committee training tracking.

**SYSTEM BEHAVIOR:** HR triggers new-hire training assignment within 1 business day of hire; the employee must complete initial BSA training within 30 days. Annual training is assigned at the policy anniversary cycle and must be completed by the policy anniversary date. Role-based curricula (`training.role_curriculum`) are tailored to each employee's BSA responsibilities. Board and committee members receive annual training tracked separately (`training.board_curriculum`). The BSA Officer and Assistant BSA Officer attend at least one external training session per year. Training records and materials are maintained. Training completion is reported to the Board/audit committee. Training records are write-restricted to HR and the BSA Officer; Internal Audit has read access.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New employee hired (`employee.hired`) | Employee ID (`employee.id`), hire date (`training.hire_date`), role (`employee.role`) | New-hire BSA training assignment created (`training.assignment.created`; enforced by `training.new_hire_timer`) | Within 1 business day of hire |
| New-hire training completed (`training.initial.completed`) | Employee ID, curriculum ID (`training.curriculum_id`), completion date, assessment score (`training.assessment_score`) | Training completion recorded (`training.completion.recorded`) | Within 30 days of hire (enforced by `training.newhire_due_at`) |
| Annual training cycle opens (`training.annual_cycle.opened`) | Policy anniversary date, role-based curriculum version (`training.curriculum_map`), Board curriculum (`training.board_curriculum`) | Annual training assignments created for all staff and Board (`training.annual.assigned`) | At policy anniversary |
| Annual training completed (`training.completed`) | Employee ID, curriculum ID, completion date, assessment score | Training completion recorded; Board/committee training tracked separately (`training.completion.recorded`) | By policy anniversary (enforced by `training.annual_due_at`) |
| External training attended by BSA Officer (`training.session.delivered`) | BSA Officer ID, training provider, date, relevance to regulatory changes | External training record logged (`training.completion.recorded`) | At least once per year |

**ALERTS/METRICS:** Alert on any new hire approaching 30-day training deadline without completion; alert on annual training completion rate below 100% at policy anniversary; track Board training completion separately; alert on BSA Officer external training not completed within the calendar year.

---

## BSA-14 — Independent Testing {#bsa-14-independent-testing}

**WHY (Reg cite):** [12 CFR § 748.2](https://www.ecfr.gov/current/title-12/part-748#p-748.2) requires independent testing of the BSA/AML program. [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/part-1020#p-1020.210) includes independent testing as a required AML program component. The FFIEC BSA/AML Examination Manual specifies that testing must be conducted every 12–18 months by qualified persons reporting directly to the Board or audit committee, covering all controls in this policy.

**SYSTEM BEHAVIOR:** A qualified external auditor (or qualified internal audit function independent of BSA operations) conducts risk-based testing every 12–18 months. The scope is mapped to all controls in this policy. The audit report is delivered to the Board or audit committee. All findings are tracked to closure in the finding management system. The BSA Officer may conduct internal reviews between independent tests; results are provided to the audit committee. Remediation of prior audit and examination findings is tracked and reported. Internal Audit has write access to findings; BSA Officer and Compliance have read access.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Independent testing cycle opens (`audit.plan_cycle.opened`) | Scope mapped to BSA controls (`audit.engagement_scope`), prior findings (`audit.management_responses`), risk-based testing plan | Audit engagement started (`audit.engagement.started`) | Every 12–18 months (enforced by `audit.cycle_timer`) |
| Audit report issued (`audit.report.issued`) | Audit findings, overall rating (`audit.overall_rating`), management responses | Report issued to Board/audit committee (`audit.report.issued`; `audit.results_delivered_to_board`) | Within agreed engagement timeline |
| Finding opened from audit (`finding.opened`) | Finding description (`finding.description`), severity (`finding.severity`), responsible party (`finding.responsible_party`), remediation due date | Finding tracked in finding management system (`finding.opened`) | Immediately on report issuance |
| Finding remediated and closed (`finding.closed`) | Remediation evidence (`finding.remediation_evidence`), closure verification | Finding closed; closure logged (`finding.closed`; `finding.closure.logged`) | Per agreed remediation timeline (enforced by `finding.response_due_at`) |

**ALERTS/METRICS:** Alert when last independent test date exceeds 18 months; alert on findings past remediation due date; track % of findings closed on time; alert on critical findings not escalated to Board within 1 business day.

---

## BSA-15 — High-Risk Categories (MSB, Correspondent, Private Banking) {#bsa-15-high-risk-categories-msb-correspondent-private-banking}

**WHY (Reg cite):** [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/part-1020#p-1020.210) requires risk-based EDD for higher-risk customers. The FFIEC BSA/AML Examination Manual provides specific guidance for MSBs (including FinCEN registration verification and state licensing), foreign correspondent accounts, and private banking accounts for non-US persons. [31 CFR § 1010.610](https://www.ecfr.gov/current/title-31/part-1010#p-1010.610) governs due diligence for correspondent accounts; [31 CFR § 1010.620](https://www.ecfr.gov/current/title-31/part-1010#p-1010.620) governs private banking accounts.

**SYSTEM BEHAVIOR:** Category-specific checklists are applied at onboarding and at each EDD refresh for MSBs, foreign correspondent accounts, and private banking accounts for non-US persons. For MSBs: FinCEN registration is verified (if required), state licenses are confirmed, agent status is confirmed if applicable, and a site visit is documented where warranted. EDD for all high-risk categories is refreshed at least annually. If the credit union does not currently offer foreign correspondent accounts or private banking for non-US persons, this control documents the monitoring obligation and the process to activate if those products are introduced. High-risk category EDD files are write-restricted to the BSA Officer and Compliance; Internal Audit has read access.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| High-risk category account opened (MSB, correspondent, private banking) (`edd.completed`) | Category checklist (`edd.category_checklist`), MSB FinCEN registration number if applicable (`edd.msb_registration_number`), state license confirmation, site visit report if applicable (`edd.site_visit_report`), approver ID (`edd.approver_id`) | EDD file completed; account activated only after EDD approval (`edd.completed`) | Before account activation |
| Annual EDD refresh due for high-risk category (`edd.refresh.completed`) | Updated category checklist, re-verified registrations and licenses, updated site visit if warranted | EDD file refreshed (`edd.refresh.completed`) | Annually (enforced by `edd.refresh_due`) |
| Site visit conducted (`edd.site_visit.completed`) | Site visit report (`edd.site_visit_report`), visit date, findings | Site visit logged (`edd.site_visit.logged`; `edd.site_visit.completed`) | As required by risk tier or EDD playbook |

**ALERTS/METRICS:** Alert on any high-risk category account with EDD refresh overdue; alert on MSB account with unverified FinCEN registration; track % of high-risk category accounts with current EDD (target: 100%).

---

## BSA-16 — CMIR (Cross-Border Currency) {#bsa-16-cmir-cross-border-currency}

**WHY (Reg cite):** [31 CFR § 1010.340](https://www.ecfr.gov/current/title-31/part-1010#p-1010.340) requires filing FinCEN Form 105 (Report of International Transportation of Currency or Monetary Instruments) for currency or monetary instruments exceeding $10,000 transported into or out of the United States by credit union personnel. The report must be filed within 15 days after receipt (or by the mailing or shipping date if not accompanying a person). Records are retained for 5 years.

**SYSTEM BEHAVIOR:** The BSA Officer identifies reportable cross-border currency shipments or receipts by credit union personnel. FinCEN Form 105 is e-filed within the required deadline. Filing confirmations are stored and linked to the CMIR record. CMIR records are retained for 5 years from the filing date. CMIR filing is write-restricted to the BSA Officer.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Reportable cross-border currency shipment or receipt identified (`cmir.reportable.identified`) | Amount (`cmir_data.amount`), direction (`cmir_data.direction`), counterparty (`cmir_data.counterparty`), shipment manifest (`cmir_data.shipment_manifest`) | CMIR reportable event logged; filing timer started (`cmir.reportable.identified`; enforced by `cmir.filing_timer`) | Immediately on identification |
| FinCEN Form 105 filed (`cmir.filed`) | Completed Form 105 data, FinCEN filing confirmation | CMIR filed; confirmation stored (`cmir.filed`) | Within 15 days after receipt (or by mailing/shipping date if not accompanying a person; enforced by `cmir.filing_timer`) |

**ALERTS/METRICS:** Alert on any CMIR not filed within 15 days of the triggering event; track CMIR filing timeliness (target: 100% on time).

---

## BSA-17 — FBAR {#bsa-17-fbar}

**WHY (Reg cite):** [31 CFR § 1010.350](https://www.ecfr.gov/current/title-31/part-1010#p-1010.350) requires filing FinCEN Form 114 (FBAR) annually for foreign financial accounts exceeding $10,000 in aggregate value at any point during the calendar year. The filing deadline is April 15 with an automatic extension to October 15. Records are retained for 5 years from the filing date.

**SYSTEM BEHAVIOR:** The BSA Officer maintains an inventory of foreign financial accounts held by the credit union. The FBAR calendar is maintained with the April 15 deadline and automatic October 15 extension. FinCEN Form 114 is e-filed via the BSA E-Filing System. If the credit union currently holds no qualifying foreign accounts, a nil determination is documented. FBAR records are retained for 5 years. FBAR filing is write-restricted to the BSA Officer.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Foreign account inventory updated (`fbar.inventory.updated`) | Account records (`fbar_data.account_record`), authority type (`fbar_data.authority_type`), aggregate value | FBAR inventory updated (`fbar.inventory.updated`) | Annually and on account change |
| FBAR filing due (`fbar.filed`) | Completed Form 114 data, aggregate account values, FinCEN filing confirmation | FBAR filed via BSA E-Filing System (`fbar.filed`) | April 15 (auto-extension to October 15; enforced by `fbar.filing_timer`) |
| No qualifying foreign accounts — nil determination (`fbar.nil.determined`) | Nil determination rationale | Nil determination documented (`fbar.nil.determined`) | By April 15 |

**ALERTS/METRICS:** Alert when FBAR filing deadline approaches without a filed or nil-determined status; track FBAR filing timeliness (target: 100% on time).

---

## BSA-18 — Prepaid Access & Third Parties {#bsa-18-prepaid-access--third-parties}

**WHY (Reg cite):** [12 CFR § 748.2](https://www.ecfr.gov/current/title-12/part-748#p-748.2) requires that the credit union retain accountability for BSA/AML functions performed by third parties. [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/part-1020#p-1020.210) requires that the AML program cover all products and channels, including prepaid access and third-party-managed programs. The FFIEC BSA/AML Examination Manual and Interagency Third-Party Risk Management Guidance require life-cycle vendor oversight with audit rights, data access, and sanctions compliance contractual requirements.

**SYSTEM BEHAVIOR:** Before onboarding any vendor providing AML/CFT screening, prepaid access, or transaction monitoring services, a vendor due-diligence package is completed (`vendor.dd_package`, `vendor.bsa_function_scope`, `vendor.bsa_role_flag`). Contracts must include clauses for data access, audit rights, sanctions compliance, and incident notification compatible with the credit union's escalation timelines. System program limits are configured and monitored. Critical vendor alerts (e.g., screening outages, model drift) are routed in real time into the transaction monitoring workflow. Annual vendor reviews are conducted. Vendor management is write-restricted to Vendor Management and Compliance; BSA Officer has read/approval access.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| New BSA/AML or prepaid vendor onboarded (`vendor.onboarding.started`) | Due-diligence package (`vendor.dd_package`), contract clauses (`vendor.contract_clauses`), BSA function scope (`vendor.bsa_function_scope`), program limits | Vendor onboarding started; BSA role flagged (`vendor.onboarding.started`; `vendor.bsa_role.flagged`) | Before go-live |
| Vendor contract clauses verified (`vendor.contract_clauses.verified`) | Audit rights clause, data access clause, sanctions compliance clause, incident notification clause | Contract clauses verified and documented (`vendor.contract_clauses.verified`) | Before go-live |
| Critical vendor alert received (`vendor.critical.alert`) | Alert details (`vendor_alert.alert_details`), impact scope (`vendor_alert.impact_scope`) | Alert routed to transaction monitoring; BSA Officer notified (`vendor.critical.alert`) | Real-time |
| Annual vendor review completed (`vendor.review.completed`) | Updated due-diligence package, KPI results (`vendor_review.efficacy_results`), contract review | Annual vendor review report produced (`vendor.review.completed`) | Annually (enforced by `vendor.annual_review_due`) |

**ALERTS/METRICS:** Alert on any BSA/AML vendor without a current annual review; alert on critical vendor alerts not acknowledged within 1 business day; track vendor SLA adherence and model drift indicators.

---

## BSA-19 — PEP Screening & EDD {#bsa-19-pep-screening--edd}

**WHY (Reg cite):** [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/part-1020#p-1020.210) requires risk-based EDD for higher-risk customers. The FFIEC BSA/AML Examination Manual identifies politically exposed persons (current or former senior foreign political figures, their immediate family, and close associates) as a higher-risk category requiring EDD, senior management approval, source of wealth determination, and enhanced monitoring. There is no categorical prohibition on PEP relationships; risk-based assessment governs.

**SYSTEM BEHAVIOR:** Applicants, beneficial owners, and authorized signers are screened against PEP datasets at onboarding and at each CDD refresh. PEP hits are routed to EDD with elevated approval (senior management sign-off required). EDD for high-risk PEPs must be completed before account activation. PEP status is determined by assessing the person's official responsibilities, whether the title is honorary or salaried, level of authority over government activities, and access to government assets. Source of wealth and source of funds are documented. Enhanced monitoring is applied to PEP relationships. PEP screening results and EDD files are write-restricted to the BSA Officer and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| PEP screening conducted at onboarding or refresh (`pep.hit` / `pep.refresh.completed`) | Subject identifiers (`entity.name`, `entity.date_of_birth`, `entity.tin`), PEP dataset version, PEP status (`pep_status.status`), subject role (`pep_status.subject_role`) | PEP screening result logged; hit routed to EDD if positive (`pep.hit` or `pep.refresh.completed`) | At onboarding and each CDD refresh |
| PEP EDD opened (`edd.pep.opened`) | PEP status determination, source of wealth (`edd.source_of_wealth`), source of funds (`cdd.source_of_funds`), countries of residence, senior management approval (`edd.approver_id`) | EDD file opened; elevated approval required (`edd.pep.opened`) | Immediately on PEP hit |
| PEP EDD completed (`edd.pep.completed`) | Completed EDD file, senior management approval, monitoring cadence set | EDD completed; account activated (if approved) or declined (`edd.pep.completed`) | Before account activation for high-risk PEPs |
| PEP designated in system (`pep.designated`) | PEP designation basis, subject role, relationship to political figure | PEP designation recorded; enhanced monitoring applied (`pep.designated`) | Immediately on EDD completion |

**ALERTS/METRICS:** Alert on any PEP hit not routed to EDD within 1 business day; alert on any high-risk PEP account activated without completed EDD; track PEP EDD completion rate (target: 100% before activation).

---

## BSA-20 — FinCEN Special Measures & GTOs {#bsa-20-fincen-special-measures--gtos}

**WHY (Reg cite):** USA PATRIOT Act § 311 (codified at [31 USC § 5318A](https://www.law.cornell.edu/uscode/text/31/5318A)) authorizes the Secretary of the Treasury, through FinCEN, to impose special measures on jurisdictions, financial institutions, or transactions of primary money laundering concern. Geographic Targeting Orders (GTOs) are issued under [31 USC § 5326](https://www.law.cornell.edu/uscode/text/31/5326) and may impose additional recordkeeping or reporting requirements on covered financial institutions within specified geographic areas. [31 CFR § 1010.430](https://www.ecfr.gov/current/title-31/part-1010#p-1010.430) requires 5-year retention of GTO compliance records.

**SYSTEM BEHAVIOR:** The BSA Officer is the designated intake owner for FinCEN special measures and GTOs. Upon receipt, the BSA Officer assesses applicability and circulates to affected business lines within 1 business day. Required recordkeeping or reporting changes are implemented within the GTO-specified deadline. GTO compliance records are retained for 5 years. If a special measure or GTO is directed at the credit union's sector, the BSA Officer determines whether the credit union is a covered institution and documents the determination. GTO compliance records are write-restricted to the BSA Officer and Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| FinCEN special measure or GTO received (`regulatory.correspondence.received`) | Special measure or GTO text, applicability assessment, affected business lines | Correspondence logged; applicability determination documented (`regulatory.correspondence.received`; `regulatory.change_analysis.logged`) | Immediately on receipt |
| Special measure or GTO circulated to affected business lines (`regulatory.change_implemented`) | Affected business line contacts, implementation requirements, GTO-specified deadline | Circulation documented; implementation tasks assigned (`regulatory.change_implemented`) | Within 1 business day of receipt |
| GTO recordkeeping or reporting implemented (`regulatory.change_implemented`) | Implementation evidence, compliance records per GTO requirements | GTO compliance record created; retention clock set (5 years) (`regulatory.change_implemented`; `record.retention_clock_set`) | Within GTO-specified deadline |

**ALERTS/METRICS:** Alert on any special measure or GTO not circulated within 1 business day of receipt; alert on any GTO implementation deadline approaching without confirmed completion; track GTO compliance record retention (target: 100% with retention clock set).

---

## Governance & Sign-Off {#governance}

**Owner:** Patrick Wilson, Chief Compliance Officer

**Approvals:**
- Patrick Wilson, Chief Compliance Officer

**Review Cadence:** Annual Board approval required; interim review within 30 days of any material change (new product, new channel, significant regulatory change, or material shift in risk profile).

**Reporting:** Monthly BSA metrics to Board/audit committee (CTR counts, SAR counts, active exemptions, cash-activity changes, regulatory changes, law-enforcement requests, positive government-list hits, wire activity, training activity, monetary-instrument log reviews). Independent testing results reported to Board or audit committee upon completion.

**Cross-References:**
- Information Security Policy (cyber incident response; out of scope here)
- Third-Party Risk Policy (general vendor onboarding and oversight; out of scope here)
- Privacy Policy (member privacy and data-handling; out of scope here)
- Record Retention Policy (general records management schedules; out of scope here)
- Electronic Payment Systems Policy (suspicious activity detection within payment rails operationally; out of scope here)

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** Several field and event codes referenced in the EVENTS tables throughout this document are not yet registered in `core-vocabulary.json` or are listed only as provisional codes. Specifically: `cmir_data.amount`, `cmir_data.counterparty`, `cmir_data.direction`, `cmir_data.shipment_manifest`, `mi.amount`, `mi.instrument_type`, `mi.purchaser_id_number`, `mi.central_log`, `fbar_data.account_record`, `fbar_data.authority_type`, `sar.filing_id`, `pep_status.status`, `pep_status.subject_role`, `vendor.bsa_function_scope`, `vendor.bsa_role_flag`, `vendor_review.efficacy_results`, `vendor_alert.alert_details`, `vendor_alert.impact_scope`, `escalation.description`, `escalation.regulatory_assessment`, `reporting.bsa_metrics`, `reporting.ofac_metrics`, `reporting.training_metrics`, `governance.raci_registry`, `governance.bsa_officer_id`, `risk_catalog_entry.inherent_score`, `risk_catalog_entry.geography_factors`, `risk_catalog_entry.partner_dependency`. Names used are the target naming scheme and will be confirmed by engineering before the next review. All other codes reuse registered vocabulary from `core-vocabulary.json`.

- **FBAR applicability.** The reference policy states the credit union does not currently hold qualifying foreign financial accounts. This policy documents the FBAR obligation and nil-determination process. If the credit union acquires foreign accounts, the BSA Officer must activate the full FBAR filing workflow. This assumption should be confirmed annually.

- **CMIR applicability.** The reference policy states the credit union has not completed cross-border currency shipments to date. This policy documents the CMIR obligation. If the credit union begins such transactions, the BSA Officer must activate the CMIR filing workflow. This assumption should be confirmed annually.

- **Foreign correspondent accounts and private banking for non-US persons.** The reference policy states these products are not currently offered. BSA-15 documents the monitoring obligation and activation process. If these products are introduced, full EDD playbooks per [31 CFR § 1010.610](https://www.ecfr.gov/current/title-31/part-1010#p-1010.610) and [31 CFR § 1010.620](https://www.ecfr.gov/current/title-31/part-1010#p-1010.620) must be implemented before launch.

- **CDD refresh frequencies.** The risk-tier-based refresh cadences (high: annually; medium: every 2 years; low: every 3 years) are stated as defaults consistent with FFIEC guidance. The Board should formally approve specific frequencies as part of the risk assessment (BSA-02) and document them in the risk catalog.

- **SAR committee composition.** The reference policy identifies the SAR committee as the BSA Officer, comptroller, and President/CEO (with legal counsel as needed). Pynthia Credit Union should confirm the equivalent committee composition and document it in the RACI registry (`governance.raci_registry`).

- **314(b) registration status.** The reference policy indicates the credit union has authority to register under 314(b) but may not currently be registered. The BSA Officer should confirm current registration status and maintain annual certification renewal if registered.

- **OFAC 10-year retention effective date.** The 10-year OFAC record retention requirement is stated as effective March 12, 2025. Records created before that date should be reviewed against the prior retention schedule; Counsel should confirm the transition treatment.

- **GTO geographic applicability.** BSA-20 assumes the credit union monitors FinCEN for GTOs directed at its sector or geographic area. The BSA Officer should establish a documented process for receiving FinCEN GTO notifications (e.g., FinCEN email subscription, regulatory counsel alerts) and confirm this process is operational.

- **Prepaid access program limits.** BSA-18 references system program limits for prepaid access products. Specific limit values are not defined in this policy and should be set by the Board as part of the risk appetite statement and documented in the risk catalog.
```
