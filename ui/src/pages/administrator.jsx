// src/pages/administrator.jsx
//
// The operator's view of the system itself: is the core reachable, endpoint by
// endpoint; how much data it is holding; how fresh the control evidence is;
// and who this session is signed in as.
//
// What this page deliberately is NOT is user management. The core exposes no
// employee or user directory — that is a standing decision, not a gap (an
// access-control system granting rights to fabricated identities would be
// worse than none). The session identity shown here is local to this browser,
// and the page says so instead of dressing it up as an account.
import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, User, XCircle } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { useSession } from '../lib/context/SessionContext';
import {
  fetchControlResults,
  fetchCoreInventory,
  fetchObligations,
  fetchPendingApprovals,
  formatWhen,
  probeCoreEndpoints,
} from '../lib/api';

function InventoryTile({ label, value, note }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="text-sm font-medium text-slate-500 mb-1">{label}</div>
      <div className="text-2xl font-semibold tabular-nums">{value ?? '—'}</div>
      {note && <div className="text-xs text-slate-500 mt-1">{note}</div>}
    </div>
  );
}

export default function Administrator() {
  const { user } = useSession();
  const [probes, setProbes] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [obligations, setObligations] = useState(null);
  const [approvals, setApprovals] = useState(null);
  const [latestEvidence, setLatestEvidence] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async (isRefresh) => {
    if (isRefresh) setIsRefreshing(true);

    // Sections load independently: the probe panel exists precisely for the
    // case where some of these fail, so no single failure may blank the page.
    const [probeRes, invRes, oblRes, apprRes, evidRes] = await Promise.allSettled([
      probeCoreEndpoints(),
      fetchCoreInventory(),
      fetchObligations(),
      fetchPendingApprovals(),
      fetchControlResults({ limit: 1 }),
    ]);

    if (probeRes.status === 'fulfilled') setProbes(probeRes.value);
    if (invRes.status === 'fulfilled') setInventory(invRes.value);
    if (oblRes.status === 'fulfilled') setObligations(oblRes.value);
    if (apprRes.status === 'fulfilled') setApprovals(apprRes.value);
    if (evidRes.status === 'fulfilled') setLatestEvidence(evidRes.value.results[0] ?? null);

    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const down = probes?.filter((p) => !p.ok) ?? [];
  const countOf = (slot) =>
    slot ? `${slot.count}${slot.truncated ? '+' : ''}` : null;

  return (
    <MainLayout
      title="Admin"
      subtitle="Core connectivity, data inventory, and this session's identity"
      actions={
        <button
          onClick={() => load(true)}
          disabled={isRefreshing}
          className="px-3 py-2 text-sm border border-slate-300 rounded-md hover:bg-slate-50 flex items-center disabled:opacity-50"
        >
          <RefreshCw size={16} className={`mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Re-check
        </button>
      }
    >
      {isLoading ? (
        <div className="p-6 text-center bg-white rounded-lg border border-slate-200">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
          <div>Checking the core...</div>
        </div>
      ) : (
        <>
          {down.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <h3 className="font-medium text-red-800">
                {down.length} of {probes.length} core endpoints failed
              </h3>
              <p className="text-sm text-red-600 mt-0.5">
                Details are in the connectivity table below — the failures carry the
                core&rsquo;s own error text.
              </p>
            </div>
          )}

          {/* -------------------------------------------------- data inventory */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            <InventoryTile
              label="Members"
              value={countOf(inventory?.entities)}
              note={inventory?.entities?.truncated && 'count truncated'}
            />
            <InventoryTile
              label="Accounts"
              value={countOf(inventory?.accounts)}
              note={inventory?.accounts?.truncated && 'count truncated'}
            />
            <InventoryTile
              label="Transfers"
              value={countOf(inventory?.transfers)}
              note={inventory?.transfers?.truncated && 'count truncated'}
            />
            <InventoryTile
              label="Obligations"
              value={obligations?.total}
              note={
                obligations &&
                `${obligations.scheduled} scheduled · ${obligations.unscheduled} unanchored`
              }
            />
            <InventoryTile
              label="Pending approvals"
              value={approvals?.pendingCount}
              note={
                approvals?.unassessedCount > 0 &&
                `${approvals.unassessedCount} payments never assessed`
              }
            />
            <InventoryTile
              label="Latest evidence"
              value={
                latestEvidence
                  ? formatWhen(latestEvidence.created_at)
                  : 'none'
              }
              note={latestEvidence && latestEvidence.control_id}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* -------------------------------------------- core connectivity */}
            <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h2 className="text-sm font-medium text-slate-700">Core connectivity</h2>
                <span className="text-xs text-slate-500">
                  every path the read-only proxy allows
                </span>
              </div>
              {!probes ? (
                <div className="p-6 text-center text-slate-500">Probe did not run.</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500">Endpoint</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500">Path</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500">Status</th>
                      <th className="text-right py-2.5 px-4 text-xs font-medium text-slate-500">Latency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {probes.map((p) => (
                      <tr key={p.path} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50">
                        <td className="py-2.5 px-4 text-sm font-medium">{p.name}</td>
                        <td className="py-2.5 px-4 text-xs font-mono text-slate-500">/{p.path}</td>
                        <td className="py-2.5 px-4 text-sm">
                          {p.ok ? (
                            <span className="inline-flex items-center text-green-700">
                              <CheckCircle2 size={15} className="mr-1.5" /> ok
                            </span>
                          ) : (
                            <span className="inline-flex items-start text-red-700">
                              <XCircle size={15} className="mr-1.5 mt-0.5 shrink-0" />
                              <span className="text-xs">{p.error}</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-sm text-right tabular-nums text-slate-600">
                          {p.ms} ms
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* --------------------------------------------- session identity */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <h2 className="text-sm font-medium text-slate-700">This session</h2>
              </div>
              <div className="p-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                    <User size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{user.name}</div>
                    <div className="text-xs text-slate-500">
                      {user.role} · {user.branch}
                    </div>
                  </div>
                </div>
                <div className="text-xs font-medium text-slate-500 mb-1.5">Permissions</div>
                <div className="flex flex-wrap gap-1.5">
                  {user.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="inline-flex px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-mono"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-4">
                  This identity is local to the browser session. It is not backed by a
                  directory and grants nothing at the core — the proxy authenticates with
                  its own server-side key.
                </p>
              </div>
            </div>
          </div>

          {/* Why there is no "Add User" button, stated on the page it would
              have lived on rather than only in a design doc. */}
          <div className="bg-slate-100 border border-slate-200 rounded-md p-3 text-sm text-slate-700">
            <span className="font-medium">No user management, on purpose.</span> The core
            exposes no employee or user directory endpoint, so there are no real
            identities for this page to create, disable, or grant roles to. Building
            those screens against invented users would demonstrate access control while
            providing none. They belong here the day an HR or identity feed exists.
          </div>
        </>
      )}
    </MainLayout>
  );
}
