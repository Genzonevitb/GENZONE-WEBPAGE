-- =============================================================================
-- GenZone — Extended Panel Member Fields
-- File: 09_panel_fields.sql
-- Adds new nullable/defaulted columns to the existing panel_members table.
-- Safe to re-run: every statement uses ADD COLUMN IF NOT EXISTS.
-- Never drops, renames, or alters existing columns.
-- =============================================================================

ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS department          TEXT;
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS year_batch          TEXT;
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS bio                 TEXT;
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS quote               TEXT;
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS skills              JSONB   DEFAULT '[]';
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS achievements        JSONB   DEFAULT '[]';
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS fun_fact            TEXT;
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS joined_date         DATE;
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS social_instagram    TEXT;
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS social_linkedin     TEXT;
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS social_github       TEXT;
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS social_x            TEXT;
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS social_email        TEXT;
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS social_portfolio    TEXT;
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS social_custom_url   TEXT;
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS social_custom_label TEXT;
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS focal_point         TEXT    DEFAULT '50% 50%';
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS accent_color_hex    TEXT;
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS hidden              BOOLEAN DEFAULT false;
ALTER TABLE panel_members ADD COLUMN IF NOT EXISTS show_fields         JSONB   DEFAULT '{"bio":true,"quote":true,"skills":true,"achievements":true,"fun_fact":true,"socials":true,"joined_date":true}';
