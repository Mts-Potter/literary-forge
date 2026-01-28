-- Migration 015: Streak Calculation
-- Date: 2026-01-28
-- Purpose: Calculate learning streaks for gamification

-- Function to calculate current and longest streak
CREATE OR REPLACE FUNCTION calculate_user_streaks(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_review_dates DATE[];
  v_current_streak INT := 0;
  v_longest_streak INT := 0;
  v_temp_streak INT := 0;
  v_expected_date DATE;
  v_last_date DATE;
  v_date DATE;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Get all unique review dates for user (sorted descending)
  SELECT ARRAY_AGG(DISTINCT DATE(created_at) ORDER BY DATE(created_at) DESC)
  INTO v_review_dates
  FROM review_history
  WHERE user_id = p_user_id;

  -- Return zeros if no reviews
  IF v_review_dates IS NULL OR array_length(v_review_dates, 1) = 0 THEN
    RETURN jsonb_build_object(
      'current_streak', 0,
      'longest_streak', 0,
      'last_review_date', NULL
    );
  END IF;

  -- Calculate current streak (counting backwards from today)
  v_expected_date := v_today;
  v_last_date := v_review_dates[1]; -- Most recent review date

  -- Current streak only counts if user reviewed today OR yesterday (grace period)
  IF v_last_date >= v_today - INTERVAL '1 day' THEN
    v_current_streak := 1;
    v_expected_date := v_last_date - INTERVAL '1 day';

    -- Count consecutive days backwards
    FOR i IN 2..array_length(v_review_dates, 1) LOOP
      v_date := v_review_dates[i];

      IF v_date = v_expected_date THEN
        v_current_streak := v_current_streak + 1;
        v_expected_date := v_date - INTERVAL '1 day';
      ELSE
        -- Streak broken
        EXIT;
      END IF;
    END LOOP;
  END IF;

  -- Calculate longest streak (iterate through all dates)
  v_temp_streak := 1;
  v_longest_streak := 1;
  v_last_date := v_review_dates[1];

  FOR i IN 2..array_length(v_review_dates, 1) LOOP
    v_date := v_review_dates[i];

    IF v_last_date - v_date = 1 THEN
      -- Consecutive day
      v_temp_streak := v_temp_streak + 1;
      v_longest_streak := GREATEST(v_longest_streak, v_temp_streak);
    ELSE
      -- Streak broken, reset
      v_temp_streak := 1;
    END IF;

    v_last_date := v_date;
  END LOOP;

  RETURN jsonb_build_object(
    'current_streak', v_current_streak,
    'longest_streak', v_longest_streak,
    'last_review_date', v_review_dates[1]
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION calculate_user_streaks TO authenticated;

-- Add comment
COMMENT ON FUNCTION calculate_user_streaks IS
'Calculates learning streaks for gamification:
- current_streak: Consecutive days of reviews (including today if reviewed)
- longest_streak: Maximum consecutive days ever achieved
- last_review_date: Most recent review date
Grace period: Streak counts as active if last review was today or yesterday';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration 015 completed successfully. Streak calculation function created.';
END $$;
