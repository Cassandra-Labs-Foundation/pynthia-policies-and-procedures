# Customer Due Diligence

> **General Policy Statement** \{{ORGANIZATION\}} maintains a risk-based CDD program that meets 12 CFR §748.2 (NCUA) and FinCEN’s CDD/CIP rules under 31 CFR Parts 1010 and 1020. We understand the nature and purpose of member relationships, establish and update risk profiles, identify and verify customers (including beneficial owners of legal entities), screen against sanctions and adverse media, monitor activity, escalate higher-risk cases to ECDD, oversee third parties, and retain records per regulation. Scope includes all products, channels (including non-face-to-face), and BaaS/program-manager flows. Supervisory expectations are aligned to the **FFIEC BSA/AML Manual** and **Interagency Third-Party Risk Management guidance**. (See the **Authority Table** below.)

***

## Multi-Rule Authority Table <a href="#authority" id="authority"></a>

| Topic                                                       | Scope                                                    | Key Clauses / Notes                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **NCUA Safety & Soundness / BSA Program**                   | Federally insured credit unions                          | **12 CFR §748.2** (written BSA program; board approval); **Appendix B to Part 748** (member notice guidance); **§748.1(c)** (72-hour cyber incident notification). [12 CFR §748.2](https://www.ecfr.gov/current/title-12/part-748#p-748.2) · [Appendix B](https://www.ecfr.gov/current/title-12/part-748/appendix-Appendix%20B%20to%20Part%20748) · [§748.1(c)](https://www.ecfr.gov/current/title-12/part-748#p-748.1%28c%29) |
| **FinCEN AML Program (Banks)**                              | Bank AML framework                                       | **31 CFR §1020.210** (risk-based AML program + ongoing CDD). [31 CFR §1020.210](https://www.ecfr.gov/current/title-31/part-1020#p-1020.210)                                                                                                                                                                                                                                                                                    |
| **CIP (Identity Verification)**                             | All customers                                            | **31 CFR §1020.220** (CIP: identifying information; documentary/non-documentary verification; recordkeeping). [31 CFR §1020.220](https://www.ecfr.gov/current/title-31/part-1020#p-1020.220)                                                                                                                                                                                                                                   |
| **CDD/Beneficial Ownership**                                | Legal-entity customers                                   | **31 CFR §1010.230** (beneficial owner(s) ≥25% + one control person; collection & verification). [31 CFR §1010.230](https://www.ecfr.gov/current/title-31/part-1010#p-1010.230)                                                                                                                                                                                                                                                |
| **SAR Timing (for reference)**                              | Suspicious activity filing                               | **31 CFR §1020.320** (30 days from initial detection; 60 days if no suspect identified). [31 CFR §1020.320](https://www.ecfr.gov/current/title-31/part-1020#p-1020.320)                                                                                                                                                                                                                                                        |
| **FFIEC BSA/AML Manual (Supervisory Guidance)**             | Risk-based CDD program expectations                      | CDD objectives (nature/purpose, risk profiles, ongoing monitoring), risk rating, non-face-to-face, high-risk categories, management reporting, independent testing, training. _(Guidance—used to shape controls and examinations.)_                                                                                                                                                                                            |
| **Interagency Third-Party Risk Management (TPRM) Guidance** | Life-cycle oversight of vendors/fintech/program managers | Principles for planning, due diligence, contracting, ongoing monitoring, and termination. Roles/responsibilities and board reporting. _(Guidance—applied to CD-10 oversight controls.)_                                                                                                                                                                                                                                        |

> **Linking note:** Statutes/regs above link to eCFR as authoritative sources. FFIEC/Interagency items are supervisory guidance (no statutory links required here).

***

## Timing Matrix <a href="#timing-matrix" id="timing-matrix"></a>

| Scenario                               | Trigger (human → event)                                 |                                   Deadline | Content Reference                         | Control                                                                          |
| -------------------------------------- | ------------------------------------------------------- | -----------------------------------------: | ----------------------------------------- | -------------------------------------------------------------------------------- |
| Complete CIP before account opening    | Onboarding submits app → `application.submitted`        |                     Before account opening | CIP verification results saved            | [CD-04](customer-due-diligence.md#cd-04-cip--identity-verification)              |
| Collect & verify BO for legal entities | Business onboarding → `business.application.submitted`  |                     Before account opening | BO KYC/KYB dossier                        | [CD-05](customer-due-diligence.md#cd-05-beneficial-ownership-legal-entities)     |
| Initial risk profile set               | KYC complete → `kyc.passed`                             |                           At decision time | Member risk profile (MRP)                 | [CD-03](customer-due-diligence.md#cd-03-member-risk-profiling-nature--purpose)   |
| ECDD escalation on trigger             | High-risk signal → `risk.trigger.ecdd`                  |                          Same business day | ECDD checklist executed                   | [CD-07](customer-due-diligence.md#cd-07-enhanced-cdd-triggers--actions)          |
| Hold on screening hit                  | Match surfaced → `sanctions.hit`                        |     Immediate hold; resolve before proceed | Hit resolution memo                       | [CD-06](customer-due-diligence.md#cd-06-sanctions--adverse-media-screening)      |
| Periodic refresh                       | Scheduler → `profile.refresh_due`                       |                  \{{Review\_Frequencies\}} | Refresh pack filed                        | [CD-09](customer-due-diligence.md#cd-09-ongoing-monitoring--reviews)             |
| Reportable cyber incident              | Vendor or internal notice → `incident.reportable_found` | ≤ **72 hours** of reasonable belief/notice | NCUA notice + member notice (if required) | [CD-11](customer-due-diligence.md#cd-11-incident--breach-reporting-ncua-72-hour) |
| SAR (if warranted)                     | Investigator identifies suspicion → `case.sar_required` |                 30 days (60 if no suspect) | SAR workpaper & filing                    | [CD-09](customer-due-diligence.md#cd-09-ongoing-monitoring--reviews)             |

***

## Control Index <a href="#control-index" id="control-index"></a>

| ID                                                                               | Control Name                               | Purpose                                    | Primary Rule(s)                  |
| -------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------ | -------------------------------- |
| [CD-01](customer-due-diligence.md#cd-01-governance--ownership)                   | Governance & Ownership                     | Accountability, reporting, board oversight | 12 CFR §748.2 · FFIEC            |
| [CD-02](customer-due-diligence.md#cd-02-scope--applicability)                    | Scope & Applicability                      | Define covered products/channels/partners  | 12 CFR §748.2                    |
| [CD-03](customer-due-diligence.md#cd-03-member-risk-profiling-nature--purpose)   | Member Risk Profiling (Nature & Purpose)   | Establish/maintain member risk profiles    | 31 CFR §1020.210 · FFIEC         |
| [CD-04](customer-due-diligence.md#cd-04-cip--identity-verification)              | CIP & Identity Verification                | Identify & verify customers                | 31 CFR §1020.220 · FFIEC         |
| [CD-05](customer-due-diligence.md#cd-05-beneficial-ownership-legal-entities)     | Beneficial Ownership (Legal Entities)      | Collect & verify BO data                   | 31 CFR §1010.230                 |
| [CD-06](customer-due-diligence.md#cd-06-sanctions--adverse-media-screening)      | Sanctions & Adverse Media Screening        | Block, review, and clear matches           | 31 CFR §1020.210 · FFIEC         |
| [CD-07](customer-due-diligence.md#cd-07-enhanced-cdd-triggers--actions)          | ECDD Triggers & Actions                    | Escalate and deepen due diligence          | 31 CFR §1020.210 · FFIEC         |
| [CD-08](customer-due-diligence.md#cd-08-rejection--exit-thresholds)              | Rejection & Exit Thresholds                | Apply risk-based limits and exits          | 12 CFR §748.2 · FFIEC            |
| [CD-09](customer-due-diligence.md#cd-09-ongoing-monitoring--reviews)             | Ongoing Monitoring & Reviews               | Detect deviations; refresh profiles        | 31 CFR §1020.210 · FFIEC         |
| [CD-10](customer-due-diligence.md#cd-10-vendor--program-manager-oversight)       | Vendor & Program-Manager Oversight         | Life-cycle TPRM; retained accountability   | 12 CFR §748.2 · Interagency TPRM |
| [CD-11](customer-due-diligence.md#cd-11-incident--breach-reporting-ncua-72-hour) | Incident & Breach Reporting (NCUA 72-Hour) | Notify NCUA; member notice if required     | 12 CFR §748.1(c), Appendix B     |
| [CD-12](customer-due-diligence.md#cd-12-recordkeeping--retention)                | Recordkeeping & Retention                  | Preserve evidence & retrievability         | 31 CFR §1020.220; §1010.230      |

***

## Control Overlays (Design Overlay v2)

### CD-01 — Governance & Ownership <a href="#cd-01-governance--ownership" id="cd-01-governance--ownership"></a>

* **WHY (Reg cite):** Board-approved BSA/AML program; designated BSA Officer; internal controls, independent testing, training. **12 CFR §748.2**. FFIEC Manual informs examiner expectations for CDD governance and reporting.
* **SYSTEM BEHAVIOR:** Maintain policy artifact; require annual board approval; produce quarterly CDD metrics aligned to FFIEC themes (alerts, SARs, ECDD coverage, model/change controls); route escalations to Management Risk Committee and Board Risk Committee.
* **TRIGGERS (human → event):** Board approves policy → `governance.policy_approved`; Metric pack submitted → `reporting.cdd_pack_submitted`.
* **INPUTS (human → field):** Risk appetite summary → `(policy.risk_appetite = {{Risk_Appetite_Summary}})`; Approver roster → `(governance.approvers)`.
* **OUTPUTS:** Board minutes; quarterly CDD dashboard; exception register.
* **TIMERS/SLAs:** Annual policy review; quarterly metrics due by **+15 days** after quarter-end.
* **EDGE CASES:** Interim updates for regulatory or FFIEC manual changes (out-of-cycle board ratification).
* **AUDIT LOGS:** `policy.version.published`, `reporting.quarterly_sent`.
* **ACCESS CONTROL:** Only BSA Officer may publish; Board/Examiners read.
* **ALERTS/METRICS:** Policy age; open issues past due; % actions closed on time.

### CD-02 — Scope & Applicability <a href="#cd-02-scope--applicability" id="cd-02-scope--applicability"></a>

* **WHY (Reg cite):** BSA program must cover all lines and delivery channels. **12 CFR §748.2**.
* **SYSTEM BEHAVIOR:** Enforce CDD gates on all onboarding APIs (first-party and \{{Program\_Manager\_1\}}/\{{Program\_Manager\_2\}}) before account open; include non-face-to-face per FFIEC risk factors.
* **TRIGGERS:** New product/channel onboarded → `product.change.introduced`.
* **INPUTS:** Product list `(catalog.products[])`; Channel list `(catalog.channels[])`; Partner list `(partners.program_managers[])`.
* **OUTPUTS:** Coverage map.
* **TIMERS/SLAs:** 30-day pre-launch CDD sign-off window.
* **EDGE CASES:** Pilot/limited release still requires gates.
* **AUDIT LOGS:** `coverage.map.updated`.
* **ACCESS CONTROL:** Product owners propose; Compliance approves.
* **ALERTS/METRICS:** % launches with CDD sign-off.

### CD-03 — Member Risk Profiling (Nature & Purpose) <a href="#cd-03-member-risk-profiling-nature--purpose" id="cd-03-member-risk-profiling-nature--purpose"></a>

* **WHY (Reg cite):** Understand nature/purpose; establish risk profiles; ongoing CDD. **31 CFR §1020.210**. FFIEC Manual outlines factors for risk rating and documentation quality.
* **SYSTEM BEHAVIOR:** Capture expected activity; assign initial risk score; store rationale; support refresh.
* **TRIGGERS:** App submitted → `application.submitted`; KYC passed → `kyc.passed`.
* **INPUTS:** Occupation/NAICS `(member.naics)`, geography `(member.country_state)`, funding source `(member.funding_source)`, expected volumes `(member.expected_txn_volume)`, industry flags `(member.industry in {{High_Risk_Industries_List}})`.
* **OUTPUTS:** Member Risk Profile (MRP) with score and factors.
* **TIMERS/SLAs:** MRP must exist **before** decision.
* **EDGE CASES:** Thin-file; non-resident; PEP indicator.
* **AUDIT LOGS:** `mrp.created`, `mrp.updated`.
* **ACCESS CONTROL:** Read: Investigations/Compliance; Edit: Onboarding Ops/Compliance.
* **ALERTS/METRICS:** % files with complete MRP; risk score distribution.

### CD-04 — CIP & Identity Verification <a href="#cd-04-cip--identity-verification" id="cd-04-cip--identity-verification"></a>

* **WHY (Reg cite):** Identify & verify customers; recordkeeping. **31 CFR §1020.220**. FFIEC Manual provides examiner expectations for documentary vs non-documentary methods and risk-based variation.
* **SYSTEM BEHAVIOR:** Orchestrate KYC via \{{Primary\_KYC\_Vendor\_Name\}} with fallback to \{{Secondary\_Data\_Providers\}}; apply documentary/non-documentary methods; block open until pass.
* **TRIGGERS:** Identity check started → `kyc.started`; vendor response → `kyc.vendor_result`.
* **INPUTS:** Name `(member.name)`, DOB `(member.dob)`, SSN/ITIN `(member.tin)`, address `(member.address)`, device/IP `(telemetry.ip_device)`.
* **OUTPUTS:** KYC proof file; pass/conditional/deny decision; reasons.
* **TIMERS/SLAs:** Complete **before** account opening.
* **EDGE CASES:** Mismatches; fraud signals; manual review path with dual control.
* **AUDIT LOGS:** `kyc.pass`, `kyc.fail`, `kyc.manual_review`.
* **ACCESS CONTROL:** Only trained reviewers may override vendor outcomes.
* **ALERTS/METRICS:** False-positive/negative rates; manual review rate; aging queue.

### CD-05 — Beneficial Ownership (Legal Entities) <a href="#cd-05-beneficial-ownership-legal-entities" id="cd-05-beneficial-ownership-legal-entities"></a>

* **WHY (Reg cite):** Collect & verify BO (≥25% owners + one control). **31 CFR §1010.230**.
* **SYSTEM BEHAVIOR:** Require BO form; validate IDs of BOs; store control person data; reconcile to KYB.
* **TRIGGERS:** Business app submitted → `business.application.submitted`; BO form signed → `bo.form_submitted`.
* **INPUTS:** BO list `(entity.bo_list[])`, control person `(entity.control_person)`, ownership % `(entity.bo_pct)`.
* **OUTPUTS:** BO record; verification artifacts.
* **TIMERS/SLAs:** Complete **before** business account opening; refresh on ownership change event.
* **EDGE CASES:** Trusts; layered entities; exemptions (document rationale).
* **AUDIT LOGS:** `bo.collected`, `bo.verified`, `bo.change_detected`.
* **ACCESS CONTROL:** BO data restricted (need-to-know).
* **ALERTS/METRICS:** % BO verified; exception count.

### CD-06 — Sanctions & Adverse Media Screening <a href="#cd-06-sanctions--adverse-media-screening" id="cd-06-sanctions--adverse-media-screening"></a>

* **WHY (Reg cite):** Risk-based screening is an AML control. **31 CFR §1020.210**. FFIEC Manual covers sanctions screening expectations and ongoing monitoring ties.
* **SYSTEM BEHAVIOR:** Screen applicants and ongoing members via \{{Sanctions\_List\_Provider\}} and \{{Adverse\_Media\_Provider\}}; auto-hold on potential match; adjudication workflow.
* **TRIGGERS:** New record → `screen.new_subject`; list update → `screen.list_updated`; adverse media alert → `adverse.media.alert`.
* **INPUTS:** Personal/Business identifiers `(screen.subject_identifiers)`; list datasets `(screen.lists = {{Sanctions_List_Provider}})`.
* **OUTPUTS:** Clear/confirm decision; hit memo; escalation to ECDD if warranted.
* **TIMERS/SLAs:** Potential match held immediately; adjudicate within **1 business day**.
* **EDGE CASES:** Common-name matches; transliteration; fuzzy logic collisions.
* **AUDIT LOGS:** `screen.hit`, `screen.cleared`, `screen.confirmed`.
* **ACCESS CONTROL:** Only Sanctions Analysts adjudicate.
* **ALERTS/METRICS:** Hit rate; average time to disposition; % confirmed.

### CD-07 — Enhanced CDD (ECDD) Triggers & Actions <a href="#cd-07-enhanced-cdd-triggers--actions" id="cd-07-enhanced-cdd-triggers--actions"></a>

* **WHY (Reg cite):** Higher-risk relationships require ECDD. **31 CFR §1020.210**. FFIEC outlines risk factors (products, services, geographies, customers) and documentation standards.
* **SYSTEM BEHAVIOR:** On trigger, generate ECDD checklist; require senior approval; increase monitoring cadence.
* **TRIGGERS:** High-risk industry `(member.industry in {{High_Risk_Industries_List}})` → `risk.trigger.industry`; PEP → `risk.trigger.pep`; high geography risk → `risk.trigger.geo`; adverse media confirmed → `risk.trigger.adverse`; anomalous activity → `risk.trigger.behavior`; sanctions proximity → `risk.trigger.sanctions_near`; revenue/volume spike beyond threshold `(txn.rolling_30d > {{Hard_Threshold}})` → `risk.trigger.volume`.
* **INPUTS:** Source of funds `(ecdd.sof)`, source of wealth `(ecdd.sow)`, beneficial owner validation `(ecdd.bo_recheck)`, additional docs `(ecdd.docs[])`.
* **OUTPUTS:** ECDD file; keep/limit/exit recommendation.
* **TIMERS/SLAs:** Open ECDD within **1 business day** of trigger; complete within **5 business days** or document extension.
* **EDGE CASES:** False positives from vendor models—require human rationale.
* **AUDIT LOGS:** `ecdd.opened`, `ecdd.approved`, `ecdd.declined`.
* **ACCESS CONTROL:** Senior Compliance approves; dual control on exits.
* **ALERTS/METRICS:** % ECDD timely; keep/exit ratios.

### CD-08 — Rejection & Exit Thresholds <a href="#cd-08-rejection--exit-thresholds" id="cd-08-rejection--exit-thresholds"></a>

* **WHY (Reg cite):** Maintain safe and sound operations. **12 CFR §748.2**. FFIEC provides examples of risk indicators supporting deny/exit decisions.
* **SYSTEM BEHAVIOR:** Enforce configurable thresholds aligned to \{{Risk\_Appetite\_Summary\}}; block onboarding or trigger exit.
* **TRIGGERS:** Identity unresolved after attempts → `decision.deny.kyc`; confirmed sanctions → `decision.deny.sdn`; persistent ECDD deficiencies → `decision.exit.ecdd`; fraud patterns → `decision.exit.fraud`.
* **INPUTS:** Threshold config `(limits.hard = {{Hard_Threshold}})`; reason codes `(decision.reason_code)`.
* **OUTPUTS:** Decline/exit letter templates; internal memo with rationale.
* **TIMERS/SLAs:** Decision within **2 business days** of final facts.
* **EDGE CASES:** Critical customer impact—offer controlled wind-down.
* **AUDIT LOGS:** `decision.decline`, `decision.exit`.
* **ACCESS CONTROL:** Two-person approval for exits (Compliance + Business).
* **ALERTS/METRICS:** Decline rate by reason; exit count; appeals.

### CD-09 — Ongoing Monitoring & Reviews <a href="#cd-09-ongoing-monitoring--reviews" id="cd-09-ongoing-monitoring--reviews"></a>

* **WHY (Reg cite):** Ongoing monitoring & updates to risk profiles. **31 CFR §1020.210**. FFIEC Manual details alert handling, case documentation, SAR decisions, and periodic reviews.
* **SYSTEM BEHAVIOR:** Compare observed activity to MRP; surface anomalies; schedule refresh per \{{Review\_Frequencies\}}; integrate case management and SAR workflow.
* **TRIGGERS:** Deviation detected → `monitor.alert.anomaly`; refresh due → `profile.refresh_due`; ownership change → `bo.change_detected`.
* **INPUTS:** Transaction telemetry `(txn.stream)`, risk score `(mrp.score)`, alerts `(monitor.alerts[])`.
* **OUTPUTS:** Case record; MRP updates; SAR decision path and filing if needed.
* **TIMERS/SLAs:** Alert triage within **1 business day**; periodic refresh per risk tier (e.g., high 12m / med 24m / low 36m—confirm in \{{Review\_Frequencies\}}).
* **EDGE CASES:** Seasonality; one-off spikes; partner-driven campaigns.
* **AUDIT LOGS:** `case.opened`, `case.closed`, `sar.filed`.
* **ACCESS CONTROL:** Investigations role required.
* **ALERTS/METRICS:** Alert-to-SAR conversion; refresh compliance %; case aging.

### CD-10 — Vendor & Program-Manager Oversight <a href="#cd-10-vendor--program-manager-oversight" id="cd-10-vendor--program-manager-oversight"></a>

* **WHY (Reg cite):** CU retains accountability for outsourced BSA functions. **12 CFR §748.2**. Interagency TPRM guidance defines life-cycle controls (plan, diligence, contract, monitor, terminate) and board oversight; apply to \{{Primary\_KYC\_Vendor\_Name\}}, \{{Secondary\_Data\_Providers\}}, \{{Program\_Manager\_1\}}, \{{Program\_Manager\_2\}}.
* **SYSTEM BEHAVIOR:** Maintain live register; track SLAs/KPIs; enforce audit/exam rights; require incident-notice terms compatible with **§748.1(c)** 72-hour rule; document model governance for vendor decisioning (inputs, thresholds, backtesting/drift).
* **TRIGGERS:** New/changed vendor → `tp.update.lifecycle`; SLA miss → `tp.sla.breach`.
* **INPUTS:** Due diligence pack `(tp.dd_pack)`, contract clauses `(tp.contract_terms)`, KPI feed `(tp.kpis)`.
* **OUTPUTS:** Quarterly vendor scorecards; annual comprehensive review reports; corrective-action plans.
* **TIMERS/SLAs:** KPI review quarterly; comprehensive review annually (min).
* **EDGE CASES:** Sub-processor changes; model drift at vendor—trigger re-validation; cross-border data transfers.
* **AUDIT LOGS:** `tp.review.qtr`, `tp.review.annual`, `tp.issue.opened`.
* **ACCESS CONTROL:** Vendor Mgmt edits; Compliance/Board reads.
* **ALERTS/METRICS:** SLA adherence %; issue backlog; model drift indicators.

### CD-11 — Incident & Breach Reporting (NCUA 72-Hour) <a href="#cd-11-incident--breach-reporting-ncua-72-hour" id="cd-11-incident--breach-reporting-ncua-72-hour"></a>

* **WHY (Reg cite):** Cyber incident notification to NCUA; member notice guidance. **12 CFR §748.1(c)**; **Appendix B to Part 748**.
* **SYSTEM BEHAVIOR:** Classify incidents; start 72-hour clock on reasonable belief or third-party notice; prepare NCUA notice; assess member notification under Appendix B; coordinate with SAR decision path.
* **TRIGGERS:** Reportable incident detected → `incident.reportable_found`; vendor notice received → `incident.vendor_notice`.
* **INPUTS:** Incident facts `(ir.facts)`, affected data `(ir.data_types)`, systems `(ir.systems)`, vendor details `(ir.vendor)`.
* **OUTPUTS:** NCUA notice; member notice (if required); post-incident review (PIR).
* **TIMERS/SLAs:** Notify NCUA **≤72 hours**; PIR within **30 days** of containment.
* **EDGE CASES:** Overlapping jurisdictions; law-enforcement hold on member notices—document.
* **AUDIT LOGS:** `ncua.notice.sent`, `member.notice.sent`, `pir.completed`.
* **ACCESS CONTROL:** CISO & Compliance control external comms.
* **ALERTS/METRICS:** Time-to-notify; incidents by severity; PIR action closure.

### CD-12 — Recordkeeping & Retention <a href="#cd-12-recordkeeping--retention" id="cd-12-recordkeeping--retention"></a>

* **WHY (Reg cite):** CIP recordkeeping; BO retention; retrievability. **31 CFR §1020.220**; **§1010.230**. FFIEC Manual informs examiner expectations for documentation completeness and retrievability.
* **SYSTEM BEHAVIOR:** Store KYC/BO evidence in immutable, searchable storage; index to member ID; support examiner export.
* **TRIGGERS:** Account open/close → `account.opened` / `account.closed`; document upload → `docs.added`.
* **INPUTS:** CIP docs `(docs.cip[])`, BO docs `(docs.bo[])`, decisions `(decision.codes)`.
* **OUTPUTS:** Evidence pack per member/business.
* **TIMERS/SLAs:** Retain per rule (e.g., identity verification records generally **5 years after account closure**; confirm detailed schedules with Counsel).
* **EDGE CASES:** Data subject access requests; litigation holds override normal purge.
* **AUDIT LOGS:** `retention.timer.set`, `retention.purge.executed`.
* **ACCESS CONTROL:** Role-based; encryption at rest/in transit.
* **ALERTS/METRICS:** Retrieval success rate; stale files without index.

***

## Embedded Checklists & Templates <a href="#checklists" id="checklists"></a>

* **ECDD Trigger→Action Matrix (pack):** trigger, extra info required, verification method, approval, refresh cadence (align to FFIEC factors).
* **Rejection/Exit Decision Tree (pack):** sanctions hit; unresolved identity; unmitigated high risk; suspicious behavior → decline/conditional/exit letters (rationale recorded to FFIEC documentation standards).
* **Third-Party Oversight Checklist (Appendix C):** planning; due diligence; contracting (SLAs, audit rights, security, incident notice aligned to **§748.1(c)**); ongoing monitoring; termination (mapped to Interagency TPRM principles).
* **CDD Refresh Pack:** data points to reconfirm; BO re-check; adverse media rescan; risk score recompute (FFIEC expectations).
* **Templates:** hit-resolution memo; ECDD memo; decline/exit letters; NCUA 72-hour notice outline; PIR worksheet.

***

## Governance & Sign-Off <a href="#governance" id="governance"></a>

* **Owner:** \{{BSA/AML Officer, Title\}}
* **Approvals:** \{{OWNER & APPROVERS\}}
* **Review Cadence:** Annual board approval; interim updates upon regulatory or FFIEC/Interagency guidance change.
* **Reporting:** Quarterly CDD metrics to Management and Board Risk Committees, incorporating FFIEC exam themes.
* **Cross-Refs:** Information Security Program; BSA/AML Program; OFAC/Sanctions SOP; Vendor Management Standard (Interagency TPRM-aligned); Incident Response Plan.

***

## Appendix C — Third-Party Register & Review Calendar (Template)

* **Register Fields:** Name; role (KYC/KYB/PM); data sources; decision rights; SLAs/KPIs; sub-processors; security certifications; incident-notice terms; contacts.
* **Seed Entries (to be populated):**
  * **KYC/KYB:** \{{Primary\_KYC\_Vendor\_Name\}}; backups: \{{Secondary\_Data\_Providers\}}.
  * **Program Managers:** \{{Program\_Manager\_1\}}, \{{Program\_Manager\_2\}}.
  * **Lists/Media:** Sanctions via \{{Sanctions\_List\_Provider\}}; adverse media via \{{Adverse\_Media\_Provider\}}.
* **Calendar:**
  * **Quarterly:** KPI review; drift checks; issue remediation updates (per Interagency TPRM).
  * **Annual:** Comprehensive review; model validation summary; contract test for 72-hour notice alignment.
  * **Ad-hoc:** After material incident, sub-processor change, or SLA breach.

***

## Assumptions & Gaps

* **Scope Placeholder:** Treated as enterprise-wide across all products/channels, including BaaS via program managers; refine when \{{SCOPE\}} is finalized.
* **Risk Appetite & Frequencies:** \{{Risk\_Appetite\_Summary\}}, \{{Review\_Frequencies\}}, \{{Hard\_Threshold\}}, and \{{High\_Risk\_Industries\_List\}} are placeholders pending Board approval.
* **Vendors/Providers:** \{{Primary\_KYC\_Vendor\_Name\}}, \{{Secondary\_Data\_Providers\}}, \{{Program\_Manager\_1\}}, \{{Program\_Manager\_2\}}, \{{Sanctions\_List\_Provider\}}, \{{Adverse\_Media\_Provider\}} to be confirmed; contract clauses must explicitly support **12 CFR §748.1(c)** timing.
* **Design Notes:** Event/field codes provided as defaults; align with engineering taxonomy during implementation.
* **Legal Note:** eCFR links are provided for statutes/regs. FFIEC and Interagency items referenced as supervisory guidance (no external links required here).

***
