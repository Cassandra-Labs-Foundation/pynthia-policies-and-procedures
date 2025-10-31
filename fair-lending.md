# Fair Lending

> **General Policy Statement**\
> Pynthia FCU prohibits discrimination in all lending activities and ensures equal access to credit for all creditworthy applicants. This policy sets required controls, timing, and records to comply with ECOA/Reg B, FHA/NCUA, Reg Z, and related rules across marketing, origination, servicing, collections, and third parties.

***

### Multi-Rule Authority Table <a href="#authority" id="authority"></a>

| Topic                              | Scope                                                            | Key Clauses / Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ECOA / Reg B**                   | All credit; inquiries; evaluation; action-taken notices; records | 12 CFR [**1002.5**](https://www.ecfr.gov/current/title-12/part-1002#p-1002.5) (inquiries), [**1002.6**](https://www.ecfr.gov/current/title-12/part-1002#p-1002.6) (evaluation), [**1002.9**](https://www.ecfr.gov/current/title-12/part-1002#p-1002.9) (action taken), [**1002.12**](https://www.ecfr.gov/current/title-12/part-1002#p-1002.12) (retention), [**1002.14**](https://www.ecfr.gov/current/title-12/part-1002#p-1002.14) (appraisals/ROV), [**1002.2**](https://www.ecfr.gov/current/title-12/part-1002#p-1002.2) (definitions) |
| **FHA / HUD / NCUA**               | Real-estate-related transactions; signage/ads                    | [**42 USC §3605**](https://www.law.cornell.edu/uscode/text/42/3605); [**24 CFR Part 100**](https://www.ecfr.gov/current/title-24/part-100); [**12 CFR 701.31**](https://www.ecfr.gov/current/title-12/part-701/section-701.31)                                                                                                                                                                                                                                                                                                               |
| **HMDA / Reg C** _(if applicable)_ | GMI; LAR; submission/disclosure                                  | 12 CFR [**1003.4**](https://www.ecfr.gov/current/title-12/part-1003#p-1003.4) and related sections                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **TILA / Reg Z**                   | Advertising; **Loan Originator Compensation**; anti-steering     | 12 CFR [**1026.24**](https://www.ecfr.gov/current/title-12/part-1026#p-1026.24) (advertising), [**1026.36(d),(e)**](https://www.ecfr.gov/current/title-12/part-1026#p-1026.36) (LO comp/steering)                                                                                                                                                                                                                                                                                                                                            |
| **ADA**                            | Access & reasonable accommodation                                | [**28 CFR Part 36**](https://www.ecfr.gov/current/title-28/part-36); [**29 CFR Part 1630**](https://www.ecfr.gov/current/title-29/part-1630)                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Related**                        | FCRA/Reg V; UDAAP; Appraisal Independence                        | [**15 USC §1681 et seq.**](https://www.law.cornell.edu/uscode/text/15/chapter-41/subchapter-III) (FCRA); interagency appraisal independence rules; CFPB UDAAP standards                                                                                                                                                                                                                                                                                                                                                                      |

***

### Action-Taken Timing Matrix (Reg B §1002.9) <a href="#timing-matrix" id="timing-matrix"></a>

| Scenario                                         | Trigger (human → event)                                                   |          Deadline | Content Reference                                                    | Control                                             |
| ------------------------------------------------ | ------------------------------------------------------------------------- | ----------------: | -------------------------------------------------------------------- | --------------------------------------------------- |
| **Completed application — approve/counter/deny** | Decision recorded (**decision.recorded**)                                 |       **30 days** | AAN content incl. score block if score used                          | [FL-05](fair-lending.md#fl-05-action-taken-notices) |
| **Incomplete application**                       | App marked incomplete (**application.incomplete**) _or_ 30d since receipt |     **≤ 30 days** | Info needed + deadline; note no further consideration after deadline | [FL-05](fair-lending.md#fl-05-action-taken-notices) |
| **Existing account adverse action**              | Adverse change posted (**account.adverse\_action**)                       |       **30 days** | AAN content                                                          | [FL-05](fair-lending.md#fl-05-action-taken-notices) |
| **Counteroffer not accepted/used**               | Counteroffer expired (**counteroffer.expired**)                           |       **90 days** | AAN content                                                          | [FL-05](fair-lending.md#fl-05-action-taken-notices) |
| **Small-business credit by phone (≤$1MM rev)**   | Decision given orally (**decision.given\_oral**)                          | “Reasonable time” | Oral allowed; log rights disclosure                                  | [FL-05](fair-lending.md#fl-05-action-taken-notices) |

***

### Control Index <a href="#control-index" id="control-index"></a>

| ID                                                                    | Control Name                     | Purpose                                                                        | Primary Rule(s)                                                                                                                                                                                                                      |
| --------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [**FL-01**](fair-lending.md#fl-01-prohibition-protected-bases)        | Prohibition & Protected Bases    | Ban disparate treatment/impact/redlining; list protected traits                | Reg B [**§1002.4**](https://www.ecfr.gov/current/title-12/part-1002#p-1002.4); [**NCUA 701.31**](https://www.ecfr.gov/current/title-12/part-701/section-701.31); [**42 USC §3605**](https://www.law.cornell.edu/uscode/text/42/3605) |
| [**FL-02**](fair-lending.md#fl-02-permissible-inquiries)              | Permissible Inquiries            | What we may/may not ask (spouse, marital status, sex, dependents, immigration) | Reg B [**§1002.5**](https://www.ecfr.gov/current/title-12/part-1002#p-1002.5)                                                                                                                                                        |
| [**FL-03**](fair-lending.md#fl-03-evaluation-pricing-rules)           | Evaluation & Pricing Rules       | Sound scoring; judgmental standards; sensitive info; pricing exceptions        | Reg B [**§1002.6**](https://www.ecfr.gov/current/title-12/part-1002#p-1002.6); appraisals [**§1002.14**](https://www.ecfr.gov/current/title-12/part-1002#p-1002.14)                                                                  |
| [**FL-04**](fair-lending.md#fl-04-appraisal-independence-rov)         | Appraisal Independence & ROV     | Prohibit biased valuations; define ROV pathway                                 | Reg B [**§1002.14**](https://www.ecfr.gov/current/title-12/part-1002#p-1002.14); [**NCUA 701.31**](https://www.ecfr.gov/current/title-12/part-701/section-701.31)                                                                    |
| [**FL-05**](fair-lending.md#fl-05-action-taken-notices)               | Action-Taken Notices             | Timing/content; score disclosure; joint/guarantor nuances                      | Reg B [**§1002.9**](https://www.ecfr.gov/current/title-12/part-1002#p-1002.9); FCRA [**§615**](https://www.law.cornell.edu/uscode/text/15/1681m)                                                                                     |
| [**FL-06**](fair-lending.md#fl-06-government-monitoring-gmi-hmda)     | Government Monitoring (GMI/HMDA) | When/how to collect GMI; refusals; visual rules; LAR integrity                 | Reg B [**§1002.13**](https://www.ecfr.gov/current/title-12/part-1002#p-1002.13); Reg C [**Part 1003**](https://www.ecfr.gov/current/title-12/part-1003)                                                                              |
| [**FL-07**](fair-lending.md#fl-07-advertising-fair-housing)           | Advertising & Fair Housing       | Trigger terms; APR prominence; FH legend; digital targeting                    | Reg Z [**§1026.24**](https://www.ecfr.gov/current/title-12/part-1026#p-1026.24); [**NCUA 701.31**](https://www.ecfr.gov/current/title-12/part-701/section-701.31); FHA [**§3605**](https://www.law.cornell.edu/uscode/text/42/3605)  |
| [**FL-08**](fair-lending.md#fl-08-lo-compensation-anti-steering)      | LO Compensation & Anti-Steering  | No comp by terms/proxies; meaningful alternatives evidence                     | Reg Z [**§1026.36(d),(e)**](https://www.ecfr.gov/current/title-12/part-1026#p-1026.36)                                                                                                                                               |
| [**FL-09**](fair-lending.md#fl-09-third-party-fair-lending-oversight) | Third-Party Oversight            | Due diligence; monthly MI pack; escalation                                     | ECOA creditor liability (Reg B [**Part 1002**](https://www.ecfr.gov/current/title-12/part-1002)); NCUA TPRM expectations                                                                                                             |
| [**FL-10**](fair-lending.md#fl-10-monitoring-reviews)                 | Monitoring & Reviews             | Quarterly disparity analytics; redlining screens; Board reporting              | Program expectations under Reg B/FHA; HMDA analytics (Reg C [**Part 1003**](https://www.ecfr.gov/current/title-12/part-1003))                                                                                                        |
| [**FL-11**](fair-lending.md#fl-11-training)                           | Training                         | Role-based onboarding + annual                                                 | NCUA supervisory expectations; ECOA program effectiveness                                                                                                                                                                            |
| [**FL-12**](fair-lending.md#fl-12-record-retention)                   | Record Retention                 | Reg B/Reg C periods; business-credit special; litigation hold                  | Reg B [**§1002.12**](https://www.ecfr.gov/current/title-12/part-1002#p-1002.12); Reg C [**Part 1003**](https://www.ecfr.gov/current/title-12/part-1003)                                                                              |

***

## Control Overlays (Design Overlay v2)

> **Note:** Lawyer-first, engineer-ready. Use human phrasing with event/field codes in parentheses.\
> Intentionally excluded at v1: **Interfaces**, **Acceptance Tests**, **Data Model Notes** (Engineering adds later).

### FL-01 — Prohibition & Protected Bases <a href="#fl-01-prohibition-protected-bases" id="fl-01-prohibition-protected-bases"></a>

**WHY (Reg cite):** Reg B §1002.4; FHA; NCUA 701.31\
**SYSTEM BEHAVIOR:** System and staff must not use protected traits or proxies at any stage; avoid unjustified disparate impact and redlining.\
**TRIGGERS (human → event):** Credit decision recorded (**decision.recorded**); marketing campaign launched (**campaign.launched**); collections action (**collection.action**)\
**INPUTS (human → field):** Underwriting inputs (**uw\_inputs\[]**); pricing sheet (**pricing\_sheet\_id**); marketing criteria/geo (**marketing\_criteria**)\
**OUTPUTS:** Compliance attestation on launches (**compliance.attestation**)\
**TIMERS/SLAs:** Annual policy review; quarterly Board reporting.\
**EDGE CASES:** Neighborhood/ZIP as proxy; property-age/location as proxy (real-estate).\
**AUDIT LOGS:** `policy.attested`, `marketing.criteria_reviewed`, `uw.rule_change_reviewed`\
**ACCESS CONTROL:** Compliance approves protected-trait list and proxy guardrails.\
**ALERTS/METRICS:** Exception rate; proxy variable flags.

***

### FL-02 — Permissible Inquiries <a href="#fl-02-permissible-inquiries" id="fl-02-permissible-inquiries"></a>

**WHY:** Reg B §1002.5\
**SYSTEM BEHAVIOR:** Limit questions on spouse, marital status, sex, childbearing, immigration to what’s permitted; present required disclosures (e.g., alimony/child support need not be disclosed unless relied upon).\
**TRIGGERS:** Application created (**application.created**); HMDA-covered product selected (**product.hmda\_scope**)\
**INPUTS:** Product type (**product\_type**); community-property flag (**community\_property\_state**); reliance on spouse/ACSM (**income\_reliance\_flags**)\
**OUTPUTS:** Applicant disclosures presented/logged (**disclosure.presented**)\
**TIMERS/SLAs:** Disclosures shown **before** sensitive fields are collected.\
**EDGE CASES:** Joint vs individual apps; visual observation when GMI refused.\
**AUDIT LOGS:** `disclosure.shown`, `sensitive_field.collected`\
**ACCESS CONTROL:** Compliance owns disclosure text.\
**ALERTS/METRICS:** % apps with proper disclosures (target 100%).

***

### FL-03 — Evaluation & Pricing Rules <a href="#fl-03-evaluation-pricing-rules" id="fl-03-evaluation-pricing-rules"></a>

**WHY:** Reg B §1002.6; §1002.14\
**SYSTEM BEHAVIOR:** Use demonstrably/statistically sound scoring or documented judgmental criteria; never assign negative factors for elderly; treat public-assistance income equally; require pricing exception capture/approval.\
**TRIGGERS:** Underwriting requested (**uw.requested**); price quoted (**pricing.quoted**); deviation detected (**pricing.deviation\_detected**)\
**INPUTS:** Score(s) (**credit\_score\[]**); model version (**model\_version**); income sources (**income\_types\[]**); baseline price (**baseline\_rate**)\
**OUTPUTS:** UW rationale (**uw.rationale**); pricing exception record (**pricing\_exception.record**)\
**TIMERS/SLAs:** Monthly Compliance exception review by **the 10th**.\
**EDGE CASES:** Term exceeds life expectancy; collateral adequacy; telephone listing not considered.\
**AUDIT LOGS:** `uw.decision_saved`, `pricing.exception_created`\
**ACCESS CONTROL:** Designated approvers only.\
**ALERTS/METRICS:** Exception rate %; elderly negatives (target 0).\
**CONFIG FLAGS (optional):** “Elderly non-negative” rule (default **on**).

***

### FL-04 — Appraisal Independence & ROV <a href="#fl-04-appraisal-independence-rov" id="fl-04-appraisal-independence-rov"></a>

**WHY:** Reg B §1002.14; FHA/NCUA 701.31\
**SYSTEM BEHAVIOR:** Do not rely on biased appraisals; provide reconsideration-of-value (ROV) pathway and log outcomes.\
**TRIGGERS:** Appraisal received (**appraisal.received**); ROV requested (**rov.requested**)\
**INPUTS:** Appraisal metadata (**appraisal\_id, provider**); ROV evidence (**rov\_evidence\[]**)\
**OUTPUTS:** ROV decision notice (**rov.decision\_notice**)\
**TIMERS/SLAs:** ROV review within **15 days** of request.\
**EDGE CASES:** Multiple valuations; AVMs.\
**AUDIT LOGS:** `rov.request_logged`, `rov.decision_logged`\
**ACCESS CONTROL:** Separate valuation staff (no production influence).\
**ALERTS/METRICS:** # ROVs; % value changes.

***

### FL-05 — Action-Taken Notices <a href="#fl-05-action-taken-notices" id="fl-05-action-taken-notices"></a>

**WHY:** Reg B §1002.9; FCRA\
**SYSTEM BEHAVIOR:** Generate and send notices per timing matrix; include score block when a score is used; handle joint/guarantor and business-credit nuances.\
**TRIGGERS:** Application marked complete (**application.completed**); decision recorded (**decision.recorded**); counteroffer issued/expired (**counteroffer.issued / counteroffer.expired**); existing account adverse action (**account.adverse\_action**)\
**INPUTS:** Completion date (**completed\_at**); decision type/date (**decision\_type, decision\_at**); applicant contact(s) (**applicant\_contacts\[]**); score used + details (**used\_credit\_score, score, score\_date, score\_min, score\_max**); denial reasons (**adverse\_reasons\[]**)\
**OUTPUTS:** Decision notice (**notice.action\_taken**); proof of delivery (**notice.delivery\_log**); score disclosure (**notice.score\_disclosure**)\
**TIMERS/SLAs:** As per [Timing Matrix](fair-lending.md#timing-matrix).\
**EDGE CASES:** Separate score disclosures for co-applicants; oral permissible for certain small-business phone apps (log rights disclosure).\
**AUDIT LOGS:** `notice.sent`, `deadline.breached`\
**ACCESS CONTROL:** Lending Ops/System send; Compliance can view/void/resend with reason.\
**ALERTS/METRICS:** On-time rate ≥ 99.5%; breach count 0.

***

### FL-06 — Government Monitoring (GMI/HMDA) <a href="#fl-06-government-monitoring-gmi-hmda" id="fl-06-government-monitoring-gmi-hmda"></a>

**WHY:** Reg B §1002.13; Reg C\
**SYSTEM BEHAVIOR:** For covered transactions, **ask but do not require** GMI; if declined, record via visual/surname rule where required; maintain LAR accuracy.\
**TRIGGERS:** HMDA coverage detected (**hmda.covered\_detected**)\
**INPUTS:** GMI fields (**gmi\_fields**); refusal (**gmi\_refused**)\
**OUTPUTS:** GMI record; HMDA LAR entries (**hmda.lar\_record**)\
**TIMERS/SLAs:** Quarterly LAR QC; annual submission per Reg C calendar.\
**EDGE CASES:** Mail/phone apps; multiple applicants.\
**AUDIT LOGS:** `gmi.collected`, `hmda.lar_updated`\
**ACCESS CONTROL:** Compliance owns HMDA mapping.\
**ALERTS/METRICS:** LAR error rate below threshold.

***

### FL-07 — Advertising & Fair Housing <a href="#fl-07-a-dvertising-fair-housing" id="fl-07-a-dvertising-fair-housing"></a>

**WHY:** Reg Z §1026.24; FHA; NCUA 701.31\
**SYSTEM BEHAVIOR:** Enforce trigger-term disclosures; apply Fair Housing legend for real-estate ads; prohibit exclusionary geo-targeting; require pre-flight checklist.\
**TRIGGERS:** Campaign created (**campaign.created**)\
**INPUTS:** Ad copy (**ad\_copy**); media plan/geo (**media\_geo**)\
**OUTPUTS:** Pre-flight approval log (**ad.preflight\_approved**)\
**TIMERS/SLAs:** Approval **before** launch.\
**EDGE CASES:** Social/dynamic ads; co-marketing partners.\
**AUDIT LOGS:** `ad.preflight_approved`, `ad.launched`\
**ACCESS CONTROL:** Marketing drafts; Compliance approves.\
**ALERTS/METRICS:** % ads with checklist (target 100%).

***

### FL-08 — LO Compensation & Anti-Steering <a href="#fl-08-lo-compensation-anti-steering" id="fl-08-lo-compensation-anti-steering"></a>

**WHY:** Reg Z §1026.36(d),(e)\
**SYSTEM BEHAVIOR:** Prohibit compensation based on loan terms/proxies; present/document meaningful alternatives (e.g., lowest rate, lowest fees, lowest total cost); block finalization without evidence.\
**TRIGGERS:** Pricing requested (**pricing.requested**); options presented (**options.presented**); option selected (**option.selected**)\
**INPUTS:** Eligibility & pricing snapshot (**eligibility\_flags, pricing\_snapshot\_id**); options shown (**options\_shown\[]**); chosen option + rationale (**chosen\_option\_id, selection\_rationale**)\
**OUTPUTS:** Anti-steering evidence (**anti\_steering.record**); exception if <3 options (**anti\_steering.exception**)\
**TIMERS/SLAs:** Evidence **before** disposition.\
**EDGE CASES:** <3 eligible options → Compliance waiver required.\
**AUDIT LOGS:** `anti_steering.recorded`, `waiver.decision`\
**ACCESS CONTROL:** LOs present/select; Compliance reviews.\
**ALERTS/METRICS:** Evidence rate 100%; exception trend.

***

### FL-09 — Third-Party Fair-Lending Oversight <a href="#fl-09-third-party-fair-lending-oversight" id="fl-09-third-party-fair-lending-oversight"></a>

**WHY:** ECOA liability flows to creditor; NCUA TPRM\
**SYSTEM BEHAVIOR:** Perform due diligence at onboarding; require monthly Fair-Lending MI pack (apps/approvals/pricing/exceptions/complaints) from vendors; escalate corrective actions.\
**TRIGGERS:** Vendor onboarded (**vendor.onboarded**); monthly MI due (**mi.due.monthly**)\
**INPUTS:** Vendor attestation (**vendor.attestation**); MI dataset (**mi.dataset**)\
**OUTPUTS:** MI review log; corrective action plan (**cap.issued**)\
**TIMERS/SLAs:** MI due by **5th business day** monthly.\
**EDGE CASES:** Brokers/lead gens/appraisers/CRAs.\
**AUDIT LOGS:** `mi.received`, `cap.issued`, `cap.closed`\
**ACCESS CONTROL:** TPRM + Compliance.\
**ALERTS/METRICS:** MI on-time rate; unresolved CAPs.

***

### FL-10 — Monitoring & Reviews <a href="#fl-10-monitoring-reviews" id="fl-10-monitoring-reviews"></a>

**WHY:** Program effectiveness & Board oversight\
**SYSTEM BEHAVIOR:** Quarterly disparity analytics (apps/approvals/price/terms/denials/exceptions); annual redlining review; Board reporting with corrective actions.\
**TRIGGERS:** Quarter closed (**quarter.closed**); annual redlining cycle (**annual.redlining\_cycle**)\
**INPUTS:** Lending dataset (**lending\_dataset**); geographies (**msa\_counties**)\
**OUTPUTS:** Quarterly FL report; Board packet (**board.packet.fl**)\
**TIMERS/SLAs:** Quarterly by **+30 days**; annual redlining by **Q1**.\
**EDGE CASES:** Low-volume segments → qualitative review.\
**AUDIT LOGS:** `report.published`, `board.briefed`\
**ACCESS CONTROL:** Compliance leads; Lending/Analytics support.\
**ALERTS/METRICS:** Disparity deltas beyond thresholds trigger CAP.

***

### FL-11 — Training <a href="#fl-11-training" id="fl-11-training"></a>

**WHY:** Control effectiveness\
**SYSTEM BEHAVIOR:** Role-based onboarding + annual; track completion; refresh on rule/product changes.\
**TRIGGERS:** New hire (**hr.hire**); annual cycle (**training.annual**)\
**INPUTS:** Role map (**role\_matrix**)\
**OUTPUTS:** Completion records (**training.completed**)\
**TIMERS/SLAs:** Within **30 days** of role start; annually by **Dec 31**.\
**EDGE CASES:** Contractors/third parties included.\
**AUDIT LOGS:** `training.assigned`, `training.completed`\
**ACCESS CONTROL:** Compliance + HR.\
**ALERTS/METRICS:** Completion ≥ 98%.

***

### FL-12 — Record Retention <a href="#fl-12-record-retention" id="fl-12-record-retention"></a>

**WHY:** Reg B §1002.12; Reg C\
**SYSTEM BEHAVIOR:** Retain specified records; extend on litigation/investigation hold.\
**TRIGGERS:** Action taken (**decision.recorded**); investigation notice (**legal.hold\_issued**)\
**INPUTS:** Record type (**record\_type**); action date (**action\_date**)\
**OUTPUTS:** Retention schedule applied (**retention.applied**)\
**TIMERS/SLAs — Retention Grid:**

* Applications/decisions (consumer): **25 months**
* Applications/decisions (business ≤ $1MM): **12 months** _(oral allowed in some cases; keep logs)_
* Certain business credit (> $1MM or trade/factoring): **60 days**; if reasons requested or retain requested → **12 months**
* Existing-account adverse actions: **25 months**
* HMDA/GMI: per Reg C/Reg B calendars
* LO-Comp records: per Reg Z
* **Litigation/Investigation hold:** retain until final disposition\
  **EDGE CASES:** Self-tests retained **25 months** from completion.\
  **AUDIT LOGS:** `retention.clock_started`, `legal.hold_issued`, `legal.hold_released`\
  **ACCESS CONTROL:** Compliance + Legal.

***

### Embedded Checklists & Templates <a href="#checklists" id="checklists"></a>

* **Ad Notices Pack (FL-05):** AAN, Incomplete, Counteroffer, Business-credit oral script.
* **Anti-Steering Evidence (FL-08):** 3-option snapshot + selection rationale.
* **Vendor MI Pack (FL-09):** required metrics + file layout.
* **Quarterly FL Report (FL-10):** disparity metrics, exceptions, complaints, redlining preview.

***

### Governance & Sign-Off <a href="#governance" id="governance"></a>

* **Owner:** \{{Fair Lending Officer, Title\}}
* **Approvals:** \{{Board Chair\}}, \{{Chief Lending\}}, \{{Compliance Lead\}}
* **Review Cadence:** Annual or upon regulatory/product change.
* **Cross-References:** \{{Model Risk Policy\}}, \{{Marketing & Advertising SOP\}}, \{{Third-Party Risk Program\}}, \{{Collections Policy\}}.

> **Definition of Done (v1):** Authority table + timing matrix + control index present; each control has a Design Overlay v2 (no interfaces/tests/data model yet); SLAs/owners and audit events named; checklists stubbed or linked.
