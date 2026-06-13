# Provenance — architecture inputs

These files are **one-time snapshots** copied from the sibling `cassandra-core` repo
(`Cassandra-Labs-Foundation/core`). They are the authoritative architecture inputs for the
`core-api.yaml` self-minimizing loop. The eval harness reads **only these local copies** — it
never reads the live sibling checkout, so the loop has no run-time cross-repo coupling.

If `cassandra-core` updates its architecture, re-copy deliberately and bump this file.

## Source

- Source repo: `Cassandra-Labs-Foundation/core` (local path `../cassandra-core`)
- Source commit: `1131f5ffa190744ab218993af69f5298e4ff72b9`
- Commit line: `1131f5f 2026-06-04 13:54:50 -0700 added the simplified core api`
- Copied on: 2026-06-13

## Files

| File | Source path (in cassandra-core) | SHA-256 |
|---|---|---|
| `architecture-decisions.md` | `architecture-decisions.md` | `68fc42786d84708ad44596f824808de8b8514dd1a6f13772a09bfc3c1690dd92` |
| `compliance-system-architecture.md` | `research/autonomous-compliance/compliance-system-architecture.md` | `809c0b71c419677884c4badaf88d73eee4f9aea480d9ee36d85a63bf6740c5fe` |
| `fair-lending-openapi.yaml` | `research/autonomous-compliance/fair-lending-openapi.yaml` | `c7bc644ba41a1f0d41122ee9436bfca2f22f4c72a2aa5723e1408f9c523b8342` |

## Authority notes

- `architecture-decisions.md` (**v1.1**, dated 2026-02-20, 28 decisions D1–D28) is **authoritative**.
- `compliance-system-architecture.md` is **conceptual only** and its names are **stale** — it
  references "Kafka", "openapi.yaml", "vocabulary.json", all superseded. Per D4, Kafka was
  eliminated in favor of PostgreSQL append-only event logs. Never reintroduce these dead concepts.
- `fair-lending-openapi.yaml` is the reference sub-spec for the phase-1 fair-lending overfit.
