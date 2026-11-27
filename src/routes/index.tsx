import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Intro } from "@/components/genzone/Intro";
import { Nav } from "@/components/genzone/Nav";
import { Hero } from "@/components/genzone/Hero";
import { About, Events, Gallery, Panel } from "@/components/genzone/Sections";
import { Feedback, Footer } from "@/components/genzone/Feedback";
import { SiteConfigProvider } from "@/lib/config-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GenZone — Not Another Club" },
      { name: "description", content: "GenZone is a college creative and technical club where creativity gets louder and ideas get bolder." },
      { property: "og:title", content: "GenZone — Not Another Club" },
      { property: "og:description", content: "Where creativity gets louder, ideas get bolder, and possibilities have no limits." },
    ],
  }),
  component: Index,
});

function Index() {
  const [ready, setReady] = useState(false);
  return (
    <SiteConfigProvider>
      <div className="grain">
        <Intro onDone={() => setReady(true)} />
        <Nav />
        <main>
          <Hero ready={ready} />
          <About />
          <Events />
          <Gallery />
          <Panel />
          <Feedback />
        </main>
        <Footer />
      </div>
    </SiteConfigProvider>
  );
}
