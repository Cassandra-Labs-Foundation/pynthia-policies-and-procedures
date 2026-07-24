# Provider analysis — June 2026 refresh

Regenerated reproduction of the per-provider analysis + cross-provider comparison, produced by the
**confidence-pass narrative procedure** documented in [../../readme.md](../../readme.md):

1. **Spec-mine** the provider's OpenAPI spec (authoritative state surface), where one exists.
2. **Fan out live-doc reader agents** (money-movement / cards / entities-accounts-events), each
   confidence-grading every fact (✅ documented+cited · 🔶 inferred · ❓ unclear) and noting 404s.
3. **Merge** into a summary with a confidence ledger.

This refresh **supersedes the Dec-2025 originals** in the sibling provider folders (`../increase/`,
`../column/`, etc.) but does not delete them — those remain for provenance. The originals predate the
finding that several providers' generic-crawler captures were near-empty; this pass replaces the
broken crawl path with **OpenAPI specs + direct live-doc reading**.

## Contents
- `<provider>-url-summary.md` — per-provider summary (entity model, state machines with exact status
  strings, critical flows with timing, confidence ledger, cross-provider row). 8 providers.
- `complete-comparison.md` — cross-provider synthesis across 8 functional domains + a master decision
  matrix + recommendations for the Cassandra core.

## Coverage at a glance
| provider | structural source | confidence |
|---|---|---|
| increase | rich OpenAPI spec | very high |
| moov | rich OpenAPI spec | high |
| unit | spec (no schemas) → live docs | high |
| galileo | spec (no schemas) → live docs | high |
| q2helix | spec (no schemas) → live docs | high |
| column | no spec → live docs (rich) | high |
| mambu | no spec → live docs (some gated) | good |
| greendot | no spec → live docs (public) | good |

Key residual ❓ (genuinely unpublished, not gaps in reading): exact ACH cutoff clock-times,
UBO/KYB collection mechanics at the processors, and a few card state machines.
