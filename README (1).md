# Privacy

> **General Policy Statement** \{{ORGANIZATION\}} (a U.S. credit union) operates a risk-based privacy program that complies with the Gramm–Leach–Bliley Act (GLBA) and Regulation P, NCUA Part 748 information-security guidelines, FCRA/Reg V (including NCUA Part 717), the FACTA Disposal Rule, the Right to Financial Privacy Act (RFPA), E-SIGN, and applicable U.S. state privacy laws where they touch **non-GLBA** data (e.g., marketing telemetry). We limit collection/use to what is lawful and necessary, provide required notices/choices, safeguard NPPI via administrative/technical/physical controls, require vendor parity, and maintain records per schedule. Scope includes **\{{SCOPE\}}**, all workforce/contractors, and information in any form.

***

## Proposed Control IDs & Titles <a href="#control-id-map" id="control-id-map"></a>

| ID                                                                   | Title                                                                         |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [PR-01](<README (1).md#pr-01-privacy-notice-lifecycle>)              | Privacy Notice Lifecycle (Initial, Annual, Revised)                           |
| [PR-02](<README (1).md#pr-02-opt-out-capture-and-honoring>)          | Opt-Out Capture & Honoring                                                    |
| [PR-03](<README (1).md#pr-03-permissible-disclosures-exceptions>)    | Permissible Disclosures & Exceptions (Service Providers, Servicing, Legal)    |
| [PR-04](<README (1).md#pr-04-customer-access-authentication>)        | Customer Access & Authentication (Identity Verification before Disclosure)    |
| [PR-05](<README (1).md#pr-05-data-accuracy-corrections>)             | Data Accuracy & Corrections (Address/Name/Tax Forms; Red Flags)               |
| [PR-06](<README (1).md#pr-06-employee-access-minimization-training>) | Employee Access Minimization & Training                                       |
| [PR-07](<README (1).md#pr-07-third-party-oversight-and-contracts>)   | Third-Party Oversight & Contracts (GLBA Addenda)                              |
| [PR-08](<README (1).md#pr-08-secure-disposal-of-nppi>)               | Secure Disposal of NPPI                                                       |
| [PR-09](<README (1).md#pr-09-incident-response-breach-notification>) | Incident Response & Breach Notification                                       |
| [PR-10](<README (1).md#pr-10-recordkeeping-board-reporting>)         | Recordkeeping, Complaints & Board Reporting                                   |
| [PR-11](<README (1).md#pr-11-website-posting-and-e-sign-delivery>)   | Website Posting & E-SIGN Delivery                                             |
| [PR-12](<README (1).md#pr-12-state-variants-ccpa-vt-nv>)             | State Variants (CA/CPRA, Vermont, Nevada) — **Non-GLBA data only**            |
| [PR-13](<README (1).md#pr-13-anonymization-and-aggregation>)         | Anonymization & Aggregation (Non-Identifiable Data) _(right-sized; optional)_ |
| [PR-14](<README (1).md#pr-14-cookies-and-online-tracking>)           | Cookies & Online Tracking (U.S. web/app telemetry) _(non-GLBA)_               |
| [PR-15](<README (1).md#pr-15-third-party-app-connections>)           | Third-Party App/Account Connections & APIs _(if offered)_                     |
| [PR-16](<README (1).md#pr-16-biometric-data-for-kyc>)                | Biometric Data for KYC _(only if vendor uses it)_                             |
| [PR-17](<README (1).md#pr-17-childrens-data>)                        | Children’s Data (COPPA posture)                                               |

***

## Multi-Rule Authority Table <a href="#authority" id="authority"></a>

| Topic                                      | Scope                                                         | Key Clauses / Notes                                                                                                                                                                                            |
| ------------------------------------------ | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **GLBA / Regulation P (12 CFR Part 1016)** | Privacy notices; opt-out; sharing limits; delivery/exceptions | Initial (§1016.4), annual (§1016.5), revised (§1016.8), delivery (§1016.9), exceptions (§1016.13–§1016.15). [https://www.ecfr.gov/current/title-12/part-1016](https://www.ecfr.gov/current/title-12/part-1016) |
| **NCUA Part 748 & App. A/B**               | Info-sec program; response program; vendor oversight          | 12 CFR §748.0; App. A/B. [https://www.ecfr.gov/current/title-12/part-748](https://www.ecfr.gov/current/title-12/part-748)                                                                                      |
| **FCRA / Reg V (12 CFR Part 1022)**        | Accuracy, address discrepancies, affiliate marketing          | [https://www.ecfr.gov/current/title-12/part-1022](https://www.ecfr.gov/current/title-12/part-1022)                                                                                                             |
| **NCUA Part 717**                          | CU implementation of FCRA (Red Flags, address)                | [https://www.ecfr.gov/current/title-12/part-717](https://www.ecfr.gov/current/title-12/part-717)                                                                                                               |
| **FACTA Disposal Rule (16 CFR Part 682)**  | Disposal of consumer report information                       | [https://www.ecfr.gov/current/title-16/part-682](https://www.ecfr.gov/current/title-16/part-682)                                                                                                               |
| **RFPA (12 USC §3401 et seq.)**            | Government access; notice/process                             | [https://www.law.cornell.edu/uscode/text/12/chapter-35](https://www.law.cornell.edu/uscode/text/12/chapter-35)                                                                                                 |
| **E-SIGN (15 USC §7001)**                  | Electronic delivery & consent                                 | [https://www.law.cornell.edu/uscode/text/15/7001](https://www.law.cornell.edu/uscode/text/15/7001)                                                                                                             |
| **COPPA (16 CFR Part 312)**                | Children’s online privacy (under 13)                          | [https://www.ecfr.gov/current/title-16/part-312](https://www.ecfr.gov/current/title-16/part-312)                                                                                                               |
| **State Privacy (U.S.)**                   | CA/CPRA, VT, NV (apply to **non-GLBA** data)                  | CA “sell/share” & opt-outs; VT/NV marketing limits.                                                                                                                                                            |

***

## Timing Matrix <a href="#timing-matrix" id="timing-matrix"></a>

| Scenario                                  | Trigger (human → event)                             |                                                              Deadline | Content Reference            | Control                                                              |
| ----------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------: | ---------------------------- | -------------------------------------------------------------------- |
| Provide **Initial Privacy Notice**        | Relationship established → `(account.opened)`       |                                      **At/Before** relationship start | Reg P §1016.4                | [PR-01](<README (1).md#pr-01-privacy-notice-lifecycle>)              |
| **Annual Notice** (if not exempt)         | Annual cycle due → `(notice.annual.check)`          |                                                   **Every 12 months** | Reg P §1016.5                | [PR-01](<README (1).md#pr-01-privacy-notice-lifecycle>)              |
| **Revised Notice** before new sharing     | Material change approved → `(notice.revision.prep)` |                                                   **Prior** to change | Reg P §1016.8                | [PR-01](<README (1).md#pr-01-privacy-notice-lifecycle>)              |
| **Opt-Out** effective & propagated        | Opt-out submitted → `(privacy.optout.submitted)`    | Immediate enforcement; full propagation ≤30 days _(program standard)_ | Reg P §1016.7                | [PR-02](<README (1).md#pr-02-opt-out-capture-and-honoring>)          |
| **Secure disposal**                       | Retention met → `(records.retention.expired)`       |                                     **≤90 days** _(program standard)_ | 16 CFR Part 682              | [PR-08](<README (1).md#pr-08-secure-disposal-of-nppi>)               |
| **Incident/breach** notify                | NPPI compromise → `(security.incident.opened)`      |                         Without unreasonable delay; state clocks vary | NCUA §748 App. B; state laws | [PR-09](<README (1).md#pr-09-incident-response-breach-notification>) |
| **Board report**                          | Packet ready → `(privacy.report.board.ready)`       |                                                 **At least annually** | NCUA §748                    | [PR-10](<README (1).md#pr-10-recordkeeping-board-reporting>)         |
| **Cookie/“Do Not Sell/Share”** (non-GLBA) | Web visit (CA) → `(cookie.banner.shown)`            |                                 **Before** non-essential tracking/ads | CA/CPRA                      | [PR-14](<README (1).md#pr-14-cookies-and-online-tracking>)           |

***

## Control Index <a href="#control-index" id="control-index"></a>

| ID                                                                   | Control Name                         | Purpose                                                   | Primary Rule(s)                       |
| -------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------- | ------------------------------------- |
| [PR-01](<README (1).md#pr-01-privacy-notice-lifecycle>)              | Privacy Notice Lifecycle             | Deliver initial/annual/revised notices & record delivery. | Reg P §1016.4–§1016.5–§1016.8–§1016.9 |
| [PR-02](<README (1).md#pr-02-opt-out-capture-and-honoring>)          | Opt-Out Capture & Honoring           | Provide, record, and enforce opt-outs.                    | Reg P §1016.7                         |
| [PR-03](<README (1).md#pr-03-permissible-disclosures-exceptions>)    | Permissible Disclosures & Exceptions | Apply service-provider/servicing/legal exceptions.        | Reg P §1016.13–§1016.15               |
| [PR-04](<README (1).md#pr-04-customer-access-authentication>)        | Customer Access & Authentication     | Verify identity before disclosures to customers.          | §1016.9; NCUA §748; RFPA              |
| [PR-05](<README (1).md#pr-05-data-accuracy-corrections>)             | Data Accuracy & Corrections          | Correct & propagate changes; Red Flags.                   | Reg V; Part 717                       |
| [PR-06](<README (1).md#pr-06-employee-access-minimization-training>) | Employee Access & Training           | Least-privilege; onboarding/annual training.              | NCUA §748 App. A                      |
| [PR-07](<README (1).md#pr-07-third-party-oversight-and-contracts>)   | Third-Party Oversight & Contracts    | GLBA addenda; data maps; monitoring.                      | Reg P §1016.13; NCUA §748             |
| [PR-08](<README (1).md#pr-08-secure-disposal-of-nppi>)               | Secure Disposal of NPPI              | Destroy NPPI/media securely per schedule.                 | 16 CFR Part 682                       |
| [PR-09](<README (1).md#pr-09-incident-response-breach-notification>) | Incident Response & Breach           | Detect/contain/notify; SAR if needed.                     | NCUA §748 App. B; state               |
| [PR-10](<README (1).md#pr-10-recordkeeping-board-reporting>)         | Recordkeeping & Board Reporting      | Logs, complaints, metrics to Board.                       | NCUA §748                             |
| [PR-11](<README (1).md#pr-11-website-posting-and-e-sign-delivery>)   | Website & E-SIGN Delivery            | Host/post; capture e-consent artifacts.                   | §1016.9; 15 USC §7001                 |
| [PR-12](<README (1).md#pr-12-state-variants-ccpa-vt-nv>)             | State Variants                       | Apply stricter state rules to non-GLBA data.              | CA/CPRA; VT; NV                       |
| [PR-13](<README (1).md#pr-13-anonymization-and-aggregation>)         | Anonymization & Aggregation          | Use of non-identifiable data for analytics/R\&D.          | Program control                       |
| [PR-14](<README (1).md#pr-14-cookies-and-online-tracking>)           | Cookies & Online Tracking            | Govern non-GLBA telemetry; consent where required.        | CA/CPRA; e-signals                    |
| [PR-15](<README (1).md#pr-15-third-party-app-connections>)           | Third-Party App Connections          | Govern customer-authorized data flows via APIs.           | Reg P; RFPA                           |
| [PR-16](<README (1).md#pr-16-biometric-data-for-kyc>)                | Biometric Data for KYC               | Limit/contractualize vendor biometric use.                | State biometric laws; GLBA            |
| [PR-17](<README (1).md#pr-17-childrens-data>)                        | Children’s Data                      | Not directed to under-13; rapid removal.                  | COPPA                                 |

***

## Control Overlays (Design Overlay v2)

### PR-01 — Privacy Notice Lifecycle <a href="#pr-01-privacy-notice-lifecycle" id="pr-01-privacy-notice-lifecycle"></a>

* **WHY (Reg cite):** Initial/annual/revised notices and permitted delivery. 12 CFR §1016.4, §1016.5, §1016.8, §1016.9.
* **SYSTEM BEHAVIOR:** Source-of-truth `privacy.notice.vX` per product/channel; block non-exception sharing until notice delivered and opt-out status honored.
* **TRIGGERS (human → event):** New relationship `(account.opened)`; annual check `(notice.annual.check)`; material change `(notice.revision.prep)`.
* **INPUTS (human → field):** Delivery preference `(cust.delivery_pref)`; template id `(privacy.notice.template_id)`; exemption flag `(notice.annual.exempt)`.
* **OUTPUTS:** `notice.delivered` (channel, timestamp, template\_id); `notice.annual.exempt_set`.
* **TIMERS/SLAs:** Initial at/before relationship; annual 12 months; revised prior to change.
* **EDGE CASES:** Joint accounts → one notice to primary; dormant but existing relationships still require notice unless exempt.
* **AUDIT LOGS:** `notice.generated`, `notice.delivered`, `notice.read.confirmed`.
* **ACCESS CONTROL:** Privacy/Compliance publish templates.
* **ALERTS/METRICS:** % accounts missing notice; exemptions applied.

### PR-02 — Opt-Out Capture and Honoring <a href="#pr-02-opt-out-capture-and-honoring" id="pr-02-opt-out-capture-and-honoring"></a>

* **WHY (Reg cite):** Reasonable means to opt out before non-affiliate sharing. §1016.7.
* **SYSTEM BEHAVIOR:** Provide at least two channels (portal toggle + mail/web form). Decision layer enforces `sharing.blocklist` for marketing/non-exception flows and propagates to martech vendors.
* **TRIGGERS:** `(privacy.optout.submitted)`, `(privacy.optout.revoked)`.
* **INPUTS:** `(privacy.optout.scope)`, `(privacy.optout.effective_at)`.
* **OUTPUTS:** `privacy.optout.confirmed`, `privacy.optout.sync.sent`.
* **TIMERS/SLAs:** Immediate enforcement; vendor propagation ≤30 days.
* **EDGE CASES:** Household vs individual; returned mail; authorized agent requests.
* **AUDIT LOGS:** `privacy.optout.*`.
* **ACCESS CONTROL:** Customer/verified agent only.
* **ALERTS/METRICS:** Suppression leakage; time-to-propagate.

### PR-03 — Permissible Disclosures & Exceptions <a href="#pr-03-permissible-disclosures-exceptions" id="pr-03-permissible-disclosures-exceptions"></a>

* **WHY (Reg cite):** Service provider/joint marketing (§1016.13), servicing/processing (§1016.14), legal/protective (§1016.15).
* **SYSTEM BEHAVIOR:** Each disclosure tagged with legal basis `(privacy.share.basis)`; vendor must have GLBA confidentiality clause `(vendor.contract.glba_clause=true)`.
* **TRIGGERS:** `(vendor.onboarded)`, `(gov.request.received)`, `(secondary.market.txn)`.
* **INPUTS:** `(vendor.contract.id)`, `(privacy.share.purpose)`, `(privacy.share.dataset_id)`.
* **OUTPUTS:** `privacy.disclosure.logged`; RFPA notices if applicable.
* **TIMERS/SLAs:** RFPA steps before government release; emergency exceptions documented.
* **EDGE CASES:** Securitizations/servicing sales; LE delay requests.
* **AUDIT LOGS:** `gov.request.logged`, `rfpa.notice.sent`.
* **ACCESS CONTROL:** Legal/Privacy approval for “legal” basis.
* **ALERTS/METRICS:** % disclosures missing basis/contract.

### PR-04 — Customer Access & Authentication <a href="#pr-04-customer-access-authentication" id="pr-04-customer-access-authentication"></a>

* **WHY (Reg cite):** Verify identity before disclosing customer information. §1016.9; NCUA §748; RFPA.
* **SYSTEM BEHAVIOR:** In-person gov ID; phone KBA/MFA; online authenticated session; PoA verified for agents.
* **TRIGGERS:** `(cust.info.requested)`.
* **INPUTS:** `(auth.method)`, `(auth.kba.score)`, `(doc.poa.verified)`.
* **OUTPUTS:** `cust.info.released` (channel, items).
* **TIMERS/SLAs:** Provide policy copies within **10 days** (program standard).
* **EDGE CASES:** Refuse if auth fails; sensitive items via secure channel.
* **AUDIT LOGS:** `auth.challenge.performed`, `cust.info.released`.
* **ACCESS CONTROL:** CSR roles; least privilege.
* **ALERTS/METRICS:** Auth failure rate; misdelivery incidents.

### PR-05 — Data Accuracy & Corrections <a href="#pr-05-data-accuracy-corrections" id="pr-05-data-accuracy-corrections"></a>

* **WHY (Reg cite):** Accurate/current/complete; propagate corrections. Reg V; NCUA §748; Part 717.
* **SYSTEM BEHAVIOR:** Master-data correction propagates to all systems and prior recipients where applicable.
* **TRIGGERS:** `(cust.data.change.requested)`, `(cust.address.changed)`, `(cust.name.changed)`.
* **INPUTS:** `(doc.type)`, `(tax.w9.received)`.
* **OUTPUTS:** `cust.data.corrected`, `cust.data.notify.sent`.
* **TIMERS/SLAs:** Prompt; ≤30 days for bureau-reported items where applicable.
* **EDGE CASES:** USPS/NCOA → Red Flag letter; legal holds pause updates.
* **AUDIT LOGS:** `cust.data.change.requested`, `cust.data.corrected`.
* **ACCESS CONTROL:** Dual-control for critical identifiers.
* **ALERTS/METRICS:** Time-to-correct; repeat corrections.

### PR-06 — Employee Access Minimization & Training <a href="#pr-06-employee-access-minimization-training" id="pr-06-employee-access-minimization-training"></a>

* **WHY (Reg cite):** Need-to-know; training. NCUA §748 App. A.
* **SYSTEM BEHAVIOR:** RBAC; quarterly access reviews; 24-hour termination revocation; annual privacy training.
* **TRIGGERS:** `(hr.onboarded)`, `(hr.role.changed)`, `(training.privacy.due)`.
* **INPUTS:** `(rbac.role_id)`, `(training.privacy.completed_at)`.
* **OUTPUTS:** Access grants/revokes; training certificates.
* **TIMERS/SLAs:** Onboarding/annual training; quarterly reviews.
* **EDGE CASES:** Contractors/data minimization; BYOD prohibitions for NPPI unless MDM-controlled.
* **AUDIT LOGS:** `rbac.*`, `training.privacy.completed`.
* **ACCESS CONTROL:** Security/IT + Privacy for elevated roles.
* **ALERTS/METRICS:** Orphaned accounts; overdue training.

### PR-07 — Third-Party Oversight and Contracts <a href="#pr-07-third-party-oversight-and-contracts" id="pr-07-third-party-oversight-and-contracts"></a>

* **WHY (Reg cite):** GLBA provider exception requires confidentiality/purpose limits; IR program requires vendor readiness. §1016.13; NCUA §748.
* **SYSTEM BEHAVIOR:** Due diligence, GLBA addendum, data map, subprocessor flow-downs; continuous monitoring.
* **TRIGGERS:** `(vendor.change.requested)`, `(vendor.onboarded)`.
* **INPUTS:** `(vendor.contract.glba=true)`, `(privacy.share.dataset_id)`, `(vendor.subprocessors.list)`.
* **OUTPUTS:** Approved vendor profile; monitoring tickets.
* **TIMERS/SLAs:** Before first transfer; annual review.
* **EDGE CASES:** U.S. hosting preference; LE data-request handling by vendor.
* **AUDIT LOGS:** `vendor.dd.completed`, `vendor.contract.executed`.
* **ACCESS CONTROL:** Legal/Privacy approvals.
* **ALERTS/METRICS:** Vendors missing clauses/assessments.

### PR-08 — Secure Disposal of NPPI <a href="#pr-08-secure-disposal-of-nppi" id="pr-08-secure-disposal-of-nppi"></a>

* **WHY (Reg cite):** Reasonable measures to dispose consumer report info/NPPI. 16 CFR Part 682; NCUA §748.
* **SYSTEM BEHAVIOR:** Enforce retention schedule; certified destruction (paper/media); defensible wiping.
* **TRIGGERS:** `(records.retention.expired)`.
* **INPUTS:** `(records.class)`, `(records.disposal.method)`.
* **OUTPUTS:** `records.disposal.cert_id`.
* **TIMERS/SLAs:** Dispose ≤90 days; legal holds pause.
* **EDGE CASES:** Locked shred bins; chain-of-custody.
* **AUDIT LOGS:** `records.disposed`, `legal.hold.set/cleared`.
* **ACCESS CONTROL:** Records + Compliance approvals.
* **ALERTS/METRICS:** Past-due disposals.

### PR-09 — Incident Response & Breach Notification <a href="#pr-09-incident-response-breach-notification" id="pr-09-incident-response-breach-notification"></a>

* **WHY (Reg cite):** Detect, contain, notify; regulator/member notices as required. NCUA §748 App. B; state breach laws; RFPA; SAR confidentiality.
* **SYSTEM BEHAVIOR:** IR runbook integrates privacy/legal; classify data types/states; customer notice templates ready.
* **TRIGGERS:** `(security.incident.opened)`.
* **INPUTS:** `(incident.data.classes)`, `(incident.records.count)`, `(incident.states)`.
* **OUTPUTS:** Customer/regulator notices; SAR if criminal activity suspected.
* **TIMERS/SLAs:** Without unreasonable delay; state clocks govern.
* **EDGE CASES:** LE request for delay; payment card incidents consider PCI DSS expectations.
* **AUDIT LOGS:** `incident.opened`, `incident.notices.sent`, `sar.filed`.
* **ACCESS CONTROL:** IR team; need-to-know.
* **ALERTS/METRICS:** MTTD/MTTR; root-cause trends.

### PR-10 — Recordkeeping, Complaints & Board Reporting <a href="#pr-10-recordkeeping-board-reporting" id="pr-10-recordkeeping-board-reporting"></a>

* **WHY (Reg cite):** Board oversight and records. NCUA §748.
* **SYSTEM BEHAVIOR:** Centralize complaint logs, notices, opt-outs, metrics.
* **TRIGGERS:** `(privacy.complaint.logged)`, `(privacy.report.board.ready)`.
* **INPUTS:** `(complaint.type)`, `(complaint.outcome)`.
* **OUTPUTS:** Annual (or quarterly) Privacy Report.
* **TIMERS/SLAs:** ≥ annually.
* **EDGE CASES:** High-risk complaints escalated ad hoc.
* **AUDIT LOGS:** `privacy.report.issued`.
* **ACCESS CONTROL:** Privacy Officer curates.
* **ALERTS/METRICS:** Complaint rates; repeats.

### PR-11 — Website Posting and E-SIGN Delivery <a href="#pr-11-website-posting-and-e-sign-delivery" id="pr-11-website-posting-and-e-sign-delivery"></a>

* **WHY (Reg cite):** Permitted electronic delivery/consent. §1016.9; 15 USC §7001.
* **SYSTEM BEHAVIOR:** Host current notice; capture e-consent and retain artifact; ADA-accessible format.
* **TRIGGERS:** `(econsent.captured)`, `(privacy.notice.requested)`.
* **INPUTS:** `(econsent.proof)`, `(cust.email)`.
* **OUTPUTS:** Notice copies within 10 days (program standard).
* **TIMERS/SLAs:** 10-day fulfillment.
* **EDGE CASES:** Mail on request; language access where offered.
* **AUDIT LOGS:** `econsent.captured`, `notice.copy.sent`.
* **ACCESS CONTROL:** Web/Compliance owners.
* **ALERTS/METRICS:** Link uptime; SLA hits.

### PR-12 — State Variants (CA/CPRA, Vermont, Nevada) — Non-GLBA data only <a href="#pr-12-state-variants-ccpa-vt-nv" id="pr-12-state-variants-ccpa-vt-nv"></a>

* **WHY (Reg cite):** Apply stricter state rules to **non-GLBA** data (e.g., marketing telemetry, prospect lists).
* **SYSTEM BEHAVIOR:** Jurisdiction tagging `(cust.jurisdiction)`; separate GLBA NPPI from non-GLBA telemetry; honor CA “Do Not Sell/Share” for ad tech; Vermont/Nevada marketing limits.
* **TRIGGERS:** `(cust.address.changed)`, `(cookie.pref.updated)`.
* **INPUTS:** `(data.category.glba_exempt)`, `(do_not_sell.flag)`.
* **OUTPUTS:** State notices; preference records.
* **TIMERS/SLAs:** CA response windows per statute (for non-GLBA data processed).
* **EDGE CASES:** Suppression lists for marketing; agent requests.
* **AUDIT LOGS:** `state.request.received/closed`.
* **ACCESS CONTROL:** Privacy Ops + Legal.
* **ALERTS/METRICS:** SLA adherence (where applicable).

### PR-13 — Anonymization & Aggregation (optional) <a href="#pr-13-anonymization-and-aggregation" id="pr-13-anonymization-and-aggregation"></a>

* **WHY:** Allow analytics/R\&D using data that does **not** identify individuals (inspired by industry practice).
* **SYSTEM BEHAVIOR:** Use documented anonymization/aggregation; prohibit re-identification; keep GLBA NPPI out of public aggregates.
* **TRIGGERS:** `(data.agg.job.started)`.
* **INPUTS:** `(agg.method)`, `(k_anonymity.level)`.
* **OUTPUTS:** `data.agg.dataset.created` with control tags.
* **TIMERS/SLAs:** Review methods **annually**.
* **EDGE CASES:** Small cohorts → apply thresholds.
* **AUDIT LOGS:** `data.agg.job.completed`.
* **ACCESS CONTROL:** Data Science + Privacy review.
* **ALERTS/METRICS:** Re-id risk score.

### PR-14 — Cookies & Online Tracking (non-GLBA) <a href="#pr-14-cookies-and-online-tracking" id="pr-14-cookies-and-online-tracking"></a>

* **WHY:** Govern marketing/analytics cookies; apply CA “Do Not Sell/Share” to ad tech; keep servicing cookies distinct.
* **SYSTEM BEHAVIOR:** Banner & preference center; block non-essential tags until consent (where required); honor universal opt-out signals (e.g., GPC) for CA users.
* **TRIGGERS:** `(cookie.banner.shown)`, `(cookie.pref.updated)`.
* **INPUTS:** `(cookie.category ∈ {essential, analytics, advertising})`, `(gpc.signal)`.
* **OUTPUTS:** `cookie.pref.saved`.
* **TIMERS/SLAs:** Consent before load; periodic renewal per policy.
* **EDGE CASES:** Logged-in vs logged-out; cross-device sync.
* **AUDIT LOGS:** `cookie.pref.changed`.
* **ACCESS CONTROL:** Web team with Privacy sign-off.
* **ALERTS/METRICS:** Consent rates; tag leakage.

### PR-15 — Third-Party App/Account Connections (if offered) <a href="#pr-15-third-party-app-connections" id="pr-15-third-party-app-connections"></a>

* **WHY:** When members connect external apps (PFMs, merchants), we must scope purpose and limit disclosure (Reg P/RFPA).
* **SYSTEM BEHAVIOR:** Explicit scoping/consent UI; purpose-limited tokens; clear revoke path; no reuse beyond consented scope.
* **TRIGGERS:** `(account.connection.created)`, `(account.connection.revoked)`.
* **INPUTS:** `(connection.scope)`, `(connection.vendor_id)`.
* **OUTPUTS:** `account.connection.enabled/disabled`.
* **TIMERS/SLAs:** Immediate revocation on request.
* **EDGE CASES:** Merchant-initiated shares; subpoenas to third parties.
* **AUDIT LOGS:** `account.connection.*`.
* **ACCESS CONTROL:** API gateway owners; Privacy review of scopes.
* **ALERTS/METRICS:** Scope creep; stale tokens.

### PR-16 — Biometric Data for KYC (only if vendor uses it) <a href="#pr-16-biometric-data-for-kyc" id="pr-16-biometric-data-for-kyc"></a>

* **WHY:** Some KYC vendors use face-match/“liveness” checks; states impose special rules (e.g., BIPA/WA). GLBA still applies.
* **SYSTEM BEHAVIOR:** Use vendor only with explicit contractual limits; collect only if required; prefer vendor-side storage; prohibit vendor model reuse.
* **TRIGGERS:** `(kyc.biometric.check.started)`.
* **INPUTS:** `(vendor.biometric.enabled)`, `(biometric.retention.days)`.
* **OUTPUTS:** `kyc.biometric.result` (pass/fail).
* **TIMERS/SLAs:** Retain only as necessary; purge per state law.
* **EDGE CASES:** Offer non-biometric path where feasible.
* **AUDIT LOGS:** `kyc.biometric.performed`, `biometric.deleted`.
* **ACCESS CONTROL:** Strict; minimal internal roles.
* **ALERTS/METRICS:** Biometric exceptions; purge compliance.

### PR-17 — Children’s Data <a href="#pr-17-childrens-data" id="pr-17-childrens-data"></a>

* **WHY:** Services are not directed to children under 13; ensure rapid removal if discovered. COPPA.
* **SYSTEM BEHAVIOR:** Age gates; promptly delete on discovery; custodial/UTMA accounts treated as adult-owner NPPI.
* **TRIGGERS:** `(agegate.failed)`, `(minor.account.detected)`.
* **INPUTS:** `(cust.dob)`.
* **OUTPUTS:** `minor.access.revoked` where applicable; deletion confirmation.
* **TIMERS/SLAs:** Prompt removal on discovery.
* **EDGE CASES:** Teen accounts only if product/legal explicitly allow.
* **AUDIT LOGS:** `minor.review.completed`.
* **ACCESS CONTROL:** KYC/Compliance only.
* **ALERTS/METRICS:** Under-age attempts blocked.

***

## Embedded Checklists & Templates <a href="#checklists" id="checklists"></a>

* **Notice Pack:** Initial/Annual/Revised Reg P notices (paper/web/app), e-delivery consent, joint-account language.
* **Opt-Out Pack:** Web toggle spec, printable mail-back, call script, vendor suppression export checklist.
* **Vendor Pack:** GLBA addendum, data-map template, RFPA/government request SOP.
* **Breach Pack:** IR runbook, regulator/member notice templates, state-law timing matrix, LE hold form.
* **Disposal Pack:** Media sanitization SOP, certificate of destruction, record-class schedule.
* **Training Pack:** Onboarding privacy module, annual refresher quiz, acknowledgement.
* **Web Tracking Pack (non-GLBA):** Cookie banner texts, preference center config, GPC handling SOP, tag governance RACI.
* **Biometric KYC Pack (if used):** Consent language, vendor SOW addendum, retention/purge schedule, non-biometric fallback.

***

## Governance & Sign-Off <a href="#governance" id="governance"></a>

* **Ownership:** Privacy Officer (with BSA/AML Officer) owns this policy and the privacy program.
* **Applies To:** All directors, officers, employees, temporary staff, and vendors with access to NPPI.
* **Outsourcing:** Where privacy operations are outsourced, contracts must meet [PR-07](<README (1).md#pr-07-third-party-oversight-and-contracts>).
* **Reporting:** Privacy Officer reports to the Board (or committee) **at least annually** and ad hoc for material incidents.
* **Review Cadence:** **Annual** Board review/approval; interim updates upon law/practice/product changes.
* **Breach Responsibility:** Business owners must escalate suspected incidents immediately per [PR-09](<README (1).md#pr-09-incident-response-breach-notification>).
* **Internal vs External:** Public-facing notice is a concise summary; this internal policy governs detailed handling and disposal.
* **Cross-References:** Information Security Policy (NCUA §748), Vendor Risk Management, Incident Response Plan, Records Retention Schedule.

***

## Assumptions & Gaps

* **Retention/Disposal:** Default disposal **≤90 days** after retention met; confirm record-class mapping.
* **Opt-Out Propagation:** **≤30 days** end-to-end vendor sync; confirm each vendor cadence.
* **State Privacy:** Apply **only** to non-GLBA data (marketing telemetry, website). Confirm tooling (cookie banner, GPC).
* **Biometrics:** Enabled only if vendor requires; prefer vendor-side storage and minimal result return (pass/fail).
