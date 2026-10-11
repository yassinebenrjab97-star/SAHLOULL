import { useTranslation } from "react-i18next";
import { statusMeta, type StatusTone } from "@/lib/status";
import type { RequestStatus } from "@/types";
import { cn } from "@/lib/utils";

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "border-border text-foreground/80",
  warning: "border-warning text-warning",
  info: "border-primary text-primary",
  success: "border-success text-success",
  danger: "border-destructive text-destructive",
};

/** Rubber-stamp style status badge ("RÉPARÉ", "RÉFORMÉ"…). */
export function StatusStamp({
  status,
  className,
  rotate = true,
}: {
  status: RequestStatus;
  className?: string;
  rotate?: boolean;
}) {
  const { t } = useTranslation();
  const tone = statusMeta(status).tone;
  return (
    <span
      className={cn(
        "inline-flex items-center border-2 px-3 py-1 font-mono text-[0.7rem] font-semibold uppercase tracking-wider",
        TONE_CLASS[tone],
        rotate && "-rotate-[1.5deg]",
        className,
      )}
      style={{ borderRadius: 2 }}
    >
      {t(`stamp.${status}`)}
    </span>
  );
}
