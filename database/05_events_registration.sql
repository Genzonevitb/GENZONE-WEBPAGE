-- ============================================================
-- GenZone Events Registration System — ALL PARTS
-- File: 05_events_registration.sql
-- Safe to re-run: IF NOT EXISTS, ON CONFLICT DO NOTHING,
-- DROP POLICY IF EXISTS, CREATE OR REPLACE FUNCTION
-- Run in Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────
-- PART 1 — New columns on events table
-- ─────────────────────────────────────────────
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_open        BOOLEAN     NOT NULL DEFAULT true;
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_deadline    TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS max_seats               INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS one_response_per_email  BOOLEAN     NOT NULL DEFAULT true;
ALTER TABLE events ADD COLUMN IF NOT EXISTS form_mode               TEXT        NOT NULL DEFAULT 'builtin'
                                                                    CHECK (form_mode IN ('builtin','external'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS external_form_url       TEXT;

-- ─────────────────────────────────────────────
-- PART 3 — event_form_fields table
-- ─────────────────────────────────────────────
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

-- Public: read form fields for published events only
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
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins))
  WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "event_form_fields: admin delete"
  ON event_form_fields FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- ─────────────────────────────────────────────
-- PART 3 — event_registrations table
-- ─────────────────────────────────────────────
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

-- !! Public CANNOT select, insert, update, or delete registrations directly.
-- !! All public submissions go through the submit_registration() SECURITY DEFINER function.
-- Admin gets full access.

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
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins))
  WITH CHECK (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

CREATE POLICY "event_registrations: admin delete"
  ON event_registrations FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' IN (SELECT email FROM admins));

-- ─────────────────────────────────────────────
-- PART 3 — submit_registration() security-definer function
-- ─────────────────────────────────────────────
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

  -- 1. Fetch event
  SELECT id, title, is_published, registration_open,
         registration_deadline, max_seats, one_response_per_email
  INTO v_event
  FROM events
  WHERE id = p_event_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Event not found.');
  END IF;

  -- 2. Must be published
  IF NOT v_event.is_published THEN
    RETURN jsonb_build_object('success', false, 'error', 'This event is not publicly available.');
  END IF;

  -- 3. Registration must be open
  IF NOT v_event.registration_open THEN
    RETURN jsonb_build_object('success', false, 'error', 'Registrations are closed for this event.');
  END IF;

  -- 4. Deadline check
  IF v_event.registration_deadline IS NOT NULL AND now() > v_event.registration_deadline THEN
    RETURN jsonb_build_object('success', false, 'error', 'The registration deadline has passed.');
  END IF;

  -- 5. Seat limit check
  IF v_event.max_seats IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count FROM event_registrations WHERE event_id = p_event_id;
    IF v_count >= v_event.max_seats THEN
      RETURN jsonb_build_object('success', false, 'error', 'This event is fully booked. No seats remaining.');
    END IF;
  END IF;

  -- 6. One response per email check
  IF v_event.one_response_per_email AND v_email IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM event_registrations
      WHERE event_id = p_event_id AND lower(respondent_email) = lower(v_email)
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'You have already registered for this event with this email address.');
    END IF;
  END IF;

  -- 7. Required fields check
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

  -- 8. Insert registration (bypasses RLS via SECURITY DEFINER)
  INSERT INTO event_registrations (event_id, answers, respondent_email)
  VALUES (p_event_id, p_answers, lower(v_email));

  RETURN jsonb_build_object(
    'success', true,
    'message', 'You''re registered! See you at ' || v_event.title || '.'
  );
END;
$$;

-- Allow anon + authenticated to call the function
GRANT EXECUTE ON FUNCTION submit_registration(UUID, JSONB, TEXT) TO anon, authenticated;
