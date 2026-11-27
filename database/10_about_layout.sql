-- =============================================================================
-- GenZone — About Layout Table
-- File: 10_about_layout.sql
-- Stores desktop/mobile layout config for the About section.
-- Safe to re-run: IF NOT EXISTS, ON CONFLICT DO NOTHING, DROP POLICY IF EXISTS.
-- =============================================================================

-- ─────────────────────────────────────────────
-- TABLE
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS about_layout (
  id                      TEXT        PRIMARY KEY DEFAULT 'main',
  desktop_config          JSONB       NOT NULL DEFAULT '{}',
  mobile_config           JSONB,
  section_height_desktop  INTEGER     DEFAULT 800,
  section_height_mobile   INTEGER     DEFAULT 1200,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

ALTER TABLE about_layout ENABLE ROW LEVEL SECURITY;

-- Anon: read all rows
DROP POLICY IF EXISTS "about_layout: anon select" ON about_layout;
CREATE POLICY "about_layout: anon select"
  ON about_layout FOR SELECT
  TO anon
  USING (true);

-- Admin: read all rows
DROP POLICY IF EXISTS "about_layout: admin select" ON about_layout;
CREATE POLICY "about_layout: admin select"
  ON about_layout FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- Admin: insert
DROP POLICY IF EXISTS "about_layout: admin insert" ON about_layout;
CREATE POLICY "about_layout: admin insert"
  ON about_layout FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- Admin: update
DROP POLICY IF EXISTS "about_layout: admin update" ON about_layout;
CREATE POLICY "about_layout: admin update"
  ON about_layout FOR UPDATE
  TO authenticated
  USING  (auth.jwt() ->> 'email' IN (SELECT email FROM admins))
  WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- Admin: delete
DROP POLICY IF EXISTS "about_layout: admin delete" ON about_layout;
CREATE POLICY "about_layout: admin delete"
  ON about_layout FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- ─────────────────────────────────────────────
-- SEED — single canonical row
-- ─────────────────────────────────────────────

INSERT INTO about_layout (id, desktop_config, mobile_config, section_height_desktop, section_height_mobile)
VALUES ('main', '{}', NULL, 800, 1200)
ON CONFLICT DO NOTHING;
