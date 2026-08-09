# Working in this repo

## API changes start with the OpenAPI spec — always

`core/core-api.yaml` is the canonical reference for the whole system. The
router, the compliance vocabulary, the verifier's targets, and the UI's
contract are all **derived from it**, and CI gates fail when any of them
drift. Whether you are working on the core or the UI, do not add or change
an endpoint, field, or event by editing the implementation first — declare
it in the spec, regenerate, then implement.

### The workflow per change type

**New/changed endpoint** → add the operation under `paths:` with
`x-handler: "module.function"`, `x-tier`, `x-audience`
(`partner | internal | public`), and `x-actors` if route-gated. Then:

```bash
python3 scripts/gen_routes.py        # -> api/routes.gen.ts (the route table)
```

Write the handler with the standard signature
`(req, [pathParams...], db, requestId, ctx)`. Handlers needing bespoke wiring
(Blnk config, non-standard args) get `x-route: hand` and a hand-written entry
in `api/index.ts`. Every non-partner route must either declare `x-actors` or
self-gate with `requireInternalActor` (404 semantics) —
`route_gating.test.ts` enforces this, and pins the unauthenticated set.

**New/changed field** → add it to the schema in `components/schemas` (use
`x-column` if the wire name differs from the storage column). The
schema-parity gate stays red until a migration exists:
`python3 scripts/check_schema_parity.py` (ratchet vs
`schema-parity-baseline.json` — shrink it, never grow it by hand).

**New event code** → register it in `x-events` (subject + canonical verb
from `x-event-types`) *before* the core emits it —
`scripts/check_emitted_coverage.py` fails otherwise. Emit codes in canonical
dotted spelling (`scripts/code_format.py` is the grammar).

**UI-reachable surface** → mark the GET operation `x-ui-surface: true`
(+ its query parameters), then `python3 scripts/gen_ui_contract.py`
regenerates the proxy allowlist and TS types. Never widen
`ui/src/lib/coreApi.allowlist.json` by hand — it is generated.

**Unimplemented design ideas** → `x-proposed-paths`, never `paths:`.
`scripts/check_route_parity.py` fails on any operation with no route and any
route with no operation.

### After any spec change, regenerate the cascade

```bash
./scripts/rebuild_artifacts.sh
```

The dependency order lives in that one script;
`.github/workflows/extract-artifacts.yml` runs the same file in CI
(auto-commits on main; PRs rebuild + gate without committing).

The cascade ends with the documentation pair: `gen_state.py` regenerates
`STATE.md` (the one page of live numbers — link to it instead of embedding
counts in prose), and `check_doc_claims.py` **fails the build** when a
hand-written doc references a path that doesn't exist or a number that
disagrees with the artifacts. If it goes red after your change, fix the doc
it names — never by loosening the checker.

### Why this rule exists

In July 2026 the spec's paths described 119 endpoints that didn't exist while
345 running routes were invisible to it, a floor-control file pointed at
renamed control ids for a month, and the core emitted 41 event codes the
vocabulary had never heard of — because each artifact drifted wherever it had
no consumer that failed. The gates encode the lesson: **an artifact is only
canonical if something goes red when it lies.** Don't bypass a red gate by
editing a generated file or growing a baseline; fix the spec or the
implementation until they agree.

### One standing exception

Pynthia is a narrow bank: **lending is deliberately unrouted**
(`lending.ts`, `lending_underwriting.ts`, `collections.ts`, the
`/fair-lending` application handlers). Their handlers and drill coverage
stay, but do not route them or add their operations to `paths:` without an
explicit product decision — the exclusion is documented in `api/index.ts` and
the emitted-events inventory.
