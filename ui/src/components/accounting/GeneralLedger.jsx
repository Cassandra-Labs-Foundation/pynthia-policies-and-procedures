// The general ledger, three levels deep.
//
//   Ledger  →  Balance (GL account)  →  Postings
//
// Each level expands in place rather than navigating away, because the question
// a GL answers is nested: "what is this total" → "which accounts make it up" →
// "which entries moved this account". Losing your place on every drill is what
// makes people export to Excel in the first place.
//
// Postings show BOTH sides. A double-entry posting hits two accounts, so from
// any given account it is either a debit or a credit, and the counterparty is
// named — that is the difference between a ledger and a transaction list.
import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatCents, formatWhen } from '../../lib/api';

const STATUS_STYLE = {
  APPLIED: 'bg-green-50 text-green-800',
  INFLIGHT: 'bg-amber-50 text-amber-800',
  VOID: 'bg-slate-100 text-slate-600',
};

/** A short, still-identifiable id. Full value stays in the title attribute. */
function shortId(id, keep = 12) {
  if (!id) return '—';
  return id.length <= keep + 3 ? id : `${id.slice(0, keep)}…`;
}

export default function GeneralLedger({ gl, accountByBalanceId }) {
  const [openLedgers, setOpenLedgers] = useState(() => new Set());
  const [openBalances, setOpenBalances] = useState(() => new Set());

  const toggle = (set, setter) => (id) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  };
  const toggleLedger = toggle(openLedgers, setOpenLedgers);
  const toggleBalance = toggle(openBalances, setOpenBalances);

  const tb = gl.trialBalance;

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-4">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h2 className="text-sm font-medium text-slate-700">General ledger</h2>
        <span className="text-xs text-slate-500">
          {gl.counts.ledgers} ledgers · {gl.counts.balances}
          {gl.truncated.balances ? '+' : ''} accounts · {gl.counts.postings}
          {gl.truncated.postings ? '+' : ''} postings
        </span>
      </div>

      {/* ------------------------------------------------- trial balance */}
      <div className="px-4 py-3 border-b border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-xs font-medium text-slate-500">Total debits</div>
          <div className="text-lg font-semibold tabular-nums">{formatCents(tb.debit)}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-slate-500">Total credits</div>
          <div className="text-lg font-semibold tabular-nums">{formatCents(tb.credit)}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-slate-500">Difference</div>
          <div className="text-lg font-semibold tabular-nums">
            {formatCents(tb.difference, { signed: true })}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-slate-500">Trial balance</div>
          <div className="text-lg font-semibold">
            {/* Three-valued on purpose: a capped row set cannot be checked, and
                saying so is not the same as saying the ledger is broken. */}
            {tb.balanced === null ? (
              <span className="text-slate-400 text-sm">not checkable — rows capped</span>
            ) : tb.balanced ? (
              <span className="text-green-700">balances</span>
            ) : (
              <span className="text-red-700">out of balance</span>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------ the tree */}
      <div>
        {gl.ledgers.map((ledger) => {
          const open = openLedgers.has(ledger.id);
          return (
            <div key={ledger.id} className="border-b border-slate-200 last:border-b-0">
              <button
                onClick={() => toggleLedger(ledger.id)}
                className="w-full flex items-center px-4 py-3 hover:bg-slate-50 text-left"
              >
                {open ? (
                  <ChevronDown size={16} className="text-slate-400 mr-2 shrink-0" />
                ) : (
                  <ChevronRight size={16} className="text-slate-400 mr-2 shrink-0" />
                )}
                <span className="font-medium text-sm flex-1">
                  {ledger.name}
                  {ledger.unlisted && (
                    <span className="ml-2 text-xs text-amber-700">unlisted ledger</span>
                  )}
                  <span className="ml-2 text-xs text-slate-400 font-normal">
                    {ledger.balanceCount} account{ledger.balanceCount === 1 ? '' : 's'}
                  </span>
                </span>
                <span className="text-sm tabular-nums text-slate-600 w-36 text-right hidden sm:block">
                  Dr {formatCents(ledger.totalDebit)}
                </span>
                <span className="text-sm tabular-nums text-slate-600 w-36 text-right hidden sm:block">
                  Cr {formatCents(ledger.totalCredit)}
                </span>
                <span className="text-sm tabular-nums font-medium w-36 text-right">
                  {formatCents(ledger.totalNet)}
                </span>
              </button>

              {open && ledger.balances.length === 0 && (
                <div className="px-12 py-3 text-sm text-slate-500 bg-slate-50">
                  No accounts in this ledger.
                </div>
              )}

              {open && ledger.balances.length > 0 && (
                <div className="bg-slate-50">
                  {ledger.balances.map((bal) => {
                    const bOpen = openBalances.has(bal.id);
                    const postings = gl.postingsByBalance.get(bal.id) ?? [];
                    const coreAccount = accountByBalanceId?.get(bal.id);
                    return (
                      <div key={bal.id} className="border-t border-slate-200">
                        <button
                          onClick={() => toggleBalance(bal.id)}
                          className="w-full flex items-center pl-10 pr-4 py-2 hover:bg-slate-100 text-left"
                        >
                          {bOpen ? (
                            <ChevronDown size={14} className="text-slate-400 mr-2 shrink-0" />
                          ) : (
                            <ChevronRight size={14} className="text-slate-400 mr-2 shrink-0" />
                          )}
                          <span className="flex-1 min-w-0">
                            {/* The core account id is the name a human knows
                                this GL account by; the bln_ id is the ledger's. */}
                            <span className="text-sm font-mono" title={bal.id}>
                              {coreAccount ? (
                                <span className="text-slate-800">{coreAccount}</span>
                              ) : (
                                <span className="text-slate-600">{shortId(bal.id, 16)}</span>
                              )}
                            </span>
                            <span className="ml-2 text-xs text-slate-400">
                              {postings.length} posting{postings.length === 1 ? '' : 's'}
                              {bal.inflight !== 0 && (
                                <span className="text-amber-700 ml-1.5">
                                  · {formatCents(bal.inflight)} inflight
                                </span>
                              )}
                            </span>
                          </span>
                          <span className="text-xs tabular-nums text-slate-500 w-36 text-right hidden sm:block">
                            {formatCents(bal.debit)}
                          </span>
                          <span className="text-xs tabular-nums text-slate-500 w-36 text-right hidden sm:block">
                            {formatCents(bal.credit)}
                          </span>
                          <span className="text-sm tabular-nums w-36 text-right">
                            {formatCents(bal.net)}
                          </span>
                        </button>

                        {bOpen && (
                          <div className="bg-white border-t border-slate-200">
                            {postings.length === 0 ? (
                              <div className="pl-16 pr-4 py-3 text-sm text-slate-500">
                                No postings for this account within the {gl.counts.postings}
                                {gl.truncated.postings ? '+' : ''} most recent loaded.
                                {gl.truncated.postings &&
                                  ' Older entries exist but were not fetched.'}
                              </div>
                            ) : (
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-slate-200">
                                    <th className="text-left py-2 pl-16 pr-4 text-xs font-medium text-slate-500">Posting</th>
                                    <th className="text-left py-2 px-4 text-xs font-medium text-slate-500">Side</th>
                                    <th className="text-left py-2 px-4 text-xs font-medium text-slate-500">Counterparty</th>
                                    <th className="text-right py-2 px-4 text-xs font-medium text-slate-500">Amount</th>
                                    <th className="text-left py-2 px-4 text-xs font-medium text-slate-500">Status</th>
                                    <th className="text-left py-2 px-4 text-xs font-medium text-slate-500">When</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {postings.map((p) => {
                                    const other = p.side === 'debit' ? p.source : p.destination;
                                    const otherCore = accountByBalanceId?.get(other);
                                    return (
                                      <tr
                                        key={`${p.id}-${p.side}`}
                                        className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                                      >
                                        <td className="py-2 pl-16 pr-4 text-xs">
                                          <span className="font-mono text-slate-600" title={p.id}>
                                            {shortId(p.id, 14)}
                                          </span>
                                          {p.description && (
                                            <div className="text-slate-400">{p.description}</div>
                                          )}
                                        </td>
                                        <td className="py-2 px-4 text-xs">
                                          <span
                                            className={
                                              p.side === 'debit' ? 'text-blue-700' : 'text-purple-700'
                                            }
                                          >
                                            {p.side === 'debit' ? 'Dr' : 'Cr'}
                                          </span>
                                        </td>
                                        <td className="py-2 px-4 text-xs font-mono text-slate-600" title={other ?? ''}>
                                          {otherCore ?? shortId(other, 14)}
                                        </td>
                                        <td className="py-2 px-4 text-sm text-right tabular-nums">
                                          {formatCents(p.amount)}
                                        </td>
                                        <td className="py-2 px-4">
                                          <span
                                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                              STATUS_STYLE[p.status] ?? 'bg-slate-100 text-slate-700'
                                            }`}
                                          >
                                            {p.status}
                                          </span>
                                        </td>
                                        <td className="py-2 px-4 text-xs text-slate-500 whitespace-nowrap">
                                          {formatWhen(p.createdAt)}
                                          {/* The thread back to the member-facing
                                              record that caused this entry. No
                                              transfer detail page exists yet, and
                                              the old link sent a tr_ id to the
                                              ACCOUNT page — a guaranteed 404 — so
                                              until one exists this is a plain
                                              reference, not a road to nowhere. */}
                                          {p.coreTransferId && (
                                            <span
                                              className="ml-2 text-slate-400 font-mono"
                                              title={p.reference}
                                            >
                                              {p.coreTransferId.slice(0, 14)}…
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(gl.truncated.balances || gl.truncated.postings) && (
        <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-200 text-xs text-amber-800">
          Row caps reached
          {gl.truncated.balances && ` — accounts capped at ${gl.counts.balances}`}
          {gl.truncated.postings && ` — postings capped at ${gl.counts.postings}`}. Totals and the
          trial balance above cover only what was loaded.
        </div>
      )}
    </div>
  );
}
