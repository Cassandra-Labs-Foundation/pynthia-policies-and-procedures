// One business day of currency, per person, from GET /cash/aggregation.
//
// The endpoint takes a required business_date and 400s without one — there is
// no "current day" to fall back on, so the date is an input the teller sets and
// every result on this panel is labelled with the date it came from.
import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Banknote, Calendar } from 'lucide-react';
import { fetchCashAggregation, formatCents } from '../../lib/api';

/** Today in the browser's timezone, as the YYYY-MM-DD the core expects. */
function today() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export default function CashPosition() {
  const [dateInput, setDateInput] = useState(today);
  const [aggregation, setAggregation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (businessDate) => {
    setIsLoading(true);
    setError('');
    try {
      setAggregation(await fetchCashAggregation(businessDate));
    } catch (err) {
      console.error('Error loading cash aggregation:', err);
      setError(err.message);
      // Dropped, so a stale day's totals cannot sit under a new date's label.
      setAggregation(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load(today());
  }, [load]);

  // The date the displayed numbers are FOR, echoed by the core — not the date
  // sitting in the input, which may have been edited since.
  const shownDate = aggregation?.businessDate;

  return (
    <div className="bg-white rounded-lg border border-slate-200 mb-6">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold flex items-center">
          <Banknote size={18} className="mr-2 text-slate-400" />
          Cash Position
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(dateInput);
          }}
          className="flex items-center space-x-2"
        >
          <div className="flex items-center border border-slate-300 rounded-md overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 text-slate-500">
              <Calendar size={16} />
            </div>
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="border-0 focus:outline-none focus:ring-0 text-sm py-2 px-2"
            />
          </div>
          {/* A date input can be cleared. Disabled rather than firing a request
              the core will reject: there is no day to show without one. */}
          <button
            type="submit"
            disabled={!dateInput}
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Load day
          </button>
        </form>
      </div>

      {error && (
        <div className="m-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <h3 className="font-medium text-red-800">
            Could not load cash for {dateInput}
          </h3>
          <p className="text-sm text-red-600 mt-0.5">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="p-6 text-center">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
          <div>Loading cash for {dateInput}...</div>
        </div>
      ) : !aggregation ? null : (
        <>
          {/* complete:false means transactions on this day could not be tied to
              a person, so every per-person figure below is a floor. A banner,
              not a tooltip: the numbers are unsafe to read without it. */}
          {!aggregation.complete && aggregation.warning && (
            <div className="m-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start">
              <AlertTriangle size={18} className="text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-amber-800">
                  Incomplete day — per-person totals are a lower bound
                </h3>
                <p className="text-sm text-amber-700 mt-0.5">{aggregation.warning}</p>
              </div>
            </div>
          )}

          {aggregation.people.length === 0 ? (
            // Names the date, because "no cash was handled" and "you asked for
            // the wrong day" are otherwise the same empty box.
            <div className="p-6 text-center text-slate-500">
              No cash transactions recorded for {shownDate}.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Person</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Cash in</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Cash out</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Txns</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">CTR</th>
                </tr>
              </thead>
              <tbody>
                {aggregation.people.map((person) => (
                  <tr
                    key={person.entityId}
                    className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50"
                  >
                    <td className="py-3 px-4">
                      {/* The response identifies people by entity_id only. When
                          the name is outside the page of members we looked up,
                          the id stands in — visibly an id, not a name. */}
                      {person.name ? (
                        <div className="font-medium">{person.name}</div>
                      ) : (
                        <div className="font-mono text-xs text-slate-600 break-all">
                          {person.entityId}
                        </div>
                      )}
                    </td>
                    {/* Never summed: the CTR threshold is assessed against each
                        direction on its own. */}
                    <td className="py-3 px-4 text-sm text-right tabular-nums">
                      {formatCents(person.cashIn)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right tabular-nums">
                      {formatCents(person.cashOut)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right tabular-nums text-slate-500">
                      {person.transactionCount}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {person.ctrRequired ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-800">
                          required
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {aggregation.unattributable.transactionCount > 0 && (
            <div className="border-t border-slate-200 p-4">
              <h3 className="text-sm font-medium text-slate-700 mb-1">
                Unattributable — {aggregation.unattributable.transactionCount} transaction(s)
              </h3>
              <p className="text-sm text-slate-500">
                {formatCents(aggregation.unattributable.cashIn)} in,{' '}
                {formatCents(aggregation.unattributable.cashOut)} out, belonging to no person.
                Not counted in any row above.
              </p>
              <div className="mt-2 font-mono text-xs text-slate-500 break-all">
                {aggregation.unattributable.transactionIds.join(', ')}
              </div>
            </div>
          )}

          <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-xs text-slate-500">
            Business day {shownDate} · {aggregation.complete ? 'complete' : 'incomplete'}
          </div>
        </>
      )}
    </div>
  );
}
