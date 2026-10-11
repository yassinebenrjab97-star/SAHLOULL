import * as React from "react";
import { db } from "@/lib/db";
import { DEFAULT_BRANDS, DEFAULT_SERVICES } from "@/lib/constants";
import type { BrandRow, ServiceRow } from "@/types";

/**
 * Loads the editable service & brand lists. Falls back to the built-in defaults
 * if the backend is unavailable, so the form is never empty.
 */
export function useTaxonomy() {
  const [services, setServices] = React.useState<ServiceRow[]>(() =>
    DEFAULT_SERVICES.map((name, i) => ({ id: `s${i}`, name })),
  );
  const [brands, setBrands] = React.useState<BrandRow[]>([]);

  const reload = React.useCallback(async () => {
    try {
      const [s, b] = await Promise.all([db.listServices(), db.listBrands()]);
      if (s.length) setServices(s);
      setBrands(b.length ? b : fallbackBrands());
    } catch {
      setBrands(fallbackBrands());
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  return { services, brands, reload };
}

function fallbackBrands(): BrandRow[] {
  return (Object.entries(DEFAULT_BRANDS) as [BrandRow["equipment"], string[]][]).flatMap(
    ([equipment, names]) => names.map((name, i) => ({ id: `${equipment}-${i}`, equipment, name })),
  );
}
