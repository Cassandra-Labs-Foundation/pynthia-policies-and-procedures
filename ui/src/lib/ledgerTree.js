// The ledger, arranged the way an accountant reads one.
//
// gl.js groups balances by BLNK LEDGER, which is a technical grouping — it
// tells you which container a balance lives in, not what it is. This file
// arranges the same balances by ACCOUNTING CLASSIFICATION:
//
//   Assets
//     Cash and equivalents      → the institution's debit-side balances
//     Loans and leases          → (no source yet)
//     Investments               → (no source yet)
//   Liabilities
//     Member shares and deposits
//       Share drafts (902)      → drill to the 1,822 member accounts
//       Regular shares (657)      → drill to postings under each
//       Certificates (908C) …
//     Non-member deposits       → (no source yet)
//     Borrowings                → (no source yet)
//   Equity                      → (no source yet)
//
// ─────────────────────────────────────────────────────────────────────────────
// HOW THE CLASSIFICATION IS DERIVED, AND WHERE IT IS A JUDGEMENT
//
// Blnk does not classify anything. Its balances carry no chart-of-accounts
// field — the four institution balances have literally empty `meta_data`. So
// this mapping is derived, and the two rules it uses are stated here rather
// than buried:
//
//   1. A balance whose meta_data.core_resource points at a `account` row is a
//      MEMBER account. Money in it is owed to a member, so it is a LIABILITY
//      regardless of which side its current balance sits on. This rule is
//      solid — it follows from what the account IS, not from its posture.
//
//   2. Every other balance is the institution's own. These are classified by
//      DEBIT/CREDIT POSTURE: debit-heavy reads as an asset, credit-heavy as a
//      liability. That is an inference, not a declaration, and it is labelled
//      as one in the UI. A real chart of accounts would say outright; until
//      one exists this is the most honest reading available, and it is
//      exactly the kind of thing to put in front of Katya rather than assume.
//
// Sub-categorisation of member shares reuses ACCOUNT_TYPE_MAP from
// ncua5300.js on purpose: the accounting page and the call report must not
// disagree about what a share draft is.
import { ACCOUNT_TYPE_MAP, UNMAPPED_SHARE_LINE } from "./ncua5300";

/** The 5300 share lines, in the order the form lists them. */
const SHARE_LINES = [
  { code: "902", title: "Share drafts" },
  { code: "657", title: "Regular shares" },
  { code: "911", title: "Money market shares" },
  { code: "908C", title: "Share certificates" },
  { code: "906C", title: "IRA / Keogh" },
  { code: UNMAPPED_SHARE_LINE, title: "All other shares" },
];

/** Lines with no source in this core, kept visible so the gap is legible. */
const UNSOURCED = {
  assets: [
    {
      id: "loans",
      title: "Loans and leases",
      needs: "loan balances — core.loan exists but no writer sets balance or principal_cents",
    },
    {
      id: "investments",
      title: "Investments",
      needs: "a portfolio posted to the ledger — core.position values are POSTed in, not derived",
    },
    { id: "fixed", title: "Fixed assets and premises", needs: "a fixed-asset register (none exists)" },
  ],
  liabilities: [
    {
      id: "nonmember",
      title: "Non-member deposits",
      needs: "a member/nonmember flag on the account — nothing joins core.membership to core.account",
    },
    {
      id: "borrowings",
      title: "Borrowings and notes payable",
      needs: "a borrowings ledger — core.liquidity_facility has no drawn-balance column",
    },
  ],
  equity: [
    {
      id: "retained",
      title: "Undivided earnings and reserves",
      needs: "an income statement — the core has no income or expense accounts",
    },
  ],
};

/**
 * Arrange balances into the accounting tree.
 *
 * `accounts` are raw core.account rows, used for two things: mapping a Blnk
 * balance back to the account a human recognises, and reading `account_type`
 * so member shares land on the right 5300 line.
 */
export function buildLedgerTree({ gl, accounts = [] }) {
  const byId = new Map(accounts.map((a) => [a.id, a]));
  const balanceToAccount = new Map(
    accounts.filter((a) => a.blnk_balance_id).map((a) => [a.blnk_balance_id, a.id]),
  );

  const allBalances = gl.ledgers.flatMap((l) => l.balances);

  // ---------------------------------------------------- member liabilities
  const shareBuckets = new Map(SHARE_LINES.map((l) => [l.code, []]));
  const institution = [];

  for (const bal of allBalances) {
    const acctId =
      balanceToAccount.get(bal.id) ?? bal.meta?.core_resource?.id ?? null;
    if (acctId && byId.has(acctId)) {
      const type = (byId.get(acctId).account_type ?? "").toLowerCase();
      const code = ACCOUNT_TYPE_MAP[type] ?? UNMAPPED_SHARE_LINE;
      shareBuckets.get(code)?.push({ ...bal, label: acctId, accountId: acctId, accountType: type });
    } else {
      institution.push({ ...bal, label: bal.id, accountId: null });
    }
  }

  const shareGroups = SHARE_LINES.map(({ code, title }) => {
    const rows = (shareBuckets.get(code) ?? []).sort((a, b) => b.net - a.net);
    return {
      id: code,
      title,
      code,
      accounts: rows,
      count: rows.length,
      totalCents: rows.reduce((s, r) => s + r.net, 0),
      debit: rows.reduce((s, r) => s + r.debit, 0),
      credit: rows.reduce((s, r) => s + r.credit, 0),
    };
  }).filter((g) => g.count > 0);

  const memberTotal = shareGroups.reduce((s, g) => s + g.totalCents, 0);

  // ------------------------------------------- institution's own accounts
  // Debit-heavy reads as an asset, credit-heavy as a liability. Inferred from
  // posture, flagged as inferred wherever it is rendered.
  const assetSide = institution.filter((b) => b.debit > b.credit);
  const liabilitySide = institution.filter((b) => b.debit <= b.credit);

  const sum = (rows, f) => rows.reduce((s, r) => s + f(r), 0);
  // Asset balances are debit-heavy, so their Blnk `net` (credit − debit) is
  // negative. Flipped here so an asset reads as a positive figure, which is
  // how a balance sheet presents one.
  const assetTotal = -sum(assetSide, (r) => r.net);

  const sections = [
    {
      id: "assets",
      title: "Assets",
      totalCents: assetTotal,
      inferred: assetSide.length > 0,
      groups: [
        ...(assetSide.length
          ? [{
            id: "cash",
            title: "Cash and equivalents",
            accounts: assetSide.map((b) => ({ ...b, net: -b.net })).sort((a, b) => b.net - a.net),
            count: assetSide.length,
            totalCents: assetTotal,
            debit: sum(assetSide, (r) => r.debit),
            credit: sum(assetSide, (r) => r.credit),
            inferred: true,
          }]
          : []),
        ...UNSOURCED.assets,
      ],
    },
    {
      id: "liabilities",
      title: "Liabilities",
      totalCents: memberTotal + sum(liabilitySide, (r) => r.net),
      groups: [
        {
          id: "member-shares",
          title: "Member shares and deposits",
          subgroups: shareGroups,
          count: shareGroups.reduce((s, g) => s + g.count, 0),
          totalCents: memberTotal,
          debit: shareGroups.reduce((s, g) => s + g.debit, 0),
          credit: shareGroups.reduce((s, g) => s + g.credit, 0),
        },
        ...(liabilitySide.length
          ? [{
            id: "institution-liab",
            title: "Institution accounts (credit-side)",
            accounts: liabilitySide.sort((a, b) => b.net - a.net),
            count: liabilitySide.length,
            totalCents: sum(liabilitySide, (r) => r.net),
            debit: sum(liabilitySide, (r) => r.debit),
            credit: sum(liabilitySide, (r) => r.credit),
            inferred: true,
          }]
          : []),
        ...UNSOURCED.liabilities,
      ],
    },
    {
      id: "equity",
      title: "Equity",
      totalCents: null,
      groups: UNSOURCED.equity,
    },
  ];

  return {
    sections,
    // Assets vs liabilities+equity. Equity is unsourced, so this cannot be a
    // balance-sheet check — it is reported as the two sides and their gap,
    // and the UI says which piece is missing rather than implying a break.
    assetsCents: assetTotal,
    liabilitiesCents: memberTotal + sum(liabilitySide, (r) => r.net),
    equitySourced: false,
    counts: {
      memberAccounts: shareGroups.reduce((s, g) => s + g.count, 0),
      institutionAccounts: institution.length,
    },
  };
}
