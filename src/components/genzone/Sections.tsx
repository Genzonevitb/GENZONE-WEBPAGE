import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { accentBg, accentBorder, accentText, Reveal, SectionTag, SplitHeading } from "./shared";
import RegistrationModal from "./RegistrationModal";

type Accent = "cyan" | "pink" | "yellow";

interface DbEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
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
  const [settings, setSettings] = useState<Record<string, string>>({});
  useEffect(() => {
    supabase
      .from("settings")
      .select("key, value")
      .in("key", keys)
      .then(({ data }) => {
        if (data) setSettings(Object.fromEntries(data.map((r) => [r.key, r.value ?? ""])));
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return settings;
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
export function About() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], ["10%", "-30%"]);

  const [marqueeWords, setMarqueeWords] = useState<string[]>(DEFAULT_MARQUEE);
  const [stats, setStats] = useState<DbStat[]>([]);

  const settings = useSettings([
    "about_label", "about_heading", "about_paragraph", "about_story", "about_watermark",
  ]);

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
  }, []);

  const label = settings["about_label"] || "About GenZone";
  const heading = settings["about_heading"] || "A playground for people who make things.";
  const paragraph = settings["about_paragraph"] || "GenZone is the college's creative and technical club — a crew of designers, coders, filmmakers, artists and curious minds who'd rather build than sit still.";
  const story = settings["about_story"] || "[Placeholder: your club's story, mission and founding year go here.]";
  const watermark = settings["about_watermark"] || "LOUDER BOLDER";

  const displayStats: Array<[string, string, string]> = stats.length > 0
    ? stats.map((s) => [s.value, s.label, `text-${s.accent}`])
    : [["00+", "Members", "text-cyan"], ["00+", "Events", "text-pink"], ["00", "Domains", "text-yellow"]];

  return (
    <>
      <Marquee words={marqueeWords} />
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
    </>
  );
}

// ─── Events ──────────────────────────────────────────────────
export function Events() {
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [hover, setHover] = useState(0);
  const [registerEvent, setRegisterEvent] = useState<DbEvent | null>(null);
  const settings = useSettings(["events_label", "events_heading"]);

  useEffect(() => {
    supabase
      .from("events")
      .select("id, title, description, event_date, venue, category, accent, image_url, is_published, registration_open, registration_deadline, max_seats, form_mode, external_form_url")
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
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  function handleRegister(event: DbEvent) {
    if (event.form_mode === "external" && event.external_form_url) {
      window.open(event.external_form_url, "_blank", "noopener,noreferrer");
    } else {
      setRegisterEvent(event);
    }
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
                  onClick={() => setHover(i)}
                  className="group flex w-full items-baseline gap-4 border-t py-6 text-left md:gap-8 md:py-8"
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
                onClick={() => handleRegister(current)}
                className={`relative aspect-[3/4] overflow-hidden rounded-xl border-2 cursor-pointer ${accentBorder[current.accent]}`}
              >
                {current.image_url ? (
                  <>
                    <img
                      src={current.image_url}
                      alt={current.title}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    {/* Dark gradient overlay so text stays readable */}
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

                    {/* Registration status + CTA */}
                    <div className="mt-4 flex items-center gap-3">
                      {!current.registration_open ? (
                        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40 border border-white/20 rounded-full px-3 py-1">
                          Closed
                        </span>
                      ) : (
                        <span className={`font-mono text-xs uppercase tracking-widest ${accentText[current.accent]} flex items-center gap-1`}>
                          {current.form_mode === "external" ? "Register (External) ↗" : "Register →"}
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

    {/* Registration modal */}
    {registerEvent && (
      <RegistrationModal
        event={registerEvent}
        onClose={() => setRegisterEvent(null)}
      />
    )}
    </>
  );
}

// ─── Gallery ─────────────────────────────────────────────────
export function Gallery() {
  const [photos, setPhotos] = useState<DbGallery[]>([]);
  const [albums, setAlbums] = useState<DbAlbum[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [preview, setPreview] = useState<string | null>(null);
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

  // Filter: "all" shows everything; album id filters by album_id
  const shown = filter === "all" ? photos : photos.filter((p) => p.album_id === filter);
  const active = photos.find((m) => m.id === preview);

  // Build filter buttons: All + each album
  const filterButtons = [
    { id: "all", name: "All" },
    ...albums,
  ];

  return (
    <section id="gallery" className="bg-charcoal px-5 py-28 md:px-16 md:py-40">
      <SectionTag n="03" label={label} />
      <div className="mb-12 flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <SplitHeading text={heading} className="font-display text-5xl font-black uppercase md:text-8xl" />
        <div className="flex flex-wrap gap-2">
          {filterButtons.map((b) => (
            <button
              key={b.id}
              onClick={() => setFilter(b.id)}
              className={`rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${filter === b.id ? "border-pink bg-pink text-foreground" : "hover:border-cyan hover:text-cyan"}`}
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>

      {photos.length === 0 ? (
        <p className="text-muted-foreground font-mono text-sm">No photos yet — upload some from the admin panel.</p>
      ) : (
        <motion.div layout className="columns-2 gap-3 md:columns-4 md:gap-4">
          <AnimatePresence>
            {shown.map((m) => (
              <motion.button
                layout
                key={m.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setPreview(m.id)}
                className={`group relative mb-3 block w-full overflow-hidden rounded-lg border md:mb-4 ${m.tall ? "aspect-[3/4]" : "aspect-square"}`}
              >
                <img
                  src={m.thumb_url ?? m.image_url}
                  alt={m.caption ?? ""}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-neon opacity-0 mix-blend-overlay transition-opacity group-hover:opacity-40" />
                <span className="absolute bottom-3 left-3 text-left font-mono text-[10px] uppercase tracking-widest">
                  <span className="block text-cyan">{m.category}</span>
                  {m.caption}
                </span>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-background/90 p-6 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreview(null)}
            role="dialog"
            aria-label="Photo preview"
          >
            <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} className="relative flex aspect-[4/3] w-full max-w-3xl overflow-hidden rounded-xl border-2 border-cyan">
              <img src={active.image_url} alt={active.caption ?? ""} className="h-full w-full object-cover" />
              <div className="absolute bottom-0 inset-x-0 bg-background/80 p-6 backdrop-blur-sm">
                <p className="font-mono text-xs uppercase tracking-widest text-cyan">{active.category}</p>
                <p className="font-display text-2xl font-black uppercase">{active.caption}</p>
                <p className="mt-1 text-sm text-muted-foreground">Tap anywhere to close</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── Panel ───────────────────────────────────────────────────
export function Panel() {
  const [members, setMembers] = useState<DbMember[]>([]);
  const settings = useSettings(["panel_label", "panel_heading"]);

  useEffect(() => {
    supabase
      .from("panel_members")
      .select("id, name, role, accent, portrait_url, sort_order")
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) setMembers(data as DbMember[]);
      });
  }, []);

  const label = settings["panel_label"] || "Meet the Panel";
  const heading = settings["panel_heading"] || "The people behind the noise.";

  return (
    <section id="panel" className="px-5 py-28 md:px-16 md:py-40">
      <SectionTag n="04" label={label} />
      <SplitHeading text={heading} className="mb-16 max-w-5xl font-display text-5xl font-black uppercase leading-[0.95] md:text-8xl" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-8">
        {members.map((p, i) => (
          <Reveal key={p.id} delay={(i % 3) * 0.1} className={i % 3 === 1 ? "md:mt-24" : ""}>
            <figure className="group">
              <div className={`relative aspect-[3/4] overflow-hidden rounded-xl border transition-all duration-500 group-hover:-rotate-2 group-hover:border-foreground`}>
                {p.portrait_url ? (
                  <img src={p.portrait_url} alt={p.name} className="h-full w-full object-cover" />
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
                <p className="font-display text-xl font-black uppercase md:text-2xl">{p.name}</p>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

