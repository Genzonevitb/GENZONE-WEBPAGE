import { useState, type FormEvent } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { toast } from "sonner";
import { Globe } from "lucide-react";
import { contact as fallbackContact } from "@/content/genzone";
import { supabase } from "@/lib/supabase";
import { SectionTag, SplitHeading } from "./shared";
import { useSiteConfig } from "@/lib/config-context";

const DEFAULT_INSTAGRAM_URL = "https://www.instagram.com/genzone_vitb";

const kinds = ["Idea", "Feedback", "Collab", "Other"];
const field = "w-full min-w-0 border-0 border-b-2 bg-transparent py-3.5 text-base outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-cyan md:py-4 md:text-lg";

function detectSocialKind(label: string, url?: string | null): "instagram" | "linkedin" | "youtube" | "x" | "other" {
  const key = `${label} ${url ?? ""}`.trim().toLowerCase();
  if (key.includes("insta")) return "instagram";
  if (key.includes("linkedin")) return "linkedin";
  if (key.includes("youtube") || key.includes("youtu.be")) return "youtube";
  if (label.trim().toLowerCase() === "x" || key.includes("twitter") || key.includes("x.com")) return "x";
  return "other";
}

function SocialGlyph({ kind }: { kind: ReturnType<typeof detectSocialKind> }) {
  if (kind === "instagram") {
    return (
      <svg className="h-4 w-4 shrink-0 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.65)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    );
  }
  if (kind === "linkedin") {
    return (
      <svg className="h-4 w-4 shrink-0 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.65)]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.68 1.68 0 1 0 0-3.36 1.68 1.68 0 0 0 0 3.36M5.07 18.5h2.78v-8.37H5.07v8.37Z" />
      </svg>
    );
  }
  if (kind === "youtube") {
    return (
      <svg className="h-4 w-4 shrink-0 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.65)]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
      </svg>
    );
  }
  if (kind === "x") {
    return (
      <svg className="h-3.5 w-3.5 shrink-0 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.65)]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  return <Globe className="h-4 w-4 shrink-0 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.65)]" aria-hidden="true" />;
}

const SOCIAL_BADGE_THEME: Record<
  ReturnType<typeof detectSocialKind>,
  { badge: string; pillGlow: string }
> = {
  instagram: {
    badge:
      "bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] shadow-[inset_0_1px_1px_rgba(255,255,255,0.65),0_3px_0_#7a1046,0_0_18px_rgba(238,42,123,0.75)] group-hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_4px_0_#7a1046,0_0_28px_rgba(238,42,123,0.95)]",
    pillGlow:
      "border-pink/35 shadow-[0_6px_0_rgba(0,0,0,0.85),0_10px_28px_rgba(255,22,138,0.28),0_0_22px_rgba(238,42,123,0.2)] hover:border-pink/70 hover:shadow-[0_10px_0_rgba(0,0,0,0.85),0_14px_34px_rgba(255,22,138,0.42),0_0_32px_rgba(238,42,123,0.38)]",
  },
  linkedin: {
    badge:
      "bg-gradient-to-tr from-[#0077b5] to-[#00bfff] shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_3px_0_#004182,0_0_16px_rgba(0,191,255,0.6)] group-hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_4px_0_#004182,0_0_24px_rgba(0,191,255,0.9)]",
    pillGlow:
      "border-cyan/30 shadow-[0_6px_0_rgba(0,0,0,0.85),0_10px_24px_rgba(0,217,255,0.22)] hover:border-cyan/70 hover:shadow-[0_10px_0_rgba(0,0,0,0.85),0_14px_32px_rgba(0,217,255,0.38)]",
  },
  youtube: {
    badge:
      "bg-gradient-to-tr from-[#cc0000] to-[#ff4d4d] shadow-[inset_0_1px_1px_rgba(255,255,255,0.55),0_3px_0_#7f0000,0_0_16px_rgba(255,30,60,0.6)] group-hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_4px_0_#7f0000,0_0_24px_rgba(255,30,60,0.9)]",
    pillGlow:
      "border-red-500/30 shadow-[0_6px_0_rgba(0,0,0,0.85),0_10px_24px_rgba(255,30,60,0.22)] hover:border-red-400/70 hover:shadow-[0_10px_0_rgba(0,0,0,0.85),0_14px_32px_rgba(255,30,60,0.38)]",
  },
  x: {
    badge:
      "bg-gradient-to-tr from-zinc-800 to-zinc-600 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_3px_0_#09090b,0_0_14px_rgba(255,255,255,0.3)] group-hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_4px_0_#09090b,0_0_22px_rgba(255,255,255,0.5)]",
    pillGlow:
      "border-white/25 shadow-[0_6px_0_rgba(0,0,0,0.85),0_10px_24px_rgba(255,255,255,0.12)] hover:border-white/60 hover:shadow-[0_10px_0_rgba(0,0,0,0.85),0_14px_32px_rgba(255,255,255,0.22)]",
  },
  other: {
    badge:
      "bg-gradient-to-tr from-cyan/80 to-pink/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_3px_0_#164e63,0_0_16px_rgba(0,217,255,0.55)] group-hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_4px_0_#164e63,0_0_24px_rgba(0,217,255,0.85)]",
    pillGlow:
      "border-white/20 shadow-[0_6px_0_rgba(0,0,0,0.85),0_10px_24px_rgba(0,217,255,0.18)] hover:border-yellow/70 hover:shadow-[0_10px_0_rgba(0,0,0,0.85),0_14px_32px_rgba(0,217,255,0.3)]",
  },
};

function FooterSocialButton3D({
  label,
  url,
  color,
}: {
  label: string;
  url: string;
  color?: string | undefined;
}) {
  const reduce = useReducedMotion();
  const kind = detectSocialKind(label, url);
  const theme = SOCIAL_BADGE_THEME[kind];
  const displayLabel =
    !label.trim() || label.trim().toLowerCase() === "new link"
      ? kind === "instagram"
        ? "Instagram"
        : kind === "linkedin"
          ? "LinkedIn"
          : kind === "youtube"
            ? "YouTube"
            : kind === "x"
              ? "X"
              : "Link"
      : label;

  return (
    <div style={{ perspective: 650 }}>
      <motion.a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={displayLabel}
        whileHover={reduce ? undefined : { y: -4, rotateX: 12, rotateY: -6, scale: 1.04 }}
        whileTap={reduce ? undefined : { y: 1, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 320, damping: 18 }}
        className={`group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl border bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-black/65 py-2 pl-2.5 pr-4 text-sm font-medium backdrop-blur-md transition-shadow duration-300 ${theme.pillGlow}`}
        style={{
          color: color ? COLOR_MAP[color] ?? undefined : undefined,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Top specular glass rim */}
        <span
          className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
          aria-hidden="true"
        />

        {/* Hover sheen sweep */}
        {!reduce && (
          <span
            className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full"
            aria-hidden="true"
          />
        )}

        {/* 3D glowing icon tile */}
        <span
          className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:-translate-y-0.5 ${theme.badge}`}
          style={{ transform: "translateZ(14px)" }}
        >
          <SocialGlyph kind={kind} />
        </span>

        <span className="relative tracking-wide" style={{ transform: "translateZ(10px)" }}>
          {displayLabel}
        </span>
        <span
          aria-hidden="true"
          className="relative opacity-70 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
          style={{ transform: "translateZ(10px)" }}
        >
          ↗
        </span>
      </motion.a>
    </div>
  );
}

function normalizeFooterSocialUrl(label: string, raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "#") return null;
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) return null;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return lower.startsWith("https://") || lower.startsWith("http://") ? trimmed : null;
  }
  const clean = trimmed.replace(/^@+/, "").replace(/^\/+|\/+$/g, "");
  if (!clean) return null;
  const key = label.trim().toLowerCase();
  if (key.includes("insta")) return `https://instagram.com/${clean.replace(/^(www\.)?instagram\.com\//i, "")}`;
  if (key.includes("linkedin")) return `https://linkedin.com/${clean.startsWith("in/") || clean.includes("/") ? clean : `in/${clean}`}`;
  if (key.includes("youtube")) return `https://youtube.com/${clean.startsWith("@") ? clean : `@${clean}`}`;
  if (key === "x" || key.includes("twitter")) return `https://x.com/${clean.replace(/^(www\.)?(x|twitter)\.com\//i, "")}`;
  return `https://${clean}`;
}

export function Feedback() {
  const [kind, setKind] = useState("Idea");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const config = useSiteConfig();
  const sh = (config["section_headings"] as any) ?? {};
  const fbLabel = sh.feedback_label || (config["feedback_label"] as string) || "Suggestions & Feedback";
  const fbHeading = sh.feedback_heading || (config["feedback_heading"] as string) || "Got something loud to say?";
  const fbSubtitle = sh.feedback_subtitle || (config["feedback_subtitle"] as string) || "Ideas, rants, collabs — drop them here. The panel reads everything.";

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const message = String(fd.get("message") || "").trim();

    const errs: Record<string, string> = {};
    if (!name || name.length > 100) errs["name"] = "Tell us your name";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs["email"] = "That email looks off";
    if (message.length < 5 || message.length > 1000) errs["message"] = "Message should be 5–1000 characters";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("feedback").insert([{ kind, name, email: email || null, message }]);
      if (error) throw error;
      toast.success(`Thanks ${name}! Your ${kind.toLowerCase()} landed in the zone.`);
      e.currentTarget.reset();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="feedback" className="relative overflow-x-clip bg-charcoal px-5 py-16 scroll-mt-16 sm:py-24 md:px-16 md:py-40">
      <div className="pointer-events-none absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-pink/20 blur-[120px]" />
      <SectionTag n="05" label={fbLabel} />
      <div className="relative grid gap-10 md:grid-cols-2 md:gap-16">
        <div className="min-w-0">
          <SplitHeading text={fbHeading} className="font-display text-3xl sm:text-5xl font-black uppercase leading-[0.95] md:text-7xl break-words" />
          <p className="mt-4 max-w-sm text-base text-muted-foreground sm:mt-6 sm:text-lg">{fbSubtitle}</p>
        </div>
        <form onSubmit={submit} noValidate className="min-w-0 space-y-5 sm:space-y-6">
          <div className="flex flex-wrap gap-2">
            {kinds.map((k) => (
              <button type="button" key={k} onClick={() => setKind(k)} className={`rounded-full border px-3.5 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors sm:px-4 sm:py-2 ${kind === k ? "border-yellow bg-yellow text-background" : "hover:border-yellow"}`}>
                {k}
              </button>
            ))}
          </div>
          {[
            { n: "name", p: "Your name *", t: "text" },
            { n: "email", p: "Email (optional)", t: "email" },
          ].map((f) => (
            <div key={f.n}>
              <input name={f.n} type={f.t} placeholder={f.p} aria-label={f.p} maxLength={255} className={field} />
              {errors[f.n] && <p className="mt-1 text-sm text-pink">{errors[f.n]}</p>}
            </div>
          ))}
          <div>
            <textarea name="message" rows={4} placeholder="Your message *" aria-label="Your message" maxLength={1000} className={`${field} resize-none`} />
            {errors["message"] && <p className="mt-1 text-sm text-pink">{errors["message"]}</p>}
          </div>
          <button type="submit" disabled={submitting} className="group relative inline-flex w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-foreground px-8 py-4 font-display text-sm font-black uppercase text-background transition-transform hover:scale-105 disabled:opacity-60 sm:w-auto">
            <span className="absolute inset-0 -translate-x-full bg-neon transition-transform duration-500 group-hover:translate-x-0" />
            <span className="relative">{submitting ? "Sending…" : "Send it"}</span>
            <span className="relative transition-transform group-hover:translate-x-1">→</span>
          </button>
        </form>
      </div>
    </section>
  );
}

const COLOR_MAP: Record<string, string> = {
  cyan: '#00f0ff',
  pink: '#ff007f',
  yellow: '#ffe600',
  white: '#ffffff',
};

function FooterLogo3D({ src, alt }: { src: string; alt: string }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spotOpacity = useMotionValue(0);

  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [18, -18]), { stiffness: 180, damping: 16 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-20, 20]), { stiffness: 180, damping: 16 });
  const glareX = useTransform(mx, [-0.5, 0.5], [15, 85]);
  const glareY = useTransform(my, [-0.5, 0.5], [15, 85]);
  const glareBg = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.28) 0%, rgba(0,217,255,0.12) 35%, transparent 65%)`;

  const isCoarse = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduce || isCoarse) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
    spotOpacity.set(1);
  }

  function onPointerLeave() {
    mx.set(0);
    my.set(0);
    spotOpacity.set(0);
  }

  return (
    <motion.div
      className="group relative flex h-28 w-28 shrink-0 items-center justify-center sm:h-36 sm:w-36 md:h-44 md:w-44"
      style={{ perspective: 900 }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      animate={reduce ? undefined : { y: [0, -6, 0] }}
      transition={reduce ? undefined : { duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Ambient multi-color neon glow halo */}
      <div
        className="pointer-events-none absolute -inset-3 rounded-full bg-gradient-to-tr from-cyan/45 via-pink/40 to-yellow/30 opacity-75 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />

      {/* 3D tilting medallion stage */}
      <motion.div
        style={{
          rotateX: reduce ? 0 : rotateX,
          rotateY: reduce ? 0 : rotateY,
          transformStyle: "preserve-3d",
        }}
        animate={reduce ? undefined : { rotateY: [-6, 6, -6], rotateX: [3, -3, 3] }}
        transition={reduce ? undefined : { duration: 7, repeat: Infinity, ease: "easeInOut" }}
        whileHover={reduce || isCoarse ? undefined : { scale: 1.07 }}
        className="relative flex h-full w-full items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-white/[0.1] via-black/75 to-black/95 shadow-[0_18px_42px_rgba(0,0,0,0.85),0_0_32px_rgba(0,217,255,0.28),0_0_54px_rgba(255,22,138,0.24)]"
      >
        {/* Dashed orbital neon ring */}
        <div
          className={`pointer-events-none absolute inset-1.5 rounded-full border border-dashed border-cyan/45 ${reduce ? "" : "animate-spin [animation-duration:26s]"}`}
          style={{ transform: "translateZ(-4px)" }}
          aria-hidden="true"
        />

        {/* Extruded glowing logo plane */}
        <img
          src={src}
          alt={alt}
          className="logo-glow relative h-[86%] w-[86%] object-contain mix-blend-screen transition-transform duration-300"
          style={{
            transform: "translateZ(26px)",
            maskImage: "radial-gradient(circle, black 56%, transparent 79%)",
            WebkitMaskImage: "radial-gradient(circle, black 56%, transparent 79%)",
          }}
        />

        {/* Dynamic specular glare */}
        {!reduce && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background: glareBg,
              opacity: spotOpacity,
              transform: "translateZ(36px)",
            }}
            aria-hidden="true"
          />
        )}
      </motion.div>
    </motion.div>
  );
}

export function Footer() {
  const config = useSiteConfig();

  // New footer_config (from site_config table)
  const fc = (config["footer_config"] as any) ?? {};

  // Fallbacks from legacy settings / site_identity
  const siteId = (config["site_identity"] as any) ?? {};
  const clubName = siteId.club_name || (config["club_name"] as string) || "GenZone";
  const logoUrl   = siteId.logo_url  || (config["logo_url"] as string)  || null;
  const displayLogo = logoUrl || "/genzone-fallback.svg";

  // Footer config values with fallbacks
  const ghostText         = fc.ghost_text          ?? clubName.toUpperCase();
  const ghostVisible      = fc.ghost_text_visible  !== false;
  const ghostFrom         = fc.ghost_text_gradient_from ?? '#00bfff';
  const ghostTo           = fc.ghost_text_gradient_to   ?? '#ff69b4';
  const ghostOpacity      = (fc.ghost_text_opacity ?? 100) / 100;
  const logoVisible       = fc.logo_visible         !== false;
  const contactHeading    = fc.contact_heading      ?? 'Contact';
  const contactColor      = COLOR_MAP[fc.contact_heading_color ?? 'cyan'];
  const email             = fc.contact_email    || siteId.contact_email || (config["contact_email"] as string) || fallbackContact.email;
  const location          = fc.contact_location || siteId.location      || (config["location"] as string)      || fallbackContact.location;
  const followHeading     = fc.follow_heading   ?? 'Follow';
  const followColor       = COLOR_MAP[fc.follow_heading_color ?? 'pink'];
  const copyrightLeft     = (fc.copyright_left  ?? `© {year} ${clubName.toUpperCase()}`).replace('{year}', String(new Date().getFullYear()));
  const copyrightRight    = fc.copyright_right  ?? (siteId.footer_tagline || (config["footer_tagline"] as string) || "Turning Trends Into Tradition");
  const bgColor           = fc.bg_color         ?? 'transparent';
  const paddingTop        = fc.padding_top       ?? 96;
  const paddingBottom     = fc.padding_bottom    ?? 40;

  // Social links: merge admin footer_config with legacy settings/site_identity fallbacks
  const rawSocials: { label: string; href: string; color?: string }[] = fc.socials ?? [
    { label: "Instagram", href: siteId.instagram || (config["instagram"] as string) || DEFAULT_INSTAGRAM_URL, color: "pink" },
    { label: "LinkedIn",  href: siteId.linkedin  || (config["linkedin"] as string)  || "#" },
    { label: "YouTube",   href: siteId.youtube   || (config["youtube"] as string)   || "#" },
    { label: "X",         href: siteId.twitter   || (config["twitter"] as string)   || "#" },
  ];

  const resolvedSocials = rawSocials.map((s) => {
    const key = s.label.trim().toLowerCase();
    const legacyKey = key === "x" || key.includes("twitter") ? "twitter" : key.includes("insta") ? "instagram" : key.includes("linkedin") ? "linkedin" : key.includes("youtube") ? "youtube" : "";
    const fallbackHref = legacyKey ? (siteId[legacyKey] || (config[legacyKey] as string) || "") : "";
    const url =
      normalizeFooterSocialUrl(s.label, s.href) ||
      normalizeFooterSocialUrl(s.label, fallbackHref) ||
      (key.includes("insta") ? DEFAULT_INSTAGRAM_URL : null);
    return { ...s, url };
  });

  const activeSocials = resolvedSocials.filter((s) => Boolean(s.url));
  const instagramItem = resolvedSocials.find((s) => s.label.trim().toLowerCase().includes("insta"));
  const ghostLen = Math.max(String(ghostText).length, 4);
  // Use 95vw / charCount so text always fits within viewport with some margin
  const ghostVw = Math.min(14, Math.max(5, Number((95 / ghostLen).toFixed(1))));

  return (
    <footer
      className="relative overflow-hidden px-5 pt-14 pb-8 md:px-16 md:pt-[var(--ft-pt)] md:pb-[var(--ft-pb)]"
      style={{
        backgroundColor: bgColor === 'transparent' ? undefined : bgColor,
        ['--ft-pt' as string]: `${paddingTop}px`,
        ['--ft-pb' as string]: `${paddingBottom}px`,
      }}
    >
      <div className="grid items-center gap-8 sm:gap-10 md:grid-cols-[auto_1fr_1fr] md:gap-12">
        {logoVisible && <FooterLogo3D src={displayLogo} alt={clubName} />}
        <div className="min-w-0">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest md:mb-4" style={{ color: contactColor }}>
            {contactHeading}
          </p>
          <a href={`mailto:${email}`} className="block break-all text-base hover:text-pink sm:text-lg">{email}</a>
          <p className="text-sm text-muted-foreground sm:text-base">{location}</p>
        </div>
        <div className="min-w-0">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest md:mb-4" style={{ color: followColor }}>
            {followHeading}
          </p>
          <ul className="flex flex-wrap gap-3 sm:gap-3.5">
            {activeSocials.length > 0 ? (
              activeSocials.map((s, idx) => (
                <li key={`${s.label}-${idx}`}>
                  <FooterSocialButton3D label={s.label} url={s.url!} color={s.color} />
                </li>
              ))
            ) : (
              <li>
                <FooterSocialButton3D
                  label={instagramItem?.label || "Instagram"}
                  url={DEFAULT_INSTAGRAM_URL}
                  color="pink"
                />
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Giant ghost / wordmark text */}
      {ghostVisible && (
        <p
          className="mt-12 w-full select-none overflow-hidden text-center font-display font-black leading-none tracking-tight md:mt-20"
          style={{
            fontSize: `clamp(2rem, ${ghostVw}vw, 14rem)`,
            background: `linear-gradient(90deg, ${ghostFrom}, ${ghostTo})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            opacity: ghostOpacity,
          }}
          aria-hidden
        >
          {ghostText}
        </p>
      )}

      {/* Copyright bar */}
      <div className="mt-6 flex flex-col justify-between gap-2 border-t pt-6 font-mono text-[11px] uppercase tracking-widest text-muted-foreground sm:text-xs md:flex-row">
        <span>{copyrightLeft}</span>
        <span>{copyrightRight}</span>
      </div>
    </footer>
  );
}
