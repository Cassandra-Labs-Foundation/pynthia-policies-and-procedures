#!/usr/bin/env python3
"""load_spec / dump_spec — the one way in and out of core-api.yaml.

The spec is ~69k lines; plain SafeLoader takes ~3.4s to load and ~1.8s to
dump, and the CI pipeline was paying that eleven times per run (~43s of pure
YAML). libyaml's C implementations are 6-8x faster and produce byte-identical
output under the canonical dump settings, so every reader and stamper goes
through here. Falls back to the pure-Python classes when libyaml is absent.
"""
import yaml

try:
    _LOADER = yaml.CSafeLoader
    _DUMPER = yaml.CSafeDumper
except AttributeError:  # no libyaml — correctness unchanged, just slower
    _LOADER = yaml.SafeLoader
    _DUMPER = yaml.SafeDumper

# the canonical dump settings every stamper has always used — output is
# byte-stable across round-trips, which the staleness gates depend on
DUMP_KW = dict(sort_keys=False, default_flow_style=False, width=120,
               allow_unicode=True, Dumper=_DUMPER)


def load_spec(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.load(fh, Loader=_LOADER)


def dump_spec(doc, path):
    with open(path, "w", encoding="utf-8") as fh:
        yaml.dump(doc, fh, **DUMP_KW)
