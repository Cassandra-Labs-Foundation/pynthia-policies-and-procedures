# Charitable Donation Accounts

> **General Policy Statement**\
> \{{ORGANIZATION\}} may establish and operate Charitable Donation Accounts (CDAs) to support mission-aligned charitable giving while complying with **12 CFR §721.3(b)(2)(i)–(vii)**. When a CDA satisfies all §721.3(b)(2) conditions, its investments are **not limited by Part 703**. \{{ORGANIZATION\}} maintains segregated CDA structures, uses regulated trustees/managers, caps aggregate CDA **book value at ≤5% of net worth**, distributes **≥51% of Total Return** to **Qualified Charities** at least every five (5) years and again at termination, prohibits affiliate fees from the CDA, and reports CDA assets per Call Report instructions.

***

## Multi-Rule Authority Table <a href="#authority" id="authority"></a>

| Topic                                                    | Scope                                                      | Key Clauses / Notes                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **FCU Incidental Powers — Charitable Donation Accounts** | CDA conditions, structure, cap, distributions, definitions | **12 CFR §721.3(b)(2)** (i–vii: ≤5% cap & cure; segregation/labeling; trustee/manager qualification; agreement clauses A–D; ≥51% Total Return distribution ≤5 years and at termination; liquidation incl. distribution-in-kind; definitions inc. Qualified Charity and Affiliate). [12 CFR §721.3(b)(2)](https://www.ecfr.gov/current/title-12/part-721#p-721.3%28b%29%282%29) |
| **Investments (context)**                                | Part 703 does **not** apply when §721.3(b)(2) is met       | **12 CFR Part 703** (investment limits otherwise applicable to FCUs). [12 CFR Part 703](https://www.ecfr.gov/current/title-12/part-703)                                                                                                                                                                                                                                        |
| **Qualified Charity (tax status)**                       | Donee eligibility                                          | **26 U.S.C. §501(c)(3)**; **§501(c)(19)** (war veterans’ orgs). [26 U.S.C. §501](https://www.law.cornell.edu/uscode/text/26/501)                                                                                                                                                                                                                                               |
| **ADA (accessibility of public communications)**         | Accessibility of CDA-related web pages/announcements       | **28 CFR Part 36** (public accommodations). [28 CFR Part 36](https://www.ecfr.gov/current/title-28/part-36)                                                                                                                                                                                                                                                                    |

> **Linking note:** External links above are limited to statutes/regs (eCFR/LII). Call Report instructions and rulemaking preambles inform practice but are not linked here.

***

## Timing Matrix <a href="#timing-matrix" id="timing-matrix"></a>

| Scenario                                    | Trigger (human → event)                          |                                                            Deadline | Content Reference            | Control                                                                           |
| ------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------: | ---------------------------- | --------------------------------------------------------------------------------- |
| Establish/renew policy & scope              | Board approves → `cda.policy_approved`           |                                                      Annually (min) | Governance & ownership       | [CA-01](charitable-donation-accounts.md#ca-01-governance--ownership)              |
| Create CDA structure (segregation/labeling) | Account opened → `cda.account.created`           |                                                Before first funding | Structure evidence packet    | [CA-03](charitable-donation-accounts.md#ca-03-structure--segregation)             |
| Execute required agreement clauses A–D      | Contract executed → `cda.contract.executed`      |                                                Before first funding | Clause checklist A–D         | [CA-05](charitable-donation-accounts.md#ca-05-written-agreement-required-clauses) |
| Monthly cap test                            | Month-end close → `cda.cap_test.run`             |                                                    +5 business days | Cap utilization report       | [CA-06](charitable-donation-accounts.md#ca-06-funding-cap--monitoring--cure)      |
| Breach cure (cap >5%)                       | Breach found → `cda.cap_test.failed`             |                                              ≤ **30 calendar days** | Cure plan & status           | [CA-06](charitable-donation-accounts.md#ca-06-funding-cap--monitoring--cure)      |
| Annual distribution cadence (default)       | December schedule → `cda.distribution.scheduled` |                                                       By **Dec 31** | Distribution log             | [CA-08](charitable-donation-accounts.md#ca-08-charity-eligibility--giving-rules)  |
| Five-year minimum distribution window       | Window start → `cda.window.started`              | ≤ **5 years** to distribute ≥51% Total Return; again at termination | Window coverage report       | [CA-08](charitable-donation-accounts.md#ca-08-charity-eligibility--giving-rules)  |
| Quarterly board/ALCO reporting              | Quarter close → `cda.qclose.completed`           |                                                            +30 days | Board packet                 | [CA-09](charitable-donation-accounts.md#ca-09-accounting-reporting--records)      |
| Annual vendor due diligence                 | Anniversary → `cda.vendor.reviewed`              |                                                            Annually | DD report & scorecard        | [CA-10](charitable-donation-accounts.md#ca-10-third-party-risk-management)        |
| Termination actions                         | Board vote → `cda.terminated`                    |                                                      At termination | Final distribution & receipt | [CA-12](charitable-donation-accounts.md#ca-12-termination)                        |

***

## Control Index <a href="#control-index" id="control-index"></a>

| ID                                                                                | Control Name                               | Purpose                                                          | Primary Rule(s)                     |
| --------------------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------- | ----------------------------------- |
| [CA-01](charitable-donation-accounts.md#ca-01-governance--ownership)              | Governance & Ownership                     | Board accountability; roles; reporting cadence                   | 12 CFR §721.3(b)(2)                 |
| [CA-02](charitable-donation-accounts.md#ca-02-definitions)                        | Definitions                                | Standardize terms for design/calculations                        | 12 CFR §721.3(b)(2); 26 U.S.C. §501 |
| [CA-03](charitable-donation-accounts.md#ca-03-structure--segregation)             | Structure & Segregation                    | Enforce segregated custodial/trust structure and labeling        | 12 CFR §721.3(b)(2)(ii)             |
| [CA-04](charitable-donation-accounts.md#ca-04-trustee--manager-qualification)     | Trustee & Manager Qualification            | Ensure regulated trustee; SEC RIA/OCC for discretionary managers | 12 CFR §721.3(b)(2)(iii)            |
| [CA-05](charitable-donation-accounts.md#ca-05-written-agreement-required-clauses) | Written Agreement — Required Clauses (A–D) | Guarantee A–D provisions before funding                          | 12 CFR §721.3(b)(2)(iv)(A)–(D)      |
| [CA-06](charitable-donation-accounts.md#ca-06-funding-cap--monitoring--cure)      | Funding Cap — Monitoring & Cure            | Keep ≤5% of net worth; monitor/cure                              | 12 CFR §721.3(b)(2)(i)              |
| [CA-07](charitable-donation-accounts.md#ca-07-investment-strategy--risk-limits)   | Investment Strategy & Risk Limits          | Safety & soundness overlays; Part 703 relief when eligible       | 12 CFR §721.3(b)(2)                 |
| [CA-08](charitable-donation-accounts.md#ca-08-charity-eligibility--giving-rules)  | Charity Eligibility & Giving Rules         | ≥51% Total Return; qualified donees; cadence                     | 12 CFR §721.3(b)(2)(v)              |
| [CA-09](charitable-donation-accounts.md#ca-09-accounting-reporting--records)      | Accounting, Reporting & Records            | GAAP; reconciliations; 789H; board reporting                     | 12 CFR §721.3(b)(2)                 |
| [CA-10](charitable-donation-accounts.md#ca-10-third-party-risk-management)        | Third-Party Risk Management                | Life-cycle oversight of trustee/manager                          | 12 CFR §721.3(b)(2)(iii)            |
| [CA-11](charitable-donation-accounts.md#ca-11-internal-controls--testing)         | Internal Controls & Testing                | Approvals; reconciliations; audits                               | 12 CFR §721.3(b)(2)                 |
| [CA-12](charitable-donation-accounts.md#ca-12-termination)                        | Termination                                | Final distribution; asset receipt constraints                    | 12 CFR §721.3(b)(2)(vi)             |
| [CA-13](charitable-donation-accounts.md#ca-13-conflicts--fees)                    | Conflicts & Fees                           | Preserve “Total Return”; prohibit affiliate fees                 | 12 CFR §721.3(b)(2)(vii)            |
| [CA-14](charitable-donation-accounts.md#ca-14-communications--accessibility)      | Communications & Accessibility             | Accessible/accurate public communications                        | 28 CFR Part 36                      |

***

## Control Overlays (Design Overlay v2)

{% stepper %}
{% step %}
#### CA-01 — Governance & Ownership <a href="#ca-01-governance--ownership" id="ca-01-governance--ownership"></a>

* **WHY (Reg cite):** Board oversight of CDA program, adoption and annual review of this policy, approvals for CDA structures, vendors, strategy/limits, distributions. **12 CFR §721.3(b)(2)**.
* **SYSTEM BEHAVIOR:** Maintain policy artifact and metadata; block CDA actions if policy is expired; produce quarterly metrics (cap utilization, performance, window coverage, exceptions).
* **TRIGGERS (human → event):** Board approves policy → `cda.policy_approved`; Quarterly packet sent → `cda.board_packet.sent`.
* **INPUTS (human → field):** Policy version `(cda.policy.version)`; Effective/next review dates `(cda.policy.dates)`; Approver roster `(cda.policy.approvers)`.
* **OUTPUTS:** Board minutes; quarterly CDA dashboard.
* **TIMERS/SLAs:** Annual policy review; quarterly reporting **≤+30 days** after quarter-end.
* **EDGE CASES:** If board meeting is delayed, ALCO may issue a 90-day interim control memo pending ratification _(Assumption—confirm delegation)_.
* **AUDIT LOGS:** `policy.version.published`, `report.quarterly.issued`.
* **ACCESS CONTROL:** Edit: CFO/Compliance; Approve: Board.
* **ALERTS/METRICS:** Policy age; reporting timeliness.
{% endstep %}

{% step %}
#### CA-02 — Definitions <a href="#ca-02-definitions" id="ca-02-definitions"></a>

* **WHY (Reg cite):** Normalize “CDA,” “Qualified Charity,” “Total Return,” “Distribution in Kind,” “Affiliate,” “Net Worth,” “Book Value.” **12 CFR §721.3(b)(2)**; **26 U.S.C. §501**.
* **SYSTEM BEHAVIOR:** Central glossary powering validations, calculations, and reports.
* **TRIGGERS:** Glossary update approved → `cda.glossary.updated`.
* **INPUTS:** Term, citation, description `(cda.glossary.items[])`.
* **OUTPUTS:** Published glossary.
* **TIMERS/SLAs:** Sync with policy updates.
* **EDGE CASES:** IRS revocation of donee status → mark ineligible for future distributions.
* **AUDIT LOGS:** `cda.glossary.updated`.
* **ACCESS CONTROL:** Edit: Compliance; Read: org-wide.
{% endstep %}

{% step %}
#### CA-03 — Structure & Segregation <a href="#ca-03-structure--segregation" id="ca-03-structure--segregation"></a>

* **WHY (Reg cite):** CDA assets must be in a **segregated custodial account** or **SPE/trust**, labeled “Charitable Donation Account.” **12 CFR §721.3(b)(2)(ii)**.
* **SYSTEM BEHAVIOR:** Require structure selection and labeling before funding; evidence pack (account docs, custodian confirmations).
* **TRIGGERS:** CDA setup → `cda.account.created`.
* **INPUTS:** Structure type `(cda.account.type)`; Legal title `(cda.account.legal_name)`; Custodian/trustee `(cda.account.trustee_id)`.
* **OUTPUTS:** Structure evidence packet.
* **TIMERS/SLAs:** Prior to first contribution.
* **EDGE CASES:** Migration between structures requires Board approval and refreshed evidence.
* **AUDIT LOGS:** `cda.account.created`, `cda.account.migrated`.
* **ACCESS CONTROL:** Edit: CFO/Controller; Approve: Board.
{% endstep %}

{% step %}
#### CA-04 — Trustee & Manager Qualification <a href="#ca-04-trustee--manager-qualification" id="ca-04-trustee--manager-qualification"></a>

* **WHY (Reg cite):** Trustee must be regulated; any non-CU discretionary manager must be **SEC-registered investment adviser** or **OCC-regulated**. **12 CFR §721.3(b)(2)(iii)**.
* **SYSTEM BEHAVIOR:** Onboard only if regulator/registration validated; track annual reviews.
* **TRIGGERS:** Vendor onboarding → `cda.vendor.onboarded`; Annual review → `cda.vendor.reviewed`.
* **INPUTS:** Regulator/registration `(cda.vendor.reg_status)`; ADV reference `(cda.vendor.adv_uri)`; security/BCP docs `(cda.vendor.docs[])`.
* **OUTPUTS:** Due-diligence report; approval memo.
* **TIMERS/SLAs:** Pre-onboarding; annually thereafter.
* **EDGE CASES:** Registration lapse → suspend new trades; Board escalate within **2 business days**.
* **AUDIT LOGS:** `cda.vendor.approved`, `cda.vendor.suspended`.
* **ACCESS CONTROL:** Edit: TPRM; Approve: ALCO/Board.
{% endstep %}

{% step %}
#### CA-05 — Written Agreement — Required Clauses <a href="#ca-05-written-agreement-required-clauses" id="ca-05-written-agreement-required-clauses"></a>

* **WHY (Reg cite):** Agreement must include **(A)** named Qualified Charities; **(B)** investment strategy/risk; **(C)** GAAP accounting for contributions/returns/distributions/liquidation; **(D)** distribution frequency per §721.3(b)(2)(v). **12 CFR §721.3(b)(2)(iv)(A)–(D)**.
* **SYSTEM BEHAVIOR:** Clause checklist gate; block funding if any clause missing.
* **TRIGGERS:** Contract drafted/executed → `cda.contract.drafted` / `cda.contract.executed`.
* **INPUTS:** Named charities schedule `(cda.contract.named_charities[])`; strategy text `(cda.contract.strategy_text)`; GAAP clause `(cda.contract.gaap_clause)`; frequency `(cda.contract.dist_frequency)`.
* **OUTPUTS:** Executed agreement; clause attestation.
* **TIMERS/SLAs:** Before first funding.
* **EDGE CASES:** Amendments require Board re-approval and re-attestation.
* **AUDIT LOGS:** `cda.contract.executed`, `cda.contract.amended`.
* **ACCESS CONTROL:** Edit: Legal/CFO; Approve: Board.
{% endstep %}

{% step %}
#### CA-06 — Funding Cap — Monitoring & Cure <a href="#ca-06-funding-cap--monitoring--cure" id="ca-06-funding-cap--monitoring--cure"></a>

* **WHY (Reg cite):** Aggregate **book value** of all CDAs ≤ **5% of net worth** at all times; measured each quarterly Call Report cycle; cure ≤ **30 days** if breached. **12 CFR §721.3(b)(2)(i)**.
* **SYSTEM BEHAVIOR:** Automated monthly and quarter-end cap tests; internal buffer default **4%**; funding blocks if projected breach; cure workflow.
* **TRIGGERS:** Month-end cap test → `cda.cap_test.run`; Breach → `cda.cap_test.failed`.
* **INPUTS:** Net worth (GAAP/Call Report) `(cda.metric.net_worth)`; CDA aggregate book value `(cda.metric.cda_book_value)`; internal limit `(cda.limit.internal_buffer = 4%)`.
* **OUTPUTS:** Cap report; cure plan; status updates.
* **TIMERS/SLAs:** Cure within **30 calendar days** of breach.
* **EDGE CASES:** Market volatility; consider partial liquidation vs. growth offset.
* **AUDIT LOGS:** `cda.cap_test.passed/failed`, `cda.cure.plan_submitted`, `cda.cure.executed`.
* **ACCESS CONTROL:** Edit: Finance; Approve cures: ALCO/Board.
{% endstep %}

{% step %}
#### CA-07 — Investment Strategy & Risk Limits <a href="#ca-07-investment-strategy--risk-limits" id="ca-07-investment-strategy--risk-limits"></a>

* **WHY (Reg cite):** When §721.3(b)(2) is satisfied, Part 703 limits do not apply; prudent overlays still required. **12 CFR §721.3(b)(2)**.
* **SYSTEM BEHAVIOR:** Enforce Board-approved limits for single-issuer, sector, liquidity, volatility, and drawdown; pre-trade and monthly post-trade checks.
* **TRIGGERS:** Allocation/trade → `cda.trade.allocated`; Risk calc → `cda.risk.calc_completed`.
* **INPUTS:** Single-issuer ≤15% `(cda.limit.single_issuer)`; Sector ≤25% `(cda.limit.sector)`; Liquidity ≥10% `(cda.limit.liquidity)`; Volatility ≤20% ann. `(cda.limit.vol_target)`; Max 12-mo drawdown ≤25% `(cda.limit.max_dd)`.
* **OUTPUTS:** Pre-trade attest; monthly risk dashboard.
* **TIMERS/SLAs:** Pre-trade; monthly reviews.
* **EDGE CASES:** Breach → quarantine new buys; remediation plan.
* **AUDIT LOGS:** `cda.risk.limit_breached`, `cda.risk.remediated`.
* **ACCESS CONTROL:** Edit: CFO/manager; Approve exceptions: ALCO/Board.
{% endstep %}

{% step %}
#### CA-08 — Charity Eligibility & Giving Rules <a href="#ca-08-charity-eligibility--giving-rules" id="ca-08-charity-eligibility--giving-rules"></a>

* **WHY (Reg cite):** Distribute **≥51% of Total Return** to **Qualified Charities** **≤ every 5 years** and **at termination**; donees must be **§501(c)(3) or §501(c)(19)**. **12 CFR §721.3(b)(2)(v)**; **26 U.S.C. §501**.
* **SYSTEM BEHAVIOR:** Validate EIN and IRS evidence; track rolling 5-year window; schedule annual December distributions (default).
* **TRIGGERS:** Charity added → `cda.charity.added`; Distribution scheduled/executed → `cda.dist.scheduled` / `cda.dist.executed`; Window start/end → `cda.window.started` / `cda.window.ending`.
* **INPUTS:** EIN `(cda.charity.ein)`; IRS evidence `(cda.charity.irs_doc_uri)`; Total Return by window `(cda.metric.total_return_window)`; distribution amount `(cda.dist.amount)`.
* **OUTPUTS:** Distribution log (date, EIN, amount, window coverage).
* **TIMERS/SLAs:** Meet ≥51% by **≤5 years**; default annual by **Dec 31**.
* **EDGE CASES:** Charity loses status → block future payouts; reallocate.
* **AUDIT LOGS:** `cda.charity.verified`, `cda.dist.executed`.
* **ACCESS CONTROL:** Edit: CFO; Approve: Board/ALCO per threshold.
{% endstep %}

{% step %}
#### CA-09 — Accounting, Reporting & Records <a href="#ca-09-accounting-reporting--records" id="ca-09-accounting-reporting--records"></a>

* **WHY (Reg cite):** GAAP accounting; periodic reporting; record retention; Call Report mapping to **Account 789H**. **12 CFR §721.3(b)(2)**.
* **SYSTEM BEHAVIOR:** Enforce GAAP entries for contributions/returns/fees/distributions/unrealized; monthly reconciliations; quarterly Board/ALCO packet; maintain 789H mapping.
* **TRIGGERS:** Journal close → `cda.gl.close`; Quarter close → `cda.qclose.completed`.
* **INPUTS:** Income/fees `(cda.gl.income, cda.gl.fees)`; unrealized items `(cda.gl.unrealized)`; 789H balance `(cda.report.789h_balance)`.
* **OUTPUTS:** Reconciliation; board packet (cap %, performance, window coverage, distributions, exceptions).
* **TIMERS/SLAs:** Monthly reconciliations; quarterly reporting **≤+30 days**.
* **EDGE CASES:** Restatements; corrective entries with Board notice.
* **AUDIT LOGS:** `cda.gl.reconciled`, `cda.report.board_issued`.
* **ACCESS CONTROL:** Edit: Controller; Review: CFO; Receive: Board/ALCO.
{% endstep %}

{% step %}
#### CA-10 — Third-Party Risk Management <a href="#ca-10-third-party-risk-management" id="ca-10-third-party-risk-management"></a>

* **WHY (Reg cite):** Validate trustee/manager regulatory status and safety/soundness; ongoing oversight. **12 CFR §721.3(b)(2)(iii)**.
* **SYSTEM BEHAVIOR:** Due-diligence checklist (reg/registration, financials, SOC/ISO, BCP/DR, fees/conflicts); annual reviews; contracts with **90-day termination** and asset-transfer steps.
* **TRIGGERS:** Onboard → `cda.vendor.onboarded`; Annual review → `cda.vendor.reviewed`; Issue logged → `cda.vendor.issue_logged`.
* **INPUTS:** Reg evidence `(cda.vendor.reg_evidence)`; fee/conflict schedule `(cda.vendor.fees_conflicts)`; SLA/KPI feed `(cda.vendor.kpis)`.
* **OUTPUTS:** DD report; scorecard; corrective actions.
* **TIMERS/SLAs:** Annual comprehensive review; escalate material issues within **2 business days**.
* **EDGE CASES:** Discipline/sanctions; sub-processor change.
* **AUDIT LOGS:** `cda.vendor.approved`, `cda.vendor.remediated`.
* **ACCESS CONTROL:** TPRM team; ALCO/Board approvals.
{% endstep %}

{% step %}
#### CA-11 — Internal Controls & Testing <a href="#ca-11-internal-controls--testing" id="ca-11-internal-controls--testing"></a>

* **WHY (Reg cite):** Maintain effective controls supporting §721.3(b)(2).
* **SYSTEM BEHAVIOR:** Dual approvals for distributions ≥$5,000; segregation of duties; automated cap checks; quarterly valuation reviews; annual Internal Audit testing.
* **TRIGGERS:** Distribution approval → `cda.dist.approved`; Audit start → `cda.audit.started`.
* **INPUTS:** Approval matrix `(cda.ctrl.approval_matrix)`; thresholds `(cda.ctrl.thresholds)`.
* **OUTPUTS:** Control attestations; audit findings & remediation tracker.
* **TIMERS/SLAs:** Annual IA; remediation tracked to closure.
* **EDGE CASES:** Temporary compensating controls on break.
* **AUDIT LOGS:** `cda.ctrl.failed/passed`, `cda.audit.finding_logged`.
* **ACCESS CONTROL:** Edit: Risk/IA; Approve: Board.
{% endstep %}

{% step %}
#### CA-12 — Termination <a href="#ca-12-termination" id="ca-12-termination"></a>

* **WHY (Reg cite):** At termination, satisfy ≥51% distribution for the closing period; receive remaining assets **in cash** or **in-kind only if otherwise permissible FCU investments**. **12 CFR §721.3(b)(2)(vi)**.
* **SYSTEM BEHAVIOR:** Enforce closing distribution coverage; document receipt method; stakeholder comms plan as appropriate.
* **TRIGGERS:** Board vote to terminate → `cda.terminated`.
* **INPUTS:** Closing Total Return `(cda.metric.total_return_closing)`; receipt method `(cda.termination.receipt_method)`.
* **OUTPUTS:** Termination memo; final logs; asset transfer docs.
* **TIMERS/SLAs:** Execute per resolution; report within **30 days** post-close.
* **EDGE CASES:** Illiquid positions → staged liquidation plan.
* **AUDIT LOGS:** `cda.termination.completed`.
* **ACCESS CONTROL:** CFO/Legal implement; Board oversight.
{% endstep %}

{% step %}
#### CA-13 — Conflicts & Fees <a href="#ca-13-conflicts--fees" id="ca-13-conflicts--fees"></a>

* **WHY (Reg cite):** Preserve “Total Return” definition—CDA may not pay fees/expenses to the CU or its affiliates. **12 CFR §721.3(b)(2)(vii)**.
* **SYSTEM BEHAVIOR:** Payee blocklist for \{{ORGANIZATION\}} and affiliates; quarterly fee review.
* **TRIGGERS:** Fee invoice received → `cda.fee.invoice_received`.
* **INPUTS:** Payee identity `(cda.fee.payee_id)`; affiliate registry `(cda.affiliates[])`.
* **OUTPUTS:** Fee ledger; conflict attestations.
* **TIMERS/SLAs:** Quarterly review; escalate conflicts **≤5 business days**.
* **EDGE CASES:** Employee-benefit funding exception (not applicable to CDA).
* **AUDIT LOGS:** `cda.fee.payment_blocked`, `cda.conflict.flagged`.
* **ACCESS CONTROL:** Finance/Compliance.
{% endstep %}

{% step %}
#### CA-14 — Communications & Accessibility <a href="#ca-14-communications--accessibility" id="ca-14-communications--accessibility"></a>

* **WHY (Reg cite):** Public CDA communications should be accessible and accurate. **28 CFR Part 36**.
* **SYSTEM BEHAVIOR:** Pre-publication ADA/WCAG checklist for CDA web pages/press; archive artifacts.
* **TRIGGERS:** Publish page/PR → `cda.web.published` / `cda.pr.issued`.
* **INPUTS:** Accessibility checklist `(cda.web.ada_checklist)`; approved copy `(cda.web.copy_id)`.
* **OUTPUTS:** Accessible content; archive.
* **TIMERS/SLAs:** Review before publish.
* **EDGE CASES:** Third-party embeds → provide accessible alternatives.
* **AUDIT LOGS:** `cda.web.reviewed`.
* **ACCESS CONTROL:** Marketing + Compliance approve.
{% endstep %}
{% endstepper %}

***

## Embedded Checklists & Templates <a href="#checklists" id="checklists"></a>

* **Board Resolution (A1)** — Authority, approvals, internal 4% buffer, annual cadence.
* **CDA Agreement Term Sheet (A2)** — Clauses A–D; trustee/manager qualifications; termination terms.
* **Monitoring Dashboard & Breach-Cure Playbook (A3)** — Cap %, window coverage, performance; 2-/10-/30-day actions.
* **Vendor Due-Diligence Checklist (A4)** — Reg status, ADV/discipline, SOC/ISO, BCP/DR, fees/conflicts, SLAs, termination & transfer.
* **Distribution Log Template (A5)** — Date • Charity • EIN • Amount • Window Covered (Y/N) • Evidence (Y/N) • Board Minute Ref.
* **Call-Report / 789H Cheat-Sheet (A6)** — What/when/how to report.
* **Regulatory Citation Quick Reference (A7)** — §721.3(b)(2)(i)–(vii) bullets.

***

## Governance & Sign-Off <a href="#governance" id="governance"></a>

* **Owner:** \{{CFO, CDA Administrator\}}
* **Approvals:** Board adopts and annually re-adopts; approves CDA agreement, named charities, investment strategy/limits, distribution cadence, funding levels, and vendors.
* **Review Cadence:** At least annually and upon material changes to **12 CFR §721.3(b)(2)**.
* **Reporting:** ALCO monthly monitoring; quarterly Board packet (cap %, performance, window coverage, distributions, exceptions).
* **Cross-Refs:** Investment Policy (Part 703 context), Vendor Mgmt Standard (TPRM), Financial Reporting Policy, Website Accessibility Standard.

***

## Assumptions & Gaps

* **Internal buffer:** Default **4%** of net worth (Board may tune). _(Assumption)_
* **Annual December cadence:** Default for operational simplicity; any cadence that satisfies §721.3(b)(2)(v) is acceptable. _(Assumption)_
* **Interim delegation:** 90-day interim control memo pending Board meeting. _(Assumption—confirm governance preference)_
* **Accessibility baseline:** Use organization-standard WCAG target; ADA citation provided for scope. _(Assumption)_

***
