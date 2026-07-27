// src/pages/reports.jsx
//
// Control evidence, straight off GET /control-results. This is the examiner's
// view: every decision a control recorded, newest first, filterable by the four
// dimensions the core indexes on.
//
// The other report families this page used to advertise (5300, BSA rollups,
// scheduled exports) have no endpoint behind them, so they are not listed here
// as if they were a click away.
import React, { useCallback, useEffect, useState } from 'react';
import { Filter } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { fetchControlResults, formatWhen } from '../lib/api';

const PAGE_SIZE = 50;

const DECISIONS = ['pass', 'hold', 'block', 'reject', 'clear'];

const DECISION_STYLE = {
  pass: 'bg-green-50 text-green-800',
  clear: 'bg-green-50 text-green-800',
  hold: 'bg-amber-50 text-amber-800',
  block: 'bg-red-50 text-red-800',
  reject: 'bg-red-50 text-red-800',
};

const EMPTY_FILTERS = { control_id: '', decision: '', event: '', subject_ref: '' };

export default function Reports() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  // `applied` is what the last request actually used. Kept separate from
  // `filters` so edits in the form don't silently relabel rows already loaded.
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [results, setResults] = useState([]);
  const [nextAfter, setNextAfter] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (active, after) => {
    const isFirstPage = !after;
    if (isFirstPage) setIsLoading(true);
    else setIsLoadingMore(true);
    setError('');

    try {
      const page = await fetchControlResults({
        ...Object.fromEntries(Object.entries(active).filter(([, v]) => v !== '')),
        limit: PAGE_SIZE,
        after,
      });
      // Append on a cursor page, replace on a fresh query.
      setResults((prev) => (isFirstPage ? page.results : [...prev, ...page.results]));
      setHasMore(page.hasMore);
      setNextAfter(page.nextAfter);
      setApplied(active);
    } catch (err) {
      console.error('Error loading control results:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    load(EMPTY_FILTERS, null);
  }, [load]);

  const activeFilters = Object.entries(applied).filter(([, v]) => v !== '');

  return (
    <MainLayout
      title="Control Results"
      subtitle="Every decision the compliance controls recorded, newest first"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(filters, null);
        }}
        className="bg-white rounded-lg border border-slate-200 p-4 mb-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Control</label>
            <input
              type="text"
              value={filters.control_id}
              onChange={(e) => setFilters({ ...filters, control_id: e.target.value })}
              placeholder="e.g. CG-VEL-01"
              className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Decision</label>
            <select
              value={filters.decision}
              onChange={(e) => setFilters({ ...filters, decision: e.target.value })}
              className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Any decision</option>
              {DECISIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Event</label>
            {/* core.control_result.event is untyped text. In the seeded data it
                holds the id of the resource that triggered the control (tr_…),
                not an event name, so the hint says so rather than promising a
                vocabulary the column does not have. */}
            <input
              type="text"
              value={filters.event}
              onChange={(e) => setFilters({ ...filters, event: e.target.value })}
              placeholder="e.g. tr_6f1856da…"
              className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
            <input
              type="text"
              value={filters.subject_ref}
              onChange={(e) => setFilters({ ...filters, subject_ref: e.target.value })}
              placeholder="account or transfer id"
              className="w-full border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
        <div className="flex items-center justify-end mt-4 space-x-2">
          <button
            type="button"
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              load(EMPTY_FILTERS, null);
            }}
            className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-md hover:border-blue-500"
          >
            Clear
          </button>
          <button
            type="submit"
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <Filter size={16} className="mr-1.5" />
            Apply
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <h3 className="font-medium text-red-800">Could not load control results</h3>
          <p className="text-sm text-red-600 mt-0.5">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
            <div>Loading control results...</div>
          </div>
        ) : results.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            {activeFilters.length === 0 ? (
              'No control results recorded.'
            ) : (
              <>
                No control results match{' '}
                {activeFilters.map(([k, v]) => `${k}=${v}`).join(', ')}.
              </>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Control</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Decision</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Event</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Subject</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Score</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Recorded</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row) => (
                <tr key={row.id} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-sm">{row.control_id}</td>
                  <td className="py-3 px-4 text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        DECISION_STYLE[row.decision] ?? 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {row.decision}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">{row.event ?? '—'}</td>
                  <td className="py-3 px-4 text-sm font-mono text-xs text-slate-600 break-all">
                    {row.subject_ref ?? '—'}
                  </td>
                  {/* A null score means the control does not score, which is
                      not the same as scoring zero. */}
                  <td className="py-3 px-4 text-sm text-right tabular-nums">
                    {row.score === null || row.score === undefined ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      row.score
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-500 whitespace-nowrap">
                    {formatWhen(row.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!isLoading && results.length > 0 && (
          <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              {/* No total: the endpoint returns a cursor page and no count, so
                  the honest statement is how many are on screen. */}
              {results.length} loaded{hasMore ? ', more available' : ''}
            </div>
            {hasMore && (
              <button
                onClick={() => load(applied, nextAfter)}
                disabled={isLoadingMore}
                className="px-3 py-1.5 border border-slate-300 rounded-md text-sm bg-white hover:border-blue-500 disabled:opacity-50"
              >
                {isLoadingMore ? 'Loading...' : 'Load more'}
              </button>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
