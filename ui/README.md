# ui/ — the staff console

A Next.js (Pages Router) console for credit-union staff — teller, member
services, accounting, compliance, approvals, the 5300 call report. It reads
**live core data** through a read-only server-side proxy; the mock layer
remains only where the core itself has nothing to serve (see
`src/lib/mock.js`, which documents why each mock survives).

## The contract comes from the spec

This is the one rule that matters here, and it lives in the repo root's
`CLAUDE.md` ("UI-reachable surface"): the UI may only call operations marked
`x-ui-surface: true` in `core/core-api.yaml`. Two files enforce it and both
are **generated — never hand-edit them**:

| file | what it is |
|---|---|
| `src/lib/coreApi.allowlist.json` | the proxy's allowlist of spec paths |
| `src/lib/core-api-types.d.ts` | the wire types of those operations |

To reach a new endpoint from the UI: mark the operation `x-ui-surface: true`
(plus its query parameters) in the spec, then

```bash
python3 scripts/gen_ui_contract.py
```

CI (`.github/workflows/ui-ci.yml`) runs `gen_ui_contract.py --check`, lint,
and the build on any change to `ui/`, the spec, or the generator — so a spec
change that breaks a screen fails in the same PR instead of in production.

## How data flows

```
page/component
  └─ src/lib/useLiveCore.js        fetch hook (loading / error / data)
       └─ src/lib/coreApi.js       client for the proxy
            └─ src/pages/api/core/[...path].js    server-side, read-only:
                                   GET only, allowlist-checked, adds the
                                   core API key (never shipped to browser)
            └─ src/pages/api/blnk/[...path].js    same pattern, Blnk ledger
```

`src/components/live/Live.jsx` is the wrapper that renders live-vs-fallback
states consistently.

## Layout (actual)

```
src/
  pages/            flat .jsx routes: index, teller, member-services,
                    accounting, administrator, approvals, compliance,
                    call-report, reports; accounts/ and members/ for detail
                    pages; api/ for the two proxies
  components/       layout/, dashboard/, teller/, accounting/, live/
  lib/              coreApi.js, useLiveCore.js, blnkApi.js, gl.js,
                    ledgerTree.js, ncua5300.js (5300 mapping — reads its
                    sourcing rules in the header comment), mock.js
```

Stack: Next.js 15.5, React 19, Tailwind 4, lucide-react.

```bash
cd ui && npm install && npm run dev
```

## Product research

The vendor benchmark (CU*Answers / Sharetec / Fiserv) and the feature ideas
harvested from their demos moved to [product-research.md](product-research.md).
They are product context, not a description of this codebase.
