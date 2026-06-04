---
title: Charitable Donation Accounts Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-04
next_review: 2027-06-04
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Charitable Donation Accounts, CDA, Incidental Powers, NCUA]
---

# Charitable Donation Accounts Policy

## General Policy Statement

Pynthia Credit Union may establish and fund Charitable Donation Accounts (CDAs) as an exercise of incidental powers under [12 CFR §721.3(b)(2)](https://www.ecfr.gov/current/title-12/part-721/section-721.3#p-721.3(b)(2)), and commits to satisfying every condition of that rule so that CDA investments remain exempt from the limits of [12 CFR Part 703](https://www.ecfr.gov/current/title-12/part-703). This policy governs all CDA structures, the trustees and managers that hold or manage CDA assets, and the staff and committees that fund, monitor, distribute from, account for, and terminate CDAs. The credit union caps aggregate CDA book value at no more than 5% of net worth, distributes at least 51% of Total Return to Qualified Charities no less frequently than every five years and again at termination, segregates CDA assets in properly labeled vehicles managed by qualified fiduciaries under written agreements containing the required clauses, and prohibits payment of any CDA fees or expenses to the credit union or its Affiliates. Loss of any §721.3(b)(2) condition forfeits the Part 703 safe harbor; the controls in this policy exist to keep every condition continuously satisfied and evidenced.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Annual Board re-adoption of this policy | Policy anniversary approaches (`cda.policy_review_due`) | Before policy expiration (annual) | Policy text, strategy/limits, structures, vendors | [CDA-01](#cda-01-governance-board-ownership) |
| Quarterly Board/ALCO CDA report | Calendar quarter closes (`cda.quarter_closed`) | 30 days after quarter-end | Cap utilization, performance, window coverage, exceptions | [CDA-09](#cda-09-accounting-reporting-records) |
| Trustee/manager registration lapse escalation | Lapse detected (`cda.vendor_registration_lapsed`) | 2 business days to Board | Lapse facts, exposure, remediation options | [CDA-04](#cda-04-trustee-manager-qualification) |
| Cap breach cure | Aggregate book value exceeds 5% of net worth (`cda.cap_breached`) | 30 calendar days | Cure plan and execution evidence | [CDA-06](#cda-06-funding-cap-monitoring-cure) |
| 51% Total Return distribution | Rolling five-year window approaches close (`cda.distribution_window_alert`) | At least every 5 years (internal: annual by Dec 31) | Distribution calculation, donee eligibility evidence | [CDA-08](#cda-08-charity-eligibility-giving-rules) |
| Closing distribution at termination | Termination approved (`cda.termination_approved`) | Before final asset transfer; report 30 days post-close | ≥51% closing distribution, asset-permissibility review | [CDA-12](#cda-12-termination) |
| Material vendor issue escalation | Material issue identified (`cda.vendor_issue_flagged`) | 2 business days | Issue summary, impact, action plan | [CDA-10](#cda-10-third-party-risk-management) |
| Conflict-of-interest escalation | Prohibited or suspect fee payee detected (`cda.fee_conflict_flagged`) | 5 business days | Payee details, fee amount, disposition | [CDA-13](#cda-13-conflicts-fees) |

## CDA-01 — Governance & Board Ownership  {#cda-01-governance-board-ownership}

- **WHY (Reg cite):** [12 CFR §721.3(b)(2)](https://www.ecfr.gov/current/title-12/part-721/section-721.3#p-721.3(b)(2)) conditions the CDA safe harbor on the credit union's documented satisfaction of every enumerated requirement; Board adoption and continuing oversight of this policy is how Pynthia evidences and maintains that satisfaction, consistent with the incidental-powers framework of [12 CFR Part 721](https://www.ecfr.gov/current/title-12/part-721).
- **SYSTEM BEHAVIOR:** The Board adopts this policy and re-adopts it annually, and approves every CDA structure, vendor, investment strategy and risk limits, and distribution plan before execution. The system tracks the policy's effective and expiration dates; if the policy lapses without re-adoption, all CDA actions (funding, trades, distributions, vendor onboarding) are blocked until the Board re-adopts. Quarterly reporting to the Board is produced under [CDA-09](#cda-09-accounting-reporting-records). Policy status and approval records are write-restricted to Compliance; Board approval entries are write-restricted to the Board Secretary.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Policy anniversary approaches (`cda.policy_review_due`) | Current policy text (`cda.policy_version`), strategy/limits (`cda.strategy_limits`), structure and vendor roster (`cda.vendor_roster[]`) | Board re-adoption resolution (`cda.policy_readopted`) | Before policy expiration (enforced by `cda.policy_expiry_at`) |
  | New CDA structure, vendor, strategy, or distribution proposed (`cda.board_approval_requested`) | Proposal packet (`cda.proposal_packet`), risk assessment (`cda.risk_assessment`) | Board approval or denial recorded (`cda.board_decision_recorded`) | Before the action executes (internal: next scheduled Board meeting) |
  | Policy expires without re-adoption (`cda.policy_expired`) | Policy expiry date (`cda.policy_expiry_at`) | Hard block on all CDA actions (`cda.actions_blocked`) | Immediate |

- **ALERTS/METRICS:** Alert Compliance 90/60/30 days before policy expiry; target zero days of policy lapse; count of CDA actions attempted while blocked (target zero).

## CDA-02 — Definitions & Glossary  {#cda-02-definitions-glossary}

- **WHY (Reg cite):** [12 CFR §721.3(b)(2)(vii)](https://www.ecfr.gov/current/title-12/part-721/section-721.3#p-721.3(b)(2)(vii)) supplies the controlling definitions (including Qualified Charity and Affiliate); donee eligibility additionally rests on [26 U.S.C. §501(c)(3)](https://www.law.cornell.edu/uscode/text/26/501) and §501(c)(19) (war veterans' organizations). Consistent definitions are the substrate for every validation and calculation in this policy.
- **SYSTEM BEHAVIOR:** Compliance maintains a central, versioned glossary of the controlling terms — CDA, Qualified Charity, Total Return, Distribution in Kind, Affiliate, Net Worth, and Book Value — aligned to the §721.3(b)(2)(vii) definitions. The glossary powers automated validations (charity eligibility, payee blocklist), calculations (cap test, Total Return, distribution minimum), and reporting labels, so a definition change propagates to every dependent control. The glossary is write-restricted to Compliance, with changes requiring CCO approval.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | A controlling definition is added or amended (`cda.glossary_change_proposed`) | Proposed text (`cda.glossary_term`), regulatory basis (`cda.glossary_citation`), downstream-impact list (`cda.glossary_dependencies[]`) | Versioned glossary update with CCO approval (`cda.glossary_updated`) | Before any dependent validation uses the new definition (internal: 5 BD) |
  | Annual policy review occurs (`cda.policy_review_due`) | Current glossary version (`cda.glossary_version`), current §721.3(b)(2)(vii) text | Glossary attestation that definitions match the rule (`cda.glossary_attested`) | With annual re-adoption (enforced by `cda.policy_expiry_at`) |

- **ALERTS/METRICS:** Alert on any dependent validation referencing a stale glossary version; target zero calculations executed against superseded definitions.

## CDA-03 — Structure & Segregation  {#cda-03-structure-segregation}

- **WHY (Reg cite):** [12 CFR §721.3(b)(2)(i)](https://www.ecfr.gov/current/title-12/part-721/section-721.3#p-721.3(b)(2)(i)) requires CDA assets to be held in a segregated custodial account or special purpose entity specifically identified as a Charitable Donation Account.
- **SYSTEM BEHAVIOR:** Before first funding, the credit union selects the CDA structure (segregated custodial account, or SPE/trust), labels it "Charitable Donation Account" in the account title and governing documents, and assembles an evidence packet (structure selection memo, executed agreements, labeling proof). The system blocks the first funding transfer until the evidence packet is complete and Board approval under [CDA-01](#cda-01-governance-board-ownership) is recorded. CDA assets are never commingled with general credit union investments; any deposit-side CDA cash account carries a distinct bookkeeping classification. Structure records and the evidence packet are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | CDA structure selected (`cda.structure_selected`) | Structure type (`cda.structure_type`), governing documents (`cda.governing_docs[]`), account labeling proof (`cda.account_label`) | Evidence packet assembled and filed (`cda.evidence_packet_filed`) | Before first funding (internal: complete at structure approval) |
  | First funding requested (`cda.funding_requested`) | Evidence packet status (`cda.evidence_packet_filed`), Board approval record (`cda.board_decision_recorded`), executed agreement check (`cda.agreement_validated`) | Funding released or blocked (`cda.funding_gate_evaluated`) | Before transfer executes (real-time gate) |

- **ALERTS/METRICS:** Target zero funding transfers released without a complete evidence packet; alert Compliance on any CDA-tagged account whose title omits the "Charitable Donation Account" label.

## CDA-04 — Trustee & Manager Qualification  {#cda-04-trustee-manager-qualification}

- **WHY (Reg cite):** [12 CFR §721.3(b)(2)(ii)–(iii)](https://www.ecfr.gov/current/title-12/part-721/section-721.3#p-721.3(b)(2)(ii)) requires that a CDA trustee be regulated and that any person other than the credit union with authority to make investment decisions be either an SEC-registered investment adviser or regulated by the OCC.
- **SYSTEM BEHAVIOR:** Only regulated trustees may hold CDA assets, and any non-credit-union discretionary manager must be validated as an SEC-registered investment adviser (via IARD/Form ADV) or OCC-regulated before onboarding. The system records the qualification basis, re-validates registration status annually, and continuously monitors for lapses; a detected lapse triggers Board escalation within 2 business days and suspends new asset placements with that vendor pending Board direction. Vendor qualification records are write-restricted to TPRM and Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Trustee or manager proposed for onboarding (`cda.vendor_onboarding_started`) | Regulator identity (`cda.vendor_regulator`), SEC/IARD or OCC registration evidence (`cda.vendor_registration_evidence`), due-diligence file (`cda.vendor_dd_file`) | Qualification determination recorded (`cda.vendor_qualified`) | Before agreement execution (internal: complete within onboarding) |
  | Annual vendor review cycle opens (`cda.vendor_review_due`) | Current registration status (`cda.vendor_registration_status`), prior review file (`cda.vendor_dd_file`) | Annual re-validation recorded (`cda.vendor_revalidated`) | Annually (enforced by `cda.vendor_review_due_at`) |
  | Registration lapse detected (`cda.vendor_registration_lapsed`) | Lapse details (`cda.vendor_registration_status`), assets under management (`cda.vendor_aum`) | Board escalation memo (`cda.board_escalation_issued`) | 2 business days |

- **ALERTS/METRICS:** Alert on any vendor registration status older than 12 months without re-validation; target zero days a lapsed vendor holds discretionary authority without Board notification.

## CDA-05 — Written Agreement Required Clauses  {#cda-05-written-agreement-required-clauses}

- **WHY (Reg cite):** [12 CFR §721.3(b)(2)(iv)](https://www.ecfr.gov/current/title-12/part-721/section-721.3#p-721.3(b)(2)(iv)) requires a written agreement that (A) names the Qualified Charities to benefit, (B) documents the investment strategy and risk tolerance, (C) requires GAAP-compliant accounting, and (D) sets the distribution frequency consistent with [§721.3(b)(2)(v)](https://www.ecfr.gov/current/title-12/part-721/section-721.3#p-721.3(b)(2)(v)).
- **SYSTEM BEHAVIOR:** A clause checklist validates every CDA agreement against required clauses (A)–(D) before the agreement is marked executable; funding to a CDA is blocked unless its agreement has passed the four-clause validation. Any amendment to an executed agreement requires Board re-approval under [CDA-01](#cda-01-governance-board-ownership) before it takes effect. The clause checklist and validation results are write-restricted to Legal and Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Draft CDA agreement submitted for validation (`cda.agreement_submitted`) | Named Qualified Charities (`cda.agreement_charities[]`), strategy/risk clause (`cda.agreement_strategy_clause`), GAAP clause (`cda.agreement_gaap_clause`), distribution-frequency clause (`cda.agreement_distribution_clause`) | Four-clause validation result (`cda.agreement_validated`) | Before execution (internal: 5 BD from submission) |
  | Funding requested against a CDA (`cda.funding_requested`) | Agreement validation status (`cda.agreement_validated`) | Funding released or blocked (`cda.funding_gate_evaluated`) | Before transfer executes (real-time gate) |
  | Agreement amendment proposed (`cda.agreement_amendment_proposed`) | Redline (`cda.agreement_redline`), clause re-validation (`cda.agreement_validated`) | Board re-approval recorded (`cda.board_decision_recorded`) | Before amendment effective (internal: next Board meeting) |

- **ALERTS/METRICS:** Target zero funded CDAs lacking a validated agreement; alert Legal on any amendment effective without a recorded Board re-approval.

## CDA-06 — Funding Cap Monitoring & Cure  {#cda-06-funding-cap-monitoring-cure}

- **WHY (Reg cite):** [12 CFR §721.3(b)(2)(vi)](https://www.ecfr.gov/current/title-12/part-721/section-721.3#p-721.3(b)(2)(vi)) limits the book value of all CDA investments, in the aggregate, to 5% of the credit union's net worth, measured at the time of investment and continuously thereafter, with breaches cured within 30 days.
- **SYSTEM BEHAVIOR:** The system computes aggregate CDA book value against current net worth (per the [CDA-02](#cda-02-definitions-glossary) glossary definitions) monthly and at each quarter-end, and re-computes on every proposed funding. Proposed funding that would push aggregate book value above the Board-approved internal buffer (default 4% of net worth) requires CFO and CCO approval; funding that projects a breach of the 5% regulatory cap is blocked outright. A detected breach (e.g., from net-worth decline) opens a cure case that must restore compliance within 30 calendar days. Cap parameters (buffer, cap) are write-restricted to Compliance with Board-approved values only.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Funding proposed (`cda.funding_requested`) | Proposed amount (`cda.funding_amount`), aggregate CDA book value (`cda.aggregate_book_value`), current net worth (`cda.net_worth`) | Pre-funding cap test result; block on projected breach (`cda.cap_test_completed`) | Before transfer executes (real-time gate) |
  | Monthly cap test runs (`cda.cap_test_scheduled`) | Aggregate book value (`cda.aggregate_book_value`), net worth (`cda.net_worth`), buffer threshold (`cda.cap_buffer_pct`) | Monthly cap test record (`cda.cap_test_completed`) | Monthly (internal: by 10th calendar day; enforced by `cda.cap_test_due_at`) |
  | Quarter-end cap test runs (`cda.quarter_closed`) | Quarter-end book values (`cda.aggregate_book_value`), quarter-end net worth (`cda.net_worth`) | Quarter-end cap certification for the Board packet (`cda.cap_certified`) | With quarterly reporting — 30 days after quarter-end |
  | Cap breach detected (`cda.cap_breached`) | Breach amount (`cda.cap_excess_amount`), cure options (`cda.cure_plan`) | Cure executed and compliance restored (`cda.cap_breach_cured`) | 30 calendar days (enforced by `cda.cap_cure_due_at`) |

- **ALERTS/METRICS:** Alert CFO/CCO at 80% and 95% of the internal buffer; daily aging alert on any open cure case; target zero breaches uncured at day 30.

## CDA-07 — Investment Strategy & Risk Limits  {#cda-07-investment-strategy-risk-limits}

- **WHY (Reg cite):** When every condition of [12 CFR §721.3(b)(2)](https://www.ecfr.gov/current/title-12/part-721/section-721.3#p-721.3(b)(2)) is satisfied, CDA investments are exempt from [12 CFR Part 703](https://www.ecfr.gov/current/title-12/part-703); the documented strategy and risk-tolerance requirement of [§721.3(b)(2)(iv)(B)](https://www.ecfr.gov/current/title-12/part-721/section-721.3#p-721.3(b)(2)(iv)) obligates the credit union to substitute its own prudent limits.
- **SYSTEM BEHAVIOR:** The Board approves a prudent-investor overlay for each CDA — single-issuer concentration, sector concentration, liquidity floor, volatility band, and maximum drawdown limits — even though Part 703 limits do not apply. Pre-trade checks evaluate proposed trades against the overlay and block violations; monthly post-trade compliance checks catch drift caused by market movement, with documented exceptions and rebalancing plans. Overlay parameters are write-restricted to Compliance with Board-approved values only.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Trade proposed in a CDA portfolio (`cda.trade_proposed`) | Trade details (`cda.trade_details`), current portfolio composition (`cda.portfolio_composition`), overlay limits (`cda.overlay_limits`) | Pre-trade check pass/block (`cda.pretrade_check_completed`) | Before execution (real-time gate) |
  | Monthly post-trade check runs (`cda.posttrade_check_scheduled`) | Month-end portfolio composition (`cda.portfolio_composition`), overlay limits (`cda.overlay_limits`) | Post-trade compliance report; exceptions with rebalancing plan (`cda.posttrade_check_completed`) | Monthly (internal: by 10th calendar day; enforced by `cda.posttrade_due_at`) |
  | Overlay limit change proposed (`cda.overlay_change_proposed`) | Proposed limits (`cda.overlay_limits`), risk rationale (`cda.risk_assessment`) | Board approval recorded (`cda.board_decision_recorded`) | Before new limits apply (internal: next Board meeting) |

- **ALERTS/METRICS:** Alert on any pre-trade block override; track count and aging of open post-trade exceptions (target: all cleared within one rebalancing cycle); monthly drawdown and volatility versus band.

## CDA-08 — Charity Eligibility & Giving Rules  {#cda-08-charity-eligibility-giving-rules}

- **WHY (Reg cite):** [12 CFR §721.3(b)(2)(v)](https://www.ecfr.gov/current/title-12/part-721/section-721.3#p-721.3(b)(2)(v)) requires distribution of at least 51% of the CDA's Total Return to one or more Qualified Charities no less frequently than every five years and upon termination; Qualified Charity status rests on [26 U.S.C. §501(c)(3)](https://www.law.cornell.edu/uscode/text/26/501) (and §501(c)(19) for war veterans' organizations) per the definitions in [§721.3(b)(2)(vii)](https://www.ecfr.gov/current/title-12/part-721/section-721.3#p-721.3(b)(2)(vii)).
- **SYSTEM BEHAVIOR:** Before any distribution, the system validates the donee's EIN and current IRS §501(c)(3)/(c)(19) determination (via the IRS Tax Exempt Organization Search) and confirms the donee is named in the CDA agreement per [CDA-05](#cda-05-written-agreement-required-clauses). A rolling five-year window tracker computes cumulative Total Return (per the [CDA-02](#cda-02-definitions-glossary) definition) and cumulative qualified distributions, ensuring at least 51% of Total Return is distributed before any window closes; the internal default cadence is an annual distribution by December 31, which keeps every window covered with margin. Distributions to unverified or unnamed donees are blocked. Donee eligibility records are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Distribution proposed (`cda.distribution_proposed`) | Donee EIN (`cda.donee_ein`), IRS status evidence (`cda.donee_irs_status`), agreement-named-charity check (`cda.agreement_charities[]`), amount (`cda.distribution_amount`) | Eligibility validation pass/block (`cda.donee_validated`) | Before disbursement (real-time gate) |
  | Annual distribution cycle opens (`cda.distribution_cycle_opened`) | Cumulative Total Return (`cda.total_return_cumulative`), cumulative distributions (`cda.distributions_cumulative`), window position (`cda.window_coverage_pct`) | Annual distribution executed (`cda.distribution_executed`) | By December 31 (internal cadence; enforced by `cda.distribution_due_at`) |
  | Five-year window approaches close undercovered (`cda.distribution_window_alert`) | Window coverage (`cda.window_coverage_pct`), shortfall amount (`cda.distribution_shortfall`) | Mandatory catch-up distribution (`cda.distribution_executed`) | Before window close — at least every 5 years (enforced by `cda.window_close_at`) |

- **ALERTS/METRICS:** Window-coverage dashboard with alerts at 12 and 6 months before any window closes below 51% coverage; target zero windows closing undercovered; count of blocked distributions to ineligible donees.

## CDA-09 — Accounting, Reporting & Records  {#cda-09-accounting-reporting-records}

- **WHY (Reg cite):** [12 CFR §721.3(b)(2)(iv)(C)](https://www.ecfr.gov/current/title-12/part-721/section-721.3#p-721.3(b)(2)(iv)) requires that CDA assets be accounted for in accordance with generally accepted accounting principles; accurate NCUA Call Report presentation (Account 789H) evidences continuing compliance with the §721.3(b)(2) conditions.
- **SYSTEM BEHAVIOR:** The Controller records all CDA activity under GAAP, with the CDA carried at the valuation basis its structure requires; monthly reconciliations tie trustee/custodian statements to the general ledger, and the Call Report mapping to Account 789H is maintained and verified each cycle. The quarterly Board/ALCO packet — cap utilization, investment performance, distribution-window coverage, and exceptions — is issued within 30 days of quarter-end and satisfies the reporting requirement in [CDA-01](#cda-01-governance-board-ownership). CDA general-ledger mappings are write-restricted to the Controller; the Board packet is write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Month closes (`cda.month_closed`) | Trustee/custodian statements (`cda.custodian_statement`), general-ledger balances (`cda.gl_balances`) | Monthly reconciliation with discrepancies resolved (`cda.reconciliation_completed`) | Monthly (internal: 10 BD after month-end; enforced by `cda.reconciliation_due_at`) |
  | Call Report cycle opens (`cda.call_report_cycle_opened`) | CDA book values (`cda.aggregate_book_value`), 789H mapping (`cda.account_789h_mapping`) | Verified 789H entries in the Call Report (`cda.call_report_mapped`) | Per NCUA Call Report deadline for the quarter |
  | Quarter closes (`cda.quarter_closed`) | Cap certification (`cda.cap_certified`), performance data (`cda.portfolio_performance`), window coverage (`cda.window_coverage_pct`), exception log (`cda.exception_log[]`) | Quarterly Board/ALCO packet issued (`cda.board_packet_issued`) | 30 days after quarter-end (enforced by `cda.board_packet_due_at`) |

- **ALERTS/METRICS:** Aging alert on unresolved reconciliation discrepancies older than 10 business days; target 100% on-time Board packets; target zero Call Report cycles with unverified 789H mapping.

## CDA-10 — Third-Party Risk Management  {#cda-10-third-party-risk-management}

- **WHY (Reg cite):** The trustee/manager qualification conditions of [12 CFR §721.3(b)(2)(ii)–(iii)](https://www.ecfr.gov/current/title-12/part-721/section-721.3#p-721.3(b)(2)(ii)) make vendor fitness a continuing safe-harbor condition, requiring life-cycle diligence beyond the point-in-time registration check in [CDA-04](#cda-04-trustee-manager-qualification).
- **SYSTEM BEHAVIOR:** TPRM runs life-cycle due diligence on every CDA trustee and manager — regulatory status, financial condition, SOC/ISO attestations, BCP/DR capability, and fee/conflict disclosures — at onboarding and annually thereafter. CDA vendor contracts must include a termination-for-convenience right exercisable on no more than 90 days' notice and defined asset-transfer steps. Material issues (financial deterioration, control failures, regulatory actions) are escalated to the CCO and Board within 2 business days. CDA-specific diligence supplements, and does not replace, the enterprise Third-Party Risk Policy. Vendor risk files are write-restricted to TPRM.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Vendor onboarding opens (`cda.vendor_onboarding_started`) | Regulatory status (`cda.vendor_registration_status`), financials (`cda.vendor_financials`), SOC/ISO reports (`cda.vendor_soc_iso`), BCP/DR evidence (`cda.vendor_bcp_dr`), fee/conflict disclosures (`cda.vendor_fee_disclosures`) | Completed diligence file and risk rating (`cda.vendor_dd_completed`) | Before agreement execution (internal: within onboarding) |
  | Annual review cycle opens (`cda.vendor_review_due`) | Refreshed diligence inputs (`cda.vendor_dd_file`) | Annual review record with updated rating (`cda.vendor_review_completed`) | Annually (enforced by `cda.vendor_review_due_at`) |
  | Contract drafted or renewed (`cda.vendor_contract_drafted`) | 90-day termination clause check (`cda.contract_termination_clause`), asset-transfer steps (`cda.contract_transfer_steps`) | Contract clause validation (`cda.vendor_contract_validated`) | Before execution (internal: with Legal review) |
  | Material issue identified (`cda.vendor_issue_flagged`) | Issue facts (`cda.vendor_issue_details`), exposure (`cda.vendor_aum`) | Escalation to CCO and Board (`cda.board_escalation_issued`) | 2 business days |

- **ALERTS/METRICS:** Alert on annual reviews more than 30 days overdue; target zero active CDA vendors without a validated 90-day termination clause; escalation latency distribution (target: 100% within 2 BD).

## CDA-11 — Internal Controls & Testing  {#cda-11-internal-controls-testing}

- **WHY (Reg cite):** Continuous, evidenced satisfaction of every [12 CFR §721.3(b)(2)](https://www.ecfr.gov/current/title-12/part-721/section-721.3#p-721.3(b)(2)) condition is what preserves the [Part 703](https://www.ecfr.gov/current/title-12/part-703) exemption; independent testing and operational controls are how the credit union proves the conditions held throughout the period.
- **SYSTEM BEHAVIOR:** Distributions at or above $5,000 require dual approval (preparer plus an independent approver). Segregation of duties separates trade initiation, distribution approval, reconciliation, and reporting roles. The cap checks of [CDA-06](#cda-06-funding-cap-monitoring-cure) run automatically without manual intervention. Valuations are reviewed quarterly against custodian and independent pricing sources. Internal Audit tests the CDA program annually against this policy, and findings carry tracked remediation with owners and due dates. Approval-rule parameters (including the $5,000 dual-approval threshold) are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Distribution ≥ $5,000 submitted (`cda.distribution_proposed`) | Distribution details (`cda.distribution_amount`), preparer identity (`cda.preparer_id`), independent approver identity (`cda.approver_id`) | Dual-approval record (`cda.dual_approval_recorded`) | Before disbursement (real-time gate) |
  | Quarter closes (`cda.quarter_closed`) | Custodian valuations (`cda.custodian_statement`), independent pricing (`cda.independent_pricing`) | Quarterly valuation review (`cda.valuation_review_completed`) | With quarterly reporting — 30 days after quarter-end |
  | Annual audit cycle opens (`cda.audit_cycle_opened`) | Policy text (`cda.policy_version`), control evidence (`cda.exception_log[]`, `cda.cap_test_completed`, `cda.reconciliation_completed`) | Internal Audit report with findings (`cda.audit_report_issued`) | Annually (enforced by `cda.audit_due_at`) |
  | Audit finding logged (`cda.audit_finding_logged`) | Finding details (`cda.audit_finding`), owner (`cda.remediation_owner`), due date (`cda.remediation_due_at`) | Remediation closure evidence (`cda.remediation_closed`) | By assigned due date (enforced by `cda.remediation_due_at`) |

- **ALERTS/METRICS:** Target zero distributions ≥ $5,000 disbursed with a single approver; aging alerts on remediation items past due; annual audit completion on schedule (target 100%).

## CDA-12 — Termination  {#cda-12-termination}

- **WHY (Reg cite):** [12 CFR §721.3(b)(2)(v)](https://www.ecfr.gov/current/title-12/part-721/section-721.3#p-721.3(b)(2)(v)) requires the ≥51%-of-Total-Return distribution upon termination of the CDA, and the liquidation provisions of [§721.3(b)(2)](https://www.ecfr.gov/current/title-12/part-721/section-721.3#p-721.3(b)(2)) permit the credit union to receive remaining assets in cash, or in kind only if those assets are otherwise permissible credit union investments.
- **SYSTEM BEHAVIOR:** On Board-approved termination, the system computes lifetime Total Return and verifies the cumulative ≥51% qualified-distribution requirement is satisfied, executing a closing distribution for any shortfall before assets transfer back. Remaining assets return to the credit union in cash; any proposed distribution in kind is screened against [Part 703](https://www.ecfr.gov/current/title-12/part-703) permissibility and blocked if the asset would be impermissible for the credit union to hold directly. A termination report goes to the Board within 30 days of close. Termination case records are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Termination approved by Board (`cda.termination_approved`) | Lifetime Total Return (`cda.total_return_cumulative`), distributions to date (`cda.distributions_cumulative`), shortfall calc (`cda.distribution_shortfall`) | Closing distribution executed (`cda.closing_distribution_executed`) | Before final asset transfer |
  | In-kind asset transfer proposed (`cda.inkind_transfer_proposed`) | Asset details (`cda.asset_details`), Part 703 permissibility determination (`cda.permissibility_determination`) | Transfer approved or blocked (`cda.inkind_transfer_evaluated`) | Before transfer executes (real-time gate) |
  | CDA closed (`cda.account_closed`) | Final accounting (`cda.final_accounting`), distribution evidence (`cda.closing_distribution_executed`) | Termination report to Board (`cda.termination_report_issued`) | 30 days post-close (enforced by `cda.termination_report_due_at`) |

- **ALERTS/METRICS:** Target zero terminations closed with the 51% requirement unsatisfied; target zero impermissible in-kind transfers; termination-report on-time rate (target 100%).

## CDA-13 — Conflicts & Fees  {#cda-13-conflicts-fees}

- **WHY (Reg cite):** The Total Return and Affiliate definitions in [12 CFR §721.3(b)(2)(vii)](https://www.ecfr.gov/current/title-12/part-721/section-721.3#p-721.3(b)(2)(vii)) are undermined if the credit union or its Affiliates extract fees from the CDA; prohibiting such payments preserves the integrity of the §721.3(b)(2)(v) distribution calculation and the charitable purpose underlying the [Part 721](https://www.ecfr.gov/current/title-12/part-721) incidental power.
- **SYSTEM BEHAVIOR:** A payee blocklist containing the credit union and all Affiliates (per the [CDA-02](#cda-02-definitions-glossary) glossary) screens every CDA fee and expense payment in real time and blocks matches. Compliance reviews all CDA fee activity quarterly to catch indirect or relabeled affiliate payments, and any identified conflict of interest is escalated to the CCO within 5 business days. The blocklist is write-restricted to Compliance and refreshed whenever the Affiliate roster changes.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | CDA fee or expense payment proposed (`cda.fee_payment_proposed`) | Payee identity (`cda.fee_payee`), affiliate blocklist (`cda.affiliate_blocklist[]`), fee amount (`cda.fee_amount`) | Payment released or blocked (`cda.fee_screen_completed`) | Before disbursement (real-time gate) |
  | Quarter closes (`cda.quarter_closed`) | Quarterly fee ledger (`cda.fee_ledger[]`), vendor fee disclosures (`cda.vendor_fee_disclosures`) | Quarterly fee review report (`cda.fee_review_completed`) | With quarterly reporting — 30 days after quarter-end |
  | Conflict identified (`cda.fee_conflict_flagged`) | Conflict facts (`cda.conflict_details`), payment history (`cda.fee_ledger[]`) | Escalation and disposition record (`cda.conflict_escalated`) | 5 business days (enforced by `cda.conflict_escalation_due_at`) |

- **ALERTS/METRICS:** Target zero fee payments to the credit union or Affiliates; alert Compliance immediately on any blocklist match; quarterly fee-review completion rate (target 100%).

## CDA-14 — Communications & Accessibility  {#cda-14-communications-accessibility}

- **WHY (Reg cite):** [28 CFR Part 36](https://www.ecfr.gov/current/title-28/part-36) (ADA Title III) requires that the credit union's public communications, including CDA-related web pages and announcements, be accessible to individuals with disabilities.
- **SYSTEM BEHAVIOR:** Every CDA-related web page, press release, and public announcement passes a pre-publication ADA/WCAG checklist (alt text, contrast, keyboard navigation, screen-reader compatibility for web; accessible formats for documents), with sign-off from both Marketing and Compliance before publication. Checklist results and the published artifacts are archived for examination. Publication approval records are write-restricted to Marketing and Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | CDA communication drafted for publication (`cda.communication_drafted`) | Draft content (`cda.communication_draft`), ADA/WCAG checklist (`cda.wcag_checklist`) | Completed checklist with Marketing and Compliance approvals (`cda.communication_approved`) | Before publication (internal: 5 BD review window) |
  | Communication published (`cda.communication_published`) | Approved artifact (`cda.communication_approved`) | Archived publication artifact (`cda.communication_archived`) | At publication (internal: same day) |

- **ALERTS/METRICS:** Target zero CDA communications published without dual approval; count of post-publication accessibility complaints (target zero, each triaged within 5 BD).

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for policy content, control operation, and regulatory alignment.
- **Approvers:** Patrick Wilson, Chief Compliance Officer. The Board of Directors adopts this policy and re-adopts it annually per [CDA-01](#cda-01-governance-board-ownership).
- **Required participants:** CFO/Controller (accounting, cap inputs, 789H mapping), ALCO (performance and risk review), TPRM (vendor diligence), Legal (agreements and clauses), and the Board (adoption, approvals, escalations).
- **Review cadence:** Annual review and Board re-adoption, or sooner upon amendment of 12 CFR §721.3, a change in CDA structure or vendors, or a material audit finding.
- **Cross-references:** Investment Policy (Part 703 context for the general portfolio); Third-Party Risk Policy (enterprise vendor management); Capitalization Policy and Record Retention Policy (enterprise financial reporting and records beyond the 789H CDA mapping); Compliance Policy and E-Commerce Policy (website accessibility standards generally).

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** The parsed engineering spec (`vocabulary.json`, Cassandra Banking Core API v1.0.0) is banking-core only and registers no events; none of the `cda.*` event, field, or timer codes referenced in the EVENTS tables of this document are yet registered. All codes used here follow the target naming scheme and will be confirmed and registered by engineering before the next review.
- **CDA assets are assumed to sit largely outside the banking core.** Trustee/custodian-held investments, valuations, and trade data will likely arrive via custodian feeds or manual entry rather than existing `account`/`transfer` entities; the integration path (including whether a CDA cash account is modeled as a core `account` with a distinct bookkeeping classification) needs engineering confirmation.
- **Internal buffer default of 4% of net worth** for the funding cap, the $5,000 dual-approval distribution threshold, the annual distribution cadence by December 31, and the 80%/95% buffer alert thresholds are policy defaults inferred from Patrick's notes; the Board should confirm or adjust them at adoption.
- **Net worth and book value measurement points** (e.g., most recent Call Report net worth versus month-end internal figures) for the cap test are assumed to follow the glossary definitions maintained under CDA-02; the precise measurement source and frequency need CFO confirmation.
- **IRS verification method** for Qualified Charity status is assumed to be the IRS Tax Exempt Organization Search (Publication 78 data) plus EIN match; whether a third-party charity-vetting service is also used needs confirmation.
- **Affiliate roster scope** for the payee blocklist (CUSOs, subsidiaries, and any other entities within the §721.3(b)(2)(vii) Affiliate definition) is assumed to be maintained by Compliance; the authoritative source of the roster needs confirmation.
- **Quarterly valuation review pricing sources** are assumed to be custodian statements plus one independent pricing source; the designated independent source needs Controller confirmation.
- **Call Report Account 789H** is used per Patrick's notes as the CDA reporting line; the mapping should be re-verified against the current NCUA 5300 instructions each cycle in case the form changes.
