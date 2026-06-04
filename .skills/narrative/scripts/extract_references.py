#!/usr/bin/env python3
# UNUSED. This script was part of an experimental v3 parallel-fan-out
# architecture. The skill reverted to v2 (single-prompt) because the
# parallel architecture multiplied token cost (~5x) without meaningfully
# improving wall-clock for a single policy. Kept only because the workspace
# doesn't allow file deletion; it is not referenced by SKILL.md.
#
# The active skill workflow uses the project's existing `pdf` and `docx`
# skills to extract reference text at regeneration time — see the project
# root README.md and meta-prompt.md.
