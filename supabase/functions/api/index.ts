// api — demo BaaS API slice (Supabase Edge Function, Deno).
//
// Auth: X-Api-Key = DEMO_API_KEY (verify_jwt = false). See README.

import { blnkConfigFromEnv } from "../_shared/blnk.ts";
import {
  postAccountLock,
  postAccountTransition, getAccount, postAccount } from "./accounts.ts";
import { getTransfer, postTransfer } from "./transfers.ts";
import { postWireCancel, postWireConfirm, postWirePrepare, postWireReturn, postWireReturnResolve } from "./wires.ts";
import { getControlResults } from "./controls.ts";
import { getChangelog } from "./platform.ts";
import { postSandboxReset } from "./sandbox.ts";
import { getEntities, getEntity, postEntity, postEntityOwner, postEntityTransition } from "./entities.ts";
import { getAccountNumbers, postAccountNumber, postNumberTransition } from "./numbers.ts";
import { postVerification } from "./kyc.ts";
import { postAch, postAchReturn, postAchSettle } from "./ach.ts";
import { postCardAuthorize, postCardCapture, postCardReverse } from "./cards.ts";
import {
  apiError,
  createDb,
  createRequestId,
  internalErrorResponse,
  methodNotAllowedResponse,
  misconfiguredResponse,
  notFoundResponse,
  timingSafeEqual,
  unauthorizedResponse,
} from "./lib.ts";

type RouteHandler = (
  req: Request,
  params: Record<string, string>,
  requestId: string,
) => Promise<Response>;

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

function stripFunctionPrefix(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "api") parts.shift();
  return "/" + parts.join("/");
}

const routes: Route[] = [
  {
    method: "POST",
    pattern: /^\/accounts\/?$/,
    paramNames: [],
    handler: async (req, _params, requestId) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postAccount(req, db, cfg, requestId);
    },
  },
  {
    method: "GET",
    pattern: /^\/accounts\/([^/]+)\/?$/,
    paramNames: ["id"],
    handler: async (_req, params, requestId) => {
      const db = createDb();
      return await getAccount(params.id, db, requestId);
    },
  },
  {
    method: "POST",
    pattern: /^\/transfers\/?$/,
    paramNames: [],
    handler: async (req, _params, requestId) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postTransfer(req, db, cfg, requestId);
    },
  },
  {
    method: "POST",
    pattern: /^\/sandbox\/reset\/?$/,
    paramNames: [],
    handler: async (req, _params, requestId) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postSandboxReset(req, db, cfg, requestId);
    },
  },
  // Card 09: /sandbox/simulate/* — the spec's simulation surface. The card
  // rail is live, so its simulate routes ALIAS the real handlers; everything
  // else under simulate/ is an explicit typed 501 until its phase fills it.
  {
    method: "POST",
    pattern: /^\/sandbox\/simulate\/card\/authorize\/?$/,
    paramNames: [],
    handler: async (req, _params, requestId) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postCardAuthorize(req, db, cfg, requestId);
    },
  },
  {
    method: "POST",
    pattern: /^\/sandbox\/simulate\/card\/([^/]+)\/settle\/?$/,
    paramNames: ["id"],
    handler: async (req, params, requestId) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postCardCapture(req, params.id, db, cfg, requestId);
    },
  },
  {
    method: "POST",
    pattern: /^\/sandbox\/simulate\/(?:.+)$/,
    paramNames: [],
    handler: (_req, _params, requestId) =>
      Promise.resolve(apiError(501, "not_implemented", requestId, {
        title: "Not Implemented",
        detail: "simulation stub; filled in a later phase",
      })),
  },
  {
    method: "POST",
    pattern: /^\/entities\/?$/,
    paramNames: [],
    handler: async (req, _params, requestId) => await postEntity(req, createDb(), requestId),
  },
  {
    method: "GET",
    pattern: /^\/entities\/?$/,
    paramNames: [],
    handler: async (req, _params, requestId) => await getEntities(req, createDb(), requestId),
  },
  {
    method: "POST",
    pattern: /^\/entities\/([^/]+)\/verifications\/?$/,
    paramNames: ["id"],
    handler: async (req, params, requestId) => await postVerification(req, params.id, createDb(), requestId),
  },
  {
    method: "POST",
    pattern: /^\/entities\/([^/]+)\/transition\/?$/,
    paramNames: ["id"],
    handler: async (req, params, requestId) => await postEntityTransition(req, params.id, createDb(), requestId),
  },
  {
    method: "POST",
    pattern: /^\/entities\/([^/]+)\/owners\/?$/,
    paramNames: ["id"],
    handler: async (req, params, requestId) => await postEntityOwner(req, params.id, createDb(), requestId),
  },
  {
    method: "GET",
    pattern: /^\/entities\/([^/]+)\/?$/,
    paramNames: ["id"],
    handler: async (_req, params, requestId) => await getEntity(params.id, createDb(), requestId),
  },
  {
    method: "POST",
    pattern: /^\/accounts\/([^/]+)\/numbers\/?$/,
    paramNames: ["id"],
    handler: async (req, params, requestId) => await postAccountNumber(req, params.id, createDb(), requestId),
  },
  {
    method: "GET",
    pattern: /^\/accounts\/([^/]+)\/numbers\/?$/,
    paramNames: ["id"],
    handler: async (_req, params, requestId) => await getAccountNumbers(params.id, createDb(), requestId),
  },
  {
    method: "POST",
    pattern: /^\/accounts\/([^/]+)\/lock\/?$/,
    paramNames: ["id"],
    handler: async (req, params, requestId) => await postAccountLock(req, params.id, createDb(), requestId),
  },
  {
    method: "POST",
    pattern: /^\/accounts\/([^/]+)\/transition\/?$/,
    paramNames: ["id"],
    handler: async (req, params, requestId) => await postAccountTransition(req, params.id, createDb(), requestId),
  },
  {
    method: "POST",
    pattern: /^\/account-numbers\/([^/]+)\/transition\/?$/,
    paramNames: ["id"],
    handler: async (req, params, requestId) => await postNumberTransition(req, params.id, createDb(), requestId),
  },
  {
    method: "GET",
    pattern: /^\/changelog\/?$/,
    paramNames: [],
    handler: (_req, _params, requestId) => Promise.resolve(getChangelog(requestId)),
  },
  {
    method: "GET",
    pattern: /^\/control-results\/?$/,
    paramNames: [],
    handler: async (req, _params, requestId) => {
      const db = createDb();
      return await getControlResults(req, db, requestId);
    },
  },
  {
    method: "GET",
    pattern: /^\/transfers\/([^/]+)\/?$/,
    paramNames: ["id"],
    handler: async (_req, params, requestId) => {
      const db = createDb();
      return await getTransfer(params.id, db, requestId);
    },
  },
  {
    method: "POST",
    pattern: /^\/payments\/ach\/?$/,
    paramNames: [],
    handler: async (req, _params, requestId) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postAch(req, db, cfg, requestId);
    },
  },
  {
    method: "POST",
    pattern: /^\/payments\/ach\/([^/]+)\/settle\/?$/,
    paramNames: ["id"],
    handler: async (req, params, requestId) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postAchSettle(req, params.id, db, cfg, requestId);
    },
  },
  {
    method: "POST",
    pattern: /^\/payments\/ach\/([^/]+)\/return\/?$/,
    paramNames: ["id"],
    handler: async (req, params, requestId) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postAchReturn(req, params.id, db, cfg, requestId);
    },
  },
  {
    method: "POST",
    pattern: /^\/payments\/card\/authorize\/?$/,
    paramNames: [],
    handler: async (req, _params, requestId) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postCardAuthorize(req, db, cfg, requestId);
    },
  },
  {
    method: "POST",
    pattern: /^\/payments\/card\/([^/]+)\/capture\/?$/,
    paramNames: ["id"],
    handler: async (req, params, requestId) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postCardCapture(req, params.id, db, cfg, requestId);
    },
  },
  {
    method: "POST",
    pattern: /^\/payments\/card\/([^/]+)\/reverse\/?$/,
    paramNames: ["id"],
    handler: async (req, params, requestId) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postCardReverse(req, params.id, db, cfg, requestId);
    },
  },
  {
    method: "POST",
    pattern: /^\/payments\/wire\/prepare\/?$/,
    paramNames: [],
    handler: async (req, _params, requestId) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postWirePrepare(req, db, cfg, requestId);
    },
  },
  {
    method: "POST",
    pattern: /^\/payments\/wire\/([^/]+)\/confirm\/?$/,
    paramNames: ["id"],
    handler: async (req, params, requestId) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postWireConfirm(req, params.id, db, cfg, requestId);
    },
  },
  {
    method: "POST",
    pattern: /^\/payments\/wire\/([^/]+)\/cancel\/?$/,
    paramNames: ["id"],
    handler: async (req, params, requestId) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postWireCancel(req, params.id, db, cfg, requestId);
    },
  },
  // return/resolve must precede the bare return pattern nowhere — distinct
  // suffixes, order-independent; both listed explicitly for clarity.
  {
    method: "POST",
    pattern: /^\/payments\/wire\/([^/]+)\/return\/resolve\/?$/,
    paramNames: ["id"],
    handler: async (req, params, requestId) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postWireReturnResolve(req, params.id, db, cfg, requestId);
    },
  },
  {
    method: "POST",
    pattern: /^\/payments\/wire\/([^/]+)\/return\/?$/,
    paramNames: ["id"],
    handler: async (req, params, requestId) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postWireReturn(req, params.id, db, cfg, requestId);
    },
  },
];

function matchRoute(path: string, method: string): { route: Route; params: Record<string, string> } | "not_found" | "method_not_allowed" {
  // Keep scanning past a path match with the wrong method: one pattern can
  // legitimately serve several methods from separate routes (POST /entities
  // creates, GET /entities lists). Breaking on the first path match made every
  // later same-pattern route unreachable — surfaced as a 405 on GET /entities.
  let sawPathMatch = false;
  for (const route of routes) {
    const m = path.match(route.pattern);
    if (!m) continue;
    sawPathMatch = true;
    if (route.method !== method) continue;
    const params: Record<string, string> = {};
    route.paramNames.forEach((name, i) => {
      params[name] = m[i + 1];
    });
    return { route, params };
  }
  return sawPathMatch ? "method_not_allowed" : "not_found";
}

Deno.serve(async (req: Request): Promise<Response> => {
  const requestId = createRequestId();

  const demoKey = Deno.env.get("DEMO_API_KEY");
  if (!demoKey) {
    return misconfiguredResponse(requestId, "server misconfigured: DEMO_API_KEY unset");
  }

  const apiKey = req.headers.get("X-Api-Key");
  if (!apiKey || !(await timingSafeEqual(apiKey, demoKey))) {
    return unauthorizedResponse(requestId);
  }

  const url = new URL(req.url);
  const path = stripFunctionPrefix(url.pathname);
  const matched = matchRoute(path, req.method);

  if (matched === "not_found") {
    return notFoundResponse(requestId, "route", path);
  }
  if (matched === "method_not_allowed") {
    return methodNotAllowedResponse(requestId);
  }

  try {
    return await matched.route.handler(req, matched.params, requestId);
  } catch (e) {
    return internalErrorResponse(requestId, e);
  }
});
