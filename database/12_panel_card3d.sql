-- =============================================================================
-- GenZone — Panel 3D ID Card Configuration
-- File: 12_panel_card3d.sql
-- Adds card_overrides + member_code to panel_members.
-- Seeds the default panel.card3d config into site_config (draft + published).
-- Safe to re-run: IF NOT EXISTS, ON CONFLICT DO NOTHING.
-- Never drops, renames, or alters existing columns/rows.
-- =============================================================================

-- ── 1. New columns on panel_members ──────────────────────────────────────────

-- card_overrides: per-member JSON overrides (finish, orientation, strapColor,
--   frontImageUrl, backImageUrl, etc.)  falls back to global config when null.
ALTER TABLE panel_members
  ADD COLUMN IF NOT EXISTS card_overrides  JSONB DEFAULT NULL;

-- member_code: custom ID badge text (e.g. "GZ-001"). Auto-generated from
--   sort_order when null.
ALTER TABLE panel_members
  ADD COLUMN IF NOT EXISTS member_code  TEXT DEFAULT NULL;

-- ── 2. Seed default panel.card3d config into site_config ─────────────────────
-- Both draft and published rows are seeded so the admin can edit the draft and
-- publish independently. ON CONFLICT DO NOTHING preserves any existing edits.

INSERT INTO site_config (key, status, value, updated_at)
VALUES (
  'panel.card3d', 'published',
  '{
    "mode": "auto",
    "layout": "carousel",
    "preset": "neon",
    "lowPowerThreshold": 4,
    "showHint": true,
    "hintText": "Drag \u00b7 Tap to flip",
    "popupEnabled": false,
    "orientation": "portrait",
    "cornerRadius": 0.3,
    "size": 0.62,
    "finish": "glossy",
    "baseColor": "#0a0a14",
    "edgeColor": "#1a1a2e",
    "photoFrame": "rounded",
    "showBarcode": true,
    "showHologram": true,
    "showMemberId": true,
    "accentStripe": true,
    "logoUrl": "/genzone-fallback.svg",
    "showQr": true,
    "qrUrl": "https://genzone-webpage.vercel.app",
    "tagline": "NOT ANOTHER CLUB. THIS IS GENZONE.",
    "clubName": "GENZONE",
    "strapColor": "#00f0ff",
    "strapColor2": "#ff007f",
    "strapWidth": 0.75,
    "strapLength": 0.52,
    "strapPattern": "text",
    "metal": "silver",
    "gravity": 1.0,
    "damping": 0.5,
    "elasticity": 0.4,
    "breeze": 0.3,
    "idleSway": true,
    "lighting": "neon",
    "bloom": false,
    "shadow": true,
    "cardsPerViewDesktop": 3,
    "cardsPerViewTablet": 2,
    "cardsPerViewMobile": 1,
    "cardSpacing": 2.0
  }'::jsonb,
  now()
)
ON CONFLICT (key, status) DO NOTHING;

INSERT INTO site_config (key, status, value, updated_at)
VALUES (
  'panel.card3d', 'draft',
  '{
    "mode": "auto",
    "layout": "carousel",
    "preset": "neon",
    "lowPowerThreshold": 4,
    "showHint": true,
    "hintText": "Drag \u00b7 Tap to flip",
    "popupEnabled": false,
    "orientation": "portrait",
    "cornerRadius": 0.3,
    "size": 0.62,
    "finish": "glossy",
    "baseColor": "#0a0a14",
    "edgeColor": "#1a1a2e",
    "photoFrame": "rounded",
    "showBarcode": true,
    "showHologram": true,
    "showMemberId": true,
    "accentStripe": true,
    "logoUrl": "/genzone-fallback.svg",
    "showQr": true,
    "qrUrl": "https://genzone-webpage.vercel.app",
    "tagline": "NOT ANOTHER CLUB. THIS IS GENZONE.",
    "clubName": "GENZONE",
    "strapColor": "#00f0ff",
    "strapColor2": "#ff007f",
    "strapWidth": 0.75,
    "strapLength": 0.52,
    "strapPattern": "text",
    "metal": "silver",
    "gravity": 1.0,
    "damping": 0.5,
    "elasticity": 0.4,
    "breeze": 0.3,
    "idleSway": true,
    "lighting": "neon",
    "bloom": false,
    "shadow": true,
    "cardsPerViewDesktop": 3,
    "cardsPerViewTablet": 2,
    "cardsPerViewMobile": 1,
    "cardSpacing": 2.0
  }'::jsonb,
  now()
)
ON CONFLICT (key, status) DO NOTHING;
