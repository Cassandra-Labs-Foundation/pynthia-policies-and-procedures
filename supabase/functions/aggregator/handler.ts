// aggregator — request handling for the cross-fintech layer (D18/D19/D23).
// Card 51.
//
// Split from index.ts for the same reason card 18 extracted sweeps.ts: logic
// behind Deno.serve cannot be imported by a test without binding a port.
//
// SCOPE: this is the authentication BOUNDARY only, plus the one endpoint
// needed to exercise it (event ingest, per D4/D21 — instances push their
// outbox here). It is not the full aggregator: the Payment Hub, BSA Approver,
// BSA Reporter and 5300 Reporter consumers (D27) are separate cards, as is
// cross-fintech search (card 54). What exists here is the thing card 51
// actually asserts — that a partner key is rejected at the aggregator.
//
// Auth: instance JWT (D19). Deliberately NOT the partner token table; see
// auth.ts for why that is a class distinction rather than a scope one.

import { looksLikePartnerToken, verifyInstanceJwt } from "./auth.ts";

const API_VERSION = "4.0.0";

function jsonResponse(body: unknown, status: number, requestId: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "X-Request-Id": requestId,
      "X-API-Version": API_VERSION,
    },
  });
}

function apiError(
  status: number,
  type: string,
  requestId: string,
  title: string,
  detail: string,
): Response {
  return jsonResponse({
    status,
    type,
    title,
    detail,
    doc_url: `https://api.cassandra.bank/docs/errors/${type.replace(/_/g, "-")}`,
    request_id: requestId,
  }, status, requestId);
}

function extractBearer(req: Request): string | null {
  const authz = req.headers.get("Authorization");
  if (authz) {
    const m = authz.match(/^Bearer\s+(.+)$/i);
    if (m) return m[1].trim();
  }
  // X-Api-Key is how a partner integration would mistakenly reach for this,
  // so it is read purely to be refused with a useful message below.
  return req.headers.get("X-Api-Key");
}

export async function handleAggregator(
  req: Request,
  deps: {
    jwtSecret: string | undefined;
    // deno-lint-ignore no-explicit-any
    db: any;
    now?: number;
  },
  requestId: string,
): Promise<Response> {
  const token = extractBearer(req);
  if (!token) {
    return apiError(
      401,
      "unauthorized",
      requestId,
      "Unauthorized",
      "an instance JWT is required",
    );
  }

  // Card 51's headline assertion, and deliberately the FIRST thing checked —
  // ahead of both the config check and signature verification. A partner token
  // is refused here as a matter of credential class, so the answer must not
  // depend on the aggregator's own configuration: were the JWT secret unset, a
  // partner would otherwise receive a 500 that both hints at server internals
  // and obscures the real reason their key does not work.
  if (looksLikePartnerToken(token)) {
    return apiError(
      403,
      "partner_token_not_valid_here",
      requestId,
      "Partner Token Not Valid Here",
      "partner tokens are confined to their own instance and are never accepted at the aggregator (D23); " +
        "instances authenticate with a short-lived instance JWT (D19)",
    );
  }

  if (!deps.jwtSecret) {
    return apiError(
      500,
      "misconfigured",
      requestId,
      "Misconfigured",
      "server misconfigured: AGGREGATOR_JWT_SECRET unset",
    );
  }

  const verified = await verifyInstanceJwt(token, deps.jwtSecret, deps.now);
  if (!verified.ok) {
    return apiError(
      401,
      "unauthorized",
      requestId,
      "Unauthorized",
      "instance JWT rejected",
    );
  }

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] === "aggregator") parts.shift();
  const path = "/" + parts.join("/");

  if (req.method === "POST" && /^\/events\/ingest\/?$/.test(path)) {
    return await ingestEvents(req, deps.db, verified.claims.instance_id, requestId);
  }

  return apiError(404, "not_found", requestId, "Not Found", `no aggregator route for ${path}`);
}

/**
 * POST /events/ingest — an instance pushes outbox events (D4/D21).
 *
 * The stored `instance_id` comes from the VERIFIED JWT CLAIMS, never from the
 * request body. Trusting a body field would let any instance holding a valid
 * token write events attributed to another instance, which is exactly the
 * cross-fintech contamination D23 exists to prevent.
 */
async function ingestEvents(
  req: Request,
  // deno-lint-ignore no-explicit-any
  db: any,
  instanceId: string,
  requestId: string,
): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError(400, "validation_error", requestId, "Validation Error", "body must be JSON");
  }

  const events = (body as { events?: unknown })?.events;
  if (!Array.isArray(events) || events.length === 0) {
    return apiError(
      400,
      "validation_error",
      requestId,
      "Validation Error",
      "events must be a non-empty array",
    );
  }

  const rows = events.map((e) => {
    const ev = e as Record<string, unknown>;
    return {
      event_id: ev.id,
      instance_id: instanceId, // from the token, never the body
      code: ev.code,
      resource_id: ev.resource_id,
      entity_hash: ev.entity_hash ?? null,
      payload: ev.payload ?? {},
    };
  });

  if (rows.some((r) => typeof r.event_id !== "string" || !r.event_id)) {
    return apiError(
      400,
      "validation_error",
      requestId,
      "Validation Error",
      "every event requires a string id",
    );
  }

  // D4: dedup at the aggregator via the event_id unique constraint. At-least-
  // once delivery from the instance outbox means redelivery is normal, not
  // exceptional, so a repeat is a no-op rather than an error.
  const { error } = await db.schema("aggregator").from("event")
    .upsert(rows, { onConflict: "event_id", ignoreDuplicates: true });
  if (error) {
    console.error(`[${requestId}] ingest failed: ${error.message}`);
    return apiError(500, "internal_error", requestId, "Internal Error", "ingest failed");
  }

  return jsonResponse({ ingested: rows.length, instance_id: instanceId }, 200, requestId);
}
