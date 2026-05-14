-- Migration 016: Extended Style Features + Author Style Profiles
-- Date: 2026-05-14 (Phase 2 der Renovierung)
--
-- Purpose:
-- 1. Neue Tabelle author_style_profiles mit aggregierten Stilfeatures pro Autor
-- 2. RPC recompute_author_profile() zur Aktualisierung nach Reprocessing
-- 3. source_texts.metrics JSONB bleibt unverändert (Schema flexibel, alte Daten kompatibel)
--
-- Non-destructive: keine DROP-Operationen, alte 3-Feld-Metriken bleiben lesbar.

-- ============================================================================
-- 1. Author Style Profiles
-- ============================================================================

CREATE TABLE IF NOT EXISTS author_style_profiles (
  author_id UUID PRIMARY KEY REFERENCES authors(id) ON DELETE CASCADE,
  feature_means JSONB NOT NULL DEFAULT '{}'::jsonb,
  feature_stddevs JSONB NOT NULL DEFAULT '{}'::jsonb,
  chunk_count INT NOT NULL DEFAULT 0,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE author_style_profiles IS
'Aggregierte Stilfeatures pro Autor (Mittelwert + Standardabweichung). Basis für
Burrows''-Delta-basierten Score in /api/train/submit.';

COMMENT ON COLUMN author_style_profiles.feature_means IS
'Mittelwert jedes Stilfeatures über alle Chunks dieses Autors. Schema folgt
features-Output von nlp-service (avg_sentence_length, mtld, adj_ratio, etc.).';

COMMENT ON COLUMN author_style_profiles.feature_stddevs IS
'Standardabweichung jedes Features. Für z-Score-Berechnung beim Stilvergleich.';

-- ============================================================================
-- 2. RLS — Lesen für alle authenticated, Schreiben nur via SECURITY DEFINER RPC
-- ============================================================================

ALTER TABLE author_style_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "author_style_profiles_read" ON author_style_profiles;
CREATE POLICY "author_style_profiles_read" ON author_style_profiles
  FOR SELECT TO authenticated, anon
  USING (true);

-- INSERT/UPDATE/DELETE nur via service_role (RPC nutzt SECURITY DEFINER).
DROP POLICY IF EXISTS "author_style_profiles_admin" ON author_style_profiles;
CREATE POLICY "author_style_profiles_admin" ON author_style_profiles
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 3. RPC: recompute_author_profile(author_id)
-- ============================================================================
-- Berechnet feature_means + feature_stddevs für einen Autor aus allen seinen
-- source_texts-Chunks. Wird nach Reprocessing aufgerufen.
--
-- Annahme: source_texts.metrics enthält Felder wie:
--   avg_sentence_length, sentence_length_variance, mtld, ttr, hapax_ratio,
--   adj_ratio, adj_verb_ratio, dependency_distance, punctuation_per_sentence,
--   sub_sentence_ratio, compound_ratio, direct_speech_ratio
-- (numerisch, alle als JSONB-Number).
--
-- Verschachtelte Objekte (function_word_frequencies, sentence_opening_distribution,
-- word_length_distribution, tense_distribution) werden NICHT aggregiert — die
-- liest die Anwendung bei Bedarf direkt vom Chunk.

CREATE OR REPLACE FUNCTION recompute_author_profile(p_author_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_chunk_count INT;
  v_features JSONB;
  v_means JSONB := '{}'::jsonb;
  v_stddevs JSONB := '{}'::jsonb;
  v_feature_keys TEXT[] := ARRAY[
    'avg_sentence_length',
    'sentence_length_variance',
    'sentence_length_stddev',
    'mtld',
    'ttr',
    'hapax_ratio',
    'avg_word_length',
    'adj_ratio',
    'adv_ratio',
    'adj_verb_ratio',
    'dependency_distance',
    'punctuation_per_sentence',
    'sub_sentence_ratio',
    'compound_ratio',
    'direct_speech_ratio'
  ];
  v_key TEXT;
  v_mean FLOAT;
  v_stddev FLOAT;
BEGIN
  SELECT COUNT(*) INTO v_chunk_count
  FROM source_texts
  WHERE author_id = p_author_id
    AND metrics IS NOT NULL
    AND metrics ? 'avg_sentence_length';

  IF v_chunk_count = 0 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'no_chunks_with_extended_metrics',
      'author_id', p_author_id
    );
  END IF;

  FOREACH v_key IN ARRAY v_feature_keys LOOP
    SELECT
      AVG((metrics->>v_key)::float),
      COALESCE(STDDEV_POP((metrics->>v_key)::float), 0)
    INTO v_mean, v_stddev
    FROM source_texts
    WHERE author_id = p_author_id
      AND metrics ? v_key
      AND (metrics->>v_key) ~ '^-?[0-9]+(\.[0-9]+)?$';

    IF v_mean IS NOT NULL THEN
      v_means := v_means || jsonb_build_object(v_key, v_mean);
      v_stddevs := v_stddevs || jsonb_build_object(v_key, v_stddev);
    END IF;
  END LOOP;

  INSERT INTO author_style_profiles (author_id, feature_means, feature_stddevs, chunk_count, computed_at)
  VALUES (p_author_id, v_means, v_stddevs, v_chunk_count, NOW())
  ON CONFLICT (author_id) DO UPDATE SET
    feature_means = EXCLUDED.feature_means,
    feature_stddevs = EXCLUDED.feature_stddevs,
    chunk_count = EXCLUDED.chunk_count,
    computed_at = NOW();

  RETURN jsonb_build_object(
    'ok', true,
    'author_id', p_author_id,
    'chunk_count', v_chunk_count,
    'feature_keys', v_feature_keys
  );
END;
$$;

COMMENT ON FUNCTION recompute_author_profile IS
'Aggregiert Stilfeatures eines Autors aus allen seinen source_texts-Chunks und
schreibt feature_means + feature_stddevs in author_style_profiles. Nach
Reprocessing für jeden Autor aufzurufen.';

GRANT EXECUTE ON FUNCTION recompute_author_profile TO authenticated, service_role;

-- ============================================================================
-- 4. Bulk-Wrapper: recompute_all_author_profiles()
-- ============================================================================
-- Bequeme Convenience-Function für den Reprocessing-Run.

CREATE OR REPLACE FUNCTION recompute_all_author_profiles()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_author RECORD;
  v_results JSONB := '[]'::jsonb;
  v_result JSONB;
BEGIN
  FOR v_author IN
    SELECT DISTINCT author_id FROM source_texts WHERE author_id IS NOT NULL
  LOOP
    v_result := recompute_author_profile(v_author.author_id);
    v_results := v_results || jsonb_build_array(v_result);
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'profiles_updated', jsonb_array_length(v_results),
    'results', v_results
  );
END;
$$;

COMMENT ON FUNCTION recompute_all_author_profiles IS
'Bulk-Aufruf von recompute_author_profile für alle Autoren mit Chunks.';

GRANT EXECUTE ON FUNCTION recompute_all_author_profiles TO service_role;

-- ============================================================================
-- DONE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 016 ready. Apply via Supabase SQL Editor or supabase db push.';
END $$;
