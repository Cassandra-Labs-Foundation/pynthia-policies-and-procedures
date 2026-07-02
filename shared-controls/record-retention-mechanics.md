# Shared Control SC-02 — Record-Retention Lifecycle Mechanics

## Purpose

This file is the **single authoritative source** for shared control `SC-02`. Eight
policies each carry record-class-specific retention rules (different periods, different
anchor events, different record types). The hold/destruction lifecycle that follows every
retention clock is identical across all eight. SC-02 captures that mechanics layer once;
each consuming policy embeds it verbatim so a regulator or examiner sees a self-contained
control without needing to chase a cross-reference.

## Consuming policies and split summary

| Policy | Policy-specific control | What stays in the local control |
|---|---|---|
| Audit | AU-10 | 7-yr clock; work paper custody & Audit Committee access-approval gate |
| BSA/AML | BSA-21 | Record-class/period table (CIP, SAR, OFAC, wire, etc.); immutable-storage requirement |
| Fair Lending | FL-12 | Reg B/HMDA/Reg Z period tiers; self-test privilege flag |
| Information Security | IS-18 | Security-specific record classes; monthly destruction-queue cadence |
| Internal Controls | IC-08 | Tamper-evident log integrity & integrity-test schedule; audit-log access controls |
| Lending | LP-09 | Credit-package completeness gate (doc_block_state) before booking |
| Investment | IP-15 | 2-BD document-attachment SLA; trade/sale document required-set check |
| Liquidity | LQ-15 | 10-yr period; 2-BD indexing SLA |

## Maintenance rule

**One edit here, eight policies stay in sync.** When RR-03 (destruction) or RR-05
(legal holds) changes, update the Embeddable block below and re-embed it in all eight
consuming policies. Do not edit the embedded text in the consuming policies directly —
edit here first, then propagate.

The authoritative destruction and legal-hold mechanics live in:
- [RR-03 — Document Destruction](../record-retention/record-retention.md#rr-03-document-destruction)
- [RR-05 — Legal Holds](../record-retention/record-retention.md#rr-05-legal-holds)

Schedule A retention periods are governed by:
- [RR-01 — Retention Schedule and Clock Setting](../record-retention/record-retention.md#rr-01-retention-schedule-and-clock-setting)

---

## Embeddable block — copy this verbatim into each consuming policy

> **Instructions for regenerators:** Emit the block below verbatim and in full, including
> the heading line. Do not renumber `SC-02` into the local policy sequence, do not retitle
> it, and do not paraphrase the SYSTEM BEHAVIOR or EVENTS. The control ID `SC-02` and
> this exact title must be byte-identical across all eight consuming policies.

---

## SC-02 — Record-Retention Lifecycle Mechanics {#sc-02-record-retention-lifecycle-mechanics}

**WHY (Reg cite):** [12 CFR Part 364, Appendix B](https://www.ecfr.gov/current/title-12/part-364#Appendix-B-to-Part-364) requires documented, auditable destruction processes and safeguards extending to all retained records. Failure to suspend destruction upon notice of litigation or investigation constitutes spoliation under common law and may result in sanctions and adverse inference instructions. This control implements [RR-03 — Document Destruction](../record-retention/record-retention.md#rr-03-document-destruction) and [RR-05 — Legal Holds](../record-retention/record-retention.md#rr-05-legal-holds) from the Record Retention Policy, which is the authoritative source for Schedule A retention periods, destruction procedures, and the permanent-record inventory.

**SYSTEM BEHAVIOR:** Once a retention clock is set by this policy's record-class-specific control, the following lifecycle mechanics apply to all records within scope. Legal holds take precedence over all scheduled destruction: upon notice of litigation, investigation, or subpoena, the CCO or General Counsel places a legal hold specifying scope (`legal_hold.hold_scope`) and matter reference (`legal_hold.matter_ref`); the system immediately sets `record.legal_hold_flag` = true for all in-scope records and suspends any queued disposal (`disposal.held`). Hold release requires written authorization from the CCO or General Counsel; upon release, `legal_hold.schedule_resumed` is set and the retention clock resumes. A record becomes eligible for disposal only when all three conditions are met: (a) `record.retention_expires_at` has passed, (b) `record.legal_hold_flag` is clear, and (c) the department records-retention contact has confirmed no pending regulatory inquiry (`record.disposal_eligible` = true). Destruction is executed by a licensed vendor in accordance with [12 CFR Part 364 App. B](https://www.ecfr.gov/current/title-12/part-364#Appendix-B-to-Part-364) with two associates initialing the Destruction Log (Exhibit 1) and the vendor's destruction certificate attached (`disposal.certificate`). Permanent records (`record.retention_class` = "Permanent") are excluded from all disposal runs by system enforcement; any attempt to queue a permanent record for disposal generates an immediate alert. Write access to legal-hold placement and release is restricted to the CCO and General Counsel; write access to `record.disposal_eligible` is restricted to the department records-retention contact with SVP Operations & Finance countersignature for batches exceeding 500 records.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Litigation, investigation, or subpoena identified (`legal_hold.created`) | Matter ID (`legal_hold.matter_id`), hold scope (`legal_hold.hold_scope`), placed-at timestamp (`legal_hold.placed_at`), authorizing officer | Legal hold placed (`legal.hold.placed`); all in-scope records flagged (`record.hold.placed`, `record.legal_hold_flag` = true); disposal suspended (`disposal.held`) | Immediately upon notice |
| Hold scope updated — additional records identified (`record.hold.applied`) | Updated scope, matter ID, authorizing officer | Scope update logged (`record.hold.applied`); additional records flagged | Within 1 BD of identification |
| Legal hold released (`legal_hold.clear.confirmed`) | Release authorization (`legal_hold.release_approved_by`), released-at timestamp (`legal_hold.released_at`), matter resolution basis | Hold released (`legal.hold.released`); `record.hold.released` for all in-scope records; `legal_hold.schedule_resumed` set; disposal clock resumed (`disposal.clock_resumed`) | Upon written authorization from CCO or General Counsel |
| Record meets all three disposal-eligibility conditions (`record.disposal_eligible` = true) | `record.retention_expires_at` passed, `record.legal_hold_flag` clear, department contact confirmation of no pending inquiry | Record queued for disposal (`disposal.scheduled`); destruction log entry initiated (`destruction_log.entry.created`) | Within 30 days of eligibility (enforced by `record.retention_expires_at`) |
| Destruction executed by licensed vendor (`disposal.executed`) | Vendor identity, batch manifest (`disposal.batch_manifest_id`), two-associate initials on Destruction Log (Exhibit 1), vendor certificate (`disposal.certificate`) | Destruction certified (`record.destruction.certified`); `record.destroyed` logged; certificate attached to `destruction_log.entry_id` | At time of destruction |
| Permanent record disposal attempted — system block | Attempted disposal action, record ID, `record.retention_class` = "Permanent" | Disposal blocked; alert issued to SVP Operations & Finance and CCO; `destruction_log.mismatch.detected` logged | Immediately upon detection |

**ALERTS/METRICS:** Alert immediately if any record with `record.legal_hold_flag` = true is queued for disposal (target: zero). Alert when eligible records remain undestroyed more than 60 days past `record.retention_expires_at`. Alert immediately on any attempted disposal of a permanent record (target: zero successful permanent-record destructions). Monitor vendor certificate attachment rate; target 100% of destruction events have `disposal.certificate` attached within 5 BD.
