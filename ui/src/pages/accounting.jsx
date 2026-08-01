// src/pages/accounting.jsx
//
// The ledger view, from the read-only core proxy.
//
// Two books appear side by side and they are not the same book:
//
//   - the MEMBER LEDGER is the sum of every core.account balance — what the
//     institution owes its members, summed by walking every page;
//   - the FBO POSITION is the Payment Hub's live cash figure, advanced against
//     an event sequence (same source as the call-report page).
//
// They move on different clocks and count different things, so the difference
// tile between them is presented as a reading to interpret, not an alarm. What
// this page does NOT have is a "New Entry" button: the proxy is read-only by
// design (see lib/coreApi.js), and a button that pretended to post a journal
// entry would be a lie with a hover state.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { DeltaChip, LiveBadge, LiveValue } from '../components/live/Live';
import GeneralLedger from '../components/accounting/GeneralLedger';
import { useLiveCore } from '../lib/useLiveCore';
import { fetchGeneralLedger } from '../lib/gl';
import {
  fetchRawAccounts,
  fetchReport5300,
  fetchTransactions,
  fetchTransferSummary,
  formatCents,
  formatWhen,
  summarizeAccounts,
} from '../lib/api';

const JOURNAL_PAGE = 50;

const STATUS_STYLE = {
  settled: 'bg-green-50 text-green-800',
  completed: 'bg-green-50 text-green-800',
  pending: 'bg-amber-50 text-amber-800',
  pending_approval: 'bg-amber-50 text-amber-800',
  submitted: 'bg-blue-50 text-blue-800',
  returned: 'bg-red-50 text-red-800',
  rejected: 'bg-red-50 text-red-800',
  canceled: 'bg-slate-100 text-slate-600',
};

function StatusChip({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        STATUS_STYLE[status] ?? 'bg-slate-100 text-slate-800'
      }`}
    >
      {status}
    </span>
  );
}

export default function Accounting() {
  const [ledger, setLedger] = useState(null);
  const [report, setReport] = useState(null);
  const [transferSummary, setTransferSummary] = useState(null);
  const [journal, setJournal] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [reportError, setReportError] = useState('');
  const [gl, setGl] = useState(null);
  const [glError, setGlError] = useState('');
  // bln_ -> acct_, so a GL account reads as the account a human knows.
  const [accountByBalanceId, setAccountByBalanceId] = useState(null);

  const load = useCallback(async (isRefresh) => {
    if (isRefresh) setIsRefreshing(true);

    // The FBO position comes from a different subsystem than the ledger walk;
    // its failure is reported beside its tile rather than blanking the page.
    const [acctRes, transfersRes, journalRes, reportRes, glRes] =
      await Promise.allSettled([
        // ONE walk of all 1,829 accounts. Both the ledger summary and the
        // GL's bln_ -> acct_ naming map are derived from these same rows.
        fetchRawAccounts(),
        fetchTransferSummary(),
        fetchTransactions({ limit: JOURNAL_PAGE }),
        fetchReport5300(),
        fetchGeneralLedger(),
      ]);

    if (acctRes.status === 'fulfilled') {
      setLedger(summarizeAccounts(acctRes.value));
      setError('');
    } else {
      console.error('Error loading accounts:', acctRes.reason);
      setError(acctRes.reason?.message ?? 'request failed');
    }
    if (transfersRes.status === 'fulfilled') setTransferSummary(transfersRes.value);
    if (journalRes.status === 'fulfilled') setJournal(journalRes.value);
    if (reportRes.status === 'fulfilled') {
      setReport(reportRes.value);
      setReportError('');
    } else {
      setReportError(reportRes.reason?.message ?? 'request failed');
    }

    if (glRes.status === 'fulfilled') {
      setGl(glRes.value);
      setGlError('');
    } else {
      // The ledger lives in a different system than everything else on this
      // page, so it fails on its own and says so where it would have rendered.
      console.error('Error loading the general ledger:', glRes.reason);
      setGlError(glRes.reason?.message ?? 'request failed');
    }
    if (acctRes.status === 'fulfilled') {
      setAccountByBalanceId(
        new Map(
          acctRes.value
            .filter((a) => a.blnk_balance_id)
            .map((a) => [a.blnk_balance_id, a.id]),
        ),
      );
    }

    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  // The heartbeat. Polls the cheap endpoint every few seconds for the live FBO
  // figure, and re-runs the expensive ledger walk ONLY when the core's event
  // sequence actually advances — i.e. when money actually moved. That is what
  // makes this a dashboard rather than a page with a refresh button on it.
  const { live, polledAt, lastAdvanceAt, error: liveError } = useLiveCore({
    onAdvance: () => load(true),
  });

  // The live poll supersedes the FBO figure captured by the last full load;
  // it is refreshed every tick, where the ledger walk is refreshed per event.
  const fbo = live?.fboCents ?? report?.current?.fbo_position_cents ?? null;
  const gap = ledger && typeof fbo === 'number' ? ledger.totalCents - fbo : null;

  // Movement since the page was opened, so someone returning to a screen they
  // left open can see what changed while they were away.
  const openingFbo = useRef(null);
  const openingLedger = useRef(null);
  useEffect(() => {
    if (openingFbo.current === null && typeof fbo === 'number') openingFbo.current = fbo;
  }, [fbo]);
  useEffect(() => {
    if (openingLedger.current === null && ledger) openingLedger.current = ledger.totalCents;
  }, [ledger]);
  const fboDelta = typeof fbo === 'number' && openingFbo.current !== null ? fbo - openingFbo.current : null;
  const ledgerDelta =
    ledger && openingLedger.current !== null ? ledger.totalCents - openingLedger.current : null;

  return (
    <MainLayout
      title="Accounting"
      subtitle="The member ledger, the live FBO position, and the transfer journal behind them"
      actions={
        <div className="flex items-center space-x-3">
          <LiveBadge
            live={live}
            polledAt={polledAt}
            lastAdvanceAt={lastAdvanceAt}
            error={liveError}
          />
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
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <h3 className="font-medium text-red-800">Could not load the ledger</h3>
          <p className="text-sm text-red-600 mt-0.5">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="p-6 text-center bg-white rounded-lg border border-slate-200">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
          <div>Loading the ledger...</div>
        </div>
      ) : (
        <>
          {/* ------------------------------------------------ the two books */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <div className="text-sm font-medium text-slate-500 mb-1">Member ledger</div>
              <div className="text-2xl font-semibold tabular-nums">
                <LiveValue value={ledger?.totalCents}>
                  {ledger ? formatCents(ledger.totalCents) : '—'}
                </LiveValue>
                <DeltaChip cents={ledgerDelta} format={formatCents} />
              </div>
              {ledger && (
                <div className="text-xs text-slate-500 mt-1.5">
                  {ledger.truncated
                    ? `first ${ledger.accountCount} accounts — total is a lower bound`
                    : `across ${ledger.accountCount} accounts`}
                  {' · re-walked on each event'}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <div className="flex items-center text-sm font-medium text-slate-500 mb-1">
                <Activity size={15} className="mr-1.5 text-green-600" />
                FBO position
              </div>
              <div className="text-2xl font-semibold tabular-nums">
                <LiveValue value={fbo}>
                  {typeof fbo === 'number'
                    ? formatCents(fbo)
                    : <span className="text-slate-400 text-lg">not reported</span>}
                </LiveValue>
                <DeltaChip cents={fboDelta} format={formatCents} />
              </div>
              <div className="text-xs text-slate-500 mt-1.5">
                {reportError
                  ? <span className="text-red-600">{reportError}</span>
                  : live?.eventAt
                    ? <>advanced {formatWhen(live.eventAt)}</>
                    : 'the Payment Hub has not reported a position'}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-5">
              <div className="text-sm font-medium text-slate-500 mb-1">Ledger − FBO</div>
              <div className="text-2xl font-semibold tabular-nums">
                {gap === null ? '—' : formatCents(gap, { signed: true })}
              </div>
              <div className="text-xs text-slate-500 mt-1.5">
                {/* Different books on different clocks: the ledger is every
                    account balance right now, the FBO figure is program cash.
                    A gap is a reading to explain, not automatically a break. */}
                different books on different clocks — interpret, don&rsquo;t alarm
              </div>
            </div>
          </div>

          {/* --------------------------------------- balances by account type */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h2 className="text-sm font-medium text-slate-700">Balances by account type</h2>
                {ledger?.truncated && (
                  <span className="text-xs text-amber-700">truncated at {ledger.accountCount}</span>
                )}
              </div>
              {!ledger || ledger.byType.length === 0 ? (
                <div className="p-6 text-center text-slate-500">No accounts in the core.</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500">Type</th>
                      <th className="text-right py-2.5 px-4 text-xs font-medium text-slate-500">Accounts</th>
                      <th className="text-right py-2.5 px-4 text-xs font-medium text-slate-500">Open</th>
                      <th className="text-right py-2.5 px-4 text-xs font-medium text-slate-500">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.byType.map((row) => (
                      <tr key={row.type} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                        <td className="py-2.5 px-4 text-sm font-medium">{row.type}</td>
                        <td className="py-2.5 px-4 text-sm text-right tabular-nums text-slate-600">{row.count}</td>
                        <td className="py-2.5 px-4 text-sm text-right tabular-nums text-slate-600">{row.open}</td>
                        <td className="py-2.5 px-4 text-sm text-right tabular-nums">{formatCents(row.balanceCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* --------------------------------------- transfer volume by status */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h2 className="text-sm font-medium text-slate-700">Transfer volume by status</h2>
                {transferSummary && (
                  <span className="text-xs text-slate-500">
                    {transferSummary.truncated
                      ? `first ${transferSummary.transferCount} transfers`
                      : `${transferSummary.transferCount} transfers`}
                  </span>
                )}
              </div>
              {!transferSummary || transferSummary.byStatus.length === 0 ? (
                <div className="p-6 text-center text-slate-500">No transfers in the core.</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500">Status</th>
                      <th className="text-right py-2.5 px-4 text-xs font-medium text-slate-500">Count</th>
                      <th className="text-right py-2.5 px-4 text-xs font-medium text-slate-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transferSummary.byStatus.map((row) => (
                      <tr key={row.status} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                        <td className="py-2.5 px-4 text-sm"><StatusChip status={row.status} /></td>
                        <td className="py-2.5 px-4 text-sm text-right tabular-nums text-slate-600">{row.count}</td>
                        <td className="py-2.5 px-4 text-sm text-right tabular-nums">{formatCents(row.amountCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* --------------------------------------------- the general ledger */}
          {glError ? (
            <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
              <h2 className="text-sm font-medium text-slate-700 mb-1">General ledger</h2>
              <p className="text-sm text-red-600">{glError}</p>
              <p className="text-xs text-slate-500 mt-1">
                The double-entry ledger lives in Blnk, not in the core database. This view
                needs BLNK_API_URL and BLNK_API_KEY set server-side.
              </p>
            </div>
          ) : gl ? (
            <GeneralLedger gl={gl} accountByBalanceId={accountByBalanceId} />
          ) : null}

          {/* ------------------------------------------------------ the journal */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h2 className="text-sm font-medium text-slate-700">Recent journal</h2>
              <span className="text-xs text-slate-500">latest {journal.length} transfers</span>
            </div>
            {journal.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No transfers recorded.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500">Transfer</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500">Beneficiary</th>
                      <th className="text-right py-2.5 px-4 text-xs font-medium text-slate-500">Amount</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500">Status</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journal.map((t) => (
                      <tr key={t.id} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                        <td className="py-2.5 px-4 text-xs font-mono text-slate-600 break-all">{t.id}</td>
                        <td className="py-2.5 px-4 text-sm">{t.member}</td>
                        {/* Unsigned on purpose: with no account picked, this
                            journal has no point of view to sign from. */}
                        <td className="py-2.5 px-4 text-sm text-right tabular-nums">{formatCents(t.amountCents)}</td>
                        <td className="py-2.5 px-4 text-sm"><StatusChip status={t.status} /></td>
                        <td className="py-2.5 px-4 text-sm text-slate-500 whitespace-nowrap">{t.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-slate-100 border border-slate-200 rounded-md p-3 text-sm text-slate-700 mt-4">
            <span className="font-medium">Read-only.</span> The core proxy this page reads
            through does not accept writes, so there is no journal-entry form here — an
            adjustment posted from this screen would have nowhere real to go.
          </div>
        </>
      )}
    </MainLayout>
  );
}
