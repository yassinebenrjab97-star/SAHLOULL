import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { t } = useTranslation();
  const { isDark, toggle } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={t("theme.toggle")}
      title={isDark ? t("theme.light") : t("theme.dark")}
      className="relative overflow-hidden"
    >
      <Sun
        className={`size-4 transition-transform duration-300 ${isDark ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"}`}
        aria-hidden
      />
      <Moon
        className={`absolute size-4 transition-transform duration-300 ${isDark ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}
        aria-hidden
      />
    </Button>
  );
}
