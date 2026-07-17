#!/usr/bin/env bash
# Launch DuckDB attached read-only to the core Supabase project (architecture
# D18/D25: instance analytics layer). Requires SUPABASE_DB_URL in .env.local —
# use the SESSION pooler URI (port 5432), not the transaction pooler.
#
#   ./analytics/duck.sh                 # interactive shell, views ready
#   ./analytics/duck.sh -f query.sql    # run a script and exit
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f .env.local ]; then set -a; source .env.local; set +a; fi
: "${SUPABASE_DB_URL:?SUPABASE_DB_URL not set — add the session-pooler URI to .env.local}"

exec duckdb analytics/core.duckdb \
  -cmd "INSTALL postgres; LOAD postgres; INSTALL json; LOAD json;" \
  -cmd "ATTACH IF NOT EXISTS '${SUPABASE_DB_URL}' AS pg (TYPE postgres, READ_ONLY);" \
  -cmd ".read analytics/views.sql" \
  "$@"
