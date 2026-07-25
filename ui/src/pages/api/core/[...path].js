// The browser's only door to the banking core.
//
// Everything the UI reads goes through here so the API key stays server-side
// (see ../../../lib/coreApi.js). This handler deliberately does no mapping —
// it forwards an allowlisted read and returns the core API's own body, so a
// 400 from the core arrives at the client as that same 400 with its own error
// envelope intact, rather than as a 500 that hides which field was wrong.

import { CoreApiError, coreGet } from "../../../lib/coreApi";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ detail: "this proxy is read-only" });
  }

  const segments = Array.isArray(req.query.path) ? req.query.path : [req.query.path];
  const path = segments.join("/");

  // Parse from the raw URL rather than req.query: req.query has already merged
  // the catch-all `path` segments in among the real query params.
  const search = new URL(req.url, "http://localhost").searchParams;

  try {
    return res.status(200).json(await coreGet(path, search));
  } catch (e) {
    if (e instanceof CoreApiError) return res.status(e.status).json(e.body ?? { detail: e.message });
    console.error("core proxy failed:", e);
    return res.status(502).json({ detail: "could not reach the core API" });
  }
}
