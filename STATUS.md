# Policy Regeneration Status

> **What this is, and what it is not.** A per-policy LOG, not a status board for
> the corpus. `scripts/regenerate_policy.py` stamps one row — its own — each
> time a policy is regenerated, so a policy that has not been regenerated since
> this file was created has no row here at all. The table below therefore covers
> a handful of the 27 policies in the catalogue, and its absence of a row means
> "not regenerated recently", never "not present" or "failing". For what the
> corpus actually contains, see [STATE.md](STATE.md) and
> `compliance/policies/manifest.yaml`; for what is regenerable, the manifest is
> the authority. This file is excluded from the doc gate because it is machine
> written, which is also why nothing catches it going stale — see TODO §10.

_Last run: 2026-06-18T00:00:00Z_
_Run totals: 2 regenerated · 0 failed_

| Policy | Slug | Status | Last Regenerated | DESIGN_NOTES Source | Skipped References | Notes |
|---|---|---|---|---|---|---|
| Fair Lending | fair-lending | ✅ regenerated | 2026-06-05T19:05:00Z | dynamic via skill (ok) | — | — |
| Cash | cash | ✅ regenerated | 2026-06-18T00:00:00Z | dynamic via skill (ok) | Cash Management Annual Review Packet.pdf (ACH/wire annual-review form — not cash-handling controls); Cash-Management-Agreement.pdf (business online banking agreement — out of scope per PATRICK_NOTES) | Merged former Cash Control and Cash Management policies; 12 controls (CA-01–CA-12); Appendix A (limits schedule) and Appendix B (retention schedule) placeholder assumptions logged |
| Record Retention Policy | record-retention | ✅ regenerated | 2026-06-18T17:34:54Z | dynamic via skill (ok) | — | — |
