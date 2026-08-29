// Metadata, live sourcing, and status for the full NCUA 5300 form shell.
//
// The line-item STRUCTURE (every section, column, label, and account code) lives
// in ncua5300Shell.js, transcribed straight from the official March-2025 form —
// 537 line items, 1,142 account codes across the 11 subsections. This file is
// the thin layer on top that a UI needs: where each subsection sits in the
// navigator, when it must be filed, which of its codes the core can actually
// source, and — computed live — how complete it is.
//
// The honesty rule is unchanged, now applied per code: a code the core cannot
// produce is never invented. Only the handful the core genuinely knows (member
// share balances and the totals derived from them) get a live value; everything
// else is a blank a person keys, or a line that does not apply.
import { SHELL_SECTIONS } from './ncua5300Shell';
import { bucketShares } from './ncua5300';

export const FORM_EDITION = 'NCUA 5300 · Version 2025.1 · effective March 31, 2025';

// Schedules H and I apply only above this asset threshold (cents).
export const RBC_THRESHOLD_CENTS = 500_000_000_00;

export const SCHEDULE_GROUPS = [
  'Financial Statements',
  'Loan Information',
  'Cash & Investments',
  'Other Schedules',
];

/**
 * The 11 subsections, in the form's own order. `kind` routes presentation:
 *   sofc      — the balance sheet; gets the totals tiles + FBO reconciliation.
 *   statement — the income statement (rendered generically).
 *   schedule  — a lettered schedule A–G (rendered generically).
 *   threshold — H / I, which only apply above $500M in assets.
 * Everything renders its lines from SHELL_SECTIONS; `kind` only adds or gates
 * the extras around them.
 */
export const SCHEDULES = [
  { id: 'sofc', kind: 'sofc', group: 'Financial Statements',
    title: 'Statement of Financial Condition', short: 'Financial Condition',
    when: 'All credit unions, every reporting period.' },
  { id: 'income', kind: 'statement', group: 'Financial Statements',
    title: 'Statement of Income and Expense', short: 'Income & Expense',
    when: 'All credit unions, every reporting period.',
    needs: 'an income statement — the core has no income or expense accounts, so every line is unknown, not zero.' },
  { id: 'sched-a', kind: 'schedule', letter: 'A', group: 'Loan Information',
    title: 'Loans and Leases', short: 'Loans & Leases',
    when: 'If your credit union has any loans.',
    needs: 'loan balances — core.loan carries no balance or principal, so no loan schedule can be assembled.' },
  { id: 'sched-b', kind: 'schedule', letter: 'B', group: 'Cash & Investments',
    title: 'Investments', short: 'Investments',
    when: 'If you hold AFS/HTM, trading, or time-deposit investments.',
    needs: 'an investment portfolio posted to a GL — core.position/security hold caller-supplied values, not ledger balances.' },
  { id: 'sched-c', kind: 'schedule', letter: 'C', group: 'Other Schedules',
    title: 'Liquidity, Commitments & Contingent Liabilities', short: 'Liquidity',
    when: 'If you have unfunded commitments, off-balance-sheet exposures, contingent liabilities, or borrowings.',
    needs: 'a commitments/borrowings ledger with drawn balances — the core has none.' },
  { id: 'sched-d', kind: 'schedule', letter: 'D', group: 'Other Schedules',
    title: 'Shares and Supplemental Information', short: 'Shares',
    when: 'If your credit union has shares.',
    needs: 'the maturity split and member counts — share totals are sourced live; the split is not.' },
  { id: 'sched-e', kind: 'schedule', letter: 'E', group: 'Other Schedules',
    title: 'Supplemental Information', short: 'Supplemental',
    when: 'If you have grants, employees, branches, remittances, MSBs, or CUSOs.',
    needs: 'HR, branch, remittance and BSA reference data — none is modelled in the core.' },
  { id: 'sched-f', kind: 'schedule', letter: 'F', group: 'Other Schedules',
    title: 'Derivatives', short: 'Derivatives',
    when: 'If your credit union uses derivative contracts.',
    needs: 'a derivatives book — the core holds no derivative positions.' },
  { id: 'sched-g', kind: 'schedule', letter: 'G', group: 'Other Schedules',
    title: 'Capital Adequacy (Net Worth)', short: 'Capital Adequacy',
    when: 'If you completed a qualifying merger, use a total-assets election, or adopted CECL.',
    needs: 'equity accounts and an income statement — net worth rolls up 940/658/602, none of which exist as derived balances.' },
  { id: 'sched-h', kind: 'threshold', letter: 'H', group: 'Other Schedules',
    title: 'Complex CU Leverage Ratio (CCULR)', short: 'CCULR',
    when: 'Only if quarter-end assets exceed $500,000,000 and you opt in.' },
  { id: 'sched-i', kind: 'threshold', letter: 'I', group: 'Other Schedules',
    title: 'Risk-Based Capital (RBC) Ratio', short: 'Risk-Based Capital',
    when: 'Only if quarter-end assets exceed $500,000,000.' },
];

export const STATE_META = {
  complete: { label: 'Complete', tone: 'good' },
  partial: { label: 'Partial', tone: 'info' },
  empty: { label: 'No source', tone: 'muted' },
  na: { label: 'Not required', tone: 'muted' },
};

/** The transcribed sections for a subsection id. */
export function sectionsFor(id) {
  return SHELL_SECTIONS[id] || [];
}

/** Every non-null account code appearing in a set of sections. */
export function codesOf(sections) {
  const out = [];
  for (const s of sections) {
    for (const l of s.lines) {
      for (const c of (l.codes || [])) if (c) out.push(c);
    }
  }
  return out;
}

/**
 * The values the core can genuinely source, keyed by NCUA account code.
 *
 * This is the ENTIRETY of what a coreless-of-GL system can fill on a 5300: the
 * member share balances by product (bucketed from core.account), their total,
 * and the deposit totals derived from them (non-member deposits are zero by the
 * 2026-08-16 decision). Two places carry each — the balance sheet uses 013/018,
 * Schedule D's maturity table uses SH0013/SH0018 and the per-product codes — so
 * both are filled from the one reading.
 */
export function computeSourced({ accounts = [] } = {}) {
  const { cents } = bucketShares(accounts); // { 902, 657, 911, 908C, 906C, 630 }
  const total = Object.values(cents).reduce((a, b) => a + b, 0);
  const map = { ...cents };
  map['013'] = total;   // Member Shares of All Types (balance sheet)
  map['SH0013'] = total; // Total Shares, Schedule D total-amount column
  map['880'] = 0;        // Non-member deposits — zero by decision
  map['SH0880'] = 0;
  map['018'] = total;    // Total Shares and Deposits (= 013 while 880 = 0)
  map['SH0018'] = total;
  return map;
}

/** cents from a raw keyed string, or null. Kept here so status and totals agree. */
export function keyedCents(raw) {
  if (raw == null) return null;
  const cleaned = String(raw).replace(/[$,\s]/g, '').trim();
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

/**
 * Status of one subsection given what is sourced and what the user has keyed.
 * Four distinct states — the schedule-level echo of the line-level
 * sourced/derived/unsourced discipline, plus a genuine "not required".
 */
export function subsectionStatus(sched, { sourcedByCode = {}, keyed = {}, sharesSourcedCents = 0 } = {}) {
  if (sched.kind === 'threshold') {
    const under = sharesSourcedCents < RBC_THRESHOLD_CENTS;
    return { state: 'na', detail: under ? 'Not required — assets well under $500M' : 'Required only above $500M', total: 0, sourced: 0, keyed: 0 };
  }
  const uniq = [...new Set(codesOf(sectionsFor(sched.id)))];
  const sourced = uniq.filter((c) => c in sourcedByCode).length;
  const keyedN = uniq.filter((c) => keyed[c] != null && keyed[c] !== '').length;
  const filled = sourced + keyedN;
  const state = filled === 0 ? 'empty' : filled >= uniq.length ? 'complete' : 'partial';
  const detail = filled === 0
    ? `${uniq.length} lines · no source`
    : `${filled} of ${uniq.length} filled${sourced ? ` · ${sourced} live` : ''}`;
  return { state, detail, total: uniq.length, sourced, keyed: keyedN };
}

/** Roll the per-subsection states into one headline for the whole form. */
export function formReadiness(ctx) {
  const states = SCHEDULES.map((s) => subsectionStatus(s, ctx).state);
  const withData = states.filter((s) => s === 'partial' || s === 'complete').length;
  const notRequired = states.filter((s) => s === 'na').length;
  return { total: SCHEDULES.length, withData, notRequired, applicable: SCHEDULES.length - notRequired };
}
