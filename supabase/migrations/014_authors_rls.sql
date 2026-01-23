-- Migration: 014_authors_rls.sql
-- Date: 2026-01-23
--
-- Purpose: Enable RLS on authors table
-- Fixes Supabase warning: "Table public.authors is public, but RLS has not been enabled"

-- ============================================================================
-- Enable RLS on authors table
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "authors_read_policy" ON authors;
DROP POLICY IF EXISTS "authors_admin_write" ON authors;

-- ============================================================================
-- Policy 1: Public read access for all users
-- ============================================================================

-- Everyone can read authors (needed for book display)
CREATE POLICY "authors_read_policy" ON authors
  FOR SELECT TO authenticated, anon
  USING (true);

COMMENT ON POLICY "authors_read_policy" ON authors IS
'Allows all users (authenticated and anonymous) to read author data. Required for displaying book metadata.';

-- ============================================================================
-- Policy 2: Admin-only write access
-- ============================================================================

-- Only admins can modify authors (INSERT, UPDATE, DELETE)
CREATE POLICY "authors_admin_write" ON authors
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  ));

COMMENT ON POLICY "authors_admin_write" ON authors IS
'Only users in admin_users table can create, update, or delete authors.';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Security improvements:
-- ✅ RLS enabled on authors table
-- ✅ Public read access for all users
-- ✅ Admin-only write access
--
-- This fixes the Supabase Dashboard warning:
-- "RLS Disabled in Public - Table public.authors is public, but RLS has not been enabled"
