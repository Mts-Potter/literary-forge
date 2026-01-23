-- ============================================================================
-- DIAGNOSTIC QUERY: DRY-RUN IMPACT ASSESSMENT
-- ============================================================================
-- Purpose: Identify placeholder/garbage data WITHOUT modifying anything
-- Execute via: Supabase SQL Editor (read-only mode)
-- Expected output: List of rows that would be deleted with cleanup script
-- ============================================================================

WITH placeholder_candidates AS (
    SELECT
        id,
        title,
        author_id,
        content,
        LENGTH(content) as content_length,
        created_at
    FROM
        source_texts
    WHERE
        -- Category 1: Structural Voids (empty/null content)
        content IS NULL
        OR TRIM(content) = ''
        OR LENGTH(content) < 100

        -- Category 2: Semantic Placeholders (lorem ipsum, test text)
        OR content ILIKE '%lorem ipsum%'
        OR content ILIKE '%placeholder%'
        OR content ILIKE '%test text%'
        OR content ILIKE '%PLACEHOLDER%'
        OR content ILIKE '%dummy text%'
        OR content ILIKE '%sample text%'

        -- Category 3: Metadata Issues (missing required fields)
        OR title ILIKE '%test%'
        OR title ILIKE '%untitled%'
        OR title = ''
        OR title ILIKE 'test_run_%'
        OR author_id IS NULL

        -- Category 4: Suspiciously Short Content
        OR (LENGTH(content) < 200 AND title ILIKE '%test%')
),
dependency_counts AS (
    SELECT
        text_id as source_text_id,
        COUNT(*) as progress_entries,
        COUNT(DISTINCT user_id) as affected_users,
        MAX(next_review) as latest_review
    FROM
        user_progress
    WHERE
        text_id IN (SELECT id FROM placeholder_candidates)
    GROUP BY
        text_id
),
review_counts AS (
    SELECT
        text_id as source_text_id,
        COUNT(*) as review_entries,
        MIN(review_date) as first_review,
        MAX(review_date) as last_review
    FROM
        review_history
    WHERE
        text_id IN (SELECT id FROM placeholder_candidates)
    GROUP BY
        text_id
)
SELECT
    pc.id,
    pc.title,
    pc.content_length,
    SUBSTRING(pc.content, 1, 100) as content_preview,
    COALESCE(dc.progress_entries, 0) as dependent_progress_records,
    COALESCE(dc.affected_users, 0) as affected_users,
    COALESCE(rc.review_entries, 0) as review_entries,
    CASE
        WHEN pc.content IS NULL THEN 'SQL_NULL'
        WHEN TRIM(pc.content) = '' THEN 'EMPTY_STRING'
        WHEN LENGTH(pc.content) < 100 THEN 'TOO_SHORT'
        WHEN pc.content ILIKE '%lorem ipsum%' THEN 'LOREM_IPSUM'
        WHEN pc.content ILIKE '%placeholder%' THEN 'PLACEHOLDER_TEXT'
        WHEN pc.author_id IS NULL THEN 'NO_AUTHOR'
        WHEN pc.title ILIKE '%test%' THEN 'TEST_TITLE'
        ELSE 'METADATA_FLAGGED'
    END as deletion_reason,
    pc.created_at
FROM
    placeholder_candidates pc
LEFT JOIN
    dependency_counts dc ON pc.id = dc.source_text_id
LEFT JOIN
    review_counts rc ON pc.id = rc.source_text_id
ORDER BY
    dependent_progress_records DESC,
    review_entries DESC,
    content_length ASC,
    pc.created_at DESC;

-- ============================================================================
-- SUMMARY STATISTICS
-- ============================================================================
-- Count total rows that would be affected
SELECT
    'SUMMARY' as report_type,
    COUNT(*) as total_rows_to_delete,
    COUNT(DISTINCT pc.author_id) as authors_affected,
    SUM(CASE WHEN pc.content IS NULL THEN 1 ELSE 0 END) as null_content,
    SUM(CASE WHEN LENGTH(pc.content) < 100 THEN 1 ELSE 0 END) as too_short,
    SUM(CASE WHEN pc.content ILIKE '%lorem ipsum%' THEN 1 ELSE 0 END) as lorem_ipsum,
    SUM(CASE WHEN pc.author_id IS NULL THEN 1 ELSE 0 END) as missing_author,
    COALESCE(SUM(dc.progress_entries), 0) as total_progress_records,
    COALESCE(SUM(rc.review_entries), 0) as total_review_records,
    COUNT(DISTINCT COALESCE(dc.source_text_id, rc.source_text_id)) as texts_with_user_data
FROM
    (SELECT
        id,
        title,
        author_id,
        content
    FROM
        source_texts
    WHERE
        content IS NULL
        OR TRIM(content) = ''
        OR LENGTH(content) < 100
        OR content ILIKE '%lorem ipsum%'
        OR content ILIKE '%placeholder%'
        OR content ILIKE '%PLACEHOLDER%'
        OR content ILIKE '%test text%'
        OR (title ILIKE '%test%' AND author_id IS NULL)
        OR title ILIKE 'test_run_%') pc
LEFT JOIN
    (SELECT text_id as source_text_id, COUNT(*) as progress_entries
     FROM user_progress
     GROUP BY text_id) dc ON pc.id = dc.source_text_id
LEFT JOIN
    (SELECT text_id as source_text_id, COUNT(*) as review_entries
     FROM review_history
     GROUP BY text_id) rc ON pc.id = rc.source_text_id;

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
-- 1. Review the detailed results above
-- 2. Verify that NO legitimate content appears in the list
-- 3. Pay special attention to rows with:
--    - affected_users > 0 (users have practiced this text)
--    - review_entries > 0 (feedback has been given)
-- 4. If ANY legitimate content is flagged, STOP and refine the criteria
-- 5. Export results to CSV for manual review if needed
-- 6. Only proceed to db-cleanup-execute.sql if 100% confident
--
-- SAFETY CHECKS:
-- - Are any book titles you recognize in the list? (e.g., "The Trial", "The Castle")
-- - Do all flagged rows truly deserve deletion?
-- - Have you backed up the database before proceeding?
-- ============================================================================
