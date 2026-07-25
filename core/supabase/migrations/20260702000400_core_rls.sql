-- Row Level Security for core schema (generated).
-- Default posture: RLS ON, no permissive policy => only the service_role
-- (which bypasses RLS) can read/write. This is the secure default for
-- banking data. Add explicit policies below to expose rows to end users.

alter table "core"."account" enable row level security;
alter table "core"."account_number" enable row level security;
alter table "core"."ach_transfer" enable row level security;
alter table "core"."address" enable row level security;
alter table "core"."bookkeeping_entry" enable row level security;
alter table "core"."bsa_alert" enable row level security;
alter table "core"."card" enable row level security;
alter table "core"."card_authorization" enable row level security;
alter table "core"."case" enable row level security;
alter table "core"."change" enable row level security;
alter table "core"."coi" enable row level security;
alter table "core"."complaint" enable row level security;
alter table "core"."control_result" enable row level security;
alter table "core"."dispute" enable row level security;
alter table "core"."document" enable row level security;
alter table "core"."entity" enable row level security;
alter table "core"."event" enable row level security;
alter table "core"."fbo_position" enable row level security;
alter table "core"."filing" enable row level security;
alter table "core"."finding" enable row level security;
alter table "core"."handover" enable row level security;
alter table "core"."inbound_payment" enable row level security;
alter table "core"."incident" enable row level security;
alter table "core"."indemnification" enable row level security;
alter table "core"."insider" enable row level security;
alter table "core"."legal_hold" enable row level security;
alter table "core"."loan" enable row level security;
alter table "core"."loan_application" enable row level security;
alter table "core"."originator" enable row level security;
alter table "core"."provider_result" enable row level security;
alter table "core"."records_package" enable row level security;
alter table "core"."risk" enable row level security;
alter table "core"."task" enable row level security;
alter table "core"."trade" enable row level security;
alter table "core"."training" enable row level security;
alter table "core"."transfer" enable row level security;
alter table "core"."user" enable row level security;
alter table "core"."verification" enable row level security;
alter table "core"."wire_transfer" enable row level security;

-- Example: allow authenticated users to read everything (uncomment to use)
-- do $$ declare r record; begin
--   for r in select tablename from pg_tables where schemaname = 'core' loop
--     execute format('create policy %I on core.%I for select to authenticated using (true)',
--                    'read_'||r.tablename, r.tablename);
--   end loop; end $$;

