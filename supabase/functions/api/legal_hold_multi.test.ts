// A RECORD CAN BE UNDER MORE THAN ONE LEGAL HOLD.
//
// Found by auditing the standing-state model after the privacy opt-out finding:
// current state that governs future actions cannot be a single pointer any more
// than it can be an event log.
//
// THE BUG THIS PINS. `record.legal_hold_id` was one column, so placing a second
// hold overwrote the first. Releasing the second then cleared
// `legal_hold_flag` — while the first hold was still live — and the record
// became disposal-eligible under an active litigation hold. Destroying records
// under hold is spoliation, so this is the worst-consequence instance of the
// fail-open class so far.
//
// Every existing test passed, because no test had ever placed two holds.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { makeDrillDb } from "../drill/fake_db.ts";
import { OPS_CTX, req } from "./test_helpers.ts";
import { postDisposalSweep, postHoldRelease, postLegalHold } from "./retention.ts";

// deno-lint-ignore no-explicit-any
type Any = any;
const CTX = OPS_CTX;

function seedRecord() {
  const dbx = makeDrillDb();
  dbx.rows["core.record"] = [{
    id: "rec_1", record_class: "cip_identity", subject_ref: "acct_1",
    retention_anchor: "2014-01-01T00:00:00.000Z",
    retention_expires_at: "2019-01-01T00:00:00.000Z",
    legal_hold_flag: false, legal_hold_id: null, disposed_at: null,
    provenance: "production",
  }];
  return dbx;
}

async function placeBoth(dbx: ReturnType<typeof makeDrillDb>) {
  await postLegalHold(
    req({ matter_id: "mA", scope_subject_ref: "acct_1", reason: "litigation A" }),
    dbx.client, "t", CTX,
  );
  await postLegalHold(
    req({ matter_id: "mB", scope_subject_ref: "acct_1", reason: "litigation B" }),
    dbx.client, "t", CTX,
  );
}

Deno.test("two concurrent holds: releasing the FIRST leaves the record held", async () => {
  const dbx = seedRecord();
  await placeBoth(dbx);
  assertEquals(dbx.rows["core.record"][0].legal_hold_flag, true);

  await postHoldRelease(req({ approved_by: "gc" }), "hold_mA_acct_1", dbx.client, "t", CTX);
  assertEquals(
    dbx.rows["core.record"][0].legal_hold_flag, true,
    "matter B is still live — the record must stay held",
  );
});

Deno.test("two concurrent holds: releasing the SECOND leaves the record held", async () => {
  const dbx = seedRecord();
  await placeBoth(dbx);
  // this is the direction that used to fail: the second placement overwrote
  // the pointer, so releasing it cleared the flag with matter A still live
  await postHoldRelease(req({ approved_by: "gc" }), "hold_mB_acct_1", dbx.client, "t", CTX);
  assertEquals(
    dbx.rows["core.record"][0].legal_hold_flag, true,
    "matter A is still live — the record must stay held",
  );
});

Deno.test("releasing BOTH holds clears the flag", async () => {
  const dbx = seedRecord();
  await placeBoth(dbx);
  await postHoldRelease(req({ approved_by: "gc" }), "hold_mA_acct_1", dbx.client, "t", CTX);
  await postHoldRelease(req({ approved_by: "gc" }), "hold_mB_acct_1", dbx.client, "t", CTX);
  assertEquals(dbx.rows["core.record"][0].legal_hold_flag, false);
});

Deno.test("a record held by a surviving matter is NOT disposal-eligible", async () => {
  const dbx = seedRecord();
  await placeBoth(dbx);
  await postHoldRelease(req({ approved_by: "gc" }), "hold_mB_acct_1", dbx.client, "t", CTX);

  // the sweep is what schedules disposal; an expired record under a live hold
  // must not appear in it
  const res = await postDisposalSweep(req({}), dbx.client, "t", CTX);
  const body = await res.json();
  assertEquals(
    body.eligible_count, 0,
    "destroying a record under an active litigation hold is spoliation",
  );
  assertEquals(dbx.violations, []);
});

Deno.test("the membership set is the authority, not the pointer", async () => {
  const dbx = seedRecord();
  await placeBoth(dbx);
  const members = dbx.rows["core.record_hold"] ?? [];
  assertEquals(members.length, 2, "both holds must be recorded, not just the latest");
  // the informational pointer names only the most recent, which is exactly why
  // it must never be used to decide whether a record is held
  assertEquals(dbx.rows["core.record"][0].legal_hold_id, "hold_mB_acct_1");
  assertEquals(
    members.filter((m: Any) => !m.released_at).length, 2,
    "both memberships start active",
  );
});
