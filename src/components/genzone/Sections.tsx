import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useMemo, useRef, useState, useCallback, lazy, Suspense } from "react";
import { DEFAULT_CARD_CONFIG } from "@/components/panel3d/cardDefaults";
import type { CardConfig } from "@/components/panel3d/cardDefaults";
import { GalleryShowcase, type GalleryAlbum, type GalleryPhoto } from "@/components/gallery/GalleryShowcase";
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

  const displayStats: Array<[string, string, string]> = stats.length > 0
    ? stats.map((s) => [s.value, s.label, `text-${s.accent}`])
    : [["00+", "Members", "text-cyan"], ["00+", "Events", "text-pink"], ["00", "Domains", "text-yellow"]];

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
          <Reveal delay={0.2} className="grid grid-cols-3 gap-4 border-t pt-4">
            {displayStats.map(([n, l, c]) => (
              <div key={l}>
                <div className={`font-display text-3xl font-black md:text-4xl ${c}`}>{n}</div>
                <div className="font-mono text-xs uppercase tracking-widest">{l}</div>
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
        <section id="about" ref={ref} className="relative overflow-hidden px-5 py-28 md:px-16 md:py-40">
          <SectionTag n="01" label={label} />
          <motion.p style={{ x }} className="pointer-events-none whitespace-nowrap font-display text-[22vw] font-black leading-none text-foreground/5" aria-hidden>
            {watermark}
          </motion.p>
          <div className="-mt-[10vw] grid gap-12 md:grid-cols-2">
            <SplitHeading text={heading} className="font-display text-4xl font-black uppercase leading-[0.95] md:text-7xl" />
            <div className="space-y-6 self-end text-lg text-muted-foreground md:text-xl">
              <Reveal>
                <p>{paragraph}</p>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="text-foreground">{story}</p>
              </Reveal>
              <Reveal delay={0.2} className="grid grid-cols-3 gap-4 pt-6">
                {displayStats.map(([n, l, c]) => (
                  <div key={l} className="border-t pt-4">
                    <div className={`font-display text-3xl font-black md:text-4xl ${c}`}>{n}</div>
                    <div className="font-mono text-xs uppercase tracking-widest">{l}</div>
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
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
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

        {/* Header / Banner */}
        <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-charcoal">
          {event.image_url ? (
            <>
              <img
                src={event.image_url}
                alt={event.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            </>
          ) : (
            <>
              <div className="placeholder-tile absolute inset-0" />
              <div
                className={`absolute -right-16 -top-16 h-64 w-64 rounded-full blur-3xl opacity-60 ${accentBg[event.accent]}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            </>
          )}

          <div className="absolute bottom-4 left-4 right-4 z-10 space-y-2">
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
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">

          {/* Quick Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-charcoal border border-border/80 rounded-xl p-3 flex items-start gap-2.5">
              <CalendarIcon size={16} className={`mt-0.5 shrink-0 ${accentText[event.accent]}`} />
              <div className="min-w-0">
                <span className="block font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  Date
                </span>
                <span className="font-mono text-xs text-white truncate block">
                  {event.event_date
                    ? new Date(event.event_date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Date TBA"}
                </span>
              </div>
            </div>

            <div className="bg-charcoal border border-border/80 rounded-xl p-3 flex items-start gap-2.5">
              <MapPin size={16} className={`mt-0.5 shrink-0 ${accentText[event.accent]}`} />
              <div className="min-w-0">
                <span className="block font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  Venue
                </span>
                <span className="font-mono text-xs text-white truncate block">
                  {event.venue || "Campus / Online"}
                </span>
              </div>
            </div>

            <div className="bg-charcoal border border-border/80 rounded-xl p-3 flex items-start gap-2.5">
              <Ticket size={16} className={`mt-0.5 shrink-0 ${accentText[event.accent]}`} />
              <div className="min-w-0">
                <span className="block font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  Fee
                </span>
                <span className="font-mono text-xs text-white truncate block">
                  {event.entry_fee || "Free Entry"}
                </span>
              </div>
            </div>

            {event.eligibility && (
              <div className="bg-charcoal border border-border/80 rounded-xl p-3 flex items-start gap-2.5">
                <Award size={16} className={`mt-0.5 shrink-0 ${accentText[event.accent]}`} />
                <div className="min-w-0">
                  <span className="block font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    Eligibility
                  </span>
                  <span className="font-mono text-xs text-white truncate block">
                    {event.eligibility}
                  </span>
                </div>
              </div>
            )}

            {event.dress_code && (
              <div className="bg-charcoal border border-border/80 rounded-xl p-3 flex items-start gap-2.5">
                <Shirt size={16} className={`mt-0.5 shrink-0 ${accentText[event.accent]}`} />
                <div className="min-w-0">
                  <span className="block font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    Dress Code
                  </span>
                  <span className="font-mono text-xs text-white truncate block">
                    {event.dress_code}
                  </span>
                </div>
              </div>
            )}

            {event.seats_note && (
              <div className="bg-charcoal border border-border/80 rounded-xl p-3 flex items-start gap-2.5">
                <UsersIcon size={16} className={`mt-0.5 shrink-0 ${accentText[event.accent]}`} />
                <div className="min-w-0">
                  <span className="block font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    Seats
                  </span>
                  <span className="font-mono text-xs text-white truncate block">
                    {event.seats_note}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Highlights */}
          {Array.isArray(event.highlights) && event.highlights.length > 0 && (
            <div className="space-y-3">
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
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
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
          </div>

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

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-border bg-charcoal/90 backdrop-blur sticky bottom-0 z-20 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Calendar & Share Utilities */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {icsHref && (
              <a
                href={icsHref}
                download={`${event.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.ics`}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-border bg-background hover:border-cyan text-xs font-mono text-white/80 hover:text-white transition-colors"
                title="Add to Calendar (.ics)"
              >
                <CalendarIcon size={14} className="text-cyan" />
                <span className="hidden sm:inline">Add to Calendar</span>
                <span className="sm:hidden">Calendar</span>
              </a>
            )}

            <button
              onClick={handleShare}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-border bg-background hover:border-pink text-xs font-mono text-white/80 hover:text-white transition-colors"
              title="Share event link"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-cyan" />
                  <span className="text-cyan">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 size={14} className="text-pink" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>

          {/* Register CTA */}
          <div className="w-full sm:w-auto flex-1 sm:max-w-xs">
            {isRegistrationClosed ? (
              <button
                disabled
                className="w-full py-3 px-6 rounded-xl font-mono text-xs uppercase tracking-widest border border-white/10 bg-white/5 text-white/40 cursor-not-allowed text-center"
              >
                {buttonLabel}
              </button>
            ) : registerTargetUrl ? (
              <a
                href={registerTargetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-mono text-xs uppercase tracking-widest font-bold bg-cyan text-black hover:bg-cyan/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(0,255,255,0.3)] text-center"
              >
                {buttonLabel} <ExternalLink size={14} />
              </a>
            ) : (
              <button
                disabled
                className="w-full py-3 px-6 rounded-xl font-mono text-xs uppercase tracking-widest border border-cyan/30 bg-cyan/10 text-cyan/70 cursor-not-allowed text-center"
              >
                Registration Coming Soon
              </button>
            )}
          </div>
        </div>

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
    <section id="events" className="px-5 py-28 md:px-16 md:py-40">
      <SectionTag n="02" label={label} />
      <SplitHeading text={heading} className="mb-16 font-display text-5xl font-black uppercase md:text-8xl" />
      <p className="text-muted-foreground font-mono text-sm">No events yet — check back soon.</p>
    </section>
  );

  return (
    <>
      <section id="events" className="px-5 py-28 md:px-16 md:py-40">
        <SectionTag n="02" label={label} />
        <SplitHeading text={heading} className="mb-16 font-display text-5xl font-black uppercase md:text-8xl" />
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
  const heading = settings["gallery_heading"] || "Proof it happened.";

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
    <section id="gallery" className="bg-charcoal overflow-x-clip px-5 py-16 sm:py-24 md:px-16 md:py-40">
      <SectionTag n="03" label={label} />
      <div className="mb-8 flex flex-col justify-between gap-6 md:mb-12 md:flex-row md:items-end md:gap-8">
        <SplitHeading text={heading} className="font-display text-3xl sm:text-5xl font-black uppercase md:text-8xl break-words" />
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

export function Panel() {
  const [members, setMembers] = useState<DbMember[]>([]);
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
          setMembers(visible);
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
      <section id="panel" ref={sectionRef} className="px-5 py-28 md:px-16 md:py-40">
        <SectionTag n="04" label={label} />
        <SplitHeading text={heading} className="mb-16 max-w-5xl font-display text-5xl font-black uppercase leading-[0.95] md:text-8xl" />

        {/* Visually hidden member list for SEO / accessibility */}
        <ul className="sr-only" aria-label="Panel members">
          {members.map((m) => (
            <li key={m.id}>
              {m.name} — {m.role}
            </li>
          ))}
        </ul>

        {/* ── 2D Staggered Photo Grid ── */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-8">
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
                  <span className="absolute bottom-2 right-4 font-display text-7xl font-black text-foreground/10">0{i + 1}</span>
                </div>
                <figcaption className="mt-4">
                  <p className={`font-mono text-xs uppercase tracking-widest ${accentText[p.accent]}`}>{p.role}</p>
                  <p className="font-display text-xl font-black uppercase md:text-2xl group-hover:text-cyan transition-colors">{p.name}</p>
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
