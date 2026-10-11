import { Search } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { StatusStamp } from "@/components/StatusStamp";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import type { EquipmentType, ReformedEquipment } from "@/types";
import { formatDate } from "@/lib/utils";

export default function MaterielReforme() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = React.useState<ReformedEquipment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [service, setService] = React.useState("");
  const [type, setType] = React.useState<EquipmentType | "">("");
  const [brand, setBrand] = React.useState("");

  React.useEffect(() => {
    let alive = true;
    db.listReformed()
      .then((r) => alive && setItems(r))
      .catch(() => void 0)
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const services = React.useMemo(
    () => [...new Set(items.map((i) => i.service))].sort((a, b) => a.localeCompare(b, "fr")),
    [items],
  );
  const brands = React.useMemo(
    () => [...new Set(items.map((i) => i.brand).filter(Boolean))].sort(),
    [items],
  );

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (service && i.service !== service) return false;
      if (type && i.equipment !== type) return false;
      if (brand && i.brand !== brand) return false;
      if (q) {
        const hay = `${i.ticketNumber} ${i.service} ${i.fault} ${i.brand} ${i.serial ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, search, service, type, brand]);

  const hasFilters = Boolean(search || service || type || brand);

  return (
    <div className="container py-14 md:py-20">
      <header className="max-w-2xl">
        <p className="label-caps flex items-center gap-3">
          <span className="inline-block h-px w-10 bg-accent" aria-hidden />
          {t("reformed.eyebrow")}
        </p>
        <h1 className="mt-5 font-display text-[clamp(2.1rem,5.5vw,3.4rem)] leading-[1.02] tracking-tight">
          {t("reformed.title")}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground text-pretty">{t("reformed.intro")}</p>
      </header>

      {/* filters */}
      <div className="mt-10 grid gap-3 border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" aria-hidden />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("reformed.searchPlaceholder")}
            aria-label={t("reformed.searchLabel")}
            className="ps-9"
          />
        </div>

        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          aria-label={t("reformed.filterService")}
          className="h-11 border border-input bg-surface px-3 text-sm text-foreground outline-none focus-visible:border-primary"
          style={{ borderRadius: 3 }}
        >
          <option value="">{t("reformed.allServices")}</option>
          {services.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={type}
          onChange={(e) => setType(e.target.value as EquipmentType | "")}
          aria-label={t("reformed.filterType")}
          className="h-11 border border-input bg-surface px-3 text-sm text-foreground outline-none focus-visible:border-primary"
          style={{ borderRadius: 3 }}
        >
          <option value="">{t("reformed.allTypes")}</option>
          {(["printer", "screen", "unit", "qr_printer"] as EquipmentType[]).map((eq) => (
            <option key={eq} value={eq}>
              {t(`equipment.${eq}`)}
            </option>
          ))}
        </select>

        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          aria-label={t("reformed.filterBrand")}
          className="h-11 border border-input bg-surface px-3 text-sm text-foreground outline-none focus-visible:border-primary"
          style={{ borderRadius: 3 }}
        >
          <option value="">{t("reformed.allBrands")}</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-6 font-mono text-xs uppercase tracking-wider text-muted-foreground">
        {t("reformed.count", { count: filtered.length })}
      </p>

      {/* desktop table */}
      <div className="mt-4 hidden overflow-hidden border border-border md:block">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{t("reformed.title")}</caption>
          <thead>
            <tr className="bg-muted/60 text-start">
              {[
                "colTicket",
                "colEquipment",
                "colBrand",
                "colSerial",
                "colService",
                "colFault",
                "colDate",
                "colRemarks",
              ].map((c) => (
                <th
                  key={c}
                  scope="col"
                  className="border-b border-border px-4 py-3 text-start label-caps whitespace-nowrap"
                >
                  {t(`reformed.${c}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-border/70 transition-colors last:border-b-0 hover:bg-muted/40">
                <td className="px-4 py-3 font-mono text-xs" dir="ltr">
                  {i.ticketNumber}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{t(`equipment.${i.equipment}`)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{i.brand}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground" dir="ltr">
                  {i.serial || "—"}
                </td>
                <td className="px-4 py-3">{i.service}</td>
                <td className="px-4 py-3 text-muted-foreground">{i.fault}</td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                  {formatDate(i.reformedAt, i18n.language)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{i.remarks || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* mobile cards */}
      <ul className="mt-4 flex flex-col gap-3 md:hidden">
        {filtered.map((i) => (
          <li key={i.id} className="border border-border bg-surface p-4" style={{ borderRadius: 3 }}>
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                {i.ticketNumber}
              </span>
              <StatusStamp status="unrepairable" rotate={false} className="scale-90" />
            </div>
            <p className="mt-3 font-display text-lg leading-tight">
              {t(`equipment.${i.equipment}`)} · {i.brand}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="label-caps">{t("reformed.colService")}</dt>
                <dd className="mt-0.5 text-foreground/90">{i.service}</dd>
              </div>
              <div>
                <dt className="label-caps">{t("reformed.colDate")}</dt>
                <dd className="mt-0.5 text-foreground/90">{formatDate(i.reformedAt, i18n.language)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="label-caps">{t("reformed.colFault")}</dt>
                <dd className="mt-0.5 text-foreground/90">{i.fault}</dd>
              </div>
              {i.serial && (
                <div>
                  <dt className="label-caps">{t("reformed.colSerial")}</dt>
                  <dd className="mt-0.5 font-mono text-foreground/90" dir="ltr">
                    {i.serial}
                  </dd>
                </div>
              )}
              {i.remarks && (
                <div className="col-span-2">
                  <dt className="label-caps">{t("reformed.colRemarks")}</dt>
                  <dd className="mt-0.5 text-muted-foreground">{i.remarks}</dd>
                </div>
              )}
            </dl>
          </li>
        ))}
      </ul>

      {!loading && filtered.length === 0 && (
        <p className="mt-8 border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {hasFilters ? t("reformed.noResults") : t("reformed.empty")}
        </p>
      )}
    </div>
  );
}
