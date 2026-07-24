# Mambu API Architectural Analysis for Cassandra

## Executive Summary

Mambu is a **cloud-native core banking engine** built on a composable architecture. Unlike BaaS providers that focus primarily on US sponsor bank patterns (ACH, Fed integration), Mambu is a **global lending and deposit platform** primarily serving microfinance institutions, neo-banks, and embedded finance providers. It provides robust loan servicing, deposit management, and a general ledger—but does **not** natively handle US payment rails (ACH, wire, RTP).

**Key Insight for Cassandra**: Mambu's architecture reveals a fundamentally different design philosophy than US-focused BaaS providers like Unit, Column, or Increase. It's a configurable **ledger-first core** with flexible product templates, rather than a payment-rail-integrated platform. Understanding these patterns is valuable for designing flexible account and transaction state machines.

---

## 1. Entity Relationships

### Core Entities

| Entity | ID Format | Key Attributes | Relationships |
|--------|-----------|----------------|---------------|
| **Client** | `encodedKey` (UUID) | firstName, lastName, state, clientType | Owns → Accounts, Groups |
| **Group** | `encodedKey` (UUID) | groupName, state | Contains → Clients, Owns → Accounts |
| **Deposit Account** | `encodedKey` (UUID) | accountState, balance, productKey | Belongs to → Client/Group, Has → Transactions |
| **Loan Account** | `encodedKey` (UUID) | accountState, balance, productKey | Belongs to → Client/Group, Has → Transactions, Links → Settlement Account |
| **Transaction** | `encodedKey` (UUID) | type, amount, valueDate, entryDate | Belongs to → Account |
| **Product** | `encodedKey` (UUID) | name, type, interestSettings | Template for → Accounts |
| **Branch** | `encodedKey` (UUID) | name, address | Contains → Clients, Accounts |

### ER Diagram

```mermaid
erDiagram
    CLIENT ||--o{ DEPOSIT_ACCOUNT : owns
    CLIENT ||--o{ LOAN_ACCOUNT : owns
    CLIENT }o--o{ GROUP : "member of"
    GROUP ||--o{ DEPOSIT_ACCOUNT : owns
    GROUP ||--o{ LOAN_ACCOUNT : owns
    
    DEPOSIT_ACCOUNT ||--o{ TRANSACTION : contains
    LOAN_ACCOUNT ||--o{ TRANSACTION : contains
    LOAN_ACCOUNT ||--o| DEPOSIT_ACCOUNT : "settlement link"
    
    DEPOSIT_PRODUCT ||--o{ DEPOSIT_ACCOUNT : "template for"
    LOAN_PRODUCT ||--o{ LOAN_ACCOUNT : "template for"
    
    BRANCH ||--o{ CLIENT : contains
    BRANCH ||--o{ DEPOSIT_ACCOUNT : contains
    
    DEPOSIT_ACCOUNT ||--o{ AUTHORIZATION_HOLD : has
    DEPOSIT_ACCOUNT ||--o{ CARD : linked
```

### Sponsor Banking-Specific Questions

| Question | Mambu Answer | Confidence |
|----------|--------------|------------|
| **Joint accounts?** | Yes - via "Group" entity. Groups can own accounts and contain multiple Clients. | ✅ Documented |
| **Sub-accounts/virtual accounts?** | Not native. Mambu uses separate accounts with settlement links. Custom fields can add metadata for virtual account patterns. | 🔶 Inferred |
| **Business → Beneficial owners?** | Groups can represent businesses; member Clients can be beneficial owners. Relationship modeling is flexible but not KYC-specialized. | 🔶 Inferred |
| **Transaction linking (original → reversal)?** | Reversals reference original via `externalAuthorizationReferenceId` for card transactions. General transactions use adjustment endpoints with original reference. | ✅ Documented |

### Key Design Decisions

- **Unified Client/Group model**: Individual clients and businesses (Groups) use separate entities but follow the same patterns for account ownership
- **Product-based configuration**: All accounts derive behavior from Products (templates). Products define interest rates, fees, states, and accounting rules
- **Settlement account linking**: Loan accounts can link to deposit accounts for automatic repayment transfers
- **`encodedKey` as primary identifier**: All entities use UUIDs (`encodedKey`), with optional user-friendly `id` fields

---

## 2. State Machines

### Deposit Account States

```mermaid
stateDiagram-v2
    [*] --> PENDING_APPROVAL : create
    
    PENDING_APPROVAL --> APPROVED : approve
    PENDING_APPROVAL --> CLOSED_REJECTED : reject
    PENDING_APPROVAL --> CLOSED_WITHDRAWN : withdraw
    
    APPROVED --> ACTIVE : first_transaction
    APPROVED --> PENDING_APPROVAL : undo_approve
    APPROVED --> CLOSED_WITHDRAWN : withdraw
    
    ACTIVE --> DORMANT : inactivity_period
    ACTIVE --> LOCKED : lock
    ACTIVE --> ACTIVE_IN_ARREARS : overdraft_negative
    ACTIVE --> CLOSED : close_zero_balance
    
    ACTIVE_IN_ARREARS --> ACTIVE : repayment
    ACTIVE_IN_ARREARS --> LOCKED : lock
    ACTIVE_IN_ARREARS --> CLOSED_WRITTEN_OFF : write_off
    
    DORMANT --> ACTIVE : any_transaction
    DORMANT --> LOCKED : lock
    DORMANT --> CLOSED : close
    
    LOCKED --> ACTIVE : unlock
    LOCKED --> ACTIVE_IN_ARREARS : unlock_if_arrears
    
    CLOSED --> ACTIVE : reopen
    CLOSED_REJECTED --> [*]
    CLOSED_WITHDRAWN --> [*]
    CLOSED_WRITTEN_OFF --> [*]
```

| Transition | Trigger | Terminal? | Recoverable? |
|------------|---------|-----------|--------------|
| PENDING_APPROVAL → APPROVED | `approve` API call | No | Yes (undo_approve) |
| APPROVED → ACTIVE | Any transaction posted | No | Yes (undo_activate if no txns) |
| ACTIVE → DORMANT | Inactivity period (product config) | No | Yes (auto on transaction) |
| ACTIVE → LOCKED | `lock` API call (compliance hold) | No | Yes (unlock) |
| ACTIVE → CLOSED | Close request + zero balance | No | Yes (reopen) |
| CLOSED_REJECTED | Reject during approval | **Yes** | No |
| CLOSED_WRITTEN_OFF | Write-off (bad debt) | **Yes** | No |

### Loan Account States

```mermaid
stateDiagram-v2
    [*] --> PARTIAL_APPLICATION : create_incomplete
    [*] --> PENDING_APPROVAL : create
    
    PARTIAL_APPLICATION --> PENDING_APPROVAL : complete
    
    PENDING_APPROVAL --> APPROVED : approve
    PENDING_APPROVAL --> CLOSED_REJECTED : reject
    PENDING_APPROVAL --> PARTIAL_APPLICATION : set_incomplete
    
    APPROVED --> ACTIVE : disburse
    APPROVED --> PENDING_APPROVAL : undo_approve
    APPROVED --> CLOSED_WITHDRAWN : withdraw
    
    ACTIVE --> ACTIVE_IN_ARREARS : late_repayment
    ACTIVE --> LOCKED : lock
    ACTIVE --> CLOSED : all_paid
    ACTIVE --> CLOSED_WRITTEN_OFF : write_off
    
    ACTIVE_IN_ARREARS --> ACTIVE : repayment_current
    ACTIVE_IN_ARREARS --> LOCKED : lock
    ACTIVE_IN_ARREARS --> CLOSED_WRITTEN_OFF : write_off
    
    LOCKED --> ACTIVE : unlock
    LOCKED --> ACTIVE_IN_ARREARS : unlock_if_arrears
    
    CLOSED --> [*]
    CLOSED_REJECTED --> [*]
    CLOSED_WITHDRAWN --> [*]
    CLOSED_WRITTEN_OFF --> [*]
```

### Authorization Hold States (Card Transactions)

```mermaid
stateDiagram-v2
    [*] --> PENDING : authorization_request
    
    PENDING --> SETTLED : clearing_transaction
    PENDING --> REVERSED : reversal
    PENDING --> EXPIRED : expiration_cron
    
    SETTLED --> [*]
    REVERSED --> [*]
    EXPIRED --> [*]
```

| State | Description | Terminal? |
|-------|-------------|-----------|
| PENDING | Active hold, decreases available balance | No |
| SETTLED | Released during clearing/settlement | Yes |
| REVERSED | Reversal instruction processed | Yes |
| EXPIRED | Automatic expiration via cron job | Yes |

### Client States

```mermaid
stateDiagram-v2
    [*] --> PENDING_APPROVAL : create_with_review
    [*] --> INACTIVE : create_direct
    
    PENDING_APPROVAL --> INACTIVE : approve
    PENDING_APPROVAL --> REJECTED : reject
    
    INACTIVE --> ACTIVE : account_created
    INACTIVE --> EXITED : exit
    INACTIVE --> BLACKLISTED : blacklist
    INACTIVE --> PENDING_APPROVAL : undo_approve
    
    ACTIVE --> INACTIVE : all_accounts_closed
    ACTIVE --> BLACKLISTED : blacklist
    
    EXITED --> INACTIVE : undo_exit
    
    BLACKLISTED --> [*]
    REJECTED --> PENDING_APPROVAL : revert
```

---

## 3. Critical Flows

### ⚠️ ACH Origination

**Mambu does NOT natively support ACH.** It is a global platform without built-in US payment rail integration.

For ACH-like functionality, Mambu customers:
1. Integrate with external payment processors (Stripe, Plaid, etc.)
2. Use Mambu Payment Gateway (MPG) for SEPA in Europe
3. Use Mambu Process Orchestrator (MPO) to build custom payment workflows

**For Cassandra**: This is a significant architectural difference from US BaaS providers. Mambu provides the ledger/core, but payment rails must be integrated separately.

### Deposit Account Opening Flow

```mermaid
sequenceDiagram
    participant Client
    participant API as Mambu API v2
    participant Core as Mambu Core
    participant GL as General Ledger
    
    Client->>API: POST /clients (create client)
    API-->>Client: 201 Client Created (PENDING_APPROVAL or INACTIVE)
    
    opt If PENDING_APPROVAL
        Client->>API: POST /clients/{id}:changeState (approve)
        API-->>Client: 200 Client INACTIVE
    end
    
    Client->>API: POST /deposits (create deposit account)
    Note over API: Product template applied
    API-->>Client: 201 Account Created (PENDING_APPROVAL)
    
    Client->>API: POST /deposits/{id}:changeState (approve)
    API-->>Client: 200 Account APPROVED
    
    Client->>API: POST /deposits/{id}/transactions (deposit)
    API->>Core: Process transaction
    Core->>GL: Journal entry
    Core-->>API: Transaction complete
    API-->>Client: 201 Transaction Posted
    Note over Client: Account now ACTIVE
```

**Timing**:
- All operations synchronous
- No external KYC vendor integration (Mambu is ledger-only)
- State transitions immediate upon API response

**Confidence**: ✅ Documented explicitly

### Card Authorization Flow

```mermaid
sequenceDiagram
    participant Processor as Card Processor
    participant API as Mambu Cards API
    participant Core as Mambu Core
    participant Account as Deposit Account
    
    Processor->>API: POST /deposits/{id}/cards/{token}/authorizationholds
    Note over API: advice=false (check balance)
    API->>Core: Validate card token & account
    Core->>Account: Check available balance
    
    alt Sufficient Balance
        Account-->>Core: Balance OK
        Core->>Account: Create PENDING hold
        Core-->>API: Hold created
        API-->>Processor: 201 Authorization Approved
    else Insufficient Balance
        Account-->>Core: Insufficient funds
        Core-->>API: Decline
        API-->>Processor: 400 Authorization Declined
    end
    
    Note over Processor: Later - Settlement
    Processor->>API: POST /deposits/{id}/cards/{token}/financialtransactions
    Note over API: externalAuthorizationReferenceId links to hold
    API->>Core: Match to PENDING hold
    Core->>Account: Debit account, settle hold
    Core-->>API: Transaction complete
    API-->>Processor: 201 Transaction Settled
```

**Key Features**:
- **Dual Message Schema**: Authorization → Clearing (separate requests)
- **Single Message Schema**: ATM/PIN debits in one request
- **Authorization advice**: `advice=true` bypasses balance check (for processor-initiated)
- **Hold expiration**: Configurable per MCC, hourly cron job
- **Partial clearing**: Multiple settlements against one authorization

**Confidence**: ✅ Documented explicitly

---

## 4. Notable Architectural Patterns

### Product Template System
Mambu's accounts derive all behavior from Product definitions:
- Interest calculation rules
- Fee structures
- State machine configurations
- Accounting rules (GL mappings)
- Overdraft settings

**Implication for Cassandra**: Consider a product-based configuration layer for account behavior rather than hardcoded rules.

### Transaction Channel Abstraction
All transactions flow through "channels" that define:
- Permissions
- Fee application
- Accounting treatment
- Audit attributes

**Implication for Cassandra**: Transaction channels provide clean separation between payment rails and core ledger operations.

### Settlement Account Linking
Loan accounts link to deposit accounts for automatic repayment:
- One-to-many: deposit → multiple loans
- Many-to-one: loan → single settlement account
- Configurable transfer behavior (full only, partial, manual)

**Implication for Cassandra**: Built-in account linking patterns useful for automated sweep/funding flows.

### General Ledger Integration
Mambu exposes explicit GL journal entries:
- Every transaction creates GL entries
- Chart of accounts configurable per product
- Double-entry accounting enforced

**Implication for Cassandra**: Consider explicit ledger exposure vs. abstract balance model.

---

## 5. Confidence Summary

| Area | Confidence | Notes |
|------|------------|-------|
| Entity model | ✅ High | Well-documented in data dictionary and API reference |
| Account states | ✅ High | Explicit lifecycle documentation |
| Transaction types | ✅ High | API reference with examples |
| Card authorization | ✅ High | Detailed Cards API documentation |
| ACH/Payment rails | ❌ Not applicable | Mambu doesn't provide US payment rails |
| Multi-tenant/program separation | ❓ Unclear | Branch-based separation exists; program manager patterns not documented |
| FBO patterns | ❓ Unclear | Not explicitly documented; likely via product/branch configuration |

---

## 6. Key Takeaways for Cassandra

1. **Mambu is NOT a direct BaaS comparison**: It's a configurable core banking engine, not a US payment-rail-integrated BaaS

2. **Strong patterns to consider**:
   - Product template system for account behavior
   - Explicit state machines with undo capabilities
   - Transaction channel abstraction
   - Settlement account linking
   - Authorization hold lifecycle (PENDING → SETTLED/REVERSED/EXPIRED)

3. **Gaps relative to US sponsor banking**:
   - No native ACH, wire, or RTP support
   - No KYC vendor integration
   - No FBO account patterns documented
   - Limited sub-account/virtual account support

4. **Authentication approach**: API keys via API Consumers (OAuth-like abstraction) with rotation and grace periods

5. **ID strategy**: UUIDs (`encodedKey`) everywhere with optional human-readable `id` fields