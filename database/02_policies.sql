-- =============================================================================
-- GenZone College Club — Row Level Security Policies
-- File: 02_policies.sql
-- Fully idempotent: drops each policy before recreating it.
-- Safe to run on both TEST and LIVE projects.
-- =============================================================================

-- Enable RLS (safe to run even if already enabled)
ALTER TABLE admins        ENABLE ROW LEVEL SECURITY;
ALTER TABLE events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE panel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery       ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback      ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings      ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- admins table
-- =============================================================================
DROP POLICY IF EXISTS "admins: authenticated self select" ON admins;
DROP POLICY IF EXISTS "admins: admin select"              ON admins;
CREATE POLICY "admins: authenticated self select"
  ON admins FOR SELECT TO authenticated
  USING (email = auth.jwt() ->> 'email');

-- =============================================================================
-- events table
-- =============================================================================
DROP POLICY IF EXISTS "events: anon select published" ON events;
DROP POLICY IF EXISTS "events: admin select all"      ON events;
DROP POLICY IF EXISTS "events: admin insert"          ON events;
DROP POLICY IF EXISTS "events: admin update"          ON events;
DROP POLICY IF EXISTS "events: admin delete"          ON events;

CREATE POLICY "events: anon select published"
  ON events FOR SELECT TO anon
  USING (is_published = true);

CREATE POLICY "events: admin select all"
  ON events FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "events: admin insert"
  ON events FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "events: admin update"
  ON events FOR UPDATE TO authenticated
  USING     (auth.jwt() ->> 'email' IN (SELECT email FROM admins))
  WITH CHECK(auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "events: admin delete"
  ON events FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- =============================================================================
-- panel_members table
-- =============================================================================
DROP POLICY IF EXISTS "panel_members: anon select"   ON panel_members;
DROP POLICY IF EXISTS "panel_members: admin select"  ON panel_members;
DROP POLICY IF EXISTS "panel_members: admin insert"  ON panel_members;
DROP POLICY IF EXISTS "panel_members: admin update"  ON panel_members;
DROP POLICY IF EXISTS "panel_members: admin delete"  ON panel_members;

CREATE POLICY "panel_members: anon select"
  ON panel_members FOR SELECT TO anon
  USING (true);

CREATE POLICY "panel_members: admin select"
  ON panel_members FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "panel_members: admin insert"
  ON panel_members FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "panel_members: admin update"
  ON panel_members FOR UPDATE TO authenticated
  USING     (auth.jwt() ->> 'email' IN (SELECT email FROM admins))
  WITH CHECK(auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "panel_members: admin delete"
  ON panel_members FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- =============================================================================
-- gallery table
-- =============================================================================
DROP POLICY IF EXISTS "gallery: anon select"   ON gallery;
DROP POLICY IF EXISTS "gallery: admin select"  ON gallery;
DROP POLICY IF EXISTS "gallery: admin insert"  ON gallery;
DROP POLICY IF EXISTS "gallery: admin update"  ON gallery;
DROP POLICY IF EXISTS "gallery: admin delete"  ON gallery;

CREATE POLICY "gallery: anon select"
  ON gallery FOR SELECT TO anon
  USING (true);

CREATE POLICY "gallery: admin select"
  ON gallery FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "gallery: admin insert"
  ON gallery FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "gallery: admin update"
  ON gallery FOR UPDATE TO authenticated
  USING     (auth.jwt() ->> 'email' IN (SELECT email FROM admins))
  WITH CHECK(auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "gallery: admin delete"
  ON gallery FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- =============================================================================
-- feedback table
-- =============================================================================
DROP POLICY IF EXISTS "feedback: anon insert"   ON feedback;
DROP POLICY IF EXISTS "feedback: admin select"  ON feedback;
DROP POLICY IF EXISTS "feedback: admin delete"  ON feedback;

CREATE POLICY "feedback: anon insert"
  ON feedback FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "feedback: admin select"
  ON feedback FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "feedback: admin delete"
  ON feedback FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- =============================================================================
-- settings table
-- =============================================================================
DROP POLICY IF EXISTS "settings: anon select"   ON settings;
DROP POLICY IF EXISTS "settings: admin select"  ON settings;
DROP POLICY IF EXISTS "settings: admin insert"  ON settings;
DROP POLICY IF EXISTS "settings: admin update"  ON settings;
DROP POLICY IF EXISTS "settings: admin delete"  ON settings;

CREATE POLICY "settings: anon select"
  ON settings FOR SELECT TO anon
  USING (true);

CREATE POLICY "settings: admin select"
  ON settings FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "settings: admin insert"
  ON settings FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "settings: admin update"
  ON settings FOR UPDATE TO authenticated
  USING     (auth.jwt() ->> 'email' IN (SELECT email FROM admins))
  WITH CHECK(auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "settings: admin delete"
  ON settings FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));
