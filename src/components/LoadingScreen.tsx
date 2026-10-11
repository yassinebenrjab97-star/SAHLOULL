import { useTranslation } from "react-i18next";
import { Logo } from "@/components/Logo";

/**
 * Full-screen loading screen — shows the hospital logo while the app boots.
 * The thin progress bar is an indeterminate animation (no bouncing).
 */
export function LoadingScreen({ leaving = false }: { leaving?: boolean }) {
  const { t } = useTranslation();
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-7 bg-background transition-opacity duration-500 ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="paper-grain pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative flex flex-col items-center gap-5 animate-fade-in">
        <Logo className="h-20 w-20 animate-pulse-soft" />
        <div className="text-center">
          <p className="font-display text-2xl tracking-tight">{t("brand.hospital")}</p>
          <p className="label-caps mt-1.5">{t("brand.department")}</p>
        </div>
      </div>

      <div className="relative h-px w-48 overflow-hidden bg-border" aria-hidden>
        <div className="absolute inset-y-0 w-1/3 animate-[shimmer_1.4s_ease-in-out_infinite] bg-primary" />
      </div>
      <p className="text-xs tracking-wider text-muted-foreground">{t("common.loading")}</p>
    </div>
  );
}
