// src/pages/call-report.jsx
//
// Two tabs, because Katya's correction on 31 July was that the FORM is
// universal and what each credit union WATCHES is not:
//
//   Filing   — the NCUA 5300 Statement of Financial Condition, in NCUA's own
//              line order with NCUA's own account codes. Nobody reorders this.
//   My view  — whatever this institution actually wants to look at.
//
// The filing tab is deliberately mostly blank, and that is the honest result.
// See lib/ncua5300.js for why: this core has no trial balance, so a populated
// balance sheet here would be fabricated. Each blank line names the thing that
// has to exist before it can be filled, which turns "we can't file yet" into a
// list someone can work through.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Activity, Download, RefreshCw } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { fetch5300Inputs, formatCents, formatWhen } from '../lib/api';
import { DeltaChip, LiveBadge, LiveValue } from '../components/live/Live';
import { useLiveCore } from '../lib/useLiveCore';
import {
  ACCOUNT_TYPE_MAP,
  FORM_VINTAGE,
  OUT_OF_SCOPE,
  SECTIONS,
  buildFiling,
  filingPeriod,
  toFilingPayload,
} from '../lib/ncua5300';

const PREFS_KEY = 'callReport.myView.v1';

function formatDay(iso) {
  if (!iso) return '—';
  const at = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(at.getTime())) return '—';
  return at.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

/** The tiles "My view" can show — only things the core genuinely produces. */
const TILES = [
  { id: 'fbo', label: 'FBO position (live)' },
  { id: 'shares', label: 'Total shares by type' },
  { id: 'settled', label: 'Settled volume (daily)' },
  { id: 'alerts', label: 'CTR & structuring alerts' },
  { id: 'accounts', label: 'Account counts' },
];
const DEFAULT_PREFS = { fbo: true, shares: true, settled: true, alerts: true, accounts: false };

export default function CallReport() {
  const [tab, setTab] = useState('filing');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);

  // Read prefs after mount, not during render: localStorage does not exist on
  // the server and reading it inline would hydrate-mismatch.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(PREFS_KEY);
      if (saved) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(saved) });
    } catch { /* a corrupt pref must not take the page down */ }
  }, []);

  const toggle = (id) => {
    setPrefs((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try { window.localStorage.setItem(PREFS_KEY, JSON.stringify(next)); } catch { /* private mode */ }
      return next;
    });
  };

  const load = useCallback(async (isPoll) => {
    if (isPoll) setIsRefreshing(true);
    try {
      setData(await fetch5300Inputs());
      setError('');
    } catch (err) {
      console.error('Error loading 5300 inputs:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  /**
   * The heartbeat, shared with the accounting page.
   *
   * Two clocks, and only one is worth asking about every few seconds. The FBO
   * position moves continuously against the core's event sequence; the share
   * lines come from walking all 1,829 accounts — ten sequential requests, ~6s.
   *
   * So the poll is cheap and constant, and the full re-derivation fires only
   * when the sequence advances. A settled transfer changes 902 and 013, and it
   * is the transfer landing that propagates them — not a timer that re-walks
   * the book every thirty seconds whether or not anything happened. (It no
   * longer changes 730B: since 2026-08-16 the FBO position is not a form line
   * at all, only the reconciliation control — see lib/ncua5300.js.)
   */
  const { live, polledAt, lastAdvanceAt, error: liveError } = useLiveCore({
    onAdvance: () => load(true),
  });

  // The live tick supersedes what the last full load captured, so the FBO
  // figure and the daily history stay current between events.
  const merged = useMemo(
    () =>
      data && live
        ? {
          ...data,
          fboPositionCents: live.fboCents,
          lastSeq: live.seq,
          updatedAt: live.eventAt,
          history: live.history.length ? live.history : data.history,
          stale: live.stale,
        }
        : data,
    [data, live],
  );

  const filing = useMemo(
    () =>
      merged
        ? buildFiling({
          accounts: merged.accounts,
          fboPositionCents: merged.fboPositionCents,
          memberShareCents: merged.memberShareCents,
        })
        : null,
    [merged],
  );
  const period = useMemo(() => filingPeriod(new Date()), []);

  // The quarter IN PROGRESS, not the last one filed — this is the live view.
  // So the figures are as of now, and the period end is the date they will
  // eventually be frozen at. Labelling the page "as of Sep 30" while showing
  // today's numbers would misdate every figure on it.
  const subtitle =
    `${period.quarter} in progress · figures live · ` +
    `period closes ${formatDay(period.asOf)}, due ${formatDay(period.dueAt)}`;

  const download = () => {
    const payload = toFilingPayload(filing, { asOf: period.asOf, instanceId: merged?.instanceId });
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `ncua-5300-${period.quarter}-partial.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout
      title="Call Report (5300)"
      subtitle={subtitle}
      actions={
        <div className="flex items-center space-x-3">
          <LiveBadge
            live={live}
            polledAt={polledAt}
            lastAdvanceAt={lastAdvanceAt}
            error={liveError}
          />
          {tab === 'filing' && filing && (
            <button
              onClick={download}
              className="px-3 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50 flex items-center"
            >
              <Download size={16} className="mr-1.5" />
              Export payload
            </button>
          )}
          <button
            onClick={() => load(true)}
            disabled={isRefreshing}
            className="px-3 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50 flex items-center disabled:opacity-50"
          >
            <RefreshCw size={16} className={`mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      }
    >
      <div className="flex space-x-1 border-b border-slate-200 mb-4">
        {[
          ['filing', 'Filing (NCUA form)'],
          ['myview', 'My view'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 ${
              tab === id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <h3 className="font-medium text-red-800">Could not load the call report</h3>
          <p className="text-sm text-red-600 mt-0.5">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="p-6 text-center bg-white rounded-lg border border-slate-200">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
          <div>Loading call report...</div>
        </div>
      ) : !merged || !filing ? null : tab === 'filing' ? (
        <FilingTab data={merged} filing={filing} period={period} />
      ) : (
        <MyViewTab data={merged} filing={filing} prefs={prefs} toggle={toggle} />
      )}
    </MainLayout>
  );
}

// ───────────────────────────────────────────────────────────── filing tab

function FilingTab({ data, filing, period }) {
  const { counts, balances, unmappedTypes, fboReconciliation } = filing;

  return (
    <>
      {/* The headline an operator needs before reading a single line: this is
          not a filing, and here is exactly how far from one it is. */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex items-start">
        <AlertTriangle size={18} className="text-amber-600 mr-2.5 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-900">
          <div className="font-medium mb-1">
            Not submittable — {counts.sourced + counts.derived} of {counts.total} lines have a source.
          </div>
          <p>
            The core has no trial balance: <code className="text-xs">bookkeeping_entry</code> is
            single-sided and every row is stamped account code <code className="text-xs">018</code>,
            which is a total NCUA computes rather than a line a filer can post to. Loans, investments,
            fixed assets, equity and all income and expense accounts are absent, so the lines below
            that show &ldquo;—&rdquo; are <span className="font-medium">unknown, not zero</span>.
          </p>
          <p className="mt-1.5 text-xs text-amber-800">
            NCUA accepts 5300s only through the CUOnline portal, quarterly, due 11:59:59pm ET on the
            30th of January, April, July and October, after certification. There is no filing API —
            the export button produces the account-code payload a filer would key in, with unsourced
            codes omitted rather than sent as zero.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-sm font-medium text-slate-500 mb-1">Total assets (010)</div>
          <div className="text-2xl font-semibold tabular-nums">
            {filing.totalAssetsCents === null
              ? <span className="text-slate-400 text-lg">not computable</span>
              : formatCents(filing.totalAssetsCents)}
          </div>
          <div className="text-xs text-slate-500 mt-1">every input must be sourced first</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-sm font-medium text-slate-500 mb-1">Total liabilities, shares &amp; equity (014)</div>
          <div className="text-2xl font-semibold tabular-nums">
            {filing.totalLiabEquityCents === null
              ? <span className="text-slate-400 text-lg">not computable</span>
              : formatCents(filing.totalLiabEquityCents)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {formatCents(filing.rows.find((r) => r.code === '013')?.valueCents)} of shares is sourced
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-sm font-medium text-slate-500 mb-1">Balance check</div>
          <div className="text-2xl font-semibold">
            {balances === null
              ? <span className="text-slate-400 text-lg">cannot tell</span>
              : balances
                ? <span className="text-green-700">balances</span>
                : <span className="text-red-700">out of balance</span>}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {/* "cannot tell" is a third answer, and collapsing it into either of
                the other two is how a broken filing gets submitted. */}
            010 must equal 014 — NCUA rejects a filing that does not
          </div>
        </div>
      </div>

      {/* The FBO position is deliberately absent from every line below. It is
          the same deposits the share lines carry, aggregated by a different
          consumer, so filing it anywhere would double count — its job is to
          tie out against them. The gap is shown rather than smoothed: it is
          currently the whole of the unmodelled inbound funding. */}
      {fboReconciliation && (
        <div className="bg-white border border-slate-200 rounded-lg p-3 mb-4 text-sm">
          <span className="font-medium">FBO reconciliation</span> — not a filed line.
          This program&rsquo;s members are tracked through its FBO account, so the two
          should agree: position {formatCents(fboReconciliation.positionCents)} vs{' '}
          {formatCents(fboReconciliation.memberShareCents)} of member shares
          {fboReconciliation.ties
            ? ' — ties exactly.'
            : `, a gap of ${formatCents(fboReconciliation.differenceCents)}.`}
          {!fboReconciliation.ties && (
            <span className="text-slate-600">
              {' '}Expected until an inbound funding rail emits: the payment hub applies
              outbound settlement and returns, but nothing yet credits an FBO.
            </span>
          )}
        </div>
      )}

      {unmappedTypes.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-3 mb-4 text-sm">
          <span className="font-medium">Unrecognised account types</span> swept into
          &ldquo;All Other Shares&rdquo; (630):{' '}
          {unmappedTypes.map((u) => `${u.type} ×${u.count}`).join(', ')}. Each needs a
          deliberate line assignment before filing.
        </div>
      )}

      {SECTIONS.map((section) => (
        <div key={section.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <h2 className="text-sm font-medium text-slate-700">{section.title}</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-4 text-xs font-medium text-slate-500 w-20">Code</th>
                <th className="text-left py-2 px-4 text-xs font-medium text-slate-500">Line</th>
                <th className="text-right py-2 px-4 text-xs font-medium text-slate-500 w-44">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filing.rows.filter((r) => r.section === section.id).map((row) => (
                <tr
                  key={row.code}
                  className={`border-b border-slate-200 last:border-b-0 ${
                    row.total ? 'bg-slate-50 font-medium' : ''
                  }`}
                >
                  <td className="py-2 px-4 text-xs font-mono text-slate-500 align-top">{row.code}</td>
                  <td className="py-2 px-4 text-sm align-top" style={{ paddingLeft: `${16 + row.level * 16}px` }}>
                    <span className={row.status === 'unsourced' ? 'text-slate-500' : ''}>{row.label}</span>
                    {row.contra && <span className="text-xs text-slate-400 ml-1.5">(contra)</span>}
                    {row.needs && (
                      <div className="text-xs text-slate-500 mt-0.5 max-w-3xl">Needs: {row.needs}</div>
                    )}
                    {row.provisional && (
                      <div className="text-xs text-blue-700 mt-0.5 max-w-3xl">
                        Provisional mapping: {row.provisional}
                      </div>
                    )}
                    {row.note && (
                      <div className="text-xs text-amber-700 mt-0.5 max-w-3xl">{row.note}</div>
                    )}
                    {row.blockedBy && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        Blocked by unsourced {row.blockedBy.join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-4 text-sm text-right tabular-nums align-top whitespace-nowrap">
                    {row.status === 'unsourced' ? (
                      <span className="text-slate-300">—</span>
                    ) : (
                      <>
                        <LiveValue value={row.valueCents}>
                          {formatCents(row.contra ? -(row.valueCents ?? 0) : row.valueCents)}
                        </LiveValue>
                        <div className="text-xs text-slate-400 font-normal">{row.status}</div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div className="bg-slate-100 border border-slate-200 rounded-md p-3 text-sm text-slate-700">
        <div>
          <span className="font-medium">Share mapping in use:</span>{' '}
          {Object.entries(ACCOUNT_TYPE_MAP).map(([k, v]) => `${k}→${v}`).join(', ')}. Anything else
          falls to 630.
        </div>
        <div className="mt-1.5 text-xs text-slate-600">
          {FORM_VINTAGE}. {OUT_OF_SCOPE}
          {data.truncated && ' Account walk hit its page cap, so share totals are a lower bound.'}
        </div>
      </div>
    </>
  );
}

// ──────────────────────────────────────────────────────────── my view tab

function MyViewTab({ data, filing, prefs, toggle }) {
  const rows = data.history ?? [];
  const shareRows = filing.rows.filter((r) => r.fromAccounts && (r.valueCents ?? 0) > 0);
  const open = data.accounts.filter((a) => a.status === 'open').length;

  return (
    <>
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
        <div className="text-sm font-medium text-slate-700 mb-2">Show</div>
        <div className="flex flex-wrap gap-2">
          {TILES.map((t) => (
            <button
              key={t.id}
              onClick={() => toggle(t.id)}
              className={`px-3 py-1.5 rounded-full text-sm border ${
                prefs[t.id]
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {/* Katya's KPI list, and the honest reason none of it is a toggle yet. */}
        <p className="text-xs text-slate-500 mt-3">
          Loan growth against budget, delinquency rate, loans approaching charge-off and the
          deposit/CD split are not offered here because the core holds no loan balances and no
          budget. They become tiles the day those exist — see the Filing tab for the specifics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {prefs.fbo && (
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center text-sm font-medium text-slate-500 mb-1">
              <Activity size={15} className="mr-1.5 text-green-600" />
              FBO position — live
            </div>
            <div className="text-2xl font-semibold tabular-nums">
              <LiveValue value={data.fboPositionCents}>
                {typeof data.fboPositionCents === 'number'
                  ? formatCents(data.fboPositionCents)
                  : <span className="text-slate-400 text-lg">not reported</span>}
              </LiveValue>
            </div>
            {data.lastSeq !== null && (
              <div className="text-xs text-slate-500 mt-1.5">
                event seq {String(data.lastSeq)} · advanced {formatWhen(data.updatedAt)}
              </div>
            )}
          </div>
        )}
        {prefs.accounts && (
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="text-sm font-medium text-slate-500 mb-1">Accounts</div>
            <div className="text-2xl font-semibold tabular-nums">{data.accounts.length}</div>
            <div className="text-xs text-slate-500 mt-1.5">{open} open</div>
          </div>
        )}
        {prefs.shares && (
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="text-sm font-medium text-slate-500 mb-1">Total shares (013)</div>
            <div className="text-2xl font-semibold tabular-nums">
              {formatCents(filing.rows.find((r) => r.code === '013')?.valueCents)}
            </div>
            <div className="text-xs text-slate-500 mt-1.5">
              {shareRows.map((r) => `${r.code}`).join(', ') || 'no share balances'}
            </div>
          </div>
        )}
      </div>

      {prefs.shares && shareRows.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <h2 className="text-sm font-medium text-slate-700">Shares by type</h2>
          </div>
          <table className="w-full">
            <tbody>
              {shareRows.map((r) => (
                <tr key={r.code} className="border-b border-slate-200 last:border-b-0">
                  <td className="py-2.5 px-4 text-xs font-mono text-slate-500 w-20">{r.code}</td>
                  <td className="py-2.5 px-4 text-sm">{r.label}</td>
                  <td className="py-2.5 px-4 text-sm text-right tabular-nums">{formatCents(r.valueCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(prefs.settled || prefs.alerts) && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h2 className="text-sm font-medium text-slate-700">Daily aggregation</h2>
            <span className="text-xs text-slate-500">
              {rows.length} day(s){data.stale ? ` · today's run has not landed` : ''}
            </span>
          </div>
          {rows.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No aggregation rows for this instance yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500">Date</th>
                    {prefs.settled && <th className="text-right py-2.5 px-4 text-xs font-medium text-slate-500">Settled</th>}
                    {prefs.settled && <th className="text-right py-2.5 px-4 text-xs font-medium text-slate-500">Count</th>}
                    {prefs.alerts && <th className="text-right py-2.5 px-4 text-xs font-medium text-slate-500">CTR alerts</th>}
                    {prefs.alerts && <th className="text-right py-2.5 px-4 text-xs font-medium text-slate-500">Structuring</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={`${r.instance_id}-${r.as_of}`} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-sm font-medium">{formatDay(r.as_of)}</td>
                      {prefs.settled && <td className="py-2.5 px-4 text-sm text-right tabular-nums">{formatCents(r.settled_cents)}</td>}
                      {prefs.settled && <td className="py-2.5 px-4 text-sm text-right tabular-nums text-slate-600">{r.settled_count}</td>}
                      {prefs.alerts && (
                        <td className="py-2.5 px-4 text-sm text-right tabular-nums">
                          {r.ctr_alerts > 0 ? <span className="text-amber-700">{r.ctr_alerts}</span> : <span className="text-slate-400">0</span>}
                        </td>
                      )}
                      {prefs.alerts && (
                        <td className="py-2.5 px-4 text-sm text-right tabular-nums">
                          {r.structuring_alerts > 0 ? <span className="text-amber-700">{r.structuring_alerts}</span> : <span className="text-slate-400">0</span>}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}
