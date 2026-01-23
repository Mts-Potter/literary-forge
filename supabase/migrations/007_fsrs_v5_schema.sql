-- Migration 007: FSRS v5 Schema
-- Date: 2026-01-22
-- Purpose: Upgrade user_progress from SM-2 to FSRS v5 algorithm
--
-- FSRS (Free Spaced Repetition Scheduler) v5 uses a DSR model:
-- - Difficulty (D): Intrinsic complexity of the material (1-10)
-- - Stability (S): Memory strength in days (time to 90% retrievability)
-- - Retrievability (R): Calculated on-the-fly from S and elapsed time
--
-- This provides better scheduling for complex creative tasks like stylistic imitation
-- compared to the simplistic SM-2 algorithm.

-- 1. Drop old SM-2 columns (if they exist)
ALTER TABLE user_progress DROP COLUMN IF EXISTS ef_factor;
ALTER TABLE user_progress DROP COLUMN IF EXISTS interval;
ALTER TABLE user_progress DROP COLUMN IF EXISTS repetitions;

-- 2. Add FSRS v5 state columns
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS difficulty FLOAT DEFAULT 5.0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS stability FLOAT DEFAULT 0.0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS state SMALLINT DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS elapsed_days INT DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS scheduled_days INT DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS reps INT DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS lapses INT DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS last_review_date DATE;

-- 3. Create index on next_review for efficient queue queries
-- This index is critical for the /train page to quickly fetch due reviews
-- Note: Removed WHERE clause with NOW() since it's not immutable
-- The query will still use this index efficiently
CREATE INDEX IF NOT EXISTS idx_user_progress_due
ON user_progress(user_id, next_review);

-- 4. Add comments for documentation
COMMENT ON COLUMN user_progress.difficulty IS
'FSRS: Intrinsic complexity of text (1-10). Higher = harder to master. This is distinct from the user''s current memory strength.';

COMMENT ON COLUMN user_progress.stability IS
'FSRS: Memory strength in days. Represents the time interval until retrievability drops to 90%. Updated after each review.';

COMMENT ON COLUMN user_progress.state IS
'FSRS Card State: 0=New (never reviewed), 1=Learning (short intervals), 2=Review (graduated), 3=Relearning (after failure)';

COMMENT ON COLUMN user_progress.elapsed_days IS
'Days elapsed since last review. Used to calculate current retrievability.';

COMMENT ON COLUMN user_progress.scheduled_days IS
'Days until next review (from last_review_date). This is the interval chosen by FSRS.';

COMMENT ON COLUMN user_progress.reps IS
'Total successful reviews where grade >= 3 (Good or Easy). Reset on lapse.';

COMMENT ON COLUMN user_progress.lapses IS
'Total failures where grade = 1 (Again). Indicates texts that need more practice.';

COMMENT ON COLUMN user_progress.last_review_date IS
'Date (not timestamp) of last review. Used to calculate elapsed_days and detect daily resets.';

-- 5. Create review_history table (analytics & debugging)
CREATE TABLE IF NOT EXISTS review_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text_id UUID NOT NULL REFERENCES source_texts(id) ON DELETE CASCADE,

  -- Review data
  user_text TEXT NOT NULL,
  accuracy_score FLOAT NOT NULL CHECK (accuracy_score BETWEEN 0 AND 100),
  grade SMALLINT NOT NULL CHECK (grade BETWEEN 1 AND 4),
  duration_seconds INT,

  -- LLM feedback (full JSON response from Anthropic/Groq)
  feedback_json JSONB,

  -- FSRS state snapshot (for analytics)
  difficulty_snapshot FLOAT,
  stability_snapshot FLOAT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fetching user's review history
CREATE INDEX IF NOT EXISTS idx_review_history_user
ON review_history(user_id, created_at DESC);

-- Index for analyzing specific text performance
CREATE INDEX IF NOT EXISTS idx_review_history_text
ON review_history(text_id, created_at DESC);

COMMENT ON TABLE review_history IS
'Historical log of all review attempts. Used for analytics, progress tracking, and debugging FSRS scheduling.';

-- 6. Enable RLS on review_history
ALTER TABLE review_history ENABLE ROW LEVEL SECURITY;

-- Users can only read their own review history
CREATE POLICY "review_history_read_own" ON review_history
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- System can insert reviews (via RPC function)
CREATE POLICY "review_history_insert" ON review_history
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 7. Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration 007 completed successfully. FSRS v5 schema is now active.';
END $$;
