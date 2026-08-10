# TODO — what's missing, and what to work on next

> Hand-written backlog, compiled 2026-08-09 from a full docs + codebase audit.
> Live numbers belong to [STATE.md](STATE.md) — where a count appears here it is
> a snapshot from that date; trust the artifacts
> (`control-tests-live.json`, `crosswalk.json`, `core/verifier/worklist.md`)
> over this prose. This file is in `check_doc_claims.py`'s checked set, so a
> path or gated number that goes stale turns the doc gate red.

## 1. Quick wins (mechanical, do first) — DONE 2026-08-09

- [x] Commit the orphaned parquet sweep: `analytics/archive/` has one untracked
      file covering event sequences 1694520–1705198 (10,679 events). Git is the
      stated cold archive of record and is currently missing that range.
- [x] Fix the drill doc path: `drill/run.ts` still writes `DRILL.md` at the repo
      root, but the doc moved to [docs/drill.md](docs/drill.md) — every re-run
      leaves the real doc stale. Also add a `drill.json` step to
      `scripts/rebuild_artifacts.sh`; it is the only artifact outside the cascade.
- [x] `core/architecture-decisions.md` hygiene: mojibake (double-encoded UTF-8)
      throughout, the v1.1 row missing from its own revision table, and six
      Appendix-B documents that don't exist in this repo.
- [x] Add `doc-gate.yml` to the CI workflow table in
      [docs/architecture/containers.md](docs/architecture/containers.md).
- [x] Fix stale prose inside generated-artifact *inputs*: `crosswalk-mappings.json`
      OQ-07 ("BSA-21 is the only reachable control" — the generated tables now
      say otherwise) and OQ-10 ("there is no CTR filing" — `core.ctr_filing`
      exists); `control-scope.json`'s header count of judgment calls is six low.
- [x] Delete the root `supabase/` CLI scratch (untracked `.temp/` leftovers) so
      nobody runs the Supabase CLI at the wrong level.

## 2. Fake-vs-real defects — the live-tier backlog — DONE 2026-08-10

Cleared in full: the live tier stands at 225 green / 0 red in scope, zero
fake-vs-real defects (down from 46). The causes decomposed into six
mechanical classes — fixtures that never reached the real database,
recorder-copy mutations, wrong select lists, invented enum vocabulary,
uuid-vs-text id mismatches, and live-state accumulation on converged rows —
fixed across two commits (see git log 2026-08-09..10). The related schema
debt (the ten `todo()` columns) went with it: migration 20260809000100
renamed the dotted first-cut columns, and the coverage suite regenerates
with zero gaps. Refresh the baseline any time with
`gh workflow run live-control-tier.yml -f mode=refresh` — never run the
full tier from a laptop.

## 3. Decisions only a human can make (each blocks a swath)

- [ ] Review the crosswalk claims — none have `reviewed_by` set, so no coverage
      claim is load-bearing and nothing holds the `discharges` verdict
      ([CROSSWALK.md](CROSSWALK.md)).
- [ ] Set the institution parameters that are deliberately NULL: governance
      calendar anchor dates (83 time-based obligations are UNSCHEDULED — OQ-15),
      per-client ACH dual-control thresholds (every ACH batch is UNASSESSED —
      OQ-14), LAR bands, survival horizon, capital triggers, the cash limits
      schedule, LTV max.
- [ ] Answer the high-severity open questions in `crosswalk-mappings.json`:
      OQ-01 (CG-CTR-01 misnamed), OQ-02 (the OFAC floor is a stub), OQ-12
      (accounts have no owning entity — blocks per-person cash aggregation for
      BSA-08), OQ-14, OQ-15.
- [ ] The lending routing decision: the handlers in `api/lending.ts`,
      `api/lending_underwriting.ts`, `api/collections.ts`, plus five
      fair-lending handlers in `api/deposits_member.ts`, stay dead code until
      the product decision lands (documented exception in `api/index.ts`).
- [ ] Decide whether D5 Phase-2 delegated auth (`/auth/token`) and the D24
      credit-union admin console stay deferred — both are design-level
      deferrals in `core/architecture-decisions.md`, restated here so the
      engineering backlog stops carrying them.
- [ ] Fix the colliding CP-01…CP-10 ids between capitalization and cash
      (OQ-11) — colliding claims are refused by the crosswalk build. The CA- vs
      CP- prefix drift recorded in [STATUS.md](STATUS.md) is the root cause.

## 4. API surface not yet built — engineering half DONE 2026-08-10

What could move without a product decision, moved:

- [x] Card issuance routed: `POST /cards` and `POST /members/{id}/card-reissue`
      graduated from `x-proposed-paths` to routed, self-gated internal
      operations (the handlers already existed).
- [x] The proposed surface is documented:
      [docs/proposed-surface.md](docs/proposed-surface.md) is generated in the
      cascade from `x-proposed-paths` — operations by resource, with schema
      existence and the verifier's demand signals joined in.
- [x] The verifier's inducer mapping was measured, not guessed: of the old
      153 `no_api_inducer` entries, 108 were scoped-out obligations the
      enumerator never checked against `control-scope.json`, and 22 more were
      request-driven rules whose routed handler emits the whole reaction
      (the enumerator now derives the inducer from output provenance and
      cites it). `core/verifier/worklist.md` now carries 25 `no_api_inducer`
      targets — the credit-origination surface parked by the narrow-bank
      decision, plus IP-15 — instead of contradicting the drill.
- [x] Response-contract stubs are counted in [STATE.md](STATE.md)
      ("operations with stub response contracts") so the number can't drift
      in prose again. Verdict after assessment: do NOT machine-author them —
      nothing consumes response schemas today (the verifier's contract
      targets, the UI types and the SQL generator all read other things), and
      a generated contract nobody validates would be a second, subtly-wrong
      truth next to the honest "the handler is the contract" pointer. The
      channel, when the black-box tests in `core/verifier/TEST-CATALOG.md`
      start consuming contracts, is `core-api-loop/migrate/contracts-overlay.yaml`
      (request + response together, per reviewed slice). Note: `x-provisional`
      is unrelated — it is provenance metadata on event-derived schema fields
      and gates nothing.

What stays, and why — all product-gated, all decisions in section 3's court:
the remaining proposed paths (dominated by resources the verifier's
state-machine targets wait on: loans, cases, filings, findings, risks,
trades), the lending/collections/fair-lending routing itself, D5 Phase-2
delegated auth (`/auth/token`), and the D24 credit-union admin console.

## 5. Test debt

- [ ] `core/verifier/TEST-CATALOG.md`: all 86 black-box contract tests are
      unwritten (idempotency, error envelopes, pagination, versioning).
- [ ] Six API modules have no test file: `api/audit.ts`, `api/capital.ts`,
      `api/eps_controls.ts`, `api/hr.ts`, `api/member_protection.ts`,
      `api/ops_security.ts`.
- [ ] 25 verifier properties are `spec_ahead` (money conservation, double-entry,
      OFAC-always, Luhn, the SEC-* and RES-* families) — invariants with no
      surface to run against yet.
- [ ] The drill does not exercise FKs, UNIQUE constraints, immutability
      triggers, or transactionality ([docs/drill.md](docs/drill.md)) — the live
      tier is the only net for those classes.
- [ ] `POST /sandbox/simulate` returns 501 for rails without a simulation
      route, so those lifecycles can't be driven deterministically in tests.

## 6. Ledger / Blnk integration (orphaned live TODO)

`blnk-webhook/TODO.md` is referenced by no doc index and holds the cutover
work: the webhook switch-on itself (`BLNK_WEBHOOK_SECRET` unset → 500s),
balance-mirror refresh on `transaction.applied`, pulling MATCHED
reconciliation results into `core.bookkeeping_entry`, the monitor→control-id
map for `control_result` rows, Blnk key scoping, secret rotation, a lag
metric, and cold-start backfill. Two blueprint flags never closed:

- [ ] The `fbo_position.position_cents` sign inconsistency between the payment
      hub and origination capture (explicitly "the call is Lorenzo's" in
      [docs/history/blueprint.md](docs/history/blueprint.md)).
- [ ] `is_money_code` has no return and no inbound codes — a returned wire
      never reverses its position effect, and members funding the FBO don't
      move the position.

## 7. Reporting & analytics

- [ ] The 5300 reporter (`analytics/report_5300.sh`) writes five columns
      against a nine-schedule form; `account_code_5300` is hardcoded to `"018"`
      on every bookkeeping entry. No chart-of-accounts mapping, no GL-backed
      trial balance — which is also why `ui/src/lib/ncua5300.js` has twenty
      unsourceable lines and TOTAL ASSETS renders blank.
- [ ] The scheduled reporters have never run in CI — the `SUPABASE_DB_URL`
      secret is unset (`.github/workflows/aggregator-reporters.yml`).
- [ ] `analytics/aggregator_views.sql` filters a hardcoded four-code money
      allowlist against the full event registry — any new money rail is
      silently invisible to both reporters. The BSA reporter hardcodes the
      $10,000 threshold and 90-day window.
- [ ] Physical pruning of archived Postgres rows was never implemented, so
      every archived row is stored twice indefinitely.

## 8. Stubs standing in for real integrations

- [ ] OFAC screening matches the literal token "SDN" (`api/bsa_program.ts`) and
      `sdn_list_version` is always NULL — no sanctions list, no
      re-verification, no 50%-rule derivation.
- [ ] KYC providers (Alloy/Socure/Middesk) are deterministic simulations
      behind the real adapter in `api/kyc.ts`.
- [ ] Roughly thirty red or scoped-out obligations wait on external feeds: an
      HR feed alone flips nine (handoff Group A), plus SIEM, backups, pentest,
      TLS scanning, and vendor attestations (Group B) — see
      [docs/history/2026-07-19-handoff.md](docs/history/2026-07-19-handoff.md).
- [ ] The dashboard data route is still public — the re-locking recipe sits
      unapplied in `api/dashboard.ts`, and `ALLOW_DEMO_KEY` defaults to enabled
      unless explicitly set to `"false"`.
- [ ] Retention clocks exist for two of nine record classes — a wire transfer
      starts no retention clock (OQ-10); CTR exemptions are stored but never
      evaluated (OQ-13).

## 9. UI

The proxy is GET-only, so every write is a disabled button: teller
deposit/withdrawal, member edit, and the entire MSR servicing list (cards,
checks, stop-pays, wires). Only the 14 `x-ui-surface` paths are
browser-reachable — no UI for cards, wire/ACH lists, BSA cases, filings, or
findings. The teller drawer is the last mock fixture in `ui/src/lib/mock.js`
because no core endpoint exists for it.

## 10. Compliance corpus & pipeline hygiene

- [ ] 257 "Assumptions & Gaps" bullets across the generated policies,
      aggregated nowhere — dominated by board parameters deferred to documents
      that don't exist (cash limits schedule, investment appendices, the SOD
      matrix, EDD thresholds).
- [ ] 494 over-listed provisional vocab codes (only 23 genuinely resolve
      nowhere) — regeneration debt with no automated check. Plus the standing
      backlogs: `vocab-nonconforming.txt` (111 entries),
      `vocab-nonconforming-timers.txt` (112), and `vocab-field-normalize.txt`
      (302 lines that nothing consumes).
- [ ] Shared-control propagation is enforced by convention only — regenerating
      any of SC-01's seven host policies re-diverges the wording; no
      byte-identity checker exists in `scripts/` or CI.
- [ ] `schema-parity-baseline.json`: 486 findings, none ever burned down (240
      columns missing from the spec, 201 unspecced tables).
- [ ] `charitable-donation-accounts` is disabled in the policies manifest yet
      ships a live catalogue and dashboard page; the six `CG-*` runtime gate
      rows render with no evidence attached; two dashboard views
      (`compliance/dashboard/choreography/index.html` and a one-off BSA
      preview) are published on Pages but unreachable from any nav.
- [ ] [STATUS.md](STATUS.md) is the single worst doc: months stale, rows for
      three of the 27 policies, and excluded from the doc gate so nothing will
      ever catch it.
- [ ] `scripts/code_format.py` and `scripts/check_vocab_refs.py` run in no
      workflow — their backlogs can grow silently. The pre-push doc gate is
      opt-in per clone (`git config core.hooksPath .githooks`).
