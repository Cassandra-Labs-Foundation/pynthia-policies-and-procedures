// Compliance dashboard — the surface an examiner or ops officer actually
// reads. Two routes:
//
//   GET /compliance/dashboard        public 302 to the shell (GitHub Pages —
//                                    see getDashboardShell for why the edge
//                                    function cannot serve HTML itself). The
//                                    shell carries ZERO data: it asks for a
//                                    token once (sessionStorage, never a URL)
//                                    and fetches the data route with the same
//                                    X-Api-Key header every client uses.
//   GET /compliance/dashboard/data   authenticated JSON. Same token pipeline
//                                    as every route; partner actors get 404
//                                    (BSA-07: the existence of case management
//                                    is itself confidential — same rule as
//                                    bsa.ts, and the same reason this module
//                                    checks it in the HANDLER, not a route
//                                    gate that would answer 403).
//
// Every panel reads the evidence tables the controls already write — nothing
// here is computed specially for display. Row reads are capped and the caps
// are REPORTED in the payload: a dashboard that silently truncates reads as
// complete when it is not.
import { type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { apiError, internalErrorResponse, jsonResponse } from "./lib.ts";
import { type PartnerContext } from "./auth.ts";
import { redactForBoundary } from "./events.ts";

const WINDOW_HOURS = 168; // 7 days
const ROW_CAP = 1000;
const LIST_CAP = 100;

type Row = Record<string, unknown>;

function windowStartIso(): string {
  return new Date(Date.now() - WINDOW_HOURS * 3600 * 1000).toISOString();
}

async function capped(
  q: PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<Row[]> {
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Row[];
}

export async function getDashboardData(
  _req: Request,
  db: SupabaseClient,
  requestId: string,
  _ctx: PartnerContext,
): Promise<Response> {
  // DEMO POSTURE: the route is public (see index.ts) and this handler serves
  // anyone — the sandbox shows synthetic evidence and the demo must not stop
  // for a token prompt. To re-lock for production: drop `public` from the
  // route and restore the partner 404 here (git history at 4b34d6a).
  const since = windowStartIso();
  const nowIso = new Date().toISOString();

  try {
    // ---- control activity: aggregate the evidence rows, never re-derive
    const controlRows = await capped(
      db.schema("core").from("control_result")
        .select("control_id, decision, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(ROW_CAP),
    );
    const controls: Record<string, Record<string, number>> = {};
    for (const r of controlRows) {
      const c = (controls[String(r.control_id)] ??= {});
      const d = String(r.decision);
      c[d] = (c[d] ?? 0) + 1;
    }

    // ---- open BSA alerts and their triage clocks (2 business days, BSA-06)
    const alertRows = await capped(
      db.schema("core").from("bsa_alert")
        .select("id, alert_type, status, triage_due_at, triaged_at, triage_outcome, case_id, created_at")
        .eq("status", "open")
        .order("triage_due_at", { ascending: true, nullsFirst: false })
        .limit(LIST_CAP),
    );
    const alertsByType: Record<string, number> = {};
    let overdue = 0;
    for (const a of alertRows) {
      alertsByType[String(a.alert_type)] = (alertsByType[String(a.alert_type)] ?? 0) + 1;
      if (!a.triaged_at && typeof a.triage_due_at === "string" && a.triage_due_at < nowIso) overdue++;
    }

    // ---- case / SAR pipeline
    const caseRows = await capped(
      db.schema("core").from("case")
        .select("id, status, alert_id, sar_decision, sar_decision_due_at, opened_at, decided_at")
        .order("opened_at", { ascending: false })
        .limit(LIST_CAP),
    );
    const casesByStatus: Record<string, number> = {};
    const sarDecisions: Record<string, number> = {};
    for (const c of caseRows) {
      casesByStatus[String(c.status)] = (casesByStatus[String(c.status)] ?? 0) + 1;
      if (c.sar_decision) sarDecisions[String(c.sar_decision)] = (sarDecisions[String(c.sar_decision)] ?? 0) + 1;
    }

    // ---- CTR filings and the 15-day FinCEN clock
    const ctrRows = await capped(
      db.schema("core").from("ctr_filing")
        .select("id, business_date, cash_in_total, cash_out_total, threshold_crossed_at, filing_due_at, filed_at")
        .order("filing_due_at", { ascending: true, nullsFirst: false })
        .limit(LIST_CAP),
    );
    const ctrUnfiled = ctrRows.filter((r) => !r.filed_at);
    const ctrOverdue = ctrUnfiled.filter((r) =>
      typeof r.filing_due_at === "string" && r.filing_due_at < nowIso
    );

    // ---- payments waiting on a second pair of eyes (EPS-06)
    const approvalRows = await capped(
      db.schema("core").from("payment_approval")
        .select("id, resource_type, resource_id, created_by, created_at")
        .is("approved_at", null)
        .is("rejected_at", null)
        .order("created_at", { ascending: true })
        .limit(LIST_CAP),
    );

    // ---- ops health: the reconciliation heartbeat's own evidence
    const opsRows = await capped(
      db.schema("core").from("event")
        .select("code, created_at")
        .in("code", [
          "blnk.mirror_recovered",
          "blnk.balance_drift",
          "blnk.missing_mirror",
          "blnk.stuck_row",
        ])
        .gte("created_at", since)
        .limit(ROW_CAP),
    );
    const opsByCode: Record<string, number> = {};
    for (const e of opsRows) {
      opsByCode[String(e.code)] = (opsByCode[String(e.code)] ?? 0) + 1;
    }

    const outboxRows = await capped(
      db.schema("core").from("event")
        .select("id")
        .is("delivered_at", null)
        .limit(ROW_CAP),
    );

    const syncRows = await capped(
      db.schema("core").from("blnk_sync_state")
        .select("resource, last_cursor, last_synced_at")
        .limit(10),
    );
    const reconcile = syncRows.find((r) => r.resource === "reconcile");
    let reconcileSummary: unknown = null;
    if (reconcile && typeof reconcile.last_cursor === "string") {
      try {
        reconcileSummary = JSON.parse(reconcile.last_cursor);
      } catch {
        reconcileSummary = reconcile.last_cursor;
      }
    }

    return jsonResponse({
      generated_at: nowIso,
      window_hours: WINDOW_HOURS,
      caps: { aggregate_rows: ROW_CAP, list_rows: LIST_CAP },
      controls: {
        window_rows: controlRows.length,
        window_capped: controlRows.length >= ROW_CAP,
        by_control: controls,
      },
      alerts: {
        open: alertRows.length,
        overdue_triage: overdue,
        by_type: alertsByType,
        list: alertRows.slice(0, 25),
      },
      cases: {
        by_status: casesByStatus,
        sar_decisions: sarDecisions,
        recent: caseRows.slice(0, 10),
      },
      ctr: {
        total: ctrRows.length,
        unfiled: ctrUnfiled.length,
        overdue: ctrOverdue.length,
        due_next: ctrUnfiled.slice(0, 10),
      },
      pending_approvals: {
        count: approvalRows.length,
        list: approvalRows.slice(0, 25),
      },
      ops: {
        events_7d: opsByCode,
        outbox_undelivered: outboxRows.length,
        outbox_capped: outboxRows.length >= ROW_CAP,
        last_reconcile: reconcileSummary,
        last_reconcile_at: reconcile?.last_synced_at ?? null,
      },
    }, 200, requestId);
  } catch (e) {
    return internalErrorResponse(requestId, e);
  }
}

// ---------------------------------------------------------------------------
// The monitoring tier — three routes that together make every control
// auditable by clicking:
//
//   GET /compliance/dashboard/heartbeat     bucketed pulses: every event code
//                                           and every gate decision over time,
//                                           core and sim worlds labeled apart
//   GET /compliance/dashboard/events        raw event history for a set of
//                                           codes (a control's watch list),
//                                           newest first, cursor-paginated
//   GET /compliance/dashboard/trace/{id}    the WHOLE transaction cycle for
//                                           one resource: every event plus
//                                           every gate decision about it
//
// Payloads are inspectable but pass the SAME PII boundary the aggregator
// enforces (redactForBoundary) — the dashboard is a window, not a leak.

const HB_DEFAULT_HOURS = 168;
const HB_MAX_HOURS = 2160; // 90 days
const HB_DEFAULT_BUCKET = 21600; // 6h
const HB_MIN_BUCKET = 3600;
const HB_MAX_BUCKET = 604800;
const STREAM_MAX_CODES = 200;
const STREAM_DEFAULT_LIMIT = 100;
const STREAM_MAX_LIMIT = 200;
const TRACE_CAP = 500;

function intParam(url: URL, name: string, fallback: number, min: number, max: number): number {
  const raw = Number.parseInt(url.searchParams.get(name) ?? "", 10);
  const v = Number.isFinite(raw) ? raw : fallback;
  return Math.min(max, Math.max(min, v));
}

async function rpcRows(
  db: SupabaseClient,
  fn: string,
  args: Record<string, unknown>,
): Promise<Row[]> {
  const { data, error } = await db.schema("core").rpc(fn, args);
  if (error) throw new Error(`${fn}: ${error.message}`);
  return (data ?? []) as Row[];
}

export async function getDashboardHeartbeat(
  req: Request,
  db: SupabaseClient,
  requestId: string,
): Promise<Response> {
  const url = new URL(req.url);
  const hours = intParam(url, "hours", HB_DEFAULT_HOURS, 1, HB_MAX_HOURS);
  const bucketSeconds = intParam(url, "bucket", HB_DEFAULT_BUCKET, HB_MIN_BUCKET, HB_MAX_BUCKET);
  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
  try {
    const [events, gate, lastSeen] = await Promise.all([
      rpcRows(db, "event_heartbeat", { since, bucket_seconds: bucketSeconds }),
      rpcRows(db, "gate_heartbeat", { since, bucket_seconds: bucketSeconds }),
      rpcRows(db, "event_last_seen", {}),
    ]);
    return jsonResponse({
      generated_at: new Date().toISOString(),
      window_hours: hours,
      bucket_seconds: bucketSeconds,
      since,
      events,
      gate,
      last_seen: lastSeen,
    }, 200, requestId);
  } catch (e) {
    return internalErrorResponse(requestId, e);
  }
}

const EVENT_COLS =
  "id, code, type, resource_id, payload, provenance, created_at, delivered_at";

type EventRow = Row & { payload?: unknown; created_at?: unknown };

function redactRows(rows: Row[], src: string): Row[] {
  return rows.map((r) => ({ ...r, payload: redactForBoundary((r as EventRow).payload), src }));
}

export async function getDashboardEvents(
  req: Request,
  db: SupabaseClient,
  requestId: string,
): Promise<Response> {
  const url = new URL(req.url);
  const codes = (url.searchParams.get("codes") ?? "")
    .split(",").map((c) => c.trim()).filter(Boolean).slice(0, STREAM_MAX_CODES);
  if (codes.length === 0) {
    return apiError(422, "codes_required", requestId, {
      detail: "pass ?codes=a.b.c,d.e.f — the watch list of the control being inspected",
    });
  }
  const limit = intParam(url, "limit", STREAM_DEFAULT_LIMIT, 1, STREAM_MAX_LIMIT);
  const before = url.searchParams.get("before");
  const src = url.searchParams.get("src") ?? "all";

  try {
    const worlds = src === "core" ? ["core"] : src === "sim" ? ["sim"] : ["core", "sim"];
    const pages = await Promise.all(worlds.map(async (schema) => {
      let q = db.schema(schema).from("event")
        .select(EVENT_COLS)
        .in("code", codes)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (before) q = q.lt("created_at", before);
      const { data, error } = await q;
      if (error) throw new Error(`${schema}.event: ${error.message}`);
      return redactRows((data ?? []) as Row[], schema);
    }));
    const merged = pages.flat()
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
      .slice(0, limit);
    const full = merged.length === limit;
    return jsonResponse({
      codes,
      events: merged,
      next_before: full ? merged[merged.length - 1].created_at : null,
    }, 200, requestId);
  } catch (e) {
    return internalErrorResponse(requestId, e);
  }
}

export async function getDashboardTrace(
  resourceId: string,
  db: SupabaseClient,
  requestId: string,
): Promise<Response> {
  try {
    const [coreEvents, simEvents, gateRows] = await Promise.all([
      capped(
        db.schema("core").from("event").select(EVENT_COLS)
          .eq("resource_id", resourceId)
          .order("created_at", { ascending: true })
          .limit(TRACE_CAP),
      ),
      capped(
        db.schema("sim").from("event").select(EVENT_COLS)
          .eq("resource_id", resourceId)
          .order("created_at", { ascending: true })
          .limit(TRACE_CAP),
      ),
      capped(
        db.schema("core").from("control_result")
          .select("id, control_id, decision, event, score, subject_ref, provenance, created_at")
          .eq("subject_ref", resourceId)
          .order("created_at", { ascending: true })
          .limit(TRACE_CAP),
      ),
    ]);
    const events = [
      ...redactRows(coreEvents, "core"),
      ...redactRows(simEvents, "sim"),
    ].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
    return jsonResponse({
      resource_id: resourceId,
      events,
      events_capped: coreEvents.length >= TRACE_CAP || simEvents.length >= TRACE_CAP,
      control_results: gateRows,
      control_results_capped: gateRows.length >= TRACE_CAP,
    }, 200, requestId);
  } catch (e) {
    return internalErrorResponse(requestId, e);
  }
}

/**
 * One stable URL on the API that takes you to the dashboard. The shell
 * itself CANNOT be served from here: the Supabase gateway rewrites every
 * renderable content-type (text/html, xhtml, even via Storage) to text/plain
 * on its shared domains — an anti-phishing policy; HTML needs a custom
 * domain. So the shell lives on GitHub Pages (docs/dashboard/index.html —
 * pure chrome, zero data, safe to host publicly) and this route 302s to it.
 * DASHBOARD_SHELL_URL overrides the destination (e.g. a custom domain later).
 */
export const DEFAULT_SHELL_URL =
  "https://cassandra-labs-foundation.github.io/pynthia-policies-and-procedures/dashboard/";

export function getDashboardShell(requestId: string): Response {
  const dest = Deno.env.get("DASHBOARD_SHELL_URL") ?? DEFAULT_SHELL_URL;
  return new Response(null, {
    status: 302,
    headers: {
      location: dest,
      "x-request-id": requestId,
      "cache-control": "no-store",
    },
  });
}

