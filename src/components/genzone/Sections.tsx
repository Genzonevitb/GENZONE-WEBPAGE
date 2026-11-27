import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useMemo, useRef, useState, useCallback, lazy, Suspense } from "react";
import { DEFAULT_CARD_CONFIG } from "@/components/panel3d/cardDefaults";
import type { CardConfig } from "@/components/panel3d/cardDefaults";
import { GalleryShowcase, type GalleryAlbum, type GalleryPhoto } from "@/components/gallery/GalleryShowcase";
import GridMotion from "@/components/gallery/GridMotion";
import { supabase } from "@/lib/supabase";
import { accentBg, accentBorder, accentText, Reveal, SectionTag, SplitHeading } from "./shared";
import { useSiteConfig } from "@/lib/config-context";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar as CalendarIcon,
  MapPin,
  Tag,
  Share2,
  Download,
  MessageCircle,
  ExternalLink,
  Ticket,
  Award,
  Shirt,
  Users as UsersIcon,
  Check,
  Sparkles,
  Mail,
  Globe,
  Github,
  Linkedin,
  Instagram,
  Twitter,
  Clock,
  CheckCircle2,
} from "lucide-react";

type Accent = "cyan" | "pink" | "yellow";

interface HighlightItem {
  icon?: string;
  title: string;
  text: string;
}

interface ScheduleItem {
  time: string;
  title: string;
  text?: string;
}

interface SpeakerItem {
  name: string;
  role: string;
  photo_url?: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface DbEvent {
  id: string;
  title: string;
  description: string | null;
  full_description?: string | null;
  event_date: string | null;
  event_end_time?: string | null;
  venue: string | null;
  category: string | null;
  accent: Accent;
  image_url: string | null;
  is_published: boolean;
  registration_open: boolean;
  registration_deadline: string | null;
  max_seats: number | null;
  form_mode: string;
  external_form_url: string | null;
  google_form_url?: string | null;
  register_button_label?: string | null;
  closed_label?: string | null;
  featured?: boolean;
  highlights?: HighlightItem[] | null;
  schedule?: ScheduleItem[] | null;
  entry_fee?: string | null;
  eligibility?: string | null;
  dress_code?: string | null;
  seats_note?: string | null;
  speakers?: SpeakerItem[] | null;
  faqs?: FaqItem[] | null;
  tags?: string[] | null;
  contact_name?: string | null;
  contact_whatsapp?: string | null;
  whatsapp_group_url?: string | null;
  brochure_url?: string | null;
  status_badge_override?: string | null;
  accent_color_hex?: string | null;
}

interface DbGallery {
  id: string;
  caption: string | null;
  category: string | null;
  album_id: string | null;
  image_url: string;
  thumb_url: string | null;
  tall: boolean;
}

interface DbAlbum {
  id: string;
  name: string;
  heading: string | null;
  sort_order: number;
}

interface DbMember {
  id: string;
  name: string;
  role: string;
  accent: Accent;
  portrait_url: string | null;
  sort_order: number;
  department?: string | null;
  year_batch?: string | null;
  bio?: string | null;
  quote?: string | null;
  skills?: string[] | null;
  achievements?: string[] | null;
  fun_fact?: string | null;
  joined_date?: string | null;
  social_instagram?: string | null;
  social_linkedin?: string | null;
  social_github?: string | null;
  social_x?: string | null;
  social_email?: string | null;
  social_portfolio?: string | null;
  social_custom_url?: string | null;
  social_custom_label?: string | null;
  instagram_url?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  x_url?: string | null;
  portfolio_url?: string | null;
  focal_point?: string | null;
  accent_color_hex?: string | null;
  hidden?: boolean;
  show_fields?: {
    bio?: boolean;
    quote?: boolean;
    skills?: boolean;
    achievements?: boolean;
    fun_fact?: boolean;
    socials?: boolean;
    joined_date?: boolean;
  } | null;
}

interface DbStat {
  id: string;
  value: string;
  label: string;
  accent: string;
  sort_order: number;
}

// ─── Shared settings hook ───────────────────────────────────
function useSettings(keys: string[]) {
  const config = useSiteConfig();
  // Map new config structure to flat key-value for backward compat
  const heroConf = (config["hero_config"] as any) ?? {};
  const aboutConf = (config["about_config"] as any) ?? {};
  const sh = (config["section_headings"] as any) ?? {};
  const keyMap: Record<string, string> = {
    hero_line_1: heroConf.line1 ?? (config["hero_line_1"] as string) ?? "",
    hero_line_2: heroConf.line2 ?? (config["hero_line_2"] as string) ?? "",
    hero_line_3: heroConf.line3 ?? (config["hero_line_3"] as string) ?? "",
    hero_subtitle: heroConf.subtitle ?? (config["hero_subtitle"] as string) ?? "",
    about_label: aboutConf.label ?? (config["about_label"] as string) ?? "",
    about_heading: aboutConf.heading ?? (config["about_heading"] as string) ?? "",
    about_paragraph: aboutConf.paragraph ?? (config["about_paragraph"] as string) ?? "",
    about_story: aboutConf.story ?? (config["about_story"] as string) ?? "",
    about_watermark: aboutConf.watermark ?? (config["about_watermark"] as string) ?? "",
    events_label: sh.events_label ?? (config["events_label"] as string) ?? "",
    events_heading: sh.events_heading ?? (config["events_heading"] as string) ?? "",
    gallery_label: sh.gallery_label ?? (config["gallery_label"] as string) ?? "",
    gallery_heading: sh.gallery_heading ?? (config["gallery_heading"] as string) ?? "",
    panel_label: sh.panel_label ?? (config["panel_label"] as string) ?? "",
    panel_heading: sh.panel_heading ?? (config["panel_heading"] as string) ?? "",
    feedback_label: sh.feedback_label ?? (config["feedback_label"] as string) ?? "",
    feedback_heading: sh.feedback_heading ?? (config["feedback_heading"] as string) ?? "",
    feedback_subtitle: sh.feedback_subtitle ?? (config["feedback_subtitle"] as string) ?? "",
  };
  return Object.fromEntries(keys.map((k) => [k, keyMap[k] ?? (config[k] as string) ?? ""]));
}

// ─── Marquee ─────────────────────────────────────────────────
const DEFAULT_MARQUEE = ["Create", "Build", "Design", "Code", "Perform", "Repeat"];
const ACCENT_CYCLE = ["cyan", "pink", "yellow"] as const;

function Marquee({ words }: { words: string[] }) {
  const row = [...words, ...words];
  return (
    <div className="overflow-hidden border-y bg-charcoal py-5" aria-hidden>
      <div className="animate-marquee flex w-max gap-10 font-display text-3xl font-black uppercase md:text-5xl">
        {row.map((w, i) => (
          <span key={i} className={i % 2 ? "text-outline" : accentText[ACCENT_CYCLE[i % 3] ?? "cyan"]}>
            {w} ✦
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── About ───────────────────────────────────────────────────
interface AboutElement {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  text?: string;
  textStyle?: any;
  opacity?: number;
  rotation?: number;
  fontSize?: number;
  color?: string;
  show?: boolean;
}

interface AboutLayoutData {
  desktop_config?: {
    elements?: AboutElement[];
  };
  mobile_config?: {
    elements?: AboutElement[];
  };
  section_height_desktop?: number;
  section_height_mobile?: number;
}

export function About() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["10%", "-30%"]);

  const [marqueeWords, setMarqueeWords] = useState<string[]>(DEFAULT_MARQUEE);
  const [stats, setStats] = useState<DbStat[]>([]);
  const [aboutLayout, setAboutLayout] = useState<AboutLayoutData | null>(null);
  const [isDesktop, setIsDesktop] = useState(true);

  const settings = useSettings([
    "about_label", "about_heading", "about_paragraph", "about_story", "about_watermark",
  ]);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    supabase
      .from("marquee_words")
      .select("word, sort_order")
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) setMarqueeWords(data.map((r) => r.word));
      });

    supabase
      .from("about_stats")
      .select("id, value, label, accent, sort_order")
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) setStats(data as DbStat[]);
      });

    // Fetch custom layout configuration
    supabase
      .from("about_layout")
      .select("*")
      .eq("id", "main")
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) {
          setAboutLayout(data as AboutLayoutData);
        }
      })
      .catch(() => {});
  }, []);

  const label = settings["about_label"] || "About GenZone";
  const heading = settings["about_heading"] || "A playground for people who make things.";
  const paragraph = settings["about_paragraph"] || "GenZone is the college's creative and technical club — a crew of designers, coders, filmmakers, artists and curious minds who'd rather build than sit still.";
  const story = settings["about_story"] || "[Placeholder: your club's story, mission and founding year go here.]";
  const watermark = settings["about_watermark"] || "LOUDER BOLDER";

  const dedupedStats: DbStat[] = [];
  const seenLabels = new Set<string>();
  for (const s of stats) {
    const key = s.label.trim().toLowerCase();
    if (!seenLabels.has(key)) {
      seenLabels.add(key);
      dedupedStats.push(s);
    }
  }

  const displayStats: Array<[string, string, string, string]> = dedupedStats.length > 0
    ? dedupedStats.map((s) => [s.id, s.value, s.label, `text-${s.accent}`])
    : [["default-members", "00+", "Members", "text-cyan"], ["default-events", "00+", "Events", "text-pink"], ["default-domains", "00", "Domains", "text-yellow"]];

  // Check if custom elements layout is active
  const hasDesktopLayout =
    aboutLayout?.desktop_config?.elements &&
    aboutLayout.desktop_config.elements.length > 0;
  const hasMobileLayout =
    aboutLayout?.mobile_config?.elements &&
    aboutLayout.mobile_config.elements.length > 0;

  // Render individual layout element
  function renderLayoutElement(el: AboutElement) {
    if (el.show === false) return null;

    if (el.type === "ghost_text") {
      return (
        <motion.p
          key={el.id}
          style={{
            x,
            fontSize: el.fontSize ? `${el.fontSize}px` : undefined,
            opacity: el.opacity ?? 0.05,
            transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
          }}
          className="pointer-events-none whitespace-nowrap font-display text-[22vw] font-black leading-none text-foreground/5"
          aria-hidden
        >
          {el.text || watermark}
        </motion.p>
      );
    }

    if (el.type === "badge") {
      return (
        <div
          key={el.id}
          style={{
            position: "absolute",
            left: `${el.x}%`,
            top: `${el.y}%`,
            width: `${el.w}%`,
          }}
        >
          <SectionTag n="01" label={el.text || label} />
        </div>
      );
    }

    if (el.type === "heading") {
      return (
        <div
          key={el.id}
          style={{
            position: "absolute",
            left: `${el.x}%`,
            top: `${el.y}%`,
            width: `${el.w}%`,
          }}
        >
          <SplitHeading
            text={el.text || heading}
            className="font-display font-black uppercase leading-[0.95]"
            style={{
              fontSize: el.fontSize ? `${el.fontSize}px` : undefined,
              color: el.color,
            }}
          />
        </div>
      );
    }

    if (el.type === "paragraph") {
      return (
        <div
          key={el.id}
          style={{
            position: "absolute",
            left: `${el.x}%`,
            top: `${el.y}%`,
            width: `${el.w}%`,
          }}
        >
          <Reveal>
            <p
              className="leading-relaxed whitespace-pre-wrap"
              style={{
                fontSize: el.fontSize ? `${el.fontSize}px` : undefined,
                color: el.color || undefined,
                opacity: el.opacity ?? 1,
              }}
            >
              {el.text || paragraph}
            </p>
          </Reveal>
        </div>
      );
    }

    if (el.type === "stats") {
      return (
        <div
          key={el.id}
          style={{
            position: "absolute",
            left: `${el.x}%`,
            top: `${el.y}%`,
            width: `${el.w}%`,
          }}
        >
          <Reveal delay={0.2} className="grid grid-cols-3 gap-3 border-t pt-4 sm:gap-4">
            {displayStats.map(([id, n, l, c]) => (
              <div key={id} className="min-w-0">
                <div className={`font-display text-2xl font-black sm:text-3xl md:text-4xl ${c}`}>{n}</div>
                <div className="truncate font-mono text-[10px] uppercase tracking-widest sm:text-xs">{l}</div>
              </div>
            ))}
          </Reveal>
        </div>
      );
    }

    return null;
  }

  return (
    <>
      <Marquee words={marqueeWords} />
      {hasDesktopLayout && isDesktop ? (
        <section
          id="about"
          ref={ref}
          className="relative overflow-hidden px-5 py-28 md:px-16 md:py-40"
          style={{ minHeight: `${aboutLayout?.section_height_desktop || 800}px` }}
        >
          {aboutLayout!.desktop_config!.elements!.map((el) => renderLayoutElement(el))}
        </section>
      ) : hasMobileLayout && !isDesktop ? (
        <section
          id="about"
          ref={ref}
          className="relative overflow-hidden px-5 py-20"
          style={{ minHeight: `${aboutLayout?.section_height_mobile || 1000}px` }}
        >
          {aboutLayout!.mobile_config!.elements!.map((el) => renderLayoutElement(el))}
        </section>
      ) : (
        /* Full fallback to existing layout */
        <section id="about" ref={ref} className="relative overflow-x-clip px-5 py-16 scroll-mt-16 sm:py-24 md:px-16 md:py-40">
          <SectionTag n="01" label={label} />
          <motion.p style={{ x }} className="pointer-events-none whitespace-nowrap font-display text-[15vw] font-black leading-none text-foreground/5 md:text-[22vw]" aria-hidden>
            {watermark}
          </motion.p>
          <div className="-mt-1 grid gap-8 sm:-mt-3 sm:gap-10 md:-mt-[10vw] md:grid-cols-2 md:gap-12">
            <SplitHeading text={heading} className="font-display text-3xl sm:text-4xl font-black uppercase leading-[0.95] md:text-7xl break-words" />
            <div className="min-w-0 space-y-5 self-end text-base text-muted-foreground sm:space-y-6 sm:text-lg md:text-xl">
              <Reveal>
                <p>{paragraph}</p>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="text-foreground">{story}</p>
              </Reveal>
              <Reveal delay={0.2} className="grid grid-cols-3 gap-3 pt-4 sm:gap-4 sm:pt-6">
                {displayStats.map(([id, n, l, c]) => (
                  <div key={id} className="min-w-0 border-t pt-3 sm:pt-4">
                    <div className={`font-display text-2xl font-black sm:text-3xl md:text-4xl ${c}`}>{n}</div>
                    <div className="truncate font-mono text-[10px] uppercase tracking-widest sm:text-xs">{l}</div>
                  </div>
                ))}
              </Reveal>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

// ─── Event Details Popup ─────────────────────────────────────
interface EventDetailsPopupProps {
  event: DbEvent;
  events: DbEvent[];
  currentIndex: number;
  onClose: () => void;
  onSelectEvent: (event: DbEvent, index: number) => void;
}

// ─── Registration Panel (Glassmorphism) ───────────────────────────────────────

interface RegistrationPanelProps {
  isRegistrationClosed: boolean;
  registerTargetUrl: string | null;
  buttonLabel: string;
  icsHref: string | null;
  copied: boolean;
  onShare: () => void;
  reduceMotion: boolean;
}

function RegistrationPanel({
  isRegistrationClosed,
  registerTargetUrl,
  buttonLabel,
  icsHref,
  copied,
  onShare,
  reduceMotion,
}: RegistrationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Motion values for spotlight — zero re-renders
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spotOpacity = useMotionValue(0);
  const spotlightBg = useMotionTemplate`radial-gradient(280px circle at ${mouseX}px ${mouseY}px, rgba(0,217,255,0.08) 0%, transparent 70%)`;

  // Animated conic-gradient border angle
  const borderAngle = useMotionValue(0);
  const borderGradient = useMotionTemplate`conic-gradient(from ${borderAngle}deg at 50% 50%, #00D9FF 0deg, #FF168A 120deg, #FFD500 240deg, #00D9FF 360deg)`;

  // Animate border on mount (loop)
  useEffect(() => {
    if (reduceMotion) return;
    let frame: number;
    let angle = 0;
    const animate = () => {
      angle = (angle + 0.5) % 360;
      borderAngle.set(angle);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [reduceMotion, borderAngle]);

  // Pointer tracking — coarse pointer (touch) guard
  const isCoarse = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduceMotion || isCoarse || !panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }
  function handleMouseEnter() {
    if (reduceMotion || isCoarse) return;
    spotOpacity.set(1);
  }
  function handleMouseLeave() {
    spotOpacity.set(0);
  }

  const isOpen = !isRegistrationClosed && !!registerTargetUrl;
  const isSoon = !isRegistrationClosed && !registerTargetUrl;

  return (
    <div className="sticky bottom-0 z-20 p-3 sm:p-4">
      {/* Animated gradient border wrapper */}
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reduceMotion ? 0.2 : 0.4,
          delay: reduceMotion ? 0 : 0.42,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="rounded-2xl p-px relative overflow-hidden"
        style={
          reduceMotion
            ? { background: "linear-gradient(135deg, rgba(0,217,255,0.3), rgba(255,22,138,0.3))" }
            : {}
        }
      >
        {/* Animated conic border layer */}
        {!reduceMotion && (
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{ background: borderGradient, opacity: 0.75 }}
          />
        )}
        {/* Soft outer glow blur (behind glass) */}
        {!reduceMotion && (
          <motion.div
            className="absolute inset-0 rounded-2xl blur-md scale-105 -z-10"
            style={{ background: borderGradient, opacity: 0.2 }}
          />
        )}

        {/* Glass surface — solid dark bg so gradient only shows at the 1px border edge */}
        <div
          ref={panelRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="relative rounded-[15px] overflow-hidden
            bg-[#0d0d12]/95 backdrop-blur-lg
            shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.07)]"
        >
          {/* Spotlight overlay */}
          <motion.div
            className="pointer-events-none absolute inset-0 z-0 rounded-[15px]"
            style={{ background: spotlightBg, opacity: spotOpacity }}
          />

          {/* Top inner highlight sheen */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Content */}
          <div className="relative z-10 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">

            {/* Left: Utility buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {icsHref && (
                <motion.a
                  href={icsHref}
                  download
                  whileHover={reduceMotion ? {} : { y: -1, borderColor: "rgba(0,217,255,0.6)" }}
                  whileTap={reduceMotion ? {} : { scale: 0.97 }}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl
                    border border-white/10 bg-white/5 hover:bg-white/10
                    text-xs font-mono text-white/70 hover:text-white
                    transition-colors duration-200"
                  title="Add to Calendar (.ics)"
                >
                  <CalendarIcon size={13} className="text-cyan shrink-0" />
                  <span className="hidden sm:inline">Add to Calendar</span>
                  <span className="sm:hidden">Calendar</span>
                </motion.a>
              )}

              <motion.button
                onClick={onShare}
                whileHover={reduceMotion ? {} : { y: -1, borderColor: "rgba(255,22,138,0.6)" }}
                whileTap={reduceMotion ? {} : { scale: 0.97 }}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl
                  border border-white/10 bg-white/5 hover:bg-white/10
                  text-xs font-mono text-white/70 hover:text-white
                  transition-colors duration-200"
                title="Share event link"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {copied ? (
                    <motion.span
                      key="copied"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="inline-flex items-center gap-1.5 text-cyan"
                    >
                      <Check size={13} />
                      Copied!
                    </motion.span>
                  ) : (
                    <motion.span
                      key="share"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="inline-flex items-center gap-1.5"
                    >
                      <Share2 size={13} className="text-pink shrink-0" />
                      Share
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>

            {/* Right: Register CTA */}
            <div className="w-full sm:w-auto sm:min-w-[200px]">
              <AnimatePresence mode="wait" initial={false}>
                {isRegistrationClosed ? (
                  <motion.div
                    key="closed"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl
                      font-mono text-xs uppercase tracking-widest
                      border border-white/10 bg-white/5 text-white/35
                      cursor-not-allowed select-none"
                  >
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/25" />
                    {buttonLabel}
                  </motion.div>
                ) : isOpen ? (
                  <motion.a
                    key="open"
                    href={registerTargetUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    whileHover={reduceMotion ? {} : { scale: 1.02, boxShadow: "0 0 28px rgba(0,217,255,0.45)" }}
                    whileTap={reduceMotion ? {} : { scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl
                      font-mono text-xs uppercase tracking-widest font-bold
                      bg-gradient-to-r from-cyan to-cyan/80 text-black
                      shadow-[0_0_20px_rgba(0,217,255,0.3)]
                      transition-shadow duration-300"
                  >
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-black/40 animate-pulse" />
                    {buttonLabel}
                    <ExternalLink size={13} className="shrink-0" />
                  </motion.a>
                ) : (
                  <motion.div
                    key="soon"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl
                      font-mono text-xs uppercase tracking-widest
                      border border-cyan/25 bg-cyan/8 text-cyan/60
                      cursor-not-allowed select-none"
                  >
                    <Clock size={13} className="shrink-0 animate-pulse" />
                    Registration Coming Soon
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}

const SPLIT_EASE: [number, number, number, number] = [0.77, 0, 0.175, 1];
const SPLIT_DURATION = 0.8;
const SPLIT_DELAY = 0.12;

function EventBannerSplitReveal({
  event,
  reduceMotion,
}: {
  event: DbEvent;
  reduceMotion: boolean;
}) {
  const [revealComplete, setRevealComplete] = useState(false);

  useEffect(() => {
    setRevealComplete(false);
  }, [event.id]);

  return (
    <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-charcoal">
      {event.image_url ? (
        <>
          {/* Underlying cover image zooming out cleanly from 1.08 -> 1.0 */}
          <motion.img
            src={event.image_url}
            alt={event.title}
            decoding="sync"
            initial={reduceMotion ? { opacity: 0 } : { scale: 1.08, opacity: 1 }}
            animate={reduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
            transition={{
              duration: reduceMotion ? 0.25 : SPLIT_DURATION,
              delay: reduceMotion ? 0 : SPLIT_DELAY,
              ease: SPLIT_EASE,
            }}
            className="h-full w-full object-cover will-change-transform"
          />

          {/* Vertical Split Door Panels — unmounted once reveal completes */}
          {!reduceMotion && !revealComplete && (
            <div
              className="pointer-events-none absolute inset-0 z-[5] overflow-hidden"
              aria-hidden="true"
            >
              {(["left", "right"] as const).map((side) => {
                const isLeft = side === "left";
                return (
                  <motion.div
                    key={side}
                    initial={{ x: "0%", opacity: 1 }}
                    animate={{ x: isLeft ? "-52%" : "52%", opacity: [1, 0.92, 0] }}
                    transition={{
                      x: {
                        duration: SPLIT_DURATION,
                        delay: SPLIT_DELAY,
                        ease: SPLIT_EASE,
                      },
                      opacity: {
                        duration: SPLIT_DURATION,
                        delay: SPLIT_DELAY,
                        times: [0, 0.55, 1],
                        ease: "easeOut",
                      },
                    }}
                    {...(!isLeft
                      ? { onAnimationComplete: () => setRevealComplete(true) }
                      : {})}
                    className="pointer-events-none absolute inset-0 will-change-transform"
                    style={{
                      clipPath: isLeft
                        ? "inset(0 49.9% 0 0)"
                        : "inset(0 0 0 49.9%)",
                    }}
                  >
                    <img
                      src={event.image_url!}
                      alt=""
                      decoding="sync"
                      className="h-full w-full object-cover"
                    />
                    {/* Curtain depth & parting center edge sheen after split begins */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.62 }}
                      transition={{
                        duration: SPLIT_DURATION * 0.45,
                        delay: SPLIT_DELAY + 0.04,
                        ease: "easeOut",
                      }}
                      className="absolute inset-0 bg-black"
                    />
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.9, 0.35, 0] }}
                      transition={{
                        duration: SPLIT_DURATION,
                        delay: SPLIT_DELAY + 0.02,
                        ease: "easeOut",
                      }}
                      className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-gradient-to-b from-cyan/80 via-white/90 to-pink/80"
                    />
                  </motion.div>
                );
              })}
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </>
      ) : (
        <>
          <div className="placeholder-tile absolute inset-0" />
          <div
            className={`absolute -right-16 -top-16 h-64 w-64 rounded-full blur-3xl opacity-60 ${accentBg[event.accent]}`}
          />
          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </>
      )}

      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reduceMotion ? 0.2 : 0.45,
          delay: reduceMotion ? 0 : SPLIT_DELAY,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="absolute bottom-4 left-4 right-4 z-20 space-y-2"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/80 bg-black/60 border border-white/20 rounded-full px-3 py-1">
            {event.category || "Club Event"}
          </span>
          {event.featured && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-yellow bg-yellow/10 border border-yellow/30 rounded-full px-2.5 py-1 flex items-center gap-1">
              <Sparkles size={11} /> Featured
            </span>
          )}
        </div>
        <h2 className="font-display text-2xl sm:text-4xl font-black uppercase text-white leading-tight">
          {event.title}
        </h2>
      </motion.div>
    </div>
  );
}

function EventDetailsPopup({
  event,
  events,
  currentIndex,
  onClose,
  onSelectEvent,
}: EventDetailsPopupProps) {
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  // Scroll lock
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Keyboard navigation
  const handlePrev = useCallback(() => {
    if (events.length <= 1) return;
    const prevIdx = (currentIndex - 1 + events.length) % events.length;
    onSelectEvent(events[prevIdx], prevIdx);
  }, [currentIndex, events, onSelectEvent]);

  const handleNext = useCallback(() => {
    if (events.length <= 1) return;
    const nextIdx = (currentIndex + 1) % events.length;
    onSelectEvent(events[nextIdx], nextIdx);
  }, [currentIndex, events, onSelectEvent]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "ArrowRight") handleNext();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, handlePrev, handleNext]);

  // Focus trap
  useEffect(() => {
    modalRef.current?.focus();
  }, [event]);

  // Calendar .ics generator
  function getIcsHref() {
    if (!event.event_date) return null;
    try {
      const d = new Date(event.event_date);
      const formatIcs = (date: Date) =>
        date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      const start = formatIcs(d);
      const end = formatIcs(new Date(d.getTime() + 2 * 60 * 60 * 1000));
      const icsLines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//GenZone//Events//EN",
        "BEGIN:VEVENT",
        `UID:${event.id}@genzone.club`,
        `DTSTAMP:${formatIcs(new Date())}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${event.title.replace(/\n/g, " ")}`,
        `DESCRIPTION:${(event.full_description || event.description || "").replace(/\n/g, " ")}`,
        `LOCATION:${(event.venue || "").replace(/\n/g, " ")}`,
        "END:VEVENT",
        "END:VCALENDAR",
      ];
      return `data:text/calendar;charset=utf-8,${encodeURIComponent(icsLines.join("\r\n"))}`;
    } catch {
      return null;
    }
  }

  // Share
  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description || event.full_description || "Check out this GenZone event!",
          url: window.location.href,
        });
        return;
      } catch {
        // Fall back to clipboard
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // Check registration status
  const isRegistrationClosed =
    !event.registration_open ||
    (event.registration_deadline && new Date(event.registration_deadline) < new Date());

  const registerTargetUrl = event.google_form_url || event.external_form_url;
  const buttonLabel = isRegistrationClosed
    ? event.closed_label || "Registration Closed"
    : event.register_button_label || "Register Now";

  const icsHref = getIcsHref();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={event.title}
    >
      <motion.div
        ref={modalRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        initial={reduceMotion ? { opacity: 0 } : { scale: 0.85, opacity: 0 }}
        animate={reduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
        exit={reduceMotion ? { opacity: 0 } : { scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative flex flex-col w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/15 bg-background shadow-2xl focus:outline-none"
      >
        {/* Navigation Arrows & Close Button */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
          {events.length > 1 && (
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm border border-white/15 rounded-full p-1">
              <button
                onClick={handlePrev}
                title="Previous event"
                className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-mono text-[10px] text-white/50 px-1">
                {currentIndex + 1}/{events.length}
              </span>
              <button
                onClick={handleNext}
                title="Next event"
                className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
          <button
            onClick={onClose}
            title="Close popup"
            className="p-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/15 text-white/80 hover:text-white hover:bg-white/20 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Header / Banner — Vertical Split Image Reveal keyed by event.id */}
        <EventBannerSplitReveal
          key={`banner-${event.id}`}
          event={event}
          reduceMotion={!!reduceMotion}
        />

        {/* Content Body */}
        <motion.div
          key={`body-${event.id}`}
          initial="hidden"
          animate="visible"
          variants={
            reduceMotion
              ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.2 } } }
              : {
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: 0.065,
                      delayChildren: 0.18,
                    },
                  },
                }
          }
          className="p-6 space-y-6 flex-1"
        >
          {/* Quick Specs Grid */}
          <motion.div
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: reduceMotion ? 0 : 0.065,
                },
              },
            }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-3"
          >
            {[
              {
                icon: CalendarIcon,
                label: "Date",
                value: event.event_date
                  ? new Date(event.event_date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Date TBA",
              },
              {
                icon: MapPin,
                label: "Venue",
                value: event.venue || "Campus / Online",
              },
              {
                icon: Ticket,
                label: "Fee",
                value: event.entry_fee || "Free Entry",
              },
              ...(event.eligibility
                ? [{ icon: Award, label: "Eligibility", value: event.eligibility }]
                : []),
              ...(event.dress_code
                ? [{ icon: Shirt, label: "Dress Code", value: event.dress_code }]
                : []),
              ...(event.seats_note
                ? [{ icon: UsersIcon, label: "Seats", value: event.seats_note }]
                : []),
            ].map((spec) => {
              const IconComp = spec.icon;
              return (
                <motion.div
                  key={spec.label}
                  variants={
                    reduceMotion
                      ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
                      : {
                          hidden: { opacity: 0, y: 12 },
                          visible: {
                            opacity: 1,
                            y: 0,
                            transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
                          },
                        }
                  }
                  className="bg-charcoal border border-border/80 rounded-xl p-3 flex items-start gap-2.5"
                >
                  <IconComp size={16} className={`mt-0.5 shrink-0 ${accentText[event.accent]}`} />
                  <div className="min-w-0">
                    <span className="block font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      {spec.label}
                    </span>
                    <span className="font-mono text-xs text-white truncate block">
                      {spec.value}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Highlights */}
          {Array.isArray(event.highlights) && event.highlights.length > 0 && (
            <motion.div
              variants={
                reduceMotion
                  ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
                  : {
                      hidden: { opacity: 0, y: 12 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
                      },
                    }
              }
              className="space-y-3"
            >
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-cyan flex items-center gap-1.5">
                <Sparkles size={13} /> Highlights
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {event.highlights.map((hl, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-charcoal border border-border/70 space-y-1 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{hl.icon || "✦"}</span>
                      <h4 className="font-display text-sm font-bold text-white uppercase">
                        {hl.title}
                      </h4>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground leading-relaxed pl-7">
                      {hl.text}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Description */}
          <motion.div
            variants={
              reduceMotion
                ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
                : {
                    hidden: { opacity: 0, y: 12 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
                    },
                  }
            }
            className="space-y-2"
          >
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-white/50">
              Overview
            </h3>
            <div className="text-white/80 text-sm leading-relaxed space-y-3 font-sans">
              {(event.full_description || event.description || "More details coming soon.")
                .split("\n\n")
                .map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
            </div>
          </motion.div>

          {/* Schedule / Timeline */}
          {Array.isArray(event.schedule) && event.schedule.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-cyan flex items-center gap-1.5">
                <Clock size={13} /> Schedule &amp; Timeline
              </h3>
              <div className="space-y-2 border-l border-white/10 ml-2 pl-4">
                {event.schedule.map((item, i) => (
                  <div key={i} className="relative py-1">
                    <span className="absolute -left-[21px] top-2.5 h-2 w-2 rounded-full bg-cyan ring-4 ring-background" />
                    <span className="font-mono text-[11px] text-cyan uppercase tracking-wider block">
                      {item.time}
                    </span>
                    <h4 className="font-display text-sm font-bold text-white uppercase mt-0.5">
                      {item.title}
                    </h4>
                    {item.text && (
                      <p className="font-mono text-xs text-muted-foreground mt-0.5">
                        {item.text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Speakers / Guests */}
          {Array.isArray(event.speakers) && event.speakers.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-yellow flex items-center gap-1.5">
                <UsersIcon size={13} /> Speakers &amp; Guests
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {event.speakers.map((spk, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl bg-charcoal border border-border/70"
                  >
                    <div className="h-11 w-11 rounded-full overflow-hidden bg-background border border-white/10 shrink-0">
                      {spk.photo_url ? (
                        <img
                          src={spk.photo_url}
                          alt={spk.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center font-display font-bold text-xs text-muted-foreground">
                          {spk.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-sm font-bold text-white uppercase truncate">
                        {spk.name}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground truncate">
                        {spk.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {Array.isArray(event.tags) && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {event.tags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground border border-white/10 bg-white/5 rounded-full px-3 py-1"
                >
                  <Tag size={10} /> {tag}
                </span>
              ))}
            </div>
          )}

          {/* Contact & Community Links */}
          {(event.contact_name ||
            event.contact_whatsapp ||
            event.whatsapp_group_url ||
            event.brochure_url) && (
            <div className="space-y-3 pt-2">
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-white/50">
                Connect &amp; Resources
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {event.whatsapp_group_url && (
                  <a
                    href={event.whatsapp_group_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 px-3.5 py-2 rounded-xl font-mono text-xs transition-colors"
                  >
                    <MessageCircle size={14} /> Join WhatsApp Group ↗
                  </a>
                )}
                {event.brochure_url && (
                  <a
                    href={event.brochure_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-charcoal border border-border hover:border-cyan text-white hover:text-cyan px-3.5 py-2 rounded-xl font-mono text-xs transition-colors"
                  >
                    <Download size={14} /> Download Brochure ↗
                  </a>
                )}
                {(event.contact_name || event.contact_whatsapp) && (
                  <div className="inline-flex items-center gap-2 bg-charcoal border border-border px-3.5 py-2 rounded-xl font-mono text-xs text-muted-foreground">
                    <span>Contact:</span>
                    <span className="text-white font-bold">{event.contact_name || "Lead"}</span>
                    {event.contact_whatsapp && (
                      <a
                        href={
                          event.contact_whatsapp.startsWith("http")
                            ? event.contact_whatsapp
                            : `https://wa.me/${event.contact_whatsapp.replace(/\D/g, "")}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan underline ml-1"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FAQs Accordion */}
          {Array.isArray(event.faqs) && event.faqs.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-white/50">
                Frequently Asked Questions
              </h3>
              <div className="space-y-2">
                {event.faqs.map((faq, i) => (
                  <div
                    key={i}
                    className="border border-border/80 rounded-xl bg-charcoal overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between p-3.5 text-left font-mono text-xs text-white hover:text-cyan transition-colors"
                    >
                      <span className="font-bold">{faq.question}</span>
                      <ChevronDown
                        size={15}
                        className={`text-muted-foreground transition-transform duration-200 shrink-0 ml-2 ${
                          openFaq === i ? "rotate-180 text-cyan" : ""
                        }`}
                      />
                    </button>
                    {openFaq === i && (
                      <div className="px-3.5 pb-3.5 pt-1 text-xs font-mono text-muted-foreground leading-relaxed border-t border-border/40">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </motion.div>

        {/* Footer Actions — Glassmorphism Registration Panel */}
        <RegistrationPanel
          key={`reg-${event.id}`}
          isRegistrationClosed={!!isRegistrationClosed}
          registerTargetUrl={registerTargetUrl ?? null}
          buttonLabel={buttonLabel}
          icsHref={icsHref}
          copied={copied}
          onShare={handleShare}
          reduceMotion={!!reduceMotion}
        />

      </motion.div>
    </motion.div>
  );
}

// ─── Events ──────────────────────────────────────────────────
export function Events() {
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [hover, setHover] = useState(0);
  const [detailEvent, setDetailEvent] = useState<DbEvent | null>(null);
  const [detailIndex, setDetailIndex] = useState(0);
  const settings = useSettings(["events_label", "events_heading"]);

  useEffect(() => {
    supabase
      .from("events")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) setEvents(data as DbEvent[]);
      });
  }, []);

  const label = settings["events_label"] || "Events & Activities";
  const heading = settings["events_heading"] || "What's going down.";
  const current = events[hover] ?? events[0];

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "Date TBA";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function openDetails(e: DbEvent, index: number) {
    setDetailEvent(e);
    setDetailIndex(index);
  }

  if (events.length === 0) return (
    <section id="events" className="overflow-x-clip px-5 py-16 scroll-mt-16 sm:py-24 md:px-16 md:py-40">
      <SectionTag n="02" label={label} />
      <SplitHeading text={heading} className="mb-10 font-display text-3xl sm:text-5xl font-black uppercase md:mb-16 md:text-8xl break-words" />
      <p className="text-muted-foreground font-mono text-sm">No events yet — check back soon.</p>
    </section>
  );

  return (
    <>
      <section id="events" className="overflow-x-clip px-5 py-16 scroll-mt-16 sm:py-24 md:px-16 md:py-40">
        <SectionTag n="02" label={label} />
        <SplitHeading text={heading} className="mb-10 font-display text-3xl sm:text-5xl font-black uppercase md:mb-16 md:text-8xl break-words" />
        <div className="grid gap-10 md:grid-cols-[1fr_0.8fr] md:pr-20">
          <ul>
            {events.map((e, i) => (
              <li key={e.id}>
                <Reveal delay={i * 0.05}>
                  <button
                    onMouseEnter={() => setHover(i)}
                    onFocus={() => setHover(i)}
                    onClick={() => {
                      setHover(i);
                      openDetails(e, i);
                    }}
                    className="group flex w-full items-baseline gap-4 border-t py-6 text-left md:gap-8 md:py-8 cursor-pointer focus:outline-none"
                  >
                    <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                    <span className={`flex-1 font-display text-2xl font-black uppercase transition-all duration-500 md:text-5xl ${hover === i ? `${accentText[e.accent]} md:translate-x-4` : ""}`}>
                      {e.title}
                    </span>
                    <span className="hidden font-mono text-xs uppercase tracking-widest text-muted-foreground sm:block">{e.category}</span>
                  </button>
                </Reveal>
              </li>
            ))}
          </ul>
          <div className="md:sticky md:top-24 md:self-start">
            {current && (
              <AnimatePresence mode="wait">
                <motion.article
                  key={current.id}
                  initial={{ opacity: 0, rotate: -4, y: 30 }}
                  animate={{ opacity: 1, rotate: -2, y: 0 }}
                  exit={{ opacity: 0, rotate: 3, y: -20 }}
                  transition={{ duration: 0.45 }}
                  onClick={() => openDetails(current, hover)}
                  className={`group relative aspect-[3/4] overflow-hidden rounded-xl border-2 cursor-pointer ${accentBorder[current.accent]}`}
                >
                  {current.image_url ? (
                    <>
                      <img
                        src={current.image_url}
                        alt={current.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                    </>
                  ) : (
                    <>
                      <div className="placeholder-tile absolute inset-0" />
                      <div className={`absolute -right-10 -top-10 h-48 w-48 rounded-full blur-3xl opacity-60 ${accentBg[current.accent]}`} />
                    </>
                  )}

                  {/* Content */}
                  <div className="relative z-10 flex h-full flex-col justify-between p-6">
                    <div className="flex justify-between font-mono text-xs uppercase tracking-widest">
                      <span>{current.category}</span>
                      <span>{formatDate(current.event_date)}</span>
                    </div>
                    <div>
                      <h3 className="font-display text-4xl font-black uppercase leading-none md:text-5xl">{current.title}</h3>
                      <p className="mt-2 text-white/70 text-sm line-clamp-2">{current.description ?? "More details coming soon."}</p>

                      <div className="mt-4 flex items-center justify-between">
                        <span className={`font-mono text-xs uppercase tracking-widest ${accentText[current.accent]} flex items-center gap-1 group-hover:translate-x-1 transition-transform`}>
                          View Details →
                        </span>
                        {current.featured && (
                          <span className="font-mono text-[9px] uppercase tracking-widest text-yellow border border-yellow/30 bg-yellow/10 rounded-full px-2 py-0.5">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.article>
              </AnimatePresence>
            )}
          </div>
        </div>
      </section>

      {/* Events Details Popup */}
      <AnimatePresence>
        {detailEvent && (
          <EventDetailsPopup
            event={detailEvent}
            events={events}
            currentIndex={detailIndex}
            onClose={() => setDetailEvent(null)}
            onSelectEvent={(e, idx) => {
              setDetailEvent(e);
              setDetailIndex(idx);
              setHover(idx);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Gallery ─────────────────────────────────────────────────
export function Gallery() {
  const [photos, setPhotos] = useState<DbGallery[]>([]);
  const [albums, setAlbums] = useState<DbAlbum[]>([]);
  const settings = useSettings(["gallery_label", "gallery_heading"]);

  useEffect(() => {
    supabase
      .from("gallery")
      .select("id, caption, category, album_id, image_url, thumb_url, tall")
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) setPhotos(data as DbGallery[]);
      });

    supabase
      .from("gallery_albums")
      .select("id, name, heading, sort_order")
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) setAlbums(data as DbAlbum[]);
      });
  }, []);

  const label = settings["gallery_label"] || "GenZone Memories";
  const rawHeading = settings["gallery_heading"];
  const heading = rawHeading && rawHeading !== "Proof it happened." ? rawHeading : "Wall of Memories";

  const backgroundItems = useMemo(
    () =>
      photos
        .map((p) => p.thumb_url || p.image_url)
        .filter((src): src is string => Boolean(src)),
    [photos],
  );

  const mappedAlbums = useMemo<GalleryAlbum[]>(() => {
    const mapPhoto = (p: DbGallery, fallbackTitle: string, fallbackSubtitle?: string | null): GalleryPhoto => {
      const sub = p.category || fallbackSubtitle || undefined;
      return {
        id: p.id,
        src: p.image_url,
        alt: p.caption || p.category || fallbackTitle,
        title: p.caption || fallbackTitle,
        ...(sub ? { subtitle: sub } : {}),
      };
    };

    const fromAlbums = albums
      .map((alb) => {
        const albumRows = photos.filter((p) => p.album_id === alb.id);
        const explicitCover = (alb as DbAlbum & { cover_image?: string | null; cover_url?: string | null }).cover_image
          ?? (alb as DbAlbum & { cover_url?: string | null }).cover_url;
        const firstRow = albumRows[0];
        const coverImage = explicitCover || firstRow?.thumb_url || firstRow?.image_url || "";
        if (!coverImage && albumRows.length === 0) return null;
        return {
          id: alb.id,
          title: alb.name,
          coverImage,
          photos: albumRows.map((p) => mapPhoto(p, alb.name, alb.heading)),
        } as GalleryAlbum;
      })
      .filter((a): a is GalleryAlbum => a !== null);

    if (fromAlbums.length > 0) return fromAlbums;

    const fallbackRows = photos.filter((p) => Boolean(p.image_url || p.thumb_url));
    const firstFallback = fallbackRows[0];
    if (firstFallback) {
      return [
        {
          id: "highlights",
          title: "Highlights",
          coverImage: firstFallback.thumb_url || firstFallback.image_url,
          photos: fallbackRows.map((p) => mapPhoto(p, "Highlights")),
        },
      ];
    }

    return [];
  }, [albums, photos]);

  return (
    <section id="gallery" className="relative bg-charcoal overflow-hidden px-5 py-16 scroll-mt-16 sm:py-24 md:px-16 md:py-40">
      {backgroundItems.length > 0 && (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
          <GridMotion
            items={backgroundItems}
            rows={4}
            aspectRatio={1.33}
            gap={14}
            radius={14}
            angle={-12}
            speed={20}
            direction="alternate"
            parallax={0}
            spotlight={0}
            dim={0.3}
            fade={0.35}
            theme="dark"
            className="h-full w-full opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal/75 via-charcoal/25 to-charcoal/75" />
        </div>
      )}

      <div className="relative z-10">
        <SectionTag n="03" label={label} />
        <div className="mb-8 flex flex-col justify-between gap-6 md:mb-12 md:flex-row md:items-end md:gap-8">
          <SplitHeading text={heading} className="font-display text-3xl sm:text-5xl font-black uppercase md:text-8xl break-words drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]" />
        </div>

        {mappedAlbums.length === 0 ? (
          <p className="text-muted-foreground font-mono text-sm">
            {photos.length === 0
              ? "No photos yet — upload some from the admin panel."
              : "No albums yet — create an album from the admin panel."}
          </p>
        ) : (
          <GalleryShowcase albums={mappedAlbums} height="clamp(360px, 58dvh, 620px)" />
        )}
      </div>
    </section>
  );
}

// ─── Panel Member Popup ──────────────────────────────────────
interface PanelMemberPopupProps {
  member: DbMember;
  members: DbMember[];
  currentIndex: number;
  onClose: () => void;
  onSelectMember: (member: DbMember, index: number) => void;
}

function PanelMemberPopup({
  member,
  members,
  currentIndex,
  onClose,
  onSelectMember,
}: PanelMemberPopupProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();

  // Scroll lock
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Keyboard navigation
  const handlePrev = useCallback(() => {
    if (members.length <= 1) return;
    const prevIdx = (currentIndex - 1 + members.length) % members.length;
    onSelectMember(members[prevIdx], prevIdx);
  }, [currentIndex, members, onSelectMember]);

  const handleNext = useCallback(() => {
    if (members.length <= 1) return;
    const nextIdx = (currentIndex + 1) % members.length;
    onSelectMember(members[nextIdx], nextIdx);
  }, [currentIndex, members, onSelectMember]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "ArrowRight") handleNext();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, handlePrev, handleNext]);

  // Focus trap
  useEffect(() => {
    modalRef.current?.focus();
  }, [member]);

  // Touch swipe support
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX > 50) handlePrev();
    else if (deltaX < -50) handleNext();
    touchStartX.current = null;
  }

  // show_fields configuration
  const sf = member.show_fields ?? {
    bio: true,
    quote: true,
    skills: true,
    achievements: true,
    fun_fact: true,
    socials: true,
    joined_date: true,
  };

  const accentColorClass = accentText[member.accent] || "text-cyan";
  const customAccentHex = member.accent_color_hex?.trim() || null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={member.name}
    >
      <motion.div
        ref={modalRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        initial={reduceMotion ? { opacity: 0 } : { scale: 0.85, opacity: 0 }}
        animate={reduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
        exit={reduceMotion ? { opacity: 0 } : { scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        className="relative flex flex-col md:flex-row w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/15 bg-background shadow-2xl focus:outline-none"
      >
        {/* Navigation & Close in Top Right */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          {members.length > 1 && (
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm border border-white/15 rounded-full p-1">
              <button
                onClick={handlePrev}
                title="Previous member"
                className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-mono text-[10px] text-white/50 px-1">
                {currentIndex + 1}/{members.length}
              </span>
              <button
                onClick={handleNext}
                title="Next member"
                className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
          <button
            onClick={onClose}
            title="Close popup"
            className="p-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/15 text-white/80 hover:text-white hover:bg-white/20 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* LEFT 1/3: Member Portrait */}
        <div className="md:w-1/3 shrink-0 relative bg-charcoal aspect-[3/4] md:aspect-auto md:min-h-full overflow-hidden">
          {member.portrait_url ? (
            <img
              src={member.portrait_url}
              alt={member.name}
              style={{ objectPosition: member.focal_point || "50% 50%" }}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="placeholder-tile h-full w-full flex items-center justify-center p-6 text-center">
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Portrait Placeholder
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent md:hidden" />
          <div
            className="absolute inset-x-0 bottom-0 h-1/3 opacity-40 blur-2xl pointer-events-none"
            style={{
              backgroundColor:
                customAccentHex ||
                (member.accent === "pink"
                  ? "#ff007f"
                  : member.accent === "yellow"
                  ? "#facc15"
                  : "#00ffff"),
            }}
          />
        </div>

        {/* RIGHT 2/3: Content */}
        <div className="flex-1 p-6 md:p-8 space-y-5">
          {/* Role + Name + Department */}
          <div className="space-y-1 pr-14">
            <p
              className={`font-mono text-xs uppercase tracking-widest font-bold ${accentColorClass}`}
              style={customAccentHex ? { color: customAccentHex } : undefined}
            >
              {member.role}
            </p>
            <h2 className="font-display text-2xl sm:text-4xl font-black uppercase text-white leading-tight">
              {member.name}
            </h2>
            {(member.department || member.year_batch) && (
              <p className="font-mono text-xs text-muted-foreground tracking-wide">
                {[member.department, member.year_batch].filter(Boolean).join(" • ")}
              </p>
            )}
          </div>

          {/* Quote */}
          {sf.quote !== false && member.quote && (
            <blockquote className="border-l-2 border-cyan pl-4 py-0.5 italic font-sans text-sm md:text-base text-white/90">
              &ldquo;{member.quote}&rdquo;
            </blockquote>
          )}

          {/* Bio */}
          {sf.bio !== false && member.bio && (
            <div className="space-y-1.5">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-white/50">
                About
              </h3>
              <p className="text-sm font-sans text-white/80 leading-relaxed whitespace-pre-line">
                {member.bio}
              </p>
            </div>
          )}

          {/* Skills */}
          {sf.skills !== false && Array.isArray(member.skills) && member.skills.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-white/50">
                Skills &amp; Domains
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {member.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-mono text-white/80"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          {sf.achievements !== false &&
            Array.isArray(member.achievements) &&
            member.achievements.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-white/50 flex items-center gap-1">
                  <Award size={11} className="text-yellow" /> Key Highlights
                </h3>
                <ul className="space-y-1.5">
                  {member.achievements.map((ach, i) => (
                    <li
                      key={i}
                      className="text-xs font-mono text-white/75 flex items-start gap-2 leading-relaxed"
                    >
                      <span className="text-cyan mt-0.5">✦</span>
                      <span>{ach}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Fun Fact Card */}
          {sf.fun_fact !== false && member.fun_fact && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs font-mono text-white/80 flex items-start gap-2.5">
              <Sparkles size={14} className="text-yellow mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-yellow block text-[10px] uppercase tracking-wider mb-0.5">
                  Fun Fact
                </span>
                <span>{member.fun_fact}</span>
              </div>
            </div>
          )}

          {/* Joined Date */}
          {sf.joined_date !== false && member.joined_date && (
            <div className="font-mono text-[11px] text-muted-foreground pt-1">
              Member since:{" "}
              <span className="text-white">
                {new Date(member.joined_date).toLocaleDateString("en-IN", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          )}

          {/* Socials Row */}
          {sf.socials !== false && (
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-2">
              {member.social_linkedin && (
                <a
                  href={member.social_linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-charcoal border border-border hover:border-cyan text-white/70 hover:text-cyan transition-colors"
                  title="LinkedIn"
                >
                  <Linkedin size={16} />
                </a>
              )}
              {member.social_github && (
                <a
                  href={member.social_github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-charcoal border border-border hover:border-cyan text-white/70 hover:text-white transition-colors"
                  title="GitHub"
                >
                  <Github size={16} />
                </a>
              )}
              {member.social_instagram && (
                <a
                  href={member.social_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-charcoal border border-border hover:border-pink text-white/70 hover:text-pink transition-colors"
                  title="Instagram"
                >
                  <Instagram size={16} />
                </a>
              )}
              {member.social_x && (
                <a
                  href={member.social_x}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-charcoal border border-border hover:border-cyan text-white/70 hover:text-white transition-colors"
                  title="X (Twitter)"
                >
                  <Twitter size={16} />
                </a>
              )}
              {member.social_email && (
                <a
                  href={`mailto:${member.social_email}`}
                  className="p-2 rounded-lg bg-charcoal border border-border hover:border-yellow text-white/70 hover:text-yellow transition-colors"
                  title="Email"
                >
                  <Mail size={16} />
                </a>
              )}
              {member.social_portfolio && (
                <a
                  href={member.social_portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-charcoal border border-border hover:border-cyan text-white/70 hover:text-cyan transition-colors"
                  title="Portfolio"
                >
                  <Globe size={16} />
                </a>
              )}
              {member.social_custom_url && (
                <a
                  href={member.social_custom_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-charcoal border border-border hover:border-cyan text-xs font-mono text-white/70 hover:text-cyan transition-colors"
                >
                  <span>{member.social_custom_label || "Link"}</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Panel ───────────────────────────────────────────────────
// Lazy-loaded 3D ID Card modal popup
const LazyPanelCardPopup = lazy(() => import("@/components/panel3d/PanelCardPopup"));

const TOP_FACULTY: DbMember[] = [
  {
    id: "faculty-anurag",
    name: "Anurag Tiwari",
    role: "Faculty Coordinator",
    accent: "pink",
    portrait_url: null,
    sort_order: -2,
  },
  {
    id: "faculty-arindum",
    name: "Arindum Dutta",
    role: "Faculty Co-coordinator",
    accent: "cyan",
    portrait_url: null,
    sort_order: -1,
  },
];

const TECHNICAL_TEAM_DEFAULT: DbMember = {
  id: "tech-team",
  name: "Technical Team",
  role: "Technical Team",
  accent: "yellow",
  portrait_url: null,
  sort_order: 10,
  subMembers: [
    {
      id: "tech-lead-krrish",
      name: "Krrish Kumar",
      role: "Technical Lead",
      accent: "yellow",
      portrait_url: null,
      sort_order: 10,
    },
    {
      id: "tech-colead-pranjal",
      name: "Pranjal Tiwari",
      role: "Technical Co-Lead",
      accent: "cyan",
      portrait_url: null,
      sort_order: 11,
    },
  ],
};

const EVENTS_TEAM_DEFAULT: DbMember = {
  id: "events-team",
  name: "Event Management Team",
  role: "Event Management Team",
  accent: "pink",
  portrait_url: null,
  sort_order: 12,
  subMembers: [
    {
      id: "event-lead-nishchay",
      name: "Nishchay",
      role: "Event Management Lead",
      accent: "pink",
      portrait_url: null,
      sort_order: 12,
    },
    {
      id: "event-colead-nishitha",
      name: "Nishitha",
      role: "Event Management Co-Lead",
      accent: "cyan",
      portrait_url: null,
      sort_order: 13,
    },
  ],
};

const SOCIAL_TEAM_DEFAULT: DbMember = {
  id: "social-team",
  name: "Social Media Team",
  role: "Social Media Team",
  accent: "yellow",
  portrait_url: null,
  sort_order: 14,
  subMembers: [
    {
      id: "social-lead-parth",
      name: "Parth",
      role: "Social Media Lead",
      accent: "yellow",
      portrait_url: null,
      sort_order: 14,
    },
    {
      id: "social-colead-divyam",
      name: "Divyam",
      role: "Social Media Co-Lead",
      accent: "pink",
      portrait_url: null,
      sort_order: 15,
    },
  ],
};

const DESIGN_TEAM_DEFAULT: DbMember = {
  id: "design-team",
  name: "Design Team",
  role: "Design Team",
  accent: "pink",
  portrait_url: null,
  sort_order: 16,
  subMembers: [
    {
      id: "design-lead-ayush",
      name: "Ayush",
      role: "Design Lead",
      accent: "pink",
      portrait_url: null,
      sort_order: 16,
    },
    {
      id: "design-colead-pranjal",
      name: "Pranjal",
      role: "Design Co-Lead",
      accent: "cyan",
      portrait_url: null,
      sort_order: 17,
    },
  ],
};

const FINANCE_TEAM_DEFAULT: DbMember = {
  id: "finance-team",
  name: "Finance Team",
  role: "Finance Team",
  accent: "yellow",
  portrait_url: null,
  sort_order: 18,
  subMembers: [
    {
      id: "finance-lead-tejas",
      name: "Tejas",
      role: "Finance Lead",
      accent: "yellow",
      portrait_url: null,
      sort_order: 18,
    },
    {
      id: "finance-colead-lakshya",
      name: "Lakshya",
      role: "Finance Co-Lead",
      accent: "cyan",
      portrait_url: null,
      sort_order: 19,
    },
  ],
};

const OUTREACH_TEAM_DEFAULT: DbMember = {
  id: "outreach-team",
  name: "Outreach Team",
  role: "Outreach Team",
  accent: "cyan",
  portrait_url: null,
  sort_order: 20,
  subMembers: [
    {
      id: "outreach-lead-athrav",
      name: "Athrav",
      role: "Outreach Lead",
      accent: "cyan",
      portrait_url: null,
      sort_order: 20,
    },
  ],
};

const CULTURAL_TEAM_DEFAULT: DbMember = {
  id: "cultural-team",
  name: "Cultural Team",
  role: "Cultural Team",
  accent: "pink",
  portrait_url: null,
  sort_order: 22,
  subMembers: [
    {
      id: "cultural-lead-mousam",
      name: "Mousam",
      role: "Cultural Lead",
      accent: "pink",
      portrait_url: null,
      sort_order: 22,
    },
    {
      id: "cultural-colead-malhar",
      name: "Malhar",
      role: "Cultural Co-Lead",
      accent: "yellow",
      portrait_url: null,
      sort_order: 23,
    },
    {
      id: "cultural-colead-tanisha",
      name: "Tanisha",
      role: "Cultural Co-Lead",
      accent: "cyan",
      portrait_url: null,
      sort_order: 24,
    },
  ],
};

const DECOR_TEAM_DEFAULT: DbMember = {
  id: "decor-team",
  name: "Decor Team",
  role: "Decor Team",
  accent: "yellow",
  portrait_url: null,
  sort_order: 25,
  subMembers: [
    {
      id: "decor-lead-samyak",
      name: "Samyak",
      role: "Decor Lead",
      accent: "yellow",
      portrait_url: null,
      sort_order: 25,
    },
  ],
};

const PHOTOGRAPHY_TEAM_DEFAULT: DbMember = {
  id: "photography-team",
  name: "Photography Team",
  role: "Photography Team",
  accent: "pink",
  portrait_url: null,
  sort_order: 26,
  subMembers: [
    {
      id: "photography-lead-aairah",
      name: "Aairah",
      role: "Photography Lead",
      accent: "pink",
      portrait_url: null,
      sort_order: 26,
    },
  ],
};

function processPanelMembers(list: DbMember[]): DbMember[] {
  let anurag = list.find((m) => m.name.toLowerCase().includes("anurag tiwari"));
  if (!anurag) {
    anurag = TOP_FACULTY[0];
  } else {
    anurag = { ...anurag, role: "Faculty Coordinator" };
  }

  let arindum = list.find((m) => m.name.toLowerCase().includes("arindum dutta"));
  if (!arindum) {
    arindum = TOP_FACULTY[1];
  } else {
    arindum = { ...arindum, role: "Faculty Co-coordinator" };
  }

  // Technical Team
  const krrishInDb = list.find((m) => m.name.toLowerCase().includes("krrish"));
  const pranjalInDb = list.find(
    (m) =>
      m.name.toLowerCase().includes("pranjal") &&
      (m.role.toLowerCase().includes("tech") || m.name.toLowerCase().includes("tiwari"))
  );
  const techHeadInDb = list.find(
    (m) =>
      m.role.toLowerCase().includes("technical") ||
      m.name.toLowerCase().includes("technical")
  );

  const krrishMember: DbMember = {
    ...(krrishInDb || TECHNICAL_TEAM_DEFAULT.subMembers![0]),
    name: "Krrish Kumar",
    role: "Technical Lead",
    accent: krrishInDb?.accent || "yellow",
  };

  const pranjalMember: DbMember = {
    ...(pranjalInDb || TECHNICAL_TEAM_DEFAULT.subMembers![1]),
    name: "Pranjal Tiwari",
    role: "Technical Co-Lead",
    accent: pranjalInDb?.accent || "cyan",
  };

  const extraTechMembers = list.filter(
    (m) =>
      m.department?.toLowerCase() === "technical team" &&
      !m.name.toLowerCase().includes("krrish") &&
      !m.name.toLowerCase().includes("pranjal")
  );

  const techTeamCard: DbMember = {
    id: techHeadInDb?.id || "tech-team",
    name: "Technical Team",
    role: "Technical Team",
    accent: "yellow",
    portrait_url: techHeadInDb?.portrait_url || krrishMember.portrait_url || pranjalMember.portrait_url || null,
    sort_order: techHeadInDb?.sort_order ?? 10,
    subMembers: [krrishMember, pranjalMember, ...extraTechMembers],
  };

  // Event Management Team
  const nishchayInDb = list.find((m) => m.name.toLowerCase().includes("nishchay"));
  const nishithaInDb = list.find((m) => m.name.toLowerCase().includes("nishitha"));
  const eventHeadInDb = list.find(
    (m) =>
      m.role.toLowerCase().includes("event") ||
      m.name.toLowerCase().includes("event")
  );

  const nishchayMember: DbMember = {
    ...(nishchayInDb || EVENTS_TEAM_DEFAULT.subMembers![0]),
    name: "Nishchay",
    role: "Event Management Lead",
    accent: nishchayInDb?.accent || "pink",
  };

  const nishithaMember: DbMember = {
    ...(nishithaInDb || EVENTS_TEAM_DEFAULT.subMembers![1]),
    name: "Nishitha",
    role: "Event Management Co-Lead",
    accent: nishithaInDb?.accent || "cyan",
  };

  const extraEventMembers = list.filter(
    (m) =>
      m.department?.toLowerCase() === "event management team" &&
      !m.name.toLowerCase().includes("nishchay") &&
      !m.name.toLowerCase().includes("nishitha")
  );

  const eventsTeamCard: DbMember = {
    id: eventHeadInDb?.id || "events-team",
    name: "Event Management Team",
    role: "Event Management Team",
    accent: "pink",
    portrait_url: eventHeadInDb?.portrait_url || nishchayMember.portrait_url || nishithaMember.portrait_url || null,
    sort_order: eventHeadInDb?.sort_order ?? 12,
    subMembers: [nishchayMember, nishithaMember, ...extraEventMembers],
  };

  // Social Media Team
  const parthInDb = list.find((m) => m.name.toLowerCase().includes("parth"));
  const divyamInDb = list.find((m) => m.name.toLowerCase().includes("divyam"));
  const socialHeadInDb = list.find(
    (m) =>
      m.role.toLowerCase().includes("social") ||
      m.name.toLowerCase().includes("social")
  );

  const parthMember: DbMember = {
    ...(parthInDb || SOCIAL_TEAM_DEFAULT.subMembers![0]),
    name: "Parth",
    role: "Social Media Lead",
    accent: parthInDb?.accent || "yellow",
  };

  const divyamMember: DbMember = {
    ...(divyamInDb || SOCIAL_TEAM_DEFAULT.subMembers![1]),
    name: "Divyam",
    role: "Social Media Co-Lead",
    accent: divyamInDb?.accent || "pink",
  };

  const extraSocialMembers = list.filter(
    (m) =>
      m.department?.toLowerCase() === "social media team" &&
      !m.name.toLowerCase().includes("parth") &&
      !m.name.toLowerCase().includes("divyam")
  );

  const socialTeamCard: DbMember = {
    id: socialHeadInDb?.id || "social-team",
    name: "Social Media Team",
    role: "Social Media Team",
    accent: "yellow",
    portrait_url: socialHeadInDb?.portrait_url || parthMember.portrait_url || divyamMember.portrait_url || null,
    sort_order: socialHeadInDb?.sort_order ?? 14,
    subMembers: [parthMember, divyamMember, ...extraSocialMembers],
  };

  // Design Team
  const ayushInDb = list.find((m) => m.name.toLowerCase().includes("ayush"));
  const designPranjalInDb = list.find(
    (m) =>
      m.name.toLowerCase().includes("pranjal") &&
      (m.role.toLowerCase().includes("design") || m.role.toLowerCase().includes("creative"))
  );
  const designHeadInDb = list.find(
    (m) =>
      m.role.toLowerCase().includes("design") ||
      m.name.toLowerCase().includes("design") ||
      m.role.toLowerCase().includes("creative")
  );

  const ayushMember: DbMember = {
    ...(ayushInDb || DESIGN_TEAM_DEFAULT.subMembers![0]),
    name: "Ayush",
    role: "Design Lead",
    accent: ayushInDb?.accent || "pink",
  };

  const pranjalDesignMember: DbMember = {
    ...(designPranjalInDb || DESIGN_TEAM_DEFAULT.subMembers![1]),
    name: "Pranjal",
    role: "Design Co-Lead",
    accent: designPranjalInDb?.accent || "cyan",
  };

  const extraDesignMembers = list.filter(
    (m) =>
      m.department?.toLowerCase() === "design team" &&
      !m.name.toLowerCase().includes("ayush") &&
      !m.name.toLowerCase().includes("pranjal")
  );

  const designTeamCard: DbMember = {
    id: designHeadInDb?.id || "design-team",
    name: "Design Team",
    role: "Design Team",
    accent: "pink",
    portrait_url: designHeadInDb?.portrait_url || ayushMember.portrait_url || pranjalDesignMember.portrait_url || null,
    sort_order: designHeadInDb?.sort_order ?? 16,
    subMembers: [ayushMember, pranjalDesignMember, ...extraDesignMembers],
  };

  // Finance Team
  const tejasInDb = list.find((m) => m.name.toLowerCase().includes("tejas"));
  const lakshyaInDb = list.find((m) => m.name.toLowerCase().includes("lakshya"));
  const financeHeadInDb = list.find(
    (m) =>
      m.role.toLowerCase().includes("finance") ||
      m.name.toLowerCase().includes("finance")
  );

  const tejasMember: DbMember = {
    ...(tejasInDb || FINANCE_TEAM_DEFAULT.subMembers![0]),
    name: "Tejas",
    role: "Finance Lead",
    accent: tejasInDb?.accent || "yellow",
  };

  const lakshyaMember: DbMember = {
    ...(lakshyaInDb || FINANCE_TEAM_DEFAULT.subMembers![1]),
    name: "Lakshya",
    role: "Finance Co-Lead",
    accent: lakshyaInDb?.accent || "cyan",
  };

  const extraFinanceMembers = list.filter(
    (m) =>
      m.department?.toLowerCase() === "finance team" &&
      !m.name.toLowerCase().includes("tejas") &&
      !m.name.toLowerCase().includes("lakshya")
  );

  const financeTeamCard: DbMember = {
    id: financeHeadInDb?.id || "finance-team",
    name: "Finance Team",
    role: "Finance Team",
    accent: "yellow",
    portrait_url: financeHeadInDb?.portrait_url || tejasMember.portrait_url || lakshyaMember.portrait_url || null,
    sort_order: financeHeadInDb?.sort_order ?? 18,
    subMembers: [tejasMember, lakshyaMember, ...extraFinanceMembers],
  };

  // Outreach Team
  const athravInDb = list.find(
    (m) =>
      m.name.toLowerCase().includes("athrav") ||
      m.name.toLowerCase().includes("atharv")
  );
  const outreachHeadInDb = list.find(
    (m) =>
      m.role.toLowerCase().includes("outreach") ||
      m.name.toLowerCase().includes("outreach")
  );

  const athravMember: DbMember = {
    ...(athravInDb || OUTREACH_TEAM_DEFAULT.subMembers![0]),
    name: "Athrav",
    role: "Outreach Lead",
    accent: athravInDb?.accent || "cyan",
  };

  const extraOutreachMembers = list.filter(
    (m) =>
      m.department?.toLowerCase() === "outreach team" &&
      !m.name.toLowerCase().includes("athrav") &&
      !m.name.toLowerCase().includes("atharv")
  );

  const outreachTeamCard: DbMember = {
    id: outreachHeadInDb?.id || "outreach-team",
    name: "Outreach Team",
    role: "Outreach Team",
    accent: "cyan",
    portrait_url: outreachHeadInDb?.portrait_url || athravMember.portrait_url || null,
    sort_order: outreachHeadInDb?.sort_order ?? 20,
    subMembers: [athravMember, ...extraOutreachMembers],
  };

  // Cultural Team
  const mousamInDb = list.find((m) => m.name.toLowerCase().includes("mousam"));
  const malharInDb = list.find((m) => m.name.toLowerCase().includes("malhar"));
  const tanishaInDb = list.find((m) => m.name.toLowerCase().includes("tanisha"));
  const culturalHeadInDb = list.find(
    (m) =>
      m.role.toLowerCase().includes("cultural") ||
      m.name.toLowerCase().includes("cultural")
  );

  const mousamMember: DbMember = {
    ...(mousamInDb || CULTURAL_TEAM_DEFAULT.subMembers![0]),
    name: "Mousam",
    role: "Cultural Lead",
    accent: mousamInDb?.accent || "pink",
  };

  const malharMember: DbMember = {
    ...(malharInDb || CULTURAL_TEAM_DEFAULT.subMembers![1]),
    name: "Malhar",
    role: "Cultural Co-Lead",
    accent: malharInDb?.accent || "yellow",
  };

  const tanishaMember: DbMember = {
    ...(tanishaInDb || CULTURAL_TEAM_DEFAULT.subMembers![2]),
    name: "Tanisha",
    role: "Cultural Co-Lead",
    accent: tanishaInDb?.accent || "cyan",
  };

  const extraCulturalMembers = list.filter(
    (m) =>
      m.department?.toLowerCase() === "cultural team" &&
      !m.name.toLowerCase().includes("mousam") &&
      !m.name.toLowerCase().includes("malhar") &&
      !m.name.toLowerCase().includes("tanisha")
  );

  const culturalTeamCard: DbMember = {
    id: culturalHeadInDb?.id || "cultural-team",
    name: "Cultural Team",
    role: "Cultural Team",
    accent: "pink",
    portrait_url:
      culturalHeadInDb?.portrait_url ||
      mousamMember.portrait_url ||
      malharMember.portrait_url ||
      tanishaMember.portrait_url ||
      null,
    sort_order: culturalHeadInDb?.sort_order ?? 22,
    subMembers: [mousamMember, malharMember, tanishaMember, ...extraCulturalMembers],
  };

  // Decor Team
  const samyakInDb = list.find((m) => m.name.toLowerCase().includes("samyak"));
  const decorHeadInDb = list.find(
    (m) =>
      m.role.toLowerCase().includes("decor") ||
      m.name.toLowerCase().includes("decor")
  );

  const samyakMember: DbMember = {
    ...(samyakInDb || DECOR_TEAM_DEFAULT.subMembers![0]),
    name: "Samyak",
    role: "Decor Lead",
    accent: samyakInDb?.accent || "yellow",
  };

  const extraDecorMembers = list.filter(
    (m) =>
      m.department?.toLowerCase() === "decor team" &&
      !m.name.toLowerCase().includes("samyak")
  );

  const decorTeamCard: DbMember = {
    id: decorHeadInDb?.id || "decor-team",
    name: "Decor Team",
    role: "Decor Team",
    accent: "yellow",
    portrait_url: decorHeadInDb?.portrait_url || samyakMember.portrait_url || null,
    sort_order: decorHeadInDb?.sort_order ?? 25,
    subMembers: [samyakMember, ...extraDecorMembers],
  };

  // Photography Team
  const aairahInDb = list.find((m) => m.name.toLowerCase().includes("aairah"));
  const photoHeadInDb = list.find(
    (m) =>
      m.role.toLowerCase().includes("photo") ||
      m.name.toLowerCase().includes("photo")
  );

  const aairahMember: DbMember = {
    ...(aairahInDb || PHOTOGRAPHY_TEAM_DEFAULT.subMembers![0]),
    name: "Aairah",
    role: "Photography Lead",
    accent: aairahInDb?.accent || "pink",
  };

  const extraPhotoMembers = list.filter(
    (m) =>
      m.department?.toLowerCase() === "photography team" &&
      !m.name.toLowerCase().includes("aairah")
  );

  const photoTeamCard: DbMember = {
    id: photoHeadInDb?.id || "photography-team",
    name: "Photography Team",
    role: "Photography Team",
    accent: "pink",
    portrait_url: photoHeadInDb?.portrait_url || aairahMember.portrait_url || null,
    sort_order: photoHeadInDb?.sort_order ?? 26,
    subMembers: [aairahMember, ...extraPhotoMembers],
  };

  const aairahMember: DbMember = {
    ...(aairahInDb || PHOTOGRAPHY_TEAM_DEFAULT.subMembers![0]),
    name: "Aairah",
    role: "Photography Lead",
    accent: aairahInDb?.accent || "pink",
  };

  const photoTeamCard: DbMember = {
    id: photoHeadInDb?.id || "photography-team",
    name: "Photography Team",
    role: "Photography Team",
    accent: "pink",
    portrait_url: photoHeadInDb?.portrait_url || aairahMember.portrait_url || null,
    sort_order: photoHeadInDb?.sort_order ?? 26,
    subMembers: [aairahMember],
  };

  const others = list.filter(
    (m) =>
      !m.name.toLowerCase().includes("anurag tiwari") &&
      !m.name.toLowerCase().includes("arindum dutta") &&
      !m.name.toLowerCase().includes("krrish") &&
      !m.role.toLowerCase().includes("technical") &&
      !m.name.toLowerCase().includes("technical") &&
      !m.name.toLowerCase().includes("nishchay") &&
      !m.name.toLowerCase().includes("nishitha") &&
      !m.role.toLowerCase().includes("event") &&
      !m.name.toLowerCase().includes("event") &&
      !m.name.toLowerCase().includes("parth") &&
      !m.name.toLowerCase().includes("divyam") &&
      !m.role.toLowerCase().includes("social") &&
      !m.name.toLowerCase().includes("social") &&
      !m.name.toLowerCase().includes("ayush") &&
      !m.role.toLowerCase().includes("design") &&
      !m.name.toLowerCase().includes("design") &&
      !m.role.toLowerCase().includes("creative") &&
      !m.name.toLowerCase().includes("tejas") &&
      !m.name.toLowerCase().includes("lakshya") &&
      !m.role.toLowerCase().includes("finance") &&
      !m.name.toLowerCase().includes("finance") &&
      !m.name.toLowerCase().includes("athrav") &&
      !m.name.toLowerCase().includes("atharv") &&
      !m.role.toLowerCase().includes("outreach") &&
      !m.name.toLowerCase().includes("outreach") &&
      !m.name.toLowerCase().includes("mousam") &&
      !m.name.toLowerCase().includes("malhar") &&
      !m.name.toLowerCase().includes("tanisha") &&
      !m.role.toLowerCase().includes("cultural") &&
      !m.name.toLowerCase().includes("cultural") &&
      !m.name.toLowerCase().includes("samyak") &&
      !m.role.toLowerCase().includes("decor") &&
      !m.name.toLowerCase().includes("decor") &&
      !m.name.toLowerCase().includes("aairah") &&
      !m.role.toLowerCase().includes("photo") &&
      !m.name.toLowerCase().includes("photo") &&
      !m.name.toLowerCase().includes("member name") &&
      !m.role.toLowerCase().includes("media lead")
  );

  return [
    anurag,
    arindum,
    ...others,
    techTeamCard,
    eventsTeamCard,
    socialTeamCard,
    designTeamCard,
    financeTeamCard,
    outreachTeamCard,
    culturalTeamCard,
    decorTeamCard,
    photoTeamCard,
  ];
}

export function Panel() {
  const [members, setMembers] = useState<DbMember[]>(() =>
    processPanelMembers([])
  );
  const [popupMember, setPopupMember] = useState<DbMember | null>(null);
  const [card3dCfg, setCard3dCfg] = useState<CardConfig>(DEFAULT_CARD_CONFIG);
  const sectionRef = useRef<HTMLElement>(null);
  const settings = useSettings(["panel_label", "panel_heading"]);
  const config = useSiteConfig();

  // Load members
  useEffect(() => {
    supabase
      .from("panel_members")
      .select("*")
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          const visible = (data as DbMember[]).filter((m) => !m.hidden);
          setMembers(processPanelMembers(visible));
        } else {
          setMembers(processPanelMembers([]));
        }
      });
  }, []);

  // Read panel.card3d config from site_config
  useEffect(() => {
    const raw = (config as Record<string, unknown>)["panel.card3d"];
    if (raw && typeof raw === "object") {
      setCard3dCfg({ ...DEFAULT_CARD_CONFIG, ...(raw as Partial<CardConfig>) });
    }
  }, [config]);

  const label = settings["panel_label"] || "Meet the Panel";
  const heading = settings["panel_heading"] || "The people behind the noise.";

  return (
    <>
      <section id="panel" ref={sectionRef} className="overflow-x-clip px-5 py-16 scroll-mt-16 sm:py-24 md:px-16 md:py-40">
        <SectionTag n="04" label={label} />
        <SplitHeading text={heading} className="mb-10 max-w-5xl font-display text-3xl sm:text-5xl font-black uppercase leading-[0.95] md:mb-16 md:text-8xl break-words" />

        {/* Visually hidden member list for SEO / accessibility */}
        <ul className="sr-only" aria-label="Panel members">
          {members.map((m) => (
            <li key={m.id}>
              {m.name} — {m.role}
            </li>
          ))}
        </ul>

        {/* ── 2D Staggered Photo Grid ── */}
        <div className="grid grid-cols-2 gap-x-3.5 gap-y-8 sm:gap-x-4 sm:gap-y-12 md:grid-cols-3 md:gap-x-8">
          {members.map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 0.1} className={i % 3 === 1 ? "md:mt-24" : ""}>
              <figure
                role="button"
                tabIndex={0}
                onClick={() => {
                  setPopupMember(p);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setPopupMember(p);
                  }
                }}
                className="group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan rounded-xl"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl border transition-all duration-500 group-hover:-rotate-2 group-hover:border-foreground">
                  {p.portrait_url ? (
                    <img
                      src={p.portrait_url}
                      alt={p.name}
                      style={{ objectPosition: p.focal_point || "50% 50%" }}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="placeholder-tile absolute inset-0 flex items-start p-4">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Portrait placeholder</span>
                    </div>
                  )}
                  <div className={`absolute inset-x-0 bottom-0 h-1/2 translate-y-full opacity-50 blur-2xl transition-transform duration-700 group-hover:translate-y-0 ${accentBg[p.accent]}`} />
                  <span className="absolute bottom-2 right-4 font-display text-7xl font-black text-foreground/10">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <figcaption className="mt-3 sm:mt-4 min-w-0">
                  <p className={`truncate font-mono text-[10px] uppercase tracking-widest sm:text-xs ${accentText[p.accent]}`}>{p.role}</p>
                  <p className="font-display text-base font-black uppercase leading-tight sm:text-xl md:text-2xl group-hover:text-cyan transition-colors">{p.name}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 3D ID Card Modal Popup */}
      <AnimatePresence>
        {popupMember && (
          <Suspense fallback={null}>
            <LazyPanelCardPopup
              member={popupMember as unknown as import("@/components/panel3d/PanelCardPopup").PopupMember}
              cfg={card3dCfg}
              onClose={() => setPopupMember(null)}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </>
  );
}
