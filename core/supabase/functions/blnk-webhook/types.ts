// Blnk webhook payload shapes. `data` is a loose contract — Blnk warns fields
// vary by transaction type and version, so treat everything as optional and
// tolerate unknown keys. See https://docs.blnkfinance.com/webhooks/events

export type BlnkEventName =
  | "transaction.applied"
  | "transaction.inflight"
  | "transaction.void"
  | "transaction.rejected"
  | "transaction.scheduled"
  | "bulk_transaction.applied"
  | "bulk_transaction.inflight"
  | "bulk_transaction.failed"
  | "balance.created"
  | "balance.monitor"
  | "ledger.created"
  | "identity.created"
  | "reconciliation.completed"
  | "reconciliation.failed"
  | "system.error"
  | (string & Record<never, never>); // forward-compatible: unknown events still typecheck

// Optional pointer we set in a transaction's meta_data when we create it, so the
// webhook can route back to the exact core row without guessing. Phase-2 writers
// must populate this: meta_data.core_resource = { table, id }.
export interface CoreResourceRef {
  table: string;
  id: string;
}

export interface BlnkTransactionData {
  transaction_id?: string;
  reference?: string;
  parent_transaction?: string;
  status?: string; // QUEUED | INFLIGHT | APPLIED | VOID | REJECTED | SCHEDULED
  amount?: number;
  precise_amount?: number;
  precision?: number;
  currency?: string;
  source?: string;
  destination?: string;
  hash?: string;
  inflight?: boolean;
  meta_data?: { core_resource?: CoreResourceRef; [k: string]: unknown } | null;
  [k: string]: unknown;
}

export interface BlnkBalanceData {
  balance_id?: string;
  ledger_id?: string;
  identity_id?: string;
  currency?: string;
  balance?: number;
  meta_data?: { core_resource?: CoreResourceRef; [k: string]: unknown } | null;
  [k: string]: unknown;
}

export interface BlnkIdentityData {
  identity_id?: string;
  meta_data?: { core_resource?: CoreResourceRef; [k: string]: unknown } | null;
  [k: string]: unknown;
}

export interface BlnkWebhook<D = Record<string, unknown>> {
  event: BlnkEventName;
  data: D;
}
