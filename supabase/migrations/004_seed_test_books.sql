-- Migration: 004_seed_test_books.sql
-- Date: 2026-01-21
--
-- Purpose: Seeds the database with three test books to validate Phase 2 metadata architecture:
--   1. Die Verwandlung (Kafka) - Classic PD case
--   2. Traumnovelle (Schnitzler) - Vienna modernism
--   3. Buddenbrooks (Mann) - 2026 edge case (became PD on 01.01.2026)
--
-- Usage:
--   1. Run Migration 003 first (enhanced_metadata.sql)
--   2. Execute this script in Supabase Dashboard → SQL Editor
--   3. Replace [PLACEHOLDER] with actual full texts from Project Gutenberg
--   4. Test with queries like:
--      SELECT title, a.name, is_pd_us, is_pd_eu, cefr_level, tags
--      FROM source_texts st
--      JOIN authors a ON st.author_id = a.id;

-- ============================================================================
-- 1. Seed Authors
-- ============================================================================

-- Kafka, Franz (1883-1924)
INSERT INTO authors (id, name, birth_year, death_year, nationality, wikidata_id, created_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'Kafka, Franz',
  1883,
  1924,
  'Österreich-Ungarn',
  'Q905',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Schnitzler, Arthur (1862-1931)
INSERT INTO authors (id, name, birth_year, death_year, nationality, wikidata_id, created_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  'Schnitzler, Arthur',
  1862,
  1931,
  'Österreich',
  'Q44331',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Mann, Thomas (1875-1955) - The 2026 showcase!
INSERT INTO authors (id, name, birth_year, death_year, nationality, wikidata_id, created_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440003',
  'Mann, Thomas',
  1875,
  1955,
  'Deutschland',
  'Q37030',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. Seed Books (with metadata placeholders)
-- ============================================================================

-- Book 1: Die Verwandlung (Kafka, 1915)
INSERT INTO source_texts (
  id,
  title,
  author_id,
  content,
  language,
  difficulty_level,
  publication_year,
  original_language,
  source_url,
  cover_image_url,
  is_pd_us,
  is_pd_eu,
  rights_details,
  cefr_level,
  lexile_score,
  estimated_reading_time_minutes,
  tags,
  metrics,
  metadata,
  created_at
) VALUES (
  '650e8400-e29b-41d4-a716-446655440001',
  'Die Verwandlung',
  '550e8400-e29b-41d4-a716-446655440001', -- Kafka
  '[PLACEHOLDER: Full text from Project Gutenberg ebook 5200. Download from https://www.gutenberg.org/ebooks/5200]',
  'de',
  4,
  1915,
  'de',
  'https://www.gutenberg.org/ebooks/5200',
  NULL, -- No cover image yet
  true, -- PD in USA (published 1915, pre-1931)
  true, -- PD in EU (Kafka died 1924, 70 years expired)
  '{
    "verification_date": "2026-01-21",
    "us_rationale": "published_1915",
    "eu_rationale": "author_died_1924"
  }'::jsonb,
  'B2',
  NULL, -- Lexile not applicable for German text
  90,
  ARRAY['Novelle', 'Existenzialismus', 'Kafka', 'Klassiker', 'Moderne'],
  '{}'::jsonb, -- Metrics will be calculated during import processing
  '{
    "plot_summary": "Gregor Samsa erwacht als Ungeziefer und muss sich mit seiner neuen Existenz und der Reaktion seiner Familie auseinandersetzen.",
    "sentiment": "existenziell, absurd, tragisch"
  }'::jsonb,
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Book 2: Traumnovelle (Schnitzler, 1926)
INSERT INTO source_texts (
  id,
  title,
  author_id,
  content,
  language,
  difficulty_level,
  publication_year,
  original_language,
  source_url,
  cover_image_url,
  is_pd_us,
  is_pd_eu,
  rights_details,
  cefr_level,
  lexile_score,
  estimated_reading_time_minutes,
  tags,
  metrics,
  metadata,
  created_at
) VALUES (
  '650e8400-e29b-41d4-a716-446655440002',
  'Traumnovelle',
  '550e8400-e29b-41d4-a716-446655440002', -- Schnitzler
  '[PLACEHOLDER: Full text from Standard Ebooks or Gutenberg-DE. Note: Not yet in Project Gutenberg US catalog.]',
  'de',
  3,
  1926,
  'de',
  'https://www.gutenberg.org/ebooks/author/1035', -- Schnitzler author page
  NULL,
  true, -- PD in USA (published 1926, pre-1931)
  true, -- PD in EU (Schnitzler died 1931, 70 years expired)
  '{
    "verification_date": "2026-01-21",
    "us_rationale": "published_1926",
    "eu_rationale": "author_died_1931"
  }'::jsonb,
  'B2',
  NULL,
  120,
  ARRAY['Novelle', 'Psychologie', 'Wien', 'Schnitzler', 'Moderne'],
  '{}'::jsonb,
  '{
    "plot_summary": "Ein Wiener Arzt durchlebt in einer einzigen Nacht eine Reihe seltsamer, erotisch aufgeladener Begegnungen, die seine bürgerliche Existenz infrage stellen.",
    "sentiment": "traumhaft, beunruhigend, psychologisch"
  }'::jsonb,
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Book 3: Buddenbrooks (Mann, 1901) - THE 2026 SHOWCASE!
INSERT INTO source_texts (
  id,
  title,
  author_id,
  content,
  language,
  difficulty_level,
  publication_year,
  original_language,
  source_url,
  cover_image_url,
  is_pd_us,
  is_pd_eu,
  rights_details,
  cefr_level,
  lexile_score,
  estimated_reading_time_minutes,
  tags,
  metrics,
  metadata,
  created_at
) VALUES (
  '650e8400-e29b-41d4-a716-446655440003',
  'Buddenbrooks: Verfall einer Familie',
  '550e8400-e29b-41d4-a716-446655440003', -- Mann
  '[PLACEHOLDER: Full text from Project Gutenberg ebook 10921. Download from https://www.gutenberg.org/ebooks/10921]',
  'de',
  5,
  1901,
  'de',
  'https://www.gutenberg.org/ebooks/10921',
  NULL,
  true, -- PD in USA (published 1901, pre-1931)
  true, -- PD in EU (Mann died 1955, became PD on 01.01.2026!)
  '{
    "verification_date": "2026-01-21",
    "us_rationale": "published_1901",
    "eu_rationale": "author_died_1955_freed_2026",
    "edge_case_notes": "Thomas Mann wurde genau am 01.01.2026 Public Domain in Deutschland"
  }'::jsonb,
  'C1',
  NULL,
  600, -- ~10 hours reading time
  ARRAY['Roman', 'Familiengeschichte', 'Nobelpreis', 'Lübeck', 'Mann', 'Moderne'],
  '{}'::jsonb,
  '{
    "plot_summary": "Die Geschichte des Niedergangs einer wohlhabenden Lübecker Kaufmannsfamilie über vier Generationen.",
    "sentiment": "melancholisch, dekadent, realistisch",
    "constraints": ["lange Sätze", "komplexe Nebensätze", "psychologische Tiefe"]
  }'::jsonb,
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. Verification Queries
-- ============================================================================

-- Check authors
SELECT
  name,
  birth_year,
  death_year,
  EXTRACT(YEAR FROM NOW()) - death_year AS years_since_death
FROM authors
WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003'
)
ORDER BY death_year;

-- Check books with compliance status
SELECT
  st.title,
  a.name AS author,
  st.publication_year,
  st.is_pd_us,
  st.is_pd_eu,
  st.cefr_level,
  st.estimated_reading_time_minutes,
  st.tags,
  st.rights_details->>'edge_case_notes' AS special_notes
FROM source_texts st
JOIN authors a ON st.author_id = a.id
WHERE st.id IN (
  '650e8400-e29b-41d4-a716-446655440001',
  '650e8400-e29b-41d4-a716-446655440002',
  '650e8400-e29b-41d4-a716-446655440003'
)
ORDER BY st.publication_year;

-- Test helper function
SELECT
  title,
  is_book_safe_for_region(id, 'GLOBAL') AS globally_safe
FROM source_texts
WHERE id = '650e8400-e29b-41d4-a716-446655440003'; -- Buddenbrooks

-- ============================================================================
-- 4. Comments & Documentation
-- ============================================================================

COMMENT ON COLUMN source_texts.content IS 'Full text content. Replace [PLACEHOLDER] with actual text from Project Gutenberg before running import processing.';

-- ============================================================================
-- SEED COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Download full texts from Project Gutenberg:
--    - Die Verwandlung: https://www.gutenberg.org/ebooks/5200
--    - Buddenbrooks: https://www.gutenberg.org/ebooks/10921
-- 2. Replace [PLACEHOLDER] with actual content via UPDATE query
-- 3. Run book import processing (UDPipe + Embeddings) to populate metrics
-- 4. Test end-to-end training flow with these books
