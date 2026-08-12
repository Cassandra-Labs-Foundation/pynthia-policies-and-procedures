# DRILL — a synthetic institution, run end to end

> ## A DRILL IS NOT COVERAGE
>
> A fire drill proves the alarm works. Nobody concludes the building burned.
>
> Everything below describes machinery exercised against a **synthetic**
> institution that supplied its own configuration — registered obligations,
> configured thresholds, linked members, transaction traffic.
> **A real institution has supplied none of it.** That difference is the whole
> reason this file and `CROSSWALK.md` disagree, and it is why reconciling them
> by raising the smaller number would be fabrication rather than reconciliation.
>
> Regulatory coverage is measured in `reachable` / `completable` and lives in
> [CROSSWALK.md](../CROSSWALK.md). Nothing here may be read as a control being
> satisfied.

## What this drill does NOT prove

The drill runs against an in-memory stand-in, not Postgres. These guarantees
are enforced **only in the database** and are therefore **NOT proven here**:

- **Foreign keys (fk_cash_transaction_entity, fk_account_entity, fk_loan_party_application, …)**  
  The drill can reference an entity or application id that does not exist and nothing will object. Referential integrity is NOT exercised.
- **UNIQUE constraints (uq_ctr_entity_date, uq_payment_approval_resource, uq_aan_application, …)**  
  Duplicate-suppression is modelled only where a writer passes ignoreDuplicates; a genuine unique violation would surface in Postgres and not here.
- **The immutability triggers (freeze_provenance, freeze_disposal, freeze_attestation)**  
  The drill cannot prove that provenance is unchangeable, that a disposal cannot be reversed, or that an attestation cannot be edited. Those are trigger-enforced and trigger behaviour is not simulated.
- **NOT NULL on partner_id and the FK to core.partner**  
  An unowned row is representable here and is not in the real schema.
- **Transactionality**  
  Every write here commits independently. A handler that fails halfway leaves partial state in the drill where Postgres might roll back, so multi-write atomicity is not proven.
- **Type and range coercion (numeric precision, timestamptz normalisation, enum CHECKs on status columns)**  
  Status vocabularies are enforced by CHECK in the schema but compared as plain strings here, so a typo'd status would be caught by Postgres and not by the drill.

For completeness, 18 CHECK constraints ARE
re-implemented in the fake and are exercised: `ck_eps_auth_lockout_stamped`, `ck_eps_auth_challenge_method`, `ck_eps_pospay_decision_complete`, `ck_capital_ratio_matches_components`, `ck_capital_nwrp_only_if_under`, `ck_capital_internal_verdict`, `ck_case_four_eyes`, `ck_payment_approval_four_eyes`, `ck_record_disposal_not_held`, `ck_record_disposal_after_expiry`, `ck_record_disposal_approved`, `ck_aan_reviewed_before_issue`, `ck_wire_dual_control_before_complete`, `ck_work_item_adverse_rationale`, `ck_obligation_due_iff_anchored`, `ck_ctr_filed_has_ref`, `ck_aan_has_reasons`, `ck_threshold_warn_before_limit`.

## Result

| | |
|---|---:|
| cases | 60 |
| `drill_passed` | 60 |
| `drill_failed` | 0 |
| `drill_not_runnable` | 0 |
| negative cases | 46 |
| CHECK violations during the run | 0 |
| distinct controls touched | 19 |
| policies touched | 12 |

Deterministic: seed `20260719`, clock frozen at `2026-07-19T12:00:00.000Z`.
Two runs of the same code produce identical results, which is what makes
`--check` a regression gate rather than noise.

## Cases

| id | status | kind | controls | what |
|---|---|---|---|---|
| `GOV-01` | pass | positive | `bsa:BSA-16` | an anchored obligation registers with a real due date |
| `GOV-02` | pass | negative | `audit:AU-01` | an obligation with no anchor is UNSCHEDULED, not merely not-due |
| `GOV-03` | pass | negative | `bsa:BSA-16` `audit:AU-01` | the sweep separates OVERDUE from UNSCHEDULED and fires the control's own trigger |
| `GOV-04` | pass | positive | `bsa:BSA-16` | completion advances from the DUE date, so lateness cannot stretch the cadence |
| `CASH-01` | pass | positive | `bsa:BSA-08` | per-person daily currency aggregation crosses $10k and opens a CTR |
| `CASH-02` | pass | negative | `bsa:BSA-08` | cash-in and cash-out are NOT summed into a false obligation |
| `CASH-03` | pass | negative | `bsa:BSA-08` | currency on an unlinked account is UNATTRIBUTABLE, not dropped and not self-bucketed |
| `CASH-04` | pass | negative | `bsa:BSA-08` | a day containing unattributable currency reports complete=false |
| `CASH-05` | pass | negative | `bsa:BSA-08` | a CTR cannot be marked filed without a FinCEN reference |
| `CASH-06` | pass | negative | `bsa:BSA-08` | STRUCTURING ACROSS TWO ACCOUNTS OF ONE MEMBER — does per-person aggregation catch it? |
| `CASH-07` | pass | negative | `bsa:BSA-08` | a CTR that was owed and nobody filed is surfaced, alongside standing unattributable currency |
| `BSA-01` | pass | positive | `bsa:BSA-06` | an alert escalates to a case and starts the SAR clock from detection |
| `BSA-02` | pass | negative | `bsa:BSA-06` | the investigator who opened a case cannot decide it (four-eyes) |
| `BSA-03` | pass | negative | `bsa:BSA-07` | a no-file SAR decision without rationale is refused |
| `BSA-04` | pass | negative | `bsa:BSA-07` | a SAR decision past its deadline is recorded as LATE, not silently accepted |
| `BSA-05` | pass | negative | `bsa:BSA-06` | an untriaged alert past its 2-day clock is surfaced by the sweep |
| `RET-01` | pass | positive | `bsa:BSA-21` | closing an account starts the 5-year retention clock |
| `RET-02` | pass | negative | `shared-controls:SC-02` | a legal hold blocks destruction even after retention expires |
| `RET-03` | pass | negative | `shared-controls:SC-02` | a record still inside its retention period cannot be destroyed |
| `RET-04` | pass | positive | `shared-controls:SC-02` | a hold placed on a subject propagates to its records in the same call |
| `EPS-01` | pass | negative | `electronic-payment-systems:EPS-06` | the originator of a payment cannot approve it (four-eyes) |
| `EPS-02` | pass | positive | `electronic-payment-systems:EPS-06` | a second actor can approve, and both actors are recorded |
| `EPS-03` | pass | positive | `electronic-payment-systems:EPS-06` | client limits can be configured, which is what ends the unassessed state |
| `LEND-01` | pass | negative | `lending:LP-11` | an OFAC potential match blocks FUNDING (not the application) |
| `LEND-02` | pass | negative | `lending:LP-11` | every screen records that its list version is unknown (the stub is visible in the data) |
| `LEND-03` | pass | negative | `lending:LP-07` | an adverse decision without specific reasons is refused |
| `LEND-04` | pass | positive | `lending:LP-07` | a denial queues an AAN with the ECOA clock anchored on COMPLETION |
| `LEND-05` | pass | negative | `lending:LP-07` | an AAN cannot be issued without second-level review |
| `LEND-06` | pass | negative | `lending:LP-07` | an ECOA notice nobody sent is surfaced by the sweep |
| `LEND-07` | pass | negative | `lending:LP-11` | an UNSCREENED party is reported as a standing gap, not treated as clear |
| `PRIM-01` | pass | positive | `third-party-risk:TR-01` | a work item opens against a control in a policy with no bespoke code |
| `PRIM-02` | pass | negative | `information-security:IS-01` | an UNDEADLINED work item is flagged, not silently current |
| `PRIM-03` | pass | negative | `cash:CP-01` | a request cannot close without recording what was decided |
| `PRIM-04` | pass | negative | `cash:CP-01` | an adverse outcome requires a documented reason |
| `PRIM-05` | pass | negative | `bsa:BSA-11` | inbound correspondence must record its source and ARRIVAL time |
| `PRIM-06` | pass | positive | `bsa:BSA-11` | inbound correspondence with a source and arrival time is accepted |
| `PRIM-07` | pass | negative | `liquidity:LQ-01` | an observation against an unconfigured threshold is UNASSESSED |
| `PRIM-08` | pass | negative | `capitalization:CP-01` | a configured threshold detects a breach and emits an event |
| `PRIM-09` | pass | positive | `director-fiduciary-duties:DF-01` | an attestation records the AUTHENTICATED actor, not a payload claim |
| `PRIM-10` | pass | negative | `compliance:CM-01` | the work-item sweep separates OVERDUE from UNDEADLINED |
| `RAIL-01` | pass | positive | — | a book transfer settles and writes control evidence |
| `RAIL-02` | pass | negative | — | a transfer that is BOTH over-velocity and unaffordable reports only the FIRST control |
| `RAIL-03` | pass | negative | `bsa:BSA-06` | CG-LGTXN-01 raises an alert on a single movement over $10k |
| `RAIL-04` | pass | negative | — | CG-VEL-01 blocks across rails, and a REJECTED attempt does not count toward volume |
| `RAIL-05` | pass | negative | `electronic-payment-systems:EPS-06` | a wire cannot be confirmed by its preparer (EPS-06, end to end) |
| `RAIL-06` | pass | positive | `electronic-payment-systems:EPS-06` | the same wire confirms once a DIFFERENT actor approves it |
| `RAIL-07` | pass | negative | — | an international wire is refused before it consumes an idempotency key |
| `RAIL-08` | pass | negative | — | an ACH return code outside the NACHA set is refused |
| `RAIL-09` | pass | negative | `bsa:BSA-06` | an unauthorized ACH return (R10) raises a BSA alert; R01 does not |
| `RAIL-10` | pass | negative | — | a card authorization cannot be captured beyond the held amount |
| `RAIL-11` | pass | negative | — | an expired card auth reports zero remaining, not the full amount |
| `ENT-01` | pass | negative | `bsa:BSA-03` | an OFAC hit on verification denies and raises an alert (CG-OFAC-01 floor) |
| `ENT-02` | pass | negative | `bsa:BSA-03` | a full-trust partner attestation cannot bypass the OFAC floor |
| `OWN-01` | pass | negative | — | a partner cannot read another partner's account (404, not 403) |
| `OWN-02` | pass | negative | — | a partner cannot settle another partner's ACH entry |
| `ACC-01` | pass | negative | `bsa:BSA-07` | a partner cannot see that a BSA case exists (404, not 403) |
| `ACC-02` | pass | negative | `bsa:BSA-08` | a partner cannot reach cash handling |
| `ACC-03` | pass | negative | — | a partner cannot set its own dual-control threshold |
| `PROV-02` | pass | negative | — | every row the drill wrote is stamped simulated |
| `PROV-03` | pass | negative | — | no CHECK constraint was violated anywhere in the run |

## Event codes fired

Codes fired during a DRILL are not grounds for adding anything to crosswalk-emitted-events.json. A synthetic obligation firing audit.cycle_timer is the drill exercising the machinery, not the core emitting the code for a real institution. See BLUEPRINT 5c.

Already in the inventory (31): `attestation.recorded`, `bsa_alert.created`, `bsa_alert.triage.overdue`, `bsa_alert.triage.timer`, `bsa_alert.triaged`, `case.investigation_complete`, `case.opened`, `case.sar.decision.timer`, `ctr.filing.overdue`, `ctr.filing.timer`, `ctr.threshold.reached`, `disposal.held`, `eps.client_limit.changed`, `eps.wire.second_approval`, `governance.obligation.completed`, `governance.obligation.overdue`, `inbound.opened`, `legal.hold.placed`, `legal_hold.created`, `record.created`, `record.hold.applied`, `record.hold.placed`, `record.legal_hold_flag`, `record.retention.expires_at`, `record.retention_anchor`, `record.retention_clock_set`, `request.opened`, `sar.filed`, `task.opened`, `task.overdue`, `threshold.breached`

Fired here but **NOT** in the inventory (8): `aan.notice_overdue`, `aan.queued`, `application.final_action.recorded`, `audit.cycle_timer`, `loan_party.added`, `loan_party.ofac.escalated`, `loan_party.ofac.screened`, `loan_party.ofac_potential_match`

The second list is the interesting one and it stays where it is. Those codes
were fired by synthetic configuration; adding them to the inventory would
raise reachability on the strength of a drill, which is precisely the
substitution `BLUEPRINT` §5c exists to prevent.
