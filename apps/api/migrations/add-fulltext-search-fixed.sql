-- Story 4.2: Add PostgreSQL Full-Text Search Support
-- Created: 2025-10-17
-- Fixed version: No Chinese characters, corrected column names

-- 1. Add search_vector column if not exists
ALTER TABLE "content" 
ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- 2. Create GIN index to speed up full-text search
CREATE INDEX IF NOT EXISTS "content_search_vector_idx" 
ON "content" USING gin("search_vector");

-- 3. Create or replace trigger function to auto-update search_vector
-- Weight explanation:
-- A (highest): title - most important
-- B (high): description/summary - important
-- C (medium): content body - normal
-- D (low): tags - auxiliary
CREATE OR REPLACE FUNCTION update_content_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(array_to_string(NEW.tags, ' '), '')), 'D');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Drop old trigger if exists and create new trigger
DROP TRIGGER IF EXISTS content_search_vector_update ON "content";

CREATE TRIGGER content_search_vector_update
BEFORE INSERT OR UPDATE ON "content"
FOR EACH ROW
EXECUTE FUNCTION update_content_search_vector();

-- 5. Update search_vector for existing content
-- Only update content with status PROCESSED
UPDATE "content"
SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(content, '')), 'C') ||
  setweight(to_tsvector('simple', COALESCE(array_to_string(tags, ' '), '')), 'D')
WHERE status = 'PROCESSED' AND search_vector IS NULL;

-- 6. Create helper function: highlight search results
CREATE OR REPLACE FUNCTION highlight_search_results(
  text_content TEXT,
  query_text TEXT,
  start_tag TEXT DEFAULT '<mark>',
  end_tag TEXT DEFAULT '</mark>',
  max_words INT DEFAULT 35,
  min_words INT DEFAULT 15,
  max_fragments INT DEFAULT 3
)
RETURNS TEXT AS $$
BEGIN
  RETURN ts_headline(
    'english',
    text_content,
    to_tsquery('english', query_text),
    'StartSel=' || start_tag || 
    ', StopSel=' || end_tag ||
    ', MaxWords=' || max_words ||
    ', MinWords=' || min_words ||
    ', MaxFragments=' || max_fragments
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 7. Create test view for search functionality (for testing and debugging)
CREATE OR REPLACE VIEW search_test_view AS
SELECT 
  id,
  title,
  substring(description, 1, 100) as description_preview,
  category,
  tags,
  score,
  "publishedAt",
  length(search_vector::text) as vector_size
FROM "content"
WHERE search_vector IS NOT NULL
ORDER BY "publishedAt" DESC
LIMIT 10;

-- Verification queries (run manually after migration):
-- SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'content' AND indexname = 'content_search_vector_idx';
-- SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'content_search_vector_update';
-- SELECT COUNT(*) FROM "content" WHERE search_vector IS NOT NULL;
-- SELECT * FROM search_test_view;

