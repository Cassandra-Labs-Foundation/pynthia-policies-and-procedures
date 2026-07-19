# BLUEPRINT — loose ends, open questions, and what is actually true

Written for someone picking this up cold. It is deliberately not a changelog:
it records what is **unfinished, unverified, or waiting on a decision**, and
where something is a judgment call it says whose call it is and what the
tradeoff was.

Read [CROSSWALK.md](CROSSWALK.md) alongside this. That file is the regulatory
coverage artifact; this one is the engineering and decision backlog.

**Status at time of writing:** 404 hermetic tests passing, four function
entrypoints typechecking clean, lint at 3 pre-existing warnings. **Fifteen**
migrations written and **none applied**. Seven e2e sections added (32–37) and
**none run**. Nothing deployed.

---

## THE SIZE AND SHAPE OF WHAT IS LEFT

**This project is roughly 6 primitives plus about 15 subsystems.**

That sentence is the planning answer. It comes from a set-cover analysis of all
298 unreachable controls by STRUCTURAL SHAPE rather than subject matter (§5e):

- **Seven recurring primitives fully unblock 100 of 298 (34%)**, spread across
  all 26 policies. Two are already built.
- **The ceiling with every primitive identified is 119 of 298 — 40%.**
- **The remaining ~180 need entities that do not exist.** Not workflow, not
  process — *things*: an employee (`employee.hired`, `employee.separated`), an
  incident (`incident.declared`), a securities book (`position.booked`,
  `trade.limit.blocked`), a liquidity position (`liquidity.eod.posted`), a
  conflicts register (`coi.conflict.identified`).

That last point is the one most likely to be discovered late and hurt.
**No primitive substitutes for a missing entity.** Generalisation has a hard
floor at 40%, and everything past it is subsystem work of a kind this session
has not done yet — building the nouns, not the verbs.

**The corpus is flat** (no policy above 6.6%), so there is no large domain lever
and choosing "the next domain" is close to arbitrary. Leverage is entirely in
how cheaply the 26th domain can be added.

---

## 0. What this work is actually for

**The controls are not the deliverable. They are a forcing function.**

Each control interrogates the architecture and reveals what is structurally
missing. BSA-08 did not fail because per-person cash aggregation is hard — it
failed because **the data model had no concept of a member owning an account**,
and no amount of control logic papers over that. `account.entity_id` did not
exist. That finding is worth more than the control would have been.

So when reading anything below, the question is not "is this control done" but
"what did trying to build it reveal about the model". Findings are the output.

### The three kinds of blocker, and what to do with each

This distinction governs how everything in this file should be actioned.

| Kind | What it looks like | What to do |
|---|---|---|
| **Architectural gap** | the model is missing a concept, relationship, lifecycle or constraint | **Build it.** Report it. Keep moving. |
| **Domain knowledge** | a fact only the institution holds | **Stop and ask.** Guessing fabricates something only they can supply. |
| **Data needing a human answer** | correctly-formed future data is fine; existing rows have no known answer | **Build anyway.** Make the unknown *visible*, never silently absorbed. |

The third is the subtle one. `account.entity_id` is data-blocked for legacy
rows, and that must not stop cash — but a cash aggregation that quietly omits
unlinked accounts, or silently buckets each as its own person, is **the same
class of failure as fabricating the link**. Unattributable rows have to surface
as unattributable.

### Re-reading the open questions through this lens

Two things filed as "blocked on a decision" turn out to be architectural gaps
wearing a decision's clothing:

- **OQ-02 (OFAC).** The missing sanctions *list* is domain knowledge — genuinely
  blocked. But "screening never runs at payment submission" is **architectural**:
  the call site does not exist and can be built now, list or no list. Splitting
  those two halves means the structural work stops waiting on a procurement
  decision.
- **OQ-10 (retention classes).** Filed as "work nobody has done", but the real
  content is that seven record classes have **no subsystem to hang a clock on**.
  Each one resolves as its subsystem arrives rather than as a separate task —
  cash alone supplies `ctr` and `monetary_instrument`.

Genuinely domain-blocked and correctly filed: OQ-01 (rename), OQ-03, OQ-04
(overdraft), OQ-09 (quorum), OQ-11 (which policy renumbers), the 5300 chart of
accounts, and which controls are `compliance_floor`.

---

## 1. The honest summary

Three things are worth understanding before anything else.

**The `CG-*` controls map to nothing in the catalogue.** The six controls
enforced in code (`CG-OFAC-01`, `CG-CTR-01`, `CG-STR-01`, `CG-STR-02`,
`CG-NSF-01`, `CG-VEL-01`) use a namespace that does not appear anywhere in
`controls.json`. The catalogue is policy-derived (`BSA-06`, `AU-01`, …). The
crosswalk built during this session is the first artifact that connects them,
and it connects them by **hand-authored human judgment**, not by any join —
there is no key to join on.

**Nothing fully discharges anything.** Across 9 claims: 0 `discharges`,
4 `partially_discharges`, 3 `related`, 2 `no_catalogue_counterpart`. Eight of
the nine are unreviewed and are therefore proposals, not findings.

**`core.control_result` cannot currently support a coverage claim.** It holds an
unrecoverable mixture of real gate decisions, e2e assertions, and
`analytics/seed.sh` demo rows — that script drives the deployed API specifically
to "trip every control". Nothing on the row recorded its origin until migration
`20260719000900`, so every pre-existing row is backfilled `unknown`. That is the
only truthful label available; `production` would be a fabrication and
`simulated` an equally unfounded guess.

> **The `unknown` count is not stated here because it cannot be obtained without
> a live database.** Get it with
> `select count(*) from core.control_result where provenance = 'unknown';`
> after applying the migration. It should be reported prominently rather than
> buried — the number being visible is the point.

---

## 2. Open questions OQ-01 … OQ-12

Source of truth is the `open_questions` array in
[crosswalk-mappings.json](crosswalk-mappings.json); this table is a reading aid.

"Blocked on" distinguishes **decision** (needs Lorenzo, cannot be resolved by
engineering) from **work** (nobody has done it, no decision required).

| ID | Sev | Question | Blocked on |
|---|---|---|---|
| OQ-01 | **high** | Is `CG-CTR-01` misnamed? | decision |
| OQ-02 | **high** | Is `CG-OFAC-01` a control while its screen is a stub? | decision |
| OQ-12 | **high** | Accounts have no owning entity — blocks per-person cash aggregation | decision + work |
| OQ-11 | medium | `control_id` collisions — **corpus defect**, contained not fixed | decision (renumber) |
| OQ-03 | medium | Two controls map to nothing — corpus gap or out of scope? | decision |
| OQ-04 | medium | Does refusing overdrafts make TIS-08/CO-10 inapplicable? | decision (business) |
| OQ-09 | medium | Should the SAR committee quorum be enforced? | decision |
| OQ-10 | medium | Only 2 of 9 retention record classes have writers | work |
| OQ-06 | low | The catalogue's trigger vocabulary is internally inconsistent | work (corpus) |
| OQ-07 | low | `BSA-21` scoring "reachable" is a coincidence | none — noted |
| OQ-05 | low | **RESOLVED** — `bsa_alert.event_id` is populated | none |
| OQ-08 | low | **RESOLVED** — segregation of duties enforced | confirm roles |

### OQ-01 — `CG-CTR-01` is probably misnamed (high, decision)

A CTR obligation under 31 CFR 1010.311 attaches to **currency** — physical cash.
`CG-CTR-01` fires only on electronic movements (book, wire, ACH, card), none of
which are CTR-reportable. It is a legitimate large-transaction monitoring signal
wearing a filing regime's name.

The risk is the name alone: someone scanning for CTR coverage finds
`CG-CTR-01` and stops, while actual cash handling — which is what BSA-08
governs — is unmonitored, because the core has no cash surface at all.

**Ask:** confirm the reading, then either rename (e.g. `CG-LGTXN-01`) or keep the
name and record explicitly that it does not address BSA-08.

### OQ-02 — `CG-OFAC-01`'s screen is a stub (high, decision)

The enforcement *mechanism* is genuinely strong: always-on, unbypassable by
partner attestation or forced simulation outcome, and it writes a
`control_result` on every run including clean passes. The screen underneath it
is `/\bSDN\b/i` tested against the entity name. There is no list, no
`ofac.list_version`, no 50%-rule derivation, and it **never runs on payments** —
BSA-05 requires screening at `wire_transfer.submitted` and that path does not
exist.

This is the single most over-claimable row in the repo, because the plumbing
reads like a finished control in code review. It was given `related` rather than
`partially_discharges` on the reasoning that a screen with an empty comparison
set discharges nothing however good the surrounding machinery is.

**Ask:** confirm `related` is right. Also decide whether the OFAC floor should be
marked non-production until a real list is wired — this interacts with roadmap
item 50.

### OQ-12 — accounts have no owning entity (high, blocks cash)

BSA-08 aggregates cash **per person per business day** and names `entity.name`
and `entity.tin` as required inputs. `core.account` had **no link to
`core.entity` of any kind**.

Found while sequencing cash, and it changed the order. Building cash without
this would aggregate per ACCOUNT — the exact defect already recorded against
CG-STR-01 (*"splitting across two accounts owned by the same member evades it
entirely"*), reproduced at birth in the one control where that evasion **is**
the behaviour being detected.

`20260719001300` adds `account.entity_id` (nullable, FK) and `POST /accounts`
accepts it. Existing accounts are unlinked and **cannot be backfilled
truthfully** — nothing in the data says which member owns which account, and
inventing the link would fabricate a member relationship. That is why this
column is nullable where `partner_id` was made NOT NULL immediately: `partner_id`
had an unambiguous answer (D18 gives an instance one fintech), this does not.

**Ask:** link existing accounts, or discard the demo accounts. Until then
unlinked accounts sit outside CTR aggregation.
`select count(*) from core.account where entity_id is null;`

### OQ-11 — `control_id` collisions are a CORPUS defect (medium, contained)

**Rediagnosed. This is not an extractor bug.** `capitalization.md:39` defines
`## CP-01 — Capital Adequacy Targets`; `cash.md:47` defines
`## CP-01 — Governance and Delegation`. Both documents independently chose the
`CP-` prefix and the extractor reads exactly what is written.

`controls.json` has 333 rows carrying **316 distinct controls**. Two separate
causes, which need different handling:

1. **Replication.** Shared controls (`SC-01`, `SC-02`) are copied verbatim into
   every policy that references them — `SC-02` appears **nine times**. Counting
   those repeatedly inflated every reachability figure in the artifact.
2. **Genuine collisions.** `CP-01` … `CP-10` are **different controls sharing an
   id**. `CP-01` is *Capital Adequacy Targets* in `capitalization` and
   *Governance and Delegation* in `cash`. These are unrelated controls that
   happen to collide.

Before this was found, the crosswalk validator resolved a cited id to whichever
copy loaded last — so a claim citing `CP-03` could have been validated against,
and appear to describe, an entirely unrelated control.

Now handled: reachability is computed over deduplicated controls (identity is
`(control_id, title, trigger-set)`), collisions are detected, and a claim citing
a colliding id **fails the build** rather than being resolved arbitrarily. This
is containment, not a fix.

A related finding: `STATUS.md` records the cash policy as carrying `CA-01–CA-12`,
and **no `CA-` id exists in `cash.md` at all**. The cash regeneration appears to
have changed its prefix from `CA-` to `CP-`, and that is what created the
collision. Nobody noticed.

**Contained, not fixed.** The extractor now emits a globally unique `uid`
(`policy:control_id`), reports collisions in `controls.json`, and the crosswalk
refuses a claim citing a colliding bare id while accepting a uid-qualified one
(`cash:CP-01`). 333 rows now carry **333 distinct uids**. The corpus is still
wrong: any human citing "CP-03" in a memo or examination response is ambiguous
in a way no tooling can fix.

**Ask:** decide which policy renumbers — `STATUS.md` suggests cash was meant to
be `CA-`, so restoring that is the smaller change. Add a prefix-collision check
to the regeneration pipeline.

### OQ-03 — two controls map to nothing (medium, decision)

`CG-VEL-01` (daily $25k cap) and `CG-NSF-01` (overdraft refusal) have no
counterpart among the 316. The nearest catalogue entries govern *disclosing* or
*collecting* overdrafts (`TIS-08`, `TIS-05`, `CO-10`) and restricting accounts
after a conduct decision (`MP-05`) — none is discharged by refusing a
transaction.

Either the corpus is missing safety-and-soundness controls it should contain, or
these are engineering choices that should never appear in a coverage claim. The
two readings lead to opposite backlog decisions.

### OQ-04 — is overdraft ever offered? (medium, business decision)

`CG-NSF-01` declines any movement that would overdraw. If the product genuinely
never offers an overdraft service, `TIS-08` (Overdraft Service Disclosures) and
`CO-10` (Overdraft Collections) may be **inapplicable rather than
unimplemented** — scoped out with a documented rationale instead of built.

This is the one open question that could *remove* work from the backlog. It is
contingent on a product decision, not a code fact.

### OQ-09 — SAR committee quorum (medium, decision)

`case.concurred_by` records who concurred in a filing decision, but nothing
enforces quorum or composition. A SAR can be filed by a lone BSA Officer.

BSA-07 says a committee of BSA Officer, Compliance and counsel "makes the filing
decision". Whether that is a system obligation or an organizational one is a real
judgment: enforcing quorum in software would block a legitimate filing when
counsel is unavailable, and the 30-day deadline does not pause for that. The data
to enforce it is captured either way.

### OQ-10 — retention covers 2 of 9 record classes (medium, work)

`setRetentionClocks` fires on `account.closed` and creates `cip_identity` and
`beneficial_owner` records — the two classes anchored on closure. The other seven
(CIP verification, CTR, SAR, monetary instrument, wire transfer, CMIR, OFAC
blocked) anchor on their own creation dates and need a clock set where each
record is made. Those hook points mostly do not exist: no CTR filing, no monetary
instrument log, no CMIR.

The retention **mechanism** is complete and enforced. **Coverage is partial.** A
wire transfer today starts no retention clock, so SC-02's lifecycle applies to
nothing on that rail. Reading "retention is implemented" off the mechanism would
over-claim.

### OQ-06, OQ-07 — measurement caveats (low, noted)

OQ-06: some `control_rules` carry `trigger_event: null`, so reachability
conflates "blocked on a subsystem" with "the catalogue does not say what fires
it". The headline numbers are directionally right but should not be quoted to a
decimal. Fixing it means editing the policy corpus.

OQ-07: `BSA-21` is fully reachable *only* because its one declared trigger is
`account.closed`. It is the row most likely to be misread as nearly done. The
`completable` column exists specifically to stop that.

### OQ-05, OQ-08 — resolved

OQ-05: `bsa_alert.event_id` was always NULL because of an FK to `core.event`
with no event row ever created for a money movement. `raiseAlert()` now writes
the causing event first and points the alert at it. The event's code is
`bsa_alert.created` — BSA-06's *actual declared trigger*.

OQ-08: `api_token.roles` carries a closed four-value vocabulary; `core.case`
records `opened_by` / `decided_by`; `ck_case_four_eyes` enforces they differ.
**Still to confirm:** that the four roles match how the institution actually
staffs these duties.

---

## 3. Written but unverified

Everything in this section exists in the repo and passes hermetic tests. None of
it has touched a database or a ledger. **No Blnk credentials and no deployed
instance were available for this entire session.**

### Migrations written, none applied

| File | What it does | Risk if wrong |
|---|---|---|
| `20260719000500_ach_return_reason_and_noc.sql` | ACH `return_reason` + `noc` columns | low — additive |
| `20260719000600_partner_tokens.sql` | `core.api_token`, per-partner scoped tokens | **high** — auth path |
| `20260719000700_aggregator_schema.sql` | aggregator ingest schema | medium |
| `20260719000800_partner_ownership.sql` | `partner_id` NOT NULL + backfill + FKs | **high** — backfill raises if 0 or >1 active partner |
| `20260719000900_evidence_provenance_and_sim_schema.sql` | provenance columns, `sim` schema, immutability trigger | **high** — touches every evidence table |
| `20260719001000_bsa_roles_and_four_eyes.sql` | `api_token.roles`, four-eyes CHECK | medium |
| `20260719001100_record_retention.sql` | `core.record`, disposal constraints, `sim.record` | medium |
| `20260719001200_demo_provenance.sql` | adds `demo` provenance class; closes the seed.sh gap | medium |
| `20260719001300_account_entity_link.sql` | `account.entity_id` (nullable) + FK — cash prerequisite | low — additive |
| `20260719001400_cash_and_ctr.sql` | `core.cash_transaction`, `core.ctr_filing`, sim mirrors | medium |
| `20260719001500_dual_control_and_client_limits.sql` | `core.payment_approval`, `core.client_limit`, wire dual-control CHECK | **high** — changes the wire path |
| `20260719001600_governance_calendar.sql` | `core.obligation`, `core.obligation_completion`, sim mirrors | medium |
| `20260719001700_lending_origination.sql` | `core.loan_party`, `core.adverse_action_notice`, application lifecycle | medium |

**Apply in filename order.** `20260719000900` must precede `…001000` and
`…001100` (both extend `sim`, which it creates). `20260719000800`'s backfill
**deliberately raises** rather than guessing if it finds zero or multiple active
partners — that is intended behaviour, not a bug to work around.

### e2e sections added, none run

| Section | Covers | Added in |
|---|---|---|
| 32 | ACH simulations — settle, return codes, post-settlement return, NOC | rail sims |
| 33 | Wire simulations — accept, reject, domestic-only refusal | rail sims |
| 34 | Card simulations — auth, partial + incremental capture, expiry | rail sims |
| 35 | BSA case chain — alert → triage → case → SAR decision | case mgmt |
| 36 | Segregation of duties + record retention | SoD round |
| 37 | Cash + CTR — per-person aggregation, unattributable currency | cash round |

The harness is `supabase/tests/e2e/compliance_e2e.sh` (254 `check` assertions
total). It needs `DEMO_API_KEY`, `SUPABASE_DB_URL`, `BLNK_API_URL`,
`BLNK_API_KEY` and a deployed function. Syntax is validated (`bash -n`);
nothing else about it is.

### What the hermetic suite does and does not prove

**Does:** state machines, validation, replay/idempotency semantics, control
thresholds and their arithmetic, evidence row shapes, partner confinement, the
four-eyes rule, the three disposal conditions, provenance separation. Load-bearing
guarantees were mutation-tested — deliberately breaking each one and confirming
tests fail.

**Does not:** any Blnk round-trip. Every hold, commit, void and balance read is
a stubbed `fetchFn`. Whether Blnk actually behaves as the stubs assume is
**unverified for everything built this session**. The rail simulations in
particular alias real writers that make real ledger calls, and those calls have
never been made.

---

## 4. Decisions waiting on Lorenzo

Consolidated. Each blocks something concrete.

1. **Which controls are `compliance_floor`.** `controls.json` has **no such
   field on any of the 316 controls**. D22 says floor controls cannot be
   disabled. Someone must designate which. **Blocks roadmap item 50 entirely** —
   it cannot start.
2. **The 5300 chart-of-accounts mapping.** `bookkeeping_entry.account_code_5300`
   is hardcoded to `"018"` on every entry. Real reporting needs a per-product
   mapping. **Blocks item 60.** Domain knowledge, not engineering.
3. **Eight unreviewed crosswalk mappings.** Every claim carries `needs_review` /
   `reviewed_by`; none has a reviewer. An unreviewed row is a proposal. Until
   `reviewed_by` is set, no row is load-bearing.
4. **OQ-02 — is `related` right for `CG-OFAC-01`?**
5. **OQ-03 — corpus gap, or exclude `CG-VEL-01`/`CG-NSF-01` from coverage?**
6. **OQ-04 — is overdraft ever offered?** Could scope out two controls.
7. **OQ-09 — SAR quorum: enforced, advisory, or organizational?**
8. **OQ-08 follow-up — is four-eyes enough?** Currently the investigator cannot
   decide their own case. If examiners want more (e.g. a second approver on
   *every* filing regardless of who opened it), that is a different constraint
   and should be specified before it is built.
9. **OQ-01 — rename `CG-CTR-01`?**

---

## 5. Known-live defects and hazards

Distinct from feature gaps. These are things that are *wrong* or that will
*break* something, not merely absent.

### Fixed, but touched live behaviour — confirm against Blnk

- **`remaining_cents` on a reversed/expired auth.** Previously derived from
  `amount - captured` alone, so a reversed $1,000 authorization reported $1,000
  still capturable — the hold was voided in Blnk but the API kept advertising
  it. Now forced to 0 for `reversed`/`expired`/`declined`. Pre-existing bug,
  affected `reverse` before `expire` existed. **Confirm against a real ledger.**
- **Idempotency cross-partner leak.** `Idempotency-Key` was a **global**
  primary key. Two partners using the same key value — `"1"`, a UUID
  collision, a shared client library default — would replay each other's cached
  response, returning one partner's account or transfer data to another. This
  was **exploitable, not theoretical**. Now namespaced per
  `ctx.idempotencyScope`. The migration rewrites the primary key.

### Operational hazards on deploy

- **`INSTANCE_ID` is now required.** Absent, every request 500s with
  `misconfigured`. This is deliberate — a missing instance id would otherwise
  silently disable the instance binding that card 51 exists to provide — but it
  means **setting the env var is a hard prerequisite**, not a nice-to-have.
- **`X-API-Version` is now `4.0.0`** — a breaking change. Per-partner tokens
  replace the single shared `X-Api-Key`.
- **`ALLOW_DEMO_KEY` transition ramp.** The bootstrap `DEMO_API_KEY` still
  works, because the card-16 outbox worker authenticates to its own
  `/sandbox/event-sink` with it and the e2e harness predates tokens. Set
  `ALLOW_DEMO_KEY=false` in any real deployment. **Card 45 says "replaces
  hardcoded creds" and this is the hardcoded cred — it is not gone.**

### Traps for the next person

- **Do not add a `partner_id` predicate to `runGate`'s sweeps.** Every rail
  carries an owner now, so scoping them looks like an obvious tightening. It is
  the opposite: the aggregate **fails open**. Fewer rows → threshold never
  reached → the control writes a clean passing `control_result` while permitting
  the transaction. A cap that never trips is indistinguishable from a cap that
  was never exceeded. There is a blunt comment at the site
  (`supabase/functions/api/transfers.ts`) and `INSTANCE_SCOPED_TABLES` in
  `ownership.ts` is asserted by tests rather than left to a comment.
- **`account_code_5300` is hardcoded to `"018"`** on every bookkeeping entry.
  See decision 2 above.
- **Only 2 of 9 retention classes have writers.** A wire transfer starts no
  retention clock. See OQ-10.
- ~~**`analytics/seed.sh` writes production-labelled demo evidence.**~~
  **CLOSED** by `20260719001200`. The seed authenticates with the shared
  `DEMO_API_KEY`, so the auth layer now resolves that credential to
  `evidenceProvenance: "demo"` and every evidence row it writes is stamped
  `demo` rather than `production`. Only `production` counts toward coverage.
  Note it could **not** simply be pointed at `sim`: the seed creates accounts and
  transfers, which are core *business* rows, and `sim` mirrors only the evidence
  tables. Pre-migration seed rows stay `unknown` — they are indistinguishable
  from real ones by construction, which was the original finding.

---

## 5e. Primitive analysis, and a PREDICTION RECORDED IN ADVANCE

### Why primitives are not independently valuable

The natural estimate — "pick the biggest primitive and build it" — is wrong, and
wrong in an informative way. Measured individually the best primitive fully
unblocks **9** of 298. Three fully unblock **31**. Anyone sizing the first
primitive on its own will conclude it is not worth building.

The value is in the SET, because most controls need two or three shapes at once.
Greedy cumulative coverage, with the marginal gain of each addition:

```
+C work item     →   9   (+9)    7 policies
+A cadence       →  19  (+10)   12 policies      [already built]
+J register-upd  →  31  (+12)   18 policies
+D request/dec   →  47  (+16)   23 policies
+F issuance      →  68  (+21)   25 policies
+G threshold     →  91  (+23)   25 policies
+E inbound       → 100   (+9)   26 policies
```

**The marginal gains RISE mid-sequence** (+12, +16, +21, +23). That is the
compounding: each primitive completes controls that were waiting on a
combination. The policy spread widening 7 → 26 is the evidence these are genuine
primitives and not extractions from one domain.

### The prediction (recorded 2026-07-19, before building)

Figures at the moment of writing, from `crosswalk.json`:

| measure | value |
|---|---:|
| reachable | 3 |
| partially_reachable | 15 |
| unreachable | 298 |
| **completable** | **2** |
| verdicts | 8 partial · 4 related · 2 no-counterpart · **0 discharges** |

**Predicted:** building all six remaining primitives moves these numbers **not at
all**. A primitive is a capability, and per §5c a capability nobody has exercised
is not an emission. Reachability should step only when a domain genuinely
registers real obligations, real thresholds, real work items.

**Falsification condition:** if reachability rises while these primitives are
being built and *no domain has adopted one*, something has been counted that
should not have been. The commitment is to stop and say so, not to explain it.

## 5f. The DRILL — and the two measures that must never merge

`DRILL.md` / `drill.json` record a **synthetic institution run end to end**:
45 cases, 18 controls, 12 policies, roughly half of them negative.

**A drill is not coverage.** The word was chosen because it carries its own
caveat when quoted out of context — a fire drill proves the alarm works, nobody
concludes the building burned. `drill_passed` cannot be misread as a control
being satisfied the way "covered" can.

| | Coverage | Drill |
|---|---|---|
| question | can the core do this for a real institution that supplied its own configuration? | does the machinery behave correctly when driven end to end? |
| unit | `reachable` / `completable` | `drill_passed` / `drill_failed` / `drill_not_runnable` |
| artifact | `CROSSWALK.md` | `DRILL.md` |
| regulatory meaning | this is the claim | **none** |

**Why the two disagree, in one line:** the drill supplied the institution's
configuration and a real institution has not. That is the entire difference, and
it is why "fixing" the smaller number would be fabrication rather than
reconciliation.

### What the drill found once it drove the whole core

Breadth beat polish. Adding the four money rails and the gate took the drill from
45 cases to 60 and immediately produced four findings, three of them real:

- **OQ-18** — the four rails hardcode `db.schema("core")` and take no `scope`
  parameter; every module built after them does. The drill could not point them
  at a substrate and had to seed both schemas.
- **OQ-19** — `runGate` returns on the first blocking control, so a transaction
  that is both over-velocity and unaffordable writes ONE `control_result`. The
  refusal is right; the evidence cannot distinguish "NSF ran and passed" from
  "NSF never ran".
- **OQ-20** — a rejected transaction correctly does not count toward same-day
  volume, so repeatedly probing the velocity cap leaves no aggregate signal.
- **A fake-fidelity bug in the drill itself**: the in-memory map applied no
  column defaults, so every row had `created_at === undefined` and fell out of
  the velocity sweep's `created_at >= todayStart` filter. CG-VEL-01 *could not
  fire at all* and the drill reported PASS. This is the "proves less than it
  appears" failure in its purest form, and it is why the fake's fidelity list is
  maintained rather than assumed.

### The exposure is one file, not the runtime

`scripts/build_crosswalk.py` **never reads a row** — it reads `controls.json`,
`crosswalk-mappings.json`, `crosswalk-emitted-events.json` and greps `.ts`
source. So a drill writing ten thousand rows cannot move reachability by
construction. The sim-schema separation is not even the load-bearing part.

The real exposure is a **process step on one JSON file**: the drill fires codes
like `audit.cycle_timer` and `threshold.breached`, and adding those to the
inventory because "the core emitted it" would raise reachability on the strength
of a fixture. `DRILL.md` prints those codes under an explicit heading saying they
are not grounds for adding anything.

### The fake's fidelity is published unenforced-first

The drill runs against an in-memory stand-in. Twelve CHECK constraints are
re-implemented in it; **six classes of guarantee are not** — foreign keys, UNIQUE
constraints, the immutability triggers, NOT NULL on `partner_id`,
transactionality, and type/enum coercion. `DRILL.md` prints the **unenforced**
list first, because that is the list that changes how a reader should weigh a
passing drill.

## 5d. CORRECTION — trigger namespace is not policy area

**My own earlier summaries in this session were misleading, and the error is the
kind that survives in a document because it sounds like a finding.**

I repeatedly characterised the remaining work as concentrated in
"incident / vendor / capital / cda / audit". Those were **missing-trigger
NAMESPACES**, not policy areas, and I never said so. The two are different:

| namespace I cited | actually drawn from |
|---|---|
| `vendor` (14) | third-party-risk 9, **bsa 1**, business-continuity-plan 1, fair-lending 1 |
| `capital` (14) | capitalization 10, **basel-ii 4** |
| `incident` (10) | business-continuity-plan 5, e-commerce 2, collections 1, information-security 1 |
| `audit` (10) | audit 8, **bsa 1**, compliance 1 |

So **BSA-20 (Prepaid Access & Third-Party Vendors) sat in the "vendor" bucket and
BSA-16 (Independent Testing) in the "audit" bucket** — two BSA controls that
anyone reading the summary would reasonably have expected counted as BSA.

**The corpus is FLAT.** 316 controls across 26 policies, no policy above
**6.6%** (bsa, 21). The unreachable are flatter still: bsa is **14/298 = 4.7%**,
and at 67% unreachable BSA is the *least* blocked substantial policy — eighteen
policies are 100% unreachable. AML-adjacent under a generous definition
(bsa policy + OFAC/sanctions/AML titles elsewhere) is **24 of 316 = 7.6%**.

`ctr`, `sar` and `aml` are **trigger namespaces, not policies** — `ctr.*` belongs
to BSA-08, which is inside the `bsa` policy. Counting them separately would
double-count.

**Consequence for strategy:** there is no large domain lever. Choosing "the next
domain" is close to arbitrary. Leverage is in how cheaply the 26th domain can be
added — see §5e.

## 5c. The largest available inflation, and why it was refused

The governance calendar emits `String(obligation.trigger_code)` — whatever code
a **registered** obligation carries. So the core is *capable* of emitting
`audit.cycle_timer`, `training.annual_cycle.opened`,
`vendor.annual.review.due_at` and 80 others.

Adding those 83 codes to `crosswalk-emitted-events.json` is a **one-line JSON
edit that would move dozens of controls to `reachable`.** It was refused.

Reachability asks "can the core fire this control's trigger". For an
unregistered obligation the honest answer is no: the machinery exists, the
obligation does not. A capability nobody has exercised is not an emission.

This is recorded in the inventory itself under `_deliberately_excluded`, because
the next person to look at the reachability numbers and want them higher will
find this exact lever first. **If these are ever added it must be driven by what
is actually registered on a real instance, not by what the code can do.**

Evidence the discipline held: Tier D added 19 tests, a table, a sweep and four
endpoints — and moved reachability **not at all** (3 / 11 / 302, completable 2).

## 5b. When a control invalidates an existing test, trust the control

**Precedent, recorded because whoever hits the next one will wonder.**

EPS-06 turned **nine passing wire tests red**. They were not broken by the
change — they had encoded the behaviour EPS-06 says is wrong: `confirm` called
by whoever called `prepare`. The old code comment even claimed the two-phase
split "satisfies the dual-control requirement", and it did not: two CALLS is not
two PEOPLE.

The right move was to update the tests and add explicit ones for the refusal
path, not to soften the control. A control invalidating existing tests is the
clearest evidence the forcing-function approach is doing something — it means
the specification disagreed with the implementation and the specification won.

The check before doing this: is the test asserting a *deliberate* decision
someone documented, or is it asserting whatever the code happened to do? Here it
was the latter, and the comment claiming otherwise was itself the bug.

## 5a. The number that must not creep — a worked example

Emitting `wire_transfer.submitted` (which the core genuinely does, and had
simply never announced) moved **BSA-10 Travel Rule from unreachable to
reachable**. Nothing about the Travel Rule is implemented: wires ≥$3,000 require
originator and beneficiary records that this core does not keep.

`completable` stayed at **2**. BSA-10 is `reachable: true, completable: false`,
and the artifact names the events it cannot emit
(`wire_transfer.record.retained` among them).

That is the guard working as designed, and it is the specific failure mode to
watch: **reachability rises whenever the core learns to say something it already
did, which is honest and does not mean coverage rose.** Quote `completable`.
If a future change raises `completable` without a corresponding subsystem
existing, that is the signal something got counted that should not have been.

## 6. Where the coverage story stands

| Measure | Value |
|---|---|
| Catalogue rows / distinct controls | 333 / **316** |
| Controls with an implementation claim | 6 (`CG-*`) |
| `discharges` verdicts | **0** |
| `partially_discharges` / `related` / `no counterpart` | 4 / 3 / 2 |
| Claims awaiting review | **8 of 9** |
| Reachable (core can fire *every* trigger) | **2** |
| Partially reachable | **8** |
| Unreachable | **306** |
| **Completable** (every trigger fires *and* every produced event emittable) | **2** — `BSA-06`, `BSA-21` |

**Use `completable`, not `reachable`, when estimating what is buildable.**
Reachability only asks whether a control can be *started*.

Largest blocked namespaces (proxy for the subsystem that must exist first):
`capital` 14, `vendor` 14, `cda` 14, `audit` 10, `incident` 10, `cash` 10,
`employee` 8, `eps` 8.

---

## 7. What's next, and in what order

The obvious ranking — **controls unlocked per unit of work** — is wrong, and
using it walks straight into the hazard the provenance work exists to prevent.
Incident unlocks 19 controls and vendor 14, but every one of those would then
write `control_result` rows about fabricated incidents and fabricated vendors.
That is not risking the failure mode; it is industrialising it.

**The metric that matters: does this make evidence the system already produces
more trustworthy, or does it manufacture new evidence?** That inverts the
ranking — which is why case management (3 controls, the *lowest* count) was
correctly done first. Its trigger `bsa_alert.created` is already fired by real
money movement through the real gate, so it needed **no fabricated data at
all**. That made it the right place to build and prove the provenance machinery
*before* anything depended on that machinery being correct.

Retention followed as the first genuine test of the `sim` substrate: retention
runs 5–10 years, so disposal eligibility cannot be waited out, and an aged
record in `core` would be a row claiming an anchor date it does not have.

### Tier A — real triggers exist, no fabrication needed
- ✅ Case management (BSA-06/07/14) — **done**
- ✅ Record retention (BSA-21, SC-02) — **mechanism done**, 2 of 9 classes wired (OQ-10)

### Tier B — genuine subsystem, genuinely real state once built
- ✅ **cash — BSA-08 done.** `core.cash_transaction` is the first representation
  of CURRENCY in the core, which is what a CTR obligation actually attaches to.
  Per-person per-business-day aggregation with cash-in and cash-out assessed
  separately, a 15-day FinCEN clock, and an overdue sweep. BSA-08 moved
  **unreachable → partially_reachable** and its verdict `related` →
  `partially_discharges`. Unlinked accounts do *not* block it: their currency is
  recorded, flagged unattributable, and the day is reported `complete: false`.
- **cash OPERATIONS (CP-01..CP-12)** — vault and device limits, dual control,
  reconciliation, over/short. A *separate* domain built on the same ledger,
  not yet started
- ✅ **eps — EPS-06 done.** Dual control on payment origination. **This one
  corrected the API**: the two-phase wire prepare/confirm split looked like dual
  control and was not — two CALLS, not two PEOPLE, and one token could do both.
  Confirm now demands a distinct approver, enforced by
  `ck_wire_dual_control_before_complete`. The four-eyes rule moved from a
  bespoke constraint on `core.case` to one reusable `core.payment_approval`.
  The remaining eps controls (EPS-01/03/04/09/10 governance workflow, EPS-05
  authentication, EPS-07 fraud, EPS-08 vendor) are **not** built — eps is mostly
  a payments-GOVERNANCE domain, not a transaction domain.
- ✅ **loan — origination SPINE done** (LP-03, LP-07, LP-11 of 15). Application
  lifecycle, the ECOA adverse-action obligation, and the OFAC gate on loan
  parties. **LP-11 built the OFAC call site OQ-02 said was missing** — the
  blocking mechanism is real; the screen it calls is still the stub, so LP-11's
  verdict stays `related`. Credit scoring (LP-04), ATR/QM (LP-05), appraisals
  (LP-06), pricing (LP-10) and insider lending (LP-14) are **not** built.

### Tier C — require fabricated triggers; highest counts, lowest evidentiary value
`incident` (10), `vendor` (14), `capital` (14), `cda` (14), `audit` (10).
**Do not start these until the `analytics/seed.sh` gap in §5 is closed** — they
are the first work that genuinely depends on simulated evidence staying
structurally separate.

### ✅ Tier D — governance calendar (machinery done, register empty)
`core.obligation` is one register for all **83** of the catalogue's time-based
triggers, which are identical in shape. The sweep fires each control's **own
declared trigger code**, so a control genuinely starts rather than resembling a
start. Completion advances from the **due** date, never the completion date —
otherwise chronic lateness silently stretches the cadence until an obligation
stops recurring.

**The register is empty and that is deliberate.** Registering all 83
automatically would assert the institution has 83 live obligations, which nobody
has said. See OQ-15 and §5c.

### Immediate, independent of tiers
1. Apply the nine migrations to a real database, in order.
2. Run the e2e harness (sections 32–36 have never executed).
3. ~~Fix `extract_controls.py` id namespacing~~ — **contained**; the corpus
   renumbering decision remains (OQ-11).
4. ~~Close the `seed.sh` provenance gap~~ — **closed** by `20260719001200`.
5. Get the `unknown` `control_result` count and publish it.
6. **Link existing accounts to entities, or discard them (OQ-12).** Cash cannot
   aggregate per person until this is answered, and building it per-account
   would reproduce a known evasion defect.

---

## Cross-repo (cedar-grove-redline)

> **Provenance and status.** Everything in this section is **reported**, from an
> audit of a *different codebase* carried out earlier in the same working
> session. It has **not been verified against that repository as part of the
> work recorded above**, and no file, line number or claim here was re-checked
> when this blueprint was written. Treat it as a handover note to be confirmed,
> not as a finding.
>
> **None of this describes the Pynthia banking core.** It is recorded here only
> so the two threads of one session are not lost, and because the two were
> briefly conflated while the session was live — see the deployment note below.

**Repository:** `~/Lorenzo/Github/cedar-grove-redline`, remote
`Cedar-Grove-LLP/cedar-grove-redline`. Python. Layout: `redline_engine/`,
`cedar_redline/`, plus `bench`, `e2e`, `dashboard`, `ops`, and Hermes
plugin/skill directories.

### Deployment target — unrelated to Pynthia

DigitalOcean droplet `hermes-agent` at `146.190.199.150` (Ubuntu 24.04, NYC1, DO
project *Cedar-Grove*). Root access via `~/.ssh/hermes_do`. Documented in
`docs/do-deployment.md` and as the `HERMES_BOX` default in
`ops/derive-overlay.sh` and `ops/populate-overlay.sh`. Runs
`hermes-dashboard.service` and `hermes-gateway.service` as **user** units under
`systemctl --user`, with `XDG_RUNTIME_DIR=/run/user/0`.

**This box belongs to the Cedar Grove project and has no relationship to
Pynthia.** It hosts nothing described anywhere else in this document. The two
were briefly conflated during the session; recording the separation explicitly
so it is not re-conflated later. Nothing in the Pynthia core is deployed
anywhere — see §3.

This also resolves an earlier confusion: `ProposalsPage.tsx` and the service
observed on `127.0.0.1:10000` belong to *this* repository. The Pynthia repo has
no frontend at all — no `.tsx`, no `package.json`, no `index.html`.

### Reported: well covered

**Thread editing is genuinely end-to-end.** `e2e/playbook.py` (loop tier,
`loop_tier`, around line 1306) runs against the deployed box. An attorney emails
a reply containing a marker edit; the test asserts a rerun occurred with
`rerun_of == run1`, that the feedback text was recorded, that a new output sha
was produced, and that the restaged draft actually contains the edit. It then
repeats the cycle via the resumed session — the dashboard deep-link path.

Worth noting: it asserts the marker is **absent before** feedback, so the
"my edit landed" assertion is not vacuous. That is the property most such tests
get wrong.

### Reported: the significant gap

**`cedar_redline/proposals.py` has zero test coverage** — no unit tests, no e2e.

Untested functions: `create_proposal`, `approve_and_apply`, `reject_proposal`,
`resolve_playbook_path`, `_append_changelog`, and `_safe_id()` — the last being
a **path-traversal guard on an id used to construct a filesystem path**.

Also untested:
- the conflict path when the playbook has drifted since filing
  (`{"ok": False, "conflict": True}`)
- the changelog append
- the dashboard endpoints at `plugin_api.py:289-300` — `GET /proposals`,
  `POST /proposals/{pid}/approve`, `POST /proposals/{pid}/reject`
- `ProposalsPage.tsx`

The only two references to the feature anywhere in tests are tool-registration
assertions checking that the string `cg_propose_playbook_update` appears in a
list — `e2e/playbook.py:555` and `tests/test_phase2_plugin.py:55`. Those assert
the tool is registered, not that it works.

**Why this is the priority finding rather than one gap among several:** this is
the one workflow where an automated action **mutates a governed document**.
`PLAYBOOK.md` drives every future redline, so a defect here does not produce one
bad output — it silently changes the rules all subsequent outputs are generated
against. An untested path-traversal guard sits directly on that path. Nothing
guards it.

### Reported: partial coverage

- **Skills.** `tests/test_playbook_skills.py` is thorough, but only exercises
  `parse_skills()` — the *reader*. Nothing tests a skill name getting into a
  playbook, or being resolved and invoked. `_skill_usage()` reads `.usage.json`
  counters, which proves a counter incremented, not that the skill did the right
  thing.
- **Error handling.** The `errors_tier` works by injecting synthetic failed runs
  (`_inject_failed_run`, `_inject_error_entry_run`). That tests the error
  *display surface*, not real failure modes.

### Terminology correction

In that codebase the **agent files proposals** via
`cg_propose_playbook_update`; the **lawyer approves them** in the dashboard. The
propose side is *not* lawyer-initiated. This was misdescribed earlier in the
session and the correction is recorded here so it does not propagate.

---

### Roadmap of record (Pynthia)

The Notion board **"BaaS Core Design"** (workspace: *Credit Union / Banking Core
CUSO*) is the roadmap of record for the Pynthia work described in this document.
Cards **35, 38, 44, 45 and 51** were moved to *In progress* with review comments
during this session. The board lives in a **different Notion workspace from the
default connector**, so it is reachable via browser rather than the Notion API.

### Capital (CP-*, BA-*) — 11 green, predicted 8

**OQ-22. The corpus names one event two ways.** `capital.board_escalation` and
`capital.board_escalation.issued` are the same fact, used by different controls.
The writer emits both aliases; otherwise one control is permanently unsatisfiable
for a naming reason rather than a systems reason. Worth a corpus-level normalisation
pass — this is unlikely to be the only instance.

**OQ-23. `BsaRole` is now the general role set.** `cco` and `cfo` were added because
CP-03 write-restricts capital targets to the CCO and CP-05 the capital plan to the
CFO. The type name is wrong for its contents and should be renamed.

**Statutory vs institutional thresholds — the distinction is now load-bearing.**
PCA bands (12 CFR 702.102) are hardcoded, and that is a lookup, not a fabrication.
The internal early-warning trigger above the floor is Board-approved and stays
`unassessed` until configured, reporting NO verdict rather than "not breached".
Capital is the first artifact where both kinds sit side by side in one table.

**`core.threshold` was NOT used and should not be.** It compares one observed value
to one limit; a capital ratio is computed from components and classified into five
bands. Bending it would have left a primitive that appears to support computed
positions and handles them badly.

**Fourth clock, fourth anchor.** NWRP is 45 days from CLASSIFICATION. The anchor
question is confirmed per-control, not answerable by habit.

**Harness gap found and fixed:** the fake `upsert()` did not support `.select()`
chaining, which the real PostgREST client does. Production code was contorting
around the test double. Fixed in the double.

### eps (EPS-*) — 0 green, predicted 6. THE PREDICTION BROKE.

First artifact where the estimate failed outright, and the reasons are specific
rather than a general collapse of the model:

**1. The denominator was smaller than the namespace count suggested.** `eps` shows
39 in a namespace tally, but that counts trigger OCCURRENCES. There are only TEN
red eps controls. Every prior prediction was made against occurrence counts, so
this error is retrospective too — the namespace ranking used to choose build order
has been overstating thin domains all along.

**2. Four of the ten are organisational by our own rule** (EPS-04 IT committee,
EPS-08 vendor DD, EPS-09 training, EPS-11 BCP testing). They govern staff and
vendors, not transactions or members. NOT rescoped unilaterally — flagged for
Lorenzo. Real technical base is ~6.

**3. EPS-05 and EPS-07 are built and correct but blocked on a MISSING WRITER, not
on their own logic.** Both require `card.id` / `card.spend_controls`, and there is
no card-issuance writer anywhere in the system — `cards.ts` has authorize, capture,
expire and reverse, but nothing that creates a card. Every card in the drill is
assumed pre-existing. This is a genuine architectural hole that eps merely exposed;
it will block any control needing a card as an input.

**OQ-24: build a card issuance writer.** Blocks EPS-05, EPS-07, and probably part
of cda.

**Drill-found bug, real:** the auth lockout never fired because the "prior attempt"
query ordered by `created_at`, and consecutive attempts land in the same
millisecond, so the failure count never reached the threshold. Ordering by
`failure_count` fixed it. A real lockout control would have failed open under
exactly the burst conditions an attacker creates. This is the second time an
ordering assumption has produced a control that reports success while doing
nothing (cf. the heartbeat sweep starvation).

### Harness: the fake now fails loudly (three-strikes rule)

`fake_db` had been wrong three times (column defaults, `.lt()`, `.select()`
chaining). Unsupported builder methods now THROW naming the gap instead of
returning undefined. First version of the guard was DEAD CODE — chained calls
returned the raw object and escaped the proxy — caught only because it was tested
against a deliberately unsupported method before being trusted. Same lesson as
`fire_path`: the instrument has to be checked against the thing that would
falsify it.

## §5g — Two method rules, both learned the hard way

### RULE: size predictions against CONTROL counts, never namespace tallies

The namespace tally is the first number anyone finds and it is the misleading one.
It counts trigger OCCURRENCES; a control declaring five triggers in one namespace
counts five times.

**Worked example (eps).** `eps` tallied 39 and ranked #1-adjacent. It has TEN red
controls, four of them organisational, so the real technical base was ~6. A
prediction of 6 was made against an apparent 39. Every earlier prediction in this
run inherited the same error.

**It also changed the build order.** Re-ranked by control count:

| namespace | controls | occurrences | old rank |
|---|---|---|---|
| incident | 15 | 31 | #3 |
| cda | 13 | 32 | #2 |
| record | 12 | 17 | #8 |
| loan_application | 11 | 20 | #6 |
| cash | 10 | 36 | **#1** |

`cash` was chosen as next-densest on the strength of 36 occurrences. It is fifth.
`record` was invisible at #8 and is third.

### RULE: check ordering assumptions — they produce controls that report success while doing nothing

A named failure shape, now seen three times:

1. **Heartbeat sweep starvation** — a bounded oldest-first sweep that did not touch
   every examined row starved the tail forever.
2. **Auth lockout ordering** (EPS-05) — the prior-attempt lookup ordered by
   `created_at`; consecutive attempts land in the same millisecond, so the sort was
   arbitrary and the failure count never reached the threshold. The lockout would
   have failed open under exactly the burst conditions an attacker creates.
3. **Capital position ordering** — same `created_at` pattern, caught by inspection
   rather than by failure.

All three share one shape: the control RUNS, emits its events, and reports success,
while the thing it exists to prevent still happens. Ordinary tests pass because the
happy path is untouched. Check every ORDER BY that feeds a decision for ties and for
whether the sort key is the one the logic actually depends on.

### OQ-24 CLOSED: card issuance

`cards.ts` had authorize, capture, expire and reverse — every verb that assumes a
card exists, and nothing that creates one. Any control declaring `card.id` or
`card.spend_controls` was unsatisfiable regardless of its own correctness.
EPS-05 and EPS-07 were built, correct, and red for this reason alone; both went
green the moment issuance existed (31 -> 33).

**Generalised: a subsystem can look complete because all its VERBS are present
while the NOUN they operate on has no origin.** Worth sweeping for elsewhere.

### Scope correction (six controls, in -> out)

eps (11 in / 0 out) and cda (14 in / 0 out) had never been triaged per-control.
Moved: EPS-04, EPS-08, EPS-09, EPS-11, CDA-10, CM-08. In-scope 231 -> 225.

Controls that merely MENTION committees or staff inside otherwise technical
behaviour (bsa:BSA-07, record-retention:RR-03, the three SC-03 incident controls)
were deliberately LEFT IN. Wrongly scoping OUT is invisible — the control silently
stops being counted. Wrongly leaving one IN is a visible red row someone will look
at. Bias accordingly.

### cda (CDA-*) — 13 of 13 green, predicted 5. THE PREDICTION BROKE UPWARD.

Second prediction to break, and in the opposite direction from eps. The eps
miss was a denominator error (§5g); this one is a different mistake and worth
separating, because "the model is unreliable" is the wrong lesson to draw.

**Why 5 was too low: cda had no verbs AND no noun.** The prediction was made by
analogy with domains where some machinery already existed and the question was
how much of it fitted. cda had nothing at all — no account, no agreement, no
donee, no book value — so every one of the 13 read identically red
("produced 0/N") and looked like 13 independent problems. They were one problem.
Once the noun existed, twelve of the thirteen were consequences of it rather
than separate builds.

**The generalisation, which is the useful half:** a domain where every control
fails for the SAME reason is cheap, and a domain where they fail for different
reasons is expensive. The red-line text already carries this signal and nobody
was reading it that way. cda's 13 reds had 1 distinct blocked_on shape; the
remaining 179 have dozens. Sizing should read the DISTRIBUTION of red reasons,
not the count of red rows. That is a better estimator than either the namespace
tally (§5g) or the control count.

CDA-10 stays red and is correctly scoped out (vendor lifecycle diligence).

**§721.3(b)(2) is a CONJUNCTION, so there is one gate and not four checks.**
Four controls (CDA-01 adoption, CDA-03 segregation, CDA-05 clauses A–D, CDA-06
the 5% cap) each declare `cda.funding_gate_evaluated`, which invites four
independent checks at four call sites. Failing any one forfeits Part 703 relief
for the whole account, so `evaluateFundingGate` evaluates all of them on every
request and returns each verdict separately. The refusal names every condition
that failed, not the first — the same defect OQ-19 records against `runGate`,
avoided here rather than reproduced.

**Fourth instance of the ordering-assumption class (§5g), caught by design.**
§721.3(b)(2)(iii) caps AGGREGATE book value. The natural implementation tests
the aggregate, records the funding, and moves on — which permits every breach
exactly once, because the amount under test is not in the number being tested.
The projected aggregate is `current + requested`, computed before any write.
The same shape appears in CDA-07: concentration is measured AFTER the proposed
trade, or the first breach of every overlay is permitted. First time this class
was anticipated instead of found by a failing drill.

**Two defects the NEGATIVE tests found, both invisible on the happy path:**

1. **Wall-clock-derived primary keys.** Five writers built ids from
   `Date.now()`. Under the drill's frozen clock every distribution in one run
   collided, so `ignoreDuplicates` silently dropped four of five events and
   CDA-12 read red for a reason that had nothing to do with CDA-12. In
   production the collision is rarer but not impossible, and the failure is
   worse: a dropped evidence row for a real distribution. The house convention
   is `crypto.randomUUID()`; these were the deviation.
2. **A shortfall alert that fired on window CREATION.** Every five-year window
   opens at 0% coverage, so alerting on "below 51%" made the alert mean "a
   window exists". The condition is now a shortfall that is either MEASURED
   (giving has happened, so the ratio says something) or RUNNING OUT (inside
   the final year). Both halves are load-bearing: the second is what catches a
   window where nobody ever distributed at all.

**Harness gap, third strike on column defaults.** `fake_db` applied only
`created_at`/`updated_at`, so a `cda` row inserted without `book_value_cents`
read back `undefined` where Postgres gives `0`, and an aggregate over book
value summed to NaN in the double. Exactly the shape that let CG-VEL-01 report
a pass. Now a declared `COLUMN_DEFAULTS` map, deliberately listing only the
defaults a writer READS BACK — a full copy of the schema would drift silently.

**Anti-vacuity: 12 mutations, 12 caught.** Each load-bearing rule was broken in
turn (gate always permits, cap tests the current aggregate, dual control
ignores self-approval, the affiliate blocklist never matches, vendor
qualification always true, in-kind needs no determination, the shortfall never
raises, an expired policy does not block, any label files the packet, any
clause subset validates, a cure needs no actual reduction, an unassessed
overlay clears a trade) and the suite went red for every one.

### §5h — INSTRUMENT CAVEAT: `required_inputs` grading is OBJECT-granular

`controls_test_run.ts` grades a declared input `obj.field` by asking whether any
row was written to a table named `obj`. It never looks at `field`.

For most domains this is a weak but real constraint. For cda it very nearly
collapsed to nothing: all ~60 declared inputs are `cda.*`, so they resolve to
ONE object, and before `cda` was added to `knownTables` every one of them
graded as *unverifiable* — meaning all 13 controls could have gone green on
produced events alone. Adding the table binds "a cda row must exist" and no
more.

**This is a ceiling on what a green means, and it is not specific to cda.** Any
domain whose corpus names its inputs under a single namespace gets the same
collapse.

### §5h RESOLVED — column-level grading, and the one row it flipped

Done as its own change, before any further domain was built, so that nothing
after it is graded under the weaker instrument.

An input `obj.field` now counts as supplied when the run wrote a row in an
object named `obj` AND the datum appears — as a populated column, or as a key
in an emitted event payload. Both sides reduce to TOKEN SETS and the test is
containment, with the column's tokens including its table's. So
`cda.vendor_registration_status` is satisfied by `cda_vendor.registration_status`
and by nothing accidental: every word the corpus used has to be accounted for.

**Why token containment and not string equality.** The first version compared
names literally and flipped 16 rows. Inspecting them showed two different
causes wearing one label: controls where the datum genuinely was not supplied,
and controls where the corpus and the schema simply name the same fact
differently (`policy_expiry_at` vs `expires_at`, `member_notice_template` vs
`member_notices`). Failing the second kind grades the CORPUS, not the run — the
mistake OQ-06 and OQ-22 already record about trigger vocabulary. Payload keys
count because several declared inputs are COMPUTED (`cda.aggregate_book_value`,
`cash.overshort.amount`) and are legitimately carried on the evidence rather
than stored; requiring a column would fail a control for computing the thing
correctly. One normalisation only: a trailing plural is stripped. Anything
beyond that starts inventing synonyms.

**Result: 46 -> 45. Exactly one row flipped and stayed flipped.**

| row | why | verdict |
|---|---|---|
| `collections:CO-11` | `incident.description`, `incident.data_scope`, `incident.detection_source` are never written by the incident writer; `incident.collections` names nothing interpretable | **was never green** |

The other fifteen initial flips resolved into work rather than losses, and that
work is the actual value of the change:

- **Four cda columns were renamed to the corpus's vocabulary**
  (`agreement_gaap_clause`, `policy_expiry_at`, …). The catalogue names these
  fields and the grader now checks them by name, so a schema that renames the
  specification's terms turns every check into a translation exercise.
- **CDA-07 was conflating two declared inputs.** `cda.overlay_limits` (Board-set
  risk caps) and `cda.strategy_limits` (clause B of the written agreement) are
  different sources of authority and the corpus names them separately. The
  pre-trade check consulted only the overlays — i.e. it was not checking the
  agreement it is bound by. Found only because the stricter grader asked for
  `strategy_limits` by name.
- **Three declared inputs were being accepted and discarded**:
  `cda.vendor_issue_details` (an escalation carrying only a reason code),
  `cda.total_return_cumulative` (a distribution event with no denominator, so
  the 51% rule could not be checked after the fact), and
  `incident.notice_template_id` (the notice's display name but not the id, so a
  notice could not be tied to an approved template version).

**Do not read 45 < 46 as a regression.** It is the same system measured more
honestly, plus four real defects fixed. The headline number is now weakly
column-bound rather than object-bound; it is still not a proof that each field
held the RIGHT value, and that ceiling remains.

### The fourth-instance guard on `fake_db` column defaults

Three sessions had lost time to the same gap and each fix was another hand-written
column. `COLUMN_DEFAULTS` is now PARSED from `supabase/migrations/*.sql` at load,
so a column added with a default is modelled the moment the migration exists.
Function-call defaults (`now()`, `gen_random_uuid()`) are deliberately excluded —
they are not constants and pretending otherwise is a different lie. If the
migrations cannot be read the map is empty and the double behaves exactly as
before, so the guard degrades rather than throwing inside unrelated tests.

**The parser was wrong on its first pass, in the way this file is always wrong.**
The value pattern captured "everything up to the next comma", and an inline
`default 0 check ("x" >= 0)` contains no comma — so every column declared with a
trailing CHECK silently produced no default, including the very
`book_value_cents` that motivated the change. Now the value is a bounded token.

**A blanket rename broke an unrelated control, and only the artifact caught it.**
Applying the `expires_at -> policy_expiry_at` rename with a global
search-and-replace also rewrote the retention firer's `retention_expires_at`,
so the disposal sweep matched nothing and **nine replicas of SC-02 went red**
for a reason that had nothing to do with SC-02 or with the grading change.
Nothing in the unit suite noticed — 474 tests stayed green throughout. The
control artifact is the only instrument in this repo that would have caught it.
