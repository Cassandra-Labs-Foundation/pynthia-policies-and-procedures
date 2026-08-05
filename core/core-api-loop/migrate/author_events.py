#!/usr/bin/env python3
"""
author_events.py — give the spec its event-code registry (x-events / x-tasks / x-task-map).

Until this step, core-api.yaml carried only x-event-types — the 100-odd canonical
*verbs* — while the event *codes* themselves lived in vocab-migration.json, a
frozen snapshot of the policy demand side. parse_core_api.py pasted that snapshot
into core-vocabulary.json unchanged, so the registry of events never learned what
the core actually emits: the supply side (crosswalk-emitted-events.json) was
never an input anywhere. That is the structural break behind "297 of 316
controls unreachable" — the two halves were speaking from different lists.

This step moves the registry into the spec, once:

  x-events    code -> {subject, type}    every event code the vocabulary registers.
              Seeded from the union of vocab-migration.json's event tokens and the
              emitted inventory (crosswalk-emitted-events.json, literal + templated
              expansions). Emitted codes with no migration entry get their subject
              and type from EMITTED_SEED below; the script FAILS on an inventory
              code with neither, so a future emitted code forces a conscious
              registration rather than silently widening the gap again.
  x-tasks     token -> {subject, type[, timer_of]}   migration as=task entries.
  x-task-map  name  -> {subject, type}               migration task_map, verbatim.

After this lands, parse_core_api.py reads these blocks instead of the migration
file, and vocab-migration.json becomes what its name says — a migration record —
retained only for the provisional-field ledger. New events are added by editing
x-events directly; scripts/check_emitted_coverage.py fails CI when the core
emits a code the registry lacks.

One-time: because post-migration edits happen directly in the spec, re-running
this REBUILDS the registry from migration + seeds and would silently delete a
hand-added entry. It therefore refuses to run once x-events exists, unless
--force is passed (in which case any hand edit since the stamp is lost).
Like every migrate step it round-trips the whole document through safe_dump
(verified byte-stable against the committed spec).
"""

from __future__ import annotations

import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(REPO_ROOT, "scripts"))
import yaml  # noqa: E402
import code_format  # noqa: E402
import spec_io  # noqa: E402

SPEC = os.path.join(REPO_ROOT, "core", "core-api.yaml")
MIGRATION = os.path.join(REPO_ROOT, "vocab-migration.json")
EMITTED = os.path.join(REPO_ROOT, "crosswalk-emitted-events.json")
DUMP_KW = dict(sort_keys=False, default_flow_style=False, width=120, allow_unicode=True)

# subject + canonical verb for emitted codes that predate the registry and have no
# migration entry. Keys are the CANONICAL spelling (code_format.canonical_code);
# type is the code's own action verb where registered in x-event-types, else the
# nearest registered verb (the migration's own precedent: aan.queued -> created).
# Emitted *.timer / *.due_at codes are task registrations and get no entry here.
EMITTED_SEED = {
    "account.frozen": {"subject": "account", "type": "frozen"},
    "account.locked": {"subject": "account", "type": "locked"},
    "account.opened": {"subject": "account", "type": "opened"},
    "account.unlocked": {"subject": "account", "type": "unlocked"},
    "account_number.activated": {"subject": "account_number", "type": "activated"},
    "account_number.canceled": {"subject": "account_number", "type": "canceled"},
    "account_number.disabled": {"subject": "account_number", "type": "disabled"},
    "ach_transfer.noc.received": {"subject": "ach_transfer", "type": "received"},
    "ach_transfer.returned": {"subject": "ach_transfer", "type": "returned"},
    "ach_transfer.settled": {"subject": "ach_transfer", "type": "settled"},
    "blnk.balance_drift": {"subject": "blnk", "type": "detected"},
    "blnk.inbox_backlog": {"subject": "blnk", "type": "detected"},
    "blnk.mirror.recovered": {"subject": "blnk", "type": "recovered"},
    "blnk.missing_mirror": {"subject": "blnk", "type": "detected"},
    "blnk.stuck_row": {"subject": "blnk", "type": "detected"},
    "bsa_alert.triage.overdue": {"subject": "bsa_alert", "type": "overdue"},
    "bsa_alert.triaged": {"subject": "bsa_alert", "type": "triaged"},
    # card.issued / card.request_during_address_hold are NOT seeded: their only
    # emission sites (cards.ts postIssueCard / postCardReissue) are handlers the
    # router never imports — drill-only, so they are excluded from the inventory.
    "card_authorization.captured": {"subject": "card_authorization", "type": "captured"},
    "card_authorization.expired": {"subject": "card_authorization", "type": "expired"},
    "case.sar_decision.overdue": {"subject": "case", "type": "overdue"},
    "ctr.filing.overdue": {"subject": "ctr", "type": "overdue"},
    "disposal.clock.resumed": {"subject": "disposal", "type": "resumed"},
    "disposal.held": {"subject": "disposal", "type": "held"},
    "entity.archived": {"subject": "entity", "type": "archived"},
    "entity.owner.added": {"subject": "entity", "type": "added"},
    "eps.dual_control.decided": {"subject": "eps", "type": "decided"},
    "eps.wire.second_approval": {"subject": "eps", "type": "approved"},
    "governance.obligation.completed": {"subject": "governance", "type": "completed"},
    "governance.obligation.overdue": {"subject": "governance", "type": "overdue"},
    "record.retention_anchor": {"subject": "record", "type": "recorded"},
    "transfer.settled": {"subject": "transfer", "type": "settled"},
    "verification.approved": {"subject": "verification", "type": "approved"},
    "wire_transfer.completed": {"subject": "wire_transfer", "type": "completed"},
    "wire_transfer.rejected": {"subject": "wire_transfer", "type": "rejected"},
    "wire_transfer.returned": {"subject": "wire_transfer", "type": "returned"},
    # routed handler emissions surfaced by the 2026-08 emission audit
    "access.refused": {"subject": "access", "type": "refused"},
    "attestation.recorded": {"subject": "attestation", "type": "recorded"},
    "cash.custody.revoked": {"subject": "cash", "type": "revoked"},
    "connection.suspended": {"subject": "connection", "type": "disabled"},
    "connection.token.revoked": {"subject": "connection", "type": "revoked"},
    "destruction_log.entry_id": {"subject": "destruction_log", "type": "recorded"},
    "estate.claim.documented": {"subject": "estate", "type": "documented"},
    "expulsion.meeting_date": {"subject": "expulsion", "type": "scheduled"},
    "inbound.completed": {"subject": "inbound", "type": "completed"},
    "inbound.opened": {"subject": "inbound", "type": "opened"},
    "inbound.overdue": {"subject": "inbound", "type": "overdue"},
    "legal_hold.schedule.resumed": {"subject": "legal_hold", "type": "resumed"},
    "member.expulsion_hearing.held": {"subject": "member", "type": "held"},
    "member.expulsion_notice": {"subject": "member", "type": "notified"},
    "notice.completed": {"subject": "notice", "type": "completed"},
    "notice.opened": {"subject": "notice", "type": "opened"},
    "notice.overdue": {"subject": "notice", "type": "overdue"},
    "privacy.sharing.blocked": {"subject": "privacy", "type": "blocked"},
    "record.legal_hold_flag": {"subject": "record", "type": "flagged"},
    "request.completed": {"subject": "request", "type": "completed"},
    "request.opened": {"subject": "request", "type": "opened"},
    "request.overdue": {"subject": "request", "type": "overdue"},
    "task.completed": {"subject": "task", "type": "completed"},
    "task.opened": {"subject": "task", "type": "opened"},
    "task.overdue": {"subject": "task", "type": "overdue"},
    "threshold.breached": {"subject": "threshold", "type": "breached"},
    "threshold.warning": {"subject": "threshold", "type": "warning"},
}


def emitted_inventory_codes(inv: dict) -> set[str]:
    return code_format.emitted_codes(inv)


def main() -> int:
    doc = spec_io.load_spec(SPEC)
    if not (isinstance(doc, dict) and doc.get("openapi")):
        sys.exit("core-api.yaml is not an OpenAPI document.")
    if "x-events" in doc and "--force" not in sys.argv[1:]:
        sys.exit("x-events is already stamped — register new events by editing "
                 "core-api.yaml directly. Re-running would rebuild from the "
                 "migration record and delete any hand-added entry; pass "
                 "--force only if that is what you want.")
    migration_doc = json.load(open(MIGRATION))
    migration = migration_doc.get("migration") or {}
    task_map = migration_doc.get("task_map") or {}
    inv = json.load(open(EMITTED))

    actions = set(doc.get("x-event-types") or [])
    task_types = set(doc.get("x-task-types") or [])

    # -- x-events: migration event tokens, deduplicated by canonical form --
    # The migration carries a few doublets (policy.acknowledgment.signed AND
    # policy.acknowledgment_signed) that fold onto one canonical code. Register
    # each canonical code once, preferring the token whose spelling already IS
    # canonical; classify() resolves either citation spelling against it.
    events: dict[str, dict] = {}
    seen_canonical: dict[str, str] = {}
    mig_events = {t: e for t, e in migration.items() if e.get("as") == "event"}
    for token, entry in sorted(mig_events.items(),
                               key=lambda kv: (code_format.canonical_code(
                                   kv[0], actions, task_types) != kv[0], kv[0])):
        canon_t = code_format.canonical_code(token, actions, task_types)
        if canon_t in seen_canonical:
            continue
        seen_canonical[canon_t] = token
        events[token] = {"subject": entry.get("subject", ""), "type": entry.get("type", "")}

    # -- plus every emitted code the registry does not already cover -------
    # "covered" means registered as an event OR a task: emitted deadline codes
    # like cash.coverage.attestation.due_at are already task registrations and
    # must not gain a duplicate event entry.
    registered_canonical = {code_format.canonical_code(c, actions, task_types) for c in events}
    registered_canonical |= {
        code_format.canonical_code(t, actions, task_types)
        for t in list(migration) + list(task_map)
        if (migration.get(t) or {}).get("as") == "task" or t in task_map
    }
    unmapped = []
    for code in sorted(emitted_inventory_codes(inv)):
        canon = code_format.canonical_code(code, actions, task_types)
        if canon in registered_canonical:
            continue
        seed = EMITTED_SEED.get(canon)
        if seed is None:
            unmapped.append(canon)
            continue
        events[canon] = dict(seed)
        registered_canonical.add(canon)
    if unmapped:
        sys.exit(
            "emitted codes with no migration entry and no EMITTED_SEED mapping "
            f"(add subject/type before stamping): {unmapped}"
        )

    bad_types = sorted({v["type"] for v in events.values()} - actions)
    if bad_types:
        sys.exit(f"event types not registered in x-event-types: {bad_types}")

    # -- x-tasks / x-task-map ---------------------------------------------
    tasks: dict[str, dict] = {}
    for token, entry in migration.items():
        if entry.get("as") != "task":
            continue
        rec = {"subject": entry.get("subject", ""), "type": entry.get("type", "")}
        timer_of = entry.get("timer_of") or entry.get("timer")
        if timer_of:
            rec["timer_of"] = timer_of
        tasks[token] = rec
    tmap = {name: {"subject": e.get("subject", ""), "type": e.get("type", "")}
            for name, e in task_map.items()}

    doc["x-events"] = {k: events[k] for k in sorted(events)}
    doc["x-tasks"] = {k: tasks[k] for k in sorted(tasks)}
    doc["x-task-map"] = {k: tmap[k] for k in sorted(tmap)}

    spec_io.dump_spec(doc, SPEC)

    from_migration = sum(1 for k in events if k in migration)
    print(f"x-events stamped: {len(events)} codes "
          f"({from_migration} from vocab-migration.json, "
          f"{len(events) - from_migration} newly registered from the emitted inventory); "
          f"x-tasks: {len(tasks)}; x-task-map: {len(tmap)}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
