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
      db: createClient(
        Deno.env.get("SUPABASE_URL")!,
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
