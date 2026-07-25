-- Grants for the Data API roles on the `core` schema.
--
-- The schema + tables are created in earlier migrations but not granted to the
-- PostgREST roles, so runtime supabase-js calls (edge functions via service_role)
-- get "permission denied for schema core" until these run. RLS still governs
-- anon/authenticated; service_role bypasses RLS but still needs table privileges.
-- Exposing `core` in the Data API settings must accompany these grants.

grant usage on schema "core" to "service_role", "anon", "authenticated";

-- service_role is the operational writer (edge functions). Full DML.
grant all privileges on all tables in schema "core" to "service_role";
grant all privileges on all sequences in schema "core" to "service_role";

-- Future tables created in core inherit the same service_role grants.
alter default privileges in schema "core" grant all on tables to "service_role";
alter default privileges in schema "core" grant all on sequences to "service_role";

notify pgrst, 'reload schema';
