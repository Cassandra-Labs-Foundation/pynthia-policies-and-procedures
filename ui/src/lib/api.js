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
    throw new Error(body?.detail || body?.title || `request failed (${res.status})`);
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
