// The UI's data layer — real records from the banking core.
//
// Replaces the hand-written fixtures this app shipped with. Every call goes to
// /api/core/*, the server-side proxy that holds the API key (lib/coreApi.js);
// nothing here talks to Supabase directly, and nothing here sees a credential.
//
// The proxy is READ-only, so this module has no create/update functions. The
// teller's transaction form is still a stub for that reason, and says so where
// it is rendered rather than pretending a write happened.

async function get(path, params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null),
  );
  const res = await fetch(`/api/core/${path}${qs.toString() ? `?${qs}` : ""}`);
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    // The core API's error envelope carries `detail`; surface it rather than a
    // bare status, because the useful cases (405 before the function is
    // deployed, 503 with no key configured) are diagnosable only from it.
    //
    // A 400 is shaped differently: type "validation_error" with a per-field
    // `errors` array and no `detail` at all. Flattened here, because "request
    // failed (400)" hides the one thing the response was written to say —
    // which field was wrong, e.g. business_date is required on cash/aggregation.
    const fields = Array.isArray(body?.errors)
      ? body.errors.map((e) => [e.field, e.message].filter(Boolean).join(" ")).join("; ")
      : "";
    throw new Error(
      body?.detail || body?.title || fields || `request failed (${res.status})`,
    );
  }
  return body;
}

// ---------------------------------------------------------------- formatting

const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/**
 * Cents -> "$1,234.56".
 *
 * The core serializes money as integer minor units and never as a float — the
 * division to a display string belongs here, at the last possible moment, and
 * nowhere upstream of it.
 */
export function formatCents(cents, { signed = false } = {}) {
  if (typeof cents !== "number") return "—";
  const text = USD.format(Math.abs(cents) / 100);
  if (!signed) return text;
  return cents < 0 ? `-${text}` : `+${text}`;
}

/** ISO timestamp -> "Today, 2:34 PM" / "Yesterday" / "Jul 3, 2026". */
export function formatWhen(iso) {
  if (!iso) return "—";
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "—";

  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round((startOfDay(new Date()) - startOfDay(at)) / 86_400_000);

  if (days === 0) {
    return `Today, ${at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }
  if (days === 1) return "Yesterday";
  return at.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

// ------------------------------------------------------------------- members

function toMember(entity) {
  return {
    id: entity.id,
    name: entity.name,
    email: entity.email,
    // core.entity holds no phone number. Left null rather than filled with a
    // placeholder, so the field renders as absent instead of as wrong.
    phone: null,
    joinDate: entity.created_at,
    status: entity.status,
    type: entity.type,
  };
}

export async function fetchMembers({ limit = 50, type } = {}) {
  const body = await get("entities", { limit, type });
  return body.data.map(toMember);
}

export async function fetchMember(memberId) {
  return toMember(await get(`entities/${memberId}`));
}

/** Client-side contains-match: the core API has no search endpoint. */
export async function searchMembers(term) {
  const needle = term.trim().toLowerCase();
  if (!needle) return [];
  const members = await fetchMembers({ limit: 200 });
  return members.filter(
    (m) => m.name.toLowerCase().includes(needle) || m.id.toLowerCase().includes(needle),
  );
}

// ------------------------------------------------------------------ accounts

function toAccount(account, nameByEntityId) {
  return {
    id: account.id,
    // core.account has no name column — an account is identified by its holder.
    // Falling back to the id rather than inventing a label keeps an unlinked
    // account visibly unlinked instead of looking like a named product.
    name: nameByEntityId?.get(account.entity_id) ?? account.id,
    balance: formatCents(account.balance),
    balanceCents: account.balance,
    type: account.account_type,
    status: account.status,
    entityId: account.entity_id,
  };
}

/**
 * Accounts, with holder names resolved.
 *
 * Two requests rather than one: the core API exposes no join, so the holder
 * name comes from a page of entities matched on entity_id. An account whose
 * holder is outside that page keeps its id as its label — degraded, but not
 * wrong, which is the trade this fallback exists to make.
 */
export async function fetchAccounts({ limit = 50, entityId, status } = {}) {
  const [accountsBody, members] = await Promise.all([
    get("accounts", { limit, entity_id: entityId, status }),
    fetchMembers({ limit: 200 }).catch(() => []),
  ]);
  const nameByEntityId = new Map(members.map((m) => [m.id, m.name]));
  return accountsBody.data.map((a) => toAccount(a, nameByEntityId));
}

export async function fetchAccount(accountId) {
  return toAccount(await get(`accounts/${accountId}`), null);
}

// -------------------------------------------------------------- transactions

const TRANSFER_STATUS_LABEL = {
  pending_approval: "pending",
  submitted: "pending",
  settled: "completed",
  returned: "returned",
  rejected: "rejected",
  canceled: "canceled",
};

/**
 * A transfer, seen from `accountId` if one is given.
 *
 * Sign is a point of view, not a property of the row: the same transfer is a
 * debit to its originator and a credit to its beneficiary. With no account in
 * hand the list is shown from the originator's side, which is the side that
 * initiated it.
 */
function toTransaction(transfer, { nameByAccountId, accountId } = {}) {
  const fromId = transfer.originator?.account_id;
  const toId = transfer.beneficiary?.account_id;
  const isCredit = accountId ? toId === accountId : false;
  const counterpartyId = isCredit ? fromId : toId;

  return {
    id: transfer.id,
    member: nameByAccountId?.get(counterpartyId) ?? counterpartyId ?? "—",
    type: "Transfer",
    category: "Transfer",
    amount: formatCents(isCredit ? transfer.amount_cents : -transfer.amount_cents, { signed: true }),
    amountCents: transfer.amount_cents,
    date: formatWhen(transfer.created_at),
    status: TRANSFER_STATUS_LABEL[transfer.status] ?? transfer.status,
    fromAccountId: fromId,
    toAccountId: toId,
  };
}

/**
 * Transfers, with the counterparty resolved to a holder name where possible.
 *
 * Three requests, because naming the other side of a transfer is a two-hop walk
 * the API cannot do in one call: transfer -> account -> entity. Both hops are
 * bounded pages, so a counterparty outside them falls back to its account id.
 */
export async function fetchTransactions({ limit = 50, accountId, status } = {}) {
  const [transfersBody, accounts] = await Promise.all([
    get("transfers", { limit, account_id: accountId, status }),
    fetchAccounts({ limit: 200 }).catch(() => []),
  ]);
  const nameByAccountId = new Map(accounts.map((a) => [a.id, a.name]));
  return transfersBody.data.map((t) => toTransaction(t, { nameByAccountId, accountId }));
}

export function fetchAccountTransactions(accountId, opts = {}) {
  return fetchTransactions({ ...opts, accountId });
}

// ------------------------------------------------------------ control results

/**
 * Control evidence, newest first.
 *
 * The only endpoint here with a real cursor: `next_after` is the created_at of
 * the page's last row and the core filters strictly older, so paging forward
 * cannot serve a row twice. Passed straight through rather than folded into a
 * page number, because that is the only token the core accepts.
 *
 * Rows are returned unmapped. `score` is nullable in core.control_result and a
 * null there means "this control does not score", not zero — the distinction
 * survives only if nothing in this layer defaults it.
 */
export async function fetchControlResults({
  control_id,
  decision,
  subject_ref,
  event,
  limit = 50,
  after,
} = {}) {
  const body = await get("control-results", {
    control_id,
    decision,
    subject_ref,
    event,
    limit,
    after,
  });
  return {
    results: body.data ?? [],
    limit: body.pagination?.limit ?? limit,
    hasMore: Boolean(body.pagination?.has_more),
    nextAfter: body.pagination?.next_after ?? null,
  };
}

// --------------------------------------------------------------- obligations

/**
 * The governance calendar's hard ceiling. The endpoint takes no limit param and
 * no cursor: it returns at most this many rows and says nothing about whether
 * there were more. A caller that renders `total` without this number cannot
 * tell a 500-obligation register from a truncated one.
 */
export const OBLIGATIONS_CAP = 500;

/**
 * Every obligation, ordered by next_due_at ascending.
 *
 * `scheduled`/`unscheduled` are the core's own counts, split on anchor_date:
 * an obligation with no anchor has next_due_at null and therefore no position
 * in the calendar at all. Kept as its own bucket rather than sorted to one end.
 */
export async function fetchObligations() {
  const body = await get("governance/obligations");
  return {
    obligations: body.obligations ?? [],
    total: body.total ?? 0,
    scheduled: body.scheduled ?? 0,
    unscheduled: body.unscheduled ?? 0,
  };
}

// ---------------------------------------------------------- dual-control (EPS)

/** Per-list ceiling on GET /eps/pending-approvals. Same blindness as above. */
export const APPROVALS_CAP = 200;

/**
 * The dual-control queue, and separately the payments nobody assessed.
 *
 * Two lists, never merged. `pending` is a payment_approval row awaiting a
 * second pair of eyes. `unassessed` is a payment for which no client limit was
 * configured, so it was neither held for approval nor found exempt — a gap in
 * the policy, not an item in a queue. The core's `warning` states that; it is
 * passed through verbatim rather than restated.
 */
export async function fetchPendingApprovals() {
  const body = await get("eps/pending-approvals");
  return {
    pending: body.pending ?? [],
    pendingCount: body.pending_count ?? 0,
    unassessed: body.unassessed ?? [],
    unassessedCount: body.unassessed_count ?? 0,
    warning: body.warning ?? null,
  };
}

// ---------------------------------------------------------------------- cash

/**
 * One business day of cash, aggregated per person.
 *
 * `businessDate` is required — the core 400s without it rather than defaulting
 * to today, so there is no such thing as "the current day" here.
 *
 * Two requests, for the same reason fetchAccounts makes two: the response
 * identifies people by entity_id only, and the API exposes no join. A person
 * outside the page of entities keeps their id as their label.
 *
 * Amounts are integer cents, and cash_in/cash_out are deliberately not summed:
 * the CTR threshold is assessed against each direction separately.
 */
export async function fetchCashAggregation(businessDate) {
  const [body, members] = await Promise.all([
    get("cash/aggregation", { business_date: businessDate }),
    fetchMembers({ limit: 200 }).catch(() => []),
  ]);
  const nameByEntityId = new Map(members.map((m) => [m.id, m.name]));

  return {
    businessDate: body.business_date,
    // false => the per-person totals below are a LOWER BOUND
    complete: Boolean(body.complete),
    people: (body.people ?? []).map((p) => ({
      entityId: p.entity_id,
      name: nameByEntityId.get(p.entity_id) ?? null,
      cashIn: p.cash_in,
      cashOut: p.cash_out,
      transactionCount: p.transaction_count,
      ctrRequired: Boolean(p.ctr_required),
    })),
    unattributable: {
      transactionCount: body.unattributable?.transaction_count ?? 0,
      cashIn: body.unattributable?.cash_in ?? 0,
      cashOut: body.unattributable?.cash_out ?? 0,
      transactionIds: body.unattributable?.transaction_ids ?? [],
    },
    warning: body.warning ?? null,
  };
}
