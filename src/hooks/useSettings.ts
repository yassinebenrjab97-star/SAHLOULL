import * as React from "react";
import { db } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import type { SiteSettings } from "@/types";

const cache: { value: SiteSettings | null } = { value: null };

export function useSettings() {
  const [settings, setSettings] = React.useState<SiteSettings>(cache.value ?? DEFAULT_SETTINGS);

  React.useEffect(() => {
    let alive = true;
    db.getSettings()
      .then((s) => {
        cache.value = s;
        if (alive) setSettings(s);
      })
      .catch(() => void 0);
    return () => {
      alive = false;
    };
  }, []);

  return settings;
}
