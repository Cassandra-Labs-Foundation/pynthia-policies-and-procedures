# Column API Architecture Analysis

**For: Cassandra Core Banking System**  
**Provider: Column N.A.**  
**Analysis Date: December 2025**

---

## Executive Summary

Column is unique among BaaS providers as a **nationally chartered bank** (not a middleware layer). They built their own ledger, core, and direct Fed integration. Key architectural decisions:

- **Split Entity Model**: Person and Business are separate object types (not unified Customer)
- **Account Number Abstraction**: Bank Account → Account Number is 1:many (virtual account pattern)
- **No Card Issuing**: Column does not issue cards; they provide the plumbing for card settlement via book transfers
- **Direct Fed Access**: ACH, Fedwire, RTP, SWIFT all directly integrated
- **Platform Hierarchy**: Platform → Entity → Bank Account → Account Number

---

## 1. Entity Model

### Core Entities (7 Primary Objects)

| Entity | ID Prefix | Key Attributes | Relationships |
|--------|-----------|----------------|---------------|
| **Platform** | `plat_` | Master settings, billing, reserves | Top-level; owns all Entities |
| **Entity (Person)** | `enti_` | SSN/passport, DOB, address, verification_status | Can own Bank Accounts |
| **Entity (Business)** | `enti_` | EIN, legal_type, beneficial_owners | Can own Bank Accounts; links to Person entities |
| **Bank Account** | `bacc_` | balances (4 types), status, type | Owned by Entity; has Account Numbers |
| **Account Number** | `acno_` | account_number, routing_number, BIC | Points to Bank Account |
| **Counterparty** | `cpty_` | routing_number, account_number, wire details | External account for transfers |
| **Transfer** | varies | amount, status, type, timestamps | Links Bank Account ↔ Counterparty |

### ER Diagram

```mermaid
erDiagram
    PLATFORM ||--o{ ENTITY : contains
    ENTITY ||--o{ BANK_ACCOUNT : owns
    ENTITY }o--o{ ENTITY : "associated_persons (beneficial owners)"
    BANK_ACCOUNT ||--o{ ACCOUNT_NUMBER : has
    BANK_ACCOUNT ||--o{ TRANSFER : "sender/receiver"
    COUNTERPARTY ||--o{ TRANSFER : "external party"
    
    PLATFORM {
        string id PK "plat_xxx"
        string name
        boolean is_root
        json settings
    }
    
    ENTITY {
        string id PK "enti_xxx"
        enum type "PERSON | BUSINESS"
        enum verification_status "UNVERIFIED | PENDING | MANUAL_REVIEW | VERIFIED | DENIED"
        boolean is_root
        boolean is_high_risk
        json person_details
        json business_details
    }
    
    BANK_ACCOUNT {
        string id PK "bacc_xxx"
        string entity_id FK
        enum type "CHECKING | OVERDRAFT_RESERVE | PROGRAM_RESERVE"
        enum status "open | frozen"
        int available_amount
        int pending_amount
        int holding_amount
        int locked_amount
        string routing_number
    }
    
    ACCOUNT_NUMBER {
        string id PK "acno_xxx"
        string bank_account_id FK
        string account_number
        string routing_number
        string bic
    }
    
    COUNTERPARTY {
        string id PK "cpty_xxx"
        string account_number
        string routing_number
        json wire_details
    }
    
    TRANSFER {
        string id PK "acht_ | wire_ | book_ | swft_"
        string bank_account_id FK
        string counterparty_id FK
        int amount
        string status
        enum direction "incoming | outgoing"
    }
```

### Key Design Decisions

**Entity Model (Split Person/Business)** ✅ Documented explicitly
- Person and Business are distinct types with different required fields
- Business entities link to Person entities via `associated_persons` endpoint
- Roles: `control_person`, `beneficial_owner`, `account_opener`
- UBO (25%+ ownership) tracked via `beneficial_owner` role

**Joint Account Support** ✅ Documented explicitly
- Yes: Bank Account has `owners` array accepting multiple `entity_id`s
- Add owner via `POST /bank-accounts/{id}/owner`

**Sub-Account/Virtual Account Model** ✅ Documented explicitly
- **Account Number** is the virtual account pattern
- One Bank Account → Many Account Numbers
- Each Account Number has unique routing/account number
- Use case: Give each customer/use-case unique account numbers pointing to same balance

**Transaction Linking** ✅ Documented explicitly
- ACH reversals: `reversal_pair_transfer_id` links original ↔ reversal
- Wire reversals: Same pattern via `reversal_pair_transfer_id`
- Returns: `return_details` object on transfer with return code

---

## 2. State Machines

### Entity (KYC) States

```mermaid
stateDiagram-v2
    [*] --> UNVERIFIED : create_entity
    UNVERIFIED --> PENDING : submit_kyc_data
    PENDING --> VERIFIED : auto_verified
    PENDING --> MANUAL_REVIEW : needs_review
    MANUAL_REVIEW --> VERIFIED : review_approved
    MANUAL_REVIEW --> DENIED : review_rejected
    VERIFIED --> [*]
    DENIED --> [*]
```

| State | Terminal? | Recoverable? | Trigger |
|-------|-----------|--------------|---------|
| UNVERIFIED | No | N/A | Initial state |
| PENDING | No | N/A | KYC data submitted |
| MANUAL_REVIEW | No | Yes | Auto-verification inconclusive |
| VERIFIED | Yes* | N/A | KYC approved |
| DENIED | Yes | No | KYC rejected |

*Verified can potentially move to MANUAL_REVIEW if re-verification triggered

### Bank Account States

```mermaid
stateDiagram-v2
    [*] --> open : create_account
    open --> frozen : compliance_hold
    frozen --> open : hold_released
    open --> deleted : delete (balance=$0)
    deleted --> [*]
```

| State | Terminal? | Can Transact? | Notes |
|-------|-----------|---------------|-------|
| `open` | No | Yes | Normal operating state |
| `frozen` | No | No | Compliance hold; wires return reason "account blocked/frozen" |
| (deleted) | Yes | N/A | Only possible when balance = $0 |

**Notable**: Column uses only 2 states (open/frozen). No pending/closed distinction.

### ACH Transfer States (Outgoing)

```mermaid
stateDiagram-v2
    [*] --> initiated : POST_/transfers/ach
    initiated --> submitted : fed_window
    submitted --> acknowledged : rdfi_ack (CCD/CTX only)
    submitted --> settled : effective_date+2bd
    settled --> completed : return_window_passed
    completed --> [*]
    
    initiated --> canceled : cancel_before_submit
    submitted --> returned : rdfi_return
    settled --> returned : late_return
    returned --> [*]
    canceled --> [*]
```

| State | Description | Balance Impact |
|-------|-------------|----------------|
| `initiated` | Received, queued for Fed | pending_balance adjusted |
| `submitted` | Sent to Fed | No change |
| `acknowledged` | RDFI acknowledged (corporate only) | No change |
| `settled` | Effective date passed | Debit: pending → available |
| `completed` | Return window passed | Terminal success |
| `returned` | RDFI returned transfer | Funds credited back |
| `canceled` | Canceled before submission | Pending reversed |

**Timing** (Same-day ACH):
- Cutoff: 1:30 PM PT
- Requires: `same_day=true` AND/OR `effective_on=today`
- Settlement: Same business day

### Wire Transfer States (Outgoing)

```mermaid
stateDiagram-v2
    [*] --> initiated : POST_/transfers/wire
    initiated --> completed : fed_settlement
    completed --> [*]
    
    initiated --> rejected : validation_failure
    rejected --> [*]
```

**Notable**: Wire states are simple - initiated → completed happens rapidly (same-day, often minutes).

| State | Description |
|-------|-------------|
| `initiated` | Wire request received |
| `completed` | Fed settlement complete |
| `rejected` | Validation or Fed rejection |

### Check Transfer States

```mermaid
stateDiagram-v2
    [*] --> issued : POST_/transfers/check/issue
    issued --> deposited : payee_deposits
    deposited --> settled : clearing
    settled --> completed : return_window
    completed --> [*]
    
    issued --> stopped : stop_payment
    deposited --> returned : bofd_return
    returned --> [*]
    stopped --> [*]
```

**Delivery States** (when mailed by Column):
`created` → `mailed` → `in_transit` → `in_local_area` → `processed_for_delivery` → `delivered`

---

## 3. Critical Flows

### ACH Origination Flow (Credit/Debit)

```mermaid
sequenceDiagram
    participant Client
    participant Column
    participant Fed as Federal Reserve
    participant RDFI as Receiving Bank
    
    Client->>Column: POST /transfers/ach
    Note over Client,Column: counterparty_id, bank_account_id, type, amount
    Column-->>Client: 200 {id: "acht_xxx", status: "initiated"}
    
    Note over Column: Queued for next Fed window
    Column->>Fed: Submit ACH batch
    Column-->>Client: Webhook: ach.outgoing_transfer.submitted
    
    Fed->>RDFI: Forward to receiving bank
    
    alt Same-day ACH (before 1:30pm PT)
        Note over RDFI: Same business day settlement
    else Standard ACH
        Note over RDFI: Next business day settlement
    end
    
    RDFI-->>Fed: Settlement acknowledgment
    Column-->>Client: Webhook: ach.outgoing_transfer.settled
    Note over Column: Debit: pending → available after 2 BD
    
    alt Success (no return within 60 days)
        Column-->>Client: Webhook: ach.outgoing_transfer.completed
    else Return
        RDFI->>Column: ACH Return (R01, R02, etc.)
        Column-->>Client: Webhook: ach.outgoing_transfer.returned
        Note over Column: return_details includes return_code
    end
```

**Timing**:
- API → initiated: Synchronous (< 1s)
- initiated → submitted: Next Fed window
- submitted → settled: 2 business days after effective_date (for debits)
- Return window: Up to 60 days (unauthorized returns)

**Same-day ACH Cutoffs**:
- Last API deadline: 1:30 PM PT
- Requires: `same_day=true` OR `effective_on=today`

### Account Opening Flow

```mermaid
sequenceDiagram
    participant Client
    participant Column
    participant KYC as Column KYC
    
    rect rgb(240, 248, 255)
        Note over Client,KYC: Individual Account
        Client->>Column: POST /entities/person
        Note over Client,Column: first_name, last_name, SSN, DOB, address
        Column->>KYC: Auto-verify (SSN, address, OFAC)
        
        alt Auto-verified
            Column-->>Client: 200 {verification_status: "VERIFIED"}
        else Needs review
            Column-->>Client: 200 {verification_status: "MANUAL_REVIEW"}
            Note over Column: Column reviews, updates status
            Column-->>Client: Webhook: entity.verification_status.updated
        end
        
        Client->>Column: POST /bank-accounts
        Note over Client,Column: entity_id, description
        Column-->>Client: 200 {id: "bacc_xxx", default_account_number, routing_number}
    end
    
    rect rgb(255, 248, 240)
        Note over Client,KYC: Business Account
        Client->>Column: POST /entities/business
        Note over Client,Column: business_name, EIN, address, legal_type
        Column-->>Client: 200 {id: "enti_xxx", verification_status: "..."}
        
        loop For each beneficial owner / control person
            Client->>Column: POST /entities/person (create person)
            Client->>Column: POST /entities/{biz}/associated-persons
            Note over Client,Column: person_entity_id, roles[], title
        end
        
        Client->>Column: POST /bank-accounts
        Note over Client,Column: entity_id (business)
        Column-->>Client: 200 {id: "bacc_xxx", ...}
    end
```

**Business vs Individual Differences**:
- Business requires: EIN (or registration_id for non-US), legal_type
- Business associates: Control person required; beneficial owners (25%+)
- Root entities: Additional fields (state_of_incorporation, description, payment_volumes)

### Book Transfer / Card Authorization Flow

Column doesn't issue cards but supports card settlement through book transfers with holds:

```mermaid
sequenceDiagram
    participant CardNetwork as Card Network
    participant Client as Your Platform
    participant Column
    
    Note over CardNetwork,Column: Authorization ($100 auth)
    CardNetwork->>Client: Auth request $100
    Client->>Column: POST /transfers/book
    Note over Client,Column: hold=true, amount=10000, allow_overdraft=true
    Column-->>Client: 200 {id: "book_xxx", status: "hold"}
    Note over Column: holding_balance += $100
    Client-->>CardNetwork: Auth approved
    
    Note over CardNetwork,Column: Re-auth ($300)
    CardNetwork->>Client: Re-auth to $300
    Client->>Column: PATCH /transfers/book/{id}
    Note over Client,Column: amount=30000
    Column-->>Client: 200 {status: "hold", amount: 30000}
    Note over Column: holding_balance = $300
    
    Note over CardNetwork,Column: Capture/Clear ($250)
    CardNetwork->>Client: Capture $250
    Client->>Column: POST /transfers/book/{id}/clear
    Note over Client,Column: amount=25000
    Column-->>Client: 200 {status: "completed"}
    Note over Column: $250 moved to receiver, $50 released
    Column-->>Client: Webhook: book.transfer.completed
```

**Balance Types** (critical for card programs):
- `available_amount`: Can be spent
- `pending_amount`: In-flight transfers
- `holding_amount`: Book transfer holds (auth amounts)
- `locked_amount`: Root accounts only (regulatory holds)

---

## 4. Confidence Notes

### ✅ Documented Explicitly
- Entity model (Person/Business split)
- Bank Account → Account Number relationship
- All transfer state machines
- ACH timing and cutoffs
- Joint account support (`owners` array)
- Beneficial owner linking (associated_persons)
- Reversal/return linking pattern
- Balance types (available, pending, holding, locked)

### 🔶 Inferred from API Structure
- Account state machine (only open/frozen mentioned, deleted implied)
- Verification state machine transitions (states documented, triggers partially)
- Rate limits on certain operations

### ❓ Unclear, Needs Verification
- Same-day ACH availability for all SEC codes
- Exact MANUAL_REVIEW → VERIFIED timeline
- Whether frozen accounts can receive incoming transfers
- FBO account patterns (not explicitly documented)
- Multi-tenant program separation (minimal docs)

---

## 5. Column-Specific Patterns

### Platform Hierarchy

```
Platform (you)
├── Root Entity (your company) ← special is_root=true entity
│   ├── Reserve Accounts
│   │   ├── Overdraft Reserve
│   │   └── Program Reserve
│   └── Operating Accounts
└── Customer Entities (your users)
    ├── Person Entities
    │   └── Bank Accounts
    │       └── Account Numbers
    └── Business Entities
        ├── Associated Persons (beneficial owners)
        └── Bank Accounts
            └── Account Numbers
```

### ID Prefixes

| Object | Prefix | Example |
|--------|--------|---------|
| Entity | `enti_` | `enti_2Q1ctiJm1NypVqCt8UBC8e4xTfH` |
| Bank Account | `bacc_` | `bacc_2YHAXVyuS2xcJW12Buh9zsxV7vC` |
| Account Number | `acno_` | `acno_2YHAWG9FTCxtL5emK1oVKCOx7fk` |
| Counterparty | `cpty_` | `cpty_xxx` |
| ACH Transfer | `acht_` | `acht_1vEdMiRjQWQYqRqaOppMfU7BWr1` |
| Wire Transfer | `wire_` | `wire_2XJUlyL4xJ0BDynRsS0A2MHEtll` |
| International Wire | `swft_` | `swft_xxx` |
| Book Transfer | `book_` | `book_xxx` |
| Check Transfer | `chck_` | `chck_xxx` |
| Document | `docu_` | `docu_2zEuexQ1tYgBO92ZHLZa7YV3F0i` |
| Evidence | `evid_` | `evid_2zEueyHBVWyPjzAm8h1Hn3pV4et` |
| Event | `evnt_` | `evnt_1vEdMiZ5pmkmrKZfNZ8LeqF2KFP` |

### Overdraft Pattern

```mermaid
flowchart LR
    subgraph Customer
        CA[Customer Account<br/>bacc_customer]
    end
    
    subgraph Platform
        OR[Overdraft Reserve<br/>bacc_reserve]
    end
    
    CA -->|"is_overdraftable=true<br/>overdraft_reserve_account_id"| OR
    OR -->|"locked_amount increases<br/>when CA overdraws"| CA
```

When customer account overdraws:
1. Funds locked in Overdraft Reserve
2. `bank_account.overdraft_alert` webhook fired
3. Customer deposits → locked amount released

---

## 6. Payment Rails Summary

| Rail | Outgoing | Incoming | States | Same-Day |
|------|----------|----------|--------|----------|
| ACH | ✅ | ✅ | initiated→submitted→settled→completed | ✅ (1:30pm PT cutoff) |
| Wire (Fedwire) | ✅ | ✅ | initiated→completed | ✅ (inherent) |
| International Wire (SWIFT) | ✅ | ✅ | Complex tracking | No |
| RTP | ✅ | ✅ | Near-instant | ✅ (inherent) |
| Checks | ✅ Issue | ✅ Deposit | issued→deposited→settled | No |
| Book Transfer | ✅ | ✅ | initiated→completed (or hold) | ✅ (instant) |

---

## 7. Cassandra Design Implications

### What Column Does Well (Consider Adopting)
1. **Account Number abstraction** - Brilliant for virtual accounts without ledger complexity
2. **4-balance model** - available/pending/holding/locked covers all use cases
3. **Split Entity types** - Cleaner than unified Customer with type field
4. **Associated Persons pattern** - Clean beneficial ownership modeling
5. **Reversal linking** - `reversal_pair_transfer_id` pattern

### Gaps for Sponsor Banking
1. **No Card Issuing** - You'll need Marqeta/Galileo/Lithic for cards
2. **Limited Ledger Exposure** - No GL-level access; Column is the core
3. **No Multi-Program Docs** - Sponsor banking program separation unclear
4. **No Explicit FBO Patterns** - May need custom implementation

### Recommended Cassandra Patterns

| Column Pattern | Cassandra Adaptation |
|----------------|---------------------|
| Entity → Bank Account → Account Number | Consider: Customer → Ledger Account → Virtual Account |
| 4 balance types | Adopt: available/pending/held/restricted |
| `reversal_pair_transfer_id` | Use: `related_transaction_id` with `relationship_type` |
| `is_root` entity flag | Adopt: `account_tier` or `program_type` enum |
| Status: open/frozen | Expand: active/frozen/dormant/closed |