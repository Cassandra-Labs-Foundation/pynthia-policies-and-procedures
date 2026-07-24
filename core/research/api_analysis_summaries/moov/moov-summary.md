# Moov API Analysis for Cassandra Core Banking Architecture

**Provider:** Moov  
**API Version:** v2025.07.00  
**Analysis Date:** December 2024

---

## Executive Summary

Moov is a money movement platform offering a unified API for payments, with a distinctive **facilitator model** where the platform acts as an intermediary between accounts. Key architectural highlights:

- **Unified Account model** - individual/business types in single entity with capability-based feature enablement
- **Wallet-centric architecture** - Moov wallets serve as the hub for all money movement
- **Payment Method abstraction** - source/destination identified by `paymentMethodID` across all rails
- **Capabilities as feature flags** - progressive KYC unlocks specific money movement abilities

---

## 1. Entity Relationships

### ER Diagram

```mermaid
erDiagram
    ACCOUNT ||--o{ WALLET : has
    ACCOUNT ||--o{ BANK_ACCOUNT : links
    ACCOUNT ||--o{ CARD : links
    ACCOUNT ||--o{ CAPABILITY : requests
    ACCOUNT ||--o{ REPRESENTATIVE : has
    ACCOUNT ||--o{ ISSUED_CARD : owns
    
    WALLET ||--o{ WALLET_TRANSACTION : records
    WALLET ||--o{ SWEEP_CONFIG : configures
    WALLET ||--|{ PAYMENT_METHOD : generates
    
    BANK_ACCOUNT ||--|{ PAYMENT_METHOD : generates
    CARD ||--|{ PAYMENT_METHOD : generates
    
    TRANSFER }o--|| PAYMENT_METHOD : source
    TRANSFER }o--|| PAYMENT_METHOD : destination
    TRANSFER ||--o{ CANCELLATION : may_have
    TRANSFER ||--o{ REFUND : may_have
    TRANSFER ||--o{ DISPUTE : may_have
    
    ISSUED_CARD }o--|| WALLET : funded_by
    ISSUED_CARD ||--o{ AUTHORIZATION : receives
    AUTHORIZATION ||--o{ CARD_TRANSACTION : settles_to
    
    SWEEP_CONFIG ||--o{ SWEEP : generates
    SWEEP }o--o| TRANSFER : creates
```

### Core Entities

| Entity | ID Format | Key Attributes | Relationships |
|--------|-----------|----------------|---------------|
| **Account** | UUID | `accountType` (individual/business/guest), `profile`, `verification`, `capabilities[]`, `foreignID` | Parent of all customer resources |
| **Wallet** | UUID | `availableBalance`, `status`, `walletType`, `name` | Belongs to Account; generates moov-wallet PaymentMethod |
| **BankAccount** | UUID | `fingerprint`, `status`, `holderType`, `routingNumber`, `lastFourAccountNumber` | Linked to Account; generates ACH PaymentMethods |
| **Card** | UUID | `fingerprint`, `brand`, `cardType`, `bin`, `expiration`, `cardVerification` | Linked to Account; generates card PaymentMethods |
| **Transfer** | UUID | `source`, `destination`, `amount`, `status`, `facilitatorFee`, `moovFee` | References PaymentMethods for source/destination |
| **PaymentMethod** | UUID | `paymentMethodType` (discriminated union), underlying instrument details | Generated from Wallet/BankAccount/Card |
| **Representative** | UUID | `name`, `responsibilities` (isController, isOwner, ownershipPercentage) | Belongs to business Account |
| **Capability** | Enum string | `status`, `requirements`, `disabledReason` | Attached to Account |

### Key Design Decisions

**Account Model**
- ✅ **Unified account type** with `individual` / `business` / `guest` discrimination
- Profile contains either `IndividualProfile` or `BusinessProfile` (or `GuestProfile`)
- Business accounts require Representatives for beneficial ownership
- `ownersProvided` flag indicates when all beneficial owners have been submitted

**Joint Accounts**
- ❓ **No explicit joint account support** visible in API
- Single `holderName` on BankAccount suggests single-owner model
- Multiple Representatives model ownership for businesses, not joint individuals

**Sub-accounts/Virtual Accounts**
- ✅ **Multiple Wallets per Account** supported
- Wallets have `name` and `description` for purpose differentiation
- Each Wallet generates its own `moov-wallet` PaymentMethod
- 🔶 This is the closest to virtual account functionality

**Business → Beneficial Owner Relationship**
- Representatives are separate entities linked to business Account
- `responsibilities.isOwner` + `ownershipPercentage` for equity ownership
- `responsibilities.isController` for management authority
- Maximum 7 representatives per account

**Transaction Linking**
- ✅ **Transfer Groups** via `source.transferID` - links new transfer to parent
- `refunds[]` and `cancellations[]` arrays on Transfer for reversals
- `disputes[]` for chargebacks
- `groupID` for transfer group membership
- `sweepID`, `scheduleID`, `occurrenceID` for automated transfer origins

---

## 2. State Machines

### Account Verification States

```mermaid
stateDiagram-v2
    [*] --> unverified : Account created
    unverified --> pending : KYC submitted
    pending --> verified : KYC approved
    pending --> resubmit : Additional info needed
    pending --> review : Manual review
    pending --> failed : KYC rejected
    resubmit --> pending : Info resubmitted
    review --> verified : Approved
    review --> failed : Rejected
    verified --> [*]
    failed --> [*]
```

| State | Terminal? | Recoverable? | Trigger |
|-------|-----------|--------------|---------|
| `unverified` | No | - | Initial state |
| `pending` | No | - | KYC submission |
| `resubmit` | No | Yes | Missing/invalid data |
| `review` | No | - | Manual review required |
| `verified` | Yes | - | KYC approved |
| `failed` | Yes | No | KYC failed |

### Transfer States

```mermaid
stateDiagram-v2
    [*] --> created : Transfer initiated
    created --> queued : Scheduled for future
    created --> pending : Processing started
    queued --> pending : Schedule triggered
    pending --> completed : Success
    pending --> failed : Error
    completed --> reversed : Full reversal
    canceled --> [*]
    failed --> [*]
    completed --> [*]
    reversed --> [*]
    
    note right of pending : Rail-specific sub-states via webhooks
```

**Transfer Status Values:** `created` → `pending` → `completed` | `failed` | `reversed` | `queued` | `canceled`

**Webhook Sub-States** (for granular tracking):
- Source: `source.initiated` → `source.originated` → `source.confirmed` → `source.settled` → `source.completed`
- Destination: `destination.initiated` → `destination.originated` → `destination.confirmed` → `destination.completed`
- Error paths: `source.returned`, `source.corrected`, `source.failed`, `source.canceled`

| State | Terminal? | Recoverable? | Notes |
|-------|-----------|--------------|-------|
| `created` | No | - | Initial state |
| `queued` | No | Yes | Scheduled transfer |
| `pending` | No | - | In-flight |
| `completed` | Semi | - | Can be reversed |
| `failed` | Yes | No | Check `failureReason` |
| `reversed` | Yes | - | Via cancellation or refund |
| `canceled` | Yes | No | Pre-completion cancellation |

**Failure Reasons:** `source-payment-error`, `destination-payment-error`, `wallet-insufficient-funds`, `rejected-high-risk`, `processing-error`

### Bank Account States

```mermaid
stateDiagram-v2
    [*] --> new : Bank account linked
    new --> pending : Verification initiated
    pending --> verified : Verification successful
    pending --> verificationFailed : Verification failed
    pending --> errored : System error
    verified --> errored : ACH return
    errored --> [*]
    verified --> [*]
    verificationFailed --> [*]
```

**Status Values:** `new` → `pending` → `verified` | `verificationFailed` | `errored`

**Status Reasons:** `bank-account-created`, `verification-initiated`, `micro-deposit-attempts-exceeded`, `micro-deposit-expired`, `verification-successful`, `ach-debit-return`, `ach-credit-return`, etc.

### Issued Card States

```mermaid
stateDiagram-v2
    [*] --> inactive : Card created
    inactive --> pending_verification : Activation started
    pending_verification --> active : Verification complete
    active --> inactive : Deactivated
    active --> closed : Terminated
    inactive --> closed : Terminated
    closed --> [*]
```

**State Values:** `inactive` → `pending-verification` → `active` ↔ `inactive` → `closed`

### Capability States

```mermaid
stateDiagram-v2
    [*] --> pending : Capability requested
    pending --> in_review : Manual review
    pending --> enabled : Auto-approved
    in_review --> enabled : Approved
    in_review --> disabled : Rejected
    enabled --> disabled : Compliance issue
    disabled --> enabled : Issue resolved
```

**Status Values:** `pending` → `in-review` → `enabled` | `disabled`

---

## 3. Critical Flows

### ACH Origination Flow (Credit and Debit)

```mermaid
sequenceDiagram
    participant Client
    participant Moov
    participant Wallet
    participant Fed as ACH Network
    
    Note over Client,Fed: ACH DEBIT (Pull funds from external bank)
    Client->>Moov: POST /accounts/{id}/transfers<br/>{source: ach-debit-fund, dest: moov-wallet}
    Moov-->>Client: 200 {transferID, status: "created"}
    
    Moov->>Moov: Hold period starts
    Note right of Moov: DebitHoldPeriod:<br/>no-hold, 1-day, 2-days
    
    Moov->>Fed: Submit ACH debit
    Moov->>Client: Webhook: transfer.updated<br/>status: source.initiated
    
    Fed-->>Moov: ACH acknowledgment
    Moov->>Client: Webhook: transfer.updated<br/>status: source.originated
    
    alt Success
        Fed-->>Moov: Settlement
        Moov->>Wallet: Credit funds
        Moov->>Client: Webhook: transfer.updated<br/>status: completed
    else Return (R01-R39)
        Fed-->>Moov: ACH Return
        Moov->>Client: Webhook: transfer.updated<br/>status: source.returned
        Note over Moov: BankAccount may move to errored
    end
    
    Note over Client,Fed: ACH CREDIT (Push funds to external bank)
    Client->>Moov: POST /accounts/{id}/transfers<br/>{source: moov-wallet, dest: ach-credit-standard/same-day}
    Moov->>Wallet: Debit funds
    Moov-->>Client: 200 {transferID, status: "pending"}
    
    Moov->>Fed: Submit ACH credit
    Moov->>Client: Webhook: transfer.updated<br/>status: destination.originated
    
    Fed-->>Moov: Settlement confirmation
    Moov->>Client: Webhook: transfer.updated<br/>status: completed
```

**Timing (inferred)**
- ✅ Same-day ACH supported via `ach-credit-same-day` payment method type
- 🔶 Cutoff times not explicitly documented in API spec
- Debit hold period configurable: `no-hold`, `1-day`, `2-days`
- ACH return window: Standard 2-day return + extended 60-day window for unauthorized

**SEC Codes Supported:** `WEB`, `PPD`, `CCD`, `TEL`

**Return Handling**
- ACH returns reflected in `achDetails.return` with `ACHReturnCode`
- Supported return codes: R02, R03, R04, R05, R07, R08, R10, R11, R12, R13, R14, R15, R16, R17, R20, R23, R29, R34, R38, R39
- Bank account status may change to `errored` on return

### Account Opening Flow

```mermaid
sequenceDiagram
    participant Client
    participant Moov
    participant KYC as KYC Provider
    
    Note over Client,KYC: INDIVIDUAL ACCOUNT
    Client->>Moov: POST /accounts<br/>{accountType: "individual", profile: {...}}
    Moov-->>Client: 200 {accountID, verification.status: "unverified"}
    
    Client->>Moov: POST /accounts/{id}/capabilities<br/>{capabilities: ["wallet", "send-funds"]}
    Moov-->>Client: 200 {status: "pending", requirements: {...}}
    
    Note over Moov,KYC: Async KYC verification
    Moov->>KYC: Submit identity data
    KYC-->>Moov: Verification result
    
    Moov->>Client: Webhook: capability.updated<br/>status: enabled
    Moov->>Client: Webhook: account.updated<br/>verification.status: verified
    
    Note over Client,KYC: BUSINESS ACCOUNT
    Client->>Moov: POST /accounts<br/>{accountType: "business", profile: {...}}
    Moov-->>Client: 200 {accountID}
    
    loop For each beneficial owner (>25%)
        Client->>Moov: POST /accounts/{id}/representatives<br/>{name, responsibilities, governmentID...}
        Moov-->>Client: 200 {representativeID}
    end
    
    Client->>Moov: PATCH /accounts/{id}<br/>{profile.business.ownersProvided: true}
    
    Client->>Moov: POST /accounts/{id}/capabilities
    Note over Moov,KYC: Business + representative verification
    Moov->>Client: Webhook: capability.updated
```

**Individual vs Business Differences**
- Individual: Name, DOB, SSN/ITIN, Address
- Business: Legal name, EIN, business type, address + Representatives
- Business types: `soleProprietorship`, `llc`, `partnership`, `privateCorporation`, `publicCorporation`, `trust`, `unincorporatedAssociation`, `unincorporatedNonProfit`, `incorporatedNonProfit`, `governmentEntity`

**Timing**
- Account creation: Synchronous
- KYC verification: Asynchronous (no SLA documented in API)
- Capability enablement: Async, dependent on KYC + underwriting

### Card Authorization Flow (Acquiring)

```mermaid
sequenceDiagram
    participant Cardholder
    participant Merchant
    participant Moov
    participant Network as Card Network
    
    Cardholder->>Merchant: Present card
    Merchant->>Moov: POST /accounts/{id}/transfers<br/>{source: card-payment, dest: moov-wallet}
    
    Note over Moov,Network: Real-time authorization
    Moov->>Network: Authorization request
    
    alt Approved
        Network-->>Moov: Approved
        Moov-->>Merchant: 200 {transferID, status: "pending"}<br/>cardDetails.status: "initiated"
        Moov->>Merchant: Webhook: transfer.updated<br/>cardDetails.status: confirmed
        
        Note over Moov,Network: Settlement (T+1 to T+2)
        Network-->>Moov: Settlement
        Moov->>Merchant: Webhook: transfer.updated<br/>cardDetails.status: settled → completed
    else Declined
        Network-->>Moov: Declined + reason
        Moov-->>Merchant: 4xx/5xx with failureCode
    end
```

**Card Transaction Status Flow:** `initiated` → `confirmed` → `settled` → `completed`

**Decline Codes:** `call-issuer`, `do-not-honor`, `processing-error`, `invalid-transaction`, `invalid-amount`, `cvv-mismatch`, `lost-or-stolen`, `insufficient-funds`, `invalid-card-number`, `expired-card`, `incorrect-pin`, `suspected-fraud`, `amount-limit-exceeded`, `velocity-limit-exceeded`, etc.

### Card Issuing Authorization Flow

```mermaid
sequenceDiagram
    participant Cardholder
    participant Merchant
    participant Network as Card Network
    participant Moov
    participant Wallet as Funding Wallet
    
    Cardholder->>Merchant: Present issued card
    Merchant->>Network: Authorization request
    Network->>Moov: Authorization request
    
    Moov->>Wallet: Check available balance
    
    alt Sufficient funds
        Moov->>Wallet: Place auth hold
        Moov-->>Network: Approved
        Network-->>Merchant: Approved
        Moov->>Client: Webhook: walletTransaction.updated<br/>type: issuing-auth-hold
        
        Note over Moov,Wallet: Settlement
        Moov->>Wallet: Convert hold to debit
        Moov->>Client: Webhook: walletTransaction.updated<br/>type: issuing-transaction
    else Insufficient funds
        Moov-->>Network: Declined
        Moov->>Client: Webhook: walletTransaction.updated<br/>type: issuing-decline
    end
```

**Issued Card States:** `inactive` → `pending-verification` → `active` ↔ `inactive` → `closed`

---

## 4. Notable Design Patterns

### Facilitator Model
Moov uses a **facilitator** architecture:
- Platform (facilitator) creates accounts for end users
- Accounts are "connected" to the facilitator
- `facilitatorFee` allows platform to take fees on transfers
- Scoped access tokens: `/accounts/{accountID}/transfers.write`

### Payment Method Abstraction
All money movement uses the same transfer structure:
```json
{
  "source": { "paymentMethodID": "..." },
  "destination": { "paymentMethodID": "..." },
  "amount": { "value": 10000, "currency": "USD" }
}
```

PaymentMethod types determine the rail:
- `moov-wallet` - Internal wallet transfer
- `ach-debit-fund` / `ach-debit-collect` - ACH pull
- `ach-credit-standard` / `ach-credit-same-day` - ACH push
- `rtp-credit` - Real-time payments
- `card-payment` - Card acquiring
- `push-to-card` / `pull-from-card` - Card disbursement/funding
- `apple-pay` - Apple Pay

### Wallet as Hub
- All external rails land in/originate from Moov Wallet
- Wallet balance is the source of truth for available funds
- Sweeps automate wallet → bank account movement

### X-Wait-For Header Pattern
Critical for reducing round-trips:
```
X-Wait-For: payment-method
```
Instructs Moov to wait for async PaymentMethod generation before responding.

---

## 5. Confidence Notes

| Area | Confidence | Notes |
|------|------------|-------|
| Entity relationships | ✅ Documented | Clear from schemas |
| Account states | 🔶 Partial | AccountVerificationStatus deprecated, new model unclear |
| Transfer states | ✅ Documented | Webhook sub-states provide detail |
| ACH timing/cutoffs | ❓ Unclear | Not in API spec, likely in guides |
| Card settlement timing | 🔶 Inferred | T+1 to T+2 typical |
| Joint accounts | ❓ Unclear | No explicit support visible |
| FBO account model | ❓ Unclear | Not documented in API spec |
| Wire transfers | ❓ Not found | Not in this API version |
| Same-day ACH cutoff | ❓ Unclear | Payment method exists, timing not specified |

---

## 6. Sponsor Banking Considerations

### What Moov Provides Well
1. **Capability-based progressive KYC** - enables tiered account access
2. **Unified payment method model** - consistent API across rails
3. **Wallet-centric design** - clear fund accounting
4. **Transfer groups** - parent-child transaction linking
5. **Comprehensive webhooks** - granular state transitions
6. **Sweep configuration** - automated wallet-to-bank movement
7. **Card issuing** - native card program support

### Gaps for Sponsor Banking
1. **No explicit FBO/omnibus account modeling** - would need custom abstraction
2. **No joint account support** - individual accounts only
3. **Limited GL/ledger exposure** - WalletTransaction closest to ledger entries
4. **No wire transfer support** in current API version
5. **Underwriting status deprecated** - transition to new model unclear

### Architectural Implications for Cassandra
- Moov's facilitator model aligns well with BaaS sponsor banking
- Would need to build FBO layer on top
- Capability model could map to Cassandra's program-level permissions
- Transfer groups provide foundation for complex transaction chains
- Wallet balance tracking handles fund availability