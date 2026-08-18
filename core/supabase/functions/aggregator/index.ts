// aggregator — edge function entrypoint (D18/D19/D23). Card 51.
//
// Wiring only: every request behaviour lives in handler.ts so the tests can
// exercise it without starting a server (the card-18 sweeps.ts precedent).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleAggregator } from "./handler.ts";

Deno.serve(async (req: Request): Promise<Response> => {
  const requestId = `req_${crypto.randomUUID()}`;
  try {
    return await handleAggregator(req, {
      jwtSecret: Deno.env.get("AGGREGATOR_JWT_SECRET"),
      // CORE_SERVICE_ROLE_KEY first, matching api/lib.ts createDb(). This
      // project has migrated to the publishable/secret key scheme, which
      // disables the legacy service_role JWT that SUPABASE_SERVICE_ROLE_KEY
      // still holds — so reading only that one made every DB-backed route
      // here 500 (/health, /fbo, /consumers/*/run) while the api function,
      // which already had this fallback, kept working. Same resolution in
      // both places, or the next key rotation splits them again.
      db: createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("CORE_SERVICE_ROLE_KEY") ||
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        { auth: { persistSession: false } },
      ),
    }, requestId);
  } catch (e) {
    console.error(`[${requestId}] aggregator error: ${e}`);
    return new Response(
      JSON.stringify({ status: 500, type: "internal_error", request_id: requestId }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
});
