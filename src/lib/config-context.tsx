import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

type SiteConfig = Record<string, unknown>;

const ConfigCtx = createContext<SiteConfig>({});

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>({});
  useEffect(() => {
    // Fetch site_config (new table) published rows
    const p1 = supabase.from("site_config").select("key, value").eq("status", "published")
      .then(({ data }) => {
        if (!data) return {};
        return Object.fromEntries(data.map((r) => [r.key, r.value]));
      }).catch(() => ({}));
    // Fetch legacy settings table (flat key-value)
    const p2 = supabase.from("settings").select("key, value")
      .then(({ data }) => {
        if (!data) return {};
        return Object.fromEntries(data.map((r) => [r.key, r.value ?? ""]));
      }).catch(() => ({}));
    Promise.all([p1, p2]).then(([siteConf, legacyConf]) => {
      setConfig({ ...legacyConf, ...siteConf }); // site_config takes precedence
    });
  }, []);
  return <ConfigCtx.Provider value={config}>{children}</ConfigCtx.Provider>;
}

export function useSiteConfig(): SiteConfig { return useContext(ConfigCtx); }

export function useText(id: string, defaultText: string): string {
  const config = useSiteConfig();
  const textConf = config[`text.${id}`];
  if (textConf && typeof textConf === "object" && "text" in (textConf as object)) {
    return String((textConf as { text: string }).text) || defaultText;
  }
  return defaultText;
}
