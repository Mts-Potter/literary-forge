-- Migration: 003_enhanced_metadata.sql
-- Date: 2026-01-21
--
-- Purpose: Adds comprehensive metadata architecture for book catalog with:
--   1. Authors table (normalized author data)
--   2. Dual-compliance tracking (US/EU copyright status)
--   3. Pedagogical metadata (CEFR, Lexile, tags)
--   4. Bibliographic data (publication year, source URLs)

-- ============================================================================
-- 1. Authors Table (Normalization)
-- ============================================================================

CREATE TABLE IF NOT EXISTS authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  birth_year INT,
  death_year INT,
  nationality TEXT,
  wikidata_id TEXT, -- For external reference (e.g., Q905 for Kafka)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for copyright calculations (death_year critical for PD status)
CREATE INDEX authors_death_year_idx ON authors(death_year);

-- ============================================================================
-- 2. Extend source_texts with Enhanced Metadata
-- ============================================================================

-- Author relationship (replaces author TEXT column)
ALTER TABLE source_texts ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES authors(id) ON DELETE SET NULL;

-- Compliance Tracking (Hybrid approach: Boolean + JSONB)
-- Boolean columns for fast filtering, JSONB for detailed documentation
ALTER TABLE source_texts ADD COLUMN IF NOT EXISTS is_pd_us BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE source_texts ADD COLUMN IF NOT EXISTS is_pd_eu BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE source_texts ADD COLUMN IF NOT EXISTS rights_details JSONB DEFAULT '{}'::jsonb;

-- rights_details expected structure:
-- {
--   "verification_date": "2026-01-21",
--   "us_rationale": "published_pre_1931",
--   "eu_rationale": "author_died_1955",
--   "edge_case_notes": "Optional notes for special cases"
-- }

-- Pedagogical Metadata (Type-safe via CHECK constraints)
ALTER TABLE source_texts ADD COLUMN IF NOT EXISTS cefr_level TEXT
  CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2'));

ALTER TABLE source_texts ADD COLUMN IF NOT EXISTS lexile_score INT
  CHECK (lexile_score BETWEEN 0 AND 2000);

ALTER TABLE source_texts ADD COLUMN IF NOT EXISTS estimated_reading_time_minutes INT
  CHECK (estimated_reading_time_minutes > 0);

-- Bibliographic Data
ALTER TABLE source_texts ADD COLUMN IF NOT EXISTS publication_year INT
  CHECK (publication_year > 0);

ALTER TABLE source_texts ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE source_texts ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Ensure original_language column exists (may already be from 001)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'source_texts' AND column_name = 'original_language'
  ) THEN
    ALTER TABLE source_texts ADD COLUMN original_language TEXT DEFAULT 'de';
  END IF;
END $$;

-- Genre/Category Tags (PostgreSQL Array with GIN index for fast search)
ALTER TABLE source_texts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- ============================================================================
-- 3. Indexes for Performance
-- ============================================================================

-- GIN index for array operations (WHERE tags @> ARRAY['Klassiker'])
CREATE INDEX IF NOT EXISTS source_texts_tags_idx ON source_texts USING GIN(tags);

-- Partial index for "global safe" books (both US and EU)
CREATE INDEX IF NOT EXISTS source_texts_pd_combined_idx
  ON source_texts(is_pd_us, is_pd_eu)
  WHERE is_pd_us = true AND is_pd_eu = true;

-- Index for CEFR filtering
CREATE INDEX IF NOT EXISTS source_texts_cefr_idx ON source_texts(cefr_level)
  WHERE cefr_level IS NOT NULL;

-- ============================================================================
-- 4. Helper Functions
-- ============================================================================

-- Check if a book is safe for a specific region/jurisdiction
CREATE OR REPLACE FUNCTION is_book_safe_for_region(
  p_text_id UUID,
  p_region TEXT -- 'US', 'EU', 'GLOBAL'
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT
    CASE
      WHEN p_region = 'US' THEN is_pd_us
      WHEN p_region = 'EU' THEN is_pd_eu
      WHEN p_region = 'GLOBAL' THEN (is_pd_us AND is_pd_eu)
      ELSE false
    END
  FROM source_texts
  WHERE id = p_text_id;
$$;

COMMENT ON FUNCTION is_book_safe_for_region IS 'Helper function to check copyright status for specific jurisdictions';

-- ============================================================================
-- 5. Data Migration (Existing Records)
-- ============================================================================

-- Create "Unknown Author" placeholder for existing records without author
INSERT INTO authors (id, name, death_year, nationality)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Unbekannt',
  NULL,
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- Migrate existing records to use Unknown Author if author_id is NULL
UPDATE source_texts
SET author_id = '00000000-0000-0000-0000-000000000001'
WHERE author_id IS NULL;

-- ============================================================================
-- 6. Row Level Security (RLS) Extensions
-- ============================================================================

-- Authors table: Read-only for authenticated users
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authors_read_policy" ON authors
  FOR SELECT TO authenticated, anon
  USING (true);

-- Only admins can modify authors (reuse existing admin_users table from 002)
CREATE POLICY "authors_admin_write" ON authors
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  ));

-- ============================================================================
-- 7. Comments for Documentation
-- ============================================================================

COMMENT ON TABLE authors IS 'Normalized author data with biographical info for copyright calculations';
COMMENT ON COLUMN source_texts.author_id IS 'Foreign key to authors table (replaces old author TEXT field)';
COMMENT ON COLUMN source_texts.is_pd_us IS 'Boolean: True if public domain in USA';
COMMENT ON COLUMN source_texts.is_pd_eu IS 'Boolean: True if public domain in EU/Germany';
COMMENT ON COLUMN source_texts.rights_details IS 'JSONB: Detailed copyright verification metadata';
COMMENT ON COLUMN source_texts.cefr_level IS 'Common European Framework of Reference level (A1-C2)';
COMMENT ON COLUMN source_texts.lexile_score IS 'Lexile reading level (0-2000), primarily for English texts';
COMMENT ON COLUMN source_texts.tags IS 'Array of genre/category tags for filtering';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Seed authors (Kafka, Mann, Schnitzler, etc.)
-- 2. Update existing source_texts with new metadata
-- 3. Update TypeScript types to match new schema
