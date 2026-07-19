#!/usr/bin/env -S deno run --allow-env --allow-net
// Issue a scoped partner token (card 45).
//
//   deno run --allow-env --allow-net scripts/issue-token.ts \
//     --partner ptnr_demo --actor partner \
//     --endpoints 'POST /transfers,GET /accounts/{id}' \
//     --tiers read,write [--expires-days 90]
//
// The plaintext is printed ONCE and never stored — only its SHA-256 reaches
// the database. There is no recovery path: a lost token is re-issued, not
// looked up. That is the property that makes a database compromise not also a
// credential compromise, so it is deliberate rather than an inconvenience.
//
// Needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + INSTANCE_ID in the
// environment (source .env.local).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { type ActorType, mintToken, type Tier } from "../supabase/functions/api/auth.ts";

function arg(name: string): string | undefined {
  const i = Deno.args.indexOf(`--${name}`);
  return i >= 0 ? Deno.args[i + 1] : undefined;
}

const partnerId = arg("partner") ?? null;
const actorType = (arg("actor") ?? "partner") as ActorType;
const endpoints = (arg("endpoints") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const tiers = (arg("tiers") ?? "").split(",").map((s) => s.trim()).filter(Boolean) as Tier[];
const expiresDays = arg("expires-days");

if (!["partner", "cu_admin", "pynthia_ops"].includes(actorType)) {
  console.error(`--actor must be one of: partner, cu_admin, pynthia_ops`);
  Deno.exit(1);
}
if (actorType === "partner" && !partnerId) {
  console.error("--partner is required for a partner token");
  Deno.exit(1);
}
if (!endpoints.length || !tiers.length) {
  // An empty scope list is almost certainly a mistake, and a token that can
  // reach nothing is indistinguishable from a broken deployment at 3am.
  console.error("--endpoints and --tiers are both required (use '*' for all endpoints)");
  Deno.exit(1);
}

const instanceId = Deno.env.get("INSTANCE_ID");
if (!instanceId) {
  console.error("INSTANCE_ID must be set — a token is bound to the instance that issues it");
  Deno.exit(1);
}

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

// The instance row is authoritative; refuse if the environment disagrees with
// it, rather than minting a token nothing will ever accept.
const { data: instance } = await db.schema("core").from("instance")
  .select("id").maybeSingle();
if (!instance) {
  console.error("core.instance has no row — run the migrations first");
  Deno.exit(1);
}
if (instance.id !== instanceId) {
  console.error(
    `INSTANCE_ID (${instanceId}) does not match core.instance.id (${instance.id}); ` +
      `a token minted for the wrong instance would be rejected at every request`,
  );
  Deno.exit(1);
}

if (partnerId) {
  const { data: partner } = await db.schema("core").from("partner")
    .select("id, status, instance_id").eq("id", partnerId).maybeSingle();
  if (!partner) {
    console.error(`partner ${partnerId} does not exist on this instance`);
    Deno.exit(1);
  }
  if (partner.status !== "active") {
    console.error(`partner ${partnerId} is ${partner.status}; its tokens would not authenticate`);
    Deno.exit(1);
  }
}

const expiresAt = expiresDays
  ? new Date(Date.now() + Number(expiresDays) * 86_400_000).toISOString()
  : null;

const { plaintext, row } = await mintToken({
  id: `tok_${crypto.randomUUID()}`,
  actorType,
  partnerId,
  instanceId,
  allowedEndpoints: endpoints,
  allowedTiers: tiers,
  expiresAt,
});

const { error } = await db.schema("core").from("api_token").insert(row);
if (error) {
  console.error(`failed to store token: ${error.message}`);
  Deno.exit(1);
}

console.log(`
token issued
  id         ${row.id}
  actor      ${actorType}${partnerId ? `  (partner ${partnerId})` : ""}
  instance   ${instanceId}
  endpoints  ${endpoints.join(", ")}
  tiers      ${tiers.join(", ")}
  expires    ${expiresAt ?? "never"}

  ${plaintext}

Shown once. Only its SHA-256 was stored — there is no way to retrieve it again.
`);
