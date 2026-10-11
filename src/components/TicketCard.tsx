import { Check, Copy } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { StatusStamp } from "@/components/StatusStamp";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { ServiceRequest } from "@/types";

function Row({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="label-caps">{label}</dt>
      <dd className="text-sm text-foreground" dir={ltr ? "ltr" : undefined}>
        {value}
      </dd>
    </div>
  );
}

/** A ticket-styled card with a perforated tear line — used after submission
 *  and on the tracking page. */
export function TicketCard({
  request,
  showCopy = true,
}: {
  request: ServiceRequest;
  showCopy?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(request.ticketNumber);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = request.ticketNumber;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <article className="cut-tr relative overflow-hidden border border-border bg-surface shadow-paper">
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="label-caps">{t("tracking.ticket")}</p>
            <p
              className="mt-2 font-mono text-3xl font-medium tracking-tight sm:text-4xl"
              dir="ltr"
            >
              {request.ticketNumber}
            </p>
          </div>
          <StatusStamp status={request.status} />
        </div>

        <dl className="mt-7 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <Row label={t("reclamation.sectionService")} value={request.service} />
          <Row label={t("reclamation.sectionEquipment")} value={t(`equipment.${request.equipment}`)} />
          <Row label={t("reclamation.sectionBrand")} value={request.brand} />
          <Row label={t("reclamation.urgencyLabel")} value={t(`urgency.${request.urgency}`)} />
          <Row label={t("common.date")} value={formatDate(request.createdAt, i18n.language)} />
          {request.serial ? <Row label={t("reclamation.serialLabel")} value={request.serial} ltr /> : null}
        </dl>
      </div>

      {/* perforated tear line */}
      <div className="relative flex items-center px-6 pr-6" aria-hidden>
        <span className="absolute -start-3 size-6 rounded-full bg-background" />
        <span className="my-4 h-px flex-1 border-t border-dashed border-border" />
        <span className="absolute -end-3 size-6 rounded-full bg-background" />
      </div>

      <div className="flex flex-col gap-3 p-6 pt-0 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-sm leading-tight">{t("brand.hospital")}</p>
          <p className="label-caps mt-0.5">{t("brand.department")}</p>
        </div>
        {showCopy && (
          <Button type="button" variant={copied ? "secondary" : "outline"} size="sm" onClick={copy}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? t("common.copied") : t("common.copyNumber")}
          </Button>
        )}
      </div>
    </article>
  );
}
