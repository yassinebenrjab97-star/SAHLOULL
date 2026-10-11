import { useTranslation } from "react-i18next";
import { SYMPTOMS } from "@/lib/constants";
import type { EquipmentType } from "@/types";
import { cn } from "@/lib/utils";

export function SymptomChips({
  equipment,
  value,
  onChange,
}: {
  equipment: EquipmentType;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const { t } = useTranslation();
  const options = SYMPTOMS[equipment] ?? [];

  const toggle = (key: string) =>
    onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key]);

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((key) => {
        const active = value.includes(key);
        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(key)}
            className={cn(
              "border px-3 py-1.5 text-sm transition-colors",
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-surface text-foreground/80 hover:border-foreground/40",
            )}
            style={{ borderRadius: 3 }}
          >
            {t(`symptoms.${key}`)}
          </button>
        );
      })}
    </div>
  );
}
