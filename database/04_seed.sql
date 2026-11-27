-- =============================================================================
-- GenZone College Club — Seed Data
-- File: 04_seed.sql
-- Run this LAST, after 03_storage.sql.
-- =============================================================================
-- Populates the database with placeholder data that mirrors the static
-- frontend content defined in genzone.ts so the site renders immediately
-- without requiring manual data entry.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- events (4 rows — matches frontend Event Title 01-04 placeholders)
-- ---------------------------------------------------------------------------
INSERT INTO events (title, description, event_date, venue, category, accent, is_published)
VALUES
  (
    'Event Title 01',
    'A hands-on session diving into the latest tools and technologies. Come ready to build, break, and learn.',
    NULL,                     -- event_date NULL renders as "Date TBA" on frontend
    NULL,
    'Workshop',
    'pink',
    true
  ),
  (
    'Event Title 02',
    'Twenty-four hours. One idea. Build something that matters. Teams of up to four — all skill levels welcome.',
    NULL,
    NULL,
    'Hackathon',
    'cyan',
    true
  ),
  (
    'Event Title 03',
    'The annual showcase where members present their semester projects to peers, faculty, and industry guests.',
    NULL,
    NULL,
    'Showcase',
    'yellow',
    true
  ),
  (
    'Event Title 04',
    'Our flagship annual fest — talks, workshops, performances, and surprises. The biggest day on the GenZone calendar.',
    NULL,
    NULL,
    'Fest',
    'pink',
    true
  );

-- ---------------------------------------------------------------------------
-- panel_members (6 rows — mirrors the 6 role slots in genzone.ts)
-- ---------------------------------------------------------------------------
INSERT INTO panel_members (name, role, accent, sort_order)
VALUES
  ('Member Name', 'President',       'pink',   1),
  ('Member Name', 'Vice President',  'cyan',   2),
  ('Member Name', 'Creative Head',   'yellow', 3),
  ('Member Name', 'Technical Head',  'pink',   4),
  ('Member Name', 'Events Lead',     'cyan',   5),
  ('Member Name', 'Media Lead',      'yellow', 6);

-- ---------------------------------------------------------------------------
-- settings (key-value rows for contact info, socials, and tagline)
-- ---------------------------------------------------------------------------
INSERT INTO settings (key, value)
VALUES
  ('contact_email', 'email@placeholder.com'),
  ('location',      'Campus address — to be added'),
  ('tagline',       'Not another club.'),
  ('instagram',     '#'),
  ('linkedin',      '#'),
  ('youtube',       '#'),
  ('twitter',       '#')
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value;   -- idempotent: safe to re-run
