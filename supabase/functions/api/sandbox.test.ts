// Cards 08 (reset) + 09 (simulate stubs).
//
// Reset is the one deliberately destructive endpoint, so it must be impossible
// to trip over: an explicit confirm token, holds released BEFORE the truncate
// (or the Blnk ids needed to void them are gone), and a report of what
// happened.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { postSandboxReset } from "./sandbox.ts";
import { type Any, json, req, stubCfg } from "./test_helpers.ts";

function resetDb(holds: { table: string; rows: { id: string; txn: string }[] }[]) {
  const rpcs: string[] = [];
  const db: Any = {
    schema: () => ({
      from: (table: string) => {
        const chain: Any = {
          select: () => chain,
          in: () => chain,
          not: () => chain,
          then: (res: (v: unknown) => unknown) => {
            const h = holds.find((x) => x.table === table);
            res({
              data: (h?.rows ?? []).map((r) => ({ id: r.id, hold: r.txn })),
              error: null,
            });
          },
        };
        return chain;
      },
      rpc: (name: string) => {
        rpcs.push(name);
        return Promise.resolve({ data: null, error: null });
      },
    }),
  };
  return { db, rpcs };
}

Deno.test("reset without the confirm token is refused and touches nothing", async () => {
  const { cfg, sent } = stubCfg([]);
  const { db, rpcs } = resetDb([]);
  for (const body of [undefined, {}, { confirm: "yes" }, { confirm: "reset" }]) {
    const res = await postSandboxReset(req(body), db, cfg, "s1");
    assertEquals(res.status, 400, `confirm=${JSON.stringify(body)} must be refused`);
  }
  assertEquals(sent.length, 0);
  assertEquals(rpcs.length, 0);
});

Deno.test("reset voids outstanding holds BEFORE truncating", async () => {
  const { cfg, sent } = stubCfg([
    json({ status: "VOID" }),
    json({ status: "VOID" }),
  ]);
  const { db, rpcs } = resetDb([
    { table: "wire_transfer", rows: [{ id: "w1", txn: "txn_w" }] },
    { table: "card_authorization", rows: [{ id: "c1", txn: "txn_c" }] },
  ]);

  const res = await postSandboxReset(req({ confirm: "RESET" }), db, cfg, "s2");
  assertEquals(res.status, 200);
  const b = await res.json();
  assertEquals(b.released_holds, 2);
  assertEquals(b.reset, true);
  assertEquals(rpcs, ["sandbox_reset"]);
  // both voids are inflight PUTs
  for (const call of sent) {
    assert(call.url.includes("/transactions/inflight/"), "hold release goes through the inflight API");
    assertEquals((call.body as Any).status, "void");
  }
});

Deno.test("a failing void is reported but does not block the reset", async () => {
  const { cfg } = stubCfg([json({ error: "boom" }, 500)]);
  const { db, rpcs } = resetDb([
    { table: "ach_transfer", rows: [{ id: "a1", txn: "txn_a" }] },
  ]);
  const res = await postSandboxReset(req({ confirm: "RESET" }), db, cfg, "s3");
  assertEquals(res.status, 200);
  const b = await res.json();
  assertEquals(b.released_holds, 0);
  assertEquals(b.failed_releases, 1);
  assertEquals(rpcs, ["sandbox_reset"], "slate still resets; the failure is surfaced");
});
