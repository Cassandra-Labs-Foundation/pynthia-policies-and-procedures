#!/usr/bin/env python3
"""Generate the event choreography explorer from the compliance artifacts.

The board's "Event choreography graph" card, done the way this repo does
artifacts: a pure function of three already-gated inputs —

  compliance/dashboard/manifest.json   (controls + their trigger/produced rules)
  crosswalk-emitted-events.json        (what the routed core actually emits)
  core-vocabulary.json                 (the spec's event/task registries)

— rendered as ONE self-contained page, compliance/dashboard/choreography/
index.html, with the graph data embedded (no fetch, works from file:// and
GitHub Pages alike). pages.yml already ships the whole dashboard directory,
so this deploys with no workflow change.

The page is an explorer, not a hairball: pick any event code and see, in one
screen, who emits it (module:line), which control rules PRODUCE it, and which
control rules it TRIGGERS — then click through to walk the chain. Codes are
badged live (the core emits them), producible (only a control produces them),
or dark (nothing emits them — the reachability gap, made visible).

  python3 scripts/build_choreography.py            # write the page
  python3 scripts/build_choreography.py --check    # exit 1 if stale
"""
import argparse
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import code_format  # noqa: E402
import generated  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "compliance" / "dashboard" / "manifest.json"
EMITTED = ROOT / "crosswalk-emitted-events.json"
VOCAB = ROOT / "core-vocabulary.json"
OUT = ROOT / "compliance" / "dashboard" / "choreography" / "index.html"


def build_data() -> dict:
    manifest = json.loads(MANIFEST.read_text())
    inv = json.loads(EMITTED.read_text())
    vocab = json.loads(VOCAB.read_text())

    # registry names may carry fused spellings (cdd.refresh_due); every
    # consumer compares canonically, so this page must too
    canon = code_format.canonicalizer(VOCAB)
    event_codes = {canon(e.get("code") or e.get("name"))
                   for e in vocab.get("events", [])}
    task_codes = {canon(t["name"]) for t in vocab.get("tasks", [])}

    # code -> list of "short/source:line" emitter sites (routed core only —
    # the deliberately-excluded calendar and narrow-bank blocks stay out, so
    # their codes honestly render as dark)
    emitters: dict[str, list[str]] = {}

    def add_site(code: str, source: str) -> None:
        short = source.removeprefix("core/supabase/functions/")
        emitters.setdefault(code, [])
        if short not in emitters[code]:
            emitters[code].append(short)

    for entry in inv.get("literal", []):
        add_site(entry["code"], entry["source"])
    for entry in inv.get("templated", []):
        for code in entry.get("expands_to", []):
            add_site(code, entry["source"])

    controls = []
    codes: dict[str, dict] = {}

    def touch(code: str) -> dict:
        if code not in codes:
            kind = ("task" if code in task_codes
                    else "event" if code in event_codes else "unregistered")
            codes[code] = {"s": code.split(".", 1)[0], "k": kind,
                           "em": emitters.get(code, [])}
        return codes[code]

    for policy in manifest["policies"]:
        for c in policy["controls"]:
            rules = []
            for r in c.get("rules", []):
                tr = r.get("trigger")
                if not tr:
                    continue
                touch(tr)
                for p in r.get("produced", []):
                    touch(p)
                rules.append({"tr": tr, "pr": r.get("produced", []),
                              "in": r.get("inputs", []),
                              "dl": r.get("deadline_text") or ""})
            if rules:
                controls.append({"u": c["uid"], "t": c["title"],
                                 "p": policy["slug"], "d": c.get("doc", ""),
                                 "r": rules})

    # registered codes no rule references still belong in search — they are
    # the registry's long tail, and finding "nothing choreographs this" is a
    # real answer
    for code in sorted(event_codes | task_codes):
        touch(code)

    n_rules = sum(len(c["r"]) for c in controls)
    live = sum(1 for v in codes.values() if v["em"])
    return {
        "meta": {"codes": len(codes), "live": live, "controls": len(controls),
                 "rules": n_rules,
                 "generated_from": "manifest.json + crosswalk-emitted-events.json"
                                   " + core-vocabulary.json"
                                   " (scripts/build_choreography.py)"},
        "codes": codes,
        "controls": controls,
    }


PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cassandra — Event Choreography</title>
<style>
  :root { --bg:#0d1117; --card:#161b22; --edge:#21262d; --ink:#e6edf3;
          --dim:#8b949e; --blue:#58a6ff; --green:#3fb950; --yellow:#d29922;
          --red:#f85149; }
  * { box-sizing:border-box; margin:0; }
  body { background:var(--bg); color:var(--ink);
         font:14px/1.5 -apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
  a { color:var(--blue); text-decoration:none; }
  header { padding:20px 28px 12px; border-bottom:1px solid var(--edge); }
  header h1 { font-size:20px; }
  header .sub { color:var(--dim); font-size:12px; margin-top:2px; }
  header .sub b { color:var(--ink); font-weight:600; }
  .searchrow { padding:14px 28px; display:flex; gap:10px; align-items:center; }
  #q { flex:1; max-width:520px; background:var(--card); color:var(--ink);
       border:1px solid var(--edge); border-radius:6px; padding:8px 12px;
       font-size:14px; }
  main { padding:0 28px 60px; }
  .cols { display:grid; grid-template-columns:1fr 1.1fr 1.4fr; gap:16px;
          align-items:start; }
  @media (max-width:900px){ .cols { grid-template-columns:1fr; } }
  .pane h2 { font-size:11px; letter-spacing:.08em; text-transform:uppercase;
             color:var(--dim); margin:14px 0 8px; }
  .card { background:var(--card); border:1px solid var(--edge);
          border-radius:8px; padding:12px 14px; margin-bottom:10px; }
  .code { font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
          font-size:13px; word-break:break-all; }
  .clickable { cursor:pointer; }
  .clickable:hover { color:var(--blue); }
  .badge { display:inline-block; font-size:10px; font-weight:700;
           letter-spacing:.05em; border-radius:10px; padding:1px 8px;
           vertical-align:1px; margin-left:8px; }
  .b-live { background:#1a2f22; color:var(--green); }
  .b-prod { background:#2f2a17; color:var(--yellow); }
  .b-dark { background:#2f1c1c; color:var(--red); }
  .b-task { background:#1c2740; color:var(--blue); }
  .src { color:var(--dim); font-size:11px;
         font-family:ui-monospace,Menlo,monospace; margin-top:2px; }
  .ctl { border-left:3px solid var(--edge); padding-left:10px; margin:8px 0; }
  .ctl .name { font-weight:600; font-size:13px; }
  .ctl .pol { color:var(--dim); font-size:11px; }
  .rule { margin:6px 0 2px; }
  .arrow { color:var(--dim); padding:0 4px; }
  .dl { color:var(--yellow); font-size:11px; margin-left:6px; }
  .inputs { color:var(--dim); font-size:11px; }
  .center-code { font-size:17px; font-weight:700; }
  .muted { color:var(--dim); }
  .subject-grid { display:grid;
                  grid-template-columns:repeat(auto-fill,minmax(230px,1fr));
                  gap:10px; margin-top:14px; }
  .subject-grid .card { margin:0; }
  .count { color:var(--dim); font-size:12px; }
  .crumbs { padding:0 28px 8px; font-size:12px; color:var(--dim); }
  .crumbs span { cursor:pointer; color:var(--blue); }
  .backlink { font-size:12px; }
</style>
</head>
<body>
<header>
  <h1>Event Choreography</h1>
  <div class="sub" id="stats"></div>
  <div class="sub"><a href="../" class="backlink">&larr; compliance dashboard</a>
   &nbsp;&middot;&nbsp; pick an event code to see who emits it, what it
   triggers, and what those controls must produce — click any code to walk
   the chain.</div>
</header>
<div class="searchrow">
  <input id="q" list="allcodes" placeholder="search an event code, task, or control…"
         autocomplete="off">
  <datalist id="allcodes"></datalist>
</div>
<div class="crumbs" id="crumbs"></div>
<main id="view"></main>
<script id="graph-data" type="application/json">__DATA__</script>
<script>
const G = JSON.parse(document.getElementById("graph-data").textContent);
const triggeredBy = {}, producedBy = {};   // code -> [ [ctlIdx, ruleIdx], … ]
G.controls.forEach((c, ci) => c.r.forEach((r, ri) => {
  (triggeredBy[r.tr] ||= []).push([ci, ri]);
  r.pr.forEach(p => (producedBy[p] ||= []).push([ci, ri]));
}));
const $ = (id) => document.getElementById(id);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function badge(code) {
  const c = G.codes[code];
  if (!c) return '<span class="badge b-dark">UNKNOWN</span>';
  let b = c.em.length ? '<span class="badge b-live" title="the routed core emits this">LIVE</span>'
        : (producedBy[code] ? '<span class="badge b-prod" title="only produced as control evidence">PRODUCIBLE</span>'
                            : '<span class="badge b-dark" title="nothing emits this">DARK</span>');
  if (c.k === "task") b += '<span class="badge b-task">TIMER</span>';
  return b;
}
const codeLink = (code) =>
  `<span class="code clickable" onclick="go('c:${code}')">${esc(code)}</span>${badge(code)}`;

function ctlBlock(ci, ri, showTrigger) {
  const c = G.controls[ci], r = c.r[ri];
  const prod = r.pr.length
    ? r.pr.map(p => codeLink(p)).join('<span class="arrow">,</span> ')
    : '<span class="muted">nothing (gate only)</span>';
  return `<div class="ctl">
    <div class="name clickable" onclick="go('k:${c.u}')">${esc(c.u)} — ${esc(c.t)}</div>
    <div class="pol">${esc(c.p)}${r.dl ? `<span class="dl">deadline: ${esc(r.dl)}</span>` : ""}</div>
    <div class="rule">${showTrigger ? codeLink(r.tr) + '<span class="arrow">&rarr;</span>' : ""}${prod}</div>
    ${r.in.length ? `<div class="inputs">needs: ${r.in.map(esc).join(", ")}</div>` : ""}
  </div>`;
}

function renderCode(code) {
  const c = G.codes[code];
  if (!c) { $("view").innerHTML = `<p class="muted">unknown code: ${esc(code)}</p>`; return; }
  const emit = c.em.length
    ? c.em.map(s => `<div class="src">${esc(s)}</div>`).join("")
    : `<div class="muted">no routed emitter${producedBy[code] ? " — reachable only as control evidence" : " — this code is dark"}</div>`;
  const upstream = (producedBy[code] || []).map(([ci, ri]) => ctlBlock(ci, ri, true)).join("")
    || '<div class="muted">no control produces this</div>';
  const downstream = (triggeredBy[code] || []).map(([ci, ri]) => ctlBlock(ci, ri, false)).join("")
    || '<div class="muted">no control watches this</div>';
  $("view").innerHTML = `<div class="cols">
    <div class="pane"><h2>Emitted by</h2><div class="card">${emit}</div>
      <h2>Produced by controls</h2>${upstream}</div>
    <div class="pane"><h2>Event</h2><div class="card">
      <div class="center-code code">${esc(code)}</div>${badge(code)}
      <div class="src" style="margin-top:6px">subject: ${esc(c.s)} &middot; ${esc(c.k)}</div></div></div>
    <div class="pane"><h2>Triggers &rarr; must produce</h2>${downstream}</div>
  </div>`;
}

function renderControl(uid) {
  const ci = G.controls.findIndex(c => c.u === uid);
  if (ci < 0) { $("view").innerHTML = `<p class="muted">unknown control: ${esc(uid)}</p>`; return; }
  const c = G.controls[ci];
  const rules = c.r.map((r, ri) => ctlBlock(ci, ri, true)).join("");
  $("view").innerHTML = `<div class="pane" style="max-width:820px">
    <h2>Control</h2><div class="card">
      <div class="center-code">${esc(c.u)} — ${esc(c.t)}</div>
      <div class="pol">${esc(c.p)}${c.d ? ` &middot; <a href="${esc(c.d)}">policy text</a>` : ""}</div></div>
    <h2>Rules (trigger &rarr; produced)</h2>${rules}</div>`;
}

function renderHome() {
  const subj = {};
  G.controls.forEach(c => c.r.forEach(r => {
    [r.tr, ...r.pr].forEach(code => {
      const s = (G.codes[code] || {}).s || code.split(".")[0];
      subj[s] = (subj[s] || 0) + 1;
    });
  }));
  const top = Object.entries(subj).sort((a, b) => b[1] - a[1]);
  $("view").innerHTML = `<h2 style="font-size:12px;color:var(--dim);
      text-transform:uppercase;letter-spacing:.08em;margin-top:14px">
      Subjects by choreography degree — click to browse</h2>
    <div class="subject-grid">` + top.map(([s, n]) => `
      <div class="card clickable" onclick="go('s:${s}')">
        <span class="code">${esc(s)}</span>
        <div class="count">${n} rule endpoints</div></div>`).join("") + "</div>";
}

function renderSubject(s) {
  const list = Object.keys(G.codes).filter(k => G.codes[k].s === s).sort();
  $("view").innerHTML = `<h2 style="font-size:12px;color:var(--dim);
      text-transform:uppercase;letter-spacing:.08em;margin-top:14px">
      ${esc(s)} — ${list.length} codes</h2>
    <div class="subject-grid">` + list.map(code => `
      <div class="card">${codeLink(code)}</div>`).join("") + "</div>";
}

function go(target) { location.hash = target; }
function route() {
  const h = decodeURIComponent(location.hash.slice(1));
  $("crumbs").innerHTML = h ? `<span onclick="go('')">overview</span> / ${esc(h.slice(2))}` : "";
  if (h.startsWith("c:")) renderCode(h.slice(2));
  else if (h.startsWith("k:")) renderControl(h.slice(2));
  else if (h.startsWith("s:")) renderSubject(h.slice(2));
  else renderHome();
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);

$("stats").innerHTML = `<b>${G.meta.codes}</b> registered codes &middot;
  <b>${G.meta.live}</b> live &middot; <b>${G.meta.controls}</b> controls &middot;
  <b>${G.meta.rules}</b> choreography rules`;
const dl = $("allcodes");
Object.keys(G.codes).sort().forEach(c => {
  const o = document.createElement("option"); o.value = c; dl.appendChild(o);
});
G.controls.forEach(c => {
  const o = document.createElement("option"); o.value = c.u; dl.appendChild(o);
});
$("q").addEventListener("change", () => {
  const v = $("q").value.trim();
  if (!v) return;
  go(G.codes[v] ? "c:" + v : "k:" + v);
  $("q").value = "";
});
route();
</script>
</body>
</html>
"""


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    data = build_data()
    payload = json.dumps(data, separators=(",", ":"), sort_keys=True)
    text = PAGE.replace("__DATA__", payload.replace("</", "<\\/"))

    if args.check:
        if generated.check_or_write({OUT: text}, check=True,
                                    rerun_hint="scripts/build_choreography.py"):
            return 1
        print(f"choreography OK — {data['meta']['codes']} codes, "
              f"{data['meta']['rules']} rules.")
        return 0

    OUT.parent.mkdir(parents=True, exist_ok=True)
    generated.check_or_write({OUT: text}, check=False, rerun_hint="")
    print(f"wrote choreography explorer — {data['meta']['codes']} codes "
          f"({data['meta']['live']} live), {data['meta']['controls']} controls, "
          f"{data['meta']['rules']} rules")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
