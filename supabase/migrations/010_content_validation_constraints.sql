-- ============================================================================
-- Migration 010: Content Validation Constraints
-- ============================================================================
-- Purpose: Add database-level constraints to prevent garbage data ingestion
-- Author: Claude Code (Literary Forge Implementation Plan)
-- Date: 2026-01-23
-- Dependencies: Requires cleanup of existing bad data first
--
-- IMPORTANT: Run db-cleanup-execute.sql BEFORE applying this migration
-- ============================================================================

-- ============================================================================
-- CONSTRAINT 1: Content Minimum Length
-- ============================================================================
-- Ensures all training content has sufficient length for meaningful practice
-- Rationale: Texts shorter than 100 chars cannot teach stylistic patterns

ALTER TABLE source_texts
ADD CONSTRAINT content_minimum_length
CHECK (
    content IS NOT NULL
    AND LENGTH(TRIM(content)) >= 100
);

COMMENT ON CONSTRAINT content_minimum_length ON source_texts IS
'Enforces minimum content length of 100 characters for training material.
Prevents ingestion of empty strings, fragments, or placeholder stubs.
Exception: None - all content must meet this threshold.';

-- ============================================================================
-- CONSTRAINT 2: No Placeholder Text
-- ============================================================================
-- Prevents common placeholder patterns from being stored
-- Rationale: Lorem ipsum and test text degrade user experience

ALTER TABLE source_texts
ADD CONSTRAINT no_placeholder_content
CHECK (
    content NOT ILIKE '%lorem ipsum%'
    AND content NOT ILIKE '%PLACEHOLDER%'
    AND content NOT ILIKE '%placeholder%'
    AND content NOT ILIKE '%dummy text%'
    AND content NOT ILIKE '%sample text%'
    AND content NOT ILIKE '%test text%'
);

COMMENT ON CONSTRAINT no_placeholder_content ON source_texts IS
'Prevents lorem ipsum, placeholder, and test text from being stored.
Enforced at database level to prevent bypassing application validation.
Case-insensitive matching ensures variations are caught.';

-- ============================================================================
-- CONSTRAINT 3: Title Validation
-- ============================================================================
-- Ensures titles are meaningful and not test artifacts
-- Rationale: Titles are displayed to users and must be professional

ALTER TABLE source_texts
ADD CONSTRAINT title_not_empty
CHECK (
    title IS NOT NULL
    AND LENGTH(TRIM(title)) > 0
    AND LENGTH(TRIM(title)) <= 500  -- Prevent abuse
);

-- Additional check: No test titles (but allow "Test" if it's a legitimate book title)
ALTER TABLE source_texts
ADD CONSTRAINT title_not_test_artifact
CHECK (
    NOT (title ILIKE 'test' AND author_id IS NULL)  -- "Test" without author = artifact
    AND title NOT ILIKE 'test_run_%'
    AND title NOT ILIKE 'untitled%'
    AND title NOT ILIKE 'test_%'  -- test_1, test_2, etc.
);

COMMENT ON CONSTRAINT title_not_empty ON source_texts IS
'Ensures title exists and is within reasonable length (1-500 chars).
Empty, null, or excessively long titles are rejected.';

COMMENT ON CONSTRAINT title_not_test_artifact ON source_texts IS
'Prevents test artifacts like "test", "test_1", "untitled" from being stored.
Exception: "Test" IS allowed if it has a valid author_id (could be legitimate title).';

-- ============================================================================
-- CONSTRAINT 4: Author Reference Required
-- ============================================================================
-- Ensures every text is attributed to an author
-- Rationale: Literary analysis requires authorial context

ALTER TABLE source_texts
ADD CONSTRAINT must_have_author
CHECK (author_id IS NOT NULL);

COMMENT ON CONSTRAINT must_have_author ON source_texts IS
'Requires author_id foreign key for all source texts.
Prevents orphaned texts without attribution.
Must create author record BEFORE inserting texts.';

-- ============================================================================
-- CONSTRAINT 5: Language Code Validation
-- ============================================================================
-- Ensures language field uses ISO 639-1 codes
-- Rationale: Standardized language codes enable proper NLP processing

ALTER TABLE source_texts
ADD CONSTRAINT valid_language_code
CHECK (
    language IS NOT NULL
    AND language IN ('de', 'en', 'fr', 'es', 'it')  -- Expand as needed
);

COMMENT ON CONSTRAINT valid_language_code ON source_texts IS
'Enforces ISO 639-1 language codes.
Currently supports: German (de), English (en), French (fr), Spanish (es), Italian (it).
Extend list as platform adds language support.';

-- ============================================================================
-- CONSTRAINT 6: Difficulty Level Range
-- ============================================================================
-- Ensures difficulty is within valid range
-- Rationale: Difficulty drives learning algorithm and must be consistent

ALTER TABLE source_texts
ADD CONSTRAINT valid_difficulty_range
CHECK (
    difficulty_level IS NOT NULL
    AND difficulty_level >= 1
    AND difficulty_level <= 5
);

COMMENT ON CONSTRAINT valid_difficulty_range ON source_texts IS
'Difficulty must be integer between 1 (easiest) and 5 (hardest).
Used by FSRS algorithm for adaptive scheduling.
Null values rejected to ensure consistent behavior.';

-- ============================================================================
-- CONSTRAINT 7: CEFR Level Validation (if provided)
-- ============================================================================
-- Ensures CEFR level is valid when specified
-- Rationale: CEFR is European standard for language proficiency

ALTER TABLE source_texts
ADD CONSTRAINT valid_cefr_level
CHECK (
    cefr_level IS NULL  -- Optional field
    OR cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')
);

COMMENT ON CONSTRAINT valid_cefr_level ON source_texts IS
'Common European Framework of Reference (CEFR) level validation.
Optional field: NULL is allowed (not all content has CEFR rating).
Valid values: A1 (beginner) through C2 (mastery).';

-- ============================================================================
-- CONSTRAINT 8: Metrics JSON Structure (optional enhancement)
-- ============================================================================
-- Ensures metrics field contains required keys if not null
-- Rationale: Metrics drive style feedback and must be consistent

ALTER TABLE source_texts
ADD CONSTRAINT metrics_structure_valid
CHECK (
    metrics IS NULL  -- Allow null during ingestion
    OR (
        jsonb_typeof(metrics) = 'object'
        AND metrics ? 'dependencyDistance'  -- Key exists
        AND metrics ? 'adjVerbRatio'
        AND metrics ? 'sentenceLengthVariance'
    )
);

COMMENT ON CONSTRAINT metrics_structure_valid ON source_texts IS
'Validates metrics JSONB structure contains required keys.
Required keys: dependencyDistance, adjVerbRatio, sentenceLengthVariance.
NULL is allowed during partial ingestion (metrics calculated separately).';

-- ============================================================================
-- CONSTRAINT 9: Embedding-Binary Consistency
-- ============================================================================
-- Ensures binary embedding exists if float32 embedding exists
-- Rationale: Binary embeddings are required for efficient search

-- NOTE: This constraint will be added AFTER binary quantization migration
-- Uncomment after running 009_binary_embeddings.sql migration:

-- ALTER TABLE source_texts
-- ADD CONSTRAINT embeddings_consistency
-- CHECK (
--     (embedding IS NULL AND embedding_binary IS NULL)  -- Both null = pending
--     OR (embedding IS NOT NULL AND embedding_binary IS NOT NULL)  -- Both exist = complete
-- );

-- COMMENT ON CONSTRAINT embeddings_consistency ON source_texts IS
-- 'Ensures float32 and binary embeddings are synchronized.
-- Either both NULL (pending processing) or both NOT NULL (fully processed).
-- Prevents partial embedding state that breaks semantic search.';

-- ============================================================================
-- POST-MIGRATION VERIFICATION
-- ============================================================================
-- Run these queries after migration to verify constraints are active

-- Query 1: List all constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM
    pg_constraint
WHERE
    conrelid = 'source_texts'::regclass
    AND conname LIKE '%content%' OR conname LIKE '%title%' OR conname LIKE '%author%'
ORDER BY
    conname;

-- Query 2: Test constraint enforcement (should FAIL)
-- DO NOT RUN IN PRODUCTION - FOR TESTING ONLY
/*
-- Test 1: Try to insert content < 100 chars (should fail)
INSERT INTO source_texts (title, author_id, content, language, difficulty_level)
VALUES ('Test', '00000000-0000-0000-0000-000000000000', 'Short', 'de', 1);
-- Expected: ERROR: new row violates check constraint "content_minimum_length"

-- Test 2: Try to insert lorem ipsum (should fail)
INSERT INTO source_texts (title, author_id, content, language, difficulty_level)
VALUES ('Test', '00000000-0000-0000-0000-000000000000', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', 'de', 1);
-- Expected: ERROR: new row violates check constraint "no_placeholder_content"

-- Test 3: Try to insert without author (should fail)
INSERT INTO source_texts (title, content, language, difficulty_level)
VALUES ('Test', 'This is a long enough text to pass the length check but has no author', 'de', 1);
-- Expected: ERROR: new row violates check constraint "must_have_author"
*/

-- ============================================================================
-- ROLLBACK PROCEDURE
-- ============================================================================
-- If constraints cause issues with existing data, rollback with:

/*
ALTER TABLE source_texts DROP CONSTRAINT IF EXISTS content_minimum_length;
ALTER TABLE source_texts DROP CONSTRAINT IF EXISTS no_placeholder_content;
ALTER TABLE source_texts DROP CONSTRAINT IF EXISTS title_not_empty;
ALTER TABLE source_texts DROP CONSTRAINT IF EXISTS title_not_test_artifact;
ALTER TABLE source_texts DROP CONSTRAINT IF EXISTS must_have_author;
ALTER TABLE source_texts DROP CONSTRAINT IF EXISTS valid_language_code;
ALTER TABLE source_texts DROP CONSTRAINT IF EXISTS valid_difficulty_range;
ALTER TABLE source_texts DROP CONSTRAINT IF EXISTS valid_cefr_level;
ALTER TABLE source_texts DROP CONSTRAINT IF EXISTS metrics_structure_valid;
*/

-- ============================================================================
-- SUCCESS CONFIRMATION
-- ============================================================================
-- ✅ Constraints added successfully
-- ✅ Database now enforces data quality at schema level
-- ✅ Application-level validation is still recommended (fail fast)
-- ✅ Constraints provide defense-in-depth for data integrity
--
-- Next steps:
-- 1. Update application ingestion code to handle constraint violations gracefully
-- 2. Add Zod validation in lib/ingest/validation.ts to catch errors before database
-- 3. Test ingestion flow end-to-end with both valid and invalid data
-- 4. Monitor database logs for constraint violations (indicates validation gaps)
-- ============================================================================
