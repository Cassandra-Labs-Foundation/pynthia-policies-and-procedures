# Banking-as-a-Service API Comparison: Unit vs Moov vs Increase vs Q2 Helix vs Galileo vs Column

**Prepared for:** Cassandra Core Banking System Development  
**Date:** December 12, 2025  
**Version:** 1.0

---

## Executive Summary

This document synthesizes API documentation from six leading Banking-as-a-Service providers to inform architectural decisions for the Cassandra core banking system. Each provider represents a distinct philosophy in the BaaS spectrum:

- **Unit** offers an abstraction-heavy approach that simplifies integration at the cost of visibility into underlying mechanics
- **Increase** takes the opposite stance with a "no abstractions" philosophy, exposing full complexity of Federal Reserve rails
- **Column** is unique as an OCC-chartered bank that built its own ledger with direct Fed integration
- **Q2 Helix** provides a fully hosted core banking system (not just API layer) with native program management
- **Galileo** brings card-processor heritage with ISO 8583 paradigms and real-time authorization control
- **Moov** operates as a wallet-centric intermediary where all funds flow through Moov wallets

The most significant architectural divergences occur in entity modeling (unified vs. split customer types), joint account support (native vs. workarounds), ledger architecture (abstracted vs. explicit double-entry), and the virtual account pattern (dedicated feature vs. not supported).

---

## 1. Entity Hierarchy

### Unit

- **Hierarchy:** Application → Customer → Account → (Transaction, Card, Payment)
- **Customer Model:** Separate types for `individualCustomer` and `businessCustomer`
- **Application Gateway:** KYC applications (`individualApplication`, `businessApplication`) must be approved before Customer creation
- **Account Types:** `depositAccount`, `creditAccount`, `walletAccount`
- **ID Format:** Numeric strings throughout
- **Business Structure:**
  - Single `officer` object (C-level with decision authority)
  - `beneficialOwners[]` array with ownership percentage (25% threshold)
- **Joint Accounts:** Supported via `customers[]` array on Account; at least one holder must be 18+
- **Sub-Accounts:** `walletAccount` type provides FBO sub-ledger functionality

### Moov

- **Hierarchy:** Account → (Wallet, BankAccount, Card, IssuedCard, Capability, Representative)
- **Customer Model:** Unified `Account` entity with `accountType` discriminator (individual/business/guest)
- **Profile Embedding:** `IndividualProfile` or `BusinessProfile` nested within Account
- **ID Format:** UUIDs throughout
- **Business Structure:**
  - `Representative` objects linked to Account (max 7)
  - Tracks `isController`, `isOwner`, `ownershipPercentage`
  - `ownersProvided` flag signals beneficial owner submission complete
- **Joint Accounts:** ❌ No explicit support—single-owner model only
- **Sub-Accounts:** Multiple wallets per account; wallet is hub for all money movement
- **Unique Pattern:** Capability-based progressive KYC unlocks specific money movement abilities

### Increase

- **Hierarchy:** Program → Entity → Account → Account Number (1:many)
- **Customer Model:** Unified `Entity` with `structure` discriminator supporting:
  - `natural_person`, `corporation`, `joint`, `trust`, `government_authority`
- **ID Format:** Prefixed strings (`entity_*`, `account_*`, `account_number_*`)
- **Business Structure:**
  - Beneficial owners nested within corporation entity structure
  - Separate `Beneficial Owner` objects within Entity
- **Joint Accounts:** ✅ Native support via `structure: joint` with `individuals[]` array (exactly 2 persons)
- **Sub-Accounts:** Unlimited `Account Numbers` per Account—each with distinct routing numbers
- **Unique Pattern:** `informational_entity_id` on Account for FBO association without ownership
- **Bookkeeping Layer:** Separate `BookkeepingAccount` for compliance-grade FBO ledger tracking

### Q2 Helix

- **Hierarchy:** Program → Product → Customer → Account
- **Customer Model:** Unified `Customer` with `isBusiness` boolean flag
- **Separate Endpoints:** `/customer/create` (individual) vs `/customer/createBusiness`
- **ID Format:** Integer-based (`HelixId32` for most, `HelixId64` for transactions)
- **Business Structure:**
  - `CustomerRelationship` links individuals to business customers
  - Tracks `isControlPerson`, `isBeneficialOwner`, `beneficialOwnerPercentage`
  - 22 exemption types via `exemptFromBeneficialOwnershipReasonType`
- **Joint Accounts:** ✅ Native via `CustomerRelationship` with:
  - `customerPriority` (1 = primary, 2+ = joint)
  - `accessTypeCode` per customer: `FULL`, `RDONLY`, `NONE`
  - Ownership transfers to next priority on primary death
- **Sub-Accounts:** Goals ARE Accounts with `isPrimary` flag; flat structure with category/subCategory

### Galileo

- **Hierarchy:** Provider → Program → Product → Account (PRN)
- **Customer Model:** ❌ No separate Customer entity—customer data embedded in Account
- **ID Format:** Multiple identifiers per account:
  - PRN (12-digit): Primary API identifier, never changes
  - PAN (16-digit): Card network identifier, changes on reissue
  - CAD (integer): Internal card ID
  - balance_id: Internal balance tracking
  - XID: Partner-defined external ID
- **Account ≠ Balance:** PRN and balance_id are separate; multiple accounts can share one balance
- **Business Structure:**
  - `businessName` field exists
  - Beneficial owner structure not explicit in API
  - KYB via external provider integration
- **Joint Accounts:** ❌ No true joint accounts; uses "shared balance" pattern (up to ~3000 secondary accounts per primary)
- **Sub-Accounts:** Secondary accounts with `sharedBalance: 1`; also RTF (Real-Time Funding) pattern

### Column

- **Hierarchy:** Platform → Entity (Person | Business) → Bank Account → Account Number
- **Customer Model:** Split model with unified namespace
  - Single `/entities` namespace with `type` discriminator (PERSON or BUSINESS)
  - Separate create endpoints: `POST /entities/person`, `POST /entities/business`
- **ID Format:** Prefixed strings (`plat_`, `enti_`, `bacc_`, `acno_`, `cpty_`, etc.)
- **Root Entity Pattern:** `is_root` flag distinguishes platform-level entities from customer entities
- **Business Structure:**
  - Associated Persons via `/entities/{biz}/associated-persons`
  - Roles: `control_person`, `beneficial_owner`, `account_opener`
  - UBO threshold: 25%+ ownership
- **Joint Accounts:** ✅ Native via `owners[]` array on Bank Account; add via `POST /bank-accounts/{id}/owner`
- **Sub-Accounts:** Multiple Account Numbers per Bank Account; each with unique routing/account number pair

---

### Differences

The six providers reveal three distinct philosophies for entity modeling:

**Unified vs. Split Customer Types:** Unit and Moov use separate customer types (or discriminated unions), while Increase and Q2 Helix use unified entities with structure/boolean flags. Column takes a hybrid approach with unified namespace but separate creation endpoints. Galileo sidesteps the question entirely by not having a discrete Customer entity. The unified approach simplifies querying and reduces API surface, but separate types allow for more type-safe validation of required fields per entity type.

**Joint Account Support:** This is a critical differentiator. Increase (via joint Entity structure), Q2 Helix (via CustomerRelationship with priority), and Column (via owners array) provide native joint account support. Unit supports it through a customers array on accounts. Moov and Galileo lack native support—Galileo's "shared balance" workaround is fundamentally different from true joint ownership with survivorship rights.

**Beneficial Ownership Modeling:** All providers must support beneficial ownership for BSA/AML compliance, but implementations vary. Q2 Helix offers the most sophisticated model with 22 exemption types and explicit control person tracking. Column and Increase embed beneficial owners within the entity structure. Galileo notably leaves this mostly external to the API.

**Virtual Account / Sub-Account Patterns:** Increase and Column both offer Account Number as a first-class resource that can fan out from a single underlying account—ideal for reconciliation and per-use-case tracking. Q2 Helix treats goals as regular accounts with flags. Galileo uses secondary accounts sharing a balance_id. Unit's wallet accounts and Moov's multiple-wallets-per-account serve similar purposes with different semantics.

### Industry Pattern

All providers separate the concept of "legal entity that passes KYC" from "account that holds money," though the boundary and naming varies. The Application/Entity → Customer/Account → Transaction pattern is universal, even when entity names differ.

### Unique Capabilities

- **Increase:** Only provider with explicit `joint` as an Entity structure type; unlimited Account Numbers per Account; `informational_entity_id` for non-owning FBO associations
- **Q2 Helix:** Most sophisticated joint account model with priority-based ownership succession; 22 beneficial owner exemption types
- **Column:** Only nationally chartered bank in the group; `is_root` pattern for platform vs. customer entity distinction
- **Moov:** Capability-based progressive disclosure of features based on KYC level; guest accounts for minimal-friction onboarding
- **Galileo:** Account/Balance separation allowing ~3000 accounts to share one balance; multiple stable identifiers per account (PRN, CAD, XID)

---

---

## 2. Authentication & Authorization

### Unit

- **Method:** OAuth 2.0 Bearer Token
- **Token Types:**
  | Token | Scope | Use Case |
  |-------|-------|----------|
  | Org API Token | System-level, broad | Server-to-server calls |
  | Customer Token | Customer-specific resources | End-customer actions (24hr expiry) |
  | Cardholder Token | Single card only | Card-specific operations |
  | Partner Token | Read-only, shared clients | Third-party integrations |
- **2FA Requirements:**
  - Application submission: Phone OTP
  - Sensitive scopes: Within 24 hours
  - PCI-sensitive card data: Always (via customer token)
- **Sandbox 2FA:** Passcode `000001`
- **Security Features:** Optional source IP restriction on org tokens

### Moov

- **Method:** OAuth 2.0 with scoped access tokens
- **Token Acquisition:** `POST /oauth2/token`
- **Scope Model:** Account-restricted scopes (e.g., `/accounts/{accountID}/transfers.write`)
- **Unrestricted Scopes:** `/accounts.write`, `/accounts.read`, `/ping.read`
- **Key Scopes:**
  - Bank accounts, cards, capabilities, transfers, wallets, representatives (all per-account)
  - `/fed.read` for institution lookup
- **API Versioning:** Header-based (`x-moov-version: v2025.07.00`)
  - Format: `vYYYY.QQ.BB`
  - Default: `v2024.01.00`
  - `latest` always beta

### Increase

- **Method:** Bearer Token (simple API key)
- **Header:** `Authorization: Bearer ${INCREASE_API_KEY}`
- **Key Management:** Dashboard at `dashboard.increase.com/developers/api_keys`
- **Environments:**
  - Production: `https://api.increase.com`
  - Sandbox: `https://sandbox.increase.com`
- **Versioning Strategy:** Unversioned API with backwards compatibility guarantee
  - Non-breaking: New resources, optional params, new response properties, new event categories
  - Breaking changes: Never made without explicit customer contact

### Q2 Helix

- **Method:** HTTP Basic Authentication
- **Header:** `Authorization: Basic <base64(apiKey:apiSecret)>`
- **Security Requirements:**
  - ⚠️ **IP Whitelisting required** for both API and SFTP access
  - Access from middleware only—end user devices not supported
- **Environments:**
  | Environment | Domain | Notes |
  |-------------|--------|-------|
  | Sandbox | `sandbox-api.helix.q2.com` | Hourly ACH settlement |
  | Production | `api.helix.q2.com` | Real money, daily cutoffs |
- **Sandbox Behaviors:**
  - Magic routing number `123456789`
  - Trial deposits hardcoded to $0.18 and $0.28
  - Multiple customers can share same `taxId`

### Galileo

- **Method:** API key-based with 4 required parameters per request
- **Required Parameters:**
  | Parameter | Source |
  |-----------|--------|
  | `apiLogin` | Provided by Galileo |
  | `apiTransKey` | Provided by Galileo |
  | `providerId` | Provided by Galileo |
  | `transactionId` | Generated by client (max 60 chars) |
- **URI Format:** `https://api-{corename}.{env}.gpsrv.com/intserv/4.0/{endPointName}`
- **Environments:** sandbox, cv (client validation), pd (production)
- **Protocol:** HTTPS with TLS 1.2 minimum (1.3 recommended)
- **Auth API Security:** JWT with shared secret for real-time authorization webhooks

### Column

- **Method:** Bearer Token (inferred from API patterns)
- **ID Prefixes:** All objects use typed prefixes (`plat_`, `enti_`, `bacc_`, `acno_`, etc.)
- **Platform Hierarchy:** Multi-tenant via Platform → Root Entity → Customer Entities
- **Environments:** Sandbox and Production (separate API endpoints)

---

### Differences

**Authentication Complexity Spectrum:** The providers range from simple (Increase's single Bearer token) to complex (Galileo's 4-parameter model, Unit's 4 token types). Q2 Helix's HTTP Basic Auth with mandatory IP whitelisting is the most restrictive, designed for middleware-only access patterns.

**Token Scoping Philosophy:** Moov and Unit provide fine-grained token scoping (per-account, per-card) enabling secure delegation to end-users. Increase and Galileo use simpler models where the API key has broad access, pushing authorization logic to your application layer.

**Versioning Approaches:**
- **Moov:** Explicit versioning via header (`vYYYY.QQ.BB`)
- **Increase:** No versioning; backwards compatibility guaranteed
- **Unit/Helix/Galileo/Column:** Implicit versioning in URL paths

**2FA and Security:** Only Unit explicitly documents 2FA requirements for sensitive operations. Q2 Helix's IP whitelisting provides network-level security. Galileo's JWT-based Auth API security is specialized for real-time authorization decisions.

### Industry Pattern

All providers use HTTPS with modern TLS requirements. Bearer token authentication dominates, though the token acquisition and scoping mechanisms vary significantly.

### Unique Capabilities

- **Unit:** Four distinct token types enabling granular delegation (customer self-service, partner integrations)
- **Moov:** `X-Wait-For` header pattern converts async operations to synchronous responses
- **Increase:** Backwards compatibility guarantee means no API versioning needed—unusual and developer-friendly
- **Q2 Helix:** IP whitelisting enforced—no direct mobile/browser API access by design
- **Galileo:** `transactionId` serves dual purpose as both request identifier and idempotency key

---

## 3. Rate Limiting & Operational Constraints

### Unit

- **Rate Limit:** 1,000 requests/minute per IP
- **Response:** HTTP 429
- **Timeouts:**
  - Short: 5 seconds (most APIs)
  - Long: 60-120 seconds (specific APIs)
- **Retry Strategy:** Exponential backoff with jitter recommended
- **Retryable Codes:** 5xx, 429, 408

### Moov

- **Rate Limit:** 40 requests/second per account ID per IP
- **Response:** HTTP 429
- **Limit Increases:** Contact Moov support
- **Pagination:** 200 results per page with `skip` parameter

### Increase

- **Rate Limit:** Not explicitly documented (contact-based)
- **Pagination:** Cursor-based, max 100 results per page
- **Filters:** `created_at.after/before`, `idempotency_key`, resource-specific filters

### Q2 Helix

- **Rate Limit:** 15 requests/second per API key
- **Throttle Warning:** At 80% (12 req/s) response includes `throttle` node
- **Exceeded Response:** HTTP 429, key blocked for remainder of period
- **Persistent Abuse:** Permanent block with potential fee to unblock
- **Pagination:** Not explicitly documented

### Galileo

- **Sandbox Limit:** 1,000 requests per 10 minutes
- **Production Limit:** Contact Galileo for limits
- **Pagination:** `recordCnt` parameter (max 200 per page)
- **Configuration Options:**
  - `MXRPG`: Increase max records per page
  - `NOPGE`: Retrieve all records in one page

### Column

- **Rate Limit:** Not explicitly documented
- **Pagination:** Standard cursor-based (inferred)

---

### Differences

**Rate Limit Magnitude:**
| Provider | Limit | Unit |
|----------|-------|------|
| Unit | 1,000 | per minute per IP |
| Moov | 40 | per second per account per IP |
| Q2 Helix | 15 | per second per API key |
| Galileo | 1,000 | per 10 minutes (sandbox) |

Moov's per-account-per-IP limit is the most granular, preventing one account from consuming another's quota. Q2 Helix's per-API-key limit means a single misbehaving client can impact all your users.

**Throttle Handling:** Q2 Helix uniquely provides a warning at 80% capacity via a `throttle` node in responses, allowing proactive backoff before hard limits hit. Others simply return 429 when exceeded.

**Pagination Strategies:**
- **Cursor-based:** Increase, Column (stateless, consistent for real-time data)
- **Offset-based:** Unit (`page[limit]`, `page[offset]`)
- **Skip-based:** Moov (`skip` parameter)
- **Record count:** Galileo (`recordCnt`, `page`)

### Industry Pattern

HTTP 429 is universal for rate limit exceeded. Most providers recommend exponential backoff with jitter. Pagination defaults cluster around 100-200 results per page.

---

## 4. Idempotency & Error Handling

### Unit

- **Idempotency:**
  - Supported on create operations (accounts, payments, cards)
  - Key: Any string up to 255 characters (UUID v4 recommended)
  - **Duration:** 48 hours after successful use
  - Keys are per-operation-type
  - Exception: Debit card creation shares key between physical/virtual
- **Error Format:** JSON:API compliant
  ```json
  {
    "errors": [{
      "title": "Error Title",
      "detail": "Detailed error message",
      "status": "400"
    }]
  }
  ```

### Moov

- **Idempotency:**
  - **Required** for all transfer creation via `X-Idempotency-Key` header
  - UUID v4 format
  - **Duration:** Keys never expire
  - Duplicate requests return **409 Conflict**
- **Error Codes:** 400, 401, 403, 404, 409, 422, 429, 500, 504

### Increase

- **Idempotency:**
  - Header: `Idempotency-Key`
  - Max length: 200 characters
  - Scope: POST requests only (PATCH/GET/DELETE inherently idempotent)
  - Same key + same args → Returns original with `Idempotent-Replayed: true` header
  - Same key + different args → **409 Conflict** with `idempotency_key_already_used_error`
  - **Retrieval:** `GET /resource?idempotency_key=xxx`
- **Error Format:**
  ```json
  {
    "status": 409,
    "type": "idempotency_key_already_used_error",
    "title": "The idempotency key submitted has already been used.",
    "detail": null,
    "resource_id": "account_transfer_abc123"
  }
  ```

### Q2 Helix

- **Idempotency:** Tag-based pattern
  - `tag` field (50 char max) for client-assigned unique identifiers
  - Dual lookup: `/get/{id}` and `/getByTag/{tag}` endpoints
  - In production, uniqueness enforced for customers with status: Active, Initiated, Manual Review, Verified
- **Error Code Ranges:**
  | Range | HTTP | Meaning |
  |-------|------|---------|
  | 1-50000 | 500 | Hard errors—contact support |
  | 50001-50999 | 401-505 | Connectivity, auth issues |
  | 59000-59899 | 400 | Feature misconfigured |
  | 59900-59999 | 400 | Invalid JSON |
  | 60000+ | 400 | Validation errors |
- **Response Format:** Always includes `requestId` for support correlation

### Galileo

- **Idempotency:**
  - Uses `transactionId` parameter (max 60 chars, preferably UUID)
  - Exception: Create Adjustment requires 64-bit integer
  - **Duration:** 90 days—duplicate returns `status_code: 24`
  - Failed requests can reuse same `transactionId`
  - No idempotency check for read-only endpoints
  - **Recovery:** `Get Call Status` endpoint retrieves original response
- **Response Format:**
  ```json
  {
    "status_code": 0,
    "status": "Success",
    "system_timestamp": "2020-12-08 09:25:31",
    "response_data": { },
    "processing_time": 4.492,
    "echo": { "transaction_id": "..." }
  }
  ```

### Column

- **Idempotency:** Standard header-based (inferred)
- **Error Handling:** HTTP status codes with typed error responses

---

### Differences

**Idempotency Key Lifespan:**
| Provider | Duration | Behavior on Duplicate |
|----------|----------|----------------------|
| Unit | 48 hours | Returns original |
| Moov | Never expires | 409 Conflict |
| Increase | Not specified | Returns original + header, or 409 if args differ |
| Q2 Helix | Permanent (tag-based) | Lookup via `/getByTag` |
| Galileo | 90 days | `status_code: 24` |

**Idempotency Philosophy:** Increase provides the most nuanced handling—detecting when the same key is used with different arguments (a likely bug) versus same arguments (a retry). Moov's "never expires" is safest for financial operations but means you can never reuse keys. Galileo's 90-day window is a practical middle ground.

**Error Response Richness:** Q2 Helix's error code ranges provide immediate triage guidance (5xxxx = contact support, 6xxxx = fix your input). Increase's typed errors (`type` field) enable programmatic handling. Unit's JSON:API compliance provides consistency but less semantic meaning.

### Industry Pattern

All providers support idempotency for write operations—essential for financial APIs where network failures are common. UUID v4 is the recommended key format across providers.

### Unique Capabilities

- **Increase:** `Idempotent-Replayed: true` header indicates a replay; retrieval by idempotency key via query parameter
- **Q2 Helix:** Tag-based idempotency doubles as a client-defined lookup key (`/getByTag`)
- **Galileo:** `Get Call Status` endpoint for explicit idempotency recovery; 90-day window balances safety with key reuse

---

## 5. Webhooks & Events

### Unit

- **Delivery Methods:**
  | Method | Behavior |
  |--------|----------|
  | At Most Once | Single delivery attempt, no retry |
  | At Least Once | Batched (up to 64 events), Fibonacci backoff retry up to 1 hour |
- **Subscription Types:**
  - `All` - All events
  - `OnlyAuthorizationRequest` - Only authorizationRequest.* events
  - `NotAuthorizationRequest` - All except authorization requests
- **Webhook IPs (for whitelisting):**
  | Environment | IPs |
  |-------------|-----|
  | Sandbox | 54.81.62.38, 35.169.213.205, 3.234.105.75 |
  | Live | 3.209.193.26, 54.156.65.95, 54.165.224.37 |
- **Timeout/Availability:**
  - Unresponsive 7 days (production) → Status: `Unavailable`
  - Unresponsive 2 days (sandbox) → Status: `Unavailable`
  - Max 100 enabled webhooks per org (sandbox)
- **Security:** HMAC-SHA1 signature in `x-unit-signature` header
- **Key Event Categories:**
  - Application: awaitingDocuments, pendingReview, approved, denied, canceled
  - Customer: created, updated, archived
  - Account: created, closed, frozen, unfrozen, reopened
  - Payment: created, pending, pendingReview, clearing, sent, rejected, returned, canceled
  - Transaction: created, updated
  - Card: created, activated, statusChanged
  - Authorization: created, amountChanged, declined
  - AuthorizationRequest: pending, approved, declined

### Moov

- **Delivery:** HTTPS endpoint required
- **Timeout:** 5 seconds for 2xx response
- **Retry Policy:** Retry for up to 24 hours on failure; webhook disabled after final retry returns 404
- **Security:** HMAC-SHA512 signature
- **Headers:** `X-Signature`, `X-Timestamp`, `X-Nonce`, `X-Webhook-ID`
- **Key Event Categories:**
  - Account: created, updated, deleted
  - Capability: requested, updated
  - BankAccount: created, updated, deleted
  - Transfer: created, updated
  - WalletTransaction: updated
  - Balance: updated
  - Dispute: created, updated
  - Refund: created, updated
  - Cancellation: created, updated
  - PaymentMethod: enabled, disabled
  - Representative: created, updated, disabled
  - Sweep: created, updated
- **Rail-Specific Transfer Statuses:**
  - ACH: source.initiated → source.originated → source.corrected → source.completed
  - Card: source.initiated → source.confirmed → source.settled → source.completed
  - Wallet: source.completed → destination.completed

### Increase

- **Delivery:** HTTP webhooks with retry
- **Retry Policy:** Up to 7 retries with exponential backoff for non-2xx responses
- **Event Retention:** 30 days
- **Security:** HMAC-SHA256 signature in `Increase-Webhook-Signature` header
  - Format: `t=<timestamp>,v1=<signature>`
- **Webhook IPs:** `34.83.67.223`, `35.247.122.129`
- **Real-Time Webhooks:**
  - Zero-latency delivery for card authorization decisions
  - Single Event Subscription per real-time category
  - ~2 second timeout; no retry on timeout (auto-decline)
- **Event Structure:**
  ```json
  {
    "id": "event_123abc",
    "created_at": "2020-01-31T23:59:59Z",
    "category": "transaction.created",
    "associated_object_type": "transaction",
    "associated_object_id": "transaction_abc123",
    "type": "event"
  }
  ```
- **Key Event Categories:**
  - Entity: created, updated
  - Account: created, updated
  - ACH Transfer: created, updated
  - Wire Transfer: created, updated
  - Card: created, updated
  - Card Payment: created, updated
  - Transaction: created
  - Real-Time Decision: card_authorization_requested

### Q2 Helix

- **⚠️ NOT HTTP Webhooks:** Uses **Azure Service Bus** (AMQP 1.0)
- **Protocol:** AMQP 1.0 (PCI compliant)
- **Backup:** Event Notification Files via SFTP (every 15 minutes)
- **Setup:** Requires separate Azure Service Bus configuration with Q2
- **File Pattern:** `yyyyMMddhhmm_EVENTNOTIFICATION.TXT`
- **Event Payload Type IDs:**
  | ID Range | Category |
  |----------|----------|
  | 1 | Common Payload |
  | 200-203 | Customer Account (Deposit, Transfer, Withdrawal, Modified) |
  | 204 | Account Modified |
  | 300-302 | Program Account events |
  | 400-409 | Debit Card events (Deposit, Transfer, Withdrawal, Auth, Declined, Balance Inquiry, Reversals) |
  | 500+ | Check events |
  | 600+ | Digital wallet, fraud, card renewal |

### Galileo

- **Events API:** HTTP webhooks for async notifications
- **Auth API:** Real-time webhook for authorization decisions (separate from Events API)
- **Auth API Security:** JWT with shared secret
- **Auth API Timeout:** Must respond within **2 seconds**
- **Timeout Behavior:** Fallback to Galileo's calculated response (AUFB event)
- **Key Event Categories:**
  | Category | Events |
  |----------|--------|
  | Account | app_completed, fail_id, pass_id, account_status_change, card_shipped, card_activated, frozen, unfrozen |
  | Authorization | auth (BAUT), denied_auth (DAUT), auth_exp, auth_fallback (AUFB), auth_metadata |
  | Settlement | setl (SETL) |
  | Transaction | pmt, adj, fee, fee_reversal, ach_return, ach_credit_fail, ach_debit_fail |
- **Decline Event Codes:**
  | Code | Event | Description |
  |------|-------|-------------|
  | DAUT | denied_auth | General denial |
  | BNSF | denied_auth_nsf | Insufficient funds |
  | PUMP | denied_auth_gas | NSF at gas pump |
  | NACT | denied_auth_inactive_card | Card not in status N |
  | IPIN | denied_auth_invalid_pin | Invalid PIN |
  | BPAN | denied_auth_bad_pan | Invalid card number |

### Column

- **Delivery:** HTTP webhooks (inferred from event structure)
- **Event ID Prefix:** `evnt_`
- **Key Event Categories:** (inferred from state machines)
  - Entity: verification_status.updated
  - Bank Account: overdraft_alert
  - ACH: outgoing_transfer.submitted, outgoing_transfer.settled, outgoing_transfer.completed, outgoing_transfer.returned
  - Wire: transfer events
  - Book: transfer.completed
  - Loan: disbursement, payment events

---

### Differences

**Delivery Mechanism:**
| Provider | Protocol | Real-Time Auth | Backup/Fallback |
|----------|----------|----------------|-----------------|
| Unit | HTTPS | ✅ AuthorizationRequest events | Batched delivery option |
| Moov | HTTPS | ❌ (Issuing beta) | Retry up to 24 hours |
| Increase | HTTPS | ✅ Real-Time Decisions | 7 retries with backoff |
| Q2 Helix | **Azure Service Bus (AMQP)** | Via Visa DPS | SFTP files every 15 min |
| Galileo | HTTPS + Auth API | ✅ Auth API | Fallback to Galileo decision |
| Column | HTTPS | ❌ (No native issuing) | Not documented |

**Q2 Helix's Azure Service Bus** is the major outlier—it requires Azure infrastructure and AMQP 1.0 client libraries rather than simple HTTP webhook handling. This provides guaranteed delivery but significantly increases integration complexity.

**Signature Algorithms:**
| Provider | Algorithm | Header |
|----------|-----------|--------|
| Unit | HMAC-SHA1 | `x-unit-signature` |
| Moov | HMAC-SHA512 | `X-Signature` |
| Increase | HMAC-SHA256 | `Increase-Webhook-Signature` |
| Galileo | JWT | Authorization header |

**Retry Policies:**
| Provider | Max Retry Duration | Backoff Strategy |
|----------|-------------------|------------------|
| Unit | 1 hour | Fibonacci |
| Moov | 24 hours | Not specified |
| Increase | 7 retries | Exponential |
| Q2 Helix | N/A (queue-based) | Azure Service Bus handles |
| Galileo | Not documented | N/A |

**Real-Time Authorization Timeout:**
| Provider | Timeout | On Timeout |
|----------|---------|------------|
| Unit | 2 seconds | Default to Unit decision |
| Increase | ~2 seconds | **Auto-decline** |
| Galileo | 2 seconds | **Fallback to Galileo** (AUFB) |

This timeout behavior difference is critical: Increase's auto-decline on timeout requires highly available webhook infrastructure, while Galileo's fallback preserves transaction success at the cost of losing custom decision control.

### Industry Pattern

HTTP webhooks with HMAC signature verification is the dominant pattern. All providers that support real-time card authorization use a ~2 second timeout, reflecting card network latency requirements.

### Unique Capabilities

- **Unit:** Subscription filtering (OnlyAuthorizationRequest, NotAuthorizationRequest); batched delivery up to 64 events
- **Moov:** Rail-specific transfer status events (source.initiated → source.completed path varies by rail)
- **Increase:** Published webhook IPs for firewall whitelisting; 30-day event retention; event structure includes associated_object linkage
- **Q2 Helix:** Azure Service Bus provides enterprise-grade guaranteed delivery; SFTP backup ensures no event loss; numeric payload type IDs for efficient parsing
- **Galileo:** Granular decline codes (BNSF, PUMP, NACT, etc.); Auth API fallback event (AUFB) for timeout scenarios; separate Events API and Auth API

---

## 6. State Machines & Lifecycles

### 6.1 Account States

#### Unit

- **States:** `Open` → `Frozen` → `Closed`
- **Frozen:** Recoverable via `unfreeze()`
- **Close Reasons:** `ByCustomer`, `Fraud`, `NegativeBalance`, `ByBank`, `BreachOfTermsAndConditions`, `NoAccountActivity`, `ProgramChange`
- **Reopening:** Only `ByCustomer` close reason allows reopen
- **Balance Handling:** Balance < $1 auto-swept to org revenue account on close
- **Card Behavior:** Associated cards frozen/closed with account
- **DACA Support:** Sub-states `Entered` ↔ `Activated` for deposit account control agreements

#### Moov

- **Verification-Centric:** Account state tied to verification status
- **Verification States:** `unverified` → `pending` → `verified` | `resubmit` | `review` | `failed`
- **Terminal States:** `verified`, `failed`
- **Recoverable:** `resubmit` allows re-submission of KYC data
- **No Explicit Frozen:** Account controls managed through capabilities, not account state

#### Increase

- **Minimal Model:** `open` → `closed` (only 2 states)
- **No Frozen State:** Controls happen at Entity, Account Number, or Card level instead
- **Account Number Controls:** `active` ↔ `disabled` → `canceled` (sub-control: `inbound_ach.debit_status`)
- **Deletion Constraint:** Accounts can only be deleted when all balances = $0
- **Entity-Level Controls:** `active` ↔ `disabled` → `archived`

#### Q2 Helix

- **States:** `PendingOpen` → `Open` ↔ `Dormant` → `PendingClosed` → `Closed`
- **Dormancy:** Auto-transitions on inactivity threshold; auto-recovers on activity
- **Lock Mechanism:** Orthogonal `isLocked` boolean with `lockTypeCode`:
  - `UNL` (unlocked), `CST` (customer/API-reversible), `SYS` (requires admin)
- **Lock Reasons:** `FRD`, `ADM`, `TMP`, `FRZ`, `SUS`, `CO`, `RTN`, `REC`, `DED`, `DOR`
- **Close Reasons:** `FirstPartyFraud`, `ThirdPartyFraud`, `SyntheticIdFraud`, `AccountTakeoverFraud`, `NonActivity`, `CustomerRequest`, `BankDiscretion`, `Other`

#### Galileo

- **Status Codes:** Single-character codes (`V`, `T`, `P`, `F`, `N`, `D`, `K`, `Q`, `R`, `C`, `Z`)
- **Normal State:** `N` (Active)—only state allowing network transactions
- **KYC Integration:** `V` (Application) → `T` (ID Verification) → `P` (Passed) → `N` (Normal)
- **Suspended States:** `D` (Disabled), `K` (Suspended), `Q` (Delinquent), `R` (Charged Off)
- **Terminal States:** `C` (Canceled), `Z` (Canceled Without Refund)
- **⚠️ Mastercard Warning:** As of June 2025, `C` and `Z` are **permanent**—reactivating risks Mastercard penalties. Use `D` for temporary closures.

#### Column

- **Minimal Model:** `open` ↔ `frozen` → (deleted)
- **Only 2 Active States:** No pending/closed distinction
- **Frozen Behavior:** Wires return "account blocked/frozen" message
- **Deletion Constraint:** Only possible when all 4 balance types = $0
- **4 Balance Types:** available, pending, holding, locked

---

### Differences (Account States)

**State Complexity Spectrum:**
| Provider | # of States | Frozen? | Dormancy? | Lock Mechanism |
|----------|-------------|---------|-----------|----------------|
| Unit | 3 | Yes | No | Via state |
| Moov | 6 (verification) | No | No | Via capabilities |
| Increase | 2 | No | No | Via Account Number |
| Q2 Helix | 5 | Via lock | Yes (auto) | Separate boolean |
| Galileo | 10+ | No (`D` instead) | No | Via status code |
| Column | 2 | Yes | No | Via state |

**Freeze Philosophy:** Unit and Column have explicit `Frozen` states. Galileo uses `D` (Disabled) and warns against using `C` (Canceled) for temporary situations due to Mastercard penalties. Q2 Helix separates locking from account status entirely, allowing more granular control.

**Dormancy Handling:** Only Q2 Helix has automatic dormancy detection with `Open` ↔ `Dormant` transitions based on activity thresholds. Others require manual status changes or don't track dormancy at account level.

**Reopening Closed Accounts:** Unit allows reopening only for `ByCustomer` close reason. Most others treat closed as terminal. This has significant operational implications for customer service workflows.

---

### 6.2 KYC/Entity Verification States

#### Unit

- **Flow:** `Pending` → `Approved` | `Denied` | `AwaitingDocuments` → `PendingReview`
- **SLA:** 2-hour review SLA for `PendingReview`
- **Cancellation:** Allowed from `AwaitingDocuments` or `PendingReview` only
- **Customer Creation:** Only on `Approved`

#### Moov

- **Flow:** `unverified` → `pending` → `verified` | `resubmit` | `review` | `failed`
- **Recoverable:** `resubmit` state allows additional info submission
- **Terminal:** `verified`, `failed`

#### Increase

- **Unified Entity Model:** Same states for natural persons, corporations, trusts, etc.
- **Flow:** `[*]` → (active with `details_confirmed_at` timestamp)
- **Archive Constraint:** All accounts must be closed before Entity can be archived
- **States:** `active` ↔ `disabled` → `archived`

#### Q2 Helix

- **KYC Status Values:** `Initiated`, `Automated Review`, `Manual Review`, `Verified`, `Denied`, `Expired`
- **Separate Screening:** `fraudStatus`, `ofacStatus`, `kybStatus` (business KYC separate from individual)
- **Dormancy Tracking:** `Active` → `Inactive` → `Dormant` (via `setLastContact` endpoint)
- **Flow:** `Initiated` → `ManualReview` | `Verified` → `Archived` | `Deceased` | `Denied`

#### Galileo

- **Account-Embedded:** KYC states are account status codes, not separate entity states
- **Flow:** `V` (Application) → `T` (ID Verification) → `P` (Passed) | `F` (Failed) → `N` (Normal)
- **Force Pass:** `F` (Failed) can transition to `N` via `forcePassCip`
- **CIP Provider:** Configurable at program level

#### Column

- **Flow:** `UNVERIFIED` → `PENDING` → `VERIFIED` | `MANUAL_REVIEW` | `DENIED`
- **Auto-Verification:** SSN validation, address verification, OFAC screening
- **Re-verification:** `VERIFIED` can move back to `MANUAL_REVIEW` if triggered
- **Terminal:** `VERIFIED` (soft), `DENIED` (hard)

---

### Differences (KYC States)

**KYC Architecture:**
- **Separate Entity:** Unit, Moov, Increase, Q2 Helix, Column have KYC on a distinct entity/application
- **Embedded in Account:** Galileo embeds KYC states in account status codes

**Document Handling:** Unit explicitly models `AwaitingDocuments` state with upload workflow. Others handle document requests within broader "review" states.

**Business vs. Individual:** Q2 Helix explicitly separates `kycStatus` (individual) from `kybStatus` (business). Others use the same flow with different required fields.

**Re-verification:** Column uniquely allows `VERIFIED` → `MANUAL_REVIEW` transitions for ongoing monitoring. Others treat verification as one-way.

---

### 6.3 Card States

#### Unit

- **Physical vs. Virtual:** Physical starts `Inactive`, virtual starts `Active`
- **States:** `Inactive` → `Active` ↔ `Frozen` → Terminal
- **Terminal States:** `Lost`, `Stolen`, `ClosedByCustomer`, `SuspectedFraud`
- **Recovery:** `SuspectedFraud` sometimes recoverable
- **Account Coupling:** Cards frozen/closed with account

#### Moov

- **Issued Card States:** `inactive` → `pending_verification` → `active` ↔ `inactive` → `closed`
- **Authorization States:** `pending` → `declined` | `cleared` | `canceled` | `expired`
- **Separate from Account:** Card state independent of account verification

#### Increase

- **States:** `active` ↔ `disabled` → `canceled`
- **Digital Wallet Tokens:** Separate states: `active`, `inactive`, `suspended`, `deactivated`
- **Card Payment Elements:** `card_authorization` → `card_increment` → `card_reversal` | `card_settlement` → `card_refund`
- **Fuel Confirmation:** Special `card_fuel_confirmation` element for gas pumps

#### Q2 Helix

- **Rich State Machine:** `Initiated` → `Pending` → `PendingVerification` → `Verified` → `Reissued` → `ReissuedPendingVerification`
- **Terminal States:** `HotListed`, `Archived`, `Expired`, `Denied`
- **Lock Reasons:** `STL` (stolen-permanent), `LST` (lost-permanent), `FRD`, `DMG`, `ADM`, `TMP`, `PIN`
- **Reissue Reasons:** `DMG`, `REN`, `FRD`, `LST`, `STL`, `NCN` (new card number), `CMP` (compliance)
- **Digital + Physical:** `DigitalActivePhysicalInitiated`, `DigitalActivePhysicalPending` for hybrid cards

#### Galileo

- **Status Codes:** `W` (Waiting), `X` (Emboss), `Y` (Shipped), `N` (Normal/Active), `D` (Disabled), `L` (Lost), `S` (Stolen), `B` (Blocked-PIN), `C` (Canceled), `Z` (Canceled No Refund)
- **Dual Status:** Both account AND card must be `N` for transactions
- **Freeze ≠ Status:** Freeze is separate `freeze_info` object with start/end dates
- **Lost/Stolen:** Terminal—triggers new PAN issuance

#### Column

- **No Native Card Issuing:** Column provides book transfer infrastructure for card settlement
- **BIN Sponsorship:** Third-party processor integration required
- **Book Transfer Pattern:** `hold` → `completed` | `cancelled` mimics auth/capture

---

### Differences (Card States)

**Card Issuing Model:**
| Provider | Native Issuing | Processor |
|----------|---------------|-----------|
| Unit | ✅ Yes | Integrated |
| Moov | ✅ Yes (beta) | Integrated |
| Increase | ✅ Yes | Visa direct |
| Q2 Helix | ✅ Yes | Visa DPS |
| Galileo | ✅ Yes | ISO 8583 |
| Column | ❌ No | Third-party BIN sponsor |

**Physical vs. Virtual Activation:** Unit and Galileo start physical cards inactive (requiring activation), virtual cards active. Q2 Helix has explicit `PendingVerification` state for shipped cards.

**Freeze Implementation:** Galileo uniquely separates freeze from status—freeze is a date-range object overlay. Others use state transitions.

**Reissue Workflows:** Q2 Helix has the most sophisticated reissue state machine with `Reissued` → `ReissuedPendingVerification` and explicit reissue reason codes.

---

### 6.4 ACH Transfer States

#### Unit

- **Flow:** `Pending` → `PendingReview` | `Sent` | `Clearing` | `Canceled` | `Rejected` → `Returned`
- **Risk Review:** `PendingReview` with 2-hour SLA
- **Direction Split:** Credits go `Pending` → `Sent`; debits go `Pending` → `Clearing` → `Sent`
- **Rejection Reasons:** `InsufficientFunds`, `DailyACHCreditLimitExceeded`, `DailyACHDebitLimitExceeded`, `CounterpartyInsufficientFunds`, `PlaidBalanceUnavailable`, `SuspectedFraud`, `NameMismatch`

#### Moov

- **Flow:** `created` → `queued` → `pending` → `completed` | `failed` | `canceled` → `reversed`
- **Group Support:** `queued` state for transfers waiting on predecessors in a group
- **Return Window:** `completed` can transition to `reversed` within 60 days
- **Failure Reasons:** `source-payment-error`, `destination-payment-error`, `wallet-insufficient-funds`, `rejected-high-risk`, `processing-error`

#### Increase

- **Flow:** `pending_approval` → `pending_submission` → `pending_reviewing` → `requires_attention` → `submitted` → `settled` → `returned`
- **Approval Workflow:** Optional `pending_approval` state with explicit approve/reject
- **Compliance Review:** `pending_reviewing` → `requires_attention` for manual intervention
- **Submission Details:** `submission` object with `effective_date`, `expected_funds_settlement_at`, `trace_number`
- **Timing:** ~30 minutes to Fed window; same-day cutoff **1:30 PM PT**
- **Return Window:** 2 business days (60 days for unauthorized)

#### Q2 Helix

- **Flow:** `N` (Queued) → `P` (Validated) → `S` (Sent) | `V` (Failed) → `E` (Error)
- **Cancellation States:** `C` (API), `A` (Account holder), `L` (Limit violation)
- **Internal Transfers:** Settle **instantly**—skip Initiated/Pending
- **Terminal:** `S` (success), `E` (error), `R` (bad routing)

#### Galileo

- **Transaction Types:** `AU` (Authorization), `PM` (Payment), `AD` (Adjustment), `FE` (Fee)
- **ACH Status:** Integrated with general transaction status codes
- **Return Matching:** Reversals matched within 10-day window via `auth_id`

#### Column

- **Flow:** `initiated` → `submitted` → `acknowledged` → `settled` → `completed` | `returned` | `canceled`
- **Acknowledged State:** CCD/CTX corporate payments only (RDFI acknowledgment)
- **Balance Impact:** `initiated` adjusts `pending_balance`; `settled` moves to `available` after 2 BD
- **Same-Day Cutoff:** **1:30 PM PT** (requires `same_day=true` or `effective_on=today`)
- **Return Window:** 60 days (unauthorized); 2 days (business)

---

### Differences (ACH States)

**Approval Workflows:**
| Provider | Pre-Submission Approval | Compliance Review |
|----------|------------------------|-------------------|
| Unit | Via `PendingReview` | 2-hour SLA |
| Moov | No | Implicit |
| Increase | Optional `pending_approval` | `requires_attention` state |
| Q2 Helix | No | Via validation states |
| Galileo | No | External |
| Column | Implicit | Pre-submission |

**Corporate ACH (CCD/CTX):** Only Column and Increase expose the RDFI acknowledgment state (`acknowledged`) for corporate payments. Others abstract this away.

**Internal vs. External:** Q2 Helix uniquely optimizes internal transfers (within Helix) to settle instantly, bypassing the ACH state machine entirely.

**State Granularity:** Increase has the most granular state machine with explicit `pending_reviewing` and `requires_attention` states for compliance workflows. Unit and Column are moderately detailed. Galileo abstracts most complexity.

---

### 6.5 Wire Transfer States

#### Unit

- **Documentation:** Wire states not detailed in provided summary
- **Assumed:** Similar pattern to ACH with faster settlement

#### Moov

- **Same as Transfer:** Uses unified transfer state machine
- **Flow:** `created` → `pending` → `completed` | `failed`

#### Increase

- **Flow:** `pending_approval` → `pending_creating` → `pending_reviewing` → `requires_attention` → `submitted` → `complete` | `reversed`
- **Return Requests:** Separate state machine: `pending` → `approved` | `rejected`
- **Create via:** `POST /transfers/wire/{id}/return-request`

#### Q2 Helix

- **Not Explicitly Documented:** Wire support unclear from provided summary

#### Galileo

- **Not Primary Rail:** Galileo is card-processor focused; wire not primary use case

#### Column

- **Flow:** `initiated` → `completed` | `rejected`
- **Speed:** Same-day, often minutes to complete
- **Return Requests:** Async process with own state machine
- **Post-Completion Returns:** `completed` → `return_requested` → `returned` | `completed`

---

### Industry Pattern

All providers model ACH with at least: initial → processing → settled/completed → returned states. The return window (up to 60 days for unauthorized) is universally reflected in state machines that allow `settled` → `returned` transitions.

### Unique Capabilities

- **Unit:** `ByCustomer` close reason enables account reopening; DACA sub-states for deposit control agreements
- **Moov:** Transfer grouping with `queued` state for dependent transfers
- **Increase:** Most granular compliance workflow with `requires_attention` state; explicit approval gates
- **Q2 Helix:** Orthogonal lock mechanism separate from account status; automatic dormancy detection; rich card reissue workflows
- **Galileo:** Mastercard penalty warning for C/Z statuses; freeze as date-range overlay not state
- **Column:** Book transfers with holds enable card-like auth/capture patterns; 4-balance model (available, pending, holding, locked)

---

## 7. Critical Operational Flows

### 7.1 Account Opening / KYC Flow

#### Unit

- **Flow:** `POST /applications` → Async KYC → `application.approved` webhook → `POST /accounts`
- **Individual Required Fields:** fullName, ssn, dateOfBirth, address, email, phone
- **Business Additional:** name, ein, stateOfIncorporation, officer, beneficialOwners[]
- **Document Path:** `application.awaitingDocuments` → `POST /applications/{id}/documents` → `PendingReview` (2hr SLA)
- **Timing:**
  | Stage | Duration |
  |-------|----------|
  | Sync response | 500ms - 2s |
  | Auto-decision | Often immediate |
  | Manual review | 1-3 business days |
  | Document processing | Hours to days |

#### Moov

- **Flow:** `POST /accounts` (with profile + capabilities) → Async verification → `capability.enabled` webhook
- **Individual Required:** Name, email/mobile, birthdate, address, SSN (last 4 or full), TOS acceptance
- **Business Required:** Legal name, EIN, entity type, address, phone, ≥1 controller, all owners ≥25%
- **Business Types:** soleProprietorship, llc, partnership, privateCorporation, publicCorporation, trust, unincorporatedAssociation, unincorporatedNonProfit, incorporatedNonProfit, governmentEntity
- **Progressive KYC:** Capabilities unlock incrementally as requirements met
- **Resubmit Path:** `capability.pending` with `requirements.currentlyDue` → `PATCH /accounts/{id}`

#### Increase

- **Flow:** `POST /entities` → KYC verification → `POST /entities/{id}/confirm` → `POST /accounts` → `POST /account_numbers`
- **Entity Types:** natural_person, corporation, trust, joint, government_authority
- **Corporation Required:** name, address, tax_identifier, incorporation_state, website, beneficial_owners[] (1-5), industry_code
- **Joint Required:** individuals[] (exactly 2)
- **Confirmation Step:** `details_confirmed_at` timestamp populated after explicit confirm
- **Account Numbers:** Unlimited, instant creation per account
- **Timing:** Entity creation synchronous; KYC async via webhook; account creation instant

#### Q2 Helix

- **Flow:** `GET /bankDocument/list` → `GET /program/questionsList` → `POST /customer/create` → IDology KYC → `POST /account/create`
- **Individual Required:** firstName, lastName, birthDate, taxId (SSN/ITIN), address (type=Residence), emailAddress, phone (type=Mobile), isDocumentsAccepted
- **Business Flow:** `POST /customer/createBusiness` → `POST /customer/create` (for each related individual) → `POST /customerRelationship/create` → `POST /customer/createBusinessApplication` → `POST /account/create`
- **Due Diligence:** Program-specific questions via `/program/questionsList` and `/customer/answerPost`
- **Entitlement Types:** Signer, Owner, NonTransactional, BeneficialOwner, Trustee, SuccessorTrustee, Guardian, Conservator, Executor, Agent, PowerOfAttorney
- **Withdrawal Delay:** Some programs require 10+ business day waiting period

#### Galileo

- **Flow:** `POST createAccount` (prodId, name, DOB, SSN, address) → CIP verification → Account setup cron (5-30 min) → Status V/T → N
- **CIP Integration:** Configurable at program level; result in sync response if integrated
- **Business:** Same endpoint with `businessName` parameter; KYB via external provider (not Galileo CIP)
- **Card Creation:** Automatic if card product; PAN, CVV, expiry generated
- **Physical Card Path:** Status X → Emboss batch (daily) → Embosser → Status Y → `card_shipped` webhook
- **Override Path:** Failed CIP (status F) can transition to N via `forcePassCip` if allowed
- **⚠️ Limitation:** Beneficial owner structure not explicit in API

#### Column

- **Individual Flow:** `POST /entities/person` → Auto-verify (SSN, address, OFAC) → `POST /bank-accounts`
- **Business Flow:** `POST /entities/business` → Loop: `POST /entities/person` + `POST /entities/{biz}/associated-persons` → `POST /bank-accounts`
- **Auto-Verification:** SSN validation, address verification, OFAC screening
- **Required Roles:**
  - `control_person` (required): Person with significant responsibility
  - `beneficial_owner`: Any person with 25%+ ownership
  - `account_opener`: Person opening account (if different)
- **Account Number:** Auto-generated with bank account; additional via `POST /bank-accounts/{id}/account-numbers`

---

### Differences (Account Opening)

**Application vs. Direct Entity Model:**
| Provider | Model | Customer Created |
|----------|-------|------------------|
| Unit | Application → Customer → Account | On application approval |
| Moov | Account (unified) with capabilities | Immediately (capabilities unlock async) |
| Increase | Entity → Account → Account Numbers | Entity created sync; accounts instant after |
| Q2 Helix | Customer → Account (with questionnaire) | After KYC + due diligence |
| Galileo | Account (customer embedded) | Sync with account |
| Column | Entity → Bank Account | Entity sync; account instant |

**KYC Provider Integration:**
- **Integrated:** Unit (built-in), Moov (built-in), Increase (built-in), Q2 Helix (IDology), Column (built-in)
- **External/Configurable:** Galileo (CIP provider configurable at program level; no KYB)

**Business Beneficial Owner Handling:**
| Provider | UBO Tracking | Threshold |
|----------|--------------|-----------|
| Unit | beneficialOwners[] array | 25% |
| Moov | Representatives with isOwner flag | 25% |
| Increase | beneficial_owners[] nested in corporation | 25% (1-5 owners) |
| Q2 Helix | CustomerRelationship with isBeneficialOwner | 25% (22 exemption types) |
| Galileo | ❌ Not explicit in API | N/A |
| Column | Associated persons with beneficial_owner role | 25% |

**Unique Requirements:**
- **Q2 Helix:** Due diligence questionnaire (`/program/questionsList`) before account creation
- **Galileo:** Account setup cron (5-30 min delay) before status transitions to Normal
- **Increase:** Explicit `confirm` step required before accounts can be created

---

### 7.2 ACH Origination Flow

#### Unit

- **Credit (Push):** `POST /payments` (direction: Credit) → Funds debited immediately → Validation → Risk review (if flagged, 2hr SLA) → Status: Sent
- **Debit (Pull):** `POST /payments` (direction: Debit) → Status: Clearing → After clearing period → Status: Sent
- **Cutoff Times:**
  | Window | Manual Review Cutoff | Bank Cutoff | Settlement (Same-Day) |
  |--------|---------------------|-------------|----------------------|
  | Morning | 9:00 AM ET | ~10:00 AM ET | 1:00 PM ET |
  | Afternoon | 1:00 PM ET | ~2:15 PM ET | 5:00 PM ET |
  | Evening | 3:00 PM ET | ~4:15 PM ET | 6:00 PM ET |
- **Standard Cutoff:** 3:00 PM ET
- **Same-Day ACH:** Disabled by default; max $1M per payment; contact Unit to enable
- **Return Windows:** Standard 2 BD; unauthorized (consumer) 60 days; B2B 24 hours

#### Moov

- **Flow:** `POST /transfers` (ach-debit-fund) → Status: pending → ACH network → Wallet credited/debited
- **Timing (Standard):** 4:15 PM ET cutoff; ~2 banking days for debit
- **Timing (Faster - requires approval):**
  | Created By | Debit Completes |
  |------------|-----------------|
  | 10:00 AM ET | ~1:00 PM ET |
  | 2:15 PM ET | ~4:00 PM ET |
  | 4:15 PM ET | ~6:00 PM ET |
- **Hold Periods:** `no-hold`, `1-day`, `2-days`
- **SEC Codes:** WEB, PPD, CCD, TEL
- **Wallet-Centric:** All ACH lands in/originates from Moov wallet

#### Increase

- **Flow:** `POST /ach_transfers` → (optional) `POST /ach_transfers/{id}/approve` → Batch (~30 min) → FedACH → Settlement
- **Approval Workflow:** Optional `pending_approval` state with explicit approve/reject
- **Submission Details:** `submission` object with `effective_date`, `expected_funds_settlement_at`, `trace_number`
- **Same-Day:** Hits every Fed window; same-day cutoff details in submission
- **SEC Codes:** CCD (Corporate), PPD (Prearranged), WEB (Internet-initiated)
- **Return Window:** Up to 2 days (60 days for unauthorized)

#### Q2 Helix

- **Flow:** `POST /transfer/create` → Status: N (Queued) → P (Validated) → S (Sent in NACHA) | E (Error)
- **Internal Transfers:** Settle **instantly**—skip ACH state machine entirely
- **Parameters:** direction, standardEntryClassCode, isPrenote, isReversal, effectiveEntryDate, isSameDaySettle, receiverAccountType
- **Void Window:** Until NACHA file delivered (`/transfer/void`)
- **Return Handling:** Creates reversal transaction linked via `masterId`; `returnCode` contains NACHA reason

#### Galileo

- **Flow:** `POST createAchTransaction` → Status: N → P (Validated) → S (In NACHA) → Hold days timer → Account credited/debited
- **Same-Day Cutoffs (ET):**
  | Window | Cutoff | Settlement | Funds Available |
  |--------|--------|------------|-----------------|
  | Window 1 | 09:00 ET | 13:00 ET | 17:00 ET |
  | Window 2 | 11:45 ET | 16:30 ET | 18:00 ET |
  | Window 3 | 14:45 ET | 18:00 ET | Next day AM |
- **Hold Days:** Configurable; recommended ≥3 banking days; timer starts when NACHA sent to ODFI
- **Configuration:** `HDACH=Y` (banking days, default), `HDACH=N` (calendar days, requires approval)

#### Column

- **Flow:** `POST /transfers/ach` → Status: initiated → Fed window → submitted → acknowledged (CCD/CTX only) → settled → completed
- **Same-Day Cutoff:** **1:30 PM PT** (requires `same_day=true` or `effective_on=today`)
- **Balance Impact:** `initiated` adjusts `pending_balance`; `settled` moves to `available` after 2 BD (before 5:30 AM PT)
- **Return Window:** 60 days (unauthorized); 2 days (business)
- **Corporate Payments:** CCD/CTX get explicit `acknowledged` state from RDFI

---

### Differences (ACH Origination)

**Cutoff Time Comparison:**
| Provider | Standard Cutoff | Same-Day Cutoff | Notes |
|----------|-----------------|-----------------|-------|
| Unit | 3:00 PM ET | Multiple windows (9/1/3 PM ET) | Same-day disabled by default |
| Moov | 4:15 PM ET | 4:15 PM ET | Faster processing requires approval |
| Increase | ~30 min batches | Every Fed window | Hits all windows automatically |
| Q2 Helix | Bank-defined | Bank-defined | Varies by program |
| Galileo | Sponsor bank-defined | 9:00/11:45/14:45 ET | Multiple windows |
| Column | Not specified | **1:30 PM PT** | Pacific time zone |

**Hold Period Models:**
| Provider | Default Hold | Configurable? |
|----------|--------------|---------------|
| Unit | Clearing period | Yes (clearingDaysOverride) |
| Moov | 2 days (standard) | Yes (no-hold, 1-day, 2-days) |
| Increase | 2 BD after effective | N/A |
| Q2 Helix | Program-defined | Yes |
| Galileo | ≥3 banking days recommended | Yes (holdDays param) |
| Column | 2 BD after effective | N/A |

**Internal Transfer Optimization:**
- **Q2 Helix:** Internal transfers (within Helix) settle **instantly**
- **Others:** Internal book transfers are separate from ACH

**NACHA Return Thresholds (Industry Standard - Unit documented):**
| Return Type | Max Rate |
|-------------|----------|
| Unauthorized (R05, R07, R10, R11, R29) | 0.5% |
| Administrative (R02, R03, R04) | 3% |
| All returns | 15% |

---

### 7.3 Wire Transfer Flow

#### Unit

- **Flow:** `POST /payments` (type: wirePayment) → Auto-approved/Rejected/Manual review → Fed transmission → Settlement
- **Transmission:** Every hour between 9:00 PM ET (previous day) and 6:00 PM ET
- **Unit Cutoff:** 6:00 PM ET
- **Fed Hours:** 9:00 PM ET (previous day) to 6:45 PM ET
- **Settlement:** Real-time during Fed operating hours

#### Moov

- **Flow:** Uses unified transfer model; wire as payment rail option
- **Details:** Limited wire-specific documentation in provided summary

#### Increase

- **Flow:** `POST /wire_transfers` → (optional approval) → `pending_creating` → `submitted` → `complete`
- **Return Requests:** `POST /transfers/wire/{id}/return-request` → Separate state machine (pending → approved/rejected)
- **Post-Completion:** `complete` can transition to `return_requested` → `returned`

#### Q2 Helix

- **Wire Support:** Not explicitly documented in provided summary

#### Galileo

- **Wire Support:** Not primary rail; Galileo is card-processor focused

#### Column

- **Flow:** `POST /transfers/wire` → Status: initiated → completed (often minutes) | rejected
- **Speed:** Same-day, often minutes to complete
- **Return Requests:** Async process with own state machine
- **International:** SWIFT transfers via `POST /transfers/swift` (prefix: `swft_`)
- **FX Quotes:** `POST /fx-quotes` for international wire pricing

---

### Differences (Wire Transfers)

**Wire Support Level:**
| Provider | Domestic Wire | International Wire | Return Requests |
|----------|---------------|-------------------|-----------------|
| Unit | ✅ Full | Not documented | Not documented |
| Moov | ✅ Via transfer | Not documented | Not documented |
| Increase | ✅ Full | Not documented | ✅ Explicit API |
| Q2 Helix | ❓ Unclear | ❓ Unclear | ❓ Unclear |
| Galileo | ❌ Not primary | ❌ | ❌ |
| Column | ✅ Full | ✅ SWIFT | ✅ Explicit API |

**Column Unique:** Only provider with documented SWIFT/international wire support and FX quote API.

---

### 7.4 Card Authorization Flow

#### Unit

- **Standard Flow:** Merchant → Card Network → Unit → Validation (balance, limits, status, expiry) → Response (~100-150ms)
- **Programmatic Authorization:** Unit → Client webhook → Client responds (approve/decline/default) within **2 seconds** → Partial approval supported
- **Settlement:** T+1 to T+3; hold released on settlement
- **Decline Reasons:** AccountClosed, CardExceedsAmountLimit, DoNotHonor, InsufficientFunds, InvalidMerchant, ReferToCardIssuer, RestrictedCard, TransactionNotPermittedToCardholder

#### Moov

- **Acquiring Flow:** `POST /transfers` (source: card, dest: moov-wallet) → `X-Wait-For: rail-response` → Auth result
- **Card Verification:** $0 auth on card link
- **Settlement Cutoffs:**
  | Network | Cutoff (ET) |
  |---------|-------------|
  | Visa | 9:45 PM |
  | Mastercard | 11:00 PM |
  | Discover | 7:00 PM |
  | Amex | 7:00 PM |
- **Settlement Timing:** Sales credited by 1:00 PM ET next banking day; refunds/chargebacks immediate
- **Issuing Flow:** Auth request → Check wallet balance → Hold on wallet → Settlement converts hold to debit
- **Card Controls:** `singleUse`, `velocityLimits`
- **Decline Codes:** call-issuer, do-not-honor, processing-error, invalid-transaction, cvv-mismatch, lost-or-stolen, insufficient-funds, expired-card, suspected-fraud, velocity-limit-exceeded

#### Increase

- **Real-Time Decisions:** Webhook `real_time_decision.card_authorization_requested` → **~2 second timeout** → `POST /real_time_decisions/{id}/action`
- **Decision Options:** `approve` or `decline`
- **Data Available:** presentment_amount, settlement_amount, MCC, merchant_acceptor_id, merchant_descriptor, merchant_city/country, CVV result, AVS result, network risk score
- **Timeout Behavior:** Auto-declined if no response
- **Card Payment Elements:** card_authorization → card_increment → card_reversal | card_settlement → card_refund
- **Special:** `card_fuel_confirmation` for gas pump amount confirmation

#### Q2 Helix

- **Processor:** Visa DPS (ISO-8583 interface)
- **Flow:** Merchant → Visa Network → Visa DPS → Helix Core → Real-time auth check → Response
- **Checks:** Balance, limits, card status, controls
- **Hold:** Creates ATH* transaction (hold on availableBalance)
- **Settlement:** 24-72 hours typical; releases hold, creates CRD* transaction
- **Decline Scenarios:** Insufficient availableBalance, card locked, card status not Verified, card controls block (MCC, geographic, amount), account locked/closed, limits exceeded

#### Galileo

- **Auth API:** Real-time webhook with JWT auth → **Must respond within 2 seconds**
- **Override Capabilities:**
  - ✅ Approve transactions Galileo would deny
  - ✅ Deny transactions Galileo would approve
  - ✅ Override velocity limits (`override_limit` field)
  - ✅ Return balance for balance inquiries
  - ✅ Initiate RTF transfer (`transfer_prn`, `transfer_amount`)
- **Timeout Behavior:** Fallback to Galileo's calculated response (AUFB event)—**transactions not auto-declined**
- **Settlement:** T+1 to T+3 via batch files; matched via auth_id

#### Column

- **No Native Card Issuing:** Uses book transfers with holds for card settlement pattern
- **Authorization Pattern:**
  - Auth: `POST /transfers/book` with `hold=true` → `holding_balance` increases
  - Re-auth: `PATCH /transfers/book/{id}` (update amount while in hold)
  - Capture: `POST /transfers/book/{id}/clear`
  - Void: `POST /transfers/book/{id}/cancel`
- **4 Balance Types:** available_amount, pending_amount, holding_amount, locked_amount
- **BIN Sponsorship:** Third-party processor required

---

### Differences (Card Authorization)

**Real-Time Authorization Control:**
| Provider | Real-Time Webhook | Timeout | Timeout Behavior |
|----------|-------------------|---------|------------------|
| Unit | ✅ Programmatic Auth | 2 seconds | Default to Unit decision |
| Moov | ❌ (Issuing beta) | N/A | N/A |
| Increase | ✅ Real-Time Decisions | ~2 seconds | **Auto-decline** |
| Q2 Helix | ❌ (Visa DPS handles) | N/A | DPS decision |
| Galileo | ✅ Auth API | 2 seconds | **Fallback to Galileo** (AUFB) |
| Column | ❌ (No native issuing) | N/A | N/A |

**Critical Timeout Difference:** Increase auto-declines on timeout; Galileo falls back to its own decision. This has major implications for availability requirements.

**Override Capabilities:**
| Provider | Override Galileo/Internal Decision | Partial Approval | RTF (Real-Time Funding) |
|----------|-----------------------------------|------------------|------------------------|
| Unit | ✅ Yes | ✅ Yes | Not documented |
| Increase | ✅ Yes | Not documented | Not documented |
| Galileo | ✅ Yes (both directions) | Not documented | ✅ Yes |

**Card Issuing Model:**
| Provider | Native Issuing | Processor | Physical Cards |
|----------|---------------|-----------|----------------|
| Unit | ✅ Yes | Integrated | ✅ Yes |
| Moov | ✅ Yes (beta) | Integrated | ✅ Yes |
| Increase | ✅ Yes | Visa direct | ✅ Yes |
| Q2 Helix | ✅ Yes | Visa DPS | ✅ Yes |
| Galileo | ✅ Yes | ISO 8583 | ✅ Yes |
| Column | ❌ No | Third-party BIN | Via partner |

---

### 7.5 Unique Operational Flows

#### Column: Lending Flow

Column uniquely offers a lending API:

- **Loan Creation:** `POST /loans` with entity_id, loan_program_id, max_principal_balance, maturity_date
- **Disbursement:** `POST /loans/{id}/disbursements` (increases principal_balance, credits bank account)
- **Payment:** `POST /loans/{id}/payments` (decreases principal_balance, debits bank account)
- **Loan Sale:** `POST /loans/{id}/sales` (platform purchases seasoned loans)
- **Key Attributes:**
  - `is_revolving`: Multiple disbursements allowed (credit line)
  - `max_principal_balance`: Credit limit
  - `seasoning_days`: Days before receivables can be sold
  - `allow_overpayment`: Block payments exceeding balance

#### Column: Overdraft Pattern

- **Setup:** Customer account with `is_overdraftable=true` linked to Overdraft Reserve account
- **Trigger:** When customer account overdraws, funds locked in reserve
- **Alert:** `bank_account.overdraft_alert` webhook fired
- **Resolution:** Customer deposits → locked amount released

#### Moov: Transfer Groups

- **Grouped Transfers:** `groupID` links dependent transfers
- **Queued State:** Transfers wait in `queued` state for predecessors to complete
- **Cascade Failure:** If predecessor fails, dependent transfers auto-cancel

#### Increase: Bookkeeping API

- **Purpose:** Compliance-grade FBO ledger tracking
- **Entities:** BookkeepingAccount (compliance_category: commingled_cash | customer_balance)
- **Entries:** Immutable BookkeepingEntry records
- **Linking:** BookkeepingAccount linked to Entity and/or Account

---

### Industry Patterns

**ACH Processing:** All providers batch ACH to Fed windows; same-day ACH universally available but with varying cutoffs and enablement requirements.

**Card Authorization:** 2-second timeout is industry standard for real-time authorization decisions. All providers with native card issuing support standard auth → settlement → refund lifecycle.

**KYC Flow:** All providers support async KYC with webhook notification on status changes. Business KYC universally requires beneficial owner tracking at 25% threshold per FinCEN requirements.

### Unique Capabilities

- **Unit:** Multiple ACH windows with specific cutoff times; programmatic auth with partial approval
- **Moov:** Transfer grouping with dependent execution; faster ACH processing tiers
- **Increase:** Bookkeeping API for FBO compliance; unlimited account numbers; explicit approval workflows
- **Q2 Helix:** Instant internal transfers; program-specific due diligence questionnaires; 22 beneficial owner exemption types
- **Galileo:** Auth API with RTF (real-time funding) capability; timeout fallback preserves availability
- **Column:** Lending API with loan sales; overdraft reserve pattern; book transfer holds for card-like auth/capture; SWIFT international wires

---
