# Resolution

> **General Policy Statement** \{{ORGANIZATION\}} maintains a minimal, testable resolution framework to protect member funds and ensure orderly continuity, handover, or wind-down under stress. We monitor leading indicators, can place the institution into controlled “safe mode,” freeze or limit transactions, pivot to trustee/conservator operations, and restore member-facing services by next business day where feasible. This policy aligns with the Federal Credit Union Act (FCUA) and NCUA regulations and integrates with our Business Continuity, Information Security, and BSA/AML controls.

***

## Multi-Rule Authority Table <a href="#authority" id="authority"></a>

| Topic                                                                            | Scope                                                       | Key Clauses / Notes                                                                                                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **FCUA — Authority to appoint conservator/liquidating agent**                    | Triggers and powers for NCUA resolution                     | 12 U.S.C. §1786(h) (Conservatorship/appointment) — [https://www.law.cornell.edu/uscode/text/12/1786](https://www.law.cornell.edu/uscode/text/12/1786) ; 12 U.S.C. §1787 (Conservatorship/Liquidation) — [https://www.law.cornell.edu/uscode/text/12/1787](https://www.law.cornell.edu/uscode/text/12/1787) |
| **NCUA Part 709 — Involuntary Liquidation of FCUs**                              | Claims priorities, setoff, share insurance payout mechanics | 12 CFR Part 709 — [https://www.ecfr.gov/current/title-12/chapter-VII/subchapter-A/part-709](https://www.ecfr.gov/current/title-12/chapter-VII/subchapter-A/part-709)                                                                                                                                       |
| **NCUA Part 748 — Security Program; Catastrophic Act Reporting; BSA Compliance** | Incident response integration; reporting                    | 12 CFR §748.0–§748.3 — [https://www.ecfr.gov/current/title-12/part-748](https://www.ecfr.gov/current/title-12/part-748)                                                                                                                                                                                    |
| **NCUA Part 749 — Records Preservation Program**                                 | Records retention, reproducible records for handover        | 12 CFR Part 749 — [https://www.ecfr.gov/current/title-12/part-749](https://www.ecfr.gov/current/title-12/part-749)                                                                                                                                                                                         |
| **NCUA Part 741 — Requirements for Insurance**                                   | Safety/soundness expectations for insured CUs               | 12 CFR Part 741 — [https://www.ecfr.gov/current/title-12/part-741](https://www.ecfr.gov/current/title-12/part-741)                                                                                                                                                                                         |
| **Share Insurance (NCUA)**                                                       | Member access/coverage during resolution                    | 12 U.S.C. §1781–§1790d (selected); see §1787 for payouts — [https://www.law.cornell.edu/uscode/text/12/1787](https://www.law.cornell.edu/uscode/text/12/1787)                                                                                                                                              |
| **Mergers (contingency)**                                                        | Emergency assisted merger (if applicable)                   | 12 CFR Part 708b — [https://www.ecfr.gov/current/title-12/part-708b](https://www.ecfr.gov/current/title-12/part-708b)                                                                                                                                                                                      |

***

## Timing Matrix <a href="#timing-matrix" id="timing-matrix"></a>

| Scenario                          | Trigger (human → event)                                                     |                               Deadline | Content Reference                                     | Control                                                          |
| --------------------------------- | --------------------------------------------------------------------------- | -------------------------------------: | ----------------------------------------------------- | ---------------------------------------------------------------- |
| Early-Warning Activation          | CRO flags composite risk ≥ High (per risk policy) → `risk.threshold.breach` |                         T+0 (same day) | Risk posture update, member-impact check              | [RZ-01](resolution.md#rz-01-early-warning-indicators)            |
| Safe-Mode Entry                   | CEO/CRO authorize limited operations → `ops.safe_mode.enable`               |                               ≤ 1 hour | Freeze rules, allowlist, limits                       | [RZ-02](resolution.md#rz-02-safe-mode-transaction-controls)      |
| Account Freeze (Targeted)         | Compliance flags entity/account → `cust.freeze.requested`                   |                               ≤ 30 min | Targeted freeze playbook                              | [RZ-03](resolution.md#rz-03-targeted-account-freeze)             |
| Full Freeze (Institution)         | Board emergency vote OR regulator directive → `org.freeze.all`              |                               ≤ 60 min | Broadcast comms + hold new funds                      | [RZ-04](resolution.md#rz-04-institution-wide-freeze)             |
| Trustee/Conservator Handover Prep | NCUA notice received → `reg.ntc.conservatorship`                            |                              ≤ 4 hours | Handover packet build                                 | [RZ-06](resolution.md#rz-06-trusteeconservator-handover)         |
| Next-Business-Day Availability    | After safe-mode or handover                                                 | Next open of business (local timezone) | Member portal read-only; balance inquiry; claims info | [RZ-05](resolution.md#rz-05-next-business-day-availability)      |
| Records Image & Escrow            | Resolution declared → `res.records.package.start`                           |   Start ≤ 2 hours; complete ≤ 24 hours | Part 749 compliant package                            | [RZ-07](resolution.md#rz-07-records-preservation-for-resolution) |
| Testing — Failover Drill          | Scheduled test → `test.failover.start`                                      |                  Semiannual completion | DR/RZ test protocol                                   | [RZ-08](resolution.md#rz-08-testing--validation)                 |
| Review & Board Reporting          | Quarterly review → `gov.review.qtr`                                         |                         End of quarter | Metrics + findings to Board                           | [RZ-09](resolution.md#rz-09-governance--review-cadence)          |

***

## Control Index <a href="#control-index" id="control-index"></a>

| ID                                                               | Control Name                        | Purpose                                                                                       | Primary Rule(s)                              |
| ---------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------- |
| [RZ-00](resolution.md#rz-00-policy-scope)                        | Policy Scope                        | Define what products/channels/partners and systems are in/out of scope for resolution actions | 12 CFR Part 741; 12 CFR §748.0–§748.2        |
| [RZ-01](resolution.md#rz-01-early-warning-indicators)            | Early-Warning Indicators            | Detect trouble early and stage response                                                       | FCUA §1786/§1787; 12 CFR Part 741            |
| [RZ-02](resolution.md#rz-02-safe-mode-transaction-controls)      | Safe-Mode Transaction Controls      | Rapidly limit risk while maintaining access                                                   | 12 CFR Part 748 (security/incident handling) |
| [RZ-03](resolution.md#rz-03-targeted-account-freeze)             | Targeted Account Freeze             | Freeze member/account legally and precisely                                                   | FCUA §1787; Part 748 (program)               |
| [RZ-04](resolution.md#rz-04-institution-wide-freeze)             | Institution-Wide Freeze             | Execute full freeze on directive                                                              | FCUA §1786/§1787                             |
| [RZ-05](resolution.md#rz-05-next-business-day-availability)      | Next-Business-Day Availability      | Keep essentials online for members                                                            | Part 741; member insurance under §1787       |
| [RZ-06](resolution.md#rz-06-trusteeconservator-handover)         | Trustee/Conservator Handover        | Standardize a clean transfer to NCUA trustee                                                  | FCUA §1786(h), §1787; 12 CFR Part 709        |
| [RZ-07](resolution.md#rz-07-records-preservation-for-resolution) | Records Preservation for Resolution | Ensure complete, reproducible records                                                         | 12 CFR Part 749                              |
| [RZ-08](resolution.md#rz-08-testing--validation)                 | Testing & Validation                | Prove the plan works (failover, restore)                                                      | 12 CFR §748.0–§748.2; safety/soundness       |
| [RZ-09](resolution.md#rz-09-governance--review-cadence)          | Governance & Review Cadence         | Set decision rights, escalation, reviews                                                      | FCUA; Part 741; §748.2 program               |

***

## RZ-00 — Policy Scope <a href="#rz-00-policy-scope" id="rz-00-policy-scope"></a>

* **WHY (Reg cite):** Safety-and-soundness requirements expect clear applicability and program boundaries so controls can be executed and tested (12 CFR Part 741; 12 CFR §748.0–§748.2).
* **SYSTEM BEHAVIOR:** Maintain a machine-readable **Scope Registry** enumerating products, channels, vendors, and systems covered by resolution actions; expose scope to control engines so freezes/limits/exports apply deterministically.
* **TRIGGERS (human → event):**
  * Owner updates scope after product/vendor change → `(scope.registry.updated)`
  * New partner onboarded or offboarded → `(vendor.lifecycle.changed)`
  * Quarterly governance review confirms/edits scope → `(gov.review.qtr)`
* **INPUTS (human → field):**
  * Products in scope (deposits, cards, loans, payments) `(scope.products[])`
  * Channels (mobile, web, ATM, ACH, wires, card networks) `(scope.channels[])`
  * Critical vendors (core, card processor, ACH/wire gateways, KYC, cloud) `(scope.vendors[])`
  * Critical systems (core DBs, data warehouse, IAM, logging, comms) `(scope.systems[])`
  * Out-of-scope exceptions with rationale `(scope.exceptions[])`
  * RTO/RPO targets per system `(scope.dr.targets)`
* **OUTPUTS:** Versioned Scope Registry; diffs to [RZ-02](resolution.md#rz-02-safe-mode-transaction-controls), [RZ-04](resolution.md#rz-04-institution-wide-freeze), [RZ-07](resolution.md#rz-07-records-preservation-for-resolution).
* **TIMERS/SLAs:** Update within 5 business days of any material change; publish to control engines within 24 hours of approval.
* **EDGE CASES:** Shadow IT or partner-owned sub-processors—require explicit inclusion or documented exception; joint/fintech programs must specify who executes freezes and exports.
* **AUDIT LOGS:** `scope.version.created`, `scope.diff.approved`, `scope.published`.
* **ACCESS CONTROL:** CRO owns content; Risk Eng maintains schema; changes require dual approval (CRO + CEO or delegate).
* **ALERTS/METRICS:** Scope coverage % (controls mapped to all in-scope systems); age of last scope review; count of open scope exceptions.

***

## RZ-01 — Early-Warning Indicators <a href="#rz-01-early-warning-indicators" id="rz-01-early-warning-indicators"></a>

* **WHY (Reg cite):** Enable timely action ahead of conservatorship/liquidation; safety/soundness expectations (12 CFR Part 741; FCUA §1786/§1787).
* **SYSTEM BEHAVIOR:** Maintain a ruleset that flips the org into **Prepared** or **Elevated** posture when thresholds breach.
* **TRIGGERS (human → event):**
  * CRO approves risk posture change → `(risk.threshold.breach)`
  * ALCO flags liquidity alerts → `(liquidity.lcr.warn)`
  * Compliance flags unusual outflows → `(aml.flow.spike)`
* **INPUTS (human → field):**
  * Liquidity coverage ratio (rolling 30-day) `(metric.lcr30)`
  * Net outflow % (24h/72h) `(metric.net_outflow)`
  * Capital ratio vs PCA triggers `(metric.net_worth_ratio)`
  * Payment return/failure rate `(metric.pay.fail_rate)`
  * CAMELS trend (internal proxy) `(metric.camels_proxy)`
* **OUTPUTS:** Posture banner to Ops Console; pre-stage [RZ-02](resolution.md#rz-02-safe-mode-transaction-controls) parameters.
* **TIMERS/SLAs:** Evaluate indicators hourly during business hours; daily after hours.
* **EDGE CASES:** False positives damped via two-consecutive-interval rule.
* **AUDIT LOGS:** `risk.posture.changed`, `alert.issued.risk_threshold`.
* **ACCESS CONTROL:** CRO, Risk Engineering can edit thresholds; read-only for Ops.
* **ALERTS/METRICS:** Pager alert for posture “Elevated”; dashboard of breaches per week.

***

## RZ-02 — Safe-Mode Transaction Controls <a href="#rz-02-safe-mode-transaction-controls" id="rz-02-safe-mode-transaction-controls"></a>

* **WHY (Reg cite):** Reduce run/operational risk while maintaining member access; integrates with security program (12 CFR Part 748).
* **SYSTEM BEHAVIOR:** Toggle **Safe-Mode** feature flag: set transaction limits, enable allowlists, disable new high-risk actions, preserve read-only access.
* **TRIGGERS (human → event):**
  * CEO/CRO authorizes safe-mode → `(ops.safe_mode.enable)`
  * Regulator advisory received → `(reg.advisory.received)`
* **INPUTS (human → field):**
  * Daily outbound transfer cap `(cfg.outbound.cap.daily)`
  * Per-transaction max `(cfg.outbound.cap.tx)`
  * Channel allowlist (ATM/ACH/Card/Online) `(cfg.channel.allow)`
  * New account onboarding toggle `(cfg.onboarding.enabled)`
  * Card controls (auth codes allowed) `(cfg.card.mcc.allow)`
* **OUTPUTS:** Enforced limits at core, card processor, ACH gateway; member UI banner.
* **TIMERS/SLAs:** Apply within ≤ 60 minutes of trigger; propagate to all processors ≤ 30 minutes after core change.
* **EDGE CASES:** Ensure critical inbound credits (e.g., payroll, benefits) remain open (allowlist).
* **AUDIT LOGS:** `mode.safe.enable`, `limit.changed`, `channel.updated`.
* **ACCESS CONTROL:** Dual-control (CEO/CRO) to enable; Ops executes propagation.
* **ALERTS/METRICS:** Monitor decline rates, member contact volume, cash levels.

***

## RZ-03 — Targeted Account Freeze <a href="#rz-03-targeted-account-freeze" id="rz-03-targeted-account-freeze"></a>

* **WHY (Reg cite):** Preserve assets and comply with directives; resolution context under FCUA §1787; integrated with §748 program.
* **SYSTEM BEHAVIOR:** Freeze specified member accounts/entities; block debits; allow regulator-approved credits; display freeze reason codes.
* **TRIGGERS (human → event):**
  * Compliance freeze request approved → `(cust.freeze.requested)`
  * Court/regulator order received → `(order.freeze.received)`
* **INPUTS (human → field):**
  * Member/entity ID `(cust.id)`
  * Freeze scope (all sub-accounts vs specific) `(freeze.scope)`
  * Reason code `(freeze.reason.code)`
  * Exception allowlist `(freeze.allow.inbound)`
* **OUTPUTS:** Debit blocks across core, ACH, card; UI messaging on holds.
* **TIMERS/SLAs:** ≤ 30 minutes from approval to effective block.
* **EDGE CASES:** Joint accounts; fiduciary accounts; legal garnishments take precedence.
* **AUDIT LOGS:** `freeze.applied`, `freeze.exception.added`, `freeze.removed`.
* **ACCESS CONTROL:** Compliance initiates; Ops executes; Legal reviews orders.
* **ALERTS/METRICS:** Count of frozen accounts; median time-to-freeze.

***

## RZ-04 — Institution-Wide Freeze <a href="#rz-04-institution-wide-freeze" id="rz-04-institution-wide-freeze"></a>

* **WHY (Reg cite):** Execute immediate, organization-level freeze when directed by Board emergency action or NCUA (FCUA §1786/§1787).
* **SYSTEM BEHAVIOR:** Set global state **FROZEN**; block new liabilities; allow limited inbound credits per regulator guidance; lock new account onboarding.
* **TRIGGERS (human → event):**
  * Board emergency resolution → `(board.freeze.resolution)`
  * NCUA directive received → `(reg.freeze.directive)`
* **INPUTS (human → field):**
  * Freeze policy profile `(cfg.freeze.profile)`
  * Member communications template ID `(comm.template.freeze)`
  * ATM/cash policy during freeze `(cfg.atm.policy)`
* **OUTPUTS:** Org-wide debit blocks; public/member notices; regulator confirmation.
* **TIMERS/SLAs:** Initiate ≤ 60 minutes; public/member notice ≤ 2 hours.
* **EDGE CASES:** Offline channels (ATM) sync; third-party batch cutoffs.
* **AUDIT LOGS:** `org.freeze.enabled`, `notice.sent.member`, `reg.notice.ack`.
* **ACCESS CONTROL:** Board/CEO authorize; Ops executes; Communications sends.
* **ALERTS/METRICS:** Time to full propagation; number of failed auths by channel.

***

## RZ-05 — Next-Business-Day Availability <a href="#rz-05-next-business-day-availability" id="rz-05-next-business-day-availability"></a>

* **WHY (Reg cite):** Maintain essential member access and information during stress; insured member expectations under §1787; safety/soundness (Part 741).
* **SYSTEM BEHAVIOR:** By next business day, ensure member portal/API supports: balance inquiry, statement download, claim instructions, and contact routes; enable read-only mode if needed.
* **TRIGGERS (human → event):**
  * Post-freeze readiness check → `(ops.readiness.confirmed)`
  * Conservator readiness signal → `(trustee.ops.window.set)`
* **INPUTS (human → field):**
  * Read-only toggle `(cfg.portal.readonly)`
  * Claims information block `(content.claims.info)`
  * IVR/phone routing plan `(tele.route.plan)`
* **OUTPUTS:** Live portal in read-only; call center scripts; public FAQ.
* **TIMERS/SLAs:** Portal available by next local business open.
* **EDGE CASES:** DNS/hosting cutovers; CDN cache; ADA accessibility baseline.
* **AUDIT LOGS:** `portal.state.readonly`, `content.published.claims`.
* **ACCESS CONTROL:** IT/DevOps controls platform; Comms publishes content.
* **ALERTS/METRICS:** Uptime; page latency; call abandonment rate.

***

## RZ-06 — Trustee/Conservator Handover <a href="#rz-06-trusteeconservator-handover" id="rz-06-trusteeconservator-handover"></a>

* **WHY (Reg cite):** Enable orderly transfer of operations to NCUA-appointed conservator/liquidating agent (FCUA §1786(h), §1787; 12 CFR Part 709).
* **SYSTEM BEHAVIOR:** Generate and deliver a standardized **Handover Packet** and grant scoped access to systems.
* **TRIGGERS (human → event):**
  * NCUA appointment notice received → `(reg.ntc.conservatorship)`
  * Trustee arrival scheduled → `(trustee.arrival.scheduled)`
* **INPUTS (human → field):**
  * Trustee contact and credentials `(trustee.contact)`
  * Access role profile `(iam.role.trustee)`
  * Data package manifest `(data.manifest.rz)`
* **OUTPUTS:** Handover Packet (see **Checklists**); read-only admin accounts; data escrow links.
* **TIMERS/SLAs:** Packet initial version ≤ 4 hours; full delivery ≤ 24 hours.
* **EDGE CASES:** Conflicting legal holds; vendor refusals—escalate to Legal + NCUA.
* **AUDIT LOGS:** `trustee.account.provisioned`, `packet.delivered`, `escrow.link.shared`.
* **ACCESS CONTROL:** CEO/GC approve; IAM provisions; vendors whitelisted.
* **ALERTS/METRICS:** Time to first successful trustee login; missing artifact count.

***

## RZ-07 — Records Preservation for Resolution <a href="#rz-07-records-preservation-for-resolution" id="rz-07-records-preservation-for-resolution"></a>

* **WHY (Reg cite):** Preserve and produce reproducible records per Part 749; support claims and payout under Part 709/§1787.
* **SYSTEM BEHAVIOR:** Build a **Resolution Records Package** with member/share/loan ledgers, ACH/card histories, GL, governance minutes, contracts, and BSA logs.
* **TRIGGERS (human → event):**
  * Resolution declared → `(res.records.package.start)`
  * Periodic snapshot (monthly) → `(res.records.snapshot.monthly)`
* **INPUTS (human → field):**
  * Data sources list `(records.source.list)`
  * Retention policy map `(records.retention.map)`
  * Export format (CSV/JSON/PDF-A) `(records.format)`
* **OUTPUTS:** Signed checksums; encrypted archives; manifest; retrieval instructions.
* **TIMERS/SLAs:** Start ≤ 2 hours; complete ≤ 24 hours; monthly snapshots retained.
* **EDGE CASES:** Incomplete vendor exports—document and request extension via NCUA.
* **AUDIT LOGS:** `records.export.started|completed`, `checksum.verified`.
* **ACCESS CONTROL:** Records Officer owns; IT executes; Legal verifies.
* **ALERTS/METRICS:** Export completeness %; restore-test success/failure.

***

## RZ-08 — Testing & Validation <a href="#rz-08-testing--validation" id="rz-08-testing--validation"></a>

* **WHY (Reg cite):** Part 748 requires a security/incident program; safety/soundness demands demonstrable continuity and response.
* **SYSTEM BEHAVIOR:** Run a structured test program covering safe-mode, freeze propagation, failover, and records restoration.
* **TRIGGERS (human → event):**
  * Semiannual failover drill → `(test.failover.start)`
  * Quarterly restore test → `(test.restore.start)`
  * Annual trustee tabletop with NCUA observer (when feasible) → `(test.tabletop.start)`
* **INPUTS (human → field):**
  * Test plan ID `(test.plan.id)`
  * Success criteria `(test.accept.criteria)`
  * Data sample list `(test.data.sample)`
* **OUTPUTS:** Test reports; defect tickets; remediation plan tied to owners/dates.
* **TIMERS/SLAs:** Publish report ≤ 10 business days post-test; remediate high-risk items ≤ 30 days.
* **EDGE CASES:** Production freeze during business hours—simulate off-peak.
* **AUDIT LOGS:** `test.case.passed|failed`, `issue.created`, `fix.deployed`.
* **ACCESS CONTROL:** CRO owns; IT/Compliance participate; Board Risk Committee reviews.
* **ALERTS/METRICS:** RTO/RPO met %; propagation time p95; restore success rate.

***

## RZ-09 — Governance & Review Cadence <a href="#rz-09-governance--review-cadence" id="rz-09-governance--review-cadence"></a>

* **WHY (Reg cite):** Clarify decision rights and oversight (FCUA; 12 CFR Part 741; §748.2).
* **SYSTEM BEHAVIOR:** Maintain a RACI for resolution actions; ensure quarterly reviews and immediate updates after material events.
* **TRIGGERS (human → event):**
  * Quarter end → `(gov.review.qtr)`
  * Material change (vendor/core) → `(gov.change.material)`
* **INPUTS (human → field):**
  * RACI matrix `(gov.raci)`
  * Exception register `(gov.exceptions)`
  * Training completion `(hr.training.rz)`
* **OUTPUTS:** Board report; updated policy; training assignments.
* **TIMERS/SLAs:** Qtr review by day 20; policy update ≤ 30 days from change.
* **EDGE CASES:** Conflicts with vendor SLAs—log exception and mitigation.
* **AUDIT LOGS:** `board.report.submitted`, `policy.updated`, `training.completed`.
* **ACCESS CONTROL:** Board approves; CRO owns; Internal Audit tests.
* **ALERTS/METRICS:** Open action items; aging exceptions; training compliance %.

***

## Embedded Checklists & Templates <a href="#checklists" id="checklists"></a>

* **Safe-Mode Playbook Pack:** parameter sheet; channel allowlist; processor propagation checklist; comms snippets.
* **Targeted Freeze Pack:** legal order intake form; freeze reason codes; exception allowlist form; member message templates.
* **Institution-Wide Freeze Pack:** Board emergency resolution template; regulator notice ack script; member/public notice FAQ.
* **Trustee/Conservator Handover Packet:** contacts; IAM role profiles; vendor list + contracts; credentials escrow procedure; systems topology; runbooks; data manifests; recent Board minutes.
* **Records Package Manifest (Part 749):** ledgers, statements, transaction histories, GL, loan files, BSA/SAR logs, audit trails; checksum/signing instructions.
* **Testing Protocols:** semiannual failover plan; quarterly restore test script; annual tabletop scenario deck and scoring rubric.
* **Governance Artifacts:** RACI; exception register; quarterly Board report template; training roster.

***

## Governance & Sign-Off <a href="#governance" id="governance"></a>

* **Owner:** \{{Chief Risk Officer\}}.
* **Approvals:** Board, CEO, BSA/AML Officer.
* **Related Policies:** Business Continuity/DR, Information Security, BSA/AML, Vendor Management.
* **Review Cadence:** Quarterly operational review ([RZ-09](resolution.md#rz-09-governance--review-cadence)); annual Board re-approval or upon material change (e.g., core/vendor switch).
* **Training:** Role-based annual training; new-hire onboarding within 30 days; tabletop participants trained before exercises (12 CFR §748.2).

***

### Assumptions & Gaps (to confirm)

* **Scope:** Applies to all products/channels/partners in \{{SCOPE\}}; finalized via [RZ-00](resolution.md#rz-00-policy-scope). (Assumption—needs confirmation: enumerate processors and cores.)
* **Next-Business-Day definition:** Local timezone; excludes federal holidays. (Confirm.)
* **Trustee tabletop with NCUA observer:** Aspirational; subject to regulator availability.
* **Liquidity/Capital thresholds:** Use existing Risk Policy metrics; confirm exact LCR/PCA triggers and CAMELS proxies.
* **Member communications:** Templates exist and meet ADA basics; confirm accessibility review process.
