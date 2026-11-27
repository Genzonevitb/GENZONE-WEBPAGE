-- =============================================================================
-- GenZone — Gallery Sort Order Default Migration
-- File: database/14_gallery_sort_order_default.sql
-- Safe to re-run: idempotent ALTER COLUMN SET DEFAULT 0.
-- Ensures gallery.sort_order always defaults to 0 instead of violating NOT NULL.
-- =============================================================================

ALTER TABLE gallery
  ALTER COLUMN sort_order SET DEFAULT 0;
