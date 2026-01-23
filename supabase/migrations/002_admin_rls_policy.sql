-- Migration: Admin RLS Policy für Book Import
-- Datum: 2025-01-21
--
-- Zweck: Ermöglicht authentifizierten Admins das Einfügen von source_texts
--        ohne service_role Key im Frontend zu benötigen

-- 1. Neue Tabelle für Admin-Rollen
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id) -- Optional: Tracking wer Admin-Rechte gegeben hat
);

-- Enable RLS auf admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Admins können ihre eigene Rolle sehen
CREATE POLICY "admins_can_view_own_role" ON admin_users
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Nur Service-Role kann Admin-Rollen verwalten
CREATE POLICY "service_role_manages_admins" ON admin_users
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Neue Policy für source_texts INSERT durch Admins
CREATE POLICY "authenticated_admins_can_insert_texts" ON source_texts
  FOR INSERT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  ));

-- 3. Helper Function: Prüft ob ein User Admin ist
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

-- 4. Kommentare für Dokumentation
COMMENT ON TABLE admin_users IS 'Speichert Admin-Rollen für Book Import und andere privilegierte Operationen';
COMMENT ON FUNCTION is_admin IS 'Helper Function - Prüft ob ein User Admin-Rechte hat';

-- 5. Grant Permissions
GRANT SELECT ON admin_users TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;

-- ============================================================================
-- ANLEITUNG: Admin hinzufügen
-- ============================================================================
--
-- Um einen User zum Admin zu machen, führe folgendes aus:
--
-- 1. Finde die User-ID in der Supabase UI:
--    Authentication → Users → Klicke auf den User → Kopiere die UID
--
-- 2. Füge den User zur admin_users Tabelle hinzu:
--
-- INSERT INTO admin_users (user_id)
-- VALUES ('PASTE_USER_ID_HERE');
--
-- Beispiel:
-- INSERT INTO admin_users (user_id)
-- VALUES ('a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789');
--
-- ============================================================================

-- Optional: Erste Admin-User automatisch hinzufügen (nur beim ersten Setup)
-- WICHTIG: Ersetze 'YOUR_EMAIL@EXAMPLE.COM' mit deiner tatsächlichen Email
--
-- INSERT INTO admin_users (user_id)
-- SELECT id FROM auth.users
-- WHERE email = 'YOUR_EMAIL@EXAMPLE.COM'
-- ON CONFLICT (user_id) DO NOTHING;
