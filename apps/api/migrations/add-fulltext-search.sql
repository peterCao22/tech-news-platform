-- Story 4.2: 添加PostgreSQL全文搜索支持
-- 创建时间: 2025-10-17

-- 1. 添加搜索向量列（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE "content" 
    ADD COLUMN "search_vector" tsvector;
  END IF;
END $$;

-- 2. 创建GIN索引以加速全文搜索（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'content' AND indexname = 'content_search_vector_idx'
  ) THEN
    CREATE INDEX "content_search_vector_idx" 
    ON "content" USING gin("search_vector");
  END IF;
END $$;

-- 3. 创建或替换触发器函数，自动更新search_vector
CREATE OR REPLACE FUNCTION update_content_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  -- 权重说明:
  -- A (最高): 标题 - 最重要
  -- B (高): 描述/摘要 - 重要
  -- C (中): 正文内容 - 一般
  -- D (低): 标签 - 辅助
  
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'C') ||
    setweight(to_tsvector('simple', COALESCE(array_to_string(NEW.tags, ' '), '')), 'D');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 删除旧触发器（如果存在）并创建新触发器
DROP TRIGGER IF EXISTS content_search_vector_update ON "content";

CREATE TRIGGER content_search_vector_update
BEFORE INSERT OR UPDATE ON "content"
FOR EACH ROW
EXECUTE FUNCTION update_content_search_vector();

-- 5. 更新现有数据的search_vector
-- 只更新状态为PROCESSED的内容
UPDATE "content"
SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(content, '')), 'C') ||
  setweight(to_tsvector('simple', COALESCE(array_to_string(tags, ' '), '')), 'D')
WHERE status = 'PROCESSED' AND search_vector IS NULL;

-- 6. 创建辅助函数：高亮搜索结果
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

-- 7. 验证索引和触发器状态
DO $$
DECLARE
  index_count INT;
  trigger_count INT;
  vector_count INT;
BEGIN
  -- 检查索引
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE tablename = 'content' AND indexname = 'content_search_vector_idx';
  
  -- 检查触发器
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger 
  WHERE tgname = 'content_search_vector_update';
  
  -- 检查已填充的search_vector数量
  SELECT COUNT(*) INTO vector_count
  FROM "content"
  WHERE search_vector IS NOT NULL;
  
  -- 输出验证结果
  RAISE NOTICE '✅ 全文搜索设置完成';
  RAISE NOTICE '   - GIN索引数量: %', index_count;
  RAISE NOTICE '   - 触发器数量: %', trigger_count;
  RAISE NOTICE '   - 已索引内容数: %', vector_count;
  
  IF index_count = 0 THEN
    RAISE WARNING '⚠️ GIN索引创建失败';
  END IF;
  
  IF trigger_count = 0 THEN
    RAISE WARNING '⚠️ 触发器创建失败';
  END IF;
END $$;

-- 8. 创建搜索示例视图（用于测试和调试）
CREATE OR REPLACE VIEW search_test_view AS
SELECT 
  id,
  title,
  substring(description, 1, 100) as description_preview,
  category,
  tags,
  "aiScore",
  "publishedAt",
  length(search_vector::text) as vector_size
FROM "content"
WHERE search_vector IS NOT NULL
ORDER BY "publishedAt" DESC
LIMIT 10;

-- 完成
RAISE NOTICE '🎉 全文搜索迁移完成！';
RAISE NOTICE '   可以使用以下查询测试搜索功能:';
RAISE NOTICE '   SELECT * FROM search_test_view;';

