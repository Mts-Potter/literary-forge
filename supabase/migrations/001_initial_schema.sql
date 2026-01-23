-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Source Texts (die Lerninhalte)
CREATE TABLE source_texts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT,
  content TEXT NOT NULL,
  language TEXT DEFAULT 'de',
  difficulty_level INT CHECK (difficulty_level BETWEEN 1 AND 5),

  -- Vorberechnete Metriken (JSONB für Flexibilität)
  metrics JSONB DEFAULT '{}'::jsonb,

  -- Semantisches Embedding (384 Dimensionen für MiniLM)
  embedding VECTOR(384),

  -- Metadaten für Phase 1 (De-Styling)
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für Vektorsuche (IVFFlat für Free Tier)
CREATE INDEX source_texts_embedding_idx ON source_texts
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- User Progress (SRS-Status)
CREATE TABLE user_progress (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text_id UUID REFERENCES source_texts(id) ON DELETE CASCADE,

  -- SM-2 Algorithm State
  interval INT DEFAULT 1,
  repetitions INT DEFAULT 0,
  ef_factor FLOAT DEFAULT 2.5,
  next_review TIMESTAMPTZ DEFAULT NOW(),

  -- Statistiken
  total_attempts INT DEFAULT 0,
  best_score FLOAT,
  last_attempt_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (user_id, text_id)
);

-- Rate Limiting (Token Bucket)
CREATE TABLE user_quotas (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tokens_remaining INT DEFAULT 5,
  last_reset DATE DEFAULT CURRENT_DATE,
  total_requests INT DEFAULT 0
);

-- Anonymous User Quotas (IP-basiert)
CREATE TABLE ip_quotas (
  ip_address INET PRIMARY KEY,
  tokens_remaining INT DEFAULT 3, -- Weniger für anonyme
  last_reset DATE DEFAULT CURRENT_DATE,
  total_requests INT DEFAULT 0
);

-- Row Level Security Policies
ALTER TABLE source_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_quotas ENABLE ROW LEVEL SECURITY;

-- source_texts: Alle können lesen, nur Service-Role kann schreiben
CREATE POLICY "source_texts_read" ON source_texts
  FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "source_texts_admin" ON source_texts
  FOR ALL TO service_role USING (true);

-- user_progress: User sehen nur eigene Daten
CREATE POLICY "user_progress_crud" ON user_progress
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- user_quotas: User sehen nur eigene Quotas
CREATE POLICY "user_quotas_read" ON user_quotas
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- RPC: Rate Limiting Check (atomare Token-Decrementierung)
CREATE OR REPLACE FUNCTION check_and_consume_quota(
  p_user_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- Security hardening
AS $$
DECLARE
  v_tokens INT;
  v_last_reset DATE;
BEGIN
  -- User-basiert (wenn authenticated)
  IF p_user_id IS NOT NULL THEN
    -- Reset bei neuem Tag
    SELECT tokens_remaining, last_reset INTO v_tokens, v_last_reset
    FROM public.user_quotas WHERE user_id = p_user_id;

    IF v_last_reset < CURRENT_DATE OR v_tokens IS NULL THEN
      INSERT INTO public.user_quotas (user_id, tokens_remaining, last_reset, total_requests)
      VALUES (p_user_id, 5, CURRENT_DATE, 0)
      ON CONFLICT (user_id) DO UPDATE
      SET tokens_remaining = 5, last_reset = CURRENT_DATE;
      v_tokens := 5;
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

  -- IP-basiert (wenn anon)
  ELSIF p_ip_address IS NOT NULL THEN
    SELECT tokens_remaining, last_reset INTO v_tokens, v_last_reset
    FROM public.ip_quotas WHERE ip_address = p_ip_address;

    IF v_last_reset < CURRENT_DATE OR v_tokens IS NULL THEN
      INSERT INTO public.ip_quotas (ip_address, tokens_remaining, last_reset, total_requests)
      VALUES (p_ip_address, 3, CURRENT_DATE, 0)
      ON CONFLICT (ip_address) DO UPDATE
      SET tokens_remaining = 3, last_reset = CURRENT_DATE;
      v_tokens := 3;
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
