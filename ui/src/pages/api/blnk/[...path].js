// The browser's only door to the Blnk ledger.
//
// Mirrors pages/api/core/[...path].js deliberately — same shape, same rules —
// because a second door with different habits is how one of them ends up
// looser than the other. GET only, allowlisted paths, and the upstream error
// body is passed through intact so a 503 with "keys unset" stays diagnosable
// instead of arriving as an opaque 500.

import { BlnkApiError, blnkGet } from "../../../lib/blnkApi";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ detail: "this proxy is read-only" });
  }

  const segments = Array.isArray(req.query.path) ? req.query.path : [req.query.path];
  const path = segments.join("/");

  // From the raw URL, not req.query: req.query has already merged the catch-all
  // `path` segments in among the real query params.
  const search = new URL(req.url, "http://localhost").searchParams;

  try {
    return res.status(200).json(await blnkGet(path, search));
  } catch (e) {
    if (e instanceof BlnkApiError) return res.status(e.status).json(e.body ?? { detail: e.message });
    console.error("blnk proxy failed:", e);
    return res.status(502).json({ detail: "could not reach the Blnk ledger" });
  }
}
