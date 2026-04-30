# Liquidity

\{{ORGANIZATION\}} maintains a risk-based Liquidity Policy and a written Contingency Funding Plan (CFP) covering \{{SCOPE\}}. The Liquidity Policy defines what we measure, limit, and report in normal conditions. The CFP defines how we detect stress, escalate, and execute funding actions when indicators breach triggers. Requirements align to **NCUA** rules; external authorities cited are statutes/regs only.

***

## Multi-Rule Authority Table <a href="#authority" id="authority"></a>

| Topic                                          | Scope                                                                                                                                                                   | Key Clauses / Notes                                                                                                                                 |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **NCUA Liquidity & CFP Rule**                  | Liquidity program, board-approved policy; CFP required for ≥ $50MM; documented access to a **federal** contingent source (CLF and/or Fed Discount Window) for ≥ $250MM. | **12 CFR §741.12** — [https://www.ecfr.gov/current/title-12/part-741/section-741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) |
| **Central Liquidity Facility (CLF) Statute**   | Eligibility, membership/agent membership, purpose of federal emergency liquidity for credit unions.                                                                     | **12 U.S.C. §§1795–1795k** — [https://www.law.cornell.edu/uscode/text/12/chapter-14](https://www.law.cornell.edu/uscode/text/12/chapter-14)         |
| **Federal Reserve Advances (Discount Window)** | Authority for Federal Reserve advances to depository institutions. (Used as federal contingent source.)                                                                 | **12 U.S.C. §347b** — [https://www.law.cornell.edu/uscode/text/12/347b](https://www.law.cornell.edu/uscode/text/12/347b)                            |

> Scope choice is NCUA-only. OCC/FDIC materials are excluded unless directly applicable to federally insured credit unions.

***

## Timing Matrix <a href="#timing-matrix" id="timing-matrix"></a>

| Scenario                             | Trigger (human → event)                                       |             Deadline | Content Reference          | Control                                                                              |
| ------------------------------------ | ------------------------------------------------------------- | -------------------: | -------------------------- | ------------------------------------------------------------------------------------ |
| Daily liquidity monitoring           | “Close-of-day pack ready” → (liquidity.daily\_ready)          |        T+0 DLY 17:00 | LAR, gaps, top depositors  | [LP-05](liquidity.md#lp-05-liquid-assets-ratio-bands--watchlowcritical)              |
| Stress test cycle                    | “Quarterly ALCO review” → (alco.q\_review)                    |        End of Q +5bd | Pack + assumptions log     | [LP-07](liquidity.md#lp-07-stress-testing-scenarios--horizons)                       |
| Regulator notification — Level 2/3   | “CFP Level 2 or 3 activated” → (cfp.level\_changed)           |         **24 hours** | Event memo; action plan    | [LP-10](liquidity.md#lp-10-regulatory-notification-triggers--protocol)               |
| Discount Window / CLF readiness test | “Annual no-funds draw scheduled” → (facility.test\_scheduled) |           **Annual** | Test report; contact sheet | [LP-11](liquidity.md#lp-11-contingent-federal-liquidity-access-clf--discount-window) |
| Board reporting                      | “Quarterly Board meeting” → (board.q\_meeting)                |        **Quarterly** | KPIs vs limits; breaches   | [LP-09](liquidity.md#lp-09-reporting-cadence-opsalcoBoard)                           |
| Crisis comms to major depositors     | “Outflow > 30% 10d or LAR < 8%” → (liquidity.outflow\_major)  | As approved same day | Scripted update            | [CFP-05](liquidity.md#cfp-05-external-communications--stakeholder-matrix)            |

***

## Control Index <a href="#control-index" id="control-index"></a>

| ID                                                                                   | Control Name                   | Purpose                                  | Primary Rule(s)                   |
| ------------------------------------------------------------------------------------ | ------------------------------ | ---------------------------------------- | --------------------------------- |
| [LP-01](liquidity.md#lp-01-policy-scope--risk-appetite)                              | Policy Scope & Risk Appetite   | Define scope, roles, appetite.           | §741.12                           |
| [LP-02](liquidity.md#lp-02-definitions--ratios-catalogue)                            | Definitions & Ratios Catalogue | Standardize metrics and terms.           | §741.12                           |
| [LP-03](liquidity.md#lp-03-maturity-mismatch-limits-dailyweeklymonthlyannual)        | Maturity Mismatch Limits       | Set time-bucket gap limits.              | §741.12                           |
| [LP-04](liquidity.md#lp-04-survival-horizon--coverage-days)                          | Survival Horizon Targets       | Ensure days-of-coverage under stress.    | §741.12                           |
| [LP-05](liquidity.md#lp-05-liquid-assets-ratio-bands--watchlowcritical)              | Liquid Assets Ratio Bands      | Early-warning bands that drive CFP.      | §741.12                           |
| [LP-06](liquidity.md#lp-06-funding-concentration--counterparty-limits)               | Funding Concentration Limits   | Cap dependence on single sources.        | §741.12                           |
| [LP-07](liquidity.md#lp-07-stress-testing-scenarios--horizons)                       | Stress Testing                 | Quarterly scenarios; intraday peaks.     | §741.12                           |
| [LP-08](liquidity.md#lp-08-data-quality--model-governance)                           | Data & Model Governance        | Assumptions, validation, lineage.        | §741.12                           |
| [LP-09](liquidity.md#lp-09-reporting-cadence-opsalcoBoard)                           | Reporting Cadence              | Daily ops, weekly ALCO, quarterly Board. | §741.12                           |
| [LP-10](liquidity.md#lp-10-regulatory-notification-triggers--protocol)               | Regulator Notification         | When/how to notify NCUA.                 | §741.12                           |
| [LP-11](liquidity.md#lp-11-contingent-federal-liquidity-access-clf--discount-window) | Federal Contingent Access      | CLF and Fed Discount Window readiness.   | §741.12; 12 USC 1795; 12 USC 347b |
| [LP-12](liquidity.md#lp-12-collateral--encumbrance-management)                       | Collateral & Encumbrance       | Track/optimize pledged assets.           | §741.12                           |
| [LP-13](liquidity.md#lp-13-wholesale--listing-service-deposits-guardrails)           | Wholesale Deposits Guardrails  | Safe use of listing-service CDs.         | §741.12                           |
| [CFP-01](liquidity.md#cfp-01-cfp-purpose--activation-levels)                         | CFP Purpose & Activation       | Define levels and governance.            | §741.12                           |
| [CFP-02](liquidity.md#cfp-02-early-warning-indicators--event-triggers)               | Early-Warning Indicators       | Detect emerging liquidity stress.        | §741.12                           |
| [CFP-03](liquidity.md#cfp-03-escalation-ladder--crisis-roles)                        | Escalation & Roles             | Decision rights and team.                | §741.12                           |
| [CFP-04](liquidity.md#cfp-04-funding-playbooks--draw-order)                          | Funding Playbooks              | Order of draw; internal/external.        | §741.12                           |
| [CFP-05](liquidity.md#cfp-05-external-communications--stakeholder-matrix)            | Comms & Stakeholders           | Who contacts whom and when.              | §741.12                           |
| [CFP-06](liquidity.md#cfp-06-regulator-liaison-protocols)                            | Regulator Liaison              | Structured contact with NCUA.            | §741.12                           |
| [CFP-07](liquidity.md#cfp-07-liquidity-drills--after-action-reviews)                 | Drills & AARs                  | Exercise plan and remediate.             | §741.12                           |
| [CFP-08](liquidity.md#cfp-08-documentation--retention-10-years)                      | Documentation & Retention      | Evidence for exams (10 years).           | §741.12                           |

***

## LP-01 — Policy Scope & Risk Appetite

* **WHY (Reg cite):** Board-approved liquidity program and CFP are required (12 CFR §741.12).
* **SYSTEM BEHAVIOR:** Enforce a single liquidity standard across \{{SCOPE\}}; align ALCO dashboards and alerts to limits.
* **TRIGGERS (human → event):** “Policy approved/updated” → (policy.approved); “Limit table updated” → (limit.table\_updated).
* **INPUTS (human → field):** Scope statement → (policy.scope); Risk appetite text → (risk.appetite); Limit table → (limit.table).
* **OUTPUTS:** Versioned policy PDF/MD; limit registry JSON.
* **TIMERS/SLAs:** Review **annual**; ad-hoc within 10bd after material changes.
* **EDGE CASES:** BaaS partner launches with novel flow → temporary overlay documented.
* **AUDIT LOGS:** (policy.versioned), (limit.registry\_saved).
* **ACCESS CONTROL:** Owner: CFO; Approvers: CEO, Board.
* **ALERTS/METRICS:** (metric.policy\_past\_due), (metric.limit\_waivers\_open).

***

## LP-02 — Definitions & Ratios Catalogue

* **WHY (Reg cite):** Common definitions ensure consistent measurement/reporting (§741.12).
* **SYSTEM BEHAVIOR:** Central library for LAR, cumulative mismatch, survival horizon, concentration.
* **TRIGGERS:** “Metric added/edited” → (metric.lib\_changed).
* **INPUTS:** Formula → (metric.formula); Data source → (metric.datasource).
* **OUTPUTS:** Markdown table; machine-readable schema.
* **TIMERS/SLAs:** Keep formulas synced with GL mapping **daily**.
* **EDGE CASES:** Data source outage → fallback to prior day with flag.
* **AUDIT LOGS:** (metric.lib\_published).
* **ACCESS CONTROL:** CFO owns; Liquidity Analyst edits; read-only for others.
* **ALERTS/METRICS:** (metric.schema\_drift\_detected).

***

## LP-03 — Maturity Mismatch Limits (Daily/Weekly/Monthly/Annual)

* **WHY (Reg cite):** Governance over cash-flow gaps is core to liquidity safety (§741.12).
* **SYSTEM BEHAVIOR:** Compute cumulative gaps in buckets: O/N, 2–7d, 8–30d, 31–90d, 91–365d, >1y; compare to limits.
* **TRIGGERS:** “EOD gaps posted” → (liquidity.gap\_calculated).
* **INPUTS:** Contractual/behavioral flows → (flow.table); limits → (gap.limits).
* **OUTPUTS:** Gap chart; breach report.
* **TIMERS/SLAs:** Calculate **daily** by 16:00.
* **EDGE CASES:** Large unscheduled payoff → recalc intra-day.
* **AUDIT LOGS:** (gap.calc\_run), (gap.breach\_logged).
* **ACCESS CONTROL:** CFO approves limit changes; ALCO oversight.
* **ALERTS/METRICS:** (alert.gap\_breach), (metric.days\_negative\_gap).

***

## LP-04 — Survival Horizon & Coverage Days

* **WHY (Reg cite):** Ability to meet obligations under stress is required (§741.12).
* **SYSTEM BEHAVIOR:** Model survival days for idiosyncratic and combined stress.
* **TRIGGERS:** “Stress run completed” → (stress.run\_done).
* **INPUTS:** Outflow assumptions → (stress.assumptions); facility headroom → (facility.headroom).
* **OUTPUTS:** Survival-days KPI; waterfall of actions.
* **TIMERS/SLAs:** Quarterly + ad-hoc within 2bd when EWIs spike.
* **EDGE CASES:** Facility operational issue → remove and re-run.
* **AUDIT LOGS:** (stress.pack\_issued).
* **ACCESS CONTROL:** CFO owns models; independent review annually.
* **ALERTS/METRICS:** (alert.survival\_below\_target).

***

## LP-05 — Liquid Assets Ratio (Bands: Watch/Low/Critical)

* **WHY (Reg cite):** Internal thresholds provide early warning and map to CFP (§741.12).
* **SYSTEM BEHAVIOR:** Compute **LAR** and classify: Normal ≥10%; Watch <10%; Low <8%; Critical <6% (policy-set).
* **TRIGGERS:** “Close-of-day balances loaded” → (balances.loaded).
* **INPUTS:** Cash/Fed/corporate CU balances (bal.cash); AFS unencumbered (sec.afs\_free); total assets (bal.assets).
* **OUTPUTS:** Band status; breach/near-miss log.
* **TIMERS/SLAs:** Daily by 16:00; alerts real-time on breach.
* **EDGE CASES:** Late custodian file → provisional LAR with flag.
* **AUDIT LOGS:** (lar.calc\_saved), (lar.band\_changed).
* **ACCESS CONTROL:** Read for ops; write restricted to Liquidity team.
* **ALERTS/METRICS:** (alert.lar\_watch), (alert.lar\_low), (alert.lar\_critical).

***

## LP-06 — Funding Concentration & Counterparty Limits

* **WHY (Reg cite):** Prevent over-reliance on single sources (§741.12).
* **SYSTEM BEHAVIOR:** Track top 10 depositors; single-provider and facility reliance limits.
* **TRIGGERS:** “New deposit ≥ $250k” → (deposit.large\_new).
* **INPUTS:** Depositor exposures (exp.top10); provider shares (exp.provider\_pct).
* **OUTPUTS:** Concentration report; waiver workflow.
* **TIMERS/SLAs:** Update **daily**; waivers within 2bd.
* **EDGE CASES:** Temporarily exceed limit during crisis → document CFP linkage.
* **AUDIT LOGS:** (waiver.requested), (waiver.closed).
* **ACCESS CONTROL:** ALCO approves waivers.
* **ALERTS/METRICS:** (alert.concentration\_exceed).

***

## LP-07 — Stress Testing (Scenarios & Horizons)

* **WHY (Reg cite):** CFP must be supported by credible stress testing (§741.12).
* **SYSTEM BEHAVIOR:** Run idiosyncratic, systemic, combined; include intraday peaks and BaaS shocks.
* **TRIGGERS:** “Quarter opened” → (calendar.q\_open).
* **INPUTS:** Scenarios (stress.scenarios); parameters (stress.params).
* **OUTPUTS:** Pack with survival, gaps, actions.
* **TIMERS/SLAs:** **Quarterly**; re-run within 5bd upon major EWI.
* **EDGE CASES:** Data stale → mark and proceed with conservative overlays.
* **AUDIT LOGS:** (stress.pack\_signed).
* **ACCESS CONTROL:** CFO owner; Independent reviewer sign-off.
* **ALERTS/METRICS:** (metric.stress\_on\_time).

***

## LP-08 — Data Quality & Model Governance

* **WHY (Reg cite):** Reliable inputs and validated methods (§741.12).
* **SYSTEM BEHAVIOR:** Maintain lineage; reconcile to GL; catalog assumptions.
* **TRIGGERS:** “Source mapping changed” → (data.mapping\_changed).
* **INPUTS:** Mapping table (data.map); assumption log (model.assumptions).
* **OUTPUTS:** Validation memo; change log.
* **TIMERS/SLAs:** Annual independent review; GL tie-out **daily**.
* **EDGE CASES:** Partial day outages → flag and annotate KPIs.
* **AUDIT LOGS:** (model.review\_done).
* **ACCESS CONTROL:** Segregation between builders/reviewers.
* **ALERTS/METRICS:** (metric.recon\_breaks).

***

## LP-09 — Reporting Cadence (Ops/ALCO/Board)

* **WHY (Reg cite):** Governance visibility required (§741.12).
* **SYSTEM BEHAVIOR:** Auto-generate daily ops pack; weekly ALCO digest; quarterly Board deck.
* **TRIGGERS:** “EOD data posted” → (report.auto\_run).
* **INPUTS:** KPIs, breaches, actions (report.inputs).
* **OUTPUTS:** PDF/MD packs with sign-offs.
* **TIMERS/SLAs:** Daily 17:00; Weekly Fri 12:00; Quarterly +5bd.
* **EDGE CASES:** Holiday shifts → move to prior business day.
* **AUDIT LOGS:** (report.published).
* **ACCESS CONTROL:** Read to execs; edit Liquidity team.
* **ALERTS/METRICS:** (metric.report\_ontime).

***

## LP-10 — Regulatory Notification Triggers & Protocol

* **WHY (Reg cite):** Material liquidity issues must be escalated to NCUA (§741.12 purpose).
* **SYSTEM BEHAVIOR:** When **CFP Level 2 or 3** activates, or **CLF/Discount Window** used/attempted, or **survival < 15d** (combined) or **LAR < 6%**, prepare and send NCUA memo.
* **TRIGGERS:** “Level changed to 2/3” → (cfp.level\_changed); “Federal facility draw” → (facility.fed\_used).
* **INPUTS:** Event memo (notify.memo); contact list (notify.contacts).
* **OUTPUTS:** Email to examiner/region; incident log entry.
* **TIMERS/SLAs:** **Within 24 hours.**
* **EDGE CASES:** After-hours trigger → notify next calendar day by 10:00 and document.
* **AUDIT LOGS:** (notify.sent), (notify.ack\_received).
* **ACCESS CONTROL:** CEO sender; CFO drafter; Board Chair CC.
* **ALERTS/METRICS:** (metric.notifications\_on\_time).

***

## LP-11 — Contingent Federal Liquidity Access (CLF & Discount Window)

* **WHY (Reg cite):** ≥ $250MM must document access to a federal contingent source (§741.12); CLF statute **12 USC 1795**, Fed advances **12 USC 347b**.
* **SYSTEM BEHAVIOR:** Maintain membership/agent access to **CLF** and operational readiness for **Discount Window**; keep collateral schedules current; conduct annual test (funded or no-funds).
* **TRIGGERS:** “Annual test due” → (facility.test\_due).
* **INPUTS:** Pledge inventory (collateral.inventory); legal docs (facility.docs).
* **OUTPUTS:** Test report; contact sheet; readiness checklist.
* **TIMERS/SLAs:** **Annual** by month-end of anniversary.
* **EDGE CASES:** Counterparty portal outage → phone protocol.
* **AUDIT LOGS:** (facility.test\_complete).
* **ACCESS CONTROL:** CFO controls; Treasury Ops prepares files.
* **ALERTS/METRICS:** (metric.facility\_headroom), (metric.docs\_expiring).

***

## LP-12 — Collateral & Encumbrance Management

* **WHY (Reg cite):** Liquidity depends on pledgeable capacity (§741.12).
* **SYSTEM BEHAVIOR:** Track eligible/unencumbered balances and haircuts by counterparty; optimize pledges.
* **TRIGGERS:** “Security pledged/released” → (collateral.change).
* **INPUTS:** Collateral file (collateral.file); haircuts (collateral.haircut).
* **OUTPUTS:** Headroom dashboard.
* **TIMERS/SLAs:** Update **daily**; re-check T+0 after large moves.
* **EDGE CASES:** Margin call → intraday pledge flow.
* **AUDIT LOGS:** (collateral.state\_saved).
* **ACCESS CONTROL:** Dual control for pledges.
* **ALERTS/METRICS:** (alert.headroom\_low).

***

## LP-13 — Wholesale / Listing-Service Deposits Guardrails

* **WHY (Reg cite):** Manage optionality and rollover risk in non-core funding (§741.12).
* **SYSTEM BEHAVIOR:** Allow approved listing services with tenor laddering; enforce pricing authority; stress runoff assumptions.
* **TRIGGERS:** “New listing CD booked” → (deposit.listing\_new).
* **INPUTS:** Provider master (provider.list); ladder plan (ladder.plan).
* **OUTPUTS:** Exposure report; maturity wall chart.
* **TIMERS/SLAs:** Update **daily**; ALCO monthly.
* **EDGE CASES:** Rate spike → pause new tenors > policy.
* **AUDIT LOGS:** (deposit.provider\_approved).
* **ACCESS CONTROL:** CFO approval required.
* **ALERTS/METRICS:** (alert.listing\_too\_concentrated).

***

## CFP-01 — CFP Purpose & Activation Levels

* **WHY (Reg cite):** Written CFP required; executable under stress (§741.12).
* **SYSTEM BEHAVIOR:** Define activation **Level 1 (Watch)**, **Level 2 (Low)**, **Level 3 (Critical)** tied to [LP-05](liquidity.md#lp-05-liquid-assets-ratio-bands--watchlowcritical).
* **TRIGGERS:** “Band changed” → (lar.band\_changed).
* **INPUTS:** Level thresholds (cfp.thresholds).
* **OUTPUTS:** Activation record; tasking orders.
* **TIMERS/SLAs:** Transition actions started within **2 hours** of Level 2/3.
* **EDGE CASES:** False positive → revert with note.
* **AUDIT LOGS:** (cfp.activated), (cfp.deactivated).
* **ACCESS CONTROL:** CEO authorizes Levels 2–3.
* **ALERTS/METRICS:** (metric.time\_to\_activate).

***

## CFP-02 — Early-Warning Indicators & Event Triggers

* **WHY (Reg cite):** Detect stress early to preserve optionality (§741.12).
* **SYSTEM BEHAVIOR:** Monitor: rapid asset growth via volatile liabilities; undue concentrations; negative press; earnings/asset-quality deterioration; rising funding costs; margin calls; early CD redemptions; correspondent line cuts.
* **TRIGGERS:** “EWI threshold reached” → (ewi.threshold\_hit).
* **INPUTS:** Indicator values (ewi.values); thresholds (ewi.thresholds).
* **OUTPUTS:** EWI dashboard; alerts.
* **TIMERS/SLAs:** Review **daily**; summarize **weekly** to CEO.
* **EDGE CASES:** Rumor-based press → escalate to Comms lead.
* **AUDIT LOGS:** (ewi.alert\_logged).
* **ACCESS CONTROL:** CFO owner; Risk read-only.
* **ALERTS/METRICS:** (alert.ewi\_red).

***

## CFP-03 — Escalation Ladder & Crisis Roles

* **WHY (Reg cite):** Clear decision rights enable timely action (§741.12).
* **SYSTEM BEHAVIOR:** CEO leads external comms; CFO runs liquidity ops; ALCO advises; Board approves extraordinary measures.
* **TRIGGERS:** “Crisis team paged” → (crisis.page\_sent).
* **INPUTS:** Contact matrix (team.roster); delegation file (auth.matrix).
* **OUTPUTS:** Call notes; decision log.
* **TIMERS/SLAs:** Convene within **60 minutes** of Level 2/3.
* **EDGE CASES:** CEO unavailable → designate Acting CEO.
* **AUDIT LOGS:** (crisis.meeting\_started).
* **ACCESS CONTROL:** CEO controls spokesperson list.
* **ALERTS/METRICS:** (metric.escalation\_time).

***

## CFP-04 — Funding Playbooks & Draw Order

* **WHY (Reg cite):** CFP must specify actionable funding sources (§741.12).
* **SYSTEM BEHAVIOR:** See internal and external draw order below.

{% stepper %}
{% step %}
### Internal

* Cash/Fed balances
* Unencumbered AFS (sell/pledge)
* Saleable/participation-ready loans
{% endstep %}

{% step %}
### External

* FHLB (if eligible)
* Fed **Discount Window** (12 USC 347b)
* **CLF** (12 USC 1795)
* Listing-service CDs within [LP-13](liquidity.md#lp-13-wholesale--listing-service-deposits-guardrails)
{% endstep %}
{% endstepper %}

* **TRIGGERS:** “Funding shortfall detected” → (funding.shortfall).
* **INPUTS:** Sources table (funding.sources); haircuts (collateral.haircut).
* **OUTPUTS:** Draw orders; tickets; confirmations.
* **TIMERS/SLAs:** Execute first-line actions within **2 hours** of Level 2.
* **EDGE CASES:** Facility outage → alternate path per contact sheet.
* **AUDIT LOGS:** (funding.draw\_executed).
* **ACCESS CONTROL:** Dual authorization on external draws.
* **ALERTS/METRICS:** (metric.cost\_of\_funds), (metric.draw\_time).

***

## CFP-05 — External Communications & Stakeholder Matrix

* **WHY (Reg cite):** Controlled communication mitigates run risk (§741.12 intent).
* **SYSTEM BEHAVIOR:** CEO is sole spokesperson; use scripted updates to major depositors/partners; PR prepared.
* **TRIGGERS:** “Comms approved” → (comms.approved).
* **INPUTS:** Scripts (comms.script); stakeholder list (stake.list).
* **OUTPUTS:** Sent emails; call logs.
* **TIMERS/SLAs:** Issue within same day for Level 2/3.
* **EDGE CASES:** Media inquiry → approved statement only.
* **AUDIT LOGS:** (comms.sent).
* **ACCESS CONTROL:** Comms team edit; Board view.
* **ALERTS/METRICS:** (metric.comms\_latency).

***

## CFP-06 — Regulator Liaison Protocols

* **WHY (Reg cite):** Maintain timely, accurate updates to NCUA (§741.12).
* **SYSTEM BEHAVIOR:** Maintain examiner/region contacts; event memos; follow-ups; incident log.
* **TRIGGERS:** “Regulator requested update” → (ncua.update\_req).
* **INPUTS:** Memo (ncua.memo); attachments (ncua.attach).
* **OUTPUTS:** Email with receipt; log.
* **TIMERS/SLAs:** Respond within **1bd** unless otherwise directed.
* **EDGE CASES:** Conflicting requests → elevate to CEO/Board Chair.
* **AUDIT LOGS:** (ncua.update\_sent).
* **ACCESS CONTROL:** CEO primary, CFO backup.
* **ALERTS/METRICS:** (metric.ncua\_sla\_met).

***

## CFP-07 — Liquidity Drills & After-Action Reviews

* **WHY (Reg cite):** Demonstrate operability of CFP and federal access (§741.12).
* **SYSTEM BEHAVIOR:** Annual no-funds or funded test of CLF or Discount Window; tabletop exercises; remediation tracking.
* **TRIGGERS:** “Drill scheduled” → (drill.scheduled).
* **INPUTS:** Scenario (drill.scenario); participants (drill.roster).
* **OUTPUTS:** AAR with owners/dates.
* **TIMERS/SLAs:** AAR published within **10bd** of drill.
* **EDGE CASES:** Missed objective → immediate corrective plan.
* **AUDIT LOGS:** (drill.completed), (aar.published).
* **ACCESS CONTROL:** CFO/CEO co-owners.
* **ALERTS/METRICS:** (metric.remediation\_ontrack).

***

## CFP-08 — Documentation & Retention (10 years)

* **WHY (Reg cite):** Evidence of compliance and effectiveness (§741.12).
* **SYSTEM BEHAVIOR:** Retain policies, limits, packs, notifications, facility tests, drills, and AARs **for 10 years**.
* **TRIGGERS:** “Record finalized” → (record.finalized).
* **INPUTS:** Artifact blob (record.blob); metadata (record.meta).
* **OUTPUTS:** Immutable archive; index.
* **TIMERS/SLAs:** Index within 2bd of creation.
* **EDGE CASES:** PII/privileged content → restricted vault.
* **AUDIT LOGS:** (record.archived).
* **ACCESS CONTROL:** Legal hold capable; role-based access.
* **ALERTS/METRICS:** (metric.retention\_gaps).

***

## Embedded Checklists & Templates <a href="#checklists" id="checklists"></a>

* **NCUA Notification Pack:** Event memo template; KPIs; draw confirmations; next-steps grid.
* **Facility Readiness Pack:** Contact sheet; legal docs checklist; collateral file; annual test script.
* **Daily Liquidity Pack:** LAR & band; survival days; cumulative gaps; top depositors; facility headroom.
* **EWI Dashboard:** Indicator list; thresholds; commentary field.
* **Comms Scripts:** Major depositor update; partner message; press holding statement.

***

## Governance & Sign-Off <a href="#governance" id="governance"></a>

* **Owner:** \{{OWNER & APPROVERS\}} (CFO).
* **Approvals:** CEO; Board.
* **Review Cadence:** Annual at minimum; earlier on material changes.
* **Cross-Refs:** Controls link within this document only. No separate documents are required to operate the plan.

***

### Assumptions & Gaps

* Internal **LAR bands (10/8/6%)** and specific gap limits are policy-set to operationalize §741.12 (Assumption—needs Board confirmation).
* Use of **FHLB** is included **if eligible**; not an NCUA mandate (Assumption—confirm eligibility).
* Wholesale/listing-service usage guardrails are internal policy (Assumption—tune to business model).

***
