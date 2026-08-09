# Walkthroughs — the three cross-domain flows

The [context](README.md) and [container](containers.md) pages show structure.
This page shows motion: the three flows where UI, core, and compliance move
together — which is most of the work this repo will see.

## 1. A dollar moves (runtime)

What happens when a partner (or the demo harness) sends an $11,000 transfer.

```mermaid
sequenceDiagram
    participant P as Partner / harness
    participant A as Core API (transfers.ts)
    participant G as runGate
    participant B as Blnk ledger
    participant D as Postgres (core.*)
    participant U as Staff console
    P->>A: POST /transfers (X-Api-Key)
    A->>A: auth.ts — actor class may reach this route?
    A->>G: gate(movement)
    G->>D: read control catalogue
    G->>D: write control_result (pass), open bsa_alert (ctr_threshold)
    Note over G: reportable is not forbidden —<br/>the transfer proceeds AND alerts
    A->>B: post double-entry
    A->>D: event log: transfer.settled, …
    U->>A: GET /bsa/alerts (via read-only proxy)
    A-->>U: the alert, with its triage clock
```

Things this flow demonstrates that are easy to miss reading code:

- **The gate does not mean "block."** Most controls produce evidence and
  alerts; refusing is reserved for floors (e.g. the OFAC floor refuses a
  sanctioned name even under a full-trust partner attestation).
- **Every rail is the same story.** Replace `transfers.ts` with `ach.ts`,
  `wires.ts`, `cards.ts`, or `cda.ts` and the diagram is unchanged — that is
  the point of a shared gate.
- **The UI is a reader.** Staff see the alert because the proxy lets them
  read it, not because the UI participates in enforcement.

## 2. A policy changes (compliance → core → UI)

A compliance officer tightens a policy — say a new record-retention control.

```mermaid
sequenceDiagram
    participant O as Officer
    participant W as regenerate-policy.yml (LLM)
    participant X as extract_controls.py
    participant V as vocab gates
    participant E as Engineer
    participant C as Core + schema
    O->>W: edit prompt.md (or the policy md directly)
    W->>X: rewritten {slug}.md with control blocks
    X->>X: controls.json gains the control
    X->>V: classify its vocabulary against the spec
    alt vocabulary exists
        V-->>C: control binds to real events — drill demands evidence
    else vocabulary missing
        V-->>E: "missing vocabulary" = demand signal
        E->>C: declare field/event in core-api.yaml, migrate, implement
    end
    Note over C: the control shows RED on the dashboard<br/>until the drill proves its evidence appears
```

The key mechanic: **a policy asking for something the core lacks does not
fail silently and does not block the policy** — it becomes a visible red
control plus a named vocabulary gap, which is the work queue for the core.
The reverse loop (`core/core-api-loop/`) then searches for the smallest spec
that satisfies the accumulated demand.

## 3. An endpoint changes (spec → core → UI → compliance)

An engineer adds a query parameter to an account listing and wants the staff
console to use it.

```mermaid
sequenceDiagram
    participant E as Engineer
    participant S as core-api.yaml
    participant R as rebuild_artifacts.sh
    participant C as Core API
    participant U as Staff console
    E->>S: declare the change (x-handler, x-tier, x-audience,<br/>x-ui-surface on the GET)
    E->>R: run the cascade
    R->>C: routes.gen.ts regenerated
    R->>U: proxy allowlist + wire types regenerated
    R->>R: verifier targets, vocab, STATE.md, doc gate
    E->>C: implement the handler (standard signature)
    E->>U: use the typed field in the page
    Note over R: any skipped step = a named red gate,<br/>in the same PR, not in production
```

The order is the discipline: **spec first, generate, then implement.** Going
the other way (implement first) is what the parity gates exist to catch. The
full per-change-type recipe — endpoint, field, event, UI surface — is in
`CLAUDE.md` at the repo root.

## When something is red and you don't know why

| red thing | first place to look |
|---|---|
| a control on the dashboard | `red_by_reason` in `control-tests.json` — it names the missing writer or input |
| hermetic-green but live-red | `control-tests-live.json` `fake_vs_real_defects` — a real-database divergence |
| route parity / schema parity | the spec and the implementation disagree; fix whichever is lying, never the baseline |
| emitted coverage | the core emits an event code `x-events` never registered — register it in the spec first |
| doc claims | a hand-written doc references a dead path or stale number; fix the doc it names |
| UI contract check | someone hand-edited a generated file, or the spec changed under the UI — rerun `scripts/gen_ui_contract.py` |
