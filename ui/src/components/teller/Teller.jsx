// The teller console: drawer, member lookup, cash position, and the journal.
//
// Every control on this page either does what it says or says why it cannot.
// The journal's earlier draft rendered a row of live-looking dead buttons —
// Export, New Transaction, View all, Details, Reverse, Previous/Next — plus a
// hardcoded "of 243" over a real population of ~1,100 transfers. The read
// controls are now wired; the two writes (New Transaction, Reverse) are gone
// or disabled because the proxy behind this UI is read-only by design.
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DollarSign, Filter, Download, Calendar, Clock, ArrowRight } from 'lucide-react';
import MainLayout from '../layout/MainLayout';
import TellerDrawer from './TellerDrawer';
import MemberQuickEdit from './MemberQuickEdit';
import CashPosition from './CashPosition';
import { fetchTransactions } from '../../lib/api';

/** Predicates for the date-range filter, evaluated against createdAt. */
const RANGES = {
  all: () => true,
  today: (at, now) => sameDay(at, now),
  yesterday: (at, now) => sameDay(at, new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)),
  this_week: (at, now) => at >= startOfWeek(now),
  this_month: (at, now) => at.getFullYear() === now.getFullYear() && at.getMonth() === now.getMonth(),
};

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfWeek(now) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - d.getDay());
  return d;
}

/** "acct_146781f5-3850-44de-8558-8d995e9b64d0" -> "acct_146781f5…9b64d0". */
function shortId(id) {
  if (!id || id.length <= 22) return id;
  return `${id.slice(0, 13)}…${id.slice(-6)}`;
}

/** The loaded journal as CSV. Quotes doubled per RFC 4180. */
function toCsv(rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = ['transfer_id', 'counterparty', 'status', 'amount', 'created_at', 'from_account', 'to_account'];
  const lines = rows.map((t) =>
    [t.id, t.member, t.status, t.amount, t.createdAt, t.fromAccountId, t.toAccountId].map(esc).join(','),
  );
  return [header.join(','), ...lines].join('\n');
}

export default function Teller() {
  const [showFilters, setShowFilters] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showingAll, setShowingAll] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState('');

  // Functional filters, applied client-side to the loaded rows.
  const [statusFilter, setStatusFilter] = useState('all');
  const [rangeFilter, setRangeFilter] = useState('all');

  // Real transfers from the banking core, via the server-side proxy
  useEffect(() => {
    async function loadData() {
      try {
        setTransactions(await fetchTransactions({ limit: 50 }));
      } catch (err) {
        console.error("Error loading transactions:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // "View all" walks every page of /transfers — ~1,100 rows, several requests.
  const handleViewAll = async () => {
    if (showingAll || loadingAll) return;
    setLoadingAll(true);
    setError('');
    try {
      setTransactions(await fetchTransactions({ all: true }));
      setShowingAll(true);
    } catch (err) {
      console.error('Error loading all transfers:', err);
      setError(err.message);
    } finally {
      setLoadingAll(false);
    }
  };

  // Statuses offered are the statuses present, so the filter cannot promise a
  // value the data never takes.
  const statuses = useMemo(
    () => [...new Set(transactions.map((t) => t.status))].sort(),
    [transactions],
  );

  const visible = useMemo(() => {
    const now = new Date();
    const inRange = RANGES[rangeFilter] ?? RANGES.all;
    return transactions.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (rangeFilter !== 'all') {
        if (!t.createdAt) return false;
        const at = new Date(t.createdAt);
        if (Number.isNaN(at.getTime()) || !inRange(at, now)) return false;
      }
      return true;
    });
  }, [transactions, statusFilter, rangeFilter]);

  const handleExport = () => {
    // What is exported is what is on screen: the current filter, not the
    // unfiltered load, so the file matches what the teller just reviewed.
    const blob = new Blob([toCsv(visible)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teller-journal-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const actionButtons = (
    <>
      <button
        onClick={handleExport}
        disabled={isLoading || visible.length === 0}
        className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-md hover:border-blue-500 flex items-center disabled:opacity-50"
      >
        <Download size={16} className="mr-1.5" />
        Export Journal
      </button>
      {/* No POST /transfers reaches the browser — the proxy is read-only by
          design. Disabled with the reason, not dead with no explanation. */}
      <button
        disabled
        title="The core proxy is read-only; transactions cannot be created from this UI."
        className="px-3 py-2 text-sm bg-slate-200 text-slate-400 rounded-md flex items-center cursor-not-allowed"
      >
        <DollarSign size={16} className="mr-1.5" />
        New Transaction — read-only
      </button>
    </>
  );

  return (
    <MainLayout
      title="Teller Console"
      subtitle="Handle transactions for walk-in members"
      actions={actionButtons}
    >
      {/* Teller Drawer Component */}
      <TellerDrawer />

      {/* Member Quick Edit Component */}
      <MemberQuickEdit />

      {/* Cash aggregated for one business day, per person */}
      <CashPosition />

      {/* Transaction Journal */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Transaction Journal</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-slate-600 bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm hover:border-blue-500"
            >
              <Filter size={16} className="mr-1.5" />
              Filter
            </button>
            {!showingAll && (
              <button
                onClick={handleViewAll}
                disabled={loadingAll}
                className="text-blue-600 text-sm font-medium flex items-center ml-2 disabled:opacity-50"
              >
                {loadingAll ? 'Loading all…' : 'View all'} <ArrowRight size={16} className="ml-1" />
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date Range</label>
              <div className="flex items-center border border-slate-300 rounded-md overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 text-slate-500">
                  <Calendar size={16} />
                </div>
                <select
                  value={rangeFilter}
                  onChange={(e) => setRangeFilter(e.target.value)}
                  className="w-full border-0 focus:outline-none focus:ring-0 text-sm py-2"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Statuses</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <h3 className="font-medium text-red-800">Could not load the journal</h3>
            <p className="text-sm text-red-600 mt-0.5">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
              <div>Loading transactions...</div>
            </div>
          ) : visible.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              {transactions.length === 0 ? 'No transactions yet.' : 'No transactions match the current filter.'}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Member</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Date</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Amount</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(transaction => (
                  <React.Fragment key={transaction.id}>
                  <tr className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      {/* A member name links to the holder's profile. When no
                          holder exists — 1,794 of 1,829 accounts here carry
                          entity_id null, and the core offers no write to link
                          one later — the id links to the account page instead,
                          shortened, so the row still leads somewhere real
                          without dressing an account up as a person. */}
                      {transaction.memberEntityId ? (
                        <Link
                          href={`/members/${transaction.memberEntityId}`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {transaction.member}
                        </Link>
                      ) : transaction.counterpartyAccountId ? (
                        <Link
                          href={`/accounts/${transaction.counterpartyAccountId}`}
                          className="font-mono text-xs text-blue-600 hover:text-blue-800"
                          title={`${transaction.counterpartyAccountId} — no member linked; open the account`}
                        >
                          {shortId(transaction.counterpartyAccountId)}
                        </Link>
                      ) : (
                        <div className="text-sm text-slate-400">—</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm">{transaction.type}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800">
                        {transaction.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-500 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1.5 text-slate-400" />
                        {transaction.date}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-medium whitespace-nowrap">
                      <span className={transaction.amount.startsWith('+') ? 'text-green-600' : 'text-slate-800'}>
                        {transaction.amount}
                      </span>
                      {transaction.status === 'pending' && (
                        <span className="ml-2 text-xs font-medium bg-yellow-100 text-yellow-800 py-0.5 px-1.5 rounded">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setExpandedId(expandedId === transaction.id ? null : transaction.id)}
                        className="text-blue-600 text-sm font-medium hover:text-blue-800"
                      >
                        {expandedId === transaction.id ? 'Hide' : 'Details'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === transaction.id && (
                    <tr className="border-b border-slate-200 last:border-b-0 bg-slate-50">
                      <td colSpan={6} className="py-3 px-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-xs text-slate-600">
                          <div><span className="text-slate-400">Transfer</span> <span className="font-mono">{transaction.id}</span></div>
                          <div><span className="text-slate-400">Created</span> {transaction.createdAt ?? '—'}</div>
                          <div><span className="text-slate-400">From</span> <span className="font-mono">{transaction.fromAccountId ?? '—'}</span></div>
                          <div><span className="text-slate-400">To</span> <span className="font-mono">{transaction.toAccountId ?? '—'}</span></div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
          <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between">
            {/* Real counts only. The endpoint reports no total, so before
                "View all" the size of the rest is simply unknown — say that,
                rather than invent a number to sit beside real rows. */}
            <div className="text-sm text-slate-500">
              {showingAll
                ? `Showing ${visible.length} of all ${transactions.length} transfers`
                : `Showing ${visible.length} of the ${transactions.length} most recent transfers`}
            </div>
            {!showingAll && !isLoading && (
              <button
                onClick={handleViewAll}
                disabled={loadingAll}
                className="text-blue-600 text-sm font-medium disabled:opacity-50"
              >
                {loadingAll ? 'Loading…' : 'Load every transfer'}
              </button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
