// Card 45 — idempotency keys are namespaced per partner.
//
// This is a SECURITY test, not a correctness one. Before partner tokens,
// `idempotency_key` was the primary key on its own, so two partners using the
// same key collided and the second received the first's cached response body:
// account ids, amounts, counterparties. 'order-42' is exactly the kind of key
// a partner derives from its own order numbers, so the collision is ordinary
// traffic rather than an attack.
//
// The fake below applies `.eq()` as a real predicate. A version that ignored
// the partner_id filter would let these pass while the leak was wide open, so
// the predicate modelling is what gives the test its teeth.
import { assert, assertEquals } from "jsr:@std/assert@1";
import { claimIdempotency, storeIdempotencyResponse } from "./lib.ts";
import { type Any } from "./test_helpers.ts";

interface Stored {
  partner_id: string;
  idempotency_key: string;
  endpoint: string;
  request_hash: string;
  response_status: number | null;
  response_body: unknown;
  blnk_reference: string | null;
}

/** In-memory idempotency_keys table with a composite (partner_id, key) PK. */
function idemDb(seed: Stored[] = []) {
  const rows: Stored[] = [...seed];
  const db: Any = {
    schema: () => ({
      from: () => {
        const filters: Record<string, unknown> = {};
        let pendingPatch: Partial<Stored> | null = null;
        const chain: Any = {
          select: () => chain,
          eq: (col: string, val: unknown) => {
            filters[col] = val;
            return chain;
          },
          insert: (row: Stored) => {
            const clash = rows.find((r) =>
              r.partner_id === row.partner_id && r.idempotency_key === row.idempotency_key
            );
            if (clash) {
              return Promise.resolve({ error: { code: "23505", message: "duplicate key" } });
            }
            rows.push({ ...row });
            return Promise.resolve({ error: null });
          },
          // supabase-js chains .eq() AFTER update(), so the patch is held and
          // applied when the builder is awaited — modelling that ordering is
          // what makes the missing-predicate case detectable here.
          update: (patch: Partial<Stored>) => {
            pendingPatch = patch;
            return chain;
          },
          then: (res: (v: unknown) => unknown) => {
            if (pendingPatch) {
              rows
                .filter((r) => Object.entries(filters).every(([k, v]) => (r as Any)[k] === v))
                .forEach((r) => Object.assign(r, pendingPatch));
              pendingPatch = null;
            }
            return res({ error: null });
          },
          maybeSingle: () => {
            const found = rows.find((r) =>
              Object.entries(filters).every(([k, v]) => (r as Any)[k] === v)
            );
            return Promise.resolve({ data: found ?? null, error: null });
          },
        };
        return chain;
      },
    }),
  };
  return { db, rows };
}

Deno.test("the same Idempotency-Key from two partners is two independent claims", async () => {
  const { db } = idemDb();

  const a = await claimIdempotency(db, "ptnr_a", "order-42", "hash_a", "tr_a", "POST /transfers");
  const b = await claimIdempotency(db, "ptnr_b", "order-42", "hash_b", "tr_b", "POST /transfers");

  assertEquals(a.kind, "fresh");
  assertEquals(b.kind, "fresh", "partner B's key must not collide with partner A's");
  assertEquals((b as { transferId: string }).transferId, "tr_b");
});

Deno.test("partner B never replays partner A's cached response", async () => {
  const { db } = idemDb();

  // A completes a transfer and its response is cached
  await claimIdempotency(db, "ptnr_a", "order-42", "hash_a", "tr_a", "POST /transfers");
  await storeIdempotencyResponse(db, "ptnr_a", "order-42", 201, {
    id: "tr_a",
    amount_cents: 500000,
    destination_account_id: "acct_a_secret",
  });

  // B now uses the same key for its own, different request
  const b = await claimIdempotency(db, "ptnr_b", "order-42", "hash_b", "tr_b", "POST /transfers");

  assertEquals(b.kind, "fresh", "a replay here would hand B partner A's account ids and amounts");
  assert(!("responseBody" in b), "B must receive no cached body at all");
});

Deno.test("storing a response cannot overwrite another partner's row", async () => {
  const { db, rows } = idemDb();
  await claimIdempotency(db, "ptnr_a", "order-42", "hash_a", "tr_a", "POST /transfers");
  await claimIdempotency(db, "ptnr_b", "order-42", "hash_b", "tr_b", "POST /transfers");

  await storeIdempotencyResponse(db, "ptnr_a", "order-42", 201, { id: "tr_a" });

  const rowA = rows.find((r) => r.partner_id === "ptnr_a")!;
  const rowB = rows.find((r) => r.partner_id === "ptnr_b")!;
  assertEquals(rowA.response_status, 201);
  // without the partner predicate on the UPDATE, this write lands on every row
  // sharing the key
  assertEquals(rowB.response_status, null, "B's row must be untouched");
});

// ---- the ordinary single-partner semantics must still hold ----

Deno.test("the same partner replaying its own key still gets the cached response", async () => {
  const { db } = idemDb();
  await claimIdempotency(db, "ptnr_a", "order-42", "hash_a", "tr_a", "POST /transfers");
  await storeIdempotencyResponse(db, "ptnr_a", "order-42", 201, { id: "tr_a" });

  const again = await claimIdempotency(db, "ptnr_a", "order-42", "hash_a", "tr_a2", "POST /transfers");
  assertEquals(again.kind, "replay");
  assertEquals((again as { responseStatus: number }).responseStatus, 201);
});

Deno.test("the same partner reusing a key with a different body still conflicts", async () => {
  const { db } = idemDb();
  await claimIdempotency(db, "ptnr_a", "order-42", "hash_a", "tr_a", "POST /transfers");
  const conflict = await claimIdempotency(
    db, "ptnr_a", "order-42", "hash_DIFFERENT", "tr_a2", "POST /transfers",
  );
  assertEquals(conflict.kind, "conflict");
});

Deno.test("an interrupted claim resumes on its original id, per partner", async () => {
  const { db } = idemDb();
  await claimIdempotency(db, "ptnr_a", "order-42", "hash_a", "tr_original", "POST /transfers");
  // no stored response: the first attempt died mid-flight
  const resumed = await claimIdempotency(
    db, "ptnr_a", "order-42", "hash_a", "tr_fresh", "POST /transfers",
  );
  assertEquals(resumed.kind, "resume");
  assertEquals(
    (resumed as { transferId: string }).transferId,
    "tr_original",
    "resuming must reuse the original id so the Blnk reference stays stable",
  );
});
