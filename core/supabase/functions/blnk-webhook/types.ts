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

/**
 * A balance monitor tripping its condition. These are our real-time compliance
 * tripwires (CTR aggregation, cash limits, liquidity, concentration,
 * structuring), so the shape is read defensively: any field may be absent.
 */
export interface BlnkBalanceMonitorData {
  monitor_id?: string;
  balance_id?: string;
  /** the configured trip rule, e.g. { field: "balance", operator: ">", value: 1000000 } */
  condition?: { field?: string; operator?: string; value?: number | string; [k: string]: unknown };
  /** the value that tripped it */
  value?: number;
  balance?: number;
  triggered_at?: string;
  meta_data?: { core_resource?: CoreResourceRef; alert_type?: string; [k: string]: unknown } | null;
  [k: string]: unknown;
}

/** Shipped in Blnk v0.15.0 (2026-06-23) — reconciliation run outcomes. */
export interface BlnkReconciliationData {
  reconciliation_id?: string;
  status?: string;
  matched_count?: number;
  unmatched_count?: number;
  reason?: string;
  meta_data?: { core_resource?: CoreResourceRef; [k: string]: unknown } | null;
  [k: string]: unknown;
}

/**
 * Batch apply/inflight/fail. Blnk may send the constituent transactions inline
 * OR only their ids — both are tolerated; the id-only form needs an API fetch we
 * deliberately do not do inside the webhook (see index.ts).
 */
export interface BlnkBulkTransactionData {
  batch_id?: string;
  status?: string;
  transactions?: BlnkTransactionData[];
  transaction_ids?: string[];
  reason?: string;
  [k: string]: unknown;
}

/** Shipped in Blnk v0.15.0 (2026-06-23) — internal async processing failure. */
export interface BlnkSystemErrorData {
  error?: string;
  message?: string;
  component?: string;
  reference?: string;
  [k: string]: unknown;
}

export interface BlnkWebhook<D = Record<string, unknown>> {
  event: BlnkEventName;
  data: D;
}
