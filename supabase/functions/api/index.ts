// api — demo BaaS API slice (Supabase Edge Function, Deno).
//
// Auth: X-Api-Key = DEMO_API_KEY (verify_jwt = false). See README.

import { blnkConfigFromEnv } from "../_shared/blnk.ts";
import { getAccount, postAccount } from "./accounts.ts";
import { getTransfer, postTransfer } from "./transfers.ts";
import { postWireCancel, postWireConfirm, postWirePrepare } from "./wires.ts";
import { postAch, postAchReturn, postAchSettle } from "./ach.ts";
import { postCardAuthorize, postCardCapture, postCardReverse } from "./cards.ts";
import {
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
];

function matchRoute(path: string, method: string): { route: Route; params: Record<string, string> } | "not_found" | "method_not_allowed" {
  let pathMatch: Route | null = null;
  let pathParams: Record<string, string> = {};

  for (const route of routes) {
    const m = path.match(route.pattern);
    if (!m) continue;
    pathMatch = route;
    pathParams = {};
    route.paramNames.forEach((name, i) => {
      pathParams[name] = m[i + 1];
    });
    break;
  }

  if (!pathMatch) return "not_found";

  if (pathMatch.method !== method) return "method_not_allowed";
  return { route: pathMatch, params: pathParams };
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
