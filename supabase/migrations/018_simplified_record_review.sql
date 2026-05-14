-- Migration 018: Simplified record_review RPC (Phase 5)
-- Date: 2026-05-14
--
-- Purpose: Replace the SM-2-light heuristic in submit_review (Migration 008)
-- with a dumb persistence RPC. FSRS math is now done client-side in TypeScript
-- via lib/srs/fsrs.ts (ts-fsrs library).
--
-- Migration 008's submit_review remains intact for rollback.

CREATE OR REPLACE FUNCTION record_review(
  p_text_id UUID,
  p_user_text TEXT,
  p_accuracy_score FLOAT,
  p_grade INT,
  p_new_difficulty FLOAT,
  p_new_stability FLOAT,
  p_new_state SMALLINT,
  p_new_scheduled_days INT,
  p_next_review TIMESTAMPTZ,
  p_duration_seconds INT DEFAULT NULL,
  p_feedback_json JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User must be logged in';
  END IF;

  IF p_accuracy_score < 0 OR p_accuracy_score > 100 THEN
    RAISE EXCEPTION 'Invalid accuracy_score: % (must be 0-100)', p_accuracy_score;
  END IF;
  IF p_grade < 1 OR p_grade > 4 THEN
    RAISE EXCEPTION 'Invalid grade: % (must be 1-4)', p_grade;
  END IF;

  -- Log to review_history (analytics)
  INSERT INTO review_history (
    user_id, text_id, user_text, accuracy_score, grade,
    duration_seconds, feedback_json,
    difficulty_snapshot, stability_snapshot
  )
  VALUES (
    v_user_id, p_text_id, p_user_text, p_accuracy_score, p_grade,
    p_duration_seconds, p_feedback_json,
    p_new_difficulty, p_new_stability
  );

  -- Upsert user_progress with FSRS state computed in TypeScript
  INSERT INTO user_progress (
    user_id, text_id,
    difficulty, stability, state,
    elapsed_days, scheduled_days,
    reps, lapses,
    next_review, last_review_date,
    total_attempts, best_score, last_attempt_at,
    created_at, updated_at
  )
  VALUES (
    v_user_id, p_text_id,
    p_new_difficulty, p_new_stability, p_new_state,
    0, p_new_scheduled_days,
    CASE WHEN p_grade >= 3 THEN 1 ELSE 0 END,
    CASE WHEN p_grade = 1 THEN 1 ELSE 0 END,
    p_next_review, CURRENT_DATE,
    1, p_accuracy_score, NOW(),
    NOW(), NOW()
  )
  ON CONFLICT (user_id, text_id) DO UPDATE SET
    difficulty = p_new_difficulty,
    stability = p_new_stability,
    state = p_new_state,
    elapsed_days = 0,
    scheduled_days = p_new_scheduled_days,
    reps = user_progress.reps + CASE WHEN p_grade >= 3 THEN 1 ELSE 0 END,
    lapses = user_progress.lapses + CASE WHEN p_grade = 1 THEN 1 ELSE 0 END,
    next_review = p_next_review,
    last_review_date = CURRENT_DATE,
    total_attempts = user_progress.total_attempts + 1,
    best_score = GREATEST(user_progress.best_score, p_accuracy_score),
    last_attempt_at = NOW(),
    updated_at = NOW();

  RETURN jsonb_build_object(
    'success', true,
    'grade', p_grade,
    'interval_days', p_new_scheduled_days,
    'next_review', p_next_review,
    'difficulty', p_new_difficulty,
    'stability', p_new_stability,
    'state', p_new_state,
    'message', CASE p_grade
      WHEN 1 THEN 'Keep practicing! Review again soon.'
      WHEN 2 THEN 'Good effort. The style takes practice.'
      WHEN 3 THEN 'Well done! Review again in ' || p_new_scheduled_days || ' days.'
      ELSE 'Excellent! Review again in ' || p_new_scheduled_days || ' days.'
    END
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'record_review failed for user % text %: %', v_user_id, p_text_id, SQLERRM;
END;
$$;

COMMENT ON FUNCTION record_review IS
'Persistiert FSRS-Review-State + Log ohne eigene Math. FSRS-Berechnung
erfolgt im TS-Code via ts-fsrs Library. Ersetzt submit_review (Migration 008).';

GRANT EXECUTE ON FUNCTION record_review TO authenticated;

DO $$
BEGIN
  RAISE NOTICE 'Migration 018 ready. record_review RPC available.';
END $$;
