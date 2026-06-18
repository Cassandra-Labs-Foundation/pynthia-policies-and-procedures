---
title: Cash Policy (Narrative)
owner: Patrick Wilson, Chief Compliance Officer
version: v1.0
effective: 2026-06-18
next_review: 2027-06-18
approvers:
  - Patrick Wilson, Chief Compliance Officer
tags: [Compliance, Cash, Operations, BSA, Dual-Control, narrative]
format: narrative
---

## Overview

Pynthia Credit Union maintains a unified Cash Policy that governs every aspect of how physical currency and cash-equivalent devices are received, held, moved, and reconciled across the organization. This policy merges what were formerly two separate programs — Cash Control and Cash Management — into a single, coherent framework. The risk in this program is concentrated wherever currency touches the institution: teller drawers, main and back-up vaults, ATMs and interactive teller machines, cash recyclers, night depositories, petty-cash funds, and cash shipments via armored courier. Because Pynthia's cash exposure exists in multiple physical locations staffed by employees with varying levels of direct handling responsibility, the policy's central tools are quantified limits, mandatory dual-custodian controls, same-day reconciliation to the general ledger, and a direct link from cash-handling exceptions into the BSA/AML governance cadence. The Board retains ultimate accountability and must affirmatively approve the limits schedule, seasonal deviations, and any material changes to the program.

---

## Regulatory Framework

Pynthia is a federally chartered credit union, and the foundational authority for this policy is the Federal Credit Union Act. The Act charges the Board of Directors with ultimate responsibility for safety-and-soundness over all credit union assets. That duty is operationalized through a series of more specific NCUA rules: the security program rule, which requires written procedures for vault access, ATM operations, dual control, robbery prevention, and night-deposit handling at every branch facility; the supervisory committee audit rule, which mandates that the Supervisory Committee perform or commission surprise cash verifications and report findings to the Board; and the fidelity bond rule, which conditions adequate bond coverage on the maintenance of dual-control procedures and requires that bond limits be adjusted whenever cash exposure increases temporarily.

The Bank Secrecy Act and its implementing AML program rule apply directly to Pynthia's cash operations. The AML program rule requires a board-approved program with internal controls, ongoing employee training, independent testing, and a designated compliance officer. Because physical currency is the primary mechanism through which structuring, layering, and other suspicious activity occurs, cash-handling controls — including over/short tracking, shipment verification, and seal-integrity checks — are treated as internal controls within the BSA program. Anomalies detected by the cash program must flow into the BSA/AML governance cadence, not sit in an isolated operations log.

The NCUA records preservation rule specifies retention schedules for the evidence this policy generates: reconciliation packs, count sheets, dual-control logs, device load sheets, keybox access logs, shipment manifests, deviation memos, and training records. These retention requirements are the floor; they do not supersede any legal hold or examination-related preservation obligation.

Taken together, these authorities converge on a common theme: cash is a high-risk asset that must be controlled at every point of contact, documented fully, and reported upward on a cadence that allows the Board and its Supervisory Committee to exercise meaningful oversight.

---

## Governance and Delegation {#governance-and-delegation}

The Board of Directors holds ultimate accountability for the Cash Policy. It approves the policy itself, the limits schedule that specifies the maximum cash allowed at each asset and in total as a percentage of total assets, and any deviations from those limits. The Board receives a quarterly summary of cash-risk key risk indicators and exception register status as part of the standing BSA/AML governance package; this ensures that cash risk is visible at the governance level on the same cadence as other AML indicators.

Day-to-day program ownership sits with the Chief Compliance Officer, who maintains the exception register, publishes the monthly KPI/KRI dashboard, and escalates material issues — including enterprise-limit breaches and unresolved variances — to the Board on the same day they occur. The BSA Officer attests to the exception log at each quarterly governance cycle and is the designated liaison for BSA independent testing of cash controls. Operations and Treasury/Finance are required participants in daily enforcement; branch managers are accountable for site-level compliance with limits and dual-control requirements.

The policy is reviewed annually. An out-of-cycle review is triggered by any material cash loss or fraud event, an NCUA or BSA examination finding related to cash, the addition of a new cash-handling technology or channel, or a limits breach requiring Board deviation.

---

## Scope and Applicability {#scope-and-applicability}

Every employee who handles cash — tellers, vault custodians, branch managers, operations and accounting staff, armored-courier liaisons, and ATM/ITM custodians — is covered by this policy. Every location where cash is received, held, moved, or reconciled is covered: all branches, the operations center, ATMs, interactive teller machines, cash recyclers, and night depositories.

The scope registry is a living document. Before any new cash asset — a new branch, a new ATM, a new cash recycler — goes live, it must be added to the registry and attested by the Chief Compliance Officer. The same requirement applies when a new employee role is assigned cash-handling responsibilities. This pre-go-live attestation requirement reflects the NCUA security program expectation that the written program cover all facilities before operations begin, not after.

For sites that are too small to staff two eligible employees at all times — making standard dual control operationally impractical — a compensating-review memo is attached to the scope entry and reviewed at the quarterly governance cycle. The compensating measures must be documented before the site opens, not discovered during examination.

---

## Enterprise Cash Limit {#enterprise-cash-limit}

The Board approves a maximum total-cash-to-total-assets percentage, called the enterprise limit. This limit ensures that Pynthia's aggregate cash position does not exceed what the fidelity bond covers and does not represent an imprudent concentration of idle, at-risk assets.

The enterprise cash position is computed daily. When the position reaches 90 percent of the board-approved limit, Treasury receives an automatic notification to prepare an investment sweep. When the position reaches 100 percent, the breach is escalated to the Chief Compliance Officer that same calendar day, and Treasury must execute same-day remediation — whether through an investment transaction, a reallocation of branch orders, or a Board deviation request. The breach record does not close until the position returns below the limit and the corrective action is documented in the general ledger.

This control is intentionally tight. The Federal Credit Union Act and the fidelity-bond rule both contemplate that the Board will actively manage cash exposure, not simply approve a number and forget it. Same-day remediation is the standard.

---

## Location and Device Cash Limits {#location-and-device-cash-limits}

In addition to the enterprise ceiling, the limits schedule specifies maximum cash balances for every individual asset: vault, teller drawer, ATM, ITM/VTM, cash recycler, and petty-cash fund. These per-asset limits translate the board-level risk appetite into operational daily reality for branch staff.

When a load request would push an asset above its limit, the system blocks the load and alerts the custodian and branch manager. No exception to this rule exists without a formal exception ticket — and that ticket must be in place before the load, not after. For vault, ATM, ITM, and recycler operations, dual custodians must be present regardless of the load amount; a single-custodian attempt at any of those assets is blocked at the system layer, independent of the dollar check.

Temporary limit increases are available only through the deviation process described in the Seasonal Deviations section. Limits in the schedule are maintained by the Chief Compliance Officer and Treasury, and changes require Board approval.

---

## Dual Control, Keys and Combinations {#dual-control-keys-and-combinations}

Dual control is the physical backbone of the cash program. It applies to vault access, cash shipments, ATM and ITM loads, and night-drop retrieval. The requirement is non-negotiable: no single employee may complete any of these operations alone. The system enforces this by requiring a second custodian's authentication before a dual-control session can be marked complete; a single-custodian attempt is blocked before the operation begins.

The key and combination custodian registry tracks every authorized holder of physical keys or digital combination credentials for every controlled asset. When an employee is terminated, their access is revoked immediately — this revocation must occur before any other offboarding step. When an employee transfers roles or sites, revocation occurs the same business day. Combinations are rotated at least every 90 days regardless of personnel changes; the rotation due date is tracked and enforced by the system.

Every time a keybox is opened — whether to retrieve a combination for a routine vault opening or in response to an emergency — the access is logged. This log is part of the evidence base for both internal audit and BSA independent testing. A keybox-access event that is not followed by a dual-control-completed record within 15 minutes triggers an alert to the Chief Compliance Officer.

---

## Reconciliation and GL Controls {#reconciliation-and-gl-controls}

At the close of each business day, every cash asset must be reconciled to the general ledger. This is a same-day, every-day requirement. Three roles participate in the reconciliation process and they must be held by three different people: the custodian who holds the cash, the accounting staff member who posts the GL entry, and the supervisor who approves the reconciliation. No employee may hold more than one of these roles for the same asset on the same day.

Any variance between the physical count and the GL balance must be posted and documented the same business day. If the variance cannot be resolved same-day — meaning the research notes do not yield a clear explanation — the amount is moved to a suspense account and an aging clock starts. Suspense items older than the threshold defined in the limits schedule escalate to the Chief Compliance Officer. A suspense balance that remains unresolved is a control failure, not a bookkeeping inconvenience.

This control is grounded in both the FCUA safety-and-soundness duty and the BSA internal-controls requirement. Unexplained GL differences are a fraud indicator; the same-day reconciliation discipline is what allows the institution to detect problems before they compound.

---

## Over/Short Monitoring {#overshort-monitoring}

Every over/short variance — a teller drawer that does not balance, an ATM cassette count that differs from the expected amount — is recorded per person and per location on the day it occurs. Variances that exceed the investigation threshold in the limits schedule must be opened for investigation within one business day; the investigating supervisor reviews the transaction history and documents the findings.

Cumulative over/short by employee is tracked over rolling periods. When cumulative amounts or frequency metrics cross the coaching threshold, the case escalates to HR and the branch manager. When they cross the discipline threshold, formal disciplinary action follows. These thresholds are defined by the Chief Compliance Officer and are not negotiable at the branch level.

The more important escalation path is the AML referral. Recurring anomalies that suggest structured activity, intentional manipulation, or patterns inconsistent with an employee's normal transaction history are escalated to BSA case management the same day they are detected. Over/short monitoring is not merely a performance-management tool; it is an internal control within the BSA program. A monthly summary of over/short activity is published to the Chief Compliance Officer and BSA Officer within 15 calendar days of each month-end.

---

## ATM/ITM, Night-Drop and Shipments {#atmitm-night-drop-and-shipments}

Cash that moves — through devices, through night depositories, or through armored courier shipments — carries specific risks that the standard teller-drawer and vault controls do not fully address. This section covers those physical handoffs.

ATM and ITM loads and cassette retrievals require dual control, as described in the Dual Control section. The same applies to night-drop retrieval: two employees must be present, and the seal number on the retrieved bag must match the expected seal number recorded at deposit. A seal mismatch is not treated as an administrative error. It triggers an immediate CCO notification, an AML referral, and an exception entry. This reflects the NCUA security program expectation that night depositories be controlled in a manner that prevents tampering.

Cash shipments — inbound from armored couriers and outbound to the Federal Reserve or a correspondent — must be verified the same calendar day by counting the received cash against the courier manifest and posting the result to the general ledger. Any discrepancy between the manifest count and the physical count is treated as an over/short under the monitoring framework and escalates to the Chief Compliance Officer and the armored carrier the same day. Device service events that require opening the currency compartment must occur under dual control, and all service events are logged regardless of whether currency is accessed.

---

## Surprise Cash Counts and Audits {#surprise-cash-counts-and-audits}

The NCUA Supervisory Committee Audit rule requires the Supervisory Committee to conduct or commission surprise cash verifications. This policy implements that requirement: at least one surprise count must be completed at each site every calendar month, covering teller drawers, the main vault, back-up vaults, and any on-site ATM/ITM or cash recycler.

The word "surprise" has operational meaning. Counts are scheduled by the Chief Compliance Officer or the Supervisory Committee without advance notice to branch management or teller staff. Each count requires two counters, at least one of whom is not the regular custodian of the assets being counted. Count results — including any variance — are documented in a signed count sheet. Variances trigger an investigation under the over/short monitoring framework within one business day.

Count results are reported to the Supervisory Committee and the Chief Compliance Officer and are available to independent audit and BSA independent-testing staff. Any variance that remains unresolved at month-end escalates to the Supervisory Committee at its next regular meeting. A site that misses its monthly count is a control gap that the CCO must explain at the quarterly governance cycle.

---

## Seasonal Deviations and Exceptions {#seasonal-deviations-and-exceptions}

Seasonal cash needs — holiday periods, payroll weeks, special events — can legitimately push cash volumes above the normal limits. This policy allows for that flexibility, but only through a formal process that the Board controls.

Any request to exceed a board-approved limit — enterprise or per-asset — requires a signed Board deviation memo before the limit is exceeded. The memo must state why the deviation is needed, how long it will last, what the revised limit amounts are, and whether additional bond or insurance coverage is required. Once the Board approves the deviation, a whitelist entry is activated in the limits engine with a hard sunset date. On the sunset date, the whitelist entry expires automatically and all limits revert to the approved schedule.

Requests that arrive after a limit has already been exceeded are a different matter entirely. Those are treated as post-breach exceptions, escalated immediately to the Chief Compliance Officer and the Board, and addressed as breaches under the enterprise limit control while ratification is sought. The policy is explicit on this point: there is no retroactive approval path that normalizes an unauthorized excess. Post-breach exceptions are tracked as a KRI.

---

## Training and Competency {#training-and-competency}

The Bank Secrecy Act requires ongoing training for all persons involved in AML program controls, which includes cash handling. This policy specifies the minimum standard: all cash-handling employees must complete initial training within 30 calendar days of hire or role assignment, and annual refresher training each year thereafter.

Initial training covers cash-handling accuracy, counterfeit detection, common fraud and theft schemes, robbery and emergency response, dual-control procedures, and the device and shipment procedures specific to each employee's role. Role-specific proficiency checks — practical assessments, not just completion checkboxes — are required within the initial window and annually. An employee who fails a proficiency check is immediately restricted from independent cash-handling operations. That restriction stays in place until remediation training is completed and the check is re-passed. Failure to pass a proficiency check is not a performance footnote; it is an operational access control.

Training completion records and proficiency scores feed the AML governance dashboard. The Chief Compliance Officer, BSA Officer, HR, and branch managers can all see training status for their respective populations. Curriculum is versioned and reviewed at each annual policy cycle.

---

## Monitoring, Reporting and Recordkeeping {#monitoring-reporting-and-recordkeeping}

The Chief Compliance Officer publishes a monthly KPI/KRI dashboard within 15 calendar days of each month-end. The dashboard covers enterprise cash position against the limit (with trend), per-asset over/short rates, surprise-count completion rates and outstanding variances, reconciliation suspense aging, training completion, exception register status, and deviation and whitelist activity. This report goes to the CCO, the Board, and the BSA Officer.

The exception register is maintained on a continuous basis. Every exception — a blocked load, a seal mismatch, a suspense item, a training failure, a post-breach deviation — is logged the day it occurs and attested by the Chief Compliance Officer at each quarterly governance cycle. A summary of the register accompanies the quarterly Board package.

All evidence generated by this policy — reconciliation packs, count sheets, dual-control logs, device load sheets, keybox access logs, shipment manifests, deviation memos, training records — is retained for the periods specified in the records schedule. The NCUA records preservation rule sets the minimum floors; the records schedule (Appendix B) translates those floors into specific retention anchors for each evidence type. Nothing may be destroyed before its retention anchor date without a CCO-approved waiver. During an active examination or audit, any evidence request from the examiner or BSA independent-testing team is fulfilled within the timeframe specified by the examiner.

---

## Governance and Accountability {#governance-and-accountability}

Patrick Wilson, Chief Compliance Officer, owns this policy and is accountable for its day-to-day operation. Required participants include Operations (daily limits enforcement, dual-control procedures, and reconciliation), Treasury and Finance (enterprise limit monitoring and investment sweeps), the BSA Officer (AML linkage and independent testing), and the Supervisory Committee (surprise cash counts and audit oversight).

The policy is reviewed annually. An out-of-cycle review is required within 30 calendar days of any material cash loss or fraud event, any NCUA or BSA examination finding related to cash controls, the addition of a new cash-handling channel or technology, or any limits breach that required Board deviation. The review cadence and out-of-cycle triggers are the same as those for the BSA Policy, reflecting the tight operational linkage between the two programs.

Adjacent policies that this program connects to but does not supersede include the BSA Policy (AML program design, CTR and SAR filing, the Travel Rule, and independent testing of cash controls), the Investment Policy (excess-cash investment decisions), the Liquidity Policy (cash-to-liquidity interface), the Vendor Risk Management Policy (armored-carrier and ATM-servicer oversight), the Record Retention Policy (retention beyond cash-specific schedules), the Information Security Policy (logical access controls for cash-handling systems), and the Electronic Payment Systems Policy (wire and ACH origination, which are out of scope here).

---

## Open Items {#open-items}

Several implementation dependencies must be resolved before this policy is fully operational.

The limits schedule (Appendix A) does not yet contain the specific numerical values for the enterprise cash percentage, per-asset limits by asset type, over/short investigation and discipline thresholds, reconciliation suspense aging thresholds, or sweep trigger percentages. These values require Board approval and must be attached before the policy goes into effect.

The records retention schedule (Appendix B) has not yet been finalized. The specific retention periods for each evidence type generated by this policy must be confirmed against the NCUA records preservation rule requirements and attached as Appendix B.

The compensating-review protocol for small sites — locations where fewer than two eligible employees are available to perform standard dual control — has not yet been defined. Operations and the Chief Compliance Officer must agree on a documented standard before the next scope attestation cycle.

The vendor-linkage question between this policy and the Vendor Risk Management Policy has not yet been formalized. Specifically, how an annual armored-carrier or ATM-servicer vendor review should trigger updates to the dual-control and shipment-verification procedures here needs to be documented at the next review cycle.

Finally, several cash-specific fields in the engineering system — including the segregation-of-duties identity reference, the daily enterprise-position computation schedule, the evidence-type classification, and the reconciliation deadline timer — are listed as provisional in the current engineering specification. Those fields will be confirmed by engineering before final publication of the policy.
