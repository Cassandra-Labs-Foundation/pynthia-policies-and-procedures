// src/pages/member-services.jsx
//
// The MSR workspace: find a member, see everything about them, act on it.
//
// Shaped around what Katya described on 31 July. Her account of what a teller
// or MSR actually works from was specific: a full-screen view with the name,
// address and ID so you can confirm the person in front of you matches the
// record, every account in one place, and the ability to click an account into
// its history and a transaction into its detail — without losing your place,
// because losing your place is why people export to Excel.
//
// So this page keeps you on one screen. Search resolves inline, the member
// opens inline, accounts expand inline. /members/[id] still exists for a deep
// link; this is the working surface.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHAT IT CANNOT DO, AND WHY THE BUTTONS SAY SO
//
// Katya's servicing list — order a debit card, block one, order checks, stop
// pay on ACH and checks, initiate a wire — is every one of them a WRITE. The
// core proxy this UI reads through is GET-only by design (lib/coreApi.js): its
// allowlist has no write path and the route returns 405 on anything but GET.
//
// Rendering those as live buttons would be the dead-button problem with real
// money attached — an MSR clicking "block card" and believing a card was
// blocked is worse than an MSR who knows they have to go elsewhere. So they
// are listed, visibly unavailable, and say what they are waiting for once
// rather than seven times.
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle, ChevronDown, ChevronRight, CreditCard, ExternalLink,
  Mail, MapPin, Search, ShieldCheck, User,
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import {
  fetchMemberProfile, fetchMembers, formatWhen, searchMembers,
} from '../lib/api';

const STATUS_STYLE = {
  active: 'bg-green-50 text-green-800',
  open: 'bg-green-50 text-green-800',
  frozen: 'bg-amber-50 text-amber-800',
  closed: 'bg-slate-100 text-slate-600',
  deceased: 'bg-red-50 text-red-800',
};

function Chip({ value }) {
  if (!value) return null;
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
      STATUS_STYLE[value] ?? 'bg-slate-100 text-slate-700'
    }`}>
      {value}
    </span>
  );
}

/** Last four only. An MSR verifying identity needs to check it, not read it out. */
function maskTin(tin) {
  if (!tin) return null;
  const digits = String(tin).replace(/\D/g, '');
  return digits.length >= 4 ? `•••-••-${digits.slice(-4)}` : '•••';
}

function formatAddress(a) {
  if (!a || typeof a !== 'object') return null;
  const parts = [a.line1, a.line2, [a.city, a.region].filter(Boolean).join(', '), a.postal_code]
    .filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}

function Field({ label, value, hint }) {
  return (
    <div>
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="text-sm mt-0.5">
        {value ?? <span className="text-slate-400">not on file</span>}
      </div>
      {hint && <div className="text-xs text-slate-400 mt-0.5">{hint}</div>}
    </div>
  );
}

/** Katya's servicing list. Present, honest, grouped under one explanation. */
const SERVICING = [
  { label: 'Order debit card', icon: CreditCard },
  { label: 'Block debit card', icon: CreditCard },
  { label: 'Order checks', icon: CreditCard },
  { label: 'Stop payment (check / ACH)', icon: AlertCircle },
  { label: 'Initiate wire', icon: AlertCircle },
  { label: 'Open an account', icon: User },
];

function AccountRow({ account, transactions }) {
  const [open, setOpen] = useState(false);
  // Already this account's own rows, signed from this account's side. Do not
  // re-derive them by filtering the profile's flat list: that list is deduped
  // across accounts, so an on-us transfer between two of the member's accounts
  // would show under BOTH with the sender's sign — the receiving account
  // listing itself as its own counterparty on money it received.
  const rows = transactions;

  return (
    <div className="border-t border-slate-200 first:border-t-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center px-4 py-3 hover:bg-slate-50 text-left"
      >
        {open ? <ChevronDown size={15} className="text-slate-400 mr-2 shrink-0" />
              : <ChevronRight size={15} className="text-slate-400 mr-2 shrink-0" />}
        <span className="flex-1 min-w-0">
          <span className="text-sm font-mono text-slate-700">{account.id}</span>
          <span className="ml-2 text-xs text-slate-500">{account.type}</span>
          <span className="ml-2"><Chip value={account.status} /></span>
        </span>
        <span className="text-xs text-slate-400 mr-3 hidden sm:block">
          {rows.length} txn{rows.length === 1 ? '' : 's'}
        </span>
        <span className="text-sm tabular-nums font-medium w-32 text-right">
          {account.balance}
        </span>
      </button>

      {open && (
        <div className="bg-slate-50 border-t border-slate-200">
          {rows.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500">
              No transactions on this account in the loaded window.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-4 text-xs font-medium text-slate-500">Transaction</th>
                  <th className="text-left py-2 px-4 text-xs font-medium text-slate-500">Counterparty</th>
                  <th className="text-right py-2 px-4 text-xs font-medium text-slate-500">Amount</th>
                  <th className="text-left py-2 px-4 text-xs font-medium text-slate-500">Status</th>
                  <th className="text-left py-2 px-4 text-xs font-medium text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 last:border-b-0 hover:bg-white">
                    <td className="py-2 px-4 text-xs font-mono text-slate-500">
                      <Link
                        href={`/accounts/${encodeURIComponent(account.id)}`}
                        className="text-blue-600 hover:underline"
                      >
                        {t.id.slice(0, 16)}…
                      </Link>
                    </td>
                    <td className="py-2 px-4 text-sm">{t.member}</td>
                    <td className="py-2 px-4 text-sm text-right tabular-nums">{t.amount}</td>
                    <td className="py-2 px-4"><Chip value={t.status} /></td>
                    <td className="py-2 px-4 text-xs text-slate-500 whitespace-nowrap">{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default function MemberServices() {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState(null);
  const [recent, setRecent] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [error, setError] = useState('');

  // A default list, so the page is useful before anyone types anything.
  useEffect(() => {
    fetchMembers({ limit: 25 }).then(setRecent).catch(() => setRecent([]));
  }, []);

  const runSearch = useCallback(async (e) => {
    e?.preventDefault();
    const needle = term.trim();
    if (!needle) { setResults(null); return; }
    setIsSearching(true);
    setError('');
    try {
      setResults(await searchMembers(needle));
    } catch (err) {
      console.error('Member search failed:', err);
      setError(err.message);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [term]);

  const openMember = useCallback(async (id) => {
    setSelectedId(id);
    setIsLoadingProfile(true);
    setProfile(null);
    try {
      setProfile(await fetchMemberProfile(id));
    } catch (err) {
      console.error('Could not load member:', err);
      setError(err.message);
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  const list = results ?? recent;
  const entity = profile?.entity;

  return (
    <MainLayout
      title="Member Services"
      subtitle="Find a member, see every account and transaction, and service the relationship"
    >
      {/* ------------------------------------------------------------ search */}
      <form onSubmit={runSearch} className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Name, email, member ID, account ID, or transfer ID"
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Search
          </button>
          {results !== null && (
            <button
              type="button"
              onClick={() => { setTerm(''); setResults(null); }}
              className="px-3 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50"
            >
              Clear
            </button>
          )}
        </div>
        {/* The keys Katya listed that this core has no column for, named once
            so their absence is a known gap rather than a silent miss. */}
        <p className="text-xs text-slate-500 mt-2">
          Draft ID, debit and credit card numbers and SSN are not searchable — the core
          stores no card or draft number, and TIN is not exposed as a filter.
        </p>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* --------------------------------------------------------- results */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden self-start">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h2 className="text-sm font-medium text-slate-700">
              {results !== null ? 'Search results' : 'Members'}
            </h2>
            <span className="text-xs text-slate-500">
              {isSearching ? 'searching…' : `${list.length}${results === null ? ' shown' : ''}`}
            </span>
          </div>
          {list.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              {results !== null ? `No member matches “${term}”.` : 'No members returned.'}
            </div>
          ) : (
            <div className="max-h-[32rem] overflow-y-auto">
              {list.map((m) => (
                <button
                  key={m.id}
                  onClick={() => openMember(m.id)}
                  className={`w-full text-left px-4 py-2.5 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 ${
                    selectedId === m.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="text-sm font-medium truncate">{m.name ?? m.id}</div>
                  <div className="text-xs text-slate-500 truncate">{m.email ?? m.id}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ------------------------------------------------------- workspace */}
        <div className="lg:col-span-2">
          {!selectedId ? (
            <div className="bg-white rounded-lg border border-slate-200 p-10 text-center text-slate-500">
              <User size={28} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm">Select a member to open their file.</p>
            </div>
          ) : isLoadingProfile ? (
            <div className="bg-white rounded-lg border border-slate-200 p-10 text-center">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
              <div className="text-sm text-slate-500">Loading member…</div>
            </div>
          ) : !profile ? null : (
            <>
              {/* Identity — the panel Katya described for confirming the person
                  in front of you matches the record. */}
              <div className="bg-white rounded-lg border border-slate-200 p-5 mb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white mr-3 shrink-0">
                      <User size={22} />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">{entity.name ?? profile.member.id}</h2>
                      <div className="text-xs text-slate-500 font-mono">{profile.member.id}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Chip value={entity.status} />
                    <Link
                      href={`/members/${encodeURIComponent(profile.member.id)}`}
                      className="text-xs text-blue-600 hover:underline inline-flex items-center"
                    >
                      Full profile <ExternalLink size={11} className="ml-0.5" />
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Field label="Type" value={entity.type} />
                  <Field label="Member since" value={formatWhen(entity.created_at)} />
                  <Field label="Date of birth" value={entity.date_of_birth} />
                  <Field label="TIN" value={maskTin(entity.tin)} hint="last four only" />
                  <Field
                    label="Email"
                    value={entity.email && (
                      <span className="inline-flex items-center">
                        <Mail size={12} className="mr-1 text-slate-400" />{entity.email}
                      </span>
                    )}
                  />
                  <Field label="Jurisdiction" value={entity.jurisdiction} />
                  <div className="col-span-2">
                    <Field
                      label="Address"
                      value={formatAddress(entity.address) && (
                        <span className="inline-flex items-start">
                          <MapPin size={12} className="mr-1 mt-0.5 text-slate-400 shrink-0" />
                          {formatAddress(entity.address)}
                        </span>
                      )}
                    />
                  </div>
                </div>

                {/* Katya wants a photo ID on this screen to check against the
                    person. The core has no document store, so this says so
                    rather than leaving a silent hole where a face should be. */}
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-start text-xs text-slate-500">
                  <ShieldCheck size={13} className="mr-1.5 mt-0.5 text-slate-400 shrink-0" />
                  <span>
                    No photo ID or scanned document is shown: the core stores no document
                    images, so identity here can be checked against name, address, date of
                    birth and the last four of the TIN only.
                  </span>
                </div>
              </div>

              {/* ------------------------------------------------- accounts */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-4">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <h2 className="text-sm font-medium text-slate-700">Accounts</h2>
                  <span className="text-xs text-slate-500">
                    {profile.accounts.length} account{profile.accounts.length === 1 ? '' : 's'}
                  </span>
                </div>
                {profile.accounts.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">
                    This member holds no accounts. Most accounts in this instance carry no
                    entity_id, so an unlinked member is common here rather than an error.
                  </div>
                ) : (
                  profile.accounts.map((a) => (
                    <AccountRow
                      key={a.id}
                      account={a}
                      transactions={profile.transactionsByAccount[a.id] ?? []}
                    />
                  ))
                )}
              </div>

              {/* ------------------------------------------------ servicing */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                  <h2 className="text-sm font-medium text-slate-700">Servicing</h2>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {SERVICING.map(({ label, icon: Icon }) => (
                      <button
                        key={label}
                        disabled
                        title="Needs a write path to the core"
                        className="flex items-center px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-400 bg-slate-50 cursor-not-allowed"
                      >
                        <Icon size={14} className="mr-2 shrink-0" />
                        <span className="truncate">{label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-3">
                    <span className="font-medium text-slate-600">Read-only.</span> Every action
                    above is a write, and the core proxy this UI reads through is GET-only by
                    design — it returns 405 on anything else and its allowlist contains no write
                    path. They are shown disabled rather than hidden so the gap between what an
                    MSR needs and what this system can do stays visible.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
