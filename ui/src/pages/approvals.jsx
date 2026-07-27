// src/pages/approvals.jsx
//
// The dual-control queue, from GET /eps/pending-approvals.
//
// Two lists, kept apart on purpose. `pending` is a payment held for a second
// pair of eyes. `unassessed` is a payment that was never tested against a
// threshold, because none was configured for its partner — it was NOT held and
// NOT found exempt. Merging them would turn a policy gap into a work queue and
// make it disappear the moment someone approved everything in sight.
import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { APPROVALS_CAP, fetchPendingApprovals, formatCents, formatWhen } from '../lib/api';

/** ach_transfer / wire_transfer -> the rail's own name. */
const RAIL_LABEL = { ach_transfer: 'ACH', wire_transfer: 'Wire' };

function railLabel(rail) {
  return RAIL_LABEL[rail] ?? rail;
}

export default function Approvals() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setData(await fetchPendingApprovals());
      } catch (err) {
        console.error('Error loading pending approvals:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // The endpoint caps each list and reports no total, so a list sitting exactly
  // at the cap is indistinguishable from a truncated one. Say which it might be
  // rather than presenting the count as the whole population.
  const pendingAtCap = (data?.pendingCount ?? 0) >= APPROVALS_CAP;

  // unassessed is capped per rail — 200 ACH plus 200 wires — so the ceiling is
  // per rail too, not on the combined count.
  const unassessedByRail = (data?.unassessed ?? []).reduce((acc, u) => {
    acc[u.rail] = (acc[u.rail] ?? 0) + 1;
    return acc;
  }, {});
  const railsAtCap = Object.entries(unassessedByRail)
    .filter(([, n]) => n >= APPROVALS_CAP)
    .map(([rail]) => railLabel(rail));

  return (
    <MainLayout
      title="Payment Approvals"
      subtitle="Payments awaiting a second pair of eyes, and payments nobody assessed"
    >
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
          <h3 className="font-medium text-red-800">Could not load the approval queue</h3>
          <p className="text-sm text-red-600 mt-0.5">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="p-6 text-center bg-white rounded-lg border border-slate-200">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
          <div>Loading approval queue...</div>
        </div>
      ) : !data ? null : (
        <>
          {/* ------------------------------------------- awaiting approval */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <ShieldCheck size={18} className="mr-2 text-slate-400" />
                Awaiting approval
              </h2>
              <span className="text-sm text-slate-500">{data.pendingCount} pending</span>
            </div>

            {pendingAtCap && (
              <div className="bg-slate-100 border border-slate-200 rounded-md p-3 mb-3 text-sm text-slate-700">
                Showing {APPROVALS_CAP}, the maximum this endpoint returns. There may be more
                pending approvals than are listed here.
              </div>
            )}

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              {data.pending.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  No payments are awaiting approval.
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Rail</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Resource</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Basis</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Threshold</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Requested by</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Requested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.pending.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50"
                      >
                        <td className="py-3 px-4 text-sm font-medium">
                          {railLabel(row.resource_type)}
                        </td>
                        {/* resource_id points into ach_transfer/wire_transfer,
                            neither of which has a GET route — there is no way
                            from here to fetch the amount, the parties or the
                            status. The raw id is shown, labelled as what it is,
                            rather than rendered as a transfer we cannot read. */}
                        <td className="py-3 px-4">
                          <div className="font-mono text-xs text-slate-700 break-all">
                            {row.resource_id}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {row.resource_type} id — not resolvable from this UI
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">{row.basis ?? '—'}</td>
                        <td className="py-3 px-4 text-sm text-right tabular-nums">
                          {row.threshold_cents === null || row.threshold_cents === undefined
                            ? <span className="text-slate-400">—</span>
                            : formatCents(row.threshold_cents)}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600 break-all">
                          {row.created_by ?? '—'}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-500 whitespace-nowrap">
                          {formatWhen(row.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {data.pending.length > 0 && (
                <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-xs text-slate-500">
                  Approving a payment is a write. This proxy is read-only, so approvals are
                  recorded through the core API, not from here.
                </div>
              )}
            </div>
          </div>

          {/* --------------------------------------------------- unassessed */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <AlertTriangle size={18} className="mr-2 text-slate-400" />
                Never assessed
              </h2>
              <span className="text-sm text-slate-500">{data.unassessedCount} payment(s)</span>
            </div>

            {/* The core's own wording, verbatim: it is the statement of what the
                gap is, and paraphrasing it here would soften it. */}
            {data.warning && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 flex items-start">
                <AlertTriangle size={18} className="text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800">{data.warning}</p>
              </div>
            )}

            {railsAtCap.length > 0 && (
              <div className="bg-slate-100 border border-slate-200 rounded-md p-3 mb-3 text-sm text-slate-700">
                {railsAtCap.join(' and ')} {railsAtCap.length === 1 ? 'is' : 'are'} at{' '}
                {APPROVALS_CAP}, the per-rail maximum this endpoint returns. There may be more
                unassessed payments on {railsAtCap.length === 1 ? 'that rail' : 'those rails'}.
              </div>
            )}

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              {data.unassessed.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  Every payment was assessed against a configured limit.
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Rail</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Resource</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.unassessed.map((row) => (
                      <tr
                        key={`${row.rail}:${row.id}`}
                        className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50"
                      >
                        <td className="py-3 px-4 text-sm font-medium">{railLabel(row.rail)}</td>
                        <td className="py-3 px-4">
                          <div className="font-mono text-xs text-slate-700 break-all">{row.id}</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {row.rail} id — not resolvable from this UI
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-right tabular-nums">
                          {formatCents(row.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </MainLayout>
  );
}
