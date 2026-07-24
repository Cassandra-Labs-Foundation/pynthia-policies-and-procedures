# Cassandra Core — Test Principles

This is the **design-rationale record** for the test system: the durable principles and the
reasoning behind them, so the *process* is reproducible — a future session or model reconstructs
the same pipeline because the rules are written down.

It is also a **generator convention input**: alongside `architecture-decisions.md` (what the system
does) and `compliance-system-architecture.md` (control semantics), this doc governs *how* each test
is written, so generated tests stay consistent instead of being 300 one-off interpretations.

Related artifacts:
- `core-api.yaml`, `controls.json` — machine specs (enumeration inputs)
- `architecture-decisions.md`, `compliance-system-architecture.md` — prose conventions (inputs)
- `properties.yaml` — formalized cross-cutting invariants (generator input; the attack oracle) *(to be created)*
- `TEST-CATALOG.md` — the test inventory
- `PRINCIPLES.md` — *this file*: how & why we test

Principle numbering here is canonical and supersedes any provisional numbers used while drafting.

---

## Objective

Build a **test-generation pipeline** whose output is a **frozen, black-box, language-agnostic TDD
suite** specifying the entire banking core. A builder-LLM then writes the core (in any language) and
iterates against the frozen suite until green — "one-shot the core via TDD." The suite is the spec;
passing it is the definition of done.

---

## Scope (current phase)

**Optimize for Pynthia's own core (single credit union) first.** The compliance-floor idea exists for
*white-label*: when Pynthia licenses the core to other credit unions, the floor is the non-negotiable
baseline they can't disable while they customize the rest (D22, "credit union-only customization"). For
Pynthia itself there is no other CU disabling a subset — **all 317 controls are mandatory**, so the
floor-vs-customizable split stops being special.

Deferred until white-label:
- Floor-vs-customizable distinction, CU-level control customization, force-push distribution (D22).
- Tests `FLOOR-CANNOT-DISABLE` and `CONTROL-BOUNDS` (the customization guardrails).

Still in scope (core to Pynthia's BaaS model): multi-**fintech** isolation (D18/D23 — Pynthia's fintech
partners), the aggregator, and **every control enforced** — `CONTROL-ENFORCEMENT-GENERIC` (all controls
fire) subsumes `FLOOR-ALWAYS-FIRES` (just the floor subset).

---

## The Five Pillars — what we test for

| Pillar | The question | Method | Grounded in |
|---|---|---|---|
| **1. Functional / E2E** | Does data flow end-to-end? | Drive a transaction through the whole chain; money invariants as oracle | Data-flow §137-150; Inv 1,2,10 |
| **2. Detection** | Do we notice when it breaks? | Induce a fault; assert the system surfaces it | D4 monitoring; D25 reconciliation; D26 |
| **3. Resiliency** | Does a failure stay contained, recover, invariants survive? | **Active chaos** (real infra faults) | D18/D23 isolation; D27/D28 crash semantics |
| **4. Compliance** | Are all controls running; can we see a flag? | Per-control trigger→output+control-result within SLA; floor always fires | controls.json `events[]`; D11, D22; Inv 3 |
| **5. Security** | Confidentiality, integrity, isolation, auth under attack? | **Agentic red-team** | D5/D15/D19 auth; D21 PII; D23 isolation; Inv 8 |

The banking core is central to all five — **not deferred**. Tests are sourced from wherever their
spec lives (see *Surfaces & Sourcing*).

---

## Principles

### Observability & Black-box

| # | Principle | Why → Implication |
|---|---|---|
| P1 | **Black-box only** | Core is regenerated, maybe in another language → never import internals; drive over HTTP |
| P2 | **Verify through the API, not the DB** | Keeps tests language-agnostic → unobservable behavior is a missing endpoint, not a missing test |
| P3 | **Inject at the infra layer, observe at the API layer** | Real faults are out-of-band, invariants are in-band → P2 survives chaos; fault injection is a separate axis |
| P4 | **The system must expose its own health** | Detection needs an in-band signal → staleness/gaps/divergence (D4/D25) observable via API; an unobservable break is a missing observability surface |

### Generation Pipeline

| # | Principle | Why → Implication |
|---|---|---|
| P5 | **Tests are generated, not hand-written** | Rides the upstream loop, stays in sync → humans curate inputs, not test bodies |
| P6 | **Enumerate deterministically, generate per-element** | Coverage guaranteed by the list, not model recall → one generation per control/endpoint/state-machine; never a "write all the tests" call |
| P7 | **Every test cites its source** (control_id / decision# / endpoint+state) | Anti-hallucination + traceability → an uncited test is invalid; a spec change maps to a known set of tests to regenerate |
| P8 | **Prose invariants live in curated `properties.yaml`** | Stable, auditable generator input → not re-derived from prose each run |
| P9 | **Upstream owns API↔control convergence** | Separation from the pynthia-policies loop → we test only currently-resolvable controls; the rest is an auto-shrinking worklist; we don't fix the granularity gap |
| P10 | **Freeze + version-pin the suite** (manifest: spec_version + shas) | The builder needs a stable target → regeneration is a deliberate, reviewed event, not per-build |

### Suite & Harness

| # | Principle | Why → Implication |
|---|---|---|
| P11 | **Hermetic, deterministic harness** | Flaky tests poison a TDD target → ephemeral sandbox, reset between tests, no wall-clock |
| P12 | **Tier the suite: light API + heavy chaos** | Different weight/environment → API tier (boot stack + HTTP) runs constantly; chaos tier (full topology + chaos rig) runs in integration |
| P13 | **The harness owns the topology; the builder owns the app** | Bounds the one-shot to app logic, not architecture invention → we version-pin a deployment encoding architecture-decisions; builder writes to a *topology contract* and must survive chaos within it |
| P14 | **No sim-hooks — real faults only** | A sim-hook is impl-specific, test-only core build-burden, lower fidelity → all faults are real infra (Pumba pause/kill, Toxiproxy network, libfaketime clock, stress-ng pressure); the core carries zero test surface |

### Adversarial Methodology

| # | Principle | Why → Implication |
|---|---|---|
| P15 | **Prove reliability by attacking, not just asserting** | The strongest proof an invariant holds is failing to break it → invariants must hold under active adversarial load, not only happy-path |
| P16 | **Two adversarial layers + graduation** | Open-ended attack vs a frozen deterministic target → Exploratory (agentic chaos/red-team, nondeterministic, discovery) feeds Scripted (frozen regression); findings graduate, the target stays stable |
| P17 | **The safety invariants are the attack oracle** | A finding = a violated "must-never-happen" invariant → `properties.yaml` defines what counts as a successful attack |
| P18 | **Adversarial runs are sandbox-only** | Blast radius contained by construction → ephemeral, no real money/Fed; safe to let agents go wild |
| P19 | **Failures must be isolated, not cascading** | The architectural promise (D18/D23/D27/D28) → every chaos test asserts blast radius is contained and invariants survive recovery |
| P20 | **Chaos tier tests app-resilience + logical isolation** | Topology is given, not under test → tests outbox/cursor/staleness/reconciliation logic + the authz boundary, not whether the builder invented the architecture |

### Determinism under real chaos (races)

Real faults can't be both real and perfectly deterministic without sim-hooks (rejected, P14). So
race-condition gates use **zero-tolerance over N high-contention runs**:
- Deterministic for a *correct* core (never violates → always passes — a stable target).
- Probabilistic detection for a *buggy* core (a rare race may slip a small N). Failure mode is a
  **false negative, never a false positive.**
- Mitigated by high contention (load, CPU pressure, narrowed timeouts) + large N + the exploratory
  layer continually graduating new repros.

Example — the D28 staleness test pauses the real Payment Hub container (Pumba) until the cursor
genuinely ages out, asserts origination rejects, unpauses, asserts recovery. No faked cursor; the
real detection path.

---

## The "must-never-happen" invariant oracle

Shared by happy-path invariant tests and adversarial tests. Lives in `properties.yaml`.

| Invariant | Attack / chaos tries to… | Source |
|---|---|---|
| Money conservation (Σ balances == FBO == Fed) | double-spend, race the reserve, manipulate inflight | Inv 1,2; D28 |
| Tenant isolation | X's token on Y, IDOR, prefix-spoof routing | Inv 6; D20, D23 |
| Append-only log | tamper / forge / inject events | Inv 8; D4 |
| Floor controls always enforced | disable OFAC/CTR, bypass via trust_level | Inv 3; D11, D22 |
| Origination safety (never approve on stale state) | race the staleness window | Inv 7; D28 |
| Idempotency integrity | key collision, replay race | D6 |
| Auth / webhook integrity | JWT tamper / `alg:none`, HMAC forge, mTLS bypass, replay | D5, D15, D19 |
| PII confidentiality | exfiltrate aggregator PII cross-tenant | D21, D23 |
| Resiliency / availability | cascade a failure, lose data, bottleneck the core | D18/D23/D27 |

---

## Surfaces & sourcing

Tests come from wherever their spec lives:
- **Compliance substrate** — the 27 specced endpoints (cases, incidents, filings, loan-applications,
  loans, tasks, legal-holds, documents, control-results, events). State machines: Case, Incident,
  Filing, LoanApplication, Loan, Task. → sourced from **endpoint + control enumeration**
  (`core-api.yaml`, `controls.json`).
- **Banking core** — Account, AchTransfer, transfers, ACH, wire, ledger; modeled as
  resources-with-states but not yet endpoint-exposed. → sourced from **architecture-decisions.md +
  properties.yaml**, written as executable spec ahead of the endpoints.
- Coverage grows automatically as the upstream loop exposes more (P9).

---

## Open questions / deferred

- **`compliance_floor` designation source** — *bridged.* controls.json carries no floor field
  (0/317), so a conservative seed of non-waivable federal mandates lives in `compliance-floor.yaml`
  (BS-05/LN-11 OFAC, BS-03 CIP, BS-04 CDD, BS-07 CTR, BS-08 SAR, BS-06 monitoring; BS-02/BS-20 held
  as candidates). **Authoritative fix is still upstream**: emit `compliance_floor: true` per control
  in controls.json (legal designation); the seed then shrinks to empty (P9). Needs legal sign-off.
- **The topology contract** — the exact service / port / protocol / env interface the builder's app
  must satisfy to slot into our deployment harness. To be specified from architecture-decisions.md.
- **Graduation mechanics** — how an exploratory finding is distilled into a minimal deterministic
  frozen repro (agent-authored? human-reviewed?).
- **Degenerate controls** — some controls.json `events[]` have output == trigger (nothing to assert);
  need real outputs defined before they're testable.
- **Banking-core endpoints** — tracked until the upstream loop specs them into `core-api.yaml`.
