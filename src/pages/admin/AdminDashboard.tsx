import { ChevronRight, Search } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { StatusStamp } from "@/components/StatusStamp";
import { Input } from "@/components/ui/input";
import { useTaxonomy } from "@/hooks/useTaxonomy";
import { db } from "@/lib/db";
import { STATUS_FLOW } from "@/lib/status";
import { formatDate } from "@/lib/utils";
import type { EquipmentType, RequestStatus, ServiceRequest, Urgency } from "@/types";
import { cn } from "@/lib/utils";

const ALL_STATUSES: RequestStatus[] = [...STATUS_FLOW, "unrepairable", "refused"];

const URGENCY_TONE: Record<Urgency, string> = {
  normal: "text-muted-foreground",
  urgent: "text-warning",
  critical: "text-destructive font-medium",
};

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const { services } = useTaxonomy();

  const [requests, setRequests] = React.useState<ServiceRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [status, setStatus] = React.useState<RequestStatus | "all">("all");
  const [service, setService] = React.useState("");
  const [equipment, setEquipment] = React.useState<EquipmentType | "all">("all");
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");

  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(id);
  }, [search]);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    db.listRequests({ status, service: service || undefined, equipment, search: debounced || undefined })
      .then((r) => alive && setRequests(r))
      .catch(() => void 0)
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [status, service, equipment, debounced]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps">Administration</p>
          <h1 className="mt-1 font-display text-3xl tracking-tight">{t("admin.dashboardTitle")}</h1>
        </div>
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {requests.length} {t("admin.tickets")}
        </p>
      </header>

      {/* filters */}
      <div className="grid gap-3 border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" aria-hidden />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.searchTicket")}
            aria-label={t("admin.searchTicket")}
            className="ps-9 font-mono uppercase"
            dir="ltr"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as RequestStatus | "all")}
          aria-label={t("admin.filterStatus")}
          className="h-11 border border-input bg-surface px-3 text-sm outline-none focus-visible:border-primary"
          style={{ borderRadius: 3 }}
        >
          <option value="all">{t("admin.allStatuses")}</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
            </option>
          ))}
        </select>

        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          aria-label={t("admin.filterService")}
          className="h-11 border border-input bg-surface px-3 text-sm outline-none focus-visible:border-primary"
          style={{ borderRadius: 3 }}
        >
          <option value="">{t("admin.allServices")}</option>
          {services.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={equipment}
          onChange={(e) => setEquipment(e.target.value as EquipmentType | "all")}
          aria-label={t("admin.filterType")}
          className="h-11 border border-input bg-surface px-3 text-sm outline-none focus-visible:border-primary"
          style={{ borderRadius: 3 }}
        >
          <option value="all">{t("admin.allTypes")}</option>
          {(["printer", "screen", "unit", "qr_printer"] as EquipmentType[]).map((eq) => (
            <option key={eq} value={eq}>
              {t(`equipment.${eq}`)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground animate-pulse-soft">
          {t("common.loading")}
        </p>
      ) : requests.length === 0 ? (
        <p className="border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {t("admin.noRequests")}
        </p>
      ) : (
        <>
          {/* desktop table */}
          <div className="hidden overflow-hidden border border-border lg:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {["N°", t("admin.filterService"), t("admin.filterType"), t("reclamation.urgencyLabel"), t("common.status"), t("common.date"), ""].map(
                    (h, i) => (
                      <th key={i} scope="col" className="border-b border-border px-4 py-3 text-start label-caps whitespace-nowrap">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-b border-border/70 transition-colors last:border-b-0 hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link to={`/admin/requests/${r.id}`} className="font-mono text-xs text-primary hover:underline" dir="ltr">
                        {r.ticketNumber}
                      </Link>
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3">{r.service}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {t(`equipment.${r.equipment}`)}
                      <span className="text-muted-foreground"> · {r.brand}</span>
                    </td>
                    <td className={cn("px-4 py-3 whitespace-nowrap", URGENCY_TONE[r.urgency])}>
                      {t(`urgency.${r.urgency}`)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusStamp status={r.status} rotate={false} className="scale-90" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                      {formatDate(r.createdAt, i18n.language)}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <Link
                        to={`/admin/requests/${r.id}`}
                        aria-label={t("admin.viewDetails")}
                        className="inline-flex text-muted-foreground hover:text-primary"
                      >
                        <ChevronRight className="size-4 rtl:rotate-180" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* mobile cards */}
          <ul className="flex flex-col gap-3 lg:hidden">
            {requests.map((r) => (
              <li key={r.id}>
                <Link
                  to={`/admin/requests/${r.id}`}
                  className="block border border-border bg-surface p-4 transition-colors hover:border-primary/50"
                  style={{ borderRadius: 3 }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs text-primary" dir="ltr">
                      {r.ticketNumber}
                    </span>
                    <StatusStamp status={r.status} rotate={false} className="scale-90" />
                  </div>
                  <p className="mt-3 font-display text-base leading-tight">{r.service}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(`equipment.${r.equipment}`)} · {r.brand}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className={URGENCY_TONE[r.urgency]}>{t(`urgency.${r.urgency}`)}</span>
                    <span className="text-muted-foreground">{formatDate(r.createdAt, i18n.language)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
