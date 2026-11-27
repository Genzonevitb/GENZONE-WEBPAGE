// Placeholder content. Shapes mirror what a future admin dashboard / CMS will provide.
export type ClubEvent = { id: string; title: string; date: string; category: string; blurb: string; accent: "cyan" | "pink" | "yellow" };
export type Memory = { id: string; category: string; caption: string; tall?: boolean; image?: string };
export type PanelMember = { id: string; name: string; role: string; image?: string; accent: "cyan" | "pink" | "yellow" };

export const navItems = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "events", label: "Events" },
  { id: "gallery", label: "Gallery" },
  { id: "panel", label: "Our Panel" },
  { id: "feedback", label: "Feedback" },
] as const;

export const events: ClubEvent[] = [
  { id: "e1", title: "Event Title 01", date: "Date TBA", category: "Workshop", blurb: "Placeholder — event description will be added by the panel.", accent: "pink" },
  { id: "e2", title: "Event Title 02", date: "Date TBA", category: "Hackathon", blurb: "Placeholder — event description will be added by the panel.", accent: "cyan" },
  { id: "e3", title: "Event Title 03", date: "Date TBA", category: "Showcase", blurb: "Placeholder — event description will be added by the panel.", accent: "yellow" },
  { id: "e4", title: "Event Title 04", date: "Date TBA", category: "Fest", blurb: "Placeholder — event description will be added by the panel.", accent: "pink" },
];

export const memoryCategories = ["All", "Events", "Workshops", "Behind the Scenes", "Fests"];

export const memories: Memory[] = Array.from({ length: 12 }, (_, i) => ({
  id: `m${i + 1}`,
  category: memoryCategories[1 + (i % 4)] ?? "Events",
  caption: `Photo placeholder ${String(i + 1).padStart(2, "0")}`,
  tall: i % 3 === 0,
}));

export const panel: PanelMember[] = [];

export const contact = {
  email: "email@placeholder.com",
  location: "Campus address — to be added",
  socials: [
    { label: "Instagram", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "YouTube", href: "#" },
    { label: "X", href: "#" },
  ],
};
