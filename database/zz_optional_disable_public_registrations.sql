-- =============================================================================
-- GenZone — OPTIONAL: Disable Public Registrations & Feedback
-- File: zz_optional_disable_public_registrations.sql
--
-- !! WARNING !!  DO NOT APPLY TO THE TEST / DEVELOPMENT DATABASE.
-- !! Apply this MANUALLY to the LIVE / PRODUCTION project ONLY after deploy.
--
-- PURPOSE:
--   This file disables two channels through which anonymous users can write
--   data to the database:
--
--   1. REVOKE anon from calling submit_registration()
--      Prevents any unauthenticated user from submitting a registration for
--      any event. After this, the event registration form will silently fail
--      (or you can guard the UI) unless a logged-in admin submits on behalf
--      of a user.
--
--   2. DROP the "feedback: anon insert" RLS policy on the feedback table
--      Prevents unauthenticated users from submitting feedback. The feedback
--      form on the public site will stop working until this policy is restored.
--
-- HOW TO RESTORE:
--   Re-run 02_policies.sql or the specific CREATE POLICY statement for
--   "feedback: anon insert" to restore feedback submissions.
--   Re-run:
--     GRANT EXECUTE ON FUNCTION submit_registration(UUID, JSONB, TEXT) TO anon;
--   to restore event registration for anonymous users.
--
-- =============================================================================

-- ── 1. Remove anon's ability to call the registration function ───────────────
-- After this, only 'authenticated' users can call submit_registration().
REVOKE EXECUTE ON FUNCTION submit_registration(UUID, JSONB, TEXT) FROM anon;

-- ── 2. Remove anon insert policy on feedback ─────────────────────────────────
-- After this, anonymous users cannot submit feedback via the public form.
DROP POLICY IF EXISTS "feedback: anon insert" ON feedback;
