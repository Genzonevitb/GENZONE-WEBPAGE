-- =============================================================================
-- GenZone College Club — Row Level Security Policies
-- File: 02_policies.sql
-- Run this SECOND, after 01_schema.sql.
-- =============================================================================
-- Summary of access rules:
--   anon    → SELECT published events, panel_members, gallery, settings
--             INSERT feedback (write-only)
--   admin   → Full CRUD on events, panel_members, gallery, settings
--             SELECT + DELETE on feedback
--   nobody  → INSERT / UPDATE / DELETE on admins from the client
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper: reusable admin check expression
--   auth.jwt() ->> 'email'  reads the email claim from the JWT.
--   We verify it exists in the admins table.
-- ---------------------------------------------------------------------------

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =============================================================================
ALTER TABLE admins        ENABLE ROW LEVEL SECURITY;
ALTER TABLE events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE panel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery       ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback      ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings      ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- admins table
--   No client-initiated writes whatsoever.
--   Admins can SELECT their own row (needed for the JWT check sub-query).
-- =============================================================================

-- Allow admins to read the admins table (sub-query self-check)
CREATE POLICY "admins: admin select"
  ON admins FOR SELECT
  USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  );

-- Explicitly deny all mutations from client (no INSERT / UPDATE / DELETE policies)
-- Without a permissive policy, RLS blocks them by default.

-- =============================================================================
-- events table
-- =============================================================================

-- Public: read published events only
CREATE POLICY "events: anon select published"
  ON events FOR SELECT
  TO anon
  USING (is_published = true);

-- Authenticated admin: read ALL events (including unpublished drafts)
CREATE POLICY "events: admin select all"
  ON events FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  );

-- Admin: insert events
CREATE POLICY "events: admin insert"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  );

-- Admin: update events
CREATE POLICY "events: admin update"
  ON events FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  )
  WITH CHECK (
    auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  );

-- Admin: delete events
CREATE POLICY "events: admin delete"
  ON events FOR DELETE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  );

-- =============================================================================
-- panel_members table
-- =============================================================================

-- Public: read all panel members
CREATE POLICY "panel_members: anon select"
  ON panel_members FOR SELECT
  TO anon
  USING (true);

-- Authenticated admin: read panel members
CREATE POLICY "panel_members: admin select"
  ON panel_members FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  );

-- Admin: insert panel members
CREATE POLICY "panel_members: admin insert"
  ON panel_members FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  );

-- Admin: update panel members
CREATE POLICY "panel_members: admin update"
  ON panel_members FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  )
  WITH CHECK (
    auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  );

-- Admin: delete panel members
CREATE POLICY "panel_members: admin delete"
  ON panel_members FOR DELETE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  );

-- =============================================================================
-- gallery table
-- =============================================================================

-- Public: read all gallery rows
CREATE POLICY "gallery: anon select"
  ON gallery FOR SELECT
  TO anon
  USING (true);

-- Authenticated admin: read gallery
CREATE POLICY "gallery: admin select"
  ON gallery FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  );

-- Admin: insert gallery
CREATE POLICY "gallery: admin insert"
  ON gallery FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  );

-- Admin: update gallery
CREATE POLICY "gallery: admin update"
  ON gallery FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  )
  WITH CHECK (
    auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  );

-- Admin: delete gallery
CREATE POLICY "gallery: admin delete"
  ON gallery FOR DELETE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  );

-- =============================================================================
-- feedback table
-- =============================================================================

-- Public: INSERT only (write-only — no SELECT for anon)
CREATE POLICY "feedback: anon insert"
  ON feedback FOR INSERT
  TO anon
  WITH CHECK (true);

-- Admin: read feedback submissions
CREATE POLICY "feedback: admin select"
  ON feedback FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  );

-- Admin: delete feedback submissions (e.g. spam)
CREATE POLICY "feedback: admin delete"
  ON feedback FOR DELETE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  );

-- Note: No UPDATE on feedback — submissions are immutable.

-- =============================================================================
-- settings table
-- =============================================================================

-- Public: read all settings (contact info, socials, tagline)
CREATE POLICY "settings: anon select"
  ON settings FOR SELECT
  TO anon
  USING (true);

-- Authenticated admin: read settings
CREATE POLICY "settings: admin select"
  ON settings FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  );

-- Admin: insert settings
CREATE POLICY "settings: admin insert"
  ON settings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  );

-- Admin: update settings
CREATE POLICY "settings: admin update"
  ON settings FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  )
  WITH CHECK (
    auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  );

-- Admin: delete settings rows
CREATE POLICY "settings: admin delete"
  ON settings FOR DELETE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  );
