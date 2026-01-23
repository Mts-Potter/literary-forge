-- Migration: 005_allow_authenticated_insert.sql
-- Date: 2026-01-21
--
-- Purpose: Allow authenticated users to insert books via BookIngestionUI
-- TEMPORARY: In production, restrict this to admin_users only
--
-- Security Note: This grants INSERT permission to ALL authenticated users
-- For production, replace with admin-role-based policy

-- Allow authenticated users to insert into source_texts
CREATE POLICY "authenticated_can_insert_texts" ON source_texts
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Optional: Allow authenticated users to update their own texts
-- CREATE POLICY "authenticated_can_update_own_texts" ON source_texts
--   FOR UPDATE TO authenticated
--   USING (true)
--   WITH CHECK (true);

COMMENT ON POLICY "authenticated_can_insert_texts" ON source_texts IS
'TEMPORARY: Allows all authenticated users to insert books. Replace with admin-only policy in production.';
