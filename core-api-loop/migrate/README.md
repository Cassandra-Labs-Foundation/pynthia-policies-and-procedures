# core-api.yaml → OpenAPI 3 migration

`core-api.yaml` is now a valid **OpenAPI 3** document (was a bespoke flat YAML). The conversion is
**lossless**: `scripts/parse_core_api.py` auto-detects the `openapi:` key and adapts the doc back
to the internal shape, so `core-vocabulary.json` — and therefore `controls.json` and every
policy's vocabulary reference — is byte-identical to the pre-migration output.

## Mapping
- each resource → `components/schemas/<Name>` (`x-kind`, `x-states`, `x-retention`, properties
  verbatim incl. `enum`/`$ref`/`format`)
- each flat-field prefix → `components/schemas/<prefix>` (`x-kind: vocabulary`; token `pfx.rest`
  → property `rest`)
- `event_types` / `task_types` → `x-event-types` / `x-task-types`; `state_machines` →
  `x-state-machines`; `endpoints` → `paths`; `meta` → `info` (+ `x-note` / `x-elements`)
- property `$ref` `#/schemas/X` ↔ `#/components/schemas/X`

## Tools
- `convert.py` — bespoke ↔ OpenAPI converter (`to_openapi` / `to_specdict`). Run against the
  bespoke source (pre-migration commit / git history).
- `verify_full.py` — the lossless proof: spec-dict round-trip + vocabulary identity + OpenAPI 3
  validity. Run against a bespoke source.
- The production adapter lives in `scripts/parse_core_api.py::openapi_to_spec` (self-contained,
  no dependency on this dir).

## Verified
- spec-dict round-trips identically; vocabulary identical (265 entities, 1683 fields, 1221 events,
  35 endpoints, 12 state machines); OpenAPI 3 validates (GitBook-renderable).
- Full pipeline runs off the OpenAPI source unchanged (control oracle 650, arch 56).

## Known follow-up (not done here)
- **`core-api-loop/propose.py` `apply_op`** does surgical text edits against the *bespoke* layout
  (`fields:` / nested `resources:`). On the OpenAPI file it safely **no-ops** (no crash), so the
  inner-loop autonomous *editor* is disabled until its applier is rewritten for OpenAPI (schema
  properties / paths). The inner-loop *scoring* and all read-path tooling are unaffected.
- GitBook: point a space at `core-api.yaml` (OpenAPI) to auto-render the API reference.
