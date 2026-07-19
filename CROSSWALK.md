# CG-\* ↔ control catalogue crosswalk

> **Generated** by `scripts/build_crosswalk.py`. Do not edit by hand —
> edit `crosswalk-mappings.json` (judgments) or
> `crosswalk-emitted-events.json` (event inventory) and regenerate.

Catalogue: **316** distinct controls across **27** policies (333 rows — shared controls like SC-02 are replicated into every policy that references them, and are counted once here). 
Implemented: **10** `CG-*` controls. 
Event codes the core can emit: **65**. 
Distinct trigger events the catalogue demands: **787**.

## How to read this

This artifact is used to make regulatory coverage claims, so it is built
to **under-claim**. A verdict of `discharges` asserts that a catalogue
control needs no further work. **Nothing currently holds that verdict.**

| Verdict | Meaning |
|---|---|
| `discharges` | fully satisfies the catalogue control |
| `partially_discharges` | satisfies part — the gaps say exactly what is missing |
| `related` | same subject area, does **not** discharge |
| `no_catalogue_counterpart` | nothing in the catalogue corresponds |

Claims marked **needs review** are proposals awaiting a compliance
reviewer, not findings. A row is only load-bearing once `reviewed_by` is set.

> **control_id is not unique.** `CP-01`, `CP-02`, `CP-03`, `CP-04`, `CP-05`, `CP-06`, `CP-07`, `CP-08`, `CP-09`, `CP-10` each name more than one distinct control. A crosswalk claim citing a colliding id is refused by the build rather than resolved arbitrarily, because the two controls may be unrelated.

## Evidence provenance

`control_result` rows are this repo's evidence artifact, and until
migration `20260719000900` nothing on the row recorded where it came
from. `analytics/seed.sh` drives the deployed API specifically to trip
every control, and the e2e harness fires 159 live assertions at the same
tables — so rows written before that migration are a mixture of real gate
decisions, demo seeding and test assertions with no way to tell them
apart. They are labelled `unknown`, which is the only claim the data
supports.

**Evidence written before the provenance migration cannot support a
coverage claim.** Simulated evidence lives in the `sim` schema and is
structurally unreachable from `core` — the check constraints make
`provenance = 'simulated'` unrepresentable in a core table, so it is not
a filter that could be forgotten. This build hard-fails if any
non-`production` row reaches a coverage count.

## Summary of claims

| Verdict | Claims |
|---|---:|
| `partially_discharges` | 8 |
| `related` | 4 |
| `no_catalogue_counterpart` | 2 |

Open questions requiring a decision: **17** (5 high severity).

Awaiting review: **13** of 14 claims. 
Reviewed: **0**.

## View 1 — what each implemented control discharges

### `CG-CTR-01`

*On any single money movement above $10,000 (1_000_000 cents) on any of the four rails, writes a control_result (decision 'pass') and opens a bsa_alert of type 'ctr_threshold' with requires_lookback=true. Does not block.*

Source: `supabase/functions/api/transfers.ts`

**BSA-08 — Currency Transaction Reporting (CTR)** → `related` ⚠️ **needs review**

Shares the $10,000 threshold and the name, but is not the same control. A CTR obligation under 31 CFR 1010.311 attaches to CURRENCY transactions — physical cash in or out. CG-CTR-01 fires on book transfers, wires, ACH and card authorizations, none of which are currency transactions, so a CTR is not owed on any event it detects. Treating this as CTR coverage would claim a filing obligation is met that was never triggered, while leaving actual cash handling unmonitored.

Missing:

- wrong transaction class: BSA-08 aggregates ctr.cash_in_total / ctr.cash_out_total; the core has no cash-handling surface at all
- wrong aggregation unit: BSA-08 aggregates per person per business day; CG-CTR-01 evaluates a single transaction against one account
- no filing: BSA-08 requires e-filing to FinCEN within 15 calendar days (ctr.filing_timer); nothing files
- no exemptions: Phase I/II exemption handling, DOEP (FinCEN Form 110), annual exemption review are all absent
- required inputs unavailable: entity.tin and entity.name are not joined to the transaction

> Would discharge if: the core gains a cash-handling surface, per-person aggregation via entity linkage, and a FinCEN filing path. That is BSA-08 being implemented, not CG-CTR-01 being extended.

**BSA-06 — Transaction Monitoring & Case Management** → `partially_discharges` ⚠️ **needs review**

BSA-06's first rule triggers on bsa_alert.created with inputs alert_type, entity_hash, event_id and requires_lookback. CG-CTR-01 writes exactly that row shape, so it genuinely performs the rules-based detection half of BSA-06 for one alert class. Everything downstream of the alert is absent. UPDATED: the downstream half now exists — alerts carry a 2-business-day triage deadline, escalate to a real core.case, and reach a documented SAR/no-SAR decision, with a sweep that surfaces breached timers. bsa_alert.event_id is populated (OQ-05 resolved), so the alert joins back to its causing event as BSA-06 requires. Still not a full discharge: see gaps.

Missing:

- covers three alert typologies (CTR threshold, inbound and outbound structuring) plus OFAC and unauthorized-ACH-return; BSA-06 expects monitoring across all typologies
- model-based monitoring is absent — detection is rules-based only
- no SAR committee: BSA-06 names BSA Officer + Compliance + counsel as the deciding body, and the actor model has no such roles (see OQ-08)
- covers one alert_type only; BSA-06 expects monitoring across all typologies

### `CG-STR-01`

*Sums same-day INBOUND book transfers to a destination account; when the aggregate crosses $10,000 with no single transfer above it, writes a control_result and opens a bsa_alert of type 'structuring'. Book transfers only — wires/ACH/card have no destination account row.*

Source: `supabase/functions/api/transfers.ts`

**BSA-06 — Transaction Monitoring & Case Management** → `partially_discharges` ⚠️ **needs review**

Same basis as CG-CTR-01: it is genuine rules-based detection producing a conforming bsa_alert row, which is BSA-06's trigger. It adds an aggregation typology the per-transaction gate structurally cannot see. UPDATED: the downstream half now exists — alerts carry a 2-business-day triage deadline, escalate to a real core.case, and reach a documented SAR/no-SAR decision, with a sweep that surfaces breached timers. bsa_alert.event_id is populated (OQ-05 resolved), so the alert joins back to its causing event as BSA-06 requires. Still not a full discharge: see gaps.

Missing:

- covers three alert typologies (CTR threshold, inbound and outbound structuring) plus OFAC and unauthorized-ACH-return; BSA-06 expects monitoring across all typologies
- model-based monitoring is absent — detection is rules-based only
- no SAR committee: BSA-06 names BSA Officer + Compliance + counsel as the deciding body, and the actor model has no such roles (see OQ-08)
- inbound book transfers only: a member receiving structured deposits by ACH is not seen, because ACH has no destination account row in this core
- single-day window only; BSA-06 monitoring typically spans multi-day patterns
- per-account, not per-person: splitting across two accounts owned by the same member evades it entirely

**BSA-07 — SAR Filing & Confidentiality** → `partially_discharges` ⚠️ **needs review**

UPGRADED from 'related'. The filing DECISION now exists: a case reaches file or no_file, both require a documented rationale (an undocumented no-file is refused rather than stored, which is BSA-07's retention requirement), the 30/60-day clock runs from detection rather than triage, and a late decision is recorded as late instead of silently accepted. Confidentiality is enforced structurally: case management is closed to partner actors and returns 404 rather than 403, so the existence of a case is not disclosed.

Missing:

- no actual FinCEN filing: sar.filed records the DECISION to file, not a submission
- no continuing-activity SAR timer (sar.continuing_timer) — 90-day continuing reviews absent
- no 314(a)/(b) disclosure-request handling (sar.disclosure_request.received)
- no SAR committee composition or Board reporting of filings
- retention of SAR records and supporting documentation is not implemented

### `CG-STR-02`

*Same as CG-STR-01 but on OUTBOUND daily volume, reusing the cross-rail velocity sum. Covers all four rails, since it keys on the source account.*

Source: `supabase/functions/api/transfers.ts`

**BSA-06 — Transaction Monitoring & Case Management** → `partially_discharges` ⚠️ **needs review**

As CG-STR-01. Broader than its inbound twin because it aggregates across all four rails rather than book transfers only. UPDATED: the downstream half now exists — alerts carry a 2-business-day triage deadline, escalate to a real core.case, and reach a documented SAR/no-SAR decision, with a sweep that surfaces breached timers. bsa_alert.event_id is populated (OQ-05 resolved), so the alert joins back to its causing event as BSA-06 requires. Still not a full discharge: see gaps.

Missing:

- covers three alert typologies (CTR threshold, inbound and outbound structuring) plus OFAC and unauthorized-ACH-return; BSA-06 expects monitoring across all typologies
- model-based monitoring is absent — detection is rules-based only
- no SAR committee: BSA-06 names BSA Officer + Compliance + counsel as the deciding body, and the actor model has no such roles (see OQ-08)
- single-day window only
- per-account, not per-person

### `CG-OFAC-01`

*Runs first on every verification path and is decisive — no attestation, forced simulation outcome or provider choice can override it. Writes a control_result on EVERY run including clean passes. On a hit: denies the verification and opens a bsa_alert of type 'ofac'.*

Source: `supabase/functions/api/kyc.ts`
  · screening function: `/\bSDN\b/i tested against entity.name`

**BSA-05 — OFAC Screening & Holds** → `related`

This is the mapping most at risk of being over-claimed, so it is stated bluntly: the enforcement MECHANISM is real and well built — always-on, unbypassable, evidence on every run — but the SCREEN is a sandbox stub. It matches the literal token 'SDN' in a name against no list at all. A control whose comparison set is empty cannot discharge a screening obligation no matter how sound the plumbing around it is. The mechanism is worth crediting; the coverage is zero.

Missing:

- no sanctions list: matches a name marker, not SDN/CONS/NS-PLC or any other list; ofac.list_version is never recorded
- not run on payments: BSA-05 triggers on wire_transfer.submitted for beneficiary and originator screening; CG-OFAC-01 runs only on verification, so no wire, ACH or card payment is screened at all
- no 50% rule: entities 50%+ owned by a blocked person are not derived, though core.entity.owners holds the ownership data that would allow it
- no hold: BSA-05 requires ofac.hold.placed and segregation of blocked funds; the verification is denied but no funds are held
- no adjudication: no Sanctions Analyst routing, no 1-business-day SLA, no false-positive clearing with documented rationale
- no reporting: OFAC Reporting System filing within 10 business days and the annual blocked-property report (by Sept 30) are absent
- beneficial owners and counterparties are not screened, only the entity itself

> Would discharge if: a real list with version tracking is wired into ofacScreen(), screening is added at payment submission, and the hold/adjudication/reporting workflow exists. The always-on floor design means the first of those is a genuinely small change with a large coverage effect.

**LP-11 — OFAC & Sanctions Gate (lending)** → `related` ⚠️ **needs review**

LP-11 gates loan origination on sanctions screening. The lending subsystem does not exist — core.loan and core.loan_application are schema-only with no writer — so there is no origination path for this control to gate. Listed so the mapping is not silently forgotten when lending is built.

Missing:

- no lending subsystem: no writer for loan or loan_application
- same screening-stub limitation as BSA-05

### `CG-VEL-01`

*Blocks any money movement that would push the source account's same-day outbound volume above $25,000, aggregated across all four rails. The only CG-* control that BLOCKS rather than observes.*

Source: `supabase/functions/api/transfers.ts`

**no catalogue counterpart** → `no_catalogue_counterpart` ⚠️ **needs review**

No control among the 333 imposes a per-account daily transaction cap. Searching the catalogue for velocity / daily limit / transaction limit returns only MP-05 (Account Restrictions and Closures, which is about restricting an account after a member-conduct decision, not a standing volume ceiling) and TIS-02 (Pre-Opening Account Disclosures, which is about disclosing limits, not enforcing them). CG-VEL-01 is a safety-and-soundness engineering control the institution chose, not a policy obligation the corpus demands.

Candidates examined and rejected: `MP-05`, `TIS-02`

> Implication: It should not appear in a regulatory coverage claim at all. If the $25,000 cap is intended to be a member-facing account limit, TIS-02 may create a DISCLOSURE obligation for it — that is the reverse direction from coverage and is worth a compliance opinion.

### `CG-NSF-01`

*Reads the live Blnk balance and rejects the movement when available funds are below the amount. Writes a control_result with decision 'reject'.*

Source: `supabase/functions/api/transfers.ts`

**no catalogue counterpart** → `no_catalogue_counterpart` ⚠️ **needs review**

Refusing to overdraw an account is basic ledger correctness, not a compliance control. The catalogue's overdraft-related controls are all about DISCLOSURE or COLLECTION, never about refusal: TIS-08 (Overdraft Service Disclosures) and TIS-05 (Periodic Statement Disclosures) govern what must be told to the member, and CO-10 (Overdraft Collections and Fee Waiver Practices) governs what happens after an overdraft occurs. None is discharged by declining the transaction.

Candidates examined and rejected: `TIS-08`, `TIS-05`, `CO-10`

> Implication: Because this core refuses overdrafts outright, TIS-08 and CO-10 may be entirely inapplicable rather than unimplemented — there is no overdraft service to disclose and no overdraft to collect. That is a scoping question for compliance, and answering it would remove two controls from the backlog rather than adding them.

### `CG-CASH-01`

*Records currency movement (cash_in/cash_out) against a person, aggregates per person per business day with cash-in and cash-out assessed SEPARATELY, opens a CTR obligation with a 15-calendar-day clock when either direction exceeds $10,000, and surfaces currency that cannot be attributed to a person as an explicit finding rather than dropping or mis-bucketing it.*

Source: `supabase/functions/api/cash.ts`

**BSA-08 — Currency Transaction Reporting (CTR)** → `partially_discharges` ⚠️ **needs review**

This is the first thing in the core that represents CURRENCY, which is what a CTR obligation under 31 CFR 1010.311 actually attaches to — and therefore the first control that can genuinely address BSA-08 (see OQ-01, where CG-CTR-01 was found to fire only on non-reportable electronic movements). It aggregates ctr.cash_in_total and ctr.cash_out_total per person per business day, keeps the two directions separate so a $6k deposit plus a $6k withdrawal does not manufacture a false obligation, fires ctr.threshold.reached (BSA-08's declared trigger), and starts the 15-day ctr.filing_timer. Currency that cannot be attributed to a person is counted and reported as unattributable rather than silently dropped or bucketed as its own person — both of which would understate the aggregate and hide obligations.

Missing:

- no actual FinCEN transmission: ctr.filed records the DECISION and a reference, not a submission
- no exemptions: Phase I/II handling, DOEP (FinCEN Form 110) and annual exemption review are absent — exemption_basis is stored but never evaluated (OQ-13)
- entity.tin and entity.name are required inputs of BSA-08 and are reachable via the entity link, but the filing does not yet populate them
- legacy accounts have no owning entity (OQ-12), so their currency is unattributable and no CTR determination exists for it — visible, but a real coverage hole
- no backfilling coordination with the FinCEN Help Line
- cash OPERATIONS controls (CP-01..CP-12: vault limits, dual control, reconciliation, over/short) are a separate domain built on this ledger and do not exist yet

> Would discharge if: a FinCEN transmission path, exemption evaluation, and complete entity linkage exist. The detection and timing half is now real.

### `CG-DUAL-01`

*Maker-checker on payment origination. Wire dual control is unconditional (EPS-06 states it as required): a wire cannot reach 'completed' without an approver distinct from its preparer, enforced by ck_wire_dual_control_before_complete. ACH is threshold-based per client; with no configured limit the batch is recorded UNASSESSED rather than exempt or required, and appears in GET /eps/pending-approvals as such.*

Source: `supabase/functions/api/eps.ts`

**EPS-06 — Dual Control for High-Risk Processes** → `partially_discharges` ⚠️ **needs review**

This control corrected the API rather than fitting into it. The two-phase wire prepare/confirm split looked like dual control and was not — it required two CALLS, not two PEOPLE, and any single token could do both. Confirm now demands a distinct approver, enforced by a CHECK constraint so it holds against service_role. The four-eyes rule is expressed once in core.payment_approval rather than repeated per table, which is the reusable form of what ck_case_four_eyes did bespokely for SAR decisions.

Missing:

- the ACH per-client threshold is unconfigured, so ACH batches are UNASSESSED rather than assessed — the mechanism works, the policy values are missing (OQ-14)
- no offline callback approval with PIN, which EPS-06 offers as the alternative to dual control for wires
- no user limits below client limits — EPS-06 describes a two-level limit hierarchy and only the client level exists
- no pre-defined file templates restricting file creation
- internal Fedwire processing (Payments Exchange user ID / passcode / token) is not modelled
- eps.pospay_exception.presented and eps.wire_release.requested have no writer

### `CG-GOV-01`

*One obligation register for the catalogue's 83 time-based triggers. Each obligation carries a cadence and an optional anchor; the sweep fires the CONTROL'S OWN declared trigger code when it comes due, emits an overdue event when nobody completed it, and reports unanchored obligations as UNSCHEDULED — a distinct state from both 'not due' and 'overdue'. Completion advances from the DUE date, never from the completion date.*

Source: `supabase/functions/api/governance.ts`

**bsa:BSA-16 — Independent Testing** → `partially_discharges` ⚠️ **needs review**

BSA-16's triggers are audit.cycle_timer, audit.report.issued and audit.remediation.due — a cadence, a deliverable and a follow-up clock. The calendar supplies the cadence half honestly: registering the obligation and anchoring it makes audit.cycle_timer fire when the cycle genuinely opens, with an overdue event if nobody acts. Cited by uid because control ids are not unique (OQ-11). Chosen as the single claim for this machinery rather than claiming all 83 time-triggered controls, because the register is empty until obligations are actually registered.

Missing:

- the obligation is UNSCHEDULED until someone supplies the anchor date — the cadence is known, the cycle start is not (OQ-15)
- audit.report.issued and audit.remediation.due have no writer: the calendar starts the cycle, nothing records the report or tracks remediation
- no scope, no independence assessment, no auditor qualification checks
- 82 other time-triggered controls could use this machinery and none are registered, so none are claimed

> Would discharge if: the audit deliverable and remediation tracking exist, and the obligation is anchored to a real cycle start.

### `CG-LEND-01`

*Loan origination spine. Records the final action on an application; queues an adverse action notice on any adverse outcome with the ECOA clock anchored on APPLICATION COMPLETION rather than the decision date; requires second-level review by a different actor before the notice may be issued; screens every loan party on add and blocks funding on a potential match. A sweep surfaces notices nobody sent and parties nobody screened.*

Source: `supabase/functions/api/lending.ts`

**lending:LP-07 — Adverse Action & Notifications** → `partially_discharges` ⚠️ **needs review**

The AAN is queued automatically on an adverse decision (aan.queued), carries specific reasons enforced at decision time rather than reconstructed later, runs a 30-day ECOA clock anchored on completion, and cannot be issued without second-level review by a different actor — enforced by ck_aan_reviewed_before_issue because an issued notice cannot be recalled. The overdue sweep surfaces notices nobody sent.

Missing:

- counteroffer EXPIRY does not queue a notice: LP-07 requires it and there is no counteroffer timer
- ECOA content is recorded as flags (credit_score_disclosed, cra_disclosure_included) but never validated — nothing checks the notice actually contains what it claims
- no fair-lending consistency check in the second review; the reviewer role is not constrained to Compliance or senior underwriting (the actor model has no such roles — same shape as OQ-08)
- no delivery: aan.issued records the decision to issue, not transmission to the applicant

**lending:LP-11 — OFAC & Sanctions Gate** → `related` ⚠️ **needs review**

The MECHANISM is real and was the architecturally missing half of OQ-02: parties are screened on add, a potential match blocks funding rather than the application, an alert is raised, and 'unscreened' is a distinct state from 'clear' so an unscreened party cannot be funded. But the screen it calls is still the sandbox stub — /\bSDN\b/i against a name, with no list and no ofac.list_version. Verdict stays `related` for the same reason CG-OFAC-01's does: a screen with an empty comparison set discharges nothing however sound the blocking around it is. Every party row records list_version NULL so the gap is visible in the data.

Missing:

- no sanctions list and no list version — the screen is a stub (OQ-02, domain-blocked)
- no 50% rule derivation for entity ownership
- clearance of an apparent match has no documented-rationale requirement yet (loan_party.ofac_result is unwritten)
- no re-screening when the list updates, because there is no list

> Would discharge if: a real versioned list is wired into ofacScreen(). The blocking, the alerting and the unscreened/clear distinction are already in place, so this is a genuinely small change with a large coverage effect.

### Excluded

- `CG-NOPE-99` — Test sentinel, not a control. Exists so the gate's unknown-control path is exercised; never evaluated against real traffic.

## Open questions

Places where the catalogue is ambiguous, a CG-\* control does not
cleanly correspond to anything, or a mapping turns on a decision that
is not mine to make. Deliberately not smoothed over — several change
what the crosswalk should say.

### OQ-01 · high — Is CG-CTR-01 misnamed, and does that misname a coverage claim?

**Finding.** A CTR obligation attaches to CURRENCY transactions. CG-CTR-01 fires only on electronic movements (book, wire, ACH, card), none of which are CTR-reportable. The control detects large electronic transfers — a legitimate monitoring signal — but its name asserts a filing regime it has nothing to do with.

**Why it matters.** The name alone is enough to produce a false coverage claim in a review: someone scanning for CTR coverage finds CG-CTR-01 and stops. Meanwhile actual cash handling, which is what BSA-08 governs, is unmonitored because the core has no cash surface at all.

**Asks of reviewer.** Confirm the reading, then decide whether to rename (e.g. CG-LGTXN-01) or to keep the name and record explicitly that it does not address BSA-08.

### OQ-02 · high — Should CG-OFAC-01 be described as a control at all while its screen is a stub?

**Finding.** The enforcement mechanism is genuinely strong — always-on, unbypassable by attestation or forced outcome, evidence written on every run including clean passes. The screen underneath it is `/\bSDN\b/i` against the entity name. There is no list, no list version, and no screening at payment submission, which BSA-05 requires via wire_transfer.submitted.

**Why it matters.** This is the single most over-claimable row in the artifact. The plumbing looks like a finished control and reads like one in code review. An auditor who accepts the mechanism without inspecting ofacScreen() would conclude sanctions screening exists.

**Asks of reviewer.** Confirm `related` (not `partially_discharges`) is the right verdict while the list is absent. Also decide whether the OFAC floor should be marked non-production until a real list is wired — this interacts with roadmap item 50.

### OQ-12 · high — Accounts have no owning entity, which blocks per-person cash aggregation.

**Finding.** BSA-08 aggregates cash 'per person per business day' and names entity.name and entity.tin as required inputs. core.account had no link to core.entity of any kind. Migration 20260719001300 adds account.entity_id (nullable, FK) and POST /accounts now accepts it, but EXISTING accounts are unlinked and cannot be backfilled truthfully — nothing in the data says which member owns which account, and inventing the link would fabricate a member relationship.

**Why it matters.** This was found while sequencing cash and it changed the order. Building cash without it would aggregate per ACCOUNT, which is the exact defect already recorded against CG-STR-01 ('splitting across two accounts owned by the same member evades it entirely') — reproduced at birth, in the one control where that evasion IS the behaviour being detected. Linking accounts also retroactively lets CG-STR-01/02 move from per-account to per-entity.

**Asks of reviewer.** Existing accounts need linking by someone who knows the answer, or the demo accounts discarded. Until then entity_id stays nullable and unlinked accounts sit outside CTR aggregation. Query them with: select count(*) from core.account where entity_id is null;

### OQ-14 · high — Per-client ACH dual-control thresholds and exposure limits are unset, so ACH batches are UNASSESSED.

**Finding.** EPS-06 says dual control is 'recommended for clients originating over $50,000 per batch' and that 'client exposure limits are assigned by the Credit Union'. Both the threshold and whether it applies are per-client configuration this repo does not hold. The mechanism is built (PUT /eps/client-limits/{partner_id}) and until it is called for a partner, that partner's ACH batches carry dual_control_status='unassessed' and appear in GET /eps/pending-approvals under a separate unassessed count with an explicit warning.

**Why it matters.** Unassessed is deliberately not 'exempt' and not 'required'. Treating an unconfigured client as exempt fails OPEN — a $2m batch would originate with no second pair of eyes and nothing would say so. Treating it as required fails closed on a number nobody chose and blocks every client until configured. Both were mutation-tested. The $50,000 figure in the policy is explicitly a recommendation, not a rule, so it must not be hardcoded as one.

**Asks of reviewer.** The actual per-client thresholds, or a decision that a single institution-wide default applies. Once set via the endpoint, every subsequent batch is assessed; existing unassessed rows stay unassessed because re-deciding them retroactively would be inventing a determination that was never made.

### OQ-15 · high — The governance calendar has no anchor dates, so every obligation is UNSCHEDULED.

**Finding.** 83 of the catalogue's triggers are time-based and share one shape, so one register serves them all. But a cadence needs an anchor — when the fiscal year starts, when the last board review happened, when the training cycle opens. Those are facts only the institution holds. An obligation registered without one is UNSCHEDULED: it never comes due, and POST /governance/calendar/sweep reports it under a separate count with an explicit warning rather than letting it sit among the not-due.

**Why it matters.** Unscheduled is the most dangerous absence in the repo so far, because it is INVISIBLE BY SHAPE. An overdue obligation appears on a list. An unscheduled one has nothing outstanding — from any distance it looks exactly like an obligation that is up to date. That is why it gets its own count and its own warning rather than being folded into 'not due'.

**Asks of reviewer.** Anchor dates per obligation, and which of the 83 time-triggered controls are live obligations at all. Registering all 83 automatically was deliberately NOT done — it would assert the institution has 83 live obligations, which nobody has said.

### OQ-03 · medium — Two implemented controls answer to nothing in the catalogue. Is the catalogue incomplete, or are they out of scope?

**Finding.** CG-VEL-01 (daily $25k cap) and CG-NSF-01 (overdraft refusal) have no counterpart among the 333. The nearest catalogue entries govern disclosing or collecting overdrafts (TIS-08, TIS-05, CO-10) and restricting accounts after a conduct decision (MP-05) — none is discharged by refusing a transaction.

**Why it matters.** Either the corpus is missing safety-and-soundness controls it should contain, or these are engineering choices that should never appear in a compliance claim. The two readings lead to opposite backlog decisions.

**Asks of reviewer.** Decide which. If the latter, they should be excluded from coverage reporting entirely rather than sitting unmapped.

### OQ-04 · medium — Does refusing overdrafts make TIS-08 and CO-10 inapplicable rather than unimplemented?

**Finding.** CG-NSF-01 declines any movement that would overdraw. If the product genuinely offers no overdraft service, there is nothing to disclose under TIS-08 and nothing to collect under CO-10.

**Why it matters.** This is the one place the crosswalk might REMOVE work from the backlog rather than add it. Two controls could be scoped out with a documented rationale instead of built.

**Asks of reviewer.** A scoping opinion. Note this is contingent on the product never offering overdraft, which is a business decision, not a code fact.

### OQ-09 · medium — BSA-07's SAR committee is recorded but not enforced. Is that the right line?

**Finding.** case.concurred_by records who concurred in a filing decision, but nothing enforces quorum or committee composition. A SAR can be filed by a lone BSA Officer with no concurrence at all.

**Why it matters.** BSA-07 says a committee of BSA Officer, Compliance and counsel 'makes the filing decision'. Whether that is a system obligation or an organizational one is a genuine judgment: enforcing quorum in software would block a legitimate filing when counsel is unavailable, and the deadline does not pause for that.

**Asks of reviewer.** Decide whether quorum should be enforced, advisory, or left organizational. The data to enforce it is already being captured either way.

### OQ-10 · medium — Retention clocks are only set for two record classes, so most of BSA-21's schedule has no writer.

**Finding.** setRetentionClocks fires on account.closed and creates cip_identity and beneficial_owner records — the two classes anchored on closure. The other seven classes (CIP verification, CTR, SAR, monetary instrument, wire transfer, CMIR, OFAC blocked) anchor on their own creation dates and would need a clock set at the point each record is made. Those hook points mostly do not exist yet: there is no CTR filing, no monetary instrument log, no CMIR.

**Why it matters.** The retention MECHANISM is complete and enforced — schedule, holds, three-condition disposal, irreversibility. What is partial is coverage: a wire transfer today starts no retention clock, so SC-02's lifecycle applies to nothing on that rail. Reading 'retention is implemented' off the mechanism would over-claim.

**Asks of reviewer.** None immediately. Recorded so BSA-21's crosswalk verdict is not read as broader than it is; each remaining class arrives with its own subsystem.

### OQ-11 · medium — PARTLY RESOLVED — control_id collisions are a CORPUS defect, not an extractor bug.

**Finding.** Diagnosed at source. capitalization.md line 39 defines '## CP-01 - Capital Adequacy Targets'; cash.md line 47 defines '## CP-01 - Governance and Delegation'. Both policy documents independently chose the CP- prefix, and the extractor is reading exactly what is written — it is not merging anything. Ten ids collide (CP-01..CP-10). Separately, STATUS.md records the cash policy as carrying controls CA-01..CA-12, and no CA- id exists in cash.md at all: the cash regeneration appears to have changed its control prefix from CA- to CP- and that is what created the collision with capitalization.

**Why it matters.** Containment is now in place — the extractor emits a globally unique `uid` (policy:control_id), reports collisions in controls.json, and the crosswalk refuses a claim citing a colliding bare id while accepting a uid-qualified one. 333 rows now carry 333 distinct uids. But the underlying corpus is still wrong: two documents claim the same control numbers, and any human citing 'CP-03' in a memo or an examination response is ambiguous in a way no tooling can fix.

**Asks of reviewer.** Decide which policy renumbers. STATUS.md suggests cash was meant to be CA-, so restoring that is the smaller change. Also worth adding a prefix-collision check to the regeneration pipeline, since this was introduced by a regeneration and nobody noticed.

### OQ-13 · medium — CTR exemptions are stored but never evaluated.

**Finding.** BSA-08 describes Phase I exemptions (banks, government entities, listed companies) and Phase II (eligible non-listed businesses, payroll customers) with DOEP filing on FinCEN Form 110 and annual eligibility review. core.ctr_filing has an exemption_basis column and nothing reads it — every threshold crossing opens a filing obligation regardless of whether the person is exempt.

**Why it matters.** Failing OPEN, which is the safe direction: an exempt customer generates a CTR obligation that a human can dismiss, rather than an exempt determination silently suppressing a filing that was actually owed. But it means the CTR queue will contain avoidable work, and the annual exemption review (ctr.exemption.review.due) has no writer at all.

**Asks of reviewer.** Whether Pynthia intends to operate exemptions at all. Many small institutions do not, in which case this is scoped out rather than unimplemented — the same question as OQ-04 on overdraft.

### OQ-16 · medium — The eps governance controls do NOT fall out of the obligation register — my resequencing rationale was wrong.

**Finding.** Tier D was resequenced ahead of loan on the argument that the governance-calendar machinery would unlock the remaining eps controls too. It does not. Only 3 of ~30 triggers across EPS-01/03/04/08/09/10/11 are timer-shaped (eps.vendor_dd_cycle.opened, eps.training_annual_cycle.opened, eps.training_employee_cycle.opened). The rest are WORKFLOW triggers — eps.proposal.submitted, eps.control_review.opened, eps.board_report.delivered, eps.deployment.scheduled — which need proposal, review, board-reporting and deployment pipelines, not a calendar.

**Why it matters.** Tier D was still correct to build: it is honest, cheap and serves 83 catalogue triggers. But it does not shorten eps, and no work was manufactured to pretend otherwise. Registering the 3 timer-shaped eps obligations was also declined because registration is configuration nobody has supplied (OQ-15) and would have produced two more deeply-incomplete controls for appearance.

**Asks of reviewer.** None. Recorded because the resequencing argument is in the session record and was wrong; the eps governance controls remain unbuilt and need their own subsystems.

### OQ-06 · low — The catalogue's own trigger vocabulary is inconsistent, which weakens reachability as a measure.

**Finding.** Some control_rules carry trigger_event: null (a rule with inputs and outputs but nothing that starts it). Others use namespaces that no subsystem could plausibly own. Reachability treats a null trigger as unreachable, which is conservative but conflates 'blocked on a subsystem' with 'the catalogue does not say'.

**Why it matters.** Reachability counts are only as good as the trigger declarations. The headline numbers are directionally right but should not be quoted to a decimal.

**Asks of reviewer.** None immediately — flagged so the numbers are not over-read. Fixing it means editing the policy corpus, not this artifact.

### OQ-07 · low — Is BSA-21 'reachable' a coincidence worth acting on?

**Finding.** BSA-21 (Record Retention) is the only fully reachable control, solely because its one declared trigger is account.closed. It is not completable: it cannot emit record.retention_anchor or record.retention_clock_set, and no retention schedule, legal hold or disposal workflow exists.

**Why it matters.** It is the single row most likely to be mistaken for 'nearly done' by anyone reading the reachable count without the completable column.

**Asks of reviewer.** None. Recorded so the reachable=1 headline is not misread.

### OQ-05 · low — RESOLVED — bsa_alert.event_id is populated.

**Finding.** raiseAlert() now writes the causing core.event first and points the alert at it. The event's code is bsa_alert.created, which is BSA-06's declared trigger, so raising an alert fires the event the catalogue says starts case management rather than merely resembling it. Alert ids are deterministic per D26.

**Why it matters.** Closed. Recorded here so the resolution is auditable rather than silently disappearing from the list.

**Asks of reviewer.** None — verification only.

### OQ-08 · low — RESOLVED — segregation of duties is representable and enforced.

**Finding.** api_token.roles carries a closed four-value vocabulary (bsa_investigator, bsa_officer, bsa_compliance, bsa_counsel). core.case records opened_by and decided_by, and ck_case_four_eyes enforces that they differ. The constraint is a CHECK, so it holds against service_role and a psql session — RLS was not needed, because the property is relational (two columns must differ) rather than row-visibility.

**Why it matters.** Closed. Deliberately not a general RBAC system: four named roles, two hardcoded gates, one constraint.

**Asks of reviewer.** Confirm the four roles match how the institution actually staffs these duties.

### OQ-17 · low — core.payment_approval is now misnamed — it is a general four-eyes register.

**Finding.** The table was introduced for EPS-06 payment dual control. LP-07's adverse-action second review is the third use of the same property, and its resource_type enum now carries adverse_action_notice, which is not a payment. Two of the three domains using it are not payments.

**Why it matters.** Naming debt only — the constraint and behaviour are correct. But a table called payment_approval holding adverse action notices will mislead the next reader, and the rename is FREE right now because the migration has never been applied.

**Asks of reviewer.** None; engineering cleanup. Rename to four_eyes_approval before first apply, or accept the name and document it.

## View 2 — which catalogue controls are reachable

**Reachable** means the core can fire *every* trigger the control
declares. Partial reachability is its own category: a control whose
triggers are half firable is blocked, not half-done.

| Reachability | Controls |
|---|---:|
| `reachable` | 3 |
| `partially_reachable` | 15 |
| `unreachable` | 298 |

**Completable: 2.** Reachability only asks whether the
core can *start* a control. A control can be startable and still have no
way to signal its own outputs — BSA-21 scores fully reachable because its
one trigger is `account.closed`, while the retention schedule, legal holds
and disposal workflow it describes exist nowhere. `completable` means every
trigger fires **and** every produced event can be emitted. Use that number,
not the reachable one, when estimating what is buildable.

### Fully reachable (3)

| Control | Policy | Title | Triggers | Completable | Cannot emit |
|---|---|---|---|---|---|
| `BSA-06` | bsa | Transaction Monitoring & Case Management | `bsa_alert.created`, `case.investigation_complete` | yes | — |
| `BSA-10` | bsa | Travel Rule (Wires ≥$3,000) | `wire_transfer.submitted` | **no** | `retention.purge.executed`, `wire_transfer.created`, `wire_transfer.record.retained` |
| `BSA-21` | bsa | Record Retention | `account.closed` | yes | — |

### Partially reachable (15)

These are the nearest to buildable: some triggers already fire.

| Control | Policy | Firable | Missing |
|---|---|---|---|
| `SC-02` | audit | `legal_hold.clear.confirmed`, `legal_hold.created` | `disposal.executed`, `record.disposal_eligible`, `record.hold.applied` |
| `EPS-06` | electronic-payment-systems | `ach_transfer.created`, `wire_transfer.submitted` | `eps.client_limit_change.requested`, `eps.pospay_exception.presented`, `eps.wire_release.requested` |
| `LP-11` | lending | `loan_party.added`, `loan_party.ofac.escalated` | `loan_party.ofac.cleared` |
| `RR-05` | record-retention | `legal_hold.clear.confirmed`, `legal_hold.created` | `record.hold.applied` |
| `BSA-03` | bsa | `account.closed` | `application.submitted`, `verification.completed` |
| `BSA-05` | bsa | `wire_transfer.submitted` | `ofac.annual.report.due`, `verification.created` |
| `BSA-07` | bsa | `case.investigation_complete` | `sar.continuing_timer`, `sar.disclosure_request.received` |
| `BSA-08` | bsa | `ctr.threshold.reached` | `ctr.exemption.review.due` |
| `LP-03` | lending | `application.final_action.recorded` | `loan_application.completed`, `loan_application.decisioned`, `loan_application.incomplete.detected` |
| `LP-04` | lending | `aan.issued` | `credit_report.received`, `credit_score.tolerance.breached`, `loan_application.thin_file.flagged` |
| `LP-09` | lending | `application.final_action.recorded` | `loan.booking.requested` |
| `MP-01` | member | `verification.denied` | `member.application.submitted`, `member.eligibility_rule.failed`, `verification.completed`, `verification.created` |
| `MP-05` | member | `account.closed` | `account.closure.approved`, `account.lock.applied` |
| `PR-01` | privacy | `entity.created` | `privacy.annual.notice.due_at`, `privacy.notice.revised`, `privacy.notice_copy.requested` |
| `PR-08` | privacy | `legal_hold.clear.confirmed` | `disposal.executed`, `record.retention.expires_at` |

### Unreachable — blocked on subsystems that do not exist

Grouped by the namespace of the missing trigger, which is a decent proxy
for the subsystem that would have to be built first.

| Missing-trigger namespace | Controls blocked |
|---|---:|
| `capital` | 14 |
| `vendor` | 14 |
| `cda` | 14 |
| `audit` | 10 |
| `incident` | 10 |
| `cash` | 10 |
| `employee` | 8 |
| `eps` | 8 |
| `record` | 8 |
| `policy` | 7 |
| `access` | 6 |
| `application` | 5 |
| `complaint` | 5 |
| `disclosure` | 5 |
| `indemnification` | 5 |
| `loan` | 4 |
| `cfp` | 4 |
| `compliance` | 4 |
| `ecommerce` | 4 |
| `analytics` | 4 |
| `privacy` | 4 |
| `board` | 3 |

