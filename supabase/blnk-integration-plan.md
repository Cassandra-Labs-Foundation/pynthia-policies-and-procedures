# Blnk × Supabase integration plan

How the [Blnk Finance](https://docs.blnkfinance.com/) ledger engine and our
Supabase `core` schema fit together for the Cassandra Banking Core.

> **Sources:** Blnk docs — [transactions](https://docs.blnkfinance.com/transactions/introduction),
> [lifecycle](https://docs.blnkfinance.com/transactions/transaction-lifecycle),
> [inflight](https://docs.blnkfinance.com/transactions/inflight/creating-inflight)
> ([commit/void](https://docs.blnkfinance.com/transactions/inflight/updating-inflight)),
> [balances](https://docs.blnkfinance.com/balances/introduction),
> [money-movement map](https://docs.blnkfinance.com/ledgers/money-movement-map),
> [identities](https://docs.blnkfinance.com/identities/introduction) +
> [PII tokenization](https://docs.blnkfinance.com/identities/pii-tokenization),
> [reconciliation](https://docs.blnkfinance.com/reconciliations/overview),
> [webhooks](https://docs.blnkfinance.com/webhooks/events),
> [hashing](https://docs.blnkfinance.com/transactions/hash),
> [API keys/scopes](https://docs.blnkfinance.com/api-keys/scopes),
> [install](https://docs.blnkfinance.com/home/install).

## 1. The core idea — two systems of record, one boundary

| Plane | System of record for | Tech |
|---|---|---|
| **Blnk** | Money. Double-entry balances, transactions, holds, immutable history, reconciliation. | Blnk Core (own PostgreSQL + Redis + Typesense) |
| **Supabase (`core`)** | Everything else. Cases, filings, KYC/CDD workflow, compliance controls, tasks, deadlines, documents. | Supabase Postgres (our 39-table schema) |

**Rule:** money truth lives in Blnk; Supabase *mirrors* balances/txn status for
query and compliance but never computes them. The two never share a database —
they integrate over Blnk's REST API (writes) and Blnk webhooks (reads).

```
                 command (REST, X-blnk-key, idempotent by `reference`)
  our services ───────────────────────────────────────────────►  Blnk Core
  (open acct,     ◄───────────────────────────────────────────   (ledgers →
   originate ACH/     events (webhooks: transaction.applied, …)    balances →
   wire, card auth)                                                transactions)
        │                                                              │
        ▼ writes ids + mirrored status/balance                        │ own DB
  Supabase `core`  ◄── edge function `blnk-webhook` (event inbox) ◄────┘
  (account, ach_transfer, entity, control_result, …)
```

## 2. Primitive mapping (our schema ↔ Blnk)

| Our table / concept | Blnk primitive | Notes |
|---|---|---|
| `account` | **Balance** (`bln_…`) under a customer **Ledger** | `account.blnk_ledger_id` today points at the *ledger*; an account is really a **balance**. Add `blnk_balance_id`; keep `blnk_ledger_id` as the grouping ledger. |
| `account.balance` (bigint) | Blnk `balance` field | Becomes a **cached mirror** updated from webhooks. Blnk is authoritative. |
| `fbo_position` | Internal/settlement **Balance** | The For-Benefit-Of pooled balance; an internal `@`-style or real balance. |
| `entity` (person/business/trust/joint) | **Identity** (`idt_`) | `identity_type` individual/organization; map `name/email/tin/dob/address`. Store `blnk_identity_id`. |
| `verification`, `cdd`, `pep`, `ofac_result` | Identity + **PII tokenization** + Blnk **Watch** | Tokenize `FirstName/LastName/EmailAddress/PhoneNumber/Street/PostCode`. |
| `ach_transfer`, `wire_transfer`, `transfer` | **Transaction** (double-entry) | `precise_amount` = our `amount` (cents), `precision: 100`, `reference` = our row id. |
| `card_authorization` | **Inflight transaction** | authorize = create inflight (hold); settle = partial/incremental **commit**; decline/expire = **void**. |
| `inbound_payment` | **Transaction** from `@`-external | Credit customer balance from an external source balance. |
| `bookkeeping_entry` / GL (`account_code_5300`, `running_balance`) | **Reconciliation** + **balance snapshots** | Reconcile Blnk vs GL; snapshots for point-in-time reporting. |
| `event` (code, resource_id, payload, entity_hash) | **Webhook inbox** | Blnk events land here first, then update the target row. |
| `bsa_alert`, `control_result` | Blnk **balance monitors** / **Watch** rules | Threshold breaches (CTR, cash limits, liquidity) raise alerts. |

## 3. Money movement map (ledger topology)

Per Blnk's [money-movement map](https://docs.blnkfinance.com/ledgers/money-movement-map),
model external parties as `@`-prefixed balances and group real balances by purpose:

- **External / settlement balances** (`@`): `@FedWire`, `@ACHNetwork`, `@CardNetwork`, `@Cash`, `@Fees`, `@Revenue`, `@Suspense`. Blnk **auto-creates** these on first transaction reference — no upfront provisioning.
- **Customer Ledger**: one balance per `account` (the customer's money).
- **Bank Ledger**: FBO/settlement/GL-control balances (`fbo_position`).

**Provisioned ledgers** (instance `instance_3d29b1b3…`, created 2026-07-10):

| Ledger | `ledger_id` | Role |
|---|---|---|
| Customer Ledger | `ldg_7d83bb57-a8a0-4fd9-a67e-9cd5fbe0e3ba` | per-account customer balances |
| Bank Ledger | `ldg_592fc16b-2989-4e00-9cfd-0caa213ade51` | FBO / settlement / GL-control |
| General Ledger | `general_ledger_id` | Blnk default → GL-control |

> **Idempotency note:** Blnk rejects an **identical request body** as `duplicate request`.
> Money-movement writes dedup correctly via `reference` (row id → one txn); non-reference
> setup calls (`create_ledger`/`create_balance`) must carry a unique nonce. The Phase-2
> writer helper (§6 TODO) must stamp `reference` and vary setup nonces.

Examples (source → destination):
- **Open + fund account**: `@OpeningFunding → bln_customer` (balances start at 0, so opening deposits are transactions, not presets).
- **Inbound ACH credit**: `@ACHNetwork → bln_customer`.
- **Outbound wire**: `bln_customer → @FedWire` (inflight: prepare→confirm).
- **Card auth/settle**: `bln_customer → @CardNetwork` inflight; settle = commit (partial allowed).
- **Fee**: `bln_customer → @Fees`.

## 4. Two-phase flows → Blnk inflight

Our API already has two-phase money movement — it maps 1:1 onto Blnk inflight
(`inflight: true` holds funds in `inflight_debit/credit_balance`; `PUT
/transactions/inflight/{id}` with `status: commit|void`; partial via
`precise_amount`; commit multiple times up to the held amount):

| Our flow | Create inflight | Commit | Void |
|---|---|---|---|
| Wire `prepare` → `confirm` (`/payments/wire/prepare`,`/confirm`) | on prepare | on confirm | on cancel |
| Card `authorize` → `settle` (`/sandbox/simulate/card/authorize`,`/settle`) | on auth | on settle (partial/incremental capture) | on expiry/reversal |
| ACH `pending_approval`/`submitted` → `settled` | on submit | on settlement | on `returned`/`rejected` |

This gives correct **held-funds accounting** and satisfies dual-control /
authorization controls automatically (money can't move until committed).

## 5. Identifiers & idempotency

- **`reference` = idempotency.** Blnk discards a duplicate `reference`. Use the
  originating row id (`ach_transfer.id`, etc.) or the `Idempotency-Key` we already
  accept (D6 in the API). One row id → at most one Blnk transaction.
- **Deterministic identity ids**: `identity_id = idt_<entity uuid>` (Blnk accepts caller-supplied `idt_`+UUID) → no mapping table needed for identities.
- **Balances/transactions** get Blnk-generated `bln_`/`txn_` ids; store them on the row (`blnk_balance_id`, `blnk_transaction_id`).

## 6. Sync architecture

**Command path (Supabase → Blnk) — primary mirror.** Backend services call Blnk
on money events, then persist returned ids + mirrored status. Never write Blnk's
DB directly. Blnk's REST/MCP responses are **synchronous and complete**
(`transaction_id`, `status`, `hash`, resulting ids), so the common-case mirror
happens here, not via webhooks: persist the response fields on the originating
row, then `GET /balances/{id}` to refresh `account.balance` after a move.

**Poll/reconcile path (pg_cron) — required, not a fallback.** A scheduled job:
- re-polls rows in non-terminal `blnk_status` (QUEUED/INFLIGHT/SCHEDULED) via
  `get_transaction_by_reference` and advances the mirror;
- **balance-drift check**: Blnk balance vs Supabase mirror → alert on mismatch;
- picks up async transitions webhooks would otherwise carry (scheduled txn
  applies, inflight commits/voids by another actor, `balance.monitor` trips via
  the balance-monitors API).

**Event path (Blnk → Supabase) — support-gated optimization.** The deployed
Edge Function `blnk-webhook` ingests global-webhook events
(`transaction.applied|inflight|void|rejected|scheduled`, `balance.monitor`,
`identity.created`, `reconciliation.completed|failed`, `bulk_transaction.*`)
into the `core.blnk_event` inbox (idempotent by event id), then updates the
target row. **Status: dormant.** Managed Blnk Cloud exposes **no self-serve UI**
to set the global webhook URL (`BLNK_WEBHOOK_URL` / `notification.webhook.url`
is instance env config; dashboard verified 2026-07-10 — Settings has API
keys/Watch/MCP/Instances but no webhooks page; the Apps library is a different
mechanism). Enabling requires a Blnk support request. Two caveats when enabled:
global webhooks are **at-least-once** (inbox dedup already handles it) and
**never retried on non-2xx** — a missed delivery is gone, which is why the
pg_cron reconcile path stays authoritative regardless.

**Reconciliation path (statements).** Nightly: push processor/Fed statements
into Blnk ([batch upload](https://docs.blnkfinance.com/reconciliations/overview)
or instant, `one_to_one`/`one_to_many`, `matching_rule_ids`); pull match results
(stored in txn `meta_data.reconciled`) into `bookkeeping_entry`/recon tables.

## 7. Proposed Supabase schema changes (new migration)

A `20260702000500_blnk_integration.sql` adding a thin mapping layer (nothing
sensitive; PII stays in Blnk's tokenized vault):

```
core.account            + blnk_balance_id text, + blnk_ledger_id (clarify), + balance_synced_at timestamptz
                          (comment: balance is a cached mirror of Blnk; Blnk is source of truth)
core.ach_transfer       + blnk_transaction_id text, + blnk_reference text, + blnk_status text, + synced_at
core.wire_transfer      + (same four)
core.transfer           + (same four)
core.card_authorization + blnk_inflight_id text, + blnk_committed_amount bigint, + blnk_status text
core.inbound_payment    + blnk_transaction_id text
core.entity             + blnk_identity_id text
core.verification       + blnk_tokenized boolean            (PII tokenized in Blnk)

new  core.blnk_event     (event inbox: id pk, event text, blnk_id text, payload jsonb,
                          received_at, processed_at, status, error)   -- idempotent ingest
new  core.blnk_sync_state (resource, last_cursor, last_synced_at)     -- drift/backfill
```

Indexes on every `blnk_*_id`; FKs stay soft (external ids). Regenerate via
`gen_sql.py` once the mapping columns are added to `model.json` overrides.

## 8. Compliance leverage (ties into the control tests)

Blnk directly strengthens evidence our [pgTAP suite](tests/README.md) checks:

| Blnk feature | Evidences (control themes) |
|---|---|
| Immutable double-entry + per-txn **SHA-256 hash** + optional **hash chain** (`BLNK_TRANSACTION_HASHCHAIN_ENABLED`, `blnk verify-chain`) | GL integrity, records immutability, audit (MB-05/06, RP, records_package, audit) |
| **Reconciliation** (ledger vs external) | recon controls, `bookkeeping_entry`, trade/settlement |
| **Balance monitors** (threshold alerts) | BSA (CTR/structuring), cash limits, liquidity, concentration |
| **Inflight holds** (funds can't move until committed) | dual-control on wires, card authorization, segregation of duties |
| **PII tokenization** (`tokenization_secret`, tokenize/detokenize logged) | privacy/GLBA/GDPR, IS data-minimization |

## 9. Deployment — Blnk Cloud (decided)

We use **Blnk Cloud** (managed): Blnk runs Postgres/Redis/Typesense; we consume
the API only. Fully external to Supabase, so the "don't share a database"
principle holds by construction.

**Provisioned instance** (as of 2026-07-09):

| | |
|---|---|
| Instance ID | `instance_3d29b1b3-6c55-4cd8-a6d7-3c08f5eae9cd` |
| Cloud API base | `https://api.cloud.blnkfinance.com` |
| Core REST base (command path) | `https://pynthia-pynthia-test.deploy.blnkfinance.com` |
| [MCP endpoint](https://docs.blnkfinance.com/cloud/integrations/mcp) | `https://api.cloud.blnkfinance.com/mcp/instance_3d29b1b3-6c55-4cd8-a6d7-3c08f5eae9cd` |
| Webhook receiver (deployed, dormant — see §6) | `https://jynsipdvrgqdkeqrlzcv.functions.supabase.co/blnk-webhook` |
| Instance secret key | dashboard → instance details (webhook signing; → `BLNK_WEBHOOK_SECRET` when enabled) |

The **MCP** endpoint is read/query access for AI assistants (33 tools: ledgers,
balances, transactions, identities, views, insights, search, queries) — auth via
`Bearer <key>` with `mcp:read`/`mcp:write` scopes; all traffic proxied through
Blnk Cloud (clients never hit Core directly). Separate from the REST + webhook
integration the edge functions use. **API keys are never committed** — stored in
Blnk Cloud creds / the developer's local MCP config, rotated on exposure.

- **Provision** a Cloud [instance](https://docs.blnkfinance.com/cloud/instances/create)
  (7–10 min); use [branching](https://docs.blnkfinance.com/cloud/instances/branching)
  for a staging ledger and [whitelist](https://docs.blnkfinance.com/cloud/instances/whitelist)
  our egress IPs (Supabase edge functions / backend).
- **Auth**: Cloud API keys + OAuth
  ([get/refresh access token](https://docs.blnkfinance.com/cloud/reference/get-access-token));
  use scoped keys (`resource:action`, e.g. `transactions:write`, `balances:read`)
  with least privilege. Store secrets + `tokenization_secret` in **Supabase Vault**,
  inject into edge functions. Never ship keys client-side.
- **Vendor/compliance**: Blnk Cloud is a **third-party service provider** — it
  needs a DPA and GLBA Safeguards vendor oversight (`vendor_review`, TPR controls).
  This matters most for the PII decision (§11.2): tokenizing PII in Blnk means
  pre-tokenization PII transits a managed vendor.
- **Config knobs** that still apply via Cloud settings: enable
  [hash chain](https://docs.blnkfinance.com/transactions/hash)
  (`BLNK_TRANSACTION_HASHCHAIN_ENABLED`), notification/webhook endpoint,
  `tokenization_secret`.

## 10. Phased rollout

| Phase | Deliverable |
|---|---|
| **0 — Stand up** | Provision Blnk **Cloud** instance (+ staging branch, IP whitelist), define money-movement map (ledgers + `@`-external balances), provision scoped API key + `tokenization_secret` (in Supabase Vault), enable hash chain, execute vendor DPA. |
| **1 — Identities & balances** | `entity` active → create Blnk identity; `account` open → create balance under customer ledger; opening deposit as a transaction. Persist ids. |
| **2 — Money movement** | Route ACH/wire/transfer/card/inbound through Blnk; two-phase flows via inflight (create → commit/void). |
| **3 — Webhook sync** | `blnk-webhook` edge function + `core.blnk_event` inbox; mirror status/balance; feed `event`. |
| **4 — Reconciliation** | Nightly external recon + balance-drift check → `bookkeeping_entry`/recon. |
| **5 — Compliance wiring** | Balance monitors → `bsa_alert`/`control_result`; `verify-chain` in records/audit packages; map to control tests. |

## 11. Decisions

**Resolved**

1. **Hosting — Blnk Cloud** (managed). See §9.
2. **Balance authority — mirror.** Supabase `account.balance` is read-only,
   updated only from Blnk webhooks. Blnk is the sole source of truth; no dual-write.

**11.2 PII residency — needs compliance sign-off**

Both options tokenize PII in Blnk for the ledger; the question is where the
*authoritative source* PII lives. With **Blnk Cloud** (a managed vendor), either
way some PII reaches a third party, so this is a GLBA Safeguards + vendor
(`vendor_review`/TPR) decision, not just a storage choice.

| | A. Tokenize in Blnk, Supabase PII-lean | B. Source PII in Supabase (encrypted), tokens mirrored to Blnk |
|---|---|---|
| Authoritative PII | Blnk Cloud vault | Supabase (our boundary) |
| Supabase PII footprint | Minimal (tokens/refs) | Full (encrypted at rest) |
| PCI/PII scope reduction | Strongest | Moderate |
| Vendor exposure (Blnk Cloud) | Higher — clear PII rests at vendor | Lower — vendor holds tokens; source stays with us |
| KYC/CDD workflow self-containment | Depends on detokenize calls | Fully self-contained in Supabase |
| GLBA/GDPR posture | Data-minimization at our boundary; leans on vendor DPA | Control stays with us; deletion/DSAR easier to honor |

*Recommendation for counsel:* **B** — keep authoritative encrypted PII in Supabase
(our boundary, easier DSAR/deletion and GLBA control), mirror only tokenized
fields to Blnk for ledger use. Revisit if PCI scope reduction is the priority.
→ route to compliance/counsel with the executed Blnk DPA.

**Proposed defaults (confirm or override)**

3. **Ledger topology** — one **customer ledger** (a balance per `account`) + one
   **bank ledger** (FBO/settlement/GL-control), external parties as `@` balances.
4. **Currency** — USD-only, `precision: 100`, now. Multi-currency later uses the
   highest precision across assets.
5. **Idempotency** — reuse the API `Idempotency-Key` (D6) as Blnk `reference`.
