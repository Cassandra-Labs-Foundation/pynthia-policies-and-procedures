---
title: Resolution Policy (Table-First, Design-Overlay v2)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-16
next_review: 2027-06-16
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Resolution, Wind-Down, Conservatorship, Continuity]
---

# Resolution Policy

## General Policy Statement

Pynthia Credit Union maintains a minimal, testable resolution framework to protect member funds and ensure orderly continuity, handover, or wind-down under stress. The institution detects deterioration early, throttles outflows without cutting members off, freezes accounts or the institution as directed, hands a clean and reproducible operating environment to a trustee or conservator, and restores member-facing services by the next business day where feasible. This policy applies to all products, channels, partners, and systems enumerated in the scope registry and integrates with the Business Continuity, Information Security, and BSA/AML control sets. Pre-resolution liquidity triggers, PCA capital tiers, going-concern disaster recovery, underlying retention schedules, SAR/CTR preservation mechanics, and vendor receivership continuity are governed by their respective policies and are out of scope here.

## Timing Matrix  {#timing-matrix}

| Scenario | Trigger (human → event) | Deadline | Content Reference | Control |
|---|---|---:|---|---|
| Scope registry change published to engines | Registry version approved (`scope_registry.version_approved`) | 24 hours (update: 5 BD) | In-scope products, channels, critical vendors/systems with RTO/RPO | [RP-01](#rp-01-policy-scope-registry) |
| Early-warning threshold breaches | Indicator value crosses threshold twice consecutively (`ewi.threshold_breached`) | Posture change same evaluation cycle | Posture shift to Prepared/Elevated | [RP-02](#rp-02-early-warning-indicators) |
| Safe-mode triggered | Posture/decision triggers safe mode (`safe_mode.triggered`) | 60 min to apply; 30 min processor propagation | Outbound caps, channel allowlist, onboarding controls | [RP-03](#rp-03-safe-mode-transaction-controls) |
| Targeted account freeze approved | Freeze approval recorded (`account_freeze.approved`) | 30 minutes | Debit block, regulator-approved credits, garnishment precedence | [RP-04](#rp-04-targeted-account-freeze) |
| Institution-wide freeze ordered | Board emergency resolution / NCUA directive (`institution_freeze.ordered`) | 60 min freeze; 2 hr public notice | Global FROZEN state, member notice, regulator confirmation | [RP-05](#rp-05-institution-wide-freeze) |
| Freeze or handover affects member access | Freeze/handover in effect; core unavailable (`member_portal.readonly_activated`) | Next local business open | Balance, statements, claims instructions, contact routing | [RP-06](#rp-06-next-business-day-availability) |
| NCUA appointment of conservator/trustee | Appointment notice received (`handover.appointment_received`) | 4 hr initial; 24 hr full | Standardized handover packet, scoped trustee access | [RP-07](#rp-07-trusteeconservator-handover) |
| Resolution records package required | Package build requested (`records_package.build_started`) | 2 hr start; 24 hr complete | Ledgers, ACH/card histories, GL, minutes, contracts, BSA logs | [RP-08](#rp-08-records-preservation-for-resolution) |
| Scheduled or completed resolution test | Test completed (`resolution_test.completed`) | Report 10 BD; remediate high-risk 30 days | Failover/restore/tabletop reports and remediation | [RP-09](#rp-09-testing-and-validation) |
| Material change or quarterly review | Material change identified (`resolution_policy.updated`) | Policy update 30 days; quarterly review by day 20 | RACI, exception register, review record | [RP-10](#rp-10-governance-and-review-cadence) |

## RP-01 — Policy Scope Registry  {#rp-01-policy-scope-registry}

- **WHY (Reg cite):** A machine-readable scope registry makes freezes, limits, and exports deterministic across products, channels, and critical vendors/systems, satisfying the security-program and safety-and-soundness expectations of [12 CFR Part 748 §748.0–§748.2](https://www.ecfr.gov/current/title-12/part-748) and [12 CFR Part 741](https://www.ecfr.gov/current/title-12/part-741).
- **SYSTEM BEHAVIOR:** The registry enumerates in-scope products, channels, critical vendors, and critical systems, each carrying RTO/RPO targets, under a versioned record. Any material change must be reflected within 5 business days of detection and, once a version is approved, published to all downstream control engines within 24 hours so that safe-mode caps, freezes, and records exports resolve against a single authoritative inventory. Registry version approval and attestation are write-restricted to Compliance; the published version is read-only to control engines.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Material change to in-scope inventory detected (`scope_registry.change_detected`) | Change description (`scope_registry.change_description`), affected item RTO/RPO (`scope_registry.item.rto`, `scope_registry.item.rto`) | Updated registry entry (`scope_registry.entry_updated`) | 5 BD (enforced by `scope_registry.update_due_at`) |
  | Registry version approved for release (`scope_registry.version_approved`) | Version id (`scope_registry.version_id`), approver (`scope_registry.approver_id`) | Published registry pushed to engines (`scope_registry.published`) | 24 hr (enforced by `scope_registry.publish_due_at`) |
  | Periodic registry attestation comes due (`scope_registry.attested`) | Current version (`scope_registry.version_id`), approver (`scope_registry.approver_id`) | Attestation record (`scope_registry.attested`) | per schedule (enforced by `scope_registry.attestation_due`) |

- **ALERTS/METRICS:** Alert on any approved version not published within 24 hours and on attestations aging past due; target zero unpublished approved versions and zero stale registry entries beyond the 5-business-day window.

## RP-02 — Early-Warning Indicators  {#rp-02-early-warning-indicators}

- **WHY (Reg cite):** Early detection of liquidity, capital/PCA, payment-failure, and CAMELS-proxy deterioration is the trigger surface for conservatorship/liquidation powers under [FCUA §1786 / §1787](https://www.law.cornell.edu/uscode/text/12/1786) and supports the safety-and-soundness posture of [12 CFR Part 741](https://www.ecfr.gov/current/title-12/part-741).
- **SYSTEM BEHAVIOR:** A ruleset evaluates registered indicators hourly during business hours and daily after hours, comparing each value to its thresholds and damping noise with a two-consecutive-interval confirmation rule before shifting the institution into Prepared or Elevated posture. A breach that recovers before the second interval does not move posture, and a recovery after a confirmed breach steps posture back down. Threshold definitions and posture-change authority are write-restricted to Compliance and Risk Engineering; indicator history is read-only to monitoring.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Indicator evaluation cycle runs (`ewi.sweep_completed`) | Indicator id (`ewi.indicator_id`), value (`ewi.value`), thresholds (`ewi.thresholds`), prior breach state (`ewi.prior_breach_state`) | Evaluation record + sweep close (`ewi.sweep_completed`) | hourly (BH) / daily (AH) (enforced by `ewi.sweep_due_at`) |
  | Threshold crosses on two consecutive intervals (`ewi.threshold_breached`) | Indicator history (`ewi.history`), thresholds (`ewi.thresholds`) | Posture shift to Prepared/Elevated (`resolution_posture.changed`) | same cycle (—) |
  | Major or spike event flagged for escalation (`ewi.spike_flagged`) | Indicator id (`ewi.indicator_id`), trend (`ewi.trend`) | CEO summary issued (`ewi.ceo_summary_sent`) | per cycle (enforced by `ewi.summary_due_at`) |

- **ALERTS/METRICS:** Alert on any confirmed threshold breach and on missed evaluation cycles (sweep not completed on schedule); track posture-change latency and the count of breaches damped by the two-interval rule versus those that escalated.

## RP-03 — Safe-Mode Transaction Controls  {#rp-03-safe-mode-transaction-controls}

- **WHY (Reg cite):** Throttling outbound flow while preserving member access is a security-program control under [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748), enabling orderly stress management without cutting members off.
- **SYSTEM BEHAVIOR:** A safe-mode flag, when set, applies a cap profile that enforces daily and per-transaction outbound limits, a channel allowlist, and onboarding controls while preserving read-only member access. Critical inbound credits such as payroll and benefits remain open and are never blocked by the cap profile. The flag is applied within 60 minutes of trigger and propagated to all processors within 30 minutes of the core change. Safe-mode activation, the cap profile, and the limits whitelist are write-restricted to Compliance and Risk Engineering; whitelist entries carry a sunset and revert automatically.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Safe mode triggered by posture or decision (`safe_mode.triggered`) | Trigger basis (`safe_mode.trigger_basis`), cap profile (`safe_mode.cap_profile_id`) | Safe-mode activated (`safe_mode.activated`) | 60 min (enforced by `safe_mode.activation_due_at`) |
  | Core safe-mode change committed (`safe_mode.activated`) | Cap profile (`safe_mode.cap_profile_id`), processor roster (registered in scope registry) | Processor propagation confirmed (`safe_mode.processor_confirmed`) | 30 min (enforced by `safe_mode.propagation_due_at`) |
  | Outbound transaction evaluated under safe mode (`safe_mode.transaction_decided`) | Transaction amount (`transaction.amount`), daily outflow total (`safe_mode.daily_outflow_total`), allowlist/whitelist (`cash.limits_whitelist.entry`) | Decision recorded; critical inbound credit posted (`account_freeze.credit_posted`) | real-time (—) |

- **ALERTS/METRICS:** Alert if propagation to any processor exceeds 30 minutes or activation exceeds 60 minutes; monitor blocked-vs-allowed outbound counts and confirm zero blocked payroll/benefit inbound credits.

## RP-04 — Targeted Account Freeze  {#rp-04-targeted-account-freeze}

- **WHY (Reg cite):** Freezing specified accounts while honoring legal precedence supports liquidating-agent/conservator powers under [FCUA §1787](https://www.law.cornell.edu/uscode/text/12/1787) and the security program under [12 CFR Part 748](https://www.ecfr.gov/current/title-12/part-748).
- **SYSTEM BEHAVIOR:** On recorded approval, the system freezes the specified member accounts or entities, blocks debits, and allows only regulator-approved credits, completing within 30 minutes of approval. Legal garnishment precedence is honored where a competing legal process exists, and joint or fiduciary accounts are resolved against their precedence rules before the block is applied. Freeze approval, release approval, and the legal-process precedence resolution are write-restricted to Compliance and Legal.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Targeted freeze approved (`account_freeze.approved`) | Order reference (`account_freeze.order_reference`), target account (`account.id`) | Freeze applied with debit block (`account_freeze.applied`) | 30 min (enforced by `account_freeze.application_due_at`) |
  | Competing legal process present at freeze (`account_freeze.legal_conflict_detected`) | Legal process reference (`account_freeze.legal_process_reference`) | Precedence resolved (`account_freeze.precedence_resolved`) | at freeze time (—) |
  | Regulator-approved credit presented to frozen account (`account_freeze.credit_presented`) | Order reference (`account_freeze.order_reference`), amount (`transaction.amount`) | Credit posted (`account_freeze.credit_posted`) | real-time (—) |

- **ALERTS/METRICS:** Alert on any freeze not applied within 30 minutes of approval and on any debit that posts to a frozen account; target zero precedence-resolution exceptions left unhandled.

## RP-05 — Institution-Wide Freeze  {#rp-05-institution-wide-freeze}

- **WHY (Reg cite):** A global freeze on Board emergency resolution or NCUA directive, with prompt public and regulator notice, is grounded in conservatorship/liquidation authority under [FCUA §1786 / §1787](https://www.law.cornell.edu/uscode/text/12/1786).
- **SYSTEM BEHAVIOR:** On a Board emergency resolution or NCUA directive, the institution is set to a global FROZEN state within 60 minutes, public and member notice is published within 2 hours, and confirmation is sent to the regulator. In-flight transactions present at the moment of freeze are reconciled and settled or returned under the frozen-state rules rather than left ambiguous. Ordering the institution-wide freeze and publishing the public notice are write-restricted to the Board/CEO and Compliance.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Board emergency resolution or NCUA directive issued (`institution_freeze.ordered`) | Order reference (`institution_freeze.order_reference`), activation evidence (`institution_freeze.activation_evidence`) | Global FROZEN state activated (`institution_freeze.activated`) | 60 min (enforced by `institution_freeze.activation_due_at`) |
  | Freeze activated and notice required (`institution_freeze.activated`) | Notice record (`institution_freeze.notice_record`), notice template (`institution_freeze.notice_template_id`) | Public/member notice published (`institution_freeze.notice_published`) | 2 hr (enforced by `institution_freeze.notice_due_at`) |
  | In-flight transactions present at freeze (`institution_freeze.inflight_reconciled`) | In-flight balance (`balances.inflight_balance`) | Settled/returned and regulator confirmed (`institution_freeze.regulator_confirmed`) | post-freeze (—) |

- **ALERTS/METRICS:** Alert if FROZEN state is not reached within 60 minutes or public notice within 2 hours; confirm regulator acknowledgement received and track in-flight items reconciled to zero unresolved.

## RP-06 — Next-Business-Day Availability  {#rp-06-next-business-day-availability}

- **WHY (Reg cite):** Continued member access to balances, statements, claims instructions, and contact routing during freeze or handover protects share-insurance access and continuity expectations under [12 CFR Part 741](https://www.ecfr.gov/current/title-12/part-741) and [FCUA §1787](https://www.law.cornell.edu/uscode/text/12/1787).
- **SYSTEM BEHAVIOR:** Following a freeze or handover, the member portal/API must support balance inquiry, statement download, claims instructions, and contact routing by the next local business open, operating read-only against a served snapshot if the core is unavailable. Member time zone determines the applicable next-open deadline. The read-only snapshot and claims-instruction template are write-restricted to Compliance and IT/DevOps.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Core unavailable following freeze/handover (`member_portal.readonly_activated`) | Core-unavailable flag (`member_portal.core_unavailable`), claims template (`member_portal.claims_template_id`), member timezone (`member.timezone`) | Read-only snapshot served (`member_portal.snapshot_served`) | next local business open (enforced by `member_portal.readonly_due_at`) |
  | Member accesses read-only portal (`member_portal.access_logged`) | Member id (`member.id`), balance disclosed (`balance.disclosed`) | Access logged (`member_portal.access_logged`) | real-time (—) |
  | Member balance inquiry received (`balance.inquiry_received`) | Member id (`member.id`) | Balance returned (`balance.disclosed`) | real-time (—) |

- **ALERTS/METRICS:** Alert if read-only availability is not restored by the member's next local business open; track portal availability percentage and read-only access latency during freeze/handover windows.

## RP-07 — Trustee/Conservator Handover  {#rp-07-trusteeconservator-handover}

- **WHY (Reg cite):** A standardized handover packet and scoped trustee access on NCUA appointment operationalize conservatorship/liquidation transfer under [FCUA §1786(h)](https://www.law.cornell.edu/uscode/text/12/1786) and [§1787](https://www.law.cornell.edu/uscode/text/12/1787), with claims/payout mechanics under [12 CFR Part 709](https://www.ecfr.gov/current/title-12/part-709).
- **SYSTEM BEHAVIOR:** On receipt of an NCUA appointment notice, the system generates and delivers an initial handover packet within 4 hours and full delivery within 24 hours, and provisions scoped trustee access tied to the appointment. Trustee access carries an expiry and is read-restricted to the appointment scope; provisioning, packet delivery, and access expiry are write-restricted to Compliance and IT/DevOps.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | NCUA appointment notice received (`handover.appointment_received`) | Appointment reference (`handover.appointment_reference`), trustee identity (`handover.trustee_identity`) | Initial handover packet delivered (`handover.initial_packet_delivered`) | 4 hr (enforced by `handover.initial_due_at`) |
  | Initial packet delivered, full packet due (`handover.initial_packet_delivered`) | Personnel roster (`handover.personnel_roster`), access scope (`handover.access_scope`) | Full packet delivered + trustee access provisioned (`handover.full_packet_delivered`) | 24 hr (enforced by `handover.full_due_at`) |
  | Trustee acts under scoped access (`handover.trustee_action_logged`) | Trustee credential (`handover.trustee_credential_id`), access grant (`handover.trustee_access_grant_id`) | Trustee action logged; access expiry set (`handover.access_updated`) | grant lifetime (enforced by `handover.access_expiry_due`) |

- **ALERTS/METRICS:** Alert if the initial packet misses 4 hours or the full packet misses 24 hours, and on any trustee access surviving past its expiry; target zero late deliveries and zero orphaned trustee grants.

## RP-08 — Records Preservation for Resolution  {#rp-08-records-preservation-for-resolution}

- **WHY (Reg cite):** A reproducible, signed, encrypted resolution records package is required by the records-preservation program under [12 CFR Part 749](https://www.ecfr.gov/current/title-12/part-749), supporting claims and liquidation under [12 CFR Part 709](https://www.ecfr.gov/current/title-12/part-709) and [FCUA §1787](https://www.law.cornell.edu/uscode/text/12/1787).
- **SYSTEM BEHAVIOR:** When a package build is requested, the system assembles a Part 749-compliant package — member/share/loan ledgers, ACH/card histories, GL, governance minutes, contracts, and BSA logs — with signed checksums and encrypted archives, starting within 2 hours and completing within 24 hours, and retains monthly snapshots independently of any live build. If a verification step fails, the package is rebuilt against the recorded snapshot rather than partially delivered. Snapshot scheduling and checksum signing are write-restricted to Compliance and IT/DevOps; the archive is read-restricted to the resolution handover scope.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Resolution records package requested (`records_package.build_started`) | Snapshot as-of (`records_package.snapshot_as_of`), manifest (`records_package.manifest_id`) | Build started (`records_package.build_started`) | 2 hr (enforced by `records_package.start_due_at`) |
  | Package assembly proceeds to completion (`records_package.completed`) | Checksum chain (`records_package.checksum_chain`), artifact (`records_package.artifact_id`) | Signed, encrypted package completed (`records_package.completed`) | 24 hr (enforced by `records_package.complete_due_at`) |
  | Monthly retained snapshot comes due (`records_package.snapshot_completed`) | Snapshot id (`records_package.snapshot_id`), schedule (`records_package.snapshot_schedule`) | Snapshot completed and retained (`records_package.snapshot_completed`) | monthly (enforced by `records_package.snapshot_due`) |
  | Verification step fails during build (`records_package.verification_failed`) | Failure reason (`records_package.failure_reason`), rebuilt flag (`records_package.rebuilt`) | Package rebuilt from snapshot (`records_package.completed`) | within build SLA (—) |

- **ALERTS/METRICS:** Alert on start exceeding 2 hours, completion exceeding 24 hours, any checksum verification failure, and any missed monthly snapshot; target zero failed builds delivered and 100% checksum-verified archives.

## RP-09 — Testing & Validation  {#rp-09-testing-and-validation}

- **WHY (Reg cite):** Semiannual failover drills, quarterly restore tests, and an annual trustee tabletop with timely reporting and remediation evidence the security-program testing duty under [12 CFR §748.0–§748.2](https://www.ecfr.gov/current/title-12/part-748) and general safety-and-soundness expectations.
- **SYSTEM BEHAVIOR:** The program runs semiannual failover drills, quarterly restore tests, and an annual trustee tabletop against a sandbox baseline, publishes the report within 10 business days post-test, and remediates high-risk findings within 30 days. Findings opened by a test are tracked to closure and re-tested where the finding warrants. Test scheduling, report publication, and finding closure are write-restricted to Compliance and Risk Engineering.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Resolution test completed (`resolution_test.completed`) | Test type (`resolution_test.type`), sandbox baseline (`resolution_test.sandbox_baseline`) | Report published (`resolution_test.report_published`) | 10 BD (enforced by `resolution_test.report_due_at`) |
  | High-risk finding opened by test (`resolution_test.finding_opened`) | Finding id (`resolution_test.finding_id`), severity (`resolution_test.finding_severity`), owner (`resolution_test.remediation_owner`) | Remediation closed (`resolution_test.finding_closed`) | 30 days (enforced by `resolution_test.remediation_due_at`) |
  | Scheduled test cycle opens (`resolution_test.scheduled`) | Plan id (`resolution_test.plan_id`), type (`resolution_test.type`) | Test scheduled (`resolution_test.scheduled`) | per cadence (—) |

- **ALERTS/METRICS:** Alert on reports not published within 10 business days and high-risk findings open beyond 30 days; track on-time test cadence (semiannual/quarterly/annual) and remediation aging by severity.

## RP-10 — Governance & Review Cadence  {#rp-10-governance-and-review-cadence}

- **WHY (Reg cite):** A resolution RACI, exception register, quarterly operational review, and 30-day post-change policy update satisfy governance and security-program review duties under [FCUA](https://www.law.cornell.edu/uscode/text/12/chapter-14), [12 CFR Part 741](https://www.ecfr.gov/current/title-12/part-741), and [12 CFR §748.2](https://www.ecfr.gov/current/title-12/part-748/section-748.2).
- **SYSTEM BEHAVIOR:** The program maintains a resolution RACI and exception register, conducts a quarterly operational review completed by day 20, and updates the policy within 30 days of any material change. Exceptions carry an expiry and revert automatically when not renewed. Policy approval, RACI maintenance, and exception decisions are write-restricted to the Chief Compliance Officer and the Board.

  | When | What's needed | Produced (and logged) | Within |
  |---|---|---|---|
  | Quarterly operational review comes due (`resolution_review.completed`) | RACI registry (`policy.raci_registry`), exception register (`resolution_exception.description`) | Review completed (`resolution_review.completed`) | by day 20 (enforced by `resolution_review.due`) |
  | Material change to resolution framework identified (`resolution_policy.updated`) | Change description (`resolution_policy.change_description`) | Policy updated (`resolution_policy.updated`) | 30 days (enforced by `resolution_policy.update_due_at`) |
  | Resolution exception requested (`resolution_exception.decided`) | Description (`resolution_exception.description`), expiry (`resolution_exception.expires_at`) | Exception decision recorded (`resolution_exception.decided`) | at decision (enforced by `resolution_exception.expires_at`) |

- **ALERTS/METRICS:** Alert on quarterly reviews not completed by day 20, policy updates open beyond 30 days post-change, and exceptions past expiry; target zero overdue reviews and zero expired-but-active exceptions.

## Governance & Sign-Off  {#governance}

- **Owner:** Patrick Wilson, Chief Compliance Officer — accountable for the resolution framework, RACI, and exception register.
- **Approvers:** Patrick Wilson, Chief Compliance Officer.
- **Required participants:** Board, CEO, Risk Engineering, IT/DevOps, Communications, and the BSA/AML Officer, engaged per the resolution RACI; Internal Audit independently tests control effectiveness.
- **Review cadence:** Quarterly operational review completed by day 20 ([RP-10](#rp-10-governance-and-review-cadence)); full policy review at least annually (`next_review` above) and within 30 days of any material change.
- **Cross-references:** Pre-resolution liquidity triggers → Liquidity Policy; PCA capital tiers → Capitalization Policy; going-concern continuity/DR → Business Continuity Plan; underlying retention schedules → Record Retention Policy; SAR/CTR preservation mechanics → BSA Policy; vendor receivership continuity → Third-Party Risk Policy.

## Assumptions & Gaps  {#assumptions}

- **Engineering vocabulary is partially provisional.** Most resolution-side resources, fields, events, and timers referenced above (e.g., `scope_registry.*`, `ewi.*`, `safe_mode.*`, `account_freeze.*`, `institution_freeze.*`, `member_portal.*`, `handover.*`, `records_package.*`, `resolution_test.*`, `resolution_policy.*`, `resolution_review.*`, `resolution_exception.*`) ARE registered in the parsed `core-vocabulary.json`. A small number used here are not registered as exact codes and follow the agreed target naming — notably `institution_freeze.notice_template_id` and `balances.inflight_balance` (provisional spellings) — and will be confirmed by engineering before the next review.
- **Charter and applicability.** This policy treats Pynthia as an NCUA-insured credit union and applies FCUA §1786/§1787, Parts 709/741/748/749, and Part 708b accordingly; if the charter or insured status differs, the authority map must be re-confirmed.
- **Posture model.** "Prepared" and "Elevated" postures and the specific indicator set (liquidity, net-outflow, capital/PCA, payment-failure, CAMELS-proxy) are assumed to be defined in the EWI ruleset configuration; exact thresholds and the business-hours boundary for hourly-vs-daily evaluation need engineering/Compliance confirmation.
- **Processor roster.** The set of "all processors" for safe-mode propagation (RP-03) is assumed to be the critical-vendor entries in the scope registry; if processors are tracked elsewhere, the propagation target must be reconciled.
- **Regulator-approved credit definition.** The basis on which a credit is deemed "regulator-approved" during a targeted or institution-wide freeze (RP-04, RP-05) is assumed to be carried on the freeze order reference; the approval evidence format needs confirmation.
- **Part 708b emergency assisted merger.** Cited in AUTHORITY_HINTS as a resolution contingency but not anchored to a dedicated control here, as PATRICK_NOTES scope it as a contingency rather than a built mechanic; if a merger pathway control is required, a new control (RP-11) should be added at next review.
- **Records package contents and retention period.** RP-08 enumerates package contents from PATRICK_NOTES; the underlying retention schedule and monthly-snapshot retention duration are governed by the Record Retention Policy and are assumed, not restated here.
