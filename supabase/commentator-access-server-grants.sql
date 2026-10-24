-- Repair the existing admin Edge Function's table permissions only.
-- Supabase CLI is unavailable in this workspace; this is an idempotent repair,
-- not a fabricated CLI migration/history entry.
-- The function still verifies getUser(token) and a current global admin row.
-- RLS, browser role grants and all existing access rows remain unchanged.
grant insert, update on table public.commentator_access to service_role;

-- Verification: service_role should be true/true, anon/authenticated false/false.
select rolname,
  has_table_privilege(rolname,'public.commentator_access','INSERT') as can_insert,
  has_table_privilege(rolname,'public.commentator_access','UPDATE') as can_update
from pg_roles where rolname in ('service_role','anon','authenticated');
