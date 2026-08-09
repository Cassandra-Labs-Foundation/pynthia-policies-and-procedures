// src/pages/members/[id].jsx
//
// One member, everything the core will say about them.
//
// This is the page the app had nowhere to click to. The teller panel could
// find a member and then dead-ended: "View Full Profile" rendered as a button
// and did nothing, because no route existed behind it.
//
// Read-only, like everything else the browser reaches. The proxy in
// pages/api/core/ forwards GETs against an allowlist and nothing else, so
// there is no edit affordance here — an "Edit Member" control with no PATCH
// behind it is the thing this page was written to stop repeating.
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft, Mail, MapPin, ShieldCheck, User, Users } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { fetchMemberProfile, formatWhen } from '../../lib/api';

const STATUS_STYLE = {
  active: 'bg-green-100 text-green-800',
  pending: 'bg-amber-100 text-amber-800',
  closed: 'bg-slate-200 text-slate-700',
};

/**
 * The member's KYC posture, one chip. Four states, deliberately distinct:
 * "unavailable" (the check itself failed) must not render like "none"
 * (no verification was ever run) — a teller acts differently on each. An
 * OFAC hit gets its own red chip on top of whatever the provider said,
 * because the floor outranks the provider.
 */
const KYC_STYLE = {
  approved: 'bg-green-100 text-green-800',
  denied: 'bg-red-100 text-red-800',
  none: 'bg-amber-100 text-amber-800',
  unavailable: 'bg-slate-100 text-slate-500',
};
const KYC_LABEL = {
  approved: 'KYC verified',
  denied: 'KYC denied',
  none: 'No KYC on file',
  unavailable: 'KYC unavailable',
};

function KycChips({ kyc }) {
  if (!kyc) return null;
  return (
    <>
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          KYC_STYLE[kyc.status] ?? 'bg-slate-100 text-slate-700'
        }`}
        title={
          kyc.when
            ? `Latest of ${kyc.count} verification${kyc.count === 1 ? '' : 's'}${
                kyc.provider ? ` · ${kyc.provider}` : ''
              }`
            : undefined
        }
      >
        {KYC_LABEL[kyc.status] ?? kyc.status}
      </span>
      {kyc.ofac === 'hit' && (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          OFAC match
        </span>
      )}
    </>
  );
}

/**
 * A taxpayer id, masked to its last four.
 *
 * The core returns it whole. A teller console verifying identity needs to
 * confirm the last four against what the member says; it does not need the
 * other five on screen, and neither does anyone reading over their shoulder.
 */
function maskTin(tin) {
  if (!tin) return null;
  const digits = String(tin).replace(/\D/g, '');
  if (digits.length < 4) return '•••';
  return `•••–••–${digits.slice(-4)}`;
}

function formatAddress(address) {
  if (!address || typeof address !== 'object') return null;
  const { line1, line2, city, state, postal_code, country } = address;
  const street = [line1, line2].filter(Boolean).join(', ');
  const region = [city, state, postal_code].filter(Boolean).join(' ');
  const all = [street, region, country].filter(Boolean);
  return all.length ? all.join(' · ') : null;
}

/** A labelled value that renders absence as absence rather than as blank. */
function Field({ label, value, hint }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={value ? 'text-sm text-slate-900' : 'text-sm text-slate-400 italic'}>
        {value || 'Not on file'}
      </div>
      {hint && <div className="text-xs text-slate-400 mt-0.5">{hint}</div>}
    </div>
  );
}

export default function MemberProfile() {
  const router = useRouter();
  const { id } = router.query;

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // router.query is empty on the first render of a dynamic route; waiting for
    // the id avoids firing GET /entities/undefined and rendering its 404.
    if (!id) return;

    let cancelled = false;
    setIsLoading(true);
    setError('');

    fetchMemberProfile(id)
      .then((result) => {
        if (!cancelled) setProfile(result);
      })
      .catch((err) => {
        console.error('Error loading member profile:', err);
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const entity = profile?.entity;
  const address = formatAddress(entity?.address);
  const owners = Array.isArray(entity?.owners) ? entity.owners : [];

  return (
    <MainLayout
      title={entity?.name || 'Member'}
      subtitle={id ? `Member ID ${id}` : 'Loading member'}
    >
      <Link
        href="/teller"
        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-6"
      >
        <ArrowLeft size={16} className="mr-1" />
        Back to Teller
      </Link>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
          <h3 className="font-medium text-red-800">Could not load this member</h3>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      )}

      {isLoading && !error && (
        <div className="bg-white rounded-lg p-6 border border-slate-200 text-slate-500">
          Loading member…
        </div>
      )}

      {profile && !isLoading && (
        <div className="space-y-6">
          {/* Identity */}
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <div className="flex items-start justify-between mb-5">
              <h2 className="text-lg font-semibold flex items-center">
                <User size={18} className="mr-2 text-slate-400" />
                Identity
              </h2>
              <div className="flex items-center gap-2">
                <KycChips kyc={profile.kyc} />
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    STATUS_STYLE[entity.status] ?? 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {entity.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Field label="Legal name" value={entity.name} />
              <Field label="Type" value={entity.type} />
              <Field label="Member since" value={formatWhen(entity.created_at)} />
              <Field label="Email" value={entity.email} />
              <Field label="Date of birth" value={entity.date_of_birth} />
              <Field
                label="Taxpayer ID"
                value={maskTin(entity.tin)}
                hint={entity.tin ? 'Last four only' : null}
              />
              <Field label="Jurisdiction" value={entity.jurisdiction} />
              <Field label="Address" value={address} />
              {/* core.entity holds no phone number — see lib/api.js */}
              <Field label="Phone" value={null} hint="core.entity holds no phone column" />
            </div>
          </div>

          {/* Beneficial owners — only meaningful for joint/trust/business */}
          {owners.length > 0 && (
            <div className="bg-white rounded-lg p-6 border border-slate-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Users size={18} className="mr-2 text-slate-400" />
                Owners
                <span className="ml-2 text-sm font-normal text-slate-500">
                  {owners.length}
                </span>
              </h2>
              <ul className="space-y-2">
                {owners.map((o, i) => (
                  <li key={o.entity_id ?? i} className="text-sm text-slate-700">
                    {o.entity_id ? (
                      <Link
                        href={`/members/${o.entity_id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {o.name || o.entity_id}
                      </Link>
                    ) : (
                      o.name || '—'
                    )}
                    {o.percentage != null && (
                      <span className="text-slate-500"> · {o.percentage}%</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Accounts */}
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="p-6 pb-3">
              <h2 className="text-lg font-semibold flex items-center">
                <ShieldCheck size={18} className="mr-2 text-slate-400" />
                Accounts
                <span className="ml-2 text-sm font-normal text-slate-500">
                  {profile.accounts.length}
                </span>
              </h2>
            </div>

            {profile.accounts.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-slate-500">
                No account in the core names this member as its holder.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-6 py-2 font-medium">Account</th>
                      <th className="px-6 py-2 font-medium">Type</th>
                      <th className="px-6 py-2 font-medium">Status</th>
                      <th className="px-6 py-2 font-medium text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {profile.accounts.map((a) => (
                      <tr key={a.id}>
                        <td className="px-6 py-3 font-mono text-xs">
                          <Link
                            href={`/accounts/${a.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {a.id}
                          </Link>
                        </td>
                        <td className="px-6 py-3">{a.type}</td>
                        <td className="px-6 py-3">{a.status}</td>
                        <td className="px-6 py-3 text-right tabular-nums">{a.balance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Transfers */}
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="p-6 pb-3">
              <h2 className="text-lg font-semibold flex items-center">
                <Mail size={18} className="mr-2 text-slate-400" />
                Recent transfers
                <span className="ml-2 text-sm font-normal text-slate-500">
                  {profile.transactions.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Up to 50 per account, newest first. Sign is from this member&rsquo;s side.
              </p>
            </div>

            {profile.transactions.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-slate-500">
                No transfers recorded against this member&rsquo;s accounts.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-6 py-2 font-medium">Counterparty</th>
                      <th className="px-6 py-2 font-medium">Date</th>
                      <th className="px-6 py-2 font-medium">Status</th>
                      <th className="px-6 py-2 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {profile.transactions.map((t) => (
                      <tr key={t.id}>
                        <td className="px-6 py-3 font-mono text-xs">{t.member}</td>
                        <td className="px-6 py-3">{t.date}</td>
                        <td className="px-6 py-3">{t.status}</td>
                        <td className="px-6 py-3 text-right tabular-nums">{t.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex items-center text-xs text-slate-400">
            <MapPin size={12} className="mr-1" />
            Read-only. The browser&rsquo;s proxy forwards GETs against an allowlist; there is
            no write path behind this page.
          </div>
        </div>
      )}
    </MainLayout>
  );
}
