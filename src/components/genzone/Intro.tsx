import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const particles = Array.from({ length: 36 }, (_, i) => ({
  x: (i * 37) % 100,
  y: (i * 53) % 100,
  d: 1 + (i % 4),
  c: ["bg-cyan", "bg-pink", "bg-yellow"][i % 3],
}));

export function Intro({ onDone }: { onDone: () => void }) {
  const [show, setShow] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [clubName, setClubName] = useState("GenZone");
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    supabase
      .from("settings")
      .select("key, value")
      .in("key", ["logo_url", "club_name"])
      .then(({ data }) => {
        if (!data) return;
        const s = Object.fromEntries(data.map((r) => [r.key, r.value ?? ""]));
        if (s["logo_url"]) setLogoUrl(s["logo_url"]);
        if (s["club_name"]) setClubName(s["club_name"]);
      });

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => setShow(false), reduce ? 300 : 3600);
    return () => clearTimeout(t);
  }, []);

  const showLogo = !!logoUrl && !logoError;

  return (
    <AnimatePresence onExitComplete={onDone}>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-background"
          exit={{ clipPath: "circle(0% at 50% 50%)", opacity: 0.6 }}
          initial={{ clipPath: "circle(150% at 50% 50%)" }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          onClick={() => setShow(false)}
        >
          {particles.map((p, i) => (
            <motion.span
              key={i}
              className={`absolute rounded-full ${p.c}`}
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.d * 2, height: p.d * 2 }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 0.9, 0.3], scale: 1, y: [0, -40 - p.d * 20] }}
              transition={{ duration: 3, delay: (i % 12) * 0.05 }}
            />
          ))}
          <motion.div
            className="absolute h-px w-[140vw] bg-neon"
            initial={{ x: "-100%", rotate: -12, opacity: 0 }}
            animate={{ x: "100%", opacity: [0, 1, 0] }}
            transition={{ duration: 1.4, delay: 0.3 }}
          />
          {/* Logo or text fallback */}
          {showLogo ? (
            <motion.img
              src={logoUrl!}
              alt={clubName}
              className="logo-glow relative w-[min(62vw,340px)] mix-blend-screen"
              initial={{ scale: 0.3, rotateX: 60, rotateZ: -20, opacity: 0, filter: "blur(20px)" }}
              animate={{ scale: 1, rotateX: 0, rotateZ: 0, opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 1.3, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformPerspective: 800 }}
              onError={() => setLogoError(true)}
            />
          ) : (
            <motion.div
              className="logo-glow relative"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.3, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="font-display text-[clamp(3rem,14vw,7rem)] font-black tracking-tight text-white">
                GEN<span className="text-neon">ZONE</span>
              </span>
            </motion.div>
          )}
          <motion.p
            className="mt-8 px-6 text-center font-display text-sm font-bold uppercase tracking-[0.25em] md:text-lg"
            initial={{ opacity: 0, y: 20, letterSpacing: "0.8em" }}
            animate={{ opacity: 1, y: 0, letterSpacing: "0.25em" }}
            transition={{ duration: 1, delay: 1.9 }}
          >
            Not another club. <span className="text-neon">This is {clubName}.</span>
          </motion.p>
          <motion.span
            className="absolute bottom-8 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Tap to skip
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
