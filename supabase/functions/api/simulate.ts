// Cards 35 / 38 / 44 — the /sandbox/simulate/* surface for the three
// money-movement rails.
//
// DESIGN: simulation is ROUTING, not a second implementation.
//
// Card 09 established the pattern with two card routes that alias the real
// handlers; this fills in the rest of the table the same way. Every simulate
// route dispatches to the production writer, which means a simulated ACH return
// takes the identical path a real one does: same runGate call sites, same
// control_result rows, same bookkeeping/event evidence, same Blnk inflight
// commit or void. There is no branch anywhere in the rails that asks "is this a
// simulation?" — that branch is the whole reason simulation harnesses stop
// being evidence of anything.
//
// What is NOT here, deliberately:
//
//   * A unified lifecycle vocabulary. ACH returns, wires reject, cards expire.
//     Normalising those into one enum would have to map, say, 'reversed' onto
//     'returned' — and the rails already do not share id types or status
//     vocabularies. Every previous attempt to treat them as one shape has
//     produced a bug (the .neq() cross-rail cast that took down book transfers,
//     the velocity sweep that missed card's status names). The dispatcher is
//     shared; the semantics stay in ach.ts / wires.ts / cards.ts.
//
//   * Re-running runGate on lifecycle transitions. The gate authorises money
//     ENTERING a rail and its CG-VEL-01 aggregate already counts rows in
//     'settled' / 'captured' / 'completed' status. Gating again at settle would
//     count the same dollars twice and spuriously trip the daily cap. The gate
//     fires exactly where production fires it: prepare / submit / authorize.

import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { type BlnkConfig } from "../_shared/blnk.ts";
import { apiError } from "./lib.ts";
import { type PartnerContext } from "./auth.ts";
import { postAch, postAchNoc, postAchReturn, postAchSettle } from "./ach.ts";
import { postCardAuthorize, postCardCapture, postCardExpire, postCardReverse } from "./cards.ts";
import {
  postWireCancel,
  postWireConfirm,
  postWirePrepare,
  postWireReject,
  postWireReturn,
  postWireReturnResolve,
} from "./wires.ts";

/** A simulate route: the real handler it aliases, and whether it takes an id. */
interface SimRoute {
  pattern: RegExp;
  /** the production endpoint this is an alias OF — surfaced in the 501 index */
  aliases: string;
  handler: (
    req: Request,
    id: string,
    db: SupabaseClient,
    cfg: BlnkConfig,
    requestId: string,
    ctx: PartnerContext,
  ) => Promise<Response>;
}

/**
 * The alias table. Ordered longest-path-first within each rail so that
 * `/ach/{id}/return` cannot be shadowed by a broader pattern — the same
 * ordering hazard the wire return/resolve routes carry in index.ts.
 */
const SIM_ROUTES: SimRoute[] = [
  // ---- ACH (card 35): submit -> settle | return | noc
  {
    pattern: /^\/ach\/?$/,
    aliases: "POST /payments/ach",
    handler: (req, _id, db, cfg, rid, ctx) => postAch(req, db, cfg, rid, ctx),
  },
  {
    pattern: /^\/ach\/([^/]+)\/settle\/?$/,
    aliases: "POST /payments/ach/{id}/settle",
    handler: (req, id, db, cfg, rid, ctx) => postAchSettle(req, id, db, cfg, rid, ctx),
  },
  {
    pattern: /^\/ach\/([^/]+)\/return\/?$/,
    aliases: "POST /payments/ach/{id}/return",
    handler: (req, id, db, cfg, rid, ctx) => postAchReturn(req, id, db, cfg, rid, ctx),
  },
  {
    pattern: /^\/ach\/([^/]+)\/noc\/?$/,
    aliases: "POST /payments/ach/{id}/noc",
    // no cfg: a NOC touches no ledger. Signature kept uniform so the table
    // stays one shape; the unused arg is dropped at the call.
    handler: (req, id, db, _cfg, rid, ctx) => postAchNoc(req, id, db, rid, ctx),
  },

  // ---- Wire (card 38): prepare -> confirm | cancel | reject; then return
  {
    pattern: /^\/wire\/prepare\/?$/,
    aliases: "POST /payments/wire/prepare",
    handler: (req, _id, db, cfg, rid, ctx) => postWirePrepare(req, db, cfg, rid, ctx),
  },
  {
    pattern: /^\/wire\/([^/]+)\/confirm\/?$/,
    aliases: "POST /payments/wire/{id}/confirm",
    handler: (req, id, db, cfg, rid, ctx) => postWireConfirm(req, id, db, cfg, rid, ctx),
  },
  {
    pattern: /^\/wire\/([^/]+)\/cancel\/?$/,
    aliases: "POST /payments/wire/{id}/cancel",
    handler: (req, id, db, cfg, rid, ctx) => postWireCancel(req, id, db, cfg, rid, ctx),
  },
  {
    pattern: /^\/wire\/([^/]+)\/reject\/?$/,
    aliases: "POST /payments/wire/{id}/reject",
    handler: (req, id, db, cfg, rid, ctx) => postWireReject(req, id, db, cfg, rid, ctx),
  },
  {
    pattern: /^\/wire\/([^/]+)\/return\/resolve\/?$/,
    aliases: "POST /payments/wire/{id}/return/resolve",
    handler: (req, id, db, cfg, rid, ctx) => postWireReturnResolve(req, id, db, cfg, rid, ctx),
  },
  {
    pattern: /^\/wire\/([^/]+)\/return\/?$/,
    aliases: "POST /payments/wire/{id}/return",
    handler: (req, id, db, cfg, rid, ctx) => postWireReturn(req, id, db, cfg, rid, ctx),
  },

  // ---- Card (card 44): authorize -> capture* | reverse | expire
  {
    pattern: /^\/card\/authorize\/?$/,
    aliases: "POST /payments/card/authorize",
    handler: (req, _id, db, cfg, rid, ctx) => postCardAuthorize(req, db, cfg, rid, ctx),
  },
  {
    pattern: /^\/card\/([^/]+)\/capture\/?$/,
    aliases: "POST /payments/card/{id}/capture",
    handler: (req, id, db, cfg, rid, ctx) => postCardCapture(req, id, db, cfg, rid, ctx),
  },
  {
    // card 09 shipped this spelling and the e2e harness already calls it;
    // kept as an alias of capture so existing sims do not break.
    pattern: /^\/card\/([^/]+)\/settle\/?$/,
    aliases: "POST /payments/card/{id}/capture",
    handler: (req, id, db, cfg, rid, ctx) => postCardCapture(req, id, db, cfg, rid, ctx),
  },
  {
    pattern: /^\/card\/([^/]+)\/reverse\/?$/,
    aliases: "POST /payments/card/{id}/reverse",
    handler: (req, id, db, cfg, rid, ctx) => postCardReverse(req, id, db, cfg, rid, ctx),
  },
  {
    pattern: /^\/card\/([^/]+)\/expire\/?$/,
    aliases: "POST /payments/card/{id}/expire",
    handler: (req, id, db, cfg, rid, ctx) => postCardExpire(req, id, db, cfg, rid, ctx),
  },
];

/** Every simulate path, for the 501 body. Cheap and static; built once. */
const SIM_INDEX = SIM_ROUTES.map((r) => r.aliases);

/**
 * Dispatch `/sandbox/simulate/<rest>` to the production writer that owns it.
 *
 * `rest` is the path with the /sandbox/simulate prefix already stripped.
 * An unmatched path still yields the card-09 typed 501, but now carries the
 * routes that DO exist — a 501 that does not say what is available makes the
 * caller guess at spelling, which is how /card/{id}/settle got invented.
 */
export async function postSimulate(
  req: Request,
  rest: string,
  db: SupabaseClient,
  cfg: BlnkConfig,
  requestId: string,
  ctx: PartnerContext,
): Promise<Response> {
  const path = rest.startsWith("/") ? rest : `/${rest}`;

  for (const route of SIM_ROUTES) {
    const m = path.match(route.pattern);
    if (!m) continue;
    return await route.handler(req, m[1] ?? "", db, cfg, requestId, ctx);
  }

  // The available list rides in `detail` rather than a new envelope field: the
  // error shape (status/type/title/detail/doc_url/request_id) is one contract
  // shared by every endpoint, and widening it for one 501 would change the
  // response shape callers parse everywhere.
  return apiError(501, "not_implemented", requestId, {
    title: "Not Implemented",
    detail:
      `no simulation for ${path}; this rail's lifecycle is not simulated yet. ` +
      `Simulated: ${SIM_INDEX.join("; ")}`,
  });
}
