-- Migration 019: Raise Daily Quotas (Phase 7.1)
-- Date: 2026-05-14
--
-- Erhöht das tägliche LLM-Call-Limit pro authenticated User von 5 auf 50.
-- Pro IP für anonyme User bleibt 3 (anonym ist eh redirected zu Login).
--
-- Non-destructive: ersetzt nur die existing check_and_consume_quota function.

CREATE OR REPLACE FUNCTION check_and_consume_quota(
  p_user_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tokens INT;
  v_last_reset DATE;
  v_daily_user_limit INT := 50;   -- Phase 7.1: war 5
  v_daily_ip_limit INT := 3;
BEGIN
  IF p_user_id IS NOT NULL THEN
    SELECT tokens_remaining, last_reset INTO v_tokens, v_last_reset
    FROM public.user_quotas WHERE user_id = p_user_id;

    IF v_last_reset < CURRENT_DATE OR v_tokens IS NULL THEN
      INSERT INTO public.user_quotas (user_id, tokens_remaining, last_reset, total_requests)
      VALUES (p_user_id, v_daily_user_limit, CURRENT_DATE, 0)
      ON CONFLICT (user_id) DO UPDATE
        SET tokens_remaining = v_daily_user_limit, last_reset = CURRENT_DATE;
      v_tokens := v_daily_user_limit;
    END IF;

    IF v_tokens > 0 THEN
      UPDATE public.user_quotas
      SET tokens_remaining = tokens_remaining - 1,
          total_requests = total_requests + 1
      WHERE user_id = p_user_id;
      RETURN TRUE;
    ELSE
      RETURN FALSE;
    END IF;

  ELSIF p_ip_address IS NOT NULL THEN
    SELECT tokens_remaining, last_reset INTO v_tokens, v_last_reset
    FROM public.ip_quotas WHERE ip_address = p_ip_address;

    IF v_last_reset < CURRENT_DATE OR v_tokens IS NULL THEN
      INSERT INTO public.ip_quotas (ip_address, tokens_remaining, last_reset, total_requests)
      VALUES (p_ip_address, v_daily_ip_limit, CURRENT_DATE, 0)
      ON CONFLICT (ip_address) DO UPDATE
        SET tokens_remaining = v_daily_ip_limit, last_reset = CURRENT_DATE;
      v_tokens := v_daily_ip_limit;
    END IF;

    IF v_tokens > 0 THEN
      UPDATE public.ip_quotas
      SET tokens_remaining = tokens_remaining - 1,
          total_requests = total_requests + 1
      WHERE ip_address = p_ip_address;
      RETURN TRUE;
    ELSE
      RETURN FALSE;
    END IF;
  END IF;

  RETURN FALSE;
END;
$$;

DO $$
BEGIN
  RAISE NOTICE 'Migration 019: user quota raised from 5 to 50/day.';
END $$;
