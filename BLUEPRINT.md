# BLUEPRINT — loose ends, open questions, and what is actually true

> **Finished. 195 of 225 in-scope controls green, 860 tests, 30 red on purpose.**
> **→ Read [HANDOFF.md](HANDOFF.md) first** — the plain-language version for
> Lorenzo: the number and what it means, the prediction record including the two
> misses, the 30 remaining with who unblocks each, and the caveats (nothing has
> run against a real database; OFAC screening is scaffolding, not detection).
> This file is the working record behind it.

## ⚠ READ FIRST: two mistakes anyone re-deriving this analysis will make

**1. A control is blocked by everything it DECLARES — its trigger, its produced
events, AND its required inputs. Scanning only one of the three understates the
dependency set.**

Produced events is the obvious thing to scan, and it is the one that misleads. I
scanned it alone before building lending and concluded `core.loan` was
irrelevant to that policy. It was not: `loan.ltv` is a required input of LP-03
and LP-06, and `loan.booking.requested` is LP-09's trigger. Three controls
mis-classified as unblocked, in a domain I had just measured carefully.

**2. `predicted ≈ reds − entity-blocked`.** Not namespace count, not the
concentration ratio, not the number of sub-domains. The only variable that has
predicted anything is *how many controls depend on a noun that does not exist and
must not be fabricated*. Exact on four artifacts (see the table under lending).

---

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

## ⚑ WHAT THIS EXERCISE ACTUALLY CAUGHT

**Two live defects that ordinary development would have shipped.** Both are the
same story: a control whose entire purpose is to PREVENT something, rendered
inert while every test passed. Neither was found by testing the control — both
came out of chasing a general weakness somewhere else.

### 1. Records could be destroyed under an active litigation hold

`core.record.legal_hold_id` was a single column. Placing a SECOND hold over a
record overwrote the first; releasing the second cleared the hold flag while the
first was still live, and the record became disposal-eligible **under an active
legal hold. Destroying records under hold is spoliation** — a sanctionable
litigation failure, not a compliance finding.

Found by auditing the standing-state model after an unrelated privacy finding.
Fixed by deriving the flag from a SET (`core.record_hold`) rather than a pointer.

### 2. The CDA policy could never lapse, so the funding gate never closed

`cda_policy` and `cash_policy` computed expiry as `adopted_at + 12 months`, but
nothing asserted the absolute date. A policy adopted eleven months ago recorded
an expiry twelve months from TODAY — so it could never expire. **CDA-01's entire
control is "if the policy lapses, all CDA actions are blocked."** It blocked
nothing, and reported success.

Found by chasing a mutation that survived on an unrelated complaints test, which
revealed that a test asserting a DURATION cannot see a clock that re-anchors.

### Why both were invisible

| | legal hold | policy expiry |
|---|---|---|
| tests passing at the time | all | all |
| what the test asserted | that release clears the flag (it did) | that the gap was twelve months (it was) |
| what nobody asserted | that a SURVIVING hold keeps it set | that the anchor was the ADOPTION date |
| how it was found | auditing a model shape across subsystems | a surviving mutation on a different control |

Neither is exotic. Both are the kind of defect that reaches production, passes
review, and is discovered by an examiner or a plaintiff.

## A TEST CAN DOCUMENT A BELIEF NOBODY VERIFIED

Distinct from the four instrument bugs, and probably more common in real
codebases. The legal-hold test did not merely fail to catch the bug — **it
asserted the buggy behaviour, and carried the same false comment as the code:**

> *"Clear the flag only on records THIS hold set. A record under two concurrent
> holds must stay held when one is released."*

That comment appeared in both the production code and its test. Both were
written by someone who believed it. Neither verified it, and the test's
assertion — that exactly one record update happens on release — was the buggy
behaviour written down as the specification.

**An instrument bug is a check that cannot fail. This is a check that faithfully
enforces a belief.** It is worse in one way: the instrument bug leaves no
evidence, whereas this leaves a confident comment that discourages the next
person from looking. When a comment states a guarantee, the test beside it must
exercise the case the guarantee is about — here, a second hold, which no test
ever placed.

## ⚑ THE LEVER: 22 ABANDONED TABLES BLOCK 36 OF THE REMAINING REDS

**Read this before the sizing analysis below, which predates it.**

Of 98 `core` tables, **24 are never written by production code and 22 are never
read either**. They are not scaffolding. They are controls someone designed,
modelled in the schema, and then abandoned — and they are declared as required
inputs by **36 of the remaining in-scope red controls**.

```
loan        8 controls      dispute     3      training   2
user        6               insider     3      originator 2
trade       6               risk        3      address    2
complaint   4
```

**This is the closest thing to a lever this corpus has produced,** because a
table that already exists is a fundamentally cheaper blocker than a missing
entity: the schema design was done, the noun is modelled, only the writer is
absent. Compare the two extremes — `cda` needed a noun invented from nothing and
took a full artifact; `core.loan` needs a writer against a table that is already
shaped.

### This SUPERSEDES the "no handful of nouns" conclusion below

§5e and the set-cover analysis conclude there is no large lever: the best single
namespace frees 4 controls, the eighteen best free 45 of 180. **That measurement
was taken before the third hole shape was known**, and it counts every namespace
as equally expensive. It is still arithmetically correct and still the right
answer to the question it asked — *how many controls does one namespace free?* —
but it is the wrong input to a build-order decision, because it treats
"`core.loan` needs a writer" and "`employee` does not exist" as the same cost.

**Current guidance: rank by (controls freed ÷ cost), where cost is
entity > satellite ≈ abandoned-table.** The older numbers stand as measurement;
this is the one to plan against.

**Two cautions.** `user`, `training` and `insider` are organisational and the
standing rule still applies — a table existing does not make fabricating its
contents honest. And an abandoned table's SHAPE was designed against an intent
nobody wrote down; read it before trusting it to fit the control that now needs
it.

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

The harness is `core/supabase/tests/e2e/compliance_e2e.sh` (254 `check` assertions
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
  (`core/supabase/functions/api/transfers.ts`) and `INSTANCE_SCOPED_TABLES` in
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

> **DO NOT ANCHOR ON 13.** cda was a happy accident: a self-contained subsystem
> where every control failed for the same reason, so one noun freed all of them.
> The estimator below was run afterwards against the remaining 180 reds and says
> the rest of the project does **not** look like this. The best single namespace
> frees **4** controls; the eighteen best together free **45 of 180**. Plan on
> roughly **6 per artifact**, not 13. 13-of-13 is the outlier and it is exactly
> the number someone reading this file will otherwise take as the run rate.

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
column. `COLUMN_DEFAULTS` is now PARSED from `core/supabase/migrations/*.sql` at load,
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


## STANDING RULE: do not fabricate organisational entities to turn controls green

Adopted while sizing cash, and it binds going forward.

Several red controls are waiting on `employee`, `hr`, `exam` — entities the core
does not have and that describe PEOPLE and organisational process rather than
money, members, or the institution's position. Building them would turn controls
green by inventing the very facts the control exists to check. `employee.separated`
is not an event this system observes; asserting it is the same class of error as
backfilling `account.entity_id` with a guessed owner.

**A control that stays red naming the entity it needs is doing its job.** The red
line is the finding. If honouring this rule means cash lands at 6 of 10 rather
than 10 of 10, **6 is the honest number** and the four reds are more informative
than four manufactured greens would be.

This is distinct from the scope decision in `control-scope.json`. Those controls
are marked OUT because they are discharged by people and paperwork. These are
marked IN — they are real technical controls — and they are RED because a noun
they depend on legitimately does not exist yet. Do not resolve the tension by
rescoping them; wrongly scoping out is invisible (§5g).

## THE NINE SC-02 REPLICAS — why the control layer earns its keep

**The single strongest piece of evidence that this approach catches something
the ordinary test suite cannot.** Recorded here rather than as a footnote,
because anyone evaluating whether the control artifact was worth building should
find this first.

While renaming a cda column to match the corpus vocabulary, a global
search-and-replace of `expires_at -> policy_expiry_at` also rewrote
`retention_expires_at` in the retention firer. The disposal sweep filters
`.lt("retention_expires_at", now)`, so it matched nothing, emitted no
`disposal.scheduled`, and **nine replicas of SC-02 — the shared record-retention
lifecycle control, referenced by nine different policies — silently went red.**

The part that matters:

> **All 474 hermetic unit tests passed, before and after, without a flicker.**

They passed because they were never wrong. Every unit test asserts on a writer
it calls directly with data it supplies itself; none of them route through the
firer that got corrupted. The break lived precisely in the seam between "the
writer is correct" and "the control can actually be made to fire" — and that
seam is the entire subject of the control layer.

Three properties made it catchable at all, and all three are worth preserving:

1. **The artifact is checked in and diffed.** The regression was visible as nine
   rows changing status, not as a failure someone had to be watching for.
2. **It is regenerated from a frozen clock and a seeded RNG,** so a diff means a
   behaviour change and never noise.
3. **`--check` fails the build on green -> red,** so this cannot be committed
   past silently even by someone who is not reading the numbers.

The generalisation: **a unit suite proves the writers are right; only the control
layer proves they are still reachable.** Every prior instance of the
ordering-assumption class (§5g) has the same shape — the code is correct and the
path to it is not.
### cash operations (CP-*) — 7 of 10 green, predicted 6 (refined to 8 pre-build)

**First clean test of the red-reason-distribution estimator, and it worked.**
The prediction was made BEFORE building and recorded in two stages, both
falsifiable:

| method | number | actual |
|---|---:|---:|
| old (namespace tally) | 4 | 7 |
| estimator, namespace-set concentration | **6** | **7** |
| estimator + reading each control's expected EVENTS | **8** | **7** |

cash's signature was the opposite of cda's: 10 reds, **9 distinct namespace-sets,
13 namespaces**, and only 2 controls freed by `cash` alone. Ratio 1.11 against
cda's 13.00. The estimator called it scattered and it was.

**The refinement worth keeping: not all namespaces are equal.** The set-cover
counts `gl`, `treasury`, `records_package` and `cmir` as blockers alongside
`employee` and `hr`, and they are not the same kind of thing. The first four are
SATELLITES — a handful of events emitted by the domain's own writers, free once
the domain exists. The last two are ENTITIES — nouns that must exist and be
populated. Reading the expected-event list to separate them took the estimate
from 6 to 8, and 7 landed between the two. **Count entity namespaces, discount
satellite ones.**

**The three reds are the standing rule working, not a shortfall:**

| control | needs | why it stays red |
|---|---|---|
| CP-05 | `employee.separated`, `employee.id` | custody revocation on separation. No employee entity; inventing one fabricates personnel facts |
| CP-07 | `hr.coaching.recorded` | 6 of its 7 events ARE emitted — posting, investigation clock, cumulative pattern, BSA alert, resolution, monthly report. The seventh is an HR act |
| CP-12 | `training.coverage_pct` | **`core.training` EXISTS in the schema and nothing writes to it.** A real finding: a table added for an obligation nobody wired up |

CP-12 is the interesting one. It produces all eight declared events and fails
only on an input whose table is already in the core schema with no writer. That
is not the same as a missing entity and it is worth its own line in the backlog.

**FIFTH ORDERING-ASSUMPTION INSTANCE, and the first that is a data-modelling
question rather than a sort key.** A cash limit is EFFECTIVE-DATED. The schedule
in force is the one with the greatest `effective_at` not in the future — not the
newest row. Two silent failures the naive version gives:

- a schedule entered today to take effect next quarter starts governing today,
  so a planned limit increase applies months early;
- a backdated correction loses to whichever row was typed first, because
  insertion order and effective order are different orderings entirely.

Both are tested directly. Every read of a limit goes through `limitInForce()` so
there is exactly one place to be wrong. An expired deviation is excluded there
too, which is what makes a seasonal deviation actually seasonal rather than a
permanent limit change wearing an exception's name.

**Two controls found their real subject while being built:**

- **CP-07's control is the CUMULATIVE, not the event.** A single $20 short is
  noise; the same custodian $20 short eleven times is the pattern. A per-event
  threshold cannot see it, and the cumulative must be **per custodian** — three
  different people at $90 each is not one $270 pattern. Both directions tested.
- **CP-08's control is the EXPECTED seal, recorded at dispatch.** Storing only
  the seal found on receipt makes a mismatch undetectable, which is the entire
  risk. A mismatch is not a discrepancy to note: it declares an incident through
  the same table the incident lifecycle uses, so the 72-hour NCUA determination
  machinery applies unchanged.

**16 mutations, 15 caught on the first pass. The survivor was a bad test of
mine, not permissive code.** The sweep-starvation assertion compared
`updated_at` to itself and then asserted `!== undefined` — true of every row the
sweep never looked at. It survived the mutation that made the sweep skip
un-escalated rows, i.e. the exact defect it was written to catch. Rewritten to
stamp a sentinel and assert no row still carries it; the mutation is now caught.
**Fourth time an instrument rather than the code has been the thing at fault.**

## THE THIRD SHAPE OF HOLE — a table with no writer

Three distinct shapes have now been found by building controls against the
schema, and they are worth naming together because each was found by accident
and each is cheap to sweep for deliberately:

| shape | example | how it hides |
|---|---|---|
| **verbs without a noun** | `cards.ts` had authorize/capture/expire/reverse and no way to CREATE a card | the module looks complete; every verb is present |
| **a noun without its trigger** (the same trap, other direction) | an access register with no `employee.separated` — it can grant and never revoke | the table looks like access management; the half that never fires is invisible |
| **a noun with no verbs** | `cda` — 13 controls, no account, no agreement, no donee | every control fails identically, so it reads as 13 problems |
| **a table with no writer** | `core.training` exists in the schema; nothing has ever written to it | the schema looks finished; the control fails on an input, not on a trigger |

**The pair worth stating together: a HALF-BUILT subsystem is worse than a
missing one.** A missing subsystem leaves a red control, which is visible and
gets counted. A subsystem with its nouns but not its triggers — or its triggers
but not its nouns — leaves a plausible-looking table that nobody re-examines,
and the control it half-implements reads as done. `cards.ts` had every verb and
no way to create a card; an access register would have had every grant and no
way to revoke. Same failure, opposite direction, and both are invisible in a way
"we have not built that yet" never is.

**Practical rule: if a subsystem cannot complete its own loop — create AND
destroy, grant AND revoke, open AND close — do not build the half.** Leave the
control red and let the red line name what is missing.

### Sweep result: 22 abandoned tables, blocking 36 in-scope red controls

Of 98 `core` tables, **24 are never written by production code and 22 are never
read either.** Those 22 are not scaffolding — they are controls someone intended
and abandoned, and they are declared as required inputs by **36 of the 173
remaining in-scope reds** (21%).

```
loan        8 controls      dispute     3      training   2
user        6               insider     3      originator 2
trade       6               risk        3      address    2
complaint   4
```

Plus `change`, `coi`, `document`, `fbo_position`, `filing`, `finding`,
`handover`, `inbound_payment`, `indemnification`, `instance`, `provider_result`,
`task` — declared by nothing currently in scope.

**Why this matters to the projection.** A table that already exists is a
*cheaper* blocker than a missing entity: the schema design was done, the noun is
modelled, only the writer is absent. So the remaining 173 split three ways
rather than two — missing entity (expensive, and sometimes refused outright),
**abandoned table (a writer away)**, and satellite events (free with the domain).
The estimator should treat an abandoned-table dependency as closer to a
satellite than to a missing entity.

**Two cautions.** First, `user`, `training` and `insider` are organisational and
the standing rule still applies — the table existing does not make fabricating
its contents honest. Second, an abandoned table's *shape* was designed against
an intent nobody recorded; it may not fit the control that now needs it, and it
should be read before it is trusted.

## THE FOUR INSTRUMENT FAILURES — one class, one mitigation

Recorded together because they have been mentioned separately four times and
nobody reading four scattered notes would see that they are the same failure.

| # | instrument | what it did | what it hid |
|---|---|---|---|
| 1 | `fake_db` column defaults | `created_at` was `undefined`, not `now()` | CG-VEL-01 could not fire **at all**, and the drill reported PASS |
| 2 | `fake_db` `.lt()` | unsupported builder method returned `undefined` | a sweep silently matched nothing |
| 3 | `fake_db` `.select()` chaining | upsert-then-select returned `undefined` | production code was contorted to work around the double |
| 4 | a sweep-starvation assertion | compared `updated_at` to itself, then asserted `!== undefined` | survived the exact mutation it was written to catch |

**The class:** *the check was written in the shape of a check without actually
constraining anything.* Every one of them looked right in review. Every one of
them passed. None of them could have failed.

**The mitigation, identical in all four cases: test the instrument against the
thing it is supposed to catch, before trusting it.** Concretely —

- a test double: call a method it does NOT support and confirm it throws (this
  is how the strict-proxy guard was found to be dead code on its first version);
- an assertion: mutate the code it guards and confirm the assertion fails;
- a grader: feed it a case that should score zero and confirm it does.

`fake_db` now throws on unsupported methods and derives its defaults from the
migrations, which closes 1–3 structurally. Number 4 has no structural fix — it
is why every artifact in this project ends with a mutation sweep, and why a
mutation SURVIVING is now treated as a finding about the test rather than a
tolerable gap.

### record-retention (RR-*) — 10 of 11 in-domain green, predicted 9

Plus **2 spillover greens** in other policies (`internal-controls:IC-08`,
`truth-in-savings:TIS-09`), so 52 -> 64 overall. RR-05 was already green.

**A THIRD DOMAIN SHAPE, and the estimator needed it.** The crude concentration
ratio scored this **1.00** — maximally scattered, identical to `lending` — and
that reading was wrong. Ten controls needing eleven namespaces, and every one of
the eleven is a SATELLITE of a noun that already exists, is populated, and whose
lifecycle already runs. Nothing here needed a new entity.

| shape | signature | example | outcome |
|---|---|---|---|
| concentrated | few namespace-sets, noun absent | cda 13 reds / 1 set | 13/13 |
| scattered | many sets, several are ENTITIES | cash 10 / 9 sets, 3 entity blockers | 7/10 |
| **mature subsystem** | many sets, all SATELLITES of an existing noun | records 10 / 10 sets, 0 entities | 10/11 |

**The rule this adds:** the ratio alone cannot separate the second and third
shapes — they look identical. What separates them is asking, of each namespace,
*is there already a populated table this hangs off?* Records and cash both
scored ~1.00 and landed at 10/11 and 7/10 because cash's namespaces included
`employee` and `hr` and records' included none.

**Predicted-versus-actual, three artifacts in:**

| artifact | called | predicted | actual |
|---|---|---:|---:|
| cda | concentrated | 5 (old method) | 13/13 |
| cash | scattered, 3 entity blockers | 6 → 8 | 7/10 |
| record-retention | mature subsystem, 0 entity blockers | 9 | 10/11 |

**OQ-10 is now substantially closed.** It recorded that the retention MECHANISM
was complete while only 2 of 9 record classes had writers. The classes were
hardcoded in a TypeScript map, which cannot be amended by the people who own it,
cannot carry a citation, and — the real defect — **cannot record when an
amendment took effect.** `core.retention_schedule_entry` makes Schedule A data,
so a record disposed in 2024 is checkable against the schedule that governed it
in 2024.

**SIXTH ORDERING-ASSUMPTION INSTANCE, sharpest consequence yet.** Taking the
newest schedule entry makes every historical disposal look compliant with a rule
that did not exist when it happened — which is exactly the direction an examiner
tests. A second, subtler variant was caught in the same place: superseding the
prior entry at `now` rather than at the amendment's EFFECTIVE date leaves a gap
with no schedule in force at all. Both are tested directly.

**A surviving mutation found a missing control, not a missing test.** The
"superseded entries stop applying" branch survived being disabled, because
nothing in the system could produce a superseded-with-no-successor state — the
branch was unreachable. That is a real gap: a record class RETIRED from Schedule
A must behave like an unregistered one and refuse to set a clock, rather than
silently keeping the retired period. `retire: true` now produces that state and
the mutation is caught. **First time a mutation survivor turned out to be a
missing capability rather than a weak assertion.** 15 mutations, 14 caught on the
first pass, 15/15 after.

**Two other decisions worth recording:**

- **A permanent record emits `record.disposal_eligible` with `eligible: false`**
  rather than emitting nothing. "No eligibility event" and "explicitly never
  eligible" are different facts and only the second is a control.
- **`records_contact` is a register of ROLES, not of people** — it records that
  a responsibility has a current holder and when it was vacated. Same shape as
  `cash_asset.custodian_user_id`: a pointer, not an entity. That is the line the
  standing rule draws, and a VACANCY is recorded as its own state so it cannot
  look like a role that never existed.


## WHEN A MUTANT SURVIVES, ASK WHICH OF TWO THINGS IS WRONG

Mutation testing has now produced both answers in this project, and the
mechanical reading gives the wrong fix in one of them.

| survivor | the usual reading | what was actually wrong |
|---|---|---|
| cash sweep starvation | strengthen the test | **correct** — the assertion compared `updated_at` to itself and could not fail |
| records `superseded_at` branch | strengthen the test | **wrong** — the branch was UNREACHABLE. No path in the system could produce a superseded-with-no-successor schedule entry |

In the second case, writing a stronger test would have meant constructing the
state by hand — reaching into the table, setting `superseded_at`, then asserting
the reader ignores it. That test would pass, the mutant would die, and the
system would still have **no way for a record class to be retired from Schedule
A**. The green would have been bought by a fixture.

**The rule: when a mutant survives, first ask whether any path can reach the
mutated branch.** If none can, the finding is a missing capability and the fix
is in production code. Only if the state IS reachable is the finding a weak
assertion. Getting this backwards produces exactly the kind of test-shaped
green this project exists to avoid.

Here the correct fix was `retire: true` — a real operation, because a class
removed from Schedule A must refuse to set a clock rather than silently keep
using the retired period. The mutant died as a side effect of building the
control, which is the right order.

### lending underwriting (LP-*) — 13 of 13 green, predicted 9. THE ESTIMATOR UNDER-CALLED.

77 green overall (64 -> 77), 13 new, 0 lost. **The first miss in the optimistic
direction, and it corrects the estimator in a way the three successes did not.**

**What I predicted and why it was wrong.** Lending measured as the widest
surface yet: 13 reds, 25 namespaces, 22 of them with no table at all. I called
it "scattered, roughly double record-retention's surface" and predicted 9. The
namespace COUNT frightened me into discounting, and the count was the wrong
variable — 22 of those namespaces were satellites of `loan_application`, which
already exists. **Zero were entities.**

**Two measurement errors found, both worth more than the prediction:**

1. **The pre-build namespace scan only looked at MISSING PRODUCED EVENTS.** It
   concluded `core.loan` was irrelevant to lending. It was not: `loan.ltv` is a
   required input of LP-03 and LP-06 and `loan.booking.requested` is LP-09's
   trigger. Three controls, not zero. **A control is blocked by everything it
   DECLARES — triggers, produced events AND required inputs — and scanning one
   of the three understates the dependency set.** The abandoned-table count of
   36 was computed over required_inputs and is unaffected; the per-domain
   analysis was not, and is corrected.
2. **Satellite count does not predict difficulty. Entity count does.**

### THE ESTIMATOR, CORRECTED: predicted ≈ reds − entity-blocked

Applied retrospectively to all four artifacts, this is exact:

| artifact | reds | entity-blocked | predicted by the rule | actual | old prediction |
|---|---:|---:|---:|---:|---:|
| cda | 13 | 0 | 13 | **13** | 5 |
| cash | 10 | 3 (`employee`, `hr`, `training`) | 7 | **7** | 6 → 8 |
| record-retention | 10 | 0 | 10 | **10** | 9 |
| lending | 13 | 0 | 13 | **13** | 9 |

Four for four. The variable that matters is **how many controls depend on a noun
that does not exist and must not be fabricated** — not the namespace count, not
the concentration ratio, and not the number of distinct sub-domains. Everything
else is work, and work gets done.

**What still needs judgment:** deciding whether a namespace is an entity or a
satellite. `insider` looked like an entity (people) and turned out to be a
ROLE REGISTER — a membership question, "is this borrower a covered person",
which is answerable without modelling employment. `employee` did not, because
`employee.separated` is an HR lifecycle event this system does not observe. That
distinction is the whole estimate now, and it is the one thing the numbers
cannot make for you.

**Also closed here:** `core.loan` is the first of the 22 abandoned tables to get
a writer. It was blocked on nothing except somebody writing it, which is the
whole point of that finding.

**25 mutations, 25 caught on the first pass** — the first artifact with no
survivors. Notable ones: the appraiser deciding the reconsideration of their own
value, a denied exception releasing closing, an unpublished rate sheet pricing a
loan, an HMDA LAR submitted before QC, and an expired insider registration still
flagging.

**One control corrected an existing writer.** LP-11's OFAC gate emitted only the
ESCALATION, so a clean screen left no evidence it had run — "screened and clear"
and "never screened" produced identical event logs. That is the exact defect the
always-on OFAC floor exists to prevent on the payment rails, reproduced on the
lending rail. `loan_party.ofac.screened` / `.cleared` / `.ofac_potential_match`
are now emitted on every screen.



## ⚑ WHERE THIS ENDS — the projection over everything still red

Run once, over all 133 remaining in-scope reds, using the rule that has called
five artifacts exactly. Regenerate with `python3 scripts/project_remaining.py`.

| | controls | what it means |
|---|---:|---|
| **green today** | **96** | passing |
| **reachable** | **99** | buildable. Work, not a decision. |
| **not engineering work** | **30** | see the separate section below |

> ### The headline: **195 of 225 are reachable with no decision from anyone.**
> **30 are not**, and they will not go green by writing more code. They have
> been moved OUT of the backlog into "§X — NOT ENGINEERING WORK" so they stop
> reading as things nobody got to.
>
> **CORRECTED from 197 / 28.** The first run scanned only each control's CURRENT
> failure reason, so a control failing on missing produced EVENTS had not yet had
> its inputs graded and a person-blocking INPUT stayed invisible. Six controls
> were mis-bucketed; on inspection two genuinely move
> (`e-commerce:EC-02` needs `employee.terminated`,
> `director-fiduciary-duties:DF-05` needs a disinterested board quorum) and four
> do not — those four are recorded as `NOT_BLOCKING` in the script with the
> reasoning, because they LOOK person/outside by name and are not.
>
> **The real lesson is narrower and more useful than "scan all three".** That
> rule was already written down in READ FIRST when this recurred, so writing it
> down did not prevent it. The actual defect was an assumption baked into the
> script: **that a control's CURRENT failure is its only failure.** Grading is
> LAZY — the harness reports the first thing that fails, so a control blocked on
> missing events has not had its inputs graded at all. Fix the events and a new
> blocker appears that was invisible a moment earlier.
>
> **That assumption is now fixed IN `scripts/project_remaining.py`, not in my
> habit** — the script scans everything the control declares regardless of what
> it currently reports, and the four look-alike exceptions are data
> (`NOT_BLOCKING`) rather than judgment applied at read time. Anyone re-running
> it gets the corrected behaviour without knowing this happened. That is the
> difference between a lesson and a fix, and the first attempt was only a lesson.

The remaining build is roughly seven more artifacts at the observed rate.

> ### ⚠ THE 197 DEPENDS ON THREE JUDGMENT CALLS
>
> It is not a measurement. It rests on classifying `core.user`, `core.insider`
> and `records_contact` as SATELLITES (role registers, answerable without
> modelling employment) rather than as person-entities. **If someone overrules
> the `user`-as-satellite call, the 197 moves** — IP-14 and the access-management
> group go with it, and `investment:IP-14` would retroactively become
> person-blocked rather than green.
>
> The rule those calls were made under, and the reference pair, are stated in
> full under "THE CLASSIFICATION RULE" below. It is written to be disagreed
> with; a number resting on three judgment calls should say so where the number
> appears.

### THE CLASSIFICATION RULE, and the reference pair everything rests on

> **`user.role` is REACHABLE. `employee.separated` is NOT.**
>
> A ROLE or SYSTEM-PRINCIPAL question — *what duties does this actor hold, is
> this borrower a covered person, who is the records officer* — is answerable
> without modelling employment. The system already has `api_token` with roles;
> a register keyed by actor reference is more of the same.
>
> An HR LIFECYCLE EVENT — *this person was hired, separated, coached, trained* —
> is a fact about a human being's employment that the core has no way to
> observe. Recording one is inventing it.

The three calls made on this basis, all worth auditing: `core.user` (satellite —
IP-14 needs the role, not the person), `core.insider` (satellite — Reg O asks
"is this borrower a covered person", a membership question), `records_contact`
(satellite — a register of roles with current holders). `employee`, `hr` and
`training` fell the other way.

## THE CLASS: absence of a finding must itself be recorded

Third instance of one idea, now named so it can be checked for deliberately.

A control that writes evidence only when it FIRES makes "checked and clean"
indistinguishable from "never checked". The event log is identical in both
cases, so the control cannot be shown to have run — and the failure is silent
in the direction that flatters the institution.

| where | what it looked like | fix |
|---|---|---|
| **OFAC floor** (early) | screening wrote a `control_result` only on a hit | writes on every run, including clean passes |
| **OQ-19 gate short-circuit** | `runGate` returns on the first blocking control, so a transaction that is both over-velocity and unaffordable writes ONE result | open — the refusal is right, the evidence cannot distinguish "NSF ran and passed" from "NSF never ran" |
| **LP-11 loan-party OFAC** | the gate emitted only `loan_party.ofac.escalated`, so a clean screen left nothing behind | now emits `.screened` on every screen, then `.cleared` or `.ofac_potential_match` |

**The check to run on any new control: if it finds nothing, what row exists
afterwards?** If the answer is "none", the control is unfalsifiable. Related but
distinct from the unassessed-verdict rule (an unset threshold reports NO verdict
rather than "not breached") — that one is about a check nobody configured, this
one is about a check that ran and found nothing.

Instances of the same shape already handled elsewhere, for the pattern-match:
`cda.evidence_packet.incomplete` (a packet that did not file), the CDA funding
gate recording refusals, `cash_load` recording blocked loads, `record.disposal_eligible`
emitted with `eligible: false` for permanent records, and LP-14 recording
"reviewed and NOT an insider".

### investment portfolio (IP-*) — 15 of 15 green, predicted 15

77 -> 92. Fifth artifact, and the corrected estimator called it exactly.

**This closes the last of BLUEPRINT §0's named missing entities.** That section
lists "a securities book (`position.booked`, `trade.limit.blocked`)" among the
nouns no primitive substitutes for. It now exists. `core.trade`, `core.document`
and `core.user` — three more of the 22 abandoned tables — got their first
writers here.

**Prediction reasoning, recorded before building:** 15 reds, ~21 namespaces,
**0 entity-blocked**. Every namespace was a financial object (`position`,
`security`, `repo`, `cfp`, `limit_set`) or a satellite of one. The one that
needed a judgment call was `user`: classified as SATELLITE because IP-14 needs
the ROLE an actor holds, which is a system-principal question, not employment.
Same line `records_contact` and `core.insider` sit on. Had IP-14 required
`employee.hired` it would have been entity-blocked and the prediction 14.

**A trade and a position are different nouns, and the controls prove it.**
IP-07's concentration limit attaches to the POSITION; IP-14's segregation of
duties attaches to the TRADE. Collapsing them — which is tempting, since one
produces the other — would put the limit check on the wrong object and make
"how much do we hold" unanswerable after a sell.

**Segregation of duties here is THREE roles, not two.** Execution, confirmation,
settlement. Two-way separation lets whoever executed a trade also reconcile it,
which is precisely the case that hides an unauthorised trade: the counterparty
confirmation is the only independent evidence that the trade the book records is
the trade the counterparty thinks happened. Fourth distinct four-eyes shape in
the repo, and the first that needed a third role.

**Third instance of the projected-not-current rule** (after the CDA 5% cap and
the cash device limit): concentration is measured on `current + this trade`.
Testing the current holding and then booking permits every first breach.

**26 mutations, 25 caught first pass.** The survivor was a weak test of mine, not
permissive code — the repo counterparty test used a repo with NO counterparty,
which hits the "missing" branch and never exercises the "exists but unapproved"
one. Reachable state, so the fix was a stronger test (per the rule in "when a
mutant survives"). Now caught.

### Where the abandoned-table lever stands

Five of the 22 now have writers: `loan`, `trade`, `document`, `user`, and
`insider`. That is 4 domains' worth of controls unblocked by tables whose schema
design was already done.


## WHEN THE EXISTING PRIMITIVE IS NOT ENOUGH: three-person separation

`core.payment_approval` implements four-eyes — a second person must approve what
a first person initiated. It is correct for wires (EPS-06), CDA distributions,
audit plans, loan exceptions and pricing exceptions. **It is insufficient for a
securities trade, and that is the dangerous kind of insufficiency:** the
primitive fits well enough that someone will reuse it and believe they are done.

A trade has THREE steps — execution, confirmation, settlement — and two-way
separation only guarantees that the person who executed did not *approve*. It
leaves them free to CONFIRM and RECONCILE their own trade, which is precisely
how an unauthorised trade stays hidden: the counterparty confirmation is the
only independent evidence that the trade on our books is the trade the
counterparty thinks happened, and a trader who confirms their own trade has
removed it.

So `SOD_INCOMPATIBLE` in `investment.ts` names PAIRS of steps one actor may not
hold, versioned (`SOD_MATRIX_VERSION`) so a violation can be checked against the
matrix in force rather than today's. `payment_approval` is deliberately not used.

**The general warning: a generalisation that is right in most places and
insufficient in one specific place is more dangerous than one that obviously
does not fit.** The obvious misfit gets noticed. This one would not have.


## §5i — "Does this already exist?" is now a real question

Twelve artifacts in, the codebase is large enough that the answer is no longer
obvious, and I got it wrong once: I wrote a `core.adverse_action_notice`, a
`core.pricing_exception` and a `core.hmda_submission` before noticing all three
already existed. I caught it by accident, reading a grep output for something
else.

**The failure mode is not wasted work.** It is duplicated capability that
diverges. Two adverse-action notice writers is worse than one incomplete one:
both work on the day they are written, and then a Reg B amendment lands on one
of them. The half-built subsystem the ACCESS artifact warned about is the same
hazard from a different direction — there, half a subsystem; here, two halves
that each believe they are whole.

**Standing step, not vigilance.** `scripts/exists_check.py <policy>` greps the
migrations and the API modules for every noun in the declared inputs and
produced events of that policy's red controls, and prints what already carries
it. Run it BEFORE writing the migration, not after. Noticing is not a control;
a script that runs every time is.

## §5j — The corpus and the writers name the same fact differently

Second instance now, after the capital one:

| the corpus says | a writer already emitted |
|---|---|
| `capital.pca_category` | `capital.classification.assigned` |
| `pricing.exception.decided` | `loan_pricing.exception.decided` |

**Resolution: emit both. Do not rename.** The internal name already has
consumers — the drill firers, other controls' expected-event lists, and in the
capital case a downstream PCA gate. Renaming it to match the corpus is a silent
break that all 749 tests would pass through, because nothing asserts the name of
an event nobody is currently reading. Adding the corpus name costs one `emit`
call and breaks nothing.

The cost of emit-both is a duplicated row in `core.event` for the same fact. That
is a real cost and it is smaller than the alternative. If it ever becomes a
problem, the fix is a rename WITH a grep of every consumer, not a rename in
place.

## Artifact — truth in savings, member lifecycle, fair lending (TIS/MP/FL)

**Predicted 22 (TIS 7, member 7, fair lending 8). Actual 23** (TIS 8, member 7,
fair lending 8). Eleven for eleven on direction; TIS came in one over because
the E-SIGN consent rows the privacy artifact had already built made TIS-01
reachable without new organisational facts. The two that stayed red are the two
named in advance: **MP-06** (an expulsion is a member vote at a special meeting)
and **MP-07** (an estate claim needs a death certificate). Both name the person
who has to supply the fact. Neither was fabricated to close the gap.

**Structural decision: a disclosure is a delivery, and a delivery is a
SNAPSHOT.** The first pass modelled a delivery as a pointer — "we sent template
X to member Y". That cannot answer the only question TIS actually asks: what APY
did the member SEE. A pointer to a rate configuration that has since moved
proves nothing, and an APY that was wrong at the moment of delivery is the
violation itself. So `disclosure_delivery` freezes the terms it disclosed, and
the APY is DERIVED (`apyBp`) rather than accepted from the caller — a stored APY
that disagrees with its own inputs is precisely the error the control exists to
catch.

**The half-built-subsystem trap, caught mid-build.** I wrote a
`core.adverse_action_notice`, a `core.pricing_exception` and a
`core.hmda_submission` before noticing that all three already existed
(`lending_origination`, `loan_pricing.exception_*`, `hmda_lar`). Two write paths
for one ECOA obligation is exactly how one of them quietly loses the reasons
requirement. All three were backed out; FL-05's missing CONTENT went on as
columns on the notice that already exists, and FL-03's gap turned out to be
vocabulary — the corpus says `pricing.exception.decided`, the writer emitted
`loan_pricing.exception.decided`. Both codes are now emitted rather than the
internal one renamed, because renaming it silently would break its consumers.

**MP-02 was the one the grader was right about.** `card.reissue_request` kept
failing as "not supplied" even after the fact was on the address-change row —
because the grader requires the CARD object to have been touched, and it had
not. That is the control working: MP-02 is an account-takeover pattern, and
recording the request only against the address change means the card subsystem,
the thing that would actually mail a card to the new address, never sees it. The
reissue now writes `core.card` and is **recorded and blocked** rather than
refused outright: a refusal with no row leaves the pattern invisible to the
red-flags review that is supposed to catch it.

**FL-12's anchor moved.** I first hung the Reg B 25-month retention clock off
the options presentation, where it was reachable; it belongs on
`loan_application.decisioned`, because 1002.12(b) runs from FINAL ACTION. A
clock started at the wrong event expires early and legally.

Mutation sweep: 10 mutations, 9 caught on the first pass. The survivor —
GMI `every` → `some`, which makes a single answer count as complete collection —
was a genuine test gap, not a weak control; two tests added, re-run, caught.
749 tests, 155 green of 225 in scope.

## Artifact — e-commerce (EC) + the incident gaps (EC-13, SC-03)

**Predicted 6, landed 6.** Twelve for twelve. EC-13 and SC-03 came with it,
so 155 → 164. exists_check ran first and correctly said `incident` and
`incident_sitrep` already existed — both went in as columns on the incident
that was already there rather than a second incident register.

**Four controls stay red on purpose.** EC-05 (firewalls), EC-06 (TLS), EC-08
(antivirus) and EC-09 (pentest/IDS) are controls over infrastructure this system
does not run and cannot observe. A table accepting `firewall_reviewed: true`
from a caller would turn four controls green while proving nothing about any
firewall. They stay red naming the feed they need.

**⚑ THE DOUBLE WAS LYING ABOUT NULL, AND 17 TESTS HAD LEARNED TO AGREE.**

`assertEquals(row.repudiation_outcome, null)` failed against `undefined`. A
column that is DECLARED but absent from an insert reads **NULL** in Postgres —
never `undefined`. `fake_db` only materialised columns that had a DEFAULT, so
every nullable column without one came back `undefined`.

This is the fifth instance of the same class (`created_at`, `.lt()` on the
sweep, `book_value_cents`, the parser's own greedy-comma bug, now this), and it
is the one with teeth: **17 existing tests asserted `undefined` and passed.**
They were not testing the schema. They were testing the double, and they would
have kept passing if the real column had been dropped. `.is("col", null)`
filters against those rows would silently match nothing.

Fixed generally rather than column-by-column: `parseAllColumns()` reads every
declared column — including `alter table ... add column`, which is how half this
schema arrived — and materialises the absent ones as `null`. The 17 assertions
were corrected to `null`. Note which direction that went: the tests were wrong
and the code was right, so the fix cost nothing but proves the previous 17
assertions were worth less than they looked.

**The mutation sweep earned its keep again.** 10 mutations, 7 caught, 3
survivors — ALL in the incident additions, which had no unit test file at all;
`incidents.ts` was covered only by the drill, and the drill fires the happy
path. The three survivors were external comms with no legal review, an
assessment with no data scope or member impact, and a sev1 sitrep cadence
quietly relaxed to eight hours. Every one is a control failing open. Eight tests
added, re-run, all three caught. **A module with drill coverage and no unit
tests has its refusals untested by construction.**

769 tests, 164 green of 225 in scope.

## Artifact — liquidity (LQ)

**Predicted 6, landed 6.** Thirteen for thirteen. 164 → 170. LQ-06 and LQ-17
need ALCO (a committee); LQ-08 needs model validation, LQ-11 and LQ-13 need a
regulator channel.

### ⚑ THE CAPITAL PREDICTION, CONFIRMED — AND IT PREDATES ITSELF

Several artifacts ago, working on capital, §5c claimed that any domain where a
REGULATOR sets a floor and an INSTITUTION sets a tighter one on top would
produce the same schema shape. Liquidity was the last domain likely to produce
a genuinely new structure. **It produced the same one, unchanged.**

|  | capital | liquidity |
|---|---|---|
| STATUTORY, `not null`, derived | PCA category (12 CFR 702) | §741.12 asset tier |
| INSTITUTIONAL, nullable, paired | Board internal trigger | LAR bands, mismatch limits, survival threshold, headroom floor |
| the pairing constraint | `ck_capital_trigger_verdict` | `ck_lar_band_needs_config`, `ck_survival_verdict_needs_threshold`, `ck_headroom_verdict_needs_floor`, `ck_mismatch_breach_needs_limit` |

**THE SHAPE WAS ALREADY THERE BEFORE THE PREDICTION WAS MADE.** This is the
part that matters, and it is stronger than "the prediction held".

`core.liquidity_report` carries `ck_liquidity_verdict_needs_minimum` — a
verdict column paired to its threshold, both-present-or-both-absent. It was
written during the INVESTMENT artifact, **two artifacts before the capital
prediction existed**, by reasoning arrived at independently and for a different
control. Nobody was looking for the pattern. It reproduced anyway.

A pattern noticed after the fact is a description of what you did. A pattern
that reproduces itself when nobody is watching for it is a description of the
problem. Only the second kind is worth carrying to the next system, and this is
the single strongest piece of evidence in the project that these are the second
kind. See §5k, which the confirmation earned its own heading for.

`assetTier()` is derived and a supplied `asset_tier` is IGNORED — tested
explicitly, because a caller who could assert the tier could assert their way
out of the contingency-funding-plan obligation entirely.

Mutation sweep: 12 mutations, 12 caught, no survivors — the first clean sweep
since the deposits artifact, and the two that matter most (`no bands reads as
adequate`, `caller can assert the statutory tier`) are both caught by tests
written specifically to check the prediction rather than the code.

790 tests, 170 green of 225 in scope.

## Artifact — resolution (RS)

**Predicted 5, landed 5.** Fourteen for fourteen. 170 → 175. RS-03 (safe-mode
transaction controls) stays red: safe mode is a state of the transaction rails,
which this system does not run.

### ⚑ THE LEGAL-HOLD BUG, IN A SECOND PLACE — CAUGHT THIS TIME BEFORE IT SHIPPED

`account.frozen boolean` is the obvious model for a freeze and it is the same
defect that already shipped once here. On legal holds, releasing the second of
two holds cleared `legal_hold_flag` while the first was still live, making
records disposal-eligible under active litigation hold. **The identical shape on
account freezes releases money subject to a court order because an unrelated
fraud hold was lifted.**

So freezes are ROWS in a set, the account's `debits_blocked` is DERIVED from
whatever is still standing, and precedence is explicit. Tested directly: apply a
court order and a fraud hold, release the fraud hold, assert the account is
still blocked.

Worth noting what made this catchable: the legal-hold version was found by a
standing-state audit AFTER it shipped, and its own test asserted the buggy
behaviour. Here the shape was recognised from the earlier find. **The general
lesson is narrower than "model sets properly" — it is: any time a flag
summarises N underlying facts, releasing one fact must recompute the flag, never
clear it.** Grep for `= false` on a summary column.

**The precedence dimension the legal-hold case did not have.** Freezes arrive
from different authorities that disagree about what is permitted, and a
garnishment stops debits while PERMITTING credits — the member's wages still
land, they just cannot be spent. A blanket boolean bounces their payroll
deposit. That case is tested explicitly because it is the one a flag gets
silently wrong in the member's disfavour.

**A mutation survived for the wrong reason and exposed a real bug.** The
`re-alerts on an already-breached indicator` mutation was not caught, and the
reason was not a missing test: the EWI observation id was timestamp-keyed, so
under the frozen drill clock two sweeps collided on the same id and the second
silently overwrote the first — taking `ewi_prior_breach_state`, which the
suppression depends on, with it. Under a real clock this is a race rather than a
certainty, which is worse. Fixed to a per-indicator sequence, and the test now
asserts both observations exist as separate rows so the suppression cannot pass
for the wrong reason again.

Sweep: 11 mutations, 10 caught first pass, the 11th above. 808 tests, 175 green.

## Artifact — Basel II + business continuity (BA/BC)

**Predicted basel 4, BCP 3. Landed 4 and 3.** Sixteen for sixteen. 175 → 182.
BA-08 needs ALCO and board minutes; BC-07 a backup system's job results; BC-09
an IT failover feed; BC-15 counsel and a vendor attestation.

**I nearly duplicated a subsystem again — and exists_check told me so.** The
tool printed `⚠ calculated  events=rwa.credit_calculated` before I started, and
I wrote a `core.rwa_run` table and a second `postRwaRun` anyway. It failed at
typecheck on a duplicate identifier, which is luck, not process. The lesson from
§5i needs sharpening: **running the check is not the control; READING it is.**
The output is long and mostly noise, and the one line that mattered was in the
middle of it. Backed out; BA-03's market and operational legs and BA-04's
versioned schedule went onto `capital.ts`'s existing run.

Worth noting what the existing writer already had: `capital.ts` refuses to
weight an unmapped exposure at zero, with the comment "zero is the direction
that flatters the institution" — the same reasoning, arrived at independently,
before this artifact existed. That is the §5k pattern reproducing itself a
second time without being looked for.

**§5k, third artifact running.** Basel is the purest instance in the corpus
because both kinds sit inside one ratio: the RISK WEIGHTS are statutory
(versioned, approved, and an unmapped exposure REFUSES rather than defaulting),
while the COUNTERCYCLICAL BUFFER is institutional (nullable, and an unset CCyB
produces no payout cap and therefore no distribution verdict — not an
unrestricted distribution).

**BC-13's finding, stated generally: "completed" is the owner's opinion; the
retest is the evidence.** A corrective action marked complete and never
retested is one nobody knows worked, and the two states have to be separately
representable. Same shape as EDD "completed" with no findings, and as a facility
that has never been drawn.

Sweep: 13 mutations, 13 caught. 826 tests, 182 green of 225.

## Artifact — the tail (EPS, IS, CP, DF, IC)

**Predicted 13, landed 13. Seventeen for seventeen.** 182 → **195**, which is
the projected ceiling exactly. The buildable set is finished.

**Nine of thirteen were EXTENSIONS, not new subsystems** — `eps.ts`,
`capital.ts`, `lending_underwriting.ts`, `incidents.ts`. That ratio is the real
end-state of the codebase and the reason §5i needed a script rather than
vigilance.

### ⚑ IC-02 IS THE LAST NEW SHAPE: SEPARATION OF DUTIES IS A PAIR CONSTRAINT

Every other control in this corpus asks about ONE object — may this person do
X, is this ratio within band, was this notice sent. SoD asks about a RELATION:
may this person do X **given they can already do Y**. That cannot live on a role
row, because the conflict is a property of the pair, not of either role. Tested
directly: the same role that conflicts for one subject is clear for another.

Two consequences worth carrying:
- **The check runs at GRANT time and BLOCKS.** A quarterly review that detects
  the conflict finds it has been live for three months — three months of one
  person moving money unchecked. Detection is not the control here; refusal is.
- **A blocked grant is not a held role.** Otherwise a refused grant poisons
  every subsequent check, and the subject accumulates phantom conflicts.
- **An unavoidable conflict is accepted WITH a compensating control, an approver
  AND an expiry.** The permanent exception created by someone who has since left
  is the specific thing the expiry exists for.

### The event-without-state smell, one last instance

`capital.ts` was emitting `capital.contingency_action.executed`,
`capital.action.proposed` and `capital.action.executed` with **empty payloads**,
because no action record existed to put in them. Same shape as the
`loan.dpd_reset` defect the earlier sweep found: a verb with no noun. An
examiner asking "which action, for how much, approved by whom" got an event
saying an action happened. `core.capital_action` now exists and the events carry
it.

### A guard that broke the same way twice

`runBcpLifecycle` guarded on a table the incident lifecycle later started
writing — first the comms tree, then the PIR — and each time this lifecycle
silently stopped running and two controls went red without any test failing.
Now guarded on `corrective_action`, which only it writes. **A drill lifecycle
must guard on something ONLY it writes**; anything else is a latent regression
waiting for an unrelated artifact.

Sweep: 20 mutations, 20 caught. **860 tests, 195 green of 225 in scope.**

# §5k — A MISSING STATUTORY THRESHOLD IS A BUG; A MISSING INSTITUTIONAL ONE IS UNASSESSED

**This is the one finding here that generalises past banking entirely.** It has
nothing to do with credit unions, and it is the thing to carry to the next
system.

Any domain where an outside authority sets a floor and the organisation sets a
tighter one on top has TWO kinds of threshold, and they behave differently in
exactly one respect: **what absence means.**

| | STATUTORY | INSTITUTIONAL |
|---|---|---|
| where it comes from | a rule, external, the same for everyone | a decision somebody in the organisation made |
| stored as | `not null`, DERIVED from facts the system holds | nullable |
| a caller may supply it | **no** — it is a fact, not an input | yes, it is their decision |
| what absence means | a **BUG**. Something is broken. | **UNASSESSED**. Nobody has decided yet. |
| what absence must NOT produce | — | a passing verdict |

**The failure mode is always the same and always flattering.** Store both in one
column and you are forced into a single answer to "what does absent mean". Pick
"bug" and every unconfigured institutional threshold blocks work that should
proceed. Pick "fine" — which is what everyone picks — and an organisation that
never set a limit reads identically to one that never exceeded one. The second
error is invisible, survives audit, and gets worse as the system grows.

**The mechanical form** is a both-present-or-both-absent constraint pairing each
verdict to the threshold that produced it:

```sql
constraint "ck_verdict_needs_threshold"
  check (("threshold_bp" is null) = ("breached" is null))
```

Instances in this repo, arrived at independently before the pattern was named:
`ck_liquidity_verdict_needs_minimum`, `ck_analytics_verdict_needs_threshold`,
`ck_capital_trigger_verdict`, `ck_lar_band_needs_config`,
`ck_survival_verdict_needs_threshold`, `ck_headroom_verdict_needs_floor`,
`ck_mismatch_breach_needs_limit`. `api/unassessed.test.ts` pins every one.

**The tell that a domain has both kinds:** ask "what's our limit?" and the
honest answer is "which one".

**The corollary about derivation.** A statutory threshold must be DERIVED, never
accepted from a caller — `assetTier()` computes §741.12's tier from total assets
and ignores a supplied `asset_tier`. A caller who can assert the tier can assert
their way out of the obligation the tier triggers. This is tested explicitly
rather than commented, because it is the kind of convenience someone adds later
in good faith.

# §X — NOT ENGINEERING WORK

**28 in-scope controls that will not go green by writing code.** Separated from
the backlog deliberately: mixed in with the 105 buildable ones they read as
things nobody got to, which understates progress and misdirects whoever picks
this up. Each names the specific fact it needs and where that fact would have to
come from, so the decision is a short one.

## X.1 — Needs a fact about a person (9)

The core has no way to observe what a human being did. Each of these needs a
feed from a system that does.

| control | the fact it needs | where it would come from |
|---|---|---|
| `cash:CP-05` | an employee was separated | **HR system** |
| `information-security:IS-06` | an employee was separated | **HR system** |
| `cash:CP-07` | a manager coached a teller | HR case management |
| `cash:CP-12` | staff training coverage % | LMS |
| `basel-ii:BA-08` | staff trained; ALCO convened | LMS + committee minutes |
| `liquidity:LQ-06` | ALCO convened and decided | committee minutes |
| `liquidity:LQ-17` | ALCO convened and decided | committee minutes |
| `member:MP-06` | a member was expelled at a meeting | board/membership minutes |
| `member:MP-07` | a member died; estate administration | external notification |

### ⇒ PRE-COMPUTED: what happens if an HR feed exists

**If the answer to "does an HR system publish separations?" is YES, two controls
move immediately:** `cash:CP-05` and `information-security:IS-06`. Both are
otherwise complete — CP-05's cash-custody machinery and IS-06's access register
are built and tested; they are waiting on `employee.separated` and nothing else.
That takes the projection from **197 to 199**.

**A training/LMS feed moves two more** (`cash:CP-12`, `basel-ii:BA-08` in part)
and **committee minutes move three** (`liquidity:LQ-06`, `LQ-17`, and BA-08's
other half). The remaining two (`member:MP-06`, `MP-07`) need external
notifications of expulsion and death, which are unlikely to exist as feeds.

**Best case if every human-fact source exists: 206 of 225.** With the
network/endpoint feed as well (X.2), **213 of 225.**

*(Counts in this section are from the corrected run: 11 person-blocked, not 9.
`e-commerce:EC-02` and `director-fiduciary-duties:DF-05` joined it.)* Worst case, if none
do: these 9 should be RESCOPED to organisational, deliberately and with the
reasoning recorded — not left red looking like unfinished engineering. Note the
§5g bias: wrongly scoping out is invisible, so the default is to leave them in.

## X.2 — Needs another system's evidence (19)

> # ⇒ ONE INTEGRATION MOVES SEVEN CONTROLS: 195 → 204
>
> **Seven of these nineteen need the same thing: network and endpoint security
> evidence.** `e-commerce:EC-05`, `EC-06`, `EC-08`, `EC-09`,
> `information-security:IS-05`, `IS-07`, `IS-14` — firewall rules, TLS
> configuration, antivirus, intrusion detection, SIEM, DLP, vulnerability
> scanning.
>
> A SIEM normally consolidates exactly these, that being the point of a SIEM.
> **If one exists, a single feed from it moves all seven.** This is the highest-
> leverage decision available anywhere in this backlog and it is one question:
> *does something already aggregate our security telemetry, and can the core
> read it?*
>
> The remaining twelve are unrelated to each other and to this, and are listed
> below for completeness rather than as a group to act on.

These need a fact about INFRASTRUCTURE or an EXTERNAL BODY that the banking core
has no connection to. **A banking core asserting `firewall.rule.changed` is
fabricating in exactly the way it would be by inventing an employee.** The
obligations are real; the evidence lives elsewhere.

| group | controls | the evidence holder |
|---|---|---|
| **network/endpoint security (see above)** | **7** | firewall, TLS, antivirus, IDS, SIEM, DLP, vuln scanner |
| backup and recovery | `business-continuity-plan:BC-07`, `information-security:IS-08` | backup platform |
| IT operations | `business-continuity-plan:BC-09`, `privacy:PR-15` | ITSM / network ops |
| examiner actions | `liquidity:LQ-11`, `LQ-13` | NCUA correspondence |
| model governance | `liquidity:LQ-08`, `information-security:IS-13` | model risk / AI governance |
| outside counsel and vendors | `business-continuity-plan:BC-15`, `privacy:PR-03`, `PR-04` | legal matter management, vendor attestations |
| resolution posture | `resolution:RS-03` | the safe-mode switch, wherever it lives |

**The options for each are the same three:** integrate the source, scope the
control to the system that holds the evidence, or accept it as a manual control
with paper evidence. All three are legitimate; none is an engineering task in
this repo. What must NOT happen is a writer that lets the core assert these
facts on its own authority — that is the failure mode every provenance and
`unassessed` decision in this project exists to prevent.

### complaints and disputes (CO-06, FL-13, MP-04, PR-10) — 4 of 4, predicted 4

92 -> 96. Sixth artifact, sixth exact call. `core.complaint` and `core.dispute`
are the sixth and seventh of the 22 abandoned tables to get writers.

**A complaint and a Reg E dispute are different nouns, and conflating them
drops a clock.** They arrive through the same door and are constantly treated as
one thing. A complaint has an acknowledgement deadline, an initial response, a
final response and a root-cause tag. A dispute (12 CFR 1005.11) has a
10-business-day provisional-credit clock, a 45/90-day investigation limit, and a
MONEY consequence — provisional credit actually posts to the member's balance.
Modelling either as a flavour of the other silently loses whichever clock
belongs to the other, and the one that gets lost is the one with the money on it.

**One register, four lenses.** Collections reads it for resolution timeliness,
fair lending for disparity in *who* complains, member services for the dispute
lifecycle, privacy for privacy-category complaints and board reporting. That is
why CATEGORY and ROOT-CAUSE TAG are constrained fields rather than free text —
four downstream analyses over free text would each be a string-matching
exercise, and each would drift differently.

**A complaint resolved with no root cause is closed, not resolved.** It
contributes nothing to the trend analysis three separate policies depend on, so
resolution refuses without one. This is the same shape as the LP-11 finding in
"absence of a finding must itself be recorded": the register looks full and the
analysis over it is empty.

**22 mutations, 20 caught first pass. Both survivors were weak tests of mine:**

1. The receipt-clock test compared `ack_due_at - received_at` and asserted five
   days. If the writer ignored the supplied `received_at` and used `now`, that
   interval is still five days — so a complaint that sat in an inbox for a week
   could have its deadline silently reset and the test would pass. Now asserts
   the absolute anchor.
2. The intake-validation test only covered a missing narrative, never a missing
   category, so removing the category check survived.

Both reachable states, so both were test problems rather than missing
capability — the distinction the "when a mutant survives" rule turns on.

## THE DURATION-VS-ANCHOR TEST WEAKNESS — swept, 2 real gaps found

**A test that asserts a DURATION cannot see a clock that silently re-anchors.**
If `due_at - anchor` is asserted to be 30 days, code that computed
`now + 30 days` and ignored the anchor entirely passes: the interval is 30 days
either way. Only an ABSOLUTE assertion distinguishes them.

Found in the complaints artifact — the acknowledgement test compared
`ack_due_at - received_at` and would have passed against a writer that reset the
deadline on a complaint which had sat unopened in an inbox for a week. Given how
many deadline-driven controls this corpus has (SAR, ECOA, NCUA, NWRP, Reg E,
CTR, retention, CDD, the obligation register), the rest was swept immediately
rather than waiting to hit it again.

### What the sweep found

**Two real gaps, both in POLICY-LAPSE clocks, where the consequence is worst:**
`cda_policy` and `cash_policy` compute expiry as `adopted_at + 12 months`, and
nothing asserted the absolute date. A policy adopted eleven months ago would
have recorded an expiry twelve months from TODAY — so it could never lapse,
**and CDA-01's entire control is "if the policy lapses, all CDA actions are
blocked".** The control fails open and every duration-based assertion still
passes. Both now pinned, plus a case that backdates an adoption past its own
term and asserts it reads as already expired.

**A second finding the sweep surfaced sideways:** three mutations survived
initially not because of duration-vs-anchor but because **`capital.ts`,
`incidents.ts`, `audit.ts` and `eps_controls.ts` have no dedicated unit tests at
all.** They were built in an earlier session and are green through the
control-test harness alone, so their deadline anchors were unprotected entirely.

### `deadlines.test.ts`

Every regulatory clock in the system is now pinned to its anchor in one file,
with absolute dates. It covers the anchor AND the negative (a non-reportable
incident starts no NCUA clock; a well-capitalized position starts no NWRP
clock), and it deliberately spans modules that have no other tests.

**12 re-anchoring mutations, 12 caught.** Including the ones that motivated it:
ECOA anchored on the decision rather than the completed application, CTR on the
day it was noticed rather than the business date, NCUA on the declaration rather
than the reportability determination, NWRP on the quarter-end rather than the
classification, CDD on the write rather than the last refresh.

**The general rule, worth applying to any new deadline: assert the absolute
date, not the interval.** The interval is the part that survives the bug.


## THE FAIL-OPEN CLASS — a control that permits everything it exists to prevent

Named separately from the ordering-assumption class (§5g) because the SHAPE is
different even though the outcome is identical: **the control ran, reported
success, and prevented nothing.** These belong together in a reader's head.

| # | control | what it silently permitted | why every test passed |
|---|---|---|---|
| 1 | **heartbeat sweep starvation** | the tail of the queue never processed | the sweep ran and reported a count |
| 2 | **auth lockout ordering** (EPS-05) | unlimited failed attempts under burst | consecutive attempts share a millisecond, so the sort was arbitrary |
| 3 | **capital position ordering** | a stale position read as current | caught by inspection, never fired |
| 4 | **CG-VEL-01 column defaults** | every over-limit transaction | `created_at` was undefined, so the velocity sweep matched nothing |
| 5 | **CDA / cash policy expiry** | **every CDA action after the policy lapsed** | the expiry re-anchored to `now`, so it could never lapse |

Number 5 is the worst of them, because **CDA-01's entire purpose is to block
activity when the policy lapses.** A policy adopted eleven months ago recorded
an expiry twelve months from TODAY. It could never expire, the gate never
blocked, and the duration-based test asserting "twelve months" passed either
way. The control was not weak — it was inert, while reporting success.

**The check that finds this class: for a control whose job is to BLOCK, write a
test in which it must block, and make the state that should trigger it as stale
or as extreme as possible.** A policy adopted long ago. A queue with an old
tail. Attempts in the same millisecond. Every instance above was invisible to a
test built on fresh, well-formed, present-tense data.

## MUTATION TESTING EARNED ITS PLACE HERE — the evidence

The policy-expiry bug is the strongest single argument in this file for the
method, because of HOW it was found:

1. A mutation survived on the **complaints acknowledgement** test — an
   unrelated control in an unrelated domain.
2. Inspecting the survivor showed the weakness was general: **a test asserting a
   DURATION cannot see a clock that re-anchors.**
3. Sweeping the corpus for that shape found **two live fail-open bugs in CDA and
   cash**, in code that had passed review, passed its own tests, and was already
   committed and reported as green.

**A weak test in one place revealed a real defect somewhere else entirely.** No
amount of reading the CDA code would have found it; the tests said it worked and
the interval arithmetic was correct. It took a mutation on a different control
to expose the class, and the class to expose the instances.

That is the argument. Mutation testing here is not a coverage metric — it is the
thing that turns "this test passes" into "this test could fail", and only the
second is evidence.

## FOUR MODULES WERE GREEN WITH NO UNIT TESTS AT ALL

Surfaced by the same sweep, and worth recording because **nobody would have
noticed: the number that mattered looked fine.**

`capital.ts`, `incidents.ts`, `audit.ts` and `eps_controls.ts` were built in an
earlier session and had **no dedicated test files**. Their controls were green
purely through the control-test harness, which asserts that declared events
appear — not that the logic behind them is right. Three re-anchoring mutations
survived the first sweep for this reason alone: there was nothing to catch them.

`deadlines.test.ts` now deliberately spans those modules for their clocks
(NCUA's 72 hours from the reportability determination, NWRP's 45 days from
classification). **The rest of their surface is still unit-untested** and should
be treated as a known gap, not as covered — the control harness is carrying
them.

### risk, acceptances and control overrides (ERM-06, ERM-07, IC-06) — 3 of 5, predicted 3

96 -> 99. Seventh artifact, seventh exact call. `core.risk` is the eighth
abandoned table to get a writer.

**EC-02 and IS-06 stay red as classified.** Both need `employee.terminated` /
`employee.separated` to drive deprovisioning. Building the access register alone
would produce a table that looks like access management and **cannot revoke
anything** — the half of the control that never fires. That is worse than
leaving it red, because it looks done.

**Three registers of the same shape that must not be merged**, and the reason is
what each one uniquely carries:

| | what it is | what merging loses |
|---|---|---|
| risk breach | an excursion outside appetite | the escalation CLOCK |
| risk acceptance | a decision to stay outside, for a period | the EXPIRY |
| control override | one act bypassing one control once | the REPETITION count |

They are structurally identical and semantically unrelated. An acceptance
modelled as a breach never expires; an override modelled as an exception
acquires an expiry it does not have.

**The controls each turned out to be about the thing that is easy to leave out:**

- ERM-06's control is the SIZE of the excursion, not the fact of it. Severity is
  derived from how far outside appetite the KRI moved, and only high or critical
  reaches the CRO — notifying on every breach makes the notification worthless.
- ERM-07's control is the EXPIRY. An acceptance nobody revisits is a permanent
  exception granted by inattention, so the expiry is NOT NULL, an expiry too
  soon to be revisited is refused, and expiry **re-opens the breach it was
  covering** — the risk did not go away when the paperwork did.
- IC-06's control is REPETITION. One override with a good rationale is fine; the
  same control overridden forty times is a control that does not fit the
  business. The analytics NAME the repeatedly-overridden control rather than
  leaving it for a reader to spot in a frequency table.

**21 mutations, 21 caught first pass.** Second artifact with no survivors.

### BSA/AML programme (BSA-*) — 15 of 15 green, predicted 15

99 -> 114. Eighth artifact, eighth exact call. `core.filing` and
`core.originator` are the ninth and tenth abandoned tables to get writers.

> ## ⚠ DO NOT QUOTE ANY OFAC CONTROL AS COVERAGE
>
> **BSA-05 green means the SCREENING MECHANISM works end to end. It does not
> mean the screen detects anything.** OQ-02's finding is unchanged: the screen
> is `/\bSDN\b/i` against a name, with no list and no 50%-rule derivation.
>
> What changed is the half OQ-02 said was architectural: the call site at CIP
> and at payment, the hold, the escalation, the release-with-determination, the
> clean-pass evidence, the annual report. Those are real and mutation-tested.
> **`ofac_screen.list_version` is NULL on every row this system writes**, and
> one of the mutations verifies that fabricating a version fails the suite.
>
> The gap is now one procurement decision rather than an engineering project,
> which is exactly the split OQ-02 asked for. It is still a gap.

**BSA was the artifact that broke the "it is all registers now" worry.** Five
controls turned on things no register shape produces:

- **BSA-09's control is a BAND, not a threshold.** The monetary-instrument log
  attaches between $3,000 and $10,000; below it nothing attaches and at $10,000
  a CTR attaches instead. Getting either bound wrong fails in opposite
  directions — logging everything buries the reportable ones, logging nothing
  misses them. Both bounds are separately mutation-tested.
- **BSA-13's threshold is on the AGGREGATE.** Five foreign accounts of $3,000
  each are reportable and no single one of them is. A per-account test is the
  classic FBAR error and is the mutation that would have shipped.
- **BSA-07 is a control to NOT do something.** SAR confidentiality means
  refusing to confirm a SAR exists. The evidence that the obligation was
  honoured is the RECORDED REFUSAL — a request that leaves no trace cannot
  demonstrate anything.
- **BSA-11 requires reporting a NEGATIVE.** A 314(a) response with zero matches
  is still a response; "no match" and "did not search" are the same to FinCEN
  unless the zero is reported. Same shape as the FBAR nil determination.
- **BSA-03's CIP is a conjunction of four elements.** Three of four is not a
  partial CIP, it is a failed one, so the outcome is DENIED rather than
  "completed with gaps".

**29 mutations, 29 caught first pass.** Third artifact with no survivors.


## THE FIVE CONTROL SHAPES — not BSA-specific, and each fails a different way

Found in the BSA artifact but none of them is AML-specific. A band or an
aggregate test can appear in any domain, and the naive implementation of each
breaks in a characteristic direction.

| shape | example | the naive version | how it fails |
|---|---|---|---|
| **BAND** — two bounds, different obligations either side | monetary-instrument log, $3,000–$10,000 | one threshold | wrong LOWER bound logs everything and buries the reportable ones; wrong UPPER bound misses the CTR handoff. **Opposite failures — test both bounds separately** |
| **AGGREGATE THRESHOLD** — the sum crosses, no member does | FBAR: five $3,000 accounts | a per-item test | passes forever. The classic FBAR error and the one most likely to ship |
| **REQUIRED REFUSAL** — the obligation is to NOT act | SAR confidentiality | do nothing | doing nothing is correct AND leaves no evidence the obligation was honoured. **The refusal must be recorded** |
| **REQUIRED NEGATIVE** — a nil result must be reported | 314(a) zero matches; FBAR nil | report only when there is something | "nothing found" and "never looked" are identical to the regulator |
| **ALL-ELEMENTS CONJUNCTION** — N of N, not N of M | CIP's four elements | a completeness score | three of four is a FAILED CIP, not a partial one. The outcome must be DENIED |

Two of these already existed elsewhere under other names: the required-negative
is the same idea as "absence of a finding must itself be recorded", and the
conjunction is what the CDA funding gate is. Naming them as shapes is what makes
them checkable against a NEW control rather than recognisable only in hindsight.

## GUARDING THE HONEST NULL — a test that fires when someone closes the gap

Generalised from the BSA artifact, where a mutation that set
`ofac_screen.list_version` to `"OFAC-2026-07"` was caught. That guard is unusual
and worth naming: **it fails when someone makes the gap look closed, not when
the code breaks.**

The system distinguishes two kinds of "no value":

- **NOT BREACHED** — the check ran, the answer was no.
- **UNASSESSED** — nobody configured what the check needs, so there is no answer.

Collapsing the second into the first is the most flattering possible error: an
institution that never set a limit reads as one that never exceeded it. Ordinary
tests cannot see it, because a fabricated default makes everything downstream
work.

`unassessed.test.ts` now pins **every site where a NULL is load-bearing** — the
three OFAC/PEP list versions, the capital internal trigger, the enterprise cash
limit, the over/short threshold, the fair-lending and complaint-trend
thresholds, the ALM and liquidity minima, the LTV maximum, the two
unknown-is-not-permission trade gates, and `account.entity_id` (OQ-12, where
NOT NULL with a backfill would be the fabrication).

**14 fabrication mutations, 14 caught.** Each one populates the unconfigured
value the way somebody would in order to turn a control green.

**Apply this to any new control whose honest state is "unconfigured".** The test
to write is not "does it behave correctly when configured" — it is "does it
still refuse to render a verdict when it is not".

### privacy (PR-*) — 11 of 14 green, predicted 11

114 -> 125. Ninth artifact, ninth exact call. The three reds are exactly the
outside-blocked ones: PR-03 (vendor GLBA attestations), PR-04 (outside counsel's
receipt of legal process), PR-15 (third-party connection telemetry).
`core.address` is the eleventh abandoned table to get a writer.

**AN OPT-OUT IS A STANDING STATE, NOT AN EVENT LOG — and this is the finding.**
The natural model is a log of opt-out requests, and it is wrong in a way that
fails silently. The obligation is not "record that they asked", it is **"do not
share, from now on, until they say otherwise"**. A log answers *did they ask*; a
standing state answers *may we share TODAY*, which is the question every
disclosure has to put. So `privacy_preference` holds the current state per
member per channel, and the propagation deadline lives on the state row —
because the real failure is a preference captured at the desk and never pushed
to the systems that actually do the sharing.

**Two more where the naive model loses the control:**

- **A GPC signal OVERRIDES the banner**, and the test that matters is the one
  where a member sends GPC *and* clicks accept-all. Treating the signal as
  advisory, or letting the later click win, is the failure the signal exists to
  prevent.
- **Tags are gated by BOTH approval and consent.** An approved advertising tag
  still fires only with advertising consent; a consented category still fires
  nothing nobody reviewed. Gating on either alone passes the happy path.

**A schema correction the corpus forced.** PR-05 declares `dispute.basis`, and I
had split furnishing disputes (FCRA) from Reg E disputes into separate
registers. The corpus does not: both are `dispute.*`. `core.dispute.amount_cents`
is now nullable with a `kind` discriminator, because **a data-accuracy dispute
has no amount and forcing one would fabricate it** — while a Reg E dispute must
still carry both its amount and its provisional-credit clock, enforced by
`ck_dispute_rege_has_amount`. The control found a modelling error, which is the
whole method.

**22 mutations, 22 caught first pass.** Fourth artifact with no survivors.


## STANDING STATE IS NOT AN EVENT LOG — AND NOT A SINGLE POINTER EITHER

The privacy opt-out finding generalises, and auditing the earlier subsystems
against it immediately found a live fail-open in record retention.

**The class.** Several things in this system are CURRENT STATE THAT GOVERNS
FUTURE ACTIONS: an opt-out, a legal hold, a risk acceptance, an account lock, a
dormancy flag, a sanctions hold, a control exception. For each, the question the
system must answer is *may we do this NOW* — not *did somebody ask*. Two wrong
shapes, both of which pass ordinary tests:

1. **A log of requests.** Answers "did they ask", never "what is true now". The
   opt-out model this was caught on.
2. **A single pointer.** Answers "what is the most recent one", which is not the
   same as "is any still active". This is the one that bit.

### The legal-hold fail-open (sixth instance of the class, worst consequence)

`core.record.legal_hold_id` was one column. Placing a SECOND hold over a record
overwrote the first. Releasing the second then cleared `legal_hold_flag` — with
the first hold still live — and the record became disposal-eligible **under an
active litigation hold. Destroying records under hold is spoliation.**

The release code already carried this comment:

> *"Clear the flag only on records THIS hold set. A record under two concurrent
> holds must stay held when one is released."*

**The intent was right and the data model could not deliver it.** Every test
passed. No test had ever placed two holds, and the existing test asserted
exactly the buggy behaviour — with the same false comment.

**Fixed** by deriving the flag from a SET (`core.record_hold`) rather than a
pointer. Both release directions are now pinned, plus the disposal sweep
refusing an expired record under a surviving hold. Three mutations, including a
straight revert to the pointer version, all caught.

### The audit result for the others

| standing state | shape | verdict |
|---|---|---|
| privacy opt-out | `privacy_preference`, current per member/channel | correct (built that way) |
| legal hold | was a pointer | **was broken, now a set** |
| risk acceptance | row with `expired_at`, sweep derives | correct |
| control exception | row with `reverted_at`, sweep derives | correct |
| account lock / `funding_block_state` | column on the account | correct |
| OFAC hold | `hold_placed_at` / `hold_released_at` on the screen | correct — but only ONE screen per subject; a second subject-level match would overwrite. **Same shape as the legal-hold bug and worth watching if multi-list screening ever lands.**

**The rule: if a state can be imposed by more than one source, it must be
derived from the set of sources, never stored as one flag plus one pointer.**

### collections (CO-*) — 9 of 9 green, predicted 9

125 -> 134. Tenth artifact, tenth exact call.

**DELINQUENCY IS DERIVED, NOT SET.** The natural model is a
`delinquency_status` column somebody updates, and it fails the way every stored
verdict fails here: the status and the facts drift, and the status is what the
controls read. Days past due is a function of the due date and the payment
history, so it is computed on every evaluation and the stage, the
classification and the nonaccrual verdict all follow from it. What is STORED is
the evaluation — the answer alongside the inputs that produced it — so a
classification can be recomputed and disputed.

**Two distinctions the corpus draws that a naive model collapses:**

- **"Triggered" and "placed" are different facts.** Crossing 90 days past due
  triggers nonaccrual; taking the loan off accrual is a ledger action. A trigger
  with no placement leaves interest accruing on a loan that should not accrue.
- **Days-past-due may only be RESET after the borrower demonstrates capacity.**
  Resetting on approval of the workout alone is how a delinquent loan becomes
  current on paper without anything being paid. The eligibility check is its own
  event and fires whether or not it passes.

**20 mutations, 19 caught first pass.** The survivor was a test asserting the
EVENT without the STATE: `overdraft.charged_off` fired while `charged_off_at`
stayed null. Worth noting as a recurring test smell — **asserting the
announcement rather than the record.** The event says it happened; only the row
says it is true.

## THE EVENT-WITHOUT-STATE SMELL — swept, one real defect found

**A test that asserts an emitted EVENT and not the ROW it should have changed
passes against code that announces something and then fails to persist it.**
Same failure family as the fail-open class, arriving through the test rather
than the model: the control reports success and nothing happened.

Found by a surviving mutation in collections (`overdraft.charged_off` fired
while `charged_off_at` stayed null), then swept statically across every test
file — 37 tests asserted a positive event with no assertion on any row.

### The real defect it found

**`loan.dpd_reset` was emitted and nothing reset the loan.** After an approved
workout with demonstrated payments, the event fired, `days_past_due` stayed
where it was, the classification stayed where it was, and the test passed
because it asserted the event. A loan that had genuinely earned its reset kept
its delinquency — the failure is conservative here, but the same shape in the
other direction is how a delinquent loan silently becomes current.

Row assertions added at five sites where a state change genuinely accompanies
the event (collections dpd reset, cash shipment verification, CDA publication,
insider board approval, privacy notice delivery). All five mutations — event
emitted, persistence neutralised — now caught.

**Most of the other 32 are legitimate**: negative assertions (`assert(!codes…)`)
and writers that genuinely only emit (`sar.disclosure.declined`,
`risk.within_appetite`) have no row to check.

**The rule: if a writer both emits and persists, the test must assert both. The
event says it happened; only the row says it is true.**
