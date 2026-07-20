"""Project the remaining red controls under `predicted = reds - entity-blocked`.

Every blocking namespace is classified into one of three buckets. The lists are
written out rather than inferred, because the classification IS the estimate and
someone must be able to overrule it.

  REACHABLE      — the core can observe or produce this honestly. Work, not a
                   decision.
  PERSON-BLOCKED — names an act by a PERSON or an HR lifecycle the core does not
                   observe. The reference pair: `user.role` is a system-principal
                   question, answerable without modelling employment, so it is
                   REACHABLE. `employee.separated` is an HR lifecycle event, so
                   it is not.
  OUTSIDE-BLOCKED — names a fact about INFRASTRUCTURE or an EXTERNAL BODY that
                   the banking core has no connection to. A core asserting
                   `firewall.rule.changed` is fabricating in exactly the way it
                   would be by inventing an employee.
"""
import json, collections, sys

# Acts by people / HR lifecycle. See the reference pair in the docstring.
PERSON = {
    "employee",      # hired / separated — an HR lifecycle
    "hr",            # coaching, discipline
    "training",      # a person completed a course
    "board",         # a board MEETING happening (a resolution REFERENCE is fine)
    "alco",          # committee convening
    "committee",
    "expulsion",     # a membership action taken at a meeting
    "estate",        # a death and its administration
}

# Facts about infrastructure or external bodies the core has no feed from.
OUTSIDE = {
    "firewall", "antivirus", "intrusion", "tls", "siem", "dlp", "vuln",
    "pentest", "backup", "restore", "connection", "safe_mode", "it",
    "ncua", "regulator", "exam",          # an examiner's own actions
    "ai", "model",                        # third-party model governance
    "legal",                              # outside counsel acts
    "vendor",                             # vendor's own attestations
}

def blocking(r):
    ns = set()
    if (r.get("blocked_on") or "").startswith("no writer"):
        for t in r["triggers"]:
            ns.add(t.split(".")[0])
    for e in r.get("expected", []):
        if e not in r.get("observed", []):
            ns.add(e.split(".")[0])
    b = r.get("blocked_on") or ""
    if b.startswith("inputs not supplied"):
        for i in b.split(": ", 1)[1].split(", "):
            ns.add(i.split(".")[0])
    return ns

def main():
    res = json.load(open("control-tests.json"))["results"]
    red = [r for r in res if not r["scoped_out"] and r["status"] == "red"]
    buckets = collections.defaultdict(list)
    for r in red:
        ns = blocking(r)
        if ns & PERSON:
            buckets["person"].append((r, sorted(ns & PERSON)))
        elif ns & OUTSIDE:
            buckets["outside"].append((r, sorted(ns & OUTSIDE)))
        else:
            buckets["reachable"].append((r, sorted(ns)))

    total = len(red)
    print(f"REMAINING IN-SCOPE RED: {total}\n")
    print(f"  REACHABLE        {len(buckets['reachable']):4d}   buildable — work, no decision needed")
    print(f"  PERSON-BLOCKED   {len(buckets['person']):4d}   needs an employee/HR noun — Lorenzo's call")
    print(f"  OUTSIDE-BLOCKED  {len(buckets['outside']):4d}   needs a feed from infrastructure or a regulator")
    print()
    green = json.load(open("control-tests.json"))["summary"]["in_scope_green"]
    scope = json.load(open("control-tests.json"))["summary"]["in_scope"]
    print(f"  => ceiling without any decision: {green + len(buckets['reachable'])} of {scope}")
    print(f"  => {len(buckets['person']) + len(buckets['outside'])} controls need a decision or a data source\n")

    for k, label in [("person", "PERSON-BLOCKED"), ("outside", "OUTSIDE-BLOCKED")]:
        print(f"--- {label} ---")
        for r, why in buckets[k]:
            print(f"  {r['uid']:48s} {why}")
        print()

    print("--- REACHABLE, by policy ---")
    byp = collections.Counter(r["policy"] for r, _ in buckets["reachable"])
    for p, c in byp.most_common():
        print(f"  {c:3d}  {p}")

if __name__ == "__main__":
    main()
