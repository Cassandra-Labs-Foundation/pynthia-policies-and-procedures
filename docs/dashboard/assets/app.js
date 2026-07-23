// Compliance monitoring dashboard — one script for the index, every policy
// page, and every control's drill-down.
//
// This is a transaction-monitoring surface, not a scoreboard: every control
// in the catalogue has a HEARTBEAT (its event codes bucketed over time, from
// /compliance/dashboard/heartbeat), and every pulse is clickable down to the
// raw evidence — the event stream (/events?codes=...), each payload, and from
// any event the whole transaction cycle of its resource (/trace/{id}). The
// compliance team runs the day on this; an examiner audits any control by
// reading its history. Payloads arrive PII-redacted by the API (the same
// boundary the aggregator enforces).
//
// URL hierarchy mirrors the repo's policies: /dashboard/ is the overview,
// /dashboard/<policy>/ that policy's control list, /dashboard/<policy>/#c=ID
// one control's monitoring view. The catalogue (watch codes, spec rules, test
// verdicts) comes from manifest.json, generated from controls.json +
// control-tests*.json by scripts/build_dashboard.py.
(function () {
  "use strict";

  // /dashboard/ -> {slug: null}; /dashboard/x/ -> {slug: "x"}
  const parts = location.pathname.replace(/\/+$/, "").split("/");
  if (parts[parts.length - 1] === "index.html") parts.pop();
  const last = parts[parts.length - 1];
  const isIndex = last === "dashboard";
  const slug = isIndex ? null : decodeURIComponent(last);
  const base = isIndex ? "./" : "../";

  const API = (new URLSearchParams(location.search).get("api")
    || "https://jynsipdvrgqdkeqrlzcv.functions.supabase.co/api").replace(/\/+$/, "");

  const root = document.getElementById("root");
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const n = (x) => (x ?? 0).toLocaleString();

  const fmtT = (iso) => iso ? new Date(iso).toLocaleString() : "—";
  function ago(iso) {
    if (!iso) return "never";
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 90) return Math.max(1, Math.round(s)) + "s ago";
    if (s < 5400) return Math.round(s / 60) + "m ago";
    if (s < 129600) return Math.round(s / 3600) + "h ago";
    return Math.round(s / 86400) + "d ago";
  }

  // ------------------------------------------------------------ heartbeat model
  // hb = raw payload; model buckets every code / gate control onto one shared
  // time grid so every sparkline on the page is comparable at a glance.
  let M = null; // {grid: {t0, step, B}, byCode, gateById, seen, data, hb}

  function buildModel(hb, data) {
    const step = hb.bucket_seconds;
    const t0 = Math.floor(new Date(hb.since).getTime() / 1000 / step) * step;
    const B = Math.max(1, Math.floor((Date.now() / 1000 - t0) / step) + 1);
    const idx = (iso) => {
      const i = Math.floor((new Date(iso).getTime() / 1000 - t0) / step);
      return i < 0 ? 0 : i >= B ? B - 1 : i;
    };

    const byCode = new Map(); // code -> {core:[], sim:[], total}
    for (const r of hb.events) {
      let e = byCode.get(r.code);
      if (!e) byCode.set(r.code, e = { core: new Array(B).fill(0), sim: new Array(B).fill(0), total: 0 });
      e[r.src === "sim" ? "sim" : "core"][idx(r.bucket)] += r.n;
      e.total += r.n;
    }

    const gateById = new Map(); // control_id -> {core:[], sim:[], total, decisions:{}}
    for (const r of hb.gate) {
      let g = gateById.get(r.control_id);
      if (!g) gateById.set(r.control_id, g = { core: new Array(B).fill(0), sim: new Array(B).fill(0), total: 0, decisions: {} });
      g[r.src === "sim" ? "sim" : "core"][idx(r.bucket)] += r.n;
      g.total += r.n;
      g.decisions[r.decision] = (g.decisions[r.decision] || 0) + r.n;
    }

    const seen = new Map(); // code -> {last_at, total}
    for (const r of hb.last_seen) {
      const s = seen.get(r.code);
      if (!s) seen.set(r.code, { last_at: r.last_at, total: r.total });
      else {
        s.total += r.total;
        if (r.last_at > s.last_at) s.last_at = r.last_at;
      }
    }
    M = { grid: { t0, step, B }, byCode, gateById, seen, data, hb };
  }

  // pulse of one control: sum its watch codes (or its gate series) on the grid
  function pulseOf(ctl) {
    const B = M.grid.B;
    const out = { core: new Array(B).fill(0), sim: new Array(B).fill(0), total: 0, last_at: null, everTotal: 0 };
    if (ctl.watch.length === 0 && M.gateById.has(ctl.id)) {
      const g = M.gateById.get(ctl.id);
      return { core: g.core, sim: g.sim, total: g.total, last_at: null, everTotal: g.total, decisions: g.decisions };
    }
    for (const code of ctl.watch) {
      const e = M.byCode.get(code);
      if (e) {
        for (let i = 0; i < B; i++) { out.core[i] += e.core[i]; out.sim[i] += e.sim[i]; }
        out.total += e.total;
      }
      const s = M.seen.get(code);
      if (s) {
        out.everTotal += s.total;
        if (!out.last_at || s.last_at > out.last_at) out.last_at = s.last_at;
      }
    }
    return out;
  }

  // ---------------------------------------------------------------- rendering
  function spark(p, w, h) {
    const B = p.core.length;
    let max = 1;
    for (let i = 0; i < B; i++) max = Math.max(max, p.core[i] + p.sim[i]);
    const bw = w / B;
    let bars = "";
    for (let i = 0; i < B; i++) {
      const hc = Math.round((p.core[i] / max) * (h - 2));
      const hs = Math.round((p.sim[i] / max) * (h - 2));
      if (hc) bars += '<rect x="' + (i * bw + 0.5) + '" y="' + (h - hc) + '" width="' + (bw - 1) + '" height="' + hc + '" class="sb-core"/>';
      if (hs) bars += '<rect x="' + (i * bw + 0.5) + '" y="' + (h - hc - hs) + '" width="' + (bw - 1) + '" height="' + hs + '" class="sb-sim"/>';
      if (!hc && !hs) bars += '<rect x="' + (i * bw + 0.5) + '" y="' + (h - 1) + '" width="' + (bw - 1) + '" height="1" class="sb-nil"/>';
    }
    return '<svg class="spark" viewBox="0 0 ' + w + " " + h + '" width="' + w + '" height="' + h + '" preserveAspectRatio="none">' + bars + "</svg>";
  }

  function dot(p) {
    if (p.total > 0) return '<span class="dot ok" title="evidence in window"></span>';
    if (p.everTotal > 0) return '<span class="dot warn" title="has history, silent in this window"></span>';
    return '<span class="dot nil" title="no evidence ever"></span>';
  }

  function testBadges(t) {
    if (!t || (!t.hermetic && !t.live)) return "";
    if (t.scoped_out) return '<span class="badge nil" title="' + esc(t.scope_reason || "organisational control") + '">scoped out</span>';
    const b = (tier, v) =>
      '<span class="badge ' + (v === "green" ? "ok" : "bad") + '" title="' + tier + ' control test">' + tier + " " + esc(v) + "</span>";
    return (t.hermetic ? b("hermetic", t.hermetic) : "") + (t.live ? b("live", t.live) : "");
  }

  const panel = (t, b) => '<div class="panel"><h2>' + esc(t) + "</h2>" + b + "</div>";
  function kvTable(obj, headA, headB) {
    const rows = Object.entries(obj || {}).sort((a, b) => b[1] - a[1])
      .map(([k, v]) => "<tr><td>" + esc(k) + '</td><td style="text-align:right">' + n(v) + "</td></tr>").join("");
    if (!rows) return '<div class="none">none in window</div>';
    return "<table><tr><th>" + esc(headA) + '</th><th style="text-align:right">' + esc(headB) + "</th></tr>" + rows + "</table>";
  }

  // policy-specific operational clocks (kept from the first dashboard: these
  // read the SLA tables directly and belong next to the affected policies)
  function policyPanels(slug, d) {
    const out = [];
    if (slug === "bsa") {
      out.push(panel("Open BSA alerts",
        '<div class="big ' + (d.alerts.overdue_triage ? "bad" : "") + '">' + n(d.alerts.open)
        + "<small>" + n(d.alerts.overdue_triage) + " past the 2-business-day triage clock</small></div>"
        + kvTable(d.alerts.by_type, "type", "open")));
      out.push(panel("Case / SAR pipeline",
        kvTable(d.cases.by_status, "status", "cases")
        + '<div style="margin-top:10px">' + kvTable(d.cases.sar_decisions, "SAR decision", "count") + "</div>"));
    }
    if (slug === "bsa" || slug === "cash") {
      out.push(panel("CTR filings — 15-day FinCEN clock",
        '<div class="big ' + (d.ctr.overdue ? "bad" : "") + '">' + n(d.ctr.unfiled)
        + "<small>unfiled · " + n(d.ctr.overdue) + " overdue</small></div>"));
    }
    if (slug === "electronic-payment-systems" || slug === "shared-controls") {
      out.push(panel("Awaiting second approver (EPS-06)",
        '<div class="big ' + (d.pending_approvals.count ? "warn" : "") + '">' + n(d.pending_approvals.count)
        + "<small>payments held for dual control</small></div>"));
    }
    return out.join("");
  }

  function headerHtml(title, extra) {
    return "<header><h1>" + esc(title) + "</h1>"
      + '<span class="meta">window ' + (M.hb.window_hours / 24) + "d · bucket "
      + (M.hb.bucket_seconds / 3600) + "h · generated " + fmtT(M.hb.generated_at) + "</span>"
      + (extra || "") + "</header>";
  }

  // ------------------------------------------------------------------- index
  function indexView(m) {
    const all = { core: new Array(M.grid.B).fill(0), sim: new Array(M.grid.B).fill(0), total: 0 };
    for (const e of M.byCode.values()) {
      for (let i = 0; i < M.grid.B; i++) { all.core[i] += e.core[i]; all.sim[i] += e.sim[i]; }
      all.total += e.total;
    }
    let live = 0, silent = 0, never = 0, totalCtl = 0;
    const cards = m.policies.map((p) => {
      const pp = { core: new Array(M.grid.B).fill(0), sim: new Array(M.grid.B).fill(0), total: 0 };
      let pl = 0, ps = 0, pn = 0;
      for (const c of p.controls) {
        const cp = pulseOf(c);
        totalCtl++;
        if (cp.total > 0) { pl++; live++; } else if (cp.everTotal > 0) { ps++; silent++; } else { pn++; never++; }
        for (let i = 0; i < M.grid.B; i++) { pp.core[i] += cp.core[i]; pp.sim[i] += cp.sim[i]; }
        pp.total += cp.total;
      }
      return '<a class="card" href="' + esc(p.slug) + '/">'
        + '<div class="t">' + esc(p.title) + "</div>"
        + '<div class="s">' + n(p.controls.length) + " controls · "
        + '<span class="ok">' + pl + " live</span> · "
        + '<span class="warn">' + ps + " silent</span> · "
        + '<span class="nil">' + pn + " never</span></div>"
        + '<div class="cardspark">' + spark(pp, 232, 26) + "</div>"
        + '<div class="s">' + n(pp.total) + " events in window</div>"
        + "</a>";
    }).join("");

    root.innerHTML =
      headerHtml("Compliance Monitoring")
      + '<div class="grid">'
      + panel("All-events heartbeat — every control, one pulse",
        '<div class="bigspark">' + spark(all, 640, 60) + "</div>"
        + '<div class="big">' + n(all.total) + "<small>events in window · "
        + '<span class="legend"><i class="sb-core-i"></i> production · <i class="sb-sim-i"></i> simulated drills</span></small></div>')
      + panel("Control coverage",
        '<div class="big">' + n(live) + "<small>of " + n(totalCtl) + " controls produced evidence in window</small></div>"
        + '<div style="margin-top:6px" class="s"><span class="warn">' + n(silent) + " silent</span> · <span class=\"nil\">"
        + n(never) + " never fired</span></div>"
        + '<div class="none" style="font-size:12px;margin-top:8px">click any policy, then any control, for its full event history</div>')
      + panel("Ledger & delivery health",
        kvTable(M.data.ops.events_7d, "reconciliation event — 7d", "count")
        + '<div style="margin-top:10px" class="big">' + n(M.data.ops.outbox_undelivered)
        + "<small>events awaiting delivery</small></div>"
        + (M.data.ops.last_reconcile_at
          ? '<div class="none" style="font-size:12px;margin-top:6px">last heartbeat ' + fmtT(M.data.ops.last_reconcile_at) + "</div>" : ""))
      + "</div>"
      + '<div class="cards">' + cards + "</div>"
      + '<div class="foot">' + n(m.policy_count) + " policies · " + n(m.control_count)
      + " catalogued controls · every pulse reads core.event / core.control_result; simulated drill evidence is labeled, never mixed.</div>";
  }

  // ------------------------------------------------------------- policy view
  function policyView(m) {
    const p = m.policies.find((x) => x.slug === slug);
    if (!p) {
      root.innerHTML = '<div class="crumb"><a href="../">← all policies</a></div>'
        + "<h1>Unknown policy</h1><p class=\"none\">" + esc(slug) + " is not in the catalogue.</p>";
      return;
    }
    const sel = new URLSearchParams(location.hash.slice(1)).get("c");
    const selCtl = sel ? p.controls.find((c) => c.id === sel) : null;
    if (selCtl) return controlView(p, selCtl);

    const rows = p.controls.map((c) => {
      const cp = pulseOf(c);
      const lastTxt = cp.total || cp.everTotal
        ? esc(ago(cp.last_at)) + (cp.last_at ? '<div class="cit">' + esc(fmtT(cp.last_at)) + "</div>" : "")
        : '<span class="none">never</span>';
      return '<tr class="ctl" data-c="' + esc(c.id) + '">'
        + "<td>" + dot(cp) + "</td>"
        + '<td class="cid">' + esc(c.id) + "</td>"
        + "<td>" + esc(c.title) + '<div class="cit">' + testBadges(c.tests) + "</div></td>"
        + '<td class="sparkcell">' + spark(cp, 180, 22) + "</td>"
        + '<td style="text-align:right">' + n(cp.total) + "</td>"
        + '<td style="text-align:right">' + lastTxt + "</td></tr>";
    }).join("");

    root.innerHTML =
      '<div class="crumb"><a href="../">← all policies</a></div>'
      + headerHtml(p.title, '<span class="meta">' + n(p.controls.length) + " controls</span>")
      + '<div class="grid">' + policyPanels(slug, M.data) + "</div>"
      + '<div class="sect"><h2>Controls — click one for its event history</h2><table class="ctltable">'
      + '<tr><th></th><th>id</th><th>control</th><th>heartbeat — ' + (M.hb.window_hours / 24) + 'd</th>'
      + '<th style="text-align:right">events</th><th style="text-align:right">last evidence</th></tr>'
      + rows + "</table></div>"
      + '<div class="foot">Heartbeats sum each control\'s trigger + produced event codes from its own spec (controls.json); the gate controls read core.control_result.</div>';

    root.querySelectorAll("tr.ctl").forEach((tr) => {
      tr.addEventListener("click", () => { location.hash = "c=" + tr.dataset.c; });
    });
  }

  // ------------------------------------------------------------ control view
  // The audit surface for ONE control: spec, test verdicts, heartbeat, and
  // the raw event stream — every row expandable to its payload, every
  // resource traceable through its whole transaction cycle.
  let stream = null; // {codes, events, next_before, open:Set, trace:{id,data}|null}

  function controlView(p, c) {
    const cp = pulseOf(c);
    const isGate = c.watch.length === 0;

    const cits = c.citations.map((r) =>
      r.url ? '<a class="cit" href="' + esc(r.url) + '" target="_blank" rel="noopener">' + esc(r.text) + "</a>"
        : '<span class="cit">' + esc(r.text) + "</span>").join(", ");

    const ruleHtml = c.rules.map((r) =>
      '<div class="rule"><span class="code trig">' + esc(r.trigger || "?") + "</span> → "
      + r.produced.map((x) => '<span class="code prod">' + esc(x) + "</span>").join(" ")
      + (r.inputs.length ? '<div class="cit">requires: ' + r.inputs.map(esc).join(", ") + "</div>" : "")
      + (r.timer ? '<div class="cit">deadline: <span class="code">' + esc(r.timer) + "</span> — " + esc(r.deadline_text || "") + "</div>"
        : (r.deadline_text ? '<div class="cit">cadence: ' + esc(r.deadline_text) + "</div>" : ""))
      + "</div>").join("");

    root.innerHTML =
      '<div class="crumb"><a href="#" id="back">← ' + esc(p.title) + "</a> · <a href=\"../\">all policies</a></div>"
      + "<header><h1>" + dot(cp) + " " + esc(c.id) + " — " + esc(c.title) + "</h1>"
      + '<span class="meta">' + testBadges(c.tests) + "</span>"
      + '<span class="meta"><a href="' + esc(c.doc) + '" target="_blank" rel="noopener">policy text ↗</a>'
      + (cits ? " · " + cits : "") + "</span></header>"
      + '<div class="grid">'
      + panel("Heartbeat — " + (M.hb.window_hours / 24) + "d",
        '<div class="bigspark">' + spark(cp, 640, 56) + "</div>"
        + '<div class="big">' + n(cp.total) + "<small>events in window · last evidence "
        + esc(ago(cp.last_at)) + (isGate ? "" : " · " + n(cp.everTotal) + " all-time") + "</small></div>"
        + (cp.decisions ? '<div style="margin-top:8px">' + kvTable(cp.decisions, "gate decision — window", "count") + "</div>" : ""))
      + panel("What this control watches",
        isGate
          ? '<div class="none">Runtime gate: its evidence is core.control_result rows (decisions above). Trace any transaction to see this gate\'s decision about it.</div>'
          : (ruleHtml || '<div class="none">no machine rules declared</div>'))
      + "</div>"
      + '<div class="sect" id="streamsect"><h2>Event history — newest first, payloads inspectable</h2>'
      + '<div id="streambody" class="none">loading…</div></div>'
      + '<div class="foot">Every row is a core.event / sim.event record; payloads are PII-redacted at the API boundary. Click a row for its payload, "trace" for the resource\'s full transaction cycle.</div>';

    document.getElementById("back").addEventListener("click", (e) => {
      e.preventDefault();
      location.hash = "";
    });

    stream = { codes: c.watch, events: [], next_before: null, open: new Set(), trace: null };
    if (isGate) {
      document.getElementById("streambody").innerHTML =
        '<div class="none">The gate writes decisions, not outbox events — its per-decision history is in the heartbeat panel; per-transaction decisions appear in any resource trace.</div>';
    } else {
      fetchStream(null);
    }
  }

  async function fetchStream(before) {
    const body = document.getElementById("streambody");
    try {
      const u = API + "/compliance/dashboard/events?limit=50&codes=" + encodeURIComponent(stream.codes.join(","))
        + (before ? "&before=" + encodeURIComponent(before) : "");
      const r = await fetch(u);
      if (!r.ok) throw new Error("events " + r.status);
      const d = await r.json();
      stream.events = stream.events.concat(d.events);
      stream.next_before = d.next_before;
      renderStream();
    } catch (e) {
      body.innerHTML = '<div id="err">cannot load event history: ' + esc(e.message) + "</div>";
    }
  }

  function renderStream() {
    const body = document.getElementById("streambody");
    if (!body) return;
    if (stream.events.length === 0) {
      body.innerHTML = '<div class="none">no events recorded for this control\'s codes — this control has never produced evidence. That is a finding, not a blank.</div>';
      return;
    }
    const rows = stream.events.map((e, i) => {
      const open = stream.open.has(i);
      let out = '<tr class="ev" data-i="' + i + '">'
        + "<td class=\"cid\">" + esc(fmtT(e.created_at)) + "</td>"
        + '<td><span class="code">' + esc(e.code) + "</span></td>"
        + '<td><span class="badge ' + (e.src === "sim" ? "sim" : "core") + '">' + esc(e.src) + "</span></td>"
        + '<td class="cid">' + esc(e.resource_id || "") + "</td>"
        + '<td>' + (e.resource_id ? '<button class="tracebtn" data-r="' + esc(e.resource_id) + '">trace</button>' : "") + "</td></tr>";
      if (open) {
        out += '<tr class="payload"><td colspan="5"><pre>' + esc(JSON.stringify({
          id: e.id, type: e.type, provenance: e.provenance, delivered_at: e.delivered_at, payload: e.payload,
        }, null, 1)) + "</pre></td></tr>";
      }
      return out;
    }).join("");
    body.classList.remove("none");
    body.innerHTML =
      (stream.trace ? traceHtml(stream.trace) : "")
      + "<table><tr><th>when</th><th>event</th><th>world</th><th>resource</th><th></th></tr>" + rows + "</table>"
      + (stream.next_before
        ? '<button id="more" class="morebtn">load older history</button>'
        : '<div class="none" style="margin-top:8px;font-size:12px">end of history</div>');

    body.querySelectorAll("tr.ev").forEach((tr) => {
      tr.addEventListener("click", (ev) => {
        if (ev.target.classList.contains("tracebtn")) return;
        const i = Number(tr.dataset.i);
        stream.open.has(i) ? stream.open.delete(i) : stream.open.add(i);
        renderStream();
      });
    });
    body.querySelectorAll(".tracebtn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          const r = await fetch(API + "/compliance/dashboard/trace/" + encodeURIComponent(btn.dataset.r));
          if (!r.ok) throw new Error("trace " + r.status);
          stream.trace = await r.json();
          renderStream();
          document.getElementById("streamsect").scrollIntoView({ behavior: "smooth" });
        } catch (e) {
          stream.trace = { resource_id: btn.dataset.r, error: e.message };
          renderStream();
        }
      });
    });
    const more = document.getElementById("more");
    if (more) more.addEventListener("click", () => fetchStream(stream.next_before));
    const close = document.getElementById("traceclose");
    if (close) close.addEventListener("click", () => { stream.trace = null; renderStream(); });
  }

  function traceHtml(t) {
    let inner;
    if (t.error) {
      inner = '<div id="err">cannot trace ' + esc(t.resource_id) + ": " + esc(t.error) + "</div>";
    } else {
      const evs = t.events.map((e) =>
        '<div class="tl"><span class="cid">' + esc(fmtT(e.created_at)) + "</span>"
        + '<span class="code">' + esc(e.code) + "</span>"
        + '<span class="badge ' + (e.src === "sim" ? "sim" : "core") + '">' + esc(e.src) + "</span>"
        + '<pre>' + esc(JSON.stringify(e.payload, null, 1)) + "</pre></div>").join("");
      const gates = t.control_results.length
        ? "<table><tr><th>when</th><th>control</th><th>decision</th><th>event</th></tr>"
          + t.control_results.map((g) =>
            "<tr><td class=\"cid\">" + esc(fmtT(g.created_at)) + '</td><td class="cid">' + esc(g.control_id) + "</td>"
            + '<td><span class="badge ' + (g.decision === "pass" || g.decision === "clear" ? "ok" : "bad") + '">'
            + esc(g.decision) + "</span></td><td>" + esc(g.event || "") + "</td></tr>").join("") + "</table>"
        : '<div class="none">no gate decisions recorded for this resource</div>';
      inner = "<h3>Transaction cycle — " + esc(t.resource_id) + " · " + n(t.events.length)
        + " events</h3>" + evs
        + "<h3>Gate decisions about this resource</h3>" + gates;
    }
    return '<div class="trace"><button id="traceclose" class="morebtn" style="float:right">close trace</button>' + inner + "</div>";
  }

  // -------------------------------------------------------------------- boot
  async function load() {
    let m, hb, d;
    try {
      const [mr, hr, dr] = await Promise.all([
        fetch(base + "manifest.json", { cache: "no-cache" }),
        fetch(API + "/compliance/dashboard/heartbeat?hours=168&bucket=21600"),
        fetch(API + "/compliance/dashboard/data"),
      ]);
      if (!mr.ok || !hr.ok || !dr.ok) {
        throw new Error("manifest " + mr.status + ", heartbeat " + hr.status + ", data " + dr.status);
      }
      m = await mr.json();
      hb = await hr.json();
      d = await dr.json();
    } catch (e) {
      root.innerHTML = "<h1>Compliance Monitoring</h1><div id=\"err\">cannot load: " + esc(e.message) + "</div>";
      return;
    }
    buildModel(hb, d);
    if (isIndex) indexView(m);
    else policyView(m);
    window.MANIFEST = m;
  }

  window.addEventListener("hashchange", () => {
    if (!isIndex && window.MANIFEST) policyView(window.MANIFEST);
  });

  // refresh the aggregates, but never yank an open drill-down out from under
  // the reader: a control view holds its stream (it has its own load-more)
  setInterval(() => {
    const drilled = !isIndex && new URLSearchParams(location.hash.slice(1)).get("c");
    if (!drilled) load();
  }, 60000);
  load();
})();
