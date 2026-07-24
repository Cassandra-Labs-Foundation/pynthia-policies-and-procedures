# Banking-as-a-Service API Documentation Synthesis Prompt

## Task

You are a technical architect analyzing Banking-as-a-Service (BaaS) platforms to inform the design of a new core banking system. Review the provided API documentation summaries for multiple BaaS providers and synthesize them into a single, unified comparison document.

## Input

You will receive individual summaries of banking API documentation from multiple providers (e.g., Unit, Column, Galileo, Q2 Helix, Increase, Moov). Each summary may include:

- Authentication and authorization approaches
- Core entity models and relationships
- Account types and structures
- Transaction processing flows
- State machines and lifecycle management
- Webhook/event systems
- Error handling patterns
- Rate limiting and operational constraints

## Output Format

Produce a comprehensive comparison document organized by functional domain. For each domain:

1. **List each provider's approach** with concise bullet points highlighting their specific implementation
2. **Synthesize differences** in a "Differences" or "Comparison" paragraph that explains the tradeoffs
3. **Identify patterns** where providers converge on similar solutions (industry best practices)
4. **Call out unique capabilities** that only one or few providers offer

Use this structure for each section:

```markdown
## [Domain Name]

- **Provider A:**
  - Key characteristic 1
  - Key characteristic 2
  - Notable detail

- **Provider B:**
  - Key characteristic 1
  - Key characteristic 2
  - Notable detail

[...additional providers...]

- **Differences:** [Paragraph comparing approaches, explaining when you'd choose one over another, and noting tradeoffs in flexibility, complexity, and operational burden]

- **Industry Pattern:** [Optional - note if most providers converge on a similar approach]

- **Unique Capabilities:** [Optional - highlight standout features from specific providers]
```

## Domains to Cover

Organize the comparison into these functional domains (add others if the source material warrants):

1. **Authentication/Authorization** - Auth mechanisms, token management, OAuth support, multi-tenancy
2. **Entity Hierarchy** - How customers, accounts, and sub-entities relate; organizational structures
3. **Account Types & Capabilities** - Deposit accounts, card programs, lending products, account features
4. **Cards & Card Programs** - Virtual/physical cards, card controls, authorization flows
5. **Transaction Processing** - Payment rails (ACH, wire, RTP), transaction states, clearing/settlement
6. **Ledger Architecture** - Double-entry vs single-entry, holds, balance types, reconciliation
7. **State Machines & Lifecycles** - Entity states, transitions, immutability patterns
8. **Webhooks & Events** - Event types, delivery guarantees, subscription models
9. **Compliance & KYC** - Identity verification, document handling, regulatory workflows
10. **Error Handling** - Error formats, idempotency, retry patterns
11. **Rate Limiting & Operational Constraints** - Limits, quotas, SLAs
12. **Developer Experience** - SDKs, sandbox environments, documentation quality

## Guidelines

- **Be specific:** Include actual field names, endpoint patterns, and concrete values where available
- **Be balanced:** Present each provider's approach fairly; avoid favoritism
- **Be practical:** Focus on differences that matter for implementation decisions
- **Highlight tradeoffs:** Every design choice has costs; articulate what you gain and lose
- **Note gaps:** If a provider lacks coverage in an area, explicitly state this
- **Preserve nuance:** Don't oversimplify; banking APIs have complex edge cases

## Tradeoff Dimensions to Consider

When comparing approaches, evaluate along these axes:

| Dimension | Description |
|-----------|-------------|
| **Flexibility** | Can you customize behavior, or is it opinionated? |
| **Complexity** | How much do you need to understand to use it correctly? |
| **Operational Burden** | What ongoing work does this create for the platform operator? |
| **Integration Effort** | How much code/configuration to get started? |
| **Scalability** | How well does this work at high volumes? |
| **Compliance Alignment** | How well does this map to regulatory requirements? |
| **Auditability** | How easy is it to trace what happened and why? |
| **Failure Modes** | What happens when things go wrong? |

## Example Section

Here's an example of the expected output quality:

```markdown
## Ledger Architecture

- **Unit:**
  - Single balance model with `available` and `balance` fields
  - Holds managed implicitly through card authorizations
  - Transactions reference accounts directly
  - No explicit ledger entries exposed via API

- **Increase:**
  - Explicit pending vs posted balance separation
  - `InboundPendingAmount` and `CurrentBalance` tracked separately
  - Detailed transaction lifecycle with hold/clear/release states
  - Ledger accounts available for custom tracking

- **Column:**
  - Double-entry ledger with explicit debit/credit entries
  - Balance types: available, pending, held
  - Ledger entries immutable; corrections via reversing entries
  - Sub-ledger support for complex accounting needs

- **Moov:**
  - Wallet-based model with available/pending balances
  - Transfers between wallets create paired entries
  - Balance snapshots available for reconciliation
  - Simplified model optimized for money movement

- **Differences:** Column provides the most traditional accounting approach with explicit double-entry, ideal for organizations needing robust audit trails and custom GL integration. Increase strikes a balance with detailed lifecycle tracking without requiring full double-entry understanding. Unit abstracts away ledger complexity entirely, reducing integration burden but limiting visibility. Moov's wallet model is intuitive for simple money movement but may require additional accounting layers for complex use cases.

- **Industry Pattern:** All providers separate "available" from "pending" or "held" funds, reflecting the universal need to prevent overdrafts while transactions settle.

- **Unique Capabilities:** Column's sub-ledger support enables sophisticated use cases like tracking funds across multiple dimensions (by customer, by funding source, etc.) without external systems.
```

## Final Deliverable

Produce a document titled:

```markdown
# Banking-as-a-Service API Comparison: [Provider A] vs [Provider B] vs [...]
```

Include:
1. Brief executive summary (2-3 paragraphs) with key findings
2. All relevant domain sections in the format above
3. Concluding section with recommendations for different use cases (e.g., "Choose X if you need...", "Choose Y if you prioritize...")

---

## Source Summaries

[Paste individual API documentation summaries below this line]