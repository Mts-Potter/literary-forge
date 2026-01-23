-- ============================================================================
-- Create Index for Binary Embeddings
-- ============================================================================
-- Purpose: Enable fast semantic search using Hamming distance
-- Prerequisites: Binary embeddings backfilled (backfill-binary-embeddings.sql)
-- Runtime: ~2-5 minutes for 10K records
-- Method: CONCURRENTLY (non-blocking, allows concurrent reads/writes)
-- ============================================================================

-- ============================================================================
-- IMPORTANT: MUST run AFTER backfill completes
-- ============================================================================
-- Why? Creating index on empty column is fast but useless
-- Creating index on populated column is slower but necessary
-- Running BEFORE backfill wastes time (index must be rebuilt anyway)
-- ============================================================================

-- Pre-flight check: Verify backfill is complete
DO $$
DECLARE
  total_rows INT;
  binary_rows INT;
  completion_pct FLOAT;
BEGIN
  SELECT COUNT(*) INTO total_rows FROM source_texts WHERE embedding IS NOT NULL;
  SELECT COUNT(*) INTO binary_rows FROM source_texts WHERE embedding_binary IS NOT NULL;

  IF total_rows = 0 THEN
    RAISE NOTICE 'No rows with embeddings found. Skipping index creation.';
    RETURN;
  END IF;

  completion_pct := (binary_rows::FLOAT / total_rows * 100);

  RAISE NOTICE '========================================';
  RAISE NOTICE 'BINARY EMBEDDING INDEX CREATION';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total rows with float32 embeddings: %', total_rows;
  RAISE NOTICE 'Total rows with binary embeddings: %', binary_rows;
  RAISE NOTICE 'Backfill completion: %.1f%%', completion_pct;

  IF completion_pct < 95 THEN
    RAISE WARNING 'Backfill incomplete (%.1f%%). Index will be suboptimal.', completion_pct;
    RAISE WARNING 'Recommend completing backfill first for best performance.';
  END IF;

  RAISE NOTICE 'Proceeding with index creation...';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- Index Creation: ivfflat with Hamming Distance
-- ============================================================================
-- Algorithm: Inverted File with Flat compression (IVFFlat)
-- Distance metric: Hamming distance (bit_hamming_ops)
-- Partitioning: 100 lists (rule of thumb: rows/1000, max 100 for small datasets)
--
-- Why ivfflat?
-- - Approximate nearest neighbor (ANN) search
-- - 10-100x faster than exact search for large datasets
-- - Tunable accuracy vs speed tradeoff
--
-- Why Hamming distance?
-- - Optimized for binary vectors
-- - Simple XOR + popcount operation
-- - Hardware-accelerated on modern CPUs
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS source_texts_embedding_binary_idx
ON source_texts
USING ivfflat (embedding_binary bit_hamming_ops)
WITH (lists = 100);

-- ============================================================================
-- Why CONCURRENTLY?
-- ============================================================================
-- Standard CREATE INDEX locks table (blocks reads/writes)
-- CONCURRENTLY allows table to remain accessible during build
-- Trade-off: Takes slightly longer but no downtime
-- CRITICAL for production systems with active users
-- ============================================================================

COMMENT ON INDEX source_texts_embedding_binary_idx IS
'ivfflat index for binary embeddings using Hamming distance.
Algorithm: Approximate nearest neighbor (ANN) via inverted file index.
Distance: Hamming distance (<~> operator) - counts differing bits.
Partitions: 100 lists (optimal for 10K-100K rows).
Query time: ~5-50ms for k=10 nearest neighbors.
Build time: ~2-5 minutes for 10K rows (CONCURRENTLY mode).';

-- ============================================================================
-- Verify Index Creation
-- ============================================================================
-- Check if index was created successfully
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    tablename = 'source_texts'
    AND indexname = 'source_texts_embedding_binary_idx';

-- Expected output:
-- public | source_texts | source_texts_embedding_binary_idx | CREATE INDEX ...

-- Check index size
SELECT
    pg_size_pretty(pg_relation_size('source_texts_embedding_binary_idx')) as index_size,
    pg_size_pretty(pg_total_relation_size('source_texts')) as table_size;

-- Expected: Index should be ~5-10% of table size

-- ============================================================================
-- Analyze Table Statistics
-- ============================================================================
-- Update PostgreSQL's query planner statistics
-- Ensures planner uses index optimally
ANALYZE source_texts;

RAISE NOTICE 'Index created successfully ✓';
RAISE NOTICE 'Table statistics updated ✓';

-- ============================================================================
-- PERFORMANCE TESTING
-- ============================================================================
-- Test query performance with and without index

-- Test 1: Explain plan (should use index scan)
EXPLAIN (ANALYZE, BUFFERS)
SELECT
    id,
    title,
    embedding_binary <~> B'101010...'::BIT(384) as hamming_dist
FROM
    source_texts
WHERE
    embedding_binary IS NOT NULL
ORDER BY
    embedding_binary <~> B'101010...'::BIT(384) ASC
LIMIT 10;

-- Expected output should include:
-- -> Index Scan using source_texts_embedding_binary_idx
-- Planning Time: ~0.5 ms
-- Execution Time: ~5-50 ms (depending on dataset size)

-- If you see "Seq Scan" instead of "Index Scan":
-- - Index might not be built yet (check pg_stat_progress_create_index)
-- - Not enough data for planner to prefer index (< 1000 rows)
-- - Query doesn't match index operator (using wrong distance function)

-- ============================================================================
-- INDEX TUNING PARAMETERS
-- ============================================================================
-- Adjust 'lists' parameter based on dataset size:
--
-- Row Count    | Recommended Lists | Build Time  | Query Time
-- -------------|-------------------|-------------|------------
-- 1K-10K       | 10-20             | < 1 min     | 5-20 ms
-- 10K-100K     | 50-100            | 2-5 min     | 10-50 ms
-- 100K-1M      | 100-200           | 10-30 min   | 20-100 ms
-- 1M-10M       | 200-500           | 1-3 hours   | 50-200 ms
--
-- Trade-off: More lists = faster queries but slower build & larger index

-- Current setting: 100 lists (optimal for 10K-100K rows)

-- To rebuild with different lists parameter:
/*
DROP INDEX CONCURRENTLY source_texts_embedding_binary_idx;
CREATE INDEX CONCURRENTLY source_texts_embedding_binary_idx
ON source_texts
USING ivfflat (embedding_binary bit_hamming_ops)
WITH (lists = 200);  -- Adjust this value
*/

-- ============================================================================
-- MONITORING INDEX HEALTH
-- ============================================================================
-- Track index usage over time
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as times_used,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM
    pg_stat_user_indexes
WHERE
    indexname = 'source_texts_embedding_binary_idx';

-- If idx_scan is low after deployment:
-- - Queries might not be using index
-- - Check query patterns in application logs
-- - Consider dropping index if unused (saves storage)

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- Issue 1: Index creation taking too long (>10 minutes)
-- Diagnosis: Check progress
SELECT
    phase,
    round(100.0 * blocks_done / NULLIF(blocks_total, 0), 1) AS pct_done,
    blocks_done,
    blocks_total
FROM
    pg_stat_progress_create_index
WHERE
    relid = 'source_texts'::regclass;

-- Solution: Wait for completion or cancel and reduce dataset size

-- Issue 2: Queries not using index
-- Diagnosis: Check if index is valid
SELECT
    indexname,
    indexdef,
    indisvalid
FROM
    pg_indexes
JOIN
    pg_index ON indexrelid = indexname::regclass
WHERE
    tablename = 'source_texts';

-- Solution: If indisvalid=false, index creation failed. Drop and recreate.

-- Issue 3: Out of disk space
-- Diagnosis: Check available space
SELECT
    pg_size_pretty(pg_database_size(current_database())) as db_size,
    pg_size_pretty(pg_total_relation_size('source_texts')) as table_size,
    pg_size_pretty(pg_relation_size('source_texts_embedding_binary_idx')) as index_size;

-- Solution: If approaching 500MB limit (Supabase free tier):
-- - Clean up old data
-- - Consider upgrading to paid tier
-- - Use binary embeddings only (drop float32 column if needed)

-- ============================================================================
-- NEXT STEPS
-- ============================================================================
-- After successful index creation:
--
-- 1. ✅ Index created (fast semantic search enabled)
-- 2. ⏳ Create search RPC: migrations/011_binary_search_functions.sql
--    - match_texts_binary() function for k-NN search
--    - Exposed to authenticated users
--
-- 3. ⏳ Update application code: lib/nlp/embeddings.ts
--    - Use binary embeddings for all searches
--    - Keep float32 as backup/rollback option
--
-- 4. ⏳ Test end-to-end search:
--    - Generate query embedding (binary)
--    - Call match_texts_binary() RPC
--    - Verify results are relevant
--    - Measure latency (<100ms)
--
-- 5. ⏳ Monitor in production:
--    - Track idx_scan in pg_stat_user_indexes
--    - Measure query latency (p95 < 100ms)
--    - Watch for index bloat over time
-- ============================================================================

-- ============================================================================
-- ROLLBACK PROCEDURE
-- ============================================================================
-- If index causes issues:

/*
-- Drop index (CONCURRENTLY to avoid locking)
DROP INDEX CONCURRENTLY IF EXISTS source_texts_embedding_binary_idx;

-- Optionally vacuum table to reclaim space
VACUUM ANALYZE source_texts;
*/

-- ============================================================================
-- INDEX CREATION COMPLETE ✓
-- ============================================================================
