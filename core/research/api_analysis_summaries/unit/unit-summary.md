# Unit API Architecture Analysis

**Provider:** Unit  
**API Version:** 0.2.3  
**Analysis Date:** December 2024  
**Purpose:** Architectural decisions for Cassandra core banking system

---

## 1. Entity Relationships

### Entity Relationship Diagram

```mermaid
erDiagram
    APPLICATION ||--o| CUSTOMER : creates
    APPLICATION ||--o{ BENEFICIAL_OWNER : contains
    CUSTOMER ||--o{ ACCOUNT : owns
    CUSTOMER ||--o{ COUNTERPARTY : has
    ACCOUNT ||--o{ TRANSACTION : contains
    ACCOUNT ||--o{ CARD : issues
    ACCOUNT ||--o{ PAYMENT : originates
    PAYMENT ||--o| TRANSACTION : generates
    CARD ||--o{ AUTHORIZATION : receives
    AUTHORIZATION ||--o| TRANSACTION : settles_to
    
    APPLICATION {
        string id PK
        enum type "individual|business"
        enum status "Pending|AwaitingDocuments|PendingReview|Approved|Denied|Canceled"
        string fullName_or_businessName
        datetime createdAt
    }
    
    CUSTOMER {
        string id PK
        enum type "individualCustomer|businessCustomer"
        enum status "Active|Archived"
        string riskRate "low|medium|high"
        array authorizedUsers
    }
    
    BENEFICIAL_OWNER {
        string fullName
        int percentage "25-100"
        string status
        string ssn_masked
    }
    
    ACCOUNT {
        string id PK
        enum type "depositAccount|creditAccount|walletAccount"
        enum status "Open|Frozen|Closed"
        string routingNumber
        string accountNumber
        int64 balance
        int64 hold
        int64 available
    }
    
    CARD {
        string id PK
        enum type "individualDebitCard|businessDebitCard|virtualDebitCard|creditCard"
        enum status "Active|Inactive|Frozen|Lost|Stolen|ClosedByCustomer|SuspectedFraud"
        string last4Digits
        string expirationDate
    }
    
    PAYMENT {
        string id PK
        enum type "achPayment|bookPayment|wirePayment"
        enum status "Pending|Rejected|Clearing|Sent|Canceled|Returned"
        enum direction "Credit|Debit"
        int64 amount
        string traceNumber
    }
    
    TRANSACTION {
        string id PK
        enum type "originatedAch|receivedAch|returnedAch|purchase|book|wire|fee|etc"
        int64 amount
        int64 balance
        enum direction "Credit|Debit"
        datetime createdAt
    }
    
    COUNTERPARTY {
        string id PK
        string routingNumber
        string accountNumber
        enum accountType "Checking|Savings|Loan"
        enum permissions "CreditOnly|DebitOnly|CreditAndDebit"
    }
    
    AUTHORIZATION {
        string id PK
        enum type "purchase|atm|cardTransaction"
        int64 amount
        string status
        object merchant
        boolean recurring
    }
```

### Core Entity Summary

| Entity | ID Format | Key Attributes | Relationships |
|--------|-----------|----------------|---------------|
| **Application** | Numeric string | type, status, fullName/name, evaluationOutcome, riskRate | → Customer (on approval), → BeneficialOwners |
| **Customer** | Numeric string | type (individual/business), status, riskRate, authorizedUsers[] | → Application, → Accounts, → Counterparties |
| **Account** | Numeric string | type (deposit/credit/wallet), status, routingNumber, accountNumber, balance/hold/available | → Customer(s), → Transactions, → Cards |
| **Card** | Numeric string | type (debit/credit, physical/virtual), status, last4Digits, expirationDate | → Account, → Customer |
| **Payment** | Numeric string | type (ach/book/wire), status, direction, amount, traceNumber | → Account, → Transaction, → Counterparty |
| **Transaction** | Numeric string | type (30+ subtypes), amount, balance, direction | → Account, → Payment, → relatedTransaction |
| **Counterparty** | Numeric string | routingNumber, accountNumber, accountType, permissions | → Customer |
| **Authorization** | Numeric string | type, amount, status, merchant, partialApprovalAllowed | → Card, → Account, → Customer |

### Key Design Decisions

**Customer Model: Polymorphic with Discriminator**
- ✅ **Unified endpoint** (`/customers`) with type discriminator (`individualCustomer`, `businessCustomer`)
- Individual customers can also represent **sole proprietorships** (via `soleProprietorship: true` flag with optional EIN/DBA)
- Business customers require separate beneficial owner structures embedded in application

**Joint Account Support: Yes**
- ✅ **Explicitly supported** via `/accounts/{accountId}/relationships/customers` endpoint
- `AddAccountOwnersRequest` and `RemoveAccountOwnersRequest` allow multiple owners
- `CreateDepositAccount` accepts both singular `customer` and plural `customers` relationships
- Returns `DepositAccountOwners[]` array

**Sub-Account/Virtual Account Model**
- 🔶 Not a dedicated sub-account entity; uses **Wallet Accounts** for similar functionality
- Three account types: `depositAccount`, `creditAccount`, `walletAccount`
- Wallet accounts appear designed for fintech partner use cases

**Business Customer → Beneficial Owners**
- ✅ Beneficial owners embedded in **BusinessApplication** (not separate entity post-approval)
- Requires ownership percentage (25-100%)
- Each beneficial owner goes through KYC evaluation separately
- Can be updated via `/beneficial-owner/{beneficialOwnerId}`

**Transaction Linking Approach**
- ✅ **Relationship-based linking** using JSON:API relationships:
  - `relatedTransaction` - Points to related transaction (e.g., reversal → original)
  - `originalTransaction` - Points to originating transaction
  - `payment` - Links transaction to payment that caused it
- Each transaction type has specific relationships (e.g., `CardReversalTransactionRelationships` requires `relatedTransaction`)

---

## 2. State Machines

### Account States

```mermaid
stateDiagram-v2
    [*] --> Open : Account created
    Open --> Frozen : freeze (compliance hold)
    Frozen --> Open : unfreeze (hold released)
    Open --> Closed : close (various reasons)
    Frozen --> Closed : close (from frozen)
    Closed --> Open : reopen
    
    note right of Closed
        closeReason enum:
        - ByCustomer
        - Fraud
        - NegativeBalance
        - ByBank
        - BreachOfTermsAndConditions
        - NoAccountActivity
        - ProgramChange
    end note
```

| Transition | Trigger | API Endpoint | Notes |
|------------|---------|--------------|-------|
| → Open | Account creation | `POST /accounts` | Requires approved customer |
| Open → Frozen | Compliance hold | `POST /accounts/{id}/freeze` | Accepts `freezeReason` |
| Frozen → Open | Hold released | `POST /accounts/{id}/unfreeze` | - |
| Open → Closed | Close request | `POST /accounts/{id}/close` | Requires `closeReason` |
| Frozen → Closed | Close request | `POST /accounts/{id}/close` | Can close from frozen |
| Closed → Open | Reopen | `POST /accounts/{id}/reopen` | ✅ **Recoverable** |

**DACA (Deposit Account Control Agreement) Sub-States:**
- `Entered` → `Activated` via `/accounts/{id}/activate-daca`
- `Activated` → `Entered` via `/accounts/{id}/deactivate-daca`

### Payment/Transaction States (ACH)

```mermaid
stateDiagram-v2
    [*] --> Pending : Payment created
    Pending --> Rejected : Validation failed
    Pending --> Clearing : Submitted to network
    Pending --> Canceled : cancel requested
    Clearing --> Sent : Funds released
    Sent --> Returned : ACH return received
    
    Rejected --> [*]
    Canceled --> [*]
    Sent --> [*] : Success (terminal)
    Returned --> [*] : With return reason
```

| State | Description | Terminal? |
|-------|-------------|-----------|
| Pending | Created, awaiting processing | No |
| Rejected | Failed validation | Yes |
| Clearing | Submitted, funds held | No |
| Sent | Completed successfully | Yes (success) |
| Canceled | User canceled before clearing | Yes |
| Returned | ACH return received | Yes (failure) |

**Received Payment States (Incoming ACH):**
```mermaid
stateDiagram-v2
    [*] --> Pending : ACH received
    Pending --> Advanced : advance (early credit)
    Pending --> PendingReview : Review required
    Pending --> Completed : Settlement
    PendingReview --> MarkedForReturn : Return decision
    PendingReview --> Completed : Approved
    MarkedForReturn --> Returned : Return sent
    Advanced --> Completed : Settlement
```

### Card States

```mermaid
stateDiagram-v2
    [*] --> Inactive : Card created (physical)
    [*] --> Active : Card created (virtual)
    Inactive --> Active : activate
    Active --> Frozen : freeze
    Frozen --> Active : unfreeze
    Active --> Lost : report-lost
    Active --> Stolen : report-stolen
    Active --> ClosedByCustomer : close
    Frozen --> ClosedByCustomer : close
    Lost --> [*]
    Stolen --> [*]
    ClosedByCustomer --> [*]
    
    Active --> SuspectedFraud : fraud detected
    SuspectedFraud --> Active : cleared
    SuspectedFraud --> [*] : confirmed fraud
    
    Active --> ActiveForOnlineUse : physical card online-only
```

| State | Recoverable? | Notes |
|-------|--------------|-------|
| Inactive | Yes → Active | Physical cards start here |
| Active | Yes | Normal operating state |
| Frozen | Yes → Active | Temporary hold |
| Lost | No | Terminal - must replace |
| Stolen | No | Terminal - must replace |
| ClosedByCustomer | No | Terminal |
| SuspectedFraud | Maybe | Can be cleared or become terminal |
| ActiveForOnlineUse | Yes | Physical card restricted to online use |

### Application (KYC) States

```mermaid
stateDiagram-v2
    [*] --> Pending : Application submitted
    Pending --> AwaitingDocuments : Documents needed
    AwaitingDocuments --> PendingReview : Documents uploaded
    Pending --> PendingReview : Auto-review triggered
    PendingReview --> Approved : KYC passed
    PendingReview --> Denied : KYC failed
    Pending --> Approved : Auto-approved
    Pending --> Denied : Auto-denied
    Pending --> Canceled : cancel
    AwaitingDocuments --> Canceled : cancel
    
    Approved --> [*] : Creates Customer
    Denied --> [*]
    Canceled --> [*]
```

---

## 3. Critical Flows

### ACH Origination Flow (Credit & Debit)

```mermaid
sequenceDiagram
    participant Client as API Consumer
    participant Unit as Unit API
    participant FedACH as Federal Reserve ACH
    participant RDFI as Receiving Bank
    
    Client->>Unit: POST /payments (achPayment)
    Note over Client,Unit: direction: Credit/Debit<br/>sameDay: true/false
    Unit-->>Client: 201 Created (status: Pending)
    
    Note over Unit: Validation & limit checks
    
    alt Validation Failed
        Unit->>Client: Webhook: payment.rejected
    else Validation Passed
        Unit->>Unit: Create hold on account
        Unit->>Client: Webhook: payment.clearing
        
        Note over Unit,FedACH: Batch window (cutoff times)
        Unit->>FedACH: Submit ACH batch
        
        alt Same-Day ACH
            Note over FedACH: 4 daily windows
        else Next-Day ACH
            Note over FedACH: End of day batch
        end
        
        FedACH->>RDFI: Forward ACH entry
        FedACH-->>Unit: Acknowledgment
        Unit->>Client: Webhook: payment.sent
        Unit->>Unit: Release hold, post transaction
        
        opt Return (within return window)
            RDFI->>FedACH: Return entry (R01-R99)
            FedACH->>Unit: Return notification
            Unit->>Unit: Reverse transaction
            Unit->>Client: Webhook: payment.returned
        end
    end
```

**Timing:**
- **Sync Response:** ~200-500ms for 201 Created
- **Clearing:** Depends on same-day flag
  - Same-Day: Settlement same business day (cutoffs ~10:30am, 2:45pm, 4:45pm ET)
  - Next-Day: Settlement T+1
- **Return Window:** Up to 60 days for some return codes

**Return Handling:**
- Returns create `returnedAchTransaction` linked via `payment` relationship
- Return reason codes mapped to `AchReturnReason` enum
- Original transaction remains; return is new credit/debit entry

### Account Opening Flow

```mermaid
sequenceDiagram
    participant Client as API Consumer
    participant Unit as Unit API
    participant KYC as KYC Provider
    
    rect rgb(240, 248, 255)
    Note over Client,KYC: Individual Application
    Client->>Unit: POST /applications (individualApplication)
    Note over Client,Unit: fullName, ssn, dateOfBirth,<br/>address, email, phone
    Unit-->>Client: 201 Created (status: Pending)
    
    Unit->>KYC: Identity verification
    KYC-->>Unit: Evaluation result
    
    alt Auto-Approved
        Unit->>Unit: Create Customer
        Unit->>Client: Webhook: application.approved
    else Documents Required
        Unit->>Client: Webhook: application.awaitingDocuments
        Client->>Unit: POST /applications/{id}/documents
        Client->>Unit: Upload document files
        Unit->>KYC: Document verification
        KYC-->>Unit: Verification result
        Unit->>Client: Webhook: application.approved/denied
    else Denied
        Unit->>Client: Webhook: application.denied
    end
    end
    
    rect rgb(255, 248, 240)
    Note over Client,KYC: Business Application (additional steps)
    Client->>Unit: POST /applications (businessApplication)
    Note over Client,Unit: Includes: officer, beneficialOwners[]
    
    Unit->>KYC: Business verification (EIN, state records)
    Unit->>KYC: Officer KYC
    
    loop For each beneficial owner (≥25%)
        Unit->>KYC: Beneficial owner KYC
    end
    
    Unit->>Client: Webhook: application.approved/denied
    end
    
    Note over Client,Unit: Post-Approval: Create Account
    Client->>Unit: POST /accounts
    Note over Client,Unit: depositProduct, customer relationship
    Unit-->>Client: 201 Created (status: Open)
    Unit->>Client: Webhook: account.created
```

**Timing:**
- **Sync Response:** ~500ms-2s for application creation
- **Auto-Decision:** Often immediate (seconds) for clean applications
- **Manual Review:** 1-3 business days
- **Document Processing:** Hours to days depending on queue

**External Systems:**
- KYC vendor (identity verification, watchlist screening)
- State business registries (for business applications)
- Document verification services

### Card Authorization Flow

```mermaid
sequenceDiagram
    participant POS as Merchant POS
    participant Network as Card Network
    participant Unit as Unit API
    participant Client as API Consumer
    
    POS->>Network: Authorization request
    Network->>Unit: POST /authorization-requests (internal)
    
    Note over Unit: Check: Card status, limits,<br/>available balance, velocity
    
    alt Standard Flow (auto-decision)
        Unit->>Unit: Approve/Decline based on rules
        Unit-->>Network: Authorization response
        Network-->>POS: Approved/Declined
        Unit->>Client: Webhook: authorization.created
    else Enhanced Flow (real-time decision)
        Note over Unit,Client: If client configured for<br/>real-time authorization
        Unit->>Client: Webhook: authorizationRequest.pending
        Note over Client,Unit: Client has ~2 seconds to respond
        
        alt Client Approves
            Client->>Unit: POST /authorization-requests/{id}/approve
            Note over Client,Unit: Optional: partial amount
            Unit-->>Network: Approved
        else Client Declines
            Client->>Unit: POST /authorization-requests/{id}/decline
            Note over Client,Unit: reason: InsufficientFunds,<br/>DoNotHonor, etc.
            Unit-->>Network: Declined
        else Timeout
            Unit->>Unit: Apply default decision
            Unit-->>Network: Default response
        end
        
        Network-->>POS: Final response
        Unit->>Client: Webhook: authorization.created
    end
    
    opt Settlement (later)
        Network->>Unit: Settlement/clearing
        Unit->>Unit: Create purchaseTransaction
        Unit->>Client: Webhook: transaction.created
    end
```

**Timing:**
- **Real-time Response SLA:** ~100-150ms for auto-decisions
- **Enhanced Auth Window:** ~2 seconds for client decision
- **Settlement:** T+1 to T+3 depending on network

**Decline Reasons Available:**
- AccountClosed
- CardExceedsAmountLimit
- DoNotHonor
- InsufficientFunds
- InvalidMerchant
- ReferToCardIssuer
- RestrictedCard
- TransactionNotPermittedToCardholder

---

## 4. Confidence Notes

| Area | Confidence | Notes |
|------|------------|-------|
| **Entity Relationships** | ✅ Documented | Clear from schema discriminators and relationships |
| **Joint Account Support** | ✅ Documented | Explicit endpoints for adding/removing owners |
| **Account States** | ✅ Documented | Explicit enum + dedicated endpoints |
| **Payment States** | ✅ Documented | Status enum in schema |
| **Card States** | ✅ Documented | PhysicalCardStatus/VirtualCardStatus enums |
| **Application States** | ✅ Documented | ApplicationStatus enum |
| **ACH Timing/Cutoffs** | 🔶 Inferred | Same-day flag exists; specific cutoffs not in OpenAPI |
| **Real-time Auth Config** | 🔶 Inferred | AuthorizationRequest endpoints exist; webhook config unclear |
| **GL Account Exposure** | ✅ Documented | GlAccount and OrgGeneralLedgerAccount schemas present |
| **Return Window Details** | ❓ Unclear | AchReturnReason enum exists; window timing not documented |
| **Settlement Timing** | 🔶 Inferred | settlementDate field exists; exact timing rules unclear |

---

## 5. Notable Design Decisions

### Strengths for Sponsor Banking

1. **Explicit Joint Account Support** - First-class multi-owner accounts
2. **Granular Card Control** - Real-time authorization hooks with partial approval
3. **Rich Transaction Taxonomy** - 30+ transaction types with clear linking
4. **GL Account Visibility** - Org-level ledger accounts exposed
5. **Flexible Counterparty Model** - Permissions-based (credit-only, debit-only, both)
6. **DACA Support** - Built-in deposit account control agreement states

### Areas to Verify

1. **FBO Account Patterns** - Not explicitly documented in OpenAPI
2. **Multi-Program Separation** - Org structure exists but tenant isolation unclear
3. **Wire Transfer Limits** - Wire payments exist but detailed rules not in spec
4. **Batch Processing Windows** - Specific ACH batch timing not documented
5. **Account Number Recycling** - Policy on reuse after closure unclear

### Interesting/Unusual

- **Sole Proprietorship as Individual** - Individual customers can have EIN/DBA (not separate type)
- **Recoverable Closed Accounts** - Reopen endpoint exists (unusual for many providers)
- **Business Wallet Customer** - Third customer type for fintech partners (bank name field)
- **Idempotency Keys** - First-class support on account/payment creation
- **Secondary Account Numbers** - Deposit accounts can have two routing/account pairs