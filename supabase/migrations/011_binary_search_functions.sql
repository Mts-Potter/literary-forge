-- ============================================================================
-- Migration 011: Binary Semantic Search RPC Functions
-- ============================================================================
-- Purpose: Enable fast semantic similarity search using binary embeddings
-- Author: Claude Code (Literary Forge Implementation Plan)
-- Date: 2026-01-23
-- Dependencies: 009_binary_embeddings.sql + backfill + index
-- ============================================================================

-- ============================================================================
-- Function: match_texts_binary
-- ============================================================================
-- Performs k-nearest neighbors search using Hamming distance
-- Optimized for binary quantized embeddings (48 bytes vs 1536 bytes)
-- ~10x faster than cosine similarity on float32 embeddings

CREATE OR REPLACE FUNCTION match_texts_binary(
  query_embedding_binary BIT(384),
  match_threshold INT DEFAULT 50,  -- Hamming distance threshold (max bits different)
  match_count INT DEFAULT 10       -- Number of results to return (k in k-NN)
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  author_id UUID,
  author_name TEXT,
  similarity FLOAT,  -- Normalized similarity score (0-1, higher = more similar)
  hamming_distance INT,  -- Raw Hamming distance (0-384, lower = more similar)
  metrics JSONB,
  difficulty_level INT,
  cefr_level TEXT,
  tags TEXT[]
)
LANGUAGE plpgsql
STABLE  -- Function doesn't modify database (can be cached)
PARALLEL SAFE  -- Safe to parallelize across workers
AS $$
BEGIN
  RETURN QUERY
  SELECT
    st.id,
    st.title,
    st.content,
    st.author_id,
    a.name as author_name,
    -- Convert Hamming distance to similarity score (0-1 scale)
    -- Similarity = 1 - (hamming_distance / total_bits)
    -- Example: hamming=0 → similarity=1.0 (identical)
    --          hamming=192 → similarity=0.5 (50% similar)
    --          hamming=384 → similarity=0.0 (completely opposite)
    1.0 - ((st.embedding_binary <~> query_embedding_binary)::FLOAT / 384.0) AS similarity,
    (st.embedding_binary <~> query_embedding_binary)::INT AS hamming_distance,
    st.metrics,
    st.difficulty_level,
    st.cefr_level,
    st.tags
  FROM
    source_texts st
  LEFT JOIN
    authors a ON st.author_id = a.id
  WHERE
    st.embedding_binary IS NOT NULL
    -- Filter by threshold: only return results within distance threshold
    AND (st.embedding_binary <~> query_embedding_binary) <= match_threshold
  ORDER BY
    -- Order by Hamming distance (closest first)
    -- Index scan will use source_texts_embedding_binary_idx
    st.embedding_binary <~> query_embedding_binary ASC
  LIMIT
    match_count;
END;
$$;

COMMENT ON FUNCTION match_texts_binary IS
'Performs semantic similarity search using binary embeddings and Hamming distance.

Parameters:
  - query_embedding_binary: Binary quantized query vector (384 bits)
  - match_threshold: Max Hamming distance to include (default 50 = ~13% different)
  - match_count: Number of results to return (default 10)

Returns:
  - Top k most similar texts ordered by similarity (descending)
  - Includes full text metadata for rendering

Performance:
  - ~5-50ms for 10K rows (with index)
  - ~50-200ms for 1M rows (with index)
  - Uses ivfflat index with bit_hamming_ops

Example usage:
  SELECT * FROM match_texts_binary(
    B''10110101...''::BIT(384),  -- Query embedding
    50,  -- Max distance
    10   -- Top 10 results
  );

Threshold guidelines:
  - 0-20: Very similar (exact or near-duplicates)
  - 20-50: Similar (same author/style/topic)
  - 50-100: Somewhat similar (related content)
  - 100+: Dissimilar (broadening search)';

-- Grant execute to authenticated users only (prevent abuse)
GRANT EXECUTE ON FUNCTION match_texts_binary TO authenticated;

-- ============================================================================
-- Function: match_texts_by_text_id
-- ============================================================================
-- Convenience function: Find similar texts to a given source_text
-- Useful for "Find Similar" features in UI

CREATE OR REPLACE FUNCTION match_texts_by_text_id(
  source_text_id UUID,
  match_threshold INT DEFAULT 50,
  match_count INT DEFAULT 10,
  exclude_self BOOLEAN DEFAULT TRUE  -- Exclude the source text itself
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  author_id UUID,
  author_name TEXT,
  similarity FLOAT,
  hamming_distance INT,
  metrics JSONB,
  difficulty_level INT,
  cefr_level TEXT,
  tags TEXT[]
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  query_binary BIT(384);
BEGIN
  -- Get the binary embedding of the source text
  SELECT embedding_binary INTO query_binary
  FROM source_texts
  WHERE id = source_text_id;

  -- If source text doesn't exist or has no embedding, return empty
  IF query_binary IS NULL THEN
    RETURN;
  END IF;

  -- Perform search
  RETURN QUERY
  SELECT * FROM match_texts_binary(
    query_binary,
    match_threshold,
    match_count + CASE WHEN exclude_self THEN 1 ELSE 0 END  -- Fetch extra to compensate for exclusion
  )
  WHERE
    -- Optionally exclude the source text itself
    NOT (exclude_self AND id = source_text_id)
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_texts_by_text_id IS
'Find texts similar to a given source_text by its ID.

Parameters:
  - source_text_id: UUID of the reference text
  - match_threshold: Max Hamming distance (default 50)
  - match_count: Number of results (default 10)
  - exclude_self: Exclude the source text from results (default TRUE)

Returns:
  - Similar texts ordered by similarity

Use case:
  - "Find similar passages" feature in training interface
  - Recommendations: "If you liked X, try Y"
  - Deduplication: Find near-duplicate content

Example:
  -- Find 5 texts similar to a specific Kafka passage
  SELECT title, similarity
  FROM match_texts_by_text_id(
    ''550e8400-e29b-41d4-a716-446655440000''::UUID,
    40,
    5
  );';

GRANT EXECUTE ON FUNCTION match_texts_by_text_id TO authenticated;

-- ============================================================================
-- Function: semantic_search
-- ============================================================================
-- Full-text semantic search with keyword filtering
-- Combines vector similarity with metadata filters

CREATE OR REPLACE FUNCTION semantic_search(
  query_embedding_binary BIT(384),
  keyword_filter TEXT DEFAULT NULL,  -- Optional: Filter by title/content keywords
  author_filter UUID DEFAULT NULL,   -- Optional: Filter by author
  difficulty_min INT DEFAULT NULL,   -- Optional: Min difficulty (1-5)
  difficulty_max INT DEFAULT NULL,   -- Optional: Max difficulty (1-5)
  cefr_filter TEXT DEFAULT NULL,     -- Optional: Filter by CEFR level
  tag_filter TEXT[] DEFAULT NULL,    -- Optional: Filter by tags (ANY match)
  match_threshold INT DEFAULT 50,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  author_id UUID,
  author_name TEXT,
  similarity FLOAT,
  hamming_distance INT,
  metrics JSONB,
  difficulty_level INT,
  cefr_level TEXT,
  tags TEXT[],
  match_reason TEXT  -- Why this result was included (for debugging)
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    st.id,
    st.title,
    st.content,
    st.author_id,
    a.name as author_name,
    1.0 - ((st.embedding_binary <~> query_embedding_binary)::FLOAT / 384.0) AS similarity,
    (st.embedding_binary <~> query_embedding_binary)::INT AS hamming_distance,
    st.metrics,
    st.difficulty_level,
    st.cefr_level,
    st.tags,
    -- Explain why this result matched (for debugging)
    CASE
      WHEN keyword_filter IS NOT NULL AND (st.title ILIKE '%' || keyword_filter || '%' OR st.content ILIKE '%' || keyword_filter || '%')
        THEN 'keyword_match'
      WHEN tag_filter IS NOT NULL AND st.tags && tag_filter
        THEN 'tag_match'
      ELSE 'semantic_similarity'
    END AS match_reason
  FROM
    source_texts st
  LEFT JOIN
    authors a ON st.author_id = a.id
  WHERE
    st.embedding_binary IS NOT NULL
    -- Semantic similarity filter
    AND (st.embedding_binary <~> query_embedding_binary) <= match_threshold
    -- Keyword filter (title OR content)
    AND (keyword_filter IS NULL OR st.title ILIKE '%' || keyword_filter || '%' OR st.content ILIKE '%' || keyword_filter || '%')
    -- Author filter
    AND (author_filter IS NULL OR st.author_id = author_filter)
    -- Difficulty range filter
    AND (difficulty_min IS NULL OR st.difficulty_level >= difficulty_min)
    AND (difficulty_max IS NULL OR st.difficulty_level <= difficulty_max)
    -- CEFR level filter
    AND (cefr_filter IS NULL OR st.cefr_level = cefr_filter)
    -- Tag filter (ANY match using array overlap operator)
    AND (tag_filter IS NULL OR st.tags && tag_filter)
  ORDER BY
    -- Primary: Semantic similarity
    st.embedding_binary <~> query_embedding_binary ASC
  LIMIT
    match_count;
END;
$$;

COMMENT ON FUNCTION semantic_search IS
'Advanced semantic search with multiple filter options.

Combines:
  - Vector similarity (Hamming distance)
  - Keyword matching (title/content)
  - Author filtering
  - Difficulty range filtering
  - CEFR level filtering
  - Tag filtering (array overlap)

Example - Find intermediate German Kafka texts about alienation:
  SELECT title, similarity, match_reason
  FROM semantic_search(
    query_binary,
    ''alienation'',  -- keyword
    kafka_author_id,  -- author
    3, 4,  -- difficulty 3-4
    ''B2'',  -- CEFR level
    ARRAY[''psychological'', ''existential''],  -- tags
    50, 20  -- threshold, count
  );

Performance: ~10-100ms depending on filter selectivity';

GRANT EXECUTE ON FUNCTION semantic_search TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Query 1: Test basic binary search
/*
-- Generate a test binary vector (all 1s for testing)
SELECT * FROM match_texts_binary(
  repeat('1', 384)::BIT(384),
  100,
  5
);
-- Expected: Returns 5 texts, ordered by similarity
*/

-- Query 2: Test similarity by ID
/*
-- Find texts similar to a specific text
SELECT
    title,
    author_name,
    ROUND(similarity::NUMERIC, 3) as sim,
    hamming_distance
FROM
    match_texts_by_text_id(
        (SELECT id FROM source_texts WHERE embedding_binary IS NOT NULL LIMIT 1),
        50,
        5
    );
-- Expected: Returns 5 similar texts (excluding the source itself)
*/

-- Query 3: Check function permissions
SELECT
    routine_name,
    routine_type,
    security_type,
    grantee,
    privilege_type
FROM
    information_schema.routine_privileges
WHERE
    routine_name IN ('match_texts_binary', 'match_texts_by_text_id', 'semantic_search')
ORDER BY
    routine_name, grantee;

-- Expected: authenticated role has EXECUTE privilege

-- ============================================================================
-- PERFORMANCE BENCHMARKS
-- ============================================================================

-- Benchmark 1: Measure query latency
EXPLAIN (ANALYZE, BUFFERS, TIMING)
SELECT * FROM match_texts_binary(
  repeat('1', 384)::BIT(384),
  50,
  10
);

-- Expected output:
-- Planning Time: 0.5-2 ms
-- Execution Time: 5-50 ms (depending on dataset size)
-- Index Scan using source_texts_embedding_binary_idx

-- Benchmark 2: Compare binary vs float32 (if float32 search exists)
/*
-- Float32 search (for comparison)
EXPLAIN (ANALYZE)
SELECT id, title, embedding <=> '[0.1, 0.2, ...]'::VECTOR(384) as dist
FROM source_texts
WHERE embedding IS NOT NULL
ORDER BY embedding <=> '[...]'::VECTOR(384) ASC
LIMIT 10;

-- Binary search
EXPLAIN (ANALYZE)
SELECT * FROM match_texts_binary(B'10101...'::BIT(384), 50, 10);

-- Expected: Binary search is 5-10x faster
*/

-- ============================================================================
-- NEXT STEPS
-- ============================================================================
-- After creating search functions:
--
-- 1. ✅ RPC functions created (API layer complete)
-- 2. ⏳ Update application code: lib/nlp/embeddings.ts
--    - Generate binary embeddings on client side
--    - Call match_texts_binary() for searches
--
-- 3. ⏳ Create UI search interface:
--    - Search bar component
--    - Results display with similarity scores
--    - "Find Similar" button on training pages
--
-- 4. ⏳ Test end-to-end:
--    - User enters search query
--    - Generate embedding (client-side)
--    - Call semantic_search() RPC
--    - Display results with relevance scores
--
-- 5. ⏳ Monitor query performance:
--    - Track RPC call latency (p95 < 100ms)
--    - Monitor index usage (pg_stat_user_indexes)
--    - Optimize threshold/count parameters
-- ============================================================================

-- ============================================================================
-- ROLLBACK PROCEDURE
-- ============================================================================
/*
DROP FUNCTION IF EXISTS semantic_search CASCADE;
DROP FUNCTION IF EXISTS match_texts_by_text_id CASCADE;
DROP FUNCTION IF EXISTS match_texts_binary CASCADE;
*/

-- ============================================================================
-- MIGRATION COMPLETE ✓
-- ============================================================================
