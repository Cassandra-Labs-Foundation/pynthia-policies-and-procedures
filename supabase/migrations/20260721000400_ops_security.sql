-- The ops-security tail — the remaining hermetic reds outside the money path:
-- EC-02/05/06/08/09, IS-05/06/07/08/13/14, BC-07/09/15, LQ-06/08/11/13/17,
-- BA-08. Small evidence tables, each owned by a writer that also runs its
-- violating case; the controls' timers ride the columns, not a side channel.

-- access lifecycle (EC-02, IS-06) — grants reference the HR seam
create table if not exists "core"."access_grant" (
  "id" text primary key,
  "user_id" text not null references "core"."employee"("id"),
  "role" text not null,
  "breakglass" boolean not null default false,
  "granted_at" timestamptz not null default now(),
  "review_due_at" timestamptz,
  "reviewed_at" timestamptz,
  "deprovisioned_at" timestamptz,
  "provenance" text not null default 'production'
);

-- backups and restores (BC-07, IS-08)
create table if not exists "core"."backup_job" (
  "id" text primary key,
  "kind" text not null check ("kind" in ('cycle', 'restore_test', 'restore')),
  "status" text not null check ("status" in ('completed', 'failed', 'remediated')),
  "restore_point" text,
  "rto_started_at" timestamptz,
  "verified_at" timestamptz,
  "remediated_at" timestamptz,
  "completed_at" timestamptz not null default now(),
  "provenance" text not null default 'production'
);

-- TLS posture (EC-06, IS-07)
create table if not exists "core"."tls_certificate" (
  "id" text primary key,
  "domain" text not null,
  "expires_at" timestamptz not null,
  "last_rating" text,
  "assessed_at" timestamptz,
  "renewed_at" timestamptz,
  "provenance" text not null default 'production'
);

-- periodic security reviews (EC-05 firewall, EC-08 antivirus log, EC-09 trend)
create table if not exists "core"."security_review" (
  "id" text primary key,
  "kind" text not null check ("kind" in
    ('firewall', 'firewall_independent', 'antivirus_log', 'incident_trend', 'access')),
  "reviewer" text not null,
  "independent" boolean not null default false,
  "findings" text,
  "completed_at" timestamptz not null default now(),
  "provenance" text not null default 'production'
);

-- vulnerabilities (IS-05)
create table if not exists "core"."vuln_finding" (
  "id" text primary key,
  "severity" text not null check ("severity" in ('low', 'medium', 'high', 'critical')),
  "confirmed_at" timestamptz not null default now(),
  "triaged_at" timestamptz,
  "triage_outcome" text,
  "remediated_at" timestamptz,
  "provenance" text not null default 'production'
);

-- SIEM (IS-14, EC-09)
create table if not exists "core"."siem_alert" (
  "id" text primary key,
  "severity" text not null,
  "raised_at" timestamptz not null default now(),
  "disposed_at" timestamptz,
  "disposition" text,
  "provenance" text not null default 'production'
);
create table if not exists "core"."siem_source" (
  "id" text primary key,
  "name" text not null,
  "silent_since" timestamptz,
  "restored_at" timestamptz,
  "provenance" text not null default 'production'
);

-- antivirus (EC-08)
create table if not exists "core"."antivirus_event" (
  "id" text primary key,
  "threat" text not null,
  "detected_at" timestamptz not null default now(),
  "remediated_at" timestamptz,
  "provenance" text not null default 'production'
);

-- pentest engagements (EC-05, EC-09)
create table if not exists "core"."pentest_engagement" (
  "id" text primary key,
  "engagement_due_at" timestamptz,
  "report_issued_at" timestamptz,
  "report_received_at" timestamptz,
  "findings_count" integer,
  "provenance" text not null default 'production'
);

-- AI governance (IS-13)
create table if not exists "core"."ai_tool" (
  "id" text primary key,
  "name" text not null,
  "status" text not null default 'proposed'
    check ("status" in ('proposed', 'approved', 'rejected', 'launched')),
  "member_facing" boolean not null default false,
  "register_updated_at" timestamptz,
  "disclosure_published_at" timestamptz,
  "provenance" text not null default 'production'
);
create table if not exists "core"."ai_violation" (
  "id" text primary key,
  "tool_id" text,
  "description" text not null,
  "disposed_at" timestamptz,
  "disposition" text,
  "provenance" text not null default 'production'
);

-- liquidity ops (LQ-06/08/11/13/17)
create table if not exists "core"."liquidity_concentration" (
  "id" text primary key,
  "as_of" date not null,
  "top_depositor_pct_bp" integer not null,
  "limit_pct_bp" integer,
  "breached" boolean not null default false,
  "waiver_decision" text,
  "waiver_decided_by" text,
  "provenance" text not null default 'production'
);
create table if not exists "core"."dq_tieout" (
  "id" text primary key,
  "as_of" date not null,
  "gl_total_cents" bigint not null,
  "subledger_total_cents" bigint not null,
  "variance_cents" bigint not null,
  "completed_at" timestamptz not null default now(),
  "provenance" text not null default 'production'
);
create table if not exists "core"."model_review" (
  "id" text primary key,
  "model" text not null,
  "reviewer" text not null,
  "outcome" text not null,
  "completed_at" timestamptz not null default now(),
  "provenance" text not null default 'production'
);
create table if not exists "core"."ncua_notification" (
  "id" text primary key,
  "kind" text not null,
  "sent_at" timestamptz not null default now(),
  "ack_received_at" timestamptz,
  "ack_ref" text,
  "provenance" text not null default 'production'
);
create table if not exists "core"."regulator_request" (
  "id" text primary key,
  "regulator" text not null,
  "received_at" timestamptz not null default now(),
  "responded_at" timestamptz,
  "response_ref" text,
  "contacts_verified_at" timestamptz,
  "provenance" text not null default 'production'
);
create table if not exists "core"."wholesale_exposure" (
  "id" text primary key,
  "as_of" date not null,
  "amount_cents" bigint not null,
  "rate_bp" integer not null,
  "market_rate_bp" integer,
  "pricing_violation" boolean not null default false,
  "listing_decision" text,
  "provenance" text not null default 'production'
);

-- BA-08 pillar 3
create table if not exists "core"."pillar3_disclosure" (
  "id" text primary key,
  "period" text not null,
  "due_at" timestamptz,
  "published_at" timestamptz,
  "board_minutes_ref" text,
  "provenance" text not null default 'production'
);

-- training assignments (BA-08's capital cycle; rides the HR seam)
create table if not exists "core"."training_assignment" (
  "id" text primary key,
  "curriculum" text not null,
  "assignee_id" text not null references "core"."employee"("id"),
  "annual_due_at" timestamptz,
  "created_at" timestamptz not null default now(),
  "provenance" text not null default 'production'
);

notify pgrst, 'reload schema';
