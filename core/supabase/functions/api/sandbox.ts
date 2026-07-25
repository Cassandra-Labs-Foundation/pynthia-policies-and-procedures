// Card 08: sandbox reset — the one deliberately destructive endpoint.
import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { type BlnkConfig, voidInflight } from "../_shared/blnk.ts";
import { internalErrorResponse, jsonResponse, parseJsonBody, validationError } from "./lib.ts";

// Rows that still hold member funds in Blnk inflight; their holds must be
// voided BEFORE the truncate or the ids needed to release them are gone and
// the money strands (the conservation sweep's residue lesson, applied here).
const OPEN_HOLDS: { table: string; idCol: string; statuses: string[] }[] = [
  { table: "wire_transfer", idCol: "blnk_transaction_id", statuses: ["submitted"] },
  { table: "ach_transfer", idCol: "blnk_transaction_id", statuses: ["submitted"] },
  { table: "card_authorization", idCol: "blnk_inflight_id", statuses: ["authorized", "partially_captured"] },
];

/**
 * POST /sandbox/reset {confirm: "RESET"} — wipe the instance's mutable state.
 * Blnk ledger HISTORY survives (Cloud has no wipe API); holds are released so
 * no member funds stay stranded, and fresh runs mint fresh accounts.
 */
export async function postSandboxReset(
  req: Request,
  db: SupabaseClient,
  cfg: BlnkConfig,
  requestId: string,
): Promise<Response> {
  const body = await parseJsonBody(req).catch(() => null);
  const confirm = body && typeof body === "object"
    ? (body as Record<string, unknown>).confirm
    : undefined;
  if (confirm !== "RESET") {
    return validationError(requestId, [{
      type: "invalid_value",
      field: "confirm",
      message: 'destructive; pass {"confirm": "RESET"} exactly',
    }]);
  }

  let released = 0;
  let failed = 0;
  for (const spec of OPEN_HOLDS) {
    const { data, error } = await db.schema("core").from(spec.table)
      .select(`id, hold:${spec.idCol}`)
      .in("status", spec.statuses)
      .not(spec.idCol, "is", null);
    if (error) return internalErrorResponse(requestId, error);
    for (const row of (data ?? []) as unknown as { id: string; hold: string }[]) {
      try {
        await voidInflight(cfg, row.hold);
        released++;
      } catch (err) {
        failed++;
        console.error(`reset: failed to release hold ${row.hold} (${spec.table} ${row.id}): ${err}`);
      }
    }
  }

  const { error: rpcErr } = await db.schema("core").rpc("sandbox_reset");
  if (rpcErr) return internalErrorResponse(requestId, rpcErr);

  return jsonResponse({
    reset: true,
    released_holds: released,
    failed_releases: failed,
  }, 200, requestId);
}
