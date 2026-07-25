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

## Follow-ups
- **`core-api-loop/propose.py` `apply_op` — DONE.** Rewritten to edit the parsed OpenAPI document
  (load → modify → dump; the file is machine-generated, so the round-trip is byte-clean and diffs
  stay minimal). Ops map to the OpenAPI structure (fields → schema properties, resources →
  components/schemas, event/task types → x-extensions, endpoints → paths); `delete_resource`
  refuses to remove a still-`$ref`'d schema so the spec stays valid OpenAPI.
- **GitBook — DONE.** A space syncs the raw `core-api.yaml` URL (~every 6h) and renders the
  API reference.
