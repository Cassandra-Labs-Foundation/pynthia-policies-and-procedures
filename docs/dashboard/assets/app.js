// Compliance dashboard app — one script for the index and every policy page.
//
// URL hierarchy mirrors the repo's policies: /dashboard/ is the overview,
// /dashboard/<policy>/ is that policy's page. The slug comes from the URL,
// the catalogue from manifest.json (generated from controls.json by
// scripts/build_dashboard.py), and the live figures from the API's public
// data route. Where a policy has no live evidence yet, the page says so —
// a visible unknown, never a blank claim.
(function () {
  "use strict";

  // /dashboard/ -> {base: "./", slug: null}; /dashboard/x/ -> {base: "../", slug: "x"}
  const parts = location.pathname.replace(/\/+$/, "").split("/");
  if (parts[parts.length - 1] === "index.html") parts.pop();
  const last = parts[parts.length - 1];
  const isIndex = last === "dashboard";
  const slug = isIndex ? null : decodeURIComponent(last);
  const base = isIndex ? "./" : "../";

  const API = new URLSearchParams(location.search).get("api")
    || "https://jynsipdvrgqdkeqrlzcv.functions.supabase.co/api";
  const dataUrl = API.replace(/\/+$/, "") + "/compliance/dashboard/data";

  const root = document.getElementById("root");
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const n = (x) => (x ?? 0).toLocaleString();

  function kvTable(obj, headA, headB) {
    const rows = Object.entries(obj || {}).sort((a, b) => b[1] - a[1])
      .map(([k, v]) => "<tr><td>" + esc(k) + '</td><td style="text-align:right">' + n(v) + "</td></tr>").join("");
    if (!rows) return '<div class="none">none in window</div>';
    return "<table><tr><th>" + esc(headA) + '</th><th style="text-align:right">' + esc(headB) + "</th></tr>" + rows + "</table>";
  }
  const panel = (t, b) => '<div class="panel"><h2>' + esc(t) + "</h2>" + b + "</div>";

  function decisionsOf(byControl, ids) {
    const out = {};
    for (const id of ids) {
      for (const [dec, c] of Object.entries(byControl[id] || {})) out[dec] = (out[dec] || 0) + c;
    }
    return out;
  }
  const fires = (d) => Object.values(d).reduce((a, b) => a + b, 0);

  function pills(dec) {
    const blocked = (dec.block || 0) + (dec.reject || 0);
    return '<span class="pill ok">' + n(dec.pass || 0) + ' pass</span>'
      + '<span class="pill bad">' + n(blocked) + ' blocked / rejected</span>'
      + '<span class="pill warn">' + n(dec.alert || 0) + " alert</span>";
  }

  // Live panels that belong to specific policies (everything else shows its
  // catalogue + per-control evidence only).
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
        + "<small>unfiled · " + n(d.ctr.overdue) + " overdue</small></div>"
        + (d.ctr.due_next.length
          ? "<table><tr><th>filing</th><th>due</th></tr>"
            + d.ctr.due_next.map((f) => "<tr><td>" + esc(f.id) + "</td><td>" + esc((f.filing_due_at || "").slice(0, 10)) + "</td></tr>").join("")
            + "</table>"
          : '<div class="none">nothing owed</div>')));
    }
    if (slug === "electronic-payment-systems" || slug === "shared-controls") {
      out.push(panel("Awaiting second approver (EPS-06)",
        '<div class="big ' + (d.pending_approvals.count ? "warn" : "") + '">' + n(d.pending_approvals.count)
        + "<small>payments held for dual control</small></div>"
        + (d.pending_approvals.list.length
          ? "<table><tr><th>payment</th><th>waiting since</th></tr>"
            + d.pending_approvals.list.slice(0, 8).map((a) =>
              "<tr><td>" + esc(a.resource_type) + " " + esc(String(a.resource_id).slice(0, 8)) + "…</td><td>"
              + esc((a.created_at || "").slice(0, 16).replace("T", " ")) + "</td></tr>").join("")
            + "</table>" : "")));
    }
    return out.join("");
  }

  function indexView(m, d) {
    const byControl = d.controls.by_control;
    const globalDec = decisionsOf(byControl, Object.keys(byControl));
    const cards = m.policies.map((p) => {
      const dec = decisionsOf(byControl, p.controls.map((c) => c.id));
      const f = fires(dec);
      return '<a class="card" href="' + esc(p.slug) + '/">'
        + '<div class="t">' + esc(p.title) + "</div>"
        + '<div class="s">' + n(p.controls.length) + " controls</div>"
        + '<div class="fires">' + (f
          ? pills(dec)
          : '<span class="none">no live evidence in window</span>') + "</div>"
        + "</a>";
    }).join("");

    root.innerHTML =
      "<header><h1>Compliance Dashboard</h1>"
      + '<span class="meta">generated ' + new Date(d.generated_at).toLocaleString()
      + " · window " + (d.window_hours / 24) + "d"
      + (d.controls.window_capped ? " · CONTROL ROWS CAPPED" : "") + "</span>"
      + '<span class="meta">auto-refreshes every 30s</span></header>'
      + '<div class="grid">'
      + panel("Control activity — " + (d.window_hours / 24) + "d",
        '<div class="big">' + n(d.controls.window_rows) + "<small>evidence rows</small></div>"
        + '<div style="margin:6px 0 10px">' + pills(globalDec) + "</div>")
      + panel("Open BSA alerts",
        '<div class="big ' + (d.alerts.overdue_triage ? "bad" : "") + '">' + n(d.alerts.open)
        + "<small>" + n(d.alerts.overdue_triage) + " overdue triage</small></div>")
      + panel("Ledger & delivery health",
        kvTable(d.ops.events_7d, "reconciliation event — 7d", "count")
        + '<div style="margin-top:10px" class="big">' + n(d.ops.outbox_undelivered)
        + "<small>events awaiting delivery</small></div>"
        + (d.ops.last_reconcile_at
          ? '<div class="none" style="font-size:12px;margin-top:6px">last heartbeat '
            + new Date(d.ops.last_reconcile_at).toLocaleString() + "</div>" : ""))
      + "</div>"
      + '<div class="cards">' + cards + "</div>"
      + '<div class="foot">' + n(m.policy_count) + " policies · " + n(m.control_count)
      + " catalogued controls · every figure reads the evidence tables the controls write.</div>";
  }

  function policyView(m, d) {
    const p = m.policies.find((x) => x.slug === slug);
    if (!p) {
      root.innerHTML = '<div class="crumb"><a href="../">← all policies</a></div>'
        + "<h1>Unknown policy</h1><p class=\"none\">" + esc(slug) + " is not in the catalogue.</p>";
      return;
    }
    const byControl = d.controls.by_control;
    const dec = decisionsOf(byControl, p.controls.map((c) => c.id));
    const rows = p.controls.map((c) => {
      const cd = byControl[c.id];
      const live = cd
        ? Object.entries(cd).map(([k, v]) => esc(k) + " " + n(v)).join(" · ")
        : '<span class="none">—</span>';
      const cits = c.citations.map((r) =>
        r.url ? '<a class="cit" href="' + esc(r.url) + '" target="_blank" rel="noopener">' + esc(r.text) + "</a>"
              : '<span class="cit">' + esc(r.text) + "</span>").join(", ");
      return '<tr><td class="cid"><a href="' + esc(c.doc) + '" target="_blank" rel="noopener">' + esc(c.id) + "</a></td>"
        + "<td>" + esc(c.title) + (cits ? '<div class="cit">' + cits + "</div>" : "") + "</td>"
        + '<td style="text-align:right">' + live + "</td></tr>";
    }).join("");

    root.innerHTML =
      '<div class="crumb"><a href="../">← all policies</a></div>'
      + "<header><h1>" + esc(p.title) + "</h1>"
      + '<span class="meta">' + n(p.controls.length) + " controls · window "
      + (d.window_hours / 24) + "d</span>"
      + '<span class="meta">generated ' + new Date(d.generated_at).toLocaleString() + "</span></header>"
      + '<div style="margin:-6px 0 12px">' + (fires(dec)
        ? pills(dec)
        : '<span class="none">no live evidence for this policy in the window — the catalogue below is the claim surface</span>') + "</div>"
      + '<div class="grid">' + policyPanels(slug, d) + "</div>"
      + '<div class="sect"><h2>Controls</h2><table>'
      + "<tr><th>id</th><th>control</th><th style=\"text-align:right\">live evidence — "
      + (d.window_hours / 24) + "d</th></tr>" + rows + "</table></div>"
      + '<div class="foot">Control ids link to the policy text in the repo; evidence counts read core.control_result.</div>';
  }

  async function load() {
    let m, d;
    try {
      // no-cache on the manifest: Pages serves it with a long max-age, so a
      // regenerated catalogue would otherwise keep rendering the old policy
      // list (caught in a browser after adding a policy — the new page was
      // live and invisible). The data route is already no-store.
      const [mr, dr] = await Promise.all([
        fetch(base + "manifest.json", { cache: "no-cache" }),
        fetch(dataUrl),
      ]);
      if (!mr.ok || !dr.ok) throw new Error("manifest " + mr.status + ", data " + dr.status);
      m = await mr.json();
      d = await dr.json();
    } catch (e) {
      root.innerHTML = "<h1>Compliance Dashboard</h1><div id=\"err\">cannot load: " + esc(e.message) + "</div>";
      return;
    }
    if (isIndex) indexView(m, d);
    else policyView(m, d);
  }

  setInterval(load, 30000);
  load();
})();
