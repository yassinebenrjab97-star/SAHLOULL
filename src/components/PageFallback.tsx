import { useTranslation } from "react-i18next";

/** Lightweight placeholder shown while a lazily-loaded route chunk arrives. */
export function PageFallback() {
  const { t } = useTranslation();
  return (
    <p className="py-16 text-center text-sm text-muted-foreground animate-pulse-soft" aria-busy="true">
      {t("common.loading")}
    </p>
  );
}
