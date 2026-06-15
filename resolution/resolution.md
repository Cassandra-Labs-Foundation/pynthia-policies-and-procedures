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

## General Policy Statement

Pynthia Credit Union maintains a minimal, testable resolution framework to protect member funds and ensure orderly continuity, handover, or wind-down under stress. The institution detects deterioration through leading indicators, throttles outflows without cutting members off, freezes accounts or the institution where directed, hands a clean and reproducible operating environment to a trustee or conservator, and restores member-facing services by the next business day where feasible. This policy applies to all products, channels, partners, and systems enumerated in the scope registry and integrates with the Business Continuity, Information Security, and BSA/AML programs. Pre-resolution liquidity triggers, PCA capital tiers, going-concern disaster recovery, underlying retention schedules, BSA filing mechanics, and vendor receivership continuity live in their respective policies and are out of scope here.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---|---|---|
| Scope registry material change | Material change identified (`scope_registry.change_detected`) | 5 BD to update; publish to engines 24h after approval | In-scope products, channels, vendors, systems with RTO/RPO | [RP-01](#rp-01-resolution-scope-registry) |
| Early-warning breach | Indicator breaches threshold two consecutive intervals (`ewi.threshold_breached`) | Hourly (business) / daily (after-hours) evaluation | Posture shift to Prepared/Elevated | [RP-02](#rp-02-early-warning-indicators) |
| Safe-mode activation | Trigger condition met (`safe_mode.triggered`) | 60 min to apply; 30 min to propagate to processors | Outbound caps, channel allowlist, inbound-credit carve-out | [RP-03](#rp-03-safe-mode-transaction-controls) |
| Targeted account freeze | Freeze approved (`account_freeze.approved`) | 30 min from approval | Debit block, regulator-approved credits, garnishment precedence | [RP-04](#rp-04-targeted-account-freeze) |
| Institution-wide freeze | Board resolution or NCUA directive (`institution_freeze.ordered`) | 60 min to FROZEN; notice within 2h | Global freeze, public/member notice, regulator confirmation | [RP-05](#rp-05-institution-wide-freeze) |
| Next-business-day availability | Freeze or handover effective (`member_portal.readonly_activated`) | Next local business open | Balance, statements, claims, contact routing (read-only) | [RP-06](#rp-06-next-business-day-availability) |
| Trustee/conservator handover | NCUA appointment notice received (`handover.appointment_received`) | Initial packet 4h; full delivery 24h | Standardized packet, scoped trustee access | [RP-07](#rp-07-trusteeconservator-handover) |
| Records preservation | Resolution event triggers build (`records_package.build_started`) | Start 2h; complete 24h; monthly snapshots | Ledgers, ACH/card, GL, minutes, contracts, BSA logs, checksums | [RP-08](#rp-08-records-preservation-for-resolution) |
| Testing & validation | Scheduled drill/test due (`resolution_test.scheduled`) | Report 10 BD post-test; remediate high-risk 30 days | Failover drills, restore tests, trustee tabletop | [RP-09](#rp-09-testing-and-validation) |
| Governance & review cadence | Quarterly cycle opens (`resolution_review.completed`) | Quarterly review by day 20; policy update 30 days | RACI, exception register, review minutes | [RP-10](#rp-10-governance-and-review-cadence) |

## RP-01 — Resolution Scope Registry

- **WHY (Reg cite):** A machine-readable scope of products, channels, critical vendors, and critical systems (with RTO/RPO) lets freezes, limits, and exports apply deterministically and supports the security program and catastrophic-act response under [12 CFR Part 741](https://www.ecfr.gov/current/title-12/part-741) and [12 CFR §748.0–§748.2](https://www.ecfr.gov/current/title-12/part-748/section-748.0).
- **SYSTEM BEHAVIOR:** The registry enumerates in-scope items and their recovery targets as a versioned object. On any material change it is updated within 5 business days, approved, and published to all control engines (safe-mode, freeze, export) within 24 hours of approval so downstream controls bind to a single source of truth. Each entry carries `scope_registry.item.rto`/`scope_registry.item.rpo`; entries without targets fail attestation and block publication. Write access to the registry and its versions is restricted to the Chief Compliance Officer and Risk Engineering; publication is gated on a recorded approval.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Material change to in-scope products/channels/vendors/systems identified (`scope_registry.change_detected`) | Change description (`scope_registry.change_description`), affected entry (`scope_registry.version_id`), RTO/RPO (`scope_registry.item.rto`, `scope_registry.item.rpo`) | Updated registry entry (`scope_registry.entry_updated`) | 5 BD (enforced by `scope_registry.update_due_at`) |
  | Updated registry version approved (`scope_registry.version_approved`) | Approver identity (`scope_registry.approver_id`), version (`scope_registry.version_id`) | Registry published to control engines (`scope_registry.published`) | 24h from approval (enforced by `scope_registry.publish_due_at`) |
  | Periodic attestation due (`scope_registry.attested`) | Current registry (`scope_registry.version_id`), RTO/RPO completeness | Attestation record (`scope_registry.attested`) | Internal (enforced by `scope_registry.attestation_due`) |

- **ALERTS/METRICS:** Alert on registry versions awaiting publication past the 24-hour SLA and on entries missing RTO/RPO targets; target zero unpublished approved versions and zero entries failing attestation.

## RP-02 — Early-Warning Indicators

- **WHY (Reg cite):** Early detection of liquidity, capital/PCA, payment-failure, and CAMELS-proxy deterioration is core safety-and-soundness practice supporting timely conservatorship or liquidation action under [12 USC §1786](https://www.law.cornell.edu/uscode/text/12/1786), [12 USC §1787](https://www.law.cornell.edu/uscode/text/12/1787), and [12 CFR Part 741](https://www.ecfr.gov/current/title-12/part-741).
- **SYSTEM BEHAVIOR:** A ruleset evaluates registered early-warning indicators hourly during business hours and daily after hours, comparing each indicator value to its threshold. A breach shifts the institution into Prepared or Elevated posture, damped by a two-consecutive-interval rule so a single transient spike does not change posture. When two consecutive intervals breach, posture changes and a CEO summary is issued. Indicator definitions, thresholds, and the posture-change authority are write-restricted to the Chief Compliance Officer and Risk Engineering.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Scheduled indicator sweep runs (`ewi.sweep_completed`) | Indicator id (`ewi.indicator_id`), value (`ewi.value`), thresholds, prior breach state (`ewi.prior_breach_state`) | Evaluation recorded (`ewi.evaluated`) | Hourly business / daily after-hours (enforced by `ewi.sweep_due_at`) |
  | Indicator breaches threshold two consecutive intervals (`ewi.threshold_breached`) | Indicator id (`ewi.indicator_id`), trend (`ewi.trend`), history (`ewi.history`) | Posture change (`resolution_posture.changed`) + CEO summary (`ewi.ceo_summary_sent`) | — (internal: same interval; enforced by `ewi.summary_due_at`) |

- **ALERTS/METRICS:** Alert on missed sweeps and on any indicator in sustained breach without a recorded posture change; track breach-to-posture-change latency and target zero missed scheduled evaluations.

## RP-03 — Safe-Mode Transaction Controls

- **WHY (Reg cite):** Throttling outflows while preserving member access and critical inbound credits is a controlled protective measure consistent with the security program under [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748) and safety-and-soundness expectations under [12 CFR Part 741](https://www.ecfr.gov/current/title-12/part-741).
- **SYSTEM BEHAVIOR:** Activating safe mode sets a flag that imposes daily and per-transaction outbound caps, channel allowlists, and onboarding controls while preserving read-only member access. Each outbound transaction is evaluated against the active cap profile. Critical inbound credits — payroll and benefits — remain open and are never blocked by the safe-mode caps. Activation applies within 60 minutes of trigger and propagates to all processors within 30 minutes of the core change; processor confirmation is logged. The safe-mode flag and cap profiles are write-restricted to the Chief Compliance Officer with Risk Engineering execution; deactivation requires recorded authorization.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Safe-mode trigger condition met (`safe_mode.triggered`) | Trigger basis (`safe_mode.trigger_basis`), cap profile (`safe_mode.cap_profile_id`), allowlist (`cash.limits_whitelist.entry`) | Safe mode activated (`safe_mode.activated`) | 60 min (enforced by `safe_mode.activation_due_at`) |
  | Core safe-mode change committed (`safe_mode.activated`) | Cap profile (`safe_mode.cap_profile_id`), processor roster (`scope_registry.version_id`) | Processor propagation confirmed (`safe_mode.processor_confirmed`) | 30 min from core change (enforced by `safe_mode.propagation_due_at`) |
  | Outbound transaction presented under safe mode (`safe_mode.transaction_decided`) | Transaction amount (`transaction.amount`), per-tx and daily caps (`spend_controls.per_transaction_limit`, `spend_controls.daily_limit`), payroll/benefit flag (`overdraft.payroll_coverage_flag`) | Transaction decision (`safe_mode.transaction_decided`) | — (real-time) |
  | Deactivation authorized (`safe_mode.deactivation_authorized`) | Authorizer identity (`access.agent_identity`), basis (`safe_mode.trigger_basis`) | Safe mode disabled (`safe_mode.deactivated`) | — |

- **ALERTS/METRICS:** Alert when processor propagation exceeds 30 minutes, when any payroll/benefit inbound credit is blocked (target zero), and on daily-outflow totals approaching the cap; track activation latency distribution.

## RP-04 — Targeted Account Freeze

- **WHY (Reg cite):** Freezing specified accounts, blocking debits, and allowing only regulator-approved credits while honoring legal precedence supports orderly resolution powers under [12 USC §1787](https://www.law.cornell.edu/uscode/text/12/1787) and the security program under [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748).
- **SYSTEM BEHAVIOR:** On approval, the system freezes the specified member accounts or entities, blocks debits, and permits only regulator-approved credits, within 30 minutes of approval. The control honors legal garnishment precedence: where a garnishment or other legal process applies, that precedence resolves ahead of the freeze. Joint and fiduciary accounts are handled as edge cases — the freeze evaluates each owner/role before applying, and a legal conflict pauses application until precedence is resolved. Freeze approval, release approval, and the regulator-approved-credit list are write-restricted to the Chief Compliance Officer.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Targeted freeze approved (`account_freeze.approved`) | Account/entity scope (`account.id`), order reference (`account_freeze.order_reference`), legal process reference (`account_freeze.legal_process_reference`) | Freeze applied + debit block (`account_freeze.applied`) | 30 min from approval (enforced by `account_freeze.application_due_at`) |
  | Legal precedence detected on frozen account (`account_freeze.legal_conflict_detected`) | Legal process reference (`account_freeze.legal_process_reference`), joint/fiduciary roles (`loan_party.identity`) | Precedence resolved (`account_freeze.precedence_resolved`) | — |
  | Regulator-approved credit presented (`account_freeze.credit_presented`) | Credit amount (`inbound_payment.amount`), approval reference (`account_freeze.order_reference`) | Credit posted (`account_freeze.credit_posted`) | — (real-time) |
  | Freeze release approved (`account_freeze.release_approved`) | Release reference (`account_freeze.release_reference`), approver (`access.agent_identity`) | Freeze released (`account_freeze.released`) | — |

- **ALERTS/METRICS:** Alert when freeze application exceeds 30 minutes and on unresolved legal-precedence conflicts; target zero debits posting against a frozen account and zero non-approved credits posted.

## RP-05 — Institution-Wide Freeze

- **WHY (Reg cite):** Setting a global FROZEN state on Board emergency resolution or NCUA directive, with prompt notice and regulator confirmation, exercises the institution's resolution posture under [12 USC §1786](https://www.law.cornell.edu/uscode/text/12/1786) and [12 USC §1787](https://www.law.cornell.edu/uscode/text/12/1787).
- **SYSTEM BEHAVIOR:** On a Board emergency resolution or an NCUA directive, the system sets a global FROZEN state within 60 minutes, reconciles and settles in-flight transactions, publishes public and member notice within 2 hours, and records confirmation to the regulator. In-flight items are reconciled before settlement so the frozen ledger is reproducible. The order to freeze, the notice content, and regulator confirmation are write-restricted to the Chief Compliance Officer and Board; activation evidence is retained.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Board resolution or NCUA directive issued (`institution_freeze.ordered`) | Order reference (`institution_freeze.order_reference`), activation evidence (`institution_freeze.activation_evidence`) | Global FROZEN state activated (`institution_freeze.activated`) | 60 min (enforced by `institution_freeze.activation_due_at`) |
  | Freeze activated (`institution_freeze.activated`) | In-flight balances (`balances.inflight_balance`) | In-flight reconciled then settled (`institution_freeze.inflight_reconciled`, `institution_freeze.inflight_settled`) | — (internal: before notice) |
  | Freeze activated (`institution_freeze.activated`) | Notice content (`institution_freeze.notice_record`), member/public channels (`comms.contact_tree`) | Public/member notice published (`institution_freeze.notice_published`) | 2h (enforced by `institution_freeze.notice_due_at`) |
  | Notice published (`institution_freeze.notice_published`) | Regulator contacts (`regulator.contacts`), order reference (`institution_freeze.order_reference`) | Regulator confirmation recorded (`institution_freeze.regulator_confirmed`) | — (internal: 2h) |

- **ALERTS/METRICS:** Alert when FROZEN activation exceeds 60 minutes or notice exceeds 2 hours; target zero post-freeze unsettled in-flight items and confirm regulator notice was recorded for every freeze.

## RP-06 — Next-Business-Day Availability

- **WHY (Reg cite):** Preserving member access to balances, statements, claims instructions, and contact routing through a freeze or handover supports member-protection and share-insurance access expectations under [12 CFR Part 741](https://www.ecfr.gov/current/title-12/part-741) and [12 USC §1787](https://www.law.cornell.edu/uscode/text/12/1787).
- **SYSTEM BEHAVIOR:** Following a freeze or handover, the member portal/API exposes balance inquiry, statement download, claims instructions, and contact routing in a read-only mode by the next local business open. When the core is unavailable, the portal serves a snapshot so members retain visibility, and access is logged. Read-only activation, the claims template, and snapshot configuration are write-restricted to Risk Engineering under Compliance oversight.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Freeze or handover effective (`member_portal.readonly_activated`) | Claims template (`member_portal.claims_template_id`), core availability flag (`member_portal.core_unavailable`) | Read-only portal activated (`member_portal.readonly_activated`) | Next local business open (enforced by `member_portal.readonly_due_at`) |
  | Core unavailable at access time (`member_portal.snapshot_served`) | Snapshot as-of (`records_package.snapshot_as_of`), member identity (`member.identity_check_method`) | Snapshot served + access logged (`member_portal.access_logged`) | — (real-time) |
  | Member balance inquiry received (`balance.inquiry_received`) | Account id (`account.id`), disclosed balance (`balance.disclosed`) | Read-only access logged (`member_portal.access_logged`) | — (real-time) |

- **ALERTS/METRICS:** Alert if read-only availability is not confirmed by next local business open and on portal error rates during freeze/handover; track snapshot-serve latency and target 100% of in-scope read-only functions available by the deadline.

## RP-07 — Trustee/Conservator Handover

- **WHY (Reg cite):** Delivering a standardized handover packet and scoped trustee access on an NCUA appointment supports conservatorship and liquidating-agent powers under [12 USC §1786(h)](https://www.law.cornell.edu/uscode/text/12/1786), [12 USC §1787](https://www.law.cornell.edu/uscode/text/12/1787), and the involuntary-liquidation framework of [12 CFR Part 709](https://www.ecfr.gov/current/title-12/part-709).
- **SYSTEM BEHAVIOR:** On an NCUA appointment notice, the system generates and delivers a standardized handover packet and provisions scoped trustee access, with an initial version within 4 hours and full delivery within 24 hours. Trustee credentials are time-bounded and scoped to the appointment; trustee actions are logged. Handover packet contents, trustee access scope, and credential provisioning are write-restricted to the Chief Compliance Officer; access expires on a registered timer.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | NCUA appointment notice received (`handover.appointment_received`) | Appointment reference (`handover.appointment_reference`), trustee identity (`handover.trustee_identity`), access scope (`handover.access_scope`) | Initial packet delivered + scoped access provisioned (`handover.initial_packet_delivered`, `handover.trustee_access_provisioned`) | 4h (enforced by `handover.initial_due_at`) |
  | Initial packet delivered (`handover.initial_packet_delivered`) | Full records package (`records_package.artifact_id`), personnel roster (`handover.personnel_roster`) | Full packet delivered (`handover.full_packet_delivered`) | 24h (enforced by `handover.full_due_at`) |
  | Trustee performs scoped action (`handover.trustee_action_logged`) | Trustee credential id (`handover.trustee_credential_id`), action (`handover.trustee_action`) | Trustee action logged (`handover.trustee_action_logged`) | — (real-time) |
  | Trustee access window reached (`handover.access_updated`) | Access grant id (`handover.trustee_access_grant_id`) | Access expiry applied (`handover.access_updated`) | — (enforced by `handover.access_expiry_due`) |

- **ALERTS/METRICS:** Alert when the 4-hour initial or 24-hour full delivery SLA is missed and on trustee access remaining active past its expiry; target zero overdue handover deliverables.

## RP-08 — Records Preservation for Resolution

- **WHY (Reg cite):** Building a reproducible resolution records package with signed checksums and encrypted archives satisfies the records-preservation program under [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749) and supports liquidation/claims administration under [12 CFR Part 709](https://www.ecfr.gov/current/title-12/part-709) and [12 USC §1787](https://www.law.cornell.edu/uscode/text/12/1787).
- **SYSTEM BEHAVIOR:** On a resolution event the system assembles a Part 749-compliant records package — member/share/loan ledgers, ACH/card histories, GL, governance minutes, contracts, and BSA logs — with signed checksums and encrypted archives, started within 2 hours and completed within 24 hours, plus retained monthly snapshots for reproducibility. A failed verification reopens the build rather than delivering an incomplete package. Package contents, checksum chain, and snapshot schedule are write-restricted to Risk Engineering under Compliance oversight; the underlying retention schedules are governed by the Record Retention Policy.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Resolution event triggers package build (`records_package.build_started`) | Snapshot scope (`records_package.snapshot_as_of`), ledger/GL/BSA sources (`gl.balances`, `bsa_alert.id`) | Build started (`records_package.build_started`) | 2h (enforced by `records_package.start_due_at`) |
  | Package assembly completes (`records_package.completed`) | Manifest (`records_package.manifest_id`), checksum chain (`records_package.checksum_chain`), encrypted archive (`records_package.artifact_id`) | Package completed (`records_package.completed`) | 24h (enforced by `records_package.complete_due_at`) |
  | Checksum/integrity verification fails (`records_package.verification_failed`) | Failure reason (`records_package.failure_reason`), manifest (`records_package.manifest_id`) | Build reopened/rebuilt (`records_package.rebuilt`) | — (internal: within 24h build window) |
  | Monthly snapshot due (`records_package.snapshot_completed`) | Snapshot id (`records_package.snapshot_id`), as-of date (`records_package.snapshot_as_of`) | Snapshot retained (`records_package.snapshot_completed`) | Monthly (enforced by `records_package.snapshot_due`) |

- **ALERTS/METRICS:** Alert on build start exceeding 2 hours, completion exceeding 24 hours, any checksum-verification failure, and missed monthly snapshots; target zero failed verifications at delivery.

## RP-09 — Testing & Validation

- **WHY (Reg cite):** Semiannual failover drills, quarterly restore tests, and an annual trustee tabletop, with published reports and timely remediation, evidence a tested security and resilience program under [12 CFR §748.0–§748.2](https://www.ecfr.gov/current/title-12/part-748/section-748.0) and safety-and-soundness expectations under [12 CFR Part 741](https://www.ecfr.gov/current/title-12/part-741).
- **SYSTEM BEHAVIOR:** The program schedules and runs semiannual failover drills, quarterly restore tests, and an annual trustee tabletop against a sandbox baseline, publishing reports within 10 business days post-test and opening remediation for high-risk findings with a 30-day close target. Findings are tracked to closure with assigned owners. Test schedules, baselines, and finding dispositions are write-restricted to Risk Engineering under Compliance oversight; results are reported to governance.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Drill/restore/tabletop scheduled and run (`resolution_test.scheduled`, `resolution_test.completed`) | Test type (`resolution_test.type`), sandbox baseline (`resolution_test.sandbox_baseline`), plan (`resolution_test.plan_id`) | Test report published (`resolution_test.report_published`) | 10 BD post-test (enforced by `resolution_test.report_due_at`) |
  | High-risk finding identified (`resolution_test.finding_opened`) | Finding severity (`resolution_test.finding_severity`), remediation owner (`resolution_test.remediation_owner`) | Remediation closed (`resolution_test.finding_closed`) | 30 days for high-risk (enforced by `resolution_test.remediation_due_at`) |

- **ALERTS/METRICS:** Alert on overdue test reports and on high-risk findings approaching or past the 30-day remediation SLA; track on-time test completion rate and target zero overdue high-risk remediations.

## RP-10 — Governance & Review Cadence

- **WHY (Reg cite):** Maintaining a resolution RACI and exception register, conducting a quarterly operational review, and updating the policy on material change centralizes accountability consistent with [12 USC §1786](https://www.law.cornell.edu/uscode/text/12/1786), [12 CFR Part 741](https://www.ecfr.gov/current/title-12/part-741), and [12 CFR §748.2](https://www.ecfr.gov/current/title-12/part-748/section-748.2).
- **SYSTEM BEHAVIOR:** Governance maintains a resolution RACI and an exception register, conducts a quarterly operational review completed by day 20 of the review cycle, and updates the policy within 30 days of any material change. Exceptions are time-bounded and tracked to expiry. The RACI, exception register, and policy version are write-restricted to the Chief Compliance Officer, with Internal Audit testing effectiveness; required participants are the Board, CEO, Risk Engineering, IT/DevOps, Communications, and the BSA/AML Officer.
- **EVENTS:**

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Quarterly review cycle opens (`governance.board_cycle_opened`) | RACI (`policy.owner_ref`), exception register (`resolution_exception.requested`), prior findings | Quarterly review completed (`resolution_review.completed`) | By day 20 of cycle (enforced by `resolution_review.due`) |
  | Material change to the framework declared (`strategy.material_change_declared`) | Change description (`resolution_policy.change_description`) | Policy updated (`resolution_policy.updated`) | 30 days (enforced by `resolution_policy.update_due_at`) |
  | Resolution exception requested (`resolution_exception.requested`) | Rationale (`resolution_exception.description`), expiry (`resolution_exception.expires_at`) | Exception decision recorded (`resolution_exception.decided`) | — (expiry tracked) |

- **ALERTS/METRICS:** Alert on quarterly reviews not completed by day 20, policy updates past 30 days from a material change, and expiring or expired exceptions; target zero overdue reviews and zero stale exceptions.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for the resolution framework, the RACI, the exception register, and policy maintenance.
- **Approver:** Patrick Wilson, Chief Compliance Officer.
- **Required participants:** Board (emergency resolutions, institution-wide freeze authorization), CEO, Risk Engineering (control engines, packages, testing), IT/DevOps (failover/restore), Communications (member/public notice), BSA/AML Officer (BSA log preservation interface).
- **Independent assurance:** Internal Audit tests control effectiveness.
- **Review cadence:** Quarterly operational review completed by day 20 of the cycle ([RP-10](#rp-10-governance-and-review-cadence)); full policy review at least annually (next review per front-matter) and within 30 days of any material change.
- **Cross-references:** Liquidity Policy (pre-resolution EWI, contingency funding, liquidity triggers); Capitalization Policy (PCA tiers driving resolution activation); Business Continuity Plan (going-concern DR); Record Retention Policy (retention schedules behind [RP-08](#rp-08-records-preservation-for-resolution)); BSA Policy (SAR/CTR preservation mechanics); Third-Party Risk Policy (vendor continuity through receivership).

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is provisional.** Several resolution-side codes referenced in the control overlays are not yet registered in the parsed core vocabulary and use the agreed target/provisional naming scheme; they are listed here collectively and will be confirmed by engineering before the next review. Notably: `scope_registry.attested`/`scope_registry.attestation_due` (attestation event/timer reuse), `safe_mode.deactivation_authorized`, `account_freeze.released` (provisional), `institution_freeze.notice_template_id` (provisional), `resolution_exception.description`/`resolution_exception.expires_at` (provisional), `resolution_review.due_at` (provisional), and `resolution_test.schedule`/`resolution_test.type` (provisional). Where a registered code exists it has been reused (e.g., `records_package.*`, `handover.*`, `safe_mode.*`, `ewi.*`, `institution_freeze.*`, `member_portal.*`).
- **Charter and NCUA applicability assumed.** This policy assumes Pynthia Credit Union is a federally insured credit union for which NCUA conservatorship/liquidation (12 USC §1786(h), §1787) and NCUA Parts 709, 741, 748, and 749 apply. If the credit union is state-chartered, the applicable state resolution regime and any state-law garnishment precedence ([RP-04](#rp-04-targeted-account-freeze)) must be confirmed and mapped.
- **Part 708b (assisted/emergency mergers) not anchored to a control.** The AUTHORITY_HINTS list NCUA Part 708b as a resolution contingency, but PATRICK_NOTES define no merger-execution control. It is intentionally left unanchored; confirm whether an emergency-merger contingency control should be added, or whether merger execution is owned elsewhere.
- **Posture taxonomy ("Prepared"/"Elevated") needs confirmation.** [RP-02](#rp-02-early-warning-indicators) assumes a two-level escalation taxonomy and the two-consecutive-interval damping rule as stated in PATRICK_NOTES; the exact indicator set, thresholds, and CAMELS-proxy definitions are owned by the Liquidity and Capitalization policies and must be reconciled to avoid drift.
- **Regulator-approved-credit and garnishment-precedence rules** in [RP-04](#rp-04-targeted-account-freeze) assume a documented legal-precedence ruleset and an approved-credit list maintained by Compliance/Legal; the source of truth and joint/fiduciary handling logic need legal confirmation.
- **Reference policy (BoA / FDIC handbook) is non-binding context only.** The Dodd-Frank Title I / FDIC receivership material describes a bank-holding-company and FDIC regime that does not govern a credit union; it informed structure but no requirement was imported from it.
