import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useSiteConfig } from "@/lib/config-context";

const FALLBACK_LOGO = "/genzone-fallback.svg";
// Max ms to wait for config before showing fallback logo anyway
const CONFIG_TIMEOUT_MS = 1500;
// Max ms to wait for logo decode
const DECODE_TIMEOUT_MS = 2000;

export function Intro({ onDone }: { onDone: () => void }) {
  const config = useSiteConfig();

  // Track whether config has fully loaded (not just an empty object)
  const [configReady, setConfigReady] = useState(false);
  // Track whether the logo image is decoded and ready to paint
  const [logoReady, setLogoReady] = useState(false);
  // Whether we should actually display the splash
  const [show, setShow] = useState(true);
  // Which logo URL the splash should use (locked in once we're ready to show)
  const [lockedLogo, setLockedLogo] = useState<string | null>(null);

  const configTimerFiredRef = useRef(false);
  const startedRef = useRef(false);

  // Derive values only after config is ready
  const introConf = (config["intro_config"] as any) ?? {};
  const siteIdent = (config["site_identity"] as any) ?? {};

  const logoUrl: string | null =
    siteIdent.logo_url || (config["logo_url"] as string) || null;
  const totalDuration = introConf.total_duration_ms ?? 3600;
  const skipToggle = introConf.skip_toggle !== false;
  const skipLabel = introConf.skip_label ?? "Tap to skip";
  const tagline = introConf.tagline ?? "NOT ANOTHER CLUB. THIS IS GENZONE.";
  const wordmarkOn = introConf.wordmark_stage_on === true;
  const clubName = siteIdent.club_name ?? "GenZone";
  const showMode = introConf.show_mode ?? "every_visit";

  // 1️⃣  Config-ready gate: fires when config has at least one key, or after CONFIG_TIMEOUT_MS
  useEffect(() => {
    if (configTimerFiredRef.current) return;
    // Set a maximum wait for config
    const t = setTimeout(() => {
      configTimerFiredRef.current = true;
      setConfigReady(true);
    }, CONFIG_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (Object.keys(config).length > 0 && !configTimerFiredRef.current) {
      configTimerFiredRef.current = true;
      setConfigReady(true);
    }
  }, [config]);

  // 2️⃣  Once config is ready, check show_mode gate
  useEffect(() => {
    if (!configReady) return;
    const today = new Date().toISOString().slice(0, 10);
    if (showMode === "never") { onDone(); return; }
    if (showMode === "once_per_session" && sessionStorage.getItem("gz_intro_seen")) { onDone(); return; }
    if (showMode === "once_per_day" && localStorage.getItem("gz_intro_date") === today) { onDone(); return; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configReady]);

  // 3️⃣  Reduced motion: skip animation entirely
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const t = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(t);
    }
  }, []);

  // 4️⃣  Once config ready, pick the logo URL and decode it before showing
  useEffect(() => {
    if (!configReady) return;
    // Determine which logo to use
    const src = logoUrl || FALLBACK_LOGO;
    setLockedLogo(src);

    const img = new Image();
    img.src = src;
    let settled = false;
    const settle = () => {
      if (!settled) { settled = true; setLogoReady(true); }
    };
    const decodePromise = img.decode().then(settle).catch(settle);
    const timer = setTimeout(settle, DECODE_TIMEOUT_MS);
    return () => {
      clearTimeout(timer);
      // If the promise resolves after unmount, ignore it (settled flag guards)
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configReady, logoUrl]);

  // 5️⃣  Start dismiss timer only after logo is ready (no flash)
  useEffect(() => {
    if (!logoReady || startedRef.current) return;
    startedRef.current = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return; // already handled
    const t = setTimeout(() => setShow(false), totalDuration);
    return () => clearTimeout(t);
  }, [logoReady, totalDuration]);

  // Store session/day flag when splash exits
  function handleExit() {
    const today = new Date().toISOString().slice(0, 10);
    if (showMode === "once_per_session") sessionStorage.setItem("gz_intro_seen", "1");
    if (showMode === "once_per_day") localStorage.setItem("gz_intro_date", today);
    onDone();
  }

  // Don't mount the motion overlay until logo is decoded — zero flash
  if (!logoReady) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
        aria-hidden
      >
        {/* Silent black screen while we decode — no text, no glitch */}
      </div>
    );
  }

  const displayLogo = lockedLogo || FALLBACK_LOGO;

  // Parse tagline: split at "THIS IS" for coloring
  const thisIsIdx = tagline.indexOf("THIS IS");
  const taglineBefore = thisIsIdx !== -1 ? tagline.slice(0, thisIsIdx) : tagline;
  const taglineAfter = thisIsIdx !== -1 ? tagline.slice(thisIsIdx) : "";

  // Static particles derived from config
  const count = Math.min(introConf.particles_count ?? 36, 60);
  const colors = (introConf.particles_colors as string[] | undefined) ?? ["cyan", "pink", "yellow"];
  const colorMap: Record<string, string> = { cyan: "bg-cyan", pink: "bg-pink", yellow: "bg-yellow" };
  const particles = Array.from({ length: count }, (_, i) => ({
    x: (i * 37) % 100,
    y: (i * 53) % 100,
    d: 1 + (i % 4),
    c: colorMap[colors[i % colors.length]] ?? "bg-cyan",
  }));

  return (
    <AnimatePresence onExitComplete={handleExit}>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-background"
          exit={{ clipPath: "circle(0% at 50% 50%)", opacity: 0.6 }}
          initial={{ clipPath: "circle(150% at 50% 50%)" }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          onClick={() => skipToggle && setShow(false)}
        >
          {/* Particles */}
          {(introConf.particles_on !== false) && particles.map((p, i) => (
            <motion.span
              key={i}
              className={`absolute rounded-full ${p.c}`}
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.d * 2, height: p.d * 2 }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 0.9, 0.3], scale: 1, y: [0, -40 - p.d * 20] }}
              transition={{ duration: 3, delay: (i % 12) * 0.05 }}
            />
          ))}

          {/* Neon sweep line */}
          <motion.div
            className="absolute h-px w-[140vw] bg-neon"
            initial={{ x: "-100%", rotate: -12, opacity: 0 }}
            animate={{ x: "100%", opacity: [0, 1, 0] }}
            transition={{ duration: 1.4, delay: 0.3 }}
          />

          {/* Logo — already decoded, no flash */}
          <motion.img
            src={displayLogo}
            alt={clubName}
            className="logo-glow relative w-[min(62vw,340px)] mix-blend-screen"
            initial={{ scale: 0.3, rotateX: 60, rotateZ: -20, opacity: 0, filter: "blur(20px)" }}
            animate={{ scale: 1, rotateX: 0, rotateZ: 0, opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.3, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformPerspective: 800 }}
          />

          {/* Wordmark (admin-controlled, OFF by default) */}
          {wordmarkOn && (
            <motion.div
              className="logo-glow relative mt-2"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.3, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="font-display text-[clamp(2rem,8vw,4rem)] font-black tracking-tight text-white">
                GEN<span className="text-neon">ZONE</span>
              </span>
            </motion.div>
          )}

          {/* Tagline */}
          <motion.p
            className="mt-8 px-6 text-center font-display text-sm font-bold uppercase tracking-[0.25em] md:text-lg"
            initial={{ opacity: 0, y: 20, letterSpacing: "0.8em" }}
            animate={{ opacity: 1, y: 0, letterSpacing: "0.25em" }}
            transition={{ duration: 1, delay: 1.5 }}
          >
            {taglineBefore}
            {taglineAfter && (
              <span className="text-neon">{taglineAfter}</span>
            )}
          </motion.p>

          {/* Skip button */}
          {skipToggle && (
            <motion.span
              className="absolute bottom-8 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              {skipLabel}
            </motion.span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
