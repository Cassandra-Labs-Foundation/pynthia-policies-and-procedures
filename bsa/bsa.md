---
title: BSA Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v3.0
effective: 2026-06-04
next_review: 2027-06-04
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, BSA, AML, CFT, OFAC, CIP, CDD, Sanctions]
---

# BSA Policy

## General Policy Statement

Pynthia Credit Union maintains a risk-based, Board-approved, integrated BSA/AML/CFT/OFAC/CIP program that satisfies [12 CFR § 748.2](https://www.ecfr.gov/current/title-12/part-748/section-748.2) for federally insured credit unions and applicable Treasury regulations in [31 CFR Chapter X](https://www.ecfr.gov/current/title-31/chapter-X). The program verifies member identities, performs customer due diligence (including enhanced due diligence where warranted), monitors and timely reports suspicious and reportable activity (SAR, CTR, CMIR, FBAR), maintains required records, screens members, counterparties, and payments against OFAC sanctions lists, identifies politically exposed persons, governs and independently tests third parties that perform AML/CFT screening, and escalates breaches to the BSA Officer. It applies to all members, accounts, transactions, channels, and third parties of the credit union, and consolidates the formerly separate AML/CFT, OFAC, and Customer Due Diligence programs into this single policy. Out of scope (covered by sibling policies): information-system safeguards and cyber incident response (Information Security Policy), general third-party onboarding and oversight (Third-Party Risk Policy), member privacy and data handling (Privacy Policy), non-BSA records schedules (Record Retention Policy), and operational suspicious-activity detection inside payment rails (Electronic Payment Systems Policy).

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Annual Board policy approval | Review cycle opens → `governance.policy_review_due` | Annually; interim review ≤ 30 days after material change | Board minutes + approved policy version | [BSA-01](#bsa-01-governance--delegation) |
| Enterprise risk assessment refresh | Scheduler or material change → `risk.assessment_due` | Every 12–18 months or on material change | Refreshed risk catalog + residual scores | [BSA-02](#bsa-02-enterprise-bsaaml-risk-assessment) |
| CIP verification before activation | Application submitted → `entity.created` | Before account activation | Verification record (`verification`) | [BSA-03](#bsa-03-customer-identification-program-cip) |
| Beneficial ownership before activation | Business application → `entity.created` (business) | Before account activation | BO certification + verified BO identities | [BSA-04](#bsa-04-cdd--edd-incl-beneficial-ownership) |
| OFAC pre-execution screen | Payment initiated → `ach_transfer.created` / `wire_transfer.created` | Before execution (real time) | Screening result (`ofac_result`) | [BSA-05](#bsa-05-ofac-screening--holds) |
| OFAC blocked/rejected report | Block or reject decision → `ofac.blocked` / `ofac.rejected` | 10 business days | OFAC Reporting System filing | [BSA-05](#bsa-05-ofac-screening--holds) |
| OFAC annual blocked-property report | Calendar → `ofac.annual_report_due` | By September 30 (assets as of June 30) | Annual blocked-property report | [BSA-05](#bsa-05-ofac-screening--holds) |
| Alert triage | Alert generated → `bsa_alert.created` | 2 business days | Triage disposition on alert | [BSA-06](#bsa-06-transaction-monitoring--case-management) |
| SAR/no-SAR decision | Case opened → `case.opened` | 30 days from initial detection | Decision memo | [BSA-06](#bsa-06-transaction-monitoring--case-management) |
| CTR e-filing | Cash aggregation > $10,000 → `ctr.threshold_reached` | 15 calendar days | FinCEN CTR | [BSA-07](#bsa-07-ctr-filing) |
| DOEP filing | First exempted transaction → `ctr.exemption_designated` | 30 days | FinCEN DOEP | [BSA-07](#bsa-07-ctr-filing) |
| SAR filing (suspect known) | SAR decision = file → `sar.decision_file` | 30 calendar days from detection | FinCEN SAR | [BSA-08](#bsa-08-sar-filing--confidentiality) |
| SAR filing (no suspect) | SAR decision = file, no suspect → `sar.decision_file` | 60 calendar days from detection | FinCEN SAR | [BSA-08](#bsa-08-sar-filing--confidentiality) |
| Continuing SAR | Activity continues → `sar.continuing_review_due` | Every 90 days (file ≤ 30 days after review) | Continuing SAR | [BSA-08](#bsa-08-sar-filing--confidentiality) |
| Monetary instrument log consolidation | Branch log entry → `monetary_instrument.purchased` | By the 15th of the following month | Central monetary instruments log | [BSA-09](#bsa-09-monetary-instruments-logs) |
| Travel Rule validation | Wire ≥ $3,000 initiated → `wire_transfer.created` | Before wire release | Complete originator/beneficiary record | [BSA-10](#bsa-10-travel-rule-wires-3000) |
| 314(a) search & response | FinCEN SISS request → `fincen.314a_received` | 14 calendar days | SISS match/no-match response | [BSA-11](#bsa-11-information-sharing-314a314b) |
| Retention purge | Schedule expiry → `retention.purge_due` | 5 years (BSA baseline) / 10 years (OFAC) | Purge audit log | [BSA-12](#bsa-12-record-retention) |
| Escalation acknowledgment | Breach escalated → `escalation.created` | 1 business day (internal ack) | Acknowledgment record | [BSA-13](#bsa-13-escalation-pathway) |
| Escalation action plan | Acknowledgment issued → `escalation.acknowledged` | 5 business days | Action plan (incl. regulator notice where applicable) | [BSA-13](#bsa-13-escalation-pathway) |
| New-hire training | Hire date → `training.assigned` | 30 days of hire | Completion record | [BSA-14](#bsa-14-training) |
| Annual training | Policy anniversary → `training.annual_due` | By policy anniversary | Completion record | [BSA-14](#bsa-14-training) |
| Independent testing | Scheduler → `audit.engagement_due` | Every 12–18 months | Independent test report + remediation plan | [BSA-15](#bsa-15-independent-testing) |
| High-risk EDD refresh | Tier scheduler → `edd.refresh_due` | At least annually | Refreshed EDD file | [BSA-16](#bsa-16-high-risk-categories-msb-correspondent-private-banking) |
| CMIR filing | Reportable shipment/receipt → `cmir.reportable_identified` | 15 days after receipt (or by ship/mail date if unaccompanied) | FinCEN Form 105 + confirmation | [BSA-17](#bsa-17-cmir-cross-border-currency) |
| FBAR e-filing | Calendar → `fbar.filing_due` | April 15 (auto-extension to October 15) | FinCEN Form 114 | [BSA-18](#bsa-18-fbar) |
| Vendor annual review (prepaid/third party) | Scheduler → `vendor.review_due` | Annually | Vendor review pack | [BSA-19](#bsa-19-prepaid-access--third-parties) |
| PEP EDD before activation (high risk) | PEP hit → `pep.hit` | Before account activation | EDD file with elevated approval | [BSA-20](#bsa-20-pep-screening--edd) |

## BSA-01 — Governance & Delegation {#bsa-01-governance--delegation}

- **WHY (Reg cite):** A federally insured credit union must maintain a written, Board-approved BSA compliance program with internal controls, independent testing, a designated BSA Officer, and training — [12 CFR § 748.2](https://www.ecfr.gov/current/title-12/part-748/section-748.2); the AML program pillars are mirrored at [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/part-1020/section-1020.210).
- **SYSTEM BEHAVIOR:** The Board establishes and administers the integrated BSA/AML/OFAC program, designates the Chief Compliance Officer as BSA Officer, and approves this policy at least annually with an interim review within 30 days of any material change (regulatory, product, partner, or finding-driven). Roles and segregation of duties are defined in a RACI registry covering Compliance, BSA Operations, Vendor Management, Payments Operations, HR, and Internal Audit; the registry is reviewed with each policy approval. The BSA Officer provides monthly Board summaries (CTR/SAR counts, exemptions, OFAC activity, training, 314(a) volume). The policy artifact and RACI registry are write-restricted to Compliance; Board and examiners have read access.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual review cycle opens or material change identified (`governance.policy_review_due`) | Current policy version (`policy.version`), change summary (`policy.change_summary`), RACI registry (`governance.raci_registry`) | Board-approved policy version + minutes (`governance.policy_approved`) | Annually; ≤ 30 days after material change (enforced by `governance.review_timer`) |
  | BSA Officer designation made or changed (`governance.bsa_officer_designated`) | Officer identity (`governance.bsa_officer_id`), authority and resource statement (`governance.authority_statement`) | Designation record in Board minutes (`governance.designation_recorded`) | At designation; reconfirmed annually |
  | Monthly reporting window closes (`reporting.board_pack_due`) | CTR/SAR/exemption counts (`reporting.bsa_metrics`), OFAC activity (`reporting.ofac_metrics`), training status (`reporting.training_metrics`) | Board BSA summary pack (`reporting.board_pack_submitted`) | Monthly, before next scheduled Board meeting |

- **ALERTS/METRICS:** Policy age vs. 12-month clock; days since last RACI review; count of material changes without a 30-day interim review (target zero); Board pack on-time delivery rate.

## BSA-02 — Enterprise BSA/AML Risk Assessment {#bsa-02-enterprise-bsaaml-risk-assessment}

- **WHY (Reg cite):** A risk-based program requires the credit union to identify and assess money laundering, terrorist financing, and sanctions risk across products, members, channels, and geographies — [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/part-1020/section-1020.210) and the internal-controls pillar of [12 CFR § 748.2](https://www.ecfr.gov/current/title-12/part-748/section-748.2).
- **SYSTEM BEHAVIOR:** Compliance maintains a structured risk catalog covering products, partners, channels, and geographies. Each catalog entry carries an inherent risk score, mapped mitigating controls, and a computed residual score; residual scores above appetite set EDD triggers consumed by [BSA-04](#bsa-04-cdd--edd-incl-beneficial-ownership) and [BSA-16](#bsa-16-high-risk-categories-msb-correspondent-private-banking). The assessment refreshes every 12–18 months and on material change (new product, new partner, new geography, examination finding). New products or channels may not launch until a catalog entry exists. The catalog is write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Refresh scheduler fires or material change logged (`risk.assessment_due`) | Risk catalog (`risk.catalog[]`), inherent scores (`risk.inherent_score`), control inventory (`risk.mitigating_controls[]`) | Refreshed assessment with residual scores + Board report (`risk.assessment_published`) | 12–18 months or on material change (enforced by `risk.assessment_timer`) |
  | New product/partner/channel proposed (`product.change_proposed`) | Product description (`risk.candidate_profile`), geography exposure (`risk.geography_factors`), partner involvement (`risk.partner_dependency`) | Catalog entry with risk score + EDD trigger settings (`risk.catalog_entry_created`) | Before launch |

- **ALERTS/METRICS:** Assessment age vs. 18-month ceiling; count of products live without a catalog entry (target zero); distribution of residual scores vs. Board risk appetite; EDD trigger hit rate by catalog entry.

## BSA-03 — Customer Identification Program (CIP) {#bsa-03-customer-identification-program-cip}

- **WHY (Reg cite):** The CIP rule requires collection of legal name, date of birth, address, and TIN, documentary or non-documentary verification, government-list comparison, and recordkeeping — [31 CFR § 1020.220](https://www.ecfr.gov/current/title-31/part-1020/section-1020.220), incorporated into the credit union program by [12 CFR § 748.2(b)(3)](https://www.ecfr.gov/current/title-12/part-748/section-748.2).
- **SYSTEM BEHAVIOR:** Every new member (person, business, trust, or joint) must supply legal name, DOB (individuals), physical address, and TIN before onboarding proceeds; the platform rejects entity creation without these fields. Verification runs through the `verification` resource (providers: `alloy`, `persona`, `socure`, `middesk`, or `partner_provided` under [BSA-19](#bsa-19-prepaid-access--third-parties) trust rules) using documentary or non-documentary methods per risk; account activation is blocked until `verification.status = approved`. Members receive the CIP notice at onboarding. Identity information is retained 5 years after account closure; verification records (methods, results, discrepancy resolution) are retained 5 years after they are made, per [BSA-12](#bsa-12-record-retention). Verification overrides are restricted to trained Compliance reviewers under dual control.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Member application submitted (`entity.created`) | Legal name (`entity.name`), DOB (`entity.date_of_birth`), address (`entity.address`), TIN (`entity.tin`) | Verification initiated (`verification.created`) | At application; activation blocked until complete |
  | Provider returns result (`verification.completed`) | Provider outcome (`verification.status`), identity/document flags (`provider_result.identity_verified`, `provider_result.document_verified`), risk signals (`provider_result.risk_signals[]`) | Approved/denied entity state + activation gate release (`entity.activated` or `entity.disabled`) | Before account activation (gate enforced by `verification.status`) |
  | Verification fails or mismatches (`verification.denied`) | Denial reasons (`verification.denial_reasons[]`) | Manual-review case or account refusal; SAR referral if identity appears false (`bsa_alert.created`, `alert_type = watchlist_hit` or `sar_candidate`) | Same business day referral to BSA Operations |

- **ALERTS/METRICS:** Accounts activated without approved verification (target zero, hard gate); verification turnaround distribution; manual-review queue aging; denial rate by provider and reason.

## BSA-04 — CDD / EDD (incl. Beneficial Ownership) {#bsa-04-cdd--edd-incl-beneficial-ownership}

- **WHY (Reg cite):** Ongoing customer due diligence — understanding nature and purpose of relationships and maintaining risk profiles — is required by [31 CFR § 1020.210(b)(5)](https://www.ecfr.gov/current/title-31/part-1020/section-1020.210); beneficial ownership identification and verification for legal entities (each ≥25% owner plus one control person) is required by [31 CFR § 1010.230](https://www.ecfr.gov/current/title-31/part-1010/section-1010.230).
- **SYSTEM BEHAVIOR:** At onboarding, the credit union collects expected activity, source of funds, and (for higher-risk members) source of wealth, and builds a member risk profile that drives monitoring thresholds in [BSA-06](#bsa-06-transaction-monitoring--case-management). For legal-entity members, the beneficial ownership certification identifies every natural person owning ≥25% plus one control person; each beneficial owner is identity-verified under [BSA-03](#bsa-03-customer-identification-program-cip) and screened under [BSA-05](#bsa-05-ofac-screening--holds) and [BSA-20](#bsa-20-pep-screening--edd). Regulated and listed entities excluded by § 1010.230(e) are exempt from BO collection, with the exemption rationale documented in the member file. High-risk members follow category playbooks ([BSA-16](#bsa-16-high-risk-categories-msb-correspondent-private-banking)). Profiles refresh per risk tier and on event-driven changes (ownership change, activity deviation, adverse information). CDD profile edits are restricted to BSA Operations and Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Application submitted (`entity.created`) | Expected activity (`cdd.expected_activity`), source of funds (`cdd.source_of_funds`), occupation/industry (`cdd.industry_code`) | Member risk profile with tier (`cdd.profile_created`) | Before account activation |
  | Business application submitted (`entity.created`, business/trust) | BO list with ownership % (`cdd.beneficial_owners[]`), control person (`cdd.control_person`), BO identity data (`entity.name`, `entity.date_of_birth`, `entity.address`, `entity.tin` per owner) | BO certification + verified BO identities (`cdd.bo_certified`) | Before account activation |
  | Risk-tier scheduler or trigger event fires (`cdd.refresh_due`, `entity.updated`) | Current profile (`cdd.profile`), transaction history (`bookkeeping_entry` stream), updated member data (`entity.*`) | Refreshed profile + re-tiering decision (`cdd.profile_refreshed`) | Per tier — high: 12 months; moderate: 24 months; low: 36 months (enforced by `cdd.refresh_timer`; `verification.expires_at` aligns) |
  | EDD trigger fires (`risk.trigger_edd`) | Source of wealth (`edd.source_of_wealth`), supplemental documents (`edd.documents[]`), senior approval (`edd.approver_id`) | EDD file with keep/limit/exit recommendation (`edd.completed`) | Open within 1 business day; complete within 5 business days |

- **ALERTS/METRICS:** % of active members with a complete, current risk profile; BO certification completeness for legal entities (target 100%); refresh on-time rate by tier; EDD aging beyond 5 business days.

## BSA-05 — OFAC Screening & Holds {#bsa-05-ofac-screening--holds}

- **WHY (Reg cite):** OFAC regulations require blocking property of sanctioned parties and rejecting prohibited transactions, with reporting and recordkeeping under [31 CFR Part 501](https://www.ecfr.gov/current/title-31/part-501) (see [§ 501.603](https://www.ecfr.gov/current/title-31/part-501/section-501.603) reporting and [§ 501.601](https://www.ecfr.gov/current/title-31/part-501/section-501.601) 10-year recordkeeping, effective March 12, 2025); the Global Terrorism Sanctions Regulations at [31 CFR Part 594](https://www.ecfr.gov/current/title-31/part-594) illustrate the blocking regime.
- **SYSTEM BEHAVIOR:** Every member, beneficial owner, signer, counterparty, and payment is screened against OFAC lists (SDN, Consolidated Sanctions) at onboarding (via `verification.ofac_result`) and pre-execution for ACH, wire, RTP, book transfers, and card authorizations through the control engine. The 50% rule is applied: entities owned 50% or more, individually or in aggregate, by blocked persons are treated as blocked even if unlisted. Potential matches auto-hold the transaction or account (compliance lock; funds reflected in `bookkeeping.locked_amount`) pending adjudication by a sanctions analyst; confirmed matches are blocked into a segregated interest-bearing account or rejected per program, and OFAC licenses are tracked to authorize any release. False positives are dispositioned with a documented rationale. Blocking/rejection reports go to OFAC within 10 business days; the annual blocked-property report (assets as of June 30) is filed by September 30. OFAC records are retained 10 years per [BSA-12](#bsa-12-record-retention). Adjudication is restricted to designated sanctions analysts; list-update administration is owned by the BSA Officer.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Onboarding verification runs (`verification.created`) | Subject identifiers (`entity.name`, `entity.date_of_birth`, `entity.tin`), list data (`ofac_result.matched_lists[]`) | Screening result (`ofac_result.match_status` = clear / potential_match / confirmed_match) | Before account activation (real time) |
  | Payment initiated (`ach_transfer.created`, `wire_transfer.created`, `book_transfer.created`, `card_authorization.created`) | Counterparty name (`counterparty.name`, `beneficiary.name`, `originator.name`), routing data (`counterparty.routing_number`, `beneficiary.routing_number`) | Control-engine pass/hold decision (`control_results[]`; hold logged as `ofac.hold_placed`) | Pre-execution (real time; hold reflected in `bookkeeping.locked_amount`) |
  | Potential match held (`ofac.hold_placed`) | Match score (`ofac_result.match_score`), member data, OFAC hotline guidance (`ofac.hotline_record`) | Adjudication: clear, block, or reject (`ofac.cleared` / `ofac.blocked` / `ofac.rejected`) | Adjudicate within 1 business day (internal) |
  | Block or reject decided (`ofac.blocked` / `ofac.rejected`) | Property details (`ofac.blocked_property`), transaction instructions copy (`ofac.payment_instructions`) | OFAC Reporting System filing (`ofac.report_filed`) | 10 business days (enforced by `ofac.report_timer`) |
  | Annual report calendar fires (`ofac.annual_report_due`) | All blocked property as of June 30 (`ofac.blocked_inventory[]`) | Annual blocked-property report (`ofac.annual_report_filed`) | By September 30 |
  | OFAC list update published (`ofac.list_updated`) | Updated list datasets (`ofac.list_version`) | Full member-base rescreen (`ofac.rescreen_completed`) | Within 1 business day of list update (internal) |

- **ALERTS/METRICS:** Screening coverage (% of payments with `control_results` containing an OFAC evaluation — target 100%); hold adjudication aging beyond 1 business day; 10-day report timeliness (target zero late); false-positive rate and analyst throughput; list-update-to-rescreen latency.

## BSA-06 — Transaction Monitoring & Case Management {#bsa-06-transaction-monitoring--case-management}

- **WHY (Reg cite):** The AML program must include internal controls and ongoing monitoring sufficient to identify and report suspicious activity — [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/part-1020/section-1020.210); detection feeds the SAR obligation at [31 CFR § 1020.320](https://www.ecfr.gov/current/title-31/part-1020/section-1020.320).
- **SYSTEM BEHAVIOR:** The BSA Approver (real-time) and BSA Reporter (scheduled) generate alerts (`bsa_alert`) from rules and models — CTR thresholds, suspected structuring, cross-fintech activity, velocity anomalies, watchlist hits, SAR candidates — tuned to the member risk profiles from [BSA-04](#bsa-04-cdd--edd-incl-beneficial-ownership). Analysts triage every alert within 2 business days; escalated alerts open a case with a 90-day lookback where `requires_lookback` is set. The SAR/no-SAR decision is made within 30 days of initial detection where suspicion is warranted, then handed to [BSA-08](#bsa-08-sar-filing--confidentiality) for filing. No-SAR decisions are documented in a do-not-file memo. Operational rail-level detection mechanics live in the Electronic Payment Systems Policy; this control owns the alert-to-decision workflow. Alert and case records are read-restricted to BSA Operations and Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Rule or model fires (`bsa_alert.created`) | Alert type (`bsa_alert.alert_type`), entity hash (`bsa_alert.entity_hash`), triggering event (`bsa_alert.event_id`), details (`bsa_alert.details`) | Triage disposition (`bsa_alert.status` → under_review / cleared / escalated) | 2 business days (internal; enforced by `bsa_alert.triage_timer`) |
  | Alert escalated (`bsa_alert.status = escalated`) | Transaction history (`bookkeeping_entry` stream), member profile (`cdd.profile`), lookback flag (`bsa_alert.requires_lookback`) | Case record with investigation file (`case.opened`) | Same business day as escalation |
  | Investigation concludes (`case.investigation_complete`) | Investigation summary (`case.summary`), supporting documents (`case.evidence[]`) | SAR/no-SAR decision memo (`sar.decision_file` or `sar.decision_no_file`) | 30 days from initial detection (enforced by `case.sar_decision_timer`) |

- **ALERTS/METRICS:** Alert triage aging beyond 2 business days (target zero); alert-to-SAR conversion rate by rule (for tuning); open-case aging distribution; backlog count vs. analyst capacity.

## BSA-07 — CTR Filing {#bsa-07-ctr-filing}

- **WHY (Reg cite):** Currency transactions exceeding $10,000 by, through, or to the credit union must be reported — [31 CFR § 1010.311](https://www.ecfr.gov/current/title-31/part-1010/section-1010.311) — within 15 calendar days per [31 CFR § 1010.306](https://www.ecfr.gov/current/title-31/part-1010/section-1010.306); exemptions follow [31 CFR § 1020.315](https://www.ecfr.gov/current/title-31/part-1020/section-1020.315).
- **SYSTEM BEHAVIOR:** The system auto-aggregates cash-in and cash-out separately per person per business day across all branches and channels; when either side exceeds $10,000 a CTR work item is generated and e-filed with FinCEN within 15 calendar days. Phase I and Phase II exempt persons are maintained on the Designation of Exempt Person (DEP) list; a DOEP is e-filed within 30 days of the first transaction the credit union wishes to exempt, and every exemption is re-reviewed annually with supporting eligibility documentation. Transactions by exempt persons remain subject to suspicious-activity monitoring under [BSA-06](#bsa-06-transaction-monitoring--case-management). Missed filings are back-filed with a FinCEN back-filing determination request. The DEP list is write-restricted to the BSA Officer.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Daily cash aggregation exceeds $10,000 per person (`ctr.threshold_reached`) | Aggregated amounts (`ctr.cash_in_total`, `ctr.cash_out_total`), conductor identity (`entity.name`, `entity.tin`), transaction set (`bookkeeping_entry` references) | E-filed CTR + FinCEN acknowledgment (`ctr.filed`) | 15 calendar days (internal: 10 days; enforced by `ctr.filing_timer`) |
  | First transaction to be exempted occurs (`ctr.exemption_designated`) | Eligibility evidence (`ctr.exemption_basis`), entity type (`entity.type`), account tenure (`account.created_at`) | E-filed DOEP + DEP list entry (`ctr.doep_filed`) | 30 days |
  | Annual exemption review fires (`ctr.exemption_review_due`) | DEP list (`ctr.dep_list[]`), eligibility documentation (`ctr.exemption_evidence[]`), account cash flows (`bookkeeping_entry` stream) | Renewed or revoked exemption with rationale (`ctr.exemption_reviewed`) | Annually (enforced by `ctr.exemption_review_timer`) |

- **ALERTS/METRICS:** CTRs filed past 15 days (target zero); aggregation-engine coverage across channels; exemption reviews past due; back-filing count (target zero).

## BSA-08 — SAR Filing & Confidentiality {#bsa-08-sar-filing--confidentiality}

- **WHY (Reg cite):** SARs must be filed within 30 calendar days of initial detection (60 days if no suspect is identified), records retained 5 years, and SAR existence kept strictly confidential — [31 CFR § 1020.320](https://www.ecfr.gov/current/title-31/part-1020/section-1020.320).
- **SYSTEM BEHAVIOR:** When [BSA-06](#bsa-06-transaction-monitoring--case-management) produces a file decision, the BSA Officer (or designee) prepares and e-files the SAR with FinCEN: 30 days from detection when a suspect is known, 60 days when none is identified, and continuing SARs every 90 days while activity persists (review covers 90 days from prior filing; file within 30 days of review close). For ongoing violations requiring immediate attention, law enforcement and the NCUA are notified by phone in addition to the filing. SARs and supporting documentation are retained 5 years from filing. SAR visibility is restricted to the BSA Officer, designated SAR-cleared staff, and the Board summary process — monthly Board summaries disclose counts and themes without unauthorized detail. Any subpoena or request for a SAR is declined, with notification to FinCEN and the NCUA; no employee may disclose SAR existence to any transaction party. Safe-harbor protection under 31 USC § 5318(g)(3) covers good-faith filings.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | SAR decision = file, suspect known (`sar.decision_file`) | Case file (`case.summary`, `case.evidence[]`), suspect identity (`entity.*`), narrative (`sar.narrative`) | E-filed SAR + acknowledgment (`sar.filed`) | 30 calendar days from detection (enforced by `sar.filing_timer`) |
  | SAR decision = file, no suspect (`sar.decision_file`) | Case file (`case.summary`), transaction detail (`bookkeeping_entry` references), narrative (`sar.narrative`) | E-filed SAR + acknowledgment (`sar.filed`) | 60 calendar days from detection (enforced by `sar.filing_timer`) |
  | Continuing-activity review due (`sar.continuing_review_due`) | Prior SAR (`sar.prior_filing_id`), 90-day activity window (`bookkeeping_entry` stream) | Continuing SAR (`sar.continuing_filed`) | Review every 90 days; file ≤ 30 days after review (enforced by `sar.continuing_timer`) |
  | SAR filed (`sar.filed`) | Filing record (`sar.filing_id`), count metadata (`reporting.sar_count`) | Monthly Board summary line (`reporting.board_pack_submitted`) | Next monthly Board pack |
  | Subpoena or third-party request for SAR received (`sar.disclosure_request_received`) | Request document (`legal.request_doc`), requester identity (`legal.requester`) | Declination + FinCEN/NCUA notification (`sar.disclosure_declined`) | Promptly upon receipt (internal: 2 business days) |

- **ALERTS/METRICS:** SARs filed past the 30/60-day deadline (target zero); continuing-SAR cadence adherence; unauthorized SAR-access attempts (target zero, access-log monitored); monthly Board summary delivery rate.

## BSA-09 — Monetary Instruments Logs {#bsa-09-monetary-instruments-logs}

- **WHY (Reg cite):** Records of cash purchases of monetary instruments between $3,000 and $10,000 inclusive — purchaser identity, instrument type, and serial numbers — are required by [31 CFR § 1010.415](https://www.ecfr.gov/current/title-31/part-1010/section-1010.415).
- **SYSTEM BEHAVIOR:** For every cash purchase of monetary instruments (cashier's checks, money orders, drafts) of $3,000–$10,000 inclusive, the system captures purchaser name, verified identity (member record or acceptable ID), date, instrument type(s), serial number(s), and amount(s). Simultaneous and same-business-day purchases aggregating to $3,000 or more are treated as one purchase; indirect purchases (cash deposited then instrument bought) remain in scope. If identification cannot be completed the transaction is refused. Branch entries consolidate to the central log by the 15th of the following month, and the log is retained 5 years per [BSA-12](#bsa-12-record-retention). The central log is write-restricted to BSA Operations.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Cash instrument purchase of $3,000–$10,000 (`monetary_instrument.purchased`) | Purchaser identity (`entity.name`, `entity.tin` or ID document number `mi.purchaser_id_number`), instrument type/serials (`mi.instrument_type`, `mi.serial_numbers[]`), amount (`mi.amount`) | Branch log entry (`mi.log_entry_created`) | At time of sale (refuse if ID unavailable) |
  | Monthly consolidation window closes (`mi.consolidation_due`) | All branch entries for prior month (`mi.branch_entries[]`) | Central monetary instruments log update (`mi.central_log_updated`) | By the 15th of the following month (enforced by `mi.consolidation_timer`) |

- **ALERTS/METRICS:** Consolidations completed past the 15th (target zero); log entries with missing required fields (target zero, validated at entry); aggregation-miss exceptions found in periodic review.

## BSA-10 — Travel Rule (Wires ≥ $3,000) {#bsa-10-travel-rule-wires-3000}

- **WHY (Reg cite):** Funds transfers of $3,000 or more require collection, retention, and transmittal of originator, beneficiary, and financial-institution information — the recordkeeping and Travel Rule at [31 CFR § 1010.410(e) and (f)](https://www.ecfr.gov/current/title-31/part-1010/section-1010.410).
- **SYSTEM BEHAVIOR:** Before any wire of $3,000 or more is released, the system validates that the record contains originator name, address, account number, amount, execution date, beneficiary name and account, and the identity of the beneficiary's financial institution; outbound Fedwire messages carry the required transmittal information forward. Inbound wires retain the original payment order. As an intermediary the credit union passes through all received information without a duty to obtain data not provided upstream. Records are retrievable by originator or beneficiary name or account number and retained 5 years per [BSA-12](#bsa-12-record-retention). Intra-institution transfers between the same person's accounts are exempt per § 1010.410(e)(6). Wire-record edits are restricted to Payments Operations with Compliance oversight.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Outbound wire ≥ $3,000 initiated (`wire_transfer.created`) | Originator data (`originator.name`, `account.id`, `entity.address`), beneficiary data (`beneficiary.name`, `beneficiary.account_number`, `beneficiary.routing_number`, `beneficiary.bank_name`), amount (`wire_transfer.amount`), purpose (`wire_transfer.purpose`) | Validated, releasable wire with complete Travel Rule record (`wire_transfer.submitted`; trace via `wire_transfer.imad`) | Before wire release (hard gate in control engine) |
  | Inbound wire ≥ $3,000 received (`wire_transfer.created`, inbound) | Fedwire originator block (`originator.name`, `originator.routing_number`, `originator.reference`) | Retained payment-order record (`wire_transfer.record_retained`) | At receipt; retained 5 years per `retention.schedule` |

- **ALERTS/METRICS:** Wires released with incomplete Travel Rule fields (target zero — hard gate); validation-failure rate at initiation; record-retrieval test success rate in periodic audits.

## BSA-11 — Information Sharing (314(a)/(b)) {#bsa-11-information-sharing-314a314b}

- **WHY (Reg cite):** Section 314(a) requires searching records and responding to FinCEN requests within 14 days — [31 CFR § 1010.520](https://www.ecfr.gov/current/title-31/part-1010/section-1010.520); voluntary institution-to-institution sharing with safe harbor requires annual 314(b) certification — [31 CFR § 1010.540](https://www.ecfr.gov/current/title-31/part-1010/section-1010.540).
- **SYSTEM BEHAVIOR:** Designated, Board-approved recipients receive FinCEN 314(a) requests via the Secure Information Sharing System (SISS). The credit union searches deposit, funds-transfer, monetary-instrument, loan, and safe-deposit records across the specified lookbacks (12 months for account-linked transactions, 6 months for non-account transactions, current accounts at any time). Positive matches are reported via SISS within 14 days with no detail beyond the fact of the match; negative responses are not required. Matches feed a case review in [BSA-06](#bsa-06-transaction-monitoring--case-management). The 314(b) certification is renewed annually, and counterpart registration is verified through FinCEN before any information is shared. 314(a) request files and search documentation are access-restricted to designated recipients only.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | FinCEN SISS request received (`fincen.314a_received`) | Named subjects (`fincen.subject_list[]`), record indexes (`entity.*`, `bookkeeping_entry`, `wire_transfer`, `mi.central_log`) | Documented search + SISS response for matches (`fincen.314a_responded`) | 14 calendar days (internal: 10 days; enforced by `fincen.314a_timer`) |
  | 314(b) certification anniversary (`fincen.314b_renewal_due`) | Current certification (`fincen.314b_certification`), sharing procedures (`fincen.314b_procedures`) | Renewed certification (`fincen.314b_renewed`) | Annually |
  | Counterpart sharing request received (`fincen.314b_request_received`) | Counterpart registration status (`fincen.counterpart_registration`), request scope (`fincen.request_scope`) | Verified-counterpart share or declination (`fincen.314b_share_logged`) | Before any information is shared |

- **ALERTS/METRICS:** 314(a) responses past 14 days (target zero); search-completeness checks per request (all five record domains covered); 314(b) certification lapse days (target zero); unverified-counterpart share attempts (target zero).

## BSA-12 — Record Retention {#bsa-12-record-retention}

- **WHY (Reg cite):** BSA records carry a 5-year baseline retention — [31 CFR § 1010.430](https://www.ecfr.gov/current/title-31/part-1010/section-1010.430); CIP records follow [31 CFR § 1020.220(a)(3)](https://www.ecfr.gov/current/title-31/part-1020/section-1020.220) (identity data 5 years after closure, verification records 5 years after made); OFAC records require 10 years effective March 12, 2025 — [31 CFR § 501.601](https://www.ecfr.gov/current/title-31/part-501/section-501.601).
- **SYSTEM BEHAVIOR:** A retention schedule keyed by record type sets timers automatically: CTRs, SARs and supporting documents, monetary instrument logs, Travel Rule records, 314(a) documentation, and training records at 5 years; CIP identity data at 5 years after account closure and verification records at 5 years after creation; OFAC screening, blocking, and rejection records at 10 years (blocked-property records for the blocked period plus 10 years after unblocking). Legal holds suspend purge timers until released by Counsel. Purges execute only after timer expiry and hold check, and every purge writes an audit log entry. Records remain examiner-retrievable throughout their retention period. Retention-schedule changes and legal-hold administration are restricted to Compliance and Counsel.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | BSA record created (`record.created`) | Record type (`retention.record_type`), trigger date (`retention.anchor_date`) | Retention timer set (`retention.timer_set`) | At record creation |
  | Legal hold placed or released (`legal.hold_placed` / `legal.hold_released`) | Hold scope (`legal.hold_scope`), matter reference (`legal.matter_id`) | Suspended or resumed purge timers (`retention.hold_applied`) | Same business day |
  | Retention timer expires (`retention.purge_due`) | Hold status (`legal.hold_scope` check), record inventory (`retention.purge_candidates[]`) | Purge execution + audit entry (`retention.purge_executed`) | Per schedule — 5y BSA baseline / 10y OFAC (enforced by `retention.timer`) |

- **ALERTS/METRICS:** Purges executed against held records (target zero — hard block); records past retention without purge or hold; examiner-retrieval test success rate; timer coverage (% of BSA records with an active retention timer — target 100%).

## BSA-13 — Escalation Pathway {#bsa-13-escalation-pathway}

- **WHY (Reg cite):** Effective internal controls under [12 CFR § 748.2(b)(1)](https://www.ecfr.gov/current/title-12/part-748/section-748.2) and [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/part-1020/section-1020.210) require that program breaches and emergent issues reach accountable officers promptly enough to permit timely reporting and remediation.
- **SYSTEM BEHAVIOR:** Any employee can raise a one-click breach or emergent-issue escalation that routes simultaneously to the BSA Officer and General Counsel. Escalations are acknowledged internally within 1 business day, and an action plan — including regulator notifications (NCUA, FinCEN, OFAC) where applicable — is produced within 5 business days. Escalations implicating cyber incidents hand off to the Information Security Policy's incident process; escalations implicating suspicious activity open a case under [BSA-06](#bsa-06-transaction-monitoring--case-management). Escalation records are access-restricted to the BSA Officer, General Counsel, and assigned responders.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Employee raises escalation (`escalation.created`) | Issue description (`escalation.description`), severity (`escalation.severity`), reporter (`escalation.reporter_id`) | Routed notification to BSA Officer + General Counsel (`escalation.routed`) | Immediate (system routing) |
  | Escalation routed (`escalation.routed`) | Assigned owner (`escalation.owner_id`) | Internal acknowledgment (`escalation.acknowledged`) | 1 business day (enforced by `escalation.ack_timer`) |
  | Acknowledgment issued (`escalation.acknowledged`) | Root-cause facts (`escalation.facts`), regulatory applicability assessment (`escalation.regulatory_assessment`) | Action plan incl. regulator notifications where applicable (`escalation.action_plan_published`) | 5 business days (enforced by `escalation.plan_timer`) |

- **ALERTS/METRICS:** Acknowledgments past 1 business day (target zero); action plans past 5 business days (target zero); escalation volume by category and severity; remediation-action closure rate.

## BSA-14 — Training {#bsa-14-training}

- **WHY (Reg cite):** Training for appropriate personnel is a required program pillar — [12 CFR § 748.2(b)(1)(iv)](https://www.ecfr.gov/current/title-12/part-748/section-748.2) and [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/part-1020/section-1020.210).
- **SYSTEM BEHAVIOR:** HR and Compliance assign role-based BSA/AML/OFAC curricula at hire (tellers, payments operations, lending, BSA Operations, vendor management, executives each receive tailored content). New hires complete training within 30 days of hire; all staff complete annual training by the policy anniversary. Board and committee training is tracked separately and delivered at least annually, covering regulatory requirements, consequences of noncompliance, and the credit union's risk profile. The BSA Officer attends at least one external training event annually. Completion records and materials are retained per [BSA-12](#bsa-12-record-retention). Curriculum assignments are write-restricted to Compliance and HR.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Employee hired or role changed (`training.assigned`) | Role mapping (`training.role_curriculum`), hire date (`training.hire_date`) | Curriculum assignment record (`training.assignment_created`) | At hire / role change; complete within 30 days (enforced by `training.new_hire_timer`) |
  | Annual cycle anchored to policy anniversary (`training.annual_due`) | Staff roster (`training.roster[]`), curriculum versions (`training.curriculum_version`) | Completion records for all staff (`training.completed`) | By policy anniversary (enforced by `training.annual_timer`) |
  | Board/committee session scheduled (`training.board_session_scheduled`) | Board curriculum (`training.board_curriculum`), attendance roster (`training.board_attendance[]`) | Board training completion record (`training.board_completed`) | At least annually |

- **ALERTS/METRICS:** New-hire completions past 30 days (target zero); annual completion rate by department (target 100% by anniversary); Board training currency; overdue-assignment aging report to managers.

## BSA-15 — Independent Testing {#bsa-15-independent-testing}

- **WHY (Reg cite):** Independent testing of the BSA program is a required pillar — [12 CFR § 748.2(b)(1)(ii)](https://www.ecfr.gov/current/title-12/part-748/section-748.2) and [31 CFR § 1020.210(b)(1)(ii)](https://www.ecfr.gov/current/title-31/part-1020/section-1020.210).
- **SYSTEM BEHAVIOR:** A qualified, independent party (Internal Audit or external auditor reporting to the Board or Supervisory Committee, not to the BSA Officer) tests the program every 12–18 months. Scope is mapped control-by-control to this policy ([BSA-01](#bsa-01-governance--delegation) through [BSA-20](#bsa-20-pep-screening--edd)), including transaction testing weighted to high-risk operations, monitoring-system effectiveness, SAR/CTR accuracy and timeliness, CIP/CDD adequacy, OFAC screening, third-party screening vendors per [BSA-19](#bsa-19-prepaid-access--third-parties), and training adequacy. Findings carry owners and due dates and are tracked to closure; results and remediation progress are reported to the Board. The findings register is write-restricted to Internal Audit; remediation updates come from control owners.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Testing cycle due (`audit.engagement_due`) | Control inventory (`audit.scope_map[]`), risk assessment (`risk.assessment_published` output), prior findings (`audit.prior_findings[]`) | Engagement plan + executed testing (`audit.engagement_completed`) | Every 12–18 months (enforced by `audit.cycle_timer`) |
  | Testing concludes (`audit.engagement_completed`) | Workpapers (`audit.workpapers[]`), exceptions (`audit.findings[]`) | Board-reported test report with findings register (`audit.report_issued`) | At engagement close; report to next Board meeting |
  | Finding remediation due (`audit.remediation_due`) | Finding owner (`audit.finding_owner`), corrective action (`audit.corrective_action`) | Closure evidence + validation (`audit.finding_closed`) | Per finding due date (enforced by `audit.remediation_timer`) |

- **ALERTS/METRICS:** Days since last completed test vs. 18-month ceiling; open findings past due date; repeat-finding count (target zero); % of controls covered by the most recent scope map (target 100%).

## BSA-16 — High-Risk Categories (MSB, Correspondent, Private Banking) {#bsa-16-high-risk-categories-msb-correspondent-private-banking}

- **WHY (Reg cite):** Risk-based EDD for higher-risk categories flows from [31 CFR § 1020.210(b)(5)](https://www.ecfr.gov/current/title-31/part-1020/section-1020.210); foreign correspondent and private banking accounts carry specific due diligence duties under [31 CFR § 1010.610](https://www.ecfr.gov/current/title-31/part-1010/section-1010.610) and [31 CFR § 1010.620](https://www.ecfr.gov/current/title-31/part-1010/section-1010.620); MSB registration verification references [31 CFR § 1022.380](https://www.ecfr.gov/current/title-31/part-1022/section-1022.380).
- **SYSTEM BEHAVIOR:** Category-specific checklists govern onboarding and maintenance of high-risk members: MSBs (verify FinCEN MSB registration and state licenses, capture agent status, document site visits), foreign correspondent accounts (§ 1010.610 due diligence before opening), and private banking accounts for non-U.S. persons (§ 1010.620, including source-of-wealth and PEP review via [BSA-20](#bsa-20-pep-screening--edd)). The credit union does not currently maintain foreign correspondent or private banking accounts; the checklists act as a gate that blocks such relationships unless this control's requirements are first operationalized. All category members receive elevated monitoring thresholds in [BSA-06](#bsa-06-transaction-monitoring--case-management) and EDD refresh at least annually. Category designations are write-restricted to BSA Operations with BSA Officer approval.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | High-risk category detected at onboarding or review (`risk.category_assigned`) | Category checklist (`edd.category_checklist`), FinCEN MSB registration (`edd.msb_registration_number`), state licenses (`edd.state_licenses[]`) | Completed category file with approval (`edd.category_approved`) | Before account activation |
  | Site visit conducted for MSB/cash-intensive member (`edd.site_visit_completed`) | Visit report (`edd.site_visit_report`), photographs/observations (`edd.site_visit_evidence[]`) | Site-visit record in EDD file (`edd.site_visit_logged`) | Per category playbook cadence |
  | Annual EDD refresh due (`edd.refresh_due`) | Current EDD file (`edd.file`), activity review (`bookkeeping_entry` stream), registration/license recheck (`edd.msb_registration_number`) | Refreshed EDD file + re-approval (`edd.refresh_completed`) | At least annually (enforced by `edd.refresh_timer`) |

- **ALERTS/METRICS:** High-risk members past EDD refresh (target zero); MSB members with lapsed FinCEN registration or state license (target zero, auto-checked); correspondent/private-banking gate violations (target zero); site-visit completion rate vs. playbook.

## BSA-17 — CMIR (Cross-Border Currency) {#bsa-17-cmir-cross-border-currency}

- **WHY (Reg cite):** Physical transportation, mailing, or shipping of currency or monetary instruments exceeding $10,000 into or out of the United States must be reported on FinCEN Form 105 — [31 CFR § 1010.340](https://www.ecfr.gov/current/title-31/part-1010/section-1010.340), with filing mechanics under [31 CFR § 1010.306](https://www.ecfr.gov/current/title-31/part-1010/section-1010.306).
- **SYSTEM BEHAVIOR:** Payments Operations and branch staff identify any credit-union shipment or receipt of currency or monetary instruments exceeding $10,000 that crosses the U.S. border. For receipts, Form 105 is filed within 15 days after receipt; for shipments not accompanying a person, the report is filed by the mailing or shipping date. Filing confirmations are stored with the underlying shipment record per [BSA-12](#bsa-12-record-retention). The credit union does not routinely transport cross-border currency; the identification step runs as a standing screen on vault and shipment operations so any first occurrence is caught. CMIR determinations are restricted to BSA Operations.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Reportable cross-border shipment/receipt identified (`cmir.reportable_identified`) | Shipment details (`cmir.shipment_manifest`), amount (`cmir.amount`), counterparty (`cmir.counterparty`), direction (`cmir.direction`) | Filed FinCEN Form 105 + stored confirmation (`cmir.filed`) | 15 days after receipt; by mailing/shipping date if unaccompanied (enforced by `cmir.filing_timer`) |

- **ALERTS/METRICS:** Late Form 105 filings (target zero); vault/shipment screen coverage (every cross-border movement evaluated); confirmation-on-file rate (target 100%).

## BSA-18 — FBAR {#bsa-18-fbar}

- **WHY (Reg cite):** A U.S. financial interest in, or signature authority over, foreign financial accounts exceeding $10,000 in aggregate must be reported annually on FinCEN Form 114 — [31 CFR § 1010.350](https://www.ecfr.gov/current/title-31/part-1010/section-1010.350).
- **SYSTEM BEHAVIOR:** Finance and Compliance maintain a standing inventory of any foreign financial accounts in which the credit union holds a financial interest or over which it has signature authority. The April 15 deadline (with automatic extension to October 15) is calendared; when the aggregate exceeds $10,000 at any point in the calendar year, Form 114 is e-filed through the BSA E-Filing System. The credit union currently holds no foreign financial accounts; the inventory check runs annually regardless so that a first foreign account cannot silently skip the obligation. Inventory maintenance is restricted to Finance with Compliance review.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Annual inventory and filing window opens (`fbar.filing_due`) | Foreign-account inventory (`fbar.account_inventory[]`), maximum balances (`fbar.max_balances[]`) | Filed FinCEN Form 114 or documented nil determination (`fbar.filed` / `fbar.nil_determined`) | April 15, auto-extension to October 15 (enforced by `fbar.filing_timer`) |
  | Foreign account opened or authority granted (`fbar.account_added`) | Account details (`fbar.account_record`), authority basis (`fbar.authority_type`) | Inventory entry (`fbar.inventory_updated`) | At account opening |

- **ALERTS/METRICS:** Filing or nil determination completed by deadline (target 100%); inventory entries added outside the annual check (signals process working); days-to-file after deadline (target zero late).

## BSA-19 — Prepaid Access & Third Parties {#bsa-19-prepaid-access--third-parties}

- **WHY (Reg cite):** Prepaid access programs carry AML obligations under [31 CFR § 1022.210](https://www.ecfr.gov/current/title-31/part-1022/section-1022.210); the credit union retains full responsibility for BSA functions performed by third parties under [12 CFR § 748.2](https://www.ecfr.gov/current/title-12/part-748/section-748.2) and the program rule at [31 CFR § 1020.210](https://www.ecfr.gov/current/title-31/part-1020/section-1020.210).
- **SYSTEM BEHAVIOR:** Any third party performing AML/CFT screening, KYC, prepaid program management, or monitoring functions (including `verification.provider` vendors and `partner_provided` attestation partners) requires a vendor due-diligence package before reliance, contract clauses guaranteeing data access, audit rights, and sanctions-compliance obligations, and system-enforced program limits (e.g., `card.spend_controls`, prepaid load/velocity limits). Partner-provided KYC is accepted only at the configured `trust_level`, and `verify_watchlist_only` partners always receive Cassandra-side OFAC screening per [BSA-05](#bsa-05-ofac-screening--holds). Critical vendor alerts (screening outage, model drift, list-update failure) feed in real time into the transaction-monitoring pipeline of [BSA-06](#bsa-06-transaction-monitoring--case-management). Each vendor undergoes an annual review covering performance, screening efficacy, and findings; general vendor lifecycle management is governed by the Third-Party Risk Policy, while this control owns the BSA-specific oversight layer. The vendor register is write-restricted to Vendor Management with Compliance approval.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | New screening/prepaid vendor proposed (`vendor.proposed`) | Due-diligence package (`vendor.dd_package`), contract clauses (`vendor.contract_terms`), trust configuration (`verification.trust_level`) | Approved vendor record + program limits configured (`vendor.approved`) | Before reliance on the vendor |
  | Critical vendor alert raised (`vendor.critical_alert`) | Alert payload (`vendor.alert_details`), affected scope (`vendor.impact_scope`) | Real-time feed into monitoring + escalation if warranted (`bsa_alert.created`, `escalation.created`) | Real time; triage per [BSA-06](#bsa-06-transaction-monitoring--case-management) SLA |
  | Annual vendor review due (`vendor.review_due`) | KPI history (`vendor.kpis[]`), screening-efficacy sample (`vendor.efficacy_results`), contract compliance check (`vendor.contract_terms`) | Annual review pack + corrective actions (`vendor.review_completed`) | Annually (enforced by `vendor.review_timer`) |

- **ALERTS/METRICS:** Vendors in production without an approved due-diligence package (target zero); critical-alert delivery latency into monitoring; annual reviews past due; partner attestation volume by `trust_level` with sampled re-verification results.

## BSA-20 — PEP Screening & EDD {#bsa-20-pep-screening--edd}

- **WHY (Reg cite):** There is no categorical prohibition on politically exposed persons; supervisory expectations under the FFIEC BSA/AML Examination Manual call for risk-based identification and enhanced due diligence, grounded in the ongoing-CDD requirement of [31 CFR § 1020.210(b)(5)](https://www.ecfr.gov/current/title-31/part-1020/section-1020.210); private banking for non-U.S. persons separately requires senior-foreign-political-figure scrutiny under [31 CFR § 1010.620](https://www.ecfr.gov/current/title-31/part-1010/section-1010.620).
- **SYSTEM BEHAVIOR:** Applicants, beneficial owners, and signers are screened against PEP datasets at onboarding (PEP lists are included in `ofac_result.matched_lists`) and at every CDD refresh. PEP hits route to EDD with elevated approval (senior Compliance sign-off), source-of-wealth and source-of-funds documentation, and adjusted monitoring thresholds in [BSA-06](#bsa-06-transaction-monitoring--case-management). For PEPs risk-rated high, EDD must be complete before account activation; lower-rated PEP relationships may activate with EDD completion tracked on a short timer. Family members and close associates identified in screening are treated under the same workflow. PEP designations and EDD approvals are restricted to senior Compliance staff.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Onboarding or refresh screen returns PEP hit (`pep.hit`, surfaced via `ofac_result.matched_lists` containing "PEP") | Match detail (`ofac_result.match_score`), subject identity (`entity.name`, `entity.date_of_birth`), role (`pep.subject_role` — applicant / BO / signer) | PEP designation + EDD routing (`pep.designated`, `risk.trigger_edd`) | Same business day as hit |
  | EDD for high-risk PEP opened (`edd.pep_opened`) | Source of wealth (`edd.source_of_wealth`), source of funds (`cdd.source_of_funds`), elevated approval (`edd.approver_id`) | Completed PEP EDD file with senior approval (`edd.pep_completed`) | Before account activation for high-risk PEPs (activation gate); 5 business days otherwise |
  | CDD refresh fires for PEP member (`cdd.refresh_due`) | Current PEP status (`pep.status`), updated screening (`ofac_result.matched_lists`), activity review (`bookkeeping_entry` stream) | Refreshed PEP designation + monitoring adjustment (`pep.refresh_completed`) | Per high-risk tier cadence — 12 months (enforced by `cdd.refresh_timer`) |

- **ALERTS/METRICS:** High-risk PEP accounts activated before EDD completion (target zero — hard gate); PEP hit adjudication aging; PEP population count and refresh currency; monitoring-threshold adjustment coverage for designated PEPs (target 100%).

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer (designated BSA Officer)
- **Approvers:** Patrick Wilson, Chief Compliance Officer; Board of Directors (annual program approval per [BSA-01](#bsa-01-governance--delegation))
- **Review cadence:** Annual Board approval; interim review within 30 days of any material change (regulatory, product, partner, or examination-driven).
- **Reporting:** Monthly Board BSA summaries per [BSA-01](#bsa-01-governance--delegation) and [BSA-08](#bsa-08-sar-filing--confidentiality); independent test results per [BSA-15](#bsa-15-independent-testing).
- **Cross-references:** Information Security Policy (cyber incident response); Third-Party Risk Policy (general vendor lifecycle); Privacy Policy (member data handling); Record Retention Policy (non-BSA schedules); Electronic Payment Systems Policy (rail-level suspicious-activity detection mechanics).

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** `vocabulary.json` (Cassandra Banking Core API v1.0.0) registers entities, fields, and endpoints but **zero events and zero timers**. Every `event.code` and timer reference in the EVENTS tables (e.g., `governance.policy_review_due`, `ctr.threshold_reached`, `sar.filing_timer`, `ofac.report_timer`, `escalation.ack_timer`, all `*.refresh_due`/`*_timer` codes) uses the target naming scheme and must be registered by engineering before the next review. Registered resources cited as-is include `entity`, `account`, `verification` (incl. `ofac_result.*`, `provider_result.*`), `ach_transfer`, `wire_transfer`, `book_transfer`, `card_authorization`, `bookkeeping_entry` (incl. `bookkeeping.locked_amount`), and `bsa_alert`.
- **CDD/CMIR/FBAR/CTR/SAR domain fields are unregistered.** Field codes prefixed `cdd.*`, `edd.*`, `ctr.*`, `sar.*`, `mi.*`, `cmir.*`, `fbar.*`, `fincen.*`, `pep.*`, `vendor.*`, `training.*`, `audit.*`, `escalation.*`, `retention.*`, `legal.*`, `risk.*`, and `governance.*` are target-scheme names; the banking-core vocabulary covers payments and entities only.
- **Refresh cadences assumed.** Risk-tier CDD refresh intervals (high 12 / moderate 24 / low 36 months) and the internal CTR SLA (10 days), 314(a) SLA (10 days), and OFAC adjudication SLA (1 business day) are management assumptions pending Patrick's confirmation; the regulatory deadlines themselves are fixed.
- **Single approver.** Patrick Wilson is the only named approver; NCUA examiners expect documented Board approval of the BSA program — the Board approval step in [BSA-01](#bsa-01-governance--delegation) assumes the Board ratifies this document, with minutes as evidence.
- **No foreign correspondent, private banking, or cross-border currency activity today.** BSA-16, BSA-17, and BSA-18 are written as standing gates/screens on currently inactive product lines, mirroring the reference policies; if Pynthia launches any of these, the corresponding control must be operationalized before launch per [BSA-02](#bsa-02-enterprise-bsaaml-risk-assessment).
- **PEP posture diverges from one reference source.** The 2014 reference policy prohibited PEP accounts outright; per AUTHORITY_HINTS and current FFIEC guidance, this policy instead applies risk-based EDD ([BSA-20](#bsa-20-pep-screening--edd)). Confirm the Board accepts PEP relationships under EDD rather than prohibition.
- **314(b) participation assumed active.** PATRICK_NOTES require maintaining 314(b) certification; this policy assumes Pynthia is (or will be) registered with FinCEN for 314(b) and renews annually.
- **DEP/Phase II eligibility procedures summarized.** Detailed Phase I/II eligibility criteria, ineligible-business lists, and revocation mechanics follow [31 CFR § 1020.315](https://www.ecfr.gov/current/title-31/part-1020/section-1020.315) and live in BSA Operations procedures rather than this policy.
- **OFAC 10-year retention date.** The 10-year OFAC recordkeeping requirement (extended from 5 years) is applied program-wide effective March 12, 2025 per the OFAC recordkeeping amendment to [31 CFR § 501.601](https://www.ecfr.gov/current/title-31/part-501/section-501.601); records created before that date follow the schedule in force at creation.
