-- =============================================================================
-- GenZone Storage Fix
-- Run this in Supabase SQL Editor.
-- Safe to re-run (uses ON CONFLICT DO NOTHING and DROP POLICY IF EXISTS).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- STEP 1: Create the three buckets (public, 5 MB limit, images only)
-- Bucket names MUST exactly match what the code uses:
--   'panel'   ← Panel.tsx  (portrait photos)
--   'gallery' ← Gallery.tsx (gallery images)
--   'events'  ← Events.tsx  (event poster images)
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('panel',   'panel',   true, 5242880, ARRAY['image/webp','image/jpeg','image/png']),
  ('gallery', 'gallery', true, 5242880, ARRAY['image/webp','image/jpeg','image/png']),
  ('events',  'events',  true, 5242880, ARRAY['image/webp','image/jpeg','image/png'])
ON CONFLICT (id) DO UPDATE
  SET public             = EXCLUDED.public,
      file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- STEP 2: Drop old policies (safe to re-run)
-- ---------------------------------------------------------------------------

-- panel bucket
DROP POLICY IF EXISTS "panel: public read"    ON storage.objects;
DROP POLICY IF EXISTS "panel: admin insert"   ON storage.objects;
DROP POLICY IF EXISTS "panel: admin update"   ON storage.objects;
DROP POLICY IF EXISTS "panel: admin delete"   ON storage.objects;

-- gallery bucket
DROP POLICY IF EXISTS "gallery: public read"  ON storage.objects;
DROP POLICY IF EXISTS "gallery: admin insert" ON storage.objects;
DROP POLICY IF EXISTS "gallery: admin update" ON storage.objects;
DROP POLICY IF EXISTS "gallery: admin delete" ON storage.objects;

-- events bucket
DROP POLICY IF EXISTS "events: public read"   ON storage.objects;
DROP POLICY IF EXISTS "events: admin insert"  ON storage.objects;
DROP POLICY IF EXISTS "events: admin update"  ON storage.objects;
DROP POLICY IF EXISTS "events: admin delete"  ON storage.objects;

-- old misnamed bucket policies (portraits)
DROP POLICY IF EXISTS "portraits: public read"   ON storage.objects;
DROP POLICY IF EXISTS "portraits: admin insert"  ON storage.objects;
DROP POLICY IF EXISTS "portraits: admin update"  ON storage.objects;
DROP POLICY IF EXISTS "portraits: admin delete"  ON storage.objects;

-- ---------------------------------------------------------------------------
-- STEP 3: Create storage policies for each bucket
-- ---------------------------------------------------------------------------

-- ── panel ──────────────────────────────────────────────────────────────────

CREATE POLICY "panel: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'panel');

CREATE POLICY "panel: admin insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'panel'
    AND auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  );

CREATE POLICY "panel: admin update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'panel'
    AND auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  );

CREATE POLICY "panel: admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'panel'
    AND auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  );

-- ── gallery ────────────────────────────────────────────────────────────────

CREATE POLICY "gallery: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery');

CREATE POLICY "gallery: admin insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'gallery'
    AND auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  );

CREATE POLICY "gallery: admin update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'gallery'
    AND auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  );

CREATE POLICY "gallery: admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'gallery'
    AND auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  );

-- ── events ─────────────────────────────────────────────────────────────────

CREATE POLICY "events: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'events');

CREATE POLICY "events: admin insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'events'
    AND auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  );

CREATE POLICY "events: admin update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'events'
    AND auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  );

CREATE POLICY "events: admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'events'
    AND auth.jwt() ->> 'email' IN (SELECT email FROM admins)
  );
