-- Migration 017: Multi-Mode Schema (Phase 4)
-- Date: 2026-05-14
--
-- Erweitert user_progress um mode/phase und legt user_hints für den
-- Franklin-Loop an. Non-destructive: alle bestehenden user_progress-Einträge
-- bekommen 'free' als Default-Modus.

-- ============================================================================
-- 1. user_progress erweitern um Mode/Phase
-- ============================================================================

ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'free'
    CHECK (mode IN ('franklin', 'cloze', 'free'));

ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS phase TEXT NOT NULL DEFAULT 'retrieval'
    CHECK (phase IN ('encoding', 'retrieval', 'mastered'));

ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS cloze_level SMALLINT NOT NULL DEFAULT 1
    CHECK (cloze_level BETWEEN 1 AND 4);

COMMENT ON COLUMN user_progress.mode IS
'Lern-Modus für diese Karte: franklin (Hint-Loop), cloze (Lückentext), free (Free-Writing).';

COMMENT ON COLUMN user_progress.phase IS
'Phase innerhalb des Franklin-Loops: encoding (Tag 0: Lesen+Hints), retrieval (spätere Reviews), mastered.';

COMMENT ON COLUMN user_progress.cloze_level IS
'Cloze-Schwierigkeitsstufe 1-4: 1=Funktionswörter, 2=+Verben, 3=+Adjektive, 4=Nur Satzgerüst.';

-- ============================================================================
-- 2. user_hints — User-generierte Sentence-Hints für Franklin-Loop
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_hints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text_id UUID NOT NULL REFERENCES source_texts(id) ON DELETE CASCADE,
  hints JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, text_id)
);

COMMENT ON TABLE user_hints IS
'Sentence-Level-Hints, die der User in der Encoding-Phase des Franklin-Loops schreibt.
hints JSONB enthält: [{sentence_idx: 0, hint: "..."}, ...]';

CREATE INDEX IF NOT EXISTS idx_user_hints_user
  ON user_hints(user_id, text_id);

-- ============================================================================
-- 3. RLS Policies
-- ============================================================================

ALTER TABLE user_hints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_hints_select_own" ON user_hints;
CREATE POLICY "user_hints_select_own" ON user_hints
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_hints_insert_own" ON user_hints;
CREATE POLICY "user_hints_insert_own" ON user_hints
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_hints_update_own" ON user_hints;
CREATE POLICY "user_hints_update_own" ON user_hints
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_hints_delete_own" ON user_hints;
CREATE POLICY "user_hints_delete_own" ON user_hints
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. user_settings erweitern um Default-Mode + Onboarded-Flag
-- ============================================================================

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS default_mode TEXT NOT NULL DEFAULT 'franklin'
    CHECK (default_mode IN ('franklin', 'cloze', 'free'));

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;

COMMENT ON COLUMN user_settings.default_mode IS
'Default-Lern-Modus für neue Karten dieses Users. Franklin = Empfehlung.';

COMMENT ON COLUMN user_settings.onboarded_at IS
'Zeitstempel des Onboarding-Abschlusses. NULL = noch nicht onboarded.';

DO $$
BEGIN
  RAISE NOTICE 'Migration 017 ready. Multi-mode schema available.';
END $$;
