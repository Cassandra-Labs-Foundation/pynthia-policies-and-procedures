-- Cards 62 / 59 / 60 — the analytical tail of the aggregator.
--
-- Card 62's note ("Decide sync mechanism before steps 59/60") is answered
-- here: WATERMARK ARCHIVING. A job (analytics/archive.sh) exports event rows
-- with sequence_id <= a chosen watermark to Parquet and records that
-- watermark below; the DuckDB spanning view reads hot rows (> watermark)
-- from Postgres and cold rows (<= watermark) from Parquet, so every event is
-- served by exactly one tier. Rows are NOT deleted from Postgres yet — the
-- append-only trigger stays intact and the consumers' cursor loop is
-- untouched; physical pruning is a later card once retention rules land.
--
-- The reporters (59: BSA 90-day lookback -> SAR candidates; 60: 5300
-- aggregation) run in DuckDB over the spanning view and write their evidence
-- back into these tables, so the durable proof-of-run lives in Postgres even
-- though the computation spans both tiers.

-- Single-row watermark. archived_at is stamped on EVERY archive run, found
-- work or not — the card-18 liveness lesson applies to archive jobs too.
create table if not exists "aggregator"."archive_watermark" (
  "singleton" boolean primary key default true check ("singleton"),
  "archived_through" bigint not null default 0,
  "archived_at" timestamptz not null default now()
);
insert into "aggregator"."archive_watermark" ("archived_through") values (0)
  on conflict do nothing;

-- Card 59: a SAR candidate is the reporter's output — one row per entity per
-- run-day, idempotent by UNIQUE(entity_hash, window_end). The candidate is
-- input to the instance-side BSA case workflow, not a SAR filing itself.
create table if not exists "aggregator"."sar_candidate" (
  "id" bigint generated always as identity primary key,
  "entity_hash" text not null,
  "instance_id" text not null,
  "window_start" date not null,
  "window_end" date not null,
  "total_cents" bigint not null,
  "event_count" integer not null,
  "details" text,
  "created_at" timestamptz not null default now(),
  unique ("entity_hash", "window_end")
);

-- Card 60: one 5300 aggregation row per instance per run-day. Fixed columns
-- rather than jsonb — the DuckDB postgres writer inserts scalars cleanly,
-- and a call-report line is a fixed schema by nature.
create table if not exists "aggregator"."report_5300" (
  "id" bigint generated always as identity primary key,
  "period" text not null,
  "instance_id" text not null,
  "as_of" date not null,
  "settled_cents" bigint not null,
  "settled_count" integer not null,
  "ctr_alerts" integer not null,
  "structuring_alerts" integer not null,
  "fbo_position_cents" bigint not null,
  "generated_at" timestamptz not null default now(),
  unique ("period", "instance_id", "as_of")
);

notify pgrst, 'reload schema';
