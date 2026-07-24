# Banking-as-a-Service API Comparison: Increase vs Unit vs Moov vs Galileo vs Q2 Helix vs Column vs Mambu vs Green Dot

**Analysis Date:** June 2026 · **Method:** synthesized from the 8 confidence-graded provider summaries produced by the pipeline narrative pass (spec-mine + live-doc agents). Confidence per fact lives in each provider summary; this document focuses on cross-provider *decisions* for the Cassandra core.

---

## Executive Summary

The eight platforms split into three archetypes. **Sponsor-bank API issuers** (Increase, Column) are chartered or directly Fed-connected and expose payment rails semi-transparently — they look the most like what Cassandra is building. **BaaS orchestration layers** (Unit, Moov, Green Dot) sit on top of a partner bank and abstract the rails, trading transparency for integration speed; Moov is distinctive for making the **wallet the ledger primitive**, Green Dot for its **cash-load network**. **Processors / core-banking engines** (Galileo, Q2 Helix, Mambu) are the ledger of record beneath an issuer — Galileo and Helix are real-time card cores with terse status-code vocabularies; Mambu is a configuration-driven loan/deposit core with no Fed connectivity at all.

Three design decisions cleanly separate the field. (1) **The account↔account-number relationship**: only Increase and Column implement the **1-account-to-many-numbers** model Cassandra has chosen (D2); everyone else models multiplicity as separate accounts (Galileo secondaries), wallets/purses (Moov, Green Dot), or not at all (Mambu). (2) **KYC as a separate axis from entity lifecycle**: Increase, Q2 Helix, and Green Dot track verification on a dedicated status field distinct from the entity's active/closed state — directly validating Cassandra's "controls as gates" stance over baking KYC into the entity state machine. (3) **Real-time authorization decisioning**: Increase, Unit, Galileo, and Q2 all offer synchronous partner approve/decline at card-auth time (2–4 s budgets, timeout→auto-decline), which is now an industry baseline rather than a differentiator.

For Cassandra the closest reference models are **Increase** (entity structures, 1:many account numbers, separate validation status, semi-transparent rails) and **Column** (direct-Fed state machines, `owners` array, explicit return/dishonor/contest sub-states). The processors (Galileo/Helix) are the best reference for **terminal-state discipline and event vocabularies**, and Moov is the cleanest reference for an **explicit wallet ledger** if Cassandra ever wants balance-bearing sub-units.

---

## Master Decision Matrix

| Decision point | Increase | Unit | Moov | Galileo | Q2 Helix | Column | Mambu | Green Dot |
|---|---|---|---|---|---|---|---|---|
| **Customer model** | `Entity.structure` (5 types) | Application→Customer | Account roles | CIP→accounts | Customer `isBusiness` | Entity PERSON/BUSINESS | Client vs Group | User under Program |
| **Joint accounts** | `structure=joint` | array of 2+ customers | ✗ (separate accts) | shared Balance ID | `isJointAccount` | `owners` array | a Group | up to 2 holders |
| **Sub-account model** | **Account Numbers 1:many** | Wallets product | ✗ (wallet/acct) | secondary accts (≤3000) | `ForBenefitOf` type | **Account Numbers 1:many** | ✗ (Credit Arr.) | Purses |
| **Txn linking** | return/reversal objects | `relatedTransactionId` | wallet txn pairs | `auth_id`/`original_auth_id` | `masterId` | `return_details` | `linkedtransactionkey` | `transferIdentifier` |
| **Account states** | open/closed | Open/Frozen/Closed | Wallet active/closed | N/D/K/Q/C/Z… | 6-state + lock | none (open/$0-delete) | 8-state lifecycle | pending/normal/restricted/locked/closed |
| **ACH same-day cutoff** | 4:45 PM ET, <$1M, default | ~4:15 PM ET, off by default | 4:15 PM ET (2:15 faster) | next-day batch | next-day (same-day for fee) | `same_day` flag, time unpublished | N/A (no Fed) | not published |
| **Ledger exposure** | semi-transparent + GL | semi-abstract | **explicit (wallet=ledger)** | processor + RDF batch | real-time core | semi-transparent (direct Fed) | explicit core/LMS | abstracted (purses) |

---

## Entity Hierarchy

- **Increase:** one `Entity` with `structure ∈ {natural_person, corporation, joint, trust, government_authority}`; Account binds Entity + Program; beneficial owners (1 control + ≤4 ownership) on the corporation sub-object.
- **Column:** `Entity` typed PERSON/BUSINESS; **`owners` array** gives joint ownership; beneficial owners + control persons modeled as separate **associated-person** entities (`is_beneficial_owner`/`is_control_person`).
- **Unit:** customers are *minted only by an approved Application* (`Individual`/`Business`/`BusinessWallet`); joint = an array of 2+ customers on a Deposit Account; beneficial owners (≥25%) + a required Officer.
- **Q2 Helix:** flat `Customer` (`isBusiness`) under a `Program`; joint via `isJointAccount`/`customerPriority`; UBO collection gated.
- **Galileo:** CIP `Customer` → 1:many accounts (PRN); joint *emulated* by secondary accounts sharing a Balance ID; no UBO object.
- **Mambu:** `Client` (individual) vs `Group` (the holder for joint/business); one `accountholderkey` per account.
- **Green Dot:** `User` under a `Program` tenant; up to 2 holders; single business-profile owner (shallow UBO).
- **Moov:** no customer/account split — `Account` roles (Facilitator/Business/Individual); beneficial owners as `representative` objects.

- **Differences:** Two philosophies. Increase/Column treat the **legal entity as a first-class object distinct from the account**, with rich structure types and explicit owner graphs — the right model for a sponsor-bank core that must satisfy CIP/KYB and joint/trust ownership. Unit's Application→Customer indirection enforces that no customer exists without passing onboarding (clean compliance invariant, less flexible). Mambu's Client-vs-Group is elegant for joint/group lending but has no entity-structure taxonomy. Moov collapses entity and account, which is simplest but loses the owner graph entirely.
- **Industry Pattern:** Every platform separates *who* (customer/entity) from *where money sits* (account), except Moov.
- **Unique Capabilities:** Increase's five-way `structure` enum (incl. trust + government_authority) is the most expressive taxonomy; Column's associated-persons graph is the most explicit control-person/beneficial-owner model.
- **For Cassandra:** Increase + Column directly validate Cassandra D1 (unified entity, typed structures) and the associated-person pattern for business UBO.

## Account Types & Sub-Accounts

- **Increase / Column:** one ledger Account → **many Account Numbers** (virtual endpoints over one balance); Column adds account *types* (CHECKING/OVERDRAFT_RESERVE/PROGRAM_RESERVE/NETWORK_SETTLEMENT).
- **Galileo:** secondary accounts (≤3000 per primary) serve the sub-account role; can share a bank Balance ID.
- **Green Dot:** **Purses** (primary/savings/spend) are true balance-bearing sub-accounts within one account.
- **Moov:** a **Wallet** per account is the balance unit; multiplicity = more accounts, no sub-accounts.
- **Q2 Helix:** account `type` (Checking/Savings/Prepaid/**ForBenefitOf**) + a `Product`; FBO serves sub-account/omnibus patterns.
- **Unit:** a separate **Wallets** product for sub-balances.
- **Mambu:** no sub-accounts; lines-of-credit grouped via **Credit Arrangement**.

- **Differences:** The fork is **virtual numbers over one balance (Increase/Column) vs. real balance-bearing sub-units (Green Dot purses, Galileo secondaries, Moov wallets)**. Virtual-number models keep one source of truth for funds and push partitioning to the numbering layer — exactly Cassandra D2. Balance-bearing sub-units (purses/wallets) make per-bucket balances trivial but multiply the ledger objects to reconcile.
- **For Cassandra:** the 1:many account-number model is confirmed by the two chartered-bank references (Increase, Column) and nobody else — a meaningful signal that it's the *sponsor-bank* idiom, while purses/wallets are the *consumer-fintech* idiom.

## Transaction Processing & Payment Rails

- **Column (direct Fed):** ACH with a **14-state machine** incl. dishonor/contest sub-states; Wire (Fedwire 6:45–9:00 PM ET queue band); Realtime (RTP/FedNow); Book; Check; International. UPPER_SNAKE statuses (Realtime is lower_snake — a casing wart).
- **Increase:** ACH 9-state, Wire, Check (10-state), RTP/FedNow, Account Transfer; same-day default (<$1M, 4:45 PM ET); rich return/NOC handling; exposes FedACH windows.
- **Moov:** rail-agnostic `Transfer` (7 states) with `achDetails`/`cardDetails`/`rtpDetails` sub-status; standard 4:15 PM ET + risk-gated **Faster ACH** (no-hold).
- **Unit:** `Payment` (ACH/Book/Wire) with `direction`; ACH 7-state; same-day off by default.
- **Galileo / Q2 Helix:** ACH is a **next-banking-day batch** (Galileo cuts the Nacha file the following day; Helix settles next business day, same-day for a fee, **internal transfers immediate**).
- **Mambu:** no Fed rail at all — movement is journaled, settlement is the integrator's job.
- **Green Dot:** ACH (`achOut`/`achPull`) + **Instant Funds Transfer** (card rails) + the cash-load network.

- **Differences:** Transparency vs abstraction. Column and Increase **expose the rail mechanics** (Fed windows, return codes, dishonor/contest) — essential for a core that must reason about settlement and is operating its own Fed connection. The processors batch ACH and surface terse codes. The orchestration layers (Unit/Moov/Green Dot) hide most of it behind a uniform transfer object.
- **Industry Pattern:** Universal `original→return/reversal` linking, but via different keys: `masterId` (Helix), `auth_id` (Galileo), `relatedTransactionId` (Unit), `return_details` (Column), wallet-pairs (Moov).
- **Unique Capabilities:** Column's dishonor/contest ACH sub-states are the most complete return model; Moov's Faster-ACH eligibility gating is a clever risk-priced speed tier; Green Dot's retail cash-load is singular.
- **For Cassandra:** Column/Increase are the rails reference. The `masterId`-style grouping key (Helix) is the simplest pattern for Cassandra's transaction linking.

## Ledger Architecture

- **Moov:** **explicit — the Wallet *is* the ledger.** Every transfer/card/ACH event resolves to a wallet transaction; balance-bearing primitive is the wallet, not the account.
- **Mambu:** explicit double-entry-style core/LMS ledger; product-as-template defines accounting rules; the system of record.
- **Column:** semi-transparent with `available/pending/holding/locked` balance buckets; reserve account types; direct-Fed settlement.
- **Increase:** Transactions vs Transfers split; Pending vs settled; optional `bookkeeping_*` GL accounts for custom tracking.
- **Galileo:** processor ledger; **RDF daily batch files are the reconciliation truth** (not real-time).
- **Q2 Helix:** real-time core; 4-state Transaction; behaviors expressed as transaction *types* grouped by `masterId`.
- **Unit:** abstracted; immutable Transactions; holds implicit in authorizations.
- **Green Dot:** abstracted; purse balances.

- **Differences:** From **explicit ledgers you reason about** (Moov wallets, Mambu, Column buckets) to **abstracted balances you trust** (Unit, Green Dot). Increase sits in the middle with optional GL. For a core that must guarantee `Σ(fintech balances) == Fed master`, the explicit models (Column buckets, Moov wallet, Increase bookkeeping accounts) are the references; the abstracted ones hide the invariant.
- **Industry Pattern:** All separate **available vs pending/held** funds.
- **For Cassandra:** Column's four balance buckets (available/pending/holding/locked) map most directly to a sponsor-bank shadow-ledger; Moov proves the all-in wallet-as-ledger approach if balance-bearing sub-units are ever wanted.

## Cards & Authorization

- **Increase:** real-time decision webhook (`real_time_decision.card_authorization_requested`), **2–4 s** budget, timeout→**auto-decline**; Card Payment groups authorization→increment→reversal→settlement elements; pending vs settled transactions.
- **Galileo:** real-time auth engine with optional **Auth API override** (program rewrites the response mid-stream); auth→completion/settlement→reconciled; force-post when settlement can't match.
- **Q2 Helix:** **In-Auth decisioning**; 72 h fund hold default; auth/decline/reversal as numeric events.
- **Unit:** **Authorization Request** relayed to partner for approve/decline with a decline-reason enum; card states incl. `SuspectedFraud` auto-opening a Fraud Case.
- **Moov:** issued-card auth as a **wallet hold** (`issuing-auth-hold→release→transaction`); acquiring vs issuing both hop the wallet.
- **Green Dot:** auth events delivered as **notifications**, but **no clearly public synchronous decisioning API** (❓).
- **Mambu:** no card state machine; only authorization-hold events. **Column:** transfer-centric; card issuing is not its focus.

- **Differences:** Four providers (Increase, Galileo, Q2, Unit) offer **synchronous partner control at auth time**; Galileo uniquely lets you *rewrite* the network response, the others approve/decline. Moov models the hold as a wallet movement. Green Dot only notifies.
- **Industry Pattern:** Real-time decisioning with a low single-digit-second budget and timeout-decline is now standard.
- **Unique Capabilities:** Galileo's response-override Auth API; Increase's fully-elaborated Card Payment element lifecycle.
- **For Cassandra:** the 2–4 s decision + timeout-decline contract is the pattern to adopt; Increase's element model (auth/increment/reversal/settlement) is the cleanest schema.

## State Machines & Lifecycles

- **Galileo / Q2 Helix:** terse, explicit, **discipline around terminal states** — Galileo's permanent `C/Z/L/S` (response_code 46), Helix's irreversible `Closed`; orthogonal **lock** dimensions (Helix `lockTypeCode`, Galileo via Modify-Status types).
- **Mambu:** richest *account* lifecycle (PENDING_APPROVAL→APPROVED→ACTIVE→DORMANT/LOCKED/MATURED/IN_ARREARS→CLOSED_*); near-everything reversible via "undo".
- **Increase / Column:** moderate transfer state machines; Increase Entity is **3-state** (active/disabled/archived) with KYC on a *separate* axis; Column has no account status enum (open/$0-delete).
- **Unit:** reason-coded closures (`ByCustomer`/`Fraud`/`ByBank`/`NegativeBalance`), only `ByCustomer` reopenable.
- **Green Dot:** account pending/normal/restricted/locked/closed + a routable `kycPendingGate`.

- **Differences:** **Minimal states + orthogonal locks (Galileo/Helix)** vs **rich lifecycle states (Mambu)**. The orthogonal-lock pattern (status says *what the account is*, a separate lock says *why it's restricted*) is cleaner than encoding freezes into the status enum, and directly supports Cassandra's "controls as gates" design (D7).
- **Industry Pattern:** Terminal-state discipline (closed/canceled rarely reversible) is universal; the cleaner designs keep **freeze/lock orthogonal to lifecycle**.
- **For Cassandra:** adopt the **orthogonal lock** model (Helix `lockReasonTypeCode`, Unit reason codes) rather than freeze-as-a-state; keep entity lifecycle minimal with KYC on a separate axis (Increase).

## Compliance & KYC

- **Increase:** `validation.status` (pending/valid/invalid) + `validation.issues[]` **separate from** entity lifecycle; beneficial owners 1 control + ≤4 ownership.
- **Q2 Helix:** four parallel compliance axes — `kycStatus`, `kybStatus`, `ofacStatus`, `fraudStatus`.
- **Green Dot:** single routable **`kycPendingGate`** (healthy/kyc2/idv/manual/none) + Socure document IDV.
- **Unit:** compliance encoded in the **Application** state machine (Pending/AwaitingDocuments/PendingReview/Approved/Denied).
- **Column:** `verification_status` (UNVERIFIED→PENDING→MANUAL_REVIEW→VERIFIED/DENIED) + `pep_status`; Submit-Document to cure.
- **Moov:** **Capability** gate = verification (KYC/KYB) + underwriting (risk/volume) before any rail unlocks.
- **Galileo:** IVS results (Pass/Fail/Refer/In Progress); UBO is the program's responsibility.
- **Mambu:** none (core/LMS) — only an approval workflow.

- **Differences:** The strongest designs (Increase, Q2, Green Dot) make **KYC a first-class status axis decoupled from the entity's operational state**, so an account can be operationally `active` yet KYC-`manual_review`. Unit instead gates everything behind the Application lifecycle. Moov's capability-gate ties compliance to *what you can do* rather than *who you are*.
- **Industry Pattern:** manual-review as an explicit, curable state with a document-submission escape hatch.
- **For Cassandra:** this is the strongest cross-provider signal — **model KYC/OFAC as separate control axes (gates), not entity states** (D6/D7). Increase's separate `validation.status` and Green Dot's `kycPendingGate` are the reference designs.

## Webhooks & Events

- **Increase:** single minimal `Event` object with **104 categories**; Standard-Webhooks **HMAC-SHA256**; 8 retries / 72 h; fetch detail via the associated object.
- **Column:** `<product>.<resource>.<state>` naming; event is a snapshot on each state change.
- **Unit / Moov:** typed `object.verb` events (`payment.sent`, `transfer.updated`).
- **Galileo:** async **Events API** with 4-letter codes (`BAUT`/`SETL`/`AAAU`…).
- **Q2 Helix:** numeric **`payloadTypeId`** (403 auth, 410 decline, 204 account-modified…); webhooks and/or Azure Service Bus.
- **Mambu:** webhooks + replayable **Streaming API**.
- **Green Dot:** HTTPS POST per event type, hourly retry to 24 h, PCI/SSN excluded.

- **Differences:** **Thin-event + fetch-detail (Increase, Column)** vs **fat typed payloads (Unit/Moov)** vs **coded compact (Galileo 4-letter, Helix numeric)**. The thin-event model is the most robust against schema drift and the easiest to make idempotent (use the event id); the coded models are terse but require a lookup table.
- **Industry Pattern:** at-least-once delivery, exponential/scheduled retries (24–72 h), HMAC signatures, idempotent consumption.
- **For Cassandra:** Increase's thin-event + 104-category catalog + Standard-Webhooks HMAC is the reference (aligns with D15); Mambu's replayable streaming is the pattern if Cassandra wants pull-based consumers alongside push.

---

## Recommendations for Cassandra

**Closest overall reference models:** **Increase** and **Column** — both chartered/direct-Fed, both implement the 1:many account-number model, both separate KYC from entity lifecycle, both expose rails semi-transparently. Build the entity/account/rail core to look like these two.

**Adopt these specific patterns:**
- **Entity:** Increase's typed `structure` enum + Column's associated-person graph for UBO/control persons (D1).
- **Accounts:** the 1:many account-number model (only the two chartered banks do it — it's the sponsor-bank idiom) (D2).
- **KYC/compliance:** separate status axes / gates, *not* entity states — Increase `validation.status`, Q2's four axes, Green Dot's `kycPendingGate` (D6/D7).
- **Lifecycle:** minimal entity/account states with an **orthogonal lock dimension** (Helix `lockReasonTypeCode`, Unit reason codes) instead of freeze-as-a-state.
- **Cards:** 2–4 s real-time decision with timeout→decline (Increase/Galileo/Q2/Unit baseline); Increase's auth/increment/reversal/settlement element model.
- **Ledger:** Column's `available/pending/holding/locked` buckets for the shadow ledger; consider Moov's explicit-wallet model only if balance-bearing sub-units are required.
- **Events:** thin-event + associated-object fetch, HMAC-SHA256, 72 h retry, idempotent on event id (Increase / D15).

**Choose-X-if framing (for partners evaluating, not for Cassandra to copy wholesale):**
- *Need direct Fed + maximal rail transparency* → Increase / Column.
- *Need fastest integration over a partner bank* → Unit / Green Dot.
- *Need an explicit money-movement ledger* → Moov.
- *Need a configurable loan/deposit core (no Fed)* → Mambu.
- *Need a real-time card processor with auth override* → Galileo / Q2 Helix.

---

## Coverage Gaps

Per the source method, structural/state/rail/compliance/event coverage is **high** for all 8 (state machines have exact strings; spec-backed for Increase/Moov). Thin or unaddressed domains, by design of the rubric: **Authentication/Authorization** mechanics (OAuth/token specifics — only noted incidentally), **Rate Limiting & quotas**, **Developer Experience/SDKs/sandbox**, and **Error-format/idempotency** detail (captured for Increase, partial elsewhere). Provider-specific ❓ residuals — exact ACH cutoff clock-times (genuinely unpublished across most), UBO/KYB collection mechanics (gated at Galileo/Helix/Green Dot), and Mambu/Green Dot card state machines — are flagged in the individual summaries.
