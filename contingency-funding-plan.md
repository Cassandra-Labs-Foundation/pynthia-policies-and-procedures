# Contingency Funding Plan

\{{ORGANIZATION\}} maintains a **Contingency Funding Plan (CFP)** for \{{SCOPE\}} that satisfies **NCUA** requirements and provides concrete playbooks to **detect stress, escalate, and fund** operations during liquidity events. The CFP integrates with our daily liquidity dashboard to track **liquidity ratios**, run **stress scenarios**, enumerate **liquidity sources and backups**, assign **roles and responsibilities**, and define **monitoring** and **testing** cadences. Statutes/regs are cited via authoritative links; internal sections use fragment-only links.

## Multi-Rule Authority Table <a href="#authority" id="authority"></a>

| Topic                                          | Scope                                                                                                                                                                            | Key Clauses / Notes                                                                                                                                 |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **NCUA Liquidity & CFP Rule**                  | Requires board-approved liquidity policy and written CFP for CUs ≥ $50MM; CUs ≥ $250MM must document access to a **federal** contingent source (CLF and/or Fed Discount Window). | **12 CFR §741.12** — [https://www.ecfr.gov/current/title-12/part-741/section-741.12](https://www.ecfr.gov/current/title-12/part-741/section-741.12) |
| **Central Liquidity Facility (CLF)**           | Federal emergency liquidity for credit unions; membership/agent membership and operations.                                                                                       | **12 U.S.C. §§1795–1795k** — [https://www.law.cornell.edu/uscode/text/12/chapter-14](https://www.law.cornell.edu/uscode/text/12/chapter-14)         |
| **Federal Reserve Advances (Discount Window)** | Authority for Federal Reserve advances to depository institutions (eligible CU access via correspondent arrangements/pledge).                                                    | **12 U.S.C. §347b** — [https://www.law.cornell.edu/uscode/text/12/347b](https://www.law.cornell.edu/uscode/text/12/347b)                            |

***

## Timing Matrix <a href="#timing-matrix" id="timing-matrix"></a>

| Scenario                  | Trigger (human → event)                                                    |           Deadline | Content Reference                   | Control                                                                               |
| ------------------------- | -------------------------------------------------------------------------- | -----------------: | ----------------------------------- | ------------------------------------------------------------------------------------- |
| Activate Level 1 Watch    | “LAR < policy floor or EWIs red” → (lar.watch)                             |     T+0, immediate | Band change notice; monitoring plan | [CFP-04](contingency-funding-plan.md#cfp-04-activation-levels-and-triggers)           |
| Activate Level 2 Low      | “LAR < 8% or survival < 30d idio / < 20d combined” → (lar.low)             |     T+0, immediate | Funding playbook; tasking orders    | [CFP-07](contingency-funding-plan.md#cfp-07-action-plans-and-playbooks)               |
| Activate Level 3 Critical | “Outflow ≥ 40%/10d or imminent payment failure” → (run.critical)           |     T+0, immediate | Emergency draw order                | [CFP-05](contingency-funding-plan.md#cfp-05-funding-sources-catalogue-and-draw-order) |
| Notify NCUA               | “CFP Level 2/3 or federal facility used/attempted” → (ncua.notify\_needed) |       **24 hours** | Event memo to examiner/region       | [CFP-11](contingency-funding-plan.md#cfp-11-ncua-notification-protocol)               |
| Federal readiness test    | “Annual CLF/DW no-funds draw due” → (facility.annual\_test\_due)           |         **Annual** | Test report; contact sheet          | [CFP-10](contingency-funding-plan.md#cfp-10-testing-and-drills)                       |
| Stress scenario refresh   | “Quarter start” → (stress.q\_open)                                         |      **Quarterly** | Updated assumptions; results        | [CFP-09](contingency-funding-plan.md#cfp-09-stress-scenarios-and-survival-horizon)    |
| Major depositor comms     | “Level 2 or outflow ≥ 30%/10d” → (comms.depositor\_notice)                 |           Same day | Approved scripts sent               | [CFP-12](contingency-funding-plan.md#cfp-12-communications-and-stakeholders)          |
| Board updates             | “Level 2/3 active” → (board\_update\_due)                                  | Daily until stable | Daily liquidity pack                | [CFP-02](contingency-funding-plan.md#cfp-02-governance-and-roles)                     |

***

## Control Index <a href="#control-index" id="control-index"></a>

| ID                                                                                    | Control Name                             | Purpose                                                         | Primary Rule(s)                   |
| ------------------------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------- | --------------------------------- |
| [CFP-01](contingency-funding-plan.md#cfp-01-purpose-and-scope)                        | Purpose and Scope                        | Define CFP boundaries and integration with liquidity dashboard. | §741.12                           |
| [CFP-02](contingency-funding-plan.md#cfp-02-governance-and-roles)                     | Governance and Roles                     | Decision rights and responsibilities.                           | §741.12                           |
| [CFP-03](contingency-funding-plan.md#cfp-03-early-warning-indicators-and-monitoring)  | Early Warning Indicators and Monitoring  | Programmatic detection of stress.                               | §741.12                           |
| [CFP-04](contingency-funding-plan.md#cfp-04-activation-levels-and-triggers)           | Activation Levels and Triggers           | Map metrics to Level 1/2/3 activation.                          | §741.12                           |
| [CFP-05](contingency-funding-plan.md#cfp-05-funding-sources-catalogue-and-draw-order) | Funding Sources Catalogue and Draw Order | Enumerate and sequence internal/external sources.               | §741.12; 12 USC 1795; 12 USC 347b |
| [CFP-06](contingency-funding-plan.md#cfp-06-backup-funding-and-collateral-readiness)  | Backup Funding and Collateral Readiness  | Pre-arrange backups; maintain pledge capacity.                  | §741.12; 12 USC 1795; 12 USC 347b |
| [CFP-07](contingency-funding-plan.md#cfp-07-action-plans-and-playbooks)               | Action Plans and Playbooks               | Tasked, time-bound actions when activated.                      | §741.12                           |
| [CFP-08](contingency-funding-plan.md#cfp-08-liquidity-dashboard-and-ratios-interface) | Liquidity Dashboard and Ratios Interface | Spreadsheet/dashboard requirements and data feeds.              | §741.12                           |
| [CFP-09](contingency-funding-plan.md#cfp-09-stress-scenarios-and-survival-horizon)    | Stress Scenarios and Survival Horizon    | Design/refresh of stress tests and survival days.               | §741.12                           |
| [CFP-10](contingency-funding-plan.md#cfp-10-testing-and-drills)                       | Testing and Drills                       | Annual no-funds/funded tests and tabletops.                     | §741.12; 12 USC 1795; 12 USC 347b |
| [CFP-11](contingency-funding-plan.md#cfp-11-ncua-notification-protocol)               | NCUA Notification Protocol               | When/how to notify regulators.                                  | §741.12                           |
| [CFP-12](contingency-funding-plan.md#cfp-12-communications-and-stakeholders)          | Communications and Stakeholders          | External comms controls.                                        | §741.12                           |
| [CFP-13](contingency-funding-plan.md#cfp-13-documentation-and-retention-10-years)     | Documentation and Retention (10 years)   | Evidence retention for exams.                                   | §741.12                           |

***

## CFP-01 — Purpose and Scope

* **WHY (Reg cite):** Written, executable CFP required for insured credit unions (12 CFR §741.12).
* **SYSTEM BEHAVIOR:** CFP spans funding playbooks, roles, monitoring, testing, notification, and comms across \{{SCOPE\}}; integrates with dashboard in [CFP-08](contingency-funding-plan.md#cfp-08-liquidity-dashboard-and-ratios-interface).
* **TRIGGERS (human → event):** “CFP updated/approved” → (cfp.approved).
* **INPUTS (human → field):** Scope statement (cfp.scope); integration endpoints (cfp.integrations).
* **OUTPUTS:** Versioned CFP (MD/PDF).
* **TIMERS/SLAs:** Annual review; ad-hoc within 10bd after material changes.
* **EDGE CASES:** New BaaS partner with novel flows → provisional overlay.
* **AUDIT LOGS:** (cfp.version\_saved).
* **ACCESS CONTROL:** Owner: CFO; Approvers: CEO/Board.
* **ALERTS/METRICS:** (metric.cfp\_past\_due).

***

## CFP-02 — Governance and Roles

* **WHY (Reg cite):** Clear decision rights and escalation enable timely action (§741.12).
* **SYSTEM BEHAVIOR:** CEO chairs crisis team; CFO runs liquidity ops; ALCO advises; Board authorizes extraordinary actions.
* **TRIGGERS:** “Level 2/3 activation” → (cfp.level\_changed).
* **INPUTS:** Roster (team.roster); delegation matrix (auth.matrix).
* **OUTPUTS:** Decision log; tasking orders.
* **TIMERS/SLAs:** Convene within **60 minutes** at Level 2/3.
* **EDGE CASES:** CEO unavailable → Acting CEO per succession matrix.
* **AUDIT LOGS:** (crisis.meeting\_started), (decision.logged).
* **ACCESS CONTROL:** CEO manages spokespersons; dual-auth for external draws.
* **ALERTS/METRICS:** (metric.escalation\_time).

***

## CFP-03 — Early Warning Indicators and Monitoring

* **WHY (Reg cite):** Early detection preserves optionality (§741.12).
* **SYSTEM BEHAVIOR:** Monitor: rapid asset growth from volatile liabilities; undue concentrations; negative press; deterioration in earnings/asset quality; rising funding costs; margin calls; early CD redemptions; line cuts.
* **TRIGGERS:** “Indicator crosses threshold” → (ewi.threshold\_hit).
* **INPUTS:** Indicator values (ewi.values); thresholds (ewi.thresholds).
* **OUTPUTS:** EWI dashboard; daily summary.
* **TIMERS/SLAs:** **Daily** review; **weekly** CEO digest.
* **EDGE CASES:** Rumor spikes → comms prepped via [CFP-12](contingency-funding-plan.md#cfp-12-communications-and-stakeholders).
* **AUDIT LOGS:** (ewi.alert\_logged).
* **ACCESS CONTROL:** CFO owner; Risk read-only.
* **ALERTS/METRICS:** (alert.ewi\_red), (metric.ewi\_ack\_time).

***

## CFP-04 — Activation Levels and Triggers

* **WHY (Reg cite):** CFP must specify clear activation criteria (§741.12).
* **SYSTEM BEHAVIOR:** Map metrics to **Level 1 Watch**, **Level 2 Low**, **Level 3 Critical**. Examples:
  * Level 1: LAR below policy floor (e.g., 10%); EWIs sustained red.
  * Level 2: LAR < 8% **or** survival < 30d idio / < 20d combined.
  * Level 3: LAR < 6% **or** outflow ≥ 40%/10d, imminent payment failure.
* **TRIGGERS:** “Band changed / survival below threshold” → (lar.band\_changed), (survival.below\_target).
* **INPUTS:** Threshold table (cfp.thresholds).
* **OUTPUTS:** Activation record; Level playbook selection.
* **TIMERS/SLAs:** Initiate actions within **2 hours** of Level 2/3.
* **EDGE CASES:** False positives → revert with rationale.
* **AUDIT LOGS:** (cfp.activated), (cfp.deactivated).
* **ACCESS CONTROL:** CEO authorizes Level 2/3.
* **ALERTS/METRICS:** (metric.time\_to\_activate).

***

## CFP-05 — Funding Sources Catalogue and Draw Order

* **WHY (Reg cite):** CFP must enumerate actionable sources (§741.12); CLF (**12 USC 1795**) and Fed advances (**12 USC 347b**) as federal backstops.
* **SYSTEM BEHAVIOR:** Maintain **ordered** sources with capacity, tenor, cost, and draw steps.

Internal sources:

* Cash/Fed & corporate CU balances
* Unencumbered AFS (sell/pledge)
* Saleable/participation-ready loans

External sources:

* FHLB (if eligible)
* **Discount Window**
* **CLF**
* Listing-service time deposits within policy
* **TRIGGERS:** “Shortfall detected” → (funding.shortfall).
* **INPUTS:** Source registry (funding.sources); haircuts (collateral.haircuts); contacts (facility.contacts).
* **OUTPUTS:** Draw orders; confirmations; capacity dashboard.
* **TIMERS/SLAs:** Execute first-line actions within **2 hours** at Level 2.
* **EDGE CASES:** Counterparty outage → alternate path from contact sheet.
* **AUDIT LOGS:** (funding.draw\_executed), (funding.confirmed).
* **ACCESS CONTROL:** Dual authorization for external draws.
* **ALERTS/METRICS:** (metric.cost\_of\_funds), (metric.headroom\_days).

***

## CFP-06 — Backup Funding and Collateral Readiness

* **WHY (Reg cite):** Maintain **contingent** access to federal liquidity (§741.12; 12 USC 1795; 12 USC 347b).
* **SYSTEM BEHAVIOR:** Keep **backup** sources pre-documented: CLF/agent membership; DW borrower-in-custody or pledged collateral; standby listing-service capacity; correspondent fed funds lines (if applicable).
* **TRIGGERS:** “Collateral margin call or eligibility change” → (collateral.margin\_call).
* **INPUTS:** Collateral inventory (collateral.inventory); eligibility file (collateral.eligibility).
* **OUTPUTS:** Updated pledge schedule; readiness attestations.
* **TIMERS/SLAs:** Daily inventory update; monthly readiness check; annual no-funds test.
* **EDGE CASES:** Security in dispute → remove from headroom until cleared.
* **AUDIT LOGS:** (collateral.updated), (readiness.attested).
* **ACCESS CONTROL:** Dual control on pledges/releases.
* **ALERTS/METRICS:** (alert.headroom\_low), (metric.encumbrance\_pct).

***

## CFP-07 — Action Plans and Playbooks

* **WHY (Reg cite):** CFP must be executable, not aspirational (§741.12).
* **SYSTEM BEHAVIOR:** For each Level, attach a **playbook** with owners, steps, and timers:

Level 1 Watch

* Verify data; inventory facilities; test contacts; pre-stage collateral; tighten pricing.

Level 2 Low

* Execute ordered draws; lengthen funding tenor; pause discretionary lending; initiate depositor comms.

Level 3 Critical

* Emergency funding + asset liquidation; hourly liquidity pack; Board continuous updates.
* **TRIGGERS:** “Level changed” → (cfp.level\_changed).
* **INPUTS:** Playbook YAML (playbook.spec); task list (playbook.tasks).
* **OUTPUTS:** Task execution log; completion attestation.
* **TIMERS/SLAs:** First tasks within **2 hours** at Level 2; **immediate** at Level 3.
* **EDGE CASES:** Inability to draw planned facility → branch to backup in [CFP-06](contingency-funding-plan.md#cfp-06-backup-funding-and-collateral-readiness).
* **AUDIT LOGS:** (task.opened), (task.closed).
* **ACCESS CONTROL:** CFO controls tasks; CEO approves deviations.
* **ALERTS/METRICS:** (metric.tasks\_on\_time), (metric.playbook\_drift).

***

## CFP-08 — Liquidity Dashboard and Ratios Interface

* **WHY (Reg cite):** Ratios/monitoring must be programmatic and timely (§741.12 intent).
* **SYSTEM BEHAVIOR:** Spreadsheet/dashboard computes: **LAR**, cumulative **mismatch gaps** (O/N, 2–7d, 8–30d, 31–90d, 91–365d, >1y), **survival horizon**, **top depositor concentrations**, **facility headroom**, and **scenario outflows**.
* **TRIGGERS:** “EOD data posted” → (dashboard.refresh).
* **INPUTS:** GL balances (data.gl); securities file (data.secs); depositor file (data.deps); collateral file (data.collat); facilities (data.facilities); scenario params (stress.params).
* **OUTPUTS:** Daily liquidity pack; breach alerts; Level recommendation.
* **TIMERS/SLAs:** Refresh **daily by 17:00**; intraday refresh on event.
* **EDGE CASES:** Missing custodian file → provisional status with flag.
* **AUDIT LOGS:** (dashboard.run\_saved).
* **ACCESS CONTROL:** Read for execs; write for Liquidity team.
* **ALERTS/METRICS:** (alert.band\_change), (metric.dashboard\_ontime).

***

## CFP-09 — Stress Scenarios and Survival Horizon

* **WHY (Reg cite):** Credible stress testing underpins CFP (§741.12).
* **SYSTEM BEHAVIOR:** Maintain **base**, **idiosyncratic**, **systemic**, and **combined** scenarios; model **intraday** peaks; compute survival days and required actions.
* **TRIGGERS:** “Quarter start” → (stress.q\_open); “Material EWI change” → (stress.ad\_hoc).
* **INPUTS:** Scenario set (stress.set); behavioral outflows (stress.behavioral); facility haircuts (collateral.haircuts).
* **OUTPUTS:** Stress pack with survival horizon and action plan deltas.
* **TIMERS/SLAs:** **Quarterly**; ad-hoc within **5bd** on material change.
* **EDGE CASES:** Facility eligibility reduced → recompute survival immediately.
* **AUDIT LOGS:** (stress.pack\_issued).
* **ACCESS CONTROL:** CFO owner; independent review annually.
* **ALERTS/METRICS:** (alert.survival\_below\_target).

***

## CFP-10 — Testing and Drills

* **WHY (Reg cite):** Demonstrate operability of CFP and federal access (§741.12; 12 USC 1795; 12 USC 347b).
* **SYSTEM BEHAVIOR:** Conduct **annual** no-funds (or funded) test of **CLF** or **Discount Window**; **annual** tabletop crisis drill; remediate gaps.
* **TRIGGERS:** “Annual test due” → (facility.test\_due); “Tabletop scheduled” → (drill.scheduled).
* **INPUTS:** Test script (test.script); participants (test.roster); objectives (test.objectives).
* **OUTPUTS:** Test results; **After-Action Review (AAR)** with owners/dates.
* **TIMERS/SLAs:** Publish AAR within **10bd** of drill/test.
* **EDGE CASES:** Partial failure → immediate corrective plan with deadline.
* **AUDIT LOGS:** (test.completed), (aar.published).
* **ACCESS CONTROL:** CFO/CEO co-owners.
* **ALERTS/METRICS:** (metric.remediation\_ontrack).

***

## CFP-11 — NCUA Notification Protocol

* **WHY (Reg cite):** Material liquidity stress must be escalated (§741.12 purpose).
* **SYSTEM BEHAVIOR:** Notify **examiner-in-charge and regional office** **within 24 hours** when: **Level 2/3 activation**, **use/attempted use of CLF/DW**, **survival < 15d (combined)**, or **LAR < 6%**.
* **TRIGGERS:** “Notify required” → (ncua.notify\_needed).
* **INPUTS:** Event memo (ncua.memo); metrics pack (ncua.metrics); contact list (ncua.contacts).
* **OUTPUTS:** Email/phone confirmation; incident log.
* **TIMERS/SLAs:** **24 hours** from trigger.
* **EDGE CASES:** After-hours trigger → by 10:00 next calendar day; document exception.
* **AUDIT LOGS:** (ncua.sent), (ncua.ack).
* **ACCESS CONTROL:** CEO sender; CFO drafter; Board Chair CC.
* **ALERTS/METRICS:** (metric.notifications\_on\_time).

***

## CFP-12 — Communications and Stakeholders

* **WHY (Reg cite):** Controlled communication mitigates run risk (§741.12 intent).
* **SYSTEM BEHAVIOR:** CEO is sole spokesperson; scripted updates to major depositors/partners; PR-ready statements.
* **TRIGGERS:** “Comms approved” → (comms.approved).
* **INPUTS:** Scripts (comms.script); stakeholder matrix (stake.matrix).
* **OUTPUTS:** Sent notices; call logs.
* **TIMERS/SLAs:** Same-day for Level 2/3.
* **EDGE CASES:** Media inbound → use approved statement only.
* **AUDIT LOGS:** (comms.sent).
* **ACCESS CONTROL:** Comms team edit; Board view.
* **ALERTS/METRICS:** (metric.comms\_latency).

***

## CFP-13 — Documentation and Retention (10 years)

* **WHY (Reg cite):** Evidence of program effectiveness (§741.12).
* **SYSTEM BEHAVIOR:** Retain policy versions, dashboard outputs, stress packs, notifications, facility tests, drills, AARs **for 10 years**.
* **TRIGGERS:** “Artifact finalized” → (record.finalized).
* **INPUTS:** Artifact blob (record.blob); metadata (record.meta).
* **OUTPUTS:** Immutable archive; searchable index.
* **TIMERS/SLAs:** Index within **2bd**.
* **EDGE CASES:** PII/privileged content → restricted vault.
* **AUDIT LOGS:** (record.archived).
* **ACCESS CONTROL:** Role-based access; legal hold capable.
* **ALERTS/METRICS:** (metric.retention\_gaps).

***

## Embedded Checklists & Templates <a href="#checklists" id="checklists"></a>

* **NCUA Notification Pack:** Event memo template; KPIs (LAR, survival, outflow); draw confirmations; next-steps grid.
* **Facility Readiness Pack:** CLF/DW contacts; legal docs checklist; collateral schedule; annual test script.
* **Daily Liquidity Pack:** LAR & band; survival days; cumulative gaps; top depositors; facility headroom.
* **EWI Dashboard:** Thresholds; investigation notes; escalation buttons.
* **Comms Scripts:** Major depositor email; partner note; press holding statement.

***

## Governance & Sign-Off <a href="#governance" id="governance"></a>

* **Owner:** \{{OWNER & APPROVERS\}} (CFO).
* **Approvals:** CEO; Board.
* **Review Cadence:** **Annual**; earlier upon material changes or AAR findings.
* **Cross-Refs:** Dashboard integration in [CFP-08](contingency-funding-plan.md#cfp-08-liquidity-dashboard-and-ratios-interface); funding sources in [CFP-05](contingency-funding-plan.md#cfp-05-funding-sources-catalogue-and-draw-order).

***

### Assumptions & Gaps

* Internal thresholds (e.g., **10/8/6%** LAR bands; survival-day targets) are **policy-set** to operationalize §741.12 and require **Board confirmation**.
* **FHLB** usage appears if eligible (not mandated by NCUA). Confirm district eligibility and collateral programs.
* Dashboard field names/events reflect a minimal viable schema; align to engineering naming in the build.
