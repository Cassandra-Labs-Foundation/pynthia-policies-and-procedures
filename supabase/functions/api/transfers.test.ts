// Unit + behavioral tests for runGate — the shared control gate.
//
// This is the highest-traffic code in the API: every money movement on every
// rail runs through it. The compliance harness proves it end-to-end against
// live Blnk, but only for the scenarios that are cheap to stage there. These
// pin down the decision boundaries exactly ($10k, $25k, one cent either side),
// which control artifacts get written, and the per-rail differences that have
// caused production breaks.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { runGate, TRANSFER_RESOURCE, type GateResource } from "./transfers.ts";
import { type AccountRow } from "./accounts.ts";
import { type Any, json, stubCfg } from "./test_helpers.ts";

const CENTS = (dollars: number) => dollars * 100;
const CTR_LINE = CENTS(10_000);
const VEL_CAP = CENTS(25_000);

const ACCOUNT = { id: "acct_src", blnk_balance_id: "bln_src" } as unknown as AccountRow;
const DEST = { id: "acct_dst", blnk_balance_id: "bln_dst" } as unknown as AccountRow;

const CARD_RESOURCE = (id: string): GateResource => ({
  table: "card_authorization",
  type: "card_authorization",
  id,
  label: "card authorization",
  rejectedStatus: "declined",
});

interface GateDbOpts {
  /** rows returned for the per-account OUTBOUND sweep (velocity), by rail */
  outbound?: Record<string, { amount: number }[]>;
  /** rows returned for the per-account INBOUND sweep (structuring) */
  inbound?: { amount: number }[];
}

/**
 * Fake that distinguishes runGate's two aggregate queries by their predicate:
 * velocity filters on `originator`, structuring on `beneficiary`. Records every
 * insert and update so tests can assert the control artifacts, not just the
 * return value.
 */
function stubGateDb(opts: GateDbOpts = {}) {
  const inserts: { table: string; row: Record<string, unknown> }[] = [];
  const updates: { table: string; patch: Record<string, unknown> }[] = [];
  const sweptRails: string[] = [];

  const from = (table: string) => {
    let predicate: "originator" | "beneficiary" | null = null;
    const chain: Any = {
      select: () => chain,
      eq: () => chain,
      in: () => chain,
      neq: () => chain,
      gte: () => chain,
      order: () => chain,
      contains: (col: string) => {
        predicate = col === "beneficiary" ? "beneficiary" : "originator";
        if (predicate === "originator") sweptRails.push(table);
        return chain;
      },
      insert: (row: Record<string, unknown>) => {
        inserts.push({ table, row });
        return Promise.resolve({ data: null, error: null });
      },
      update: (patch: Record<string, unknown>) => {
        updates.push({ table, patch });
        return chain;
      },
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      single: () => Promise.resolve({ data: null, error: null }),
      // terminal await on the aggregate queries
      then: (res: (v: unknown) => unknown) =>
        res({
          data: predicate === "beneficiary"
            ? (opts.inbound ?? [])
            : (opts.outbound?.[table] ?? []),
          error: null,
        }),
    };
    return chain;
  };

  const db: Any = { schema: () => ({ from }) };
  return { db, inserts, updates, sweptRails };
}

const balance = (cents: number) => json({ balance: cents, currency: "USD" });
const controlIds = (inserts: { table: string; row: Any }[]) =>
  inserts.filter((i) => i.table === "control_result").map((i) => i.row.control_id);
const alertTypes = (inserts: { table: string; row: Any }[]) =>
  inserts.filter((i) => i.table === "bsa_alert").map((i) => i.row.alert_type);

// ------------------------------------------------------------- clean passage

Deno.test("a small, funded transfer passes with no control artifacts", async () => {
  const { cfg } = stubCfg([balance(CENTS(50_000))]);
  const { db, inserts } = stubGateDb();

  const out = await runGate(db, cfg, TRANSFER_RESOURCE("tr_1"), ACCOUNT, DEST, CENTS(250));
  assertEquals(out.blocked, false);
  assertEquals(inserts.length, 0, "a clean transfer must not write control rows");
});

// --------------------------------------------------------------- CG-NSF-01

Deno.test("NSF blocks, rejects the row, and records CG-NSF-01", async () => {
  const { cfg } = stubCfg([balance(CENTS(100))]);
  const { db, inserts, updates } = stubGateDb();

  const out = await runGate(db, cfg, TRANSFER_RESOURCE("tr_2"), ACCOUNT, DEST, CENTS(5_000));
  assert(out.blocked);
  assertEquals(out.status, 422);
  assertEquals((out.body as Any).type, "insufficient_funds");
  assertEquals(controlIds(inserts), ["CG-NSF-01"]);
  assertEquals(updates.at(-1)?.patch.status, "rejected");
});

Deno.test("a balance exactly equal to the amount is sufficient, not NSF", async () => {
  const { cfg } = stubCfg([balance(CENTS(500))]);
  const { db, inserts } = stubGateDb();

  const out = await runGate(db, cfg, TRANSFER_RESOURCE("tr_3"), ACCOUNT, DEST, CENTS(500));
  assertEquals(out.blocked, false, "available == requested must pass");
  assertEquals(controlIds(inserts).includes("CG-NSF-01"), false);
});

// --------------------------------------------------------------- CG-CTR-01

Deno.test("a transfer over $10k raises CG-CTR-01 and a CTR bsa_alert but still settles", async () => {
  const { cfg } = stubCfg([balance(CENTS(50_000))]);
  const { db, inserts } = stubGateDb();

  const out = await runGate(db, cfg, TRANSFER_RESOURCE("tr_4"), ACCOUNT, DEST, CTR_LINE + 1);
  assertEquals(out.blocked, false, "CTR is alert-only, never blocking");
  assertEquals(controlIds(inserts), ["CG-CTR-01"]);
  assertEquals(alertTypes(inserts), ["ctr_threshold"]);
});

Deno.test("a transfer of exactly $10k does NOT trip CG-CTR-01 (threshold is strictly above)", async () => {
  const { cfg } = stubCfg([balance(CENTS(50_000))]);
  const { db, inserts } = stubGateDb();

  await runGate(db, cfg, TRANSFER_RESOURCE("tr_5"), ACCOUNT, DEST, CTR_LINE);
  assertEquals(controlIds(inserts).includes("CG-CTR-01"), false);
});

// --------------------------------------------------------------- CG-VEL-01

Deno.test("velocity blocks when prior volume plus this transfer exceeds the daily cap", async () => {
  const { cfg } = stubCfg([]); // blocks before the balance lookup
  const { db, inserts, updates } = stubGateDb({
    outbound: { transfer: [{ amount: CENTS(24_000) }] },
  });

  const out = await runGate(db, cfg, TRANSFER_RESOURCE("tr_6"), ACCOUNT, DEST, CENTS(2_000));
  assert(out.blocked);
  assertEquals((out.body as Any).type, "velocity_limit_exceeded");
  assertEquals(controlIds(inserts), ["CG-VEL-01"]);
  assertEquals(updates.at(-1)?.patch.status, "rejected");
});

Deno.test("velocity lands exactly on the cap without blocking", async () => {
  const { cfg } = stubCfg([balance(CENTS(50_000))]);
  const { db } = stubGateDb({ outbound: { transfer: [{ amount: VEL_CAP - CENTS(1) }] } });

  const out = await runGate(db, cfg, TRANSFER_RESOURCE("tr_7"), ACCOUNT, DEST, CENTS(1));
  assertEquals(out.blocked, false, "sum == cap must pass; only strictly above blocks");
});

Deno.test("velocity aggregates ACROSS rails, not just book transfers", async () => {
  const { cfg } = stubCfg([]);
  // no single rail is over the cap; together they are
  const { db, inserts, sweptRails } = stubGateDb({
    outbound: {
      transfer: [{ amount: CENTS(8_000) }],
      wire_transfer: [{ amount: CENTS(8_000) }],
      ach_transfer: [{ amount: CENTS(8_000) }],
    },
  });

  const out = await runGate(db, cfg, TRANSFER_RESOURCE("tr_8"), ACCOUNT, DEST, CENTS(2_000));
  assert(out.blocked, "cross-rail volume must aggregate — this is the evasion path");
  assertEquals(controlIds(inserts), ["CG-VEL-01"]);
  // every rail must actually be swept
  for (const rail of ["transfer", "wire_transfer", "ach_transfer", "card_authorization"]) {
    assert(sweptRails.includes(rail), `velocity must sweep ${rail}`);
  }
});

// --------------------------------------------------------------- CG-STR-01

Deno.test("structuring fires when daily inflow aggregates past $10k with every transfer under it", async () => {
  const { cfg } = stubCfg([balance(CENTS(50_000))]);
  // two prior $4k credits into the destination; this one takes it to $12k
  const { db, inserts } = stubGateDb({
    inbound: [{ amount: CENTS(4_000) }, { amount: CENTS(4_000) }],
  });

  const out = await runGate(db, cfg, TRANSFER_RESOURCE("tr_9"), ACCOUNT, DEST, CENTS(4_000));
  assertEquals(out.blocked, false, "structuring is alert-only");
  assertEquals(controlIds(inserts), ["CG-STR-01"]);
  assertEquals(alertTypes(inserts), ["structuring"]);
  assertEquals(
    controlIds(inserts).includes("CG-CTR-01"),
    false,
    "per-txn CTR must stay silent — that is the whole point of the aggregate control",
  );
});

Deno.test("structuring does not fire when the aggregate stays under the line", async () => {
  const { cfg } = stubCfg([balance(CENTS(50_000))]);
  const { db, inserts } = stubGateDb({ inbound: [{ amount: CENTS(3_000) }] });

  await runGate(db, cfg, TRANSFER_RESOURCE("tr_10"), ACCOUNT, DEST, CENTS(3_000));
  assertEquals(controlIds(inserts).length, 0);
});

Deno.test("a single large transfer raises CTR only, never both CTR and structuring", async () => {
  const { cfg } = stubCfg([balance(CENTS(50_000))]);
  const { db, inserts } = stubGateDb({ inbound: [{ amount: CENTS(4_000) }] });

  await runGate(db, cfg, TRANSFER_RESOURCE("tr_11"), ACCOUNT, DEST, CENTS(11_000));
  assertEquals(controlIds(inserts), ["CG-CTR-01"]);
});

Deno.test("structuring is skipped entirely when there is no destination account", async () => {
  const { cfg } = stubCfg([balance(CENTS(50_000))]);
  const { db, inserts } = stubGateDb({ inbound: [{ amount: CENTS(9_000) }] });

  // wires/ACH/card have no destination row — funds leave for an @external balance
  await runGate(db, cfg, TRANSFER_RESOURCE("tr_12"), ACCOUNT, null, CENTS(4_000));
  assertEquals(controlIds(inserts).length, 0, "no destination means no inflow to aggregate");
});

// ------------------------------------------------------- per-rail differences

Deno.test("a blocked card authorization is written as 'declined', not 'rejected'", async () => {
  const { cfg } = stubCfg([balance(CENTS(100))]);
  const { db, updates } = stubGateDb();

  const out = await runGate(db, cfg, CARD_RESOURCE("cauth_1"), ACCOUNT, null, CENTS(5_000));
  assert(out.blocked);
  // card_authorization's CHECK forbids 'rejected'; writing it threw a 500 in prod
  assertEquals(updates.at(-1)?.patch.status, "declined");
  assertEquals(updates.at(-1)?.table, "card_authorization");
});

Deno.test("the error envelope names the rail that was actually blocked", async () => {
  const { cfg } = stubCfg([balance(CENTS(100))]);
  const { db } = stubGateDb();

  const out = await runGate(db, cfg, CARD_RESOURCE("cauth_2"), ACCOUNT, null, CENTS(5_000));
  assert(out.blocked);
  assertEquals((out.body as Any).resource_type, "card_authorization");
  assertEquals((out.body as Any).resource_id, "cauth_2");
});
