-- =============================================================================
-- GenZone — Panel Members Extended Social URLs & Per-Member Card Visibility
-- File: database/13_panel_card_social_links.sql
-- Additive & idempotent migration for TEST (and later LIVE) Supabase.
-- Reuses existing instagram_url, linkedin_url, social_email, and card_overrides.
-- Adds missing github_url, x_url, portfolio_url columns + social_visibility jsonb.
-- =============================================================================

-- 1. Ensure all HTTPS social URL columns exist (nullable TEXT with default '')
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS instagram_url TEXT DEFAULT '';
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS linkedin_url  TEXT DEFAULT '';
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS github_url    TEXT DEFAULT '';
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS x_url         TEXT DEFAULT '';
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS portfolio_url TEXT DEFAULT '';

-- 2. Add nullable JSONB column for per-member per-platform card visibility toggles
--    When NULL or key omitted, defaults to visible (true) if the link is non-empty.
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS social_visibility JSONB DEFAULT NULL;

-- 3. Safely backfill from legacy social_* columns only when already valid https:// URLs
UPDATE panel_members
SET
  instagram_url = CASE
    WHEN COALESCE(instagram_url, '') = '' AND COALESCE(social_instagram, '') ~* '^https://' THEN social_instagram
    ELSE instagram_url
  END,
  linkedin_url = CASE
    WHEN COALESCE(linkedin_url, '') = '' AND COALESCE(social_linkedin, '') ~* '^https://' THEN social_linkedin
    ELSE linkedin_url
  END,
  github_url = CASE
    WHEN COALESCE(github_url, '') = '' AND COALESCE(social_github, '') ~* '^https://' THEN social_github
    ELSE github_url
  END,
  x_url = CASE
    WHEN COALESCE(x_url, '') = '' AND COALESCE(social_x, '') ~* '^https://' THEN social_x
    ELSE x_url
  END,
  portfolio_url = CASE
    WHEN COALESCE(portfolio_url, '') = '' AND COALESCE(social_portfolio, '') ~* '^https://' THEN social_portfolio
    ELSE portfolio_url
  END
WHERE
  (COALESCE(instagram_url, '') = '' AND COALESCE(social_instagram, '') ~* '^https://')
  OR (COALESCE(linkedin_url, '') = '' AND COALESCE(social_linkedin, '') ~* '^https://')
  OR (COALESCE(github_url, '') = '' AND COALESCE(social_github, '') ~* '^https://')
  OR (COALESCE(x_url, '') = '' AND COALESCE(social_x, '') ~* '^https://')
  OR (COALESCE(portfolio_url, '') = '' AND COALESCE(social_portfolio, '') ~* '^https://');

-- 4. Add idempotent HTTPS-only CHECK constraints on URL columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_panel_members_instagram_url') THEN
    ALTER TABLE panel_members
      ADD CONSTRAINT check_panel_members_instagram_url
      CHECK (instagram_url IS NULL OR instagram_url = '' OR instagram_url ~* '^https://');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_panel_members_linkedin_url') THEN
    ALTER TABLE panel_members
      ADD CONSTRAINT check_panel_members_linkedin_url
      CHECK (linkedin_url IS NULL OR linkedin_url = '' OR linkedin_url ~* '^https://');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_panel_members_github_url') THEN
    ALTER TABLE panel_members
      ADD CONSTRAINT check_panel_members_github_url
      CHECK (github_url IS NULL OR github_url = '' OR github_url ~* '^https://');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_panel_members_x_url') THEN
    ALTER TABLE panel_members
      ADD CONSTRAINT check_panel_members_x_url
      CHECK (x_url IS NULL OR x_url = '' OR x_url ~* '^https://');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_panel_members_portfolio_url') THEN
    ALTER TABLE panel_members
      ADD CONSTRAINT check_panel_members_portfolio_url
      CHECK (portfolio_url IS NULL OR portfolio_url = '' OR portfolio_url ~* '^https://');
  END IF;
END $$;
