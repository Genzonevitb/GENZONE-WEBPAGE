-- =============================================================================
-- GenZone — Site Config Table
-- File: 07_site_config.sql
-- Safe to re-run: IF NOT EXISTS, ON CONFLICT DO UPDATE, DROP POLICY IF EXISTS
-- =============================================================================

-- ─────────────────────────────────────────────
-- TABLE
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS site_config (
  key        TEXT        NOT NULL,
  status     TEXT        NOT NULL CHECK (status IN ('draft', 'published')),
  value      JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (key, status)
);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

-- Anon: read published rows only
DROP POLICY IF EXISTS "site_config: anon select published" ON site_config;
CREATE POLICY "site_config: anon select published"
  ON site_config FOR SELECT
  TO anon
  USING (status = 'published');

-- Admin: read all (including drafts)
DROP POLICY IF EXISTS "site_config: admin select" ON site_config;
CREATE POLICY "site_config: admin select"
  ON site_config FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- Admin: insert
DROP POLICY IF EXISTS "site_config: admin insert" ON site_config;
CREATE POLICY "site_config: admin insert"
  ON site_config FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- Admin: update
DROP POLICY IF EXISTS "site_config: admin update" ON site_config;
CREATE POLICY "site_config: admin update"
  ON site_config FOR UPDATE
  TO authenticated
  USING  (auth.jwt() ->> 'email' IN (SELECT email FROM admins))
  WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- Admin: delete
DROP POLICY IF EXISTS "site_config: admin delete" ON site_config;
CREATE POLICY "site_config: admin delete"
  ON site_config FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- ─────────────────────────────────────────────
-- SEED DATA
-- All rows use ON CONFLICT (key,status) DO UPDATE so re-runs refresh values.
-- ─────────────────────────────────────────────

INSERT INTO site_config (key, status, value) VALUES
(
  'intro_config', 'published',
  '{"show_mode":"every_visit","total_duration_ms":3600,"logo_stage_on":true,"wordmark_stage_on":false,"tagline":"NOT ANOTHER CLUB. THIS IS GENZONE.","particles_on":true,"particles_count":36,"particles_colors":["cyan","pink","yellow"],"particles_speed":1,"skip_label":"Tap to skip","skip_toggle":true,"logo_size":340,"logo_glow_color":"cyan","logo_glow_intensity":1,"reduced_motion":"instant"}'::jsonb
)
ON CONFLICT (key, status) DO UPDATE
  SET value      = EXCLUDED.value,
      updated_at = now();

INSERT INTO site_config (key, status, value) VALUES
(
  'global_fonts', 'published',
  '{"display":"Unbounded","body":"Space Grotesk","mono":"JetBrains Mono"}'::jsonb
)
ON CONFLICT (key, status) DO UPDATE
  SET value      = EXCLUDED.value,
      updated_at = now();

INSERT INTO site_config (key, status, value) VALUES
(
  'brand_colors', 'published',
  '{"cyan":"oklch(0.8 0.15 220)","pink":"oklch(0.64 0.26 0)","yellow":"oklch(0.88 0.18 92)","background":"oklch(0.08 0 0)"}'::jsonb
)
ON CONFLICT (key, status) DO UPDATE
  SET value      = EXCLUDED.value,
      updated_at = now();

INSERT INTO site_config (key, status, value) VALUES
(
  'hero_config', 'published',
  '{"line1":"NOT ANOTHER","line2":"CLUB. THIS IS","line3":"GENZONE.","subtitle":"Where creativity gets louder, ideas get bolder, and possibilities have no limits."}'::jsonb
)
ON CONFLICT (key, status) DO UPDATE
  SET value      = EXCLUDED.value,
      updated_at = now();

INSERT INTO site_config (key, status, value) VALUES
(
  'about_config', 'published',
  '{"label":"About GenZone","heading":"A playground for people who make things.","paragraph":"GenZone is the college''s creative and technical club — a crew of designers, coders, filmmakers, artists and curious minds who''d rather build than sit still.","story":"[Placeholder: your club''s story, mission and founding year go here.]","watermark":"LOUDER BOLDER"}'::jsonb
)
ON CONFLICT (key, status) DO UPDATE
  SET value      = EXCLUDED.value,
      updated_at = now();

INSERT INTO site_config (key, status, value) VALUES
(
  'section_headings', 'published',
  '{"events_label":"Events & Activities","events_heading":"What''s going down.","gallery_label":"GenZone Memories","gallery_heading":"Proof it happened.","panel_label":"Meet the Panel","panel_heading":"The people behind the noise.","feedback_label":"Suggestions & Feedback","feedback_heading":"Got something loud to say?","feedback_subtitle":"Ideas, rants, collabs — drop them here. The panel reads everything."}'::jsonb
)
ON CONFLICT (key, status) DO UPDATE
  SET value      = EXCLUDED.value,
      updated_at = now();

INSERT INTO site_config (key, status, value) VALUES
(
  'site_identity', 'published',
  '{"club_name":"GenZone","footer_tagline":"Not another club.","contact_email":"email@placeholder.com","location":"Campus address — to be added","instagram":"#","linkedin":"#","youtube":"#","twitter":"#"}'::jsonb
)
ON CONFLICT (key, status) DO UPDATE
  SET value      = EXCLUDED.value,
      updated_at = now();

INSERT INTO site_config (key, status, value) VALUES
(
  'panel_popup_design', 'published',
  '{"animation":"pop","speed":400,"layout":"photo-left","backdrop_blur":12,"backdrop_opacity":0.8,"corner_radius":16,"width":760,"card_hover":"tilt","caption_position":"below","aspect_ratio":"3/4"}'::jsonb
)
ON CONFLICT (key, status) DO UPDATE
  SET value      = EXCLUDED.value,
      updated_at = now();

INSERT INTO site_config (key, status, value) VALUES
(
  'about_layout_config', 'published',
  '{"section_height_desktop":800,"section_height_mobile":1200}'::jsonb
)
ON CONFLICT (key, status) DO UPDATE
  SET value      = EXCLUDED.value,
      updated_at = now();
