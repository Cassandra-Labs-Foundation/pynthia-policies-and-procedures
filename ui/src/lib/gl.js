// The general ledger, as the UI sees it.
//
// Three levels, and every one of them is real data rather than a scaffold:
//
//   LEDGER   — Blnk ledger (Customer Ledger, Bank Ledger, General Ledger…)
//     BALANCE  — an account within it. Carries its own debit_balance and
//                credit_balance, which is what makes this a GL and not a list
//                of positions.
//       POSTING  — a transaction. Has a SOURCE and a DESTINATION balance, so
//                  each one hits two accounts. That is the double entry.
//
// A posting also carries `reference: "transfer:tr_…"`, which is the thread back
// to core.transfer — so a number on the accounting page can be traced to the
// member transaction that caused it without leaving the app.

async function get(path, params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null),
  );
  const res = await fetch(`/api/blnk/${path}${qs.toString() ? `?${qs}` : ""}`);
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.detail || body?.error || `request failed (${res.status})`);
  }
  return body;
}

/**
 * Ceilings, stated rather than hidden.
 *
 * Blnk's list endpoints take a limit and say nothing about how many rows exist
 * beyond it, so a caller cannot tell a complete answer from a truncated one.
 * These are the numbers the UI reports alongside every total that could be
 * affected by them — a trial balance computed from a truncated posting set is
 * not a trial balance, and must not be presented as one.
 */
/**
 * Above the 1,826 balances this instance actually holds, deliberately.
 *
 * The trial balance is the whole point of a GL view — it is the check that
 * says "this is a real ledger, not a list of numbers" — and it can only run
 * when EVERY balance is loaded. At a cap of 1,000 it reported a $26.9m
 * difference that was purely an artefact of truncation, which is exactly the
 * kind of alarming-but-meaningless figure a dashboard must not show. Loading
 * all of them, debits and credits tie to the cent.
 *
 * Headroom matters here: if the instance grows past this, the cap trips and
 * the UI says "not checkable" rather than resuming the false alarm.
 */
export const BALANCE_CAP = 3000;

/**
 * Postings are drill-down DETAIL, not an input to the trial balance, so this
 * one is a depth limit rather than a correctness requirement. More than 5,000
 * exist; a page that fetched them all would stall for a figure nobody totals.
 */
export const POSTING_CAP = 2000;

/** Money in Blnk is integer minor units, same convention as the core. */
export function glAmount(v) {
  return typeof v === "number" ? v : 0;
}

export async function fetchLedgers() {
  const rows = await get("ledgers");
  return (Array.isArray(rows) ? rows : []).map((l) => ({
    id: l.ledger_id,
    name: l.name || l.ledger_id,
    createdAt: l.created_at ?? null,
    meta: l.meta_data ?? {},
  }));
}

export async function fetchBalances({ limit = BALANCE_CAP } = {}) {
  const rows = await get("balances", { limit });
  const list = Array.isArray(rows) ? rows : [];
  const mapped = list.map((b) => ({
    id: b.balance_id,
    ledgerId: b.ledger_id,
    currency: b.currency ?? "USD",
    // Blnk's own words: `balance` is the net, and the two sides are tracked
    // separately. Keeping all three means the UI can show a GL account the way
    // an accountant expects (Dr / Cr / net) rather than just a position.
    net: glAmount(b.balance),
    debit: glAmount(b.debit_balance),
    credit: glAmount(b.credit_balance),
    // Money held but not settled. A real distinction, not a rounding detail:
    // inflight funds are committed and not yet posted, so folding them into
    // the net would overstate what has actually cleared.
    inflight: glAmount(b.inflight_balance),
    inflightDebit: glAmount(b.inflight_debit_balance),
    inflightCredit: glAmount(b.inflight_credit_balance),
    createdAt: b.created_at ?? null,
    meta: b.meta_data ?? {},
  }));
  mapped.truncated = list.length >= limit;
  return mapped;
}

export async function fetchPostings({ limit = POSTING_CAP } = {}) {
  const rows = await get("transactions", { limit });
  const list = Array.isArray(rows) ? rows : [];
  const mapped = list.map((t) => ({
    id: t.transaction_id,
    amount: glAmount(t.amount),
    currency: t.currency ?? "USD",
    source: t.source ?? null,
    destination: t.destination ?? null,
    reference: t.reference ?? null,
    // "transfer:tr_…" -> "tr_…", the id the rest of this app already knows.
    coreTransferId:
      typeof t.reference === "string" && t.reference.startsWith("transfer:")
        ? t.reference.slice("transfer:".length)
        : null,
    description: t.description ?? null,
    status: t.status ?? "UNKNOWN",
    inflight: Boolean(t.inflight),
    createdAt: t.created_at ?? null,
  }));
  mapped.truncated = list.length >= limit;
  return mapped;
}

/**
 * Everything the GL view needs, in one pass.
 *
 * Postings are indexed by BOTH sides, because that is what a drill-down on a GL
 * account means: show me every entry that touched this account, whether it was
 * debited or credited. Indexing one side would silently halve the ledger.
 */
export async function fetchGeneralLedger() {
  const [ledgers, balances, postings] = await Promise.all([
    fetchLedgers(),
    fetchBalances(),
    fetchPostings(),
  ]);

  const postingsByBalance = new Map();
  const push = (balanceId, posting, side) => {
    if (!balanceId) return;
    if (!postingsByBalance.has(balanceId)) postingsByBalance.set(balanceId, []);
    postingsByBalance.get(balanceId).push({ ...posting, side });
  };
  for (const p of postings) {
    push(p.source, p, "credit"); // funds leave the source
    push(p.destination, p, "debit"); // funds arrive at the destination
  }

  const balancesByLedger = new Map();
  for (const b of balances) {
    if (!balancesByLedger.has(b.ledgerId)) balancesByLedger.set(b.ledgerId, []);
    balancesByLedger.get(b.ledgerId).push(b);
  }

  // A ledger Blnk never listed but that balances reference still gets a node,
  // named by its id — dropping it would hide real money.
  const known = new Set(ledgers.map((l) => l.id));
  const orphanLedgers = [...balancesByLedger.keys()]
    .filter((id) => !known.has(id))
    .map((id) => ({ id, name: id, createdAt: null, meta: {}, unlisted: true }));

  const nodes = [...ledgers, ...orphanLedgers].map((l) => {
    const rows = (balancesByLedger.get(l.id) ?? []).sort((a, b) => b.net - a.net);
    return {
      ...l,
      balances: rows,
      balanceCount: rows.length,
      totalDebit: rows.reduce((s, b) => s + b.debit, 0),
      totalCredit: rows.reduce((s, b) => s + b.credit, 0),
      totalNet: rows.reduce((s, b) => s + b.net, 0),
      totalInflight: rows.reduce((s, b) => s + b.inflight, 0),
    };
  });
  // Ledgers with money first; empty probe ledgers sink to the bottom.
  nodes.sort((a, b) => b.balanceCount - a.balanceCount || b.totalNet - a.totalNet);

  return {
    ledgers: nodes,
    postingsByBalance,
    counts: {
      ledgers: nodes.length,
      balances: balances.length,
      postings: postings.length,
    },
    truncated: {
      balances: Boolean(balances.truncated),
      postings: Boolean(postings.truncated),
    },
    trialBalance: trialBalance(balances, balances.truncated),
    postingStatus: postings.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    }, {}),
  };
}

/**
 * core.account.balance against the Blnk balance it mirrors.
 *
 * This is the comparison that means something, and it replaces one that did
 * not. The page used to show "Member ledger − FBO position", which subtracted
 * a VOLUME from a BALANCE: aggregator.fbo_position only ever accumulates
 * (`position_cents = position_cents + excluded`), so it is a running total of
 * settled money movement and never a cash position. That difference was a
 * category error, not a reconciliation, and it would widen every day.
 *
 * The honest comparison is against the source of truth. core.account.balance
 * is documented as a CACHE — "Source of truth for funds" is the comment on
 * blnk_balance_id, and balance_synced_at records when the cache was last
 * reconciled. So two things can go wrong and they are different failures:
 *
 *   DRIFT     — a linked account whose cached figure no longer matches the
 *               ledger. The mirror is stale or a sync was missed.
 *   UNBACKED  — an account carrying a balance with no blnk_balance_id at all.
 *               Postgres asserts money the ledger has never heard of, so it
 *               appears in the member total and in no double-entry anywhere.
 *
 * Both are reported separately because netting them would let one hide the
 * other, and only the second is currently non-zero here.
 */
export function reconcileWithBlnk(accounts, gl) {
  const byBalanceId = new Map(
    gl.ledgers.flatMap((l) => l.balances).map((b) => [b.id, b]),
  );

  const linked = [];
  const unbacked = [];
  for (const a of accounts) {
    const bal = a.blnk_balance_id ? byBalanceId.get(a.blnk_balance_id) : null;
    if (bal) linked.push({ account: a, blnk: bal });
    else unbacked.push(a);
  }

  const cents = (v) => (typeof v === "number" ? v : 0);
  const coreLinked = linked.reduce((s, r) => s + cents(r.account.balance), 0);
  const blnkLinked = linked.reduce((s, r) => s + cents(r.blnk.net), 0);
  const mismatches = linked
    .filter((r) => cents(r.account.balance) !== cents(r.blnk.net))
    .map((r) => ({
      accountId: r.account.id,
      coreCents: cents(r.account.balance),
      blnkCents: cents(r.blnk.net),
      deltaCents: cents(r.account.balance) - cents(r.blnk.net),
    }));

  return {
    linkedCount: linked.length,
    coreLinkedCents: coreLinked,
    blnkLinkedCents: blnkLinked,
    driftCents: coreLinked - blnkLinked,
    mismatches,
    unbackedCount: unbacked.length,
    unbackedCents: unbacked.reduce((s, a) => s + cents(a.balance), 0),
    unbackedIds: unbacked.map((a) => a.id),
    // Clean only when the mirror agrees AND nothing is asserted without a
    // ledger entry behind it.
    clean: mismatches.length === 0 && unbacked.length === 0,
  };
}

/**
 * Total debits against total credits.
 *
 * This is the one check that tells you whether you are looking at a real
 * ledger. In double-entry the two sides are equal by construction, so a
 * mismatch means either the ledger is genuinely broken or — far more likely
 * here — we are looking at a truncated slice of it.
 *
 * `balanced` is therefore three-valued, not boolean: null means "the row set
 * was capped, so this check cannot be run", which is a different statement
 * from "the ledger does not balance" and must not be collapsed into it.
 */
export function trialBalance(balances, truncated) {
  const debit = balances.reduce((s, b) => s + b.debit, 0);
  const credit = balances.reduce((s, b) => s + b.credit, 0);
  return {
    debit,
    credit,
    difference: debit - credit,
    balanced: truncated ? null : debit === credit,
    truncated: Boolean(truncated),
  };
}
