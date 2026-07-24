# Cassandra Core — Test Catalog

The black-box, language-agnostic test suite that specifies the banking core. Tests drive
the **running core over HTTP** and assert on responses + read-back endpoints
(`/events`, `/control-results`). Tests never import the implementation — the core may be
regenerated in any language and this suite is unchanged.

**Principles**
- **Black-box only.** Drive the built binary over HTTP; never touch internals.
- **Verify through the API, not the database.** If a behavior matters, the spec must
  expose a way to observe it via an endpoint. Anything unobservable is a missing endpoint,
  not a missing test.
- **Hermetic.** `POST /sandbox/reset` between tests; `/sandbox/simulate/*` forces
  deterministic outcomes (D17). No injected clocks, no fakes reaching into the process.

Test IDs are keyed to the architecture decision (`architecture-decisions.md`). Tiers reflect
build order, not importance — see **Priorities** at the bottom.

Legend: `[ ]` not written · `[~]` written, failing (impl absent) · `[x]` written, passing

---

## Tier 1 — Instance BaaS API (black-box, buildable now)

### Cross-cutting contract (D12 Errors, D13 Versioning, D16 Pagination)
Every endpoint inherits these.

- [ ] `D12-T1` single error has `status/type/title/detail/doc_url/request_id` (+ `resource_id/resource_type` when applicable)
- [ ] `D12-T2` validation failure → `type:validation_error` + `errors[]` with per-field `type/field/message`
- [ ] `D12-T3` `request_id` unique per response, usable for support correlation
- [ ] `D13-T1` every response carries `X-API-Version: MAJOR.MINOR.PATCH`
- [ ] `D13-T2` `GET /changelog` returns structured entries
- [ ] `D16-T1` list endpoints return `data` + `pagination{has_more,next_after,limit}`
- [ ] `D16-T2` `?after=<id>` returns next page with no overlap/gap
- [ ] `D16-T3` `limit` bounds enforced
- [ ] `D16-T4` final page → `has_more:false`, `next_after:null`

### Idempotency (D6) — highest-value contract tests
- [ ] `D6-T1` same key + same body → replays cached response + `Idempotent-Replayed: true`, no second resource
- [ ] `D6-T2` same key + different body → `409` `type:idempotency_key_reused`
- [ ] `D6-T3` unknown key proceeds normally (writes record)
- [ ] `D6-T4` missing `Idempotency-Key` on a mutating endpoint → rejected
- [ ] `D6-T5` replay after time advance still replays — keys never expire

### Entities (D1) + Entity state machine (D7)
- [ ] `D1-T1` create person via `/entities/person`
- [ ] `D1-T2` create business via `/entities/business`
- [ ] `D1-T3` create trust via `/entities/trust`
- [ ] `D1-T4` create joint via `/entities/joint`
- [ ] `D1-T5` all appear in unified `GET /entities` with correct `type` discriminator
- [ ] `D1-T6` joint ownership expressed via `owners[]` on the Account, not the Entity
- [ ] `D1-T7` beneficial owner ≥25% recorded as associated person
- [ ] `D7-E1` legal path `PENDING→ACTIVE→DISABLED→ACTIVE→ARCHIVED`; each transition emits expected event
- [ ] `D7-E2` illegal transitions rejected (`ARCHIVED→ACTIVE`, `PENDING→ARCHIVED`)
- [ ] `D7-E3` `lock_type` (NONE/COMPLIANCE/FRAUD/LEGAL/ADMIN) + `dormancy_status` orthogonal — locked entity keeps its state but gates actions

### Accounts & Account Numbers (D2, D20) + state machines (D7)
- [ ] `D2-T1` one Account → multiple Account Numbers, each distinct routing/number pair
- [ ] `D2-T2` `account.*` events vs `account_number.*` events fire on the right object
- [ ] `D2-T3` `informational_entity_id` set for FBO attribution
- [ ] `D20-T1` allocated number is 12 digits = 3 prefix + 8 sequence + 1 check
- [ ] `D20-T2` check digit passes **Luhn**
- [ ] `D20-T3` prefix matches the fintech
- [ ] `D20-T4` `000` reserved for CU-direct
- [ ] `D20-T5` **never-reuse** — cancel + reallocate yields a new number; canceled one never re-issued (stress over many allocations)
- [ ] `D7-A1` Account `OPEN↔FROZEN→CLOSED` legal/illegal transitions
- [ ] `D7-A2` Account Number `ACTIVE↔DISABLED→CANCELED` legal/illegal transitions

### ACH (D8) & Wire (D9) — outcomes forced via D17 simulation
- [ ] `D8-T1` transfer lands in `PENDING_APPROVAL`; response has `effective_date/expected_settlement/window/control_results`
- [ ] `D8-T2` control gate fail → `REJECTED`; success → `SUBMITTED` → (simulate settle) → `SETTLED`
- [ ] `D8-T3` on-us transfer routes as instant **book transfer**, same event model
- [ ] `D8-T4` simulate return → `RETURNED`
- [ ] `D8-T5` `same_day` vs `standard` window honored
- [ ] `D9-T1` wire `PENDING_APPROVAL→SUBMITTED→COMPLETED` happy path
- [ ] `D9-T2` `RETURN_REQUESTED` with each reason (`FRAUD/DUPLICATE/INCORRECT_AMOUNT/INCORRECT_BENEFICIARY`) → `RETURNED`|`COMPLETED`
- [ ] `D9-T3` international/SWIFT wire rejected (domestic only)

### KYC/KYB (D11) — via D17 simulation
- [ ] `D11-T1` simulate KYC approve → entity progresses; deny → blocked
- [ ] `D11-T2` partner-provided attestation honored at declared `trust_level`
- [ ] `D11-T3` **OFAC always runs regardless of trust level** (even `full` trust still screens)

### Card (D10) — via D17 simulation
- [ ] `D10-T1` simulated auth runs balance/velocity/OFAC → APPROVE/DECLINE in canonical response shape
- [ ] `D10-T2` inflight hold on auth → commit on settle / void on decline (multi-balance reflects it)

### Auth (D5) & Rate Limiting (D14)
- [ ] `D5-T1` valid partner token reaches allowed endpoints
- [ ] `D5-T2` token scoped away from an endpoint → `403`
- [ ] `D5-T3` no/invalid token → `401`
- [ ] `D14-T1` each tier (read/write/real-time/bulk) returns `X-RateLimit-Limit/Remaining/Reset/Tier`
- [ ] `D14-T2` at 80% → `X-RateLimit-Warning: approaching_limit`
- [ ] `D14-T3` over limit → `429`
- [ ] `D14-T4` no burst allowance

### Sandbox (D17)
- [ ] `D17-T1` `POST /sandbox/reset` returns instance to empty (test-isolation foundation)
- [ ] `D17-T2` each `/sandbox/simulate/*` endpoint produces its stated outcome
- [ ] `D17-T3` **strict validation** — sandbox rejects the same malformed input prod would
- [ ] `D17-T4` **no magic values** — special account/amount has no effect; only simulation APIs change outcomes

### Events log (D4, instance view)
- [ ] `D4-T1` `/events` append-only — no API path mutates or deletes a past event
- [ ] `D4-T2` events globally ordered, replayable via `?after=`/`?before=` (also D15 backfill path)

### Control Engine (D22)
- [ ] `D22-T1` `compliance_floor:true` control **cannot be disabled** via config (attempt → rejected)
- [ ] `D22-T2` customizable control accepts threshold within `[min,max]`
- [ ] `D22-T3` threshold outside band → rejected
- [ ] `D22-T4` control evaluation surfaces in `control_results` on the gated op and in `/control-results`

---

## Tier 2 — Multi-tenant isolation (D23) — black-box, high compliance value
- [ ] `D23-T1` Fintech X key on Fintech Y instance → `403`/no-access
- [ ] `D23-T2` Fintech X key against the aggregator → no access
- [ ] `D23-T3` CU-admin token → read access to X and Y
- [ ] `D23-T4` cross-fintech entity search impossible at instance; only resolvable at aggregator

---

## Tier 3 — Aggregator layer (D19, D26, D27, D28) — separate surface, exists later

Designed to be testable in isolation by seeding state tables (D28 says so explicitly).

### Origination decision logic (D28)
- [ ] `D28-T1` sufficient `fbo_positions` + clean `bsa_alerts` → originate returns `pending`
- [ ] `D28-T2` insufficient FBO balance → rejected (no reserve applied)
- [ ] `D28-T3` `bsa_alerts` block for entity → rejected
- [ ] `D28-T4` **stale cursor** on payment_hub or bsa_approver → rejected with retry-after
- [ ] `D28-T5` reserve saga: approve decrements balance/increments held; Fed accept clears held; Fed reject restores balance

### Consumers (D27) & BSA (D26)
- [ ] `D27-T1` consumer advances cursor **only after** successful processing; crash mid-batch reprocesses with no double-effect
- [ ] `D27-T2` Payment Hub re-applies FBO updates idempotently (`last_event_sequence` guard)
- [ ] `D26-T1` CTR trigger: a >$10K event creates the alert
- [ ] `D26-T2` duplicate event → `UNIQUE(event_id,alert_type)` yields no duplicate alert
- [ ] `D26-T3` structuring pattern (sub-$10K with history) → flagged `requires_lookback`
- [ ] `D19-T1` async origination returns immediately; status arrives via webhook
- [ ] `D19-T2` `GET /fbo/{id}/position` and `available_balance` reflect reserves

---

## Tier 4 — Money invariants (cross-cutting, highest priority)

Property-style tests run after arbitrary sequences of operations.

- [ ] `INV-1` `Sum(customer balances) == settlement account == FBO sub-account` per fintech
- [ ] `INV-2` `Sum(all FBO sub-accounts) == Fed master balance`
- [ ] `INV-3` every `compliance_floor` control fires on every qualifying operation
- [ ] `INV-5` account numbers never reused (stress: thousands of allocate/cancel cycles)
- [ ] `INV-8` events append-only/immutable after every mutating operation
- [ ] `INV-10` every ledger transaction has an API-observable mirror (no orphans)

---

## Out of scope (not black-box testable yet)
- **D24** admin console — deferred, no surface.
- **D25** infra internals (Supabase HA, DuckDB sync, Blnk Redis) — operational. Only the
  reconciliation heartbeat is observable → covered by `INV-10`.
- **D15** webhook retry schedule/HMAC timing — needs a webhook *sink*; signature
  verification + backfill (`/events`) are testable, the 24-hour backoff timing is an
  integration test.
- **D21** aggregator event PII encryption-at-rest — storage concern, not API-observable.

---

## Priorities (highest value per effort, buildable against the instance API today)
1. Idempotency (D6) + error contract (D12) + pagination (D16)
2. State machines (D7) — entity, account, account-number
3. Account-number Luhn + never-reuse (D20-T2, D20-T5)
4. Money invariants (Tier 4)
5. Control floor enforcement (D22-T1) + OFAC-always (D11-T3)

Tier 3 (aggregator) waits on that layer being built.
