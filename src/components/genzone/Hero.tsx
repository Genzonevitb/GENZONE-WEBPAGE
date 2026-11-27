import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { useSiteConfig } from "@/lib/config-context";

const DEFAULT_LINES = ["NOT ANOTHER", "CLUB. THIS IS", "GENZONE."];
const DEFAULT_SUBTITLE = "Where creativity gets louder, ideas get bolder, and possibilities have no limits.";

export function Hero({ ready }: { ready: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yText = useTransform(scrollYProgress, [0, 0.4], [0, reduce ? 0 : -60]);
  const opacityText = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const opacityScroll = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const scaleLogo = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.4]);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [12, -12]), { stiffness: 80, damping: 15 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), { stiffness: 80, damping: 15 });

  const [logoError, setLogoError] = useState(false);

  const config = useSiteConfig();
  const heroConf = (config["hero_config"] as any) ?? {};
  const siteId = (config["site_identity"] as any) ?? {};
  const lines = [heroConf.line1 || DEFAULT_LINES[0], heroConf.line2 || DEFAULT_LINES[1], heroConf.line3 || DEFAULT_LINES[2]];
  const subtitle = heroConf.subtitle || DEFAULT_SUBTITLE;
  const logoUrl = siteId.logo_url || (config["logo_url"] as string) || null;
  const showLogo = !!logoUrl && !logoError;

  return (
    <section
      id="home"
      ref={ref}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      className="relative flex min-h-[100svh] flex-col justify-center gap-6 overflow-hidden px-5 pt-20 pb-10 sm:pt-24 md:pb-20 md:px-16"
    >
      <div className="pointer-events-none absolute -left-40 top-10 h-[30rem] w-[30rem] rounded-full bg-pink/25 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-[26rem] w-[26rem] rounded-full bg-cyan/20 blur-[120px]" />
      <div className="pointer-events-none absolute right-1/3 top-1/4 h-40 w-40 rounded-full bg-yellow/15 blur-[80px]" />

      <span className="animate-floaty hidden sm:block absolute left-[8%] top-[22%] h-6 w-6 rotate-12 border-2 border-cyan" />
      <span className="animate-floaty hidden sm:block absolute bottom-[18%] left-[45%] h-4 w-4 rounded-full bg-yellow [animation-delay:-2s]" />
      <span className="animate-floaty absolute right-[8%] top-[14%] font-display text-3xl sm:text-4xl md:right-[12%] md:top-[16%] text-pink [animation-delay:-4s]">✦</span>

      <div className="relative z-10 grid w-full items-center gap-6 sm:gap-8 md:grid-cols-[1.2fr_1fr] md:gap-10">
        <motion.div style={{ y: yText, opacity: opacityText }} className="min-w-0">
          <h1 className="font-display text-[clamp(2.2rem,9.5vw,8.5rem)] font-black leading-[0.9] tracking-tight break-words">
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
            className="mt-5 max-w-md text-base text-muted-foreground sm:mt-8 sm:text-lg md:text-xl"
            initial={reduce ? false : { opacity: 0 }}
            animate={ready ? { opacity: 1 } : {}}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            {subtitle}
          </motion.p>
        </motion.div>

        <motion.div
          className="relative mx-auto w-[min(56vw,230px)] sm:w-[min(66vw,340px)] md:w-[min(80vw,520px)]"
          style={{ rotateX: rx, rotateY: ry, scale: scaleLogo, transformPerspective: 900 }}
          initial={reduce ? false : { opacity: 0, scale: 0.6 }}
          animate={ready ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="absolute inset-[10%] animate-spin rounded-full border border-dashed border-cyan/40 [animation-duration:30s]" />
          {showLogo ? (
            <img
              src={logoUrl!}
              alt="GenZone logo"
              className="logo-glow relative w-full mix-blend-screen"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="logo-glow relative flex items-center justify-center py-12">
              <span className="font-display text-[clamp(2.5rem,10vw,6rem)] font-black tracking-tight text-white">
                GEN<span className="text-neon">ZONE</span>
              </span>
            </div>
          )}
        </motion.div>
      </div>

      <motion.a style={{ opacity: opacityScroll }} href="#about" className="relative z-10 mx-auto mt-2 flex flex-col items-center gap-2 md:absolute md:bottom-8 md:left-1/2 md:mt-0 md:-translate-x-1/2 md:gap-3" aria-label="Scroll to explore">
        <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Scroll to explore</span>
        <span className="flex h-10 w-6 justify-center rounded-full border-2 border-foreground/60 pt-1.5 md:h-12 md:w-7 md:pt-2">
          <motion.span className="h-2 w-1 rounded-full bg-pink" animate={{ y: [0, 14, 0] }} transition={{ repeat: Infinity, duration: 1.6 }} />
        </span>
      </motion.a>
    </section>
  );
}
