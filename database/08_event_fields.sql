-- =============================================================================
-- GenZone — Extended Event Fields
-- File: 08_event_fields.sql
-- Adds new nullable/defaulted columns to the existing events table.
-- Safe to re-run: every statement uses ADD COLUMN IF NOT EXISTS.
-- Never drops, renames, or alters existing columns.
-- =============================================================================

ALTER TABLE events ADD COLUMN IF NOT EXISTS google_form_url          TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS register_button_label    TEXT        DEFAULT 'Register Now';
ALTER TABLE events ADD COLUMN IF NOT EXISTS closed_label             TEXT        DEFAULT 'Registration Closed';
ALTER TABLE events ADD COLUMN IF NOT EXISTS featured                 BOOLEAN     DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS highlights               JSONB       DEFAULT '[]';
ALTER TABLE events ADD COLUMN IF NOT EXISTS full_description         TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS schedule                 JSONB       DEFAULT '[]';
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_end_time           TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS entry_fee                TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS eligibility              TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS dress_code               TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS seats_note               TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS speakers                 JSONB       DEFAULT '[]';
ALTER TABLE events ADD COLUMN IF NOT EXISTS sponsor_logos            JSONB       DEFAULT '[]';
ALTER TABLE events ADD COLUMN IF NOT EXISTS extra_gallery            JSONB       DEFAULT '[]';
ALTER TABLE events ADD COLUMN IF NOT EXISTS faqs                     JSONB       DEFAULT '[]';
ALTER TABLE events ADD COLUMN IF NOT EXISTS tags                     TEXT[]      DEFAULT '{}';
ALTER TABLE events ADD COLUMN IF NOT EXISTS contact_name             TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS contact_whatsapp         TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS whatsapp_group_url       TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS brochure_url             TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS status_badge_override    TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS accent_color_hex         TEXT;
