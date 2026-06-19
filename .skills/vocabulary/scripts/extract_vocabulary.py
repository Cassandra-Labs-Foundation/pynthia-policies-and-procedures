#!/usr/bin/env python3
"""Extract the engineering vocabulary as structured Markdown.

Reads core-vocabulary.json (the parsed spec of engineering's API) and emits a
regulator-readable Markdown block suitable for Section 5 ("System Design
Notes") of a policy prompt.md.

The output is grouped by entity. Each entity sub-section lists its fields
with type, PII flag, and a one-line description. Events are listed from
the `events` array; if that array is empty the script emits a clearly
labelled warning and offers the endpoints list as candidate signals for
event codes the policy author could name.

By design this script does NOT filter the vocabulary to a particular
policy's concerns — the downstream meta-prompt decides what is relevant.

Usage:
  python3 extract_vocabulary.py                 # default: read ../../../core-vocabulary.json, write to stdout
  python3 extract_vocabulary.py -i /path/to/core-vocabulary.json
  python3 extract_vocabulary.py -o out.md       # write to file
  python3 extract_vocabulary.py --max-desc 140  # cap one-line descriptions
"""

import argparse
import json
import os
import sys
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_INPUT = SCRIPT_DIR.parent.parent.parent / "core-vocabulary.json"


def one_line(text, max_chars=120):
    """Collapse multi-line descriptions to a single readable line."""
    if not text:
        return ""
    # Keep first paragraph, collapse whitespace, strip markdown list markers.
    first_para = text.strip().split("\n\n", 1)[0]
    flat = " ".join(first_para.split())
    if len(flat) > max_chars:
        flat = flat[: max_chars - 1].rstrip() + "…"
    return flat


def format_type(field):
    """Render a field's type, including enum values when present."""
    t = field.get("type") or "unknown"
    enums = field.get("enum_values")
    if enums:
        enum_str = ", ".join(enums[:6])
        if len(enums) > 6:
            enum_str += f", …(+{len(enums) - 6})"
        return f"{t} (enum: {enum_str})"
    return t


def escape_cell(s):
    """Make a string safe to drop into a Markdown table cell."""
    if s is None:
        return ""
    return str(s).replace("|", "\\|").replace("\n", " ")


def render_meta(data):
    meta = data.get("meta", {})
    stats = data.get("stats", {})
    lines = ["# System Design Notes — Engineering Vocabulary", ""]
    lines.append(
        f"> Generated from `core-vocabulary.json` — "
        f"**{meta.get('spec_title', 'Unknown spec')}** "
        f"v{meta.get('spec_version', '?')}"
    )
    lines.append(f"> Parsed at {meta.get('parsed_at', 'unknown')}")
    lines.append(
        "> Totals: "
        f"{stats.get('entities', 0)} entities · "
        f"{stats.get('fields', 0)} fields · "
        f"{stats.get('computed_fields', 0)} computed fields · "
        f"{stats.get('events', 0)} events · "
        f"{stats.get('endpoints', 0)} endpoints · "
        f"{stats.get('state_machines', 0)} state machines · "
        f"{stats.get('plugins', 0)} plugins"
    )
    lines.append("")
    lines.append(
        "This block is a verbatim dump of the current engineering "
        "vocabulary. Downstream regeneration decides what to reference in "
        "the Design Overlay v2 control blocks — do not pre-filter."
    )
    lines.append("")
    return lines


def render_entities(data, max_desc):
    lines = ["## Entities and fields", ""]
    entities = data.get("entities", [])
    fields_by_entity = {}
    for f in data.get("fields", []):
        fields_by_entity.setdefault(f.get("entity"), []).append(f)

    if not entities:
        lines.append("_No entities defined in core-vocabulary.json._")
        lines.append("")
        return lines

    for ent in entities:
        name = ent.get("name", "?")
        schema = ent.get("schema_name", name)
        field_count = ent.get("field_count", 0)
        retention = ent.get("retention")
        state_field = ent.get("state_machine_field")
        control_refs = ent.get("control_refs") or []

        heading_extras = [f"schema: `{schema}`", f"{field_count} fields"]
        if state_field:
            heading_extras.append(f"state field: `{state_field}`")
        if retention:
            heading_extras.append(f"retention: {retention}")
        lines.append(f"### `{name}`  ({' · '.join(heading_extras)})")
        if control_refs:
            lines.append(f"_Bound controls on entity: {', '.join(control_refs)}_")
        lines.append("")

        ent_fields = fields_by_entity.get(schema) or fields_by_entity.get(name) or []
        if not ent_fields:
            lines.append("_No fields found for this entity._")
            lines.append("")
            continue

        lines.append("| Field | Type | Required | PII | Bound controls | Description |")
        lines.append("|---|---|---|---|---|---|")
        for fld in ent_fields:
            field_name = fld.get("field", "?")
            t = format_type(fld)
            required = "✓" if fld.get("required") else ""
            pii = "✓" if fld.get("pii") else ""
            bc = fld.get("bound_controls") or []
            bc_str = ", ".join(bc) if bc else ""
            desc = one_line(fld.get("description"), max_chars=max_desc)
            lines.append(
                "| "
                + " | ".join(
                    [
                        f"`{field_name}`",
                        escape_cell(t),
                        required,
                        pii,
                        escape_cell(bc_str),
                        escape_cell(desc),
                    ]
                )
                + " |"
            )
        lines.append("")
    return lines


def render_events_and_endpoints(data):
    lines = []
    events = data.get("events", [])
    endpoints = data.get("endpoints", [])

    lines.append("## Events")
    lines.append("")
    if events:
        lines.append("| Event | Entity | Description |")
        lines.append("|---|---|---|")
        for ev in events:
            lines.append(
                "| "
                + " | ".join(
                    [
                        f"`{escape_cell(ev.get('name') or ev.get('code') or '?')}`",
                        escape_cell(ev.get("entity") or ""),
                        escape_cell(one_line(ev.get("description"))),
                    ]
                )
                + " |"
            )
        lines.append("")
    else:
        lines.append(
            "> ⚠️  **Vocabulary warning — no events defined.** "
            "The `events` array in core-vocabulary.json is empty. Any `(event.code)` "
            "reference the policy wants to use must be introduced by engineering "
            "and registered in the spec before the Design Overlay v2 blocks can "
            "cite it. The endpoints list below is provided as candidate signals "
            "from which engineering could derive event codes "
            "(e.g., `POST /accounts` → `account.created`)."
        )
        lines.append("")

    lines.append("## Endpoints")
    lines.append("")
    if not endpoints:
        lines.append("_No endpoints defined in core-vocabulary.json._")
        lines.append("")
        return lines

    lines.append("| Method | Path | Summary | Control refs | Audit events |")
    lines.append("|---|---|---|---|---|")
    for ep in endpoints:
        method = ep.get("method", "")
        path = ep.get("path", "")
        summary = one_line(ep.get("summary"))
        control_refs = ", ".join(ep.get("control_refs") or [])
        audit_events = ", ".join(ep.get("audit_events") or [])
        lines.append(
            "| "
            + " | ".join(
                [
                    f"`{method}`",
                    f"`{path}`",
                    escape_cell(summary),
                    escape_cell(control_refs),
                    escape_cell(audit_events),
                ]
            )
            + " |"
        )
    lines.append("")
    return lines


def render_state_machines_and_plugins(data):
    lines = []
    sms = data.get("state_machines", [])
    lines.append("## State machines")
    lines.append("")
    if sms:
        for sm in sms:
            name = sm.get("name", "?")
            field = sm.get("field", "")
            states = ", ".join(sm.get("states") or [])
            lines.append(f"- **{name}** (`{field}`): {states}")
        lines.append("")
    else:
        lines.append("_No state machines defined in core-vocabulary.json._")
        lines.append("")

    plugins = data.get("plugins", [])
    lines.append("## Plugins")
    lines.append("")
    if plugins:
        for p in plugins:
            lines.append(f"- **{p.get('name', '?')}** — {one_line(p.get('description'))}")
        lines.append("")
    else:
        lines.append("_No plugins defined in core-vocabulary.json._")
        lines.append("")
    return lines


def render_tasks_and_timers(data):
    """Render task/timer vocabulary registered via the migration map.

    The lean spec models deadlines and scheduled work as instances of the
    generic Task resource (type + subject_ref + due_at), not as distinct
    per-domain fields. This section tells the policy generator which
    domain task/timer codes are already registered under that pattern —
    codes listed here must NOT be flagged as missing vocabulary.
    """
    lines = ["## Tasks & timers", ""]
    tasks = data.get("tasks", [])
    task_types = data.get("task_types", [])
    if not tasks and not task_types:
        lines.append("_No tasks defined in core-vocabulary.json._")
        lines.append("")
        return lines

    if task_types:
        lines.append(
            "Registered task types (generic `Task` resource: `type` · "
            "`subject_ref` · `due_at` · `status`): "
            + ", ".join(f"`{t}`" for t in task_types)
        )
        lines.append("")

    if tasks:
        lines.append(
            "Domain task/timer codes below are registered — each maps to a "
            "`Task` instance. Timer codes (`*_due_at`, `*_expires_at`) are "
            "the `due_at` of the named task; cite them in the *Within* "
            "column as registered timers."
        )
        lines.append("")
        lines.append("| Code | Task type | Subject | Timer of |")
        lines.append("|---|---|---|---|")
        for t in tasks:
            timer_of = t.get("timer_of") or ("(self)" if t.get("is_timer") else "")
            lines.append(
                "| "
                + " | ".join(
                    [
                        f"`{escape_cell(t.get('name', '?'))}`",
                        f"`{escape_cell(t.get('type', ''))}`",
                        escape_cell(t.get("subject", "")),
                        f"`{escape_cell(timer_of)}`" if timer_of else "",
                    ]
                )
                + " |"
            )
        lines.append("")
    return lines


def render_composition_grammar(data):
    """Render the closed-world rules for coining any NEW code.

    The lean spec deliberately registers generic actions (verbs) and task types
    and composes domain codes as **object.property.action** (events) or
    object + task type (tasks). The three pieces are the primitives:

      - object   : a registered entity / code prefix  (the noun)
      - property : a registered field of that object  (the data point)
      - action   : a registered action verb           (what happened)

    An event is one combination of those three: a property of an object
    undergoing an action — `record.retention_clock.set`. Whole-object lifecycle
    events carry no property — `incident.classified`. A policy must never invent
    codes outside this grammar.
    """
    verbs = data.get("event_types", [])
    task_types = data.get("task_types", [])
    subjects = data.get("subjects", [])
    if not (verbs or subjects):
        return []

    lines = ["## Composition grammar (rules for any NEW code)", ""]
    lines.append(
        "The engineering vocabulary is **closed-world and compositional**. Every "
        "event code is `object.property.action` — a registered object, a property "
        "(field) of that object, and a registered action. Before citing any code "
        "not listed elsewhere in this document, apply these rules in order:"
    )
    lines.append("")
    lines.append(
        "1. **Reuse first.** Search the field tables above for an existing "
        "`object.property` with the same meaning — including the same property "
        "under a different object (e.g. prefer `incident.description` over coining "
        "`complaint.description` if the complaint is modeled as an incident). "
        "Do the same for actions and tasks/timers."
    )
    lines.append(
        "2. **Compose, don't invent.** A new *event* code must be "
        "`<registered object>.<property>.<registered action>`, where the property "
        "is a registered field of that object and the action is one of the "
        "registered actions below. Omit the property only for a whole-object "
        "lifecycle event (`<object>.<action>`, e.g. `record.disposed`). A new "
        "*task or timer* code must use a registered task type — deadlines are "
        "`Task` instances (`type` + `subject_ref` + `due_at`), never a new "
        "per-domain `*_due_at` field."
    )
    lines.append(
        "3. **Stay inside the registries.** Do not mint a new object (prefix) or "
        "a new action. If no registered object or action fits, that is a gap to "
        "flag in Assumptions & Gaps, not a license to create one. A new "
        "*property* on a registered object is allowed when no registered field "
        "fits — cite it and flag it as provisional."
    )
    lines.append("")
    if subjects:
        lines.append(
            f"**Registered objects ({len(subjects)}):** "
            + ", ".join(f"`{s}`" for s in subjects)
        )
        lines.append("")
    if verbs:
        lines.append(
            f"**Registered actions ({len(verbs)}):** "
            + ", ".join(f"`{v}`" for v in verbs)
        )
        lines.append("")
    if task_types:
        lines.append(
            f"**Registered task types ({len(task_types)}):** "
            + ", ".join(f"`{t}`" for t in task_types)
        )
        lines.append("")
    return lines


def render_provisional(data):
    """Render migration-known codes not yet registered in the spec.

    These already have an agreed target spelling. A policy that needs one
    of these concepts must reuse the spelling below verbatim — never coin
    a variant — and may cite it as provisional in Assumptions & Gaps.
    """
    prov = data.get("provisional_fields", [])
    lines = ["## Provisional codes (agreed target naming — reuse, don't re-coin)", ""]
    if not prov:
        lines.append("_No provisional codes tracked in core-vocabulary.json._")
        lines.append("")
        return lines
    lines.append(
        f"The {len(prov)} codes below are known to the migration map but not "
        "yet registered in the spec. Their spelling is already agreed with "
        "engineering: if the policy needs one of these concepts, use the "
        "exact code below (and list it in the Assumptions & Gaps provisional-"
        "vocabulary bullet). Do not invent a near-duplicate."
    )
    lines.append("")
    by_prefix = {}
    for c in prov:
        by_prefix.setdefault(c.partition(".")[0], []).append(c)
    for prefix in sorted(by_prefix):
        codes = ", ".join(f"`{c}`" for c in sorted(by_prefix[prefix]))
        lines.append(f"- **{prefix}**: {codes}")
    lines.append("")
    return lines


def render(data, max_desc=140):
    lines = []
    lines.extend(render_meta(data))
    lines.extend(render_composition_grammar(data))
    lines.extend(render_entities(data, max_desc))
    lines.extend(render_events_and_endpoints(data))
    lines.extend(render_tasks_and_timers(data))
    lines.extend(render_provisional(data))
    lines.extend(render_state_machines_and_plugins(data))
    return "\n".join(lines).rstrip() + "\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument(
        "-i",
        "--input",
        default=str(DEFAULT_INPUT),
        help=f"Path to core-vocabulary.json (default: {DEFAULT_INPUT})",
    )
    parser.add_argument(
        "-o",
        "--output",
        default=None,
        help="Path to write the Markdown output (default: stdout)",
    )
    parser.add_argument(
        "--max-desc",
        type=int,
        default=140,
        help="Maximum characters for a one-line field/endpoint description (default: 140)",
    )
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"ERROR: core-vocabulary.json not found at {input_path}", file=sys.stderr)
        return 2

    try:
        with open(input_path) as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"ERROR: could not parse {input_path} as JSON: {e}", file=sys.stderr)
        return 3

    md = render(data, max_desc=args.max_desc)

    if args.output:
        Path(args.output).write_text(md)
        print(f"Wrote {len(md):,} chars to {args.output}", file=sys.stderr)
    else:
        sys.stdout.write(md)

    return 0


if __name__ == "__main__":
    sys.exit(main())
