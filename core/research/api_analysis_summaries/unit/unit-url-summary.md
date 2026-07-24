# Unit.co API Architecture Analysis
## For Cassandra Sponsor Bank Core System

**Analysis Date:** December 12, 2025  
**Source:** https://docs.unit.co/

---

## 1. Entity Model

### Core Entities

| Entity | Type | ID Format | Description |
|--------|------|-----------|-------------|
| Application | `individualApplication` / `businessApplication` | Numeric string | KYC application, precedes Customer |
| Customer | `individualCustomer` / `businessCustomer` | Numeric string | Verified account holder |
| DepositAccount | `depositAccount` | Numeric string | Primary account type |
| WalletAccount | `walletAccount` | Numeric string | Sub-ledger for FBO patterns |
| Transaction | Multiple types | Numeric string | Immutable financial movement |
| Payment | `achPayment`, `bookPayment`, `wirePayment` | Numeric string | Payment initiation |
| Card | Multiple types | Numeric string | Debit/credit cards |
| Counterparty | `achCounterparty` | Numeric string | External account reference |

### Key Entity Relationships

**Joint Accounts:**
- Supported via `customers` array (2+ individuals)
- At least one customer must be 18+
- All joint holders share equal access

**Business Customer Structure:**
- `officer`: Single object (C-level executive, decision-making authority)
- `beneficialOwners`: Array with `percentage` ownership
- 25% ownership threshold triggers beneficial owner requirements

**Transaction Linking:**
- `relatedTransaction` relationship connects fee→original, reversal→original
- Enables audit trail and reconciliation

**Wallet/FBO Pattern:**
- `walletAccount` type for sub-ledger entries
- Limited functionality vs `depositAccount`
- Used for FBO (For Benefit Of) account structures

### Design Decisions

| Decision | Implementation | Rationale |
|----------|----------------|-----------|
| Split customer types | `individualCustomer` / `businessCustomer` | Distinct attribute requirements, compliance paths |
| Sole proprietors | `individualApplication` with `soleProprietorship=true` | Simplified onboarding, uses SSN instead of EIN |
| Product-based config | Deposit products encapsulate terms, fees, limits | Compliance-managed, consistent enforcement |
| JSON:API spec | Strict adherence throughout | Standardized relationships, included resources |
| Tags system | Key-value pairs on most resources | Custom metadata without schema changes |
| Idempotency keys | Required on create operations | Safe retries, duplicate prevention |
| Org accounts | Separate from customer accounts | Special-purpose (revenue, reserve, etc.) |

---

## 2. State Machines

### Account States

```
┌─────────┐
│  Open   │◄─────────────────┐
│(initial)│                  │
└────┬────┘                  │
     │                       │
     │ freeze()              │ unfreeze()
     ▼                       │
┌─────────┐                  │
│ Frozen  │──────────────────┘
└────┬────┘
     │
     │ close()
     ▼
┌─────────────────────────────────┐
│            Closed               │
│  ┌─────────────────────────┐    │
│  │ Reason:                 │    │
│  │ • ByCustomer (reopen OK)│    │
│  │ • Fraud (terminal)      │    │
│  │ • ByBank (terminal)     │    │
│  │ • NegativeBalance       │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

**Close Behaviors:**
- Balance < $1 auto-swept to org revenue account
- Associated cards frozen/closed with account
- `ByCustomer` reason allows reopen; others terminal

### Application/KYC States

```
┌─────────────┐
│   Pending   │ (async KYC evaluation)
└──────┬──────┘
       │
       ├──────────────► Approved ──────► Customer created
       │
       ├──────────────► Denied (terminal)
       │
       ├──────────────► AwaitingDocuments
       │                      │
       │                      │ upload docs
       │                      ▼
       └──────────────► PendingReview (2hr SLA)
                              │
                              ├──────► Approved
                              └──────► Denied
```

**Cancellation:**
- Only allowed in `AwaitingDocuments` or `PendingReview` states
- `Pending`, `Approved`, `Denied` are not cancelable

### ACH Payment States

```
┌─────────┐
│ Pending │
└────┬────┘
     │
     ├──────────────► PendingReview (risk flagged, 2hr SLA)
     │                      │
     │                      ├──────► Sent
     │                      └──────► Canceled
     │
     ├──────────────► Sent (credit path)
     │                  │
     │                  └──────► Returned (if return received)
     │
     ├──────────────► Clearing (debit path)
     │                  │
     │                  └──────► Sent (after clearing period)
     │
     ├──────────────► Canceled
     │
     └──────────────► Rejected
                        │
                        └─ Reasons:
                           • InsufficientFunds
                           • DailyACHCreditLimitExceeded
                           • CounterpartyInsufficientFunds
                           • PlaidBalanceUnavailable
                           • SuspectedFraud
                           • NameMismatch
```

### Card States

```
Physical Card:
┌──────────┐    activate()    ┌────────┐
│ Inactive │─────────────────►│ Active │
└──────────┘                  └────┬───┘
                                   │
Virtual Card:                      │
┌──────────┐                       │
│  Active  │◄──────────────────────┘
│(immediate)                       │
└──────────┘                       │
     │                             │
     │ freeze()                    │
     ▼                             │
┌──────────┐      unfreeze()       │
│  Frozen  │◄──────────────────────┤
└────┬─────┘                       │
     │                             │
     └─────────────────────────────┤
                                   │
     Terminal States:              │
     ┌─────────────────────────┐   │
     │ • Lost                  │◄──┘
     │ • Stolen                │
     │ • ClosedByCustomer      │
     │ • SuspectedFraud*       │
     └─────────────────────────┘
     
     *SuspectedFraud sometimes recoverable
```

---

## 3. Critical Flows

### ACH Origination Flow

```
1. Initiation
   POST /payments (type: achPayment)
   └── Response: 201 Created, status: Pending

2. Validation
   ├── Limits check (daily, monthly, per-transaction)
   ├── Balance check (for debits from Unit account)
   └── Risk screening

3. Risk Review (if flagged)
   └── Status: PendingReview
       └── 2hr SLA for manual review

4. Transmission
   └── Before bank cutoff (typically 4:15 PM ET)

5a. Credit Path:
    Pending → Sent → transaction.created webhook

5b. Debit Path:
    Pending → Clearing → Sent → transaction.created webhook
    └── Clearing period configurable via clearingDaysOverride

6. Returns (if applicable)
   ├── Standard: 2 business days
   └── Unauthorized: 60 days
```

**Same-Day ACH:**
- Windows: ~10:00 AM ET, ~2:15 PM ET
- Requires feature enablement
- Dynamic clearing period also requires enablement

### Account Opening Flow

```
1. Application Submission
   POST /applications
   ├── type: individualApplication
   │   └── SSN/Passport, ID + address verification
   └── type: businessApplication
       └── EIN + Officer/Beneficial Owner SSNs
           └── Articles of incorporation may be required

2. KYC Evaluation (async)
   └── Status: Pending

3a. Instant Approval Path:
    Status: Approved → Customer resource created automatically

3b. Document Required Path:
    Status: AwaitingDocuments
    └── POST /applications/{id}/documents
        └── Status: PendingReview (2hr SLA)
            ├── Approved → Customer created
            └── Denied (terminal)

4. Account Creation
   POST /accounts (type: depositAccount)
   └── Response: 201 Created, status: Open
```

### Card Authorization Flow

```
1. Authorization Request
   Merchant → Card Network → Unit

2. Programmatic Authorization (optional)
   Unit → Client webhook POST
   ├── Timeout: 2 seconds
   └── Client response: approve / decline / default

3. Validation
   ├── Balance check
   ├── Limits check
   ├── Card status check
   └── Card expiration check

4a. Approved:
    ├── Hold placed on account
    └── Webhook: authorization.created

4b. Declined:
    └── Reasons:
        • Insufficient funds
        • Card inactive
        • Limits exceeded
        • Card expired
        • Programmatic decline

5. Settlement (T+1 to T+3)
   ├── Webhook: transaction.created
   └── Hold released
```

---

## 4. Confidence Assessment

### ✅ Documented Explicitly

| Item | Source |
|------|--------|
| Entity types and relationships | API reference, schema definitions |
| Account/Card/Application state machines | States + transitions documented |
| ACH payment states | Payment lifecycle documentation |
| Joint account support | API + guides |

### 🔶 Inferred from API Structure

| Item | Basis | Confidence |
|------|-------|------------|
| ACH cutoff times | General guidance provided, bank-specific variations | Medium |
| Transaction linking model | `relatedTransaction` relationship in examples | High |
| Wallet/FBO architecture | High-level overview, limited API detail | Medium |

### ❓ Unclear, Needs Verification

| Item | Notes |
|------|-------|
| Internal ledger structure | No GL/ledger API exposed publicly |
| Multi-bank settlement details | `banks` attribute exists, internal routing unclear |
| Programmatic auth fallback behavior | Default action when timeout exceeded |

---

## 5. Key Takeaways for Cassandra

### Architecture Patterns to Adopt

**JSON:API Compliance:**
- Strict adherence to JSON:API specification
- Standardized relationship handling
- Included resources pattern for reducing roundtrips

**Separate Application → Customer Flow:**
- KYC as explicit workflow, not embedded in account creation
- Enables async evaluation, document collection
- Clean separation of concerns

**Product-Based Configuration:**
- Deposit products encapsulate all terms
- Interest rates, fees, limits, clearing periods
- Managed by compliance, not developers

**Event-Driven Architecture:**
- Webhooks for all state changes
- Async operations as default
- Idempotency keys for safe retries

**Transactions as Read-Only Outcomes:**
- Never created directly via API
- Always result of other operations
- Immutable audit trail

**Abstract Ledger:**
- No explicit GL exposure
- Balance/hold/available on accounts only
- Internal ledger implementation hidden

### Notable Implementation Patterns

**Counterparty Model:**
- Linked resources (stored counterparty) OR inline specification
- Enables both reuse and ad-hoc transfers

**Card Type Hierarchy:**
- 6 types covering individual/business × physical/virtual × debit/credit
- Separate creation flows for physical vs virtual

**Sensitive Data Handling:**
- VGS (Very Good Security) integration
- Card PAN/CVV display via secure iframe
- PIN operations through separate secure channel

**Programmatic Authorization:**
- Optional real-time approval/decline
- Tight timeout (2 seconds)
- Fallback to default behavior

**Account Holds:**
- Temporary fund reservation
- Separate from transactions
- Used for card authorizations, pending payments

---

## Appendix: Entity ID Formats

All entities use numeric string IDs:
- Applications: `"12345"`
- Customers: `"67890"`
- Accounts: `"10001"`
- Transactions: `"337"`
- Payments: `"1234"`
- Cards: `"7890"`

No UUIDs observed in public documentation.

---

*Document generated for Cassandra sponsor bank core system development*