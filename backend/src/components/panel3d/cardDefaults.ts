// keep in sync with root src/components/panel3d/cardDefaults.ts
// ─── Types & Defaults for 3D Panel ID Cards ──────────────────────────────────

export type CardFinish = 'glossy' | 'matte' | 'holographic' | 'metallic';
export type CardOrientation = 'portrait' | 'landscape';
export type CardPreset = 'neon' | 'minimal' | 'holo' | 'classic';
export type CardLayout = 'carousel' | 'grid';
export type CardMode = 'auto' | '3d' | '2d_only';
export type LightingPreset = 'studio' | 'neon';
export type StrapPattern = 'solid' | 'stripes' | 'text';
export type PhotoFrame = 'rectangle' | 'rounded' | 'circle';
export type SocialPlatform = 'instagram' | 'linkedin' | 'github' | 'x' | 'portfolio' | 'email';
export type SocialButtonSize = 'small' | 'medium' | 'large';
export type InstagramProminence = 'large' | 'normal';
export type SocialButtonStyle = 'icon_handle' | 'icon_only';
export type SocialButtonPosition = 'bottom' | 'under_name';
export type SocialButtonColors = 'brand' | 'accent' | 'mono';

export interface CardConfig {
  // Global
  mode: CardMode;
  layout: CardLayout;
  preset: CardPreset;
  lowPowerThreshold: number; // navigator.hardwareConcurrency below this → 2D
  showHint: boolean;
  hintText: string;
  popupEnabled: boolean; // "Open full profile" button on back

  // Card geometry
  orientation: CardOrientation;
  cornerRadius: number; // 0–1
  size: number; // 0.15–0.9 relative to viewport
  finish: CardFinish;
  baseColor: string; // hex
  edgeColor: string;

  // Front texture
  photoFrame: PhotoFrame;
  showBarcode: boolean;
  showHologram: boolean;
  showMemberId: boolean;
  accentStripe: boolean;
  logoUrl: string; // club logo URL or fallback text

  // Front social buttons
  showFrontSocials: boolean;
  frontSocialPlatforms: SocialPlatform[];
  socialButtonSize: SocialButtonSize;
  instagramProminence: InstagramProminence;
  socialButtonStyle: SocialButtonStyle;
  socialButtonPosition: SocialButtonPosition;
  socialButtonColors: SocialButtonColors;
  socialButtonGlow: boolean;

  // Back texture
  showQr: boolean;
  qrUrl: string; // URL encoded in QR (site URL)
  tagline: string;
  clubName: string;

  // Strap
  strapColor: string;
  strapColor2: string;
  strapWidth: number; // 0.4–2
  strapLength: number; // 0–1
  strapPattern: StrapPattern;
  metal: 'silver' | 'gold' | 'graphite';

  // Physics
  gravity: number; // 0–3
  damping: number; // 0–1
  elasticity: number; // 0–1
  breeze: number; // 0–1
  idleSway: boolean;

  // Lighting
  lighting: LightingPreset;
  bloom: boolean;
  shadow: boolean;

  // Carousel
  cardsPerViewDesktop: number;
  cardsPerViewTablet: number;
  cardsPerViewMobile: number;
  cardSpacing: number; // world-unit gap between cards
}

export const DEFAULT_CARD_CONFIG: CardConfig = {
  mode: 'auto',
  layout: 'carousel',
  preset: 'neon',
  lowPowerThreshold: 4,
  showHint: true,
  hintText: 'Drag · Tap to flip',
  popupEnabled: false,

  orientation: 'portrait',
  cornerRadius: 0.3,
  size: 0.62,
  finish: 'glossy',
  baseColor: '#0a0a14',
  edgeColor: '#1a1a2e',

  photoFrame: 'rounded',
  showBarcode: true,
  showHologram: true,
  showMemberId: true,
  accentStripe: true,
  logoUrl: '/genzone-fallback.svg',

  showFrontSocials: true,
  frontSocialPlatforms: ['instagram', 'linkedin', 'github', 'x', 'portfolio', 'email'],
  socialButtonSize: 'medium',
  instagramProminence: 'large',
  socialButtonStyle: 'icon_handle',
  socialButtonPosition: 'bottom',
  socialButtonColors: 'brand',
  socialButtonGlow: true,

  showQr: true,
  qrUrl: 'https://genzone-webpage.vercel.app',
  tagline: 'NOT ANOTHER CLUB. THIS IS GENZONE.',
  clubName: 'GENZONE',

  strapColor: '#00f0ff',
  strapColor2: '#ff007f',
  strapWidth: 0.75,
  strapLength: 0.52,
  strapPattern: 'text',
  metal: 'silver',

  gravity: 1.0,
  damping: 0.5,
  elasticity: 0.4,
  breeze: 0.3,
  idleSway: true,

  lighting: 'neon',
  bloom: false,
  shadow: true,

  cardsPerViewDesktop: 3,
  cardsPerViewTablet: 2,
  cardsPerViewMobile: 1,
  cardSpacing: 2.0,
};

// Per-preset base color overrides
export const PRESET_COLORS: Record<CardPreset, { base: string; edge: string; strap: string }> = {
  neon:    { base: '#0a0a14', edge: '#1a1a2e', strap: '#00f0ff' },
  minimal: { base: '#1c1c1c', edge: '#2d2d2d', strap: '#888888' },
  holo:    { base: '#0d0d1a', edge: '#1a1a33', strap: '#8800ff' },
  classic: { base: '#1a1200', edge: '#2d2000', strap: '#e4b965' },
};

export const ACCENT_HEX: Record<string, string> = {
  cyan:   '#00f0ff',
  pink:   '#ff007f',
  yellow: '#ffe600',
};
