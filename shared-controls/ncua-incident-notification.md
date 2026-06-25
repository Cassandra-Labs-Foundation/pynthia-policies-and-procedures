# Shared Control: SC-01 — NCUA Reportable Cyber-Incident & Member Notification

**Control ID:** `SC-01` (fixed — identical in every consuming policy, not renumbered to that policy's local scheme)
**Control title:** "NCUA Reportable Cyber-Incident & Member Notification" (fixed — identical in every consuming policy)
**Anchor:** `{#sc-01-ncua-reportable-cyber-incident-member-notification}` (fixed — identical in every consuming policy)
**Status:** canonical — single source of truth
**Consumed by (verbatim, full control):** Business Continuity Plan, E-Commerce, Electronic Payment Systems, Collections, Information Security, Privacy, Third-Party Risk

## Why this exists

Seven policies independently restated the same NCUA 72-hour reportable-cyber-incident
notification and member-notice mechanic (12 CFR §748.1(c); 12 CFR Part 748, Appendix B),
each under its own control number and title, bundled together with policy-specific
detection/triage/containment material. This collapses it into **one control, `SC-01`,
with one name, one anchor, one body**, appearing verbatim — id, title, and all — in all
seven policy documents. The policy-specific material that used to be bundled into each
policy's old control (BC-10's containment/legal-consult/vendor-incident-track, EC-10's
detection/assessment/external-comms, EPS-02's BCP testing/incident detection, CO-08's
incident logging/triage, IS-09's declaration/IC-assignment/post-mortem, PR-09's
detection/classification/SAR-referral, TR-08's vendor-notification-SLA/internal-
triage/SAR-referral) has been split out into a **separate, locally-numbered control** in
that policy — it is real, necessary content, just not part of the *shared* mechanic.

Canonical codes (do not deviate): `incident.reportability_determination`,
`incident.reportability_rationale`, `incident.ncua_notice_due_at`, `incident.ncua.notified`,
`incident.member_impact.confirmed`, `incident.member_impact`, `incident.member_notice_template`,
`incident.member_notices.sent`, `incident.notification_due_at`.

## Embeddable block

Insert this **entire block** — heading, WHY, SYSTEM BEHAVIOR, EVENTS, ALERTS/METRICS —
into each consuming policy **verbatim, including the control ID and title**. Do not
rename it, renumber it into that policy's local sequence, or paraphrase any sentence.

---

## SC-01 — NCUA Reportable Cyber-Incident & Member Notification {#sc-01-ncua-reportable-cyber-incident-member-notification}

**WHY (Reg cite):** [NCUA 12 CFR Part 748 §748.1(c)](https://www.ecfr.gov/current/title-12/part-748) requires credit unions to notify NCUA within 72 hours of determining a reportable cyber incident. [NCUA 12 CFR Part 748, Appendix B](https://www.ecfr.gov/current/title-12/part-748) requires a member notification program for unauthorized access to sensitive member information.

**SYSTEM BEHAVIOR:** Once a reportable cyber incident is determined, NCUA notification must be sent within 72 hours of that determination. Member notice is sent without unreasonable delay per Appendix B criteria once misuse of member information is determined likely. The reportability determination and the NCUA-notification field are write-restricted to the CCO/Compliance-Legal. An incident determined non-reportable is documented with rationale and triggers no NCUA notice.

**EVENTS:**

| When | What's needed | Produced (and logged) | Within |
|---|---|---|---|
| Reportable cyber incident determined (`incident.reportability_determination`) | Reportability rationale (`incident.reportability_rationale`), NCUA notice due (`incident.ncua_notice_due_at`) | NCUA notification sent (`incident.ncua.notified`) | 72 hours of determination (enforced by `incident.ncua_notice_due_at`) |
| Member impact confirmed (`incident.member_impact.confirmed`) | Member impact summary (`incident.member_impact`), notice template (`incident.member_notice_template`) | Member notices sent (`incident.member_notices.sent`) | Without unreasonable delay per Appendix B (enforced by `incident.notification_due_at`) |

**ALERTS/METRICS:** Alert fires when `incident.ncua_notice_due_at` is within 12 hours without an `incident.ncua.notified` event; alert fires when member notice is overdue per `incident.notification_due_at`. Target: 100% of reportable incidents notified to NCUA within 72 hours; zero member-notice SLA breaches.

---

## What stays local to each policy

`SC-01` only covers the reportability determination → NCUA notice → member notice gate.
Everything else that used to live in each policy's old bundled control is policy-specific
and must remain in that policy, under a **new locally-numbered control** (next available
number in that policy's own sequence), cross-referencing `SC-01` by anchor where the
local control's trigger feeds into it:

| Policy | Old control (now split) | Local control retains | New local control ID assigned |
|---|---|---|---|
| Business Continuity Plan | BC-10 | Containment (1hr), legal consult (24hr), vendor-incident-track dispatch | BC-15 |
| E-Commerce | EC-10 | Detection/declaration, damage & legal-liability assessment, external-comms gating | EC-13 |
| Electronic Payment Systems | EPS-02 | BCP testing of key e-banking services, electronic-banking incident detection (`eps.incident.*`) | EPS-11 |
| Collections | CO-08 | Collections-data incident logging, 24-hour triage | CO-11 |
| Information Security | IS-09 | Incident declaration/IC assignment/first-hour checklist, post-mortem | IS-19 |
| Privacy | PR-09 | Detection/classification/triage, SAR referral for criminal activity | PR-18 |
| Third-Party Risk | TR-08 | Vendor breach-notice SLA, internal triage, SAR referral | TR-11 |

## Maintenance rule

If `SC-01`'s mechanic ever needs to change (notification window, a new field, wording),
edit **this file first**, then propagate the identical block — id, title, anchor, body —
into all seven policies in the same change. Never edit one policy's copy of `SC-01` in
isolation; that reintroduces the drift this file exists to eliminate. Re-run
`core-api-loop`/`scripts/extract_controls.py` after propagation so `controls.json`
reflects the synchronized control.

## Note on the 2026-06-25 automated regeneration

This control was first consolidated, then the `regenerate-policies` CI task rebuilt all
seven host policies independently (control IDs shifted: `BCP-10`→`BC-10`, `COL-08`→`CO-08`,
`TPR-08`→`TR-08`; bodies reworded with dot-suffix event codes such as `incident.ncua.notified`
instead of `incident.ncua_notified`). This file's canonical text was re-authored against
that regenerated baseline. If `regenerate-policies` runs again and re-diverges the wording
or codes, re-diff each policy's SC-01 block against this file and re-propagate — the
regenerator does not yet know SC-01 is shared (see the Section 6 override in each policy's
`prompt.md`, which instructs it to embed this file's block verbatim rather than re-derive it).
