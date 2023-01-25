-- =============================================================================
-- 003_fts_indexes.sql
-- Full-text search, trigram, partial and composite indexes.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- -----------------------------------------------------------------------------
-- Full-text search (Indonesian config) on jobs and courses
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS jobs_fts_idx
  ON jobs
  USING GIN (
    to_tsvector(
      'simple'::regconfig,
      coalesce(title, '') || ' ' || coalesce(description, '')
    )
  );

-- Tags searched separately via the array GIN index below.

CREATE INDEX IF NOT EXISTS courses_fts_idx
  ON courses
  USING GIN (
    to_tsvector(
      'simple'::regconfig,
      coalesce(title, '') || ' ' || coalesce(description, '')
    )
  );

-- -----------------------------------------------------------------------------
-- Trigram indexes for fuzzy/ILIKE autocomplete
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS jobs_title_trgm_idx
  ON jobs USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS jobs_location_trgm_idx
  ON jobs USING GIN (location gin_trgm_ops);

CREATE INDEX IF NOT EXISTS users_name_trgm_idx
  ON users USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS users_email_trgm_idx
  ON users USING GIN (email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS courses_title_trgm_idx
  ON courses USING GIN (title gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- Composite B-tree indexes for hot query paths
-- -----------------------------------------------------------------------------

-- Tenant feed: list published jobs in a tenant ordered by recency.
CREATE INDEX IF NOT EXISTS jobs_tenant_status_published_idx
  ON jobs (tenant_id, status, published_at DESC);

-- Recruiter inbox: applications by tenant + status sorted by recency.
CREATE INDEX IF NOT EXISTS applications_tenant_status_applied_idx
  ON applications (tenant_id, status, applied_at DESC);

-- User's own application timeline.
CREATE INDEX IF NOT EXISTS applications_user_applied_idx
  ON applications (user_id, applied_at DESC);

-- Tenant course catalog ordered by recency.
CREATE INDEX IF NOT EXISTS courses_tenant_status_published_idx
  ON courses (tenant_id, status, published_at DESC);

-- Audit log timeline by tenant.
CREATE INDEX IF NOT EXISTS audit_logs_tenant_created_idx
  ON audit_logs (tenant_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- Partial indexes (cover the most common filtered queries cheaply)
-- -----------------------------------------------------------------------------

-- Published-jobs-only feed (skips drafts/archived) - the public board.
CREATE INDEX IF NOT EXISTS jobs_published_only_idx
  ON jobs (tenant_id, published_at DESC)
  WHERE status = 'PUBLISHED';

-- Unread notifications per user (notification badge).
CREATE INDEX IF NOT EXISTS notifications_unread_idx
  ON notifications (user_id, created_at DESC)
  WHERE is_read = false;

-- Active job listings nearing expiry.
CREATE INDEX IF NOT EXISTS jobs_active_expiring_idx
  ON jobs (expired_at)
  WHERE status = 'PUBLISHED' AND expired_at IS NOT NULL;

-- Open applications (not terminal status) for recruiter dashboards.
CREATE INDEX IF NOT EXISTS applications_open_idx
  ON applications (tenant_id, applied_at DESC)
  WHERE status IN ('APPLIED', 'REVIEWED', 'SHORTLISTED', 'INTERVIEW');

-- Active enrollments only.
CREATE INDEX IF NOT EXISTS enrollments_active_idx
  ON enrollments (user_id, enrolled_at DESC)
  WHERE status = 'IN_PROGRESS';
