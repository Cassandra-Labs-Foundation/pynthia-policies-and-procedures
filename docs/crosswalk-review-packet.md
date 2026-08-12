# Crosswalk Review Packet

**Purpose:** [CROSSWALK.md](../CROSSWALK.md) carries 14 claims across 10
runtime-gate mappings, and none has `reviewed_by` set — so today no coverage
claim is load-bearing and nothing holds a `discharges` verdict to account.
This packet turns the review into checkbox work: one paragraph per mapping
stating what is claimed, what the evidence is, and what your initials would
make load-bearing. Mark each ☐, note disagreements inline; I'll transcribe
your initials into `crosswalk-mappings.json` (`reviewed_by`), which
regenerates CROSSWALK.md.

**What a verdict means.** `partially_discharges`: the control genuinely
performs part of the catalogue obligation, stated scope. `related`: honest
adjacency — same territory, but it does NOT perform the obligation, and the
mapping exists so nobody over-claims it. `no_catalogue_counterpart`: the gate
does something the 333-control catalogue never asked for.

---

☑ **1. CG-LGTXN-01 (was CG-CTR-01) → BSA-08 `related`, BSA-06 `partially_discharges`**
Fires on any single electronic movement above $10,000 on any rail; writes a
`control_result` and opens a `bsa_alert` (`ctr_threshold`, lookback required);
never blocks. The BSA-08 claim is deliberately only `related` — CTRs attach to
*currency*, and nothing this control sees is currency (that gap is what
CG-CASH-01 now fills, and why the control was renamed under OQ-01). The BSA-06
half is real: it produces exactly the alert row-shape BSA-06's detection rule
triggers on, and the downstream (triage deadline, case escalation, SAR
decision) now exists. **You confirm:** the rename holds, and `related` — not
more — is right for BSA-08.

☑ **2. CG-STR-01 → BSA-06 `partially_discharges`, BSA-07 `partially_discharges`**
Inbound structuring: same-day inbound book transfers to one account crossing
$10,000 in aggregate with no single transfer above it. Known scope limit,
stated in the artifact: *book transfers only*. The BSA-07 claim was upgraded
from `related` because the filing decision now exists end-to-end (file /
no-file both demand documented rationale; 30/60-day clock from detection; late
is recorded late). **You confirm:** the upgrade to `partially_discharges` for
BSA-07, knowing the inbound blind spot on wires/ACH/card.

☑ **3. CG-STR-02 → BSA-06 `partially_discharges`**
Outbound twin, but broader: aggregates across all four rails via the velocity
sum. **You confirm:** same basis as #2; note the asymmetry (outbound sees four
rails, inbound sees one) is a stated property, not an oversight.

☑ **4. CG-OFAC-01 → BSA-05 `related`, LP-11 `related`**
The most over-claimable row, now formally a STUB (OQ-02, decided 2026-08-11):
the gate mechanism is unbypassable and evidences every run, but the screen
matches the literal token "SDN" against no list. `related` is the ceiling
until a real SDN feed lands. LP-11 is listed only so lending's eventual
unparking doesn't forget it. **You confirm:** `related` stands, and no reader
of CROSSWALK.md could take this as "sanctions screening exists."

☑ **5. CG-VEL-01 → `no_catalogue_counterpart`**
Blocks any movement pushing same-day outbound volume past $25,000 — the only
gate that blocks rather than observes. The catalogue's nearest rows (MP-05,
TIS-02) are genuinely different things. **You confirm:** the cap is a product
control, not a mis-mapped compliance one, and the $25k value belongs in the
§3 parameters sheet eventually.

☑ **6. CG-NSF-01 → `no_catalogue_counterpart`**
Rejects movements exceeding available Blnk balance. Ledger correctness, not
compliance; the catalogue's overdraft controls govern disclosure and
collections, not refusal. **You confirm:** agreed, no obligation is being
quietly claimed here.

☑ **7. CG-CASH-01 → BSA-08 `partially_discharges`**
The first genuine currency surface: records cash in/out per person, aggregates
per business day with directions assessed separately, opens a CTR obligation
on a 15-day clock past $10,000, and surfaces unattributable currency as a
finding. This is the row that makes the CG-LGTXN-01 rename safe — actual CTR
coverage now has an actual owner. **You confirm:** `partially_discharges` is
earned, and the unattributable-cash finding (not silence) is the right
behavior for the 3 legacy ownerless accounts.

☑ **8. CG-DUAL-01 → EPS-06 `partially_discharges`**
Maker-checker on payment origination. Wire dual-control is unconditional and
constraint-enforced (`ck_wire_dual_control_before_complete` — holds even
against service_role); ACH is threshold-per-client, and with no configured
threshold a batch grades UNASSESSED, never exempt. The UNASSESSED backlog
drains the day the §3 parameters sheet is signed. **You confirm:** the wire
half discharges; the ACH half is honestly parameter-starved, not broken.

☑ **9. CG-GOV-01 → bsa:BSA-16 `partially_discharges`**
The obligation register for all 83 time-based triggers: cadence + anchor →
fires the control's own trigger code when due, emits overdue when ignored,
reports unanchored as UNSCHEDULED (a third state, deliberately distinct from
both "not due" and "overdue"). All 83 are UNSCHEDULED today — that is the
OQ-15 half of the parameters sheet. **You confirm:** supplying the cadence
half of BSA-16 honestly counts as partial discharge even while nothing is
anchored.

☑ **10. CG-LEND-01 → lending:LP-07 `partially_discharges`, lending:LP-11 `related`**
Dormant with lending parked (decision A), but reviewed now so unparking starts
warm: adverse-action notices queue automatically with the ECOA clock anchored
on application *completion*, second-level review is constraint-enforced before
issue, and party screening blocks funding on a match — but calls the same stub
screen as #4, hence `related` on LP-11. **You confirm:** verdicts stand as
written for a parked surface.

---

| Reviewed by | Date | Rows confirmed |
|---|---|---|
| lorenzo | 2026-08-11 | 10 / 10 |
