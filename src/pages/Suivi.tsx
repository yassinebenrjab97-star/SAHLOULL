import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Phone,
  Search,
  XCircle,
} from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { StatusStamp } from "@/components/StatusStamp";
import { Timeline } from "@/components/Timeline";
import { TicketCard } from "@/components/TicketCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/db";
import { normalizeTicket } from "@/lib/ticket";
import { formatDate, telHref } from "@/lib/utils";
import type { ServiceRequest } from "@/types";
import { cn } from "@/lib/utils";

type NoticeTone = "warning" | "success" | "info" | "danger";
const TONE: Record<NoticeTone, string> = {
  warning: "border-warning/50 bg-warning/10",
  success: "border-success/50 bg-success/10",
  info: "border-primary/50 bg-primary/10",
  danger: "border-destructive/50 bg-destructive/10",
};
const TONE_ICON: Record<NoticeTone, typeof AlertTriangle> = {
  warning: AlertTriangle,
  success: BadgeCheck,
  info: CheckCircle2,
  danger: XCircle,
};

function Notice({
  tone,
  title,
  children,
}: {
  tone: NoticeTone;
  title: string;
  children?: React.ReactNode;
}) {
  const Icon = TONE_ICON[tone];
  return (
    <div className={cn("flex items-start gap-3 border p-4 sm:p-5", TONE[tone])} style={{ borderRadius: 3 }}>
      <Icon
        className={cn(
          "mt-0.5 size-5 shrink-0",
          tone === "warning" && "text-warning",
          tone === "success" && "text-success",
          tone === "info" && "text-primary",
          tone === "danger" && "text-destructive",
        )}
        aria-hidden
      />
      <div className="space-y-1">
        <p className="font-display text-base leading-tight">{title}</p>
        {children && <div className="text-sm text-foreground/85">{children}</div>}
      </div>
    </div>
  );
}

export default function Suivi() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const prefill = (location.state as { ticket?: string } | null)?.ticket ?? "";

  const [ticket, setTicket] = React.useState(prefill);
  const [phone, setPhone] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [request, setRequest] = React.useState<ServiceRequest | null>(null);
  const [searched, setSearched] = React.useState(false);

  const runSearch = React.useCallback(
    async (ticketValue: string, phoneValue: string) => {
      if (!ticketValue.trim()) return;
      setLoading(true);
      setSearched(false);
      try {
        const found = await db.getRequestByTicket(normalizeTicket(ticketValue));
        const digits = phoneValue.replace(/\D/g, "");
        const phoneOk = !digits || found?.phone.replace(/\D/g, "").endsWith(digits);
        setRequest(found && phoneOk ? found : null);
      } catch {
        setRequest(null);
      } finally {
        setLoading(false);
        setSearched(true);
      }
    },
    [],
  );

  React.useEffect(() => {
    if (prefill) void runSearch(prefill, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const banner = request ? renderBanner(request) : null;

  function renderBanner(r: ServiceRequest) {
    switch (r.status) {
      case "pending_acceptance":
        return (
          <Notice tone="warning" title={t("tracking.warningPending")}>
            <p>{t("tracking.warningPendingDetail")}</p>
          </Notice>
        );
      case "accepted":
      case "received":
      case "in_repair":
        return (
          <Notice tone="success" title={t("tracking.noticeAccepted")}>
            <p>{t("tracking.noticeAcceptedDetail")}</p>
          </Notice>
        );
      case "repaired":
        return (
          <Notice tone="info" title={t("status.repaired")}>
            <p>{t("statusDesc.repaired")}</p>
          </Notice>
        );
      case "unrepairable":
        return (
          <Notice tone="danger" title={t("tracking.unrepairableTitle")}>
            <p>{t("tracking.unrepairableHint")}</p>
            <Link to="/materiel-reforme" className="mt-1 inline-block text-sm text-primary hover:underline">
              {t("tracking.viewReformed")} →
            </Link>
          </Notice>
        );
      case "refused":
        return (
          <Notice tone="danger" title={t("tracking.refusedTitle")}>
            {r.refusalReason && (
              <p>
                <span className="font-medium">{t("tracking.refusedReason")}: </span>
                {r.refusalReason}
              </p>
            )}
            <p className="mt-1 text-muted-foreground">{t("tracking.refusedHint")}</p>
          </Notice>
        );
    }
  }

  return (
    <div className="container max-w-5xl py-14 md:py-20">
      <header className="max-w-2xl">
        <p className="label-caps flex items-center gap-3">
          <span className="inline-block h-px w-10 bg-accent" aria-hidden />
          {t("tracking.eyebrow")}
        </p>
        <h1 className="mt-5 font-display text-[clamp(2.1rem,5.5vw,3.4rem)] leading-[1.02] tracking-tight">
          {t("tracking.title")}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("tracking.intro")}</p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void runSearch(ticket, phone);
        }}
        className="mt-10 grid gap-4 border border-border bg-surface p-5 sm:grid-cols-[1.2fr_1fr_auto] sm:items-end sm:p-6"
      >
        <div>
          <Label htmlFor="ticket" required className="mb-2">
            {t("tracking.ticketLabel")}
          </Label>
          <Input
            id="ticket"
            value={ticket}
            onChange={(e) => setTicket(e.target.value)}
            placeholder={t("tracking.ticketPlaceholder")}
            dir="ltr"
            autoComplete="off"
            className="font-mono uppercase"
          />
        </div>
        <div>
          <Label htmlFor="phone" className="mb-2">
            {t("tracking.phoneOptionalLabel")}
          </Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("tracking.phonePlaceholder")}
            dir="ltr"
          />
        </div>
        <Button type="submit" size="lg" disabled={loading} className="sm:mb-0">
          <Search className="size-4" />
          {loading ? t("tracking.searching") : t("tracking.searchBtn")}
        </Button>
      </form>

      {searched && !request && (
        <div className="mt-8 border border-dashed border-border p-8 text-center" style={{ borderRadius: 3 }}>
          <XCircle className="mx-auto size-6 text-muted-foreground" aria-hidden />
          <h2 className="mt-4 font-display text-xl">{t("tracking.notFoundTitle")}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{t("tracking.notFoundText")}</p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/reclamation">{t("home.ctaDeclare")}</Link>
          </Button>
        </div>
      )}

      {request && (
        <div className="mt-10 space-y-8 animate-fade-up">
          {banner}

          <TicketCard request={request} />

          <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl tracking-tight">{t("tracking.timelineTitle")}</h2>
                <StatusStamp status={request.status} rotate={false} />
              </div>
              <div className="mt-8">
                <Timeline request={request} />
              </div>
            </div>

            <aside className="space-y-6">
              <div className="border border-border bg-surface p-6">
                <h2 className="label-caps">{t("tracking.detailTitle")}</h2>
                <dl className="mt-5 space-y-4">
                  <div>
                    <dt className="label-caps">{t("reclamation.descriptionLabel")}</dt>
                    <dd className="mt-1 text-sm text-foreground/90">{request.description}</dd>
                  </div>
                  {request.symptoms.length > 0 && (
                    <div>
                      <dt className="label-caps">{t("reclamation.symptomsLabel")}</dt>
                      <dd className="mt-2 flex flex-wrap gap-1.5">
                        {request.symptoms.map((s) => (
                          <span
                            key={s}
                            className="border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground"
                            style={{ borderRadius: 2 }}
                          >
                            {t(`symptoms.${s}`)}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}
                  {request.photoUrl && (
                    <div>
                      <dt className="label-caps">{t("reclamation.photoLabel")}</dt>
                      <dd className="mt-2">
                        <img
                          src={request.photoUrl}
                          alt=""
                          className="max-h-64 w-full border border-border object-cover"
                          style={{ borderRadius: 2 }}
                        />
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="border border-border bg-surface p-6">
                <h2 className="label-caps">{t("tracking.contactTitle")}</h2>
                <dl className="mt-5 space-y-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">{t("reclamation.declarantName")}</dt>
                    <dd className="text-foreground">
                      {request.declarantName}
                      {request.declarantFunction ? ` · ${request.declarantFunction}` : ""}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-2">
                    <a href={telHref(request.phone)} className="flex items-center gap-2 hover:text-primary">
                      <Phone className="size-3.5 text-primary" aria-hidden />
                      <span dir="ltr">{request.phone}</span>
                    </a>
                    {request.email && (
                      <a href={`mailto:${request.email}`} className="flex items-center gap-2 hover:text-primary">
                        <Mail className="size-3.5 text-primary" aria-hidden />
                        <span dir="ltr">{request.email}</span>
                      </a>
                    )}
                    <span className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
                      {request.location}
                    </span>
                    {request.availability && (
                      <span className="flex items-start gap-2 text-muted-foreground">
                        <Clock className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
                        {request.availability}
                      </span>
                    )}
                  </div>
                </dl>
              </div>

              <p className="text-xs text-muted-foreground">
                {t("tracking.lastUpdate")}: {formatDate(request.updatedAt, i18n.language, true)}
              </p>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
