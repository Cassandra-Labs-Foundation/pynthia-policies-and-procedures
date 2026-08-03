// Assets / Liabilities / Equity, each opening into its subcategories, each of
// those into the accounts, each account into its postings.
//
// Four levels, expanding in place. The nesting is the point: an exec opens
// Liabilities, sees member shares broken out by type, notices one line looks
// wrong, and opens it — without ever losing the totals above it or landing on
// a different page.
//
// Unsourced categories stay VISIBLE rather than being omitted. A balance sheet
// with no "Loans" row reads as a credit union with no loans; a "Loans" row that
// says what it is waiting for reads as a system that is not finished. Those are
// very different messages and only one of them is true.
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';
import { formatCents, formatWhen } from '../../lib/api';

const STATUS_STYLE = {
  APPLIED: 'bg-green-50 text-green-800',
  INFLIGHT: 'bg-amber-50 text-amber-800',
  VOID: 'bg-slate-100 text-slate-600',
};

function shortId(id, keep = 14) {
  if (!id) return '—';
  return id.length <= keep + 3 ? id : `${id.slice(0, keep)}…`;
}

/** Level 4 — the postings under one account. */
function Postings({ balanceId, postingsByBalance, labelFor }) {
  const rows = postingsByBalance.get(balanceId) ?? [];
  if (rows.length === 0) {
    return (
      <div className="pl-24 pr-4 py-2.5 text-xs text-slate-500 bg-white">
        No postings for this account in the loaded window.
      </div>
    );
  }
  return (
    <table className="w-full bg-white">
      <tbody>
        {rows.slice(0, 50).map((p) => {
          const other = p.side === 'debit' ? p.source : p.destination;
          return (
            <tr key={`${p.id}-${p.side}`} className="border-t border-slate-100">
              <td className="py-1.5 pl-24 pr-3 text-xs font-mono text-slate-500" title={p.id}>
                {shortId(p.id, 12)}
              </td>
              <td className="py-1.5 px-3 text-xs">
                <span className={p.side === 'debit' ? 'text-blue-700' : 'text-purple-700'}>
                  {p.side === 'debit' ? 'Dr' : 'Cr'}
                </span>
              </td>
              <td className="py-1.5 px-3 text-xs font-mono text-slate-500" title={other ?? ''}>
                {labelFor(other) ?? shortId(other, 12)}
              </td>
              <td className="py-1.5 px-3 text-xs text-right tabular-nums">{formatCents(p.amount)}</td>
              <td className="py-1.5 px-3">
                <span
                  className={`inline-flex px-1.5 py-0.5 rounded text-xs ${
                    STATUS_STYLE[p.status] ?? 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {p.status}
                </span>
              </td>
              <td className="py-1.5 px-3 text-xs text-slate-400 whitespace-nowrap">
                {formatWhen(p.createdAt)}
              </td>
            </tr>
          );
        })}
        {rows.length > 50 && (
          <tr className="border-t border-slate-100">
            <td colSpan={6} className="py-1.5 pl-24 pr-3 text-xs text-slate-500">
              showing 50 of {rows.length} postings
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

/** Level 3 — the accounts under a subcategory. */
function AccountRows({ accounts, postingsByBalance, labelFor }) {
  const [open, setOpen] = useState(() => new Set());
  const [limit, setLimit] = useState(25);

  const toggle = (id) => {
    const next = new Set(open);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpen(next);
  };

  return (
    <>
      {accounts.slice(0, limit).map((a) => (
        <div key={a.id} className="border-t border-slate-100">
          <button
            onClick={() => toggle(a.id)}
            className="w-full flex items-center pl-16 pr-4 py-1.5 hover:bg-slate-100 text-left"
          >
            {open.has(a.id) ? (
              <ChevronDown size={12} className="text-slate-400 mr-2 shrink-0" />
            ) : (
              <ChevronRight size={12} className="text-slate-400 mr-2 shrink-0" />
            )}
            <span className="flex-1 text-xs font-mono text-slate-700 truncate" title={a.id}>
              {a.label ?? shortId(a.id, 20)}
            </span>
            <span className="text-xs tabular-nums text-slate-400 w-28 text-right hidden md:block">
              {formatCents(a.debit)}
            </span>
            <span className="text-xs tabular-nums text-slate-400 w-28 text-right hidden md:block">
              {formatCents(a.credit)}
            </span>
            <span className="text-xs tabular-nums w-32 text-right">{formatCents(a.net)}</span>
          </button>
          {open.has(a.id) && (
            <Postings balanceId={a.id} postingsByBalance={postingsByBalance} labelFor={labelFor} />
          )}
        </div>
      ))}
      {accounts.length > limit && (
        <div className="pl-16 pr-4 py-2 border-t border-slate-100">
          <button
            onClick={() => setLimit((n) => n + 100)}
            className="text-xs text-blue-600 hover:underline"
          >
            Show more — {accounts.length - limit} of {accounts.length} hidden
          </button>
        </div>
      )}
    </>
  );
}

/** Level 2 — a subcategory (a 5300 share line, or a cash group). */
function Group({ group, postingsByBalance, labelFor, depth = 0 }) {
  const [open, setOpen] = useState(false);
  const isUnsourced = Boolean(group.needs);

  if (isUnsourced) {
    return (
      <div className="border-t border-slate-200 pl-10 pr-4 py-2.5 flex items-start bg-white">
        <Info size={13} className="text-slate-300 mr-2 mt-0.5 shrink-0" />
        <div className="flex-1">
          <div className="text-sm text-slate-500">{group.title}</div>
          <div className="text-xs text-slate-400 mt-0.5">Needs: {group.needs}</div>
        </div>
        <span className="text-sm tabular-nums text-slate-300 w-32 text-right">—</span>
      </div>
    );
  }

  const sub = group.subgroups ?? null;

  return (
    <div className="border-t border-slate-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center pl-10 pr-4 py-2.5 hover:bg-slate-50 text-left bg-white"
      >
        {open ? (
          <ChevronDown size={14} className="text-slate-400 mr-2 shrink-0" />
        ) : (
          <ChevronRight size={14} className="text-slate-400 mr-2 shrink-0" />
        )}
        <span className="flex-1 text-sm">
          {group.title}
          <span className="ml-2 text-xs text-slate-400">
            {group.count} account{group.count === 1 ? '' : 's'}
          </span>
          {group.inferred && (
            <span className="ml-2 text-xs text-amber-700" title="Classified from debit/credit posture, not a declared chart of accounts">
              inferred
            </span>
          )}
        </span>
        <span className="text-xs tabular-nums text-slate-400 w-28 text-right hidden md:block">
          Dr {formatCents(group.debit)}
        </span>
        <span className="text-xs tabular-nums text-slate-400 w-28 text-right hidden md:block">
          Cr {formatCents(group.credit)}
        </span>
        <span className="text-sm tabular-nums font-medium w-32 text-right">
          {formatCents(group.totalCents)}
        </span>
      </button>

      {open && (
        <div className="bg-slate-50">
          {sub
            ? sub.map((s) => (
              <div key={s.id} className="border-t border-slate-200">
                <SubGroup group={s} postingsByBalance={postingsByBalance} labelFor={labelFor} />
              </div>
            ))
            : (
              <AccountRows
                accounts={group.accounts ?? []}
                postingsByBalance={postingsByBalance}
                labelFor={labelFor}
              />
            )}
        </div>
      )}
    </div>
  );
}

/** A 5300 share line inside "Member shares and deposits". */
function SubGroup({ group, postingsByBalance, labelFor }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center pl-14 pr-4 py-2 hover:bg-slate-100 text-left"
      >
        {open ? (
          <ChevronDown size={13} className="text-slate-400 mr-2 shrink-0" />
        ) : (
          <ChevronRight size={13} className="text-slate-400 mr-2 shrink-0" />
        )}
        <span className="flex-1 text-sm">
          {group.title}
          {/* The 5300 line this rolls up to, so the accounting page and the
              call report visibly agree rather than merely happening to. */}
          <span className="ml-2 text-xs font-mono text-slate-400">{group.code}</span>
          <span className="ml-2 text-xs text-slate-400">{group.count} accounts</span>
        </span>
        <span className="text-sm tabular-nums w-32 text-right">{formatCents(group.totalCents)}</span>
      </button>
      {open && (
        <AccountRows
          accounts={group.accounts ?? []}
          postingsByBalance={postingsByBalance}
          labelFor={labelFor}
        />
      )}
    </>
  );
}

export default function LedgerTree({ tree, postingsByBalance, accountByBalanceId }) {
  const [openSections, setOpenSections] = useState(() => new Set(['assets', 'liabilities']));
  const labelFor = (balanceId) => accountByBalanceId?.get(balanceId) ?? null;

  const toggle = (id) => {
    const next = new Set(openSections);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpenSections(next);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-4">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h2 className="text-sm font-medium text-slate-700">Ledger by classification</h2>
        <span className="text-xs text-slate-500">
          {tree.counts.memberAccounts} member · {tree.counts.institutionAccounts} institution
        </span>
      </div>

      {/* The two sides, and an explicit statement that equity is missing —
          so the gap between them is explained rather than looking like a break. */}
      <div className="px-4 py-3 border-b border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50">
        <div>
          <div className="text-xs font-medium text-slate-500">Total assets</div>
          <div className="text-lg font-semibold tabular-nums">{formatCents(tree.assetsCents)}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-slate-500">Total liabilities</div>
          <div className="text-lg font-semibold tabular-nums">{formatCents(tree.liabilitiesCents)}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-slate-500">Equity</div>
          <div className="text-lg font-semibold text-slate-400">not sourced</div>
          <div className="text-xs text-slate-500 mt-0.5">
            so assets = liabilities + equity cannot be checked here
          </div>
        </div>
      </div>

      {tree.sections.map((section) => {
        const open = openSections.has(section.id);
        return (
          <div key={section.id} className="border-b border-slate-200 last:border-b-0">
            <button
              onClick={() => toggle(section.id)}
              className="w-full flex items-center px-4 py-3 hover:bg-slate-50 text-left"
            >
              {open ? (
                <ChevronDown size={16} className="text-slate-400 mr-2 shrink-0" />
              ) : (
                <ChevronRight size={16} className="text-slate-400 mr-2 shrink-0" />
              )}
              <span className="flex-1 font-semibold text-sm">{section.title}</span>
              <span className="text-base tabular-nums font-semibold w-32 text-right">
                {section.totalCents === null ? (
                  <span className="text-slate-400 text-sm">not sourced</span>
                ) : (
                  formatCents(section.totalCents)
                )}
              </span>
            </button>
            {open && (
              <div>
                {section.groups.map((g) => (
                  <Group
                    key={g.id}
                    group={g}
                    postingsByBalance={postingsByBalance}
                    labelFor={labelFor}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="px-4 py-2.5 bg-slate-100 border-t border-slate-200 text-xs text-slate-600">
        Member accounts are liabilities because the credit union owes them — that follows from
        what the account is. Institution accounts are marked <span className="text-amber-700">inferred</span>:
        Blnk carries no chart of accounts, so asset-vs-liability is read from debit/credit
        posture and needs confirming before anyone relies on it.
      </div>
    </div>
  );
}
