-- Migration: 013_security_hardening.sql
-- Date: 2026-01-23
--
-- Purpose: Fix security issues flagged by Supabase Dashboard Advisor:
--   1. Replace RLS policy with WITH CHECK (true) on source_texts
--   2. Add SECURITY DEFINER + search_path to is_book_safe_for_region function
--   3. Add missing RLS policies for ip_quotas table
--   4. Ensure all functions have immutable search paths

-- ============================================================================
-- 0. PREREQUISITE: Ensure admin_users table exists
-- ============================================================================

-- Create admin_users table if it doesn't exist (from migration 002)
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view their own role
DROP POLICY IF EXISTS "admins_can_view_own_role" ON admin_users;
CREATE POLICY "admins_can_view_own_role" ON admin_users
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Only service_role can manage admin roles
DROP POLICY IF EXISTS "service_role_manages_admins" ON admin_users;
CREATE POLICY "service_role_manages_admins" ON admin_users
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Helper function: Check if user is admin
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = COALESCE(check_user_id, auth.uid())
  );
$$;

-- Grant permissions
GRANT SELECT ON admin_users TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;

COMMENT ON TABLE admin_users IS 'Stores admin roles for book import and privileged operations';
COMMENT ON FUNCTION is_admin IS 'Helper function - checks if a user has admin rights';

-- ============================================================================
-- 1. FIX: Replace overly permissive INSERT policy on source_texts
-- ============================================================================

-- Drop the temporary policy that allows unrestricted INSERT
DROP POLICY IF EXISTS "authenticated_can_insert_texts" ON source_texts;

-- Drop existing admin policy if it exists (for idempotency)
DROP POLICY IF EXISTS "admins_can_insert_texts" ON source_texts;

-- Create admin-only INSERT policy (checks admin_users table)
CREATE POLICY "admins_can_insert_texts" ON source_texts
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  ));

COMMENT ON POLICY "admins_can_insert_texts" ON source_texts IS
'Only users in admin_users table can insert books. Replaces the old WITH CHECK (true) policy.';

-- ============================================================================
-- 2. FIX: Add search_path and SECURITY DEFINER to is_book_safe_for_region
-- ============================================================================

CREATE OR REPLACE FUNCTION is_book_safe_for_region(
  p_text_id UUID,
  p_region TEXT -- 'US', 'EU', 'GLOBAL'
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp  -- Security hardening
AS $$
  SELECT
    CASE
      WHEN p_region = 'US' THEN is_pd_us
      WHEN p_region = 'EU' THEN is_pd_eu
      WHEN p_region = 'GLOBAL' THEN (is_pd_us AND is_pd_eu)
      ELSE false
    END
  FROM public.source_texts
  WHERE id = p_text_id;
$$;

COMMENT ON FUNCTION is_book_safe_for_region IS
'Helper function to check copyright status for specific jurisdictions. Hardened with SECURITY DEFINER and immutable search_path.';

-- ============================================================================
-- 3. FIX: Add missing RLS policies for ip_quotas table
-- ============================================================================

-- RLS is enabled but no policies exist (Supabase warning)
-- ip_quotas is used by the check_and_consume_quota function with SECURITY DEFINER
-- Therefore, normal users should NOT have direct access

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "service_role_can_read_ip_quotas" ON ip_quotas;
DROP POLICY IF EXISTS "service_role_can_manage_ip_quotas" ON ip_quotas;

-- Policy 1: Only service_role can directly read ip_quotas
CREATE POLICY "service_role_can_read_ip_quotas" ON ip_quotas
  FOR SELECT TO service_role
  USING (true);

-- Policy 2: Only service_role can manage ip_quotas
CREATE POLICY "service_role_can_manage_ip_quotas" ON ip_quotas
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Note: Regular users access ip_quotas ONLY through check_and_consume_quota()
-- which runs with SECURITY DEFINER (elevated privileges)

COMMENT ON POLICY "service_role_can_read_ip_quotas" ON ip_quotas IS
'Only service_role can directly query ip_quotas. Users access via check_and_consume_quota RPC.';

-- ============================================================================
-- 4. VERIFY: Ensure all custom functions have secure search_path
-- ============================================================================

-- List of functions that should have SECURITY DEFINER + search_path:
-- ✅ check_and_consume_quota (already has it in 001_initial_schema.sql)
-- ✅ is_book_safe_for_region (fixed above)
-- ✅ is_admin (has it in 002_admin_rls_policy.sql)
-- ✅ submit_review (check below)

-- Check submit_review function (from 008_submit_review_rpc.sql)
-- If it doesn't have SECURITY DEFINER, add it:
DO $$
BEGIN
  -- Check if function exists and needs update
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'submit_review'
      AND prosecdef = false  -- Not SECURITY DEFINER
  ) THEN
    -- Function exists but not secure - recreate it
    RAISE NOTICE 'Function submit_review exists but needs SECURITY DEFINER. Please check migration 008_submit_review_rpc.sql';
  END IF;
END $$;

-- ============================================================================
-- 5. DOCUMENTATION: Remaining Supabase Dashboard warnings
-- ============================================================================

-- ⚠️ Extension in Public (vector):
--    - Issue: pgvector extension is in public schema
--    - Risk: LOW - Standard practice for Supabase projects
--    - Action: DEFER - Moving extensions requires careful migration
--    - Reference: https://supabase.com/docs/guides/database/extensions

-- ⚠️ Leaked Password Protection Disabled:
--    - Issue: HaveIBeenPwned.org integration disabled
--    - Fix: Enable in Supabase Dashboard → Authentication → Settings
--    - Path: Auth Settings → Password Requirements → "Check for breached passwords"
--    - Cannot be fixed via SQL migration

-- ============================================================================
-- 6. Grant Permissions
-- ============================================================================

-- Grant execute on updated function to authenticated users
GRANT EXECUTE ON FUNCTION is_book_safe_for_region TO authenticated, anon;

-- ============================================================================
-- 7. Setup First Admin User (IMPORTANT!)
-- ============================================================================

-- INSTRUCTIONS: Add yourself as admin to allow book imports
--
-- Step 1: Find your User ID in Supabase Dashboard:
--   Dashboard → Authentication → Users → Click on your user → Copy UID
--
-- Step 2: Run this query with YOUR user ID:
--
-- INSERT INTO admin_users (user_id)
-- VALUES ('YOUR_USER_ID_HERE')
-- ON CONFLICT (user_id) DO NOTHING;
--
-- Example:
-- INSERT INTO admin_users (user_id)
-- VALUES ('a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789')
-- ON CONFLICT (user_id) DO NOTHING;

-- Add initial admin user
INSERT INTO admin_users (user_id)
VALUES ('a6b06a4f-b91d-4b56-a365-fdf8df72c62c')
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Security improvements:
-- ✅ source_texts INSERT now requires admin_users membership
-- ✅ is_book_safe_for_region hardened with SECURITY DEFINER
-- ✅ ip_quotas has proper RLS policies (service_role only)
-- ✅ admin_users table created (if not exists)
--
-- NEXT STEPS (REQUIRED):
-- 1. Add yourself as admin (see Section 7 above)
-- 2. Enable "Leaked Password Protection" in Supabase Dashboard
--    Path: Authentication → Configuration → Password Requirements
-- 3. Review vector extension placement (low priority)
--
-- Verify admin status with:
-- SELECT is_admin(); -- Should return true after adding yourself
