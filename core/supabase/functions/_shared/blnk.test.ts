import {
  assert,
  assertEquals,
  assertRejects,
  assertThrows,
} from "jsr:@std/assert@1";
import {
  balanceMirror,
  blnkConfigFromEnv,
  BlnkError,
  blnkReference,
  commitInflight,
  createCustomerBalance,
  getBalance,
  recordTransaction,
  voidInflight,
  type BlnkConfig,
} from "./blnk.ts";

interface RecordedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}

interface StubFetch {
  fetch: typeof fetch;
  requests: RecordedRequest[];
}

function stubFetch(
  responses: Response[],
): StubFetch {
  const requests: RecordedRequest[] = [];
  let idx = 0;

  const fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method ?? "GET";
    const headers: Record<string, string> = {};
    if (init?.headers) {
      const h = new Headers(init.headers);
      h.forEach((v, k) => { headers[k.toLowerCase()] = v; });
    }
    let body: unknown = undefined;
    if (init?.body) {
      body = JSON.parse(init.body as string);
    }
    requests.push({ url, method, headers, body });

    const res = responses[idx++];
    if (!res) throw new Error(`stubFetch: no response queued for request #${idx}`);
    return Promise.resolve(res);
  };

  return { fetch: fetch as typeof fetch, requests };
}

function cfg(stub: StubFetch, apiUrl = "https://blnk.test"): BlnkConfig {
  return { apiUrl, apiKey: "test-key", fetchFn: stub.fetch };
}

function jsonRes(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

Deno.test("blnkReference", () => {
  assertEquals(blnkReference({ table: "ach_transfer", id: "abc" }), "ach_transfer:abc");
  assertEquals(
    blnkReference({ table: "ach_transfer", id: "abc" }, "fee"),
    "ach_transfer:abc:fee",
  );
});

Deno.test("recordTransaction happy path", async () => {
  const stub = stubFetch([
    jsonRes({
      transaction_id: "txn_1",
      reference: "ach_transfer:abc",
      status: "APPLIED",
    }),
  ]);

  const result = await recordTransaction(cfg(stub), {
    coreResource: { table: "ach_transfer", id: "abc" },
    amountCents: 12345,
    description: "test txn",
    currency: "USD",
    source: "bln_src",
    destination: "bln_dst",
    metaData: { note: "test" },
  });

  assertEquals(stub.requests.length, 1);
  const req = stub.requests[0];
  assertEquals(req.url, "https://blnk.test/transactions");
  assertEquals(req.method, "POST");
  assertEquals(req.headers["x-blnk-key"], "test-key");

  const body = req.body as Record<string, unknown>;
  assertEquals(body.reference, "ach_transfer:abc");
  assertEquals(body.precise_amount, 12345);
  assertEquals(body.precision, 100);
  assert(!("amount" in body)); // amount and precise_amount are mutually exclusive
  assertEquals(body.description, "test txn");
  assertEquals(body.skip_queue, true);

  const meta = body.meta_data as Record<string, unknown>;
  assertEquals(meta.core_resource, { table: "ach_transfer", id: "abc" });
  assertEquals(meta.note, "test");

  assertEquals(result.deduped, false);
  assertEquals(result.mirror.blnk_transaction_id, "txn_1");
  assertEquals(result.mirror.blnk_reference, "ach_transfer:abc");
  assertEquals(result.mirror.blnk_status, "APPLIED");
  assert(!Number.isNaN(Date.parse(result.mirror.synced_at)));
});

Deno.test("core_resource wins over caller metaData", async () => {
  const stub = stubFetch([
    jsonRes({
      transaction_id: "txn_1",
      reference: "ach_transfer:abc",
      status: "APPLIED",
    }),
  ]);

  await recordTransaction(cfg(stub), {
    coreResource: { table: "ach_transfer", id: "abc" },
    amountCents: 100,
    description: "test txn",
    currency: "USD",
    source: "s",
    destination: "d",
    metaData: { core_resource: { table: "wrong", id: "wrong" } },
  });

  const meta = (stub.requests[0].body as Record<string, unknown>).meta_data as Record<string, unknown>;
  assertEquals(meta.core_resource, { table: "ach_transfer", id: "abc" });
});

Deno.test("duplicate reference fetches existing transaction", async () => {
  const stub = stubFetch([
    jsonRes({ error: "transaction with reference already exists" }, 400),
    jsonRes({
      hits: [{
        document: {
          transaction_id: "txn_1",
          reference: "ach_transfer:abc",
          status: "INFLIGHT", // stale index snapshot
        },
      }],
    }),
    // authoritative by-id re-fetch wins over the stale search doc
    jsonRes({ transaction_id: "txn_1", reference: "ach_transfer:abc", status: "VOID" }),
  ]);

  const result = await recordTransaction(cfg(stub), {
    coreResource: { table: "ach_transfer", id: "abc" },
    amountCents: 100,
    description: "test txn",
    currency: "USD",
    source: "s",
    destination: "d",
  });

  assertEquals(result.deduped, true);
  assertEquals(result.mirror.blnk_transaction_id, "txn_1");
  assertEquals(result.mirror.blnk_status, "VOID"); // refreshed, not the stale INFLIGHT
  assertEquals(stub.requests[1].url, "https://blnk.test/search/transactions");
  assertEquals(stub.requests[2].url, "https://blnk.test/transactions/txn_1");
  assertEquals(stub.requests[2].method, "GET");
});

Deno.test("duplicate reference but search empty throws BlnkError", async () => {
  const stub = stubFetch([
    jsonRes({ error: "transaction with reference already exists" }, 400),
    jsonRes({ hits: [] }),
  ]);

  await assertRejects(
    () => recordTransaction(cfg(stub), {
      coreResource: { table: "ach_transfer", id: "abc" },
      amountCents: 100,
      description: "test txn",
      currency: "USD",
      source: "s",
      destination: "d",
    }),
    BlnkError,
  );
});

Deno.test("duplicate reference rejects fuzzy search near-match", async () => {
  const stub = stubFetch([
    jsonRes({ error: "transaction with reference already exists" }, 400),
    jsonRes({
      hits: [{
        document: {
          transaction_id: "txn_other",
          reference: "ach_transfer:abd", // near-match from fuzzy search, not our row
          status: "APPLIED",
        },
      }],
    }),
  ]);

  await assertRejects(
    () => recordTransaction(cfg(stub), {
      coreResource: { table: "ach_transfer", id: "abc" },
      amountCents: 100,
      description: "test txn",
      currency: "USD",
      source: "s",
      destination: "d",
    }),
    BlnkError,
  );
});

Deno.test("non-duplicate 422 throws BlnkError with status", async () => {
  const stub = stubFetch([
    jsonRes({ error: "invalid amount" }, 422),
  ]);

  const err = await assertRejects(
    () => recordTransaction(cfg(stub), {
      coreResource: { table: "ach_transfer", id: "abc" },
      amountCents: 100,
      description: "test txn",
      currency: "USD",
      source: "s",
      destination: "d",
    }),
    BlnkError,
  ) as BlnkError;

  assertEquals(err.status, 422);
});

Deno.test("amountCents validation throws RangeError without fetch", () => {
  const stub = stubFetch([]);
  const base = {
    coreResource: { table: "ach_transfer", id: "abc" },
    description: "test txn",
    currency: "USD",
    source: "s",
    destination: "d",
  };

  for (const bad of [1.5, -5, 0, NaN]) {
    assertThrows(
      () => recordTransaction(cfg(stub), { ...base, amountCents: bad }),
      RangeError,
    );
  }
  assertEquals(stub.requests.length, 0);
});

Deno.test("inflight record, commit, and void", async () => {
  const recordStub = stubFetch([
    jsonRes({ transaction_id: "txn_9", reference: "t:1", status: "INFLIGHT" }),
  ]);
  await recordTransaction(cfg(recordStub), {
    coreResource: { table: "t", id: "1" },
    amountCents: 100,
    description: "test txn",
    currency: "USD",
    source: "s",
    destination: "d",
    inflight: true,
  });
  assertEquals((recordStub.requests[0].body as Record<string, unknown>).inflight, true);

  const commitStub = stubFetch([
    jsonRes({ transaction_id: "txn_9", reference: "t:1", status: "APPLIED" }),
  ]);
  await commitInflight(cfg(commitStub), "txn_9", { amountCents: 5000 });
  assertEquals(commitStub.requests[0].url, "https://blnk.test/transactions/inflight/txn_9");
  assertEquals(commitStub.requests[0].method, "PUT");
  assertEquals(commitStub.requests[0].body, { status: "commit", precise_amount: 5000 }); // integer minor units

  const voidStub = stubFetch([
    jsonRes({ transaction_id: "txn_9", reference: "t:1", status: "VOID" }),
  ]);
  await voidInflight(cfg(voidStub), "txn_9");
  assertEquals(voidStub.requests[0].body, { status: "void" });
});

Deno.test("createCustomerBalance stamps core_resource and returns mirror", async () => {
  const prev = Deno.env.get("BLNK_CUSTOMER_LEDGER_ID");
  Deno.env.set("BLNK_CUSTOMER_LEDGER_ID", "ldg_test");

  try {
    const stub = stubFetch([
      jsonRes({ balance_id: "bln_bal_1", ledger_id: "ldg_test", currency: "USD" }),
    ]);

    const result = await createCustomerBalance(cfg(stub), {
      coreResource: { table: "account", id: "acc_1" },
      currency: "USD",
    });

    const body = stub.requests[0].body as Record<string, unknown>;
    assertEquals(body.ledger_id, "ldg_test");
    assertEquals(
      (body.meta_data as Record<string, unknown>).core_resource,
      { table: "account", id: "acc_1" },
    );
    assertEquals(result.mirror.blnk_balance_id, "bln_bal_1");
    assert(!Number.isNaN(Date.parse(result.mirror.balance_synced_at)));
  } finally {
    if (prev === undefined) Deno.env.delete("BLNK_CUSTOMER_LEDGER_ID");
    else Deno.env.set("BLNK_CUSTOMER_LEDGER_ID", prev);
  }
});

Deno.test("getBalance and balanceMirror", async () => {
  const stubWithBalance = stubFetch([
    jsonRes({ balance_id: "bln_1", balance: 42.5 }),
  ]);
  const b = await getBalance(cfg(stubWithBalance), "bln_1");
  assertEquals(balanceMirror(b).balance, 42.5);

  const stubNoBalance = stubFetch([
    jsonRes({ balance_id: "bln_2" }),
  ]);
  const b2 = await getBalance(cfg(stubNoBalance), "bln_2");
  assertEquals(balanceMirror(b2).balance, null);
});

Deno.test("blnkConfigFromEnv", () => {
  const prevUrl = Deno.env.get("BLNK_API_URL");
  const prevKey = Deno.env.get("BLNK_API_KEY");

  try {
    Deno.env.set("BLNK_API_URL", "https://example.blnk");
    Deno.env.set("BLNK_API_KEY", "key_123");
    const c = blnkConfigFromEnv();
    assertEquals(c.apiUrl, "https://example.blnk");
    assertEquals(c.apiKey, "key_123");

    Deno.env.delete("BLNK_API_KEY");
    assertThrows(() => blnkConfigFromEnv(), Error, "BLNK_API_KEY");
  } finally {
    if (prevUrl === undefined) Deno.env.delete("BLNK_API_URL");
    else Deno.env.set("BLNK_API_URL", prevUrl);
    if (prevKey === undefined) Deno.env.delete("BLNK_API_KEY");
    else Deno.env.set("BLNK_API_KEY", prevKey);
  }
});
