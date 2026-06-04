---
title: Resolution Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-04
next_review: 2027-06-04
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Resolution, Conservatorship, Liquidation, Records Preservation, Safe Mode, NCUA]
---

# Resolution Policy

## General Policy Statement

Pynthia Credit Union maintains a minimal, testable resolution framework to protect member funds and ensure orderly continuity, handover, or wind-down under stress. The framework detects deterioration early, throttles outflows without cutting members off from their funds, and hands a clean, reproducible operating environment to a trustee or conservator on regulator direction. It covers all products, channels, partners, and systems enumerated in the machine-readable scope registry, and integrates with the Business Continuity, Information Security, and BSA/AML control sets. Pre-resolution liquidity triggers, PCA capital tiers, going-concern disaster recovery, retention schedules, SAR/CTR mechanics, and vendor contract continuity are governed by their respective policies (Liquidity, Capitalization, Business Continuity, Record Retention, BSA, and Third-Party Risk).

## Timing Matrix {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Scope registry update after material change | "Product/vendor/system change approved" → (`scope_registry.change_detected`) | 5 business days | Updated registry entry with RTO/RPO | [RS-01](#rs-01-resolution-scope-registry) |
| Scope registry publication to control engines | "Registry version approved" → (`scope_registry.version_approved`) | 24 hours | Published machine-readable registry | [RS-01](#rs-01-resolution-scope-registry) |
| Early-warning posture shift | "Two consecutive interval breaches" → (`ewi.threshold_breached`) | Next evaluation interval | Posture change memo; indicator snapshot | [RS-02](#rs-02-early-warning-indicators) |
| Safe-mode activation | "Posture or directive triggers safe mode" → (`safe_mode.triggered`) | 60 minutes | Caps, allowlists, onboarding controls live | [RS-03](#rs-03-safe-mode-transaction-controls) |
| Safe-mode propagation to processors | "Core safe-mode flag set" → (`safe_mode.activated`) | 30 minutes | Processor confirmation receipts | [RS-03](#rs-03-safe-mode-transaction-controls) |
| Targeted account freeze | "Freeze order approved" → (`account_freeze.approved`) | 30 minutes | Account status `frozen`; debit block | [RS-04](#rs-04-targeted-account-freeze) |
| Institution-wide freeze | "Board emergency resolution or NCUA directive" → (`institution_freeze.ordered`) | 60 minutes | Global FROZEN state | [RS-05](#rs-05-institution-wide-freeze) |
| Public/member freeze notice | "Global FROZEN state set" → (`institution_freeze.activated`) | 2 hours | Member notice; regulator confirmation | [RS-05](#rs-05-institution-wide-freeze) |
| Member read-only services restored | "Freeze or handover effected" → (`institution_freeze.activated`) | Next local business open | Balance inquiry, statements, claims routing | [RS-06](#rs-06-next-business-day-member-availability) |
| Initial handover packet | "NCUA appointment notice received" → (`handover.appointment_received`) | 4 hours | Initial packet + scoped trustee access | [RS-07](#rs-07-trusteeconservator-handover) |
| Full handover packet delivery | "NCUA appointment notice received" → (`handover.appointment_received`) | 24 hours | Complete handover packet | [RS-07](#rs-07-trusteeconservator-handover) |
| Resolution records package start | "Resolution event declared" → (`records_package.requested`) | 2 hours | Package build initiated | [RS-08](#rs-08-records-preservation-for-resolution) |
| Resolution records package complete | "Package build initiated" → (`records_package.build_started`) | 24 hours | Signed, encrypted, checksummed archive | [RS-08](#rs-08-records-preservation-for-resolution) |
| Post-test report publication | "Drill/restore/tabletop completed" → (`resolution_test.completed`) | 10 business days | Test report with findings | [RS-09](#rs-09-testing--validation) |
| High-risk test finding remediation | "Finding rated high" → (`resolution_test.finding_opened`) | 30 days | Closed remediation item | [RS-09](#rs-09-testing--validation) |
| Quarterly operational review | "Calendar quarter end" → (`resolution_review.due`) | Day 20 of quarter | Review minutes; exception register | [RS-10](#rs-10-governance--review-cadence) |
| Policy update after material change | "Material change identified" → (`resolution_policy.change_identified`) | 30 days | Approved policy revision | [RS-10](#rs-10-governance--review-cadence) |

## RS-01 — Resolution Scope Registry {#rs-01-resolution-scope-registry}

**WHY (Reg cite):** NCUA insurance requirements ([12 CFR Part 741](https://www.ecfr.gov/current/title-12/part-741)) and the security-program rule ([12 CFR §748.0–§748.2](https://www.ecfr.gov/current/title-12/part-748)) require an insured credit union to maintain documented programs that protect member assets and respond to operational threats; a deterministic, machine-readable inventory of what those programs cover is the precondition for every downstream resolution control applying correctly.

**SYSTEM BEHAVIOR:** Compliance maintains a machine-readable scope registry enumerating in-scope products, channels, critical vendors, and critical systems, each tagged with RTO/RPO targets. Any material change (new product launch, vendor onboarding/offboarding, system migration) must be reflected in the registry within 5 business days, and each approved registry version is published to the control engines within 24 hours so that safe-mode caps, freezes, and records exports resolve scope deterministically rather than by manual interpretation. Registry entries reference vendor records in the Third-Party Risk inventory rather than duplicating them. The registry is write-restricted to Compliance, with Risk Engineering holding read access for control-engine integration.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Material change to products, vendors, or systems approved (`scope_registry.change_detected`) | Change description (`scope_registry.change_description`), affected items (`scope_registry.item_ids[]`), RTO/RPO targets (`scope_registry.item.rto`, `scope_registry.item.rpo`) | Updated registry entry with version increment (`scope_registry.entry_updated`) | 5 business days (enforced by `scope_registry.update_due_at`) |
| Registry version approved by Compliance (`scope_registry.version_approved`) | Approved registry version (`scope_registry.version_id`), approver identity (`scope_registry.approver_id`) | Registry published to control engines with acknowledgment receipts (`scope_registry.published`) | 24 hours (internal: 4 hours; enforced by `scope_registry.publish_due_at`) |
| Quarterly registry attestation due (`scope_registry.attestation_due`) | Current registry version (`scope_registry.version_id`), open-change backlog (`scope_registry.pending_changes[]`) | Signed completeness attestation (`scope_registry.attested`) | Quarterly, by day 20 (aligned to `resolution_review.due`) |

**ALERTS/METRICS:** Alert when a registry update ages past 4 business days without approval; track time-from-change-to-publication (target p95 under the 24-hour deadline) and count of control-engine acknowledgment failures (target zero).

## RS-02 — Early-Warning Indicators {#rs-02-early-warning-indicators}

**WHY (Reg cite):** The Federal Credit Union Act authorizes NCUA to suspend, conserve, or liquidate a credit union on safety-and-soundness grounds ([12 USC §1786](https://www.law.cornell.edu/uscode/text/12/1786), [12 USC §1787](https://www.law.cornell.edu/uscode/text/12/1787)); detecting the indicators that precede those actions — and shifting posture before they mature — is how the institution preserves the option of orderly resolution under [12 CFR Part 741](https://www.ecfr.gov/current/title-12/part-741).

**SYSTEM BEHAVIOR:** Risk Engineering operates a ruleset that evaluates liquidity, net-outflow, capital/PCA, payment-failure, and CAMELS-proxy indicators hourly during business hours and daily after hours. When a threshold breaches on two consecutive evaluation intervals (the damping rule that prevents single-interval noise from triggering posture shifts), the institution moves into Prepared or Elevated posture and the CCO is notified for confirmation. Posture definitions and the threshold values themselves live in the ruleset configuration; the upstream indicator feeds (liquidity ratios, PCA tier) are sourced from the Liquidity and Capitalization policies' reporting outputs, not recomputed here. The ruleset configuration is write-restricted to Risk Engineering, with CCO approval required for threshold changes.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Scheduled evaluation interval fires (`ewi.evaluation_due`) | Indicator feed values (`ewi.indicator_values[]`), active thresholds (`ewi.thresholds[]`), prior-interval breach state (`ewi.prior_breach_state`) | Evaluation result snapshot (`ewi.evaluated`) | Hourly during business hours, daily after hours (scheduled by `ewi.evaluation_schedule`) |
| Threshold breached on two consecutive intervals (`ewi.threshold_breached`) | Breaching indicator (`ewi.indicator_id`), breach values (`ewi.breach_values[]`), current posture (`resolution_posture.current`) | Posture shift to Prepared or Elevated + CCO notification (`resolution_posture.changed`) | Next evaluation interval (internal: CCO confirmation within 2 hours) |
| Indicators recover below thresholds for two consecutive intervals (`ewi.threshold_recovered`) | Recovery values (`ewi.recovery_values[]`), posture history (`resolution_posture.history[]`) | Posture step-down with CCO sign-off (`resolution_posture.changed`) | Next evaluation interval |

**ALERTS/METRICS:** Alert on any missed evaluation interval (target zero gaps) and on every posture change; track indicator-feed staleness (alert when a feed exceeds twice its expected refresh interval) and the count of single-interval breaches damped out, as a noise/health signal for threshold calibration.

## RS-03 — Safe-Mode Transaction Controls {#rs-03-safe-mode-transaction-controls}

**WHY (Reg cite):** The NCUA security program rule ([12 CFR §748.0](https://www.ecfr.gov/current/title-12/part-748/section-748.0)) requires programs that protect member funds against loss; a pre-built safe mode that throttles outflows while preserving member access is the proportionate intermediate step between normal operations and the freeze powers contemplated under [12 USC §1786](https://www.law.cornell.edu/uscode/text/12/1786).

**SYSTEM BEHAVIOR:** On trigger (Elevated posture plus CCO authorization, or a direct Board/NCUA instruction), the core sets a safe-mode flag that activates daily and per-transaction outbound caps, channel allowlists, and new-member onboarding restrictions, while preserving read-only account access for all members. The flag must be live within 60 minutes of the trigger and propagated to all payment processors (ACH, wire, card, RTP) within 30 minutes of the core change. Critical inbound credits — payroll and government benefits — remain open in safe mode; outbound caps apply per the scope registry's product tags ([RS-01](#rs-01-resolution-scope-registry)). Card-level enforcement reuses `spend_controls.daily_limit` and `spend_controls.per_transaction_limit`; account-level holds use `bookkeeping.locked_amount`. Deactivation requires the same authority as activation. The safe-mode flag is write-restricted to the CCO and CEO under dual control, with Risk Engineering executing.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Safe-mode trigger authorized (`safe_mode.triggered`) | Trigger basis (`safe_mode.trigger_basis`), authorizing officers (`safe_mode.authorized_by[]`), active cap set (`safe_mode.cap_profile_id`) | Safe-mode flag set on core; caps, allowlists, onboarding controls live (`safe_mode.activated`) | 60 minutes (enforced by `safe_mode.activation_due_at`) |
| Core safe-mode flag set (`safe_mode.activated`) | Processor list from scope registry (`scope_registry.item_ids[]`), card spend-control payloads (`spend_controls.daily_limit`, `spend_controls.per_transaction_limit`) | Processor propagation confirmations (`safe_mode.processor_confirmed`) | 30 minutes of core change (enforced by `safe_mode.propagation_due_at`) |
| Outbound transaction evaluated under safe mode (`safe_mode.transaction_evaluated`) | Transfer details (`ach_transfer.amount` / `wire_transfer.amount` / `card_authorization.amount`), running daily total (`safe_mode.daily_outflow_total`), channel allowlist (`safe_mode.channel_allowlist[]`) | Approve/cap/reject decision recorded in control results (`control_results[]` entry; `safe_mode.transaction_decided`) | Real-time (sub-2-second, consistent with the `card_authorization.status` pending window) |
| Safe-mode stand-down authorized (`safe_mode.deactivation_authorized`) | Authorizing officers (`safe_mode.authorized_by[]`), posture state (`resolution_posture.current`) | Flag cleared; processors notified (`safe_mode.deactivated`) | 60 minutes (internal: processors within 30 minutes) |

**ALERTS/METRICS:** Page on-call if activation exceeds 45 minutes or any processor fails to confirm within 25 minutes; track propagation latency distribution, count of capped/rejected transactions per hour during safe mode, and confirmation that payroll/benefit inbound credit volume is unaffected (deviation alert at ±10% of trailing baseline).

## RS-04 — Targeted Account Freeze {#rs-04-targeted-account-freeze}

**WHY (Reg cite):** The conservatorship and liquidation powers of [12 USC §1787](https://www.law.cornell.edu/uscode/text/12/1787) and the protective expectations of [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) require the institution to be able to immobilize specific member funds on regulator or compliance direction without disrupting the broader membership.

**SYSTEM BEHAVIOR:** On an approved freeze order (regulator directive, legal process, or CCO compliance determination), the system transitions the specified accounts to `status: frozen` with the appropriate `lock_type` (`legal`, `compliance`, or `admin`), blocking all debits while permitting regulator-approved credits to post, within 30 minutes of approval. Existing legal garnishments and levies take precedence over resolution freezes and are processed in their statutory order; for joint accounts the freeze applies to the account as a whole (not selectively per owner), and for fiduciary accounts the freeze records the fiduciary capacity so the trustee/conservator can adjudicate beneficiary claims. Freeze and unfreeze actions on the `POST /accounts/{account_id}/status` and `PUT /accounts/{account_id}/lock` endpoints are write-restricted to Compliance, with every action dual-logged to the freeze order it executes.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Freeze order approved (`account_freeze.approved`) | Target accounts/entities (`account.id[]`, `account.entity_id[]`), order basis and reference (`account_freeze.order_reference`), lock category (`account.lock_type`) | Account status set to `frozen`, debits blocked, credits gated to regulator-approved list (`account_freeze.applied`) | 30 minutes (enforced by `account_freeze.application_due_at`) |
| Regulator-approved credit presented to frozen account (`account_freeze.credit_presented`) | Credit details (`inbound_payment.amount`, `inbound_payment.originator`), approved-credit ruleset (`account_freeze.approved_credit_rules[]`) | Credit posted with bookkeeping entry (`bookkeeping_entry` of `entry_type: credit`; `account_freeze.credit_posted`) | Same business day |
| Garnishment or legal process conflicts with freeze (`account_freeze.legal_conflict_detected`) | Legal process details (`account_freeze.legal_process_reference`), freeze order (`account_freeze.order_reference`) | Precedence determination by Compliance counsel, logged (`account_freeze.precedence_resolved`) | 1 business day |
| Freeze lift approved (`account_freeze.release_approved`) | Release authority (`account_freeze.release_reference`), account state (`account.status`, `account.lock_type`) | Account returned to `open`; release logged (`account_freeze.released`) | 30 minutes |

**ALERTS/METRICS:** Alert if any approved freeze is not applied within 25 minutes; track freeze-application latency (p99 under 30 minutes), count of debits attempted against frozen accounts (each one a control-effectiveness datapoint, expected blocked at 100%), and aging of unresolved legal-precedence conflicts (target none older than 1 business day).

## RS-05 — Institution-Wide Freeze {#rs-05-institution-wide-freeze}

**WHY (Reg cite):** [12 USC §1786](https://www.law.cornell.edu/uscode/text/12/1786) (cease-and-desist and suspension powers) and [12 USC §1787](https://www.law.cornell.edu/uscode/text/12/1787) (conservatorship/liquidation) contemplate circumstances where the NCUA Board or the institution's own Board must halt operations institution-wide; the policy pre-builds that switch so the action is an execution step, not an engineering project.

**SYSTEM BEHAVIOR:** On a Board emergency resolution or NCUA directive, the institution sets a global FROZEN state within 60 minutes: all member accounts behave as frozen (debits blocked, regulator-approved credits open per [RS-04](#rs-04-targeted-account-freeze) rules), all outbound origination endpoints reject new transactions, and read-only member access remains live. Public and member notice is published within 2 hours of activation, and written confirmation is delivered to the NCUA regional office. Transactions already submitted to payment networks before the freeze settle normally to avoid network-rule violations; only new originations are blocked. The global FROZEN switch is write-restricted to the CEO and CCO acting on documented Board or NCUA authority, executed by Risk Engineering under dual control.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Board emergency resolution or NCUA directive received (`institution_freeze.ordered`) | Order instrument (`institution_freeze.order_reference`), authorizing officers (`institution_freeze.authorized_by[]`), scope registry version (`scope_registry.version_id`) | Global FROZEN state set across core and processors (`institution_freeze.activated`) | 60 minutes (enforced by `institution_freeze.activation_due_at`) |
| Global FROZEN state set (`institution_freeze.activated`) | Pre-approved notice templates (`institution_freeze.notice_template_id`), channel list (`scope_registry.item_ids[]`) | Public/member notice published on all member channels (`institution_freeze.notice_published`) | 2 hours (enforced by `institution_freeze.notice_due_at`) |
| Notice published (`institution_freeze.notice_published`) | Activation evidence (`institution_freeze.activation_evidence`), notice copies (`institution_freeze.notice_record`) | Written confirmation to NCUA regional office (`institution_freeze.regulator_confirmed`) | Same day (internal: 4 hours) |
| In-flight network transactions settle post-freeze (`institution_freeze.inflight_settled`) | In-flight queue (`ach_transfer.status` = `submitted` list, `wire_transfer.status` = `submitted` list, `balances.inflight_balance`) | Settlement bookkeeping entries; reconciliation report (`institution_freeze.inflight_reconciled`) | Per network settlement windows |

**ALERTS/METRICS:** Page executive on-call at activation; alert if FROZEN state is not confirmed across all processors within 45 minutes or notice is not published within 90 minutes; track count of origination attempts rejected post-freeze (expected pattern: spike then decay) and in-flight reconciliation completeness (target 100% matched).

## RS-06 — Next-Business-Day Member Availability {#rs-06-next-business-day-member-availability}

**WHY (Reg cite):** Share-insurance payout and member-protection obligations under [12 USC §1787](https://www.law.cornell.edu/uscode/text/12/1787) and the insured-credit-union requirements of [12 CFR Part 741](https://www.ecfr.gov/current/title-12/part-741) presume members can determine their balances and pursue claims promptly; restoring informational access by the next business day limits member harm and claim friction during resolution.

**SYSTEM BEHAVIOR:** Following any institution-wide freeze or handover event, the member portal and API must support balance inquiry, statement download, claims instructions, and contact routing — in read-only mode if transactional services remain suspended — by the next local business open. The read-only surface is a pre-built portal mode (not an incident-time build) that serves `GET`-only endpoints (`GET /accounts/{account_id}`, `GET /accounts/{account_id}/bookkeeping-entries`) against the most recent consistent ledger snapshot, with claims instructions and trustee contact details injected from templates maintained under [RS-07](#rs-07-trusteeconservator-handover). If the core itself is unavailable, the portal serves from the latest records-package snapshot ([RS-08](#rs-08-records-preservation-for-resolution)) with a data-as-of banner. Portal-mode switching is write-restricted to Risk Engineering on CCO authorization.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Freeze or handover effected (`institution_freeze.activated` or `handover.appointment_received`) | Latest consistent ledger state (`balances.balance` per account, `bookkeeping_entry` history), claims templates (`member_portal.claims_template_id`), trustee contact block (`handover.trustee_contact`) | Read-only member portal mode live with balance, statements, claims, contact routing (`member_portal.readonly_activated`) | Next local business open (enforced by `member_portal.readonly_due_at`) |
| Member accesses read-only services (`member_portal.readonly_accessed`) | Member authentication (`entity_id`), account scope (`account.id[]`) | Access log entry with services used (`member_portal.access_logged`) | Real-time |
| Core unavailable at restore time (`member_portal.core_unavailable`) | Latest records-package snapshot (`records_package.snapshot_id`), snapshot timestamp (`records_package.snapshot_as_of`) | Portal served from snapshot with data-as-of banner (`member_portal.snapshot_served`) | Next local business open |

**ALERTS/METRICS:** Alert if read-only mode is not confirmed live 2 hours before the next business open; track portal availability (target 99.5% during resolution), authentication success rate, and snapshot staleness when serving from archive (alert if data-as-of exceeds 24 hours).

## RS-07 — Trustee/Conservator Handover {#rs-07-trusteeconservator-handover}

**WHY (Reg cite):** When NCUA appoints itself or another party as conservator or liquidating agent under [12 USC §1786(h)](https://www.law.cornell.edu/uscode/text/12/1786) and [12 USC §1787](https://www.law.cornell.edu/uscode/text/12/1787), and administers the estate under [12 CFR Part 709](https://www.ecfr.gov/current/title-12/part-709), the speed and quality of the institution's handover materially determines member outcomes and payout timing.

**SYSTEM BEHAVIOR:** On receipt of an NCUA appointment notice, the institution generates a standardized handover packet — institution profile, scope registry extract, system inventory with credentials-escrow references, key personnel roster, open-litigation and contract summaries, and the records-package manifest ([RS-08](#rs-08-records-preservation-for-resolution)) — and provisions scoped, time-boxed trustee access to core systems. The initial packet version is delivered within 4 hours and the complete packet within 24 hours of the appointment notice. Trustee access uses dedicated roles with read-everything scope and write scope limited to what the appointment instrument authorizes; all trustee actions are logged identically to internal actions. Packet templates and the access-role definitions are maintained continuously and exercised in the annual tabletop ([RS-09](#rs-09-testing--validation)). Packet generation and trustee provisioning are restricted to the CCO, with IT/DevOps executing.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| NCUA appointment notice received (`handover.appointment_received`) | Appointment instrument (`handover.appointment_reference`), trustee identity and scope (`handover.trustee_identity`, `handover.access_scope`), current registry version (`scope_registry.version_id`) | Initial handover packet delivered + scoped trustee access provisioned (`handover.initial_packet_delivered`, `handover.trustee_access_provisioned`) | 4 hours (enforced by `handover.initial_due_at`) |
| Initial packet delivered (`handover.initial_packet_delivered`) | Records-package manifest (`records_package.manifest_id`), contracts and litigation summaries (`handover.contract_summaries[]`, `handover.litigation_summaries[]`), personnel roster (`handover.personnel_roster`) | Full handover packet delivered with delivery receipt (`handover.full_packet_delivered`) | 24 hours of appointment notice (enforced by `handover.full_due_at`) |
| Trustee performs an action in core systems (`handover.trustee_action`) | Trustee credential (`handover.trustee_credential_id`), action scope check (`handover.access_scope`) | Logged trustee action with scope-check result (`handover.trustee_action_logged`) | Real-time |
| Trustee access term expires or is revoked (`handover.access_expiry_due`) | Access grant record (`handover.trustee_access_grant_id`), appointment status (`handover.appointment_status`) | Access revoked or re-authorized with new term (`handover.access_updated`) | At grant expiry (enforced by `handover.access_expires_at`) |

**ALERTS/METRICS:** Page the CCO if the initial packet is not delivered within 3 hours of the appointment notice; track packet completeness against the template checklist (target 100% of mandatory sections), trustee-access provisioning latency, and count of trustee actions failing scope checks (each reviewed within 1 business day).

## RS-08 — Records Preservation for Resolution {#rs-08-records-preservation-for-resolution}

**WHY (Reg cite):** [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) requires a records-preservation program with vital records stored so the credit union can be reconstructed, and [12 CFR Part 709](https://www.ecfr.gov/current/title-12/part-709) / [12 USC §1787](https://www.law.cornell.edu/uscode/text/12/1787) presume the liquidating agent can rely on those records to adjudicate claims and pay shares.

**SYSTEM BEHAVIOR:** The institution maintains an automated build pipeline that assembles a Part 749-compliant resolution records package: member/share/loan ledgers, ACH and card transaction histories, general ledger, governance minutes, contracts, and BSA logs, exported with signed checksums and packaged into encrypted archives. On a resolution event the build starts within 2 hours and completes within 24 hours; independent of any event, a monthly snapshot is built, verified, and retained so a recent package always exists. Package contents draw on the entities, accounts, transfers, bookkeeping entries, and BSA alerts already retained under the Record Retention Policy's schedules; this control governs the resolution packaging, not the underlying retention. SAR/CTR content is included only by reference to the BSA Policy's preservation mechanics. Package encryption keys are escrowed for the trustee per [RS-07](#rs-07-trusteeconservator-handover); pipeline configuration is write-restricted to IT/DevOps with Compliance approval.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Resolution event declared or trustee requests package (`records_package.requested`) | Scope registry version (`scope_registry.version_id`), source-system extract list (`records_package.source_manifest[]`) | Package build initiated (`records_package.build_started`) | 2 hours (enforced by `records_package.start_due_at`) |
| Package build initiated (`records_package.build_started`) | Ledger extracts (`bookkeeping_entry` history, `balances.balance` per account), transaction histories (`ach_transfer`, `wire_transfer`, `card_authorization` records), BSA logs (`bsa_alert` records), governance minutes and contracts (`records_package.document_refs[]`) | Encrypted archive with signed checksums and manifest (`records_package.completed`) | 24 hours (enforced by `records_package.complete_due_at`) |
| Monthly snapshot scheduled (`records_package.snapshot_due`) | Same source manifest (`records_package.source_manifest[]`), prior snapshot checksum chain (`records_package.checksum_chain`) | Verified monthly snapshot retained (`records_package.snapshot_completed`) | Monthly (scheduled by `records_package.snapshot_schedule`) |
| Checksum or restore verification fails (`records_package.verification_failed`) | Failed artifact reference (`records_package.artifact_id`), failure details (`records_package.failure_reason`) | Rebuild of affected artifact + incident entry (`records_package.rebuilt`) | 24 hours (internal: 8 hours) |

**ALERTS/METRICS:** Alert if a monthly snapshot is missed or any checksum verification fails (target zero failures); track package build duration (p95 under 18 hours against the 24-hour deadline), archive completeness against the Part 749 vital-records checklist (100%), and age of the newest verified snapshot (alert above 35 days).

## RS-09 — Testing & Validation {#rs-09-testing--validation}

**WHY (Reg cite):** The security-program rule ([12 CFR §748.0–§748.2](https://www.ecfr.gov/current/title-12/part-748)) and general safety-and-soundness expectations under [12 CFR Part 741](https://www.ecfr.gov/current/title-12/part-741) require programs that actually work under stress; untested resolution mechanics are presumptively non-functional, so the testing cadence is itself a control.

**SYSTEM BEHAVIOR:** The institution runs semiannual failover drills (exercising the safe-mode and freeze switches in a production-like environment), quarterly restore tests (rebuilding a working environment from the records package and verifying ledger integrity), and an annual trustee tabletop (walking the handover packet and access provisioning with executive participants and, where possible, NCUA observers). Each test produces a published report within 10 business days, findings are risk-rated, and high-risk items are remediated within 30 days. Tests that would disturb live member balances run against the sandbox simulation surface (`POST /sandbox/*` endpoints) rather than production ledgers. Test scheduling and report sign-off are owned by the CCO; Internal Audit independently reviews test evidence annually.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Scheduled test window opens (`resolution_test.scheduled`) | Test plan and type (`resolution_test.plan_id`, `resolution_test.type`), environment scope (`scope_registry.version_id`), sandbox baseline (`resolution_test.sandbox_baseline`) | Executed drill/restore/tabletop with evidence captured (`resolution_test.completed`) | Semiannual (failover), quarterly (restore), annual (tabletop) — scheduled by `resolution_test.schedule` |
| Test completed (`resolution_test.completed`) | Test evidence (`resolution_test.evidence_refs[]`), measured timings vs. SLAs (`resolution_test.measured_slas[]`) | Published test report with risk-rated findings (`resolution_test.report_published`) | 10 business days (enforced by `resolution_test.report_due_at`) |
| High-risk finding opened (`resolution_test.finding_opened`) | Finding details and rating (`resolution_test.finding_id`, `resolution_test.finding_severity`), remediation owner (`resolution_test.remediation_owner`) | Closed remediation with verification evidence (`resolution_test.finding_closed`) | 30 days (enforced by `resolution_test.remediation_due_at`) |

**ALERTS/METRICS:** Alert when any scheduled test slips past its window or a report ages past 8 business days unpublished; track measured drill timings against the SLAs in the [Timing Matrix](#timing-matrix) (e.g., safe-mode activation under 60 minutes in test conditions), high-risk findings open past 30 days (target zero), and quarter-over-quarter restore-test ledger-integrity pass rate (target 100%).

## RS-10 — Governance & Review Cadence {#rs-10-governance--review-cadence}

**WHY (Reg cite):** Board and management accountability for resolution readiness flows from the Federal Credit Union Act's supervision framework ([12 USC §1786](https://www.law.cornell.edu/uscode/text/12/1786)), the insured-credit-union requirements of [12 CFR Part 741](https://www.ecfr.gov/current/title-12/part-741), and the board-responsibility language of [12 CFR §748.2](https://www.ecfr.gov/current/title-12/part-748/section-748.2); contingency options such as an emergency assisted merger under [12 CFR Part 708b](https://www.ecfr.gov/current/title-12/part-708b) require governance machinery that can act on short notice.

**SYSTEM BEHAVIOR:** The CCO maintains a resolution RACI covering the Board, CEO, Risk Engineering, IT/DevOps, Communications, and the BSA/AML Officer, plus an exception register recording every deviation from this policy with compensating measures and expiry dates. A quarterly operational review — completed by day 20 of each quarter — covers posture history, registry attestations ([RS-01](#rs-01-resolution-scope-registry)), test results ([RS-09](#rs-09-testing--validation)), open exceptions, and contingency options including emergency assisted-merger readiness. The policy itself is updated within 30 days of any material change in structure, systems, or regulation. Internal Audit tests control effectiveness on its risk-based schedule and reports to the Supervisory Committee. The RACI and exception register are write-restricted to Compliance.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Calendar quarter ends (`resolution_review.due`) | Posture history (`resolution_posture.history[]`), registry attestation (`scope_registry.attested` record), test reports (`resolution_test.report_published` records), exception register (`resolution_exception.register[]`) | Quarterly review minutes with action items (`resolution_review.completed`) | Day 20 of quarter (enforced by `resolution_review.due_at`) |
| Exception to policy requested (`resolution_exception.requested`) | Exception scope and basis (`resolution_exception.description`), compensating controls (`resolution_exception.compensating_controls[]`), expiry (`resolution_exception.expires_at`) | Approved/denied exception entry in register (`resolution_exception.decided`) | 5 business days |
| Material change identified (`resolution_policy.change_identified`) | Change description (`resolution_policy.change_description`), affected controls (`resolution_policy.affected_controls[]`) | Approved policy revision with version increment (`resolution_policy.updated`) | 30 days (enforced by `resolution_policy.update_due_at`) |

**ALERTS/METRICS:** Alert when the quarterly review ages past day 15 without completion, when any exception passes its expiry undecided, or when a policy update ages past 25 days; track exception count and age distribution (target: none open past expiry) and quarterly review on-time rate (target 100%).

## Governance & Sign-Off {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for policy content, the scope registry, the exception register, and the testing calendar.
- **Approver:** Patrick Wilson, Chief Compliance Officer. Board ratification is obtained for initial adoption and for any change to freeze authorities ([RS-04](#rs-04-targeted-account-freeze), [RS-05](#rs-05-institution-wide-freeze)).
- **Required participants:** Board of Directors, CEO, Risk Engineering, IT/DevOps, Communications, and the BSA/AML Officer per the resolution RACI ([RS-10](#rs-10-governance--review-cadence)); Internal Audit independently tests effectiveness.
- **Review cadence:** Quarterly operational review by day 20 ([RS-10](#rs-10-governance--review-cadence)); full policy review annually (next review per front-matter) and within 30 days of any material change.
- **Cross-references:** Liquidity Policy (early-warning funding triggers and contingency funding), Capitalization Policy (PCA tiers), Business Continuity Plan (going-concern disaster recovery), Record Retention Policy (retention schedules), BSA Policy (SAR/CTR preservation), Third-Party Risk Policy (vendor continuity through receivership), Information Security Policy (incident response under 12 CFR Part 748 Appendix B).

## Assumptions & Gaps {#assumptions}

- **Engineering vocabulary is provisional.** The parsed spec (Cassandra Banking Core API v1.0.0) registers entities, fields, and endpoints but zero events, timers, or state machines. Every `event.code` and timer code in this document — the `scope_registry.*`, `ewi.*`, `resolution_posture.*`, `safe_mode.*`, `account_freeze.*`, `institution_freeze.*`, `member_portal.*`, `handover.*`, `records_package.*`, `resolution_test.*`, `resolution_review.*`, `resolution_exception.*`, and `resolution_policy.*` families — is the target naming scheme and will be confirmed and registered by engineering before the next review. Field codes that do exist in vocabulary (`account.status`, `account.lock_type`, `bookkeeping.locked_amount`, `spend_controls.*`, `balances.*`, `control_results[]`, `bsa_alert`, the transfer entities) are cited as registered.
- **Safe-mode and global-freeze switches do not yet exist in the core.** Vocabulary has per-account `status: frozen` and per-card freeze, but no institution-level posture flag, safe-mode cap profile, or channel-allowlist mechanism. These are net-new engineering capabilities implied by RS-03 and RS-05.
- **Early-warning thresholds are not specified.** Patrick's notes name the indicator categories (liquidity, net-outflow, capital/PCA, payment-failure, CAMELS-proxy) but not numeric thresholds or the Prepared/Elevated posture definitions. The ruleset configuration values must be set jointly with the Liquidity and Capitalization policy owners.
- **"Regulator-approved credits" for frozen accounts are assumed to be payroll, government benefits, and credits the NCUA or appointed agent explicitly authorizes in writing.** The precise rule list needs NCUA regional-office confirmation at activation.
- **Trustee access scope is assumed to be read-everything plus write authority limited to the appointment instrument.** The dedicated trustee roles and credentials-escrow mechanism referenced in RS-07 do not yet exist and must be built and exercised in the first annual tabletop.
- **Handover packet template contents are inferred** from NCUA Resolutions Handbook practice (institution profile, system inventory, personnel roster, contracts, litigation, records manifest); the template should be validated against current NCUA regional-office expectations.
- **Next-business-day availability assumes a pre-built read-only portal mode.** If engineering determines a snapshot-served portal cannot meet the next-business-open deadline for some channels, the gap and the compensating manual process must be recorded in the exception register.
- **Pynthia's charter and insurance status are assumed to be a federally insured credit union** subject to Parts 709, 741, 748, and 749 and FCUA §1786/§1787; state-charter variations, if any, would modify the conservatorship authority citations.
- **Emergency assisted merger (Part 708b) is treated as a governance contingency only** — no operational control is built for it beyond the quarterly readiness check in RS-10; if the Board wants executable merger mechanics, that is a future policy expansion.
- **The monthly records-snapshot cadence is a policy choice**, not a Part 749 mandate (which requires vital-records preservation but not a specific frequency); the cadence should be revisited if transaction volume makes monthly snapshots stale for payout purposes.
