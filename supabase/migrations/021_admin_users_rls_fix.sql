-- Migration 021: admin_users RLS Policy Fix
-- Date: 2026-01-29
-- Purpose: Ensure RLS is enabled on admin_users with sane policies so users can
--          check their own admin status (needed for navbar "Admin"-Button gating).
--          Originally lived in scripts/apply-migrations.sql as a one-shot patch;
--          promoted to a numbered migration so the tree stays the source of truth.

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_can_view_own_role" ON admin_users;
DROP POLICY IF EXISTS "service_role_manages_admins" ON admin_users;
DROP POLICY IF EXISTS "users_can_check_own_admin_status" ON admin_users;

CREATE POLICY "users_can_check_own_admin_status" ON admin_users
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "service_role_manages_admins" ON admin_users
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT ON admin_users TO authenticated;
