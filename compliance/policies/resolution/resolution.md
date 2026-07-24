```yaml
---
title: Resolution Policy (Table-First, Design-Overlay v3)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2025-07-01
next_review: 2026-07-01
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Resolution, Safe-Mode, Conservatorship, NCUA, Part-741, Part-748, Part-749, Part-709, FCUA]
---
```

## General Policy Statement

Pynthia Credit Union maintains a minimal, testable resolution framework to protect member funds and ensure orderly continuity, handover, or wind-down under stress. The institution monitors leading indicators of deterioration, can place itself into a controlled "safe mode" that throttles outflows while preserving critical inbound credits, can freeze individual accounts or the entire institution on regulatory directive, and can hand a clean, reproducible operating environment to an NCUA-appointed conservator or liquidating agent. Member-facing read access is restored by the next local business open following any freeze or handover where feasible. This policy applies to all products, channels, partners, and systems enumerated in the scope registry and integrates with the Business Continuity, Information Security, and BSA/AML programs. Governance is centralized with the Chief Compliance Officer; the Board, CEO, Risk Engineering, IT/DevOps, Communications, and BSA/AML Officer are required participants; Internal Audit tests effectiveness.

---

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Scope registry material change | Change detected → `scope_registry.change.detected` | 5 BD to update; 24 h to publish | Products, channels, vendors, systems, RTO/RPO | [RS-01](#rs-01-policy-scope-registry) |
| EWI threshold breach (2-interval confirmed) | Consecutive breach → `ewi.threshold.breached` (×2) | Next evaluation cycle (≤1 h business hours; ≤24 h after hours) | Posture shift to Prepared or Elevated | [RS-02](#rs-02-early-warning-indicators) |
| Safe-mode trigger | EWI posture escalation → `safe_mode.triggered` | Applied within 60 min; propagated to processors within 30 min of core change | Daily/per-tx caps, channel allowlist, onboarding block | [RS-03](#rs-03-safe-mode-transaction-controls) |
| Targeted account freeze approved | Compliance/legal approval → `account_freeze.approved` | Applied within 30 min | Debit block, regulator-approved credits, garnishment precedence | [RS-04](#rs-04-targeted-account-freeze) |
| Institution-wide freeze ordered | Board resolution or NCUA directive → `institution_freeze.ordered` | FROZEN state within 60 min; public/member notice within 2 h; regulator confirmation same day | Global transaction halt | [RS-05](#rs-05-institution-wide-freeze) |
| Freeze or handover — member portal | Freeze/handover event | Next local business open | Balance inquiry, statement download, claims instructions, contact routing | [RS-06](#rs-06-next-business-day-member-availability) |
| NCUA conservator/liquidating agent appointed | Appointment notice received → `handover.appointment.received` | Initial packet within 4 h; full delivery within 24 h | Standardized handover packet + scoped trustee access | [RS-07](#rs-07-trustee-conservator-handover) |
| Resolution records package — start | Freeze or appointment → `records_package.build.started` | Start within 2 h; complete within 24 h | Member/share/loan ledgers, ACH/card, GL, governance, contracts, BSA logs | [RS-08](#rs-08-records-preservation-for-resolution) |
| Monthly snapshot | Calendar schedule | Monthly | Encrypted archive with signed checksums | [RS-08](#rs-08-records-preservation-for-resolution) |
| Semiannual failover drill | Calendar schedule → `resolution_test.scheduled` | Report within 10 BD post-test; high-risk remediation within 30 days | Drill AAR, findings, remediation plan | [RS-09](#rs-09-testing-and-validation) |
| Quarterly restore test | Calendar schedule | Report within 10 BD post-test | Restore verification results | [RS-09](#rs-09-testing-and-validation) |
| Annual trustee tabletop | Calendar schedule | Report within 10 BD post-test | Tabletop scenario results | [RS-09](#rs-09-testing-and-validation) |
| Quarterly operational review | Quarter close | By day 20 of following month | RACI, exception register, posture review | [RS-10](#rs-10-governance-and-review-cadence) |
| Policy material change | Change identified → `resolution_policy.updated` | Within 30 days | Updated policy version | [RS-10](#rs-10-governance-and-review-cadence) |

---

## RS-01 — Policy Scope Registry {#rs-01-policy-scope-registry}

**WHY (Reg cite):** [12 CFR Part 741](https://www.ecfr.gov/current/title-12/part-741) (safety-and-soundness requirements for insured credit unions) and [12 CFR §§748.0–748.2](https://www.ecfr.gov/current/title-12/part-748) (security program and related requirements) require insured credit unions to maintain documented, current inventories of critical systems and controls. A machine-readable scope registry ensures that freeze logic, outflow caps, and export routines apply deterministically to every in-scope product, channel, vendor, and system.

**SYSTEM BEHAVIOR:** The scope registry is a versioned, machine-readable artifact enumerating all in-scope products, channels, critical vendors, and critical systems, each tagged with RTO and RPO targets. Any material change (new product, channel, vendor, or system; change to RTO/RPO; decommission) must be reflected in the registry within 5 business days of the change event and published to all control engines within 24 hours of approval. The registry version ID is the authoritative reference for freeze, limit, and export logic; control engines reject stale version references. Write access to the registry is restricted to Risk Engineering with CCO approval; read access is granted to all control engines and Internal Audit.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Material change to products, channels, vendors, or systems detected (`scope_registry.change.detected`) | Change description (`scope_registry.change_description`), affected item with RTO/RPO (`scope_registry.item.rto`, `scope_registry.item.rpo`), approver identity (`scope_registry.approver_id`) | Updated registry entry + `scope_registry.entry.updated` | 5 BD (enforced by `scope_registry.update_due_at`) |
| Registry update approved (`scope_registry.version.approved`) | Approved version ID (`scope_registry.version_id`), approver identity (`scope_registry.approver_id`) | Published registry version + `scope_registry.published` | 24 h of approval (enforced by `scope_registry.publish_due_at`) |
| Periodic attestation cycle opens | Current registry version (`scope_registry.version_id`), attestation due date (`scope_registry.attestation_due`) | Signed attestation record + `scope_registry.attested` | Per attestation schedule |

**ALERTS/METRICS:** Alert if `scope_registry.publish_due_at` is breached (registry approved but not published within 24 h). Alert if any control engine references a registry version older than the current approved version. Target: zero stale-version references in production at any point in time.

---

## RS-02 — Early-Warning Indicators {#rs-02-early-warning-indicators}

**WHY (Reg cite):** [12 USC §§1786–1787](https://www.law.cornell.edu/uscode/text/12/1786) (Federal Credit Union Act — supervisory powers and liquidation) and [12 CFR Part 741](https://www.ecfr.gov/current/title-12/part-741) require insured credit unions to operate in a safe and sound manner and to respond promptly to deteriorating conditions. A calibrated early-warning ruleset enables the institution to detect stress before it becomes a regulatory event and to shift posture in a controlled, documented manner.

**SYSTEM BEHAVIOR:** The EWI engine maintains a ruleset of threshold-based indicators covering liquidity ratios, net outflow rates, capital/PCA proxies, payment-failure rates, and CAMELS-proxy metrics. The engine evaluates all indicators hourly during business hours and once daily after hours. A posture shift (Normal → Prepared, Prepared → Elevated, or any step-down) is triggered only after two consecutive evaluation intervals confirm the breach — the two-consecutive-interval damping rule prevents false positives from transient spikes. When a posture shift is confirmed, the engine emits `resolution_posture.changed` and notifies the CCO and CEO. Step-down from Elevated or Prepared requires two consecutive intervals of threshold recovery. The EWI ruleset and threshold values are write-restricted to Risk Engineering with CCO sign-off; threshold history is immutable once written. Pre-resolution liquidity triggers and PCA capital tiers that drive when resolution planning activates are governed by the Liquidity Policy and Capitalization Policy respectively and are out of scope here.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Scheduled EWI sweep completes (`ewi.sweep.completed`) | All indicator values (`ewi.value`), threshold definitions (`ewi.thresholds`), prior breach state (`ewi.prior_breach_state`), evaluation schedule (`ewi.evaluation_schedule`) | Sweep result record + `ewi.sweep.completed`; if second consecutive breach: `ewi.threshold.breached` | Hourly (business hours); daily (after hours) — enforced by `ewi.sweep_due_at` |
| Second consecutive breach confirmed → posture shift (`ewi.threshold.breached`) | Indicator ID (`ewi.indicator_id`), breach value (`ewi.value`), prior posture (`resolution_posture.current`), two-interval confirmation flag | Posture change record + `resolution_posture.changed`; CEO/CCO notification | Within next evaluation cycle |
| Threshold recovery confirmed (two consecutive intervals) | Indicator ID (`ewi.indicator_id`), recovered value (`ewi.value`), threshold recovered flag (`ewi.threshold_recovered`) | Posture step-down record + `resolution_posture.changed` | Within next evaluation cycle |
| Weekly EWI summary due (`ewi.ceo_summary.sent`) | Trend data (`ewi.trend`), history (`ewi.history`), current posture (`resolution_posture.current`) | CEO summary report + `ewi.ceo_summary.sent` | Weekly — enforced by `ewi.summary_due_at` |

**ALERTS/METRICS:** Alert if any EWI sweep is missed (gap > 65 minutes during business hours; gap > 25 hours after hours). Alert if posture is Elevated for more than 48 hours without a Board notification on record. Target: zero missed sweeps; posture transitions logged within 5 minutes of confirmation.

---

## RS-03 — Safe-Mode Transaction Controls {#rs-03-safe-mode-transaction-controls}

**WHY (Reg cite):** [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) (security program requirements) and [12 USC §1786](https://www.law.cornell.edu/uscode/text/12/1786) (supervisory authority) support the institution's obligation to protect member assets and maintain operational integrity under stress. Safe-mode controls throttle outbound flows and restrict new onboarding while preserving critical inbound credits, reducing the risk of asset dissipation before regulatory intervention.

**SYSTEM BEHAVIOR:** Safe mode is a binary flag on the core system that, when activated, simultaneously sets: (a) daily aggregate outbound caps per the active cap profile, (b) per-transaction outbound limits, (c) a channel allowlist restricting outbound-capable channels to those enumerated in the scope registry, and (d) a new-account/new-product onboarding block. Read-only access (balance inquiry, statement view, claims routing) is preserved for all members regardless of safe-mode state. Critical inbound credits — payroll ACH, government benefits, and other credits designated in the cap profile — are explicitly exempted from all outbound caps and pass through without restriction. Safe mode must be applied to the core system within 60 minutes of the triggering posture event and propagated to all downstream processors within 30 minutes of the core change. Deactivation requires explicit CCO authorization and is logged as a separate event. The safe-mode flag and cap profile are write-restricted to Risk Engineering with CCO approval; processor propagation status is monitored by IT/DevOps.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| EWI posture reaches Elevated (or manual CCO trigger) → safe mode triggered (`safe_mode.triggered`) | Trigger basis (`safe_mode.trigger_basis`), cap profile ID (`safe_mode.cap_profile_id`), current posture (`resolution_posture.current`) | Safe-mode flag set on core + `safe_mode.activated` | 60 min of trigger (enforced by `safe_mode.activation_due_at`) |
| Core safe-mode flag set (`safe_mode.activated`) | Cap profile ID (`safe_mode.cap_profile_id`), processor list from scope registry (`scope_registry.version_id`) | Propagation task issued to all processors + `safe_mode.processor.confirmed` (per processor) | 30 min of core change (enforced by `safe_mode.propagation_due_at`) |
| Outbound transaction evaluated under safe mode (`safe_mode.transaction.decided`) | Transaction amount (`transaction.amount`), transaction type (`transaction.type`), daily outflow total (`safe_mode.daily_outflow_total`), cap profile limits | Decision record (allow/block) + `safe_mode.transaction.decided` | Real-time (synchronous) |
| CCO authorizes safe-mode deactivation (`safe_mode.deactivation.authorized`) | CCO identity, authorization basis, current posture (`resolution_posture.current`) | Deactivation record + `safe_mode.deactivated` | Immediate upon authorization |

**ALERTS/METRICS:** Alert if any processor has not confirmed propagation within 35 minutes of core activation. Alert if daily outflow total (`safe_mode.daily_outflow_total`) approaches 90% of the cap profile limit. Alert if a critical inbound credit is incorrectly blocked (target: zero). Target: 100% processor propagation confirmation within 30 minutes.

---

## RS-04 — Targeted Account Freeze {#rs-04-targeted-account-freeze}

**WHY (Reg cite):** [12 USC §1787](https://www.law.cornell.edu/uscode/text/12/1787) (FCUA — liquidating agent powers, including authority over member accounts) and [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) authorize the institution to restrict account activity on regulatory or legal direction. Targeted freezes protect specific member funds or comply with legal process without triggering institution-wide controls.

**SYSTEM BEHAVIOR:** A targeted account freeze blocks all debit transactions on the specified account(s) or entity(ies) while allowing regulator-approved credits to post. The freeze is applied within 30 minutes of documented approval (internal Compliance/legal sign-off or receipt of a legal order). The system checks for and honors legal garnishment precedence: if a valid garnishment order predates the freeze order, the garnishment is processed before the freeze is applied to remaining funds. Joint accounts are frozen at the account level; fiduciary accounts (trust, estate, POA) require a separate legal review before freeze application, and the freeze record notes the fiduciary relationship. The freeze order reference and legal process reference are stored immutably on the `account_freeze` record. Release requires a separate documented approval. Write access to freeze records is restricted to Compliance and Legal; read access is available to Internal Audit and the CCO.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Freeze approved by Compliance/Legal or legal order received (`account_freeze.approved`) | Account/entity IDs, order reference (`account_freeze.order_reference`), legal process reference (`account_freeze.legal_process_reference`), approver identity | Freeze applied to account(s) + `account_freeze.applied` | 30 min of approval (enforced by `account_freeze.application_due_at`) |
| Regulator-approved credit presented to frozen account (`account_freeze.credit.presented`) | Credit amount, originator, regulatory approval reference | Credit posted to account + `account_freeze.credit.posted` | Real-time |
| Legal conflict detected (garnishment or competing order) (`account_freeze.legal_conflict.detected`) | Conflicting order reference, garnishment details, account balance | Precedence resolution record + `account_freeze.precedence.resolved`; Legal notified | Immediate; freeze held pending resolution |
| Freeze release approved (`account_freeze.release.approved`) | Release reference (`account_freeze.release_reference`), approver identity | Freeze lifted + `account_freeze.released` | Immediate upon approval |

**ALERTS/METRICS:** Alert if `account_freeze.application_due_at` is breached (freeze not applied within 30 minutes of approval). Alert if any debit transaction posts to a frozen account (target: zero). Monitor count of open targeted freezes daily; escalate to CCO if any freeze is unresolved for more than 30 days without documented extension.

---

## RS-05 — Institution-Wide Freeze {#rs-05-institution-wide-freeze}

**WHY (Reg cite):** [12 USC §§1786–1787](https://www.law.cornell.edu/uscode/text/12/1787) (FCUA — NCUA supervisory and liquidation powers) authorize NCUA to direct an insured credit union to cease operations or to appoint a conservator/liquidating agent. The institution must be able to execute a global FROZEN state rapidly and reliably on Board emergency resolution or NCUA directive, and must notify members and confirm to the regulator within prescribed windows.

**SYSTEM BEHAVIOR:** An institution-wide freeze sets a global FROZEN state on the core system, halting all outbound and new-account transactions across every product, channel, and processor enumerated in the scope registry. The FROZEN state is distinct from safe mode: it is absolute and does not preserve outbound transaction capability. Read-only member access (balance inquiry, statement download, claims routing) is preserved per RS-06. The freeze is triggered by a Board emergency resolution (documented in board minutes with a resolution ID) or a written NCUA directive. The FROZEN state must be active within 60 minutes of the triggering document. Public and member notice must be issued within 2 hours of activation. Confirmation to NCUA must be sent the same business day. The institution-wide freeze record stores the order reference and activation evidence immutably. Only the Board (via resolution) or NCUA (via directive) can authorize activation; the CCO coordinates execution. Deactivation requires NCUA written authorization.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Board emergency resolution passed or NCUA directive received → freeze ordered (`institution_freeze.ordered`) | Order reference (`institution_freeze.order_reference`), authorizing body (Board resolution ID or NCUA directive reference), CCO acknowledgment | FROZEN state set on core + `institution_freeze.activated`; activation evidence logged (`institution_freeze.activation_evidence`) | 60 min of triggering document (enforced by `institution_freeze.activation_due_at`) |
| FROZEN state activated (`institution_freeze.activated`) | Notice template ID (`institution_freeze.notice_template_id`), member contact list from scope registry | Public/member notice issued + `institution_freeze.notice.published`; notice record stored (`institution_freeze.notice_record`) | 2 h of activation (enforced by `institution_freeze.notice_due_at`) |
| Notice issued (`institution_freeze.notice.published`) | NCUA contact from regulator registry, notice record reference | Regulator confirmation sent + `institution_freeze.regulator.confirmed` | Same business day |
| In-flight transactions at time of freeze | Transaction IDs, amounts, counterparties | In-flight reconciliation record + `institution_freeze.inflight.reconciled`; settled or returned per processor rules + `institution_freeze.inflight.settled` | Within 24 h of freeze activation |

**ALERTS/METRICS:** Alert if FROZEN state is not confirmed active within 65 minutes of the triggering document. Alert if member notice is not issued within 2 hours and 5 minutes of activation. Alert if regulator confirmation is not sent by end of the same business day. Target: zero missed deadlines on any institution-wide freeze event.

---

## RS-06 — Next-Business-Day Member Availability {#rs-06-next-business-day-member-availability}

**WHY (Reg cite):** [12 CFR Part 741](https://www.ecfr.gov/current/title-12/part-741) (safety-and-soundness) and [12 USC §1787](https://www.law.cornell.edu/uscode/text/12/1787) (share insurance payout mechanics and member access during resolution) require that members retain access to information about their insured funds and can initiate claims. Maintaining read-only portal availability by the next business open minimizes member harm and supports orderly resolution.

**SYSTEM BEHAVIOR:** Following any institution-wide freeze, targeted freeze affecting a significant portion of accounts, or conservator/liquidating agent handover, the member portal and API must support the following in read-only mode by the next local business open: (a) balance inquiry, (b) statement download (up to 24 months), (c) claims instructions (linked to the active claims template), and (d) contact routing to the CCO or conservator communications team. If the core system is unavailable, the portal serves a cached snapshot of balances and statements as of the freeze timestamp. The portal's read-only mode is activated automatically on `institution_freeze.activated` or `handover.appointment.received` and requires explicit CCO authorization to deactivate. Write access to the claims template and contact routing configuration is restricted to Compliance and Communications.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Institution-wide freeze activated or handover appointment received (`institution_freeze.activated` or `handover.appointment.received`) | Freeze/handover timestamp, claims template ID (`member_portal.claims_template_id`), core availability status (`member_portal.core_unavailable`) | Read-only mode activated + `member_portal.readonly.activated`; snapshot served if core unavailable (`member_portal.snapshot_served`) | By next local business open (enforced by `member_portal.readonly_due_at`) |
| Member accesses portal in read-only mode (`member_portal.access.logged`) | Member ID (`member.id`), access type (balance/statement/claims/contact), session timestamp | Access log entry + `member_portal.access.logged` | Real-time |
| Claims template or contact routing updated | Updated template ID (`member_portal.claims_template_id`), CCO authorization | Updated configuration + `member_portal.access.logged` (configuration change) | Immediate upon authorization |

**ALERTS/METRICS:** Alert if read-only mode is not confirmed active by the next local business open following a freeze or handover event. Monitor portal availability (target: 99.9% uptime in read-only mode during resolution events). Alert if the claims template is more than 90 days old without a review on record.

---

## RS-07 — Trustee/Conservator Handover {#rs-07-trustee-conservator-handover}

**WHY (Reg cite):** [12 USC §§1786(h), 1787](https://www.law.cornell.edu/uscode/text/12/1786) (FCUA — conservatorship and liquidating agent appointment and powers) and [12 CFR Part 709](https://www.ecfr.gov/current/title-12/part-709) (involuntary liquidation of federal credit unions) require the institution to cooperate fully with an appointed conservator or liquidating agent, including providing complete and accurate records and operational access. A standardized handover packet and scoped access provisioning enable the conservator to assume operations without delay.

**SYSTEM BEHAVIOR:** Upon receipt of an NCUA appointment notice (conservator or liquidating agent), the institution initiates handover procedures immediately. An initial handover packet — containing the scope registry, current posture state, safe-mode and freeze status, key personnel roster, and system access map — must be delivered within 4 hours. The full handover packet — adding complete records per RS-08, vendor contracts, regulatory correspondence, and a system runbook — must be delivered within 24 hours. Simultaneously, scoped trustee/conservator access is provisioned to the core system, member portal, and records repository with the minimum permissions required for the conservator's mandate; access is logged and time-bounded. The handover record stores the appointment reference, trustee identity, credential ID, and access grant ID immutably. The CCO coordinates handover; IT/DevOps provisions access; Legal reviews access scope. Trustee access provisioning is write-restricted to IT/DevOps with CCO and Legal sign-off.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| NCUA appointment notice received (`handover.appointment.received`) | Appointment reference (`handover.appointment_reference`), trustee identity (`handover.trustee_identity`), trustee contact (`handover.trustee_contact`), appointment status (`handover.appointment_status`) | Handover process initiated; initial packet assembly started | Immediate |
| Initial packet assembled | Scope registry version (`scope_registry.version_id`), posture state (`resolution_posture.current`), personnel roster (`handover.personnel_roster`), system access map | Initial packet delivered + `handover.initial_packet.delivered` | 4 h of appointment notice (enforced by `handover.initial_due_at`) |
| Full packet assembled (records package complete per RS-08) | Records package artifact ID (`records_package.artifact_id`), checksum chain (`records_package.checksum_chain`), vendor contracts, regulatory correspondence, system runbook | Full packet delivered + `handover.full_packet.delivered` | 24 h of appointment notice (enforced by `handover.full_due_at`) |
| Trustee access provisioned (`handover.access.updated`) | Trustee credential ID (`handover.trustee_credential_id`), access scope (`handover.access_scope`), access grant ID (`handover.trustee_access_grant_id`), access expiry (`handover.access_expiry_due`) | Access provisioned + `handover.trustee_action.logged` | Concurrent with initial packet delivery |
| Trustee action logged during conservatorship (`handover.trustee_action.logged`) | Trustee identity, action type, timestamp, affected resource | Immutable action log entry + `handover.trustee_action.logged` | Real-time |

**ALERTS/METRICS:** Alert if initial packet delivery is not confirmed within 4 hours and 15 minutes of appointment notice. Alert if full packet delivery is not confirmed within 24 hours and 30 minutes. Alert if trustee access is not provisioned within 4 hours of appointment notice. Monitor trustee access expiry (`handover.access_expiry_due`) and alert 24 hours before expiry if conservatorship is ongoing.

---

## RS-08 — Records Preservation for Resolution {#rs-08-records-preservation-for-resolution}

**WHY (Reg cite):** [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) (records preservation program for credit unions) requires insured credit unions to maintain a records preservation program ensuring that vital records are available for reconstruction of the institution's affairs. [12 CFR Part 709](https://www.ecfr.gov/current/title-12/part-709) and [12 USC §1787](https://www.law.cornell.edu/uscode/text/12/1787) require complete and accurate records to be available to the liquidating agent. Signed checksums and encrypted archives ensure integrity and confidentiality of the resolution records package.

**SYSTEM BEHAVIOR:** The resolution records package is a Part 749-compliant archive containing: member/share/loan ledgers, ACH and card transaction histories, general ledger (GL) trial balance and balance sheet snapshot, governance minutes, material contracts, BSA/AML logs (excluding SAR narratives, which are governed by the BSA Policy), and regulatory correspondence. The package is assembled as a reproducible, versioned artifact with a signed checksum chain and encrypted at rest. Package assembly must start within 2 hours of a freeze or NCUA appointment event and complete within 24 hours. In addition, a monthly snapshot of the same record set is generated automatically on a scheduled basis and retained per the Record Retention Policy (retention schedules are out of scope here). Each snapshot and on-demand package is assigned a manifest ID and snapshot ID for traceability. Write access to the records package configuration is restricted to Compliance and IT/DevOps; the package itself is write-once after sealing.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Freeze or NCUA appointment event triggers package build (`records_package.build.started`) | Trigger event reference, snapshot as-of timestamp (`records_package.snapshot_as_of`), manifest ID (`records_package.manifest_id`) | Package build initiated + `records_package.build.started` | 2 h of triggering event (enforced by `records_package.start_due_at`) |
| Package assembly complete (`records_package.completed`) | Artifact ID (`records_package.artifact_id`), checksum chain (`records_package.checksum_chain`), manifest ID (`records_package.manifest_id`), snapshot ID (`records_package.snapshot_id`) | Sealed, encrypted package + `records_package.completed`; package delivered to handover process | 24 h of triggering event (enforced by `records_package.complete_due_at`) |
| Package verification fails (`records_package.verification.failed`) | Failure reason (`records_package.failure_reason`), manifest ID | Failure alert issued; rebuild initiated + `records_package.verification.failed` | Immediate; rebuild must complete within 4 h of failure detection |
| Monthly scheduled snapshot (`records_package.snapshot.completed`) | Snapshot schedule (`records_package.snapshot_schedule`), snapshot as-of date | Monthly snapshot sealed and archived + `records_package.snapshot.completed` | Monthly — enforced by `records_package.snapshot_due` |

**ALERTS/METRICS:** Alert if package build is not started within 2 hours and 15 minutes of a triggering event. Alert if package is not completed within 24 hours and 30 minutes. Alert if checksum verification fails on any snapshot (target: zero integrity failures). Monitor monthly snapshot cadence; alert if any month is missed.

---

## RS-09 — Testing and Validation {#rs-09-testing-and-validation}

**WHY (Reg cite):** [12 CFR §§748.0–748.2](https://www.ecfr.gov/current/title-12/part-748) (security program, including testing requirements) and safety-and-soundness expectations under [12 CFR Part 741](https://www.ecfr.gov/current/title-12/part-741) require insured credit unions to test and validate their operational controls. Semiannual failover drills, quarterly restore tests, and an annual trustee tabletop confirm that resolution mechanics work as designed and that findings are remediated promptly.

**SYSTEM BEHAVIOR:** The resolution testing program comprises three test types: (a) semiannual failover drills — full end-to-end simulation of safe-mode activation, account freeze, institution-wide freeze, and member portal read-only mode in an isolated sandbox environment; (b) quarterly restore tests — validation that the records package can be fully restored and verified from the most recent monthly snapshot; and (c) annual trustee tabletop — a structured scenario exercise with the CCO, CEO, IT/DevOps, Legal, and Communications simulating an NCUA conservator appointment and handover. Each test produces an after-action report (AAR) published within 10 business days of test completion. High-risk findings (severity = high) must have a remediation plan assigned and remediation completed within 30 days of the report publication date. All test results, findings, and remediation records are retained per the Record Retention Policy. Internal Audit reviews test results and validates remediation closure. The resolution test schedule is write-restricted to Compliance; test execution is coordinated by IT/DevOps and Risk Engineering.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Resolution test scheduled (`resolution_test.scheduled`) | Test type (`resolution_test.type`), plan ID (`resolution_test.plan_id`), sandbox baseline (`resolution_test.sandbox_baseline`), scheduled date | Test scheduled + `resolution_test.scheduled` | Per annual test calendar |
| Test completed (`resolution_test.completed`) | Test type, plan ID, pass/fail results, finding IDs (`resolution_test.finding_id`), finding severity (`resolution_test.finding_severity`) | Test completion record + `resolution_test.completed` | Immediate upon test conclusion |
| AAR published (`resolution_test.report.published`) | Test results, findings, remediation owner (`resolution_test.remediation_owner`), report due date (`resolution_test.report_due_at`) | Published AAR + `resolution_test.report.published` | 10 BD of test completion (enforced by `resolution_test.report_due_at`) |
| High-risk finding opened (`resolution_test.finding.opened`) | Finding ID, severity = high, remediation owner, remediation due date (`resolution_test.remediation_due_at`) | Finding record + `resolution_test.finding.opened` | Immediate upon AAR publication |
| High-risk finding remediated and closed (`resolution_test.finding.closed`) | Finding ID, remediation evidence, Internal Audit sign-off | Closure record + `resolution_test.finding.closed` | 30 days of AAR publication (enforced by `resolution_test.remediation_due_at`) |

**ALERTS/METRICS:** Alert if any scheduled test is not completed within 5 business days of its scheduled date. Alert if AAR is not published within 10 business days of test completion. Alert if any high-risk finding is not closed within 30 days of AAR publication. Target: 100% of high-risk findings closed on time; zero overdue AARs.

---

## RS-10 — Governance and Review Cadence {#rs-10-governance-and-review-cadence}

**WHY (Reg cite):** [12 USC §§1786–1787](https://www.law.cornell.edu/uscode/text/12/1786) (FCUA — supervisory and governance obligations), [12 CFR Part 741](https://www.ecfr.gov/current/title-12/part-741) (safety-and-soundness), and [12 CFR §748.2](https://www.ecfr.gov/current/title-12/part-748) (security program governance) require insured credit unions to maintain documented governance structures, assign clear responsibilities, and review and update policies in response to material changes. A resolution RACI, exception register, and quarterly review cadence ensure accountability and continuous improvement.

**SYSTEM BEHAVIOR:** The CCO owns the resolution RACI, which assigns Responsible, Accountable, Consulted, and Informed roles for each control in this policy. The exception register records all approved deviations from policy requirements, including the deviation description, risk acceptance rationale, approver, and expiry date. A quarterly operational review is conducted by the CCO (with participation from the Board Risk Committee, CEO, Risk Engineering, IT/DevOps, Communications, and BSA/AML Officer) and must be completed by day 20 of the month following each quarter close. The review covers: posture history, EWI threshold performance, test results and open findings, exception register status, and scope registry currency. The policy must be updated within 30 days of any material change (regulatory amendment, significant operational change, or material finding from testing). Policy updates are approved by the CCO and noted in the Board minutes. The RACI and exception register are write-restricted to Compliance; the Board Risk Committee receives the quarterly review report.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Quarter closes → quarterly review due (`resolution_review.completed`) | Posture history (`resolution_posture.current`), EWI sweep history (`ewi.history`), open findings from RS-09, exception register (`resolution_exception.description`, `resolution_exception.expires_at`), scope registry version (`scope_registry.version_id`) | Quarterly review report + `resolution_review.completed`; Board Risk Committee notified | By day 20 of following month (enforced by `resolution_review.due`) |
| Material change identified → policy update required (`resolution_policy.updated`) | Change description (`resolution_policy.change_description`), change identified date (`resolution_policy.change_identified`), CCO approval | Updated policy version published + `resolution_policy.updated` | 30 days of change identification (enforced by `resolution_policy.update_due_at`) |
| Exception requested (`resolution_exception.decided`) | Exception description (`resolution_exception.description`), risk acceptance rationale, approver identity, expiry date (`resolution_exception.expires_at`) | Exception register entry + `resolution_exception.decided` | Immediate upon request; CCO must decide within 5 BD |
| Exception expiry approaching | Exception ID, expiry date (`resolution_exception.expires_at`) | Expiry alert issued; CCO notified for renewal or closure | 30 days before expiry |

**ALERTS/METRICS:** Alert if quarterly review is not completed by day 20 of the following month. Alert if any policy material change is not reflected in an updated policy version within 30 days. Alert if any exception in the register has expired without a renewal or closure decision. Target: zero overdue quarterly reviews; zero lapsed exceptions.

---

## Governance & Sign-Off {#governance}

| Role | Responsibility |
|---|---|
| **Patrick Wilson, CCO** | Policy owner; approves all controls, exceptions, and policy updates; chairs quarterly review |
| **Board of Directors** | Authorizes institution-wide freeze (emergency resolution); receives quarterly review report; approves policy annually |
| **CEO** | Receives EWI weekly summary; participates in quarterly review and annual tabletop |
| **Risk Engineering** | Maintains EWI ruleset, scope registry, and safe-mode cap profiles; executes failover drills |
| **IT/DevOps** | Provisions trustee access; executes safe-mode propagation; coordinates restore tests |
| **Communications** | Drafts and issues member/public notices on freeze or handover events |
| **BSA/AML Officer** | Ensures BSA logs are included in records package; coordinates with BSA Policy on SAR preservation |
| **Internal Audit** | Tests control effectiveness; validates remediation closure; reviews test AARs |
| **Legal** | Reviews targeted freeze orders; approves trustee access scope; advises on garnishment precedence |

**Review cadence:** Annual policy review (or within 30 days of any material change). Quarterly operational review by day 20 of the following month. Semiannual failover drills; quarterly restore tests; annual trustee tabletop.

**Cross-references:** Business Continuity Plan (going-concern operational continuity); Liquidity Policy (pre-resolution EWI triggers and contingency funding); Capitalization Policy (PCA tiers); Record Retention Policy (retention schedules for resolution records); BSA Policy (SAR/CTR preservation mechanics); Third-Party Risk Policy (vendor contract continuity through receivership).

**Approval:**

| Approver | Title | Date |
|---|---|---|
| Patrick Wilson | Chief Compliance Officer | __________ |

---

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional for resolution-domain fields.** The following codes used in this policy's control overlays are drawn from registered objects and events in `core-vocabulary.json` (e.g., `scope_registry`, `safe_mode`, `account_freeze`, `institution_freeze`, `handover`, `records_package`, `ewi`, `resolution_posture`, `resolution_test`, `resolution_policy`, `resolution_review`, `resolution_exception`, `member_portal`) and are confirmed registered. No new objects were coined. However, several field-level codes used in the EVENTS tables are provisional spellings not yet confirmed as registered fields on their parent objects — specifically: `ewi.prior_breach_state`, `ewi.evaluation_schedule`, `ewi.indicator_id`, `resolution_posture.current` (used as a field reference), `safe_mode.trigger_basis`, `safe_mode.cap_profile_id`, `safe_mode.daily_outflow_total`, `handover.appointment_status`, `handover.personnel_roster`, `handover.access_expiry_due`, `member_portal.core_unavailable`, `member_portal.snapshot_served`, `records_package.failure_reason`, `resolution_exception.description`, `resolution_exception.expires_at`, `resolution_exception.requested`, `resolution_policy.change_description`, `resolution_policy.change_identified`, and `resolution_review.due`. These follow the Composition grammar and reuse registered objects; engineering must confirm field registration before the next review.

- **EWI threshold values are not defined in this policy.** The specific numeric thresholds for liquidity ratios, net-outflow rates, capital/PCA proxies, payment-failure rates, and CAMELS-proxy metrics that trigger posture shifts are maintained in the EWI ruleset (owned by Risk Engineering, approved by CCO). This policy defines the evaluation cadence and damping rule but not the threshold values. Threshold values must be documented in the EWI ruleset and reviewed at least annually.

- **Cap profile parameters for safe mode are not defined in this policy.** The specific daily aggregate outbound caps, per-transaction limits, channel allowlist, and critical inbound credit exemption list are maintained in the safe-mode cap profile (owned by Risk Engineering, approved by CCO). This policy defines the activation mechanics and timing but not the cap values. Cap profiles must be documented, version-controlled, and reviewed at least annually.

- **NCUA Part 708b (emergency assisted mergers) is not addressed.** The AUTHORITY_HINTS reference 12 CFR Part 708b as a resolution contingency. This policy does not address the mechanics of an emergency assisted merger, which would be a distinct resolution path. If the institution's resolution strategy includes an assisted merger option, a separate control or policy addendum should address Part 708b requirements.

- **Share insurance payout mechanics (12 USC §§1781–1790d, §1787) are not separately controlled.** Member share insurance coverage and payout mechanics during resolution are governed by NCUA's share insurance program and administered by NCUA directly upon appointment as liquidating agent. This policy ensures member portal access and records availability to support claims (RS-06, RS-08) but does not replicate NCUA's payout procedures. If the institution wishes to document its role in facilitating NCUA payouts, a separate procedure should be developed.

- **Trustee access expiry duration is not specified.** RS-07 requires that trustee access be time-bounded, but the specific duration is not defined in this policy. The CCO and Legal must agree on an appropriate access window (e.g., 90 days, renewable) at the time of conservator appointment and document it in the handover record.

- **"Material change" definition for scope registry and policy updates.** This policy uses "material change" as the trigger for scope registry updates (RS-01) and policy updates (RS-10) but does not define materiality thresholds. Risk Engineering and Compliance should document a materiality definition (e.g., any new product, channel, or critical vendor; any change to RTO/RPO by more than 20%; any regulatory amendment affecting resolution obligations) in the resolution RACI or a supporting procedure.

- **BSA log inclusion in records package.** RS-08 includes BSA/AML logs in the resolution records package but excludes SAR narratives (governed by the BSA Policy). The boundary between includable BSA logs (e.g., CTR filings, alert dispositions) and excluded SAR content must be confirmed with the BSA/AML Officer and documented in the records package configuration before the first drill.

- **Reference policy (Bank of America / FDIC Resolutions Handbook) not used.** The REFERENCE_POLICY provided is a large-bank Dodd-Frank §165(d) resolution plan and the FDIC's Resolutions Handbook — both designed for FDIC-regulated institutions subject to receivership under the FDI Act. Pynthia Credit Union is an NCUA-regulated federal credit union subject to the FCUA (§§1786–1787) and NCUA Parts 709, 741, 748, and 749. No content from the reference policy was incorporated; all controls are synthesized from PATRICK_NOTES and the applicable NCUA/FCUA authority framework.
```
