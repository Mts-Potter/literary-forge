-- ============================================================================
-- EXECUTION SCRIPT: SAFE DELETE WITH MANUAL CASCADE
-- ============================================================================
-- ⚠️  WARNING: This script PERMANENTLY removes data from the database
--
-- PREREQUISITES (MUST COMPLETE BEFORE RUNNING):
-- 1. ✅ Run db-cleanup-dryrun.sql and review results
-- 2. ✅ Export dry-run results to CSV and verify manually
-- 3. ✅ Backup database: pg_dump or Supabase dashboard
-- 4. ✅ Confirm NO legitimate texts are flagged for deletion
-- 5. ✅ Notify team/users if deleting data with user_progress
--
-- Execute via: Supabase SQL Editor
-- Time estimate: 5-30 seconds (depends on row count)
-- ============================================================================

-- Start transaction (all-or-nothing)
BEGIN;

-- ============================================================================
-- STEP 1: Isolate Target Rows
-- ============================================================================
-- Create temporary table of IDs to delete
-- This ensures consistent targeting across all subsequent operations
CREATE TEMP TABLE rows_to_purge ON COMMIT DROP AS
SELECT id
FROM source_texts
WHERE
    -- Exact same criteria as dry-run script
    content IS NULL
    OR TRIM(content) = ''
    OR LENGTH(content) < 100
    OR content ILIKE '%lorem ipsum%'
    OR content ILIKE '%placeholder%'
    OR content ILIKE '%PLACEHOLDER%'
    OR content ILIKE '%test text%'
    OR content ILIKE '%dummy text%'
    OR content ILIKE '%sample text%'
    OR (title ILIKE '%test%' AND author_id IS NULL)
    OR title ILIKE 'test_run_%'
    OR title = '';

-- ============================================================================
-- STEP 2: Audit Logging (for accountability)
-- ============================================================================
DO $$
DECLARE
    target_count INT;
    progress_count INT;
    review_count INT;
    affected_users INT;
BEGIN
    -- Count rows to be deleted
    SELECT COUNT(*) INTO target_count FROM rows_to_purge;

    -- Count dependent progress records
    SELECT COUNT(*) INTO progress_count
    FROM user_progress
    WHERE text_id IN (SELECT id FROM rows_to_purge);

    -- Count dependent review records
    SELECT COUNT(*) INTO review_count
    FROM review_history
    WHERE text_id IN (SELECT id FROM rows_to_purge);

    -- Count affected users
    SELECT COUNT(DISTINCT user_id) INTO affected_users
    FROM user_progress
    WHERE text_id IN (SELECT id FROM rows_to_purge);

    -- Log to output (visible in SQL editor)
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DATABASE CLEANUP EXECUTION STARTED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Timestamp: %', NOW();
    RAISE NOTICE 'Target source_texts rows: %', target_count;
    RAISE NOTICE 'Cascading user_progress rows: %', progress_count;
    RAISE NOTICE 'Cascading review_history rows: %', review_count;
    RAISE NOTICE 'Affected users: %', affected_users;
    RAISE NOTICE '========================================';

    -- Safety check: If deleting too much, abort
    IF target_count > 1000 THEN
        RAISE EXCEPTION 'SAFETY ABORT: Attempting to delete % rows (max 1000). Review criteria and increase limit if intentional.', target_count;
    END IF;

    IF affected_users > 10 THEN
        RAISE WARNING 'HIGH IMPACT: % users will lose progress data. Verify this is intentional.', affected_users;
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Delete Child Records (prevents FK violations)
-- ============================================================================
-- Delete review_history first (no foreign keys pointing to it)
DELETE FROM review_history
WHERE text_id IN (SELECT id FROM rows_to_purge);

RAISE NOTICE 'Deleted review_history records';

-- Delete user_progress (referenced by FSRS state)
DELETE FROM user_progress
WHERE text_id IN (SELECT id FROM rows_to_purge);

RAISE NOTICE 'Deleted user_progress records';

-- ============================================================================
-- STEP 4: Delete Parent Records (source_texts)
-- ============================================================================
DELETE FROM source_texts
WHERE id IN (SELECT id FROM rows_to_purge);

RAISE NOTICE 'Deleted source_texts records';

-- ============================================================================
-- STEP 5: Verification & Integrity Check
-- ============================================================================
DO $$
DECLARE
    remaining INT;
    orphaned_progress INT;
    orphaned_reviews INT;
BEGIN
    -- Check if any target rows still exist (should be 0)
    SELECT COUNT(*) INTO remaining
    FROM source_texts
    WHERE id IN (SELECT id FROM rows_to_purge);

    -- Check for orphaned user_progress (should be 0)
    SELECT COUNT(*) INTO orphaned_progress
    FROM user_progress up
    WHERE NOT EXISTS (
        SELECT 1 FROM source_texts st WHERE st.id = up.text_id
    );

    -- Check for orphaned review_history (should be 0)
    SELECT COUNT(*) INTO orphaned_reviews
    FROM review_history rh
    WHERE NOT EXISTS (
        SELECT 1 FROM source_texts st WHERE st.id = rh.text_id
    );

    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICATION RESULTS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Remaining target rows: % (expected: 0)', remaining;
    RAISE NOTICE 'Orphaned user_progress: % (expected: 0)', orphaned_progress;
    RAISE NOTICE 'Orphaned review_history: % (expected: 0)', orphaned_reviews;

    -- Abort if verification fails
    IF remaining > 0 THEN
        RAISE EXCEPTION 'VERIFICATION FAILED: % target rows still exist. Rolling back transaction.', remaining;
    END IF;

    IF orphaned_progress > 0 THEN
        RAISE EXCEPTION 'INTEGRITY VIOLATION: % orphaned user_progress records. Rolling back transaction.', orphaned_progress;
    END IF;

    IF orphaned_reviews > 0 THEN
        RAISE EXCEPTION 'INTEGRITY VIOLATION: % orphaned review_history records. Rolling back transaction.', orphaned_reviews;
    END IF;

    RAISE NOTICE 'All verification checks passed ✓';
END $$;

-- ============================================================================
-- STEP 6: Final Statistics
-- ============================================================================
DO $$
DECLARE
    total_texts INT;
    total_progress INT;
    total_reviews INT;
BEGIN
    SELECT COUNT(*) INTO total_texts FROM source_texts;
    SELECT COUNT(*) INTO total_progress FROM user_progress;
    SELECT COUNT(*) INTO total_reviews FROM review_history;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'DATABASE STATE AFTER CLEANUP';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Remaining source_texts: %', total_texts;
    RAISE NOTICE 'Remaining user_progress: %', total_progress;
    RAISE NOTICE 'Remaining review_history: %', total_reviews;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Cleanup completed successfully ✓';
    RAISE NOTICE 'Transaction ready to commit';
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- COMMIT TRANSACTION
-- ============================================================================
-- If all checks pass, uncomment the line below to commit changes
-- If any errors occurred, transaction will automatically ROLLBACK

COMMIT;

-- ============================================================================
-- POST-CLEANUP VERIFICATION QUERIES
-- ============================================================================
-- Run these queries AFTER commit to verify database integrity

-- Query 1: Verify no placeholder text remains
SELECT
    COUNT(*) as remaining_placeholder_texts
FROM source_texts
WHERE
    content IS NULL
    OR content ILIKE '%lorem ipsum%'
    OR content ILIKE '%placeholder%'
    OR LENGTH(content) < 100;
-- Expected result: 0

-- Query 2: Check for orphaned foreign key references
SELECT
    'user_progress' as table_name,
    COUNT(*) as orphaned_references
FROM user_progress up
LEFT JOIN source_texts st ON st.id = up.text_id
WHERE st.id IS NULL

UNION ALL

SELECT
    'review_history' as table_name,
    COUNT(*) as orphaned_references
FROM review_history rh
LEFT JOIN source_texts st ON st.id = rh.text_id
WHERE st.id IS NULL;
-- Expected result: Both should be 0

-- Query 3: Database size reduction
SELECT
    pg_size_pretty(pg_database_size(current_database())) as current_database_size,
    pg_size_pretty(pg_total_relation_size('source_texts')) as source_texts_size,
    pg_size_pretty(pg_total_relation_size('user_progress')) as user_progress_size,
    pg_size_pretty(pg_total_relation_size('review_history')) as review_history_size;

-- ============================================================================
-- ROLLBACK PROCEDURE (IF NEEDED)
-- ============================================================================
-- If you need to abort at any point, run:
-- ROLLBACK;
--
-- This will undo ALL changes made in this transaction
-- ============================================================================

-- ============================================================================
-- SUCCESS CONFIRMATION
-- ============================================================================
-- ✅ If you see "Cleanup completed successfully" above, the operation succeeded
-- ✅ Run the post-cleanup verification queries to confirm integrity
-- ✅ Check application to ensure no broken references
-- ✅ Monitor logs for any errors in next 24 hours
--
-- Next steps:
-- 1. Deploy database constraints (010_content_validation_constraints.sql)
-- 2. Update application code to prevent future placeholder data
-- 3. Document incident in changelog
-- ============================================================================
