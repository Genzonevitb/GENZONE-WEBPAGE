import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import logo from "@/assets/genzone-logo.png.asset.json";
import { supabase } from "@/lib/supabase";

const DEFAULT_LINES = ["NOT ANOTHER", "CLUB. THIS IS", "GENZONE."];
const DEFAULT_SUBTITLE = "Where creativity gets louder, ideas get bolder, and possibilities have no limits.";

export function Hero({ ready }: { ready: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yText = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 220]);
  const scaleLogo = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.5]);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [12, -12]), { stiffness: 80, damping: 15 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), { stiffness: 80, damping: 15 });

  const [lines, setLines] = useState(DEFAULT_LINES);
  const [subtitle, setSubtitle] = useState(DEFAULT_SUBTITLE);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    supabase
      .from("settings")
      .select("key, value")
      .in("key", ["hero_line_1", "hero_line_2", "hero_line_3", "hero_subtitle", "logo_url"])
      .then(({ data }) => {
        if (!data) return;
        const s = Object.fromEntries(data.map((r) => [r.key, r.value ?? ""]));
        const l1 = s["hero_line_1"] || DEFAULT_LINES[0];
        const l2 = s["hero_line_2"] || DEFAULT_LINES[1];
        const l3 = s["hero_line_3"] || DEFAULT_LINES[2];
        setLines([l1, l2, l3]);
        if (s["hero_subtitle"]) setSubtitle(s["hero_subtitle"]);
        if (s["logo_url"]) setLogoUrl(s["logo_url"]);
      });
  }, []);

  const displayLogo = logoUrl ?? logo.url;

  return (
    <section
      id="home"
      ref={ref}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      className="relative flex min-h-[100svh] items-center overflow-hidden px-5 pt-24 md:px-16"
    >
      <div className="pointer-events-none absolute -left-40 top-10 h-[30rem] w-[30rem] rounded-full bg-pink/25 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-[26rem] w-[26rem] rounded-full bg-cyan/20 blur-[120px]" />
      <div className="pointer-events-none absolute right-1/3 top-1/4 h-40 w-40 rounded-full bg-yellow/15 blur-[80px]" />

      <span className="animate-floaty absolute left-[8%] top-[22%] h-6 w-6 rotate-12 border-2 border-cyan" />
      <span className="animate-floaty absolute bottom-[18%] left-[45%] h-4 w-4 rounded-full bg-yellow [animation-delay:-2s]" />
      <span className="animate-floaty absolute right-[12%] top-[16%] font-display text-4xl text-pink [animation-delay:-4s]">✦</span>

      <div className="relative z-10 grid w-full items-center gap-10 md:grid-cols-[1.2fr_1fr]">
        <motion.div style={{ y: yText }}>
          <h1 className="font-display text-[clamp(2.6rem,9vw,8.5rem)] font-black leading-[0.88] tracking-tight">
            {lines.map((l, i) => (
              <span key={i} className="block overflow-hidden">
                <motion.span
                  className={`block ${i === 1 ? "text-outline" : ""} ${i === 2 ? "text-neon" : ""}`}
                  initial={reduce ? false : { y: "105%" }}
                  animate={ready ? { y: 0 } : {}}
                  transition={{ duration: 1, delay: 0.1 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                >
                  {l}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p
            className="mt-8 max-w-md text-lg text-muted-foreground md:text-xl"
            initial={reduce ? false : { opacity: 0 }}
            animate={ready ? { opacity: 1 } : {}}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            {subtitle}
          </motion.p>
        </motion.div>

        <motion.div
          className="relative mx-auto w-[min(80vw,520px)]"
          style={{ rotateX: rx, rotateY: ry, scale: scaleLogo, transformPerspective: 900 }}
          initial={reduce ? false : { opacity: 0, scale: 0.6 }}
          animate={ready ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="absolute inset-[10%] animate-spin rounded-full border border-dashed border-cyan/40 [animation-duration:30s]" />
          {!logoError ? (
            <img
              src={displayLogo}
              alt="GenZone logo"
              className="logo-glow relative w-full mix-blend-screen"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="logo-glow relative flex items-center justify-center py-12">
              <span className="font-display text-[clamp(3rem,10vw,6rem)] font-black tracking-tight text-white">
                GEN<span className="text-neon">ZONE</span>
              </span>
            </div>
          )}
        </motion.div>
      </div>

      <a href="#about" className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3" aria-label="Scroll to explore">
        <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Scroll to explore</span>
        <span className="flex h-12 w-7 justify-center rounded-full border-2 border-foreground/60 pt-2">
          <motion.span className="h-2 w-1 rounded-full bg-pink" animate={{ y: [0, 18, 0] }} transition={{ repeat: Infinity, duration: 1.6 }} />
        </span>
      </a>
    </section>
  );
}
