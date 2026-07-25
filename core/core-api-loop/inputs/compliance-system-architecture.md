# Cassandra Complianc System Architecture

## The Core Idea

Cassandra treats compliance controls as first-class API primitives rather than PDF checklists. The system creates a **bidirectional contract** between Pynthia's legal team and engineering team, where an OpenAPI specification serves as the single source of truth for everything the compliance system can reference — endpoints, schemas, events, and computed fields.

The key primitive is the **control**, not the policy document. Each of the 223 controls is expressed as an interface with well-defined triggers, inputs, outputs, SLAs, and audit logs. Policies are compositions of these controls.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CONTROL BUILDER UI                              │
│                       (React + TypeScript)                              │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │  Control Editor   │  │ Vocabulary       │  │  Validation Panel    │  │
│  │                   │  │ Browser          │  │                      │  │
│  │  • Triggers       │  │                  │  │  • Real-time errors  │  │
│  │  • Inputs/Outputs │  │  • Events        │  │  • PII warnings      │  │
│  │  • SLAs/Timers    │  │  • Fields        │  │  • OpenAPI links     │  │
│  │  • Edge Cases     │  │  • Endpoints     │  │  • Broken refs       │  │
│  │  • Access Control │  │  • SLA Types     │  │  • Coverage gaps     │  │
│  │  • Audit Logs     │  │  (drag-and-drop) │  │                      │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘  │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         VOCABULARY SERVICE                              │
│                       (Node.js/Bun + Zod)                               │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    OpenAPI Parser                                 │   │
│  │  • Resolves $ref pointers                                        │   │
│  │  • Extracts endpoints, schemas, parameters                       │   │
│  │  • Reads x-events, x-computed extensions                         │   │
│  │  • Infers compliance metadata (PII, fair lending risk)           │   │
│  │  • Outputs dot-notation paths (wire_transfer.originator.city)    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  API Surface:                                                           │
│    GET  /vocabulary/events         GET  /vocabulary/fields               │
│    GET  /vocabulary/endpoints      POST /vocabulary/requests             │
│    POST /controls/validate         POST /controls/save                   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Traceability Engine                            │   │
│  │  • Control → OpenAPI: which spec fields does this control use?   │   │
│  │  • OpenAPI → Control: which controls break if this field changes?│   │
│  │  • Regulation → Control: which controls satisfy this reg cite?   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         FILE SYSTEM / GIT                               │
│                                                                         │
│  /specs/openapi.yaml           (source of truth for API surface)        │
│  /vocabulary/vocabulary.json   (derived from spec + manual additions)   │
│  /controls/*.yaml              (compiled controls from builder)         │
│  /controls/controls.json       (223 controls, machine-readable)         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Control Anatomy

Every control follows a uniform structure that maps directly to API concepts. Example:

```
┌─────────────────────────────────────────────────────────────┐
│  BA-05 — OFAC Screening & Holds                             │
├─────────────────────────────────────────────────────────────┤
│  WHY:        31 CFR Part 501; Part 594                      │
│  TRIGGERS:   ofac.screen.at.onboard, payment.pre.screen     │
│  INPUTS:     party.name[], party.dob, party.country,        │
│              payment.meta                                    │
│  OUTPUTS:    (blocking reports)                              │
│  TIMERS:     File reports per Part 501; retain 10 years     │
│  EDGE CASES: Program-specific licenses; 50% rule            │
│  AUDIT LOGS: ofac.hit.reviewed, ofac.blocked,               │
│              ofac.rejected, ofac.report.filed                │
│  ACCESS:     Sanctions team only; strict confidentiality    │
│  METRICS:    Hit rate; decision time; overdue reports        │
│  FLOOR:      true (cannot be disabled)                      │
└─────────────────────────────────────────────────────────────┘
```

Triggers, inputs, outputs, and audit logs are all vocabulary terms that resolve against the OpenAPI spec. If a lawyer references `party.name[]` and an engineer renames that field, the system flags the broken reference.

---

## The Bidirectional Feedback Loop

This is the architectural innovation. The system doesn't just flow one direction — it creates a continuous feedback loop between legal and engineering.

```
 LEGAL TEAM                                          ENGINEERING TEAM
 ──────────                                          ────────────────

 Authors control              ◄── Vocabulary ──►     Writes OpenAPI spec
 in Control Builder               Service            with x- extensions
       │                            │                       │
       │  References events,        │  Parses spec,         │
       │  fields, endpoints         │  extracts vocab       │
       │  from vocabulary           │                       │
       ▼                            ▼                       ▼
 Control saved            Traceability matrix         Spec committed
 to YAML/JSON             updated automatically       to Git
       │                            │                       │
       │                            │                       │
       ▼                            ▼                       ▼
 "I need a field         "These 4 controls          "Renaming tax_id
  that doesn't           reference fields in         to ssn breaks
  exist yet"             the /entities endpoint"     controls BA-03,
       │                                             CD-04, BA-05"
       ▼                                                    │
 Vocabulary Request ─────────────────────────────────►  Engineer sees
 (with SLA priority)                                    impact analysis
```

### Direction 1: Legal → Engineering (Control Authoring)

A lawyer opens the Control Builder, starts authoring a new control, and the Vocabulary Browser shows every event, field, and endpoint extracted from the current OpenAPI spec — grouped by category (member, compliance, bsa, transaction, etc.) with drag-and-drop into the editor. If the lawyer needs something that doesn't exist in the spec, they submit a **Vocabulary Request** with a priority level:

| Priority | SLA | Example |
|----------|-----|---------|
| Critical | 48 hours | Blocking launch |
| High | 1 week | Required for compliance |
| Medium | 2 weeks | Improves coverage |
| Low | Backlog | Nice to have |

### Direction 2: Engineering → Legal (Spec Change Impact)

When an engineer modifies the OpenAPI spec — renames a field, removes an endpoint, changes a schema — the Vocabulary Service regenerates the vocabulary and diffs it against the previous version. Any control that referenced a changed or removed vocabulary item gets flagged. The engineer sees exactly which controls they've broken before merging.

---

## Vocabulary Extraction Pipeline

The OpenAPI spec uses standard fields plus `x-` extensions to carry compliance metadata:

```yaml
# Standard OpenAPI
paths:
  /entities/person:
    post:
      operationId: createPerson
      x-events:                          # Extension: events emitted
        - member.created
        - kyc.started
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreatePersonRequest'

components:
  schemas:
    CreatePersonRequest:
      properties:
        name_first:
          type: string
          x-pii: true                    # Extension: PII flag
          x-fair-lending-risk: false     # Extension: fair lending
          x-retention: permanent         # Extension: data retention
          x-bound-controls:              # Extension: control refs
            - BA-03
            - CD-04
        tax_id:
          type: string
          x-pii: true
          x-retention: permanent
```

The parser walks the spec and produces a flat vocabulary:

```json
{
  "fields": [
    {
      "path": "CreatePersonRequest.name_first",
      "schema": "CreatePersonRequest",
      "type": "string",
      "required": true,
      "pii": true,
      "fair_lending_risk": false,
      "retention": "permanent",
      "bound_controls": ["BA-03", "CD-04", "BA-05", "BA-20", "CD-06"],
      "used_in_endpoints": ["POST /entities/person"]
    }
  ],
  "events": [
    {
      "name": "member.created",
      "emitted_by_endpoints": ["POST /entities/person"],
      "triggered_by_transitions": []
    }
  ],
  "endpoints": [
    {
      "method": "POST",
      "path": "/entities/person",
      "operationId": "createPerson",
      "events_emitted": ["member.created", "kyc.started"]
    }
  ]
}
```

### Shape Translation

The Control Builder UI expects vocabulary keyed by ID with category groupings (for dropdown menus), while the parser outputs arrays with richer metadata. A translation layer converts between formats:

```
Parser output (arrays with metadata)
  → Translation layer
    → UI format (objects keyed by ID, grouped by category)

VOCABULARY.events = {
  "member.created": { description: "...", category: "member" },
  ...
}
VOCABULARY.fields = {
  "member.name": { type: "string", category: "member", pii: true },
  ...
}
```

---

## Integration with Cassandra Core

The Control Builder / OpenAPI system connects to the broader Cassandra architecture at three points:

### 1. Control Engine (Runtime)

The 223 controls authored in the builder are compiled into the Control Engine that runs in each fintech instance. The engine subscribes to the centralized Event Bus, pattern-matches on event types defined in the vocabulary, and enforces controls as gates in state machines.

```
Event Bus (Kafka)
  │
  ├─► Control Engine
  │     • Subscribes to member.*, transaction.*, bsa.*, etc.
  │     • Evaluates control conditions
  │     • Gates state transitions (PENDING_APPROVAL → SUBMITTED)
  │     • Emits audit log events
  │
  ├─► Bookkeeping Layer
  │     • 5300 account code tagging
  │     • FBO classification
  │     • BSA/compliance holds
  │
  └─► BSA Engine (Aggregator)
        • Cross-fintech pattern detection
        • CTR/SAR filing
```

### 2. Control Distribution (Deployment)

Controls have a `compliance_floor` flag. Floor controls (like OFAC screening) cannot be disabled or weakened by any credit union or fintech. Non-floor controls can be customized by credit unions within defined bounds.

```yaml
control:
  id: BA-05
  name: OFAC Screening
  compliance_floor: true     # Cannot be disabled

control:
  id: VL-01
  name: Daily ACH Velocity
  compliance_floor: false    # Customizable
  customizable:
    threshold:
      default: 10000
      min: 5000
      max: 50000
```

Updates are force-pushed to all instances immediately. Fintechs inherit their credit union's controls without modification.

### 3. 5300 Real-Time Dashboard

The vocabulary and control structure directly feed the 5300 call report engine. Rather than a quarterly filing exercise, every Blnk transaction is tagged via the bookkeeping layer with 5300 attribution (`025B`, `CH####`, `schedule_a.*`), enabling a live regulatory dashboard.

---

## Control Coverage (223 Controls, 14 Categories)

| Category | Controls | Examples |
|----------|----------|---------|
| BSA/AML | BA-01 to BA-20+ | OFAC screening, CTR filing, SAR process, transaction monitoring |
| Customer Due Diligence | CD-01 to CD-12 | CIP/identity verification, beneficial ownership, risk profiles |
| Fair Lending | FL-01 to FL-14 | Protected bases, adverse action, HMDA, advertising |
| Collections | LC-xx | FDCPA, cease-and-desist, skip tracing |
| Cybersecurity | IS-01 to IS-12+ | Governance, access control, incident response, vendor risk |
| Business Continuity | BC-01 to BC-12 | Disaster recovery, alternate sites, pandemic planning |
| Resolution/Wind-down | RZ-01 to RZ-09 | Safe mode, records preservation, testing |
| Privacy | PR-01 to PR-07+ | GLBA notices, opt-out, employee access, third-party oversight |
| Vendor Management | VM-01 to VM-09+ | Inventory, due diligence, contracts, monitoring, exit |
| Contingency Funding | CFP-01 to CFP-06+ | Stress scenarios, early warning, funding sources |
| Lending/Reg Z | Various | Disclosures, rate locks, escrow, ability-to-repay |
| Deposits/Reg DD | Various | Truth in savings, overdraft, holds |
| Electronic Fund Transfers | Various | Reg E, error resolution, preauthorized |
| Governance | Various | Board reporting, policy review, training |

---

## Technology Stack

```
Frontend:
  framework:  React + TypeScript (Next.js)
  components: shadcn/ui + Tailwind CSS
  editor:     Monaco Editor (YAML preview)

Backend:
  runtime:    Node.js 20 or Bun
  framework:  Hono or Express
  validation: Zod
  parser:     @readme/openapi-parser

Storage:
  controls:   Git repository (YAML files)
  vocabulary: PostgreSQL or SQLite
  cache:      Redis (vocabulary lookups)

Infrastructure:
  local_dev:  Docker Compose
  ci_cd:      GitHub Actions
  hosting:    Fly.io or Railway (prototype)
```

---

## Key Design Decisions

**OpenAPI as single source of truth.** The spec isn't "just" an API description — it's a control vocabulary specification that happens to also describe HTTP endpoints. This means one artifact to maintain, one place lawyers look, one thing to diff.

**Event-driven vocabulary over endpoint-scoped.** Controls bind to domain events (`member.created`, `payment.pre.screen`) rather than HTTP endpoints. This decouples compliance logic from API surface changes and better matches how regulations actually work.

**Law-first approach.** Starting from legal controls (the 223 that exist) rather than from existing APIs ensures full alignment between regulatory requirements and technical implementation. The vocabulary is shaped by what compliance needs, then mapped onto what engineering builds.

**Controls as the primitive, not policies.** Policies are compositions of controls. By making the control the atomic unit — with typed triggers, inputs, outputs, and SLAs — you get reusability across policies and precise traceability to API fields.

**Compliance floor enforcement.** The `compliance_floor: true` flag on critical controls (OFAC, CTR filing, etc.) means they can never be disabled, regardless of credit union or fintech customization. This is the architectural expression of the "hostile examiner assumption."