import { useEffect, useState } from "react";
import { Calendar, Home, Images, MessageSquare, Sparkles, Users } from "lucide-react";
import { Dock, DockIcon, DockItem, DockLabel } from "@/components/ui/dock";
import { navItems } from "@/content/genzone";
import { useSiteConfig } from "@/lib/config-context";

const NAV_ICONS: Record<(typeof navItems)[number]["id"], typeof Home> = {
  home: Home,
  about: Sparkles,
  events: Calendar,
  gallery: Images,
  panel: Users,
  feedback: MessageSquare,
};

export function Nav() {
  const [active, setActive] = useState("home");
  const [logoError, setLogoError] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  const config = useSiteConfig();
  const siteId = (config["site_identity"] as any) ?? {};
  const logoUrl = siteId.logo_url || (config["logo_url"] as string) || null;
  const clubName = siteId.club_name || (config["club_name"] as string) || "GenZone";
  const showLogo = !!logoUrl && !logoError;

  useEffect(() => {
    const updateSize = () => setIsCompact(window.innerWidth < 768);
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

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

  const scrollToSection = (e: React.MouseEvent<HTMLElement>, id: string) => {
    e.preventDefault();
    setActive(id);
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
      window.history.replaceState(null, "", `#${id}`);
    }
  };

  return (
    <>
      <a href="#home" onClick={(e) => scrollToSection(e, "home")} className="fixed left-3 top-3 z-50 md:left-8 md:top-5" aria-label={`${clubName} home`}>
        {showLogo ? (
          <img
            src={logoUrl!}
            alt={clubName}
            className="h-10 w-auto max-w-[40px] object-contain mix-blend-screen transition-transform hover:scale-110 sm:h-11 sm:max-w-[52px] md:h-12 md:max-w-[64px]"
            onError={() => setLogoError(true)}
          />
        ) : (
          <span className="inline-block font-display text-base font-black tracking-widest text-white transition-opacity hover:opacity-80 sm:text-xl">
            GEN<span className="text-cyan">ZONE</span>
          </span>
        )}
      </a>

      {/* Top-center Apple-style Dock navigation (desktop + mobile) */}
      <nav
        aria-label="Primary navigation"
        className="fixed left-1/2 top-2.5 z-50 -translate-x-1/2 md:top-4"
      >
        <Dock
          position="top"
          panelHeight={isCompact ? 46 : 58}
          baseSize={isCompact ? 32 : 40}
          magnification={isCompact ? 44 : 64}
          distance={isCompact ? 90 : 140}
          className="gap-1.5 rounded-2xl border border-white/15 bg-background/75 px-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl md:gap-2.5 md:px-3.5"
        >
          {navItems.map((n) => {
            const Icon = NAV_ICONS[n.id] ?? Home;
            const isActive = active === n.id;
            return (
              <DockItem
                key={n.id}
                href={`#${n.id}`}
                onClick={(e) => scrollToSection(e, n.id)}
                aria-label={n.label}
                aria-current={isActive ? "page" : undefined}
                className={`aspect-square rounded-full border transition-colors ${
                  isActive
                    ? "border-pink/60 bg-pink/20 text-pink shadow-[0_0_16px_rgba(255,0,127,0.35)]"
                    : "border-white/10 bg-white/[0.06] text-white/75 hover:border-cyan/40 hover:text-cyan"
                }`}
              >
                <DockLabel className="font-mono text-[10px] uppercase tracking-wider">
                  {n.label}
                </DockLabel>
                <DockIcon>
                  <Icon className="h-full w-full" />
                </DockIcon>
              </DockItem>
            );
          })}
        </Dock>
      </nav>
    </>
  );
}
