// src/pages/accounts/[id].jsx
//
// One account: holder, standing, balance, and every transfer it touched.
//
// This page exists because most journal rows have nowhere else to go. The
// Member column links to a member profile when the account names a holder —
// but 1,794 of this instance's 1,829 accounts carry entity_id null, so for
// them the account itself is the deepest thing the core can show. Clicking
// an account id lands here rather than nowhere.
//
// Read-only, like everything the browser reaches; see pages/api/core/.
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft, CreditCard, User, ArrowRightLeft } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { fetchAccountProfile, formatCents, formatWhen } from '../../lib/api';

const STATUS_STYLE = {
  open: 'bg-green-100 text-green-800',
  frozen: 'bg-blue-100 text-blue-800',
  closed: 'bg-slate-200 text-slate-700',
};

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

export default function AccountDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // router.query is empty on the first render of a dynamic route; waiting
    // for the id avoids firing GET /accounts/undefined and rendering its 404.
    if (!id) return;

    let cancelled = false;
    setIsLoading(true);
    setError('');

    fetchAccountProfile(id)
      .then((result) => {
        if (!cancelled) setProfile(result);
      })
      .catch((err) => {
        console.error('Error loading account:', err);
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const raw = profile?.raw;

  return (
    <MainLayout
      title="Account"
      subtitle={id ? String(id) : 'Loading account'}
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
          <h3 className="font-medium text-red-800">Could not load this account</h3>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      )}

      {isLoading && !error && (
        <div className="bg-white rounded-lg p-6 border border-slate-200 text-slate-500">
          Loading account…
        </div>
      )}

      {profile && !isLoading && (
        <div className="space-y-6">
          {/* Standing */}
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <div className="flex items-start justify-between mb-5">
              <h2 className="text-lg font-semibold flex items-center">
                <CreditCard size={18} className="mr-2 text-slate-400" />
                Standing
              </h2>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  STATUS_STYLE[raw.status] ?? 'bg-slate-100 text-slate-700'
                }`}
              >
                {raw.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Field label="Type" value={raw.account_type} />
              <Field label="Balance" value={formatCents(raw.balance)} />
              <Field
                label="Balance synced"
                value={formatWhen(raw.balance_synced_at)}
                hint="The ledger position is advanced by the Payment Hub; this is the last sync."
              />
              <Field label="Opened" value={formatWhen(raw.created_at)} />
              <Field label="Account ID" value={raw.id} />
            </div>
          </div>

          {/* Holder */}
          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <User size={18} className="mr-2 text-slate-400" />
              Holder
            </h2>
            {profile.holder ? (
              <Link
                href={`/members/${profile.holder.id}`}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                {profile.holder.name}
                <span className="ml-2 font-mono text-xs text-slate-400">{profile.holder.id}</span>
              </Link>
            ) : (
              <p className="text-sm text-slate-500">
                No member is linked to this account — its <code>entity_id</code> is null in the
                core. That is a data condition, not a display gap: the core offers no write to
                link an existing account to a member after creation.
              </p>
            )}
          </div>

          {/* Transfers */}
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="p-6 pb-3">
              <h2 className="text-lg font-semibold flex items-center">
                <ArrowRightLeft size={18} className="mr-2 text-slate-400" />
                Transfers
                <span className="ml-2 text-sm font-normal text-slate-500">
                  {profile.transactions.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Newest first. Sign is from this account&rsquo;s side.
              </p>
            </div>

            {profile.transactions.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-slate-500">
                No transfers recorded against this account.
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
                        <td className="px-6 py-3">
                          {t.memberEntityId ? (
                            <Link
                              href={`/members/${t.memberEntityId}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {t.member}
                            </Link>
                          ) : t.counterpartyAccountId ? (
                            <Link
                              href={`/accounts/${t.counterpartyAccountId}`}
                              className="font-mono text-xs text-blue-600 hover:text-blue-800"
                            >
                              {t.counterpartyAccountId}
                            </Link>
                          ) : (
                            '—'
                          )}
                        </td>
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
        </div>
      )}
    </MainLayout>
  );
}
