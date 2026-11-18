-- =============================================================================
-- GenZone College Club — MEGA SETUP FILE
-- File: 00_test_project_setup.sql
--
-- PURPOSE: One idempotent file to create EVERYTHING from scratch.
--          Combines 01_schema.sql, 02_policies.sql, 03_storage.sql,
--          04_admin_control.sql, 05_events_registration.sql in order.
--
-- SAFE TO RE-RUN: Uses IF NOT EXISTS, ON CONFLICT DO NOTHING,
--                 DROP POLICY IF EXISTS before every CREATE POLICY.
--
-- ORDER:
--   1. Extensions
--   2. Tables (schema)
--   3. RLS enable + policies
--   4. Storage buckets + storage policies
--   5. Admin control extras (assets bucket, settings seeds, marquee_words,
--      about_stats, gallery_albums)
--   6. Events registration (columns, event_form_fields, event_registrations,
--      submit_registration function)
--   7. Seed admin
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1 — EXTENSIONS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2 — CORE TABLES (from 01_schema.sql)
-- ─────────────────────────────────────────────────────────────────────────────

-- 2.1 admins
--   Managed exclusively via the SQL Editor — no client-side mutations allowed.
CREATE TABLE IF NOT EXISTS admins (
  email TEXT PRIMARY KEY
);

-- 2.2 events
CREATE TABLE IF NOT EXISTS events (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  description   TEXT,
  event_date    TIMESTAMPTZ,
  venue         TEXT,
  category      TEXT        CHECK (category IN ('Workshop','Hackathon','Showcase','Fest','Other')),
  accent        TEXT        NOT NULL DEFAULT 'cyan'   CHECK (accent IN ('cyan','pink','yellow')),
  image_url     TEXT,
  image_path    TEXT,
  is_published  BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.3 panel_members
CREATE TABLE IF NOT EXISTS panel_members (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  role          TEXT        NOT NULL,
  accent        TEXT        NOT NULL DEFAULT 'cyan'   CHECK (accent IN ('cyan','pink','yellow')),
  portrait_url  TEXT,
  portrait_path TEXT,
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.4 gallery
CREATE TABLE IF NOT EXISTS gallery (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  caption     TEXT,
  category    TEXT,
  image_url   TEXT        NOT NULL,
  image_path  TEXT        NOT NULL,
  thumb_url   TEXT,
  thumb_path  TEXT,
  event_id    UUID        REFERENCES events(id) ON DELETE SET NULL,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  tall        BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.5 feedback
CREATE TABLE IF NOT EXISTS feedback (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  kind       TEXT        NOT NULL DEFAULT 'Feedback'
                         CHECK (kind IN ('Idea','Feedback','Collab','Other')),
  name       TEXT        NOT NULL,
  email      TEXT,
  message    TEXT        NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.6 settings
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3 — ROW LEVEL SECURITY + POLICIES (from 02_policies.sql)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE admins        ENABLE ROW LEVEL SECURITY;
ALTER TABLE events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE panel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery       ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback      ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings      ENABLE ROW LEVEL SECURITY;

-- admins: allow authenticated users to read their OWN row only
-- (avoids circular RLS — can't be in admins to read admins)
DROP POLICY IF EXISTS "admins: admin select"              ON admins;
DROP POLICY IF EXISTS "admins: authenticated self select" ON admins;
CREATE POLICY "admins: authenticated self select"
  ON admins FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

-- events
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
  USING  (auth.jwt() ->> 'email' IN (SELECT email FROM admins))
  WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "events: admin delete"
  ON events FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- panel_members
DROP POLICY IF EXISTS "panel_members: anon select"   ON panel_members;
DROP POLICY IF EXISTS "panel_members: admin select"  ON panel_members;
DROP POLICY IF EXISTS "panel_members: admin insert"  ON panel_members;
DROP POLICY IF EXISTS "panel_members: admin update"  ON panel_members;
DROP POLICY IF EXISTS "panel_members: admin delete"  ON panel_members;

CREATE POLICY "panel_members: anon select"
  ON panel_members FOR SELECT TO anon USING (true);

CREATE POLICY "panel_members: admin select"
  ON panel_members FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "panel_members: admin insert"
  ON panel_members FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "panel_members: admin update"
  ON panel_members FOR UPDATE TO authenticated
  USING  (auth.jwt() ->> 'email' IN (SELECT email FROM admins))
  WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "panel_members: admin delete"
  ON panel_members FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- gallery
DROP POLICY IF EXISTS "gallery: anon select"   ON gallery;
DROP POLICY IF EXISTS "gallery: admin select"  ON gallery;
DROP POLICY IF EXISTS "gallery: admin insert"  ON gallery;
DROP POLICY IF EXISTS "gallery: admin update"  ON gallery;
DROP POLICY IF EXISTS "gallery: admin delete"  ON gallery;

CREATE POLICY "gallery: anon select"
  ON gallery FOR SELECT TO anon USING (true);

CREATE POLICY "gallery: admin select"
  ON gallery FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "gallery: admin insert"
  ON gallery FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "gallery: admin update"
  ON gallery FOR UPDATE TO authenticated
  USING  (auth.jwt() ->> 'email' IN (SELECT email FROM admins))
  WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "gallery: admin delete"
  ON gallery FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- feedback
DROP POLICY IF EXISTS "feedback: anon insert"   ON feedback;
DROP POLICY IF EXISTS "feedback: admin select"  ON feedback;
DROP POLICY IF EXISTS "feedback: admin delete"  ON feedback;

CREATE POLICY "feedback: anon insert"
  ON feedback FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "feedback: admin select"
  ON feedback FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "feedback: admin delete"
  ON feedback FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- settings
DROP POLICY IF EXISTS "settings: anon select"   ON settings;
DROP POLICY IF EXISTS "settings: admin select"  ON settings;
DROP POLICY IF EXISTS "settings: admin insert"  ON settings;
DROP POLICY IF EXISTS "settings: admin update"  ON settings;
DROP POLICY IF EXISTS "settings: admin delete"  ON settings;

CREATE POLICY "settings: anon select"
  ON settings FOR SELECT TO anon USING (true);

CREATE POLICY "settings: admin select"
  ON settings FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "settings: admin insert"
  ON settings FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "settings: admin update"
  ON settings FOR UPDATE TO authenticated
  USING  (auth.jwt() ->> 'email' IN (SELECT email FROM admins))
  WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "settings: admin delete"
  ON settings FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 4 — STORAGE BUCKETS + POLICIES (from 03_storage.sql)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('panel',   'panel',   true, 5242880, ARRAY['image/webp','image/jpeg','image/png']),
  ('gallery', 'gallery', true, 5242880, ARRAY['image/webp','image/jpeg','image/png']),
  ('events',  'events',  true, 5242880, ARRAY['image/webp','image/jpeg','image/png'])
ON CONFLICT (id) DO UPDATE
  SET public             = EXCLUDED.public,
      file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop old/legacy storage policies
DROP POLICY IF EXISTS "panel: public read"      ON storage.objects;
DROP POLICY IF EXISTS "panel: admin insert"     ON storage.objects;
DROP POLICY IF EXISTS "panel: admin update"     ON storage.objects;
DROP POLICY IF EXISTS "panel: admin delete"     ON storage.objects;
DROP POLICY IF EXISTS "gallery: public read"    ON storage.objects;
DROP POLICY IF EXISTS "gallery: admin insert"   ON storage.objects;
DROP POLICY IF EXISTS "gallery: admin update"   ON storage.objects;
DROP POLICY IF EXISTS "gallery: admin delete"   ON storage.objects;
DROP POLICY IF EXISTS "events: public read"     ON storage.objects;
DROP POLICY IF EXISTS "events: admin insert"    ON storage.objects;
DROP POLICY IF EXISTS "events: admin update"    ON storage.objects;
DROP POLICY IF EXISTS "events: admin delete"    ON storage.objects;
DROP POLICY IF EXISTS "portraits: public read"  ON storage.objects;
DROP POLICY IF EXISTS "portraits: admin insert" ON storage.objects;
DROP POLICY IF EXISTS "portraits: admin update" ON storage.objects;
DROP POLICY IF EXISTS "portraits: admin delete" ON storage.objects;

CREATE POLICY "panel: public read"
  ON storage.objects FOR SELECT USING (bucket_id = 'panel');

CREATE POLICY "panel: admin insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'panel' AND auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "panel: admin update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'panel' AND auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "panel: admin delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'panel' AND auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "gallery: public read"
  ON storage.objects FOR SELECT USING (bucket_id = 'gallery');

CREATE POLICY "gallery: admin insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gallery' AND auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "gallery: admin update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'gallery' AND auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "gallery: admin delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'gallery' AND auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "events: public read"
  ON storage.objects FOR SELECT USING (bucket_id = 'events');

CREATE POLICY "events: admin insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'events' AND auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "events: admin update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'events' AND auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "events: admin delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'events' AND auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 5 — ADMIN CONTROL EXTRAS (from 04_admin_control.sql)
-- ─────────────────────────────────────────────────────────────────────────────

-- Assets bucket
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
  ON storage.objects FOR SELECT USING (bucket_id = 'assets');

CREATE POLICY "assets: admin insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'assets' AND auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "assets: admin update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'assets' AND auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "assets: admin delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'assets' AND auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- Settings seeds
INSERT INTO settings (key, value) VALUES
  ('logo_url',       ''),
  ('favicon_url',    ''),
  ('club_name',      'GenZone'),
  ('footer_tagline', 'Not another club.'),
  ('hero_line_1',   'NOT ANOTHER'),
  ('hero_line_2',   'CLUB. THIS IS'),
  ('hero_line_3',   'GENZONE.'),
  ('hero_subtitle', 'Where creativity gets louder, ideas get bolder, and possibilities have no limits.'),
  ('about_label',     'About GenZone'),
  ('about_heading',   'A playground for people who make things.'),
  ('about_paragraph', 'GenZone is the college''s creative and technical club — a crew of designers, coders, filmmakers, artists and curious minds who''d rather build than sit still.'),
  ('about_story',     '[Placeholder: your club''s story, mission and founding year go here.]'),
  ('about_watermark', 'LOUDER BOLDER'),
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

-- marquee_words
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

INSERT INTO marquee_words (word, sort_order) VALUES
  ('Create', 0), ('Build', 1), ('Design', 2),
  ('Code', 3), ('Perform', 4), ('Repeat', 5)
ON CONFLICT DO NOTHING;

-- about_stats
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

INSERT INTO about_stats (value, label, accent, sort_order) VALUES
  ('00+', 'Members', 'cyan',   0),
  ('00+', 'Events',  'pink',   1),
  ('00',  'Domains', 'yellow', 2)
ON CONFLICT DO NOTHING;

-- gallery_albums
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

ALTER TABLE gallery ADD COLUMN IF NOT EXISTS album_id UUID
  REFERENCES gallery_albums(id) ON DELETE SET NULL;

INSERT INTO gallery_albums (name, heading, sort_order)
VALUES ('General', 'All Memories', 0)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 6 — EVENTS REGISTRATION (from 05_events_registration.sql)
-- ─────────────────────────────────────────────────────────────────────────────

-- New columns on events (idempotent)
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_open       BOOLEAN     NOT NULL DEFAULT true;
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_deadline   TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS max_seats              INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS one_response_per_email BOOLEAN     NOT NULL DEFAULT true;
ALTER TABLE events ADD COLUMN IF NOT EXISTS form_mode              TEXT        NOT NULL DEFAULT 'builtin'
                                                                   CHECK (form_mode IN ('builtin','external'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS external_form_url      TEXT;

-- event_form_fields
CREATE TABLE IF NOT EXISTS event_form_fields (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  label       TEXT        NOT NULL,
  type        TEXT        NOT NULL
              CHECK (type IN ('short_text','paragraph','email','phone','number','dropdown','radio','checkbox','date')),
  options     JSONB,
  required    BOOLEAN     NOT NULL DEFAULT false,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  placeholder TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE event_form_fields ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_form_fields: anon select"   ON event_form_fields;
DROP POLICY IF EXISTS "event_form_fields: admin select"  ON event_form_fields;
DROP POLICY IF EXISTS "event_form_fields: admin insert"  ON event_form_fields;
DROP POLICY IF EXISTS "event_form_fields: admin update"  ON event_form_fields;
DROP POLICY IF EXISTS "event_form_fields: admin delete"  ON event_form_fields;

CREATE POLICY "event_form_fields: anon select"
  ON event_form_fields FOR SELECT TO anon
  USING (event_id IN (SELECT id FROM events WHERE is_published = true));

CREATE POLICY "event_form_fields: admin select"
  ON event_form_fields FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "event_form_fields: admin insert"
  ON event_form_fields FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "event_form_fields: admin update"
  ON event_form_fields FOR UPDATE TO authenticated
  USING  (auth.jwt() ->> 'email' IN (SELECT email FROM admins))
  WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "event_form_fields: admin delete"
  ON event_form_fields FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- event_registrations
CREATE TABLE IF NOT EXISTS event_registrations (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  answers          JSONB       NOT NULL DEFAULT '{}',
  respondent_email TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_email    ON event_registrations(event_id, respondent_email);

ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_registrations: admin select"  ON event_registrations;
DROP POLICY IF EXISTS "event_registrations: admin insert"  ON event_registrations;
DROP POLICY IF EXISTS "event_registrations: admin update"  ON event_registrations;
DROP POLICY IF EXISTS "event_registrations: admin delete"  ON event_registrations;

CREATE POLICY "event_registrations: admin select"
  ON event_registrations FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "event_registrations: admin insert"
  ON event_registrations FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "event_registrations: admin update"
  ON event_registrations FOR UPDATE TO authenticated
  USING  (auth.jwt() ->> 'email' IN (SELECT email FROM admins))
  WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "event_registrations: admin delete"
  ON event_registrations FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- submit_registration() — SECURITY DEFINER function (anon-safe)
CREATE OR REPLACE FUNCTION submit_registration(
  p_event_id         UUID,
  p_answers          JSONB,
  p_respondent_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event   RECORD;
  v_count   BIGINT;
  v_field   RECORD;
  v_answer  TEXT;
  v_email   TEXT;
BEGIN
  v_email := NULLIF(trim(p_respondent_email), '');

  SELECT id, title, is_published, registration_open,
         registration_deadline, max_seats, one_response_per_email
  INTO v_event
  FROM events
  WHERE id = p_event_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Event not found.');
  END IF;

  IF NOT v_event.is_published THEN
    RETURN jsonb_build_object('success', false, 'error', 'This event is not publicly available.');
  END IF;

  IF NOT v_event.registration_open THEN
    RETURN jsonb_build_object('success', false, 'error', 'Registrations are closed for this event.');
  END IF;

  IF v_event.registration_deadline IS NOT NULL AND now() > v_event.registration_deadline THEN
    RETURN jsonb_build_object('success', false, 'error', 'The registration deadline has passed.');
  END IF;

  IF v_event.max_seats IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count FROM event_registrations WHERE event_id = p_event_id;
    IF v_count >= v_event.max_seats THEN
      RETURN jsonb_build_object('success', false, 'error', 'This event is fully booked. No seats remaining.');
    END IF;
  END IF;

  IF v_event.one_response_per_email AND v_email IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM event_registrations
      WHERE event_id = p_event_id AND lower(respondent_email) = lower(v_email)
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'You have already registered for this event with this email address.');
    END IF;
  END IF;

  FOR v_field IN (
    SELECT id::TEXT AS fid, label, type
    FROM event_form_fields
    WHERE event_id = p_event_id AND required = true
    ORDER BY sort_order
  ) LOOP
    IF v_field.type = 'checkbox' THEN
      IF (p_answers -> v_field.fid) IS NULL
         OR jsonb_typeof(p_answers -> v_field.fid) <> 'array'
         OR jsonb_array_length(p_answers -> v_field.fid) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', '"' || v_field.label || '" is required.');
      END IF;
    ELSE
      v_answer := trim(p_answers ->> v_field.fid);
      IF v_answer IS NULL OR v_answer = '' THEN
        RETURN jsonb_build_object('success', false, 'error', '"' || v_field.label || '" is required.');
      END IF;
    END IF;
  END LOOP;

  INSERT INTO event_registrations (event_id, answers, respondent_email)
  VALUES (p_event_id, p_answers, lower(v_email));

  RETURN jsonb_build_object(
    'success', true,
    'message', 'You''re registered! See you at ' || v_event.title || '.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION submit_registration(UUID, JSONB, TEXT) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 7 — SEED ADMIN
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO admins (email)
VALUES ('krrish.25bsa10137@vitbhopal.ac.in')
ON CONFLICT DO NOTHING;
