# Cassandra Banking Core — Architecture Decision Log

**Prepared for:** Pynthia Credit Union  
**Date:** January 26, 2026  
**Version:** 1.0

---

## Executive Summary

This document captures 24 architectural decisions for the Cassandra core banking system. The architecture supports a vertically integrated credit union (Pynthia) with the ability to white-label the BaaS core to other credit unions. Each credit union hosts its own instance, and each fintech partner operates on a fully isolated instance with an aggregator layer providing cross-fintech visibility for compliance and Fed settlement.

Key architectural patterns include: instance-per-fintech isolation, centralized payment hub at the aggregator layer, event streaming for real-time BSA/AML monitoring, and a control engine with compliance floor enforcement.

---

## Decision Summary

| # | Decision | Choice |
|---|----------|--------|
| 1 | Entity Hierarchy | Hybrid (unified `/entities` namespace, separate creation endpoints per type) |
| 2 | Account ↔ Account Number | 1:Many (one ledger account, multiple account numbers) |
| 3 | Ledger Architecture | Multi-Balance (Blnk) + Shadow Bookkeeping Layer for 5300/FBO |
| 4 | Event Architecture | Centralized Event Bus (technology TBD) |
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

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AGGREGATOR LAYER                               │
│                                                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌───────────────────┐  │
│  │ Payment Hub  │ │ BSA Engine   │ │    5300      │ │   Admin Console   │  │
│  │ (ACH/Wire/   │ │ (cross-      │ │  Reporting   │ │   (deferred)      │  │
│  │  RTP)        │ │  fintech)    │ │              │ │                   │  │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └─────────┬─────────┘  │
│         │                │                │                   │            │
│         └────────────────┴────────────────┴───────────────────┘            │
│                                   │                                         │
│                          Event Stream (Kafka)                               │
│                                   │                                         │
│  ┌────────────────────────────────┴──────────────────────────────────────┐ │
│  │                      FBO LEDGER (per fintech)                          │ │
│  │    Fintech X: $4M  │  Fintech Y: $3M  │  Fintech Z: $2M               │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                   │                                         │
│                        Fed Master Account                                   │
│                    (Single routing number: 271070801)                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    Account number prefix routing
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────────┐       ┌───────────────────┐       ┌───────────────────┐
│    FINTECH X      │       │    FINTECH Y      │       │    FINTECH Z      │
│    INSTANCE       │       │    INSTANCE       │       │    INSTANCE       │
│                   │       │                   │       │                   │
│  Account #s:      │       │  Account #s:      │       │  Account #s:      │
│  001-XXXXXXXX-C   │       │  002-XXXXXXXX-C   │       │  003-XXXXXXXX-C   │
│                   │       │                   │       │                   │
│ ┌───────────────┐ │       │ ┌───────────────┐ │       │ ┌───────────────┐ │
│ │  Blnk Ledger  │ │       │ │  Blnk Ledger  │ │       │ │  Blnk Ledger  │ │
│ └───────────────┘ │       │ └───────────────┘ │       │ └───────────────┘ │
│ ┌───────────────┐ │       │ ┌───────────────┐ │       │ ┌───────────────┐ │
│ │Control Engine │ │       │ │Control Engine │ │       │ │Control Engine │ │
│ │(CU controls)  │ │       │ │(CU controls)  │ │       │ │(CU controls)  │ │
│ └───────────────┘ │       │ └───────────────┘ │       │ └───────────────┘ │
│ ┌───────────────┐ │       │ ┌───────────────┐ │       │ ┌───────────────┐ │
│ │   Postgres    │ │       │ │   Postgres    │ │       │ │   Postgres    │ │
│ └───────────────┘ │       │ └───────────────┘ │       │ └───────────────┘ │
│ ┌───────────────┐ │       │ ┌───────────────┐ │       │ ┌───────────────┐ │
│ │  API Gateway  │ │       │ │  API Gateway  │ │       │ │  API Gateway  │ │
│ │  (mTLS+JWT)   │ │       │ │  (mTLS+JWT)   │ │       │ │  (mTLS+JWT)   │ │
│ └───────────────┘ │       │ └───────────────┘ │       │ └───────────────┘ │
└─────────┬─────────┘       └─────────┬─────────┘       └─────────┬─────────┘
          │                           │                           │
          ▼                           ▼                           ▼
     Fintech X                   Fintech Y                   Fintech Z
     End Users                   End Users                   End Users
```

### Aggregator Layer Components

| Component | Responsibility |
|-----------|----------------|
| Payment Hub | ACH, Wire, and RTP origination/receipt via single Fed master account |
| FBO Ledger | Fractional master account tracking per fintech |
| BSA Engine | Cross-fintech pattern detection via event stream consumption |
| 5300 Reporting | Aggregated regulatory reporting across all fintechs |
| Admin Console | SSO provider, meta-dashboard (deferred) |

### Fintech Instance Components

| Component | Description |
|-----------|-------------|
| Blnk Ledger | Double-entry ledger with multi-balance support |
| Control Engine | 223 base controls, customizable by credit union only |
| Postgres Database | Isolated data store for entities, accounts, transactions |
| API Gateway | mTLS + JWT authentication, fintech-scoped access |
| Bookkeeping Layer | 5300 tagging, FBO classification, compliance holds |

---

## Key Invariants

1. `Sum(Fintech X customer balances) == Fintech X Settlement Account == Aggregator FBO sub-account for X`
2. `Sum(all FBO sub-accounts) == Fed Master Account balance`
3. All `compliance_floor` controls always enforced (cannot be disabled)
4. All instances on same version (force push)
5. Account numbers never reused
6. Fintechs fully isolated (no awareness of each other)

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

### Decision 2: Account ↔ Account Number

**Choice:** 1:Many (one ledger account, multiple account numbers)

**Details:**
```
Account (regulatory reporting)
├── Account Number 1 (Fintech Partner A)
├── Account Number 2 (Fintech Partner B)
└── Account Number 3 (Direct member access)
```
- Each Account Number has distinct routing/account number pair
- `informational_entity_id` for FBO attribution
- Events: `account.*` (ledger) vs `account_number.*` (routing/external)

**Rationale:** BaaS/FBO use case—one master account for 5300 reporting, dedicated account numbers per partner for reconciliation; transaction monitoring aggregates at Account level, attributes at Account Number level.

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

**Rationale:** Blnk gap—no native FBO segregation or 5300 tagging; bookkeeping layer enables real-time 5300 dashboard and cross-schedule validations.

---

### Decision 4: Event Architecture

**Choice:** Centralized Event Bus (technology TBD)

**Details:**
- Kafka-compatible event bus, all services emit through adapters
- Canonical event schema matching control vocabulary
- Control engine subscribes, pattern-matches on event types
- Bookkeeping layer subscribes separately
- Durable, ordered log enables replay and audit

**Topics:** `member.*`, `lending.*`, `compliance.*`, `bsa.*`, `transaction.*`, `card.*`

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
- Same key + same args → return cached response + `Idempotent-Replayed: true` header
- Same key + different args → 409 Conflict with `idempotency_key_reused` error

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
Entity:        PENDING → ACTIVE ↔ DISABLED → ARCHIVED
Account:       OPEN ↔ FROZEN → CLOSED
Account Number: ACTIVE ↔ DISABLED → CANCELED
ACH Transfer:  PENDING_APPROVAL → SUBMITTED → SETTLED → RETURNED
                     ↓               ↓
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
Partner Request → PENDING_APPROVAL → Control Engine → SUBMITTED → SETTLED
                        ↓                                    ↓
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
PENDING_APPROVAL → SUBMITTED → COMPLETED
      ↓               ↓              ↓
  REJECTED       CANCELED    RETURN_REQUESTED → RETURNED | COMPLETED
```

**Return request reasons:** `FRAUD`, `DUPLICATE`, `INCORRECT_AMOUNT`, `INCORRECT_BENEFICIARY`

---

### Decision 10: Card Issuing

**Choice:** BIN sponsorship via Marqeta/Lithic with adapter pattern

**Architecture:**
```
Card Processor (Marqeta/Lithic)
  ↓ Real-time auth webhook (2 sec timeout)
Card Adapter (translate to canonical format)
  ↓
Control Engine (balance check, velocity, OFAC, fraud, BSA)
  ↓ APPROVE/DECLINE
Blnk Ledger (inflight → commit/void)
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

**Flow:** Partner verifies with their KYC → sends attestation to Cassandra → control engine evaluates trust level → always run OFAC regardless.

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
1. **Separate URL** — `sandbox.api.cassandra.bank` vs `api.cassandra.bank`
2. **No magic values** — Outcomes controlled entirely via simulation APIs
3. **Realistic Fed timing by default** — Simulation endpoints to accelerate settlement
4. **Forced outcomes via simulation APIs** — KYC, ACH, wire, card (Unit-style)
5. **Production-matching validation** — No relaxed validation

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
- Fully isolated stack per fintech (DB, Blnk, compute, event bus namespace)
- Aggregator layer per credit union handles Fed connectivity, cross-fintech BSA, 5300 reporting
- Single Fed master account and routing number per credit union
- Account number prefix routes inbound payments to correct fintech instance
- Pynthia operates as managed service

**Rationale:** Limits blast radius (fintech issues don't affect others), simplifies compliance isolation, enables per-fintech scaling.

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
Position:    1  2  3  │  4  5  6  7  8  9 10 11  │ 12
             ─────────┼──────────────────────────┼────
             Fintech  │       Sequence           │Check
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

**Ordering:** Partition by SSN/EIN for per-entity ordering.

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
| Fintech X API key | ✅ Full access | ❌ No access | ❌ No access |
| Fintech Y API key | ❌ No access | ✅ Full access | ❌ No access |
| Credit Union admin | ✅ Read access | ✅ Read access | ✅ Full access |
| Pynthia operations | ✅ Full access | ✅ Full access | ✅ Full access |

**Cross-fintech search:** Via aggregator only (which has full PII from event stream).

---

### Decision 24: Credit Union Admin Console

**Choice:** Deferred

**Notes:** Will need to address single pane of glass vs. separate apps, instance drill-down UX, and authentication flow (aggregator as SSO provider vs. external IdP).

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

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 26, 2026 | Architecture Team | Initial version with 24 decisions |