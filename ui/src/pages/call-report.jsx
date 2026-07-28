// src/pages/call-report.jsx
//
// The NCUA 5300 operator view, from GET /reports/5300.
//
// The whole design problem here is that this page shows TWO CLOCKS and an
// operator must never confuse them:
//
//   - the FBO position is live, advanced continuously against an event
//     sequence by the Payment Hub;
//   - everything else is a daily snapshot written by a scheduled job, whose
//     newest row can be a day old or missing entirely.
//
// So the live figure is the only one presented as "now", it carries its
// sequence number, and the daily figures are all stamped with the date they
// describe. A single merged "current position" tile would be a number that
// silently stops moving at midnight.
import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Activity, RefreshCw } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { fetchReport5300, formatCents, formatWhen } from '../lib/api';

/** How often the live position re-polls, in ms. */
const REFRESH_MS = 30000;

/** "2026-07-25" -> "Jul 25". The as_of column is a date, not a moment. */
function formatDay(iso) {
  if (!iso) return '—';
  const at = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(at.getTime())) return '—';
  return at.toLocaleDateString([], { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/** Day-over-day delta, or null when there is no previous row to compare to. */
function delta(rows, index, field) {
  const prev = rows[index + 1];
  if (!prev) return null;
  const a = rows[index]?.[field];
  const b = prev[field];
  if (typeof a !== 'number' || typeof b !== 'number') return null;
  return a - b;
}

export default function CallReport() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastPolled, setLastPolled] = useState(null);

  const load = useCallback(async (isPoll) => {
    if (isPoll) setIsRefreshing(true);
    try {
      setData(await fetchReport5300());
      setError('');
      setLastPolled(new Date().toISOString());
    } catch (err) {
      console.error('Error loading the 5300 report:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(false);
    // The live half of this page is only live if it re-asks. The daily half
    // comes along for the ride, which is harmless — it just will not change.
    const timer = setInterval(() => load(true), REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const rows = data?.history ?? [];

  return (
    <MainLayout
      title="Call Report (5300)"
      subtitle="Settled volume, alert counts and the FBO position this instance reports"
      actions={
        <button
          onClick={() => load(true)}
          disabled={isRefreshing}
          className="px-3 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50 flex items-center disabled:opacity-50"
        >
          <RefreshCw size={16} className={`mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      }
    >
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
          <h3 className="font-medium text-red-800">Could not load the call report</h3>
          <p className="text-sm text-red-600 mt-0.5">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="p-6 text-center bg-white rounded-lg border border-slate-200">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
          <div>Loading call report...</div>
        </div>
      ) : !data ? null : (
        <>
          {/* ------------------------------------------------ the live figure */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 mb-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center text-sm font-medium text-slate-500 mb-1">
                  <Activity size={15} className="mr-1.5 text-green-600" />
                  FBO position — live
                </div>
                <div className="text-3xl font-semibold tabular-nums">
                  {data.current
                    ? formatCents(data.current.fbo_position_cents)
                    : <span className="text-slate-400 text-xl">not reported</span>}
                </div>
                {data.current && (
                  <div className="text-xs text-slate-500 mt-1.5">
                    {/* The sequence number is what makes this checkable: two
                        operators looking at the same figure can tell whether
                        they are looking at the same moment. */}
                    event seq {String(data.current.last_seq)} · advanced{' '}
                    {formatWhen(data.current.updated_at)}
                  </div>
                )}
              </div>
              <div className="text-right text-xs text-slate-400">
                <div>{data.instanceId}</div>
                {lastPolled && <div className="mt-1">polled {formatWhen(lastPolled)}</div>}
              </div>
            </div>
          </div>

          {/* The stale banner is the point of the `stale` field: without it a
              reader cannot tell "nothing happened today" from "the job that
              would have told you has not run". */}
          {data.stale && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start">
              <AlertTriangle size={16} className="text-amber-600 mr-2 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-800">
                <span className="font-medium">
                  Today&rsquo;s aggregation has not run.
                </span>{' '}
                The daily figures below are as of {formatDay(data.asOf)}. Only the live
                position above reflects activity since then.
                {data.cadence && (
                  <div className="text-xs text-amber-700 mt-1">{data.cadence}</div>
                )}
              </div>
            </div>
          )}

          {/* --------------------------------------------- the daily snapshots */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-4">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h2 className="text-sm font-medium text-slate-700">Daily aggregation</h2>
              <span className="text-xs text-slate-500">{rows.length} day(s)</span>
            </div>
            {rows.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                No aggregation rows for this instance yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500">Date</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500">Period</th>
                      <th className="text-right py-2.5 px-4 text-xs font-medium text-slate-500">Settled</th>
                      <th className="text-right py-2.5 px-4 text-xs font-medium text-slate-500">Count</th>
                      <th className="text-right py-2.5 px-4 text-xs font-medium text-slate-500">CTR alerts</th>
                      <th className="text-right py-2.5 px-4 text-xs font-medium text-slate-500">Structuring</th>
                      <th className="text-right py-2.5 px-4 text-xs font-medium text-slate-500">FBO (snapshot)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const d = delta(rows, i, 'settled_cents');
                      return (
                        <tr
                          key={`${r.instance_id}-${r.as_of}`}
                          className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50"
                        >
                          <td className="py-2.5 px-4 text-sm font-medium">{formatDay(r.as_of)}</td>
                          <td className="py-2.5 px-4 text-sm text-slate-500">{r.period}</td>
                          <td className="py-2.5 px-4 text-sm text-right tabular-nums">
                            {formatCents(r.settled_cents)}
                            {d !== null && d !== 0 && (
                              <span className="text-xs text-slate-400 ml-1.5">
                                {formatCents(d, { signed: true })}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-sm text-right tabular-nums text-slate-600">
                            {r.settled_count}
                          </td>
                          <td className="py-2.5 px-4 text-sm text-right tabular-nums">
                            {r.ctr_alerts > 0
                              ? <span className="text-amber-700">{r.ctr_alerts}</span>
                              : <span className="text-slate-400">0</span>}
                          </td>
                          <td className="py-2.5 px-4 text-sm text-right tabular-nums">
                            {r.structuring_alerts > 0
                              ? <span className="text-amber-700">{r.structuring_alerts}</span>
                              : <span className="text-slate-400">0</span>}
                          </td>
                          <td className="py-2.5 px-4 text-sm text-right tabular-nums text-slate-600">
                            {formatCents(r.fbo_position_cents)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* This page is named after a regulatory filing, so the one reason it
              is NOT one belongs on the page — not only in BLUEPRINT §521. */}
          {data.chartOfAccountsNote && (
            <div className="bg-slate-100 border border-slate-200 rounded-md p-3 text-sm text-slate-700">
              <span className="font-medium">Not a filing.</span> {data.chartOfAccountsNote}
            </div>
          )}
        </>
      )}
    </MainLayout>
  );
}
