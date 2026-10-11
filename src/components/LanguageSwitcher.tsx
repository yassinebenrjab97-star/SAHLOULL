import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { LANGUAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { t, i18n } = useTranslation();
  const active = i18n.language.split("-")[0];
  const currentLabel = LANGUAGES.find((l) => l.code === active)?.short ?? "FR";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={compact ? "icon" : "default"}
          aria-label={t("language.select")}
          className="gap-2 px-2"
        >
          <Languages className="size-4" aria-hidden />
          {!compact && <span className="font-mono text-xs tracking-wider">{currentLabel}</span>}
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[13rem] animate-fade-in border border-border bg-surface p-1 shadow-paper"
        >
          <div className="px-2.5 py-2 label-caps">{t("language.label")}</div>
          <DropdownMenu.Separator className="mb-1 h-px bg-border" />
          {LANGUAGES.map((lang) => {
            const isActive = lang.code === active;
            return (
              <DropdownMenu.Item
                key={lang.code}
                onSelect={() => void i18n.changeLanguage(lang.code)}
                dir={lang.dir}
                className={cn(
                  "flex cursor-pointer select-none items-center justify-between gap-3 px-2.5 py-2 text-sm outline-none",
                  "data-[highlighted]:bg-muted",
                  isActive && "text-primary",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <span aria-hidden className="text-base leading-none">
                    {lang.flag}
                  </span>
                  <span className={cn(isActive && "font-medium")}>{lang.label}</span>
                </span>
                {isActive && <Check className="size-3.5 shrink-0" aria-hidden />}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
