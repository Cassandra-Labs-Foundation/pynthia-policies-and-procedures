// src/pages/compliance.jsx
//
// The governance calendar, from GET /governance/obligations.
//
// Two registers, not one list. An obligation with no anchor_date has no
// next_due_at either — it is real and owned, but it has no place on a calendar.
// Sorting those to the bottom of the schedule would make them look like the
// most distant deadlines instead of the undated work they are.
import React, { useEffect, useState } from 'react';
import { CalendarClock, CalendarOff } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { fetchObligations, formatWhen, OBLIGATIONS_CAP } from '../lib/api';

/**
 * ISO timestamp -> "Jul 19, 2026". Due dates are dates, not moments.
 *
 * Read in UTC, never the browser's zone. next_due_at is midnight UTC derived
 * from a plain `anchor_date` — rendering it locally moves it across a day
 * boundary anywhere west of UTC, so an obligation anchored to 2026-01-01
 * displays as "Dec 31, 2025" and files under the wrong month.
 */
function formatDue(iso) {
  if (!iso) return '—';
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return '—';
  return at.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** "2026-07" and "July 2026" for the month an obligation falls in — UTC, per above. */
function monthOf(iso) {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return null;
  return {
    key: `${at.getUTCFullYear()}-${String(at.getUTCMonth() + 1).padStart(2, '0')}`,
    label: at.toLocaleDateString([], { month: 'long', year: 'numeric', timeZone: 'UTC' }),
  };
}

export default function Compliance() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setData(await fetchObligations());
      } catch (err) {
        console.error('Error loading obligations:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const rows = data?.obligations ?? [];
  // Split on anchor_date, the same field the core counts on.
  const scheduled = rows.filter((o) => o.anchor_date && o.next_due_at);
  const unscheduled = rows.filter((o) => !o.anchor_date || !o.next_due_at);

  // The endpoint has no limit param and no cursor: it returns at most 500 rows
  // and cannot say whether there were more. A register sitting exactly at the
  // ceiling looks complete, so name the ceiling.
  const atCap = rows.length >= OBLIGATIONS_CAP;

  const now = Date.now();
  const months = [];
  for (const o of scheduled) {
    const month = monthOf(o.next_due_at);
    if (!month) continue;
    let bucket = months.find((m) => m.key === month.key);
    if (!bucket) {
      bucket = { ...month, obligations: [] };
      months.push(bucket);
    }
    bucket.obligations.push(o);
  }

  return (
    <MainLayout
      title="Compliance Calendar"
      subtitle="Recurring governance obligations and what they are anchored to"
    >
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
          <h3 className="font-medium text-red-800">Could not load the obligation register</h3>
          <p className="text-sm text-red-600 mt-0.5">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="p-6 text-center bg-white rounded-lg border border-slate-200">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
          <div>Loading obligations...</div>
        </div>
      ) : !data ? null : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Stat label="Obligations" value={data.total} />
            <Stat label="Scheduled" value={data.scheduled} />
            <Stat label="Unscheduled" value={data.unscheduled} />
          </div>

          {atCap && (
            <div className="bg-slate-100 border border-slate-200 rounded-md p-3 mb-6 text-sm text-slate-700">
              Showing {OBLIGATIONS_CAP}, the maximum this endpoint returns. The register may hold
              more obligations than are listed here.
            </div>
          )}

          {/* ---------------------------------------------------- scheduled */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <CalendarClock size={18} className="mr-2 text-slate-400" />
              Scheduled
            </h2>

            {months.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-lg border border-slate-200 text-slate-500">
                No obligation has a due date.
              </div>
            ) : (
              months.map((month) => (
                <div
                  key={month.key}
                  className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-4"
                >
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="font-medium text-sm">{month.label}</span>
                    <span className="text-xs text-slate-500">
                      {month.obligations.length} due
                    </span>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-4 text-sm font-medium text-slate-500">Due</th>
                        <th className="text-left py-2 px-4 text-sm font-medium text-slate-500">Obligation</th>
                        <th className="text-left py-2 px-4 text-sm font-medium text-slate-500">Owner</th>
                        <th className="text-left py-2 px-4 text-sm font-medium text-slate-500">Cadence</th>
                        <th className="text-left py-2 px-4 text-sm font-medium text-slate-500">Last completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {month.obligations.map((o) => {
                        const overdue = new Date(o.next_due_at).getTime() < now;
                        return (
                          <tr
                            key={o.id}
                            className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50"
                          >
                            <td className="py-3 px-4 text-sm whitespace-nowrap">
                              <span className={overdue ? 'text-red-700 font-medium' : ''}>
                                {formatDue(o.next_due_at)}
                              </span>
                              {overdue && (
                                <span className="ml-2 text-xs font-medium bg-red-100 text-red-800 py-0.5 px-1.5 rounded">
                                  overdue
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-sm">{o.title ?? o.trigger_code}</div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {o.control_uid ?? '—'}
                                {o.trigger_code ? ` · ${o.trigger_code}` : ''}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-600">
                              {o.owner_role ?? '—'}
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-600">{o.cadence ?? '—'}</td>
                            <td className="py-3 px-4 text-sm text-slate-500 whitespace-nowrap">
                              {o.last_completed_at ? formatWhen(o.last_completed_at) : 'never'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>

          {/* -------------------------------------------------- unscheduled */}
          <div>
            <h2 className="text-lg font-semibold mb-2 flex items-center">
              <CalendarOff size={18} className="mr-2 text-slate-400" />
              Unscheduled
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              No anchor date, so no next due date was computed. These are owned obligations with
              no position on the calendar — not obligations due far in the future.
            </p>

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              {unscheduled.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  Every obligation is anchored to a date.
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Obligation</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Owner</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Cadence</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Last completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unscheduled.map((o) => (
                      <tr
                        key={o.id}
                        className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-sm">{o.title ?? o.trigger_code}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {o.control_uid ?? '—'}
                            {o.trigger_code ? ` · ${o.trigger_code}` : ''}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">{o.owner_role ?? '—'}</td>
                        <td className="py-3 px-4 text-sm text-slate-600">{o.cadence ?? '—'}</td>
                        <td className="py-3 px-4 text-sm text-slate-500 whitespace-nowrap">
                          {o.last_completed_at ? formatWhen(o.last_completed_at) : 'never'}
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

function Stat({ label, value }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="font-semibold text-2xl mt-1 tabular-nums">{value}</div>
    </div>
  );
}
