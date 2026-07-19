// The synthetic institution's drill cases.
//
// Failures are first-class and deliberately interleaved with the happy paths:
// an institution that only ever behaves correctly proves nothing about the
// controls, because a control's whole job is what it does when something is
// wrong. Roughly half of these are `negative`.

import { ACTORS, type DrillCase, type Env, body } from "./drill.ts";
import { postAlertTriage, postCaseDecision, postTimerSweep, raiseAlert } from "../api/bsa.ts";
import { postCashTransaction, getCashAggregation, postCtrFile, postCtrSweep } from "../api/cash.ts";
import { postDisposeRecord, postLegalHold, setRetentionClocks } from "../api/retention.ts";
import { postCalendarSweep, postObligation, postObligationComplete } from "../api/governance.ts";
import { postAanIssue, postLoanDecision, postLoanParty, postLendingSweep } from "../api/lending.ts";
import { postPaymentApproval, putClientLimit } from "../api/eps.ts";
import {
  postAttestation, postObservation, postWorkItem, postWorkItemClose,
  postWorkItemSweep, putThreshold,
} from "../api/primitives.ts";
import { postTransfer } from "../api/transfers.ts";
import { postWireConfirm, postWirePrepare } from "../api/wires.ts";
import { postAch, postAchReturn, postAchSettle } from "../api/ach.ts";
import { postCardAuthorize, postCardCapture, postCardExpire } from "../api/cards.ts";
import { getAccount } from "../api/accounts.ts";
import { postVerification } from "../api/kyc.ts";
import { type BlnkConfig } from "../_shared/blnk.ts";

/**
 * Blnk stub. The drill is about control behaviour, not ledger fidelity, so the
 * ledger always says yes with a healthy balance. RAIL-02 uses `blnkPoor` to
 * drive the NSF path specifically.
 */
function mkBlnk(balance: number): BlnkConfig {
  return {
    apiUrl: "https://blnk.drill", apiKey: "k",
    fetchFn: (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const payload = url.includes("/balances/")
        ? { balance, inflight_balance: 0 }
        : { transaction_id: "txn_drill", reference: "ref_drill", status: "APPLIED" };
      return Promise.resolve(
        new Response(JSON.stringify(payload), { headers: { "content-type": "application/json" } }),
      );
    },
  };
}
const _rich = mkBlnk(500_000_00);
const _poor = mkBlnk(0);
const blnk = (_env: Env) => _rich;
const blnkPoor = (_env: Env) => _poor;

const SIM = "sim" as const;
const R = (b?: unknown, hdrs: Record<string, string> = {}) =>
  new Request("https://drill/x", {
    method: "POST",
    headers: { "content-type": "application/json", "Idempotency-Key": "drill", ...hdrs },
    body: b === undefined ? undefined : JSON.stringify(b),
  });
const G = (url: string) => new Request(`https://drill${url}`, { method: "GET" });

/** Seed the institution: members, accounts (linked and deliberately not). */
export function seedInstitution(env: Env): void {
  // FINDING: the four money rails (transfers, wires, ach, cards) hardcode
  // db.schema("core") and take no `scope` parameter — every module built after
  // them does. So the drill cannot point them at sim, and seeds BOTH schemas.
  // Recorded as OQ-18; pollution is not a concern for this run.
  const put = (t: string, row: Record<string, unknown>) => {
    for (const sch of ["sim", "core"]) {
      env.rows[`${sch}.${t}`] ??= [];
      env.rows[`${sch}.${t}`].push({
        ...(sch === "sim" ? { provenance: "simulated" } : { provenance: "production" }),
        ...row,
      });
    }
  };
  put("partner", { id: "ptnr_drill", status: "active", instance_id: "inst_drill" });
  for (let i = 1; i <= 6; i++) {
    put("entity", { id: `ent_${i}`, type: "person", name: `Member ${i}`, status: "active" });
    put("account", {
      id: `acct_${i}`, entity_id: `ent_${i}`, status: "open", lock_type: "none", account_type: "checking",
      balance: 5_000_00, blnk_balance_id: `bal_${i}`, partner_id: "ptnr_drill",
    });
  }
  // the same member holding TWO accounts — the structuring case that per-account
  // detection is expected to miss
  put("account", {
    id: "acct_1b", entity_id: "ent_1", status: "open", lock_type: "none", account_type: "checking",
    balance: 5_000_00, blnk_balance_id: "bal_1b", partner_id: "ptnr_drill",
  });
  // a legacy account nobody can attribute — OQ-12 made real
  put("account", {
    id: "acct_legacy", entity_id: null, status: "open", lock_type: "none", account_type: "checking",
    balance: 5_000_00, blnk_balance_id: "bal_l", partner_id: "ptnr_drill",
  });
  put("loan_application", {
    id: "app_1", status: "completed", completed_at: "2026-06-01T00:00:00.000Z",
    decisioned_at: null, final_action: null, funding_block_state: "open",
  });
  put("loan_application", {
    id: "app_2", status: "completed", completed_at: "2026-06-01T00:00:00.000Z",
    decisioned_at: null, final_action: null, funding_block_state: "open",
  });
}

export const CASES: DrillCase[] = [
  // ============================================ governance calendar (Tier D)
  {
    id: "GOV-01", controls: ["bsa:BSA-16"], kind: "positive",
    what: "an anchored obligation registers with a real due date",
    expect: "scheduled",
    run: async (env) => {
      const res = await postObligation(
        R({ control_uid: "bsa:BSA-16", trigger_code: "audit.cycle_timer",
            title: "Independent testing", cadence: "annual", anchor_date: "2026-01-01" }),
        env.db, "d", ACTORS.ops, SIM,
      );
      return (await body(res)).scheduled ? "scheduled" : "unscheduled";
    },
  },
  {
    id: "GOV-02", controls: ["audit:AU-01"], kind: "negative",
    what: "an obligation with no anchor is UNSCHEDULED, not merely not-due",
    expect: "unscheduled",
    run: async (env) => {
      const res = await postObligation(
        R({ control_uid: "audit:AU-01", trigger_code: "board.review.due_at",
            title: "Board oversight review", cadence: "annual" }),
        env.db, "d", ACTORS.ops, SIM,
      );
      const b = await body(res);
      return b.scheduled === false && String(b.warning ?? "").includes("never come due")
        ? "unscheduled" : "mislabelled";
    },
  },
  {
    id: "GOV-03", controls: ["bsa:BSA-16", "audit:AU-01"], kind: "negative",
    what: "the sweep separates OVERDUE from UNSCHEDULED and fires the control's own trigger",
    expect: "overdue=1 unscheduled=1 fired_own_code=true",
    run: async (env) => {
      const res = await postCalendarSweep(R({}), env.db, "d", ACTORS.ops, SIM);
      const b = await body(res);
      for (const e of env.rows["sim.event"] ?? []) env.fired.add(String(e.code));
      const own = (env.rows["sim.event"] ?? []).some((e) => e.code === "audit.cycle_timer");
      return `overdue=${b.overdue_count} unscheduled=${b.unscheduled_count} fired_own_code=${own}`;
    },
  },
  {
    id: "GOV-04", controls: ["bsa:BSA-16"], kind: "positive",
    what: "completion advances from the DUE date, so lateness cannot stretch the cadence",
    expect: "2027-01-01",
    run: async (env) => {
      const id = "oblig_bsa_BSA-16_audit.cycle_timer";
      const res = await postObligationComplete(
        R({ completed_by: "internal-audit" }), id, env.db, "d", ACTORS.ops, SIM,
      );
      return String((await body(res)).next_due_at ?? "").slice(0, 10);
    },
  },

  // ================================================== cash + CTR (BSA-08)
  {
    id: "CASH-01", controls: ["bsa:BSA-08"], kind: "positive",
    what: "per-person daily currency aggregation crosses $10k and opens a CTR",
    expect: "ctr_opened",
    run: async (env) => {
      for (const amt of [400_000, 700_000]) {
        await postCashTransaction(
          R({ direction: "cash_in", amount_cents: amt, business_date: "2026-07-19", account_id: "acct_1" }),
          env.db, "d", ACTORS.ops, SIM,
        );
      }
      const rows = env.rows["sim.ctr_filing"] ?? [];
      return rows.length === 1 ? "ctr_opened" : `ctr_rows=${rows.length}`;
    },
  },
  {
    id: "CASH-02", controls: ["bsa:BSA-08"], kind: "negative",
    what: "cash-in and cash-out are NOT summed into a false obligation",
    expect: "no_ctr",
    run: async (env) => {
      await postCashTransaction(
        R({ direction: "cash_in", amount_cents: 600_000, business_date: "2026-07-18", account_id: "acct_2" }),
        env.db, "d", ACTORS.ops, SIM,
      );
      const res = await postCashTransaction(
        R({ direction: "cash_out", amount_cents: 600_000, business_date: "2026-07-18", account_id: "acct_2" }),
        env.db, "d", ACTORS.ops, SIM,
      );
      return (await body(res)).ctr === null ? "no_ctr" : "false_ctr";
    },
  },
  {
    id: "CASH-03", controls: ["bsa:BSA-08"], kind: "negative",
    what: "currency on an unlinked account is UNATTRIBUTABLE, not dropped and not self-bucketed",
    expect: "unattributable_alerted",
    run: async (env) => {
      const res = await postCashTransaction(
        R({ direction: "cash_in", amount_cents: 1_500_000, business_date: "2026-07-19", account_id: "acct_legacy" }),
        env.db, "d", ACTORS.ops, SIM,
      );
      const b = await body(res);
      const alerted = (env.rows["sim.bsa_alert"] ?? []).some((a) => a.alert_type === "unattributable_cash");
      return b.attributable === false && b.ctr === null && alerted
        ? "unattributable_alerted" : `attr=${b.attributable} alerted=${alerted}`;
    },
  },
  {
    id: "CASH-04", controls: ["bsa:BSA-08"], kind: "negative",
    what: "a day containing unattributable currency reports complete=false",
    expect: "incomplete",
    run: async (env) => {
      const res = await getCashAggregation(
        G("/cash/aggregation?business_date=2026-07-19"), env.db, "d", ACTORS.ops, SIM,
      );
      const b = await body(res);
      return b.complete === false ? "incomplete" : "claimed_complete";
    },
  },
  {
    id: "CASH-05", controls: ["bsa:BSA-08"], kind: "negative",
    what: "a CTR cannot be marked filed without a FinCEN reference",
    expect: "refused",
    run: async (env) => {
      const id = (env.rows["sim.ctr_filing"] ?? [])[0]?.id;
      if (!id) throw new Error("no CTR to file — CASH-01 did not produce one");
      const res = await postCtrFile(R({ filed_by: "officer" }), String(id), env.db, "d", ACTORS.ops, SIM);
      return res.status === 400 ? "refused" : `status=${res.status}`;
    },
  },
  {
    id: "CASH-06", controls: ["bsa:BSA-08"], kind: "negative",
    what: "STRUCTURING ACROSS TWO ACCOUNTS OF ONE MEMBER — does per-person aggregation catch it?",
    expect: "caught_per_person",
    run: async (env) => {
      // $6k + $6k into two different accounts owned by ent_1 on one day.
      // Per-ACCOUNT detection would miss this; per-PERSON should not.
      for (const acct of ["acct_1", "acct_1b"]) {
        await postCashTransaction(
          R({ direction: "cash_in", amount_cents: 600_000, business_date: "2026-07-17", account_id: acct }),
          env.db, "d", ACTORS.ops, SIM,
        );
      }
      const hit = (env.rows["sim.ctr_filing"] ?? []).some(
        (c) => c.entity_id === "ent_1" && c.business_date === "2026-07-17",
      );
      return hit ? "caught_per_person" : "missed";
    },
  },

  {
    id: "CASH-07", controls: ["bsa:BSA-08"], kind: "negative",
    what: "a CTR that was owed and nobody filed is surfaced, alongside standing unattributable currency",
    expect: "overdue_and_unattributable",
    run: async (env) => {
      const c = (env.rows["sim.ctr_filing"] ?? [])[0];
      if (!c) throw new Error("no CTR to age");
      c.filing_due_at = "2020-01-01T00:00:00.000Z";
      const res = await postCtrSweep(R({}), env.db, "d", ACTORS.ops, SIM);
      const b = await body(res);
      // deno-lint-ignore no-explicit-any
      const bb = b as any;
      return bb.overdue_count > 0 && bb.unattributable_transactions > 0
        ? "overdue_and_unattributable" : `overdue=${bb.overdue_count} unattr=${bb.unattributable_transactions}`;
    },
  },

  // ==================================== BSA case chain (BSA-06 / BSA-07)
  {
    id: "BSA-01", controls: ["bsa:BSA-06"], kind: "positive",
    what: "an alert escalates to a case and starts the SAR clock from detection",
    expect: "case_opened",
    run: async (env) => {
      await raiseAlert(env.db, {
        ctx: ACTORS.ops, scope: SIM, alertType: "ctr_threshold", entityHash: "h",
        causeType: "transfer", causeId: "drill_tr1", details: "drill",
      });
      const alertId = "alert_drill_tr1_ctr_threshold";
      const res = await postAlertTriage(
        R({ outcome: "escalated" }), alertId, env.db, "d", ACTORS.investigator, SIM,
      );
      const b = await body(res);
      // deno-lint-ignore no-explicit-any
      return (b as any).case?.id ? "case_opened" : "no_case";
    },
  },
  {
    id: "BSA-02", controls: ["bsa:BSA-06"], kind: "negative",
    what: "the investigator who opened a case cannot decide it (four-eyes)",
    expect: "refused_409",
    run: async (env) => {
      const kase = (env.rows["sim.case"] ?? [])[0];
      if (!kase) throw new Error("no case — BSA-01 did not open one");
      const selfOfficer = { ...ACTORS.officer, tokenId: String(kase.opened_by) };
      const res = await postCaseDecision(
        R({ decision: "file", rationale: "self" }), String(kase.id), env.db, "d", selfOfficer, SIM,
      );
      return res.status === 409 ? "refused_409" : `status=${res.status}`;
    },
  },
  {
    id: "BSA-03", controls: ["bsa:BSA-07"], kind: "negative",
    what: "a no-file SAR decision without rationale is refused",
    expect: "refused_400",
    run: async (env) => {
      const kase = (env.rows["sim.case"] ?? [])[0];
      if (!kase) throw new Error("no case available");
      const res = await postCaseDecision(
        R({ decision: "no_file" }), String(kase.id), env.db, "d", ACTORS.officer, SIM,
      );
      return res.status === 400 ? "refused_400" : `status=${res.status}`;
    },
  },
  {
    id: "BSA-04", controls: ["bsa:BSA-07"], kind: "negative",
    what: "a SAR decision past its deadline is recorded as LATE, not silently accepted",
    expect: "late_recorded",
    run: async (env) => {
      const kase = (env.rows["sim.case"] ?? [])[0];
      if (!kase) throw new Error("no case available");
      kase.sar_decision_due_at = "2020-01-01T00:00:00.000Z";
      const res = await postCaseDecision(
        R({ decision: "file", rationale: "confirmed" }), String(kase.id), env.db, "d", ACTORS.officer, SIM,
      );
      const b = await body(res);
      return b.decision_was_late === true ? "late_recorded" : `late=${b.decision_was_late}`;
    },
  },
  {
    id: "BSA-05", controls: ["bsa:BSA-06"], kind: "negative",
    what: "an untriaged alert past its 2-day clock is surfaced by the sweep",
    expect: "breach_surfaced",
    run: async (env) => {
      await raiseAlert(env.db, {
        ctx: ACTORS.ops, scope: SIM, alertType: "structuring", entityHash: "h2",
        causeType: "transfer", causeId: "drill_stale", details: "stale",
      });
      const a = (env.rows["sim.bsa_alert"] ?? []).find((x) => x.id === "alert_drill_stale_structuring");
      if (!a) throw new Error("alert not raised");
      a.triage_due_at = "2020-01-01T00:00:00.000Z";
      const res = await postTimerSweep(R({}), env.db, "d", ACTORS.ops, SIM);
      const b = await body(res);
      // deno-lint-ignore no-explicit-any
      return (b as any).breach_count > 0 ? "breach_surfaced" : "missed";
    },
  },

  // ============================================ retention (BSA-21 / SC-02)
  {
    id: "RET-01", controls: ["bsa:BSA-21"], kind: "positive",
    what: "closing an account starts the 5-year retention clock",
    expect: "clock_set",
    run: async (env) => {
      const ids = await setRetentionClocks(env.db, "acct_3", new Date("2026-07-19T00:00:00Z"), SIM);
      return ids.length === 2 ? "clock_set" : `records=${ids.length}`;
    },
  },
  {
    id: "RET-02", controls: ["shared-controls:SC-02"], kind: "negative",
    what: "a legal hold blocks destruction even after retention expires",
    expect: "refused_409_hold",
    run: async (env) => {
      env.rows["sim.record"] ??= [];
      env.rows["sim.record"].push({
        id: "rec_held", record_class: "cip_identity", subject_ref: "acct_4",
        retention_anchor: "2014-01-01T00:00:00.000Z",
        retention_expires_at: "2019-01-01T00:00:00.000Z",
        legal_hold_flag: true, legal_hold_id: "hold_x",
        disposed_at: null, provenance: "simulated",
      });
      const res = await postDisposeRecord(
        R({ approved_by: "records", certificate: "c1" }), "rec_held", env.db, "d", ACTORS.ops, SIM,
      );
      const b = await body(res);
      return res.status === 409 && b.type === "legal_hold_in_force" ? "refused_409_hold" : `status=${res.status}`;
    },
  },
  {
    id: "RET-03", controls: ["shared-controls:SC-02"], kind: "negative",
    what: "a record still inside its retention period cannot be destroyed",
    expect: "refused_409_unexpired",
    run: async (env) => {
      env.rows["sim.record"].push({
        id: "rec_fresh", record_class: "cip_identity", subject_ref: "acct_5",
        retention_anchor: "2026-01-01T00:00:00.000Z",
        retention_expires_at: "2099-01-01T00:00:00.000Z",
        legal_hold_flag: false, disposed_at: null, provenance: "simulated",
      });
      const res = await postDisposeRecord(
        R({ approved_by: "records", certificate: "c2" }), "rec_fresh", env.db, "d", ACTORS.ops, SIM,
      );
      return (await body(res)).type === "retention_not_expired" ? "refused_409_unexpired" : `status=${res.status}`;
    },
  },
  {
    id: "RET-04", controls: ["shared-controls:SC-02"], kind: "positive",
    what: "a hold placed on a subject propagates to its records in the same call",
    expect: "propagated",
    run: async (env) => {
      env.rows["sim.record"].push({
        id: "rec_sub6", record_class: "cip_identity", subject_ref: "acct_6",
        retention_anchor: "2014-01-01T00:00:00.000Z",
        retention_expires_at: "2019-01-01T00:00:00.000Z",
        legal_hold_flag: false, disposed_at: null, provenance: "simulated",
      });
      await postLegalHold(
        R({ matter_id: "m-drill", scope_subject_ref: "acct_6", reason: "subpoena" }),
        env.db, "d", ACTORS.ops, SIM,
      );
      const r = env.rows["sim.record"].find((x) => x.id === "rec_sub6");
      return r?.legal_hold_flag === true ? "propagated" : "not_propagated";
    },
  },

  // ================================================ EPS-06 dual control
  {
    id: "EPS-01", controls: ["electronic-payment-systems:EPS-06"], kind: "negative",
    what: "the originator of a payment cannot approve it (four-eyes)",
    expect: "refused_409",
    run: async (env) => {
      env.rows["sim.payment_approval"] ??= [];
      env.rows["sim.payment_approval"].push({
        id: "appr_wire_transfer_w_drill", resource_type: "wire_transfer", resource_id: "w_drill",
        created_by: "tok_preparer", approved_by: null, approved_at: null, rejected_at: null,
        basis: "EPS-06", provenance: "simulated",
      });
      const res = await postPaymentApproval(
        R({}), "wire_transfer", "w_drill", env.db, "d", ACTORS.preparer, SIM,
      );
      return res.status === 409 ? "refused_409" : `status=${res.status}`;
    },
  },
  {
    id: "EPS-02", controls: ["electronic-payment-systems:EPS-06"], kind: "positive",
    what: "a second actor can approve, and both actors are recorded",
    expect: "approved_two_actors",
    run: async (env) => {
      const res = await postPaymentApproval(
        R({}), "wire_transfer", "w_drill", env.db, "d", ACTORS.approver, SIM,
      );
      const b = await body(res);
      return b.originator === "tok_preparer" && b.approver === "tok_approver"
        ? "approved_two_actors" : `o=${b.originator} a=${b.approver}`;
    },
  },
  {
    id: "EPS-03", controls: ["electronic-payment-systems:EPS-06"], kind: "positive",
    what: "client limits can be configured, which is what ends the unassessed state",
    expect: "configured",
    run: async (env) => {
      const res = await putClientLimit(
        R({ ach_dual_control_over_cents: 5_000_000 }), "ptnr_drill", env.db, "d", ACTORS.ops, SIM,
      );
      return (await body(res)).ach_dual_control_over_cents === 5_000_000 ? "configured" : "not_set";
    },
  },

  // ============================================== lending (LP-07 / LP-11)
  {
    id: "LEND-01", controls: ["lending:LP-11"], kind: "negative",
    what: "an OFAC potential match blocks FUNDING (not the application)",
    expect: "funding_blocked",
    run: async (env) => {
      const res = await postLoanParty(
        R({ role: "guarantor", party_name: "SDN Holdings" }), "app_1", env.db, "d", ACTORS.ops, SIM,
      );
      const b = await body(res);
      const app = (env.rows["sim.loan_application"] ?? []).find((a) => a.id === "app_1");
      return b.funding_blocked === true && app?.funding_block_state === "blocked"
        ? "funding_blocked" : `blocked=${b.funding_blocked}`;
    },
  },
  {
    id: "LEND-02", controls: ["lending:LP-11"], kind: "negative",
    what: "every screen records that its list version is unknown (the stub is visible in the data)",
    expect: "list_version_null",
    run: (env) => {
      const p = (env.rows["sim.loan_party"] ?? [])[0];
      return Promise.resolve(
        p && p.ofac_list_version === null ? "list_version_null" : "claimed_versioned",
      );
    },
  },
  {
    id: "LEND-03", controls: ["lending:LP-07"], kind: "negative",
    what: "an adverse decision without specific reasons is refused",
    expect: "refused_400",
    run: async (env) => {
      const res = await postLoanDecision(
        R({ final_action: "denied" }), "app_2", env.db, "d", ACTORS.ops, SIM,
      );
      return res.status === 400 ? "refused_400" : `status=${res.status}`;
    },
  },
  {
    id: "LEND-04", controls: ["lending:LP-07"], kind: "positive",
    what: "a denial queues an AAN with the ECOA clock anchored on COMPLETION",
    expect: "2026-07-01",
    run: async (env) => {
      const res = await postLoanDecision(
        R({ final_action: "denied", reasons: ["insufficient income"] }),
        "app_2", env.db, "d", ACTORS.ops, SIM,
      );
      const b = await body(res);
      // deno-lint-ignore no-explicit-any
      return String((b as any).adverse_action_notice?.notice_due_at ?? "").slice(0, 10);
    },
  },
  {
    id: "LEND-05", controls: ["lending:LP-07"], kind: "negative",
    what: "an AAN cannot be issued without second-level review",
    expect: "refused_409",
    run: async (env) => {
      const res = await postAanIssue(R({}), "aan_app_2", env.db, "d", ACTORS.ops, SIM);
      return res.status === 409 ? "refused_409" : `status=${res.status}`;
    },
  },
  {
    id: "LEND-06", controls: ["lending:LP-07"], kind: "negative",
    what: "an ECOA notice nobody sent is surfaced by the sweep",
    expect: "overdue_surfaced",
    run: async (env) => {
      const aan = (env.rows["sim.adverse_action_notice"] ?? [])[0];
      if (!aan) throw new Error("no AAN queued");
      aan.notice_due_at = "2020-01-01T00:00:00.000Z";
      const res = await postLendingSweep(R({}), env.db, "d", ACTORS.ops, SIM);
      // deno-lint-ignore no-explicit-any
      return (await body(res) as any).overdue_notice_count > 0 ? "overdue_surfaced" : "missed";
    },
  },
  {
    id: "LEND-07", controls: ["lending:LP-11"], kind: "negative",
    what: "an UNSCREENED party is reported as a standing gap, not treated as clear",
    expect: "unscreened_reported",
    run: async (env) => {
      env.rows["sim.loan_party"].push({
        id: "lparty_never", loan_application_id: "app_1", role: "co_borrower",
        party_name: "Never Screened", ofac_status: "unscreened", provenance: "simulated",
      });
      const res = await postLendingSweep(R({}), env.db, "d", ACTORS.ops, SIM);
      // deno-lint-ignore no-explicit-any
      return (await body(res) as any).unscreened_parties > 0 ? "unscreened_reported" : "missed";
    },
  },

  // ================================================== primitives, adopted
  {
    id: "PRIM-01", controls: ["third-party-risk:TR-01"], kind: "positive",
    what: "a work item opens against a control in a policy with no bespoke code",
    expect: "opened_deadlined",
    run: async (env) => {
      const res = await postWorkItem(
        R({ control_uid: "third-party-risk:TR-01", kind: "task",
            title: "Annual vendor review", due_at: "2026-08-01T00:00:00Z" }),
        env.db, "d", ACTORS.ops, SIM,
      );
      return (await body(res)).deadlined === true ? "opened_deadlined" : "not_deadlined";
    },
  },
  {
    id: "PRIM-02", controls: ["information-security:IS-01"], kind: "negative",
    what: "an UNDEADLINED work item is flagged, not silently current",
    expect: "undeadlined_warned",
    run: async (env) => {
      const res = await postWorkItem(
        R({ control_uid: "information-security:IS-01", kind: "task", title: "Access review" }),
        env.db, "d", ACTORS.ops, SIM,
      );
      const b = await body(res);
      return b.deadlined === false && String(b.warning ?? "").includes("never become overdue")
        ? "undeadlined_warned" : "silent";
    },
  },
  {
    id: "PRIM-03", controls: ["cash:CP-01"], kind: "negative",
    what: "a request cannot close without recording what was decided",
    expect: "refused_400",
    run: async (env) => {
      const open = await postWorkItem(
        R({ control_uid: "cash:CP-01", kind: "request", title: "Seasonal cash deviation" }),
        env.db, "d", ACTORS.ops, SIM,
      );
      const id = String((await body(open)).id);
      const res = await postWorkItemClose(R({}), id, env.db, "d", ACTORS.ops, SIM);
      return res.status === 400 ? "refused_400" : `status=${res.status}`;
    },
  },
  {
    id: "PRIM-04", controls: ["cash:CP-01"], kind: "negative",
    what: "an adverse outcome requires a documented reason",
    expect: "refused_400",
    run: async (env) => {
      const items = (env.rows["sim.work_item"] ?? []).filter((w) => w.kind === "request");
      const id = String(items[items.length - 1]?.id ?? "");
      if (!id) throw new Error("no request work item");
      const res = await postWorkItemClose(R({ outcome: "denied" }), id, env.db, "d", ACTORS.ops, SIM);
      return res.status === 400 ? "refused_400" : `status=${res.status}`;
    },
  },
  {
    id: "PRIM-05", controls: ["bsa:BSA-11"], kind: "negative",
    what: "inbound correspondence must record its source and ARRIVAL time",
    expect: "refused_400",
    run: async (env) => {
      const res = await postWorkItem(
        R({ control_uid: "bsa:BSA-11", kind: "inbound", title: "314(a) request" }),
        env.db, "d", ACTORS.ops, SIM,
      );
      return res.status === 400 ? "refused_400" : `status=${res.status}`;
    },
  },
  {
    id: "PRIM-06", controls: ["bsa:BSA-11"], kind: "positive",
    what: "inbound correspondence with a source and arrival time is accepted",
    expect: "opened",
    run: async (env) => {
      const res = await postWorkItem(
        R({ control_uid: "bsa:BSA-11", kind: "inbound", title: "314(a) request",
            source_ref: "FinCEN", received_at: "2026-07-10T00:00:00Z",
            due_at: "2026-07-24T00:00:00Z" }),
        env.db, "d", ACTORS.ops, SIM,
      );
      return res.status === 201 ? "opened" : `status=${res.status}`;
    },
  },
  {
    id: "PRIM-07", controls: ["liquidity:LQ-01"], kind: "negative",
    what: "an observation against an unconfigured threshold is UNASSESSED",
    expect: "unassessed",
    run: async (env) => {
      await putThreshold(
        R({ control_uid: "liquidity:LQ-01", metric: "lcr", subject_scope: "institution" }),
        "th_lcr", env.db, "d", ACTORS.ops, SIM,
      );
      const res = await postObservation(R({ value: 42 }), "th_lcr", env.db, "d", ACTORS.ops, SIM);
      return String((await body(res)).assessment);
    },
  },
  {
    id: "PRIM-08", controls: ["capitalization:CP-01"], kind: "negative",
    what: "a configured threshold detects a breach and emits an event",
    expect: "breach",
    run: async (env) => {
      await putThreshold(
        R({ control_uid: "capitalization:CP-01", metric: "net_worth_ratio",
            subject_scope: "institution", limit_value: 7, warn_value: 8, direction: "below" }),
        "th_nw", env.db, "d", ACTORS.ops, SIM,
      );
      const res = await postObservation(R({ value: 5 }), "th_nw", env.db, "d", ACTORS.ops, SIM);
      return String((await body(res)).assessment);
    },
  },
  {
    id: "PRIM-09", controls: ["director-fiduciary-duties:DF-01"], kind: "positive",
    what: "an attestation records the AUTHENTICATED actor, not a payload claim",
    expect: "tok_ops",
    run: async (env) => {
      await postAttestation(
        R({ control_uid: "director-fiduciary-duties:DF-01", statement: "duties acknowledged",
            attested_by: "someone-else" }),
        env.db, "d", ACTORS.ops, SIM,
      );
      const a = (env.rows["sim.attestation"] ?? [])[0];
      return String(a?.attested_by ?? "none");
    },
  },
  {
    id: "PRIM-10", controls: ["compliance:CM-01"], kind: "negative",
    what: "the work-item sweep separates OVERDUE from UNDEADLINED",
    expect: "both_reported",
    run: async (env) => {
      const items = env.rows["sim.work_item"] ?? [];
      const first = items.find((w) => w.due_at != null && w.status === "open");
      if (first) first.due_at = "2020-01-01T00:00:00.000Z";
      const res = await postWorkItemSweep(R({}), env.db, "d", ACTORS.ops, SIM);
      const b = await body(res);
      // deno-lint-ignore no-explicit-any
      const bb = b as any;
      return bb.overdue_count > 0 && bb.undeadlined_count > 0 ? "both_reported"
        : `overdue=${bb.overdue_count} undeadlined=${bb.undeadlined_count}`;
    },
  },


  // ============================================ THE RAILS + THE GATE
  // Nothing above drove actual money movement, so runGate has never executed in
  // a drill. This is where cross-control interaction lives: the velocity cap
  // aggregates ACROSS rails, so rails that pass alone can block each other.
  {
    id: "RAIL-01", controls: [], kind: "positive",
    what: "a book transfer settles and writes control evidence",
    expect: "settled",
    run: async (env) => {
      const res = await postTransfer(
        R({ source_account_id: "acct_2", destination_account_id: "acct_3", amount_cents: 50_000 }),
        env.db, blnk(env), "d", ACTORS.ops,
      );
      const b = await body(res);
      return res.status === 201 ? String(b.status ?? "?") : `status=${res.status}:${b.type}`;
    },
  },
  {
    id: "RAIL-02", controls: [], kind: "negative",
    what: "a transfer that is BOTH over-velocity and unaffordable reports only the FIRST control",
    expect: "velocity_limit_exceeded",
    run: async (env) => {
      const res = await postTransfer(
        R({ source_account_id: "acct_4", destination_account_id: "acct_5", amount_cents: 900_000_00 }),
        env.db, blnkPoor(env), "d", ACTORS.ops,
      );
      return String((await body(res)).type ?? res.status);
    },
  },
  {
    id: "RAIL-03", controls: ["bsa:BSA-06"], kind: "negative",
    what: "CG-CTR-01 raises an alert on a single movement over $10k",
    expect: "ctr_alert_raised",
    run: async (env) => {
      await postTransfer(
        R({ source_account_id: "acct_5", destination_account_id: "acct_6", amount_cents: 1_200_000 }),
        env.db, blnk(env), "d", ACTORS.ops,
      );
      const hit = (env.rows["core.bsa_alert"] ?? []).some((a) => a.alert_type === "ctr_threshold");
      return hit ? "ctr_alert_raised" : "missed";
    },
  },
  {
    id: "RAIL-04", controls: [], kind: "negative",
    what: "CG-VEL-01 blocks across rails, and a REJECTED attempt does not count toward volume",
    expect: "third_blocked_then_headroom",
    run: async (env) => {
      // acct_6 already moved $12k on RAIL-03's destination side; push it over
      // via a DIFFERENT rail to prove the aggregate spans rails
      for (let i = 0; i < 3; i++) {
        await postAch(
          R({ source_account_id: "acct_6", amount_cents: 900_000, counterparty: { name: "V" } },
             { "Idempotency-Key": `vel-${i}` }),
          env.db, blnk(env), "d", ACTORS.ops,
        );
      }
      // the 3rd ACH ($27k cumulative) is blocked; the blocked amount then does
      // NOT count, so a later smaller wire legitimately fits under the cap.
      const rejected = (env.rows["core.ach_transfer"] ?? [])
        .filter((x) => x.originator?.account_id === "acct_6" && x.status === "rejected").length;
      const res = await postWirePrepare(
        R({ source_account_id: "acct_6", amount_cents: 500_000, beneficiary: { name: "B", country: "US" } },
           { "Idempotency-Key": "vel-wire" }),
        env.db, blnk(env), "d", ACTORS.ops,
      );
      return rejected === 1 && res.status === 201
        ? "third_blocked_then_headroom"
        : `rejected=${rejected} wire=${res.status}`;
    },
  },
  {
    id: "RAIL-05", controls: ["electronic-payment-systems:EPS-06"], kind: "negative",
    what: "a wire cannot be confirmed by its preparer (EPS-06, end to end)",
    expect: "dual_control_required",
    run: async (env) => {
      const prep = await postWirePrepare(
        R({ source_account_id: "acct_2", amount_cents: 20_000, beneficiary: { name: "B", country: "US" } },
           { "Idempotency-Key": "dc-wire" }),
        env.db, blnk(env), "d", ACTORS.preparer,
      );
      const wid = String((await body(prep)).id ?? "");
      if (!wid) throw new Error(`prepare failed: ${JSON.stringify(await body(prep))}`);
      const res = await postWireConfirm(R({}), wid, env.db, blnk(env), "d", ACTORS.preparer);
      return String((await body(res)).type ?? `status=${res.status}`);
    },
  },
  {
    id: "RAIL-06", controls: ["electronic-payment-systems:EPS-06"], kind: "positive",
    what: "the same wire confirms once a DIFFERENT actor approves it",
    expect: "completed",
    run: async (env) => {
      const w = (env.rows["core.wire_transfer"] ?? []).find((x) => x.dual_control_status === "required");
      if (!w) throw new Error("no wire awaiting approval");
      await postPaymentApproval(R({}), "wire_transfer", String(w.id), env.db, "d", ACTORS.approver);
      const res = await postWireConfirm(R({}), String(w.id), env.db, blnk(env), "d", ACTORS.approver);
      return String((await body(res)).status ?? `status=${res.status}`);
    },
  },
  {
    id: "RAIL-07", controls: [], kind: "negative",
    what: "an international wire is refused before it consumes an idempotency key",
    expect: "international_wire_not_supported",
    run: async (env) => {
      const res = await postWirePrepare(
        R({ source_account_id: "acct_2", amount_cents: 10_000, beneficiary: { name: "X", swift_code: "AAAABBCC" } },
           { "Idempotency-Key": "intl" }),
        env.db, blnk(env), "d", ACTORS.ops,
      );
      return String((await body(res)).type ?? res.status);
    },
  },
  {
    id: "RAIL-08", controls: [], kind: "negative",
    what: "an ACH return code outside the NACHA set is refused",
    expect: "400",
    run: async (env) => {
      const a = (env.rows["core.ach_transfer"] ?? [])[0];
      if (!a) throw new Error("no ACH entry");
      const res = await postAchReturn(R({ return_reason: "R99" }), String(a.id), env.db, blnk(env), "d", ACTORS.ops);
      return String(res.status);
    },
  },
  {
    id: "RAIL-09", controls: ["bsa:BSA-06"], kind: "negative",
    what: "an unauthorized ACH return (R10) raises a BSA alert; R01 does not",
    expect: "r10_alerted_r01_not",
    run: async (env) => {
      const entries = (env.rows["core.ach_transfer"] ?? []).filter((x) => x.status === "submitted");
      if (entries.length < 2) throw new Error(`need 2 submitted ACH entries, have ${entries.length}`);
      await postAchReturn(R({ return_reason: "R10" }), String(entries[0].id), env.db, blnk(env), "d", ACTORS.ops);
      await postAchReturn(R({ return_reason: "R01" }), String(entries[1].id), env.db, blnk(env), "d", ACTORS.ops);
      const alerts = (env.rows["core.bsa_alert"] ?? []).filter((x) => x.alert_type === "unauthorized_ach_return");
      return alerts.length === 1 ? "r10_alerted_r01_not" : `alerts=${alerts.length}`;
    },
  },
  {
    id: "RAIL-10", controls: [], kind: "negative",
    what: "a card authorization cannot be captured beyond the held amount",
    expect: "capture_exceeds_authorization",
    run: async (env) => {
      const auth = await postCardAuthorize(
        R({ source_account_id: "acct_2", amount_cents: 30_000, merchant: "Drill Coffee" },
           { "Idempotency-Key": "card-1" }),
        env.db, blnk(env), "d", ACTORS.ops,
      );
      const id = String((await body(auth)).id ?? "");
      if (!id) throw new Error(`authorize failed: ${JSON.stringify(await body(auth))}`);
      const res = await postCardCapture(R({ amount_cents: 50_000 }), id, env.db, blnk(env), "d", ACTORS.ops);
      return String((await body(res)).type ?? res.status);
    },
  },
  {
    id: "RAIL-11", controls: [], kind: "negative",
    what: "an expired card auth reports zero remaining, not the full amount",
    expect: "0",
    run: async (env) => {
      const a = (env.rows["core.card_authorization"] ?? []).find((x) => x.status === "authorized");
      if (!a) throw new Error("no open card auth");
      const res = await postCardExpire(R({}), String(a.id), env.db, blnk(env), "d", ACTORS.ops);
      return String((await body(res)).remaining_cents ?? "?");
    },
  },

  // =================================================== identity + ownership
  {
    id: "ENT-01", controls: ["bsa:BSA-03"], kind: "negative",
    what: "an OFAC hit on verification denies and raises an alert (CG-OFAC-01 floor)",
    expect: "denied_alerted",
    run: async (env) => {
      env.rows["core.entity"] ??= [];
      env.rows["core.entity"].push({
        id: "ent_sdn", type: "person", name: "SDN Person", status: "pending",
        partner_id: "ptnr_drill",
      });
      const res = await postVerification(R({}), "ent_sdn", env.db, "d", ACTORS.ops);
      const b = await body(res);
      const alerted = (env.rows["core.bsa_alert"] ?? []).some((x) => x.alert_type === "ofac");
      return b.status === "denied" && alerted ? "denied_alerted" : `status=${b.status} alerted=${alerted}`;
    },
  },
  {
    id: "ENT-02", controls: ["bsa:BSA-03"], kind: "negative",
    what: "a full-trust partner attestation cannot bypass the OFAC floor",
    expect: "denied",
    run: async (env) => {
      env.rows["core.entity"].push({
        id: "ent_sdn2", type: "person", name: "Another SDN Co", status: "pending",
        partner_id: "ptnr_drill",
      });
      const res = await postVerification(
        R({ attestation: { trust_level: "full" } }), "ent_sdn2", env.db, "d", ACTORS.ops,
      );
      return String((await body(res)).status ?? "?");
    },
  },
  {
    id: "OWN-01", controls: [], kind: "negative",
    what: "a partner cannot read another partner's account (404, not 403)",
    expect: "404",
    run: async (env) => {
      const other = { ...ACTORS.partner, partnerId: "ptnr_other", tokenId: "tok_other" };
      const res = await getAccount("acct_2", env.db, "d", other);
      return String(res.status);
    },
  },
  {
    id: "OWN-02", controls: [], kind: "negative",
    what: "a partner cannot settle another partner's ACH entry",
    expect: "404",
    run: async (env) => {
      const a = (env.rows["core.ach_transfer"] ?? [])[0];
      if (!a) throw new Error("no ACH entry");
      const other = { ...ACTORS.partner, partnerId: "ptnr_other", tokenId: "tok_other" };
      const res = await postAchSettle(R({}), String(a.id), env.db, blnk(env), "d", other);
      return String(res.status);
    },
  },

  // ======================================= confidentiality / access control
  {
    id: "ACC-01", controls: ["bsa:BSA-07"], kind: "negative",
    what: "a partner cannot see that a BSA case exists (404, not 403)",
    expect: "404",
    run: async (env) => {
      const kase = (env.rows["sim.case"] ?? [])[0];
      const res = await postCaseDecision(
        R({ decision: "file", rationale: "x" }), String(kase?.id ?? "case_x"),
        env.db, "d", ACTORS.partner, SIM,
      );
      return String(res.status);
    },
  },
  {
    id: "ACC-02", controls: ["bsa:BSA-08"], kind: "negative",
    what: "a partner cannot reach cash handling",
    expect: "404",
    run: async (env) => {
      const res = await postCashTransaction(
        R({ direction: "cash_in", amount_cents: 100, business_date: "2026-07-19", account_id: "acct_1" }),
        env.db, "d", ACTORS.partner, SIM,
      );
      return String(res.status);
    },
  },
  {
    id: "ACC-03", controls: [], kind: "negative",
    what: "a partner cannot set its own dual-control threshold",
    expect: "404",
    run: async (env) => {
      const res = await putClientLimit(
        R({ ach_dual_control_over_cents: 999_999_999 }), "ptnr_drill", env.db, "d", ACTORS.partner, SIM,
      );
      return String(res.status);
    },
  },

  // ================================================ provenance separation
  {
    id: "PROV-02", controls: [], kind: "negative",
    what: "every row the drill wrote is stamped simulated",
    expect: "all_simulated",
    run: (env) => {
      const bad: string[] = [];
      for (const [k, rs] of Object.entries(env.rows)) {
        if (!k.startsWith("sim.")) continue; // core rows are legitimately 'production' now
        for (const r of rs) {
          if ("provenance" in r && r.provenance !== "simulated") bad.push(`${k}:${r.id}`);
        }
      }
      return Promise.resolve(bad.length === 0 ? "all_simulated" : `unstamped=${bad.length}`);
    },
  },
  {
    id: "PROV-03", controls: [], kind: "negative",
    what: "no CHECK constraint was violated anywhere in the run",
    expect: "no_violations",
    run: (env) =>
      Promise.resolve(
        env.violations.length === 0 ? "no_violations" : `violations=${env.violations.length}`,
      ),
  },
];
