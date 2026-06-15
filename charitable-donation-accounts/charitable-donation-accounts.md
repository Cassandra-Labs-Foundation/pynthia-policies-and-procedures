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

## General Policy Statement

Pynthia Credit Union maintains Charitable Donation Accounts (CDAs) under the FCU incidental-powers rule at [12 CFR §721.3(b)(2)](https://www.ecfr.gov/current/title-12/part-721/section-721.3). The credit union's posture is to preserve the regulatory safe harbor at all times: every CDA structure, agreement, vendor, distribution, and accounting entry is engineered so that all conditions of §721.3(b)(2) are met continuously. The program caps aggregate CDA book value at no more than 5% of net worth, distributes at least 51% of Total Return to Qualified Charities at least every five years and again at termination, prohibits CDA fees to the credit union or its affiliates, and applies prudent Board-approved investment overlays even though Part 703 limits do not apply while the safe harbor holds. If any §721.3(b)(2) condition fails, Part 703 relief is lost; this policy therefore treats each condition as a hard gate, blocks CDA actions when the policy is expired, and escalates breaches on defined clocks.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Quarterly Board/ALCO CDA reporting | Quarter closes (`cda.quarter_closed`) | 30 days after quarter-end | Cap utilization, performance, window coverage, exceptions | [CDA-01](#cda-01-governance-board-oversight) |
| Funding cap breach cure | Aggregate book value exceeds 5% of net worth (`cda.cap_breached`) | 30 calendar days | Cure plan and execution to restore ≤5% | [CDA-06](#cda-06-funding-cap-monitoring-cure) |
| Trustee/manager registration lapse | Registration lapse detected (`cda.vendor_issue_flagged`) | 2 business days to Board | Escalation memo | [CDA-04](#cda-04-trustee-manager-qualification) |
| Vendor material issue escalation | Material TPRM issue identified (`cda.vendor_issue_flagged`) | 2 business days | Escalation packet | [CDA-10](#cda-10-third-party-risk-management) |
| Required distribution cadence | Distribution cycle opens (`cda.distribution_cycle_opened`) | ≥51% of Total Return at least every 5 years; default annual by Dec 31 | Distribution to Qualified Charities | [CDA-08](#cda-08-charity-eligibility-giving-rules) |
| Termination closing distribution & report | Termination approved (`cda.termination_approved`) | Closing distribution at termination; report within 30 days post-close | Final accounting + ≥51% closing distribution | [CDA-12](#cda-12-termination) |
| Conflict / affiliate-fee escalation | Fee conflict flagged (`cda.fee_conflict_flagged`) | 5 business days | Conflict escalation memo | [CDA-13](#cda-13-conflicts-fees) |

## CDA-01 — Governance & Board Oversight  {#cda-01-governance-board-oversight}

- **WHY (Reg cite):** The CDA is permitted only as an exercise of incidental powers under [12 CFR §721.3(b)(2)](https://www.ecfr.gov/current/title-12/part-721/section-721.3); the Board owns the activity and must approve structures, vendors, strategy, and distributions and re-affirm the governing policy so the safe-harbor conditions remain met.
- **SYSTEM BEHAVIOR:** The Board adopts and annually re-adopts this policy; the system tracks the policy effective date and an expiry timer, and when the policy lapses it sets a hard block so funding, trades, and distributions cannot proceed. The Board approves CDA structures, vendors, strategy/limits, and distributions, recording each decision. A quarterly Board/ALCO packet (cap utilization, performance, window coverage, exceptions) is compiled at quarter close and delivered within 30 days. Policy adoption, re-adoption, expiry flags, and board decisions are write-restricted to Compliance and the Board secretary; the quarterly packet is read-only to ALCO.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Board adopts or re-adopts the CDA policy (`cda.board_decision_recorded`) | Policy version (`cda.policy_version`), board approval date (`policy.board_approved_at`), readoption flag (`cda.policy_readopted`), effective date (`policy.effective_date`) | Recorded board resolution + adoption record (`cda.board_decision_recorded`) | Annual re-adoption (enforced by `cda.policy_review_due`) |
  | Policy review lapses with no re-adoption (`cda.policy_expired`) | Policy expiry timestamp (`cda.policy_expiry_at`), actions-blocked flag (`cda.actions_blocked`) | CDA action block engaged + expiry event (`cda.policy_expired`) | On expiry (enforced by `cda.policy_review_due`) |
  | Quarter closes for CDA reporting (`cda.quarter_closed`) | Cap utilization (`cda.aggregate_book_value`, `cda.net_worth`), portfolio performance (`cda.portfolio_performance`), distribution window coverage (`cda.window_coverage_pct`), exceptions (`cda.audit_finding`) | Quarterly Board/ALCO packet issued (`cda.board_packet_issued`) | 30 days after quarter-end (enforced by `cda.board_packet_due_at`) |
  | Board approval requested for a CDA action (`cda.board_approval_requested`) | Proposal packet (`cda.proposal_packet`), structure/strategy/vendor refs (`cda.structure_type`, `cda.strategy_limits`, `cda.vendor_qualified`) | Approval request logged for Board decision (`cda.board_approval_requested`) | — |

- **ALERTS/METRICS:** Alert when the policy review/expiry timer enters its warning window (target: zero expired-policy days) and when the quarterly packet ages past 25 days toward the 30-day deadline; track quarterly packet on-time delivery at 100%.

## CDA-02 — Definitions & Glossary  {#cda-02-definitions-glossary}

- **WHY (Reg cite):** §721.3(b)(2) hinges on defined terms — Qualified Charity and Affiliate among them — and incorporates the tax-status definition of a charity at [26 U.S.C. §501(c)(3)](https://www.law.cornell.edu/uscode/text/26/501); see [12 CFR §721.3(b)(2)](https://www.ecfr.gov/current/title-12/part-721/section-721.3). Validations, distribution math, and the Total Return calculation all depend on a single authoritative glossary.
- **SYSTEM BEHAVIOR:** A central, versioned glossary holds CDA, Qualified Charity, Total Return, Distribution in Kind, Affiliate, Net Worth, and Book Value, each with its regulatory citation. The glossary powers downstream validations (charity eligibility, affiliate fee blocking), calculations (Total Return, cap utilization), and reporting. Glossary changes require Compliance proposal and are write-restricted to Compliance; every consuming control cites the glossary version in force at the time of action so determinations are reproducible.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | A glossary term change is proposed (`cda.glossary_change_proposed`) | Glossary term (`cda.glossary_term`), citation (`cda.glossary_citation`), proposed version (`cda.glossary_version`) | Proposed glossary redline logged (`cda.glossary_change_proposed`) | — |
  | Glossary version is published and attested (`cda.glossary_updated`) | New glossary version (`cda.glossary_version`), attestation (`cda.glossary_attested`) | Updated glossary published + attestation record (`cda.glossary_updated`, `cda.glossary_attested`) | — |

- **ALERTS/METRICS:** Alert on any CDA validation or calculation that references a glossary version other than the current published version (target zero stale-version uses); track glossary attestation completeness at 100% after each publish.

## CDA-03 — Structure & Segregation  {#cda-03-structure-segregation}

- **WHY (Reg cite):** §721.3(b)(2) requires CDA assets to be held in a segregated, properly labeled account or vehicle; see [12 CFR §721.3(b)(2)](https://www.ecfr.gov/current/title-12/part-721/section-721.3). Segregation and labeling are what keep CDA assets outside the general Part 703 portfolio.
- **SYSTEM BEHAVIOR:** Each CDA must use a segregated custodial account or an SPE/trust labeled "Charitable Donation Account." The structure is selected and an evidence packet (label, custody arrangement, structure type) is assembled and filed before first funding; the funding gate (see [CDA-05](#cda-05-written-agreement-required-clauses)) will not release until the structure is selected and the evidence packet is on file. Structure selection and the evidence packet are write-restricted to Compliance and the CFO/Controller.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | CDA structure is selected before funding (`cda.evidence_packet_filed`) | Structure type (`cda.structure_type`), structure-selected flag (`cda.structure_selected`), account label (`cda.account_label`), custodian statement (`cda.custodian_statement`) | Filed structure evidence packet (`cda.evidence_packet_filed`) | Before first funding |

- **ALERTS/METRICS:** Alert on any funding request where structure-selected or evidence-packet-filed is false (target zero funding attempts without a filed packet); track the count of CDA accounts whose label is not exactly "Charitable Donation Account" (target zero).

## CDA-04 — Trustee & Manager Qualification  {#cda-04-trustee-manager-qualification}

- **WHY (Reg cite):** §721.3(b)(2) limits who may hold or manage CDA assets — a regulated trustee, and any non-FCU discretionary manager must be an SEC-registered investment adviser or OCC-regulated; see [12 CFR §721.3(b)(2)](https://www.ecfr.gov/current/title-12/part-721/section-721.3). A registration lapse can break the safe harbor.
- **SYSTEM BEHAVIOR:** Only regulated trustees, and discretionary managers that are SEC-registered investment advisers or OCC-regulated, may be onboarded; the system validates regulatory status at onboarding and re-validates annually, capturing the registration evidence and regulator. If a registration lapse is detected, the system flags the vendor and escalates to the Board within 2 business days. Vendor qualification status and registration evidence are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Trustee/manager onboarding begins (`cda.vendor_onboarding_started`) | Regulator (`cda.vendor_regulator`), registration status (`cda.vendor_registration_status`), registration evidence (`cda.vendor_registration_evidence`) | Qualification determination + onboarding record (`cda.vendor_dd_completed`, `cda.vendor_qualified`) | Before assets are placed |
  | Annual re-validation of regulatory status (`cda.vendor_review_completed`) | Registration status (`cda.vendor_registration_status`), revalidation flag (`cda.vendor_revalidated`) | Re-validation record (`cda.vendor_review_completed`) | Annual (enforced by `cda.vendor_review_due`) |
  | Registration lapse detected (`cda.vendor_issue_flagged`) | Lapse flag (`cda.vendor_registration_lapsed`), issue details (`cda.vendor_issue_details`) | Board escalation issued (`cda.board_escalation_issued`) | 2 business days (enforced by `cda.conflict_escalation_due_at`) |

- **ALERTS/METRICS:** Alert immediately on any detected registration lapse and track escalation latency against the 2-business-day clock (target 100% on time); track count of CDA vendors past their annual re-validation due date (target zero).

## CDA-05 — Written Agreement: Required Clauses (A)–(D)  {#cda-05-written-agreement-required-clauses}

- **WHY (Reg cite):** §721.3(b)(2) requires the CDA agreement to name the Qualified Charities (A), state the investment strategy/risk (B), require GAAP accounting (C), and set distribution frequency under §721.3(b)(2)(v) (D); see [12 CFR §721.3(b)(2)](https://www.ecfr.gov/current/title-12/part-721/section-721.3). Missing any clause defeats the safe harbor.
- **SYSTEM BEHAVIOR:** Funding is blocked unless the agreement is validated to contain all four required clauses — named Qualified Charities (A), investment strategy/risk (B), GAAP accounting requirement (C), and distribution frequency per §721.3(b)(2)(v) (D). The funding gate evaluates clause validation together with the structure evidence from [CDA-03](#cda-03-structure-segregation) before releasing the first funding. Any agreement amendment re-opens the gate and requires Board re-approval before further funding. Agreement validation and amendment approval are write-restricted to Compliance and Legal.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Agreement submitted for validation (`cda.agreement_submitted`) | Charities clause (`cda.agreement_distribution_clause`), strategy clause (`cda.agreement_strategy_clause`), GAAP clause (`cda.agreement_gaap_clause`), validation flag (`cda.agreement_validated`) | Clause validation result + submission record (`cda.agreement_submitted`, `cda.agreement_validated`) | Before first funding |
  | Funding requested against the agreement (`cda.funding_requested`) | Funding amount (`cda.funding_amount`), funding gate evaluation (`cda.funding_gate_evaluated`), structure-selected (`cda.structure_selected`), agreement-validated (`cda.agreement_validated`) | Funding gate decision logged (`cda.funding_gate_evaluated`) | Before funds move (enforced by `cda.funding_first_line` via `funding.first_line_due_at`) |
  | Agreement amendment proposed (`cda.agreement_amendment_proposed`) | Amendment redline (`cda.agreement_redline`), affected clauses (`cda.agreement_strategy_clause`, `cda.agreement_gaap_clause`, `cda.agreement_distribution_clause`) | Amendment routed for Board re-approval (`cda.agreement_amendment_proposed`, `cda.board_approval_requested`) | Before post-amendment funding |

- **ALERTS/METRICS:** Alert on any funding request where the four-clause validation flag is false (target zero); track the count of post-amendment fundings that proceeded without recorded Board re-approval (target zero).

## CDA-06 — Funding Cap: Monitoring & Cure  {#cda-06-funding-cap-monitoring-cure}

- **WHY (Reg cite):** §721.3(b)(2) caps aggregate CDA book value at no more than 5% of net worth with a defined cure period; see [12 CFR §721.3(b)(2)](https://www.ecfr.gov/current/title-12/part-721/section-721.3). Exceeding the cap without timely cure loses Part 703 relief.
- **SYSTEM BEHAVIOR:** The system keeps aggregate CDA book value at no more than 5% of net worth, with a default internal buffer of 4%. Cap tests run monthly and at quarter-end, comparing aggregate book value against net worth; a projected breach blocks further funding. If an actual breach occurs, a cure plan is opened and the breach must be cured within 30 calendar days. Cap parameters and the buffer are write-restricted to the CFO/Controller and Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Monthly and quarter-end cap test runs (`cda.cap_test_completed`) | Aggregate book value (`cda.aggregate_book_value`), net worth (`cda.net_worth`), buffer (`cda.cap_buffer_pct`) | Cap test result + certification (`cda.cap_test_completed`, `cda.cap_certified`) | Monthly and at quarter-end (enforced by `cda.cap_test_due_at`) |
  | Projected breach on a funding request (`cda.funding_requested`) | Projected aggregate book value (`cda.aggregate_book_value`), excess amount (`cda.cap_excess_amount`), funding gate (`cda.funding_gate_evaluated`) | Funding blocked + gate decision logged (`cda.funding_gate_evaluated`) | Before funds move |
  | Actual cap breach detected (`cda.cap_breached`) | Excess amount (`cda.cap_excess_amount`), cure plan (`cda.cure_plan`), remediation owner (`cda.remediation_owner`) | Cure plan opened and executed (`cda.cap_breached`, `cda.remediation_closed`) | 30 calendar days (enforced by `cda.cap_cure_due_at`) |

- **ALERTS/METRICS:** Alert when cap utilization crosses the 4% internal buffer and again at the 5% regulatory limit; track open cap-breach cures aging toward the 30-day deadline (target zero breaches and 100% cures within 30 days).

## CDA-07 — Investment Strategy & Risk Limits  {#cda-07-investment-strategy-risk-limits}

- **WHY (Reg cite):** While [12 CFR §721.3(b)(2)](https://www.ecfr.gov/current/title-12/part-721/section-721.3) relieves a conforming CDA from the FCU investment limits of [12 CFR Part 703](https://www.ecfr.gov/current/title-12/part-703), the Board still owes a duty of prudence; this control applies Board-approved overlays that Part 703 would otherwise supply.
- **SYSTEM BEHAVIOR:** Board-approved prudent overlays — single-issuer, sector, liquidity, volatility, and drawdown limits — are applied to CDA trading even though Part 703 limits do not apply. Pre-trade checks run before any CDA trade and block trades that violate the overlays; post-trade checks run monthly against the portfolio composition. Overlay limit definitions are write-restricted to the Board and ALCO; trade and overlay parameters are read-only to the manager.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | A CDA trade is proposed (`cda.trade_proposed`) | Trade details (`cda.trade_details`), overlay limits (`cda.overlay_limits`), portfolio composition (`cda.portfolio_composition`) | Pre-trade check result (`cda.pretrade_check_completed`) | Before trade execution |
  | Monthly post-trade overlay check runs (`cda.posttrade_check_completed`) | Portfolio composition (`cda.portfolio_composition`), overlay limits (`cda.overlay_limits`), risk assessment (`cda.risk_assessment`) | Post-trade check result (`cda.posttrade_check_completed`) | Monthly (enforced by `cda.posttrade_due_at`) |
  | Board-approved overlay change proposed (`cda.overlay_change_proposed`) | Proposed overlay limits (`cda.overlay_limits`), strategy/limits (`cda.strategy_limits`) | Overlay change routed for Board approval (`cda.overlay_change_proposed`, `cda.board_approval_requested`) | — |

- **ALERTS/METRICS:** Alert on any pre-trade block from an overlay violation and on any monthly post-trade breach (target zero unremediated breaches); track post-trade check on-time completion at 100%.

## CDA-08 — Charity Eligibility & Giving Rules  {#cda-08-charity-eligibility-giving-rules}

- **WHY (Reg cite):** §721.3(b)(2) requires distribution of at least 51% of Total Return to Qualified Charities at least every five years and at termination, where a Qualified Charity is defined by tax status under [26 U.S.C. §501(c)(3)](https://www.law.cornell.edu/uscode/text/26/501) (and (c)(19)); see [12 CFR §721.3(b)(2)](https://www.ecfr.gov/current/title-12/part-721/section-721.3).
- **SYSTEM BEHAVIOR:** Each donee's EIN and IRS §501(c)(3)/(c)(19) status is validated before a distribution; the system tracks the rolling five-year distribution window and the cumulative Total Return and distribution amounts, enforcing that at least 51% of Total Return is distributed to Qualified Charities at least every five years and at termination, with a default annual cadence by December 31. A distribution at or above $5,000 routes through the dual-approval control in [CDA-11](#cda-11-internal-controls-testing). Donee validation status is write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Distribution cycle opens for the giving window (`cda.distribution_cycle_opened`) | Cumulative Total Return (`cda.total_return_cumulative`), cumulative distributions (`cda.distributions_cumulative`), window close date (`cda.window_close_at`), coverage (`cda.window_coverage_pct`) | Distribution cycle opened + window coverage tracked (`cda.distribution_cycle_opened`) | ≥51% at least every 5 years; default annual by Dec 31 (enforced by `cda.distribution_due_at`) |
  | A distribution to a donee is proposed (`cda.distribution_proposed`) | Donee EIN (`cda.donee_ein`), IRS status (`cda.donee_irs_status`), validation flag (`cda.donee_validated`), distribution amount (`cda.distribution_amount`) | Donee validation + proposed distribution logged (`cda.distribution_proposed`, `cda.donee_validated`) | Before funds disburse |
  | Distribution executed (`cda.distribution_executed`) | Distribution amount (`cda.distribution_amount`), dual approval (`cda.dual_approval_recorded`), shortfall flag (`cda.distribution_shortfall`) | Executed distribution recorded (`cda.distribution_executed`) | Within the open giving window |

- **ALERTS/METRICS:** Alert when window coverage falls short of the 51% threshold as the five-year (or annual Dec 31) close approaches and on any unvalidated donee (target zero invalid EIN/status distributions); track rolling-window coverage percentage continuously.

## CDA-09 — Accounting, Reporting & Records  {#cda-09-accounting-reporting-records}

- **WHY (Reg cite):** §721.3(b)(2) requires GAAP accounting for the CDA; see [12 CFR §721.3(b)(2)](https://www.ecfr.gov/current/title-12/part-721/section-721.3). Accurate GAAP entries and the Call Report mapping are what evidence the cap, Total Return, and distribution math to examiners.
- **SYSTEM BEHAVIOR:** The system enforces GAAP entries for CDA activity, performs monthly reconciliations of GL balances to custodian statements, and maintains the Call Report Account 789H mapping. The quarterly Board/ALCO packet is produced through [CDA-01](#cda-01-governance-board-oversight); this control issues the underlying accounting and reconciliation artifacts within 30 days of quarter-end. GL mapping and reconciliation sign-off are write-restricted to the CFO/Controller.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Monthly CDA reconciliation runs (`cda.reconciliation_completed`) | GL balances (`cda.gl_balances`), custodian statement (`cda.custodian_statement`), preparer (`cda.preparer_id`) | Reconciliation record (`cda.reconciliation_completed`) | Monthly (enforced by `cda.reconciliation_due_at`) |
  | Call Report 789H mapping cycle opens (`cda.call_report_cycle_opened`) | 789H mapping (`cda.account_789h_mapping`), GL balances (`cda.gl_balances`) | Mapped Call Report entry (`cda.call_report_mapped`) | Quarterly |
  | Month/quarter closes for CDA books (`cda.month_closed`, `cda.quarter_closed`) | Aggregate book value (`cda.aggregate_book_value`), total return (`cda.total_return_cumulative`), portfolio performance (`cda.portfolio_performance`) | Accounting close artifacts logged (`cda.month_closed`, `cda.quarter_closed`) | 30 days after quarter-end (enforced by `cda.board_packet_due_at`) |

- **ALERTS/METRICS:** Alert on any unreconciled GL-to-custodian variance and on 789H mapping gaps (target zero open variances at quarter close); track monthly reconciliation on-time completion at 100%.

## CDA-10 — Third-Party Risk Management  {#cda-10-third-party-risk-management}

- **WHY (Reg cite):** The qualification of trustees and managers under [12 CFR §721.3(b)(2)](https://www.ecfr.gov/current/title-12/part-721/section-721.3) is sustained only through ongoing diligence; lapses in financial condition, control, or continuity threaten the safe harbor and CDA assets. (Enterprise vendor management beyond CDA-specific diligence is governed by the Third-Party Risk Policy.)
- **SYSTEM BEHAVIOR:** Life-cycle due diligence runs on CDA trustees and managers — regulatory status, financials, SOC/ISO reports, BCP/DR, and fees/conflicts — and is reviewed annually. Contracts must include a 90-day termination clause and documented asset-transfer steps. Material issues are escalated within 2 business days. Vendor diligence files and contract clause validation are write-restricted to Compliance and Legal.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | CDA vendor due diligence completes (`cda.vendor_dd_completed`) | DD file (`cda.vendor_dd_file`), financials (`cda.vendor_financials`), SOC/ISO (`cda.vendor_soc_iso`), BCP/DR (`cda.vendor_bcp_dr`), fee disclosures (`cda.vendor_fee_disclosures`) | Completed diligence record (`cda.vendor_dd_completed`) | Before engagement and annually (enforced by `cda.vendor_review_due`) |
  | Vendor contract drafted for CDA engagement (`cda.vendor_contract_drafted`) | Termination clause (`cda.contract_termination_clause`), transfer steps (`cda.contract_transfer_steps`), contract validation (`cda.vendor_contract_validated`) | Contract draft + clause validation logged (`cda.vendor_contract_drafted`) | Before assets are placed |
  | Material vendor issue identified (`cda.vendor_issue_flagged`) | Issue details (`cda.vendor_issue_details`), registration lapse flag (`cda.vendor_registration_lapsed`) | Board escalation issued (`cda.board_escalation_issued`) | 2 business days (enforced by `cda.conflict_escalation_due_at`) |

- **ALERTS/METRICS:** Alert on contracts missing the 90-day termination or asset-transfer clauses and on any material issue escalation aging toward the 2-business-day clock; track CDA vendors past their annual review due date (target zero).

## CDA-11 — Internal Controls & Testing  {#cda-11-internal-controls-testing}

- **WHY (Reg cite):** Sound internal controls evidence that each §721.3(b)(2) condition is met continuously; see [12 CFR §721.3(b)(2)](https://www.ecfr.gov/current/title-12/part-721/section-721.3). Dual approvals, segregation of duties, automated cap checks, valuation review, and independent audit are how the program proves the safe harbor.
- **SYSTEM BEHAVIOR:** Distributions at or above $5,000 require dual approvals; segregation of duties is enforced so no single user both initiates and approves a CDA distribution. Automated cap checks (from [CDA-06](#cda-06-funding-cap-monitoring-cure)) run on every funding, quarterly valuation reviews validate independent pricing, and Internal Audit tests the CDA program annually with tracked remediation. Dual-approval routing and audit findings are write-restricted to Compliance and Internal Audit.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Distribution at or above $5,000 initiated (`cda.distribution_proposed`) | Distribution amount (`cda.distribution_amount`), dual-control requirement (`transaction.dual_control_required`), initiator (`transaction.initiated_by`) | Dual approval recorded (`cda.dual_approval_recorded`) | Before disbursement |
  | Quarterly valuation review runs (`cda.valuation_review_completed`) | Independent pricing (`cda.independent_pricing`), asset details (`cda.asset_details`), portfolio composition (`cda.portfolio_composition`) | Valuation review record (`cda.valuation_review_completed`) | Quarterly (enforced by `cda.posttrade_due_at`) |
  | Annual Internal Audit cycle opens for CDA (`cda.audit_cycle_opened`) | Audit scope (`audit.engagement_scope`), prior findings (`cda.audit_finding`) | Audit report issued + findings logged (`cda.audit_report_issued`, `cda.audit_finding_logged`) | Annual (enforced by `cda.audit_due_at`) |
  | Audit finding remediation closes (`cda.remediation_closed`) | Finding (`cda.audit_finding`), remediation owner (`cda.remediation_owner`) | Remediation closure record (`cda.remediation_closed`) | Per remediation plan (enforced by `cda.remediation_due_at`) |

- **ALERTS/METRICS:** Alert on any attempted distribution at/above $5,000 without a second approval and on any SoD conflict on a CDA distribution (target zero); track open audit-finding remediations aging past their due date.

## CDA-12 — Termination  {#cda-12-termination}

- **WHY (Reg cite):** §721.3(b)(2) requires, at termination, the closing distribution of at least 51% of Total Return and that any remaining assets be received in cash or in kind only if otherwise permissible FCU investments; see [12 CFR §721.3(b)(2)](https://www.ecfr.gov/current/title-12/part-721/section-721.3) and the permissible-investment context of [12 CFR Part 703](https://www.ecfr.gov/current/title-12/part-703).
- **SYSTEM BEHAVIOR:** On termination, the system executes the closing distribution satisfying the ≥51%-of-Total-Return requirement, then receives remaining assets in cash, or in kind only after a permissibility determination confirms the assets are otherwise-permissible FCU investments. A final accounting is prepared and a termination report is issued within 30 days post-close. In-kind transfers that fail the permissibility check are blocked and must be liquidated to cash before receipt; the closing distribution itself routes through the dual-approval control in [CDA-11](#cda-11-internal-controls-testing) when at or above $5,000. Termination approval and the permissibility determination are write-restricted to the Board, CFO/Controller, and Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Termination is approved (`cda.termination_approved`) | Cumulative Total Return (`cda.total_return_cumulative`), closing distribution amount (`cda.distribution_amount`), final accounting (`cda.final_accounting`) | Closing distribution executed (`cda.closing_distribution_executed`) | At termination (closing distribution) |
  | Remaining assets received in kind (`cda.inkind_transfer_proposed`) | Asset details (`cda.asset_details`), permissibility determination (`cda.permissibility_determination`), in-kind evaluation (`cda.inkind_transfer_evaluated`) | Permissibility determination + transfer decision logged (`cda.inkind_transfer_proposed`) | Before assets are received |
  | CDA account closed post-termination (`cda.account_closed`) | Final accounting (`cda.final_accounting`), GL balances (`cda.gl_balances`) | Termination report issued (`cda.termination_report_issued`) | 30 days post-close (enforced by `cda.termination_report_due_at`) |

- **ALERTS/METRICS:** Alert on any in-kind receipt attempted without a passing permissibility determination and on a termination report aging toward the 30-day deadline (target 100% on-time); confirm the closing distribution met ≥51% before account closure (target zero closures short of the threshold).

## CDA-13 — Conflicts & Fees  {#cda-13-conflicts-fees}

- **WHY (Reg cite):** §721.3(b)(2) prohibits the credit union or its affiliates from receiving CDA fees or expenses, preserving the Total Return that must flow to Qualified Charities; the definition of Affiliate is set by the rule. See [12 CFR §721.3(b)(2)](https://www.ecfr.gov/current/title-12/part-721/section-721.3).
- **SYSTEM BEHAVIOR:** The system blocks payment of any CDA fee or expense to the credit union or its affiliates via a payee blocklist evaluated against the Affiliate definition in [CDA-02](#cda-02-definitions-glossary), and runs a quarterly fee review across all CDA fee payments. Any conflict is escalated within 5 business days. A fee payment to a payee not on the blocklist proceeds only after the fee screen passes; a flagged conflict blocks the payment pending escalation. The payee blocklist and fee-conflict dispositions are write-restricted to Compliance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | A CDA fee payment is proposed (`cda.fee_payment_proposed`) | Fee amount (`cda.fee_amount`), payee (`cda.fee_payee`), affiliate list (`affiliate.list`) | Fee screen result (`cda.fee_screen_completed`) | Before payment |
  | Quarterly fee review runs (`cda.fee_review_completed`) | YTD fee total (`fee.ytd_total`), payees (`cda.fee_payee`), conflict details (`cda.conflict_details`) | Quarterly fee review record (`cda.fee_review_completed`) | Quarterly |
  | Affiliate/CU fee conflict flagged (`cda.fee_conflict_flagged`) | Conflict details (`cda.conflict_details`), payee (`cda.fee_payee`) | Conflict escalated (`cda.conflict_escalated`) | 5 business days (enforced by `cda.conflict_escalation_due_at`) |

- **ALERTS/METRICS:** Alert on any fee payment screened against an affiliate/CU payee (target zero affiliate fee payments) and on any conflict escalation aging toward the 5-business-day clock; track quarterly fee review completion at 100%.

## CDA-14 — Communications & Accessibility  {#cda-14-communications-accessibility}

- **WHY (Reg cite):** Public CDA web pages and announcements must be accessible under the ADA Title III standards at [28 CFR Part 36](https://www.ecfr.gov/current/title-28/part-36). (General website accessibility standards are governed by the Compliance and E-Commerce Policies; this control covers only CDA-specific communications.)
- **SYSTEM BEHAVIOR:** A pre-publication ADA/WCAG checklist is applied to CDA web pages and press materials; publication is blocked until both Marketing and Compliance approve and the checklist passes. Approved artifacts are archived. The WCAG checklist and approval routing are write-restricted to Compliance and Marketing.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | CDA communication drafted for publication (`cda.communication_drafted`) | Communication draft (`cda.communication_draft`), WCAG checklist (`cda.wcag_checklist`) | Pre-publication checklist + approval logged (`cda.communication_approved`) | Before publication |
  | CDA communication published (`cda.communication_published`) | Approval record (`cda.communication_approved`), archived artifact (`cda.communication_archived`) | Published + archived artifact (`cda.communication_published`, `cda.communication_archived`) | At publication |

- **ALERTS/METRICS:** Alert on any CDA page or press item published without a passing WCAG checklist and dual Marketing/Compliance approval (target zero); track archive completeness for published CDA communications at 100%.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer. The CCO centralizes governance of all controls in this policy, with the CFO/Controller, ALCO, TPRM, Legal, and the Board as required participants per control.
- **Approval & re-adoption:** The Board adopts and annually re-adopts this policy (see [CDA-01](#cda-01-governance-board-oversight)); CDA actions are blocked while the policy is expired.
- **Review cadence:** Annual review and re-adoption; effective 2026-07-01, next review 2027-07-01. Material regulatory or program changes trigger off-cycle amendment with Board re-approval.
- **Cross-references (out of scope here, governed elsewhere):** general FCU investment portfolio limits and permissible investments — Investment Policy (Part 703 context); trustee/manager vendor management beyond CDA-specific diligence — Third-Party Risk Policy; enterprise financial reporting and Call Report production beyond the 789H CDA mapping — Capitalization Policy and Record Retention Policy; general website accessibility — Compliance Policy and E-Commerce Policy.

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional for codes not yet registered.** The CDA `cda.*` entity/field/event codes and the `cda_*` / `cda.*_due_at` task and timer codes used throughout the control overlays are present in DESIGN_NOTES and treated as registered. Where a control references a generic registered code under a different entity — e.g., `transaction.dual_control_required` and `transaction.initiated_by` (CDA-11), `affiliate.list` (CDA-13), `fee.ytd_total` (CDA-13), `audit.engagement_scope` (CDA-11), `policy.board_approved_at` / `policy.effective_date` (CDA-01) — those names are the target mapping and will be confirmed by engineering before the next review.
- **Internal cap buffer default.** The 4% internal buffer below the 5% regulatory cap is a program default; the Board may set a different buffer at adoption. Confirmation needed at policy adoption.
- **Distribution cadence default.** The annual December 31 distribution cadence is a program default operating within the regulatory floor of ≥51% of Total Return at least every five years; the Board may adopt a different conforming cadence. Confirmation needed.
- **Dual-approval threshold.** The $5,000 dual-approval threshold for distributions is a program default; confirm the Board-set threshold at adoption.
- **Qualified Charity tax categories.** This policy validates §501(c)(3) and §501(c)(19) status per PATRICK_NOTES; confirm whether any additional charity categories permitted under the rule's definition of Qualified Charity should be in scope.
- **Charter type and §721 applicability.** This policy assumes Pynthia Credit Union is a federal credit union to which 12 CFR §721.3(b)(2) applies. If the charter is state-chartered, confirm the equivalent state authority and any differences before reliance.
- **In-kind permissibility reference.** Termination in-kind receipt (CDA-12) is gated on assets being otherwise-permissible FCU investments under Part 703; the permissibility determination logic is owned by the Investment Policy and is referenced, not redefined, here. Confirm the integration point with Investment Policy controls.
- **789H Call Report mapping ownership.** This policy maintains only the CDA-side 789H mapping; enterprise Call Report production is out of scope (Capitalization Policy). Confirm the hand-off boundary with the enterprise reporting owner.
