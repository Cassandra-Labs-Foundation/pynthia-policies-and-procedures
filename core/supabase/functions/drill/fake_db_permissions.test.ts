// fake_db derives column defaults and NULL backfill by parsing
// supabase/migrations/*.sql at test time, and DEGRADES SILENTLY to empty
// maps when it cannot read them. That degrade is deliberate (a missing
// permission should not throw inside an unrelated test) — but it once turned
// a missing --allow-read into 24 scattered null-vs-undefined failures that
// looked like broken controls. This test makes the cause name itself.
import { assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

Deno.test("migration parsing is active — run the suite with --allow-read", () => {
  let readable = false;
  try {
    readable =
      [...Deno.readDirSync(new URL("../../migrations/", import.meta.url))]
        .some((e) => e.isFile && e.name.endsWith(".sql"));
  } catch {
    readable = false;
  }
  assert(
    readable,
    "cannot read supabase/migrations/ — fake_db has silently degraded to " +
      "empty schema maps and every null-backfill assertion will fail. " +
      "Invoke as: deno test --allow-net --allow-env --allow-read supabase/functions/",
  );
});
