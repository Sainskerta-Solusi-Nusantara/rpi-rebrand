-- =============================================================================
-- 001_enable_rls.sql
-- Enable Row Level Security on all tenant-scoped tables.
--
-- Multi-tenant model: Shared DB + tenant_id column + Postgres RLS.
--
-- Expected GUC variables (set per request via SET LOCAL inside transactions
-- by lib/tenant-context.ts::withTenantContext):
--   app.current_tenant_id  uuid/text  - the active tenant id
--   app.current_user_id    uuid/text  - the active user id
--   app.is_superadmin      'true'|'false' (bool-as-text) - bypass switch
--
-- Helper SQL functions below read those GUCs safely (missing_ok=true) so
-- that a query made without context (e.g. during migrations) does not
-- explode but instead returns NULL/false and the policy denies access.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper functions
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION app_current_tenant() RETURNS text AS $$
DECLARE
  v text;
BEGIN
  v := current_setting('app.current_tenant_id', true);
  IF v IS NULL OR v = '' THEN
    RETURN NULL;
  END IF;
  RETURN v;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION app_current_user() RETURNS text AS $$
DECLARE
  v text;
BEGIN
  v := current_setting('app.current_user_id', true);
  IF v IS NULL OR v = '' THEN
    RETURN NULL;
  END IF;
  RETURN v;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION app_is_superadmin() RETURNS boolean AS $$
DECLARE
  v text;
BEGIN
  v := current_setting('app.is_superadmin', true);
  IF v IS NULL OR v = '' THEN
    RETURN false;
  END IF;
  RETURN v = 'true';
END;
$$ LANGUAGE plpgsql STABLE;

-- -----------------------------------------------------------------------------
-- Enable RLS on tenant-scoped tables
-- FORCE RLS ensures table owner is also subject to policies (defense in depth).
-- -----------------------------------------------------------------------------

ALTER TABLE tenants            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants            FORCE  ROW LEVEL SECURITY;

ALTER TABLE brandings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE brandings          FORCE  ROW LEVEL SECURITY;

ALTER TABLE user_tenants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenants       FORCE  ROW LEVEL SECURITY;

ALTER TABLE team_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members       FORCE  ROW LEVEL SECURITY;

ALTER TABLE invitations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations        FORCE  ROW LEVEL SECURITY;

ALTER TABLE jobs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs               FORCE  ROW LEVEL SECURITY;

ALTER TABLE applications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications       FORCE  ROW LEVEL SECURITY;

ALTER TABLE saved_jobs         ENABLE ROW LEVEL SECURITY;
-- saved_jobs is user-scoped (no tenant_id), do not FORCE

ALTER TABLE courses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses            FORCE  ROW LEVEL SECURITY;

ALTER TABLE modules            ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules            FORCE  ROW LEVEL SECURITY;

ALTER TABLE lessons            ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons            FORCE  ROW LEVEL SECURITY;

ALTER TABLE enrollments        ENABLE ROW LEVEL SECURITY;

ALTER TABLE lesson_progresses  ENABLE ROW LEVEL SECURITY;

ALTER TABLE certificates       ENABLE ROW LEVEL SECURITY;

ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;

ALTER TABLE audit_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs         FORCE  ROW LEVEL SECURITY;

ALTER TABLE subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions      FORCE  ROW LEVEL SECURITY;
