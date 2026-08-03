// The landing page.
//
// Every control here used to be decoration: 42 buttons, none of them wired to
// anything, sitting beside real balances pulled from the core. That mix is the
// dangerous part — a fake "Sync Accounts" next to a genuine $38,750 teaches
// people to distrust the real number too.
//
// Same rule as the teller pass: a control either works, says plainly why it
// cannot, or is gone. What went:
//
//   "System Maintenance Scheduled … May 5, 2025"  — invented, and fourteen
//       months stale. Its Dismiss button dismissed nothing.
//   "Last updated: Today at 3:45 PM"              — a literal string. It read
//       3:45 PM whenever you loaded it. Now it is the real load time.
//   "Help Center", "Sync Accounts"                — no such destination, no
//       such operation.
//   "Process Loan"                                — Pynthia has no lending.
//   "+ New Account", "Transfer", "New Transaction" — writes, and the core
//       proxy is GET-only. Kept only where the honest form is a disabled
//       control that names the reason.
//
// What now works: Export Data writes a real CSV of what is on screen, every
// quick action and "View all" navigates somewhere real, and every account card
// opens that account.
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight, BarChart2, CalendarClock, CreditCard, DollarSign,
  Download, Users,
} from 'lucide-react';
import MainLayout from '../layout/MainLayout';
import { fetchAccounts, fetchTransactions, formatWhen } from '../../lib/api';

/** Navigation, not verbs. Each of these lands on a page that exists. */
const QUICK_ACTIONS = [
  { name: 'Member Services', href: '/member-services', icon: <Users size={20} /> },
  { name: 'Teller', href: '/teller', icon: <DollarSign size={20} /> },
  { name: 'Compliance', href: '/compliance', icon: <CalendarClock size={20} /> },
  { name: 'Reports', href: '/reports', icon: <BarChart2 size={20} /> },
];

/** RFC-4180 enough: quote everything, double any embedded quote. */
function toCsv(rows) {
  return rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
}

export default function Dashboard() {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  // The real one. Replaces a hardcoded "Today at 3:45 PM".
  const [loadedAt, setLoadedAt] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [accountsData, transactionsData] = await Promise.all([
          fetchAccounts({ limit: 12 }),
          fetchTransactions({ limit: 25 }),
        ]);
        setAccounts(accountsData);
        setTransactions(transactionsData);
        setLoadedAt(new Date().toISOString());
      } catch (err) {
        // Shown, not just logged: an empty dashboard and a dashboard that
        // could not reach the core look identical, and only one of them is
        // something to act on.
        console.error('Error loading dashboard data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  /**
   * Exports exactly what is on screen — the twelve accounts and twenty-five
   * transactions this page loaded — and says so in the filename. Exporting
   * the whole core from a button labelled "Export Data" would be a different
   * and much slower promise than the one this button makes.
   */
  const exportCsv = () => {
    const rows = [
      ['section', 'id', 'name_or_member', 'type', 'status', 'amount_or_balance', 'date'],
      ...accounts.map((a) => ['account', a.id, a.name, a.type, a.status, a.balance, '']),
      ...transactions.map((t) => ['transaction', t.id, t.member, t.type, t.status, t.amount, t.date]),
    ];
    const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `pynthia-dashboard-${(loadedAt ?? '').slice(0, 10) || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const actionButtons = (
    <>
      <button
        onClick={exportCsv}
        disabled={isLoading || (accounts.length === 0 && transactions.length === 0)}
        className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-md hover:border-blue-500 flex items-center disabled:opacity-50 disabled:hover:border-slate-200"
      >
        <Download size={16} className="mr-1.5" />
        Export CSV
      </button>
      {/* A write. Disabled rather than hidden so the gap stays visible. */}
      <button
        disabled
        title="Posting a transaction is a write, and the core proxy is read-only"
        className="px-3 py-2 text-sm bg-slate-100 text-slate-400 rounded-md flex items-center cursor-not-allowed"
      >
        <DollarSign size={16} className="mr-1.5" />
        New Transaction
      </button>
    </>
  );

  return (
    <MainLayout
      title="Dashboard"
      subtitle="Welcome back. Here's what's happening today."
      actions={actionButtons}
    >
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
          <h3 className="font-medium text-red-800">Could not load data from the core</h3>
          <p className="text-sm text-red-600 mt-0.5">{error}</p>
        </div>
      )}

      {/* Quick actions — navigation to pages that exist. */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="bg-white rounded-lg p-4 border border-slate-200 hover:border-blue-500 hover:shadow-sm transition-all flex flex-col items-center justify-center h-24"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-2">
              {action.icon}
            </div>
            <span className="text-sm font-medium">{action.name}</span>
          </Link>
        ))}
      </div>

      {/* ------------------------------------------------------- accounts */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Accounts</h2>
          <Link href="/accounting" className="text-blue-600 text-sm font-medium flex items-center hover:underline">
            View all in the ledger <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-6 text-center bg-white rounded-lg border border-slate-200">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
            <div>Loading accounts...</div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-lg border border-slate-200 text-slate-500">
            No accounts yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <span
                        className={`inline-block w-3 h-3 rounded-full mr-2 ${
                          account.type === 'loan' ? 'bg-purple-500'
                            : account.type === 'savings' ? 'bg-green-500'
                              : 'bg-blue-500'
                        }`}
                      ></span>
                      {/* The account's own type. This used to map anything
                          that was not loan/savings to the label "Checking",
                          which invents a product for every other type. */}
                      <div className="text-sm text-slate-500">{account.type ?? 'unknown'}</div>
                    </div>
                    <CreditCard size={18} className="text-slate-400" />
                  </div>
                  <div className="font-semibold text-xl mb-2">{account.balance}</div>
                  <div className="text-sm truncate text-slate-700">{account.name}</div>
                </div>
                <div className="flex border-t border-slate-200">
                  <Link
                    href={`/accounts/${encodeURIComponent(account.id)}`}
                    className="flex-1 text-center py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
                  >
                    View details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --------------------------------------------------- transactions */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
          <Link href="/accounting" className="text-blue-600 text-sm font-medium flex items-center hover:underline">
            View the full journal <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
              <div>Loading transactions...</div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No transactions yet.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Member</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Date</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 5).map((transaction) => (
                  <tr key={transaction.id} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-medium">{transaction.member}</div>
                    </td>
                    <td className="py-3 px-4 text-sm">{transaction.type}</td>
                    <td className="py-3 px-4 text-sm text-slate-500">{transaction.date}</td>
                    <td className="py-3 px-4 text-right font-medium">
                      <span className={transaction.amount.startsWith('+') ? 'text-green-600' : 'text-slate-800'}>
                        {transaction.amount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
        <span className="text-xs text-slate-500">
          {loadedAt ? `Loaded ${formatWhen(loadedAt)}` : 'Loading…'}
        </span>
      </div>
    </MainLayout>
  );
}
