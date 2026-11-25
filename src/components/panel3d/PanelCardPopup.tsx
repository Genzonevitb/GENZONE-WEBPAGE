// ─── PanelCardPopup.tsx ───────────────────────────────────────────────────────
// Modal focus view containing the 3D ID card for a single selected panel member.
// Full-viewport Three.js canvas layer via portal at document.body level so the
// card can swing freely without edge clipping and the strap runs off the top.
// Single member only, focus trap, body scroll lock, aria-modal, Escape/X/missed close.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { DEFAULT_CARD_CONFIG, type CardConfig } from './cardDefaults';
import { resolveMemberSocials, type MemberData } from './cardTexture';
import { PanelLanyardScene } from './PanelLanyardScene';

export interface PopupMember extends MemberData {
  id: string;
}

interface PanelCardPopupProps {
  member: PopupMember;
  cfg?: Partial<CardConfig> | null;
  onClose: () => void;
}

export default function PanelCardPopup({
  member,
  cfg,
  onClose,
}: PanelCardPopupProps) {
  const titleId = useId();
  const modalRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<PanelLanyardScene | null>(null);
  const prevActiveEl = useRef<HTMLElement | null>(null);

  const [mounted, setMounted] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [webglError, setWebglError] = useState(false);

  const safeCfg = useMemo<CardConfig>(() => {
    const merged: Record<string, unknown> = { ...DEFAULT_CARD_CONFIG };
    if (cfg && typeof cfg === 'object') {
      for (const [k, v] of Object.entries(cfg)) {
        if (v !== null && v !== undefined) {
          merged[k] = v;
        }
      }
    }
    return merged as unknown as CardConfig;
  }, [cfg]);
  const cfgKey = JSON.stringify(safeCfg);

  const safeMember = useMemo<PopupMember>(() => ({
    ...member,
    name: member?.name || 'GenZone Member',
    role: member?.role || '',
    accent: member?.accent || 'cyan',
    sort_order: typeof member?.sort_order === 'number' ? member.sort_order : 0,
  }), [member]);

  useEffect(() => {
    setMounted(true);
    prevActiveEl.current = (document.activeElement as HTMLElement) || null;
    return () => {
      prevActiveEl.current?.focus?.();
    };
  }, []);

  // Lock page scroll while open
  useEffect(() => {
    const origBodyOverflow = document.body.style.overflow;
    const origHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = origBodyOverflow;
      document.documentElement.style.overflow = origHtmlOverflow;
    };
  }, []);

  const handleClose = useCallback(() => {
    setIsFlipped(false);
    sceneRef.current?.resetFlip();
    onClose();
  }, [onClose]);

  const handleCloseRef = useRef(handleClose);
  handleCloseRef.current = handleClose;

  // Escape closes popup
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseRef.current();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus trap
  useEffect(() => {
    if (!mounted) return;
    modalRef.current?.focus();

    function handleTabKey(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]):not([tabindex="-1"]), [href]:not([tabindex="-1"]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener('keydown', handleTabKey);
    return () => window.removeEventListener('keydown', handleTabKey);
  }, [mounted, isFlipped]);

  // Initialize full-viewport 3D scene
  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    setWebglError(false);
    setIsFlipped(false);
    sceneRef.current?.dispose();

    let scene: PanelLanyardScene;
    try {
      scene = new PanelLanyardScene(canvas, safeCfg);
    } catch (err) {
      console.error('Failed to initialize 3D ID card WebGL scene:', err);
      setWebglError(true);
      return;
    }

    sceneRef.current = scene;
    scene.onFlipChange = (flipped: boolean) => {
      setIsFlipped(flipped);
    };
    scene.onPointerMissed = () => {
      handleCloseRef.current();
    };

    scene.addCard(safeMember, 0);
    scene.setActiveSlots([0]);

    const applySize = () => {
      const w = container.clientWidth || window.innerWidth || 1024;
      const h = container.clientHeight || window.innerHeight || 768;
      scene.resize(w, h, 1);
    };

    applySize();
    scene.positionSlots(0, 1);
    scene.startLoop();

    const ro = new ResizeObserver(entries => {
      if (!entries[0]) return;
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        scene.resize(width, height, 1);
      }
    });
    ro.observe(container);

    const onWinResize = () => applySize();
    window.addEventListener('resize', onWinResize);
    window.addEventListener('orientationchange', onWinResize);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onWinResize);
      window.removeEventListener('orientationchange', onWinResize);
      scene.dispose();
      sceneRef.current = null;
    };
  }, [mounted, safeMember, cfgKey]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    sceneRef.current?.handlePointerDown(e.nativeEvent, canvasRef.current, () => {});
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    sceneRef.current?.handlePointerMove(e.nativeEvent, canvasRef.current);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    sceneRef.current?.handlePointerUp(e.nativeEvent, canvasRef.current, (slot) => {
      setIsFlipped(slot.flipped);
    });
  };
  const onPointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    sceneRef.current?.handlePointerCancel(e.nativeEvent, canvasRef.current);
  };

  const socialLinks = useMemo(() => resolveMemberSocials(safeMember), [safeMember]);

  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const content = (
    <div
      ref={modalRef}
      tabIndex={-1}
      className="fixed inset-0 z-[100] w-[100vw] h-[100dvh] select-none focus:outline-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Full-viewport blurred dark backdrop behind the canvas */}
      <div
        className="fixed inset-0 z-0 bg-black/75 backdrop-blur-md pointer-events-none"
        aria-hidden="true"
      />

      <h2 id={titleId} className="sr-only">
        {safeMember.name} — 3D ID Card Focus View
      </h2>

      {/* Accessible Screen Reader / Keyboard Flip Trigger */}
      <button
        type="button"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[110] focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:rounded-md focus:border-2 focus:border-cyan"
        onClick={(e) => {
          e.stopPropagation();
          sceneRef.current?.flipActiveCard();
        }}
      >
        Flip {safeMember.name}&apos;s Card
      </button>

      {/* Full-Viewport Three.js Canvas Layer (never clipped to a small box) */}
      <motion.div
        ref={containerRef}
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
        transition={prefersReducedMotion ? { duration: 0.15 } : { duration: 0.25 }}
        className="fixed inset-0 z-10 w-[100vw] h-[100dvh] flex items-center justify-center"
      >
        {webglError ? (
          <div
            onClick={handleClose}
            className="w-full h-full flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-[320px] h-[480px] rounded-2xl border border-white/20 bg-[#0e0e1a] p-6 flex flex-col justify-between text-white shadow-2xl"
            >
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-cyan">{safeMember.role}</p>
                <h3 className="mt-2 font-display text-2xl font-black uppercase">{safeMember.name}</h3>
              </div>
              {safeMember.portrait_url && (
                <img
                  src={safeMember.portrait_url}
                  alt={safeMember.name}
                  className="w-full h-64 object-cover rounded-xl my-3"
                />
              )}
              <p className="font-mono text-xs text-white/60">{safeCfg.tagline}</p>
            </div>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{ touchAction: 'none' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
          />
        )}
      </motion.div>

      {/* Safe-area HTML Overlays above the canvas (never block card interaction except on buttons) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
        aria-label="Close focus view"
        style={{
          top: 'max(1rem, env(safe-area-inset-top))',
          right: 'max(1rem, env(safe-area-inset-right))',
        }}
        className="fixed z-30 flex h-11 w-11 items-center justify-center rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white/90 hover:text-white hover:bg-white/20 hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-cyan cursor-pointer"
      >
        <X size={20} />
      </button>

      {/* Visually hidden accessible & SEO social links (rendered visually on the 3D card CanvasTexture) */}
      {socialLinks.length > 0 && (
        <div className="sr-only">
          {socialLinks.map((link) => (
            <a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${safeMember.name}'s ${link.platform}: ${link.handle}`}
            >
              {link.platform}: {link.handle}
            </a>
          ))}
        </div>
      )}

      {/* Bottom Flip Hint Overlay (safe-area inset, never overlaps centered card) */}
      <div
        style={{
          bottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
        className="fixed left-1/2 -translate-x-1/2 z-30 flex items-center justify-center px-2 text-white/70 font-mono text-xs pointer-events-none"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            sceneRef.current?.flipActiveCard();
          }}
          className="pointer-events-auto text-center px-4 py-1.5 rounded-full bg-black/65 backdrop-blur-md border border-white/15 hover:border-white/35 text-[11px] uppercase tracking-wider text-white/85 hover:text-white transition-colors cursor-pointer"
          title="Click to flip card"
        >
          {isFlipped ? 'SHOW FRONT' : 'TAP TO FLIP'}
        </button>
      </div>
    </div>
  );

  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(content, document.body);
}
