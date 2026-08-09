// NCUA Form 5300 — Statement of Financial Condition, as a data model.
//
// This file is the FORM, not the data: the line order, the real NCUA account
// codes, the rollup arithmetic, and — for every line this core cannot yet
// produce — the name of the thing that would have to exist first.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHY MOST LINES ARE UNSOURCED, AND WHY THAT IS THE POINT
//
// A 5300 is built from a trial balance. This core does not have one:
//
//   - `core.bookkeeping_entry` is SINGLE-SIDED. It has one `amount` and no
//     debit/credit pair, no account_id, no GL tree. Its own table comment
//     calls it "a double-entry ledger posting", which is false.
//   - `account_code_5300` is hardcoded to the literal "018" on every row
//     (core/supabase/functions/api/transfers.ts). 018 is not even a postable
//     line — it is Total Shares and Deposits, a COMPUTED TOTAL that NCUA
//     auto-populates from 013 + 880. Every movement in this core is booked to
//     a cell the filer cannot write to.
//   - `core.loan` exists but no writer ever sets a balance, so total loans is
//     not "zero", it is unknown.
//   - There are no income, expense, equity, ALLL or fixed-asset accounts at all.
//
// So a line that renders "$0" would be a lie in the one place a lie is most
// expensive. Every line here is therefore one of three states, and the
// difference between the last two is the entire value of this module:
//
//   SOURCED    — a real figure, traceable to a real core read.
//   DERIVED    — a subtotal, computable only when all its inputs are sourced.
//   UNSOURCED  — the core cannot produce it. Renders as "—" with `needs`
//                naming the missing thing. NEVER as zero.
//
// This mirrors how the rest of this codebase treats a red control: it stays
// red and names what it wants, rather than going green on invented input.
// docs/history/blueprint.md §521 already records the chart-of-accounts mapping as a
// decision waiting on a person, not an engineering task.
//
// ─────────────────────────────────────────────────────────────────────────────
// SOURCE OF THE CODES
//
// Account codes and descriptions are NCUA's own, from the 5300 Account
// Descriptions publication. They are stable across recent form versions for
// the Statement of Financial Condition, but this file pins the vintage it was
// written against so a future reader can diff it rather than trust it.
export const FORM_VINTAGE = "NCUA 5300 account descriptions (Statement of Financial Condition)";

/**
 * What this file does NOT cover, stated so its absence is not mistaken for
 * completeness. The full filing is the Statement of Financial Condition plus
 * the Statement of Income and Expense plus 21 sub-schedules (FC-A…FC-T,
 * delinquency, charge-offs, RBC). Only the balance sheet is modelled here,
 * because it is the sheet every credit union must file every period and
 * because nothing beyond it is sourceable until a GL exists.
 */
export const OUT_OF_SCOPE =
  "Statement of Income and Expense and the 21 sub-schedules are not modelled here — " +
  "none of their inputs exist in the core yet.";

export const SECTIONS = [
  { id: "assets", title: "Assets" },
  { id: "liabilities", title: "Liabilities" },
  { id: "shares", title: "Shares and Deposits" },
  { id: "equity", title: "Equity" },
];

/**
 * PROVISIONAL account-type → share-line mapping.
 *
 * This is the "open decision" BLUEPRINT §521 is about, and it is written down
 * here — visibly, in one place, surfaced in the UI — rather than buried in a
 * reducer. `core.account.account_type` is unconstrained free text that
 * defaults to "checking", so these are readings of an informal convention,
 * not a chart of accounts.
 *
 * A credit union has no "checking accounts": the member-facing equivalent is a
 * SHARE DRAFT account (902). That mapping is conventional and defensible, and
 * it is still an assumption someone with the authority to make it has to sign
 * off before anything here is filed.
 */
export const ACCOUNT_TYPE_MAP = {
  checking: "902",
  share_draft: "902",
  share: "657",
  savings: "657",
  money_market: "911",
  share_certificate: "908C",
  certificate: "908C",
  ira: "906C",
  keogh: "906C",
};

/** Types the map does not know fall here, and the UI names them explicitly. */
export const UNMAPPED_SHARE_LINE = "630";

/**
 * The form. `level` drives indentation; `total: true` marks a line NCUA
 * computes rather than accepts. `formula` lists the codes a subtotal sums.
 * `needs` is the missing prerequisite, and it is the most important field
 * here — it is what turns "we can't file" into a worklist.
 */
export const LINES = [
  // ─────────────────────────────────────────────────────────── assets
  {
    code: "730A", section: "assets", level: 1, label: "Total Cash on Hand",
    needs: "a vault/teller cash position posted to a GL. core.cash_asset and " +
      "core.cash_enterprise_position hold caller-supplied figures, not ledger balances.",
  },
  {
    code: "730B", section: "assets", level: 1, label: "Total Cash on Deposit",
    // The FBO position is the one genuinely live money figure this system has.
    // Calling it "cash on deposit at other financial institutions" is the
    // standard treatment for an FBO/program-bank model, and it is a mapping
    // decision, so it is flagged as one rather than applied silently.
    provisional:
      "mapped from the live FBO position (aggregator.fbo_position). Correct for an " +
      "FBO/program-bank structure; confirm before filing. SIGN HAZARD: the two " +
      "writers disagree — run_payment_hub ADDS on outflow codes while " +
      "capture_origination subtracts, wire returns never reverse, and no inbound " +
      "code moves it at all — so until that is reconciled this figure can move the " +
      "wrong way and must not be filed unreviewed.",
  },
  {
    code: "730C", section: "assets", level: 1, label: "Cash Equivalents (original maturity ≤ 3 months)",
    needs: "an investment portfolio with maturity buckets posted to a GL.",
  },
  {
    code: "799I", section: "assets", level: 1, label: "Total Investments",
    needs: "core.position and core.security hold par/book/market values that are POSTed " +
      "in by a caller and never derived from a ledger, so they cannot roll up to a balance sheet.",
  },
  {
    code: "025B", section: "assets", level: 1, label: "Total Amount of Loans and Leases",
    needs: "loan balances. core.loan exists but no production writer ever sets " +
      "balance or principal_cents — the column is null on every row.",
  },
  {
    code: "719", section: "assets", level: 1, label: "Allowance for Loan & Lease Losses", contra: true,
    needs: "an ALLL/CECL model. No allowance or provision table exists in the core.",
  },
  {
    code: "007", section: "assets", level: 1, label: "Land and Building",
    needs: "a fixed-asset register. None exists (core.it_asset is an IT ownership " +
      "inventory with no monetary column).",
  },
  { code: "008", section: "assets", level: 1, label: "Other Fixed Assets", needs: "a fixed-asset register." },
  {
    code: "009", section: "assets", level: 1, label: "Total Other Assets",
    needs: "accrued interest receivable and intangibles. core.interest_accrual_run " +
      "computes a total from figures passed in the request body and posts it nowhere.",
  },
  {
    code: "010", section: "assets", level: 0, label: "TOTAL ASSETS", total: true,
    formula: ["730A", "730B", "730C", "799I", "025B", "719", "007", "008", "009"],
  },

  // ────────────────────────────────────────────────────── liabilities
  {
    code: "011C", section: "liabilities", level: 1, label: "Total Other Notes, Promissory Notes and Interest Payable",
    needs: "a borrowings ledger. core.liquidity_facility records FHLB/discount-window " +
      "facilities but carries no drawn-balance column.",
  },
  {
    code: "058C", section: "liabilities", level: 1, label: "Total Borrowing Repurchase Transactions",
    needs: "repo balances. core.repo_agreement holds principal_cents but is not GL-backed.",
  },
  { code: "883C", section: "liabilities", level: 1, label: "Total Draws Against Lines of Credit", needs: "a borrowings ledger." },
  { code: "867C", section: "liabilities", level: 1, label: "Total Subordinated Debt", needs: "a borrowings ledger." },
  {
    code: "820A", section: "liabilities", level: 1, label: "Accrued Dividends & Interest Payable on Shares & Deposits",
    needs: "dividend accrual posted to a GL.",
  },
  {
    code: "825", section: "liabilities", level: 1, label: "Accounts Payable and Other Liabilities",
    needs: "an accounts-payable ledger.",
  },
  {
    code: "860C", section: "liabilities", level: 0, label: "Total Liabilities", total: true,
    formula: ["011C", "058C", "883C", "867C", "820A", "825"],
  },

  // ─────────────────────────────────────────────────────────── shares
  { code: "902", section: "shares", level: 1, label: "Total Amount of Share Drafts", fromAccounts: true },
  { code: "657", section: "shares", level: 1, label: "Total Amount of Regular Share Accounts", fromAccounts: true },
  { code: "911", section: "shares", level: 1, label: "Total Amount of Money Market Shares", fromAccounts: true },
  { code: "908C", section: "shares", level: 1, label: "Total Amount of Share Certificates", fromAccounts: true },
  { code: "906C", section: "shares", level: 1, label: "Total Amount of IRA/KEOGH Accounts", fromAccounts: true },
  { code: "630", section: "shares", level: 1, label: "Total All Other Shares", fromAccounts: true },
  {
    code: "013", section: "shares", level: 0, label: "Total Shares", total: true,
    formula: ["902", "657", "911", "908C", "906C", "630"],
  },
  {
    code: "880", section: "shares", level: 1, label: "Total Non-Member Deposits",
    // Not zero: the core cannot tell a member account from a nonmember one, so
    // "no nonmember deposits" and "we cannot see them" are indistinguishable.
    needs: "a member/nonmember flag on the account. core.membership exists but nothing " +
      "joins it to core.account, so this cannot be reported as zero either.",
  },
  {
    code: "018", section: "shares", level: 0, label: "TOTAL SHARES AND DEPOSITS", total: true,
    formula: ["013", "880"],
    note: "This is the code every bookkeeping_entry in the core is stamped with — and it is " +
      "a computed total NCUA populates itself, not a line a filer can post to.",
  },

  // ─────────────────────────────────────────────────────────── equity
  {
    code: "931", section: "equity", level: 1, label: "Regular Reserves",
    needs: "equity accounts. core.capital_position.net_worth_cents is a caller-supplied " +
      "POST body field, not a derived balance.",
  },
  { code: "940", section: "equity", level: 1, label: "Undivided Earnings", needs: "retained earnings from an income statement. No income or expense accounts exist." },
  { code: "658", section: "equity", level: 1, label: "Other Reserves (Appropriations of Undivided Earnings)", needs: "equity accounts." },
  { code: "945B", section: "equity", level: 1, label: "Other Comprehensive Income", needs: "an AFS portfolio marked to market through equity." },
  { code: "996", section: "equity", level: 1, label: "Miscellaneous Equity", needs: "equity accounts." },
  {
    code: "997", section: "equity", level: 0, label: "Total Net Worth", total: true,
    formula: ["931", "940", "658", "945B", "996"],
  },
  {
    code: "014", section: "equity", level: 0, label: "TOTAL LIABILITIES, SHARES, AND EQUITY", total: true,
    formula: ["860C", "018", "997"],
  },
];

const BY_CODE = new Map(LINES.map((l) => [l.code, l]));

/**
 * Bucket account balances onto share lines using ACCOUNT_TYPE_MAP.
 *
 * Returns the per-line cents AND the unmapped types it fell back on, because
 * an unrecognised account_type silently swept into "All Other Shares" is
 * exactly the kind of quiet misfiling this whole module exists to prevent.
 */
export function bucketShares(accounts) {
  const cents = {};
  const unmappedTypes = new Map();

  for (const a of accounts) {
    // A closed account holds no share balance to report.
    if (a.status === "closed") continue;
    const type = (a.account_type ?? "").toLowerCase();
    const line = ACCOUNT_TYPE_MAP[type];
    const target = line ?? UNMAPPED_SHARE_LINE;
    cents[target] = (cents[target] ?? 0) + (typeof a.balance === "number" ? a.balance : 0);
    if (!line) unmappedTypes.set(type || "(blank)", (unmappedTypes.get(type || "(blank)") ?? 0) + 1);
  }
  return { cents, unmappedTypes: [...unmappedTypes.entries()].map(([type, count]) => ({ type, count })) };
}

/**
 * Assemble the filing.
 *
 * A subtotal is computed ONLY when every input is present. One unsourced
 * input makes the subtotal unsourced too — which is why TOTAL ASSETS is blank
 * and must stay blank. Summing the sourced half would produce a confident
 * number that is wrong by everything the core cannot see, and a balance sheet
 * that is wrong by an unknown amount is worse than one that is visibly absent.
 */
export function buildFiling({ accounts = [], fboPositionCents = null } = {}) {
  const { cents: shareCents, unmappedTypes } = bucketShares(accounts);
  const values = new Map();
  const status = new Map();

  for (const line of LINES) {
    if (line.total) continue;
    if (line.fromAccounts) {
      values.set(line.code, shareCents[line.code] ?? 0);
      status.set(line.code, "sourced");
    } else if (line.code === "730B" && typeof fboPositionCents === "number") {
      values.set(line.code, fboPositionCents);
      status.set(line.code, "sourced");
    } else {
      status.set(line.code, "unsourced");
    }
  }

  // Subtotals, in declaration order so a total may depend on an earlier one
  // (014 needs 860C, 018 and 997; 018 needs 013).
  for (const line of LINES) {
    if (!line.total) continue;
    const parts = line.formula.map((c) => ({ code: c, v: values.get(c), s: status.get(c) }));
    const missing = parts.filter((p) => p.s !== "sourced" && p.s !== "derived");
    if (missing.length === 0) {
      const sum = parts.reduce(
        (acc, p) => acc + (BY_CODE.get(p.code)?.contra ? -(p.v ?? 0) : (p.v ?? 0)),
        0,
      );
      values.set(line.code, sum);
      status.set(line.code, "derived");
    } else {
      status.set(line.code, "unsourced");
      // Kept so the UI can say WHICH inputs blocked the subtotal rather than
      // just that it is blank.
      line.blockedBy = missing.map((m) => m.code);
    }
  }

  const rows = LINES.map((l) => ({
    ...l,
    valueCents: values.has(l.code) ? values.get(l.code) : null,
    status: status.get(l.code),
    blockedBy: l.blockedBy ?? null,
  }));

  const sourced = rows.filter((r) => r.status === "sourced").length;
  const derived = rows.filter((r) => r.status === "derived").length;

  return {
    rows,
    unmappedTypes,
    counts: { sourced, derived, unsourced: rows.length - sourced - derived, total: rows.length },
    // The filing is balanced only if BOTH sides computed and they agree. With
    // the asset side unsourced this is null, not true — "cannot tell" is a
    // distinct answer from "balances", and NCUA rejects a filing that does not.
    balances:
      status.get("010") === "derived" && status.get("014") === "derived"
        ? values.get("010") === values.get("014")
        : null,
    totalAssetsCents: status.get("010") === "derived" ? values.get("010") : null,
    totalLiabEquityCents: status.get("014") === "derived" ? values.get("014") : null,
  };
}

/**
 * The account-code → value payload a filer would key into CUOnline.
 *
 * Only sourced and derived lines are emitted. An unsourced line is omitted
 * entirely rather than sent as 0, because CUOnline cannot distinguish "we
 * reported zero" from "we had nothing to say" once a zero is in the field.
 */
export function toFilingPayload(filing, { asOf, instanceId } = {}) {
  return {
    form: "NCUA 5300",
    section: "Statement of Financial Condition",
    as_of: asOf ?? null,
    instance_id: instanceId ?? null,
    complete: false,
    omitted_codes: filing.rows.filter((r) => r.status === "unsourced").map((r) => r.code),
    accounts: Object.fromEntries(
      filing.rows
        .filter((r) => r.status !== "unsourced")
        .map((r) => [r.code, r.valueCents]),
    ),
  };
}

/** Quarter end a 5300 covers, and when it is due, for a given date. */
export function filingPeriod(date = new Date()) {
  const q = Math.floor(date.getUTCMonth() / 3);
  const endMonth = q * 3 + 2;
  const asOf = new Date(Date.UTC(date.getUTCFullYear(), endMonth + 1, 0));
  // Due 11:59:59pm ET on the 30th of the month following quarter end.
  const due = new Date(Date.UTC(date.getUTCFullYear(), endMonth + 1, 30));
  return {
    quarter: `${date.getUTCFullYear()}-Q${q + 1}`,
    asOf: asOf.toISOString().slice(0, 10),
    dueAt: due.toISOString().slice(0, 10),
  };
}
