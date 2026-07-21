// api — demo BaaS API slice (Supabase Edge Function, Deno).
//
// Auth: X-Api-Key = DEMO_API_KEY (verify_jwt = false). See README.

import { blnkConfigFromEnv } from "../_shared/blnk.ts";
import {
  postAccountLock,
  postAccountTransition, getAccount, postAccount } from "./accounts.ts";
import { getTransfer, postTransfer } from "./transfers.ts";
import {
  postWireCancel,
  postWireConfirm,
  postWirePrepare,
  postWireReject,
  postWireReturn,
  postWireReturnResolve,
} from "./wires.ts";
import { getControlResults } from "./controls.ts";
import { getChangelog } from "./platform.ts";
import { postSandboxReset } from "./sandbox.ts";
import { postSimulate } from "./simulate.ts";
import { getDashboardData, getDashboardShell } from "./dashboard.ts";
import { getCase, postAlertTriage, postCaseDecision, postTimerSweep } from "./bsa.ts";
import { postDisposalSweep, postDisposeRecord, postHoldRelease, postLegalHold } from "./retention.ts";
import { getCashAggregation, postCashTransaction, postCtrFile, postCtrSweep } from "./cash.ts";
import { getPendingApprovals, postPaymentApproval, putClientLimit } from "./eps.ts";
import { getObligations, postCalendarSweep, postObligation, postObligationComplete } from "./governance.ts";
import { postAanIssue, postLendingSweep, postLoanDecision, postLoanParty } from "./lending.ts";
import {
  postAttestation,
  postObservation,
  postWorkItem,
  postWorkItemClose,
  postWorkItemSweep,
  putThreshold,
} from "./primitives.ts";
import { getEntities, getEntity, postEntity, postEntityOwner, postEntityTransition } from "./entities.ts";
import { getAccountNumbers, postAccountNumber, postNumberTransition } from "./numbers.ts";
import { postVerification } from "./kyc.ts";
import { postDeliverEvents, postEventSink } from "./events.ts";
import { postAch, postAchNoc, postAchReturn, postAchSettle } from "./ach.ts";
import { postCardAuthorize, postCardCapture, postCardExpire, postCardReverse } from "./cards.ts";
import {
  createDb,
  createRequestId,
  internalErrorResponse,
  methodNotAllowedResponse,
  misconfiguredResponse,
  notFoundResponse,
} from "./lib.ts";
import { authenticate, type EndpointScope, type PartnerContext } from "./auth.ts";
import {
  postDeathReport, postEstateClaim, postEstatePayout, postExpulsion,
  postExpulsionClose, postExpulsionHearing, postSafeModeActivate,
  postSafeModeDeactivate, postSafeModeProcessorConfirm,
} from "./member_protection.ts";
import {
  postEmployee, postEmployeeCoaching, postEmployeeSeparate, postEmployeeTraining,
} from "./hr.ts";
import {
  postConnectionScopeViolation, postPrivacyAccessRequest, postPrivacyConnection,
  postPrivacyDisclosure,
} from "./privacy.ts";
import {
  postCashCustody, postCashCustodyAttest, postCashKeyboxOpen,
} from "./cash_ops.ts";
import { postInsiderLoanReview, putInsider } from "./lending_underwriting.ts";

type RouteHandler = (
  req: Request,
  params: Record<string, string>,
  requestId: string,
  ctx: PartnerContext,
) => Promise<Response>;

/**
 * Every route declares its own scope identity (card 45). `endpoint` is the
 * stable name a token's allowlist is written against — note it carries `{id}`
 * placeholders rather than the concrete path, so scope can never be widened by
 * choosing a particular resource id.
 */
interface Route extends EndpointScope {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
  /**
   * Skip authentication entirely. Reserved for pure-chrome surfaces that
   * carry ZERO data (the dashboard shell) — anything that reads state must
   * go through authenticate. A public handler receives a sentinel ctx it
   * must not use.
   */
  public?: true;
}

// The sentinel ctx for public routes. Deliberately hostile defaults: if a
// public handler ever DOES consult it, the partner actor class hits the most
// restrictive path everywhere (404 on BSA surfaces, scoped-out on rows).
const PUBLIC_CTX = {
  tokenId: "tok_public_shell",
  tokenPrefix: "none",
  actorType: "partner",
  roles: [],
  partnerId: null,
} as unknown as PartnerContext;

function stripFunctionPrefix(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "api") parts.shift();
  return "/" + parts.join("/");
}

const routes: Route[] = [
  // ---- violation tier (MP-06/07, RS-03, PR-03/04/15, CP-05, DF-05, HR seam)
  {
    method: "POST", pattern: /^\/members\/([^/]+)\/death-report\/?$/,
    endpoint: "POST /members/{id}/death-report", tier: "write", paramNames: ["id"],
    handler: async (req, params, requestId, ctx) =>
      await postDeathReport(req, params.id, createDb(), requestId, ctx),
  },
  {
    method: "POST", pattern: /^\/members\/([^/]+)\/estate-claims\/?$/,
    endpoint: "POST /members/{id}/estate-claims", tier: "write", paramNames: ["id"],
    handler: async (req, params, requestId, ctx) =>
      await postEstateClaim(req, params.id, createDb(), requestId, ctx),
  },
  {
    method: "POST", pattern: /^\/estate-claims\/([^/]+)\/payout\/?$/,
    endpoint: "POST /estate-claims/{id}/payout", tier: "write", paramNames: ["id"],
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, params, requestId, ctx) =>
      await postEstatePayout(req, params.id, createDb(), requestId, ctx),
  },
  {
    method: "POST", pattern: /^\/members\/([^/]+)\/expulsion\/?$/,
    endpoint: "POST /members/{id}/expulsion", tier: "write", paramNames: ["id"],
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, params, requestId, ctx) =>
      await postExpulsion(req, params.id, createDb(), requestId, ctx),
  },
  {
    method: "POST", pattern: /^\/expulsions\/([^/]+)\/hearing\/?$/,
    endpoint: "POST /expulsions/{id}/hearing", tier: "write", paramNames: ["id"],
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, params, requestId, ctx) =>
      await postExpulsionHearing(req, params.id, createDb(), requestId, ctx),
  },
  {
    method: "POST", pattern: /^\/expulsions\/([^/]+)\/close\/?$/,
    endpoint: "POST /expulsions/{id}/close", tier: "write", paramNames: ["id"],
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, params, requestId, ctx) =>
      await postExpulsionClose(req, params.id, createDb(), requestId, ctx),
  },
  {
    method: "POST", pattern: /^\/resolution\/safe-mode\/?$/,
    endpoint: "POST /resolution/safe-mode", tier: "write", paramNames: [],
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, _params, requestId, ctx) =>
      await postSafeModeActivate(req, createDb(), requestId, ctx),
  },
  {
    method: "POST", pattern: /^\/resolution\/safe-mode\/([^/]+)\/processor-confirm\/?$/,
    endpoint: "POST /resolution/safe-mode/{id}/processor-confirm", tier: "write",
    paramNames: ["id"], actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, params, requestId, ctx) =>
      await postSafeModeProcessorConfirm(req, params.id, createDb(), requestId, ctx),
  },
  {
    method: "POST", pattern: /^\/resolution\/safe-mode\/([^/]+)\/deactivate\/?$/,
    endpoint: "POST /resolution/safe-mode/{id}/deactivate", tier: "write",
    paramNames: ["id"], actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, params, requestId, ctx) =>
      await postSafeModeDeactivate(req, params.id, createDb(), requestId, ctx),
  },
  {
    method: "POST", pattern: /^\/privacy\/disclosures\/?$/,
    endpoint: "POST /privacy/disclosures", tier: "write", paramNames: [],
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, _params, requestId, ctx) =>
      await postPrivacyDisclosure(req, createDb(), requestId, ctx),
  },
  {
    method: "POST", pattern: /^\/privacy\/access-requests\/?$/,
    endpoint: "POST /privacy/access-requests", tier: "write", paramNames: [],
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, _params, requestId, ctx) =>
      await postPrivacyAccessRequest(req, createDb(), requestId, ctx),
  },
  {
    method: "POST", pattern: /^\/privacy\/connections\/?$/,
    endpoint: "POST /privacy/connections", tier: "write", paramNames: [],
    handler: async (req, _params, requestId, ctx) =>
      await postPrivacyConnection(req, createDb(), requestId, ctx),
  },
  {
    method: "POST", pattern: /^\/privacy\/connections\/([^/]+)\/scope-violation\/?$/,
    endpoint: "POST /privacy/connections/{id}/scope-violation", tier: "write",
    paramNames: ["id"], actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, params, requestId, ctx) =>
      await postConnectionScopeViolation(req, params.id, createDb(), requestId, ctx),
  },
  {
    method: "POST", pattern: /^\/hr\/employees\/?$/,
    endpoint: "POST /hr/employees", tier: "write", paramNames: [],
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, _params, requestId, ctx) =>
      await postEmployee(req, createDb(), requestId, ctx),
  },
  {
    method: "POST", pattern: /^\/hr\/employees\/([^/]+)\/separate\/?$/,
    endpoint: "POST /hr/employees/{id}/separate", tier: "write", paramNames: ["id"],
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, params, requestId, ctx) =>
      await postEmployeeSeparate(req, params.id, createDb(), requestId, ctx),
  },
  {
    method: "POST", pattern: /^\/hr\/employees\/([^/]+)\/coaching\/?$/,
    endpoint: "POST /hr/employees/{id}/coaching", tier: "write", paramNames: ["id"],
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, params, requestId, ctx) =>
      await postEmployeeCoaching(req, params.id, createDb(), requestId, ctx),
  },
  {
    method: "POST", pattern: /^\/hr\/employees\/([^/]+)\/training\/?$/,
    endpoint: "POST /hr/employees/{id}/training", tier: "write", paramNames: ["id"],
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, params, requestId, ctx) =>
      await postEmployeeTraining(req, params.id, createDb(), requestId, ctx),
  },
  {
    method: "POST", pattern: /^\/cash-ops\/custody\/?$/,
    endpoint: "POST /cash-ops/custody", tier: "write", paramNames: [],
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, _params, requestId, ctx) =>
      await postCashCustody(req, createDb(), requestId, ctx),
  },
  {
    method: "POST", pattern: /^\/cash-ops\/custody\/([^/]+)\/attest\/?$/,
    endpoint: "POST /cash-ops/custody/{id}/attest", tier: "write", paramNames: ["id"],
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, params, requestId, ctx) =>
      await postCashCustodyAttest(req, params.id, createDb(), requestId, ctx),
  },
  {
    method: "POST", pattern: /^\/cash-ops\/custody\/([^/]+)\/keybox-open\/?$/,
    endpoint: "POST /cash-ops/custody/{id}/keybox-open", tier: "write", paramNames: ["id"],
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, params, requestId, ctx) =>
      await postCashKeyboxOpen(req, params.id, createDb(), requestId, ctx),
  },
  {
    method: "PUT", pattern: /^\/lending\/insiders\/([^/]+)\/?$/,
    endpoint: "PUT /lending/insiders/{id}", tier: "write", paramNames: ["id"],
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, params, requestId, ctx) =>
      await putInsider(req, params.id, createDb(), requestId, ctx),
  },
  {
    method: "POST", pattern: /^\/lending\/applications\/([^/]+)\/insider-review\/?$/,
    endpoint: "POST /lending/applications/{id}/insider-review", tier: "write",
    paramNames: ["id"], actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, params, requestId, ctx) =>
      await postInsiderLoanReview(req, params.id, createDb(), requestId, ctx),
  },
  {
    method: "POST",
    pattern: /^\/accounts\/?$/,
    endpoint: "POST /accounts",
    tier: "write",
    paramNames: [],
    handler: async (req, _params, requestId, ctx) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postAccount(req, db, cfg, requestId, ctx);
    },
  },
  {
    method: "GET",
    pattern: /^\/accounts\/([^/]+)\/?$/,
    endpoint: "GET /accounts/{id}",
    tier: "read",
    paramNames: ["id"],
    handler: async (_req, params, requestId, ctx) => {
      const db = createDb();
      return await getAccount(params.id, db, requestId, ctx);
    },
  },
  {
    method: "POST",
    pattern: /^\/transfers\/?$/,
    endpoint: "POST /transfers",
    tier: "write",
    paramNames: [],
    handler: async (req, _params, requestId, ctx) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postTransfer(req, db, cfg, requestId, ctx);
    },
  },
  {
    method: "POST",
    pattern: /^\/events\/deliver\/?$/,
    endpoint: "POST /events/deliver",
    tier: "write",
    actors: ["pynthia_ops"],
    paramNames: [],
    handler: async (req, _params, requestId, _ctx) => await postDeliverEvents(req, createDb(), requestId),
  },
  {
    method: "POST",
    pattern: /^\/sandbox\/event-sink\/?$/,
    endpoint: "POST /sandbox/event-sink",
    tier: "write",
    actors: ["pynthia_ops"],
    paramNames: [],
    handler: (_req, _params, requestId, _ctx) => Promise.resolve(postEventSink(requestId)),
  },
  {
    method: "POST",
    pattern: /^\/sandbox\/reset\/?$/,
    endpoint: "POST /sandbox/reset",
    tier: "write",
    actors: ["pynthia_ops"],
    paramNames: [],
    handler: async (req, _params, requestId, _ctx) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postSandboxReset(req, db, cfg, requestId);
    },
  },
  // Cards 09 / 35 / 38 / 44: /sandbox/simulate/* — the spec's simulation
  // surface. One catch-all hands the remaining path to simulate.ts, which owns
  // the alias table mapping each simulated lifecycle step onto the REAL writer
  // (so the gate and its control_result evidence run exactly as in production)
  // and returns the typed 501 for anything not yet simulated.
  {
    method: "POST",
    pattern: /^\/sandbox\/simulate(\/.*)?$/,
    endpoint: "POST /sandbox/simulate",
    tier: "write",
    paramNames: ["rest"],
    handler: async (req, params, requestId, ctx) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postSimulate(req, params.rest ?? "/", db, cfg, requestId, ctx);
    },
  },
  {
    method: "POST",
    pattern: /^\/entities\/?$/,
    endpoint: "POST /entities",
    tier: "write",
    paramNames: [],
    handler: async (req, _params, requestId, ctx) => await postEntity(req, createDb(), requestId, ctx),
  },
  {
    method: "GET",
    pattern: /^\/entities\/?$/,
    endpoint: "GET /entities",
    tier: "read",
    paramNames: [],
    handler: async (req, _params, requestId, ctx) => await getEntities(req, createDb(), requestId, ctx),
  },
  {
    method: "POST",
    pattern: /^\/entities\/([^/]+)\/verifications\/?$/,
    endpoint: "POST /entities/{id}/verifications",
    tier: "write",
    paramNames: ["id"],
    handler: async (req, params, requestId, ctx) => await postVerification(req, params.id, createDb(), requestId, ctx),
  },
  {
    method: "POST",
    pattern: /^\/entities\/([^/]+)\/transition\/?$/,
    endpoint: "POST /entities/{id}/transition",
    tier: "write",
    paramNames: ["id"],
    handler: async (req, params, requestId, ctx) => await postEntityTransition(req, params.id, createDb(), requestId, ctx),
  },
  {
    method: "POST",
    pattern: /^\/entities\/([^/]+)\/owners\/?$/,
    endpoint: "POST /entities/{id}/owners",
    tier: "write",
    paramNames: ["id"],
    handler: async (req, params, requestId, ctx) => await postEntityOwner(req, params.id, createDb(), requestId, ctx),
  },
  {
    method: "GET",
    pattern: /^\/entities\/([^/]+)\/?$/,
    endpoint: "GET /entities/{id}",
    tier: "read",
    paramNames: ["id"],
    handler: async (_req, params, requestId, ctx) => await getEntity(params.id, createDb(), requestId, ctx),
  },
  {
    method: "POST",
    pattern: /^\/accounts\/([^/]+)\/numbers\/?$/,
    endpoint: "POST /accounts/{id}/numbers",
    tier: "write",
    paramNames: ["id"],
    handler: async (req, params, requestId, ctx) => await postAccountNumber(req, params.id, createDb(), requestId, ctx),
  },
  {
    method: "GET",
    pattern: /^\/accounts\/([^/]+)\/numbers\/?$/,
    endpoint: "GET /accounts/{id}/numbers",
    tier: "read",
    paramNames: ["id"],
    handler: async (_req, params, requestId, ctx) => await getAccountNumbers(params.id, createDb(), requestId, ctx),
  },
  {
    method: "POST",
    pattern: /^\/accounts\/([^/]+)\/lock\/?$/,
    endpoint: "POST /accounts/{id}/lock",
    tier: "write",
    paramNames: ["id"],
    handler: async (req, params, requestId, ctx) => await postAccountLock(req, params.id, createDb(), requestId, ctx),
  },
  {
    method: "POST",
    pattern: /^\/accounts\/([^/]+)\/transition\/?$/,
    endpoint: "POST /accounts/{id}/transition",
    tier: "write",
    paramNames: ["id"],
    handler: async (req, params, requestId, ctx) => await postAccountTransition(req, params.id, createDb(), requestId, ctx),
  },
  {
    method: "POST",
    pattern: /^\/account-numbers\/([^/]+)\/transition\/?$/,
    endpoint: "POST /account-numbers/{id}/transition",
    tier: "write",
    paramNames: ["id"],
    handler: async (req, params, requestId, ctx) => await postNumberTransition(req, params.id, createDb(), requestId, ctx),
  },
  {
    method: "GET",
    pattern: /^\/changelog\/?$/,
    endpoint: "GET /changelog",
    tier: "read",
    paramNames: [],
    handler: (_req, _params, requestId, _ctx) => Promise.resolve(getChangelog(requestId)),
  },
  // The recurring control primitives (BLUEPRINT §5e). Generic by design: these
  // serve controls across all 26 policies rather than any one domain.
  {
    method: "POST", pattern: /^\/primitives\/work-items\/?$/, paramNames: [],
    endpoint: "POST /primitives/work-items", tier: "write",
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, _p, rid, ctx) => await postWorkItem(req, createDb(), rid, ctx),
  },
  {
    method: "POST", pattern: /^\/primitives\/work-items\/sweep\/?$/, paramNames: [],
    endpoint: "POST /primitives/work-items/sweep", tier: "write",
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, _p, rid, ctx) => await postWorkItemSweep(req, createDb(), rid, ctx),
  },
  {
    method: "POST", pattern: /^\/primitives\/work-items\/([^/]+)\/close\/?$/, paramNames: ["id"],
    endpoint: "POST /primitives/work-items/{id}/close", tier: "write",
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, p, rid, ctx) => await postWorkItemClose(req, p.id, createDb(), rid, ctx),
  },
  {
    method: "PUT", pattern: /^\/primitives\/thresholds\/([^/]+)\/?$/, paramNames: ["id"],
    endpoint: "PUT /primitives/thresholds/{id}", tier: "write",
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, p, rid, ctx) => await putThreshold(req, p.id, createDb(), rid, ctx),
  },
  {
    method: "POST", pattern: /^\/primitives\/thresholds\/([^/]+)\/observe\/?$/, paramNames: ["id"],
    endpoint: "POST /primitives/thresholds/{id}/observe", tier: "write",
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, p, rid, ctx) => await postObservation(req, p.id, createDb(), rid, ctx),
  },
  {
    method: "POST", pattern: /^\/primitives\/attestations\/?$/, paramNames: [],
    endpoint: "POST /primitives/attestations", tier: "write",
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, _p, rid, ctx) => await postAttestation(req, createDb(), rid, ctx),
  },
  // Lending origination spine (LP-03 / LP-07 / LP-11). Partners MAY originate;
  // the four-eyes check on AAN issuance is what they cannot bypass.
  {
    method: "POST",
    pattern: /^\/lending\/applications\/([^/]+)\/parties\/?$/,
    paramNames: ["id"],
    endpoint: "POST /lending/applications/{id}/parties",
    tier: "write",
    handler: async (req, params, requestId, ctx) =>
      await postLoanParty(req, params.id, createDb(), requestId, ctx),
  },
  {
    method: "POST",
    pattern: /^\/lending\/applications\/([^/]+)\/decision\/?$/,
    paramNames: ["id"],
    endpoint: "POST /lending/applications/{id}/decision",
    tier: "write",
    handler: async (req, params, requestId, ctx) =>
      await postLoanDecision(req, params.id, createDb(), requestId, ctx),
  },
  {
    method: "POST",
    pattern: /^\/lending\/aan\/([^/]+)\/issue\/?$/,
    paramNames: ["id"],
    endpoint: "POST /lending/aan/{id}/issue",
    tier: "write",
    handler: async (req, params, requestId, ctx) =>
      await postAanIssue(req, params.id, createDb(), requestId, ctx),
  },
  {
    method: "POST",
    pattern: /^\/lending\/sweep\/?$/,
    paramNames: [],
    endpoint: "POST /lending/sweep",
    tier: "write",
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, _params, requestId, ctx) =>
      await postLendingSweep(req, createDb(), requestId, ctx),
  },
  // Governance calendar (Tier D). 83 of the catalogue's triggers are
  // time-based and identical in shape, so one register serves all of them.
  {
    method: "POST",
    pattern: /^\/governance\/obligations\/?$/,
    paramNames: [],
    endpoint: "POST /governance/obligations",
    tier: "write",
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, _params, requestId, ctx) =>
      await postObligation(req, createDb(), requestId, ctx),
  },
  {
    method: "GET",
    pattern: /^\/governance\/obligations\/?$/,
    paramNames: [],
    endpoint: "GET /governance/obligations",
    tier: "read",
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, _params, requestId, ctx) =>
      await getObligations(req, createDb(), requestId, ctx),
  },
  {
    method: "POST",
    pattern: /^\/governance\/calendar\/sweep\/?$/,
    paramNames: [],
    endpoint: "POST /governance/calendar/sweep",
    tier: "write",
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, _params, requestId, ctx) =>
      await postCalendarSweep(req, createDb(), requestId, ctx),
  },
  {
    method: "POST",
    pattern: /^\/governance\/obligations\/([^/]+)\/complete\/?$/,
    paramNames: ["id"],
    endpoint: "POST /governance/obligations/{id}/complete",
    tier: "write",
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, params, requestId, ctx) =>
      await postObligationComplete(req, params.id, createDb(), requestId, ctx),
  },
  // EPS-06 dual control. The approve routes are the second pair of eyes; the
  // four-eyes rule is enforced by ck_payment_approval_four_eyes underneath.
  {
    method: "POST",
    pattern: /^\/payments\/wire\/([^/]+)\/approve\/?$/,
    paramNames: ["id"],
    endpoint: "POST /payments/wire/{id}/approve",
    tier: "write",
    handler: async (req, params, requestId, ctx) =>
      await postPaymentApproval(req, "wire_transfer", params.id, createDb(), requestId, ctx),
  },
  {
    method: "POST",
    pattern: /^\/payments\/ach\/([^/]+)\/approve\/?$/,
    paramNames: ["id"],
    endpoint: "POST /payments/ach/{id}/approve",
    tier: "write",
    handler: async (req, params, requestId, ctx) =>
      await postPaymentApproval(req, "ach_transfer", params.id, createDb(), requestId, ctx),
  },
  {
    method: "GET",
    pattern: /^\/eps\/pending-approvals\/?$/,
    paramNames: [],
    endpoint: "GET /eps/pending-approvals",
    tier: "read",
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, _params, requestId, ctx) =>
      await getPendingApprovals(req, createDb(), requestId, ctx),
  },
  {
    method: "PUT",
    pattern: /^\/eps\/client-limits\/([^/]+)\/?$/,
    paramNames: ["id"],
    endpoint: "PUT /eps/client-limits/{id}",
    tier: "write",
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, params, requestId, ctx) =>
      await putClientLimit(req, params.id, createDb(), requestId, ctx),
  },
  // Cash + CTR (BSA-08). Cash handling is the credit union's own operation;
  // partners get 404, as with case management and retention.
  {
    method: "POST",
    pattern: /^\/cash\/transactions\/?$/,
    paramNames: [],
    endpoint: "POST /cash/transactions",
    tier: "write",
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, _params, requestId, ctx) =>
      await postCashTransaction(req, createDb(), requestId, ctx),
  },
  {
    method: "GET",
    pattern: /^\/cash\/aggregation\/?$/,
    paramNames: [],
    endpoint: "GET /cash/aggregation",
    tier: "read",
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, _params, requestId, ctx) =>
      await getCashAggregation(req, createDb(), requestId, ctx),
  },
  {
    method: "POST",
    pattern: /^\/cash\/ctr\/sweep\/?$/,
    paramNames: [],
    endpoint: "POST /cash/ctr/sweep",
    tier: "write",
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, _params, requestId, ctx) =>
      await postCtrSweep(req, createDb(), requestId, ctx),
  },
  {
    method: "POST",
    pattern: /^\/cash\/ctr\/([^/]+)\/file\/?$/,
    paramNames: ["id"],
    endpoint: "POST /cash/ctr/{id}/file",
    tier: "write",
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, params, requestId, ctx) =>
      await postCtrFile(req, params.id, createDb(), requestId, ctx),
  },
  // Record retention (BSA-21 / SC-02). Compliance + Records Management own
  // this; partners get 404 for the same reason as case management.
  {
    method: "POST",
    pattern: /^\/retention\/holds\/?$/,
    paramNames: [],
    endpoint: "POST /retention/holds",
    tier: "write",
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, _params, requestId, ctx) =>
      await postLegalHold(req, createDb(), requestId, ctx),
  },
  {
    method: "POST",
    pattern: /^\/retention\/holds\/([^/]+)\/release\/?$/,
    paramNames: ["id"],
    endpoint: "POST /retention/holds/{id}/release",
    tier: "write",
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, params, requestId, ctx) =>
      await postHoldRelease(req, params.id, createDb(), requestId, ctx),
  },
  {
    method: "POST",
    pattern: /^\/retention\/disposal\/sweep\/?$/,
    paramNames: [],
    endpoint: "POST /retention/disposal/sweep",
    tier: "write",
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, _params, requestId, ctx) =>
      await postDisposalSweep(req, createDb(), requestId, ctx),
  },
  {
    method: "POST",
    pattern: /^\/retention\/records\/([^/]+)\/dispose\/?$/,
    paramNames: ["id"],
    endpoint: "POST /retention/records/{id}/dispose",
    tier: "write",
    actors: ["cu_admin", "pynthia_ops"],
    handler: async (req, params, requestId, ctx) =>
      await postDisposeRecord(req, params.id, createDb(), requestId, ctx),
  },
  // BSA case management (BSA-06/07). Closed to partner actors — but NOT via
  // the route-level `actors` gate: that gate answers 403, and under BSA-07 the
  // existence of a case is itself confidential, so a partner must get 404,
  // never 403. requireBsa inside each handler produces exactly that (partner →
  // 404, wrong role → 403), and a route-level gate here would answer first and
  // leak the surface. Live e2e caught this: the gate made the designed 404
  // unreachable.
  {
    method: "POST",
    pattern: /^\/bsa\/alerts\/([^/]+)\/triage\/?$/,
    paramNames: ["id"],
    endpoint: "POST /bsa/alerts/{id}/triage",
    tier: "write",
    handler: async (req, params, requestId, ctx) =>
      await postAlertTriage(req, params.id, createDb(), requestId, ctx),
  },
  {
    method: "POST",
    pattern: /^\/bsa\/cases\/([^/]+)\/decision\/?$/,
    paramNames: ["id"],
    endpoint: "POST /bsa/cases/{id}/decision",
    tier: "write",
    handler: async (req, params, requestId, ctx) =>
      await postCaseDecision(req, params.id, createDb(), requestId, ctx),
  },
  {
    method: "POST",
    pattern: /^\/bsa\/timers\/sweep\/?$/,
    paramNames: [],
    endpoint: "POST /bsa/timers/sweep",
    tier: "write",
    handler: async (req, _params, requestId, ctx) =>
      await postTimerSweep(req, createDb(), requestId, ctx),
  },
  {
    method: "GET",
    pattern: /^\/bsa\/cases\/([^/]+)\/?$/,
    paramNames: ["id"],
    endpoint: "GET /bsa/cases/{id}",
    tier: "read",
    handler: async (_req, params, requestId, ctx) =>
      await getCase(params.id, createDb(), requestId, ctx),
  },
  // Compliance dashboard (demo surface). The shell is public because it is
  // pure chrome — zero data, token entered client-side and sent as a header
  // to the /data route, which authenticates like every other endpoint.
  {
    method: "GET",
    pattern: /^\/compliance\/dashboard\/?$/,
    paramNames: [],
    endpoint: "GET /compliance/dashboard",
    tier: "read",
    public: true,
    handler: async (_req, _params, requestId, _ctx) =>
      await Promise.resolve(getDashboardShell(requestId)),
  },
  {
    method: "GET",
    pattern: /^\/compliance\/dashboard\/data\/?$/,
    paramNames: [],
    endpoint: "GET /compliance/dashboard/data",
    tier: "read",
    // DEMO POSTURE: public — the sandbox dashboard must load with zero
    // credentials. Re-lock for production by removing this flag (and see
    // dashboard.ts for the partner 404 to restore).
    public: true,
    handler: async (req, _params, requestId, ctx) =>
      await getDashboardData(req, createDb(), requestId, ctx),
  },
  {
    method: "GET",
    pattern: /^\/control-results\/?$/,
    endpoint: "GET /control-results",
    tier: "read",
    // NOT partner-scoped, deliberately. control_result is the INSTANCE's
    // compliance record: CTR aggregation, structuring detection and BSA
    // reporting are obligations of the chartered credit union across every
    // fintech it hosts. Narrowing this per partner would fragment exactly the
    // view the controls exist to produce. See ownership.ts
    // INSTANCE_SCOPED_TABLES.
    paramNames: [],
    handler: async (req, _params, requestId, _ctx) => {
      const db = createDb();
      return await getControlResults(req, db, requestId);
    },
  },
  {
    method: "GET",
    pattern: /^\/transfers\/([^/]+)\/?$/,
    endpoint: "GET /transfers/{id}",
    tier: "read",
    paramNames: ["id"],
    handler: async (_req, params, requestId, ctx) => {
      const db = createDb();
      return await getTransfer(params.id, db, requestId, ctx);
    },
  },
  {
    method: "POST",
    pattern: /^\/payments\/ach\/?$/,
    endpoint: "POST /payments/ach",
    tier: "write",
    paramNames: [],
    handler: async (req, _params, requestId, ctx) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postAch(req, db, cfg, requestId, ctx);
    },
  },
  {
    method: "POST",
    pattern: /^\/payments\/ach\/([^/]+)\/settle\/?$/,
    endpoint: "POST /payments/ach/{id}/settle",
    tier: "write",
    paramNames: ["id"],
    handler: async (req, params, requestId, ctx) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postAchSettle(req, params.id, db, cfg, requestId, ctx);
    },
  },
  {
    method: "POST",
    pattern: /^\/payments\/ach\/([^/]+)\/return\/?$/,
    endpoint: "POST /payments/ach/{id}/return",
    tier: "write",
    paramNames: ["id"],
    handler: async (req, params, requestId, ctx) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postAchReturn(req, params.id, db, cfg, requestId, ctx);
    },
  },
  {
    method: "POST",
    pattern: /^\/payments\/ach\/([^/]+)\/noc\/?$/,
    endpoint: "POST /payments/ach/{id}/noc",
    tier: "write",
    paramNames: ["id"],
    handler: async (req, params, requestId, ctx) => {
      // no Blnk config: a notification of change moves no money
      const db = createDb();
      return await postAchNoc(req, params.id, db, requestId, ctx);
    },
  },
  {
    method: "POST",
    pattern: /^\/payments\/card\/authorize\/?$/,
    endpoint: "POST /payments/card/authorize",
    tier: "realtime",
    paramNames: [],
    handler: async (req, _params, requestId, ctx) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postCardAuthorize(req, db, cfg, requestId, ctx);
    },
  },
  {
    method: "POST",
    pattern: /^\/payments\/card\/([^/]+)\/capture\/?$/,
    endpoint: "POST /payments/card/{id}/capture",
    tier: "realtime",
    paramNames: ["id"],
    handler: async (req, params, requestId, ctx) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postCardCapture(req, params.id, db, cfg, requestId, ctx);
    },
  },
  {
    method: "POST",
    pattern: /^\/payments\/card\/([^/]+)\/reverse\/?$/,
    endpoint: "POST /payments/card/{id}/reverse",
    tier: "realtime",
    paramNames: ["id"],
    handler: async (req, params, requestId, ctx) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postCardReverse(req, params.id, db, cfg, requestId, ctx);
    },
  },
  {
    method: "POST",
    pattern: /^\/payments\/card\/([^/]+)\/expire\/?$/,
    endpoint: "POST /payments/card/{id}/expire",
    tier: "realtime",
    paramNames: ["id"],
    handler: async (req, params, requestId, ctx) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postCardExpire(req, params.id, db, cfg, requestId, ctx);
    },
  },
  {
    method: "POST",
    pattern: /^\/payments\/wire\/prepare\/?$/,
    endpoint: "POST /payments/wire/prepare",
    tier: "write",
    paramNames: [],
    handler: async (req, _params, requestId, ctx) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postWirePrepare(req, db, cfg, requestId, ctx);
    },
  },
  {
    method: "POST",
    pattern: /^\/payments\/wire\/([^/]+)\/confirm\/?$/,
    endpoint: "POST /payments/wire/{id}/confirm",
    tier: "write",
    paramNames: ["id"],
    handler: async (req, params, requestId, ctx) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postWireConfirm(req, params.id, db, cfg, requestId, ctx);
    },
  },
  {
    method: "POST",
    pattern: /^\/payments\/wire\/([^/]+)\/cancel\/?$/,
    endpoint: "POST /payments/wire/{id}/cancel",
    tier: "write",
    paramNames: ["id"],
    handler: async (req, params, requestId, ctx) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postWireCancel(req, params.id, db, cfg, requestId, ctx);
    },
  },
  {
    method: "POST",
    pattern: /^\/payments\/wire\/([^/]+)\/reject\/?$/,
    endpoint: "POST /payments/wire/{id}/reject",
    tier: "write",
    paramNames: ["id"],
    handler: async (req, params, requestId, ctx) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postWireReject(req, params.id, db, cfg, requestId, ctx);
    },
  },
  // return/resolve must precede the bare return pattern nowhere — distinct
  // suffixes, order-independent; both listed explicitly for clarity.
  {
    method: "POST",
    pattern: /^\/payments\/wire\/([^/]+)\/return\/resolve\/?$/,
    endpoint: "POST /payments/wire/{id}/return/resolve",
    tier: "write",
    paramNames: ["id"],
    handler: async (req, params, requestId, ctx) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postWireReturnResolve(req, params.id, db, cfg, requestId, ctx);
    },
  },
  {
    method: "POST",
    pattern: /^\/payments\/wire\/([^/]+)\/return\/?$/,
    endpoint: "POST /payments/wire/{id}/return",
    tier: "write",
    paramNames: ["id"],
    handler: async (req, params, requestId, ctx) => {
      const db = createDb();
      const cfg = blnkConfigFromEnv();
      return await postWireReturn(req, params.id, db, cfg, requestId, ctx);
    },
  },
];

function matchRoute(path: string, method: string): { route: Route; params: Record<string, string> } | "not_found" | "method_not_allowed" {
  // Keep scanning past a path match with the wrong method: one pattern can
  // legitimately serve several methods from separate routes (POST /entities
  // creates, GET /entities lists). Breaking on the first path match made every
  // later same-pattern route unreachable — surfaced as a 405 on GET /entities.
  let sawPathMatch = false;
  for (const route of routes) {
    const m = path.match(route.pattern);
    if (!m) continue;
    sawPathMatch = true;
    if (route.method !== method) continue;
    const params: Record<string, string> = {};
    route.paramNames.forEach((name, i) => {
      params[name] = m[i + 1];
    });
    return { route, params };
  }
  return sawPathMatch ? "method_not_allowed" : "not_found";
}

Deno.serve(async (req: Request): Promise<Response> => {
  const requestId = createRequestId();

  // The instance this process IS (card 51). Read from the environment, never
  // from the request: a caller-supplied instance id would let any token claim
  // to belong here. Absent config fails closed — an instance that does not
  // know its own identity cannot decide whether a token is foreign.
  const instanceId = Deno.env.get("INSTANCE_ID");
  if (!instanceId) {
    return misconfiguredResponse(requestId, "server misconfigured: INSTANCE_ID unset");
  }

  const url = new URL(req.url);
  const path = stripFunctionPrefix(url.pathname);

  // The dashboard shell is hosted cross-origin (GitHub Pages — the gateway
  // rewrites HTML content-types on shared domains), so its data route speaks
  // CORS. This must run BEFORE route matching: an OPTIONS preflight matches
  // no GET route and would 405. Wildcard origin is safe here: CORS is not
  // the protection — the X-Api-Key header is, and browsers only send it
  // because this preflight allows it. Auth failures carry the header too, or
  // the browser would swallow the 401 and the shell could not explain the
  // refusal.
  const corsRoute = /^\/compliance\/dashboard\/data\/?$/.test(path);
  if (corsRoute && req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, OPTIONS",
        "access-control-allow-headers": "x-api-key, authorization, content-type",
        "access-control-max-age": "86400",
      },
    });
  }
  const withCors = (res: Response): Response => {
    if (corsRoute) res.headers.set("access-control-allow-origin", "*");
    return res;
  };

  const matched = matchRoute(path, req.method);

  // Route resolution BEFORE auth, because the scope check needs to know which
  // endpoint is being asked for. The 404/405 below therefore leak the shape of
  // the route table to an unauthenticated caller — an accepted trade: the route
  // table is public API surface documented in the README, and the alternative
  // (authenticate against an unknown scope) cannot be done coherently.
  if (matched === "not_found") {
    return notFoundResponse(requestId, "route", path);
  }
  if (matched === "method_not_allowed") {
    return methodNotAllowedResponse(requestId);
  }

  // Pure-chrome public routes (dashboard shell) skip authentication: they
  // carry zero data. The sentinel ctx's partner actor class means a handler
  // that wrongly consults it hits the most restrictive path everywhere.
  if (matched.route.public) {
    try {
      const res = await matched.route.handler(req, matched.params, requestId, PUBLIC_CTX);
      res.headers.set("X-RateLimit-Tier", matched.route.tier);
      return withCors(res);
    } catch (e) {
      return withCors(internalErrorResponse(requestId, e));
    }
  }

  const db = createDb();
  const auth = await authenticate(
    req,
    db,
    matched.route,
    instanceId,
    requestId,
    {
      key: Deno.env.get("DEMO_API_KEY"),
      // opt-OUT rather than opt-in, so an existing deployment keeps working on
      // upgrade; production sets this to "false". See auth.ts.
      enabled: Deno.env.get("ALLOW_DEMO_KEY") !== "false",
    },
  );
  if (!auth.ok) return withCors(auth.response);

  try {
    const res = await matched.route.handler(req, matched.params, requestId, auth.ctx);
    // D14: surface which tier the request was billed against, so partners can
    // reconcile their own usage. The limits themselves are a separate card.
    res.headers.set("X-RateLimit-Tier", matched.route.tier);
    return withCors(res);
  } catch (e) {
    return withCors(internalErrorResponse(requestId, e));
  }
});
