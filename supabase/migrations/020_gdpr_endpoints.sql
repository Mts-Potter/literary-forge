-- Migration 020: GDPR Data Export + Account Deletion (Phase 7.3)
-- Date: 2026-05-14
--
-- RPC export_user_data() — liefert alle user-bezogenen Daten als JSON
-- RPC delete_user_account() — Auth-User + alle Daten löschen (cascade)

-- ============================================================================
-- export_user_data — JSON-Dump aller user-bezogenen Tabellen
-- ============================================================================

CREATE OR REPLACE FUNCTION export_user_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_user_progress JSONB;
  v_review_history JSONB;
  v_user_hints JSONB;
  v_user_settings JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_user_progress
  FROM (SELECT * FROM user_progress WHERE user_id = v_user_id) t;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_review_history
  FROM (SELECT * FROM review_history WHERE user_id = v_user_id) t;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_user_hints
  FROM (SELECT * FROM user_hints WHERE user_id = v_user_id) t;

  SELECT COALESCE(row_to_json(t)::jsonb, '{}'::jsonb) INTO v_user_settings
  FROM (SELECT * FROM user_settings WHERE user_id = v_user_id LIMIT 1) t;

  RETURN jsonb_build_object(
    'export_date', NOW(),
    'user_id', v_user_id,
    'user_progress', v_user_progress,
    'review_history', v_review_history,
    'user_hints', v_user_hints,
    'user_settings', v_user_settings
  );
END;
$$;

GRANT EXECUTE ON FUNCTION export_user_data TO authenticated;

COMMENT ON FUNCTION export_user_data IS
'GDPR Art.20: liefert alle user-bezogenen Daten als JSON-Snapshot.';

-- ============================================================================
-- delete_user_account — Löscht user + alle CASCADE-Daten
-- ============================================================================
-- HINWEIS: auth.users-Row löschen ist nur via Service-Role möglich. Diese RPC
-- löscht alle anwendungsdaten und MARKIERT den Auth-User zur Löschung;
-- die finale Löschung des Auth-Users muss via Admin-API erfolgen (separate Route).

CREATE OR REPLACE FUNCTION delete_user_account_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_deleted_counts JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  WITH deletes AS (
    SELECT
      (SELECT COUNT(*) FROM user_progress WHERE user_id = v_user_id) AS progress,
      (SELECT COUNT(*) FROM review_history WHERE user_id = v_user_id) AS history,
      (SELECT COUNT(*) FROM user_hints WHERE user_id = v_user_id) AS hints,
      (SELECT COUNT(*) FROM user_settings WHERE user_id = v_user_id) AS settings,
      (SELECT COUNT(*) FROM user_quotas WHERE user_id = v_user_id) AS quotas
  )
  SELECT row_to_json(d)::jsonb INTO v_deleted_counts FROM deletes d;

  DELETE FROM user_progress WHERE user_id = v_user_id;
  DELETE FROM review_history WHERE user_id = v_user_id;
  DELETE FROM user_hints WHERE user_id = v_user_id;
  DELETE FROM user_settings WHERE user_id = v_user_id;
  DELETE FROM user_quotas WHERE user_id = v_user_id;
  DELETE FROM admin_users WHERE user_id = v_user_id;

  RETURN jsonb_build_object(
    'ok', true,
    'deleted_counts', v_deleted_counts,
    'note', 'Auth user record must be deleted via service_role admin API.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION delete_user_account_data TO authenticated;

COMMENT ON FUNCTION delete_user_account_data IS
'GDPR Art.17: Löscht alle anwendungsdaten des Users. Die finale auth.users-Row-Löschung
erfordert Service-Role (siehe separater Admin-API-Call in /api/admin/delete-user).';

DO $$
BEGIN
  RAISE NOTICE 'Migration 020 ready. GDPR export + delete RPCs available.';
END $$;
