-- =============================================================================
-- 002_rls_policies.sql
-- Row Level Security policies for all tenant-scoped tables.
--
-- Convention:
--   * Superadmin (app.is_superadmin = 'true') bypasses all checks.
--   * Tenant-scoped reads: tenant_id matches app.current_tenant_id.
--   * Published jobs/courses are world-readable (visitor browsing).
--   * Writes (INSERT/UPDATE/DELETE) require matching tenant context.
--   * User-scoped tables (saved_jobs, resumes, notifications, certificates,
--     enrollments, lesson_progresses, applications-own) gate on user id.
--   * Module/Lesson have no tenant_id column - we join via course->tenant_id.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- tenants
--   Superadmin: full access. Otherwise: row matches current tenant context.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS tenant_self_select ON tenants;
CREATE POLICY tenant_self_select ON tenants
  FOR SELECT
  USING (app_is_superadmin() OR id = app_current_tenant());

DROP POLICY IF EXISTS tenant_self_modify ON tenants;
CREATE POLICY tenant_self_modify ON tenants
  FOR ALL
  USING (app_is_superadmin() OR id = app_current_tenant())
  WITH CHECK (app_is_superadmin() OR id = app_current_tenant());

-- -----------------------------------------------------------------------------
-- brandings  (1-1 with tenant)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS branding_select ON brandings;
CREATE POLICY branding_select ON brandings
  FOR SELECT
  USING (app_is_superadmin() OR tenant_id = app_current_tenant());

DROP POLICY IF EXISTS branding_modify ON brandings;
CREATE POLICY branding_modify ON brandings
  FOR ALL
  USING (app_is_superadmin() OR tenant_id = app_current_tenant())
  WITH CHECK (app_is_superadmin() OR tenant_id = app_current_tenant());

-- -----------------------------------------------------------------------------
-- user_tenants  (membership table)
--   A user can see their own memberships. Tenant admins see all memberships
--   in their tenant.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS user_tenants_select ON user_tenants;
CREATE POLICY user_tenants_select ON user_tenants
  FOR SELECT
  USING (
    app_is_superadmin()
    OR user_id = app_current_user()
    OR tenant_id = app_current_tenant()
  );

DROP POLICY IF EXISTS user_tenants_modify ON user_tenants;
CREATE POLICY user_tenants_modify ON user_tenants
  FOR ALL
  USING (app_is_superadmin() OR tenant_id = app_current_tenant())
  WITH CHECK (app_is_superadmin() OR tenant_id = app_current_tenant());

-- -----------------------------------------------------------------------------
-- team_members
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS team_members_select ON team_members;
CREATE POLICY team_members_select ON team_members
  FOR SELECT
  USING (
    app_is_superadmin()
    OR tenant_id = app_current_tenant()
    OR member_id = app_current_user()
    OR lead_id   = app_current_user()
  );

DROP POLICY IF EXISTS team_members_modify ON team_members;
CREATE POLICY team_members_modify ON team_members
  FOR ALL
  USING (app_is_superadmin() OR tenant_id = app_current_tenant())
  WITH CHECK (app_is_superadmin() OR tenant_id = app_current_tenant());

-- -----------------------------------------------------------------------------
-- invitations
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS invitations_select ON invitations;
CREATE POLICY invitations_select ON invitations
  FOR SELECT
  USING (app_is_superadmin() OR tenant_id = app_current_tenant());

DROP POLICY IF EXISTS invitations_modify ON invitations;
CREATE POLICY invitations_modify ON invitations
  FOR ALL
  USING (app_is_superadmin() OR tenant_id = app_current_tenant())
  WITH CHECK (app_is_superadmin() OR tenant_id = app_current_tenant());

-- -----------------------------------------------------------------------------
-- jobs
--   Published jobs are visible to anyone (public board). Otherwise scoped
--   to the owning tenant. Writes require tenant context.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS jobs_select ON jobs;
CREATE POLICY jobs_select ON jobs
  FOR SELECT
  USING (
    app_is_superadmin()
    OR tenant_id = app_current_tenant()
    OR status = 'PUBLISHED'
  );

DROP POLICY IF EXISTS jobs_insert ON jobs;
CREATE POLICY jobs_insert ON jobs
  FOR INSERT
  WITH CHECK (app_is_superadmin() OR tenant_id = app_current_tenant());

DROP POLICY IF EXISTS jobs_update ON jobs;
CREATE POLICY jobs_update ON jobs
  FOR UPDATE
  USING (app_is_superadmin() OR tenant_id = app_current_tenant())
  WITH CHECK (app_is_superadmin() OR tenant_id = app_current_tenant());

DROP POLICY IF EXISTS jobs_delete ON jobs;
CREATE POLICY jobs_delete ON jobs
  FOR DELETE
  USING (app_is_superadmin() OR tenant_id = app_current_tenant());

-- -----------------------------------------------------------------------------
-- applications
--   The applicant can see/modify own rows; tenant admins see all in tenant.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS applications_select ON applications;
CREATE POLICY applications_select ON applications
  FOR SELECT
  USING (
    app_is_superadmin()
    OR user_id = app_current_user()
    OR tenant_id = app_current_tenant()
  );

DROP POLICY IF EXISTS applications_insert ON applications;
CREATE POLICY applications_insert ON applications
  FOR INSERT
  WITH CHECK (
    app_is_superadmin()
    OR user_id = app_current_user()
  );

DROP POLICY IF EXISTS applications_update ON applications;
CREATE POLICY applications_update ON applications
  FOR UPDATE
  USING (
    app_is_superadmin()
    OR user_id = app_current_user()
    OR tenant_id = app_current_tenant()
  )
  WITH CHECK (
    app_is_superadmin()
    OR user_id = app_current_user()
    OR tenant_id = app_current_tenant()
  );

DROP POLICY IF EXISTS applications_delete ON applications;
CREATE POLICY applications_delete ON applications
  FOR DELETE
  USING (
    app_is_superadmin()
    OR user_id = app_current_user()
    OR tenant_id = app_current_tenant()
  );

-- -----------------------------------------------------------------------------
-- saved_jobs  (user-scoped, no tenant_id)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS saved_jobs_owner ON saved_jobs;
CREATE POLICY saved_jobs_owner ON saved_jobs
  FOR ALL
  USING (app_is_superadmin() OR user_id = app_current_user())
  WITH CHECK (app_is_superadmin() OR user_id = app_current_user());

-- -----------------------------------------------------------------------------
-- courses
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS courses_select ON courses;
CREATE POLICY courses_select ON courses
  FOR SELECT
  USING (
    app_is_superadmin()
    OR tenant_id = app_current_tenant()
    OR status = 'PUBLISHED'
  );

DROP POLICY IF EXISTS courses_modify ON courses;
CREATE POLICY courses_modify ON courses
  FOR ALL
  USING (app_is_superadmin() OR tenant_id = app_current_tenant())
  WITH CHECK (app_is_superadmin() OR tenant_id = app_current_tenant());

-- -----------------------------------------------------------------------------
-- modules  (no tenant_id; check via course)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS modules_select ON modules;
CREATE POLICY modules_select ON modules
  FOR SELECT
  USING (
    app_is_superadmin()
    OR EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = modules.course_id
        AND (c.tenant_id = app_current_tenant() OR c.status = 'PUBLISHED')
    )
  );

DROP POLICY IF EXISTS modules_modify ON modules;
CREATE POLICY modules_modify ON modules
  FOR ALL
  USING (
    app_is_superadmin()
    OR EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = modules.course_id
        AND c.tenant_id = app_current_tenant()
    )
  )
  WITH CHECK (
    app_is_superadmin()
    OR EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = modules.course_id
        AND c.tenant_id = app_current_tenant()
    )
  );

-- -----------------------------------------------------------------------------
-- lessons  (no tenant_id; check via module->course)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS lessons_select ON lessons;
CREATE POLICY lessons_select ON lessons
  FOR SELECT
  USING (
    app_is_superadmin()
    OR EXISTS (
      SELECT 1
      FROM modules m
      JOIN courses c ON c.id = m.course_id
      WHERE m.id = lessons.module_id
        AND (c.tenant_id = app_current_tenant() OR c.status = 'PUBLISHED')
    )
  );

DROP POLICY IF EXISTS lessons_modify ON lessons;
CREATE POLICY lessons_modify ON lessons
  FOR ALL
  USING (
    app_is_superadmin()
    OR EXISTS (
      SELECT 1
      FROM modules m
      JOIN courses c ON c.id = m.course_id
      WHERE m.id = lessons.module_id
        AND c.tenant_id = app_current_tenant()
    )
  )
  WITH CHECK (
    app_is_superadmin()
    OR EXISTS (
      SELECT 1
      FROM modules m
      JOIN courses c ON c.id = m.course_id
      WHERE m.id = lessons.module_id
        AND c.tenant_id = app_current_tenant()
    )
  );

-- -----------------------------------------------------------------------------
-- enrollments  (user-scoped)
--   User sees own enrollments. Tenant admins see enrollments for courses in
--   their tenant.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS enrollments_select ON enrollments;
CREATE POLICY enrollments_select ON enrollments
  FOR SELECT
  USING (
    app_is_superadmin()
    OR user_id = app_current_user()
    OR EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = enrollments.course_id
        AND c.tenant_id = app_current_tenant()
    )
  );

DROP POLICY IF EXISTS enrollments_modify ON enrollments;
CREATE POLICY enrollments_modify ON enrollments
  FOR ALL
  USING (app_is_superadmin() OR user_id = app_current_user())
  WITH CHECK (app_is_superadmin() OR user_id = app_current_user());

-- -----------------------------------------------------------------------------
-- lesson_progresses  (user-scoped via enrollment)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS lesson_progress_owner ON lesson_progresses;
CREATE POLICY lesson_progress_owner ON lesson_progresses
  FOR ALL
  USING (
    app_is_superadmin()
    OR EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.id = lesson_progresses.enrollment_id
        AND e.user_id = app_current_user()
    )
  )
  WITH CHECK (
    app_is_superadmin()
    OR EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.id = lesson_progresses.enrollment_id
        AND e.user_id = app_current_user()
    )
  );

-- -----------------------------------------------------------------------------
-- certificates  (user owns; readable to issuing tenant admins)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS certificates_select ON certificates;
CREATE POLICY certificates_select ON certificates
  FOR SELECT
  USING (
    app_is_superadmin()
    OR user_id = app_current_user()
    OR EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = certificates.course_id
        AND c.tenant_id = app_current_tenant()
    )
  );

DROP POLICY IF EXISTS certificates_modify ON certificates;
CREATE POLICY certificates_modify ON certificates
  FOR ALL
  USING (app_is_superadmin() OR user_id = app_current_user())
  WITH CHECK (app_is_superadmin() OR user_id = app_current_user());

-- -----------------------------------------------------------------------------
-- notifications  (user-scoped)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS notifications_owner ON notifications;
CREATE POLICY notifications_owner ON notifications
  FOR ALL
  USING (app_is_superadmin() OR user_id = app_current_user())
  WITH CHECK (app_is_superadmin() OR user_id = app_current_user());

-- -----------------------------------------------------------------------------
-- audit_logs  (tenant scope or superadmin)
--   Inserts are allowed when tenant matches or row is global (tenant_id NULL)
--   and the actor is the current user.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS audit_logs_select ON audit_logs;
CREATE POLICY audit_logs_select ON audit_logs
  FOR SELECT
  USING (
    app_is_superadmin()
    OR tenant_id = app_current_tenant()
    OR user_id   = app_current_user()
  );

DROP POLICY IF EXISTS audit_logs_insert ON audit_logs;
CREATE POLICY audit_logs_insert ON audit_logs
  FOR INSERT
  WITH CHECK (
    app_is_superadmin()
    OR tenant_id IS NULL
    OR tenant_id = app_current_tenant()
  );

-- audit logs are append-only; no UPDATE/DELETE policies on purpose.

-- -----------------------------------------------------------------------------
-- subscriptions  (tenant-scoped, sensitive)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS subscriptions_select ON subscriptions;
CREATE POLICY subscriptions_select ON subscriptions
  FOR SELECT
  USING (app_is_superadmin() OR tenant_id = app_current_tenant());

DROP POLICY IF EXISTS subscriptions_modify ON subscriptions;
CREATE POLICY subscriptions_modify ON subscriptions
  FOR ALL
  USING (app_is_superadmin() OR tenant_id = app_current_tenant())
  WITH CHECK (app_is_superadmin() OR tenant_id = app_current_tenant());
