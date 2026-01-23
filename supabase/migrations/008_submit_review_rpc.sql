-- Migration 008: Submit Review RPC Function with FSRS
-- Date: 2026-01-22
-- Purpose: Atomic function to log review and update FSRS scheduling state
--
-- This function ensures transactional integrity:
-- 1. Logs the review to review_history
-- 2. Updates the user_progress table with new FSRS state
-- 3. Returns scheduling information (next_review, interval, grade)
--
-- Security: SECURITY DEFINER with hardened search_path

CREATE OR REPLACE FUNCTION submit_review(
  p_text_id UUID,
  p_user_text TEXT,
  p_accuracy_score FLOAT,
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
  v_grade INT;
  v_current_progress RECORD;
  v_next_review TIMESTAMPTZ;
  v_interval_days INT;
  v_new_difficulty FLOAT;
  v_new_stability FLOAT;
  v_new_state SMALLINT;
BEGIN
  -- 1. Validate user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User must be logged in to submit reviews';
  END IF;

  -- 2. Validate accuracy_score
  IF p_accuracy_score < 0 OR p_accuracy_score > 100 THEN
    RAISE EXCEPTION 'Invalid accuracy_score: Must be between 0 and 100, got %', p_accuracy_score;
  END IF;

  -- 3. Map continuous accuracy score to discrete FSRS grade (1-4)
  -- Based on pedagogical thresholds from FSRS research
  v_grade := CASE
    WHEN p_accuracy_score < 55 THEN 1  -- Again: Complete failure, reset
    WHEN p_accuracy_score < 78 THEN 2  -- Hard: Struggled but passed
    WHEN p_accuracy_score < 92 THEN 3  -- Good: Solid performance
    ELSE 4                              -- Easy: Mastery
  END;

  -- 4. Fetch current FSRS state (or NULL if first review)
  SELECT * INTO v_current_progress
  FROM public.user_progress
  WHERE user_id = v_user_id AND text_id = p_text_id;

  -- 5. Calculate new FSRS state (simplified algorithm - full calculation in TypeScript)
  -- This is a fallback approximation; the TypeScript FSRS library does the real math
  IF v_current_progress IS NULL THEN
    -- NEW CARD: First review
    v_new_difficulty := 5.0; -- Start at medium difficulty
    v_new_state := 1; -- Learning state

    v_interval_days := CASE v_grade
      WHEN 1 THEN 0.007  -- Again: 10 minutes (10/1440 days) - Anki-style short interval
      WHEN 2 THEN 0.25   -- Hard: 6 hours (0.25 days) - needs more practice
      WHEN 3 THEN 1      -- Good: 1 day - solid performance
      ELSE 4             -- Easy: 4 days - mastery level
    END;

    v_new_stability := v_interval_days::FLOAT;

  ELSE
    -- EXISTING CARD: Update based on grade
    v_new_difficulty := v_current_progress.difficulty;
    v_new_state := v_current_progress.state;

    IF v_grade = 1 THEN
      -- FAILURE: Reset to relearning
      v_interval_days := 1;
      v_new_stability := 1.0;
      v_new_state := 3; -- Relearning
      v_new_difficulty := LEAST(10.0, v_current_progress.difficulty + 0.5); -- Slightly harder

    ELSE
      -- SUCCESS: Expand interval
      -- Simplified formula: new_interval = old_interval * (1 + (grade - 2) * 0.5)
      -- Grade 2 (Hard): multiply by 1.0 (no change)
      -- Grade 3 (Good): multiply by 1.5 (50% increase)
      -- Grade 4 (Easy): multiply by 2.0 (100% increase)
      v_interval_days := GREATEST(1, ROUND(
        v_current_progress.scheduled_days * (1.0 + (v_grade - 2) * 0.5)
      ));

      v_new_stability := v_interval_days::FLOAT;
      v_new_difficulty := GREATEST(1.0, v_current_progress.difficulty - 0.1); -- Slightly easier
      v_new_state := 2; -- Review (graduated)
    END IF;
  END IF;

  -- 6. Calculate next review timestamp
  v_next_review := NOW() + (v_interval_days || ' days')::INTERVAL;

  -- 7. Insert review into history (for analytics)
  INSERT INTO public.review_history (
    user_id,
    text_id,
    user_text,
    accuracy_score,
    grade,
    duration_seconds,
    feedback_json,
    difficulty_snapshot,
    stability_snapshot
  )
  VALUES (
    v_user_id,
    p_text_id,
    p_user_text,
    p_accuracy_score,
    v_grade,
    p_duration_seconds,
    p_feedback_json,
    v_new_difficulty,
    v_new_stability
  );

  -- 8. Upsert user_progress (FSRS state)
  INSERT INTO public.user_progress (
    user_id,
    text_id,
    difficulty,
    stability,
    state,
    elapsed_days,
    scheduled_days,
    reps,
    lapses,
    next_review,
    last_review_date,
    total_attempts,
    best_score,
    last_attempt_at,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    p_text_id,
    v_new_difficulty,
    v_new_stability,
    v_new_state,
    0, -- Just reviewed, so elapsed_days = 0
    v_interval_days,
    CASE WHEN v_grade >= 3 THEN 1 ELSE 0 END, -- Count successful reps
    CASE WHEN v_grade = 1 THEN 1 ELSE 0 END,  -- Count lapses
    v_next_review,
    CURRENT_DATE,
    1, -- First attempt
    p_accuracy_score,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, text_id) DO UPDATE SET
    difficulty = v_new_difficulty,
    stability = v_new_stability,
    state = v_new_state,
    elapsed_days = 0, -- Just reviewed
    scheduled_days = v_interval_days,
    reps = user_progress.reps + (CASE WHEN v_grade >= 3 THEN 1 ELSE 0 END),
    lapses = user_progress.lapses + (CASE WHEN v_grade = 1 THEN 1 ELSE 0 END),
    next_review = v_next_review,
    last_review_date = CURRENT_DATE,
    total_attempts = user_progress.total_attempts + 1,
    best_score = GREATEST(user_progress.best_score, p_accuracy_score),
    last_attempt_at = NOW(),
    updated_at = NOW();

  -- 9. Return scheduling info as JSON
  RETURN jsonb_build_object(
    'success', true,
    'grade', v_grade,
    'interval_days', v_interval_days,
    'next_review', v_next_review,
    'difficulty', v_new_difficulty,
    'stability', v_new_stability,
    'state', v_new_state,
    'message', CASE v_grade
      WHEN 1 THEN 'Keep practicing! This text is challenging. Review again soon.'
      WHEN 2 THEN 'Good effort. The style takes practice to master.'
      WHEN 3 THEN 'Well done! You captured the voice. Review again in ' || v_interval_days || ' days.'
      ELSE 'Excellent! You''ve mastered this passage. Review again in ' || v_interval_days || ' days.'
    END
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log error and re-raise with context
    RAISE EXCEPTION 'submit_review failed for user % and text %: %', v_user_id, p_text_id, SQLERRM;
END;
$$;

COMMENT ON FUNCTION submit_review IS
'Submits a stylistic imitation review, logs it to history, updates FSRS state atomically, and returns next review date.
Parameters:
- p_text_id: UUID of the source_texts chunk being reviewed
- p_user_text: The user''s stylistic imitation attempt
- p_accuracy_score: Overall accuracy (0-100) from LLM judge
- p_duration_seconds: Optional time taken to write (for analytics)
- p_feedback_json: Optional full LLM response (scores, feedback text)
Returns: JSON with grade, interval, next_review timestamp, and user-friendly message';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration 008 completed successfully. submit_review RPC function is now available.';
END $$;
