-- =============================================================================
-- GenZone — Panel Members Extended Social Links
-- File: 10_panel_social_links.sql
-- Safe to re-run: idempotent migration with ADD COLUMN IF NOT EXISTS.
-- Adds validated HTTPS URL columns for member social platforms.
-- =============================================================================

ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS instagram_url TEXT DEFAULT '';
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS linkedin_url  TEXT DEFAULT '';
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS github_url    TEXT DEFAULT '';
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS x_url         TEXT DEFAULT '';
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS portfolio_url TEXT DEFAULT '';

-- Populate from existing legacy columns if present and new columns are empty
UPDATE panel_members
SET 
  instagram_url = COALESCE(NULLIF(instagram_url, ''), social_instagram, ''),
  linkedin_url  = COALESCE(NULLIF(linkedin_url, ''), social_linkedin, ''),
  github_url    = COALESCE(NULLIF(github_url, ''), social_github, ''),
  x_url         = COALESCE(NULLIF(x_url, ''), social_x, ''),
  portfolio_url = COALESCE(NULLIF(portfolio_url, ''), social_portfolio, '')
WHERE 
  instagram_url = '' OR linkedin_url = '' OR github_url = '' OR x_url = '' OR portfolio_url = '';

-- Add URL format validation constraints (https or empty string) idempotently
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_panel_members_instagram_url'
  ) THEN
    ALTER TABLE panel_members 
    ADD CONSTRAINT check_panel_members_instagram_url 
    CHECK (instagram_url IS NULL OR instagram_url = '' OR instagram_url ~* '^https://');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_panel_members_linkedin_url'
  ) THEN
    ALTER TABLE panel_members 
    ADD CONSTRAINT check_panel_members_linkedin_url 
    CHECK (linkedin_url IS NULL OR linkedin_url = '' OR linkedin_url ~* '^https://');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_panel_members_github_url'
  ) THEN
    ALTER TABLE panel_members 
    ADD CONSTRAINT check_panel_members_github_url 
    CHECK (github_url IS NULL OR github_url = '' OR github_url ~* '^https://');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_panel_members_x_url'
  ) THEN
    ALTER TABLE panel_members 
    ADD CONSTRAINT check_panel_members_x_url 
    CHECK (x_url IS NULL OR x_url = '' OR x_url ~* '^https://');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_panel_members_portfolio_url'
  ) THEN
    ALTER TABLE panel_members 
    ADD CONSTRAINT check_panel_members_portfolio_url 
    CHECK (portfolio_url IS NULL OR portfolio_url = '' OR portfolio_url ~* '^https://');
  END IF;
END $$;
