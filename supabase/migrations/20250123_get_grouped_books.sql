-- RPC function to get all books grouped by title (removing "Teil X" suffix)
-- This avoids the 1000-row limit by aggregating on the database side

CREATE OR REPLACE FUNCTION get_grouped_books()
RETURNS TABLE (
  title TEXT,
  author TEXT,
  author_id UUID,
  cefr_level TEXT,
  tags TEXT[],
  language TEXT,
  chunk_count BIGINT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    -- Remove " (Teil X)" suffix to get base title
    REGEXP_REPLACE(st.title, ' \(Teil \d+\)$', '') AS title,
    a.name AS author,
    st.author_id,
    MAX(st.cefr_level) AS cefr_level,
    -- Get tags from any chunk (they should be the same for all chunks of a book)
    (ARRAY_AGG(st.tags) FILTER (WHERE st.tags IS NOT NULL))[1] AS tags,
    MAX(st.language) AS language,
    COUNT(*) AS chunk_count
  FROM source_texts st
  JOIN authors a ON st.author_id = a.id
  GROUP BY REGEXP_REPLACE(st.title, ' \(Teil \d+\)$', ''), a.name, st.author_id
  ORDER BY title;
$$;

COMMENT ON FUNCTION get_grouped_books IS
'Returns all books grouped by base title (removing " (Teil X)" suffix).
Aggregates chunk count, and gets metadata from the first chunk.
Avoids the 1000-row Supabase limit by doing aggregation in SQL.';

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_grouped_books TO authenticated;
GRANT EXECUTE ON FUNCTION get_grouped_books TO anon;
