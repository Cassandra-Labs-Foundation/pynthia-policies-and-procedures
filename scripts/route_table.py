#!/usr/bin/env python3
"""The one Python parser of the router's route table.

The table lives in two files — hand-written entries in api/index.ts, the
spec-generated remainder in api/routes.gen.ts — and its text shape is a
contract with several consumers (route parity, the crosswalk's routed-handler
scoping, the paths importer). Before this module each consumer carried its own
copy of the same regexes and its own answer to the two-file split; a change to
the entry format degraded whichever copy was forgotten. Parse it here, once.

(route_gating.test.ts keeps a TypeScript twin of these regexes — it must run
in the deno suite — so a format change touches exactly two parsers, both
named, instead of five anonymous ones.)

Stdlib-only so the core-ci gates can import it.
"""
import pathlib
import re

ENTRY_RE = re.compile(r"\{\s*(?://[^\n]*\n\s*)*method:.*?\n  \},", re.S)
ENDPOINT_RE = re.compile(r'endpoint: "([^"]+)"')
HANDLER_RE = re.compile(r"await ([A-Za-z0-9_]+)\(")
ACTORS_RE = re.compile(r"actors: \[([^\]]*)\]")
TIER_RE = re.compile(r'tier: "([a-z]+)"')
IMPORT_RE = re.compile(r'import\s*\{([^}]*)\}\s*from\s*"\./([a-z_0-9]+)\.ts"')

ROUTE_FILES = ("index.ts", "routes.gen.ts")


def _table_text(api_dir) -> str:
    api_dir = pathlib.Path(api_dir)
    out = []
    for name in ROUTE_FILES:
        f = api_dir / name
        if f.exists():
            out.append(f.read_text())
    return "\n".join(out)


def parse_routes(api_dir) -> list:
    """[{method, path, endpoint, tier, public, handler, module, actors}] for
    every entry across both route files."""
    text = _table_text(api_dir)
    mod_of = imports_by_module(api_dir)
    handler_module = {fn: mod for mod, fns in mod_of.items() for fn in fns}
    routes = []
    for e in ENTRY_RE.findall(text):
        ep = ENDPOINT_RE.search(e).group(1)
        method, path = ep.split(" ", 1)
        fn = HANDLER_RE.search(e)
        actors = ACTORS_RE.search(e)
        routes.append({
            "method": method,
            "path": path,
            "endpoint": ep,
            "tier": TIER_RE.search(e).group(1),
            "public": "public: true" in e,
            "handler": fn.group(1) if fn else None,
            "module": handler_module.get(fn.group(1)) if fn else None,
            "actors": [a.strip().strip("\"'") for a in actors.group(1).split(",")]
                      if actors else None,
        })
    return routes


def imports_by_module(api_dir) -> dict:
    """{module stem: set of imported names} across both route files."""
    out: dict = {}
    for names, mod in IMPORT_RE.findall(_table_text(api_dir)):
        clean = {n.strip().removeprefix("type ").split(" as ")[0].strip()
                 for n in names.replace("\n", " ").split(",")}
        out.setdefault(mod, set()).update(n for n in clean if n)
    return out


def endpoints(api_dir) -> set:
    """{(METHOD, path)} for every entry across both route files."""
    return {(r["method"], r["path"]) for r in parse_routes(api_dir)}
