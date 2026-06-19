#!/usr/bin/env python3
"""
extract_controls.py — Build a structured catalogue of every control across the
Pynthia policies-and-procedures repo.

Walks each policy markdown file (Table-First / Design-Overlay v2 format), parses
each control section, and emits a single JSON document. For every control it
captures:

  - identity      : control_id, title, anchor, source policy + metadata
  - regulatory    : the WHY (Reg cite) bullet, including every hyperlink
  - system        : the SYSTEM BEHAVIOR prose
  - events        : the EVENTS table, row by row, decomposed into
                    trigger / inputs / outputs / deadline plus the raw codes
  - control_rules : the same EVENTS rows normalized into flat, DB-ready rule
                    records (trigger_event / required_inputs / produced_events /
                    deadline_timer / deadline_text) — the projection that feeds
                    `x-control-rules` in core-api.yaml and the Supabase
                    `control_rule` table
  - alerts        : the ALERTS/METRICS prose
  - api_references: every backticked dotted code used by the control, classified
                    against core-vocabulary.json (the Cassandra Banking Core API model)
                    as a registered event, a registered field, or an
                    unregistered "target" code not yet in the API spec.

Usage:
    python3 scripts/extract_controls.py                 # writes controls.json at repo root
    python3 scripts/extract_controls.py -o out.json     # custom output path
    python3 scripts/extract_controls.py --root /path     # custom repo root

The script is dependency-free (standard library only).
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone

from code_format import event_struct  # canonical object.property.action decomposition

# --------------------------------------------------------------------------- #
# File discovery
# --------------------------------------------------------------------------- #

# Directory names (anywhere in the path) that never contain authored policies.
EXCLUDE_PATH_PARTS = {".git", ".claude", ".skills", ".cache", "references", "scripts", "core-api-loop"}
# .claude holds session git worktrees (.claude/worktrees/*) — full stale copies of the policy
# tree. Scanning them double-counts policies and inflates the demand with phantom duplicates.

# Top-level markdown files that are repo scaffolding, not policies.
EXCLUDE_FILENAMES = {
    "README.md", "SUMMARY.md", "STATUS.md", "NOTES.md",
    "gh-markdown-test.md",
}
EXCLUDE_FILENAME_PREFIXES = ("README",)


def find_policy_files(root: str) -> list[str]:
    """Return absolute paths to every authored policy markdown file."""
    out: list[str] = []
    for dirpath, dirnames, filenames in os.walk(root):
        # prune excluded directories in-place so os.walk doesn't descend
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_PATH_PARTS]
        rel_parts = set(os.path.relpath(dirpath, root).split(os.sep))
        if rel_parts & EXCLUDE_PATH_PARTS:
            continue
        for fn in filenames:
            if not fn.endswith(".md"):
                continue
            if fn in EXCLUDE_FILENAMES or fn.startswith(EXCLUDE_FILENAME_PREFIXES):
                continue
            out.append(os.path.join(dirpath, fn))
    return sorted(out)


# --------------------------------------------------------------------------- #
# Frontmatter + control parsing
# --------------------------------------------------------------------------- #

FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)

# "## EP-01 — Title  {#anchor}"  (em-dash separator, optional anchor)
CONTROL_HEADING_RE = re.compile(
    r"^##[ \t]+"
    r"(?P<id>[A-Z]{2,5}-\d+[A-Za-z]?)"   # control id e.g. EP-01, FL-31, BS-02
    r"[ \t]*(?:—|–|-)[ \t]*"             # em/en/hyphen dash separator
    r"(?P<title>.+?)"                    # title (non-greedy)
    r"(?:[ \t]*\{#(?P<anchor>[^}]+)\})?" # optional {#anchor}
    r"[ \t]*$",
    re.MULTILINE,
)

# Any "## ..." heading — used to bound a control's body.
ANY_H2_RE = re.compile(r"^##[ \t]+.+$", re.MULTILINE)

# Bullet section labels inside a control body.
SECTION_LABELS = {
    "why": re.compile(r"\*\*WHY[^*]*:\*\*", re.IGNORECASE),
    "system_behavior": re.compile(r"\*\*SYSTEM BEHAVIOR:?\*\*", re.IGNORECASE),
    "events": re.compile(r"\*\*EVENTS:?\*\*", re.IGNORECASE),
    "alerts_metrics": re.compile(r"\*\*ALERTS\s*/\s*METRICS:?\*\*", re.IGNORECASE),
}

MARKDOWN_LINK_RE = re.compile(r"\[(?P<text>[^\]]+)\]\((?P<url>[^)]+)\)")
BACKTICK_RE = re.compile(r"`([^`]+)`")
# A dotted API-style code, e.g. eps.proposal.submitted, ach_transfer.amount
DOTTED_CODE_RE = re.compile(r"^[a-z][a-z0-9_]*(?:\.[a-z0-9_\[\]]+)+$")
STATUS_WORD_RE = re.compile(r"^[a-z][a-z0-9_]+$")


def parse_frontmatter(text: str) -> dict:
    m = FRONTMATTER_RE.match(text)
    meta: dict = {}
    if not m:
        return meta
    body = m.group(1)
    # lightweight YAML: only the simple scalar keys we care about
    for key in ("title", "owner", "version", "effective", "next_review"):
        km = re.search(rf"^{key}:[ \t]*(.+?)[ \t]*$", body, re.MULTILINE)
        if km:
            meta[key] = km.group(1).strip().strip('"').strip("'")
    return meta


def slug_from_path(root: str, path: str) -> str:
    rel = os.path.relpath(path, root)
    parent = os.path.dirname(rel)
    return parent if parent and parent != "." else os.path.splitext(os.path.basename(rel))[0]


def split_sections(body: str) -> dict[str, str]:
    """Split a control body into the four labelled bullet sections."""
    # Find the char offset of each known label.
    hits: list[tuple[int, str]] = []
    for name, rx in SECTION_LABELS.items():
        m = rx.search(body)
        if m:
            hits.append((m.start(), name))
    hits.sort()
    sections: dict[str, str] = {}
    for i, (start, name) in enumerate(hits):
        end = hits[i + 1][0] if i + 1 < len(hits) else len(body)
        sections[name] = body[start:end].strip()
    return sections


def extract_codes(text: str) -> tuple[list[str], list[str]]:
    """Return (dotted_codes, status_words) found in backticks, in order, deduped."""
    dotted: list[str] = []
    statuses: list[str] = []
    seen_d, seen_s = set(), set()
    for raw in BACKTICK_RE.findall(text):
        tok = raw.strip()
        if DOTTED_CODE_RE.match(tok):
            base = tok.rstrip("[]")
            if base not in seen_d:
                seen_d.add(base)
                dotted.append(base)
        elif STATUS_WORD_RE.match(tok) and "_" in tok or tok in {
            "pending", "submitted", "rejected", "approved", "declined",
            "active", "closed", "open",
        }:
            if tok not in seen_s:
                seen_s.add(tok)
                statuses.append(tok)
    return dotted, statuses


def clean_label(cell: str) -> str:
    """Strip backtick codes and the punctuation fragments they leave behind."""
    txt = BACKTICK_RE.sub("", cell)          # drop `code` spans
    txt = txt.replace("→", " ")              # arrows only linked codes
    # tidy stray separators left at the edges of parentheticals
    txt = re.sub(r"\(\s*[,/;]+\s*", "(", txt)
    txt = re.sub(r"\s*[,/;]+\s*\)", ")", txt)
    # drop parentheticals that no longer contain any letters, e.g. "( )", "( / )"
    txt = re.sub(r"\(\s*[^A-Za-z)]*\s*\)", "", txt)
    txt = re.sub(r"\s+([,;])", r"\1", txt)   # space before comma/semicolon
    txt = re.sub(r"([,;])\s*\1", r"\1", txt)  # doubled comma/semicolon
    txt = re.sub(r"\(\s+", "(", txt)         # padding just inside "("
    txt = re.sub(r"\s+\)", ")", txt)         # padding just inside ")"
    txt = re.sub(r"\s{2,}", " ", txt)
    return txt.strip(" ,;/—–-")


def parse_events_table(section: str) -> list[dict]:
    """Parse the markdown EVENTS table into structured rows."""
    rows = [ln for ln in section.splitlines() if ln.strip().startswith("|")]
    if len(rows) < 2:
        return []

    def split_row(line: str) -> list[str]:
        cells = line.strip().strip("|").split("|")
        return [c.strip() for c in cells]

    header = [h.lower() for h in split_row(rows[0])]
    # map column index -> logical role
    role_of: dict[int, str] = {}
    for i, h in enumerate(header):
        if "when" in h or "trigger" in h:
            role_of[i] = "trigger"
        elif "need" in h or "input" in h:
            role_of[i] = "inputs"
        elif "produc" in h or "output" in h or "logged" in h:
            role_of[i] = "outputs"
        elif "within" in h or "deadline" in h or "timing" in h:
            role_of[i] = "within"

    events: list[dict] = []
    for line in rows[2:]:  # skip header + separator
        cells = split_row(line)
        if not any(cells):
            continue
        trigger_cell = inputs_cell = outputs_cell = within_cell = ""
        for i, cell in enumerate(cells):
            role = role_of.get(i)
            if role == "trigger":
                trigger_cell = cell
            elif role == "inputs":
                inputs_cell = cell
            elif role == "outputs":
                outputs_cell = cell
            elif role == "within":
                within_cell = cell

        trig_codes, trig_status = extract_codes(trigger_cell)
        in_codes, _ = extract_codes(inputs_cell)
        out_codes, out_status = extract_codes(outputs_cell)
        within_codes, _ = extract_codes(within_cell)

        events.append({
            "trigger": {
                "label": clean_label(trigger_cell),
                "code": trig_codes[0] if trig_codes else None,
                "status": trig_status[0] if trig_status else None,
            },
            "inputs": [{"label": clean_label(inputs_cell), "codes": in_codes}]
            if inputs_cell else [],
            "outputs": [{
                "label": clean_label(outputs_cell),
                "codes": out_codes,
                "status": out_status[0] if out_status else None,
            }] if outputs_cell else [],
            "within": clean_label(within_cell),
            "within_timer_codes": within_codes,
            "all_codes": sorted(set(trig_codes + in_codes + out_codes + within_codes)),
        })
    return events


DEADLINE_ENFORCED_RE = re.compile(r"\(\s*enforced by[^)]*\)", re.IGNORECASE)


def normalize_rules(control_id: str, policy: str, events: list[dict],
                    actions: set[str]) -> list[dict]:
    """Project parsed EVENTS rows into flat, DB-ready control_rule records.

    One record per EVENTS row: the trigger that opens the obligation, the inputs
    that must be present, the event(s) whose logging satisfies the control, and
    the deadline timer that bounds it. This is the shape `x-control-rules` (and
    the Supabase `control_rule` table) consume — the rule, not just the codes.

    Event codes are also decomposed into the canonical object.property.action
    primitives (against the registered action vocabulary) so the rule carries
    its structure, not just the raw string.
    """
    rules: list[dict] = []
    for ev in events:
        trigger = (ev.get("trigger") or {}).get("code")
        required_inputs: list[str] = []
        for grp in ev.get("inputs", []):
            required_inputs.extend(grp.get("codes", []))
        produced_events: list[str] = []
        for grp in ev.get("outputs", []):
            produced_events.extend(grp.get("codes", []))
        timers = ev.get("within_timer_codes", [])
        deadline_text = DEADLINE_ENFORCED_RE.sub("", ev.get("within", "")).strip(" ,;—–-")
        produced = sorted(set(produced_events))
        rules.append({
            "control_id": control_id,
            "policy": policy,
            "trigger_event": trigger,
            "trigger": event_struct(trigger, actions) if trigger else None,
            "required_inputs": sorted(set(required_inputs)),
            "produced_events": produced,
            "produced": [event_struct(p, actions) for p in produced],
            "deadline_timer": timers[0] if timers else None,
            "deadline_text": deadline_text or None,
        })
    return rules


def parse_control_body(body: str) -> dict:
    sections = split_sections(body)

    why = sections.get("why", "")
    citations = [
        {"text": m.group("text"), "url": m.group("url")}
        for m in MARKDOWN_LINK_RE.finditer(why)
    ]

    events = parse_events_table(sections.get("events", ""))

    # All dotted codes / statuses across the whole control body.
    all_dotted, all_status = extract_codes(body)

    return {
        "regulatory_citations": citations,
        "why_text": clean_inline(why),
        "system_behavior": clean_inline(sections.get("system_behavior", "")),
        "alerts_metrics": clean_inline(sections.get("alerts_metrics", "")),
        "events": events,
        "_all_dotted": all_dotted,
        "_all_status": all_status,
    }


def clean_inline(section: str) -> str:
    """Drop the leading '- **LABEL:**' marker and tidy whitespace."""
    txt = re.sub(r"^-?\s*\*\*[^*]+:\*\*\s*", "", section.strip())
    return txt.strip()


# --------------------------------------------------------------------------- #
# API cross-reference
# --------------------------------------------------------------------------- #

def load_api_index(vocab_path: str):
    """Return (event_codes:set, field_paths:set, field_meta:dict) from core-vocabulary.json."""
    if not os.path.exists(vocab_path):
        return set(), set(), {}, None
    with open(vocab_path, encoding="utf-8") as fh:
        v = json.load(fh)
    event_codes = set()
    for e in v.get("events", []):
        if e.get("code"):
            event_codes.add(e["code"])
        if e.get("name"):
            event_codes.add(e["name"])
    field_paths = set()
    for f in v.get("fields", []):
        if f.get("path"):
            field_paths.add(f["path"])
    api_meta = {
        "spec_title": v.get("meta", {}).get("spec_title"),
        "spec_version": v.get("meta", {}).get("spec_version"),
        "events": v.get("stats", {}).get("events"),
        "fields": v.get("stats", {}).get("fields"),
        "entities": v.get("stats", {}).get("entities"),
    }
    return event_codes, field_paths, api_meta, v


def classify_codes(dotted: list[str], event_codes: set, field_paths: set) -> dict:
    """Bucket each dotted code as registered event, registered field, or unregistered."""
    events, fields, unregistered = [], [], []
    for code in dotted:
        if code in event_codes:
            events.append(code)
        elif code in field_paths:
            fields.append(code)
        else:
            unregistered.append(code)
    return {
        "events": sorted(set(events)),
        "fields": sorted(set(fields)),
        "unregistered": sorted(set(unregistered)),
        "all": sorted(set(dotted)),
    }


# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #

def build(root: str) -> dict:
    vocab_path = os.path.join(root, "core-vocabulary.json")
    event_codes, field_paths, api_meta, vocab = load_api_index(vocab_path)
    actions = set((vocab or {}).get("event_types", []))

    policy_files = find_policy_files(root)
    controls: list[dict] = []
    policies_seen: set[str] = set()

    for path in policy_files:
        with open(path, encoding="utf-8") as fh:
            text = fh.read()
        fm = parse_frontmatter(text)
        slug = slug_from_path(root, path)

        # Locate each control heading and the body up to the next H2.
        headings = list(CONTROL_HEADING_RE.finditer(text))
        if not headings:
            continue
        policies_seen.add(slug)

        # offsets of all H2 headings, to bound bodies
        all_h2 = [m.start() for m in ANY_H2_RE.finditer(text)]

        for hm in headings:
            start = hm.end()
            # next H2 after this heading
            later = [o for o in all_h2 if o > hm.start()]
            end = later[0] if later else len(text)
            body = text[start:end]

            parsed = parse_control_body(body)
            api = classify_codes(parsed.pop("_all_dotted"), event_codes, field_paths)
            statuses = parsed.pop("_all_status")

            controls.append({
                "control_id": hm.group("id"),
                "title": hm.group("title").strip(),
                "anchor": hm.group("anchor"),
                "policy": slug,
                "policy_title": fm.get("title"),
                "policy_owner": fm.get("owner"),
                "policy_version": fm.get("version"),
                "policy_effective": fm.get("effective"),
                "source_file": os.path.relpath(path, root),
                "regulatory_citations": parsed["regulatory_citations"],
                "why_text": parsed["why_text"],
                "system_behavior": parsed["system_behavior"],
                "alerts_metrics": parsed["alerts_metrics"],
                "events": parsed["events"],
                "control_rules": normalize_rules(
                    hm.group("id"), slug, parsed["events"], actions
                ),
                "api_references": {
                    **api,
                    "statuses": statuses,
                },
            })

    # roll-up stats
    n_events = sum(len(c["events"]) for c in controls)
    n_rules = sum(len(c["control_rules"]) for c in controls)
    all_codes = set()
    reg_events = set()
    reg_fields = set()
    unreg = set()
    for c in controls:
        a = c["api_references"]
        all_codes.update(a["all"])
        reg_events.update(a["events"])
        reg_fields.update(a["fields"])
        unreg.update(a["unregistered"])

    return {
        "meta": {
            "generator": "scripts/extract_controls.py",
            "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "repo_root": os.path.basename(os.path.abspath(root)),
            "api_model": api_meta,
        },
        "stats": {
            "policies": len(policies_seen),
            "controls": len(controls),
            "event_rows": n_events,
            "control_rules": n_rules,
            "unique_api_codes": len(all_codes),
            "registered_event_codes": len(reg_events),
            "registered_field_codes": len(reg_fields),
            "unregistered_codes": len(unreg),
        },
        "controls": controls,
    }


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="Extract all policy controls into a JSON catalogue.")
    ap.add_argument("--root", default=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                    help="Repo root (default: parent of scripts/).")
    ap.add_argument("-o", "--output", default=None,
                    help="Output path (default: <root>/controls.json).")
    args = ap.parse_args(argv)

    root = os.path.abspath(args.root)
    out = args.output or os.path.join(root, "controls.json")

    doc = build(root)
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(doc, fh, indent=2, ensure_ascii=False)
        fh.write("\n")

    s = doc["stats"]
    print(f"Wrote {out}")
    print(f"  policies            : {s['policies']}")
    print(f"  controls            : {s['controls']}")
    print(f"  event rows          : {s['event_rows']}")
    print(f"  control rules       : {s['control_rules']}")
    print(f"  unique API codes    : {s['unique_api_codes']}")
    print(f"  registered events   : {s['registered_event_codes']}")
    print(f"  registered fields   : {s['registered_field_codes']}")
    print(f"  unregistered codes  : {s['unregistered_codes']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
