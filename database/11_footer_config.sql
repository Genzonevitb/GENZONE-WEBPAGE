-- database/11_footer_config.sql
-- Additive, idempotent seed for footer_config in site_config table.
-- Safe to run on both TEST and LIVE projects.
-- Requires: 07_site_config.sql to have been run first (site_config table exists).

-- Insert a published default footer_config if none exists.
INSERT INTO site_config (key, status, value, updated_at)
VALUES (
  'footer_config',
  'published',
  jsonb_build_object(
    'ghost_text',               'GENZONE',
    'ghost_text_visible',       true,
    'ghost_text_gradient_from', '#00bfff',
    'ghost_text_gradient_to',   '#ff69b4',
    'ghost_text_opacity',       100,
    'logo_visible',             true,
    'contact_heading',          'Contact',
    'contact_heading_color',    'cyan',
    'contact_email',            'email@placeholder.com',
    'contact_location',         'Campus address — to be added',
    'follow_heading',           'Follow',
    'follow_heading_color',     'pink',
    'socials', jsonb_build_array(
      jsonb_build_object('label','Instagram','href','#','color','white'),
      jsonb_build_object('label','LinkedIn','href','#','color','white'),
      jsonb_build_object('label','YouTube','href','#','color','white'),
      jsonb_build_object('label','X','href','#','color','white')
    ),
    'copyright_left',  '© {year} GENZONE',
    'copyright_right', 'Turning Trends Into Tradition',
    'bg_color',        '#000000',
    'padding_top',     96,
    'padding_bottom',  40
  ),
  now()
)
ON CONFLICT (key, status) DO NOTHING;
