UNUSED. This file was part of an experimental v3 parallel-fan-out
architecture. The skill reverted to v2 (single-prompt) because the
parallel architecture multiplied token cost (~5x) without meaningfully
improving wall-clock for a single policy.

The active prompt is at `../narrative-prompt.md`. This file is kept only
because the workspace doesn't allow file deletion; it is not referenced
by SKILL.md.
