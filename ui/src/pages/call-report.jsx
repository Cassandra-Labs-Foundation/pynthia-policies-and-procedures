// src/pages/call-report.jsx
//
// The full NCUA 5300, as a working filing surface — all 11 subsections (the two
// financial statements plus Schedules A–I), every line item transcribed from the
// official form (lib/ncua5300Shell), rendered as real form pages you navigate
// between.
//
// Three honesty rules, one per level, all intact:
//   · Value level — a cell the core can source shows a live figure, read-only;
//                   every other cell is a blank a person keys. Nothing invented.
//   · Schedule level — a schedule with no source stays present and says what it
//                      needs; H and I say "not required" (under $500M), which is
//                      a different thing from missing.
//   · Filing level — this is a DRAFT working copy. NCUA filing is CUOnline only.
//
// Keyed figures persist locally per quarter (lib/useFormValues); the live core
// reading always wins over a keyed value, so each number has exactly one source.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, Activity, Download, FileText, RefreshCw, Check,
  FileSpreadsheet, Landmark, Coins, Layers, CircleSlash, Circle,
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { fetch5300Inputs, formatCents, formatWhen } from '../lib/api';
import { LiveBadge, LiveValue } from '../components/live/Live';
import { useLiveCore } from '../lib/useLiveCore';
import { filingPeriod } from '../lib/ncua5300';
import {
  SCHEDULES, SCHEDULE_GROUPS, STATE_META,
  sectionsFor, computeSourced, subsectionStatus, formReadiness, keyedCents,
} from '../lib/ncua5300Form';
import { useFormValues } from '../lib/useFormValues';
import { downloadFilingPdf } from '../lib/ncua5300Pdf';

const PREFS_KEY = 'callReport.myView.v1';

function formatDay(iso) {
  if (!iso) return '—';
  const at = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(at.getTime())) return '—';
  return at.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

const GROUP_ICON = {
  'Financial Statements': FileSpreadsheet,
  'Loan Information': Landmark,
  'Cash & Investments': Coins,
  'Other Schedules': Layers,
};

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
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState('');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(PREFS_KEY);
      if (saved) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(saved) });
    } catch { /* corrupt pref must not take the page down */ }
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

  useEffect(() => { load(false); }, [load]);

  const { live, polledAt, lastAdvanceAt, error: liveError } = useLiveCore({
    onAdvance: () => load(true),
  });

  const merged = useMemo(
    () =>
      data && live
        ? { ...data, fboPositionCents: live.fboCents, lastSeq: live.seq, updatedAt: live.eventAt, history: live.history.length ? live.history : data.history, stale: live.stale }
        : data,
    [data, live],
  );

  const sourcedByCode = useMemo(
    () => (merged ? computeSourced({ accounts: merged.accounts }) : {}),
    [merged],
  );
  const period = useMemo(() => filingPeriod(new Date()), []);

  const subtitle =
    `${period.quarter} in progress · figures live · period closes ${formatDay(period.asOf)}, due ${formatDay(period.dueAt)}`;

  const handleDownloadPdf = useCallback(async (keyed) => {
    setPdfBusy(true);
    setPdfError('');
    try {
      await downloadFilingPdf({
        period,
        instanceId: merged?.instanceId,
        institution: 'Pynthia Banking',
        sourcedByCode,
        keyed,
        generatedAt: new Date(),
      });
    } catch (err) {
      console.error('PDF export failed:', err);
      setPdfError(err.message || 'Could not build the PDF.');
    } finally {
      setPdfBusy(false);
    }
  }, [period, merged, sourcedByCode]);

  return (
    <MainLayout
      title="Call Report (5300)"
      subtitle={subtitle}
      actions={
        <div className="flex items-center space-x-3">
          <LiveBadge live={live} polledAt={polledAt} lastAdvanceAt={lastAdvanceAt} error={liveError} />
          <button
            onClick={() => load(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      }
    >
      <div className="flex gap-6 border-b border-slate-200 mb-6">
        {[['filing', 'Filing'], ['myview', 'My view']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`relative pb-3 text-sm font-medium transition-colors ${tab === id ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {label}
            {tab === id && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-indigo-600" />}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <h3 className="font-medium text-red-800">Could not load the call report</h3>
          <p className="text-sm text-red-600 mt-0.5">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mb-2" />
          <div className="text-slate-500 text-sm">Loading call report…</div>
        </div>
      ) : !merged ? null : tab === 'filing' ? (
        <FilingWorkspace
          data={merged}
          period={period}
          sourcedByCode={sourcedByCode}
          onDownloadPdf={handleDownloadPdf}
          pdfBusy={pdfBusy}
          pdfError={pdfError}
        />
      ) : (
        <MyViewTab data={merged} sourcedByCode={sourcedByCode} prefs={prefs} toggle={toggle} />
      )}
    </MainLayout>
  );
}

// ─────────────────────────────────────────────────────────── shared UI atoms

function StatusChip({ state, className = '' }) {
  const meta = STATE_META[state] ?? STATE_META.empty;
  const tone = {
    good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    info: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    muted: 'bg-slate-100 text-slate-500 border-slate-200',
  }[meta.tone];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone} ${className}`}>
      {meta.label}
    </span>
  );
}

function StatusDot({ state }) {
  const cls = {
    complete: 'bg-emerald-500', partial: 'bg-indigo-500', empty: 'bg-slate-300', na: 'bg-slate-200 ring-1 ring-slate-300',
  }[state] ?? 'bg-slate-300';
  return <span className={`h-2 w-2 shrink-0 rounded-full ${cls}`} />;
}

function HeroStat({ value, label, tone = 'default' }) {
  const cls = { default: 'text-slate-900', good: 'text-emerald-700', muted: 'text-slate-400' }[tone];
  return (
    <div className="px-5 py-4">
      <div className={`text-2xl font-semibold tabular-nums ${cls}`}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

// ───────────────────────────────────────────────────── the filing workspace

function FilingWorkspace({ data, period, sourcedByCode, onDownloadPdf, pdfBusy, pdfError }) {
  const [selectedId, setSelectedId] = useState('sofc');
  const selected = SCHEDULES.find((s) => s.id === selectedId) ?? SCHEDULES[0];

  const namespace = `${data.instanceId || 'inst'}.${period.quarter}`;
  const { values: keyed, setValue, clearAll, keyedCount } = useFormValues(namespace);

  const sharesSourcedCents = sourcedByCode['013'] ?? 0;
  const ctx = { sourcedByCode, keyed, sharesSourcedCents };
  const readiness = formReadiness(ctx);

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-indigo-600">
              <FileText size={14} />
              NCUA Form 5300 · Call Report
            </div>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              {period.quarter.replace(/(\d{4})-Q(\d)/, 'Q$2 $1')} Call Report
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Quarterly financial statement + 9 schedules · 537 lines · closes {formatDay(period.asOf)} · due {formatDay(period.dueAt)}
              {data.instanceId && <span className="ml-2 font-mono text-xs text-slate-400">{data.instanceId}</span>}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                <AlertTriangle size={12} />
                Draft · partial — not submittable
              </span>
              {keyedCount > 0 && (
                <button onClick={clearAll} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
                  <Circle size={9} className="fill-indigo-400 text-indigo-400" /> {keyedCount} keyed · clear
                </button>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
            <button
              onClick={() => onDownloadPdf(keyed)}
              disabled={pdfBusy}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:opacity-60"
            >
              {pdfBusy ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
              {pdfBusy ? 'Building PDF…' : 'Download PDF'}
            </button>
            {pdfError && <span className="text-xs text-rose-600">{pdfError}</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/60 sm:grid-cols-4">
          <HeroStat value={readiness.total} label="Subsections" />
          <HeroStat value={readiness.applicable} label="Apply to us" />
          <HeroStat value={readiness.withData} label="Have data" tone="good" />
          <HeroStat value={readiness.notRequired} label="Not required" tone="muted" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[264px_minmax(0,1fr)]">
        <ScheduleRail ctx={ctx} selectedId={selectedId} onSelect={setSelectedId} />
        <div className="min-w-0">
          <SchedulePane
            key={selected.id}
            selected={selected}
            data={data}
            sourcedByCode={sourcedByCode}
            keyed={keyed}
            setValue={setValue}
            ctx={ctx}
          />
        </div>
      </div>
    </div>
  );
}

function ScheduleRail({ ctx, selectedId, onSelect }) {
  return (
    <nav className="rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm lg:sticky lg:top-4 lg:self-start">
      {SCHEDULE_GROUPS.map((group) => {
        const items = SCHEDULES.filter((s) => s.group === group);
        if (items.length === 0) return null;
        const Icon = GROUP_ICON[group] ?? Layers;
        return (
          <div key={group} className="mb-1.5 last:mb-0">
            <div className="flex items-center gap-1.5 px-3 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <Icon size={12} /> {group}
            </div>
            {items.map((s) => {
              const st = subsectionStatus(s, ctx);
              const active = s.id === selectedId;
              return (
                <button
                  key={s.id}
                  onClick={() => onSelect(s.id)}
                  className={`group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {s.letter ? (
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-semibold ${active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>{s.letter}</span>
                  ) : (
                    <span className="h-5 w-5 shrink-0" />
                  )}
                  <span className="min-w-0 flex-1 truncate font-medium">{s.short}</span>
                  <StatusDot state={st.state} />
                </button>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

// ───────────────────────────────────────────────────────────── pane

function SchedulePane({ selected, data, sourcedByCode, keyed, setValue, ctx }) {
  const st = subsectionStatus(selected, ctx);
  const sections = sectionsFor(selected.id);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              {selected.letter && (
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-xs font-semibold text-white">{selected.letter}</span>
              )}
              <h2 className="text-lg font-semibold text-slate-900">
                {selected.letter ? `Schedule ${selected.letter} — ` : ''}{selected.title}
              </h2>
            </div>
            <p className="mt-1.5 text-sm text-slate-500">
              <span className="font-medium text-slate-600">When:</span> {selected.when}
            </p>
          </div>
          <StatusChip state={st.state} />
        </div>
        {selected.needs && st.state !== 'na' && st.sourced === 0 && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            <CircleSlash size={14} className="mt-0.5 shrink-0 text-slate-400" />
            <span><span className="font-medium text-slate-600">Needs:</span> {selected.needs} You can key figures below in the meantime.</span>
          </div>
        )}
        {st.total > 0 && (
          <div className="mt-3 text-xs text-slate-400">{st.detail} · blank cells are keyable and saved locally</div>
        )}
      </div>

      {selected.kind === 'sofc' && (
        <SofcTiles sourcedByCode={sourcedByCode} keyed={keyed} data={data} />
      )}

      {selected.kind === 'threshold' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 text-center shadow-sm">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <CircleSlash size={18} className="text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Not required this period</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Applies only to credit unions with quarter-end assets over <span className="font-medium text-slate-700">$500,000,000</span>.
            The full schedule is shown below for reference and appears automatically if the balance sheet crosses the threshold.
          </p>
        </div>
      )}

      <div className={selected.kind === 'threshold' ? 'opacity-60' : ''}>
        {sections.map((sec, i) => (
          <SectionTable key={i} sec={sec} sourcedByCode={sourcedByCode} keyed={keyed} setValue={setValue} />
        ))}
      </div>
    </div>
  );
}

function SofcTiles({ sourcedByCode, keyed, data }) {
  const val = (code) => (code in sourcedByCode ? sourcedByCode[code] : keyedCents(keyed[code]));
  const assets = val('010');
  const liabEq = val('014');
  const balances = assets != null && liabEq != null ? assets === liabEq : null;
  const fboPos = data.fboPositionCents;
  const memberShare = data.memberShareCents;
  const fbo = typeof fboPos === 'number' && typeof memberShare === 'number'
    ? { fboPos, memberShare, diff: fboPos - memberShare, ties: fboPos === memberShare }
    : null;

  const Tile = ({ label, code, cents }) => (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="text-xs font-medium text-slate-500">{label} <span className="font-mono text-[11px] text-slate-400">({code})</span></div>
      <div className="mt-1.5 text-2xl font-semibold tabular-nums text-slate-900">
        {cents == null ? <span className="text-lg text-slate-400">Not computable</span> : formatCents(cents)}
      </div>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Tile label="Total assets" code="010" cents={assets} />
        <Tile label="Total liabilities, shares & equity" code="014" cents={liabEq} />
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Balance check <span className="font-mono text-[11px] text-slate-400">(010 = 014)</span></div>
          <div className={`mt-1.5 text-2xl font-semibold ${balances === null ? 'text-slate-400' : balances ? 'text-emerald-700' : 'text-rose-700'}`}>
            {balances === null ? <span className="text-lg">Cannot tell</span> : balances ? <span className="inline-flex items-center gap-1.5"><Check size={20} /> Balances</span> : 'Out of balance'}
          </div>
        </div>
      </div>
      {fbo && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 text-sm shadow-sm">
          <div className="flex items-start gap-2.5">
            <Activity size={16} className="mt-0.5 shrink-0 text-slate-400" />
            <div>
              <span className="font-medium text-slate-700">FBO reconciliation</span>
              <span className="text-slate-500"> — a control total, not a filed line. </span>
              <span className="text-slate-600">
                Position {formatCents(fbo.fboPos)} vs {formatCents(fbo.memberShare)} of member shares
                {fbo.ties ? ' — ties exactly.' : `, a gap of ${formatCents(Math.abs(fbo.diff))}.`}
              </span>
              {!fbo.ties && <span className="text-slate-500"> Expected until an inbound funding rail emits.</span>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ───────────────────────────────────────────────── one section as a table

function SectionTable({ sec, sourcedByCode, keyed, setValue }) {
  const columns = sec.columns && sec.columns.length ? sec.columns : ['Amount'];
  const multi = columns.length > 1;

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <h3 className="text-sm font-semibold text-slate-800">
          {sec.n != null && <span className="mr-1.5 font-mono text-[11px] font-normal text-slate-400">§{sec.n}</span>}
          {sec.title}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {multi ? (
              <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-medium text-slate-500">
                <th className="py-2 pl-5 pr-3 text-left">Account</th>
                {columns.map((c, i) => <th key={i} className="whitespace-nowrap px-3 py-2 text-right">{c}</th>)}
              </tr>
            ) : (
              <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-medium text-slate-500">
                <th className="w-20 py-2 pl-5 text-left">Code</th>
                <th className="py-2 pr-3 text-left">Account</th>
                <th className="w-44 py-2 pr-5 text-right">{columns[0]}</th>
              </tr>
            )}
          </thead>
          <tbody>
            {sec.lines.map((ln, i) => (
              multi
                ? <MultiRow key={i} ln={ln} columns={columns} sourcedByCode={sourcedByCode} keyed={keyed} setValue={setValue} />
                : <SingleRow key={i} ln={ln} sourcedByCode={sourcedByCode} keyed={keyed} setValue={setValue} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AmountInput({ code, keyed, setValue }) {
  return (
    <input
      type="text"
      inputMode="decimal"
      defaultValue={keyed[code] ?? ''}
      onBlur={(e) => setValue(code, e.target.value)}
      placeholder="—"
      className="w-28 rounded-md border border-transparent bg-transparent px-2 py-1 text-right text-sm tabular-nums text-slate-900 placeholder:text-slate-300 hover:border-slate-200 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-200"
    />
  );
}

function SourcedValue({ cents }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="live from core" />
      <LiveValue value={cents}><span className="tabular-nums font-medium text-slate-900">{formatCents(cents)}</span></LiveValue>
    </span>
  );
}

function SingleRow({ ln, sourcedByCode, keyed, setValue }) {
  const isTotal = !!ln.total;
  const code = (ln.codes || [])[0] || null;
  const isHeader = !code; // grouping / sub-header row with no box
  const sourced = code && code in sourcedByCode;

  return (
    <tr className={`border-b border-slate-100 last:border-b-0 ${isTotal ? 'bg-slate-50/70' : ''}`}>
      <td className="w-20 py-2 pl-5 pr-2 align-top">
        {code && <span className={`font-mono text-[11px] ${isTotal ? 'text-slate-600' : 'text-slate-400'}`}>{code}</span>}
      </td>
      <td className="py-2 pr-3 align-top" style={{ paddingLeft: `${(ln.level || 0) * 14}px` }}>
        <span className={`${isTotal ? 'font-semibold text-slate-800' : isHeader ? 'font-medium text-slate-600' : 'text-slate-700'}`}>{ln.label}</span>
      </td>
      <td className="w-44 py-2 pr-5 text-right align-top">
        {isHeader ? null : sourced ? <SourcedValue cents={sourcedByCode[code]} /> : <AmountInput code={code} keyed={keyed} setValue={setValue} />}
      </td>
    </tr>
  );
}

function MultiRow({ ln, columns, sourcedByCode, keyed, setValue }) {
  const isTotal = !!ln.total;
  const codes = ln.codes || [];
  const isHeader = codes.every((c) => !c);

  return (
    <tr className={`border-b border-slate-100 last:border-b-0 ${isTotal ? 'bg-slate-50/70' : ''}`}>
      <td className="py-2 pl-5 pr-3 align-top" style={{ paddingLeft: `${12 + (ln.level || 0) * 14}px` }}>
        <span className={`${isTotal ? 'font-semibold text-slate-800' : isHeader ? 'font-medium text-slate-600' : 'text-slate-700'}`}>{ln.label}</span>
      </td>
      {columns.map((_, i) => {
        const code = codes[i] || null;
        const sourced = code && code in sourcedByCode;
        return (
          <td key={i} className="px-3 py-2 text-right align-top">
            {!code ? <span className="text-slate-200">·</span> : (
              <div className="flex flex-col items-end">
                <span className="font-mono text-[9px] leading-none text-slate-300">{code}</span>
                {sourced ? <SourcedValue cents={sourcedByCode[code]} /> : <AmountInput code={code} keyed={keyed} setValue={setValue} />}
              </div>
            )}
          </td>
        );
      })}
    </tr>
  );
}

// ──────────────────────────────────────────────────────────── my view tab

function MyViewTab({ data, sourcedByCode, prefs, toggle }) {
  const rows = data.history ?? [];
  const shareCodes = [
    ['902', 'Share Drafts'], ['657', 'Regular Shares'], ['911', 'Money Market Shares'],
    ['908C', 'Share Certificates'], ['906C', 'IRA/KEOGH'], ['630', 'All Other Shares'],
  ].filter(([c]) => (sourcedByCode[c] ?? 0) > 0);
  const open = data.accounts.filter((a) => a.status === 'open').length;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="mb-2 text-sm font-medium text-slate-700">Show</div>
        <div className="flex flex-wrap gap-2">
          {TILES.map((t) => (
            <button key={t.id} onClick={() => toggle(t.id)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${prefs[t.id] ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Loan growth, delinquency and the deposit/CD split aren&rsquo;t offered here because the core holds no loan
          balances or budget. They become tiles the day those exist — see the Filing tab&rsquo;s Schedule A for the specifics.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {prefs.fbo && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center text-sm font-medium text-slate-500">
              <Activity size={15} className="mr-1.5 text-emerald-600" /> FBO position — live
            </div>
            <div className="mt-1.5 text-2xl font-semibold tabular-nums">
              <LiveValue value={data.fboPositionCents}>
                {typeof data.fboPositionCents === 'number' ? formatCents(data.fboPositionCents) : <span className="text-lg text-slate-400">not reported</span>}
              </LiveValue>
            </div>
            {data.lastSeq !== null && (
              <div className="mt-1.5 text-xs text-slate-500">event seq {String(data.lastSeq)} · advanced {formatWhen(data.updatedAt)}</div>
            )}
          </div>
        )}
        {prefs.accounts && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500">Accounts</div>
            <div className="mt-1.5 text-2xl font-semibold tabular-nums">{data.accounts.length}</div>
            <div className="mt-1.5 text-xs text-slate-500">{open} open</div>
          </div>
        )}
        {prefs.shares && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500">Total shares (013)</div>
            <div className="mt-1.5 text-2xl font-semibold tabular-nums">{formatCents(sourcedByCode['013'])}</div>
            <div className="mt-1.5 text-xs text-slate-500">{shareCodes.map(([c]) => c).join(', ') || 'no share balances'}</div>
          </div>
        )}
      </div>

      {prefs.shares && shareCodes.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3"><h3 className="text-sm font-semibold text-slate-800">Shares by type</h3></div>
          <table className="w-full">
            <tbody>
              {shareCodes.map(([c, label]) => (
                <tr key={c} className="border-b border-slate-100 last:border-b-0">
                  <td className="w-16 py-2.5 pl-5 font-mono text-[11px] text-slate-400">{c}</td>
                  <td className="py-2.5 text-sm text-slate-800">{label}</td>
                  <td className="w-48 py-2.5 pr-5 text-right text-sm tabular-nums text-slate-900">{formatCents(sourcedByCode[c])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(prefs.settled || prefs.alerts) && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-slate-800">Daily aggregation</h3>
            <span className="text-xs text-slate-400">{rows.length} day(s){data.stale ? ` · today's run has not landed` : ''}</span>
          </div>
          {rows.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">No aggregation rows for this instance yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="py-2.5 pl-5 text-left text-xs font-medium text-slate-500">Date</th>
                    {prefs.settled && <th className="py-2.5 px-4 text-right text-xs font-medium text-slate-500">Settled</th>}
                    {prefs.settled && <th className="py-2.5 px-4 text-right text-xs font-medium text-slate-500">Count</th>}
                    {prefs.alerts && <th className="py-2.5 px-4 text-right text-xs font-medium text-slate-500">CTR alerts</th>}
                    {prefs.alerts && <th className="py-2.5 pr-5 text-right text-xs font-medium text-slate-500">Structuring</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={`${r.instance_id}-${r.as_of}`} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                      <td className="py-2.5 pl-5 text-sm font-medium text-slate-700">{formatDay(r.as_of)}</td>
                      {prefs.settled && <td className="py-2.5 px-4 text-right text-sm tabular-nums">{formatCents(r.settled_cents)}</td>}
                      {prefs.settled && <td className="py-2.5 px-4 text-right text-sm tabular-nums text-slate-500">{r.settled_count}</td>}
                      {prefs.alerts && (
                        <td className="py-2.5 px-4 text-right text-sm tabular-nums">
                          {r.ctr_alerts > 0 ? <span className="text-amber-700">{r.ctr_alerts}</span> : <span className="text-slate-400">0</span>}
                        </td>
                      )}
                      {prefs.alerts && (
                        <td className="py-2.5 pr-5 text-right text-sm tabular-nums">
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
    </div>
  );
}
