// ─── Canvas Texture Drawing for 3D Panel ID Cards ────────────────────────────
// Draws front and back textures at 2x resolution using the 2D Canvas API.
// Waits for document.fonts.ready before drawing text (with 400ms timeout guard).

import { ACCENT_HEX, CardConfig, SocialPlatform } from './cardDefaults';

export interface MemberData {
  id: string;
  name: string;
  role: string;
  department?: string | null;
  year_batch?: string | null;
  bio?: string | null;
  skills?: string[] | null;
  achievements?: string[] | null;
  portrait_url?: string | null;
  focal_point?: string | null;
  accent: string; // 'cyan'|'pink'|'yellow'
  accent_color_hex?: string | null;
  social_instagram?: string | null;
  social_linkedin?: string | null;
  social_github?: string | null;
  social_x?: string | null;
  social_email?: string | null;
  social_portfolio?: string | null;
  instagram_url?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  x_url?: string | null;
  portfolio_url?: string | null;
  social_visibility?: Record<string, boolean> | null;
  sort_order: number;
  member_code?: string | null;
  card_overrides?: Record<string, unknown> | null;
}

export interface SocialHitBox {
  platform: SocialPlatform;
  url: string;
  handle: string;
  x: number;
  y: number;
  w: number;
  h: number;
  isPill: boolean;
  minU: number;
  maxU: number;
  minV: number;
  maxV: number;
}

// Image cache shared across all cards
const IMG_CACHE = new Map<string, Promise<HTMLImageElement | null>>();

export function loadImg(url: string | null | undefined): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  const hit = IMG_CACHE.get(url);
  if (hit) return hit;
  const p = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
  IMG_CACHE.set(url, p);
  return p;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number, maxLines = 3): number {
  const words = text.split(' ');
  let line = '';
  let linesDrawn = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y + linesDrawn * lineH);
      line = word;
      linesDrawn++;
      if (linesDrawn >= maxLines) break;
    } else {
      line = test;
    }
  }
  if (linesDrawn < maxLines && line) {
    ctx.fillText(line, x, y + linesDrawn * lineH);
    linesDrawn++;
  }
  return linesDrawn;
}

function drawRoundedClip(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const safeR = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + safeR, y);
  ctx.lineTo(x + w - safeR, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + safeR);
  ctx.lineTo(x + w, y + h - safeR);
  ctx.quadraticCurveTo(x + w, y + h, x + w - safeR, y + h);
  ctx.lineTo(x + safeR, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - safeR);
  ctx.lineTo(x, y + safeR);
  ctx.quadraticCurveTo(x, y, x + safeR, y);
  ctx.closePath();
}

function drawBarcode(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  const bars = 42;
  const barW = w / (bars * 1.6);
  ctx.fillStyle = color;
  for (let i = 0; i < bars; i++) {
    const bx = x + i * (w / bars);
    const bh = h * (0.5 + (Math.sin(i * 2.3) * 0.3 + Math.sin(i * 0.7) * 0.2));
    if (i % 3 !== 1) ctx.fillRect(bx, y + (h - bh), barW * (i % 2 === 0 ? 1.6 : 1), bh);
  }
}

function drawHologram(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
  grad.addColorStop(0, 'rgba(255,255,255,0.9)');
  grad.addColorStop(0.3, 'rgba(0,240,255,0.6)');
  grad.addColorStop(0.6, 'rgba(255,0,127,0.4)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8);
    ctx.stroke();
  }
  ctx.restore();
}

async function waitForFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts?.ready) return;
  await Promise.race([
    document.fonts.ready.catch(() => {}),
    new Promise<void>(resolve => setTimeout(resolve, 400)),
  ]);
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = (hex || '#00f0ff').replace('#', '').trim();
  const norm = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  const n = parseInt(norm, 16);
  if (Number.isNaN(n)) return `rgba(0,240,255,${alpha})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function accentForMember(member: MemberData): string {
  const candidate = member?.accent_color_hex?.trim() || ACCENT_HEX[member?.accent] || '#00f0ff';
  return /^#[0-9a-fA-F]{3,6}$/.test(candidate) ? candidate : '#00f0ff';
}

export function getInstagramHandle(urlOrHandle?: string | null): string {
  if (!urlOrHandle) return '';
  let str = urlOrHandle.trim();
  str = str.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '');
  str = str.replace(/[/?#].*$/, '');
  str = str.replace(/^@+/, '').trim();
  return str;
}

export function normalizeSocialLink(platform: SocialPlatform, raw?: string | null): { url: string; handle: string } | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) return null;

  if (platform === 'email') {
    const cleanEmail = trimmed.replace(/^mailto:/i, '').trim();
    if (!cleanEmail || !cleanEmail.includes('@')) return null;
    return { url: `mailto:${cleanEmail}`, handle: cleanEmail };
  }

  let url = trimmed;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    if (!lower.startsWith('https://')) return null;
  } else {
    const clean = trimmed.replace(/^@+/, '').replace(/^\/+|\/+$/g, '');
    if (!clean) return null;
    if (platform === 'instagram') url = `https://instagram.com/${clean}`;
    else if (platform === 'linkedin') url = `https://linkedin.com/${clean.startsWith('in/') || clean.includes('/') ? clean : `in/${clean}`}`;
    else if (platform === 'github') url = `https://github.com/${clean}`;
    else if (platform === 'x') url = `https://x.com/${clean}`;
    else url = `https://${clean}`;
  }

  let handle = '';
  if (platform === 'instagram') handle = getInstagramHandle(url);
  else {
    const slug = url.replace(/^https?:\/\/(www\.)?[^/]+\//i, '').replace(/^(in|company)\//i, '').replace(/[/?#].*$/, '');
    handle = slug || url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
  }

  return { url, handle };
}

export function resolveMemberSocials(member: MemberData): Array<{ platform: SocialPlatform; url: string; handle: string }> {
  const vis = member.social_visibility;
  const rawMap: Record<SocialPlatform, string | null | undefined> = {
    instagram: member.instagram_url || member.social_instagram,
    linkedin: member.linkedin_url || member.social_linkedin,
    github: member.github_url || member.social_github,
    x: member.x_url || member.social_x,
    portfolio: member.portfolio_url || member.social_portfolio,
    email: member.social_email,
  };

  const ordered: SocialPlatform[] = ['instagram', 'linkedin', 'github', 'x', 'portfolio', 'email'];
  const list: Array<{ platform: SocialPlatform; url: string; handle: string }> = [];
  for (const platform of ordered) {
    if (vis && vis[platform] === false) continue;
    const norm = normalizeSocialLink(platform, rawMap[platform]);
    if (norm) list.push({ platform, ...norm });
  }
  return list;
}

// ─── Glyphs ──────────────────────────────────────────────────────────────────
export function drawInstagramCameraGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = size * 0.085;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const inset = size * 0.12;
  const innerR = size * 0.18;
  drawRoundedClip(ctx, x + inset, y + inset, size - inset * 2, size - inset * 2, innerR);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size * 0.22, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x + size * 0.73, y + size * 0.27, size * 0.055, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawLinkedInGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  const dotR = size * 0.08;
  ctx.beginPath();
  ctx.arc(x + size * 0.32, y + size * 0.28, dotR, 0, Math.PI * 2);
  ctx.fill();

  const stemW = size * 0.14;
  const stemH = size * 0.38;
  ctx.fillRect(x + size * 0.32 - stemW / 2, y + size * 0.44, stemW, stemH);

  ctx.fillRect(x + size * 0.50, y + size * 0.44, stemW, stemH);
  ctx.lineWidth = stemW;
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(x + size * 0.50 + stemW / 2, y + size * 0.55);
  ctx.bezierCurveTo(
    x + size * 0.55, y + size * 0.40,
    x + size * 0.74, y + size * 0.40,
    x + size * 0.74, y + size * 0.55,
  );
  ctx.lineTo(x + size * 0.74, y + size * 0.44 + stemH);
  ctx.stroke();

  ctx.restore();
}

function drawGitHubGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  const cx = x + size / 2;
  const cy = y + size * 0.54;
  const r = size * 0.29;
  // Head circle + ears
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.85, cy - r * 0.45);
  ctx.lineTo(cx - r * 0.95, cy - r * 1.15);
  ctx.lineTo(cx - r * 0.25, cy - r * 0.82);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.85, cy - r * 0.45);
  ctx.lineTo(cx + r * 0.95, cy - r * 1.15);
  ctx.lineTo(cx + r * 0.25, cy - r * 0.82);
  ctx.fill();
  // Face cutout eyes
  ctx.fillStyle = '#24292e';
  ctx.beginPath();
  ctx.arc(cx - r * 0.34, cy - r * 0.05, r * 0.16, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.34, cy - r * 0.05, r * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawXGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.11;
  ctx.lineCap = 'round';
  const pad = size * 0.24;
  ctx.beginPath();
  ctx.moveTo(x + pad, y + pad);
  ctx.lineTo(x + size - pad, y + size - pad);
  ctx.moveTo(x + size - pad, y + pad);
  ctx.lineTo(x + pad, y + size - pad);
  ctx.stroke();
  ctx.restore();
}

function drawPortfolioGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.08;
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size * 0.32;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 0.46, r, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - r, cy);
  ctx.lineTo(cx + r, cy);
  ctx.stroke();
  ctx.restore();
}

function drawEmailGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.085;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const rx = x + size * 0.18;
  const ry = y + size * 0.27;
  const rw = size * 0.64;
  const rh = size * 0.46;
  drawRoundedClip(ctx, rx, ry, rw, rh, size * 0.08);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(rx, ry + size * 0.04);
  ctx.lineTo(x + size / 2, ry + rh * 0.56);
  ctx.lineTo(rx + rw, ry + size * 0.04);
  ctx.stroke();
  ctx.restore();
}

function drawPlatformGlyph(ctx: CanvasRenderingContext2D, platform: SocialPlatform, x: number, y: number, size: number) {
  if (platform === 'instagram') drawInstagramCameraGlyph(ctx, x, y, size);
  else if (platform === 'linkedin') drawLinkedInGlyph(ctx, x, y, size);
  else if (platform === 'github') drawGitHubGlyph(ctx, x, y, size);
  else if (platform === 'x') drawXGlyph(ctx, x, y, size);
  else if (platform === 'portfolio') drawPortfolioGlyph(ctx, x, y, size);
  else drawEmailGlyph(ctx, x, y, size);
}

function fillForPlatform(
  ctx: CanvasRenderingContext2D,
  platform: SocialPlatform,
  x: number,
  y: number,
  w: number,
  h: number,
  colorMode: CardConfig['socialButtonColors'],
  accent: string,
): string | CanvasGradient {
  if (colorMode === 'accent') return hexToRgba(accent, 0.35);
  if (colorMode === 'mono') return 'rgba(255, 255, 255, 0.16)';

  if (platform === 'instagram') {
    const grad = ctx.createLinearGradient(x, y + h, x + w, y);
    grad.addColorStop(0, '#f09433');
    grad.addColorStop(0.25, '#e6683c');
    grad.addColorStop(0.5, '#dc2743');
    grad.addColorStop(0.75, '#cc2366');
    grad.addColorStop(1, '#bc1888');
    return grad;
  }
  if (platform === 'linkedin') return '#0a66c2';
  if (platform === 'github') return '#24292e';
  if (platform === 'x') return '#141418';
  if (platform === 'portfolio') return '#0284c7';
  return '#d97706';
}

function glowColorForPlatform(platform: SocialPlatform, colorMode: CardConfig['socialButtonColors'], accent: string): string {
  if (colorMode === 'accent') return accent;
  if (colorMode === 'mono') return 'rgba(255,255,255,0.65)';
  if (platform === 'instagram') return 'rgba(225, 48, 108, 0.65)';
  if (platform === 'linkedin') return 'rgba(10, 102, 194, 0.65)';
  if (platform === 'portfolio') return 'rgba(2, 132, 199, 0.65)';
  if (platform === 'email') return 'rgba(217, 119, 6, 0.65)';
  return 'rgba(255, 255, 255, 0.45)';
}

function drawSocialButtonBox(
  ctx: CanvasRenderingContext2D,
  box: SocialHitBox,
  colorMode: CardConfig['socialButtonColors'],
  accent: string,
  isHovered: boolean,
  glowEnabled: boolean,
) {
  ctx.save();
  const r = box.isPill ? box.h / 2 : Math.round(box.h * 0.28);

  if (isHovered && glowEnabled) {
    ctx.shadowColor = glowColorForPlatform(box.platform, colorMode, accent);
    ctx.shadowBlur = 28;
  } else {
    ctx.shadowColor = glowColorForPlatform(box.platform, colorMode, accent);
    ctx.shadowBlur = 10;
  }

  ctx.fillStyle = fillForPlatform(ctx, box.platform, box.x, box.y, box.w, box.h, colorMode, accent);
  drawRoundedClip(ctx, box.x, box.y, box.w, box.h, r);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Hover brightness boost
  if (isHovered && glowEnabled) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.fill();
  }

  ctx.strokeStyle = isHovered && glowEnabled
    ? 'rgba(255, 255, 255, 0.92)'
    : colorMode === 'accent'
      ? hexToRgba(accent, 0.75)
      : 'rgba(255, 255, 255, 0.32)';
  ctx.lineWidth = isHovered && glowEnabled ? 3 : 2;
  ctx.stroke();

  if (box.isPill) {
    const iconSize = Math.round(box.h * 0.56);
    const iconX = box.x + Math.round(box.h * 0.22);
    const iconY = box.y + Math.round((box.h - iconSize) / 2);
    drawPlatformGlyph(ctx, box.platform, iconX, iconY, iconSize);

    ctx.font = `700 ${Math.round(box.h * 0.36)}px 'Space Grotesk', sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const textX = iconX + iconSize + Math.round(box.h * 0.16);
    const textY = box.y + box.h / 2;
    const rawLabel = box.platform === 'instagram' && box.handle
      ? (box.handle.startsWith('@') ? box.handle : `@${box.handle}`)
      : box.handle || box.platform.toUpperCase();

    let renderText = rawLabel;
    const maxTextW = box.w - (textX - box.x) - Math.round(box.h * 0.22);
    if (ctx.measureText(renderText).width > maxTextW) {
      while (renderText.length > 3 && ctx.measureText(renderText + '…').width > maxTextW) {
        renderText = renderText.slice(0, -1);
      }
      renderText += '…';
    }
    ctx.fillText(renderText, textX, textY);
  } else {
    const iconSize = Math.round(box.h * 0.60);
    const iconX = box.x + (box.w - iconSize) / 2;
    const iconY = box.y + (box.h - iconSize) / 2;
    drawPlatformGlyph(ctx, box.platform, iconX, iconY, iconSize);
  }

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// FRONT SOCIAL HITBOXES
// ─────────────────────────────────────────────────────────────────────────────
export function getFrontSocialHitBoxes(
  W: number,
  H: number,
  member: MemberData,
  cfg: CardConfig,
): SocialHitBox[] {
  if (cfg.showFrontSocials === false) return [];

  const allowed = new Set<SocialPlatform>(
    Array.isArray(cfg.frontSocialPlatforms) && cfg.frontSocialPlatforms.length > 0
      ? cfg.frontSocialPlatforms
      : ['instagram', 'linkedin', 'github', 'x', 'portfolio', 'email'],
  );
  const active = resolveMemberSocials(member).filter(s => allowed.has(s.platform));
  if (active.length === 0) return [];

  const pad = W * 0.058;
  const availW = W - pad * 2;
  const sizeMul = cfg.socialButtonSize === 'small' ? 0.044 : cfg.socialButtonSize === 'large' ? 0.062 : 0.052;
  const btnH = Math.round(H * sizeMul);
  const gap = Math.round(W * 0.02);
  const btnY = cfg.socialButtonPosition === 'under_name'
    ? Math.round(H - btnH - H * 0.048)
    : Math.round(H - btnH - H * 0.036);
  const tol = 14;

  const hasIg = active.some(s => s.platform === 'instagram');
  const igProminent = hasIg && cfg.instagramProminence !== 'normal' && cfg.socialButtonStyle !== 'icon_only';

  const boxes: SocialHitBox[] = [];
  let cursorX = pad;

  if (igProminent) {
    const ig = active.find(s => s.platform === 'instagram')!;
    const others = active.filter(s => s.platform !== 'instagram');
    const secW = others.length > 3 ? Math.round(btnH * 0.90) : btnH;
    const reserved = others.length * (secW + gap);
    const igW = Math.max(btnH * 2.2, availW - reserved);

    boxes.push({
      platform: ig.platform,
      url: ig.url,
      handle: ig.handle,
      x: cursorX,
      y: btnY,
      w: igW,
      h: btnH,
      isPill: true,
      minU: (cursorX - tol) / W,
      maxU: (cursorX + igW + tol) / W,
      minV: 1 - (btnY + btnH + tol) / H,
      maxV: 1 - (btnY - tol) / H,
    });
    cursorX += igW + gap;

    for (const item of others) {
      boxes.push({
        platform: item.platform,
        url: item.url,
        handle: item.handle,
        x: cursorX,
        y: btnY,
        w: secW,
        h: btnH,
        isPill: false,
        minU: (cursorX - tol) / W,
        maxU: (cursorX + secW + tol) / W,
        minV: 1 - (btnY + btnH + tol) / H,
        maxV: 1 - (btnY - tol) / H,
      });
      cursorX += secW + gap;
    }
  } else {
    const canPill = cfg.socialButtonStyle !== 'icon_only' && active.length <= 2;
    const itemW = canPill
      ? Math.floor((availW - gap * (active.length - 1)) / active.length)
      : btnH;
    for (const item of active) {
      boxes.push({
        platform: item.platform,
        url: item.url,
        handle: item.handle,
        x: cursorX,
        y: btnY,
        w: itemW,
        h: btnH,
        isPill: canPill,
        minU: (cursorX - tol) / W,
        maxU: (cursorX + itemW + tol) / W,
        minV: 1 - (btnY + btnH + tol) / H,
        maxV: 1 - (btnY - tol) / H,
      });
      cursorX += itemW + gap;
    }
  }

  return boxes;
}

// ─────────────────────────────────────────────────────────────────────────────
// FRONT TEXTURE
// ─────────────────────────────────────────────────────────────────────────────
export async function drawFront(
  canvas: HTMLCanvasElement,
  member: MemberData,
  cfg: CardConfig,
  logoImg: HTMLImageElement | null,
  photoImg: HTMLImageElement | null,
  hoveredPlatform: SocialPlatform | null = null,
): Promise<void> {
  await waitForFonts();

  const W = canvas.width;
  const H = canvas.height;
  const accent = accentForMember(member);
  const memberIdx = member.sort_order || 0;
  const memberId = member.member_code || `GZ-${String(memberIdx + 1).padStart(3, '0')}`;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // ── 1. FULL-BLEED PHOTO (or initials fallback)
  const cardRadius = W * 0.07;
  ctx.save();
  drawRoundedClip(ctx, 0, 0, W, H, cardRadius);
  ctx.clip();

  if (photoImg) {
    const imgAspect = photoImg.naturalWidth / photoImg.naturalHeight;
    const cardAspect = W / H;
    let sx = 0, sy = 0, sw = photoImg.naturalWidth, sh = photoImg.naturalHeight;
    if (imgAspect > cardAspect) {
      sw = photoImg.naturalHeight * cardAspect;
      sx = (photoImg.naturalWidth - sw) / 2;
    } else {
      sh = photoImg.naturalWidth / cardAspect;
      sy = 0;
    }
    ctx.drawImage(photoImg, sx, sy, sw, sh, 0, 0, W, H);
  } else {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0d0d20');
    bg.addColorStop(1, '#06060f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.globalAlpha = 0.025;
    for (let i = 0; i < 1800; i++) {
      ctx.fillStyle = `rgb(${Math.random() * 255 | 0},${Math.random() * 255 | 0},${Math.random() * 255 | 0})`;
      ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    }
    ctx.globalAlpha = 1;

    const initials = (member.name || '?').split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase();
    ctx.font = `900 ${H * 0.28}px 'Unbounded', sans-serif`;
    ctx.fillStyle = hexToRgba(accent, 0.18);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, W / 2, H / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
  ctx.restore();

  // ── 2. READABILITY OVERLAY
  const overlayGrad = ctx.createLinearGradient(0, H * 0.36, 0, H);
  overlayGrad.addColorStop(0, 'rgba(0,0,0,0)');
  overlayGrad.addColorStop(0.35, 'rgba(0,0,0,0.52)');
  overlayGrad.addColorStop(1, 'rgba(0,0,0,0.90)');
  ctx.fillStyle = overlayGrad;
  ctx.fillRect(0, 0, W, H);

  if (cfg.accentStripe) {
    const stripe = ctx.createLinearGradient(0, 0, 0, H);
    stripe.addColorStop(0, hexToRgba(accent, 0.7));
    stripe.addColorStop(1, hexToRgba(accent, 0.15));
    ctx.fillStyle = stripe;
    ctx.fillRect(0, 0, W * 0.025, H);
  }

  // ── 3. LOGO
  const logoPad = W * 0.055;
  const logoTop = H * 0.10;
  const logoSize = W * 0.13;

  if (logoImg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoPad + logoSize / 2, logoTop + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logoImg, logoPad, logoTop, logoSize, logoSize);
    ctx.restore();
  } else {
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoPad + logoSize / 2, logoTop + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(accent, 0.2);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(accent, 0.6);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = `900 ${logoSize * 0.38}px 'Unbounded', sans-serif`;
    ctx.fillStyle = accent;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GZ', logoPad + logoSize / 2, logoTop + logoSize / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  // ── 4. MEMBER ID
  if (cfg.showMemberId !== false) {
    const idFontSize = H * 0.034;
    const idPadR = W * 0.055;
    const idY = logoTop + logoSize / 2;

    ctx.save();
    ctx.font = `600 ${idFontSize}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillText(memberId, W - idPadR + 2, idY + 2);
    ctx.fillStyle = accent;
    ctx.fillText(memberId, W - idPadR, idY);
    ctx.restore();
  }

  // ── 5. FRONT SOCIAL BUTTONS & NAME/ROLE POSITIONING
  const socialBoxes = getFrontSocialHitBoxes(W, H, member, cfg);
  const hasSocials = socialBoxes.length > 0;
  const firstSocial = socialBoxes[0];

  const textPadX = W * 0.058;
  const textPadB = hasSocials && firstSocial
    ? (H - firstSocial.y) + (cfg.socialButtonPosition === 'under_name' ? H * 0.015 : H * 0.024)
    : H * 0.062;
  const nameFontSz = H * 0.060;
  const roleFontSz = H * 0.035;
  const nameLineH = nameFontSz * 1.05;

  ctx.textBaseline = 'bottom';

  ctx.font = `600 ${roleFontSz}px 'Space Grotesk', sans-serif`;
  ctx.fillStyle = accent;
  ctx.fillText(member.role || '', textPadX, H - textPadB);

  ctx.font = `900 ${nameFontSz}px 'Unbounded', sans-serif`;
  ctx.fillStyle = '#ffffff';
  const nameY = H - textPadB - roleFontSz * 1.3 - 6;

  const nameText = (member.name || 'MEMBER').toUpperCase();
  const maxNameW = W - textPadX * 2;
  const nameWords = nameText.split(' ');
  const nameLines: string[] = [];
  let curLine = '';
  for (const word of nameWords) {
    const test = curLine ? `${curLine} ${word}` : word;
    if (ctx.measureText(test).width > maxNameW && curLine) {
      nameLines.push(curLine);
      curLine = word;
      if (nameLines.length >= 2) break;
    } else {
      curLine = test;
    }
  }
  if (curLine && nameLines.length < 2) nameLines.push(curLine);
  for (let li = nameLines.length - 1; li >= 0; li--) {
    ctx.fillText(nameLines[li]!, textPadX, nameY - (nameLines.length - 1 - li) * nameLineH);
  }

  ctx.textBaseline = 'alphabetic';

  // ── 6. HOLOGRAM sticker (positioned neatly above social row if present)
  if (cfg.showHologram) {
    ctx.globalAlpha = 0.65;
    const holoY = hasSocials && firstSocial ? firstSocial.y - H * 0.048 : H - H * 0.07;
    drawHologram(ctx, W - W * 0.13, holoY, W * 0.072);
    ctx.globalAlpha = 1;
  }

  // ── 7. SOCIAL BUTTONS OR BARCODE
  if (hasSocials) {
    const colorMode = cfg.socialButtonColors || 'brand';
    const glowEnabled = cfg.socialButtonGlow !== false;
    for (const box of socialBoxes) {
      drawSocialButtonBox(ctx, box, colorMode, accent, hoveredPlatform === box.platform, glowEnabled);
    }
  } else if (cfg.showBarcode) {
    const bcW = W * 0.52;
    const bcH = H * 0.038;
    const bcX = (W - bcW) / 2;
    const bcY = H - bcH - H * 0.015;
    ctx.globalAlpha = 0.22;
    drawBarcode(ctx, bcX, bcY, bcW, bcH, '#ffffff');
    ctx.globalAlpha = 1;
  }

  // ── 8. Bottom accent glow line
  const lineGrad = ctx.createLinearGradient(0, 0, W, 0);
  lineGrad.addColorStop(0, 'transparent');
  lineGrad.addColorStop(0.5, hexToRgba(accent, 0.9));
  lineGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = lineGrad;
  ctx.fillRect(0, H - 3, W, 3);
}

// ─────────────────────────────────────────────────────────────────────────────
// BACK TEXTURE & HITBOXES
// ─────────────────────────────────────────────────────────────────────────────
export function getBackSocialHitBoxes(W: number, H: number, hasIg = true, hasLi = true) {
  const pad = W * 0.08;
  const btnH = Math.round(H * 0.076);
  const btnY = Math.round(H * 0.77);
  const gap = Math.round(W * 0.03);
  const tol = 16;

  let igX = pad;
  let igW = W - pad * 2;
  let liX = pad;
  let liW = btnH;

  if (hasIg && hasLi) {
    liW = btnH;
    igW = W - pad * 2 - liW - gap;
    liX = igX + igW + gap;
  } else if (!hasIg && hasLi) {
    liW = W - pad * 2;
    liX = pad;
  }

  return {
    instagram: {
      x: igX,
      y: btnY,
      w: igW,
      h: btnH,
      minU: (igX - tol) / W,
      maxU: (igX + igW + tol) / W,
      minV: 1 - (btnY + btnH + tol) / H,
      maxV: 1 - (btnY - tol) / H,
    },
    linkedin: {
      x: liX,
      y: btnY,
      w: liW,
      h: btnH,
      minU: (liX - tol) / W,
      maxU: (liX + liW + tol) / W,
      minV: 1 - (btnY + btnH + tol) / H,
      maxV: 1 - (btnY - tol) / H,
    },
  };
}

export function drawInstagramPill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  handle: string,
  hovered = false,
) {
  ctx.save();
  const r = h / 2;
  const grad = ctx.createLinearGradient(x, y + h, x + w, y);
  grad.addColorStop(0, '#f09433');
  grad.addColorStop(0.25, '#e6683c');
  grad.addColorStop(0.5, '#dc2743');
  grad.addColorStop(0.75, '#cc2366');
  grad.addColorStop(1, '#bc1888');

  ctx.shadowColor = hovered ? 'rgba(225, 48, 108, 0.8)' : 'rgba(225, 48, 108, 0.45)';
  ctx.shadowBlur = hovered ? 28 : 18;
  ctx.fillStyle = grad;
  drawRoundedClip(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.shadowBlur = 0;

  if (hovered) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.fill();
  }

  ctx.strokeStyle = hovered ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = hovered ? 3 : 2;
  ctx.stroke();

  const iconSize = Math.round(h * 0.56);
  const iconX = x + Math.round(h * 0.22);
  const iconY = y + Math.round((h - iconSize) / 2);
  drawInstagramCameraGlyph(ctx, iconX, iconY, iconSize);

  ctx.font = `700 ${Math.round(h * 0.36)}px 'Space Grotesk', sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const textX = iconX + iconSize + Math.round(h * 0.18);
  const textY = y + h / 2;
  const label = handle ? (handle.startsWith('@') ? handle : `@${handle}`) : 'Follow on Instagram';

  let renderText = label;
  const maxTextW = w - (textX - x) - Math.round(h * 0.2);
  if (ctx.measureText(renderText).width > maxTextW) {
    while (renderText.length > 3 && ctx.measureText(renderText + '…').width > maxTextW) {
      renderText = renderText.slice(0, -1);
    }
    renderText += '…';
  }
  ctx.fillText(renderText, textX, textY);

  ctx.restore();
}

export function drawLinkedInButton(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  isSquare: boolean,
  hovered = false,
) {
  ctx.save();
  const r = isSquare ? Math.round(h * 0.28) : h / 2;

  ctx.shadowColor = hovered ? 'rgba(10, 102, 194, 0.8)' : 'rgba(10, 102, 194, 0.4)';
  ctx.shadowBlur = hovered ? 26 : 16;
  ctx.fillStyle = '#0a66c2';
  drawRoundedClip(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.shadowBlur = 0;

  if (hovered) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.fill();
  }

  ctx.strokeStyle = hovered ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = hovered ? 3 : 2;
  ctx.stroke();

  if (isSquare) {
    const iconSize = Math.round(h * 0.62);
    const iconX = x + (w - iconSize) / 2;
    const iconY = y + (h - iconSize) / 2;
    drawLinkedInGlyph(ctx, iconX, iconY, iconSize);
  } else {
    const iconSize = Math.round(h * 0.56);
    const iconX = x + Math.round(h * 0.22);
    const iconY = y + Math.round((h - iconSize) / 2);
    drawLinkedInGlyph(ctx, iconX, iconY, iconSize);

    ctx.font = `700 ${Math.round(h * 0.36)}px 'Space Grotesk', sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Connect on LinkedIn', iconX + iconSize + Math.round(h * 0.18), y + h / 2);
  }

  ctx.restore();
}

export async function drawBack(
  canvas: HTMLCanvasElement,
  member: MemberData,
  cfg: CardConfig,
  _legacyQrCanvas?: HTMLCanvasElement | null,
  hoveredPlatform: SocialPlatform | null = null,
): Promise<void> {
  await waitForFonts();

  const W = canvas.width;
  const H = canvas.height;
  const accent = accentForMember(member);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // ── Background (opaque, high-contrast background so it never renders black/dark)
  ctx.fillStyle = '#0e0e1a';
  ctx.fillRect(0, 0, W, H);

  // Grid pattern
  ctx.strokeStyle = hexToRgba(accent, 0.05);
  ctx.lineWidth = 1;
  const gridSize = W / 10;
  for (let x = 0; x <= W; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Top accent stripe
  const stripe = ctx.createLinearGradient(0, 0, W, 0);
  stripe.addColorStop(0, accent);
  stripe.addColorStop(1, hexToRgba(accent, 0));
  ctx.fillStyle = stripe;
  ctx.fillRect(0, 0, W, 4);

  const pad = W * 0.08;
  let y = H * 0.115;

  // ── GENZONE header
  ctx.font = `900 ${H * 0.045}px 'Unbounded', sans-serif`;
  ctx.fillStyle = accent;
  ctx.textBaseline = 'top';
  ctx.fillText(cfg.clubName || 'GENZONE', pad, y);
  y += H * 0.055;

  ctx.font = `400 ${H * 0.025}px 'Space Grotesk', sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  const subtitle = [member.name || 'Member', member.role].filter(Boolean).join(' · ');
  ctx.fillText(subtitle, pad, y);
  y += H * 0.04;

  // ── Divider
  ctx.fillStyle = hexToRgba(accent, 0.3);
  ctx.fillRect(pad, y, W - pad * 2, 1);
  y += H * 0.025;

  // ── Bio
  if (member.bio) {
    ctx.font = `400 ${H * 0.03}px 'Space Grotesk', sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    const lines = wrapText(ctx, member.bio, pad, y, W - pad * 2, H * 0.038, 4);
    y += lines * H * 0.038 + H * 0.025;
  }

  // ── Skills chips
  if (member.skills && member.skills.length > 0) {
    ctx.font = `600 ${H * 0.026}px 'JetBrains Mono', monospace`;
    let chipX = pad;
    const chipH = H * 0.045;
    const chipPad = W * 0.03;
    for (const skill of member.skills.slice(0, 6)) {
      const tw = ctx.measureText(skill).width;
      const chipW = tw + chipPad * 2;
      if (chipX + chipW > W - pad) { chipX = pad; y += chipH + H * 0.012; }
      drawRoundedClip(ctx, chipX, y, chipW, chipH, chipH / 2);
      ctx.fillStyle = hexToRgba(accent, 0.15);
      ctx.fill();
      ctx.strokeStyle = hexToRgba(accent, 0.5);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.textBaseline = 'middle';
      ctx.fillText(skill, chipX + chipPad, y + chipH / 2);
      chipX += chipW + W * 0.02;
    }
    y += chipH + H * 0.03;
    ctx.textBaseline = 'top';
  }

  // ── Primary Action Area (Instagram Main Action + Secondary LinkedIn)
  const vis = member.social_visibility;
  const igNorm = (!vis || vis.instagram !== false) ? normalizeSocialLink('instagram', member.instagram_url || member.social_instagram) : null;
  const liNorm = (!vis || vis.linkedin !== false) ? normalizeSocialLink('linkedin', member.linkedin_url || member.social_linkedin) : null;
  const boxes = getBackSocialHitBoxes(W, H, Boolean(igNorm), Boolean(liNorm));

  if (igNorm) {
    drawInstagramPill(
      ctx,
      boxes.instagram.x,
      boxes.instagram.y,
      boxes.instagram.w,
      boxes.instagram.h,
      igNorm.handle,
      hoveredPlatform === 'instagram' && cfg.socialButtonGlow !== false,
    );
  }

  if (liNorm) {
    drawLinkedInButton(
      ctx,
      boxes.linkedin.x,
      boxes.linkedin.y,
      boxes.linkedin.w,
      boxes.linkedin.h,
      Boolean(igNorm),
      hoveredPlatform === 'linkedin' && cfg.socialButtonGlow !== false,
    );
  }

  // ── Tagline (bottom)
  ctx.font = `400 ${H * 0.024}px 'Space Grotesk', sans-serif`;
  ctx.fillStyle = hexToRgba(accent, 0.65);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(cfg.tagline || 'NOT ANOTHER CLUB. THIS IS GENZONE.', W / 2, H - H * 0.035);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}
