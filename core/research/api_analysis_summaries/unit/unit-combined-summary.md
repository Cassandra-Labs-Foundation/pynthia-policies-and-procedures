# Unit Banking-as-a-Service API: Comprehensive Documentation Summary

**Prepared for:** Cassandra Core Banking System Development  
**Date:** December 12, 2025  
**Sources:** OpenAPI Specification, Live Documentation (docs.unit.co), Help Center

---

## Executive Summary

This document synthesizes information from Unit's OpenAPI specification, live documentation, and help center to provide a complete reference for building integrations with Unit's Banking-as-a-Service platform.

---

## 1. Core Banking Entities

### 1.1 Entity Types and Relationships

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        UNIT ENTITY MODEL                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  APPLICATION ──────────► CUSTOMER ──────────► ACCOUNT                   │
│       │                      │                    │                     │
│       │                      │                    ├──► TRANSACTION      │
│       ▼                      │                    ├──► CARD             │
│  BENEFICIAL_OWNER            │                    └──► PAYMENT          │
│  (for business)              │                            │             │
│                              ▼                            ▼             │
│                         COUNTERPARTY              AUTHORIZATION         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

| Entity | Types | ID Format | Description |
|--------|-------|-----------|-------------|
| **Application** | `individualApplication`, `businessApplication` | Numeric string | KYC application, precedes Customer creation |
| **Customer** | `individualCustomer`, `businessCustomer` | Numeric string | Verified account holder |
| **Account** | `depositAccount`, `creditAccount`, `walletAccount` | Numeric string | Financial account |
| **Transaction** | 30+ types | Numeric string | Immutable financial movement record |
| **Payment** | `achPayment`, `bookPayment`, `wirePayment` | Numeric string | Payment initiation |
| **Card** | 6 types (individual/business × physical/virtual × debit/credit) | Numeric string | Debit/credit cards |
| **Counterparty** | `achCounterparty` | Numeric string | External account reference |
| **Authorization** | `purchaseAuthorization`, `atmAuthorization`, etc. | Numeric string | Card authorization hold |

### 1.2 Key Entity Attributes

**Application:**
- `type`: individual or business
- `status`: Pending | AwaitingDocuments | PendingReview | Approved | Denied | Canceled
- Individual: `fullName`, `ssn`, `dateOfBirth`, `address`, `email`, `phone`
- Business: `name`, `ein`, `officer`, `beneficialOwners[]`, `stateOfIncorporation`

**Customer:**
- `type`: individualCustomer | businessCustomer
- `status`: Active | Archived
- `riskRate`: low | medium | high
- `authorizedUsers[]`: Additional users with account access

**Account:**
- `type`: depositAccount | creditAccount | walletAccount
- `status`: Open | Frozen | Closed
- `routingNumber`, `accountNumber`
- `balance`, `hold`, `available` (all in cents as int64)
- `closeReason`: ByCustomer | Fraud | NegativeBalance | ByBank | BreachOfTermsAndConditions | NoAccountActivity | ProgramChange

**Card:**
- `type`: individualDebitCard | businessDebitCard | individualVirtualDebitCard | businessVirtualDebitCard | individualCreditCard | businessCreditCard
- `status`: Active | Inactive | Frozen | Lost | Stolen | ClosedByCustomer | SuspectedFraud
- Physical cards start `Inactive`, virtual cards start `Active`

**Payment:**
- `type`: achPayment | bookPayment | wirePayment
- `status`: Pending | PendingReview | Rejected | Clearing | Sent | Canceled | Returned
- `direction`: Credit | Debit
- `amount`: cents (int64)

### 1.3 Special Entity Patterns

**Joint Accounts:**
- Supported via `customers` array (2+ individuals)
- At least one customer must be 18+
- All joint holders share equal access
- Created via `CreateDepositAccount` with multiple customer relationships
- Managed via `AddAccountOwnersRequest` / `RemoveAccountOwnersRequest`

**Sole Proprietorships:**
- Use `individualApplication` with `soleProprietorship: true`
- Can optionally include EIN and DBA (doing business as) name
- Uses SSN instead of requiring EIN

**Business Structure:**
- `officer`: Single object (C-level executive with decision-making authority)
- `beneficialOwners[]`: Array with `percentage` ownership (25-100%)
- 25% ownership threshold triggers beneficial owner KYC requirements

**Wallet Accounts:**
- Sub-ledger functionality for FBO (For Benefit Of) patterns
- Limited functionality compared to `depositAccount`
- Designed for fintech partner use cases

---

## 2. API Design Patterns

### 2.1 Authentication

**Token Types:**

| Token Type | Use Case | Scope | Creation |
|------------|----------|-------|----------|
| **Org API Token** | Server-to-server calls | Broad, system-level | Dashboard or API |
| **Customer Token** | End-customer actions | Customer-specific resources only | API with 2FA |
| **Cardholder Token** | Single card operations | One specific card | API with 2FA |
| **Partner Token** | Third-party integrations | Read-only, shared clients | Dashboard |

**Authentication Method:**
```
Authorization: Bearer v2.public.eyJyb2xlIjoib3JnIiwidX...
```

**Token Characteristics:**
- OAuth 2.0 Bearer Token
- Customer tokens: Up to 24 hours expiration, built-in 2FA
- Org tokens: Custom expiration, optional source IP restriction
- Invalid/missing/expired token returns `HTTP 401 Unauthorized`

**Two-Factor Authentication Requirements:**
| Use Case | 2FA Required |
|----------|--------------|
| Application submission | Phone OTP |
| Sensitive scopes access | Within 24 hours |
| PCI-sensitive card data | Always (via customer token) |

**Sandbox 2FA:** Use passcode `000001` for testing

### 2.2 Rate Limits and Timeouts

| Parameter | Value |
|-----------|-------|
| **Rate Limit** | 1,000 requests/minute per IP |
| **Rate Limit Response** | HTTP 429 |
| **Short Timeout** | 5 seconds (most APIs) |
| **Long Timeout** | 60-120 seconds (specific APIs) |
| **Recommended Retry** | Exponential backoff with jitter |
| **Retryable Codes** | 5xx, 429, 408 |

### 2.3 Idempotency

- Supported on create operations (accounts, payments, cards)
- Key: Any string up to 255 characters (UUID v4 recommended)
- Effective for 48 hours after successful use
- Keys are per-operation-type (not shared across different API operations)
- Exception: Debit card creation shares key between physical and virtual

### 2.4 Pagination

```
GET /resources?page[limit]=100&page[offset]=0
```

| Parameter | Default | Range |
|-----------|---------|-------|
| `page[limit]` | 100 | 1-1000 |
| `page[offset]` | 0 | 0+ |

### 2.5 JSON:API Compliance

Unit strictly adheres to JSON:API specification:
- Standardized relationship handling
- Included resources pattern for reducing roundtrips
- Type discriminators on all resources
- Links and meta information

### 2.6 Tags System

- Key-value pairs attachable to most resources
- Max 15 tags per resource
- Key: 128 chars (letters, numbers, underscores)
- Value: 256 chars
- Searchable via List operations
- Tag inheritance: Customer inherits from Application

### 2.7 Error Handling

**Error Response Structure:**
```json
{
  "errors": [{
    "title": "Error Title",
    "detail": "Detailed error message",
    "status": "400"
  }]
}
```

**Common HTTP Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |
| 429 | Rate Limited |
| 5xx | Server Error |

---

## 3. State Machines

### 3.1 Account States

```
┌─────────┐
│  Open   │◄────────────────────┐
│(initial)│                     │
└────┬────┘                     │ reopen()
     │                          │ (ByCustomer only)
     │ freeze()                 │
     ▼                          │
┌─────────┐     unfreeze()      │
│ Frozen  │─────────────────────┤
└────┬────┘                     │
     │                          │
     │ close()                  │
     ▼                          │
┌─────────────────────────────────┐
│            Closed               │
│  closeReason:                   │
│  • ByCustomer ──────────────────┘ (recoverable)
│  • Fraud (terminal)             
│  • NegativeBalance              
│  • ByBank (terminal)            
│  • BreachOfTermsAndConditions   
│  • NoAccountActivity            
│  • ProgramChange                
└─────────────────────────────────┘
```

**Close Behaviors:**
- Balance < $1: Auto-swept to org revenue account
- Associated cards: Frozen/closed with account
- `ByCustomer` reason: Allows reopen
- Other reasons: Terminal

**API Endpoints:**
- `POST /accounts/{id}/freeze` (accepts `freezeReason`)
- `POST /accounts/{id}/unfreeze`
- `POST /accounts/{id}/close` (requires `closeReason`)
- `POST /accounts/{id}/reopen`

**DACA Sub-States:**
- `Entered` → `Activated` via `/accounts/{id}/activate-daca`
- `Activated` → `Entered` via `/accounts/{id}/deactivate-daca`

### 3.2 Application/KYC States

```
┌─────────────┐
│   Pending   │ (async KYC evaluation)
└──────┬──────┘
       │
       ├────────────► Approved ────────► Customer created
       │
       ├────────────► Denied (terminal)
       │
       ├────────────► Canceled (only from AwaitingDocuments/PendingReview)
       │
       └────────────► AwaitingDocuments
                            │
                            │ upload docs
                            ▼
                      PendingReview (2hr SLA)
                            │
                            ├──────► Approved
                            └──────► Denied
```

**Cancellation Rules:**
- Allowed: `AwaitingDocuments`, `PendingReview`
- Not allowed: `Pending`, `Approved`, `Denied`

### 3.3 ACH Payment States

```
┌─────────┐
│ Pending │
└────┬────┘
     │
     ├──► PendingReview (risk flagged, 2hr SLA)
     │         │
     │         ├──► Sent
     │         └──► Canceled
     │
     ├──► Sent (credit path) ──► Returned (if return received)
     │
     ├──► Clearing (debit path) ──► Sent ──► Returned
     │
     ├──► Canceled
     │
     └──► Rejected
              │
              └─ Reasons:
                 • InsufficientFunds
                 • DailyACHCreditLimitExceeded
                 • DailyACHDebitLimitExceeded
                 • CounterpartyInsufficientFunds
                 • PlaidBalanceUnavailable
                 • SuspectedFraud
                 • NameMismatch
```

### 3.4 Card States

```
Physical Card:              Virtual Card:
┌──────────┐               ┌──────────┐
│ Inactive │               │  Active  │ (created active)
└────┬─────┘               └────┬─────┘
     │ activate()               │
     ▼                          │
┌──────────┐                    │
│  Active  │◄───────────────────┘
└────┬─────┘
     │ freeze()
     ▼
┌──────────┐
│  Frozen  │ ◄──── unfreeze() ────┐
└────┬─────┘                      │
     │                            │
     └────────────────────────────┘
     
Terminal States (from Active):
• Lost (report-lost)
• Stolen (report-stolen)
• ClosedByCustomer (close)
• SuspectedFraud* (sometimes recoverable)
```

---

## 4. Critical Operational Flows

### 4.1 Account Opening / KYC Flow

**Individual Application:**
```
1. POST /applications (type: individualApplication)
   - Required: fullName, ssn, dateOfBirth, address, email, phone
   - Response: 201 Created, status: Pending

2. Async KYC evaluation (~seconds to days)
   
3a. Auto-Approved Path:
    - Webhook: application.approved
    - Customer resource created automatically

3b. Documents Required Path:
    - Webhook: application.awaitingDocuments
    - POST /applications/{id}/documents (upload docs)
    - Status: PendingReview (2hr SLA)
    - Webhook: application.approved OR application.denied

4. Account Creation:
   POST /accounts (type: depositAccount)
   - Response: 201 Created, status: Open
   - Webhook: account.created
```

**Business Application (additional steps):**
```
1. POST /applications (type: businessApplication)
   - Required: name, ein, stateOfIncorporation
   - officer: Single contact with decision authority
   - beneficialOwners[]: Each owner ≥25%

2. Parallel KYC:
   - Business verification (EIN, state records)
   - Officer KYC
   - Each beneficial owner KYC

3. May require: Articles of incorporation, EIN letter
```

**Timing Estimates:**
| Stage | Duration |
|-------|----------|
| Sync response | 500ms - 2s |
| Auto-decision | Often immediate |
| Manual review | 1-3 business days |
| Document processing | Hours to days |

### 4.2 ACH Origination Flow

**Credit (Push) Flow:**
```
1. POST /payments (type: achPayment, direction: Credit)
   - Funds debited from account immediately
   - Response: 201 Created, status: Pending

2. Validation & limit checks
   - If failed: Webhook: payment.rejected

3. Risk Review (if flagged)
   - Status: PendingReview
   - 2hr SLA for manual review

4. Before bank cutoff:
   - Status: Sent
   - Webhook: payment.sent
   - Transaction created
```

**Debit (Pull) Flow:**
```
1. POST /payments (type: achPayment, direction: Debit)
   - Response: 201 Created, status: Pending

2. Status: Clearing
   - Webhook: payment.clearing
   - Clearing period applies (configurable via clearingDaysOverride)

3. After clearing:
   - Status: Sent
   - Webhook: payment.sent
   - Funds credited to account
```

**ACH Cutoff Times:**

| Window | Manual Review Cutoff | Bank Cutoff | Fed Transmission | Settlement (Next-Day) | Settlement (Same-Day) |
|--------|---------------------|-------------|------------------|----------------------|----------------------|
| Morning | 9:00 AM ET | ~10:00 AM ET | 10:30 AM ET | 8:30 PM ET next day | 1:00 PM ET same day |
| Afternoon | 1:00 PM ET | ~2:15 PM ET | 2:45 PM ET | 8:30 PM ET next day | 5:00 PM ET same day |
| Evening | 3:00 PM ET | ~4:15 PM ET | 4:45 PM ET | 8:30 PM ET next day | 6:00 PM ET same day |

**Standard ACH Cutoff:** 3:00 PM ET

**Same-Day ACH:**
- Disabled by default (contact Unit to enable)
- Max amount: $1,000,000 per payment
- Additional cost compared to standard ACH
- Unit cannot guarantee same-day posting by receiving bank

**ACH Return Windows:**
| Return Type | Timeframe |
|-------------|-----------|
| Standard returns | 2 business days |
| Unauthorized (consumer accounts) | 60 calendar days |
| Business-to-business | 24 hours |

**ACH Return Thresholds (NACHA):**
| Return Type | Max Rate |
|-------------|----------|
| Unauthorized (R05, R07, R10, R11, R29) | 0.5% |
| Administrative (R02, R03, R04) | 3% |
| All returns | 15% |

### 4.3 Wire Transfer Flow

**Originated Wire:**
```
1. POST /payments (type: wirePayment)
   - May be auto-approved, rejected, or routed for manual review

2. If manual review required:
   - Status: PendingReview
   - Reviewer must approve/reject

3. Transmission to Federal Reserve:
   - Every hour between 9:00 PM ET (previous day) and 6:00 PM ET
   - Unit cutoff: 6:00 PM ET

4. Settlement:
   - Real-time during Fed operating hours
   - Fed hours: 9:00 PM ET (previous day) to 6:45 PM ET
```

### 4.4 Card Authorization Flow

```
1. Authorization Request
   Merchant → Card Network → Unit

2. Validation:
   - Balance check
   - Limits check
   - Card status check
   - Card expiration check

3a. Standard Flow (auto-decision):
    - Response in ~100-150ms
    - Webhook: authorization.created

3b. Programmatic Authorization (if enabled):
    - Unit → Client webhook POST
    - Client has 2 seconds to respond
    - Response: approve / decline / default
    - Partial approval supported

4. Settlement (T+1 to T+3):
   - Webhook: transaction.created
   - Hold released

Decline Reasons:
• AccountClosed
• CardExceedsAmountLimit
• DoNotHonor
• InsufficientFunds
• InvalidMerchant
• ReferToCardIssuer
• RestrictedCard
• TransactionNotPermittedToCardholder
```

---

## 5. Webhooks and Events

### 5.1 Webhook Configuration

**Delivery Methods:**
| Method | Behavior |
|--------|----------|
| At Most Once | Single delivery attempt, no retry |
| At Least Once | Batched (up to 64 events), Fibonacci backoff retry up to 1 hour |

**Subscription Types:**
- `All` - All events
- `OnlyAuthorizationRequest` - Only authorizationRequest.* events
- `NotAuthorizationRequest` - All except authorization requests

**Webhook IPs (for whitelisting):**
| Environment | IPs |
|-------------|-----|
| Sandbox | 54.81.62.38, 35.169.213.205, 3.234.105.75 |
| Live | 3.209.193.26, 54.156.65.95, 54.165.224.37 |

**Webhook Timeout:**
- Unresponsive for 7 days (production) → Status: `Unavailable`
- Unresponsive for 2 days (sandbox) → Status: `Unavailable`
- Max webhooks: 100 enabled per org (sandbox)

### 5.2 Signature Verification

```javascript
const crypto = require('crypto');
const signature = request.header("x-unit-signature");
const hmac = crypto.createHmac('sha1', YOUR_SECRET);
hmac.update(JSON.stringify(request.body));
const valid = hmac.digest('base64') === signature;
```

### 5.3 Key Event Types

**Application Events:**
- `application.awaitingDocuments`
- `application.pendingReview`
- `application.approved`
- `application.denied`
- `application.canceled`

**Customer Events:**
- `customer.created`
- `customer.updated`
- `customer.archived`

**Account Events:**
- `account.created`
- `account.closed`
- `account.frozen`
- `account.unfrozen`
- `account.reopened`

**Payment Events:**
- `payment.created`
- `payment.pending`
- `payment.pendingReview`
- `payment.clearing`
- `payment.sent`
- `payment.rejected`
- `payment.returned`
- `payment.canceled`

**Transaction Events:**
- `transaction.created`
- `transaction.updated`

**Card Events:**
- `card.created`
- `card.activated`
- `card.statusChanged`

**Authorization Events:**
- `authorization.created`
- `authorization.amountChanged`
- `authorization.declined`
- `authorizationRequest.pending`
- `authorizationRequest.approved`
- `authorizationRequest.declined`

---

## 6. Sandbox Testing

### 6.1 Environment URLs

| Environment | Dashboard | API |
|-------------|-----------|-----|
| Sandbox | https://app.s.unit.sh/ | https://api.s.unit.sh/ |
| Live | https://app.unit.co | https://api.unit.co/ |

### 6.2 Simulation Endpoints

**ACH Simulations:**
```bash
# Simulate incoming ACH credit
POST /sandbox/ach/receive

# Simulate ACH return
POST /sandbox/ach/return

# Simulate incoming ACH debit
POST /sandbox/received-ach-debits
```

**Wire Simulations:**
```bash
# Simulate incoming wire
POST /sandbox/wires/receive

# Simulate wire transmission
POST /sandbox/wire/transmit
```

**Card Simulations:**
```bash
# Simulate card purchase
POST /sandbox/purchases

# Simulate purchase authorization request
POST /sandbox/authorization-requests/purchase

# Simulate ATM authorization request
POST /sandbox/authorization-requests/atm

# Simulate card transaction authorization request
POST /sandbox/authorization-requests/card-transaction

# Simulate authorization increase
POST /sandbox/authorizations/{id}/increase
```

**Application Simulations:**
- Most applications auto-approve in sandbox
- Use specific data to trigger other statuses
- Document verification: Use sandbox endpoints to approve/reject

**Sandbox 2FA Passcode:** `000001`

### 6.3 SDKs and Tools

**Official SDKs:**
- TypeScript: https://github.com/unit-finance/unit-node-sdk
- Python: https://github.com/unit-finance/unit-python-sdk
- Ruby: https://github.com/unit-finance/unit-ruby-sdk
- Java: https://github.com/unit-finance/unit-openapi-java-sdk

**OpenAPI Specification:**
- https://github.com/unit-finance/openapi-unit-sdk

**Postman Collections:**
- Unit API Collection (for manual testing)
- Unit API Starter Collection (for populating sandbox with test data)

---

## 7. Account Limits

### 7.1 Limit Types

| Type | Description |
|------|-------------|
| **Hard Limit** | Prevents transaction execution |
| **Soft Limit** | Allows transaction, triggers review alert |
| **Stand-in Limit** | Applied during connectivity lapses |

### 7.2 Individual Account Limits (Recommended)

| Transaction Type | Daily | Monthly | Type |
|-----------------|-------|---------|------|
| Card Purchase | $2,500 | No Limit | Hard |
| ATM Withdrawal | $500 | No Limit | Hard |
| ATM Deposit (Allpoint) | $2,000 | No Limit | Hard |
| Remote Check Deposit | $1,000 | $20,000 | Hard |
| ACH Debit Origination | $1,000 | $10,000 | Hard |
| ACH Credit Origination | $1,000 | $10,000 | Hard |
| Stand-in (POS) | $500 | N/A | Hard |
| Stand-in (ATM) | $200 | N/A | Hard |

### 7.3 Business Account Limits (Recommended)

| Transaction Type | Daily | Monthly | Type |
|-----------------|-------|---------|------|
| POS Purchase | $5,000 | No Limit | Hard |
| ATM Withdrawal | $1,000 | No Limit | Hard |
| ATM Deposit | $2,000 | No Limit | Hard |
| Remote Check Deposit | $50,000 | $100,000 | Hard |
| ACH Debit Origination | $10,000 | $100,000 | Hard |
| ACH Credit Origination | $10,000 | $100,000 | Hard |

**Limit Reset Times:**
- Daily: 12:00 AM in bank's timezone
- Monthly: 12:00 AM on first of month

**Get Account Limits:**
```bash
GET /accounts/{id}/limits
```

---

## 8. Card Issuance

### 8.1 Card Types

| Type | Attributes |
|------|------------|
| `individualDebitCard` | Physical, individual customer |
| `businessDebitCard` | Physical, business customer |
| `individualVirtualDebitCard` | Virtual, individual customer |
| `businessVirtualDebitCard` | Virtual, business customer |
| `individualCreditCard` | Credit, individual |
| `businessCreditCard` | Credit, business |

### 8.2 Card Features

- Contactless ("tap to pay") enabled
- Mobile wallet ready (Apple, Google, Samsung)
- Virtual cards: Available instantly
- Physical cards: Ship in days
- Optional ATM access (Allpoint network: 55,000+ ATMs)

### 8.3 Card Character Limits

| Field | Limit |
|-------|-------|
| Cardholder name | 26 characters |
| Additional embossed text (business) | 21 characters |

### 8.4 Sensitive Card Operations

**Requires Customer Token (PCI compliance):**
- Card activation
- PIN selection/change
- Revealing card number (virtual cards)
- CVV2 display

**Secure Display:**
- VGS (Very Good Security) integration
- Secure iframe for PAN/CVV display
- PIN operations through separate secure channel

---

## 9. Compliance and Reporting

### 9.1 Organization Accounts

| Account Type | Purpose |
|--------------|---------|
| **Revenue Account** | Receives interchange, interest, payment revenues |
| **Reserve Account** | Debited for disputes, ACH returns; requires initial funding |
| **Batch Account** | Used for batch payments |

### 9.2 Data Export

- Continuous data transfer to AWS S3, Google Cloud Storage, or Azure Blob Storage
- Pull into data warehouse via cloud storage connectors
- Eliminates need for API sequences

### 9.3 Statements and Tax Forms

- Monthly statements generated automatically
- Tax forms (1099-INT, etc.) available via API
- Statement simulation available in sandbox

---

## 10. Integration Checklist

### 10.1 Pre-Integration

- [ ] Sign up for Sandbox: https://app.s.unit.sh/signup
- [ ] Create Org API token in Dashboard
- [ ] Configure webhook URL
- [ ] Set webhook secret for signature verification
- [ ] Review deposit product configuration with Unit

### 10.2 Core Implementation

- [ ] Implement OAuth 2.0 Bearer authentication
- [ ] Implement idempotency keys for create operations
- [ ] Implement webhook handler with signature verification
- [ ] Handle rate limiting with exponential backoff
- [ ] Implement pagination for list operations

### 10.3 Entity Flows

- [ ] Application submission (individual/business)
- [ ] Document upload handling
- [ ] Customer creation (automatic on approval)
- [ ] Account creation
- [ ] Card issuance (virtual/physical)
- [ ] Payment origination (ACH/wire/book)
- [ ] Transaction reconciliation

### 10.4 Security Requirements

- [ ] Store Org API tokens securely
- [ ] Use Customer tokens for end-user operations
- [ ] Implement 2FA for sensitive operations
- [ ] Whitelist Unit webhook IPs
- [ ] PCI compliance for card data handling

---

## Appendix A: Transaction Types

| Type | Direction | Description |
|------|-----------|-------------|
| `originatedAchTransaction` | Credit/Debit | Outgoing ACH |
| `receivedAchTransaction` | Credit/Debit | Incoming ACH |
| `returnedAchTransaction` | Credit/Debit | ACH return |
| `returnedReceivedAchTransaction` | Credit/Debit | Return of incoming ACH |
| `purchaseTransaction` | Debit | Card purchase |
| `cardReversalTransaction` | Credit | Card refund |
| `atmTransaction` | Credit/Debit | ATM withdrawal/deposit |
| `bookTransaction` | Credit/Debit | Internal transfer |
| `wireTransaction` | Credit/Debit | Wire transfer |
| `returnedWireTransaction` | Credit | Returned wire |
| `feeTransaction` | Debit | Fee charge |
| `interestTransaction` | Credit | Interest payment |
| `checkDepositTransaction` | Credit | Check deposit |
| `checkPaymentTransaction` | Debit | Check payment |
| `cashDepositTransaction` | Credit | Cash deposit |
| `disputeTransaction` | Credit | Dispute credit |
| `rewardTransaction` | Credit | Reward credit |

---

## Appendix B: ACH Return Codes

**Common Returns:**
| Code | Reason | Timeframe |
|------|--------|-----------|
| R01 | Insufficient funds | 2 days |
| R02 | Account closed | 2 days |
| R03 | No account/unable to locate | 2 days |
| R04 | Invalid account number | 2 days |
| R05 | Unauthorized debit (consumer) | 60 days |
| R07 | Authorization revoked | 60 days |
| R08 | Payment stopped | 2 days |
| R10 | Customer advises not authorized | 60 days |
| R16 | Account frozen | 2 days |
| R29 | Corporate customer advises not authorized | 60 days |

---

## Appendix C: API Quick Reference

**Base URLs:**
- Sandbox: `https://api.s.unit.sh/`
- Live: `https://api.unit.co/`

**Common Endpoints:**

| Resource | Create | Get | List | Update |
|----------|--------|-----|------|--------|
| Applications | POST /applications | GET /applications/{id} | GET /applications | PATCH /applications/{id} |
| Customers | (automatic) | GET /customers/{id} | GET /customers | PATCH /customers/{id} |
| Accounts | POST /accounts | GET /accounts/{id} | GET /accounts | PATCH /accounts/{id} |
| Payments | POST /payments | GET /payments/{id} | GET /payments | — |
| Cards | POST /cards | GET /cards/{id} | GET /cards | PATCH /cards/{id} |
| Transactions | — | GET /accounts/{id}/transactions/{txId} | GET /transactions | — |
| Counterparties | POST /counterparties | GET /counterparties/{id} | GET /counterparties | PATCH /counterparties/{id} |
| Webhooks | POST /webhooks | GET /webhooks/{id} | GET /webhooks | PATCH /webhooks/{id} |

---
