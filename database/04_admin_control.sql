-- ============================================================
-- GenZone Admin Control — ALL SECTIONS
-- Safe to re-run: uses IF NOT EXISTS, ON CONFLICT DO NOTHING,
-- DROP POLICY IF EXISTS before CREATE POLICY
-- Run in: Supabase SQL Editor → paste all → Run
-- ============================================================

-- ─────────────────────────────────────────────
-- SECTION 1 — Assets bucket + settings keys
-- ─────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assets', 'assets', true, 5242880,
  ARRAY['image/webp','image/jpeg','image/png','image/svg+xml','image/x-icon']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "assets: public read"   ON storage.objects;
DROP POLICY IF EXISTS "assets: admin insert"  ON storage.objects;
DROP POLICY IF EXISTS "assets: admin update"  ON storage.objects;
DROP POLICY IF EXISTS "assets: admin delete"  ON storage.objects;

CREATE POLICY "assets: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'assets');

CREATE POLICY "assets: admin insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'assets' AND auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "assets: admin update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'assets' AND auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "assets: admin delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'assets' AND auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- Seed Section-1 settings keys
INSERT INTO settings (key, value) VALUES
  ('logo_url',       ''),
  ('favicon_url',    ''),
  ('club_name',      'GenZone'),
  ('footer_tagline', 'Not another club.')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────
-- SECTION 2 — Hero text + marquee_words table
-- ─────────────────────────────────────────────

INSERT INTO settings (key, value) VALUES
  ('hero_line_1',   'NOT ANOTHER'),
  ('hero_line_2',   'CLUB. THIS IS'),
  ('hero_line_3',   'GENZONE.'),
  ('hero_subtitle', 'Where creativity gets louder, ideas get bolder, and possibilities have no limits.')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS marquee_words (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  word       TEXT        NOT NULL,
  sort_order INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE marquee_words ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "marquee_words: public read"   ON marquee_words;
DROP POLICY IF EXISTS "marquee_words: admin insert"  ON marquee_words;
DROP POLICY IF EXISTS "marquee_words: admin update"  ON marquee_words;
DROP POLICY IF EXISTS "marquee_words: admin delete"  ON marquee_words;

CREATE POLICY "marquee_words: public read"
  ON marquee_words FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "marquee_words: admin insert"
  ON marquee_words FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "marquee_words: admin update"
  ON marquee_words FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "marquee_words: admin delete"
  ON marquee_words FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- Seed default marquee words
INSERT INTO marquee_words (word, sort_order) VALUES
  ('Create', 0), ('Build', 1), ('Design', 2),
  ('Code', 3), ('Perform', 4), ('Repeat', 5)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- SECTION 3 — About text + about_stats table
-- ─────────────────────────────────────────────

INSERT INTO settings (key, value) VALUES
  ('about_label',     'About GenZone'),
  ('about_heading',   'A playground for people who make things.'),
  ('about_paragraph', 'GenZone is the college''s creative and technical club — a crew of designers, coders, filmmakers, artists and curious minds who''d rather build than sit still.'),
  ('about_story',     '[Placeholder: your club''s story, mission and founding year go here.]'),
  ('about_watermark', 'LOUDER BOLDER')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS about_stats (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  value      TEXT        NOT NULL,
  label      TEXT        NOT NULL,
  accent     TEXT        NOT NULL DEFAULT 'cyan'
                         CHECK (accent IN ('cyan','pink','yellow')),
  sort_order INTEGER     NOT NULL DEFAULT 0
);

ALTER TABLE about_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "about_stats: public read"   ON about_stats;
DROP POLICY IF EXISTS "about_stats: admin insert"  ON about_stats;
DROP POLICY IF EXISTS "about_stats: admin update"  ON about_stats;
DROP POLICY IF EXISTS "about_stats: admin delete"  ON about_stats;

CREATE POLICY "about_stats: public read"
  ON about_stats FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "about_stats: admin insert"
  ON about_stats FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "about_stats: admin update"
  ON about_stats FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "about_stats: admin delete"
  ON about_stats FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- Seed default stats
INSERT INTO about_stats (value, label, accent, sort_order) VALUES
  ('00+', 'Members', 'cyan',   0),
  ('00+', 'Events',  'pink',   1),
  ('00',  'Domains', 'yellow', 2)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- SECTION 4 — Section headings in settings
-- ─────────────────────────────────────────────

INSERT INTO settings (key, value) VALUES
  ('events_label',      'Events & Activities'),
  ('events_heading',    'What''s going down.'),
  ('gallery_label',     'GenZone Memories'),
  ('gallery_heading',   'Proof it happened.'),
  ('panel_label',       'Meet the Panel'),
  ('panel_heading',     'The people behind the noise.'),
  ('feedback_label',    'Suggestions & Feedback'),
  ('feedback_heading',  'Got something loud to say?'),
  ('feedback_subtitle', 'Ideas, rants, collabs — drop them here. The panel reads everything.')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────
-- SECTION 5 — Gallery albums
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gallery_albums (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  heading    TEXT,
  sort_order INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE gallery_albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gallery_albums: public read"   ON gallery_albums;
DROP POLICY IF EXISTS "gallery_albums: admin insert"  ON gallery_albums;
DROP POLICY IF EXISTS "gallery_albums: admin update"  ON gallery_albums;
DROP POLICY IF EXISTS "gallery_albums: admin delete"  ON gallery_albums;

CREATE POLICY "gallery_albums: public read"
  ON gallery_albums FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "gallery_albums: admin insert"
  ON gallery_albums FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "gallery_albums: admin update"
  ON gallery_albums FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "gallery_albums: admin delete"
  ON gallery_albums FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- Add album_id FK column to gallery (no-op if already exists)
ALTER TABLE gallery ADD COLUMN IF NOT EXISTS album_id UUID
  REFERENCES gallery_albums(id) ON DELETE SET NULL;

-- Seed the default "General" album (idempotent via ON CONFLICT DO NOTHING on name)
INSERT INTO gallery_albums (name, heading, sort_order)
VALUES ('General', 'All Memories', 0)
ON CONFLICT DO NOTHING;
