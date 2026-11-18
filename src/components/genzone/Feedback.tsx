import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { contact as fallbackContact } from "@/content/genzone";
import { supabase } from "@/lib/supabase";
import { SectionTag, SplitHeading } from "./shared";
import { useSiteConfig } from "@/lib/config-context";

const kinds = ["Idea", "Feedback", "Collab", "Other"];
const field = "w-full border-0 border-b-2 bg-transparent py-4 text-lg outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-cyan";

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
    <section id="feedback" className="relative overflow-hidden bg-charcoal px-5 py-28 md:px-16 md:py-40">
      <div className="pointer-events-none absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-pink/20 blur-[120px]" />
      <SectionTag n="05" label={fbLabel} />
      <div className="relative grid gap-16 md:grid-cols-2">
        <div>
          <SplitHeading text={fbHeading} className="font-display text-5xl font-black uppercase leading-[0.95] md:text-7xl" />
          <p className="mt-6 max-w-sm text-lg text-muted-foreground">{fbSubtitle}</p>
        </div>
        <form onSubmit={submit} noValidate className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {kinds.map((k) => (
              <button type="button" key={k} onClick={() => setKind(k)} className={`rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${kind === k ? "border-yellow bg-yellow text-background" : "hover:border-yellow"}`}>
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
          <button type="submit" disabled={submitting} className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-foreground px-8 py-4 font-display text-sm font-black uppercase text-background transition-transform hover:scale-105 disabled:opacity-60">
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

  // Social links: use admin-defined list if available, otherwise fall back to settings
  const socials: { label: string; href: string; color?: string }[] = fc.socials ?? [
    { label: "Instagram", href: siteId.instagram || (config["instagram"] as string) || "#" },
    { label: "LinkedIn",  href: siteId.linkedin  || (config["linkedin"] as string)  || "#" },
    { label: "YouTube",   href: siteId.youtube   || (config["youtube"] as string)   || "#" },
    { label: "X",         href: siteId.twitter   || (config["twitter"] as string)   || "#" },
  ];

  return (
    <footer
      className="relative overflow-hidden px-5 md:px-16"
      style={{ backgroundColor: bgColor === 'transparent' ? undefined : bgColor, paddingTop, paddingBottom }}
    >
      <div className="grid gap-12 md:grid-cols-[auto_1fr_1fr]">
        {logoVisible && (
          <img src={displayLogo} alt={clubName} className="logo-glow w-32 mix-blend-screen md:w-40" />
        )}
        <div>
          <p className="mb-4 font-mono text-xs uppercase tracking-widest" style={{ color: contactColor }}>
            {contactHeading}
          </p>
          <a href={`mailto:${email}`} className="block text-lg hover:text-pink">{email}</a>
          <p className="text-muted-foreground">{location}</p>
        </div>
        <div>
          <p className="mb-4 font-mono text-xs uppercase tracking-widest" style={{ color: followColor }}>
            {followHeading}
          </p>
          <ul className="flex flex-wrap gap-3">
            {socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-full border px-4 py-2 text-sm transition-all hover:-translate-y-1 hover:border-yellow"
                  style={{ color: s.color ? COLOR_MAP[s.color] ?? undefined : undefined }}
                >
                  {s.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Giant ghost / wordmark text */}
      {ghostVisible && (
        <p
          className="mt-20 select-none text-center font-display font-black leading-none"
          style={{
            fontSize: '18vw',
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
      <div className="mt-6 flex flex-col justify-between gap-2 border-t pt-6 font-mono text-xs uppercase tracking-widest text-muted-foreground md:flex-row">
        <span>{copyrightLeft}</span>
        <span>{copyrightRight}</span>
      </div>
    </footer>
  );
}
