-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- Create search vector column for full-text search (if not exists via Prisma)
-- This will be added to the SearchIndex table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute 
    WHERE attrelid = 'SearchIndex'::regclass 
    AND attname = 'search_vector'
  ) THEN
    ALTER TABLE "SearchIndex" ADD COLUMN search_vector tsvector;
  END IF;
END $$;

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_search_index_search_vector 
ON "SearchIndex" USING GIN(search_vector);

-- Create GIN index for trigram search on primaryText
CREATE INDEX IF NOT EXISTS idx_search_index_primary_text_trgm 
ON "SearchIndex" USING GIN("primaryText" gin_trgm_ops);

-- Create GIN index for trigram search on secondaryText
CREATE INDEX IF NOT EXISTS idx_search_index_secondary_text_trgm 
ON "SearchIndex" USING GIN("secondaryText" gin_trgm_ops);

-- Create GIN index for trigram search on authorName
CREATE INDEX IF NOT EXISTS idx_search_index_author_name_trgm 
ON "SearchIndex" USING GIN("authorName" gin_trgm_ops);

-- Create index for tags array
CREATE INDEX IF NOT EXISTS idx_search_index_tags 
ON "SearchIndex" USING GIN(tags);

-- Create composite index for keyset pagination
CREATE INDEX IF NOT EXISTS idx_search_index_updated_at_id 
ON "SearchIndex"("updatedAt" DESC, id DESC);

-- Create function to update search_vector automatically
CREATE OR REPLACE FUNCTION update_search_index_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    to_tsvector('english', 
      COALESCE(NEW."primaryText", '') || ' ' || 
      COALESCE(NEW."secondaryText", '') || ' ' || 
      COALESCE(NEW."authorName", '') || ' ' || 
      COALESCE(NEW."brandName", '')
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update search_vector
DROP TRIGGER IF EXISTS trigger_update_search_vector ON "SearchIndex";
CREATE TRIGGER trigger_update_search_vector
  BEFORE INSERT OR UPDATE ON "SearchIndex"
  FOR EACH ROW
  EXECUTE FUNCTION update_search_index_vector();

-- Update existing rows
UPDATE "SearchIndex" 
SET search_vector = to_tsvector('english', 
  COALESCE("primaryText", '') || ' ' || 
  COALESCE("secondaryText", '') || ' ' || 
  COALESCE("authorName", '') || ' ' || 
  COALESCE("brandName", '')
);

-- Row Level Security (RLS) setup for tenant isolation
ALTER TABLE "SearchIndex" ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
DROP POLICY IF EXISTS tenant_isolation_policy ON "SearchIndex";
CREATE POLICY tenant_isolation_policy ON "SearchIndex"
  FOR ALL
  USING (current_setting('app.current_tenant_id', true)::int = "tenantId");
