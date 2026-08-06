#!/usr/bin/env bash
# The ONE ordered rebuild of everything derived from the spec and the policies.
# CLAUDE.md documents this script and .github/workflows/extract-artifacts.yml
# runs it — the dependency order lives here and nowhere else, because order is
# exactly what breaks silently when maintained in two places by hand.
set -euo pipefail
cd "$(dirname "$0")/.."

python3 scripts/parse_core_api.py              # -> core-vocabulary.json
python3 scripts/extract_controls.py            # -> controls.json
# Re-stamp the spec's compliance annotations from the fresh catalogue (pure
# functions of controls.json; --resync clears only generated descriptions).
python3 core/core-api-loop/migrate/author_control_rules.py
python3 core/core-api-loop/migrate/derive_bound_controls.py
python3 core/core-api-loop/migrate/author_descriptions.py --resync
python3 scripts/build_control_vocabulary.py    # -> control-vocabulary.json
python3 scripts/extract_vocab.py .             # -> extracted-vocab.json
# Downstream derivations rebuild in the same run — crosswalk.json embeds
# controls.json's generated_at, and the staleness gates fail on any
# half-rebuilt state.
python3 scripts/build_crosswalk.py             # -> crosswalk.json + CROSSWALK.md
python3 scripts/build_dashboard.py             # -> compliance/dashboard
python3 scripts/build_choreography.py          # -> compliance/dashboard/choreography
python3 core/verifier/generator/enumerate.py   # -> core/verifier/targets.json + worklist.md
python3 scripts/gen_routes.py                  # -> api/routes.gen.ts
python3 scripts/gen_ui_contract.py             # -> ui allowlist + types
