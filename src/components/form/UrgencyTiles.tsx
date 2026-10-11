import { useTranslation } from "react-i18next";
import type { Urgency } from "@/types";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Urgency; tone: string; dot: string }[] = [
  { value: "normal", tone: "border-border", dot: "bg-muted-foreground" },
  { value: "urgent", tone: "border-warning", dot: "bg-warning" },
  { value: "critical", tone: "border-destructive", dot: "bg-destructive" },
];

export function UrgencyTiles({
  value,
  onChange,
  invalid,
}: {
  value: Urgency;
  onChange: (v: Urgency) => void;
  invalid?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div role="radiogroup" aria-invalid={invalid} className="grid gap-px border border-border bg-border sm:grid-cols-3">
      {OPTIONS.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex flex-col gap-1.5 bg-surface p-4 text-start transition-colors",
              selected ? "bg-primary/[0.06]" : "hover:bg-background",
            )}
            style={selected ? { boxShadow: `inset 0 -2px 0 0 hsl(var(--primary))` } : undefined}
          >
            <span className="flex items-center gap-2">
              <span className={cn("size-2 rounded-full", o.dot)} aria-hidden />
              <span className="font-medium">{t(`urgency.${o.value}`)}</span>
            </span>
            <span className="text-xs leading-snug text-muted-foreground">
              {t(`urgency.${o.value}Hint`)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
