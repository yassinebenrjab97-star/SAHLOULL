import { Monitor, PcCase, Printer, QrCode } from "lucide-react";
import { useTranslation } from "react-i18next";
import { EQUIPMENT_TYPES } from "@/lib/constants";
import type { EquipmentType } from "@/types";
import { cn } from "@/lib/utils";

const ICONS = {
  printer: Printer,
  monitor: Monitor,
  "pc-case": PcCase,
  "qr-code": QrCode,
} as const;

export function EquipmentTiles({
  value,
  onChange,
  invalid,
}: {
  value: EquipmentType | "";
  onChange: (v: EquipmentType) => void;
  invalid?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div
      role="radiogroup"
      aria-invalid={invalid}
      className="grid grid-cols-2 gap-px border border-border bg-border"
    >
      {EQUIPMENT_TYPES.map((eq) => {
        const Icon = ICONS[eq.icon];
        const selected = value === eq.value;
        return (
          <button
            key={eq.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(eq.value)}
            className={cn(
              "group relative flex flex-col gap-3 bg-surface p-5 text-start transition-colors",
              selected ? "bg-primary/[0.07]" : "hover:bg-background",
            )}
          >
            <span
              className={cn(
                "grid size-10 place-items-center border transition-colors",
                selected ? "border-primary text-primary" : "border-border text-muted-foreground",
              )}
              style={{ borderRadius: 2 }}
            >
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="flex flex-col gap-1">
              <span className={cn("font-medium", selected && "text-primary")}>
                {t(`equipment.${eq.value}`)}
              </span>
              <span className="text-xs leading-snug text-muted-foreground">
                {t(`equipment.${eq.value === "qr_printer" ? "qr" : eq.value}Hint`)}
              </span>
            </span>
            {selected && (
              <span className="absolute end-4 top-4 font-mono text-[0.65rem] uppercase tracking-wider text-primary">
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
