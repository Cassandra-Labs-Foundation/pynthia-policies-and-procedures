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
- [ ] The chart-of-accounts decision (blueprint §521, moved here from §7):
      sign off a GL account tree and the `account_type` → 5300 share-line
      mapping (`ACCOUNT_TYPE_MAP` in `ui/src/lib/ncua5300.js` is the written
      proposal), and decide what `core.bookkeeping_entry` becomes — it is
      single-sided with `account_code_5300` stamped `"018"` (a computed NCUA
      total, not a postable line) on every row. Until this lands, the 5300's
      asset side stays honestly blank and the filing cannot complete; once it
      lands, the engineering (double-entry posting, per-product stamping, a
      trial balance feeding `ncua5300.js`) is ordinary work.

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

## 5. Test debt — DONE 2026-08-10 (one deliberate remainder)

- [x] The black-box contract suite exists and runs: `core/verifier/contract/`
      — 30 of the catalogue's tests written and PASSING against the deployed
      core, 2 more written and `[~]` because they exposed real contract gaps
      (keyless mutation is accepted; the demo key is deliberately an internal
      actor). `contract-tests.yml` runs the suite weekly and on dispatch;
      `core/verifier/TEST-CATALOG.md` is the per-test ledger, including why
      each unwritten group waits (proposed endpoints, a partner-scoped
      credential, the aggregator layer, a webhook sink). Getting here also
      surfaced and fixed a production defect: the deployed function's Blnk
      key was stale, so account opening had been broken on the deployed API.
- [x] All six untested API modules have test files (53 tests; the full
      hermetic suite is 999). The writing surfaced four real defects in
      `eps_controls.ts`/`ops_security.ts` — flagged as a follow-up task, the
      worst being an auth-lockout counter that counts cumulative-ever
      failures instead of consecutive ones.
- [x] The drill's four documented blind spots (FKs, UNIQUEs, immutability
      triggers, NOT NULL partner_id) are now behaviorally tested:
      `core/supabase/tests/04_constraint_behavior.test.sql` (22 behavioral checks,
      executed against the full real migration chain) and a `pgtap` job in
      `core-ci.yml` — the first time ANY pgTAP runs in CI. Known remainder:
      the GENERATED pgTAP files (00–03) fail against the current schema
      (their seed rows predate NOT NULL partner_id and the uuid/text id
      changes) — flagged as a follow-up to fix `gen_tests.py` and widen the
      CI job beyond 04.
- [x] `/sandbox/simulate` has no missing rails: ACH, wire and card lifecycles
      are all simulated; book transfers settle synchronously by design; and
      the 501 for anything else is a typed index of what exists (now pinned
      by a contract test).
- [x] The 25 `spec_ahead` properties were re-assessed: five now have routed
      surfaces (`ACCTNUM-LUHN`, the four state machines) and moved to
      `ready` — three of them already have passing contract tests. The other
      20 genuinely wait on unbuilt surface (aggregator, rate limiting,
      `/events`, webhook sink) — see `core/verifier/worklist.md`.

## 6. Ledger / Blnk integration (orphaned live TODO)

`blnk-webhook/TODO.md` is referenced by no doc index and holds the cutover
work. **The switch-on is DONE 2026-08-11** — see that file's header for what
was actually true versus what this section long claimed. Still open there:
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

## 7. Reporting & analytics — engineering half DONE 2026-08-11

- [x] The scheduled reporters DO run in CI — this item was stale on arrival:
      the `SUPABASE_DB_URL` secret was set 2026-08-06 (before this backlog was
      compiled) and `aggregator-reporters.yml` has run green daily since,
      archiving parquet and writing BSA-lookback + 5300 evidence rows.
- [x] The money-code allowlist is single-sourced behind a red gate: the four
      money codes are declared in the spec (`x-money: true` in `x-events`),
      and `scripts/check_money_codes.py` (in the rebuild cascade) fails when
      `aggregator.is_money_code` or the DuckDB spanning view drifts from that
      set — a new money rail now goes loudly red instead of silently
      invisible. WHICH codes are money (returns, inbound — the §6 sign
      question) remains deliberately undecided; the gate just guarantees the
      answer lands everywhere at once.
- [x] The BSA thresholds are single-sourced: `aggregator.parameter`
      (migration 20260811000100) holds `ctr_threshold_cents`,
      `structuring_hot_window_hours`, `structuring_lookback_days` — values
      unchanged — and both `run_bsa_approver` and `analytics/bsa_reporter.sh`
      read them, so the approver and the reporter cannot disagree. Changing
      one is now an UPDATE with §3 sign-off, not a code hunt.
- [x] Physical pruning exists: `aggregator.prune_archived` (same migration)
      deletes hot rows only when the git-committed parquet, the archive
      watermark, AND every consumer cursor have passed them, and never rows
      younger than 72h (the approver's structuring branch re-reads a 24h
      entity window). `analytics/prune.sh` bounds by CONTIGUOUS committed
      coverage — a missed parquet commit (it happened: f28afe7) stops the
      prune at the gap instead of eating it. Runs in the workflow strictly
      after the parquet push. UPDATE stays refused forever; the append-only
      trigger gained exactly one door and it only opens from inside
      `prune_archived`.

What stays, and why: the 5300 reporter's five columns are honest evidence of
a scheduled aggregation, but mapping them onto the nine-schedule form needs
the chart of accounts, and that is a §3 decision, not plumbing —
`ui/src/lib/ncua5300.js` is the worked statement of exactly which lines are
blocked on it, and blueprint §521 records the mapping as waiting on a person.
Same for `account_code_5300 = "018"`: every bookkeeping entry is stamped with
a COMPUTED NCUA total no filer can post to, and re-stamping by account type
would silently bake in the provisional `ACCOUNT_TYPE_MAP` that ncua5300.js
explicitly refuses to apply without sign-off. Both now live in §3's
chart-of-accounts item rather than masquerading as §7 engineering.

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

## 11. Core runtime & data-access debt — added 2026-08-11

From a scaling review of the TypeScript core, prompted by the question of
whether to migrate to Go. The answer was no: none of what follows is a
language problem, and a rewrite would reproduce the first two verbatim. All
three are prerequisites for any future runtime change rather than
alternatives to one — doing them makes a later port cheaper, not redundant.
Ordered by correctness-per-hour.

- [ ] **Turn on typed database access.** `createDb()` in `api/lib.ts` returns
      a bare `SupabaseClient` with no `Database` generic, and the repo has no
      generated types file at all — so every one of the ~918 `.from(...)`
      call sites resolves to `any`, guarded only by eight hand-written
      `*Row` interfaces across ~44.6k lines. A renamed column compiles clean
      and fails in production. `check_schema_parity.py` catches
      spec-vs-storage drift; nothing catches storage-vs-handler drift. Fix:
      generate the types, switch to `createClient<Database>()`, and add the
      generation step to `scripts/rebuild_artifacts.sh` so they cannot go
      stale — the same "an artifact is only canonical if something goes red
      when it lies" rule the rest of the cascade already follows. Expect real
      drift to light up on the first compile.

- [ ] **Give the money path real transaction boundaries.** There is no
      `BEGIN`/`COMMIT` anywhere under `api/`. `runGate` in `api/transfers.ts`
      issues its history query, its `control_result` inserts, the resource
      status update and its alerts as independent PostgREST round trips, and
      card capture calls Blnk over HTTP *before* updating the row — a failure
      in that window leaves Blnk and Postgres disagreeing, with correctness
      resting entirely on `blnk-reconcile/sweeps.ts` catching it after the
      fact. The drift rate scales with concurrency, so this gets worse with
      growth rather than staying flat. The fix pattern is already in-tree and
      unused by `api/`: the aggregator pushes atomic operations into Postgres
      functions (`rpc("originate", ...)` in `aggregator/handler.ts`). Decide
      per money operation whether it becomes a stored procedure or moves to a
      direct Postgres connection with a real transaction. Doing the latter
      also collapses the per-request round trips — supabase-js speaks
      PostgREST over HTTP, so every DB call is a network hop (`api/cda.ts`
      awaits 64, `api/cash_ops.ts` 56), and request latency is round-trip
      count × network latency regardless of runtime. Related, worth auditing
      in the same pass: only 11 handlers call `claimIdempotency` against 415
      mutating operations in the spec — establish how much of that gap is
      deliberate before Blnk's at-least-once webhook delivery makes it
      matter.

- [ ] **Move long-running work off Edge Functions.** Deno isolates are
      request/response shaped, but `blnk-reconcile/sweeps.ts` and the drill
      runner are batch jobs wearing a request costume. This is the runtime's
      first real wall — ahead of any throughput limit, since a narrow bank's
      API volume is well within V8's range — and the fix is a container, not
      a language. No action needed until the sweeps start timing out or the
      drill outgrows its window; flagged here so the trigger is recognized
      when it arrives rather than diagnosed as "TypeScript is too slow."
