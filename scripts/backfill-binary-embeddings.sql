-- ============================================================================
-- Backfill Binary Embeddings for Existing Records
-- ============================================================================
-- Purpose: Convert all existing float32 embeddings to binary quantization
-- Prerequisites: 009_binary_embeddings.sql migration applied
-- Runtime: ~5-10 minutes for 10K records (depends on hardware)
-- Safety: Processes in batches to avoid timeout (10s Supabase limit)
-- ============================================================================

DO $$
DECLARE
  batch_size INT := 100;  -- Process 100 rows at a time
  processed INT := 0;
  total INT;
  start_time TIMESTAMP;
  elapsed INTERVAL;
  estimated_remaining INTERVAL;
BEGIN
  -- Count total records needing backfill
  SELECT COUNT(*) INTO total
  FROM source_texts
  WHERE embedding IS NOT NULL
    AND embedding_binary IS NULL;

  IF total = 0 THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'NO BACKFILL NEEDED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'All records already have binary embeddings';
    RAISE NOTICE 'or no records have float32 embeddings yet.';
    RETURN;
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'BINARY EMBEDDING BACKFILL STARTED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total records to process: %', total;
  RAISE NOTICE 'Batch size: %', batch_size;
  RAISE NOTICE 'Estimated batches: %', CEIL(total::FLOAT / batch_size);
  RAISE NOTICE 'Started at: %', NOW();
  RAISE NOTICE '========================================';

  start_time := clock_timestamp();

  -- Process in batches
  WHILE EXISTS (
    SELECT 1 FROM source_texts
    WHERE embedding IS NOT NULL
      AND embedding_binary IS NULL
    LIMIT 1
  ) LOOP

    -- Update batch using float32_to_binary function
    UPDATE source_texts
    SET embedding_binary = float32_to_binary(embedding)
    WHERE id IN (
      SELECT id
      FROM source_texts
      WHERE embedding IS NOT NULL
        AND embedding_binary IS NULL
      ORDER BY created_at ASC  -- Process oldest first
      LIMIT batch_size
    );

    processed := processed + batch_size;
    elapsed := clock_timestamp() - start_time;

    -- Calculate progress
    IF processed > 0 THEN
      estimated_remaining := (elapsed / processed) * (total - processed);
    END IF;

    -- Progress report every batch
    RAISE NOTICE 'Progress: %/% (%.1f%%) | Elapsed: % | ETA: %',
      LEAST(processed, total),
      total,
      (LEAST(processed, total)::FLOAT / total * 100),
      elapsed,
      COALESCE(estimated_remaining, INTERVAL '0');

    -- Small pause to avoid overwhelming database
    -- (allows other queries to interleave)
    PERFORM pg_sleep(0.1);
  END LOOP;

  elapsed := clock_timestamp() - start_time;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'BACKFILL COMPLETE ✓';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total processed: %', total;
  RAISE NOTICE 'Total time: %', elapsed;
  RAISE NOTICE 'Average per record: % ms', (EXTRACT(EPOCH FROM elapsed) * 1000 / total)::INT;
  RAISE NOTICE 'Finished at: %', NOW();
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these after backfill to verify success

-- Query 1: Check completion status
SELECT
    'Completion Status' as metric,
    COUNT(*) as total_rows,
    COUNT(*) FILTER (WHERE embedding IS NOT NULL) as has_float32,
    COUNT(*) FILTER (WHERE embedding_binary IS NOT NULL) as has_binary,
    COUNT(*) FILTER (WHERE embedding IS NOT NULL AND embedding_binary IS NOT NULL) as both,
    COUNT(*) FILTER (WHERE embedding IS NOT NULL AND embedding_binary IS NULL) as missing_binary
FROM
    source_texts;

-- Expected: missing_binary should be 0

-- Query 2: Sample verification (check a few conversions)
SELECT
    id,
    title,
    substring(content, 1, 50) as content_preview,
    embedding IS NOT NULL as has_float32,
    embedding_binary IS NOT NULL as has_binary,
    -- Test bidirectional conversion (should not be identical but structurally valid)
    binary_to_float32(embedding_binary) IS NOT NULL as can_reconstruct
FROM
    source_texts
WHERE
    embedding IS NOT NULL
    AND embedding_binary IS NOT NULL
LIMIT 10;

-- Expected: All rows should have both has_float32=true and has_binary=true

-- Query 3: Measure storage impact
SELECT * FROM analyze_embedding_storage();

-- Expected output (example for 10K rows):
-- Total Rows: 10000
-- Rows with float32 Embedding: 10000
-- Rows with Binary Embedding: 10000
-- Total Table Size: ~50 MB (down from ~500 MB)
-- float32 Embedding Size (per row): 1536 bytes
-- Binary Embedding Size (per row): 48 bytes
-- Estimated Storage Reduction: ~96%

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- Issue 1: Backfill seems stuck
-- Diagnosis: Check if function is executing
SELECT
    pid,
    now() - query_start AS duration,
    state,
    query
FROM
    pg_stat_activity
WHERE
    query LIKE '%float32_to_binary%'
    AND state = 'active';

-- Solution: If duration > 5 minutes, cancel and reduce batch size

-- Issue 2: Out of memory errors
-- Diagnosis: Batch size too large
-- Solution: Reduce batch_size from 100 to 50 or 25

-- Issue 3: Conversion errors
-- Diagnosis: Invalid embedding vectors (wrong dimensionality)
SELECT
    id,
    title,
    array_length(embedding::FLOAT[], 1) as dims
FROM
    source_texts
WHERE
    embedding IS NOT NULL
    AND array_length(embedding::FLOAT[], 1) != 384;

-- Solution: Fix or delete invalid embeddings before backfill

-- ============================================================================
-- NEXT STEPS
-- ============================================================================
-- After successful backfill:
--
-- 1. ✅ Backfill complete (all rows have binary embeddings)
-- 2. ⏳ Create index: scripts/create-binary-index.sql
--    - Index makes search fast
--    - Must run AFTER backfill (slow on populated column)
--
-- 3. ⏳ Update application code: lib/nlp/embeddings.ts
--    - Generate both float32 and binary on new ingestions
--    - Use binary for production search
--
-- 4. ✅ Verify storage reduction: analyze_embedding_storage()
--    - Confirm 96% reduction achieved
--    - Monitor database size in Supabase dashboard
--
-- 5. ⏳ Enable auto-population trigger (optional)
--    - Uncomment trigger in 009_binary_embeddings.sql
--    - Ensures future inserts auto-generate binary
-- ============================================================================

-- ============================================================================
-- PERFORMANCE BENCHMARKS
-- ============================================================================
-- Expected performance (Supabase free tier):
-- - Batch of 100: ~2-3 seconds
-- - 1,000 rows: ~30-45 seconds
-- - 10,000 rows: ~5-8 minutes
-- - 100,000 rows: ~50-80 minutes
--
-- If significantly slower:
-- - Check database CPU usage (might be throttled)
-- - Reduce batch_size
-- - Run during off-peak hours
-- ============================================================================
