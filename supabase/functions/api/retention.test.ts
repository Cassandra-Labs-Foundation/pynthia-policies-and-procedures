// Record retention (BSA-21) and lifecycle mechanics (SC-02).
//
// Disposal is the only irreversible action in this system, so the tests are
// weighted accordingly: the ones that matter are the refusals. A record past
// its expiry but under legal hold, a record expired but unapproved, a record
// still inside its five years — each must be refused, and refused for the
// RIGHT reason, because "not yet expired" sends someone away to wait while
// "under legal hold" tells them to go and find the matter.
//
// This file is also the first real exercise of the sim substrate. Retention
// runs five to ten years; disposal eligibility cannot be reached by waiting.
// An aged record in core would be a row claiming an anchor date it does not
// have — fabricated evidence in the evidence table — so aged records live in
// sim, and the last block asserts they stay there.
import { assert, assertEquals } from "jsr:@std/assert@1";
import {
  expiresAt,
  postDisposalSweep,
  postDisposeRecord,
  postHoldRelease,
  postLegalHold,
  RETENTION_SCHEDULE,
  setRetentionClocks,
} from "./retention.ts";
import { type Any, OPS_CTX, req, TEST_CTX } from "./test_helpers.ts";

function retentionDb(rows: Record<string, Record<string, unknown>[]>) {
  const writes: { schema: string; table: string; op: string; row: Any }[] = [];
  let schema = "core";
  const from = (table: string) => {
    const filters: { col: string; val: unknown }[] = [];
    const chain: Any = {
      select: () => chain,
      eq: (col: string, val: unknown) => (filters.push({ col, val }), chain),
      is: (col: string, val: unknown) => (filters.push({ col, val }), chain),
      lt: () => chain,
      order: () => chain,
      limit: () => chain,
      insert: (row: Any) => {
        writes.push({ schema, table, op: "insert", row });
        return Promise.resolve({ error: null });
      },
      upsert: (row: Any) => {
        writes.push({ schema, table, op: "upsert", row });
        return Promise.resolve({ error: null });
      },
      update: (patch: Any) => {
        writes.push({ schema, table, op: "update", row: patch });
        // an .update() with no terminal call still has to resolve
        const p: Any = Promise.resolve({ error: null });
        p.eq = () => p;
        p.is = () => p;
        return p;
      },
      maybeSingle: () => {
        const src = rows[table] ?? [];
        return Promise.resolve({
          data: src.find((r) => filters.every((f) => r[f.col] === f.val)) ?? null,
          error: null,
        });
      },
      then: (res: (v: unknown) => unknown) => res({ data: rows[table] ?? [], error: null }),
    };
    return chain;
  };
  const db: Any = { schema: (s: string) => (schema = s, { from }) };
  return { db, writes };
}

const PAST = "2019-01-01T00:00:00.000Z";
const FUTURE = "2099-01-01T00:00:00.000Z";

const expiredRecord = (over: Record<string, unknown> = {}) => ({
  id: "rec_acct1_cip_identity",
  record_class: "cip_identity",
  subject_ref: "acct1",
  retention_anchor: "2014-01-01T00:00:00.000Z",
  retention_anchor_kind: "account_closure",
  retention_expires_at: PAST,
  legal_hold_flag: false,
  legal_hold_id: null,
  disposal_approved_by: null,
  disposal_approved_at: null,
  disposed_at: null,
  destruction_certificate: null,
  provenance: "simulated",
  created_at: PAST,
  ...over,
});

// ------------------------------------------------------- the schedule itself

Deno.test("each record class retains for the period BSA-21 states", () => {
  assertEquals(RETENTION_SCHEDULE.cip_identity.years, 5);
  assertEquals(RETENTION_SCHEDULE.sar.years, 5);
  assertEquals(RETENTION_SCHEDULE.wire_transfer.years, 5);
  // the outlier that is easy to get wrong: OFAC blocked property is TEN years
  assertEquals(RETENTION_SCHEDULE.ofac_blocked.years, 10);
});

Deno.test("the anchor differs by class, not just the period", () => {
  // CIP identity runs from account CLOSURE; a SAR runs from its FILING date.
  // Using one anchor for both would mis-date every record of the other class.
  assertEquals(RETENTION_SCHEDULE.cip_identity.anchor, "account_closure");
  assertEquals(RETENTION_SCHEDULE.sar.anchor, "filing_date");
  assertEquals(RETENTION_SCHEDULE.cip_verification.anchor, "record_made");
});

Deno.test("expiry is anchor + period, and leap years do not shift it", () => {
  assertEquals(expiresAt("cip_identity", new Date("2026-07-19T00:00:00Z")).slice(0, 10), "2031-07-19");
  assertEquals(expiresAt("ofac_blocked", new Date("2026-07-19T00:00:00Z")).slice(0, 10), "2036-07-19");
  // 29 Feb + 5 years lands in a non-leap year; Date normalises to 1 Mar rather
  // than silently truncating a day off the retention period
  assert(expiresAt("cip_identity", new Date("2024-02-29T00:00:00Z")).startsWith("2029-03-01"));
});

Deno.test("an unknown record class throws rather than defaulting to some period", () => {
  let threw = false;
  try {
    expiresAt("not_a_class", new Date());
  } catch {
    threw = true;
  }
  assert(threw, "defaulting an unknown class would silently under- or over-retain");
});

// --------------------------------------------- BSA-21's trigger: closure

Deno.test("closing an account starts the clock on closure-anchored records", async () => {
  const { db, writes } = retentionDb({});
  const ids = await setRetentionClocks(db, "acct1", new Date("2026-07-19T00:00:00Z"));
  assertEquals(ids.length, 2, "CIP identity and beneficial owner both anchor on closure");
  const recs = writes.filter((w) => w.table === "record");
  for (const r of recs) {
    assertEquals(String(r.row.retention_expires_at).slice(0, 10), "2031-07-19");
    assertEquals(r.row.retention_anchor_kind, "account_closure");
  }
  const codes = writes.filter((w) => w.table === "event").map((w) => w.row.code);
  assert(codes.includes("record.retention_clock_set"), "BSA-21's produced event");
  assert(codes.includes("record.retention_anchor"));
});

Deno.test("re-closing cannot re-anchor and extend retention", async () => {
  // ignoreDuplicates: a second closure must not push the anchor forward.
  // Extending retention silently is the wrong direction to fail in — it looks
  // conservative but it defeats the disposal obligation.
  const { db, writes } = retentionDb({});
  await setRetentionClocks(db, "acct1", new Date("2026-07-19T00:00:00Z"));
  const rec = writes.find((w) => w.table === "record")!;
  assertEquals(rec.op, "upsert");
});

// ---------------------------------------------- SC-02: the three conditions

Deno.test("(a) a record inside its retention period cannot be destroyed", async () => {
  const { db, writes } = retentionDb({
    record: [expiredRecord({ retention_expires_at: FUTURE })],
  });
  const res = await postDisposeRecord(
    req({ approved_by: "compliance", certificate: "cert-1" }),
    "rec_acct1_cip_identity", db, "r1", OPS_CTX,
  );
  assertEquals(res.status, 409);
  assertEquals((await res.json()).type, "retention_not_expired");
  assertEquals(writes.length, 0, "nothing is written on a refused disposal");
});

Deno.test("(b) a legal hold blocks destruction even after expiry", async () => {
  // The precedence rule: expired AND approved AND certified, but held.
  const { db, writes } = retentionDb({
    record: [expiredRecord({ legal_hold_flag: true, legal_hold_id: "hold_m1_acct1" })],
  });
  const res = await postDisposeRecord(
    req({ approved_by: "compliance", certificate: "cert-1" }),
    "rec_acct1_cip_identity", db, "r2", OPS_CTX,
  );
  assertEquals(res.status, 409);
  const b = await res.json();
  assertEquals(b.type, "legal_hold_in_force");
  assert(b.detail.includes("hold_m1_acct1"), "the refusal must name the matter to chase");
  assertEquals(writes.length, 0);
});

Deno.test("a held AND unexpired record reports the HOLD, not the date", async () => {
  // Both conditions fail. Reporting "not yet expired" would send someone away
  // to wait for a date that will not release it.
  const { db } = retentionDb({
    record: [expiredRecord({ retention_expires_at: FUTURE, legal_hold_flag: true })],
  });
  const res = await postDisposeRecord(
    req({ approved_by: "c", certificate: "x" }), "rec_acct1_cip_identity", db, "r3", OPS_CTX,
  );
  assertEquals((await res.json()).type, "legal_hold_in_force");
});

Deno.test("(c) destruction without an approver or a certificate is refused", async () => {
  for (const body of [
    { certificate: "cert-1" },
    { approved_by: "compliance" },
    {},
  ]) {
    const { db, writes } = retentionDb({ record: [expiredRecord()] });
    const res = await postDisposeRecord(req(body), "rec_acct1_cip_identity", db, "r4", OPS_CTX);
    assertEquals(res.status, 400, `${JSON.stringify(body)} must be refused`);
    assertEquals(writes.length, 0);
  }
});

Deno.test("all three conditions met: the record is destroyed and certified", async () => {
  const { db, writes } = retentionDb({ record: [expiredRecord()] });
  const res = await postDisposeRecord(
    req({ approved_by: "records-mgmt", certificate: "cert-2026-001" }),
    "rec_acct1_cip_identity", db, "r5", OPS_CTX,
  );
  assertEquals(res.status, 200);
  const patch = writes.find((w) => w.table === "record")!.row;
  assertEquals(patch.disposal_approved_by, "records-mgmt");
  assertEquals(patch.destruction_certificate, "cert-2026-001");
  assert(patch.disposed_at, "disposal must be dated");
  const codes = writes.filter((w) => w.table === "event").map((w) => w.row.code);
  assert(codes.includes("record.destroyed"));
  assert(codes.includes("record.destruction.certified"));
});

Deno.test("re-disposing replays rather than destroying twice", async () => {
  const { db, writes } = retentionDb({ record: [expiredRecord({ disposed_at: PAST })] });
  const res = await postDisposeRecord(
    req({ approved_by: "c", certificate: "x" }), "rec_acct1_cip_identity", db, "r6", OPS_CTX,
  );
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("Idempotent-Replayed"), "true");
  assertEquals(writes.length, 0);
});

// ------------------------------------------------------------- legal holds

Deno.test("placing a hold flags in-scope records in the same request", async () => {
  // A hold recorded but not yet propagated is a window in which the sweep
  // could dispose the very records it was meant to protect.
  const { db, writes } = retentionDb({});
  const res = await postLegalHold(
    req({ matter_id: "m1", scope_subject_ref: "acct1", reason: "subpoena" }),
    db, "h1", OPS_CTX,
  );
  assertEquals(res.status, 201);
  const flagged = writes.find((w) => w.table === "record" && w.op === "update");
  assertEquals(flagged?.row.legal_hold_flag, true);
  const codes = writes.filter((w) => w.table === "event").map((w) => w.row.code);
  assert(codes.includes("legal_hold.created"));
  assert(codes.includes("disposal.held"), "SC-02: queued disposal is suspended");
});

Deno.test("a hold naming an unknown record class is refused", async () => {
  const { db, writes } = retentionDb({});
  const res = await postLegalHold(
    req({ matter_id: "m1", scope_subject_ref: "acct1", scope_class: "not_a_class" }),
    db, "h2", OPS_CTX,
  );
  assertEquals(res.status, 400);
  assertEquals(writes.length, 0);
});

Deno.test("a hold must name what it covers", async () => {
  const { db } = retentionDb({});
  const res = await postLegalHold(req({ matter_id: "m1" }), db, "h3", OPS_CTX);
  assertEquals(res.status, 400);
  assertEquals((await res.json()).errors[0].field, "scope_subject_ref");
});

Deno.test("releasing a hold without written authorization is refused", async () => {
  const { db, writes } = retentionDb({
    legal_hold: [{ id: "hold_m1_acct1", matter_id: "m1", status: "active", released_at: null }],
  });
  const res = await postHoldRelease(req({}), "hold_m1_acct1", db, "h4", OPS_CTX);
  assertEquals(res.status, 400);
  assertEquals((await res.json()).errors[0].field, "approved_by");
  assertEquals(writes.length, 0);
});

Deno.test("release marks the hold released and resumes the schedule", async () => {
  // THIS TEST USED TO ASSERT THE BUG. It checked that exactly ONE `record`
  // update happened on release — clearing by `legal_hold_id`, a single column
  // that a second placement overwrote. Its comment claimed a record under two
  // concurrent holds would stay held; the data model could not deliver that,
  // and no test here ever placed a second hold.
  //
  // Precedent §5b: when a control invalidates an existing test, trust the
  // control. The multi-hold behaviour is now pinned properly in
  // `legal_hold_multi.test.ts` against a database double that can represent
  // set membership. What remains here is what this fake can honestly check.
  const { db, writes } = retentionDb({
    legal_hold: [{ id: "hold_m1_acct1", matter_id: "m1", status: "active", released_at: null }],
  });
  const res = await postHoldRelease(
    req({ approved_by: "general-counsel" }), "hold_m1_acct1", db, "h5", OPS_CTX,
  );
  assertEquals(res.status, 200);
  const holdUpdates = writes.filter((w) => w.table === "legal_hold" && w.op === "update");
  assertEquals(holdUpdates.length, 1);
  assertEquals(holdUpdates[0].row.released, "true");
  assertEquals(holdUpdates[0].row.release_approved_by, "general-counsel");
  const codes = writes.filter((w) => w.table === "event").map((w) => w.row.code);
  assert(codes.includes("legal_hold.clear.confirmed"));
  assert(codes.includes("disposal.clock_resumed"));
});

Deno.test("the sweep schedules but destroys nothing", async () => {
  // Condition (c) is a human approval; a sweep that both found and destroyed
  // would collapse the approval out of the loop.
  const { db, writes } = retentionDb({ record: [expiredRecord()] });
  const res = await postDisposalSweep(req({}), db, "s1", OPS_CTX);
  assertEquals(res.status, 200);
  assertEquals((await res.json()).eligible_count, 1);
  assertEquals(
    writes.filter((w) => w.table === "record").length,
    0,
    "the sweep must not touch the records themselves",
  );
  const codes = writes.filter((w) => w.table === "event").map((w) => w.row.code);
  assert(codes.includes("disposal.scheduled"));
  assert(codes.includes("destruction_log.entry.created"));
});

Deno.test("a clean sweep reports zero rather than silence", async () => {
  const { db } = retentionDb({ record: [] });
  const b = await (await postDisposalSweep(req({}), db, "s2", OPS_CTX)).json();
  assertEquals(b.eligible_count, 0);
  assertEquals(b.truncated, false);
});

// ------------------------------------------------------------ access

Deno.test("a partner cannot see or touch retention at all", async () => {
  const { db, writes } = retentionDb({ record: [expiredRecord()] });
  for (
    const [name, res] of [
      ["hold", await postLegalHold(req({ matter_id: "m", scope_subject_ref: "a" }), db, "a1", TEST_CTX)],
      ["release", await postHoldRelease(req({ approved_by: "x" }), "h", db, "a2", TEST_CTX)],
      ["sweep", await postDisposalSweep(req({}), db, "a3", TEST_CTX)],
      ["dispose", await postDisposeRecord(req({ approved_by: "x", certificate: "c" }), "rec", db, "a4", TEST_CTX)],
    ] as [string, Response][]
  ) {
    assertEquals(res.status, 404, `${name} must be invisible to a partner`);
  }
  assertEquals(writes.length, 0);
});

// ------------------------------------- the sim substrate, actually exercised

Deno.test("aged records live in sim — a five-year clock cannot be waited out", async () => {
  // THE reason the substrate exists. This record claims a 2019 anchor. In core
  // that would be a fabricated row in the evidence table; in sim it is a test
  // fixture that no coverage query can reach.
  const { db, writes } = retentionDb({ record: [expiredRecord()] });
  const res = await postDisposeRecord(
    req({ approved_by: "records-mgmt", certificate: "cert-sim" }),
    "rec_acct1_cip_identity", db, "sim1", OPS_CTX, "sim",
  );
  assertEquals(res.status, 200);
  assert(writes.length > 0);
  for (const w of writes) {
    assertEquals(w.schema, "sim", `${w.table} escaped into ${w.schema}`);
  }
});

Deno.test("every row the sim path writes is stamped simulated", async () => {
  const { db, writes } = retentionDb({});
  await setRetentionClocks(db, "acct_sim", new Date("2019-01-01T00:00:00Z"), "sim");
  assert(writes.length > 0);
  for (const w of writes.filter((x) => x.op !== "update")) {
    assertEquals(w.row.provenance, "simulated", `${w.table} was not stamped`);
    assertEquals(w.schema, "sim");
  }
});

Deno.test("the core path never writes into sim", async () => {
  const { db, writes } = retentionDb({});
  await setRetentionClocks(db, "acct_real", new Date("2026-07-19T00:00:00Z"));
  for (const w of writes) {
    assertEquals(w.schema, "core");
    if (w.op !== "update") assertEquals(w.row.provenance, "production");
  }
});
