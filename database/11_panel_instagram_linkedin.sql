-- =============================================================================
-- GenZone — Panel Members Instagram & LinkedIn URLs Migration
-- File: database/11_panel_instagram_linkedin.sql
-- Description: Adds nullable instagram_url and linkedin_url columns to panel_members
-- Idempotent & safe to re-run: Uses ADD COLUMN IF NOT EXISTS.
-- =============================================================================

-- 1. Add nullable columns for Instagram & LinkedIn HTTPS URLs
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS instagram_url TEXT DEFAULT NULL;
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS linkedin_url  TEXT DEFAULT NULL;

-- 2. Backfill from existing legacy columns if present and new columns are NULL
UPDATE panel_members
SET
  instagram_url = COALESCE(NULLIF(instagram_url, ''), NULLIF(social_instagram, ''), NULL),
  linkedin_url  = COALESCE(NULLIF(linkedin_url, ''),  NULLIF(social_linkedin, ''),  NULL)
WHERE
  (instagram_url IS NULL AND social_instagram IS NOT NULL)
  OR (linkedin_url IS NULL AND social_linkedin IS NOT NULL);

-- 3. Ensure public SELECT policy exists and is active for panel_members
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'panel_members' AND policyname = 'panel_members_select_public'
  ) THEN
    CREATE POLICY "panel_members_select_public" ON panel_members FOR SELECT USING (true);
  END IF;
END $$;
