import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import logo from "@/assets/genzone-logo.png.asset.json";
import { contact as fallbackContact } from "@/content/genzone";
import { supabase } from "@/lib/supabase";
import { SectionTag, SplitHeading } from "./shared";

const kinds = ["Idea", "Feedback", "Collab", "Other"];
const field = "w-full border-0 border-b-2 bg-transparent py-4 text-lg outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-cyan";

export function Feedback() {
  const [kind, setKind] = useState("Idea");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [fbSettings, setFbSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase
      .from("settings")
      .select("key, value")
      .in("key", ["feedback_label", "feedback_heading", "feedback_subtitle"])
      .then(({ data }) => {
        if (data) setFbSettings(Object.fromEntries(data.map((r) => [r.key, r.value ?? ""])));
      });
  }, []);

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

  const fbLabel = fbSettings["feedback_label"] || "Suggestions & Feedback";
  const fbHeading = fbSettings["feedback_heading"] || "Got something loud to say?";
  const fbSubtitle = fbSettings["feedback_subtitle"] || "Ideas, rants, collabs — drop them here. The panel reads everything.";

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

export function Footer() {
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase
      .from("settings")
      .select("key, value")
      .then(({ data }) => {
        if (data) {
          setSettings(Object.fromEntries(data.map((r) => [r.key, r.value ?? ""])));
        }
      });
  }, []);

  const email = settings["contact_email"] || fallbackContact.email;
  const location = settings["location"] || fallbackContact.location;
  const clubName = settings["club_name"] || "GenZone";
  const footerTagline = settings["footer_tagline"] || "Not another club.";
  const logoUrl = settings["logo_url"] || null;
  const socials = [
    { label: "Instagram", href: settings["instagram"] || "#" },
    { label: "LinkedIn",  href: settings["linkedin"]  || "#" },
    { label: "YouTube",   href: settings["youtube"]   || "#" },
    { label: "X",         href: settings["twitter"]   || "#" },
  ];

  const displayLogo = logoUrl || logo.url;

  return (
    <footer className="relative overflow-hidden px-5 pb-10 pt-24 md:px-16">
      <div className="grid gap-12 md:grid-cols-[auto_1fr_1fr]">
        <img src={displayLogo} alt={clubName} className="logo-glow w-32 mix-blend-screen md:w-40" />
        <div>
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-cyan">Contact</p>
          <a href={`mailto:${email}`} className="block text-lg hover:text-pink">{email}</a>
          <p className="text-muted-foreground">{location}</p>
        </div>
        <div>
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-pink">Follow</p>
          <ul className="flex flex-wrap gap-3">
            {socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} className="inline-block rounded-full border px-4 py-2 text-sm transition-all hover:-translate-y-1 hover:border-yellow hover:text-yellow">{s.label} ↗</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-20 select-none text-center font-display text-[18vw] font-black leading-none text-neon" aria-hidden>{clubName.toUpperCase()}</p>
      <div className="mt-6 flex flex-col justify-between gap-2 border-t pt-6 font-mono text-xs uppercase tracking-widest text-muted-foreground md:flex-row">
        <span>© {new Date().getFullYear()} {clubName}</span>
        <span>{footerTagline}</span>
      </div>
    </footer>
  );
}
