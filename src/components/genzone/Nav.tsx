import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { navItems } from "@/content/genzone";
import { useSiteConfig } from "@/lib/config-context";

export function Nav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("home");
  const [logoError, setLogoError] = useState(false);

  const config = useSiteConfig();
  const siteId = (config["site_identity"] as any) ?? {};
  const logoUrl = siteId.logo_url || (config["logo_url"] as string) || null;
  const clubName = siteId.club_name || (config["club_name"] as string) || "GenZone";
  const showLogo = !!logoUrl && !logoError;

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    navItems.forEach((n) => {
      const el = document.getElementById(n.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <a href="#home" className="fixed left-4 top-4 z-50 md:left-8 md:top-6" aria-label={`${clubName} home`}>
        {showLogo ? (
          <img
            src={logoUrl!}
            alt={clubName}
            className="h-12 w-auto max-w-[56px] object-contain mix-blend-screen transition-transform hover:scale-110 md:max-w-[64px]"
            onError={() => setLogoError(true)}
          />
        ) : (
          <span className="font-display text-xl font-black tracking-widest text-white transition-opacity hover:opacity-80 inline-block">
            GEN<span className="text-cyan">ZONE</span>
          </span>
        )}
      </a>

      {/* Desktop: vertical pill rail */}
      <nav className="fixed right-6 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-1 rounded-full border bg-background/60 p-2 backdrop-blur-xl md:flex">
        {navItems.map((n) => (
          <a key={n.id} href={`#${n.id}`} className="group relative flex items-center justify-end rounded-full px-3 py-2">
            <span className={`mr-3 whitespace-nowrap font-mono text-[11px] uppercase tracking-widest transition-all ${active === n.id ? "text-foreground opacity-100" : "translate-x-2 text-muted-foreground opacity-0 group-hover:translate-x-0 group-hover:opacity-100"}`}>
              {n.label}
            </span>
            <span className={`h-2.5 w-2.5 rounded-full transition-all ${active === n.id ? "scale-125 bg-pink glow-pink" : "bg-muted-foreground/40 group-hover:bg-cyan"}`} />
          </a>
        ))}
      </nav>

      {/* Mobile: burger + fullscreen menu */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="fixed right-4 top-5 z-[70] flex h-12 w-12 flex-col items-center justify-center gap-1.5 rounded-full bg-foreground md:hidden"
      >
        <span className={`h-0.5 w-5 bg-background transition-transform ${open ? "translate-y-1 rotate-45" : ""}`} />
        <span className={`h-0.5 w-5 bg-background transition-transform ${open ? "-translate-y-1 -rotate-45" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[65] flex flex-col justify-center gap-2 bg-background px-8 md:hidden"
            initial={{ clipPath: "circle(0% at 92% 6%)" }}
            animate={{ clipPath: "circle(150% at 92% 6%)" }}
            exit={{ clipPath: "circle(0% at 92% 6%)" }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          >
            {navItems.map((n, i) => (
              <motion.a
                key={n.id}
                href={`#${n.id}`}
                onClick={() => setOpen(false)}
                className="font-display text-5xl font-black uppercase"
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.06 }}
              >
                <span className="mr-3 font-mono text-xs text-pink">0{i + 1}</span>
                {n.label}
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
