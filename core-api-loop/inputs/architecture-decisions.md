# Cassandra Banking Core Architecture Decision Log

**Prepared for:** Pynthia Credit Union  
**Date:** February 20, 2026  
**Version:** 1.1

---

## Executive Summary

This document captures 28 architectural decisions for the Cassandra core banking system. The architecture supports a vertically integrated credit union (Pynthia) with the ability to white-label the BaaS core to other credit unions. Each credit union hosts its own instance, and each fintech partner operates on a fully isolated instance with an aggregator layer providing cross-fintech visibility for compliance and Fed settlement.

Key architectural patterns include: instance-per-fintech isolation, centralized payment hub at the aggregator layer, PostgreSQL append-only event logs (replacing Kafka), Blnk Deploy + Supabase as the managed infrastructure layer, and a control engine with compliance floor enforcement.

**Core architectural insight (v1.1):** Consumers are state builders — they read events and maintain materialized views (FBO positions, BSA alerts, 5300 aggregations). The Origination API is the decision maker — it queries the state consumers have built to approve or reject payments. This separation is why PostgreSQL works as the event infrastructure and Kafka isn't needed: the whole system is append events, materialize views, query views at decision time. That's what relational databases are built for.

---

## Decision Summary

| # | Decision | Choice |
|---|----------|--------|
| 1 | Entity Hierarchy | Hybrid (unified `/entities` namespace, separate creation endpoints per type) |
| 2 | Account â†” Account Number | 1:Many (one ledger account, multiple account numbers) |
| 3 | Ledger Architecture | Multi-Balance (Blnk) + Shadow Bookkeeping Layer for 5300/FBO |
| 4 | Event Architecture | PostgreSQL append-only event log + consumer cursors (Kafka eliminated) |
| 5 | Auth Model | Server-to-Server now, Delegated tokens Phase 2 |
| 6 | Idempotency | Header-based, never expires, pass-through to Blnk, 409 on different args |
| 7 | State Machines | Minimal states, controls as gates |
| 8 | ACH Processing | Semi-transparent, explicit approval, book transfer for internal |
| 9 | Wire Transfer | Domestic only with return requests |
| 10 | Card Issuing | BIN sponsorship via Marqeta/Lithic with adapter pattern |
| 11 | KYC/KYB | Multi-provider adapter, partners can bring their own |
| 12 | Error Format | Increase-style + request_id + doc_url |
| 13 | API Versioning | Semantic versioning with programmatic changelog |
| 14 | Rate Limiting | Per-partner, tiered by endpoint, 80% warning, no burst |
| 15 | Webhook Delivery | Exponential backoff, 24-hour retry, at-least-once, HMAC-SHA256 |
| 16 | Pagination | Transparent cursor (ID-based) |
| 17 | Sandbox Behavior | Separate URL, no magic values, realistic Fed timing, simulation APIs, strict validation |
| 18 | Multi-Tenancy Model | Instance-per-fintech with Aggregator layer |
| 19 | Aggregator API Design | Async origination, implicit reserve, webhook + pull fallback, mTLS + JWT auth |
| 20 | Account Number Allocation | 12-digit format (3 prefix + 8 sequence + 1 Luhn), aggregator allocates ranges, never reuse |
| 21 | Aggregator Event Schema | Full PII at aggregator (encrypted at rest), full transaction details, per-entity ordering |
| 22 | Control Engine Distribution | Compliance floor flag, force push updates, credit union-only customization |
| 23 | Instance-to-Instance Isolation | Full isolation between fintechs, CU direct access, cross-fintech search via aggregator |
| 24 | Credit Union Admin Console | Deferred |
| 25 | Managed Infrastructure Layer | Blnk Deploy + Supabase (instance and aggregator) |
| 26 | BSA Engine Split | BSA Approver (real-time) + BSA Reporter (scheduled/DuckDB) |
| 27 | Aggregator Consumer Architecture | Four independent cursor-based consumers |
| 28 | Origination API Pattern | Stateless decision maker querying consumer-built state |

---

## Architecture Overview

```
AGGREGATOR LAYER
================

  Origination API (stateless decision maker)
  Queries consumer state -> approves/rejects payments
      |
      | reads from
      v
  Supabase PostgreSQL (primary, HA standby)
  +-------------------+-------------------+-------------------+-------------------+
  | events            | fbo_positions     | bsa_alerts        | consumer_cursors  |
  | (append-only,     | (Payment Hub      | (BSA Approver     | (4 consumers)     |
  |  immutable)       |  writes)          |  writes)          |                   |
  +-------------------+-------------------+-------------------+-------------------+
      |
      | four independent consumers read with own cursors
      v
  +------------------+  +------------------+  +------------------+  +------------------+
  | Payment Hub      |  | BSA Approver     |  | BSA Reporter     |  | 5300 Reporter    |
  | (real-time)      |  | (real-time)      |  | (scheduled)      |  | (scheduled)      |
  | queries PG       |  | queries PG       |  | queries DuckDB   |  | queries DuckDB   |
  | -> fbo_positions |  | -> bsa_alerts    |  | -> lookback rpts |  | -> 5300 reports  |
  +------------------+  +------------------+  +------------------+  +------------------+
                                                      |                    |
  DuckDB (synced from Supabase PG)  <-----------------+--------------------+
  Serves: BSA lookbacks, 5300 aggregations, examiner queries
  Also queries S3 Parquet for archived years

  Supabase Storage (S3-compatible)
  WAL archives + monthly Parquet exports (7-10 year BSA retention)

  Fed Master Account (Single routing number: 271070801)

================
  Account number prefix routing
================
        |                           |                           |
        v                           v                           v
  FINTECH X INSTANCE          FINTECH Y INSTANCE          FINTECH Z INSTANCE
  Account #s: 001-XXXXXXXX-C  002-XXXXXXXX-C              003-XXXXXXXX-C

  Each instance contains:

  Blnk Deploy (fully managed, opaque)
    | webhooks
    v
  BaaS API + Control Engine
    | writes
    v
  Supabase (entities, txn mirror, bookkeeping, outbox)
    | outbox pushes events to aggregator
    | sync
    v
  DuckDB (aggregate control evaluation, synced from local Supabase)
```

### Aggregator Layer Components

| Component | Responsibility |
|-----------|----------------|
| Origination API | Stateless decision maker — queries consumer state to approve/reject payments |
| Payment Hub (consumer) | Maintains FBO positions by processing transaction events |
| BSA Approver (consumer) | Real-time cross-fintech pattern detection, CTR triggers, structuring alerts |
| BSA Reporter (consumer) | Scheduled lookback analysis via DuckDB — SAR preparation, 90-day patterns |
| 5300 Reporter (consumer) | Scheduled aggregated regulatory reporting via DuckDB |
| Supabase PostgreSQL | Append-only event log + consumer state tables (FBO positions, BSA alerts, cursors) |
| DuckDB | Analytical layer synced from PG — serves scheduled consumers and examiner queries |
| Supabase Storage | S3-compatible archive for WAL + monthly Parquet exports (7-10 year retention) |
| Admin Console | SSO provider, meta-dashboard (deferred) |

### Fintech Instance Components

| Component | Description |
|-----------|-------------|
| Blnk Deploy | Fully managed double-entry ledger (opaque — REST API + webhooks only) |
| BaaS API | Glue layer — receives Blnk webhooks, calls Blnk API, writes to Supabase |
| Control Engine | 223 base controls, customizable by credit union only |
| Supabase | Entities, accounts, transaction mirror, bookkeeping entries, events outbox |
| DuckDB | Analytical layer synced from local Supabase for aggregate control evaluation |

### Data Flow on a Transaction

```
Fintech calls POST /transfers
  -> BaaS API validates, writes idempotency key to Supabase
  -> BaaS API calls Blnk Deploy API to create transaction
  -> Blnk processes internally (their Redis + PG)
  -> Blnk fires webhook to BaaS API
  -> BaaS API writes transaction mirror + bookkeeping to Supabase
  -> Control Engine evaluates (queries DuckDB for aggregates)
  -> BaaS API writes event to Supabase outbox
  -> Supabase database webhook pushes event to aggregator
  -> BaaS API fires webhook to fintech partner
```

---

## Key Invariants

1. `Sum(Fintech X customer balances) == Fintech X Settlement Account == Aggregator FBO sub-account for X`
2. `Sum(all FBO sub-accounts) == Fed Master Account balance`
3. All `compliance_floor` controls always enforced (cannot be disabled)
4. All instances on same version (force push)
5. Account numbers never reused
6. Fintechs fully isolated (no awareness of each other)
7. Origination API never approves payments when consumer cursors are stale (v1.1)
8. Events table is append-only and immutable — no updates, no deletes (v1.1)
9. Consumer cursors advance only after successful processing (v1.1)
10. Every transaction in Blnk Deploy has a corresponding mirror in the instance's Supabase (v1.1)

---

## Detailed Decisions

### Decision 1: Entity Hierarchy

**Choice:** Hybrid (unified `/entities` namespace, separate creation endpoints per type)

**Details:**
- Unified `/entities` namespace with type discriminator
- Separate creation endpoints: `/entities/person`, `/entities/business`, `/entities/trust`, `/entities/joint`
- Joint accounts via `owners[]` array on Account (not Entity level)
- Beneficial owners as associated persons (25% FinCEN threshold)

**Rationale:** Credit unions serve all entity types as first-class; unified vocabulary simplifies controls; type-safe validation at authoring time.

**Affected Controls:** CDD (CD-01 to CD-12), BSA (BA-03, BA-04), Fair Lending (FL-01 to FL-14), Collections (LC-03)

---

### Decision 2: Account â†” Account Number

**Choice:** 1:Many (one ledger account, multiple account numbers)

**Details:**
```
Account (regulatory reporting)
â”œâ”€â”€ Account Number 1 (Fintech Partner A)
â”œâ”€â”€ Account Number 2 (Fintech Partner B)
â””â”€â”€ Account Number 3 (Direct member access)
```
- Each Account Number has distinct routing/account number pair
- `informational_entity_id` for FBO attribution
- Events: `account.*` (ledger) vs `account_number.*` (routing/external)

**Rationale:** BaaS/FBO use caseâ€”one master account for 5300 reporting, dedicated account numbers per partner for reconciliation; transaction monitoring aggregates at Account level, attributes at Account Number level.

**Affected Controls:** BSA/AML (BA-05 to BA-10), 5300 reporting, CDD (CD-06 to CD-09)

---

### Decision 3: Ledger Architecture

**Choice:** Multi-Balance (Blnk) + Shadow Bookkeeping Layer

**Blnk provides:**
- Double-entry ledger with immutable records
- Multi-balance fields: `balance`, `credit_balance`, `debit_balance`, `inflight_balance`, `inflight_credit_balance`, `inflight_debit_balance`
- Inflight transactions (authorization holds)
- Historical balances & snapshots
- Reconciliation engine

**Bookkeeping layer provides:**
- 5300 account code tagging (`025B`, `CH####`, `schedule_a.*`)
- FBO classification (`commingled_cash` vs `customer_balance`)
- `locked_amount` for BSA/compliance holds (separate from Blnk inflight)
- Audit entries for regulatory reporting

**Implementation:** On every Blnk transaction webhook, write to `bookkeeping_entries` table with 5300 attribution.

**Rationale:** Blnk gapâ€”no native FBO segregation or 5300 tagging; bookkeeping layer enables real-time 5300 dashboard and cross-schedule validations.

---

### Decision 4: Event Architecture

**Choice:** PostgreSQL append-only event log + consumer cursors (Kafka eliminated)

**Supersedes:** v1.0 "Centralized Event Bus (technology TBD)"

**Architecture — Two tiers of event transport:**

*Within each fintech instance:*
- Blnk Deploy webhooks fire to BaaS API on transaction state changes
- BaaS API writes transaction mirror + bookkeeping entries to local Supabase
- DuckDB synced from local Supabase for aggregate control evaluation
- Events written to local outbox table, pushed to aggregator via HTTP POST

*Instance → Aggregator:*
- Each instance pushes events to the aggregator's central `events` table via HTTP
- Append-only, immutable PostgreSQL table serves as the durable ordered event log
- Four independent consumers read from the same table at their own pace using cursor tracking
- Deduplication at aggregator via `event_id UNIQUE` constraint

**Aggregator schema:**
```sql
CREATE TABLE events (
  sequence_id BIGSERIAL PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  instance_id TEXT NOT NULL,
  entity_hash TEXT NOT NULL,        -- SSN/EIN hash for per-entity ordering
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,  -- source timestamp
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE consumer_cursors (
  consumer_name TEXT PRIMARY KEY,
  last_sequence_id BIGINT NOT NULL DEFAULT 0,
  last_processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'running'
);
```

**Consumer pattern:** Each consumer follows: read cursor → fetch batch → process → advance cursor (only after success). Consumers are idempotent — reprocessing the same event produces the same result.

**Exactly-once semantics via PostgreSQL transactions:**
```sql
BEGIN;
  -- Process event (e.g., create alert)
  INSERT INTO bsa_alerts (...) ON CONFLICT (event_id, alert_type) DO NOTHING;
  -- Advance cursor atomically with processing
  UPDATE consumer_cursors SET last_sequence_id = $1, last_processed_at = now()
  WHERE consumer_name = 'bsa_approver';
COMMIT;
```

**Rationale:** Applied Elon's 5-step algorithm to the Kafka requirement:
1. *Question:* Why Kafka? Durability, ordering, replay, multiple consumers. PostgreSQL already satisfies all four.
2. *Delete:* No distributed commit log needed — instance-per-fintech with single aggregator, not millions of events/sec.
3. *Simplify:* An append-only table *is* a commit log. `sequence_id` gives global ordering. `WHERE sequence_id > $cursor` gives replay.
4. *Accelerate:* Buildable in a day vs. standing up Kafka cluster.
5. *Automate:* If volume proves PostgreSQL insufficient, migration to Kafka is straightforward — change transport from HTTP POST to Kafka produce. Consumers already think in cursors.

**What you give up vs Kafka:** Horizontal throughput (PostgreSQL ~tens of thousands inserts/sec vs Kafka millions). But with 5 fintechs at 100 transactions/min = 500 events/min. PostgreSQL handles this without breaking a sweat.

**What you gain:** No ZooKeeper/KRaft, no broker management, no topic configuration, no consumer group rebalancing, no schema registry, no separate monitoring stack. Just SQL in infrastructure you already run.

**Reliability chain:**
- Instance outbox retries until aggregator acknowledges → no lost events
- Aggregator Supabase with HA standby → automatic failover on crash
- WAL archiving to S3 → point-in-time recovery for catastrophic failure
- Append-only immutable events → audit-ready, examiner-queryable with SQL

**Monitoring (three alerts cover all failure modes):**
1. Consumer staleness: if any cursor's `last_processed_at` > 60 seconds ago → alert
2. Event delivery gap: if `max(sequence_id) - cursor > 1000` → consumer falling behind
3. Ingest gap: if no new events from instance X in > 5 minutes → outbox may be stuck

**Revisit trigger:** When the number of independent consumers exceeds what a read replica can serve, or when operational burden of partition management becomes significant.

---

### Decision 5: Auth Model

**Choice:** Server-to-Server now, Delegated tokens Phase 2

**Details:**
- Phase 1: Partner tokens scoped to `partner_id`, allowed endpoints, rate limits
- Phase 2: Customer tokens scoped to `entity_id`, `account_ids[]`, permissions
- Internal roles (compliance_officer, etc.) handled separately

**Rationale:** Simpler launch; most BaaS partners proxy requests; delegation adds complexity deferred to Phase 2.

---

### Decision 6: Idempotency

**Choice:** Header-based, never expires, pass-through to Blnk, 409 on different args

**Details:**
- `Idempotency-Key` header required, maps to Blnk `reference` field
- Keys never expire, never reusable
- Same key + same args â†’ return cached response + `Idempotent-Replayed: true` header
- Same key + different args â†’ 409 Conflict with `idempotency_key_reused` error

**Implementation:**
```sql
CREATE TABLE idempotency_keys (
  idempotency_key TEXT PRIMARY KEY,
  partner_id TEXT,
  endpoint TEXT,
  request_hash TEXT,  -- SHA-256 of normalized body
  response_status INT,
  response_body JSONB,
  blnk_reference TEXT,
  created_at TIMESTAMPTZ
);
```

---

### Decision 7: State Machines

**Choice:** Minimal states, controls as gates

**Details:**
```
Entity:        PENDING â†’ ACTIVE â†” DISABLED â†’ ARCHIVED
Account:       OPEN â†” FROZEN â†’ CLOSED
Account Number: ACTIVE â†” DISABLED â†’ CANCELED
ACH Transfer:  PENDING_APPROVAL â†’ SUBMITTED â†’ SETTLED â†’ RETURNED
                     â†“               â†“
                 REJECTED        CANCELED
```
- Orthogonal flags: `lock_type` (NONE, COMPLIANCE, FRAUD, LEGAL, ADMIN), `dormancy_status`
- Events emitted on transitions for control triggers

**Rationale:** "Controls are the primitive" philosophy; state machines are dumb, intelligence in controls; avoids encoding business logic in states.

---

### Decision 8: ACH Processing

**Choice:** Semi-transparent, explicit approval, book transfer for internal

**Details:**
- Expose timing/windows, you control routing
- `PENDING_APPROVAL` state, control engine gates (BA-07, BA-08, velocity limits)
- Book transfer (instant) for on-us, same event model

**Flow:**
```
Partner Request â†’ PENDING_APPROVAL â†’ Control Engine â†’ SUBMITTED â†’ SETTLED
                        â†“                                    â†“
                    REJECTED                             RETURNED
```

**Response includes:** `effective_date`, `expected_settlement`, `window` (standard/same_day), `control_results`

---

### Decision 9: Wire Transfer

**Choice:** Domestic only with return requests

**Details:**
- Fed wire support, wire return request API, no SWIFT

**State machine:**
```
PENDING_APPROVAL â†’ SUBMITTED â†’ COMPLETED
      â†“               â†“              â†“
  REJECTED       CANCELED    RETURN_REQUESTED â†’ RETURNED | COMPLETED
```

**Return request reasons:** `FRAUD`, `DUPLICATE`, `INCORRECT_AMOUNT`, `INCORRECT_BENEFICIARY`

---

### Decision 10: Card Issuing

**Choice:** BIN sponsorship via Marqeta/Lithic with adapter pattern

**Architecture:**
```
Card Processor (Marqeta/Lithic)
  â†“ Real-time auth webhook (2 sec timeout)
Card Adapter (translate to canonical format)
  â†“
Control Engine (balance check, velocity, OFAC, fraud, BSA)
  â†“ APPROVE/DECLINE
Blnk Ledger (inflight â†’ commit/void)
```

**Adapter interface:**
```typescript
interface CardProcessorAdapter {
  parseAuthRequest(raw): CardAuthRequest;
  formatAuthResponse(decision): unknown;
  createCard, activateCard, freezeCard, closeCard;
}
```

---

### Decision 11: KYC/KYB

**Choice:** Multi-provider adapter, partners can bring their own

**Providers:** Alloy, Persona, Socure, Middesk, partner-provided

**Partner brings their own:**
```yaml
partner:
  kyc_config:
    provider: "partner_provided"
    partner_kyc_webhook: "https://partner.com/kyc/webhook"
    trust_level: "full" | "verify_watchlist_only"
```

**Flow:** Partner verifies with their KYC â†’ sends attestation to Cassandra â†’ control engine evaluates trust level â†’ always run OFAC regardless.

---

### Decision 12: Error Format

**Choice:** Increase-style + request_id + doc_url

**Single error:**
```json
{
  "status": 422,
  "type": "insufficient_funds",
  "title": "Insufficient Funds",
  "detail": "Account acct_456 has available balance of $50.00...",
  "doc_url": "https://api.cassandra.bank/docs/errors/insufficient-funds",
  "request_id": "req_abc123def456",
  "resource_id": "transfer_789",
  "resource_type": "transfer"
}
```

**Multiple validation errors:**
```json
{
  "status": 400,
  "type": "validation_error",
  "errors": [
    { "type": "required_field", "field": "amount", "message": "..." },
    { "type": "invalid_format", "field": "destination.routing_number", "message": "..." }
  ]
}
```

---

### Decision 13: API Versioning

**Choice:** Semantic versioning with programmatic changelog

**Details:**
- Format: `MAJOR.MINOR.PATCH` (e.g., `2.1.3`)
- Breaking changes increment MAJOR with migration notice
- Response header: `X-API-Version: 2.1.3`
- Programmatic changelog endpoint: `GET /changelog`

---

### Decision 14: Rate Limiting

**Choice:** Per-partner, tiered by endpoint, 80% warning, no burst

**Tiers:**
| Tier | Limit | Endpoints |
|------|-------|-----------|
| Read | 500/min | `GET /accounts`, etc. |
| Write | 100/min | `POST /transfers`, etc. |
| Real-time | 1,000/min | Card auth responses |
| Bulk | 10/min | `POST /transfers/ach/batch` |

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 73
X-RateLimit-Reset: 1706043600
X-RateLimit-Tier: write
X-RateLimit-Warning: approaching_limit  # at 80%
```

---

### Decision 15: Webhook Delivery

**Choice:** Exponential backoff, 24-hour retry, at-least-once, HMAC-SHA256

**Retry schedule:** 12 attempts over 24 hours (immediate, 30s, 1m, 2m, 5m, 15m, 30m, 1h, 2h, 4h, 8h, 8h)

**After 24 hours:** Drop event, alert partner, provide backfill endpoint `GET /events?after=...&before=...`

**Signature:** `X-Cassandra-Signature: t=1706043600,v1=<hmac-sha256>`

---

### Decision 16: Pagination

**Choice:** Transparent cursor (ID-based)

**Request:** `GET /transfers?limit=100&after=transfer_789`

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "has_more": true,
    "next_after": "transfer_889",
    "limit": 100
  }
}
```

---

### Decision 17: Sandbox Behavior

**Choice:** Separate URL, no magic values, realistic Fed timing, simulation APIs, strict validation

**Details:**
1. **Separate URL** â€” `sandbox.api.cassandra.bank` vs `api.cassandra.bank`
2. **No magic values** â€” Outcomes controlled entirely via simulation APIs
3. **Realistic Fed timing by default** â€” Simulation endpoints to accelerate settlement
4. **Forced outcomes via simulation APIs** â€” KYC, ACH, wire, card (Unit-style)
5. **Production-matching validation** â€” No relaxed validation

**Simulation endpoints:**
```yaml
POST /sandbox/simulate/kyc/approve
POST /sandbox/simulate/kyc/deny
POST /sandbox/simulate/ach/receive
POST /sandbox/simulate/ach/settle
POST /sandbox/simulate/ach/return
POST /sandbox/simulate/wire/receive
POST /sandbox/simulate/wire/settle
POST /sandbox/simulate/card/authorize
POST /sandbox/simulate/card/settle
POST /sandbox/simulate/time/advance
POST /sandbox/reset
```

---

### Decision 18: Multi-Tenancy Model

**Choice:** Instance-per-fintech with Aggregator layer

**Details:**
- Fully isolated stack per fintech: Blnk Deploy (managed ledger) + Supabase (application state) + DuckDB (analytics)
- Aggregator layer per credit union: Supabase (event log + consumer state) + DuckDB (5300/BSA analytics)
- Single Fed master account and routing number per credit union
- Account number prefix routes inbound payments to correct fintech instance
- Pynthia operates as managed service

**Instance stack (per fintech):**
```
Blnk Deploy (fully managed, opaque)
├── Their PostgreSQL, Redis, Typesense
├── REST API for ledger operations
└── Webhooks out → your BaaS API

Supabase (your application, you own all data)
├── Entities, accounts, account numbers
├── Transaction mirror (from Blnk webhooks)
├── Bookkeeping entries (5300 tags)
├── Control Engine state
└── Events outbox → aggregator

DuckDB (analytical layer)
└── Watermark synced from YOUR Supabase PostgreSQL
```

**Rationale:** Limits blast radius (fintech issues don't affect others), simplifies compliance isolation, enables per-fintech scaling. Blnk Deploy becomes a pure ledger service — all intelligence (controls, analytics, reporting, compliance) runs against your own data in Supabase.

---

### Decision 19: Aggregator API Design

**Choice:** Async origination, implicit reserve, webhook + pull fallback, mTLS + JWT auth

**Payment origination:** Returns `pending` immediately, webhooks status updates

**Reserve pattern:** Implicit (atomic check + hold + queue), explicit prepare/confirm for large wires

**Inbound routing:** Webhook push with pull fallback, 24-hour retry

**Instance auth:** mTLS (transport) + short-lived JWT (application), 1-hour token expiry

**Aggregator API Surface:**
```yaml
POST   /payments/ach/originate
POST   /payments/wire/originate
POST   /payments/wire/prepare
POST   /payments/wire/confirm
POST   /payments/rtp/originate
GET    /fbo/{instance_id}/position
GET    /fbo/{instance_id}/available_balance
GET    /inbound/{instance_id}
POST   /auth/token
```

---

### Decision 20: Account Number Allocation

**Choice:** 12-digit format (3 prefix + 8 sequence + 1 Luhn), aggregator allocates ranges, never reuse

**Format:**
```
Position:    1  2  3  â”‚  4  5  6  7  8  9 10 11  â”‚ 12
             â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€
             Fintech  â”‚       Sequence           â”‚Check
```

**Capacity:**
- Fintechs per credit union: 999 (001-999, 000 reserved for CU direct)
- Accounts per fintech: 100 million
- Total accounts per credit union: ~100 billion

---

### Decision 21: Aggregator Event Schema

**Choice:** Full PII at aggregator (encrypted at rest), full transaction details, per-entity ordering

**Rationale:** Simplest architecture that meets BSA/AML requirements. Hashing adds complexity without reducing compliance obligations.

**Event schema:**
```json
{
  "event_id": "evt_instance_123",
  "event_type": "transaction.created",
  "instance_id": "fintech_x",
  "timestamp": "2026-01-26T15:30:00Z",
  "entity": {
    "entity_id": "ent_123",
    "ssn": "123-45-6789",
    "name_first": "John",
    "name_last": "Doe"
  },
  "transaction": {
    "transaction_id": "txn_456",
    "amount": 9000,
    "type": "ach_credit",
    "direction": "inbound"
  }
}
```

**Ordering:** Per-entity ordering via `entity_hash` column in PostgreSQL events table. Each entity lives in exactly one fintech instance (Decision 23), so an entity's events all come from the same instance, through the same outbox worker, in sequence. The `created_at` timestamp from the source instance is authoritative for that entity.

**Storage:** Events stored in append-only PostgreSQL table at aggregator (see Decision 4). `sequence_id BIGSERIAL` provides global ordering. Consumers query by `entity_hash` for per-entity views. Monthly partitions archived to S3 as Parquet for 7-10 year BSA retention; DuckDB queries both hot partitions and cold S3 storage seamlessly.

---

### Decision 22: Control Engine Distribution

**Choice:** Compliance floor flag, force push updates, credit union-only customization

**Details:**
- 223 base controls defined by Pynthia
- `compliance_floor: true` controls cannot be disabled or weakened
- Force push: All instances get updates immediately
- Credit unions can customize non-floor controls and add custom controls
- Fintechs inherit credit union controls without modification

**Control schema:**
```yaml
control:
  id: BA-05
  name: OFAC Screening
  compliance_floor: true

control:
  id: VL-01
  name: Daily ACH Velocity
  compliance_floor: false
  customizable:
    threshold:
      default: 10000
      min: 5000
      max: 50000
```

---

### Decision 23: Instance-to-Instance Isolation

**Choice:** Full isolation between fintechs, CU direct access, cross-fintech search via aggregator

**Access matrix:**

| Actor | Fintech X Instance | Fintech Y Instance | Aggregator |
|-------|-------------------|-------------------|------------|
| Fintech X API key | âœ… Full access | âŒ No access | âŒ No access |
| Fintech Y API key | âŒ No access | âœ… Full access | âŒ No access |
| Credit Union admin | âœ… Read access | âœ… Read access | âœ… Full access |
| Pynthia operations | âœ… Full access | âœ… Full access | âœ… Full access |

**Cross-fintech search:** Via aggregator only (which has full PII from event stream).

---

### Decision 24: Credit Union Admin Console

**Choice:** Deferred

**Notes:** Will need to address single pane of glass vs. separate apps, instance drill-down UX, and authentication flow (aggregator as SSO provider vs. external IdP).

---

### Decision 25: Managed Infrastructure Layer

**Choice:** Blnk Deploy + Supabase (at both instance and aggregator levels)

**Added in:** v1.1

**Blnk Deploy** ($200-$1,200/mo) provides:
- Fully managed double-entry ledger — they host PostgreSQL, Redis, Typesense
- REST API for all ledger operations
- Webhooks on transaction state changes (`transaction.applied`, `transaction.rejected`, `transaction.inflight`)
- Opaque infrastructure — no direct database access

**Supabase** provides (per instance and at aggregator):
- Managed PostgreSQL with automatic daily backups and WAL archiving
- Database webhooks (can replace outbox worker for event push to aggregator)
- Supabase Storage (S3-compatible for Parquet archives)
- Auth with JWT (relevant for server-to-server auth model)
- Realtime feature (logical replication, potential push-based DuckDB sync)

**DuckDB** provides (per instance and at aggregator):
- Columnar analytical queries over Supabase PostgreSQL data
- Native Parquet/S3 query capability for archived data
- Zero contention with primary PostgreSQL (separate process, own memory)

**Key insight:** Blnk Deploy becomes a pure ledger service. Every transaction is written twice — once in Blnk's ledger (authoritative double-entry record) and once in your Supabase (the mirror your controls and reporting run against). Different concerns, different databases.

**Webhook reliability compensation:** Because Blnk Deploy is opaque, you cannot inspect their Redis webhook queue. Build a reconciliation heartbeat — a periodic job (every 1-5 minutes) that calls Blnk's transaction list API and compares against your Supabase mirror. Any transaction in Blnk not in Supabase gets pulled and written. Belt and suspenders.

**Rationale:** Eliminates operational burden of managing PostgreSQL, Redis, Typesense, backup configuration, WAL archiving, and HA standby setup. Team focuses on DuckDB sync layer and application logic. Supabase is standard PostgreSQL underneath, so migration to self-managed RDS is straightforward if needed at scale.

**Concern to monitor:** Supabase is designed for application backends, not financial infrastructure. Validate HA failover SLA, SOC 2 Type II compliance posture for NCUA examiners, connection limits under multiple concurrent workers, and egress bandwidth for DuckDB sync volume.

---

### Decision 26: BSA Engine Split

**Choice:** BSA Approver (real-time) + BSA Reporter (scheduled)

**Added in:** v1.1 — Replaces single "BSA Engine" from v1.0

**BSA Approver** (real-time consumer):
- Same staleness requirements as Payment Hub — if stalled, origination API applies extra caution
- Evaluates every event as it arrives: CTR triggers (>$10K), structuring patterns (just under $10K with history), cross-fintech entity activity
- Writes to `bsa_alerts` table with idempotent inserts: `UNIQUE(event_id, alert_type)` prevents duplicates
- Queries aggregator Supabase PostgreSQL directly for lightweight cross-fintech checks
- Flags items for Reporter investigation via `requires_lookback = true`

**BSA Reporter** (scheduled consumer, DuckDB):
- Runs batch analyses on schedule: daily structuring sweeps, weekly SAR candidate reviews, monthly trend reports
- Queries DuckDB for 90-day lookback analysis, cross-entity network analysis
- Also queries S3 Parquet for archived years
- Picks up Approver flags, runs deep historical analysis, escalates to `sar_candidate` or clears
- If it crashes, reruns the batch — no real-time impact

**Interaction pattern:**
```
Event arrives
  → BSA Approver (real-time):
      CTR threshold? → auto-file alert
      Structuring pattern? → flag for lookback
      Cross-fintech hit? → flag for lookback
  
  → BSA Reporter (scheduled, DuckDB):
      Pick up flagged alerts
      Run 90-day entity analysis
      Run cross-entity network analysis
      Escalate or clear
```

**BSA alerts schema:**
```sql
CREATE TABLE bsa_alerts (
  alert_id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  entity_hash TEXT NOT NULL,
  details JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  requires_lookback BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, alert_type)
);
```

**Rationale:** The Approver and Reporter have fundamentally different reliability requirements. Coupling them means the stricter requirement governs both. If the lookback query crashes, a single combined BSA Engine restarts from its cursor — real-time alerting reprocesses events it already handled successfully. Splitting them gives independent failure modes and prevents analytical queries from bottlenecking real-time alerting.

This mirrors how BSA actually works operationally: automated screens flag suspicious activity (Approver), then analysts investigate flags in depth (Reporter).

---

### Decision 27: Aggregator Consumer Architecture

**Choice:** Four independent cursor-based consumers

**Added in:** v1.1

**Consumers:**
```sql
INSERT INTO consumer_cursors VALUES 
  ('payment_hub',   0, now(), 'running'),
  ('bsa_approver',  0, now(), 'running'),
  ('bsa_reporter',  0, now(), 'running'),
  ('5300_reporter', 0, now(), 'running');
```

| Consumer | Mode | Data Source | Output |
|----------|------|-------------|--------|
| Payment Hub | Real-time | Supabase PG | `fbo_positions` table |
| BSA Approver | Real-time | Supabase PG | `bsa_alerts` table |
| BSA Reporter | Scheduled | DuckDB + S3 Parquet | Lookback results, SAR candidates |
| 5300 Reporter | Scheduled | DuckDB + S3 Parquet | Regulatory reports |

**Universal consumer loop:**
1. Read cursor position
2. `SELECT * FROM events WHERE sequence_id > $cursor ORDER BY sequence_id LIMIT $batch`
3. Process the batch
4. `UPDATE consumer_cursors SET last_sequence_id = $last` (only after step 3 succeeds)
5. Repeat

**Critical rule:** Step 4 only happens after step 3 fully succeeds. If consumer crashes mid-batch, it restarts from last committed cursor and reprocesses. All consumers must be idempotent.

**Crash behavior per consumer:**

*Payment Hub dies:* Restarts from cursor, reprocesses FBO position updates. Each update checks `last_event_sequence` on the position record — duplicates are safe. Origination API detects staleness, halts outbound payments until caught up.

*BSA Approver dies:* Restarts from cursor, re-evaluates events. `UNIQUE(event_id, alert_type)` constraint prevents duplicate alerts via `ON CONFLICT DO NOTHING`.

*BSA Reporter dies:* Reruns its batch analysis. No real-time impact — output is computed artifacts.

*5300 Reporter dies:* Same as BSA Reporter — regenerates reports from scratch.

*Aggregator Supabase itself crashes:* All consumers stall. Fintech instances can't deliver events (HTTP POST fails). Events accumulate in instance outboxes with `delivered_at IS NULL`. After recovery (managed PostgreSQL automatic failover), all committed events are intact (WAL guarantee). Consumers resume from cursors. Instance outbox workers retry undelivered events.

**FBO positions schema:**
```sql
CREATE TABLE fbo_positions (
  instance_id TEXT PRIMARY KEY,
  balance BIGINT NOT NULL DEFAULT 0,
  held_amount BIGINT NOT NULL DEFAULT 0,
  last_event_sequence BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Rationale:** Every component is independently restartable. Every consumer resumes from its last cursor. Every write is idempotent. The only shared dependency is Supabase PostgreSQL, which is managed with automatic failover. No Kafka, no message broker, no coordination between consumers.

---

### Decision 28: Origination API Pattern

**Choice:** Stateless decision maker querying consumer-built state

**Added in:** v1.1

**Core insight:** Consumers are state builders — they read events and maintain materialized views (FBO positions, BSA alerts, 5300 aggregations). They don't make decisions. They don't block anything. They just keep their tables current. The Origination API is the decision maker — it's stateless itself, reads from the tables consumers maintain, applies decision logic, and acts.

**Payment origination flow:**
```
Fintech Instance calls POST /payments/ach/originate
  │
  ├── 1. Check FBO position
  │     SELECT balance FROM fbo_positions WHERE instance_id = ?
  │     → Sufficient funds?
  │
  ├── 2. Check BSA clearance
  │     SELECT * FROM bsa_alerts WHERE entity_hash = ? AND status = 'block'
  │     → Entity blocked or flagged?
  │
  ├── 3. Check consumer freshness
  │     SELECT last_processed_at FROM consumer_cursors
  │     WHERE consumer_name IN ('payment_hub', 'bsa_approver')
  │     → Both consumers current? If stale, reject with retry-after.
  │
  ├── 4. All clear → Reserve funds (atomic)
  │     UPDATE fbo_positions
  │     SET balance = balance - amount, held_amount = held_amount + amount
  │     WHERE instance_id = ? AND balance >= amount
  │
  └── 5. Submit to Fed
        → ACH file / Fedwire message
        → Write event to events table
        → Return pending status to fintech
```

**Step 3 is critical.** If the BSA Approver has crashed and is 30 seconds behind, the Origination API doesn't know whether recent transactions have triggered a block. Rather than approving a payment against stale BSA state, it rejects with a temporary error. Same for the Payment Hub — stale FBO positions mean untrustworthy balance checks.

**Reserve saga pattern:**
```sql
-- Reserve (on approval)
UPDATE fbo_positions 
SET balance = balance - amount, held_amount = held_amount + amount
WHERE instance_id = ? AND balance >= amount;

-- On Fed acceptance
UPDATE fbo_positions 
SET held_amount = held_amount - amount WHERE instance_id = ?;

-- On Fed rejection
UPDATE fbo_positions 
SET balance = balance + amount, held_amount = held_amount - amount
WHERE instance_id = ?;
```

**Crash scenarios:**
- BSA Approver crashes → Origination API detects stale `last_processed_at`, rejects new originations with temporary error. Inbound payments still settle.
- Payment Hub crashes → Same pattern, no payments go out with uncertain FBO state.
- Origination API crashes → Fintech instances get connection errors, retry per backoff. No state corrupted — API is stateless.
- Both consumers crash → Origination halts entirely until both recover. Correct behavior: never send money when you don't know if the entity is blocked or funds are available.

**Rationale:** This separation is why the PostgreSQL approach works and Kafka isn't needed. The consumers are just materializing state into tables. The decision maker queries those tables with SQL. The whole system is: append events, materialize views, query views at decision time. Decision logic is testable in isolation — set up specific `fbo_positions` and `bsa_alerts` rows and verify the origination API makes the right call, without running any consumers or processing any events.

---

## Appendix A: BaaS Provider Patterns Adopted

| Pattern | Source Provider |
|---------|-----------------|
| Typed error responses | Increase |
| Transparent cursor pagination | Increase |
| Simulation APIs for forced outcomes | Increase, Unit |
| Hybrid entity hierarchy | Column |
| 1:Many account-to-account-number | Increase, Column |
| Book transfers for internal | Column |
| Rate limit warning at 80% | Q2 Helix |
| Request ID for support correlation | Q2 Helix |
| 24-hour webhook retry window | Moov |

---

## Appendix B: Related Documents

- BaaS Provider API Comparison (Unit, Moov, Increase, Q2 Helix, Galileo, Column)
- 223 Compliance Controls Specification
- 5300 Reporting Requirements
- BSA/AML Control Mapping
- Architecture Amendments Analysis (v1.1) — Elon's 5-step framework applied to Kafka, BSA Engine, and infrastructure decisions
- BSA Placement Analysis — Why BSA operates at aggregator level (cross-fintech obligations)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 26, 2026 | Architecture Team | Initial version with 24 decisions |
| 1.1 | February 20, 2026 | Architecture Team | 7 amendments: Kafka → PostgreSQL event logs (Decision 4), Blnk Deploy + Supabase managed infrastructure (Decision 25), BSA Engine split into Approver + Reporter (Decision 26), four independent aggregator consumers (Decision 27), Origination API as stateless decision maker (Decision 28), updated Multi-Tenancy for new stack (Decision 18), updated Aggregator Event Schema for PostgreSQL (Decision 21). Core insight: consumers are state builders, Origination API is the decision maker. |