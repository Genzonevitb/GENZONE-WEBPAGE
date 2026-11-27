-- =============================================================================
-- GenZone College Club — Database Schema
-- File: 01_schema.sql
-- Run this FIRST in the Supabase SQL Editor.
-- =============================================================================

-- Enable UUID / crypto extension (required for gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. admins
--    Managed exclusively via the SQL Editor — no client-side mutations allowed.
--    A user whose Auth email exists in this table gains full CMS privileges.
-- =============================================================================
CREATE TABLE IF NOT EXISTS admins (
  email TEXT PRIMARY KEY
);

-- =============================================================================
-- 2. events
--    Public-facing club events (workshops, hackathons, showcases, fests).
--    is_published = false hides the row from anon queries.
-- =============================================================================
CREATE TABLE IF NOT EXISTS events (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  description   TEXT,
  event_date    TIMESTAMPTZ,                          -- NULL renders as "Date TBA" on the frontend
  venue         TEXT,
  category      TEXT        CHECK (category IN ('Workshop','Hackathon','Showcase','Fest','Other')),
  accent        TEXT        NOT NULL DEFAULT 'cyan'   CHECK (accent IN ('cyan','pink','yellow')),
  image_url     TEXT,                                 -- public CDN URL (from storage bucket)
  image_path    TEXT,                                 -- storage object path, used for deletion
  is_published  BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 3. panel_members
--    Current committee / core team.
--    sort_order controls the display sequence on the frontend.
-- =============================================================================
CREATE TABLE IF NOT EXISTS panel_members (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  role          TEXT        NOT NULL,
  accent        TEXT        NOT NULL DEFAULT 'cyan'   CHECK (accent IN ('cyan','pink','yellow')),
  portrait_url  TEXT,                                 -- public CDN URL
  portrait_path TEXT,                                 -- storage object path, used for deletion
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 4. gallery
--    Photo memories / behind-the-scenes shots.
--    tall = true renders the image in a taller grid cell on the frontend.
--    Optional event_id links a photo back to its parent event.
-- =============================================================================
CREATE TABLE IF NOT EXISTS gallery (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  caption     TEXT,
  category    TEXT,                                   -- "Events"|"Workshops"|"Behind the Scenes"|"Fests"
  image_url   TEXT        NOT NULL,                   -- full-size public CDN URL
  image_path  TEXT        NOT NULL,                   -- storage object path, used for deletion
  thumb_url   TEXT,                                   -- optional thumbnail CDN URL
  thumb_path  TEXT,                                   -- storage object path for thumbnail
  event_id    UUID        REFERENCES events(id) ON DELETE SET NULL,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  tall        BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 5. feedback
--    Submissions from the public contact / feedback form.
--    Anon users can INSERT only — no SELECT from client side.
-- =============================================================================
CREATE TABLE IF NOT EXISTS feedback (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  kind       TEXT        NOT NULL DEFAULT 'Feedback'
                         CHECK (kind IN ('Idea','Feedback','Collab','Other')),
  name       TEXT        NOT NULL,
  email      TEXT,
  message    TEXT        NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 6. settings
--    Generic key-value store for site-wide config: contact email, socials, etc.
--    Readable by everyone; writable only by admins.
-- =============================================================================
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);
